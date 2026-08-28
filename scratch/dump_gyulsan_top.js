import fs from "fs";
import * as XLSX from "xlsx";

const filepath = "C:\\Users\\k0115\\OneDrive\\바탕 화면\\2026.07 매입매출 내역서.xlsx";
const buf = fs.readFileSync(filepath);
const workbook = XLSX.read(buf, { type: "buffer" });
const ws = workbook.Sheets['결산'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

console.log("=== ROWS 1 to 135 OF 결산 SHEET ===");
for (let r = 0; r < 135; r++) {
  const row = data[r];
  if (!row) continue;
  const formatted = row.map(v => {
    if (typeof v === 'number') {
      return (v % 1 === 0) ? v.toLocaleString() : v.toFixed(2);
    }
    return v !== undefined && v !== null ? String(v).trim() : "";
  });
  if (formatted.some(v => v !== "")) {
    console.log(`Row ${r+1}: | ${formatted.slice(0, 12).join(" | ")} |`);
  }
}
