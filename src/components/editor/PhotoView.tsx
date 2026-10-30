"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

export function PhotoView({ node, selected }: NodeViewProps) {
  const { src, alt, photoCaption, photoSize, photoPosition } = node.attrs;

  const widths: Record<string, string> = {
    small: "25%",
    medium: "50%",
    large: "75%",
    full: "100%",
  };

  const positionStyle =
    photoPosition === "left"
      ? { float: "left" as const, margin: "0 16px 12px 0" }
      : photoPosition === "right"
        ? { float: "right" as const, margin: "0 0 12px 16px" }
        : { margin: "0 auto 12px" };

  return (
    <NodeViewWrapper
      as="figure"
      style={{
        width: widths[photoSize] || "100%",
        maxWidth: "100%",
        ...positionStyle,
      }}
      className={selected ? "outline outline-2 outline-blue-500" : ""}
    >
      <img
        src={src}
        alt={alt || ""}
        style={{ width: "100%", height: "auto", display: "block" }}
        draggable={false}
      />
      {photoCaption && (
        <figcaption
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            fontStyle: "italic",
            marginTop: "6px",
          }}
        >
          {photoCaption}
        </figcaption>
      )}
    </NodeViewWrapper>
  );
}
