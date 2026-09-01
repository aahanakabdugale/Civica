from typing import Optional
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database
from app.models.complaint import DepartmentCategory
from app.schemas.analytics import OverviewAnalyticsResponse, HotspotsResponse
from app.services.analytics_service import analytics_service

router = APIRouter()

@router.get("/overview", response_model=OverviewAnalyticsResponse, summary="Get high-level dashboard metrics & aggregations")
async def get_overview(db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Returns summary analytics for authority dashboard:
    - Total, Open, In Progress, Resolved, Rejected counts
    - Duplicate complaint rate %
    - Breakdown by department category
    - Breakdown by priority level
    - Daily submission trend history (last 14 days)
    """
    return await analytics_service.get_overview_analytics(db)

@router.get("/hotspots", response_model=HotspotsResponse, summary="Get spatial hotspots & markers for GIS maps")
async def get_hotspots(
    db: AsyncIOMotorDatabase = Depends(get_database),
    category: Optional[DepartmentCategory] = Query(None, description="Optional department filter for map markers")
):
    """
    Returns spatial coordinate markers for rendering GIS heatmap / cluster map layers in Leaflet or Google Maps.
    """
    return await analytics_service.get_hotspots(db, category)
