import * as XLSXModule from 'xlsx';
import fs from 'fs';

const XLSX = XLSXModule.default || XLSXModule;
const filePath = 'C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/2026-07월매입매출현황_원본.xlsx';
const buf = fs.readFileSync(filePath);
const workbook = XLSX.read(buf, { type: 'buffer' });

export const parseCompanyWorkbook = (wb, targetYM = '2026-07') => {
  const transactions = [];
  let autoId = 1;

  // 1. Parse Sales (매출) from '매출세금계산서 ' or '매입-매출 정리본'
  const salesSheet = wb.Sheets['매출세금계산서 '] || wb.Sheets['매출세금계산서'];
  if (salesSheet) {
    const rows = XLSX.utils.sheet_to_json(salesSheet, { header: 1, defval: '' });
    let headerFound = false;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const allText = row.join(' ');
      if (allText.includes('업체명') && allText.includes('공급가액')) {
        headerFound = true;
        continue;
      }
      if (!headerFound) continue;

      // Check summary
      if (allText.includes('소계') || allText.includes('합계') || allText.includes('총계')) continue;

      const subCat = String(row[1] || '').trim();
      const rawDate = row[2];
      const client = String(row[3] || '').trim();
      const title = String(row[4] || '').trim();
      const supplyPrice = Number(String(row[5] || '').replace(/,/g, ''));
      const memo = String(row[9] || '').trim();

      if (client && !isNaN(supplyPrice) && supplyPrice > 0) {
        let dateStr = `${targetYM}-31`;
        if (typeof rawDate === 'number' && rawDate > 30000) {
          const d = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
          dateStr = d.toISOString().split('T')[0];
        }

        transactions.push({
          id: `sales_${targetYM.replace('-', '')}_${String(autoId++).padStart(4, '0')}`,
          type: 'revenue',
          category: subCat ? `매출 (${subCat})` : '제품 매출',
          title: title || `${client} 매출 세금계산서 발행`,
          amount: supplyPrice,
          date: dateStr,
          client: client,
          paymentMethod: '세금계산서',
          status: '완료',
          memo: memo ? `[매출] ${memo}` : '7월 매출 세금계산서 발행분'
        });
      }
    }
  }

  // 2. Parse Purchases & Costs (매입 및 경비)
  const purchaseSheets = ['원자재매입내역', '부자재매입내역', '기타매입내역', '자재매입'];
  
  // If dedicated sheets exist, parse them; otherwise parse '기타매입내역' or all rows
  const KNOWN_EXPENSE_CATEGORIES = [
    '원자재', '부자재', '포장부자재', '포장', '임가공비', '물류비', '운송비', '지급수수료',
    '임대료', '수선비/설비', '수선비', '설비공사', '산폐비', '전력비', '복리후생비', '소모품/공구',
    '소모품', '공구', '노무비', '공과금', '대출이자'
  ];

  const sheetsToScan = workbook.SheetNames.filter(s => 
    s.includes('매입') || s.includes('자재') || s.includes('기타')
  );

  sheetsToScan.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    
    let currentCategory = sheetName.includes('원자재') ? '원자재' : sheetName.includes('부자재') ? '부자재' : '기타매입';
    let headerIdx = -1;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const rowText = row.join(' ');
      if (rowText.includes('매입업체') || rowText.includes('공급가') || rowText.includes('품목')) {
        headerIdx = r;
        break;
      }
    }

    if (headerIdx === -1) headerIdx = 0;

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const c0 = String(row[0] || '').trim();
      const c1 = String(row[1] || '').trim();
      const c2 = String(row[2] || '').trim();
      const client = String(row[3] || '').trim();
      const title = String(row[4] || '').trim();
      const rawSupplyPrice = String(row[5] || '').replace(/,/g, '').trim();
      const rawTotalPrice = String(row[7] || '').replace(/,/g, '').trim();
      const memo = String(row[8] || '').trim();

      // Check category in column 1
      if (c1) {
        const found = KNOWN_EXPENSE_CATEGORIES.find(k => c1.includes(k));
        if (found) currentCategory = found;
      }

      // Skip summary / subtotal rows
      const allText = row.join(' ');
      if (allText.includes('소계') || allText.includes('합계') || allText.includes(' 계') || !client) continue;

      let amount = Number(rawSupplyPrice);
      if (isNaN(amount) || amount === 0) {
        amount = Number(rawTotalPrice);
      }

      if (client && !isNaN(amount) && amount > 0) {
        transactions.push({
          id: `exp_${targetYM.replace('-', '')}_${String(autoId++).padStart(4, '0')}`,
          type: 'expense',
          category: currentCategory,
          title: title || `${currentCategory} 매입`,
          amount: Math.round(amount),
          date: `${targetYM}-31`,
          client: client,
          paymentMethod: '세금계산서',
          status: '완료',
          memo: [c2 ? `[${c2}]` : '', memo].filter(Boolean).join(' ') || `${targetYM} 매입 마감분`
        });
      }
    }
  });

  return transactions;
};

// Test parse
const allData = parseCompanyWorkbook(workbook, '2026-07');
console.log('=== PARSE RESULTS ===');
console.log('Total Transactions:', allData.length);
const revs = allData.filter(t => t.type === 'revenue');
const exps = allData.filter(t => t.type === 'expense');
const revTotal = revs.reduce((a, b) => a + b.amount, 0);
const expTotal = exps.reduce((a, b) => a + b.amount, 0);

console.log(`Revenue (매출): ${revs.length}건, Total: ₩${revTotal.toLocaleString()}`);
console.log(`Expense (매입): ${exps.length}건, Total: ₩${expTotal.toLocaleString()}`);
console.log(`Net Profit (손익): ₩${(revTotal - expTotal).toLocaleString()}`);

fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/src/data/fullDataset202607.json', JSON.stringify(allData, null, 2), 'utf8');
console.log('Saved src/data/fullDataset202607.json');
