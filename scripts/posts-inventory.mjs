// Builds an XLSX inventory of all posts in content/posts/.
// Run: node scripts/posts-inventory.mjs
// Output: posts-inventory.xlsx at the project root.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTS_DIR = path.resolve(__dirname, '..', 'content', 'posts');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'posts-inventory.xlsx');

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countImages(text) {
  // Counts markdown image syntax: ![alt](src)
  const matches = text.match(/!\[[^\]]*\]\([^)]+\)/g);
  return matches ? matches.length : 0;
}

function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
}

function truncate(text, max = 200) {
  if (!text) return '';
  const clean = String(text).replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean;
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
  const slug = file.replace(/\.mdx?$/, '');
  const categories = asArray(data.categories);
  const tags = asArray(data.tags);
  const places = asArray(data.places);

  rows.push({
    Date: data.date || '',
    Year: data.year || '',
    Dateline: data.dateline || '',
    Series: data.series || '',
    Destination: data.destination || '',
    Region: data.region || '',
    Title: data.title || '',
    Slug: slug,
    Categories: categories.join(', '),
    Tags: tags.join(', '),
    Places: places.join(', '),
    'Word Count': countWords(content),
    'Image Count': countImages(content),
    'Has Dateline': data.dateline ? 'TRUE' : 'FALSE',
    'Has Places': places.length > 0 ? 'TRUE' : 'FALSE',
    Draft: data.draft ? 'TRUE' : 'FALSE',
    Format: file.endsWith('.mdx') ? 'mdx' : 'md',
    'Featured Image': data.featuredImage || data.featured_image || '',
    Excerpt: truncate(data.excerpt, 200),
  });
}

// Sort chronologically by publish date ascending (oldest first, walks the trip in order).
rows.sort((a, b) => String(a.Date).localeCompare(String(b.Date)));

const ws = XLSX.utils.json_to_sheet(rows);

// Column widths sized to typical content
ws['!cols'] = [
  { wch: 12 }, // Date
  { wch: 6 },  // Year
  { wch: 12 }, // Dateline
  { wch: 22 }, // Series
  { wch: 18 }, // Destination
  { wch: 16 }, // Region
  { wch: 50 }, // Title
  { wch: 60 }, // Slug
  { wch: 30 }, // Categories
  { wch: 30 }, // Tags
  { wch: 30 }, // Places
  { wch: 11 }, // Word Count
  { wch: 11 }, // Image Count
  { wch: 12 }, // Has Dateline
  { wch: 12 }, // Has Places
  { wch: 8 },  // Draft
  { wch: 8 },  // Format
  { wch: 40 }, // Featured Image
  { wch: 60 }, // Excerpt
];

// Freeze the header row + add filter dropdowns
ws['!views'] = [{ state: 'frozen', ySplit: 1 }];
ws['!autofilter'] = { ref: ws['!ref'] };

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'All Posts');

XLSX.writeFile(wb, OUTPUT_PATH);

// Summary to terminal
const destinations = [...new Set(rows.map((r) => r.Destination).filter(Boolean))];
const years = [...new Set(rows.map((r) => r.Year).filter(Boolean))];
const series = [...new Set(rows.map((r) => r.Series).filter(Boolean))];

console.log(`\nWrote ${rows.length} posts to ${OUTPUT_PATH}\n`);
console.log(`Summary:`);
console.log(`  Total posts: ${rows.length}`);
console.log(`  With dateline: ${rows.filter((r) => r['Has Dateline'] === 'TRUE').length}`);
console.log(`  With places: ${rows.filter((r) => r['Has Places'] === 'TRUE').length}`);
console.log(`  Destinations (${destinations.length}): ${destinations.sort().join(', ')}`);
console.log(`  Years (${years.length}): ${years.sort().join(', ')}`);
console.log(`  Series (${series.length}): ${series.sort().join(', ') || '(none yet)'}`);
