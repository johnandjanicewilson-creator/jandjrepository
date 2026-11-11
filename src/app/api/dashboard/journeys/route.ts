import { auth } from "@/auth";
import { getDatabase } from "@/lib/db/neon";
import { getJourneys } from "@/lib/journeys";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const user = session?.user?.id;

  if (user !== "john" && user !== "janice") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  try {
    const sql = getDatabase();

    const drafts = await sql`
      SELECT original_metadata->>'series' AS name,
             MAX(updated_at) AS recent_date
      FROM travel_drafts
      WHERE NULLIF(TRIM(original_metadata->>'series'), '') IS NOT NULL
      GROUP BY original_metadata->>'series'
    `;

    const candidates = [
      ...drafts.map((row) => ({
        name: String(row.name).trim(),
        recentDate: new Date(String(row.recent_date)).getTime(),
      })),
      ...getJourneys().map((journey) => ({
        name: journey.name,
        recentDate: new Date(journey.latestDate).getTime(),
      })),
    ];

    candidates.sort((a, b) => b.recentDate - a.recentDate);

    const seen = new Set<string>();
    const journeys: string[] = [];

    for (const candidate of candidates) {
      const key = candidate.name.toLowerCase();
      if (!candidate.name || seen.has(key)) continue;
      seen.add(key);
      journeys.push(candidate.name);
      if (journeys.length === 5) break;
    }

    return NextResponse.json(
      { journeys },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load recent Journeys" },
      { status: 500 }
    );
  }
}
