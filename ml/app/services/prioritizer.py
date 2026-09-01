"""
Priority / Urgency Scoring Service.

Assigns a priority label (Low / Medium / High / Critical) to each complaint
based on a hybrid rule-based scoring system that considers:
  1. Department base severity (Public Safety > Education)
  2. Keyword severity boosts (fire, accident, collapse → Critical)
  3. Duplicate density (many similar complaints → escalate)
  4. Text length as a minor signal (detailed complaints may indicate severity)
"""

import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent.parent / "data"


class PrioritizerService:
    """
    Rule-based priority scoring engine.
    Produces a numeric score (0–10) mapped to a label + human-readable factors.
    """

    # ── Keyword severity tiers ───────────────────────────────────────────
    CRITICAL_KEYWORDS: list[str] = [
        "fire", "collapse", "death", "flood", "explosion", "electrocution",
        "drowning", "stampede", "gas leak", "building collapse", "bridge collapse",
        "child trapped", "lives at risk", "life threatening",
    ]

    HIGH_KEYWORDS: list[str] = [
        "accident", "injury", "leak", "burst", "emergency", "danger",
        "broken", "hazard", "toxic", "contaminated", "overflowing",
        "short circuit", "exposed wire", "crack in wall", "sinkhole",
        "snake", "stray dog attack", "assault",
    ]

    MEDIUM_KEYWORDS: list[str] = [
        "delay", "shortage", "overflow", "blocked", "damaged", "complaint",
        "not working", "out of order", "irregular", "pending", "no supply",
        "poor quality", "unhygienic", "overcrowded", "noise",
    ]

    # ── Base severity by department (0–4 scale) ──────────────────────────
    CATEGORY_SEVERITY: dict[str, int] = {
        "Public Safety": 4,
        "Health & Medical": 4,
        "Electricity": 3,
        "Water Supply": 3,
        "Roads & Infrastructure": 2,
        "Sanitation & Waste": 2,
        "Transport": 2,
        "Environment": 2,
        "Housing & Construction": 2,
        "Education": 1,
        "Other": 1,
    }

    # ── Score → Label mapping ────────────────────────────────────────────
    # Score 0–2  → Low
    # Score 3–4  → Medium
    # Score 5–7  → High
    # Score 8–10 → Critical

    def score(
        self,
        text: str,
        category: str,
        duplicate_count: int = 0,
    ) -> dict:
        """
        Compute priority score for a complaint.

        Args:
            text: Translated/cleaned complaint text
            category: Classified department name
            duplicate_count: Number of existing similar complaints (boosts priority)

        Returns:
            {
                "priority": "Low" | "Medium" | "High" | "Critical",
                "score": int (0–10),
                "factors": list[str]  — Human-readable reasons for the score
            }
        """
        text_lower = text.lower()
        score = 0
        factors: list[str] = []

        # ── 1. Category base severity (0–4 points) ──────────────────────
        cat_sev = self.CATEGORY_SEVERITY.get(category, 1)
        score += cat_sev
        factors.append(f"Department '{category}' base severity: {cat_sev}/4")

        # ── 2. Keyword detection (0–4 points) ───────────────────────────
        keyword_boost = self._check_keywords(text_lower)
        if keyword_boost:
            score += keyword_boost["points"]
            factors.append(keyword_boost["reason"])

        # ── 3. Duplicate density boost (0–2 points) ─────────────────────
        if duplicate_count >= 5:
            score += 2
            factors.append(
                f"High complaint density: {duplicate_count} similar complaints in area"
            )
        elif duplicate_count >= 2:
            score += 1
            factors.append(
                f"Moderate complaint density: {duplicate_count} similar complaints"
            )

        # ── 4. Text detail bonus (0–1 point) ────────────────────────────
        # Longer, more detailed complaints may indicate more severe issues
        word_count = len(text.split())
        if word_count > 50:
            score += 1
            factors.append(f"Detailed complaint ({word_count} words)")

        # ── Clamp and map to label ──────────────────────────────────────
        score = min(score, 10)
        priority = self._score_to_label(score)

        return {
            "priority": priority,
            "score": score,
            "factors": factors,
        }

    def _check_keywords(self, text_lower: str) -> dict | None:
        """
        Check text against keyword severity tiers.
        Returns the highest matching tier only (no double-counting).
        """
        # Check Critical keywords first
        for kw in self.CRITICAL_KEYWORDS:
            if kw in text_lower:
                return {
                    "points": 4,
                    "reason": f"🔴 Critical keyword detected: '{kw}'",
                }

        # Check High keywords
        for kw in self.HIGH_KEYWORDS:
            if kw in text_lower:
                return {
                    "points": 2,
                    "reason": f"🟠 High-severity keyword: '{kw}'",
                }

        # Check Medium keywords
        for kw in self.MEDIUM_KEYWORDS:
            if kw in text_lower:
                return {
                    "points": 1,
                    "reason": f"🟡 Medium-severity keyword: '{kw}'",
                }

        return None

    @staticmethod
    def _score_to_label(score: int) -> str:
        """Map numeric score to priority label."""
        if score >= 8:
            return "Critical"
        elif score >= 5:
            return "High"
        elif score >= 3:
            return "Medium"
        else:
            return "Low"
