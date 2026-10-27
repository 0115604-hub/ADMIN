import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Check,
  ArrowRight
} from "lucide-react";
import {
  HANUL_TPM_MACHINES,
  HANUL_TPM_CHECK_ITEMS
} from "../../services/hanulWorkReportService";
import { getWorkLogText } from "../../services/workLogI18nService";

/**
 * 🌟 STEP 1: 설비일상 점검 시트 (TPM 자주보전 7대 항목 × 6대 설비 점검 패널)
 */
export const HanulReportTpmPanel = ({
  currentLang,
  tpmI18n,
  date,
  customWorker,
  worker,
  tpmChecks,
  tpmSummary,
  tpmActionNote,
  setTpmActionNote,
  handleSetMachineAllOk,
  handleToggleTpmCheck,
  handleSetAllTpmOk,
  handleProceedToReport
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 서식 메인 헤더 박스: (주)오룩 설비일상 점검 시트 */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border border-indigo-900/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-black tracking-wider">
                  ㈜오룩 삼랑진공장
                </span>
                <h3 className="text-base sm:text-xl font-black tracking-tight">
                  {getWorkLogText("tpm_sheet_title", currentLang)}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/40">
                  개정일자: 2024.10.01
                </span>
              </div>
              <p className="text-[11px] text-indigo-200 mt-0.5">
                {getWorkLogText("tpm_sheet_subtitle", currentLang)}
              </p>
            </div>
          </div>

          {/* 결재 정보 블록 (서식 우측 상단 박스 100% 재현) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-white/10 p-2 rounded-xl text-center text-xs border border-white/15 shrink-0">
            <div className="bg-slate-900/60 p-1.5 rounded-lg">
              <span className="text-[10px] text-indigo-300 block">라인명</span>
              <strong className="text-xs text-white">9BQC 소재준비</strong>
            </div>
            <div className="bg-slate-900/60 p-1.5 rounded-lg">
              <span className="text-[10px] text-indigo-300 block">점검일자</span>
              <strong className="text-xs text-white">{date}</strong>
            </div>
            <div className="bg-slate-900/60 p-1.5 rounded-lg">
              <span className="text-[10px] text-indigo-300 block">점검자(작업자)</span>
              <strong className="text-xs text-emerald-300 truncate block">
                {customWorker.trim() || worker}
              </strong>
            </div>
            <div className="bg-slate-900/60 p-1.5 rounded-lg">
              <span className="text-[10px] text-indigo-300 block">관리자 확인</span>
              <strong className="text-xs text-indigo-200">확인 대기</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 6대 설비 현황 카드 바 (사진 안내 및 원클릭 설비별 일괄체크) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {HANUL_TPM_MACHINES.map((m) => {
          const mChecks = tpmChecks[m.id] || {};
          const isAllOk = HANUL_TPM_CHECK_ITEMS.every((it) => (mChecks[it.no] || "OK") === "OK");
          const ngCount = HANUL_TPM_CHECK_ITEMS.filter((it) => mChecks[it.no] === "NG").length;
          const machMeta = tpmI18n.machines[m.id] || { fullName: m.name, shortName: m.shortName };

          return (
            <div
              key={m.id}
              className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                !isAllOk
                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 shadow-xs"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-base">{m.icon}</span>
                {isAllOk ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    7 {tpmI18n.statusOk}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white animate-pulse">
                    {tpmI18n.statusNg} {ngCount}
                  </span>
                )}
              </div>
              <div className="font-black text-xs text-slate-900 dark:text-white truncate mb-2" title={machMeta.fullName}>
                {machMeta.fullName}
              </div>
              <button
                type="button"
                onClick={() => handleSetMachineAllOk(m.id)}
                className="w-full py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-950 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer active:scale-95"
              >
                ✓ {tpmI18n.machineOk}
              </button>
            </div>
          );
        })}
      </div>

      {/* 🌟 설비일상 점검 시트 본문 테이블 (서식 매트릭스 100% 일치) */}
      <div className="rounded-2xl border-2 border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto mobile-pan-free">
          <table className="w-full text-xs text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-b-2 border-slate-300 dark:border-slate-700">
                <th className="py-2.5 px-2 text-center w-12 font-black border-r border-slate-200 dark:border-slate-700">
                  순번
                </th>
                <th className="py-2.5 px-3 font-black border-r border-slate-200 dark:border-slate-700 min-w-[190px]">
                  {tpmI18n.checkItemsTitle}
                </th>
                <th className="py-2.5 px-2 text-center w-16 font-black border-r border-slate-200 dark:border-slate-700">
                  방법
                </th>
                {HANUL_TPM_MACHINES.map((m) => {
                  const transMach = tpmI18n.machines[m.id]?.shortName || m.shortName;
                  return (
                    <th
                      key={m.id}
                      className="py-2.5 px-1.5 text-center font-black text-[11px] border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-w-[85px]"
                    >
                      <span className="block leading-tight truncate">{transMach}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {HANUL_TPM_CHECK_ITEMS.map((item) => {
                const transItem = tpmI18n.items[item.no] || item.content;
                return (
                  <tr
                    key={item.no}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <td className="py-2 px-2 text-center font-black text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                      {item.no}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                      <div className="font-black text-slate-900 dark:text-white text-xs">
                        {transItem}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.method}
                      </span>
                    </td>
                    {HANUL_TPM_MACHINES.map((m) => {
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
                            title={`${m.name} - ${transItem}`}
                          >
                            <span>{isOk ? "○" : "×"}</span>
                            <span className="text-[10.5px]">
                              {isOk ? tpmI18n.statusOk : tpmI18n.statusNg}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 이상 발생시 조치사항 입력란 & 하단 보고 절차 */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/80 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
              {tpmI18n.abnormalityNote}
            </span>
          </div>
          {tpmSummary.ngCount > 0 ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white animate-pulse">
              🚨 {tpmI18n.statusNg} {tpmSummary.ngCount} - 조치 보고 필수
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
          placeholder={tpmI18n.abnormalityPlaceholder}
          className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
        />

        {/* ※ 이상 발생시 조치 절차 (서식 하단 절차 100% 재현) */}
        <div className="pt-2 border-t border-amber-200 dark:border-amber-800/80">
          <div className="text-[11px] font-black text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-1">
            <span>※ 이상 발생시 조치 절차</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center text-xs">
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black border border-amber-500 shadow-2xs">
              <div>1. 작업자</div>
              <div className="text-[10px] font-medium text-amber-950">이상발생 내용보고</div>
            </div>
            <div className="p-2 rounded-xl bg-yellow-300 text-slate-950 font-black border border-yellow-400 shadow-2xs">
              <div>2. 대리</div>
              <div className="text-[10px] font-medium text-yellow-950">내용 확인 및 보고</div>
            </div>
            <div className="p-2 rounded-xl bg-lime-300 text-slate-950 font-black border border-lime-400 shadow-2xs">
              <div>3. 과장</div>
              <div className="text-[10px] font-medium text-lime-950">기계수리의뢰 조치보고</div>
            </div>
            <div className="p-2 rounded-xl bg-amber-500 text-white font-black border border-amber-600 shadow-2xs">
              <div>4. 부서장 확인</div>
              <div className="text-[10px] font-medium text-amber-100">최종 조치 확인</div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 점검 완료 & 다음 단계(작업일보 작성) 진행 버튼 바 */}
      <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-indigo-600 text-white">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white">
              점검 결과: 양호 {tpmSummary.okCount}건 / 이상 {tpmSummary.ngCount}건 (총 42개 검사)
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              TPM 설비일상점검 완료 후 [작업일보 작성 진행] 버튼을 눌러 일보를 작성하십시오.
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
            <span>{tpmI18n.allOk}</span>
          </button>
          <button
            type="button"
            onClick={handleProceedToReport}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-600/30 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{tpmI18n.saveAndNext}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HanulReportTpmPanel;
