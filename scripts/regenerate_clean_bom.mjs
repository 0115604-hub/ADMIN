import fs from 'fs';
import * as XLSX from 'xlsx';
import { EXTRUSION_ITEMS_BY_LINE as existingItems, EXTRUSION_LINE_BADGES } from '../src/data/extrusionItemsData.js';

const filePath = 'C:/Users/k0115/OneDrive/바탕 화면/anti/압출/압출라인별 BOM자료.xls';
const buf = fs.readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer' });

function cleanVal(v) {
  if (!v) return '';
  const s = String(v).trim();
  if (s === '무' || s === '미사용' || s === 'null' || s === 'undefined' || s === '-') return '';
  return s;
}

export function normalizeBOMKey(str = '') {
  return String(str || '')
    .toUpperCase()
    .replace(/\(A\/S\)/g, '')
    .replace(/A\/S/g, '')
    .replace(/[\s\-_/'".()$]+/g, '');
}

const lineMeta = {
  pcm1: { lineName: 'PCM #1 LINE', lineBadge: 'PCM1', color: 'teal' },
  pcm3: { lineName: 'PCM #3 LINE', lineBadge: 'PCM3', color: 'blue' },
  tpe: { lineName: 'TPE LINE', lineBadge: 'TPE', color: 'purple' },
  pvc: { lineName: 'PVC LINE', lineBadge: 'PVC', color: 'amber' }
};

const bomEntries = [];

for (const sheetName of wb.SheetNames) {
  const sheet = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  let lineKey = 'pcm1';
  if (sheetName.includes('PCM3')) lineKey = 'pcm3';
  else if (sheetName.includes('TPE')) lineKey = 'tpe';
  else if (sheetName.includes('PVC')) lineKey = 'pvc';
  
  for (let i = 3; i < data.length; i++) {
    const r = data[i];
    if (!r || !r[0]) continue;
    const rawName = String(r[0]).trim();
    if (!rawName || rawName === '차종 및 품명' || rawName === '개발' || rawName === '기타' || rawName === 'A/S') continue;
    
    const category = cleanVal(r[1]);
    const isAS = category.includes('A/S') || rawName.includes('A/S');
    
    // Parse vehicle & itemName
    const parts = rawName.replace(/\s+/g, ' ').split(' ');
    const vehicle = parts[0];
    const itemName = parts.slice(1).join(' ') || rawName;
    
    let entry = {
      sheetName,
      lineKey,
      rawName,
      normName: normalizeBOMKey(rawName),
      vehicle,
      itemName,
      isAS,
      rubberType: '',
      rubberType2: '',
      compoundType: '',
      compoundType2: '',
      compoundType3: '',
      compoundType4: '',
      insertType: '미사용',
      coatingType: '미사용'
    };
    
    if (lineKey === 'pcm1' || lineKey === 'pcm3') {
      // 🌟 솔리드/스폰지 구분 없이 비어있지 않은 고무를 순서대로 연고무1, 연고무2에 할당
      const rawRubbers = [cleanVal(r[2]), cleanVal(r[3])].filter(Boolean);
      entry.rubberType = rawRubbers[0] || '';
      entry.rubberType2 = rawRubbers[1] || '';
      entry.insertType = cleanVal(r[4]) ? cleanVal(r[4]) : '미사용';
      entry.coatingType = cleanVal(r[5]) ? cleanVal(r[5]) : '미사용';
      // PCM 1,3호는 컴파운드 미사용
      entry.compoundType = '';
      entry.compoundType2 = '';
      entry.compoundType3 = '';
      entry.compoundType4 = '';
    } else if (lineKey === 'tpe') {
      // TPE 라인은 콤파운드 1~4
      entry.compoundType = cleanVal(r[2]);
      entry.compoundType2 = cleanVal(r[3]);
      entry.compoundType3 = cleanVal(r[4]);
      entry.compoundType4 = cleanVal(r[5]);
      entry.rubberType = '';
      entry.rubberType2 = '';
      entry.insertType = '미사용';
      entry.coatingType = '미사용';
    } else if (lineKey === 'pvc') {
      // PVC 라인은 콤파운드, 심금, 후로킹
      entry.compoundType = cleanVal(r[2]);
      entry.insertType = cleanVal(r[3]) ? cleanVal(r[3]) : '미사용';
      entry.coatingType = cleanVal(r[4]) ? cleanVal(r[4]) : '미사용';
      entry.rubberType = '';
      entry.rubberType2 = '';
    }
    
    bomEntries.push(entry);
  }
}

console.log(`Generated ${bomEntries.length} cleanly structured BOM entries.`);

// 1. Write src/data/extrusionLineBOMData.js
const bomFileContent = `// ============================================================================
// 삼랑진공장 압출라인별 BOM 마스터 데이터
// 원본: 압출라인별 BOM자료.xls (PCM1호, PCM3호, TPE라인, PVC라인)
// 규칙:
// - 솔리드/스폰지 구분 없이 연고무1, 연고무2에 순차 할당
// - 심금 '무'는 '미사용' 처리
// - PCM 1, 3호는 컴파운드 미사용 (항상 공란)
// - TPE는 콤파운드 1~4 사용
// - PVC는 콤파운드, 심금, 후로킹(코팅) 사용
// ============================================================================

export const EXCEL_EXTRUSION_BOM_LIST = ${JSON.stringify(bomEntries, null, 2)};

// Helper: Normalize string for fuzzy matching (remove spaces, symbols, uppercase)
export const normalizeBOMKey = (str = "") => {
  return String(str || "")
    .toUpperCase()
    .replace(/\\(A\\/S\\)/g, "")
    .replace(/A\\/S/g, "")
    .replace(/[\\s\\-_/'".()$]+/g, "");
};

// Fast lookup map
export const EXCEL_EXTRUSION_BOM_MAP = {};

EXCEL_EXTRUSION_BOM_LIST.forEach((item) => {
  const exactKey = \`\${item.vehicle}:::\${item.itemName}\`;
  if (!EXCEL_EXTRUSION_BOM_MAP[exactKey]) {
    EXCEL_EXTRUSION_BOM_MAP[exactKey] = item;
  }
  if (!EXCEL_EXTRUSION_BOM_MAP[item.rawName]) {
    EXCEL_EXTRUSION_BOM_MAP[item.rawName] = item;
  }
  if (!EXCEL_EXTRUSION_BOM_MAP[item.vehicle]) {
    EXCEL_EXTRUSION_BOM_MAP[item.vehicle] = item;
  }
  if (!EXCEL_EXTRUSION_BOM_MAP[item.normName]) {
    EXCEL_EXTRUSION_BOM_MAP[item.normName] = item;
  }
});

/**
 * Find BOM from Excel baseline data with multi-tier fuzzy matching
 */
export const findExcelBOMMatch = (vehicle = "", itemName = "", lineId = "") => {
  const v = String(vehicle || "").trim();
  const n = String(itemName || "").trim();
  if (!v && !n) return null;

  // 1. Exact composite key
  const exactKey = \`\${v}:::\${n}\`;
  if (EXCEL_EXTRUSION_BOM_MAP[exactKey]) {
    return { ...EXCEL_EXTRUSION_BOM_MAP[exactKey], matchType: "EXCEL_EXACT" };
  }

  // 2. Raw combined name
  const combinedRaw = \`\${v} \${n}\`.trim();
  if (EXCEL_EXTRUSION_BOM_MAP[combinedRaw]) {
    return { ...EXCEL_EXTRUSION_BOM_MAP[combinedRaw], matchType: "EXCEL_RAW" };
  }

  // 3. Normalized full string match
  const fullNorm = normalizeBOMKey(combinedRaw);
  if (EXCEL_EXTRUSION_BOM_MAP[fullNorm]) {
    return { ...EXCEL_EXTRUSION_BOM_MAP[fullNorm], matchType: "EXCEL_NORM" };
  }

  const vNorm = normalizeBOMKey(v);
  const nNorm = normalizeBOMKey(n);

  // 4. Search in list for exact normalized match
  for (const item of EXCEL_EXTRUSION_BOM_LIST) {
    if (item.normName === fullNorm) {
      return { ...item, matchType: "EXCEL_LIST_EXACT" };
    }
  }

  // 5. Special alias mappings (e.g. Q200/Y400, DE-CAR, YB-CAR)
  if (vNorm.includes("Q200") || vNorm.includes("Y400")) {
    const qMatch = EXCEL_EXTRUSION_BOM_LIST.find((item) => (item.normName.includes("Y400") || item.normName.includes("Q200")) && (item.normName.includes(nNorm) || nNorm.includes(item.normName)));
    if (qMatch) return { ...qMatch, matchType: "EXCEL_ALIAS_Q200" };
  }
  if (vNorm.includes("DECAR") || vNorm === "DE") {
    const deMatch = EXCEL_EXTRUSION_BOM_LIST.find((item) => item.normName.includes("DE") && (item.normName.includes(nNorm) || !nNorm));
    if (deMatch) return { ...deMatch, matchType: "EXCEL_ALIAS_DE" };
  }
  if (vNorm.includes("YBCAR") || vNorm === "YB") {
    const ybMatch = EXCEL_EXTRUSION_BOM_LIST.find((item) => item.normName.includes("YB") && (item.normName.includes(nNorm) || !nNorm));
    if (ybMatch) return { ...ybMatch, matchType: "EXCEL_ALIAS_YB" };
  }

  // 6. Substring match
  for (const item of EXCEL_EXTRUSION_BOM_LIST) {
    if (fullNorm.length >= 4 && (item.normName.includes(fullNorm) || fullNorm.includes(item.normName))) {
      return { ...item, matchType: "EXCEL_LIST_SUBSTRING" };
    }
  }

  // 7. Vehicle match with item suffix match
  if (vNorm) {
    for (const item of EXCEL_EXTRUSION_BOM_LIST) {
      if (item.normName.startsWith(vNorm)) {
        if (nNorm && (item.normName.includes(nNorm) || nNorm.includes(item.normName.slice(vNorm.length)))) {
          return { ...item, matchType: "EXCEL_VEHICLE_ITEM" };
        }
      }
    }
  }

  // 8. Vehicle default fallback
  if (v && EXCEL_EXTRUSION_BOM_MAP[v]) {
    return { ...EXCEL_EXTRUSION_BOM_MAP[v], matchType: "EXCEL_VEHICLE" };
  }
  if (vNorm && EXCEL_EXTRUSION_BOM_MAP[vNorm]) {
    return { ...EXCEL_EXTRUSION_BOM_MAP[vNorm], matchType: "EXCEL_VEHICLE_NORM" };
  }

  // 9. Line-based smart defaults (for TEST or unknown items)
  if (lineId === "tpe" || vNorm.includes("TPE")) {
    return {
      sheetName: "TPE라인",
      lineKey: "tpe",
      vehicle: v || "TPE",
      itemName: n || "G/RUN",
      compoundType: "XA1-65B-001",
      compoundType2: "XA1-80B-001",
      compoundType3: "ED2-52B",
      compoundType4: "ED2-53B",
      insertType: "미사용",
      coatingType: "미사용",
      matchType: "LINE_DEFAULT_TPE"
    };
  } else if (lineId === "pvc" || vNorm.includes("PVC")) {
    return {
      sheetName: "PVC라인",
      lineKey: "pvc",
      vehicle: v || "PVC",
      itemName: n || "CHAN'L",
      compoundType: "SD#75BK",
      insertType: "0.4*45.5 (SUS430)",
      coatingType: "파일 후루킹",
      matchType: "LINE_DEFAULT_PVC"
    };
  } else if (lineId === "pcm3") {
    return {
      sheetName: "PCM3호",
      lineKey: "pcm3",
      vehicle: v || "PCM3",
      itemName: n || "DR SIDE",
      rubberType: "W60513M",
      rubberType2: "W60052",
      compoundType: "",
      compoundType2: "",
      compoundType3: "",
      compoundType4: "",
      insertType: "미사용",
      coatingType: "HSC-2000B-3",
      matchType: "LINE_DEFAULT_PCM3"
    };
  } else {
    return {
      sheetName: "PCM1호",
      lineKey: "pcm1",
      vehicle: v || "PCM1",
      itemName: n || "HOOD SEAL",
      rubberType: "W60712$2",
      rubberType2: "W60594BJ2",
      compoundType: "",
      compoundType2: "",
      compoundType3: "",
      compoundType4: "",
      insertType: "미사용",
      coatingType: "HSC-2000B-3",
      matchType: "LINE_DEFAULT_PCM1"
    };
  }
};
`;

fs.writeFileSync('C:/Users/k0115/.gemini/antigravity/scratch/ADMIN/src/data/extrusionLineBOMData.js', bomFileContent, 'utf8');
console.log('Successfully generated updated src/data/extrusionLineBOMData.js');
