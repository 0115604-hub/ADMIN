import XLSX from "xlsx";
import fs from "fs";

const files = [
  "C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\한울자료\\9BQC 단면 확인 체크시트.xlsx",
  "C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\한울자료\\9BQC 본드작업일보.xlsx",
  "C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\한울자료\\9BQC 완제품체크시트.xlsx",
  "C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\한울자료\\9BQC 작업일보.xlsx",
  "C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\한울자료\\LQ2a 작업일보.xlsx"
];

for (const f of files) {
  console.log("\n========================================================");
  console.log("=== FILE:", f);
  if (!fs.existsSync(f)) {
    console.log("❌ File does not exist!");
    continue;
  }
  const buf = fs.readFileSync(f);
  const wb = XLSX.read(buf, { type: "buffer" });
  console.log("Sheets:", wb.SheetNames);
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
    console.log(`--- Sheet: [${sheetName}] (Total rows: ${data.length}) ---`);
    // Print first 25 rows
    data.slice(0, 30).forEach((row, idx) => {
      if (row && row.some(cell => cell !== undefined && cell !== "")) {
        console.log(`Row ${idx + 1}:`, JSON.stringify(row));
      }
    });
  }
}
