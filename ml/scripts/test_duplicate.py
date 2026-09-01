"""
End-to-end duplicate detection test.
Simulates the full backend flow:
1. Process complaint A → get embedding
2. Process complaint B (same issue, different words, nearby location) → get embedding
3. Check if B is a duplicate of A
"""
import httpx
import json

BASE = "http://localhost:8001/ml"

print("=" * 70)
print("  DUPLICATE DETECTION — End-to-End Test")
print("=" * 70)

# Step 1: Process complaint A
print("\n[1] Submitting Complaint A...")
r1 = httpx.post(f"{BASE}/process", json={
    "text": "There is a huge pothole on MG Road near City Mall. Multiple vehicles have been damaged.",
    "latitude": 19.0760,
    "longitude": 72.8777,
}, timeout=15)
a = r1.json()
print(f"    Dept: {a['department']}  |  Priority: {a['priority']}  |  Method: {a['classification_method']}")

# Step 2: Process complaint B (same issue, different wording, nearby GPS)
print("\n[2] Submitting Complaint B (same issue, different words, ~20m away)...")
r2 = httpx.post(f"{BASE}/process", json={
    "text": "Big hole in the road near City Mall on MG Road. My car tyre got damaged. Very dangerous.",
    "latitude": 19.0762,
    "longitude": 72.8779,
}, timeout=15)
b = r2.json()
print(f"    Dept: {b['department']}  |  Priority: {b['priority']}  |  Method: {b['classification_method']}")

# Step 3: Check duplicate — B vs A
print("\n[3] Checking if B is a duplicate of A...")
r3 = httpx.post(f"{BASE}/check-duplicate", json={
    "embedding": b["embedding"],
    "latitude": 19.0762,
    "longitude": 72.8779,
    "category": b["department"],
    "existing_complaints": [
        {
            "id": 1,
            "embedding": a["embedding"],
            "latitude": 19.0760,
            "longitude": 72.8777,
            "category": a["department"],
            "days_ago": 0.5,
        }
    ]
}, timeout=15)
dup = r3.json()

print(f"    Is Duplicate: {dup['is_duplicate']}")
if dup["is_duplicate"]:
    print(f"    Best Match ID: {dup['best_match_id']}")
    print(f"    Composite Score: {dup['best_match_score']}")
    for d in dup["duplicates"]:
        print(f"      -> Cosine Sim: {d['cosine_sim']:.4f}  |  Geo Dist: {d['geo_dist_km']:.3f} km  |  Score: {d['composite_score']:.4f}")

# Step 4: Check non-duplicate — C (completely different complaint)
print("\n[4] Submitting Complaint C (completely different topic)...")
r4 = httpx.post(f"{BASE}/process", json={
    "text": "The government hospital has no medicines. Patients are being turned away.",
    "latitude": 19.2307,
    "longitude": 72.8567,
}, timeout=15)
c = r4.json()
print(f"    Dept: {c['department']}  |  Priority: {c['priority']}")

print("\n[5] Checking if C is a duplicate of A (should NOT be)...")
r5 = httpx.post(f"{BASE}/check-duplicate", json={
    "embedding": c["embedding"],
    "latitude": 19.2307,
    "longitude": 72.8567,
    "category": c["department"],
    "existing_complaints": [
        {
            "id": 1,
            "embedding": a["embedding"],
            "latitude": 19.0760,
            "longitude": 72.8777,
            "category": a["department"],
            "days_ago": 0.5,
        }
    ]
}, timeout=15)
dup2 = r5.json()
print(f"    Is Duplicate: {dup2['is_duplicate']}")

print("\n" + "=" * 70)
if dup["is_duplicate"] and not dup2["is_duplicate"]:
    print("  ✅ PASS — Similar complaints flagged, unrelated complaints ignored!")
else:
    print("  ❌ FAIL — Check thresholds")
print("=" * 70)
