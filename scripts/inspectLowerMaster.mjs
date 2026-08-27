import fs from 'fs';

const rows = JSON.parse(fs.readFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/pnl_master_sheet.json', 'utf8'));

const meaningfulRows = [];
rows.forEach((r, idx) => {
  const text = r.filter(c => c !== '').join(' | ');
  if (text.trim()) {
    meaningfulRows.push({ rowIdx: idx + 1, content: text });
  }
});

console.log('Total meaningful rows:', meaningfulRows.length);
meaningfulRows.slice(160, 260).forEach(m => {
  console.log(`Line ${m.rowIdx}: ${m.content}`);
});
