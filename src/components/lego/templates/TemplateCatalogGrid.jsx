import {
  Database,
  Layers,
  Plus,
  Trash2,
  Search,
  Sliders,
  Printer,
  Copy,
  Eye
} from "lucide-react";
import { REPORT_MAJOR_CATEGORIES } from "../../../services/workReportTemplateService";
import { getOrderedBlocksForTemplate } from "./templateUtils";

export const TemplateCatalogGrid = ({
  templates,
  filteredTemplates,
  selectedCategory,
  setSelectedCategory,
  searchTerm,
  setSearchTerm,
  categoryCounts,
  handleAddNew,
  handleDeleteAll,
  handleEdit,
  handleOpenInLegoBuilder,
  setPreviewTemplate,
  setIsPreviewOpen,
  handleClone,
  handleDelete
}) => {
  return (
    <>
      {/* ======================================================== */}
      {/* Header Banner (컴팩트 카탈로그 헤더) */}
      {/* ======================================================== */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Layers className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-black tracking-tight text-white whitespace-nowrap">
              작업일보 양식 보관함 (5대 공정)
            </h2>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 whitespace-nowrap">
              표준 규격
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center gap-1 shadow-xs whitespace-nowrap">
              <Database className="w-3 h-3 fill-cyan-200 text-white" />
              <span>DB 공식 보관 ({templates.length}종)</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {templates.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteAll}
              className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>전체 양식 일괄 삭제</span>
            </button>
          )}
          <button
            onClick={handleAddNew}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ 새 작업일보 양식 만들기</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* All + 5 Major Categories Switcher Tabs */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between gap-2 shadow-sm ${
            selectedCategory === "ALL"
              ? "bg-white dark:bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/30 scale-[1.02]"
              : "bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl">🗂️</span>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950">
              총 {templates.length}개 전체
            </span>
          </div>
          <div>
            <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
              전체 양식 보기
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              DB에 저장된 모든 작업일보 한눈에 보기
            </p>
          </div>
        </button>

        {REPORT_MAJOR_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(isActive ? "ALL" : cat.id)}
              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between gap-2 shadow-sm ${
                isActive
                  ? "bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/30 scale-[1.02]"
                  : "bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl">{cat.icon}</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-400/40 flex items-center gap-0.5">
                    <Database className="w-2.5 h-2.5" />
                    <span>DB보관함</span>
                  </span>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${cat.badgeColor}`}>
                    {count}개 양식
                  </span>
                </div>
              </div>
              <div>
                <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                  {cat.name}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={cat.desc}>
                  {cat.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* Search & Filters Toolbar */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="차종, 품명, 공정명, 양식명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <span className="text-xs font-bold text-slate-500">
          총 <strong className="text-indigo-600 dark:text-indigo-400">{filteredTemplates.length}</strong>개의 템플릿
        </span>
      </div>

      {/* ======================================================== */}
      {/* Template Cards Grid */}
      {/* ======================================================== */}
      {filteredTemplates.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="text-3xl">📭</div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
            해당 분류에 등록된 작업일보 양식이 없습니다.
          </p>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-black text-xs hover:bg-indigo-500 cursor-pointer"
          >
            + 첫 번째 양식 만들기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTemplates.map((tpl) => {
            const specCount = (tpl.legoConfig?.specsCutting || tpl.specs || []).length;
            const defectCount = (tpl.defectCategories || []).reduce((acc, c) => acc + (c.items || []).length, 0);
            const orderedBlocks = getOrderedBlocksForTemplate(tpl);
            const activeOrderedBlocks = orderedBlocks.filter((b) => Boolean(tpl.legoConfig?.activeBlocks?.[b.key]));

            return (
              <div
                key={tpl.id}
                className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: 차종 → 품명 → 공정명 순서 표시 */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-indigo-600 text-white shadow-2xs">
                          {tpl.carModel}
                        </span>
                        <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                          {tpl.partName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-400/40">
                          {tpl.processName || tpl.legoConfig?.processName || "소재준비"}
                        </span>
                        {/* 🌟 보관함 뱃지 & 데이터베이스 뱃지 */}
                        <span className="px-2.5 py-0.8 rounded-full text-[11px] font-black bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 text-white flex items-center gap-1.5 shadow-sm border border-cyan-300/40">
                          <Database className="w-3.5 h-3.5 fill-cyan-100 text-white" />
                          <span>DB 보관함 공식등록</span>
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold mt-1">
                        {tpl.title || "소재준비작업일보"}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                      {tpl.formNo || "705-02"}
                    </span>
                  </div>

                  {/* Active Lego Blocks Indicator */}
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block">
                      장착된 레고 블록 ({activeOrderedBlocks.length > 0 ? `${activeOrderedBlocks.length}개 블록 조립됨` : "표준 블록"}):
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {activeOrderedBlocks.length > 0 ? (
                        activeOrderedBlocks.map((b, bIdx) => (
                          <span
                            key={b.key}
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                              b.isCustom
                                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                            }`}
                          >
                            {bIdx + 1}. {b.label}
                          </span>
                        ))
                      ) : (
                        <>
                          {tpl.blocks?.timeAndQty && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              ⏱️ 시간/생산량
                            </span>
                          )}
                          {tpl.blocks?.specAndLot && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              📐 치수실측({specCount}개)
                            </span>
                          )}
                          {tpl.blocks?.machineCondition && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              🌡️ 성형/설비조건
                            </span>
                          )}
                          {tpl.blocks?.defectMatrix && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              ⚠️ 불량집계({defectCount}개)
                            </span>
                          )}
                          {tpl.blocks?.maintenance && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              🔧 설비보전/칼날
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Specs Quick Peek */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 text-[11px] space-y-1">
                    <span className="font-bold text-slate-600 dark:text-slate-300 block">
                      기본정보 (차종 · 품명 · 공정명) 및 스펙 요약:
                    </span>
                    <div className="flex items-center justify-between text-[10.5px] font-black text-slate-700 dark:text-slate-200 pb-1 border-b border-slate-200 dark:border-slate-700">
                      <span>차종: {tpl.carModel || "-"}</span>
                      <span>품명: {tpl.partName || "-"}</span>
                      <span>공정명: {tpl.processName || tpl.legoConfig?.processName || "소재준비"}</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 space-y-0.5 pt-0.5">
                      {(tpl.legoConfig?.specsCutting || tpl.specs || []).slice(0, 3).map((s, idx) => (
                        <div key={s.id || idx} className="flex items-center justify-between">
                          <span>단면 {s.section || s.name}</span>
                          <span className="font-black text-indigo-600 dark:text-indigo-400">{s.spec1 || s.frtSpec || s.spec || "-"}</span>
                        </div>
                      ))}
                      {(tpl.legoConfig?.specsCutting || tpl.specs || []).length > 3 && (
                        <span className="text-[10px] text-slate-400 block text-right font-bold">
                          + 외 {(tpl.legoConfig?.specsCutting || tpl.specs || []).length - 3}개 항목
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleEdit(tpl)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition active:scale-98 cursor-pointer"
                    title="양식 템플릿 전체를 확인하고 수정 및 일보에 적용합니다."
                  >
                    <Eye className="w-4 h-4 text-indigo-200" />
                    <span>전체보기</span>
                  </button>

                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => handleOpenInLegoBuilder(tpl)}
                      className="p-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      title="레고 블록 양식 조합기에서 블록 선택 & 앱내 편집"
                    >
                      <Sliders className="w-3.5 h-3.5 text-cyan-600" />
                      <span className="hidden sm:inline">블록수정</span>
                    </button>
                    <button
                      onClick={() => {
                        setPreviewTemplate(tpl);
                        setIsPreviewOpen(true);
                      }}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      title="A4 실물 양식 보기 / 인쇄"
                    >
                      <Printer className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="hidden sm:inline">A4양식</span>
                    </button>
                    <button
                      onClick={() => handleClone(tpl)}
                      className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      title="새 차종으로 1초 복제"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">복제</span>
                    </button>
                    <button
                      onClick={() => handleDelete(tpl)}
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">삭제</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default TemplateCatalogGrid;
