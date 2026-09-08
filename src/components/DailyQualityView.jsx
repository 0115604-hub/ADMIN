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
  Eye
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import { useCurrency } from "../context/CurrencyContext";
import * as XLSX from "xlsx";
import {
  subscribeQualityRecords,
  saveQualityRecordsBatch,
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

  // ⭐ Popup Modal State for Item-specific Daily Breakdown
  const [popupItem, setPopupItem] = useState(null);

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

          {/* Export Excel Button */}
          <button
            onClick={() => handleExportExcel()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>엑셀 보고서 출력</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ⭐ 4대 코어 품목별 핵심 패널 (탭하면 일자별 정리본 팝업) */}
      {/* ========================================================================= */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-400">
          <span>👇 각 아이템 패널을 <strong>탭(클릭)</strong>하면 <strong>일자별 상세 정리본 팝업</strong>이 열립니다.</span>
          <span className="hidden sm:inline">9월 누계 실적 기준</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {monthlyData.items.map((it) => {
            const isGood = it.defectRate <= 0.70;
            return (
              <div
                key={it.id}
                onClick={() => setPopupItem(it)}
                className="p-4 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 hover:shadow-lg hover:scale-[1.01] group shadow-xs"
              >
                {/* Header inside Panel */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    {it.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      isGood
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    }`}>
                      {isGood ? "목표달성" : "주의관리"}
                    </span>
                    <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Eye className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Defect Rate Highlight */}
                <div className="flex items-baseline justify-between my-1">
                  <span className={`text-2xl sm:text-3xl font-black font-mono ${
                    isGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}>
                    {it.defectRate}%
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    불량률
                  </span>
                </div>

                {/* Details: Inspect / Defect */}
                <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">검사수량</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                      {it.inspectQty.toLocaleString()} EA
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">불량수량</span>
                    <strong className={`font-mono font-bold ${it.defectQty > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-slate-200"}`}>
                      {it.defectQty.toLocaleString()} EA
                    </strong>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center justify-between">
                  <span className="truncate">원인: <strong className="font-semibold text-slate-700 dark:text-slate-300">{it.worstReason}</strong></span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0 text-[10px] ml-1">상세보기 ❯</span>
                </div>
              </div>
            );
          })}
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md">
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
                  <Calendar className="w-4 h-4 text-indigo-600" />
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
                    <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-indigo-500">
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-md shadow-indigo-500/20"
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
    </div>
  );
};
export default DailyQualityView;
