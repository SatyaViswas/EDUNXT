"""
app/db/session.py
Creates the SQLAlchemy async-compatible engine for Neon PostgreSQL and
provides a per-request database session via a FastAPI dependency.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from app.core.config import settings


# ── Engine ────────────────────────────────────────────────────────────────────
# Neon requires SSL; the connection string from .env already includes
# ?sslmode=require so no additional connect_args are needed.
if not settings.DATABASE_URL:
    print("[DB WARNING] DATABASE_URL is empty. Engine initialization may fail.")

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,        # recycle stale connections after network blips
    pool_size=5,               # connections kept alive in the pool
    max_overflow=10,           # extra connections allowed under burst load
    echo=settings.DEBUG,       # SQL query logging in DEBUG mode
)

# ── Session factory ───────────────────────────────────────────────────────────
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,    # avoid lazy-load errors after commit
)

# ── Declarative base (shared by all models) ───────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── FastAPI dependency ────────────────────────────────────────────────────────
def get_db() -> Session:
    """
    Yield a database session for the duration of a single HTTP request.
    The session is automatically closed (and any uncommitted transaction
    rolled back) when the request finishes, even on exceptions.

    Usage:
        @router.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
