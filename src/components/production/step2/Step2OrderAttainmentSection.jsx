import React from "react";

/**
 * 🎯 2단계 공정관리자: 생산오더 ↔ 생산실적 달성률 (인터랙티브 아이템 뱃지 & 카드)
 */
export default function Step2OrderAttainmentSection({
  effectiveProcess,
  selectedItemBadge,
  setSelectedItemBadge,
  machiningStats,
  extrusionStats,
  onOpenOrderEdit
}) {
  return (
    <div className="space-y-3">
      {/* Item Selection Badge Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 pb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 mr-1 flex items-center gap-1">
            <span>🏷️</span> <span>담당 아이템 선택:</span>
          </span>

          {/* Machining Items */}
          {effectiveProcess === "machining" ? (
            <>
              <button
                type="button"
                onClick={() => setSelectedItemBadge(selectedItemBadge === "HR" ? "ALL" : "HR")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedItemBadge === "HR"
                    ? "bg-amber-600 text-white shadow-md ring-2 ring-amber-300 scale-105"
                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 hover:bg-amber-100"
                }`}
              >
                <span>🚚</span> <span>HR G/RUN</span>
                {selectedItemBadge === "HR" && <span className="bg-amber-900 text-amber-200 px-1.5 py-0.2 rounded-full text-[9px]">선택됨</span>}
              </button>
              <button
                type="button"
                onClick={() => setSelectedItemBadge(selectedItemBadge === "JA" ? "ALL" : "JA")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedItemBadge === "JA"
                    ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300 scale-105"
                    : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 hover:bg-indigo-100"
                }`}
              >
                <span>🚗</span> <span>JA G/RUN</span>
                {selectedItemBadge === "JA" && <span className="bg-indigo-900 text-indigo-200 px-1.5 py-0.2 rounded-full text-[9px]">선택됨</span>}
              </button>
              <button
                type="button"
                onClick={() => setSelectedItemBadge(selectedItemBadge === "NX5A" ? "ALL" : "NX5A")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedItemBadge === "NX5A"
                    ? "bg-teal-600 text-white shadow-md ring-2 ring-teal-300 scale-105"
                    : "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 hover:bg-teal-100"
                }`}
              >
                <span>⚡</span> <span>NX5a PTR</span>
                {selectedItemBadge === "NX5A" && <span className="bg-teal-900 text-teal-200 px-1.5 py-0.2 rounded-full text-[9px]">선택됨</span>}
              </button>
            </>
          ) : (
            /* Extrusion Lines */
            <>
              <button
                type="button"
                onClick={() => setSelectedItemBadge("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedItemBadge === "ALL"
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md ring-2 ring-slate-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                전체 라인 보기
              </button>
              {["1호기", "2호기", "3호기", "4호기"].map((lineKey) => (
                <button
                  key={lineKey}
                  type="button"
                  onClick={() => setSelectedItemBadge(selectedItemBadge === lineKey ? "ALL" : lineKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedItemBadge === lineKey
                      ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300 scale-105"
                      : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 hover:bg-indigo-100"
                  }`}
                >
                  <span>🏭</span> <span>{lineKey}</span>
                  {selectedItemBadge === lineKey && <span className="bg-indigo-900 text-indigo-200 px-1.5 py-0.2 rounded-full text-[9px]">선택됨</span>}
                </button>
              ))}
            </>
          )}
        </div>

        {selectedItemBadge !== "ALL" && (
          <button
            type="button"
            onClick={() => setSelectedItemBadge("ALL")}
            className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>✕ 필터 해제 (전체 보기)</span>
          </button>
        )}
      </div>

      {/* Machining 3 Item Cards */}
      {effectiveProcess === "machining" ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* HR */}
          <div
            onClick={() => setSelectedItemBadge(selectedItemBadge === "HR" ? "ALL" : "HR")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
              selectedItemBadge === "HR"
                ? "bg-amber-100/90 dark:bg-amber-950/80 border-amber-500 ring-4 ring-amber-400 shadow-xl scale-[1.02]"
                : "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200/80 dark:border-amber-900/40 hover:shadow-md hover:border-amber-400"
            }`}
            title="클릭 시 HR 전용 비가동 및 작업일보가 필터링됩니다"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <span>🚚</span>
                <span>HR G/RUN (포터)</span>
                {selectedItemBadge === "HR" && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[9px] font-black">
                    선택됨
                  </span>
                )}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${Number(machiningStats.HR.attainment) >= 100 ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-400" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400"}`}>
                달성률 {machiningStats.HR.attainment}%
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs pt-0.5">
              <div className="space-y-0.5">
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">생산오더 (목표)</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenOrderEdit("HR", machiningStats.HR.order, "machining");
                  }}
                  className="font-mono font-bold text-amber-700 dark:text-amber-300 text-sm hover:underline cursor-pointer flex items-center gap-1 p-1 rounded hover:bg-amber-200/50"
                  title="클릭하여 HR 당일 생산오더를 수정합니다"
                >
                  <span>{machiningStats.HR.order.toLocaleString()} EA</span>
                  <span className="text-[10px] text-slate-400">✏️</span>
                </button>
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">당일 실적 (양품)</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                  {machiningStats.HR.gen.toLocaleString()} EA
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${Number(machiningStats.HR.attainment) >= 100 ? "bg-gradient-to-r from-blue-500 to-indigo-500" : "bg-gradient-to-r from-amber-500 to-emerald-500"}`}
                style={{ width: `${Math.min(100, Math.max(0, Number(machiningStats.HR.attainment)))}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span>불량: {machiningStats.HR.bad.toLocaleString()} EA</span>
              <span className="font-bold text-slate-600 dark:text-slate-300">총 {machiningStats.HR.gross.toLocaleString()} EA</span>
            </div>
          </div>

          {/* JA */}
          <div
            onClick={() => setSelectedItemBadge(selectedItemBadge === "JA" ? "ALL" : "JA")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
              selectedItemBadge === "JA"
                ? "bg-indigo-100/90 dark:bg-indigo-950/80 border-indigo-500 ring-4 ring-indigo-400 shadow-xl scale-[1.02]"
                : "bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 border-indigo-200/80 dark:border-indigo-900/40 hover:shadow-md hover:border-indigo-400"
            }`}
            title="클릭 시 JA 전용 비가동 및 작업일보가 필터링됩니다"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <span>🚗</span>
                <span>JA G/RUN (모닝/레이)</span>
                {selectedItemBadge === "JA" && (
                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-black">
                    선택됨
                  </span>
                )}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${Number(machiningStats.JA.attainment) >= 100 ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-400" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400"}`}>
                달성률 {machiningStats.JA.attainment}%
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs pt-0.5">
              <div className="space-y-0.5">
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">생산오더 (목표)</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenOrderEdit("JA", machiningStats.JA.order, "machining");
                  }}
                  className="font-mono font-bold text-indigo-700 dark:text-indigo-300 text-sm hover:underline cursor-pointer flex items-center gap-1 p-1 rounded hover:bg-indigo-200/50"
                  title="클릭하여 JA 당일 생산오더를 수정합니다"
                >
                  <span>{machiningStats.JA.order.toLocaleString()} EA</span>
                  <span className="text-[10px] text-slate-400">✏️</span>
                </button>
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">당일 실적 (양품)</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                  {machiningStats.JA.gen.toLocaleString()} EA
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${Number(machiningStats.JA.attainment) >= 100 ? "bg-gradient-to-r from-blue-500 to-indigo-500" : "bg-gradient-to-r from-indigo-500 to-emerald-500"}`}
                style={{ width: `${Math.min(100, Math.max(0, Number(machiningStats.JA.attainment)))}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span>불량: {machiningStats.JA.bad.toLocaleString()} EA</span>
              <span className="font-bold text-slate-600 dark:text-slate-300">총 {machiningStats.JA.gross.toLocaleString()} EA</span>
            </div>
          </div>

          {/* NX5a */}
          <div
            onClick={() => setSelectedItemBadge(selectedItemBadge === "NX5A" ? "ALL" : "NX5A")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
              selectedItemBadge === "NX5A"
                ? "bg-teal-100/90 dark:bg-teal-950/80 border-teal-500 ring-4 ring-teal-400 shadow-xl scale-[1.02]"
                : "bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 border-teal-200/80 dark:border-teal-900/40 hover:shadow-md hover:border-teal-400"
            }`}
            title="클릭 시 NX5a 전용 비가동 및 작업일보가 필터링됩니다"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                <span>⚡</span>
                <span>NX5a PTR (투싼 PE)</span>
                {selectedItemBadge === "NX5A" && (
                  <span className="px-1.5 py-0.5 rounded-full bg-teal-600 text-white text-[9px] font-black">
                    선택됨
                  </span>
                )}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${Number(machiningStats.NX5A.attainment) >= 95 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-400"}`}>
                달성률 {machiningStats.NX5A.attainment}%
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs pt-0.5">
              <div className="space-y-0.5">
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">생산오더 (목표)</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenOrderEdit("NX5A", machiningStats.NX5A.order, "machining");
                  }}
                  className="font-mono font-bold text-teal-700 dark:text-teal-300 text-sm hover:underline cursor-pointer flex items-center gap-1 p-1 rounded hover:bg-teal-200/50"
                  title="클릭하여 NX5a 당일 생산오더를 수정합니다"
                >
                  <span>{machiningStats.NX5A.order.toLocaleString()} EA</span>
                  <span className="text-[10px] text-slate-400">✏️</span>
                </button>
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">당일 실적 (양품)</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                  {machiningStats.NX5A.gen.toLocaleString()} EA
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${Number(machiningStats.NX5A.attainment) >= 95 ? "bg-gradient-to-r from-teal-500 to-emerald-500" : "bg-gradient-to-r from-amber-500 to-rose-500"}`}
                style={{ width: `${Math.min(100, Math.max(0, Number(machiningStats.NX5A.attainment)))}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span>불량: {machiningStats.NX5A.bad.toLocaleString()} EA</span>
              <span className="font-bold text-slate-600 dark:text-slate-300">총 {machiningStats.NX5A.gross.toLocaleString()} EA</span>
            </div>
          </div>
        </div>
      ) : (
        /* Extrusion 4 Lines Cards */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Object.keys(extrusionStats).map((lineKey) => {
            const lineData = extrusionStats[lineKey];
            const isSelected = selectedItemBadge === lineKey;
            return (
              <div
                key={lineKey}
                onClick={() => setSelectedItemBadge(isSelected ? "ALL" : lineKey)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                  isSelected
                    ? "bg-indigo-100/90 dark:bg-indigo-950/80 border-indigo-500 ring-4 ring-indigo-400 shadow-xl scale-[1.02]"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-400"
                }`}
                title={`클릭 시 ${lineKey} 전용 비가동 및 작업일보가 필터링됩니다`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                    <span>🏭</span> <span>{lineKey}</span>
                    {isSelected && <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[9px] font-black">선택</span>}
                  </span>
                  <span className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400">
                    {lineData.attainment}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">오더 (m)</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenOrderEdit(lineKey === "1호기" ? "pcm1" : lineKey === "2호기" ? "pcm3" : lineKey === "3호기" ? "pvc" : "tpe", lineData.order, "extrusion");
                      }}
                      className="font-mono font-bold text-indigo-700 dark:text-indigo-300 hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>{lineData.order.toLocaleString()}</span>
                      <span className="text-[9px] text-slate-400">✏️</span>
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">실적 (m)</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      {lineData.outputM.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, Number(lineData.attainment)))}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
