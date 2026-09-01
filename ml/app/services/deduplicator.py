"""
Duplicate / Similarity Detection Service.

Detects whether a new citizen complaint is a duplicate of an existing one
by combining three signals:
  1. Semantic similarity (cosine similarity of sentence embeddings)
  2. Geographic proximity (haversine distance between GPS coordinates)
  3. Temporal recency (complaints closer in time are more likely duplicates)

The three signals are combined into a weighted composite score.
If the score exceeds a configurable threshold, the complaint is flagged as duplicate.
"""

import logging
from math import radians, sin, cos, sqrt, atan2

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from app.config import settings

logger = logging.getLogger(__name__)


class DeduplicatorService:
    """
    Stateless duplicate detection engine.

    The backend is responsible for:
    1. Querying the DB for candidate complaints (same category, within time window)
    2. Passing them to this service for comparison
    3. Updating the DB with duplicate linkage

    This service only does the math — no DB access.
    """

    def __init__(self):
        # Load thresholds from config (tunable via environment variables)
        self.cosine_threshold = settings.COSINE_THRESHOLD
        self.geo_radius_km = settings.GEO_RADIUS_KM
        self.time_window_days = settings.TIME_WINDOW_DAYS
        self.composite_threshold = settings.COMPOSITE_THRESHOLD
        self.weight_cosine = settings.WEIGHT_COSINE
        self.weight_geo = settings.WEIGHT_GEO
        self.weight_time = settings.WEIGHT_TIME

        logger.info(
            f"Deduplicator initialized: "
            f"cosine>={self.cosine_threshold}, "
            f"geo<={self.geo_radius_km}km, "
            f"time<={self.time_window_days}d, "
            f"composite>={self.composite_threshold}"
        )

    @staticmethod
    def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the great-circle distance between two GPS points in kilometers.
        Uses the Haversine formula.
        """
        R = 6371  # Earth's radius in km

        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)

        a = (
            sin(dlat / 2) ** 2
            + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
        )
        c = 2 * atan2(sqrt(a), sqrt(1 - a))

        return R * c

    def geo_score(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Compute geographic proximity score.

        Returns:
            1.0 — exact same location
            0.0 — at or beyond GEO_RADIUS_KM apart
            Linear interpolation in between
        """
        dist = self.haversine_km(lat1, lon1, lat2, lon2)
        if dist >= self.geo_radius_km:
            return 0.0
        return 1.0 - (dist / self.geo_radius_km)

    def time_score(self, days_apart: float) -> float:
        """
        Compute temporal recency score.

        Returns:
            1.0 — same day
            0.0 — TIME_WINDOW_DAYS or more apart
            Linear decay in between
        """
        if days_apart >= self.time_window_days:
            return 0.0
        return 1.0 - (days_apart / self.time_window_days)

    def check_duplicates(
        self,
        new_embedding: list[float],
        new_lat: float,
        new_lon: float,
        new_category: str,
        existing_complaints: list[dict],
    ) -> dict:
        """
        Compare a new complaint against a list of existing complaints.

        Args:
            new_embedding: 384-dim embedding vector of the new complaint
            new_lat: Latitude of the new complaint
            new_lon: Longitude of the new complaint
            new_category: Classified department of the new complaint
            existing_complaints: List of dicts from the DB, each containing:
                - id: int
                - embedding: list[float]
                - latitude: float
                - longitude: float
                - category: str
                - days_ago: float

        Returns:
            {
                "is_duplicate": bool,
                "best_match_id": int | None,
                "best_match_score": float | None,
                "duplicates": [
                    {
                        "duplicate_of": int,
                        "cosine_sim": float,
                        "geo_dist_km": float,
                        "composite_score": float
                    },
                    ...
                ]
            }
        """
        if not existing_complaints:
            return {
                "is_duplicate": False,
                "best_match_id": None,
                "best_match_score": None,
                "duplicates": [],
            }

        new_emb = np.array(new_embedding).reshape(1, -1)
        duplicates = []

        for complaint in existing_complaints:
            # ── Filter 1: Category match ────────────────────────────────
            # Only compare within the same department
            if complaint.get("category") != new_category:
                continue

            # ── Filter 2: Time window ───────────────────────────────────
            days_ago = complaint.get("days_ago", 0)
            if days_ago > self.time_window_days:
                continue

            # ── Cosine similarity ───────────────────────────────────────
            existing_emb = np.array(complaint["embedding"]).reshape(1, -1)
            cos_sim = float(cosine_similarity(new_emb, existing_emb)[0][0])

            # Quick reject: skip if semantic similarity is too low
            if cos_sim < 0.50:
                continue

            # ── Geographic proximity ────────────────────────────────────
            comp_lat = complaint.get("latitude", 0)
            comp_lon = complaint.get("longitude", 0)

            g_score = 0.0
            geo_dist = 0.0
            if new_lat and new_lon and comp_lat and comp_lon:
                geo_dist = self.haversine_km(new_lat, new_lon, comp_lat, comp_lon)
                g_score = self.geo_score(new_lat, new_lon, comp_lat, comp_lon)
            else:
                # If no GPS data, give a neutral geo score
                g_score = 0.5
                geo_dist = -1  # Unknown

            # ── Temporal recency ────────────────────────────────────────
            t_score = self.time_score(days_ago)

            # ── Composite score ─────────────────────────────────────────
            composite = (
                self.weight_cosine * cos_sim
                + self.weight_geo * g_score
                + self.weight_time * t_score
            )

            if composite >= self.composite_threshold:
                duplicates.append({
                    "duplicate_of": complaint["id"],
                    "cosine_sim": round(cos_sim, 4),
                    "geo_dist_km": round(geo_dist, 3),
                    "composite_score": round(composite, 4),
                })

                logger.info(
                    f"Duplicate found: complaint #{complaint['id']} "
                    f"(cosine={cos_sim:.3f}, geo={geo_dist:.3f}km, "
                    f"composite={composite:.3f})"
                )

        # Sort by composite score (strongest match first)
        duplicates.sort(key=lambda x: x["composite_score"], reverse=True)

        is_duplicate = len(duplicates) > 0
        best_match_id = duplicates[0]["duplicate_of"] if is_duplicate else None
        best_match_score = duplicates[0]["composite_score"] if is_duplicate else None

        return {
            "is_duplicate": is_duplicate,
            "best_match_id": best_match_id,
            "best_match_score": best_match_score,
            "duplicates": duplicates,
        }
