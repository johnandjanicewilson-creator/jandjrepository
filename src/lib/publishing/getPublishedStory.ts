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

/** Only approved new stories. Existing file-backed stories retain their original listing. */
export async function getNewPublishedStories() {
  const sql = getDatabase();
  return await sql`
    SELECT p.slug, p.title, p.content, p.original_metadata, p.published_at
    FROM travel_published p
    JOIN travel_drafts d ON d.id = p.source_draft_id
    WHERE p.publication_approved = true
      AND d.source_slug IS NULL
    ORDER BY p.published_at DESC
  `;
}
