import React from "react";
import { Sparkles, X, Receipt, Trash2 } from "lucide-react";

/**
 * HanulSettlementExpenseList
 * 공통비 및 지출 공제 항목 목록 및 입력 폼 (좌측 패널)
 */
export default function HanulSettlementExpenseList({
  viewMode,
  autoParsedBanner,
  setAutoParsedBanner,
  visibleExpenses,
  expenses,
  handleAddExpenseItem,
  setShowOnlyWithAmount,
  setFocusedExpenseId,
  handleInputBlur,
  handleExpenseChange,
  handleDeleteExpenseItem
}) {
  return (
    <div
      className={`${
        viewMode === "split"
          ? "w-full md:w-[50%] lg:w-[48%] border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800"
          : "w-full"
      } p-2.5 sm:p-3 overflow-y-auto flex flex-col space-y-1.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700`}
    >
      {/* Auto-Parsed Notification Banner */}
      {autoParsedBanner && (
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/70 dark:via-teal-950/50 dark:to-indigo-950/50 border-2 border-emerald-500/80 dark:border-emerald-500 shadow-sm flex items-center justify-between gap-2 animate-fadeIn shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-100" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-emerald-950 dark:text-emerald-100 truncate">
                  ✨ [{autoParsedBanner.fileName}
                  {autoParsedBanner.sheetName ? ` • ${autoParsedBanner.sheetName}` : ""}] 지출내역 자동 분석 완료!
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10.5px] font-black bg-emerald-500 text-slate-950 shadow-2xs">
                  총 {autoParsedBanner.appliedCount}개 항목 입력됨
                </span>
              </div>
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold mt-0.5">
                공제총액:{" "}
                <strong className="font-mono font-black text-slate-950 dark:text-white">
                  ₩{autoParsedBanner.totalExpense.toLocaleString()}
                </strong>{" "}
                이 왼쪽 항목에 자동 반영 및 저장되었습니다.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoParsedBanner(null)}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
            title="배너 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* List of Compact Expense Item Rows */}
      {visibleExpenses.length === 0 ? (
        <div className="py-10 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 bg-slate-50/50 dark:bg-slate-900/50 my-auto">
          <Receipt className="w-8 h-8 text-slate-400 dark:text-slate-600" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            현재 금액이 입력된 지출/공제 항목이 없습니다.
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
            상단의 <strong>[지출/증빙 파일 업로드]</strong> 버튼으로 파일을 올리면 항목이 자동 분석되어 입력되며,
            아래 <strong>[항목 직접 추가]</strong>를 눌러 직접 등록할 수도 있습니다.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handleAddExpenseItem}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              항목 직접 추가
            </button>
            <button
              type="button"
              onClick={() => setShowOnlyWithAmount(false)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-all"
            >
              전체 기본 항목 보기 ({expenses.length}개)
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 ${
            viewMode === "form" ? "md:grid-cols-2" : "grid-cols-1"
          } gap-1.5`}
        >
          {visibleExpenses.map((exp, idx) => {
            const isFilled = Number(exp.amount) > 0;
            return (
              <div
                key={exp.id || idx}
                className={`px-2.5 py-1.5 rounded-xl border transition-all ${
                  isFilled
                    ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 shadow-2xs ring-1 ring-rose-400/30"
                    : "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-2xs"
                }`}
              >
                {/* Line 1: Item Number Badge + Category Name + Delete Button */}
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="w-4 h-4 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={exp.category}
                      onFocus={() => setFocusedExpenseId(exp.id)}
                      onBlur={() => {
                        setFocusedExpenseId(null);
                        handleInputBlur();
                      }}
                      onChange={(e) => handleExpenseChange(exp.id, "category", e.target.value)}
                      className="w-full px-1 py-0.5 rounded bg-transparent font-black text-xs text-slate-900 dark:text-white border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteExpenseItem(exp.id)}
                    className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer shrink-0"
                    title="항목 삭제"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Line 2: Slim Amount Input + Note Input */}
                <div className="flex items-center gap-1.5">
                  {/* Amount Input with Thousands Separator */}
                  <div className="w-32 sm:w-36 shrink-0 relative flex items-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 overflow-hidden focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500">
                    <span className="pl-1.5 text-[10px] font-bold text-slate-400">₩</span>
                    <input
                      type="text"
                      value={Number(exp.amount) > 0 ? Number(exp.amount).toLocaleString() : ""}
                      placeholder="0"
                      onFocus={(e) => {
                        e.target.select();
                        setFocusedExpenseId(exp.id);
                      }}
                      onBlur={() => {
                        setFocusedExpenseId(null);
                        handleInputBlur();
                      }}
                      onChange={(e) => handleExpenseChange(exp.id, "amount", e.target.value)}
                      className="w-full px-1.5 py-1 text-right font-mono font-black text-xs text-slate-900 dark:text-white focus:outline-none bg-transparent"
                    />
                  </div>

                  {/* Note / Evidence Input */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={exp.note || ""}
                      placeholder="비고 / 증빙 (예: 세금계산서)"
                      onFocus={() => setFocusedExpenseId(exp.id)}
                      onBlur={() => {
                        setFocusedExpenseId(null);
                        handleInputBlur();
                      }}
                      onChange={(e) => handleExpenseChange(exp.id, "note", e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[11px] text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-400 truncate"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Placement: 항목 직접 추가 Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleAddExpenseItem}
          className="w-full py-2 rounded-xl border-2 border-dashed border-emerald-500/70 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-[0.99]"
        >
          <span>항목 직접 추가</span>
        </button>
      </div>
    </div>
  );
}
