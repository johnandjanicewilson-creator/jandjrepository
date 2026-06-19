import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageGallery } from "@/components/blog/ImageGallery";
import { PostContent } from "@/components/blog/PostContent";
import { PostMdx } from "@/components/blog/PostMdx";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { SeriesBanner } from "@/components/blog/SeriesBanner";
import { markdownToHtml } from "@/lib/markdown";
import {
  getAllPostSlugs,
  getPostBySlug,
  getRelatedPosts,
  slugify,
} from "@/lib/posts";
import { formatDate, getPostDisplayDate } from "@/lib/utils";
import type { Metadata } from "next";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.featuredImage, alt: post.featuredImageAlt ?? post.title }],
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const displayDate = getPostDisplayDate(post);
  const related = getRelatedPosts(post);
  const body =
    post.format === "mdx" ? (
      <PostMdx content={post.content} />
    ) : (
      <PostContent html={await markdownToHtml(post.content)} />
    );

  return (
    <article className="blog-post w-full">
      <div className="relative h-[45vh] min-h-[320px] w-full">
        <Image
          src={post.featuredImage}
          alt={post.featuredImageAlt ?? post.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <section className="post-content-area">
        <header>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <Link
              href={`/destinations/${slugify(post.destination)}`}
              className="font-semibold text-accent hover:underline"
            >
              {post.destination}
            </Link>
            <span aria-hidden>·</span>
            <time dateTime={displayDate}>{formatDate(displayDate)}</time>
            <span aria-hidden>·</span>
            <span>{post.readingTime}</span>
          </div>

          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-sage sm:text-5xl lg:text-6xl">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap gap-2">
            {post.categories.map((category) => (
              <Link
                key={category}
                href={`/blog?category=${encodeURIComponent(category)}`}
                className="rounded-full bg-sage-light px-3 py-1 text-xs font-semibold text-sage"
              >
                {category}
              </Link>
            ))}
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-muted"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </header>

        <SeriesBanner series={post.series} />

        {post.gallery && post.gallery.length > 0 && (
          <div className="mt-10">
            <ImageGallery images={post.gallery} />
          </div>
        )}

        <div className="mt-10">{body}</div>
      </section>

      <RelatedPosts posts={related} />
    </article>
  );
}
