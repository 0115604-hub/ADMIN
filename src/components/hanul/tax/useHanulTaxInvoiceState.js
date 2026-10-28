import { useState, useEffect, useMemo } from "react";
import { useCurrency } from "../../../context/CurrencyContext";
import { pushModalHistory, useModalHistory } from "../../../utils/modalHistory";
import { useMonth } from "../../../context/MonthContext";
import {
  getHanulMonthData,
  saveHanulMonthData,
  subscribeHanulStore,
  getDefault9BQCSales
} from "../../../services/hanulTaxInvoiceService";
import {
  getHanulSettlementMonthData,
  subscribeHanulSettlementStore,
  saveHanulSettlementMonthData
} from "../../../services/hanulSettlementService";
import {
  FRT_INDICES,
  RR_INDICES,
  getPreviousYearMonth,
  ensure8Items
} from "./hanulTaxConstants";

/**
 * useHanulTaxInvoiceState
 * 한울 세금계산서 및 8개 품목 단가/수량/매출 계산 및 동기화 상태 훅
 */
export const useHanulTaxInvoiceState = () => {
  const { formatAmount } = useCurrency() || {};
  const { selectedMonth: globalMonth = "2026-09", availableMonths = [] } = useMonth() || {};

  // 한울세금계산서 화면 진입 시 당월이 아닌 "전월"이 기본으로 먼저 표시됨
  const [localMonth, setLocalMonth] = useState(() => getPreviousYearMonth(globalMonth));
  const activeMonth = localMonth || "2026-08";

  // 정리본 팝업 모달 & 지출공제 모달 상태
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isExpenseSummaryModalOpen, setIsExpenseSummaryModalOpen] = useState(false);
  const [isAdminSettlementModalOpen, setIsAdminSettlementModalOpen] = useState(false);

  useModalHistory(isSummaryModalOpen, () => setIsSummaryModalOpen(false), "hanulSummaryModal");

  const handleOpenSummaryModal = () => {
    pushModalHistory("hanul_summary_modal");
    setIsSummaryModalOpen(true);
  };

  const handleSelectMonth = (m) => {
    setLocalMonth(m);
  };

  const [monthData, setMonthData] = useState(() => {
    const raw = getHanulMonthData(activeMonth);
    return ensure8Items(raw, activeMonth);
  });
  const [settlementData, setSettlementData] = useState(() => getHanulSettlementMonthData(activeMonth));
  const [isSaved, setIsSaved] = useState(false);

  // Load and subscribe data on activeMonth changes
  useEffect(() => {
    const raw = getHanulMonthData(activeMonth);
    const validated = ensure8Items(raw, activeMonth);
    setMonthData(validated);
    setSettlementData(getHanulSettlementMonthData(activeMonth));

    const unsubscribeTax = subscribeHanulStore((store) => {
      if (store && store[activeMonth]) {
        setMonthData(ensure8Items(store[activeMonth], activeMonth));
      }
    });

    const unsubscribeSettlement = subscribeHanulSettlementStore((store) => {
      if (store && store[activeMonth]) {
        setSettlementData(store[activeMonth]);
      }
    });

    return () => {
      unsubscribeTax();
      unsubscribeSettlement();
    };
  }, [activeMonth]);

  // 1. 기준 원본 데이터 (상단 요약패널 전용 - 단가를 수정해도 변경되지 않음)
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

  // 2. 수정 가능한 현재 데이터 (하단 자동계산/단가재수정 패널 전용)
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

  // 한울 {N}월 매출금액 (정산표 등록 데이터 및 세금계산서 실시간 연동)
  const prevMonthSales = useMemo(() => {
    if (settlementData?.totalExpense !== undefined && Number(settlementData.totalExpense) > 0) {
      return Number(settlementData.totalExpense);
    }
    if (monthData?.prevMonthSales !== undefined && Number(monthData.prevMonthSales) > 0) {
      return Number(monthData.prevMonthSales);
    }
    return monthData?.invoiceConfig?.invoiceAmount ? Number(monthData.invoiceConfig.invoiceAmount) : totalSalesAmount;
  }, [settlementData, monthData, totalSalesAmount]);

  // Month Title & Active Month Number
  const monthParts = (activeMonth || "2026-08").split("-");
  const monthTitle = `${monthParts[0] || "2026"}년 ${monthParts[1] || "08"}월`;
  const activeMonthNum = Number(monthParts[1]) || 8;

  // Feedback animation
  const triggerSavedFeedback = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Current FRT & RR Unit Price Values
  const frtUnitPrice = salesItems[2]?.unitPrice !== undefined ? Number(salesItems[2].unitPrice) : 2858;
  const rrUnitPrice = salesItems[0]?.unitPrice !== undefined ? Number(salesItems[0].unitPrice) : 11028;

  // 한울 매출금액 변경 핸들러
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

    // Sync to settlement store
    if (settlementData) {
      const updatedSettlement = {
        ...settlementData,
        totalExpense: amount,
        netSettlement: (Number(settlementData.totalWithTax) || 0) - amount
      };
      setSettlementData(updatedSettlement);
      saveHanulSettlementMonthData(activeMonth, updatedSettlement);
    }

    triggerSavedFeedback();
  };

  // FRT 단가 입력 핸들러
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

  // RR 단가 입력 핸들러
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

  return {
    formatAmount,
    availableMonths,
    activeMonth,
    monthTitle,
    activeMonthNum,
    handleSelectMonth,
    isSummaryModalOpen,
    setIsSummaryModalOpen,
    handleOpenSummaryModal,
    isExpenseSummaryModalOpen,
    setIsExpenseSummaryModalOpen,
    isAdminSettlementModalOpen,
    setIsAdminSettlementModalOpen,
    isSaved,
    handleExportCSV,
    handleResetDefaults,
    baselineSalesItems,
    baselineTotalQty,
    baselineTotalAmount,
    baselineTotalTax,
    baselineTotalGross,
    baselineAvgUnitPrice,
    salesItems,
    totalSalesQty,
    totalSalesAmount,
    totalSalesTax,
    totalSalesGross,
    avgSalesUnitPrice,
    prevMonthSales,
    settlementData,
    handlePrevMonthSalesChange,
    frtUnitPrice,
    rrUnitPrice,
    handleFrtPriceChange,
    handleRrPriceChange
  };
};
