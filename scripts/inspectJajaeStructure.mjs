import fs from 'fs';

const rows = JSON.parse(fs.readFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/jajae_sheet_raw.json', 'utf8'));

console.log('=== ROW SAMPLES FROM 자재매입 ===');
for (let i = 0; i < Math.min(rows.length, 25); i++) {
  const meaningful = rows[i].map((c, idx) => c !== '' ? `[Col ${idx}]: ${c}` : '').filter(Boolean).join(' | ');
  if (meaningful) {
    console.log(`Row ${i + 1}: ${meaningful}`);
  }
}
