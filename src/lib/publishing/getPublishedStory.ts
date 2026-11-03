import "server-only";
import { getDatabase } from "@/lib/db/neon";

export async function getPublishedStory(slug: string) {
  const sql = getDatabase();

  const rows = await sql`
    SELECT slug, title, content, original_metadata, published_at
    FROM travel_published
    WHERE slug = ${slug}
      AND publication_approved = true
    LIMIT 1
  `;

  return rows[0] ?? null;
}
