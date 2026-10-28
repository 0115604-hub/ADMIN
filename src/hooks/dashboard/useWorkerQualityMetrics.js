import { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  subscribeHanulQualityIssues,
  getLocalHanulQualityIssues
} from "../../services/hanulQualityIssueService";
import {
  subscribeMachiningQualityIssues,
  getLocalMachiningQualityIssues
} from "../../services/machiningQualityIssueService";
import {
  subscribeExtrusionQualityIssues,
  getLocalExtrusionQualityIssues
} from "../../services/extrusionQualityIssueService";
import {
  subscribeYuseongQualityIssues,
  getLocalYuseongQualityIssues
} from "../../services/yuseongQualityIssueService";
import {
  subscribeQualityRecords,
  getQualityMonthlyAggregation,
  getQualityDailyAggregation,
  getPreviousYearMonth
} from "../../services/qualityService";
import { pushModalHistory, useModalHistory } from "../../utils/modalHistory";

/**
 * useWorkerQualityMetrics
 * Manages quality issue subscriptions across 4 plants (Extrusion, Hanul, Machining, Yuseong),
 * real-time quality records aggregation (daily/monthly/prevMonthly),
 * and report modal triggers (Hanul, Yuseong, Inspection, WorkLogsSummary).
 */
export function useWorkerQualityMetrics({ selectedMonth, currentYearMonth }) {
  // Quality Issues Subscriptions
  const [hanulQualityIssues, setHanulQualityIssues] = useState(() => getLocalHanulQualityIssues());
  const [machiningQualityIssues, setMachiningQualityIssues] = useState(() => getLocalMachiningQualityIssues());
  const [extrusionQualityIssues, setExtrusionQualityIssues] = useState(() => getLocalExtrusionQualityIssues());
  const [yuseongQualityIssues, setYuseongQualityIssues] = useState(() => getLocalYuseongQualityIssues());

  // Modal States
  const [isHanulSettlementModalOpen, setIsHanulSettlementModalOpen] = useState(false);
  const [isHanulWorkReportModalOpen, setIsHanulWorkReportModalOpen] = useState(false);
  const [isHanulQualityIssueModalOpen, setIsHanulQualityIssueModalOpen] = useState(false);
  const [hanulReportProject, setHanulReportProject] = useState("9BQC");
  const [hanulReportProcess, setHanulReportProcess] = useState("소재준비");
  const [hanulReportEditData, setHanulReportEditData] = useState(null);

  const [isYuseongWorkReportModalOpen, setIsYuseongWorkReportModalOpen] = useState(false);
  const [yuseongReportProject, setYuseongReportProject] = useState("JK1");
  const [yuseongReportEditData, setYuseongReportEditData] = useState(null);

  const [isWorkLogsSummaryModalOpen, setIsWorkLogsSummaryModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

  // Modal History Back Button Handlers
  useModalHistory(isHanulSettlementModalOpen, () => setIsHanulSettlementModalOpen(false), "workerDashboardHanulModal");
  useModalHistory(isHanulWorkReportModalOpen, () => setIsHanulWorkReportModalOpen(false), "workerDashboardHanulReportModal");
  useModalHistory(isHanulQualityIssueModalOpen, () => setIsHanulQualityIssueModalOpen(false), "workerDashboardHanulQualityModal");
  useModalHistory(isYuseongWorkReportModalOpen, () => setIsYuseongWorkReportModalOpen(false), "workerDashboardYuseongReportModal");
  useModalHistory(isWorkLogsSummaryModalOpen, () => setIsWorkLogsSummaryModalOpen(false), "workerDashboardWorkLogsSummaryModal");

  useEffect(() => {
    const unsub = subscribeHanulQualityIssues((list) => {
      setHanulQualityIssues(list || []);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeMachiningQualityIssues((list) => {
      setMachiningQualityIssues(list || []);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeExtrusionQualityIssues((list) => {
      setExtrusionQualityIssues(list || []);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeYuseongQualityIssues((list) => {
      setYuseongQualityIssues(list || []);
    });
    return () => unsub();
  }, []);

  const activeHanulQualityCount = useMemo(() => {
    return (hanulQualityIssues || []).filter((i) => i && i.status === "ACTIVE").length;
  }, [hanulQualityIssues]);

  const activeMachiningQualityCount = useMemo(() => {
    return (machiningQualityIssues || []).filter((i) => i && i.status === "ACTIVE").length;
  }, [machiningQualityIssues]);

  const activeExtrusionQualityCount = useMemo(() => {
    return (extrusionQualityIssues || []).filter((i) => i && i.status === "ACTIVE").length;
  }, [extrusionQualityIssues]);

  const activeYuseongQualityCount = useMemo(() => {
    return (yuseongQualityIssues || []).filter((i) => i && i.status === "ACTIVE").length;
  }, [yuseongQualityIssues]);

  const handleOpenHanulReport = (proj = "9BQC", proc = "소재준비", editData = null) => {
    setHanulReportProject(proj);
    setHanulReportProcess(proc);
    setHanulReportEditData(editData);
    setIsHanulWorkReportModalOpen(true);
  };

  const handleOpenHanulSettlementModal = () => {
    pushModalHistory("hanul_settlement_modal");
    setIsHanulSettlementModalOpen(true);
  };

  const handleOpenYuseongReport = (proj = "JK1", editData = null) => {
    setYuseongReportProject(proj);
    setYuseongReportEditData(editData);
    setIsYuseongWorkReportModalOpen(true);
  };

  // Real-time Quality Records for Dashboard
  const [qualityRecords, setQualityRecords] = useState([]);
  const [qualityPopupItem, setQualityPopupItem] = useState(null);

  useEffect(() => {
    const unsub = subscribeQualityRecords((recs) => {
      setQualityRecords(recs);
    });
    return () => unsub();
  }, []);

  const handleOpenQualityPopup = (it) => {
    pushModalHistory("quality_popup");
    setQualityPopupItem(it);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setQualityPopupItem(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const prevYearMonth = useMemo(() => {
    return getPreviousYearMonth(selectedMonth || currentYearMonth || "2026-09");
  }, [selectedMonth, currentYearMonth]);

  const liveQualityPrevMonthly = useMemo(() => {
    return getQualityMonthlyAggregation(qualityRecords, prevYearMonth);
  }, [qualityRecords, prevYearMonth]);

  const liveQualityCurrentMonthly = useMemo(() => {
    return getQualityMonthlyAggregation(qualityRecords, selectedMonth || "2026-09");
  }, [qualityRecords, selectedMonth]);

  const liveQualityDaily = useMemo(() => {
    return getQualityDailyAggregation(qualityRecords, selectedMonth || "2026-09");
  }, [qualityRecords, selectedMonth]);

  const handleExportQualityItemExcel = useCallback((targetItem) => {
    if (!targetItem) return;
    const rows = [
      [`[${targetItem.name}] ${selectedMonth || "2026-09"} 일자별 품질 검사 & 불량 정리본`],
      ["차종", targetItem.carModel, "조회기준월", selectedMonth || "2026-09", "품질목표", "0.70% 이하", "출력일시", new Date().toLocaleString("ko-KR")],
      [],
      ["검사일자", "요일", "검사수량(EA)", "불량수량(EA)", "아이템 불량률(%)", "품질 손실금액(원)", "주요 불량 사유(WORST)"]
    ];

    liveQualityDaily.forEach((d) => {
      const it = d.items?.[targetItem.id] || { inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0, worstReason: "-" };
      rows.push([
        d.date,
        `${d.dayOfWeek}요일`,
        it.inspectQty,
        it.defectQty,
        `${it.defectRate}%`,
        it.lossAmount,
        it.worstReason || "-"
      ]);
    });

    rows.push([]);
    rows.push([
      "월간 누계 합계",
      "-",
      targetItem.inspectQty,
      targetItem.defectQty,
      `${targetItem.defectRate}%`,
      targetItem.lossAmount,
      targetItem.worstReason
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, targetItem.carModel);
    XLSX.writeFile(wb, `${targetItem.carModel}_일자별품질정리본_${selectedMonth || "2026-09"}.xlsx`);
  }, [selectedMonth, liveQualityDaily]);

  return {
    hanulQualityIssues,
    machiningQualityIssues,
    extrusionQualityIssues,
    yuseongQualityIssues,
    activeHanulQualityCount,
    activeMachiningQualityCount,
    activeExtrusionQualityCount,
    activeYuseongQualityCount,
    handleOpenHanulReport,
    handleOpenHanulSettlementModal,
    handleOpenYuseongReport,
    isHanulSettlementModalOpen,
    setIsHanulSettlementModalOpen,
    isHanulWorkReportModalOpen,
    setIsHanulWorkReportModalOpen,
    isHanulQualityIssueModalOpen,
    setIsHanulQualityIssueModalOpen,
    hanulReportProject,
    hanulReportProcess,
    hanulReportEditData,
    isYuseongWorkReportModalOpen,
    setIsYuseongWorkReportModalOpen,
    yuseongReportProject,
    yuseongReportEditData,
    isInspectionModalOpen,
    setIsInspectionModalOpen,
    isWorkLogsSummaryModalOpen,
    setIsWorkLogsSummaryModalOpen,
    qualityRecords,
    qualityPopupItem,
    setQualityPopupItem,
    handleOpenQualityPopup,
    prevYearMonth,
    liveQualityPrevMonthly,
    liveQualityCurrentMonthly,
    liveQualityDaily,
    handleExportQualityItemExcel,
    getPreviousYearMonth
  };
}
