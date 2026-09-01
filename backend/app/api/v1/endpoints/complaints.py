import os
import uuid
import math
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Path, File, UploadFile, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.database import get_database
from app.core.exceptions import ComplaintNotFoundException
from app.models.complaint import (
    ComplaintDocument, DepartmentCategory, PriorityLevel, ComplaintStatus,
    StatusHistoryItem, GeoPoint
)
from app.schemas.complaint import (
    ComplaintCreate, ComplaintResponse, ComplaintListResponse, StatusUpdateSchema, DuplicateRefResponse
)
from app.services.translation_service import translation_service
from app.services.embedding_service import embedding_service
from app.services.ai_classifier import ai_classifier_service
from app.services.priority_engine import priority_engine_service
from app.services.deduplication_service import deduplication_service

router = APIRouter()

def generate_complaint_number() -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_str = uuid.uuid4().hex[:6].upper()
    return f"CIV-{date_str}-{random_str}"

@router.post("/upload-media", summary="Upload complaint photo or attachment")
async def upload_complaint_media(file: UploadFile = File(...)):
    """
    Accepts photo uploads (Camera / File picker) and saves to server static storage.
    Returns relative URL path for media_urls array.
    """
    if not file.content_type.startswith("image/") and file.content_type != "application/pdf":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image and PDF files are allowed.")
    
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"media_{uuid.uuid4().hex[:12]}{ext}"
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    upload_dir = os.path.join(base_dir, "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
        
    return {
        "url": f"/uploads/{filename}",
        "filename": filename,
        "content_type": file.content_type,
        "size_bytes": len(content)
    }

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED, summary="Submit a new citizen grievance")
@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_complaint(
    payload: ComplaintCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Complete Pipeline Execution:
    1. Language Detection & Translation to English
    2. Vector Embedding Generation (384d MiniLM)
    3. AI Department Classification
    4. Geo-Spatial + Cosine Vector Deduplication Check
    5. Multi-Factor Priority Scoring Engine
    6. MongoDB Storage with 2DSphere Indexing
    """
    # 1. Translation & Language Normalization
    translated_text, detected_lang = translation_service.translate_and_detect(payload.description)
    
    # 2. Embedding Generation
    embedding_vec = embedding_service.generate_embedding(translated_text)
    
    # 3. AI Category Classification
    category, confidence = ai_classifier_service.classify_complaint(
        text=translated_text,
        embedding=embedding_vec,
        user_hint=payload.category_hint
    )
    
    # 4. Deduplication Engine (Radius search + Cosine Similarity)
    is_duplicate, master_id, sim_score, nearby_density = await deduplication_service.check_duplicate_and_density(
        db=db,
        latitude=payload.latitude,
        longitude=payload.longitude,
        category=category,
        embedding=embedding_vec
    )
    
    # 5. Priority Scoring Engine
    priority_lvl, priority_score, priority_reasons = priority_engine_service.calculate_priority(
        category=category,
        text=translated_text,
        nearby_density_count=nearby_density
    )
    
    # Construct GeoJSON Point
    geo_point = GeoPoint(coordinates=[payload.longitude, payload.latitude])
    complaint_num = generate_complaint_number()
    
    now = datetime.now(timezone.utc)
    initial_status_item = StatusHistoryItem(
        status=ComplaintStatus.OPEN,
        timestamp=now,
        updated_by="System Intake",
        comment="Complaint submitted and processed by AI engine."
    )

    doc_data = {
        "complaint_number": complaint_num,
        "raw_text": payload.description,
        "translated_text": translated_text,
        "detected_language": detected_lang,
        "category": category.value,
        "category_confidence": confidence,
        "priority_level": priority_lvl.value,
        "priority_score": priority_score,
        "priority_reasons": priority_reasons,
        "status": ComplaintStatus.OPEN.value,
        "status_history": [initial_status_item.model_dump()],
        "location": geo_point.model_dump(),
        "address_text": payload.address_text,
        "media_urls": payload.media_urls or [],
        "contact_info": payload.contact_info.model_dump() if payload.contact_info else None,
        "embedding": embedding_vec,
        "is_duplicate": is_duplicate,
        "duplicate_of": master_id,
        "similarity_score": sim_score,
        "duplicate_count": 0,
        "created_at": now,
        "updated_at": now
    }

    result = await db["complaints"].insert_one(doc_data)
    inserted_id = str(result.inserted_id)
    doc_data["id"] = inserted_id
    doc_data["_id"] = inserted_id

    # Master complaint details lookup if duplicate
    master_ref = None
    if is_duplicate and master_id:
        try:
            m_doc = await db["complaints"].find_one({"_id": ObjectId(master_id)})
            if m_doc:
                master_ref = DuplicateRefResponse(
                    id=str(m_doc["_id"]),
                    complaint_number=m_doc["complaint_number"],
                    raw_text=m_doc["raw_text"],
                    status=ComplaintStatus(m_doc["status"]),
                    created_at=m_doc["created_at"]
                )
        except Exception:
            pass

    doc_data["master_complaint"] = master_ref
    return ComplaintResponse(**doc_data)

@router.get("", response_model=ComplaintListResponse, summary="List complaints with pagination & filters")
@router.get("/", response_model=ComplaintListResponse, include_in_schema=False)
async def list_complaints(
    db: AsyncIOMotorDatabase = Depends(get_database),
    category: Optional[DepartmentCategory] = Query(None, description="Filter by department"),
    priority_level: Optional[PriorityLevel] = Query(None, description="Filter by priority"),
    status_filter: Optional[ComplaintStatus] = Query(None, alias="status", description="Filter by status"),
    is_duplicate: Optional[bool] = Query(None, description="Filter duplicates or master complaints"),
    search: Optional[str] = Query(None, description="Text search query across complaint text"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(15, ge=1, le=100, description="Items per page")
):
    query = {}
    if category:
        query["category"] = category.value
    if priority_level:
        query["priority_level"] = priority_level.value
    if status_filter:
        query["status"] = status_filter.value
    if is_duplicate is not None:
        query["is_duplicate"] = is_duplicate
    if search:
        query["$or"] = [
            {"raw_text": {"$regex": search, "$options": "i"}},
            {"translated_text": {"$regex": search, "$options": "i"}},
            {"complaint_number": {"$regex": search, "$options": "i"}},
            {"address_text": {"$regex": search, "$options": "i"}}
        ]

    total = await db["complaints"].count_documents(query)
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    skip = (page - 1) * page_size

    cursor = db["complaints"].find(query).sort("created_at", -1).skip(skip).limit(page_size)
    docs = await cursor.to_list(length=page_size)

    items = []
    for doc in docs:
        doc["id"] = str(doc["_id"])
        doc["_id"] = str(doc["_id"])
        
        # Populate master complaint reference if duplicate
        if doc.get("is_duplicate") and doc.get("duplicate_of"):
            try:
                m_doc = await db["complaints"].find_one({"_id": ObjectId(doc["duplicate_of"])})
                if m_doc:
                    doc["master_complaint"] = DuplicateRefResponse(
                        id=str(m_doc["_id"]),
                        complaint_number=m_doc["complaint_number"],
                        raw_text=m_doc["raw_text"],
                        status=ComplaintStatus(m_doc["status"]),
                        created_at=m_doc["created_at"]
                    )
            except Exception:
                pass

        items.append(ComplaintResponse(**doc))

    return ComplaintListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{id_or_number}", response_model=ComplaintResponse, summary="Get single complaint by ID or Complaint Number")
async def get_complaint_by_id(
    id_or_number: str = Path(..., description="ObjectId string or complaint tracking number (e.g. CIV-20260901-8X2A)"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    query = {"complaint_number": id_or_number}
    if ObjectId.is_valid(id_or_number):
        query = {"$or": [{"_id": ObjectId(id_or_number)}, {"complaint_number": id_or_number}]}

    doc = await db["complaints"].find_one(query)
    if not doc:
        raise ComplaintNotFoundException(id_or_number)

    doc["id"] = str(doc["_id"])
    doc["_id"] = str(doc["_id"])

    if doc.get("is_duplicate") and doc.get("duplicate_of"):
        try:
            m_doc = await db["complaints"].find_one({"_id": ObjectId(doc["duplicate_of"])})
            if m_doc:
                doc["master_complaint"] = DuplicateRefResponse(
                    id=str(m_doc["_id"]),
                    complaint_number=m_doc["complaint_number"],
                    raw_text=m_doc["raw_text"],
                    status=ComplaintStatus(m_doc["status"]),
                    created_at=m_doc["created_at"]
                )
        except Exception:
            pass

    return ComplaintResponse(**doc)

@router.patch("/{id_or_number}/status", response_model=ComplaintResponse, summary="Update complaint status (Authority Dashboard)")
async def update_complaint_status(
    payload: StatusUpdateSchema,
    id_or_number: str = Path(..., description="ObjectId string or complaint tracking number"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    query = {"complaint_number": id_or_number}
    if ObjectId.is_valid(id_or_number):
        query = {"$or": [{"_id": ObjectId(id_or_number)}, {"complaint_number": id_or_number}]}

    doc = await db["complaints"].find_one(query)
    if not doc:
        raise ComplaintNotFoundException(id_or_number)

    now = datetime.now(timezone.utc)
    new_history_item = StatusHistoryItem(
        status=payload.status,
        timestamp=now,
        updated_by=payload.updated_by or "Municipal Officer",
        comment=payload.comment or f"Status changed to {payload.status.value}"
    )

    update_fields = {
        "status": payload.status.value,
        "updated_at": now
    }

    await db["complaints"].update_one(
        {"_id": doc["_id"]},
        {
            "$set": update_fields,
            "$push": {"status_history": new_history_item.model_dump()}
        }
    )

    updated_doc = await db["complaints"].find_one({"_id": doc["_id"]})
    updated_doc["id"] = str(updated_doc["_id"])
    updated_doc["_id"] = str(updated_doc["_id"])
    
    return ComplaintResponse(**updated_doc)
