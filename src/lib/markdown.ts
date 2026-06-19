import { remark } from "remark";
import remarkGfm from "remark-gfm";
import html from "remark-html";

/** Standalone images in their own <p> — unwrap so spacing/centering apply cleanly. */
function improveImageMarkup(html: string): string {
  return html.replace(
    /<p>\s*((?:<a\b[^>]*>\s*)?<img\b[^>]*\/?>(?:\s*<\/a>)?)\s*<\/p>/gi,
    '<div class="post-media">$1</div>',
  );
}

const FIGURE_CLASS = "my-6";
const FIGCAPTION_CLASS = "mt-2 text-center text-sm italic text-gray-600";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function decodeHtmlEntities(text: string): string {
  const decodedNamed = text
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/g, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");

  return decodedNamed.replace(/&#(x?[0-9a-fA-F]+);/g, (_match, raw) => {
    const isHex = raw.toLowerCase().startsWith("x");
    const value = parseInt(isHex ? raw.slice(1) : raw, isHex ? 16 : 10);
    return Number.isFinite(value) ? String.fromCodePoint(value) : _match;
  });
}

function altFromImgTag(imgTag: string): string {
  const match = imgTag.match(/\balt=(["'])([\s\S]*?)\1/i);
  return decodeHtmlEntities(match?.[2] ?? "");
}

function shouldShowCaption(alt: string): boolean {
  return alt.includes(" ");
}

/** Wrap standalone images with multi-word alt in figure/figcaption (matches MdxImage). */
function wrapCaptionedImages(html: string): string {
  return html.replace(
    /<div class="post-media">\s*((?:<a\b[^>]*>\s*)?(<img\b[^>]*\/?>)(?:\s*<\/a>)?)\s*<\/div>/gi,
    (full, inner, imgTag) => {
      const alt = altFromImgTag(imgTag);
      if (!shouldShowCaption(alt)) return full;

      return `<figure class="${FIGURE_CLASS}">${inner}<figcaption class="${FIGCAPTION_CLASS}">${escapeHtml(alt)}</figcaption></figure>`;
    },
  );
}

/** Mark italic lines immediately after images as captions. */
function improveCaptionMarkup(html: string): string {
  const captionAfterMedia =
    /((?:<div class="post-media">[\s\S]*?<\/div>|<figure[\s\S]*?<\/figure>))\s*<p>\s*<em>([\s\S]*?)<\/em>\s*<\/p>/gi;

  return html.replace(captionAfterMedia, (_match, media, caption) => {
    const text = caption.replace(/<[^>]+>/g, "").trim();
    if (!text) return _match;
    return `${media}\n<p class="post-caption"><em>${text}</em></p>`;
  });
}

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(html, { sanitize: false })
    .process(markdown);

  const htmlString = result.toString();
  return improveCaptionMarkup(
    wrapCaptionedImages(improveImageMarkup(htmlString)),
  );
}
