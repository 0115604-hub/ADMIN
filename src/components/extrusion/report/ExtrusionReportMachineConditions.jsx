import React from "react";
import { Flame } from "lucide-react";
import ExtrusionTpeConditions from "./conditions/ExtrusionTpeConditions";
import ExtrusionPvcConditions from "./conditions/ExtrusionPvcConditions";
import ExtrusionEpdmConditions from "./conditions/ExtrusionEpdmConditions";

/**
 * ExtrusionReportMachineConditions
 * Section 3 container: displays header badges and selects condition subcomponent
 * according to line type (TPE, PVC, or standard EPDM/PCM).
 */
const ExtrusionReportMachineConditions = ({
  formData,
  isTPELine,
  isPVCLine,
  handleNestedFieldChange,
  handleBatchWaterZones,
  handleWaterZone110Change,
  handleWaterZone70Change,
  handleTpeZoneChange,
  handlePvcZoneChange,
  handlePvcDryingZoneChange,
  setFormData,
  EXTRUSION_STANDARD_SPECS,
}) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-1.5">
        <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
          <Flame className="w-4 h-4 text-orange-500" />
          {isTPELine ? "③ TPE 작업조건" : isPVCLine ? "③ PVC 작업조건" : "③ 작업조건"}
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          {isTPELine ? (
            <>
              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-black text-[10.5px] border border-purple-300">
                4개 압출기(100·80·65·35Ø) & 인취속도
              </span>
              <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-black text-[10.5px] border border-teal-300">
                압출기온도 (설정온도 ±10℃)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-black text-[10.5px] border border-blue-300">
                냉각수온도
              </span>
            </>
          ) : isPVCLine ? (
            <>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black text-[10.5px] border border-amber-300">
                80Ø 압출속도 & 인취속도
              </span>
              <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-black text-[10.5px] border border-teal-300">
                압출기온도 (7구간, ±10℃)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-black text-[10.5px] border border-sky-300">
                냉각조 · 본드(공급기1·2) · 후로킹(식모) · 건조로(1~4존)
              </span>
            </>
          ) : (
            <>
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-black text-[10.5px] border border-indigo-300">
                압출·인취속도
              </span>
              <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-black text-[10.5px] border border-teal-300">
                온조기(9구간)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-black text-[10.5px] border border-orange-300">
                {formData.lineId === "pcm3" ? "가류조(11존)" : "가류조(13존)"}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-black text-[10.5px] border border-sky-300">
                코팅압력
              </span>
            </>
          )}
        </div>
      </div>

      {isTPELine ? (
        <ExtrusionTpeConditions
          formData={formData}
          handleNestedFieldChange={handleNestedFieldChange}
          handleTpeZoneChange={handleTpeZoneChange}
          setFormData={setFormData}
        />
      ) : isPVCLine ? (
        <ExtrusionPvcConditions
          formData={formData}
          handleNestedFieldChange={handleNestedFieldChange}
          handlePvcZoneChange={handlePvcZoneChange}
          handlePvcDryingZoneChange={handlePvcDryingZoneChange}
          setFormData={setFormData}
        />
      ) : (
        <ExtrusionEpdmConditions
          formData={formData}
          handleNestedFieldChange={handleNestedFieldChange}
          handleBatchWaterZones={handleBatchWaterZones}
          handleWaterZone110Change={handleWaterZone110Change}
          handleWaterZone70Change={handleWaterZone70Change}
          setFormData={setFormData}
          EXTRUSION_STANDARD_SPECS={EXTRUSION_STANDARD_SPECS}
        />
      )}
    </div>
  );
};

export default ExtrusionReportMachineConditions;
