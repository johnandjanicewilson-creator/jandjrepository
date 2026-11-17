import csv
from pathlib import Path

folder = Path("geographic-work")

with (folder / "places-inventory.csv").open(
    newline="", encoding="utf-8"
) as f:
    inventory = list(csv.DictReader(f))

with (folder / "geocoded-places.csv").open(
    newline="", encoding="utf-8"
) as f:
    completed = {row["place"] for row in csv.DictReader(f)}

import json

proposed_file = folder / "proposed-matches.jsonl"
if proposed_file.exists():
    with proposed_file.open(encoding="utf-8") as f:
        completed.update(
            json.loads(line)["place"]
            for line in f if line.strip()
        )

seen = set()
pending = []

for row in inventory:
    place = row["Place"]

    if place in seen or place in completed:
        continue

    seen.add(place)

    cleaned = place.replace("-", " ").strip()
    destination = row["Destination"].strip()

    query = cleaned
    if destination and destination.lower() not in cleaned.lower():
        query += ", " + destination

    vague = {
        "cruising", "golf", "family", "national parks",
        "2017 travel", "united states"
    }

    if destination.lower() in vague:
        continue  # Hold for context review

    pending.append((place, query))

print("Unique locations awaiting lookup:", len(pending))
print("\nNext five proposed searches:")

for place, query in pending[:5]:
    print(f"  {place} -> {query}")

def lookup_location(query):
    """Request one geographic match from OpenStreetMap."""
    import json
    import urllib.parse
    import urllib.request

    params = urllib.parse.urlencode({
        "q": query,
        "format": "jsonv2",
        "addressdetails": 1,
        "limit": 1
    })

    url = "https://nominatim.openstreetmap.org/search?" + params

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "JohnAndJaniceTravelMap/1.0 (personal website development)"
        }
    )

    import time
    import urllib.error

    for attempt in range(2):
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                results = json.load(response)
            return results[0] if results else None
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 1:
                raise
            time.sleep(5)
        except (urllib.error.URLError, TimeoutError):
            if attempt == 1:
                raise
            time.sleep(5)

def save_proposed_match(place, result):
    """Save a geographic match for later review."""
    import json

    output = folder / "proposed-matches.jsonl"

    record = {
        "place": place,
        "display_name": result.get("display_name"),
        "latitude": result.get("lat"),
        "longitude": result.get("lon"),
        "address": result.get("address", {}),
        "status": "needs_review"
    }

    with output.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
