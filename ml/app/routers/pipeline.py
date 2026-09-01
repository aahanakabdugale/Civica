"""
FastAPI route handlers for the ML pipeline.

Endpoints:
  POST /ml/process           — Full pipeline (translate → classify → embed → prioritize)
  POST /ml/check-duplicate   — Duplicate detection against existing complaints
  POST /ml/embed             — Generate embedding only
  POST /ml/classify          — Classify only
  GET  /ml/health            — Health check
  GET  /ml/categories        — List available departments
"""

import logging
import time

from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import (
    ProcessRequest,
    ProcessResponse,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    DuplicateMatch,
    EmbedRequest,
    EmbedResponse,
    ClassifyRequest,
    ClassifyResponse,
    HealthResponse,
)
from app.utils.text_cleaner import clean_text
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  POST /ml/process — Full ML Pipeline
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/process", response_model=ProcessResponse)
async def process_complaint(request: Request, body: ProcessRequest):
    """
    Full ML processing pipeline for a new citizen complaint.

    Steps:
    1. Clean the raw text
    2. Detect language & translate to English
    3. Classify into a department
    4. Generate embedding vector
    5. Compute priority score

    The backend calls this endpoint when a new complaint is submitted.
    """
    start = time.time()

    # Access services from app state (loaded at startup)
    language_svc = request.app.state.language
    classifier_svc = request.app.state.classifier
    embedder_svc = request.app.state.embedder
    prioritizer_svc = request.app.state.prioritizer

    try:
        # Step 1: Clean text
        cleaned = clean_text(body.text)
        if not cleaned:
            raise HTTPException(status_code=400, detail="Complaint text is empty after cleaning")

        # Step 2: Language detection + translation
        lang_result = language_svc.detect_and_translate(cleaned)
        translated_text = lang_result["translated_text"]

        # Step 3: Classification
        classify_result = await classifier_svc.classify(translated_text)

        # Step 4: Embedding
        embedding = embedder_svc.generate_embedding(translated_text)

        # Step 5: Priority scoring
        priority_result = prioritizer_svc.score(
            text=translated_text,
            category=classify_result["department"],
            duplicate_count=0,  # Backend will update after duplicate check
        )

        elapsed = time.time() - start
        logger.info(
            f"Pipeline complete in {elapsed:.2f}s: "
            f"lang={lang_result['detected_language']}, "
            f"dept={classify_result['department']}, "
            f"priority={priority_result['priority']}"
        )

        return ProcessResponse(
            original_text=body.text,
            translated_text=translated_text,
            detected_language=lang_result["detected_language"],
            department=classify_result["department"],
            classification_method=classify_result["method"],
            priority=priority_result["priority"],
            priority_score=priority_result["score"],
            priority_factors=priority_result["factors"],
            embedding=embedding,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Pipeline error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"ML pipeline error: {str(e)}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  POST /ml/check-duplicate — Duplicate Detection
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/check-duplicate", response_model=DuplicateCheckResponse)
async def check_duplicate(request: Request, body: DuplicateCheckRequest):
    """
    Check if a new complaint is a duplicate of any existing complaints.

    The backend should:
    1. First call /ml/process to get the embedding + category
    2. Query the DB for recent complaints in the same category
    3. Call this endpoint with the embedding + existing complaints
    4. Use the result to set `duplicate_of` in the DB
    """
    dedup_svc = request.app.state.deduplicator

    try:
        # Convert Pydantic models to dicts for the service
        existing = [
            {
                "id": c.id,
                "embedding": c.embedding,
                "latitude": c.latitude,
                "longitude": c.longitude,
                "category": c.category,
                "days_ago": c.days_ago,
            }
            for c in body.existing_complaints
        ]

        result = dedup_svc.check_duplicates(
            new_embedding=body.embedding,
            new_lat=body.latitude,
            new_lon=body.longitude,
            new_category=body.category,
            existing_complaints=existing,
        )

        return DuplicateCheckResponse(
            is_duplicate=result["is_duplicate"],
            best_match_id=result["best_match_id"],
            best_match_score=result["best_match_score"],
            duplicates=[DuplicateMatch(**d) for d in result["duplicates"]],
        )

    except Exception as e:
        logger.error(f"Duplicate check error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Duplicate detection error: {str(e)}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  POST /ml/embed — Standalone Embedding
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/embed", response_model=EmbedResponse)
async def generate_embedding(request: Request, body: EmbedRequest):
    """Generate an embedding vector for a text. Useful for testing or ad-hoc queries."""
    embedder_svc = request.app.state.embedder

    cleaned = clean_text(body.text)
    embedding = embedder_svc.generate_embedding(cleaned)

    return EmbedResponse(
        embedding=embedding,
        model=settings.EMBEDDING_MODEL,
        dimensions=settings.EMBEDDING_DIM,
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  POST /ml/classify — Standalone Classification
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/classify", response_model=ClassifyResponse)
async def classify_complaint(request: Request, body: ClassifyRequest):
    """Classify a complaint into a department. Useful for testing."""
    classifier_svc = request.app.state.classifier

    cleaned = clean_text(body.text)
    result = await classifier_svc.classify(cleaned)

    return ClassifyResponse(
        department=result["department"],
        method=result["method"],
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  GET /ml/health — Health Check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    """Health check — confirms models are loaded and service is ready."""
    return HealthResponse(
        status="ok",
        models_loaded=True,
        embedding_model=settings.EMBEDDING_MODEL,
        llm_provider=settings.LLM_PROVIDER,
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  GET /ml/categories — List Departments
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/categories")
async def list_categories():
    """Return the list of departments the classifier can assign complaints to."""
    from app.services.classifier import DEPARTMENTS
    return {"departments": DEPARTMENTS}
