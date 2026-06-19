#!/usr/bin/env node
/**
 * Remove legacy WordPress johnandjanice.com URL markup from posts.
 * - Bare (https://johnandjanice.com/...) parentheses
 * - [![](img)](wp-url) → ![img]
 * - [text](wp-url) → text
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, "..", "content/posts");

const WP_HOST =
  /https?:\/\/johnandjanice\.co(?:m)?(?:\/[^\s)"'<>]*)?/gi;
const WP_PATH = "(?:\\/[^\\s)\"']*)?";
const WP_HOST_IN_PATTERN = "johnandjanice\\.co(?:m)?";

/** Count johnandjanice.com URL references in text. */
function countUrls(text) {
  return (text.match(WP_HOST) || []).length;
}

function cleanContent(text) {
  let removed = 0;
  const before = countUrls(text);

  let out = text;

  // [![](alt)](/images/x.jpg)](https://johnandjanice.com/...) → ![alt](/images/x.jpg)
  out = out.replace(
    new RegExp(
      `\\[(!\\[[^\\]]*\\]\\([^)]+\\))\\]\\(https?:\\/\\/${WP_HOST_IN_PATTERN}\\/[^)]+\\)`,
      "gi",
    ),
    "$1",
  );

  // [text](https://johnandjanice.com/...) → text
  out = out.replace(
    new RegExp(
      `\\[([^\\]]+)\\]\\(https?:\\/\\/${WP_HOST_IN_PATTERN}\\/[^)]+\\)`,
      "gi",
    ),
    "$1",
  );

  // Orphan link closings from broken migration: ](https://johnandjanice.com/...)
  out = out.replace(
    new RegExp(`\\]\\(https?:\\/\\/${WP_HOST_IN_PATTERN}\\/[^)]+\\)`, "gi"),
    "",
  );

  // Bare (https://johnandjanice.com/...) — closing paren optional (truncated excerpts)
  out = out.replace(
    new RegExp(
      `\\(https?:\\/\\/${WP_HOST_IN_PATTERN}${WP_PATH}(?:\\s+"[^"]*")?\\)?`,
      "gi",
    ),
    "",
  );

  // Word glued to URL: Ridge(https://johnandjanice.com/... "title")
  out = out.replace(
    new RegExp(
      `(?<=\\S)\\(https?:\\/\\/${WP_HOST_IN_PATTERN}${WP_PATH}(?:\\s+"[^"]*")?\\)?`,
      "gi",
    ),
    "",
  );

  // Orphan https://johnandjanice.com/... without leading "(" (excerpt fragments)
  out = out.replace(
    new RegExp(
      `(?<![(\\[])https?:\\/\\/${WP_HOST_IN_PATTERN}${WP_PATH}(?:\\s+"[^"]*")?\\)?`,
      "gi",
    ),
    "",
  );

  // Leftover WP link title after removed URL: .../slug/ "post title")
  out = out.replace(
    /(?<=johnandjanice\.co(?:m)?)\S*\s+\\?"[^"\\]*(?:\\.[^"\\]*)*\\?"\)/gi,
    "",
  );

  // Heading with linked image only: # [![](...)...](url) → image on its own line
  out = out.replace(
    new RegExp(
      `^#{1,6}\\s*\\[(!\\[[^\\]]*\\]\\([^)]+\\))\\]\\(https?:\\/\\/${WP_HOST_IN_PATTERN}\\/[^)]+\\)\\s*$`,
      "gim",
    ),
    "$1\n",
  );

  // Collapse extra blank lines
  out = out.replace(/\n{3,}/g, "\n\n");

  removed = before - countUrls(out);
  return { out, removed };
}

function cleanExcerptField(frontmatter) {
  return frontmatter.replace(/^excerpt:\s*(.+)$/m, (line, value) => {
    let excerpt = value.trim();
    if (
      (excerpt.startsWith('"') && excerpt.endsWith('"')) ||
      (excerpt.startsWith("'") && excerpt.endsWith("'"))
    ) {
      const q = excerpt[0];
      excerpt = excerpt.slice(1, -1);
      const { out } = cleanContent(excerpt);
      return `excerpt: ${q}${out}${q}`;
    }
    const { out } = cleanContent(excerpt);
    return `excerpt: ${out}`;
  });
}

// --- Main ---
const files = fs
  .readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();

let totalRemoved = 0;
let postsChanged = 0;
let sampleBefore = null;
let sampleAfter = null;

console.log(`Removing WordPress URL markup from ${files.length} posts...\n`);

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const filePath = path.join(POSTS_DIR, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const fmMatch = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (!fmMatch) continue;

  let frontmatter = fmMatch[0];
  const body = raw.slice(frontmatter.length).replace(/^\s+/, "");

  const bodyResult = cleanContent(body);
  const newFm = cleanExcerptField(frontmatter);
  const fmRemoved = countUrls(frontmatter) - countUrls(newFm);
  const removed = bodyResult.removed + fmRemoved;

  if (removed > 0 || bodyResult.out !== body || newFm !== frontmatter) {
    postsChanged++;
    totalRemoved += removed;

    if (!sampleBefore && file.includes("iowa-now-and-in-2018")) {
      sampleBefore = raw.slice(0, 1200);
      sampleAfter = `${newFm}${bodyResult.out}`.slice(0, 1200);
    }

    fs.writeFileSync(
      filePath,
      `${newFm}${bodyResult.out}\n`,
      "utf8",
    );
  }

  console.log(
    `Processing ${i + 1} of ${files.length}... ${file}${removed > 0 ? ` (${removed} URLs removed)` : ""}`,
  );
}

console.log("\n========== URL Cleanup Summary ==========");
console.log(`Posts processed:  ${files.length}`);
console.log(`Posts changed:    ${postsChanged}`);
console.log(`URLs removed:     ${totalRemoved}`);
if (sampleBefore && sampleAfter) {
  console.log("\n--- Sample before/after: Iowa post (excerpt + opening) ---");
  console.log("BEFORE:");
  console.log(sampleBefore);
  console.log("\nAFTER:");
  console.log(sampleAfter);
}
console.log("==========================================\nDone.");
