"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface GalleryProps {
  images: string[];
  /** Optional alt text per image (same order as `images`) */
  alts?: string[];
  className?: string;
}

function altFromPath(src: string): string {
  const filename = src.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "Photo";
  return filename.replace(/[-_]+/g, " ").trim();
}

function CloseIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function itemButtonLayoutClass(count: number): string {
  if (count <= 2) return "basis-full max-w-md";
  if (count === 3) return "flex-[0_0_calc((100%-2rem)/3)] max-w-[260px]";
  if (count === 4) return "flex-[0_0_calc((100%-3rem)/4)] max-w-[260px]";
  return "flex-[0_0_calc((100%-3rem)/4)] max-w-[200px]";
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
      />
    </svg>
  );
}

export function Gallery({
  images = [],
  imagesJson,
  alts,
  className,
}: GalleryProps & { imagesJson?: string }) {
  const resolvedImages = imagesJson ? JSON.parse(imagesJson) : images;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const items = (resolvedImages ?? []).map((src: string, index: number) => ({
    src,
    alt: alts?.[index] ?? altFromPath(src),
  }));

  const close = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    setLightboxIndex((current) =>
      current === null ? null : (current - 1 + items.length) % items.length,
    );
  }, [items.length]);

  const goNext = useCallback(() => {
    setLightboxIndex((current) =>
      current === null ? null : (current + 1) % items.length,
    );
  }, [items.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxIndex, close, goPrev, goNext]);

  if (!items.length) return null;

  const active = lightboxIndex !== null ? items[lightboxIndex] : null;
  const showNav = items.length > 1;
  const itemLayoutClass = itemButtonLayoutClass(items.length);

  return (
    <>
      <figure
        className={cn("my-8 w-full", className)}
        role="group"
        aria-label="Photo gallery"
      >
        <div className="flex flex-wrap justify-center gap-4">
          {items.map((item, index) => (
            <button
              key={`${item.src}-${index}`}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className={cn(
                "group relative aspect-square cursor-zoom-in overflow-hidden rounded-xl bg-cream ring-1 ring-border transition hover:ring-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                itemLayoutClass,
              )}
              aria-label={`View image ${index + 1} of ${items.length}: ${item.alt}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </button>
          ))}
        </div>
      </figure>

      {active && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/88 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:right-6 sm:top-6"
            aria-label="Close lightbox"
          >
            <CloseIcon />
          </button>

          {showNav && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goPrev();
              }}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:left-4 sm:p-3"
              aria-label="Previous image"
            >
              <ChevronIcon direction="left" />
            </button>
          )}

          <div
            className="relative flex h-[min(85vh,900px)] w-full max-w-[min(1100px,95vw)] items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={active.src}
              alt={active.alt}
              fill
              className="object-contain"
              sizes="95vw"
              priority
            />
          </div>

          {showNav && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goNext();
              }}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:right-4 sm:p-3"
              aria-label="Next image"
            >
              <ChevronIcon direction="right" />
            </button>
          )}

          <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
            {lightboxIndex + 1} / {items.length}
          </p>
        </div>
      )}
    </>
  );
}
