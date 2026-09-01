# Civica Backend Service

Production-ready, high-throughput asynchronous FastAPI & MongoDB backend service for **Civica** — AI-Based Citizen Grievance Classification, Urgency Prioritization & Spatial Duplicate Detection Platform.

---

## Technical Stack
- **FastAPI**: Modern, fast web framework for building APIs with Python 3.12+ type hints.
- **Motor / PyMongo**: Non-blocking async MongoDB driver.
- **MongoDB**: NoSQL document store with `2DSphere` spatial radius indexing on complaint locations.
- **Sentence-Transformers (`all-MiniLM-L6-v2`)**: Generates 384-dimensional dense semantic vector embeddings.
- **Scikit-Learn / NumPy**: Cosine similarity calculations for spatial duplicate detection.
- **Deep-Translator**: Multi-language input detection and auto-translation to English.

---

## Getting Started

### 1. Activate Environment & Run Server
```bash
cd backend
./venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Interactive Swagger API Docs
Navigate to [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.

### 3. Run Automated Tests
```bash
./venv/bin/python verify_backend.py
```
