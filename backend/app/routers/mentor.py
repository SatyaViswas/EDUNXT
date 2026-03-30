"""
app/routers/mentor.py
Mentor portal endpoints:
- GET /mentor/batches: Returns assigned batches and student names
- POST /mentor/update-progress: Update a student's mastery level for a topic
- GET /mentor/guidance: Contextual TARA guidance
"""
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, StudentProfile, MentorProfile, Batch, Assignment, StudentIssue
from app.services.ai_service import (
    get_tara_response_for_role,
    TARGuidance,
    is_gemini_available,
    generate_learning_path,
    generate_batch_roadmap,
)
from app.routers.dependencies import get_current_user, get_current_active_mentor

router = APIRouter(prefix="/mentor", tags=["mentor"])


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS FOR MENTOR ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

class StudentInBatch(BaseModel):
    """Student information for a batch."""
    student_id: uuid.UUID
    name: str
    email: str
    standard: int
    current_streak: int
    learning_dna: Dict[str, float]
    mastery_level: float = 0.0
    is_at_risk: bool = False
    latest_issue_status: Optional[str] = None
    latest_issue_category: Optional[str] = None
    active_issues: List[Dict[str, str]] = Field(default_factory=list)


class StudentProgressPatchRequest(BaseModel):
    mastery_level: float = Field(ge=0, le=100)


class StudentProgressPatchResponse(BaseModel):
    student_id: uuid.UUID
    mastery_level: float
    updated_at: datetime


class BatchDetail(BaseModel):
    """Batch information returned to mentor."""
    batch_id: str
    batch_name: str
    subject: str
    created_at: datetime
    student_count: int
    students: List[StudentInBatch]
    roadmap: Optional[Dict[str, Any]] = None


class MasteryProgressUpdate(BaseModel):
    """Update for a student's topic mastery."""
    student_id: uuid.UUID
    topic: str = Field(min_length=1, max_length=120)
    status: str = Field(description="mastered, learning, or needs_help")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes from mentor")


class MasteryUpdateResponse(BaseModel):
    """Response after updating mastery progress."""
    student_id: uuid.UUID
    topic: str
    status: str
    updated_at: datetime
    message: str


class LearningPathResponse(BaseModel):
    """Roadmap response for mentor-triggered student plan generation."""
    student_id: uuid.UUID
    batch_name: Optional[str] = None
    roadmap: Dict[str, Any]


class BatchRoadmapRequest(BaseModel):
    batch_name: str = Field(min_length=1, max_length=100)


class BatchRoadmapResponse(BaseModel):
    batch_name: str
    student_count: int
    common_grade: int
    avg_dna: Dict[str, float]
    roadmap: Dict[str, Any]


class MentorStatsResponse(BaseModel):
    total_students: int
    active_batches: int
    pending_assignments: int
    open_issues: int
    unresolved_issues: int


class AssignmentCreateRequest(BaseModel):
    batch_name: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=180)
    description: Optional[str] = Field(default=None, max_length=2000)
    due_date: datetime


class AssignmentResponse(BaseModel):
    id: uuid.UUID
    batch_name: str
    title: str
    description: Optional[str]
    due_date: datetime
    created_at: datetime


class RaiseIssueRequest(BaseModel):
    student_id: Optional[uuid.UUID] = None
    category: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=5, max_length=2000)
    severity: str = Field(default="Medium", pattern="^(Low|Medium|High)$")


class StudentIssueResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    mentor_id: uuid.UUID
    category: str
    description: str
    severity: str = "Medium"
    status: str
    created_at: datetime


# ─────────────────────────────────────────────────────────────────────────────
# MIDDLEWARE: Verify Mentor is Approved
# ─────────────────────────────────────────────────────────────────────────────

def verify_mentor_approved(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency: Ensure mentor has APPROVED status.
    Prevents pending mentors from accessing dashboard.
    """
    if current_user.role != "Mentor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mentors can access this endpoint"
        )
    
    # Note: In a real app with a DB session, we'd query the mentor profile here
    # For now, we assume the user object has access to the mentor_profile relationship
    # This will be populated via eager loading or explicit query
    
    return current_user


def _get_approved_mentor_profile(db: Session, mentor_user_id: uuid.UUID) -> MentorProfile:
    mentor_profile = db.query(MentorProfile).filter(
        MentorProfile.user_id == mentor_user_id
    ).first()

    if not mentor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found"
        )

    if mentor_profile.status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mentor account not approved by NGO. Access denied.",
        )

    return mentor_profile


def _normalize_batch_name(raw: str) -> str:
    cleaned = (raw or "").strip()
    return cleaned or "Unassigned"


def _get_or_create_batch(
    db: Session,
    *,
    batch_name: str,
    mentor_id: uuid.UUID,
    default_grade: Optional[int] = None,
) -> Batch:
    normalized_name = _normalize_batch_name(batch_name)
    batch = db.query(Batch).filter(Batch.batch_name == normalized_name).first()
    if batch:
        if not batch.mentor_id:
            batch.mentor_id = mentor_id
        if default_grade and not batch.grade:
            batch.grade = default_grade
        return batch

    batch = Batch(
        batch_name=normalized_name,
        mentor_id=mentor_id,
        grade=default_grade,
    )
    db.add(batch)
    db.flush()
    return batch


# ─────────────────────────────────────────────────────────────────────────────
# GET /mentor/batches
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/batches",
    response_model=List[BatchDetail],
    summary="Get mentor's assigned batches and students"
)
def get_mentor_batches(
    current_user: User = Depends(get_current_active_mentor),
    db: Session = Depends(get_db),
) -> List[BatchDetail]:
    """
    Returns all batches assigned to the mentor along with student information.
    
    **Access**: APPROVED mentors only
    
    **Returns**:
        - List of batches with:
          - batch_id, batch_name, subject, created_at
          - student_count and student details (name, email, standard, streak)
    
    **Logic**:
        - Mentor status must be APPROVED to access
        - If no batches exist, returns empty list
    """
    mentor_batches = (
        db.query(Batch)
        .filter(Batch.mentor_id == current_user.id)
        .order_by(Batch.created_at.desc())
        .all()
    )

    if not mentor_batches:
        return []

    batch_names = [batch.batch_name for batch in mentor_batches if batch.batch_name]
    student_rows = (
        db.query(User, StudentProfile)
        .join(StudentProfile, StudentProfile.user_id == User.id)
        .filter(User.role == "Student", StudentProfile.batch_name.in_(batch_names))
        .order_by(User.full_name.asc())
        .all()
    )

    grouped_students: Dict[str, List[StudentInBatch]] = {batch_name: [] for batch_name in batch_names}
    for student_user, student_profile in student_rows:
        b_name = (student_profile.batch_name or "Unassigned").strip() or "Unassigned"
        grouped_students.setdefault(b_name, []).append(
            StudentInBatch(
                student_id=student_user.id,
                name=student_user.full_name,
                email=student_user.email,
                standard=student_profile.standard,
                current_streak=student_profile.current_streak,
                learning_dna={
                    "logical": float((student_profile.learning_dna or {}).get("logical", 50.0)),
                    "verbal": float((student_profile.learning_dna or {}).get("verbal", 50.0)),
                    "creative": float((student_profile.learning_dna or {}).get("creative", 50.0)),
                    "visual_spatial": float((student_profile.learning_dna or {}).get("visual_spatial", 50.0)),
                    "memory": float((student_profile.learning_dna or {}).get("memory", 50.0)),
                    "pattern": float((student_profile.learning_dna or {}).get("pattern", 50.0)),
                },
            )
        )

    return [
        BatchDetail(
            batch_id=str(batch.id),
            batch_name=batch.batch_name,
            subject=batch.subject or "General",
            created_at=batch.created_at,
            student_count=len(grouped_students.get(batch.batch_name, [])),
            students=grouped_students.get(batch.batch_name, []),
            roadmap=batch.roadmap,
        )
        for batch in mentor_batches
    ]


@router.get(
    "/students",
    response_model=Dict[str, List[StudentInBatch]],
    summary="Get students grouped by batch name"
)
def get_mentor_students(
    current_user: User = Depends(get_current_active_mentor),
    db: Session = Depends(get_db),
) -> Dict[str, List[StudentInBatch]]:
    """Return mentor-owned student roster grouped by StudentProfile.batch_name."""

    mentor_batches = (
        db.query(Batch)
        .filter(Batch.mentor_id == current_user.id)
        .all()
    )
    batch_names = [batch.batch_name for batch in mentor_batches if batch.batch_name]

    if not batch_names:
        return {}

    student_rows_by_batch: Dict[str, List[Any]] = {}
    for batch_name in batch_names:
        student_rows_by_batch[batch_name] = (
            db.query(User, StudentProfile)
            .join(StudentProfile, StudentProfile.user_id == User.id)
            .filter(User.role == "Student", StudentProfile.batch_name == batch_name)
            .order_by(User.full_name.asc())
            .all()
        )

    student_rows: List[Any] = []
    for rows in student_rows_by_batch.values():
        student_rows.extend(rows)

    student_ids = [student_user.id for student_user, _ in student_rows]
    latest_issue_map: Dict[uuid.UUID, StudentIssue] = {}
    active_issue_map: Dict[uuid.UUID, List[StudentIssue]] = {}
    if student_ids:
        latest_issue_subquery = (
            db.query(
                StudentIssue.student_id.label("student_id"),
                func.max(StudentIssue.created_at).label("latest_created_at"),
            )
            .filter(StudentIssue.student_id.in_(student_ids))
            .group_by(StudentIssue.student_id)
            .subquery()
        )
        latest_issues = (
            db.query(StudentIssue)
            .join(
                latest_issue_subquery,
                and_(
                    StudentIssue.student_id == latest_issue_subquery.c.student_id,
                    StudentIssue.created_at == latest_issue_subquery.c.latest_created_at,
                ),
            )
            .all()
        )
        latest_issue_map = {issue.student_id: issue for issue in latest_issues}

        active_issues = (
            db.query(StudentIssue)
            .filter(StudentIssue.student_id.in_(student_ids), StudentIssue.status == "Open")
            .order_by(StudentIssue.created_at.desc())
            .all()
        )
        for issue in active_issues:
            active_issue_map.setdefault(issue.student_id, []).append(issue)

    grouped: Dict[str, List[StudentInBatch]] = {}
    for batch_name in batch_names:
        grouped.setdefault(batch_name, [])
        for student_user, student_profile in student_rows_by_batch.get(batch_name, []):
            dna = student_profile.learning_dna or {}
            logical = float(dna.get("logical", 50.0))
            verbal = float(dna.get("verbal", 50.0))
            creative = float(dna.get("creative", 50.0))
            visual_spatial = float(dna.get("visual_spatial", 50.0))
            memory = float(dna.get("memory", 50.0))
            pattern = float(dna.get("pattern", 50.0))

            avg_dna = (logical + verbal + creative + visual_spatial + memory + pattern) / 6.0
            mastery_level = float(dna.get("mastery_level", round(avg_dna, 2)))
            has_active_issues = len(active_issue_map.get(student_user.id, [])) > 0
            is_at_risk = bool(student_profile.current_streak <= 1 or avg_dna < 45 or has_active_issues)

            grouped[batch_name].append(
                StudentInBatch(
                    student_id=student_user.id,
                    name=student_user.full_name,
                    email=student_user.email,
                    standard=student_profile.standard,
                    current_streak=student_profile.current_streak,
                    learning_dna={
                        "logical": logical,
                        "verbal": verbal,
                        "creative": creative,
                        "visual_spatial": visual_spatial,
                        "memory": memory,
                        "pattern": pattern,
                    },
                    mastery_level=mastery_level,
                    is_at_risk=is_at_risk,
                    latest_issue_status=latest_issue_map.get(student_user.id).status if latest_issue_map.get(student_user.id) else None,
                    latest_issue_category=latest_issue_map.get(student_user.id).issue_type if latest_issue_map.get(student_user.id) else None,
                    active_issues=[
                        {
                            "id": str(issue.id),
                            "description": issue.description,
                            "severity": "Medium",
                        }
                        for issue in active_issue_map.get(student_user.id, [])
                    ],
                )
            )

    return grouped


@router.patch(
    "/student/{student_id}/progress",
    response_model=StudentProgressPatchResponse,
    summary="Patch student mastery level"
)
def patch_student_progress(
    student_id: uuid.UUID,
    payload: StudentProgressPatchRequest,
    current_user: User = Depends(get_current_active_mentor),
    db: Session = Depends(get_db),
) -> StudentProgressPatchResponse:
    mentor_batches = db.query(Batch).filter(Batch.mentor_id == current_user.id).all()
    batch_names = [batch.batch_name for batch in mentor_batches if batch.batch_name]
    if not batch_names:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No assigned batches found for mentor")

    student_profile = (
        db.query(StudentProfile)
        .filter(StudentProfile.user_id == student_id)
        .first()
    )

    if not student_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    student_batch_name = _normalize_batch_name(student_profile.batch_name or "")
    if student_batch_name not in batch_names:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student is not in your assigned batches")

    dna = dict(student_profile.learning_dna or {})
    dna["mastery_level"] = float(payload.mastery_level)
    student_profile.learning_dna = dna
    db.add(student_profile)
    db.commit()
    db.refresh(student_profile)

    return StudentProgressPatchResponse(
        student_id=student_id,
        mastery_level=float((student_profile.learning_dna or {}).get("mastery_level", payload.mastery_level)),
        updated_at=datetime.now(timezone.utc),
    )


@router.post(
    "/generate-batch-path",
    response_model=BatchRoadmapResponse,
    summary="Generate and persist full-term AI roadmap for an entire batch"
)
def generate_batch_path(
    payload: BatchRoadmapRequest,
    current_user: User = Depends(verify_mentor_approved),
    db: Session = Depends(get_db),
) -> BatchRoadmapResponse:
    _get_approved_mentor_profile(db, current_user.id)

    normalized_batch = _normalize_batch_name(payload.batch_name)
    if normalized_batch.lower() == "unassigned":
        batch_filter = StudentProfile.batch_name.is_(None)
    else:
        batch_filter = StudentProfile.batch_name == normalized_batch

    student_profiles = db.query(StudentProfile).filter(batch_filter).all()
    if not student_profiles and normalized_batch.lower() == "unassigned":
        student_profiles = db.query(StudentProfile).filter(StudentProfile.batch_name == "Unassigned").all()

    if not student_profiles:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No students found in batch '{payload.batch_name}'"
        )

    dna_keys = ["logical", "verbal", "creative", "visual_spatial", "memory", "pattern"]
    avg_dna: Dict[str, float] = {}
    for key in dna_keys:
        total = sum(float((profile.learning_dna or {}).get(key, 50.0)) for profile in student_profiles)
        avg_dna[key] = round(total / len(student_profiles), 2)

    grade_counts: Dict[int, int] = {}
    for profile in student_profiles:
        grade_counts[profile.standard] = grade_counts.get(profile.standard, 0) + 1
    common_grade = max(grade_counts.items(), key=lambda item: item[1])[0]

    batch_record = _get_or_create_batch(
        db,
        batch_name=normalized_batch,
        mentor_id=current_user.id,
        default_grade=common_grade,
    )

    if batch_record.roadmap:
        return BatchRoadmapResponse(
            batch_name=normalized_batch,
            student_count=len(student_profiles),
            common_grade=batch_record.grade or common_grade,
            avg_dna=avg_dna,
            roadmap=batch_record.roadmap,
        )

    duration_weeks = batch_record.duration_weeks
    if not duration_weeks and batch_record.syllabus_end_date:
        now_utc = datetime.now(timezone.utc)
        remaining_days = (batch_record.syllabus_end_date - now_utc).days
        duration_weeks = max(1, (remaining_days + 6) // 7)
    if not duration_weeks:
        duration_weeks = 16

    roadmap = generate_batch_roadmap(
        avg_dna=avg_dna,
        common_grade=str(common_grade),
        duration_weeks=duration_weeks,
    )
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Batch roadmap generation is temporarily unavailable. Please try again shortly."
        )

    batch_record.roadmap = roadmap
    if not batch_record.grade:
        batch_record.grade = common_grade
    if not batch_record.duration_weeks:
        batch_record.duration_weeks = duration_weeks
    db.add(batch_record)
    db.commit()

    return BatchRoadmapResponse(
        batch_name=normalized_batch,
        student_count=len(student_profiles),
        common_grade=batch_record.grade or common_grade,
        avg_dna=avg_dna,
        roadmap=roadmap,
    )


@router.get(
    "/stats",
    response_model=MentorStatsResponse,
    summary="Get live mentor dashboard stats"
)
def get_mentor_stats(
    current_user: User = Depends(get_current_active_mentor),
    db: Session = Depends(get_db),
) -> MentorStatsResponse:
    mentor_batches = (
        db.query(Batch)
        .filter(Batch.mentor_id == current_user.id)
        .all()
    )
    batch_names = [batch.batch_name for batch in mentor_batches if batch.batch_name]

    if not batch_names:
        return MentorStatsResponse(
            total_students=0,
            active_batches=0,
            pending_assignments=0,
            open_issues=0,
            unresolved_issues=0,
        )

    total_students = (
        db.query(func.count(StudentProfile.id))
        .filter(StudentProfile.batch_name.in_(batch_names))
        .scalar()
        or 0
    )
    active_batches = (
        db.query(func.count(Batch.id))
        .filter(Batch.mentor_id == current_user.id)
        .scalar()
        or 0
    )
    now_utc = datetime.now(timezone.utc)
    pending_assignments = (
        db.query(func.count(Assignment.id))
        .filter(Assignment.mentor_id == current_user.id, Assignment.due_date >= now_utc)
        .scalar()
        or 0
    )
    open_issues = (
        db.query(func.count(StudentIssue.id))
        .filter(StudentIssue.status == "Open", StudentIssue.mentor_id == current_user.id)
        .scalar()
        or 0
    )

    return MentorStatsResponse(
        total_students=int(total_students),
        active_batches=int(active_batches),
        pending_assignments=int(pending_assignments),
        open_issues=int(open_issues),
        unresolved_issues=int(open_issues),
    )


@router.post(
    "/assignments",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create assignment for a batch"
)
def create_assignment(
    payload: AssignmentCreateRequest,
    current_user: User = Depends(get_current_active_mentor),
    db: Session = Depends(get_db),
) -> AssignmentResponse:
    batch = _get_or_create_batch(
        db,
        batch_name=payload.batch_name,
        mentor_id=current_user.id,
    )

    assignment = Assignment(
        batch_name=batch.batch_name,
        mentor_id=current_user.id,
        title=payload.title.strip(),
        description=(payload.description or "").strip() or None,
        due_date=payload.due_date,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return AssignmentResponse(
        id=assignment.id,
        batch_name=assignment.batch_name,
        title=assignment.title,
        description=assignment.description,
        due_date=assignment.due_date,
        created_at=assignment.created_at,
    )


@router.post(
    "/students/{student_id}/issue",
    response_model=StudentIssueResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Raise issue for a student"
)
def raise_student_issue(
    student_id: uuid.UUID,
    payload: RaiseIssueRequest,
    current_user: User = Depends(get_current_active_mentor),
    db: Session = Depends(get_db),
) -> StudentIssueResponse:
    student_user = db.query(User).filter(User.id == student_id, User.role == "Student").first()
    if not student_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    issue = StudentIssue(
        student_id=student_id,
        mentor_id=current_user.id,
        issue_type=payload.category.strip(),
        description=payload.description.strip(),
        status="Open",
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)

    return StudentIssueResponse(
        id=issue.id,
        student_id=issue.student_id,
        mentor_id=issue.mentor_id,
        category=issue.issue_type,
        description=issue.description,
        severity="Medium",
        status=issue.status,
        created_at=issue.created_at,
    )


@router.post(
    "/raise-issue",
    response_model=StudentIssueResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Raise issue for a student"
)
def raise_issue(
    payload: RaiseIssueRequest,
    current_user: User = Depends(get_current_active_mentor),
    db: Session = Depends(get_db),
) -> StudentIssueResponse:
    if not payload.student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="student_id is required",
        )

    student_user = db.query(User).filter(User.id == payload.student_id, User.role == "Student").first()
    if not student_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    issue = StudentIssue(
        student_id=payload.student_id,
        mentor_id=current_user.id,
        issue_type=payload.category.strip(),
        description=payload.description.strip(),
        status="Open",
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)

    return StudentIssueResponse(
        id=issue.id,
        student_id=issue.student_id,
        mentor_id=issue.mentor_id,
        category=issue.issue_type,
        description=issue.description,
        severity="Medium",
        status=issue.status,
        created_at=issue.created_at,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /mentor/update-progress
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/update-progress",
    response_model=MasteryUpdateResponse,
    summary="Update student mastery level"
)
def update_student_progress(
    request: MasteryProgressUpdate,
    current_user: User = Depends(verify_mentor_approved),
    db: Session = Depends(get_db),
) -> MasteryUpdateResponse:
    """
    Update a student's mastery level for a specific topic.
    Mentors use this to track student progress and adapt teaching.
    
    **Access**: APPROVED mentors only
    
    **Request body**:
        - student_id: UUID of the student
        - topic: Topic name (e.g., "Quadratic Equations")
        - status: "mastered", "learning", or "needs_help"
        - notes: Optional mentoring notes
    
    **Returns**:
        - Confirmation of the update with timestamp
    
    **Validations**:
        - Mentor must be APPROVED
        - Student must exist in the system
        - Mentor can only update students in their batches (future: implement batch-student relationship)
    """
    _get_approved_mentor_profile(db, current_user.id)
    
    # Verify student exists
    student_user = db.query(User).filter(User.id == request.student_id).first()
    if not student_user or student_user.role != "Student":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    student_profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == request.student_id
    ).first()
    
    if not student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )
    
    # TODO: Create/update a MasteryLog entry
    # For now, return a placeholder response
    # Example future query:
    # mastery_log = db.query(MasteryLog).filter(
    #     MasteryLog.student_id == request.student_id,
    #     MasteryLog.topic == request.topic
    # ).first()
    # if mastery_log:
    #     mastery_log.status = request.status
    #     mastery_log.updated_at = datetime.utcnow()
    # else:
    #     mastery_log = MasteryLog(...)
    # db.add(mastery_log)
    # db.commit()
    
    now = datetime.utcnow()
    
    return MasteryUpdateResponse(
        student_id=request.student_id,
        topic=request.topic,
        status=request.status,
        updated_at=now,
        message=f"Progress updated: {student_user.full_name} marked '{request.topic}' as {request.status}",
    )


@router.post(
    "/generate-path/{student_id}",
    response_model=LearningPathResponse,
    summary="Generate AI learning roadmap for a student"
)
def generate_student_path(
    student_id: uuid.UUID,
    current_user: User = Depends(verify_mentor_approved),
    db: Session = Depends(get_db),
) -> LearningPathResponse:
    """Generate a 4-week roadmap using student DNA and grade level."""
    _get_approved_mentor_profile(db, current_user.id)

    student_user = db.query(User).filter(
        User.id == student_id,
        User.role == "Student"
    ).first()
    if not student_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    student_profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == student_id
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

    roadmap = generate_learning_path(student_dna=student_dna, level=str(student_profile.standard))
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Learning path generation is temporarily unavailable. Please try again shortly."
        )

    return LearningPathResponse(
        student_id=student_id,
        batch_name=student_profile.batch_name,
        roadmap=roadmap,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /mentor/profile
# ─────────────────────────────────────────────────────────────────────────────

from app.schemas.user import MentorProfileResponse


@router.get(
    "/profile",
    response_model=MentorProfileResponse,
    summary="Get mentor profile"
)
def get_mentor_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MentorProfileResponse:
    """
    Returns the current mentor's profile with approval status.
    Useful for checking vetting status and impact metrics.
    
    **Access**: Mentors only
    """
    if current_user.role != "Mentor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mentors can access their profile"
        )
    
    mentor_profile = db.query(MentorProfile).filter(
        MentorProfile.user_id == current_user.id
    ).first()
    
    if not mentor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found"
        )
    
    return MentorProfileResponse.model_validate(mentor_profile)


# ─────────────────────────────────────────────────────────────────────────────
# GET /mentor/guidance
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/guidance",
    response_model=Optional[TARGuidance],
    summary="Get contextual TARA guidance"
)
def get_mentor_guidance(
    current_user: User = Depends(get_current_user),
    page: str = "profile",
    db: Session = Depends(get_db),
) -> Optional[TARGuidance]:
    """
    Get contextual guidance from TARA for mentor portal.
    Provides role-specific tips and best practices.
    
    **Access**: Mentors only
    
    **Query parameters**:
        - page: Current page identifier
          - "profile": Mentor profile and approval status
          - "batches": View assigned student batches
          - "update-progress": Update student mastery levels
          - "impact-score": View mentor impact metrics
    
    **Returns**:
        - Guidance title, message, key actions, tips
        - None if TARA unavailable
    """
    if current_user.role != "Mentor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mentors can request guidance"
        )
    
    # Valid mentor pages
    valid_pages = ["profile", "batches", "update-progress", "impact-score"]
    if page not in valid_pages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid page. Must be one of: {', '.join(valid_pages)}"
        )
    
    # Get mentor context
    mentor_profile = db.query(MentorProfile).filter(
        MentorProfile.user_id == current_user.id
    ).first()
    
    context = {
        "mentor_status": mentor_profile.status if mentor_profile else "UNKNOWN",
        "total_students": mentor_profile.total_students if mentor_profile else 0,
        "total_batches": mentor_profile.total_batches if mentor_profile else 0,
        "exam_score": mentor_profile.exam_score if mentor_profile else None,
    }
    
    # Fetch guidance from TARA
    guidance = get_tara_response_for_role("Mentor", page, context)
    
    if not guidance and is_gemini_available():
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"TARA guidance generation failed for mentor {current_user.id} on page {page}")
    
    return guidance
