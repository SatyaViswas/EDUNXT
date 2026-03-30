import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

# 1. Calculate absolute path to .env
# This file is in: backend/app/core/config.py
# .env is in: project_root/
# We need to go up 3 levels: core -> app -> backend -> root
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Sahaayak API"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str

    # Security (JWT)
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200 

    # Google Gemini API
    GEMINI_API_KEY: str

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    # Pydantic v2 Configuration
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore"
    )

@lru_cache()
def get_settings() -> Settings:
    # Diagnostic print - This will show up in your terminal
    print(f"--- Loading config from: {ENV_FILE} ---")
    return Settings()

settings = get_settings()

# Final safety check
if not settings.DATABASE_URL:
    raise ValueError(f"CRITICAL: DATABASE_URL not loaded. Check {ENV_FILE}")
