import * as XLSXModule from 'xlsx';
import fs from 'fs';

const XLSX = XLSXModule.default || XLSXModule;
const filePath = 'C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/2026-07월매입매출현황_원본.xlsx';
const buf = fs.readFileSync(filePath);
const workbook = XLSX.read(buf, { type: 'buffer' });

console.log('=== WORKBOOK SHEET NAMES ===');
console.log(workbook.SheetNames);

const report = {
  sheets: []
};

workbook.SheetNames.forEach((sheetName) => {
  const ws = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  report.sheets.push({
    name: sheetName,
    rowCount: rows.length,
    sampleRows: rows.slice(0, 20)
  });
});

fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/sheet_analysis.json', JSON.stringify(report, null, 2), 'utf8');
console.log('Analysis saved to sheet_analysis.json');
