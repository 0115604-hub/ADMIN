import { Sparkles } from "lucide-react";
import LegoWorkReportBuilder from "../../../lego/LegoWorkReportBuilder";
import { getKSTDateString } from "../../../../utils/dateUtils";

export default function LegoEmbeddedWorkReport({
  setWorkLogMode,
  assignedTemplateData,
  setIsModalOpen,
  workerFullName,
  formData = {},
  handleSaveLog
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-slate-100 dark:bg-slate-900 rounded-3xl max-w-7xl w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
    >
      {/* Top Mode Switcher Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2 p-1 bg-slate-200 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setWorkLogMode("STANDARD")}
            className="px-3.5 py-1.5 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition"
          >
            📝 일반/공정 업무일지
          </button>
          <button
            type="button"
            onClick={() => setWorkLogMode("LEGO")}
            className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>🧩 5대공정 지정 양식 일보 ({assignedTemplateData?.title || "17대 블록 조합"})</span>
          </button>
        </div>

        <button
          onClick={() => setIsModalOpen(false)}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-black rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          ✕
        </button>
      </div>

      <LegoWorkReportBuilder
        initialWorkerName={workerFullName}
        initialWorkDate={formData?.date || getKSTDateString()}
        initialTemplateData={assignedTemplateData}
        isWorkerRecordingMode={Boolean(assignedTemplateData)}
        onSaveWorkReport={async (reportPayload) => {
          try {
            if (handleSaveLog) {
              const synthLog = {
                ...(formData || {}),
                title: reportPayload?.title || "부림텍 가공/협력업체 작업일보",
                writer: workerFullName || reportPayload?.workerName || "최현영",
                company: "부림텍",
                plant: "한림공장",
                assignedProcess: reportPayload?.processName || "가공/협력업체",
                actualQuantity: reportPayload?.totals?.genuine || 0,
                defectCount: reportPayload?.totals?.bad || 0,
                downtimeMinutes: 0,
                workDetails: `[5대공정양식: ${reportPayload?.title || "작업일보"}] 양품 ${reportPayload?.totals?.genuine || 0} / 불량 ${reportPayload?.totals?.bad || 0}`,
                legoConfig: reportPayload?.legoConfig || null,
                assignedTemplateId: assignedTemplateData?.id || null
              };
              await handleSaveLog(synthLog);
            }
          } catch (e) {}
          setIsModalOpen(false);
        }}
        isEmbedded={true}
      />
    </div>
  );
}
