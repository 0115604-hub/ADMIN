// (주)유성 외주가공 작업일보 및 TPM 일상점검 서비스
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeForFirestore } from "../utils/firestoreUtils";
import { getKSTDateString } from "../utils/dateUtils";
import * as XLSX from "xlsx";

const COLLECTION_NAME = "yuseong_work_reports";
const LOCAL_STORAGE_KEY = "factory_yuseong_work_reports_v1";

// 🚗 유성 3대 핵심 작업 아이템 (JK1 Part'g, CE1 Part'g, DT Hood)
export const YUSEONG_PROJECTS = [
  { id: "JK1", name: "JK1 Part'g", partName: "PARTING W/STRIP", icon: "🚗", color: "indigo" },
  { id: "CE1", name: "CE1 Part'g", partName: "PARTING W/STRIP", icon: "🚙", color: "blue" },
  { id: "DT", name: "DT Hood", partName: "HOOD W/STRIP", icon: "⚡", color: "teal" }
];

// ⚙️ 유성 표준 공정 분류 (한울 표준 공정 체계 1:1 수평전개)
export const YUSEONG_PROCESSES = [
  { id: "소재준비", name: "소재준비", sub: "정치절단, 단컷팅", icon: "✂️" },
  { id: "조인트", name: "조인트", sub: "코너 사출, 성형", icon: "⚙️" },
  { id: "본드로봇", name: "본드로봇", sub: "로봇 본딩 및 도포", icon: "🤖" },
  { id: "검사", name: "검사", sub: "치수, 피칭, 최종검사", icon: "🔍" }
];

// 🛠️ 유성 4단계: TPM 설비일상점검 5대 설비
export const YUSEONG_TPM_MACHINES = [
  { id: "M1", name: "정치절단기 1호기", type: "절단설비" },
  { id: "M2", name: "정치절단기 2호기", type: "절단설비" },
  { id: "M3", name: "단컷팅/피칭기", type: "가공설비" },
  { id: "M4", name: "조인트 사출기", type: "사출성형설비" },
  { id: "M5", name: "본드로봇/성형기", type: "자동화설비" }
];

// 🛠️ 유성 4단계: 설비일상점검 7대 항목
export const YUSEONG_TPM_CHECK_ITEMS = [
  { no: 1, content: "설비 외관 청결 및 누유/누기 유무" },
  { no: 2, content: "칼날/금형 마모 상태 및 체결 상태" },
  { no: 3, content: "안전센서 및 비상정지(E-Stop) 작동" },
  { no: 4, content: "공압 및 유압 압력 정상 유지" },
  { no: 5, content: "온도 제어기 및 히터 작동 상태" },
  { no: 6, content: "절단면 뜯김 및 치구 지그 고정 상태" },
  { no: 7, content: "작업장 정리정돈 및 폐기물 분리" }
];

// Default TPM Check State (5 machines x 7 check items = 35 checks)
export const createDefaultYuseongTpmChecks = () => {
  const result = {};
  YUSEONG_TPM_MACHINES.forEach((m) => {
    result[m.id] = {};
    YUSEONG_TPM_CHECK_ITEMS.forEach((it) => {
      result[m.id][it.no] = "OK"; // "OK" | "NG"
    });
  });
  return result;
};

// 📐 유성 3대 아이템별 초·중·종물 규격 치수 (JK1, CE1, DT Hood)
export const YUSEONG_SPECS = {
  JK1: [
    { key: "length", label: "제품 전체 전장(L)", spec: "1,240 ± 2.0mm", target: 1240, tol: 2.0 },
    { key: "notch_dist", label: "노치/피치간 거리", spec: "185 ± 1.5mm", target: 185, tol: 1.5 },
    { key: "cross_w", label: "단면 폭(W)", spec: "21.5 ± 0.5mm", target: 21.5, tol: 0.5 },
    { key: "joint_t", label: "조인트 사출 두께", spec: "4.5 ± 0.3mm", target: 4.5, tol: 0.3 }
  ],
  CE1: [
    { key: "length", label: "제품 전체 전장(L)", spec: "1,180 ± 2.0mm", target: 1180, tol: 2.0 },
    { key: "notch_dist", label: "노치/피치간 거리", spec: "170 ± 1.5mm", target: 170, tol: 1.5 },
    { key: "cross_w", label: "단면 폭(W)", spec: "22.0 ± 0.5mm", target: 22.0, tol: 0.5 },
    { key: "joint_t", label: "조인트 사출 두께", spec: "4.8 ± 0.3mm", target: 4.8, tol: 0.3 }
  ],
  DT: [
    { key: "length", label: "후드 전체 전장(L)", spec: "1,450 ± 3.0mm", target: 1450, tol: 3.0 },
    { key: "lip_h", label: "실링 립 높이(H)", spec: "18.2 ± 0.5mm", target: 18.2, tol: 0.5 },
    { key: "clip_pitch", label: "클립 홀 피치(P)", spec: "120 ± 1.0mm", target: 120, tol: 1.0 },
    { key: "clip_pull", label: "클립 결합 인장력", spec: "5.0kgf 이상", target: 5.0, tol: 99.0 }
  ]
};

// 🚨 유성 공정별 세부 불량 분류
export const YUSEONG_DEFECT_CATEGORIES = {
  소재준비: ["치수불량", "단면뜯김", "각도불량", "칼날자국", "소재오염"],
  조인트: ["미성형", "조인트박리", "단차/버(Burr)", "기포", "체결불량"],
  본드로봇: ["본드누락", "과도포", "테이프들뜸", "접착력부족", "표면오염"],
  검사: ["외관스크래치", "피칭오차", "클립탈락", "길이불량", "기타불량"]
};

// Helper: Read local storage
export const getLocalYuseongWorkReports = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Local storage read error for yuseong work reports:", e);
  }
  return [];
};

// Helper: Save local storage
export const saveLocalYuseongWorkReports = (items) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items || []));
  } catch (e) {
    console.error("Local storage write error for yuseong work reports:", e);
  }
};

// Real-time Cloud Synchronization
// ⚡ 성능 최적화: 싱글톤 멀티플렉싱(Single-Flight) 리스너 & 인메모리 캐시 공유
let activeYuseongReportsUnsub = null;
const yuseongReportsSubscribers = new Set();
let cachedYuseongReports = null;
let yuseongReportsTeardownTimer = null;

export const subscribeYuseongWorkReports = (onUpdate) => {
  if (typeof onUpdate !== "function") return () => {};

  if (!db) {
    onUpdate(getLocalYuseongWorkReports());
    return () => {};
  }

  // 1. 이미 메모리에 캐시가 있거나 로컬스토리지 데이터가 있으면 즉시 전달 (UI 지연 0ms)
  if (cachedYuseongReports) {
    onUpdate(cachedYuseongReports);
  } else {
    const local = getLocalYuseongWorkReports();
    if (local && local.length > 0) {
      cachedYuseongReports = local;
      onUpdate(local);
    }
  }

  yuseongReportsSubscribers.add(onUpdate);

  if (yuseongReportsTeardownTimer) {
    clearTimeout(yuseongReportsTeardownTimer);
    yuseongReportsTeardownTimer = null;
  }

  // 2. 단 하나의 공유 Firestore 리스너만 가동 (중복 쿼리 및 대량 localStorage 쓰기 완전 차단)
  if (!activeYuseongReportsUnsub) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      activeYuseongReportsUnsub = onSnapshot(
        colRef,
        (snapshot) => {
          const remoteList = [];
          if (!snapshot.empty) {
            snapshot.forEach((d) => {
              remoteList.push({ id: d.id, ...d.data() });
            });
          }

          const localList = getLocalYuseongWorkReports();
          const map = new Map();

          localList.forEach((it) => {
            if (it && it.id) map.set(it.id, it);
          });

          remoteList.forEach((it) => {
            if (it && it.id) map.set(it.id, it);
          });

          const merged = Array.from(map.values());
          merged.sort((a, b) => {
            const dateComp = (b.date || "").localeCompare(a.date || "");
            if (dateComp !== 0) return dateComp;
            return (b.createdAt || "").localeCompare(a.createdAt || "");
          });

          cachedYuseongReports = merged;
          saveLocalYuseongWorkReports(merged);
          yuseongReportsSubscribers.forEach((cb) => {
            try { cb(merged); } catch (e) { console.error("Yuseong subscriber cb error:", e); }
          });
        },
        (error) => {
          console.warn("Firestore yuseong_work_reports sync warning:", error);
          const fallback = getLocalYuseongWorkReports();
          cachedYuseongReports = fallback;
          yuseongReportsSubscribers.forEach((cb) => {
            try { cb(fallback); } catch (e) { console.error("Yuseong subscriber cb error:", e); }
          });
        }
      );
    } catch (err) {
      console.warn("Firestore subscription error for yuseong_work_reports:", err);
      const fallback = getLocalYuseongWorkReports();
      onUpdate(fallback);
    }
  }

  // 3. 디바운스된 리스너 해제 (5초 유지)
  return () => {
    yuseongReportsSubscribers.delete(onUpdate);
    if (yuseongReportsSubscribers.size === 0) {
      yuseongReportsTeardownTimer = setTimeout(() => {
        if (yuseongReportsSubscribers.size === 0 && activeYuseongReportsUnsub) {
          activeYuseongReportsUnsub();
          activeYuseongReportsUnsub = null;
        }
      }, 5000);
    }
  };
};

// Save Work Report
export const saveYuseongWorkReport = async (reportData) => {
  const isNew = !reportData.id;
  const id = reportData.id || `yuseong_rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();

  const record = {
    ...reportData,
    id,
    company: "유성",
    updatedAt: now,
    createdAt: reportData.createdAt || now
  };

  // 1. Save to Local Storage immediately
  const localList = getLocalYuseongWorkReports();
  const existingIdx = localList.findIndex((it) => it.id === id);
  if (existingIdx >= 0) {
    localList[existingIdx] = record;
  } else {
    localList.unshift(record);
  }
  saveLocalYuseongWorkReports(localList);

  // 2. Sync to Firestore
  if (db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await setDoc(docRef, sanitizeForFirestore(record), { merge: true });
    } catch (e) {
      console.warn("Firestore save error for yuseong report, local saved:", e);
    }
  }

  return record;
};

// Delete Work Report
export const deleteYuseongWorkReport = async (reportId) => {
  if (!reportId) return;
  const localList = getLocalYuseongWorkReports().filter((it) => it.id !== reportId);
  saveLocalYuseongWorkReports(localList);

  if (db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, reportId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn("Firestore delete error for yuseong report:", e);
    }
  }
};

// Export to Excel
export const exportYuseongReportToExcel = (report) => {
  if (!report) return;

  const wb = XLSX.utils.book_new();

  const headerRows = [
    ["(주)유성 외주가공 작업일보 및 TPM 일상점검표"],
    [`차종 프로젝트: ${report.project || "JK1 Part'g"}`, `공정: ${report.processId || "소재준비"}`, `일자: ${report.date || getKSTDateString()}`],
    [`작업자: ${report.worker || ""}`, `근무: ${report.shift || "주간"}`, `작업시간: ${report.startTime || "08:00"} ~ ${report.endTime || "17:00"}`],
    [`설비호기: ${report.machineNo || "1호기"}`, `원재료 LOT: ${report.materialLot || "-"}`, `조인트 LOT: ${report.jointLot || "-"}`],
    []
  ];

  // 생산 실적
  const prodRows = [
    ["[생산 실적 집계]"],
    ["구분", "수량(EA)"],
    ["정품(양품)", report.summary?.totalGenuine || 0],
    ["불량", report.summary?.totalBad || 0],
    ["리워크", report.summary?.totalRework || 0],
    ["총생산", report.summary?.totalGross || 0],
    ["양품률", `${report.summary?.yieldPct || 100}%`],
    []
  ];

  // 세부 불량 내역
  const defectRows = [
    ["[세부 불량 내역]"],
    ["불량 항목", "불량 수량(EA)"],
    ...Object.entries(report.defects || {}).map(([k, v]) => [k, v || 0]),
    []
  ];

  // TPM 설비점검 요약
  const tpmRows = [
    ["[TPM 설비일상점검 결과]"],
    ["설비명", "점검항목", "판정(OK/NG)"]
  ];
  if (report.tpmChecks) {
    YUSEONG_TPM_MACHINES.forEach((m) => {
      YUSEONG_TPM_CHECK_ITEMS.forEach((it) => {
        const val = report.tpmChecks[m.id]?.[it.no] || "OK";
        tpmRows.push([m.name, it.content, val]);
      });
    });
  }
  if (report.tpmActionNote) {
    tpmRows.push(["이상 발생 조치사항", report.tpmActionNote, ""]);
  }

  const allRows = [...headerRows, ...prodRows, ...defectRows, ...tpmRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);
  XLSX.utils.book_append_sheet(wb, ws, "유성_작업일보");

  const fileName = `유성_${report.project || "JK1"}_${report.processId || "작업일보"}_${report.date || getKSTDateString()}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
