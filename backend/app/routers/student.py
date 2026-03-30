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
    
    # Get learning DNA
    dna_dict = student_profile.learning_dna or {
        "logical": 50.0,
        "verbal": 50.0,
        "creative": 50.0,
        "visual_spatial": 50.0,
        "memory": 50.0,
        "pattern": 50.0,
    }
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

