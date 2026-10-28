import React from "react";
import { X, Plus, CheckCircle2, Layers } from "lucide-react";
import { ALL_DASHBOARD_BLOCKS } from "../../../config/dashboardPanelConfig";

export const AddPanelModal = ({
  isOpen,
  onClose,
  activePanels = [],
  insertIndex = null,
  onAddBlock
}) => {
  if (!isOpen) return null;

  // Inactive blocks that can be added
  const availableBlocks = ALL_DASHBOARD_BLOCKS.filter(
    (b) => !activePanels.includes(b.key)
  );

  // Group by category
  const categories = ["품질/4M", "생산/작업일보", "경영/인사", "공통", "소통/도구", "안전"];

  const handleSelectBlock = (blockKey) => {
    if (onAddBlock) {
      onAddBlock(blockKey, insertIndex);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white shadow-md">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white tracking-tight">
                ➕ 새 패널/뱃지 추가
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {insertIndex !== null
                  ? `#${insertIndex + 1}번째 위치에 삽입할 대시보드 블록을 선택하세요.`
                  : "화면에 추가할 대시보드 블록을 선택하세요."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {availableBlocks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-80" />
              <p className="font-bold text-sm text-slate-200">
                모든 대시보드 블록({ALL_DASHBOARD_BLOCKS.length}개)이 현재 화면에 배치되어 있습니다.
              </p>
              <p className="text-xs text-slate-500">
                기존 패널을 삭제(제외)하면 이곳에서 다시 추가할 수 있습니다.
              </p>
            </div>
          ) : (
            categories.map((cat) => {
              const blocksInCat = availableBlocks.filter((b) =>
                b.category.includes(cat) || cat.includes(b.category)
              );
              if (blocksInCat.length === 0) return null;

              return (
                <div key={cat} className="space-y-2">
                  <div className="font-black text-[11px] text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    <span>{cat}</span>
                    <span className="text-slate-500 text-[10px]">({blocksInCat.length})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {blocksInCat.map((b) => (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => handleSelectBlock(b.key)}
                        className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/60 text-left transition-all cursor-pointer group flex items-start justify-between gap-2 shadow-xs active:scale-98"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-black text-xs text-slate-200 group-hover:text-white truncate">
                              {b.label}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 text-[9.5px] font-bold shrink-0">
                              {b.badge}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 group-hover:text-slate-400 line-clamp-2">
                            {b.description}
                          </p>
                        </div>
                        <div className="w-6 h-6 rounded-lg bg-slate-800 group-hover:bg-cyan-600 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-500">
            총 {availableBlocks.length}개의 패널 블록 추가 가능
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer transition"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddPanelModal;
