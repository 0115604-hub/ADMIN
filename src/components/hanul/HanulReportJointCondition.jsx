import React from "react";
import { Thermometer } from "lucide-react";

/**
 * 🌟 D. 조인트 및 가류/사출 성형 조건 (조인트 공정 시 활성화)
 */
export const HanulReportJointCondition = ({
  processId,
  project,
  jointType,
  jointGradeName,
  conditions,
  setConditions,
  cleaningTimes
}) => {
  if (!processId?.includes("조인트") && !processId?.includes("본드")) {
    return null;
  }

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-3">
      <div className="flex items-center justify-between border-b border-amber-200/80 dark:border-amber-800/80 pb-2">
        <span className="font-black text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
          <Thermometer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>
            {project === "9BQC"
              ? processId === "조인트"
                ? `3. 사출 조건 및 사출온도 (${
                    jointType === "FRT"
                      ? "직각 Machine / 둔각 Machine"
                      : jointType === "FIXED_LH"
                      ? "LH 좌측 / 우측 Machine"
                      : jointType === "FIXED_RH"
                      ? "RH 좌측 / 우측 Machine"
                      : "2호기 / 3호기 Machine"
                  })`
                : "3. 사출 성형 조건 및 사출온도"
              : "3. 프레스 가류조건 (상/하판 200±20℃, 90±30s)"}
          </span>
        </span>
        <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold">
          {project === "9BQC" ? `원재료: ${jointGradeName || "SJ-4004B"}` : "고무: W60664$OS"}
        </span>
      </div>

      {project === "9BQC" ? (
        /* 9BQC 사출온도 4개존 + 성형조건 */
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 text-center">
              <span className="text-[10px] font-bold text-slate-500 block mb-1">
                노즐 (Nozzle)
              </span>
              <div className="flex items-center justify-center gap-1">
                <input
                  type="text"
                  value={conditions.nozzleTempSet}
                  onChange={(e) =>
                    setConditions((c) => ({ ...c, nozzleTempSet: e.target.value }))
                  }
                  className="w-14 px-1 py-1 rounded border text-xs font-bold text-center"
                  title="설정치"
                />
                <span className="text-xs text-slate-400">/</span>
                <input
                  type="text"
                  value={conditions.nozzleTempAct}
                  onChange={(e) =>
                    setConditions((c) => ({ ...c, nozzleTempAct: e.target.value }))
                  }
                  className="w-14 px-1 py-1 rounded border border-amber-400 text-xs font-bold text-center text-amber-600"
                  title="실측치"
                />
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 text-center">
              <span className="text-[10px] font-bold text-slate-500 block mb-1">
                실린더 1 (H1)
              </span>
              <div className="flex items-center justify-center gap-1">
                <input
                  type="text"
                  value={conditions.cyl1TempSet}
                  onChange={(e) =>
                    setConditions((c) => ({ ...c, cyl1TempSet: e.target.value }))
                  }
                  className="w-14 px-1 py-1 rounded border text-xs font-bold text-center"
                />
                <span className="text-xs text-slate-400">/</span>
                <input
                  type="text"
                  value={conditions.cyl1TempAct}
                  onChange={(e) =>
                    setConditions((c) => ({ ...c, cyl1TempAct: e.target.value }))
                  }
                  className="w-14 px-1 py-1 rounded border border-amber-400 text-xs font-bold text-center text-amber-600"
                />
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 text-center">
              <span className="text-[10px] font-bold text-slate-500 block mb-1">
                실린더 2 (H2)
              </span>
              <div className="flex items-center justify-center gap-1">
                <input
                  type="text"
                  value={conditions.cyl2TempSet}
                  onChange={(e) =>
                    setConditions((c) => ({ ...c, cyl2TempSet: e.target.value }))
                  }
                  className="w-14 px-1 py-1 rounded border text-xs font-bold text-center"
                />
                <span className="text-xs text-slate-400">/</span>
                <input
                  type="text"
                  value={conditions.cyl2TempAct}
                  onChange={(e) =>
                    setConditions((c) => ({ ...c, cyl2TempAct: e.target.value }))
                  }
                  className="w-14 px-1 py-1 rounded border border-amber-400 text-xs font-bold text-center text-amber-600"
                />
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 text-center">
              <span className="text-[10px] font-bold text-slate-500 block mb-1">
                실린더 3 (H3)
              </span>
              <div className="flex items-center justify-center gap-1">
                <input
                  type="text"
                  value={conditions.cyl3TempSet}
                  onChange={(e) =>
                    setConditions((c) => ({ ...c, cyl3TempSet: e.target.value }))
                  }
                  className="w-14 px-1 py-1 rounded border text-xs font-bold text-center"
                />
                <span className="text-xs text-slate-400">/</span>
                <input
                  type="text"
                  value={conditions.cyl3TempAct}
                  onChange={(e) =>
                    setConditions((c) => ({ ...c, cyl3TempAct: e.target.value }))
                  }
                  className="w-14 px-1 py-1 rounded border border-amber-400 text-xs font-bold text-center text-amber-600"
                />
              </div>
            </div>
          </div>

          {/* 사출조건: 거리, 속도, 압력 (초물 / 중물 / 종물) */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                사출 성형 조건 (초물 / 중물 / 종물)
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                거리(mm) • 속도(mm/s) • 압력(bar)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-slate-800/60 border border-amber-200/70 text-center">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  거리 (Distance)
                </span>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="text"
                    placeholder="초물"
                    value={conditions.distance?.start || ""}
                    onChange={(e) =>
                      setConditions((c) => ({
                        ...c,
                        distance: { ...(c.distance || {}), start: e.target.value }
                      }))
                    }
                    className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="중물"
                    value={conditions.distance?.mid || ""}
                    onChange={(e) =>
                      setConditions((c) => ({
                        ...c,
                        distance: { ...(c.distance || {}), mid: e.target.value }
                      }))
                    }
                    className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="종물"
                    value={conditions.distance?.end || ""}
                    onChange={(e) =>
                      setConditions((c) => ({
                        ...c,
                        distance: { ...(c.distance || {}), end: e.target.value }
                      }))
                    }
                    className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-slate-800/60 border border-amber-200/70 text-center">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  속도 (Speed)
                </span>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="text"
                    placeholder="초물"
                    value={conditions.speed?.start || ""}
                    onChange={(e) =>
                      setConditions((c) => ({
                        ...c,
                        speed: { ...(c.speed || {}), start: e.target.value }
                      }))
                    }
                    className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="중물"
                    value={conditions.speed?.mid || ""}
                    onChange={(e) =>
                      setConditions((c) => ({
                        ...c,
                        speed: { ...(c.speed || {}), mid: e.target.value }
                      }))
                    }
                    className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="종물"
                    value={conditions.speed?.end || ""}
                    onChange={(e) =>
                      setConditions((c) => ({
                        ...c,
                        speed: { ...(c.speed || {}), end: e.target.value }
                      }))
                    }
                    className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-slate-800/60 border border-amber-200/70 text-center">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  압력 (Pressure)
                </span>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="text"
                    placeholder="초물"
                    value={conditions.pressure?.start || ""}
                    onChange={(e) =>
                      setConditions((c) => ({
                        ...c,
                        pressure: { ...(c.pressure || {}), start: e.target.value }
                      }))
                    }
                    className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="중물"
                    value={conditions.pressure?.mid || ""}
                    onChange={(e) =>
                      setConditions((c) => ({
                        ...c,
                        pressure: { ...(c.pressure || {}), mid: e.target.value }
                      }))
                    }
                    className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="종물"
                    value={conditions.pressure?.end || ""}
                    onChange={(e) =>
                      setConditions((c) => ({
                        ...c,
                        pressure: { ...(c.pressure || {}), end: e.target.value }
                      }))
                    }
                    className="px-1 py-1 rounded border text-xs text-center font-bold bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* LQ2a 프레스 가류조건 */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 text-center">
            <span className="text-[10px] font-bold text-slate-500 block mb-1">
              상판 가류온도(℃)
            </span>
            <div className="flex items-center justify-center gap-1">
              <input
                type="text"
                value={conditions.cureTempUpperSet}
                onChange={(e) =>
                  setConditions((c) => ({ ...c, cureTempUpperSet: e.target.value }))
                }
                className="w-14 px-1 py-1 rounded border text-xs font-bold text-center"
                title="셋팅: 200℃"
              />
              <span className="text-xs text-slate-400">/</span>
              <input
                type="text"
                value={conditions.cureTempUpperAct}
                onChange={(e) =>
                  setConditions((c) => ({ ...c, cureTempUpperAct: e.target.value }))
                }
                className="w-14 px-1 py-1 rounded border border-amber-400 text-xs font-bold text-center text-amber-600"
                title="현재온도"
              />
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 text-center">
            <span className="text-[10px] font-bold text-slate-500 block mb-1">
              하판 가류온도(℃)
            </span>
            <div className="flex items-center justify-center gap-1">
              <input
                type="text"
                value={conditions.cureTempLowerSet}
                onChange={(e) =>
                  setConditions((c) => ({ ...c, cureTempLowerSet: e.target.value }))
                }
                className="w-14 px-1 py-1 rounded border text-xs font-bold text-center"
                title="셋팅: 200℃"
              />
              <span className="text-xs text-slate-400">/</span>
              <input
                type="text"
                value={conditions.cureTempLowerAct}
                onChange={(e) =>
                  setConditions((c) => ({ ...c, cureTempLowerAct: e.target.value }))
                }
                className="w-14 px-1 py-1 rounded border border-amber-400 text-xs font-bold text-center text-amber-600"
                title="현재온도"
              />
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 text-center">
            <span className="text-[10px] font-bold text-slate-500 block mb-1">가류시간 (초)</span>
            <input
              type="text"
              value={conditions.cureTimeSec}
              onChange={(e) =>
                setConditions((c) => ({ ...c, cureTimeSec: e.target.value }))
              }
              className="w-full px-2 py-1 rounded-lg border border-amber-300 text-xs font-black text-center text-amber-700"
              placeholder="90s ±30s"
            />
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/80 text-center">
            <span className="text-[10px] font-bold text-slate-500 block mb-1">금형 청소시간</span>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-1">
              <span>시업전: {cleaningTimes?.before || "-"}</span>
              <span>시업후: {cleaningTimes?.after || "-"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HanulReportJointCondition;
