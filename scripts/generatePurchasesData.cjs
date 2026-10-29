const fs = require('fs');
const xlsx = require('xlsx');

const filePath = 'C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/2026-08매입매출현황_원본.xlsx';
const wb = xlsx.readFile(filePath);

function parseAll(sheetName, category, codeCol, nameCol, unitCol, suppCol, startRow) {
  const sheet = wb.Sheets[sheetName];
  const range = xlsx.utils.decode_range(sheet['!ref']);
  const dailyShipments = [];
  const masterItems = [];
  let currentSupplier = '';

  for (let R = startRow; R <= range.e.r; ++R) {
    const suppCell = sheet[xlsx.utils.encode_cell({r: R, c: suppCol})];
    if (suppCell && suppCell.v && String(suppCell.v).trim()) {
      currentSupplier = String(suppCell.v).trim();
    }

    const codeCell = sheet[xlsx.utils.encode_cell({r: R, c: codeCol})];
    const nameCell = sheet[xlsx.utils.encode_cell({r: R, c: nameCol})];
    const unitCell = sheet[xlsx.utils.encode_cell({r: R, c: unitCol})];

    const code = codeCell && codeCell.v !== undefined ? String(codeCell.v).trim() : '';
    const name = nameCell && nameCell.v !== undefined ? String(nameCell.v).trim() : '';
    const unit = unitCell && unitCell.v !== undefined ? String(unitCell.v).trim() : (category === 'RAW_MATERIAL' ? 'Kg' : 'EA');

    if (!name && !code) continue;
    if (name.includes('합계') || name.includes('소계') || code.includes('합계')) continue;

    let rowTotal = 0;
    const dailyMap = {};
    for (let day = 1; day <= 31; ++day) {
      const colIdx = 5 + day;
      const dayCell = sheet[xlsx.utils.encode_cell({r: R, c: colIdx})];
      let qty = 0;
      if (dayCell && typeof dayCell.v === 'number' && dayCell.v > 0) {
        qty = dayCell.v;
      } else if (dayCell && !isNaN(Number(dayCell.v)) && Number(dayCell.v) > 0) {
        qty = Number(dayCell.v);
      }

      if (qty > 0) {
        rowTotal += qty;
        dailyMap[day] = qty;
        const dayStr = String(day).padStart(2, '0');
        dailyShipments.push({
          date: '2026-08-' + dayStr,
          day: day,
          category: category,
          supplier: currentSupplier || '기타',
          materialCode: code,
          materialName: name,
          unit: unit,
          quantity: qty
        });
      }
    }

    masterItems.push({
      category: category,
      supplier: currentSupplier || '기타',
      materialCode: code,
      materialName: name,
      unit: unit,
      totalQty: rowTotal,
      dailyQuantities: dailyMap
    });
  }
  return { dailyShipments, masterItems };
}

const rawRes = parseAll('원자재매입내역', 'RAW_MATERIAL', 1, 2, 3, 5, 2);
const subRes = parseAll('부자재매입내역', 'SUB_MATERIAL', 2, 3, 4, 5, 2);

const allDaily = [...rawRes.dailyShipments, ...subRes.dailyShipments];
allDaily.sort((a,b) => b.day - a.day || a.supplier.localeCompare(b.supplier));

const output = `/**
 * 조인주 선임 매입매출 원본 연동 마스터 데이터
 * (2026년 08월 기준 - 실물 매입내역 및 일별 실물 입고 데이터)
 */

export const PURCHASES_RAW_MATERIALS = ` + JSON.stringify(rawRes.masterItems, null, 2) + `;

export const PURCHASES_SUB_MATERIALS = ` + JSON.stringify(subRes.masterItems, null, 2) + `;

export const PURCHASES_RAW_SUPPLIERS = Array.from(
  new Set(PURCHASES_RAW_MATERIALS.map((item) => item.supplier).filter(Boolean))
);

export const PURCHASES_SUB_SUPPLIERS = Array.from(
  new Set(PURCHASES_SUB_MATERIALS.map((item) => item.supplier).filter(Boolean))
);

/**
 * 08월 일별 매입 실적 전체 목록 (총 ` + allDaily.length + `건)
 * 각 일자별 실제 매입수량 및 품목내역
 */
export const PURCHASES_DAILY_SHIPMENTS = ` + JSON.stringify(allDaily, null, 2) + `;
`;

fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/src/data/monthlyPurchasesData.js', output, 'utf8');
console.log('Successfully written to src/data/monthlyPurchasesData.js! Total daily items:', allDaily.length);
