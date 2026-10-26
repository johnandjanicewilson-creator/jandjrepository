"use client";

import { useEffect, useState } from "react";

export default function NewPostPage() {
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jj-travel-new-draft");
      if (saved) {
        const draft = JSON.parse(saved);
        setTitle(draft.title ?? "");
        setStory(draft.story ?? "");
      }
    } catch {
      // Ignore damaged or unavailable browser storage.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        "jj-travel-new-draft",
        JSON.stringify({ title, story })
      );
    } catch {
      // Browser storage may be unavailable.
    }
  }, [title, story, loaded]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">Write a New Travel Story</h1>
      <p className="mt-3">
        Write your story here, or paste it from OpenOffice.
      </p>

      <div className="mt-8">
        <label htmlFor="title" className="block font-semibold">
          Story Title
        </label>
        <input
          id="title"
          className="mt-2 w-full rounded-lg border p-3"
          placeholder="Enter your story title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="mt-6">
        <label htmlFor="story" className="block font-semibold">
          Your Story
        </label>
        <textarea
          id="story"
          className="mt-2 min-h-96 w-full rounded-lg border p-4"
          placeholder="Start writing your travel story..."
          value={story}
          onChange={(e) => setStory(e.target.value)}
        />
      </div>

      <p className="mt-4 text-sm">
        Your draft is saved automatically in this browser on this computer. Publishing is not available yet.
      </p>
    </main>
  );
}
