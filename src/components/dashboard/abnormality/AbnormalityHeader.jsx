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
  X,
  Plus,
  Layers
} from "lucide-react";
import { PANEL_THEMES, cleanTitleWithoutEmoji } from "../../../config/panelThemeConfig";

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
  customBadge,
  hideBadge = false,
  hideSubtitle = true,
  theme = "indigo",
  themeObj: propThemeObj,
  isInlineEditing = false,
  customSettings = null,
  onUpdateDraft = null
}) => {
  const themeObj = propThemeObj || PANEL_THEMES[theme] || PANEL_THEMES.indigo;

  const rawTitle =
    customSettings?.customBottomTitle !== undefined
      ? customSettings.customBottomTitle
      : customSettings?.customTitle !== undefined
      ? customSettings.customTitle
      : (customTitle || "전사 4M 취합대장");

  const titleValue = cleanTitleWithoutEmoji(rawTitle) || "전사 4M 취합대장";

  const defaultBadgeText = currentProfile?.name ? `${currentProfile.name} ${currentProfile.title || "관리자"} 관제` : "전사 통합 관제";
  const badgeValue =
    customSettings?.customBottomBadge !== undefined && customSettings.customBottomBadge !== ""
      ? cleanTitleWithoutEmoji(customSettings.customBottomBadge)
      : customSettings?.customBadge !== undefined && customSettings.customBadge !== ""
      ? cleanTitleWithoutEmoji(customSettings.customBadge)
      : cleanTitleWithoutEmoji(customBadge || defaultBadgeText);

  const isBadgeHidden =
    customSettings?.hideBottomBadge !== undefined
      ? customSettings.hideBottomBadge
      : customSettings?.hideBadge !== undefined
      ? customSettings.hideBadge
      : hideBadge;

  return (
    <div className="space-y-2">
      {/* 1. 패널 상단 타이틀 & 툴바 (글자크기와 동일한 아이콘 + 이모지 없는 순수 텍스트) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isInlineEditing ? (
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <input
                    type="text"
                    value={titleValue}
                    onChange={(e) => onUpdateDraft?.({ customBottomTitle: cleanTitleWithoutEmoji(e.target.value) })}
                    placeholder="취합대장 제목 입력..."
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border-2 border-cyan-400 text-slate-900 dark:text-white font-black text-xs sm:text-sm outline-none shadow-sm focus:ring-2 focus:ring-cyan-500 min-w-[180px]"
                  />
                </div>
              ) : (
                <h2 className="font-black text-xs sm:text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>{titleValue}</span>
                </h2>
              )}

              {isInlineEditing ? (
                <div className="inline-flex items-center gap-1">
                  {!isBadgeHidden ? (
                    <div className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9.5px] font-black ${themeObj.accentBadge}`}>
                      <input
                        type="text"
                        value={badgeValue}
                        onChange={(e) => onUpdateDraft?.({ customBottomBadge: cleanTitleWithoutEmoji(e.target.value) })}
                        placeholder="뱃지 명칭..."
                        className="bg-transparent text-white font-black text-[9.5px] outline-none w-20 border-b border-white/40 focus:border-white"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateDraft?.({ hideBottomBadge: true })}
                        className="p-0.5 hover:bg-black/20 rounded-full cursor-pointer text-white/70 hover:text-white"
                        title="뱃지 삭제(숨김)"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onUpdateDraft?.({ hideBottomBadge: false, customBottomBadge: defaultBadgeText })}
                      className="px-2 py-0.2 rounded-full text-[9.5px] font-bold bg-cyan-950 text-cyan-300 border border-dashed border-cyan-500 hover:bg-cyan-900 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>+ 뱃지 복원</span>
                    </button>
                  )}
                </div>
              ) : (
                !isBadgeHidden && (
                  <span className={`px-2 py-0.2 rounded-full text-[9.5px] sm:text-[10px] font-black ${themeObj.accentBadge}`}>
                    {badgeValue}
                  </span>
                )
              )}
            </div>
            {!hideSubtitle && (
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                작업일보 <b>비가동·불량·TPM</b> + 전재율 <b>설비수리</b> + 관리자 <b>부적합경보</b>를 취합하고 <b>변동점 관리대장</b>으로 공식 등록합니다.
              </p>
            )}
          </div>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto flex-wrap">
          {/* 뷰 모드 토글 (1줄 대장 / 카드형) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="1줄 목록표 뷰"
            >
              <TableIcon className="w-3 h-3 text-indigo-500" />
              <span>1줄 대장</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "card"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="카드형 뷰"
            >
              <LayoutList className="w-3 h-3 text-indigo-500" />
              <span>카드형</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            title="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-500" : ""}`} />
            <span className="hidden sm:inline">새로고침</span>
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs"
            title="엑셀 다운로드"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>엑셀 다운로드</span>
          </button>
        </div>
      </div>

      {/* 2. 5대 핵심 4M KPI 카운터 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-0.5">
        {/* 1. 변동점 관리대장 */}
        <div
          onClick={() => {
            setSelected4MTab(selected4MTab === "OFFICIAL_LEDGER" ? "ALL" : "OFFICIAL_LEDGER");
            setSelectedOriginFilter(selectedOriginFilter === "OFFICIAL_LEDGER" ? "ALL" : "OFFICIAL_LEDGER");
          }}
          className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            selected4MTab === "OFFICIAL_LEDGER" || selectedOriginFilter === "OFFICIAL_LEDGER"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/40 shadow-2xs"
              : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-1 text-[10.5px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-bold truncate">
            <ShieldAlert className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">변동점 관리대장</span>
          </div>
          <div className="mt-0.5">
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{stats.officialLedgerCount}건</span>
          </div>
        </div>

        {/* 2. MACHINE */}
        <div
          onClick={() => {
            setSelected4MTab(selected4MTab === "MACHINE" ? "ALL" : "MACHINE");
            if (selectedOriginFilter === "OFFICIAL_LEDGER") setSelectedOriginFilter("ALL");
          }}
          className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            selected4MTab === "MACHINE"
              ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/40 shadow-2xs"
              : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-1 text-[10.5px] sm:text-[11px] text-indigo-600 dark:text-indigo-400 font-bold truncate">
            <Wrench className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">MACHINE</span>
          </div>
          <div className="mt-0.5">
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{stats.machineCount}건</span>
          </div>
        </div>

        {/* 3. MAN */}
        <div
          onClick={() => {
            setSelected4MTab(selected4MTab === "MAN" ? "ALL" : "MAN");
            if (selectedOriginFilter === "OFFICIAL_LEDGER") setSelectedOriginFilter("ALL");
          }}
          className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            selected4MTab === "MAN"
              ? "bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/40 shadow-2xs"
              : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-1 text-[10.5px] sm:text-[11px] text-sky-600 dark:text-sky-400 font-bold truncate">
            <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-500 shrink-0" />
            <span className="truncate">MAN</span>
          </div>
          <div className="mt-0.5">
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{stats.manCount}건</span>
          </div>
        </div>

        {/* 4. METHOD */}
        <div
          onClick={() => {
            setSelected4MTab(selected4MTab === "METHOD" ? "ALL" : "METHOD");
            if (selectedOriginFilter === "OFFICIAL_LEDGER") setSelectedOriginFilter("ALL");
          }}
          className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            selected4MTab === "METHOD"
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/40 shadow-2xs"
              : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-1 text-[10.5px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-bold truncate">
            <AlertOctagon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">METHOD</span>
          </div>
          <div className="mt-0.5">
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{stats.methodCount}건</span>
          </div>
        </div>

        {/* 5. MATERIAL */}
        <div
          onClick={() => {
            setSelected4MTab(selected4MTab === "MATERIAL" ? "ALL" : "MATERIAL");
            if (selectedOriginFilter === "OFFICIAL_LEDGER") setSelectedOriginFilter("ALL");
          }}
          className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            selected4MTab === "MATERIAL"
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/40 shadow-2xs"
              : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-1 text-[10.5px] sm:text-[11px] text-rose-600 dark:text-rose-400 font-bold truncate">
            <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">MATERIAL</span>
          </div>
          <div className="mt-0.5">
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{stats.materialCount}건</span>
          </div>
        </div>
      </div>

      {/* 3. 활성 필터 바 */}
      {selected4MTab !== "ALL" && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
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
    </div>
  );
};
