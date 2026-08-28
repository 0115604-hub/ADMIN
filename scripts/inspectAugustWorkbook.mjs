import * as XLSXModule from 'xlsx';
import fs from 'fs';

const XLSX = XLSXModule.default || XLSXModule;
const filePath = 'C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/2026-08매입매출현황_원본.xlsx';

const buf = fs.readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer' });

console.log('=== 2026-08매입매출현황 SHEETS ===');
console.log(wb.SheetNames);

const info = wb.SheetNames.map(name => {
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  return {
    sheetName: name,
    rowCount: rows.length,
    colCount: rows[0] ? rows[0].length : 0
  };
});

console.log(JSON.stringify(info, null, 2));
