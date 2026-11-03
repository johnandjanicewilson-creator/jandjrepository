import { Suspense } from "react";
import { PostCard } from "@/components/blog/PostCard";
import { BlogFilters } from "@/components/blog/BlogFilters";
import { BlogNav } from "@/components/blog/BlogNav";
import { Container } from "@/components/ui/Container";
import { getBlogPageData, filterPostsFromList } from "@/lib/posts";
import { getNewPublishedStories } from "@/lib/publishing/getPublishedStory";
import type { Post } from "@/lib/types";
import readingTime from "reading-time";

interface BlogPageProps {
  searchParams: Promise<{
    destination?: string;
    year?: string;
    category?: string;
    tag?: string;
  }>;
}

export const metadata = {
  title: "Blog",
  description: "Browse all travel stories by destination, year, category, and tag.",
  alternates: { canonical: "/blog" },
};

export const dynamic = "force-dynamic";

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const original = getBlogPageData({});
  const published = await getNewPublishedStories();
  const newPosts: Post[] = published.map((row) => {
    const meta = (row.original_metadata ?? {}) as Record<string, unknown>;
    const date = typeof meta.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(meta.date)
      ? meta.date : new Date(row.published_at as string).toISOString().slice(0, 10);
    const destination = typeof meta.destination === "string" ? meta.destination : "Travel";
    const content = String(row.content ?? "");
    return {
      slug: String(row.slug), title: String(row.title), content,
      format: "md" as const, readingTime: readingTime(content.replace(/<[^>]*>/g, " ")).text,
      date, year: Number(date.slice(0, 4)), destination,
      excerpt: typeof meta.excerpt === "string" ? meta.excerpt : "",
      featuredImage: typeof meta.featuredImage === "string" ? meta.featuredImage : "",
      featuredImageAlt: typeof meta.featuredImageAlt === "string" ? meta.featuredImageAlt : "",
      categories: [], tags: [],
    };
  });
  const allPosts = [...newPosts, ...original.allPosts].sort(
    (a, b) => b.date.localeCompare(a.date)
  );
  const posts = filterPostsFromList(allPosts, {
    destination: params.destination,
    year: params.year ? Number(params.year) : undefined,
    category: params.category,
    tag: params.tag,
  });
  const destinations = [...new Set(allPosts.map(p => p.destination))].sort();
  const years = [...new Set(allPosts.map(p => p.year))].sort((a,b) => b-a);
  const categories = [...new Set(allPosts.flatMap(p => p.categories))].sort();
  const tags = [...new Set(allPosts.flatMap(p => p.tags))].sort();

  return (
    <Container className="py-12 lg:py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-sage sm:text-5xl">
          Travel blog
        </h1>
        <p className="mt-3 text-lg text-muted">
          Every trip we&apos;ve shared since 2011—filter by where we went, when
          we traveled, or what we explored.
        </p>
        <BlogNav className="mt-6" />
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[280px_1fr]">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-cream" />}>
          <BlogFilters
            destinations={destinations}
            years={years}
            categories={categories}
            tags={tags}
          />
        </Suspense>

        <section>
          <p className="mb-6 text-sm text-muted">
            Showing {posts.length} of {allPosts.length}{" "}
            {allPosts.length === 1 ? "post" : "posts"}
          </p>

          {posts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-cream/50 p-12 text-center">
              <p className="font-display text-xl text-sage">No posts found</p>
              <p className="mt-2 text-muted">
                Try adjusting your filters to discover more adventures.
              </p>
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}
