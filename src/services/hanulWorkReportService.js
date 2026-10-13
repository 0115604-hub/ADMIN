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
    { id: "소재준비", name: "소재준비", subTitle: "정재단, 단컷팅" },
    { id: "조인트", name: "조인트", subTitle: "사출 성형, 조인트 작업" },
    { id: "본드로봇", name: "본드로봇", subTitle: "로봇 본딩 및 도포 작업" },
    { id: "검사", name: "검사", subTitle: "완제품, 단면 확인 및 최종검사" }
  ],
  "LQ2A": [
    { id: "소재준비", name: "소재준비", subTitle: "정재단, 단컷팅" },
    { id: "조인트", name: "조인트", subTitle: "조인트 프레스 및 가류 작업" },
    { id: "본드로봇", name: "본드로봇", subTitle: "본딩 및 클립/후가공 조립" },
    { id: "검사", name: "검사", subTitle: "완제품 치수 및 최종검사" }
  ]
};

// Master list of 26 Hanul workers (1~22: 9BQC, 23~26: LQ2)
export const HANUL_WORKERS_MASTER = [
  { no: 1, name: "황수현", position: "선임", line: "관리부", role: "관리" },
  { no: 2, name: "박종미", position: "반장/조장", line: "관리부", role: "반장" },
  { no: 3, name: "마이클", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 4, name: "마크", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 5, name: "로렉스", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 6, name: "무피드", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 7, name: "마틴", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 8, name: "박민정", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 9, name: "지라완", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 10, name: "레이놀드", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 11, name: "맥리", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 12, name: "조제인", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 13, name: "새드릭", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 14, name: "니사낫", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 15, name: "수파따", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 16, name: "와히드", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 17, name: "찬티마", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 18, name: "데이브", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 19, name: "위간", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 20, name: "프랭클린", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 21, name: "에일리", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 22, name: "마이카", position: "작업원", line: "9BQC", role: "작업원" },
  { no: 23, name: "알프레도", position: "작업원", line: "LQ2", role: "작업원" },
  { no: 24, name: "아이린", position: "작업원", line: "LQ2", role: "작업원" },
  { no: 25, name: "에릭", position: "작업원", line: "LQ2", role: "작업원" },
  { no: 26, name: "언", position: "작업원", line: "LQ2", role: "작업원" }
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

// Common initial defect categories by process
export const DEFAULT_DEFECT_CATEGORIES = {
  // 🌟 단순화 4개 공정 (소재준비: 정치절단 / 단컷팅 세부 분기, 조인트, 본드로봇, 검사)
  "9BQC_소재준비_정치절단": ["스코치", "외면흠", "오염", "길이미달", "와이어노출", "공정간_길이", "기타"],
  "9BQC_소재준비_단컷팅": ["스코치", "외면흠", "오염", "공정간_단컷팅", "기타"],
  "9BQC_소재준비": ["스코치", "외면흠", "오염", "길이미달", "와이어노출", "단컷팅불량", "기타"],
  "9BQC_조인트": ["떨어짐", "양부족", "밀림", "단차", "기포", "씹힘", "오염", "꼬임", "삽입불량", "수축", "기타"],
  "9BQC_본드로봇": ["곡률", "스크래치", "도트불량", "면취불량", "조개피(유리깨짐)", "노즐막힘", "기타"],
  "9BQC_검사": ["단차", "수축", "크랙", "씹힘", "이탈", "단면불량", "사상불량", "외관불량", "기타"],

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

  const subName = report.subProcess ? ` (${report.subProcess})` : "";
  const titleRow = [`${report.projectName || report.project} - ${report.processName || report.processId}${subName} 작업일보`];
  const metaRows = [
    ["작업일자", report.date || "", "근무구분", report.shift || "주간", "작업자", report.worker || "한울"],
    ["시작시간", report.startTime || "", "종료시간", report.endTime || "", "공정명", `${report.processName || report.processId}${subName}`],
    ["설비호기", report.machineNo || "-", "칼날교체시간", report.bladeChangeTime || "-", "설비이상조치", report.machineTrouble || "-"]
  ];

  const prodRows = [
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

  const subSlug = report.subProcess ? `_${report.subProcess}` : "";
  const fileName = `한울_${report.project}_${report.processId}${subSlug}_${report.date || "일보"}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
