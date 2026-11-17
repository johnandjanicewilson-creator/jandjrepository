import csv
import runpy
import time
from pathlib import Path

program = runpy.run_path("geographic-work/geocode.py")
lookup = program["lookup_location"]
save = program["save_proposed_match"]

folder = Path("geographic-work")
review_file = folder / "locations-needing-review.csv"

with review_file.open(newline="", encoding="utf-8") as f:
    review = {row["place"] for row in csv.DictReader(f)}

batch = [
    (place, query)
    for place, query in program["pending"]
    if place not in review
][:5]

print(f"Processing {len(batch)} locations", flush=True)

for place, query in batch:
    print(f"\nSearching: {query}", flush=True)

    try:
        result = lookup(query)

        if result:
            save(place, result)
            print("FOUND:", result["display_name"], flush=True)
        else:
            with review_file.open("a", newline="", encoding="utf-8") as f:
                csv.writer(f).writerow([place, "No automatic match", query])
            print("Added to review list.", flush=True)

    except Exception as error:
        print("Server error; will retry in a future batch:", error, flush=True)

    time.sleep(1.2)

print("\nBatch complete.")
