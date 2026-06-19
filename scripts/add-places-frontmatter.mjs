// One-time backfill: adds a `places: [...]` array to the Walkabout Canada-Alaska posts.
// Reads each .md file in content/posts, looks up its places by slug, writes them back.
// Idempotent: posts not in the mapping are left untouched.

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTS_DIR = path.resolve(__dirname, '..', 'content', 'posts');

const PLACES_BY_SLUG = {
  '2011-03-01-before-the-first-mile': [],
  '2011-06-14-dateline-june-13-2011-valdez-to-whittier-to-seward-to-homer': [
    'valdez', 'whittier', 'seward', 'homer',
  ],
  '2011-06-19-dateline-june-18-2011-homer-to-soldotna-and-diamond-m': [
    'homer', 'soldotna', 'diamond-m-ranch',
  ],
  '2011-07-04-dateline-june-27-2011-anchorage-to-denali': [
    'anchorage', 'hatcher-pass', 'independence-mine', 'talkeetna', 'denali-national-park',
  ],
  '2011-07-06-dateline-july-1-2011-denali-national-park': [
    'denali-national-park',
  ],
  '2011-07-15-dateline-july-4th-fairbanks-alaska': [
    'fairbanks', 'north-star-golf', 'silver-gulch', 'aurora-ice-museum',
  ],
  '2011-07-17-dateline-july-7-2011-leaving-alaska-chicken-and-top-of-the-world-highway': [
    'tok', 'chicken-alaska', 'top-of-the-world-highway',
  ],
  '2011-07-18-dateline-july-13-2011-yukon-dawson-city-and-whitehorse': [
    'dawson-city', 'whitehorse',
  ],
  '2011-07-24-dateline-july-15-2011-our-safari-whitehorse-to-dawson-creek': [
    'whitehorse', 'liard-hot-springs', 'dawson-creek',
  ],
  '2011-07-30-dateline-july-19-2011-the-end-of-walkabout-canada-alask-the-canadian-rockies-jasper-lake-louise-and-banff': [
    'grande-prairie', 'jasper', 'jasper-national-park', 'maligne-canyon',
    'maligne-lake', 'icefields-parkway', 'columbia-icefield', 'athabasca-glacier',
    'bow-glacier', 'lake-louise', 'banff', 'banff-national-park',
    'fairmont-banff-springs', 'crowfoot-glacier',
  ],
};

let updated = 0;
let skipped = 0;

for (const [slug, places] of Object.entries(PLACES_BY_SLUG)) {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    console.warn(`Skip (file not found): ${slug}`);
    skipped++;
    continue;
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(raw);
  parsed.data.places = places;
  const updatedRaw = matter.stringify(parsed.content, parsed.data);
  fs.writeFileSync(filePath, updatedRaw);
  console.log(`Updated: ${slug} (${places.length} places)`);
  updated++;
}

console.log(`\nDone. Updated ${updated} posts, skipped ${skipped}.`);
