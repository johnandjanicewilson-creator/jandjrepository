/**
 * One-off: add dateline: YYYY-MM-DD to posts whose titles start with "Dateline".
 * Run: node scripts/add-dateline-frontmatter.mjs
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

const MONTHS = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

function parseMonth(name) {
  if (!name) return null;
  return MONTHS[name.toLowerCase().replace(/\./g, "")] ?? null;
}

function toIso(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function publishYear(publishDate) {
  const match = String(publishDate).match(/^(\d{4})/);
  return match ? Number.parseInt(match[1], 10) : new Date().getUTCFullYear();
}

function tryBuild(year, month, day) {
  if (!month || !day || !year) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = toIso(year, month, day);
  const check = new Date(`${iso}T00:00:00Z`);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() + 1 !== month ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return iso;
}

/**
 * @param {string} title
 * @param {string} publishDate
 * @returns {string | null}
 */
export function extractDatelineFromTitle(title, publishDate) {
  const trimmed = title.trim();
  if (!/^dateline\b/i.test(trimmed)) return null;

  let rest = trimmed.replace(/^dateline\s*[:.\-–—]?\s*/i, "");
  const py = publishYear(publishDate);

  const attempts = [];

  // Month YYYY at start (October 2011, February 2015-Melbourne)
  attempts.push(() => {
    const m = rest.match(/^([A-Za-z]+)\s+(\d{4})\b/);
    if (!m) return null;
    const month = parseMonth(m[1]);
    const year = Number.parseInt(m[2], 10);
    return tryBuild(year, month, 1);
  });

  // Month YYYY at end (RTJ Trail - May 2012)
  attempts.push(() => {
    const m = rest.match(/[-–—]\s*([A-Za-z]+)\s+(\d{4})\s*$/i);
    if (!m) return null;
    const month = parseMonth(m[1]);
    const year = Number.parseInt(m[2], 10);
    return tryBuild(year, month, 1);
  });

  // Month day-day-year (March 22-26-2026)
  attempts.push(() => {
    const m = rest.match(
      /^([A-Za-z]+)\s+(\d{1,2})\s*[-–—]\s*\d{1,2}\s*[-–—]?\s*(\d{4})\b/i,
    );
    if (!m) return null;
    return tryBuild(Number.parseInt(m[3], 10), parseMonth(m[1]), Number.parseInt(m[2], 10));
  });

  // Month day, day, year OR month day, year (December 11, 14, 2017 / July 15, 2011)
  attempts.push(() => {
    const m = rest.match(
      /^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*,\s*(?:(\d{1,2})\s*,\s*)?(\d{4})\b/i,
    );
    if (!m) return null;
    const year = Number.parseInt(m[3] ?? m[4], 10);
    const yearFromM3 = m[3] && m[3].length === 4 ? Number.parseInt(m[3], 10) : null;
    const yearFinal = m[4] ? Number.parseInt(m[4], 10) : yearFromM3;
    return tryBuild(yearFinal, parseMonth(m[1]), Number.parseInt(m[2], 10));
  });

  // Optional weekday + month day, year (Monday April 2, The 2012...)
  attempts.push(() => {
    const m = rest.match(
      /^(?:[A-Za-z]+\s+)?([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*,\s*(?:(\d{1,2})\s*,\s*)?(\d{4})\b/i,
    );
    if (!m) return null;
    const year = m[4] ? Number.parseInt(m[4], 10) : null;
    return tryBuild(year, parseMonth(m[1]), Number.parseInt(m[2], 10));
  });

  // Month day year without comma (February 8 2018, July 1 2013)
  attempts.push(() => {
    const m = rest.match(/^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})\b/i);
    if (!m) return null;
    return tryBuild(Number.parseInt(m[3], 10), parseMonth(m[1]), Number.parseInt(m[2], 10));
  });

  // Glued typo: January 292015
  attempts.push(() => {
    const m = rest.match(/^([A-Za-z]+)\s+(\d{1,2})(\d{4})\b/i);
    if (!m) return null;
    return tryBuild(Number.parseInt(m[3], 10), parseMonth(m[1]), Number.parseInt(m[2], 10));
  });

  // Embedded ", Month day, year" (Willamette Valley Oregon, March 25, 2011)
  attempts.push(() => {
    const m = rest.match(/,\s*([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*,\s*(\d{4})\b/i);
    if (!m) return null;
    return tryBuild(Number.parseInt(m[3], 10), parseMonth(m[1]), Number.parseInt(m[2], 10));
  });

  // Weekday + month day, title (Monday April 2, The 2012 Masters...)
  attempts.push(() => {
    const m = rest.match(
      /^(?:[A-Za-z]+\s+)?([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*,\s*(?!(?:\d{1,2}\s*,\s*)?\d{4}\b)/i,
    );
    if (!m) return null;
    const yearInTitle = rest.match(/\b(20\d{2})\b/);
    const year = yearInTitle ? Number.parseInt(yearInTitle[1], 10) : py;
    return tryBuild(year, parseMonth(m[1]), Number.parseInt(m[2], 10));
  });

  // Month day without year (May 23 -, July 4th,, July 1 Canada)
  attempts.push(() => {
    const m = rest.match(/^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
    if (!m) return null;
    return tryBuild(py, parseMonth(m[1]), Number.parseInt(m[2], 10));
  });

  for (const attempt of attempts) {
    const iso = attempt();
    if (iso) return iso;
  }

  return null;
}

function insertDatelineAfterDate(fileContents, dateline) {
  if (/^dateline:\s/m.test(fileContents)) {
    return fileContents.replace(/^dateline:\s.*$/m, `dateline: "${dateline}"`);
  }
  return fileContents.replace(/^(date:\s*.+)$/m, `$1\ndateline: "${dateline}"`);
}

const files = fs
  .readdirSync(POSTS_DIR)
  .filter((f) => /\.mdx?$/.test(f));

let updated = 0;
let skippedHasDateline = 0;
const unparsed = [];

for (const filename of files) {
  const filePath = path.join(POSTS_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data } = matter(raw);
  const title = data.title;
  if (!title || !/^dateline\b/i.test(String(title).trim())) continue;

  const iso = extractDatelineFromTitle(String(title), String(data.date ?? ""));
  if (!iso) {
    unparsed.push({ filename, title });
    continue;
  }

  if (data.dateline === iso) {
    skippedHasDateline++;
    continue;
  }

  const next = insertDatelineAfterDate(raw, iso);
  fs.writeFileSync(filePath, next);
  updated++;
}

console.log(JSON.stringify({ updated, skippedHasDateline, unparsedCount: unparsed.length, unparsed }, null, 2));
