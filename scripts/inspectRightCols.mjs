import fs from 'fs';

const rows = JSON.parse(fs.readFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/pnl_master_sheet.json', 'utf8'));

// Inspect right side columns (Col 10 to 30)
console.log('=== RIGHT SIDE COLUMNS OF 매입-매출 정리본 ===');
rows.forEach((r, idx) => {
  const rightCols = r.slice(10).filter(c => c !== '');
  if (rightCols.length > 0) {
    console.log(`Row ${idx + 1}:`, rightCols);
  }
});
