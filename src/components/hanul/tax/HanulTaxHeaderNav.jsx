import React from "react";
import {
  Receipt,
  Calendar,
  Download,
  RotateCcw,
  Check
} from "lucide-react";
import { pushModalHistory } from "../../../utils/modalHistory";

/**
 * HanulTaxHeaderNav
 * 세금계산서 상단 타이틀, 월 선택 드롭다운, 정산표 등록 버튼, 엑셀 다운로드 및 초기화 버튼
 */
export default function HanulTaxHeaderNav({
  monthTitle,
  activeMonth,
  handleSelectMonth,
  availableMonths,
  setIsAdminSettlementModalOpen,
  handleExportCSV,
  handleResetDefaults,
  isSaved
}) {
  return (
    <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
          <Receipt className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              한울 세금계산서 및 9BQC 8가지 항목 매출단가 관리
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
              {monthTitle} 정산
            </span>
          </div>
        </div>
      </div>

      {/* 월 선택 (드롭다운) & 액션 버튼 */}
      <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
        {/* Month Dropdown */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-slate-500">월선택:</span>
          <select
            value={activeMonth}
            onChange={(e) => handleSelectMonth(e.target.value)}
            className="bg-transparent text-xs font-black text-slate-800 dark:text-slate-100 px-1 py-0.5 cursor-pointer focus:outline-none"
            title="정산 대상 월 선택"
          >
            {availableMonths.map((m) => (
              <option
                key={m}
                value={m}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
              >
                {m.replace("-", "년 ")}월
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              pushModalHistory("hanul_settlement_modal");
              setIsAdminSettlementModalOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
            title="한울 전월 정산표 공통비/지출공제 등록 및 증빙 확인 팝업 열기"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-200" />
            <span>정산표 등록 (지출공제)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-95 transition-all cursor-pointer shadow-2xs"
            title="엑셀 CSV 다운로드"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>엑셀</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="이 달의 8개 항목 기본값으로 재설정"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {isSaved && (
            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-black flex items-center gap-1 animate-fadeIn">
              <Check className="w-3 h-3" />
              <span>저장됨</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
