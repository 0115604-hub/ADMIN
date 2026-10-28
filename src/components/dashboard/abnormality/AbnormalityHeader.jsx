import {
  ShieldAlert,
  Table as TableIcon,
  LayoutList,
  RefreshCw,
  FileSpreadsheet,
  Wrench,
  Users,
  AlertOctagon,
  TrendingDown,
  X
} from "lucide-react";
import { PANEL_THEMES } from "../../../config/panelThemeConfig";

/**
 * AbnormalityHeader
 * Renders top banner, view toggle, refresh, excel download, 5 KPI badges, and active filter pill.
 */
export const AbnormalityHeader = ({
  currentProfile,
  viewMode,
  setViewMode,
  isLoading,
  onRefresh,
  onExportExcel,
  stats,
  selected4MTab,
  setSelected4MTab,
  selectedOriginFilter,
  setSelectedOriginFilter,
  filteredCount,
  customTitle,
  hideSubtitle = true,
  theme = "indigo"
}) => {
  const themeObj = PANEL_THEMES[theme] || PANEL_THEMES.indigo;

  return (
    <>
      <div className={`p-3.5 sm:p-4 rounded-2xl ${themeObj.headerBg} text-white border-2 ${themeObj.borderClass} shadow-xl space-y-2.5 relative overflow-hidden`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl bg-gradient-to-tr ${themeObj.iconGradient} text-white shadow-md shrink-0`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                  <span>{customTitle || "📋 전사 4M 취합대장"}</span>
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${themeObj.accentBadge}`}>
                  {currentProfile?.name ? `${currentProfile.name} ${currentProfile.title || "관리자"} 관제` : "4M 변동점 관제"}
                </span>
              </div>
              {!hideSubtitle && (
                <p className="text-[11px] text-indigo-200/90 font-medium mt-0.5">
                  작업일보 <b>비가동·불량·TPM</b> + 전재율 <b>설비수리</b> + 관리자 <b>부적합경보</b>를 취합하고 <b>변동점 관리대장</b>으로 공식 등록합니다.
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-indigo-500/30">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === "table" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                }`}
                title="1줄 목록표 뷰"
              >
                <TableIcon className="w-3 h-3" />
                <span>1줄 대장</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === "card" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                }`}
                title="카드형 뷰"
              >
                <LayoutList className="w-3 h-3" />
                <span>카드형</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-indigo-200 hover:text-white border border-indigo-500/30 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="새로고침"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
              <span className="hidden sm:inline">새로고침</span>
            </button>

            <button
              type="button"
              onClick={onExportExcel}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs"
              title="엑셀 다운로드"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>엑셀 다운로드</span>
            </button>
          </div>
        </div>

        {/* 5 Core KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-0.5">
          {/* 1. 변동점 관리대장 */}
          <div
            onClick={() => {
              setSelected4MTab(selected4MTab === "OFFICIAL_LEDGER" ? "ALL" : "OFFICIAL_LEDGER");
              setSelectedOriginFilter(selectedOriginFilter === "OFFICIAL_LEDGER" ? "ALL" : "OFFICIAL_LEDGER");
            }}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selected4MTab === "OFFICIAL_LEDGER" || selectedOriginFilter === "OFFICIAL_LEDGER"
                ? "bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-400/50 shadow-md"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold truncate">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">📋 변동점 관리대장</span>
            </div>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-black text-white">{stats.officialLedgerCount}건</span>
            </div>
          </div>

          {/* 2. MACHINE */}
          <div
            onClick={() => {
              setSelected4MTab(selected4MTab === "MACHINE" ? "ALL" : "MACHINE");
              if (selectedOriginFilter === "OFFICIAL_LEDGER") setSelectedOriginFilter("ALL");
            }}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selected4MTab === "MACHINE"
                ? "bg-indigo-950/90 border-indigo-400 ring-2 ring-indigo-400/50 shadow-md"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-bold truncate">
              <Wrench className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">🔧 MACHINE</span>
            </div>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-black text-white">{stats.machineCount}건</span>
            </div>
          </div>

          {/* 3. MAN */}
          <div
            onClick={() => {
              setSelected4MTab(selected4MTab === "MAN" ? "ALL" : "MAN");
              if (selectedOriginFilter === "OFFICIAL_LEDGER") setSelectedOriginFilter("ALL");
            }}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selected4MTab === "MAN"
                ? "bg-sky-950/90 border-sky-400 ring-2 ring-sky-400/50 shadow-md"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs text-sky-300 font-bold truncate">
              <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">👥 MAN</span>
            </div>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-black text-white">{stats.manCount}건</span>
            </div>
          </div>

          {/* 4. METHOD */}
          <div
            onClick={() => {
              setSelected4MTab(selected4MTab === "METHOD" ? "ALL" : "METHOD");
              if (selectedOriginFilter === "OFFICIAL_LEDGER") setSelectedOriginFilter("ALL");
            }}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selected4MTab === "METHOD"
                ? "bg-amber-950/90 border-amber-400 ring-2 ring-amber-400/50 shadow-md"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold truncate">
              <AlertOctagon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">🚨 METHOD</span>
            </div>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-black text-white">{stats.methodCount}건</span>
            </div>
          </div>

          {/* 5. MATERIAL */}
          <div
            onClick={() => {
              setSelected4MTab(selected4MTab === "MATERIAL" ? "ALL" : "MATERIAL");
              if (selectedOriginFilter === "OFFICIAL_LEDGER") setSelectedOriginFilter("ALL");
            }}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selected4MTab === "MATERIAL"
                ? "bg-rose-950/90 border-rose-400 ring-2 ring-rose-400/50 shadow-md"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs text-rose-300 font-bold truncate">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">📉 MATERIAL</span>
            </div>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-black text-white">{stats.materialCount}건</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {selected4MTab !== "ALL" && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>
              현재 <strong>{selected4MTab === "OFFICIAL_LEDGER" ? "변동점 관리대장" : selected4MTab}</strong> 필터 적용 중 ({filteredCount}건)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelected4MTab("ALL");
              setSelectedOriginFilter("ALL");
            }}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
          >
            <X className="w-3 h-3" />
            <span>전체 보기</span>
          </button>
        </div>
      )}
    </>
  );
};
