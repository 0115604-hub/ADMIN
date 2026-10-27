import React from "react";
import {
  Calendar,
  Factory,
  CheckCircle2,
  Send,
  Zap,
  Copy,
  CheckCheck
} from "lucide-react";

export const OvertimeDailyInputTab = ({
  selectedDay,
  setSelectedDay,
  daysInMonth,
  getKoreanHolidayInfo,
  currentYear,
  currentMonthNum,
  getDayFullLabel,
  getDayLabel,
  selectedCompanyFilter,
  setSelectedCompanyFilter,
  cleanCompanyName,
  smartData,
  isWeekendDay,
  handleUnlockCompanyDayAttendance,
  handleApproveCompanyDayAttendance,
  handleSubmitCompanyDayAttendance,
  isSaving,
  filteredAttendanceWorkers = [],
  handleSetAllFilteredWorkersSameAsPrevDay,
  handleSetAllFilteredWorkersRegular,
  calculateWorkerDailyHours,
  handleOpenPersonnelCard,
  handleUpdateWorkerDayAttendance,
  handleCustomOtHours
}) => {
  return (
    <div className="space-y-4">
      {/* ⭐ Top Control Filter & Date Selector Bar */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 border-2 border-slate-700 shadow-xl text-white">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left Group: Date Selector & Company Filter Pills */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Date Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-black text-xs sm:text-sm text-white shrink-0">작성 대상 일자:</span>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="bg-slate-950 text-white font-black text-xs sm:text-sm border-2 border-cyan-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/40 rounded-xl px-3 py-1.5 cursor-pointer shadow-inner"
              >
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const hInfo = getKoreanHolidayInfo(d, currentYear, currentMonthNum);
                  return (
                    <option
                      key={d}
                      value={d}
                      className={`py-1 font-bold ${
                        hInfo.isHoliday
                          ? "bg-rose-950 text-rose-300 font-black"
                          : hInfo.isWeekend
                          ? "bg-purple-950 text-purple-200"
                          : "bg-slate-900 text-white"
                      }`}
                    >
                      {currentYear}년 {currentMonthNum}월 {d}일 ({getDayFullLabel(d)}){hInfo.isHoliday ? ` 🔴 [${hInfo.holidayName}]` : hInfo.isWeekend ? ` 🌙 [${hInfo.dayOfWeekStr}요특근]` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Plant / Company Filter Pills (삼랑진공장 & 한림공장 분리 체계) */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* 삼랑진공장 Group ((주)오륙, 유성) */}
              <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-amber-600/50 rounded-xl shadow-xs">
                <span className="px-2 py-0.5 rounded-lg bg-amber-950 text-amber-300 font-black text-xs border border-amber-700/60 flex items-center gap-1">
                  <Factory className="w-3 h-3 text-amber-400" />
                  <span>삼랑진</span>
                </span>
                {["오륙", "유성"].map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setSelectedCompanyFilter(comp)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      selectedCompanyFilter === comp
                        ? "bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300 scale-102"
                        : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700"
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>

              {/* 한림공장 Group ((주)조영산업, 한울, 부림텍) */}
              <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-emerald-600/50 rounded-xl shadow-xs">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 font-black text-xs border border-emerald-700/60 flex items-center gap-1">
                  <Factory className="w-3 h-3 text-emerald-400" />
                  <span>한림</span>
                </span>
                {["조영", "한울", "부림텍"].map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setSelectedCompanyFilter(comp)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      selectedCompanyFilter === comp
                        ? "bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-300 scale-102"
                        : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700"
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Group: 평일 작성자 전결 / 특근 5개사 개별 상신 바 */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {(() => {
              const currentComp = selectedCompanyFilter === "전체" ? "오륙" : selectedCompanyFilter;
              const approvalKey = `${cleanCompanyName(currentComp)}_${selectedDay}`;
              const approvalInfo = smartData?.companyApprovalStatus?.[approvalKey] || { status: "DRAFT" };
              const isApproved = approvalInfo.status === "APPROVED";
              const isSubmitted = approvalInfo.status === "SUBMITTED";
              const isWkDay = isWeekendDay(selectedDay);

              if (isApproved) {
                return (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-400/50 flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isWkDay
                          ? `✅ 특근 최종 승인 마감 (${approvalInfo.approvedBy || "대표이사"})`
                          : `✅ 평일 전결 완료 (${approvalInfo.approvedBy || "작성자 전결"})`}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={handleUnlockCompanyDayAttendance}
                      disabled={isSaving}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-black text-xs border border-slate-600 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                      title="마감을 해제하고 작성 중(DRAFT) 상태로 되돌립니다."
                    >
                      <span>🔓 마감 해제</span>
                    </button>
                  </div>
                );
              }

              if (isSubmitted) {
                return (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-400/50 flex items-center gap-1.5 shadow-sm animate-pulse">
                      <span>🟡 특근보고서 상신됨 (승인 대기)</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleApproveCompanyDayAttendance}
                      disabled={isSaving}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                      title="클릭 시 당일 특근을 최종 승인 완료(마감)합니다."
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>✅ 최종 승인</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleUnlockCompanyDayAttendance}
                      disabled={isSaving}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                      title="상신을 취소하고 수정을 계속합니다."
                    >
                      <span>↩️ 취소</span>
                    </button>
                  </div>
                );
              }

              // DRAFT: 작성 중
              return (
                <button
                  type="button"
                  onClick={handleSubmitCompanyDayAttendance}
                  disabled={isSaving}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0 ${
                    isWkDay
                      ? "bg-purple-500 hover:bg-purple-400 text-white"
                      : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                  }`}
                  title={
                    isWkDay
                      ? "해당 업체의 개별 특근보고서를 작성하여 전자결재 상신합니다."
                      : "평일 근태보고는 작성자 전결로 즉시 완료(마감) 처리됩니다."
                  }
                >
                  {isWkDay ? <Send className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>
                    {isWkDay
                      ? `📤 [${currentComp}] ${currentMonthNum}/${selectedDay}(${getDayLabel(selectedDay)}) 특근보고서 개별 상신`
                      : `✅ [${currentComp}] ${currentMonthNum}/${selectedDay}(${getDayLabel(selectedDay)}) 평일 근태 완료 (작성자 전결)`}
                  </span>
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Interactive Worker Attendance Table (2-Column Side-by-Side Grid) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 flex-wrap">
            <Zap className="w-4 h-4 text-cyan-500" />
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              [{selectedCompanyFilter === "전체" ? "오륙" : selectedCompanyFilter}] {currentMonthNum}월 {selectedDay}일 근태 등록 ({filteredAttendanceWorkers.length}명)
            </h3>
            {(() => {
              const hInfo = getKoreanHolidayInfo(selectedDay, currentYear, currentMonthNum);
              if (hInfo.isHoliday) {
                return (
                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-700/80 flex items-center gap-1 shadow-xs">
                    <span>🔴 법정공휴일 [{hInfo.holidayName}]</span>
                  </span>
                );
              }
              if (hInfo.isWeekend) {
                return (
                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-700/80 flex items-center gap-1 shadow-xs">
                    <span>🌙 주말 [{hInfo.dayOfWeekStr}요일] 특근일</span>
                  </span>
                );
              }
              return null;
            })()}
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleSetAllFilteredWorkersSameAsPrevDay}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer border border-indigo-500"
              title={`직전 평일과 동일한 근태를 ${currentMonthNum}월 ${selectedDay}일에 일괄 적용합니다`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>📋 전일과동일</span>
            </button>
            <button
              type="button"
              onClick={handleSetAllFilteredWorkersRegular}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer border ${
                isWeekendDay(selectedDay)
                  ? "bg-purple-600 hover:bg-purple-500 text-white border-purple-500"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500"
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>
                {isWeekendDay(selectedDay) ? "🌙 특근전체선택" : "🟢 출근전체선택"}
              </span>
            </button>
          </div>
        </div>

        {filteredAttendanceWorkers.length === 0 ? (
          <div className="py-10 text-center text-slate-400 font-bold">
            검색 조건과 일치하는 작업자가 없습니다.
          </div>
        ) : (
          (() => {
            const count = filteredAttendanceWorkers.length;
            const perCol = Math.ceil(count / 2);
            const columns = count > 1
              ? [filteredAttendanceWorkers.slice(0, perCol), filteredAttendanceWorkers.slice(perCol)]
              : [filteredAttendanceWorkers];

            return (
              <div className="p-2.5 sm:p-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                {columns.map((colWorkers, colIdx) => (
                  <div key={colIdx} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950/70 shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                          <th className="py-2 px-2 text-center w-9 text-slate-500 font-mono">No</th>
                          <th className="py-2 px-2.5 w-32">성명 / 직위</th>
                          <th className="py-2 px-2 text-center">{currentMonthNum}월 {selectedDay}일 근태</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40 text-xs">
                        {colWorkers.map((worker) => {
                          const currentVal = (worker.daily && (worker.daily[selectedDay] !== undefined ? worker.daily[selectedDay] : worker.daily[String(selectedDay)])) ?? worker[selectedDay] ?? worker[String(selectedDay)] ?? "";
                          const strVal = String(currentVal || "").trim();
                          const isWk = isWeekendDay(selectedDay);
                          const isUnselected = !isWk && (!strVal || strVal === "미입력" || strVal === "undefined" || strVal === "null");
                          const isOffWeekend = isWk && (!strVal || strVal === "미입력" || strVal === "-" || strVal === "휴무" || strVal === "undefined" || strVal === "null");
                          const { weekdayOt, weekendOt } = calculateWorkerDailyHours(currentVal);
                          const ot = weekdayOt + weekendOt;
                          const cleanWorkerName = worker.name ? worker.name.split(" ")[0].replace(/\([^)]*\)/g, "").trim() : "";

                          return (
                            <tr
                              key={`${cleanCompanyName(worker.company)}__${worker.name}__${worker.originalMatrixIndex}`}
                              className={`transition-colors ${
                                isUnselected
                                  ? "bg-amber-500/10 dark:bg-amber-950/30 hover:bg-amber-500/15 border-l-4 border-l-amber-500"
                                  : isWk && !isOffWeekend
                                  ? "bg-purple-500/10 dark:bg-purple-950/20 hover:bg-purple-500/15 border-l-4 border-l-purple-500"
                                  : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                              }`}
                            >
                              {/* No (회사별 순번) */}
                              <td className="py-1.5 px-2 text-center font-mono text-slate-400 text-[11px]">
                                {worker.companyNo || worker.no}
                              </td>

                              {/* 성명 / 직위 배지 / 인사카드 빠른 연동 */}
                              <td className="py-1.5 px-2.5 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPersonnelCard(worker, worker.originalMatrixIndex)}
                                    className="font-black text-xs text-slate-900 dark:text-white hover:text-cyan-500 hover:underline cursor-pointer text-left"
                                    title={`[인사카드 열기] ${worker.company} ${worker.dept} ${cleanWorkerName} ${worker.position || "사원"}`}
                                  >
                                    {cleanWorkerName}
                                  </button>
                                  {worker.position && (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                      worker.position.includes("책임") || worker.position.includes("팀장")
                                        ? "bg-purple-950/70 text-purple-300 border-purple-800"
                                        : worker.position.includes("선임") || worker.position.includes("반장") || worker.position.includes("조장")
                                        ? "bg-blue-950/70 text-blue-300 border-blue-800"
                                        : "bg-slate-800 text-slate-400 border-slate-700"
                                    }`}>
                                      {worker.position}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 근태 선택 항목 */}
                              <td className="py-1.5 px-2 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  {!isWk ? (
                                    /* 평일: 🟢 출근 / 🌴 연차 / ❌ 결근 / 미선택 */
                                    <button
                                      type="button"
                                      onClick={() => {
                                        let next = "정시";
                                        if (strVal === "정시" || strVal === "🟢" || strVal === "17" || strVal === "출근" || ot > 0 || strVal.includes("잔업") || strVal === "19" || strVal === "21" || strVal === "22") {
                                          next = "연차";
                                        } else if (strVal === "연차" || strVal.includes("연차")) {
                                          next = "결근";
                                        } else if (strVal === "결근" || strVal === "휴무" || strVal === "-" || strVal.includes("결근")) {
                                          next = "";
                                        } else {
                                          next = "정시";
                                        }
                                        handleUpdateWorkerDayAttendance(worker, next);
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        (strVal === "정시" || strVal === "🟢" || strVal === "17" || strVal === "출근" || ot > 0 || strVal.includes("잔업") || strVal === "19" || strVal === "21" || strVal === "22")
                                          ? "bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-400"
                                          : (strVal === "연차" || strVal.includes("연차"))
                                          ? "bg-sky-600 text-white font-black shadow-xs ring-1 ring-sky-400"
                                          : (strVal === "결근" || strVal === "휴무" || strVal === "-" || strVal.includes("결근"))
                                          ? "bg-rose-600 text-white font-black shadow-xs ring-1 ring-rose-400"
                                          : "bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-slate-700"
                                      }`}
                                    >
                                      {(strVal === "정시" || strVal === "🟢" || strVal === "17" || strVal === "출근" || ot > 0 || strVal.includes("잔업") || strVal === "19" || strVal === "21" || strVal === "22")
                                        ? "🟢 출근"
                                        : (strVal === "연차" || strVal.includes("연차"))
                                        ? "🌴 연차"
                                        : (strVal === "결근" || strVal === "휴무" || strVal === "-" || strVal.includes("결근"))
                                        ? "❌ 결근"
                                        : "미선택"}
                                    </button>
                                  ) : (
                                    /* 주말/공휴일: 🌙 특근 토글 */
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const isSpecial = strVal === "특근" || strVal === "주말특근" || strVal.includes("특근");
                                        handleUpdateWorkerDayAttendance(worker, isSpecial ? "" : "특근");
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        (strVal === "특근" || strVal === "주말특근" || strVal.includes("특근"))
                                          ? "bg-purple-600 text-white font-black shadow-xs ring-1 ring-purple-400"
                                          : "bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-slate-700"
                                      }`}
                                    >
                                      {(strVal === "특근" || strVal === "주말특근" || strVal.includes("특근")) ? "🌙 특근" : "휴무"}
                                    </button>
                                  )}

                                  {/* ⚡ 잔업 */}
                                  <div className="inline-flex rounded-lg shadow-xs">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        let next = "19";
                                        if (strVal === "19" || strVal === "19시") next = "21";
                                        else if (strVal === "21" || strVal === "21시") next = "22";
                                        else if (strVal === "22" || strVal === "22시" || ot > 0) next = isWk ? "특근" : "정시";
                                        handleUpdateWorkerDayAttendance(worker, next);
                                      }}
                                      className={`px-2.5 py-1 rounded-l-lg text-xs font-bold transition-all cursor-pointer ${
                                        ot > 0 || strVal.includes("잔업") || strVal === "19" || strVal === "21" || strVal === "22"
                                          ? "bg-amber-600 text-white font-black shadow-xs ring-1 ring-amber-400"
                                          : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 border-r-0"
                                      }`}
                                    >
                                      ⚡ {ot > 0 ? `+${ot}H` : "잔업"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCustomOtHours(worker)}
                                      title="잔업 시간 직접 입력"
                                      className={`px-1.5 py-1 rounded-r-lg text-[10px] font-bold transition-all cursor-pointer ${
                                        ot > 0 || strVal.includes("잔업") || strVal === "19" || strVal === "21" || strVal === "22"
                                          ? "bg-amber-700 hover:bg-amber-800 text-white border-l border-amber-500"
                                          : "bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-slate-700"
                                      }`}
                                    >
                                      ⏱️
                                    </button>
                                  </div>

                                  {/* 🌌 야간 토글 */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const isNight = strVal === "야간" || strVal.includes("야간");
                                      handleUpdateWorkerDayAttendance(worker, isNight ? (isWk ? "" : "정시") : "야간");
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      (strVal === "야간" || strVal.includes("야간"))
                                        ? "bg-indigo-600 text-white font-black shadow-xs ring-1 ring-indigo-400"
                                        : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                    }`}
                                  >
                                    🌌 야간
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};
