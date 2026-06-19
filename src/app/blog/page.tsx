import { Suspense } from "react";
import { PostCard } from "@/components/blog/PostCard";
import { BlogFilters } from "@/components/blog/BlogFilters";
import { BlogNav } from "@/components/blog/BlogNav";
import { Container } from "@/components/ui/Container";
import { getBlogPageData } from "@/lib/posts";

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
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const { posts, destinations, years, categories, tags, allPosts } =
    getBlogPageData({
      destination: params.destination,
      year: params.year ? Number(params.year) : undefined,
      category: params.category,
      tag: params.tag,
    });

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
