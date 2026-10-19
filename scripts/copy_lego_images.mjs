import fs from 'fs';
import path from 'path';

const srcDir = 'C:/Users/k0115/.gemini/antigravity/brain/686dc741-649d-49fc-9c6e-019ddbee3fb5/scratch/extracted_media';
const dstDir1 = 'C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/public/lego_images';
const dstDir2 = 'C:/Users/k0115/.gemini/antigravity/brain/686dc741-649d-49fc-9c6e-019ddbee3fb5/lego_images';

if (!fs.existsSync(dstDir1)) fs.mkdirSync(dstDir1, { recursive: true });
if (!fs.existsSync(dstDir2)) fs.mkdirSync(dstDir2, { recursive: true });

const files = fs.readdirSync(srcDir);
files.forEach(f => {
  const src = path.join(srcDir, f);
  fs.copyFileSync(src, path.join(dstDir1, f));
  fs.copyFileSync(src, path.join(dstDir2, f));
  console.log(`Copied ${f}`);
});
console.log('Finished copying all lego images.');
