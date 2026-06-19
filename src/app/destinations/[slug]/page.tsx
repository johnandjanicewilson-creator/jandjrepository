import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/blog/PostCard";
import { Container } from "@/components/ui/Container";
import { getDestinations, getPostsByDestination } from "@/lib/posts";
import {
  getActivePlacesForDestination,
  type ActivePlace,
} from "@/lib/places";
import type { Metadata } from "next";

interface DestinationPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getDestinations().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: DestinationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = getDestinations().find((d) => d.slug === slug);

  if (!destination) return { title: "Destination not found" };

  return {
    title: destination.name,
    description: `Travel stories from ${destination.name} — ${destination.postCount} posts.`,
  };
}

function PlaceCard({
  place,
  destinationSlug,
}: {
  place: ActivePlace;
  destinationSlug: string;
}) {
  return (
    <Link
      href={`/destinations/${destinationSlug}/${place.slug}`}
      className="group overflow-hidden rounded-xl border border-border"
    >
      <div className="relative aspect-[4/3]">
        {place.coverImage && (
          <Image
            src={place.coverImage}
            alt={place.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <p className="font-display text-lg font-semibold">{place.name}</p>
          <p className="text-xs opacity-80">
            {place.postCount} {place.postCount === 1 ? "story" : "stories"}
          </p>
        </div>
      </div>
    </Link>
  );
}

function PlacesSubsection({
  title,
  places,
  destinationSlug,
}: {
  title: string;
  places: ActivePlace[];
  destinationSlug: string;
}) {
  if (places.length === 0) return null;
  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted mb-3">
        {title}
      </h3>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {places.map((place) => (
          <PlaceCard
            key={place.slug}
            place={place}
            destinationSlug={destinationSlug}
          />
        ))}
      </div>
    </div>
  );
}

export default async function DestinationPage({
  params,
}: DestinationPageProps) {
  const { slug } = await params;
  const destination = getDestinations().find((d) => d.slug === slug);

  if (!destination) notFound();

  const posts = getPostsByDestination(slug);
  const { cities, parks, pointsOfInterest } =
    getActivePlacesForDestination(slug);

  const hasPlaces =
    cities.length > 0 || parks.length > 0 || pointsOfInterest.length > 0;

  return (
    <Container className="py-12 lg:py-16">
      <div className="relative mb-10 aspect-[21/9] overflow-hidden rounded-2xl">
        <Image
          src={destination.coverImage}
          alt={destination.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <p className="text-sm font-medium uppercase tracking-wider text-white/80">
            {destination.region}
          </p>
          <h1 className="font-display text-4xl font-semibold text-white sm:text-5xl">
            {destination.name}
          </h1>
          <p className="mt-2 text-white/90">
            {destination.postCount}{" "}
            {destination.postCount === 1 ? "adventure" : "adventures"} documented
          </p>
        </div>
      </div>

      {hasPlaces && (
        <section className="mb-12">
          <h2 className="font-display text-2xl font-semibold text-sage mb-6">
            Places in {destination.name}
          </h2>
          <PlacesSubsection
            title="Cities & Towns"
            places={cities}
            destinationSlug={slug}
          />
          <PlacesSubsection
            title="Parks"
            places={parks}
            destinationSlug={slug}
          />
          <PlacesSubsection
            title="Points of Interest"
            places={pointsOfInterest}
            destinationSlug={slug}
          />
        </section>
      )}

      <h2 className="font-display text-2xl font-semibold text-sage mb-6">
        All Stories
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </Container>
  );
}
