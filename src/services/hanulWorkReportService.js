// Hanul (한울) 9BQC G/RUN & LQ2a Work Report Service
// Real-time Firestore Sync + LocalStorage Multi-Device Persistence
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeForFirestore } from "../utils/firestoreUtils";
import * as XLSX from "xlsx";

export const HANUL_STORAGE_KEY = "hanul_work_reports_store_v1";
const COLLECTION_NAME = "hanul_work_reports";

// Project & Item Categories Definitions
export const HANUL_PROJECTS = [
  { id: "9BQC", name: "9BQC G/RUN", carModel: "9BQC", partName: "G/RUN" },
  { id: "LQ2A", name: "LQ2a Hood Side", carModel: "LQ2a", partName: "Hood Side" }
];

export const HANUL_PROCESSES = {
  "9BQC": [
    { id: "소재준비", name: "소재준비", subTitle: "정치절단, 단컷팅" },
    { id: "조인트", name: "조인트", subTitle: "FRT, FIXED LH/RH, RR (4종)" },
    { id: "본드로봇", name: "본드로봇", subTitle: "로봇 본딩 및 도포 작업" },
    { id: "검사", name: "검사", subTitle: "완제품, 단면 확인 및 최종검사" }
  ],
  "LQ2A": [
    { id: "소재준비", name: "소재준비", subTitle: "정치절단, 단컷팅" },
    { id: "조인트", name: "조인트", subTitle: "조인트 프레스 및 가류 작업" },
    { id: "본드로봇", name: "본드로봇", subTitle: "본딩 및 클립/후가공 조립" },
    { id: "검사", name: "검사", subTitle: "완제품 치수 및 최종검사" }
  ]
};

// 🌟 9BQC 조인트 세부 4대 작업일보 양식 정의
export const HANUL_JOINT_TYPES = [
  { id: "FRT", label: "G/RUN FRT (2/3호기)", shortName: "FRT", partName: "G/RUN FRT (2호기 / 3호기)", desc: "직각/둔각 사출 성형 (FRT A/B/C)" },
  { id: "FIXED_LH", label: "G/RUN FIXED (LH)", shortName: "FIXED LH", partName: "G/RUN FIXED LH", desc: "Glass, D/V, Bracket 부자재 조립 (RR A/B)" },
  { id: "FIXED_RH", label: "G/RUN FIXED (RH)", shortName: "FIXED RH", partName: "G/RUN FIXED RH", desc: "Glass, D/V, Bracket 부자재 조립 (RR A/B)" },
  { id: "RR", label: "G/RUN RR (2/3호기)", shortName: "RR", partName: "G/RUN RR", desc: "2호기/3호기 사출 성형 (RR A/B)" }
];

// 🌟 9BQC 검사 세부 4대 작업일보 양식 정의 (길이검사, 직각검사, 최종검사)
export const HANUL_INSPECTION_TYPES = [
  {
    id: "LENGTH",
    label: "1. 길이검사 일보",
    shortName: "길이검사",
    sheetTitle: "길이검사 일보",
    desc: "RR LH / RR RH (PRIVACY, TINTED) • 부자재 패드 5T • 중요 치수 A/B (482/658mm)",
    columns: ["RR LH (PRIVACY)", "RR LH (TINTED)", "RR RH (PRIVACY)", "RR RH (TINTED)"]
  },
  {
    id: "SQUARE",
    label: "2. 직각검사 일보",
    shortName: "직각검사",
    sheetTitle: "직각검사 일보",
    desc: "LH 2호기, LH 3호기, RH 2호기, RH 3호기 (4개 설비호기) • 중요 치수 A/B (482/658mm)",
    columns: ["LH 2호기", "LH 3호기", "RH 2호기", "RH 3호기"]
  },
  {
    id: "FINAL_PAIR",
    label: "3. 최종검사 일보 (LH / RH)",
    shortName: "최종검사 (LH/RH)",
    sheetTitle: "최종검사 일보",
    desc: "RR LH / RR RH (PRIVACY, TINTED) • 부자재 D/V • 리워크(DV/직둔각) • 중요 치수 A/B/D 및 패드 5T/7T",
    columns: ["RR LH (PRIVACY)", "RR LH (TINTED)", "RR RH (PRIVACY)", "RR RH (TINTED)"]
  },
  {
    id: "FINAL_LH",
    label: "4. 최종검사 일보 (LH 전용)",
    shortName: "최종검사 (LH)",
    sheetTitle: "최종 / 검사 일보",
    desc: "RR LH 1호기 / 2호기 (PRIVACY, TINTED) • 부자재 D/V • 리워크(DV/직둔각) • 중요 치수 A/B/D 및 패드 5T/7T",
    columns: ["RR LH 1호기 (PRI)", "RR LH 1호기 (TIN)", "RR LH 2호기 (PRI)", "RR LH 2호기 (TIN)"]
  }
];

// 🔒 작업일보 실적 집계 및 작성 대상에서 제외되는 관리자 목록 (대표이사/관리자)
// 관리자는 작업일보를 작성하지 않으므로 현장 실적 및 작성 대상에서 원천 배제
export const EXCLUDED_WORK_REPORT_MANAGERS = [
  "김동훈",
  "황수현",
  "권태형",
  "최미영",
  "부림텍",
  "유성",
  "한울"
];

export const isExcludedFromWorkReport = (name) => {
  if (!name) return false;
  const cleanName = String(name).trim();
  return EXCLUDED_WORK_REPORT_MANAGERS.some((mgr) => cleanName.includes(mgr));
};

// Master list of Hanul production workers for daily work reports (25명)
// ⚠️ 관리자(황수현, 김동훈 등)는 작업일보 작성이 없으므로 현장 실적 및 작성 목록에서 제외
export const HANUL_WORKERS_MASTER = [
  { no: 1, name: "박종미", position: "반장/조장", line: "관리부", role: "반장" },
  { no: 2, name: "마이클", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 3, name: "마크", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 4, name: "로렉스", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 5, name: "무피드", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 6, name: "마틴", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 7, name: "박민정", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 8, name: "지라완", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 9, name: "레이놀드", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 10, name: "맥리", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 11, name: "조제인", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 12, name: "새드릭", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 13, name: "니사낫", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 14, name: "수파따", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 15, name: "와히드", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 16, name: "찬티마", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 17, name: "데이브", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 18, name: "위간", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 19, name: "프랭클린", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 20, name: "에일리", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 21, name: "마이카", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 22, name: "알프레도", position: "작업원", line: "LQ2", role: "작업원" },
  { no: 23, name: "아이린", position: "작업원", line: "LQ2", role: "작업원" },
  { no: 24, name: "에릭", position: "작업원", line: "LQ2", role: "작업원" },
  { no: 25, name: "언", position: "작업원", line: "LQ2", role: "작업원" }
];

// Specifications extracted directly from desktop Excel files
export const HANUL_SPECS = {
  "9BQC_소재준비_정치절단": [
    { key: "frtA", label: "FRT A단면 (정치절단)", spec: "881±3mm", target: 881, tol: 3 },
    { key: "frtB", label: "FRT B단면 (정치절단)", spec: "608±5mm", target: 608, tol: 5 },
    { key: "frtC", label: "FRT C단면 (정치절단)", spec: "582±5mm", target: 582, tol: 5 },
    { key: "rrA", label: "RR A단면 (가절단)", spec: "488±3mm", target: 488, tol: 3 },
    { key: "rrB", label: "RR B단면 (정치절단)", spec: "658±5mm", target: 658, tol: 5 }
  ],
  "9BQC_소재준비_단컷팅": [
    { key: "frtLhA", label: "FRT LH - A", spec: "83mm", target: 83, tol: 2 },
    { key: "frtLhB", label: "FRT LH - B", spec: "83mm", target: 83, tol: 2 },
    { key: "frtRhA", label: "FRT RH - A", spec: "83mm", target: 83, tol: 2 },
    { key: "frtRhB", label: "FRT RH - B", spec: "83mm", target: 83, tol: 2 },
    { key: "rrLhA", label: "RR LH - A", spec: "68mm", target: 68, tol: 2 },
    { key: "rrLhB", label: "RR LH - B", spec: "67mm", target: 67, tol: 2 },
    { key: "rrRhA", label: "RR RH - A", spec: "68mm", target: 68, tol: 2 },
    { key: "rrRhB", label: "RR RH - B", spec: "67mm", target: 67, tol: 2 }
  ],
  "9BQC_소재준비": [
    { key: "frtA", label: "FRT A단면 (정재단)", spec: "881±3mm", target: 881, tol: 3 },
    { key: "frtB", label: "FRT B단면 (정재단)", spec: "608±5mm", target: 608, tol: 5 },
    { key: "frtC", label: "FRT C단면 (정재단)", spec: "582±5mm", target: 582, tol: 5 },
    { key: "rrA", label: "RR A단면 (정재단)", spec: "488±3mm", target: 488, tol: 3 },
    { key: "rrB", label: "RR B단면 (정재단)", spec: "658±5mm", target: 658, tol: 5 },
    { key: "frtCutting", label: "FRT LH/RH 단컷팅", spec: "83±3mm", target: 83, tol: 3 },
    { key: "rrLhCutting", label: "RR LH 단컷팅", spec: "68±3mm", target: 68, tol: 3 },
    { key: "rrRhCutting", label: "RR RH 단컷팅", spec: "67±3mm", target: 67, tol: 3 }
  ],
  "9BQC_검사_LENGTH": [
    { key: "rrLhA", label: "RR LH A (길이)", spec: "482±3mm", target: 482, tol: 3 },
    { key: "rrLhB", label: "RR LH B (길이)", spec: "658±5mm", target: 658, tol: 5 },
    { key: "padLh", label: "스폰지패드 규격 (LH)", spec: "5T*5W*60L" },
    { key: "rrRhA", label: "RR RH A (길이)", spec: "482±3mm", target: 482, tol: 3 },
    { key: "rrRhB", label: "RR RH B (길이)", spec: "658±5mm", target: 658, tol: 5 },
    { key: "padRh", label: "스폰지패드 규격 (RH)", spec: "5T*5W*60L" }
  ],
  "9BQC_검사_SQUARE": [
    { key: "rrLhA", label: "RR LH A (직각)", spec: "482±3mm", target: 482, tol: 3 },
    { key: "rrLhB", label: "RR LH B (직각)", spec: "658±5mm", target: 658, tol: 5 },
    { key: "rrRhA", label: "RR RH A (직각)", spec: "482±3mm", target: 482, tol: 3 },
    { key: "rrRhB", label: "RR RH B (직각)", spec: "658±5mm", target: 658, tol: 5 }
  ],
  "9BQC_검사_FINAL_PAIR": [
    { key: "rrPriA", label: "[PRI] RR LH A", spec: "482±3mm", target: 482, tol: 3 },
    { key: "rrPriB", label: "[PRI] RR LH B", spec: "658±5mm", target: 658, tol: 5 },
    { key: "rrPriD", label: "[PRI] RR LH D", spec: "418±4mm", target: 418, tol: 4 },
    { key: "padPri1", label: "[PRI] 패드규격 1", spec: "5T*5W*60L" },
    { key: "padPri2", label: "[PRI] 패드규격 2", spec: "7T*10W*50L" },
    { key: "rrTinA", label: "[TIN] RR LH A", spec: "482±3mm", target: 482, tol: 3 },
    { key: "rrTinB", label: "[TIN] RR LH B", spec: "658±5mm", target: 658, tol: 5 },
    { key: "rrTinD", label: "[TIN] RR LH D", spec: "418±4mm", target: 418, tol: 4 },
    { key: "padTin1", label: "[TIN] 패드규격 1", spec: "5T*5W*60L" },
    { key: "padTin2", label: "[TIN] 패드규격 2", spec: "7T*10W*50L" }
  ],
  "9BQC_검사_FINAL_LH": [
    { key: "rrPriA", label: "[PRI] RR LH A", spec: "482±3mm", target: 482, tol: 3 },
    { key: "rrPriB", label: "[PRI] RR LH B", spec: "658±5mm", target: 658, tol: 5 },
    { key: "rrPriD", label: "[PRI] RR LH D", spec: "418±4mm", target: 418, tol: 4 },
    { key: "padPri1", label: "[PRI] 패드규격 1", spec: "5T*5W*60L" },
    { key: "padPri2", label: "[PRI] 패드규격 2", spec: "7T*10W*50L" },
    { key: "rrTinA", label: "[TIN] RR LH A", spec: "482±3mm", target: 482, tol: 3 },
    { key: "rrTinB", label: "[TIN] RR LH B", spec: "658±5mm", target: 658, tol: 5 },
    { key: "rrTinD", label: "[TIN] RR LH D", spec: "418±4mm", target: 418, tol: 4 },
    { key: "padTin1", label: "[TIN] 패드규격 1", spec: "5T*5W*60L" },
    { key: "padTin2", label: "[TIN] 패드규격 2", spec: "7T*10W*50L" }
  ],
  "9BQC_검사": [
    { key: "frtA", label: "FRT 완제품 치수", spec: "완제품 공차" },
    { key: "rrA", label: "RR 완제품 치수", spec: "완제품 공차" },
    { key: "crossSection", label: "단면 상태 (이탈유무)", spec: "양호" }
  ],
  "LQ2A_소재준비_정치절단": [
    { key: "totalLength", label: "전장 길이", spec: "732±2mm", target: 732, tol: 2 },
    { key: "x1", label: "X1 치수", spec: "단차/위치" },
    { key: "x2", label: "X2 치수", spec: "단차/위치" }
  ],
  "LQ2A_소재준비_단컷팅": [
    { key: "totalLength", label: "단컷팅 길이", spec: "규격공차" },
    { key: "cutLh", label: "LH 단컷팅", spec: "정치/초중종" },
    { key: "cutRh", label: "RH 단컷팅", spec: "정치/초중종" }
  ],
  "LQ2A_소재준비": [
    { key: "totalLength", label: "전장 길이", spec: "732±2mm", target: 732, tol: 2 },
    { key: "x1", label: "X1 치수", spec: "단차/위치" },
    { key: "x2", label: "X2 치수", spec: "단차/위치" },
    { key: "x3", label: "X3 치수", spec: "단차/위치" },
    { key: "x4", label: "X4 치수", spec: "단차/위치" },
    { key: "y1", label: "Y1 치수", spec: "단차/위치" },
    { key: "y2", label: "Y2 치수", spec: "단차/위치" },
    { key: "y3", label: "Y3 치수", spec: "단차/위치" }
  ],
  "LQ2A_검사": [
    { key: "totalLength", label: "전장 길이 전수검사", spec: "732±2mm", target: 732, tol: 2 },
    { key: "x1", label: "X1 (LH/RH)", spec: "초/중/종" },
    { key: "x2", label: "X2 (LH/RH)", spec: "초/중/종" },
    { key: "x3", label: "X3 (LH/RH)", spec: "초/중/종" },
    { key: "x4", label: "X4 (LH/RH)", spec: "초/중/종" }
  ],
  // Fallbacks for legacy process IDs
  "9BQC_정재단": [
    { key: "frtA", label: "FRT A단면", spec: "881±3mm", target: 881, tol: 3 },
    { key: "frtB", label: "FRT B단면", spec: "608±5mm", target: 608, tol: 5 },
    { key: "frtC", label: "FRT C단면", spec: "582±5mm", target: 582, tol: 5 },
    { key: "rrA", label: "RR A단면", spec: "488±3mm", target: 488, tol: 3 },
    { key: "rrB", label: "RR B단면", spec: "658±5mm", target: 658, tol: 5 }
  ],
  "9BQC_단컷팅": [
    { key: "frtCutting", label: "FRT LH/RH 단컷팅", spec: "83±3mm", target: 83, tol: 3 },
    { key: "rrLhCutting", label: "RR LH 단컷팅", spec: "68±3mm", target: 68, tol: 3 },
    { key: "rrRhCutting", label: "RR RH 단컷팅", spec: "67±3mm", target: 67, tol: 3 }
  ],
  "LQ2A_정재단": [
    { key: "totalLength", label: "전장 길이", spec: "732±2mm", target: 732, tol: 2 }
  ],
  "LQ2A_최종검사": [
    { key: "totalLength", label: "전장 길이 전수검사", spec: "732±2mm", target: 732, tol: 2 }
  ]
};

// 🌟 9BQC 소재준비 설비일상 점검 시트 (TPM) 마스터 데이터 (오룩 2024.10.01 개정 서식 100% 반영)
export const HANUL_TPM_MACHINES = [
  { id: "cut_a", name: "1. 정치 절단기(A단면)", shortName: "정치절단기(A)", icon: "✂️" },
  { id: "cut_b", name: "2. 정치 절단기(B단면)", shortName: "정치절단기(B)", icon: "✂️" },
  { id: "edge_frt_a", name: "3. 단컷팅_FRT A", shortName: "단컷팅(FRT A)", icon: "📐" },
  { id: "edge_frt_b", name: "4. 단컷팅_FRT B", shortName: "단컷팅(FRT B)", icon: "📐" },
  { id: "edge_rr_b", name: "5. 단컷팅_RR B", shortName: "단컷팅(RR B)", icon: "📐" },
  { id: "edge_rr_a", name: "6. 단컷팅_RR A", shortName: "단컷팅(RR A)", icon: "📐" }
];

export const HANUL_TPM_CHECK_ITEMS = [
  { no: 1, content: "작동상태는 양호한가?", method: "육안", desc: "설비 구동 모터, 실린더, 스위치 정상 작동 여부" },
  { no: 2, content: "칼날 교환 주기 확인", method: "설비기록", desc: "누적 5만개 초과 여부 및 절단면 마모 상태 점검" },
  { no: 3, content: "제단판 상태는 청결한가?", method: "육안", desc: "작업대 및 절단 가이드 이물질, 분진 청소 상태" },
  { no: 4, content: "비상버튼은 제대로 작동하는가?", method: "육안", desc: "비상 정지 버튼(E-Stop) 즉시 반응 여부" },
  { no: 5, content: "안전장치는 제대로 작동하는가?", method: "육안", desc: "안전 커버, 센서 및 인터록 정상 가동 여부" },
  { no: 6, content: "컷팅 면은 깨끗한가?", method: "육안", desc: "절단면 뜯김, 버(Burr), 경사각 이상 유무" },
  { no: 7, content: "치수확인 지그와 일치하는가?", method: "전용지그", desc: "전용 측정 지그 대비 치수 및 공차 일치 여부" }
];

export const createDefaultHanulTpmChecks = () => {
  const result = {};
  HANUL_TPM_MACHINES.forEach((m) => {
    result[m.id] = {};
    HANUL_TPM_CHECK_ITEMS.forEach((it) => {
      result[m.id][it.no] = "OK"; // "OK" (○) | "NG" (×)
    });
  });
  return result;
};


// 🌟 검사 3대 불량 영역 분류 마스터 (압출소재, 조인트, 후가공)
export const HANUL_INSPECTION_DEFECT_GROUPS = {
  BASIC: {
    extrusion: ["압출_스코치", "압출_외면흠", "압출_오염", "압출_코팅불량", "압출_단면불량", "압출_기타"],
    joint: ["조인트_떨어짐", "조인트_양부족", "조인트_밀림", "조인트_단차", "조인트_기포", "조인트_씹힘", "조인트_삽입불량", "조인트_수축", "조인트_기타"],
    post: ["후가공_길이불량", "후가공_외면오염", "후가공_과사상", "후가공_미사상", "후가공_마킹누락", "후가공_PAD누락", "후가공_FILM누락", "후가공_본드오염", "후가공_기타"]
  },
  FINAL: {
    extrusion: ["압출_스코치", "압출_외면흠", "압출_오염", "압출_코팅불량", "압출_단면불량", "압출_기타"],
    joint: [
      "조인트_떨어짐(직각)", "조인트_떨어짐(둔각)", "조인트_DV떨어짐", "조인트_글라스기스", "조인트_찢어짐",
      "조인트_외면흠", "조인트_양부족", "조인트_밀림", "조인트_단차", "조인트_기포", "조인트_씹힘", "조인트_삽입불량", "조인트_수축", "조인트_기타"
    ],
    post: ["후가공_길이불량", "후가공_외면오염", "후가공_과사상", "후가공_미사상", "후가공_마킹누락", "후가공_PAD누락", "후가공_FILM누락", "후가공_본드오염", "후가공_기타"]
  }
};

// Common initial defect categories by process
export const DEFAULT_DEFECT_CATEGORIES = {
  // 🌟 단순화 4개 공정 (소재준비: 정치절단 / 단컷팅 세부 분기, 조인트, 본드로봇, 검사)
  "9BQC_소재준비_정치절단": ["스코치", "외면흠", "오염", "길이미달", "와이어노출", "공정간_길이", "기타"],
  "9BQC_소재준비_단컷팅": ["스코치", "외면흠", "오염", "공정간_단컷팅", "기타"],
  "9BQC_소재준비": ["스코치", "외면흠", "오염", "길이미달", "와이어노출", "단컷팅불량", "기타"],
  // 🌟 조인트 4대 작업일보 세부 불량 내역 (업로드 서식 100% 일치)
  "9BQC_조인트_FRT": ["떨어짐", "양부족", "밀림", "단차", "기포", "씹힘", "오염", "삽입불량", "수축", "기타"],
  "9BQC_조인트_FIXED_LH": ["떨어짐", "DV떨어짐", "양부족", "밀림", "단차", "기포", "씹힘", "오염", "글라스파손", "삽입불량", "수축", "단컷팅불량", "기타"],
  "9BQC_조인트_FIXED_RH": ["떨어짐", "DV떨어짐", "양부족", "밀림", "단차", "기포", "씹힘", "오염", "글라스파손", "삽입불량", "수축", "단컷팅불량", "기타"],
  "9BQC_조인트_RR": ["떨어짐", "양부족", "밀림", "단차", "기포", "씹힘", "오염", "꼬임", "삽입불량", "수축", "기타"],
  "9BQC_조인트": ["떨어짐", "양부족", "밀림", "단차", "기포", "씹힘", "오염", "꼬임", "삽입불량", "수축", "기타"],
  "9BQC_본드로봇": ["곡률", "스크래치", "도트불량", "면취불량", "조개피(유리깨짐)", "노즐막힘", "기타"],
  // 🌟 9BQC 검사 4대 작업일보 세부 불량 내역 (업로드 서식 100% 일치)
  "9BQC_검사_LENGTH": [
    ...HANUL_INSPECTION_DEFECT_GROUPS.BASIC.extrusion,
    ...HANUL_INSPECTION_DEFECT_GROUPS.BASIC.joint,
    ...HANUL_INSPECTION_DEFECT_GROUPS.BASIC.post
  ],
  "9BQC_검사_SQUARE": [
    ...HANUL_INSPECTION_DEFECT_GROUPS.BASIC.extrusion,
    ...HANUL_INSPECTION_DEFECT_GROUPS.BASIC.joint,
    ...HANUL_INSPECTION_DEFECT_GROUPS.BASIC.post
  ],
  "9BQC_검사_FINAL_PAIR": [
    ...HANUL_INSPECTION_DEFECT_GROUPS.FINAL.extrusion,
    ...HANUL_INSPECTION_DEFECT_GROUPS.FINAL.joint,
    ...HANUL_INSPECTION_DEFECT_GROUPS.FINAL.post
  ],
  "9BQC_검사_FINAL_LH": [
    ...HANUL_INSPECTION_DEFECT_GROUPS.FINAL.extrusion,
    ...HANUL_INSPECTION_DEFECT_GROUPS.FINAL.joint,
    ...HANUL_INSPECTION_DEFECT_GROUPS.FINAL.post
  ],
  "9BQC_검사": [
    ...HANUL_INSPECTION_DEFECT_GROUPS.BASIC.extrusion,
    ...HANUL_INSPECTION_DEFECT_GROUPS.BASIC.joint,
    ...HANUL_INSPECTION_DEFECT_GROUPS.BASIC.post
  ],

  "LQ2A_소재준비_정치절단": ["스코치", "외면흠", "오염", "길이미달", "와이어노출", "공정간_길이", "기타"],
  "LQ2A_소재준비_단컷팅": ["스코치", "외면흠", "오염", "공정간_단컷팅", "기타"],
  "LQ2A_소재준비": ["스코치", "외면흠", "오염", "길이미달", "단면이상", "컷팅불량", "기타"],
  "LQ2A_조인트": ["떨어짐", "밀림", "양부족", "넘침", "기포", "오염", "찢어짐", "단차", "삽입불량", "씹힘", "수축", "기타"],
  "LQ2A_본드로봇": ["압출스코치", "오염", "조인트떨어짐", "클립좌우혼입", "단차", "밀림", "기타"],
  "LQ2A_검사": ["조인트불량", "사상불량", "오염", "클립좌우혼입", "넘침", "밀림", "스코치", "미성형", "단차", "길이불량", "기타"],

  // Fallbacks for legacy process IDs
  "9BQC_정재단": ["스코치", "외면흠", "오염", "길이미달", "와이어노출", "단컷팅", "기타"],
  "9BQC_단컷팅": ["스코치", "외면흠", "오염", "단컷팅", "기타"],
  "9BQC_본드_로봇": ["곡률", "스크래치", "도트불량", "면취불량", "조개피(유리깨짐)", "기타"],
  "9BQC_사상가공": ["과사상", "미사상", "마킹누락", "PAD누락", "본드오염", "스코치", "외면흠", "기타"],
  "9BQC_완제품_체크": ["단차", "수축", "크랙", "씹힘", "PAD누락", "마킹누락", "기타"],
  "9BQC_단면_체크": ["이탈", "단면불량", "치수이상", "기타"],
  "9BQC_최종검사": ["조인트불량", "사상불량", "오염", "수축", "단차", "기타"],
  "LQ2A_정재단": ["스코치", "외면흠", "오염", "길이미달", "단면이상", "컷팅", "기타"],
  "LQ2A_후가공": ["압출스코치", "오염", "조인트떨어짐", "양부족", "단차", "밀림", "씹힘", "수축", "사상불량", "기타"],
  "LQ2A_최종검사": ["조인트불량", "사상불량", "오염", "클립좌우혼입", "넘침", "밀림", "스코치", "미성형", "단차", "길이불량", "기타"]
};

// LocalStorage helpers
export const getLocalHanulWorkReports = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HANUL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Failed to load local Hanul work reports:", e);
    return [];
  }
};

export const saveLocalHanulWorkReports = (reports) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HANUL_STORAGE_KEY, JSON.stringify(reports));
    window.dispatchEvent(new CustomEvent("hanul_work_reports_updated", { detail: reports }));
  } catch (e) {
    console.warn("Failed to save local Hanul work reports:", e);
  }
};

// Subscribe to Firestore collection with real-time updates
export const subscribeHanulWorkReports = (callback) => {
  if (!db) {
    callback(getLocalHanulWorkReports());
    return () => {};
  }

  const q = query(collection(db, COLLECTION_NAME));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const reports = [];
      snapshot.forEach((docSnap) => {
        reports.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort descending by date and createdAt
      reports.sort((a, b) => {
        const da = `${a.date || ""} ${a.createdAt || ""}`;
        const db_ = `${b.date || ""} ${b.createdAt || ""}`;
        return db_.localeCompare(da);
      });
      saveLocalHanulWorkReports(reports);
      callback(reports);
    },
    (error) => {
      console.warn("Firestore Hanul subscribe error, fallback to local:", error);
      callback(getLocalHanulWorkReports());
    }
  );

  return unsubscribe;
};

// Save Hanul Work Report (Create or Update)
export const saveHanulWorkReport = async (reportData) => {
  const now = new Date().toISOString();
  const id = reportData.id || `hwr_${reportData.project || "9BQC"}_${reportData.processId || "work"}_${Date.now()}`;

  const cleanReport = {
    ...reportData,
    id,
    updatedAt: now,
    createdAt: reportData.createdAt || now
  };

  // 1. Update local cache immediately
  const localList = getLocalHanulWorkReports();
  const existingIdx = localList.findIndex((r) => r.id === id);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...localList];
    updatedList[existingIdx] = cleanReport;
  } else {
    updatedList = [cleanReport, ...localList];
  }
  saveLocalHanulWorkReports(updatedList);

  // 2. Persist to Firestore
  if (db) {
    try {
      const payload = sanitizeForFirestore(cleanReport);
      await setDoc(doc(db, COLLECTION_NAME, id), payload);
    } catch (e) {
      console.warn("Firestore save Hanul report error (cached locally):", e);
    }
  }

  return cleanReport;
};

// Delete Hanul Work Report
export const deleteHanulWorkReport = async (id) => {
  // 1. Update local cache
  const localList = getLocalHanulWorkReports();
  const filtered = localList.filter((r) => r.id !== id);
  saveLocalHanulWorkReports(filtered);

  // 2. Delete from Firestore
  if (db) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (e) {
      console.warn("Firestore delete Hanul report error:", e);
    }
  }
};

// Export report to Excel
export const exportHanulReportToExcel = (report) => {
  if (!report) return;
  const wb = XLSX.utils.book_new();

  const subDetail = report.subProcess || report.jointType || report.inspectionType || "";
  const subName = subDetail ? ` (${subDetail})` : "";
  const titleRow = [`${report.projectName || report.project} - ${report.processName || report.processId}${subName} 작업일보`];
  const metaRows = [
    ["작업일자", report.date || "", "근무구분", report.shift || "주간", "작업자", report.worker || "한울"],
    ["시작시간", report.startTime || "", "종료시간", report.endTime || "", "공정명", `${report.processName || report.processId}${subName}`],
    ["설비호기", report.machineNo || "-", "칼날교체시간", report.bladeChangeTime || "-", "설비이상조치", report.machineTrouble || "-"]
  ];

  if (report.processId === "조인트") {
    metaRows.push([
      "조인트재료명", report.jointGradeName || "-",
      "재료일자/LOT", report.jointGradeLot || "-",
      "조인트유형", report.jointType || "-"
    ]);
    if (report.subMaterialsLot) {
      const gLot = [report.subMaterialsLot.glass?.start, report.subMaterialsLot.glass?.mid, report.subMaterialsLot.glass?.end].filter(Boolean).join(" / ");
      const dvLot = [report.subMaterialsLot.dv?.start, report.subMaterialsLot.dv?.mid, report.subMaterialsLot.dv?.end].filter(Boolean).join(" / ");
      const brkLot = [report.subMaterialsLot.bracket?.start, report.subMaterialsLot.bracket?.mid, report.subMaterialsLot.bracket?.end].filter(Boolean).join(" / ");
      metaRows.push([
        "부자재 Glass LOT", gLot || "-",
        "부자재 D/V LOT", dvLot || "-",
        "부자재 BRACKET LOT", brkLot || "-"
      ]);
    }
  }

  if (report.processId === "소재준비" && report.subProcess === "정치절단") {
    const part = report.cuttingPart || "FRT";
    metaRows.push([
      "절단구분", part === "FRT" ? "FRT (A/B/C 3단면)" : "RR (A/B 2단면)",
      "칼날교체시간", report.bladeChangeTime || "-",
      "설비이상조치", report.machineTrouble || "-"
    ]);
  }

  if (report.processId === "검사") {
    metaRows.push([
      "검사일보유형", report.inspectionType || "길이검사",
      "부자재LOT", report.padLot || report.dvInspLot || "-",
      "압출소재LOT", `${report.materialLot?.start || "-"} / ${report.materialLot?.mid || "-"}`
    ]);
  }

  let prodRows = [];
  if (report.processId === "소재준비" && report.subProcess === "정치절단") {
    const part = report.cuttingPart || "FRT";
    const specs = part === "FRT" ? [
      { name: "A단면", spec: "881±3mm", target: 881, tol: 3, genKey: "genuineA", badKey: "badA", lotKey: "a", dimKey: "frtA" },
      { name: "B단면", spec: "608±5mm", target: 608, tol: 5, genKey: "genuineB", badKey: "badB", lotKey: "b", dimKey: "frtB" },
      { name: "C단면", spec: "582±5mm", target: 582, tol: 5, genKey: "genuineC", badKey: "badC", lotKey: "c", dimKey: "frtC" }
    ] : [
      { name: "A단면", spec: "488±3mm", target: 488, tol: 3, genKey: "genuineA", badKey: "badA", lotKey: "a", dimKey: "rrA" },
      { name: "B단면", spec: "658±5mm", target: 658, tol: 5, genKey: "genuineB", badKey: "badB", lotKey: "b", dimKey: "rrB" }
    ];

    prodRows.push([`[정치절단 생산 실적 및 치수 검사 (${part})]`]);
    prodRows.push(["단면", "규격", "투입압출 LOT(초/중/종)", "정품(EA)", "불량(EA)", "총절단(EA)", "초물실측(mm)", "중물실측(mm)", "종물실측(mm)", "판정"]);

    let totGen = 0;
    let totBad = 0;
    let allOk = true;

    specs.forEach((s) => {
      const g = Number(report.production?.[s.genKey]) || 0;
      const b = Number(report.production?.[s.badKey]) || 0;
      totGen += g;
      totBad += b;

      const lots = report.cuttingLot?.[part]?.[s.lotKey] || {};
      const lotStr = [lots.start, lots.mid, lots.end].filter(Boolean).join(" / ") || "-";

      const dims = report.measurements?.[s.dimKey] || {};
      const checkOk = (v) => {
        if (!v || v === "") return true;
        const n = parseFloat(v);
        return !isNaN(n) && n >= (s.target - s.tol) && n <= (s.target + s.tol);
      };
      const rowOk = checkOk(dims.start) && checkOk(dims.mid) && checkOk(dims.end);
      if (!rowOk) allOk = false;

      prodRows.push([
        s.name,
        s.spec,
        lotStr,
        g,
        b,
        g + b,
        dims.start || "-",
        dims.mid || "-",
        dims.end || "-",
        rowOk ? "OK" : "NG"
      ]);
    });

    const totGross = totGen + totBad;
    const totYield = totGross > 0 ? ((totGen / totGross) * 100).toFixed(1) + "%" : "100.0%";
    prodRows.push([
      "실적계",
      "-",
      "-",
      totGen,
      totBad,
      totGross,
      `양품률: ${totYield}`,
      "-",
      "-",
      allOk ? "OK" : "NG"
    ]);
  } else if (report.processId === "검사" && report.inspProduction) {
    const isFinal = (report.inspectionType || "").includes("FINAL");
    prodRows.push(["[검사 생산 실적]"]);
    if (isFinal) {
      prodRows.push(["구분", "검사수량(EA)", "정품(EA)", "리워크 D/V", "리워크 직/둔각", "폐기불량(EA)"]);
    } else {
      prodRows.push(["구분", "검사수량(EA)", "정품(EA)", "리워크(EA)", "폐기불량(EA)"]);
    }
    const cols = report.inspectionType === "SQUARE"
      ? [["LH 2호기", "col1"], ["LH 3호기", "col2"], ["RH 2호기", "col3"], ["RH 3호기", "col4"]]
      : report.inspectionType === "FINAL_LH"
      ? [["LH 1호기(PRI)", "col1"], ["LH 1호기(TIN)", "col2"], ["LH 2호기(PRI)", "col3"], ["LH 2호기(TIN)", "col4"]]
      : [["RR LH (PRI)", "col1"], ["RR LH (TIN)", "col2"], ["RR RH (PRI)", "col3"], ["RR RH (TIN)", "col4"]];

    cols.forEach(([label, key]) => {
      const d = report.inspProduction[key] || {};
      if (isFinal) {
        prodRows.push([label, d.insp || 0, d.genuine || 0, d.reworkDv || 0, d.reworkAngle || 0, d.scrap || 0]);
      } else {
        prodRows.push([label, d.insp || 0, d.genuine || 0, d.rework || 0, d.scrap || 0]);
      }
    });
  } else {
    prodRows = [
      ["[생산 수량]"],
      ["구분", "정품(EA)", "불량(EA)", "리워크/재조인트(EA)", "총생산(EA)", "달성률"],
      [
        "LH / A",
        report.production?.genuineLH ?? report.production?.genuineA ?? report.production?.genuine ?? 0,
        report.production?.badLH ?? report.production?.badA ?? report.production?.bad ?? 0,
        report.production?.reworkLH ?? report.production?.reworkA ?? report.production?.rework ?? 0,
        (Number(report.production?.genuineLH || report.production?.genuineA || 0) + Number(report.production?.badLH || report.production?.badA || 0)),
        "-"
      ],
      [
        "RH / B",
        report.production?.genuineRH ?? report.production?.genuineB ?? 0,
        report.production?.badRH ?? report.production?.badB ?? 0,
        report.production?.reworkRH ?? report.production?.reworkB ?? 0,
        (Number(report.production?.genuineRH || report.production?.genuineB || 0) + Number(report.production?.badRH || report.production?.badB || 0)),
        "-"
      ],
      [
        "Section C (정치절단)",
        report.production?.genuineC ?? 0,
        report.production?.badC ?? 0,
        0,
        (Number(report.production?.genuineC || 0) + Number(report.production?.badC || 0)),
        "-"
      ]
    ];
  }

  const defectRows = [
    ["[불량 내역]"],
    ["불량 항목", "수량(EA)"]
  ];
  if (report.defects && typeof report.defects === "object") {
    Object.entries(report.defects).forEach(([k, v]) => {
      if (Number(v) > 0) defectRows.push([k, v]);
    });
  }

  const noteRows = [
    ["[특기사항 및 설비 이상 조치]"],
    ["설비이상조치", report.machineTrouble || "특이사항 없음"],
    ["칼날교체시간", report.bladeChangeTime || "-"],
    ["특기사항", report.notes || "특이사항 없음"]
  ];

  const allRows = [titleRow, [], ...metaRows, [], ...prodRows, [], ...defectRows, [], ...noteRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);
  XLSX.utils.book_append_sheet(wb, ws, "작업일보");

  const subSlug = subDetail ? `_${subDetail}` : "";
  const fileName = `한울_${report.project}_${report.processId}${subSlug}_${report.date || "일보"}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
