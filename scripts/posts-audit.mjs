// Simplified audit inventory of all posts in content/posts/.
// Run: node scripts/posts-audit.mjs
// Output: posts-audit.xlsx at the project root.
// Purpose: a focused view for editorial review and planning the cleanup work.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTS_DIR = path.resolve(__dirname, '..', 'content', 'posts');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'posts-audit.xlsx');

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
}

function computeStatus(hasDateline, hasPlaces) {
  if (hasDateline && hasPlaces) return 'Cleaned';
  if (hasDateline || hasPlaces) return 'Partial';
  return 'Raw';
}

const rows = [];

const files = fs
  .readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
  .sort();

for (const file of files) {
  const filePath = path.join(POSTS_DIR, file);
  let raw, parsed;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
    parsed = matter(raw);
  } catch (err) {
    console.warn(`Skip ${file}: ${err.message}`);
    continue;
  }

  const { data, content } = parsed;
  const places = asArray(data.places);
  const hasDateline = Boolean(data.dateline);
  const hasPlaces = places.length > 0;

  rows.push({
    Date: data.date || '',
    Status: computeStatus(hasDateline, hasPlaces),
    Title: data.title || '',
    Destination: data.destination || '',
    Series: data.series || '',
    'Word Count': countWords(content),
    Notes: '',
  });
}

// Sort chronologically by publish date ascending (oldest first).
rows.sort((a, b) => String(a.Date).localeCompare(String(b.Date)));

const ws = XLSX.utils.json_to_sheet(rows);

// Column widths sized for readable scanning
ws['!cols'] = [
  { wch: 12 }, // Date
  { wch: 10 }, // Status
  { wch: 60 }, // Title
  { wch: 22 }, // Destination
  { wch: 26 }, // Series
  { wch: 11 }, // Word Count
  { wch: 40 }, // Notes
];

// Freeze the header row and add filter dropdowns on every column
ws['!views'] = [{ state: 'frozen', ySplit: 1 }];
ws['!autofilter'] = { ref: ws['!ref'] };

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Posts Audit');

XLSX.writeFile(wb, OUTPUT_PATH);

// Summary printout: tells you the shape of the work at a glance
const cleaned = rows.filter((r) => r.Status === 'Cleaned').length;
const partial = rows.filter((r) => r.Status === 'Partial').length;
const raw = rows.filter((r) => r.Status === 'Raw').length;
const totalWordCount = rows.reduce((sum, r) => sum + r['Word Count'], 0);
const stubs = rows.filter((r) => r['Word Count'] < 200).length;

console.log(`\nWrote ${rows.length} posts to ${OUTPUT_PATH}\n`);
console.log(`Audit summary:`);
console.log(`  Total posts:    ${rows.length}`);
console.log(`  Cleaned:        ${cleaned}  (dateline + places both set)`);
console.log(`  Partial:        ${partial}  (one but not both set)`);
console.log(`  Raw:            ${raw}  (neither set — full WP import, not touched)`);
console.log(`  Possible stubs: ${stubs}  (word count under 200)`);
console.log(`  Total words:    ${totalWordCount.toLocaleString()}`);
