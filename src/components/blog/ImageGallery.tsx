"use client";

import Image from "next/image";
import { useState } from "react";
import type { GalleryImage } from "@/lib/types";

interface ImageGalleryProps {
  images: GalleryImage[];
  title?: string;
}

export function ImageGallery({ images, title = "Photo gallery" }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images.length) return null;

  const active = images[activeIndex];

  return (
    <section className="my-10" aria-label={title}>
      <h2 className="mb-4 font-display text-2xl font-semibold text-sage">
        {title}
      </h2>

      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-cream">
        <Image
          src={active.src}
          alt={active.alt}
          fill
          className="object-cover"
          sizes="(max-width: 639px) 90vw, 1100px"
          priority
        />
      </div>

      {active.caption && (
        <p className="mt-2 text-center text-sm text-muted">{active.caption}</p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`relative aspect-square overflow-hidden rounded-lg ring-2 transition ${
              index === activeIndex
                ? "ring-accent"
                : "ring-transparent hover:ring-border"
            }`}
            aria-label={`View image ${index + 1}: ${image.alt}`}
            aria-current={index === activeIndex}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="120px"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
