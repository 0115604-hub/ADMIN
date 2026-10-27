import React from "react";
import { Plus, Edit3 } from "lucide-react";

export const LegoBlockWrapper = ({
  blockKey,
  blockTitle,
  children,
  isActive = true,
  isWorkerRecordingMode = false,
  selectedBlockKey = "",
  setSelectedBlockKey,
  orderedBlockItems = [],
  handleMoveBlockOrder,
  handleOpenBlockEditor,
  handleToggleBlock,
  showToast,
  t = (s) => s,
  canAddRow = false,
  onAddRow = null,
  customBadge = null
}) => {
  if (!isActive) return null;

  const isSelected = !isWorkerRecordingMode && selectedBlockKey === blockKey;
  const orderIdx = orderedBlockItems.findIndex((b) => b.key === blockKey);

  return (
    <div
      id={`block_container_${blockKey}`}
      style={{ order: orderIdx >= 0 ? orderIdx : 99 }}
      onClick={isWorkerRecordingMode ? undefined : () => setSelectedBlockKey?.(blockKey)}
      className={`rounded-3xl transition-all relative group ${
        isWorkerRecordingMode
          ? "p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-xs"
          : isSelected
          ? "ring-4 ring-indigo-500/90 ring-offset-2 dark:ring-offset-slate-900 shadow-2xl bg-indigo-50/20 dark:bg-indigo-950/20 border-2 border-indigo-500 p-3 sm:p-4 cursor-pointer"
          : "hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-700/60 p-2 sm:p-3 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-300 cursor-pointer"
      }`}
    >
      {/* Interactive Block Top Bar */}
      <div
        className={`flex items-center justify-between p-2 sm:p-2.5 mb-3 rounded-2xl transition-all flex-wrap gap-2 ${
          isWorkerRecordingMode
            ? "bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            : isSelected
            ? "bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white shadow-lg"
            : "bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isWorkerRecordingMode ? "bg-emerald-500" : isSelected ? "bg-cyan-300 animate-pulse" : "bg-indigo-500"
            }`}
          ></span>
          <span className="text-xs sm:text-sm font-black tracking-tight flex items-center gap-1.5 flex-wrap">
            <span>
              {isWorkerRecordingMode ? "🧱 " : isSelected ? "📍 " : "🧱 "}
              {blockTitle}
            </span>
            {isWorkerRecordingMode && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800">
                🔒 {t("SPEC 고정 · 실적기록 전용")}
              </span>
            )}
            {customBadge && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isSelected && !isWorkerRecordingMode
                    ? "bg-white/20 text-cyan-200"
                    : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                }`}
              >
                {customBadge}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap print:hidden">
          {!isWorkerRecordingMode && orderIdx >= 0 && (
            <div className="flex items-center gap-0.5 mr-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveBlockOrder?.(orderIdx, -1);
                }}
                disabled={orderIdx === 0}
                className={`px-1.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer disabled:opacity-30 ${
                  isSelected
                    ? "bg-white/15 hover:bg-white/25 text-white"
                    : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
                title="이 블록을 위로 이동"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveBlockOrder?.(orderIdx, 1);
                }}
                disabled={orderIdx === orderedBlockItems.length - 1}
                className={`px-1.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer disabled:opacity-30 ${
                  isSelected
                    ? "bg-white/15 hover:bg-white/25 text-white"
                    : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
                title="이 블록을 아래로 이동"
              >
                ▼
              </button>
            </div>
          )}

          {!isWorkerRecordingMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenBlockEditor?.(blockKey);
              }}
              className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer ${
                isSelected
                  ? "bg-white text-indigo-700 hover:bg-indigo-50"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
              }`}
              title="이 블록의 세부 규격, 항목, 텍스트를 In-App 모달에서 편집"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>✏️ In-App 블록 편집</span>
            </button>
          )}

          {!isWorkerRecordingMode && canAddRow && onAddRow && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddRow();
              }}
              className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer ${
                isSelected
                  ? "bg-indigo-500 hover:bg-indigo-400 text-white"
                  : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              }`}
              title="행 / 항목 추가"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>행 추가</span>
            </button>
          )}

          {!isWorkerRecordingMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleBlock?.(blockKey);
                showToast?.(`🗑️ [${blockTitle}] 블록이 양식에서 제거되었습니다. (좌측 스위치에서 다시 켤 수 있습니다)`);
              }}
              className="px-2.5 py-1.5 rounded-xl font-black text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-sm flex items-center gap-1 transition active:scale-95 cursor-pointer"
              title="이 블록을 양식에서 즉시 제거"
            >
              <span>🗑️ 블록제거</span>
            </button>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};
export default LegoBlockWrapper;
