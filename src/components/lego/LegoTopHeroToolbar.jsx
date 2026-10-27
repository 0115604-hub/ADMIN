import React from "react";
import {
  Layers,
  FileSpreadsheet,
  Printer,
  Database,
  Trash2,
  Save,
  Sparkles
} from "lucide-react";

export const LegoTopHeroToolbar = ({
  isWorkerRecordingMode = false,
  currentReport = {},
  setShowPhotoRefModal,
  setPhotoModalTab,
  viewMode,
  setViewMode,
  handlePrint,
  onNavigateToCatalog,
  handleOpenSaveCatalogModal,
  onDeleteWorkReport,
  savedTemplates = [],
  deleteWorkReportTemplate,
  deleteMachiningWorkReport,
  setCurrentReport,
  setAppliedTemplateBanner,
  showToast,
  handleSaveOfficialWorkReport,
  isSubmitting,
  handleUpdateField,
  appliedTemplateBanner,
  PRESET_REPORTS = [],
  handleLoadPreset
}) => {
  return (
    <div className="bg-slate-900/95 dark:bg-slate-950 p-2.5 sm:p-3 rounded-2xl border border-slate-700/80 shadow-md text-white space-y-2">
      {/* 상단 1열: 타이틀 + 뱃지 (좌측) & 핵심 액션 버튼 (우측) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        {/* 좌측: 타이틀 (줄바꿈 방지) */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-xs shrink-0">
            <Layers className="w-4 h-4" />
          </span>
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <h1 className="text-xs sm:text-sm font-black tracking-tight text-white whitespace-nowrap">
              {isWorkerRecordingMode
                ? `📋 [${currentReport.carModel || "지정양식"}] ${currentReport.title || "작업일보 기록"}`
                : "🧩 레고 블록 작업일보 빌더"}
            </h1>
            {!isWorkerRecordingMode && (
              <button
                type="button"
                onClick={() => {
                  setPhotoModalTab?.("ALL");
                  setShowPhotoRefModal?.(true);
                }}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black whitespace-nowrap shadow-xs cursor-pointer flex items-center gap-1 transition active:scale-95"
                title="블록모음 보관함 열기 및 그림파일 블록사진 업로드 분석·저장"
              >
                <span>🧱 블록모음</span>
              </button>
            )}
            {isWorkerRecordingMode && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-black whitespace-nowrap">
                  🔒 SPEC 고정 · 기록 전용
                </span>
                <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-cyan-300 border border-indigo-400/40 font-black whitespace-nowrap">
                  🎯 목표(오더): {(Number(currentReport.targetQty || currentReport.orderQty) || 350).toLocaleString()} EA
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 핵심 액션 버튼 */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => setViewMode?.(viewMode === "DIGITAL" ? "PRINT_A4" : "DIGITAL")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap ${
              viewMode === "PRINT_A4"
                ? "bg-purple-600 text-white ring-1 ring-purple-400"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
          >
            <FileSpreadsheet className="w-3 h-3" />
            <span>{viewMode === "PRINT_A4" ? "디지털뷰" : "A4서식"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
          >
            <Printer className="w-3 h-3" />
            <span>인쇄/PDF</span>
          </button>

          {!isWorkerRecordingMode && onNavigateToCatalog && (
            <button
              type="button"
              onClick={onNavigateToCatalog}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap"
              title="5대 공정별 표준 양식 보관함으로 이동"
            >
              <Database className="w-3 h-3 text-cyan-400" />
              <span>양식 보관함</span>
            </button>
          )}

          {!isWorkerRecordingMode && (
            <button
              type="button"
              onClick={handleOpenSaveCatalogModal}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95 whitespace-nowrap"
              title="현재 레고 블록 구성을 5대 공정별 표준 양식 보관함에 신규 템플릿으로 저장"
            >
              <Layers className="w-3 h-3 text-cyan-300" />
              <span>템플릿 저장</span>
            </button>
          )}

          {(onDeleteWorkReport || (currentReport.id && savedTemplates.some((t) => t.id === currentReport.id))) && (
            <button
              type="button"
              onClick={async () => {
                const repTitle = currentReport.title || currentReport.partName || "작업일보";
                if (!window.confirm(`정말로 이 등록된 작업일보 [${repTitle}] 항목을 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`)) return;
                try {
                  if (onDeleteWorkReport) {
                    await onDeleteWorkReport();
                  } else if (currentReport.id) {
                    await deleteWorkReportTemplate?.(currentReport.id);
                    try { await deleteMachiningWorkReport?.(currentReport.id); } catch (err) {}
                    setCurrentReport?.(PRESET_REPORTS[0]);
                    setAppliedTemplateBanner?.(null);
                    showToast?.(`🗑️ [${repTitle}] 작업일보가 영구 삭제되었습니다.`);
                  }
                } catch (err) {
                  alert("삭제 중 오류가 발생했습니다: " + err.message);
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 font-black text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95 whitespace-nowrap"
              title="이 등록된 작업일보 영구 삭제"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>일보 삭제</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveOfficialWorkReport}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "저장 중..." : isWorkerRecordingMode ? "💾 작업일보 기록 저장" : "일보 공식 등록"}</span>
          </button>
        </div>
      </div>

      {/* 작업자 기록 모드일 때: 작업자명 / 작업일자 / 근무조 / 목표수량 바 */}
      {isWorkerRecordingMode && (
        <div className="pt-2 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
            <span className="text-[10.5px] font-bold text-slate-400 shrink-0">작업자:</span>
            <input
              type="text"
              value={currentReport.workerName || ""}
              onChange={(e) => handleUpdateField?.("workerName", e.target.value)}
              className="w-full bg-transparent text-cyan-300 font-black outline-none text-xs"
              placeholder="작업자 성명"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
            <span className="text-[10.5px] font-bold text-slate-400 shrink-0">일자:</span>
            <input
              type="date"
              value={currentReport.workDate || ""}
              onChange={(e) => handleUpdateField?.("workDate", e.target.value)}
              className="w-full bg-transparent text-white font-mono font-bold outline-none text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
            <span className="text-[10.5px] font-bold text-slate-400 shrink-0">근무조:</span>
            <select
              value={currentReport.shift || "주간"}
              onChange={(e) => handleUpdateField?.("shift", e.target.value)}
              className="w-full bg-slate-800 text-amber-300 font-black outline-none text-xs"
            >
              <option value="주간">주간 (Day)</option>
              <option value="야간">야간 (Night)</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-indigo-950/80 px-2.5 py-1.5 rounded-xl border border-indigo-700/60">
            <span className="text-[10.5px] font-bold text-indigo-300 shrink-0">🎯 목표수량:</span>
            <span className="text-cyan-300 font-mono font-black text-xs">
              {(Number(currentReport.targetQty || currentReport.orderQty) || 350).toLocaleString()} EA
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
            <span className="text-[10.5px] font-bold text-slate-400 shrink-0">공정:</span>
            <span className="text-indigo-300 font-black truncate">
              {currentReport.processName === "외주가공" ? "가공/협력업체" : (currentReport.processName || "가공/협력업체")}
            </span>
          </div>
        </div>
      )}

      {/* 하단 2열: 💾 DB 저장 작업일보 전체 목록 */}
      {!isWorkerRecordingMode && savedTemplates.length > 0 && (
        <div className="pt-1.5 border-t border-slate-800 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-black text-emerald-400 shrink-0 flex items-center gap-1 whitespace-nowrap">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>DB 저장 일보 ({savedTemplates.length}개):</span>
          </span>
          {savedTemplates.map((tpl, idx) => {
            const isSelected =
              currentReport.id === tpl.id ||
              (appliedTemplateBanner?.id && appliedTemplateBanner.id === tpl.id);
            const label = `${idx + 1}. ${tpl.carModel ? `[${tpl.carModel}] ` : ""}${tpl.title || tpl.partName || "작업일보"}`;
            return (
              <div
                key={tpl.id || idx}
                className={`inline-flex items-center rounded-lg text-xs font-black shrink-0 transition-all border ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 border-emerald-300 shadow-xs ring-1 ring-emerald-300"
                    : "bg-slate-950 text-emerald-200 hover:bg-slate-800 hover:text-white border-emerald-700/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (tpl.legoConfig) {
                      const cfg = JSON.parse(JSON.stringify(tpl.legoConfig));
                      cfg.id = tpl.id;
                      if (tpl.title) cfg.title = tpl.title;
                      if (tpl.carModel) cfg.carModel = tpl.carModel;
                      if (tpl.partName) cfg.partName = tpl.partName;
                      if (tpl.processName) cfg.processName = tpl.processName;
                      setCurrentReport?.(cfg);
                    } else {
                      setCurrentReport?.((prev) => ({
                        ...prev,
                        id: tpl.id,
                        title: tpl.title || prev.title,
                        carModel: tpl.carModel || prev.carModel,
                        partName: tpl.partName || prev.partName,
                        processName: tpl.processName || prev.processName
                      }));
                    }
                    setAppliedTemplateBanner?.(tpl);
                    showToast?.(`⚡ DB 저장 일보 [${label}] 양식을 불러왔습니다.`);
                  }}
                  className="px-2.5 py-1 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  title={`${tpl.categoryName || "공정"} | ${tpl.carModel || ""} ${tpl.partName || ""} (${tpl.title || ""}) 클릭 시 즉시 불러오기`}
                >
                  <span>{label}</span>
                  {tpl.processName && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                        isSelected ? "bg-slate-900 text-emerald-300" : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {tpl.processName}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!window.confirm(`[${label}] 등록된 일보/양식을 DB에서 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`)) return;
                    try {
                      await deleteWorkReportTemplate?.(tpl.id);
                      try {
                        await deleteMachiningWorkReport?.(tpl.id);
                      } catch (mErr) {}
                      if (currentReport.id === tpl.id) {
                        setCurrentReport?.(PRESET_REPORTS[0]);
                        setAppliedTemplateBanner?.(null);
                      }
                      showToast?.(`🗑️ [${label}] 등록된 일보가 삭제되었습니다.`);
                    } catch (err) {
                      alert("삭제 실패: " + err.message);
                    }
                  }}
                  className={`p-1 pr-1.5 transition cursor-pointer hover:bg-rose-500/20 rounded-r-lg ${
                    isSelected ? "text-slate-950 hover:text-rose-900" : "text-rose-400 hover:text-rose-200"
                  }`}
                  title="이 저장 일보 삭제"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 하단 3열: ⚡ 4대 기본 표준 프리셋 탭 */}
      {!isWorkerRecordingMode && (
        <div className="pt-1.5 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-black text-slate-400 shrink-0 flex items-center gap-1 whitespace-nowrap">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>기본 프리셋 (4종):</span>
          </span>
          {PRESET_REPORTS.map((preset) => {
            const isSelected = currentReport.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleLoadPreset?.(preset.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  isSelected
                    ? "bg-cyan-500 text-slate-950 font-black shadow-xs ring-1 ring-cyan-300"
                    : "bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
                }`}
              >
                <span>{preset.name}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                    isSelected ? "bg-slate-900 text-cyan-300" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {preset.badge}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default LegoTopHeroToolbar;
