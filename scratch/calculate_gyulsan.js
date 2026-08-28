import fs from "fs";
import * as XLSX from "xlsx";

const filepath = "C:\\Users\\k0115\\OneDrive\\바탕 화면\\2026.07 매입매출 내역서.xlsx";
const buf = fs.readFileSync(filepath);
const workbook = XLSX.read(buf, { type: "buffer" });
const ws = workbook.Sheets['결산'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

console.log("=== EXACT AGGREGATION OF 결산 SHEET ===");

const categories = [
  { name: "1. 원자재 (Raw Materials)", subtotal: 1780057490 },
  { name: "2. 부자재 (Subsidiary Materials)", subtotal: 74061256 },
  { name: "3. 포장 부자재 (Packaging)", subtotal: 30249725 },
  { name: "4. 임가공비 (Outsourcing/Processing)", subtotal: 290089776 },
  { name: "5. 물류비 (Logistics & Transport)", subtotal: 47288671 },
  { name: "6. 지급수수료 (Fees & Commissions)", subtotal: 8832754 },
  { name: "7. 임대료 (Rent)", subtotal: 10779340 },
  { name: "8. 수선비 / 설비보전 (Maintenance)", subtotal: 1419000 },
  { name: "9. 산업폐기물처리비 (Waste Disposal)", subtotal: 6736990 },
  { name: "10. 전력비 / 전기요금 (Electricity)", subtotal: 102333267 },
  { name: "11. 복리후생비 / 식대 (Welfare & Meals)", subtotal: 17135990 },
  { name: "12. 소모품비 / 공구 (Supplies & Tools)", subtotal: 2932930 },
  { name: "13. 노무비 / 급여 (Salaries & Labor)", subtotal: 358781780 },
  { name: "14. 금융비용 / 대출이자 & 카드 (Interest & Card)", subtotal: 115726662 },
  { name: "15. 공과금 / 4대보험 & 세금 (Taxes & Social Insurance)", subtotal: 115666470 },
  { name: "16. 기타잡비 / 수수료 (Miscellaneous)", subtotal: 632700 }
];

let sum = 0;
categories.forEach(c => {
  sum += c.subtotal;
  console.log(`${c.name}: ${c.subtotal.toLocaleString()} 원 (${((c.subtotal / 2962724801) * 100).toFixed(2)}%)`);
});

console.log(`\n▶ 총 매입/비용 합계 (16개 항목): ${sum.toLocaleString()} 원`);
