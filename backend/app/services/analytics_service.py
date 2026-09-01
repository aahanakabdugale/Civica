import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.analytics import (
    OverviewAnalyticsResponse, CategoryStat, PriorityStat, DailyTrend, HotspotsResponse, HotspotMarker
)
from app.models.complaint import DepartmentCategory, PriorityLevel, ComplaintStatus

logger = logging.getLogger("civica.analytics")

class AnalyticsService:
    async def get_overview_analytics(self, db: AsyncIOMotorDatabase) -> OverviewAnalyticsResponse:
        complaints_col = db["complaints"]
        
        # 1. Total counts
        total = await complaints_col.count_documents({})
        open_cnt = await complaints_col.count_documents({"status": ComplaintStatus.OPEN.value})
        in_prog_cnt = await complaints_col.count_documents({"status": ComplaintStatus.IN_PROGRESS.value})
        resolved_cnt = await complaints_col.count_documents({"status": ComplaintStatus.RESOLVED.value})
        rejected_cnt = await complaints_col.count_documents({"status": ComplaintStatus.REJECTED.value})
        duplicate_cnt = await complaints_col.count_documents({"is_duplicate": True})

        duplicate_rate = round((duplicate_cnt / total * 100.0), 1) if total > 0 else 0.0

        # 2. Category breakdown aggregation
        category_pipeline = [
            {
                "$group": {
                    "_id": "$category",
                    "count": {"$sum": 1},
                    "open_count": {
                        "$sum": {"$cond": [{"$eq": ["$status", ComplaintStatus.OPEN.value]}, 1, 0]}
                    },
                    "resolved_count": {
                        "$sum": {"$cond": [{"$eq": ["$status", ComplaintStatus.RESOLVED.value]}, 1, 0]}
                    }
                }
            }
        ]
        
        cat_results = await complaints_col.aggregate(category_pipeline).to_list(length=20)
        cat_stats = []
        for item in cat_results:
            cat_val = item["_id"]
            if cat_val in [c.value for c in DepartmentCategory]:
                cat_stats.append(CategoryStat(
                    category=DepartmentCategory(cat_val),
                    count=item["count"],
                    open_count=item["open_count"],
                    resolved_count=item["resolved_count"]
                ))

        # 3. Priority breakdown aggregation
        priority_pipeline = [
            {
                "$group": {
                    "_id": "$priority_level",
                    "count": {"$sum": 1}
                }
            }
        ]
        prio_results = await complaints_col.aggregate(priority_pipeline).to_list(length=10)
        prio_stats = []
        for item in prio_results:
            prio_val = item["_id"]
            if prio_val in [p.value for p in PriorityLevel]:
                prio_stats.append(PriorityStat(
                    priority_level=PriorityLevel(prio_val),
                    count=item["count"]
                ))

        # 4. Daily trend aggregation (last 14 days)
        fourteen_days_ago = datetime.now(timezone.utc) - timedelta(days=14)
        trend_pipeline = [
            {"$match": {"created_at": {"$gte": fourteen_days_ago}}},
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        trend_results = await complaints_col.aggregate(trend_pipeline).to_list(length=30)
        daily_trends = [DailyTrend(date=item["_id"], count=item["count"]) for item in trend_results if item["_id"]]

        return OverviewAnalyticsResponse(
            total_complaints=total,
            open_complaints=open_cnt,
            in_progress_complaints=in_prog_cnt,
            resolved_complaints=resolved_cnt,
            rejected_complaints=rejected_cnt,
            total_duplicates=duplicate_cnt,
            duplicate_rate_percentage=duplicate_rate,
            category_breakdown=cat_stats,
            priority_breakdown=prio_stats,
            daily_trends=daily_trends
        )

    async def get_hotspots(
        self,
        db: AsyncIOMotorDatabase,
        category: Optional[DepartmentCategory] = None
    ) -> HotspotsResponse:
        complaints_col = db["complaints"]
        query = {"status": {"$ne": ComplaintStatus.RESOLVED.value}}
        if category:
            query["category"] = category.value

        cursor = complaints_col.find(query).limit(200)
        docs = await cursor.to_list(length=200)
        
        markers = []
        for doc in docs:
            coords = doc.get("location", {}).get("coordinates", [0.0, 0.0])
            markers.append(HotspotMarker(
                id=str(doc["_id"]),
                complaint_number=doc["complaint_number"],
                raw_text=doc.get("raw_text", ""),
                category=DepartmentCategory(doc["category"]),
                priority_level=PriorityLevel(doc["priority_level"]),
                priority_score=doc.get("priority_score", 0.0),
                status=ComplaintStatus(doc["status"]),
                longitude=coords[0],
                latitude=coords[1],
                density_score=doc.get("duplicate_count", 0) + 1,
                is_duplicate=doc.get("is_duplicate", False),
                address_text=doc.get("address_text"),
                media_url=doc.get("media_urls", [None])[0] if doc.get("media_urls") else None,
                created_at=doc["created_at"]
            ))

        return HotspotsResponse(
            markers=markers,
            total_markers=len(markers)
        )

analytics_service = AnalyticsService()
