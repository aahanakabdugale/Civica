"""
Pydantic schemas for ML service API request/response models.
These define the contract between the ML service and the backend.
"""

from pydantic import BaseModel, Field


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  /ml/process
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ProcessRequest(BaseModel):
    """Input from the backend when a citizen submits a complaint."""
    text: str = Field(..., min_length=5, description="Raw complaint text from citizen")
    latitude: float | None = Field(None, ge=-90, le=90, description="GPS latitude")
    longitude: float | None = Field(None, ge=-180, le=180, description="GPS longitude")


class ProcessResponse(BaseModel):
    """Full ML pipeline output returned to the backend."""
    original_text: str
    translated_text: str
    detected_language: str
    department: str
    classification_method: str          # "llm_zero_shot" or "keyword_fallback"
    priority: str                       # "Low" | "Medium" | "High" | "Critical"
    priority_score: int                 # 0-10 numeric score
    priority_factors: list[str]         # Human-readable explanations
    embedding: list[float]              # 384-dim vector


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  /ml/check-duplicate
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ExistingComplaint(BaseModel):
    """Simplified complaint record from the database for duplicate comparison."""
    id: int
    embedding: list[float]
    latitude: float
    longitude: float
    category: str
    days_ago: float = Field(..., ge=0, description="Number of days since complaint was created")


class DuplicateCheckRequest(BaseModel):
    """Input for duplicate detection — new complaint vs. existing ones."""
    embedding: list[float]
    latitude: float
    longitude: float
    category: str
    existing_complaints: list[ExistingComplaint]


class DuplicateMatch(BaseModel):
    """A single duplicate match result."""
    duplicate_of: int                   # ID of the existing complaint
    cosine_sim: float
    geo_dist_km: float
    composite_score: float


class DuplicateCheckResponse(BaseModel):
    """Duplicate detection results."""
    is_duplicate: bool
    best_match_id: int | None = None
    best_match_score: float | None = None
    duplicates: list[DuplicateMatch]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  /ml/embed
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class EmbedRequest(BaseModel):
    """Input for standalone embedding generation."""
    text: str = Field(..., min_length=1)


class EmbedResponse(BaseModel):
    """Embedding vector output."""
    embedding: list[float]
    model: str
    dimensions: int


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  /ml/classify
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ClassifyRequest(BaseModel):
    """Input for standalone classification."""
    text: str = Field(..., min_length=5)


class ClassifyResponse(BaseModel):
    """Classification result."""
    department: str
    method: str                         # "llm_zero_shot" or "keyword_fallback"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  /ml/health
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "ok"
    models_loaded: bool = True
    embedding_model: str = ""
    llm_provider: str = ""
