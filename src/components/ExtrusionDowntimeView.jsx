import React, { useState, useEffect, useMemo } from "react";
import {
  Factory,
  BarChart3,
  Calendar,
  Clock,
  Scale,
  Activity,
  Download,
  AlertCircle,
  Search,
  CheckCircle2,
  TrendingUp,
  Layers,
  FileSpreadsheet,
  Flame,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight
} from "lucide-react";
import ExtrusionProductionTab from "./extrusion/ExtrusionProductionTab";
import {
  subscribeToExtrusionReports,
  getLocalExtrusionReports,
  calculateExtrusionMetrics,
  exportExtrusionReportsToExcel,
  EXTRUSION_LINE_OPTIONS,
  DOWNTIME_CATEGORIES
} from "../services/extrusionProductionService";
import { useAuth } from "../context/AuthContext";

export const LINE_PRESETS = [
  { id: "all", name: "전체 라인", shortName: "전체", badge: "ALL", color: "teal", themeColor: "teal" },
  { id: "1호기", lineId: "pcm1", name: "1호기 (PCM #1)", shortName: "1호기", badge: "1호기", color: "teal", themeColor: "teal" },
  { id: "2호기", lineId: "pcm2", name: "2호기 (PCM #2)", shortName: "2호기", badge: "2호기", color: "blue", themeColor: "blue" },
  { id: "3호기", lineId: "pcm3", name: "3호기 (PCM #3)", shortName: "3호기", badge: "3호기", color: "amber", themeColor: "amber" },
  { id: "4호기", lineId: "tpe", name: "4호기 (TPE / PVC)", shortName: "4호기", badge: "4호기", color: "purple", themeColor: "purple" }
];

const PERIOD_OPTIONS = [
  { id: "all", label: "전체 기간" },
  { id: "this_month", label: "당월 (10월)" },
  { id: "last_month", label: "전월 (9월)" },
  { id: "recent_30", label: "최근 30일" },
  { id: "recent_7", label: "최근 7일" }
];

export const ExtrusionDowntimeView = () => {
  const { currentProfile } = useAuth();

  // SubTab state: "production" (작업일보 관리대장) vs "downtime" (비가동 상세분석)
  const [activeSubTab, setActiveSubTab] = useState(() => {
    try {
      const saved = localStorage.getItem("factory_extrusion_active_subtab");
      if (saved) return saved;
    } catch (e) {}
    return "production";
  });

  // Selected line filter: "all", "1호기", "2호기", "3호기", "4호기"
  const [selectedLine, setSelectedLine] = useState(() => {
    try {
      const saved = localStorage.getItem("factory_extrusion_selected_line_v2");
      if (saved) return saved;
    } catch (e) {}
    return "all";
  });

  // Period / Date filter
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Real-time Extrusion Reports from App
  const [reports, setReports] = useState(() => getLocalExtrusionReports());

  // Subscribe to real-time work reports registered in app
  useEffect(() => {
    const unsub = subscribeToExtrusionReports((data) => {
      if (Array.isArray(data)) {
        setReports(data);
      }
    });
    return () => unsub();
  }, []);

  // Save subtab and line filter to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("factory_extrusion_active_subtab", activeSubTab);
    } catch (e) {}
  }, [activeSubTab]);

  useEffect(() => {
    try {
      localStorage.setItem("factory_extrusion_selected_line_v2", selectedLine);
    } catch (e) {}
  }, [selectedLine]);

  // Clean up legacy dummy data stores from previous versions
  useEffect(() => {
    try {
      localStorage.removeItem("factory_extrusion_downtime_parsed_v2");
      localStorage.removeItem("factory_extrusion_downtime_user_uploaded_v3");
      localStorage.removeItem("factory_extrusion_downtime_user_uploaded_v4");
      localStorage.removeItem("factory_extrusion_downtime_user_uploaded_v5");
      localStorage.removeItem("factory_extrusion_downtime_4lines_v24_real_purged");
      localStorage.removeItem("factory_extrusion_downtime_4lines_v23_pcm1qq_verified");
      localStorage.removeItem("factory_extrusion_downtime_logs_clean_v1");
    } catch (e) {}
  }, []);

  // Filter reports by line, period, search query, and category
  const filteredReports = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

    const lastMonthDate = new Date(currentYear, currentMonth - 2, 1);
    const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    return reports.filter((r) => {
      if (!r) return false;

      // 1. Line filter
      if (selectedLine !== "all") {
        const lineStr = String(r.lineName || r.lineId || "").trim();
        const matchesLine =
          lineStr.includes(selectedLine) ||
          (selectedLine === "1호기" && (lineStr.includes("1") || lineStr.includes("pcm1") || lineStr.includes("PCM #1"))) ||
          (selectedLine === "2호기" && (lineStr.includes("2") || lineStr.includes("pcm2") || lineStr.includes("PCM #2"))) ||
          (selectedLine === "3호기" && (lineStr.includes("3") || lineStr.includes("pcm3") || lineStr.includes("PCM #3") || lineStr.includes("PVC"))) ||
          (selectedLine === "4호기" && (lineStr.includes("4") || lineStr.includes("pcm4") || lineStr.includes("PCM #4") || lineStr.includes("TPE")));
        if (!matchesLine) return false;
      }

      // 2. Period filter
      const reportDate = r.date || "";
      if (selectedPeriod === "this_month") {
        if (!reportDate.startsWith(currentMonthStr)) return false;
      } else if (selectedPeriod === "last_month") {
        if (!reportDate.startsWith(lastMonthStr)) return false;
      } else if (selectedPeriod === "recent_30") {
        if (reportDate < thirtyDaysAgo) return false;
      } else if (selectedPeriod === "recent_7") {
        if (reportDate < sevenDaysAgo) return false;
      }

      // 3. Category filter
      if (categoryFilter !== "all") {
        if (r.downtimeCategory !== categoryFilter) return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const workerStr = String(r.worker || "").toLowerCase();
        const vehicleStr = String(r.vehicle || "").toLowerCase();
        const itemStr = String(r.itemCode || r.itemName || "").toLowerCase();
        const catStr = String(r.downtimeCategory || "").toLowerCase();
        const detailStr = String(r.downtimeDetail || "").toLowerCase();
        const issueStr = String(r.tpmIssueText || "").toLowerCase();

        const match =
          workerStr.includes(q) ||
          vehicleStr.includes(q) ||
          itemStr.includes(q) ||
          catStr.includes(q) ||
          detailStr.includes(q) ||
          issueStr.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [reports, selectedLine, selectedPeriod, categoryFilter, searchQuery]);

  // Overall & Filtered Metrics
  const metrics = useMemo(() => {
    return calculateExtrusionMetrics(filteredReports);
  }, [filteredReports]);

  // Line Summary Stats for Badges
  const lineStats = useMemo(() => {
    const map = {
      all: { count: reports.length, downtimeMinutes: 0, scrapKg: 0 },
      "1호기": { count: 0, downtimeMinutes: 0, scrapKg: 0 },
      "2호기": { count: 0, downtimeMinutes: 0, scrapKg: 0 },
      "3호기": { count: 0, downtimeMinutes: 0, scrapKg: 0 },
      "4호기": { count: 0, downtimeMinutes: 0, scrapKg: 0 }
    };

    reports.forEach((r) => {
      const dt = Number(r.downtimeMinutes) || 0;
      const s = Number(r.scrapKg) || 0;
      map.all.downtimeMinutes += dt;
      map.all.scrapKg += s;

      const lineStr = String(r.lineName || r.lineId || "").trim();
      if (lineStr.includes("1") || lineStr.includes("pcm1")) {
        map["1호기"].count += 1;
        map["1호기"].downtimeMinutes += dt;
        map["1호기"].scrapKg += s;
      } else if (lineStr.includes("2") || lineStr.includes("pcm2")) {
        map["2호기"].count += 1;
        map["2호기"].downtimeMinutes += dt;
        map["2호기"].scrapKg += s;
      } else if (lineStr.includes("3") || lineStr.includes("pcm3") || lineStr.includes("PVC")) {
        map["3호기"].count += 1;
        map["3호기"].downtimeMinutes += dt;
        map["3호기"].scrapKg += s;
      } else if (lineStr.includes("4") || lineStr.includes("pcm4") || lineStr.includes("TPE")) {
        map["4호기"].count += 1;
        map["4호기"].downtimeMinutes += dt;
        map["4호기"].scrapKg += s;
      }
    });

    return map;
  }, [reports]);

  // Downtime Category Breakdown & Ranking
  const categoryBreakdown = useMemo(() => {
    const catMap = {};
    let totalDowntimeMinutes = 0;

    filteredReports.forEach((r) => {
      const dt = Number(r.downtimeMinutes) || 0;
      if (dt > 0) {
        const cat = r.downtimeCategory || "기타";
        totalDowntimeMinutes += dt;
        if (!catMap[cat]) {
          catMap[cat] = {
            category: cat,
            minutes: 0,
            occurrences: 0,
            scrapKg: 0
          };
        }
        catMap[cat].minutes += dt;
        catMap[cat].occurrences += 1;
        catMap[cat].scrapKg += Number(r.scrapKg) || 0;
      }
    });

    const list = Object.values(catMap).map((it) => ({
      ...it,
      percentage: totalDowntimeMinutes > 0 ? ((it.minutes / totalDowntimeMinutes) * 100).toFixed(1) : "0.0",
      hours: (it.minutes / 60).toFixed(1)
    }));

    return list.sort((a, b) => b.minutes - a.minutes);
  }, [filteredReports]);

  // Top Downtime Reason
  const topDowntimeCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  // Handle Export Excel
  const handleExportExcel = () => {
    const selectedLineName = LINE_PRESETS.find((l) => l.id === selectedLine)?.name || "전체라인";
    const title = `압출_비가동상세분석_${selectedLineName}_${new Date().toISOString().slice(0, 10)}`;
    exportExtrusionReportsToExcel(filteredReports, metrics, title);
  };

  return (
    <div className="space-y-3 pb-12 animate-fadeIn max-w-[1600px] mx-auto min-w-0">
      {/* ========================================================================= */}
      {/* Sub-Tab Navigation Switcher (작업일보 관리대장 / 비가동 상세분석) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveSubTab("production")}
          className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === "production"
              ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Factory className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">작업일보 관리대장</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("downtime")}
          className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap ${
            activeSubTab === "downtime"
              ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">비가동 상세분석</span>
        </button>
      </div>

      {activeSubTab === "production" ? (
        <ExtrusionProductionTab />
      ) : (
        <div className="space-y-3.5">
          {/* ========================================================================= */}
          {/* 1. Line Selection Badges (1호기 / 2호기 / 3호기 / 4호기 / 전체라인) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {LINE_PRESETS.map((line) => {
              const isSelected = selectedLine === line.id;
              const stats = lineStats[line.id] || { count: 0, downtimeMinutes: 0 };
              const downtimeHours = (stats.downtimeMinutes / 60).toFixed(1);

              return (
                <button
                  key={line.id}
                  type="button"
                  onClick={() => setSelectedLine(line.id)}
                  className={`relative py-2.5 px-3 rounded-xl text-left border transition-all flex flex-col justify-between gap-1 cursor-pointer select-none shadow-2xs active:scale-98 ${
                    isSelected
                      ? "bg-teal-50/80 dark:bg-teal-950/50 border-teal-600 border-2 shadow-xs ring-2 ring-teal-500/20"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isSelected ? "bg-teal-600 ring-2 ring-teal-300" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      ></span>
                      <span
                        className={`font-black text-xs sm:text-[13px] truncate ${
                          isSelected ? "text-teal-700 dark:text-teal-300" : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {line.name}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded-md bg-teal-600 text-white shadow-2xs shrink-0">
                        선택
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800 w-full">
                    <span className="font-bold text-slate-500 dark:text-slate-400">
                      작업일보 <strong>{stats.count}건</strong>
                    </span>
                    <span className={`font-black text-[11.5px] ${stats.downtimeMinutes > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400"}`}>
                      {stats.downtimeMinutes > 0 ? `${stats.downtimeMinutes}분 (${downtimeHours}h)` : "0분"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* 2. Controls Bar: Period Filter, Search, Excel Export */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                {PERIOD_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPeriod(p.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                      selectedPeriod === p.id
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-600"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Category Filter Dropdown */}
              <div className="flex items-center gap-1">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">전체 비가동 원인</option>
                  {DOWNTIME_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Search Box */}
              <div className="relative min-w-[180px] sm:min-w-[220px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="작업자, 차종, 품명, 비가동 사유 검색..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400"
                />
              </div>

              {/* Excel Download Button */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>엑셀 다운로드</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. KPI Metric Cards (실제 작성된 작업일보 기반 누적 분석) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* 1. 총 비가동 시간 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                <span>총 비가동 시간</span>
              </div>
              <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">
                {(metrics?.totalDowntimeMinutes || 0).toLocaleString()}분
              </div>
              <div className="text-[10.5px] font-bold text-slate-400 mt-0.5">
                ({(metrics?.totalDowntimeHours || 0)}시간)
              </div>
            </div>

            {/* 2. 총 스크랩 중량 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-amber-500" />
                <span>총 발생 스크랩</span>
              </div>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
                {(metrics?.totalScrapKg || 0).toLocaleString()} kg
              </div>
              <div className="text-[10.5px] font-bold text-slate-400 mt-0.5">
                불량수량: {(metrics?.totalDefect || 0).toLocaleString()}m
              </div>
            </div>

            {/* 3. 평균 수율 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>평균 수율</span>
              </div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {metrics?.yieldRate ?? 100}%
              </div>
              <div className="text-[10.5px] font-bold text-slate-400 mt-0.5">
                불량률: {metrics?.defectRate ?? 0}%
              </div>
            </div>

            {/* 4. 총 양품 생산량 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>총 양품 생산량</span>
              </div>
              <div className="text-lg font-black text-blue-700 dark:text-blue-400 mt-1">
                {(metrics?.totalGood || 0).toLocaleString()} m
              </div>
              <div className="text-[10.5px] font-bold text-slate-400 mt-0.5">
                실적: {(metrics?.totalActual || 0).toLocaleString()}m
              </div>
            </div>

            {/* 5. 등록 작업일보 건수 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>등록 작업일보</span>
              </div>
              <div className="text-lg font-black text-purple-700 dark:text-purple-400 mt-1">
                {filteredReports.length} 건
              </div>
              <div className="text-[10.5px] font-bold text-slate-400 mt-0.5">
                달성률: {metrics?.attainmentRate ?? 100}%
              </div>
            </div>

            {/* 6. 최다 비가동 항목 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>최다 비가동 항목</span>
              </div>
              <div className="text-base font-black text-rose-600 dark:text-rose-400 mt-1 truncate">
                {topDowntimeCategory ? topDowntimeCategory.category : "없음"}
              </div>
              <div className="text-[10.5px] font-bold text-slate-400 mt-0.5">
                {topDowntimeCategory
                  ? `${topDowntimeCategory.minutes}분 (${topDowntimeCategory.occurrences}회)`
                  : "비가동 내역 없음"}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. Downtime Category Analysis & Breakdown Bars (비가동 원인별 분포 및 랭킹) */}
          {/* ========================================================================= */}
          {categoryBreakdown.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    비가동 원인별 상세 분석 및 손실 점유율
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  총 {categoryBreakdown.length}개 원인 항목 발생
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {categoryBreakdown.map((cat, idx) => {
                  const percentNum = parseFloat(cat.percentage) || 0;
                  return (
                    <div
                      key={cat.category}
                      className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                            {cat.category}
                          </span>
                        </div>
                        <span className="font-black text-xs text-rose-600 dark:text-rose-400">
                          {cat.minutes}분 ({cat.hours}h)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, percentNum))}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-500 dark:text-slate-400 pt-0.5">
                        <span>점유율: <strong className="text-slate-700 dark:text-slate-200">{cat.percentage}%</strong></span>
                        <span>발생: <strong>{cat.occurrences}회</strong> (스크랩: {cat.scrapKg}kg)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. Main Downtime Detailed History Ledger (실제 작업일보 기반 상세 목록표) */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {LINE_PRESETS.find((l) => l.id === selectedLine)?.name || "전체 라인"} 비가동 상세 내역 대장
                </h3>
                <span className="text-xs text-teal-800 dark:text-teal-200 font-black bg-teal-100 dark:bg-teal-950 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  총 {filteredReports.length}건 실적
                </span>
              </div>

              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                실시간 앱 등록 일보 데이터 연동됨
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700 text-[11px]">
                    <th className="py-2.5 px-2 text-center w-10">No</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">일자 / 조</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">호기 / 작업자</th>
                    <th className="py-2.5 px-3">차종 / 품명</th>
                    <th className="py-2.5 px-3 text-right">수율</th>
                    <th className="py-2.5 px-3 text-right">스크랩</th>
                    <th className="py-2.5 px-3 text-right">비가동</th>
                    <th className="py-2.5 px-3">비가동 상세내용 및 조치</th>
                    <th className="py-2.5 px-2.5 text-center">TPM 점검</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredReports.length > 0 ? (
                    filteredReports.map((r, idx) => {
                      return (
                        <tr
                          key={r.id || idx}
                          className="hover:bg-teal-50/40 dark:hover:bg-teal-950/25 transition font-medium"
                        >
                          {/* No */}
                          <td className="py-2.5 px-2 text-center text-slate-400 font-bold text-[11px]">
                            {idx + 1}
                          </td>

                          {/* Date & Shift */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-black text-slate-900 dark:text-white text-xs">
                              {r.date}
                            </div>
                            <span
                              className={`inline-block text-[9.5px] font-black px-1.5 py-0.2 rounded mt-0.5 ${
                                r.shift === "주간"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                              }`}
                            >
                              {r.shift || "주간"}
                            </span>
                          </td>

                          {/* Line & Worker */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-black text-teal-700 dark:text-teal-400 text-xs">
                              {r.lineName || "1호기"}
                            </div>
                            <div className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                              {r.worker || "-"}
                            </div>
                          </td>

                          {/* Vehicle & Item */}
                          <td className="py-2.5 px-3 max-w-[200px]">
                            <div className="truncate">
                              <div className="font-black text-slate-900 dark:text-white flex items-center gap-1">
                                <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[9.5px] font-black shrink-0">
                                  {r.vehicle || "압출"}
                                </span>
                                <span className="truncate text-xs font-bold">{r.itemCode || r.itemName || "-"}</span>
                              </div>
                            </div>
                          </td>

                          {/* Yield Rate */}
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`font-black text-[11px] px-1.5 py-0.5 rounded ${
                                r.yieldRate >= 97
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {r.yieldRate ?? 100}%
                            </span>
                          </td>

                          {/* Scrap Kg */}
                          <td className="py-2.5 px-3 text-right font-black text-amber-600 text-xs">
                            {r.scrapKg > 0 ? `${r.scrapKg}kg` : "-"}
                          </td>

                          {/* Downtime */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            {r.downtimeMinutes > 0 ? (
                              <div>
                                <span className="font-black text-rose-600 dark:text-rose-400 text-xs">
                                  {r.downtimeMinutes}분
                                </span>
                                {r.downtimeCategory && (
                                  <div className="text-[10px] text-slate-500 truncate max-w-[120px] ml-auto">
                                    {r.downtimeCategory}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>

                          {/* Downtime Detail / Actions */}
                          <td className="py-2.5 px-3 max-w-[260px] text-xs">
                            {r.downtimeMinutes > 0 ? (
                              <div className="text-slate-700 dark:text-slate-300 truncate font-medium">
                                {r.downtimeDetail || "비가동 조치 완료"}
                              </div>
                            ) : r.tpmIssueText ? (
                              <div className="text-amber-600 dark:text-amber-400 font-bold truncate">
                                🚨 {r.tpmIssueText}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">정상 가동 완료</span>
                            )}
                          </td>

                          {/* TPM Status */}
                          <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                r.tpmStatus === "완료"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {r.tpmStatus === "완료" ? "점검완료" : "미점검"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 space-y-1.5">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold">선택하신 조건에 등록된 작업일보 내역이 없습니다.</p>
                        <p className="text-[11px] text-slate-400">
                          작업일보가 등록되면 실시간으로 비가동 분석이 자동 집계됩니다.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredReports.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-slate-800/90 border-t-2 border-slate-300 dark:border-slate-700 font-black text-xs text-slate-900 dark:text-white">
                      <td colSpan={4} className="py-2.5 px-3 text-center font-black text-xs">
                        ■ 합계 ({filteredReports.length}건)
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 font-black text-xs">
                        {metrics?.yieldRate ?? 0}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-600 font-black text-xs">
                        {metrics?.totalScrapKg ?? 0}kg
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-600 font-black text-xs">
                        {metrics?.totalDowntimeMinutes ?? 0}분
                      </td>
                      <td colSpan={2} className="py-2.5 px-3 text-center text-slate-500 text-[11px]">
                        (총 비가동: <strong>{metrics?.totalDowntimeHours ?? 0}시간</strong>, 양품생산량: <strong>{(metrics?.totalGood || 0).toLocaleString()}m</strong>)
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtrusionDowntimeView;
