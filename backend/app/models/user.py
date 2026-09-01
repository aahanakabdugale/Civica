from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, EmailStr

class UserRole(str, Enum):
    CITIZEN = "citizen"
    AUTHORITY_ADMIN = "authority_admin"

class UserInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    full_name: str
    hashed_password: str
    role: UserRole = UserRole.CITIZEN
    department: Optional[str] = None  # e.g., "Sanitation & Waste Management" for admins
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
