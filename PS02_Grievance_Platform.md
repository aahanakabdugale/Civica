# PS02 — AI-Based Citizen Grievance Classification, Prioritization & Duplicate Detection

## 1. Problem Recap

Build a platform that:
- Lets citizens submit complaints
- Automatically classifies + routes them to the right department
- Assigns priority/urgency
- Detects duplicate complaints about the same underlying issue
- Shows geographical hotspots on an authority dashboard

---

## 2. System Architecture

```
Citizen App/Web ──▶ Backend API ──▶ AI Processing Pipeline ──▶ Database ──▶ Authority Dashboard
                                          │
                        ┌─────────────────┼─────────────────┐
                        ▼                 ▼                 ▼
                 Classification     Priority Scoring   Duplicate Detection
                 (Department)       (Urgency)          (Embeddings + Geo)
```

---

## 3. Core Modules

### A. Complaint Intake (Frontend)
- Form: text description, category (optional), location (GPS/manual), photo upload, contact info
- Multilingual input support (Hindi/English minimum)

### B. Language Normalization
- Detect language → translate to a common processing language (Google Translate API / IndicTrans2)
- Basic text cleaning (noise removal, spelling correction)

### C. Classification Engine
- Embedding model (Sentence-BERT / IndicBERT) or LLM zero-shot classification
- Categories: Water, Electricity, Roads, Sanitation, Health, etc.
- Start with LLM zero-shot for speed; swap to trained model if time allows

### D. Priority/Urgency Scoring
- Rule-based + ML hybrid
- Keyword boosts ("fire", "accident", "leak")
- Factors: category severity, sentiment/tone, nearby complaint density, elapsed time

### E. Duplicate/Similarity Detection
- Sentence-BERT embeddings per complaint
- Cosine similarity + clustering (DBSCAN/HDBSCAN)
- Combine with geo-proximity + time window for stronger duplicate signal

### F. GIS Hotspot Visualization
- Map plotting (Leaflet.js / Google Maps API)
- Heatmap by area/category

### G. Authority Dashboard
- Filterable table (department, priority, status)
- Map view with hotspots
- Status pipeline: Open → In Progress → Resolved
- Analytics: complaints over time, top categories, resolution time

### H. Citizen Status Tracking
- Complaint ID for tracking
- Status-change notifications (can be mocked in a hackathon)

---

## 4. Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React / Next.js |
| Backend | FastAPI / Node.js + Express |
| Database | PostgreSQL + PostGIS (or MongoDB) |
| NLP/ML | Sentence-BERT, HuggingFace transformers, scikit-learn |
| LLM (optional) | Claude/OpenAI API or open-source (Llama, Mistral) |
| Maps | Leaflet.js / Mapbox |
| Deployment | Docker + Render/Vercel/Railway |

---

## 5. Data Flow

1. Citizen submits complaint
2. Normalize language/text
3. Generate embedding
4. Classify department + compute urgency score
5. Check similarity + geo-proximity against existing complaints → mark duplicate or new
6. Store in DB
7. Push to dashboard
8. Authority updates status
9. Citizen sees update

---

## 6. MVP Priority Order (Hackathon-Realistic)

1. Complaint submission + storage
2. Classification (LLM zero-shot for speed)
3. Duplicate detection via embeddings (key differentiator — don't skip)
4. Basic dashboard (list + map)
5. Priority scoring (rule-based to start)
6. Polish: analytics, notifications (if time remains)

---

## 7. How to Start

### Day 0 — Setup (before/at hackathon start)
1. **Repo setup**: create a GitHub repo, add `.gitignore`, split into `/frontend`, `/backend`, `/ml`.
2. **Decide stack**: lock in React + FastAPI + PostgreSQL (or your team's comfort stack) — don't debate this mid-event.
3. **Environment**: set up Python venv / Node project, install core libs upfront:
   ```bash
   # Backend
   pip install fastapi uvicorn sqlalchemy psycopg2-binary sentence-transformers scikit-learn

   # Frontend
   npx create-next-app@latest frontend
   ```
4. **Get API keys ready**: translation API, LLM API (if using), map API (Mapbox/Google Maps).

### Day 1 — Core Pipeline
1. Build the complaint submission form + API endpoint (`POST /complaints`).
2. Set up DB schema (see below) and get a complaint saving end-to-end.
3. Add language detection/translation step.
4. Integrate classification (start with a simple LLM prompt: "classify this complaint into one of these departments: ...").
5. Generate and store embeddings for each complaint on submission.

### Day 2 — Intelligence Layer
1. Implement duplicate detection: on new complaint, compare embedding (cosine similarity) + geo-distance + time window against recent complaints in same category.
2. Implement priority scoring (start rule-based: keyword list + category severity table).
3. Build the authority dashboard: table view with filters, then map view with markers/heatmap.
4. Wire up status tracking (Open/In Progress/Resolved) with update endpoint.

### Day 3 — Polish & Demo Prep
1. Add analytics charts (complaints/day, top categories, avg resolution time).
2. Seed realistic demo data (30–50 fake complaints across categories/locations, including a few intentional duplicates).
3. Test the full flow: submit → classify → dedupe → dashboard → resolve.
4. Prepare a 3–5 min demo script + slides covering problem, architecture, live demo, impact.

### Minimal DB Schema to Start With

```sql
CREATE TABLE complaints (
  id SERIAL PRIMARY KEY,
  raw_text TEXT,
  translated_text TEXT,
  category VARCHAR(50),
  priority VARCHAR(20),
  status VARCHAR(20) DEFAULT 'Open',
  latitude FLOAT,
  longitude FLOAT,
  embedding VECTOR(384),  -- if using pgvector
  duplicate_of INT REFERENCES complaints(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

> Tip: use the `pgvector` PostgreSQL extension for storing/querying embeddings directly in SQL — avoids a separate vector DB for a hackathon scope.

### Fastest Path to a Demoable Prototype
- Skip fine-tuning; use LLM prompting for classification + sentiment.
- Use `sentence-transformers` (`all-MiniLM-L6-v2`) — small, fast, good enough for demo-scale duplicate detection.
- Use Leaflet + OpenStreetMap tiles (free, no API key needed) for the map instead of Google Maps.
- Mock notifications instead of building real SMS/email integration.
