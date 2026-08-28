import * as XLSXModule from 'xlsx';
import fs from 'fs';

const XLSX = XLSXModule.default || XLSXModule;
const filePath = 'C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/2026-08매입매출현황_원본.xlsx';

const buf = fs.readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer' });

// 1. Inspect '매입-매출 정리본' for August
const wsMaster = wb.Sheets['매입-매출 정리본'];
const rowsMaster = XLSX.utils.sheet_to_json(wsMaster, { header: 1, defval: '' });

console.log(`August '매입-매출 정리본' rows: ${rowsMaster.length}`);
for (let i = 0; i < Math.min(rowsMaster.length, 30); i++) {
  const line = rowsMaster[i].map((c, idx) => c !== '' ? `[Col ${idx}]: ${c}` : '').filter(Boolean).join(' | ');
  if (line) {
    console.log(`Row ${i + 1}: ${line}`);
  }
}
