#!/usr/bin/env node
/**
 * Migrate posts from WordPress XML export to Markdown.
 * Usage:
 *   node scripts/migrate-wp-test-posts.mjs           # 4 test posts only
 *   node scripts/migrate-wp-test-posts.mjs --all        # all posts 2011-2026
 *   node scripts/migrate-wp-test-posts.mjs --year 2011  # single year
 *   node scripts/migrate-wp-test-posts.mjs --from 2012 --to 2026
 *   node scripts/migrate-wp-test-posts.mjs --preview-only
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { XMLParser } from "fast-xml-parser";
import TurndownService from "turndown";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const XML_PATH = path.join(
  ROOT,
  "Wordpress Backup/johnandjanice-wordpress-export.xml",
);
const UPLOADS_ROOT = path.join(
  ROOT,
  "Wordpress Backup/wordpress-backup-uploads",
);
const POSTS_DIR = path.join(ROOT, "content/posts");
const IMAGES_ROOT = path.join(ROOT, "public/images");

const TARGET_TITLES = [
  "Dateline October 2011, A Look Back At Our Spectacular Adventure",
  "Dateline: February 11, 2015 – New Zealand – Good Bye and Thanks",
  "John's Story",
  "Dateline March 22-26, 2026: Bermuda",
];

const PREVIEW_ONLY = process.argv.includes("--preview-only");
const MIGRATE_ALL = process.argv.includes("--all");
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

function normalizeTitle(title) {
  return title
    .replace(/\u00a0/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const NORMALIZED_TARGETS = new Set(
  TARGET_TITLES.map((t) => normalizeTitle(t)),
);

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
    .replace(/<div class="wp-block[^"]*"[^>]*>/gi, "<div>")
    .replace(/<\/div>\s*(?=<p|<h|<ul|<ol|<figure|<img)/gi, "</div>")
    .replace(/class="wp-block[^"]*"/gi, "")
    .replace(/class="has-[^"]*"/gi, "");
}

function convertCaptions(html) {
  return html.replace(
    /\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/gi,
    (_, inner) => {
      const imgMatch = inner.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
      const altMatch = inner.match(/alt=["']([^"']*)["']/i);
      const captionText = inner
        .replace(/<a[\s\S]*?<\/a>/gi, "")
        .replace(/<img[^>]*>/gi, "")
        .replace(/<[^>]+>/g, "")
        .trim();

      if (!imgMatch) return inner;

      const src = imgMatch[1];
      const alt = altMatch?.[1] || captionText || "Image";
      return `<figure><img src="${src}" alt="${alt.replace(/"/g, "&quot;")}" /><figcaption>${captionText}</figcaption></figure>`;
    },
  );
}

function preprocessHtml(html, isGutenberg) {
  let result = html;
  if (isGutenberg) {
    result = stripGutenberg(result);
  }
  result = convertCaptions(result);
  result = result
    .replace(/<span[^>]*>/gi, "")
    .replace(/<\/span>/gi, "")
    .replace(/&nbsp;/g, " ");
  return result;
}

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});

turndown.addRule("figure", {
  filter: "figure",
  replacement: (_content, node) => {
    const img = node.querySelector("img");
    const cap = node.querySelector("figcaption");
    if (!img) return "";
    const src = img.getAttribute("src") || "";
    const alt = img.getAttribute("alt") || cap?.textContent?.trim() || "";
    const caption = cap?.textContent?.trim();
    let md = `![${alt}](${src})`;
    if (caption && caption !== alt) {
      md += `\n\n*${caption}*`;
    }
    return `\n\n${md}\n\n`;
  },
});

function htmlToMarkdown(html, isGutenberg) {
  const cleaned = preprocessHtml(html, isGutenberg);
  return turndown.turndown(cleaned).replace(/\n{3,}/g, "\n\n").trim();
}

function decodeContentUrls(content) {
  return content.replace(/\\u002d/gi, "-").replace(/&#0*45;/g, "-");
}

function extractImageUrls(content) {
  const decoded = decodeContentUrls(content);
  const urls = new Set();
  const patterns = [
    /https?:\/\/johnandjanice\.com\/wp-content\/uploads\/[^\s"'<>]+/gi,
    /https?:\/\/travelswithjohnandjanice\.files\.wordpress\.com\/[^\s"'<>]+/gi,
  ];
  for (const pattern of patterns) {
    const matches = decoded.match(pattern) || [];
    for (let url of matches) {
      url = url.split(/[?#]/)[0];
      urls.add(url);
    }
  }
  return [...urls];
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

/** WordPress resized filenames: photo-150x150.jpg, image-1024x768.png */
function getOriginalBasename(filename) {
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);
  const original = name.replace(/-\d+x\d+$/, "").replace(/-+$/, "");
  return `${original}${ext}`;
}

function isResizedVariant(filename) {
  return /-\d+x\d+\.[^.]+$/i.test(filename);
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
    if (!srcFile) {
      console.warn(`  Missing image: ${parsed.rel}`);
      continue;
    }

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

    const requestedBase = path.basename(parsed.rel);
    mapping.set(requestedBase, publicPath);
    mapping.set(getOriginalBasename(requestedBase), publicPath);
  }

  return mapping;
}

function normalizeMarkdownImagePaths(markdown) {
  return markdown
    .replace(/(\/images\/\d{4}\/)([^)\s"']+)/g, (match, prefix, filename) => {
      const original = getOriginalBasename(filename);
      return `${prefix}${original}`;
    })
    .replace(/(\/images\/[^)\s"']+)\?[^)\s"']*/g, "$1");
}

function rewriteImageUrls(markdown, mapping, contentHtml) {
  let result = markdown;
  const allUrls = extractImageUrls(contentHtml);

  for (const url of allUrls) {
    const parsed = urlToRelativePath(url);
    if (!parsed) continue;
    const basename = path.basename(parsed.rel.split("?")[0]);
    const originalBase = getOriginalBasename(basename);
    const publicPath =
      mapping.get(url) ||
      mapping.get(basename) ||
      mapping.get(originalBase) ||
      `/images/${parsed.year}/${originalBase}`;

    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escaped, "g"), publicPath);
    for (const variant of [basename, originalBase]) {
      result = result.replace(
        new RegExp(variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        path.basename(publicPath),
      );
    }
  }

  return normalizeMarkdownImagePaths(result);
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

function buildAttachmentMap(items) {
  const map = new Map();
  for (const item of items) {
    if (getText(item["wp:post_type"]) !== "attachment") continue;
    const id = getText(item["wp:post_id"]);
    const url = getText(
      item["wp:attachment_url"] || item.guid?.["#text"] || item.guid,
    );
    if (id && url) map.set(String(id), url);
  }
  return map;
}

function getFeaturedImage(item, attachments) {
  const metas = ensureArray(item["wp:postmeta"]);
  const thumb = metas.find(
    (m) => getText(m["wp:meta_key"]) === "_thumbnail_id",
  );
  if (thumb) {
    const url = attachments.get(getText(thumb["wp:meta_value"]));
    if (url) return url;
  }

  const og = metas.find((m) => getText(m["wp:meta_key"]) === "_b2s_post_meta");
  const ogVal = getText(og?.["wp:meta_value"]);
  if (ogVal.includes("og_image")) {
    const match = ogVal.match(/og_image";s:\d+:"([^"]+)"/);
    if (match) return match[1];
  }

  return null;
}

function makeExcerpt(markdown, html) {
  const metas = [];
  const text = markdown
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/[#>*_\[\]]/g, "")
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
    t.includes("hanging church") ||
    categories.some((c) => /egypt|cairo|middle east/i.test(String(c)))
  )
    return "Egypt";
  return String(categories.find((c) => !/^\d{4}/.test(String(c))) || categories[0] || "Travel");
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

function formatFrontmatter(data) {
  const lines = ["---"];
  lines.push(`title: "${data.title.replace(/"/g, '\\"')}"`);
  lines.push(`date: "${data.date}"`);
  lines.push(`excerpt: "${data.excerpt.replace(/"/g, '\\"')}"`);
  lines.push(`destination: "${data.destination}"`);
  lines.push(`region: "${data.region}"`);
  lines.push(`year: ${data.year}`);
  lines.push("categories:");
  for (const c of data.categories)
    lines.push(`  - "${String(c).replace(/"/g, '\\"')}"`);
  lines.push("tags:");
  for (const t of data.tags)
    lines.push(`  - "${String(t).replace(/"/g, '\\"')}"`);
  lines.push(`featuredImage: "${data.featuredImage}"`);
  lines.push(`featured_image: "${data.featuredImage}"`);
  if (data.featuredImageAlt)
    lines.push(`featuredImageAlt: "${data.featuredImageAlt.replace(/"/g, '\\"')}"`);
  lines.push("---");
  return lines.join("\n");
}

function isGutenberg(content) {
  return content.includes("<!-- wp:");
}

function processPost(item, attachments) {
  const title = getText(item.title);
  const content = decodeContentUrls(getText(item["content:encoded"]));
  const postDate = getText(item["wp:post_date"] || item.pubDate).slice(0, 10);
  const categories = getCategories(item);
  const tags = getTags(item);
  const gutenberg = isGutenberg(content);

  let markdown = htmlToMarkdown(content, gutenberg);
  const imageUrls = extractImageUrls(content);
  const copiedLog = [];
  const mapping = copyImages(imageUrls, copiedLog);
  markdown = rewriteImageUrls(markdown, mapping, content);

  let featuredUrl = getFeaturedImage(item, attachments);
  if (featuredUrl) {
    const parsed = urlToRelativePath(featuredUrl);
    if (parsed) {
      copyImages([featuredUrl], copiedLog);
      const original = getOriginalBasename(path.basename(parsed.rel));
      featuredUrl =
        mapping.get(featuredUrl) ||
        mapping.get(original) ||
        `/images/${parsed.year}/${original}`;
    }
  } else if (imageUrls.length > 0) {
    const first = imageUrls[0];
    const parsed = urlToRelativePath(first);
    const original = parsed
      ? getOriginalBasename(path.basename(parsed.rel))
      : null;
    featuredUrl =
      mapping.get(first) ||
      (parsed && original ? `/images/${parsed.year}/${original}` : first);
  }

  const year = parseInt(postDate.slice(0, 4), 10);
  const destination = inferDestination(title, categories);
  const wpSlug = getText(item["wp:post_name"]) || slugify(title);
  const filename = `${postDate}-${wpSlug}.md`;

  const post = {
    title: title.replace(/\s+/g, " ").trim(),
    date: postDate,
    excerpt: makeExcerpt(markdown, content),
    destination,
    region: inferRegion(destination),
    year,
    categories: categories.length ? categories : ["Travel"],
    tags: tags.length ? tags : [destination.toLowerCase().replace(/\s+/g, "-")],
    featuredImage: featuredUrl || "/images/placeholder.jpg",
    featuredImageAlt: title,
    markdown,
    filename,
    imageCount: imageUrls.length,
    copiedCount: copiedLog.length,
  };

  return post;
}

// --- Main ---
console.log("Reading WordPress export...");
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
const attachments = buildAttachmentMap(items);

const matched = [];
for (const item of items) {
  if (getText(item["wp:post_type"]) !== "post") continue;
  if (getText(item["wp:status"]) !== "publish") continue;

  const postDate = getText(item["wp:post_date"] || item.pubDate).slice(0, 10);
  const postYear = parseInt(postDate.slice(0, 4), 10);

  if (FILTER_YEAR) {
    if (postYear !== FILTER_YEAR) continue;
    matched.push(item);
  } else if (YEAR_RANGE_FROM != null && YEAR_RANGE_TO != null) {
    if (postYear < YEAR_RANGE_FROM || postYear > YEAR_RANGE_TO) continue;
    matched.push(item);
  } else if (MIGRATE_ALL) {
    if (postYear < YEAR_MIN || postYear > YEAR_MAX) continue;
    matched.push(item);
  } else {
    const title = getText(item.title);
    if (NORMALIZED_TARGETS.has(normalizeTitle(title))) {
      matched.push(item);
    }
  }
}

if (FILTER_YEAR) {
  console.log(`Found ${matched.length} published posts from ${FILTER_YEAR}.\n`);
} else if (YEAR_RANGE_FROM != null && YEAR_RANGE_TO != null) {
  console.log(
    `Found ${matched.length} published posts (${YEAR_RANGE_FROM}-${YEAR_RANGE_TO}).\n`,
  );
} else if (MIGRATE_ALL) {
  console.log(
    `Found ${matched.length} published posts (${YEAR_MIN}-${YEAR_MAX}).\n`,
  );
} else {
  console.log(`Found ${matched.length} of ${TARGET_TITLES.length} target posts.\n`);
}

if (matched.length === 0) {
  console.error("No posts matched.");
  process.exit(1);
}

matched.sort((a, b) => {
  const da = getText(a["wp:post_date"]);
  const db = getText(b["wp:post_date"]);
  return da.localeCompare(db);
});

if (!MIGRATE_ALL && !FILTER_YEAR && YEAR_RANGE_FROM == null) {
  const results = matched.map((item) => processPost(item, attachments));
  const alaska = results.find((p) => p.year === 2011) || results[0];
  console.log("=== PREVIEW: Alaska 2011 post ===\n");
  const previewContent = `${formatFrontmatter(alaska)}\n\n${alaska.markdown}`;
  console.log(previewContent.slice(0, 4000));
  if (previewContent.length > 4000) {
    console.log(
      `\n... [truncated — full length ${previewContent.length} chars] ...\n`,
    );
  }
  if (PREVIEW_ONLY) {
    console.log(
      `\nImages referenced: ${alaska.imageCount}, copied: ${alaska.copiedCount}`,
    );
    process.exit(0);
  }
}

fs.mkdirSync(POSTS_DIR, { recursive: true });

const usedFilenames = new Set();
const stats = {
  written: 0,
  skipped: 0,
  errors: 0,
  imagesCopied: 0,
  missingImages: 0,
  byYear: {},
};

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

for (const item of matched) {
  index++;
  const title = getText(item.title);
  try {
    const post = processPost(item, attachments);
    post.filename = ensureUniqueFilename(post.filename);
    const outPath = path.join(POSTS_DIR, post.filename);
    const fileContent = `${formatFrontmatter(post)}\n\n${post.markdown}\n`;
    fs.writeFileSync(outPath, fileContent, "utf8");
    stats.written++;
    stats.imagesCopied += post.copiedCount;
    stats.byYear[post.year] = (stats.byYear[post.year] || 0) + 1;
    console.log(
      `[${index}/${total}] ${post.date} — ${title.slice(0, 55)}${title.length > 55 ? "…" : ""}`,
    );
    console.log(
      `         → ${post.filename} (${post.imageCount} imgs, ${post.copiedCount} new copies)`,
    );
  } catch (err) {
    stats.errors++;
    console.error(`[${index}/${total}] ERROR: ${title}`);
    console.error(`         ${err.message}`);
  }
}

console.log("\n========== Migration Summary ==========");
console.log(`Posts written:     ${stats.written}`);
console.log(`Errors:            ${stats.errors}`);
console.log(`Images copied:     ${stats.imagesCopied} (new files only)`);
console.log("Posts by year:");
for (const year of Object.keys(stats.byYear).sort()) {
  console.log(`  ${year}: ${stats.byYear[year]}`);
}
console.log("========================================\nDone.");
