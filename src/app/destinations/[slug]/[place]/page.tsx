import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/blog/PostCard";
import { Container } from "@/components/ui/Container";
import { getDestinations } from "@/lib/posts";
import {
  getActivePlacesForDestination,
  getPostsByPlace,
} from "@/lib/places";
import { DESTINATIONS, getPlaceBySlug } from "@/lib/taxonomy";
import type { Metadata } from "next";

interface PlacePageProps {
  params: Promise<{ slug: string; place: string }>;
}

export async function generateStaticParams() {
  const params: { slug: string; place: string }[] = [];
  for (const dest of Object.values(DESTINATIONS)) {
    const { cities, parks, pointsOfInterest } =
      getActivePlacesForDestination(dest.slug);
    for (const place of [...cities, ...parks, ...pointsOfInterest]) {
      params.push({ slug: dest.slug, place: place.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: PlacePageProps): Promise<Metadata> {
  const { slug, place: placeSlug } = await params;
  const place = getPlaceBySlug(slug, placeSlug);
  const destination = getDestinations().find((d) => d.slug === slug);

  if (!place || !destination) return { title: "Place not found" };

  return {
    title: `${place.name} — ${destination.name}`,
    description: `Travel stories from ${place.name}, ${destination.name}.`,
  };
}

const TYPE_LABELS: Record<string, string> = {
  city: "City",
  park: "Park",
  point_of_interest: "Point of Interest",
};

export default async function PlacePage({ params }: PlacePageProps) {
  const { slug, place: placeSlug } = await params;
  const place = getPlaceBySlug(slug, placeSlug);
  const destination = getDestinations().find((d) => d.slug === slug);

  if (!place || !destination) notFound();

  const posts = getPostsByPlace(slug, placeSlug);
  const typeLabel = TYPE_LABELS[place.type] ?? place.type;

  return (
    <Container className="py-12 lg:py-16">
      <nav className="text-sm text-muted mb-6">
        <Link href="/destinations" className="hover:text-sage">
          Destinations
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/destinations/${slug}`} className="hover:text-sage">
          {destination.name}
        </Link>
        <span className="mx-2">/</span>
        <span>{place.name}</span>
      </nav>

      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-wider text-muted">
          {typeLabel}
        </p>
        <h1 className="font-display text-4xl font-semibold text-sage sm:text-5xl">
          {place.name}
        </h1>
        <p className="mt-2 text-muted">
          {posts.length} {posts.length === 1 ? "story" : "stories"} from{" "}
          {place.name}
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </Container>
  );
}
