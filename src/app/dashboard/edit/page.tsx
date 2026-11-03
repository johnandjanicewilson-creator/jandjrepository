import { getAllPosts } from "@/lib/posts";
import { getDatabase } from "@/lib/db/neon";
import StorySearch from "./StorySearch";

export const dynamic = "force-dynamic";

export default async function EditExistingPostPage() {
  const originals = getAllPosts().map((post) => ({
    slug: post.slug,
    title: post.title,
    date: String(post.date),
    destination: post.destination,
  }));

  const sql = getDatabase();
  const published = await sql`
    SELECT p.slug, p.title,
           COALESCE(NULLIF(p.original_metadata->>'date', ''),
                    d.travel_date::text, '') AS date,
           COALESCE(NULLIF(p.original_metadata->>'destination', ''),
                    d.destination, '') AS destination
    FROM travel_published p
    LEFT JOIN travel_drafts d ON d.id = p.source_draft_id
    WHERE p.publication_approved = true
      AND p.slug LIKE 'story-%'
  `;
  const seen = new Set(originals.map((post) => post.slug));
  const posts = [...originals];
  for (const item of published) {
    if (!seen.has(String(item.slug))) {
      posts.push({
        slug: String(item.slug),
        title: String(item.title),
        date: String(item.date),
        destination: String(item.destination),
      });
    }
  }
  posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  return <StorySearch posts={posts} />;
}
