"""
app/routers/auth.py
Authentication endpoints for register and login.
"""
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.user import MentorProfile
from app.schemas.user import RegisterRequest, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, summary="Register a new user")
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = crud.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = crud.create_user(
        db,
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
        role=payload.role,
    )

    mentor_status = None
    if payload.role == "Student":
        if payload.standard is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="standard is required for Student accounts",
            )
        crud.create_student_profile(db, user_id=user.id, standard=payload.standard)

    if payload.role == "Mentor":
        mentor_profile = crud.create_mentor_profile(
            db,
            user_id=user.id,
            subject_expertise=payload.subject_expertise,
        )
        mentor_status = mentor_profile.status

    token = create_access_token(
        subject=user.id,
        extra_claims={"role": user.role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        mentor_status=mentor_status,
    )


@router.post("/login", response_model=TokenResponse, summary="Login user")
def login_user(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = crud.get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Allow all users to login; verification/approval checks happen at protected endpoints
    mentor_status = None
    if user.role == "Mentor":
        mentor_profile = db.query(MentorProfile).filter(MentorProfile.user_id == user.id).first()
        mentor_status = mentor_profile.status if mentor_profile else None

    token = create_access_token(
        subject=user.id,
        extra_claims={"role": user.role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        mentor_status=mentor_status,
    )
