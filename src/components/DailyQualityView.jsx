import React, { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import { useCurrency } from "../context/CurrencyContext";
import { pushModalHistory, subscribeCloseAllModals } from "../utils/modalHistory";
import * as XLSX from "xlsx";
import {
  subscribeQualityRecords,
  saveQualityRecordsBatch,
  deleteQualityRecordsByDate,
  generateQualityRecordId,
  getQualityMonthlyAggregation,
  getQualityDailyAggregation,
  parseQualityExcelFiles,
  QUALITY_CORE_ITEMS,
  calculateItemQualityTargets,
  saveQualityTargets,
  subscribeQualityTargets,
  getPreviousYearMonth
} from "../services/qualityService";
import { DailyQualityHeaderNav } from "./quality/DailyQualityHeaderNav";
import { DailyQualityDashboardTab } from "./quality/DailyQualityDashboardTab";
import { DailyQualityTargetSettingsTab } from "./quality/DailyQualityTargetSettingsTab";
import { DailyQualityExcelUploadBanner } from "./quality/DailyQualityExcelUploadBanner";
import { QualityItemDetailModal } from "./quality/QualityItemDetailModal";
import { QualityDirectInputModal } from "./quality/QualityDirectInputModal";

export const DailyQualityView = () => {
  const { currentProfile } = useAuth();
  const { selectedMonth, changeMonth, availableMonths } = useMonth();
  const { formatAmount } = useCurrency();
  const fileInputRef = useRef(null);

  // 🌟 Global Auto-close all modals on popstate (뒤로가기 시 팝업 닫기)
  useEffect(() => {
    const unsub = subscribeCloseAllModals(() => {
      setIsDirectInputModalOpen(false);
      setPopupItem(null);
    });
    return () => unsub();
  }, []);

  const handleOpenPopupItem = (it) => {
    pushModalHistory("quality_item_popup");
    setPopupItem(it);
  };

  // ⭐ Direct Quality Input Modal State (이창엽 책임 전용 일일 실적 직접 입력 & 수정)
  const [isDirectInputModalOpen, setIsDirectInputModalOpen] = useState(false);
  const [directInputDate, setDirectInputDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [directItemsInput, setDirectItemsInput] = useState({
    ja: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 3116, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0 },
    hr: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 2372, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0 },
    nx4: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 5747, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0 },
    nx4a: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 5747, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0 }
  });
  const [isSavingDirectInput, setIsSavingDirectInput] = useState(false);

  // Helper: Load existing records for a specific date into the direct input form
  const loadDateRecordsIntoDirectForm = (targetDate) => {
    const matching = allRecords.filter((r) => r.date === targetDate);
    const newInputs = {
      ja: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 3116, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0 },
      hr: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 2372, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0 },
      nx4: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 5747, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0 },
      nx4a: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 5747, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0 }
    };

    matching.forEach((r) => {
      const key = r.itemId ? r.itemId.toLowerCase() : "";
      if (newInputs[key]) {
        const scrapA = r.scrapA || 0;
        const scrapB = r.scrapB || 0;
        const scrapC = r.scrapC || 0;
        const scrapD = r.scrapD || 0;
        const scrapTotal = r.scrapTotal !== undefined ? r.scrapTotal : (scrapA + scrapB + scrapC + scrapD);

        newInputs[key] = {
          inspectQty: r.inspectQty || 0,
          defectQty: r.defectQty || 0,
          worstReason: r.worstReason && r.worstReason !== "-" ? r.worstReason : "",
          unitPrice: r.unitPrice || QUALITY_CORE_ITEMS.find((c) => c.id === key)?.defaultUnitPrice || newInputs[key].unitPrice,
          scrapA,
          scrapB,
          scrapC,
          scrapD,
          scrapTotal
        };
      }
    });

    setDirectItemsInput(newInputs);
  };

  // Open Direct Input Modal
  const handleOpenDirectInputModal = (targetDate = null) => {
    pushModalHistory("quality_direct_input");
    const dateToUse = targetDate || directInputDate || new Date().toISOString().split("T")[0];
    setDirectInputDate(dateToUse);
    loadDateRecordsIntoDirectForm(dateToUse);
    setIsDirectInputModalOpen(true);
  };

  // Save Direct Input
  const handleSaveDirectInput = async () => {
    if (!directInputDate) {
      alert("입력할 일자를 선택해 주세요.");
      return;
    }

    setIsSavingDirectInput(true);
    try {
      const dt = new Date(directInputDate);
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      const dayOfWeek = dayNames[dt.getDay()] || "월";
      const author = currentProfile?.name ? `${currentProfile.name} ${currentProfile.title || "책임"}` : "이창엽 책임";

      const recordsToSave = QUALITY_CORE_ITEMS.map((core) => {
        const it = directItemsInput[core.id] || { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: core.defaultUnitPrice, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0 };
        const inspectQty = Math.max(0, Math.round(Number(it.inspectQty) || 0));
        const defectQty = Math.max(0, Math.round(Number(it.defectQty) || 0));
        const defectRate = inspectQty > 0 ? Number(((defectQty / inspectQty) * 100).toFixed(2)) : 0;
        const unitPrice = it.unitPrice || core.defaultUnitPrice;
        const lossAmount = Math.round(defectQty * unitPrice);
        const scrapA = Math.max(0, Math.round(Number(it.scrapA) || 0));
        const scrapB = Math.max(0, Math.round(Number(it.scrapB) || 0));
        const scrapC = Math.max(0, Math.round(Number(it.scrapC) || 0));
        const scrapD = Math.max(0, Math.round(Number(it.scrapD) || 0));
        const scrapTotal = scrapA + scrapB + scrapC + scrapD;

        return {
          id: generateQualityRecordId(directInputDate, core.id),
          date: directInputDate,
          yearMonth: directInputDate.slice(0, 7),
          dayOfWeek,
          itemId: core.id,
          itemName: core.name,
          carModel: core.carModel,
          inspectQty,
          defectQty,
          defectRate,
          worstReason: it.worstReason.trim() || (defectQty === 0 ? "-" : core.defaultDefectReason),
          lossAmount,
          scrapA,
          scrapB,
          scrapC,
          scrapD,
          scrapTotal,
          uploader: author,
          updatedAt: new Date().toISOString()
        };
      });

      await saveQualityRecordsBatch(recordsToSave);
      setIsDirectInputModalOpen(false);
      setUploadToast({
        type: "success",
        message: `✅ ${directInputDate} (${dayOfWeek}) 4개 차종 품질 검사/불량 실적이 정확하게 저장되었습니다!`
      });
      setTimeout(() => setUploadToast(null), 5000);
    } catch (err) {
      console.error("Save direct quality error:", err);
      alert("저장 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSavingDirectInput(false);
    }
  };

  // Delete Direct Input for Date
  const handleDeleteDirectDate = async () => {
    if (!confirm(`${directInputDate} 등록된 4개 차종 품질 실적을 전체 삭제하시겠습니까?`)) return;
    try {
      await deleteQualityRecordsByDate(directInputDate);
      setIsDirectInputModalOpen(false);
      setUploadToast({
        type: "info",
        message: `🗑️ ${directInputDate} 품질 실적 데이터가 삭제되었습니다.`
      });
      setTimeout(() => setUploadToast(null), 4000);
    } catch (err) {
      console.error("Delete direct quality error:", err);
    }
  };

  // ⭐ Popup Modal State for Item-specific Daily Breakdown
  const [popupItem, setPopupItem] = useState(null);
  const [qualityGraphFilter, setQualityGraphFilter] = useState("all"); // "all" | "hr" | "ja" | "nx4a" | "nx4"

  // Real-time Quality Records from Firestore / LocalStorage
  const [allRecords, setAllRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drag and Drop & Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileNames, setUploadedFileNames] = useState([
    "01. 09월 AB동-최종검사 정리.xlsx",
    "G-RUN 불량율 집계.xlsx"
  ]);
  const [uploadToast, setUploadToast] = useState(null);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsub = subscribeQualityRecords((records) => {
      setAllRecords(records);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // ⭐ Sub-Tab Switcher State ("dashboard" | "target_settings")
  const [activeQualityTab, setActiveQualityTab] = useState("dashboard");

  // ⭐ Quality Target Settings State (차종별 목표관리선)
  const [qualityTargets, setQualityTargets] = useState(null);
  const [customTargetInputs, setCustomTargetInputs] = useState(null);
  const [isSavingTargets, setIsSavingTargets] = useState(false);

  // Auto-calculated target defaults based on previous month's actual performance
  const autoCalculatedTargets = useMemo(() => {
    return calculateItemQualityTargets(allRecords, selectedMonth || "2026-09");
  }, [allRecords, selectedMonth]);

  // Subscribe to real-time target updates
  useEffect(() => {
    const unsub = subscribeQualityTargets(selectedMonth || "2026-09", (targets) => {
      setQualityTargets(targets);
      setCustomTargetInputs(targets);
    }, allRecords);
    return () => unsub();
  }, [selectedMonth, allRecords]);

  // Effective Active Targets (saved custom targets or auto-calculated)
  const activeTargets = customTargetInputs || qualityTargets || autoCalculatedTargets;

  const targetOverall = activeTargets?.overall?.targetRate ?? 0.59;

  const getItemTarget = (itemId) => {
    const id = (itemId || "").toLowerCase();
    return activeTargets?.items?.[id]?.targetRate ?? 0.70;
  };

  // Handler: Update individual item target rate in local edit form
  const handleUpdateItemTargetRate = (itemId, newRate) => {
    const cleanRate = Math.max(0, Number(Number(newRate).toFixed(2)) || 0);
    const base = customTargetInputs || activeTargets;
    const updated = {
      ...base,
      items: {
        ...(base.items || {}),
        [itemId]: {
          ...(base.items?.[itemId] || {}),
          targetRate: cleanRate
        }
      }
    };
    setCustomTargetInputs(updated);
  };

  // Handler: Update overall target rate
  const handleUpdateOverallTargetRate = (newRate) => {
    const cleanRate = Math.max(0, Number(Number(newRate).toFixed(2)) || 0);
    const base = customTargetInputs || activeTargets;
    const updated = {
      ...base,
      overall: {
        ...(base.overall || {}),
        targetRate: cleanRate
      }
    };
    setCustomTargetInputs(updated);
  };

  // Handler: Auto-recalculate from previous month actuals
  const handleAutoRecalculateTargets = () => {
    const calculated = calculateItemQualityTargets(allRecords, selectedMonth || "2026-09");
    setCustomTargetInputs(calculated);
    setUploadToast({
      type: "success",
      message: `⚡ ${getPreviousYearMonth(selectedMonth)} 실적 기반으로 당월(${selectedMonth}) 차종별 목표관리선이 자동 재계산되었습니다! (1% 미만: 5% 감축, 1% 이상: 10% 감축)`
    });
    setTimeout(() => setUploadToast(null), 5000);
  };

  // Handler: Save targets to Firestore and LocalStorage
  const handleSaveTargets = async () => {
    setIsSavingTargets(true);
    try {
      const dataToSave = customTargetInputs || activeTargets;
      await saveQualityTargets(selectedMonth || "2026-09", dataToSave);
      setQualityTargets(dataToSave);
      setUploadToast({
        type: "success",
        message: `💾 ${selectedMonth} 차종별 품질 목표관리선 설정이 성공적으로 저장되었습니다!`
      });
      setTimeout(() => setUploadToast(null), 4000);
    } catch (err) {
      console.error("Save targets error:", err);
      alert("목표관리선 저장 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSavingTargets(false);
    }
  };

  // Handler: Reset to system default targets
  const handleResetTargets = () => {
    const calculated = calculateItemQualityTargets(allRecords, selectedMonth || "2026-09");
    setCustomTargetInputs(calculated);
    setUploadToast({
      type: "info",
      message: "목표관리선이 시스템 표준 자동 산출값으로 초기화되었습니다."
    });
    setTimeout(() => setUploadToast(null), 4000);
  };

  // Close popup with ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setPopupItem(null);
        setIsDirectInputModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute Monthly Aggregation based on selectedMonth
  const monthlyData = useMemo(() => {
    return getQualityMonthlyAggregation(allRecords, selectedMonth || "2026-09");
  }, [allRecords, selectedMonth]);

  // Compute Daily Aggregation (Date by Date rows) based on selectedMonth
  const dailyList = useMemo(() => {
    return getQualityDailyAggregation(allRecords, selectedMonth || "2026-09");
  }, [allRecords, selectedMonth]);

  // Dynamic sorted days for SVG chart (in chronological ascending order)
  const chartDays = useMemo(() => {
    const list = dailyList.slice().sort((a, b) => a.date.localeCompare(b.date));
    const workingDays = list.filter((d) => d.totalInspectQty > 0 || d.totalDefectQty > 0);
    return workingDays.length > 0 ? workingDays : list;
  }, [dailyList]);

  // Dynamic Pareto defect reasons calculation
  const dynamicDefectAnalysis = useMemo(() => {
    const targetYM = selectedMonth || "2026-09";
    const monthRecords = allRecords.filter((r) => r.yearMonth === targetYM || (r.date && r.date.startsWith(targetYM)));
    const reasonCounts = new Map();
    let totalDefects = 0;

    monthRecords.forEach((r) => {
      if (r.defectQty > 0 && r.worstReason && r.worstReason !== "-") {
        totalDefects += r.defectQty;
        const parts = r.worstReason.split(/[,/·\n]/).map((p) => p.trim()).filter(Boolean);
        parts.forEach((p) => {
          const match = p.match(/^(.+?)\s*\(([0-9]+)\s*건?\)$/);
          if (match) {
            const name = match[1].trim();
            const cnt = parseInt(match[2], 10) || 1;
            reasonCounts.set(name, (reasonCounts.get(name) || 0) + cnt);
          } else {
            reasonCounts.set(p, (reasonCounts.get(p) || 0) + (r.defectQty > 0 ? r.defectQty : 1));
          }
        });
      }
    });

    const totalTally = Array.from(reasonCounts.values()).reduce((sum, v) => sum + v, 0) || totalDefects || 1;
    const sortedCategories = Array.from(reasonCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count], idx) => {
        const percent = Math.round((count / totalTally) * 100);
        return {
          id: idx + 1,
          name,
          count,
          percent,
          color: idx === 0 ? "#EF4444" : idx === 1 ? "#F97316" : idx === 2 ? "#FBBF24" : "#10B981",
          bgBadge: idx === 0 ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200/70 dark:border-rose-900/50" :
                    idx === 1 ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-900/50" :
                    idx === 2 ? "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200/70 dark:border-yellow-900/50" :
                    "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-800/50",
          barColor: idx === 0 ? "bg-rose-500" : idx === 1 ? "bg-orange-500" : idx === 2 ? "bg-yellow-500" : "bg-emerald-500",
          textColor: idx === 0 ? "text-rose-800 dark:text-rose-200" : idx === 1 ? "text-amber-800 dark:text-amber-200" : idx === 2 ? "text-yellow-800 dark:text-yellow-200" : "text-emerald-800 dark:text-emerald-200",
          numColor: idx === 0 ? "text-rose-600 dark:text-rose-400" : idx === 1 ? "text-orange-600 dark:text-orange-400" : idx === 2 ? "text-yellow-600 dark:text-yellow-400" : "text-emerald-600 dark:text-emerald-400"
        };
      });

    return {
      totalDefects: monthlyData.totalDefectQty || totalDefects,
      categories: sortedCategories.length > 0 ? sortedCategories : [
        { id: 1, name: "특이 불량 없음 (목표 100% 달성)", count: 0, percent: 100, color: "#10B981", bgBadge: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70", barColor: "bg-emerald-500", textColor: "text-emerald-800 dark:text-emerald-200", numColor: "text-emerald-600 dark:text-emerald-400" }
      ]
    };
  }, [allRecords, selectedMonth, monthlyData.totalDefectQty]);

  // Handle Excel Files Upload
  const handleUploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setUploadedFileNames(fileList.map((f) => f.name));
    setIsUploading(true);
    setUploadToast(null);

    try {
      const { records, count, yearMonth } = await parseQualityExcelFiles(fileList);
      if (records && records.length > 0) {
        await saveQualityRecordsBatch(records);
        if (yearMonth && yearMonth !== selectedMonth && changeMonth) {
          changeMonth(yearMonth);
        }
        setUploadToast({
          type: "success",
          message: `${yearMonth} 품질 엑셀 파일 ${fileList.length}개에서 총 ${count}건의 아이템별 일일 실적이 엑셀과 100% 동일하게 갱신되었습니다!`
        });
      } else {
        setUploadToast({
          type: "error",
          message: "선택하신 엑셀 파일에서 유효한 품질 실적 데이터를 찾지 못했습니다. 표준 엑셀 서식을 확인해 주세요."
        });
      }
    } catch (err) {
      console.error("Quality Excel Upload error:", err);
      setUploadToast({
        type: "error",
        message: "엑셀 파일 파싱 및 저장 중 오류 발생: " + (err.message || "파일 형식을 확인해주세요.")
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadToast(null), 6000);
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  // Export to Excel (Full or Single Item)
  const handleExportExcel = (targetItem = null) => {
    if (targetItem) {
      // Export single item daily table
      const rows = [
        [`[${targetItem.name}] ${selectedMonth} 일자별 품질 검사 & 불량 정리본`],
        ["차종", targetItem.carModel, "조회기준월", selectedMonth, "품질목표", "0.70% 이하", "출력일시", new Date().toLocaleString("ko-KR")],
        [],
        ["검사일자", "요일", "검사수량(EA)", "불량수량(EA)", "아이템 불량률(%)", "소재A 폐기", "소재B 폐기", "소재C 폐기", "소재D 폐기", "총 폐기(EA)", "품질 손실금액(원)", "주요 불량 사유(WORST)"]
      ];

      dailyList.forEach((d) => {
        const it = d.items?.[targetItem.id] || { inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0, worstReason: "-", scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0 };
        rows.push([
          d.date,
          `${d.dayOfWeek}요일`,
          it.inspectQty,
          it.defectQty,
          `${it.defectRate}%`,
          it.scrapA || 0,
          it.scrapB || 0,
          it.scrapC || 0,
          it.scrapD || 0,
          it.scrapTotal || 0,
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
        targetItem.scrapA || 0,
        targetItem.scrapB || 0,
        targetItem.scrapC || 0,
        targetItem.scrapD || 0,
        targetItem.scrapTotal || 0,
        targetItem.lossAmount,
        targetItem.worstReason
      ]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, targetItem.carModel);
      XLSX.writeFile(wb, `${targetItem.carModel}_일자별품질정리본_${selectedMonth}.xlsx`);
      return;
    }

    // Export all items
    const rows = [
      [`${selectedMonth} 아이템별 일일 품질현황 보고서`],
      ["조회기준월", selectedMonth, "품질관리목표", "0.70% 이하", "출력일시", new Date().toLocaleString("ko-KR")],
      [],
      ["[1. 월간 아이템별 불량현황 누계]"],
      ["품목명", "차종", "검사수량(EA)", "불량수량(EA)", "아이템 불량률(%)", "소재폐기수량(EA)", "상태", "주요 불량 사유", "품질손실금액(원)"]
    ];

    monthlyData.items.forEach((it) => {
      rows.push([
        it.name,
        it.carModel,
        it.inspectQty,
        it.defectQty,
        `${it.defectRate}%`,
        it.scrapTotal || 0,
        it.defectRate <= 0.70 ? "목표 달성" : "주의 관리",
        it.worstReason,
        it.lossAmount
      ]);
    });

    rows.push([]);
    rows.push(["[2. 일자별 아이템 세부 검사 및 불량 실적]"]);
    rows.push(["일자", "요일", "품목명", "검사수량(EA)", "불량수량(EA)", "아이템 불량률(%)", "소재폐기수량(EA)", "손실금액(원)", "주요 불량 사유"]);

    dailyList.forEach((d) => {
      Object.values(d.items || {}).forEach((it) => {
        rows.push([
          d.date,
          `${d.dayOfWeek}요일`,
          it.itemName,
          it.inspectQty,
          it.defectQty,
          `${it.defectRate}%`,
          it.scrapTotal || 0,
          it.lossAmount,
          it.worstReason || "-"
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "아이템별품질현황");
    XLSX.writeFile(wb, `아이템별품질현황_${selectedMonth}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Top summary rate
  const overallDefectRate = monthlyData.overallDefectRate !== undefined ? monthlyData.overallDefectRate : (monthlyData.totalDefectRate || 0);
  const isOverallGood = overallDefectRate <= targetOverall;
  const scrapTotalRate = monthlyData.totalInspectQty > 0
    ? Number((((monthlyData.totalScrapQty || 0) / monthlyData.totalInspectQty) * 100).toFixed(2))
    : 0;

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn pb-24 max-w-[1600px] mx-auto px-1.5 sm:px-0">
      <DailyQualityHeaderNav
        activeQualityTab={activeQualityTab}
        setActiveQualityTab={setActiveQualityTab}
        targetOverall={targetOverall}
        selectedMonth={selectedMonth}
        changeMonth={changeMonth}
        availableMonths={availableMonths}
        getPreviousYearMonth={getPreviousYearMonth}
        handleOpenDirectInputModal={handleOpenDirectInputModal}
        handleExportExcel={handleExportExcel}
      />

      {activeQualityTab === "dashboard" && (
        <DailyQualityDashboardTab
          selectedMonth={selectedMonth}
          monthlyData={monthlyData}
          isOverallGood={isOverallGood}
          overallDefectRate={overallDefectRate}
          targetOverall={targetOverall}
          scrapTotalRate={scrapTotalRate}
          getItemTarget={getItemTarget}
          chartDays={chartDays}
          qualityGraphFilter={qualityGraphFilter}
          setQualityGraphFilter={setQualityGraphFilter}
          dynamicDefectAnalysis={dynamicDefectAnalysis}
          handleOpenPopupItem={handleOpenPopupItem}
          setPopupItem={setPopupItem}
        />
      )}

      {activeQualityTab === "target_settings" && (
        <DailyQualityTargetSettingsTab
          selectedMonth={selectedMonth}
          getPreviousYearMonth={getPreviousYearMonth}
          handleAutoRecalculateTargets={handleAutoRecalculateTargets}
          handleSaveTargets={handleSaveTargets}
          isSavingTargets={isSavingTargets}
          handleResetTargets={handleResetTargets}
          QUALITY_CORE_ITEMS={QUALITY_CORE_ITEMS}
          activeTargets={activeTargets}
          monthlyData={monthlyData}
          handleUpdateItemTargetRate={handleUpdateItemTargetRate}
          handleUpdateOverallTargetRate={handleUpdateOverallTargetRate}
          targetOverall={targetOverall}
          overallDefectRate={overallDefectRate}
        />
      )}

      <DailyQualityExcelUploadBanner
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        fileInputRef={fileInputRef}
        handleUploadFiles={handleUploadFiles}
        isDragging={isDragging}
        isUploading={isUploading}
        uploadedFileNames={uploadedFileNames}
        uploadToast={uploadToast}
      />

      <QualityItemDetailModal
        popupItem={popupItem}
        onClose={() => setPopupItem(null)}
        selectedMonth={selectedMonth}
        chartDays={chartDays}
        handleOpenDirectInputModal={handleOpenDirectInputModal}
        handleExportExcel={handleExportExcel}
      />

      <QualityDirectInputModal
        isOpen={isDirectInputModalOpen}
        onClose={() => setIsDirectInputModalOpen(false)}
        directInputDate={directInputDate}
        setDirectInputDate={setDirectInputDate}
        loadDateRecordsIntoDirectForm={loadDateRecordsIntoDirectForm}
        allRecords={allRecords}
        currentProfile={currentProfile}
        directItemsInput={directItemsInput}
        setDirectItemsInput={setDirectItemsInput}
        QUALITY_CORE_ITEMS={QUALITY_CORE_ITEMS}
        handleSaveDirectInput={handleSaveDirectInput}
        isSavingDirectInput={isSavingDirectInput}
        handleDeleteDirectDate={handleDeleteDirectDate}
      />
    </div>
  );
};

export default DailyQualityView;
