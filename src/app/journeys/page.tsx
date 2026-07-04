import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getJourneys } from "@/lib/journeys";

export const metadata = {
  title: "Journeys",
  description:
    "Our trips, newest first. Pick one and read it from start to finish.",
};

export default function JourneysPage() {
  const journeys = getJourneys();

  return (
    <Container className="py-12 lg:py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-sage sm:text-5xl">
          Journeys
        </h1>
        <p className="mt-3 text-lg text-muted">
          Every trip we&apos;ve taken, newest first. Pick one and read it from
          start to finish.
        </p>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {journeys.map((journey) => (
          <Link
            key={journey.slug}
            href={`/journeys/${journey.slug}`}
            className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={journey.coverImage}
                alt={journey.name}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                {journey.years && (
                  <p className="text-xs font-medium uppercase tracking-wider text-white/80">
                    {journey.years}
                  </p>
                )}
                <h2 className="font-display text-2xl font-semibold">
                  {journey.name}
                </h2>
                <p className="mt-1 text-sm text-white/85">
                  {journey.postCount}{" "}
                  {journey.postCount === 1 ? "story" : "stories"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
