import React from "react";
import { Flame } from "lucide-react";
import { EXTRUSION_STANDARD_SPECS } from "../../../services/extrusionProductionService";

export const ExtrusionConditionsSection = ({
  formData,
  onNestedFieldChange,
  setFormData
}) => {
  const pcmZones = Array.isArray(formData?.conditions?.pcmZones) && formData.conditions.pcmZones.length === 13
    ? formData.conditions.pcmZones
    : [...EXTRUSION_STANDARD_SPECS.pcmZones];

  const waterZones = Array.isArray(formData?.conditions?.waterZones) && formData.conditions.waterZones.length === 4
    ? formData.conditions.waterZones
    : [47.0, 48.5, 49.0, 47.5];

  const handleBatchPcmZones = () => {
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
  };

  const handlePcmZoneChange = (zIdx, val) => {
    setFormData((prev) => {
      const curZones = Array.isArray(prev.conditions?.pcmZones) && prev.conditions.pcmZones.length === 13
        ? [...prev.conditions.pcmZones]
        : [...EXTRUSION_STANDARD_SPECS.pcmZones];
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
  };

  const handleWaterZoneChange = (secIdx, val) => {
    setFormData((prev) => {
      const curWaterZones = Array.isArray(prev.conditions?.waterZones) && prev.conditions.waterZones.length === 4
        ? [...prev.conditions.waterZones]
        : [47.0, 48.5, 49.0, 47.5];
      curWaterZones[secIdx] = val === "" ? "" : Number(val);
      return {
        ...prev,
        conditions: {
          ...(prev.conditions || {}),
          waterZones: curWaterZones,
          waterTemp: String(curWaterZones[0] || 50.0)
        }
      };
    });
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
          <Flame className="w-4 h-4 text-orange-500" />
          ③ 작업조건
        </span>
        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-black text-[10.5px] border border-orange-300">
            가류조
          </span>
          <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-black text-[10.5px] border border-teal-300">
            온조기
          </span>
          <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-black text-[10.5px] border border-sky-300">
            코팅압력
          </span>
        </div>
      </div>

      {/* 1. 가류조 온도: 1~13존 한줄 패널 */}
      <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-orange-300/80 dark:border-orange-900/60 shadow-xs space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="px-2 py-0.5 rounded-md bg-orange-600 text-white font-black text-xs">
            🔥 가류조 (210±20℃)
          </span>
          <button
            type="button"
            onClick={handleBatchPcmZones}
            className="px-2 py-0.5 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 text-[10px] font-black border border-orange-200 transition cursor-pointer"
          >
            ⚡ 일괄설정
          </button>
        </div>

        {/* 13 Zones Horizontal Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scroll-smooth">
          {Array.from({ length: 13 }).map((_, zIdx) => {
            const zoneNum = zIdx + 1;
            const currentZoneVal = pcmZones[zIdx] ?? EXTRUSION_STANDARD_SPECS.pcmZones[zIdx] ?? 210.0;
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
                  onChange={(e) => handlePcmZoneChange(zIdx, e.target.value)}
                  className="w-full text-center bg-white dark:bg-slate-800 border border-orange-300 dark:border-orange-700 rounded py-1 font-black text-xs text-orange-950 dark:text-orange-100 focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
                />
                <span className="text-[8.5px] text-slate-400 font-bold">℃</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 온조기 온도: 1~4구간 한줄 패널 */}
      <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-300/80 dark:border-teal-900/60 shadow-xs space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white font-black text-xs">
            💧 온조기 (50±5℃)
          </span>
        </div>

        {/* 4 Sections Grid */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {[
            { idx: 0, label: "1구간", defaultVal: 47.0 },
            { idx: 1, label: "2구간", defaultVal: 48.5 },
            { idx: 2, label: "3구간", defaultVal: 49.0 },
            { idx: 3, label: "4구간", defaultVal: 47.5 }
          ].map((sec) => {
            const curSecVal = waterZones[sec.idx] ?? EXTRUSION_STANDARD_SPECS.waterZones?.[sec.idx] ?? sec.defaultVal;
            return (
              <div
                key={`water_zone_${sec.idx}`}
                className="flex flex-col items-center justify-between p-1.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80"
              >
                <span className="text-[10px] font-black text-teal-800 dark:text-teal-300">
                  {sec.label}
                </span>
                <input
                  type="number"
                  step="0.5"
                  value={curSecVal}
                  onChange={(e) => handleWaterZoneChange(sec.idx, e.target.value)}
                  className="w-full text-center bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 rounded py-1 font-black text-xs sm:text-sm text-teal-950 dark:text-teal-100 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                />
                <span className="text-[8.5px] text-slate-400 font-bold">℃</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 코팅 분사압력: 1~3번건 한줄 패널 */}
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
            const curGunVal = formData?.conditions?.[gun.id] ?? gun.defaultVal;
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
                  onChange={(e) => onNestedFieldChange("conditions", gun.id, e.target.value)}
                  placeholder="2.5"
                  className="w-full text-center bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-700 rounded py-1 font-black text-xs sm:text-sm text-sky-950 dark:text-sky-100 focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                />
                <span className="text-[8.5px] text-slate-400 font-bold">bar</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExtrusionConditionsSection;
