import { v2 as cloudinary } from 'cloudinary';
import { existsSync } from 'node:fs';

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD || !KEY || !SECRET) {
  console.error('Missing credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
  process.exit(1);
}

cloudinary.config({ cloud_name: CLOUD, api_key: KEY, api_secret: SECRET, secure: true });

const file = process.argv[2];
if (!file) {
  console.error('Usage: node cloudinary-upload-one.mjs public/images/your-file.jpg');
  process.exit(1);
}
if (!existsSync(file)) {
  console.error(`Not found on disk: ${file}`);
  process.exit(1);
}

const rel = file.replace(/^\.\//, '').replace(/^public\//, '');
const publicId = rel.replace(/\.[^.]+$/, '');

const res = await cloudinary.uploader.upload(file, {
  public_id: publicId,
  overwrite: true,
  resource_type: 'image',
  use_filename: false,
  unique_filename: false,
});

console.log(`Uploaded ${rel}`);
console.log(`URL: https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto/${res.public_id}.${res.format}`);
