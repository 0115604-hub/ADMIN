import React from "react";
import { Zap, Thermometer, Droplets } from "lucide-react";
import { EXTRUSION_STANDARD_SPECS } from "../../../../services/extrusionProductionService";

/**
 * 🌟 PVC 라인 전용 작업조건 (80Ø 속도/인취속도 & 7구간 압출기온도 & 냉각조/본드/후로킹/건조로)
 */
export const ExtrusionPvcConditions = ({
  formData,
  handleNestedFieldChange,
  handleBatchPvcExtruderTemps,
  handlePvcTempChange,
  handlePvcDryerZoneChange
}) => {
  return (
    <div className="space-y-3">
      {/* 1. PVC 80Ø 압출속도 & 라인 인취속도 */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-300/80 dark:border-amber-900/60 shadow-xs space-y-2">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white font-black text-xs flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            PVC 압출속도 & 인취기 속도
          </span>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
            80Ø 압출기 RPM & 라인 인취 m/분
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* 80Ø Extruder Speed */}
          <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black text-amber-900 dark:text-amber-300">
              <span>80Ø 압출기속도</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={
                  formData.conditions?.pvcExtruder80Rpm ??
                  EXTRUSION_STANDARD_SPECS.pvcExtruder80Rpm ??
                  ""
                }
                onChange={(e) =>
                  handleNestedFieldChange("conditions", "pvcExtruder80Rpm", e.target.value)
                }
                placeholder="20.0"
                className="w-full text-right pr-11 pl-2 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg font-black text-xs sm:text-sm text-amber-950 dark:text-amber-100 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-500 pointer-events-none">
                RPM
              </span>
            </div>
          </div>

          {/* Haul-off Speed */}
          <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black text-amber-900 dark:text-amber-300">
              <span>인취속도</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={
                  formData.conditions?.pvcHaulOffSpeed ??
                  formData.conditions?.haulOffSpeed ??
                  EXTRUSION_STANDARD_SPECS.pvcHaulOffSpeed ??
                  ""
                }
                onChange={(e) => {
                  handleNestedFieldChange("conditions", "pvcHaulOffSpeed", e.target.value);
                  handleNestedFieldChange("conditions", "haulOffSpeed", e.target.value);
                }}
                placeholder="15.0"
                className="w-full text-right pr-12 pl-2 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg font-black text-xs sm:text-sm text-amber-950 dark:text-amber-100 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-500 pointer-events-none">
                m/분
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PVC 압출기온도 (설정온도 ±10℃) - 7구간: 실린더1~4, 어댑터, 노즐, 다이스 */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-300/80 dark:border-teal-900/60 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white font-black text-xs flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5" />
            80Ø 압출기온도 (설정온도 ±10℃)
          </span>
          <button
            type="button"
            onClick={() => handleBatchPvcExtruderTemps("180")}
            className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200 text-[10.5px] font-black border border-teal-300 dark:border-teal-800 transition cursor-pointer shadow-2xs"
          >
            ⚡ 180℃ 일괄적용
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-teal-900 dark:text-teal-200 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
              실린더1~4 · 어댑터 · 노즐 · 다이스 (7구간)
            </span>
            <span className="text-[9.5px] text-teal-700 dark:text-teal-400 font-bold">
              1도 단위 조정 (±10℃)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 sm:gap-2">
            {[
              { key: "cylinder1", label: "실린더1", def: "170" },
              { key: "cylinder2", label: "실린더2", def: "175" },
              { key: "cylinder3", label: "실린더3", def: "180" },
              { key: "cylinder4", label: "실린더4", def: "185" },
              { key: "adapter", label: "어댑터", def: "190" },
              { key: "nozzle", label: "노즐", def: "195" },
              { key: "die", label: "다이스", def: "195" }
            ].map((item) => {
              const curVal = String(
                formData.conditions?.pvcTemps?.[item.key] ??
                  EXTRUSION_STANDARD_SPECS.pvcTemps[item.key] ??
                  item.def
              ).replace(/\.0+$/, "");
              return (
                <div
                  key={`pvc_${item.key}`}
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
                    onChange={(e) => handlePvcTempChange(item.key, e.target.value)}
                    placeholder={item.def}
                    className="w-full text-center bg-teal-50/50 dark:bg-slate-900 border border-teal-300/80 dark:border-teal-600 rounded py-1 font-black text-xs text-teal-950 dark:text-teal-100 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                  <span className="text-[8.5px] text-slate-400 font-bold mt-0.5">℃</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. PVC 부대 및 후공정 작업조건 (냉각조온도 · 본드도포 공급기1·2 · 후로킹(식모) 전압·전류 · 건조로 1~4존 & 구동속도) */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-sky-300/80 dark:border-sky-900/60 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white font-black text-xs flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5" />
            냉각조 · 본드도포 · 후로킹(식모) · 건조로 조건
          </span>
          <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300">
            PVC 부대설비 및 후가공 품질 관리조건
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {/* 3-1. 냉각조온도 */}
          <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80 space-y-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-black text-blue-900 dark:text-blue-300">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                냉각조온도
              </span>
              <span className="text-[9.5px] text-blue-600 dark:text-blue-400 font-bold">
                1도 단위 (±2℃)
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="1"
                value={String(
                  formData.conditions?.pvcCoolingTankTemp ??
                    EXTRUSION_STANDARD_SPECS.pvcCoolingTankTemp ??
                    "20"
                ).replace(/\.0+$/, "")}
                onChange={(e) =>
                  handleNestedFieldChange("conditions", "pvcCoolingTankTemp", e.target.value)
                }
                placeholder="20"
                className="w-full text-right pr-7 pl-2 py-1.5 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg font-black text-xs sm:text-sm text-blue-950 dark:text-blue-100 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-500 pointer-events-none">
                ℃
              </span>
            </div>
            <div className="text-[9px] text-blue-700 dark:text-blue-300 text-center font-bold">
              기준: 20℃ (관리범위: 18~22℃)
            </div>
          </div>

          {/* 3-2. 본드도포 (공급기1, 2 RPM) */}
          <div className="p-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-black text-sky-900 dark:text-sky-300">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
                본드도포 (공급기 1 · 2)
              </span>
              <span className="text-[9.5px] text-sky-600 dark:text-sky-400 font-bold">
                RPM 제어
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <span className="text-[9.5px] font-bold text-sky-800 dark:text-sky-300 block text-center">
                  공급기1
                </span>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={
                      formData.conditions?.pvcBondFeeder1Rpm ??
                      EXTRUSION_STANDARD_SPECS.pvcBondFeeder1Rpm ??
                      ""
                    }
                    onChange={(e) =>
                      handleNestedFieldChange("conditions", "pvcBondFeeder1Rpm", e.target.value)
                    }
                    placeholder="15.0"
                    className="w-full text-right pr-9 pl-1.5 py-1.5 bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-700 rounded-lg font-black text-xs text-sky-950 dark:text-sky-100 focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-sky-500 pointer-events-none">
                    RPM
                  </span>
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9.5px] font-bold text-sky-800 dark:text-sky-300 block text-center">
                  공급기2
                </span>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={
                      formData.conditions?.pvcBondFeeder2Rpm ??
                      EXTRUSION_STANDARD_SPECS.pvcBondFeeder2Rpm ??
                      ""
                    }
                    onChange={(e) =>
                      handleNestedFieldChange("conditions", "pvcBondFeeder2Rpm", e.target.value)
                    }
                    placeholder="15.0"
                    className="w-full text-right pr-9 pl-1.5 py-1.5 bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-700 rounded-lg font-black text-xs text-sky-950 dark:text-sky-100 focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-sky-500 pointer-events-none">
                    RPM
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3-3. 후로킹(식모)조건 (전압 & 전류 & 파일조건) */}
          <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-black text-purple-900 dark:text-purple-300">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                후로킹(식모) 조건
              </span>
              <span className="text-[9.5px] text-purple-600 dark:text-purple-400 font-bold">
                전압·전류·파일
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <span className="text-[9.5px] font-bold text-purple-800 dark:text-purple-300 block text-center">
                  전압 (kV)
                </span>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={
                      formData.conditions?.pvcFlockingVoltage ??
                      EXTRUSION_STANDARD_SPECS.pvcFlockingVoltage ??
                      ""
                    }
                    onChange={(e) =>
                      handleNestedFieldChange("conditions", "pvcFlockingVoltage", e.target.value)
                    }
                    placeholder="50"
                    className="w-full text-right pr-7 pl-1.5 py-1.5 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg font-black text-xs text-purple-950 dark:text-purple-100 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-purple-500 pointer-events-none">
                    kV
                  </span>
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9.5px] font-bold text-purple-800 dark:text-purple-300 block text-center">
                  전류 (mA)
                </span>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={
                      formData.conditions?.pvcFlockingCurrent ??
                      EXTRUSION_STANDARD_SPECS.pvcFlockingCurrent ??
                      ""
                    }
                    onChange={(e) =>
                      handleNestedFieldChange("conditions", "pvcFlockingCurrent", e.target.value)
                    }
                    placeholder="0.05"
                    className="w-full text-right pr-8 pl-1.5 py-1.5 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg font-black text-xs text-purple-950 dark:text-purple-100 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-purple-500 pointer-events-none">
                    mA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3-4. 건조로 조건 (1~4존 온도 & 구동속도) */}
        <div className="p-2.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/80 space-y-1.5">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className="text-[11px] font-black text-orange-900 dark:text-orange-300 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
              건조로 조건 (1~4존 온도 &amp; 구동속도)
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[9.5px] text-orange-700 dark:text-orange-400 font-bold mr-1">
                관리범위: 160±5℃ / 165±5℃
              </span>
              <button
                type="button"
                onClick={() => {
                  ["zone1", "zone2", "zone3", "zone4"].forEach((z, i) => {
                    handlePvcDryerZoneChange(z, i < 2 ? "160" : "165");
                  });
                }}
                className="px-2 py-0.5 rounded bg-orange-100 hover:bg-orange-200 text-orange-800 dark:bg-orange-950 dark:text-orange-200 text-[10px] font-black border border-orange-300 transition cursor-pointer shadow-2xs"
              >
                ⚡ 160/165℃ 일괄적용
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {/* 건조로 구동속도 */}
            <div className="flex flex-col justify-between p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-orange-300 dark:border-orange-700/80 shadow-2xs">
              <span className="text-[10px] font-black text-orange-900 dark:text-orange-300 text-center">
                구동속도
              </span>
              <div className="relative mt-1">
                <input
                  type="number"
                  step="0.1"
                  value={
                    formData.conditions?.pvcDryerDriveSpeed ??
                    formData.conditions?.pvcDryerSpeed ??
                    EXTRUSION_STANDARD_SPECS.pvcDryerDriveSpeed ??
                    ""
                  }
                  onChange={(e) => {
                    handleNestedFieldChange("conditions", "pvcDryerDriveSpeed", e.target.value);
                    handleNestedFieldChange("conditions", "pvcDryerSpeed", e.target.value);
                  }}
                  placeholder="15.0"
                  className="w-full text-right pr-9 pl-1 py-1 bg-orange-50/50 dark:bg-slate-900 border border-orange-300/80 dark:border-orange-600 rounded font-black text-xs text-orange-950 dark:text-orange-100 focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
                />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-orange-500 pointer-events-none">
                  m/분
                </span>
              </div>
            </div>

            {/* 1존 ~ 4존 온도 */}
            {[
              { key: "zone1", label: "1존 온도", def: "160" },
              { key: "zone2", label: "2존 온도", def: "160" },
              { key: "zone3", label: "3존 온도", def: "165" },
              { key: "zone4", label: "4존 온도", def: "165" }
            ].map((zone) => {
              const curVal = String(
                formData.conditions?.pvcDryerZones?.[zone.key] ??
                  EXTRUSION_STANDARD_SPECS.pvcDryerZones[zone.key] ??
                  zone.def
              ).replace(/\.0+$/, "");
              return (
                <div
                  key={`pvc_dryer_${zone.key}`}
                  className="flex flex-col justify-between p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-700/80 shadow-2xs"
                >
                  <span className="text-[10px] font-black text-orange-800 dark:text-orange-300 text-center">
                    {zone.label}
                  </span>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="1"
                      value={curVal}
                      onChange={(e) => handlePvcDryerZoneChange(zone.key, e.target.value)}
                      placeholder={zone.def}
                      className="w-full text-center pr-5 pl-1 py-1 bg-orange-50/50 dark:bg-slate-900 border border-orange-300/80 dark:border-orange-600 rounded font-black text-xs text-orange-950 dark:text-orange-100 focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold pointer-events-none">
                      ℃
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtrusionPvcConditions;
