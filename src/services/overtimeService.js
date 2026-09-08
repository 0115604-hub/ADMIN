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

// ⭐ 공장별 소속 협력업체 취합 체계 (Plant-to-Company Mapping)
// 삼랑진공장: (주)오륙, 유성
// 한림공장: (주)조영산업, 한울, 부림텍
export const PLANT_COMPANIES = {
  "삼랑진공장": ["(주)오륙", "유성"],
  "한림공장": ["(주)조영산업", "한울", "부림텍"]
};

export const getPlantForCompany = (companyName) => {
  if (companyName === "(주)오륙" || companyName === "유성" || companyName === "오륙" || companyName === "유성산업") {
    return "삼랑진공장";
  }
  return "한림공장";
};

export const INITIAL_OVERTIME_REPORTS = [
  {
    id: "report_oryuk_2026_09_08",
    plant: "삼랑진공장",
    company: "(주)오륙",
    companies: ["(주)오륙"],
    title: "2026년 9월 8일(화) 삼랑진공장 (주)오륙 근태보고서",
    reportType: "근태보고서",
    workDate: "2026-09-08",
    workDateFormatted: "2026-09-08 (화)",
    author: "양인나 선임",
    authorTitle: "선임",
    updatedAt: "2026-09-08T17:00:00.000Z",
    approval: [
      { role: "담당", name: "양인나", title: "선임", status: "완료" },
      { role: "책임", name: "윤경수", title: "책임", status: "완료" },
      { role: "이사", name: "이명재", title: "이사", status: "완료" },
      { role: "대표", name: "권태형", title: "대표", status: "완료" }
    ],
    totalWorkers: 67,
    totalHours: 536,
    cost: 8040000,
    items: [
      { id: 1, category: "관리부", workContent: "총괄 관리 및 출하 지시", names: "이명재, 설유철, 윤경수, 이창엽, 전재율", hours: 8, count: 5 },
      { id: 2, category: "가공동", workContent: "NX4/NX4a 가공 및 생산 라인 가동", names: "손선희, 이영숙, 양인순, 박순복 외 32명", hours: 8, count: 36 },
      { id: 3, category: "압출동", workContent: "압출 1/2/3호기 생산 및 코팅 라인", names: "이상은, 지미, 이수루, 코팅준 외 22명", hours: 8, count: 26 }
    ],
    reasons: [
      "1. 2026년 9월 8일(화) 삼랑진공장 (주)오륙 정규 생산 라인 가동",
      "2. 총 67명 출근/투입 (총 투입공수: 536 M/H, 노무비: ₩8,040,000)"
    ]
  },
  {
    id: "report_yuseong_2026_09_08",
    plant: "삼랑진공장",
    company: "유성",
    companies: ["유성"],
    title: "2026년 9월 8일(화) 삼랑진공장 유성 근태보고서",
    reportType: "근태보고서",
    workDate: "2026-09-08",
    workDateFormatted: "2026-09-08 (화)",
    author: "김유성 반장",
    authorTitle: "반장",
    updatedAt: "2026-09-08T17:00:00.000Z",
    approval: [
      { role: "담당", name: "김유성", title: "반장", status: "완료" },
      { role: "책임", name: "설유철", title: "책임", status: "완료" },
      { role: "이사", name: "이명재", title: "이사", status: "완료" },
      { role: "대표", name: "유성대표", title: "대표", status: "완료" }
    ],
    totalWorkers: 5,
    totalHours: 40,
    cost: 600000,
    items: [
      { id: 1, category: "압출동", workContent: "유성 압출 1라인 및 후가공", names: "김유성, 정재한, 알렉스, 크리스, 라몬", hours: 8, count: 5 }
    ],
    reasons: [
      "1. 2026년 9월 8일(화) 삼랑진공장 유성 압출 라인 정상 가동",
      "2. 총 5명 투입 (총 공수: 40 M/H, 노무비: ₩600,000)"
    ]
  },
  {
    id: "report_joyoung_2026_09_08",
    plant: "한림공장",
    company: "(주)조영산업",
    companies: ["(주)조영산업"],
    title: "2026년 9월 8일(화) 한림공장 (주)조영산업 근태보고서",
    reportType: "근태보고서",
    workDate: "2026-09-08",
    workDateFormatted: "2026-09-08 (화)",
    author: "송원호 담당",
    authorTitle: "담당",
    updatedAt: "2026-09-08T17:00:00.000Z",
    approval: [
      { role: "담당", name: "송원호", title: "담당", status: "완료" },
      { role: "책임", name: "김동욱", title: "책임", status: "완료" },
      { role: "이사", name: "이명재", title: "이사", status: "완료" },
      { role: "대표", name: "조영대표", title: "대표", status: "완료" }
    ],
    totalWorkers: 3,
    totalHours: 24,
    cost: 360000,
    items: [
      { id: 1, category: "관리부", workContent: "한림 4대 공용 관리 및 출하", names: "송원호, 진태경", hours: 8, count: 2 },
      { id: 2, category: "압출동", workContent: "한림 압출 가동", names: "남기범", hours: 8, count: 1 }
    ],
    reasons: [
      "1. 2026년 9월 8일(화) 한림공장 (주)조영산업 정상 근무",
      "2. 총 3명 투입 (공수: 24 M/H, 노무비: ₩360,000)"
    ]
  },
  {
    id: "report_hanul_2026_09_08",
    plant: "한림공장",
    company: "한울",
    companies: ["한울"],
    title: "2026년 9월 8일(화) 한림공장 한울 근태보고서",
    reportType: "근태보고서",
    workDate: "2026-09-08",
    workDateFormatted: "2026-09-08 (화)",
    author: "안태식 담당",
    authorTitle: "담당",
    updatedAt: "2026-09-08T17:00:00.000Z",
    approval: [
      { role: "담당", name: "안태식", title: "담당", status: "완료" },
      { role: "책임", name: "김동욱", title: "책임", status: "완료" },
      { role: "이사", name: "이명재", title: "이사", status: "완료" },
      { role: "대표", name: "한울대표", title: "대표", status: "완료" }
    ],
    totalWorkers: 5,
    totalHours: 40,
    cost: 600000,
    items: [
      { id: 1, category: "가공동", workContent: "NX4/NX4a/HR G-RUN 가공", names: "정대현, 최민성, 강태양, 이승준, 신현수", hours: 8, count: 5 }
    ],
    reasons: [
      "1. 2026년 9월 8일(화) 한림공장 한울 가공동 가동",
      "2. 총 5명 투입 (공수: 40 M/H, 노무비: ₩600,000)"
    ]
  },
  {
    id: "report_burim_2026_09_08",
    plant: "한림공장",
    company: "부림텍",
    companies: ["부림텍"],
    title: "2026년 9월 8일(화) 한림공장 부림텍 근태보고서",
    reportType: "근태보고서",
    workDate: "2026-09-08",
    workDateFormatted: "2026-09-08 (화)",
    author: "표성준 담당",
    authorTitle: "담당",
    updatedAt: "2026-09-08T17:00:00.000Z",
    approval: [
      { role: "담당", name: "표성준", title: "담당", status: "완료" },
      { role: "책임", name: "김동욱", title: "책임", status: "완료" },
      { role: "이사", name: "이명재", title: "이사", status: "완료" },
      { role: "대표", name: "부림대표", title: "대표", status: "완료" }
    ],
    totalWorkers: 7,
    totalHours: 56,
    cost: 840000,
    items: [
      { id: 1, category: "압출동", workContent: "NX4/HR/JA G-RUN 압출", names: "곽준호, 민동혁, 노승환, 천태진, 석진우", hours: 8, count: 5 },
      { id: 2, category: "관리부", workContent: "4대 공용 관리 및 출하", names: "표성준, 하원식", hours: 8, count: 2 }
    ],
    reasons: [
      "1. 2026년 9월 8일(화) 한림공장 부림텍 정상 가동",
      "2. 총 7명 투입 (공수: 56 M/H, 노무비: ₩840,000)"
    ]
  },
  {
    id: "report_oryuk_2026_09_05",
    plant: "삼랑진공장",
    company: "(주)오륙",
    companies: ["(주)오륙"],
    title: "2026년 9월 5일(토) 삼랑진공장 (주)오륙 특근실시보고서",
    reportType: "특근실시보고서",
    workDate: "2026-09-05",
    workDateFormatted: "2026-09-05 (토)",
    author: "양인나 선임",
    authorTitle: "선임",
    updatedAt: "2026-09-05T18:00:00.000Z",
    approval: [
      { role: "담당", name: "양인나", title: "선임", status: "완료" },
      { role: "책임", name: "윤경수", title: "책임", status: "완료" },
      { role: "이사", name: "이명재", title: "이사", status: "완료" },
      { role: "대표", name: "권태형", title: "대표", status: "완료" }
    ],
    totalWorkers: 38,
    totalHours: 362,
    cost: 5430000,
    items: [
      { id: 1, category: "관리자", workContent: "총괄 관리 및 출하 지시", names: "이명재, 설유철, 윤경수", hours: 8, count: 3 },
      { id: 2, category: "NX4", workContent: "NX4 조인트 및 후가공 생산", names: "손선희, 이영숙, 수베트, 치찬, 콩지, 케넷, 버나드, 돈돈, 알라딘, 롤란도, 김순미", hours: 10, count: 11 },
      { id: 3, category: "NX4a", workContent: "NX4a 후가공 및 검사", names: "양인순, 박순복, 김상아, 김윤자, 김현희", hours: 10, count: 5 },
      { id: 4, category: "PU 찬넬", workContent: "PU 찬넬 조립 1라인", names: "이창엽", hours: 8, count: 1 },
      { id: 5, category: "PU 찬넬", workContent: "PU 찬넬 가공 2라인", names: "전재율, 양인나", hours: 8, count: 2 },
      { id: 6, category: "압출", workContent: "PCM#1/3 및 TPE 압출 가동", names: "이상은, 지미, 이수루", hours: 12, count: 3 },
      { id: 7, category: "8톤 코팅", workContent: "8톤 코팅 라인 긴급 가동", names: "코팅준", hours: 8, count: 1 },
      { id: 8, category: "DT HOOD", workContent: "DT HOOD 조인트 및 코팅 납품 대응", names: "쏘달, 롬나차이, 마리오, 제랄드, 팔라, 누리, 데란스", hours: 10, count: 7 },
      { id: 9, category: "JK1", workContent: "JK1 조인트 후가공", names: "포티퐁, 린, 넷플림", hours: 8, count: 3 },
      { id: 10, category: "CE1", workContent: "CE1 후가공 검사", names: "제인, 그레이스", hours: 8, count: 2 }
    ],
    reasons: [
      "1. 2026년 9월 5일(토) 삼랑진공장 (주)오륙 토요 특근 긴급 납품 수량 대응",
      "2. 총 38명 투입 (공수: 362 M/H, 총 노무비: ₩5,430,000)"
    ]
  },
  {
    id: "report_yuseong_2026_09_05",
    plant: "삼랑진공장",
    company: "유성",
    companies: ["유성"],
    title: "2026년 9월 5일(토) 삼랑진공장 유성 특근실시보고서",
    reportType: "특근실시보고서",
    workDate: "2026-09-05",
    workDateFormatted: "2026-09-05 (토)",
    author: "김유성 반장",
    authorTitle: "반장",
    updatedAt: "2026-09-05T18:00:00.000Z",
    approval: [
      { role: "담당", name: "김유성", title: "반장", status: "완료" },
      { role: "책임", name: "설유철", title: "책임", status: "완료" },
      { role: "이사", name: "이명재", title: "이사", status: "완료" },
      { role: "대표", name: "유성대표", title: "대표", status: "완료" }
    ],
    totalWorkers: 2,
    totalHours: 20,
    cost: 300000,
    items: [
      { id: 1, category: "수직 건조", workContent: "수직 건조로 제품 건조 및 압출 대응", names: "유동길, 조인주", hours: 10, count: 2 }
    ],
    reasons: [
      "1. 2026년 9월 5일(토) 삼랑진공장 유성 토요 특근 가동",
      "2. 총 2명 투입 (공수: 20 M/H, 총 노무비: ₩300,000)"
    ]
  }
];

const COLLECTION_NAME = "overtime_reports";
const LOCAL_STORAGE_KEY = "official_overtime_reports_store_v7_company_reports";

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

  const workDate = report.workDate || "";
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  let dayOfWeek = "";
  if (workDate) {
    const p = workDate.split("-");
    if (p.length === 3) {
      const dt = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
      if (!isNaN(dt.getTime())) dayOfWeek = days[dt.getDay()];
    }
  }

  let finalTitle = report.title || `${report.plant || "전사"} 보고서`;
  if (dayOfWeek && /\([일월화수목금토]\)|\(평일\)/.test(finalTitle)) {
    finalTitle = finalTitle.replace(/\([일월화수목금토]\)|\(평일\)/g, `(${dayOfWeek})`);
  }

  const cleanReport = {
    ...report,
    id: reportId,
    title: finalTitle,
    workDate: report.workDate,
    workDateFormatted: formatKoreanWorkDate(report.workDate),
    updatedAt: now,
    author: report.author || "작성자",
    authorTitle: report.authorTitle || "선임",
    items: report.items || [],
    reasons: (report.reasons || []).map(r => {
      if (dayOfWeek && /\([일월화수목금토]\)|\(평일\)/.test(r)) {
        return r.replace(/\([일월화수목금토]\)|\(평일\)/g, `(${dayOfWeek})`);
      }
      return r;
    }),
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
