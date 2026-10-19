import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

const filePath = "C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\레고 양식.xlsx";
const outDir = "C:\\Users\\k0115\\.gemini\\antigravity\\brain\\686dc741-649d-49fc-9c6e-019ddbee3fb5\\lego_extracted";

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function extract() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  const ws = wb.getWorksheet(1);
  const images = ws.getImages();
  console.log(`Found ${images.length} images on sheet 1`);

  const details = [];

  images.forEach((img, idx) => {
    const media = wb.model.media[img.imageId];
    const fileName = `lego_img_${idx + 1}_${media.name}.${media.extension}`;
    const targetPath = path.join(outDir, fileName);
    fs.writeFileSync(targetPath, media.buffer);

    let rangeInfo = {};
    if (img.range) {
      if (img.range.tl) {
        rangeInfo = {
          fromCol: img.range.tl.col,
          fromRow: img.range.tl.row,
          toCol: img.range.br ? img.range.br.col : null,
          toRow: img.range.br ? img.range.br.row : null,
        };
      } else {
        rangeInfo = img.range;
      }
    }

    details.push({
      index: idx + 1,
      mediaId: img.imageId,
      mediaName: media.name,
      fileName,
      size: media.buffer.length,
      range: rangeInfo
    });
  });

  // Sort by row, then col to see layout order on the sheet!
  details.sort((a, b) => {
    const rA = a.range.fromRow ?? 9999;
    const rB = b.range.fromRow ?? 9999;
    if (rA !== rB) return rA - rB;
    return (a.range.fromCol ?? 9999) - (b.range.fromCol ?? 9999);
  });

  console.log("=== Images in layout order (Top to Bottom, Left to Right) ===");
  details.forEach((d) => {
    console.log(`Pos #${d.index}: fromRow=${d.range.fromRow}, fromCol=${d.range.fromCol}, toRow=${d.range.toRow}, toCol=${d.range.toCol}, file=${d.fileName}, size=${d.size}`);
  });

  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(details, null, 2));
}

extract().catch(console.error);
