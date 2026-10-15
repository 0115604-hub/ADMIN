import React from "react";
import {
  X,
  Smartphone,
  Laptop,
  History,
  Activity
} from "lucide-react";
import { formatRelativeAccessTime } from "../../../utils/dateUtils";

export default function WorkerLogListModal({
  selectedWorkerForLogs,
  setSelectedWorkerForLogs,
  accessLogs
}) {
  if (!selectedWorkerForLogs) return null;

  return (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedWorkerForLogs(null);
          }}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base text-white shadow-md ${
                  selectedWorkerForLogs.plant === "한림공장" ? "bg-emerald-600 ring-2 ring-emerald-400/30" : "bg-amber-500 ring-2 ring-amber-400/30"
                }`}>
                  {selectedWorkerForLogs.avatar || selectedWorkerForLogs.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {selectedWorkerForLogs.name} {selectedWorkerForLogs.title || ""} 접속 기록
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      selectedWorkerForLogs.plant === "한림공장"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}>
                      {selectedWorkerForLogs.plant}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    담당 공정: {selectedWorkerForLogs.assignedProcess} • 총 접속 이력 {(accessLogs[selectedWorkerForLogs.id] || []).length}건
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedWorkerForLogs(null)}
                className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Access Logs List */}
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {!(accessLogs[selectedWorkerForLogs.id]?.length > 0) ? (
                <div className="py-12 px-4 text-center space-y-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-500">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-800 dark:text-slate-200">
                      등록된 실시간 접속 기록이 없습니다.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      이 시점 이후 해당 작업자({selectedWorkerForLogs.name} {selectedWorkerForLogs.title})가 모바일 또는 PC로 로그인하면 접속 일시와 기기 정보가 자동 기록됩니다.
                    </p>
                  </div>
                </div>
              ) : (
                accessLogs[selectedWorkerForLogs.id].map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg ${
                          entry.deviceType === "MOBILE"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        }`}>
                          {entry.deviceType === "MOBILE" ? (
                            <Smartphone className="w-4 h-4" />
                          ) : (
                            <Laptop className="w-4 h-4" />
                          )}
                        </span>
                        <div>
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {entry.device}
                          </span>
                          <span className="ml-2 text-[10px] text-slate-400 font-mono">
                            {entry.ip}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700" title={entry.timestamp}>
                        {formatRelativeAccessTime(entry.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-indigo-500" />
                        <span>{entry.action || "포털 로그인"}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        📍 {entry.location || selectedWorkerForLogs.plant}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Close */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedWorkerForLogs(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
  );
}
