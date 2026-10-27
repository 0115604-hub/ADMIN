import React from "react";
import { Sliders, Edit3 } from "lucide-react";

export const LegoBlockSwitcherSidebar = ({
  isWorkerRecordingMode = false,
  combinedSwitchCatalog = [],
  setPhotoModalTab,
  setShowPhotoRefModal,
  handleResetBlockOrder,
  orderedBlockItems = [],
  currentReport = {},
  setCurrentReport,
  selectedBlockKey = "",
  draggedBlockIdx,
  setDraggedBlockIdx,
  dragOverBlockIdx,
  setDragOverBlockIdx,
  handleBlockDrop,
  handleSelectBlock,
  handleToggleBlock,
  handleMoveBlockOrder,
  handleOpenBlockEditor,
  handleUpdateField
}) => {
  if (isWorkerRecordingMode) return null;

  return (
    <div className="lg:col-span-4 space-y-4">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 gap-2 flex-wrap">
          <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <span>{combinedSwitchCatalog.length}대 레고 블록 조립 스위치</span>
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setPhotoModalTab?.("UPLOAD");
                setShowPhotoRefModal?.(true);
              }}
              className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black cursor-pointer shadow-2xs"
              title="그림파일로 블록사진 업로드 및 자동 분석 저장"
            >
              📷 +사진블록 추가
            </button>
            <span className="text-[10.5px] font-black text-indigo-600 dark:text-cyan-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
              ⠿ 드래그 순서변경
            </span>
            <button
              type="button"
              onClick={handleResetBlockOrder}
              className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-300 cursor-pointer"
              title="블록 순서를 기본값으로 초기화"
            >
              🔄 순서초기화
            </button>
          </div>
        </div>

        {/* Block Switches with Drag & Drop Ordering, Selection & In-App Edit */}
        <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
          {orderedBlockItems.map((item, idx) => {
            const isActive = Boolean(currentReport.activeBlocks?.[item.key]);
            const isSelected = selectedBlockKey === item.key;
            const isDragged = draggedBlockIdx === idx;
            const isDragOver = dragOverBlockIdx === idx && draggedBlockIdx !== idx;
            return (
              <div
                key={item.key}
                draggable
                onDragStart={(e) => {
                  setDraggedBlockIdx?.(idx);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverBlockIdx !== idx) {
                    setDragOverBlockIdx?.(idx);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverBlockIdx === idx) {
                    setDragOverBlockIdx?.(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleBlockDrop?.(idx);
                }}
                onDragEnd={() => {
                  setDraggedBlockIdx?.(null);
                  setDragOverBlockIdx?.(null);
                }}
                className={`w-full p-2 rounded-2xl border text-left flex items-center justify-between transition-all cursor-grab active:cursor-grabbing ${
                  isDragged ? "opacity-40 scale-95 border-dashed " : ""
                }${
                  isDragOver ? "border-t-4 border-t-cyan-400 bg-indigo-500/15 " : ""
                }${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400 scale-[1.01]"
                    : isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-950 dark:text-indigo-200 shadow-2xs hover:border-indigo-500"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60 hover:opacity-100"
                }`}
              >
                {/* Clickable label for block selection */}
                <button
                  type="button"
                  onClick={() => handleSelectBlock?.(item.key)}
                  className="flex items-center gap-1.5 flex-1 min-w-0 text-left cursor-pointer"
                >
                  <span
                    className={`text-xs px-1 rounded select-none cursor-grab shrink-0 ${
                      isSelected ? "text-indigo-200 hover:text-white" : "text-slate-400 hover:text-indigo-500"
                    }`}
                    title="마우스로 잡고 위아래로 드래그하여 순서를 변경하세요"
                  >
                    ⠿
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleBlock?.(item.key);
                    }}
                    className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 transition ${
                      isActive
                        ? isSelected
                          ? "bg-white text-indigo-700 font-black"
                          : "bg-indigo-600 text-white font-black"
                        : "border border-slate-400 hover:border-indigo-500"
                    }`}
                    title={isActive ? "클릭하여 비활성화" : "클릭하여 활성화"}
                  >
                    {isActive ? "✓" : ""}
                  </span>
                  <span className={`text-[11.5px] truncate ${isSelected ? "font-black text-white" : "font-bold"}`}>
                    {idx + 1}. {item.label}
                  </span>
                </button>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                  {/* Up / Down Order Buttons */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveBlockOrder?.(idx, -1);
                    }}
                    disabled={idx === 0}
                    className={`px-1 py-0.5 rounded text-[9.5px] font-black transition cursor-pointer disabled:opacity-30 ${
                      isSelected
                        ? "hover:bg-indigo-700 text-indigo-100"
                        : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                    }`}
                    title="위로 이동"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveBlockOrder?.(idx, 1);
                    }}
                    disabled={idx === orderedBlockItems.length - 1}
                    className={`px-1 py-0.5 rounded text-[9.5px] font-black transition cursor-pointer disabled:opacity-30 ${
                      isSelected
                        ? "hover:bg-indigo-700 text-indigo-100"
                        : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                    }`}
                    title="아래로 이동"
                  >
                    ▼
                  </button>

                  {/* In-App Block Editor Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenBlockEditor?.(item.key);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? "bg-white text-indigo-700 hover:bg-indigo-50 shadow-xs"
                        : "bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-200"
                    }`}
                    title="이 블록의 세부 내용 앱내 편집"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>편집</span>
                  </button>
                  <span
                    className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected
                        ? "bg-indigo-700 text-indigo-200"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Header Metadata Customizer */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
        <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-cyan-500" />
          <span>기본 메타데이터 수정</span>
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-0.5">차종명 (Car model)</label>
            <input
              type="text"
              value={currentReport.carModel || ""}
              onChange={(e) => handleUpdateField?.("carModel", e.target.value)}
              className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center text-cyan-600 dark:text-cyan-400"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-0.5">품명 (Part name)</label>
            <input
              type="text"
              value={currentReport.partName || ""}
              onChange={(e) => handleUpdateField?.("partName", e.target.value)}
              className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center"
            />
          </div>
          <div className="col-span-2">
            <label className="text-[11px] font-bold text-slate-400 block mb-0.5">공정명 (Process name)</label>
            <input
              type="text"
              value={currentReport.processName ?? "소재준비"}
              onChange={(e) => {
                const val = e.target.value;
                setCurrentReport?.((prev) => ({
                  ...prev,
                  processName: val
                }));
              }}
              placeholder="예: 소재준비 / 정치절단 / 단컷팅 / 조인트 / 직각검사"
              className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center text-indigo-600 dark:text-indigo-400"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-0.5">작업자</label>
            <input
              type="text"
              value={currentReport.workerName || ""}
              onChange={(e) => handleUpdateField?.("workerName", e.target.value)}
              className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center text-indigo-600 dark:text-indigo-400"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-0.5">작업일자</label>
            <input
              type="date"
              value={currentReport.workDate || ""}
              onChange={(e) => handleUpdateField?.("workDate", e.target.value)}
              className="w-full px-2 py-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-0.5">근무조</label>
            <select
              value={currentReport.shift || "주간"}
              onChange={(e) => handleUpdateField?.("shift", e.target.value)}
              className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center"
            >
              <option value="주간">주간 (Day)</option>
              <option value="야간">야간 (Night)</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-0.5">양식 번호</label>
            <input
              type="text"
              value={currentReport.formNo || ""}
              onChange={(e) => handleUpdateField?.("formNo", e.target.value)}
              className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-black text-center font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default LegoBlockSwitcherSidebar;
