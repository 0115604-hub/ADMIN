import * as XLSXModule from 'xlsx';
import fs from 'fs';

const XLSX = XLSXModule.default || XLSXModule;
const filePath = 'C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/2026-07월매입매출현황_원본.xlsx';
const buf = fs.readFileSync(filePath);
const workbook = XLSX.read(buf, { type: 'buffer' });

// Analyze Sales Tax Invoices
const salesSheet = workbook.Sheets['매출세금계산서 '];
const salesRows = XLSX.utils.sheet_to_json(salesSheet, { header: 1, defval: '' });

// Analyze Other Sheets
const sheetDetails = {};
['매출세금계산서 ', '매입-매출 정리본', '원자재매입내역', '부자재매입내역', '기타매입내역'].forEach(s => {
  if (workbook.Sheets[s]) {
    sheetDetails[s] = XLSX.utils.sheet_to_json(workbook.Sheets[s], { header: 1, defval: '' }).slice(0, 35);
  }
});

fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/sheets_overview.json', JSON.stringify(sheetDetails, null, 2), 'utf8');
console.log('Saved sheets_overview.json');
