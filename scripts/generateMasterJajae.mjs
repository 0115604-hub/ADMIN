import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/jajae_detailed_analysis.json', 'utf8'));

// Clean and categorize all 142 items into the 9 user-approved groups
const normalizeGroup = (item) => {
  const cat = item.mainCategory.toUpperCase();
  const name = item.partName.toUpperCase();
  const sup = (item.supplier || '').toUpperCase();

  if (cat.includes('TPE') || name.includes('TPE')) return { name: 'TPE 원재료 / 부품', color: '#3B82F6', icon: 'Box' };
  if (cat.includes('EPDM') || name.includes('EPDM')) return { name: 'EPDM 원료 / 상품', color: '#10B981', icon: 'Layers' };
  if (cat.includes('9BQC') || name.includes('9BQC')) return { name: '9BQC 전용 부품', color: '#8B5CF6', icon: 'Car' };
  if (cat.includes('포장') || name.includes('포장') || sup.includes('광진포장')) return { name: '포장 부자재', color: '#EC4899', icon: 'Package' };
  if (cat.includes('PVC') || name.includes('PVC')) return { name: 'PVC 압출 자재', color: '#06B6D4', icon: 'Cpu' };
  if (cat.includes('심금') || cat.includes('WIRE') || name.includes('심금') || name.includes('WIRE')) return { name: '심금류 / WIRE 철심', color: '#F59E0B', icon: 'Disc' };
  if (cat.includes('케미칼') || sup.includes('화승케미칼') || name.includes('HSP')) return { name: '화승케미칼 특수원료', color: '#EF4444', icon: 'FlaskConical' };
  if (cat.includes('부자재') || cat.includes('부 자 재')) return { name: '일반 부자재', color: '#EAB308', icon: 'Wrench' };

  return { name: '기타 차종 자재', color: '#64748B', icon: 'Folder' };
};

const groups = {};

raw.allDetailedItems.forEach(item => {
  const grpInfo = normalizeGroup(item);
  if (!groups[grpInfo.name]) {
    groups[grpInfo.name] = {
      groupName: grpInfo.name,
      color: grpInfo.color,
      itemCount: 0,
      totalAmount: 0,
      suppliers: new Set(),
      items: []
    };
  }
  groups[grpInfo.name].itemCount += 1;
  groups[grpInfo.name].totalAmount += item.amount;
  if (item.supplier && item.supplier !== '-') groups[grpInfo.name].suppliers.add(item.supplier);
  groups[grpInfo.name].items.push(item);
});

const totalAmount = Object.values(groups).reduce((a, b) => a + b.totalAmount, 0);

const groupList = Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount).map((g, idx) => ({
  rank: idx + 1,
  groupName: g.groupName,
  color: g.color,
  itemCount: g.itemCount,
  totalAmount: g.totalAmount,
  share: Number(((g.totalAmount / totalAmount) * 100).toFixed(2)),
  mainSuppliers: Array.from(g.suppliers).slice(0, 4).join(', ') || '자체/미지정',
  items: g.items.sort((a, b) => b.amount - a.amount)
}));

const fileContent = `// Master Material Purchasing Data (자재매입 시트 2번 품목군별 상세 분석)
// Total Amount: ₩${totalAmount.toLocaleString()} | Total Items: ${raw.allDetailedItems.length}

export const MASTER_JAJAE_SUMMARY = {
  yearMonth: "2026-07",
  totalAmount: ${totalAmount},
  itemCount: ${raw.allDetailedItems.length},
  groupCount: ${groupList.length}
};

export const MASTER_JAJAE_GROUPS = ${JSON.stringify(groupList, null, 2)};
`;

fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/src/data/masterJajaeData.js', fileContent, 'utf8');
console.log('Saved src/data/masterJajaeData.js successfully.');
