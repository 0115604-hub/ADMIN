import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import * as XLSX from "xlsx";

const INCIDENT_STORAGE_KEY = "oryuk_system_incident_logs_v1";
const INCIDENT_DOC_PATH = ["system_management", "incident_logs"];

// Default Seed Data - Automatically include the actual incident resolutions performed today
export const DEFAULT_INCIDENT_LOGS = [
  {
    id: "inc_20261015_01",
    incidentNo: 1,
    workDate: "2026-10-15",
    category: "전자결재",
    severity: "P1", // P0: 긴급, P1: 중요, P2: 일반
    title: "전자결재 결재대기 카운트 동적 연동 및 협력사 보고서 자동 취합 누락 조치",
    plant: "본사 • 전사",
    reporter: "본사 관리자",
    symptoms: "전자결재 화면 상단 배지 및 현황판의 '결재대기' 건수 카운트가 실시간으로 일치하지 않거나, 협력사 특근/근태보고서 등록 시 결재함으로 즉각 자동 동기화되지 않는 현상",
    rootCause: "결재함 동기화 로직 분리 및 결재 문서 상태 변경 시 실시간 이벤트 트리거 누락으로 인한 상태 불일치",
    resolution: "approvalService.js 내 syncPlantOvertimeToApprovalBox 연동 강화, RecentWorkLogsSummaryModal 및 WorkerDashboard 동적 결재대기 카운트 연산 및 실시간 동기화 완료 (배포 완료)",
    actionCommit: "Commit 202ac86",
    status: "RESOLVED", // RECEIVED, IN_PROGRESS, RESOLVED, VERIFIED
    statusLabel: "조치완료",
    mondayChecked: true, // 월요일 정기 점검 여부
    resolver: "시스템 관리자",
    createdAt: "2026-10-15T09:00:00+09:00",
    resolvedAt: "2026-10-15T09:05:00+09:00",
    notes: "공장별 소속 협력사 특근보고서 실시간 취합 정상화 검증 완료"
  },
  {
    id: "inc_20261015_02",
    incidentNo: 2,
    workDate: "2026-10-15",
    category: "근태관리",
    severity: "P0",
    title: "근태 최종 저장 및 보고서 등록 시 TDZ ReferenceError 런타임 크래시 조치",
    plant: "삼랑진 / 한림공장",
    reporter: "공장 현장관리자",
    symptoms: "근태 현황 화면에서 [💾 등록] 버튼 클릭 후 보고서 팝업창에서 [최종 저장 및 보고서 등록]을 누르면 'Cannot access compMeta before initialization' 오류창이 뜨며 저장이 실패하는 현상",
    rootCause: "handleConfirmAndSaveReportModal 내부에서 compMeta.author(관리자 서명)를 호출하는 코드가 const compMeta 선언문보다 윗라인에 위치하여 자바스크립트 TDZ(Temporal Dead Zone) 호이스팅 런타임 에러 발생",
    resolution: "compMeta 및 회사 라벨을 함수 최상단으로 선언 재조정, cleanCompanyName으로 협력사명 매핑 일치화, 평일 미선택 인원 '정시(🟢)' 원클릭 자동 보정 확인창(window.confirm) 적용 및 실서버 배포 완료",
    actionCommit: "Commit cff95b6",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-15T09:10:00+09:00",
    resolvedAt: "2026-10-15T09:16:00+09:00",
    notes: "평일 근태 미선택자가 있어도 정시 자동채우기 확인창을 통해 원스톱 등록 지원"
  },
  {
    id: "inc_20261015_03",
    incidentNo: 3,
    workDate: "2026-10-15",
    category: "일일생산정보",
    severity: "P1",
    title: "현장 작업자 로그인 시 작업일보 전용 초슬림 화면 개편 및 불필요한 관리자 지표 차단",
    plant: "삼랑진 / 한림공장",
    reporter: "현장 작업자 및 대표",
    symptoms: "현장 일반 작업자(가공동 및 생산원)가 로그인했을 때 관리자용 매입매출, 전사 근태관리대장, 품질게이지, 압출 비가동, 결재함 등 복잡한 차트가 노출되어 현장 입력 사용성이 크게 저하되는 현상",
    rootCause: "작업자와 관리자 구분이 명확하지 않아 모든 작업자가 관리자용 대시보드 및 8개 사이드바 탭을 상속받아 렌더링됨",
    resolution: "isManagerOrAdminUser/isExtrusionWorkerProfile 헬퍼 도입, 작업자 로그인 시 사이드바를 '작업일보' 단독 탭으로 슬림화, 대시보드에서 매입매출/근태/품질/비가동 차단 후 당일 작업일보 등록 및 본인 일보 결재 현황판(상세/수정/삭제) 전용 뷰 제공, 상단 헤더에 '✍️ 일보작성' 원클릭 버튼 연동",
    actionCommit: "Commit 9bf00d5",
    status: "RESOLVED",
    statusLabel: "조치완료",
    mondayChecked: true,
    resolver: "시스템 관리자",
    createdAt: "2026-10-15T10:00:00+09:00",
    resolvedAt: "2026-10-15T10:08:00+09:00",
    notes: "압출동 작업자와 동일하게 일반 작업자도 작업일보만 집중 노출되어 현장 편의성 대폭 극대화"
  }
];

export const INCIDENT_CATEGORIES = [
  "근태관리",
  "전자결재",
  "일일생산정보",
  "품질현황",
  "압출비가동",
  "세금계산서",
  "매출매입분석",
  "시스템/로그인",
  "기타"
];

export const SEVERITY_LEVELS = {
  P0: { label: "P0 (치명적/긴급)", color: "bg-rose-500 text-white border-rose-600", desc: "업무 중단, 저장 실패 등 당일 즉시 핫픽스 대상" },
  P1: { label: "P1 (중요/기능)", color: "bg-amber-500 text-white border-amber-600", desc: "계산식 오차, 결재함 연동 등 주요 기능 결함" },
  P2: { label: "P2 (일반/화면)", color: "bg-blue-500 text-white border-blue-600", desc: "UX 개선, 화면 레이아웃, 문구 수정 등" }
};

export const INCIDENT_STATUSES = {
  RECEIVED: { label: "🚨 접수됨", badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border-rose-300" },
  IN_PROGRESS: { label: "🟡 조치중", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300" },
  RESOLVED: { label: "🟢 조치완료", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-300" },
  VERIFIED: { label: "🔍 월요재점검완료", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border-blue-300" }
};

// Local Storage Helper
export const getLocalIncidentLogs = () => {
  if (typeof window === "undefined") return DEFAULT_INCIDENT_LOGS;
  try {
    const raw = localStorage.getItem(INCIDENT_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(DEFAULT_INCIDENT_LOGS));
      return DEFAULT_INCIDENT_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_INCIDENT_LOGS;
  } catch (e) {
    console.warn("Failed to load local incident logs:", e);
    return DEFAULT_INCIDENT_LOGS;
  }
};

export const saveLocalIncidentLogs = (logs) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent("oryuk_incident_logs_updated", { detail: logs }));
  } catch (e) {
    console.error("Failed to save local incident logs:", e);
  }
};

// Firestore Sync & Subscription
export const subscribeIncidentLogs = (callback) => {
  const local = getLocalIncidentLogs();
  callback(local);

  const handleCustom = (e) => {
    if (e.detail && Array.isArray(e.detail)) {
      callback(e.detail);
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("oryuk_incident_logs_updated", handleCustom);
  }

  if (!db) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("oryuk_incident_logs_updated", handleCustom);
      }
    };
  }

  try {
    const ref = doc(db, ...INCIDENT_DOC_PATH);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && Array.isArray(data.logs)) {
            saveLocalIncidentLogs(data.logs);
            callback(data.logs);
          }
        } else {
          // Initialize remote doc if missing
          setDoc(ref, { logs: local, updatedAt: new Date().toISOString() }).catch(() => {});
        }
      },
      (err) => {
        console.warn("Incident logs cloud sync warning:", err);
      }
    );

    return () => {
      unsub();
      if (typeof window !== "undefined") {
        window.removeEventListener("oryuk_incident_logs_updated", handleCustom);
      }
    };
  } catch (err) {
    console.warn("Error subscribing to incident logs:", err);
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("oryuk_incident_logs_updated", handleCustom);
      }
    };
  }
};

// Save (Add or Update) Single Incident Log
export const saveIncidentLog = async (logItem) => {
  const currentLogs = getLocalIncidentLogs();
  const now = new Date().toISOString();
  let updatedList;

  if (logItem.id) {
    const idx = currentLogs.findIndex((l) => l.id === logItem.id);
    if (idx >= 0) {
      updatedList = [...currentLogs];
      updatedList[idx] = {
        ...currentLogs[idx],
        ...logItem,
        updatedAt: now
      };
    } else {
      updatedList = [
        {
          ...logItem,
          createdAt: logItem.createdAt || now,
          updatedAt: now
        },
        ...currentLogs
      ];
    }
  } else {
    const newId = `inc_${Date.now()}`;
    const nextNo = (currentLogs.length > 0 ? Math.max(...currentLogs.map((l) => Number(l.incidentNo) || 0)) : 0) + 1;
    const newItem = {
      id: newId,
      incidentNo: nextNo,
      workDate: logItem.workDate || new Date().toISOString().slice(0, 10),
      category: logItem.category || "근태관리",
      severity: logItem.severity || "P1",
      title: logItem.title || "신규 오류 리포트",
      plant: logItem.plant || "본사 • 전사",
      reporter: logItem.reporter || "관리자",
      symptoms: logItem.symptoms || "",
      rootCause: logItem.rootCause || "",
      resolution: logItem.resolution || "",
      actionCommit: logItem.actionCommit || "",
      status: logItem.status || "RECEIVED",
      statusLabel: INCIDENT_STATUSES[logItem.status]?.label || "접수됨",
      mondayChecked: Boolean(logItem.mondayChecked),
      resolver: logItem.resolver || "",
      createdAt: now,
      updatedAt: now,
      notes: logItem.notes || ""
    };
    updatedList = [newItem, ...currentLogs];
  }

  // Sort: by incidentNo descending or workDate descending
  updatedList.sort((a, b) => (b.incidentNo || 0) - (a.incidentNo || 0));

  saveLocalIncidentLogs(updatedList);

  if (db) {
    try {
      const ref = doc(db, ...INCIDENT_DOC_PATH);
      await setDoc(ref, { logs: updatedList, updatedAt: now }, { merge: true });
    } catch (e) {
      console.warn("Failed to push incident log to Firestore:", e);
    }
  }

  return updatedList;
};

// Delete Incident Log
export const deleteIncidentLog = async (id) => {
  const currentLogs = getLocalIncidentLogs();
  const updatedList = currentLogs.filter((l) => l.id !== id);
  saveLocalIncidentLogs(updatedList);

  if (db) {
    try {
      const ref = doc(db, ...INCIDENT_DOC_PATH);
      await setDoc(ref, { logs: updatedList, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Failed to delete incident log from Firestore:", e);
    }
  }

  return updatedList;
};

// Export to Excel for Weekly Review
export const exportIncidentLogsToExcel = (logs = []) => {
  const targetLogs = logs.length > 0 ? logs : getLocalIncidentLogs();
  
  const rows = targetLogs.map((l, idx) => ({
    "No": l.incidentNo || (idx + 1),
    "발생일자": l.workDate || "",
    "메뉴분류": l.category || "",
    "심각도": l.severity ? `${l.severity} (${SEVERITY_LEVELS[l.severity]?.label || ""})` : "",
    "진행상태": INCIDENT_STATUSES[l.status]?.label || l.status || "",
    "공장/제보자": `${l.plant || ""} / ${l.reporter || ""}`,
    "오류제목": l.title || "",
    "현상및에러문구": l.symptoms || "",
    "근본원인분석": l.rootCause || "",
    "조치결과및커밋": l.resolution ? `${l.resolution} ${l.actionCommit ? `[${l.actionCommit}]` : ""}` : "",
    "조치담당자": l.resolver || "",
    "조치일시": l.resolvedAt ? l.resolvedAt.replace("T", " ").slice(0, 16) : "",
    "월요재점검여부": l.mondayChecked ? "점검완료" : "미점검",
    "비고": l.notes || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "주간오류조치이력");

  const todayStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `오륙_시스템오류_조치이력리포트_${todayStr}.xlsx`);
};
