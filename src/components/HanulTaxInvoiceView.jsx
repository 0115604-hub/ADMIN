import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Calculator,
  Receipt,
  Car,
  Coins,
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Download,
  RotateCcw,
  Layers,
  Sparkles,
  HelpCircle,
  Check,
  Percent,
  Search,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Edit3
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useMonth } from "../context/MonthContext";
import {
  getHanulMonthData,
  saveHanulMonthData,
  subscribeHanulStore,
  getDefault9BQCSales,
  getDefaultHanulPurchases
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

  const [monthData, setMonthData] = useState(() => getHanulMonthData(activeMonth));
  const [isSaved, setIsSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRowId, setEditingRowId] = useState(null);
  const [newSalesModal, setNewSalesModal] = useState(false);

  // New sales item form state
  const [newItemForm, setNewItemForm] = useState({
    partName: "",
    partNumber: "",
    itemCode: "",
    process: "내수상품매출",
    qty: 1000,
    unitPrice: 10000,
    memo: ""
  });

  // Load and subscribe data on activeMonth changes
  useEffect(() => {
    const data = getHanulMonthData(activeMonth);
    setMonthData(data);

    const unsubscribe = subscribeHanulStore((store) => {
      if (store && store[activeMonth]) {
        setMonthData(store[activeMonth]);
      }
    });

    return () => unsubscribe();
  }, [activeMonth]);

  // Derived Values
  const salesItems = monthData?.salesItems || [];
  const purchaseItems = monthData?.purchaseItems || [];
  const invoiceConfig = monthData?.invoiceConfig || {
    invoiceAmount: 0,
    vatAmount: 0,
    totalInvoiceAmount: 0,
    issueDate: `${activeMonth}-30`,
    status: "발행완료",
    memo: ""
  };

  // 9BQC Sales Totals
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

  // Hanul Purchase Totals
  const totalPurchaseSupply = useMemo(() => {
    return purchaseItems.reduce((acc, cur) => acc + (Number(cur.supplyAmt) || 0), 0);
  }, [purchaseItems]);

  const totalPurchaseTax = useMemo(() => {
    return purchaseItems.reduce((acc, cur) => acc + (Number(cur.taxAmt) || 0), 0);
  }, [purchaseItems]);

  const totalPurchaseGross = useMemo(() => {
    return purchaseItems.reduce((acc, cur) => acc + (Number(cur.totalAmt) || 0), 0);
  }, [purchaseItems]);

  // Invoice Amounts
  const currentInvoiceAmount = Number(invoiceConfig.invoiceAmount) || 0;
  const currentVatAmount = Number(invoiceConfig.vatAmount) || Math.round(currentInvoiceAmount * 0.1);
  const currentTotalInvoice = Number(invoiceConfig.totalInvoiceAmount) || (currentInvoiceAmount + currentVatAmount);

  // Difference between 9BQC Sales & Tax Invoice Amount
  const salesInvoiceDiff = currentInvoiceAmount - totalSalesAmount;

  // Month Title
  const monthParts = (activeMonth || "2026-09").split("-");
  const monthTitle = `${monthParts[0] || "2026"}년 ${monthParts[1] || "09"}월`;

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

  // Auto-fill from 9BQC Sales
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

  // Auto-fill from Purchase amount
  const handleApplyPurchaseToInvoice = () => {
    const amount = totalPurchaseSupply;
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

  // Saved feedback animation
  const triggerSavedFeedback = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Handler: Update single 9BQC Sales Row (단가, 수량, 매출금액 상호 연동 수정)
  const handleUpdateSalesRow = (id, field, value) => {
    const updatedSales = salesItems.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item };

        if (field === "partName" || field === "partNumber" || field === "itemCode" || field === "process" || field === "memo") {
          updatedItem[field] = value;
        } else if (field === "qty") {
          const q = Math.max(0, Number(value) || 0);
          const p = Number(item.unitPrice) || 0;
          updatedItem.qty = q;
          updatedItem.amount = q * p;
          updatedItem.taxAmount = Math.round(q * p * 0.1);
          updatedItem.totalAmount = Math.round(q * p * 1.1);
        } else if (field === "unitPrice") {
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

  // Handler: Delete single 9BQC Row
  const handleDeleteSalesRow = (id) => {
    if (!confirm("해당 9BQC 품목을 삭제하시겠습니까?")) return;
    const updatedSales = salesItems.filter((item) => item.id !== id);
    const updated = { ...monthData, salesItems: updatedSales };
    setMonthData(updated);
    saveHanulMonthData(activeMonth, updated);
    triggerSavedFeedback();
  };

  // Handler: Add New 9BQC Item
  const handleAddNewItem = (e) => {
    e.preventDefault();
    if (!newItemForm.partName.trim()) {
      alert("부품명을 입력해 주세요.");
      return;
    }

    const q = Number(newItemForm.qty) || 0;
    const p = Number(newItemForm.unitPrice) || 0;
    const amount = q * p;

    const newItem = {
      id: `9bqc_${activeMonth}_${Date.now()}`,
      vehicle: "9BQC",
      partName: newItemForm.partName.trim(),
      partNumber: newItemForm.partNumber.trim() || "-",
      itemCode: newItemForm.itemCode.trim() || "-",
      process: newItemForm.process || "내수상품매출",
      qty: q,
      unitPrice: p,
      amount: amount,
      taxAmount: Math.round(amount * 0.1),
      totalAmount: Math.round(amount * 1.1),
      memo: newItemForm.memo || ""
    };

    const updatedSales = [...salesItems, newItem];
    const updated = { ...monthData, salesItems: updatedSales };
    setMonthData(updated);
    saveHanulMonthData(activeMonth, updated);
    setNewSalesModal(false);
    setNewItemForm({
      partName: "",
      partNumber: "",
      itemCode: "",
      process: "내수상품매출",
      qty: 1000,
      unitPrice: 10000,
      memo: ""
    });
    triggerSavedFeedback();
  };

  // Reset to Month Defaults
  const handleResetDefaults = () => {
    if (!confirm(`${activeMonth} 한울 세금계산서 및 9BQC 데이터를 초기 기본 데이터로 재설정하시겠습니까?`)) return;
    const defaultSales = getDefault9BQCSales(activeMonth);
    const defaultPurchases = getDefaultHanulPurchases(activeMonth);
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
        memo: `${activeMonth} 한울 9BQC 매입매출 세금계산서 발행 및 정산`
      },
      salesItems: defaultSales,
      purchaseItems: defaultPurchases,
      updatedAt: new Date().toISOString()
    };

    setMonthData(resetData);
    saveHanulMonthData(activeMonth, resetData);
    triggerSavedFeedback();
  };

  // Export CSV
  const handleExportCSV = () => {
    const filename = `${activeMonth}_한울세금계산서_9BQC매입매출정산.csv`;
    const rows = [
      ["[한울 세금계산서 및 9BQC 매입매출 정산서]"],
      [`기준월: ${monthTitle}`, `발행처: 한울`, `공급받는자: (주)오륙`, `발행일자: ${invoiceConfig.issueDate}`],
      [`세금계산서 발행금액(공급가액): ${currentInvoiceAmount}`, `부가세(10%): ${currentVatAmount}`, `합계금액: ${currentTotalInvoice}`, `상태: ${invoiceConfig.status}`],
      [],
      ["[1. 9BQC 매출 내역 (Sales)]"],
      ["No", "차종", "품명/부품명", "품번(Part No)", "품목코드", "공정/구분", "수량(EA)", "단가(원)", "공급가액(합계액)", "세액(10%)", "총액", "비고"],
      ...salesItems.map((item, idx) => [
        idx + 1,
        item.vehicle,
        `"${item.partName}"`,
        `"${item.partNumber}"`,
        `"${item.itemCode}"`,
        item.process,
        item.qty,
        item.unitPrice,
        item.amount,
        item.taxAmount,
        item.totalAmount,
        `"${item.memo || ""}"`
      ]),
      ["총계", "-", "-", "-", "-", "-", totalSalesQty, "-", totalSalesAmount, totalSalesTax, totalSalesGross, "-"],
      [],
      ["[2. 한울 매입 및 외주가공비 정산 (Purchase)]"],
      ["No", "구분", "항목/내역", "거래처", "공급가액(원)", "세액(원)", "합계금액(원)", "상태", "비고"],
      ...purchaseItems.map((item, idx) => [
        idx + 1,
        item.category,
        `"${item.item}"`,
        item.vendor,
        item.supplyAmt,
        item.taxAmt,
        item.totalAmt,
        item.status,
        `"${item.memo || ""}"`
      ]),
      ["총계", "-", "-", "-", totalPurchaseSupply, totalPurchaseTax, totalPurchaseGross, "-", "-"]
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

  // Filtered sales items by search
  const filteredSalesItems = useMemo(() => {
    if (!searchTerm.trim()) return salesItems;
    const term = searchTerm.toLowerCase();
    return salesItems.filter(
      (i) =>
        (i.partName || "").toLowerCase().includes(term) ||
        (i.partNumber || "").toLowerCase().includes(term) ||
        (i.itemCode || "").toLowerCase().includes(term) ||
        (i.process || "").toLowerCase().includes(term)
    );
  }, [salesItems, searchTerm]);

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn pb-14">
      {/* ========================================================================= */}
      {/* 🌟 1. 최상단: 월 선택 탭 & 빠른 액션 바 (Month Selection Bar) */}
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
                한울 세금계산서 및 9BQC 매출단가합계 관리
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                {monthTitle} 정산
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              월을 선택하면 <strong>매출단가합계 요약</strong>, <strong>단가·금액 수정 표</strong>, <strong>수기 세금계산서 발행금액</strong>이 순서대로 연동됩니다.
            </p>
          </div>
        </div>

        {/* 🗓️ 월 선택 버튼 탭 & 도구 */}
        <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
          {/* Month Selector Pills */}
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

          {/* Action Buttons */}
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
              title="이 달의 기본값으로 재설정"
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
      {/* 🌟 2. [제일 위] 1단계: "매출단가합계상세내역" 간단 요약 패널 */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-4 sm:p-5 rounded-3xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <h3 className="text-xs sm:text-sm font-black text-blue-100 flex items-center gap-1.5">
                <span>📊 {monthTitle} 9BQC 매출단가합계 간단 요약</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {salesItems.length}개 품목 실시간 집계
                </span>
              </h3>
            </div>
            <div className="text-[11px] text-slate-300 font-medium flex items-center gap-2">
              <span>평균단가: <strong className="text-white font-mono">₩{avgSalesUnitPrice.toLocaleString()}</strong></span>
              <span>•</span>
              <span>총 매출수량: <strong className="text-white font-mono">{totalSalesQty.toLocaleString()} EA</strong></span>
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            {/* 1) 9BQC 공급가액 합계 (매출금액) */}
            <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15">
              <span className="text-[11px] font-bold text-blue-200 block">🚗 9BQC 매출 공급가액 합계</span>
              <div className="text-lg sm:text-2xl font-black text-white font-mono mt-1 tracking-tight truncate">
                ₩ {totalSalesAmount.toLocaleString()}
              </div>
              <span className="text-[10px] text-blue-200/70 mt-0.5 block truncate">
                단가 × 수량 합산금액
              </span>
            </div>

            {/* 2) 부가세 (10%) */}
            <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15">
              <span className="text-[11px] font-bold text-amber-200 block">📑 부가세 (VAT 10%)</span>
              <div className="text-lg sm:text-2xl font-black text-amber-300 font-mono mt-1 tracking-tight truncate">
                ₩ {totalSalesTax.toLocaleString()}
              </div>
              <span className="text-[10px] text-amber-200/70 mt-0.5 block truncate">
                매출 공급가액의 10%
              </span>
            </div>

            {/* 3) 총 합계금액 (공급가 + 세액) */}
            <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15">
              <span className="text-[11px] font-bold text-emerald-300 block">💎 9BQC 총 합계액 (공급가+세액)</span>
              <div className="text-lg sm:text-2xl font-black text-emerald-300 font-mono mt-1 tracking-tight truncate">
                ₩ {totalSalesGross.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-200/70 mt-0.5 block truncate">
                공급가액 + 부가세 총합
              </span>
            </div>

            {/* 4) 등록 품목 및 수량 */}
            <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15">
              <span className="text-[11px] font-bold text-purple-200 block">📦 총 수량 및 품목수</span>
              <div className="text-lg sm:text-2xl font-black text-purple-200 font-mono mt-1 tracking-tight truncate">
                {totalSalesQty.toLocaleString()} <span className="text-xs font-normal text-white/70">EA</span>
              </div>
              <span className="text-[10px] text-purple-200/70 mt-0.5 block truncate">
                총 {salesItems.length}개 품목 등록됨
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 3. [그다음] 2단계: "매출단가합계상세내역" 단가수정 & 매출금액 조정가능한 표 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>9BQC 매출단가합계 상세내역 (단가·매출금액 수정 가능)</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                  ({filteredSalesItems.length}개 품목)
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                표 안의 <strong className="text-indigo-600 dark:text-indigo-400">단가(₩)</strong> 및 <strong className="text-blue-600 dark:text-blue-400">수량</strong>, <strong className="text-slate-900 dark:text-white">매출금액</strong>을 직접 수정하면 합계와 세액이 자동 연산되어 즉시 저장됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="품명 / 품번 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 sm:w-48"
              />
            </div>

            <button
              type="button"
              onClick={() => setNewSalesModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ 신규 품목 추가</span>
            </button>
          </div>
        </div>

        {/* Editable Interactive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100/80 dark:bg-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3 font-bold text-slate-700 dark:text-slate-200">차종</th>
                <th className="py-3 px-3 font-bold text-slate-900 dark:text-white min-w-[150px]">품명 / 부품명</th>
                <th className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">품번 (Part No)</th>
                <th className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">품목코드</th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-400">공정/구분</th>
                
                {/* 🌟 1) 매출 수량 (Editable Header) */}
                <th className="py-3 px-3 text-right font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 min-w-[110px]">
                  매출 수량 (EA) ✏️
                </th>

                {/* 🌟 2) 단가 (Editable Header) */}
                <th className="py-3 px-3 text-right font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 min-w-[120px]">
                  단가 (₩, 원) ✏️
                </th>

                {/* 🌟 3) 공급가액/매출금액 (Editable/Calculated Header) */}
                <th className="py-3 px-3 text-right font-black text-slate-900 dark:text-white bg-slate-200/60 dark:bg-slate-700/60 min-w-[140px]">
                  매출 공급가액 (₩) ✏️
                </th>

                {/* Tax (10%) */}
                <th className="py-3 px-3 text-right font-mono text-slate-500 dark:text-slate-400 min-w-[100px]">
                  세액 (10%)
                </th>

                {/* Gross Total */}
                <th className="py-3 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-200 min-w-[110px]">
                  총 합계액 (1.1)
                </th>

                <th className="py-3 px-3 text-center w-14">관리</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredSalesItems.length === 0 ? (
                <tr>
                  <td colSpan="12" className="py-12 text-center text-slate-400">
                    <p className="font-bold text-sm">등록된 9BQC 매출 품목이 없습니다.</p>
                    <p className="text-xs mt-1">상단 [+ 신규 품목 추가] 버튼을 눌러 부품을 추가해 주세요.</p>
                  </td>
                </tr>
              ) : (
                filteredSalesItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* No */}
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Vehicle */}
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {item.vehicle || "9BQC"}
                      </span>
                    </td>

                    {/* Part Name */}
                    <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white text-xs">
                      <input
                        type="text"
                        value={item.partName || ""}
                        onChange={(e) => handleUpdateSalesRow(item.id, "partName", e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent hover:bg-white dark:hover:bg-slate-800 font-bold focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white transition-all text-xs"
                      />
                    </td>

                    {/* Part Number */}
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                      <input
                        type="text"
                        value={item.partNumber || ""}
                        onChange={(e) => handleUpdateSalesRow(item.id, "partNumber", e.target.value)}
                        className="w-full px-1.5 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent hover:bg-white dark:hover:bg-slate-800 font-mono text-slate-600 dark:text-slate-300 text-[11px]"
                      />
                    </td>

                    {/* Item Code */}
                    <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                      <span className="px-1">{item.itemCode || "-"}</span>
                    </td>

                    {/* Process */}
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        {item.process || "내수상품매출"}
                      </span>
                    </td>

                    {/* 🌟 1) 매출 수량 (Editable Input) */}
                    <td className="py-2.5 px-3 text-right bg-blue-50/40 dark:bg-blue-950/20">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          min="0"
                          value={item.qty}
                          onChange={(e) => handleUpdateSalesRow(item.id, "qty", e.target.value)}
                          className="w-24 px-2 py-1 text-right rounded-lg border border-blue-200 dark:border-blue-800/80 bg-white dark:bg-slate-900 font-mono font-black text-blue-900 dark:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs shadow-2xs"
                        />
                        <span className="text-[10px] text-slate-400 font-normal">EA</span>
                      </div>
                    </td>

                    {/* 🌟 2) 단가 (Editable Input) */}
                    <td className="py-2.5 px-3 text-right bg-indigo-50/40 dark:bg-indigo-950/20">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs text-indigo-400 font-bold">₩</span>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateSalesRow(item.id, "unitPrice", e.target.value)}
                          className="w-24 px-2 py-1 text-right rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-slate-900 font-mono font-black text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-2xs"
                        />
                      </div>
                    </td>

                    {/* 🌟 3) 공급가액 / 매출금액 (Editable & Auto-calc Input) */}
                    <td className="py-2.5 px-3 text-right bg-slate-100/60 dark:bg-slate-800/40">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs text-slate-400 font-bold">₩</span>
                        <input
                          type="number"
                          min="0"
                          value={item.amount}
                          onChange={(e) => handleUpdateSalesRow(item.id, "amount", e.target.value)}
                          className="w-28 px-2 py-1 text-right rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-black text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs shadow-2xs"
                        />
                      </div>
                    </td>

                    {/* Tax Amount (10%) */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                      ₩ {(Number(item.taxAmount) || Math.round(Number(item.amount) * 0.1)).toLocaleString()}
                    </td>

                    {/* Gross Total (1.1) */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                      ₩ {(Number(item.totalAmount) || Math.round(Number(item.amount) * 1.1)).toLocaleString()}
                    </td>

                    {/* Delete Action */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteSalesRow(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="품목 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Total Row */}
            {filteredSalesItems.length > 0 && (
              <tfoot className="bg-slate-100/90 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                <tr>
                  <td colSpan="6" className="py-3.5 px-4 text-center text-xs tracking-wider">
                    9BQC 매출 합계 총계 (Total Sales)
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-blue-900 dark:text-blue-200 bg-blue-100/60 dark:bg-blue-950/50 text-xs sm:text-sm">
                    {totalSalesQty.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">EA</span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-indigo-900 dark:text-indigo-200 bg-indigo-100/60 dark:bg-indigo-950/50 text-xs sm:text-sm">
                    평균 ₩{avgSalesUnitPrice.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-950 dark:text-white bg-slate-200/80 dark:bg-slate-700/80 text-sm sm:text-base">
                    ₩ {totalSalesAmount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300 text-xs">
                    ₩ {totalSalesTax.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-black">
                    ₩ {totalSalesGross.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 4. [그다음] 3단계: "수기 세금계산서 발행금액" 입력 패널 */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-blue-700/40 shadow-xl relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          {/* Header Title */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/30 border border-blue-400/30 text-blue-300">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-blue-100 tracking-wide flex items-center gap-2">
                  <span>✍️ {monthTitle} 한울 세금계산서 수기 발행금액 입력</span>
                </h3>
                <p className="text-xs text-blue-200/70">
                  수기로 세금계산서 실제 발행 공급가액을 입력하면 부가세와 총액이 자동 계산되며, 9BQC 매출 합계와의 차액이 표시됩니다.
                </p>
              </div>
            </div>

            {/* Quick Auto-Apply Button */}
            <button
              type="button"
              onClick={handleApplySalesToInvoice}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-black border border-blue-400/40 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-md"
              title="9BQC 매출 합계액(공급가액)을 세금계산서 발행금액으로 즉시 동기화"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>9BQC 매출합계액 그대로 적용 (₩{totalSalesAmount.toLocaleString()})</span>
            </button>
          </div>

          {/* Interactive Input & Calculated Metrics */}
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

            {/* 2) VAT & Total Gross Summary (4 Cols) */}
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

            {/* 3) Issue Date, Status & Reconciliation (3 Cols) */}
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

              {/* Difference badge */}
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
      {/* 5. 한울 매입 및 외주 임가공비 정산 테이블 (Purchase / Subcontracting) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>한울 외주 매입 및 전기세 차감 정산 내역</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ({purchaseItems.length}건)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                한울에 지급할 9BQC 임가공비 및 공장 유틸리티(전기요금) 정산 공제 내역입니다.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 text-center w-12">No</th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300">계정과목</th>
                <th className="py-3 px-3 font-bold text-slate-900 dark:text-white min-w-[200px]">정산 항목 / 내역</th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300">협력사</th>
                <th className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">공급가액 (원)</th>
                <th className="py-3 px-3 text-right font-mono text-slate-500 dark:text-slate-400">세액 (원)</th>
                <th className="py-3 px-3 text-right font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20">
                  합계금액 (원)
                </th>
                <th className="py-3 px-3 text-center">정산상태</th>
                <th className="py-3 px-3">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {purchaseItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    등록된 매입 정산 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                purchaseItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        item.category === "임가공비"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {item.item}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                      {item.vendor || "한울"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                      ₩ {(Number(item.supplyAmt) || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                      ₩ {(Number(item.taxAmt) || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50/20 dark:bg-emerald-950/10">
                      ₩ {(Number(item.totalAmt) || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {item.status || "정산완료"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {item.memo || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-100/90 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700 text-xs">
              <tr>
                <td colSpan="4" className="py-3.5 px-4 text-center">
                  한울 매입 정산 총계 (Total Purchase)
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-slate-950 dark:text-white">
                  ₩ {totalPurchaseSupply.toLocaleString()}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                  ₩ {totalPurchaseTax.toLocaleString()}
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-emerald-900 dark:text-emerald-200 bg-emerald-100/50 dark:bg-emerald-950/40 text-sm">
                  ₩ {totalPurchaseGross.toLocaleString()}
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. 신규 9BQC 품목 추가 모달 */}
      {/* ========================================================================= */}
      {newSalesModal && (
        <div
          onClick={() => setNewSalesModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 flex justify-center items-center animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto animate-scaleUp cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    9BQC 신규 매출 품목 등록
                  </h3>
                  <p className="text-xs text-slate-400">
                    부품명, 품번, 수량, 단가를 입력하여 신규 9BQC 매출 라인을 추가합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewSalesModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  부품명 / 품명 (필수)
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 9BQC Glass run Center"
                  value={newItemForm.partName}
                  onChange={(e) => setNewItemForm({ ...newItemForm, partName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    품번 (Part Number)
                  </label>
                  <input
                    type="text"
                    placeholder="예: 42933960"
                    value={newItemForm.partNumber}
                    onChange={(e) => setNewItemForm({ ...newItemForm, partNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    품목코드 (Item Code)
                  </label>
                  <input
                    type="text"
                    placeholder="예: G1102-2758-00"
                    value={newItemForm.itemCode}
                    onChange={(e) => setNewItemForm({ ...newItemForm, itemCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    매출 수량 (EA)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newItemForm.qty}
                    onChange={(e) => setNewItemForm({ ...newItemForm, qty: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white text-right"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    단가 (₩, 원)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newItemForm.unitPrice}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white text-right"
                  />
                </div>
              </div>

              {/* Calculated Total in modal */}
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
                <span className="font-bold text-blue-950 dark:text-blue-200">합계액 (공급가액):</span>
                <span className="font-mono font-black text-sm text-blue-900 dark:text-blue-100">
                  ₩ {((Number(newItemForm.qty) || 0) * (Number(newItemForm.unitPrice) || 0)).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  비고 / 특이사항 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: 9월 신규 사양 한울 임가공"
                  value={newItemForm.memo}
                  onChange={(e) => setNewItemForm({ ...newItemForm, memo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewSalesModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>등록 완료</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
