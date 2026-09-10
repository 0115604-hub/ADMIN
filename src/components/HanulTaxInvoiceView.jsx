import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  ArrowRight,
  Lock,
  Sliders,
  Zap,
  Percent
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

  // Ratio Distribution Settings: FRT total ratio (default 40% = 0.40, between 35% and 45%)
  const [frtRatioPercent, setFrtRatioPercent] = useState(40);
  const [autoRecomputeOnInput, setAutoRecomputeOnInput] = useState(true);

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

  // Ratio calculation algorithm: FRT 35%~45% & RR 6종 0.1~0.15 (10%~15% each)
  const calculateDistributedSales = useCallback((targetAmt, currentSales, frtPercent) => {
    if (!targetAmt || targetAmt <= 0) return currentSales;

    const frtTotalRatio = frtPercent / 100;
    const frtItems = currentSales.filter((i) => i.partName.includes("FRT") && !i.partName.includes("Glass run"));
    const rrItems = currentSales.filter((i) => !frtItems.includes(i));

    const frtCount = frtItems.length > 0 ? frtItems.length : 2;
    const rrCount = rrItems.length > 0 ? rrItems.length : 6;

    const frtEachRatio = frtTotalRatio / frtCount;
    const rrEachRatio = (1 - frtTotalRatio) / rrCount;

    let totalAllocated = 0;
    const recomputed = currentSales.map((item) => {
      const isFrt = item.partName.includes("FRT") && !item.partName.includes("Glass run");
      const ratio = isFrt ? frtEachRatio : rrEachRatio;
      const targetItemAmt = targetAmt * ratio;
      const qty = Math.max(1, Number(item.qty) || 1);
      const unitPrice = Math.round(targetItemAmt / qty);
      const amount = unitPrice * qty;
      totalAllocated += amount;

      return {
        ...item,
        unitPrice,
        amount,
        taxAmount: Math.round(amount * 0.1),
        totalAmount: Math.round(amount * 1.1)
      };
    });

    // Precision tuning: absorb rounding differences in largest quantity item
    let diff = targetAmt - totalAllocated;
    if (diff !== 0) {
      const sorted = [...recomputed].sort((a, b) => b.qty - a.qty);
      for (const target of sorted) {
        if (diff === 0) break;
        const index = recomputed.findIndex((i) => i.id === target.id);
        const qty = recomputed[index].qty;
        const unitDelta = Math.trunc(diff / qty);
        if (unitDelta !== 0) {
          recomputed[index].unitPrice += unitDelta;
          const newAmt = recomputed[index].unitPrice * qty;
          totalAllocated = totalAllocated - recomputed[index].amount + newAmt;
          diff = targetAmt - totalAllocated;
          recomputed[index].amount = newAmt;
          recomputed[index].taxAmount = Math.round(newAmt * 0.1);
          recomputed[index].totalAmount = Math.round(newAmt * 1.1);
        }
      }
    }

    return recomputed;
  }, []);

  // Handler: Update single 9BQC Sales Row (단가 변경 시 합계금액 연동)
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

  // Handler: Apply Auto-Distribution across 8 items based on invoice amount
  const handleApplyAutoDistribution = (targetAmt = currentInvoiceAmount, ratio = frtRatioPercent) => {
    if (!targetAmt || targetAmt <= 0) {
      alert("세금계산서 발행 공급가액을 입력해 주세요.");
      return;
    }

    const recomputedSales = calculateDistributedSales(targetAmt, salesItems, ratio);
    const updated = {
      ...monthData,
      salesItems: recomputedSales,
      invoiceConfig: {
        ...invoiceConfig,
        invoiceAmount: targetAmt,
        vatAmount: Math.round(targetAmt * 0.1),
        totalInvoiceAmount: Math.round(targetAmt * 1.1)
      }
    };

    setMonthData(updated);
    saveHanulMonthData(activeMonth, updated);
    triggerSavedFeedback();
  };

  // Handler: Update Invoice Input directly (with optional real-time auto recompute)
  const handleInvoiceAmountChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    const amount = Number(rawValue) || 0;
    const vat = Math.round(amount * 0.1);
    const total = amount + vat;

    let updatedSales = salesItems;
    if (autoRecomputeOnInput && amount > 0) {
      updatedSales = calculateDistributedSales(amount, salesItems, frtRatioPercent);
    }

    const updated = {
      ...monthData,
      salesItems: updatedSales,
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

  // Handler: Reset Single Item Price to Default
  const handleResetSinglePrice = (id) => {
    const targetIdx = salesItems.findIndex((item) => item.id === id);
    if (targetIdx === -1) return;
    const defaultTemplate = STANDARD_8_9BQC_TEMPLATES[targetIdx] || STANDARD_8_9BQC_TEMPLATES[0];
    handleUpdateSalesRow(id, "unitPrice", defaultTemplate.defaultPrice);
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
      ["No", "구분", "품명 / 부품명", "수량(EA, 고정)", "단가(원)", "공급가액(원)", "비중(%)", "세액(10%)", "총 합계액(원)"],
      ...salesItems.map((item, idx) => {
        const itemRatio = totalSalesAmount > 0 ? ((item.amount / totalSalesAmount) * 100).toFixed(1) : "0.0";
        const isFrt = item.partName.includes("FRT") && !item.partName.includes("Glass run");
        return [
          idx + 1,
          isFrt ? "FRT" : "RR",
          `"${item.partName}"`,
          item.qty,
          item.unitPrice,
          item.amount,
          `${itemRatio}%`,
          item.taxAmount,
          item.totalAmount
        ];
      }),
      ["총계", "-", "-", totalSalesQty, "-", totalSalesAmount, "100.0%", totalSalesTax, totalSalesGross]
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

  // Computed RR ratio per item
  const rrEachRatioPercent = useMemo(() => {
    return ((100 - frtRatioPercent) / 6).toFixed(2);
  }, [frtRatioPercent]);

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-fadeIn pb-12">
      {/* ========================================================================= */}
      {/* 🗓️ 최상단: 월 선택 탭 & 액션 바 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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

        {/* Month Selector Pills & Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap justify-between lg:justify-end">
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1 px-1.5 text-slate-500 text-[11px] font-bold">
              <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-sm scale-105"
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
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 px-1.5 py-0.5 cursor-pointer focus:outline-none"
              title="전체 월 선택"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                  {m.replace("-", "년 ")}월
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-95 transition-all cursor-pointer shadow-2xs"
              title="엑셀 CSV 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">엑셀</span>
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

      {/* ========================================================================= */}
      {/* 🌟 1. [제일 위] 8가지 항목을 각 1줄씩 표현한 요약 패널 (Summary 8-Rows Panel) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-3.5 sm:p-4 rounded-2xl border border-indigo-500/30 shadow-lg relative overflow-hidden space-y-2.5">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-2.5">
          {/* Header Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <h3 className="text-xs sm:text-sm font-black text-blue-100 flex items-center gap-1.5">
                <span>📊 {monthTitle} 9BQC 8가지 항목 매출단가 요약 현황 (각 1줄)</span>
              </h3>
            </div>
            <div className="text-[11px] text-slate-300 font-medium flex items-center gap-2.5">
              <span>총 매출수량: <strong className="text-white font-mono">{totalSalesQty.toLocaleString()} EA</strong></span>
              <span>•</span>
              <span>평균단가: <strong className="text-white font-mono">₩{avgSalesUnitPrice.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* 🌟 8-Row Concise Summary Table */}
          <div className="bg-black/30 backdrop-blur-md rounded-xl border border-white/15 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-white/10 text-[10.5px] font-black uppercase text-blue-200 border-b border-white/10">
                  <tr>
                    <th className="py-2 px-2.5 text-center w-9">No</th>
                    <th className="py-2 px-2.5 font-bold text-white min-w-[170px]">품명 / 부품명</th>
                    <th className="py-2 px-2 text-right font-black text-blue-300 min-w-[85px]">수량 (EA)</th>
                    <th className="py-2 px-2 text-right font-black text-indigo-300 min-w-[95px]">단가 (₩)</th>
                    <th className="py-2 px-2.5 text-right font-black text-white min-w-[115px]">공급가액 (합계금액)</th>
                    <th className="py-2 px-2 text-center font-bold text-blue-300 min-w-[70px]">비중 (%)</th>
                    <th className="py-2 px-2 text-right font-mono text-amber-200/90 min-w-[85px]">세액 (10%)</th>
                    <th className="py-2 px-2.5 text-right font-black text-emerald-300 min-w-[105px]">총 합계액 (1.1)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium text-xs">
                  {salesItems.map((item, idx) => {
                    const isFrt = item.partName.includes("FRT") && !item.partName.includes("Glass run");
                    const itemRatio = totalSalesAmount > 0 ? ((item.amount / totalSalesAmount) * 100).toFixed(1) : "0.0";

                    return (
                      <tr
                        key={item.id || idx}
                        className="hover:bg-white/10 transition-colors"
                      >
                        <td className="py-1.5 px-2.5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-2.5 font-black text-white">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black ${
                              isFrt
                                ? "bg-blue-500/30 text-blue-200 border border-blue-400/40"
                                : "bg-purple-500/30 text-purple-200 border border-purple-400/40"
                            }`}>
                              {isFrt ? "FRT" : "RR"}
                            </span>
                            <span className="truncate">{item.partName}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-black text-blue-200">
                          {(Number(item.qty) || 0).toLocaleString()} <span className="text-[9.5px] text-white/50 font-normal">EA</span>
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-black text-indigo-200">
                          ₩{(Number(item.unitPrice) || 0).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-black text-white">
                          ₩{(Number(item.amount) || 0).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/10 text-blue-200">
                            {itemRatio}%
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-amber-300/90 text-[11px]">
                          ₩{(Number(item.taxAmount) || Math.round(Number(item.amount) * 0.1)).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-black text-emerald-300">
                          ₩{(Number(item.totalAmount) || Math.round(Number(item.amount) * 1.1)).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Grand Total Row */}
                <tfoot className="bg-white/15 font-black text-white border-t border-white/20 text-xs">
                  <tr>
                    <td colSpan="2" className="py-2 px-2.5 text-center tracking-wider text-[11px]">
                      8개 항목 합계 총계 (Total)
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-blue-200 font-black">
                      {totalSalesQty.toLocaleString()} EA
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-indigo-200 text-[11px]">
                      평균 ₩{avgSalesUnitPrice.toLocaleString()}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono text-white text-xs sm:text-sm font-black">
                      ₩ {totalSalesAmount.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-blue-200 font-black text-[11px]">
                      100.0%
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-amber-300 text-[11px]">
                      ₩ {totalSalesTax.toLocaleString()}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono text-emerald-300 text-xs sm:text-sm font-black">
                      ₩ {totalSalesGross.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 2. [그다음] 2순위: 세금계산서 발행패널 (간격 최적화 & 비율 자동 맞춤) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl border border-blue-700/40 shadow-lg relative overflow-hidden space-y-3">
        {/* Header Title & Actions */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/30 border border-blue-400/30 text-blue-300">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-xs sm:text-sm text-blue-100 tracking-wide flex items-center gap-1.5">
                <span>✍️ {monthTitle} 한울 세금계산서 발행패널</span>
              </h3>
              <p className="text-[11px] text-blue-200/70">
                세금계산서 발행금액을 입력하면 <strong className="text-white">FRT 35%~45%</strong>, <strong className="text-white">RR 6종 0.1~0.15(10%~15%)</strong> 비율로 단가가 자동 역산됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleApplyAutoDistribution(currentInvoiceAmount, frtRatioPercent)}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-[11px] font-black border border-indigo-400/40 transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-sm"
              title="세금계산서 금액을 기준으로 FRT 및 RR 6종 단가를 즉시 자동 계산"
            >
              <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
              <span>비율 기준 단가 자동 맞춤</span>
            </button>

            <button
              type="button"
              onClick={handleApplySalesToInvoice}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold border border-white/20 transition-all cursor-pointer active:scale-95 flex items-center gap-1"
              title="8개 품목 매출합계액을 세금계산서 금액으로 동기화"
            >
              <Coins className="w-3 h-3" />
              <span>매출합계 적용</span>
            </button>
          </div>
        </div>

        {/* Ratio Controller Bar (FRT 35%~45% & RR 6종 0.1~0.15) */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-200">
              <Sliders className="w-3.5 h-3.5 text-blue-300" />
              <span>배분 비율:</span>
            </div>

            {/* FRT Preset Pill Buttons */}
            <div className="flex items-center gap-1 bg-black/25 p-0.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-white/70 px-1 font-bold">FRT:</span>
              {[35, 38, 40, 42, 45].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    setFrtRatioPercent(pct);
                    if (currentInvoiceAmount > 0) {
                      handleApplyAutoDistribution(currentInvoiceAmount, pct);
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-black transition-all cursor-pointer ${
                    frtRatioPercent === pct
                      ? "bg-blue-500 text-white shadow-xs scale-105"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* RR Share Display */}
            <div className="text-[11px] text-indigo-200 font-medium px-2 py-0.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30">
              <span>RR 6종: <strong>각 {rrEachRatioPercent}%</strong> (0.1~0.15)</span>
            </div>
          </div>

          {/* Realtime toggle */}
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-white/80 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRecomputeOnInput}
              onChange={(e) => setAutoRecomputeOnInput(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 bg-white/20 border-white/30 cursor-pointer"
            />
            <span>금액 입력 시 단가 실시간 자동 맞춤</span>
          </label>
        </div>

        {/* Input & Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center">
          {/* 1) 수기 발행 공급가액 입력란 (5 Cols) */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-white/20 space-y-1">
            <label className="text-[11px] font-bold text-blue-200 block flex items-center justify-between">
              <span>📝 세금계산서 발행 공급가액 (수기 입력)</span>
              <span className="text-[10px] text-white/60">숫자 입력 시 부가세 & 단가 자동 계산</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-white/70 font-bold text-sm">₩</span>
              <input
                type="text"
                value={currentInvoiceAmount ? currentInvoiceAmount.toLocaleString() : ""}
                onChange={handleInvoiceAmountChange}
                placeholder="0"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white text-slate-900 font-mono font-black text-base sm:text-lg text-right shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              />
            </div>
          </div>

          {/* 2) VAT & Total Summary (4 Cols) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-2">
            {/* VAT (10%) */}
            <div className="bg-white/10 backdrop-blur-md p-2 sm:p-2.5 rounded-xl border border-white/15">
              <span className="text-[10.5px] font-bold text-blue-200 block">부가세 (VAT 10%)</span>
              <div className="font-mono font-black text-sm sm:text-base text-amber-300 mt-0.5 truncate">
                ₩ {currentVatAmount.toLocaleString()}
              </div>
            </div>

            {/* Total Issued */}
            <div className="bg-white/10 backdrop-blur-md p-2 sm:p-2.5 rounded-xl border border-white/15">
              <span className="text-[10.5px] font-bold text-emerald-300 block">총 세금계산서 합계액</span>
              <div className="font-mono font-black text-sm sm:text-base text-white mt-0.5 truncate">
                ₩ {currentTotalInvoice.toLocaleString()}
              </div>
            </div>
          </div>

          {/* 3) Issue Date, Status & Reconciliation Badge (3 Cols) */}
          <div className="lg:col-span-3 bg-white/10 backdrop-blur-md p-2 sm:p-2.5 rounded-xl border border-white/15 flex flex-col justify-between space-y-1.5">
            <div className="flex items-center justify-between gap-1.5">
              <input
                type="date"
                value={invoiceConfig.issueDate || `${activeMonth}-30`}
                onChange={(e) => handleInvoiceMetaChange("issueDate", e.target.value)}
                className="px-2 py-0.5 rounded-lg bg-white/20 border border-white/20 text-white font-mono font-bold text-[11px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 w-full"
              />
              <select
                value={invoiceConfig.status || "발행완료"}
                onChange={(e) => handleInvoiceMetaChange("status", e.target.value)}
                className={`px-2 py-0.5 rounded-lg font-black text-[11px] cursor-pointer focus:outline-none border shrink-0 ${
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
              <span className="text-[10px] font-bold text-white/60">매출대비 차액:</span>
              <span className={`text-[11px] font-black font-mono px-1.5 py-0.2 rounded ${
                salesInvoiceDiff === 0
                  ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                  : Math.abs(salesInvoiceDiff) < 100
                  ? "bg-blue-500/30 text-blue-200 border border-blue-500/40"
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

      {/* ========================================================================= */}
      {/* 🌟 3. [그다음] 3순위: 단가재수정 및 실시간 자동계산 패널 (간격 축소 컴팩트 뷰) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Top Header */}
        <div className="p-3 sm:p-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
              <Edit3 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>9BQC 8가지 항목 단가재수정 및 실시간 자동계산 패널</span>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  (8줄 컴팩트 뷰)
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[11px] hover:bg-slate-100 dark:hover:bg-slate-750 transition-all flex items-center gap-1 cursor-pointer"
              title="8개 항목 기준 단가로 복원"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>전체 단가 초기화</span>
            </button>
          </div>
        </div>

        {/* 8 Items Editable Table (간격 축소 컴팩트 뷰, 품번 삭제, 수량 고정) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100/90 dark:bg-slate-800 text-[10.5px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-2.5 text-center w-10">No</th>
                <th className="py-2.5 px-2.5 font-bold text-slate-900 dark:text-white min-w-[170px]">품명 / 부품명</th>
                
                {/* 1) 수량 (고정 컬럼) */}
                <th className="py-2.5 px-2 text-right font-black text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 min-w-[95px]">
                  <div className="flex items-center justify-end gap-1">
                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                    <span>수량 (EA, 고정)</span>
                  </div>
                </th>

                {/* 🌟 2) 단가 재수정 (Primary Target) */}
                <th className="py-2.5 px-2 text-right font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 min-w-[125px]">
                  단가 재수정 (₩) ✏️
                </th>

                {/* 3) 합계금액 */}
                <th className="py-2.5 px-2.5 text-right font-black text-slate-900 dark:text-white bg-slate-200/60 dark:bg-slate-700/60 min-w-[125px]">
                  합계금액 (단가×수량)
                </th>

                {/* 4) 매출 비중 (%) */}
                <th className="py-2.5 px-2 text-center font-bold text-blue-600 dark:text-blue-400 min-w-[75px]">
                  비중 (%)
                </th>

                {/* 부가세 10% */}
                <th className="py-2.5 px-2 text-right font-mono text-slate-500 dark:text-slate-400 min-w-[90px]">
                  세액 (10%)
                </th>

                {/* 총액 */}
                <th className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200 min-w-[105px]">
                  총 합계액 (1.1)
                </th>

                <th className="py-2.5 px-2 text-center w-12">초기화</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-xs">
              {salesItems.map((item, idx) => {
                const defaultTmpl = STANDARD_8_9BQC_TEMPLATES[idx] || {};
                const isModifiedPrice = item.unitPrice !== defaultTmpl.defaultPrice;
                const isFrt = item.partName.includes("FRT") && !item.partName.includes("Glass run");
                const itemRatio = totalSalesAmount > 0 ? ((item.amount / totalSalesAmount) * 100).toFixed(1) : "0.0";

                return (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* No */}
                    <td className="py-1.5 px-2.5 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Part Name with Group Badge */}
                    <td className="py-1.5 px-2.5 font-black text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black ${
                          isFrt
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-900"
                        }`}>
                          {isFrt ? "FRT" : "RR"}
                        </span>
                        <span className="truncate">{item.partName}</span>
                      </div>
                    </td>

                    {/* 1) 수량 (고정 텍스트 뱃지 - 수정 불가) */}
                    <td className="py-1.5 px-2 text-right bg-slate-50/60 dark:bg-slate-800/40">
                      <div className="flex items-center justify-end gap-1 font-mono font-black text-slate-800 dark:text-slate-200 text-xs">
                        <span>{(Number(item.qty) || 0).toLocaleString()}</span>
                        <span className="text-[9.5px] text-slate-400 font-normal">EA</span>
                      </div>
                    </td>

                    {/* 🌟 2) 단가 재수정 (컴팩트 인라인 입력창) */}
                    <td className="py-1.5 px-2 text-right bg-indigo-50/60 dark:bg-indigo-950/30">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[11px] text-indigo-500 font-black">₩</span>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateSalesRow(item.id, "unitPrice", e.target.value)}
                          className={`w-24 px-2 py-1 text-right rounded-lg border font-mono font-black text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                            isModifiedPrice
                              ? "border-amber-400 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 ring-1 ring-amber-300"
                              : "border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 text-indigo-950 dark:text-indigo-200"
                          }`}
                        />
                      </div>
                    </td>

                    {/* 3) 합계금액 (단가×수량) */}
                    <td className="py-1.5 px-2.5 text-right bg-slate-100/60 dark:bg-slate-800/40">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[11px] text-slate-400 font-bold">₩</span>
                        <input
                          type="number"
                          min="0"
                          value={item.amount}
                          onChange={(e) => handleUpdateSalesRow(item.id, "amount", e.target.value)}
                          className="w-28 px-2 py-1 text-right rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-black text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs shadow-2xs"
                        />
                      </div>
                    </td>

                    {/* 4) 매출 비중 (%) */}
                    <td className="py-1.5 px-2 text-center">
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black font-mono ${
                        isFrt
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60"
                          : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60"
                      }`}>
                        {itemRatio}%
                      </span>
                    </td>

                    {/* 부가세 (10%) */}
                    <td className="py-1.5 px-2 text-right font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                      ₩ {(Number(item.taxAmount) || Math.round(Number(item.amount) * 0.1)).toLocaleString()}
                    </td>

                    {/* 총액 (1.1) */}
                    <td className="py-1.5 px-2.5 text-right font-mono font-black text-slate-800 dark:text-slate-200 text-xs">
                      ₩ {(Number(item.totalAmount) || Math.round(Number(item.amount) * 1.1)).toLocaleString()}
                    </td>

                    {/* Reset button */}
                    <td className="py-1.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleResetSinglePrice(item.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={`기본 단가(₩${(defaultTmpl.defaultPrice || 0).toLocaleString()})로 복원`}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Row */}
            <tfoot className="bg-slate-100/90 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700 text-xs">
              <tr>
                <td colSpan="2" className="py-2.5 px-2.5 text-center text-[11px] tracking-wider">
                  8개 항목 합계 총계 (Total)
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-slate-900 dark:text-slate-100 bg-slate-200/60 dark:bg-slate-800 text-xs">
                  {totalSalesQty.toLocaleString()} <span className="text-[9.5px] font-normal text-slate-500">EA</span>
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-indigo-900 dark:text-indigo-200 bg-indigo-100/60 dark:bg-indigo-950/50 text-xs">
                  평균 ₩{avgSalesUnitPrice.toLocaleString()}
                </td>
                <td className="py-2.5 px-2.5 text-right font-mono text-slate-950 dark:text-white bg-slate-200/80 dark:bg-slate-700/80 text-xs sm:text-sm font-black">
                  ₩ {totalSalesAmount.toLocaleString()}
                </td>
                <td className="py-2.5 px-2 text-center font-mono text-blue-700 dark:text-blue-300 text-[11px] font-black">
                  100.0%
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                  ₩ {totalSalesTax.toLocaleString()}
                </td>
                <td className="py-2.5 px-2.5 text-right font-mono text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-black">
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
