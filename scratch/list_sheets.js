import fs from "fs";
import * as XLSX from "xlsx";

const filepath = "C:\\Users\\k0115\\OneDrive\\바탕 화면\\2026-07월매입매출현황의 복사본.xlsx";
const buf = fs.readFileSync(filepath);
const workbook = XLSX.read(buf, { type: "buffer" });

console.log("=== All Sheets in '2026-07월매입매출현황의 복사본.xlsx' ===");
workbook.SheetNames.forEach((name, i) => {
  const ws = workbook.Sheets[name];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log(`${i + 1}. [${name}] - Rows: ${data.length}, Cols: ${ws['!ref'] || 'N/A'}`);
});
