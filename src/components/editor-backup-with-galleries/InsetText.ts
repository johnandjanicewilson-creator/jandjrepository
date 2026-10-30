import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    insetText: {
      toggleInsetText: () => ReturnType;
    };
  }
}

export const InsetText = Node.create({
  name: "insetText",
  group: "block",
  content: "block+",
  defining: true,

  parseHTML() {
    return [{ tag: "div[data-inset-text]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-inset-text": "",
        class: "mx-8 px-4",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleInsetText:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
    };
  },
});
