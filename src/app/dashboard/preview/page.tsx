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
    <main className="mx-auto max-w-5xl px-6 py-12">
      <p className="mb-6 font-semibold text-amber-800">
        LIVE PREVIEW — NOT PUBLISHED
      </p>

      {preview.featuredImage && (
        <img
          src={preview.featuredImage}
          alt={preview.featuredImageAlt || preview.title}
          className="mb-8 max-h-[450px] max-w-full rounded-lg object-contain"
        />
      )}

      <header className="mb-10">
        <p className="text-sm text-gray-600">
          {preview.destination} · {preview.date}
        </p>
        <h1 className="mt-4 text-4xl font-bold">{preview.title}</h1>
      </header>

      <PostContent html={preview.story} />
    </main>
  );
}
