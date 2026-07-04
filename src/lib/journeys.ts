import { getAllPosts, slugify } from "@/lib/posts";
import type { Post } from "@/lib/types";

export interface Journey {
  name: string;
  slug: string;
  postCount: number;
  coverImage: string;
  latestDate: string;
  years: string;
}

function seriesYear(name: string): number | null {
  const m = name.match(/(\d{4})\s*$/);
  return m ? Number(m[1]) : null;
}

export function getJourneyPosts(slug: string): { name: string; posts: Post[] } | undefined {
  const groups = new Map<string, Post[]>();
  for (const post of getAllPosts()) {
    const name = post.series?.trim();
    if (!name) continue;
    const list = groups.get(name) ?? [];
    list.push(post);
    groups.set(name, list);
  }

  for (const [name, posts] of groups) {
    if (slugify(name) === slug) {
      const ordered = [...posts].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      return { name, posts: ordered };
    }
  }
  return undefined;
}

export function getJourneys(): Journey[] {
  const groups = new Map<string, Post[]>();
  for (const post of getAllPosts()) {
    const name = post.series?.trim();
    if (!name) continue;
    const list = groups.get(name) ?? [];
    list.push(post);
    groups.set(name, list);
  }

  const journeys: Journey[] = [];
  for (const [name, posts] of groups) {
    const byDateDesc = [...posts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const newest = byDateDesc[0];
    const yearsPresent = [...new Set(posts.map((p) => p.year).filter(Boolean))].sort(
      (a, b) => a - b,
    );
    const years =
      yearsPresent.length === 0
        ? ""
        : yearsPresent.length === 1
          ? String(yearsPresent[0])
          : `${yearsPresent[0]}\u2013${yearsPresent[yearsPresent.length - 1]}`;

    journeys.push({
      name,
      slug: slugify(name),
      postCount: posts.length,
      coverImage: newest.featuredImage,
      latestDate: newest.date,
      years,
    });
  }

  return journeys.sort((a, b) => {
    const ay = seriesYear(a.name);
    const by = seriesYear(b.name);
    if (ay && by && ay !== by) return by - ay;
    return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
  });
}

export function getAllJourneySlugs(): string[] {
  return getJourneys().map((j) => j.slug);
}
