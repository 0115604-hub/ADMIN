import React from "react";
import {
  CheckCircle2,
  Copy
} from "lucide-react";

export default function LineMatchShareModal({
  lineMatchShareModal,
  setLineMatchShareModal,
  handleCopyLineMatchText,
  copyToast
}) {
  if (!lineMatchShareModal) return null;

  return (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setLineMatchShareModal(null);
          }}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-7 border-2 border-emerald-500 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/25">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <span>압출 라인별 엑셀 파일 매칭 및 비가동 공유 리포트</span>
                  </h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    {lineMatchShareModal.writer} 책임 • {lineMatchShareModal.date} 주간 실적 (총 {lineMatchShareModal.totalMinutes}분 비가동)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLineMatchShareModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 text-base font-black rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Explanatory Banner */}
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 font-medium">
              💡 업로드하신 각 라인별 엑셀 파일이 설비 라인과 정확하게 매칭되어 데이터베이스에 반영되었습니다. 아래 버튼을 눌러 카카오톡이나 사내 메신저로 즉시 공유하실 수 있습니다.
            </div>

            {/* Matched Lines List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {lineMatchShareModal.matches.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg font-black text-xs bg-emerald-600 text-white shadow-xs">
                        {m.lineName}
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                        📁 {m.fileName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">({m.fileSize})</span>
                    </div>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                      {m.totalMinutes || 0}분 비가동
                    </span>
                  </div>

                  {m.records && m.records.length > 0 && (
                    <div className="pl-3 border-l-2 border-emerald-500 dark:border-emerald-600 text-slate-700 dark:text-slate-300 text-[11px] space-y-0.5">
                      <p className="font-bold text-slate-900 dark:text-white">
                        • 사유: <strong className="text-emerald-700 dark:text-emerald-300">{m.records[0].reason}</strong> ({m.records[0].durationMinutes}분)
                      </p>
                      <p>• 현상: {m.records[0].details}</p>
                      {m.records[0].actionTaken && (
                        <p className="text-slate-500 dark:text-slate-400">• 조치: {m.records[0].actionTaken}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setLineMatchShareModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
              >
                닫기
              </button>

              <button
                type="button"
                onClick={() => handleCopyLineMatchText(lineMatchShareModal.matches, lineMatchShareModal.date, lineMatchShareModal.writer)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>{copyToast ? "✓ 클립보드에 복사 완료!" : "📋 라인별 매칭 내용 전체 복사 (공유용)"}</span>
              </button>
            </div>
          </div>
        </div>
  );
}
