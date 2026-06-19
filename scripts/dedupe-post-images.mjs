#!/usr/bin/env node
/**
 * Remove duplicate images from post markdown (line-safe).
 * Dedupes by file content hash (same bytes = duplicate), with path-key fallback
 * for missing/external images (-scaled, -WxH variants).
 *
 * Usage: node scripts/dedupe-post-images.mjs
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "content/posts");
const PUBLIC_DIR = path.join(ROOT, "public");

const hashCache = new Map();

/** Match WordPress resized (-300x200) and -scaled suffix variants as the same image. */
export function normalizeImageKey(imagePath) {
  const basename = path.basename(imagePath.split(/[?#]/)[0]);
  const ext = path.extname(basename);
  let name = path.basename(basename, ext);
  name = name.replace(/-\d+x\d+$/i, "");
  name = name.replace(/-scaled$/i, "");
  name = name.replace(/-+$/, "");
  return `${name.toLowerCase()}${ext.toLowerCase()}`;
}

function resolvePublicPath(imagePath) {
  const clean = imagePath.split(/[?#]/)[0];
  if (!clean.startsWith("/")) return null;
  return path.join(PUBLIC_DIR, clean.replace(/^\//, ""));
}

function getImageDedupeKey(imagePath) {
  const abs = resolvePublicPath(imagePath);
  if (abs && fs.existsSync(abs)) {
    if (!hashCache.has(abs)) {
      const buf = fs.readFileSync(abs);
      hashCache.set(abs, crypto.createHash("md5").update(buf).digest("hex"));
    }
    return `hash:${hashCache.get(abs)}`;
  }
  return `path:${normalizeImageKey(imagePath)}`;
}

function isCaptionLine(line) {
  return /^\*[^*\n]+\*\s*$/.test(line.trim());
}

function isImageLine(line) {
  return /^!\[[^\]]*\]\([^)]+\)\s*$/.test(line.trim());
}

export function dedupeMarkdownBody(body) {
  const lines = body.split("\n");
  const result = [];
  const kept = new Map();
  let removed = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!isImageLine(line)) {
      result.push(line);
      continue;
    }

    const pathMatch = line.trim().match(/^!\[[^\]]*\]\(([^)]+)\)/);
    const key = getImageDedupeKey(pathMatch[1]);
    let captionLine = null;

    if (i + 1 < lines.length && isCaptionLine(lines[i + 1])) {
      captionLine = lines[i + 1];
      i++;
    }

    if (kept.has(key)) {
      removed++;
      const imageIdx = kept.get(key);
      if (captionLine) {
        const hasCaption =
          imageIdx + 1 < result.length && isCaptionLine(result[imageIdx + 1]);
        if (!hasCaption) {
          result.splice(imageIdx + 1, 0, captionLine);
        }
      }
      continue;
    }

    kept.set(key, result.length);
    result.push(line);
    if (captionLine) result.push(captionLine);
  }

  const cleaned = [];
  for (let i = 0; i < result.length; i++) {
    const line = result[i];

    if (isCaptionLine(line)) {
      let j = cleaned.length - 1;
      while (j >= 0 && cleaned[j].trim() === "") j--;
      if (j >= 0 && isImageLine(cleaned[j])) {
        cleaned.push(line);
      } else {
        removed++;
      }
      continue;
    }

    cleaned.push(line);
  }

  let content = cleaned.join("\n");
  // Collapse runs of 3+ blank lines left after removing duplicate images
  content = content.replace(/\n{3,}/g, "\n\n");

  return {
    content,
    removed,
  };
}

function processPost(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const { content: deduped, removed } = dedupeMarkdownBody(content);

  if (deduped !== content) {
    const out = matter.stringify(deduped, data);
    fs.writeFileSync(filePath, out, "utf8");
  }

  return removed;
}

// --- Main ---
const files = fs
  .readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();

const total = files.length;
let affected = 0;
let totalRemoved = 0;

console.log(`Scanning ${total} posts for duplicate images (content hash)...\n`);

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const filePath = path.join(POSTS_DIR, file);
  const removed = processPost(filePath);

  if (removed > 0) {
    affected++;
    totalRemoved += removed;
    console.log(
      `Scanning post ${i + 1} of ${total}... Removed ${removed} duplicates — ${file}`,
    );
  } else {
    console.log(`Scanning post ${i + 1} of ${total}... Removed 0 duplicates`);
  }
}

console.log("\n========== Dedupe Summary ==========");
console.log(`Posts scanned:            ${total}`);
console.log(`Posts with duplicates:    ${affected}`);
console.log(`Duplicate images removed: ${totalRemoved}`);
console.log("====================================\nDone.");
