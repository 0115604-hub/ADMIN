import React from "react";
import { Factory, Calendar, Cpu, Layers, Sparkles, Zap, ShieldAlert, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { ADMIN_USERS, PLANTS } from "../../context/AuthContext";
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
  // Extrusion specific workers from Samrangjin
  const isExtrusion = factoryBuildingTab === "extrusion";

  return (
    <div className="space-y-3">
      {/* Building Specific Info Banner */}
      <div className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs ${
        isExtrusion
          ? "bg-gradient-to-r from-teal-50 via-teal-100/50 to-emerald-50 dark:from-teal-950/40 dark:via-teal-900/30 dark:to-slate-900 border-teal-200 dark:border-teal-800"
          : "bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900 border-blue-200 dark:border-blue-800"
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-2 rounded-xl text-white shadow-xs shrink-0 ${
            isExtrusion ? "bg-teal-600" : "bg-blue-600"
          }`}>
            {isExtrusion ? <Cpu className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`font-black text-xs sm:text-sm tracking-tight ${
                isExtrusion ? "text-teal-900 dark:text-teal-200" : "text-blue-900 dark:text-blue-200"
              }`}>
                {isExtrusion ? "🏭 삼랑진공장 [압출동] 전용 모드" : "⚙️ 삼랑진 • 한림공장 [가공동] 전용 모드"}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                {isExtrusion ? "PCM 1호 • PCM 3호 • PVC • TPE" : "가공/조립/검사 라인"}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate mt-0.5">
              {isExtrusion
                ? "작업자 이름을 클릭하여 작업일보를 작성하거나 상단 [압출 작업일보] 버튼을 누르세요."
                : "작업자 이름을 클릭하여 일일 작업일지를 작성하고 결재를 진행하세요."}
            </p>
          </div>
        </div>

        {/* Extrusion Direct Quick Button */}
        {isExtrusion && onOpenExtrusionReport && (
          <button
            type="button"
            onClick={onOpenExtrusionReport}
            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-teal-200" />
            <span>압출 작업일보 바로 작성</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. FACTORY 1: 삼랑진공장 */}
      {/* ========================================================================= */}
      <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5 flex-wrap">
            <div className="p-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Factory className="w-3.5 h-3.5" />
            </div>
            <span className="tracking-wide">삼랑진공장 {isExtrusion ? "(압출동/품질/관리)" : "(가공동/품질/관리)"}</span>
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
            const isYucheol = worker.name === "설유철" || worker.assignedProcess?.includes("압출");
            const isPartner = worker.isPartner || worker.title === "협력업체";
            const leaveStatus = getUserLeaveStatus(worker.id, worker.name, annualLeaves, { excludeTodo: true });
            const hasLeave = Boolean(leaveStatus);
            const isLeaveToday = Boolean(leaveStatus?.isToday);

            // Highlight extrusion leader if extrusion tab
            const isHighlighted = isExtrusion ? (isYucheol || isMyeongjae) : isMyeongjae;

            return (
              <button
                key={worker.id}
                onClick={() => onUserClick(worker)}
                title={hasLeave ? `${worker.name} (${worker.title || ""}): ${leaveStatus.fullLabel}` : `${worker.name} (${worker.title || ""})`}
                className={`min-h-[42px] sm:min-h-[44px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                  isYucheol && isExtrusion
                    ? `border-teal-500 bg-teal-700 shadow-md ring-2 ring-teal-400/40 ${isLeaveToday ? "ring-rose-500 animate-pulse" : ""}`
                    : isMyeongjae
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
                  isYucheol && isExtrusion
                    ? "bg-teal-800"
                    : isMyeongjae
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
                    isYucheol && isExtrusion
                      ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                      : isMyeongjae
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
                  isYucheol && isExtrusion
                    ? hasLeave
                      ? "bg-rose-600 text-white border-l-2 border-teal-400"
                      : "bg-teal-600 text-white border-l-2 border-teal-400"
                    : isMyeongjae
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
                  ) : isYucheol && isExtrusion ? (
                    <span className="text-[10.5px] sm:text-[11.5px] font-black">압출조장</span>
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

      {/* ========================================================================= */}
      {/* 2. FACTORY 2: 한림공장 (가공동 모드이거나 전체일 때 강조) */}
      {/* ========================================================================= */}
      {(!isExtrusion || true) && (
        <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border space-y-2 shadow-2xs transition-all ${
          !isExtrusion
            ? "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800/80"
            : "bg-slate-50/40 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-800/60 opacity-90"
        }`}>
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
