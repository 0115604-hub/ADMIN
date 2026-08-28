import * as XLSXModule from 'xlsx';
import fs from 'fs';

const XLSX = XLSXModule.default || XLSXModule;

// Function to parse a complete monthly workbook (both 07 and 08)
function parseCompleteWorkbook(filePath, targetYearMonth) {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer' });

  // 1. Parse '매입-매출 정리본'
  const wsMaster = wb.Sheets['매입-매출 정리본'];
  const masterRows = XLSX.utils.sheet_to_json(wsMaster, { header: 1, defval: '' });

  let pcmTotal = 0;
  let summaryTotalSales = 0;
  let summaryTotalPurchases = 0;
  const rawSalesItems = [];

  let currentProcess = '내수상품매출';
  let currentVehicle = '';

  for (let r = 4; r < masterRows.length; r++) {
    const row = masterRows[r];
    const c0 = String(row[0] || '').trim();
    const c1 = String(row[1] || '').trim();
    const c2 = String(row[2] || '').trim();
    const itemCode = String(row[3] || '').trim();
    const partNumber = String(row[4] || '').trim();
    const partName = String(row[5] || '').trim();
    const unitPrice = Number(String(row[6] || '').replace(/,/g, ''));
    const qty = Number(String(row[7] || '').replace(/,/g, ''));
    const amount = Number(String(row[8] || '').replace(/,/g, ''));

    // Check summary boxes in row 4-9
    if (r === 4 && row[13]) summaryTotalSales = Number(String(row[13]).replace(/,/g, ''));
    if (r === 8 && row[13]) summaryTotalPurchases = Number(String(row[13]).replace(/,/g, ''));

    if (c2.includes('PCM 매출') || c1.includes('PCM')) {
      currentProcess = 'PCM 매출';
      currentVehicle = 'PCM 압출/가공';
      const pcmAmt = Number(String(row[9] || row[10] || row[8] || '').replace(/,/g, ''));
      if (pcmAmt > 0) {
        pcmTotal = pcmAmt;
        rawSalesItems.push({
          process: 'PCM 매출',
          vehicle: 'PCM 압출/가공',
          itemCode: 'PCM-' + targetYearMonth.split('-')[1],
          partNumber: 'PCM-TOTAL',
          partName: `PCM 매출 전체 (압출 및 가공 ${targetYearMonth.split('-')[1]}월 정산)`,
          unitPrice: pcmAmt,
          qty: 1,
          amount: pcmAmt
        });
      }
    }

    if (c1.includes('매출') || c1.includes('A/S') || c1.includes('EPDM') || c1.includes('임가공')) {
      currentProcess = c1;
    }
    if (c2 && !c2.includes('PCM') && !c2.includes('합계') && !c2.includes('매출')) {
      currentVehicle = c2;
    }

    if (partName && amount > 0 && !partName.includes('합계') && !c3IsHeader(itemCode)) {
      rawSalesItems.push({
        process: currentProcess,
        vehicle: currentVehicle || '기타',
        itemCode: itemCode || '-',
        partNumber: partNumber || '-',
        partName: partName,
        unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
        qty: isNaN(qty) ? 0 : qty,
        amount: amount
      });
    }
  }

  function c3IsHeader(code) {
    return code === '아이템코드' || code === 'TOTAL';
  }

  // Aggregate Sales by Vehicle Group
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
    if (v.startsWith('FS') || name.includes('FS')) return 'FS (A/S)';
    if (v.startsWith('BL7') || v.startsWith('BL')) return 'BL / BL7m';
    if (v.startsWith('TY') || name.includes('TY')) return 'TY';
    if (v.startsWith('EG') || name.includes('EG')) return 'EG';
    if (v.startsWith('M2JO') || v.startsWith('M200') || v.startsWith('M300')) return 'GM (M2JO)';
    if (v.startsWith('PD') || name.includes('PD')) return 'PD';
    if (v.startsWith('HI') || v.startsWith('VI')) return 'HI / VI (EPDM)';

    return v || '기타 차종';
  };

  const vehicleMap = {};
  rawSalesItems.forEach(item => {
    const grp = getVehicleGroup(item);
    if (!vehicleMap[grp]) {
      vehicleMap[grp] = {
        vehicleGroup: grp,
        category: item.process,
        itemCount: 0,
        totalQty: 0,
        totalAmount: 0,
        details: []
      };
    }
    vehicleMap[grp].itemCount += 1;
    vehicleMap[grp].totalQty += item.qty;
    vehicleMap[grp].totalAmount += item.amount;
    vehicleMap[grp].details.push(item);
  });

  const totalCalculatedSales = rawSalesItems.reduce((a, b) => a + b.amount, 0);
  const totalSalesFinal = summaryTotalSales > 0 ? summaryTotalSales : totalCalculatedSales;

  const vehicleList = Object.values(vehicleMap).sort((a, b) => b.totalAmount - a.totalAmount).map((v, idx) => ({
    rank: idx + 1,
    vehicleGroup: v.vehicleGroup,
    category: v.category,
    itemCount: v.itemCount,
    totalQty: v.totalQty,
    totalAmount: v.totalAmount,
    share: Number(((v.totalAmount / totalSalesFinal) * 100).toFixed(2)),
    details: v.details.sort((a, b) => b.amount - a.amount)
  }));

  // 2. Parse '자재매입'
  const wsJajae = wb.Sheets['자재매입'];
  const jajaeRows = wsJajae ? XLSX.utils.sheet_to_json(wsJajae, { header: 1, defval: '' }) : [];
  
  let currentMainCategory = '기타자재';
  const rawJajaeItems = [];

  for (let r = 2; r < jajaeRows.length; r++) {
    const row = jajaeRows[r];
    const c0 = String(row[0] || '').trim();
    const c1 = String(row[1] || '').trim();
    const c2 = String(row[2] || '').trim();
    const c3 = String(row[3] || '').trim();
    const c4 = String(row[4] || '').trim();
    const c5 = String(row[5] || '').trim();
    const unitPrice = Number(String(row[6] || '').replace(/,/g, ''));
    const qty = Number(String(row[7] || '').replace(/,/g, ''));
    const amount = Number(String(row[8] || '').replace(/,/g, ''));
    const memo = String(row[12] || row[13] || '').trim();

    if (c0 && isNaN(c0) && !c0.includes('순서')) {
      currentMainCategory = c0.replace(/\r?\n/g, ' ').trim();
    }

    if (c2 && !c2.includes('품명') && amount > 0) {
      rawJajaeItems.push({
        mainCategory: currentMainCategory,
        code: c1 || '-',
        partName: c2,
        unit: c3 || 'EA',
        usage: c4 || '-',
        supplier: c5 || '-',
        unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
        qty: isNaN(qty) ? 0 : qty,
        amount: amount,
        memo: memo
      });
    }
  }

  const normalizeJajaeGroup = (item) => {
    const cat = item.mainCategory.toUpperCase();
    const name = item.partName.toUpperCase();
    const sup = (item.supplier || '').toUpperCase();

    if (cat.includes('TPE') || name.includes('TPE')) return { name: 'TPE 원재료 / 부품', color: '#3B82F6' };
    if (cat.includes('EPDM') || name.includes('EPDM')) return { name: 'EPDM 원료 / 상품', color: '#10B981' };
    if (cat.includes('9BQC') || name.includes('9BQC')) return { name: '9BQC 전용 부품', color: '#8B5CF6' };
    if (cat.includes('포장') || name.includes('포장') || sup.includes('광진포장')) return { name: '포장 부자재', color: '#EC4899' };
    if (cat.includes('PVC') || name.includes('PVC')) return { name: 'PVC 압출 자재', color: '#06B6D4' };
    if (cat.includes('심금') || cat.includes('WIRE') || name.includes('심금') || name.includes('WIRE')) return { name: '심금류 / WIRE 철심', color: '#F59E0B' };
    if (cat.includes('케미칼') || sup.includes('화승케미칼') || name.includes('HSP')) return { name: '화승케미칼 특수원료', color: '#EF4444' };
    if (cat.includes('부자재') || cat.includes('부 자 재')) return { name: '일반 부자재', color: '#EAB308' };

    return { name: '기타 차종 자재', color: '#64748B' };
  };

  const jajaeGroupMap = {};
  rawJajaeItems.forEach(item => {
    const grpInfo = normalizeJajaeGroup(item);
    if (!jajaeGroupMap[grpInfo.name]) {
      jajaeGroupMap[grpInfo.name] = {
        groupName: grpInfo.name,
        color: grpInfo.color,
        itemCount: 0,
        totalAmount: 0,
        suppliers: new Set(),
        items: []
      };
    }
    jajaeGroupMap[grpInfo.name].itemCount += 1;
    jajaeGroupMap[grpInfo.name].totalAmount += item.amount;
    if (item.supplier && item.supplier !== '-') jajaeGroupMap[grpInfo.name].suppliers.add(item.supplier);
    jajaeGroupMap[grpInfo.name].items.push(item);
  });

  const totalJajaeAmount = rawJajaeItems.reduce((a, b) => a + b.amount, 0);

  const jajaeGroupList = Object.values(jajaeGroupMap).sort((a, b) => b.totalAmount - a.totalAmount).map((g, idx) => ({
    rank: idx + 1,
    groupName: g.groupName,
    color: g.color,
    itemCount: g.itemCount,
    totalAmount: g.totalAmount,
    share: Number(((g.totalAmount / (totalJajaeAmount || 1)) * 100).toFixed(2)),
    mainSuppliers: Array.from(g.suppliers).slice(0, 4).join(', ') || '자체/미지정',
    items: g.items.sort((a, b) => b.amount - a.amount)
  }));

  return {
    yearMonth: targetYearMonth,
    salesSummary: {
      yearMonth: targetYearMonth,
      totalSales: totalSalesFinal,
      totalCalculatedSales: totalCalculatedSales,
      pcmTotal: pcmTotal,
      totalQty: rawSalesItems.reduce((a, b) => a + b.qty, 0),
      itemCount: rawSalesItems.length,
      vehicleGroupCount: vehicleList.length
    },
    vehicleSales: vehicleList,
    jajaeSummary: {
      yearMonth: targetYearMonth,
      totalAmount: totalJajaeAmount,
      itemCount: rawJajaeItems.length,
      groupCount: jajaeGroupList.length
    },
    jajaeGroups: jajaeGroupList,
    purchaseSummary: {
      yearMonth: targetYearMonth,
      ledgerBenchmark: summaryTotalPurchases > 0 ? summaryTotalPurchases : totalJajaeAmount,
      totalExpenses: summaryTotalPurchases > 0 ? summaryTotalPurchases : totalJajaeAmount
    }
  };
}

const data202607 = parseCompleteWorkbook('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/2026-07월매입매출현황_원본.xlsx', '2026-07');
const data202608 = parseCompleteWorkbook('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/2026-08매입매출현황_원본.xlsx', '2026-08');

console.log('=== 2026-07 PARSED RESULT ===');
console.log(`Sales: ₩${data202607.salesSummary.totalSales.toLocaleString()} | Vehicles: ${data202607.vehicleSales.length} | Jajae: ₩${data202607.jajaeSummary.totalAmount.toLocaleString()}`);

console.log('=== 2026-08 PARSED RESULT ===');
console.log(`Sales: ₩${data202608.salesSummary.totalSales.toLocaleString()} | Vehicles: ${data202608.vehicleSales.length} | Jajae: ₩${data202608.jajaeSummary.totalAmount.toLocaleString()} | Purchases: ₩${data202608.purchaseSummary.ledgerBenchmark.toLocaleString()}`);

const combinedData = {
  '2026-08': data202608,
  '2026-07': data202607
};

fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/src/data/multiMonthMasterData.json', JSON.stringify(combinedData, null, 2), 'utf8');
console.log('Saved multiMonthMasterData.json successfully!');
