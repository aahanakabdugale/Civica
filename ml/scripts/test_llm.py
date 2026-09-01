"""Quick test: run 5 diverse complaints through the full pipeline with LLM classification."""
import httpx
import json

tests = [
    "There is sewage water overflowing near the school. Children are getting sick.",
    "Auto rickshaw drivers are overcharging passengers near the railway station.",
    "An old building near the market looks like it could collapse any moment.",
    "The local park has become a dumping ground. Trees are being cut down too.",
    "My child school does not have enough teachers. Only 2 teachers for 300 students.",
]

print(f"{'Method':<18} | {'Department':<26} | {'Priority':<9} | Complaint")
print("-" * 120)

for text in tests:
    r = httpx.post(
        "http://localhost:8001/ml/process",
        json={"text": text, "latitude": 19.076, "longitude": 72.877},
        timeout=15,
    )
    d = r.json()
    method = d["classification_method"]
    dept = d["department"]
    priority = d["priority"]
    print(f"{method:<18} | {dept:<26} | {priority:<9} | {text[:60]}...")
