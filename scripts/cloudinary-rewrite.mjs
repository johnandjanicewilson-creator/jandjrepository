import { readdir, readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
if (!CLOUD) { console.error('Set CLOUDINARY_CLOUD_NAME.'); process.exit(1); }

const POSTS_DIR = 'content/posts';
const BACKUP_DIR = 'content/posts-backup';
const DRY_RUN = process.argv.includes('--dry-run');

const BASE = `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto/images/`;

const files = (await readdir(POSTS_DIR)).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
if (!DRY_RUN && !existsSync(BACKUP_DIR)) await mkdir(BACKUP_DIR, { recursive: true });

let filesChanged = 0, total = 0;
for (const f of files) {
  const path = join(POSTS_DIR, f);
  const content = await readFile(path, 'utf8');
  const count = (content.split('](/images/').length - 1) + (content.split('"/images/').length - 1);
  if (count === 0) continue;
  filesChanged++;
  total += count;
  if (DRY_RUN) { console.log(`${f}: ${count}`); continue; }
  await copyFile(path, join(BACKUP_DIR, f));
  const updated = content.split('](/images/').join('](' + BASE).split('"/images/').join('"' + BASE);
  await writeFile(path, updated);
  console.log(`${f}: ${count} updated`);
}

console.log(`${DRY_RUN ? 'DRY RUN. ' : ''}${filesChanged} files, ${total} links ${DRY_RUN ? 'to update' : 'updated'}.${DRY_RUN ? '' : ` Backups in ${BACKUP_DIR}.`}`);
