import fs from 'fs';
import path from 'path';

const srcDir = "C:\\Users\\k0115\\.gemini\\antigravity\\brain\\686dc741-649d-49fc-9c6e-019ddbee3fb5\\lego_extracted";
const destDir = "C:\\Users\\k0115\\.gemini\\antigravity\\scratch\\ADMIN\\public\\lego_images";

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy all 17 extracted images with standard names: lego_block_1.png to lego_block_17.png
for (let i = 1; i <= 17; i++) {
  const srcFiles = fs.readdirSync(srcDir).filter(f => f.startsWith(`lego_img_${i}_`));
  if (srcFiles.length > 0) {
    const srcFile = path.join(srcDir, srcFiles[0]);
    const destStandard = path.join(destDir, `lego_block_${i}.png`);
    const destCompat = path.join(destDir, `image_${i}_image${i}.png`);
    fs.copyFileSync(srcFile, destStandard);
    fs.copyFileSync(srcFile, destCompat);
    console.log(`Copied #${i}: ${srcFiles[0]} -> lego_block_${i}.png & image_${i}_image${i}.png`);
  }
}

console.log("All 17 images successfully copied to public/lego_images!");
