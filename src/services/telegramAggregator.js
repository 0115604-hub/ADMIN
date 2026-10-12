/**
 * 🌟 Central Telegram Aggregator & Data Verification Engine
 * 텔레그램 통합 취합 및 데이터 무결성 검증 엔진 (ADMIN 전용 모듈)
 * 
 * [핵심 역할]
 * 1. 로컬스토리지(localStorage) 의존 탈피: Firestore 클라우드 원천 DB 직접 1회 쿼리 (실시간성 보장)
 * 2. 5개사 근태 실적 완벽 일치: 대시보드 화면(작성전 / ✅완료)과 100% 동일한 집계 수치 산출
 * 3. 보안 게이트웨이: 대표이사(권태형) 관련 일정/연차/결재는 공용 텔레그램 노출 원천 차단
 * 4. 일목요연한 표준 브리핑 메시지 자동 조립
 */

import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import {
  getKSTDateString,
  getKSTFormattedString,
  formatYYYYMMDDWithWeekday,
  formatMMDDWithWeekday
} from "../utils/dateUtils";
import {
  cleanCompanyName,
  calculateDailySummary,
  COMPANIES,
  buildMatrixFromReports
} from "./overtimeSmartService";
import { INITIAL_SMART_OVERTIME_DATA } from "../data/masterOvertimeSmartData";

// Fallback Local Storage Loaders (오프라인/에러 시 안전 복구용)
import { getLocalAnnualLeaves } from "./annualLeaveService";
import { getLocalApprovalDocs } from "./approvalService";
import { getLocalWorkLogs } from "./workLogService";
import { getLocalUrgentIssues } from "./urgentIssueService";
import { getLocalSmartOvertimeData } from "./overtimeSmartService";
import { getLocalOvertimeReports } from "./overtimeService";
import { getLocalExtrusionReports } from "./extrusionProductionService";

/**
 * 🔒 [보안 원칙] 대표이사(권태형) 관련 모든 항목은 텔레그램 공용 브리핑 노출 절대 차단
 */
export const isCeoPrivateItem = (item) => {
  if (!item) return false;
  const approverNames = (item.approvers || []).map((a) => a?.name || "").join(" ");
  const stepNames = (item.steps || []).map((s) => s?.name || "").join(" ");
  const text = `${item.title || ""} ${item.content || ""} ${item.author || ""} ${item.manager || ""} ${item.speaker || ""} ${item.userName || ""} ${item.name || ""} ${item.drafter || ""} ${approverNames} ${stepNames} ${item.nextApprover || ""}`;
  return (
    text.includes("권태형") ||
    text.includes("대표이사") ||
    text.includes("대표님") ||
    text.includes("대표")
  );
};

/**
 * 🌐 Firestore 원천 데이터 실시간 직접 조회 (로컬 캐시 시차 문제 완전 해결)
 */
export const fetchDirectFirestoreContext = async (targetDateStr = null) => {
  const todayStr = targetDateStr || getKSTDateString();
  const [curY, curM] = todayStr.split("-").map(Number);
  const ymDocId = `overtime_${curY}_${String(curM).padStart(2, "0")}`;

  const context = {
    todayStr,
    smartMatrix: [],
    overtimeReports: [],
    approvals: [],
    workLogs: [],
    extrusionReports: [],
    annualLeaves: [],
    urgentIssues: []
  };

  if (!db) {
    // DB 비활성화 시 로컬 스토리지 폴백
    context.smartMatrix = getLocalSmartOvertimeData()?.attendanceMatrix || INITIAL_SMART_OVERTIME_DATA.attendanceMatrix;
    context.overtimeReports = getLocalOvertimeReports() || [];
    context.approvals = getLocalApprovalDocs() || [];
    context.workLogs = getLocalWorkLogs() || [];
    context.extrusionReports = getLocalExtrusionReports() || [];
    context.annualLeaves = getLocalAnnualLeaves() || [];
    context.urgentIssues = getLocalUrgentIssues() || [];
    return context;
  }

  try {
    // 1. 월간 스마트 근태 대장 조회
    try {
      const ledgerSnap = await getDoc(doc(db, "smart_overtime_ledger", ymDocId));
      if (ledgerSnap.exists() && Array.isArray(ledgerSnap.data().attendanceMatrix)) {
        context.smartMatrix = ledgerSnap.data().attendanceMatrix;
      } else {
        context.smartMatrix = getLocalSmartOvertimeData()?.attendanceMatrix || INITIAL_SMART_OVERTIME_DATA.attendanceMatrix;
      }
    } catch (e) {
      console.warn("[TelegramAggregator] Ledger fetch failed, using fallback:", e);
      context.smartMatrix = getLocalSmartOvertimeData()?.attendanceMatrix || INITIAL_SMART_OVERTIME_DATA.attendanceMatrix;
    }

    // 2. 일일 근태/특근 보고서
    try {
      const repSnap = await getDocs(collection(db, "overtime_reports"));
      const reps = [];
      repSnap.forEach((d) => reps.push({ id: d.id, ...d.data() }));
      context.overtimeReports = reps.length > 0 ? reps : (getLocalOvertimeReports() || []);
    } catch (e) {
      context.overtimeReports = getLocalOvertimeReports() || [];
    }

    // 3. 전자결재 문서
    try {
      const apprSnap = await getDocs(collection(db, "approvals"));
      const apps = [];
      apprSnap.forEach((d) => apps.push({ id: d.id, ...d.data() }));
      context.approvals = apps.length > 0 ? apps : (getLocalApprovalDocs() || []);
    } catch (e) {
      context.approvals = getLocalApprovalDocs() || [];
    }

    // 4. 일반 업무일지
    try {
      const logSnap = await getDocs(collection(db, "work_logs"));
      const logs = [];
      logSnap.forEach((d) => logs.push({ id: d.id, ...d.data() }));
      context.workLogs = logs.length > 0 ? logs : (getLocalWorkLogs() || []);
    } catch (e) {
      context.workLogs = getLocalWorkLogs() || [];
    }

    // 5. 압출 작업일보
    try {
      const extSnap = await getDocs(collection(db, "extrusion_reports"));
      const exts = [];
      extSnap.forEach((d) => exts.push({ id: d.id, ...d.data() }));
      context.extrusionReports = exts.length > 0 ? exts : (getLocalExtrusionReports() || []);
    } catch (e) {
      context.extrusionReports = getLocalExtrusionReports() || [];
    }

    // 6. 연차/휴가
    try {
      const leaveSnap = await getDocs(collection(db, "annual_leaves"));
      const lvs = [];
      leaveSnap.forEach((d) => lvs.push({ id: d.id, ...d.data() }));
      context.annualLeaves = lvs.length > 0 ? lvs : (getLocalAnnualLeaves() || []);
    } catch (e) {
      context.annualLeaves = getLocalAnnualLeaves() || [];
    }

    // 7. 오픈이슈 / 회의 / 품질경보 / 공지사항
    try {
      const issueSnap = await getDocs(collection(db, "urgent_issues"));
      const iss = [];
      issueSnap.forEach((d) => iss.push({ id: d.id, ...d.data() }));
      context.urgentIssues = iss.length > 0 ? iss : (getLocalUrgentIssues() || []);
    } catch (e) {
      context.urgentIssues = getLocalUrgentIssues() || [];
    }
  } catch (err) {
    console.error("[TelegramAggregator] Global fetch error:", err);
  }

  return context;
};

/**
 * 📅 전일 근무일(직전 영업일) 계산 헬퍼
 */
export const getPreviousWorkDayInfo = (todayStr) => {
  const [curY, curM, curD] = todayStr.split("-").map(Number);
  const curDateObj = new Date(curY, curM - 1, curD);
  const dayOfWeek = curDateObj.getDay();
  let daysBack = 1;
  if (dayOfWeek === 1) daysBack = 2; // 월요일이면 토요일
  else if (dayOfWeek === 0) daysBack = 1; // 일요일이면 토요일
  const prevDateObj = new Date(curDateObj);
  prevDateObj.setDate(curDateObj.getDate() - daysBack);

  const prevDayStr = `${prevDateObj.getFullYear()}-${String(prevDateObj.getMonth() + 1).padStart(2, "0")}-${String(prevDateObj.getDate()).padStart(2, "0")}`;
  const prevDayNum = prevDateObj.getDate();
  const prevDayWeekName = ["일", "월", "화", "수", "목", "금", "토"][prevDateObj.getDay()];
  const prevDateFormatted = `${prevDateObj.getMonth() + 1}월 ${prevDayNum}일(${prevDayWeekName})`;
  const isWeekendOrHoliday = prevDateObj.getDay() === 0 || prevDateObj.getDay() === 6;

  return { prevDayStr, prevDayNum, prevDayWeekName, prevDateFormatted, isWeekendOrHoliday };
};

/**
 * ☀️ [1] 일일 모닝 브리핑 문안 취합 빌더
 */
export const buildDailyMorningBriefingText = async (targetDateStr = null, customTimeStr = null) => {
  const todayStr = targetDateStr || getKSTDateString();
  const ctx = await fetchDirectFirestoreContext(todayStr);
  const now = new Date();
  const timeStr = customTimeStr || (now.getHours() < 8 ? "07:40" : `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
  const dateFormatted = `${formatYYYYMMDDWithWeekday(todayStr)} ${timeStr} 기준`;

  const { prevDayStr, prevDayNum, prevDateFormatted, isWeekendOrHoliday } = getPreviousWorkDayInfo(todayStr);

  // --- 1. 전일 연차 집계 (대표이사 차단) ---
  const prevDayLeaves = (ctx.annualLeaves || []).filter((l) => {
    if (!l.startDate || l.isCompleted || l.isDismissed || l.isSharedRecipient || l.sharedBy) return false;
    if (isCeoPrivateItem(l)) return false;
    const start = l.startDate;
    const end = l.endDate || l.startDate;
    return start <= prevDayStr && prevDayStr <= end;
  });

  const samPrevLeaves = prevDayLeaves.filter((l) => !l.plant?.includes("한림"));
  const hanPrevLeaves = prevDayLeaves.filter((l) => l.plant?.includes("한림"));
  const samLeaveDetailStr = samPrevLeaves.length > 0 ? ` (${samPrevLeaves.map((l) => `${l.userName} ${l.title || "선임"}`).join(", ")})` : "";
  const hanLeaveDetailStr = hanPrevLeaves.length > 0 ? ` (${hanPrevLeaves.map((l) => `${l.userName} ${l.title || "선임"}`).join(", ")})` : "";

  // --- 2. 전일 근태 실적 집계 (삼랑진 / 한림) ---
  const prevDayOtReports = (ctx.overtimeReports || []).filter((r) => !r.isDeleted && !r.deleted && r.workDate === prevDayStr);

  let samStr = "";
  let hanStr = "";

  if (isWeekendOrHoliday || prevDayOtReports.length > 0) {
    // 특근일: 특근보고서 기준 집계
    const samOtList = prevDayOtReports.filter((r) => r.plant?.includes("삼랑진") || ["오륙", "유성"].includes(cleanCompanyName(r.company)));
    const hanOtList = prevDayOtReports.filter((r) => r.plant?.includes("한림") || ["조영", "한울", "부림텍", "조영산업"].includes(cleanCompanyName(r.company)));

    const samOtCount = samOtList.reduce((sum, r) => sum + Number(r.headcount || r.totalWorkers || 0), 0);
    const hanOtCount = hanOtList.reduce((sum, r) => sum + Number(r.headcount || r.totalWorkers || 0), 0);

    const samBreakdown = samOtList.map((r) => `${cleanCompanyName(r.company)} ${r.headcount || r.totalWorkers || 0}명`).join(", ");
    const hanBreakdown = hanOtList.map((r) => `${cleanCompanyName(r.company)} ${r.headcount || r.totalWorkers || 0}명`).join(", ");

    samStr = samOtCount > 0
      ? `특근 ${samOtCount}명${samBreakdown ? ` (${samBreakdown})` : ""} / 연차 ${samPrevLeaves.length}명${samLeaveDetailStr}`
      : `휴무 (특근 없음) / 연차 ${samPrevLeaves.length}명${samLeaveDetailStr}`;

    hanStr = hanOtCount > 0
      ? `특근 ${hanOtCount}명${hanBreakdown ? ` (${hanBreakdown})` : ""} / 연차 ${hanPrevLeaves.length}명${hanLeaveDetailStr}`
      : `휴무 (특근 없음) / 연차 ${hanPrevLeaves.length}명${hanLeaveDetailStr}`;
  } else {
    // 평일 정규 근무일: 스마트 대장 Matrix 집계
    let samAtt = 0, samReg = 0, sam19 = 0, sam21 = 0, sam22 = 0, samSpec = 0, samNight = 0;
    let hanAtt = 0, hanReg = 0, han19 = 0, han21 = 0, han22 = 0, hanSpec = 0, hanNight = 0;

    (ctx.smartMatrix || []).forEach((w) => {
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

    samStr = samAtt > 0
      ? `출근 ${samAtt}명${samOtBreakdown} / 연차 ${samPrevLeaves.length}명${samLeaveDetailStr}`
      : `휴무 / 연차 ${samPrevLeaves.length}명${samLeaveDetailStr}`;

    hanStr = hanAtt > 0
      ? `출근 ${hanAtt}명${hanOtBreakdown} / 연차 ${hanPrevLeaves.length}명${hanLeaveDetailStr}`
      : `휴무 / 연차 ${hanPrevLeaves.length}명${hanLeaveDetailStr}`;
  }

  // --- 3. 전일 전자결재 미결 (대표이사 차단) ---
  const pendingDocsList = (ctx.approvals || [])
    .filter((d) => !d.isDeleted && !d.deleted && (d.status === "IN_PROGRESS" || d.status === "HOLD") && !isCeoPrivateItem(d))
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
    .filter((d) => !d.nextApprover.includes("권태형") && !d.nextApprover.includes("대표"))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  let approvalDocLines = "• 없음 (전건 결재완료)";
  if (pendingDocsList.length > 0) {
    const lines = pendingDocsList.slice(0, 5).map((d) => {
      return `• ${d.title} (기안: ${d.drafter} ➜ 결재대기: ${d.nextApprover} ${d.nextTitle})`.trim();
    });
    const more = pendingDocsList.length > 5 ? `\n• 외 ${pendingDocsList.length - 5}건` : "";
    approvalDocLines = lines.join("\n") + more;
  }

  // --- 4. 전일 업무일지 미결 & 미등록 ---
  const normDateStr = (d) => String(d || "").slice(0, 10).replace(/[./]/g, "-");
  const normWorkerName = (name) => String(name || "").split(" ")[0].replace(/\([^)]*\)/g, "").trim();

  const pendingLogs = (ctx.workLogs || []).filter(
    (l) => !l.isDeleted && !l.deleted && l.approvalStatus !== "결재완료" && l.approvalStatus !== "반려" && !isCeoPrivateItem(l)
  );

  const prevDayWorkLogs = (ctx.workLogs || []).filter(
    (l) => !l.isDeleted && !l.deleted && (normDateStr(l.date) === prevDayStr || normDateStr(l.createdAt) === prevDayStr)
  );
  const prevDayExtrusionReports = (ctx.extrusionReports || []).filter(
    (r) => !r.isDeleted && !r.deleted && (normDateStr(r.date) === prevDayStr || normDateStr(r.createdAt) === prevDayStr)
  );

  const registeredWriters = new Set();
  prevDayWorkLogs.forEach((l) => {
    const wName = normWorkerName(l.writer || l.author || l.userName || l.name);
    if (wName) registeredWriters.add(wName);
    if (l.sharedWorkers) {
      String(l.sharedWorkers).split(/[,/]/).forEach((sw) => {
        const subW = normWorkerName(sw);
        if (subW) registeredWriters.add(subW);
      });
    }
  });

  prevDayExtrusionReports.forEach((r) => {
    const mainWorker = normWorkerName(r.worker || r.author || r.writer);
    if (mainWorker) registeredWriters.add(mainWorker);
    if (r.subWorkers) {
      String(r.subWorkers).split(/[,/]/).forEach((sw) => {
        const subW = normWorkerName(sw);
        if (subW) registeredWriters.add(subW);
      });
    }
  });

  const onLeaveUsers = new Set(prevDayLeaves.map((l) => normWorkerName(l.userName)).filter(Boolean));
  const samTargetWorkers = ["설유철", "윤경수", "이창엽", "전재율", "양인나", "유동길", "조인주", "이상기"];
  const halTargetWorkers = ["오상민", "정현규"];

  const isWorkerRegistered = (tName) => {
    const t = normWorkerName(tName);
    return t ? Array.from(registeredWriters).some((w) => w.includes(t) || t.includes(w)) : false;
  };
  const isWorkerOnLeave = (tName) => {
    const t = normWorkerName(tName);
    return t ? Array.from(onLeaveUsers).some((u) => u.includes(t) || t.includes(u)) : false;
  };

  const samUnregistered = isWeekendOrHoliday ? [] : samTargetWorkers.filter((n) => !isWorkerRegistered(n) && !isWorkerOnLeave(n));
  const halUnregistered = isWeekendOrHoliday ? [] : halTargetWorkers.filter((n) => !isWorkerRegistered(n) && !isWorkerOnLeave(n));
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
    if (samUnregistered.length > 0) uParts.push(`  - 삼랑진: ${samUnregistered.join(", ")}`);
    if (halUnregistered.length > 0) uParts.push(`  - 한림: ${halUnregistered.join(", ")}`);
    unregisteredLineStr = `• <b>일지 미등록 (${totalUnregistered}명):</b>\n${uParts.join("\n")}`;
  }
  const workLogLines = `${pendingLineStr}\n${unregisteredLineStr}`;

  // --- 5. 진행중인 오픈이슈 (대표이사 차단) ---
  const activeOpenIssues = (ctx.urgentIssues || []).filter(
    (i) => !i.isDeleted && !i.isResolved && (i.category === "오픈이슈" || i.category === "open_issue") && !isCeoPrivateItem(i)
  ).sort((a, b) => {
    const dateA = a.expireDate || a.targetDate || "9999-99-99";
    const dateB = b.expireDate || b.targetDate || "9999-99-99";
    return dateA !== dateB ? dateA.localeCompare(dateB) : (a.createdAt || "").localeCompare(b.createdAt || "");
  });

  let openIssueLines = "• 진행중인 오픈이슈 없음";
  if (activeOpenIssues.length > 0) {
    const oLines = activeOpenIssues.map((o) => {
      const d = o.expireDate || o.targetDate || "";
      const dText = d ? `(~${formatMMDDWithWeekday(d)}) ` : "";
      const replyCount = o.replies?.length || 0;
      const replyBadge = replyCount > 0 ? ` [의견 ${replyCount}건]` : "";
      let line = `• [오픈이슈] ${dText}${o.title || o.content} (${o.plant?.replace("공장", "") || "삼랑진"})${replyBadge}`;
      if (Array.isArray(o.replies) && o.replies.length > 0) {
        const sortedReplies = [...o.replies].sort((a, b) => (a.actionDate || a.createdAt || "").localeCompare(b.actionDate || b.createdAt || ""));
        const lastRep = sortedReplies[sortedReplies.length - 1];
        const aText = lastRep.author || "작업자";
        const tText = lastRep.authorTitle ? ` ${lastRep.authorTitle}` : "";
        const cText = (lastRep.content || lastRep.text || "내용 없음").replace(/\r?\n+/g, " ").trim();
        line += `\n  └ 💬 ${aText}${tText}: ${cText}`;
      }
      return line;
    });
    openIssueLines = oLines.slice(0, 5).join("\n") + (oLines.length > 5 ? `\n• 외 ${oLines.length - 5}건` : "");
  }

  // --- 6. 회의 & 사내공지 (대표이사 차단) ---
  const upcomingMeetings = (ctx.urgentIssues || []).filter(
    (i) => !i.isDeleted && i.category === "회의일정" && (i.expireDate || i.targetDate || i.createdAt?.slice(0, 10)) >= todayStr && !isCeoPrivateItem(i)
  );
  const activeNotices = (ctx.urgentIssues || []).filter(
    (i) => !i.isDeleted && (i.category === "공지사항" || i.category === "사내공지" || i.category === "공유사항") && (!i.expireDate || i.expireDate >= todayStr) && !isCeoPrivateItem(i)
  );

  let noticeMeetingLines = "• 예정된 회의 및 공지사항 없음";
  const combined = [];
  upcomingMeetings.forEach((m) => {
    const d = m.expireDate || m.targetDate || m.createdAt?.slice(0, 10) || "";
    const t = m.meetingTime ? ` ${m.meetingTime}` : "";
    const dText = d ? `${formatMMDDWithWeekday(d)}${t} ` : "";
    let mLine = `• [회의] ${dText}${m.title || m.content} (${m.plant?.replace("공장", "") || "삼랑진"})`;
    combined.push({ sortKey: `${d} ${m.meetingTime || "00:00"}`, text: mLine });
  });
  activeNotices.forEach((n) => {
    const d = n.expireDate || n.targetDate || "";
    const dText = d ? `~${formatMMDDWithWeekday(d)} ` : "";
    combined.push({ sortKey: `${d || "9999-99-99"} 23:59`, text: `• [공지] ${dText}${n.title || n.content}` });
  });
  if (combined.length > 0) {
    combined.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    noticeMeetingLines = combined.slice(0, 5).map((c) => c.text).join("\n") + (combined.length > 5 ? `\n• 외 ${combined.length - 5}건` : "");
  }

  return `
<b>⬛ [오륙 생산관리] 일일 모닝 브리핑</b>
<b>${dateFormatted}</b>
━━━━━━━━━━━━━━━━━━━━━
👥 <b>[1] 전일 근태실적 (${prevDateFormatted} 기준)</b>
• 삼랑진: ${samStr}
• 한림: ${hanStr}

📑 <b>[2] 전일 전자결재 미결 ${pendingDocsList.length > 0 ? `(${pendingDocsList.length}건)` : ""}</b>
${approvalDocLines}

📝 <b>[3] 전일 업무일지 미결 & 미등록</b>
${workLogLines}

📌 <b>[4] 진행중인 오픈이슈 ${activeOpenIssues.length > 0 ? `(${activeOpenIssues.length}건)` : ""}</b>
${openIssueLines}

📅 <b>[5] 회의 & 사내공지 ${combined.length > 0 ? `(${combined.length}건)` : ""}</b>
${noticeMeetingLines}
━━━━━━━━━━━━━━━━━━━━━
※ 미결된 결재 및 일지는 금일 오전 중 확인 부탁드립니다.
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();
};

/**
 * 🌙 [2] 일일 마감 브리핑 문안 취합 빌더
 */
export const buildDailyClosingBriefingText = async (targetDateStr = null) => {
  const targetDate = targetDateStr || getKSTDateString();
  const ctx = await fetchDirectFirestoreContext(targetDate);
  const dateFormatted = `${getKSTFormattedString(targetDate).split(" ")[0]}`;

  // 1. 품질경보 변동
  const qualityAlerts = (ctx.urgentIssues || []).filter((i) => {
    if (i.category !== "품질경보" || isCeoPrivateItem(i)) return false;
    const isToday = i.createdAt?.startsWith(targetDate) || i.startDate === targetDate || i.actionAt?.startsWith(targetDate) || i.deletedAt?.startsWith(targetDate);
    const isUnresolved = !i.isDeleted && !i.isResolved;
    return isToday || isUnresolved;
  });

  let qualityLines = " • 금일 신규 등록 및 변동사항 없음 (정상 가동)";
  if (qualityAlerts.length > 0) {
    qualityLines = qualityAlerts.map((q) => {
      const plant = q.plant ? q.plant.replace("공장", "") : "삼랑진";
      const title = q.title || q.content || "품질경보";
      const statusText = q.isDeleted ? "🛑 종결/삭제" : q.isResolved ? "✅ 조치완료" : "⏳ 조치대기";
      return ` • [${plant}] ${title} (상태: ${statusText})`;
    }).join("\n");
  }

  // 2. 회의일정 변동 및 결과
  const meetings = (ctx.urgentIssues || []).filter((i) => {
    if (i.category !== "회의일정" || isCeoPrivateItem(i)) return false;
    const mDate = i.expireDate || i.targetDate || i.createdAt?.slice(0, 10);
    return mDate === targetDate || i.createdAt?.startsWith(targetDate) || i.actionAt?.startsWith(targetDate);
  });

  let meetingLines = " • 금일 회의일정 및 변동사항 없음";
  if (meetings.length > 0) {
    meetingLines = meetings.map((m) => {
      const plant = m.plant ? m.plant.replace("공장", "") : "삼랑진";
      const title = m.title || m.content || "회의";
      const statusText = m.isDeleted ? "🛑 취소" : m.isResolved ? "✅ 종결" : "⏳ 진행";
      return ` • [${plant}] ${title} (결과: ${statusText})`;
    }).join("\n");
  }

  // 3. 사내공지
  const notices = (ctx.urgentIssues || []).filter((i) => {
    const isNotice = i.category === "공지사항" || i.category === "사내공지" || i.category === "공유사항";
    return isNotice && !isCeoPrivateItem(i) && (!i.expireDate || i.expireDate >= targetDate);
  });

  let noticeLines = " • 금일 신규 등록 및 변동 공지 없음";
  if (notices.length > 0) {
    noticeLines = notices.slice(0, 3).map((n) => {
      const plant = n.plant === "본사" || !n.plant ? "공통" : n.plant.replace("공장", "");
      return ` • [${plant}] ${n.title || n.content}`;
    }).join("\n");
  }

  return `
<b>🌙 [오륙 생산관리] 일일 업무 마감 브리핑</b>
<b>📅 ${dateFormatted}</b>
━━━━━━━━━━━━━━━━━━━━━
🚨 <b>[1] 금일 품질경보 발생 및 조치현황</b>
${qualityLines}

📋 <b>[2] 금일 회의 진행 및 결정사항</b>
${meetingLines}

📢 <b>[3] 사내 공지사항 및 공유사항</b>
${noticeLines}
━━━━━━━━━━━━━━━━━━━━━
※ 금일 생산 실적 및 전자결재 마감 현황을 확인해주세요.
<a href="https://profit-and-loss-7d09b.web.app">생산관리시스템 바로가기</a>
`.trim();
};
