"""
ML Service Entry Point.

FastAPI application for the Citizen Grievance Classification,
Prioritization & Duplicate Detection pipeline.

Run with:
    cd ml
    uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.services.language import LanguageService
from app.services.embedder import EmbedderService
from app.services.classifier import ClassifierService
from app.services.deduplicator import DeduplicatorService
from app.services.prioritizer import PrioritizerService
from app.routers import pipeline

# ── Logging setup ────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(name)-25s │ %(levelname)-7s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan: load models at startup ────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load all ML models and services before the app starts serving requests.
    This ensures the first API call doesn't have a cold-start delay.
    """
    logger.info("=" * 60)
    logger.info("  ML Service Starting Up")
    logger.info("=" * 60)

    # Load services (order matters: embedder takes longest to load)
    logger.info("Loading Language Service...")
    app.state.language = LanguageService()

    logger.info("Loading Classifier Service...")
    app.state.classifier = ClassifierService()

    logger.info("Loading Embedding Service (this may take a few seconds)...")
    app.state.embedder = EmbedderService()

    logger.info("Loading Deduplicator Service...")
    app.state.deduplicator = DeduplicatorService()

    logger.info("Loading Prioritizer Service...")
    app.state.prioritizer = PrioritizerService()

    logger.info("=" * 60)
    logger.info("  All services loaded. ML Service is ready!")
    logger.info(f"  LLM Provider: {settings.LLM_PROVIDER}")
    logger.info(f"  Embedding Model: {settings.EMBEDDING_MODEL}")
    logger.info(f"  API Docs: http://localhost:{settings.ML_SERVICE_PORT}/docs")
    logger.info("=" * 60)

    yield  # App is running

    # Cleanup on shutdown
    logger.info("ML Service shutting down...")


# ── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Grievance ML Service",
    description=(
        "AI-powered pipeline for citizen complaint processing: "
        "language detection, department classification, priority scoring, "
        "and duplicate detection."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS (allow frontend to call ML service directly during dev) ─────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routes ─────────────────────────────────────────────────────────

app.include_router(pipeline.router, prefix="/ml", tags=["ML Pipeline"])


# ── Root endpoint ────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "Grievance ML Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/ml/health",
    }
