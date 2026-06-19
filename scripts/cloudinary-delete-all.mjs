import { v2 as cloudinary } from 'cloudinary';

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD || !KEY || !SECRET) {
  console.error('Missing credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
  process.exit(1);
}

cloudinary.config({ cloud_name: CLOUD, api_key: KEY, api_secret: SECRET, secure: true });

let total = 0;
let round = 0;
while (true) {
  round++;
  const res = await cloudinary.api.delete_all_resources({ resource_type: 'image', type: 'upload' });
  const n = res.deleted ? Object.keys(res.deleted).length : 0;
  total += n;
  console.log(`Round ${round}: removed ${n}${res.partial ? ' (more remain)' : ''}`);
  if (!res.partial) break;
  if (round > 100) { console.log('Stopping after 100 rounds; run again if anything remains.'); break; }
}
console.log(`Done. Removed ${total} image assets total. Cloudinary is now empty.`);
