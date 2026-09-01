import logging
import numpy as np
from typing import List, Optional
from sentence_transformers import SentenceTransformer
from app.core.config import settings

logger = logging.getLogger("civica.embedding")

class EmbeddingService:
    def __init__(self):
        self._model: Optional[SentenceTransformer] = None

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            logger.info(f"Loading SentenceTransformer model '{settings.EMBEDDING_MODEL_NAME}'...")
            self._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
            logger.info("SentenceTransformer model loaded successfully.")
        return self._model

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generates a 384-dimensional dense float vector for input text.
        """
        if not text or not text.strip():
            return [0.0] * 384
        
        try:
            embedding = self.model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return [0.0] * 384

    @staticmethod
    def compute_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """
        Computes cosine similarity between two normalized vector embeddings.
        """
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        
        a = np.array(vec1, dtype=np.float32)
        b = np.array(vec2, dtype=np.float32)
        
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
            
        similarity = float(np.dot(a, b) / (norm_a * norm_b))
        return max(0.0, min(1.0, similarity))

embedding_service = EmbeddingService()
