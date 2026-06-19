import Link from "next/link";
import { BlogNav } from "@/components/blog/BlogNav";
import { Container } from "@/components/ui/Container";
import { getAllPosts } from "@/lib/posts";
import { SITE } from "@/lib/constants";
import { formatDate, getPostDisplayDate } from "@/lib/utils";

export const metadata = {
  title: "All Posts",
  description: `Complete chronological list of every travel story from ${SITE.since} to today.`,
};

export default function AllPostsPage() {
  const posts = getAllPosts();

  return (
    <Container className="py-12 lg:py-16">
      <header className="max-w-3xl">
        <h1 className="font-display text-4xl font-semibold text-sage sm:text-5xl">
          All posts
        </h1>
        <p className="mt-3 text-lg text-muted">
          Every story from {SITE.since} to today — scroll through the full
          archive, newest first.
        </p>
        <p className="mt-2 text-sm text-muted">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
        <BlogNav className="mt-6" />
      </header>

      <ol className="mt-10 max-w-3xl divide-y divide-border border-y border-border">
        {posts.map((post) => {
          const displayDate = getPostDisplayDate(post);
          return (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group block py-5 transition-colors hover:bg-cream/60 sm:py-6"
            >
              <time
                dateTime={displayDate}
                className="text-sm font-medium text-accent"
              >
                {formatDate(displayDate)}
              </time>
              <h2 className="mt-1 font-display text-xl font-semibold text-sage group-hover:text-accent sm:text-2xl">
                {post.title}
              </h2>
              {post.excerpt?.trim() ? (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted sm:text-base">
                  {post.excerpt}
                </p>
              ) : null}
            </Link>
          </li>
          );
        })}
      </ol>
    </Container>
  );
}
