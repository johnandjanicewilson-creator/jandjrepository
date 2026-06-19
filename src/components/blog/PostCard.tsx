import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/types";
import { formatDate, getPostDisplayDate } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  featured?: boolean;
}

export function PostCard({ post, featured = false }: PostCardProps) {
  const displayDate = getPostDisplayDate(post);
  return (
    <article
      className={
        featured
          ? "group grid overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md md:grid-cols-2"
          : "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      }
    >
      <Link
        href={`/blog/${post.slug}`}
        className={featured ? "relative aspect-[4/3] md:aspect-auto md:min-h-[320px]" : "relative aspect-[16/10]"}
      >
        <Image
          src={post.featuredImage}
          alt={post.featuredImageAlt ?? post.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"}
          priority={featured}
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-sage backdrop-blur">
          {post.destination}
        </span>
      </Link>

      <div className={featured ? "flex flex-col justify-center p-6 md:p-8" : "flex flex-1 flex-col p-5"}>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <time dateTime={displayDate}>{formatDate(displayDate)}</time>
          <span aria-hidden>·</span>
          <span>{post.readingTime}</span>
          <span aria-hidden>·</span>
          <span>{post.year}</span>
        </div>

        <h2
          className={
            featured
              ? "mt-3 font-display text-2xl font-semibold text-sage md:text-3xl"
              : "mt-2 font-display text-xl font-semibold text-sage"
          }
        >
          <Link href={`/blog/${post.slug}`} className="hover:text-accent">
            {post.title}
          </Link>
        </h2>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
          {post.excerpt}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(post.tags ?? []).slice(0, 3).map((tag, index) => (
            <Link
              key={`${tag}-${index}`}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-sage hover:bg-sage-light"
            >
              #{tag}
            </Link>
          ))}
        </div>

        <Link
          href={`/blog/${post.slug}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent-dark"
        >
          Read story
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
