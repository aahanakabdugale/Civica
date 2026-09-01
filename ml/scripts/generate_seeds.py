"""
Seed Data Generator & Embedder.

Loads seed complaints from JSON, runs them through the ML pipeline,
and outputs a fully processed seed file with embeddings, classifications,
and priority scores — ready for bulk insertion into the database.

Usage:
    cd ml
    python -m scripts.generate_seeds
"""

import json
import sys
import time
from pathlib import Path

# Add parent dir to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.embedder import EmbedderService
from app.services.prioritizer import PrioritizerService
from app.services.language import LanguageService
from app.utils.text_cleaner import clean_text


DATA_DIR = Path(__file__).parent.parent / "data"
INPUT_FILE = DATA_DIR / "seed_complaints.json"
OUTPUT_FILE = DATA_DIR / "seed_complaints_processed.json"


def main():
    print("=" * 60)
    print("  Seed Data Generator")
    print("=" * 60)

    # Load raw seed data
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        seeds = json.load(f)
    print(f"\nLoaded {len(seeds)} seed complaints from {INPUT_FILE.name}")

    # Initialize services
    print("\nLoading ML services...")
    embedder = EmbedderService()
    prioritizer = PrioritizerService()
    language_svc = LanguageService()

    # Process each complaint
    processed = []
    start = time.time()

    for i, seed in enumerate(seeds):
        raw_text = seed["text"]

        # Step 1: Clean text
        cleaned = clean_text(raw_text)

        # Step 2: Language detection + translation
        lang_result = language_svc.detect_and_translate(cleaned)
        translated = lang_result["translated_text"]

        # Step 3: Generate embedding
        embedding = embedder.generate_embedding(translated)

        # Step 4: Priority scoring (using expected category)
        category = seed["expected_category"]
        priority_result = prioritizer.score(
            text=translated,
            category=category,
            duplicate_count=0,
        )

        # Build processed entry
        entry = {
            "id": seed["id"],
            "raw_text": raw_text,
            "translated_text": translated,
            "detected_language": lang_result["detected_language"],
            "category": category,
            "priority": priority_result["priority"],
            "priority_score": priority_result["score"],
            "priority_factors": priority_result["factors"],
            "latitude": seed["latitude"],
            "longitude": seed["longitude"],
            "embedding": embedding,
            "status": "Open",
        }

        # Preserve duplicate linkage if present
        if "is_duplicate_of" in seed:
            entry["is_duplicate_of"] = seed["is_duplicate_of"]

        processed.append(entry)

        # Progress indicator
        print(
            f"  [{i+1:2d}/{len(seeds)}] "
            f"lang={lang_result['detected_language']:2s} | "
            f"dept={category:25s} | "
            f"priority={priority_result['priority']:8s} | "
            f"{raw_text[:50]}..."
        )

    elapsed = time.time() - start

    # Save processed data
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(processed, f, indent=2, ensure_ascii=False)

    print(f"\n{'=' * 60}")
    print(f"  Done! Processed {len(processed)} complaints in {elapsed:.2f}s")
    print(f"  Output saved to: {OUTPUT_FILE}")
    print(f"{'=' * 60}")

    # Print summary stats
    categories = {}
    priorities = {}
    duplicates = 0
    for entry in processed:
        categories[entry["category"]] = categories.get(entry["category"], 0) + 1
        priorities[entry["priority"]] = priorities.get(entry["priority"], 0) + 1
        if "is_duplicate_of" in entry:
            duplicates += 1

    print(f"\n  Category Distribution:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"    {cat:30s} {count}")

    print(f"\n  Priority Distribution:")
    for pri, count in sorted(priorities.items()):
        print(f"    {pri:10s} {count}")

    print(f"\n  Duplicate complaints: {duplicates}")


if __name__ == "__main__":
    main()
