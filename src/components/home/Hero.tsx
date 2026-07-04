import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/constants";

const CLOUD = "https://res.cloudinary.com/dsru5pryd/image/upload/f_auto,q_auto/images/hero";

const HERO_IMAGES = [
  { src: `${CLOUD}/hero-acropolis-athens.jpg`, alt: "The Acropolis lit up at night in Athens, Greece" },
  { src: `${CLOUD}/hero-djoser-pyramid-egypt.jpg`, alt: "John and Janice at the Step Pyramid of Djoser in Egypt" },
  { src: `${CLOUD}/hero-sawyer-glacier-alaska.jpg`, alt: "John and Janice before Sawyer Glacier in Alaska" },
  { src: `${CLOUD}/hero-peterhof-palace.jpg`, alt: "John and Janice at the Peterhof Palace fountains near St. Petersburg" },
  { src: `${CLOUD}/hero-mount-of-olives-jerusalem.jpg`, alt: "John and Janice with a guide and his donkey above Jerusalem" },
  { src: `${CLOUD}/hero-petra-donkeys.jpg`, alt: "John and Janice riding donkeys at Petra in Jordan" },
  { src: `${CLOUD}/hero-petra-treasury.jpg`, alt: "John and Janice before the Treasury at Petra in Jordan" },
  { src: `${CLOUD}/hero-lisbon-love-locks.jpg`, alt: "John and Janice at a Lisbon overlook above the city" },
];

export function Hero() {
  const hero = HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)];

  return (
    <section className="relative w-full aspect-[16/9] overflow-hidden">
      <Image
        src={hero.src}
        alt={hero.alt}
        fill
        priority
        className="object-cover"
        sizes="100vw"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
      <div className="absolute inset-0 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-10 sm:px-6 sm:pb-14 lg:px-8 lg:pb-20">
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
