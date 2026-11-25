"use client";

import { useEffect, useState } from "react";

type Photo = {
  id: string;
  url: string;
  thumbnail: string;
};

type Props = {
  onSelect: (url: string) => void;
  onClose: () => void;
  onSelectMultiple?: (urls: string[]) => void;
};

export function CloudinaryPhotoPicker({ onSelect, onClose, onSelectMultiple }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPhotos(nextCursor?: string) {
    setLoading(true);
    setError("");

    try {
      const url = "/api/dashboard/cloudinary-photos" +
        (nextCursor ? "?cursor=" + encodeURIComponent(nextCursor) : "");

      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to retrieve photographs.");

      const result = await response.json();

      setPhotos(previous =>
        nextCursor ? [...previous, ...result.photos] : result.photos
      );
      setCursor(result.nextCursor);
    } catch {
      setError("Could not retrieve photographs. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPhotos();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div role="dialog" aria-modal="true"
        aria-label="Choose a Cloudinary photograph"
        className="max-h-[85vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-5 text-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Cloudinary Photographs</h2>
          <button type="button" onClick={onClose}
            className="rounded border px-4 py-2">
            Cancel
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {photos.map(photo => (
            <button key={photo.id} type="button"
              onClick={() => {
                if (onSelectMultiple) {
                  setSelected(previous =>
                    previous.includes(photo.url)
                      ? previous.filter(url => url !== photo.url)
                      : [...previous, photo.url]
                  );
                } else {
                  onSelect(photo.url);
                }
              }}
              aria-pressed={onSelectMultiple ? selected.includes(photo.url) : undefined}
              className={`rounded border p-1 hover:border-blue-600 ${
                selected.includes(photo.url)
                  ? "ring-2 ring-blue-600 bg-blue-100"
                  : ""
              }`}>
              <img src={photo.thumbnail} alt={photo.id}
                loading="lazy"
                className="h-28 w-full object-contain" />
            </button>
          ))}
        </div>

        {onSelectMultiple && (
          <div className="mt-4 flex items-center gap-4">
            <span>{selected.length} selected</span>
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={() => onSelectMultiple(selected)}
              className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-40"
            >
              Insert Gallery
            </button>
          </div>
        )}

        {loading && <p className="mt-4">Loading photographs...</p>}
        {error && <p className="mt-4 text-red-700">{error}</p>}
        {!loading && !error && photos.length === 0 &&
          <p>No photographs found.</p>}

        {!loading && (cursor || error) && (
          <button type="button"
            onClick={() => void loadPhotos(cursor ?? undefined)}
            className="mt-4 rounded border px-4 py-2">
            {error ? "Try Again" : "Load More Photographs"}
          </button>
        )}
      </div>
    </div>
  );
}
