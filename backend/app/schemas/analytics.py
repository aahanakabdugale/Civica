from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.complaint import DepartmentCategory, PriorityLevel, ComplaintStatus

class CategoryStat(BaseModel):
    category: DepartmentCategory
    count: int
    open_count: int
    resolved_count: int

class PriorityStat(BaseModel):
    priority_level: PriorityLevel
    count: int

class DailyTrend(BaseModel):
    date: str
    count: int

class OverviewAnalyticsResponse(BaseModel):
    total_complaints: int
    open_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    rejected_complaints: int
    total_duplicates: int
    duplicate_rate_percentage: float
    category_breakdown: List[CategoryStat]
    priority_breakdown: List[PriorityStat]
    daily_trends: List[DailyTrend]

class HotspotMarker(BaseModel):
    id: str
    complaint_number: str
    raw_text: str
    category: DepartmentCategory
    priority_level: PriorityLevel
    priority_score: float
    status: ComplaintStatus
    latitude: float
    longitude: float
    density_score: int
    is_duplicate: bool
    address_text: Optional[str]
    media_url: Optional[str] = None
    created_at: datetime

class HotspotsResponse(BaseModel):
    markers: List[HotspotMarker]
    total_markers: int
