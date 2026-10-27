import React from "react";
import {
  Target,
  RefreshCw,
  Save,
  RotateCcw,
  ShieldCheck,
  Calendar,
  Layers
} from "lucide-react";

/**
 * DailyQualityTargetSettingsTab
 * Tab 2: 차종별 품질 목표관리선 설정 시스템
 * - 전월 실적 연동 자동 산출 (5%/10% 감축 규칙)
 * - 4개 코어 차종별 관리선 설정 카드 (JA, HR, NX4, NX4a)
 * - 종합 품질 불량률 관리선 설정 카드
 * - 차종별 종합 비교표 테이블
 */
export const DailyQualityTargetSettingsTab = ({
  selectedMonth,
  getPreviousYearMonth,
  handleAutoRecalculateTargets,
  handleSaveTargets,
  isSavingTargets,
  handleResetTargets,
  QUALITY_CORE_ITEMS,
  activeTargets,
  monthlyData,
  handleUpdateItemTargetRate,
  handleUpdateOverallTargetRate,
  targetOverall,
  overallDefectRate,
}) => {
  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      {/* Top Info Banner with Formula Explanation */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/60 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  차종별 품질 목표관리선 설정 시스템
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-amber-400 text-slate-950">
                  전월 실적 연동 자동 산출
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                기준월: <strong className="text-white">{selectedMonth}</strong> | 전월 실적 기준월: <strong className="text-amber-300">{getPreviousYearMonth(selectedMonth)}</strong>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleAutoRecalculateTargets}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
              title="전월 실적을 재집계하여 5%/10% 감축 규칙을 재적용합니다."
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>⚡ 전월실적 대비 자동 재계산</span>
            </button>

            <button
              type="button"
              onClick={handleSaveTargets}
              disabled={isSavingTargets}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingTargets ? "저장 중..." : "💾 당월 목표관리선 저장"}</span>
            </button>

            <button
              type="button"
              onClick={handleResetTargets}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              title="기본 자동 계산값으로 복원"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>초기화</span>
            </button>
          </div>
        </div>

        {/* Formula Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-indigo-900/50 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-indigo-800/40 flex items-start gap-2">
            <span className="text-emerald-400 text-base font-black">①</span>
            <div>
              <strong className="text-emerald-400 font-bold block">전월 불량률 1.0% 미만 시</strong>
              <span className="text-slate-300 text-[11px]">당월 목표 = 전월 실적 × 0.95 (<strong>5% 낮게 설정</strong> / 5% 감축)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-indigo-800/40 flex items-start gap-2">
            <span className="text-rose-400 text-base font-black">②</span>
            <div>
              <strong className="text-rose-400 font-bold block">전월 불량률 1.0% 이상 시</strong>
              <span className="text-slate-300 text-[11px]">당월 목표 = 전월 실적 × 0.90 (<strong>10% 낮게 설정</strong> / 10% 집중 감축)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-indigo-800/40 flex items-start gap-2">
            <span className="text-amber-400 text-base font-black">③</span>
            <div>
              <strong className="text-amber-400 font-bold block">실시간 정합 및 커스텀 조절</strong>
              <span className="text-slate-300 text-[11px]">목표값을 수동 미세 조정한 후 <strong>[저장]</strong> 시 모든 차트/대시보드에 즉시 연동</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Item Setting Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 4 Core Items */}
        {QUALITY_CORE_ITEMS.map((core) => {
          const itemTargetObj = activeTargets?.items?.[core.id] || {};
          const prevRate = itemTargetObj.prevRate !== undefined ? itemTargetObj.prevRate : (core.id === "ja" ? 0.86 : core.id === "nx4a" ? 0.76 : core.id === "nx4" ? 0.20 : 0.56);
          const targetRate = itemTargetObj.targetRate !== undefined ? itemTargetObj.targetRate : (prevRate < 1.0 ? Number((prevRate * 0.95).toFixed(2)) : Number((prevRate * 0.90).toFixed(2)));
          
          const currentMonthItem = monthlyData.items.find((i) => i.id === core.id) || { inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0 };
          const currentRate = currentMonthItem.defectRate || 0;
          const isAchieved = currentRate <= targetRate;
          const gap = Number((currentRate - targetRate).toFixed(2));

          const themeMap = {
            ja: { border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
            hr: { border: "border-rose-200 dark:border-rose-800", dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
            nx4a: { border: "border-teal-200 dark:border-teal-800", dot: "bg-teal-500", text: "text-teal-600 dark:text-teal-400" },
            nx4: { border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" }
          };
          const theme = themeMap[core.id] || themeMap.ja;

          return (
            <div
              key={core.id}
              className={`bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border ${theme.border} shadow-sm space-y-4 flex flex-col justify-between`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${theme.dot}`}></span>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                      {core.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-bold">
                      차종: {core.carModel} · 단가 ₩{core.defaultUnitPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-black border ${
                  isAchieved
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
                }`}>
                  {isAchieved ? "목표달성 ✓" : "관리주의 🚨"}
                </span>
              </div>

              {/* Prev Month Record & Reduction Rule */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>전월({getPreviousYearMonth(selectedMonth)}) 실적 불량률</span>
                  </span>
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                    {prevRate.toFixed(2)}%
                  </span>
                </div>
                <div className="text-[10.5px] text-slate-400 flex items-center justify-between">
                  <span>적용 공식</span>
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    {prevRate < 1.0 ? "5% 감축 (×0.95)" : "10% 감축 (×0.90)"}
                  </strong>
                </div>
              </div>

              {/* Target Rate Input with Quick Buttons */}
              <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>당월({selectedMonth}) 목표관리선</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    자동산출: {(prevRate < 1.0 ? prevRate * 0.95 : prevRate * 0.90).toFixed(2)}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateItemTargetRate(core.id, Math.max(0.01, targetRate - 0.05))}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer shadow-2xs"
                  >
                    -0.05%
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="10.0"
                      value={targetRate}
                      onChange={(e) => handleUpdateItemTargetRate(core.id, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-600 bg-white dark:bg-slate-900 font-mono font-black text-base text-slate-900 dark:text-white text-center outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute right-3 top-2 text-xs font-black text-slate-400">%</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateItemTargetRate(core.id, targetRate + 0.05)}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer shadow-2xs"
                  >
                    +0.05%
                  </button>
                </div>
              </div>

              {/* Current Month Actual vs Target Gap */}
              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-500 dark:text-slate-400">
                    당월 현재 실적 불량률
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <strong className={`font-black ${isAchieved ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {currentRate}%
                    </strong>
                    <span className="text-[10.5px] text-slate-400">
                      ({isAchieved ? `${Math.abs(gap)}%p 여유` : `+${gap}%p 초과`})
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all ${isAchieved ? "bg-emerald-500" : "bg-rose-500"}`}
                    style={{ width: `${Math.min(100, Math.max(5, (currentRate / (targetRate || 1)) * 100))}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>검사량 {currentMonthItem.inspectQty.toLocaleString()} EA 기준</span>
                  <span>허용 최대 불량수: <strong className="font-mono text-slate-700 dark:text-slate-300 font-bold">{Math.floor((currentMonthItem.inspectQty * targetRate) / 100)} EA</strong></span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Overall Card (종합 합계) */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-indigo-800 shadow-sm space-y-4 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-indigo-800/80">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-white">
                  종합 품질 불량률 목표선
                </h3>
                <span className="text-[11px] text-indigo-300">
                  4개 코어 차종 통합 누적 관리선
                </span>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-black border ${
              overallDefectRate <= targetOverall
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
            }`}>
              {overallDefectRate <= targetOverall ? "종합 달성 ✓" : "종합 관리필요 🚨"}
            </span>
          </div>

          {/* Prev Month Box */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-indigo-800/60 space-y-1 text-xs">
            <div className="flex items-center justify-between text-indigo-200">
              <span className="font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>전월({getPreviousYearMonth(selectedMonth)}) 종합 불량률</span>
              </span>
              <span className="font-mono font-black text-sm text-white">
                {(activeTargets?.overall?.prevRate || 0.62).toFixed(2)}%
              </span>
            </div>
            <div className="text-[10.5px] text-indigo-300">
              전월 1% 미만 적용: 5% 감축 (×0.95 = {((activeTargets?.overall?.prevRate || 0.62) * 0.95).toFixed(2)}%)
            </div>
          </div>

          {/* Target Input */}
          <div className="p-3.5 rounded-2xl bg-indigo-900/40 border border-indigo-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>당월({selectedMonth}) 종합 목표선</span>
              </label>
              <span className="text-[10px] text-indigo-300 font-bold">
                기본값: 0.59%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleUpdateOverallTargetRate(Math.max(0.01, targetOverall - 0.05))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-indigo-700 text-xs font-black text-white hover:bg-slate-700 cursor-pointer"
              >
                -0.05%
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="10.0"
                  value={targetOverall}
                  onChange={(e) => handleUpdateOverallTargetRate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-amber-400 bg-slate-900 font-mono font-black text-base text-amber-300 text-center outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="absolute right-3 top-2 text-xs font-black text-slate-400">%</span>
              </div>

              <button
                type="button"
                onClick={() => handleUpdateOverallTargetRate(targetOverall + 0.05)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-indigo-700 text-xs font-black text-white hover:bg-slate-700 cursor-pointer"
              >
                +0.05%
              </button>
            </div>
          </div>

          {/* Current Status */}
          <div className="space-y-1.5 text-xs pt-1">
            <div className="flex items-center justify-between font-bold text-indigo-200">
              <span>당월 종합 현재 불량률</span>
              <span className="font-mono font-black text-base text-white">
                {overallDefectRate}%
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${overallDefectRate <= targetOverall ? "bg-emerald-400" : "bg-rose-500"}`}
                style={{ width: `${Math.min(100, Math.max(5, (overallDefectRate / (targetOverall || 1)) * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>차종별 전월 실적 대비 당월 품질 목표관리선 종합 비교표</span>
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 text-center">품목명 / 차종</th>
                <th className="p-3 text-right">단가</th>
                <th className="p-3 text-right">전월 실적불량률</th>
                <th className="p-3 text-center">적용 규칙</th>
                <th className="p-3 text-center bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 font-black">
                  당월 목표관리선
                </th>
                <th className="p-3 text-right">당월 현재실적</th>
                <th className="p-3 text-center">목표 달성 여부</th>
                <th className="p-3 text-right">손실금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {QUALITY_CORE_ITEMS.map((core) => {
                const itemTargetObj = activeTargets?.items?.[core.id] || {};
                const prevRate = itemTargetObj.prevRate !== undefined ? itemTargetObj.prevRate : (core.id === "ja" ? 0.86 : core.id === "nx4a" ? 0.76 : core.id === "nx4" ? 0.20 : 0.56);
                const targetRate = itemTargetObj.targetRate !== undefined ? itemTargetObj.targetRate : (prevRate < 1.0 ? Number((prevRate * 0.95).toFixed(2)) : Number((prevRate * 0.90).toFixed(2)));
                const cur = monthlyData.items.find((i) => i.id === core.id) || { inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0 };
                const isGood = cur.defectRate <= targetRate;

                return (
                  <tr key={core.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-black text-slate-900 dark:text-white">
                      {core.name} ({core.carModel})
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      ₩{core.defaultUnitPrice.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {prevRate.toFixed(2)}%
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10.5px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {prevRate < 1.0 ? "5% 감축 (×0.95)" : "10% 감축 (×0.90)"}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-black text-amber-700 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/10 text-sm">
                      {targetRate.toFixed(2)}% 이하
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      <span className={isGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                        {cur.defectRate}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[10.5px] font-black ${
                        isGood ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      }`}>
                        {isGood ? "목표 달성 ✓" : "초과 주의 🚨"}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      ₩{cur.lossAmount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-amber-500">
                <td className="p-3">📊 종합 합계</td>
                <td className="p-3 text-right font-mono">-</td>
                <td className="p-3 text-right font-mono text-amber-300">
                  {(activeTargets?.overall?.prevRate || 0.62).toFixed(2)}%
                </td>
                <td className="p-3 text-center text-slate-300 text-[10.5px]">전월대비 5% 감축</td>
                <td className="p-3 text-center font-mono text-amber-300 text-sm">
                  {targetOverall.toFixed(2)}% 이하
                </td>
                <td className="p-3 text-right font-mono text-emerald-400">
                  {overallDefectRate}%
                </td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10.5px] ${
                    overallDefectRate <= targetOverall ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                  }`}>
                    {overallDefectRate <= targetOverall ? "종합 달성" : "관리 주의"}
                  </span>
                </td>
                <td className="p-3 text-right font-mono text-rose-300">
                  ₩{monthlyData.totalLossAmount.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyQualityTargetSettingsTab;
