import { PostCard } from "@/components/blog/PostCard";
import { Container } from "@/components/ui/Container";
import type { Post } from "@/lib/types";

interface RelatedPostsProps {
  posts: Post[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts.length) return null;

  return (
    <section className="border-t border-border bg-cream/50 py-14">
      <Container>
        <h2 className="font-display text-2xl font-semibold text-sage sm:text-3xl">
          You might also enjoy
        </h2>
        <p className="mt-2 text-muted">
          More adventures from similar destinations and themes.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </Container>
    </section>
  );
}
