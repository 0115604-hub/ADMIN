import fs from "fs";
import * as XLSX from "xlsx";
import path from "path";

const antiDir = "C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti";
const files = fs.readdirSync(antiDir);

console.log("=== FILES IN ANTI FOLDER ===");
for (const file of files) {
  const filePath = path.join(antiDir, file);
  console.log(`\n======================================================`);
  console.log(`File: ${file} (Size: ${fs.statSync(filePath).size} bytes)`);
  try {
    const buf = fs.readFileSync(filePath);
    const wb = XLSX.read(buf, { type: "buffer" });
    console.log(`Sheets in ${file}:`, wb.SheetNames);
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      console.log(`--- Sheet [${sheetName}] (${data.length} rows) ---`);
      for (let r = 0; r < Math.min(10, data.length); r++) {
        if (data[r] && data[r].some(c => c !== null && c !== undefined && c !== '')) {
          console.log(`Row ${r+1}:`, data[r].slice(0, 10));
        }
      }
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
}
