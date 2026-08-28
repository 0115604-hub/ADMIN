import fs from "fs";
import * as XLSX from "xlsx";
import path from "path";

const files = [
  "C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\매입전자세금계산서목록(1~80).xls",
  "C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\매입전자세금계산서목록(1~39).xls"
];

for (const file of files) {
  const buf = fs.readFileSync(file);
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log(`\n=== File: ${path.basename(file)} ===`);
  console.log("Header row 6:", data[5]);
  console.log("Sample row 7:", data[6]);
  
  // Extract all unique suppliers and items
  const vendors = new Set();
  for (let r = 6; r < data.length; r++) {
    const row = data[r];
    if (row && row[6]) { // Col 7 is 상호 (Vendor)
      const vendorName = String(row[6]).trim();
      const item = row[11] || row[12] || row[10] || ""; // Check item column
      const supplyAmt = row[14] || row[15] || row[13] || 0;
      vendors.add(`${vendorName}`);
    }
  }
  console.log(`Unique Vendors count: ${vendors.size}`);
  console.log("Sample vendors:", Array.from(vendors).slice(0, 15));
}
