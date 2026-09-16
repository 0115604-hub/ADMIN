import React, { useState, useEffect } from "react";
import {
  X,
  Receipt,
  CheckCircle2,
  FileSpreadsheet,
  Coins,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FileText,
  Filter,
  Eye,
  EyeOff
} from "lucide-react";
import { STANDARD_EXPENSE_CATEGORIES, getHanulSettlementMonthData } from "../services/hanulSettlementService";
import { pushModalHistory, subscribeCloseAllModals } from "../utils/modalHistory";

export const HanulExpenseSummaryModal = ({
  isOpen,
  onClose,
  month = "2026-08",
  onOpenFullModal = null
}) => {
  const [hideEmpty, setHideEmpty] = useState(true); // 기본값: 빈칸(0원 항목) 숨김처리

  useEffect(() => {
    if (isOpen) {
      pushModalHistory("hanul_expense_summary_modal");
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = subscribeCloseAllModals(() => {
      if (isOpen && onClose) onClose();
    });
    return () => unsub();
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const monthParts = (month || "2026-08").split("-");
  const monthNum = Number(monthParts[1]) || 8;
  const yearStr = monthParts[0] || "2026";
  const settlementData = getHanulSettlementMonthData(month);

  // Merge loaded expenses with standard 16 categories
  const loadedExpenses = settlementData?.expenses || [];
  const allItems = STANDARD_EXPENSE_CATEGORIES.map((cat, idx) => {
    const existing = loadedExpenses.find(
      (e) => e.category === cat.name || e.id === cat.id || (e.code && e.code === cat.code)
    );
    const amount = existing?.amount !== undefined ? Number(existing.amount) : 0;
    const note = existing?.note !== undefined ? existing.note : cat.defaultNote;
    return {
      code: cat.code || idx + 1,
      name: cat.name,
      amount,
      note: note || "-"
    };
  });

  const totalExpense = settlementData?.totalExpense !== undefined && Number(settlementData.totalExpense) > 0
    ? Number(settlementData.totalExpense)
    : allItems.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);

  const activeCount = allItems.filter((i) => i.amount > 0).length;
  const zeroCount = allItems.length - activeCount;

  // 빈칸(0원) 숨김 여부에 따라 표시할 항목 결정
  const displayedItems = hideEmpty
    ? allItems.filter((i) => Number(i.amount) > 0)
    : allItems;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white flex items-center justify-between gap-3 border-b border-emerald-800/40 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
              <Receipt className="w-5 h-5 text-emerald-100" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-white tracking-tight truncate">
                  (주)한울 {yearStr}년 {monthNum}월 지출 공제내역 요약
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-bold text-[10px]">
                  발생 {activeCount}개 항목
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/80 font-medium truncate mt-0.5">
                선정 기준: 정산표 및 지출 영수증 실데이터 확정본
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top KPI Banner */}
        <div className="p-3 sm:p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border-b border-emerald-200/70 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                공제내역 총액 (지출 합계)
              </div>
              <div className="text-base sm:text-xl font-black font-mono text-emerald-950 dark:text-emerald-100 tracking-tight">
                ₩ {totalExpense.toLocaleString()} 원
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{activeCount}개 항목 적용</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>매출금액 연동완료</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar (빈칸 숨김 토글) */}
        <div className="px-3 sm:px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium text-[11px]">
            <span>표시 항목: <strong>{displayedItems.length}개</strong></span>
            {hideEmpty && zeroCount > 0 && (
              <span className="text-slate-400"> (미발생 {zeroCount}개 숨김)</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setHideEmpty(!hideEmpty)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
          >
            {hideEmpty ? (
              <>
                <EyeOff className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>빈칸 숨김 중 (발생분만 보기)</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 text-slate-500" />
                <span>전체 항목 표시 (0원 포함)</span>
              </>
            )}
          </button>
        </div>

        {/* Filtered Items Table */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
          <table className="w-full text-xs text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700 z-10">
              <tr className="h-8 text-[11px]">
                <th className="py-1.5 px-2 w-[8%] text-center">번호</th>
                <th className="py-1.5 px-2.5 w-[38%]">지출 / 공제 항목명</th>
                <th className="py-1.5 px-2.5 w-[26%] text-right">금액 (원)</th>
                <th className="py-1.5 px-2.5 w-[28%] text-left">비고 및 증빙</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11.5px]">
              {displayedItems.map((item, idx) => {
                const isZero = item.amount === 0;
                return (
                  <tr
                    key={item.code}
                    className={`hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors h-8 ${
                      !isZero ? "bg-white dark:bg-slate-900 font-medium" : "text-slate-400 dark:text-slate-500 bg-slate-50/50"
                    }`}
                  >
                    <td className="py-1 px-2 text-center font-bold text-slate-500 dark:text-slate-400">
                      {item.code}
                    </td>
                    <td className={`py-1 px-2.5 font-bold truncate ${
                      !isZero ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"
                    }`}>
                      {item.name}
                    </td>
                    <td className={`py-1 px-2.5 text-right font-mono font-black ${
                      !isZero ? "text-emerald-700 dark:text-emerald-300 text-xs" : "text-slate-400 dark:text-slate-600"
                    }`}>
                      {!isZero ? `₩ ${item.amount.toLocaleString()}` : "-"}
                    </td>
                    <td className="py-1 px-2.5 text-slate-500 dark:text-slate-400 truncate text-[10.5px]">
                      {item.note || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-white z-10">
              <tr className="h-9 text-xs">
                <td colSpan="2" className="py-2 px-3 text-center tracking-wider font-black">
                  총 지출 공제액 합계 ({activeCount}개 항목)
                </td>
                <td className="py-2 px-2.5 text-right font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm">
                  ₩ {totalExpense.toLocaleString()}
                </td>
                <td className="py-2 px-2.5 text-left text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                  ✓ 8월 매출액 반영
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
            <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">출처: KakaoTalk.png (26년 08월 지출내역 정산표)</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenFullModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullModal();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                title="상세 수정 및 파일 첨부 열기"
              >
                <span>상세 수정/등록</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black text-xs transition-colors shadow-xs cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HanulExpenseSummaryModal;
