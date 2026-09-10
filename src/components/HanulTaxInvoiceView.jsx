import React, { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  Receipt,
  Car,
  Coins,
  DollarSign,
  Calendar,
  RotateCcw,
  Download,
  Check,
  Edit3,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowRight
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useMonth } from "../context/MonthContext";
import {
  getHanulMonthData,
  saveHanulMonthData,
  subscribeHanulStore,
  getDefault9BQCSales,
  STANDARD_8_9BQC_TEMPLATES
} from "../services/hanulTaxInvoiceService";

export const HanulTaxInvoiceView = () => {
  const { formatAmount } = useCurrency() || {};
  const { selectedMonth = "2026-09", availableMonths = [], changeMonth, setSelectedMonth } = useMonth() || {};
  const activeMonth = selectedMonth || "2026-09";

  const handleSelectMonth = (m) => {
    if (typeof changeMonth === "function") {
      changeMonth(m);
    } else if (typeof setSelectedMonth === "function") {
      setSelectedMonth(m);
    }
  };

  // Helper to ensure all 8 items exist
  const ensure8Items = (rawMonthData, month) => {
    const defaults = getDefault9BQCSales(month);
    const existing = rawMonthData?.salesItems || [];
    
    const mergedSales = defaults.map((defItem) => {
      const match = existing.find(
        (e) => e.partName === defItem.partName || (e.partNumber && e.partNumber === defItem.partNumber)
      );
      if (match) {
        const q = Number(match.qty) !== undefined && !isNaN(match.qty) ? Number(match.qty) : defItem.qty;
        const p = Number(match.unitPrice) !== undefined && !isNaN(match.unitPrice) ? Number(match.unitPrice) : defItem.unitPrice;
        const amt = Number(match.amount) || (q * p);
        return {
          ...defItem,
          ...match,
          qty: q,
          unitPrice: p,
          amount: amt,
          taxAmount: Math.round(amt * 0.1),
          totalAmount: Math.round(amt * 1.1)
        };
      }
      return defItem;
    });

    return {
      ...rawMonthData,
      salesItems: mergedSales
    };
  };

  const [monthData, setMonthData] = useState(() => {
    const raw = getHanulMonthData(activeMonth);
    return ensure8Items(raw, activeMonth);
  });
  const [isSaved, setIsSaved] = useState(false);

  // Load and subscribe data on activeMonth changes
  useEffect(() => {
    const raw = getHanulMonthData(activeMonth);
    const validated = ensure8Items(raw, activeMonth);
    setMonthData(validated);

    const unsubscribe = subscribeHanulStore((store) => {
      if (store && store[activeMonth]) {
        setMonthData(ensure8Items(store[activeMonth], activeMonth));
      }
    });

    return () => unsubscribe();
  }, [activeMonth]);

  // Derived Values (8 Items)
  const salesItems = useMemo(() => {
    return monthData?.salesItems && monthData.salesItems.length === 8
      ? monthData.salesItems
      : getDefault9BQCSales(activeMonth);
  }, [monthData, activeMonth]);

  const invoiceConfig = monthData?.invoiceConfig || {
    invoiceAmount: 0,
    vatAmount: 0,
    totalInvoiceAmount: 0,
    issueDate: `${activeMonth}-30`,
    status: "발행완료",
    memo: ""
  };

  // 9BQC Sales Totals (8 items)
  const totalSalesQty = useMemo(() => {
    return salesItems.reduce((acc, cur) => acc + (Number(cur.qty) || 0), 0);
  }, [salesItems]);

  const totalSalesAmount = useMemo(() => {
    return salesItems.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
  }, [salesItems]);

  const totalSalesTax = useMemo(() => {
    return Math.round(totalSalesAmount * 0.1);
  }, [totalSalesAmount]);

  const totalSalesGross = useMemo(() => {
    return totalSalesAmount + totalSalesTax;
  }, [totalSalesAmount, totalSalesTax]);

  // Average unit price
  const avgSalesUnitPrice = useMemo(() => {
    return totalSalesQty > 0 ? Math.round(totalSalesAmount / totalSalesQty) : 0;
  }, [totalSalesAmount, totalSalesQty]);

  // Invoice Amounts
  const currentInvoiceAmount = Number(invoiceConfig.invoiceAmount) || 0;
  const currentVatAmount = Number(invoiceConfig.vatAmount) || Math.round(currentInvoiceAmount * 0.1);
  const currentTotalInvoice = Number(invoiceConfig.totalInvoiceAmount) || (currentInvoiceAmount + currentVatAmount);

  // Difference between 9BQC 8 Items Sales & Tax Invoice Amount
  const salesInvoiceDiff = currentInvoiceAmount - totalSalesAmount;

  // Month Title
  const monthParts = (activeMonth || "2026-09").split("-");
  const monthTitle = `${monthParts[0] || "2026"}년 ${monthParts[1] || "09"}월`;

  // Feedback animation
  const triggerSavedFeedback = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Handler: Update single 9BQC Sales Row (단가, 수량, 매출금액 상호 연동)
  const handleUpdateSalesRow = (id, field, value) => {
    const updatedSales = salesItems.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item };

        if (field === "unitPrice") {
          const p = Math.max(0, Number(value) || 0);
          const q = Number(item.qty) || 0;
          updatedItem.unitPrice = p;
          updatedItem.amount = q * p;
          updatedItem.taxAmount = Math.round(q * p * 0.1);
          updatedItem.totalAmount = Math.round(q * p * 1.1);
        } else if (field === "qty") {
          const q = Math.max(0, Number(value) || 0);
          const p = Number(item.unitPrice) || 0;
          updatedItem.qty = q;
          updatedItem.amount = q * p;
          updatedItem.taxAmount = Math.round(q * p * 0.1);
          updatedItem.totalAmount = Math.round(q * p * 1.1);
        } else if (field === "amount") {
          const a = Math.max(0, Number(value) || 0);
          const q = Number(item.qty) || 0;
          updatedItem.amount = a;
          if (q > 0) {
            updatedItem.unitPrice = Math.round(a / q);
          }
          updatedItem.taxAmount = Math.round(a * 0.1);
          updatedItem.totalAmount = Math.round(a * 1.1);
        }

        return updatedItem;
      }
      return item;
    });

    const updated = { ...monthData, salesItems: updatedSales };
    setMonthData(updated);
    saveHanulMonthData(activeMonth, updated);
    triggerSavedFeedback();
  };

  // Handler: Reset Single Item Price to Default
  const handleResetSinglePrice = (id) => {
    const targetIdx = salesItems.findIndex((item) => item.id === id);
    if (targetIdx === -1) return;
    const defaultTemplate = STANDARD_8_9BQC_TEMPLATES[targetIdx] || STANDARD_8_9BQC_TEMPLATES[0];
    handleUpdateSalesRow(id, "unitPrice", defaultTemplate.defaultPrice);
  };

  // Handler: Update Invoice Input directly
  const handleInvoiceAmountChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    const amount = Number(rawValue) || 0;
    const vat = Math.round(amount * 0.1);
    const total = amount + vat;

    const updated = {
      ...monthData,
      invoiceConfig: {
        ...invoiceConfig,
        invoiceAmount: amount,
        vatAmount: vat,
        totalInvoiceAmount: total
      }
    };
    setMonthData(updated);
    saveHanulMonthData(activeMonth, updated);
    triggerSavedFeedback();
  };

  // Handler: Update other invoice metadata (Date, Status, Memo)
  const handleInvoiceMetaChange = (field, value) => {
    const updated = {
      ...monthData,
      invoiceConfig: {
        ...invoiceConfig,
        [field]: value
      }
    };
    setMonthData(updated);
    saveHanulMonthData(activeMonth, updated);
    triggerSavedFeedback();
  };

  // Auto-fill from 9BQC Sales (8 items total)
  const handleApplySalesToInvoice = () => {
    const amount = totalSalesAmount;
    const vat = Math.round(amount * 0.1);
    const total = amount + vat;

    const updated = {
      ...monthData,
      invoiceConfig: {
        ...invoiceConfig,
        invoiceAmount: amount,
        vatAmount: vat,
        totalInvoiceAmount: total
      }
    };
    setMonthData(updated);
    saveHanulMonthData(activeMonth, updated);
    triggerSavedFeedback();
  };

  // Reset to Month Defaults (8 items)
  const handleResetDefaults = () => {
    if (!confirm(`${activeMonth} 9BQC 8가지 항목 단가와 세금계산서 데이터를 초기 기본 데이터로 재설정하시겠습니까?`)) return;
    const defaultSales = getDefault9BQCSales(activeMonth);
    const defaultTotal = defaultSales.reduce((acc, cur) => acc + (cur.amount || 0), 0);

    const resetData = {
      yearMonth: activeMonth,
      invoiceConfig: {
        invoiceAmount: defaultTotal,
        vatAmount: Math.round(defaultTotal * 0.1),
        totalInvoiceAmount: Math.round(defaultTotal * 1.1),
        issueDate: `${activeMonth}-30`,
        invoiceType: "전자세금계산서 (영세율/과세)",
        status: "발행완료",
        vendorName: "한울",
        vendorBizNo: "615-81-78901",
        buyerName: "(주)오륙",
        buyerBizNo: "615-81-12345",
        memo: `${activeMonth} 한울 9BQC 8개 품목 매입매출 세금계산서 정산`
      },
      salesItems: defaultSales,
      purchaseItems: [],
      updatedAt: new Date().toISOString()
    };

    setMonthData(resetData);
    saveHanulMonthData(activeMonth, resetData);
    triggerSavedFeedback();
  };

  // Export CSV
  const handleExportCSV = () => {
    const filename = `${activeMonth}_한울세금계산서_9BQC_8개품목_매출정산.csv`;
    const rows = [
      ["[한울 세금계산서 및 9BQC 8가지 항목 매출 정산서]"],
      [`기준월: ${monthTitle}`, `발행처: 한울`, `공급받는자: (주)오륙`, `발행일자: ${invoiceConfig.issueDate || ""}`],
      [`세금계산서 발행금액(공급가액): ${currentInvoiceAmount}`, `부가세(10%): ${currentVatAmount}`, `합계금액: ${currentTotalInvoice}`, `상태: ${invoiceConfig.status}`],
      [],
      ["[9BQC 8가지 항목 단가/수량/매출 합계]"],
      ["No", "차종", "품명 / 부품명", "품번(Part No)", "품목코드", "수량(EA)", "단가(원)", "공급가액(원)", "세액(10%)", "총 합계액(원)"],
      ...salesItems.map((item, idx) => [
        idx + 1,
        item.vehicle || "9BQC",
        `"${item.partName}"`,
        `"${item.partNumber || "-"}"`,
        `"${item.itemCode || "-"}"`,
        item.qty,
        item.unitPrice,
        item.amount,
        item.taxAmount,
        item.totalAmount
      ]),
      ["총계", "-", "-", "-", "-", totalSalesQty, "-", totalSalesAmount, totalSalesTax, totalSalesGross]
    ];

    const csvContent = "\uFEFF" + rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn pb-14">
      {/* ========================================================================= */}
      {/* 🗓️ 최상단: 월 선택 탭 & 액션 바 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                한울 세금계산서 및 9BQC 8가지 항목 매출단가 관리
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                {monthTitle} 정산
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <strong>합계금액요약</strong> → <strong>세금계산서 발행패널</strong> → <strong>단가재수정 및 실시간 자동계산 패널</strong> 순서로 배치되어 있습니다.
            </p>
          </div>
        </div>

        {/* Month Selector Pills & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1 px-2 text-slate-500 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">월선택:</span>
            </div>
            {availableMonths.slice(0, 5).map((m) => {
              const isSelected = activeMonth === m;
              const label = `${m.split("-")[1]}월`;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectMonth(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {label}
                </button>
              );
            })}

            {/* Dropdown for other months */}
            <select
              value={activeMonth}
              onChange={(e) => handleSelectMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 px-2 py-1 cursor-pointer focus:outline-none"
              title="전체 월 선택"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                  {m.replace("-", "년 ")}월
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-95 transition-all cursor-pointer shadow-2xs"
              title="엑셀 CSV 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">엑셀 다운로드</span>
            </button>

            <button
              onClick={handleResetDefaults}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="이 달의 8개 항목 기본값으로 재설정"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {isSaved && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-black flex items-center gap-1 animate-fadeIn">
                <Check className="w-3.5 h-3.5" />
                <span>저장됨</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 1. [제일 위] 1순위: 합계금액요약 패널 (Summary Cards) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-4 sm:p-5 rounded-3xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-3.5">
          {/* Header Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <h3 className="text-xs sm:text-sm font-black text-blue-100 flex items-center gap-2">
                <span>📊 {monthTitle} 9BQC 합계금액요약</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  8개 품목 실시간 합산
                </span>
              </h3>
            </div>
            <div className="text-[11px] text-slate-300 font-medium flex items-center gap-3">
              <span>총 매출수량: <strong className="text-white font-mono">{totalSalesQty.toLocaleString()} EA</strong></span>
              <span>•</span>
              <span>평균단가: <strong className="text-white font-mono">₩{avgSalesUnitPrice.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* 4 Grand Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            {/* 1) 9BQC 공급가액 합계 */}
            <div className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/15">
              <span className="text-[11px] font-bold text-blue-200 block">🚗 9BQC 매출 공급가액 합계</span>
              <div className="text-lg sm:text-2xl font-black text-white font-mono mt-1 tracking-tight truncate">
                ₩ {totalSalesAmount.toLocaleString()}
              </div>
              <span className="text-[10px] text-blue-200/70 mt-0.5 block truncate">
                8개 품목 단가 × 수량 합산
              </span>
            </div>

            {/* 2) 부가세 (10%) */}
            <div className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/15">
              <span className="text-[11px] font-bold text-amber-200 block">📑 부가세 (VAT 10%)</span>
              <div className="text-lg sm:text-2xl font-black text-amber-300 font-mono mt-1 tracking-tight truncate">
                ₩ {totalSalesTax.toLocaleString()}
              </div>
              <span className="text-[10px] text-amber-200/70 mt-0.5 block truncate">
                공급가액의 10%
              </span>
            </div>

            {/* 3) 총 합계액 */}
            <div className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/15">
              <span className="text-[11px] font-bold text-emerald-300 block">💎 9BQC 총 합계액 (공급가+세액)</span>
              <div className="text-lg sm:text-2xl font-black text-emerald-300 font-mono mt-1 tracking-tight truncate">
                ₩ {totalSalesGross.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-200/70 mt-0.5 block truncate">
                공급가액 + 세액 총합
              </span>
            </div>

            {/* 4) 총 매출수량 */}
            <div className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/15">
              <span className="text-[11px] font-bold text-purple-200 block">📦 9BQC 총 매출수량</span>
              <div className="text-lg sm:text-2xl font-black text-purple-200 font-mono mt-1 tracking-tight truncate">
                {totalSalesQty.toLocaleString()} <span className="text-xs font-normal text-white/70">EA</span>
              </div>
              <span className="text-[10px] text-purple-200/70 mt-0.5 block truncate">
                8개 전 품목 합산 수량
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 2. [그다음] 2순위: 세금계산서 발행패널 */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-blue-700/40 shadow-xl relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          {/* Header Title & One-Click Sync */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/30 border border-blue-400/30 text-blue-300">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-blue-100 tracking-wide flex items-center gap-2">
                  <span>✍️ {monthTitle} 한울 세금계산서 발행패널</span>
                </h3>
                <p className="text-xs text-blue-200/70">
                  수기로 실제 세금계산서 발행 공급가액을 입력하면 부가세(10%)와 총액이 자동 계산되며, 9BQC 8개 품목 매출합계와의 차액이 표시됩니다.
                </p>
              </div>
            </div>

            {/* Quick Sync Button */}
            <button
              type="button"
              onClick={handleApplySalesToInvoice}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-black border border-blue-400/40 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-md"
              title="9BQC 8개 품목 매출 합계액(공급가액)을 세금계산서 발행금액으로 즉시 동기화"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>9BQC 매출합계액 그대로 적용 (₩{totalSalesAmount.toLocaleString()})</span>
            </button>
          </div>

          {/* Interactive Input & Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
            {/* 1) 수기 발행 공급가액 입력란 (5 Cols) */}
            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/20 space-y-1.5">
              <label className="text-xs font-bold text-blue-200 block flex items-center justify-between">
                <span>📝 세금계산서 발행 공급가액 (수기 입력)</span>
                <span className="text-[10.5px] text-white/60">숫자 입력 시 부가세 자동 계산</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-white/70 font-bold text-base">₩</span>
                <input
                  type="text"
                  value={currentInvoiceAmount ? currentInvoiceAmount.toLocaleString() : ""}
                  onChange={handleInvoiceAmountChange}
                  placeholder="0"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white text-slate-900 font-mono font-black text-lg sm:text-xl text-right shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                />
              </div>
            </div>

            {/* 2) VAT & Total Summary (4 Cols) */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-2.5">
              {/* VAT (10%) */}
              <div className="bg-white/10 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/15">
                <span className="text-[11px] font-bold text-blue-200 block">부가세 (VAT 10%)</span>
                <div className="font-mono font-black text-base sm:text-lg text-amber-300 mt-1 truncate">
                  ₩ {currentVatAmount.toLocaleString()}
                </div>
              </div>

              {/* Total Issued (Gross) */}
              <div className="bg-white/10 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/15">
                <span className="text-[11px] font-bold text-emerald-300 block">총 세금계산서 합계액</span>
                <div className="font-mono font-black text-base sm:text-lg text-white mt-1 truncate">
                  ₩ {currentTotalInvoice.toLocaleString()}
                </div>
              </div>
            </div>

            {/* 3) Issue Date, Status & Reconciliation Badge (3 Cols) */}
            <div className="lg:col-span-3 bg-white/10 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/15 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between gap-1.5">
                <input
                  type="date"
                  value={invoiceConfig.issueDate || `${activeMonth}-30`}
                  onChange={(e) => handleInvoiceMetaChange("issueDate", e.target.value)}
                  className="px-2 py-1 rounded-lg bg-white/20 border border-white/20 text-white font-mono font-bold text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 w-full"
                />
                <select
                  value={invoiceConfig.status || "발행완료"}
                  onChange={(e) => handleInvoiceMetaChange("status", e.target.value)}
                  className={`px-2 py-1 rounded-lg font-black text-xs cursor-pointer focus:outline-none border shrink-0 ${
                    invoiceConfig.status === "발행완료"
                      ? "bg-emerald-500/80 border-emerald-400 text-white"
                      : invoiceConfig.status === "발행대기"
                      ? "bg-amber-500/80 border-amber-400 text-slate-950 font-black"
                      : "bg-blue-500/80 border-blue-400 text-white"
                  }`}
                >
                  <option value="발행완료" className="bg-slate-900 text-white font-bold">✓ 발행완료</option>
                  <option value="발행대기" className="bg-slate-900 text-amber-300 font-bold">⏳ 발행대기</option>
                  <option value="작성중" className="bg-slate-900 text-blue-300 font-bold">📝 작성중</option>
                </select>
              </div>

              {/* Difference Badge */}
              <div className="pt-1 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-white/60">매출대비 차액:</span>
                <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${
                  salesInvoiceDiff === 0
                    ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                    : salesInvoiceDiff > 0
                    ? "bg-blue-500/30 text-blue-200 border border-blue-500/40"
                    : "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                }`}>
                  {salesInvoiceDiff === 0 ? "✓ 0원 (일치)" : `${salesInvoiceDiff > 0 ? "+" : ""}${salesInvoiceDiff.toLocaleString()}원`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 3. [그다음] 3순위: 단가재수정 및 실시간 자동계산 패널 (8줄 테이블) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>9BQC 8가지 항목 단가재수정 및 실시간 자동계산 패널</span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  (8개 품목)
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                아래 8줄 표에서 <strong className="text-indigo-600 dark:text-indigo-400">단가(₩ ✏️)</strong>를 입력·재수정하면, 수량과 곱해져서 <strong>합계금액</strong> 및 상단 합계금액요약과 세금계산서 차액이 실시간으로 연동됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-750 transition-all flex items-center gap-1 cursor-pointer"
              title="8개 항목 기준 단가로 복원"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>전체 단가 초기화</span>
            </button>
          </div>
        </div>

        {/* 8 Items Editable Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100/90 dark:bg-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-3 text-center w-12">No</th>
                <th className="py-3.5 px-3 font-bold text-slate-900 dark:text-white min-w-[180px]">품명 / 부품명</th>
                <th className="py-3.5 px-3 font-mono text-slate-600 dark:text-slate-400">품번 (Part No)</th>
                
                {/* 1) 수량 */}
                <th className="py-3.5 px-3 text-right font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 min-w-[110px]">
                  수량 (EA) ✏️
                </th>

                {/* 🌟 2) 단가 재수정 (Primary Target) */}
                <th className="py-3.5 px-3 text-right font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 min-w-[140px]">
                  단가 재수정 (₩, 원) ✏️
                </th>

                {/* 3) 합계금액 */}
                <th className="py-3.5 px-3 text-right font-black text-slate-900 dark:text-white bg-slate-200/60 dark:bg-slate-700/60 min-w-[140px]">
                  합계금액 (단가×수량)
                </th>

                {/* 부가세 10% */}
                <th className="py-3.5 px-3 text-right font-mono text-slate-500 dark:text-slate-400 min-w-[100px]">
                  세액 (10%)
                </th>

                {/* 총액 */}
                <th className="py-3.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 min-w-[110px]">
                  총 합계액 (1.1)
                </th>

                <th className="py-3.5 px-3 text-center w-16">초기화</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {salesItems.map((item, idx) => {
                const defaultTmpl = STANDARD_8_9BQC_TEMPLATES[idx] || {};
                const isModifiedPrice = item.unitPrice !== defaultTmpl.defaultPrice;

                return (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* No */}
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs">
                      {idx + 1}
                    </td>

                    {/* Part Name */}
                    <td className="py-3 px-3 font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          9BQC
                        </span>
                        <span className="truncate">{item.partName}</span>
                      </div>
                    </td>

                    {/* Part Number */}
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 text-xs">
                      {item.partNumber || "-"}
                    </td>

                    {/* 1) 수량 (수정 가능) */}
                    <td className="py-3 px-3 text-right bg-blue-50/40 dark:bg-blue-950/20">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          min="0"
                          value={item.qty}
                          onChange={(e) => handleUpdateSalesRow(item.id, "qty", e.target.value)}
                          className="w-24 px-2 py-1.5 text-right rounded-xl border border-blue-200 dark:border-blue-800/80 bg-white dark:bg-slate-900 font-mono font-black text-blue-950 dark:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs shadow-2xs"
                        />
                        <span className="text-[10px] text-slate-400 font-normal">EA</span>
                      </div>
                    </td>

                    {/* 🌟 2) 단가 재수정 (Highlight Input) */}
                    <td className="py-3 px-3 text-right bg-indigo-50/60 dark:bg-indigo-950/30">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xs text-indigo-500 font-black">₩</span>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateSalesRow(item.id, "unitPrice", e.target.value)}
                          className={`w-28 px-2.5 py-1.5 text-right rounded-xl border font-mono font-black text-xs sm:text-sm shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                            isModifiedPrice
                              ? "border-amber-400 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 ring-1 ring-amber-300"
                              : "border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 text-indigo-950 dark:text-indigo-200"
                          }`}
                        />
                      </div>
                    </td>

                    {/* 3) 합계금액 (단가×수량) */}
                    <td className="py-3 px-3 text-right bg-slate-100/60 dark:bg-slate-800/40">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs text-slate-400 font-bold">₩</span>
                        <input
                          type="number"
                          min="0"
                          value={item.amount}
                          onChange={(e) => handleUpdateSalesRow(item.id, "amount", e.target.value)}
                          className="w-32 px-2.5 py-1.5 text-right rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-black text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs shadow-2xs"
                        />
                      </div>
                    </td>

                    {/* 부가세 (10%) */}
                    <td className="py-3 px-3 text-right font-mono text-slate-500 dark:text-slate-400 text-xs">
                      ₩ {(Number(item.taxAmount) || Math.round(Number(item.amount) * 0.1)).toLocaleString()}
                    </td>

                    {/* 총액 (1.1) */}
                    <td className="py-3 px-3 text-right font-mono font-black text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                      ₩ {(Number(item.totalAmount) || Math.round(Number(item.amount) * 1.1)).toLocaleString()}
                    </td>

                    {/* Reset button */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleResetSinglePrice(item.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={`기본 단가(₩${(defaultTmpl.defaultPrice || 0).toLocaleString()})로 복원`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Row */}
            <tfoot className="bg-slate-100/90 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700 text-xs">
              <tr>
                <td colSpan="3" className="py-4 px-4 text-center text-xs tracking-wider">
                  9BQC 8가지 항목 합계 총계 (Total Sales)
                </td>
                <td className="py-4 px-3 text-right font-mono text-blue-900 dark:text-blue-200 bg-blue-100/60 dark:bg-blue-950/50 text-xs sm:text-sm">
                  {totalSalesQty.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">EA</span>
                </td>
                <td className="py-4 px-3 text-right font-mono text-indigo-900 dark:text-indigo-200 bg-indigo-100/60 dark:bg-indigo-950/50 text-xs sm:text-sm">
                  평균 ₩{avgSalesUnitPrice.toLocaleString()}
                </td>
                <td className="py-4 px-3 text-right font-mono text-slate-950 dark:text-white bg-slate-200/80 dark:bg-slate-700/80 text-sm sm:text-base">
                  ₩ {totalSalesAmount.toLocaleString()}
                </td>
                <td className="py-4 px-3 text-right font-mono text-slate-600 dark:text-slate-300 text-xs">
                  ₩ {totalSalesTax.toLocaleString()}
                </td>
                <td className="py-4 px-3 text-right font-mono text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-black">
                  ₩ {totalSalesGross.toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
