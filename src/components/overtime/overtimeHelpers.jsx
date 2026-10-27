import React from "react";
import { cleanCompanyName } from "../../services/overtimeSmartService";
import { getPlantForCompany, isWeekendByDate } from "../../services/overtimeService";

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

  // 1. Check custom reasons/notes
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

// ⭐ 전자결재함 연동: 5개사 개별 특근보고서 실시간 결재 상태 및 결재 단계(담당/책임/이사/대표) 자동 매칭
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
  const cleanComp = cleanCompanyName(report.company || "오륙");
  const plantName = report.plant || getPlantForCompany(cleanComp);
  const compSlugMap = { "오륙": "oryuk", "유성": "yuseong", "조영": "joyoung", "한울": "hanul", "부림텍": "burimtech" };
  const compSlug = compSlugMap[cleanComp] || "oryuk";
  const canonicalDocId = `appr_ot_${compSlug}_${workDateStr.replace(/-/g, "")}`;

  // 1. 5개사 개별 특근보고서 결재문서 조회
  let matchedDoc = (approvalDocs || []).find((d) => d.id === canonicalDocId);

  // 2. 업체명 및 일자 기준 매칭
  if (!matchedDoc && workDateStr) {
    matchedDoc = (approvalDocs || []).find(
      (d) =>
        (d.type === "OVERTIME" || d.docType === "OVERTIME" || d.category === "특근보고서") &&
        (cleanCompanyName(d.company || "") === cleanComp || (d.title && d.title.includes(cleanComp))) &&
        (d.workDate === workDateStr ||
          (d.id && d.id.includes(workDateStr.replace(/-/g, ""))) ||
          (d.title && d.title.includes(workDateStr)))
    );
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
