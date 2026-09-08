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
    id: "report_samrangjin_2026_09_05",
    plant: "삼랑진공장",
    title: "2026년 9월 5일(토) 삼랑진공장 특근실시 보고서",
    workDate: "2026-09-05",
    workDateFormatted: "2026-09-05 (토)",
    author: "양인나 선임",
    authorTitle: "선임",
    updatedAt: "2026-09-05T18:00:00.000Z",
    companies: ["(주)오륙", "유성"],
    approval: [
      { role: "담당", name: "양인나", status: "완료" },
      { role: "책임", name: "윤경수", status: "완료" },
      { role: "이사", name: "이명재", status: "완료" },
      { role: "대표", name: "권태형", status: "완료" }
    ],
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
      { id: 10, category: "CE1", workContent: "CE1 후가공 검사", names: "제인, 그레이스", hours: 8, count: 2 },
      { id: 11, category: "수직 건조", workContent: "수직 건조로 제품 건조", names: "유동길, 조인주", hours: 8, count: 2 }
    ],
    reasons: [
      "1. 삼랑진공장 ((주)오륙 + 유성) 토요 특근 긴급 납품 수량 대응",
      "2. PCM 1호/3호 TPE 압출 및 DT HOOD 코팅 긴급 대응",
      "3. 총 40명 투입 (공수: 382 M/H, 총 노무비: ₩5,730,000)"
    ]
  },
  {
    id: "report_hanlim_2026_09_06",
    plant: "한림공장",
    title: "2026년 9월 6일(일) 한림공장 특근실시 보고서",
    workDate: "2026-09-06",
    workDateFormatted: "2026-09-06 (일)",
    author: "한울 협력업체",
    authorTitle: "선임",
    updatedAt: "2026-09-06T18:00:00.000Z",
    companies: ["(주)조영산업", "한울", "부림텍"],
    approval: [
      { role: "담당", name: "우창용", status: "완료" },
      { role: "책임", name: "김동욱", status: "완료" },
      { role: "이사", name: "이명재", status: "완료" },
      { role: "대표", name: "권태형", status: "완료" }
    ],
    items: [
      { id: 1, category: "9BQC", workContent: "9BQC G/RUN 긴급 조립 및 납품 가공", names: "정상근, 링링", hours: 8, count: 2 }
    ],
    reasons: [
      "1. 한림공장 ((주)조영산업 + 한울 + 부림텍) 일요 특근 9BQC 생산 납품 대응",
      "2. 총 2명 투입 (공수: 16 M/H, 총 노무비: ₩240,000)"
    ]
  },
  {
    id: "report_samrangjin_2026_09_12",
    plant: "삼랑진공장",
    title: "2026년 9월 12일(토) 삼랑진공장 특근실시 보고서 [예정]",
    workDate: "2026-09-12",
    workDateFormatted: "2026-09-12 (토)",
    author: "양인나 선임",
    authorTitle: "선임",
    updatedAt: "2026-09-08T12:00:00.000Z",
    companies: ["(주)오륙", "유성"],
    approval: [
      { role: "담당", name: "양인나", status: "완료" },
      { role: "책임", name: "윤경수", status: "완료" },
      { role: "이사", name: "이명재", status: "완료" },
      { role: "대표", name: "권태형", status: "완료" }
    ],
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
      { id: 10, category: "CE1", workContent: "CE1 후가공 검사", names: "제인, 그레이스", hours: 8, count: 2 },
      { id: 11, category: "수직 건조", workContent: "수직 건조로 제품 건조", names: "유동길, 조인주", hours: 8, count: 2 }
    ],
    reasons: [
      "1. 2026년 9월 12일(토) 다가올 주말 삼랑진공장 ((주)오륙 + 유성) 특근 생산 계획",
      "2. 총 40명 투입 예정 (공수: 382 M/H, 예상 노무비: ₩5,730,000)"
    ]
  },
  {
    id: "report_hanlim_2026_09_12",
    plant: "한림공장",
    title: "2026년 9월 12일(토) 한림공장 특근실시 보고서 [예정]",
    workDate: "2026-09-12",
    workDateFormatted: "2026-09-12 (토)",
    author: "우창용 선임",
    authorTitle: "선임",
    updatedAt: "2026-09-08T12:00:00.000Z",
    companies: ["(주)조영산업", "한울", "부림텍"],
    approval: [
      { role: "담당", name: "우창용", status: "완료" },
      { role: "책임", name: "김동욱", status: "완료" },
      { role: "이사", name: "이명재", status: "완료" },
      { role: "대표", name: "권태형", status: "완료" }
    ],
    items: [
      { id: 1, category: "9BQC", workContent: "9BQC G/RUN 가공 및 포장", names: "정상근, 링링", hours: 8, count: 2 },
      { id: 2, category: "CHANNEL", workContent: "CHANNEL 밴딩 가공", names: "유미, 이상기", hours: 8, count: 2 }
    ],
    reasons: [
      "1. 2026년 9월 12일(토) 다가올 주말 한림공장 ((주)조영산업 + 한울 + 부림텍) 특근 생산 계획",
      "2. 총 4명 투입 예정 (공수: 32 M/H, 예상 노무비: ₩480,000)"
    ]
  }
];

const COLLECTION_NAME = "overtime_reports";
const LOCAL_STORAGE_KEY = "official_overtime_reports_store_v6_plants";

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
