"""
Department Classification Service.

Classifies citizen complaints into predefined municipal departments.
Uses a two-tier approach:
  1. Primary: LLM zero-shot classification (fast, accurate)
  2. Fallback: Keyword-based classification (offline, always works)

The fallback activates automatically if the LLM API is unavailable, slow, or misconfigured.
"""

import json
import logging
import os
from pathlib import Path

import httpx

from app.config import settings
from app.utils.text_cleaner import extract_keywords

logger = logging.getLogger(__name__)

# Load department list from data file
DATA_DIR = Path(__file__).parent.parent.parent / "data"


def _load_categories() -> list[str]:
    """Load department categories from JSON config."""
    categories_path = DATA_DIR / "categories.json"
    if categories_path.exists():
        with open(categories_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("departments", [])

    # Hardcoded fallback if file doesn't exist yet
    return [
        "Water Supply",
        "Electricity",
        "Roads & Infrastructure",
        "Sanitation & Waste",
        "Health & Medical",
        "Public Safety",
        "Education",
        "Transport",
        "Environment",
        "Housing & Construction",
        "Other",
    ]


DEPARTMENTS = _load_categories()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Keyword-based fallback classifier
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEYWORD_MAP: dict[str, list[str]] = {
    "Water Supply": [
        "water", "pipe", "tap", "leak", "supply", "borewell", "tanker",
        "pipeline", "drainage", "plumbing", "sewage", "contaminated",
        "dirty water", "no water", "low pressure", "waterlogging",
    ],
    "Electricity": [
        "power", "electricity", "transformer", "outage", "wire", "pole",
        "meter", "voltage", "blackout", "powercut", "electric", "current",
        "short circuit", "streetlight", "street light", "light",
    ],
    "Roads & Infrastructure": [
        "road", "pothole", "bridge", "footpath", "signal", "flyover",
        "highway", "lane", "pavement", "crack", "broken road", "divider",
        "speed breaker", "traffic light", "manhole", "construction",
    ],
    "Sanitation & Waste": [
        "garbage", "waste", "drain", "sewer", "cleaning", "dustbin",
        "trash", "dump", "sweeping", "hygiene", "toilet", "sanitation",
        "smell", "stink", "filth", "dirty", "clogged drain",
    ],
    "Health & Medical": [
        "hospital", "doctor", "medicine", "clinic", "ambulance", "disease",
        "health", "patient", "medical", "pharmacy", "dengue", "malaria",
        "infection", "epidemic", "vaccination", "vaccine",
    ],
    "Public Safety": [
        "crime", "theft", "fire", "accident", "police", "safety",
        "violence", "robbery", "assault", "murder", "missing", "security",
        "cctv", "patrol", "emergency", "fight", "danger",
    ],
    "Education": [
        "school", "college", "teacher", "student", "education", "exam",
        "syllabus", "classroom", "university", "library", "scholarship",
    ],
    "Transport": [
        "bus", "train", "metro", "auto", "rickshaw", "taxi", "cab",
        "transport", "traffic", "parking", "congestion", "route",
        "schedule", "delay", "overcrowded",
    ],
    "Environment": [
        "pollution", "air quality", "noise", "tree", "deforestation",
        "green", "park", "garden", "smoke", "factory", "emission",
        "river", "lake", "pond", "illegal dumping",
    ],
    "Housing & Construction": [
        "building", "housing", "flat", "apartment", "colony", "society",
        "construction", "illegal", "encroachment", "demolition", "permit",
        "rent", "tenant", "landlord",
    ],
}


class ClassifierService:
    """
    Two-tier complaint classifier:
    1. LLM zero-shot (primary) — calls Groq/OpenAI/Gemini API
    2. Keyword-based (fallback) — offline, deterministic
    """

    # System prompt for the LLM
    SYSTEM_PROMPT = (
        "You are a complaint classifier for an Indian municipal grievance system.\n"
        "Given a citizen complaint, classify it into exactly ONE of these departments:\n"
        "{departments}\n\n"
        "Rules:\n"
        "- Return ONLY the department name from the list above, nothing else.\n"
        "- Do not add quotes, periods, or any extra text.\n"
        "- If the complaint doesn't clearly fit any department, return \"Other\".\n"
        "- Base your decision on the primary issue described in the complaint."
    )

    def __init__(self):
        self.departments = DEPARTMENTS
        self._llm_available = bool(settings.LLM_API_KEY)
        if not self._llm_available:
            logger.warning(
                "No LLM_API_KEY set. Classifier will use keyword-based fallback only."
            )

    async def classify(self, text: str) -> dict:
        """
        Classify a complaint into a department.

        Strategy: try LLM first → fall back to keywords if LLM fails.

        Returns:
            {"department": str, "method": "llm_zero_shot" | "keyword_fallback"}
        """
        if self._llm_available:
            try:
                result = await self._classify_llm(text)
                if result:
                    return result
            except Exception as e:
                logger.error(f"LLM classification failed: {e}")

        # Fallback to keyword-based
        return self._classify_keywords(text)

    async def _classify_llm(self, text: str) -> dict | None:
        """
        Call the LLM API for zero-shot classification.
        Returns None if the response is invalid or the API call fails.
        """
        departments_str = "\n".join(f"- {d}" for d in self.departments)
        system_prompt = self.SYSTEM_PROMPT.format(departments=departments_str)

        user_prompt = f"Classify this citizen complaint:\n\n\"{text}\""

        # Build request based on provider (all use OpenAI-compatible chat format)
        headers = {
            "Authorization": f"Bearer {settings.LLM_API_KEY}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": settings.LLM_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.0,     # Deterministic output
            "max_tokens": 30,       # Department name is short
        }

        base_url = settings.LLM_BASE_URL.rstrip("/")
        url = f"{base_url}/chat/completions"

        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()

            data = response.json()
            raw_output = data["choices"][0]["message"]["content"].strip()

            # Validate that the output is a known department
            department = self._match_department(raw_output)
            if department:
                logger.info(f"LLM classified: '{text[:50]}...' → {department}")
                return {"department": department, "method": "llm_zero_shot"}
            else:
                logger.warning(
                    f"LLM returned unknown department '{raw_output}', falling back"
                )
                return None

    def _classify_keywords(self, text: str) -> dict:
        """
        Keyword-based fallback classifier.
        Counts keyword matches per department and picks the highest.
        """
        text_lower = text.lower()
        scores: dict[str, int] = {}

        for department, keywords in KEYWORD_MAP.items():
            score = 0
            for kw in keywords:
                if kw in text_lower:
                    # Multi-word keywords get a bonus
                    score += 2 if " " in kw else 1
            scores[department] = score

        best_dept = max(scores, key=scores.get)
        best_score = scores[best_dept]

        if best_score == 0:
            department = "Other"
        else:
            department = best_dept

        logger.info(
            f"Keyword classified: '{text[:50]}...' → {department} (score={best_score})"
        )
        return {"department": department, "method": "keyword_fallback"}

    def _match_department(self, raw_output: str) -> str | None:
        """
        Fuzzy-match the LLM output to a known department name.
        Handles minor formatting differences (extra spaces, casing, etc.)
        """
        cleaned = raw_output.strip().strip('"').strip("'").strip(".")

        # Exact match (case-insensitive)
        for dept in self.departments:
            if cleaned.lower() == dept.lower():
                return dept

        # Partial/substring match
        for dept in self.departments:
            if dept.lower() in cleaned.lower() or cleaned.lower() in dept.lower():
                return dept

        return None
