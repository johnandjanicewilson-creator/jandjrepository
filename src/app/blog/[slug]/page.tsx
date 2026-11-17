import { getPublishedStory } from "@/lib/publishing/getPublishedStory";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageGallery } from "@/components/blog/ImageGallery";
import { PostContent } from "@/components/blog/PostContent";
import { PostMdx } from "@/components/blog/PostMdx";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { SeriesBanner } from "@/components/blog/SeriesBanner";
import { getPublicJourneyPosts } from "@/lib/journeys";
import { markdownToHtml } from "@/lib/markdown";
import {
  getAllPostSlugs,
  getPostBySlug,
  getRelatedPosts,
  slugify,
} from "@/lib/posts";
import { formatDate, getPostDisplayDate } from "@/lib/utils";
import type { Metadata } from "next";
import type { Post } from "@/lib/types";
import readingTime from "reading-time";

export const dynamic = "force-dynamic";

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
  const original = getPostBySlug(slug);
  const published = await getPublishedStory(slug);
  if (!original && !published) return { title: "Post not found" };
  const meta = (published?.original_metadata ?? {}) as Record<string, unknown>;
  const title = published ? String(published.title) : original!.title;
  const description = typeof meta.excerpt === "string" ? meta.excerpt : (original?.excerpt ?? "");
  const image = typeof meta.featuredImage === "string" && meta.featuredImage
    ? meta.featuredImage : (original?.featuredImage ?? "");
  const date = original?.date ?? (typeof meta.date === "string" ? meta.date : "");
  return {
    title, description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title, description,
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
      type: "article",
      ...(date ? { publishedTime: date } : {}),
    },
  };

}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const original = getPostBySlug(slug);
  const published = await getPublishedStory(slug);
  if (!original && !published) notFound();
  const newMeta = (published?.original_metadata ?? {}) as Record<string, unknown>;
  const newDate = typeof newMeta.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(newMeta.date)
    ? newMeta.date : published ? new Date(published.published_at as string).toISOString().slice(0, 10) : "";
  const post: Post = original ?? {
    slug, title: String(published!.title), content: String(published!.content),
    format: "md", readingTime: readingTime(String(published!.content).replace(/<[^>]*>/g, " ")).text,
    date: newDate, year: Number(newDate.slice(0, 4)),
    destination: typeof newMeta.destination === "string" ? newMeta.destination : "Travel",
    series: typeof newMeta.series === "string" ? newMeta.series : "",
    excerpt: typeof newMeta.excerpt === "string" ? newMeta.excerpt : "",
    featuredImage: typeof newMeta.featuredImage === "string" ? newMeta.featuredImage : "",
    featuredImageAlt: typeof newMeta.featuredImageAlt === "string" ? newMeta.featuredImageAlt : "",
    categories: [], tags: [],
  };
  const journey = post.series?.trim()
    ? await getPublicJourneyPosts(slugify(post.series.trim()))
    : undefined;
  const journeyIndex = journey?.posts.findIndex((item) => item.slug === slug) ?? -1;
  const previousStory = journeyIndex > 0
    ? journey!.posts[journeyIndex - 1]
    : undefined;
  const nextStory = journey && journeyIndex >= 0
    ? journey.posts[journeyIndex + 1]
    : undefined;

  const displayDate = getPostDisplayDate(post);
  const related = original ? getRelatedPosts(post) : [];

  const publishedMetadata = (published?.original_metadata ?? {}) as Record<string, unknown>;
  const publishedTitle = published && typeof published.title === "string"
    ? published.title : post.title;
  const publishedImage = published && typeof publishedMetadata.featuredImage === "string" && publishedMetadata.featuredImage
    ? publishedMetadata.featuredImage : post.featuredImage;
  const publishedImageAlt = published && typeof publishedMetadata.featuredImageAlt === "string"
    ? publishedMetadata.featuredImageAlt : (post.featuredImageAlt ?? post.title);

  const body = published ? (
    <PostContent html={published.content as string} />
  ) : post.format === "mdx" ? (
    <PostMdx content={post.content} />
  ) : (
    <PostContent html={await markdownToHtml(post.content)} />
  );

  return (
    <article className="blog-post w-full">
      {publishedImage && <div className="relative mx-auto mt-8 h-[320px] w-full max-w-4xl px-6 sm:h-[420px]">
        <Image
          src={publishedImage}
          alt={publishedImageAlt}
          fill
          priority
          className="object-contain"
          sizes="100vw"
        />

      </div>}

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
            {publishedTitle}
          </h1>

        </header>

        <SeriesBanner series={post.series} />

        {!published && post.gallery && post.gallery.length > 0 && (
          <div className="mt-10">
            <ImageGallery images={post.gallery} />
          </div>
        )}

        <div className="mt-10">{body}</div>
      </section>

      {journey && journeyIndex >= 0 && (
        <nav
          aria-label="Journey navigation"
          className="mx-auto my-10 max-w-4xl px-6"
        >
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-4 text-center text-sm text-muted">
              {journey.name} — Story {journeyIndex + 1} of {journey.posts.length}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                {previousStory && (
                  <Link href={`/blog/${previousStory.slug}`} className="font-semibold text-accent hover:underline">
                    ← Previous Story
                  </Link>
                )}
              </div>
              <Link href={`/journeys/${slugify(journey.name)}`} className="font-semibold text-accent hover:underline">
                Back to Journey
              </Link>
              <div>
                {nextStory && (
                  <Link href={`/blog/${nextStory.slug}`} className="font-semibold text-accent hover:underline">
                    Next Story →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

      <RelatedPosts posts={related} />
    </article>
  );
}
