import fs from 'fs';

const rows = JSON.parse(fs.readFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/pnl_master_sheet.json', 'utf8'));

const salesItems = [];
let currentProcess = '내수 상품매출';
let currentVehicle = '9BQC';

// 1. PCM 매출
salesItems.push({
  process: 'PCM 매출',
  vehicle: 'PCM 압출/가공',
  itemCode: 'PCM-07',
  partNumber: 'PCM-TOTAL',
  partName: 'PCM 매출 전체 (압출 및 가공)',
  unitPrice: 0,
  qty: 1,
  amount: 934505308
});

// 2. All items in master sheet
for (let r = 5; r <= 164; r++) {
  const row = rows[r];
  if (!row) continue;

  const c1 = String(row[1] || '').trim();
  const c2 = String(row[2] || '').trim();
  const c3 = String(row[3] || '').trim();
  const c4 = String(row[4] || '').trim();
  const c5 = String(row[5] || '').trim();
  const c6 = row[6]; // unit price
  const c7 = row[7]; // qty
  const c8 = row[8]; // amount

  // Process update
  if (c1 && ['내수상품매출', '임가공', '수출상품매출', '수출', '내수', 'A/S', 'EPDM'].some(p => c1.includes(p))) {
    currentProcess = c1.replace(/\s+/g, ' ');
  }

  // Vehicle update
  if (c2 && !c2.includes('G11') && !c2.includes('F11') && !c2.includes('R11') && !c2.includes('P94') && !c2.includes('Q65') && isNaN(c2)) {
    currentVehicle = c2.trim();
  }

  const unitPrice = Number(String(c6).replace(/,/g, ''));
  const qty = Number(String(c7).replace(/,/g, ''));
  const amount = Number(String(c8).replace(/,/g, ''));

  if (!isNaN(amount) && amount > 0 && c5 && !c5.includes('TOTAL') && !c5.includes('합계')) {
    salesItems.push({
      process: currentProcess,
      vehicle: currentVehicle,
      itemCode: c3 || '-',
      partNumber: c4 || '-',
      partName: c5,
      unitPrice: unitPrice || 0,
      qty: qty || 0,
      amount: Math.round(amount)
    });
  }
}

const grandTotal = salesItems.reduce((a, b) => a + b.amount, 0);
console.log(`Grand Total Sales: ₩${grandTotal.toLocaleString()} (Target: ₩2,873,777,826)`);
console.log(`Exact Match: ${grandTotal === 2873777826}`);

// Add share %
salesItems.forEach(i => {
  i.share = Number(((i.amount / grandTotal) * 100).toFixed(2));
});

// Group by Process
const byProcess = {};
salesItems.forEach(i => {
  if (!byProcess[i.process]) byProcess[i.process] = { process: i.process, count: 0, totalAmount: 0 };
  byProcess[i.process].count += 1;
  byProcess[i.process].totalAmount += i.amount;
});
const processList = Object.values(byProcess).sort((a, b) => b.totalAmount - a.totalAmount);
processList.forEach(p => p.share = Number(((p.totalAmount / grandTotal) * 100).toFixed(2)));

// Group by Vehicle
const byVehicle = {};
salesItems.forEach(i => {
  if (!byVehicle[i.vehicle]) byVehicle[i.vehicle] = { vehicle: i.vehicle, process: i.process, count: 0, totalQty: 0, totalAmount: 0 };
  byVehicle[i.vehicle].count += 1;
  byVehicle[i.vehicle].totalQty += i.qty;
  byVehicle[i.vehicle].totalAmount += i.amount;
});
const vehicleList = Object.values(byVehicle).sort((a, b) => b.totalAmount - a.totalAmount);
vehicleList.forEach(v => v.share = Number(((v.totalAmount / grandTotal) * 100).toFixed(2)));

const report = {
  grandTotal,
  itemCount: salesItems.length,
  byProcess: processList,
  byVehicle: vehicleList,
  allItems: salesItems.sort((a, b) => b.amount - a.amount)
};

fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/final_sales_analysis.json', JSON.stringify(report, null, 2), 'utf8');
