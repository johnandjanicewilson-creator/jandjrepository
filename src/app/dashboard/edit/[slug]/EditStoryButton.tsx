"use client";

import { useState } from "react";

export default function EditStoryButton({ slug }: { slug: string }) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");

  async function openEditor() {
    if (opening) return;
    setOpening(true);
    setError("");

    try {
      const response = await fetch("/api/dashboard/existing-stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      if (!response.ok) throw new Error("Unable to prepare story");

      const data = await response.json();
      if (typeof data.id !== "string") throw new Error("Missing draft ID");

      window.location.assign(
        `/dashboard/new?cloud=${encodeURIComponent(data.id)}`
      );
    } catch {
      setError("Could not open the story. Please try again.");
      setOpening(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={openEditor}
        disabled={opening}
        className="rounded bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {opening ? "Opening Editor..." : "Edit This Story"}
      </button>
      {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
    </div>
  );
}
