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
import { useMonth, getCurrentYearMonth } from "../context/MonthContext";
import {
  getHanulMonthData,
  saveHanulMonthData,
  subscribeHanulStore,
  getDefault9BQCSales,
  STANDARD_8_9BQC_TEMPLATES
} from "../services/hanulTaxInvoiceService";

// 🌟 FRT & RR 대상 품목 인덱스 정의
// FRT 대상: 3번(idx 2: FRT LH), 4번(idx 3: FRT RH)
const FRT_INDICES = [2, 3];
// RR 대상: 1번(idx 0: RR LH PRI), 2번(idx 1: RR RH PRI), 5번(idx 4: RR LH TNI), 6번(idx 5: RR RH TNI), 7번(idx 6: Glass run RR), 8번(idx 7: Glass run FR)
const RR_INDICES = [0, 1, 4, 5, 6, 7];

// Helper: 전월(Previous Month) 구하기
const getPreviousYearMonth = (baseMonth) => {
  const ym = baseMonth || getCurrentYearMonth() || "2026-09";
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  const prevY = d.getFullYear();
  const prevM = String(d.getMonth() + 1).padStart(2, "0");
  return `${prevY}-${prevM}`;
};

export const HanulTaxInvoiceView = () => {
  const { formatAmount } = useCurrency() || {};
  const { selectedMonth: globalMonth = "2026-09", availableMonths = [] } = useMonth() || {};
  
  // 🌟 한울세금계산서 화면 진입 시 당월이 아닌 "전월"이 기본으로 먼저 표시됨
  const [localMonth, setLocalMonth] = useState(() => getPreviousYearMonth(globalMonth));
  const activeMonth = localMonth || "2026-08";

  const handleSelectMonth = (m) => {
    setLocalMonth(m);
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

  // 🌟 1. 기준 원본 데이터 (상단 요약패널 전용 - 단가를 수정해도 변경되지 않음)
  const baselineSalesItems = useMemo(() => {
    return getDefault9BQCSales(activeMonth);
  }, [activeMonth]);

  const baselineTotalQty = useMemo(() => {
    return baselineSalesItems.reduce((acc, cur) => acc + (Number(cur.qty) || 0), 0);
  }, [baselineSalesItems]);

  const baselineTotalAmount = useMemo(() => {
    return baselineSalesItems.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
  }, [baselineSalesItems]);

  const baselineTotalTax = useMemo(() => {
    return Math.round(baselineTotalAmount * 0.1);
  }, [baselineTotalAmount]);

  const baselineTotalGross = useMemo(() => {
    return baselineTotalAmount + baselineTotalTax;
  }, [baselineTotalAmount, baselineTotalTax]);

  const baselineAvgUnitPrice = useMemo(() => {
    return baselineTotalQty > 0 ? Math.round(baselineTotalAmount / baselineTotalQty) : 0;
  }, [baselineTotalAmount, baselineTotalQty]);

  // 🌟 2. 수정 가능한 현재 데이터 (하단 자동계산/단가재수정 패널 전용)
  const salesItems = useMemo(() => {
    return monthData?.salesItems && monthData.salesItems.length === 8
      ? monthData.salesItems
      : getDefault9BQCSales(activeMonth);
  }, [monthData, activeMonth]);

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

  // 🌟 한울 {N}월 매출금액 (한줄 패널 전용 상태)
  const prevMonthSales = monthData?.prevMonthSales !== undefined 
    ? Number(monthData.prevMonthSales) 
    : (monthData?.invoiceConfig?.invoiceAmount ? Number(monthData.invoiceConfig.invoiceAmount) : totalSalesAmount);

  // Month Title & Active Month Number
  const monthParts = (activeMonth || "2026-08").split("-");
  const monthTitle = `${monthParts[0] || "2026"}년 ${monthParts[1] || "08"}월`;
  const activeMonthNum = Number(monthParts[1]) || 8;

  // Feedback animation
  const triggerSavedFeedback = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // 🌟 Current FRT & RR Unit Price Values
  const frtUnitPrice = salesItems[2]?.unitPrice !== undefined ? Number(salesItems[2].unitPrice) : 2858;
  const rrUnitPrice = salesItems[0]?.unitPrice !== undefined ? Number(salesItems[0].unitPrice) : 11028;

  // 🌟 한울 매출금액 변경 핸들러
  const handlePrevMonthSalesChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    const amount = Number(rawValue) || 0;

    const updated = {
      ...monthData,
      prevMonthSales: amount,
      invoiceConfig: {
        ...(monthData?.invoiceConfig || {}),
        invoiceAmount: amount,
        vatAmount: Math.round(amount * 0.1),
        totalInvoiceAmount: Math.round(amount * 1.1)
      }
    };
    setMonthData(updated);
    saveHanulMonthData(activeMonth, updated);
    triggerSavedFeedback();
  };

  // 🌟 FRT 단가 입력 핸들러 (3번 FRT LH, 4번 FRT RH에 일괄 적용)
  const handleFrtPriceChange = (valStr) => {
    const cleanStr = String(valStr).replace(/[^0-9]/g, "");
    const numVal = cleanStr === "" ? 0 : Math.max(0, Number(cleanStr));

    const updatedSales = salesItems.map((item, idx) => {
      if (FRT_INDICES.includes(idx)) {
        const q = Number(item.qty) || 0;
        const amt = q * numVal;
        return {
          ...item,
          unitPrice: numVal,
          amount: amt,
          taxAmount: Math.round(amt * 0.1),
          totalAmount: Math.round(amt * 1.1)
        };
      }
      return item;
    });

    const updated = { ...monthData, salesItems: updatedSales };
    setMonthData(updated);
    saveHanulMonthData(activeMonth, updated);
    triggerSavedFeedback();
  };

  // 🌟 RR 단가 입력 핸들러 (1, 2, 5, 6, 7, 8번에 일괄 적용)
  const handleRrPriceChange = (valStr) => {
    const cleanStr = String(valStr).replace(/[^0-9]/g, "");
    const numVal = cleanStr === "" ? 0 : Math.max(0, Number(cleanStr));

    const updatedSales = salesItems.map((item, idx) => {
      if (RR_INDICES.includes(idx)) {
        const q = Number(item.qty) || 0;
        const amt = q * numVal;
        return {
          ...item,
          unitPrice: numVal,
          amount: amt,
          taxAmount: Math.round(amt * 0.1),
          totalAmount: Math.round(amt * 1.1)
        };
      }
      return item;
    });

    const updated = { ...monthData, salesItems: updatedSales };
    setMonthData(updated);
    saveHanulMonthData(activeMonth, updated);
    triggerSavedFeedback();
  };

  // Reset to Month Defaults (8 items)
  const handleResetDefaults = () => {
    if (!confirm(`${activeMonth} 9BQC 8가지 항목 단가 데이터를 초기 기본 데이터로 재설정하시겠습니까?`)) return;
    const defaultSales = getDefault9BQCSales(activeMonth);
    const defaultTotal = defaultSales.reduce((acc, cur) => acc + (cur.amount || 0), 0);

    const resetData = {
      yearMonth: activeMonth,
      prevMonthSales: defaultTotal,
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
        memo: `${activeMonth} 한울 9BQC 8개 품목 매입매출 정산`
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
    const filename = `${activeMonth}_한울_9BQC_8개품목_매출정산.csv`;
    const rows = [
      ["[한울 9BQC 8가지 항목 매출 정산서]"],
      [`기준월: ${monthTitle}`, `발행처: 한울`, `공급받는자: (주)오륙`],
      [`한울 ${activeMonthNum}월 매출금액: ${prevMonthSales}`, `8개 품목 매출합계: ${totalSalesAmount}`],
      [],
      ["[9BQC 8가지 항목 기준 단가/수량/매출 요약 (기준원형 보존)]"],
      ["No", "구분", "품명 / 부품명", "수량(EA)", "기준단가(원)", "공급가액(원)", "비중(%)", "세액(10%)", "총 합계액(원)"],
      ...baselineSalesItems.map((item, idx) => {
        const itemRatio = baselineTotalAmount > 0 ? ((item.amount / baselineTotalAmount) * 100).toFixed(1) : "0.0";
        const isFrt = FRT_INDICES.includes(idx);
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
      ["기준총계", "-", "-", baselineTotalQty, "-", baselineTotalAmount, "100.0%", baselineTotalTax, baselineTotalGross],
      [],
      ["[9BQC 8가지 항목 재수정 단가 및 정산 현황]"],
      ["No", "구분", "품명 / 부품명", "수량(EA)", "적용단가(원)", "수정공급가액(원)", "비중(%)", "세액(10%)", "총 합계액(원)"],
      ...salesItems.map((item, idx) => {
        const itemRatio = totalSalesAmount > 0 ? ((item.amount / totalSalesAmount) * 100).toFixed(1) : "0.0";
        const isFrt = FRT_INDICES.includes(idx);
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
      ["수정총계", "-", "-", totalSalesQty, "-", totalSalesAmount, "100.0%", totalSalesTax, totalSalesGross]
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
    <div className="space-y-3 sm:space-y-3.5 animate-fadeIn pb-12">
      {/* ========================================================================= */}
      {/* 🗓️ 최상단: 월 선택(드롭다운 전용) & 액션 바 */}
      {/* ========================================================================= */}
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

        {/* 🌟 월 선택 (드롭다운) & 액션 버튼 */}
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
              {availableMonths.map((m) => {
                const isPrev = m === getPreviousYearMonth(globalMonth);
                const isCurr = m === globalMonth;
                return (
                  <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                    {m.replace("-", "년 ")}월 {isPrev ? "(전월)" : isCurr ? "(당월)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Excel Export & Saved Status */}
          <div className="flex items-center gap-1">
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

      {/* ========================================================================= */}
      {/* 🌟 1. [제일 위] 8가지 항목 기준 요약 패널 (하단 단가 수정 시에도 원형 유지) */}
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
                <span>📊 {monthTitle} 9BQC 8가지 항목 기준 매출단가 요약 (기준원형 보존)</span>
              </h3>
            </div>
            <div className="text-[11px] text-slate-300 font-medium flex items-center gap-2.5">
              <span>총 매출수량: <strong className="text-white font-mono">{baselineTotalQty.toLocaleString()} EA</strong></span>
              <span>•</span>
              <span>평균단가: <strong className="text-white font-mono">₩{baselineAvgUnitPrice.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* 🌟 8-Row Baseline Summary Table (항상 기준값 유지) */}
          <div className="bg-black/30 backdrop-blur-md rounded-xl border border-white/15 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-white/10 text-[10.5px] font-black uppercase text-blue-200 border-b border-white/10">
                  <tr>
                    <th className="py-2 px-2.5 text-center w-9">No</th>
                    <th className="py-2 px-2.5 font-bold text-white min-w-[170px]">품명 / 부품명</th>
                    <th className="py-2 px-2 text-right font-black text-blue-300 min-w-[85px]">수량 (EA)</th>
                    <th className="py-2 px-2 text-right font-black text-indigo-300 min-w-[95px]">기준단가 (₩)</th>
                    <th className="py-2 px-2.5 text-right font-black text-white min-w-[115px]">공급가액 (합계금액)</th>
                    <th className="py-2 px-2 text-center font-bold text-blue-300 min-w-[70px]">비중 (%)</th>
                    <th className="py-2 px-2 text-right font-mono text-amber-200/90 min-w-[85px]">세액 (10%)</th>
                    <th className="py-2 px-2.5 text-right font-black text-emerald-300 min-w-[105px]">총 합계액 (1.1)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium text-xs">
                  {baselineSalesItems.map((item, idx) => {
                    const isFrt = FRT_INDICES.includes(idx);
                    const itemRatio = baselineTotalAmount > 0 ? ((item.amount / baselineTotalAmount) * 100).toFixed(1) : "0.0";

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
                      {baselineTotalQty.toLocaleString()} EA
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-indigo-200 text-[11px]">
                      평균 ₩{baselineAvgUnitPrice.toLocaleString()}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono text-white text-xs sm:text-sm font-black">
                      ₩ {baselineTotalAmount.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-blue-200 font-black text-[11px]">
                      100.0%
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-amber-300 text-[11px]">
                      ₩ {baselineTotalTax.toLocaleString()}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono text-emerald-300 text-xs sm:text-sm font-black">
                      ₩ {baselineTotalGross.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 2. [한울 {N}월 매출금액] 깔끔한 한줄짜리 금액 입력 패널 */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-3 sm:p-3.5 rounded-2xl border border-indigo-500/40 shadow-md flex items-center gap-3">
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

      {/* ========================================================================= */}
      {/* 🌟 3. [단가재수정 및 실시간 자동계산 패널] 단순화된 FRT & RR 입력 박스 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Top Header */}
        <div className="p-3 sm:p-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>9BQC 8가지 항목 FRT / RR 일괄 단가입력 및 실시간 자동계산</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ⚡ FRT(3·4번 적용), RR(1·2·5·6·7·8번 적용) 단가를 입력하면 실시간 자동 계산됩니다.
              </p>
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

        {/* 🌟 단순화된 FRT & RR 2개 입력창 (User Sketch 스타일) */}
        <div className="p-3 sm:p-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
            {/* 1) FRT : [ 000 ] 원 */}
            <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border-2 border-blue-400 dark:border-blue-500 shadow-2xs">
              <span className="font-black text-blue-700 dark:text-blue-300 text-sm sm:text-base whitespace-nowrap pl-1">
                FRT :
              </span>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={frtUnitPrice > 0 ? frtUnitPrice.toLocaleString() : ""}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleFrtPriceChange(e.target.value)}
                  placeholder="0"
                  className="w-full pr-8 pl-2 py-1 text-right rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-black text-base text-blue-900 dark:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-600 dark:text-slate-400 text-xs sm:text-sm pointer-events-none">
                  원
                </span>
              </div>
            </div>

            {/* 2) RR : [ 000 ] 원 */}
            <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border-2 border-purple-400 dark:border-purple-500 shadow-2xs">
              <span className="font-black text-purple-700 dark:text-purple-300 text-sm sm:text-base whitespace-nowrap pl-1">
                RR :
              </span>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={rrUnitPrice > 0 ? rrUnitPrice.toLocaleString() : ""}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleRrPriceChange(e.target.value)}
                  placeholder="0"
                  className="w-full pr-8 pl-2 py-1 text-right rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-black text-base text-purple-900 dark:text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-600 dark:text-slate-400 text-xs sm:text-sm pointer-events-none">
                  원
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 8 Items Read-Only Table */}
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

                {/* 2) 적용단가 */}
                <th className="py-2.5 px-2.5 text-right font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 min-w-[120px]">
                  적용 단가 (₩)
                </th>

                {/* 3) 합계금액 */}
                <th className="py-2.5 px-2.5 text-right font-black text-slate-900 dark:text-white bg-slate-200/60 dark:bg-slate-700/60 min-w-[130px]">
                  공급가액 (단가×수량)
                </th>

                {/* 4) 매출 비중 (%) */}
                <th className="py-2.5 px-2 text-center font-bold text-blue-600 dark:text-blue-400 min-w-[75px]">
                  비중 (%)
                </th>

                {/* 5) 부가세 10% */}
                <th className="py-2.5 px-2 text-right font-mono text-slate-500 dark:text-slate-400 min-w-[90px]">
                  세액 (10%)
                </th>

                {/* 6) 총액 */}
                <th className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200 min-w-[110px]">
                  총 합계액 (1.1)
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-xs">
              {salesItems.map((item, idx) => {
                const isFrt = FRT_INDICES.includes(idx);
                const itemRatio = totalSalesAmount > 0 ? ((item.amount / totalSalesAmount) * 100).toFixed(1) : "0.0";

                return (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* No */}
                    <td className="py-2 px-2.5 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Part Name with Group Badge */}
                    <td className="py-2 px-2.5 font-black text-slate-900 dark:text-white">
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

                    {/* 1) 수량 (고정 텍스트 뱃지) */}
                    <td className="py-2 px-2 text-right bg-slate-50/60 dark:bg-slate-800/40">
                      <div className="flex items-center justify-end gap-1 font-mono font-black text-slate-800 dark:text-slate-200 text-xs">
                        <span>{(Number(item.qty) || 0).toLocaleString()}</span>
                        <span className="text-[9.5px] text-slate-400 font-normal">EA</span>
                      </div>
                    </td>

                    {/* 2) 적용 단가 (FRT / RR 입력 연동 결과 표시) */}
                    <td className="py-2 px-2.5 text-right bg-indigo-50/40 dark:bg-indigo-950/20">
                      <div className="flex items-center justify-end gap-1 font-mono font-black text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                          isFrt
                            ? "bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                            : "bg-purple-50 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200 border border-purple-200 dark:border-purple-800"
                        }`}>
                          ₩ {(Number(item.unitPrice) || 0).toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* 3) 공급가액 (단가×수량) */}
                    <td className="py-2 px-2.5 text-right bg-slate-100/40 dark:bg-slate-800/30">
                      <span className="font-mono font-black text-slate-950 dark:text-white text-xs">
                        ₩ {(Number(item.amount) || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* 4) 매출 비중 (%) */}
                    <td className="py-2 px-2 text-center">
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black font-mono ${
                        isFrt
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60"
                          : "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/60"
                      }`}>
                        {itemRatio}%
                      </span>
                    </td>

                    {/* 5) 부가세 (10%) */}
                    <td className="py-2 px-2 text-right font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                      ₩ {(Number(item.taxAmount) || Math.round(Number(item.amount) * 0.1)).toLocaleString()}
                    </td>

                    {/* 6) 총액 (1.1) */}
                    <td className="py-2 px-2.5 text-right font-mono font-black text-slate-800 dark:text-slate-200 text-xs">
                      ₩ {(Number(item.totalAmount) || Math.round(Number(item.amount) * 1.1)).toLocaleString()}
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
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
