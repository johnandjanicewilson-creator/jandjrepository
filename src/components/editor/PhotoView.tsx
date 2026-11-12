"use client";

import { useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { StagedPhotoImage } from "./StagedPhotoImage";

export function PhotoView({ node, selected, updateAttributes, editor }: NodeViewProps) {
  const { src, alt, photoCaption, photoSize, photoPosition, photoWidth } = node.attrs;
  const figureRef = useRef<HTMLElement | null>(null);
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  const startResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!editor.isEditable) return;
    event.preventDefault();
    event.stopPropagation();

    const figure = figureRef.current;
    if (!figure) return;

    const startWidth = figure.getBoundingClientRect().width;
    const startX = event.clientX;
    const pointerId = event.pointerId;
    const handle = event.currentTarget;

    handle.setPointerCapture(pointerId);

    const move = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const width = Math.max(80, Math.min(1200, Math.round(
        startWidth + moveEvent.clientX - startX
      )));
      setDragWidth(width);
    };

    const finish = (endEvent: PointerEvent) => {
      if (endEvent.pointerId !== pointerId) return;
      const width = Math.max(80, Math.min(1200, Math.round(
        startWidth + endEvent.clientX - startX
      )));
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", finish);
      handle.removeEventListener("pointercancel", finish);
      setDragWidth(null);
      if (endEvent.type === "pointerup") {
        updateAttributes({ photoWidth: width });
      }
    };

    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
  };

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
      contentEditable={false}
      ref={figureRef}
      style={{
        position: "relative",
        width: dragWidth ?? (photoWidth || widths[photoSize] || "100%"),
        maxWidth: "100%",
        ...positionStyle,
      }}
      className={selected ? "outline outline-2 outline-blue-500" : ""}
    >
      <StagedPhotoImage
        dragHandle
        src={src}
        alt={alt || ""}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
      {editor.isEditable && selected && (
        <button
          type="button"
          contentEditable={false}
          onPointerDown={startResize}
          aria-label="Drag to resize photograph"
          title="Drag to resize photograph"
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
