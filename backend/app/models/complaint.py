from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict

class DepartmentCategory(str, Enum):
    WATER = "Water Supply"
    ELECTRICITY = "Electricity & Power"
    ROADS = "Roads & Infrastructure"
    SANITATION = "Sanitation & Waste Management"
    HEALTH = "Public Health"
    SAFETY = "Public Safety"
    ENVIRONMENT = "Environmental Issues"
    TRANSPORT = "Public Transport"

class PriorityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class ComplaintStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    REJECTED = "Rejected"

class GeoPoint(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]

class StatusHistoryItem(BaseModel):
    status: ComplaintStatus
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: str = "System"
    comment: Optional[str] = None

class ContactInfo(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class ComplaintDocument(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    complaint_number: str
    raw_text: str
    translated_text: str
    detected_language: str = "en"
    
    category: DepartmentCategory
    category_confidence: float = 1.0
    
    priority_level: PriorityLevel
    priority_score: float  # 0 to 100
    priority_reasons: List[str] = []
    
    status: ComplaintStatus = ComplaintStatus.OPEN
    status_history: List[StatusHistoryItem] = []
    
    location: GeoPoint
    address_text: Optional[str] = None
    
    media_urls: List[str] = []
    contact_info: Optional[ContactInfo] = None
    
    embedding: List[float] = []  # 384 dimensions
    
    is_duplicate: bool = False
    duplicate_of: Optional[str] = None  # Master complaint_id if duplicate
    similarity_score: Optional[float] = None
    duplicate_count: int = 0  # Number of duplicates referencing this master complaint
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={datetime: lambda dt: dt.isoformat()}
    )
