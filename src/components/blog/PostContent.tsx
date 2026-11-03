import sanitizeHtml from "sanitize-html";

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

  const galleryHtml = displayHtml.replace(
    /<figure\b([^>]*\bdata-photo-gallery="true"[^>]*)><\/figure>/gi,
    (figure, attributes: string) => {
      const photosMatch = attributes.match(/data-photos="([^"]*)"/);
      const captionMatch = attributes.match(/data-caption="([^"]*)"/);

      if (!photosMatch) return figure;

      try {
        const decode = (value: string) =>
          value.replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, "&");

        const escapeHtml = (value: string) =>
          value.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

        const photos = JSON.parse(decode(photosMatch[1]));
        if (!Array.isArray(photos) || photos.length < 2 || photos.length > 3) {
          return figure;
        }

        const images = photos.map((photo: { src: string; alt?: string }) =>
          `<img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt || "")}" style="width:100%;height:180px;object-fit:cover;display:block;border-radius:4px;" />`
        ).join("");

        const caption = captionMatch ? decode(captionMatch[1]) : "";

        return `<figure style="margin:16px 0;max-width:100%;">
          <div style="display:grid;grid-template-columns:repeat(${photos.length},minmax(0,1fr));gap:8px;">${images}</div>
          ${caption ? `<figcaption style="text-align:center;font-size:0.875rem;font-style:italic;margin-top:6px;">${escapeHtml(caption)}</figcaption>` : ""}
        </figure>`;
      } catch {
        return figure;
      }
    }
  );

  return (
    <div
      className="prose-travel w-full"
      dangerouslySetInnerHTML={{
        __html: sanitizeHtml(galleryHtml, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "figure", "figcaption"]),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            "*": ["class", "style"],
            img: ["src", "alt", "width", "height", "loading"],
            a: ["href", "name", "target", "rel"],
          },
          allowedStyles: {
            "*": {
              "text-align": [/^(left|right|center)$/],
              "margin": [/^[0-9.]+(px|rem|em|%)?(\s+[0-9.]+(px|rem|em|%)?)*$/],
              "margin-top": [/^[0-9.]+(px|rem|em|%)$/],
              "max-width": [/^[0-9.]+(px|rem|em|%)$/],
              "display": [/^(grid|block|inline-block|flex)$/],
              "grid-template-columns": [/^repeat\([23],minmax\(0,1fr\)\)$/],
              "gap": [/^[0-9.]+px$/],
              "width": [/^[0-9.]+%$/],
              "height": [/^[0-9.]+px$/],
              "object-fit": [/^(cover|contain)$/],
              "border-radius": [/^[0-9.]+px$/],
              "font-size": [/^[0-9.]+rem$/],
              "font-style": [/^italic$/],
            },
          },
        })
      }}
    />
  );
}
