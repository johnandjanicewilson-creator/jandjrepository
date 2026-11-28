"use client";

import { useEffect, useState } from "react";
import { openStoryEditor } from "@/lib/dashboard/openStoryEditor";

type Draft = {
  id: string;
  title: string;
  story: string;
  updated_at: string;
  published: boolean;
};

export default function SavedDraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState<string | null>(null);
  const [openError, setOpenError] = useState<{ id: string; message: string } | null>(null);

  async function continueWriting(id: string) {
    if (opening) return;
    setOpening(id);
    setOpenError(null);

    try {
      await openStoryEditor(id);
    } catch (error) {
      setOpenError({
        id,
        message: error instanceof Error ? error.message : "Could not open the story. Please try again."
      });
      setOpening(null);
    }
  }

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
      <h1 className="text-3xl font-bold">Stories We’re Working On</h1>
      <p className="mt-3">
        Your shared list of stories ready for editing, saved securely in Neon.
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
                <p className="mt-2 text-sm font-semibold">
                  {draft.published ? "Published" : "Unpublished Draft"}
                </p>
                <p className="mt-2">
                  {draft.story.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 150) || "No story text yet."}
                </p>
                <p className="mt-3 text-sm">
                  Saved: {new Date(draft.updated_at).toLocaleString()}
                </p>
                <button
                  type="button"
                  onClick={() => void continueWriting(draft.id)}
                  disabled={opening !== null}
                  className="mt-4 inline-block underline disabled:opacity-50"
                >
                  {opening === draft.id ? "Opening Editor..." : "Continue Writing"}
                </button>
                {openError?.id === draft.id && (
                  <p role="alert" className="mt-2 text-red-700">
                    {openError.message}
                  </p>
                )}
                {!draft.published && (
                  <button
                    type="button"
                    onClick={() => void deleteDraft(draft)}
                    className="ml-6 text-red-700 underline"
                  >
                    Delete Draft
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
