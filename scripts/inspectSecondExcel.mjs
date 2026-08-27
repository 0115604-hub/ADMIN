import * as XLSXModule from 'xlsx';
import fs from 'fs';

const XLSX = XLSXModule.default || XLSXModule;
const filePath = 'C:/Users/k0115/OneDrive/바탕 화면/2026.07 매입매출 내역서.xlsx';
try {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  console.log('=== 2026.07 매입매출 내역서.xlsx Sheets ===');
  console.log(wb.SheetNames);
  
  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    console.log(`Sheet [${sheetName}]: ${rows.length} rows`);
    console.log('Sample rows:', rows.slice(0, 5));
  });
} catch(e) {
  console.log('Error reading file:', e.message);
}
