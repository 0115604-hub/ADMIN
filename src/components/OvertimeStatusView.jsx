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
  X,
  FileSpreadsheet,
  ArrowRight,
  Sun,
  Moon,
  Zap,
  CheckSquare,
  PauseCircle,
  Stamp
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";
import {
  COMPANIES,
  DEPARTMENTS,
  COMPANY_THEMES,
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
  getPlantForCompany
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

// ⭐ Precise Date & Weekend/Holiday Overtime Helpers (2026년 9월 한국 달력 및 특근 조건 기준)
export const isWeekendByDate = (dateStrOrDay) => {
  if (typeof dateStrOrDay === "number") {
    const d = dateStrOrDay;
    // 2026년 9월 주말(5,6,12,13,19,20,26,27) 및 추석연휴(24,25,26) 특근 조건
    if ([5, 6, 12, 13, 19, 20, 24, 25, 26, 27].includes(d)) return true;
    const dt = new Date(2026, 8, d); // Month 8 is September (0-indexed)
    const dayOfWeek = dt.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }
  if (!dateStrOrDay) return false;
  const p = String(dateStrOrDay).split("-");
  if (p.length === 3) {
    const month = parseInt(p[1], 10);
    const day = parseInt(p[2], 10);
    if (month === 9 && [5, 6, 12, 13, 19, 20, 24, 25, 26, 27].includes(day)) return true;
    const dt = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    if (!isNaN(dt.getTime())) {
      const dayOfWeek = dt.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    }
  }
  const match = String(dateStrOrDay).match(/\(([일월화수목금토])\)|([일월화수목금토])요일/);
  if (match) {
    const dayChar = match[1] || match[2];
    return dayChar === "토" || dayChar === "일";
  }
  if (String(dateStrOrDay).includes("특근") && !String(dateStrOrDay).includes("근태")) return true;
  return false;
};

export const getDayOfWeekKorean = (dateStrOrDay) => {
  const names = ["일", "월", "화", "수", "목", "금", "토"];
  if (typeof dateStrOrDay === "number") {
    const dt = new Date(2026, 8, dateStrOrDay);
    return names[dt.getDay()] || "화";
  }
  if (!dateStrOrDay) return "화";
  const p = String(dateStrOrDay).split("-");
  if (p.length === 3) {
    const dt = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    if (!isNaN(dt.getTime())) {
      return names[dt.getDay()] || "화";
    }
  }
  const match = String(dateStrOrDay).match(/\(([일월화수목금토])\)|([일월화수목금토])요일/);
  if (match) return match[1] || match[2] || "화";
  return "화";
};

export const getDayOfWeekFullKorean = (dateStrOrDay) => {
  const short = getDayOfWeekKorean(dateStrOrDay);
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
  const match2 = raw.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (match2) {
    const m = String(parseInt(match2[1], 10)).padStart(2, "0");
    const d = String(parseInt(match2[2], 10)).padStart(2, "0");
    return `2026-${m}-${d}`;
  }
  return "2026-09-01";
};

// ⭐ 보고서 제목 내 날짜/요일 및 보고서 유형(평일=근태보고서, 주말=특근보고서) 100% 자동 동기화 함수
export const formatShortMonthDay = (dateStrOrDay) => {
  let month = 9;
  let day = 8;
  let dayOfWeek = "화";
  if (typeof dateStrOrDay === "number") {
    day = dateStrOrDay;
    dayOfWeek = getDayOfWeekKorean(day);
  } else if (dateStrOrDay) {
    const match = String(dateStrOrDay).match(/(\d{4})?-?(\d{1,2})-(\d{1,2})/);
    if (match) {
      month = parseInt(match[2], 10);
      day = parseInt(match[3], 10);
      dayOfWeek = getDayOfWeekKorean(day);
    } else {
      const match2 = String(dateStrOrDay).match(/(\d{1,2})월\s*(\d{1,2})일/);
      if (match2) {
        month = parseInt(match2[1], 10);
        day = parseInt(match2[2], 10);
        dayOfWeek = getDayOfWeekKorean(day);
      }
    }
  }
  return `${month}월 ${day}일 (${dayOfWeek})`;
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
    const match2 = String(rawTitle).match(/(\d{1,2})월\s*(\d{1,2})일/);
    if (match2) {
      dayStr = `${parseInt(match2[1], 10)}월 ${parseInt(match2[2], 10)}일(${correctDayOfWeek})`;
    } else {
      dayStr = `9월 8일(${correctDayOfWeek})`;
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

  // 1. Try finding canonical plant-level synthesis approval doc
  let matchedDoc = (approvalDocs || []).find((d) => d.id === canonicalDocId);

  // 2. Try matching by type, plant, and workDate
  if (!matchedDoc && workDateStr) {
    matchedDoc = (approvalDocs || []).find(
      (d) =>
        d.type === "OVERTIME" &&
        (d.plant === plantName || d.company === report.company) &&
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
          d.type === "OVERTIME" &&
          (d.plant === plantName || (d.title && d.title.includes(plantName))) &&
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
    const dayLabel = getDayOfWeekKorean(workDate);
    const dayNumMatch = workDate.match(/-(\d{1,2})$/);
    const dayNum = dayNumMatch ? parseInt(dayNumMatch[1], 10) : 5;

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

      const drafterName = "양인나";
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
        title: `[삼랑진공장] 9월 ${dayNum}일(${dayLabel}) 특근보고서 (${companies.join(", ")})`,
        reportType: "특근보고서 (취합)",
        workDate,
        workDateFormatted: `2026-09-${String(dayNum).padStart(2, "0")} (${dayLabel})`,
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
          `■ 9월 ${dayNum}일(${dayLabel}) [삼랑진공장] 특근보고서 취합 (${companies.join(", ")})`,
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
        title: `[한림공장] 9월 ${dayNum}일(${dayLabel}) 특근보고서 (${companies.join(", ")})`,
        reportType: "특근보고서 (취합)",
        workDate,
        workDateFormatted: `2026-09-${String(dayNum).padStart(2, "0")} (${dayLabel})`,
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
          `■ 9월 ${dayNum}일(${dayLabel}) [한림공장] 특근보고서 취합 (${companies.join(", ")})`,
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
    pushModalHistory("manage_workers_modal");
    setSelectedCompanyManageWorkers(compName);
  };

  const handleOpenLegacyReport = (report) => {
    pushModalHistory("overtime_report_detail");
    setSelectedLegacyReport(report);
    setIsLegacyModalOpen(true);
  };

  // Smart Overtime Ledger State (5개사 통합 잔업 스마트 대장)
  const [smartData, setSmartData] = useState(() => getLocalSmartOvertimeData());
  const [activeTab, setActiveTab] = useState("daily_input"); // 'daily_input' default
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Daily views state (로그인 및 접속 시점의 실시간 당일 일자로 기본 선택)
  const [selectedDay, setSelectedDay] = useState(() => {
    try {
      const kst = getKSTDateString(new Date());
      const day = parseInt(kst.split("-")[2], 10);
      return !isNaN(day) && day >= 1 && day <= 30 ? day : new Date().getDate() || 11;
    } catch (e) {
      return new Date().getDate() || 11;
    }
  });

  // 로그인 사용자 변경 또는 재접속 시 당일 일자로 자동 동기화
  useEffect(() => {
    try {
      const kst = getKSTDateString(new Date());
      const day = parseInt(kst.split("-")[2], 10);
      if (!isNaN(day) && day >= 1 && day <= 30) {
        setSelectedDay(day);
      }
    } catch (e) {}
  }, [currentProfile?.name]);

  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("(주)오륙");
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
  const [reportModalAuthor, setReportModalAuthor] = useState("양인나 선임");
  const [reportModalAuthorTitle, setReportModalAuthorTitle] = useState("선임");
  const [reportModalNotes, setReportModalNotes] = useState("");
  const [reportApprovalSteps, setReportApprovalSteps] = useState([
    { role: "담당", name: "양인나", title: "선임", status: "APPROVED", date: "", comment: "기안" },
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
  const [quickNewWorkerDept, setQuickNewWorkerDept] = useState("가공동");
  const [quickNewWorkerLine, setQuickNewWorkerLine] = useState("");
  const [quickNewWorkerPos, setQuickNewWorkerPos] = useState("작업원");

  // Legacy overtime reports state (특근보고서 관리)
  const [legacyReports, setLegacyReports] = useState(() => getLocalOvertimeReports());
  const [approvalDocs, setApprovalDocs] = useState(() => getLocalApprovalDocs());
  const [selectedLegacyReport, setSelectedLegacyReport] = useState(null);
  const [isLegacyModalOpen, setIsLegacyModalOpen] = useState(false);
  const [selectedWeekendDay, setSelectedWeekendDay] = useState(12); // Default to upcoming weekend: 9월 12일 (토)

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
    const unsubSmart = subscribeSmartOvertimeData((newData) => {
      if (newData && newData.attendanceMatrix) {
        setSmartData(newData);
      }
    });

    const unsubLegacy = subscribeOvertimeReports((reports) => {
      setLegacyReports(reports);
      if (reports.length > 0 && !selectedLegacyReport) {
        setSelectedLegacyReport(reports[0]);
      }
    });

    const unsubApproval = subscribeApprovalDocs((docs) => {
      if (Array.isArray(docs)) {
        setApprovalDocs(docs);
      }
    });

    return () => {
      unsubSmart();
      unsubLegacy();
      unsubApproval();
    };
  }, []);

  // Sync state to local/cloud (Explicit Save Action)
  const handleSaveLedger = async (updatedData) => {
    setIsSaving(true);
    try {
      setSmartData(updatedData);
      await saveSmartOvertimeData(updatedData);
      
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // 1-Click Update Worker Attendance for Selected Day (Local Staging)
  const handleUpdateWorkerDayAttendance = (workerIndexInMaster, newCode) => {
    const updatedMatrix = [...smartData.attendanceMatrix];
    if (!updatedMatrix[workerIndexInMaster]) return;

    const worker = updatedMatrix[workerIndexInMaster];
    const prevDaily = worker.daily || {};
    const updatedDaily = { ...prevDaily, [selectedDay]: newCode };

    updatedMatrix[workerIndexInMaster] = {
      ...worker,
      daily: updatedDaily
    };

    const newLedger = {
      ...smartData,
      attendanceMatrix: updatedMatrix
    };

    setSmartData(newLedger);
    setHasUnsavedChanges(true);
  };

  // 1-Click Copy Closest Previous Weekday's Attendance to Selected Day for All Filtered Workers
  const handleSetAllFilteredWorkersSameAsPrevDay = () => {
    if (!filteredAttendanceWorkers || filteredAttendanceWorkers.length === 0) return;
    if (selectedDay <= 1) {
      triggerToast("⚠️ 1일은 이전 일자 데이터가 존재하지 않습니다.");
      return;
    }

    const currentDt = new Date(2026, 8, selectedDay);
    const currentDow = currentDt.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat

    // Helper: checks if a day has any worker attendance configured
    const hasDataOnDay = (d) => {
      if (!d || d < 1 || d >= selectedDay) return false;
      return (smartData.attendanceMatrix || []).some((w) => {
        const v = w.daily ? String(w.daily[d] || "").trim() : "";
        return v && v !== "-" && v !== "휴무";
      });
    };

    let targetSourceDay = null;

    // Case 1: Monday (월요일) -> Look for closest weekday in previous week (금 -> 목 -> 수 -> 화 -> 월)
    if (currentDow === 1) {
      for (let offset = 3; offset <= 7; offset++) {
        const candidate = selectedDay - offset;
        if (candidate >= 1 && hasDataOnDay(candidate)) {
          targetSourceDay = candidate;
          break;
        }
      }
      if (!targetSourceDay) {
        // Look for any preceding weekday with data down to day 1
        for (let d = selectedDay - 1; d >= 1; d--) {
          const dDt = new Date(2026, 8, d);
          const dDow = dDt.getDay();
          if (dDow !== 0 && dDow !== 6 && hasDataOnDay(d)) {
            targetSourceDay = d;
            break;
          }
        }
      }
      if (!targetSourceDay) {
        targetSourceDay = Math.max(1, selectedDay - 3);
      }
    }
    // Case 2: Sunday (일요일) -> Check previous Friday or Thursday
    else if (currentDow === 0) {
      for (let offset = 2; offset <= 6; offset++) {
        const candidate = selectedDay - offset;
        if (candidate >= 1 && hasDataOnDay(candidate)) {
          targetSourceDay = candidate;
          break;
        }
      }
      if (!targetSourceDay) {
        targetSourceDay = Math.max(1, selectedDay - 2);
      }
    }
    // Case 3: Saturday (토요일) -> Check previous Friday
    else if (currentDow === 6) {
      for (let offset = 1; offset <= 5; offset++) {
        const candidate = selectedDay - offset;
        if (candidate >= 1 && hasDataOnDay(candidate)) {
          targetSourceDay = candidate;
          break;
        }
      }
      if (!targetSourceDay) {
        targetSourceDay = Math.max(1, selectedDay - 1);
      }
    }
    // Case 4: Tuesday ~ Friday (화~금) -> Check selectedDay - 1, then search backwards if empty
    else {
      if (hasDataOnDay(selectedDay - 1)) {
        targetSourceDay = selectedDay - 1;
      } else {
        for (let d = selectedDay - 1; d >= 1; d--) {
          const dDt = new Date(2026, 8, d);
          const dDow = dDt.getDay();
          if (dDow !== 0 && dDow !== 6 && hasDataOnDay(d)) {
            targetSourceDay = d;
            break;
          }
        }
        if (!targetSourceDay) {
          targetSourceDay = selectedDay - 1;
        }
      }
    }

    const sourceDayLabel = getDayOfWeekKorean(targetSourceDay);
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
        }

        if (sourceVal) appliedCount++;

        updatedMatrix[idx] = {
          ...updatedMatrix[idx],
          daily: { ...prevDaily, [selectedDay]: sourceVal }
        };
      }
    });

    const newLedger = {
      ...smartData,
      attendanceMatrix: updatedMatrix
    };

    setSmartData(newLedger);
    setHasUnsavedChanges(true);

    const isMonday = currentDow === 1;
    const msg = isMonday
      ? `📋 [${selectedCompanyFilter}] ${filteredAttendanceWorkers.length}명에게 직전주 평일(9월 ${targetSourceDay}일 ${sourceDayLabel}요일)과 동일한 근태가 적용되었습니다.`
      : `📋 [${selectedCompanyFilter}] ${filteredAttendanceWorkers.length}명에게 전일(9월 ${targetSourceDay}일 ${sourceDayLabel}요일)과 동일한 근태가 적용되었습니다.`;

    triggerToast(msg);
  };

  // 1-Click Set All Filtered Workers to "🟢 정시" for Selected Day
  const handleSetAllFilteredWorkersRegular = () => {
    if (!filteredAttendanceWorkers || filteredAttendanceWorkers.length === 0) return;
    const updatedMatrix = [...smartData.attendanceMatrix];

    filteredAttendanceWorkers.forEach((worker) => {
      const idx = worker.originalMatrixIndex;
      if (updatedMatrix[idx]) {
        const prevDaily = updatedMatrix[idx].daily || {};
        updatedMatrix[idx] = {
          ...updatedMatrix[idx],
          daily: { ...prevDaily, [selectedDay]: "🟢" }
        };
      }
    });

    const newLedger = {
      ...smartData,
      attendanceMatrix: updatedMatrix
    };

    setSmartData(newLedger);
    setHasUnsavedChanges(true);
    triggerToast(`🟢 [${selectedCompanyFilter}] ${filteredAttendanceWorkers.length}명 전원 9월 ${selectedDay}일 정시(🟢)로 일괄 선택되었습니다.`);
  };

  // ⭐ USER ACTION: [ 💾 등록 ] 클릭 시 보고서 팝업창 오픈 (선택된 업체 관리자 결재선 자동 배정)
  const handleOpenRegistrationReportModal = () => {
    const d = selectedDay;
    const isWk = isWeekendByDate(d);
    const dayLabel = getDayOfWeekKorean(d);
    const reportType = isWk ? "특근보고서" : "근태보고서";

    const compLabel = selectedCompanyFilter === "전체" ? "5개사 통합" : selectedCompanyFilter;
    const compMeta = COMPANY_APPROVAL_MANAGERS[selectedCompanyFilter] || COMPANY_APPROVAL_MANAGERS["전체"];

    const attendedCount = filteredAttendanceWorkers.filter(w => {
      const val = w.daily ? w.daily[d] : "";
      const { isAttended, workHours } = calculateWorkerDailyHours(val);
      return isAttended && workHours > 0;
    }).length;

    const totalHours = filteredAttendanceWorkers.reduce((sum, w) => {
      const val = w.daily ? w.daily[d] : "";
      const { workHours } = calculateWorkerDailyHours(val);
      return sum + (workHours || 0);
    }, 0);

    setReportModalTitle(`9월 ${d}일(${dayLabel}) ${compMeta.plant} ${compLabel} ${reportType}`);
    setReportModalAuthor(compMeta.author || "양인나");
    setReportModalAuthorTitle(compMeta.drafterRole || "선임");
    
    // ⭐ 해당 회사 관리자들로 결재란 자동 구성 (담당: 승인, 책임: 결재대기, 이사/대표: 대기)
    setReportApprovalSteps([
      { role: "담당", name: compMeta.drafter, title: compMeta.drafterRole || "선임", status: "APPROVED", date: new Date().toLocaleDateString("ko-KR"), comment: "기안" },
      { role: "책임", name: compMeta.lead, title: compMeta.leadRole || "책임", status: "PENDING", date: "", comment: "" },
      { role: "이사", name: compMeta.director, title: compMeta.directorRole || "이사", status: "WAITING", date: "", comment: "" },
      { role: "대표", name: compMeta.ceo, title: compMeta.ceoRole || "대표", status: "WAITING", date: "" }
    ]);

    setReportModalNotes(
      `1. 2026년 9월 ${d}일(${dayLabel}) ${compLabel} 생산 라인 가동 및 ${reportType} 현황\n2. ${compMeta.plant} 소속 ${selectedCompanyFilter === "전체" ? "통합" : selectedCompanyFilter} 관리자 결재 승인\n3. 총 ${attendedCount}명 출근/투입 (총 투입공수: ${totalHours} M/H, 예상 노무비: ₩${(totalHours * 15000).toLocaleString()})`
    );

    handleOpenReportModal();
  };

  // ⭐ USER ACTION: [ 💾 팝업 내 최종 저장 및 보고서 등록 ]
  const handleConfirmAndSaveReportModal = async () => {
    setIsSaving(true);
    try {
      // 1. Save smart overtime ledger to Firestore & LocalStorage
      await saveSmartOvertimeData(smartData);
      
      // 2. Generate and save company-specific report record
      const d = selectedDay;
      const isWk = isWeekendByDate(d);
      const dayLabel = getDayOfWeekKorean(d);
      const reportType = isWk ? "특근보고서" : "근태보고서";
      const compLabel = selectedCompanyFilter === "전체" ? "5개사 통합" : selectedCompanyFilter;
      const compMeta = COMPANY_APPROVAL_MANAGERS[selectedCompanyFilter] || COMPANY_APPROVAL_MANAGERS["전체"];
      const finalReportTitle = (reportModalTitle && reportModalTitle.trim()) || `2026년 9월 ${d}일(${dayLabel}) ${compMeta.plant} ${compLabel} ${reportType}`;

      const items = filteredAttendanceWorkers.filter(w => {
        const val = w.daily ? w.daily[d] : "";
        const { isAttended, workHours } = calculateWorkerDailyHours(val);
        return isAttended && workHours > 0;
      }).map((w, idx) => {
        const val = w.daily ? w.daily[d] : "";
        const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
        return {
          id: `rep_item_${d}_${w.no || idx}_${w.name}`,
          no: idx + 1,
          company: w.company,
          factory: getPlantForCompany(w.company),
          dept: normalizeDept(w.dept),
          line: w.line || normalizeDept(w.dept),
          category: w.line || normalizeDept(w.dept),
          workerName: w.name,
          position: w.position || "작업원",
          attendanceCode: val,
          startTime: "08:00",
          endTime: val === "19" ? "19:00" : val === "21" ? "21:00" : val === "22" ? "22:00" : "17:00",
          hours: workHours || 8,
          otHours: (weekdayOt + weekendOt) || 0,
          count: 1,
          workContent: `${w.company} ${normalizeDept(w.dept)} 작업 수행`,
          workDetails: `${w.company} ${normalizeDept(w.dept)} ${w.line || ""} 생산 및 납품 대응`
        };
      });

      const totalHours = items.reduce((sum, it) => sum + (Number(it.hours) || 0), 0);
      const cost = totalHours * 15000;

      const compCleanSlug = selectedCompanyFilter === "전체" ? "all" : selectedCompanyFilter.replace(/[()]/g, "");
      const companyReport = {
        id: `report_${compCleanSlug}_2026_09_${String(d).padStart(2, "0")}`,
        plant: compMeta.plant,
        company: selectedCompanyFilter,
        companies: selectedCompanyFilter === "전체" ? COMPANIES : [selectedCompanyFilter],
        title: finalReportTitle,
        reportType: reportType,
        workDate: `2026-09-${String(d).padStart(2, "0")}`,
        workDateFormatted: `2026-09-${String(d).padStart(2, "0")} (${dayLabel})`,
        author: reportModalAuthor || "작성자",
        authorTitle: reportModalAuthorTitle || "선임",
        updatedAt: new Date().toISOString(),
        status: "IN_PROGRESS",
        approval: reportApprovalSteps,
        totalWorkers: items.length,
        totalHours: totalHours,
        cost: cost,
        items: items,
        reasons: reportModalNotes.split("\n").filter(Boolean)
      };

      const updatedReports = [companyReport, ...legacyReports.filter((r) => r.id !== companyReport.id)];
      await saveOvertimeReport(companyReport);
      setLegacyReports(updatedReports);
      
      // ⭐ 공장별 소속 협력사 특근보고서 결재함 자동 취합 및 연동
      // 삼랑진공장: (주)오륙 + 유성 취합 ➔ 결재함 자동 등록
      // 한림공장: (주)조영산업 + 한울 + 부림텍 취합 ➔ 결재함 자동 등록
      if (isWk) {
        await syncPlantOvertimeToApprovalBox({
          plant: selectedCompanyFilter === "전체" ? null : compMeta.plant,
          company: selectedCompanyFilter,
          workDate: `2026-09-${String(d).padStart(2, "0")}`,
          matrix: smartData.attendanceMatrix,
          reports: updatedReports
        });
      }
      
      setHasUnsavedChanges(false);
      setIsReportModalOpen(false);
      
      if (isWk) {
        const plantLabel = compMeta.plant || (selectedCompanyFilter === "전체" ? "전 공장" : "공장");
        triggerToast(`🎉 [${selectedCompanyFilter}] ${reportType} 등록 및 [${plantLabel}] 협력사 취합 결재함 연동이 완료되었습니다!`);
      } else {
        triggerToast(`🎉 [${selectedCompanyFilter}] 관리자 결재선 적용 ${reportType}가 등록되었습니다!`);
      }
    } catch (err) {
      console.error(err);
      alert("등록 중 오류가 발생했습니다: " + err.message);
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
      setSelectedCompanyFilter("(주)오륙");
    } else if (report.plant === "한림공장") {
      setSelectedCompanyFilter("(주)조영산업");
    }
    setActiveTab("daily_input");
    triggerToast(`✏️ 9월 ${report.workDate ? report.workDate.split("-")[2] : ""}일 [${report.company || report.plant || "전체"}] 근태 등록 화면으로 이동했습니다.`);
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
      const synchedMatrix = buildMatrixFromReports(smartData.masterWorkers, nextReports);
      const updatedLedger = {
        ...smartData,
        attendanceMatrix: synchedMatrix
      };
      setSmartData(updatedLedger);
      await saveSmartOvertimeData(updatedLedger);

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
    const company = selectedCompanyManageWorkers || selectedCompanyPopup || "(주)오륙";
    const dept = normalizeDept(quickNewWorkerDept || "가공동");
    const line = quickNewWorkerLine.trim() || dept;
    const name = quickNewWorkerName.trim();
    const position = quickNewWorkerPos || "작업원";

    // Build standard 30-day attendance record for September 2026
    const emptyDaily = {};
    for (let d = 1; d <= 30; d++) {
      const isWk = (d === 5 || d === 6 || d === 12 || d === 13 || d === 19 || d === 20 || d === 26 || d === 27);
      if (isWk) {
        emptyDaily[d] = "-";
      } else if (d <= 8) {
        emptyDaily[d] = "🟢";
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
    if (!window.confirm(`정말로 [${companyName}] ${workerName} (${dept || ""}) 근로자를 삭제하시겠습니까?\n(해당 작업자의 모든 9월 근태 내역이 삭제됩니다)`)) {
      return;
    }

    const currentMatrix = [...(smartData.attendanceMatrix || [])];
    let updatedMatrix;
    if (
      typeof workerIndexInMatrix === "number" &&
      workerIndexInMatrix >= 0 &&
      workerIndexInMatrix < currentMatrix.length &&
      currentMatrix[workerIndexInMatrix]?.name === workerName &&
      currentMatrix[workerIndexInMatrix]?.company === companyName
    ) {
      updatedMatrix = currentMatrix.filter((_, idx) => idx !== workerIndexInMatrix);
    } else {
      let removed = false;
      updatedMatrix = currentMatrix.filter((w) => {
        if (!removed && w.company === companyName && w.name === workerName) {
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
      const filename = exportSmartOvertimeToExcel(smartData);
      triggerToast(`📥 엑셀 다운로드 완료 (${filename})`);
    } catch (err) {
      alert("엑셀 내보내기 중 오류가 발생했습니다: " + err.message);
    }
  };

  // Filtered workers for selectedCompanyManageWorkers modal
  const manageCompanyWorkers = useMemo(() => {
    if (!selectedCompanyManageWorkers) return [];
    let list = (smartData.attendanceMatrix || []).map((w, originalIdx) => ({
      ...w,
      dept: normalizeDept(w.dept),
      originalMatrixIndex: originalIdx
    })).filter((w) => w.company === selectedCompanyManageWorkers);

    if (manageWorkerSearch.trim()) {
      const q = manageWorkerSearch.trim().toLowerCase();
      list = list.filter((w) =>
        w.name.toLowerCase().includes(q) ||
        w.dept.toLowerCase().includes(q) ||
        (w.line && w.line.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedCompanyManageWorkers, smartData.attendanceMatrix, manageWorkerSearch]);

  // Calculations & Summaries for 5 Companies
  const dailySummary = useMemo(() => {
    return calculateDailySummary(smartData.attendanceMatrix || [], selectedDay);
  }, [smartData.attendanceMatrix, selectedDay]);

  const companySummary = useMemo(() => {
    return calculateCompanySummary(smartData.attendanceMatrix || []);
  }, [smartData.attendanceMatrix]);

  const deptSummary = useMemo(() => {
    return calculateDeptSummary(smartData.attendanceMatrix || [], selectedDay);
  }, [smartData.attendanceMatrix, selectedDay]);

  // Filtered attendance rows for Daily Input and Summary tabs
  const filteredAttendanceWorkers = useMemo(() => {
    let list = (smartData.attendanceMatrix || []).map((w, originalIdx) => ({
      ...w,
      dept: normalizeDept(w.dept),
      originalMatrixIndex: originalIdx
    }));

    if (selectedCompanyFilter !== "전체") {
      list = list.filter((w) => w.company === selectedCompanyFilter);
    }
    return list;
  }, [smartData.attendanceMatrix, selectedCompanyFilter]);

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

    const workers = (smartData.attendanceMatrix || [])
      .map((w, originalMatrixIndex) => ({
        ...w,
        dept: normalizeDept(w.dept),
        originalMatrixIndex
      }))
      .filter((w) => w.company === company);

    return {
      company,
      breakdown,
      workers
    };
  }, [selectedCompanyPopup, dailySummary, smartData.attendanceMatrix, selectedDay]);

  // Real-time Plant Summary for the Selected Upcoming Weekend
  const weekendPlantSummary = useMemo(() => {
    const day = selectedWeekendDay; // e.g. 12 (or 5)
    const matrix = smartData?.attendanceMatrix || [];

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

    return {
      samrangjin: {
        plant: "삼랑진공장",
        companies: "(주)오륙, 유성",
        dateFormatted: `2026-09-${String(day).padStart(2, "0")} (토)`,
        author: "양인나 선임",
        headcount: samWorkers.length || 40,
        manHours: samHours || 382,
        cost: samCost || 5730000,
        lines: samLines,
        reportId: `report_samrangjin_2026_09_${String(day).padStart(2, "0")}`
      },
      hallim: {
        plant: "한림공장",
        companies: "(주)조영산업, 한울, 부림텍",
        dateFormatted: (day === 5 ? "2026-09-06 (일)" : `2026-09-${String(day).padStart(2, "0")} (토)`),
        author: (day === 5 ? "한울 협력업체" : "오상민 선임"),
        headcount: halWorkers.length || (day === 5 ? 2 : 4),
        manHours: halHours || (day === 5 ? 16 : 32),
        cost: halCost || (day === 5 ? 240000 : 480000),
        lines: halLines,
        reportId: `report_hanlim_2026_09_${String(day).padStart(2, "0")}`
      }
    };
  }, [selectedWeekendDay, smartData]);

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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <h1 className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>근태현황 및 관리</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-400/40">
                  5개사 잔업 스마트 대장
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ⭐ TOP 5 COMPANY SUMMARY CARDS (오륙, 조영산업, 한울, 부림텍, 유성) - 미니멀 패널 */}
        {/* ========================================================================= */}
        <div className="hidden md:block pt-1">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>5개 협력사별 근태 현황 (9월 {selectedDay}일 기준)</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              전체 총원: <strong className="text-white font-mono">{smartData.attendanceMatrix?.length || 0}명</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {COMPANIES.map((compName) => {
              const breakdown = dailySummary.companyBreakdown?.[compName] || {
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
              const dotColor = compName === "(주)오륙" ? "bg-blue-400" :
                compName === "(주)조영산업" ? "bg-purple-400" :
                compName === "한울" ? "bg-emerald-400" :
                compName === "부림텍" ? "bg-amber-400" : "bg-cyan-400";

              const otWorkersCount = breakdown.otWorkers !== undefined
                ? breakdown.otWorkers
                : (breakdown.ot19 + breakdown.ot21 + breakdown.ot22 + (breakdown.specialNight || 0));

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
                  {/* 상단: 회사명 */}
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5 group-hover:text-cyan-300 transition-colors">
                      <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                      {compName}
                    </span>
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

                  {/* 🔘 하단 액션 버튼: [인원관리] & [상세] */}
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
                        handleOpenCompanyPopup(compName);
                      }}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-800/90 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500 font-bold text-[11px] transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="오늘자 근태 현황 상세 보기"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>상세</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🧭 MAIN TAB NAVIGATION (Clean 4 Tabs - 근태등록 / 일자별 / 종합현황 / 관리) */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200 dark:border-slate-800">
        {[
          { id: "daily_input", label: "근태등록", icon: Zap, badge: hasUnsavedChanges ? "미저장" : null, highlight: true },
          { id: "daily_summary", label: "일자별", icon: FileSpreadsheet },
          { id: "monthly_matrix", label: "종합현황", icon: CalendarDays },
          { id: "legacy_reports", label: "관리", icon: FileText, badge: `${legacyReports.length}건` }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? tab.highlight
                    ? "bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400"
                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? (tab.highlight ? "text-white" : "text-cyan-400") : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive 
                    ? "bg-white/20 text-white" 
                    : tab.badge === "미저장"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                    : "bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
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
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d} className="bg-slate-900 text-white font-bold py-1">
                        2026년 9월 {d}일 ({(d === 6 || d === 13 || d === 20 || d === 27) ? "일요일" : (d === 5 || d === 12 || d === 19 || d === 26) ? "토요일" : "평일"})
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
                    {["(주)오륙", "유성"].map((comp) => (
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
                    {["(주)조영산업", "한울", "부림텍"].map((comp) => (
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
              <div className="flex items-center gap-2 shrink-0">
                {hasUnsavedChanges && (
                  <span className="px-2 py-0.5 rounded-lg bg-rose-500/30 text-rose-300 text-[11px] font-black border border-rose-400/50 animate-pulse">
                    ● 미등록
                  </span>
                )}
                <button
                  onClick={handleOpenRegistrationReportModal}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <FileText className="w-4 h-4" />
                  <span>💾 [{selectedCompanyFilter}] 9월 {selectedDay}일({getDayOfWeekKorean(selectedDay)}) 등록</span>
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
                  작업자별 9월 {selectedDay}일 근태 선택 테이블 (2열 병렬)
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  (조회 {filteredAttendanceWorkers.length}명)
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={handleSetAllFilteredWorkersSameAsPrevDay}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer border border-indigo-500 ring-2 ring-indigo-400/20"
                  title={`전일(9월 ${selectedDay > 1 ? selectedDay - 1 : 1}일)과 동일한 근태를 현재 선택된 9월 ${selectedDay}일에 일괄 적용합니다`}
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
                              <th className="py-1.5 px-0.5 sm:px-1.5 text-center">9월 {selectedDay}일 근태 선택</th>
                              <th className="py-1.5 px-1 text-center w-10 sm:w-12">잔업</th>
                              <th className="py-1.5 px-0.5 text-center w-6 sm:w-7"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40 text-xs">
                            {colWorkers.map((worker) => {
                              const currentVal = worker.daily ? worker.daily[selectedDay] : "";
                              const meta = getOptionMeta(currentVal);
                              const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(currentVal);
                              const ot = weekdayOt + weekendOt;
                              const companyTheme = COMPANY_THEMES[worker.company] || COMPANY_THEMES["(주)오륙"];
                              const cleanWorkerName = worker.name ? worker.name.split(" ")[0].replace(/\([^)]*\)/g, "").trim() : "";

                              return (
                                <tr
                                  key={`${worker.company}__${worker.name}__${worker.originalMatrixIndex}`}
                                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                  {/* No */}
                                  <td className="py-1 px-1 text-center font-mono text-slate-400 text-[10.5px] sm:text-[11px]">
                                    {worker.no}
                                  </td>

                                  {/* 소속 업체 (모바일 숨김) */}
                                  <td className="hidden sm:table-cell py-1 px-1.5">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] font-black border ${companyTheme.badge} whitespace-nowrap`}>
                                      {worker.company}
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
                                      {/* 정시 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "🟢")}
                                        title="정시 출근 (8시간)"
                                        className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "🟢" || currentVal === "정시" || currentVal === "17"
                                            ? "bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        정시
                                      </button>

                                      {/* 19시 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "19")}
                                        title="19시 잔업 (+2시간)"
                                        className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "19" || currentVal === "19시"
                                            ? "bg-amber-600 text-white font-black shadow-xs ring-1 ring-amber-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        19시
                                      </button>

                                      {/* 21시 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "21")}
                                        title="21시 잔업 (+4시간)"
                                        className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "21" || currentVal === "21시"
                                            ? "bg-orange-600 text-white font-black shadow-xs ring-1 ring-orange-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        21시
                                      </button>

                                      {/* 22시 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "22")}
                                        title="22시 잔업 (+5시간)"
                                        className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "22" || currentVal === "22시"
                                            ? "bg-rose-600 text-white font-black shadow-xs ring-1 ring-rose-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        22시
                                      </button>

                                      {/* 야간 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "야간")}
                                        title="야간 근무 (8시간)"
                                        className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "야간"
                                            ? "bg-indigo-600 text-white font-black shadow-xs ring-1 ring-indigo-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        야간
                                      </button>

                                      {/* 연차 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "연차")}
                                        title="연차 휴가"
                                        className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "연차"
                                            ? "bg-sky-600 text-white font-black shadow-xs ring-1 ring-sky-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        연차
                                      </button>

                                      {/* 결근 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "결근")}
                                        title="결근"
                                        className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "결근"
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
                                        handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "");
                                        triggerToast(`↩️ ${worker.name}님의 9월 ${selectedDay}일 근태 선택이 취소되었습니다.`);
                                      }}
                                      title={`9월 ${selectedDay}일 근태 선택 취소`}
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
      {/* 📋 TAB 2: 일자별 종합 집계 (DAILY SUMMARY TABLE) */}
      {/* ========================================================================= */}
      {activeTab === "daily_summary" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-cyan-600" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  9월 {selectedDay}일 5개사 일일 종합 집계표
                </h3>
              </div>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="bg-slate-950 text-white font-black text-xs sm:text-sm border-2 border-slate-600 rounded-xl px-3 py-1.5 cursor-pointer"
              >
                {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white font-bold">
                    9월 {d}일 ({d % 7 === 6 || d % 7 === 0 ? "주말" : "평일"})
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
                    const samBreakdown = ["(주)오륙", "유성"].map(c => dailySummary.companyBreakdown?.[c] || {});
                    const samTotal = samBreakdown.reduce((s, r) => s + (r.total || 0), 0);
                    const samAttended = samBreakdown.reduce((s, r) => s + (r.attended || 0), 0);
                    const samReg = samBreakdown.reduce((s, r) => s + (r.regular || 0), 0);
                    const samOt19 = samBreakdown.reduce((s, r) => s + (r.ot19 || 0), 0);
                    const samOt21 = samBreakdown.reduce((s, r) => s + (r.ot21 || 0), 0);
                    const samOt22 = samBreakdown.reduce((s, r) => s + (r.ot22 || 0), 0);
                    const samNight = samBreakdown.reduce((s, r) => s + (r.specialNight || 0), 0);
                    const samOtHours = samBreakdown.reduce((s, r) => s + (r.otHours || 0), 0);
                    const samTotalHours = samBreakdown.reduce((s, r) => s + (r.totalHours || 0), 0);

                    const halBreakdown = ["(주)조영산업", "한울", "부림텍"].map(c => dailySummary.companyBreakdown?.[c] || {});
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
                        {["(주)오륙", "유성"].map((comp) => {
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
                        {["(주)조영산업", "한울", "부림텍"].map((comp) => {
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
      {/* 📊 TAB 3: 9월 전사 종합현황판 (업체별 드롭다운 & 30일 전체 매트릭스) */}
      {/* ========================================================================= */}
      {activeTab === "monthly_matrix" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-4 sm:p-5">
          {/* Top Controls: Company Dropdown & Pills + Dynamic Summary */}
          {(() => {
            const filteredMatrixList = (smartData.attendanceMatrix || []).filter((w) => {
              if (matrixCompanyFilter !== "전체" && w.company !== matrixCompanyFilter) return false;
              return true;
            });

            // Calculate aggregated metrics for filtered workers
            let sumWorkDays = 0;
            let sumWeekdayOt = 0;
            let sumWeekendOt = 0;
            let sumTotalHours = 0;

            filteredMatrixList.forEach((w) => {
              const t = calculateWorkerMonthlyTotals(w);
              sumWorkDays += t.workDays;
              sumWeekdayOt += t.weekdayOtHours;
              sumWeekendOt += t.weekendOtHours;
              sumTotalHours += t.totalHours;
            });

            return (
              <>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-indigo-500" />
                      <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                        9월 30일 근태 및 잔업 전체 매트릭스
                      </h3>
                    </div>

                    {/* Company Dropdown Select (공장별 그룹화) */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">업체 선택:</span>
                      <select
                        value={matrixCompanyFilter}
                        onChange={(e) => setMatrixCompanyFilter(e.target.value)}
                        className="bg-slate-950 text-white font-black text-xs sm:text-sm border-2 border-indigo-400 focus:border-indigo-300 rounded-xl px-3 py-1.5 cursor-pointer shadow-sm"
                      >
                        <option value="전체" className="bg-slate-900 text-white font-bold">전체 (5개 협력사 통합)</option>
                        <optgroup label="🏭 삼랑진공장" className="bg-slate-950 text-amber-300 font-bold">
                          <option value="(주)오륙" className="bg-slate-900 text-white font-bold">(주)오륙</option>
                          <option value="유성" className="bg-slate-900 text-white font-bold">유성</option>
                        </optgroup>
                        <optgroup label="🏭 한림공장" className="bg-slate-950 text-emerald-300 font-bold">
                          <option value="(주)조영산업" className="bg-slate-900 text-white font-bold">(주)조영산업</option>
                          <option value="한울" className="bg-slate-900 text-white font-bold">한울</option>
                          <option value="부림텍" className="bg-slate-900 text-white font-bold">부림텍</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  {/* Company Quick Filter Pills (삼랑진 & 한림 분리 체계) */}
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
                      전체
                    </button>

                    {/* 삼랑진 그룹 */}
                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-950 border border-amber-600/50 rounded-xl">
                      <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 px-1.5 flex items-center gap-0.5">
                        <Factory className="w-3 h-3" />
                        <span>삼랑진:</span>
                      </span>
                      {["(주)오륙", "유성"].map((comp) => (
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
                      {["(주)조영산업", "한울", "부림텍"].map((comp) => (
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
                </div>

                {/* Filtered Company Summary KPI Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-bold">조회 대상 인원</span>
                    <span className="font-mono font-black text-sm sm:text-base text-indigo-600 dark:text-indigo-400">{filteredMatrixList.length}명</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-bold">9월 총 출근일수</span>
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
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                          <th key={d} className={`p-1 text-center w-7 ${(d === 6 || d === 13 || d === 20 || d === 27) ? "bg-rose-950/80 text-rose-300" : (d === 5 || d === 12 || d === 19 || d === 26) ? "bg-blue-950/80 text-blue-300" : ""}`}>
                            {d}
                          </th>
                        ))}
                        <th className="p-2 text-center w-14 bg-slate-800">출근일</th>
                        <th className="p-2 text-center w-14 bg-slate-800 text-amber-300">평일잔업</th>
                        <th className="p-2 text-center w-14 bg-slate-800 text-purple-300">특근(H)</th>
                        <th className="p-2 text-center w-14 bg-slate-800 text-cyan-300">총공수</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredMatrixList.map((w, idx) => {
                        const totals = calculateWorkerMonthlyTotals(w);
                        const cleanWorkerName = w.name ? w.name.split(" ")[0].replace(/\([^)]*\)/g, "").trim() : "";
                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-1.5 text-center font-mono text-slate-400 sticky left-0 bg-white dark:bg-slate-900 z-10">{idx + 1}</td>
                            <td className="hidden sm:table-cell p-1.5 font-bold sticky left-10 bg-white dark:bg-slate-900 z-10 truncate max-w-[80px]">{w.company}</td>
                            <td className="hidden sm:table-cell p-1.5 text-slate-500 truncate max-w-[80px]">{normalizeDept(w.dept)}</td>
                            <td className="p-1.5 font-black sticky left-10 sm:left-28 bg-white dark:bg-slate-900 z-10">{cleanWorkerName}</td>
                            {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
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
      {/* 📑 TAB 4: 특근보고서 관리 (SATURDAY OVERTIME & OFFICIAL REPORTS) */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 📑 TAB 4: 근태/특근보고서 관리 (WEEKDAY ATTENDANCE, WEEKEND OVERTIME & PLANT SYNTHESIS) */}
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
                      {["(주)오륙", "유성"].map((comp) => (
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
                      {["(주)조영산업", "한울", "부림텍"].map((comp) => (
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
                      2026-09-{String(selectedDay).padStart(2, "0")}
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
                        <span>9월 {selectedDay}일 투입/등록 인원 ({enteredWorkers.length}명)</span>
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
                    <span className="text-cyan-300 font-normal text-xs sm:text-sm">9월 {selectedDay}일 오늘자 근태 현황</span>
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
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d} className="bg-slate-900 text-white font-bold">{d}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="라인/공정 (선택)"
                    value={quickNewWorkerLine}
                    onChange={(e) => setQuickNewWorkerLine(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold placeholder:text-slate-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <select
                    value={quickNewWorkerPos}
                    onChange={(e) => setQuickNewWorkerPos(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  >
                    <option value="작업원" className="bg-slate-900 text-white">작업원</option>
                    <option value="반장/조장" className="bg-slate-900 text-white">반장/조장</option>
                    <option value="조장" className="bg-slate-900 text-white">조장</option>
                    <option value="반장" className="bg-slate-900 text-white">반장</option>
                    <option value="담당" className="bg-slate-900 text-white">담당</option>
                    <option value="선임" className="bg-slate-900 text-white">선임</option>
                    <option value="책임" className="bg-slate-900 text-white">책임</option>
                    <option value="주임" className="bg-slate-900 text-white">주임</option>
                    <option value="대리" className="bg-slate-900 text-white">대리</option>
                    <option value="과장" className="bg-slate-900 text-white">과장</option>
                    <option value="차장" className="bg-slate-900 text-white">차장</option>
                    <option value="부장" className="bg-slate-900 text-white">부장</option>
                    <option value="이사" className="bg-slate-900 text-white">이사</option>
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
                        <th className="py-1.5 px-2.5">라인/공정</th>
                        <th className="py-1.5 px-2.5 text-center w-16">직위</th>
                        <th className="py-1.5 px-2.5 text-center w-16">삭제</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-xs">
                      {manageCompanyWorkers.map((worker, idx) => (
                        <tr key={`${worker.company}_${worker.name}_${worker.originalMatrixIndex}_${idx}`} className="hover:bg-slate-800/60 transition-colors">
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
                        ? "🟢 결재 완료 (4/4)"
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
                                  <span className="text-[7px] font-bold">오륙</span>
                                  <span className="text-[10px] font-black">{st.name?.slice(0, 3)}</span>
                                  <span className="text-[7px]">{sIdx === 0 ? "기안" : "승인"}</span>
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
    </div>
  );
};
