import fs from 'fs';

const rawReport = JSON.parse(fs.readFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/final_sales_analysis.json', 'utf8'));
const allItems = rawReport.allItems;

// Function to normalize vehicle names into clean master vehicle groups
const getVehicleGroup = (item) => {
  const v = item.vehicle.toUpperCase().trim();
  const name = item.partName.toUpperCase();

  if (v.includes('PCM') || item.process.includes('PCM')) return 'PCM 압출/가공';
  if (v.startsWith('9BQC')) return '9BQC';
  if (v.startsWith('DT')) return 'DT (수출)';
  if (v.startsWith('DS')) return 'DS (수출)';
  if (v.startsWith('NX4') || name.includes('NX4')) return 'NX4 (내수/수출)';
  if (v.startsWith('JA') || name.includes('JA')) return 'JA';
  if (v.startsWith('PU') || name.includes('PU')) return 'PU';
  if (v.startsWith('NE1') || v.startsWith('8NE1') || v.startsWith('ME1') || v.startsWith('1ME1')) return 'NE1 / ME1 (수출/내수)';
  if (v.startsWith('OV1') || name.includes('OV1')) return 'OV1k';
  if (v.startsWith('HR') || name.includes('HR')) return 'HR';
  if (v.startsWith('JK') || name.includes('JK')) return 'JK 1 (내수/임가공)';
  if (v.startsWith('VT') || name.includes('VT')) return 'VT';
  if (v.startsWith('GV') || name.includes('GV')) return 'GV';
  if (v.startsWith('QZ') || name.includes('QZ')) return 'QZ';
  if (v.startsWith('CE1') || name.includes('CE1')) return 'CE1';
  if (v.startsWith('P417') || name.includes('P417')) return 'P417';
  if (v.startsWith('FS') || name.includes('FS')) return 'FS';
  if (v.startsWith('BL7') || v.startsWith('BL')) return 'BL / BL7m';
  if (v.startsWith('TY') || name.includes('TY')) return 'TY';
  if (v.startsWith('EG') || name.includes('EG')) return 'EG';
  if (v.startsWith('M2JO') || v.startsWith('M200') || v.startsWith('M300')) return 'GM (M2JO / M200 / M300)';
  if (v.startsWith('PD') || name.includes('PD')) return 'PD';
  if (v.startsWith('HI') || v.startsWith('VI')) return 'HI / VI (EPDM)';

  return v || '기타 차종';
};

const grouped = {};

allItems.forEach(item => {
  const group = getVehicleGroup(item);
  if (!grouped[group]) {
    grouped[group] = {
      vehicleGroup: group,
      itemCount: 0,
      totalQty: 0,
      totalAmount: 0,
      details: []
    };
  }
  grouped[group].itemCount += 1;
  grouped[group].totalQty += item.qty;
  grouped[group].totalAmount += item.amount;
  grouped[group].details.push(item);
});

const list = Object.values(grouped).sort((a, b) => b.totalAmount - a.totalAmount);
const grandTotal = list.reduce((a, b) => a + b.totalAmount, 0);

list.forEach((g, idx) => {
  g.rank = idx + 1;
  g.share = Number(((g.totalAmount / grandTotal) * 100).toFixed(2));
});

console.log(`Grand Total Grouped: ₩${grandTotal.toLocaleString()} (Matches 2,873,777,826: ${grandTotal === 2873777826})`);
fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/sales_by_vehicle_grouped.json', JSON.stringify(list, null, 2), 'utf8');
