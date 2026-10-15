import React, { useState, useEffect, useMemo } from "react";
import {
  Award,
  Calendar,
  AlertOctagon,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  Smartphone,
  Wrench,
  CheckSquare,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Layers,
  HelpCircle,
  Printer,
  X
} from "lucide-react";
import {
  getLocalSqLevelUpItems,
  subscribeSqLevelUpItems,
  updateSqLevelUpItem,
  calculateSqKPIs,
  exportSqToExcel
} from "../../services/sqLevelUpService";
import { DigitalInspectionModal } from "./DigitalInspectionModal";
import { HanulQualityIssueModal } from "../hanul/HanulQualityIssueModal";

export const SqLevelUpView = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [priorityTab, setPriorityTab] = useState("ALL"); // ALL | S | A | B
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("OPEN"); // ALL | OPEN | CLOSE
  const [searchQuery, setSearchQuery] = useState("");
  const [solutionTypeFilter, setSolutionTypeFilter] = useState("ALL"); // ALL | App-Direct | App-Assisted | Physical

  // Modals
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Real-time Subscription
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeSqLevelUpItems((data) => {
      setItems(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Live KPIs
  const kpis = useMemo(() => calculateSqKPIs(items), [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      // 1. Priority Tab
      if (priorityTab === "S" && it.priority !== "S등급") return false;
      if (priorityTab === "A" && it.priority !== "A등급") return false;
      if (priorityTab === "B" && it.priority !== "B등급") return false;

      // 2. Department Filter
      if (deptFilter !== "ALL" && it.mainDept !== deptFilter) return false;

      // 3. Status Filter
      if (statusFilter === "OPEN" && (it.status === "CLOSE" || it.status === "조치완료" || it.status === "해당없음")) return false;
      if (statusFilter === "CLOSE" && it.status !== "CLOSE" && it.status !== "조치완료") return false;

      // 4. Solution Type
      if (solutionTypeFilter !== "ALL" && it.appSolutionType !== solutionTypeFilter) return false;

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${it.seq} ${it.code} ${it.subItem} ${it.problem} ${it.actionPlan} ${it.mainDept} ${it.mainOwner} ${it.appModule}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [items, priorityTab, deptFilter, statusFilter, solutionTypeFilter, searchQuery]);

  // Handle Quick Status Change
  const handleQuickStatusChange = async (seq, newStatus) => {
    await updateSqLevelUpItem(seq, { status: newStatus });
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-5 sm:p-6 shadow-xl border border-indigo-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-cyan-400 to-blue-400 text-slate-950 shadow-md">
                오륙산업 SQ 레벨업 종합 추진판
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/20 border border-rose-400/40 text-rose-300">
                🎯 {kpis.dDay} (목표: 2026.10.31)
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-white/10 text-slate-300">
                SQ Ver 5.1 | 압출·가공
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>사전점검 124건 Live 모니터링 & 스마트 앱 연계 현황</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              수기 문서 관리 한계를 넘어, <strong>현장 모바일 제조 앱(App)을 통해 96.8% 디지털 실시간 인터락(Poka-Yoke)</strong>으로 해결합니다.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            <button
              onClick={() => setIsInspectionModalOpen(true)}
              className="px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Smartphone className="w-4 h-4 text-cyan-200" />
              <span>⚡ 현장 모바일 초중종/TPM 간편 점검</span>
            </button>
            <button
              onClick={() => setIsSummaryModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <FileText className="w-4 h-4 text-indigo-300" />
              <span>1-Page 개선대책서</span>
            </button>
            <button
              onClick={() => exportSqToExcel(items)}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>엑셀 다운로드</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Status */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>총 점검 항목</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 dark:text-white">{kpis.total}</span>
            <span className="text-xs font-bold text-slate-400">건</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
            <span className="text-emerald-600">완료 {kpis.closed}건</span>
            <span className="text-rose-600">미완료 {kpis.open}건</span>
          </div>
        </div>

        {/* Priority 1: S Grade */}
        <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-400">
            <span>우선순위 1 (S등급)</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 dark:text-rose-300">{kpis.sOpen}</span>
            <span className="text-xs font-bold text-rose-500">/ {kpis.sTotal}건 OPEN</span>
          </div>
          <div className="mt-2 text-[11px] font-bold text-rose-600 dark:text-rose-400">
            치명 결함·초중종·4M 통제
          </div>
        </div>

        {/* Priority 2: A Grade */}
        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
            <span>우선순위 2 (A등급)</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{kpis.aOpen}</span>
            <span className="text-xs font-bold text-amber-500">/ {kpis.aTotal}건 OPEN</span>
          </div>
          <div className="mt-2 text-[11px] font-bold text-amber-600 dark:text-amber-400">
            설비 TPM·다국어·금형타수
          </div>
        </div>

        {/* Priority 3: B Grade */}
        <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-400">
            <span>우선순위 3 (B등급)</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{kpis.bOpen}</span>
            <span className="text-xs font-bold text-indigo-500">/ {kpis.bTotal}건 OPEN</span>
          </div>
          <div className="mt-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            정성품질 TFT·개선제안
          </div>
        </div>

        {/* App Solvable Feasibility */}
        <div className="p-4 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-800 dark:text-cyan-300">
            <span>앱(App) 해결 커버리지</span>
            <Smartphone className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-700 dark:text-cyan-200">{kpis.appSolvableRate}%</span>
            <span className="text-xs font-bold text-cyan-600">({kpis.appDirect + kpis.appAssisted}건)</span>
          </div>
          <div className="mt-2 text-[11px] font-bold text-cyan-700 dark:text-cyan-300">
            직접구축 {kpis.appDirect} + 연계 {kpis.appAssisted}
          </div>
        </div>
      </div>

      {/* 3. 3-Tier Priority Tabs & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
        {/* Main 3 Priority Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <button
            onClick={() => setPriorityTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              priorityTab === "ALL"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            전체 항목 보기 ({items.length})
          </button>
          <button
            onClick={() => setPriorityTab("S")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              priorityTab === "S"
                ? "bg-rose-600 text-white shadow-md shadow-rose-500/25"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
            }`}
          >
            <span>🚨 우선순위 1 (S등급 {kpis.sOpen}건)</span>
          </button>
          <button
            onClick={() => setPriorityTab("A")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              priorityTab === "A"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/25"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
            }`}
          >
            <span>⚙️ 우선순위 2 (A등급 {kpis.aOpen}건)</span>
          </button>
          <button
            onClick={() => setPriorityTab("B")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              priorityTab === "B"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
            }`}
          >
            <span>💡 우선순위 3 (B등급 {kpis.bOpen}건)</span>
          </button>
        </div>

        {/* Detailed Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">부서:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">전체 부서 ({items.length})</option>
              <option value="품질관리팀">품질관리팀 (54건)</option>
              <option value="공무보전팀">공무보전팀 (27건)</option>
              <option value="생산기술팀">생산기술팀 (21건)</option>
              <option value="자재물류팀">자재물류팀 (13건)</option>
              <option value="생산관리팀">생산관리팀 (7건)</option>
              <option value="관리팀">관리팀 (2건)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">상태:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="OPEN">미완료 (OPEN: {kpis.open}건)</option>
              <option value="ALL">전체 (160건)</option>
              <option value="CLOSE">완료 (CLOSE: {kpis.closed}건)</option>
            </select>
          </div>

          {/* Solution Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">해결방식:</span>
            <select
              value={solutionTypeFilter}
              onChange={(e) => setSolutionTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">전체 해결방식</option>
              <option value="App-Direct">📱 앱 직접 해결 ({kpis.appDirect}건)</option>
              <option value="App-Assisted">📂 앱 연계 관리 ({kpis.appAssisted}건)</option>
              <option value="Physical">🔧 현장 물리 제작 ({kpis.physical}건)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="항목, 문제점, 대책, 담당자 검색..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white font-medium"
            />
          </div>
        </div>
      </div>

      {/* 4. Items Table / Card List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              조회 결과: <strong>{filteredItems.length}</strong>건
            </span>
            <span className="text-[11px] text-slate-400">
              (각 행의 상태 및 앱 해결 모듈을 직접 확인·변경할 수 있습니다)
            </span>
          </div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            실시간 클라우드 동기화 활성
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3 w-20">우선순위</th>
                <th className="py-2.5 px-3 w-28">대/중분류</th>
                <th className="py-2.5 px-3 min-w-[240px]">추진 세부항목 & 지적사항</th>
                <th className="py-2.5 px-3 min-w-[280px]">구체적 개선 조치 대책 (Action Plan)</th>
                <th className="py-2.5 px-3 w-24">기한</th>
                <th className="py-2.5 px-3 min-w-[220px]">📱 앱(App) 기준 해결 모듈</th>
                <th className="py-2.5 px-3 w-24 text-center">조치상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map((item) => {
                const isOpen = item.status !== "CLOSE" && item.status !== "조치완료" && item.status !== "해당없음";
                return (
                  <tr
                    key={item.seq}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      !isOpen ? "opacity-60 bg-slate-50/40 dark:bg-slate-900/40" : ""
                    }`}
                  >
                    <td className="py-3 px-3 text-center font-bold text-slate-500">
                      {item.seq}
                    </td>

                    {/* Priority Badge */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black inline-block ${
                        item.priority === "S등급"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
                          : item.priority === "A등급"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                          : item.priority === "B등급"
                          ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {item.priority}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{item.midCategory}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.code}</div>
                    </td>

                    {/* SubItem & Problem */}
                    <td className="py-3 px-3">
                      <div className="font-black text-slate-900 dark:text-white leading-snug">
                        {item.subItem}
                      </div>
                      {item.problem && (
                        <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium line-clamp-2">
                          {item.problem}
                        </div>
                      )}
                    </td>

                    {/* Action Plan */}
                    <td className="py-3 px-3">
                      <div className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed whitespace-pre-line line-clamp-3">
                        {item.actionPlan || "표준서 개정 및 현장 이행 증빙 확보"}
                      </div>
                      {item.outputs && (
                        <div className="mt-1 text-[10px] text-slate-400 font-mono">
                          📁 산출물: {item.outputs}
                        </div>
                      )}
                    </td>

                    {/* Target Date */}
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {item.targetDate || "2026-10-31"}
                    </td>

                    {/* App Module */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black inline-block leading-snug shadow-xs ${
                          item.appSolutionType === "App-Direct"
                            ? "bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/60 dark:to-blue-950/60 text-cyan-900 dark:text-cyan-200 border border-cyan-400/50"
                            : item.appSolutionType === "App-Assisted"
                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-blue-300/50"
                            : "bg-slate-100 text-slate-700 border border-slate-300"
                        }`}>
                          {item.appModule}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {item.appSolutionType === "App-Direct" ? "⚡ 앱 모듈 실시간 자동화" : item.appSolutionType === "App-Assisted" ? "📂 표준 문서 클라우드 연계" : "🔧 현장 물리적 제작"}
                        </span>
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3 px-3 text-center">
                      <select
                        value={item.status}
                        onChange={(e) => handleQuickStatusChange(item.seq, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer ${
                          item.status === "CLOSE" || item.status === "조치완료"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : item.status === "진행중"
                            ? "bg-blue-50 text-blue-800 border-blue-300"
                            : "bg-rose-50 text-rose-800 border-rose-300"
                        }`}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="진행중">진행중</option>
                        <option value="CLOSE">조치완료</option>
                        <option value="해당없음">해당없음</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modals */}
      <DigitalInspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        onOpenQualityIssueModal={() => setIsQualityModalOpen(true)}
      />

      {isQualityModalOpen && (
        <HanulQualityIssueModal
          isOpen={isQualityModalOpen}
          onClose={() => setIsQualityModalOpen(false)}
        />
      )}

      {/* 1-Page Summary Executive Modal */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black">SQ 레벨업 1-Page 요약 개선대책서</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>인쇄하기</span>
                </button>
                <button
                  onClick={() => setIsSummaryModalOpen(false)}
                  className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/40">
                <h4 className="font-black text-blue-900 dark:text-blue-200 text-sm mb-1">
                  1. 핵심 추진 전략: "종이 문서의 한계를 극복하고 모바일 앱 기반 96.8% 디지털 전환"
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  사전점검 124건 지적사항의 본질은 체크시트 수기 누락과 이력 단절입니다.
                  오륙 제조 관리 앱을 통해 <strong>시업 전 필수 점검 인터락(Poka-Yoke), 다국어 UI, 실시간 SPC 차트 및 전자결재</strong>를 구축하여 심사 합격을 달성합니다.
                </p>
              </div>

              {/* 3 Priorities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 dark:bg-rose-950/20">
                  <div className="font-black text-rose-700 dark:text-rose-400 text-xs mb-1">
                    우선순위 1. 품질 누출 방어 (S등급 59건)
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                    <li>초·중·종물 디지털 검사일보 & SPC 자동 판정</li>
                    <li>부적합품 모바일 사진 촬영 및 전자 격리 TAG 발행</li>
                    <li>전자결재(Approval) 연동 4M 임의변경 차단</li>
                    <li>모바일 바코드 LOT 추적 및 JRMS 선입선출</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="font-black text-amber-700 dark:text-amber-400 text-xs mb-1">
                    우선순위 2. 설비·공정 표준화 (A등급 61건)
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                    <li>외국인 사원 전용 4개국어 모바일 표준 화면</li>
                    <li>시업 전 모바일 TPM 설비/금형 일상점검 인터락</li>
                    <li>설비 비가동(Downtime) 로깅 및 재가동 검증</li>
                    <li>생산 실적 연동 금형 타수(Meter) 수명 알람</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20">
                  <div className="font-black text-indigo-700 dark:text-indigo-400 text-xs mb-1">
                    우선순위 3. 체계 내재화 (B등급 4건)
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                    <li>사원 참여형 모바일 현장 개선제안 및 포상</li>
                    <li>3정5행 현장 Before/After 전자 갤러리</li>
                    <li>SQ 124건 실시간 추진판 상시 모니터링</li>
                  </ul>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-400">
                (주)오륙 SQ LEVEL-UP TFT | 주관: 품질관리팀 / 생산기술팀 / 공무보전팀
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
