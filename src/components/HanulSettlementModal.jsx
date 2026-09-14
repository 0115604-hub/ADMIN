import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Save,
  RotateCcw,
  CheckCircle2,
  Download,
  Trash2,
  Receipt,
  Building2
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import {
  STANDARD_EXPENSE_CATEGORIES,
  STANDARD_6_PRODUCTS,
  getHanulSettlementMonthData,
  saveHanulSettlementMonthData
} from "../services/hanulSettlementService";
import * as XLSX from "xlsx";

export const HanulSettlementModal = ({ isOpen, onClose, initialMonth = "2026-08" }) => {
  const { formatAmount } = useCurrency() || { formatAmount: (v) => `₩${Number(v || 0).toLocaleString()}` };

  const [selectedMonth, setSelectedMonth] = useState(initialMonth || "2026-08");

  // Current Month State
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlementDate, setSettlementDate] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Available Month Dropdown Options
  const monthDropdownOptions = [
    { ym: "2026-08", label: "2026년 08월 (2608, 전월 정산등록)" },
    { ym: "2026-07", label: "2026년 07월 (2607, 7월 실적)" },
    { ym: "2026-09", label: "2026년 09월 (2609, 9월 정산대기)" },
    { ym: "2026-10", label: "2026년 10월 (2610, 10월 정산대기)" },
    { ym: "2026-11", label: "2026년 11월 (2611, 11월 정산대기)" },
    { ym: "2026-12", label: "2026년 12월 (2612, 12월 정산대기)" },
    { ym: "2026-06", label: "2026년 06월 (2606)" },
    { ym: "2026-05", label: "2026년 05월 (2605)" }
  ];

  // Load Month Data
  useEffect(() => {
    if (!isOpen) return;
    const data = getHanulSettlementMonthData(selectedMonth);
    if (data) {
      setProducts(data.products || []);
      setExpenses(data.expenses || []);
      setSettlementDate(data.settlementDate || `${selectedMonth}-28`);
      setStatus(data.status || "DRAFT");
    }
  }, [isOpen, selectedMonth]);

  // Calculations
  const calculatedTotals = useMemo(() => {
    const totalQty = products.reduce((s, p) => s + (Number(p.qty) || 0), 0);
    const supplyAmount = products.reduce((s, p) => s + (Number(p.unitPrice || 0) * Number(p.qty || 0)), 0);
    const taxAmount = Math.round(supplyAmount * 0.1);
    const totalWithTax = supplyAmount + taxAmount;

    const totalExpense = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const netSettlement = totalWithTax > 0 ? (totalWithTax - totalExpense) : (totalExpense > 0 ? -totalExpense : 0);

    return {
      totalQty,
      supplyAmount,
      taxAmount,
      totalWithTax,
      totalExpense,
      netSettlement
    };
  }, [products, expenses]);

  // Handle Expense Change with thousands separator support
  const handleExpenseChange = (id, field, value) => {
    setExpenses((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        if (field === "amount") {
          const cleanStr = String(value).replace(/[^0-9]/g, "");
          const num = cleanStr === "" ? 0 : Number(cleanStr);
          return { ...e, amount: isNaN(num) ? 0 : num };
        }
        return { ...e, [field]: value };
      })
    );
  };

  // Add Custom Expense Item (No + icon)
  const handleAddExpenseItem = () => {
    const newId = `exp_custom_${Date.now()}`;
    const nextCode = expenses.length + 1;
    setExpenses((prev) => [
      ...prev,
      {
        id: newId,
        category: `${nextCode}. 신규 공통비/공제 항목`,
        amount: 0,
        note: ""
      }
    ]);
  };

  // Delete Expense Item
  const handleDeleteExpenseItem = (id) => {
    if (!window.confirm("이 지출/공제 항목을 삭제하시겠습니까?")) return;
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Save Current Month Data
  const handleSave = async () => {
    const monthData = {
      yearMonth: selectedMonth,
      sheetCode: selectedMonth.replace("-", "").slice(2),
      settlementDate,
      status: calculatedTotals.totalExpense > 0 || calculatedTotals.totalQty > 0 ? "CONFIRMED" : "DRAFT",
      products,
      expenses,
      ...calculatedTotals
    };

    await saveHanulSettlementMonthData(selectedMonth, monthData);
    setStatus(monthData.status);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  // Reset All Expenses to 0
  const handleResetExpenses = () => {
    if (!window.confirm("모든 지출/공제 금액을 0원으로 초기화하시겠습니까?")) return;
    setExpenses((prev) => prev.map((e) => ({ ...e, amount: 0 })));
  };

  // Export to Excel
  const handleExportExcel = () => {
    const sheetData = [
      [`협력업체 (주)한울 ${selectedMonth} 공통비 및 지출 공제내역서`],
      [`기준년월: ${selectedMonth}`, `정산일자: ${settlementDate}`, `업체명: (주)한울`],
      [],
      ["[공통비 및 지출 공제내역]"],
      ["No", "지출/공제 항목", "금액(원)", "세부내역/비고"],
      ...expenses.map((e, idx) => [
        idx + 1,
        e.category,
        e.amount,
        e.note || ""
      ]),
      ["소계", "공통비 지출 총계", calculatedTotals.totalExpense, "정산 시 차감액"],
      [],
      ["[정산 차인지급액 요약]"],
      ["공통비 / 지출공제 총액", calculatedTotals.totalExpense]
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${selectedMonth.replace("-", "").slice(2)}_지출공제`);
    XLSX.writeFile(wb, `한울_${selectedMonth}_공통비지출공제내역.xlsx`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-emerald-500/50 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white border-b border-emerald-500/30 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-600/90 text-white shadow-sm ring-1 ring-white/20 shrink-0">
              <Receipt className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                  (주)한울 전월 정산표 • 공통비 및 지출 공제내역 등록
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 shrink-0">
                  {status === "CONFIRMED" ? "✓ 등록완료" : "✏️ 작성중"}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Controls: Dropdown Month Selector & Reset Button */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Dropdown Month Selector */}
          <div className="flex items-center gap-2 min-w-0">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>정산 기준월 :</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border-2 border-emerald-500/60 bg-white dark:bg-slate-800 text-xs sm:text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
            >
              {monthDropdownOptions.map((opt) => (
                <option key={opt.ym} value={opt.ym}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Top Right: Export Excel & Reset Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              title="지출공제 엑셀 파일 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>엑셀 다운로드</span>
            </button>

            <button
              type="button"
              onClick={handleResetExpenses}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
              title="모든 항목 금액을 0원으로 초기화"
            >
              <RotateCcw className="w-3 h-3" />
              <span>금액 초기화</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Card: Total Expense */}
        <div className="px-4 py-3 bg-rose-50/60 dark:bg-rose-950/20 border-b border-rose-200/80 dark:border-rose-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {selectedMonth} 등록 항목수: <strong className="text-slate-900 dark:text-white font-black">{expenses.length}개 항목</strong>
              {expenses.filter(e => e.amount > 0).length > 0 && (
                <span className="text-rose-600 dark:text-rose-400 ml-1">
                  ({expenses.filter(e => e.amount > 0).length}개 항목 금액 입력됨)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-black text-rose-700 dark:text-rose-300">
              공통비 / 지출공제 총합계 :
            </span>
            <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
              - {formatAmount(calculatedTotals.totalExpense)}
            </span>
          </div>
        </div>

        {/* Modal Body - 10 Standard + Custom Expense Items */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {expenses.map((exp, idx) => {
              const isFilled = exp.amount > 0;
              return (
                <div
                  key={exp.id || idx}
                  className={`p-3 rounded-2xl border transition-all ${
                    isFilled
                      ? "bg-rose-50/50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 shadow-xs ring-1 ring-rose-400/30"
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  {/* Top: Item Title & Delete Button */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={exp.category}
                        onChange={(e) => handleExpenseChange(exp.id, "category", e.target.value)}
                        className="w-full px-1.5 py-0.5 rounded bg-transparent font-black text-xs sm:text-sm text-slate-900 dark:text-white border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteExpenseItem(exp.id)}
                      className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer shrink-0"
                      title="항목 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Input Grid: Clean Amount and Remark (No automated plus buttons) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    {/* Amount Input with Thousands Separator */}
                    <div className="sm:col-span-5 relative">
                      <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 overflow-hidden focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500">
                        <span className="pl-2.5 text-xs font-bold text-slate-400">₩</span>
                        <input
                          type="text"
                          value={Number(exp.amount) > 0 ? Number(exp.amount).toLocaleString() : ""}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleExpenseChange(exp.id, "amount", e.target.value)}
                          className="w-full px-2 py-2 text-right font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none bg-transparent"
                        />
                      </div>
                    </div>

                    {/* Note / Evidence Input */}
                    <div className="sm:col-span-7">
                      <input
                        type="text"
                        value={exp.note || ""}
                        placeholder="세부내역 및 증빙구분 입력 (예: 전자세금계산서, 이체 등)"
                        onChange={(e) => handleExpenseChange(exp.id, "note", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Placement: 항목 직접 추가 Button (No + icon) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleAddExpenseItem}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-emerald-500/70 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.99]"
            >
              <span>항목 직접 추가</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {isSavedToast && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black border border-emerald-300 animate-fadeIn flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>지출 공제내역이 안전하게 저장되었습니다!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black transition-all cursor-pointer"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm shadow-emerald-600/30 cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>지출 공제내역 저장</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HanulSettlementModal;
