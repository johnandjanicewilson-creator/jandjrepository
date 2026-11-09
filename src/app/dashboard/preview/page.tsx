"use client";

import { useEffect, useState } from "react";
import { PostContent } from "@/components/blog/PostContent";

type PreviewData = {
  title: string;
  story: string;
  date: string;
  destination: string;
  featuredImage: string;
  featuredImageAlt: string;
};

export default function StoryPreviewPage() {
  const [preview, setPreview] = useState<PreviewData | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel("jj-story-preview");

    channel.onmessage = (event) => {
      if (event.data?.type === "story-update") {
        setPreview(event.data.preview);
      }
    };

    channel.postMessage({ type: "preview-ready" });

    return () => channel.close();
  }, []);

  if (!preview) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-bold">Story Preview</h1>
        <p className="mt-4">
          Waiting for the story editor. Keep the editor open in another tab.
        </p>
      </main>
    );
  }

  return (
    <main>
      <div className="mx-auto max-w-[1100px] px-8 pt-6">
        <p className="font-semibold text-amber-800">
          LIVE PREVIEW — NOT PUBLISHED
        </p>
      </div>

      <article className="blog-post w-full">
        {preview.featuredImage && (
          <div className="mx-auto mt-8 flex h-[320px] w-full max-w-[1100px] items-center justify-center px-8 sm:h-[420px]">
            <img
              src={preview.featuredImage}
              alt={preview.featuredImageAlt || preview.title}
              className="block h-full max-w-full object-contain"
            />
          </div>
        )}

        <section className="post-content-area">
          <header>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className="font-semibold text-accent">
                {preview.destination}
              </span>
              <span aria-hidden>·</span>
              <time dateTime={preview.date}>{preview.date}</time>
            </div>

            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-sage sm:text-5xl lg:text-6xl">
              {preview.title}
            </h1>
          </header>

          <div className="mt-10">
            <PostContent html={preview.story} />
          </div>
        </section>
      </article>
    </main>
  );
}
