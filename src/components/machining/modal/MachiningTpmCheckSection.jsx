import React from "react";
import {
  Wrench,
  Check,
  AlertTriangle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import {
  MACHINING_TPM_MACHINES,
  MACHINING_TPM_CHECK_ITEMS
} from "../../../services/machiningWorkReportService";

export const MachiningTpmCheckSection = ({
  project,
  tpmChecks,
  tpmActionNote,
  setTpmActionNote,
  tpmSummary,
  handleSetAllTpmOk,
  handleToggleTpmCheck,
  handleProceedToReport
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 안내 배너 */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400 dark:border-amber-600 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-xs shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
              [4단계 필수] TPM 설비 및 치구 일상 점검표
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mt-0.5">
              {project} G/RUN 가공 작업 시작 전 6대 핵심 설비 및 치구의 일상점검을 완료해 주십시오. (총 42개 검사)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSetAllTpmOk}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>전체 양호(○)</span>
          </button>
        </div>
      </div>

      {/* TPM 42개 검사 매트릭스 테이블 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-b-2 border-slate-300 dark:border-slate-700">
                <th className="py-2.5 px-2 text-center w-12 font-black border-r border-slate-200 dark:border-slate-700">
                  순번
                </th>
                <th className="py-2.5 px-3 font-black border-r border-slate-200 dark:border-slate-700 min-w-[190px]">
                  설비별 점검 내용
                </th>
                <th className="py-2.5 px-2 text-center w-16 font-black border-r border-slate-200 dark:border-slate-700">
                  방법
                </th>
                {MACHINING_TPM_MACHINES.map((m) => (
                  <th
                    key={m.id}
                    className="py-2.5 px-1.5 text-center font-black text-[11px] border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-w-[85px]"
                  >
                    <span className="block leading-tight">{m.shortName}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {MACHINING_TPM_CHECK_ITEMS.map((item) => (
                <tr
                  key={item.no}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <td className="py-2 px-2 text-center font-black text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                    {item.no}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                    <div className="font-black text-slate-900 dark:text-white text-xs">{item.content}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                  </td>
                  <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.method}
                    </span>
                  </td>
                  {MACHINING_TPM_MACHINES.map((m) => {
                    const isOk = (tpmChecks[m.id]?.[item.no] || "OK") === "OK";
                    return (
                      <td
                        key={m.id}
                        className="py-1 px-1.5 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleTpmCheck(m.id, item.no)}
                          className={`w-full py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center gap-1 ${
                            isOk
                              ? "bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"
                              : "bg-rose-600 hover:bg-rose-700 text-white animate-pulse border border-rose-500 shadow-md"
                          }`}
                          title={`${m.name} - ${item.content} (탭하여 양호/이상 전환)`}
                        >
                          <span>{isOk ? "○" : "×"}</span>
                          <span className="text-[10.5px]">{isOk ? "양호" : "이상"}</span>
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

      {/* 이상 발생시 조치사항 입력란 & 보고 절차 */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/80 space-y-3">
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
              ✓ 현재 6대 설비 전 항목 양호 상태
            </span>
          )}
        </div>

        <textarea
          rows={2}
          value={tpmActionNote}
          onChange={(e) => setTpmActionNote(e.target.value)}
          placeholder="설비 이상(작동 불량, 칼날 마모, 비상정지 미작동, 절단면/사출면 뜯김 등) 발생 시 발견 내용 및 조치결과를 기록해 주십시오."
          className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
        />

        <div className="pt-2 border-t border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-300 font-bold space-y-1">
          <div>※ 이상 발생시 보고 및 조치 절차:</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 border border-amber-300 text-amber-900 dark:text-amber-200 font-black">
              1. 조장/반장 즉시 보고
            </div>
            <div className="p-2 rounded-xl bg-amber-200 dark:bg-amber-800/60 border border-amber-400 text-amber-950 dark:text-amber-100 font-black">
              2. 가공 담당자 현장 점검
            </div>
            <div className="p-2 rounded-xl bg-orange-200 dark:bg-orange-800/60 border border-orange-400 text-orange-950 dark:text-orange-100 font-black">
              3. 설비보전/수리의뢰
            </div>
            <div className="p-2 rounded-xl bg-amber-500 text-white border border-amber-600 font-black">
              4. 관리자 최종 승인
            </div>
          </div>
        </div>
      </div>

      {/* 하단 점검 완료 & 작업일보 작성 진행 버튼 바 */}
      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-amber-600 text-white">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white">
              점검 결과: 양호 {tpmSummary.okCount}건 / 이상 {tpmSummary.ngCount}건 (총 42개 검사)
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
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white text-xs sm:text-sm font-black shadow-md shadow-amber-600/30 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>TPM 점검 완료 ➔ 작업일보 작성 계속</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MachiningTpmCheckSection;
