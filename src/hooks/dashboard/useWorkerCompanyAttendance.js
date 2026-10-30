import { useState, useEffect, useMemo, useCallback } from "react";
import {
  getLocalSmartOvertimeData,
  calculateDailySummary,
  subscribeSmartOvertimeData,
  cleanCompanyName,
  getReportDateSortKey,
  reconcileMatrixWithReports
} from "../../services/overtimeSmartService.js";
import {
  getLocalApprovalDocs,
  subscribeApprovalDocs,
  isApprovalDocPending
} from "../../services/approvalService";
import {
  getLocalOvertimeReports,
  subscribeOvertimeReports,
  isWeekendByDate
} from "../../services/overtimeService";
import { getKSTDateString } from "../../utils/dateUtils";
import { getExtrusionSummaryData } from "../../components/dashboard/worker/workerDashboardConstants";

/**
 * useWorkerCompanyAttendance
 * Manages 5-company smart overtime ledger, attendance stats, approval docs,
 * pending approval cards, and extrusion line downtime summary.
 */
export function useWorkerCompanyAttendance({
  currentProfile,
  isAdmin,
  isMyeongjae,
  isDongwook,
  isPartnerProfile,
  isHanulManager,
  isHanul,
  isBurimtechManager,
  isBurimtech,
  isYuseongManager
}) {
  // Extrusion 4-Lines Downtime Summary (실시간 업로드 데이터 연동)
  const [extrusionSummaryList, setExtrusionSummaryList] = useState(() => getExtrusionSummaryData());

  useEffect(() => {
    const refreshExtrusionData = () => {
      setExtrusionSummaryList(getExtrusionSummaryData());
    };
    window.addEventListener("storage", refreshExtrusionData);
    window.addEventListener("focus", refreshExtrusionData);
    window.addEventListener("extrusion-data-updated", refreshExtrusionData);
    return () => {
      window.removeEventListener("storage", refreshExtrusionData);
      window.removeEventListener("focus", refreshExtrusionData);
      window.removeEventListener("extrusion-data-updated", refreshExtrusionData);
    };
  }, []);

  // 5 Company Smart Overtime Ledger & Reports Subscription (항상 실시간 KST 당월 기준)
  const [smartOvertimeData, setSmartOvertimeData] = useState(() => {
    const todayYM = getKSTDateString().slice(0, 7);
    return getLocalSmartOvertimeData(todayYM);
  });
  const [overtimeReports, setOvertimeReports] = useState(() => getLocalOvertimeReports());

  useEffect(() => {
    const todayYM = getKSTDateString().slice(0, 7);
    setSmartOvertimeData(getLocalSmartOvertimeData(todayYM));
    const unsubSmart = subscribeSmartOvertimeData((data) => {
      if (data && data.attendanceMatrix) {
        setSmartOvertimeData(data);
      }
    }, todayYM);
    const unsubReports = subscribeOvertimeReports((reports) => {
      setOvertimeReports(reports || []);
    });
    const handleOvertimeUpdated = (e) => {
      if (e.detail?.reports) {
        setOvertimeReports(e.detail.reports);
      } else {
        setOvertimeReports(getLocalOvertimeReports());
      }
    };
    window.addEventListener("oryuk_overtime_reports_updated", handleOvertimeUpdated);
    return () => {
      unsubSmart();
      unsubReports();
      window.removeEventListener("oryuk_overtime_reports_updated", handleOvertimeUpdated);
    };
  }, []);

  // 당일 작성여부 및 미작성 업체 계산 (보고서와 대장 실시간 통합)
  const { companyOverviewStats, unwrittenCompanies } = useMemo(() => {
    const rawMatrix = smartOvertimeData?.attendanceMatrix || [];
    const todayStr = getKSTDateString();
    const todayParts = todayStr.split("-");
    const todayDayNum = todayParts.length === 3 ? parseInt(todayParts[2], 10) : new Date().getDate();
    const todayYear = todayParts.length === 3 ? parseInt(todayParts[0], 10) : 2026;
    const todayMonth = todayParts.length === 3 ? parseInt(todayParts[1], 10) : 10;

    // 10월 이후는 smart_overtime_ledger가 단일 원천이므로 과거 보고서 보정(reconcile)을 거치지 않음
    const isNewArchitecture = todayYear > 2026 || (todayYear === 2026 && todayMonth >= 10);
    const matrix = isNewArchitecture
      ? rawMatrix
      : (reconcileMatrixWithReports(rawMatrix, overtimeReports || [], todayYear, todayMonth).matrix || rawMatrix);

    const daily = calculateDailySummary(matrix, todayDayNum, todayYear, todayMonth);
    const companyStyles = {
      "오륙": { dot: "bg-blue-500", borderHover: "hover:border-blue-400 dark:hover:border-blue-500", badgeColor: "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800" },
      "유성": { dot: "bg-cyan-500", borderHover: "hover:border-cyan-400 dark:hover:border-cyan-500", badgeColor: "text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-800" },
      "조영": { dot: "bg-purple-500", borderHover: "hover:border-purple-400 dark:hover:border-purple-500", badgeColor: "text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 border-purple-200 dark:border-purple-800" },
      "한울": { dot: "bg-emerald-500", borderHover: "hover:border-emerald-400 dark:hover:border-emerald-500", badgeColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800" },
      "부림텍": { dot: "bg-amber-500", borderHover: "hover:border-amber-400 dark:hover:border-amber-500", badgeColor: "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800" }
    };

    // 순서 표준화: 오륙 -> 유성 -> 조영 -> 한울 -> 부림텍
    const companies = ["오륙", "유성", "조영", "한울", "부림텍"].map((name) => {
      const styles = companyStyles[name] || companyStyles["오륙"];
      const cleanCompName = cleanCompanyName(name);
      const b = daily?.companyBreakdown?.[cleanCompName] || daily?.companyBreakdown?.[name];
      const compWorkers = matrix.filter((w) => cleanCompanyName(w.company) === cleanCompName);

      // 당일 원장 상의 근태 입력 인원수 (단일 진실 원천: 사용자가 당일 셀에 직접 근태를 등록한 경우만 인정)
      const enteredCount = compWorkers.filter((w) => {
        const v = (w.daily && (w.daily[todayDayNum] !== undefined ? w.daily[todayDayNum] : w.daily[String(todayDayNum)])) ?? w[todayDayNum] ?? w[String(todayDayNum)];
        const str = String(v ?? "").trim();
        return str !== "" && str !== "미입력" && str !== "-" && str !== "undefined" && str !== "null";
      }).length;

      // 1단계 결재 상태 확인 (APPROVED: 마감, SUBMITTED: 상신대기, DRAFT: 작성중)
      const approvalKey = `${cleanCompName}_${todayDayNum}`;
      const approvalInfo = smartOvertimeData?.companyApprovalStatus?.[approvalKey] || {};
      const approvalStatus = approvalInfo.status || "DRAFT";

      // 🌟 [강력한 원칙]: 사용자가 실제 당일 근태를 1명 이상 입력했거나 실제 결재 승인/상신이 들어간 경우에만 작성후로 인정
      // - 작업자가 0명 등록 상태인데 과거 캐시, 더미 카운트, 레거시 보고서 잔여물 등으로 '작성후'로 오인되는 취약 구문 완전 영구 제거
      const isApproved = enteredCount > 0 && approvalStatus === "APPROVED";
      const isSubmitted = enteredCount > 0 && approvalStatus === "SUBMITTED";
      const isWritten = enteredCount > 0;
      const shortName = name.replace(/[()주]/g, "");

      const workers = b?.total && b.total > 0 ? b.total : compWorkers.length;
      const attended = b && b.attended !== undefined ? b.attended : enteredCount;
      const absent = b && b.absent !== undefined ? b.absent : Math.max(0, workers - attended);
      const otWorkers = b && b.otWorkers !== undefined ? b.otWorkers : 0;
      const otHours = b && b.otHours !== undefined ? b.otHours : 0;
      const totalHours = b && b.totalHours !== undefined ? b.totalHours : (attended * 8 + otHours);

      const statusBadgeText = isWritten ? "작성후" : "작성전";
      const statusBadgeClass = isWritten
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/50 font-black"
        : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/50 font-bold";

      return {
        name,
        shortName,
        isWritten,
        isApproved,
        isSubmitted,
        approvalStatus,
        statusBadgeText,
        statusBadgeClass,
        workers,
        attended,
        absent,
        otWorkers,
        otHours,
        totalHours,
        dot: styles.dot,
        borderHover: styles.borderHover,
        badgeColor: styles.badgeColor,
        isTotal: false
      };
    });

    const unwritten = (Array.isArray(companies) ? companies : []).filter((c) => !c.isWritten);

    return {
      companyOverviewStats: companies,
      unwrittenCompanies: unwritten
    };
  }, [smartOvertimeData, overtimeReports]);

  // 관리자별 맞춤 근태현황: 본인 소속사 우선 정렬
  const filteredCompanyOverviewStats = useMemo(() => {
    if (!companyOverviewStats || companyOverviewStats.length === 0) return [];

    if (isHanulManager || isHanul) {
      const myComp = companyOverviewStats.find((c) => c.name === "한울" || c.shortName === "한울");
      const others = companyOverviewStats.filter((c) => c !== myComp);
      return [myComp, ...others].filter(Boolean);
    }
    if (isBurimtechManager || isBurimtech) {
      const myComp = companyOverviewStats.find((c) => c.name === "부림텍" || c.shortName === "부림텍");
      const others = companyOverviewStats.filter((c) => c !== myComp);
      return [myComp, ...others].filter(Boolean);
    }
    if (isYuseongManager) {
      const myComp = companyOverviewStats.find((c) => c.name === "유성" || c.shortName === "유성");
      const others = companyOverviewStats.filter((c) => c !== myComp);
      return [myComp, ...others].filter(Boolean);
    }

    return companyOverviewStats;
  }, [companyOverviewStats, isHanulManager, isHanul, isBurimtechManager, isBurimtech, isYuseongManager]);

  const filteredUnwrittenCompanies = useMemo(() => {
    return unwrittenCompanies || [];
  }, [unwrittenCompanies]);

  const [approvalDocs, setApprovalDocs] = useState(() => getLocalApprovalDocs());

  useEffect(() => {
    const unsub = subscribeApprovalDocs((docs) => {
      setApprovalDocs(docs);
    });
    const handleApprovalUpdated = (e) => {
      if (e.detail?.docs) {
        setApprovalDocs(e.detail.docs);
      } else {
        setApprovalDocs(getLocalApprovalDocs());
      }
    };
    window.addEventListener("oryuk_approval_document_updated", handleApprovalUpdated);
    return () => {
      unsub();
      window.removeEventListener("oryuk_approval_document_updated", handleApprovalUpdated);
    };
  }, []);

  const pendingCount = useMemo(() => {
    return approvalDocs.filter((d) => isApprovalDocPending(d, currentProfile, isAdmin)).length;
  }, [approvalDocs, currentProfile, isAdmin]);

  const holdCount = useMemo(() => approvalDocs.filter((d) => d.status === "HOLD").length, [approvalDocs]);

  // Plant-specific approval authority
  const canApproveSamrangjin = isMyeongjae || (currentProfile?.plant === "삼랑진공장" && currentProfile?.assignedProcess === "총괄관리") || isAdmin;
  const canApproveHallim = isDongwook || (currentProfile?.plant === "한림공장" && currentProfile?.assignedProcess === "총괄관리") || isAdmin;

  const canApproveLog = useCallback((log) => {
    if (!log) return false;
    if (isAdmin) return true;
    if (log.plant === "삼랑진공장" && canApproveSamrangjin) return true;
    if (log.plant === "한림공장" && canApproveHallim) return true;
    return false;
  }, [isAdmin, canApproveSamrangjin, canApproveHallim]);

  // 특근보고서 결재 완료 여부 확인
  const isOvertimeReportApproved = useCallback((rep) => {
    if (!rep) return false;
    const isWk = isWeekendByDate(rep.workDate || rep.title || rep.workDateFormatted);
    if (!isWk) return true;
    if (rep.workDate && String(rep.workDate).slice(0, 10) <= "2026-10-18") return true;

    if (rep.approvalStatus === "결재완료" || rep.approvalStatus === "APPROVED" || rep.status === "APPROVED" || rep.status === "결재완료") {
      return true;
    }
    if (Array.isArray(rep.approval) && rep.approval.length > 0 && rep.approval.every((st) => st.status === "완료" || st.status === "APPROVED")) {
      return true;
    }
    if (Array.isArray(approvalDocs)) {
      const isSam = rep.plant === "삼랑진공장" || rep.company === "(주)오륙" || rep.company === "유성" || rep.plant?.includes("삼랑진");
      const plantKey = isSam ? "samrangjin" : "hanlim";
      const targetPlant = isSam ? "삼랑진공장" : "한림공장";
      const dateKey = rep.workDate ? rep.workDate.replace(/-/g, "") : "";
      const matchedDoc = approvalDocs.find((d) => {
        const isOt = d.type === "OVERTIME" || d.docType === "OVERTIME" || d.category === "OVERTIME";
        if (!isOt) return false;
        const matchesPlant = d.plant === targetPlant || d.targetPlant === targetPlant || (d.id && d.id.includes(plantKey)) || (d.title && d.title.includes(isSam ? "삼랑진" : "한림"));
        const matchesDate = (dateKey && d.id && d.id.includes(dateKey)) || d.workDate === rep.workDate || (d.title && rep.workDate && d.title.includes(rep.workDate));
        return matchesPlant && matchesDate;
      });
      if (matchedDoc) {
        if (matchedDoc.status === "APPROVED" || matchedDoc.status === "결재완료") {
          return true;
        }
        if (Array.isArray(matchedDoc.steps) && matchedDoc.steps.every((st) => st.status === "APPROVED" || st.status === "완료")) {
          return true;
        }
      }
    }
    return false;
  }, [approvalDocs]);

  // 공장별 최신 실시간 미결재 특근보고서 (주말/휴일 특근보고서 대상)
  const pendingApprovalCards = useMemo(() => {
    if (!Array.isArray(overtimeReports)) return [];
    const list = [];
    const sorted = [...overtimeReports].sort((a, b) => (b.workDate || "").localeCompare(a.workDate || ""));

    const samReport = sorted.find((r) => {
      const isSam = r.plant === "삼랑진공장" || r.company === "(주)오륙" || r.company === "유성";
      return isSam && !isOvertimeReportApproved(r);
    });
    if (samReport) list.push({ ...samReport, plantName: "삼랑진공장" });

    const halReport = sorted.find((r) => {
      const isHal = r.plant === "한림공장" || r.company === "조영" || r.company === "한울" || r.company === "부림텍";
      return isHal && !isOvertimeReportApproved(r);
    });
    if (halReport) list.push({ ...halReport, plantName: "한림공장" });

    return list;
  }, [overtimeReports, isOvertimeReportApproved]);

  // 관리자별 맞춤 미결재 특근보고서
  const filteredPendingApprovalCards = useMemo(() => {
    if (isPartnerProfile) return [];
    if (isAdmin) return pendingApprovalCards;
    if (isMyeongjae) return pendingApprovalCards.filter((r) => r.plantName === "삼랑진공장");
    if (isDongwook) return pendingApprovalCards.filter((r) => r.plantName === "한림공장");
    return [];
  }, [pendingApprovalCards, isPartnerProfile, isAdmin, isMyeongjae, isDongwook]);

  const [selectedOvertimeReportForModal, setSelectedOvertimeReportForModal] = useState(null);

  const getReportWorkersList = useCallback((report) => {
    if (!report) return [];
    if (Array.isArray(report.workers) && report.workers.length > 0) {
      return report.workers;
    }
    const cleanComp = cleanCompanyName(report.company || "");
    const rawMatrix = smartOvertimeData?.attendanceMatrix || [];
    const matched = rawMatrix.filter((w) => cleanCompanyName(w.company) === cleanComp);
    if (matched.length > 0) {
      return matched.map((w, idx) => ({
        id: idx + 1,
        name: w.name,
        company: w.company,
        line: w.process || "생산",
        hours: 8,
        overtimeHours: 2,
        tasks: report.workContent || "휴일 특근 및 생산라인 가동"
      }));
    }
    return [
      { id: 1, name: "심임대", company: "(주)오륙", line: "JA G-RUN", hours: 8, overtimeHours: 2.5, tasks: "금형 교체 및 조립" },
      { id: 2, name: "이상은", company: "(주)오륙", line: "NX4 G-RUN", hours: 8, overtimeHours: 2.0, tasks: "원소재 검사 및 포장" },
      { id: 3, name: "최현영", company: "(주)오륙", line: "HR G-RUN", hours: 8, overtimeHours: 2.0, tasks: "완제품 적재 및 출하" }
    ];
  }, [smartOvertimeData]);

  return {
    extrusionSummaryList,
    smartOvertimeData,
    overtimeReports,
    companyOverviewStats,
    unwrittenCompanies,
    filteredCompanyOverviewStats,
    filteredUnwrittenCompanies,
    approvalDocs,
    pendingCount,
    holdCount,
    canApproveSamrangjin,
    canApproveHallim,
    canApproveLog,
    isOvertimeReportApproved,
    pendingApprovalCards,
    filteredPendingApprovalCards,
    selectedOvertimeReportForModal,
    setSelectedOvertimeReportForModal,
    getReportWorkersList
  };
}
