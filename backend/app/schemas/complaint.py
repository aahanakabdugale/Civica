from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from app.models.complaint import DepartmentCategory, PriorityLevel, ComplaintStatus, ContactInfo, StatusHistoryItem, GeoPoint

class ComplaintCreate(BaseModel):
    description: str = Field(..., min_length=5, description="Detailed text description of the grievance")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="GPS Latitude")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="GPS Longitude")
    address_text: Optional[str] = Field(None, description="Human readable address or locality")
    category_hint: Optional[DepartmentCategory] = Field(None, description="Optional user category suggestion")
    contact_info: Optional[ContactInfo] = Field(None, description="Citizen contact details")
    media_urls: Optional[List[str]] = Field(default_factory=list, description="Uploaded photo or document URLs")

    @field_validator('description')
    @classmethod
    def clean_text(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5:
            raise ValueError("Complaint description must be at least 5 characters long.")
        return v

class StatusUpdateSchema(BaseModel):
    status: ComplaintStatus
    updated_by: Optional[str] = Field("Municipal Officer", description="Name/role of official making update")
    comment: Optional[str] = Field(None, description="Notes regarding resolution or status change")

class DuplicateRefResponse(BaseModel):
    id: str
    complaint_number: str
    raw_text: str
    status: ComplaintStatus
    created_at: datetime

class ComplaintResponse(BaseModel):
    id: str
    complaint_number: str
    raw_text: str
    translated_text: str
    detected_language: str
    category: DepartmentCategory
    category_confidence: float
    priority_level: PriorityLevel
    priority_score: float
    priority_reasons: List[str]
    status: ComplaintStatus
    status_history: List[StatusHistoryItem]
    location: GeoPoint
    address_text: Optional[str]
    media_urls: List[str]
    contact_info: Optional[ContactInfo]
    is_duplicate: bool
    duplicate_of: Optional[str]
    similarity_score: Optional[float]
    duplicate_count: int
    created_at: datetime
    updated_at: datetime
    master_complaint: Optional[DuplicateRefResponse] = None

class ComplaintListResponse(BaseModel):
    items: List[ComplaintResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
