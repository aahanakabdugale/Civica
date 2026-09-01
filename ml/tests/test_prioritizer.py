"""
Tests for the priority scoring service.
Verifies keyword detection, category severity, duplicate density, and label mapping.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.prioritizer import PrioritizerService


@pytest.fixture
def prioritizer():
    return PrioritizerService()


class TestPriorityScoring:
    """Tests for priority score calculation."""

    def test_critical_keyword_fire(self, prioritizer):
        result = prioritizer.score(
            text="Fire broke out in the building. People trapped inside.",
            category="Public Safety",
        )
        assert result["priority"] == "Critical"
        assert result["score"] >= 8
        assert any("fire" in f.lower() for f in result["factors"])

    def test_critical_keyword_collapse(self, prioritizer):
        result = prioritizer.score(
            text="Building collapse reported in the area. Rescue needed.",
            category="Public Safety",
        )
        assert result["priority"] == "Critical"

    def test_high_keyword_accident(self, prioritizer):
        result = prioritizer.score(
            text="Road accident near the highway. Injury reported.",
            category="Roads & Infrastructure",
        )
        # Category base severity 2 + High keyword "accident" (+2) = score 4 → Medium
        assert result["priority"] in ["Medium", "High", "Critical"]
        assert result["score"] >= 4

    def test_medium_keyword_delay(self, prioritizer):
        result = prioritizer.score(
            text="Bus is always delayed by 30 minutes.",
            category="Transport",
        )
        assert result["priority"] in ["Medium", "High"]

    def test_low_priority_no_keywords(self, prioritizer):
        result = prioritizer.score(
            text="I would like to know about the ration card process.",
            category="Other",
        )
        assert result["priority"] == "Low"
        assert result["score"] <= 2

    def test_high_severity_category(self, prioritizer):
        """Public Safety has base severity 4, so even a plain complaint gets Medium+."""
        result = prioritizer.score(
            text="Something happened in the neighborhood.",
            category="Public Safety",
        )
        assert result["score"] >= 4
        assert result["priority"] in ["Medium", "High"]

    def test_low_severity_category(self, prioritizer):
        """Education has base severity 1."""
        result = prioritizer.score(
            text="Exam schedule needs to be updated.",
            category="Education",
        )
        assert result["score"] <= 3

    def test_duplicate_density_boost(self, prioritizer):
        """Multiple similar complaints should boost priority."""
        result_no_dupes = prioritizer.score(
            text="Pothole on the road.",
            category="Roads & Infrastructure",
            duplicate_count=0,
        )

        result_many_dupes = prioritizer.score(
            text="Pothole on the road.",
            category="Roads & Infrastructure",
            duplicate_count=6,
        )

        assert result_many_dupes["score"] > result_no_dupes["score"]
        assert any("density" in f.lower() for f in result_many_dupes["factors"])

    def test_detailed_complaint_bonus(self, prioritizer):
        """Complaints with 50+ words get a +1 bonus."""
        short_text = "Road is broken."
        long_text = " ".join(["The road near our colony is completely broken."] * 10)

        result_short = prioritizer.score(short_text, "Roads & Infrastructure")
        result_long = prioritizer.score(long_text, "Roads & Infrastructure")

        assert result_long["score"] >= result_short["score"]

    def test_score_capped_at_10(self, prioritizer):
        """Score should never exceed 10."""
        result = prioritizer.score(
            text="Fire explosion collapse death flood electrocution drowning stampede",
            category="Public Safety",
            duplicate_count=10,
        )
        assert result["score"] <= 10

    def test_factors_are_human_readable(self, prioritizer):
        """All factors should be non-empty strings."""
        result = prioritizer.score(
            text="Water pipe burst, road flooded.",
            category="Water Supply",
        )
        assert len(result["factors"]) >= 1
        for factor in result["factors"]:
            assert isinstance(factor, str)
            assert len(factor) > 5


class TestScoreToLabel:
    """Tests for numeric score → label mapping."""

    def test_score_0_is_low(self, prioritizer):
        assert prioritizer._score_to_label(0) == "Low"

    def test_score_2_is_low(self, prioritizer):
        assert prioritizer._score_to_label(2) == "Low"

    def test_score_3_is_medium(self, prioritizer):
        assert prioritizer._score_to_label(3) == "Medium"

    def test_score_5_is_high(self, prioritizer):
        assert prioritizer._score_to_label(5) == "High"

    def test_score_8_is_critical(self, prioritizer):
        assert prioritizer._score_to_label(8) == "Critical"

    def test_score_10_is_critical(self, prioritizer):
        assert prioritizer._score_to_label(10) == "Critical"
