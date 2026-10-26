"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDrafts, type TravelDraft } from "@/lib/dashboard/drafts";

export default function SavedDraftsPage() {
  const [drafts, setDrafts] = useState<TravelDraft[]>([]);

  useEffect(() => {
    setDrafts(
      getDrafts().sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt)
      )
    );
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Saved Drafts</h1>
      <p className="mt-3">
        Your saved travel stories appear below.
      </p>

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
                Saved: {new Date(draft.updatedAt).toLocaleString()}
              </p>
              <Link
                href={`/dashboard/new?draft=${encodeURIComponent(draft.id)}`}
                className="mt-4 inline-block underline"
              >
                Continue Writing
              </Link>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
