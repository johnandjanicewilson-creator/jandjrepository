import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { getPublicJourneys, getPublicJourneyPosts } from "@/lib/journeys";
import { getPostDisplayDate, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface JourneyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const journeys = await getPublicJourneys();
  return journeys.map((journey) => ({ slug: journey.slug }));
}

export async function generateMetadata({
  params,
}: JourneyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const journey = await getPublicJourneyPosts(slug);
  if (!journey) return { title: "Journey not found" };
  return {
    title: journey.name,
    description: `Every story from ${journey.name}, in order.`,
  };
}

export default async function JourneyPage({ params }: JourneyPageProps) {
  const { slug } = await params;
  const journey = await getPublicJourneyPosts(slug);
  if (!journey) notFound();

  const { name, posts } = journey;

  const chapters =
    slug === "ten-weeks-across-europe-2016" && posts.length === 24
      ? [
          { title: "Across the Atlantic and Northern Europe", description: "The Atlantic crossing, Norwegian fjords, St. Petersburg, and the Baltic capitals.", start: 0, end: 4 },
          { title: "Central Europe", description: "Berlin, Prague, Poland, Budapest, Vienna, Switzerland, and Milan.", start: 4, end: 11 },
          { title: "Exploring Italy", description: "Venice, Florence, Tuscany, the Amalfi Coast, Pompeii, and Rome.", start: 11, end: 17 },
          { title: "Greece, Israel and Istanbul", description: "Athens, the Greek Isles, the Holy Land, and Istanbul.", start: 17, end: 24 },
        ]
      : null;

  return (
    <Container className="py-12 lg:py-16">
      <header className="max-w-2xl">
        <Link
          href="/journeys"
          className="text-sm font-semibold text-accent hover:text-accent-dark"
        >
          ← All journeys
        </Link>
        <h1 className="mt-3 font-display text-4xl font-semibold text-sage sm:text-5xl">
          {name}
        </h1>
        <p className="mt-3 text-lg text-muted">
          {posts.length} {posts.length === 1 ? "story" : "stories"}, in order
          from the beginning of the trip.
        </p>
        {posts.length > 0 && (
          <Link
            href={`/blog/${posts[0].slug}`}
            className="mt-6 inline-flex items-center rounded-xl bg-sage px-6 py-3 font-semibold text-white transition hover:bg-sage-dark"
          >
            Start This Journey →
          </Link>
        )}
      </header>

      {slug === "ten-weeks-across-europe-2016" && (
        <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-md">
          <Image
            src="/images/ten-weeks-europe-banner-clean.png"
            alt="John and Janice at Peterhof Palace, celebrating their 2016 European adventure"
            fill
            priority
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 1100px"
          />
        </div>
      )}

      {chapters ? (
        <div className="mt-10 space-y-4">
          {chapters.map((chapter, chapterIndex) => (
            <details
              key={chapter.title}
              className="group rounded-2xl border border-border bg-card p-5"
            >
              <summary className="flex cursor-pointer list-none flex-col gap-4 sm:flex-row sm:items-center [&::-webkit-details-marker]:hidden">
                <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl sm:aspect-[4/3] sm:w-56">
                  {posts[chapter.start].featuredImage ? (
                    <Image
                      src={posts[chapter.start].featuredImage}
                      alt={posts[chapter.start].featuredImageAlt ?? chapter.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 224px"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-sage" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl font-semibold text-sage">
                    Chapter {chapterIndex + 1}: {chapter.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {chapter.end - chapter.start} stories
                  </p>
                  <p className="mt-2 text-sm">
                    {chapter.description}
                  </p>
                </div>
                <span aria-hidden="true" className="text-2xl text-sage">
                  <span className="group-open:hidden">⌄</span>
                  <span className="hidden group-open:inline">⌃</span>
                </span>
              </summary>
              <ol className="mt-6 space-y-6">
                {posts.slice(chapter.start, chapter.end).map((post, i) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="block rounded-xl border border-border p-4 transition hover:shadow-md"
                    >
                      <span className="text-sm text-muted">
                        Story {chapter.start + i + 1}
                      </span>
                      <h2 className="font-display text-lg font-semibold text-sage">
                        {post.title}
                      </h2>
                    </Link>
                  </li>
                ))}
              </ol>
            </details>
          ))}
        </div>
      ) : (
      <ol className="mt-10 space-y-6">
        {posts.map((post, i) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row"
            >
              <div className="relative aspect-[16/9] w-full shrink-0 sm:aspect-[4/3] sm:w-56">
                {post.featuredImage ? (
                  <Image
                    src={post.featuredImage}
                    alt={post.featuredImageAlt ?? post.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 224px"
                  />
                ) : (
                  <div className="absolute inset-0 bg-sage" />
                )}
                <div className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-sage text-xs font-semibold text-white">
                  {i + 1}
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  {formatDate(getPostDisplayDate(post))}
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-sage">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted">
                  {post.excerpt}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
      )}
    </Container>
  );
}
