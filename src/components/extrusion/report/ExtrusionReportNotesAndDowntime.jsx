import React from "react";
import CommonDowntimeDefectPanel from "../../common/CommonDowntimeDefectPanel";

/**
 * ExtrusionReportNotesAndDowntime
 * Section 4: 비가동 및 부적합품 발생내역 (CommonDowntimeDefectPanel)
 * Section 5: 특이사항 및 교대 인수인계 사항 (Notes & Handover)
 */
const ExtrusionReportNotesAndDowntime = ({
  formData,
  setFormData,
  dtEvents,
  defaultWasteWeight = ""
}) => {
  const events = dtEvents || (Array.isArray(formData?.downtimeEvents) ? formData.downtimeEvents : []);

  return (
    <>
      {/* ========================================================================= */}
      {/* Section 4: 비가동 및 부적합품 발생내역 (전 공정 공통 패널 - 조치전/조치후 사진 등록) */}
      {/* ========================================================================= */}
      <CommonDowntimeDefectPanel
        title="비가동 및 부적합품 발생내역"
        plantLabel="압출동"
        unitLabel="폐기중량(kg)"
        events={events}
        defaultScrapKg={defaultWasteWeight}
        onChangeEvents={(nextEvents) =>
          setFormData((prev) => ({
            ...prev,
            downtimeEvents: nextEvents
          }))
        }
      />

      {/* ========================================================================= */}
      {/* Section 5: Notes & Handover */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
        <label className="block font-black text-slate-900 dark:text-white text-xs sm:text-sm">
          ⑤ 특이사항 및 교대 인수인계 사항
        </label>
        <textarea
          rows={2}
          value={formData?.notes || ""}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="교대 작업자에게 전달할 내용이나 설비 이상 조짐, 원료 수급 이슈 등을 자유롭게 기재하세요."
          className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
        />
      </div>
    </>
  );
};

export default ExtrusionReportNotesAndDowntime;
