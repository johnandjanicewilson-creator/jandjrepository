"use client";

import { useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { uploadPhoto } from "@/lib/dashboard/uploads/uploadPhoto";

type GalleryPhoto = {
  src: string;
  alt?: string;
  photoWidth?: number | null;
  photoSize?: string;
};

export function PhotoGalleryView({
  node,
  selected,
  updateAttributes,
  editor,
}: NodeViewProps) {
  const photos = (node.attrs.photos || []) as GalleryPhoto[];
  const caption = (node.attrs.caption || "") as string;
  const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const [dragWidths, setDragWidths] = useState<Record<number, number>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const addPhotos = () => {
    if (!editor.isEditable || uploading) return;

    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = "image/jpeg,image/png";
    picker.multiple = true;

    picker.onchange = async () => {
      const files = Array.from(picker.files || []);
      if (!files.length) return;

      setUploading(true);
      try {
        const additions = [];
        for (const file of files) {
          const src = await uploadPhoto(file);
          additions.push({ src, alt: file.name });
        }

        const currentPhotos = (node.attrs.photos || []) as GalleryPhoto[];
        updateAttributes({
          photos: [...currentPhotos, ...additions],
        });
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "Photo upload failed"
        );
      } finally {
        setUploading(false);
      }
    };

    picker.click();
  };

  const removeSelectedPhoto = () => {
    if (!editor.isEditable || activePhoto === null) return;
    if (activePhoto < 0 || activePhoto >= photos.length) return;

    updateAttributes({
      photos: photos.filter((_, index) => index !== activePhoto),
    });
    setActivePhoto(null);
    setDragWidths({});
  };

  const startResize = (
    event: React.PointerEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (!editor.isEditable) return;
    event.preventDefault();
    event.stopPropagation();

    const handle = event.currentTarget;
    const photo = handle.parentElement;
    if (!photo) return;

    const startWidth = photo.getBoundingClientRect().width;
    const startX = event.clientX;
    const pointerId = event.pointerId;

    handle.setPointerCapture(pointerId);

    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const width = Math.max(
        80,
        Math.min(1200, Math.round(startWidth + e.clientX - startX))
      );
      setDragWidths((current) => ({ ...current, [index]: width }));
    };

    const finish = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;

      const width = Math.max(
        80,
        Math.min(1200, Math.round(startWidth + e.clientX - startX))
      );

      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", finish);
      handle.removeEventListener("pointercancel", finish);

      setDragWidths((current) => {
        const next = { ...current };
        delete next[index];
        return next;
      });

      if (e.type === "pointerup") {
        updateAttributes({
          photos: photos.map((photo, i) =>
            i === index ? { ...photo, photoWidth: width } : photo
          ),
        });
      }
    };

    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
  };

  return (
    <NodeViewWrapper
      as="figure"
      className={selected ? "outline outline-2 outline-blue-500" : ""}
      style={{ margin: "16px 0", maxWidth: "100%" }}
    >
      <div
        ref={containerRef}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          gap: "8px",
        }}
      >
        {photos.map((photo, index) => (
          <div
            key={index}
            style={{
              position: "relative",
              width: dragWidths[index] ?? photo.photoWidth ?? (
                photos.length === 1
                  ? "100%"
                  : photos.length === 2
                    ? "calc(50% - 4px)"
                    : "calc(33.333% - 6px)"
              ),
              maxWidth: "100%",
              flexShrink: 0,
            }}
            onClick={() => setActivePhoto(index)}
            className={
              editor.isEditable && activePhoto === index
                ? "outline outline-2 outline-blue-500"
                : ""
            }
          >
            <img
              src={photo.src}
              alt={photo.alt || ""}
              draggable={false}
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
                display: "block",
                borderRadius: "4px",
              }}
            />
            {editor.isEditable && activePhoto === index && (
              <button
                type="button"
                contentEditable={false}
                onPointerDown={(event) => startResize(event, index)}
                aria-label="Drag to resize gallery photograph"
                title="Drag to resize gallery photograph"
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  width: 22,
                  height: 22,
                  cursor: "nwse-resize",
                  background: "#2563eb",
                  border: "2px solid white",
                  borderRadius: 4,
                  touchAction: "none",
                  zIndex: 5,
                }}
              />
            )}
          </div>
        ))}
      </div>
      {editor.isEditable && (
        <div
          contentEditable={false}
          className="mt-3 flex flex-wrap gap-2"
        >
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              addPhotos();
            }}
            disabled={uploading}
            className="rounded border px-3 py-2 disabled:opacity-40"
          >
            {uploading ? "Uploading..." : "Add Photo"}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              removeSelectedPhoto();
            }}
            disabled={activePhoto === null || uploading}
            className="rounded border px-3 py-2 disabled:opacity-40"
          >
            Remove Selected Photo
          </button>
        </div>
      )}
      {caption && (
        <figcaption
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            fontStyle: "italic",
            marginTop: "6px",
          }}
        >
          {caption}
        </figcaption>
      )}
    </NodeViewWrapper>
  );
}
