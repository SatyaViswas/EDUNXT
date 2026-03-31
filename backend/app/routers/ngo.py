"""
app/routers/ngo.py
NGO portal endpoints:
- GET /ngo/at-risk: Returns list of at-risk students
- POST /ngo/verify-mentor/{id}: Approve or reject mentor applications
- GET /ngo/guidance: Contextual TARA guidance
"""
import uuid
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Path
from pydantic import BaseModel, Field
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app import crud
from app.db.session import get_db
from app.models.user import User, StudentProfile, MentorProfile, Batch, StudentIssue
from app.services.ai_service import get_tara_response_for_role, TARGuidance, is_gemini_available
from app.routers.dependencies import get_current_user, require_role

router = APIRouter(prefix="/ngo", tags=["ngo"])


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS FOR NGO ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

class AtRiskStudent(BaseModel):
    """Student flagged as at-risk."""
    student_id: uuid.UUID
    name: str
    email: str
    standard: int
    current_streak: int
    reason: str  # Why they are flagged
    flagged_at: datetime
    dna_summary: Optional[dict] = Field(None, description="Top strengths and weaknesses")


class AtRiskResponse(BaseModel):
    """Response from at-risk students endpoint."""
    total_at_risk: int
    students: List[AtRiskStudent]
    flags: List[str] = Field(description="Flags used in this report")


class MentorApprovalResponse(BaseModel):
    """Response after approving/rejecting a mentor."""
    mentor_id: uuid.UUID
    mentor_name: str
    email: str
    new_status: str  # APPROVED or REJECTED
    message: str
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None


class NgoAtRiskRow(BaseModel):
    student_id: uuid.UUID
    student_name: str
    batch_name: str
    attendance_rate: float
    mentor_id: Optional[uuid.UUID] = None
    mentor_name: Optional[str] = None


class NgoActivityItem(BaseModel):
    issue_id: uuid.UUID
    student_id: uuid.UUID
    student_name: str
    mentor_id: uuid.UUID
    mentor_name: str
    issue_type: str
    description: str
    status: str
    created_at: datetime


class PendingMentorSummary(BaseModel):
    """Summary of pending mentor applications."""
    mentor_id: uuid.UUID
    name: str
    email: str
    is_verified: bool
    subject_expertise: Optional[str]
    exam_score: Optional[int]
    applied_at: datetime


class NgoOverviewResponse(BaseModel):
    total_mentors: int
    total_students: int
    total_active_batches: int
    verification_queue: int
    critical_alerts: int
    avg_attendance: float
    total_impact: int
    global_dna_map: dict[str, float]
    growth_trend: list[dict[str, Any]]
    unverified_mentors: list[PendingMentorSummary]
    at_risk_students: list[NgoAtRiskRow]
    activity_feed: list[NgoActivityItem]


# ─────────────────────────────────────────────────────────────────────────────
# GET /ngo/at-risk
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/at-risk",
    response_model=AtRiskResponse,
    summary="Get at-risk students"
)
def get_at_risk_students(
    current_user: User = Depends(require_role("NGO")),
    db: Session = Depends(get_db),
    streak_threshold: int = 0,  # Students with streak <= this are flagged
    dna_threshold: float = 40.0,  # DNA scores below this indicate weakness
) -> AtRiskResponse:
    """
    Returns a list of students flagged as at-risk based on:
    1. **Zero or low streak**: No daily mission engagement (current_streak <= threshold)
    2. **Declining DNA scores**: Multiple cognitive dimensions below threshold
    
    **Access**: NGO admins only
    
    **Query parameters**:
        - streak_threshold (default=0): Flag students with streak <= this value
        - dna_threshold (default=40): Flag students with DNA dimension scores below this
    
    **Returns**:
        - List of at-risk students with:
          - Basic info (name, email, standard)
          - Streak and DNA summary
          - Reason for flagging
    
    **Use cases**:
        - Identify students needing intervention
        - Allocate mentors proactively
        - Track engagement trends
    """
    at_risk_students: List[AtRiskStudent] = []
    flags_applied: List[str] = []
    
    # Query all students
    student_profiles = db.query(StudentProfile).all()
    
    for student_profile in student_profiles:
        reasons: List[str] = []
        dna_dict = student_profile.learning_dna or {}
        
        # Check 1: Zero or low streak
        if student_profile.current_streak <= streak_threshold:
            reasons.append(f"No engagement: streak = {student_profile.current_streak}")
            if "low_streak" not in flags_applied:
                flags_applied.append("low_streak")
        
        # Check 2: Declining DNA scores (multiple dimensions below threshold)
        weak_dimensions = []
        for dimension, score in dna_dict.items():
            if isinstance(score, (int, float)) and score < dna_threshold:
                weak_dimensions.append(f"{dimension}={score}")
        
        if len(weak_dimensions) >= 2:  # At least 2 weak dimensions
            reasons.append(f"Weak cognitive areas: {', '.join(weak_dimensions)}")
            if "low_dna_scores" not in flags_applied:
                flags_applied.append("low_dna_scores")
        
        # If any reasons, student is at-risk
        if reasons:
            user = db.query(User).filter(User.id == student_profile.user_id).first()
            if user:
                # Summarize DNA strengths/weaknesses
                sorted_dimensions = sorted(
                    dna_dict.items(),
                    key=lambda x: x[1] if isinstance(x[1], (int, float)) else 0,
                    reverse=True
                )
                dna_summary = {
                    "top_strengths": [d[0] for d in sorted_dimensions[:2]],
                    "areas_for_growth": [d[0] for d in sorted_dimensions[-2:]],
                }
                
                at_risk_students.append(
                    AtRiskStudent(
                        student_id=student_profile.user_id,
                        name=user.full_name,
                        email=user.email,
                        standard=student_profile.standard,
                        current_streak=student_profile.current_streak,
                        reason=" | ".join(reasons),
                        flagged_at=datetime.utcnow(),
                        dna_summary=dna_summary,
                    )
                )
    
    return AtRiskResponse(
        total_at_risk=len(at_risk_students),
        students=at_risk_students,
        flags=flags_applied,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /ngo/verify-mentor/{id}
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/verify-mentor/{mentor_id}",
    response_model=MentorApprovalResponse,
    summary="Approve or reject mentor"
)
@router.patch(
    "/verify-mentor/{mentor_id}",
    response_model=MentorApprovalResponse,
    summary="Approve or reject mentor"
)
def verify_mentor(
    mentor_id: uuid.UUID = Path(description="UUID of the mentor to approve/reject"),
    request: Optional[dict[str, Any]] = None,
    current_user: User = Depends(require_role("NGO")),
    db: Session = Depends(get_db),
) -> MentorApprovalResponse:
    """
    Verify a mentor for platform access.
    
    **Access**: NGO admins only
    
    **Path parameter**:
        - mentor_id: UUID of the mentor user
    
    **Request body** (optional):
        - exam_score: (optional) eligibility exam score
    
    **Logic**:
        1. Mentors register with is_verified = False
        2. NGO verifies mentor via this endpoint
        3. is_verified is toggled to True
        4. Mentor profile status is set to APPROVED for dashboard compatibility
    
    **Returns**:
        - Confirmation with new status and timestamp
    
    **Security**:
        - Only NGO users can call this
        - Prevents unauthorized mentor approval
    """
    # Find the mentor user
    mentor_user = db.query(User).filter(User.id == mentor_id).first()
    if not mentor_user or mentor_user.role != "Mentor":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found"
        )
    
    # Find the mentor profile
    mentor_profile = db.query(MentorProfile).filter(
        MentorProfile.user_id == mentor_id
    ).first()
    
    if not mentor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found"
        )
    
    mentor_user = crud.verify_mentor_user(db, mentor_user)

    mentor_profile.status = "APPROVED"
    mentor_profile.approved_at = datetime.utcnow()
    mentor_profile.rejection_reason = None
    if request and request.get("exam_score") is not None:
        mentor_profile.exam_score = request["exam_score"]
    
    db.add(mentor_profile)
    db.commit()
    db.refresh(mentor_profile)

    message = f"Mentor {mentor_user.full_name} verified by NGO and can now access the dashboard."
    
    return MentorApprovalResponse(
        mentor_id=mentor_user.id,
        mentor_name=mentor_user.full_name,
        email=mentor_user.email,
        new_status=mentor_profile.status,
        message=message,
        approved_at=mentor_profile.approved_at,
        rejection_reason=mentor_profile.rejection_reason,
    )


def _clamp_attendance_rate(raw_rate: float) -> float:
    return round(max(0.0, min(100.0, float(raw_rate))), 2)


def _attendance_rate_from_profile(profile: StudentProfile) -> float:
    dna = profile.learning_dna or {}
    total_logs = int(dna.get("attendance_total_days", 0) or 0)
    total_present = int(dna.get("attendance_present_days", 0) or 0)

    # Prefer deriving from counters when possible to avoid stale inverted rates.
    if total_logs > 0:
        normalized_present = max(0, min(total_present, total_logs))
        return round((normalized_present / total_logs) * 100.0, 2)

    if "attendance_rate" in dna:
        return _clamp_attendance_rate(float(dna.get("attendance_rate", 0.0)))

    direct_rate = getattr(profile, "attendance_rate", None)
    if direct_rate is not None:
        return _clamp_attendance_rate(float(direct_rate))

    return 0.0


@router.get(
    "/overview",
    response_model=NgoOverviewResponse,
    summary="Get NGO global real-time overview"
)
def get_ngo_overview(
    current_user: User = Depends(require_role("NGO")),
    db: Session = Depends(get_db),
) -> NgoOverviewResponse:
    total_mentors = db.query(User).filter(User.role == "Mentor").count()
    total_students = db.query(User).filter(User.role == "Student").count()
    total_active_batches = db.query(Batch).count()
    verification_queue = db.query(User).filter(User.role == "Mentor", User.is_verified.is_(False)).count()

    # Load students with users once to compute global attendance + DNA + at-risk list.
    student_rows = (
        db.query(StudentProfile, User)
        .join(User, User.id == StudentProfile.user_id)
        .filter(User.role == "Student")
        .all()
    )

    attendance_rates: list[float] = []
    dna_totals = {
        "logical": 0.0,
        "verbal": 0.0,
        "creative": 0.0,
        "visual_spatial": 0.0,
        "memory": 0.0,
        "pattern": 0.0,
    }
    at_risk_students: list[NgoAtRiskRow] = []

    batch_map = {batch.batch_name: batch for batch in db.query(Batch).all()}
    mentor_ids = [batch.mentor_id for batch in batch_map.values() if batch.mentor_id]
    mentors = db.query(User).filter(User.id.in_(mentor_ids)).all() if mentor_ids else []
    mentor_map = {mentor.id: mentor for mentor in mentors}

    for profile, student_user in student_rows:
        dna = profile.learning_dna or {}
        for key in dna_totals.keys():
            explicit = getattr(profile, key, None)
            dna_totals[key] += float(explicit if explicit is not None else dna.get(key, 50.0))

        attendance_rate = _attendance_rate_from_profile(profile)
        attendance_rates.append(attendance_rate)

        if attendance_rate < 75:
            batch_name = (profile.batch_name or "Unassigned").strip() or "Unassigned"
            batch = batch_map.get(batch_name)
            mentor = mentor_map.get(batch.mentor_id) if batch and batch.mentor_id else None

            at_risk_students.append(
                NgoAtRiskRow(
                    student_id=profile.user_id,
                    student_name=student_user.full_name,
                    batch_name=batch_name,
                    attendance_rate=round(attendance_rate, 2),
                    mentor_id=mentor.id if mentor else None,
                    mentor_name=mentor.full_name if mentor else "Unassigned",
                )
            )

    critical_alerts = len(at_risk_students)
    avg_attendance = round(sum(attendance_rates) / len(attendance_rates), 2) if attendance_rates else 0.0

    student_count = len(student_rows) if student_rows else 1
    global_dna_map = {
        key: round(total / student_count, 2)
        for key, total in dna_totals.items()
    }

    # Growth trend based on assignment_submissions over last 30 days.
    growth_rows = db.execute(
        text(
            """
            SELECT DATE(submitted_at) AS day, COUNT(*) AS submissions
            FROM assignment_submissions
            WHERE submitted_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(submitted_at)
            ORDER BY day ASC
            """
        )
    ).mappings().all()

    growth_trend = [
        {
            "day": row.get("day").isoformat() if row.get("day") else None,
            "submissions": int(row.get("submissions", 0) or 0),
        }
        for row in growth_rows
    ]

    # Verification queue details for widget.
    pending_users = db.query(User).filter(User.role == "Mentor", User.is_verified.is_(False)).all()
    pending_profiles = {
        profile.user_id: profile
        for profile in db.query(MentorProfile).filter(MentorProfile.user_id.in_([u.id for u in pending_users])).all()
    } if pending_users else {}

    unverified_mentors = [
        PendingMentorSummary(
            mentor_id=user.id,
            name=user.full_name,
            email=user.email,
            is_verified=user.is_verified,
            subject_expertise=pending_profiles.get(user.id).subject_expertise if pending_profiles.get(user.id) else None,
            exam_score=pending_profiles.get(user.id).exam_score if pending_profiles.get(user.id) else None,
            applied_at=user.created_at,
        )
        for user in pending_users
    ]

    # Recent activity feed from student issues across all mentors.
    recent_issues = (
        db.query(StudentIssue)
        .order_by(StudentIssue.created_at.desc())
        .limit(5)
        .all()
    )
    issue_student_ids = [issue.student_id for issue in recent_issues]
    issue_mentor_ids = [issue.mentor_id for issue in recent_issues]
    issue_students = db.query(User).filter(User.id.in_(issue_student_ids)).all() if issue_student_ids else []
    issue_mentors = db.query(User).filter(User.id.in_(issue_mentor_ids)).all() if issue_mentor_ids else []
    issue_student_map = {user.id: user for user in issue_students}
    issue_mentor_map = {user.id: user for user in issue_mentors}

    activity_feed = [
        NgoActivityItem(
            issue_id=issue.id,
            student_id=issue.student_id,
            student_name=issue_student_map.get(issue.student_id).full_name if issue_student_map.get(issue.student_id) else "Unknown Student",
            mentor_id=issue.mentor_id,
            mentor_name=issue_mentor_map.get(issue.mentor_id).full_name if issue_mentor_map.get(issue.mentor_id) else "Unknown Mentor",
            issue_type=issue.issue_type,
            description=issue.description,
            status=issue.status,
            created_at=issue.created_at,
        )
        for issue in recent_issues
    ]

    return NgoOverviewResponse(
        total_mentors=total_mentors,
        total_students=total_students,
        total_active_batches=total_active_batches,
        verification_queue=verification_queue,
        critical_alerts=critical_alerts,
        avg_attendance=avg_attendance,
        total_impact=total_students,
        global_dna_map=global_dna_map,
        growth_trend=growth_trend,
        unverified_mentors=unverified_mentors,
        at_risk_students=at_risk_students,
        activity_feed=activity_feed,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /ngo/pending-mentors
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/pending-mentors",
    response_model=List[PendingMentorSummary],
    summary="Get pending mentor applications"
)
def get_pending_mentors(
    current_user: User = Depends(require_role("NGO")),
    db: Session = Depends(get_db),
) -> List[PendingMentorSummary]:
    """
    Returns list of pending mentor applications waiting for NGO review.
    
    **Access**: NGO admins only
    
    **Returns**:
        - List of mentors with is_verified = False
        - Includes exam scores and subject expertise for review
    """
    pending_users = db.query(User).filter(
        User.role == "Mentor",
        User.is_verified.is_(False),
    ).all()
    
    pending_mentors: List[PendingMentorSummary] = []
    
    for user in pending_users:
        profile = db.query(MentorProfile).filter(MentorProfile.user_id == user.id).first()
        pending_mentors.append(
            PendingMentorSummary(
                mentor_id=user.id,
                name=user.full_name,
                email=user.email,
                is_verified=user.is_verified,
                subject_expertise=profile.subject_expertise if profile else None,
                exam_score=profile.exam_score if profile else None,
                applied_at=user.created_at,
            )
        )
    
    return pending_mentors


# ─────────────────────────────────────────────────────────────────────────────
# GET /ngo/dashboard-stats
# ─────────────────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    """NGO dashboard statistics."""
    total_students: int
    total_mentors: int
    mentors_approved: int
    mentors_pending: int
    mentors_rejected: int
    students_at_risk: int
    average_streak: float


@router.get(
    "/dashboard-stats",
    response_model=DashboardStats,
    summary="Get NGO dashboard statistics"
)
def get_dashboard_stats(
    current_user: User = Depends(require_role("NGO")),
    db: Session = Depends(get_db),
) -> DashboardStats:
    """
    Returns key statistics for the NGO dashboard.
    
    **Access**: NGO admins only
    
    **Returns**:
        - Total students and mentors
        - Mentor approval breakdown
        - At-risk student count
        - Average daily streak
    """
    # Count students
    total_students = db.query(StudentProfile).count()
    
    # Count mentors by status
    total_mentors = db.query(MentorProfile).count()
    mentors_approved = db.query(MentorProfile).filter(
        MentorProfile.status == "APPROVED"
    ).count()
    mentors_pending = db.query(MentorProfile).filter(
        MentorProfile.status == "PENDING"
    ).count()
    mentors_rejected = db.query(MentorProfile).filter(
        MentorProfile.status == "REJECTED"
    ).count()
    
    # Count at-risk students (streak = 0)
    students_at_risk = db.query(StudentProfile).filter(
        StudentProfile.current_streak == 0
    ).count()
    
    # Calculate average streak
    all_streaks = db.query(StudentProfile.current_streak).all()
    average_streak = (
        sum([s[0] for s in all_streaks]) / len(all_streaks)
        if all_streaks else 0.0
    )
    
    return DashboardStats(
        total_students=total_students,
        total_mentors=total_mentors,
        mentors_approved=mentors_approved,
        mentors_pending=mentors_pending,
        mentors_rejected=mentors_rejected,
        students_at_risk=students_at_risk,
        average_streak=average_streak,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /ngo/guidance
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/guidance",
    response_model=Optional[TARGuidance],
    summary="Get contextual TARA guidance"
)
def get_ngo_guidance(
    current_user: User = Depends(require_role("NGO")),
    page: str = "dashboard",
    db: Session = Depends(get_db),
) -> Optional[TARGuidance]:
    """
    Get contextual guidance from TARA for NGO admin portal.
    Provides role-specific insights for platform management.
    
    **Access**: NGO admins only
    
    **Query parameters**:
        - page: Current page identifier
          - "dashboard": Main NGO dashboard with stats
          - "at-risk": List of at-risk students needing intervention
          - "pending-mentors": Mentor applications pending review
          - "verify-mentor": Approve/reject mentor applications
    
    **Returns**:
        - Guidance title, message, key actions, tips
        - None if TARA unavailable
    """
    # Valid NGO pages
    valid_pages = ["dashboard", "at-risk", "pending-mentors", "verify-mentor"]
    if page not in valid_pages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid page. Must be one of: {', '.join(valid_pages)}"
        )
    
    # Get NGO context
    total_students = db.query(StudentProfile).count()
    total_mentors = db.query(MentorProfile).count()
    mentors_pending = db.query(MentorProfile).filter(
        MentorProfile.status == "PENDING"
    ).count()
    students_at_risk = db.query(StudentProfile).filter(
        StudentProfile.current_streak == 0
    ).count()
    
    context = {
        "total_students": total_students,
        "total_mentors": total_mentors,
        "pending_mentor_reviews": mentors_pending,
        "at_risk_students": students_at_risk,
    }
    
    # Fetch guidance from TARA
    guidance = get_tara_response_for_role("NGO", page, context)
    
    if not guidance and is_gemini_available():
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"TARA guidance generation failed for NGO user {current_user.id} on page {page}")
    
    return guidance
