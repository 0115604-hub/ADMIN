import React from "react";
import {
  Users,
  Factory,
  Smartphone,
  Laptop,
  Clock,
  AlertTriangle
} from "lucide-react";

export const AdminAccessAndIncidentSection = ({
  isAdmin,
  PLANTS = [],
  accessLogs = {},
  handleOpenWorkerLogs,
  formatRelativeAccessTime,
  onNavigateTab
}) => {
  if (!isAdmin) return null;

  return (
    <>
      {/* 6. 실시간 접속기록 현황 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5 min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
              6. 실시간 접속기록 현황
            </h3>
            <span className="px-2 py-0.2 rounded-full text-[9.5px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
              ADMIN 전용
            </span>
          </div>
          <span className="text-[10.5px] text-slate-400 font-medium truncate">
            💡 탭하여 상세 접속 이력 조회
          </span>
        </div>

        {/* Plant Groups Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {PLANTS.map((plant) => (
            <div
              key={plant.id}
              className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 space-y-2 min-w-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-xs text-slate-900 dark:text-white">
                  <Factory
                    className={`w-3.5 h-3.5 ${plant.name === "한림공장" ? "text-emerald-600" : "text-amber-500"}`}
                  />
                  <span>{plant.name}</span>
                </div>
                <span className="text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {plant.workers?.length}명
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {plant.workers?.map((worker) => {
                  const workerLogs = accessLogs[worker.id] || [];
                  const lastLog = workerLogs[0] || null;
                  const isMobile = lastLog?.deviceType === "MOBILE";

                  return (
                    <button
                      key={worker.id}
                      type="button"
                      onClick={() => handleOpenWorkerLogs && handleOpenWorkerLogs(worker)}
                      className="flex flex-col justify-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 hover:shadow-xs transition-all text-left group cursor-pointer w-full min-w-0 active:scale-[0.98]"
                    >
                      {/* 1줄: 이름 + 직책 */}
                      <div className="flex items-center justify-between gap-1 w-full min-w-0">
                        <div className="flex items-baseline gap-1 min-w-0 truncate">
                          <span className="font-black text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                            {worker.name}
                          </span>
                          <span className="text-[9.5px] font-bold text-slate-400 shrink-0">
                            {worker.title}
                          </span>
                        </div>
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            lastLog ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                          }`}
                        />
                      </div>

                      {/* 2줄: 접속기록 */}
                      <div className="text-[10px] font-bold w-full truncate mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        {lastLog ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 truncate">
                            {isMobile ? (
                              <Smartphone className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                            ) : (
                              <Laptop className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                            )}
                            <span className="truncate">
                              {formatRelativeAccessTime && formatRelativeAccessTime(lastLog.timestamp)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium inline-flex items-center gap-1">
                            <Clock className="w-2 h-2 text-slate-300 dark:text-slate-600 shrink-0" />
                            <span>미접속</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. 시스템 오류 및 조치 이력 관리 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5 min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
              7. 시스템 오류 및 조치 이력 관리
            </h3>
            <span className="px-2 py-0.2 rounded-full text-[9.5px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
              ADMIN 전용
            </span>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab("incident_logs")}
            className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>전체 관리 및 신규 등록 →</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div
            onClick={() => onNavigateTab && onNavigateTab("incident_logs")}
            className="p-2.5 sm:p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 space-y-1 hover:border-indigo-400 dark:hover:border-indigo-600 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10.5px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                🟢 조치완료 • 전자결재
              </span>
              <span className="text-[11px] text-slate-400 font-mono font-medium">10/15 (Commit 202ac86)</span>
            </div>
            <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
              전자결재 결재대기 카운트 동적 연동 및 협력사 보고서 자동 취합 누락 조치
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
              결재함 배지 카운트 실시간 동기화 및 협력사 특근/근태보고서 자동 연동 완료
            </p>
          </div>

          <div
            onClick={() => onNavigateTab && onNavigateTab("incident_logs")}
            className="p-2.5 sm:p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 space-y-1 hover:border-indigo-400 dark:hover:border-indigo-600 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10.5px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                🟢 조치완료 • 근태관리
              </span>
              <span className="text-[11px] text-slate-400 font-mono font-medium">10/15 (Commit cff95b6)</span>
            </div>
            <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
              근태 최종 저장 및 보고서 등록 시 TDZ ReferenceError 런타임 크래시 조치
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
              선언 순서 재배치로 런타임 에러 완전 제거 및 평일 미선택 정시 자동채우기 확인창 적용
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
