"""
Populate Neon database with realistic Indian school seed data.

Creates:
- 2 mentors
- 4 batches (Grades 8, 9, 10, 12)
- 20 students assigned randomly to batches
- Grade-aware assignments and roadmaps

Usage:
    cd backend
    python scripts/seed_data.py

Optional flags:
    --students 30      Number of students to seed
    --no-clear         Keep existing data and append new records
"""

from __future__ import annotations

import argparse
import json
import random
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from faker import Faker
from sqlalchemy import delete, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

import sys
import os

# Adds the 'backend' directory to the path so it can find the 'app' module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import Assignment, Batch, StudentIssue, StudentProfile, User

DEFAULT_PASSWORD = "Password@123"

GRADE_BATCHES = [
    (8, "Grade 8 - Foundation Alpha", "Mathematics"),
    (9, "Grade 9 - Discovery Beta", "Science"),
    (10, "Grade 10 - Board Prep Gamma", "Mathematics"),
    (12, "Grade 12 - Career Sprint Delta", "Physics"),
]

HIGH_SCHOOL_PATHS = [
    {
        "stream": "MPC",
        "display_name": "MPC (Maths, Physics, Chemistry)",
        "description": "Analytical stream for engineering and quantitative careers.",
        "syllabus_overview": "Core Maths, Physics, and Chemistry with problem-solving focus.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://www.khanacademy.org/math",
        "stage": "HighSchool",
        "subjects": ["Mathematics", "Physics", "Chemistry"],
    },
    {
        "stream": "BiPC",
        "display_name": "BiPC (Biology, Physics, Chemistry)",
        "description": "Best suited for medicine and life sciences pathways.",
        "syllabus_overview": "Biology intensive track with Physics and Chemistry foundations.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://www.khanacademy.org/science/biology",
        "stage": "HighSchool",
        "subjects": ["Biology", "Physics", "Chemistry"],
    },
    {
        "stream": "CEC",
        "display_name": "CEC (Commerce, Economics, Civics)",
        "description": "Business, economics, and commerce-oriented academic stream.",
        "syllabus_overview": "Accountancy, economics, and civics with communication-heavy assessments.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://www.khanacademy.org/economics-finance-domain",
        "stage": "HighSchool",
        "subjects": ["Commerce", "Economics", "Civics"],
    },
    {
        "stream": "HEC",
        "display_name": "HEC (History, Economics, Civics)",
        "description": "Social sciences and humanities pathway for policy and public studies.",
        "syllabus_overview": "History, governance, and economics with essay and analysis tasks.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://www.khanacademy.org/humanities/world-history",
        "stage": "HighSchool",
        "subjects": ["History", "Economics", "Civics"],
    },
]

UNDERGRAD_PATHS = [
    {
        "stream": "CSE",
        "display_name": "CSE (Computer Science Engineering)",
        "description": "Programming, systems, and software engineering specialization.",
        "syllabus_overview": "Coding, DSA, web systems, and software project development.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://www.khanacademy.org/computing/computer-science",
        "stage": "Undergrad",
        "subjects": ["Programming", "Data Structures", "Systems"],
    },
    {
        "stream": "ECE",
        "display_name": "ECE (Electronics & Communication Engineering)",
        "description": "Electronics, communication systems, and embedded engineering track.",
        "syllabus_overview": "Circuits, signals, communication systems, and embedded labs.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://www.khanacademy.org/science/electrical-engineering",
        "stage": "Undergrad",
        "subjects": ["Circuits", "Signals", "Communication"],
    },
    {
        "stream": "Civils",
        "display_name": "Civil Engineering",
        "description": "Infrastructure and structural planning pathway.",
        "syllabus_overview": "Surveying, structures, construction materials, and planning.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://nptel.ac.in/courses",
        "stage": "Undergrad",
        "subjects": ["Structures", "Surveying", "Materials"],
    },
    {
        "stream": "Degree",
        "display_name": "Degree (B.Com/BBA/BA)",
        "description": "Flexible undergraduate path for management, commerce, and arts.",
        "syllabus_overview": "Domain electives in finance, management, and social studies.",
        "trial_label": "Start 5-Minute Trial",
        "trial_url": "https://www.coursera.org/browse/business",
        "stage": "Undergrad",
        "subjects": ["Management", "Economics", "Business Communication"],
    },
]


def _slugify_name(name: str) -> str:
    token = re.sub(r"[^a-zA-Z0-9]+", "", name).lower()
    return token or "student"


def _grade_xp(standard: int) -> tuple[int, int]:
    if standard <= 8:
        return (120, 420)
    if standard == 9:
        return (280, 750)
    if standard == 10:
        return (550, 1300)
    return (1400, 3200)  # Grade 12 has highest XP range


def _generate_dna_for_grade(standard: int) -> dict[str, int]:
    # Grade-based baseline makes higher grades slightly more stable.
    baseline = 38 if standard <= 8 else 46 if standard <= 10 else 56

    def sample(offset: int = 0) -> int:
        return max(0, min(100, int(random.gauss(baseline + offset, 18))))

    return {
        "logical": sample(8 if standard >= 10 else 0),
        "verbal": sample(0),
        "creative": sample(0),
        "visual_spatial": sample(4 if standard >= 9 else 0),
        "memory": sample(5 if standard >= 10 else 0),
        "pattern": sample(7 if standard >= 10 else 0),
    }


def _roadmap_for_grade(grade: int, subject: str) -> dict[str, Any]:
    if grade == 8:
        return {
            "theme": "Foundation Building",
            "goal": "Strengthen basics and confidence in concepts",
            "weeks": [
                {"week": 1, "focus": "Arithmetic fluency and concept warm-up"},
                {"week": 2, "focus": "Visualization and activity-based learning"},
                {"week": 3, "focus": "Reasoning puzzles and recap"},
                {"week": 4, "focus": "Mini assessments and reinforcement"},
            ],
            "subject": subject,
        }

    if grade == 12:
        return {
            "theme": "Entrance + Boards Sprint",
            "goal": "Maximize exam readiness with intensive revision cycles",
            "weeks": [
                {"week": 1, "focus": "High-weight chapters and PYQ mapping"},
                {"week": 2, "focus": "Timed mock tests and error log analysis"},
                {"week": 3, "focus": "Formula revisions and weak-topic recovery"},
                {"week": 4, "focus": "Full-length simulation and strategy tuning"},
            ],
            "subject": subject,
        }

    return {
        "theme": "Core Progression",
        "goal": "Balance concept depth with regular practice",
        "weeks": [
            {"week": 1, "focus": "Concept revision"},
            {"week": 2, "focus": "Guided practice"},
            {"week": 3, "focus": "Applied problem solving"},
            {"week": 4, "focus": "Quiz + feedback loop"},
        ],
        "subject": subject,
    }


def _pick_stream(grade: int, dna: dict[str, int]) -> str | None:
    if grade <= 10:
        if dna["logical"] >= 65 or dna["pattern"] >= 65:
            return "MPC"
        if dna["memory"] >= 62:
            return "BiPC"
        if dna["verbal"] >= 60:
            return "HEC"
        return "CEC"

    # Grade 12 gets undergrad-style path preferences.
    if dna["logical"] >= 65 or dna["pattern"] >= 65:
        return "CSE"
    if dna["visual_spatial"] >= 62:
        return "ECE"
    if dna["memory"] >= 60:
        return "Civils"
    return "Degree"


def _build_attendance_snapshot(days: int = 30) -> tuple[dict[str, bool], int, int, float]:
    today = datetime.now(timezone.utc).date()
    attendance_log: dict[str, bool] = {}
    present_days = 0

    for offset in range(days):
        log_day = (today - timedelta(days=offset)).isoformat()
        # Realistic student attendance distribution.
        is_present = random.random() < 0.86
        attendance_log[log_day] = is_present
        if is_present:
            present_days += 1

    total_logged_days = len(attendance_log)
    attendance_rate = round((present_days / total_logged_days) * 100.0, 2) if total_logged_days else 0.0
    return attendance_log, total_logged_days, present_days, attendance_rate


def _build_attendance_snapshot_with_target(days: int, presence_probability: float) -> tuple[dict[str, bool], int, int, float]:
    today = datetime.now(timezone.utc).date()
    attendance_log: dict[str, bool] = {}
    present_days = 0

    for offset in range(days):
        log_day = (today - timedelta(days=offset)).isoformat()
        is_present = random.random() < presence_probability
        attendance_log[log_day] = is_present
        if is_present:
            present_days += 1

    total_logged_days = len(attendance_log)
    attendance_rate = round((present_days / total_logged_days) * 100.0, 2) if total_logged_days else 0.0
    return attendance_log, total_logged_days, present_days, attendance_rate


def _ensure_aux_tables(session: Session) -> None:
    # career_paths is consumed by student recommendations.
    session.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS career_paths (
                stream VARCHAR(80) PRIMARY KEY,
                display_name VARCHAR(180),
                description TEXT,
                syllabus_overview TEXT,
                trial_label VARCHAR(120),
                trial_url TEXT,
                stage VARCHAR(30)
            )
            """
        )
    )

    # Backward-compatible column upgrades for legacy career_paths schema.
    session.execute(text("ALTER TABLE career_paths ADD COLUMN IF NOT EXISTS stream VARCHAR(80)"))
    session.execute(text("ALTER TABLE career_paths ADD COLUMN IF NOT EXISTS display_name VARCHAR(180)"))
    session.execute(text("ALTER TABLE career_paths ADD COLUMN IF NOT EXISTS syllabus_overview TEXT"))
    session.execute(text("ALTER TABLE career_paths ADD COLUMN IF NOT EXISTS trial_label VARCHAR(120)"))
    session.execute(text("ALTER TABLE career_paths ADD COLUMN IF NOT EXISTS trial_url TEXT"))
    session.execute(text("ALTER TABLE career_paths ADD COLUMN IF NOT EXISTS stage VARCHAR(30)"))

    # Populate stream/display_name from legacy columns when available.
    session.execute(
        text(
            """
            UPDATE career_paths
            SET stream = COALESCE(stream, stream_name),
                display_name = COALESCE(display_name, stream_name),
                trial_url = COALESCE(trial_url, trial_content_link)
            """
        )
    )

    session.execute(
        text(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS ux_career_paths_stream
            ON career_paths(stream)
            """
        )
    )

    # attendance_logs stores day-wise presence/absence history.
    session.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS attendance_logs (
                id UUID PRIMARY KEY,
                student_id UUID NOT NULL,
                batch_name VARCHAR(120),
                date DATE NOT NULL,
                status VARCHAR(20) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
            """
        )
    )
    session.commit()


def clear_existing_data(session: Session) -> None:
    """Clear seeded entities to avoid unique constraint conflicts."""
    _ensure_aux_tables(session)

    session.execute(text("DELETE FROM attendance_logs"))
    session.execute(text("DELETE FROM assignment_submissions"))
    session.execute(delete(StudentIssue))
    session.execute(delete(Assignment))
    session.execute(delete(StudentProfile))
    session.execute(delete(Batch))
    session.execute(delete(User).where(User.role.in_(["Student", "Mentor"])))
    session.execute(text("DELETE FROM career_paths"))
    session.commit()


def seed_career_paths(session: Session) -> int:
    _ensure_aux_tables(session)

    entries = HIGH_SCHOOL_PATHS + UNDERGRAD_PATHS
    for entry in entries:
        payload = {
            **entry,
            "stream_name": entry["display_name"],
            "category": entry["stage"],
            "trial_content_link": entry["trial_url"],
            "subjects_covered": json.dumps(entry.get("subjects", [])),
            "difficulty_level": "Advanced" if entry["stage"] == "Undergrad" else "Intermediate",
        }
        session.execute(
            text(
                """
                INSERT INTO career_paths (
                    stream,
                    display_name,
                    description,
                    syllabus_overview,
                    trial_label,
                    trial_url,
                    stage,
                    stream_name,
                    category,
                    trial_content_link,
                    subjects_covered,
                    difficulty_level
                )
                VALUES (
                    :stream,
                    :display_name,
                    :description,
                    :syllabus_overview,
                    :trial_label,
                    :trial_url,
                    :stage,
                    :stream_name,
                    :category,
                    :trial_content_link,
                    CAST(:subjects_covered AS JSONB),
                    :difficulty_level
                )
                ON CONFLICT (stream)
                DO UPDATE SET
                    display_name = EXCLUDED.display_name,
                    description = EXCLUDED.description,
                    syllabus_overview = EXCLUDED.syllabus_overview,
                    trial_label = EXCLUDED.trial_label,
                    trial_url = EXCLUDED.trial_url,
                    stage = EXCLUDED.stage,
                    stream_name = EXCLUDED.stream_name,
                    category = EXCLUDED.category,
                    trial_content_link = EXCLUDED.trial_content_link,
                    subjects_covered = EXCLUDED.subjects_covered,
                    difficulty_level = EXCLUDED.difficulty_level
                """
            ),
            payload,
        )

    session.commit()
    return len(entries)


def create_mentors(session: Session, fake: Faker, hashed_password: str) -> list[User]:
    mentors: list[User] = []

    for idx in range(1, 3):
        mentor_name = fake.name()
        mentor = User(
            email=f"mentor{idx}.{_slugify_name(mentor_name)}@sahaayak.in",
            hashed_password=hashed_password,
            full_name=mentor_name,
            role="Mentor",
            is_active=True,
            is_verified=True,
        )
        session.add(mentor)
        mentors.append(mentor)

    session.commit()
    return mentors


def create_batches(session: Session, mentors: list[User]) -> list[Batch]:
    batches: list[Batch] = []

    for grade, batch_name, subject in GRADE_BATCHES:
        mentor = random.choice(mentors)
        duration = 16 if grade == 12 else 12

        batch = Batch(
            mentor_id=mentor.id,
            batch_name=batch_name,
            subject=subject,
            grade=grade,
            duration_weeks=duration,
            syllabus_end_date=datetime.now(timezone.utc) + timedelta(days=duration * 7),
            roadmap=_roadmap_for_grade(grade, subject),
        )
        session.add(batch)
        batches.append(batch)

    session.commit()
    return batches


def create_students(session: Session, fake: Faker, batches: list[Batch], student_count: int, hashed_password: str) -> list[User]:
    students: list[User] = []
    at_risk_indices = set(random.sample(range(1, student_count + 1), k=min(2, student_count)))

    for idx in range(1, student_count + 1):
        batch = random.choice(batches)
        grade = int(batch.grade or 8)
        name = fake.name()

        user = User(
            email=f"student{idx}.{_slugify_name(name)}@school.in",
            hashed_password=hashed_password,
            full_name=name,
            role="Student",
            is_active=True,
            is_verified=True,
        )
        session.add(user)
        session.flush()

        dna = _generate_dna_for_grade(grade)
        xp_low, xp_high = _grade_xp(grade)
        xp = random.randint(xp_low, xp_high)
        streak = random.randint(0, 45 if grade == 12 else 25)
        is_at_risk_seed = idx in at_risk_indices
        probability = 0.60 if is_at_risk_seed else 0.90
        attendance_log, attendance_total_days, attendance_present_days, attendance_rate = _build_attendance_snapshot_with_target(30, probability)
        career_stage = "Undergrad" if grade == 12 else "HighSchool"
        trial_catalog = UNDERGRAD_PATHS if grade == 12 else HIGH_SCHOOL_PATHS
        trial_options = [item["stream"] for item in trial_catalog]
        learning_dna_payload = {
            **{k: float(v) for k, v in dna.items()},
            "attendance_log": attendance_log,
            "attendance_total_days": attendance_total_days,
            "attendance_present_days": attendance_present_days,
            "attendance_rate": attendance_rate,
            "career_stage": career_stage,
            "career_trial_options": trial_options,
            "at_risk_seed": is_at_risk_seed,
        }

        profile = StudentProfile(
            user_id=user.id,
            standard=grade,
            stream=_pick_stream(grade, dna),
            batch_name=batch.batch_name,
            learning_dna=learning_dna_payload,
            logical=dna["logical"],
            verbal=dna["verbal"],
            creative=dna["creative"],
            visual_spatial=dna["visual_spatial"],
            memory=dna["memory"],
            pattern=dna["pattern"],
            xp=xp,
            streak=streak,
            total_xp=xp,
            current_streak=streak,
        )
        if hasattr(profile, "attendance_rate"):
            setattr(profile, "attendance_rate", attendance_rate)
        session.add(profile)
        students.append(user)

    session.commit()
    return students


def create_assignments(session: Session, batches: list[Batch]) -> list[Assignment]:
    assignments: list[Assignment] = []

    assignment_templates = {
        8: [
            ("Fractions in Daily Life", "Solve 12 practical fraction problems."),
            ("Science Observation Journal", "Write observations from two home experiments."),
        ],
        9: [
            ("Linear Equations Practice", "Complete worksheet and explain 3 methods."),
            ("Motion & Force Lab Sheet", "Submit velocity and acceleration activity report."),
        ],
        10: [
            ("Board Prep Revision Test", "Timed test on algebra and geometry units."),
            ("Chemistry Formula Deck", "Create reaction flashcards with use-cases."),
        ],
        12: [
            ("JEE/NEET Mock Analysis", "Attempt mock and submit error analysis log."),
            ("High-Weightage Chapter Sprint", "Solve 40 MCQs and reflect on weak areas."),
        ],
    }

    now_utc = datetime.now(timezone.utc)

    for batch in batches:
        grade = int(batch.grade or 8)
        templates = assignment_templates.get(grade, assignment_templates[8])

        for offset, (title, description) in enumerate(templates, start=1):
            assignment = Assignment(
                title=title,
                description=description,
                due_date=now_utc + timedelta(days=5 * offset),
                batch_name=batch.batch_name,
                mentor_id=batch.mentor_id,
            )
            session.add(assignment)
            assignments.append(assignment)

    session.commit()
    return assignments


def create_attendance_logs(session: Session) -> int:
    profiles = session.query(StudentProfile).all()
    batch_params: list[dict] = []

    for profile in profiles:
        dna = dict(profile.learning_dna or {})
        attendance_log = dict(dna.get("attendance_log", {}))
        if not attendance_log:
            continue

        for date_str, present in attendance_log.items():
            batch_params.append({
                "id": str(uuid.uuid4()),
                "student_id": str(profile.user_id),
                "batch_name": profile.batch_name,
                "date": date_str,
                "status": "Present" if bool(present) else "Absent",
            })

    if batch_params:
        session.execute(
            text(
                """
                INSERT INTO attendance_logs (id, student_id, batch_name, date, status)
                VALUES (:id, :student_id, :batch_name, :date, :status)
                """
            ),
            batch_params,
        )
    session.commit()
    return len(batch_params)


def create_assignment_submissions(session: Session, assignments: list[Assignment], batches: list[Batch]) -> int:
    batch_to_students: dict[str, list[StudentProfile]] = {}
    for batch in batches:
        students = session.query(StudentProfile).filter(StudentProfile.batch_name == batch.batch_name).all()
        batch_to_students[batch.batch_name] = students

    batch_params: list[dict] = []

    for assignment in assignments:
        students = batch_to_students.get(assignment.batch_name, [])
        if not students:
            continue

        submission_total = max(1, int(round(len(students) * 0.70)))
        selected_students = random.sample(students, k=min(submission_total, len(students)))

        for student in selected_students:
            batch_params.append({
                "id": str(uuid.uuid4()),
                "assignment_id": str(assignment.id),
                "student_id": str(student.user_id),
                "content": (
                    f"Completed assignment '{assignment.title}'. "
                    f"Attempt summary by {student.user_id}: solved core questions and noted 2 doubts."
                ),
                "status": "Submitted",
                "submitted_at": datetime.now(timezone.utc) - timedelta(days=random.randint(0, 5)),
            })

    if batch_params:
        session.execute(
            text(
                """
                INSERT INTO assignment_submissions (id, assignment_id, student_id, content, status, submitted_at)
                VALUES (:id, :assignment_id, :student_id, :content, :status, :submitted_at)
                """
            ),
            batch_params,
        )
    session.commit()
    return len(batch_params)


def create_student_issues(session: Session, mentors: list[User], batches: list[Batch]) -> int:
    all_students = session.query(StudentProfile).all()
    if not all_students:
        return 0

    selected_students = random.sample(all_students, k=min(5, len(all_students)))
    statuses = ["Open", "Open", "Open", "Resolved", "Resolved"]
    issue_templates = [
        ("Attendance", "Frequent absences observed in the last week."),
        ("Performance", "Needs additional support in core concepts."),
        ("Engagement", "Low class participation in batch activities."),
        ("Behavior", "Follow-up meeting completed with improvement plan."),
        ("Performance", "Previous issue reviewed and marked resolved."),
    ]

    created = 0
    for idx, student in enumerate(selected_students):
        batch = next((b for b in batches if b.batch_name == student.batch_name), None)
        mentor_id = batch.mentor_id if batch and batch.mentor_id else random.choice(mentors).id
        issue_type, description = issue_templates[idx]

        issue = StudentIssue(
            student_id=student.user_id,
            mentor_id=mentor_id,
            issue_type=issue_type,
            description=description,
            status=statuses[idx],
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 12)),
            updated_at=datetime.now(timezone.utc),
        )
        session.add(issue)
        created += 1

    session.commit()
    return created


def run_seed(clear_before_seed: bool, student_count: int) -> None:
    fake = Faker("en_IN")
    fake.seed_instance(20260331)
    random.seed(20260331)

    # Pre-hash password once instead of hashing it for every user
    hashed_default_password = hash_password(DEFAULT_PASSWORD)

    session = SessionLocal()
    try:
        if clear_before_seed:
            clear_existing_data(session)
            print("[seed] Cleared existing Student/Mentor, StudentProfile, Batch, and Assignment data")

        career_paths_count = seed_career_paths(session)

        mentors = create_mentors(session, fake, hashed_default_password)
        batches = create_batches(session, mentors)
        students = create_students(session, fake, batches, student_count, hashed_default_password)
        assignments = create_assignments(session, batches)
        attendance_logs = create_attendance_logs(session)
        submissions = create_assignment_submissions(session, assignments, batches)
        issues = create_student_issues(session, mentors, batches)

        print("[seed] Done")
        print(f"[seed] Career paths seeded: {career_paths_count}")
        print(f"[seed] Mentors created: {len(mentors)}")
        print(f"[seed] Batches created: {len(batches)}")
        print(f"[seed] Students created: {len(students)}")
        print(f"[seed] Assignments created: {len(assignments)}")
        print(f"[seed] Attendance logs created: {attendance_logs}")
        print(f"[seed] Assignment submissions created: {submissions}")
        print(f"[seed] Student issues created: {issues}")
        print(f"[seed] Default password for seeded users: {DEFAULT_PASSWORD}")

    except SQLAlchemyError as exc:
        session.rollback()
        raise RuntimeError(f"Database seeding failed: {exc}") from exc
    finally:
        session.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed Neon DB with Indian school demo data")
    parser.add_argument("--students", type=int, default=20, help="Number of student records to create")
    parser.add_argument(
        "--no-clear",
        action="store_true",
        help="Do not clear existing seeded data before creating new records",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run_seed(clear_before_seed=not args.no_clear, student_count=max(1, args.students))