import React from "react";
import { Zap, Droplets } from "lucide-react";

/**
 * ExtrusionEpdmConditions
 * Section 3 - Standard PCM/EPDM line working conditions:
 * - 110Ø & 70Ø extruder RPM and haul-off speed
 * - Water temperature controller (Ø110 5 zones + Ø70 4 zones = 9 zones)
 * - 13 Vulcanization zones (1~13)
 * - Coating spray guns (1~3 guns)
 */
const ExtrusionEpdmConditions = ({
  formData,
  handleNestedFieldChange,
  handleBatchWaterZones,
  handleWaterZone110Change,
  handleWaterZone70Change,
  setFormData,
  EXTRUSION_STANDARD_SPECS,
}) => {
  return (
    <>
      {/* 1. 압출기 속도 (110Ø, 70Ø) & 인취기 속도 */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-300/80 dark:border-indigo-900/60 shadow-xs space-y-2">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-black text-xs flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            압출속도 & 인취기속도
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            110Ø / 70Ø RPM & 라인 인취 m/분
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* 110Ø Extruder Speed */}
          <div className="p-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black text-indigo-900 dark:text-indigo-300">
              <span>110Ø 압출속도</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={formData.conditions?.extruder110Rpm ?? ""}
                onChange={(e) => handleNestedFieldChange("conditions", "extruder110Rpm", e.target.value)}
                placeholder="속도 입력"
                className="w-full text-right pr-11 pl-2.5 py-1.5 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg font-black text-xs sm:text-sm text-indigo-950 dark:text-indigo-100 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-500 pointer-events-none">
                RPM
              </span>
            </div>
          </div>

          {/* 70Ø Extruder Speed */}
          <div className="p-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black text-indigo-900 dark:text-indigo-300">
              <span>70Ø 압출속도</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={formData.conditions?.extruder70Rpm ?? ""}
                onChange={(e) => handleNestedFieldChange("conditions", "extruder70Rpm", e.target.value)}
                placeholder="속도 입력"
                className="w-full text-right pr-11 pl-2.5 py-1.5 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg font-black text-xs sm:text-sm text-indigo-950 dark:text-indigo-100 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-500 pointer-events-none">
                RPM
              </span>
            </div>
          </div>

          {/* Haul-off Speed */}
          <div className="p-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black text-indigo-900 dark:text-indigo-300">
              <span>인취기 속도</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={formData.conditions?.haulOffSpeed ?? ""}
                onChange={(e) => handleNestedFieldChange("conditions", "haulOffSpeed", e.target.value)}
                placeholder="속도 입력"
                className="w-full text-right pr-13 pl-2.5 py-1.5 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg font-black text-xs sm:text-sm text-indigo-950 dark:text-indigo-100 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-500 pointer-events-none">
                m/분
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 온조기 조건 (표준: 50±5℃) - Ø110 5개 + Ø70 4개 = 총 9구간 */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-300/80 dark:border-teal-900/60 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white font-black text-xs flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5" />
            온조기 조건 (표준 50±5℃)
          </span>
          <button
            type="button"
            onClick={() => {
              const val = prompt("온조기 9개 전체 구간에 일괄 적용할 온도를 입력하세요(℃):", "50.0");
              if (val && !isNaN(Number(val))) {
                handleBatchWaterZones(val);
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200 text-[10.5px] font-black border border-teal-300 dark:border-teal-800 transition cursor-pointer"
          >
            ⚡ 50℃ 일괄적용
          </button>
        </div>

        {/* Group 1: Ø110 압출기 온조기 (5개 구간: 스크류, 실린더1, 실린더2, 실린더3, 헤드) */}
        <div className="p-2 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-teal-900 dark:text-teal-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-500 inline-block"></span>
              Ø110 압출기 온조기 (5개 구간)
            </span>
            <span className="text-[9.5px] text-teal-700 dark:text-teal-400 font-bold">
              스크류 · 실린더1~3 · 헤드 (±5℃)
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
            {[
              { key: "screw", label: "스크류" },
              { key: "cylinder1", label: "실린더1" },
              { key: "cylinder2", label: "실린더2" },
              { key: "cylinder3", label: "실린더3" },
              { key: "head", label: "헤드" }
            ].map((item) => {
              const curVal = formData.conditions?.waterZones110?.[item.key] ?? "50.0";
              return (
                <div
                  key={`w110_${item.key}`}
                  className="flex flex-col items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700/80 shadow-2xs"
                >
                  <span className="text-[10px] font-black text-teal-800 dark:text-teal-300 truncate w-full text-center">
                    {item.label}
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    value={curVal}
                    onChange={(e) => handleWaterZone110Change(item.key, e.target.value)}
                    placeholder="50.0"
                    className="w-full text-center bg-teal-50/50 dark:bg-slate-900 border border-teal-300/80 dark:border-teal-600 rounded py-1 font-black text-xs text-teal-950 dark:text-teal-100 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                  <span className="text-[8.5px] text-slate-400 font-bold mt-0.5">℃</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Group 2: Ø70 압출기 온조기 (4개 구간: 스크류, 실린더1, 실린더2, 실린더3) */}
        <div className="p-2 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-teal-900 dark:text-teal-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-500 inline-block"></span>
              Ø70 압출기 온조기 (4개 구간)
            </span>
            <span className="text-[9.5px] text-teal-700 dark:text-teal-400 font-bold">
              스크류 · 실린더1~3 (±5℃)
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {[
              { key: "screw", label: "스크류" },
              { key: "cylinder1", label: "실린더1" },
              { key: "cylinder2", label: "실린더2" },
              { key: "cylinder3", label: "실린더3" }
            ].map((item) => {
              const curVal = formData.conditions?.waterZones70?.[item.key] ?? "50.0";
              return (
                <div
                  key={`w70_${item.key}`}
                  className="flex flex-col items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700/80 shadow-2xs"
                >
                  <span className="text-[10px] font-black text-teal-800 dark:text-teal-300 truncate w-full text-center">
                    {item.label}
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    value={curVal}
                    onChange={(e) => handleWaterZone70Change(item.key, e.target.value)}
                    placeholder="50.0"
                    className="w-full text-center bg-teal-50/50 dark:bg-slate-900 border border-teal-300/80 dark:border-teal-600 rounded py-1 font-black text-xs text-teal-950 dark:text-teal-100 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                  <span className="text-[8.5px] text-slate-400 font-bold mt-0.5">℃</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. 가류조 온도: 1~13존 한줄 패널 */}
      <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-orange-300/80 dark:border-orange-900/60 shadow-xs space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="px-2 py-0.5 rounded-md bg-orange-600 text-white font-black text-xs">
            🔥 가류조 (210±20℃)
          </span>
          <button
            type="button"
            onClick={() => {
              const val = prompt("13개 가류존에 일괄 적용할 온도를 입력하세요(℃):", "210.0");
              if (val && !isNaN(Number(val))) {
                const num = Number(val);
                setFormData((prev) => ({
                  ...prev,
                  conditions: {
                    ...(prev.conditions || {}),
                    cureZoneTemp: String(num),
                    pcmZones: Array(13).fill(num)
                  }
                }));
              }
            }}
            className="px-2 py-0.5 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 text-[10px] font-black border border-orange-200 transition cursor-pointer"
          >
            ⚡ 일괄설정
          </button>
        </div>

        {/* 13 Zones Horizontal Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scroll-smooth">
          {Array.from({ length: 13 }).map((_, zIdx) => {
            const zoneNum = zIdx + 1;
            const currentZoneVal = formData.conditions?.pcmZones?.[zIdx] ?? EXTRUSION_STANDARD_SPECS?.pcmZones?.[zIdx] ?? 210.0;
            return (
              <div
                key={`pcm_zone_${zoneNum}`}
                className="flex flex-col items-center justify-between min-w-[56px] sm:min-w-[62px] p-1.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/80 shrink-0"
              >
                <span className="text-[9.5px] font-black text-orange-800 dark:text-orange-300">
                  {zoneNum}존
                </span>
                <input
                  type="number"
                  step="0.5"
                  value={currentZoneVal}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => {
                      const baseZones = EXTRUSION_STANDARD_SPECS?.pcmZones || Array(13).fill(210);
                      const curZones = Array.isArray(prev.conditions?.pcmZones) && prev.conditions.pcmZones.length === 13
                        ? [...prev.conditions.pcmZones]
                        : [...baseZones];
                      curZones[zIdx] = val === "" ? "" : Number(val);
                      return {
                        ...prev,
                        conditions: {
                          ...(prev.conditions || {}),
                          pcmZones: curZones,
                          cureZoneTemp: String(curZones[0] || 210.0)
                        }
                      };
                    });
                  }}
                  className="w-full text-center bg-white dark:bg-slate-800 border border-orange-300 dark:border-orange-700 rounded py-1 font-black text-xs text-orange-950 dark:text-orange-100 focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
                />
                <span className="text-[8.5px] text-slate-400 font-bold">℃</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. 코팅 분사압력: 1~3번건 한줄 패널 */}
      <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-sky-300/80 dark:border-sky-900/60 shadow-xs space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white font-black text-xs">
            🧪 코팅압력 (2.5±0.3 bar)
          </span>
        </div>

        {/* 3 Guns Grid */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {[
            { id: "sprayGun1", label: "1번건", defaultVal: "2.5" },
            { id: "sprayGun2", label: "2번건", defaultVal: "2.6" },
            { id: "sprayGun3", label: "3번건", defaultVal: "2.5" }
          ].map((gun) => {
            const curGunVal = formData.conditions?.[gun.id] ?? gun.defaultVal;
            return (
              <div
                key={gun.id}
                className="flex flex-col items-center justify-between p-1.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/80"
              >
                <span className="text-[10px] font-black text-sky-800 dark:text-sky-300">
                  {gun.label}
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={curGunVal}
                  onChange={(e) => handleNestedFieldChange("conditions", gun.id, e.target.value)}
                  placeholder="2.5"
                  className="w-full text-center bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-700 rounded py-1 font-black text-xs sm:text-sm text-sky-950 dark:text-sky-100 focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                />
                <span className="text-[8.5px] text-slate-400 font-bold">bar</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ExtrusionEpdmConditions;
