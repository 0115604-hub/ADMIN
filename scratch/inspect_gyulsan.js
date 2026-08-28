import fs from "fs";
import * as XLSX from "xlsx";

const candidates = [
  "C:\\Users\\k0115\\OneDrive\\바탕 화면\\2026.07 매입매출 내역서.xlsx",
  "C:\\Users\\k0115\\OneDrive\\문서\\카카오톡 받은 파일\\2026.07 매입매출 내역서.xlsx",
  "C:\\Users\\k0115\\OneDrive\\문서\\카카오톡 받은 파일\\2026.07 매입매출 내역서 (1).xlsx"
];

for (const filepath of candidates) {
  if (fs.existsSync(filepath)) {
    console.log(`\n======================================================`);
    console.log(`Found file: ${filepath}`);
    const buf = fs.readFileSync(filepath);
    const workbook = XLSX.read(buf, { type: "buffer" });
    console.log("Sheet names:", workbook.SheetNames);

    // Look for '결산' sheet
    const targetSheetName = workbook.SheetNames.find(s => s.includes("결산")) || workbook.SheetNames[0];
    console.log(`\nTarget Sheet for Analysis: [${targetSheetName}]`);

    const ws = workbook.Sheets[targetSheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log(`Total rows in [${targetSheetName}]: ${data.length}`);

    for (let r = 0; r < data.length; r++) {
      const row = data[r];
      if (row && row.some(v => v !== undefined && v !== null && v !== "")) {
        console.log(`Row ${r + 1}:`, row.slice(0, 15).map(v => typeof v === 'number' ? (v % 1 === 0 ? v.toLocaleString() : v.toFixed(2)) : v));
      }
    }
    break;
  }
}
