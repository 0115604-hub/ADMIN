import fs from "fs";
import * as XLSX from "xlsx";

const filepath = "C:\\Users\\k0115\\OneDrive\\바탕 화면\\2026-07월매입매출현황의 복사본.xlsx";
const buf = fs.readFileSync(filepath);
const workbook = XLSX.read(buf, { type: "buffer" });

console.log("=== COMPREHENSIVE FINANCIAL ANALYSIS: 2026-07월매입매출현황의 복사본.xlsx ===");

// 1. Tax Invoice Summary ('매출세금계산서 ')
const taxWs = workbook.Sheets['매출세금계산서 '];
const taxData = XLSX.utils.sheet_to_json(taxWs, { header: 1 });
console.log("\n1. [매출세금계산서 발행현황]");
taxData.forEach((r, idx) => {
  if (r && r.length > 3 && (r[1] || r[3] || r[4])) {
    const item = r[4] || "";
    const company = r[3] || "";
    const supplyAmt = r[5];
    const taxAmt = r[6];
    const totalAmt = r[7];
    if (typeof supplyAmt === 'number' && supplyAmt > 0) {
      console.log(`- ${r[1] || ' '}: [${company}] ${item} -> 공급가액: ${supplyAmt.toLocaleString()}원 (합계: ${totalAmt?.toLocaleString()}원)`);
    } else if (typeof r[0] === 'string' && r[0].includes('소계') || typeof r[0] === 'string' && r[0].includes('합')) {
      console.log(`★ ${r[0]}: 공급가액 ${r[5]?.toLocaleString()}원 / 세액 ${r[6]?.toLocaleString()}원 / 합계 ${r[7]?.toLocaleString()}원`);
    }
  }
});

// 2. '매입-매출 정리본' Summary
const mmWs = workbook.Sheets['매입-매출 정리본'];
const mmData = XLSX.utils.sheet_to_json(mmWs, { header: 1 });
console.log(`\n2. [매입-매출 정리본] (총 ${mmData.length}행)`);

// Look for header and totals
let totalSales = 0;
let totalPurchases = 0;
let vehicles = [];

for (let i = 0; i < mmData.length; i++) {
  const row = mmData[i];
  if (!row) continue;
  const str = row.join(" ");
  if (str.includes("총") && str.includes("매출") || str.includes("합계") || str.includes("매출액")) {
    console.log(`Row ${i+1}:`, row.filter(v => v !== null && v !== undefined && v !== ''));
  }
}

// 3. '자재매입' Summary
const jaWs = workbook.Sheets['자재매입'];
const jaData = XLSX.utils.sheet_to_json(jaWs, { header: 1 });
console.log(`\n3. [자재매입] (총 ${jaData.length}행)`);
for (let i = 0; i < Math.min(20, jaData.length); i++) {
  const row = jaData[i];
  if (row && row.some(v => v !== null && v !== undefined && v !== '')) {
    console.log(`Row ${i+1}:`, row.slice(0, 10).filter(v => v !== null && v !== undefined));
  }
}
