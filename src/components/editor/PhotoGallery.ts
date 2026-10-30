import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { PhotoGalleryView } from "./PhotoGalleryView";

export const PhotoGallery = Node.create({
  name: "photoGallery",
  group: "block",
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      photos: {
        default: [],
        parseHTML: (element) => {
          try {
            return JSON.parse(element.getAttribute("data-photos") || "[]");
          } catch {
            return [];
          }
        },
        renderHTML: (attributes) => ({
          "data-photos": JSON.stringify(attributes.photos || []),
        }),
      },
      caption: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-caption") || "",
        renderHTML: (attributes) => ({
          "data-caption": attributes.caption || "",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-photo-gallery]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "figure",
      mergeAttributes(HTMLAttributes, {
        "data-photo-gallery": "true",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PhotoGalleryView);
  },
});
