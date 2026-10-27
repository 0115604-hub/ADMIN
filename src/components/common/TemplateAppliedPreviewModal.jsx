import React from "react";
import { X, Eye, CheckCircle2, Zap, Sparkles } from "lucide-react";
import { MaterialPrepStandardA4Sheet } from "../WorkReportTemplateManagerView";
import { REPORT_MAJOR_CATEGORIES } from "../../services/workReportTemplateService";

/**
 * 🌟 5대 공정 작업일보 적용 실물 서식 미리보기 모달
 * 작업일보 양식 설정에서 "미리보기" 뱃지 클릭 시
 * 현장 작업자 화면에 실제로 적용되는 1:1 A4 실물 서식 레이아웃을 팝업으로 제공
 */
export const TemplateAppliedPreviewModal = ({
  isOpen,
  template,
  slotName = "",
  isApplied = false,
  onApply = null,
  onClose
}) => {
  if (!isOpen || !template) return null;

  const catObj =
    REPORT_MAJOR_CATEGORIES.find((c) => c.id === template.categoryId) ||
    REPORT_MAJOR_CATEGORIES[1];

  return (
    <div
      className="fixed inset-0 z-[280] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black">
                  {catObj.icon} {catObj.name}
                </span>
                {template.carModel && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                    차종: {template.carModel}
                  </span>
                )}
                {template.processName && (
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black">
                    공정: {template.processName}
                  </span>
                )}
                {template.formNo && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
                    양식번호: {template.formNo}
                  </span>
                )}
              </div>
              <h3 className="font-black text-sm sm:text-base text-white truncate flex items-center gap-2">
                <span>{template.title || "작업일보"}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                  적용 실물 미리보기
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onApply && (
              <button
                type="button"
                onClick={() => {
                  onApply(template);
                  onClose();
                }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer whitespace-nowrap ${
                  isApplied
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                }`}
              >
                {isApplied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>✓ 적용됨</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>이 공정에 적용</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Info Banner */}
        <div className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-950 border-b border-indigo-900/40 flex items-center justify-between text-xs text-indigo-200 shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              현장 작업자가 {slotName ? <strong className="text-white underline underline-offset-2">[{slotName}]</strong> : "해당 공정"} 작업일보를 작성할 때 화면에 표시되는 1:1 실물 서식입니다.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
            블록 배치 • 규격 치수 • 불량 집계표 100% 일치
          </span>
        </div>

        {/* Body: Live A4 Sheet Preview */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-950/70 flex flex-col items-center justify-start custom-scrollbar">
          <div className="w-full max-w-4xl bg-white text-slate-950 p-4 sm:p-8 rounded-2xl shadow-2xl border border-slate-300">
            <MaterialPrepStandardA4Sheet template={template} showBlockBadges={false} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 font-medium hidden sm:block">
            💡 초물/중물/종물 규격, LOT 관리, 불량 매트릭스, 설비 조건 및 특기사항이 모두 포함되어 있습니다.
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition active:scale-95"
            >
              닫기
            </button>
            {onApply && !isApplied && (
              <button
                type="button"
                onClick={() => {
                  onApply(template);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>이 양식으로 공정에 적용</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateAppliedPreviewModal;
