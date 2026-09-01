import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.v1.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("civica.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Civica Backend Application Lifespan...")
    await connect_to_mongo()
    yield
    await close_mongo_connection()
    logger.info("Civica Backend Application Shutdown Complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Citizen Grievance Classification, Urgency Prioritization & Spatial Duplicate Detection Platform API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    redirect_slashes=False
)

# Enable CORS for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production setup can restrict to specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Uploads Storage Directory
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Mount API V1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/demo", response_class=HTMLResponse, summary="Interactive Frontend Testing Dashboard UI")
@app.get("/test", response_class=HTMLResponse, include_in_schema=False)
async def demo_ui():
    html_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_dashboard.html")
    if os.path.exists(html_file):
        with open(html_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>Test Dashboard HTML file not found</h1>")

@app.get("/", summary="Root API Index")
async def root():
    return {
        "title": settings.PROJECT_NAME,
        "version": "1.0.0",
        "documentation": "/docs",
        "interactive_demo_ui": "/demo",
        "health_check": f"{settings.API_V1_STR}/health"
    }
