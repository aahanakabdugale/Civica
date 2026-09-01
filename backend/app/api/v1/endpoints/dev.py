import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database
from app.models.complaint import DepartmentCategory, PriorityLevel, ComplaintStatus, GeoPoint, StatusHistoryItem
from app.services.embedding_service import embedding_service
from app.services.translation_service import translation_service
from app.services.ai_classifier import ai_classifier_service
from app.services.priority_engine import priority_engine_service

router = APIRouter()

SEED_COMPLAINT_TEMPLATES = [
    # Water
    {"text": "Severe water pipeline leak near main market junction causing heavy road flooding and water loss.", "cat": DepartmentCategory.WATER, "img": "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=800&auto=format&fit=crop"},
    {"text": "पानी का पाइप टूट गया है और 2 दिन से पीने का साफ पानी नहीं आ रहा है।", "cat": DepartmentCategory.WATER, "img": "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=800&auto=format&fit=crop"},
    {"text": "Water pipeline burst on 5th avenue near primary school, huge water wastage.", "cat": DepartmentCategory.WATER, "img": ""},
    {"text": "Dirty yellow sewage contaminated water coming out of municipal tap water lines.", "cat": DepartmentCategory.WATER, "img": ""},
    
    # Electricity
    {"text": "Live high-voltage electric wire snapped and hanging dangerously over the pedestrian foot path near park entrance!", "cat": DepartmentCategory.ELECTRICITY, "img": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop"},
    {"text": "ट्रांसफार्मर में आग लग गई है और जोर से पटाखे की आवाज आ रही है, पूरे इलाके में बिजली बंद है।", "cat": DepartmentCategory.ELECTRICITY, "img": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop"},
    {"text": "Live wire hanging from pole near public park near main gate.", "cat": DepartmentCategory.ELECTRICITY, "img": ""},
    {"text": "Street lights not working for the last 5 days on 3rd main road, creating darkness and safety issues for women.", "cat": DepartmentCategory.ELECTRICITY, "img": ""},
    
    # Roads
    {"text": "Deep dangerous pothole on bridge approach road causing multiple motorcycle accidents.", "cat": DepartmentCategory.ROADS, "img": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop"},
    {"text": "सड़क पर बड़ा गड्डा हो गया है जिससे गाड़ियाँ टकरा रही हैं।", "cat": DepartmentCategory.ROADS, "img": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop"},
    {"text": "Huge pothole on main bridge road near traffic signal.", "cat": DepartmentCategory.ROADS, "img": ""},
    {"text": "Caved in asphalt road near metro station exitgate, severe threat to heavy vehicles.", "cat": DepartmentCategory.ROADS, "img": ""},
    
    # Sanitation
    {"text": "Huge uncollected garbage dump overflowing near vegetable market causing terrible foul smell and fly infestation.", "cat": DepartmentCategory.SANITATION, "img": "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop"},
    {"text": "नाले का गंदा कचरा और बदबूदार पानी पूरी सड़क पर बह रहा है।", "cat": DepartmentCategory.SANITATION, "img": "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop"},
    {"text": "Overflowing garbage bin near main market entrance stinking heavily.", "cat": DepartmentCategory.SANITATION, "img": ""},
    {"text": "Blocked public sewer gutter line overflowing into residential apartments.", "cat": DepartmentCategory.SANITATION, "img": ""},
    
    # Health
    {"text": "Stray dog pack biting pedestrians near government school playground.", "cat": DepartmentCategory.HEALTH, "img": ""},
    {"text": "डेंगू मच्छर बढ़ रहे हैं क्योंकि यहाँ खुले में पानी जमा है।", "cat": DepartmentCategory.HEALTH, "img": ""},
    {"text": "Stray dogs attacking children near primary school building.", "cat": DepartmentCategory.HEALTH, "img": ""},
    
    # Safety
    {"text": "Open hazardous manhole without lid on busy market lane, severe threat to pedestrians at night!", "cat": DepartmentCategory.SAFETY, "img": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop"},
    {"text": "खुला हुआ सीवर मेनहोल जिसमें रात को बच्चा गिर सकता है।", "cat": DepartmentCategory.SAFETY, "img": ""},
    {"text": "Open manhole cover missing on 2nd cross street.", "cat": DepartmentCategory.SAFETY, "img": ""},
    {"text": "Old dilapidated building wall leaning dangerously towards main street.", "cat": DepartmentCategory.SAFETY, "img": ""},
    
    # Environment
    {"text": "Industrial factory releasing thick toxic black smoke into residential area air at night.", "cat": DepartmentCategory.ENVIRONMENT, "img": ""},
    {"text": "Heavy chemical dust and noise pollution near river bank.", "cat": DepartmentCategory.ENVIRONMENT, "img": ""},
    
    # Transport
    {"text": "City bus stop shelter completely broken and glass shattered on bus stand.", "cat": DepartmentCategory.TRANSPORT, "img": ""},
    {"text": "Public transit bus skipping designated bus stop consistently during peak office hours.", "cat": DepartmentCategory.TRANSPORT, "img": ""}
]

CITY_CENTERS = {
    "mumbai": (19.0760, 72.8777),
    "delhi": (28.6139, 77.2090),
    "bengaluru": (12.9716, 77.5946),
    "pune": (18.5204, 73.8567)
}

@router.post("/seed", summary="Seed database with realistic multi-category grievances & duplicate clusters")
async def seed_database(
    city: str = Query("mumbai", description="Target city bounds: mumbai, delhi, bengaluru, pune"),
    count: int = Query(35, ge=10, le=100, description="Total complaints to seed"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    base_lat, base_lng = CITY_CENTERS.get(city.lower(), CITY_CENTERS["mumbai"])
    
    created_docs = []
    # Store master complaints to generate duplicates
    master_records = {} # category -> list of master doc data

    now = datetime.now(timezone.utc)
    
    for i in range(count):
        template = random.choice(SEED_COMPLAINT_TEMPLATES)
        raw_text = template["text"]
        
        # 1. Translation
        trans_text, lang = translation_service.translate_and_detect(raw_text)
        
        # 2. Embedding
        embedding_vec = embedding_service.generate_embedding(trans_text)
        
        # 3. Classification
        category, conf = ai_classifier_service.classify_complaint(trans_text, embedding_vec, template["cat"])
        
        # Determine if this should be a duplicate cluster member
        is_dup = False
        master_id = None
        sim_score = None
        
        cat_masters = master_records.get(category, [])
        if cat_masters and random.random() < 0.30: # 30% chance of creating duplicate of an existing master
            master = random.choice(cat_masters)
            is_dup = True
            master_id = master["_id_str"]
            sim_score = round(random.uniform(0.84, 0.96), 3)
            # Place close to master (within 50-200 meters)
            lat = master["lat"] + random.uniform(-0.001, 0.001)
            lng = master["lng"] + random.uniform(-0.001, 0.001)
        else:
            # Random location within city (~2km radius)
            lat = base_lat + random.uniform(-0.015, 0.015)
            lng = base_lng + random.uniform(-0.015, 0.015)

        # Priority calculation
        priority_lvl, priority_score, priority_reasons = priority_engine_service.calculate_priority(
            category=category,
            text=trans_text,
            nearby_density_count=random.randint(0, 4) if is_dup else 0
        )
        
        # Random status
        status_val = random.choice([
            ComplaintStatus.OPEN.value, ComplaintStatus.OPEN.value,
            ComplaintStatus.IN_PROGRESS.value, ComplaintStatus.RESOLVED.value
        ])
        
        created_days_ago = random.randint(0, 10)
        created_time = now - timedelta(days=created_days_ago, hours=random.randint(0, 23))

        complaint_num = f"CIV-SEED-{uuid.uuid4().hex[:6].upper()}"

        doc_data = {
            "complaint_number": complaint_num,
            "raw_text": raw_text,
            "translated_text": trans_text,
            "detected_language": lang,
            "category": category.value,
            "category_confidence": conf,
            "priority_level": priority_lvl.value,
            "priority_score": priority_score,
            "priority_reasons": priority_reasons,
            "status": status_val,
            "status_history": [
                StatusHistoryItem(status=ComplaintStatus.OPEN, timestamp=created_time, updated_by="System Seed").model_dump()
            ],
            "location": GeoPoint(coordinates=[lng, lat]).model_dump(),
            "address_text": f"Locality near {city.capitalize()} Sector {random.randint(1, 15)}",
            "media_urls": [template["img"]] if template.get("img") else [],
            "contact_info": {"name": f"Citizen_{random.randint(100,999)}", "phone": "+919876543210"},
            "embedding": embedding_vec,
            "is_duplicate": is_dup,
            "duplicate_of": master_id,
            "similarity_score": sim_score,
            "duplicate_count": 0,
            "created_at": created_time,
            "updated_at": created_time
        }

        res = await db["complaints"].insert_one(doc_data)
        doc_id_str = str(res.inserted_id)

        if is_dup and master_id:
            # Increment duplicate_count on master
            try:
                from bson import ObjectId
                await db["complaints"].update_one({"_id": ObjectId(master_id)}, {"$inc": {"duplicate_count": 1}})
            except Exception:
                pass
        else:
            # Register as potential master
            if category not in master_records:
                master_records[category] = []
            master_records[category].append({"_id_str": doc_id_str, "lat": lat, "lng": lng})

        created_docs.append(complaint_num)

    return {
        "message": f"Successfully seeded {len(created_docs)} complaints in {city.capitalize()}.",
        "seeded_complaint_numbers": created_docs[:10]  # Show sample
    }

@router.delete("/clear", summary="Clear all complaints from database (Reset Demo)")
async def clear_database(db: AsyncIOMotorDatabase = Depends(get_database)):
    res = await db["complaints"].delete_many({})
    return {"message": f"Cleared {res.deleted_count} complaints from database."}
