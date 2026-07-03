import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/constants";

const HERO_IMAGES = [
  { src: "/images/hero/hero-acropolis-athens.jpg", alt: "The Acropolis lit up at night in Athens, Greece", pos: "50% 42%" },
  { src: "/images/hero/hero-djoser-pyramid-egypt.jpg", alt: "John and Janice at the Step Pyramid of Djoser in Egypt", pos: "50% 40%" },
  { src: "/images/hero/hero-sawyer-glacier-alaska.jpg", alt: "John and Janice before Sawyer Glacier in Alaska", pos: "50% 65%" },
  { src: "/images/hero/hero-peterhof-palace.jpg", alt: "John and Janice at the Peterhof Palace fountains near St. Petersburg", pos: "50% 62%" },
  { src: "/images/hero/hero-mount-of-olives-jerusalem.jpg", alt: "John and Janice with a guide and his donkey above Jerusalem", pos: "50% 32%" },
  { src: "/images/hero/hero-petra-donkeys.jpg", alt: "John and Janice riding donkeys at Petra in Jordan", pos: "50% 22%" },
  { src: "/images/hero/hero-petra-treasury.jpg", alt: "John and Janice before the Treasury at Petra in Jordan", pos: "50% 82%" },
  { src: "/images/hero/hero-lisbon-love-locks.jpg", alt: "John and Janice at a Lisbon overlook above the city", pos: "50% 0%" },
];

export function Hero() {
  const hero = HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)];

  return (
    <section className="relative min-h-[70vh] overflow-hidden">
      <Image
        src={hero.src}
        alt={hero.alt}
        fill
        priority
        className="object-cover"
        style={{ objectPosition: hero.pos }}
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
