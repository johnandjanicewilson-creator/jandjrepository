import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getDestinations } from "@/lib/posts";

export const metadata = {
  title: "Destinations",
  description: "Explore our travel stories organized by destination around the world.",
};

export default function DestinationsPage() {
  const destinations = getDestinations();

  return (
    <Container className="py-12 lg:py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-sage sm:text-5xl">
          Destinations
        </h1>
        <p className="mt-3 text-lg text-muted">
          From European cities to Pacific islands—every place we&apos;ve explored,
          organized by location.
        </p>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((destination) => (
          <Link
            key={destination.slug}
            href={`/destinations/${destination.slug}`}
            className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={destination.coverImage}
                alt={destination.name}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-xs font-medium uppercase tracking-wider text-white/80">
                  {destination.region}
                </p>
                <h2 className="font-display text-2xl font-semibold">
                  {destination.name}
                </h2>
                <p className="mt-1 text-sm text-white/85">
                  {destination.postCount}{" "}
                  {destination.postCount === 1 ? "story" : "stories"} · Latest{" "}
                  {destination.latestYear}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
