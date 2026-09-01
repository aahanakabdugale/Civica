"""
Embedding Generation Service.

Generates dense 384-dimensional vector representations for complaint text
using the `all-MiniLM-L6-v2` sentence-transformer model.

These embeddings power duplicate detection via cosine similarity.
"""

import logging
import time
from sentence_transformers import SentenceTransformer

from app.config import settings

logger = logging.getLogger(__name__)


class EmbedderService:
    """
    Singleton-pattern embedding service.
    The model is loaded once at startup and reused for all requests.

    Model: all-MiniLM-L6-v2
    - Output dimensions: 384
    - Size: ~80MB
    - CPU-friendly: ~50-100ms per complaint after initial load
    """

    def __init__(self):
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}...")
        start = time.time()

        self.model = SentenceTransformer(settings.EMBEDDING_MODEL)
        self.dimensions = settings.EMBEDDING_DIM

        load_time = time.time() - start
        logger.info(f"Embedding model loaded in {load_time:.2f}s")

    def generate_embedding(self, text: str) -> list[float]:
        """
        Generate a normalized 384-dim embedding for a single text.

        Normalization ensures that cosine similarity = dot product,
        which is faster for similarity calculations.

        Args:
            text: Preprocessed complaint text (ideally in English)

        Returns:
            List of 384 floats representing the text embedding
        """
        if not text or not text.strip():
            # Return zero vector for empty text
            return [0.0] * self.dimensions

        embedding = self.model.encode(
            text,
            normalize_embeddings=True,
            show_progress_bar=False
        )
        return embedding.tolist()

    def batch_embed(self, texts: list[str]) -> list[list[float]]:
        """
        Generate embeddings for a batch of texts.
        Much faster than calling generate_embedding() in a loop.

        Useful for:
        - Seeding demo data (embedding all 50 seed complaints at once)
        - Bulk re-embedding after model changes

        Args:
            texts: List of complaint texts

        Returns:
            List of 384-dim embedding vectors
        """
        if not texts:
            return []

        logger.info(f"Batch embedding {len(texts)} texts...")
        start = time.time()

        embeddings = self.model.encode(
            texts,
            normalize_embeddings=True,
            batch_size=32,
            show_progress_bar=False
        )

        elapsed = time.time() - start
        logger.info(f"Batch embedding done in {elapsed:.2f}s ({elapsed/len(texts)*1000:.1f}ms/text)")

        return embeddings.tolist()

    def get_model_info(self) -> dict:
        """Return model metadata for health check endpoints."""
        return {
            "model_name": settings.EMBEDDING_MODEL,
            "dimensions": self.dimensions,
            "max_sequence_length": self.model.max_seq_length,
        }
