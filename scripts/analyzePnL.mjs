import * as XLSXModule from 'xlsx';
import fs from 'fs';

const XLSX = XLSXModule.default || XLSXModule;
const filePath = 'C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/2026-07월매입매출현황_원본.xlsx';
const buf = fs.readFileSync(filePath);
const workbook = XLSX.read(buf, { type: 'buffer' });

// 1. Analyze '매입-매출 정리본'
const pnlSheet = workbook.Sheets['매입-매출 정리본'];
const pnlRows = XLSX.utils.sheet_to_json(pnlSheet, { header: 1, defval: '' });

// 2. Analyze '매출세금계산서 '
const salesSheet = workbook.Sheets['매출세금계산서 '];
const salesRows = XLSX.utils.sheet_to_json(salesSheet, { header: 1, defval: '' });

const result = {
  pnlSummarySheet: pnlRows.slice(0, 40),
  salesTaxInvoices: salesRows.slice(0, 30)
};

fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/pnl_structure_analysis.json', JSON.stringify(result, null, 2), 'utf8');
console.log('Saved pnl_structure_analysis.json');
