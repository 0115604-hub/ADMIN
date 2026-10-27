import React from "react";
import {
  Wrench,
  Scissors,
  AlertTriangle,
  Clock,
  RotateCcw
} from "lucide-react";

/**
 * 🌟 F. 특기사항 및 설비 이상 조치 + 9BQC 칼날 수명 및 교체 관리 카드
 */
export const HanulReportBladeMaintenance = ({
  project,
  processId,
  subProcess,
  isBladeOverdue,
  totalCumulativeQty,
  BLADE_LIMIT = 50000,
  bladeLifePercent,
  isBladeTestMode,
  setIsBladeTestMode,
  bladeChangeTime,
  setBladeChangeTime,
  handleRecordBladeChangeNow,
  bladeResetInfo,
  handleClearBladeReset,
  machineTrouble,
  setMachineTrouble,
  notes,
  setNotes
}) => {
  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/80 pb-2">
        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
          <Wrench className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>5. 설비 조치 및 특기사항</span>
        </span>

        {project === "9BQC" ? (
          /* 🌟 9BQC 칼날교체알림 뱃지: 5만개 초과 시 점멸 (animate-pulse) */
          <div className="flex flex-wrap items-center gap-2">
            {isBladeOverdue ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-400 dark:ring-rose-500">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                ✂️🚨 칼날교체알림: 5만개 초과 즉시 교체 ({totalCumulativeQty.toLocaleString()} / 50,000 EA)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                ✂️ 칼날교체알림: 정상 ({totalCumulativeQty.toLocaleString()} / 50,000 EA)
              </span>
            )}
            {/* 테스트 모드 토글 뱃지 */}
            <button
              type="button"
              onClick={() => setIsBladeTestMode((prev) => !prev)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                isBladeTestMode
                  ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-300"
              }`}
              title="5만개 초과 점멸 상태 테스트"
            >
              🧪 {isBladeTestMode ? "테스트 해제" : "5만개 초과 테스트"}
            </button>
          </div>
        ) : (
          processId === "소재준비" &&
          subProcess === "정치절단" && (
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              ✂️ 칼날교체시간 기록 항목 지원
            </span>
          )
        )}
      </div>

      {/* 🌟 9BQC 칼날 수명 및 교체 관리 카드 */}
      {project === "9BQC" && (
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            isBladeOverdue
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600/70 ring-2 ring-rose-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
          }`}
        >
          {/* 상단 알림 헤더 */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                <Scissors className="w-4 h-4" />
              </span>
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>9BQC 칼날 수명 및 교체 알림</span>
                  {isBladeOverdue ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white animate-pulse">
                      ⚠️ 교체 시기 도래 (점멸 경고)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                      정상 가동중
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  권장 교체 주기:{" "}
                  <strong className="text-slate-800 dark:text-slate-200">50,000 EA</strong> 마다
                  칼날 교체 필수
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-black text-slate-900 dark:text-white">
                총 누적생산량:{" "}
                <span
                  className={
                    isBladeOverdue
                      ? "text-rose-600 dark:text-rose-400 text-sm font-black"
                      : "text-indigo-600 dark:text-indigo-400 font-black"
                  }
                >
                  {totalCumulativeQty.toLocaleString()}
                </span>{" "}
                / 50,000 EA
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {isBladeOverdue ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    🚨 {(totalCumulativeQty - BLADE_LIMIT).toLocaleString()} EA 초과 가동 중!
                  </span>
                ) : (
                  <span>잔여 수명: {(BLADE_LIMIT - totalCumulativeQty).toLocaleString()} EA</span>
                )}
              </div>
            </div>
          </div>

          {/* 수명 게이지 바 */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-500 ${
                isBladeOverdue
                  ? "bg-rose-600 animate-pulse"
                  : bladeLifePercent >= 80
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, bladeLifePercent)}%` }}
            />
          </div>

          {/* 5만개 초과 시 경고 배너 */}
          {isBladeOverdue && (
            <div className="p-2.5 mb-3 rounded-lg bg-rose-600 text-white text-xs font-bold flex items-center justify-between gap-2 shadow-xs animate-pulse">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
                <span>
                  [경고] 총 누적생산량이 50,000개를 초과했습니다. 절단면 직각도·외관 불량 예방을 위해 지금 즉시 칼날을 교체해 주십시오!
                </span>
              </div>
            </div>
          )}

          {/* 칼날 교체 시간 입력 및 즉시 교체 리셋 버튼 */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 items-end">
            <div className="sm:col-span-6">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>칼날교체시간 기록</span>
              </label>
              <input
                type="text"
                placeholder="예: 08:30 (1차 교체), 13:40 (2차 교체)"
                value={bladeChangeTime}
                onChange={(e) => setBladeChangeTime(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-6 flex items-center gap-2">
              <button
                type="button"
                onClick={handleRecordBladeChangeNow}
                className="flex-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                title="현재 시각을 칼날교체시간으로 기록하고 누적 절단 수량을 0으로 리셋합니다."
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>지금 교체 완료 (누적 0 리셋)</span>
              </button>
              {bladeResetInfo && (
                <button
                  type="button"
                  onClick={handleClearBladeReset}
                  className="px-2 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 text-xs font-semibold cursor-pointer"
                  title="리셋 취소 (이전 누적으로 복원)"
                >
                  취소
                </button>
              )}
            </div>
          </div>

          {bladeResetInfo && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
              ℹ️ 최근 교체 완료 기록: {bladeResetInfo.resetDate} {bladeResetInfo.resetTime} (작업자:{" "}
              {bladeResetInfo.worker || "작업자"}) 기준 이후 생산량 계산 중
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 9BQC가 아닌 다른 프로젝트의 정치절단일 때만 별도 칼날교체시간 표시 */}
        {project !== "9BQC" && processId === "소재준비" && subProcess === "정치절단" && (
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>칼날교체 시간 (Blade Change Time)</span>
            </label>
            <input
              type="text"
              placeholder="예: 08:30 (1차 교체), 13:40 (2차 교체)"
              value={bladeChangeTime}
              onChange={(e) => setBladeChangeTime(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* 설비 이상 조치사항 */}
        <div
          className={
            project !== "9BQC" && processId === "소재준비" && subProcess === "정치절단"
              ? ""
              : "sm:col-span-2"
          }
        >
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>설비 이상 조치사항</span>
          </label>
          <input
            type="text"
            placeholder="설비 이상 및 트러블 발생 시 내용 및 조치사항 기록"
            value={machineTrouble}
            onChange={(e) => setMachineTrouble(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 특기사항 및 건의사항 */}
      <div>
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
          특기 사항 및 건의 사항
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="칼날 교체, 금형 세척, 사출 압력 변동 조치, 부자재 입고 LOT 이상 등 특이사항을 상세히 기록해 주십시오."
          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
};

export default HanulReportBladeMaintenance;
