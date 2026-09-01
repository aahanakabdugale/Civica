import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Civica Grievance Platform API"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True

    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "civica_db"

    DUPLICATE_COSINE_THRESHOLD: float = 0.82
    DUPLICATE_GEO_RADIUS_METERS: float = 500.0
    DUPLICATE_TIME_WINDOW_DAYS: int = 14

    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"

    TRANSLATION_API_KEY: Optional[str] = None
    LLM_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
