import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Clock,
  Printer,
  Download,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Calendar,
  User,
  Save,
  FileText,
  Copy,
  Users,
  Layers,
  Sparkles,
  Award,
  CheckCheck,
  Building2,
  Factory,
  Eye,
  Check,
  ChevronRight,
  ChevronDown,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  BarChart3,
  CalendarDays,
  UserCheck,
  UserPlus,
  UserMinus,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  X,
  FileSpreadsheet,
  ArrowRight,
  Sun,
  Moon,
  Zap,
  CheckSquare,
  PauseCircle,
  Stamp,
  Star
} from "lucide-react";
import PersonnelCardModal from "./PersonnelCardModal.jsx";
import Absence4MModal from "./Absence4MModal.jsx";
import {
  getWorkerPersonnelCard,
  saveWorkerPersonnelCard,
  getSkillMeta,
  getNationalityMeta,
  getInspectorGradeMeta,
  SKILL_LEVEL_META,
  calculateTenureFromJoinDate,
  calculateProcessYearFromJoinDate,
  DEPARTMENTS_LIST,
  POSITIONS_LIST,
  STANDARD_PROCESS_LIST,
  isPartnerCompany,
  normalizeStandardDept,
  normalizeStandardPosition,
  getLocalPersonnelCardsMap,
  subscribePersonnelCards
} from "../services/personnelCardService.js";
import { useAuth } from "../context/AuthContext";
import { useMonth, getCurrentYearMonth } from "../context/MonthContext";
import * as XLSX from "xlsx";
import {
  COMPANIES,
  DEPARTMENTS,
  COMPANY_THEMES, cleanCompanyName,
  COMPANY_APPROVAL_MANAGERS,
  ATTENDANCE_OPTIONS,
  getOptionMeta,
  calculateWorkerDailyHours,
  calculateWorkerMonthlyTotals,
  calculateDailySummary,
  calculateCompanySummary,
  calculateDeptSummary,
  getLocalSmartOvertimeData,
  saveSmartOvertimeData,
  subscribeSmartOvertimeData,
  exportSmartOvertimeToExcel,
  normalizeDept,
  ensureAllCompaniesPresent,
  buildMatrixFromReports
} from "../services/overtimeSmartService.js";
import {
  getLocalOvertimeReports,
  saveOvertimeReport,
  deleteOvertimeReport,
  subscribeOvertimeReports,
  formatKoreanWorkDate,
  formatShortWorkDate,
  calculateReportMetrics,
  PLANT_COMPANIES,
  getPlantForCompany,
  isWeekendByDate
} from "../services/overtimeService";
import {
  syncPlantOvertimeToApprovalBox,
  getLocalApprovalDocs,
  subscribeApprovalDocs,
  approveDocumentStep,
  checkApprovalPermission
} from "../services/approvalService";
import { KWON_SIGNATURE_BLACK } from "../assets/kwonSignature";
import { getKSTDateString } from "../utils/dateUtils";
import { pushModalHistory, subscribeCloseAllModals } from "../utils/modalHistory";

export const getDayOfWeekKorean = (dateStrOrDay, year = 2026, month = 10) => {
  const names = ["일", "월", "화", "수", "목", "금", "토"];
  if (typeof dateStrOrDay === "number") {
    const dt = new Date(year, month - 1, dateStrOrDay);
    return names[dt.getDay()] || "목";
  }
  if (!dateStrOrDay) return "목";
  const p = String(dateStrOrDay).split("-");
  if (p.length === 3) {
    const dt = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    if (!isNaN(dt.getTime())) {
      return names[dt.getDay()] || "목";
    }
  }
  const match = String(dateStrOrDay).match(/\(([일월화수목금토])\)|([일월화수목금토])요일/);
  if (match) return match[1] || match[2] || "목";

  const mMatch = String(dateStrOrDay).match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
  if (mMatch) {
    const y = mMatch[1] ? parseInt(mMatch[1], 10) : year;
    const m = parseInt(mMatch[2], 10);
    const d = parseInt(mMatch[3], 10);
    const dt = new Date(y, m - 1, d);
    if (!isNaN(dt.getTime())) return names[dt.getDay()] || "목";
  }

  return "목";
};

export const getDayOfWeekFullKorean = (dateStrOrDay, year = 2026, month = 10) => {
  const short = getDayOfWeekKorean(dateStrOrDay, year, month);
  return short ? `${short}요일` : "";
};

// ⭐ 보고서 일자 정렬 키 추출 함수 (날짜순 정렬)
export const getReportDateSortKey = (report) => {
  if (!report) return "0000-00-00";
  if (report.workDate) {
    const match = String(report.workDate).match(/(\d{4})?-?(\d{1,2})-(\d{1,2})/);
    if (match) {
      const y = match[1] || "2026";
      const m = String(parseInt(match[2], 10)).padStart(2, "0");
      const d = String(parseInt(match[3], 10)).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  const raw = String(report.workDateFormatted || report.title || "");
  const match2 = raw.match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
  if (match2) {
    const y = match2[1] || "2026";
    const m = String(parseInt(match2[2], 10)).padStart(2, "0");
    const d = String(parseInt(match2[3], 10)).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "2026-10-01";
};

// ⭐ 보고서 제목 내 날짜/요일 및 보고서 유형(평일=근태보고서, 주말=특근보고서) 100% 자동 동기화 함수
export const formatShortMonthDay = (dateStrOrDay, year = 2026, month = 10) => {
  let m = month;
  let day = 1;
  let dayOfWeek = "목";
  if (typeof dateStrOrDay === "number") {
    day = dateStrOrDay;
    dayOfWeek = getDayOfWeekKorean(day, year, m);
  } else if (dateStrOrDay) {
    const match = String(dateStrOrDay).match(/(\d{4})?-?(\d{1,2})-(\d{1,2})/);
    if (match) {
      const y = match[1] ? parseInt(match[1], 10) : year;
      m = parseInt(match[2], 10);
      day = parseInt(match[3], 10);
      dayOfWeek = getDayOfWeekKorean(day, y, m);
    } else {
      const match2 = String(dateStrOrDay).match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
      if (match2) {
        const y = match2[1] ? parseInt(match2[1], 10) : year;
        m = parseInt(match2[2], 10);
        day = parseInt(match2[3], 10);
        dayOfWeek = getDayOfWeekKorean(day, y, m);
      }
    }
  }
  return `${m}월 ${day}일 (${dayOfWeek})`;
};

// ⭐ 공장 뱃지 렌더링 함수
export const renderPlantBadge = (plantName) => {
  let displayPlant = String(plantName || "").trim();
  if (displayPlant.includes("한림") && !displayPlant.includes("삼랑진")) {
    displayPlant = "한림공장";
  } else if (displayPlant.includes("삼랑진") && !displayPlant.includes("한림")) {
    displayPlant = "삼랑진공장";
  } else if (!displayPlant || displayPlant.includes("전체") || displayPlant.includes("삼랑진/한림") || displayPlant.includes("삼랑진한림")) {
    displayPlant = "한림공장";
  }
  const isSam = displayPlant === "삼랑진공장";
  const isHal = displayPlant === "한림공장";
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[11px] font-black border shadow-xs shrink-0 ${
        isSam
          ? "bg-amber-950/90 text-amber-300 border-amber-700/80"
          : isHal
          ? "bg-emerald-950/90 text-emerald-300 border-emerald-700/80"
          : "bg-slate-800 text-slate-300 border-slate-700"
      }`}
    >
      {displayPlant || "삼랑진공장"}
    </span>
  );
};

// ⭐ 협력사 뱃지 렌더링 함수 (오륙, 유성, 조영, 한울, 부림텍 개별 전용 컬러 뱃지)
export const renderCompanyBadge = (compName) => {
  if (!compName) return null;
  const raw = String(compName).replace(/취합/g, "").trim();
  if (raw.includes(",")) {
    const splitNames = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return (
      <div className="flex items-center gap-1 flex-wrap shrink-0">
        {splitNames.map((n) => renderCompanyBadge(n))}
      </div>
    );
  }
  let clean = raw.replace(/\(주\)/g, "").trim();
  if (clean === "조영산업") clean = "조영";
  if (clean === "유성산업") clean = "유성";
  let badgeStyle = "bg-slate-800 text-slate-200 border-slate-700";
  if (clean.includes("오륙")) {
    badgeStyle = "bg-blue-950/90 text-blue-300 border-blue-700/80";
  } else if (clean.includes("유성")) {
    badgeStyle = "bg-cyan-950/90 text-cyan-300 border-cyan-700/80";
  } else if (clean.includes("조영")) {
    badgeStyle = "bg-teal-950/90 text-teal-300 border-teal-700/80";
  } else if (clean.includes("한울")) {
    badgeStyle = "bg-purple-950/90 text-purple-300 border-purple-700/80";
  } else if (clean.includes("부림")) {
    badgeStyle = "bg-rose-950/90 text-rose-300 border-rose-700/80";
  }
  return (
    <span key={clean} className={`px-2 py-0.5 rounded-md text-[11px] font-black border shadow-xs shrink-0 ${badgeStyle}`}>
      {clean}
    </span>
  );
};

export const getFullCompanyPlantLabel = (report) => {
  if (!report) return "삼랑진공장 (주)오륙";
  let comp = report.company || "";
  if (!comp || comp === "전체") {
    if (Array.isArray(report.companies) && report.companies.length === 1) {
      comp = report.companies[0];
    } else if (report.plant === "한림공장") {
      comp = "(주)조영산업";
    } else {
      comp = "(주)오륙";
    }
  }
  let plant = report.plant;
  if (!plant || plant.includes("삼랑진/한림") || plant.includes("전체") || plant.includes("삼랑진한림")) {
    plant = getPlantForCompany(comp);
  }
  if (comp.includes("조영") || comp.includes("한울") || comp.includes("부림")) {
    plant = "한림공장";
  } else if (comp.includes("오륙") || comp.includes("유성")) {
    plant = "삼랑진공장";
  }
  return `${plant} ${comp}`;
};

export const getCleanReportSummary = (report) => {
  if (!report) return "";

  // 1. Check custom reasons/notes (e.g. user entered custom reason or note)
  if (report.reasons && Array.isArray(report.reasons) && report.reasons.length > 0) {
    const meaningfulReason = report.reasons.find((r) => {
      const str = typeof r === "string" ? r : r.text || r.reason || "";
      return (
        str &&
        !str.includes("근태보고서") &&
        !str.includes("특근보고서") &&
        !str.includes("정규 생산 라인 가동") &&
        !str.includes("출근/투입")
      );
    });
    if (meaningfulReason) {
      const text = typeof meaningfulReason === "string" ? meaningfulReason : meaningfulReason.text;
      return text.replace(/^\d+[\.\)]\s*/, "").trim();
    }
  }

  // 2. Extract departments / work contents from items
  if (report.items && Array.isArray(report.items) && report.items.length > 0) {
    const depts = Array.from(
      new Set(report.items.map((it) => it.category || it.dept || "").filter(Boolean))
    );
    if (depts.length > 0) {
      return `${depts.join(" • ")} 생산 가동`;
    }
  }

  return isWeekendByDate(report.workDate || report.title) ? "주말 특근 가동" : "정규 라인 가동";
};

export const getCleanReportTitle = (report) => {
  if (!report) return "";
  const rawTitle = typeof report === "string" ? report : String(report?.title || "");
  const workDate = typeof report === "object" ? String(report?.workDate || "") : "";
  const isWeekend = isWeekendByDate(workDate || rawTitle);
  const correctDayOfWeek = getDayOfWeekKorean(workDate || rawTitle);
  const reportCategory = isWeekend ? "특근보고서" : "근태보고서";

  let dayStr = "";
  if (workDate) {
    const match = String(workDate).match(/(\d{4})?-?(\d{1,2})-(\d{1,2})/);
    if (match) {
      dayStr = `${parseInt(match[2], 10)}월 ${parseInt(match[3], 10)}일(${correctDayOfWeek})`;
    }
  }
  if (!dayStr) {
    const match2 = String(rawTitle).match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
    if (match2) {
      dayStr = `${parseInt(match2[2], 10)}월 ${parseInt(match2[3], 10)}일(${correctDayOfWeek})`;
    } else {
      const now = new Date();
      dayStr = `${now.getMonth() + 1}월 ${now.getDate()}일(${correctDayOfWeek})`;
    }
  }

  const compPlant = typeof report === "object" ? getFullCompanyPlantLabel(report) : "삼랑진공장 (주)오륙";

  return `${dayStr} ${compPlant} ${reportCategory}`;
};

// ⭐ 보고서 사유/내용 내 요일 자동 동기화
export const getCleanReportReason = (reasonStr, report) => {
  if (!reasonStr) return "";
  let rawStr = "";
  if (typeof reasonStr === "string") {
    rawStr = reasonStr;
  } else if (typeof reasonStr === "object") {
    rawStr = reasonStr.text || reasonStr.reason || reasonStr.content || JSON.stringify(reasonStr);
  } else {
    rawStr = String(reasonStr || "");
  }

  const workDate = typeof report === "object" ? String(report?.workDate || "") : "";
  const correctDayOfWeek = getDayOfWeekKorean(workDate || rawStr);
  const isWeekend = isWeekendByDate(workDate || rawStr);
  let res = String(rawStr || "");
  if (/\([일월화수목금토]\)|\(평일\)/.test(res)) {
    res = res.replace(/\([일월화수목금토]\)|\(평일\)/g, `(${correctDayOfWeek})`);
  }
  if (!isWeekend && res.includes("토요 특근")) {
    res = res.replace(/토요 특근/g, "정규/연장 근무");
  }
  return res;
};

// ⭐ 전자결재함 연동: 실시간 결재 상태 및 결재 단계(담당/책임/이사/대표) 자동 매칭
export const getLiveApprovalForReport = (report, approvalDocs = []) => {
  if (!report) {
    return {
      status: "IN_PROGRESS",
      statusLabel: "결재진행중",
      currentStep: 2,
      steps: [
        { role: "담당", name: "양인나", title: "선임", status: "APPROVED", date: "", comment: "기안" },
        { role: "책임", name: "윤경수", title: "책임", status: "PENDING", date: "", comment: "" },
        { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
        { role: "대표", name: "권태형", title: "대표", status: "WAITING", date: "" }
      ],
      approvalDoc: null
    };
  }

  const workDateStr = report.workDate || "";
  const plantName = report.plant || getPlantForCompany(report.company || "");
  const plantKey = plantName === "삼랑진공장" ? "samrangjin" : "hanlim";
  const canonicalDocId = `appr_ot_${plantKey}_${workDateStr.replace(/-/g, "")}`;

  const isWk = isWeekendByDate(workDateStr || report.title);
  const hasSpecialOvertime = report.reportType === "특근보고서" || (report.title && report.title.includes("특근") && !report.title.includes("근태"));
  const isActualOvertime = isWk || hasSpecialOvertime;

  // ⭐ 1. 평일 근태보고서는 작성자 전결로 처리 (결재대기 없이 전결 승인 완료)
  if (!isActualOvertime) {
    const drafterName = report.author?.split(" ")[0] || "작성자";
    const drafterTitle = report.authorTitle || "선임";
    const dateStr = report.workDate || report.updatedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10);
    return {
      status: "APPROVED",
      statusLabel: "결재완료 (작성자 전결)",
      currentStep: 4,
      steps: [
        { role: "담당", name: drafterName, title: drafterTitle, status: "APPROVED", date: dateStr, comment: "작성자 전결" },
        { role: "책임", name: plantName === "한림공장" ? "김동욱" : "윤경수", title: "책임", status: "APPROVED", date: dateStr, comment: "전결" },
        { role: "이사", name: "이명재", title: "이사", status: "APPROVED", date: dateStr, comment: "전결" },
        { role: "대표", name: "권태형", title: "대표", status: "APPROVED", date: dateStr, comment: "전결" }
      ],
      approvalDoc: null
    };
  }

  // 1. Try finding canonical plant-level synthesis approval doc
  let matchedDoc = (approvalDocs || []).find((d) => d.id === canonicalDocId);

  // 2. Try matching by docType/type, plant, and workDate
  if (!matchedDoc && workDateStr) {
    matchedDoc = (approvalDocs || []).find(
      (d) =>
        (d.type === "OVERTIME" || d.docType === "OVERTIME" || d.category === "특근보고서") &&
        (d.plant === plantName || d.company === report.company || (d.id && d.id.includes(plantKey))) &&
        (d.workDate === workDateStr ||
          (d.id && d.id.includes(workDateStr.replace(/-/g, ""))) ||
          (d.title && d.title.includes(workDateStr)) ||
          (d.docNumber && d.docNumber.includes(workDateStr.replace(/-/g, "").slice(4))))
    );
  }

  // 3. Try matching by day number in title
  if (!matchedDoc) {
    const dayMatch =
      (report.title || "").match(/(\d{1,2})월\s*(\d{1,2})일/) ||
      (report.workDateFormatted || "").match(/(\d{1,2})월\s*(\d{1,2})일/);
    if (dayMatch) {
      matchedDoc = (approvalDocs || []).find(
        (d) =>
          (d.type === "OVERTIME" || d.docType === "OVERTIME" || d.category === "특근보고서") &&
          (d.plant === plantName || (d.title && d.title.includes(plantName)) || (d.id && d.id.includes(plantKey))) &&
          d.title &&
          d.title.includes(dayMatch[0])
      );
    }
  }

  if (matchedDoc && Array.isArray(matchedDoc.steps) && matchedDoc.steps.length > 0) {
    const isApproved = matchedDoc.status === "APPROVED";
    const isHold = matchedDoc.status === "HOLD";
    const isRejected = matchedDoc.status === "REJECTED";
    const pendingStep = matchedDoc.steps.find((s) => s.status === "PENDING");

    let statusLabel = "결재진행중";
    if (isApproved) statusLabel = "결재완료";
    else if (isHold) statusLabel = "보류중";
    else if (isRejected) statusLabel = "반려됨";
    else if (pendingStep) statusLabel = `결재진행중 (${pendingStep.role} ${pendingStep.name} 대기)`;

    return {
      status: matchedDoc.status || "IN_PROGRESS",
      statusLabel,
      currentStep: matchedDoc.currentStep || 2,
      steps: matchedDoc.steps,
      approvalDoc: matchedDoc
    };
  }

  // Fallback: Check report's own approval steps or normalize
  const reportSteps =
    report.approval && report.approval.length === 4
      ? report.approval
      : [
          { role: "담당", name: report.author?.split(" ")[0] || "양인나", title: report.authorTitle || "선임", status: "APPROVED", date: report.updatedAt?.slice(0, 10) || "", comment: "기안" },
          { role: "책임", name: plantName === "한림공장" ? "김동욱" : "윤경수", title: "책임", status: "PENDING", date: "", comment: "" },
          { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
          { role: "대표", name: "권태형", title: "대표", status: "WAITING", date: "" }
        ];

  const approvedCount = reportSteps.filter((s) => s.status === "APPROVED").length;
  const isApproved = report.status === "APPROVED" || approvedCount === 4;

  const normalizedSteps = reportSteps.map((s, idx) => {
    if (isApproved) return { ...s, status: "APPROVED" };
    if (idx === 0) return { ...s, status: "APPROVED" };
    if (s.status === "APPROVED") return { ...s, status: "APPROVED" };
    if (s.status === "HOLD") return { ...s, status: "HOLD" };
    if (s.status === "REJECTED") return { ...s, status: "REJECTED" };
    if (idx === 1 || s.status === "PENDING") return { ...s, status: "PENDING" };
    return { ...s, status: "WAITING" };
  });

  const pendingStep = normalizedSteps.find((s) => s.status === "PENDING");
  let statusLabel = isApproved ? "결재완료" : `결재진행중 (${pendingStep ? `${pendingStep.role} ${pendingStep.name}` : "책임"} 대기)`;

  return {
    status: isApproved ? "APPROVED" : "IN_PROGRESS",
    statusLabel,
    currentStep: isApproved ? 4 : 2,
    steps: normalizedSteps,
    approvalDoc: null
  };
};

// ⭐ 공장별 소속 협력사 근태/특근 보고서 일자별 자동 취합 생성 함수 (Plant-Level Synthesis Engine)
// 취합 조건:
// - 평일 근태: 취합하지 않고 협력사별 개별 보고서 유지
// - 주말/공휴일 특근:
//   1) 삼랑진공장: (주)오륙, 유성을 모아서 삼랑진공장 특근보고서 1개로 취합 (내용이 있는 업체만 뱃지/명단 포함)
//   2) 한림공장: (주)조영산업, 한울, 부림텍을 모아서 한림공장 특근보고서 1개로 취합 (내용이 있는 업체만 뱃지/명단 포함)
export const generateSynthesizedPlantReports = (reports = []) => {
  const dateMap = new Map();

  (reports || []).forEach((r) => {
    if (!r || !r.workDate || r.isSynthesized) return;
    const dateKey = r.workDate;
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, []);
    }
    dateMap.get(dateKey).push(r);
  });

  const synthList = [];

  const checkHasContent = (r) => {
    if (!r) return false;
    const w = r.totalWorkers || (r.items ? r.items.length : 0);
    const h = r.totalHours || 0;
    const c = r.cost || 0;
    if (w > 0 || h > 0 || c > 0) return true;
    if (Array.isArray(r.items) && r.items.length > 0) {
      return r.items.some((it) => (Number(it.count) || 0) > 0 || (it.names && String(it.names).trim() !== ""));
    }
    return false;
  };

  dateMap.forEach((reps, workDate) => {
    const isWk = isWeekendByDate(workDate);
    const dateParts = String(workDate).match(/(\d{4})?-?(\d{1,2})-(\d{1,2})/);
    const yearNum = dateParts && dateParts[1] ? parseInt(dateParts[1], 10) : 2026;
    const monthNum = dateParts && dateParts[2] ? parseInt(dateParts[2], 10) : 10;
    const dayNum = dateParts && dateParts[3] ? parseInt(dateParts[3], 10) : 1;
    const dayLabel = getDayOfWeekKorean(workDate, yearNum, monthNum);

    const hasSpecialOvertime = reps.some(
      (r) => r.reportType === "특근보고서" || (r.title && r.title.includes("특근") && !r.title.includes("근태"))
    );
    const isActualOvertime = isWk || hasSpecialOvertime;

    // ⭐ 평일 근태는 취합하지 않고, 주말/공휴일 특근 보고서만 취합 생성!
    if (!isActualOvertime) {
      return;
    }

    // 🏭 1. 삼랑진공장 그룹 (오륙, 유성)
    const samrangjinReps = reps.filter((r) => {
      const comp = r.company || "";
      const plant = r.plant || "";
      return comp.includes("오륙") || comp.includes("유성") || plant === "삼랑진공장";
    });

    // 🏭 2. 한림공장 그룹 (조영, 한울, 부림텍)
    const hanlimReps = reps.filter((r) => {
      const comp = r.company || "";
      const plant = r.plant || "";
      return comp.includes("조영") || comp.includes("한울") || comp.includes("부림") || plant === "한림공장";
    });

    // 1) 삼랑진공장 특근 취합 보고서 생성 (오륙, 유성 중 실제 내용이 있는 업체만 뱃지/내역 포함)
    if (samrangjinReps.length > 0) {
      const plant = "삼랑진공장";
      const activeReps = samrangjinReps.filter(checkHasContent);
      const targetReps = activeReps.length > 0 ? activeReps : samrangjinReps;
      const companies = Array.from(new Set(targetReps.map((r) => r.company).filter(Boolean)));
      const totalWorkers = targetReps.reduce((sum, r) => sum + (r.totalWorkers || (r.items ? r.items.length : 0)), 0);
      const totalHours = targetReps.reduce((sum, r) => sum + (r.totalHours || 0), 0);
      const cost = targetReps.reduce((sum, r) => sum + (r.cost || 0), 0);
      const allItems = targetReps.flatMap((r) => r.items || []);

      const drafterName = "조인주";
      const drafterTitle = "선임";
      const leadName = "윤경수";

      const compBreakdownText = targetReps.map((cr) => {
        const wCount = cr.totalWorkers || (cr.items ? cr.items.length : 0);
        const hCount = cr.totalHours || (wCount * 8);
        const cAmt = cr.cost || (hCount * 15000);
        return `• ${cr.company}: ${wCount}명 (${hCount} M/H, ₩${cAmt.toLocaleString()})`;
      }).join("\n");

      synthList.push({
        id: `synth_sam_${workDate.replace(/-/g, "")}`,
        isSynthesized: true,
        plant,
        company: `${companies.join(", ")} 취합`,
        companies: companies,
        title: `[삼랑진공장] ${monthNum}월 ${dayNum}일(${dayLabel}) 특근보고서 (${companies.join(", ")})`,
        reportType: "특근보고서 (취합)",
        workDate,
        workDateFormatted: `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")} (${dayLabel})`,
        author: drafterName,
        authorTitle: drafterTitle,
        updatedAt: targetReps[0]?.updatedAt || new Date().toISOString(),
        status: targetReps.every((r) => r.status === "APPROVED") ? "APPROVED" : "IN_PROGRESS",
        approval: [
          { role: "담당", name: drafterName, title: drafterTitle, status: "APPROVED", date: workDate, comment: "특근보고서 취합 기안" },
          { role: "책임", name: leadName, title: "책임", status: targetReps.every((r) => r.status === "APPROVED") ? "APPROVED" : "PENDING", date: "", comment: "" },
          { role: "이사", name: "이명재", title: "이사", status: targetReps.every((r) => r.status === "APPROVED") ? "APPROVED" : "WAITING", date: "", comment: "" },
          { role: "대표", name: "권태형", title: "대표", status: targetReps.every((r) => r.status === "APPROVED") ? "APPROVED" : "WAITING", date: "" }
        ],
        totalWorkers,
        totalHours,
        cost,
        items: allItems,
        childReports: targetReps,
        reasons: [
          `■ ${monthNum}월 ${dayNum}일(${dayLabel}) [삼랑진공장] 특근보고서 취합 (${companies.join(", ")})`,
          `1. 대상: ${companies.join(", ")} (총 ${totalWorkers}명, ${totalHours} M/H, 총 노무비 ₩${cost.toLocaleString()})`,
          `2. 협력사별 투입 현황:\n${compBreakdownText}`,
          `3. 작업 내용: 현대/기아 긴급 납품 물량 대응 및 삼랑진공장 주말 특근 가동 현황 취합`
        ]
      });
    }

    // 2) 한림공장 특근 취합 보고서 생성 (조영, 한울, 부림텍 중 실제 내용이 있는 업체만 뱃지/내역 포함)
    if (hanlimReps.length > 0) {
      const plant = "한림공장";
      const activeReps = hanlimReps.filter(checkHasContent);
      const targetReps = activeReps.length > 0 ? activeReps : hanlimReps;
      const companies = Array.from(new Set(targetReps.map((r) => r.company).filter(Boolean)));
      const totalWorkers = targetReps.reduce((sum, r) => sum + (r.totalWorkers || (r.items ? r.items.length : 0)), 0);
      const totalHours = targetReps.reduce((sum, r) => sum + (r.totalHours || 0), 0);
      const cost = targetReps.reduce((sum, r) => sum + (r.cost || 0), 0);
      const allItems = targetReps.flatMap((r) => r.items || []);

      const drafterName = "오상민";
      const drafterTitle = "선임";
      const leadName = "김동욱";

      const compBreakdownText = targetReps.map((cr) => {
        const wCount = cr.totalWorkers || (cr.items ? cr.items.length : 0);
        const hCount = cr.totalHours || (wCount * 8);
        const cAmt = cr.cost || (hCount * 15000);
        return `• ${cr.company}: ${wCount}명 (${hCount} M/H, ₩${cAmt.toLocaleString()})`;
      }).join("\n");

      synthList.push({
        id: `synth_hal_${workDate.replace(/-/g, "")}`,
        isSynthesized: true,
        plant,
        company: `${companies.join(", ")} 취합`,
        companies: companies,
        title: `[한림공장] ${monthNum}월 ${dayNum}일(${dayLabel}) 특근보고서 (${companies.join(", ")})`,
        reportType: "특근보고서 (취합)",
        workDate,
        workDateFormatted: `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")} (${dayLabel})`,
        author: drafterName,
        authorTitle: drafterTitle,
        updatedAt: targetReps[0]?.updatedAt || new Date().toISOString(),
        status: targetReps.every((r) => r.status === "APPROVED") ? "APPROVED" : "IN_PROGRESS",
        approval: [
          { role: "담당", name: drafterName, title: drafterTitle, status: "APPROVED", date: workDate, comment: "특근보고서 취합 기안" },
          { role: "책임", name: leadName, title: "책임", status: targetReps.every((r) => r.status === "APPROVED") ? "APPROVED" : "PENDING", date: "", comment: "" },
          { role: "이사", name: "이명재", title: "이사", status: targetReps.every((r) => r.status === "APPROVED") ? "APPROVED" : "WAITING", date: "", comment: "" },
          { role: "대표", name: "권태형", title: "대표", status: targetReps.every((r) => r.status === "APPROVED") ? "APPROVED" : "WAITING", date: "" }
        ],
        totalWorkers,
        totalHours,
        cost,
        items: allItems,
        childReports: targetReps,
        reasons: [
          `■ ${monthNum}월 ${dayNum}일(${dayLabel}) [한림공장] 특근보고서 취합 (${companies.join(", ")})`,
          `1. 대상: ${companies.join(", ")} (총 ${totalWorkers}명, ${totalHours} M/H, 총 노무비 ₩${cost.toLocaleString()})`,
          `2. 협력사별 투입 현황:\n${compBreakdownText}`,
          `3. 작업 내용: 현대/기아 긴급 납품 물량 대응 및 한림공장 주말 특근 가동 현황 취합`
        ]
      });
    }
  });

  return synthList;
};

export const OvertimeStatusView = ({ onNavigateTab }) => {
  const { currentProfile, isAdmin } = useAuth();

  // 🌟 Global Auto-close all modals on popstate (뒤로가기 시 팝업 닫기)
  useEffect(() => {
    const unsub = subscribeCloseAllModals(() => {
      setIsReportModalOpen(false);
      setSelectedCompanyPopup(null);
      setSelectedCompanyManageWorkers(null);
      setIsLegacyModalOpen(false);
      setSelectedLegacyReport(null);
      setIsPersonnelModalOpen(false);
      setSelectedPersonnelWorker(null);
      setIsAbsence4MModalOpen(false);
    });
    return () => unsub();
  }, []);

  const handleOpenReportModal = () => {
    pushModalHistory("overtime_report_write");
    setIsReportModalOpen(true);
  };

  const handleOpenCompanyPopup = (compName) => {
    pushModalHistory("company_status_popup");
    setSelectedCompanyPopup(compName);
  };

  const handleOpenManageWorkers = (compName) => {
    // 인원관리 탭으로 바로 전환하며 해당 업체를 기본 필터로 설정
    setWorkerMgmtCompanyFilter(cleanCompanyName(compName));
    setActiveTab("detail");
    setDetailSubTab("worker_management");
  };

  // ⭐ 결근 관리 및 4M Man 작업자 변경점 모달 열기 핸들러
  const handleOpenAbsence4M = (compName) => {
    pushModalHistory("absence_4m_modal");
    setAbsence4MCompany(cleanCompanyName(compName || "오륙"));
    setIsAbsence4MModalOpen(true);
  };

  const handleOpenLegacyReport = (report) => {
    pushModalHistory("overtime_report_detail");
    setSelectedLegacyReport(report);
    setIsLegacyModalOpen(true);
  };

  // ⭐ 제조현장 인사카드 모달 열기 핸들러
  const handleOpenPersonnelCard = (worker, originalIndex) => {
    pushModalHistory("personnel_card_modal");
    const cleanComp = cleanCompanyName(worker?.company);
    const cardKey = `${cleanComp}_${worker?.name}`;
    const savedCard = personnelCardsMap[cardKey] || personnelCardsMap[`${worker?.company}_${worker?.name}`] || worker?.personnelCard || worker?.card;
    const card = savedCard
      ? getWorkerPersonnelCard({ ...worker, personnelCard: savedCard }, (typeof originalIndex === "number" && originalIndex >= 0 ? originalIndex + 1 : 1))
      : getWorkerPersonnelCard(worker, (typeof originalIndex === "number" && originalIndex >= 0 ? originalIndex + 1 : 1));
    const enrichedWorker = {
      ...worker,
      position: card?.position || savedCard?.position || worker?.position || "사원",
      dept: card?.dept || savedCard?.dept || worker?.dept || "생산팀",
      personnelCard: card || savedCard || worker?.personnelCard || worker?.card
    };
    setSelectedPersonnelWorker(enrichedWorker);
    setSelectedPersonnelWorkerIndex(
      typeof originalIndex === "number" ? originalIndex : (worker?.originalMatrixIndex ?? -1)
    );
    setIsPersonnelModalOpen(true);
  };

  // Dynamic Month & Year from global Header context
  const { selectedMonth = getCurrentYearMonth() } = useMonth() || {};
  const [currentYear, currentMonthNum] = useMemo(() => {
    const ym = selectedMonth || getCurrentYearMonth();
    const parts = ym.split("-").map(Number);
    return [parts[0] || 2026, parts[1] || 10];
  }, [selectedMonth]);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonthNum, 0).getDate();
  }, [currentYear, currentMonthNum]);

  const getDayLabel = (d) => getDayOfWeekKorean(d, currentYear, currentMonthNum);
  const getDayFullLabel = (d) => getDayOfWeekFullKorean(d, currentYear, currentMonthNum);
  const isWeekendDay = (d) => isWeekendByDate(d, currentYear, currentMonthNum);

  // 🗓️ 지난달 (Previous Month) 자동 계산 (예: 2026-10 -> 2026-09)
  const prevYearMonth = useMemo(() => {
    let y = currentYear;
    let m = currentMonthNum - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    return `${y}-${String(m).padStart(2, "0")}`;
  }, [currentYear, currentMonthNum]);

  const [prevYear, prevMonthNum] = useMemo(() => {
    const parts = prevYearMonth.split("-").map(Number);
    return [parts[0] || 2026, parts[1] || 9];
  }, [prevYearMonth]);

  // Smart Overtime Ledger State (5개사 통합 잔업 스마트 대장 - 당월 작성중 vs 지난달 마감 분리)
  const [smartData, setSmartData] = useState(() => getLocalSmartOvertimeData(selectedMonth || "2026-10"));
  const [prevMonthData, setPrevMonthData] = useState(() => getLocalSmartOvertimeData(prevYearMonth || "2026-09"));
  const [activeTab, setActiveTab] = useState("daily_input"); // 'daily_input' | 'detail' | 'legacy_reports'
  const [detailSubTab, setDetailSubTab] = useState("monthly_matrix"); // 'monthly_matrix' | 'daily_summary' | 'worker_management'
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ⭐ 4M 결근 관리 모달 State
  const [isAbsence4MModalOpen, setIsAbsence4MModalOpen] = useState(false);
  const [absence4MCompany, setAbsence4MCompany] = useState("오륙");

  // ⭐ 인원관리 및 인사카드 전용 State
  const [personnelCardsMap, setPersonnelCardsMap] = useState(() => getLocalPersonnelCardsMap());
  const [selectedPersonnelWorker, setSelectedPersonnelWorker] = useState(null);
  const [selectedPersonnelWorkerIndex, setSelectedPersonnelWorkerIndex] = useState(-1);
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  const [workerMgmtCompanyFilter, setWorkerMgmtCompanyFilter] = useState("전체");
  const [workerMgmtSearch, setWorkerMgmtSearch] = useState("");
  const [workerMgmtSkillFilter, setWorkerMgmtSkillFilter] = useState("ALL");
  const [workerMgmtMultiSkillOnly, setWorkerMgmtMultiSkillOnly] = useState(false);
  const [showAddWorkerDrawer, setShowAddWorkerDrawer] = useState(false);

  // ⭐ 월간 종합현황 대장 전용 조회 월 (기본값: 지난달 9월 마감 실적)
  const [matrixViewMonth, setMatrixViewMonth] = useState(() => "2026-09");

  // 헤더 월 변경 시 기본 matrixViewMonth 동기화
  useEffect(() => {
    if (prevYearMonth) {
      setMatrixViewMonth(prevYearMonth);
    }
  }, [prevYearMonth]);

  const [matrixYear, matrixMonthNum] = useMemo(() => {
    const ym = matrixViewMonth || prevYearMonth || "2026-09";
    const parts = ym.split("-").map(Number);
    return [parts[0] || 2026, parts[1] || 9];
  }, [matrixViewMonth, prevYearMonth]);

  const matrixDaysInMonth = useMemo(() => {
    return new Date(matrixYear, matrixMonthNum, 0).getDate();
  }, [matrixYear, matrixMonthNum]);

  const getMatrixDayLabel = (d) => getDayOfWeekKorean(d, matrixYear, matrixMonthNum);
  const getMatrixDayFullLabel = (d) => getDayOfWeekFullKorean(d, matrixYear, matrixMonthNum);
  const isMatrixWeekendDay = (d) => isWeekendByDate(d, matrixYear, matrixMonthNum);

  // Daily views state (로그인 및 접속 시점의 실시간 당일 일자로 기본 선택)
  const [selectedDay, setSelectedDay] = useState(() => {
    try {
      const kst = getKSTDateString(new Date());
      const day = parseInt(kst.split("-")[2], 10);
      return !isNaN(day) && day >= 1 && day <= 31 ? day : new Date().getDate() || 1;
    } catch (e) {
      return new Date().getDate() || 1;
    }
  });

  // 로그인 사용자 변경 또는 월 변경 시 당일 일자 자동 동기화
  useEffect(() => {
    try {
      const kst = getKSTDateString(new Date());
      const day = parseInt(kst.split("-")[2], 10);
      if (!isNaN(day) && day >= 1 && day <= daysInMonth) {
        setSelectedDay(day);
      } else if (selectedDay > daysInMonth) {
        setSelectedDay(daysInMonth);
      }
    } catch (e) {
      if (selectedDay > daysInMonth) setSelectedDay(daysInMonth);
    }
  }, [currentProfile?.name, daysInMonth]);

  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("오륙");
  const [matrixCompanyFilter, setMatrixCompanyFilter] = useState("전체");
  const [reportListFilter, setReportListFilter] = useState("전체");
  const [reportTypeCategoryFilter, setReportTypeCategoryFilter] = useState("ALL"); // "ALL", "WEEKDAY", "WEEKEND", "SYNTHESIS"
  const [dateSortOrder, setDateSortOrder] = useState("DESC"); // "DESC" (가까운 날 / 최신순), "ASC" (과거순 1일->30일)
  const [reportListSearch, setReportListSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // ⭐ Registration Report Modal State (등록 클릭 시 뜨는 보고서 작성/확인 팝업)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalTitle, setReportModalTitle] = useState("");
  const [reportModalAuthor, setReportModalAuthor] = useState("조인주 선임");
  const [reportModalAuthorTitle, setReportModalAuthorTitle] = useState("선임");
  const [reportModalNotes, setReportModalNotes] = useState("");
  const [reportApprovalSteps, setReportApprovalSteps] = useState([
    { role: "담당", name: "조인주", title: "선임", status: "APPROVED", date: "", comment: "기안" },
    { role: "책임", name: "윤경수", title: "책임", status: "PENDING", date: "", comment: "" },
    { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
    { role: "대표", name: "권태형", title: "대표", status: "WAITING", date: "" }
  ]);

  // ⭐ Company Today Status Popup State (업체이름 패널 클릭 시 열리는 오늘자 현황 초간결 팝업)
  const [selectedCompanyPopup, setSelectedCompanyPopup] = useState(null); // e.g. "(주)오륙"
  const [selectedCompanyManageWorkers, setSelectedCompanyManageWorkers] = useState(null); // e.g. "(주)오륙" (근로자 추가/삭제 전용 모달)
  const [manageWorkerSearch, setManageWorkerSearch] = useState("");
  const [popupShowAddWorker, setPopupShowAddWorker] = useState(false);
  const [quickNewWorkerName, setQuickNewWorkerName] = useState("");
  const [quickNewWorkerDept, setQuickNewWorkerDept] = useState("생산팀");
  const [quickNewWorkerLine, setQuickNewWorkerLine] = useState("");
  const [quickNewWorkerPos, setQuickNewWorkerPos] = useState("사원");

  // Legacy overtime reports state (특근보고서 관리)
  const [legacyReports, setLegacyReports] = useState(() => getLocalOvertimeReports());
  const [approvalDocs, setApprovalDocs] = useState(() => getLocalApprovalDocs());
  const [selectedLegacyReport, setSelectedLegacyReport] = useState(null);
  const [isLegacyModalOpen, setIsLegacyModalOpen] = useState(false);
  const [selectedWeekendDay, setSelectedWeekendDay] = useState(3);

  // Show Toast notification
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2800);
  };

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    const currentYM = selectedMonth || "2026-10";
    const prevYM = prevYearMonth || "2026-09";

    // Immediate sync from local storage
    setSmartData(getLocalSmartOvertimeData(currentYM));
    setPrevMonthData(getLocalSmartOvertimeData(prevYM));

    const unsubSmart = subscribeSmartOvertimeData((newData) => {
      if (newData && newData.attendanceMatrix) {
        setSmartData(newData);
      }
    }, currentYM);

    const unsubPrev = subscribeSmartOvertimeData((newData) => {
      if (newData && newData.attendanceMatrix) {
        setPrevMonthData(newData);
      }
    }, prevYM);

    const unsubLegacy = subscribeOvertimeReports((reports) => {
      setLegacyReports(reports);
      if (reports.length > 0 && !selectedLegacyReport) {
        setSelectedLegacyReport(reports[0]);
      }
      if (Array.isArray(reports) && reports.length > 0) {
        setSmartData((prev) => {
          if (!prev) return prev;
          const baseMatrix = prev.attendanceMatrix || prev.masterWorkers;
          const merged = buildMatrixFromReports(
            baseMatrix,
            reports,
            currentYear,
            currentMonthNum
          );
          return {
            ...prev,
            year: currentYear,
            month: currentMonthNum,
            attendanceMatrix: merged
          };
        });
      }
    });

    const unsubApproval = subscribeApprovalDocs((docs) => {
      if (Array.isArray(docs)) {
        setApprovalDocs(docs);
      }
    });

    const unsubCards = subscribePersonnelCards((cards) => {
      setPersonnelCardsMap(cards || {});
    });

    const handleCardUpdated = (e) => {
      if (e?.detail?.cardKey && e?.detail?.cardData) {
        setPersonnelCardsMap((prev) => ({
          ...prev,
          [e.detail.cardKey]: e.detail.cardData,
          [`${cleanCompanyName(e.detail.cardData.company)}_${e.detail.cardData.name}`]: e.detail.cardData,
          [`${e.detail.cardData.company}_${e.detail.cardData.name}`]: e.detail.cardData
        }));
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("oryuk_personnel_card_updated", handleCardUpdated);
    }

    return () => {
      unsubSmart();
      unsubPrev();
      unsubLegacy();
      unsubApproval();
      unsubCards();
      if (typeof window !== "undefined") {
        window.removeEventListener("oryuk_personnel_card_updated", handleCardUpdated);
      }
    };
  }, [selectedMonth, prevYearMonth]);

  // Sync state to local/cloud (Explicit Save Action)
  const handleSaveLedger = async (updatedData, targetYM = null) => {
    setIsSaving(true);
    try {
      const ym = targetYM || selectedMonth || "2026-10";
      if (ym === (selectedMonth || "2026-10")) {
        setSmartData(updatedData);
      } else {
        setPrevMonthData(updatedData);
      }
      await saveSmartOvertimeData(updatedData, ym);
      
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // 1-Click Update Worker Attendance for Selected Day (Local Staging + Auto Save)
  const handleUpdateWorkerDayAttendance = async (targetWorkerOrIndex, newCode) => {
    const currentMatrix = smartData?.attendanceMatrix || [];
    let targetIdx = -1;

    if (typeof targetWorkerOrIndex === "object" && targetWorkerOrIndex !== null) {
      const wName = (targetWorkerOrIndex.name || "").trim();
      const wClean = wName.split(" ")[0].replace(/\([^)]*\)/g, "").trim();
      const wComp = cleanCompanyName(targetWorkerOrIndex.company);
      targetIdx = currentMatrix.findIndex(
        (w) => ((w.name || "").trim() === wName || (wClean && (w.name || "").split(" ")[0].replace(/\([^)]*\)/g, "").trim() === wClean)) && cleanCompanyName(w.company) === wComp
      );
      if (targetIdx === -1) {
        targetIdx = currentMatrix.findIndex((w) => (w.name || "").trim() === wName || (wClean && (w.name || "").split(" ")[0].replace(/\([^)]*\)/g, "").trim() === wClean));
      }
      if (targetIdx === -1 && typeof targetWorkerOrIndex.originalMatrixIndex === "number") {
        targetIdx = targetWorkerOrIndex.originalMatrixIndex;
      }
    } else if (typeof targetWorkerOrIndex === "number") {
      targetIdx = targetWorkerOrIndex;
    }

    if (targetIdx === -1 || !currentMatrix[targetIdx]) return;

    const updatedMatrix = [...currentMatrix];
    const worker = updatedMatrix[targetIdx];
    const prevDaily = worker.daily || {};
    const updatedDaily = { ...prevDaily, [selectedDay]: newCode, [String(selectedDay)]: newCode };

    updatedMatrix[targetIdx] = {
      ...worker,
      daily: updatedDaily
    };

    const newLedger = {
      ...smartData,
      year: currentYear,
      month: currentMonthNum,
      attendanceMatrix: updatedMatrix
    };

    setSmartData(newLedger);
    setHasUnsavedChanges(true);
    await saveSmartOvertimeData(newLedger, selectedMonth || "2026-10");
  };

  // 1-Click Copy Closest Previous Weekday's Attendance to Selected Day (Excluding Calendar Special Work Days)
  const handleSetAllFilteredWorkersSameAsPrevDay = async () => {
    if (!filteredAttendanceWorkers || filteredAttendanceWorkers.length === 0) return;

    // 1. [달력기준 특근일 제외 규칙 1] 현재 선택된 날짜가 특근일(주말/공휴일)인 경우 적용 제외
    if (isWeekendDay(selectedDay)) {
      triggerToast(`⚠️ 달력기준 특근일(${currentMonthNum}월 ${selectedDay}일 ${getDayLabel(selectedDay)}요일 - 주말/공휴일)은 '전일과동일' 적용 대상에서 제외됩니다.`);
      return;
    }

    if (selectedDay <= 1) {
      triggerToast("⚠️ 1일은 이전 일자 데이터가 존재하지 않습니다.");
      return;
    }

    // Helper: checks if a day has any worker attendance configured
    const hasDataOnDay = (d) => {
      if (!d || d < 1 || d >= selectedDay) return false;
      return (smartData.attendanceMatrix || []).some((w) => {
        const v = w.daily ? String(w.daily[d] || "").trim() : "";
        return v && v !== "-" && v !== "휴무";
      });
    };

    // 2. [달력기준 특근일 제외 규칙 2] 직전 평일(특근일 제외) 탐색
    let targetSourceDay = null;

    // Search backwards for the closest previous regular weekday (non-weekend, non-holiday) that has data
    for (let d = selectedDay - 1; d >= 1; d--) {
      if (!isWeekendDay(d) && hasDataOnDay(d)) {
        targetSourceDay = d;
        break;
      }
    }

    // If no prior weekday with data was found, pick the closest preceding weekday
    if (!targetSourceDay) {
      for (let d = selectedDay - 1; d >= 1; d--) {
        if (!isWeekendDay(d)) {
          targetSourceDay = d;
          break;
        }
      }
    }

    if (!targetSourceDay) {
      triggerToast("⚠️ 적용 가능한 이전 평일(특근일 제외) 데이터가 존재하지 않습니다.");
      return;
    }

    const sourceDayLabel = getDayLabel(targetSourceDay);
    const updatedMatrix = [...smartData.attendanceMatrix];
    let appliedCount = 0;

    filteredAttendanceWorkers.forEach((worker) => {
      const idx = worker.originalMatrixIndex;
      if (updatedMatrix[idx]) {
        const prevDaily = updatedMatrix[idx].daily || {};
        let sourceVal =
          prevDaily[targetSourceDay] !== undefined
            ? prevDaily[targetSourceDay]
            : prevDaily[String(targetSourceDay)] !== undefined
            ? prevDaily[String(targetSourceDay)]
            : worker.daily?.[targetSourceDay] !== undefined
            ? worker.daily[targetSourceDay]
            : worker.daily?.[String(targetSourceDay)] || "";

        // If source value was empty, "-" or unrecorded, default to regular "🟢" so attendance table visibly reflects data
        if (!sourceVal || sourceVal === "-" || sourceVal === "undefined" || sourceVal === "휴무") {
          sourceVal = "🟢";
        } else if (sourceVal === "특근" || sourceVal === "주말특근") {
          // 평일에는 특근 코드를 일반 정시(🟢)로 변환
          sourceVal = "🟢";
        }

        if (sourceVal) appliedCount++;

        updatedMatrix[idx] = {
          ...updatedMatrix[idx],
          daily: { ...prevDaily, [selectedDay]: sourceVal, [String(selectedDay)]: sourceVal }
        };
      }
    });

    const newLedger = {
      ...smartData,
      year: currentYear,
      month: currentMonthNum,
      attendanceMatrix: updatedMatrix
    };

    setSmartData(newLedger);
    setHasUnsavedChanges(true);

    const msg = `📋 [${selectedCompanyFilter}] ${filteredAttendanceWorkers.length}명에게 직전 평일(${currentMonthNum}월 ${targetSourceDay}일 ${sourceDayLabel}요일)과 동일한 근태가 적용되었습니다. (특근일 제외)`;

    triggerToast(msg);
    await saveSmartOvertimeData(newLedger, selectedMonth || "2026-10");
  };

  // 1-Click Set All Filtered Workers to "🟢 정시" for Selected Day
  const handleSetAllFilteredWorkersRegular = async () => {
    if (!filteredAttendanceWorkers || filteredAttendanceWorkers.length === 0) return;
    const updatedMatrix = [...smartData.attendanceMatrix];

    filteredAttendanceWorkers.forEach((worker) => {
      const idx = worker.originalMatrixIndex;
      if (updatedMatrix[idx]) {
        const prevDaily = updatedMatrix[idx].daily || {};
        updatedMatrix[idx] = {
          ...updatedMatrix[idx],
          daily: { ...prevDaily, [selectedDay]: "🟢", [String(selectedDay)]: "🟢" }
        };
      }
    });

    const newLedger = {
      ...smartData,
      year: currentYear,
      month: currentMonthNum,
      attendanceMatrix: updatedMatrix
    };

    setSmartData(newLedger);
    setHasUnsavedChanges(true);
    triggerToast(`🟢 [${selectedCompanyFilter}] ${filteredAttendanceWorkers.length}명 전원 ${currentMonthNum}월 ${selectedDay}일 정시(🟢)로 일괄 선택되었습니다.`);
    await saveSmartOvertimeData(newLedger, selectedMonth || "2026-10");
  };

  // ⭐ USER ACTION: [ 💾 등록 ] 클릭 시 보고서 팝업창 오픈 (선택된 업체 관리자 결재선 자동 배정)
  const handleOpenRegistrationReportModal = () => {
    const d = selectedDay || 1;
    const isWk = isWeekendDay(d);
    const dayLabel = getDayLabel(d);
    const reportType = isWk ? "특근보고서" : "근태보고서";

    // 🚨 1. 누락된 항목(미선택 인원) 검증: 미선택 항목이 있을 경우 등록 차단 및 알림
    const missingWorkers = (filteredAttendanceWorkers || []).filter((w) => {
      const val = w.daily ? w.daily[d] : "";
      const str = String(val || "").trim();
      return !str || str === "미입력" || str === "-" || str === "undefined" || str === "null";
    });

    if (missingWorkers.length > 0) {
      const missingCount = missingWorkers.length;
      const sampleNames = missingWorkers
        .slice(0, 10)
        .map((w, idx) => `• ${w.name} (${w.dept || w.company || "소속"})`)
        .join("\n");
      const moreText = missingCount > 10 ? `\n... 외 ${missingCount - 10}명` : "";

      const alertMessage = `⚠️ [근태 미입력 알림 - 등록 불가]\n\n${currentMonthNum}월 ${d}일(${dayLabel}) 근태 선택 테이블에 아직 근태가 입력(선택)되지 않은 근로자가 총 ${missingCount}명 있습니다.\n\n[미선택 근로자 명단 (${missingCount}명)]\n${sampleNames}${moreText}\n\n모든 근로자의 근태(정시, 19시, 21시, 22시, 야간, 연차, 결근 등)를 빠짐없이 선택하셔야 보고서 등록이 가능합니다.\n\n💡 TIP: 상단의 '🟢 정시전체선택' 또는 '📋 전일과동일' 버튼을 누르시면 전체 인원의 근태를 빠르게 일괄 입력하실 수 있습니다.`;

      alert(alertMessage);
      triggerToast(`⚠️ 근태 미입력 인원이 ${missingCount}명 있어 등록할 수 없습니다. 테이블에서 모든 인원의 근태를 선택해주세요.`);
      return;
    }

    const compLabel = !selectedCompanyFilter || selectedCompanyFilter === "전체" ? "5개사 통합" : selectedCompanyFilter;
    const compMeta = COMPANY_APPROVAL_MANAGERS[selectedCompanyFilter] || COMPANY_APPROVAL_MANAGERS["전체"] || {
      company: selectedCompanyFilter || "전체",
      plant: "전사",
      author: "조인주 선임",
      drafter: "조인주",
      drafterRole: "선임",
      lead: "윤경수",
      leadRole: "책임",
      director: "이명재",
      directorRole: "이사",
      ceo: "권태형",
      ceoRole: "대표"
    };

    const attendedCount = (filteredAttendanceWorkers || []).filter(w => {
      const val = w.daily ? w.daily[d] : "";
      const { isAttended, workHours } = calculateWorkerDailyHours(val);
      return isAttended && workHours > 0;
    }).length;

    const totalHours = (filteredAttendanceWorkers || []).reduce((sum, w) => {
      const val = w.daily ? w.daily[d] : "";
      const { workHours } = calculateWorkerDailyHours(val);
      return sum + (workHours || 0);
    }, 0);

    setReportModalTitle(`${currentMonthNum}월 ${d}일(${dayLabel}) ${compMeta.plant || "전사"} ${compLabel} ${reportType}`);
    setReportModalAuthor(compMeta.author || compMeta.drafter || "조인주");
    setReportModalAuthorTitle(compMeta.drafterRole || "선임");
    
    // ⭐ 해당 회사 관리자들로 결재란 자동 구성 (평일 근태보고서는 작성자 전결 승인, 주말 특근은 4단계 결재)
    if (!isWk) {
      setReportApprovalSteps([
        { role: "담당", name: compMeta.drafter || "담당", title: compMeta.drafterRole || "선임", status: "APPROVED", date: new Date().toLocaleDateString("ko-KR"), comment: "작성자 전결" },
        { role: "책임", name: compMeta.lead || "책임", title: compMeta.leadRole || "책임", status: "APPROVED", date: new Date().toLocaleDateString("ko-KR"), comment: "전결" },
        { role: "이사", name: compMeta.director || "이사", title: compMeta.directorRole || "이사", status: "APPROVED", date: new Date().toLocaleDateString("ko-KR"), comment: "전결" },
        { role: "대표", name: compMeta.ceo || "대표", title: compMeta.ceoRole || "대표", status: "APPROVED", date: new Date().toLocaleDateString("ko-KR"), comment: "전결" }
      ]);
    } else {
      setReportApprovalSteps([
        { role: "담당", name: compMeta.drafter || "담당", title: compMeta.drafterRole || "선임", status: "APPROVED", date: new Date().toLocaleDateString("ko-KR"), comment: "기안" },
        { role: "책임", name: compMeta.lead || "책임", title: compMeta.leadRole || "책임", status: "PENDING", date: "", comment: "" },
        { role: "이사", name: compMeta.director || "이사", title: compMeta.directorRole || "이사", status: "WAITING", date: "", comment: "" },
        { role: "대표", name: compMeta.ceo || "대표", title: compMeta.ceoRole || "대표", status: "WAITING", date: "" }
      ]);
    }

    setReportModalNotes(
      `1. ${currentYear}년 ${currentMonthNum}월 ${d}일(${dayLabel}) ${compLabel} 생산 라인 가동 및 ${reportType} 현황\n2. ${compMeta.plant || "전사"} 소속 ${selectedCompanyFilter === "전체" ? "통합" : selectedCompanyFilter} 관리자 결재 승인\n3. 총 ${attendedCount}명 출근/투입 (총 투입공수: ${totalHours} M/H, 예상 노무비: ₩${(totalHours * 15000).toLocaleString()})`
    );

    handleOpenReportModal();
  };

  // ⭐ USER ACTION: [ 💾 팝업 내 최종 저장 및 보고서 등록 ]
  const handleConfirmAndSaveReportModal = async () => {
    const d = selectedDay || 1;
    const isWk = isWeekendDay(d);
    const dayLabel = getDayLabel(d);

    // 🚨 최종 저장 전 누락 항목 재검증
    const missingWorkers = (filteredAttendanceWorkers || []).filter((w) => {
      const val = w.daily ? w.daily[d] : "";
      const str = String(val || "").trim();
      return !str || str === "미입력" || str === "-" || str === "undefined" || str === "null";
    });

    if (missingWorkers.length > 0) {
      alert(`⚠️ 근태가 미선택된 근로자(${missingWorkers.length}명)가 있어 저장 및 등록을 진행할 수 없습니다.`);
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save smart overtime ledger to Firestore & LocalStorage (ensure all current daily values are synchronized)
      const allWorkersList = filteredAttendanceWorkers || [];
      if (smartData && Array.isArray(smartData.attendanceMatrix)) {
        const currentMatrix = [...smartData.attendanceMatrix];
        allWorkersList.forEach((w) => {
          const val = (w.daily && (w.daily[d] !== undefined ? w.daily[d] : w.daily[String(d)])) ?? w[d] ?? w[String(d)] ?? "";
          const cleanWName = (w.name || "").split(" ")[0].replace(/\([^)]*\)/g, "").trim();
          const targetIdx = currentMatrix.findIndex(
            (mw) => ((mw.name || "").trim() === (w.name || "").trim() || (cleanWName && (mw.name || "").split(" ")[0].replace(/\([^)]*\)/g, "").trim() === cleanWName)) && cleanCompanyName(mw.company) === cleanCompanyName(w.company)
          );
          if (targetIdx >= 0) {
            currentMatrix[targetIdx] = {
              ...currentMatrix[targetIdx],
              daily: {
                ...(currentMatrix[targetIdx].daily || {}),
                [d]: val,
                [String(d)]: val
              }
            };
          }
        });
        const updatedLedger = {
          ...smartData,
          attendanceMatrix: currentMatrix
        };
        setSmartData(updatedLedger);
        await saveSmartOvertimeData(updatedLedger, selectedMonth || "2026-10");
      }
      
      // 2. Generate and save company-specific report record
      const d = selectedDay || 1;
      const isWk = isWeekendDay(d);
      const dayLabel = getDayLabel(d);
      const reportType = isWk ? "특근보고서" : "근태보고서";
      const compLabel = !selectedCompanyFilter || selectedCompanyFilter === "전체" ? "5개사 통합" : selectedCompanyFilter;
      const compMeta = COMPANY_APPROVAL_MANAGERS[selectedCompanyFilter] || COMPANY_APPROVAL_MANAGERS["전체"] || {
        company: selectedCompanyFilter || "전체",
        plant: "전사",
        author: "조인주 선임",
        drafter: "조인주",
        drafterRole: "선임",
        lead: "윤경수",
        leadRole: "책임",
        director: "이명재",
        directorRole: "이사",
        ceo: "권태형",
        ceoRole: "대표"
      };
      const finalReportTitle = (reportModalTitle && reportModalTitle.trim()) || `${currentYear}년 ${currentMonthNum}월 ${d}일(${dayLabel}) ${compMeta.plant || "전사"} ${compLabel} ${reportType}`;

      const items = allWorkersList.map((w, idx) => {
        const val = (w.daily && (w.daily[d] !== undefined ? w.daily[d] : w.daily[String(d)])) ?? w[d] ?? w[String(d)] ?? "";
        const { isAttended, weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
        const isOff = val === "결근" || val === "연차" || val === "휴가" || val === "-" || val === "휴무";
        return {
          id: `rep_item_${d}_${w.no || idx}_${w.name || idx}`,
          no: idx + 1,
          company: cleanCompanyName(w.company) || "",
          factory: getPlantForCompany(w.company) || compMeta.plant || "",
          dept: normalizeDept(w.dept) || "",
          line: w.line || normalizeDept(w.dept) || "",
          category: w.line || normalizeDept(w.dept) || "",
          workerName: (w.name || "").trim(),
          position: w.position || "작업원",
          attendanceCode: val || (isWk ? "특근" : "🟢"),
          startTime: isOff ? "-" : "08:00",
          endTime: val === "19" ? "19:00" : val === "21" ? "21:00" : val === "22" ? "22:00" : (isOff ? "-" : "17:00"),
          hours: workHours || (isAttended ? 8 : 0),
          otHours: (weekdayOt + weekendOt) || 0,
          count: 1,
          workContent: `${cleanCompanyName(w.company) || ""} ${normalizeDept(w.dept) || ""} ${val === "결근" ? "결근" : val === "연차" ? "연차" : val === "휴가" ? "휴가" : "작업 수행"}`,
          workDetails: `${cleanCompanyName(w.company) || ""} ${normalizeDept(w.dept) || ""} ${w.line || ""} ${val === "결근" ? "결근" : val === "연차" ? "연차" : val === "휴가" ? "휴가" : "생산 및 납품 대응"}`
        };
      });

      const totalHours = items.reduce((sum, it) => sum + (Number(it.hours) || 0), 0);
      const cost = totalHours * 15000;

      const compCleanSlug = !selectedCompanyFilter || selectedCompanyFilter === "전체" ? "all" : String(selectedCompanyFilter).replace(/[()]/g, "").trim();
      const companyReport = {
        id: `report_${compCleanSlug}_${currentYear}_${String(currentMonthNum).padStart(2, "0")}_${String(d).padStart(2, "0")}`,
        plant: compMeta.plant || "전사",
        company: selectedCompanyFilter || "전체",
        companies: selectedCompanyFilter === "전체" ? COMPANIES : [selectedCompanyFilter],
        title: finalReportTitle,
        reportType: reportType,
        workDate: `${currentYear}-${String(currentMonthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        workDateFormatted: `${currentYear}-${String(currentMonthNum).padStart(2, "0")}-${String(d).padStart(2, "0")} (${dayLabel})`,
        author: reportModalAuthor || compMeta.drafter || "작성자",
        authorTitle: reportModalAuthorTitle || compMeta.drafterRole || "선임",
        updatedAt: new Date().toISOString(),
        status: isWk ? "IN_PROGRESS" : "APPROVED",
        approval: (reportApprovalSteps || []).map(step => ({
          role: step.role || "담당",
          name: step.name || "작성자",
          title: step.title || "선임",
          status: isWk ? (step.status || "WAITING") : "APPROVED",
          date: step.date || "",
          comment: isWk ? (step.comment || "") : "작성자 전결"
        })),
        totalWorkers: allWorkersList.length,
        attendedWorkers: items.filter(it => it.hours > 0).length,
        totalHours: totalHours,
        cost: cost,
        items: items,
        reasons: (reportModalNotes || "").split("\n").filter(Boolean)
      };

      const currentReports = legacyReports || [];
      const updatedReports = [companyReport, ...currentReports.filter((r) => r.id !== companyReport.id)];
      await saveOvertimeReport(companyReport);
      setLegacyReports(updatedReports);
      
      // ⭐ 공장별 소속 협력사 특근보고서 결재함 자동 취합 및 연동
      // 삼랑진공장: (주)오륙 + 유성 취합 ➔ 결재함 자동 등록
      // 한림공장: (주)조영산업 + 한울 + 부림텍 취합 ➔ 결재함 자동 등록
      if (isWk) {
        try {
          await syncPlantOvertimeToApprovalBox({
            plant: selectedCompanyFilter === "전체" ? null : compMeta.plant,
            company: selectedCompanyFilter,
            workDate: `${currentYear}-${String(currentMonthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
            matrix: smartData.attendanceMatrix,
            reports: updatedReports
          });
        } catch (syncErr) {
          console.warn("Approval sync warning:", syncErr);
        }
      }
      
      setHasUnsavedChanges(false);
      setIsReportModalOpen(false);
      
      if (isWk) {
        const plantLabel = compMeta.plant || (selectedCompanyFilter === "전체" ? "전 공장" : "공장");
        triggerToast(`🎉 [${selectedCompanyFilter}] ${reportType} 등록 및 [${plantLabel}] 협력사 취합 결재함 연동이 완료되었습니다!`);
      } else {
        triggerToast(`🎉 [${selectedCompanyFilter}] ${reportType}가 작성자 전결로 등록 및 승인되었습니다!`);
      }
    } catch (err) {
      console.error(err);
      alert("등록 중 오류가 발생했습니다: " + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };



  // ⭐ USER ACTION: 보고서 수정 및 근태 등록 화면으로 이동
  const handleEditReport = (report) => {
    if (report.workDate) {
      const parts = report.workDate.split("-");
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        if (!isNaN(d)) setSelectedDay(d);
      }
    }
    if (report.company) {
      setSelectedCompanyFilter(report.company);
    } else if (report.plant === "삼랑진공장") {
      setSelectedCompanyFilter("오륙");
    } else if (report.plant === "한림공장") {
      setSelectedCompanyFilter("조영");
    }
    setActiveTab("daily_input");
    triggerToast(`✏️ ${report.workDate ? report.workDate.split("-")[1] + "월 " + report.workDate.split("-")[2] : ""}일 [${report.company || report.plant || "전체"}] 근태 등록 화면으로 이동했습니다.`);
  };

  // ⭐ USER ACTION: 특근보고서 삭제 핸들러
  // ⭐ USER ACTION: 보고서 삭제 핸들러 (개별 및 취합 보고서 모두 지원)
  const handleDeleteReport = async (reportOrId, e) => {
    if (e) e.stopPropagation();
    const isSynth = typeof reportOrId === "object" && reportOrId?.isSynthesized;
    const reportId = typeof reportOrId === "object" ? reportOrId.id : reportOrId;
    const targetRep = typeof reportOrId === "object" ? reportOrId : legacyReports.find((r) => r.id === reportId);
    const repName = targetRep?.title || "선택한 보고서";

    if (!window.confirm(`정말로 이 보고서를 삭제하시겠습니까?\n(${repName})`)) return;
    try {
      let nextReports = legacyReports;
      if (isSynth && targetRep?.childReports && targetRep.childReports.length > 0) {
        for (const cr of targetRep.childReports) {
          await deleteOvertimeReport(cr.id);
        }
        const childIds = new Set(targetRep.childReports.map(cr => cr.id));
        nextReports = legacyReports.filter((r) => !childIds.has(r.id));
      } else {
        await deleteOvertimeReport(reportId);
        nextReports = legacyReports.filter((r) => r.id !== reportId);
      }
      setLegacyReports(nextReports);
      
      // ⭐ 삭제 즉시 근태/특근관리 기준 4개 탭 전사 동기화 (해당 일자/업체 자동 초기화)
      const synchedMatrix = buildMatrixFromReports(smartData.masterWorkers, nextReports, currentYear, currentMonthNum);
      const updatedLedger = {
        ...smartData,
        year: currentYear,
        month: currentMonthNum,
        attendanceMatrix: synchedMatrix
      };
      setSmartData(updatedLedger);
      await saveSmartOvertimeData(updatedLedger, selectedMonth || "2026-10");

      // ⭐ 결재함 특근보고서 실시간 재수정/정리
      if (targetRep) {
        await syncPlantOvertimeToApprovalBox({
          plant: targetRep.plant,
          company: targetRep.company,
          workDate: targetRep.workDate,
          matrix: synchedMatrix,
          reports: nextReports,
          isDeleteAction: true
        });
      }

      if (selectedLegacyReport && (selectedLegacyReport.id === reportId || (isSynth && targetRep.childReports?.some(cr => cr.id === selectedLegacyReport.id)))) {
        setIsLegacyModalOpen(false);
        setSelectedLegacyReport(null);
      }
      triggerToast("🗑️ 보고서가 정상적으로 삭제되었습니다.");
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다: " + err.message);
    }
  };

  // Quick Add Worker for a specific Company (from Company Popup & Personnel Management Modal)
  const handleQuickAddCompanyWorker = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!quickNewWorkerName.trim()) {
      alert("근로자 성명을 입력해주세요.");
      return;
    }
    const company = cleanCompanyName(selectedCompanyManageWorkers || selectedCompanyPopup || "오륙");
    const isPartner = isPartnerCompany(company);
    const dept = isPartner ? company : normalizeStandardDept(quickNewWorkerDept || "생산팀", company);
    const line = quickNewWorkerLine.trim() || dept;
    const name = quickNewWorkerName.trim();
    const position = isPartner ? "대표이사" : normalizeStandardPosition(quickNewWorkerPos || "사원", company);

    // Build standard attendance record for current month
    const emptyDaily = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const isWk = isWeekendDay(d);
      if (isWk) {
        emptyDaily[d] = "-";
      } else {
        emptyDaily[d] = "";
      }
    }

    const currentMatrix = smartData.attendanceMatrix || [];
    const nextNo = currentMatrix.length + 1;

    const newWorkerObj = {
      no: nextNo,
      company,
      dept,
      line,
      name,
      position,
      employmentType: "정규직",
      status: "재직",
      note: ""
    };

    const newMatrixRow = {
      no: nextNo,
      company,
      dept,
      line,
      name,
      position,
      daily: emptyDaily
    };

    const updatedMatrix = [...currentMatrix, newMatrixRow].map((w, idx) => ({ ...w, no: idx + 1 }));
    const updatedMaster = updatedMatrix.map((w, idx) => ({
      no: idx + 1,
      company: w.company,
      dept: normalizeDept(w.dept),
      line: w.line || normalizeDept(w.dept),
      name: w.name,
      position: w.position || "작업원",
      employmentType: w.employmentType || "정규직",
      status: w.status || "재직",
      note: w.note || ""
    }));

    const updatedData = {
      ...smartData,
      masterWorkers: updatedMaster,
      attendanceMatrix: updatedMatrix
    };

    setSmartData(updatedData);
    await handleSaveLedger(updatedData);
    setQuickNewWorkerName("");
    setQuickNewWorkerLine("");
    setPopupShowAddWorker(false);
    triggerToast(`🎉 [${company}] ${name} (${dept}) 신규 근로자 등록 완료!`);
  };

  // Quick Delete Worker (from Company Popup & Personnel Management Modal)
  const handleQuickDeleteWorker = async (workerIndexInMatrix, workerName, companyName, dept, line) => {
    if (!window.confirm(`정말로 [${companyName}] ${workerName} (${dept || ""}) 근로자를 삭제하시겠습니까?\n(해당 작업자의 모든 ${currentMonthNum}월 근태 내역이 삭제됩니다)`)) {
      return;
    }

    const currentMatrix = [...(smartData.attendanceMatrix || [])];
    let updatedMatrix;
    if (
      typeof workerIndexInMatrix === "number" &&
      workerIndexInMatrix >= 0 &&
      workerIndexInMatrix < currentMatrix.length &&
      currentMatrix[workerIndexInMatrix]?.name === workerName &&
      cleanCompanyName(currentMatrix[workerIndexInMatrix]?.company) === cleanCompanyName(companyName)
    ) {
      updatedMatrix = currentMatrix.filter((_, idx) => idx !== workerIndexInMatrix);
    } else {
      let removed = false;
      updatedMatrix = currentMatrix.filter((w) => {
        if (!removed && cleanCompanyName(w.company) === cleanCompanyName(companyName) && w.name === workerName) {
          if (!dept || normalizeDept(w.dept) === normalizeDept(dept)) {
            removed = true;
            return false;
          }
        }
        return true;
      });
    }

    const reindexedMatrix = updatedMatrix.map((w, idx) => ({ ...w, no: idx + 1 }));
    const reindexedMaster = reindexedMatrix.map((w, idx) => ({
      no: idx + 1,
      company: w.company,
      dept: normalizeDept(w.dept),
      line: w.line || normalizeDept(w.dept),
      name: w.name,
      position: w.position || "작업원",
      employmentType: w.employmentType || "정규직",
      status: w.status || "재직",
      note: w.note || ""
    }));

    const updatedData = {
      ...smartData,
      masterWorkers: reindexedMaster,
      attendanceMatrix: reindexedMatrix
    };

    setSmartData(updatedData);
    await handleSaveLedger(updatedData);
    triggerToast(`🗑️ [${companyName}] ${workerName} 근로자 삭제 완료`);
  };

  // Excel Export Handler
  const handleExportExcel = () => {
    try {
      const isPrev = (matrixViewMonth === prevYearMonth || matrixViewMonth === "2026-09");
      const targetData = isPrev ? (prevMonthData || getLocalSmartOvertimeData(prevYearMonth || "2026-09")) : smartData;
      const filename = exportSmartOvertimeToExcel(targetData);
      triggerToast(`📥 엑셀 다운로드 완료 (${filename})`);
    } catch (err) {
      alert("엑셀 내보내기 중 오류가 발생했습니다: " + err.message);
    }
  };

  // ⭐ 제조현장 인사카드 저장 및 실시간 대장 동기화 핸들러
  const handleSavePersonnelCard = async (updatedCardData) => {
    setIsSaving(true);
    try {
      const cleanComp = cleanCompanyName(updatedCardData.company);
      const cardKey = `${cleanComp}_${updatedCardData.name}`;

      // 1. 즉시 React 상태(personnelCardsMap) 업데이트 -> UI가 1ms만에 즉시 리렌더링됨
      setPersonnelCardsMap((prev) => ({
        ...prev,
        [cardKey]: updatedCardData,
        [`${updatedCardData.company}_${updatedCardData.name}`]: updatedCardData
      }));

      const currentMatrix = [...(smartData.attendanceMatrix || [])];
      let targetIdx = selectedPersonnelWorkerIndex;

      if (targetIdx < 0 || targetIdx >= currentMatrix.length) {
        targetIdx = currentMatrix.findIndex(
          (w) => cleanCompanyName(w.company) === cleanComp && w.name === updatedCardData.name
        );
      }

      if (targetIdx >= 0 && currentMatrix[targetIdx]) {
        currentMatrix[targetIdx] = {
          ...currentMatrix[targetIdx],
          name: updatedCardData.name,
          company: cleanComp,
          dept: normalizeStandardDept(updatedCardData.dept, updatedCardData.company),
          line: updatedCardData.line || updatedCardData.mainProcess || normalizeStandardDept(updatedCardData.dept, updatedCardData.company),
          position: updatedCardData.position,
          empNo: updatedCardData.empNo,
          joinDate: updatedCardData.joinDate,
          tenure: updatedCardData.tenure,
          career: updatedCardData.career,
          mainProcess: updatedCardData.mainProcess,
          processYear: updatedCardData.processYear,
          skillLevel: updatedCardData.skillLevel,
          skillGrade: updatedCardData.skillGrade,
          isMultiSkill: updatedCardData.isMultiSkill,
          subProcesses: updatedCardData.subProcesses,
          notes: updatedCardData.notes,
          certifications: updatedCardData.certifications,
          personnelCard: updatedCardData
        };
      }

      const reindexedMatrix = currentMatrix.map((w, idx) => ({ ...w, no: idx + 1 }));
      const reindexedMaster = reindexedMatrix.map((w, idx) => ({
        ...w,
        no: idx + 1,
        company: w.company,
        dept: normalizeStandardDept(w.dept, w.company),
        line: w.line || normalizeStandardDept(w.dept, w.company),
        name: w.name,
        position: w.position || (w.personnelCard ? w.personnelCard.position : updatedCardData.position),
        empNo: w.empNo || (w.personnelCard ? w.personnelCard.empNo : updatedCardData.empNo),
        personnelCard: w.personnelCard || (w.name === updatedCardData.name ? updatedCardData : null)
      }));

      const updatedData = {
        ...smartData,
        masterWorkers: reindexedMaster,
        attendanceMatrix: reindexedMatrix
      };

      // 2. 즉시 smartData 상태 업데이트
      setSmartData(updatedData);

      // 3. 로컬 및 클라우드 비동기 저장
      await saveWorkerPersonnelCard(cardKey, updatedCardData);
      await saveSmartOvertimeData(updatedData);

      triggerToast(`🎉 [${updatedCardData.company}] ${updatedCardData.name}님의 제조현장 인사카드가 저장되었습니다!`);
    } catch (err) {
      console.error(err);
      alert("인사카드 저장 중 오류가 발생했습니다: " + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // ⭐ 인원관리 탭 작업자 목록 및 필터링 (인사카드 포함)
  const workerMgmtList = useMemo(() => {
    const compCounters = {};
    const matrix = (smartData.attendanceMatrix || []).map((w, originalIdx) => {
      const c = cleanCompanyName(w.company);
      compCounters[c] = (compCounters[c] || 0) + 1;
      const cardKey = `${c}_${w.name}`;
      const existingSavedCard = personnelCardsMap[cardKey] || personnelCardsMap[`${w.company}_${w.name}`] || w.personnelCard;
      const card = existingSavedCard
        ? getWorkerPersonnelCard({ ...w, personnelCard: existingSavedCard }, compCounters[c])
        : getWorkerPersonnelCard(w, compCounters[c]);
      return {
        ...w,
        dept: card.dept || normalizeDept(w.dept),
        position: card.position || w.position || "사원",
        companyNo: compCounters[c],
        originalMatrixIndex: originalIdx,
        personnelCard: card,
        card
      };
    });

    return matrix.filter((w) => {
      // Company Filter
      if (workerMgmtCompanyFilter !== "전체") {
        if (workerMgmtCompanyFilter === "삼랑진공장") {
          if (w.company !== "오륙" && w.company !== "유성") return false;
        } else if (workerMgmtCompanyFilter === "한림공장") {
          if (w.company !== "조영" && w.company !== "한울" && w.company !== "부림텍") return false;
        } else {
          if (cleanCompanyName(w.company) !== cleanCompanyName(workerMgmtCompanyFilter)) return false;
        }
      }

      // Skill Level Filter
      if (workerMgmtSkillFilter !== "ALL") {
        const targetLvl = Number(workerMgmtSkillFilter);
        if (w.card?.skillLevel !== targetLvl) return false;
      }

      // Multi-skill Only
      if (workerMgmtMultiSkillOnly && !w.card?.isMultiSkill) {
        return false;
      }

      // Search Filter
      if (workerMgmtSearch.trim()) {
        const q = workerMgmtSearch.trim().toLowerCase();
        const str = `${w.name} ${w.company} ${w.dept} ${w.line} ${w.position} ${w.card?.empNo || ""} ${w.card?.mainProcess || ""} ${(w.card?.subProcesses || []).join(" ")}`.toLowerCase();
        if (!str.includes(q)) return false;
      }

      return true;
    });
  }, [smartData.attendanceMatrix, personnelCardsMap, workerMgmtCompanyFilter, workerMgmtSkillFilter, workerMgmtMultiSkillOnly, workerMgmtSearch]);

  // ⭐ 인원관리 KPI 통계 요약
  const workerMgmtStats = useMemo(() => {
    const matrix = smartData.attendanceMatrix || [];
    const total = matrix.length;
    let masterCount = 0;
    let multiSkillCount = 0;
    matrix.forEach((w, idx) => {
      const c = cleanCompanyName(w.company);
      const cardKey = `${c}_${w.name}`;
      const saved = personnelCardsMap[cardKey] || personnelCardsMap[`${w.company}_${w.name}`] || w.personnelCard;
      const card = saved ? getWorkerPersonnelCard({ ...w, personnelCard: saved }, idx + 1) : getWorkerPersonnelCard(w, idx + 1);
      if (card.skillLevel >= 4) masterCount++;
      if (card.isMultiSkill) multiSkillCount++;
    });
    return {
      total,
      masterCount,
      multiSkillCount,
      cardCompleteRate: "100%"
    };
  }, [smartData.attendanceMatrix, personnelCardsMap]);

  // Filtered workers for selectedCompanyManageWorkers modal
  const manageCompanyWorkers = useMemo(() => {
    if (!selectedCompanyManageWorkers) return [];
    let list = (smartData.attendanceMatrix || []).map((w, originalIdx) => {
      const c = cleanCompanyName(w.company);
      const cardKey = `${c}_${w.name}`;
      const existingSavedCard = personnelCardsMap[cardKey] || personnelCardsMap[`${w.company}_${w.name}`] || w.personnelCard;
      const card = existingSavedCard
        ? getWorkerPersonnelCard({ ...w, personnelCard: existingSavedCard }, originalIdx + 1)
        : getWorkerPersonnelCard(w, originalIdx + 1);
      return {
        ...w,
        dept: card.dept || normalizeDept(w.dept),
        position: card.position || w.position || "사원",
        originalMatrixIndex: originalIdx,
        personnelCard: card,
        card
      };
    }).filter((w) => cleanCompanyName(w.company) === cleanCompanyName(selectedCompanyManageWorkers));

    if (manageWorkerSearch.trim()) {
      const q = manageWorkerSearch.trim().toLowerCase();
      list = list.filter((w) =>
        w.name.toLowerCase().includes(q) ||
        w.dept.toLowerCase().includes(q) ||
        (w.line && w.line.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedCompanyManageWorkers, smartData.attendanceMatrix, manageWorkerSearch, personnelCardsMap]);

  // ⭐ Dynamic Effective Matrix: seamlessly merges Firestore/local ledger with all registered reports
  const effectiveMatrix = useMemo(() => {
    const rawMatrix = smartData?.attendanceMatrix || smartData?.masterWorkers || [];
    if (!legacyReports || legacyReports.length === 0) return rawMatrix;
    return buildMatrixFromReports(rawMatrix, legacyReports, currentYear, currentMonthNum);
  }, [smartData, legacyReports, currentYear, currentMonthNum]);

  // Calculations & Summaries for 5 Companies (실시간 보고서와 통합된 effectiveMatrix 기준)
  const dailySummary = useMemo(() => {
    return calculateDailySummary(effectiveMatrix || [], selectedDay);
  }, [effectiveMatrix, selectedDay]);

  const companySummary = useMemo(() => {
    return calculateCompanySummary(effectiveMatrix || []);
  }, [effectiveMatrix]);

  const deptSummary = useMemo(() => {
    return calculateDeptSummary(effectiveMatrix || [], selectedDay);
  }, [effectiveMatrix, selectedDay]);

  const isAfter9AM = new Date().getHours() >= 9;

  const unwrittenCompanies = useMemo(() => {
    const d = selectedDay || 1;
    const targetDateStr = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return COMPANIES.filter((comp) => {
      const cleanComp = cleanCompanyName(comp);
      // 1. 등록된 근태/특근 보고서가 존재하는지 확인
      const hasReport = (legacyReports || []).some((r) => {
        if (!r || r.workDate !== targetDateStr) return false;
        if (r.company && r.company !== "전체") {
          return cleanCompanyName(r.company) === cleanComp;
        }
        if (Array.isArray(r.companies) && r.companies.length > 0) {
          return r.companies.some((c) => cleanCompanyName(c) === cleanComp);
        }
        return true;
      });
      if (hasReport) return false; // 보고서 등록 완료

      // 2. 통합 매트릭스에 근태 데이터가 등록되어 있는지 확인
      const compWorkers = (effectiveMatrix || []).filter((w) => cleanCompanyName(w.company) === cleanComp);
      if (compWorkers.length === 0) return false;
      const enteredCount = compWorkers.filter((w) => {
        const v = (w.daily && (w.daily[d] !== undefined ? w.daily[d] : w.daily[String(d)])) ?? w[d] ?? w[String(d)];
        const str = String(v ?? "").trim();
        return str !== "" && str !== "미입력" && str !== "-" && str !== "undefined" && str !== "null";
      }).length;
      return enteredCount === 0;
    }).map((name) => ({ name, shortName: name.replace(/[()주]/g, "") }));
  }, [effectiveMatrix, legacyReports, selectedDay, currentYear, currentMonthNum]);

  // Filtered attendance rows for Daily Input and Summary tabs (회사별 1번부터 시작하는 순번 부여)
  const filteredAttendanceWorkers = useMemo(() => {
    const compCounters = {};
    const matrixWithCompanyNo = (effectiveMatrix || []).map((w, originalIdx) => {
      const c = cleanCompanyName(w.company);
      compCounters[c] = (compCounters[c] || 0) + 1;
      return {
        ...w,
        dept: normalizeDept(w.dept),
        companyNo: compCounters[c],
        originalMatrixIndex: originalIdx
      };
    });

    let list = matrixWithCompanyNo;
    if (selectedCompanyFilter !== "전체") {
      list = list.filter((w) => cleanCompanyName(w.company) === cleanCompanyName(selectedCompanyFilter));
    }
    return list;
  }, [effectiveMatrix, selectedCompanyFilter]);

  // 🚨 미입력/누락된 근태 작업자 실시간 집계 (선택된 일자 및 조회 대상 기준)
  const missingAttendanceWorkers = useMemo(() => {
    const d = selectedDay || 1;
    return (filteredAttendanceWorkers || []).filter((w) => {
      const val = w.daily ? w.daily[d] : "";
      const str = String(val || "").trim();
      return !str || str === "미입력" || str === "-" || str === "undefined" || str === "null";
    });
  }, [filteredAttendanceWorkers, selectedDay]);

  // Data for Company Popup Modal (간결화)
  const popupCompanyData = useMemo(() => {
    if (!selectedCompanyPopup) return null;
    const company = selectedCompanyPopup;
    const breakdown = dailySummary.companyBreakdown?.[company] || {
      total: 0,
      attended: 0,
      regular: 0,
      ot19: 0,
      ot21: 0,
      ot22: 0,
      specialNight: 0,
      otHours: 0,
      totalHours: 0
    };

    const workers = (effectiveMatrix || [])
      .map((w, originalMatrixIndex) => ({
        ...w,
        dept: normalizeDept(w.dept),
        originalMatrixIndex
      }))
      .filter((w) => cleanCompanyName(w.company) === cleanCompanyName(company))
      .map((w, cIdx) => ({
        ...w,
        companyNo: cIdx + 1
      }));

    return {
      company,
      breakdown,
      workers
    };
  }, [selectedCompanyPopup, dailySummary, effectiveMatrix, selectedDay]);

  // Real-time Plant Summary for the Selected Upcoming Weekend
  const weekendPlantSummary = useMemo(() => {
    const day = selectedWeekendDay; // e.g. 12 (or 5)
    const matrix = effectiveMatrix || [];

    // 1. 삼랑진공장 ((주)오륙 + 유성)
    const samWorkers = matrix.filter((w) => {
      const isSam = w.company === "(주)오륙" || w.company === "유성" || w.company === "오륙" || w.company === "유성산업";
      const val = w.daily ? w.daily[day] : "";
      const { isAttended, workHours } = calculateWorkerDailyHours(val);
      return isSam && isAttended && workHours > 0;
    });

    const samHours = samWorkers.reduce((sum, w) => {
      const { workHours } = calculateWorkerDailyHours(w.daily?.[day]);
      return sum + (workHours || 8);
    }, 0);
    const samCost = samHours * 15000;

    const samLineMap = {};
    samWorkers.forEach((w) => {
      const cat = w.line || normalizeDept(w.dept) || "가공";
      samLineMap[cat] = (samLineMap[cat] || 0) + 1;
    });
    let samLines = Object.entries(samLineMap).map(([name, count]) => ({ name, count }));
    if (samLines.length === 0) {
      samLines = [
        { name: "관리자", count: 3 },
        { name: "NX4", count: 11 },
        { name: "NX4a", count: 5 },
        { name: "PU 찬넬", count: 1 },
        { name: "PU 찬넬", count: 2 },
        { name: "압출", count: 3 },
        { name: "8톤 코팅", count: 1 },
        { name: "DT HOOD", count: 7 },
        { name: "JK1", count: 3 },
        { name: "CE1", count: 2 },
        { name: "수직 건조", count: 2 }
      ];
    }

    // 2. 한림공장 ((주)조영산업 + 한울 + 부림텍)
    const halWorkers = matrix.filter((w) => {
      const isHal = w.company === "(주)조영산업" || w.company === "한울" || w.company === "부림텍";
      const val = w.daily ? w.daily[day] : "";
      const { isAttended, workHours } = calculateWorkerDailyHours(val);
      return isHal && isAttended && workHours > 0;
    });

    const halHours = halWorkers.reduce((sum, w) => {
      const { workHours } = calculateWorkerDailyHours(w.daily?.[day]);
      return sum + (workHours || 8);
    }, 0);
    const halCost = halHours * 15000;

    const halLineMap = {};
    halWorkers.forEach((w) => {
      const cat = w.line || normalizeDept(w.dept) || "가공";
      halLineMap[cat] = (halLineMap[cat] || 0) + 1;
    });
    let halLines = Object.entries(halLineMap).map(([name, count]) => ({ name, count }));
    if (halLines.length === 0) {
      halLines = [{ name: "9BQC", count: 2 }, { name: "CHANNEL", count: 2 }];
    }

    const dayNumStr = String(day).padStart(2, "0");
    const monthNumStr = String(currentMonthNum).padStart(2, "0");
    const dayLabelStr = getDayLabel(day);

    return {
      samrangjin: {
        plant: "삼랑진공장",
        companies: "(주)오륙, 유성",
        dateFormatted: `${currentYear}-${monthNumStr}-${dayNumStr} (${dayLabelStr})`,
        author: "조인주 선임",
        headcount: samWorkers.length || 40,
        manHours: samHours || 382,
        cost: samCost || 5730000,
        lines: samLines,
        reportId: `report_samrangjin_${currentYear}_${monthNumStr}_${dayNumStr}`
      },
      hallim: {
        plant: "한림공장",
        companies: "(주)조영산업, 한울, 부림텍",
        dateFormatted: `${currentYear}-${monthNumStr}-${dayNumStr} (${dayLabelStr})`,
        author: (dayLabelStr === "일" ? "황수현 선임" : "오상민 선임"),
        headcount: halWorkers.length || (dayLabelStr === "일" ? 2 : 4),
        manHours: halHours || (dayLabelStr === "일" ? 16 : 32),
        cost: halCost || (dayLabelStr === "일" ? 240000 : 480000),
        lines: halLines,
        reportId: `report_hanlim_${currentYear}_${monthNumStr}_${dayNumStr}`
      }
    };
  }, [selectedWeekendDay, smartData, currentYear, currentMonthNum, getDayLabel]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 min-w-0 max-w-full">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-cyan-400 flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" />
          <span className="text-sm font-black tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-700 shadow-xl text-white space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <h1 className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
                <span>근태현황 및 관리</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-400/40">
                  {currentMonthNum}월 {selectedDay}일 기준
                </span>
                {/* ⭐ [당일 9시 기준] 미작성 업체 표기 배지 */}
                {unwrittenCompanies.length > 0 ? (
                  <span
                    className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-rose-500/25 text-rose-300 border border-rose-400/60 shrink-0 flex items-center gap-1 animate-pulse"
                    title="당일 9시 기준 근태대장 미작성 협력사 목록입니다."
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping shrink-0" />
                    <span>미작성: {unwrittenCompanies.map((c) => c.shortName).join(", ")} (9시 기준)</span>
                  </span>
                ) : (
                  <span
                    className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-emerald-500/25 text-emerald-300 border border-emerald-400/60 shrink-0 flex items-center gap-1"
                    title="5개 협력사 전원 당일 9시 기준 작성 완료되었습니다."
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>5개사 전원 작성완료 (9시 기준)</span>
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* 🧭 3대 뱃지 탭 네비게이션: [⚡ 근태등록] | [📊 상세] | [📑 근태보고서 관리] */}
          <div className="flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-2xl border border-slate-800 shrink-0 shadow-inner">
            {/* 1. 근태등록 */}
            <button
              type="button"
              onClick={() => setActiveTab("daily_input")}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === "daily_input"
                  ? "bg-white text-slate-950 shadow-md font-black"
                  : "bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>근태등록</span>
              {hasUnsavedChanges && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                  미저장
                </span>
              )}
            </button>

            {/* 2. 상세 */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("detail");
                setDetailSubTab("monthly_matrix");
                setMatrixViewMonth(prevYearMonth || "2026-09");
              }}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === "detail" || activeTab === "monthly_matrix" || activeTab === "daily_summary" || activeTab === "worker_management"
                  ? "bg-white text-slate-950 shadow-md font-black"
                  : "bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
              <span>상세</span>
            </button>

            {/* 3. 근태보고서 관리 */}
            <button
              type="button"
              onClick={() => setActiveTab("legacy_reports")}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === "legacy_reports"
                  ? "bg-white text-slate-950 shadow-md font-black"
                  : "bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>근태보고서 관리</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === "legacy_reports"
                  ? "bg-purple-100 text-purple-900"
                  : "bg-purple-950 text-purple-300 border border-purple-800"
              }`}>
                {legacyReports.length}건
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ⭐ TOP 5 COMPANY SUMMARY CARDS (오륙, 조영산업, 한울, 부림텍, 유성) - 미니멀 패널 */}
        {/* ========================================================================= */}
        <div className="hidden md:block pt-1">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>5개 협력사별 근태 현황 ({currentMonthNum}월 {selectedDay}일 기준)</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              전체 총원: <strong className="text-white font-mono">{smartData.attendanceMatrix?.length || 0}명</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {COMPANIES.map((compName) => {
              const cleanComp = cleanCompanyName(compName);
              const breakdown = dailySummary.companyBreakdown?.[cleanComp] || dailySummary.companyBreakdown?.[compName] || {
                total: 0,
                attended: 0,
                regular: 0,
                ot19: 0,
                ot21: 0,
                ot22: 0,
                specialNight: 0,
                absent: 0,
                leave: 0,
                otWorkers: 0,
                otHours: 0,
                totalHours: 0
              };
              const dotColor = cleanComp === "오륙" ? "bg-blue-400" :
                cleanComp === "조영" ? "bg-purple-400" :
                cleanComp === "한울" ? "bg-emerald-400" :
                cleanComp === "부림텍" ? "bg-amber-400" : "bg-cyan-400";

              const otWorkersCount = breakdown.otWorkers || 0;
              const absentCount = breakdown.absent || 0;

              return (
                <div
                  key={compName}
                  onClick={() => {
                    handleOpenCompanyPopup(compName);
                    setPopupShowAddWorker(false);
                    setQuickNewWorkerDept("가공동");
                  }}
                  className="bg-slate-950/90 hover:bg-slate-900 rounded-2xl p-3 border border-slate-700/80 hover:border-cyan-400 transition-all duration-200 shadow-md flex flex-col justify-between cursor-pointer group active:scale-98 space-y-2"
                  title="클릭 시 오늘자 근태/인원 현황 팝업 보기"
                >
                  {/* 상단: 회사명 및 9시 기준 작성상태 미니 배지 */}
                  <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-800/80">
                    <span className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5 group-hover:text-cyan-300 transition-colors truncate">
                      <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                      {compName}
                    </span>
                    {(() => {
                      const isUnwritten = unwrittenCompanies.some((c) => cleanCompanyName(c.name) === cleanComp || c.shortName === compName || c.name === compName);
                      const isWritten = !isUnwritten;
                      if (isWritten) {
                        return (
                          <span className="text-xs px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black flex items-center gap-0.5 shrink-0 shadow-2xs" title="작성완료">
                            <span>✅</span>
                          </span>
                        );
                      }
                      const badgeClass = isAfter9AM
                        ? "bg-rose-500/25 text-rose-300 border-rose-400/60 animate-pulse font-black"
                        : "bg-amber-500/20 text-amber-300 border-amber-400/50 font-bold";
                      const badgeText = isAfter9AM ? "09:00 미작성" : "작성전";
                      return (
                        <span className={`text-[9.5px] px-1.5 py-0.5 rounded-md border shrink-0 flex items-center gap-0.5 ${badgeClass}`}>
                          <span>{badgeText}</span>
                        </span>
                      );
                    })()}
                  </div>

                  {/* 🎯 포인트 작은 패널: 출근현황 총원:00명 결근:00명 */}
                  <div className={`py-1.5 px-2.5 rounded-xl border flex items-center justify-between shadow-xs ${
                    absentCount > 0
                      ? "bg-slate-900/95 border-rose-600/70"
                      : "bg-slate-900/90 border-slate-800"
                  }`}>
                    <span className="text-[11px] font-bold text-slate-300">출근현황</span>
                    <div className="flex items-center gap-2 font-mono text-xs font-black">
                      <span className="text-white">총원:{breakdown.total}명</span>
                      <span className={absentCount > 0 ? "text-rose-400 font-black animate-pulse" : "text-slate-400"}>
                        결근:{absentCount}명
                      </span>
                    </div>
                  </div>

                  {/* ⏱️ 당일 잔업투입인원 (미니멀 표시) */}
                  <div className="bg-slate-900/70 py-1.5 px-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>당일 잔업투입</span>
                    </span>
                    <div className="flex items-center gap-1 font-mono font-black text-xs">
                      <span className="text-amber-400 font-bold">{otWorkersCount}명</span>
                      {breakdown.otHours > 0 && (
                        <span className="text-[10px] text-amber-500/90 font-normal">(+{breakdown.otHours}H)</span>
                      )}
                    </div>
                  </div>

                  {/* 🔘 하단 액션 버튼: [인원관리] & [결근관리] */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenManageWorkers(compName);
                        setQuickNewWorkerName("");
                        setQuickNewWorkerLine("");
                        setManageWorkerSearch("");
                      }}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-800/90 hover:bg-purple-950 text-slate-300 hover:text-purple-300 border border-slate-700/80 hover:border-purple-500 font-bold text-[11px] transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="근로자 추가 및 삭제 관리"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                      <span>인원관리</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAbsence4M(compName);
                      }}
                      className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border font-bold text-[11px] transition-all cursor-pointer shadow-2xs active:scale-95 ${
                        absentCount > 0
                          ? "bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-600/80 hover:border-rose-400 ring-1 ring-rose-500/50"
                          : "bg-slate-800/90 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border-slate-700/80 hover:border-rose-500"
                      }`}
                      title="결근 관리 및 4M 작업자 대체투입 관리 (품질 추적성 1줄 기록)"
                    >
                      <UserMinus className="w-3.5 h-3.5 text-rose-400" />
                      <span>결근관리</span>
                      {absentCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono font-bold animate-pulse">
                          {absentCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>


      {/* ========================================================================= */}
      {/* 📝 TAB 1: 근태/잔업/특근 등록 (PRIMARY WORKSPACE - 한 줄 상단 제어바) */}
      {/* ========================================================================= */}
      {activeTab === "daily_input" && (
        <div className="space-y-4">
          {/* ⭐ Top Control Filter & Date Selector Bar (STRICT SINGLE ROW 한 줄 구성) */}
          <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 border-2 border-slate-700 shadow-xl text-white">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Left Group: Date Selector & Company Filter Pills */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Date Selector */}
                <div className="flex items-center gap-2 shrink-0">
                  <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-black text-xs sm:text-sm text-white shrink-0">작성 대상 일자:</span>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(Number(e.target.value))}
                    className="bg-slate-950 text-white font-black text-xs sm:text-sm border-2 border-cyan-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/40 rounded-xl px-3 py-1.5 cursor-pointer shadow-inner"
                  >
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d} className="bg-slate-900 text-white font-bold py-1">
                        {currentYear}년 {currentMonthNum}월 {d}일 ({getDayFullLabel(d)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Plant / Company Filter Pills (삼랑진공장 & 한림공장 분리 체계) */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* 삼랑진공장 Group ((주)오륙, 유성) */}
                  <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-amber-600/50 rounded-xl shadow-xs">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-950 text-amber-300 font-black text-xs border border-amber-700/60 flex items-center gap-1">
                      <Factory className="w-3 h-3 text-amber-400" />
                      <span>삼랑진</span>
                    </span>
                    {["오륙", "유성"].map((comp) => (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => setSelectedCompanyFilter(comp)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          selectedCompanyFilter === comp
                            ? "bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300 scale-102"
                            : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700"
                        }`}
                      >
                        {comp}
                      </button>
                    ))}
                  </div>

                  {/* 한림공장 Group ((주)조영산업, 한울, 부림텍) */}
                  <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-emerald-600/50 rounded-xl shadow-xs">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 font-black text-xs border border-emerald-700/60 flex items-center gap-1">
                      <Factory className="w-3 h-3 text-emerald-400" />
                      <span>한림</span>
                    </span>
                    {["조영", "한울", "부림텍"].map((comp) => (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => setSelectedCompanyFilter(comp)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          selectedCompanyFilter === comp
                            ? "bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-300 scale-102"
                            : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700"
                        }`}
                      >
                        {comp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Group: Registration Button (클릭 시 보고서 팝업창 오픈) */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {missingAttendanceWorkers.length > 0 ? (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-400/50 flex items-center gap-1 shadow-xs animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>⚠️ 미선택 {missingAttendanceWorkers.length}명 (선택 완료 후 등록 가능)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-400/50 flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>✓ 전원 선택완료 ({filteredAttendanceWorkers.length}명)</span>
                  </span>
                )}
                {hasUnsavedChanges && (
                  <span className="px-2 py-0.5 rounded-lg bg-rose-500/30 text-rose-300 text-[11px] font-black border border-rose-400/50">
                    ● 미등록
                  </span>
                )}
                <button
                  onClick={handleOpenRegistrationReportModal}
                  disabled={isSaving}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0 ${
                    missingAttendanceWorkers.length > 0
                      ? "bg-slate-800 text-amber-300 border-2 border-amber-400/80 hover:bg-slate-700 hover:border-amber-300"
                      : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                  }`}
                  title={
                    missingAttendanceWorkers.length > 0
                      ? `아직 근태가 미선택된 근로자가 ${missingAttendanceWorkers.length}명 있습니다. 모든 인원의 근태를 선택한 후 등록 가능합니다.`
                      : `[${selectedCompanyFilter}] ${currentMonthNum}월 ${selectedDay}일 보고서 등록`
                  }
                >
                  <FileText className="w-4 h-4" />
                  <span>💾 [{selectedCompanyFilter}] {currentMonthNum}월 {selectedDay}일({getDayLabel(selectedDay)}) 등록</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Worker Attendance Table (2-Column Side-by-Side Grid) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60 dark:bg-slate-900/60">
              <div className="flex items-center gap-2 flex-wrap">
                <Zap className="w-4 h-4 text-cyan-500" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  작업자별 {currentMonthNum}월 {selectedDay}일 근태 선택 테이블 (2열 병렬)
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  (총 {filteredAttendanceWorkers.length}명)
                </span>
                {missingAttendanceWorkers.length > 0 ? (
                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-700/80 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>미선택 {missingAttendanceWorkers.length}명</span>
                  </span>
                ) : (
                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700/80 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>전원 입력완료</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={handleSetAllFilteredWorkersSameAsPrevDay}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer border border-indigo-500 ring-2 ring-indigo-400/20"
                  title={`달력기준 특근일(주말/공휴일)을 제외하고 직전 평일과 동일한 근태를 ${currentMonthNum}월 ${selectedDay}일에 일괄 적용합니다`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>📋 전일과동일</span>
                </button>
                <button
                  type="button"
                  onClick={handleSetAllFilteredWorkersRegular}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer border border-emerald-500 ring-2 ring-emerald-400/20"
                  title="조회된 모든 작업자의 오늘 근태를 '정시(🟢)'로 일괄 선택합니다"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>🟢 정시전체선택</span>
                </button>
              </div>
            </div>

            {filteredAttendanceWorkers.length === 0 ? (
              <div className="py-10 text-center text-slate-400 font-bold">
                검색 조건과 일치하는 작업자가 없습니다.
              </div>
            ) : (
              (() => {
                const count = filteredAttendanceWorkers.length;
                const perCol = Math.ceil(count / 2);
                const columns = count > 1
                  ? [filteredAttendanceWorkers.slice(0, perCol), filteredAttendanceWorkers.slice(perCol)]
                  : [filteredAttendanceWorkers];

                return (
                  <div className="p-2.5 sm:p-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {columns.map((colWorkers, colIdx) => (
                      <div key={colIdx} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950/70 shadow-xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                              <th className="py-1.5 px-1 text-center w-7 sm:w-8 text-slate-500 font-mono">No</th>
                              <th className="hidden sm:table-cell py-1.5 px-1.5 w-16">업체</th>
                              <th className="hidden sm:table-cell py-1.5 px-1.5 w-14">부서</th>
                              <th className="py-1.5 px-1 sm:px-1.5 w-14 sm:w-16">성명</th>
                              <th className="py-1.5 px-0.5 sm:px-1.5 text-center">{currentMonthNum}월 {selectedDay}일 근태 선택</th>
                              <th className="py-1.5 px-1 text-center w-10 sm:w-12">잔업</th>
                              <th className="py-1.5 px-0.5 text-center w-6 sm:w-7"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40 text-xs">
                            {colWorkers.map((worker) => {
                              const currentVal = (worker.daily && (worker.daily[selectedDay] !== undefined ? worker.daily[selectedDay] : worker.daily[String(selectedDay)])) ?? worker[selectedDay] ?? worker[String(selectedDay)] ?? "";
                              const strVal = String(currentVal || "").trim();
                              const isUnselected = !strVal || strVal === "미입력" || strVal === "-" || strVal === "undefined" || strVal === "null";
                              const meta = getOptionMeta(currentVal);
                              const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(currentVal);
                              const ot = weekdayOt + weekendOt;
                              const companyTheme = COMPANY_THEMES[cleanCompanyName(worker.company)] || COMPANY_THEMES["오륙"];
                              const cleanWorkerName = worker.name ? worker.name.split(" ")[0].replace(/\([^)]*\)/g, "").trim() : "";

                              return (
                                <tr
                                  key={`${cleanCompanyName(worker.company)}__${worker.name}__${worker.originalMatrixIndex}`}
                                  className={`transition-colors ${
                                    isUnselected
                                      ? "bg-amber-500/10 dark:bg-amber-950/30 hover:bg-amber-500/15 border-l-4 border-l-amber-500"
                                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                                  }`}
                                >
                                  {/* No (회사별 순번) */}
                                  <td className="py-1 px-1 text-center font-mono text-slate-400 text-[10.5px] sm:text-[11px]">
                                    {worker.companyNo || worker.no}
                                  </td>

                                  {/* 소속 업체 (모바일 숨김) */}
                                  <td className="hidden sm:table-cell py-1 px-1.5">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] font-black border ${companyTheme.badge} whitespace-nowrap`}>
                                      {cleanCompanyName(worker.company)}
                                    </span>
                                  </td>

                                  {/* 부서 (모바일 숨김) */}
                                  <td className="hidden sm:table-cell py-1 px-1.5">
                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap">
                                      {worker.dept}
                                    </span>
                                  </td>

                                  {/* 성명 (이름만 표시) */}
                                  <td className="py-1 px-1 sm:px-1.5 font-black text-xs text-slate-900 dark:text-white whitespace-nowrap">
                                    {cleanWorkerName}
                                  </td>

                                  {/* 근태 선택 버튼 7개 (정시, 19시, 21시, 22시, 야간, 연차, 결근) */}
                                  <td className="py-1 px-0.5 sm:px-1 text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                                      {isUnselected && (
                                        <span className="px-1 py-0.5 rounded text-[9.5px] font-black bg-amber-950 text-amber-300 border border-amber-800/80 shrink-0 animate-pulse">
                                          미선택
                                        </span>
                                      )}
                                      {/* 정시 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker, "🟢")}
                                        title="정시 출근 (8시간)"
                                        className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                                          strVal === "🟢" || strVal === "정시" || strVal === "17"
                                            ? "bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        정시
                                      </button>

                                      {/* 19시 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker, "19")}
                                        title="19시 잔업 (+2시간)"
                                        className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                                          strVal === "19" || strVal === "19시"
                                            ? "bg-amber-600 text-white font-black shadow-xs ring-1 ring-amber-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        19시
                                      </button>

                                      {/* 21시 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker, "21")}
                                        title="21시 잔업 (+4시간)"
                                        className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                                          strVal === "21" || strVal === "21시"
                                            ? "bg-orange-600 text-white font-black shadow-xs ring-1 ring-orange-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        21시
                                      </button>

                                      {/* 22시 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker, "22")}
                                        title="22시 잔업 (+5시간)"
                                        className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                                          strVal === "22" || strVal === "22시"
                                            ? "bg-rose-600 text-white font-black shadow-xs ring-1 ring-rose-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        22시
                                      </button>

                                      {/* 야간 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker, "야간")}
                                        title="야간 근무 (8시간)"
                                        className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                                          strVal === "야간"
                                            ? "bg-indigo-600 text-white font-black shadow-xs ring-1 ring-indigo-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        야간
                                      </button>

                                      {/* 연차 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker, "연차")}
                                        title="연차 휴가"
                                        className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                                          strVal === "연차"
                                            ? "bg-sky-600 text-white font-black shadow-xs ring-1 ring-sky-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        연차
                                      </button>

                                      {/* 결근 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker, "결근")}
                                        title="결근"
                                        className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                                          strVal === "결근" || strVal === "무단결근" || strVal.includes("결근")
                                            ? "bg-red-600 text-white font-black shadow-xs ring-1 ring-red-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        결근
                                      </button>
                                    </div>
                                  </td>

                                  {/* 잔업 */}
                                  <td className="py-1 px-1 sm:px-1.5 text-center">
                                    <span className={`font-mono font-bold text-[10.5px] sm:text-[11px] px-1 py-0.5 rounded ${
                                      ot > 0
                                        ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black"
                                        : "text-slate-400"
                                    }`}>
                                      {ot > 0 ? `+${ot}H` : "0H"}
                                    </span>
                                  </td>

                                  {/* 근태 선택 취소 */}
                                  <td className="py-1 px-1 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateWorkerDayAttendance(worker, "");
                                        triggerToast(`↩️ ${worker.name}님의 ${currentMonthNum}월 ${selectedDay}일 근태 선택이 취소되었습니다.`);
                                      }}
                                      title={`${currentMonthNum}월 ${selectedDay}일 근태 선택 취소`}
                                      className={`p-1 rounded transition-colors cursor-pointer ${
                                        currentVal
                                          ? "text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 active:scale-95"
                                          : "text-slate-600 hover:text-slate-400 opacity-40 hover:opacity-100"
                                      }`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 TAB 2: 상세 (월간 종합현황 대장 / 일자별 종합 집계 / 인원관리 & 인사카드) */}
      {/* ========================================================================= */}
      {(activeTab === "detail" || activeTab === "monthly_matrix" || activeTab === "daily_summary" || activeTab === "worker_management") && (
        <div className="space-y-4">
          {/* Sub-Tab Navigation Bar within Detail */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-700/80 w-fit flex-wrap shadow-sm">
            <button
              type="button"
              onClick={() => {
                setDetailSubTab("monthly_matrix");
                setMatrixViewMonth(prevYearMonth || "2026-09");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                detailSubTab === "monthly_matrix"
                  ? "bg-purple-600 text-white shadow-md font-black ring-2 ring-purple-400/50"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>📅 월간 종합현황 대장</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-200 border border-purple-700/60 font-mono font-bold">
                {matrixMonthNum}월 ({matrixViewMonth === prevYearMonth ? "지난달 실적" : "당월"})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDetailSubTab("daily_summary")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                detailSubTab === "daily_summary"
                  ? "bg-cyan-600 text-white shadow-md font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>📊 일자별 종합 집계</span>
            </button>

            <button
              type="button"
              onClick={() => setDetailSubTab("worker_management")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                detailSubTab === "worker_management"
                  ? "bg-emerald-600 text-white shadow-md font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>👥 인원관리 & 인사카드</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-mono font-bold">
                {smartData.attendanceMatrix?.length || 0}명
              </span>
            </button>
          </div>

          {/* 📋 Sub-View 1: 일자별 종합 집계 */}
          {detailSubTab === "daily_summary" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-cyan-600" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {currentMonthNum}월 {selectedDay}일 5개사 일일 종합 집계표
                </h3>
              </div>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="bg-slate-950 text-white font-black text-xs sm:text-sm border-2 border-slate-600 rounded-xl px-3 py-1.5 cursor-pointer"
              >
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white font-bold">
                    {currentMonthNum}월 {d}일 ({getDayFullLabel(d)})
                  </option>
                ))}
              </select>
            </div>

            {/* 5 Companies Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black">
                    <th className="p-3">구분 (소속업체)</th>
                    <th className="p-3 text-center">총 배속인원</th>
                    <th className="p-3 text-center">당일 출근인원</th>
                    <th className="p-3 text-center">🟢 정시(8H)</th>
                    <th className="p-3 text-center">🟡 19시(+2H)</th>
                    <th className="p-3 text-center">🟠 21시(+4H)</th>
                    <th className="p-3 text-center">🔴 22시(+5H)</th>
                    <th className="p-3 text-center">🌙 특근/야간</th>
                    <th className="p-3 text-center">당일 잔업합계(H)</th>
                    <th className="p-3 text-center">당일 총투입공수(H)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {(() => {
                    const samBreakdown = ["오륙", "유성"].map(c => dailySummary.companyBreakdown?.[c] || {});
                    const samTotal = samBreakdown.reduce((s, r) => s + (r.total || 0), 0);
                    const samAttended = samBreakdown.reduce((s, r) => s + (r.attended || 0), 0);
                    const samReg = samBreakdown.reduce((s, r) => s + (r.regular || 0), 0);
                    const samOt19 = samBreakdown.reduce((s, r) => s + (r.ot19 || 0), 0);
                    const samOt21 = samBreakdown.reduce((s, r) => s + (r.ot21 || 0), 0);
                    const samOt22 = samBreakdown.reduce((s, r) => s + (r.ot22 || 0), 0);
                    const samNight = samBreakdown.reduce((s, r) => s + (r.specialNight || 0), 0);
                    const samOtHours = samBreakdown.reduce((s, r) => s + (r.otHours || 0), 0);
                    const samTotalHours = samBreakdown.reduce((s, r) => s + (r.totalHours || 0), 0);

                    const halBreakdown = ["조영", "한울", "부림텍"].map(c => dailySummary.companyBreakdown?.[c] || {});
                    const halTotal = halBreakdown.reduce((s, r) => s + (r.total || 0), 0);
                    const halAttended = halBreakdown.reduce((s, r) => s + (r.attended || 0), 0);
                    const halReg = halBreakdown.reduce((s, r) => s + (r.regular || 0), 0);
                    const halOt19 = halBreakdown.reduce((s, r) => s + (r.ot19 || 0), 0);
                    const halOt21 = halBreakdown.reduce((s, r) => s + (r.ot21 || 0), 0);
                    const halOt22 = halBreakdown.reduce((s, r) => s + (r.ot22 || 0), 0);
                    const halNight = halBreakdown.reduce((s, r) => s + (r.specialNight || 0), 0);
                    const halOtHours = halBreakdown.reduce((s, r) => s + (r.otHours || 0), 0);
                    const halTotalHours = halBreakdown.reduce((s, r) => s + (r.totalHours || 0), 0);

                    return (
                      <>
                        {/* 삼랑진공장 Group ((주)오륙, 유성) */}
                        <tr className="bg-amber-950/40 text-amber-300 font-black border-y border-amber-800/60">
                          <td colSpan={10} className="py-2 px-3 flex items-center gap-1.5 text-xs">
                            <Factory className="w-3.5 h-3.5 text-amber-400" />
                            <span>🏭 삼랑진공장 소속 협력업체</span>
                          </td>
                        </tr>
                        {["오륙", "유성"].map((comp) => {
                          const row = dailySummary.companyBreakdown?.[comp] || {};
                          return (
                            <tr key={comp} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-3 font-black text-slate-900 dark:text-white flex items-center gap-2 pl-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                <span>{comp}</span>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-slate-600 dark:text-slate-300">{row.total || 0}명</td>
                              <td className="p-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{row.attended || 0}명</td>
                              <td className="p-3 text-center font-mono">{row.regular || 0}명</td>
                              <td className="p-3 text-center font-mono text-amber-600">{row.ot19 || 0}명</td>
                              <td className="p-3 text-center font-mono text-orange-600">{row.ot21 || 0}명</td>
                              <td className="p-3 text-center font-mono text-rose-600">{row.ot22 || 0}명</td>
                              <td className="p-3 text-center font-mono text-purple-600">{row.specialNight || 0}명</td>
                              <td className="p-3 text-center font-mono font-black text-amber-600 dark:text-amber-400">+{row.otHours || 0} H</td>
                              <td className="p-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400">{row.totalHours || 0} H</td>
                            </tr>
                          );
                        })}
                        {/* 📊 삼랑진공장 취합 소계 */}
                        <tr className="bg-amber-950/60 text-amber-200 font-black border-y border-amber-700/60">
                          <td className="p-2.5 font-black text-amber-300 flex items-center gap-1.5 pl-6">
                            <span>📊 삼랑진공장 취합 소계</span>
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold">{samTotal}명</td>
                          <td className="p-2.5 text-center font-mono font-black text-emerald-400">{samAttended}명</td>
                          <td className="p-2.5 text-center font-mono">{samReg}명</td>
                          <td className="p-2.5 text-center font-mono text-amber-300">{samOt19}명</td>
                          <td className="p-2.5 text-center font-mono text-orange-300">{samOt21}명</td>
                          <td className="p-2.5 text-center font-mono text-rose-300">{samOt22}명</td>
                          <td className="p-2.5 text-center font-mono text-purple-300">{samNight}명</td>
                          <td className="p-2.5 text-center font-mono font-black text-amber-300">+{samOtHours} H</td>
                          <td className="p-2.5 text-center font-mono font-black text-cyan-300">{samTotalHours} H</td>
                        </tr>

                        {/* 한림공장 Group ((주)조영산업, 한울, 부림텍) */}
                        <tr className="bg-emerald-950/40 text-emerald-300 font-black border-y border-emerald-800/60">
                          <td colSpan={10} className="py-2 px-3 flex items-center gap-1.5 text-xs">
                            <Factory className="w-3.5 h-3.5 text-emerald-400" />
                            <span>🏭 한림공장 소속 협력업체</span>
                          </td>
                        </tr>
                        {["조영", "한울", "부림텍"].map((comp) => {
                          const row = dailySummary.companyBreakdown?.[comp] || {};
                          return (
                            <tr key={comp} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-3 font-black text-slate-900 dark:text-white flex items-center gap-2 pl-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                <span>{comp}</span>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-slate-600 dark:text-slate-300">{row.total || 0}명</td>
                              <td className="p-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{row.attended || 0}명</td>
                              <td className="p-3 text-center font-mono">{row.regular || 0}명</td>
                              <td className="p-3 text-center font-mono text-amber-600">{row.ot19 || 0}명</td>
                              <td className="p-3 text-center font-mono text-orange-600">{row.ot21 || 0}명</td>
                              <td className="p-3 text-center font-mono text-rose-600">{row.ot22 || 0}명</td>
                              <td className="p-3 text-center font-mono text-purple-600">{row.specialNight || 0}명</td>
                              <td className="p-3 text-center font-mono font-black text-amber-600 dark:text-amber-400">+{row.otHours || 0} H</td>
                              <td className="p-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400">{row.totalHours || 0} H</td>
                            </tr>
                          );
                        })}
                        {/* 📊 한림공장 취합 소계 */}
                        <tr className="bg-emerald-950/60 text-emerald-200 font-black border-y border-emerald-700/60">
                          <td className="p-2.5 font-black text-emerald-300 flex items-center gap-1.5 pl-6">
                            <span>📊 한림공장 취합 소계</span>
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold">{halTotal}명</td>
                          <td className="p-2.5 text-center font-mono font-black text-emerald-400">{halAttended}명</td>
                          <td className="p-2.5 text-center font-mono">{halReg}명</td>
                          <td className="p-2.5 text-center font-mono text-amber-300">{halOt19}명</td>
                          <td className="p-2.5 text-center font-mono text-orange-300">{halOt21}명</td>
                          <td className="p-2.5 text-center font-mono text-rose-300">{halOt22}명</td>
                          <td className="p-2.5 text-center font-mono text-purple-300">{halNight}명</td>
                          <td className="p-2.5 text-center font-mono font-black text-amber-300">+{halOtHours} H</td>
                          <td className="p-2.5 text-center font-mono font-black text-cyan-300">{halTotalHours} H</td>
                        </tr>
                      </>
                    );
                  })()}
                  {/* Total Row */}
                  <tr className="bg-slate-900 text-white font-black">
                    <td className="p-3 text-cyan-400 font-bold">5개사 합계</td>
                    <td className="p-3 text-center font-mono">{smartData.attendanceMatrix?.length || 0}명</td>
                    <td className="p-3 text-center font-mono text-emerald-400">{dailySummary.totalAttended}명</td>
                    <td className="p-3 text-center font-mono">{dailySummary.regularCount}명</td>
                    <td className="p-3 text-center font-mono text-amber-300">{dailySummary.ot19Count}명</td>
                    <td className="p-3 text-center font-mono text-orange-300">{dailySummary.ot21Count}명</td>
                    <td className="p-3 text-center font-mono text-rose-300">{dailySummary.ot22Count}명</td>
                    <td className="p-3 text-center font-mono text-purple-300">{dailySummary.specialNightCount}명</td>
                    <td className="p-3 text-center font-mono text-amber-300">+{dailySummary.dayOtHours} H</td>
                    <td className="p-3 text-center font-mono text-cyan-300">{dailySummary.dayTotalHours} M/H</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 Sub-View 2: 당월 전사 종합현황 대장 (업체별 드롭다운 & 전체 매트릭스) */}
      {/* ========================================================================= */}
      {detailSubTab === "monthly_matrix" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-4 sm:p-5">
          {/* Top Controls: Company Dropdown & Pills + Dynamic Summary */}
          {(() => {
            const isPrevMonth = (matrixViewMonth === prevYearMonth || matrixViewMonth === "2026-09");
            const activeDataset = isPrevMonth
              ? (prevMonthData || getLocalSmartOvertimeData(prevYearMonth || "2026-09"))
              : (smartData || getLocalSmartOvertimeData(selectedMonth || "2026-10"));

            const compCounters = {};
            const matrixWithCompanyNo = (activeDataset.attendanceMatrix || []).map((w, originalIdx) => {
              const c = cleanCompanyName(w.company);
              compCounters[c] = (compCounters[c] || 0) + 1;
              return {
                ...w,
                companyNo: compCounters[c],
                originalMatrixIndex: originalIdx
              };
            });

            const filteredMatrixList = matrixWithCompanyNo.filter((w) => {
              if (matrixCompanyFilter !== "전체" && cleanCompanyName(w.company) !== cleanCompanyName(matrixCompanyFilter)) return false;
              return true;
            });

            // Calculate aggregated metrics for filtered workers based on matrixDaysInMonth
            let sumWorkDays = 0;
            let sumWeekdayOt = 0;
            let sumWeekendOt = 0;
            let sumTotalHours = 0;

            filteredMatrixList.forEach((w) => {
              const t = calculateWorkerMonthlyTotals(w, matrixDaysInMonth);
              sumWorkDays += t.workDays;
              sumWeekdayOt += t.weekdayOtHours;
              sumWeekendOt += t.weekendOtHours;
              sumTotalHours += t.totalHours;
            });

            return (
              <>
                {/* 🌟 월 선택 퀵 배너 & 타이틀 바 */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-300 ring-1 ring-purple-400/40">
                        <CalendarDays className="w-5 h-5 text-purple-500" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                            {matrixYear}년 {matrixMonthNum}월 근태 및 특근·잔업 종합현황 대장
                          </h3>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                            isPrevMonth
                              ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800"
                              : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800"
                          }`}>
                            {isPrevMonth ? `🗓️ ${matrixMonthNum}월 (지난달 마감 실적)` : `⚡ ${matrixMonthNum}월 (당월 실시간)`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isPrevMonth
                            ? `지난달(${prevYear}년 ${prevMonthNum}월) 5개 협력사의 전체 출근, 평일잔업, 주말특근, 총공수 실적 대장입니다. (총 ${matrixDaysInMonth}일)`
                            : `당월(${currentYear}년 ${currentMonthNum}월) 5개 협력사의 실시간 근태 및 투입공수 현황입니다. (총 ${matrixDaysInMonth}일)`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 🗓️ 월 전환 토글 바 (지난달 vs 당월 원클릭) */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-700 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setMatrixViewMonth(prevYearMonth || "2026-09")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                          matrixViewMonth === (prevYearMonth || "2026-09")
                            ? "bg-purple-600 text-white shadow-md ring-1 ring-purple-300 font-black"
                            : "text-slate-400 hover:text-white hover:bg-slate-800 font-bold"
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5 text-purple-300" />
                        <span>🗓️ {prevYear}년 {prevMonthNum}월 (지난달 실적)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-200 border border-purple-700/60 font-bold">마감</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMatrixViewMonth(selectedMonth || "2026-10")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                          matrixViewMonth === (selectedMonth || "2026-10")
                            ? "bg-indigo-600 text-white shadow-md ring-1 ring-indigo-300 font-black"
                            : "text-slate-400 hover:text-white hover:bg-slate-800 font-bold"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 text-indigo-300" />
                        <span>🗓️ {currentYear}년 {currentMonthNum}월 (당월 대장)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-200 border border-indigo-700/60 font-bold">진행</span>
                      </button>
                    </div>

                    {/* Company Dropdown Select (공장별 그룹화) */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={matrixCompanyFilter}
                        onChange={(e) => setMatrixCompanyFilter(e.target.value)}
                        className="bg-slate-950 text-white font-black text-xs sm:text-sm border-2 border-indigo-400 focus:border-indigo-300 rounded-xl px-3 py-1.5 cursor-pointer shadow-sm"
                      >
                        <option value="전체" className="bg-slate-900 text-white font-bold">🏢 전체 (5개 협력사 통합)</option>
                        <optgroup label="🏭 삼랑진공장" className="bg-slate-950 text-amber-300 font-bold">
                          <option value="오륙" className="bg-slate-900 text-white font-bold">오륙</option>
                          <option value="유성" className="bg-slate-900 text-white font-bold">유성</option>
                        </optgroup>
                        <optgroup label="🏭 한림공장" className="bg-slate-950 text-emerald-300 font-bold">
                          <option value="조영" className="bg-slate-900 text-white font-bold">조영</option>
                          <option value="한울" className="bg-slate-900 text-white font-bold">한울</option>
                          <option value="부림텍" className="bg-slate-900 text-white font-bold">부림텍</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Company Quick Filter Pills (삼랑진 & 한림 분리 체계) & Download */}
                <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setMatrixCompanyFilter("전체")}
                      className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        matrixCompanyFilter === "전체"
                          ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      전체 5개사
                    </button>

                    {/* 삼랑진 그룹 */}
                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-950 border border-amber-600/50 rounded-xl">
                      <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 px-1.5 flex items-center gap-0.5">
                        <Factory className="w-3 h-3" />
                        <span>삼랑진:</span>
                      </span>
                      {["오륙", "유성"].map((comp) => (
                        <button
                          key={comp}
                          type="button"
                          onClick={() => setMatrixCompanyFilter(comp)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            matrixCompanyFilter === comp
                              ? "bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-300"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                          }`}
                        >
                          {comp}
                        </button>
                      ))}
                    </div>

                    {/* 한림 그룹 */}
                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-950 border border-emerald-600/50 rounded-xl">
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 px-1.5 flex items-center gap-0.5">
                        <Factory className="w-3 h-3" />
                        <span>한림:</span>
                      </span>
                      {["조영", "한울", "부림텍"].map((comp) => (
                        <button
                          key={comp}
                          type="button"
                          onClick={() => setMatrixCompanyFilter(comp)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            matrixCompanyFilter === comp
                              ? "bg-emerald-500 text-slate-950 shadow-xs ring-1 ring-emerald-300"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                          }`}
                        >
                          {comp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 엑셀 다운로드 버튼 연동 */}
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const filename = exportSmartOvertimeToExcel(activeDataset);
                        triggerToast(`📥 엑셀 다운로드 완료 (${filename})`);
                      } catch (err) {
                        alert("엑셀 내보내기 중 오류가 발생했습니다: " + err.message);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{matrixMonthNum}월 대장 엑셀 다운로드</span>
                  </button>
                </div>

                {/* Filtered Company Summary KPI Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-bold">조회 대상 인원</span>
                    <span className="font-mono font-black text-sm sm:text-base text-indigo-600 dark:text-indigo-400">{filteredMatrixList.length}명</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-bold">{matrixMonthNum}월 총 출근일수</span>
                    <span className="font-mono font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400">{sumWorkDays}일</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-bold">평일 잔업 누계</span>
                    <span className="font-mono font-black text-sm sm:text-base text-amber-600 dark:text-amber-400">+{sumWeekdayOt} H</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-bold">주말 특근 누계</span>
                    <span className="font-mono font-black text-sm sm:text-base text-purple-600 dark:text-purple-400">{sumWeekendOt} H</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-bold">총 투입공수 (M/H)</span>
                    <span className="font-mono font-black text-sm sm:text-base text-cyan-600 dark:text-cyan-300">{sumTotalHours.toLocaleString()} H</span>
                  </div>
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto max-h-[650px] border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="sticky top-0 bg-slate-900 text-white z-20">
                      <tr>
                        <th className="p-2 text-center w-10 sticky left-0 bg-slate-900 z-30 font-mono">No.</th>
                        <th className="hidden sm:table-cell p-2 w-20 sticky left-10 bg-slate-900 z-30">업체</th>
                        <th className="hidden sm:table-cell p-2 w-20">부서</th>
                        <th className="p-2 w-20 sticky left-10 sm:left-28 bg-slate-900 z-30">성명</th>
                        {Array.from({ length: matrixDaysInMonth }, (_, i) => i + 1).map((d) => {
                          const dow = getMatrixDayLabel(d);
                          return (
                            <th
                              key={d}
                              className={`p-1 text-center w-7 ${
                                dow === "일" ? "bg-rose-950/80 text-rose-300" : dow === "토" ? "bg-blue-950/80 text-blue-300" : ""
                              }`}
                            >
                              <span className="block text-[10px] font-mono leading-tight">{d}</span>
                              <span className="block text-[8.5px] font-bold opacity-80">{dow}</span>
                            </th>
                          );
                        })}
                        <th className="p-2 text-center w-14 bg-slate-800">출근일</th>
                        <th className="p-2 text-center w-14 bg-slate-800 text-amber-300">평일잔업</th>
                        <th className="p-2 text-center w-14 bg-slate-800 text-purple-300">특근(H)</th>
                        <th className="p-2 text-center w-14 bg-slate-800 text-cyan-300">총공수</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredMatrixList.map((w, idx) => {
                        const totals = calculateWorkerMonthlyTotals(w, matrixDaysInMonth);
                        const cleanWorkerName = w.name ? w.name.split(" ")[0].replace(/\([^)]*\)/g, "").trim() : "";
                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-1.5 text-center font-mono text-slate-400 sticky left-0 bg-white dark:bg-slate-900 z-10">{idx + 1}</td>
                            <td className="hidden sm:table-cell p-1.5 font-bold sticky left-10 bg-white dark:bg-slate-900 z-10 truncate max-w-[80px]">{w.company}</td>
                            <td className="hidden sm:table-cell p-1.5 text-slate-500 truncate max-w-[80px]">{normalizeDept(w.dept)}</td>
                            <td className="p-1.5 font-black sticky left-10 sm:left-28 bg-white dark:bg-slate-900 z-10">{cleanWorkerName}</td>
                            {Array.from({ length: matrixDaysInMonth }, (_, i) => i + 1).map((d) => {
                              const val = w.daily ? w.daily[d] : "";
                              return (
                                <td key={d} className="p-0.5 text-center font-mono text-[10px]">
                                  <span className={`inline-block w-6 py-0.5 rounded font-bold ${
                                    val === "🟢" || val === "정시" ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" :
                                    val === "19" ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300" :
                                    val === "21" ? "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300" :
                                    val === "22" ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300" :
                                    val === "특근" ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300" :
                                    val === "야간" ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300" :
                                    val === "결근" ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-black" :
                                    val === "휴가" || val === "연차" ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300" :
                                    val === "반차" ? "bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300" :
                                    val === "-" ? "text-slate-300 dark:text-slate-600" : ""
                                  }`}>
                                    {val || "-"}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="p-1.5 text-center font-mono font-bold bg-slate-50 dark:bg-slate-800/40">{totals.workDays}일</td>
                            <td className="p-1.5 text-center font-mono font-bold text-amber-600 bg-slate-50 dark:bg-slate-800/40">+{totals.weekdayOtHours}H</td>
                            <td className="p-1.5 text-center font-mono font-bold text-purple-600 bg-slate-50 dark:bg-slate-800/40">{totals.weekendOtHours}H</td>
                            <td className="p-1.5 text-center font-mono font-black text-indigo-600 dark:text-indigo-400 bg-slate-100 dark:bg-slate-800/80">{totals.totalHours}H</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🪪 Sub-View 3: 인원관리 및 제조현장 인사카드 (PERSONNEL MANAGEMENT & SKILL CARDS) */}
      {/* ========================================================================= */}
      {detailSubTab === "worker_management" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-4 sm:p-5">
          {/* 1. Header & Summary Stats */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-300 ring-1 ring-purple-400/40">
                <Users className="w-5 h-5 text-purple-500" />
              </span>
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>제조현장 인원관리 및 인사카드 목록표</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono font-bold border border-purple-300 dark:border-purple-800">
                    총 {workerMgmtStats.total}명 등록
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  작업자별 제조경력, 주공정, 숙련등급(1~5성), 다기능공 여부를 등록하고 인사카드를 발급·관리합니다.
                </p>
              </div>
            </div>

            {/* Quick Add Worker Button */}
            <button
              type="button"
              onClick={() => setShowAddWorkerDrawer(!showAddWorkerDrawer)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md shadow-purple-900/30 transition-all cursor-pointer active:scale-95 shrink-0 self-start lg:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>{showAddWorkerDrawer ? "등록 폼 닫기" : "➕ 신규 근로자 등록"}</span>
            </button>
          </div>

          {/* 2. Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pb-1">
                <span className="text-[11px] font-bold">전체 등록 근로자</span>
                <Users className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="font-mono font-black text-lg sm:text-xl text-slate-900 dark:text-white">
                {workerMgmtStats.total}<span className="text-xs font-normal text-slate-400 ml-0.5">명</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pb-1">
                <span className="text-[11px] font-bold">숙련/마스터 (Lv.4~5)</span>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </div>
              <div className="font-mono font-black text-lg sm:text-xl text-amber-500 dark:text-amber-400">
                {workerMgmtStats.masterCount}<span className="text-xs font-normal text-slate-400 ml-0.5">명</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pb-1">
                <span className="text-[11px] font-bold">다기능공 (Multi-Skill)</span>
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="font-mono font-black text-lg sm:text-xl text-cyan-500 dark:text-cyan-400">
                {workerMgmtStats.multiSkillCount}<span className="text-xs font-normal text-slate-400 ml-0.5">명</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pb-1">
                <span className="text-[11px] font-bold">인사카드 완비율</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="font-mono font-black text-lg sm:text-xl text-emerald-500 dark:text-emerald-400">
                100<span className="text-xs font-normal text-slate-400 ml-0.5">%</span>
              </div>
            </div>
          </div>

          {/* 3. Expandable Quick Add Form Drawer */}
          {showAddWorkerDrawer && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-950/20 border-2 border-purple-500/40 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-purple-400" />
                  <span>신규 근로자 간편 추가 (등록 후 즉시 인사카드 편집 가능)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddWorkerDrawer(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickAddCompanyWorker} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-2">
                  <select
                    value={selectedCompanyManageWorkers || "오륙"}
                    onChange={(e) => setSelectedCompanyManageWorkers(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  >
                    {COMPANIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    required
                    placeholder="성명 *"
                    value={quickNewWorkerName}
                    onChange={(e) => setQuickNewWorkerName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold placeholder:text-slate-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <select
                    value={quickNewWorkerDept}
                    onChange={(e) => setQuickNewWorkerDept(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  >
                    {DEPARTMENTS_LIST.map((d) => (
                      <option key={d} value={d} className="bg-slate-900 text-white font-bold">{d}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <select
                    value={quickNewWorkerLine || "압출"}
                    onChange={(e) => setQuickNewWorkerLine(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  >
                    {STANDARD_PROCESS_LIST.map((proc) => (
                      <option key={proc} value={proc}>{proc}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <select
                    value={quickNewWorkerPos}
                    onChange={(e) => setQuickNewWorkerPos(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  >
                    {POSITIONS_LIST.map((pos) => (
                      <option key={pos} value={pos} className="bg-slate-900 text-white font-bold">{pos}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <button
                    type="submit"
                    className="w-full py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm"
                  >
                    추가
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. Filter Controls Bar */}
          <div className="p-2 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            {/* Left: Company Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-purple-500" />
                <span>업체:</span>
              </span>

              <button
                type="button"
                onClick={() => setWorkerMgmtCompanyFilter("전체")}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  workerMgmtCompanyFilter === "전체"
                    ? "bg-purple-600 text-white font-black shadow-md ring-2 ring-purple-400"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                전체 ({workerMgmtList.length}명)
              </button>

              {/* 삼랑진 그룹 */}
              <div className="flex items-center gap-1 p-0.5 bg-white dark:bg-slate-900 border border-amber-600/50 rounded-xl">
                <button
                  type="button"
                  onClick={() => setWorkerMgmtCompanyFilter("삼랑진공장")}
                  className={`text-[11px] font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5 transition-all cursor-pointer ${
                    workerMgmtCompanyFilter === "삼랑진공장"
                      ? "bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-300"
                      : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                  }`}
                >
                  <Factory className="w-3 h-3" />
                  <span>삼랑진공장</span>
                </button>
                {["오륙", "유성"].map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setWorkerMgmtCompanyFilter(comp)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      workerMgmtCompanyFilter === comp
                        ? "bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-300"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>

              {/* 한림 그룹 */}
              <div className="flex items-center gap-1 p-0.5 bg-white dark:bg-slate-900 border border-emerald-600/50 rounded-xl">
                <button
                  type="button"
                  onClick={() => setWorkerMgmtCompanyFilter("한림공장")}
                  className={`text-[11px] font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5 transition-all cursor-pointer ${
                    workerMgmtCompanyFilter === "한림공장"
                      ? "bg-emerald-500 text-slate-950 shadow-xs ring-1 ring-emerald-300"
                      : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                  }`}
                >
                  <Factory className="w-3 h-3" />
                  <span>한림공장</span>
                </button>
                {["조영", "한울", "부림텍"].map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setWorkerMgmtCompanyFilter(comp)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      workerMgmtCompanyFilter === comp
                        ? "bg-emerald-500 text-slate-950 shadow-xs ring-1 ring-emerald-300"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Skill Filter & Multi-skill Toggle & Search Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 숙련등급 필터 */}
              <select
                value={workerMgmtSkillFilter}
                onChange={(e) => setWorkerMgmtSkillFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 cursor-pointer"
              >
                <option value="ALL">⭐ 전체 숙련등급</option>
                <option value="5">★★★★★ Lv.5 마스터</option>
                <option value="4">★★★★☆ Lv.4 숙련</option>
                <option value="3">★★★☆☆ Lv.3 능숙</option>
                <option value="2">★★☆☆☆ Lv.2 보통</option>
                <option value="1">★☆☆☆☆ Lv.1 기초</option>
              </select>

              {/* 다기능공 토글 필터 */}
              <button
                type="button"
                onClick={() => setWorkerMgmtMultiSkillOnly(!workerMgmtMultiSkillOnly)}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 border ${
                  workerMgmtMultiSkillOnly
                    ? "bg-cyan-600 text-white border-cyan-400 shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-cyan-500"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>다기능공만</span>
              </button>

              {/* Search input */}
              <div className="relative w-44 sm:w-52">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="성명/사번/부서/공정..."
                  value={workerMgmtSearch}
                  onChange={(e) => setWorkerMgmtSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold placeholder:text-slate-400 focus:border-purple-400"
                />
              </div>
            </div>
          </div>

          {/* 5. Main Worker List Table with Personnel Card Actions */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-slate-950">
            {workerMgmtList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold text-xs space-y-1">
                <p>검색 및 필터 조건과 일치하는 근로자가 없습니다.</p>
                <button
                  type="button"
                  onClick={() => {
                    setWorkerMgmtCompanyFilter("전체");
                    setWorkerMgmtSkillFilter("ALL");
                    setWorkerMgmtMultiSkillOnly(false);
                    setWorkerMgmtSearch("");
                  }}
                  className="text-purple-400 hover:underline text-xs font-bold"
                >
                  필터 초기화
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-900 text-white z-20 font-black text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-2 text-center w-10 font-mono text-slate-400">No</th>
                      <th className="py-2.5 px-2 w-20">소속</th>
                      <th className="hidden sm:table-cell py-2.5 px-2 w-24">부서</th>
                      <th className="py-2.5 px-2 w-16 text-center">직위</th>
                      <th className="py-2.5 px-2.5 w-32">성명 (사번)</th>
                      <th className="hidden md:table-cell py-2.5 px-2 w-32">입사일 / 근속</th>
                      <th className="py-2.5 px-2 w-28">주공정(년차)</th>
                      <th className="py-2.5 px-2 w-36 text-center">숙련등급 (별점)</th>
                      <th className="py-2.5 px-2 w-32 text-center">다기능공</th>
                      <th className="py-2.5 px-2 w-28 text-center bg-purple-950/80 text-purple-200">인사카드</th>
                      <th className="py-2.5 px-2 w-16 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900/40 text-xs">
                    {workerMgmtList.map((worker, rowIdx) => {
                      const card = worker.card || getWorkerPersonnelCard(worker, rowIdx + 1);
                      const companyTheme = COMPANY_THEMES[cleanCompanyName(worker.company)] || COMPANY_THEMES["오륙"];
                      const skillMeta = getSkillMeta(card.skillLevel);

                      return (
                        <tr
                          key={`${worker.company}_${worker.name}_${worker.originalMatrixIndex}_${rowIdx}`}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                        >
                          {/* No */}
                          <td className="py-2 px-2 text-center font-mono text-slate-400 text-[11px]">
                            {worker.companyNo || rowIdx + 1}
                          </td>

                          {/* 소속 업체 */}
                          <td className="py-2 px-2">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10.5px] font-black border ${companyTheme.badge} whitespace-nowrap`}>
                              {cleanCompanyName(worker.company)}
                            </span>
                          </td>

                          {/* 부서 (라인 삭제) */}
                          <td className="hidden sm:table-cell py-2 px-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {worker.dept}
                            </span>
                          </td>

                          {/* 직위 */}
                          <td className="py-2 px-2 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {worker.position || "작업원"}
                            </span>
                          </td>

                          {/* 성명 & 사번 & 프로필 사진 */}
                          <td className="py-2 px-2.5">
                            <div className="flex items-center gap-2">
                              {card.photoUrl ? (
                                <img
                                  src={card.photoUrl}
                                  alt={worker.name}
                                  className="w-7 h-7 rounded-lg object-cover border border-purple-400 shrink-0 shadow-2xs"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                                  <User className="w-3.5 h-3.5 text-purple-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1">
                                  <span className="truncate">{worker.name}</span>
                                  {card.isMultiSkill && (
                                    <Zap className="w-3 h-3 text-cyan-400 shrink-0" title="다기능공" />
                                  )}
                                  {card.nationality && card.nationality !== "대한민국" && (
                                    <span
                                      className="px-1 py-0.2 rounded text-[9.5px] font-bold bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-slate-700 shrink-0"
                                      title={`국적: ${card.nationality === "기타" ? (card.nationalityOther || "기타") : card.nationality}`}
                                    >
                                      {getNationalityMeta(card.nationality).flag} {card.nationality === "기타" ? (card.nationalityOther || "기타") : card.nationality}
                                    </span>
                                  )}
                                </div>
                                <div className="font-mono text-[10px] text-slate-400">
                                  {card.empNo || "250101"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 입사일 / 근속기간 */}
                          <td className="hidden md:table-cell py-2 px-2">
                            <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {card.joinDate || "2022-03-15"}
                            </div>
                            <div className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                              {card.tenure || "2년 7개월"}
                            </div>
                          </td>

                          {/* 주공정 (년차 / 검사원 등급) */}
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1">
                              <span className="font-black text-amber-600 dark:text-amber-300 text-xs truncate">
                                {card.mainProcess || "압출"}
                              </span>
                              {card.mainProcess === "검사" && card.inspectorGrade && (() => {
                                const meta = getInspectorGradeMeta(card.inspectorGrade);
                                return (
                                  <span className={`px-1 py-0.2 rounded text-[9.5px] font-black border ${meta.badgeClass}`}>
                                    {meta.shortGrade || card.inspectorGrade.split(" ")[0]}
                                  </span>
                                );
                              })()}
                            </div>
                            <span className="text-[10.5px] text-slate-400 font-bold block">
                              {card.processYear || "3년차"}
                            </span>
                          </td>

                          {/* 숙련등급 (1~5 별점) */}
                          <td className="py-2 px-2 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${
                                    s <= card.skillLevel
                                      ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.6)]"
                                      : "text-slate-300 dark:text-slate-700"
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="pt-0.5">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-black border ${skillMeta.badgeClass}`}>
                                {skillMeta.shortGrade}
                              </span>
                            </div>
                          </td>

                          {/* 다기능공 여부 */}
                          <td className="py-2 px-2 text-center">
                            {card.isMultiSkill ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-2xs">
                                  <Zap className="w-2.5 h-2.5 text-cyan-400" />
                                  <span>다기능공</span>
                                </span>
                                {(card.subProcesses || []).length > 0 && (
                                  <div className="text-[9.5px] text-cyan-400/90 font-bold truncate max-w-[120px] mx-auto">
                                    {card.subProcesses.join(", ")}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                                단일공정
                              </span>
                            )}
                          </td>

                          {/* 인사카드 [🪪 카드작성/보기] 버튼 */}
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenPersonnelCard(worker, worker.originalMatrixIndex)}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-md shadow-purple-900/30 active:scale-95 transition-all"
                              title="제조현장 인사카드 작성 및 조회"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>🪪 인사카드</span>
                            </button>
                          </td>

                          {/* 삭제 관리 */}
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleQuickDeleteWorker(worker.originalMatrixIndex, worker.name, worker.company, worker.dept, worker.line)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer active:scale-95"
                              title="근로자 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📑 TAB 3: 근태/특근보고서 관리 (WEEKDAY ATTENDANCE, WEEKEND OVERTIME & PLANT SYNTHESIS) */}
      {/* ========================================================================= */}
      {activeTab === "legacy_reports" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          {(() => {
            const synthReports = generateSynthesizedPlantReports(legacyReports);
            const weekdayReports = (legacyReports || []).filter((r) => !isWeekendByDate(r.workDate || r.title));
            const baseList = [...weekdayReports, ...synthReports];

            const filtered = baseList.filter((r) => {
              if (reportListFilter !== "전체") {
                const matchPlant = r.plant === reportListFilter;
                let matchComp = false;
                if (r.isSynthesized) {
                  matchComp = Array.isArray(r.companies) && r.companies.some((c) => 
                    c === reportListFilter || 
                    c.includes(reportListFilter.replace(/\(주\)/g, "").trim()) ||
                    reportListFilter.includes(c.replace(/\(주\)/g, "").trim())
                  );
                } else {
                  matchComp =
                    r.company === reportListFilter ||
                    (Array.isArray(r.companies) && r.companies.includes(reportListFilter)) ||
                    (typeof r.company === "string" && r.company.includes(reportListFilter.replace(/\(주\)/g, "").trim()));
                }
                if (!matchPlant && !matchComp) return false;
              }
              if (reportListSearch.trim()) {
                const q = reportListSearch.toLowerCase().trim();
                const matchText = [
                  r.title,
                  r.workDate,
                  r.workDateFormatted,
                  r.author,
                  r.plant,
                  r.company,
                  ...(Array.isArray(r.companies) ? r.companies : []),
                  ...(Array.isArray(r.reasons) ? r.reasons.map((rs) => (typeof rs === "string" ? rs : rs.text || "")) : [])
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase();
                if (!matchText.includes(q)) return false;
              }
              return true;
            });

            const sortedFiltered = [...filtered].sort((a, b) => {
              const dateA = getReportDateSortKey(a);
              const dateB = getReportDateSortKey(b);
              if (dateSortOrder === "ASC") {
                if (dateA !== dateB) return dateA.localeCompare(dateB);
              } else {
                if (dateB !== dateA) return dateB.localeCompare(dateA);
              }

              // Same date secondary sort: Samrangjin first, then Hallim
              const plantOrder = { "삼랑진공장": 1, "한림공장": 2 };
              const plantA = plantOrder[a.plant] || 3;
              const plantB = plantOrder[b.plant] || 3;
              if (plantA !== plantB) return plantA - plantB;

              // Synthesized reports first, then individual reports
              if (a.isSynthesized && !b.isSynthesized) return -1;
              if (!a.isSynthesized && b.isSynthesized) return 1;

              return (a.company || "").localeCompare(b.company || "");
            });

            // 날짜별 그룹화 (같은 날짜면 좌측에 날짜 1개만 사용)
            const dateGroups = [];
            const dateGroupMap = new Map();

            sortedFiltered.forEach((report) => {
              const dateKey = getReportDateSortKey(report);
              if (!dateGroupMap.has(dateKey)) {
                const groupObj = {
                  dateKey,
                  workDate: report.workDate || report.workDateFormatted || report.title,
                  reports: []
                };
                dateGroupMap.set(dateKey, groupObj);
                dateGroups.push(groupObj);
              }
              dateGroupMap.get(dateKey).reports.push(report);
            });

            return (
              <div className="space-y-3">
                {/* 🧭 소속 공장/협력사 필터 & 날짜정렬 & 검색창 (단일 깔끔 제어바) */}
                <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                  {/* Left: 소속 필터 버튼군 (공장/회사 체계 분리) */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 mr-0.5 flex items-center gap-1 shrink-0">
                      <Filter className="w-3.5 h-3.5 text-cyan-400" />
                      <span>소속:</span>
                    </span>

                    {/* 전체 */}
                    <button
                      type="button"
                      onClick={() => setReportListFilter("전체")}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        reportListFilter === "전체"
                          ? "bg-purple-600 text-white font-black shadow-md ring-2 ring-purple-400"
                          : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                      }`}
                    >
                      전체 ({filtered.length}건)
                    </button>

                    {/* 삼랑진공장 그룹 */}
                    <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-amber-700/60 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setReportListFilter("삼랑진공장")}
                        className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          reportListFilter === "삼랑진공장"
                            ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                            : "text-amber-300 hover:bg-amber-950"
                        }`}
                      >
                        삼랑진공장
                      </button>
                      {["오륙", "유성"].map((comp) => (
                        <button
                          key={comp}
                          type="button"
                          onClick={() => setReportListFilter(comp)}
                          className={`px-2 py-0.5 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
                            reportListFilter === comp
                              ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                              : "text-slate-300 hover:text-white hover:bg-slate-800"
                          }`}
                        >
                          {comp}
                        </button>
                      ))}
                    </div>

                    {/* 한림공장 그룹 */}
                    <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-emerald-700/60 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setReportListFilter("한림공장")}
                        className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          reportListFilter === "한림공장"
                            ? "bg-emerald-500 text-slate-950 font-black shadow-xs"
                            : "text-emerald-300 hover:bg-emerald-950"
                        }`}
                      >
                        한림공장
                      </button>
                      {["조영", "한울", "부림텍"].map((comp) => (
                        <button
                          key={comp}
                          type="button"
                          onClick={() => setReportListFilter(comp)}
                          className={`px-2 py-0.5 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
                            reportListFilter === comp
                              ? "bg-emerald-400 text-slate-950 font-black shadow-xs"
                              : "text-slate-300 hover:text-white hover:bg-slate-800"
                          }`}
                        >
                          {comp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right: 날짜 정렬 버튼 + 검색창 */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* 날짜 정렬 버튼 */}
                    <button
                      type="button"
                      onClick={() => setDateSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"))}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 shadow-xs"
                      title="날짜순서 정렬 전환"
                    >
                      <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{dateSortOrder === "DESC" ? "📅 가까운 날순 (최신순) ▼" : "📅 과거순 (1일→30일) ▲"}</span>
                    </button>

                    {/* 검색창 */}
                    <div className="relative w-full sm:w-52 shrink-0">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="보고서 검색 (일자/업체)..."
                        value={reportListSearch}
                        onChange={(e) => setReportListSearch(e.target.value)}
                        className="w-full pl-7 pr-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium placeholder:text-slate-500 focus:border-purple-400 outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 📋 Registered & Synthesized Reports List Cards (Grouped by Date) */}
                {sortedFiltered.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-4">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                    <div className="space-y-1">
                      <h4 className="font-black text-base text-white">조건에 해당하는 근태/특근 보고서가 없습니다</h4>
                      <p className="text-xs text-slate-400">
                        {reportListFilter !== "전체" || reportListSearch
                          ? "선택된 소속 또는 검색 조건에 일치하는 보고서가 없습니다. 필터를 변경해보세요."
                          : "'📝 근태/잔업/특근 등록' 탭에서 인원 근태를 작성한 후 보고서를 등록해보세요."}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("daily_input")}
                      className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>근태/잔업/특근 등록하러 가기</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dateGroups.map((group, gIdx) => {
                      const sampleDateStr = group.workDate;
                      const formattedDate = formatShortMonthDay(sampleDateStr);
                      const isGroupWeekend = isWeekendByDate(sampleDateStr);

                      return (
                        <div
                          key={group.dateKey || gIdx}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 shadow-xs"
                        >
                          {/* 📅 Left: Ultra-compact Minimized Date Pill Badge (공간 극대화 초소형 뱃지) */}
                          <div className="shrink-0 flex items-center justify-start sm:justify-center">
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-mono font-black border tracking-tight flex items-center gap-1.5 shrink-0 ${
                                isGroupWeekend
                                  ? "bg-rose-950/80 text-rose-300 border-rose-700/80 shadow-2xs"
                                  : "bg-emerald-950/80 text-emerald-300 border-emerald-700/80 shadow-2xs"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isGroupWeekend ? "bg-rose-400" : "bg-emerald-400"}`} />
                              <span>{formattedDate}</span>
                            </span>
                          </div>

                          {/* 📋 Right: Simple List of Reports */}
                          <div className="flex-1 min-w-0 space-y-1">
                            {group.reports.map((report, rIdx) => {
                              const isSynthesized = !!report.isSynthesized;
                              let plantName = report.plant;
                              if (!plantName || plantName.includes("삼랑진/한림") || plantName.includes("삼랑진한림") || plantName.includes("전체")) {
                                plantName = getPlantForCompany(report.company || "");
                              }
                              if (report.company?.includes("조영") || report.company?.includes("한울") || report.company?.includes("부림")) {
                                plantName = "한림공장";
                              } else if (report.company?.includes("오륙") || report.company?.includes("유성")) {
                                plantName = "삼랑진공장";
                              }
                              let companyName = report.company || "";
                              if (!companyName || companyName === "전체") {
                                if (Array.isArray(report.companies) && report.companies.length === 1) {
                                  companyName = report.companies[0];
                                } else if (Array.isArray(report.companies) && report.companies.length > 1) {
                                  companyName = report.companies.join(", ");
                                } else if (plantName === "한림공장") {
                                  companyName = "(주)조영산업";
                                } else {
                                  companyName = "(주)오륙";
                                }
                              }

                              const isWeekend = isWeekendByDate(report.workDate || report.title);
                              const reportBadgeText = isSynthesized
                                ? (isWeekend ? "특근보고서 (취합)" : "근태보고서 (취합)")
                                : (isWeekend ? "특근보고서" : "근태보고서");

                              const cost = report.cost || (report.totalHours ? report.totalHours * 15000 : 0);
                              const workersCount = report.totalWorkers || (report.items ? report.items.length : 0);

                              return (
                                <div
                                  key={report.id || rIdx}
                                  onClick={() => handleOpenLegacyReport(report)}
                                  className={`px-2.5 py-1.5 rounded-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 group cursor-pointer border ${
                                    isSynthesized
                                      ? "border-indigo-600/60 bg-indigo-950/30 hover:border-indigo-400 hover:bg-indigo-950/50 shadow-xs"
                                      : isWeekend
                                      ? "border-slate-800 bg-slate-900/60 hover:border-rose-500/60 hover:bg-slate-900"
                                      : "border-slate-800 bg-slate-900/60 hover:border-emerald-500/60 hover:bg-slate-900"
                                  }`}
                                >
                                  {/* Left: 보고서 뱃지 + 공장 뱃지 + 회사 뱃지 */}
                                  <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap min-w-0">
                                    {/* 1. 보고서 뱃지 */}
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[11px] font-black shrink-0 border ${
                                        isSynthesized
                                          ? "bg-indigo-950 text-indigo-300 border-indigo-500/80 shadow-xs"
                                          : isWeekend
                                          ? "bg-rose-950 text-rose-300 border-rose-600/80"
                                          : "bg-emerald-950 text-emerald-300 border-emerald-600/80"
                                      }`}
                                    >
                                      {reportBadgeText}
                                    </span>

                                    {/* 2. 공장 뱃지 (삼랑진공장, 한림공장) */}
                                    {renderPlantBadge(plantName)}

                                    {/* 3. 회사 뱃지 (실제 내용이 있는 업체만 렌더링) */}
                                    {isSynthesized ? (
                                      Array.isArray(report.companies) && report.companies.length > 0 ? (
                                        <div className="flex items-center gap-1 flex-wrap shrink-0">
                                          {report.companies.map((c) => renderCompanyBadge(c))}
                                        </div>
                                      ) : report.company ? (
                                        renderCompanyBadge(report.company)
                                      ) : null
                                    ) : (
                                      renderCompanyBadge(companyName)
                                    )}
                                  </div>

                                  {/* Right: 금액 + 초소형 미니멀 수정/삭제 뱃지 */}
                                  <div
                                    className="flex items-center gap-2 shrink-0 justify-between sm:justify-end"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* 금액 및 인원 */}
                                    <span className="text-xs font-mono font-black text-white shrink-0 tracking-tight">
                                      ₩{cost.toLocaleString()} <span className="text-[10.5px] text-slate-400 font-normal">({workersCount}명)</span>
                                    </span>

                                    {/* 초소형 미니멀 액션 뱃지 버튼 (수정 / 삭제) */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleEditReport(report)}
                                        className="px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500 font-bold text-[10.5px] flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                                        title="해당 일자 및 업체 근태/특근 수정 화면으로 이동"
                                      >
                                        <Edit3 className="w-2.5 h-2.5 text-cyan-400" />
                                        <span>수정</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => handleDeleteReport(report, e)}
                                        className="px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-600 font-bold text-[10.5px] flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                                        title="보고서 삭제"
                                      >
                                        <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                                        <span>삭제</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}      {/* ========================================================================= */}
      {/* 📑 MODAL: 등록 클릭 시 뜨는 특근/근태 보고서 팝업창 (내용 작성 및 검토) */}
      {/* ========================================================================= */}
      {isReportModalOpen && (
        <div
          onClick={() => setIsReportModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-slate-900 text-white rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] cursor-default ${
            isWeekendByDate(selectedDay)
              ? "border-2 border-rose-500 shadow-rose-950/40"
              : "border-2 border-cyan-400"
          }`}>
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className={`p-1.5 rounded-lg border ${
                  isWeekendByDate(selectedDay)
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                    : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                }`}>
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                    <span>{isWeekendByDate(selectedDay) ? "특근보고서" : "근태보고서"} 등록 및 결재</span>
                    <span className={`text-xs px-2 py-0.5 rounded-md border font-mono ${
                      isWeekendByDate(selectedDay)
                        ? "bg-rose-950 text-rose-300 border-rose-800"
                        : "bg-cyan-950 text-cyan-300 border-cyan-800"
                    }`}>
                      {currentYear}-{String(currentMonthNum).padStart(2, "0")}-{String(selectedDay).padStart(2, "0")}
                    </span>
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Report Document Format */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Top Approval Box & Meta Grid */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="space-y-2.5 flex-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block pb-1">보고서 제목</label>
                    <input
                      type="text"
                      value={reportModalTitle}
                      onChange={(e) => setReportModalTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-black text-xs sm:text-sm focus:border-cyan-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block pb-0.5">작성자:</span>
                      <input
                        type="text"
                        value={reportModalAuthor}
                        onChange={(e) => setReportModalAuthor(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block pb-0.5">대상 업체/공장:</span>
                      <span className="inline-block w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 font-bold">
                        {selectedCompanyFilter === "전체" ? "5개사 통합" : selectedCompanyFilter}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Approval Blocks (선택된 업체 관리자 결재선) */}
                <div className="shrink-0 space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10.5px] font-black text-cyan-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{selectedCompanyFilter === "전체" ? "5개사 통합" : selectedCompanyFilter} 결재선</span>
                    </span>
                    <span className="text-[9.5px] text-slate-400 font-bold">클릭하여 이름 수정 가능</span>
                  </div>
                  <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900 shadow-md">
                    <div className="grid grid-cols-4 divide-x divide-slate-700 text-center font-bold text-[11px]">
                      {reportApprovalSteps.map((st, idx) => (
                        <div key={idx} className="bg-slate-800 py-1 px-2.5 text-slate-300 font-black">
                          {st.role}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 divide-x divide-slate-700 text-center text-xs h-14 items-center bg-slate-900/90">
                      {reportApprovalSteps.map((st, idx) => (
                        <div key={idx} className="p-1 flex flex-col items-center justify-center space-y-0.5">
                          <input
                            type="text"
                            value={st.name}
                            onChange={(e) => {
                              const next = [...reportApprovalSteps];
                              next[idx] = { ...next[idx], name: e.target.value };
                              setReportApprovalSteps(next);
                            }}
                            className="w-full text-center bg-transparent border-b border-transparent hover:border-slate-600 focus:border-cyan-400 font-black text-white text-xs px-0.5 py-0.5 outline-hidden"
                            title={`${st.role} 성명 수정`}
                          />
                          <span className="text-[9.5px] text-slate-400 font-bold">
                            {st.title || st.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary KPIs */}
              {(() => {
                const attendedWorkers = filteredAttendanceWorkers.filter(w => {
                  const val = w.daily ? w.daily[selectedDay] : "";
                  const { isAttended, workHours } = calculateWorkerDailyHours(val);
                  return isAttended && workHours > 0;
                });
                const totalHours = filteredAttendanceWorkers.reduce((sum, w) => {
                  const val = w.daily ? w.daily[selectedDay] : "";
                  const { workHours } = calculateWorkerDailyHours(val);
                  return sum + (workHours || 0);
                }, 0);
                const otHours = filteredAttendanceWorkers.reduce((sum, w) => {
                  const val = w.daily ? w.daily[selectedDay] : "";
                  const { weekdayOt, weekendOt } = calculateWorkerDailyHours(val);
                  return sum + (weekdayOt + weekendOt || 0);
                }, 0);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10.5px] text-slate-400 font-bold block">출근/투입 인원</span>
                      <span className="font-mono font-black text-sm text-emerald-400">{attendedWorkers.length}명</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10.5px] text-slate-400 font-bold block">잔업/특근 인원</span>
                      <span className="font-mono font-black text-sm text-amber-400">+{otHours}H</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10.5px] text-slate-400 font-bold block">총 투입 공수</span>
                      <span className="font-mono font-black text-sm text-cyan-300">{totalHours} M/H</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10.5px] text-slate-400 font-bold block">예상 총 노무비</span>
                      <span className="font-mono font-black text-sm text-rose-400">₩{(totalHours * 15000).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Editable Reason / Content Notes Area */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block text-xs flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>특근 사유 및 작업 내용 (수정 및 작성 가능)</span>
                </label>
                <textarea
                  rows={3}
                  value={reportModalNotes}
                  onChange={(e) => setReportModalNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-medium text-xs focus:border-cyan-400"
                  placeholder="특근 사유 및 주요 작업 내용을 입력해주세요."
                />
              </div>

              {/* Workers Summary: 선택된 인원 + 근태현황만 축약 표시 (미입력 제외) */}
              {(() => {
                const enteredWorkers = filteredAttendanceWorkers.filter((w) => {
                  const val = w.daily ? String(w.daily[selectedDay] || "").trim() : "";
                  return val !== "" && val !== "미입력" && val !== "-";
                });

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-black text-slate-200 text-xs flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        <span>{currentMonthNum}월 {selectedDay}일 투입/등록 인원 ({enteredWorkers.length}명)</span>
                      </span>

                      {/* 근태별 인원 요약 뱃지 */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono font-bold">
                        {(() => {
                          const counts = { "정시": 0, "19시": 0, "21시": 0, "22시": 0, "야간": 0, "연차": 0, "결근": 0, "특근": 0 };
                          enteredWorkers.forEach((w) => {
                            const val = w.daily ? w.daily[selectedDay] : "";
                            if (val === "🟢" || val === "정시" || val === "17") counts["정시"]++;
                            else if (val === "19" || val === "19시") counts["19시"]++;
                            else if (val === "21" || val === "21시") counts["21시"]++;
                            else if (val === "22" || val === "22시") counts["22시"]++;
                            else if (val === "야간") counts["야간"]++;
                            else if (val === "연차") counts["연차"]++;
                            else if (val === "결근") counts["결근"]++;
                            else if (val === "특근" || val === "주말특근") counts["특근"]++;
                          });
                          return (
                            <>
                              {counts["정시"] > 0 && <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">🟢 정시 {counts["정시"]}명</span>}
                              {counts["19시"] > 0 && <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800">🟡 19시 {counts["19시"]}명</span>}
                              {counts["21시"] > 0 && <span className="px-2 py-0.5 rounded-md bg-orange-950 text-orange-300 border border-orange-800">🟠 21시 {counts["21시"]}명</span>}
                              {counts["22시"] > 0 && <span className="px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800">🔴 22시 {counts["22시"]}명</span>}
                              {counts["야간"] > 0 && <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800">🌌 야간 {counts["야간"]}명</span>}
                              {counts["특근"] > 0 && <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800">🌙 특근 {counts["특근"]}명</span>}
                              {counts["연차"] > 0 && <span className="px-2 py-0.5 rounded-md bg-sky-950 text-sky-300 border border-sky-800">🌴 연차 {counts["연차"]}명</span>}
                              {counts["결근"] > 0 && <span className="px-2 py-0.5 rounded-md bg-red-950 text-red-300 border border-red-800">❌ 결근 {counts["결근"]}명</span>}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* 작업자별 축약 카드 그리드 (3열 병렬) */}
                    <div className="border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-slate-950/60 p-2">
                      {enteredWorkers.length === 0 ? (
                        <div className="py-6 text-center text-slate-500 font-bold text-xs">
                          당일 선택/입력된 근태 데이터가 없습니다.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                          {enteredWorkers.map((w, idx) => {
                            const val = w.daily ? w.daily[selectedDay] : "";
                            const getBadge = (code) => {
                              const str = String(code || "").trim();
                              if (str === "🟢" || str === "정시" || str === "17") return { label: "🟢 정시", bg: "bg-emerald-950 text-emerald-300 border-emerald-700/80" };
                              if (str === "19" || str === "19시") return { label: "🟡 19시(+2H)", bg: "bg-amber-950 text-amber-300 border-amber-700/80" };
                              if (str === "21" || str === "21시") return { label: "🟠 21시(+4H)", bg: "bg-orange-950 text-orange-300 border-orange-700/80" };
                              if (str === "22" || str === "22시") return { label: "🔴 22시(+5H)", bg: "bg-rose-950 text-rose-300 border-rose-700/80" };
                              if (str === "야간") return { label: "🌌 야간", bg: "bg-indigo-950 text-indigo-300 border-indigo-700/80" };
                              if (str === "연차") return { label: "🌴 연차", bg: "bg-sky-950 text-sky-300 border-sky-700/80" };
                              if (str === "결근") return { label: "❌ 결근", bg: "bg-red-950 text-red-300 border-red-700/80" };
                              if (str === "특근" || str === "주말특근") return { label: "🌙 특근(8H)", bg: "bg-purple-950 text-purple-300 border-purple-700/80" };
                              if (str === "-" || str === "휴무") return { label: "- 휴무", bg: "bg-slate-800 text-slate-400 border-slate-700" };
                              return { label: str || "미입력", bg: "bg-slate-800 text-slate-300 border-slate-700" };
                            };
                            const badge = getBadge(val);

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-colors text-xs"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-mono text-[10.5px] text-slate-500 w-5 text-right shrink-0">{idx + 1}.</span>
                                  <span className="text-[11px] font-bold text-slate-400 shrink-0">{w.company}</span>
                                  <span className="text-[11px] text-slate-500 shrink-0">{w.dept}</span>
                                  <span className="font-black text-white text-xs truncate">{w.name}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 whitespace-nowrap ${badge.bg}`}>
                                  {badge.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer active:scale-95 transition-all"
              >
                취소
              </button>

              <button
                onClick={handleConfirmAndSaveReportModal}
                disabled={isSaving}
                className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "등록 중..." : "💾 최종 저장 및 보고서 등록"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⭐ MODAL: 업체별 오늘자 현황 팝업 (초간결 3열 부서/성명/오늘근태 NO SCROLLING) */}
      {popupCompanyData && (
        <div
          onClick={() => setSelectedCompanyPopup(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl max-w-5xl w-full border-2 border-cyan-400 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default"
          >
            {/* 1. Modal Header & Summary Pills Bar */}
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0 gap-2">
              <div className="flex items-center gap-3 flex-wrap min-w-0">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                    <span>{popupCompanyData.company}</span>
                    <span className="text-cyan-300 font-normal text-xs sm:text-sm">{currentMonthNum}월 {selectedDay}일 오늘자 근태 현황</span>
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono font-black flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    총원 {popupCompanyData.breakdown.total}명
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                    출근 {popupCompanyData.breakdown.attended}명
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800">
                    잔업 {popupCompanyData.breakdown.ot19 + popupCompanyData.breakdown.ot21 + popupCompanyData.breakdown.ot22 + popupCompanyData.breakdown.specialNight}명 (+{popupCompanyData.breakdown.otHours}H)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
                    공수 {popupCompanyData.breakdown.totalHours}H
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCompanyPopup(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Main Multi-Column Table (부서 | 성명 | 오늘근태) */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1 text-xs">
              {popupCompanyData.workers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-bold">
                  등록된 근로자가 없습니다.
                </div>
              ) : (
                (() => {
                  const workers = popupCompanyData.workers;
                  const count = workers.length;
                  const numCols = count > 30 ? 3 : count > 10 ? 2 : 1;
                  const perCol = Math.ceil(count / numCols);

                  const columns = [];
                  for (let i = 0; i < numCols; i++) {
                    columns.push(workers.slice(i * perCol, (i + 1) * perCol));
                  }

                  const renderBadge = (code) => {
                    const str = code ? String(code).trim() : "";
                    if (!str || str === "-") {
                      return <span className="px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-slate-800 text-slate-400">-</span>;
                    }
                    if (str === "🟢" || str === "정시" || str === "17") {
                      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-emerald-600 text-white shadow-2xs">🟢정시</span>;
                    }
                    if (str === "19" || str === "19시") {
                      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-amber-600 text-white shadow-2xs">🟡19시</span>;
                    }
                    if (str === "21" || str === "21시") {
                      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-orange-600 text-white shadow-2xs">🟠21시</span>;
                    }
                    if (str === "22" || str === "22시") {
                      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-rose-600 text-white shadow-2xs">🔴22시</span>;
                    }
                    if (str === "특근" || str === "주말특근") {
                      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-purple-600 text-white shadow-2xs">🌙특근</span>;
                    }
                    if (str === "연차") {
                      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-sky-600 text-white shadow-2xs">🌴연차</span>;
                    }
                    if (str === "반차") {
                      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-blue-600 text-white shadow-2xs">⛅반차</span>;
                    }
                    if (str === "결근") {
                      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-red-600 text-white shadow-2xs">❌결근</span>;
                    }
                    return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">{str}</span>;
                  };

                  return (
                    <div className={`grid gap-2.5 ${numCols === 3 ? "grid-cols-1 md:grid-cols-3" : numCols === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                      {columns.map((colWorkers, colIdx) => (
                        <div key={colIdx} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70 shadow-xs">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-950 text-slate-400 text-[11px] font-black border-b border-slate-800">
                              <tr>
                                <th className="py-1 px-1.5 text-center w-7 text-slate-500 font-mono">No</th>
                                <th className="hidden sm:table-cell py-1 px-1.5 w-14">부서</th>
                                <th className="py-1 px-1.5 w-16">성명</th>
                                <th className="py-1 px-1.5 text-center">오늘근태</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-xs">
                              {colWorkers.map((worker, rowIdx) => {
                                const globalNo = colIdx * perCol + rowIdx + 1;
                                const currentVal = worker.daily ? worker.daily[selectedDay] : "";
                                const cleanWorkerName = worker.name ? worker.name.split(" ")[0].replace(/\([^)]*\)/g, "").trim() : "";

                                return (
                                  <tr key={worker.originalMatrixIndex || globalNo} className="hover:bg-slate-800/60 transition-colors">
                                    <td className="py-1 px-1.5 text-center font-mono text-slate-500 text-[10.5px]">
                                      {globalNo}
                                    </td>
                                    <td className="hidden sm:table-cell py-1 px-1.5">
                                      <span className="font-bold text-slate-300 text-[11px] whitespace-nowrap">{worker.dept}</span>
                                    </td>
                                    <td className="py-1 px-1.5 font-black text-white text-xs whitespace-nowrap">
                                      {cleanWorkerName}
                                    </td>
                                    <td className="py-1 px-1.5 text-center whitespace-nowrap">
                                      {renderBadge(currentVal)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>

            {/* 3. Modal Footer (Compact) */}
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCompanyPopup(null)}
                className="px-4 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs cursor-pointer shadow-md active:scale-95 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⭐ MODAL: 업체별 근로자 추가/삭제 관리 모달 */}
      {selectedCompanyManageWorkers && (
        <div
          onClick={() => setSelectedCompanyManageWorkers(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl max-w-3xl w-full border-2 border-purple-500 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default"
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Users className="w-4 h-4" />
                </span>
                <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                  <span>{selectedCompanyManageWorkers} 근로자 추가/삭제 관리</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800 font-mono font-bold">
                    총원 {manageCompanyWorkers.length}명
                  </span>
                </h3>
              </div>

              <button
                onClick={() => setSelectedCompanyManageWorkers(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Form Section */}
            <div className="p-3 sm:p-4 bg-slate-950/80 border-b border-slate-800 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>신규 근로자 간편 등록</span>
                </span>
                <span className="text-[10.5px] text-slate-400">등록 즉시 전체 대장 및 근태표에 실시간 반영됩니다</span>
              </div>

              <form onSubmit={handleQuickAddCompanyWorker} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    required
                    placeholder="성명 *"
                    value={quickNewWorkerName}
                    onChange={(e) => setQuickNewWorkerName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold placeholder:text-slate-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <select
                    value={quickNewWorkerDept}
                    onChange={(e) => setQuickNewWorkerDept(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  >
                    {DEPARTMENTS_LIST.map((d) => (
                      <option key={d} value={d} className="bg-slate-900 text-white font-bold">{d}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={quickNewWorkerLine || "압출"}
                    onChange={(e) => setQuickNewWorkerLine(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  >
                    {STANDARD_PROCESS_LIST.map((proc) => (
                      <option key={proc} value={proc}>{proc}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <select
                    value={quickNewWorkerPos}
                    onChange={(e) => setQuickNewWorkerPos(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  >
                    {POSITIONS_LIST.map((pos) => (
                      <option key={pos} value={pos} className="bg-slate-900 text-white font-bold">{pos}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md shadow-purple-900/40 flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>추가</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Current Workers List Table */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1 text-xs space-y-2 max-h-[55vh]">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800 flex-wrap gap-2">
                <span className="font-black text-slate-300 text-xs flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>현재 등록 근로자 목록 ({manageCompanyWorkers.length}명)</span>
                </span>
                <div className="relative w-44">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="이름/부서 검색..."
                    value={manageWorkerSearch}
                    onChange={(e) => setManageWorkerSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-[11px] placeholder:text-slate-500"
                  />
                </div>
              </div>

              {manageCompanyWorkers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-bold">
                  등록된 근로자가 없습니다.
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 text-slate-400 text-[11px] font-black border-b border-slate-800">
                      <tr>
                        <th className="py-1.5 px-2.5 text-center w-10 text-slate-500 font-mono">No</th>
                        <th className="py-1.5 px-2.5 w-20">부서</th>
                        <th className="py-1.5 px-2.5 w-24">성명</th>
                        <th className="py-1.5 px-2.5">주공정</th>
                        <th className="py-1.5 px-2.5 text-center w-16">직위</th>
                        <th className="py-1.5 px-2.5 text-center w-16">삭제</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-xs">
                      {manageCompanyWorkers.map((worker, idx) => (
                        <tr key={`${cleanCompanyName(worker.company)}_${worker.name}_${worker.originalMatrixIndex}_${idx}`} className="hover:bg-slate-800/60 transition-colors">
                          <td className="py-1.5 px-2.5 text-center font-mono text-slate-500 text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-2.5">
                            <span className="font-bold text-purple-300 text-[11px]">{worker.dept}</span>
                          </td>
                          <td className="py-1.5 px-2.5 font-black text-white text-xs">
                            {worker.name}
                          </td>
                          <td className="py-1.5 px-2.5 text-slate-400 font-medium text-[11px]">
                            {worker.line || worker.dept}
                          </td>
                          <td className="py-1.5 px-2.5 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                              {worker.position || "작업원"}
                            </span>
                          </td>
                          <td className="py-1.5 px-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleQuickDeleteWorker(worker.originalMatrixIndex, worker.name, worker.company, worker.dept, worker.line)}
                              className="px-2 py-0.5 rounded-lg bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/80 font-bold text-[10.5px] transition-all cursor-pointer flex items-center gap-1 mx-auto active:scale-95"
                              title="근로자 삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>삭제</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCompanyManageWorkers(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs cursor-pointer shadow-md active:scale-95 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📑 MODAL: 근태/특근보고서 상세 확인 및 결재 모달 (등록 모달과 100% 동일한 정식 서식 + 공장별 취합 세부 내역 지원) */}
      {/* ========================================================================= */}
      {isLegacyModalOpen && selectedLegacyReport && (
        <div
          onClick={() => setIsLegacyModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          {(() => {
            const isSynthesized = !!selectedLegacyReport.isSynthesized;
            const isWk = isWeekendByDate(selectedLegacyReport.workDate || selectedLegacyReport.title);
            const rawTitle = selectedLegacyReport.title || "";
            const repType = isSynthesized
              ? (isWk ? "특근보고서 (취합)" : "근태보고서 (취합)")
              : (isWk ? "특근보고서" : "근태보고서");

            // ⭐ 실시간 전자결재 상태 및 결재선 연동
            const liveApproval = getLiveApprovalForReport(selectedLegacyReport, approvalDocs);

            let cleanTitle = rawTitle;
            if (!isSynthesized) {
              if (isWk) {
                cleanTitle = cleanTitle
                  .replace(/근태 및 특근실시 보고서|특근실시보고서|특근실시 보고서|근태보고서|근태 및 특근보고서/g, "특근보고서");
                if (!cleanTitle.includes("특근보고서")) cleanTitle += " 특근보고서";
              } else {
                cleanTitle = cleanTitle
                  .replace(/근태 및 특근실시 보고서|특근실시보고서|특근실시 보고서|특근보고서|근태 및 특근보고서/g, "근태보고서");
                if (!cleanTitle.includes("근태보고서")) cleanTitle += " 근태보고서";
              }
            }

            return (
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-slate-900 text-white rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] cursor-default ${
            isSynthesized
              ? "border-2 border-indigo-500 shadow-indigo-950/50"
              : isWk
              ? "border-2 border-rose-500 shadow-rose-950/40"
              : "border-2 border-cyan-400"
          }`}>
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className={`p-1.5 rounded-lg border ${
                  isSynthesized
                    ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                    : isWk
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                    : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                }`}>
                  {isSynthesized ? <Sparkles className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                    <span>{isSynthesized ? "공장별 통합 취합 보고서 상세 내역" : "근태 및 특근실시 보고서 상세 내역"}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                      {selectedLegacyReport.workDateFormatted || selectedLegacyReport.workDate}
                    </span>
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsLegacyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Top Approval Box & Meta Grid */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="space-y-2 flex-1">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block pb-0.5">보고서 제목</span>
                    <div className="font-black text-white text-sm sm:text-base">
                      {cleanTitle}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-400 font-bold block pb-0.5">작성자:</span>
                      <span className="font-bold text-white">{selectedLegacyReport.author || "양인나 선임"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block pb-0.5">대상 업체/공장:</span>
                      <span className="font-bold text-cyan-300">
                        {selectedLegacyReport.company || selectedLegacyReport.plant || "통합"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Approval Blocks (실제 전자결재함과 실시간 100% 동기화) */}
                <div className="shrink-0 space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10.5px] font-black text-purple-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                      <span>결재선</span>
                    </span>
                    <span className={`text-[10px] font-black ${
                      liveApproval.status === "APPROVED"
                        ? "text-emerald-400"
                        : liveApproval.status === "HOLD"
                        ? "text-amber-400 animate-pulse"
                        : liveApproval.status === "REJECTED"
                        ? "text-rose-400"
                        : "text-yellow-400 animate-pulse"
                    }`}>
                      {liveApproval.status === "APPROVED"
                        ? (!isWk ? "🟢 작성자 전결 승인 완료" : "🟢 결재 완료 (4/4)")
                        : liveApproval.status === "HOLD"
                        ? "⏸️ 결재 보류"
                        : liveApproval.status === "REJECTED"
                        ? "🔴 반려됨"
                        : `🟡 결재 진행중 (${liveApproval.steps.find(s => s.status === "PENDING")?.role || "책임"} 결재대기)`}
                    </span>
                  </div>
                  <div className="border-2 border-slate-700 rounded-xl overflow-hidden bg-white text-slate-900 shadow-md">
                    <div className="grid grid-cols-4 divide-x divide-slate-300 text-center font-bold text-[11px] bg-slate-100 text-slate-800">
                      {liveApproval.steps.map((st, sIdx) => (
                        <div key={sIdx} className="py-1 px-2 font-black">
                          {st.role}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 divide-x divide-slate-300 text-center text-xs h-15 items-center bg-white">
                      {liveApproval.steps.map((st, sIdx) => {
                        const isApprovedStep = st.status === "APPROVED";
                        const isPendingStep = st.status === "PENDING";
                        const isHoldStep = st.status === "HOLD";
                        const isRejectedStep = st.status === "REJECTED";

                        return (
                          <div key={sIdx} className="p-1 flex flex-col items-center justify-center space-y-0.5 relative h-full bg-white">
                            {isApprovedStep ? (
                              st.role === "대표" || st.name === "권태형" ? (
                                <div className="w-15 h-11 flex items-center justify-center p-0.5 relative select-none animate-scaleUp">
                                  <img
                                    src={KWON_SIGNATURE_BLACK}
                                    alt="권태형 대표이사 친필 서명"
                                    className="w-full h-full object-contain filter drop-shadow-xs"
                                  />
                                </div>
                              ) : (
                                <div className={`w-10 h-10 rounded-full border-2 ${sIdx === 0 ? "border-blue-600 text-blue-600" : "border-rose-600 text-rose-600"} flex flex-col items-center justify-center font-black leading-none transform rotate-[-5deg] select-none bg-white animate-scaleUp`}>
                                  <span className="text-[7px] font-bold">{cleanCompanyName(selectedLegacyReport.company || "오륙")}</span>
                                  <span className="text-[10px] font-black">{st.name?.slice(0, 3)}</span>
                                  <span className="text-[7px]">{sIdx === 0 ? "기안" : (!isWk ? "전결" : "승인")}</span>
                                </div>
                              )
                            ) : isHoldStep ? (
                              <div className="w-10 h-10 rounded-full border-2 border-amber-600 text-amber-600 flex flex-col items-center justify-center font-black text-[9px] transform rotate-[-4deg] bg-white">
                                <span>보류</span>
                                <span className="text-[7px]">{st.name?.slice(0, 3)}</span>
                              </div>
                            ) : isRejectedStep ? (
                              <div className="w-10 h-10 rounded-full border-2 border-slate-700 text-slate-700 flex flex-col items-center justify-center font-black text-[9px] transform rotate-[-6deg] bg-white">
                                <span>반려</span>
                                <span className="text-[7px]">{st.name?.slice(0, 3)}</span>
                              </div>
                            ) : isPendingStep ? (
                              <span className="text-[10.5px] font-black text-rose-600 animate-pulse">
                                결재대기
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold">
                                - (대기)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* 날짜 행 */}
                    <div className="grid grid-cols-4 divide-x divide-slate-300 text-center text-[9.5px] bg-slate-50 text-slate-600 font-mono py-0.5 border-t border-slate-200">
                      {liveApproval.steps.map((st, sIdx) => (
                        <div key={sIdx} className="truncate px-0.5">
                          {st.date ? st.date.split(" ")[0].slice(5) : "-"}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary KPIs */}
              {(() => {
                const workersCount = selectedLegacyReport.totalWorkers || (selectedLegacyReport.items ? selectedLegacyReport.items.length : 0);
                const totalHours = selectedLegacyReport.totalHours || (workersCount * 8);
                const cost = selectedLegacyReport.cost || (totalHours * 15000);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10.5px] text-slate-400 font-bold block">총 출근/투입 인원</span>
                      <span className="font-mono font-black text-sm text-emerald-400">{workersCount}명</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10.5px] text-slate-400 font-bold block">총 투입 공수</span>
                      <span className="font-mono font-black text-sm text-cyan-300">{totalHours} M/H</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10.5px] text-slate-400 font-bold block">소속 공장/업체</span>
                      <span className="font-mono font-black text-sm text-purple-400">{selectedLegacyReport.company || selectedLegacyReport.plant || "-"}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10.5px] text-slate-400 font-bold block">예상 총 노무비</span>
                      <span className="font-mono font-black text-rose-400">₩{cost.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              {/* ⭐ If Synthesized: Render Child Reports Breakdown by Company */}
              {isSynthesized && selectedLegacyReport.childReports && selectedLegacyReport.childReports.length > 0 && (
                <div className="space-y-2">
                  <span className="font-black text-slate-200 text-xs flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>소속 협력사별 개별 보고서 취합 내역 ({selectedLegacyReport.childReports.length}개사)</span>
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {selectedLegacyReport.childReports.map((cr, crIdx) => {
                      const crWorkers = cr.totalWorkers || (cr.items ? cr.items.length : 0);
                      const crHours = cr.totalHours || (crWorkers * 8);
                      const crCost = cr.cost || (crHours * 15000);
                      return (
                        <div key={crIdx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-indigo-300 text-xs flex items-center gap-1">
                              <Factory className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{cr.company}</span>
                            </span>
                            <span className="text-[11px] font-bold text-slate-400">
                              작성: {cr.author || "선임"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
                            <span className="text-emerald-300 font-bold">{crWorkers}명 출근</span>
                            <span className="text-cyan-300 font-bold">{crHours} M/H</span>
                            <span className="text-rose-300 font-black">₩{crCost.toLocaleString()}</span>
                          </div>
                          {cr.items && cr.items.length > 0 && (
                            <div className="text-[10.5px] text-slate-400 truncate">
                              작업자: {cr.items.map(it => it.workerName || it.names).filter(Boolean).join(", ")}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reason / Notes Area */}
              {selectedLegacyReport.reasons && selectedLegacyReport.reasons.length > 0 && (
                <div className="space-y-1 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-slate-300 block text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    <span>{isSynthesized ? "취합 사유 및 주요 작업 내용" : "특근 사유 및 주요 작업 내용"}</span>
                  </span>
                  <div className="space-y-1 text-slate-300 font-medium text-xs leading-relaxed whitespace-pre-wrap">
                    {selectedLegacyReport.reasons.map((rs, rIdx) => (
                      <div key={rIdx}>{rs}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Workers Summary: 선택된 인원 + 근태현황만 축약 표시 (미입력 제외) */}
              {(() => {
                const items = selectedLegacyReport.items || [];
                const validItems = items.filter((it) => {
                  const val = String(it.attendanceCode || it.category || "").trim();
                  return val !== "" && val !== "미입력" && val !== "-";
                });

                const displayItems = validItems.length > 0 ? validItems : items;

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-black text-slate-200 text-xs flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        <span>{isSynthesized ? "전체 투입 작업자 통합 명단" : "투입 작업자 명단"} ({displayItems.length}명)</span>
                      </span>
                    </div>

                    <div className="border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-slate-950/60 p-2">
                      {displayItems.length === 0 ? (
                        <div className="py-6 text-center text-slate-500 font-bold text-xs">
                          등록된 투입 인원 정보가 없습니다.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                          {displayItems.map((it, idx) => {
                            const getBadge = (code) => {
                              const str = String(code || "").trim();
                              if (str === "🟢" || str === "정시" || str === "17") return { label: "🟢 정시", bg: "bg-emerald-950 text-emerald-300 border-emerald-700/80" };
                              if (str === "19" || str === "19시") return { label: "🟡 19시(+2H)", bg: "bg-amber-950 text-amber-300 border-amber-700/80" };
                              if (str === "21" || str === "21시") return { label: "🟠 21시(+4H)", bg: "bg-orange-950 text-orange-300 border-orange-700/80" };
                              if (str === "22" || str === "22시") return { label: "🔴 22시(+5H)", bg: "bg-rose-950 text-rose-300 border-rose-700/80" };
                              if (str === "야간") return { label: "🌌 야간", bg: "bg-indigo-950 text-indigo-300 border-indigo-700/80" };
                              if (str === "연차") return { label: "🌴 연차", bg: "bg-sky-950 text-sky-300 border-sky-700/80" };
                              if (str === "결근") return { label: "❌ 결근", bg: "bg-red-950 text-red-300 border-red-700/80" };
                              if (str === "특근" || str === "주말특근") return { label: "🌙 특근(8H)", bg: "bg-purple-950 text-purple-300 border-purple-700/80" };
                              if (str === "-" || str === "휴무") return { label: "- 휴무", bg: "bg-slate-800 text-slate-400 border-slate-700" };
                              return { label: str || "특근", bg: "bg-purple-950 text-purple-300 border-purple-700" };
                            };

                            const badge = getBadge(it.attendanceCode || it.category || "특근");

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800/90 text-xs"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-mono text-[10.5px] text-slate-500 w-5 text-right shrink-0">{idx + 1}.</span>
                                  <span className="text-[11px] font-bold text-slate-400 shrink-0">{it.company || it.factory || ""}</span>
                                  <span className="text-[11px] text-slate-500 shrink-0">{it.dept || it.line || it.category || ""}</span>
                                  <span className="font-black text-white text-xs truncate">{it.workerName || it.names || "-"}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 whitespace-nowrap ${badge.bg}`}>
                                  {badge.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 gap-2">
              {!isSynthesized ? (
                <button
                  type="button"
                  onClick={() => handleDeleteReport(selectedLegacyReport.id)}
                  className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>보고서 삭제</span>
                </button>
              ) : (
                <div className="text-xs text-slate-500 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>소속 협력사 실시간 통합 취합 보고서</span>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {/* 1-Click Approval Action if User Has Authority */}
                {liveApproval.approvalDoc && (() => {
                  const perm = checkApprovalPermission(liveApproval.approvalDoc, currentProfile, isAdmin);
                  if (perm.canApprove) {
                    return (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm(`[${perm.stepRole} ${perm.approverName}] 전자결재 승인을 진행하시겠습니까?`)) return;
                          try {
                            await approveDocumentStep(liveApproval.approvalDoc.id, perm.stepIndex, perm.approverName, "승인");
                            triggerToast(`✅ [${perm.stepRole} ${perm.approverName}] 결재 승인이 완료되었습니다.`);
                          } catch (err) {
                            alert("결재 승인 오류: " + err.message);
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs cursor-pointer shadow-md shadow-emerald-900/40 active:scale-95 transition-all flex items-center gap-1.5 animate-pulse"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>⚡ {perm.approverName} ({perm.stepRole}) 즉시 승인</span>
                      </button>
                    );
                  }
                  return null;
                })()}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>인쇄 / 출력</span>
                </button>

                <button
                  onClick={() => setIsLegacyModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer active:scale-95 transition-all"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🪪 MODAL: 제조현장 인사카드 작성 및 관리 모달 */}
      {/* ========================================================================= */}
      {isPersonnelModalOpen && selectedPersonnelWorker && (
        <PersonnelCardModal
          isOpen={isPersonnelModalOpen}
          onClose={() => {
            setIsPersonnelModalOpen(false);
            setSelectedPersonnelWorker(null);
          }}
          worker={selectedPersonnelWorker}
          workerIndex={selectedPersonnelWorkerIndex}
          onSave={handleSavePersonnelCard}
        />
      )}

      {/* ========================================================================= */}
      {/* 🏭 MODAL: 결근 관리 및 대체인원 투입 (4M Man 작업자 변경점 대장) */}
      {/* ========================================================================= */}
      {isAbsence4MModalOpen && (
        <Absence4MModal
          isOpen={isAbsence4MModalOpen}
          onClose={() => setIsAbsence4MModalOpen(false)}
          initialCompany={absence4MCompany}
          selectedDay={selectedDay}
          currentYear={currentYear}
          currentMonth={currentMonthNum}
          attendanceMatrix={smartData.attendanceMatrix || []}
          onSaveSyncWithReports={(lines) => {
            if (lines && lines.length > 0) {
              const logText = lines.join("\n");
              setReportModalNotes((prev) => {
                if (prev && prev.includes(lines[0])) return prev;
                return prev ? `${prev}\n\n[4M Man 작업자 변경점 대장]\n${logText}` : `[4M Man 작업자 변경점 대장]\n${logText}`;
              });
            }
          }}
        />
      )}
    </div>
  );
};
