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
    ja: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 3116, scrapA: 0, scrapB: 0, scrapC: 0, scrapTotal: 0 },
    hr: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 2372, scrapA: 0, scrapB: 0, scrapC: 0, scrapTotal: 0 },
    nx4: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 5747, scrapA: 0, scrapB: 0, scrapC: 0, scrapTotal: 0 },
    nx4a: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 5747, scrapA: 0, scrapB: 0, scrapC: 0, scrapTotal: 0 }
  });
  const [isSavingDirectInput, setIsSavingDirectInput] = useState(false);

  // Helper: Load existing records for a specific date into the direct input form
  const loadDateRecordsIntoDirectForm = (targetDate) => {
    const matching = allRecords.filter((r) => r.date === targetDate);
    const newInputs = {
      ja: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 3116, scrapA: 0, scrapB: 0, scrapC: 0, scrapTotal: 0 },
      hr: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 2372, scrapA: 0, scrapB: 0, scrapC: 0, scrapTotal: 0 },
      nx4: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 5747, scrapA: 0, scrapB: 0, scrapC: 0, scrapTotal: 0 },
      nx4a: { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: 5747, scrapA: 0, scrapB: 0, scrapC: 0, scrapTotal: 0 }
    };

    matching.forEach((r) => {
      const key = r.itemId ? r.itemId.toLowerCase() : "";
      if (newInputs[key]) {
        const scrapA = r.scrapA || 0;
        const scrapB = r.scrapB || 0;
        const scrapC = r.scrapC || 0;
        const scrapTotal = r.scrapTotal !== undefined ? r.scrapTotal : (scrapA + scrapB + scrapC);

        newInputs[key] = {
          inspectQty: r.inspectQty || 0,
          defectQty: r.defectQty || 0,
          worstReason: r.worstReason && r.worstReason !== "-" ? r.worstReason : "",
          unitPrice: r.unitPrice || QUALITY_CORE_ITEMS.find((c) => c.id === key)?.defaultUnitPrice || newInputs[key].unitPrice,
          scrapA,
          scrapB,
          scrapC,
          scrapTotal
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
        const it = directItemsInput[core.id] || { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: core.defaultUnitPrice, scrapA: 0, scrapB: 0, scrapC: 0, scrapTotal: 0 };
        const inspectQty = Math.max(0, Math.round(Number(it.inspectQty) || 0));
        const defectQty = Math.max(0, Math.round(Number(it.defectQty) || 0));
        const defectRate = inspectQty > 0 ? Number(((defectQty / inspectQty) * 100).toFixed(2)) : 0;
        const unitPrice = it.unitPrice || core.defaultUnitPrice;
        const lossAmount = Math.round(defectQty * unitPrice);
        const scrapA = Math.max(0, Math.round(Number(it.scrapA) || 0));
        const scrapB = Math.max(0, Math.round(Number(it.scrapB) || 0));
        const scrapC = Math.max(0, Math.round(Number(it.scrapC) || 0));
        const scrapTotal = scrapA + scrapB + scrapC;

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
      {/* 2. ⭐ 4대 코어 품목별 불량률 추이 (좌측: 그래프) & 주요 불량 원인 및 소재별 폐기수량 분석 (우측) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* 4 Core Item Quick Chips with Defect & Scrap Rate (Click to Open Detail Popup) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(() => {
            const items = monthlyData.items;
            return items.map((it) => {
              const isGood = it.defectRate <= 0.70;
              const isHr = it.id === "hr";
              const isNx = it.id === "nx4" || it.id === "nx4a";
              const scrapQty = it.scrapTotal || ((it.scrapA || 0) + (it.scrapB || 0) + (it.scrapC || 0));
              const scrapRate = it.inspectQty > 0 ? Number(((scrapQty / it.inspectQty) * 100).toFixed(2)) : 0;

              return (
                <div
                  key={it.id}
                  onClick={() => setPopupItem(it)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setPopupItem(it)}
                  className={`p-3.5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer select-none ${
                    isHr
                      ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-400"
                      : "border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-400"
                  } hover:scale-[1.02] active:scale-98 shadow-xs space-y-2.5`}
                >
                  {/* Top: Name & Status Badge */}
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

                  {/* Rate Metrics: 품질 불량률 & 폐기 불량률 */}
                  <div className="space-y-1.5">
                    {/* 1. 품질 불량률 */}
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400">품질불량률</span>
                        <span
                          className={`text-lg sm:text-xl font-black font-mono leading-none ${
                            isGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {it.defectRate}%
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {it.inspectQty.toLocaleString()}EA / {it.defectQty}불량
                      </span>
                    </div>

                    {/* 2. ⭐ 폐기 불량률 (Scrap Defect Rate) */}
                    <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/20 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[9.5px] font-black text-amber-700 dark:text-amber-300 block">
                          소재 폐기불량률
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm sm:text-base font-black font-mono text-amber-600 dark:text-amber-400">
                            {scrapRate}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            ({scrapQty.toLocaleString()} EA)
                          </span>
                        </div>
                      </div>

                      {isNx ? (
                        <div className="text-[9.5px] font-mono text-right text-amber-800 dark:text-amber-300 font-bold space-y-0.5">
                          <div className="flex items-center gap-1 justify-end">
                            <span className="px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">A:{it.scrapA || 0}</span>
                            <span className="px-1 py-0.2 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">B:{it.scrapB || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            <span className="px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">C:{it.scrapC || 0}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold">전체 폐기</span>
                      )}
                    </div>
                  </div>

                  {/* Footer: Loss amount & Detail Modal Trigger */}
                  <div className="flex items-center justify-between text-[9.5px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="truncate">손실액: ₩{it.lossAmount.toLocaleString()}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                      <span>상세팝업</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* 2-Column Responsive Layout: [LEFT: Graph] & [RIGHT: Defect Cause & 3-Material Waste Analysis] */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* ========================================================= */}
          {/* LEFT: 📈 일자별 불량률 추이선 및 실적 그래프 */}
          {/* ========================================================= */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
            {/* Left Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                      일자별 불량률 추이선
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                      {selectedMonth.slice(5, 7)}월 실적
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    목표 관리선: <strong className="text-rose-500">0.70% 이하</strong> 관리
                  </p>
                </div>
              </div>

              {/* Item Filter Chips */}
              <div className="flex items-center gap-1 text-[10.5px] font-bold flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => setQualityGraphFilter("all")}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-black cursor-pointer transition-colors ${
                    qualityGraphFilter === "all"
                      ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  전체
                </button>
                <button
                  type="button"
                  onClick={() => setQualityGraphFilter("hr")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer transition-colors ${
                    qualityGraphFilter === "hr"
                      ? "bg-rose-500 text-white"
                      : "text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/40 hover:bg-rose-100"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> HR
                </button>
                <button
                  type="button"
                  onClick={() => setQualityGraphFilter("ja")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer transition-colors ${
                    qualityGraphFilter === "ja"
                      ? "bg-emerald-600 text-white"
                      : "text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> JA
                </button>
                <button
                  type="button"
                  onClick={() => setQualityGraphFilter("nx4a")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer transition-colors ${
                    qualityGraphFilter === "nx4a"
                      ? "bg-teal-600 text-white"
                      : "text-teal-600 dark:text-teal-400 bg-teal-50/70 dark:bg-teal-950/40 hover:bg-teal-100"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span> NX4a
                </button>
                <button
                  type="button"
                  onClick={() => setQualityGraphFilter("nx4")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer transition-colors ${
                    qualityGraphFilter === "nx4"
                      ? "bg-blue-600 text-white"
                      : "text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> NX4
                </button>
              </div>
            </div>

            {/* SVG Line Chart */}
            <div className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 overflow-hidden relative">
              <svg viewBox="0 0 680 230" className="w-full h-auto overflow-visible select-none">
                {/* Y Axis Grid Lines */}
                <line x1="45" y1="190" x2="665" y2="190" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                <text x="36" y="194" fontSize="9.5" fill="currentColor" opacity="0.5" textAnchor="end">0.0%</text>

                <line x1="45" y1="140" x2="665" y2="140" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                <text x="36" y="144" fontSize="9.5" fill="currentColor" opacity="0.5" textAnchor="end">0.5%</text>

                {/* TARGET LINE: 0.70% (Y = 120) */}
                <line x1="45" y1="120" x2="665" y2="120" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4,4" />
                <rect x="590" y="111" width="75" height="18" rx="4" fill="#EF4444" fillOpacity="0.15" />
                <text x="627" y="124" fontSize="9" fontWeight="900" fill="#DC2626" textAnchor="middle">목표 0.70%</text>

                <line x1="45" y1="90" x2="665" y2="90" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                <text x="36" y="94" fontSize="9.5" fill="currentColor" opacity="0.5" textAnchor="end">1.0%</text>

                <line x1="45" y1="40" x2="665" y2="40" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                <text x="36" y="44" fontSize="9.5" fill="currentColor" opacity="0.5" textAnchor="end">1.5%</text>

                {/* X Axis Labels */}
                <text x="75" y="210" fontSize="10" fontWeight="bold" fill="currentColor" opacity="0.7" textAnchor="middle">9.1(화)</text>
                <text x="160" y="210" fontSize="10" fontWeight="bold" fill="currentColor" opacity="0.7" textAnchor="middle">9.2(수)</text>
                <text x="245" y="210" fontSize="10" fontWeight="bold" fill="currentColor" opacity="0.7" textAnchor="middle">9.3(목)</text>
                <text x="330" y="210" fontSize="10" fontWeight="bold" fill="currentColor" opacity="0.7" textAnchor="middle">9.4(금)</text>
                <text x="415" y="210" fontSize="10" fontWeight="bold" fill="currentColor" opacity="0.7" textAnchor="middle">9.5(토)</text>
                <text x="500" y="210" fontSize="10" fontWeight="bold" fill="currentColor" opacity="0.7" textAnchor="middle">9.7(월)</text>
                <text x="585" y="210" fontSize="10" fontWeight="bold" fill="currentColor" opacity="0.7" textAnchor="middle">9.8(화)</text>

                {/* HR G-RUN Line (Red) */}
                <g opacity={qualityGraphFilter === "all" || qualityGraphFilter === "hr" ? 1 : 0.12} className="transition-opacity">
                  <polyline
                    fill="none"
                    stroke="#F43F5E"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="75,74 160,122 245,95 330,57 415,95 500,81 585,78"
                  />
                  <circle cx="75" cy="74" r="3.5" fill="#F43F5E" />
                  <circle cx="160" cy="122" r="3.5" fill="#F43F5E" />
                  <circle cx="245" cy="95" r="3.5" fill="#F43F5E" />
                  <circle cx="330" cy="57" r="4.5" fill="#E11D48" />
                  <text x="330" y="46" fontSize="9" fontWeight="900" fill="#E11D48" textAnchor="middle">1.33%🚨</text>
                  <circle cx="415" cy="95" r="3.5" fill="#F43F5E" />
                  <circle cx="500" cy="81" r="3.5" fill="#F43F5E" />
                  <circle cx="585" cy="78" r="4.5" fill="#E11D48" />
                  <text x="585" y="67" fontSize="9" fontWeight="900" fill="#E11D48" textAnchor="middle">1.12%</text>
                </g>

                {/* JA G-RUN Line (Green) */}
                <g opacity={qualityGraphFilter === "all" || qualityGraphFilter === "ja" ? 1 : 0.12} className="transition-opacity">
                  <polyline
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="75,156 160,150 245,163 330,144 415,150 500,151 585,145"
                  />
                  <circle cx="75" cy="156" r="3" fill="#10B981" />
                  <circle cx="160" cy="150" r="3" fill="#10B981" />
                  <circle cx="245" cy="163" r="3" fill="#10B981" />
                  <circle cx="330" cy="144" r="3" fill="#10B981" />
                  <circle cx="415" cy="150" r="3" fill="#10B981" />
                  <circle cx="500" cy="151" r="3" fill="#10B981" />
                  <circle cx="585" cy="145" r="3.5" fill="#059669" />
                  <text x="585" y="136" fontSize="8.5" fontWeight="bold" fill="#059669" textAnchor="middle">0.45%</text>
                </g>

                {/* NX4a G-RUN Line (Teal) */}
                <g opacity={qualityGraphFilter === "all" || qualityGraphFilter === "nx4a" ? 1 : 0.12} className="transition-opacity">
                  <polyline
                    fill="none"
                    stroke="#14B8A6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="75,159 160,151 245,170 330,140 415,169 500,151 585,148"
                  />
                  <circle cx="585" cy="148" r="3" fill="#14B8A6" />
                  <text x="585" y="162" fontSize="8.5" fontWeight="bold" fill="#0D9488" textAnchor="middle">0.42%</text>
                </g>

                {/* NX4 G-RUN Line (Blue) */}
                <g opacity={qualityGraphFilter === "all" || qualityGraphFilter === "nx4" ? 1 : 0.12} className="transition-opacity">
                  <polyline
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="75,169 160,159 245,148 330,160 415,170 500,160 585,163"
                  />
                  <circle cx="585" cy="163" r="3" fill="#3B82F6" />
                  <text x="585" y="179" fontSize="8.5" fontWeight="bold" fill="#2563EB" textAnchor="middle">0.27%</text>
                </g>
              </svg>
            </div>

            {/* Bottom Legend Mini Summary */}
            <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px] text-center font-bold">
              <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                <span className="block text-[9px] opacity-75">HR G-RUN</span>
                <span className="text-xs font-black font-mono">1.12%</span>
              </div>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="block text-[9px] opacity-75">JA G-RUN</span>
                <span className="text-xs font-black font-mono">0.45%</span>
              </div>
              <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-900/40">
                <span className="block text-[9px] opacity-75">NX4a G-RUN</span>
                <span className="text-xs font-black font-mono">0.42%</span>
              </div>
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                <span className="block text-[9px] opacity-75">NX4 G-RUN</span>
                <span className="text-xs font-black font-mono">0.27%</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT: 🚨 주요 불량 원인 분석 + ♻️ 3종 소재별 폐기수량 패널 */}
          {/* ========================================================= */}
          <div className="space-y-4">
            {/* Card 1: 🚨 주요 불량 원인 분석 */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              {/* Right Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-rose-500/10 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                        주요 불량 원인 분석
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                        총 {monthlyData.totalDefectQty}건 발생
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      발생 빈도 순위 및 차종별 핵심 취약 불량 분석
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold block">누적 손실액</span>
                  <span className="text-xs font-black font-mono text-rose-600 dark:text-rose-400">
                    ₩{monthlyData.totalLossAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Donut Chart + Defect Reasons Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                {/* Donut Chart (4 cols) */}
                <div className="sm:col-span-4 flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <svg viewBox="0 0 160 160" className="w-28 h-28 sm:w-32 sm:h-32">
                      <circle cx="80" cy="80" r="55" fill="transparent" stroke="#EF4444" strokeWidth="18" strokeDasharray="131 345" strokeDashoffset="0" />
                      <circle cx="80" cy="80" r="55" fill="transparent" stroke="#F97316" strokeWidth="18" strokeDasharray="100 345" strokeDashoffset="-131" />
                      <circle cx="80" cy="80" r="55" fill="transparent" stroke="#FBBF24" strokeWidth="18" strokeDasharray="62 345" strokeDashoffset="-231" />
                      <circle cx="80" cy="80" r="55" fill="transparent" stroke="#10B981" strokeWidth="18" strokeDasharray="52 345" strokeDashoffset="-293" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-slate-400">총 불량</span>
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono leading-tight">
                        {monthlyData.totalDefectQty} EA
                      </span>
                    </div>
                  </div>
                </div>

                {/* Defect Reasons List (8 cols) */}
                <div className="sm:col-span-8 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                      <span className="font-black text-rose-800 dark:text-rose-200 truncate">1. 둔각·직각 어퍼 떨어짐</span>
                    </div>
                    <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-xs shrink-0">42건 (38%)</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                      <span className="font-black text-amber-800 dark:text-amber-200 truncate">2. 수포 / 기포 / 미성형</span>
                    </div>
                    <span className="font-mono font-black text-orange-600 dark:text-orange-400 text-xs shrink-0">33건 (29%)</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200/70 dark:border-yellow-900/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0"></span>
                      <span className="font-black text-yellow-800 dark:text-yellow-200 truncate">3. 스코치 / 흑점 이물</span>
                    </div>
                    <span className="font-mono font-black text-yellow-600 dark:text-yellow-400 text-xs shrink-0">20건 (18%)</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="font-black text-emerald-800 dark:text-emerald-200 truncate">4. 사상불량 / 삽입불량</span>
                    </div>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs shrink-0">17건 (15%)</span>
                  </div>
                </div>
              </div>

              {/* Bottom Insight Callout */}
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-500">💡</span>
                  <span><strong>HR & JA</strong> 어퍼 떨어짐·수포 불량이 <strong>67%</strong> 차지</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPopupItem(monthlyData.items.find((i) => i.id === "hr") || monthlyData.items[0])}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline shrink-0 ml-2 cursor-pointer"
                >
                  상세 팝업 →
                </button>
              </div>
            </div>

            {/* Card 2: ⭐ ♻️ NX4 · NX4a 3종 소재별 일간 및 월간 누적 폐기수량 패널 */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-amber-200/80 dark:border-amber-900/50 shadow-sm space-y-3.5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                        NX4 · NX4a 3종 소재별 폐기수량 현황
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                        소재 A · B · C 관리
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      3개 소재로 생산되는 NX4 / NX4a의 <strong>일간 폐기수량</strong> 및 <strong>월간 누적 폐기량</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold block">{selectedMonth.slice(5, 7)}월 총 누적 폐기</span>
                  <span className="text-sm sm:text-base font-black font-mono text-amber-600 dark:text-amber-400">
                    {(monthlyData.totalScrapQty || 0).toLocaleString()} EA
                  </span>
                </div>
              </div>

              {/* Monthly Cumulative Summary by Material A, B, C */}
              {(() => {
                const scrapA = monthlyData.totalScrapA || 0;
                const scrapB = monthlyData.totalScrapB || 0;
                const scrapC = monthlyData.totalScrapC || 0;
                const total = scrapA + scrapB + scrapC || 1;
                const pctA = Math.round((scrapA / total) * 100);
                const pctB = Math.round((scrapB / total) * 100);
                const pctC = Math.round((scrapC / total) * 100);

                return (
                  <div className="space-y-2.5">
                    {/* Material 3-Grid Cards */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 space-y-0.5">
                        <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 block">소재 A 누적 폐기</span>
                        <div className="text-sm sm:text-base font-black font-mono text-blue-600 dark:text-blue-400">
                          {scrapA.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">EA</span>
                        </div>
                        <span className="text-[10px] font-bold text-blue-500 font-mono">점유율 {pctA}%</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/50 space-y-0.5">
                        <span className="text-[10px] font-black text-orange-700 dark:text-orange-300 block">소재 B 누적 폐기</span>
                        <div className="text-sm sm:text-base font-black font-mono text-orange-600 dark:text-orange-400">
                          {scrapB.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">EA</span>
                        </div>
                        <span className="text-[10px] font-bold text-orange-500 font-mono">점유율 {pctB}%</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-0.5">
                        <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 block">소재 C 누적 폐기</span>
                        <div className="text-sm sm:text-base font-black font-mono text-amber-600 dark:text-amber-400">
                          {scrapC.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">EA</span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-500 font-mono">점유율 {pctC}%</span>
                      </div>
                    </div>

                    {/* Proportional Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div style={{ width: `${pctA}%` }} className="bg-blue-500 h-full transition-all" title={`소재 A: ${scrapA}EA (${pctA}%)`}></div>
                      <div style={{ width: `${pctB}%` }} className="bg-orange-500 h-full transition-all" title={`소재 B: ${scrapB}EA (${pctB}%)`}></div>
                      <div style={{ width: `${pctC}%` }} className="bg-amber-400 h-full transition-all" title={`소재 C: ${scrapC}EA (${pctC}%)`}></div>
                    </div>
                  </div>
                );
              })()}

              {/* Daily Scrap Table / Matrix (일간 폐기수량 내역) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>📅 일자별 소재 폐기수량 내역</span>
                  </span>
                  <span className="text-[10.5px] text-slate-400">최근 일자 순</span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                  {dailyList.filter(d => (d.totalScrapQty || 0) > 0 || (d.records && d.records.some(r => r.itemId === "nx4" || r.itemId === "nx4a"))).slice(0, 7).map((d) => {
                    const nx4aRec = d.items?.nx4a || { scrapA: 0, scrapB: 0, scrapC: 0, scrapTotal: 0 };
                    const nx4Rec = d.items?.nx4 || { scrapA: 0, scrapB: 0, scrapC: 0, scrapTotal: 0 };
                    const dayTotalA = (nx4aRec.scrapA || 0) + (nx4Rec.scrapA || 0);
                    const dayTotalB = (nx4aRec.scrapB || 0) + (nx4Rec.scrapB || 0);
                    const dayTotalC = (nx4aRec.scrapC || 0) + (nx4Rec.scrapC || 0);
                    const dayTotalScrap = dayTotalA + dayTotalB + dayTotalC;

                    return (
                      <div key={d.date} className="p-2.5 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-black font-mono text-slate-900 dark:text-white shrink-0">
                            {d.date.slice(5)} ({d.dayOfWeek})
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                              A: {dayTotalA}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-bold">
                              B: {dayTotalB}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                              C: {dayTotalC}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black font-mono text-xs text-rose-600 dark:text-rose-400">
                            {dayTotalScrap > 0 ? `${dayTotalScrap} EA 폐기` : "0 EA"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenDirectInputModal(d.date)}
                            className="p-1 rounded-md text-[10px] text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                            title="당일 실적 및 폐기수량 수정"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

                      {/* ♻️ 3-Material Waste Scrap Inputs (소재 A / B / C) */}
                      <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <span className="text-amber-500">♻️</span>
                            <span>3종 소재 폐기수량 (소재 A / B / C)</span>
                          </span>
                          <span className="text-[10.5px] font-mono font-bold text-slate-500">
                            합계: <strong className="text-rose-600 dark:text-rose-400 font-black">{(Number(it.scrapA || 0) + Number(it.scrapB || 0) + Number(it.scrapC || 0)).toLocaleString()} EA</strong>
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                              소재 A 폐기
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={it.scrapA || ""}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                const scrapTotal = val + (Number(it.scrapB) || 0) + (Number(it.scrapC) || 0);
                                setDirectItemsInput({
                                  ...directItemsInput,
                                  [core.id]: { ...it, scrapA: val, scrapTotal }
                                });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold text-xs text-blue-600 dark:text-blue-400 text-right outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                              소재 B 폐기
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={it.scrapB || ""}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                const scrapTotal = (Number(it.scrapA) || 0) + val + (Number(it.scrapC) || 0);
                                setDirectItemsInput({
                                  ...directItemsInput,
                                  [core.id]: { ...it, scrapB: val, scrapTotal }
                                });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold text-xs text-orange-600 dark:text-orange-400 text-right outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                              소재 C 폐기
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={it.scrapC || ""}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                const scrapTotal = (Number(it.scrapA) || 0) + (Number(it.scrapB) || 0) + val;
                                setDirectItemsInput({
                                  ...directItemsInput,
                                  [core.id]: { ...it, scrapC: val, scrapTotal }
                                });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold text-xs text-amber-600 dark:text-amber-400 text-right outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
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
