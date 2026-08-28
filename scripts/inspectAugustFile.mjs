import * as XLSXModule from 'xlsx';
import fs from 'fs';

const XLSX = XLSXModule.default || XLSXModule;
const desktopPath = 'C:/Users/k0115/OneDrive/바탕 화면/2026-08매입매출현황.xlsx';

const buf = fs.readFileSync(desktopPath);
const wb = XLSX.read(buf, { type: 'buffer' });

console.log('=== 2026-08매입매출현황.xlsx SHEET NAMES ===');
console.log(wb.SheetNames);

// Dump sheet list and row counts
const sheetInfo = wb.SheetNames.map(name => {
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  return {
    name,
    rowCount: rows.length
  };
});

console.log(JSON.stringify(sheetInfo, null, 2));

// Save a copy in ADMIN
fs.copyFileSync(desktopPath, 'C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/2026-08매입매출현황_원본.xlsx');
