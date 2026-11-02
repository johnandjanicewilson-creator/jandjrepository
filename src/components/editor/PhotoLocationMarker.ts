import { Node, mergeAttributes } from "@tiptap/core";

export const PhotoLocationMarker = Node.create({
  name: "photoLocationMarker",
  group: "block",
  atom: true,
  selectable: false,

  addAttributes() {
    return {
      markerId: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-marker-id") || "",
        renderHTML: (attributes) => ({
          "data-marker-id": attributes.markerId,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-photo-location]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-photo-location": "true",
        style: "display: none;",
      }),
    ];
  },
});
