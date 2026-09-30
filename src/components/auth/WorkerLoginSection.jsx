import React from "react";
import { Factory, Calendar, Cpu, Layers, Sparkles, Zap, ShieldAlert, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { ADMIN_USERS, PLANTS, EXTRUSION_WORKERS } from "../../context/AuthContext";
import { getUserLeaveStatus } from "../../services/annualLeaveService";
import { WorkerPinModal } from "./WorkerPinModal";

export const WorkerLoginSection = ({
  factoryBuildingTab = "extrusion", // extrusion | processing
  selectedUser,
  setSelectedUser,
  pin,
  setPin,
  rememberMe,
  setRememberMe,
  loading,
  errorMsg,
  annualLeaves,
  samrangjinLeaveCount,
  hanlimLeaveCount,
  managerLeaves,
  companyAttendanceStats,
  activeIssues = [],
  urgentIssues = [],
  onUserClick,
  onPinSubmit,
  onOpenExtrusionReport,
  onOpenDisasterModal,
  onOpenQualityAlerts
}) => {
  const isExtrusion = factoryBuildingTab === "extrusion";

  return (
    <div className="space-y-3">
      {/* ========================================================================= */}
      {/* CASE 1: [🏭 압출동] 선택 시: 11명 압출동 전용 작업자 명단 표출 */}
      {/* ========================================================================= */}
      {isExtrusion ? (
        <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border-2 border-teal-400 dark:border-teal-700 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs sm:text-sm font-black text-teal-900 dark:text-teal-200 flex items-center gap-1.5 flex-wrap">
              <div className="p-1.5 rounded-xl bg-teal-600 text-white shadow-xs">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <span className="tracking-wide">삼랑진공장 압출동 작업자</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
                비밀번호: 11
              </span>
            </div>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-teal-600 text-white shadow-xs">
              총 {EXTRUSION_WORKERS.length}명
            </span>
          </div>

          {/* 🌟 명확한 입장 안내 배너 */}
          <div className="p-2 sm:p-2.5 rounded-xl bg-teal-600/10 dark:bg-teal-900/40 border border-teal-300/80 dark:border-teal-700/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 animate-bounce" />
              <span className="text-[11.5px] sm:text-xs font-black text-teal-950 dark:text-teal-200 truncate">
                👉 본인 이름 터치 → 핀번호(11) → 중대재해·품질 확인 후 압출 생산관리로 입장!
              </span>
            </div>
            {EXTRUSION_WORKERS[0] && (
              <button
                type="button"
                onClick={() => onUserClick(EXTRUSION_WORKERS[0])}
                className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-black shrink-0 shadow-xs cursor-pointer active:scale-95 transition-all whitespace-nowrap"
              >
                ⚡ 공영국(반장) 바로입장
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-4 gap-1 sm:gap-1.5">
            {EXTRUSION_WORKERS.map((worker) => {
              const isLead = worker.title === "반장" || worker.name === "공영국";
              const leaveStatus = getUserLeaveStatus(worker.id, worker.name, annualLeaves, { excludeTodo: true });
              const hasLeave = Boolean(leaveStatus);
              const isLeaveToday = Boolean(leaveStatus?.isToday);

              return (
                <button
                  key={worker.id}
                  onClick={() => onUserClick(worker)}
                  title={hasLeave ? `${worker.name} (${worker.title || ""}): ${leaveStatus.fullLabel}` : `${worker.name} (${worker.title || ""}) - 비번 11`}
                  className={`min-h-[42px] sm:min-h-[44px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                    isLead
                      ? `border-teal-500 bg-teal-700 shadow-md ${isLeaveToday ? "ring-2 ring-rose-500 animate-pulse" : ""}`
                      : isLeaveToday
                      ? "border-rose-500 bg-slate-900 ring-2 ring-rose-400/80 animate-pulse text-white shadow-xs"
                      : hasLeave
                      ? "border-blue-400 dark:border-blue-500 bg-slate-900 text-white shadow-2xs"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs hover:border-teal-400"
                  }`}
                >
                  {/* 좌측: 이름 구역 (42%) */}
                  <div className={`w-[42%] sm:w-[40%] flex items-center justify-center px-0.5 sm:px-1 text-center shrink-0 ${
                    isLead
                      ? "bg-teal-800"
                      : isLeaveToday
                      ? "bg-rose-950/90"
                      : hasLeave
                      ? "bg-blue-950/90"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}>
                    <span className={`font-black whitespace-nowrap leading-none ${
                      hasLeave
                        ? "text-[10px] sm:text-[12.5px] tracking-tighter"
                        : "text-xs sm:text-[13px] tracking-tight"
                    } ${
                      isLead
                        ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                        : isLeaveToday || hasLeave
                        ? "text-white font-black"
                        : "text-slate-950 dark:text-white font-black"
                    }`}>
                      {worker.name}
                    </span>
                  </div>

                  {/* 우측: 상태 / 직책 구역 (58%) */}
                  <div className={`w-[58%] sm:w-[60%] flex flex-col justify-center items-center text-center px-1 sm:px-1.5 py-0.5 leading-tight ${
                    isLead
                      ? hasLeave
                        ? "bg-rose-600 text-white border-l-2 border-teal-400"
                        : "bg-teal-600 text-white border-l-2 border-teal-400"
                      : isLeaveToday
                      ? "bg-rose-600 text-white border-l-2 border-rose-400"
                      : hasLeave
                      ? "bg-blue-600 text-white border-l-2 border-blue-400"
                      : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700"
                  }`}>
                    {hasLeave ? (
                      leaveStatus.line2 ? (
                        <span className="flex flex-col items-center justify-center leading-tight">
                          <span className="text-[10px] sm:text-[11px] font-black whitespace-nowrap">{leaveStatus.line1}</span>
                          <span className="text-[9px] sm:text-[10px] font-black whitespace-nowrap text-amber-200 mt-0.5">{leaveStatus.line2}</span>
                        </span>
                      ) : (
                        <span className="text-[10.5px] sm:text-[11.5px] font-black whitespace-nowrap">
                          <span className="hidden sm:inline">{leaveStatus.displayBadge}</span>
                          <span className="sm:hidden">{leaveStatus.mobileBadge || leaveStatus.displayBadge}</span>
                        </span>
                      )
                    ) : (
                      <span className="text-[10.5px] sm:text-[11.5px] font-bold">{worker.title || "사원"}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* CASE 2: [⚙️ 가공동] 선택 시: 삼랑진 가공동 & 한림공장 작업자 명단 표출 */
        /* ========================================================================= */
        <div className="space-y-2.5 sm:space-y-3">
          {/* 1. 삼랑진공장 (가공동/품질/관리) */}
          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5 flex-wrap">
                <div className="p-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Factory className="w-3.5 h-3.5" />
                </div>
                <span className="tracking-wide">삼랑진공장 (가공동/품질/관리)</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                  samrangjinLeaveCount > 0
                    ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs"
                    : "bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                }`}>
                  <Calendar className="w-2.5 h-2.5" />
                  <span>일정등록 {samrangjinLeaveCount}명</span>
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                {PLANTS[0].workers.length}명
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-4 gap-1 sm:gap-1.5">
              {PLANTS[0].workers.map((worker) => {
                const isMyeongjae = worker.name === "이명재" || worker.assignedProcess === "총괄관리";
                const isPartner = worker.isPartner || worker.title === "협력업체";
                const leaveStatus = getUserLeaveStatus(worker.id, worker.name, annualLeaves, { excludeTodo: true });
                const hasLeave = Boolean(leaveStatus);
                const isLeaveToday = Boolean(leaveStatus?.isToday);

                return (
                  <button
                    key={worker.id}
                    onClick={() => onUserClick(worker)}
                    title={hasLeave ? `${worker.name} (${worker.title || ""}): ${leaveStatus.fullLabel}` : `${worker.name} (${worker.title || ""})`}
                    className={`min-h-[42px] sm:min-h-[44px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                      isMyeongjae
                        ? `border-amber-400 bg-amber-700 shadow-md ${
                            isLeaveToday ? "ring-2 ring-rose-500 animate-pulse" : ""
                          }`
                        : isLeaveToday
                        ? "border-rose-500 bg-slate-900 ring-2 ring-rose-400/80 animate-pulse text-white shadow-xs"
                        : hasLeave
                        ? "border-blue-400 dark:border-blue-500 bg-slate-900 text-white shadow-2xs"
                        : isPartner
                        ? "border-purple-300 dark:border-purple-800/80 bg-white dark:bg-slate-900 text-purple-900 dark:text-purple-200 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    }`}
                  >
                    {/* 좌측: 이름 구역 (39%) */}
                    <div className={`w-[39%] sm:w-[38%] flex items-center justify-center px-0.5 sm:px-1 text-center shrink-0 ${
                      isMyeongjae
                        ? "bg-amber-800"
                        : isLeaveToday
                        ? "bg-rose-950/90"
                        : hasLeave
                        ? "bg-blue-950/90"
                        : isPartner
                        ? "bg-purple-50 dark:bg-purple-950/50"
                        : "bg-slate-100 dark:bg-slate-800"
                    }`}>
                      <span className={`font-black whitespace-nowrap leading-none ${
                        hasLeave
                          ? "text-[10px] sm:text-[12.5px] tracking-tighter"
                          : "text-xs sm:text-[13px] tracking-tight"
                      } ${
                        isMyeongjae
                          ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                          : isLeaveToday || hasLeave
                          ? "text-white font-black"
                          : "text-slate-950 dark:text-white font-black"
                      }`}>
                        {worker.name}
                      </span>
                    </div>

                    {/* 우측: 상태 구역 (61%) */}
                    <div className={`w-[61%] sm:w-[62%] flex flex-col justify-center items-center text-center px-1 sm:px-1.5 py-0.5 leading-tight ${
                      isMyeongjae
                        ? hasLeave
                          ? "bg-rose-600 text-white border-l-2 border-amber-400"
                          : "bg-amber-600 text-white border-l-2 border-amber-400"
                        : isLeaveToday
                        ? "bg-rose-600 text-white border-l-2 border-rose-400"
                        : hasLeave
                        ? "bg-blue-600 text-white border-l-2 border-blue-400"
                        : isPartner
                        ? "bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 border-l border-purple-300 dark:border-purple-800"
                        : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700"
                    }`}>
                      {hasLeave ? (
                        leaveStatus.line2 ? (
                          <span className="flex flex-col items-center justify-center leading-tight">
                            <span className="text-[10px] sm:text-[11px] font-black whitespace-nowrap">{leaveStatus.line1}</span>
                            <span className="text-[9px] sm:text-[10px] font-black whitespace-nowrap text-amber-200 mt-0.5">{leaveStatus.line2}</span>
                          </span>
                        ) : (
                          <span className="text-[10.5px] sm:text-[11.5px] font-black whitespace-nowrap">
                            <span className="hidden sm:inline">{leaveStatus.displayBadge}</span>
                            <span className="sm:hidden">{leaveStatus.mobileBadge || leaveStatus.displayBadge}</span>
                          </span>
                        )
                      ) : isPartner ? (
                        <span className="text-[10.5px] sm:text-[11.5px] font-bold">협력</span>
                      ) : (
                        <span className="text-[10.5px] sm:text-[11.5px] font-bold">{worker.title || "선임"}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. 한림공장 (가공동/외주가공) */}
          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 flex-wrap">
                <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Factory className="w-3.5 h-3.5" />
                </div>
                <span className="tracking-wide">한림공장 (가공동/외주가공)</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                  hanlimLeaveCount > 0
                    ? "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 shadow-2xs"
                    : "bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                }`}>
                  <Calendar className="w-2.5 h-2.5" />
                  <span>일정등록 {hanlimLeaveCount}명</span>
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                {PLANTS[1].workers.length}명
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-4 gap-1 sm:gap-1.5">
              {PLANTS[1].workers.map((worker) => {
                const isDongwook = worker.name === "김동욱" || worker.assignedProcess === "총괄관리";
                const isPartner = worker.isPartner || worker.title === "협력업체";
                const leaveStatus = getUserLeaveStatus(worker.id, worker.name, annualLeaves, { excludeTodo: true });
                const hasLeave = Boolean(leaveStatus);
                const isLeaveToday = Boolean(leaveStatus?.isToday);

                return (
                  <button
                    key={worker.id}
                    onClick={() => onUserClick(worker)}
                    title={hasLeave ? `${worker.name} (${worker.title || ""}): ${leaveStatus.fullLabel}` : `${worker.name} (${worker.title || ""})`}
                    className={`min-h-[42px] sm:min-h-[44px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                      isDongwook
                        ? `border-emerald-400 bg-emerald-700 shadow-md ${
                            isLeaveToday ? "ring-2 ring-rose-500 animate-pulse" : ""
                          }`
                        : isLeaveToday
                        ? "border-rose-500 bg-slate-900 ring-2 ring-rose-400/80 animate-pulse text-white shadow-xs"
                        : hasLeave
                        ? "border-blue-400 dark:border-blue-500 bg-slate-900 text-white shadow-2xs"
                        : isPartner
                        ? "border-purple-300 dark:border-purple-800/80 bg-white dark:bg-slate-900 text-purple-900 dark:text-purple-200 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    }`}
                  >
                    {/* 좌측: 이름 구역 (39%) */}
                    <div className={`w-[39%] sm:w-[38%] flex items-center justify-center px-0.5 sm:px-1 text-center shrink-0 ${
                      isDongwook
                        ? "bg-emerald-800"
                        : isLeaveToday
                        ? "bg-rose-950/90"
                        : hasLeave
                        ? "bg-blue-950/90"
                        : isPartner
                        ? "bg-purple-50 dark:bg-purple-950/50"
                        : "bg-slate-100 dark:bg-slate-800"
                    }`}>
                      <span className={`font-black whitespace-nowrap leading-none ${
                        hasLeave
                          ? "text-[10px] sm:text-[12.5px] tracking-tighter"
                        : "text-xs sm:text-[13px] tracking-tight"
                      } ${
                        isDongwook
                          ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                          : isLeaveToday || hasLeave
                          ? "text-white font-black"
                          : "text-slate-950 dark:text-white font-black"
                      }`}>
                        {worker.name}
                      </span>
                    </div>

                    {/* 우측: 상태 구역 (61%) */}
                    <div className={`w-[61%] sm:w-[62%] flex flex-col justify-center items-center text-center px-1 sm:px-1.5 py-0.5 leading-tight ${
                      isDongwook
                        ? hasLeave
                          ? "bg-rose-600 text-white border-l-2 border-emerald-400"
                          : "bg-emerald-600 text-white border-l-2 border-emerald-400"
                        : isLeaveToday
                        ? "bg-rose-600 text-white border-l-2 border-rose-400"
                        : hasLeave
                        ? "bg-blue-600 text-white border-l-2 border-blue-400"
                        : isPartner
                        ? "bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 border-l border-purple-300 dark:border-purple-800"
                        : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700"
                    }`}>
                      {hasLeave ? (
                        leaveStatus.line2 ? (
                          <span className="flex flex-col items-center justify-center leading-tight">
                            <span className="text-[10px] sm:text-[11px] font-black whitespace-nowrap">{leaveStatus.line1}</span>
                            <span className="text-[9px] sm:text-[10px] font-black whitespace-nowrap text-amber-200 mt-0.5">{leaveStatus.line2}</span>
                          </span>
                        ) : (
                          <span className="text-[10.5px] sm:text-[11.5px] font-black whitespace-nowrap">
                            <span className="hidden sm:inline">{leaveStatus.displayBadge}</span>
                            <span className="sm:hidden">{leaveStatus.mobileBadge || leaveStatus.displayBadge}</span>
                          </span>
                        )
                      ) : isPartner ? (
                        <span className="text-[10.5px] sm:text-[11.5px] font-bold">협력</span>
                      ) : (
                        <span className="text-[10.5px] sm:text-[11.5px] font-bold">{worker.title || "선임"}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 🌟 작업자 이름 탭 시 뜨는 전용 모달 팝업창 */}
      {selectedUser && (
        <WorkerPinModal
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          annualLeaves={annualLeaves}
          activeIssues={activeIssues}
          urgentIssues={urgentIssues}
        />
      )}
    </div>
  );
};

export default WorkerLoginSection;
