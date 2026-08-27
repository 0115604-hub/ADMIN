import fs from 'fs';

const rows = JSON.parse(fs.readFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/jajae_sheet_raw.json', 'utf8'));

// 1. Extract Summary Block (Cols 29-30)
const summaryKategorie = [];
for (let r = 0; r < rows.length; r++) {
  const c29 = String(rows[r][29] || '').trim();
  const c30 = rows[r][30];
  if (c29 && typeof c30 === 'number' && c30 > 0) {
    summaryKategorie.push({
      kategorie: c29,
      amount: c30
    });
  }
}

// 2. Extract Category Sections from Left Detailed Table (Cols 0-11)
let currentMainCategory = '기타자재';
const detailedItems = [];

for (let r = 2; r < rows.length; r++) {
  const row = rows[r];
  const c0 = String(row[0] || '').trim(); // Category header (e.g. 심금류, 원재료, 부자재, 포장재 등)
  const c1 = String(row[1] || '').trim(); // 자재코드
  const c2 = String(row[2] || '').trim(); // 품명 및 규격
  const c3 = String(row[3] || '').trim(); // 단위
  const c4 = String(row[4] || '').trim(); // 차종/용도
  const c5 = String(row[5] || '').trim(); // 구매처
  const unitPrice = Number(String(row[6] || '').replace(/,/g, ''));
  const qty = Number(String(row[7] || '').replace(/,/g, ''));
  const amount = Number(String(row[8] || '').replace(/,/g, ''));
  const monthlyTotal = Number(String(row[9] || '').replace(/,/g, ''));
  const memo = String(row[12] || row[13] || '').trim();

  if (c0 && isNaN(c0) && !c0.includes('순서')) {
    currentMainCategory = c0.replace(/\r?\n/g, ' ').trim();
  }

  if (c2 && !c2.includes('품명') && amount > 0) {
    detailedItems.push({
      mainCategory: currentMainCategory,
      code: c1 || '-',
      partName: c2,
      unit: c3 || 'EA',
      usage: c4 || '-',
      supplier: c5 || '-',
      unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
      qty: isNaN(qty) ? 0 : qty,
      amount: amount,
      monthlyTotal: isNaN(monthlyTotal) ? amount : monthlyTotal,
      memo: memo
    });
  }
}

// Group Detailed Items by Category
const byCategory = {};
detailedItems.forEach(item => {
  if (!byCategory[item.mainCategory]) {
    byCategory[item.mainCategory] = {
      category: item.mainCategory,
      count: 0,
      totalAmount: 0,
      items: []
    };
  }
  byCategory[item.mainCategory].count += 1;
  byCategory[item.mainCategory].totalAmount += item.amount;
  byCategory[item.mainCategory].items.push(item);
});

const categoryList = Object.values(byCategory).sort((a, b) => b.totalAmount - a.totalAmount);
const totalDetailedAmount = categoryList.reduce((a, b) => a + b.totalAmount, 0);

// Group by Supplier (구매처별 집계)
const bySupplier = {};
detailedItems.forEach(item => {
  const sup = item.supplier || '기타/미지정';
  if (!bySupplier[sup]) {
    bySupplier[sup] = {
      supplier: sup,
      count: 0,
      totalAmount: 0
    };
  }
  bySupplier[sup].count += 1;
  bySupplier[sup].totalAmount += item.amount;
});
const supplierList = Object.values(bySupplier).sort((a, b) => b.totalAmount - a.totalAmount);

const result = {
  summaryKategorie,
  totalDetailedAmount,
  itemCount: detailedItems.length,
  categoryList,
  supplierList,
  allDetailedItems: detailedItems
};

fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/jajae_detailed_analysis.json', JSON.stringify(result, null, 2), 'utf8');
console.log(`Parsed ${detailedItems.length} active purchase items.`);
console.log(`Total Detailed Amount: ₩${totalDetailedAmount.toLocaleString()}`);
console.log('Category Summary:', categoryList.map(c => `${c.category}: ₩${c.totalAmount.toLocaleString()} (${c.count}건)`));
