#!/usr/bin/env node
/**
 * Re-migrate WordPress posts with document-order image placement and captions.
 *
 * Usage:
 *   node scripts/migrate-wp-intelligent.mjs --all
 *   node scripts/migrate-wp-intelligent.mjs --year 2011
 *   node scripts/migrate-wp-intelligent.mjs --preview "Anchorage to Denali"
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { XMLParser } from "fast-xml-parser";
import TurndownService from "turndown";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const XML_CANDIDATES = [
  path.join(ROOT, "wordpress-backup/johnandjanice-wordpress-export.xml"),
  path.join(ROOT, "Wordpress Backup/johnandjanice-wordpress-export.xml"),
  path.join(ROOT, "johnandjanice-wordpress-export.xml"),
  path.join(ROOT, "..", "johnandjanice-wordpress-export.xml"),
];

const PROMO_PATTERNS =
  /jack'?s\s+story|battle\s+of\s+the\s+bulge|amazon\.com|buy\s+now\s*!|john'?s\s+book.*amazon/i;

const UPLOADS_CANDIDATES = [
  path.join(ROOT, "Wordpress Backup/wordpress-backup-uploads"),
  path.join(ROOT, "wordpress-backup/wordpress-backup-uploads"),
];

const POSTS_DIR = path.join(ROOT, "content/posts");
const IMAGES_ROOT = path.join(ROOT, "public/images");

const MIGRATE_ALL = process.argv.includes("--all");
const CLEAR_POSTS = process.argv.includes("--clear-posts") || MIGRATE_ALL;
const previewFlagIndex = process.argv.indexOf("--preview");
const PREVIEW_TITLE =
  previewFlagIndex !== -1 ? process.argv[previewFlagIndex + 1] : null;
const yearFlagIndex = process.argv.indexOf("--year");
const FILTER_YEAR =
  yearFlagIndex !== -1 ? parseInt(process.argv[yearFlagIndex + 1], 10) : null;
const fromFlagIndex = process.argv.indexOf("--from");
const toFlagIndex = process.argv.indexOf("--to");
const YEAR_RANGE_FROM =
  fromFlagIndex !== -1 ? parseInt(process.argv[fromFlagIndex + 1], 10) : null;
const YEAR_RANGE_TO =
  toFlagIndex !== -1 ? parseInt(process.argv[toFlagIndex + 1], 10) : null;
const YEAR_MIN = 2011;
const YEAR_MAX = 2026;

const XML_PATH = XML_CANDIDATES.find((p) => fs.existsSync(p));
const UPLOADS_ROOT = UPLOADS_CANDIDATES.find((p) => fs.existsSync(p));

if (!XML_PATH) {
  console.error("WordPress XML not found. Tried:\n", XML_CANDIDATES.join("\n"));
  process.exit(1);
}
if (!UPLOADS_ROOT) {
  console.error("Uploads folder not found. Tried:\n", UPLOADS_CANDIDATES.join("\n"));
  process.exit(1);
}

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});

turndown.remove(["script", "style", "noscript"]);

function ensureArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value.map(getText).filter(Boolean).join(" ").trim();
  }
  if (typeof value === "object" && "#text" in value) {
    return getText(value["#text"]);
  }
  return "";
}

function stripGutenberg(html) {
  return html
    .replace(/<!--\s*\/?wp:[\s\S]*?-->/g, "")
    .replace(/class="wp-block[^"]*"/gi, "")
    .replace(/class="has-[^"]*"/gi, "");
}

/** Extract caption="..." from [caption] opening tag attributes. */
function extractCaptionAttr(attrs) {
  const m = attrs.match(/\bcaption=(["'])((?:(?!\1)[^\\]|\\.)*)\1/i);
  if (!m) return "";
  return m[2].replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
}

/** Convert all WordPress [caption] shortcodes to <figure> blocks before HTML parsing. */
function normalizeCaptionShortcodes(html) {
  return html.replace(
    /\[caption([^\]]*)\]([\s\S]*?)\[\/caption\]/gi,
    (match, attrs, inner) => {
      let caption = extractCaptionAttr(attrs);
      if (!caption) {
        caption = inner
          .replace(/<a[\s\S]*?<\/a>/gi, "")
          .replace(/<img[^>]*\/?>/gi, "")
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim();
      }
      const safeCaption = caption
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;");
      return `<figure class="wp-caption" data-caption="${safeCaption}">${inner}</figure>`;
    },
  );
}

/** Unwrap captions incorrectly nested inside headings. */
function unwrapCaptionsFromHeadings(html) {
  return html.replace(
    /<h[1-6][^>]*>\s*(\[caption[\s\S]*?\[\/caption\]|<figure[^>]*class="wp-caption"[\s\S]*?<\/figure>)\s*<\/h[1-6]>/gi,
    "$1",
  );
}

/** Remove Jack's Story / Amazon book promotion blocks. */
function removePromotionalContent(html) {
  let result = html;

  result = result.replace(/<p[^>]*>[\s\S]*?<\/p>/gi, (block) =>
    PROMO_PATTERNS.test(block) ? "" : block,
  );
  result = result.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, (block) =>
    PROMO_PATTERNS.test(block) ? "" : block,
  );
  result = result.replace(/<div[^>]*>[\s\S]*?<\/div>/gi, (block) =>
    PROMO_PATTERNS.test(block) && block.length < 2000 ? "" : block,
  );
  result = result.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, (block) =>
    PROMO_PATTERNS.test(block) ? "" : block,
  );

  return result;
}

function preprocessWordPressHtml(html, isGutenberg) {
  let content = decodeContentUrls(html);
  if (isGutenberg) content = stripGutenberg(content);

  content = content
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/@page\s*\{[^}]*\}/gi, "")
    .replace(/<span[^>]*>\s*<\/span>/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\r\n/g, "\n");

  content = unwrapCaptionsFromHeadings(content);
  content = normalizeCaptionShortcodes(content);
  content = removePromotionalContent(content);

  return content;
}

function decodeContentUrls(content) {
  return content.replace(/\\u002d/gi, "-").replace(/&#0*45;/g, "-");
}

function getOriginalBasename(filename) {
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);
  const original = name
    .replace(/-\d+x\d+$/i, "")
    .replace(/-scaled$/i, "")
    .replace(/-+$/, "");
  return `${original}${ext}`;
}

function normalizeImageKey(imagePath) {
  const basename = path.basename(String(imagePath).split(/[?#]/)[0]);
  return getOriginalBasename(basename).toLowerCase();
}

function isResizedVariant(filename) {
  return /-\d+x\d+\.[^.]+$/i.test(filename);
}

function urlToRelativePath(url) {
  const uploadsMatch = url.match(/\/uploads\/(\d{4}\/\d{2}\/[^/?#]+)/i);
  if (uploadsMatch) {
    return { year: uploadsMatch[1].split("/")[0], rel: uploadsMatch[1] };
  }
  const filesMatch = url.match(
    /files\.wordpress\.com\/(\d{4}\/\d{2}\/[^/?#]+)/i,
  );
  if (filesMatch) {
    return { year: filesMatch[1].split("/")[0], rel: filesMatch[1] };
  }
  return null;
}

function extractImageUrls(content) {
  const decoded = decodeContentUrls(content);
  const urls = new Set();
  const patterns = [
    /https?:\/\/johnandjanice\.com\/wp-content\/uploads\/[^\s"'<>]+/gi,
    /https?:\/\/travelswithjohnandjanice\.files\.wordpress\.com\/[^\s"'<>]+/gi,
  ];
  for (const pattern of patterns) {
    for (let url of decoded.match(pattern) || []) {
      url = url.split(/[?#]/)[0];
      urls.add(url);
    }
  }
  return [...urls];
}

function resolveSourceFile(relPath) {
  const originalBase = getOriginalBasename(path.basename(relPath));
  const year = relPath.split("/")[0];
  const dirsToSearch = new Set();

  const monthDir = path.join(UPLOADS_ROOT, path.dirname(relPath));
  if (fs.existsSync(monthDir)) dirsToSearch.add(monthDir);

  const yearRoot = path.join(UPLOADS_ROOT, year);
  if (fs.existsSync(yearRoot)) {
    for (const entry of fs.readdirSync(yearRoot)) {
      const full = path.join(yearRoot, entry);
      if (fs.statSync(full).isDirectory()) dirsToSearch.add(full);
    }
  }

  for (const folder of dirsToSearch) {
    const exact = path.join(folder, originalBase);
    if (fs.existsSync(exact) && !isResizedVariant(path.basename(exact))) {
      return exact;
    }
  }
  return null;
}

function copyImages(urls, copiedLog) {
  const mapping = new Map();

  for (const url of urls) {
    const parsed = urlToRelativePath(url);
    if (!parsed) continue;

    const srcFile = resolveSourceFile(parsed.rel);
    if (!srcFile) continue;

    const destDir = path.join(IMAGES_ROOT, parsed.year);
    fs.mkdirSync(destDir, { recursive: true });
    const destName = path.basename(srcFile);
    const destPath = path.join(destDir, destName);

    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcFile, destPath);
      copiedLog.push(destPath);
    }

    const publicPath = `/images/${parsed.year}/${destName}`;
    mapping.set(url, publicPath);
    mapping.set(path.basename(parsed.rel), publicPath);
    mapping.set(getOriginalBasename(path.basename(parsed.rel)), publicPath);
  }

  return mapping;
}

function resolvePublicPath(src, mapping) {
  if (!src) return null;
  const clean = src.split(/[?#]/)[0];
  const parsed = urlToRelativePath(clean);
  if (!parsed) return clean;

  const basename = path.basename(parsed.rel);
  const original = getOriginalBasename(basename);
  return (
    mapping.get(clean) ||
    mapping.get(basename) ||
    mapping.get(original) ||
    `/images/${parsed.year}/${original}`
  );
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function humanizeFilename(filename) {
  return path
    .basename(filename, path.extname(filename))
    .replace(/-\d+x\d+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeImageUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url.split(/[?#]/)[0]);
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`.toLowerCase();
  } catch {
    return url.split(/[?#]/)[0].toLowerCase();
  }
}

/** WordPress stores attachment captions in excerpt:encoded (wp_post_excerpt). */
function getAttachmentCaption(item) {
  const encoded = getText(item["excerpt:encoded"]);
  if (encoded.trim()) return encoded.trim();

  const excerpt = getText(item.excerpt?.["#text"] || item.excerpt);
  if (excerpt.trim()) return excerpt.trim();

  return "";
}

function lookupAttachmentMeta(src, attachmentMaps, hints = {}) {
  if (hints.attachmentId) {
    const byId = attachmentMaps.byId.get(String(hints.attachmentId));
    if (byId) return byId;
  }

  if (hints.wpImageId) {
    const byWp = attachmentMaps.byId.get(String(hints.wpImageId));
    if (byWp) return byWp;
  }

  const normalized = normalizeImageUrl(src);
  if (normalized && attachmentMaps.byUrl.has(normalized)) {
    return attachmentMaps.byUrl.get(normalized);
  }

  const basename = path.basename(normalized || src);
  const original = getOriginalBasename(basename);
  if (attachmentMaps.byBasename.has(original)) {
    return attachmentMaps.byBasename.get(original);
  }

  return null;
}

function parseImageFromHtml(fragment, attachmentMaps, hints = {}) {
  const imgMatch = fragment.match(/<img\b[^>]*>/i);
  if (!imgMatch) return null;

  const imgTag = imgMatch[0];
  const src =
    imgTag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ||
    fragment.match(/\bsrc=["']([^"']+)["']/i)?.[1];
  if (!src) return null;

  const altAttr = imgTag.match(/\balt=["']([^"']*)["']/i)?.[1]?.trim() || "";
  const title = imgTag.match(/\btitle=["']([^"']*)["']/i)?.[1]?.trim() || "";
  const dataCaption =
    imgTag.match(/\bdata-caption=["']([^"']*)["']/i)?.[1]?.trim() || "";

  const figcaptionMatch = fragment.match(
    /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i,
  );
  const figcaptionText = figcaptionMatch
    ? figcaptionMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
    : "";

  const figureCaption = fragment.match(
    /data-caption=["']([^"']*)["']/i,
  )?.[1];
  const shortcodeAttrs = fragment.match(/\[caption([^\]]*)\]/i)?.[1] || "";
  const shortcodeCaption = extractCaptionAttr(shortcodeAttrs);

  const attachmentId =
    hints.attachmentId ||
    fragment.match(/id=["']attachment_(\d+)["']/i)?.[1];
  const wpImageId = imgTag.match(/\bwp-image-(\d+)\b/i)?.[1];

  const attachment = lookupAttachmentMeta(src, attachmentMaps, {
    attachmentId,
    wpImageId,
  });

  const caption =
    (figureCaption ? figureCaption.replace(/&quot;/g, '"').replace(/&amp;/g, "&") : "") ||
    shortcodeCaption ||
    figcaptionText ||
    dataCaption ||
    attachment?.caption ||
    "";

  const alt =
    altAttr ||
    attachment?.alt ||
    title ||
    humanizeFilename(src);

  return {
    src,
    alt,
    caption: caption.replace(/\s+/g, " ").trim(),
  };
}

const BLOCK_SCANNERS = [
  { type: "caption", re: /\[caption[\s\S]*?\[\/caption\]/i },
  { type: "figure", re: /<figure[\s\S]*?<\/figure>/i },
  { type: "linkedImg", re: /<a\b[^>]*>\s*<img\b[^>]*\/?>\s*<\/a>/i },
  { type: "img", re: /<img\b[^>]*\/?>/i },
  { type: "h", re: /<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/i },
  { type: "ul", re: /<ul\b[^>]*>[\s\S]*?<\/ul>/i },
  { type: "ol", re: /<ol\b[^>]*>[\s\S]*?<\/ol>/i },
  { type: "blockquote", re: /<blockquote\b[^>]*>[\s\S]*?<\/blockquote>/i },
  { type: "p", re: /<p\b[^>]*>[\s\S]*?<\/p>/i },
  { type: "span", re: /<span\b[^>]*>[\s\S]*?<\/span>/i },
];

function findEarliestBlock(html, start) {
  let best = null;
  for (const scanner of BLOCK_SCANNERS) {
    const slice = html.slice(start);
    const match = slice.match(scanner.re);
    if (!match) continue;
    const index = start + (match.index ?? 0);
    if (!best || index < best.index) {
      best = {
        type: scanner.type,
        index,
        content: match[0],
        length: match[0].length,
      };
    }
  }
  return best;
}

function splitHtmlIntoParts(html) {
  const parts = [];
  let pos = 0;

  while (pos < html.length) {
    const block = findEarliestBlock(html, pos);
    if (!block) {
      const tail = html.slice(pos).trim();
      if (tail) parts.push({ type: "text", content: tail });
      break;
    }

    if (block.index > pos) {
      const text = html.slice(pos, block.index).trim();
      if (text) parts.push({ type: "text", content: text });
    }

    parts.push({ type: block.type, content: block.content });
    pos = block.index + block.length;
  }

  return parts;
}

function htmlFragmentToMarkdown(fragment) {
  const trimmed = fragment.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("<")) {
    const md = turndown.turndown(trimmed).trim();
    return md.replace(/\n{3,}/g, "\n\n");
  }

  return trimmed.replace(/\s+/g, " ").trim();
}

function formatImageMarkdown(image, mapping) {
  const publicPath = resolvePublicPath(image.src, mapping);
  if (!publicPath) return "";

  const alt = (image.alt || humanizeFilename(publicPath))
    .replace(/[\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const caption = (image.caption || "").replace(/\s+/g, " ").trim();

  let md = `\n\n![${alt}](${publicPath})\n`;
  if (caption) {
    md += `\n*${caption}*\n`;
  }
  return `${md}\n`;
}

function partToMarkdown(part, mapping, attachmentMaps) {
  if (part.type === "text") {
    return htmlFragmentToMarkdown(part.content);
  }

  if (
    part.type === "caption" ||
    part.type === "linkedImg" ||
    part.type === "img" ||
    part.type === "figure"
  ) {
    const image = parseImageFromHtml(part.content, attachmentMaps);
    if (image) return formatImageMarkdown(image, mapping);
    if (part.type === "figure") {
      return htmlFragmentToMarkdown(part.content);
    }
    return "";
  }

  if (part.type === "span") {
    const md = htmlFragmentToMarkdown(part.content);
    return md || "";
  }

  return htmlFragmentToMarkdown(part.content);
}

function scoreParagraph(paragraph, image) {
  const basename = path.basename(image.src || "");
  const keywords = new Set([
    ...tokenize(image.caption || ""),
    ...tokenize(image.alt || ""),
    ...tokenize(humanizeFilename(basename)),
  ]);

  const pTokens = tokenize(paragraph);
  let score = 0;
  for (const kw of keywords) {
    if (kw.length < 4) continue;
    for (const pt of pTokens) {
      if (pt.includes(kw) || kw.includes(pt)) {
        score += kw.length;
        break;
      }
    }
  }
  return score;
}

function insertOrphanImages(markdown, orphans, mapping) {
  if (!orphans.length) return markdown;

  const paragraphs = markdown.split(/\n\n+/);
  const usedPositions = new Set();

  for (const image of orphans) {
    let bestIndex = -1;
    let bestScore = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      if (p.startsWith("![")) continue;
      const score = scoreParagraph(p, image);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    const block = formatImageMarkdown(image, mapping).trim();
    if (bestScore > 0 && bestIndex >= 0) {
      paragraphs.splice(bestIndex + 1, 0, block);
      usedPositions.add(bestIndex);
    } else {
      paragraphs.push(block);
    }
  }

  return paragraphs.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

function htmlToIntelligentMarkdown(html, mapping, attachmentMaps, isGutenberg) {
  const content = preprocessWordPressHtml(html, isGutenberg);
  const parts = splitHtmlIntoParts(content);
  const chunks = [];

  for (const part of parts) {
    const md = partToMarkdown(part, mapping, attachmentMaps);
    if (md.trim()) chunks.push(md.trim());
  }

  return chunks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

function postProcessMarkdown(markdown) {
  let md = markdown;

  md = md.replace(/\[caption[\s\S]*?\[\/caption\]/gi, "");
  md = md.replace(/\[caption[^\]]*\]/gi, "");
  md = md.replace(/\[\/caption\]/gi, "");

  const paragraphs = md.split(/\n\n+/);
  const cleaned = [];
  const seen = new Set();

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (PROMO_PATTERNS.test(trimmed)) continue;

    const normalized = trimmed
      .replace(/\s+/g, " ")
      .toLowerCase()
      .slice(0, 200);
    if (!trimmed.startsWith("![") && seen.has(normalized)) continue;
    seen.add(normalized);

    cleaned.push(trimmed);
  }

  return cleaned.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

function buildAttachmentMaps(items) {
  const byId = new Map();
  const byUrl = new Map();
  const byBasename = new Map();
  const byParent = new Map();

  for (const item of items) {
    if (getText(item["wp:post_type"]) !== "attachment") continue;

    const id = String(getText(item["wp:post_id"]));
    const parentId = String(getText(item["wp:post_parent"]));
    const url = getText(
      item["wp:attachment_url"] || item.guid?.["#text"] || item.guid,
    );
    if (!url) continue;

    const metas = ensureArray(item["wp:postmeta"]);
    let alt = "";

    for (const meta of metas) {
      if (getText(meta["wp:meta_key"]) === "_wp_attachment_image_alt") {
        const value = getText(meta["wp:meta_value"]).trim();
        if (value) alt = value;
      }
    }

    const title = getText(item.title);
    const caption = getAttachmentCaption(item);

    const image = {
      src: url,
      alt: alt || title || humanizeFilename(url),
      caption,
    };

    if (id) byId.set(id, image);

    const normalized = normalizeImageUrl(url);
    if (normalized) byUrl.set(normalized, image);

    const basename = getOriginalBasename(path.basename(normalized || url));
    if (basename) byBasename.set(basename, image);

    if (parentId && parentId !== "0") {
      if (!byParent.has(parentId)) byParent.set(parentId, []);
      byParent.get(parentId).push(image);
    }
  }

  return { byId, byUrl, byBasename, byParent };
}

function getFeaturedImage(item, attachmentsById) {
  const metas = ensureArray(item["wp:postmeta"]);
  const thumb = metas.find(
    (m) => getText(m["wp:meta_key"]) === "_thumbnail_id",
  );
  if (thumb) {
    const url = attachmentsById.get(getText(thumb["wp:meta_value"]))?.src;
    if (url) return url;
  }
  return null;
}

function getCategories(item) {
  return ensureArray(item.category)
    .filter((c) => getText(c?.["@_domain"] || c?.domain) === "category")
    .map((c) => getText(c))
    .filter(Boolean);
}

function getTags(item) {
  return ensureArray(item.category)
    .filter((c) => getText(c?.["@_domain"] || c?.domain) === "post_tag")
    .map((c) => getText(c))
    .filter(Boolean);
}

function isGutenberg(content) {
  return content.includes("<!-- wp:");
}

function makeExcerpt(markdown) {
  const bodyParagraphs = markdown.split(/\n\n+/).filter((p) => {
    const t = p.trim();
    if (!t) return false;
    if (t.startsWith("![")) return false;
    if (/^\*[^*\n]+\*\s*$/.test(t)) return false;
    if (/^#{1,6}\s/.test(t)) return false;
    if (PROMO_PATTERNS.test(t)) return false;
    return true;
  });

  let text = (bodyParagraphs[0] || bodyParagraphs[1] || "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\*[^*]+\*/g, "")
    .replace(/\[caption[\s\S]*?\[\/caption\]/gi, "")
    .replace(/<a[^>]*>[\s\S]*?<\/a>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\(https?:\/\/[^)]+\)/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[#>*_\[\]\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length > 220) return text.slice(0, 217) + "...";
  return text || "Travel story from John and Janice.";
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function inferDestination(title, categories) {
  const t = title.toLowerCase();
  if (t.includes("alaska") || categories.some((c) => /alaska/i.test(c)))
    return "Alaska";
  if (t.includes("new zealand") || categories.some((c) => /zealand/i.test(c)))
    return "New Zealand";
  if (t.includes("bermuda")) return "Bermuda";
  if (
    t.includes("cairo") ||
    categories.some((c) => /egypt|cairo|middle east/i.test(String(c)))
  )
    return "Egypt";
  return String(
    categories.find((c) => !/^\d{4}/.test(String(c))) || categories[0] || "Travel",
  );
}

function inferRegion(destination) {
  const map = {
    Alaska: "North America",
    "New Zealand": "Oceania",
    Bermuda: "North America",
    Egypt: "Africa",
  };
  return map[destination] || "World";
}

function escapeYaml(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function formatFrontmatter(data) {
  const lines = ["---"];
  lines.push(`title: "${escapeYaml(data.title)}"`);
  lines.push(`date: "${data.date}"`);
  lines.push(`excerpt: "${escapeYaml(data.excerpt)}"`);
  lines.push(`destination: "${escapeYaml(data.destination)}"`);
  lines.push(`region: "${escapeYaml(data.region)}"`);
  lines.push(`year: ${data.year}`);
  lines.push("categories:");
  for (const c of data.categories) lines.push(`  - "${escapeYaml(c)}"`);
  lines.push("tags:");
  for (const t of data.tags) lines.push(`  - "${escapeYaml(t)}"`);
  lines.push(`featuredImage: "${data.featuredImage}"`);
  lines.push(`featured_image: "${data.featuredImage}"`);
  if (data.featuredImageAlt)
    lines.push(`featuredImageAlt: "${escapeYaml(data.featuredImageAlt)}"`);
  lines.push("showCategories: false");
  lines.push("showTags: false");
  lines.push("---");
  return lines.join("\n");
}

function collectUsedImageKeys(markdown) {
  const used = new Set();
  const re = /!\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(markdown))) {
    used.add(normalizeImageKey(m[1]));
  }
  return used;
}

function processPost(item, attachmentMaps) {
  const title = getText(item.title).replace(/\s+/g, " ").trim();
  const postId = getText(item["wp:post_id"]);
  const content = getText(item["content:encoded"]);
  const postDate = getText(item["wp:post_date"] || item.pubDate).slice(0, 10);
  const categories = getCategories(item);
  const tags = getTags(item);
  const gutenberg = isGutenberg(content);

  const imageUrls = extractImageUrls(content);
  const copiedLog = [];
  const mapping = copyImages(imageUrls, copiedLog);

  let markdown = htmlToIntelligentMarkdown(
    content,
    mapping,
    attachmentMaps,
    gutenberg,
  );

  const usedKeys = collectUsedImageKeys(markdown);
  const childAttachments = attachmentMaps.byParent.get(postId) || [];
  const orphans = [];

  for (const att of childAttachments) {
    const publicPath = resolvePublicPath(att.src, mapping);
    if (!publicPath) continue;
    copyImages([att.src], copiedLog);
    const key = normalizeImageKey(publicPath);
    if (!usedKeys.has(key)) {
      orphans.push({ ...att, src: att.src });
      usedKeys.add(key);
    }
  }

  if (orphans.length > 0) {
    markdown = insertOrphanImages(markdown, orphans, mapping);
  }

  markdown = postProcessMarkdown(markdown);

  markdown = markdown
    .replace(/(\/images\/\d{4}\/)([^)\s"']+)/g, (match, prefix, filename) => {
      return `${prefix}${getOriginalBasename(filename)}`;
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const hadPromo = PROMO_PATTERNS.test(content);
  const hadCaptionShortcode = /\[caption/i.test(content);
  const hadCaptionFixed = hadCaptionShortcode && !/\[caption/i.test(markdown);

  let featuredUrl = getFeaturedImage(item, attachmentMaps.byId);
  if (featuredUrl) {
    copyImages([featuredUrl], copiedLog);
    featuredUrl = resolvePublicPath(featuredUrl, mapping) || featuredUrl;
  } else {
    const firstImg = markdown.match(/!\[[^\]]*\]\(([^)]+)\)/);
    featuredUrl = firstImg?.[1] || "/images/placeholder.jpg";
  }

  const year = parseInt(postDate.slice(0, 4), 10);
  const destination = inferDestination(title, categories);
  const wpSlug = getText(item["wp:post_name"]) || slugify(title);

  const imageCount = (markdown.match(/!\[/g) || []).length;
  const captionCount = (markdown.match(/\n\*[^*\n]+\*\n/g) || []).length;

  return {
    title,
    date: postDate,
    excerpt: makeExcerpt(markdown),
    destination,
    region: inferRegion(destination),
    year,
    categories: categories.length ? categories : ["Travel"],
    tags: tags.length ? tags : [destination.toLowerCase().replace(/\s+/g, "-")],
    featuredImage: featuredUrl,
    featuredImageAlt: title,
    markdown,
    filename: `${postDate}-${wpSlug}.md`,
    imageCount,
    captionCount,
    copiedCount: copiedLog.length,
    hadPromo,
    hadCaptionFixed,
    hadCaptionShortcode,
  };
}

// --- Main ---
console.log("WordPress intelligent migration");
console.log(`XML:     ${XML_PATH}`);
console.log(`Uploads: ${UPLOADS_ROOT}`);
console.log("Reading export...\n");

const xml = fs.readFileSync(XML_PATH, "utf8");
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "#text",
  isArray: (name) =>
    ["item", "category", "wp:postmeta", "wp:comment"].includes(name),
});
const parsed = parser.parse(xml);
const items = ensureArray(parsed.rss?.channel?.item);
const attachmentMaps = buildAttachmentMaps(items);

const matched = [];
for (const item of items) {
  if (getText(item["wp:post_type"]) !== "post") continue;
  if (getText(item["wp:status"]) !== "publish") continue;

  const postDate = getText(item["wp:post_date"] || item.pubDate).slice(0, 10);
  const postYear = parseInt(postDate.slice(0, 4), 10);
  const title = getText(item.title);

  if (PREVIEW_TITLE && !title.includes(PREVIEW_TITLE)) continue;

  if (FILTER_YEAR) {
    if (postYear !== FILTER_YEAR) continue;
  } else if (YEAR_RANGE_FROM != null && YEAR_RANGE_TO != null) {
    if (postYear < YEAR_RANGE_FROM || postYear > YEAR_RANGE_TO) continue;
  } else if (!MIGRATE_ALL && !PREVIEW_TITLE) {
    console.error("Use --all, --year, --from/--to, or --preview <title>");
    process.exit(1);
  } else if (MIGRATE_ALL || PREVIEW_TITLE) {
    if (postYear < YEAR_MIN || postYear > YEAR_MAX) continue;
  }

  matched.push(item);
}

matched.sort((a, b) =>
  getText(a["wp:post_date"]).localeCompare(getText(b["wp:post_date"])),
);

console.log(`Matched ${matched.length} published posts.\n`);

if (matched.length === 0) {
  process.exit(1);
}

if (PREVIEW_TITLE) {
  const post = processPost(matched[0], attachmentMaps);
  console.log(`=== Preview: ${post.title} ===\n`);
  console.log(`${formatFrontmatter(post)}\n\n${post.markdown.slice(0, 5000)}`);
  console.log(
    `\n--- ${post.imageCount} images, ${post.captionCount} captions ---`,
  );
  process.exit(0);
}

if (CLEAR_POSTS) {
  const existing = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  for (const file of existing) {
    fs.unlinkSync(path.join(POSTS_DIR, file));
  }
  console.log(`Cleared ${existing.length} existing posts.\n`);
}

fs.mkdirSync(POSTS_DIR, { recursive: true });

const usedFilenames = new Set();
const stats = {
  written: 0,
  errors: 0,
  imagesCopied: 0,
  totalImages: 0,
  totalCaptions: 0,
  captionsFixed: 0,
  jacksStoryRemoved: 0,
  needsReview: [],
  byYear: {},
};

let sampleBefore = null;
let sampleAfter = null;

function ensureUniqueFilename(filename) {
  if (!usedFilenames.has(filename)) {
    usedFilenames.add(filename);
    return filename;
  }
  const ext = path.extname(filename);
  const base = filename.slice(0, -ext.length);
  let n = 2;
  while (usedFilenames.has(`${base}-${n}${ext}`)) n++;
  const unique = `${base}-${n}${ext}`;
  usedFilenames.add(unique);
  return unique;
}

const total = matched.length;
let index = 0;
let lastProgressYear = null;

for (const item of matched) {
  index++;
  const title = getText(item.title);
  const postYear = parseInt(
    getText(item["wp:post_date"] || item.pubDate).slice(0, 4),
    10,
  );

  if (postYear !== lastProgressYear) {
    if (lastProgressYear !== null) console.log("");
    lastProgressYear = postYear;
    console.log(`Processing ${postYear} posts...`);
  }

  try {
    const post = processPost(item, attachmentMaps);
    post.filename = ensureUniqueFilename(post.filename);
    const outPath = path.join(POSTS_DIR, post.filename);
    fs.writeFileSync(
      outPath,
      `${formatFrontmatter(post)}\n\n${post.markdown}\n`,
      "utf8",
    );

    stats.written++;
    stats.imagesCopied += post.copiedCount;
    stats.totalImages += post.imageCount;
    stats.totalCaptions += post.captionCount;
    if (post.hadCaptionFixed) stats.captionsFixed++;
    if (post.hadPromo) stats.jacksStoryRemoved++;
    stats.byYear[post.year] = (stats.byYear[post.year] || 0) + 1;

    if (
      !sampleAfter &&
      title.includes("Pearl Harbor")
    ) {
      sampleBefore = getText(item["content:encoded"]).slice(0, 800);
      sampleAfter = post.markdown.slice(0, 800);
    }

    if (/\[caption/i.test(post.markdown)) {
      stats.needsReview.push({ title, file: post.filename, reason: "raw caption shortcode" });
    }

    console.log(
      `Processing ${postYear} posts... ${index} of ${total} complete — ${title.slice(0, 48)}${title.length > 48 ? "…" : ""} (${post.imageCount} imgs, ${post.captionCount} captions)`,
    );
  } catch (err) {
    stats.errors++;
    console.error(
      `Processing ${postYear} posts... ${index} of ${total} complete — ERROR: ${title}`,
    );
    console.error(`         ${err.message}`);
  }
}

console.log("\n========== Migration Summary ==========");
console.log(`Posts written:           ${stats.written}`);
console.log(`Errors:                  ${stats.errors}`);
console.log(`Images in posts:         ${stats.totalImages}`);
console.log(`Captions preserved:      ${stats.totalCaptions}`);
console.log(`Posts with captions fixed: ${stats.captionsFixed}`);
console.log(`Posts w/ promo removed:  ${stats.jacksStoryRemoved}`);
console.log(`New image files:         ${stats.imagesCopied}`);
console.log("Posts by year:");
for (const year of Object.keys(stats.byYear).sort()) {
  console.log(`  ${year}: ${stats.byYear[year]}`);
}
if (stats.needsReview.length > 0) {
  console.log(`\nNeeds manual review (${stats.needsReview.length}):`);
  for (const r of stats.needsReview.slice(0, 15)) {
    console.log(`  - ${r.file}: ${r.reason}`);
  }
  if (stats.needsReview.length > 15) {
    console.log(`  ... and ${stats.needsReview.length - 15} more`);
  }
}
if (sampleBefore && sampleAfter) {
  console.log("\n--- Sample before/after: Pearl Harbor post ---");
  console.log("BEFORE (raw HTML excerpt):");
  console.log(sampleBefore);
  console.log("\nAFTER (markdown excerpt):");
  console.log(sampleAfter);
}
console.log("========================================\nDone.");
