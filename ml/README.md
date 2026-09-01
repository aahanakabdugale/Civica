# Grievance ML Service
## AI-Powered Complaint Processing Pipeline

Classification • Priority Scoring • Duplicate Detection • Language Translation

---

## Quick Start

### 1. Setup Environment

```bash
cd ml
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env and add your LLM API key (Groq is free: https://console.groq.com)
```

### 3. Run the Service

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Open API Docs

Visit [http://localhost:8001/docs](http://localhost:8001/docs) for interactive Swagger UI.

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/ml/process` | POST | Full pipeline: translate → classify → embed → prioritize |
| `/ml/check-duplicate` | POST | Check for duplicates against existing complaints |
| `/ml/embed` | POST | Generate embedding only |
| `/ml/classify` | POST | Classify department only |
| `/ml/health` | GET | Health check |
| `/ml/categories` | GET | List available departments |

### Example: Process a Complaint

```bash
curl -X POST http://localhost:8001/ml/process \
  -H "Content-Type: application/json" \
  -d '{
    "text": "पानी की पाइप फट गई है, सड़क पर पानी भर गया",
    "latitude": 19.076,
    "longitude": 72.877
  }'
```

**Response:**
```json
{
  "original_text": "पानी की पाइप फट गई है, सड़क पर पानी भर गया",
  "translated_text": "The water pipe has burst, the road is flooded",
  "detected_language": "hi",
  "department": "Water Supply",
  "classification_method": "llm_zero_shot",
  "priority": "High",
  "priority_score": 5,
  "priority_factors": [
    "Department 'Water Supply' base severity: 3",
    "🟠 High-severity keyword: 'burst'"
  ],
  "embedding": [0.023, -0.115, ...]
}
```

---

## Running Tests

```bash
cd ml
pytest tests/ -v
```

**Note:** The pipeline tests (`test_pipeline.py`) will download the embedding model (~80MB) on first run.

---

## Generating Seed Data

```bash
cd ml
python -m scripts.generate_seeds
```

This processes all 45 seed complaints through the pipeline and saves the enriched output to `data/seed_complaints_processed.json`.

---

## Architecture

```
Citizen Input
     │
     ▼
┌──────────┐     ┌────────────────┐     ┌──────────┐
│ Language  │────▶│ Classification │────▶│ Embedding│
│ Detection │     │ (LLM/Keyword)  │     │ (MiniLM) │
│ + Translate│    └────────────────┘     └──────────┘
└──────────┘              │                    │
                          ▼                    ▼
                 ┌──────────────┐     ┌──────────────────┐
                 │ Priority     │     │ Duplicate         │
                 │ Scoring      │     │ Detection         │
                 │ (Rule-based) │     │ (Cosine+Geo+Time) │
                 └──────────────┘     └──────────────────┘
                          │                    │
                          ▼                    ▼
                      Backend API / Database
```

---

## Tuning Thresholds

All thresholds are configurable via `.env`:

| Parameter | Default | Effect |
|---|---|---|
| `COSINE_THRESHOLD` | 0.82 | Minimum embedding similarity for duplicate candidate |
| `GEO_RADIUS_KM` | 0.5 | Maximum distance (km) for geographic match |
| `TIME_WINDOW_DAYS` | 7 | Only compare complaints within this time window |
| `COMPOSITE_THRESHOLD` | 0.70 | Weighted score threshold for final duplicate decision |

**Tip:** Start with defaults, then tune based on your seed data results.

---

## Docker

```bash
cd ml
docker build -t grievance-ml .
docker run -p 8001:8001 --env-file .env grievance-ml
```
