import fs from 'fs';

const rows = JSON.parse(fs.readFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/pnl_master_sheet.json', 'utf8'));

// Inspect rows with positive numbers in any column
const salesRows = [];

rows.forEach((r, idx) => {
  if (idx < 3 || idx > 170) return;
  // find columns with numbers
  const hasItem = r[4] || r[3] || r[2];
  const amtCol = r.find((val, cIdx) => cIdx >= 6 && typeof val === 'number' && val > 1000);
  if (hasItem && amtCol) {
    salesRows.push({
      line: idx + 1,
      c0: r[0],
      c1: r[1],
      c2: r[2],
      c3: r[3],
      c4: r[4],
      c5: r[5],
      c6: r[6],
      c7: r[7],
      c8: r[8],
      c9: r[9],
      c10: r[10]
    });
  }
});

console.log(`Found ${salesRows.length} sales rows.`);
fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/sales_rows_inspected.json', JSON.stringify(salesRows, null, 2), 'utf8');
