# PS02 — Implementation Plan
## AI-Based Citizen Grievance Classification, Prioritization & Duplicate Detection

---

## 1. Team Roles (assuming 4–6 members)

| Role | Responsibility |
|---|---|
| Frontend Dev (1–2) | Citizen submission form, authority dashboard UI, map integration |
| Backend Dev (1–2) | API endpoints, DB schema, service orchestration |
| ML/NLP Dev (1–2) | Classification, embeddings, duplicate detection, priority scoring |
| PM/Presenter (1) | Coordination, demo data, pitch deck, timing |

If team is smaller, merge Backend + ML into one track and Frontend stays separate — the AI logic is the differentiator, protect time for it.

---

## 2. Timeline (assuming 36–48 hr hackathon)

### Phase 0 — Setup (Hours 0–3)
- [ ] Create GitHub repo, folder structure (`/frontend`, `/backend`, `/ml`, `/docs`)
- [ ] Finalize tech stack (no debate after this point)
- [ ] Set up dev environments, install dependencies
- [ ] Obtain API keys (translation, LLM, maps)
- [ ] Create shared doc for API contract (endpoints, request/response shapes)
- [ ] Design DB schema and create migration

### Phase 1 — Core Pipeline (Hours 3–14)
- [ ] Backend: `POST /complaints` endpoint (accepts text, location, category hint, contact)
- [ ] Backend: `GET /complaints` with filters (department, status, priority)
- [ ] Frontend: Citizen submission form (text, location picker, photo upload optional)
- [ ] ML: Language detection + translation step
- [ ] ML: Classification function (LLM zero-shot prompt → department label)
- [ ] ML: Generate + store embedding on submission (`sentence-transformers`)
- [ ] Integration checkpoint: submit a complaint end-to-end → verify DB row with category + embedding

### Phase 2 — Intelligence Layer (Hours 14–26)
- [ ] ML: Duplicate detection logic
  - Cosine similarity search against recent complaints (same category, time window)
  - Geo-distance threshold (e.g. within 500m)
  - Combine into a duplicate score; mark `duplicate_of` if above threshold
- [ ] ML: Priority scoring
  - Keyword severity table (fire, leak, accident, injury → high)
  - Category base severity (health/safety > aesthetic issues)
  - Combine into Low/Medium/High/Critical label
- [ ] Backend: `PATCH /complaints/:id/status` for authority updates
- [ ] Frontend: Authority dashboard — table view with filters (department/priority/status)
- [ ] Frontend: Map view (Leaflet + OpenStreetMap) plotting complaint markers
- [ ] Integration checkpoint: submit 2 similar complaints near same location → confirm flagged as duplicates

### Phase 3 — Dashboard & Analytics (Hours 26–34)
- [ ] Frontend: Heatmap layer on map (density by area)
- [ ] Frontend: Analytics widgets — complaints/day, top categories, avg resolution time
- [ ] Frontend: Citizen-side status tracking page (lookup by complaint ID)
- [ ] Backend: Analytics aggregation endpoints
- [ ] Polish UI (consistent styling, loading states, empty states)

### Phase 4 — Demo Prep (Hours 34–44)
- [ ] Seed 30–50 realistic demo complaints across categories/locations, including 4–5 intentional duplicates and a couple of "urgent" ones
- [ ] Full run-through: submit → classify → dedupe → dashboard → resolve
- [ ] Fix critical bugs only — no new features
- [ ] Build pitch deck: problem → solution → architecture → live demo → impact/scalability
- [ ] Assign presenter roles, rehearse demo (aim 3–5 min)
- [ ] Prepare backup: screen recording of working demo in case of live failure

### Phase 5 — Buffer (Hours 44–48)
- [ ] Final testing, deployment check
- [ ] Rehearse Q&A (judges often ask: "how do you handle false duplicates?", "how does this scale?", "what if the LLM is wrong?")

---

## 3. Key Technical Decisions to Lock Early

| Decision | Recommendation | Why |
|---|---|---|
| Classification approach | LLM zero-shot prompt first | Fast to implement, good enough accuracy for demo |
| Embedding model | `all-MiniLM-L6-v2` (sentence-transformers) | Small, fast, no GPU needed |
| Duplicate threshold | Cosine similarity > 0.85 AND distance < 500m AND within 7 days | Tunable; start here and adjust after testing |
| Vector storage | `pgvector` extension on Postgres | Avoids standing up a separate vector DB |
| Map | Leaflet + OpenStreetMap tiles | Free, no API key needed |
| Auth | Skip real auth; use a simple hardcoded login for authority dashboard | Saves time; not a judged criterion usually |

---

## 4. Risk Areas & Mitigations

| Risk | Mitigation |
|---|---|
| LLM API rate limits/costs during demo | Cache responses for seed data; have a fallback rule-based classifier |
| Duplicate detection gives false positives/negatives | Tune threshold with test data before demo; show a couple of clear, obvious examples |
| Map/geo library integration eats time | Use Leaflet with minimal config; avoid custom map styling |
| Team blocked on API keys | Get all keys within first hour; have a teammate own this task exclusively |
| Scope creep | Stick to MVP list; anything beyond Phase 3 is a stretch goal only |

---

## 5. Definition of Done (for demo readiness)

- [ ] Citizen can submit a complaint with text + location
- [ ] Complaint gets auto-classified into a department
- [ ] Complaint gets a priority label
- [ ] Duplicate complaints are detected and linked/flagged
- [ ] Dashboard shows list + map view with filters
- [ ] At least one status update flow works (Open → Resolved)
- [ ] Basic analytics visible (counts by category/priority)
- [ ] Demo script rehearsed with realistic seed data

---

## 6. Stretch Goals (only if ahead of schedule)

- Real SMS/email notifications on status change
- Sentiment analysis for tone-based urgency boost
- Multi-language UI (not just backend translation)
- Admin analytics: department-wise SLA tracking
- Citizen upvoting on existing complaints instead of creating duplicates
