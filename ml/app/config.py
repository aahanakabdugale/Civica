"""
Configuration module for the ML service.
All tunable thresholds, API keys, and model paths are centralized here.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings loaded from environment variables with sensible defaults."""

    # ── LLM API ──────────────────────────────────────────────────────────
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq")          # "groq" | "openai" | "gemini" | "claude"
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama-3.1-8b-instant")  # Groq free-tier default
    LLM_TIMEOUT_SECONDS: int = int(os.getenv("LLM_TIMEOUT_SECONDS", "5"))
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")

    # ── Translation ──────────────────────────────────────────────────────
    TRANSLATION_PROVIDER: str = os.getenv("TRANSLATION_PROVIDER", "googletrans")  # "googletrans" | "google_cloud"

    # ── Embedding Model ──────────────────────────────────────────────────
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    EMBEDDING_DIM: int = 384

    # ── Duplicate Detection Thresholds ───────────────────────────────────
    COSINE_THRESHOLD: float = float(os.getenv("COSINE_THRESHOLD", "0.82"))
    GEO_RADIUS_KM: float = float(os.getenv("GEO_RADIUS_KM", "0.5"))
    TIME_WINDOW_DAYS: int = int(os.getenv("TIME_WINDOW_DAYS", "7"))
    COMPOSITE_THRESHOLD: float = float(os.getenv("COMPOSITE_THRESHOLD", "0.70"))

    # Composite score weights (must sum to 1.0)
    WEIGHT_COSINE: float = 0.60
    WEIGHT_GEO: float = 0.25
    WEIGHT_TIME: float = 0.15

    # ── Server ───────────────────────────────────────────────────────────
    ML_SERVICE_HOST: str = os.getenv("ML_SERVICE_HOST", "0.0.0.0")
    ML_SERVICE_PORT: int = int(os.getenv("ML_SERVICE_PORT", "8001"))
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")


settings = Settings()
