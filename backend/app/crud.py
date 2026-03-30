"""
app/crud.py
CRUD helpers for create/read/update operations with explicit commit + refresh.
"""
import json
from typing import Optional

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User, StudentProfile, MentorProfile


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create_user(
    db: Session,
    *,
    email: str,
    password: str,
    full_name: str,
    role: str,
) -> User:
    # Mentor starts unverified by design; other roles are verified on signup.
    is_verified = role != "Mentor"

    db_obj = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name,
        role=role,
        is_verified=is_verified,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def create_student_profile(
    db: Session,
    *,
    user_id,
    standard: int,
) -> StudentProfile:
    db_obj = StudentProfile(user_id=user_id, standard=standard)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def create_mentor_profile(
    db: Session,
    *,
    user_id,
    subject_expertise: Optional[list[str]] = None,
) -> MentorProfile:
    expertise_text = json.dumps(subject_expertise) if subject_expertise else None
    db_obj = MentorProfile(user_id=user_id, subject_expertise=expertise_text, status="PENDING")
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def verify_mentor_user(db: Session, mentor_user: User) -> User:
    mentor_user.is_verified = True
    db.add(mentor_user)
    db.commit()
    db.refresh(mentor_user)
    return mentor_user
