import fs from "fs";
import * as XLSX from "xlsx";

const filepath = "C:\\Users\\k0115\\OneDrive\\바탕 화면\\2026.07 매입매출 내역서.xlsx";
const buf = fs.readFileSync(filepath);
const workbook = XLSX.read(buf, { type: "buffer" });

const sheetName = workbook.SheetNames.find(s => s.includes("결산")) || workbook.SheetNames[0];
const ws = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

console.log(`=== FULL BREAKDOWN OF [${sheetName}] SHEET ===`);

let currentCategory = "";

for (let r = 0; r < data.length; r++) {
  const row = data[r];
  if (!row || row.length === 0) continue;
  
  // Format cells
  const formatted = row.map(v => {
    if (typeof v === 'number') {
      return (v % 1 === 0) ? v.toLocaleString() : v.toFixed(2);
    }
    return v !== undefined && v !== null ? String(v).trim() : "";
  });

  const nonEmpty = formatted.filter(v => v !== "");
  if (nonEmpty.length === 0) continue;

  console.log(`Row ${r+1}: | ${formatted.slice(0, 12).join(" | ")} |`);
}
