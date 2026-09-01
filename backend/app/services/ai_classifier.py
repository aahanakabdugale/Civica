import logging
from typing import Tuple, Optional
from app.models.complaint import DepartmentCategory
from app.services.embedding_service import embedding_service

logger = logging.getLogger("civica.classifier")

# Department semantic anchors and keyword profiles
DEPARTMENT_PROFILES = {
    DepartmentCategory.WATER: {
        "keywords": ["water", "leak", "pipeline", "tap", "drainage", "sewage", "tanker", "contamination", "drinking water", "supply", "borewell"],
        "anchor_text": "Water pipeline leakage, no drinking water supply, low water pressure, contaminated dirty tap water, broken pipe."
    },
    DepartmentCategory.ELECTRICITY: {
        "keywords": ["electricity", "power", "light", "current", "transformer", "wire", "voltage", "blackout", "pole", "spark", "meter"],
        "anchor_text": "Electricity power outage, broken live wire hanging, transformer spark, street lights not working, high voltage fluctuation."
    },
    DepartmentCategory.ROADS: {
        "keywords": ["road", "pothole", "asphalt", "footpath", "bridge", "tar", "traffic signal", "caved", "divider", "construction"],
        "anchor_text": "Broken road with severe potholes, damaged asphalt sidewalk footpath, caved in road, traffic light broken."
    },
    DepartmentCategory.SANITATION: {
        "keywords": ["garbage", "trash", "waste", "cleaning", "gutter", "drain", "stink", "dump", "dustbin", "toilet", "filth"],
        "anchor_text": "Uncollected garbage dump overflow, stink from trash bin, blocked sewer gutter, filth on street, public toilet cleaning."
    },
    DepartmentCategory.HEALTH: {
        "keywords": ["health", "dengue", "mosquitoes", "disease", "stray dog", "bite", "hospital", "epidemic", "contamination", "sanitary"],
        "anchor_text": "Stray dog bite menace, mosquito breeding dengue outbreak, public health hazard, unhygienic food stall, hospital hygiene."
    },
    DepartmentCategory.SAFETY: {
        "keywords": ["fire", "gas leak", "manhole", "collapse", "hazard", "tree fallen", "emergency", "danger", "wall collapse", "electric shock"],
        "anchor_text": "Open dangerous manhole without lid, gas leakage emergency, fire hazard, building wall collapse, fallen heavy tree."
    },
    DepartmentCategory.ENVIRONMENT: {
        "keywords": ["pollution", "smoke", "noise", "tree cutting", "chemical", "dust", "river", "air quality", "plastic"],
        "anchor_text": "Toxic air pollution, heavy industrial smoke, illegal tree cutting, river water pollution, loud noise pollution."
    },
    DepartmentCategory.TRANSPORT: {
        "keywords": ["bus", "metro", "transport", "auto", "stop", "station", "fare", "route", "driver", "vehicle"],
        "anchor_text": "Public city bus delay, broken bus stop shelter, metro station issue, reckless bus driver, transit route issue."
    }
}

class AIClassifierService:
    def __init__(self):
        self._anchors = {}

    def _get_anchor_embeddings(self):
        if not self._anchors:
            for cat, profile in DEPARTMENT_PROFILES.items():
                self._anchors[cat] = embedding_service.generate_embedding(profile["anchor_text"])
        return self._anchors

    def classify_complaint(self, text: str, embedding: list[float], user_hint: Optional[DepartmentCategory] = None) -> Tuple[DepartmentCategory, float]:
        """
        Classifies complaint text into appropriate DepartmentCategory with confidence score.
        Combines keyword boosting and semantic embedding cosine distance.
        """
        if user_hint and not text.strip():
            return user_hint, 1.0

        lower_text = text.lower()
        anchors = self._get_anchor_embeddings()
        
        scores = {}
        
        for category, profile in DEPARTMENT_PROFILES.items():
            # 1. Semantic Embedding Similarity
            sem_sim = embedding_service.compute_cosine_similarity(embedding, anchors[category])
            
            # 2. Keyword Match Density
            kw_matches = sum(1 for kw in profile["keywords"] if kw in lower_text)
            kw_score = min(1.0, kw_matches * 0.25)
            
            # Combined score (70% semantic, 30% keyword)
            combined = (0.7 * sem_sim) + (0.3 * kw_score)
            
            # User hint boost
            if user_hint and category == user_hint:
                combined += 0.15
                
            scores[category] = combined

        # Select category with highest score
        best_category = max(scores, key=scores.get)
        confidence = min(1.0, round(scores[best_category], 2))
        
        logger.info(f"Classified complaint as '{best_category.value}' (Confidence: {confidence})")
        return best_category, confidence

ai_classifier_service = AIClassifierService()
