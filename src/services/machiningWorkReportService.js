// Machining (가공동) JA, NX4, NX4a, HR G/RUN Work Report Service
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

export const MACHINING_STORAGE_KEY = "machining_work_reports_store_v1";
const COLLECTION_NAME = "machining_work_reports";

// 🌟 가공동 4대 G/RUN 차종 프로젝트 정의
export const MACHINING_PROJECTS = [
  { id: "HR", name: "HR G/RUN", carModel: "HR", partName: "G/RUN (포터)", icon: "🚚", color: "amber" },
  { id: "JA", name: "JA G/RUN", carModel: "JA", partName: "G/RUN (모닝/레이)", icon: "🚗", color: "indigo" },
  { id: "NX5A", name: "NX5a G/RUN", carModel: "NX5a", partName: "G/RUN (투싼 PE)", icon: "⚡", color: "teal" },
  { id: "NX4", name: "NX4 G/RUN", carModel: "NX4", partName: "G/RUN (투싼)", icon: "🚙", color: "blue" }
];

// 🌟 한울과 100% 동일하게 표준화된 4대 핵심 가공 공정 분류
export const MACHINING_PROCESSES = {
  JA: [
    { id: "소재준비", name: "소재준비", subTitle: "정치절단, 단컷팅" },
    { id: "조인트", name: "조인트", subTitle: "FRT, RR, LH/RH 코너 사출" },
    { id: "본드로봇", name: "본드로봇", subTitle: "로봇 본딩 및 도포 작업" },
    { id: "검사", name: "검사", subTitle: "완제품 치수, 단면 확인 및 최종검사" }
  ],
  NX4: [
    { id: "소재준비", name: "소재준비", subTitle: "정치절단, 단컷팅" },
    { id: "조인트", name: "조인트", subTitle: "FRT, RR, LH/RH 코너 사출" },
    { id: "본드로봇", name: "본드로봇", subTitle: "로봇 본딩 및 도포 작업" },
    { id: "검사", name: "검사", subTitle: "완제품 치수, 단면 확인 및 최종검사" }
  ],
  NX5A: [
    { id: "소재준비", name: "소재준비", subTitle: "정치절단, 단컷팅" },
    { id: "조인트", name: "조인트", subTitle: "FRT, RR, LH/RH 코너 사출" },
    { id: "본드로봇", name: "본드로봇", subTitle: "로봇 본딩 및 도포 작업" },
    { id: "검사", name: "검사", subTitle: "완제품 치수, 단면 확인 및 최종검사" }
  ],
  NX4A: [
    { id: "소재준비", name: "소재준비", subTitle: "정치절단, 단컷팅" },
    { id: "조인트", name: "조인트", subTitle: "FRT, RR, LH/RH 코너 사출" },
    { id: "본드로봇", name: "본드로봇", subTitle: "로봇 본딩 및 도포 작업" },
    { id: "검사", name: "검사", subTitle: "완제품 치수, 단면 확인 및 최종검사" }
  ],
  HR: [
    { id: "소재준비", name: "소재준비", subTitle: "정치절단, 단컷팅" },
    { id: "조인트", name: "조인트", subTitle: "FRT, RR, LH/RH 코너 사출" },
    { id: "본드로봇", name: "본드로봇", subTitle: "로봇 본딩 및 도포 작업" },
    { id: "검사", name: "검사", subTitle: "완제품 치수, 단면 확인 및 최종검사" }
  ]
};

// 🌟 가공동 조인트 세부 4대 작업일보 양식 정의
export const MACHINING_JOINT_TYPES = [
  { id: "FRT", label: "G/RUN FRT 사출", shortName: "FRT", partName: "G/RUN FRT 사출성형", desc: "직각/둔각 사출 성형 (FRT A/B)" },
  { id: "RR", label: "G/RUN RR 사출", shortName: "RR", partName: "G/RUN RR 사출성형", desc: "사출 성형 (RR A/B)" },
  { id: "FIXED_LH", label: "G/RUN 코너 (LH)", shortName: "코너 LH", partName: "G/RUN LH 코너/조인트", desc: "코너 사출 및 부자재 조립" },
  { id: "FIXED_RH", label: "G/RUN 코너 (RH)", shortName: "코너 RH", partName: "G/RUN RH 코너/조인트", desc: "코너 사출 및 부자재 조립" }
];

// 🌟 가공동 검사 세부 4대 작업일보 양식 정의
export const MACHINING_INSPECTION_TYPES = [
  {
    id: "LENGTH",
    label: "1. 길이검사 일보",
    shortName: "길이검사",
    sheetTitle: "길이검사 일보",
    desc: "FRT / RR (LH / RH) 주요 치수 및 공차 확인",
    columns: ["FRT LH", "FRT RH", "RR LH", "RR RH"]
  },
  {
    id: "SQUARE",
    label: "2. 직각검사 일보",
    shortName: "직각검사",
    sheetTitle: "직각검사 일보",
    desc: "사출 코너 직각도 및 형상 정밀 측정",
    columns: ["LH 1호기", "LH 2호기", "RH 1호기", "RH 2호기"]
  },
  {
    id: "FINAL_PAIR",
    label: "3. 최종검사 일보 (LH / RH)",
    shortName: "최종검사 (LH/RH)",
    sheetTitle: "최종검사 일보",
    desc: "외관, 단면, 조인트, 리워크, 부자재 전수검사",
    columns: ["LH (양품)", "LH (리워크)", "RH (양품)", "RH (리워크)"]
  },
  {
    id: "FINAL_LH",
    label: "4. 최종검사 일보 (단품/외관)",
    shortName: "최종검사 (단품)",
    sheetTitle: "최종 / 외관 일보",
    desc: "호기별 외관 흠, 스코치, 사상 미흡 전수검사",
    columns: ["1호기", "2호기", "3호기", "4호기"]
  }
];

// 🔒 작업일보 실적 집계 및 작성 대상에서 제외되는 관리자 목록
export const EXCLUDED_MACHINING_MANAGERS = [
  "김동훈",
  "황수현",
  "권태형",
  "최미영",
  "부림텍",
  "유성",
  "한울"
];

export const isExcludedFromMachiningWorkReport = (name) => {
  if (!name) return false;
  const cleanName = String(name).trim();
  return EXCLUDED_MACHINING_MANAGERS.some((mgr) => cleanName.includes(mgr));
};

// 🌟 가공동 생산 작업자 마스터 (31명)
export const MACHINING_WORKERS_MASTER = [
  { no: 1, name: "크리스토퍼", line: "JA", position: "사원", role: "사원" },
  { no: 2, name: "찬턴", line: "JA", position: "사원", role: "사원" },
  { no: 3, name: "로빈", line: "JA", position: "사원", role: "사원" },
  { no: 4, name: "채수연", line: "JA", position: "사원", role: "사원" },
  { no: 5, name: "피아", line: "JA", position: "사원", role: "사원" },
  { no: 6, name: "데이시", line: "JA", position: "사원", role: "사원" },
  { no: 7, name: "짱", line: "JA", position: "사원", role: "사원" },
  { no: 8, name: "김선옥", line: "JA", position: "사원", role: "사원" },
  { no: 9, name: "윤희수", line: "HR", position: "사원", role: "사원" },
  { no: 10, name: "데니스", line: "HR", position: "사원", role: "사원" },
  { no: 11, name: "주재순", line: "HR", position: "사원", role: "사원" },
  { no: 12, name: "김수연", line: "HR", position: "사원", role: "사원" },
  { no: 13, name: "이스라엘", line: "JA.HR", position: "사원", role: "사원" },
  { no: 14, name: "케넷", line: "JA.HR", position: "사원", role: "사원" },
  { no: 15, name: "돈돈", line: "NX4", position: "사원", role: "사원" },
  { no: 16, name: "알라딘", line: "NX4", position: "사원", role: "사원" },
  { no: 17, name: "박순복", line: "NX4", position: "사원", role: "사원" },
  { no: 18, name: "김상아", line: "NX4", position: "사원", role: "사원" },
  { no: 19, name: "김윤자", line: "NX4", position: "사원", role: "사원" },
  { no: 20, name: "김현희", line: "NX4", position: "사원", role: "사원" },
  { no: 21, name: "버나드", line: "NX4a", position: "사원", role: "사원" },
  { no: 22, name: "롤란도", line: "NX4a", position: "사원", role: "사원" },
  { no: 23, name: "김순미", line: "NX4a", position: "사원", role: "사원" },
  { no: 24, name: "양인순", line: "NX4a", position: "사원", role: "사원" },
  { no: 25, name: "손선희", line: "NX4.NX4a", position: "사원", role: "사원" },
  { no: 26, name: "이영숙", line: "NX4.NX4a", position: "사원", role: "사원" },
  { no: 27, name: "수베트", line: "NX4.NX4a", position: "사원", role: "사원" },
  { no: 28, name: "치찬", line: "NX4.NX4a", position: "사원", role: "사원" },
  { no: 29, name: "콩지", line: "NX4.NX4a", position: "사원", role: "사원" },
  { no: 30, name: "최현영", line: "소재준비", position: "반장", role: "반장" },
  { no: 31, name: "장수미", line: "관리", position: "반장", role: "반장" }
];

// Specifications for 가공동 4대 차종 G/RUN
export const MACHINING_SPECS = {
  // 1. JA G/RUN
  "JA_소재준비_정치절단": [
    { key: "frtA", label: "FRT A단면 (정치절단)", spec: "812±3mm", target: 812, tol: 3 },
    { key: "frtB", label: "FRT B단면 (정치절단)", spec: "576±4mm", target: 576, tol: 4 },
    { key: "rrA", label: "RR A단면 (정치절단)", spec: "450±3mm", target: 450, tol: 3 },
    { key: "rrB", label: "RR B단면 (정치절단)", spec: "612±4mm", target: 612, tol: 4 }
  ],
  "JA_소재준비_단컷팅": [
    { key: "frtLh", label: "FRT LH 단컷팅", spec: "72±2mm", target: 72, tol: 2 },
    { key: "frtRh", label: "FRT RH 단컷팅", spec: "72±2mm", target: 72, tol: 2 },
    { key: "rrLh", label: "RR LH 단컷팅", spec: "60±2mm", target: 60, tol: 2 },
    { key: "rrRh", label: "RR RH 단컷팅", spec: "60±2mm", target: 60, tol: 2 }
  ],
  "JA_소재준비": [
    { key: "frtA", label: "FRT A단면 (정치절단)", spec: "812±3mm", target: 812, tol: 3 },
    { key: "frtB", label: "FRT B단면 (정치절단)", spec: "576±4mm", target: 576, tol: 4 },
    { key: "rrA", label: "RR A단면 (정치절단)", spec: "450±3mm", target: 450, tol: 3 },
    { key: "rrB", label: "RR B단면 (정치절단)", spec: "612±4mm", target: 612, tol: 4 }
  ],
  "JA_검사_LENGTH": [
    { key: "frtLh", label: "FRT LH (길이)", spec: "812±3mm", target: 812, tol: 3 },
    { key: "frtRh", label: "FRT RH (길이)", spec: "812±3mm", target: 812, tol: 3 },
    { key: "rrLh", label: "RR LH (길이)", spec: "612±4mm", target: 612, tol: 4 },
    { key: "rrRh", label: "RR RH (길이)", spec: "612±4mm", target: 612, tol: 4 }
  ],
  "JA_검사_SQUARE": [
    { key: "frtAngle", label: "FRT 직각도", spec: "90°±1°", target: 90, tol: 1 },
    { key: "rrAngle", label: "RR 직각도", spec: "90°±1°", target: 90, tol: 1 }
  ],
  "JA_검사": [
    { key: "frtTotal", label: "FRT 완제품 치수", spec: "규격공차" },
    { key: "rrTotal", label: "RR 완제품 치수", spec: "규격공차" },
    { key: "surface", label: "표면 외관 및 조인트 접합", spec: "양호" }
  ],

  // 2. NX4 G/RUN
  "NX4_소재준비_정치절단": [
    { key: "frtA", label: "FRT A단면 (정치절단)", spec: "945±3mm", target: 945, tol: 3 },
    { key: "frtB", label: "FRT B단면 (정치절단)", spec: "678±5mm", target: 678, tol: 5 },
    { key: "rrA", label: "RR A단면 (정치절단)", spec: "524±3mm", target: 524, tol: 3 },
    { key: "rrB", label: "RR B단면 (정치절단)", spec: "710±5mm", target: 710, tol: 5 }
  ],
  "NX4_소재준비_단컷팅": [
    { key: "frtLh", label: "FRT LH 단컷팅", spec: "85±2mm", target: 85, tol: 2 },
    { key: "frtRh", label: "FRT RH 단컷팅", spec: "85±2mm", target: 85, tol: 2 },
    { key: "rrLh", label: "RR LH 단컷팅", spec: "70±2mm", target: 70, tol: 2 },
    { key: "rrRh", label: "RR RH 단컷팅", spec: "70±2mm", target: 70, tol: 2 }
  ],
  "NX4_소재준비": [
    { key: "frtA", label: "FRT A단면 (정치절단)", spec: "945±3mm", target: 945, tol: 3 },
    { key: "frtB", label: "FRT B단면 (정치절단)", spec: "678±5mm", target: 678, tol: 5 },
    { key: "rrA", label: "RR A단면 (정치절단)", spec: "524±3mm", target: 524, tol: 3 },
    { key: "rrB", label: "RR B단면 (정치절단)", spec: "710±5mm", target: 710, tol: 5 }
  ],
  "NX4_검사_LENGTH": [
    { key: "frtLh", label: "FRT LH (길이)", spec: "945±3mm", target: 945, tol: 3 },
    { key: "frtRh", label: "FRT RH (길이)", spec: "945±3mm", target: 945, tol: 3 },
    { key: "rrLh", label: "RR LH (길이)", spec: "710±5mm", target: 710, tol: 5 },
    { key: "rrRh", label: "RR RH (길이)", spec: "710±5mm", target: 710, tol: 5 }
  ],
  "NX4_검사": [
    { key: "frtTotal", label: "FRT 완제품 치수", spec: "규격공차" },
    { key: "rrTotal", label: "RR 완제품 치수", spec: "규격공차" }
  ],

  // 3. NX4a G/RUN
  "NX4A_소재준비_정치절단": [
    { key: "frtA", label: "FRT A단면 (정치절단)", spec: "948±3mm", target: 948, tol: 3 },
    { key: "frtB", label: "FRT B단면 (정치절단)", spec: "680±5mm", target: 680, tol: 5 },
    { key: "rrA", label: "RR A단면 (정치절단)", spec: "526±3mm", target: 526, tol: 3 },
    { key: "rrB", label: "RR B단면 (정치절단)", spec: "712±5mm", target: 712, tol: 5 }
  ],
  "NX4A_소재준비_단컷팅": [
    { key: "frtLh", label: "FRT LH 단컷팅", spec: "85±2mm", target: 85, tol: 2 },
    { key: "frtRh", label: "FRT RH 단컷팅", spec: "85±2mm", target: 85, tol: 2 },
    { key: "rrLh", label: "RR LH 단컷팅", spec: "70±2mm", target: 70, tol: 2 },
    { key: "rrRh", label: "RR RH 단컷팅", spec: "70±2mm", target: 70, tol: 2 }
  ],
  "NX4A_소재준비": [
    { key: "frtA", label: "FRT A단면 (정치절단)", spec: "948±3mm", target: 948, tol: 3 },
    { key: "frtB", label: "FRT B단면 (정치절단)", spec: "680±5mm", target: 680, tol: 5 },
    { key: "rrA", label: "RR A단면 (정치절단)", spec: "526±3mm", target: 526, tol: 3 },
    { key: "rrB", label: "RR B단면 (정치절단)", spec: "712±5mm", target: 712, tol: 5 }
  ],
  "NX4A_검사_LENGTH": [
    { key: "frtLh", label: "FRT LH (길이)", spec: "948±3mm", target: 948, tol: 3 },
    { key: "frtRh", label: "FRT RH (길이)", spec: "948±3mm", target: 948, tol: 3 },
    { key: "rrLh", label: "RR LH (길이)", spec: "712±5mm", target: 712, tol: 5 },
    { key: "rrRh", label: "RR RH (길이)", spec: "712±5mm", target: 712, tol: 5 }
  ],
  "NX4A_검사": [
    { key: "frtTotal", label: "FRT 완제품 치수", spec: "규격공차" },
    { key: "rrTotal", label: "RR 완제품 치수", spec: "규격공차" }
  ],

  // 4. HR G/RUN
  "HR_소재준비_정치절단": [
    { key: "frtA", label: "FRT A단면 (정치절단)", spec: "865±3mm", target: 865, tol: 3 },
    { key: "frtB", label: "FRT B단면 (정치절단)", spec: "598±4mm", target: 598, tol: 4 },
    { key: "rrA", label: "RR A단면 (정치절단)", spec: "475±3mm", target: 475, tol: 3 },
    { key: "rrB", label: "RR B단면 (정치절단)", spec: "635±4mm", target: 635, tol: 4 }
  ],
  "HR_소재준비_단컷팅": [
    { key: "frtLh", label: "FRT LH 단컷팅", spec: "78±2mm", target: 78, tol: 2 },
    { key: "frtRh", label: "FRT RH 단컷팅", spec: "78±2mm", target: 78, tol: 2 },
    { key: "rrLh", label: "RR LH 단컷팅", spec: "64±2mm", target: 64, tol: 2 },
    { key: "rrRh", label: "RR RH 단컷팅", spec: "64±2mm", target: 64, tol: 2 }
  ],
  "HR_소재준비": [
    { key: "frtA", label: "FRT A단면 (정치절단)", spec: "865±3mm", target: 865, tol: 3 },
    { key: "frtB", label: "FRT B단면 (정치절단)", spec: "598±4mm", target: 598, tol: 4 },
    { key: "rrA", label: "RR A단면 (정치절단)", spec: "475±3mm", target: 475, tol: 3 },
    { key: "rrB", label: "RR B단면 (정치절단)", spec: "635±4mm", target: 635, tol: 4 }
  ],
  "HR_검사_LENGTH": [
    { key: "frtLh", label: "FRT LH (길이)", spec: "865±3mm", target: 865, tol: 3 },
    { key: "frtRh", label: "FRT RH (길이)", spec: "865±3mm", target: 865, tol: 3 },
    { key: "rrLh", label: "RR LH (길이)", spec: "635±4mm", target: 635, tol: 4 },
    { key: "rrRh", label: "RR RH (길이)", spec: "635±4mm", target: 635, tol: 4 }
  ],
  "HR_검사": [
    { key: "frtTotal", label: "FRT 완제품 치수", spec: "규격공차" },
    { key: "rrTotal", label: "RR 완제품 치수", spec: "규격공차" }
  ]
};

// TPM 설비일상 점검 시트 마스터
export const MACHINING_TPM_MACHINES = [
  { id: "cut_a", name: "1. 정치 절단기 (A단면)", shortName: "정치절단기(A)", icon: "✂️" },
  { id: "cut_b", name: "2. 정치 절단기 (B단면)", shortName: "정치절단기(B)", icon: "✂️" },
  { id: "edge_frt", name: "3. 단컷팅기 (FRT)", shortName: "단컷팅(FRT)", icon: "📐" },
  { id: "edge_rr", name: "4. 단컷팅기 (RR)", shortName: "단컷팅(RR)", icon: "📐" },
  { id: "joint_mould", name: "5. 조인트 사출 성형기", shortName: "조인트사출기", icon: "⚙️" },
  { id: "bond_robot", name: "6. 본딩 로봇 도포기", shortName: "본드로봇", icon: "🤖" }
];

export const MACHINING_TPM_CHECK_ITEMS = [
  { no: 1, content: "작동상태는 양호한가?", method: "육안", desc: "구동 모터, 실린더, 스위치 정상 작동 여부" },
  { no: 2, content: "칼날 교환 주기 확인", method: "설비기록", desc: "누적 절단 횟수 초과 여부 및 절단면 마모 점검" },
  { no: 3, content: "제단판/작업대 청결 상태", method: "육안", desc: "작업대 및 절단 가이드 이물질, 분진 청소 상태" },
  { no: 4, content: "비상정지(E-Stop) 작동 확인", method: "육안", desc: "비상 정지 버튼 즉시 반응 여부" },
  { no: 5, content: "안전센서 및 인터록 정상 가동", method: "육안", desc: "안전 커버, 센서 및 인터록 정상 가동 여부" },
  { no: 6, content: "절단면/성형면 뜯김 유무", method: "육안", desc: "절단면 버(Burr), 경사각, 성형 버 이상 유무" },
  { no: 7, content: "측정 지그 대비 치수 일치 여부", method: "전용지그", desc: "전용 측정 지그 대비 치수 및 공차 일치 여부" }
];

export const createDefaultMachiningTpmChecks = () => {
  const result = {};
  MACHINING_TPM_MACHINES.forEach((m) => {
    result[m.id] = {};
    MACHINING_TPM_CHECK_ITEMS.forEach((it) => {
      result[m.id][it.no] = "OK";
    });
  });
  return result;
};

// 🌟 불량 항목 분류 (소재준비, 조인트, 본드로봇, 검사)
export const MACHINING_DEFECT_CATEGORIES = {
  // 공통 소재준비
  cutting: ["스코치", "외면흠", "표면오염", "길이미달", "와이어노출", "단컷팅불량", "버(Burr)", "기타"],
  // 공통 조인트
  joint: ["떨어짐", "양부족", "밀림", "단차", "기포", "씹힘", "삽입불량", "수축", "외면흠", "기타"],
  // 공통 본드로봇
  bond: ["도포누락", "과도포", "노즐막힘", "테이프들뜸", "클립오조립", "경화불량", "표면오염", "기타"],
  // 공통 검사
  inspection: [
    "압출_스코치", "압출_외면흠", "압출_오염", "압출_코팅불량", "압출_단면불량",
    "조인트_떨어짐", "조인트_양부족", "조인트_밀림", "조인트_단차", "조인트_기포", "조인트_수축",
    "후가공_길이불량", "후가공_과사상", "후가공_미사상", "후가공_마킹누락", "후가공_본드오염", "기타"
  ]
};

// Get defect category list by project and process
export const getMachiningDefectList = (project, processId, subProcess = "정치절단", jointType = "FRT") => {
  if (processId === "소재준비") return MACHINING_DEFECT_CATEGORIES.cutting;
  if (processId === "조인트") return MACHINING_DEFECT_CATEGORIES.joint;
  if (processId === "본드로봇") return MACHINING_DEFECT_CATEGORIES.bond;
  if (processId === "검사") return MACHINING_DEFECT_CATEGORIES.inspection;
  return MACHINING_DEFECT_CATEGORIES.cutting;
};

// LocalStorage helpers
export const getLocalMachiningWorkReports = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MACHINING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Failed to load local Machining work reports:", e);
    return [];
  }
};

export const saveLocalMachiningWorkReports = (reports) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MACHINING_STORAGE_KEY, JSON.stringify(reports));
    window.dispatchEvent(new CustomEvent("machining_work_reports_updated", { detail: reports }));
  } catch (e) {
    console.warn("Failed to save local Machining work reports:", e);
  }
};

// Subscribe to Firestore collection with real-time updates
export const subscribeMachiningWorkReports = (callback) => {
  if (!db) {
    callback(getLocalMachiningWorkReports());
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
      saveLocalMachiningWorkReports(reports);
      callback(reports);
    },
    (error) => {
      console.warn("Firestore Machining subscribe error, fallback to local:", error);
      callback(getLocalMachiningWorkReports());
    }
  );

  return unsubscribe;
};

// Save Machining Work Report (Create or Update)
export const saveMachiningWorkReport = async (reportData) => {
  const now = new Date().toISOString();
  const id = reportData.id || `mwr_${reportData.project || "JA"}_${reportData.processId || "work"}_${Date.now()}`;

  const cleanReport = {
    ...reportData,
    id,
    plant: "삼랑진공장",
    building: "가공동",
    company: "오륙",
    updatedAt: now,
    createdAt: reportData.createdAt || now
  };

  // 1. Update local cache immediately
  const localList = getLocalMachiningWorkReports();
  const existingIdx = localList.findIndex((r) => r.id === id);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...localList];
    updatedList[existingIdx] = cleanReport;
  } else {
    updatedList = [cleanReport, ...localList];
  }
  saveLocalMachiningWorkReports(updatedList);

  // 2. Persist to Firestore
  if (db) {
    try {
      const payload = sanitizeForFirestore(cleanReport);
      await setDoc(doc(db, COLLECTION_NAME, id), payload);
    } catch (e) {
      console.warn("Firestore save Machining report error (cached locally):", e);
    }
  }

  return cleanReport;
};

// Delete Machining Work Report
export const deleteMachiningWorkReport = async (id) => {
  const localList = getLocalMachiningWorkReports();
  const filtered = localList.filter((r) => r.id !== id);
  saveLocalMachiningWorkReports(filtered);

  if (db && id) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (e) {
      console.warn("Firestore delete Machining report error:", e);
    }
  }
};

// Export to Excel
export const exportMachiningReportToExcel = (report) => {
  if (!report) return;

  const wb = XLSX.utils.book_new();
  const titleRow = [`(주)오륙 삼랑진공장 가공동 [${report.project || "JA"} G/RUN] ${report.processId || "가공"} 작업일보`];

  const subDetail = report.processId === "소재준비"
    ? report.subProcess || "정치절단"
    : report.processId === "조인트"
    ? report.jointType || "FRT"
    : report.processId === "검사"
    ? report.inspectionType || "LENGTH"
    : "";

  const metaRows = [
    ["작성일자", report.date || "-", "근무구분", report.shift || "주간", "작업자", report.worker || "-"],
    ["공장/동", "삼랑진공장 가공동", "차종/품명", `${report.project || "JA"} G/RUN`, "공정명", `${report.processId || "-"} (${subDetail})`],
    ["설비/호기", report.machineNo || "-", "대차번호", report.dollyNo || "-", "작업시간", `${report.startTime || "06:30"} ~ ${report.endTime || "17:30"}`]
  ];

  let prodRows = [];
  if (report.processId === "검사" && report.inspProduction) {
    prodRows.push(["[검사 생산 실적]"]);
    prodRows.push(["구분", "검사수량(EA)", "정품(EA)", "리워크(EA)", "폐기불량(EA)"]);
    const cols = [
      ["1구분 (LH 1호기)", "col1"],
      ["2구분 (LH 2호기)", "col2"],
      ["3구분 (RH 1호기)", "col3"],
      ["4구분 (RH 2호기)", "col4"]
    ];
    cols.forEach(([label, key]) => {
      const d = report.inspProduction[key] || {};
      prodRows.push([label, d.insp || 0, d.genuine || 0, d.rework || 0, d.scrap || 0]);
    });
  } else {
    prodRows = [
      ["[생산 수량]"],
      ["구분", "정품(EA)", "불량(EA)", "리워크(EA)", "총생산(EA)", "양품률"],
      [
        "LH / A단면",
        report.production?.genuineLH ?? report.production?.genuineA ?? report.production?.genuine ?? 0,
        report.production?.badLH ?? report.production?.badA ?? report.production?.bad ?? 0,
        report.production?.reworkLH ?? report.production?.reworkA ?? 0,
        (Number(report.production?.genuineLH || report.production?.genuineA || 0) + Number(report.production?.badLH || report.production?.badA || 0)),
        "-"
      ],
      [
        "RH / B단면",
        report.production?.genuineRH ?? report.production?.genuineB ?? 0,
        report.production?.badRH ?? report.production?.badB ?? 0,
        report.production?.reworkRH ?? report.production?.reworkB ?? 0,
        (Number(report.production?.genuineRH || report.production?.genuineB || 0) + Number(report.production?.badRH || report.production?.badB || 0)),
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
  const fileName = `오륙_가공동_${report.project || "JA"}_${report.processId || "일보"}${subSlug}_${report.date || "일보"}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
