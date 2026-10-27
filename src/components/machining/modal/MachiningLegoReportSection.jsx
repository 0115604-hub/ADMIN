import React from "react";
import { Sparkles } from "lucide-react";
import LegoWorkReportBuilder from "../../lego/LegoWorkReportBuilder";

export const MachiningLegoReportSection = ({
  project,
  processId,
  effectiveWorkerName,
  date,
  activeAssignedTemplate,
  isLegoMode,
  setIsLegoMode,
  handleSaveLegoReport,
  handleDeleteLegoReport
}) => {
  return (
    <div className="space-y-4">
      {/* 🧩 레고블럭 양식 전환 버튼 배너 */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/40 shadow-lg flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-md">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-white">
                17대 레고블럭 실물 조합 작업일보
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40">
                신규
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              행 추가 • 치수 변경 • 제목 수정이 자유로운 모듈형 레고블럭 양식으로 일보를 작성합니다.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsLegoMode(!isLegoMode)}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-md ${
            isLegoMode
              ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-600"
              : "bg-indigo-600 hover:bg-indigo-500 text-white ring-2 ring-indigo-400"
          }`}
        >
          <span>
            {isLegoMode
              ? "↩️ 표준 입력 양식으로 돌아가기"
              : "🧩 레고블럭 양식으로 일보 작성하기"}
          </span>
        </button>
      </div>

      {isLegoMode && (
        <div className="p-1 sm:p-2">
          <LegoWorkReportBuilder
            key={`${project}_${processId}_${effectiveWorkerName}_${date}_${activeAssignedTemplate?.id || "default"}`}
            initialPresetId={
              processId === "소재준비"
                ? "REPORT_CUTTING"
                : processId === "조인트"
                ? "REPORT_JOINT"
                : processId === "검사"
                ? "REPORT_RIGHT_ANGLE"
                : "REPORT_CUTTING"
            }
            initialTemplateData={activeAssignedTemplate}
            isWorkerRecordingMode={Boolean(activeAssignedTemplate)}
            initialWorkerName={effectiveWorkerName}
            initialWorkDate={date}
            onSaveWorkReport={handleSaveLegoReport}
            onDeleteWorkReport={handleDeleteLegoReport}
            isEmbedded={true}
          />
        </div>
      )}
    </div>
  );
};

export default MachiningLegoReportSection;
