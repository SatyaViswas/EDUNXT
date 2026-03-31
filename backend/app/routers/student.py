"""
app/routers/student.py
Student portal endpoints:
- GET /student/dna: Returns learning DNA (strengths/weaknesses)
- POST /student/career-logic: AI-powered stream recommendations via TARA
- GET /student/guidance: Contextual TARA guidance for student portal
"""
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import (
    User,
    StudentProfile,
    UserBadge,
    Batch,
    Assignment,
    StudentIssue,
    AssignmentSubmission,
)
from app.schemas.user import LearningDNA
from app.services.ai_service import (
    get_career_recommendations,
    get_fallback_career_recommendation,
    get_student_guidance as get_student_guidance_ai,
    get_student_answer,
    generate_learning_path,
    CareerRecommendationResponse,
    TARGuidance,
    is_gemini_available,
)
from app.routers.dependencies import get_current_user

router = APIRouter(prefix="/student", tags=["student"])


class StudentAskRequest(BaseModel):
    question: str
    page: str = "dashboard"


class StudentDashboardStatsResponse(BaseModel):
    xp: int
    streak: int
    badges: list[str]


class StudentAssignmentItem(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    due_date: datetime
    batch_name: str


class StudentNotificationItem(BaseModel):
    id: uuid.UUID
    issue_type: str
    description: str
    status: str
    created_at: datetime
    alert_text: str


class StudentDashboardDataResponse(BaseModel):
    stats: StudentDashboardStatsResponse
    roadmap: Optional[dict[str, Any]] = None
    assignments: list[StudentAssignmentItem]
    notifications: list[StudentNotificationItem]


class AssignmentSubmitRequest(BaseModel):
    assignment_id: uuid.UUID
    response_text: str


class AssignmentSubmitResponse(BaseModel):
    submission_id: uuid.UUID
    assignment_id: uuid.UUID
    student_id: uuid.UUID
    created_at: datetime


class CareerRecommendationItem(BaseModel):
    stream: str
    display_name: str
    match_score: int
    description: str
    syllabus_overview: str
    trial_label: str
    trial_url: str
    why: str


class CareerRecommendationsRealtimeResponse(BaseModel):
    standard: int
    stage: str
    tara_advice: str
    coming_soon: bool = False
    recommendations: list[CareerRecommendationItem]


HIGH_SCHOOL_STREAMS = [
    {
        "key": "MPC",
        "display_name": "MPC (Maths, Physics, Chemistry)",
        "description": "Strong fit for analytical and quantitative problem solving.",
        "syllabus_overview": "Core focus on algebra, physics fundamentals, chemistry, and problem-solving drills.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://www.khanacademy.org/math",
        "why": "Best for students with high logical and pattern-recognition strengths.",
        "weights": {
            "logical": 0.34,
            "pattern": 0.24,
            "visual_spatial": 0.16,
            "memory": 0.10,
            "verbal": 0.08,
            "creative": 0.08,
        },
    },
    {
        "key": "BiPC",
        "display_name": "BiPC (Biology, Physics, Chemistry)",
        "description": "Aligned for medicine, life sciences, and healthcare-oriented tracks.",
        "syllabus_overview": "Biology-heavy coursework with physics and chemistry for NEET-ready foundations.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://www.khanacademy.org/science/biology",
        "why": "Works well for memory retention and concept integration in life sciences.",
        "weights": {
            "memory": 0.28,
            "verbal": 0.12,
            "creative": 0.12,
            "logical": 0.16,
            "pattern": 0.10,
            "visual_spatial": 0.22,
        },
    },
    {
        "key": "CEC",
        "display_name": "CEC (Commerce, Economics, Civics)",
        "description": "Great for finance, business, and management pathways.",
        "syllabus_overview": "Business math, economics basics, accounting principles, and communication-heavy assessments.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://www.khanacademy.org/economics-finance-domain",
        "why": "A fit for strong verbal reasoning with steady memory and strategic thinking.",
        "weights": {
            "verbal": 0.34,
            "memory": 0.18,
            "creative": 0.16,
            "logical": 0.12,
            "pattern": 0.10,
            "visual_spatial": 0.10,
        },
    },
    {
        "key": "HEC",
        "display_name": "HEC (History, Economics, Civics)",
        "description": "Useful for social sciences, policy, and humanities-driven careers.",
        "syllabus_overview": "Narrative-heavy social science modules, analysis of history and governance, and essay writing.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://www.khanacademy.org/humanities/world-history",
        "why": "Suited to students who excel in verbal and creative synthesis.",
        "weights": {
            "verbal": 0.30,
            "creative": 0.24,
            "memory": 0.18,
            "logical": 0.10,
            "pattern": 0.08,
            "visual_spatial": 0.10,
        },
    },
]

UNDERGRAD_STREAMS = [
    {
        "key": "CSE",
        "display_name": "CSE (Computer Science Engineering)",
        "description": "Strong option for coding, algorithms, and software systems.",
        "syllabus_overview": "Programming fundamentals, data structures, web development, and problem-solving labs.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://www.khanacademy.org/computing/computer-science",
        "why": "Ideal for high logical and pattern recognition DNA.",
        "weights": {
            "logical": 0.34,
            "pattern": 0.24,
            "memory": 0.12,
            "visual_spatial": 0.16,
            "verbal": 0.06,
            "creative": 0.08,
        },
    },
    {
        "key": "ECE",
        "display_name": "ECE (Electronics & Communication Engineering)",
        "description": "Balanced track across circuits, communication systems, and embedded tech.",
        "syllabus_overview": "Circuit analysis, signal processing, communication systems, and embedded mini-projects.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://www.khanacademy.org/science/electrical-engineering",
        "why": "Good fit for logical + visual-spatial strengths.",
        "weights": {
            "logical": 0.28,
            "visual_spatial": 0.24,
            "pattern": 0.16,
            "memory": 0.12,
            "verbal": 0.08,
            "creative": 0.12,
        },
    },
    {
        "key": "Mechanical",
        "display_name": "Mechanical Engineering",
        "description": "Core engineering route for mechanics, design, and manufacturing.",
        "syllabus_overview": "Engineering mechanics, thermodynamics, machine design, and workshop-based projects.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://www.khanacademy.org/science/physics",
        "why": "Recommended for strong spatial and pattern-based thinking.",
        "weights": {
            "visual_spatial": 0.30,
            "logical": 0.22,
            "pattern": 0.18,
            "memory": 0.12,
            "creative": 0.12,
            "verbal": 0.06,
        },
    },
    {
        "key": "Civils",
        "display_name": "Civil Engineering",
        "description": "Suitable for infrastructure, planning, and structural design careers.",
        "syllabus_overview": "Structural basics, surveying, materials, and planning-focused civil design modules.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://nptel.ac.in/courses",
        "why": "Fits students with visual reasoning and practical problem-solving.",
        "weights": {
            "visual_spatial": 0.28,
            "logical": 0.22,
            "memory": 0.16,
            "pattern": 0.14,
            "creative": 0.12,
            "verbal": 0.08,
        },
    },
    {
        "key": "Degree",
        "display_name": "Degree (B.Com / BBA / BA)",
        "description": "Flexible undergraduate option for commerce, management, and social sciences.",
        "syllabus_overview": "Domain electives in finance, business communication, economics, and applied projects.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://www.coursera.org/browse/business",
        "why": "Strong route for verbal, memory, and communication-oriented learners.",
        "weights": {
            "verbal": 0.34,
            "memory": 0.20,
            "creative": 0.16,
            "logical": 0.12,
            "pattern": 0.08,
            "visual_spatial": 0.10,
        },
    },
]


def _get_learning_dna_from_profile(student_profile: StudentProfile) -> dict[str, float]:
    """Read DNA from explicit columns first, then fallback to legacy JSON."""
    dna_json = student_profile.learning_dna or {}

    def pick(field_name: str) -> float:
        explicit_value = getattr(student_profile, field_name, None)
        if explicit_value is not None:
            return float(explicit_value)
        return float(dna_json.get(field_name, 0.0))

    return {
        "logical": pick("logical"),
        "verbal": pick("verbal"),
        "creative": pick("creative"),
        "visual_spatial": pick("visual_spatial"),
        "memory": pick("memory"),
        "pattern": pick("pattern"),
    }


def _score_stream(dna: dict[str, float], weights: dict[str, float]) -> int:
    score = 0.0
    for key, weight in weights.items():
        score += float(dna.get(key, 0.0)) * float(weight)
    score = max(0.0, min(100.0, score))
    return int(round(score))


def _load_career_path_glance(db: Session) -> dict[str, dict[str, str]]:
    """Fetch optional glance metadata from career_paths table if available."""
    try:
        rows = db.execute(text("SELECT * FROM career_paths")).mappings().all()
    except SQLAlchemyError:
        return {}

    glance: dict[str, dict[str, str]] = {}

    for row in rows:
        stream_name = (
            row.get("stream")
            or row.get("stream_name")
            or row.get("name")
            or row.get("path_name")
            or ""
        )
        stream_key = str(stream_name).strip().upper()
        if not stream_key:
            continue

        glance[stream_key] = {
            "display_name": str(
                row.get("display_name")
                or row.get("title")
                or row.get("stream_name")
                or row.get("stream")
                or stream_key
            ),
            "description": str(
                row.get("description")
                or row.get("summary")
                or ""
            ),
            "trial_label": str(
                row.get("trial_label")
                or "Start 5-Minute Trial"
            ),
            "trial_url": str(
                row.get("trial_url")
                or row.get("sample_lesson")
                or row.get("sample_lesson_url")
                or row.get("lesson_url")
                or ""
            ),
            "syllabus_overview": str(
                row.get("syllabus_overview")
                or row.get("syllabus")
                or row.get("overview")
                or ""
            ),
        }

    return glance


def _stage_for_standard(standard: int) -> str:
    return "HighSchool" if 8 <= standard <= 10 else "Undergrad"


@router.get(
    "/career-recommendations",
    response_model=CareerRecommendationsRealtimeResponse,
    summary="Get real-time grade-specific career recommendations"
)
def get_realtime_career_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CareerRecommendationsRealtimeResponse:
    if current_user.role != "Student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access career recommendations"
        )

    student_profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == current_user.id
    ).first()

    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )

    standard = int(student_profile.standard or 0)

    if standard < 8:
        return CareerRecommendationsRealtimeResponse(
            standard=standard,
            stage="HighSchool",
            tara_advice=f"Since you are in Grade {standard}, you should start looking at HighSchool options.",
            coming_soon=True,
            recommendations=[],
        )

    stage = _stage_for_standard(standard)
    candidates = HIGH_SCHOOL_STREAMS if stage == "HighSchool" else UNDERGRAD_STREAMS
    dna = _get_learning_dna_from_profile(student_profile)
    glance_map = _load_career_path_glance(db)

    recommendations: list[CareerRecommendationItem] = []
    for candidate in candidates:
        stream_key = str(candidate["key"]).upper()
        glance = glance_map.get(stream_key, {})

        recommendations.append(
            CareerRecommendationItem(
                stream=stream_key,
                display_name=str(glance.get("display_name") or candidate["display_name"]),
                match_score=_score_stream(dna, candidate["weights"]),
                description=str(glance.get("description") or candidate["description"]),
                syllabus_overview=str(glance.get("syllabus_overview") or candidate["syllabus_overview"]),
                trial_label=str(glance.get("trial_label") or candidate["trial_label"]),
                trial_url=str(glance.get("trial_url") or candidate["trial_url"]),
                why=str(candidate["why"]),
            )
        )

    recommendations.sort(key=lambda item: item.match_score, reverse=True)

    return CareerRecommendationsRealtimeResponse(
        standard=standard,
        stage=stage,
        tara_advice=f"Since you are in Grade {standard}, you should start looking at {stage} options.",
        coming_soon=False,
        recommendations=recommendations,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /student/dna
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/dna", response_model=LearningDNA, summary="Get student learning DNA")
def get_learning_dna(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LearningDNA:
    """
    Returns the student's learning DNA profile (6 cognitive dimensions).
    
    **Access**: Students only
    
    **Returns**:
        - logical, verbal, creative, visual_spatial, memory, pattern (each 0-100)
    """
    if current_user.role != "Student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access their learning DNA"
        )
    
    student_profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == current_user.id
    ).first()
    
    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )
    
    dna_dict = _get_learning_dna_from_profile(student_profile)
    
    return LearningDNA(**dna_dict)


@router.get("/profile", response_model=LearningDNA, summary="Get student profile DNA")
def get_student_profile_dna(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LearningDNA:
    """
    Backward-compatible alias for learning DNA data.

    Returns the same 6 real-time DNA dimensions as /student/dna for the
    currently authenticated student.
    """
    return get_learning_dna(current_user=current_user, db=db)


@router.get(
    "/dashboard-stats",
    response_model=StudentDashboardStatsResponse,
    summary="Get live student dashboard stats"
)
def get_student_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudentDashboardStatsResponse:
    if current_user.role != "Student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access dashboard stats"
        )

    student_profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == current_user.id
    ).first()

    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )

    xp_value = int(getattr(student_profile, "xp", None) or getattr(student_profile, "total_xp", 0) or 0)
    streak_value = int(getattr(student_profile, "streak", None) or getattr(student_profile, "current_streak", 0) or 0)

    earned_badges = (
        db.query(UserBadge)
        .filter(UserBadge.user_id == current_user.id)
        .order_by(UserBadge.earned_at.desc())
        .all()
    )

    return StudentDashboardStatsResponse(
        xp=xp_value,
        streak=streak_value,
        badges=[badge.badge_name for badge in earned_badges],
    )


@router.get(
    "/dashboard-data",
    response_model=StudentDashboardDataResponse,
    summary="Get combined student dashboard data"
)
def get_student_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudentDashboardDataResponse:
    if current_user.role != "Student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access dashboard data"
        )

    student_profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == current_user.id
    ).first()
    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )

    xp_value = int(getattr(student_profile, "xp", None) or getattr(student_profile, "total_xp", 0) or 0)
    streak_value = int(getattr(student_profile, "streak", None) or getattr(student_profile, "current_streak", 0) or 0)

    earned_badges = (
        db.query(UserBadge)
        .filter(UserBadge.user_id == current_user.id)
        .order_by(UserBadge.earned_at.desc())
        .all()
    )

    batch_name = (student_profile.batch_name or "").strip()
    batch = db.query(Batch).filter(Batch.batch_name == batch_name).first() if batch_name else None
    roadmap = batch.roadmap if batch else None

    assignments: list[StudentAssignmentItem] = []
    if batch_name:
        assignment_rows = (
            db.query(Assignment)
            .filter(Assignment.batch_name == batch_name)
            .order_by(Assignment.due_date.asc())
            .all()
        )
        assignments = [
            StudentAssignmentItem(
                id=row.id,
                title=row.title,
                description=row.description,
                due_date=row.due_date,
                batch_name=row.batch_name,
            )
            for row in assignment_rows
        ]

    issue_rows = (
        db.query(StudentIssue)
        .filter(StudentIssue.student_id == current_user.id, StudentIssue.status == "Open")
        .order_by(StudentIssue.created_at.desc())
        .all()
    )
    notifications = [
        StudentNotificationItem(
            id=issue.id,
            issue_type=issue.issue_type,
            description=issue.description,
            status=issue.status,
            created_at=issue.created_at,
            alert_text=f"Mentor flagged: {issue.description}",
        )
        for issue in issue_rows
    ]

    return StudentDashboardDataResponse(
        stats=StudentDashboardStatsResponse(
            xp=xp_value,
            streak=streak_value,
            badges=[badge.badge_name for badge in earned_badges],
        ),
        roadmap=roadmap,
        assignments=assignments,
        notifications=notifications,
    )


@router.post(
    "/submit-assignment",
    response_model=AssignmentSubmitResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit assignment response"
)
def submit_assignment_response(
    payload: AssignmentSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AssignmentSubmitResponse:
    if current_user.role != "Student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit assignments"
        )

    response_text = (payload.response_text or "").strip()
    if len(response_text) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Response must be at least 3 characters"
        )

    student_profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == current_user.id
    ).first()
    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )

    assignment = db.query(Assignment).filter(Assignment.id == payload.assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    student_batch_name = (student_profile.batch_name or "").strip()
    if student_batch_name != assignment.batch_name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Assignment does not belong to your batch"
        )

    submission = AssignmentSubmission(
        assignment_id=assignment.id,
        student_id=current_user.id,
        response_text=response_text,
        created_at=datetime.now(timezone.utc),
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return AssignmentSubmitResponse(
        submission_id=submission.id,
        assignment_id=submission.assignment_id,
        student_id=submission.student_id,
        created_at=submission.created_at,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /student/career-logic
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/career-logic",
    response_model=CareerRecommendationResponse,
    summary="Get AI-powered career stream recommendations"
)
def get_career_recommendations_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CareerRecommendationResponse:
    """
    Analyzes student's learning DNA and provides stream recommendations.
    Uses Google Gemini 3.1 Pro for deep analysis.
    
    **Access**: Students only (grades 8-12)
    
    **Returns**:
        - Recommended streams (primary + secondary options)
        - Confidence levels and detailed reasoning
        - Cognitive profile summary
        - Next steps for the student
    """
    if current_user.role != "Student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access career recommendations"
        )
    
    student_profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == current_user.id
    ).first()
    
    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )
    
    # Only available for grades 8-12
    if student_profile.standard < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Career stream recommendations available from Grade 8 onwards"
        )
    
    # Get learning DNA from explicit columns first (real-time), then legacy JSON
    dna_dict = _get_learning_dna_from_profile(student_profile)
    dna = LearningDNA(**dna_dict)
    
    # Try Gemini API first, fallback to heuristic if unavailable
    if is_gemini_available():
        recommendation = get_career_recommendations(
            learning_dna=dna,
            standard=student_profile.standard,
            student_name=current_user.full_name,
        )
        
        if recommendation:
            return recommendation
    
    # Fallback to heuristic-based recommendation
    return get_fallback_career_recommendation(dna, student_profile.standard)


# ─────────────────────────────────────────────────────────────────────────────
# GET /student/guidance
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/guidance",
    response_model=Optional[TARGuidance],
    summary="Get contextual TARA guidance"
)
def get_student_guidance(
    current_user: User = Depends(get_current_user),
    page: str = Query("dashboard"),
) -> Optional[TARGuidance]:
    """
    Get contextual guidance from TARA (Teach, Advise, Recommend, Assist).
    Provides role-specific tips and actionable advice.
    
    **Access**: Students only
    
    **Query parameters**:
        - page: Current page identifier
          - "dashboard": Main student dashboard
          - "learning-dna": Learning DNA profile page
          - "career-logic": Career recommendations page
          - "daily-missions": Daily tasks page
    
    **Returns**:
        - Guidance title, message, key actions, tips
        - None if TARA unavailable
    
    **Example**:
        GET /student/guidance?page=career-logic
    """
    if current_user.role != "Student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can request guidance"
        )

    print(f"Request received for page: {page}")
    
    # Valid student pages
    valid_pages = ["dashboard", "learning-dna", "career-logic", "daily-missions"]
    if page not in valid_pages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid page. Must be one of: {', '.join(valid_pages)}"
        )
    
    # Fetch page-specific guidance from TARA
    guidance = get_student_guidance_ai(current_user, page)
    
    if not guidance and is_gemini_available():
        # If TARA fails but Gemini is available, log the issue
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"TARA guidance generation failed for student {current_user.id} on page {page}")
    
    return guidance


@router.post("/ask", summary="Ask TARA a student question")
def ask_tara_student(
    payload: StudentAskRequest,
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    if current_user.role != "Student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can ask student guidance questions"
        )

    valid_pages = ["dashboard", "learning-dna", "career-logic", "daily-missions"]
    if payload.page not in valid_pages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid page. Must be one of: {', '.join(valid_pages)}"
        )

    answer = get_student_answer(current_user, payload.page, payload.question)
    return {"answer": answer}


@router.post("/learning-path", summary="Generate 4-week personalized learning roadmap")
def generate_student_learning_path(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Generate a 4-week roadmap based on the student's stored Learning DNA and grade.
    """
    if current_user.role != "Student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can generate a learning path"
        )

    student_profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == current_user.id
    ).first()

    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )

    student_dna = student_profile.learning_dna or {
        "logical": 50.0,
        "verbal": 50.0,
        "creative": 50.0,
        "visual_spatial": 50.0,
        "memory": 50.0,
        "pattern": 50.0,
    }
    level = str(student_profile.standard)

    roadmap = generate_learning_path(student_dna, level)
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Learning path generation is temporarily unavailable. Please try again shortly."
        )

    return roadmap

