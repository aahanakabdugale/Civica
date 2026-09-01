"""
Tests for the duplicate detection service.
Verifies cosine similarity, geo-distance, time decay, and composite scoring.
"""

import sys
from pathlib import Path

import pytest
import numpy as np

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.deduplicator import DeduplicatorService


@pytest.fixture
def dedup():
    return DeduplicatorService()


class TestHaversine:
    """Tests for GPS distance calculations."""

    def test_same_point(self, dedup):
        dist = dedup.haversine_km(19.076, 72.877, 19.076, 72.877)
        assert dist == 0.0

    def test_nearby_points(self, dedup):
        # ~200 meters apart
        dist = dedup.haversine_km(19.076, 72.877, 19.0780, 72.877)
        assert 0.1 < dist < 0.5

    def test_far_points(self, dedup):
        # Mumbai to Delhi (~1,150 km)
        dist = dedup.haversine_km(19.076, 72.877, 28.613, 77.209)
        assert 1000 < dist < 1500


class TestGeoScore:
    """Tests for geographic proximity scoring."""

    def test_same_location_returns_1(self, dedup):
        score = dedup.geo_score(19.076, 72.877, 19.076, 72.877)
        assert score == 1.0

    def test_far_location_returns_0(self, dedup):
        # Points more than 500m apart
        score = dedup.geo_score(19.076, 72.877, 19.100, 72.900)
        assert score == 0.0

    def test_nearby_location_between_0_and_1(self, dedup):
        # ~200 meters apart (within 500m threshold)
        score = dedup.geo_score(19.0760, 72.8770, 19.0762, 72.8779)
        assert 0.0 < score < 1.0


class TestTimeScore:
    """Tests for temporal recency scoring."""

    def test_same_day(self, dedup):
        assert dedup.time_score(0.0) == 1.0

    def test_half_window(self, dedup):
        score = dedup.time_score(3.5)  # Half of 7-day window
        assert 0.45 < score < 0.55

    def test_beyond_window(self, dedup):
        assert dedup.time_score(7.0) == 0.0
        assert dedup.time_score(30.0) == 0.0


class TestDuplicateDetection:
    """Tests for the full duplicate detection pipeline."""

    def _make_embedding(self, seed: int = 42) -> list[float]:
        """Generate a random 384-dim normalized vector."""
        rng = np.random.RandomState(seed)
        vec = rng.randn(384).astype(np.float32)
        vec /= np.linalg.norm(vec)
        return vec.tolist()

    def test_identical_embedding_is_duplicate(self, dedup):
        emb = self._make_embedding(seed=1)
        existing = [
            {
                "id": 100,
                "embedding": emb,  # Same embedding
                "latitude": 19.076,
                "longitude": 72.877,
                "category": "Water Supply",
                "days_ago": 1.0,
            }
        ]

        result = dedup.check_duplicates(
            new_embedding=emb,
            new_lat=19.076,
            new_lon=72.877,
            new_category="Water Supply",
            existing_complaints=existing,
        )

        assert result["is_duplicate"] is True
        assert result["best_match_id"] == 100
        assert result["best_match_score"] > 0.9

    def test_different_embedding_not_duplicate(self, dedup):
        emb_new = self._make_embedding(seed=1)
        emb_existing = self._make_embedding(seed=999)  # Very different

        existing = [
            {
                "id": 200,
                "embedding": emb_existing,
                "latitude": 19.076,
                "longitude": 72.877,
                "category": "Water Supply",
                "days_ago": 1.0,
            }
        ]

        result = dedup.check_duplicates(
            new_embedding=emb_new,
            new_lat=19.076,
            new_lon=72.877,
            new_category="Water Supply",
            existing_complaints=existing,
        )

        assert result["is_duplicate"] is False

    def test_different_category_skipped(self, dedup):
        emb = self._make_embedding(seed=1)
        existing = [
            {
                "id": 300,
                "embedding": emb,
                "latitude": 19.076,
                "longitude": 72.877,
                "category": "Electricity",  # Different category
                "days_ago": 1.0,
            }
        ]

        result = dedup.check_duplicates(
            new_embedding=emb,
            new_lat=19.076,
            new_lon=72.877,
            new_category="Water Supply",  # Different from existing
            existing_complaints=existing,
        )

        assert result["is_duplicate"] is False
        assert len(result["duplicates"]) == 0

    def test_old_complaint_skipped(self, dedup):
        emb = self._make_embedding(seed=1)
        existing = [
            {
                "id": 400,
                "embedding": emb,
                "latitude": 19.076,
                "longitude": 72.877,
                "category": "Water Supply",
                "days_ago": 30.0,  # Beyond 7-day window
            }
        ]

        result = dedup.check_duplicates(
            new_embedding=emb,
            new_lat=19.076,
            new_lon=72.877,
            new_category="Water Supply",
            existing_complaints=existing,
        )

        assert result["is_duplicate"] is False

    def test_empty_existing_complaints(self, dedup):
        emb = self._make_embedding(seed=1)
        result = dedup.check_duplicates(
            new_embedding=emb,
            new_lat=19.076,
            new_lon=72.877,
            new_category="Water Supply",
            existing_complaints=[],
        )

        assert result["is_duplicate"] is False
        assert result["duplicates"] == []

    def test_multiple_duplicates_sorted_by_score(self, dedup):
        emb = self._make_embedding(seed=1)

        # Create two existing complaints with the same embedding
        # but different geo/time scores
        existing = [
            {
                "id": 501,
                "embedding": emb,
                "latitude": 19.076,
                "longitude": 72.877,
                "category": "Water Supply",
                "days_ago": 5.0,  # Older → lower score
            },
            {
                "id": 502,
                "embedding": emb,
                "latitude": 19.0761,
                "longitude": 72.8771,
                "category": "Water Supply",
                "days_ago": 0.5,  # Newer → higher score
            },
        ]

        result = dedup.check_duplicates(
            new_embedding=emb,
            new_lat=19.076,
            new_lon=72.877,
            new_category="Water Supply",
            existing_complaints=existing,
        )

        assert result["is_duplicate"] is True
        assert len(result["duplicates"]) == 2
        # Best match should be the newer, closer complaint (id=502)
        assert result["best_match_id"] == 502
        # Sorted by composite score descending
        scores = [d["composite_score"] for d in result["duplicates"]]
        assert scores == sorted(scores, reverse=True)
