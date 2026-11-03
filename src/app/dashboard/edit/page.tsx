import { getAllPosts } from "@/lib/posts";
import { getDatabase } from "@/lib/db/neon";
import StorySearch from "./StorySearch";

export const dynamic = "force-dynamic";

export default async function EditExistingPostPage() {
  const originals = getAllPosts(true).map((post) => ({
    slug: post.slug,
    title: post.title,
    date: String(post.date),
    destination: post.destination,
  }));

  const sql = getDatabase();
  const published = await sql`
    SELECT p.slug, p.title,
           COALESCE(p.original_metadata->>'date', '') AS date,
           COALESCE(p.original_metadata->>'destination', '') AS destination
    FROM travel_published p
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
  return <StorySearch posts={posts} />;
}
