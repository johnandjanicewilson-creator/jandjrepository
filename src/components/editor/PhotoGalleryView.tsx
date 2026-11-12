"use client";

import { useEffect, useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { stagePhoto } from "@/lib/dashboard/uploads/stagePhoto";
import { StagedPhotoImage } from "./StagedPhotoImage";

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
  getPos,
}: NodeViewProps) {
  const photos = (node.attrs.photos || []) as GalleryPhoto[];
  const caption = (node.attrs.caption || "") as string;
  const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const [dragWidths, setDragWidths] = useState<Record<number, number>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const clearSelectionOutsideGallery = () => {
      const position = getPos();
      const selection = editor.state.selection;

      if (
        typeof position !== "number" ||
        selection.from !== position ||
        selection.to !== position + node.nodeSize
      ) {
        setActivePhoto(null);
      }
    };

    editor.on("selectionUpdate", clearSelectionOutsideGallery);

    return () => {
      editor.off("selectionUpdate", clearSelectionOutsideGallery);
    };
  }, [editor, getPos, node.nodeSize]);

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
          const src = await stagePhoto(file);
          additions.push({ src, alt: file.name });
        }

        const currentPhotos = (node.attrs.photos || []) as GalleryPhoto[];
        updateAttributes({
          photos: [...currentPhotos, ...additions],
        });
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "Could not stage photograph"
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

  const moveSelectedPhoto = () => {
    if (!editor.isEditable || activePhoto === null || uploading) return;
    if (activePhoto < 0 || activePhoto >= photos.length) return;

    const { state, view } = editor;
    const galleryPosition = getPos();
    if (typeof galleryPosition !== "number") return;

    const gallery = state.doc.nodeAt(galleryPosition);
    const imageType = state.schema.nodes.image;
    if (!gallery || gallery.type.name !== "photoGallery" || !imageType) return;

    const currentPhotos = gallery.attrs.photos as GalleryPhoto[];
    const photo = currentPhotos[activePhoto];
    if (!photo?.src) return;

    const remaining = currentPhotos.filter(
      (_, index) => index !== activePhoto
    );

    const image = imageType.create({
      src: photo.src,
      alt: photo.alt || "",
      photoSize: "small",
      photoWidth: null,
      photoPosition: "left",
    });

    const tr = state.tr;

    tr.setNodeMarkup(galleryPosition, undefined, {
      ...gallery.attrs,
      photos: remaining,
    });

    tr.insert(galleryPosition + gallery.nodeSize, image);

    view.dispatch(tr);
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
      contentEditable={false}
      className={selected ? "outline outline-2 outline-blue-500" : ""}
      style={{ margin: "16px 0", maxWidth: "100%" }}
    >
      <div
        ref={containerRef}
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
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
            <StagedPhotoImage
              src={photo.src}
              alt={photo.alt || ""}
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
            {uploading ? "Preparing..." : "Add Photo"}
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
            Remove from Gallery
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              moveSelectedPhoto();
            }}
            disabled={activePhoto === null || uploading}
            className="rounded border px-3 py-2 disabled:opacity-40"
          >
            Move to Story
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
