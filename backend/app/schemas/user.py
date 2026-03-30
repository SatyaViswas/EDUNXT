"""
app/schemas/user.py
Pydantic v2 schemas for request validation and response serialization.
Covers User, StudentProfile, and MentorProfile for the 3-part portal system.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Literal, Optional, List

from pydantic import BaseModel, EmailStr, Field, field_validator


# ─────────────────────────────────────────────────────────────────────────────
# ENUMS & LITERALS
# ─────────────────────────────────────────────────────────────────────────────

RoleLiteral = Literal["Student", "Mentor", "NGO"]
MentorStatusLiteral = Literal["PENDING", "APPROVED", "REJECTED"]
MasteryStatusLiteral = Literal["mastered", "learning", "needs_help"]


# ─────────────────────────────────────────────────────────────────────────────
# LEARNING DNA
# ─────────────────────────────────────────────────────────────────────────────

class LearningDNA(BaseModel):
    """
    Student learning profile across 6 dimensions (0-100 each).
    Represents strengths and weaknesses in different cognitive areas.
    """
    logical: float = Field(ge=0, le=100, description="Logical reasoning ability")
    verbal: float = Field(ge=0, le=100, description="Language and verbal skills")
    creative: float = Field(ge=0, le=100, description="Creative thinking")
    visual_spatial: float = Field(ge=0, le=100, description="Visual and spatial reasoning")
    memory: float = Field(ge=0, le=100, description="Memory retention")
    pattern: float = Field(ge=0, le=100, description="Pattern recognition")


# ─────────────────────────────────────────────────────────────────────────────
# AUTHENTICATION
# ─────────────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    """
    User registration request.
    Students must provide 'standard'; Mentors can provide 'subject_expertise'.
    """
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    role: RoleLiteral
    
    # Student-specific
    standard: Optional[int] = Field(None, ge=1, le=12, description="Class level for students (1-12)")
    
    # Mentor-specific
    subject_expertise: Optional[List[str]] = Field(None, description="List of subject areas for mentors")

    @field_validator("standard")
    @classmethod
    def standard_required_for_students(cls, v: Optional[int], info) -> Optional[int]:
        if info.data.get("role") == "Student" and v is None:
            raise ValueError("'standard' is required for Student role")
        return v


class LoginRequest(BaseModel):
    """User login request."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Authentication token response. Includes user role for frontend routing."""
    access_token: str
    token_type: str = "bearer"
    role: RoleLiteral
    user_id: uuid.UUID
    mentor_status: Optional[MentorStatusLiteral] = None  # Only for mentors


# ─────────────────────────────────────────────────────────────────────────────
# STUDENT PROFILE
# ─────────────────────────────────────────────────────────────────────────────

class StudentUpdate(BaseModel):
    """Student profile creation/update request."""
    standard: int = Field(ge=1, le=12)
    stream: Optional[str] = Field(None, max_length=20)
    batch_name: str = Field(default="Unassigned", max_length=100)
    learning_dna: LearningDNA = Field(default_factory=lambda: LearningDNA(
        logical=50.0, verbal=50.0, creative=50.0,
        visual_spatial=50.0, memory=50.0, pattern=50.0
    ))
    logical: int = Field(default=0, ge=0, le=100)
    verbal: int = Field(default=0, ge=0, le=100)
    creative: int = Field(default=0, ge=0, le=100)
    visual_spatial: int = Field(default=0, ge=0, le=100)
    memory: int = Field(default=0, ge=0, le=100)
    pattern: int = Field(default=0, ge=0, le=100)
    xp: int = Field(default=0, ge=0)
    streak: int = Field(default=0, ge=0)


class StudentRead(BaseModel):
    """Student profile response with current streak and total XP."""
    standard: int
    stream: Optional[str]
    batch_name: str
    learning_dna: LearningDNA
    logical: int
    verbal: int
    creative: int
    visual_spatial: int
    memory: int
    pattern: int
    xp: int
    streak: int
    current_streak: int
    total_xp: int

    model_config = {"from_attributes": True}


class StudentProfileRequest(StudentUpdate):
    """Backward-compatible alias for student update payload."""


class StudentProfileResponse(StudentRead):
    """Backward-compatible alias for student read payload."""


# ─────────────────────────────────────────────────────────────────────────────
# MENTOR PROFILE
# ─────────────────────────────────────────────────────────────────────────────

class MentorProfileRequest(BaseModel):
    """Mentor profile creation/update request."""
    subject_expertise: Optional[List[str]] = Field(None, description="List of subject areas")
    exam_score: Optional[int] = Field(None, ge=0, le=100, description="Eligibility exam score")


class MentorProfileResponse(BaseModel):
    """
    Mentor profile response with approval status.
    Mentors at PENDING status cannot access the dashboard.
    """
    subject_expertise: Optional[str]  # Stored as JSON string in DB
    status: MentorStatusLiteral
    exam_score: Optional[int]
    total_students: int
    total_batches: int
    impact_score: Optional[float]
    approved_at: Optional[datetime]
    rejection_reason: Optional[str]

    model_config = {"from_attributes": True}


class MentorApprovalRequest(BaseModel):
    """
    NGO request to approve or reject a mentor.
    Used by NGO admin dashboard to manage mentor vetting.
    """
    mentor_user_id: uuid.UUID
    status: Literal["APPROVED", "REJECTED"]
    rejection_reason: Optional[str] = Field(None, max_length=500)
    exam_score: Optional[int] = Field(None, ge=0, le=100)


# ─────────────────────────────────────────────────────────────────────────────
# USER RESPONSE
# ─────────────────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    """
    User response with role-specific profile data.
    Students include student_profile; Mentors include mentor_profile.
    """
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: RoleLiteral
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    
    student_profile: Optional[StudentProfileResponse] = None
    mentor_profile: Optional[MentorProfileResponse] = None

    model_config = {"from_attributes": True}


class UserDetailResponse(BaseModel):
    """Extended user response with all profile information."""
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: RoleLiteral
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    
    student_profile: Optional[StudentProfileResponse] = None
    mentor_profile: Optional[MentorProfileResponse] = None

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────────────────────────────────────
# LEARNING & MASTERY
# ─────────────────────────────────────────────────────────────────────────────

class MasteryUpdateRequest(BaseModel):
    """
    Request to update a student's mastery status for a specific topic.
    Used by the learning engine to track progress.
    """
    student_id: uuid.UUID
    topic: str = Field(min_length=1, max_length=120)
    status: MasteryStatusLiteral


class LearningDNAUpdateRequest(BaseModel):
    """
    Request to update a student's learning DNA profile.
    Can be used to refine or adjust the cognitive profile.
    """
    learning_dna: LearningDNA


class StreakUpdateRequest(BaseModel):
    """Update a student's daily mission streak."""
    current_streak: int = Field(ge=0)


# ─────────────────────────────────────────────────────────────────────────────
# ERROR RESPONSES
# ─────────────────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str
    status_code: int


class MentorNotApprovedError(ErrorResponse):
    """Error when a mentor tries to access dashboard before approval."""
    detail: str = "Mentor account not yet approved by NGO"
    status_code: int = 403
