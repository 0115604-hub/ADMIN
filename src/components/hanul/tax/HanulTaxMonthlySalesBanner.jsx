import React from "react";
import { Coins, Receipt } from "lucide-react";

/**
 * HanulTaxMonthlySalesBanner
 * 한울 {N}월 매출금액 입력란 및 정산/지출공제 실시간 연동 배너
 */
export default function HanulTaxMonthlySalesBanner({
  activeMonthNum,
  prevMonthSales,
  handlePrevMonthSalesChange,
  settlementData,
  setIsExpenseSummaryModalOpen
}) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-3 sm:p-3.5 rounded-2xl border border-indigo-500/40 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-1.5 rounded-lg bg-indigo-500/30 text-indigo-300 shrink-0">
          <Coins className="w-4 h-4" />
        </div>
        <span className="font-black text-xs sm:text-sm text-indigo-100 whitespace-nowrap">
          한울 {activeMonthNum}월 매출금액 :
        </span>
        <div className="relative flex-1 max-w-xs sm:max-w-sm">
          <input
            type="text"
            value={prevMonthSales > 0 ? prevMonthSales.toLocaleString() : ""}
            onFocus={(e) => e.target.select()}
            onChange={handlePrevMonthSalesChange}
            placeholder="0"
            className="w-full pr-8 pl-3 py-1.5 text-right rounded-xl bg-white text-slate-900 font-mono font-black text-sm sm:text-base border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-slate-600 text-xs pointer-events-none">
            원
          </span>
        </div>
      </div>

      {/* 한울 실시간 정산/지출공제 연동 정보 표시 & 상세보기 뱃지 */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {Number(settlementData?.totalExpense) > 0 ? (
          <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-emerald-200 font-medium">공제내역 총액:</span>
            <strong className="text-emerald-300 font-mono font-black">
              ₩{Number(settlementData.totalExpense).toLocaleString()}
            </strong>
            <span className="text-white/40">|</span>
            <span className="text-blue-200 font-medium">매출금액 연동완료</span>
          </div>
        ) : (
          <span className="text-[11px] text-indigo-200/70 hidden lg:inline">
            ✓ 한울 공제내역 등록 시 실시간 매출 연동
          </span>
        )}

        <button
          type="button"
          onClick={() => setIsExpenseSummaryModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          title="한울 공제내역 요약보기"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>공제내역 등록/상세</span>
        </button>
      </div>
    </div>
  );
}
