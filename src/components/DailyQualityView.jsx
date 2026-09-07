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
  FileCheck
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

  // Active Main Tab: "monthly" (매월 월간 종합 분석) vs "daily" (매일 일자별 실적)
  const [activeTab, setActiveTab] = useState("monthly");

  // Real-time Quality Records from Firestore / LocalStorage
  const [allRecords, setAllRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Expanded Item ID in Monthly View
  const [expandedItemId, setExpandedItemId] = useState("hr");
  // Selected Date Filter in Daily View ("all" or "YYYY-MM-DD")
  const [selectedDailyDate, setSelectedDailyDate] = useState("all");

  // Drag and Drop & Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileNames, setUploadedFileNames] = useState([
    "G-RUN 불량율 집계.xlsx",
    "01. 08월 AB동-최종검사 정리.xlsx"
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

  // Compute Monthly Aggregation based on selectedMonth
  const monthlyData = useMemo(() => {
    return getQualityMonthlyAggregation(allRecords, selectedMonth || "2026-08");
  }, [allRecords, selectedMonth]);

  // Compute Daily Aggregation (Date by Date rows) based on selectedMonth
  const dailyList = useMemo(() => {
    return getQualityDailyAggregation(allRecords, selectedMonth || "2026-08");
  }, [allRecords, selectedMonth]);

  // Filtered Daily List based on selectedDailyDate
  const filteredDailyList = useMemo(() => {
    if (selectedDailyDate === "all") return dailyList;
    return dailyList.filter((d) => d.date === selectedDailyDate);
  }, [dailyList, selectedDailyDate]);

  // Highest Defect Rate Item in Current Month
  const maxDefectItem = monthlyData.maxDefectItem;

  // Toggle Item Expansion in Monthly Tab
  const toggleItemExpand = (id) => {
    setExpandedItemId((prev) => (prev === id ? null : id));
  };

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
          message: `${yearMonth} 품질 엑셀 파일 ${fileList.length}개에서 총 ${count}건의 일자별 실적이 중복 없이 안전하게 갱신되었습니다!`
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

  // Export to Excel
  const handleExportExcel = () => {
    const rows = [
      [`${selectedMonth} 품질현황 종합 보고서`],
      ["조회기준월", selectedMonth, "품질관리목표", "0.70% 이하", "출력일시", new Date().toLocaleString("ko-KR")],
      [],
      ["[1. 월간 품목별 불량현황 집계]"],
      ["품목명", "차종", "검사수량(EA)", "불량수량(EA)", "불량률(%)", "상태", "주요 불량 사유", "품질손실금액(원)"]
    ];

    monthlyData.items.forEach((it) => {
      const isMax = it.id === maxDefectItem.id;
      rows.push([
        it.name,
        it.carModel,
        it.inspectQty,
        it.defectQty,
        `${it.defectRate}%`,
        isMax ? "🚨 최고 불량 경고" : it.defectRate <= 0.70 ? "목표 달성" : "주의 관리",
        it.worstReason,
        it.lossAmount
      ]);
    });

    rows.push([]);
    rows.push(["[2. 일자별 세부 검사 및 불량 실적]"]);
    rows.push(["일자", "요일", "총 검사수량(EA)", "총 불량수량(EA)", "불량률(%)", "품목별 세부내역", "손실금액(원)", "담당자"]);

    dailyList.forEach((d) => {
      const itemSummaries = Object.values(d.items || {})
        .map((it) => `${it.itemName}: ${it.inspectQty}EA(불량 ${it.defectQty}EA)`)
        .join(" / ");
      rows.push([
        d.date,
        `${d.dayOfWeek}요일`,
        d.totalInspectQty,
        d.totalDefectQty,
        `${d.defectRate}%`,
        itemSummaries,
        d.totalLossAmount,
        "이창엽 선임"
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "품질현황보고서");
    XLSX.writeFile(wb, `품질현황_${selectedMonth}_${new Date().toISOString().split("T")[0]}.xlsx`);
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
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                중복방지 엔진 가동
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
              <span>품질 관리 목표치: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">0.70% 이하</strong></span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>담당: <strong className="text-slate-700 dark:text-slate-300 font-bold">이창엽 선임 / 이상기 주임</strong></span>
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
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>엑셀 보고서 출력</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ⭐ [핵심 전환] 매월(월간 종합) vs 매일(일자별 실적) 2대 뷰 모드 탭 */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("monthly")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all ${
              activeTab === "monthly"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>📊 매월 월간 종합 분석 ({selectedMonth.slice(5, 7)}월 누적)</span>
          </button>

          <button
            onClick={() => setActiveTab("daily")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all ${
              activeTab === "daily"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>📅 매일 일자별 검사/불량 실적 ({dailyList.length}개 일자)</span>
          </button>
        </div>

        <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
          {activeTab === "monthly" ? "월간 4대 핵심 품목 및 손실금액 종합 집계" : "일자별 검사수량, 불량수량 및 주요 불량 원인 추적"}
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 3. 뷰 모드 1: 📊 [매월 월간 종합 분석] */}
      {/* ========================================================================= */}
      {activeTab === "monthly" && (
        <div className="space-y-4 sm:space-y-5 animate-fadeIn">
          {/* 4 Monthly KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">당월 총 검사수량</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {monthlyData.totalInspectQty.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-400">EA</span>
              </div>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">
                4대 코어 품목 종합
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">당월 총 불량수량</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {monthlyData.totalDefectQty.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-rose-500">EA</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold block">
                수포 / 어퍼떨어짐 / 스코치 외
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">당월 종합 불량률</span>
              <div className="flex items-baseline justify-between">
                <span className={`text-xl sm:text-2xl font-black font-mono ${
                  monthlyData.overallDefectRate > 0.70 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {monthlyData.overallDefectRate}%
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  목표 0.70%
                </span>
              </div>
              <span className={`text-[10px] font-black block ${
                monthlyData.overallDefectRate > 0.70 ? "text-rose-500" : "text-emerald-500"
              }`}>
                {monthlyData.overallDefectRate > 0.70 ? "⚠️ 관리목표 초과 (중점개선)" : "✓ 관리목표 달성"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">품질 손실 금액</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  ₩ {monthlyData.totalLossAmount.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold block">
                불량 품목별 단가 기준 산출
              </span>
            </div>
          </div>

          {/* 4 Core Items Comparison with Smooth Expansion */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    4대 코어 품목별 불량률(%) 및 검사실적 비교
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    각 항목을 <strong>클릭</strong>하면 상세 검사 수량, 주요 불량 원인 및 일자별 실적 추이가 펼쳐집니다.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold shrink-0">
                <span className="flex items-center gap-1 text-emerald-600 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>목표달성(≤0.7%)</span>
                </span>
                <span className="flex items-center gap-1 text-rose-600 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  <span>최고불량</span>
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {monthlyData.items.map((item) => {
                const isMaxRate = item.id === maxDefectItem.id;
                const isGood = item.defectRate <= 0.70;
                const maxRate = 1.6;
                const barWidthPct = Math.min(100, Math.max(8, (item.defectRate / maxRate) * 100));
                const isExpanded = expandedItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isExpanded
                        ? isMaxRate
                          ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-400 ring-2 ring-rose-500/20 shadow-md"
                          : "bg-slate-50/90 dark:bg-slate-800/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-md"
                        : isMaxRate
                        ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 hover:border-rose-400"
                        : "bg-slate-50/40 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    {/* Header Row (Clickable) */}
                    <div
                      onClick={() => toggleItemExpand(item.id)}
                      className="p-3.5 sm:p-4 cursor-pointer flex flex-col gap-2 select-none"
                    >
                      <div className="flex items-center justify-between text-xs font-black">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 dark:text-white font-extrabold text-sm sm:text-base">
                            {item.name}
                          </span>
                          {isMaxRate && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black flex items-center gap-1 shadow-sm">
                              <AlertTriangle className="w-3 h-3" />
                              <span>최고 불량 🚨</span>
                            </span>
                          )}
                          {isGood && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black">
                              목표달성
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-base sm:text-xl font-black font-mono ${
                            isMaxRate
                              ? "text-rose-600 dark:text-rose-400"
                              : isGood
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}>
                            {item.defectRate}%
                          </span>
                          <div className="p-1 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200/70 dark:bg-slate-700/70 h-3 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isMaxRate
                              ? "bg-gradient-to-r from-rose-600 to-red-500 shadow-sm shadow-rose-500/30"
                              : isGood
                              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                              : "bg-gradient-to-r from-amber-500 to-orange-400"
                          }`}
                          style={{ width: `${barWidthPct}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Expandable Detailed Breakdown */}
                    {isExpanded && (
                      <div className="px-3.5 pb-4 sm:px-4 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 space-y-3 animate-fadeIn">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] text-slate-400 font-bold block">총 검사수량</span>
                            <strong className="text-sm font-black text-slate-900 dark:text-white font-mono">
                              {item.inspectQty.toLocaleString()} EA
                            </strong>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] text-slate-400 font-bold block">총 불량수량</span>
                            <strong className={`text-sm font-black font-mono ${isMaxRate ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
                              {item.defectQty.toLocaleString()} EA
                            </strong>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] text-slate-400 font-bold block">품목 불량률</span>
                            <strong className={`text-sm font-black font-mono ${isMaxRate ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"}`}>
                              {item.defectRate}%
                            </strong>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] text-slate-400 font-bold block">품질 손실금액</span>
                            <strong className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                              ₩ {item.lossAmount.toLocaleString()}
                            </strong>
                          </div>
                        </div>

                        {/* Worst Defect Reasons Box */}
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                          <strong className="text-slate-900 dark:text-white font-black block mb-1">
                            주요 불량 원인 및 유형:
                          </strong>
                          <span className="text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                            {item.worstReason}
                          </span>
                        </div>

                        {/* Daily Trend for this item */}
                        {item.dailyRecords && item.dailyRecords.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 block">일자별 검사/불량 추이 (최근 등록 순):</span>
                            <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 text-center text-[10px]">
                              {item.dailyRecords.slice(0, 6).map((d, i) => (
                                <div key={i} className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                                  <span className="text-slate-400 block font-bold">{d.date.slice(5)} ({d.dayOfWeek})</span>
                                  <strong className="text-slate-800 dark:text-slate-200 block font-mono">{d.inspectQty}EA</strong>
                                  <span className={`font-black font-mono ${d.defectRate > 0.70 ? "text-rose-600 font-extrabold" : "text-emerald-600"}`}>
                                    {d.defectRate}% ({d.defectQty}건)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. 뷰 모드 2: 📅 [매일 일자별 검사/불량 실적] */}
      {/* ========================================================================= */}
      {activeTab === "daily" && (
        <div className="space-y-4 sm:space-y-5 animate-fadeIn">
          {/* Daily Filter & Summary Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    {selectedMonth} 일자별 세부 실적 목록 (총 {dailyList.length}일자 등록됨)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    매일 등록된 검사 실적과 불량률이 일자별로 중복 없이 정리되어 있습니다.
                  </p>
                </div>
              </div>

              {/* Date Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setSelectedDailyDate("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors shrink-0 ${
                    selectedDailyDate === "all"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  전체 ({dailyList.length}일)
                </button>
                {dailyList.slice(0, 8).map((d) => (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDailyDate(d.date)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                      selectedDailyDate === d.date
                        ? "bg-indigo-600 text-white font-black"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {d.date.slice(5)} ({d.dayOfWeek})
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-600 dark:text-slate-300">
                    <th className="p-3">검사일자</th>
                    <th className="p-3">당일 총 검사수량</th>
                    <th className="p-3">당일 총 불량수량</th>
                    <th className="p-3">당일 불량률</th>
                    <th className="p-3">품목별 실적 요약 (검사 / 불량)</th>
                    <th className="p-3">손실금액</th>
                    <th className="p-3">관리상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDailyList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-6 text-center text-slate-400 font-bold">
                        등록된 일자별 품질 데이터가 없습니다. 하단에서 엑셀 파일을 업로드하세요.
                      </td>
                    </tr>
                  ) : (
                    filteredDailyList.map((d) => {
                      const isOverTarget = d.defectRate > 0.70;
                      return (
                        <tr key={d.date} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-black text-slate-900 dark:text-white whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              <span>{d.date} ({d.dayOfWeek})</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-black text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {d.totalInspectQty.toLocaleString()} EA
                          </td>
                          <td className="p-3 font-mono font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            {d.totalDefectQty.toLocaleString()} EA
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-md ${
                              isOverTarget
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}>
                              {d.defectRate}%
                            </span>
                          </td>
                          <td className="p-3 text-[11px] text-slate-600 dark:text-slate-300">
                            <div className="flex flex-wrap gap-1.5">
                              {Object.values(d.items || {}).map((it) => (
                                <span
                                  key={it.itemId}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold"
                                >
                                  <strong>{it.itemName}</strong>: {it.inspectQty}EA ({it.defectQty}불량)
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            ₩ {d.totalLossAmount.toLocaleString()}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {isOverTarget ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white">
                                주의관리 🚨
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white">
                                정상양호 ✓
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ⭐ [공통 하단] 품질 엑셀 2개 파일 드래그 앤 드롭 업로드 영역 */}
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
              품질 현황 엑셀 파일을 여기에 <strong>드래그하여 놓거나 클릭</strong>하여 업로드하면, 일자별로 <strong>중복 없이 자동 동기화(Upsert)</strong>됩니다.
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
    </div>
  );
};
export default DailyQualityView;
