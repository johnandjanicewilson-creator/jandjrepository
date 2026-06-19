import Link from "next/link";
import { PostCard } from "@/components/blog/PostCard";
import { Hero } from "@/components/home/Hero";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/constants";
import { getAllPosts, getFeaturedPosts, getUniqueDestinations } from "@/lib/posts";

export default function HomePage() {
  const featured = getFeaturedPosts(1)[0];
  const recentPosts = getFeaturedPosts(4).slice(featured ? 1 : 0, 4);
  const destinations = getUniqueDestinations().slice(0, 6);
  const totalPosts = getAllPosts().length;

  return (
    <>
      <Hero />

      <section className="py-16">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold text-sage sm:text-4xl">
                Latest adventures
              </h2>
              <p className="mt-2 max-w-xl text-muted">
                {totalPosts} stories and counting—from weekend getaways to
                month-long journeys since {SITE.since}.
              </p>
            </div>
            <Link
              href="/blog"
              className="text-sm font-semibold text-accent hover:text-accent-dark"
            >
              View all posts →
            </Link>
          </div>

          {featured && (
            <div className="mt-10">
              <PostCard post={featured} featured />
            </div>
          )}

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-cream/60 py-16">
        <Container>
          <h2 className="font-display text-3xl font-semibold text-sage">
            Explore by destination
          </h2>
          <p className="mt-2 text-muted">
            Browse places we&apos;ve visited around the globe.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((destination) => (
              <li key={destination}>
                <Link
                  href={`/blog?destination=${encodeURIComponent(destination)}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition hover:border-sage hover:shadow-sm"
                >
                  <span className="font-medium text-sage">{destination}</span>
                  <span className="text-accent" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/destinations"
            className="mt-6 inline-block text-sm font-semibold text-accent hover:text-accent-dark"
          >
            See all destinations →
          </Link>
        </Container>
      </section>
    </>
  );
}
