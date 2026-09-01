from fastapi import APIRouter
from app.api.v1.endpoints import complaints, analytics, dev, health, auth

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["User Authentication & Roles"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["Complaints Intake & Management"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Dashboard & GIS Analytics"])
api_router.include_router(dev.router, prefix="/dev", tags=["Development & Seeding"])
