import fs from 'fs';

const rows = JSON.parse(fs.readFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/pnl_master_sheet.json', 'utf8'));

// Filter non-empty rows and display them cleanly
const meaningfulRows = [];
rows.forEach((r, idx) => {
  const text = r.filter(c => c !== '').join(' | ');
  if (text.trim()) {
    meaningfulRows.push({ rowIdx: idx + 1, content: text });
  }
});

fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/pnl_master_cleaned.txt', meaningfulRows.map(m => `Line ${m.rowIdx}: ${m.content}`).join('\n'), 'utf8');
console.log(`Saved ${meaningfulRows.length} meaningful rows in pnl_master_cleaned.txt`);
