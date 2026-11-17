import { getAllPosts, slugify } from "@/lib/posts";
import type { Post } from "@/lib/types";
import { getJourneyStories } from "@/lib/publishing/getJourneyStories";

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

const presidentialLibraryExtras = new Set([
  "2013-08-09-dateline-july-26-2013-ronald-reagan-presidential-library",
  "2013-08-24-dateline-july-29-2013-richard-m-nixon-library",
  "2017-05-15-texas-presidential-libraries",
  "2017-05-28-clinton-library",
  "2017-07-18-carter-library",
  "2018-07-06-herbert-hoover",
]);

/** Public Journey stories, including approved Neon publications. */
export async function getPublicJourneyPosts(
  slug: string,
): Promise<{ name: string; posts: Post[] } | undefined> {
  const posts = await getJourneyStories();
  const matching = posts.filter(
    (post) =>
      (post.series?.trim() && slugify(post.series.trim()) === slug) ||
      (slug === "presidential-libraries" && presidentialLibraryExtras.has(post.slug)),
  );

  if (!matching.length) return undefined;

  matching.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return { name: matching[0].series!.trim(), posts: matching };
}

const hiddenPublicJourneys = new Set([
  "bermuda-2026",
  "new-orleans-2025",
  "caribbean-cruise-2022",
  "south-africa-2006",
  "cruises",
  "visits-with-friends-and-family",
  "hawaii-clay-s-wedding-2011",
]);

/** Public Journey listing, including approved Neon publications. */
export async function getPublicJourneys(): Promise<Journey[]> {
  const posts = await getJourneyStories();
  const groups = new Map<string, Post[]>();

  for (const post of posts) {
    const name = post.series?.trim();
    if (!name) continue;

    const slug = slugify(name);
    const group = groups.get(slug) ?? [];
    group.push(post);
    groups.set(slug, group);
  }

  const journeys: Journey[] = [];

  for (const [slug, group] of groups) {
    if (hiddenPublicJourneys.has(slug)) continue;

    const byDateDesc = [...group].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const newest = byDateDesc[0];
    const name = newest.series!.trim();

    const yearsPresent = [
      ...new Set(group.map((post) => post.year).filter(Boolean)),
    ].sort((a, b) => a - b);

    const years =
      yearsPresent.length === 0
        ? ""
        : yearsPresent.length === 1
          ? String(yearsPresent[0])
          : `${yearsPresent[0]}–${yearsPresent[yearsPresent.length - 1]}`;

    journeys.push({
      name,
      slug,
      postCount:
        slug === "presidential-libraries"
          ? new Set([
              ...group.map((post) => post.slug),
              ...posts.filter((post) => presidentialLibraryExtras.has(post.slug))
                .map((post) => post.slug),
            ]).size
          : group.length,
      coverImage: newest.featuredImage,
      latestDate: newest.date,
      years,
    });
  }

  return journeys.sort((a, b) => {
    const ay = seriesYear(a.name);
    const by = seriesYear(b.name);

    if (ay && by && ay !== by) return by - ay;

    return new Date(b.latestDate).getTime() -
      new Date(a.latestDate).getTime();
  });
}
