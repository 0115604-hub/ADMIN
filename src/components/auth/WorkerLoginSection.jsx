import React from "react";
import { Factory, Calendar, Cpu, Building2, Users } from "lucide-react";
import { PLANTS } from "../../context/AuthContext";
import { getUserLeaveStatus } from "../../services/annualLeaveService";
import { WorkerPinModal } from "./WorkerPinModal";

export const WorkerLoginSection = ({
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
  onOpenExtrusionModal,
  onOpenMachiningModal,
  onOpenHanulModal,
  onOpenBulimtechModal,
  onOpenYuseongModal,
  onOpenJoyoungModal,
  extrusionWorkersCount = 11,
  machiningWorkersCount = 0,
  hanulWorkersCount = 0,
  bulimtechWorkersCount = 0,
  yuseongWorkersCount = 0,
  joyoungWorkersCount = 0
}) => {
  const totalFieldWorkersCount =
    extrusionWorkersCount +
    machiningWorkersCount +
    hanulWorkersCount +
    bulimtechWorkersCount +
    yuseongWorkersCount +
    joyoungWorkersCount;

  return (
    <div id="worker-login-section-root" className="space-y-2.5 sm:space-y-3">
      {/* 🌟 0. 현장작업자 전용 빠른 로그인 포털 (공장동 및 가공/협력업체별) */}
      <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-indigo-500/10 dark:bg-slate-800/60 border-2 border-dashed border-teal-500/40 dark:border-teal-600/40 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
            <div className="p-1 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="tracking-wide">현장작업자 전용 로그인 (공장동 • 가공/협력업체)</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
            총 {totalFieldWorkersCount}명
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
          {/* 1. 압출동 */}
          <button
            type="button"
            onClick={onOpenExtrusionModal}
            className="p-2 sm:p-2.5 rounded-xl border-2 border-teal-500/50 bg-gradient-to-br from-teal-500/15 to-emerald-500/15 hover:from-teal-500/25 hover:to-emerald-500/25 dark:bg-slate-800/90 text-left transition-all active:scale-95 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[52px]"
          >
            <div className="flex items-center justify-between gap-1">
              <Cpu className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-teal-600 text-white">
                {extrusionWorkersCount}명
              </span>
            </div>
            <div className="font-black text-xs text-slate-900 dark:text-white truncate">
              압출동
            </div>
            <span className="text-[9.5px] text-teal-700 dark:text-teal-300 font-semibold truncate">
              삼랑진공장
            </span>
          </button>

          {/* 2. 가공동 */}
          <button
            type="button"
            onClick={onOpenMachiningModal}
            className="p-2 sm:p-2.5 rounded-xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/15 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 dark:bg-slate-800/90 text-left transition-all active:scale-95 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[52px]"
          >
            <div className="flex items-center justify-between gap-1">
              <Factory className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-amber-600 text-white">
                {machiningWorkersCount}명
              </span>
            </div>
            <div className="font-black text-xs text-slate-900 dark:text-white truncate">
              가공동
            </div>
            <span className="text-[9.5px] text-amber-700 dark:text-amber-300 font-semibold truncate">
              삼랑진공장
            </span>
          </button>

          {/* 3. 한울 */}
          <button
            type="button"
            onClick={onOpenHanulModal}
            className="p-2 sm:p-2.5 rounded-xl border-2 border-indigo-500/50 bg-gradient-to-br from-indigo-500/15 to-purple-500/15 hover:from-indigo-500/25 hover:to-purple-500/25 dark:bg-slate-800/90 text-left transition-all active:scale-95 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[52px]"
          >
            <div className="flex items-center justify-between gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-indigo-600 text-white">
                {hanulWorkersCount}명
              </span>
            </div>
            <div className="font-black text-xs text-slate-900 dark:text-white truncate">
              (주)한울
            </div>
            <span className="text-[9.5px] text-indigo-700 dark:text-indigo-300 font-semibold truncate">
              한림공장
            </span>
          </button>

          {/* 4. 부림텍 */}
          <button
            type="button"
            onClick={onOpenBulimtechModal}
            className="p-2 sm:p-2.5 rounded-xl border-2 border-teal-500/50 bg-gradient-to-br from-teal-500/15 to-cyan-500/15 hover:from-teal-500/25 hover:to-cyan-500/25 dark:bg-slate-800/90 text-left transition-all active:scale-95 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[52px]"
          >
            <div className="flex items-center justify-between gap-1">
              <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-teal-600 text-white">
                {bulimtechWorkersCount}명
              </span>
            </div>
            <div className="font-black text-xs text-slate-900 dark:text-white truncate">
              (주)부림텍
            </div>
            <span className="text-[9.5px] text-teal-700 dark:text-teal-300 font-semibold truncate">
              한림공장
            </span>
          </button>

          {/* 5. 유성 */}
          <button
            type="button"
            onClick={onOpenYuseongModal}
            className="p-2 sm:p-2.5 rounded-xl border-2 border-blue-500/50 bg-gradient-to-br from-blue-500/15 to-indigo-500/15 hover:from-blue-500/25 hover:to-indigo-500/25 dark:bg-slate-800/90 text-left transition-all active:scale-95 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[52px]"
          >
            <div className="flex items-center justify-between gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-blue-600 text-white">
                {yuseongWorkersCount}명
              </span>
            </div>
            <div className="font-black text-xs text-slate-900 dark:text-white truncate">
              (주)유성
            </div>
            <span className="text-[9.5px] text-blue-700 dark:text-blue-300 font-semibold truncate">
              삼랑진공장
            </span>
          </button>

          {/* 6. 조영 */}
          <button
            type="button"
            onClick={onOpenJoyoungModal}
            className="p-2 sm:p-2.5 rounded-xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-500/15 to-green-500/15 hover:from-emerald-500/25 hover:to-green-500/25 dark:bg-slate-800/90 text-left transition-all active:scale-95 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[52px]"
          >
            <div className="flex items-center justify-between gap-1">
              <Factory className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-emerald-600 text-white">
                {joyoungWorkersCount}명
              </span>
            </div>
            <div className="font-black text-xs text-slate-900 dark:text-white truncate">
              (주)조영
            </div>
            <span className="text-[9.5px] text-emerald-700 dark:text-emerald-300 font-semibold truncate">
              한림공장
            </span>
          </button>
        </div>
      </div>
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
                    <span className="text-[10.5px] sm:text-[11.5px] font-bold">
                      {worker.title
                        ? worker.title
                        : worker.assignedProcess === "품질관리"
                        ? "품질"
                        : worker.assignedProcess
                        ? worker.assignedProcess.slice(0, 4)
                        : ""}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 한림공장 (가공/협력업체) */}
      <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 flex-wrap">
            <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Factory className="w-3.5 h-3.5" />
            </div>
            <span className="tracking-wide">한림공장 (가공/협력업체)</span>
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
                    <span className="text-[10.5px] sm:text-[11.5px] font-bold">
                      {worker.title
                        ? worker.title
                        : worker.assignedProcess === "품질관리"
                        ? "품질"
                        : worker.assignedProcess
                        ? worker.assignedProcess.slice(0, 4)
                        : ""}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

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
