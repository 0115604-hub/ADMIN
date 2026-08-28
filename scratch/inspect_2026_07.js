import fs from "fs";
import * as XLSX from "xlsx";

const filepath = "C:\\Users\\k0115\\OneDrive\\바탕 화면\\2026-07월매입매출현황의 복사본.xlsx";

try {
  const buf = fs.readFileSync(filepath);
  const workbook = XLSX.read(buf, { type: "buffer" });
  console.log("Sheet names:", workbook.SheetNames);

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n==========================================`);
    console.log(`=== Sheet: ${sheetName} (Rows: ${data.length}) ===`);
    console.log(`==========================================`);
    for (let i = 0; i < Math.min(15, data.length); i++) {
      if (data[i] && data[i].length > 0) {
        console.log(`Row ${i + 1}:`, data[i].slice(0, 15));
      }
    }
  }
} catch (e) {
  console.error("Error reading excel:", e);
}
