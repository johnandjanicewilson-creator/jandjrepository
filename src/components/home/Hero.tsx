import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/constants";

export function Hero() {
  return (
    <section className="relative min-h-[70vh] overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"
        alt="Mountain landscape at golden hour"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
      <div className="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-end px-4 pb-16 pt-32 sm:px-6 lg:px-8 lg:pb-24">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
          Since {SITE.since}
        </p>
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
          {SITE.name}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-white/90 sm:text-xl">
          {SITE.tagline}. Join us as we explore cities, coastlines, and quiet
          corners of the world—one story at a time.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/blog"
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark"
          >
            Read our stories
          </Link>
          <Link
            href="/about"
            className="rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            Our story
          </Link>
        </div>
      </div>
    </section>
  );
}
