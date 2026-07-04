import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { getAllJourneySlugs, getJourneyPosts } from "@/lib/journeys";
import { getPostDisplayDate, formatDate } from "@/lib/utils";

interface JourneyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllJourneySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: JourneyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const journey = getJourneyPosts(slug);
  if (!journey) return { title: "Journey not found" };
  return {
    title: journey.name,
    description: `Every story from ${journey.name}, in order.`,
  };
}

export default async function JourneyPage({ params }: JourneyPageProps) {
  const { slug } = await params;
  const journey = getJourneyPosts(slug);
  if (!journey) notFound();

  const { name, posts } = journey;

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
      </header>

      <ol className="mt-10 space-y-6">
        {posts.map((post, i) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row"
            >
              <div className="relative aspect-[16/9] w-full shrink-0 sm:aspect-[4/3] sm:w-56">
                <Image
                  src={post.featuredImage}
                  alt={post.featuredImageAlt ?? post.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 224px"
                />
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
    </Container>
  );
}
