import * as XLSXModule from 'xlsx';
import fs from 'fs';

const XLSX = XLSXModule.default || XLSXModule;
const filePath = 'C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/2026-07월매입매출현황_원본.xlsx';
const buf = fs.readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer' });

['원자재매입내역', '부자재매입내역', '기타매입내역', '자재매입'].forEach(name => {
  const ws = wb.Sheets[name];
  if (ws) {
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    console.log(`=== SHEET: ${name} (Rows: ${rows.length}) ===`);
    console.log('Row 0:', rows[0]);
    console.log('Row 1:', rows[1]);
    console.log('Row 2:', rows[2]);
    console.log('Row 3:', rows[3]);
    console.log('Row 4:', rows[4]);
  }
});
