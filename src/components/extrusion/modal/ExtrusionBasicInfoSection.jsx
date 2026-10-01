import React from "react";
import { Cpu, Check, Sun, Moon } from "lucide-react";
import { WORKER_PRESETS } from "../../../services/extrusionProductionService";

export const CLEAN_LINE_OPTIONS = [
  { id: "pcm1", name: "PCM 1호", fullName: "PCM #1 LINE", color: "teal" },
  { id: "pcm3", name: "PCM 3호", fullName: "PCM #3 LINE", color: "blue" },
  { id: "pvc", name: "PVC", fullName: "PVC LINE", color: "amber" },
  { id: "tpe", name: "TPE", fullName: "TPE LINE", color: "purple" }
];

export const ExtrusionBasicInfoSection = ({
  formData,
  onLineSelect,
  onDateChange,
  onShiftChange,
  onToggleWorker,
  errors = {}
}) => {
  const currentWorkers = String(formData?.worker || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
      {/* Header & Line Segmented Pills */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-200/80 dark:border-slate-700/60">
        <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
          <Cpu className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          ① 기본 정보
        </span>

        {/* Compact Line Selector Pills */}
        <div className="inline-flex p-0.5 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-300 dark:border-slate-700">
          {CLEAN_LINE_OPTIONS.map((l) => {
            const isSel = formData?.lineId === l.id;
            const activeStyle =
              l.id === "pcm1" ? "bg-teal-600 text-white shadow-xs font-black" :
              l.id === "pcm3" ? "bg-blue-600 text-white shadow-xs font-black" :
              l.id === "pvc" ? "bg-amber-600 text-white shadow-xs font-black" :
              "bg-purple-600 text-white shadow-xs font-black";

            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onLineSelect(l.id, l.fullName)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  isSel
                    ? activeStyle
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{l.name}</span>
                {isSel && <Check className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date & Shift */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 items-center">
        {/* 1. Date */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
            작업일자
          </label>
          <input
            type="date"
            value={formData?.date || ""}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
          />
          {errors.date && <p className="text-rose-500 text-[10px] mt-0.5">{errors.date}</p>}
        </div>

        {/* 2. Shift Toggle */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
            근무조
          </label>
          <div className="grid grid-cols-2 gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-300 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onShiftChange("주간")}
              className={`py-1 rounded-lg font-black text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                formData?.shift === "주간"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <Sun className="w-3 h-3" />
              <span>주간</span>
            </button>
            <button
              type="button"
              onClick={() => onShiftChange("야간")}
              className={`py-1 rounded-lg font-black text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                formData?.shift === "야간"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <Moon className="w-3 h-3" />
              <span>야간</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. 압출동 11명 작업자 복수선택 뱃지 */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>작업자 선택</span>
            <span className="text-[9.5px] text-teal-600 dark:text-teal-400 font-bold">(압출동 11명 · 복수선택 가능)</span>
          </label>
          {currentWorkers.length > 0 && (
            <span className="text-[10.5px] font-black text-teal-700 dark:text-teal-300 truncate max-w-full">
              ✓ {currentWorkers.length}명 선택: {currentWorkers.join(", ")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {WORKER_PRESETS.map((w) => {
            const label = w.title ? `${w.name} ${w.title}` : w.name;
            const isSelected = currentWorkers.some(
              (cw) => cw === label || cw === w.name || cw.startsWith(w.name) || w.name.startsWith(cw)
            );

            return (
              <button
                key={w.name}
                type="button"
                onClick={() => onToggleWorker(label)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-teal-600 text-white border-teal-700 shadow-xs font-black ring-1 ring-teal-400/40"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{w.name}</span>
                {w.title && (
                  <span className={`text-[10.5px] font-black ${isSelected ? "text-teal-200" : "text-slate-500 dark:text-slate-400"}`}>
                    {w.title}
                  </span>
                )}
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-0.5" />}
              </button>
            );
          })}
        </div>
        {errors.worker && <p className="text-rose-500 text-[10px] mt-0.5">{errors.worker}</p>}
      </div>
    </div>
  );
};

export default ExtrusionBasicInfoSection;
