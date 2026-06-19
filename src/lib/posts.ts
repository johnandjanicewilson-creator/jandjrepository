import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type {
  DestinationGroup,
  Post,
  PostFormat,
  PostFrontmatter,
  SearchResult,
} from "./types";

const POSTS_DIRECTORY = path.join(process.cwd(), "content/posts");

function getPostFormat(filename: string): PostFormat | null {
  if (filename.endsWith(".mdx")) return "mdx";
  if (filename.endsWith(".md")) return "md";
  return null;
}

function getSlugFromFilename(filename: string): string {
  return filename.replace(/\.mdx?$/, "");
}

function getPostFileEntries(): { filePath: string; format: PostFormat }[] {
  if (!fs.existsSync(POSTS_DIRECTORY)) {
    return [];
  }

  return fs
    .readdirSync(POSTS_DIRECTORY)
    .map((file) => {
      const format = getPostFormat(file);
      if (!format) return null;
      return { filePath: path.join(POSTS_DIRECTORY, file), format };
    })
    .filter((entry): entry is { filePath: string; format: PostFormat } =>
      Boolean(entry),
    );
}

function normalizeStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return [...new Set(value.map(String).filter((item) => item.trim().length > 0))];
  }
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function parsePost(filePath: string, format: PostFormat): Post {
  const slug = getSlugFromFilename(path.basename(filePath));
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);
  const frontmatter = data as PostFrontmatter;

  return {
    
    slug,
    format,
    content,
    readingTime: readingTime(content).text,
    ...frontmatter,
    categories: normalizeStringArray(frontmatter.categories),
    tags: normalizeStringArray(frontmatter.tags),
  };
}

/** One post per slug; `.mdx` wins over `.md` when both exist. */
function loadAllPostsMap(includeDrafts: boolean): Map<string, Post> {
  const bySlug = new Map<string, Post>();

  for (const { filePath, format } of getPostFileEntries()) {
    try {
      const post = parsePost(filePath, format);
      if (!includeDrafts && post.draft) continue;

      const existing = bySlug.get(post.slug);
      if (!existing || format === "mdx") {
        bySlug.set(post.slug, post);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Skipping post ${path.basename(filePath)}: ${message}`);
    }
  }

  return bySlug;
}

export function getAllPosts(includeDrafts = false): Post[] {
  return Array.from(loadAllPostsMap(includeDrafts).values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getPostBySlug(slug: string): Post | undefined {
  const mdxPath = path.join(POSTS_DIRECTORY, `${slug}.mdx`);
  const mdPath = path.join(POSTS_DIRECTORY, `${slug}.md`);

  if (fs.existsSync(mdxPath)) {
    return parsePost(mdxPath, "mdx");
  }

  if (fs.existsSync(mdPath)) {
    return parsePost(mdPath, "md");
  }

  return undefined;
}

export function isMdxPost(post: Post): boolean {
  return post.format === "mdx";
}

export function getAllPostSlugs(): string[] {
  return getAllPosts().map((post) => post.slug);
}

export function getFeaturedPosts(limit = 3): Post[] {
  return getAllPosts().slice(0, limit);
}

export function getRelatedPosts(current: Post, limit = 3): Post[] {
  return getAllPosts()
    .filter((post) => post.slug !== current.slug)
    .map((post) => {
      const postTags = post.tags ?? [];
      const currentTags = current.tags ?? [];
      const postCategories = post.categories ?? [];
      const currentCategories = current.categories ?? [];
      const sharedTags = postTags.filter((tag) => currentTags.includes(tag));
      const sameDestination = post.destination === current.destination;
      const sameCategory = postCategories.some((cat) =>
        currentCategories.includes(cat),
      );

      let score = 0;
      if (sameDestination) score += 3;
      if (sameCategory) score += 2;
      score += sharedTags.length;

      return { post, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);
}

export function getDestinations(): DestinationGroup[] {
  const posts = getAllPosts();
  const map = new Map<string, DestinationGroup>();

  for (const post of posts) {
    const slug = slugify(post.destination);
    const existing = map.get(slug);

    if (existing) {
      existing.postCount += 1;
      existing.latestYear = Math.max(existing.latestYear, post.year);
      if (new Date(post.date) > new Date(existing.coverImage ? post.date : 0)) {
        existing.coverImage = post.featuredImage;
      }
    } else {
      map.set(slug, {
        name: post.destination,
        slug,
        region: post.region ?? "World",
        postCount: 1,
        coverImage: post.featuredImage,
        latestYear: post.year,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function getPostsByDestination(destinationSlug: string): Post[] {
  return getAllPosts().filter(
    (post) => slugify(post.destination) === destinationSlug,
  );
}

export function getUniqueDestinations(): string[] {
  return [...new Set(getAllPosts().map((post) => post.destination))].sort();
}

export function getUniqueYears(): number[] {
  return [
    ...new Set(
      getAllPosts()
        .map((post) => post.year)
        .filter((year): year is number => typeof year === "number" && !Number.isNaN(year)),
    ),
  ].sort((a, b) => b - a);
}

export function getAllCategories(): string[] {
  const categories = getAllPosts().flatMap((post) => post.categories ?? []);
  return [...new Set(categories)].filter(Boolean).sort();
}

export function getAllTags(): string[] {
  const tags = getAllPosts().flatMap((post) => post.tags ?? []);
  return [...new Set(tags)].filter(Boolean).sort();
}

export function filterPosts(options: {
  destination?: string;
  year?: number;
  category?: string;
  tag?: string;
  query?: string;
}): Post[] {
  return filterPostsFromList(getAllPosts(), options);
}

export function filterPostsFromList(
  posts: Post[],
  options: {
    destination?: string;
    year?: number;
    category?: string;
    tag?: string;
    query?: string;
  },
): Post[] {
  const { destination, year, category, tag, query } = options;
  const normalizedQuery = query?.trim().toLowerCase();

  return posts.filter((post) => {
    if (destination && post.destination !== destination) return false;
    if (year && post.year !== year) return false;
    if (category && !(post.categories ?? []).includes(category)) return false;
    if (tag && !(post.tags ?? []).includes(tag)) return false;

    if (normalizedQuery) {
      const haystack = [
        post.title,
        post.excerpt,
        post.destination,
        post.region ?? "",
        ...(post.tags ?? []),
        ...(post.categories ?? []),
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(normalizedQuery)) return false;
    }

    return true;
  });
}

export function getBlogPageData(options: {
  destination?: string;
  year?: number;
  category?: string;
  tag?: string;
  query?: string;
}) {
  const allPosts = getAllPosts();

  return {
    allPosts,
    posts: filterPostsFromList(allPosts, options),
    destinations: [
      ...new Set(
        allPosts.map((post) => post.destination).filter((value) => Boolean(value?.trim())),
      ),
    ].sort(),
    years: [
      ...new Set(
        allPosts
          .map((post) => post.year)
          .filter((year): year is number => typeof year === "number" && !Number.isNaN(year)),
      ),
    ].sort((a, b) => b - a),
    categories: [
      ...new Set(allPosts.flatMap((post) => post.categories ?? []).filter(Boolean)),
    ].sort(),
    tags: [...new Set(allPosts.flatMap((post) => post.tags ?? []).filter(Boolean))].sort(),
  };
}

export function searchPosts(query: string): SearchResult[] {
  return filterPosts({ query }).map(
    ({
      slug,
      title,
      excerpt,
      destination,
      year,
      featuredImage,
      date,
      dateline,
      series,
    }) => ({
      slug,
      title,
      excerpt,
      destination,
      year,
      featuredImage,
      date,
      dateline,
      series,
    }),
  );
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
