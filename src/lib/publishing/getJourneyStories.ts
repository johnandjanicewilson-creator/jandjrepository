import "server-only";
import readingTime from "reading-time";
import { getAllPosts } from "@/lib/posts";
import { getAllPublishedStories } from "@/lib/publishing/getPublishedStory";
import type { Post } from "@/lib/types";

export async function getJourneyStories(): Promise<Post[]> {
  const posts = new Map(getAllPosts().map((post) => [post.slug, post]));
  const published = await getAllPublishedStories();

  for (const row of published) {
    const slug = String(row.slug);
    const original = posts.get(slug);
    const meta = (row.original_metadata ?? {}) as Record<string, unknown>;
    const value = (key: string, fallback: string): string =>
      typeof meta[key] === "string" ? meta[key] as string : fallback;

    const date = value(
      "date",
      original?.date ?? new Date(row.published_at as string).toISOString().slice(0, 10),
    );

    const content = String(row.content);

    const post: Post = {
      slug,
      title: String(row.title),
      content,
      format: "md",
      readingTime: readingTime(content.replace(/<[^>]*>/g, " ")).text,
      date,
      year: Number(date.slice(0, 4)) || original?.year || 0,
      destination: value("destination", original?.destination ?? "Travel"),
      series: value("series", original?.series ?? ""),
      excerpt: value("excerpt", original?.excerpt ?? ""),
      featuredImage: value("featuredImage", original?.featuredImage ?? ""),
      featuredImageAlt: value("featuredImageAlt", original?.featuredImageAlt ?? ""),
      categories: original?.categories ?? [],
      tags: original?.tags ?? [],
      ...(original?.dateline ? { dateline: original.dateline } : {}),
      ...(original?.region ? { region: original.region } : {}),
      ...(original?.gallery ? { gallery: original.gallery } : {}),
      ...(original?.places ? { places: original.places } : {}),
    };

    posts.set(slug, post);
  }

  return [...posts.values()];
}
