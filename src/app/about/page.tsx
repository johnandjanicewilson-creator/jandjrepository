import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/constants";

export const metadata = {
  title: "About",
  description: "Meet John and Janice — the couple behind our travel adventures since 2011.",
};

export default function AboutPage() {
  return (
    <Container className="py-12 lg:py-16">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
          <Image
            src="https://images.unsplash.com/photo-1529156069898-acfbea6f48a2?w=800&q=80"
            alt="John and Janice traveling together"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>

        <div>
          <h1 className="font-display text-4xl font-semibold text-sage sm:text-5xl">
            Our story
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            We&apos;re John and Janice—a couple who believes the best souvenirs
            are stories. What started as a long weekend in Vermont in 2011 grew
            into a decade-plus of documenting every trip, big and small.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            This blog is our shared journal: honest notes, practical tips, and
            plenty of photographs from the places that changed us. Whether
            we&apos;re hiking alpine trails, getting lost in old cities, or
            finding the perfect café, we write it down so we never forget—and
            so you can plan your own adventures.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            When we&apos;re not traveling, you&apos;ll find us plotting the next
            itinerary over coffee, sorting through photo cards, and updating this
            site with our latest discoveries.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/blog"
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-dark"
            >
              Read the blog
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-sage hover:bg-cream"
            >
              Say hello
            </Link>
          </div>
        </div>
      </div>

      <section className="mt-20 grid gap-6 sm:grid-cols-3">
        {[
          {
            stat: String(new Date().getFullYear() - SITE.since),
            label: "Years of adventures",
          },
          { stat: "30+", label: "Countries visited" },
          { stat: "2011", label: "Where it all began" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-card p-6 text-center"
          >
            <p className="font-display text-4xl font-semibold text-accent">
              {item.stat}
            </p>
            <p className="mt-2 text-sm text-muted">{item.label}</p>
          </div>
        ))}
      </section>
    </Container>
  );
}
