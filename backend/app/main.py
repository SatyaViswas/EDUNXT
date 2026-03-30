"""
app/main.py
FastAPI application entry point.
Registers routers for Student, Mentor, and NGO portals.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.session import engine, Base
from app.routers import student, mentor, ngo, auth


# ─────────────────────────────────────────────────────────────────────────────
# CREATE TABLES ON STARTUP
# ─────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup/shutdown events.
    Creates all tables on startup.
    """
    # Startup
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")
    yield
    # Shutdown
    print("✓ Shutting down")


# ─────────────────────────────────────────────────────────────────────────────
# FASTAPI APP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="EDUNXT - 3-Part Portal API",
    description="Student, Mentor, and NGO portal backend",
    version="1.0.0",
    lifespan=lifespan,
)

_default_local_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

_configured_origins = settings.cors_origins or []
allow_origins = list(dict.fromkeys(_configured_origins + _default_local_origins))


# ─────────────────────────────────────────────────────────────────────────────
# CORS MIDDLEWARE
# ─────────────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# HEALTH CHECK ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["system"])
def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0",
    }


# ─────────────────────────────────────────────────────────────────────────────
# REGISTER ROUTERS
# ─────────────────────────────────────────────────────────────────────────────

app.include_router(student.router)
app.include_router(mentor.router)
app.include_router(ngo.router)
app.include_router(auth.router)


def _cors_error_headers(request) -> dict[str, str]:
    origin = request.headers.get("origin")
    if not origin:
        return {}

    if origin in allow_origins or origin.startswith("http://localhost:") or origin.startswith("http://127.0.0.1:"):
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin",
        }
    return {}


# ─────────────────────────────────────────────────────────────────────────────
# GLOBAL ERROR HANDLERS
# ─────────────────────────────────────────────────────────────────────────────

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    """Custom HTTP exception handler."""
    return JSONResponse(
        status_code=exc.status_code,
        headers=_cors_error_headers(request),
        content={
            "detail": exc.detail,
            "status_code": exc.status_code,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    """Catch-all exception handler for unhandled errors."""
    print(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        headers=_cors_error_headers(request),
        content={
            "detail": "Internal server error",
            "status_code": 500,
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
