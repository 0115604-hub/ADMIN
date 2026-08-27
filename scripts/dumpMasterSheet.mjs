import * as XLSXModule from 'xlsx';
import fs from 'fs';

const XLSX = XLSXModule.default || XLSXModule;
const filePath = 'C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/2026-07월매입매출현황_원본.xlsx';
const buf = fs.readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer' });

const ws = wb.Sheets['매입-매출 정리본'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log(`'매입-매출 정리본' total rows: ${rows.length}`);
fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/pnl_master_sheet.json', JSON.stringify(rows, null, 2), 'utf8');
console.log('Saved pnl_master_sheet.json');
