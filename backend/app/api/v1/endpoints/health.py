from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database
from app.core.config import settings

router = APIRouter()

@router.get("/health", summary="Check Backend Health & Database Connectivity")
async def check_health(db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        # Ping MongoDB server
        await db.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": settings.PROJECT_NAME,
        "database": db_status,
        "environment": "debug" if settings.DEBUG else "production"
    }
