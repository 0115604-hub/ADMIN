import * as XLSXModule from 'xlsx';
import fs from 'fs';

const XLSX = XLSXModule.default || XLSXModule;
const filePath = 'C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/2026-07월매입매출현황_원본.xlsx';
const buf = fs.readFileSync(filePath);
const workbook = XLSX.read(buf, { type: 'buffer' });

const summary = {};

workbook.SheetNames.forEach((sheetName) => {
  const ws = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  summary[sheetName] = {
    rowCount: rows.length,
    headerSample: rows.slice(0, 10)
  };
});

fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/sheet_summary_detail.json', JSON.stringify(summary, null, 2), 'utf8');
console.log('Saved sheet_summary_detail.json');
