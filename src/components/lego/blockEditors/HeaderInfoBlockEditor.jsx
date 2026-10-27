import React from "react";

export const HeaderInfoBlockEditor = ({
  blockKey,
  draftReport,
  setDraftReport,
  inputBaseCls
}) => {
  if (blockKey === "timeAndOutput") {
    return (
      <div className="space-y-4 bg-slate-950/90 p-4 rounded-2xl border border-slate-700">
        <span className="font-black text-sm text-cyan-300 block">
          조인트 작업자 및 근무시간 기본 설정 (블록 1)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-1">작업자 성명</label>
            <input
              type="text"
              value={draftReport.workerName || ""}
              onChange={(e) => setDraftReport({ ...draftReport, workerName: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl font-bold ${inputBaseCls}`}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-1">시작 시간</label>
            <input
              type="time"
              value={draftReport.startTime || "08:00"}
              onChange={(e) => setDraftReport({ ...draftReport, startTime: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl font-mono font-bold ${inputBaseCls}`}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-200 block mb-1">종료 시간</label>
            <input
              type="time"
              value={draftReport.finishTime || "17:00"}
              onChange={(e) => setDraftReport({ ...draftReport, finishTime: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl font-mono font-bold ${inputBaseCls}`}
            />
          </div>
        </div>
      </div>
    );
  }

  if (blockKey === "basicInfo") {
    return (
      <div className="space-y-4 bg-slate-950/90 p-4 rounded-2xl border border-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-cyan-300 block mb-1">일보 전체 제목 (한 줄 통일)</label>
            <input
              type="text"
              value={draftReport.title || "소재준비작업일보"}
              onChange={(e) => setDraftReport({ ...draftReport, title: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl font-bold ${inputBaseCls}`}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-cyan-300 block mb-1">1. 차종 (Car Model)</label>
            <input
              type="text"
              value={draftReport.carModel || ""}
              onChange={(e) => setDraftReport({ ...draftReport, carModel: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl font-black text-amber-300 ${inputBaseCls}`}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-cyan-300 block mb-1">2. 품명 (Part Name)</label>
            <input
              type="text"
              value={draftReport.partName || ""}
              onChange={(e) => setDraftReport({ ...draftReport, partName: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl font-bold ${inputBaseCls}`}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-cyan-300 block mb-1">3. 공정명 (Process Name)</label>
            <input
              type="text"
              value={draftReport.processName || "소재준비"}
              onChange={(e) => setDraftReport({ ...draftReport, processName: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl font-bold text-cyan-300 ${inputBaseCls}`}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-cyan-300 block mb-1">작업자 성명</label>
            <input
              type="text"
              value={draftReport.workerName || ""}
              onChange={(e) => setDraftReport({ ...draftReport, workerName: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl font-bold ${inputBaseCls}`}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-cyan-300 block mb-1">양식 번호 (Form No)</label>
            <input
              type="text"
              value={draftReport.formNo || ""}
              onChange={(e) => setDraftReport({ ...draftReport, formNo: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl font-mono font-bold ${inputBaseCls}`}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-cyan-300 block mb-1">근무 시작 시간</label>
            <input
              type="time"
              value={draftReport.startTime || "08:00"}
              onChange={(e) => setDraftReport({ ...draftReport, startTime: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl font-mono font-bold ${inputBaseCls}`}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-cyan-300 block mb-1">근무 종료 시간</label>
            <input
              type="time"
              value={draftReport.finishTime || "17:00"}
              onChange={(e) => setDraftReport({ ...draftReport, finishTime: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl font-mono font-bold ${inputBaseCls}`}
            />
          </div>
        </div>
      </div>
    );
  }

  if (blockKey === "remarks") {
    return (
      <div className="space-y-3 bg-slate-950/90 p-4 rounded-2xl border border-slate-700">
        <label className="text-xs font-black text-cyan-300 block">
          특기 사항 및 조치 사항 기본 문구
        </label>
        <textarea
          rows={4}
          value={draftReport.remarks || ""}
          onChange={(e) => setDraftReport({ ...draftReport, remarks: e.target.value })}
          className="w-full p-3 rounded-2xl border border-slate-600 bg-slate-800 text-white font-medium text-xs leading-relaxed"
          placeholder="칼날 교체 주기, 설비 이상 조치 이력 등을 입력하세요."
        />
      </div>
    );
  }

  return null;
};
