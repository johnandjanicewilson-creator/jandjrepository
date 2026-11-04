import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { PhotoView } from "./PhotoView";

export const SizedImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(PhotoView);
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      photoCaption: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-photo-caption") || "",
        renderHTML: (attributes) => ({
          "data-photo-caption": attributes.photoCaption,
        }),
      },
      photoPosition: {
        default: "center",
        parseHTML: (element) =>
          element.getAttribute("data-photo-position") || "center",
        renderHTML: (attributes) => {
          const position = attributes.photoPosition;
          const positioning =
            position === "left"
              ? "float: left; margin: 0 16px 12px 0;"
              : position === "right"
                ? "float: right; margin: 0 0 12px 16px;"
                : "display: block; margin: 0 auto 12px;";
          return {
            "data-photo-position": position,
            style: positioning,
          };
        },
      },
      photoWidth: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute("data-photo-width");
          return value && /^[0-9]+$/.test(value) ? Number(value) : null;
        },
        renderHTML: (attributes) =>
          attributes.photoWidth
            ? { "data-photo-width": String(attributes.photoWidth) }
            : {},
      },
      photoSize: {
        default: "full",
        parseHTML: (element) =>
          element.getAttribute("data-photo-size") || "full",
        renderHTML: (attributes) => ({
          "data-photo-size": attributes.photoSize,
          style: `width: ${
            attributes.photoWidth
              ? `${attributes.photoWidth}px`
              : ({
                  small: "25%",
                  medium: "50%",
                  large: "75%",
                  full: "100%",
                }[attributes.photoSize as string] || "100%")
          }; max-width: 100%; height: auto;`,
        }),
      },
    };
  },
});
