
"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { NodeSelection } from "@tiptap/pm/state";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Undo2,
  Redo2,
  Link2,
  IndentIncrease,
  Quote,
  RemoveFormatting,
  ImagePlus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Captions,
} from "lucide-react";
import { SizedImage } from "./SizedImage";
import { PhotoGallery } from "./PhotoGallery";
import { PhotoLocationMarker } from "./PhotoLocationMarker";
import { uploadPhoto } from "@/lib/dashboard/uploads/uploadPhoto";
import { InsetText } from "./InsetText";

type StoryEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function StoryEditor({
  value,
  onChange,
  disabled = false,
}: StoryEditorProps) {
  const [galleryPhotoSelections, setGalleryPhotoSelections] = useState<
    { position: number; src: string }[]
  >([]);

  const [galleryToMove, setGalleryToMove] = useState<{
    position: number;
    photos: { src: string }[];
  } | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, InsetText, SizedImage, PhotoGallery, PhotoLocationMarker],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setGalleryPhotoSelections([]);
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-96 w-full rounded-lg border p-4 focus:outline-none         [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-semibold  [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:mx-8 [&_blockquote]:px-4 [&_blockquote]:text-center [&_blockquote]:italic ",

      },
    },
  });

  const photoSelected = useEditorState({
    editor,
    selector: ({ editor }) =>
      (editor?.state.selection instanceof NodeSelection &&
        editor.state.selection.node.type.name === "image") ||
      editor?.isActive("image") ||
      false,
  });

  const gallerySelected = useEditorState({
    editor,
    selector: ({ editor }) => editor?.isActive("photoGallery") ?? false,
  });

  useEffect(() => {
    if (!editor) return;

    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);
  const insertGallery = () => {
    if (!editor) return;

    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = "image/jpeg,image/png";
    picker.multiple = true;

    picker.onchange = async () => {
      const files = Array.from(picker.files || []);

      if (files.length === 0) return;

      const position = editor.state.selection.from;

      try {
        const photos = [];

        for (const file of files) {
          const photoUrl = await uploadPhoto(file);
          photos.push({ src: photoUrl, alt: file.name });
        }

        editor.chain().focus().insertContentAt(position, {
          type: "photoGallery",
          attrs: { photos, caption: "" },
        }).run();
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "Gallery upload failed"
        );
      }
    };

    picker.click();
  };

  const startMovingGallery = () => {
    if (!editor || !editor.isActive("photoGallery")) return;

    const { from } = editor.state.selection;
    const gallery = editor.state.doc.nodeAt(from);

    if (gallery?.type.name !== "photoGallery") return;

    setGalleryToMove({
      position: from,
      photos: gallery.attrs.photos,
    });
  };

  const placeMovingGallery = () => {
    if (!editor || !galleryToMove) return;

    const { doc, selection } = editor.state;
    const source = doc.nodeAt(galleryToMove.position);

    if (
      source?.type.name !== "photoGallery" ||
      JSON.stringify(source.attrs.photos) !==
        JSON.stringify(galleryToMove.photos)
    ) {
      window.alert("The story has changed. Please select the gallery again.");
      setGalleryToMove(null);
      return;
    }

    const destination = selection.from;
    const resolved = doc.resolve(destination);
    const insertAt = resolved.depth === 0
      ? destination
      : resolved.after(1);

    if (
      !doc.resolve(insertAt).parent.canReplaceWith(
        doc.resolve(insertAt).index(),
        doc.resolve(insertAt).index(),
        source.type
      )
    ) {
      window.alert("Please place the cursor in a story paragraph.");
      return;
    }

    const transaction = editor.state.tr;
    transaction.delete(
      galleryToMove.position,
      galleryToMove.position + source.nodeSize
    );

    const mappedDestination = transaction.mapping.map(insertAt);
    transaction.insert(mappedDestination, source);

    editor.view.dispatch(transaction);
    setGalleryToMove(null);
  };

  const separateGallery = () => {
    if (!editor || !editor.isActive("photoGallery")) return;

    const { from } = editor.state.selection;
    const gallery = editor.state.doc.nodeAt(from);
    if (gallery?.type.name !== "photoGallery") return;

    const photos = gallery.attrs.photos;
    if (!Array.isArray(photos) || photos.length < 2) return;

    const imageType = editor.state.schema.nodes.image;
    if (!imageType) return;

    const locations: { position: number; photo: any }[] = [];

    editor.state.doc.descendants((node, position) => {
      if (node.type.name !== "photoLocationMarker") return;

      const photo = photos.find(
        (item) => item.markerId && item.markerId === node.attrs.markerId
      );

      if (photo) locations.push({ position, photo });
    });

    if (
      locations.length !== photos.length ||
      photos.some((photo) => !photo.markerId) ||
      new Set(photos.map((photo) => photo.markerId)).size !== photos.length ||
      new Set(locations.map((item) => item.position)).size !== photos.length
    ) {
      window.alert(
        "Original photograph locations are unavailable. No changes were made."
      );
      return;
    }

    const transaction = editor.state.tr;

    for (const { position, photo } of [...locations].sort(
      (a, b) => b.position - a.position
    )) {
      const currentPosition = transaction.mapping.map(position);
      const marker = transaction.doc.nodeAt(currentPosition);
      if (!marker || marker.type.name !== "photoLocationMarker") return;

      transaction.replaceWith(
        currentPosition,
        currentPosition + marker.nodeSize,
        imageType.create({
          src: photo.src,
          alt: photo.alt || "",
          photoCaption: photo.photoCaption || "",
          photoSize: photo.photoSize || "full",
          photoWidth: photo.photoWidth ?? null,
          photoPosition: photo.photoPosition || "center",
        })
      );
    }

    const galleryPosition = transaction.mapping.map(from);
    transaction.delete(
      galleryPosition,
      galleryPosition + gallery.nodeSize
    );

    editor.view.dispatch(transaction);
  };

  const makeGallery = () => {
    if (!editor || galleryPhotoSelections.length < 2) return;

    const valid = galleryPhotoSelections.every(({ position, src }) => {
      const node = editor.state.doc.nodeAt(position);
      return node?.type.name === "image" && node.attrs.src === src;
    });

    if (!valid) {
      window.alert(
        "The story has changed since you selected the photographs. Please select them again."
      );
      setGalleryPhotoSelections([]);
      return;
    }

    const selected = galleryPhotoSelections
      .map(({ position }) => ({
        position,
        node: editor.state.doc.nodeAt(position)!,
      }))
      .sort((a, b) => a.position - b.position);

    const photos = selected.map(({ position, node }) => ({
      originalPosition: position,
      src: node.attrs.src,
      alt: node.attrs.alt || "",
      photoCaption: node.attrs.photoCaption || "",
      photoSize: node.attrs.photoSize || "full",
      photoWidth: node.attrs.photoWidth ?? null,
      photoPosition: node.attrs.photoPosition || "center",
    }));

    const galleryType = editor.state.schema.nodes.photoGallery;
    if (!galleryType) return;

    const transaction = editor.state.tr;
    const firstPosition = selected[0].position;

    const markerType = editor.state.schema.nodes.photoLocationMarker;
    if (!markerType) return;

    const markerIds = selected.map(() => crypto.randomUUID());

    photos.forEach((photo, index) => {
      Object.assign(photo, { markerId: markerIds[index] });
    });

    for (let i = selected.length - 1; i >= 0; i--) {
      const { position, node } = selected[i];
      transaction.replaceWith(
        position,
        position + node.nodeSize,
        markerType.create({ markerId: markerIds[i] })
      );
    }

    let insertionPosition = -1;

    transaction.doc.descendants((node, position) => {
      if (
        insertionPosition === -1 &&
        node.type.name === "photoLocationMarker" &&
        node.attrs.markerId === markerIds[0]
      ) {
        insertionPosition = position + node.nodeSize;
      }
    });

    if (insertionPosition === -1) {
      window.alert("The original photograph location could not be found.");
      return;
    }
    const galleryNode = galleryType.create({ photos, caption: "" });

    const insertionPoint = transaction.doc.resolve(insertionPosition);

    if (!insertionPoint.parent.canReplaceWith(
      insertionPoint.index(),
      insertionPoint.index(),
      galleryType
    )) {
      window.alert("The gallery cannot be placed here safely.");
      return;
    }

    transaction.insert(insertionPosition, galleryNode);

    editor.view.dispatch(transaction);
    setGalleryPhotoSelections([]);

  };

  return (
    <div>

      <style>{`
        .story-toolbar .story-tool {
          position: relative;
        }
        .story-toolbar .story-tool[data-tooltip]:hover::after,
        .story-toolbar .story-tool[data-tooltip]:focus-visible::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: calc(100% + 10px);
          left: 65%;
          z-index: 100;
          width: max-content;
          max-width: 240px;
          padding: 6px 9px;
          border-radius: 5px;
          background: #1f2937;
          color: white;
          font-size: 12px;
          font-style: normal;
          font-weight: 400;
          line-height: 1.4;
          text-align: left;
          white-space: normal;
          pointer-events: none;
          box-shadow: 0 2px 6px #0003;
        }
        .story-toolbar .story-tool:disabled:hover::after {
          display: none;
        }
      `}</style>
      <div className="story-toolbar sticky top-28 z-30 mb-2 rounded-lg border bg-white p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1 ">
<button data-tooltip="Heading 2"
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className="story-tool rounded border p-2 hover:bg-gray-100"
        >
          <Heading2 size={18} aria-label="Heading 2" />
        </button>       
        <button data-tooltip="Heading 3"
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          className="story-tool rounded border p-2 hover:bg-gray-100"
        >
          <Heading3 size={18} aria-label="Heading 3" />
        </button>
 <button data-tooltip="Bold"
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className="story-tool rounded border px-3 py-2 font-bold"
        >
          <Bold size={18} aria-label="Bold" />
        </button>
        <button data-tooltip="Italic"
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className="story-tool rounded border px-3 py-2 italic"
        >
          <Italic size={18} aria-label="Italic" />
        </button>
        <button data-tooltip="Bullet List"
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className="story-tool rounded border p-2 hover:bg-gray-100"
        >
          <List size={18} aria-label="Bullet List" />
        </button>
<button data-tooltip="Inset Text"
          type="button"
          onClick={() => editor?.chain().focus().toggleInsetText().run()}
          className="story-tool rounded border p-2 hover:bg-gray-100"
        >
          <IndentIncrease size={18} aria-label="Inset Text" />
        </button>
<button data-tooltip="Block Quote"
  type="button"
  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
  className="story-tool rounded border p-2 hover:bg-gray-100"
>
  <Quote size={18} aria-label="Block Quote" />
</button>
        <button data-tooltip="Insert Link"
          type="button"
          onClick={() => {
            if (!editor) return;
                        const { from, to } = editor.state.selection;
            const url = window.prompt("Enter the website address (URL):");
            if (url) {
              editor.chain().focus().setTextSelection({ from, to }).setLink({ href: url }).run();            
          }}}
          className="story-tool rounded border p-2 hover:bg-gray-100"
        >
          <Link2 size={18} aria-label="Insert Link" />
        </button>
        <button data-tooltip="Clear Formatting"
          type="button"
          onClick={() => editor?.chain().focus().unsetAllMarks().run()}
          className="story-tool rounded border p-2 hover:bg-gray-100"
        >
          <RemoveFormatting size={18} aria-label="Clear Formatting" />
        </button>
        <button data-tooltip="Undo"
          type="button"
          onClick={() => editor?.chain().focus().undo().run()}
          className="story-tool rounded border p-2 hover:bg-gray-100"
        >
          <Undo2 size={18} aria-label="Undo" />
        </button>
        <button data-tooltip="Redo"
          type="button"
          onClick={() => editor?.chain().focus().redo().run()}
          className="story-tool rounded border p-2 hover:bg-gray-100"
        >
          <Redo2 size={18} aria-label="Redo" />
        </button>
                </div>
        <div className="my-2 border-t border-gray-200" />
        <div className="flex flex-wrap items-center gap-1 ">
<button data-tooltip="Insert Photo"
          type="button"
          disabled={!editor}
          onClick={async () => {
            if (!editor) return;

            const picker = document.createElement("input");
            picker.type = "file";
            picker.accept = "image/jpeg,image/png";

            picker.onchange = async () => {
              const file = picker.files?.[0];
              if (!file) return;

              const position = editor.state.selection.from;
              const form = new FormData();
              form.append("file", file);

              try {
                const response = await fetch("/api/dashboard/upload", {
                  method: "POST",
                  body: form,
                });
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.error || "Upload failed");
                }

                editor.chain().focus()
                  .insertContentAt(position, {
                    type: "image",
                    attrs: { src: result.url, alt: file.name },
                  })
                  .run();
              } catch (error) {
                window.alert(
                  error instanceof Error ? error.message : "Upload failed"
                );
              }
            };

            picker.click();
          }}
          className="story-tool rounded border p-2 hover:bg-gray-100"
        >
          <ImagePlus size={18} aria-label="Insert Photo" />
        </button>
        <button
          type="button"
          data-tooltip="Select one or more photographs from Finder"
          disabled={!editor}
          onClick={() => insertGallery()}
          className="story-tool rounded border px-3 py-2 hover:bg-gray-100 disabled:opacity-40"
        >
          Insert Gallery
        </button>
        {(["small", "medium", "large", "full"] as const).map((size) => (
          <button
            key={size}
            type="button"
            data-tooltip={`Set selected photo to ${size}`}
            disabled={!editor || !photoSelected}
            onClick={() =>
              editor?.chain().focus().updateAttributes("image", {
                photoSize: size,
                photoWidth: null,
              }).run()
            }
            className="story-tool rounded border p-2 hover:bg-gray-100 disabled:opacity-40"
          >
            <span
              aria-label={`${size} photo size`}
              className="inline-flex h-[18px] w-[22px] items-center justify-center"
            >
              <span
                className="inline-block border-2 border-current"
                style={{
                  width: size === "small" ? 7 : size === "medium" ? 11 : size === "large" ? 15 : 20,
                  height: size === "small" ? 6 : size === "medium" ? 9 : size === "large" ? 12 : 16,
                }}
              />
            </span>
          </button>
        ))}
        {(["left", "center", "right"] as const).map((position) => (
          <button
            key={position}
            type="button"
            data-tooltip={`Position selected photo ${position}`}
            disabled={!editor || !photoSelected}
            onClick={() =>
              editor?.chain().focus().updateAttributes("image", {
                photoPosition: position,
              }).run()
            }
            className="story-tool rounded border p-2 hover:bg-gray-100 disabled:opacity-40"
          >
            {position === "left" ? (
              <AlignLeft size={18} />
            ) : position === "center" ? (
              <AlignCenter size={18} />
            ) : (
              <AlignRight size={18} />
            )}
          </button>
        ))}
      <button
        type="button"
        data-tooltip="Add or edit the selected photograph's caption"
        disabled={!editor || (!photoSelected && !gallerySelected)}
        onClick={() => {
          if (!editor) return;
          const isGallery = editor.isActive("photoGallery");
          const type = isGallery ? "photoGallery" : "image";
          const attribute = isGallery ? "caption" : "photoCaption";
          const current = editor.getAttributes(type)[attribute] || "";
          const caption = window.prompt(
            isGallery ? "Gallery caption:" : "Photo caption:",
            current
          );
          if (caption === null) return;
          editor.chain().focus().updateAttributes(type, {
            [attribute]: caption,
          }).run();
        }}
        className="story-tool rounded border px-3 py-2 disabled:opacity-40"
      >
        <Captions size={18} aria-label="Add or Edit Caption" />
      </button>
<details className="group relative ml-auto shrink-0 rounded-lg border bg-gray-50 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium">
          Advanced
        </summary>
        <div className="hidden absolute right-0 top-full z-50 mt-2 w-72 flex-wrap gap-1 rounded-lg border bg-white p-3 shadow-lg group-open:flex">
      <button
        type="button"
        data-tooltip="Add selected photograph to gallery"
        disabled={!editor || !photoSelected || galleryPhotoSelections.length >= 3}
        onClick={() => {
          if (!editor || !editor.isActive("image")) return;
          const { from: position } = editor.state.selection;
          const node = editor.state.doc.nodeAt(position);
          if (node?.type.name !== "image") return;
          const src = node.attrs.src;
          if (typeof src !== "string" || !src) return;
          setGalleryPhotoSelections((previous) =>
            previous.some((photo) => photo.position === position)
              ? previous
              : [...previous, { position, src }]
          );
        }}
        className="story-tool rounded border px-3 py-2 disabled:opacity-40"
      >
        Add to Gallery ({galleryPhotoSelections.length}/3)
      </button>
      <button
        type="button"
        data-tooltip="Combine selected photographs into a gallery"
        disabled={!editor || galleryPhotoSelections.length < 2}
        onClick={makeGallery}
        className="story-tool rounded border px-3 py-2 disabled:opacity-40"
      >
        Make Gallery
      </button>
      <button
        type="button"
        data-tooltip="Clear selected gallery photographs"
        disabled={galleryPhotoSelections.length === 0}
        onClick={() => setGalleryPhotoSelections([])}
        className="story-tool rounded border px-3 py-2 disabled:opacity-40"
      >
        Clear Selection
      </button>
      <button
        type="button"
        data-tooltip="Separate the selected gallery into individual photographs"
        disabled={!editor || !gallerySelected}
        onClick={separateGallery}
        className="story-tool rounded border px-3 py-2 disabled:opacity-40"
      >
        Separate Gallery
      </button>
      <button
        type="button"
        data-tooltip="Select this gallery for moving"
        disabled={!editor || !gallerySelected || !!galleryToMove}
        onClick={startMovingGallery}
        className="story-tool rounded border px-3 py-2 disabled:opacity-40"
      >
        Move Gallery
      </button>
      <button
        type="button"
        data-tooltip="Place the gallery at the cursor"
        disabled={!editor || !galleryToMove}
        onClick={placeMovingGallery}
        className="story-tool rounded border px-3 py-2 disabled:opacity-40"
      >
        Place Gallery
      </button>
      <button
        type="button"
        data-tooltip="Cancel moving the gallery"
        disabled={!galleryToMove}
        onClick={() => setGalleryToMove(null)}
        className="story-tool rounded border px-3 py-2 disabled:opacity-40"
      >
        Cancel Move
      </button>
        </div>
      </details>
              </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

