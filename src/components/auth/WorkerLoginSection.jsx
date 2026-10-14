import React, { useMemo } from "react";
import { Factory, Calendar, Building2, ChevronRight, UserCheck, ShieldCheck } from "lucide-react";
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
  onPinSubmit
}) => {
  // 1. 삼랑진공장 관리자 (개인 성함 관리자 9명)
  const samrangjinManagers = useMemo(() => {
    return (PLANTS[0]?.workers || []).filter(
      (w) => !w.isPartner && w.name !== "유성" && w.id !== "sam_ys"
    );
  }, []);

  // 2. 한림공장 관리자 (개인 성함 관리자 4명)
  const hallimManagers = useMemo(() => {
    return (PLANTS[1]?.workers || []).filter(
      (w) => !w.isPartner && w.name !== "부림텍" && w.name !== "한울" && w.id !== "hal_br" && w.id !== "hal_hu"
    );
  }, []);

  // 3. 협력업체 대표 (한울, 부림텍, 유성 대표이사 3명)
  const partnerRepresentatives = useMemo(() => {
    return [
      PLANTS[1]?.workers?.find((w) => w.name === "한울" || w.id === "hal_hu") || {
        id: "hal_hu",
        name: "한울",
        title: "대표이사",
        plant: "한림공장",
        company: "한울",
        assignedProcess: "외주가공",
        role: "OPERATOR",
        avatar: "한",
        pin: "11",
        isPartner: true
      },
      PLANTS[1]?.workers?.find((w) => w.name === "부림텍" || w.id === "hal_br") || {
        id: "hal_br",
        name: "부림텍",
        title: "대표이사",
        plant: "한림공장",
        company: "부림텍",
        assignedProcess: "외주가공",
        role: "OPERATOR",
        avatar: "부",
        pin: "11",
        isPartner: true
      },
      PLANTS[0]?.workers?.find((w) => w.name === "유성" || w.id === "sam_ys") || {
        id: "sam_ys",
        name: "유성",
        title: "대표이사",
        plant: "삼랑진공장",
        company: "유성",
        assignedProcess: "외주가공",
        role: "OPERATOR",
        avatar: "유",
        pin: "11",
        isPartner: true
      }
    ];
  }, []);

  // 실시간 관리자 휴가/일정 카운트
  const samLeaveCount = useMemo(() => {
    return samrangjinManagers.filter((w) => getUserLeaveStatus(w.id, w.name, annualLeaves, { excludeTodo: true })).length;
  }, [samrangjinManagers, annualLeaves]);

  const halLeaveCount = useMemo(() => {
    return hallimManagers.filter((w) => getUserLeaveStatus(w.id, w.name, annualLeaves, { excludeTodo: true })).length;
  }, [hallimManagers, annualLeaves]);

  return (
    <div id="worker-login-section-root" className="space-y-3 sm:space-y-3.5">
      {/* 🌟 관리자 & 협력업체 대표 로그인 섹션 헤더 안내 */}
      <div className="flex items-center justify-between pb-1 px-1 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">
            👔 공장 관리자 & 협력업체 대표 접속
          </span>
        </div>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
          ※ 개인 성함은 관리자 전용 • [한울·부림텍·유성]은 협력사 대표 전용
        </span>
      </div>

      {/* 1. 삼랑진공장 관리자 (9명: 이명재, 설유철, 윤경수, 이창엽, 전재율, 양인나, 유동길, 조인주, 이상기) */}
      <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5 flex-wrap">
            <div className="p-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Factory className="w-3.5 h-3.5" />
            </div>
            <span className="tracking-wide">삼랑진공장 관리자</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
              총괄 • 품질 • 설비 • 가공 • 근태
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
              samLeaveCount > 0
                ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs"
                : "bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            }`}>
              <Calendar className="w-2.5 h-2.5" />
              <span>일정등록 {samLeaveCount}명</span>
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            관리자 {samrangjinManagers.length}명
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 gap-1 sm:gap-1.5">
          {samrangjinManagers.map((worker) => {
            const isMyeongjae = worker.name === "이명재" || worker.assignedProcess === "총괄관리";
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

                {/* 우측: 직함/상태 구역 (61%) */}
                <div className={`w-[61%] sm:w-[62%] flex flex-col justify-center items-center text-center px-1 sm:px-1.5 py-0.5 leading-tight ${
                  isMyeongjae
                    ? hasLeave
                      ? "bg-rose-600 text-white border-l-2 border-amber-400"
                      : "bg-amber-600 text-white border-l-2 border-amber-400"
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

      {/* 2. 한림공장 관리자 (4명: 김동욱, 오상민, 정현규, TEST) */}
      <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 flex-wrap">
            <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Factory className="w-3.5 h-3.5" />
            </div>
            <span className="tracking-wide">한림공장 관리자</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              총괄 • 가공동 관리
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
              halLeaveCount > 0
                ? "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 shadow-2xs"
                : "bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            }`}>
              <Calendar className="w-2.5 h-2.5" />
              <span>일정등록 {halLeaveCount}명</span>
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            관리자 {hallimManagers.length}명
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 gap-1 sm:gap-1.5">
          {hallimManagers.map((worker) => {
            const isDongwook = worker.name === "김동욱" || worker.assignedProcess === "총괄관리";
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

                {/* 우측: 직함/상태 구역 (61%) */}
                <div className={`w-[61%] sm:w-[62%] flex flex-col justify-center items-center text-center px-1 sm:px-1.5 py-0.5 leading-tight ${
                  isDongwook
                    ? hasLeave
                      ? "bg-rose-600 text-white border-l-2 border-emerald-400"
                      : "bg-emerald-600 text-white border-l-2 border-emerald-400"
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

      {/* 3. 협력업체 대표 접속 (외주가공 총괄 관리: 한울 • 부림텍 • 유성) */}
      <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-slate-50/70 dark:bg-slate-800/50 border-2 border-purple-200/90 dark:border-purple-900/60 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black text-purple-700 dark:text-purple-300 flex items-center gap-1.5 flex-wrap">
            <div className="p-1 rounded-lg bg-purple-500/20 text-purple-700 dark:text-purple-300">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="tracking-wide">협력업체 대표 접속 (외주가공 총괄 관리)</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
              업체대표 3개사
            </span>
          </div>
          <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 hidden sm:inline">
            ※ 각 협력사 대표가 접속하여 소속 업체를 총괄 관리합니다
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {partnerRepresentatives.map((partner) => {
            const isHanulPartner = partner.name === "한울";
            const isBurimPartner = partner.name === "부림텍";

            const themeClasses = isHanulPartner
              ? "border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 hover:shadow-indigo-500/20 bg-gradient-to-r from-indigo-50/80 to-purple-50/50 dark:from-indigo-950/40 dark:to-purple-950/30"
              : isBurimPartner
              ? "border-teal-300 dark:border-teal-700 hover:border-teal-500 hover:shadow-teal-500/20 bg-gradient-to-r from-teal-50/80 to-emerald-50/50 dark:from-teal-950/40 dark:to-emerald-950/30"
              : "border-blue-300 dark:border-blue-700 hover:border-blue-500 hover:shadow-blue-500/20 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30";

            const badgeClasses = isHanulPartner
              ? "bg-indigo-600 text-white"
              : isBurimPartner
              ? "bg-teal-600 text-white"
              : "bg-blue-600 text-white";

            const roleDesc = isHanulPartner
              ? "한림 • 정산/품질경보/일보"
              : isBurimPartner
              ? "한림 • 생산/근태/업체관리"
              : "삼랑진 • 외주가공/근태관리";

            return (
              <button
                key={partner.id}
                type="button"
                onClick={() => onUserClick({ ...partner, isPartner: true, isFieldWorker: false })}
                className={`p-2.5 rounded-xl border-2 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-98 transition-all flex items-center justify-between gap-2.5 text-left cursor-pointer ${themeClasses}`}
                title={`${partner.name} 대표이사 접속`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${badgeClasses}`}>
                    {partner.avatar || partner.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-slate-900 dark:text-white truncate">
                        {partner.name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        대표이사
                      </span>
                    </div>
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold block truncate">
                      {roleDesc}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 🌟 작업자/관리자/대표 이름 탭 시 뜨는 전용 모달 팝업창 */}
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
