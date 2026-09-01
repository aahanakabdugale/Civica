"""
Tests for the keyword-based fallback classifier.
These tests verify classification WITHOUT LLM API calls.
"""

import sys
from pathlib import Path

import pytest

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.classifier import ClassifierService


@pytest.fixture
def classifier():
    """Create a classifier instance with LLM disabled (keyword fallback only)."""
    svc = ClassifierService()
    svc._llm_available = False  # Force keyword-only mode
    return svc


class TestKeywordClassifier:
    """Tests for keyword-based fallback classification."""

    def test_water_supply(self, classifier):
        result = classifier._classify_keywords(
            "No water supply in our area for 3 days. Pipe seems broken."
        )
        assert result["department"] == "Water Supply"
        assert result["method"] == "keyword_fallback"

    def test_electricity(self, classifier):
        result = classifier._classify_keywords(
            "Power outage since last night. Transformer has blown up."
        )
        assert result["department"] == "Electricity"

    def test_roads(self, classifier):
        result = classifier._classify_keywords(
            "Huge pothole on the main road. Vehicles are getting damaged."
        )
        assert result["department"] == "Roads & Infrastructure"

    def test_sanitation(self, classifier):
        result = classifier._classify_keywords(
            "Garbage has not been collected for a week. Terrible smell."
        )
        assert result["department"] == "Sanitation & Waste"

    def test_health(self, classifier):
        result = classifier._classify_keywords(
            "Hospital has no medicines. Patients are being turned away."
        )
        assert result["department"] == "Health & Medical"

    def test_public_safety(self, classifier):
        result = classifier._classify_keywords(
            "There was a theft in our colony last night. Police did not respond."
        )
        assert result["department"] == "Public Safety"

    def test_education(self, classifier):
        result = classifier._classify_keywords(
            "School teacher is absent every day. Students are not studying."
        )
        assert result["department"] == "Education"

    def test_transport(self, classifier):
        result = classifier._classify_keywords(
            "Bus route 467 has been cancelled. Commuters are stranded."
        )
        assert result["department"] == "Transport"

    def test_environment(self, classifier):
        result = classifier._classify_keywords(
            "Factory is releasing smoke and air pollution. People can't breathe."
        )
        assert result["department"] == "Environment"

    def test_housing(self, classifier):
        result = classifier._classify_keywords(
            "Illegal construction on the footpath. Building has no permit."
        )
        assert result["department"] == "Housing & Construction"

    def test_unknown_returns_other(self, classifier):
        result = classifier._classify_keywords(
            "I want to know about my ration card status update."
        )
        assert result["department"] == "Other"

    def test_multi_word_keyword_bonus(self, classifier):
        """Multi-word keywords should get a bonus score of 2 instead of 1."""
        result = classifier._classify_keywords(
            "There is a short circuit in the building wiring."
        )
        assert result["department"] == "Electricity"


class TestDepartmentMatching:
    """Tests for fuzzy-matching LLM output to department names."""

    def test_exact_match(self, classifier):
        assert classifier._match_department("Water Supply") == "Water Supply"

    def test_case_insensitive(self, classifier):
        assert classifier._match_department("water supply") == "Water Supply"

    def test_with_quotes(self, classifier):
        assert classifier._match_department('"Water Supply"') == "Water Supply"

    def test_with_period(self, classifier):
        assert classifier._match_department("Water Supply.") == "Water Supply"

    def test_partial_match(self, classifier):
        assert classifier._match_department("Roads") == "Roads & Infrastructure"

    def test_no_match(self, classifier):
        assert classifier._match_department("Random Nonsense XYZ") is None
