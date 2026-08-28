import fs from "fs";
import * as XLSX from "xlsx";

const filepath = "C:\\Users\\k0115\\OneDrive\\바탕 화면\\2026-07월매입매출현황의 복사본.xlsx";
const buf = fs.readFileSync(filepath);
const workbook = XLSX.read(buf, { type: "buffer" });

console.log("Sheet names in workbook:", workbook.SheetNames);

const summary = {};

for (const name of workbook.SheetNames) {
  const sheet = workbook.Sheets[name];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  summary[name] = {
    rowCount: data.length,
    sampleRows: data.slice(0, 10)
  };
}

console.log(JSON.stringify({ sheets: workbook.SheetNames }, null, 2));

// Let's inspect '매입-매출 정리본' specifically if it exists
for (const sheetName of workbook.SheetNames) {
  console.log(`\n========================================`);
  console.log(`Sheet: [${sheetName}]`);
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`Total rows: ${rows.length}`);
  for (let r = 0; r < Math.min(25, rows.length); r++) {
    const row = rows[r];
    if (row && row.some(cell => cell !== undefined && cell !== null && cell !== "")) {
      console.log(`Row ${r+1}:`, row.slice(0, 12));
    }
  }
}
