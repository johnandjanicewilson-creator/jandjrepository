#!/usr/bin/env node
/**
 * Scan posts for WordPress [gallery] shortcodes, map image IDs via WP XML export,
 * and write gallery-inventory.xlsx (Instructions + Gallery Inventory sheets).
 *
 * Usage: node scripts/gallery-inventory.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { XMLParser } from "fast-xml-parser";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "content/posts");
const XML_PATH = path.join(
  ROOT,
  "wordpress-backup/johnandjanice-wordpress-export.xml",
);
const OUTPUT_PATH = path.join(ROOT, "gallery-inventory.xlsx");

const GALLERY_RE = /\\?\[gallery\b([^\]]*)\]/gi;

const INSTRUCTIONS_LINES = [
  "Gallery Inventory — Instructions",
  "",
  "What this is:",
  "A list of every blog post that contains WordPress gallery shortcodes, with the",
  "image IDs and (when available) the actual filenames.",
  "",
  "How to use it:",
  '1. Open the "Gallery Inventory" tab.',
  "2. Sort by gallery_count or total_images to prioritize what to tackle first.",
  "3. For each post: look at it, decide which images to keep, fill in Status.",
  '4. Use Notes for anything (e.g., "needs MDX conversion", "post is outdated, skip").',
  "",
  "Suggested Status values:",
  '  - "To Do"        — not started',
  '  - "In Progress"  — actively working on it',
  '  - "Done"         — gallery cleaned up and converted to <Gallery />',
  '  - "Skip"         — retire this post / no fix needed',
  "",
  "IMPORTANT — re-running the script:",
  "If you re-run gallery-inventory.mjs, this file will be OVERWRITTEN.",
  "Save your Status/Notes work in a separate file or sheet first.",
  "",
  "Columns in the Gallery Inventory tab:",
  "  post_file        filename in content/posts/",
  "  post_title       post title from frontmatter",
  "  post_date        publish date (sortable)",
  "  post_format      md or mdx",
  "  gallery_count    number of [gallery] shortcodes in this post",
  "  total_images     total image IDs across all galleries",
  "  gallery_details  per-gallery image counts",
  "  image_ids        WordPress media IDs (comma-separated)",
  "  image_filenames  actual filenames from WP XML; \"[ID X not found]\" if unmapped",
  "  status           YOUR tracking column — fill in as you work",
  "  notes            YOUR free-text notes",
];

const DATA_HEADERS = [
  "post_file",
  "post_title",
  "post_date",
  "post_format",
  "gallery_count",
  "total_images",
  "gallery_details",
  "image_ids",
  "image_filenames",
  "status",
  "notes",
];

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

function filenameFromUrl(url) {
  if (!url) return "";
  try {
    const pathname = new URL(url).pathname;
    const segment = pathname.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(segment);
  } catch {
    const clean = String(url).split("?")[0];
    const segment = clean.split("/").filter(Boolean).pop() || "";
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  }
}

function buildAttachmentIdMap(items) {
  const byId = new Map();

  for (const item of items) {
    if (getText(item["wp:post_type"]) !== "attachment") continue;

    const id = String(getText(item["wp:post_id"])).trim();
    const url = getText(
      item["wp:attachment_url"] || item.guid?.["#text"] || item.guid,
    );
    if (!id || !url) continue;

    byId.set(id, filenameFromUrl(url));
  }

  return byId;
}

function parseGalleryIds(attrs) {
  const match = attrs.match(/\bids=["']([^"']+)["']/i);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function findGalleries(body) {
  const galleries = [];
  GALLERY_RE.lastIndex = 0;
  let match;
  while ((match = GALLERY_RE.exec(body)) !== null) {
    galleries.push(parseGalleryIds(match[1]));
  }
  return galleries;
}

function resolveFilename(id, attachmentById) {
  const filename = attachmentById.get(String(id));
  return filename || `[ID ${id} not found]`;
}

function buildRow(filename, data, galleries, attachmentById) {
  const allIds = galleries.flat();
  const filenames = allIds.map((id) => resolveFilename(id, attachmentById));
  const galleryDetails = galleries
    .map((ids, index) => `Gallery ${index + 1}: ${ids.length} images`)
    .join("; ");

  return {
    post_file: filename,
    post_title: data.title ?? "",
    post_date: data.date ?? "",
    post_format: filename.endsWith(".mdx") ? "mdx" : "md",
    gallery_count: galleries.length,
    total_images: allIds.length,
    gallery_details: galleryDetails,
    image_ids: allIds.join(","),
    image_filenames: filenames.join(","),
    status: "",
    notes: "",
  };
}

function scanPosts(attachmentById) {
  const rows = [];
  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((name) => name.endsWith(".md") || name.endsWith(".mdx"))
    .sort();

  for (const filename of files) {
    const filePath = path.join(POSTS_DIR, filename);
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    const galleries = findGalleries(content);
    if (galleries.length === 0) continue;

    rows.push(buildRow(filename, data, galleries, attachmentById));
  }

  rows.sort((a, b) => {
    const dateCmp = String(a.post_date).localeCompare(String(b.post_date));
    if (dateCmp !== 0) return dateCmp;
    return a.post_file.localeCompare(b.post_file);
  });

  return rows;
}

function writeWorkbook(rows) {
  const wb = XLSX.utils.book_new();

  const instructionsSheet = XLSX.utils.aoa_to_sheet(
    INSTRUCTIONS_LINES.map((line) => [line]),
  );
  instructionsSheet["!cols"] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, instructionsSheet, "Instructions");

  const dataAoA = [
    DATA_HEADERS,
    ...rows.map((row) => DATA_HEADERS.map((key) => row[key] ?? "")),
  ];
  const dataSheet = XLSX.utils.aoa_to_sheet(dataAoA);
  dataSheet["!cols"] = [
    { wch: 52 },
    { wch: 48 },
    { wch: 12 },
    { wch: 11 },
    { wch: 14 },
    { wch: 14 },
    { wch: 36 },
    { wch: 28 },
    { wch: 64 },
    { wch: 14 },
    { wch: 36 },
  ];
  XLSX.utils.book_append_sheet(wb, dataSheet, "Gallery Inventory");

  XLSX.writeFile(wb, OUTPUT_PATH);
}

function main() {
  if (!fs.existsSync(XML_PATH)) {
    console.error(`WordPress XML not found: ${XML_PATH}`);
    process.exit(1);
  }

  console.log("Gallery inventory");
  console.log(`Posts:  ${POSTS_DIR}`);
  console.log(`XML:    ${XML_PATH}`);
  console.log("Reading WordPress export...\n");

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
  const attachmentById = buildAttachmentIdMap(items);

  console.log(`Attachments in XML: ${attachmentById.size}`);

  const rows = scanPosts(attachmentById);
  writeWorkbook(rows);

  console.log(`Posts with galleries: ${rows.length}`);
  console.log(`Output written to: ${OUTPUT_PATH}`);
}

main();
