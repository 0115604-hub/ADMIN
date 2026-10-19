import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import XLSX from 'xlsx';

const filePath = "C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\레고 양식.xlsx";

async function inspect() {
  console.log("Reading file:", filePath);
  if (!fs.existsSync(filePath)) {
    console.error("File does not exist!");
    return;
  }

  // 1. XLSX (SheetJS)
  const wbXLSX = XLSX.readFile(filePath);
  console.log("XLSX Sheet Names:", wbXLSX.SheetNames);
  for (const sheetName of wbXLSX.SheetNames) {
    const ws = wbXLSX.Sheets[sheetName];
    console.log(`\n=== SHEET (XLSX): ${sheetName} ===`);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const lines = csv.split('\n').filter(l => l.replace(/,/g, '').trim().length > 0);
    console.log(`Non-empty rows count: ${lines.length}`);
    lines.slice(0, 40).forEach((l, idx) => console.log(`[${idx+1}] ${l}`));
  }

  // 2. ExcelJS to check images and drawings
  const wbExcelJS = new ExcelJS.Workbook();
  await wbExcelJS.xlsx.readFile(filePath);
  console.log("\n=== ExcelJS Inspection ===");
  console.log("Media in workbook:", wbExcelJS.model.media ? wbExcelJS.model.media.length : 0);
  if (wbExcelJS.model.media) {
    wbExcelJS.model.media.forEach((m, idx) => {
      console.log(`Media [${idx}]: name=${m.name}, type=${m.type}, extension=${m.extension}, bufferSize=${m.buffer ? m.buffer.length : 0}`);
    });
  }

  wbExcelJS.eachSheet((ws, id) => {
    console.log(`\nWorksheet: ${ws.name} (id: ${id})`);
    const images = ws.getImages();
    console.log(`Images in sheet ${ws.name}: ${images.length}`);
    images.forEach((img, idx) => {
      const media = wbExcelJS.model.media[img.imageId];
      console.log(` - Img [${idx}]: imageId=${img.imageId}, range=${JSON.stringify(img.range)}, mediaName=${media?.name}`);
    });
  });
}

inspect().catch(console.error);
