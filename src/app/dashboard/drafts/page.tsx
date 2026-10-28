"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Draft = {
  id: string;
  title: string;
  story: string;
  updated_at: string;
};

export default function SavedDraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDrafts() {
      try {
        const response = await fetch("/api/dashboard/drafts", {
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Unable to load drafts");

        const data = await response.json();
        setDrafts(data.drafts);
      } catch {
        setError("Unable to load your Neon drafts. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadDrafts();
  }, []);

  async function deleteDraft(draft: Draft) {
    const confirmed = window.confirm(
      `Permanently delete "${draft.title || "Untitled Story"}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/dashboard/drafts/${encodeURIComponent(draft.id)}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Delete failed");

      setDrafts((current) =>
        current.filter((item) => item.id !== draft.id)
      );
    } catch {
      setError("Unable to delete this draft. Please try again.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Saved Drafts</h1>
      <p className="mt-3">
        Your travel stories saved securely in Neon.
      </p>

      {loading && <p className="mt-6">Loading your stories...</p>}
      {error && <p role="alert" className="mt-6">{error}</p>}

      {!loading && !error && (
        <div className="mt-8 grid gap-4">
          {drafts.length === 0 ? (
            <p>No saved drafts yet.</p>
          ) : (
            drafts.map((draft) => (
              <div key={draft.id} className="rounded-lg border p-6">
                <h2 className="text-xl font-semibold">
                  {draft.title || "Untitled Story"}
                </h2>
                <p className="mt-2">
                  {draft.story.slice(0, 150) || "No story text yet."}
                </p>
                <p className="mt-3 text-sm">
                  Saved: {new Date(draft.updated_at).toLocaleString()}
                </p>
                <Link
                  href={`/dashboard/new?cloud=${encodeURIComponent(draft.id)}`}
                  className="mt-4 inline-block underline"
                >
                  Continue Writing
                </Link>
                <button
                  type="button"
                  onClick={() => deleteDraft(draft)}
                  className="ml-6 text-red-600 underline"
                >
                  Delete Draft
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
