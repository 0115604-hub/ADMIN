import {
  formatMMDDWithWeekday,
  formatYYYYMMDDWithWeekday,
  getKSTFormattedString
} from "../../utils/dateUtils";
import { getScheduleCategoryMeta } from "../../services/commonScheduleService";
import { getLocalAnnualLeaves } from "../../services/annualLeaveService";
import { getLocalApprovalDocs } from "../../services/approvalService";
import { getLocalOvertimeReports } from "../../services/overtimeService";
import { getLocalWorkLogs } from "../../services/workLogService";
import { getLocalExtrusionReports } from "../../services/extrusionProductionService";
import { getLocalUrgentIssues } from "../../services/urgentIssueService";
import { getLocalSmartOvertimeData, cleanCompanyName } from "../../services/overtimeSmartService";
import { INITIAL_SMART_OVERTIME_DATA } from "../../data/masterOvertimeSmartData";

// Previous working day calculation
export const calculatePrevDateInfo = (todayDateStr) => {
  const [curY, curM, curD] = todayDateStr.split("-").map(Number);
  const curDateObj = new Date(curY, curM - 1, curD);
  const dayOfWeek = curDateObj.getDay();
  let daysBack = 1;
  if (dayOfWeek === 1) daysBack = 2; // 월요일 기준 토요일
  else if (dayOfWeek === 0) daysBack = 1; // 일요일 기준 토요일
  const prevDateObj = new Date(curDateObj);
  prevDateObj.setDate(curDateObj.getDate() - daysBack);
  const prevDayStr = `${prevDateObj.getFullYear()}-${String(prevDateObj.getMonth() + 1).padStart(2, "0")}-${String(prevDateObj.getDate()).padStart(2, "0")}`;
  const prevDayNum = prevDateObj.getDate();
  const prevDayWeekName = ["일", "월", "화", "수", "목", "금", "토"][prevDateObj.getDay()];
  return {
    prevDayStr,
    prevDayNum,
    prevDayWeekName,
    formatted: `${prevDateObj.getMonth() + 1}월 ${prevDayNum}일(${prevDayWeekName})`
  };
};

// Live previous day attendance statistics
export const computeMorningAttendance = (prevDateInfo) => {
  const { prevDayNum, prevDayStr, prevDayWeekName } = prevDateInfo;

  const leaves = getLocalAnnualLeaves() || [];
  const prevDayLeaves = leaves.filter((l) => {
    if (!l.startDate || l.isCompleted || l.isDismissed || l.isSharedRecipient || l.sharedBy) return false;
    // 🔒 [보안 원칙] 대표이사(권태형) 개인 일정 및 연차는 텔레그램 공용 브리핑 노출 절대 차단
    const uName = String(l.userName || l.name || "");
    if (uName.includes("권태형") || uName.includes("대표이사") || uName.includes("대표님") || uName.includes("대표")) return false;
    const start = l.startDate;
    const end = l.endDate || l.startDate;
    return start <= prevDayStr && prevDayStr <= end;
  });

  const samPrevLeaves = prevDayLeaves.filter((l) => !l.plant?.includes("한림"));
  const hanPrevLeaves = prevDayLeaves.filter((l) => l.plant?.includes("한림"));

  const samLeaveDetailStr = samPrevLeaves.length > 0 
    ? ` (${samPrevLeaves.map((l) => `${l.userName} ${l.title || "선임"}`).join(", ")})`
    : "";
  const hanLeaveDetailStr = hanPrevLeaves.length > 0
    ? ` (${hanPrevLeaves.map((l) => `${l.userName} ${l.title || "선임"}`).join(", ")})`
    : "";

  // 1. 특근보고서 조회 (휴일 또는 특근인 경우 특근보고서 기준 집계)
  const overtimeReports = getLocalOvertimeReports() || [];
  const prevDayOtReports = overtimeReports.filter((r) => !r.isDeleted && !r.deleted && r.workDate === prevDayStr);
  const isWeekendOrHoliday = prevDayWeekName === "토" || prevDayWeekName === "일";

  if (isWeekendOrHoliday || prevDayOtReports.length > 0) {
    const samOtList = prevDayOtReports.filter((r) => r.plant?.includes("삼랑진") || ["오륙", "유성"].includes(cleanCompanyName(r.company)));
    const hanOtList = prevDayOtReports.filter((r) => r.plant?.includes("한림") || ["조영", "한울", "부림텍", "조영산업"].includes(cleanCompanyName(r.company)));

    const samOtCount = samOtList.reduce((sum, r) => sum + Number(r.headcount || r.totalWorkers || 0), 0);
    const hanOtCount = hanOtList.reduce((sum, r) => sum + Number(r.headcount || r.totalWorkers || 0), 0);

    const samBreakdown = samOtList.map((r) => `${cleanCompanyName(r.company)} ${r.headcount || r.totalWorkers || 0}명`).join(", ");
    const hanBreakdown = hanOtList.map((r) => `${cleanCompanyName(r.company)} ${r.headcount || r.totalWorkers || 0}명`).join(", ");

    const samStr = samOtCount > 0
      ? `특근 ${samOtCount}명${samBreakdown ? ` (${samBreakdown})` : ""} / 연차 ${samPrevLeaves.length}명${samLeaveDetailStr}`
      : `휴무 (특근 없음) / 연차 ${samPrevLeaves.length}명${samLeaveDetailStr}`;

    const hanStr = hanOtCount > 0
      ? `특근 ${hanOtCount}명${hanBreakdown ? ` (${hanBreakdown})` : ""} / 연차 ${hanPrevLeaves.length}명${hanLeaveDetailStr}`
      : `휴무 (특근 없음) / 연차 ${hanPrevLeaves.length}명${hanLeaveDetailStr}`;

    return { samStr, hanStr };
  }

  // 평일 정규 근무일: 스마트 대장 Matrix 집계
  let smartMatrix = [];
  try {
    const smartData = getLocalSmartOvertimeData();
    if (smartData && Array.isArray(smartData.attendanceMatrix)) {
      smartMatrix = smartData.attendanceMatrix;
    }
  } catch (e) {
    smartMatrix = INITIAL_SMART_OVERTIME_DATA?.attendanceMatrix || [];
  }
  if (!smartMatrix || smartMatrix.length === 0) {
    smartMatrix = INITIAL_SMART_OVERTIME_DATA?.attendanceMatrix || [];
  }

  let samAtt = 0, samReg = 0, sam19 = 0, sam21 = 0, sam22 = 0, samSpec = 0, samNight = 0;
  let hanAtt = 0, hanReg = 0, han19 = 0, han21 = 0, han22 = 0, hanSpec = 0, hanNight = 0;

  smartMatrix.forEach((w) => {
    const comp = cleanCompanyName(w.company);
    const isSam = comp === "오륙" || comp === "유성" || (w.plant && w.plant.includes("삼랑진"));
    const v = String((w.daily && (w.daily[prevDayNum] ?? w.daily[String(prevDayNum)])) || "").trim();

    if (isSam) {
      if (v === "🟢" || v === "정시" || v === "17") { samAtt++; samReg++; }
      else if (v === "19" || v === "19시") { samAtt++; sam19++; }
      else if (v === "21" || v === "21시") { samAtt++; sam21++; }
      else if (v === "22" || v === "22시") { samAtt++; sam22++; }
      else if (v === "특근" || v === "주말특근") { samAtt++; samSpec++; }
      else if (v === "야간" || v === "주야") { samAtt++; samNight++; }
    } else {
      if (v === "🟢" || v === "정시" || v === "17") { hanAtt++; hanReg++; }
      else if (v === "19" || v === "19시") { hanAtt++; han19++; }
      else if (v === "21" || v === "21시") { hanAtt++; han21++; }
      else if (v === "22" || v === "22시") { hanAtt++; han22++; }
      else if (v === "특근" || v === "주말특근") { hanAtt++; hanSpec++; }
      else if (v === "야간" || v === "주야") { hanAtt++; hanNight++; }
    }
  });

  const samOtParts = [];
  if (samReg > 0) samOtParts.push(`정시 ${samReg}`);
  if (sam19 > 0) samOtParts.push(`19시 ${sam19}`);
  if (sam21 > 0) samOtParts.push(`21시 ${sam21}`);
  if (sam22 > 0) samOtParts.push(`22시 ${sam22}`);
  if (samSpec > 0) samOtParts.push(`특근 ${samSpec}`);
  if (samNight > 0) samOtParts.push(`야간 ${samNight}`);
  const samOtBreakdown = samOtParts.length > 0 ? ` (${samOtParts.join(", ")})` : "";

  const hanOtParts = [];
  if (hanReg > 0) hanOtParts.push(`정시 ${hanReg}`);
  if (han19 > 0) hanOtParts.push(`19시 ${han19}`);
  if (han21 > 0) hanOtParts.push(`21시 ${han21}`);
  if (han22 > 0) hanOtParts.push(`22시 ${han22}`);
  if (hanSpec > 0) hanOtParts.push(`특근 ${hanSpec}`);
  if (hanNight > 0) hanOtParts.push(`야간 ${hanNight}`);
  const hanOtBreakdown = hanOtParts.length > 0 ? ` (${hanOtParts.join(", ")})` : "";

  const samStr = samAtt > 0
    ? `출근 ${samAtt}명${samOtBreakdown} / 연차 ${samPrevLeaves.length}명${samLeaveDetailStr}`
    : `휴무 / 연차 ${samPrevLeaves.length}명${samLeaveDetailStr}`;

  const hanStr = hanAtt > 0
    ? `출근 ${hanAtt}명${hanOtBreakdown} / 연차 ${hanPrevLeaves.length}명${hanLeaveDetailStr}`
    : `휴무 / 연차 ${hanPrevLeaves.length}명${hanLeaveDetailStr}`;

  return { samStr, hanStr };
};

// Live approvals
export const computeMorningApprovalDocs = (todayDateStr) => {
  const docs = getLocalApprovalDocs() || [];
  return docs
    .filter((d) => !d.isDeleted && !d.deleted && (d.status === "IN_PROGRESS" || d.status === "HOLD" || d.status === "PENDING"))
    .map((d) => {
      const nextApproverObj = d.approvers?.find((a) => a.status === "PENDING") ||
                             d.steps?.find((s) => s.status === "PENDING") ||
                             (d.steps && d.steps[d.currentStep - 1]);
      const nextApprover = nextApproverObj?.name || "결재자";
      const nextTitle = nextApproverObj?.title || nextApproverObj?.role || "책임";
      return {
        id: d.id,
        title: d.title,
        drafter: d.drafter || "작성자",
        nextApprover,
        nextTitle,
        date: d.workDate || d.date || d.createdAt || ""
      };
    })
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
};

export const computeMorningApprovalDocLines = (morningApprovalDocs) => {
  if (morningApprovalDocs.length === 0) return "• 없음 (전건 결재완료)";
  const lines = morningApprovalDocs.slice(0, 5).map((d) => {
    return `• ${d.title} (기안: ${d.drafter} ➜ 결재대기: ${d.nextApprover} ${d.nextTitle})`.trim();
  });
  const more = morningApprovalDocs.length > 5 ? `\n• 외 ${morningApprovalDocs.length - 5}건` : "";
  return lines.join("\n") + more;
};

// Live work logs
export const computeMorningWorkLogs = (prevDateInfo) => {
  const workLogs = getLocalWorkLogs() || [];
  let extrusionReports = [];
  try {
    extrusionReports = getLocalExtrusionReports() || [];
  } catch (e) {
    extrusionReports = [];
  }

  const pendingLogs = workLogs.filter((l) => !l.isDeleted && !l.deleted && l.approvalStatus !== "결재완료" && l.approvalStatus !== "반려");

  const { prevDayStr } = prevDateInfo;
  const normDateStr = (d) => String(d || "").slice(0, 10).replace(/[./]/g, "-");
  const normWorkerName = (name) => String(name || "").split(" ")[0].replace(/\([^)]*\)/g, "").trim();

  const prevDayLogs = workLogs.filter(
    (l) => !l.isDeleted && !l.deleted && (normDateStr(l.date) === prevDayStr || normDateStr(l.createdAt) === prevDayStr)
  );

  const prevDayExtrusion = extrusionReports.filter(
    (r) => !r.isDeleted && !r.deleted && (normDateStr(r.date) === prevDayStr || normDateStr(r.createdAt) === prevDayStr)
  );

  const registeredWriters = new Set();
  prevDayLogs.forEach((l) => {
    const w = normWorkerName(l.writer || l.author || l.userName || l.name);
    if (w) registeredWriters.add(w);
    if (l.sharedWorkers) {
      String(l.sharedWorkers).split(/[,/]/).forEach((sw) => {
        const subW = normWorkerName(sw);
        if (subW) registeredWriters.add(subW);
      });
    }
    if (l.coworkers) {
      String(l.coworkers).split(/[,/]/).forEach((sw) => {
        const subW = normWorkerName(sw);
        if (subW) registeredWriters.add(subW);
      });
    }
  });

  prevDayExtrusion.forEach((r) => {
    const mainW = normWorkerName(r.worker || r.author || r.writer);
    if (mainW) registeredWriters.add(mainW);
    if (r.subWorkers) {
      String(r.subWorkers).split(/[,/]/).forEach((sw) => {
        const subW = normWorkerName(sw);
        if (subW) registeredWriters.add(subW);
      });
    }
  });

  const leaves = getLocalAnnualLeaves() || [];
  const prevDayLeaves = leaves.filter((l) => {
    if (!l.startDate || l.isCompleted || l.isDismissed || l.isSharedRecipient || l.sharedBy) return false;
    // 🔒 [보안 원칙] 대표이사(권태형) 개인 일정 및 연차는 텔레그램 공용 브리핑 노출 절대 차단
    const uName = String(l.userName || l.name || "");
    if (uName.includes("권태형") || uName.includes("대표이사") || uName.includes("대표님") || uName.includes("대표")) return false;
    const start = l.startDate;
    const end = l.endDate || l.startDate;
    return start <= prevDayStr && prevDayStr <= end;
  });
  const onLeaveUsers = new Set(prevDayLeaves.map((l) => normWorkerName(l.userName)).filter(Boolean));

  const samTargetWorkers = ["설유철", "윤경수", "이창엽", "전재율", "양인나", "유동길", "조인주", "이상기"];
  const halTargetWorkers = ["오상민"];

  const isWorkerRegistered = (targetName) => {
    const t = normWorkerName(targetName);
    if (!t) return false;
    return Array.from(registeredWriters).some((w) => w.includes(t) || t.includes(w));
  };

  const isWorkerOnLeave = (targetName) => {
    const t = normWorkerName(targetName);
    if (!t) return false;
    return Array.from(onLeaveUsers).some((u) => u.includes(t) || t.includes(u));
  };

  const isWeekendOrHoliday = prevDateInfo?.prevDayWeekName === "토" || prevDateInfo?.prevDayWeekName === "일";
  const samUnregistered = isWeekendOrHoliday ? [] : samTargetWorkers.filter((name) => !isWorkerRegistered(name) && !isWorkerOnLeave(name));
  const halUnregistered = isWeekendOrHoliday ? [] : halTargetWorkers.filter((name) => !isWorkerRegistered(name) && !isWorkerOnLeave(name));
  const totalUnregistered = samUnregistered.length + halUnregistered.length;

  let pendingLineStr = "• <b>결재대기:</b> 없음 (전건 승인완료)";
  if (pendingLogs.length > 0) {
    const pLines = pendingLogs.slice(0, 5).map((l) => {
      const plantShort = l.plant?.includes("한림") ? "한림" : "삼랑진";
      const approver = l.approverName || (plantShort === "한림" ? "김동욱 책임" : "이명재 부장");
      return `  - ${plantShort} ${l.writer || "작업자"} (${l.process || "생산"}일지 ➜ 결재대기: ${approver})`;
    });
    const more = pendingLogs.length > 5 ? `\n  - 외 ${pendingLogs.length - 5}건` : "";
    pendingLineStr = `• <b>결재대기 (${pendingLogs.length}건):</b>\n${pLines.join("\n")}${more}`;
  }

  let unregisteredLineStr = "• <b>일지 미등록:</b> 없음 (전원 등록완료)";
  if (totalUnregistered > 0) {
    const uParts = [];
    if (samUnregistered.length > 0) {
      uParts.push(`  - 삼랑진: ${samUnregistered.join(", ")}`);
    }
    if (halUnregistered.length > 0) {
      uParts.push(`  - 한림: ${halUnregistered.join(", ")}`);
    }
    unregisteredLineStr = `• <b>일지 미등록 (${totalUnregistered}명):</b>\n${uParts.join("\n")}`;
  }

  const fullLines = `${pendingLineStr}\n${unregisteredLineStr}`;
  return { morningWorkLogs: pendingLogs, morningWorkLogLines: fullLines };
};

// Live active open issues
export const computeMorningOpenIssues = () => {
  const allUrgent = getLocalUrgentIssues();
  const isCeo = (item) => {
    const text = `${item.title || ""} ${item.content || ""} ${item.author || ""} ${item.manager || ""}`;
    return text.includes("권태형") || text.includes("대표이사") || text.includes("대표님") || text.includes("대표");
  };
  return allUrgent.filter(
    (i) => !i.isDeleted && !i.isResolved && (i.category === "오픈이슈" || i.category === "open_issue") && !isCeo(i)
  );
};

export const computeMorningOpenIssueLines = (morningOpenIssues) => {
  if (morningOpenIssues.length === 0) return "• 진행중인 오픈이슈 없음";
  const oLines = morningOpenIssues.map((o) => {
    const d = o.expireDate || o.targetDate || "";
    const dText = d ? `(~${formatMMDDWithWeekday(d)}) ` : "";
    const replyCount = o.replies?.length || 0;
    const hasUpdate = (replyCount > 0) || (typeof o.actionResult === "string" && o.actionResult.trim().length > 0) || Boolean(o.updatedAt && o.createdAt && o.updatedAt !== o.createdAt) || Boolean(o.isUpdated);
    const updateIcon = hasUpdate ? " 🔄" : "";
    const replyBadge = replyCount > 0 ? ` [의견 ${replyCount}건]` : "";
    let line = `• [오픈이슈] ${dText}${o.title || o.content} (${o.plant?.replace("공장", "") || "삼랑진"})${replyBadge}${updateIcon}`;

    if (Array.isArray(o.replies) && o.replies.length > 0) {
      const sortedReplies = [...o.replies].sort((a, b) => (a.actionDate || a.createdAt || "").localeCompare(b.actionDate || b.createdAt || ""));
      const lastRep = sortedReplies[sortedReplies.length - 1];
      const authorText = lastRep.author || "작업자";
      const titleText = lastRep.authorTitle ? ` ${lastRep.authorTitle}` : "";
      const contentText = (lastRep.content || lastRep.text || "내용 없음").replace(/\r?\n+/g, " ").trim();
      const repDate = lastRep.actionDate || lastRep.createdAt?.slice(0, 10);
      const repDateStr = repDate ? ` (${formatMMDDWithWeekday(repDate)})` : "";
      line += `\n  └ 💬 [최신의견] ${authorText}${titleText}: ${contentText}${repDateStr}`;
    }
    return line;
  });
  let text = oLines.slice(0, 5).join("\n");
  if (oLines.length > 5) text += `\n• 외 ${oLines.length - 5}건`;
  return text;
};

// Default Unified Message Generator
export const generateDefaultUnifiedMessage = ({
  unifiedMsgType,
  qualityStage,
  noticeMeetingType,
  approvalType,
  todayDateStr,
  currentProfile,
  morningAttendanceSamStr,
  morningAttendanceHanStr,
  morningApprovalDocs,
  morningWorkLogLines,
  morningOpenIssues,
  morningOpenIssueLines,
  prevDateInfo
}) => {
  const nowTime = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  if (unifiedMsgType === "briefing") {
    const dateFormattedStr = `${formatYYYYMMDDWithWeekday(todayDateStr)} 07:40 기준`;
    const samCompact = (morningAttendanceSamStr || "")
      .replace(/휴무 \(특근 없음\)/g, "휴무")
      .replace(/\/ 연차 0명/g, "| 연차 0")
      .replace(/명\s*\(/g, "명(")
      .replace(/명\s*\/\s*연차/g, "명 | 연차");
    const hanCompact = (morningAttendanceHanStr || "")
      .replace(/휴무 \(특근 없음\)/g, "휴무")
      .replace(/\/ 연차 0명/g, "| 연차 0")
      .replace(/명\s*\(/g, "명(")
      .replace(/명\s*\/\s*연차/g, "명 | 연차");

    let approvalCompact = "• 없음 (전건 결재완료) ✅";
    if (morningApprovalDocs && morningApprovalDocs.length > 0) {
      approvalCompact = `• 총 ${morningApprovalDocs.length}건 결재 대기 중`;
    }

    return `<b>⬛ [오륙 생산관리] 일일 모닝 요약</b>\n<b>${dateFormattedStr}</b>\n━━━━━━━━━━━━━━━━━━━━━\n👥 <b>[1] 전일 근태 (${prevDateInfo?.formatted || ""})</b>\n• 삼랑진: ${samCompact}\n• 한림: ${hanCompact}\n\n📑 <b>[2] 전자결재 미결 ${morningApprovalDocs && morningApprovalDocs.length > 0 ? `(${morningApprovalDocs.length}건)` : ""}</b>\n${approvalCompact}\n\n📝 <b>[3] 업무일지</b>\n${(morningWorkLogLines || "").includes("전원 등록완료") ? "• 전원 등록 및 결재 완료 ✅" : morningWorkLogLines}\n\n📌 <b>[4] 진행중 오픈이슈 ${morningOpenIssues && morningOpenIssues.length > 0 ? `(${morningOpenIssues.length}건)` : ""}</b>\n${morningOpenIssueLines}\n━━━━━━━━━━━━━━━━━━━━━\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
  }

  if (unifiedMsgType === "quality") {
    if (qualityStage === "1") {
      return `<b>🟥 [품질경보] 긴급 확인 및 점검 요망</b>\n━━━━━━━━━━━━━━━━━━━━━\n• <b>공장:</b> 삼랑진공장\n• <b>작성자:</b> <b>${currentProfile?.name || "이명재 이사"}</b>\n• <b>불량제목:</b> <b>[긴급] 소폭 원단 표면 이물 혼입 및 폭 치수 편차 발생</b>\n\n<b>[전달 내용]</b>\n압출 2라인 생산 중 폭 편차(±3mm 초과) 및 미세 흑점 이물 발견되어 즉시 점검 요망\n\n• <b>발령일시:</b> ${todayDateStr} ${nowTime}\n━━━━━━━━━━━━━━━━━━━━━\n※ 조치 완료 후 시스템에서 [조치결과]를 등록해 주세요.\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
    }
    if (qualityStage === "2") {
      return `<b>🟢 [품질경보 조치완료]</b>\n━━━━━━━━━━━━━━━━━━━━━\n• <b>공장:</b> 삼랑진공장\n• <b>불량제목:</b> <b>소폭 원단 표면 이물 혼입 및 폭 치수 편차</b>\n• <b>조치자:</b> <b>${currentProfile?.name || "이명재 이사"}</b>\n\n<b>[조치결과]</b>\n압출 2라인 다이스 클리닝 및 스크류 필터 80mesh 교체 완료, 치수 정상 범위 복구됨 (조치율 100%)\n\n• <b>조치일시:</b> ${todayDateStr} ${nowTime}\n━━━━━━━━━━━━━━━━━━━━━\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
    }
    return `<b>🟥 [품질경보 종결/삭제 알림]</b>\n━━━━━━━━━━━━━━━━━━━━━\n• <b>공장:</b> 삼랑진공장\n• <b>대상:</b> <b>소폭 원단 표면 이물 혼입 및 폭 치수 편차</b>\n• <b>삭제권한자:</b> <b>${currentProfile?.name || "이명재 이사"}</b>\n• <b>종결사유:</b> 현장 정상화 확인 및 최종 검사 통과로 종결 처리\n• <b>삭제일시:</b> ${todayDateStr} ${nowTime}\n━━━━━━━━━━━━━━━━━━━━━\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
  }

  if (unifiedMsgType === "notice_meeting") {
    if (noticeMeetingType === "notice") {
      return `<b>🟩 [사내 공지사항] 업무 협조 안내</b>\n━━━━━━━━━━━━━━━━━━━━━\n• <b>대상:</b> 삼랑진 / 한림 전 공장\n• <b>공지자:</b> <b>${currentProfile?.name || "이명재 이사"}</b>\n• <b>공지제목:</b> <b>현장 안전보호구 착용 및 정리정돈 협조 요청</b>\n\n<b>[공지 내용]</b>\n공장 내 안전화/보안경 착용 철저 및 작업 후 라인 청소 철저 협조 부탁드립니다.\n\n• <b>등록일시:</b> ${todayDateStr} ${nowTime}\n━━━━━━━━━━━━━━━━━━━━━\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
    }
    if (noticeMeetingType === "meeting") {
      return `<b>🟪 [사내 회의일정] 회의 및 일정 안내</b>\n━━━━━━━━━━━━━━━━━━━━━\n• <b>대상:</b> 삼랑진공장\n• <b>등록자:</b> <b>김동욱 책임</b>\n• <b>회의제목:</b> <b>2026년 9월 생산품질 향상 대책회의</b>\n\n<b>[회의 일정/안건]</b>\n일시: 오늘 14:00 (대회의실)\n안건: 생산 라인별 수율 개선 및 9월 납품계획 논의\n\n• <b>등록일시:</b> ${todayDateStr} ${nowTime}\n━━━━━━━━━━━━━━━━━━━━━\n※ 관련 작업자분들은 시스템에서 [회신]을 등록해 주세요.\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
    }
    if (noticeMeetingType === "meeting_result") {
      return `<b>🟪 [사내 회의결과 보고]</b>\n━━━━━━━━━━━━━━━━━━━━━\n• <b>대상:</b> 삼랑진공장\n• <b>회의제목:</b> <b>2026년 9월 생산품질 향상 대책회의</b>\n• <b>기록/작성자:</b> <b>김동욱 책임</b>\n\n<b>[회의 결과 및 결정사항]</b>\n1. 압출 라인 필터 교체 주기 2주 단축\n2. 불량 발생 시 즉시 생산 중단 및 알림 발령\n\n• <b>완료일시:</b> ${todayDateStr} ${nowTime}\n━━━━━━━━━━━━━━━━━━━━━\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
    }
    return `<b>🟪 [회의일정 회신 등록]</b>\n━━━━━━━━━━━━━━━━━━━━━\n• <b>회의:</b> <b>2026년 9월 생산품질 향상 대책회의</b> (삼랑진공장)\n• <b>회신자:</b> <b>${currentProfile?.name || "이명재"} [참석]</b>\n• <b>회신내용:</b> 회의 참석 및 품질 분석 자료 준비 완료\n• <b>회신일시:</b> ${todayDateStr} ${nowTime}\n━━━━━━━━━━━━━━━━━━━━━\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
  }

  // Approval / WorkLog
  if (approvalType === "draft") {
    return `<b>🟦 [전자결재 기안 상신]</b>\n----------------------------------------\n• <b>공장:</b> 삼랑진공장\n• <b>기안자:</b> 김동욱 책임\n• <b>결재제목:</b> <b>압출 2라인 다이스 및 스크류 보수 신청서</b>\n• <b>다음 결재자:</b> <b>${currentProfile?.name || "이명재 이사"}</b>\n• <b>일시:</b> ${todayDateStr} ${nowTime}\n----------------------------------------\n<a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>`;
  }
  if (approvalType === "approve") {
    return `<b>🟦 [전자결재 최종 승인 완료]</b>\n----------------------------------------\n• <b>공장:</b> 삼랑진공장\n• <b>기안자:</b> 김동욱 책임\n• <b>결재제목:</b> <b>압출 2라인 다이스 및 스크류 보수 신청서</b>\n• <b>승인자:</b> <b>권태형 대표이사</b>\n• <b>일시:</b> ${todayDateStr} ${nowTime}\n----------------------------------------\n<a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>`;
  }
  if (approvalType === "reject") {
    return `<b>🟦 [전자결재 반려 알림]</b>\n----------------------------------------\n• <b>공장:</b> 삼랑진공장\n• <b>기안자:</b> 김동욱 책임\n• <b>결재제목:</b> <b>자재 추가 구매 품의서</b>\n• <b>반려자:</b> <b>최미영 전무</b>\n• <b>반려사유:</b> 단가 재검토 및 대체 업체 비교견적 첨부 요망\n• <b>일시:</b> ${todayDateStr} ${nowTime}\n----------------------------------------\n<a href="https://profit-and-loss-7d09b.web.app">전자결재 바로가기</a>`;
  }
  return `<b>⬛ [일일업무일지 결재 승인]</b>\n----------------------------------------\n• <b>공장:</b> 삼랑진공장\n• <b>작성자:</b> 김동욱 책임 (생산)\n• <b>결재자:</b> <b>${currentProfile?.name || "이명재 이사"}</b>\n• <b>지시사항:</b> 수고하셨습니다. 익일 야간조 인수인계 철저\n• <b>업무일자:</b> ${todayDateStr}\n----------------------------------------\n<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>`;
};

// Default Management Message Generator
export const generateDefaultManagementMessage = ({
  managementMsgType,
  todayDateStr,
  todayCommonSchedules,
  totalSales,
  totalPurchases,
  costRatio,
  salesAchievementPct,
  purchaseAchievementPct,
  prevMonthKey,
  commonSchedsText,
  asOfUploadBadge,
  dateFormatted
}) => {
  if (managementMsgType === "today_schedule") {
    const todaySchedsList = [...(todayCommonSchedules || [])].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    const dateFormattedShort = getKSTFormattedString(todayDateStr).split(" ")[0]; // e.g. "2026.09.16(수)"
    
    const scheduleLines = todaySchedsList.length > 0 
      ? todaySchedsList.map((s, idx) => {
          const cat = getScheduleCategoryMeta(s.target);
          const timeDisplay = s.time && s.time !== "종일" ? `⏰ ${s.time}` : "🌅 종일";
          const authorText = s.author ? ` (${s.author})` : "";
          return `• <b>${idx + 1}. [${cat.badge}] ${timeDisplay}</b> - <b>${s.title || "사내 공통일정"}</b>${authorText}`;
        }).join("\n")
      : "• 오늘 예정된 공통일정이 없습니다.";

    return `✨ <b>𝕋𝕒𝕖𝕙𝕪𝕦𝕟𝕘 & 𝕄𝕚𝕪𝕠𝕦𝕟𝕘</b> ✨\n━━━━━━━━━━━━━━━━━━━━━\n🔔 <b>[당일 공통일정 리마인드 알림]</b> 🥂\n━━━━━━━━━━━━━━━━━━━━━\n📅 <b>기준일자:</b> <b>${dateFormattedShort}</b>\n\n<b>[오늘 예정된 공통일정 안내 (${todaySchedsList.length}건)]</b>\n${scheduleLines}\n\n💌 <i>"오늘 예정된 소중한 일정과 함께 뜻깊고 행복한 하루 되시길 바랍니다 ✨"</i>\n━━━━━━━━━━━━━━━━━━━━━\n📌 <a href="https://profit-and-loss-7d09b.web.app">공통일정 확인 및 의견등록 바로가기</a>`;
  }

  const salesAchTxt = `${salesAchievementPct}% (${Number(salesAchievementPct) >= 100 ? `▲ +${(Number(salesAchievementPct) - 100).toFixed(1)}% 초과` : `▼ ${(Number(salesAchievementPct) - 100).toFixed(1)}%`})`;
  const purchAchTxt = `${purchaseAchievementPct}% (${Number(purchaseAchievementPct) <= 100 ? `▼ ${(100 - Number(purchaseAchievementPct)).toFixed(1)}% 절감` : `▲ +${(Number(purchaseAchievementPct) - 100).toFixed(1)}% 증가`})`;

  return `<b>⬛ [오륙] 매출 & 일정공유</b>\n<b>${dateFormatted} 기준</b>\n━━━━━━━━━━━━━━━━━━━━━\n<b>[1] 당월 매입 / 매출 결산 현황${asOfUploadBadge || ""}</b>\n• <b>매출액:</b> ₩${Number(Math.round(totalSales)).toLocaleString()}원\n• <b>매입액:</b> ₩${Number(Math.round(totalPurchases)).toLocaleString()}원\n• <b>매출대비 원가율:</b> ${costRatio}%\n\n<b>[2] 전월 실적 대비 달성율</b> (${prevMonthKey?.split("-")[1] || "8"}월 실적 대비)\n• <b>전월대비 매출 달성율:</b> <b>${salesAchTxt}</b>\n• <b>전월대비 매입 달성율:</b> <b>${purchAchTxt}</b>\n\n<b>[3] 사내 공통일정</b>\n${commonSchedsText}\n━━━━━━━━━━━━━━━━━━━━━\n<a href="https://profit-and-loss-7d09b.web.app">손익관리시스템 바로가기</a>`;
};
