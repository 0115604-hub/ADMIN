import React from "react";
import { Zap, Thermometer } from "lucide-react";
import { EXTRUSION_STANDARD_SPECS } from "../../../../services/extrusionProductionService";

/**
 * 🌟 TPE 라인 전용 작업조건 (4개 압출기 RPM & 4개 압출기온도 ±10℃ & 냉각수온도)
 */
export const ExtrusionTpeConditions = ({
  formData,
  handleNestedFieldChange,
  handleBatchTpeExtruderTemps,
  handleTpeTempChange
}) => {
  return (
    <div className="space-y-3">
      {/* 1. TPE 압출속도 (100Ø, 80Ø, 65Ø, 45Ø RPM) & 인취기 속도 */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-300/80 dark:border-purple-900/60 shadow-xs space-y-2">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white font-black text-xs flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            TPE 4개 압출기 속도 & 인취기 속도
          </span>
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300">
            100Ø · 80Ø · 65Ø · 35Ø RPM & 라인 인취 m/분
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* 100Ø Extruder Speed */}
          <div className="p-2 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black text-purple-900 dark:text-purple-300">
              <span>100Ø 압출속도</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={formData.conditions?.tpeExtruder100Rpm ?? ""}
                onChange={(e) =>
                  handleNestedFieldChange("conditions", "tpeExtruder100Rpm", e.target.value)
                }
                placeholder="25.0"
                className="w-full text-right pr-11 pl-2 py-1.5 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg font-black text-xs sm:text-sm text-purple-950 dark:text-purple-100 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-purple-500 pointer-events-none">
                RPM
              </span>
            </div>
          </div>

          {/* 80Ø Extruder Speed */}
          <div className="p-2 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black text-purple-900 dark:text-purple-300">
              <span>80Ø 압출속도</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={formData.conditions?.tpeExtruder80Rpm ?? ""}
                onChange={(e) =>
                  handleNestedFieldChange("conditions", "tpeExtruder80Rpm", e.target.value)
                }
                placeholder="20.0"
                className="w-full text-right pr-11 pl-2 py-1.5 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg font-black text-xs sm:text-sm text-purple-950 dark:text-purple-100 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-purple-500 pointer-events-none">
                RPM
              </span>
            </div>
          </div>

          {/* 65Ø Extruder Speed */}
          <div className="p-2 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black text-purple-900 dark:text-purple-300">
              <span>65Ø 압출속도</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={formData.conditions?.tpeExtruder65Rpm ?? ""}
                onChange={(e) =>
                  handleNestedFieldChange("conditions", "tpeExtruder65Rpm", e.target.value)
                }
                placeholder="18.0"
                className="w-full text-right pr-11 pl-2 py-1.5 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg font-black text-xs sm:text-sm text-purple-950 dark:text-purple-100 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-purple-500 pointer-events-none">
                RPM
              </span>
            </div>
          </div>

          {/* 35Ø Extruder Speed */}
          <div className="p-2 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black text-purple-900 dark:text-purple-300">
              <span>35Ø 압출속도</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={
                  formData.conditions?.tpeExtruder35Rpm ??
                  formData.conditions?.tpeExtruder45Rpm ??
                  ""
                }
                onChange={(e) => {
                  handleNestedFieldChange("conditions", "tpeExtruder35Rpm", e.target.value);
                  handleNestedFieldChange("conditions", "tpeExtruder45Rpm", e.target.value);
                }}
                placeholder="15.0"
                className="w-full text-right pr-11 pl-2 py-1.5 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg font-black text-xs sm:text-sm text-purple-950 dark:text-purple-100 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-purple-500 pointer-events-none">
                RPM
              </span>
            </div>
          </div>

          {/* Haul-off Speed */}
          <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black text-purple-900 dark:text-purple-300">
              <span>인취기 속도</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={formData.conditions?.haulOffSpeed ?? ""}
                onChange={(e) =>
                  handleNestedFieldChange("conditions", "haulOffSpeed", e.target.value)
                }
                placeholder="15.0"
                className="w-full text-right pr-12 pl-2 py-1.5 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg font-black text-xs sm:text-sm text-purple-950 dark:text-purple-100 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-purple-500 pointer-events-none">
                m/분
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TPE 압출기온도 (설정온도 ±10℃) - 100Ø, 80Ø, 65Ø, 35Ø 4개 압출기별 온도 + 냉각수온도 */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-300/80 dark:border-teal-900/60 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white font-black text-xs flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5" />
            압출기온도 (설정온도 ±10℃)
          </span>
          <button
            type="button"
            onClick={() => handleBatchTpeExtruderTemps("190")}
            className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200 text-[10.5px] font-black border border-teal-300 dark:border-teal-800 transition cursor-pointer shadow-2xs"
          >
            ⚡ 190℃ 일괄적용
          </button>
        </div>

        {/* Group 1: 100Ø 압출기 온도 (12개 구간, ±10℃) */}
        <div className="p-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-teal-900 dark:text-teal-200 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
              100Ø 압출기 온도 (±10℃)
            </span>
            <span className="text-[9.5px] text-teal-700 dark:text-teal-400 font-bold">
              스크류 · 실린더1~6 · 어댑터 · 다이스 · 헤드1~2 · 호퍼드라이어 (12구간)
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1 sm:gap-1.5">
            {[
              { key: "screw", label: "스크류" },
              { key: "cylinder1", label: "실린더1" },
              { key: "cylinder2", label: "실린더2" },
              { key: "cylinder3", label: "실린더3" },
              { key: "cylinder4", label: "실린더4" },
              { key: "cylinder5", label: "실린더5" },
              { key: "cylinder6", label: "실린더6" },
              { key: "adapter", label: "어댑터" },
              { key: "die", label: "다이스" },
              { key: "head1", label: "헤드1" },
              { key: "head2", label: "헤드2" },
              { key: "hopperDryer", label: "호퍼드라이어" }
            ].map((item) => {
              const curVal = String(
                formData.conditions?.tpeTemps100?.[item.key] ??
                  EXTRUSION_STANDARD_SPECS.tpeTemps100[item.key] ??
                  (item.key === "hopperDryer" ? "80" : "190")
              ).replace(/\.0+$/, "");
              return (
                <div
                  key={`tpe100_${item.key}`}
                  className="flex flex-col items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700/80 shadow-2xs"
                >
                  <span
                    className="text-[10px] font-black text-teal-800 dark:text-teal-300 truncate w-full text-center"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                  <input
                    type="number"
                    step="1"
                    value={curVal}
                    onChange={(e) =>
                      handleTpeTempChange("tpeTemps100", item.key, e.target.value)
                    }
                    placeholder={item.key === "hopperDryer" ? "80" : "190"}
                    className="w-full text-center bg-teal-50/50 dark:bg-slate-900 border border-teal-300/80 dark:border-teal-600 rounded py-1 font-black text-xs text-teal-950 dark:text-teal-100 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                  <span className="text-[8.5px] text-slate-400 font-bold mt-0.5">℃</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Group 2: 80Ø 압출기 온도 (7개 구간, ±10℃) */}
        <div className="p-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-teal-900 dark:text-teal-200 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
              80Ø 압출기 온도 (±10℃)
            </span>
            <span className="text-[9.5px] text-teal-700 dark:text-teal-400 font-bold">
              실린더1~4 · 어댑터 · 노즐 · 호퍼드라이어 (7구간)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 sm:gap-2">
            {[
              { key: "cylinder1", label: "실린더1" },
              { key: "cylinder2", label: "실린더2" },
              { key: "cylinder3", label: "실린더3" },
              { key: "cylinder4", label: "실린더4" },
              { key: "adapter", label: "어댑터" },
              { key: "nozzle", label: "노즐" },
              { key: "hopperDryer", label: "호퍼드라이어" }
            ].map((item) => {
              const curVal = String(
                formData.conditions?.tpeTemps80?.[item.key] ??
                  EXTRUSION_STANDARD_SPECS.tpeTemps80[item.key] ??
                  (item.key === "hopperDryer" ? "80" : "190")
              ).replace(/\.0+$/, "");
              return (
                <div
                  key={`tpe80_${item.key}`}
                  className="flex flex-col items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700/80 shadow-2xs"
                >
                  <span
                    className="text-[10px] font-black text-teal-800 dark:text-teal-300 truncate w-full text-center"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                  <input
                    type="number"
                    step="1"
                    value={curVal}
                    onChange={(e) =>
                      handleTpeTempChange("tpeTemps80", item.key, e.target.value)
                    }
                    placeholder={item.key === "hopperDryer" ? "80" : "190"}
                    className="w-full text-center bg-teal-50/50 dark:bg-slate-900 border border-teal-300/80 dark:border-teal-600 rounded py-1 font-black text-xs text-teal-950 dark:text-teal-100 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                  <span className="text-[8.5px] text-slate-400 font-bold mt-0.5">℃</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Group 3: 65Ø 압출기 온도 (6개 구간, ±10℃) */}
        <div className="p-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-teal-900 dark:text-teal-200 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
              65Ø 압출기 온도 (±10℃)
            </span>
            <span className="text-[9.5px] text-teal-700 dark:text-teal-400 font-bold">
              실린더1~3 · 어댑터 · 노즐 · 호퍼드라이어 (6구간)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 sm:gap-2">
            {[
              { key: "cylinder1", label: "실린더1" },
              { key: "cylinder2", label: "실린더2" },
              { key: "cylinder3", label: "실린더3" },
              { key: "adapter", label: "어댑터" },
              { key: "nozzle", label: "노즐" },
              { key: "hopperDryer", label: "호퍼드라이어" }
            ].map((item) => {
              const curVal = String(
                formData.conditions?.tpeTemps65?.[item.key] ??
                  EXTRUSION_STANDARD_SPECS.tpeTemps65[item.key] ??
                  (item.key === "hopperDryer" ? "80" : "190")
              ).replace(/\.0+$/, "");
              return (
                <div
                  key={`tpe65_${item.key}`}
                  className="flex flex-col items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700/80 shadow-2xs"
                >
                  <span
                    className="text-[10px] font-black text-teal-800 dark:text-teal-300 truncate w-full text-center"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                  <input
                    type="number"
                    step="1"
                    value={curVal}
                    onChange={(e) =>
                      handleTpeTempChange("tpeTemps65", item.key, e.target.value)
                    }
                    placeholder={item.key === "hopperDryer" ? "80" : "190"}
                    className="w-full text-center bg-teal-50/50 dark:bg-slate-900 border border-teal-300/80 dark:border-teal-600 rounded py-1 font-black text-xs text-teal-950 dark:text-teal-100 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                  <span className="text-[8.5px] text-slate-400 font-bold mt-0.5">℃</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Group 4: 35Ø 압출기 온도 (5개 구간, ±10℃) + 오른쪽에 냉각수온도 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2.5">
          {/* 35Ø 압출기 온도 (lg:col-span-3) */}
          <div className="lg:col-span-3 p-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-teal-900 dark:text-teal-200 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
                35Ø 압출기 온도 (±10℃)
              </span>
              <span className="text-[9.5px] text-teal-700 dark:text-teal-400 font-bold">
                실린더1~2 · 어댑터 · 노즐 · 호퍼드라이어 (5구간)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2">
              {[
                { key: "cylinder1", label: "실린더1" },
                { key: "cylinder2", label: "실린더2" },
                { key: "adapter", label: "어댑터" },
                { key: "nozzle", label: "노즐" },
                { key: "hopperDryer", label: "호퍼드라이어" }
              ].map((item) => {
                const curVal = String(
                  formData.conditions?.tpeTemps35?.[item.key] ??
                    formData.conditions?.tpeTemps45?.[item.key] ??
                    EXTRUSION_STANDARD_SPECS.tpeTemps35[item.key] ??
                    (item.key === "hopperDryer" ? "80" : "190")
                ).replace(/\.0+$/, "");
                return (
                  <div
                    key={`tpe35_${item.key}`}
                    className="flex flex-col items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700/80 shadow-2xs"
                  >
                    <span
                      className="text-[10px] font-black text-teal-800 dark:text-teal-300 truncate w-full text-center"
                      title={item.label}
                    >
                      {item.label}
                    </span>
                    <input
                      type="number"
                      step="1"
                      value={curVal}
                      onChange={(e) => {
                        handleTpeTempChange("tpeTemps35", item.key, e.target.value);
                        handleTpeTempChange("tpeTemps45", item.key, e.target.value);
                      }}
                      placeholder={item.key === "hopperDryer" ? "80" : "190"}
                      className="w-full text-center bg-teal-50/50 dark:bg-slate-900 border border-teal-300/80 dark:border-teal-600 rounded py-1 font-black text-xs text-teal-950 dark:text-teal-100 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                    />
                    <span className="text-[8.5px] text-slate-400 font-bold mt-0.5">℃</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 냉각수온도 패널 (35Ø 패널 우측) */}
          <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80 flex flex-col justify-between space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-blue-900 dark:text-blue-300 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                냉각수온도
              </span>
              <span className="text-[9.5px] text-blue-600 dark:text-blue-400 font-bold">
                1도 단위
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700/80 shadow-2xs">
              <div className="w-full relative">
                <input
                  type="number"
                  step="1"
                  value={String(
                    formData.conditions?.tpeCoolingWaterTemp ??
                      EXTRUSION_STANDARD_SPECS.tpeCoolingWaterTemp ??
                      "20"
                  ).replace(/\.0+$/, "")}
                  onChange={(e) =>
                    handleNestedFieldChange("conditions", "tpeCoolingWaterTemp", e.target.value)
                  }
                  placeholder="20"
                  className="w-full text-center pr-6 pl-2 py-1 bg-blue-50/50 dark:bg-slate-900 border border-blue-300/80 dark:border-blue-600 rounded font-black text-xs sm:text-sm text-blue-950 dark:text-blue-100 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-black text-blue-500 pointer-events-none">
                  ℃
                </span>
              </div>
              <span className="text-[9px] text-blue-700 dark:text-blue-300 font-bold mt-1">
                설정온도 (오차 ±2℃)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtrusionTpeConditions;
