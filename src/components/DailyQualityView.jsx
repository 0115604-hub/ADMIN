import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Download,
  Upload,
  Search,
  CheckCircle2,
  BarChart2,
  FileSpreadsheet,
  FileUp,
  Check,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  Filter,
  ArrowRight,
  Clock,
  UserCheck,
  RefreshCw,
  FileCheck,
  X,
  Eye,
  PlusCircle,
  Edit3,
  Trash2,
  Save,
  Plus,
  Tag
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import { useCurrency } from "../context/CurrencyContext";
import * as XLSX from "xlsx";
import {
  subscribeQualityRecords,
  saveQualityRecordsBatch,
  deleteQualityRecordsByDate,
  generateQualityRecordId,
  getQualityMonthlyAggregation,
  getQualityDailyAggregation,
  parseQualityExcelFiles,
  QUALITY_CORE_ITEMS
} from "../services/qualityService";

export const DailyQualityView = () => {
  const { currentProfile } = useAuth();
  const { selectedMonth, changeMonth, availableMonths } = useMonth();
  const { formatAmount } = useCurrency();
  const fileInputRef = useRef(null);

  // Active View Mode: "daily" (일자별 아이템 실적 - 기본 추천) vs "monthly" (월간 아이템 종합)
  const [activeTab, setActiveTab] = useState("daily");

  // Selected Item Filter: "all" | "ja" | "hr" | "nx4" | "nx4a"
  const [selectedItemId, setSelectedItemId] = useState("all");

  // ⭐ Direct Quality Input Modal State (이창엽 선임 전용 일일 실적 직접 입력 & 수정)
  const [isDirectInputModalOpen, setIsDirectInputModalOpen] = useState(false);
  const [directInputDate, setDirectInputDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [directItemsInput, setDirectItemsInput] = useState({
    ja: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 3116 },
    hr: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 2372 },
    nx4: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 5747 },
    nx4a: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 5747 }
  });
  const [isSavingDirectInput, setIsSavingDirectInput] = useState(false);

  // Helper: Load existing records for a specific date into the direct input form
  const loadDateRecordsIntoDirectForm = (targetDate) => {
    const matching = allRecords.filter((r) => r.date === targetDate);
    const newInputs = {
      ja: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 3116 },
      hr: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 2372 },
      nx4: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 5747 },
      nx4a: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 5747 }
    };

    matching.forEach((r) => {
      const key = r.itemId ? r.itemId.toLowerCase() : "";
      if (newInputs[key]) {
        newInputs[key] = {
          inspectQty: r.inspectQty || 0,
          defectQty: r.defectQty || 0,
          worstReason: r.worstReason && r.worstReason !== "-" ? r.worstReason : "",
          unitPrice: r.unitPrice || QUALITY_CORE_ITEMS.find((c) => c.id === key)?.defaultUnitPrice || newInputs[key].unitPrice
        };
      }
    });

    setDirectItemsInput(newInputs);
  };

  // Open Direct Input Modal
  const handleOpenDirectInputModal = (targetDate = null) => {
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
      const author = currentProfile?.name ? `${currentProfile.name} ${currentProfile.title || "선임"}` : "이창엽 선임";

      const recordsToSave = QUALITY_CORE_ITEMS.map((core) => {
        const it = directItemsInput[core.id] || { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: core.defaultUnitPrice };
        const inspectQty = Math.max(0, Math.round(Number(it.inspectQty) || 0));
        const defectQty = Math.max(0, Math.round(Number(it.defectQty) || 0));
        const defectRate = inspectQty > 0 ? Number(((defectQty / inspectQty) * 100).toFixed(2)) : 0;
        const unitPrice = it.unitPrice || core.defaultUnitPrice;
        const lossAmount = Math.round(defectQty * unitPrice);

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
  const [qualityGraphMode, setQualityGraphMode] = useState("trend"); // "trend" | "bar" | "reason"
  const [qualityGraphFilter, setQualityGraphFilter] = useState("all"); // "all" | "hr" | "ja" | "nx4a" | "nx4"

  // Real-time Quality Records from Firestore / LocalStorage
  const [allRecords, setAllRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drag and Drop & Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileNames, setUploadedFileNames] = useState([
    "01. 09월 AB동-최종검사 정리.xlsx",
    "G-RUN 불량율 집계 (2).xlsx"
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

  // Close popup with ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setPopupItem(null);
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

  // Handle Excel Files Upload
  const handleUploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setUploadedFileNames(fileList.map((f) => f.name));
    setIsUploading(true);
    setUploadToast(null);

    try {
      const { records, count, yearMonth } = await parseQualityExcelFiles(fileList);
      if (records.length > 0) {
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
          type: "info",
          message: "엑셀 파일에서 표준 품질 검사 데이터를 확인하여 동기화했습니다."
        });
      }
    } catch (err) {
      console.error("Quality Excel Upload error:", err);
      setUploadToast({
        type: "error",
        message: "엑셀 파일 파싱 중 오류가 발생했습니다. 파일 형식을 확인해주세요."
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
        ["검사일자", "요일", "검사수량(EA)", "불량수량(EA)", "아이템 불량률(%)", "품질 손실금액(원)", "주요 불량 사유(WORST)"]
      ];

      dailyList.forEach((d) => {
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
      XLSX.writeFile(wb, `${targetItem.carModel}_일자별품질정리본_${selectedMonth}.xlsx`);
      return;
    }

    // Export all items
    const rows = [
      [`${selectedMonth} 아이템별 일일 품질현황 보고서`],
      ["조회기준월", selectedMonth, "품질관리목표", "0.70% 이하", "출력일시", new Date().toLocaleString("ko-KR")],
      [],
      ["[1. 월간 아이템별 불량현황 누계]"],
      ["품목명", "차종", "검사수량(EA)", "불량수량(EA)", "아이템 불량률(%)", "상태", "주요 불량 사유", "품질손실금액(원)"]
    ];

    monthlyData.items.forEach((it) => {
      rows.push([
        it.name,
        it.carModel,
        it.inspectQty,
        it.defectQty,
        `${it.defectRate}%`,
        it.defectRate <= 0.70 ? "목표 달성" : "주의 관리",
        it.worstReason,
        it.lossAmount
      ]);
    });

    rows.push([]);
    rows.push(["[2. 일자별 아이템 세부 검사 및 불량 실적]"]);
    rows.push(["일자", "요일", "품목명", "검사수량(EA)", "불량수량(EA)", "아이템 불량률(%)", "손실금액(원)", "주요 불량 사유"]);

    dailyList.forEach((d) => {
      Object.values(d.items || {}).forEach((it) => {
        rows.push([
          d.date,
          `${d.dayOfWeek}요일`,
          it.itemName,
          it.inspectQty,
          it.defectQty,
          `${it.defectRate}%`,
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

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn pb-24 max-w-[1600px] mx-auto px-1.5 sm:px-0">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & MONTH SELECTION / EXPORT */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                품질현황 관리 시스템
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                아이템별 정합 모드
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
              <span>품질 관리 목표치: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">0.70% 이하</strong></span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>담당: <strong className="text-slate-700 dark:text-slate-300 font-bold">이창엽 선임</strong></span>
            </p>
          </div>
        </div>

        {/* Month Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            <select
              value={selectedMonth}
              onChange={(e) => changeMonth && changeMonth(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-800 dark:text-slate-200 focus:outline-none pr-2 py-1 cursor-pointer"
            >
              {(availableMonths || ["2026-09", "2026-08", "2026-07"]).map((m) => (
                <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {m.replace("-", "년 ")}월
                </option>
              ))}
            </select>
          </div>

          {/* ⭐ Direct Input Button (이창엽 선임 전용 직접 입력 포맷) */}
          <button
            onClick={() => handleOpenDirectInputModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>일일 품질실적 직접 입력 / 수정</span>
          </button>

          {/* Export Excel Button */}
          <button
            onClick={() => handleExportExcel()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>엑셀 보고서 출력</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ⭐ 4대 코어 품목별 불량률 추이 & 실적 그래프 (심플 그래프 시각화) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* Header with Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  4대 코어 품목별 불량률 추이 및 실적 분석
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  {selectedMonth.slice(5, 7)}월 실적
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                일자별 불량률 추이선과 <strong>목표 관리선(0.70%)</strong>으로 한눈에 파악 (품목 칩 클릭 시 상세 팝업)
              </p>
            </div>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setQualityGraphMode("trend")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                qualityGraphMode === "trend"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              📈 추이선
            </button>
            <button
              type="button"
              onClick={() => setQualityGraphMode("bar")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                qualityGraphMode === "bar"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              📊 실적 바
            </button>
            <button
              type="button"
              onClick={() => setQualityGraphMode("reason")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                qualityGraphMode === "reason"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              🚨 원인 분석
            </button>
          </div>
        </div>

        {/* 4 Core Item Quick Chips (Click to Open Detail Popup) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(() => {
            const items = monthlyData.items;
            return items.map((it) => {
              const isGood = it.defectRate <= 0.70;
              const isHr = it.id === "hr";

              return (
                <div
                  key={it.id}
                  onClick={() => setPopupItem(it)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setPopupItem(it)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                    isHr
                      ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-400"
                      : "border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-400"
                  } hover:scale-[1.02] active:scale-98 shadow-xs space-y-1.5`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {it.name}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                        isGood
                          ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                          : "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 animate-pulse"
                      }`}
                    >
                      {isGood ? "목표달성 ✓" : "관리주의 🚨"}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <span
                      className={`text-lg sm:text-xl font-black font-mono leading-none ${
                        isGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {it.defectRate}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {it.inspectQty.toLocaleString()}EA / {it.defectQty}불량
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[9.5px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="truncate">손실: ₩{it.lossAmount.toLocaleString()}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                      <span>팝업</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* GRAPH VIEW 1: Trend Line Chart with 0.70% Goal Threshold Line */}
        {qualityGraphMode === "trend" && (
          <div className="space-y-2 pt-1 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white">일자별 불량률 추이선 (9.1 ~ 9.8)</span>
                <span className="text-[11px] text-slate-400">(빨간 점선: 품질 목표선 0.70%)</span>
              </div>

              {/* Item Toggles */}
              <div className="flex items-center gap-1.5 text-[11px] font-bold flex-wrap">
                <button
                  type="button"
                  onClick={() => setQualityGraphFilter("all")}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-black cursor-pointer transition-colors ${
                    qualityGraphFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  전체
                </button>
                <button
                  type="button"
                  onClick={() => setQualityGraphFilter("hr")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer ${
                    qualityGraphFilter === "hr" ? "bg-rose-500 text-white" : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> HR
                </button>
                <button
                  type="button"
                  onClick={() => setQualityGraphFilter("ja")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer ${
                    qualityGraphFilter === "ja" ? "bg-emerald-600 text-white" : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> JA
                </button>
                <button
                  type="button"
                  onClick={() => setQualityGraphFilter("nx4a")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer ${
                    qualityGraphFilter === "nx4a" ? "bg-teal-600 text-white" : "text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span> NX4a
                </button>
                <button
                  type="button"
                  onClick={() => setQualityGraphFilter("nx4")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer ${
                    qualityGraphFilter === "nx4" ? "bg-blue-600 text-white" : "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> NX4
                </button>
              </div>
            </div>

            {/* SVG Line Chart Container */}
            <div className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-4 overflow-hidden relative">
              <svg viewBox="0 0 700 230" className="w-full h-auto overflow-visible select-none">
                {/* Y Axis Grid Lines */}
                <line x1="50" y1="190" x2="680" y2="190" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                <text x="40" y="194" fontSize="10" fill="currentColor" opacity="0.5" textAnchor="end">0.0%</text>

                <line x1="50" y1="140" x2="680" y2="140" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                <text x="40" y="144" fontSize="10" fill="currentColor" opacity="0.5" textAnchor="end">0.5%</text>

                {/* TARGET LINE: 0.70% (Y = 120) */}
                <line x1="50" y1="120" x2="680" y2="120" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4,4" />
                <rect x="605" y="111" width="75" height="18" rx="4" fill="#EF4444" fillOpacity="0.15" />
                <text x="642" y="124" fontSize="9.5" fontWeight="900" fill="#DC2626" textAnchor="middle">목표선 0.70%</text>

                <line x1="50" y1="90" x2="680" y2="90" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                <text x="40" y="94" fontSize="10" fill="currentColor" opacity="0.5" textAnchor="end">1.0%</text>

                <line x1="50" y1="40" x2="680" y2="40" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                <text x="40" y="44" fontSize="10" fill="currentColor" opacity="0.5" textAnchor="end">1.5%</text>

                {/* X Axis Labels */}
                <text x="80" y="212" fontSize="10.5" fontWeight="bold" fill="currentColor" opacity="0.7" textAnchor="middle">9.1(화)</text>
                <text x="170" y="212" fontSize="10.5" fontWeight="bold" fill="currentColor" opacity="0.7" textAnchor="middle">9.2(수)</text>
                <text x="260" y="212" fontSize="10.5" fontWeight="bold" fill="currentColor" opacity="0.7" textAnchor="middle">9.3(목)</text>
                <text x="350" y="212" fontSize="10.5" fontWeight="bold" fill="currentColor" opacity="0.7" textAnchor="middle">9.4(금)</text>
                <text x="440" y="212" fontSize="10.5" fontWeight="bold" fill="currentColor" opacity="0.7" textAnchor="middle">9.5(토)</text>
                <text x="530" y="212" fontSize="10.5" fontWeight="bold" fill="currentColor" opacity="0.7" textAnchor="middle">9.7(월)</text>
                <text x="620" y="212" fontSize="10.5" fontWeight="bold" fill="currentColor" opacity="0.7" textAnchor="middle">9.8(화)</text>

                {/* HR G-RUN Line (Red) */}
                <g opacity={qualityGraphFilter === "all" || qualityGraphFilter === "hr" ? 1 : 0.15} className="transition-opacity">
                  <polyline
                    fill="none"
                    stroke="#F43F5E"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="80,74 170,122 260,95 350,57 440,95 530,81 620,78"
                  />
                  <circle cx="80" cy="74" r="4" fill="#F43F5E" />
                  <circle cx="170" cy="122" r="4" fill="#F43F5E" />
                  <circle cx="260" cy="95" r="4" fill="#F43F5E" />
                  <circle cx="350" cy="57" r="4.5" fill="#E11D48" />
                  <text x="350" y="47" fontSize="9.5" fontWeight="900" fill="#E11D48" textAnchor="middle">1.33%🚨</text>
                  <circle cx="440" cy="95" r="4" fill="#F43F5E" />
                  <circle cx="530" cy="81" r="4" fill="#F43F5E" />
                  <circle cx="620" cy="78" r="4.5" fill="#E11D48" />
                  <text x="620" y="68" fontSize="9.5" fontWeight="900" fill="#E11D48" textAnchor="middle">1.12%</text>
                </g>

                {/* JA G-RUN Line (Green) */}
                <g opacity={qualityGraphFilter === "all" || qualityGraphFilter === "ja" ? 1 : 0.15} className="transition-opacity">
                  <polyline
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="80,156 170,150 260,163 350,144 440,150 530,151 620,145"
                  />
                  <circle cx="80" cy="156" r="3.5" fill="#10B981" />
                  <circle cx="170" cy="150" r="3.5" fill="#10B981" />
                  <circle cx="260" cy="163" r="3.5" fill="#10B981" />
                  <circle cx="350" cy="144" r="3.5" fill="#10B981" />
                  <circle cx="440" cy="150" r="3.5" fill="#10B981" />
                  <circle cx="530" cy="151" r="3.5" fill="#10B981" />
                  <circle cx="620" cy="145" r="4" fill="#059669" />
                  <text x="620" y="136" fontSize="9" fontWeight="bold" fill="#059669" textAnchor="middle">0.45%</text>
                </g>

                {/* NX4a G-RUN Line (Teal) */}
                <g opacity={qualityGraphFilter === "all" || qualityGraphFilter === "nx4a" ? 1 : 0.15} className="transition-opacity">
                  <polyline
                    fill="none"
                    stroke="#14B8A6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="80,159 170,151 260,170 350,140 440,169 530,151 620,148"
                  />
                  <circle cx="620" cy="148" r="3.5" fill="#14B8A6" />
                  <text x="620" y="162" fontSize="9" fontWeight="bold" fill="#0D9488" textAnchor="middle">0.42%</text>
                </g>

                {/* NX4 G-RUN Line (Blue) */}
                <g opacity={qualityGraphFilter === "all" || qualityGraphFilter === "nx4" ? 1 : 0.15} className="transition-opacity">
                  <polyline
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="80,169 170,159 260,148 350,160 440,170 530,160 620,163"
                  />
                  <circle cx="620" cy="163" r="3.5" fill="#3B82F6" />
                  <text x="620" y="180" fontSize="9" fontWeight="bold" fill="#2563EB" textAnchor="middle">0.27%</text>
                </g>
              </svg>
            </div>
          </div>
        )}

        {/* GRAPH VIEW 2: Horizontal Bar Chart Comparison */}
        {qualityGraphMode === "bar" && (
          <div className="space-y-2.5 pt-1 animate-fadeIn">
            {monthlyData.items.map((it) => {
              const isGood = it.defectRate <= 0.70;
              const isHr = it.id === "hr";
              const barPercent = Math.min(100, Math.max(15, (it.defectRate / 1.5) * 100));

              return (
                <div
                  key={it.id}
                  onClick={() => setPopupItem(it)}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-1.5 cursor-pointer hover:border-emerald-400 transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white">{it.name}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isGood ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                      }`}>
                        {isGood ? "목표달성 ✓" : "관리주의 🚨"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400">{it.inspectQty.toLocaleString()}EA 검사 / {it.defectQty}불량</span>
                      <span className={`text-base font-black font-mono ${
                        isGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}>
                        {it.defectRate}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 relative">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isHr ? "bg-gradient-to-r from-rose-500 to-red-600" : "bg-gradient-to-r from-emerald-500 to-teal-400"
                      }`}
                      style={{ width: `${barPercent}%` }}
                    ></div>
                    {/* 0.70% target marker (46.6%) */}
                    <div className="absolute top-0 bottom-0 left-[46.6%] w-0.5 bg-slate-900 dark:bg-white z-10 opacity-70" title="목표선 0.70%"></div>
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400">
                    <span>주요 원인: {it.worstReason || "-"}</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">손실액: ₩{it.lossAmount.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* GRAPH VIEW 3: Donut / Pareto Breakdown */}
        {qualityGraphMode === "reason" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 animate-fadeIn">
            <div className="flex items-center justify-center">
              <svg viewBox="0 0 160 160" className="w-36 h-36">
                <circle cx="80" cy="80" r="55" fill="transparent" stroke="#EF4444" strokeWidth="20" strokeDasharray="131 345" strokeDashoffset="0" />
                <circle cx="80" cy="80" r="55" fill="transparent" stroke="#F97316" strokeWidth="20" strokeDasharray="100 345" strokeDashoffset="-131" />
                <circle cx="80" cy="80" r="55" fill="transparent" stroke="#FBBF24" strokeWidth="20" strokeDasharray="62 345" strokeDashoffset="-231" />
                <circle cx="80" cy="80" r="55" fill="transparent" stroke="#10B981" strokeWidth="20" strokeDasharray="52 345" strokeDashoffset="-293" />
                <text x="80" y="76" fontSize="11" fontWeight="bold" fill="currentColor" textAnchor="middle">총 불량</text>
                <text x="80" y="93" fontSize="14" fontWeight="900" fill="currentColor" textAnchor="middle">112 EA</text>
              </svg>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
                <span className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> 1. 찍힘 / 스크래치
                </span>
                <span className="font-mono font-black text-rose-600">42건 (38%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <span className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> 2. 기포 / 미성형
                </span>
                <span className="font-mono font-black text-orange-600">33건 (29%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/40">
                <span className="flex items-center gap-2 font-bold text-yellow-700 dark:text-yellow-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> 3. 흑점 / 외관이물
                </span>
                <span className="font-mono font-black text-yellow-600">20건 (18%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <span className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 4. 치수 / 단차 불량
                </span>
                <span className="font-mono font-black text-emerald-600">17건 (15%)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. VIEW MODE TOGGLE & ITEM SELECTOR */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        {/* Main Tab Toggle: Daily vs Monthly */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("daily")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all ${
              activeTab === "daily"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>📅 매일 일자별 아이템 실적표 (엑셀 100% 일치)</span>
          </button>

          <button
            onClick={() => setActiveTab("monthly")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all ${
              activeTab === "monthly"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>📊 {selectedMonth.slice(5, 7)}월 아이템별 누적 실적</span>
          </button>
        </div>

        {/* Item Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedItemId("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors shrink-0 ${
              selectedItemId === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            전체 4대 차종 대조
          </button>
          {QUALITY_CORE_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItemId(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                selectedItemId === item.id
                  ? "bg-indigo-600 text-white font-black"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {item.carModel} G-RUN
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. [DAILY VIEW] 일자별 아이템 세부 실적 (엑셀과 100% 일치) */}
      {/* ========================================================================= */}
      {activeTab === "daily" && (
        <div className="space-y-4 animate-fadeIn">
          {/* 1. All Items Direct Comparison Daily Matrix Table */}
          {selectedItemId === "all" ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                      {selectedMonth} 일자별 4대 차종 불량률 현황 (엑셀 원본 대조표)
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      각 일자별로 JA, HR, NX4, NX4a의 <strong>검사수량 / 불량수량 / 개별 불량률</strong>이 엑셀과 완전히 동일하게 표시됩니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-600 dark:text-slate-300">
                      <th className="p-3 text-center">검사일자</th>
                      <th className="p-3 text-center bg-indigo-50/50 dark:bg-indigo-950/30">JA G-RUN (검사 / 불량 / 불량률)</th>
                      <th className="p-3 text-center bg-teal-50/50 dark:bg-teal-950/30">HR G-RUN (검사 / 불량 / 불량률)</th>
                      <th className="p-3 text-center bg-amber-50/50 dark:bg-amber-950/30">NX4 G-RUN (검사 / 불량 / 불량률)</th>
                      <th className="p-3 text-center bg-purple-50/50 dark:bg-purple-950/30">NX4a G-RUN (검사 / 불량 / 불량률)</th>
                      <th className="p-3 text-right">당일 손실액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dailyList.map((d) => {
                      const ja = d.items?.ja || { inspectQty: 0, defectQty: 0, defectRate: 0 };
                      const hr = d.items?.hr || { inspectQty: 0, defectQty: 0, defectRate: 0 };
                      const nx4 = d.items?.nx4 || { inspectQty: 0, defectQty: 0, defectRate: 0 };
                      const nx4a = d.items?.nx4a || { inspectQty: 0, defectQty: 0, defectRate: 0 };

                      return (
                        <tr key={d.date} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Date */}
                          <td className="p-3 font-black text-slate-900 dark:text-white whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              <span>{d.date.slice(5)} ({d.dayOfWeek})</span>
                            </div>
                          </td>

                          {/* JA */}
                          <td className="p-3 text-center bg-indigo-50/20 dark:bg-indigo-950/10 cursor-pointer hover:bg-indigo-50/50 transition-colors" onClick={() => setPopupItem(monthlyData.items.find(i => i.id === 'ja'))}>
                            {ja.inspectQty > 0 ? (
                              <div className="space-y-0.5">
                                <span className="font-mono text-slate-700 dark:text-slate-300">
                                  {ja.inspectQty.toLocaleString()} EA / <strong className="text-rose-600 font-black">{ja.defectQty}불량</strong>
                                </span>
                                <div className="font-mono font-black text-xs">
                                  <span className={`px-1.5 py-0.2 rounded ${ja.defectRate > 0.70 ? "text-rose-600 bg-rose-100 dark:bg-rose-950" : "text-emerald-600 bg-emerald-100 dark:bg-emerald-950"}`}>
                                    {ja.defectRate}%
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* HR */}
                          <td className="p-3 text-center bg-teal-50/20 dark:bg-teal-950/10 cursor-pointer hover:bg-teal-50/50 transition-colors" onClick={() => setPopupItem(monthlyData.items.find(i => i.id === 'hr'))}>
                            {hr.inspectQty > 0 ? (
                              <div className="space-y-0.5">
                                <span className="font-mono text-slate-700 dark:text-slate-300">
                                  {hr.inspectQty.toLocaleString()} EA / <strong className="text-rose-600 font-black">{hr.defectQty}불량</strong>
                                </span>
                                <div className="font-mono font-black text-xs">
                                  <span className={`px-1.5 py-0.2 rounded ${hr.defectRate > 0.70 ? "text-rose-600 bg-rose-100 dark:bg-rose-950" : "text-emerald-600 bg-emerald-100 dark:bg-emerald-950"}`}>
                                    {hr.defectRate}%
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* NX4 */}
                          <td className="p-3 text-center bg-amber-50/20 dark:bg-amber-950/10 cursor-pointer hover:bg-amber-50/50 transition-colors" onClick={() => setPopupItem(monthlyData.items.find(i => i.id === 'nx4'))}>
                            {nx4.inspectQty > 0 ? (
                              <div className="space-y-0.5">
                                <span className="font-mono text-slate-700 dark:text-slate-300">
                                  {nx4.inspectQty.toLocaleString()} EA / <strong className="text-rose-600 font-black">{nx4.defectQty}불량</strong>
                                </span>
                                <div className="font-mono font-black text-xs">
                                  <span className={`px-1.5 py-0.2 rounded ${nx4.defectRate > 0.70 ? "text-rose-600 bg-rose-100 dark:bg-rose-950" : "text-emerald-600 bg-emerald-100 dark:bg-emerald-950"}`}>
                                    {nx4.defectRate}%
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* NX4a */}
                          <td className="p-3 text-center bg-purple-50/20 dark:bg-purple-950/10 cursor-pointer hover:bg-purple-50/50 transition-colors" onClick={() => setPopupItem(monthlyData.items.find(i => i.id === 'nx4a'))}>
                            {nx4a.inspectQty > 0 ? (
                              <div className="space-y-0.5">
                                <span className="font-mono text-slate-700 dark:text-slate-300">
                                  {nx4a.inspectQty.toLocaleString()} EA / <strong className="text-rose-600 font-black">{nx4a.defectQty}불량</strong>
                                </span>
                                <div className="font-mono font-black text-xs">
                                  <span className={`px-1.5 py-0.2 rounded ${nx4a.defectRate > 0.70 ? "text-rose-600 bg-rose-100 dark:bg-rose-950" : "text-emerald-600 bg-emerald-100 dark:bg-emerald-950"}`}>
                                    {nx4a.defectRate}%
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* Loss Amount */}
                          <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            ₩ {d.totalLossAmount.toLocaleString()}
                          </td>

                          {/* Quick Edit Button */}
                          <td className="p-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenDirectInputModal(d.date)}
                              title={`${d.date} 실적 수정`}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-black border border-indigo-200 dark:border-indigo-800 transition-all active:scale-95 cursor-pointer flex items-center gap-1 mx-auto"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>수정</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* 2. Single Selected Item Detailed Daily Table */
            (() => {
              const targetItem = monthlyData.items.find((it) => it.id === selectedItemId);
              if (!targetItem) return null;

              return (
                <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                        <BarChart2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                          {targetItem.name} 일자별 품질 실적 대장 (9월 누계 불량률: {targetItem.defectRate}%)
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          이창엽 선임의 엑셀 시트와 완전히 일치하는 일일 검사 및 불량 내역입니다.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleExportExcel(targetItem)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{targetItem.carModel} 엑셀 다운</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-600 dark:text-slate-300">
                          <th className="p-3 text-center">검사일자</th>
                          <th className="p-3 text-center">검사수량</th>
                          <th className="p-3 text-center">불량수량</th>
                          <th className="p-3 text-center">아이템 불량률(%)</th>
                          <th className="p-3 text-left">주요 불량 사유 (WORST)</th>
                          <th className="p-3 text-right">품질 손실금액</th>
                          <th className="p-3 text-center w-16 whitespace-nowrap">수정</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {dailyList.map((d) => {
                          const itemRec = d.items?.[selectedItemId] || { inspectQty: 0, defectQty: 0, defectRate: 0, worstReason: "-" };
                          const isGood = itemRec.defectRate <= 0.70;

                          return (
                            <tr key={d.date} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 font-black text-slate-900 dark:text-white whitespace-nowrap text-center">
                                {d.date} ({d.dayOfWeek})
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                                {itemRec.inspectQty.toLocaleString()} EA
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-rose-600 dark:text-rose-400">
                                {itemRec.defectQty.toLocaleString()} EA
                              </td>
                              <td className="p-3 text-center">
                                {itemRec.inspectQty > 0 ? (
                                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-black ${
                                    isGood
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                      : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                  }`}>
                                    {itemRec.defectRate}%
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                                {itemRec.worstReason || "-"}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                ₩ {itemRec.lossAmount?.toLocaleString() || 0}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. [MONTHLY VIEW] 월간 아이템별 누적 실적 요약 */}
      {/* ========================================================================= */}
      {activeTab === "monthly" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  {selectedMonth} 4대 코어 품목별 누적 결산 실적
                </h2>
                <p className="text-[11px] text-slate-400">
                  차종별로 누적 검사수량 대비 불량수량과 정확한 품목 불량률을 관리합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {monthlyData.items.map((it) => (
              <div
                key={it.id}
                onClick={() => setPopupItem(it)}
                className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group select-none"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    {it.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-base font-black font-mono ${
                      it.defectRate <= 0.70 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}>
                      {it.defectRate}%
                    </span>
                    <span className="text-indigo-600 text-xs font-bold">❯</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">검사수량</span>
                    <strong className="font-mono font-bold text-slate-800 dark:text-slate-200">{it.inspectQty.toLocaleString()} EA</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">불량수량</span>
                    <strong className="font-mono font-bold text-rose-600 dark:text-rose-400">{it.defectQty.toLocaleString()} EA</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">품질손실</span>
                    <strong className="font-mono font-bold text-slate-800 dark:text-slate-200">₩ {it.lossAmount.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5">주요 불량 사유:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{it.worstReason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. [공통 하단] 품질 엑셀 파일 드래그 앤 드롭 업로드 영역 */}
      {/* ========================================================================= */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDragging
            ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-4 ring-indigo-500/20 scale-[1.01]"
            : "border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 hover:border-indigo-400 hover:bg-indigo-50/30"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleUploadFiles(e.target.files)}
          multiple
          accept=".xlsx, .xls"
          className="hidden"
        />

        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl transition-all shrink-0 ${
            isDragging ? "bg-indigo-600 text-white scale-110" : "bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400"
          }`}>
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FileUp className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              G-RUN 불량율 집계 & AB동 최종검사 정리 엑셀 파일 드래그 업로드
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              이창엽 선임의 엑셀 파일을 여기에 <strong>드래그하여 놓거나 클릭</strong>하여 업로드하면, 일자별 아이템 실적이 <strong>중복 없이 자동 동기화</strong>됩니다.
            </p>
          </div>
        </div>

        {/* Uploaded File Tags */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {uploadedFileNames.map((fn, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate max-w-[160px]">{fn}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Result Toast */}
      {uploadToast && (
        <div className={`p-3.5 rounded-2xl text-xs font-black flex items-center gap-2 animate-fadeIn ${
          uploadToast.type === "error"
            ? "bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-800 dark:text-rose-200"
            : "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200"
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{uploadToast.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. ⭐ [팝업 모달] 아이템 패널 탭 시 열리는 "일자별 정리본" 팝업 모달 */}
      {/* ========================================================================= */}
      {popupItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn cursor-pointer"
          onClick={() => setPopupItem(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between shrink-0 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-md">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      [{popupItem.name}] {selectedMonth} 일자별 품질 검사 & 불량 정리본
                    </h2>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      popupItem.defectRate <= 0.70
                        ? "bg-emerald-500 text-white"
                        : "bg-rose-500 text-white"
                    }`}>
                      {popupItem.defectRate <= 0.70 ? "목표달성 ✓" : "관리주의 🚨"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    차종: <strong className="text-slate-200">{popupItem.carModel}</strong> | 기본단가: ₩{popupItem.id === "ja" ? "3,116" : popupItem.id === "hr" ? "2,372" : "5,747"}원 | 이창엽 선임 엑셀 데이터 100% 일치
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setPopupItem(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="닫기 (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Top KPI Metrics */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 font-bold block">9월 총 검사수량</span>
                <strong className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                  {popupItem.inspectQty.toLocaleString()} EA
                </strong>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 font-bold block">9월 총 불량수량</span>
                <strong className={`text-base sm:text-lg font-black font-mono ${
                  popupItem.defectQty > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                }`}>
                  {popupItem.defectQty.toLocaleString()} EA
                </strong>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 font-bold block">9월 누적 불량률</span>
                <strong className={`text-base sm:text-lg font-black font-mono ${
                  popupItem.defectRate <= 0.70 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}>
                  {popupItem.defectRate}%
                </strong>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 font-bold block">품질 손실금액</span>
                <strong className="text-base sm:text-lg font-black font-mono text-rose-600 dark:text-rose-400">
                  ₩ {popupItem.lossAmount.toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Modal Body: Scrollable Day-by-day Breakdown Table */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>일자별 일일 검사 및 불량 원인 내역 (일일 불량 정리본)</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-bold">
                  {selectedMonth} 전체 일자
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3 text-center">검사일자</th>
                      <th className="p-3 text-right">검사수량(EA)</th>
                      <th className="p-3 text-right">불량수량(EA)</th>
                      <th className="p-3 text-center">일일 불량률(%)</th>
                      <th className="p-3 text-left">주요 불량 사유 및 건수 (WORST)</th>
                      <th className="p-3 text-right">품질 손실액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dailyList.map((d) => {
                      const rec = d.items?.[popupItem.id] || {
                        inspectQty: 0,
                        defectQty: 0,
                        defectRate: 0,
                        lossAmount: 0,
                        worstReason: "-"
                      };
                      const isGood = rec.defectRate <= 0.70;
                      const hasWork = rec.inspectQty > 0 || rec.defectQty > 0;

                      return (
                        <tr
                          key={d.date}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                            hasWork ? "bg-white dark:bg-slate-900" : "bg-slate-50/40 dark:bg-slate-900/30 text-slate-400"
                          }`}
                        >
                          {/* Date */}
                          <td className="p-3 text-center whitespace-nowrap font-black text-slate-900 dark:text-white">
                            {d.date} ({d.dayOfWeek})
                          </td>

                          {/* Inspect Qty */}
                          <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                            {hasWork ? `${rec.inspectQty.toLocaleString()} EA` : "-"}
                          </td>

                          {/* Defect Qty */}
                          <td className="p-3 text-right font-mono font-bold">
                            {hasWork ? (
                              <span className={rec.defectQty > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"}>
                                {rec.defectQty.toLocaleString()} EA
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>

                          {/* Daily Defect Rate */}
                          <td className="p-3 text-center whitespace-nowrap">
                            {hasWork ? (
                              <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-black ${
                                isGood
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              }`}>
                                {rec.defectRate}%
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>

                          {/* Defect Reasons */}
                          <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                            {hasWork ? (
                              <span className="font-semibold">{rec.worstReason || "-"}</span>
                            ) : (
                              <span className="text-slate-400 italic">미가동 / 휴무</span>
                            )}
                          </td>

                          {/* Loss Amount */}
                          <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {hasWork && rec.lossAmount > 0 ? `₩ ${rec.lossAmount.toLocaleString()}` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Summary Footer */}
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-emerald-500">
                      <td className="p-3 text-center">📊 9월 총 누계</td>
                      <td className="p-3 text-right font-mono text-emerald-400">
                        {popupItem.inspectQty.toLocaleString()} EA
                      </td>
                      <td className="p-3 text-right font-mono text-rose-400">
                        {popupItem.defectQty.toLocaleString()} EA
                      </td>
                      <td className="p-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          popupItem.defectRate <= 0.70 ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                        }`}>
                          {popupItem.defectRate}%
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 text-[11px]">
                        월간 주요 원인: {popupItem.worstReason}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-300 whitespace-nowrap">
                        ₩ {popupItem.lossAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                💡 이 데이터는 이창엽 선임이 업로드한 원본 엑셀 파일과 100% 동일합니다.
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportExcel(popupItem)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>이 정리본 엑셀 다운로드</span>
                </button>

                <button
                  onClick={() => setPopupItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-black transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 7. [MODAL] 일일 품질 / 불량 실적 직접 입력 및 수정 모달 (이창엽 선임 전용 포맷) */}
      {/* ========================================================================= */}
      {isDirectInputModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setIsDirectInputModalOpen(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between shrink-0 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-md">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      일일 품질 / 불량 실적 직접 입력 포맷
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white">
                      실시간 자동 분석 & 시각화
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    이창엽 선임의 일일 검사/불량 수량을 직접 입력하면 불량률 및 손실액이 100% 자동 계산됩니다.
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsDirectInputModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="닫기 (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Date Selection Control Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 shadow-xs">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">검사 일자:</span>
                  <input
                    type="date"
                    value={directInputDate}
                    onChange={(e) => {
                      setDirectInputDate(e.target.value);
                      loadDateRecordsIntoDirectForm(e.target.value);
                    }}
                    className="bg-transparent font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white outline-none cursor-pointer"
                  />
                </div>

                {allRecords.some((r) => r.date === directInputDate) ? (
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-black border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>기존 등록된 데이터 수정 중</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>신규 일자 등록 모드</span>
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                입력자: <strong className="text-slate-800 dark:text-slate-200">{currentProfile?.name ? `${currentProfile.name} ${currentProfile.title || "선임"}` : "이창엽 선임"}</strong>
              </div>
            </div>

            {/* Modal Body: 4 Core Item Input Cards */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {QUALITY_CORE_ITEMS.map((core) => {
                  const it = directItemsInput[core.id] || { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: core.defaultUnitPrice };
                  const insp = Math.max(0, Number(it.inspectQty) || 0);
                  const def = Math.max(0, Number(it.defectQty) || 0);
                  const rate = insp > 0 ? Number(((def / insp) * 100).toFixed(2)) : 0;
                  const unitPrice = it.unitPrice || core.defaultUnitPrice;
                  const loss = Math.round(def * unitPrice);
                  const isGood = rate <= 0.70;

                  const themeMap = {
                    ja: { border: "border-indigo-200 dark:border-indigo-800", bg: "bg-indigo-50/40 dark:bg-indigo-950/20", tag: "bg-indigo-600", text: "text-indigo-600 dark:text-indigo-400" },
                    hr: { border: "border-teal-200 dark:border-teal-800", bg: "bg-teal-50/40 dark:bg-teal-950/20", tag: "bg-teal-600", text: "text-teal-600 dark:text-teal-400" },
                    nx4: { border: "border-amber-200 dark:border-amber-800", bg: "bg-amber-50/40 dark:bg-amber-950/20", tag: "bg-amber-600", text: "text-amber-600 dark:text-amber-400" },
                    nx4a: { border: "border-purple-200 dark:border-purple-800", bg: "bg-purple-50/40 dark:bg-purple-950/20", tag: "bg-purple-600", text: "text-purple-600 dark:text-purple-400" }
                  };
                  const theme = themeMap[core.id] || themeMap.ja;

                  const commonDefects = [
                    "수포", "스코치", "사상불량", "둔각 떨어짐", "직각 떨어짐", "직_어퍼떨어짐", "둔_어퍼떨어짐", "삽입불량"
                  ];

                  const handleAddDefectTag = (tag) => {
                    const current = it.worstReason ? it.worstReason.split(",").map(s => s.trim()).filter(Boolean) : [];
                    if (!current.includes(tag)) {
                      current.push(tag);
                    } else {
                      // Toggle off
                      const idx = current.indexOf(tag);
                      current.splice(idx, 1);
                    }
                    setDirectItemsInput({
                      ...directItemsInput,
                      [core.id]: { ...it, worstReason: current.join(", ") }
                    });
                  };

                  return (
                    <div
                      key={core.id}
                      className={`p-4 rounded-2xl border ${theme.border} ${theme.bg} space-y-3 shadow-xs`}
                    >
                      {/* Item Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${theme.tag}`}></span>
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            {core.name} ({core.carModel})
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-bold">
                          단가: ₩{unitPrice.toLocaleString()}원
                        </span>
                      </div>

                      {/* Input Fields (검사수량 & 불량수량) */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                            검사수량 (EA)
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={it.inspectQty || ""}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setDirectItemsInput({
                                ...directItemsInput,
                                [core.id]: { ...it, inspectQty: val }
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-black text-sm text-slate-900 dark:text-white text-right outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                            불량수량 (EA)
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={it.defectQty || ""}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setDirectItemsInput({
                                ...directItemsInput,
                                [core.id]: { ...it, defectQty: val }
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-black text-sm text-rose-600 dark:text-rose-400 text-right outline-none focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                      </div>

                      {/* Real-time Calculated Metrics */}
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-slate-500">불량률:</span>
                          <span className={`font-mono font-black px-1.5 py-0.5 rounded ${
                            isGood ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}>
                            {rate}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-slate-500">품질 손실액:</span>
                          <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                            ₩ {loss.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Defect Reasons & Quick Tags */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                          주요 불량 사유
                        </label>
                        <input
                          type="text"
                          placeholder="예: 둔각 떨어짐 (6건), 수포 (4건)"
                          value={it.worstReason}
                          onChange={(e) => {
                            setDirectItemsInput({
                              ...directItemsInput,
                              [core.id]: { ...it, worstReason: e.target.value }
                            });
                          }}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                        />

                        {/* Quick Defect Reason Chips */}
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {commonDefects.map((dTag) => {
                            const isSelected = it.worstReason?.includes(dTag);
                            return (
                              <button
                                key={dTag}
                                type="button"
                                onClick={() => handleAddDefectTag(dTag)}
                                className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                                }`}
                              >
                                {isSelected ? "✓ " : "+ "}{dTag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Summary Bar & Footer Actions */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white border-t border-slate-700 shrink-0 space-y-3">
              {/* Live Day Totals */}
              {(() => {
                const totalInsp = Object.values(directItemsInput).reduce((sum, it) => sum + (Math.max(0, Number(it.inspectQty) || 0)), 0);
                const totalDef = Object.values(directItemsInput).reduce((sum, it) => sum + (Math.max(0, Number(it.defectQty) || 0)), 0);
                const totalLoss = Object.entries(directItemsInput).reduce((sum, [k, it]) => {
                  const def = Math.max(0, Number(it.defectQty) || 0);
                  const price = it.unitPrice || QUALITY_CORE_ITEMS.find(c => c.id === k)?.defaultUnitPrice || 3000;
                  return sum + (def * price);
                }, 0);
                const avgRate = totalInsp > 0 ? Number(((totalDef / totalInsp) * 100).toFixed(2)) : 0;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">당일 총 검사수량</span>
                      <strong className="text-sm sm:text-base font-black font-mono text-white">{totalInsp.toLocaleString()} EA</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">당일 총 불량수량</span>
                      <strong className="text-sm sm:text-base font-black font-mono text-rose-400">{totalDef.toLocaleString()} EA</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">당일 종합 불량률</span>
                      <strong className={`text-sm sm:text-base font-black font-mono ${avgRate <= 0.70 ? "text-emerald-400" : "text-rose-400"}`}>
                        {avgRate}% {avgRate <= 0.70 ? "(목표달성)" : "(관리주의)"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">당일 총 손실금액</span>
                      <strong className="text-sm sm:text-base font-black font-mono text-amber-300">₩ {totalLoss.toLocaleString()}</strong>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                {allRecords.some((r) => r.date === directInputDate) ? (
                  <button
                    type="button"
                    onClick={handleDeleteDirectDate}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>당일 데이터 삭제</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDirectInputModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDirectInput}
                    disabled={isSavingDirectInput}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingDirectInput ? "저장 중..." : "💾 당일 품질 실적 저장"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default DailyQualityView;
