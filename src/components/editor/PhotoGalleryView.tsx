"use client";

import { useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

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
          alignItems: "flex-start",
          gap: "8px",
        }}
      >
        {photos.map((photo, index) => (
          <div
            key={index}
            style={{
              position: "relative",
              width: dragWidths[index] ?? photo.photoWidth ?? (
                photos.length === 2 ? "calc(50% - 4px)" : "calc(33.333% - 6px)"
              ),
              maxWidth: "100%",
              flexShrink: 0,
            }}
            onClick={() => setActivePhoto(index)}
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
