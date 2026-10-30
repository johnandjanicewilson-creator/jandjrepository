"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

export function PhotoGalleryView({ node, selected }: NodeViewProps) {
  const photos = (node.attrs.photos || []) as {
    src: string;
    alt?: string;
  }[];
  const caption = (node.attrs.caption || "") as string;

  return (
    <NodeViewWrapper
      as="figure"
      className={selected ? "outline outline-2 outline-blue-500" : ""}
      style={{ margin: "16px 0", maxWidth: "100%" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${photos.length || 2}, minmax(0, 1fr))`,
          gap: "8px",
        }}
      >
        {photos.map((photo, index) => (
          <img
            key={index}
            src={photo.src}
            alt={photo.alt || ""}
            draggable={false}
            style={{
              width: "100%",
              height: "180px",
              objectFit: "cover",
              display: "block",
              borderRadius: "4px",
            }}
          />
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
