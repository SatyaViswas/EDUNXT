"""
app/models/user.py
SQLAlchemy ORM models for User, StudentProfile, and MentorProfile.
Supports the 3-part portal structure (Student, Mentor, NGO).
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, ForeignKey,
    Integer, String, Text, Float
)
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship, foreign

from app.db.session import Base


class User(Base):
    """
    Central identity table — one row per registered account.
    All roles (Student, Mentor, NGO) share this table, with role-specific
    profiles linked via relationships.
    """
    __tablename__ = "users"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email           = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name       = Column(String(255), nullable=False)
    role            = Column(
        Enum("Student", "Mentor", "NGO", name="user_role_enum"),
        nullable=False,
        index=True,
    )
    is_active       = Column(Boolean, default=True, nullable=False)
    is_verified     = Column(Boolean, default=False, nullable=False)

    created_at      = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at      = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Back-references to role-specific profiles ──────────────────────────
    student_profile = relationship(
        "StudentProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    mentor_profile = relationship(
        "MentorProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    badges = relationship(
        "UserBadge",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"


class StudentProfile(Base):
    """
    Student-specific data: standard/grade, learning DNA profile, and daily streak.
    
    Learning DNA is stored as a JSONB field containing 6 dimensions:
    {
        "logical": 0-100,
        "verbal": 0-100,
        "creative": 0-100,
        "visual_spatial": 0-100,
        "memory": 0-100,
        "pattern": 0-100
    }
    """
    __tablename__ = "student_profiles"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id         = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    standard        = Column(Integer, nullable=False)  # Class 1-12
    stream          = Column(String(20), nullable=True)  # MPC / BiPC / CEC (Class 11-12)
    batch_name      = Column(String, default='Unassigned')

    # Legacy Learning DNA JSON storage (kept for backward compatibility)
    learning_dna    = Column(
        JSON,
        nullable=False,
        default={
            "logical": 50.0,
            "verbal": 50.0,
            "creative": 50.0,
            "visual_spatial": 50.0,
            "memory": 50.0,
            "pattern": 50.0,
        }
    )

    # Explicit DNA dimension columns (added in SQL for real-time API reads)
    logical         = Column(Integer, default=0)
    verbal          = Column(Integer, default=0)
    creative        = Column(Integer, default=0)
    visual_spatial  = Column(Integer, default=0)
    memory          = Column(Integer, default=0)
    pattern         = Column(Integer, default=0)

    # Explicit gamification columns
    xp              = Column(Integer, default=0)
    streak          = Column(Integer, default=0)

    # Legacy columns retained for compatibility with existing endpoints
    current_streak  = Column(Integer, default=0)  # Daily mission streak
    total_xp        = Column(Integer, default=0)  # Total experience points

    user = relationship("User", back_populates="student_profile")
    batch = relationship(
        "Batch",
        primaryjoin="foreign(StudentProfile.batch_name) == Batch.batch_name",
        viewonly=True,
        uselist=False,
    )

    def __repr__(self) -> str:
        return f"<StudentProfile(user_id={self.user_id}, standard={self.standard}, streak={self.current_streak})>"


class MentorProfile(Base):
    """
    Mentor-specific data: subject expertise, approval status, and vetting score.
    
    Approval Flow:
    1. Mentor creates account → status = PENDING
    2. NGO reviews and approves → status = APPROVED (mentor can now log in)
    3. NGO rejects (optional) → status = REJECTED
    
    Mentors cannot access the dashboard until status = APPROVED.
    """
    __tablename__ = "mentor_profiles"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id         = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    
    # Subject expertise (JSON array as text)
    subject_expertise = Column(Text, nullable=True)  # e.g. '["Mathematics", "Physics"]'
    
    # Approval status and vetting
    status          = Column(
        Enum("PENDING", "APPROVED", "REJECTED", name="mentor_status_enum"),
        nullable=False,
        default="PENDING",
        index=True,
    )
    exam_score      = Column(Integer, nullable=True)  # Eligibility exam score (0-100)
    
    # Impact metrics
    total_students  = Column(Integer, default=0)
    total_batches   = Column(Integer, default=0)
    impact_score    = Column(Float, nullable=True)  # Mentor Impact Score (MIS)

    # Metadata
    approved_at     = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    user = relationship("User", back_populates="mentor_profile")

    def __repr__(self) -> str:
        return f"<MentorProfile(user_id={self.user_id}, status={self.status}, exam_score={self.exam_score})>"


class Batch(Base):
    """Mentor-managed teaching batch with persisted AI roadmap."""
    __tablename__ = "batches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mentor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    batch_name = Column(String(120), nullable=False, unique=True, index=True)
    subject = Column(String(120), nullable=True)
    grade = Column(Integer, nullable=True)
    duration_weeks = Column(Integer, nullable=True)
    syllabus_end_date = Column(DateTime(timezone=True), nullable=True)
    roadmap = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    assignments = relationship(
        "Assignment",
        primaryjoin="Batch.batch_name == foreign(Assignment.batch_name)",
        back_populates="batch",
    )
    students = relationship(
        "StudentProfile",
        primaryjoin="Batch.batch_name == foreign(StudentProfile.batch_name)",
        viewonly=True,
    )

    def __repr__(self) -> str:
        return f"<Batch(id={self.id}, batch_name={self.batch_name})>"


class Assignment(Base):
    """Mentor assignment scoped to a specific batch."""
    __tablename__ = "assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(180), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=False, index=True)
    batch_name = Column(String(120), nullable=False, index=True)
    mentor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    batch = relationship(
        "Batch",
        primaryjoin="foreign(Assignment.batch_name) == Batch.batch_name",
        viewonly=True,
        uselist=False,
    )

    def __repr__(self) -> str:
        return f"<Assignment(id={self.id}, batch_name={self.batch_name}, title={self.title})>"


class StudentIssue(Base):
    """Issue tracking table for mentor-reported student concerns."""
    __tablename__ = "student_issues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    mentor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    issue_type = Column(String(80), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(
        Enum("Open", "Resolved", name="student_issue_status_enum"),
        nullable=False,
        default="Open",
        index=True,
    )
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    @property
    def category(self) -> str:
        return self.issue_type

    @property
    def severity(self) -> str:
        return "Medium"

    def __repr__(self) -> str:
        return f"<StudentIssue(id={self.id}, student_id={self.student_id}, status={self.status})>"


class UserBadge(Base):
    """Earned badges for users, used by student dashboard highlights."""
    __tablename__ = "user_badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    badge_name = Column(String(120), nullable=False)
    earned_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="badges")

    def __repr__(self) -> str:
        return f"<UserBadge(user_id={self.user_id}, badge_name={self.badge_name})>"


class AssignmentSubmission(Base):
    """Student submission record for a mentor assignment."""
    __tablename__ = "assignment_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    response_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self) -> str:
        return f"<AssignmentSubmission(assignment_id={self.assignment_id}, student_id={self.student_id})>"
