import React from "react";
import { Wrench, AlertTriangle, CheckCircle2, Check, ArrowRight } from "lucide-react";
import {
  YUSEONG_TPM_MACHINES,
  YUSEONG_TPM_CHECK_ITEMS
} from "../../../services/yuseongWorkReportService";

export const YuseongTpmPanel = ({
  tpmChecks,
  tpmSummary,
  tpmActionNote,
  setTpmActionNote,
  handleToggleTpmCheck,
  handleSetAllTpmOk,
  handleProceedToReport
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-black text-xs sm:text-sm text-indigo-950 dark:text-indigo-200">
            4단계: (주)유성 TPM 설비일상점검 체크리스트 (5대 설비)
          </span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400">
          작업 개시 전 설비의 안전센서, 비상정지, 칼날 마모, 누유/누기 상태를 확인하십시오.
        </p>
      </div>

      {/* 5대 설비 x 7대 항목 점검표 */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3 text-center w-12">No</th>
                <th className="py-2.5 px-3">점검 항목</th>
                {YUSEONG_TPM_MACHINES.map((m) => (
                  <th key={m.id} className="py-2.5 px-2 text-center whitespace-nowrap">
                    <div className="font-black">{m.name}</div>
                    <div className="text-[9.5px] font-normal text-slate-400">{m.type}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {YUSEONG_TPM_CHECK_ITEMS.map((item) => (
                <tr key={item.no} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2 px-2 text-center font-mono font-bold text-slate-400">
                    {item.no}
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                    {item.content}
                  </td>
                  {YUSEONG_TPM_MACHINES.map((m) => {
                    const isOk = (tpmChecks[m.id]?.[item.no] || "OK") === "OK";
                    return (
                      <td key={m.id} className="py-1 px-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleTpmCheck(m.id, item.no)}
                          className={`w-full py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center gap-1 ${
                            isOk
                              ? "bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"
                              : "bg-rose-600 hover:bg-rose-700 text-white animate-pulse border border-rose-500 shadow-md"
                          }`}
                          title={`${m.name} - ${item.content} (탭하여 양호/이상 전환)`}
                        >
                          <span>{isOk ? "○" : "×"}</span>
                          <span className="text-[10px]">{isOk ? "양호" : "이상"}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 이상 발생시 조치사항 입력란 */}
      <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
              이상 발생시 조치사항 (Abnormality Action Note)
            </span>
          </div>
          {tpmSummary.ngCount > 0 ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white animate-pulse">
              🚨 이상 {tpmSummary.ngCount}건 발생 - 조치 보고 필수
            </span>
          ) : (
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              ✓ 5대 설비 전 항목 양호 상태
            </span>
          )}
        </div>

        <textarea
          rows={2}
          value={tpmActionNote}
          onChange={(e) => setTpmActionNote(e.target.value)}
          placeholder="설비 이상(작동 불량, 칼날 마모, 비상정지 미작동 등) 발생 시 발견 내용 및 조치결과를 기록해 주십시오."
          className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
        />
      </div>

      {/* 진행 바 */}
      <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-indigo-600 text-white">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white">
              점검 결과: 양호 {tpmSummary.okCount}건 / 이상 {tpmSummary.ngCount}건 (총 35개 검사)
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              TPM 설비일상점검 완료 후 [작업일보 작성 계속] 버튼을 눌러 일보를 작성하십시오.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleSetAllTpmOk}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>전체 양호(○)</span>
          </button>
          <button
            type="button"
            onClick={handleProceedToReport}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-600/30 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>TPM 점검 완료 ➔ 작업일보 작성 계속</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
