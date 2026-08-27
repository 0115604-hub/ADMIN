import * as XLSXModule from 'xlsx';
import fs from 'fs';

const XLSX = XLSXModule.default || XLSXModule;
const filePath = 'C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/2026-07월매입매출현황_원본.xlsx';
const buf = fs.readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer' });

const ws = wb.Sheets['자재매입'];
if (!ws) {
  console.log('Sheet 자재매입 not found. Available sheets:', wb.SheetNames);
} else {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log(`Sheet '자재매입' total rows: ${rows.length}`);
  
  fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/jajae_sheet_raw.json', JSON.stringify(rows, null, 2), 'utf8');
  console.log('Saved jajae_sheet_raw.json');
}
