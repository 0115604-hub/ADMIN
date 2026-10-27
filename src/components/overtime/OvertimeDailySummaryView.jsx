import React from "react";
import { Calendar, Factory } from "lucide-react";

export const OvertimeDailySummaryView = ({
  currentMonthNum,
  selectedDay,
  setSelectedDay,
  daysInMonth,
  getKoreanHolidayInfo,
  currentYear,
  getDayFullLabel,
  dailySummary = {},
  handleSelectCompanyAttendanceTable
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-cyan-600" />
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              {currentMonthNum}월 {selectedDay}일 협력사별 일일 근태 현황표
            </h3>
          </div>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(Number(e.target.value))}
            className="bg-slate-950 text-white font-black text-xs sm:text-sm border-2 border-slate-600 rounded-xl px-3 py-1.5 cursor-pointer"
          >
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const hInfo = getKoreanHolidayInfo(d, currentYear, currentMonthNum);
              return (
                <option key={d} value={d} className="bg-slate-900 text-white font-bold">
                  {currentMonthNum}월 {d}일 ({getDayFullLabel(d)}){hInfo.isHoliday ? ` 🔴 [${hInfo.holidayName}]` : hInfo.isWeekend ? ` 🌙 [${hInfo.dayOfWeekStr}요특근]` : ""}
                </option>
              );
            })}
          </select>
        </div>

        {/* 5 Companies Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black">
                <th className="p-3">구분 (소속업체)</th>
                <th className="p-3 text-center">총 배속인원</th>
                <th className="p-3 text-center">당일 출근인원</th>
                <th className="p-3 text-center">🟢 정시(8H)</th>
                <th className="p-3 text-center">🟡 19시(+2H)</th>
                <th className="p-3 text-center">🟠 21시(+4H)</th>
                <th className="p-3 text-center">🔴 22시(+5H)</th>
                <th className="p-3 text-center">🌙 특근/야간</th>
                <th className="p-3 text-center">당일 잔업합계(H)</th>
                <th className="p-3 text-center">당일 총투입공수(H)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {(() => {
                const samBreakdown = ["오륙", "유성"].map((c) => dailySummary.companyBreakdown?.[c] || {});
                const samTotal = samBreakdown.reduce((s, r) => s + (r.total || 0), 0);
                const samAttended = samBreakdown.reduce((s, r) => s + (r.attended || 0), 0);
                const samReg = samBreakdown.reduce((s, r) => s + (r.regular || 0), 0);
                const samOt19 = samBreakdown.reduce((s, r) => s + (r.ot19 || 0), 0);
                const samOt21 = samBreakdown.reduce((s, r) => s + (r.ot21 || 0), 0);
                const samOt22 = samBreakdown.reduce((s, r) => s + (r.ot22 || 0), 0);
                const samNight = samBreakdown.reduce((s, r) => s + (r.specialNight || 0), 0);
                const samOtHours = samBreakdown.reduce((s, r) => s + (r.otHours || 0), 0);
                const samTotalHours = samBreakdown.reduce((s, r) => s + (r.totalHours || 0), 0);

                const halBreakdown = ["조영", "한울", "부림텍"].map((c) => dailySummary.companyBreakdown?.[c] || {});
                const halTotal = halBreakdown.reduce((s, r) => s + (r.total || 0), 0);
                const halAttended = halBreakdown.reduce((s, r) => s + (r.attended || 0), 0);
                const halReg = halBreakdown.reduce((s, r) => s + (r.regular || 0), 0);
                const halOt19 = halBreakdown.reduce((s, r) => s + (r.ot19 || 0), 0);
                const halOt21 = halBreakdown.reduce((s, r) => s + (r.ot21 || 0), 0);
                const halOt22 = halBreakdown.reduce((s, r) => s + (r.ot22 || 0), 0);
                const halNight = halBreakdown.reduce((s, r) => s + (r.specialNight || 0), 0);
                const halOtHours = halBreakdown.reduce((s, r) => s + (r.otHours || 0), 0);
                const halTotalHours = halBreakdown.reduce((s, r) => s + (r.totalHours || 0), 0);

                return (
                  <>
                    {/* 삼랑진공장 Group ((주)오륙, 유성) */}
                    <tr className="bg-amber-950/40 text-amber-300 font-black border-y border-amber-800/60">
                      <td colSpan={10} className="py-2 px-3 flex items-center gap-1.5 text-xs">
                        <Factory className="w-3.5 h-3.5 text-amber-400" />
                        <span>🏭 삼랑진공장 소속 협력업체</span>
                      </td>
                    </tr>
                    {["오륙", "유성"].map((comp) => {
                      const row = dailySummary.companyBreakdown?.[comp] || {};
                      return (
                        <tr
                          key={comp}
                          onClick={() => handleSelectCompanyAttendanceTable(comp)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                          title={`탭하면 [${comp}] 근태 선택 테이블로 즉시 이동합니다`}
                        >
                          <td className="p-3 font-black text-slate-900 dark:text-white flex items-center gap-2 pl-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            <span>{comp}</span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-600 dark:text-slate-300">{row.total || 0}명</td>
                          <td className="p-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{row.attended || 0}명</td>
                          <td className="p-3 text-center font-mono">{row.regular || 0}명</td>
                          <td className="p-3 text-center font-mono text-amber-600">{row.ot19 || 0}명</td>
                          <td className="p-3 text-center font-mono text-orange-600">{row.ot21 || 0}명</td>
                          <td className="p-3 text-center font-mono text-rose-600">{row.ot22 || 0}명</td>
                          <td className="p-3 text-center font-mono text-purple-600">{row.specialNight || 0}명</td>
                          <td className="p-3 text-center font-mono font-black text-amber-600 dark:text-amber-400">+{row.otHours || 0} H</td>
                          <td className="p-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400">{row.totalHours || 0} H</td>
                        </tr>
                      );
                    })}
                    {/* 📊 삼랑진공장 취합 소계 */}
                    <tr className="bg-amber-950/60 text-amber-200 font-black border-y border-amber-700/60">
                      <td className="p-2.5 font-black text-amber-300 flex items-center gap-1.5 pl-6">
                        <span>📊 삼랑진공장 취합 소계</span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold">{samTotal}명</td>
                      <td className="p-2.5 text-center font-mono font-black text-emerald-400">{samAttended}명</td>
                      <td className="p-2.5 text-center font-mono">{samReg}명</td>
                      <td className="p-2.5 text-center font-mono text-amber-300">{samOt19}명</td>
                      <td className="p-2.5 text-center font-mono text-orange-300">{samOt21}명</td>
                      <td className="p-2.5 text-center font-mono text-rose-300">{samOt22}명</td>
                      <td className="p-2.5 text-center font-mono text-purple-300">{samNight}명</td>
                      <td className="p-2.5 text-center font-mono font-black text-amber-300">+{samOtHours} H</td>
                      <td className="p-2.5 text-center font-mono font-black text-cyan-300">{samTotalHours} H</td>
                    </tr>

                    {/* 한림공장 Group ((주)조영산업, 한울, 부림텍) */}
                    <tr className="bg-emerald-950/40 text-emerald-300 font-black border-y border-emerald-800/60">
                      <td colSpan={10} className="py-2 px-3 flex items-center gap-1.5 text-xs">
                        <Factory className="w-3.5 h-3.5 text-emerald-400" />
                        <span>🏭 한림공장 소속 협력업체</span>
                      </td>
                    </tr>
                    {["조영", "한울", "부림텍"].map((comp) => {
                      const row = dailySummary.companyBreakdown?.[comp] || {};
                      return (
                        <tr
                          key={comp}
                          onClick={() => handleSelectCompanyAttendanceTable(comp)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                          title={`탭하면 [${comp}] 근태 선택 테이블로 즉시 이동합니다`}
                        >
                          <td className="p-3 font-black text-slate-900 dark:text-white flex items-center gap-2 pl-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>{comp}</span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-600 dark:text-slate-300">{row.total || 0}명</td>
                          <td className="p-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{row.attended || 0}명</td>
                          <td className="p-3 text-center font-mono">{row.regular || 0}명</td>
                          <td className="p-3 text-center font-mono text-amber-600">{row.ot19 || 0}명</td>
                          <td className="p-3 text-center font-mono text-orange-600">{row.ot21 || 0}명</td>
                          <td className="p-3 text-center font-mono text-rose-600">{row.ot22 || 0}명</td>
                          <td className="p-3 text-center font-mono text-purple-600">{row.specialNight || 0}명</td>
                          <td className="p-3 text-center font-mono font-black text-amber-600 dark:text-amber-400">+{row.otHours || 0} H</td>
                          <td className="p-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400">{row.totalHours || 0} H</td>
                        </tr>
                      );
                    })}
                    {/* 📊 한림공장 취합 소계 */}
                    <tr className="bg-emerald-950/60 text-emerald-200 font-black border-y border-emerald-700/60">
                      <td className="p-2.5 font-black text-emerald-300 flex items-center gap-1.5 pl-6">
                        <span>📊 한림공장 취합 소계</span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold">{halTotal}명</td>
                      <td className="p-2.5 text-center font-mono font-black text-emerald-400">{halAttended}명</td>
                      <td className="p-2.5 text-center font-mono">{halReg}명</td>
                      <td className="p-2.5 text-center font-mono text-amber-300">{halOt19}명</td>
                      <td className="p-2.5 text-center font-mono text-orange-300">{halOt21}명</td>
                      <td className="p-2.5 text-center font-mono text-rose-300">{halOt22}명</td>
                      <td className="p-2.5 text-center font-mono text-purple-300">{halNight}명</td>
                      <td className="p-2.5 text-center font-mono font-black text-amber-300">+{halOtHours} H</td>
                      <td className="p-2.5 text-center font-mono font-black text-cyan-300">{halTotalHours} H</td>
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
