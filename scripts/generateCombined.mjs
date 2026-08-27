import fs from 'fs';
import * as XLSXModule from 'xlsx';

const XLSX = XLSXModule.default || XLSXModule;
const filePath = 'C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/2026-07월매입매출현황_원본.xlsx';
const buf = fs.readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer' });

const transactions = [];
let autoId = 1;

// 1. Sales (매출) from '매출세금계산서 '
const salesWs = wb.Sheets['매출세금계산서 '];
if (salesWs) {
  const rows = XLSX.utils.sheet_to_json(salesWs, { header: 1, defval: '' });
  let headerFound = false;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const allText = row.join(' ');
    if (allText.includes('업체명') && allText.includes('공급가액')) {
      headerFound = true;
      continue;
    }
    if (!headerFound) continue;

    if (allText.includes('소계') || allText.includes('합계') || allText.includes('총계')) continue;

    const subCat = String(row[1] || '').trim();
    const rawDate = row[2];
    const client = String(row[3] || '').trim();
    const title = String(row[4] || '').trim();
    const supplyPrice = Number(String(row[5] || '').replace(/,/g, ''));
    const memo = String(row[9] || '').trim();

    if (client && !isNaN(supplyPrice) && supplyPrice > 0) {
      let dateStr = '2026-07-31';
      if (typeof rawDate === 'number' && rawDate > 30000) {
        const d = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
        dateStr = d.toISOString().split('T')[0];
      }

      transactions.push({
        id: `sales_202607_${String(autoId++).padStart(3, '0')}`,
        type: 'revenue',
        category: subCat ? `매출 (${subCat})` : '제품 매출',
        title: title || `${client} 매출 세금계산서 발행`,
        amount: Math.round(supplyPrice),
        date: dateStr,
        client: client,
        paymentMethod: '세금계산서',
        status: '완료',
        memo: memo ? `[매출] ${memo}` : '2026-07 매출 세금계산서 발행분'
      });
    }
  }
}

// 2. Purchasing (125 items from parsed purchasing JSON)
const purchaseList = JSON.parse(fs.readFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/src/data/purchasing202607.json', 'utf8'));
purchaseList.forEach(p => {
  transactions.push({
    ...p,
    id: `exp_202607_${String(autoId++).padStart(3, '0')}`
  });
});

console.log(`Total Combined: ${transactions.length} transactions`);
const revSum = transactions.filter(t => t.type === 'revenue').reduce((a, b) => a + b.amount, 0);
const expSum = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
console.log(`Total Revenue: ₩${revSum.toLocaleString()} (${transactions.filter(t => t.type === 'revenue').length}건)`);
console.log(`Total Expense: ₩${expSum.toLocaleString()} (${transactions.filter(t => t.type === 'expense').length}건)`);

fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/src/data/combined202607.json', JSON.stringify(transactions, null, 2), 'utf8');
