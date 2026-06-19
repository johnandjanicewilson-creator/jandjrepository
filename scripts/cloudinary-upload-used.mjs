import { v2 as cloudinary } from 'cloudinary';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD || !KEY || !SECRET) {
  console.error('Missing credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
  process.exit(1);
}

cloudinary.config({ cloud_name: CLOUD, api_key: KEY, api_secret: SECRET, secure: true });

const POSTS_DIR = 'content/posts';
const PUBLIC_DIR = 'public';
const LOG_FILE = 'scripts/cloudinary-upload-log.json';
const DRY = process.argv.includes('--dry-run');

// Find every /images/... reference inside the posts.
const refRe = /\/images\/[^\s"'()\[\]]+\.(?:jpg|jpeg|png|gif|webp|avif|svg)/gi;
const used = new Set();
for (const name of await readdir(POSTS_DIR)) {
  if (!/\.mdx?$/.test(name)) continue;
  const text = await readFile(join(POSTS_DIR, name), 'utf8');
  let m;
  while ((m = refRe.exec(text)) !== null) {
    used.add(m[0].replace(/^\//, '')); // e.g. images/2019/foo.jpg
  }
}

const usedList = [...used].sort();
console.log(`Posts reference ${usedList.length} distinct images.`);

let log = {};
if (existsSync(LOG_FILE)) {
  try { log = JSON.parse(await readFile(LOG_FILE, 'utf8')); } catch { log = {}; }
}

const missingList = [];
for (const rel of usedList) {
  if (!existsSync(join(PUBLIC_DIR, rel))) missingList.push(rel);
}

if (DRY) {
  console.log(`Dry run: ${usedList.length} referenced, ${missingList.length} missing on disk, no uploads performed.`);
  if (missingList.length) console.log('Missing on disk:\n' + missingList.join('\n'));
  process.exit(0);
}

let uploaded = 0, skipped = 0, failed = 0;
for (const rel of usedList) {
  const filePath = join(PUBLIC_DIR, rel);
  if (!existsSync(filePath)) continue;
  if (log[rel]) { skipped++; continue; }
  const publicId = rel.replace(/\.[^.]+$/, '');
  try {
    const res = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      overwrite: false,
      resource_type: 'image',
      use_filename: false,
      unique_filename: false,
    });
    log[rel] = `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto/${res.public_id}.${res.format}`;
    uploaded++;
    if (uploaded % 50 === 0) {
      await writeFile(LOG_FILE, JSON.stringify(log, null, 2));
      console.log(`...${uploaded} uploaded`);
    }
  } catch (err) {
    failed++;
    console.error(`FAILED ${rel}: ${err.message}`);
  }
}
await writeFile(LOG_FILE, JSON.stringify(log, null, 2));
console.log(`Done. Uploaded ${uploaded}, skipped ${skipped} already-logged, missing ${missingList.length}, failed ${failed}.`);
if (missingList.length) console.log('Missing on disk (a post points to these but the file is not there):\n' + missingList.join('\n'));
