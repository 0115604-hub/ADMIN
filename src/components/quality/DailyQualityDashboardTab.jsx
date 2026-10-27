import React from "react";
import {
  Activity,
  AlertTriangle,
  Target,
  Layers,
  DollarSign,
  TrendingUp,
  ArrowRight
} from "lucide-react";

/**
 * DailyQualityDashboardTab
 * Tab 1: 품질실적 대시보드
 * - Monthly KPI Banner (5 cards)
 * - 4대 코어 차종별 핵심 카드 (JA, HR, NX4, NX4a)
 * - 일자별 불량률 추이선 SVG 차트
 * - 주요 불량 원인 파레토 도넛 차트 & 순위 목록
 */
export const DailyQualityDashboardTab = ({
  selectedMonth,
  monthlyData,
  isOverallGood,
  overallDefectRate,
  targetOverall,
  scrapTotalRate,
  getItemTarget,
  chartDays,
  qualityGraphFilter,
  setQualityGraphFilter,
  dynamicDefectAnalysis,
  handleOpenPopupItem,
  setPopupItem,
}) => {
  return (
    <>
      {/* 2. MONTHLY OVERVIEW KPI BANNER (5-STAT OVERVIEW) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* Card 1: 총 검사수량 */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
            <span>{selectedMonth.slice(5, 7)}월 총 검사수량</span>
            <Activity className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
            {monthlyData.totalInspectQty.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">EA</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            4개 차종 누적 검사 합계
          </div>
        </div>

        {/* Card 2: 총 불량수량 */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
            <span>총 불량수량</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-rose-600 dark:text-rose-400">
            {monthlyData.totalDefectQty.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">EA</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            어퍼떨어짐 · 수포 · 스코치 등
          </div>
        </div>

        {/* Card 3: 종합 품질 불량률 */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
            <span>종합 품질 불량률</span>
            <Target className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-base sm:text-lg font-black font-mono ${isOverallGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {overallDefectRate}%
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black ${isOverallGood ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"}`}>
              {isOverallGood ? "목표달성 ✓" : "관리주의 🚨"}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            관리 기준: 종합 <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{targetOverall}% 이하</strong>
          </div>
        </div>

        {/* Card 4: 소재 폐기수량 */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
            <span>총 소재 폐기수량</span>
            <Layers className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-amber-600 dark:text-amber-400">
            {(monthlyData.totalScrapQty || 0).toLocaleString()} <span className="text-[11px] font-normal text-slate-400">EA</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            폐기율: <strong className="font-mono text-amber-600 dark:text-amber-400 font-bold">{scrapTotalRate}%</strong> (소재 A·B·C·D)
          </div>
        </div>

        {/* Card 5: 총 품질 손실액 */}
        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
            <span>총 품질 손실금액</span>
            <DollarSign className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-rose-600 dark:text-rose-400">
            ₩ {monthlyData.totalLossAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            단가 기준 불량 손실 총액
          </div>
        </div>
      </div>

      {/* 3. 4대 코어 품목별 핵심 카드 (JA, HR, NX4, NX4a) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {monthlyData.items.map((it) => {
          const itemTarget = getItemTarget(it.id);
          const isGood = it.defectRate <= itemTarget;
          const isHr = it.id === "hr";
          const isNx = it.id === "nx4" || it.id === "nx4a";
          const scrapQty = it.scrapTotal || ((it.scrapA || 0) + (it.scrapB || 0) + (it.scrapC || 0) + (it.scrapD || 0));
          const scrapRate = it.inspectQty > 0 ? Number(((scrapQty / it.inspectQty) * 100).toFixed(2)) : 0;

          const themeConfig = {
            ja: {
              border: isGood ? "border-emerald-200 dark:border-emerald-800/60" : "border-rose-300 dark:border-rose-800",
              bg: "bg-white dark:bg-slate-900",
              badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
              accent: "text-emerald-600 dark:text-emerald-400",
              bar: "bg-emerald-500"
            },
            hr: {
              border: isGood ? "border-emerald-200 dark:border-emerald-800/60" : "border-rose-300 dark:border-rose-800/80",
              bg: isGood ? "bg-white dark:bg-slate-900" : "bg-rose-50/30 dark:bg-rose-950/20",
              badgeBg: isGood ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
              accent: isGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
              bar: isGood ? "bg-emerald-500" : "bg-rose-500"
            },
            nx4a: {
              border: isGood ? "border-teal-200 dark:border-teal-800/60" : "border-rose-300 dark:border-rose-800",
              bg: "bg-white dark:bg-slate-900",
              badgeBg: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
              accent: "text-teal-600 dark:text-teal-400",
              bar: "bg-teal-500"
            },
            nx4: {
              border: isGood ? "border-blue-200 dark:border-blue-800/60" : "border-rose-300 dark:border-rose-800",
              bg: "bg-white dark:bg-slate-900",
              badgeBg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
              accent: "text-blue-600 dark:text-blue-400",
              bar: "bg-blue-500"
            }
          };

          const theme = themeConfig[it.id] || themeConfig.ja;

          return (
            <div
              key={it.id}
              onClick={() => handleOpenPopupItem(it)}
              className={`p-4 rounded-2xl sm:rounded-3xl border ${theme.border} ${theme.bg} shadow-xs hover:shadow-md transition-all cursor-pointer group space-y-3 relative overflow-hidden`}
            >
              {/* Top Accent Strip */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${theme.bar}`}></div>

              {/* Title & Badge */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    {it.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {it.desc}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${theme.badgeBg}`}>
                  {isGood ? "목표달성 ✓" : "관리주의 🚨"}
                </span>
              </div>

              {/* Quality Defect Rate & Target */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-500">품질 불량률</span>
                  <span className={`text-xl sm:text-2xl font-black font-mono ${theme.accent}`}>
                    {it.defectRate}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`${theme.bar} h-full rounded-full transition-all`}
                    style={{ width: `${Math.min(it.defectRate * 50, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>실적: {it.defectQty} / {it.inspectQty.toLocaleString()} EA</span>
                  <span>목표: {itemTarget}% 이하</span>
                </div>
              </div>

              {/* Scrap Rate & Loss Amount */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">소재 폐기율</span>
                  <strong className="text-xs font-black font-mono text-amber-600 dark:text-amber-400">
                    {scrapRate}% ({scrapQty} EA)
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">품질 손실액</span>
                  <strong className="text-xs font-black font-mono text-slate-800 dark:text-slate-200">
                    ₩{it.lossAmount.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Action Link */}
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-emerald-600 pt-1 transition-colors">
                <span>일자별 세부 내역</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. 일자별 불량률 추이선 SVG 차트 & 주요 불량 원인 파레토 도넛 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* LEFT PANE (50%): 일자별 불량률 추이선 SVG 차트 */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                    일자별 불량률 추이선
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                    {selectedMonth.slice(5, 7)}월 실적
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  목표 관리선: <strong className="text-rose-500 font-bold">{qualityGraphFilter === "all" ? `종합 ${targetOverall}%` : `${qualityGraphFilter.toUpperCase()} ${getItemTarget(qualityGraphFilter).toFixed(2)}%`} 이하</strong> 관리
                </p>
              </div>
            </div>

            {/* Item Filter Chips */}
            <div className="flex items-center gap-1 text-[10.5px] font-bold flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => setQualityGraphFilter("all")}
                className={`px-2 py-0.5 rounded text-[10.5px] font-black cursor-pointer transition-colors ${
                  qualityGraphFilter === "all"
                    ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setQualityGraphFilter("hr")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer transition-colors ${
                  qualityGraphFilter === "hr"
                    ? "bg-rose-500 text-white"
                    : "text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/40 hover:bg-rose-100"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> HR
              </button>
              <button
                type="button"
                onClick={() => setQualityGraphFilter("ja")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer transition-colors ${
                  qualityGraphFilter === "ja"
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> JA
              </button>
              <button
                type="button"
                onClick={() => setQualityGraphFilter("nx4a")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer transition-colors ${
                  qualityGraphFilter === "nx4a"
                    ? "bg-teal-600 text-white"
                    : "text-teal-600 dark:text-teal-400 bg-teal-50/70 dark:bg-teal-950/40 hover:bg-teal-100"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span> NX4a
              </button>
              <button
                type="button"
                onClick={() => setQualityGraphFilter("nx4")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer transition-colors ${
                  qualityGraphFilter === "nx4"
                    ? "bg-blue-600 text-white"
                    : "text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> NX4
              </button>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 overflow-hidden relative">
            {(() => {
              const N = chartDays.length;
              const xStart = 75;
              const xEnd = 620;
              const stepX = N > 1 ? (xEnd - xStart) / (N - 1) : 0;
              const getY = (rate) => Math.round(190 - Math.min(Math.max(rate, 0), 1.6) * 100);

              const activeTargetRate = qualityGraphFilter === "all"
                ? targetOverall
                : getItemTarget(qualityGraphFilter);
              const targetY = getY(activeTargetRate);
              const targetLabel = qualityGraphFilter === "all"
                ? `종합 ${activeTargetRate.toFixed(2)}%`
                : `${qualityGraphFilter.toUpperCase()} ${activeTargetRate.toFixed(2)}%`;

              const chartItemConfigs = [
                { id: "hr", name: "HR", color: "#F43F5E", activeColor: "#E11D48", strokeWidth: 3, circleRadius: 4 },
                { id: "ja", name: "JA", color: "#10B981", activeColor: "#059669", strokeWidth: 2.5, circleRadius: 3.5 },
                { id: "nx4a", name: "NX4a", color: "#14B8A6", activeColor: "#0D9488", strokeWidth: 2, circleRadius: 3 },
                { id: "nx4", name: "NX4", color: "#3B82F6", activeColor: "#2563EB", strokeWidth: 2, circleRadius: 3 }
              ];

              return (
                <svg viewBox="0 0 680 230" className="w-full h-auto overflow-visible select-none">
                  {/* Y Axis Grid Lines */}
                  <line x1="45" y1="190" x2="665" y2="190" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                  <text x="36" y="194" fontSize="9.5" fill="currentColor" opacity="0.5" textAnchor="end">0.0%</text>

                  <line x1="45" y1="140" x2="665" y2="140" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                  <text x="36" y="144" fontSize="9.5" fill="currentColor" opacity="0.5" textAnchor="end">0.5%</text>

                  {/* DYNAMIC TARGET LINE */}
                  <line x1="45" y1={targetY} x2="665" y2={targetY} stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4,4" />
                  <rect x="575" y={Math.max(6, targetY - 9)} width="90" height="18" rx="4" fill="#EF4444" fillOpacity="0.15" />
                  <text x="620" y={Math.max(6, targetY - 9) + 13} fontSize="9" fontWeight="900" fill="#DC2626" textAnchor="middle">목표 {targetLabel}</text>

                  <line x1="45" y1="90" x2="665" y2="90" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                  <text x="36" y="94" fontSize="9.5" fill="currentColor" opacity="0.5" textAnchor="end">1.0%</text>

                  <line x1="45" y1="40" x2="665" y2="40" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                  <text x="36" y="44" fontSize="9.5" fill="currentColor" opacity="0.5" textAnchor="end">1.5%</text>

                  {/* X Axis Labels */}
                  {chartDays.map((d, idx) => {
                    const x = N === 1 ? 340 : Math.round(xStart + idx * stepX);
                    const parts = (d.date || "").split("-");
                    const month = parts[1] ? parseInt(parts[1], 10) : 9;
                    const day = parts[2] ? parseInt(parts[2], 10) : 1;
                    const dayLabel = `${month}.${day}(${d.dayOfWeek || "월"})`;
                    return (
                      <text
                        key={d.date || idx}
                        x={x}
                        y="210"
                        fontSize="10"
                        fontWeight="bold"
                        fill="currentColor"
                        opacity="0.7"
                        textAnchor="middle"
                      >
                        {dayLabel}
                      </text>
                    );
                  })}

                  {/* Dynamic Item Polylines and Dots */}
                  {chartItemConfigs.map((cfg) => {
                    const isVisible = qualityGraphFilter === "all" || qualityGraphFilter === cfg.id;
                    const itemTarget = getItemTarget(cfg.id);
                    const pts = chartDays.map((d, idx) => {
                      const it = d.items?.[cfg.id];
                      const rate = it ? (Number(it.defectRate) || 0) : 0;
                      const hasWork = it && (it.inspectQty > 0 || it.defectQty > 0);
                      const x = N === 1 ? 340 : Math.round(xStart + idx * stepX);
                      const y = getY(rate);
                      return { x, y, rate, hasWork, date: d.date };
                    });

                    const validPts = pts.filter((p) => p.hasWork);
                    const pointsStr = validPts.map((p) => `${p.x},${p.y}`).join(" ");

                    return (
                      <g
                        key={cfg.id}
                        opacity={isVisible ? 1 : 0.12}
                        className="transition-opacity duration-200"
                      >
                        {validPts.length > 1 && (
                          <polyline
                            fill="none"
                            stroke={cfg.color}
                            strokeWidth={cfg.strokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={pointsStr}
                          />
                        )}
                        {validPts.map((p, idx) => {
                          const isWarning = p.rate > itemTarget;
                          const isZero = p.rate === 0;
                          const showLabel = idx === validPts.length - 1 || isWarning || isZero;

                          return (
                            <g key={idx}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={isWarning ? cfg.circleRadius + 1 : cfg.circleRadius}
                                fill={isWarning ? cfg.activeColor : cfg.color}
                              />
                              {showLabel && (
                                <text
                                  x={p.x}
                                  y={p.y - (p.y <= 45 ? -12 : 7)}
                                  fontSize="8.5"
                                  fontWeight="900"
                                  fill={isWarning ? "#DC2626" : cfg.color}
                                  textAnchor="middle"
                                >
                                  {p.rate.toFixed(2)}%{isWarning ? "🚨" : ""}
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
          </div>

          {/* Bottom Legend Mini Summary */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-[10px] text-center font-bold">
            {monthlyData.items.map((it) => {
              const itemTarget = getItemTarget(it.id);
              const isGood = it.defectRate <= itemTarget;
              const themeStyle = isGood
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40"
                : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-900/40";
              return (
                <div
                  key={it.id}
                  onClick={() => handleOpenPopupItem(it)}
                  className={`p-2 rounded-xl border cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-2xs ${themeStyle}`}
                  title={`${it.name} 상세 일자별 정리본 보기`}
                >
                  <span className="block text-[9.5px] opacity-75">{it.name}</span>
                  <span className="text-xs font-black font-mono">{it.defectRate}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANE (50%): 주요 불량 원인 분석 & 파레토 도넛 차트 */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-rose-500/10 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                    주요 불량 원인 분석
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                    총 {monthlyData.totalDefectQty}건 발생
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  발생 빈도 순위 및 핵심 취약 불량 유형 분석
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-[10px] text-slate-400 font-bold block">누적 품질 손실액</span>
              <span className="text-xs sm:text-sm font-black font-mono text-rose-600 dark:text-rose-400">
                ₩{monthlyData.totalLossAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Donut Chart + Defect Reasons Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {/* Donut Chart (5 cols) */}
            <div className="sm:col-span-5 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <svg viewBox="0 0 160 160" className="w-28 h-28 sm:w-36 sm:h-36">
                  {monthlyData.totalDefectQty === 0 ? (
                    <circle cx="80" cy="80" r="55" fill="transparent" stroke="#10B981" strokeWidth="20" />
                  ) : (
                    (() => {
                      let currentOffset = 0;
                      const circumference = 345;
                      return dynamicDefectAnalysis.categories.map((cat, idx) => {
                        const segLen = Math.max(4, (cat.percent / 100) * circumference);
                        const strokeDasharray = `${segLen} ${circumference}`;
                        const strokeDashoffset = -currentOffset;
                        currentOffset += segLen;
                        return (
                          <circle
                            key={cat.id || idx}
                            cx="80"
                            cy="80"
                            r="55"
                            fill="transparent"
                            stroke={cat.color}
                            strokeWidth="20"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                          />
                        );
                      });
                    })()
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-slate-400">총 불량수량</span>
                  <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono leading-tight">
                    {monthlyData.totalDefectQty} EA
                  </span>
                </div>
              </div>
            </div>

            {/* Defect Reasons Ranked List (7 cols) */}
            <div className="sm:col-span-7 space-y-2 text-xs">
              {dynamicDefectAnalysis.categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`p-2 rounded-xl border space-y-1 ${cat.bgBadge}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full ${cat.barColor} shrink-0`}></span>
                      <span className={`font-black truncate text-xs ${cat.textColor}`}>
                        {cat.id}. {cat.name}
                      </span>
                    </div>
                    <span className={`font-mono font-black text-xs shrink-0 ${cat.numColor}`}>
                      {cat.count}건 ({cat.percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/60 dark:bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`${cat.barColor} h-full rounded-full transition-all`}
                      style={{ width: `${Math.min(cat.percent, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Insight Callout & Quick Action */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-900/40 text-[11.5px] text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">💡</span>
              <span className="truncate">
                {monthlyData.totalDefectQty === 0 ? (
                  <strong>모든 차종의 품질 불량률이 0%로 완벽하게 관리되고 있습니다.</strong>
                ) : (
                  <>
                    최다 발생: <strong>{dynamicDefectAnalysis.categories[0]?.name || "품질 검사"}</strong> ({dynamicDefectAnalysis.categories[0]?.percent || 0}%) 집중 공정 개선 진행 중
                  </>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPopupItem(monthlyData.items.find((i) => i.id === "hr") || monthlyData.items[0])}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black text-[10.5px] shrink-0 transition-colors cursor-pointer shadow-xs"
            >
              HR 상세 분석 →
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DailyQualityDashboardTab;
