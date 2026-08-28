import fs from "fs";
import * as XLSX from "xlsx";

const filepath = "C:\\Users\\k0115\\OneDrive\\바탕 화면\\2026.07 매입매출 내역서.xlsx";
const buf = fs.readFileSync(filepath);
const workbook = XLSX.read(buf, { type: "buffer" });
const ws = workbook.Sheets['결산'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

console.log("Parsing row-by-row itemized closing data...");

// Let's inspect the entire sheet line by line to extract every single item under each category
const categories = [];
let currentCategory = null;
let currentItems = [];

// Helper to clean numbers
const parseNum = (v) => {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  const cleaned = String(v).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

for (let r = 0; r < data.length; r++) {
  const row = data[r];
  if (!row || row.length === 0) continue;
  const rowStr = row.join(" ");

  // Identify category headers or subtotal rows
  // Let's dump all non-empty rows with row number to verify boundaries
}
