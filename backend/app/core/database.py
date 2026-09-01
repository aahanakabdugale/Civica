import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("civica.database")

class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db_instance = Database()

async def connect_to_mongo():
    logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    db_instance.client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        maxPoolSize=50,
        minPoolSize=10
    )
    db_instance.db = db_instance.client[settings.DATABASE_NAME]

    # Initialize MongoDB Indexes
    complaints_collection = db_instance.db["complaints"]
    
    # 1. GeoJSON 2DSphere Index on location for spatial radius searches
    await complaints_collection.create_index([("location", "2dsphere")])
    
    # 2. Indexes for fast filtering & lookup
    await complaints_collection.create_index([("complaint_number", 1)], unique=True)
    await complaints_collection.create_index([("category", 1)])
    await complaints_collection.create_index([("status", 1)])
    await complaints_collection.create_index([("priority_level", 1)])
    await complaints_collection.create_index([("is_duplicate", 1)])
    await complaints_collection.create_index([("duplicate_of", 1)])
    await complaints_collection.create_index([("created_at", -1)])
    await complaints_collection.create_index([("category", 1), ("status", 1), ("created_at", -1)])

    # 3. Unique index on user emails
    users_collection = db_instance.db["users"]
    await users_collection.create_index([("email", 1)], unique=True)

    logger.info("MongoDB connection established and 2DSphere / compound indexes verified successfully.")

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection pool...")
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_database() -> AsyncIOMotorDatabase:
    if db_instance.db is None:
        raise RuntimeError("Database connection has not been initialized.")
    return db_instance.db
