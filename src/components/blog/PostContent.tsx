interface PostContentProps {
  html: string;
}

export function PostContent({ html }: PostContentProps) {
  const displayHtml = html.replace(
    /<img\b[^>]*data-photo-caption="([^"]+)"[^>]*>/gi,
    (image, caption: string) => {
      const safeCaption = caption
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      return `${image}<span class="editor-photo-caption">${safeCaption}</span>`;
    }
  );

  return (
    <div
      className="prose-travel w-full"
      dangerouslySetInnerHTML={{ __html: displayHtml }}
    />
  );
}
