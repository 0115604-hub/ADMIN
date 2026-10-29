import React, { useMemo } from "react";
import { Clock, AlertTriangle } from "lucide-react";

/**
 * ExtrusionWorkerDowntimeSummaryBar
 * 작업자 대시보드 최상단: 작업일보 건수는 제거하고, 라인별 비가동 시간만 직관적/강조하여 보여주는 배너
 */
export const ExtrusionWorkerDowntimeSummaryBar = ({ reports = [] }) => {
  const lineConfigs = [
    { id: "pcm1", name: "PCM 1호 (PCM #1)", short: "PCM 1호", theme: "teal" },
    { id: "pcm3", name: "PCM 3호 (PCM #3)", short: "PCM 3호", theme: "blue" },
    { id: "pvc", name: "PVC LINE", short: "PVC", theme: "amber" },
    { id: "tpe", name: "TPE LINE", short: "TPE", theme: "purple" }
  ];

  const lineDowntimeStats = useMemo(() => {
    const stats = {
      pcm1: 0,
      pcm3: 0,
      pvc: 0,
      tpe: 0
    };

    (reports || []).forEach((r) => {
      if (!r) return;
      const rawLine = String(r.lineId || r.line || r.lineName || "").toLowerCase();
      let targetKey = null;

      if (rawLine.includes("pcm1") || rawLine.includes("1호") || rawLine.includes("pcm #1")) {
        targetKey = "pcm1";
      } else if (rawLine.includes("pcm3") || rawLine.includes("3호") || rawLine.includes("pcm #3")) {
        targetKey = "pcm3";
      } else if (rawLine.includes("pvc")) {
        targetKey = "pvc";
      } else if (rawLine.includes("tpe")) {
        targetKey = "tpe";
      }

      if (targetKey) {
        const dtMinutes = Number(r.downtimeMinutes) || 0;
        stats[targetKey] += dtMinutes;
      }
    });

    return stats;
  }, [reports]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {lineConfigs.map((cfg) => {
        const minutes = lineDowntimeStats[cfg.id] || 0;
        const hours = (minutes / 60).toFixed(1);
        const hasDowntime = minutes > 0;

        return (
          <div
            key={cfg.id}
            className={`p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border shadow-lg transition-all flex flex-col justify-between gap-1.5 ${
              hasDowntime
                ? "border-rose-500/40 hover:border-rose-400/70"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            {/* Header: Line Indicator & Name */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    hasDowntime ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                  }`}
                />
                <span className="font-black text-xs sm:text-[13px] text-white truncate">
                  {cfg.name}
                </span>
              </div>
            </div>

            {/* Main Value: 비가동 시간만 강렬하게 강조 */}
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>누적 비가동</span>
              </span>

              <div className="text-right">
                <span
                  className={`font-mono font-black text-sm sm:text-base ${
                    hasDowntime ? "text-rose-400" : "text-slate-400"
                  }`}
                >
                  {minutes.toLocaleString()}
                  <span className="text-xs font-bold text-slate-400 ml-0.5">분</span>
                </span>
                <span className="text-[10.5px] font-mono text-slate-500 font-bold ml-1.5">
                  ({hours}h)
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
