import React from "react";
import { Sparkles } from "lucide-react";
import LegoWorkReportBuilder from "../../lego/LegoWorkReportBuilder";

export const YuseongLegoReportSection = ({
  assignedTemplate,
  project,
  processId,
  customWorker,
  worker,
  date,
  activeAssignedTemplate,
  setIsLegoMode,
  handleSaveLegoReport,
  handleDeleteLegoReport,
  editReport
}) => {
  if (!assignedTemplate) return null;

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 border border-indigo-700/60 flex items-center justify-between text-white flex-wrap gap-2">
        <div>
          <div className="text-xs font-black flex items-center gap-1.5 text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>5대 공정 지정 작업일보 양식 적용</span>
          </div>
          <div className="text-sm font-black text-white mt-0.5">
            {assignedTemplate.title} ({project})
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsLegoMode(false)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-600 transition cursor-pointer"
        >
          ↩️ 기본 수기양식으로 전환
        </button>
      </div>

      <LegoWorkReportBuilder
        key={`${project}_${processId}_${customWorker.trim() || worker}_${date}_${activeAssignedTemplate?.id || "default"}`}
        initialTemplateData={activeAssignedTemplate}
        isWorkerRecordingMode={true}
        initialWorkerName={customWorker.trim() || worker}
        initialWorkDate={date}
        onSaveWorkReport={handleSaveLegoReport}
        onDeleteWorkReport={editReport?.id ? handleDeleteLegoReport : null}
        isEmbedded={true}
      />
    </div>
  );
};
