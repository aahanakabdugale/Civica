"""
End-to-end pipeline tests.
Tests the full flow: text → translate → classify → embed → prioritize.

NOTE: These tests do NOT require an LLM API key.
They test the pipeline with keyword-based classification fallback.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.language import LanguageService
from app.services.classifier import ClassifierService
from app.services.embedder import EmbedderService
from app.services.prioritizer import PrioritizerService
from app.services.deduplicator import DeduplicatorService
from app.utils.text_cleaner import clean_text


@pytest.fixture(scope="module")
def language_svc():
    return LanguageService()


@pytest.fixture(scope="module")
def classifier_svc():
    svc = ClassifierService()
    svc._llm_available = False  # Use keyword fallback
    return svc


@pytest.fixture(scope="module")
def embedder_svc():
    """Shared across all tests in this module (model load takes 2-3s)."""
    return EmbedderService()


@pytest.fixture(scope="module")
def prioritizer_svc():
    return PrioritizerService()


@pytest.fixture(scope="module")
def dedup_svc():
    return DeduplicatorService()


class TestFullPipeline:
    """End-to-end pipeline tests."""

    def test_english_complaint_pipeline(
        self, language_svc, classifier_svc, embedder_svc, prioritizer_svc
    ):
        """Full pipeline for an English complaint."""
        raw = "There is a huge pothole on MG Road. Multiple vehicles damaged."

        # Step 1: Clean
        cleaned = clean_text(raw)
        assert len(cleaned) > 0

        # Step 2: Language detection
        lang_result = language_svc.detect_and_translate(cleaned)
        assert lang_result["detected_language"] == "en"
        assert lang_result["was_translated"] is False

        # Step 3: Classify
        classify_result = classifier_svc._classify_keywords(lang_result["translated_text"])
        assert classify_result["department"] == "Roads & Infrastructure"

        # Step 4: Embed
        embedding = embedder_svc.generate_embedding(lang_result["translated_text"])
        assert len(embedding) == 384
        assert all(isinstance(v, float) for v in embedding)

        # Step 5: Priority
        priority_result = prioritizer_svc.score(
            text=lang_result["translated_text"],
            category=classify_result["department"],
        )
        assert priority_result["priority"] in ["Low", "Medium", "High", "Critical"]

    def test_critical_complaint_pipeline(
        self, language_svc, classifier_svc, embedder_svc, prioritizer_svc
    ):
        """Critical complaint should get Critical priority."""
        raw = "Fire broke out in the slum area. Three houses destroyed. People trapped."

        cleaned = clean_text(raw)
        lang_result = language_svc.detect_and_translate(cleaned)
        classify_result = classifier_svc._classify_keywords(lang_result["translated_text"])
        embedding = embedder_svc.generate_embedding(lang_result["translated_text"])

        priority_result = prioritizer_svc.score(
            text=lang_result["translated_text"],
            category=classify_result["department"],
        )

        assert priority_result["priority"] in ["High", "Critical"]
        assert len(embedding) == 384

    def test_embedding_similarity_for_related_complaints(self, embedder_svc):
        """Two complaints about the same issue should have similar embeddings."""
        from sklearn.metrics.pairwise import cosine_similarity
        import numpy as np

        text1 = "Water pipe burst on the main road. Street is flooded."
        text2 = "Main road pipe has broken. Water everywhere."
        text3 = "School teacher is absent. Students are not learning."

        emb1 = embedder_svc.generate_embedding(text1)
        emb2 = embedder_svc.generate_embedding(text2)
        emb3 = embedder_svc.generate_embedding(text3)

        # Similar complaints should have high cosine similarity
        sim_related = cosine_similarity(
            np.array(emb1).reshape(1, -1),
            np.array(emb2).reshape(1, -1),
        )[0][0]

        # Unrelated complaint should have lower similarity
        sim_unrelated = cosine_similarity(
            np.array(emb1).reshape(1, -1),
            np.array(emb3).reshape(1, -1),
        )[0][0]

        assert sim_related > sim_unrelated
        assert sim_related > 0.5  # Related complaints should be fairly similar

    def test_duplicate_detection_pipeline(self, embedder_svc, dedup_svc):
        """Full duplicate detection: embed two similar complaints → detect duplicate."""
        text1 = "Pothole on MG Road near City Mall causing accidents."
        text2 = "Big hole on MG Road by City Mall. Cars getting damaged."

        emb1 = embedder_svc.generate_embedding(text1)
        emb2 = embedder_svc.generate_embedding(text2)

        existing = [
            {
                "id": 1,
                "embedding": emb1,
                "latitude": 19.076,
                "longitude": 72.877,
                "category": "Roads & Infrastructure",
                "days_ago": 1.0,
            }
        ]

        result = dedup_svc.check_duplicates(
            new_embedding=emb2,
            new_lat=19.0762,
            new_lon=72.8772,
            new_category="Roads & Infrastructure",
            existing_complaints=existing,
        )

        # These are clearly about the same issue at the same location
        assert result["is_duplicate"] is True
        assert result["best_match_id"] == 1

    def test_unrelated_complaints_not_duplicate(self, embedder_svc, dedup_svc):
        """Unrelated complaints should NOT be flagged as duplicates."""
        text1 = "Water pipe burst on SV Road."
        text2 = "School needs new teachers urgently."

        emb1 = embedder_svc.generate_embedding(text1)
        emb2 = embedder_svc.generate_embedding(text2)

        existing = [
            {
                "id": 10,
                "embedding": emb1,
                "latitude": 19.076,
                "longitude": 72.877,
                "category": "Water Supply",
                "days_ago": 1.0,
            }
        ]

        result = dedup_svc.check_duplicates(
            new_embedding=emb2,
            new_lat=19.076,
            new_lon=72.877,
            new_category="Education",  # Different category
            existing_complaints=existing,
        )

        assert result["is_duplicate"] is False


class TestTextCleaner:
    """Tests for text preprocessing utility."""

    def test_whitespace_collapse(self):
        assert clean_text("hello    world") == "hello world"

    def test_repeated_punctuation(self):
        assert clean_text("help!!!!!!") == "help!"

    def test_preserves_hindi(self):
        cleaned = clean_text("पानी की पाइप फट गई")
        assert "पानी" in cleaned

    def test_truncates_long_text(self):
        long_text = "word " * 500
        cleaned = clean_text(long_text)
        assert len(cleaned) <= 2000

    def test_empty_input(self):
        assert clean_text("") == ""
        assert clean_text("   ") == ""
