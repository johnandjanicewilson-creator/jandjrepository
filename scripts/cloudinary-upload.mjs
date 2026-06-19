import { v2 as cloudinary } from 'cloudinary';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { existsSync } from 'node:fs';

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD || !KEY || !SECRET) {
  console.error('Missing credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
  process.exit(1);
}

cloudinary.config({ cloud_name: CLOUD, api_key: KEY, api_secret: SECRET, secure: true });

const PUBLIC_DIR = 'public';
const LOG_FILE = 'scripts/cloudinary-upload-log.json';
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg']);

const subArg = process.argv[2];
const scanRoot = subArg
  ? join(PUBLIC_DIR, subArg.replace(/^public\//, ''))
  : join(PUBLIC_DIR, 'images');

let log = {};
if (existsSync(LOG_FILE)) {
  try { log = JSON.parse(await readFile(LOG_FILE, 'utf8')); } catch { log = {}; }
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let uploaded = 0, skipped = 0, failed = 0;
for await (const file of walk(scanRoot)) {
  if (!IMAGE_EXT.has(extname(file).toLowerCase())) continue;
  const relFromPublic = relative(PUBLIC_DIR, file);
  const publicId = relFromPublic.replace(/\.[^.]+$/, '');
  if (log[relFromPublic]) { skipped++; continue; }
  try {
    const res = await cloudinary.uploader.upload(file, {
      public_id: publicId,
      overwrite: false,
      resource_type: 'image',
      use_filename: false,
      unique_filename: false,
    });
    log[relFromPublic] = `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto/${res.public_id}.${res.format}`;
    uploaded++;
    if (uploaded % 50 === 0) {
      await writeFile(LOG_FILE, JSON.stringify(log, null, 2));
      console.log(`...${uploaded} uploaded`);
    }
  } catch (err) {
    failed++;
    console.error(`FAILED ${relFromPublic}: ${err.message}`);
  }
}

await writeFile(LOG_FILE, JSON.stringify(log, null, 2));
console.log(`Done. Uploaded ${uploaded}, skipped ${skipped} already-logged, failed ${failed}. Map saved to ${LOG_FILE}.`);
