// Shared Overtime Report Service with Cloud Firestore Multi-Device Sync
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

export const INITIAL_OVERTIME_REPORTS = [
  {
    id: "report_samrangjin_20260829",
    plant: "삼랑진공장",
    title: "삼랑진공장 특근보고서",
    workDate: "2026-08-29",
    workDateFormatted: "2026년 8월 29일 토요일",
    author: "양인나",
    authorTitle: "선임",
    updatedAt: "2026-08-29T18:00:00.000Z",
    approval: [
      { role: "담당", name: "양인나", status: "완료" },
      { role: "책임", name: "윤경수", status: "완료" },
      { role: "이사", name: "이명재", status: "완료" },
      { role: "대표", name: "권태형", status: "완료" }
    ],
    items: [
      { id: 1, category: "관리자", workContent: "출하 및 공정관리", names: "유동길", hours: 8, count: 1 },
      { id: 2, category: "JA", workContent: "조인트", names: "로빈, 찬턴, 크리스토퍼", hours: 8, count: 3 },
      { id: 3, category: "JA", workContent: "후가공", names: "채수연, 피아, 데이시, 짱", hours: 8, count: 4 },
      { id: 4, category: "JA", workContent: "검사", names: "김선옥", hours: 8, count: 1 },
      { id: 5, category: "JA, HR", workContent: "소재준비", names: "이스라엘", hours: 8, count: 1 },
      { id: 6, category: "NX4", workContent: "소재준비", names: "손선희, 이영숙, 수베트, 치찬, 콩지", hours: 8, count: 5 },
      { id: 7, category: "NX4", workContent: "조인트", names: "버나드, 돈돈, 알라딘", hours: 8, count: 3 },
      { id: 8, category: "NX4a", workContent: "조인트", names: "롤란도", hours: 8, count: 1 },
      { id: 9, category: "NX4a", workContent: "후가공, 검사", names: "김순미, 양인순", hours: 8, count: 2 },
      { id: 10, category: "압출", workContent: "압출", names: "이상은", hours: 12, count: 1 },
      { id: 11, category: "압출", workContent: "TPE 압출", names: "지미", hours: 12, count: 1 },
      { id: 12, category: "압출", workContent: "PCM#3 압출", names: "이수루", hours: 12, count: 1 },
      { id: 13, category: "압출", workContent: "PCM#1 압출", names: "샤면", hours: 12, count: 1 },
      { id: 14, category: "코팅", workContent: "코팅", names: "코팅준", hours: 8, count: 1 },
      { id: 15, category: "공통", workContent: "코팅", names: "이성기, 조마루", hours: 8, count: 2 },
      { id: 16, category: "CE1, DT HOOD", workContent: "소재준비", names: "쏘달", hours: 8, count: 1 },
      { id: 17, category: "DT HOOD", workContent: "조인트", names: "롬나차이, 마리오, 제랄드, 포티퐁", hours: 8, count: 4 }
    ],
    reasons: [
      "1. PCM 1호 : DT SILL SEAL\n   →PCM 3호 : DT 호리젠탈\n   →TPE : JA 압출 가동",
      "2. DT HOOD 코팅 긴급 납품 수량 대응",
      "3. NX4a 단산까지 수출 창고 입고 요청"
    ]
  },
  {
    id: "report_hanlim_20260829",
    plant: "한림공장",
    title: "한림공장 특근보고서",
    workDate: "2026-08-29",
    workDateFormatted: "2026년 8월 29일 토요일",
    author: "우창용",
    authorTitle: "선임",
    updatedAt: "2026-08-29T18:00:00.000Z",
    approval: [
      { role: "담당", name: "우창용", status: "완료" },
      { role: "책임", name: "김동욱", status: "완료" },
      { role: "이사", name: "이명재", status: "완료" },
      { role: "대표", name: "권태형", status: "완료" }
    ],
    items: [
      { id: 1, category: "관리자", workContent: "한림 공장 총괄 지원", names: "이명재, 김동욱", hours: 8, count: 2 },
      { id: 2, category: "CHANNEL", workContent: "밴딩", names: "정상근", hours: 8, count: 1 },
      { id: 3, category: "CHANNEL", workContent: "가공", names: "링링, 유미", hours: 8, count: 2 },
      { id: 4, category: "CE1", workContent: "후가공", names: "팔라, 린", hours: 8, count: 2 },
      { id: 5, category: "DT HOOD", workContent: "후가공", names: "누리", hours: 8, count: 1 },
      { id: 6, category: "JK1", workContent: "조인트", names: "테란스", hours: 8, count: 1 },
      { id: 7, category: "JK1", workContent: "후가공", names: "넷플림, 그레이스, 제인", hours: 8, count: 3 }
    ],
    reasons: [
      "1. 한림 가공동 CHANNEL 밴딩 및 사출 가공 지원",
      "2. CE1 / DT HOOD 후가공 품질 검사 및 납품 대응",
      "3. JK1 조인트 및 후가공 생산 긴급 납품",
      "4. PU KD 재고 사전 확보"
    ]
  }
];

const COLLECTION_NAME = "overtime_reports";
const LOCAL_STORAGE_KEY = "official_overtime_reports_store_v5_live";

export const formatKoreanWorkDate = (dateStr) => {
  if (!dateStr) return "";
  const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const day = days[d.getDay()];
  return `${year}년 ${month}월 ${date}일 ${day}`;
};

export const formatShortWorkDate = (dateStr) => {
  if (!dateStr) return "";
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  const day = days[d.getDay()];
  return `${dateStr} (${day})`;
};

export const calculateReportMetrics = (report) => {
  if (!report || !report.items) {
    return { headcount: 0, manHours: 0, cost: 0, lines: [] };
  }
  const headcount = report.items.reduce((s, it) => s + (Number(it.count) || 0), 0);
  const manHours = report.items.reduce((s, it) => s + ((Number(it.hours) || 0) * (Number(it.count) || 0)), 0);
  const cost = manHours * 15000;

  const map = {};
  report.items.forEach((it) => {
    const cat = it.category || "기타";
    map[cat] = (map[cat] || 0) + (Number(it.count) || 0);
  });
  const lines = Object.entries(map).map(([name, count]) => ({ name, count }));

  return { headcount, manHours, cost, lines };
};

export const getLocalOvertimeReports = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_OVERTIME_REPORTS));
    return INITIAL_OVERTIME_REPORTS;
  } catch (e) {
    return INITIAL_OVERTIME_REPORTS;
  }
};

export const saveLocalOvertimeReports = (reports) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error("Local storage overtime save error:", e);
  }
};

// Real-time Cloud Subscription
export const subscribeOvertimeReports = (callback) => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteReports = [];
          snapshot.forEach((docSnap) => {
            remoteReports.push({ id: docSnap.id, ...docSnap.data() });
          });
          // Sort by updatedAt descending, then workDate descending
          remoteReports.sort((a, b) => (b.updatedAt || b.workDate || "").localeCompare(a.updatedAt || a.workDate || ""));
          saveLocalOvertimeReports(remoteReports);
          if (callback) callback(remoteReports);
        } else {
          // Initialize remote with defaults if empty
          INITIAL_OVERTIME_REPORTS.forEach(async (rep) => {
            try {
              await setDoc(doc(db, COLLECTION_NAME, rep.id), rep, { merge: true });
            } catch (err) {}
          });
          const local = getLocalOvertimeReports();
          if (callback) callback(local);
        }
      },
      (error) => {
        console.warn("Firestore overtime reports sync error (using local):", error.message);
        if (callback) callback(getLocalOvertimeReports());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn("Firestore overtime reports subscribe error:", e);
    if (callback) callback(getLocalOvertimeReports());
    return () => {};
  }
};

// Save (Add or Update) Overtime Report
export const saveOvertimeReport = async (report) => {
  if (!report) return null;
  const now = new Date().toISOString();
  const reportId = report.id || `report_${report.plant === "한림공장" ? "hanlim" : "samrangjin"}_${(report.workDate || "").replace(/-/g, "")}_${Date.now()}`;

  const cleanReport = {
    ...report,
    id: reportId,
    title: report.title || `${report.plant} 특근보고서`,
    workDate: report.workDate,
    workDateFormatted: formatKoreanWorkDate(report.workDate),
    updatedAt: now,
    author: report.author || "작성자",
    authorTitle: report.authorTitle || "선임",
    items: report.items || [],
    reasons: report.reasons || [],
    approval: report.approval || [
      { role: "담당", name: report.author || "담당", status: "완료" },
      { role: "책임", name: report.plant === "한림공장" ? "김동욱" : "윤경수", status: "완료" },
      { role: "이사", name: "이명재", status: "완료" },
      { role: "대표", name: "권태형", status: "완료" }
    ]
  };

  const currentReports = getLocalOvertimeReports();
  const existingIdx = currentReports.findIndex((r) => r.id === cleanReport.id);
  let updatedReports;
  if (existingIdx >= 0) {
    updatedReports = [...currentReports];
    updatedReports[existingIdx] = cleanReport;
  } else {
    updatedReports = [cleanReport, ...currentReports];
  }

  // Sort by updatedAt descending
  updatedReports.sort((a, b) => (b.updatedAt || b.workDate || "").localeCompare(a.updatedAt || a.workDate || ""));
  saveLocalOvertimeReports(updatedReports);

  // Sync to Cloud Firestore
  try {
    await setDoc(doc(db, COLLECTION_NAME, cleanReport.id), cleanReport, { merge: true });
  } catch (e) {
    console.warn("Firestore overtime save error:", e);
  }

  return cleanReport;
};

// Delete Overtime Report
export const deleteOvertimeReport = async (reportId) => {
  const currentReports = getLocalOvertimeReports();
  const updatedReports = currentReports.filter((r) => r.id !== reportId);
  saveLocalOvertimeReports(updatedReports);

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, reportId));
  } catch (e) {
    console.warn("Firestore overtime delete error:", e);
  }

  return updatedReports;
};

// Get Latest Overtime Summary for Dashboard 현황 (Finds the latest modified/registered report per plant)
export const getLatestOvertimeSummary = (allReports = null) => {
  const reports = allReports || getLocalOvertimeReports();

  // Find latest reports sorted by updatedAt descending
  const samReports = reports.filter((r) => r.plant === "삼랑진공장")
    .sort((a, b) => (b.updatedAt || b.workDate || "").localeCompare(a.updatedAt || a.workDate || ""));
  const halReports = reports.filter((r) => r.plant === "한림공장")
    .sort((a, b) => (b.updatedAt || b.workDate || "").localeCompare(a.updatedAt || a.workDate || ""));

  const latestSam = samReports[0] || INITIAL_OVERTIME_REPORTS[0];
  const latestHal = halReports[0] || INITIAL_OVERTIME_REPORTS[1];

  const samMetrics = calculateReportMetrics(latestSam);
  const halMetrics = calculateReportMetrics(latestHal);

  // Calculate monthly cumulative costs from all registered reports (or base sums)
  const samMonthCumulative = samReports.reduce((sum, r) => sum + calculateReportMetrics(r).cost, 0) || 16320000;
  const halMonthCumulative = halReports.reduce((sum, r) => sum + calculateReportMetrics(r).cost, 0) || 5760000;

  return {
    samrangjin: {
      ...latestSam,
      date: formatShortWorkDate(latestSam.workDate),
      headcount: samMetrics.headcount,
      manHours: samMetrics.manHours,
      cost: samMetrics.cost,
      lines: samMetrics.lines,
      monthCumulativeCost: Math.max(samMonthCumulative, 16320000)
    },
    hallim: {
      ...latestHal,
      date: formatShortWorkDate(latestHal.workDate),
      headcount: halMetrics.headcount,
      manHours: halMetrics.manHours,
      cost: halMetrics.cost,
      lines: halMetrics.lines,
      monthCumulativeCost: Math.max(halMonthCumulative, 5760000)
    },
    totalMonthCumulativeCost: Math.max(samMonthCumulative, 16320000) + Math.max(halMonthCumulative, 5760000),
    totalLatestDailyCost: samMetrics.cost + halMetrics.cost,
    totalLatestHeadcount: samMetrics.headcount + halMetrics.headcount,
    totalLatestManHours: samMetrics.manHours + halMetrics.manHours
  };
};
