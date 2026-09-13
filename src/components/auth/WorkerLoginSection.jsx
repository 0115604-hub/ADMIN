import React from "react";
import { Factory, Calendar, ArrowRight, ArrowLeft } from "lucide-react";
import { ADMIN_USERS, PLANTS } from "../../context/AuthContext";
import { getUserLeaveStatus } from "../../services/annualLeaveService";

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
  onUserClick,
  onPinSubmit
}) => {
  return (
    <div>
      {errorMsg && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-shake">
          <span className="p-1 rounded-full bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200 text-[10px] font-black">!</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {!selectedUser ? (
        <div className="space-y-2.5 sm:space-y-3">
          {/* ========================================================================= */}
          {/* 1. FACTORY 1: 삼랑진공장 (이명재 그라데이션 강조) */}
          {/* ========================================================================= */}
          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5 flex-wrap">
                <div className="p-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Factory className="w-3.5 h-3.5" />
                </div>
                <span className="tracking-wide">삼랑진공장</span>
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

                    {/* 우측: 상태 구역 (61% - 여백 없이 맞닿는 분할 플레이트) */}
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

          {/* ========================================================================= */}
          {/* 2. FACTORY 2: 한림공장 (김동욱 그라데이션 강조) */}
          {/* ========================================================================= */}
          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 flex-wrap">
                <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Factory className="w-3.5 h-3.5" />
                </div>
                <span className="tracking-wide">한림공장</span>
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

                    {/* 우측: 상태 구역 (61% - 여백 없이 맞닿는 분할 플레이트) */}
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
      ) : (
        /* ========================================================================= */
        /* PIN Input Form View (작업자 탭 시 진입) */
        /* ========================================================================= */
        <form onSubmit={onPinSubmit} className="space-y-3.5 animate-fadeIn">
          {/* ⚡ 상단 초슬림 1줄 바: [좌측] 관리자 + [우측] 회사별 */}
          <div className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex items-center text-xs overflow-x-auto whitespace-nowrap scrollbar-none">
            {/* [왼쪽] 관리자근무 */}
            <div className="flex-1 flex items-center justify-start gap-1.5 min-w-0 shrink-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  managerLeaves?.length > 0 ? "bg-rose-400" : "bg-emerald-400"
                } opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  managerLeaves?.length > 0 ? "bg-rose-500" : "bg-emerald-500"
                }`}></span>
              </span>
              <span className="text-amber-500 dark:text-amber-400 text-xs shrink-0">⚡</span>

              {managerLeaves?.length > 0 ? (
                <div className="flex items-center gap-1 shrink-0">
                  {managerLeaves.map((m) => {
                    const ls = m.leaveStatus;
                    return (
                      <span
                        key={m.id || m.name}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-[10.5px] font-black text-rose-700 dark:text-rose-300 shadow-2xs shrink-0"
                      >
                        <span className="text-slate-900 dark:text-white">{m.name}</span>
                        <span className="px-1 py-0.2 rounded bg-rose-600 text-white text-[9.5px]">
                          {ls.line2 ? `${ls.line1}(${ls.line2})` : ls.displayBadge?.replace('\n', ' ') || ls.label}
                        </span>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                  <span>✓</span>
                  <span>전원 정상</span>
                </span>
              )}
            </div>

            {/* 중앙 구분선 */}
            <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 shrink-0 mx-2"></div>

            {/* [오른쪽] 회사별 근태 */}
            <div className="flex-1 flex items-center justify-start gap-1 min-w-0 shrink-0">
              <span className="text-blue-600 dark:text-blue-400 text-xs shrink-0">🏢</span>

              {companyAttendanceStats?.some((s) => s.absentCount > 0 || s.earlyLeaveCount > 0) ? (
                <div className="flex items-center gap-1 shrink-0">
                  {companyAttendanceStats
                    .filter((s) => s.absentCount > 0 || s.earlyLeaveCount > 0)
                    .map((stat) => {
                      const compName = stat.company;
                      const shortName = compName.replace("(주)", "");
                      const hasAbsent = stat.absentCount > 0;
                      const hasEarly = stat.earlyLeaveCount > 0;

                      return (
                        <div
                          key={compName}
                          title={`${compName}${hasAbsent ? ` | 결근: ${stat.absentList.map((a) => `${a.name}(${a.reason})`).join(", ")}` : ""}${hasEarly ? ` | 조퇴: ${stat.earlyLeaveList.map((a) => `${a.name}(${a.reason})`).join(", ")}` : ""}`}
                          className="px-1.5 py-0.5 rounded-md border border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 shadow-2xs animate-pulse flex items-center gap-1 text-[10px] font-black shrink-0"
                        >
                          <span className="text-slate-900 dark:text-white font-bold">{shortName}</span>
                          <div className="flex items-center gap-0.5">
                            {hasAbsent && <span className="px-1 rounded bg-rose-600 text-white text-[9px]">결{stat.absentCount}</span>}
                            {hasEarly && <span className="px-1 rounded bg-amber-600 text-white text-[9px]">조{stat.earlyLeaveCount}</span>}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                  <span>✓</span>
                  <span>전원 정상</span>
                </span>
              )}
            </div>
          </div>

          {/* ADMIN 사용자 선택 탭 (권태형 대표이사 / 최미영 전무) */}
          {selectedUser.role === "ADMIN" && (
            <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-1.5">
              {ADMIN_USERS.map((admin) => {
                const isSelected = selectedUser.name === admin.name;
                return (
                  <button
                    key={admin.id}
                    type="button"
                    onClick={() => setSelectedUser(admin)}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{admin.name === "권태형" ? "👑" : "💎"}</span>
                    <span>{admin.name} {admin.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 🌟 이름과 작업자변경 사이에 PIN 번호 입력창이 배치된 일체형 로그인 바 */}
          <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 dark:from-slate-800/90 dark:via-blue-950/40 dark:to-slate-800/90 border-2 border-blue-300 dark:border-blue-800/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
            {/* 1. 좌측: 이름 및 작업자 정보 */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 w-full sm:w-auto justify-start">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl text-white flex items-center justify-center font-black text-base sm:text-lg shadow-md shrink-0 ${
                selectedUser.role === "ADMIN"
                  ? selectedUser.name === "최미영" ? "bg-indigo-600 ring-2 ring-indigo-400/40" : "bg-blue-600 ring-2 ring-blue-400/40"
                  : selectedUser.plant === "한림공장"
                  ? "bg-emerald-600 ring-2 ring-emerald-400/40"
                  : "bg-amber-500 ring-2 ring-amber-400/40"
              }`}>
                {selectedUser.avatar}
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white truncate">
                  {selectedUser.name} {selectedUser.role === "ADMIN" ? selectedUser.title : ""}
                </h4>
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 truncate block">
                  {selectedUser.role === "ADMIN" ? `최고 관리자` : `${selectedUser.plant} • ${selectedUser.title || "작업자"}`}
                </span>
              </div>
            </div>

            {/* 2. 중앙: 이름과 작업자변경 사이의 PIN 번호 입력창 + 접속 버튼 + 자동로그인 옵션 */}
            <div className="flex-1 w-full sm:max-w-xs flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 w-full">
                <div className="relative flex-1">
                  <input
                    id="worker-pin-input"
                    type="password"
                    autoFocus
                    placeholder={selectedUser.role === "ADMIN" ? "관리자 PIN" : "PIN 번호 입력"}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border-2 border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-base font-black text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                >
                  <span>접속</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-[10.5px] font-medium text-slate-500 dark:text-slate-400 select-none px-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>로그인 상태 유지 (개인폰 전용 / 공용기기 해제)</span>
              </label>
            </div>

            {/* 3. 우측: 작업자 변경 버튼 */}
            <div className="shrink-0 w-full sm:w-auto flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="w-full sm:w-auto px-3 py-2 sm:py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>작업자 변경</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
