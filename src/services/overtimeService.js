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
import { syncPlantOvertimeToApprovalBox } from "./approvalService";
import { sanitizeForFirestore } from "../utils/firestoreUtils";

// ⭐ 공장별 소속 협력업체 취합 체계 (Plant-to-Company Mapping)
// 삼랑진공장: (주)오륙, 유성
// 한림공장: (주)조영산업, 한울, 부림텍
export const PLANT_COMPANIES = {
  "삼랑진공장": ["오륙", "유성"],
  "한림공장": ["조영", "한울", "부림텍"]
};

export const getPlantForCompany = (companyName) => {
  const str = String(companyName || "").trim();
  if (str.includes("오륙") || str.includes("유성")) {
    return "삼랑진공장";
  }
  return "한림공장";
};

// ⭐ 2026년 대한민국 법정 공휴일 (추석 연휴, 설날, 한글날 등 법정 공휴일 특근)
export const KOREAN_PUBLIC_HOLIDAYS_2026 = new Set([
  "2026-01-01", // 신정
  "2026-02-16", "2026-02-17", "2026-02-18", // 설날 연휴
  "2026-03-01", "2026-03-02", // 삼일절 및 대체공휴일
  "2026-05-05", // 어린이날
  "2026-05-24", "2026-05-25", // 부처님오신날 및 대체공휴일
  "2026-06-06", // 현충일
  "2026-08-15", "2026-08-17", // 광복절 및 대체공휴일
  "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27", // 추석 연휴 (9/24 목, 9/25 금, 9/26 토, 9/27 일)
  "2026-10-03", // 개천절
  "2026-10-09", // 한글날
  "2026-12-25"  // 성탄절
]);

// ⭐ Precise Date & Weekend/Holiday Overtime Helpers (토·일 주말 및 법정 공휴일은 특근으로 판정, 일반 평일은 100% 정상 근태)
export const isWeekendByDate = (dateStrOrDay, year = 2026, month = 10) => {
  if (typeof dateStrOrDay === "number") {
    const d = dateStrOrDay;
    const y = year || 2026;
    const m = month || 10;
    const ymd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (KOREAN_PUBLIC_HOLIDAYS_2026.has(ymd)) return true;
    if (y === 2026 && m === 9 && [5, 6, 12, 13, 19, 20, 24, 25, 26, 27].includes(d)) return true;
    if (y === 2026 && m === 10 && [3, 4, 9, 10, 11, 17, 18, 24, 25, 31].includes(d)) return true;
    const dt = new Date(y, m - 1, d);
    const dayOfWeek = dt.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }
  if (!dateStrOrDay) return false;

  const rawStr = String(dateStrOrDay).trim();

  // 1. YYYY-MM-DD 또는 YYYY.MM.DD 형식 파싱
  const p = rawStr.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (p) {
    const y = parseInt(p[1], 10);
    const m = parseInt(p[2], 10);
    const d = parseInt(p[3], 10);
    const ymd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (KOREAN_PUBLIC_HOLIDAYS_2026.has(ymd)) return true;
    if (y === 2026 && m === 9 && [5, 6, 12, 13, 19, 20, 24, 25, 26, 27].includes(d)) return true;
    if (y === 2026 && m === 10 && [3, 4, 9, 10, 11, 17, 18, 24, 25, 31].includes(d)) return true;
    const dt = new Date(y, m - 1, d);
    if (!isNaN(dt.getTime())) {
      const dayOfWeek = dt.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    }
  }

  // 2. X월 X일 형식 파싱
  const mMatch = rawStr.match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
  if (mMatch) {
    const y = mMatch[1] ? parseInt(mMatch[1], 10) : (year || 2026);
    const m = parseInt(mMatch[2], 10);
    const d = parseInt(mMatch[3], 10);
    const ymd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (KOREAN_PUBLIC_HOLIDAYS_2026.has(ymd)) return true;
    if (y === 2026 && m === 9 && [5, 6, 12, 13, 19, 20, 24, 25, 26, 27].includes(d)) return true;
    if (y === 2026 && m === 10 && [3, 4, 9, 10, 11, 17, 18, 24, 25, 31].includes(d)) return true;
    const dt = new Date(y, m - 1, d);
    if (!isNaN(dt.getTime())) {
      const dayOfWeek = dt.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    }
  }

  // 3. 명시적 요일 텍스트 확인 ((토), (일) -> 특근)
  const match = rawStr.match(/\(([일월화수목금토])\)|([일월화수목금토])요일/);
  if (match) {
    const dayChar = match[1] || match[2];
    if (dayChar === "토" || dayChar === "일") return true;
  }

  return false;
};

export const INITIAL_OVERTIME_REPORTS = [];

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

// ⭐ 평일 보고서 자동 정제 함수: 월~금 평일 보고서는 100% 근태보고서 및 작성자 전결(APPROVED)로 보정
export const normalizeOvertimeReport = (report) => {
  if (!report) return report;
  const workDate = report.workDate || "";
  const isWeekend = isWeekendByDate(workDate || report.title || report.workDateFormatted);

  if (!isWeekend) {
    let cleanTitle = report.title || "";
    if (cleanTitle.includes("특근보고서") || cleanTitle.includes("특근실시보고서")) {
      cleanTitle = cleanTitle.replace(/특근보고서/g, "근태보고서").replace(/특근실시보고서/g, "근태보고서");
    }
    const drafterName = report.author?.split(" ")[0] || "작성자";
    const drafterTitle = report.authorTitle || "선임";
    const plantName = report.plant || getPlantForCompany(report.company || "");
    const dateStr = workDate || report.updatedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10);

    return {
      ...report,
      title: cleanTitle,
      reportType: "근태보고서",
      status: "APPROVED",
      approval: [
        { role: "담당", name: drafterName, title: drafterTitle, status: "APPROVED", date: dateStr, comment: "작성자 전결" },
        { role: "책임", name: plantName === "한림공장" ? "김동욱" : "윤경수", title: "책임", status: "APPROVED", date: dateStr, comment: "전결" },
        { role: "이사", name: "이명재", title: "이사", status: "APPROVED", date: dateStr, comment: "전결" },
        { role: "대표", name: "권태형", title: "대표", status: "APPROVED", date: dateStr, comment: "전결" }
      ]
    };
  }
  return report;
};

export const getLocalOvertimeReports = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeOvertimeReport);
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const saveLocalOvertimeReports = (reports) => {
  try {
    const cleanList = (reports || []).map(normalizeOvertimeReport);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanList));
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
        const remoteReports = [];
        if (!snapshot.empty) {
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // ⭐ Ignore & clean legacy auto-generated lumped reports
            if (data.isAutoGenerated || docSnap.id.startsWith("report_samrangjin_2026_09_") || docSnap.id.startsWith("report_hanlim_2026_09_")) {
              try {
                deleteDoc(doc(db, COLLECTION_NAME, docSnap.id));
              } catch (e) {}
              return;
            }
            remoteReports.push({ id: docSnap.id, ...data });
          });
          // Sort by updatedAt descending, then workDate descending
          remoteReports.sort((a, b) => (b.updatedAt || b.workDate || "").localeCompare(a.updatedAt || a.workDate || ""));
        }
        const normalizedList = remoteReports.map(normalizeOvertimeReport);
        saveLocalOvertimeReports(normalizedList);
        if (callback) callback(normalizedList);
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
    workDate: report.workDate || "",
    workDateFormatted: formatKoreanWorkDate(report.workDate),
    updatedAt: now,
    author: report.author || "작성자",
    authorTitle: report.authorTitle || "선임",
    items: (report.items || []).map((it, idx) => ({
      id: it.id || `rep_item_${report.workDate || "day"}_${idx}_${it.workerName || idx}`,
      no: it.no || (idx + 1),
      company: it.company || "",
      factory: it.factory || "",
      dept: it.dept || "",
      line: it.line || "",
      category: it.category || it.line || "",
      workerName: it.workerName || "",
      position: it.position || "작업원",
      attendanceCode: it.attendanceCode || "",
      startTime: it.startTime || "08:00",
      endTime: it.endTime || "17:00",
      hours: Number(it.hours) || 0,
      otHours: Number(it.otHours) || 0,
      count: Number(it.count) || 1,
      workContent: it.workContent || "",
      workDetails: it.workDetails || ""
    })),
    reasons: (report.reasons || []).map(r => {
      if (dayOfWeek && /\([일월화수목금토]\)|\(평일\)/.test(r)) {
        return r.replace(/\([일월화수목금토]\)|\(평일\)/g, `(${dayOfWeek})`);
      }
      return r;
    }),
    approval: (report.approval || [
      { role: "담당", name: report.author || "담당", title: "선임", status: "APPROVED", date: "", comment: "기안" },
      { role: "책임", name: report.plant === "한림공장" ? "김동욱" : "윤경수", title: "책임", status: "PENDING", date: "", comment: "" },
      { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
      { role: "대표", name: "권태형", title: "대표", status: "WAITING", date: "" }
    ]).map(st => ({
      role: st.role || "담당",
      name: st.name || "작성자",
      title: st.title || "선임",
      status: st.status || "WAITING",
      date: st.date || "",
      comment: st.comment || ""
    }))
  };

  // ⭐ 평일 근태보고서는 작성자 전결로 자동 승인 처리 (결재대기 없음)
  const isWeekendReport = cleanReport.workDate ? isWeekendByDate(cleanReport.workDate) : false;
  const isExplicitOvertime = cleanReport.reportType === "특근보고서" || (cleanReport.title && cleanReport.title.includes("특근") && !cleanReport.title.includes("근태"));
  if (!isWeekendReport && !isExplicitOvertime) {
    cleanReport.status = "APPROVED";
    cleanReport.approval = [
      { role: "담당", name: cleanReport.author || "담당", title: cleanReport.authorTitle || "선임", status: "APPROVED", date: cleanReport.workDate || now.slice(0, 10), comment: "작성자 전결" },
      { role: "책임", name: cleanReport.plant === "한림공장" ? "김동욱" : "윤경수", title: "책임", status: "APPROVED", date: cleanReport.workDate || now.slice(0, 10), comment: "전결" },
      { role: "이사", name: "이명재", title: "이사", status: "APPROVED", date: cleanReport.workDate || now.slice(0, 10), comment: "전결" },
      { role: "대표", name: "권태형", title: "대표", status: "APPROVED", date: cleanReport.workDate || now.slice(0, 10), comment: "전결" }
    ];
  }

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

  // Sync to Cloud Firestore with recursive sanitization
  try {
    const payload = sanitizeForFirestore(cleanReport);
    await setDoc(doc(db, COLLECTION_NAME, cleanReport.id), payload, { merge: true });
  } catch (e) {
    console.warn("Firestore overtime save error:", e);
  }

  // ⭐ Auto-sync to Electronic Approval Box ONLY for weekend overtime
  if (isWeekendReport || isExplicitOvertime) {
    try {
      await syncPlantOvertimeToApprovalBox({
        plant: cleanReport.plant,
        company: cleanReport.company,
        workDate: cleanReport.workDate
      });
    } catch (e) {
      console.warn("syncPlantOvertimeToApprovalBox error on save:", e);
    }
  }

  return cleanReport;
};

// Delete Overtime Report
export const deleteOvertimeReport = async (reportId) => {
  const currentReports = getLocalOvertimeReports();
  const deletedRep = currentReports.find((r) => r.id === reportId);
  const updatedReports = currentReports.filter((r) => r.id !== reportId);
  saveLocalOvertimeReports(updatedReports);

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, reportId));
  } catch (e) {
    console.warn("Firestore overtime delete error:", e);
  }

  // ⭐ Auto-sync to Electronic Approval Box on deletion (주말 특근인 경우)
  if (deletedRep) {
    const isWeekendReport = deletedRep.workDate ? isWeekendByDate(deletedRep.workDate) : false;
    const isExplicitOvertime = deletedRep.reportType === "특근보고서" || (deletedRep.title && deletedRep.title.includes("특근") && !deletedRep.title.includes("근태"));
    if (isWeekendReport || isExplicitOvertime) {
      try {
        await syncPlantOvertimeToApprovalBox({
          plant: deletedRep.plant,
          company: deletedRep.company,
          workDate: deletedRep.workDate,
          isDeleteAction: true
        });
      } catch (e) {
        console.warn("syncPlantOvertimeToApprovalBox error on delete:", e);
      }
    }
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

  const latestSam = samReports[0] || { id: "", plant: "삼랑진공장", company: "오륙", workDate: "", title: "등록된 특근보고서 없음", items: [] };
  const latestHal = halReports[0] || { id: "", plant: "한림공장", company: "조영", workDate: "", title: "등록된 특근보고서 없음", items: [] };

  const samMetrics = calculateReportMetrics(latestSam);
  const halMetrics = calculateReportMetrics(latestHal);

  // Calculate monthly cumulative costs from all registered reports
  const samMonthCumulative = samReports.reduce((sum, r) => sum + calculateReportMetrics(r).cost, 0);
  const halMonthCumulative = halReports.reduce((sum, r) => sum + calculateReportMetrics(r).cost, 0);

  return {
    samrangjin: {
      ...latestSam,
      date: formatShortWorkDate(latestSam.workDate),
      headcount: samMetrics.headcount,
      manHours: samMetrics.manHours,
      cost: samMetrics.cost,
      lines: samMetrics.lines,
      monthCumulativeCost: samMonthCumulative
    },
    hallim: {
      ...latestHal,
      date: formatShortWorkDate(latestHal.workDate),
      headcount: halMetrics.headcount,
      manHours: halMetrics.manHours,
      cost: halMetrics.cost,
      lines: halMetrics.lines,
      monthCumulativeCost: halMonthCumulative
    },
    totalMonthCumulativeCost: samMonthCumulative + halMonthCumulative,
    totalLatestDailyCost: samMetrics.cost + halMetrics.cost,
    totalLatestHeadcount: samMetrics.headcount + halMetrics.headcount,
    totalLatestManHours: samMetrics.manHours + halMetrics.manHours
  };
};
