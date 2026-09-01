import logging
from typing import List, Tuple
from app.models.complaint import DepartmentCategory, PriorityLevel

logger = logging.getLogger("civica.priority")

CATEGORY_BASE_SCORES = {
    DepartmentCategory.SAFETY: 40.0,
    DepartmentCategory.HEALTH: 35.0,
    DepartmentCategory.WATER: 30.0,
    DepartmentCategory.ELECTRICITY: 30.0,
    DepartmentCategory.SANITATION: 20.0,
    DepartmentCategory.ROADS: 20.0,
    DepartmentCategory.ENVIRONMENT: 15.0,
    DepartmentCategory.TRANSPORT: 15.0,
}

CRITICAL_KEYWORDS = [
    "fire", "spark", "live wire", "electric shock", "gas leak", "explosion",
    "building collapse", "wall collapse", "open manhole", "child fell", "accident",
    "sewage overflow", "poisonous", "toxic gas", "electrocuted"
]

HIGH_KEYWORDS = [
    "dengue", "hospital", "school", "senior citizen", "blackout", "no water for 3 days",
    "foul smell", "contamination", "stray dog bite", "flooding", "burst pipe"
]

class PriorityEngineService:
    def calculate_priority(
        self,
        category: DepartmentCategory,
        text: str,
        nearby_density_count: int = 0
    ) -> Tuple[PriorityLevel, float, List[str]]:
        """
        Calculates priority score (0-100), level, and audit reasons.
        """
        score = CATEGORY_BASE_SCORES.get(category, 20.0)
        reasons = [f"Base score for category '{category.value}': +{int(score)}"]
        
        lower_text = text.lower()
        
        # 1. Critical keyword check
        crit_matches = [kw for kw in CRITICAL_KEYWORDS if kw in lower_text]
        if crit_matches:
            boost = len(crit_matches) * 20.0
            score += boost
            reasons.append(f"Emergency keywords matched ({', '.join(crit_matches)}): +{int(boost)}")
            
        # 2. High urgency keyword check
        high_matches = [kw for kw in HIGH_KEYWORDS if kw in lower_text]
        if high_matches:
            boost = len(high_matches) * 10.0
            score += boost
            reasons.append(f"Urgent keywords matched ({', '.join(high_matches)}): +{int(boost)}")
            
        # 3. Geo spatial density boost
        if nearby_density_count > 0:
            density_boost = min(25.0, nearby_density_count * 5.0)
            score += density_boost
            reasons.append(f"Spatial density boost ({nearby_density_count} nearby complaints within 500m): +{int(density_boost)}")
            
        # Cap score between 0 and 100
        final_score = min(100.0, round(score, 1))
        
        # Assign Priority Level
        if final_score >= 70.0:
            level = PriorityLevel.CRITICAL
        elif final_score >= 50.0:
            level = PriorityLevel.HIGH
        elif final_score >= 30.0:
            level = PriorityLevel.MEDIUM
        else:
            level = PriorityLevel.LOW
            
        logger.info(f"Priority calculated: Score={final_score}, Level={level.value}")
        return level, final_score, reasons

priority_engine_service = PriorityEngineService()
