// ============================================================================
// 삼랑진공장 압출 원재료 마스터 데이터 (EPDM.xlsx 기준)
// 사용연고무명, 컴파운드, 심금, 코팅액 마스터 목록 및 품목별 자동 연동 BOM 매핑
// ============================================================================

// 1. 사용연고무 마스터 목록 (EPDM.xlsx + 압출라인별 BOM자료.xls 기준)
export const EPDM_RUBBERS = [
  { id: "none", name: "미사용", unit: "Kg", type: "미사용", desc: "사용 안함" },
  { id: "w60712_2", name: "W60712$2", unit: "Kg", type: "솔리드", desc: "솔리드 EPDM 고무" },
  { id: "w60712_2ta", name: "W60712$2TA", unit: "Kg", type: "솔리드", desc: "솔리드 EPDM 고무" },
  { id: "w60712_ta", name: "W60712$TA", unit: "Kg", type: "솔리드", desc: "솔리드 EPDM 고무" },
  { id: "w60594bj2", name: "W60594BJ2", unit: "Kg", type: "스폰지", desc: "스폰지 EPDM 고무" },
  { id: "w60594", name: "W60594", unit: "Kg", type: "스폰지", desc: "스폰지 EPDM 고무" },
  { id: "w60515", name: "W60515", unit: "Kg", type: "솔리드", desc: "솔리드 EPDM 고무" },
  { id: "w60052", name: "W60052", unit: "KG", type: "스폰지", desc: "스폰지 EPDM 고무" },
  { id: "w60921", name: "W60921", unit: "KG", type: "솔리드", desc: "솔리드 EPDM 고무" },
  { id: "w60593_w3", name: "W60593$W3", unit: "KG", type: "스폰지", desc: "스폰지 EPDM 고무" },
  { id: "w60054", name: "W60054", unit: "KG", type: "스폰지", desc: "스폰지 EPDM 고무" },
  { id: "w60596", name: "W60596", unit: "KG", type: "스폰지", desc: "스폰지 EPDM 고무" },
  { id: "w60713", name: "W60713", unit: "KG", type: "솔리드", desc: "솔리드 EPDM 고무" },
  { id: "w60055", name: "W60055", unit: "KG", type: "스폰지", desc: "스폰지 EPDM 고무" },
  { id: "w60594fmb", name: "W60594FMB", unit: "KG", type: "스폰지", desc: "스폰지 EPDM 고무" },
  { id: "w60433", name: "W60433", unit: "KG", type: "솔리드", desc: "솔리드 EPDM 고무 (표준)" },
  { id: "w60433_gt", name: "W60433$GT", unit: "KG", type: "솔리드", desc: "솔리드 EPDM 고무" },
  { id: "w60513m", name: "W60513M", unit: "KG", type: "솔리드", desc: "솔리드 EPDM 고무" },
  { id: "w60514", name: "W60514", unit: "KG", type: "솔리드", desc: "솔리드 EPDM 고무" },
  { id: "w6085yu", name: "W6085YU", unit: "KG", type: "솔리드", desc: "솔리드 EPDM 고무" },
  { id: "w60351", name: "W60351", unit: "KG", type: "솔리드", desc: "솔리드 EPDM 고무" },
  { id: "w60922", name: "w60922", unit: "KG", type: "솔리드", desc: "솔리드 EPDM 고무" },
  { id: "w60923", name: "W60923", unit: "KG", type: "솔리드", desc: "솔리드 EPDM 고무" },
  { id: "w60924", name: "W60924", unit: "KG", type: "솔리드", desc: "솔리드 EPDM 고무" }
];

// 2. 컴파운드 마스터 목록 (EPDM.xlsx + 압출라인별 BOM자료.xls 기준)
export const EPDM_COMPOUNDS = [
  { id: "none", name: "미사용", unit: "KG", desc: "사용 안함" },
  { id: "ia4_75b_1", name: "IA4-75B_1", unit: "KG", desc: "압출 컴파운드" },
  { id: "b64e", name: "B64E", unit: "KG", desc: "압출 컴파운드" },
  { id: "l2kia7_35b", name: "L2KIA7-35B", unit: "KG", desc: "압출 컴파운드" },
  { id: "ia4_80b_g", name: "IA4-80B (G)", unit: "Kg", desc: "압출 컴파운드" },
  { id: "ia4_68b", name: "IA4-68B", unit: "Kg", desc: "압출 컴파운드" },
  { id: "ia4_78b", name: "IA4-78B", unit: "Kg", desc: "압출 컴파운드" },
  { id: "xa1_65b_001", name: "XA1-65B-001", unit: "Kg", desc: "명례/TPE 컴파운드" },
  { id: "xa1_80b_001", name: "XA1-80B-001", unit: "Kg", desc: "명례/TPE 컴파운드" },
  { id: "ed2_53b", name: "ED2-53B", unit: "Kg", desc: "압출 컴파운드" },
  { id: "ed2_52b", name: "ED2-52B", unit: "Kg", desc: "압출 컴파운드" },
  { id: "ed2_50b", name: "ED2-50B", unit: "Kg", desc: "압출 컴파운드" },
  { id: "ed2_50b_001", name: "ED2-50B-001", unit: "Kg", desc: "압출 컴파운드" },
  { id: "ea1_73b", name: "EA1-73B", unit: "Kg", desc: "압출 컴파운드" },
  { id: "xd1_40b_002", name: "XD1-40B-2", unit: "Kg", desc: "압출 컴파운드" },
  { id: "ed2_48b", name: "ED2-48B", unit: "Kg", desc: "압출 컴파운드" },
  { id: "sx553a", name: "SX553A", unit: "Kg", desc: "TPE 콤파운드" },
  { id: "sd75bk", name: "SD#75BK", unit: "Kg", desc: "PVC 콤파운드 (블랙)" },
  { id: "sd75gy", name: "SD#75GY", unit: "Kg", desc: "PVC 콤파운드 (그레이)" },
  { id: "wm3171lf", name: "WM-3171LF", unit: "Kg", desc: "PVC 콤파운드" },
  { id: "gm_b70em", name: "GM-B70EM", unit: "Kg", desc: "GM 컴파운드" },
  { id: "gm_b64em", name: "GM-B64EM", unit: "Kg", desc: "GM 컴파운드" }
];

// 3. 심금 마스터 목록 (EPDM.xlsx + 압출라인별 BOM자료.xls 기준)
export const EPDM_INSERTS = [
  { id: "none", name: "미사용", spec: "-", desc: "사용 안함" },
  { id: "sus430_04_51_3", name: "SUS430(0.4*51*3)", spec: "0.4*51*3", desc: "스테인리스 심금" },
  { id: "sts430_04_455", name: "0.4*45.5 (SUS430)", spec: "0.4*45.5", desc: "SUS430 스테인리스 심금" },
  { id: "ins_04_455", name: "0.4*45.5", spec: "0.4*45.5", desc: "스틸 심금" },
  { id: "ins_076_460", name: "0.76 X 46.0mm", spec: "0.76*46.0", desc: "심금 0.76*46.0mm" },
  { id: "ins_06_36", name: "0.6*36", spec: "0.6*36", desc: "스틸 심금" },
  { id: "scp1_05_50_5", name: "SCP1-1/2 H (0.5*50*5)", spec: "0.5*50*5", desc: "SCP1 심금" },
  { id: "ins_05_50", name: "0.5*50", spec: "0.5*50", desc: "스틸 심금 0.5*50" },
  { id: "ins_05_43_spgc", name: "0.5*43 (SPGC)", spec: "0.5*43", desc: "SPGC 심금 0.5*43" },
  { id: "ins_05_32_zn", name: "0.5*32 (연질)", spec: "0.5*32", desc: "연질 아연도금 심금 0.5*32" },
  { id: "ins_045_30", name: "0.45*30", spec: "0.45*30", desc: "스틸 심금" },
  { id: "ins_05_30", name: "0.5*30", spec: "0.5*30", desc: "스틸 심금" },
  { id: "ins_05_213", name: "0.5*21.3", spec: "0.5*21.3", desc: "스틸 심금" },
  { id: "ins_05_34", name: "0.5*34", spec: "0.5*34", desc: "스틸 심금" },
  { id: "ins_roll_045_28", name: "압연심금 0.45*28", spec: "0.45*28", desc: "압연 심금" },
  { id: "sts430a_04_455", name: "심금STS430A 0.4*45.5", spec: "0.4*45.5", desc: "STS430A 심금" },
  { id: "ins_05_373mm", name: "0.5*37.3mm", spec: "0.5*37.3", desc: "스틸 심금" }
];

// 4. 코팅액 마스터 목록 (EPDM.xlsx + 압출라인별 BOM자료.xls 기준)
export const EPDM_COATINGS = [
  { id: "none", name: "미사용", category: "미사용", desc: "사용 안함" },
  { id: "hsc_2000_b_3", name: "HSC-2000B-3", category: "속건성", desc: "속건성 코팅제 (표준)" },
  { id: "hsw_6000l", name: "HSW-6000L", category: "수성", desc: "수성 코팅제" },
  { id: "flocking_pile", name: "파일 후루킹", category: "후로킹", desc: "PVC 파일 후루킹" },
  { id: "hsl_770k_2", name: "HSL-770K-2(주제)", category: "주제", desc: "우레탄 코팅 주제" },
  { id: "hsx_9600_1", name: "HSX-9600-1(경화제)", category: "경화제", desc: "코팅 경화제" },
  { id: "hsy_6800_1", name: "HSY-6800-1", category: "코팅제", desc: "표면 코팅제" },
  { id: "pr_405", name: "PR-405(희석제)", category: "희석제", desc: "전용 희석제" },
  { id: "hsp_500_2", name: "HSP-500-2", category: "프라이머", desc: "접착 프라이머" },
  { id: "pr_520", name: "PR - 520", category: "희석제", desc: "세척/희석제" },
  { id: "hs_100w_1", name: "HS-100W-1(장유)", category: "수성", desc: "수성 코팅제" },
  { id: "hsh_9604", name: "HSH-9604", category: "코팅제", desc: "내마모 코팅제" },
  { id: "hsw_16000lc", name: "HSW-16000LC", category: "수성", desc: "수성 코팅제" },
  { id: "hsw_595v", name: "HSW-595V", category: "수성", desc: "수성 코팅제" },
  { id: "hsp_700", name: "HSP-700", category: "프라이머", desc: "고부착 프라이머" },
  { id: "hsw_8000_3p", name: "HSW-8000-3P", category: "수성", desc: "3코트 수성 코팅제" }
];

// ============================================================================
// 5. 품목별 원재료 BOM 마스터 테이블 (실데이터 기반 - 더미 데이터 완전 제거)
// 키 포맷: `${차종}:::${품명}` 또는 `${차종}`
// ============================================================================
export const ITEM_MATERIAL_BOM_MAP = {};

import { findExcelBOMMatch } from "./extrusionLineBOMData";

// ============================================================================
// 6. 헬퍼 함수: 품목 선택 시 자동 원재료 매핑 조회 (동적 등록 BOM 우선 조회 + 엑셀 BOM 연동)
// ============================================================================
export const getMaterialBOMForItem = (vehicle, itemName, lineId = "") => {
  const v = String(vehicle || "").trim();
  const n = String(itemName || "").trim();

  // 1. 🌟 Seol Yoo-chul's dynamically registered custom BOM (Highest priority - "설유철이 올리는 BOM은 유지")
  let customMap = {};
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("factory_extrusion_custom_bom_v1");
      if (raw) {
        customMap = JSON.parse(raw) || {};
      }
    }
  } catch (e) {}

  // 1-1. Custom exact vehicle + itemName match
  if (v && n) {
    const fullKey = `${v}:::${n}`;
    if (customMap[fullKey]) {
      return { ...customMap[fullKey], matchedKey: fullKey, matchType: "CUSTOM_EXACT" };
    }
  }

  // 1-2. Custom vehicle match
  if (v && customMap[v]) {
    return { ...customMap[v], matchedKey: v, matchType: "CUSTOM_VEHICLE" };
  }

  // 2. 🌟 Excel Baseline BOM (from 압출라인별 BOM자료.xls)
  const excelMatch = findExcelBOMMatch(v, n, lineId);
  if (excelMatch) {
    return {
      rubberType: excelMatch.rubberType || "",
      rubberType2: excelMatch.rubberType2 || "",
      compoundType: excelMatch.compoundType || "",
      compoundType2: excelMatch.compoundType2 || "",
      compoundType3: excelMatch.compoundType3 || "",
      compoundType4: excelMatch.compoundType4 || "",
      insertType: excelMatch.insertType || "미사용",
      coatingType: excelMatch.coatingType || "미사용",
      defaultRubberWeight: 120.0,
      defaultCoatingWeight: 15.0,
      defaultInsertWeight: 85.0,
      defaultCompoundWeight: 40.0,
      matchedKey: excelMatch.rawName || `${v} ${n}`,
      matchType: excelMatch.matchType || "EXCEL_BOM",
      sheetName: excelMatch.sheetName || "",
      lineKey: excelMatch.lineKey || lineId
    };
  }

  // 3. Static ITEM_MATERIAL_BOM_MAP
  if (v && n) {
    const fullKey = `${v}:::${n}`;
    if (ITEM_MATERIAL_BOM_MAP[fullKey]) {
      return { ...ITEM_MATERIAL_BOM_MAP[fullKey], matchedKey: fullKey, matchType: "EXACT" };
    }
  }
  if (v && ITEM_MATERIAL_BOM_MAP[v]) {
    return { ...ITEM_MATERIAL_BOM_MAP[v], matchedKey: v, matchType: "VEHICLE" };
  }

  // 4. Default Fallback
  const isPcmLine = String(lineId).toLowerCase().includes("pcm") || lineId === "pcm1" || lineId === "pcm3";
  return {
    rubberType: isPcmLine ? "W60712$2" : "W60433",
    rubberType2: "",
    compoundType: isPcmLine ? "" : "IA4-75B_1",
    compoundType2: "",
    compoundType3: "",
    compoundType4: "",
    insertType: isPcmLine ? "미사용" : "SUS430(0.4*51*3)",
    coatingType: isPcmLine ? "미사용" : "HSC-2000-B-3",
    defaultRubberWeight: 120.0,
    defaultCoatingWeight: 15.0,
    defaultInsertWeight: 85.0,
    defaultCompoundWeight: 40.0,
    matchedKey: "DEFAULT",
    matchType: "DEFAULT"
  };
};
