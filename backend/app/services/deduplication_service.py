import logging
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.core.config import settings
from app.models.complaint import DepartmentCategory
from app.services.embedding_service import embedding_service

logger = logging.getLogger("civica.deduplication")

class DeduplicationService:
    async def check_duplicate_and_density(
        self,
        db: AsyncIOMotorDatabase,
        latitude: float,
        longitude: float,
        category: DepartmentCategory,
        embedding: List[float]
    ) -> Tuple[bool, Optional[str], Optional[float], int]:
        """
        Executes spatial radius search + vector cosine similarity deduplication.
        Returns: (is_duplicate, master_complaint_id, max_similarity_score, nearby_density_count)
        """
        complaints_col = db["complaints"]
        time_cutoff = datetime.now(timezone.utc) - timedelta(days=settings.DUPLICATE_TIME_WINDOW_DAYS)

        # 1. GeoSpatial query to find nearby open complaints within radius
        geo_query = {
            "location": {
                "$nearSphere": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": [longitude, latitude]
                    },
                    "$maxDistance": settings.DUPLICATE_GEO_RADIUS_METERS
                }
            },
            "category": category.value,
            "created_at": {"$gte": time_cutoff},
            "is_duplicate": False  # Only compare against master complaints
        }

        try:
            cursor = complaints_col.find(geo_query).limit(50)
            nearby_candidates = await cursor.to_list(length=50)
        except Exception as e:
            logger.error(f"Error querying geo nearSphere: {e}")
            nearby_candidates = []

        nearby_density_count = len(nearby_candidates)
        
        if not nearby_candidates or not embedding:
            return False, None, None, nearby_density_count

        best_match_id = None
        max_similarity = 0.0

        # 2. Iterate nearby candidates and compute vector cosine similarity
        for candidate in nearby_candidates:
            candidate_embedding = candidate.get("embedding", [])
            if not candidate_embedding:
                continue
                
            similarity = embedding_service.compute_cosine_similarity(embedding, candidate_embedding)
            
            if similarity > max_similarity:
                max_similarity = similarity
                best_match_id = str(candidate["_id"])

        # 3. Check threshold
        if max_similarity >= settings.DUPLICATE_COSINE_THRESHOLD and best_match_id:
            logger.info(f"Duplicate detected! Matched master complaint ID '{best_match_id}' with similarity {round(max_similarity, 3)}")
            
            # Increment duplicate_count on master complaint asynchronously
            try:
                await complaints_col.update_one(
                    {"_id": ObjectId(best_match_id)},
                    {"$inc": {"duplicate_count": 1}}
                )
            except Exception as e:
                logger.error(f"Failed to increment duplicate count on master complaint: {e}")

            return True, best_match_id, round(max_similarity, 3), nearby_density_count

        return False, None, None, nearby_density_count

deduplication_service = DeduplicationService()
