import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Save,
  RotateCcw,
  CheckCircle2,
  Download,
  Trash2,
  Receipt,
  Building2,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Eye,
  Columns2,
  Maximize2,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Plus
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import {
  STANDARD_EXPENSE_CATEGORIES,
  STANDARD_6_PRODUCTS,
  getHanulSettlementMonthData,
  saveHanulSettlementMonthData
} from "../services/hanulSettlementService";
import { convertFileToImages } from "../utils/fileToImageConverter";
import {
  parseHanulExpensesFromMultipleFiles,
  mergeExtractedExpensesWithState
} from "../utils/hanulExpenseParser";
import HanulDocumentImageViewer from "./HanulDocumentImageViewer";
import * as XLSX from "xlsx";

/**
 * Helper to renumber expense categories sequentially (1. ..., 2. ..., 3. ...)
 */
export const renumberExpenses = (items) => {
  if (!items || !Array.isArray(items)) return [];
  return items.map((item, idx) => {
    const newNum = idx + 1;
    const rawCat = item.category || "";
    // Strip existing leading number e.g. "1. ", "12. ", "4) "
    const cleanName = rawCat.replace(/^\d+\s*[\.\)]\s*/, "").trim();
    return {
      ...item,
      category: `${newNum}. ${cleanName || "공통비/공제 항목"}`
    };
  });
};

/**
 * Get current year-month in KST (e.g. "2026-09")
 */
export const getCurrentYearMonthKST = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 3600000));
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

/**
 * Get previous year-month (전월) based on baseMonth or current KST date (e.g. "2026-08")
 */
export const getPreviousYearMonth = (baseMonth) => {
  const target = baseMonth || getCurrentYearMonthKST();
  const [y, m] = target.split("-").map(Number);
  if (!y || !m) return "2026-08";
  const prevDate = new Date(y, m - 2, 1);
  const prevY = prevDate.getFullYear();
  const prevM = String(prevDate.getMonth() + 1).padStart(2, "0");
  return `${prevY}-${prevM}`;
};

/**
 * Generate month dropdown options starting from previous month (전월부터) without parentheses
 */
export const getHanulSettlementMonthOptions = () => {
  const currYM = getCurrentYearMonthKST();
  const [currY, currM] = currYM.split("-").map(Number);

  const options = [];
  // 전월부터 과거 12개월 목록 생성 (괄호 없이 순수 'YYYY년 MM월' 형태로 표시)
  for (let i = 1; i <= 12; i++) {
    const d = new Date(currY, currM - 1 - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const ym = `${y}-${m}`;
    options.push({
      ym,
      label: `${y}년 ${m}월`
    });
  }

  return options;
};

export const HanulSettlementModal = ({ isOpen, onClose, initialMonth }) => {
  const { formatAmount } = useCurrency() || { formatAmount: (v) => `₩${Number(v || 0).toLocaleString()}` };

  // 🌟 입력시점의 전월 데이터를 기본으로 표시 (Default: Previous Month)
  const defaultPrevMonth = useMemo(() => getPreviousYearMonth(), []);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || defaultPrevMonth);

  // Sync initialMonth on modal open
  useEffect(() => {
    if (isOpen) {
      setSelectedMonth(initialMonth || getPreviousYearMonth());
    }
  }, [isOpen, initialMonth]);

  // Current Month State
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [settlementDate, setSettlementDate] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoParsedBanner, setAutoParsedBanner] = useState(null); // { fileName, sheetName, appliedCount, totalExpense }

  // UI View Modes: "split" (기본: 좌측 항목입력 / 우측 증빙뷰어), "form" (항목만 크게), "imageOnly" (이미지만 크게)
  const [viewMode, setViewMode] = useState("split");
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [activeViewerAttId, setActiveViewerAttId] = useState(null);
  const [activeViewerPageIndex, setActiveViewerPageIndex] = useState(0);

  // File Upload & Conversion Progress State
  const [isConverting, setIsConverting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    percent: 0,
    currentFileIndex: 0,
    totalFiles: 0,
    currentFileName: "",
    statusText: "",
    stage: "idle" // "converting" | "saving" | "completed" | "idle"
  });
  const [conversionError, setConversionError] = useState("");
  const fileInputRef = useRef(null);

  // Keep a ref of latest values to prevent any lost inputs
  const latestStateRef = useRef({
    selectedMonth,
    products,
    expenses,
    attachments,
    settlementDate
  });

  useEffect(() => {
    latestStateRef.current = {
      selectedMonth,
      products,
      expenses,
      attachments,
      settlementDate
    };
  }, [selectedMonth, products, expenses, attachments, settlementDate]);

  // Available Month Dropdown Options (동적 월 목록 및 전월/당월 표기)
  const monthDropdownOptions = useMemo(() => getHanulSettlementMonthOptions(), []);

  // Load Month Data
  useEffect(() => {
    if (!isOpen) return;
    const data = getHanulSettlementMonthData(selectedMonth);
    if (data) {
      setProducts(data.products || []);
      setExpenses(renumberExpenses(data.expenses || []));
      setAttachments(data.attachments || []);
      setSettlementDate(data.settlementDate || `${selectedMonth}-28`);
      setStatus(data.status || "DRAFT");
    }
  }, [isOpen, selectedMonth]);

  // UI Filter: 금액이 없는 항목 숨김 (기본값: true - 금액 있는 항목만 표시)
  const [showOnlyWithAmount, setShowOnlyWithAmount] = useState(true);
  const [focusedExpenseId, setFocusedExpenseId] = useState(null);

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

  // 🌟 Visible Expenses: 금액이 없는 항목(0원/빈값)은 왼쪽 패널에서 숨김 (금액 > 0, 신규 추가 항목, 또는 현재 포커스/입력중인 항목 표시)
  const visibleExpenses = useMemo(() => {
    if (showOnlyWithAmount) {
      return expenses.filter((exp) => Number(exp.amount) > 0 || exp.isNewlyAdded || exp.id === focusedExpenseId);
    }
    return expenses;
  }, [expenses, showOnlyWithAmount, focusedExpenseId]);

  // Core Persistence Function: Always guarantees saving the latest data to storage & Firestore
  const persistCurrentData = useCallback(async (targetMonth = selectedMonth, overrides = {}) => {
    const currentExpenses = overrides.expenses !== undefined ? overrides.expenses : latestStateRef.current.expenses;
    const currentAttachments = overrides.attachments !== undefined ? overrides.attachments : latestStateRef.current.attachments;
    const currentProducts = overrides.products !== undefined ? overrides.products : latestStateRef.current.products;
    const currentSettlementDate = overrides.settlementDate !== undefined ? overrides.settlementDate : latestStateRef.current.settlementDate;

    const totalQty = currentProducts.reduce((s, p) => s + (Number(p.qty) || 0), 0);
    const supplyAmount = currentProducts.reduce((s, p) => s + (Number(p.unitPrice || 0) * Number(p.qty || 0)), 0);
    const taxAmount = Math.round(supplyAmount * 0.1);
    const totalWithTax = supplyAmount + taxAmount;
    const totalExpense = currentExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const netSettlement = totalWithTax > 0 ? (totalWithTax - totalExpense) : (totalExpense > 0 ? -totalExpense : 0);

    const monthData = {
      yearMonth: targetMonth,
      sheetCode: targetMonth.replace("-", "").slice(2),
      settlementDate: currentSettlementDate || `${targetMonth}-28`,
      status: totalExpense > 0 || totalQty > 0 ? "CONFIRMED" : "DRAFT",
      products: currentProducts,
      expenses: currentExpenses,
      attachments: currentAttachments,
      totalQty,
      supplyAmount,
      taxAmount,
      totalWithTax,
      totalExpense,
      netSettlement
    };

    await saveHanulSettlementMonthData(targetMonth, monthData);
    return monthData;
  }, [selectedMonth]);

  // Debounced Auto-Save: Whenever user stops typing for 600ms, automatically persist the latest values
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(async () => {
      await persistCurrentData(selectedMonth);
    }, 600);
    return () => clearTimeout(timer);
  }, [expenses, attachments, products, settlementDate, selectedMonth, isOpen, persistCurrentData]);

  // Handle Expense Change with thousands separator support
  const handleExpenseChange = (id, field, value) => {
    setExpenses((prev) => {
      const updated = prev.map((e) => {
        if (e.id !== id) return e;
        if (field === "amount") {
          const cleanStr = String(value).replace(/[^0-9]/g, "");
          const num = cleanStr === "" ? 0 : Number(cleanStr);
          return { ...e, amount: isNaN(num) ? 0 : num };
        }
        return { ...e, [field]: value };
      });
      return updated;
    });
  };

  // Immediate save on input blur
  const handleInputBlur = () => {
    persistCurrentData(selectedMonth);
  };

  // Add Custom Expense Item (No + icon on button)
  const handleAddExpenseItem = async () => {
    const newId = `exp_custom_${Date.now()}`;
    const nextCode = visibleExpenses.length + 1;
    const newItem = {
      id: newId,
      category: `${nextCode}. 신규 공통비/공제 항목`,
      amount: 0,
      note: "",
      isNewlyAdded: true
    };
    const updated = [...expenses, newItem];
    setExpenses(updated);
    await persistCurrentData(selectedMonth, { expenses: updated });
  };

  // Delete Expense Item
  const handleDeleteExpenseItem = async (id) => {
    if (!window.confirm("이 지출/공제 항목을 삭제하시겠습니까?")) return;
    
    const filtered = expenses.filter((e) => e.id !== id);
    setExpenses(filtered);
    await persistCurrentData(selectedMonth, { expenses: filtered });
  };

  // Handle File Upload, Expense Auto-Parsing & Fast Conversion to Image
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsConverting(true);
    setConversionError("");
    setUploadProgress({
      percent: 25,
      currentFileIndex: 1,
      totalFiles: files.length,
      currentFileName: files[0].name,
      statusText: `⚡ 지출내역 자동 분석 및 입력 중...`,
      stage: "converting"
    });

    // 🌟 1. INSTANT PARSE (< 50ms): Extract expenses immediately and show in left panel right away!
    let autoParsedExpenseResult = null;
    let finalExpenses = latestStateRef.current.expenses;
    try {
      autoParsedExpenseResult = await parseHanulExpensesFromMultipleFiles(files);
      if (autoParsedExpenseResult && autoParsedExpenseResult.items && autoParsedExpenseResult.items.length > 0) {
        const merged = mergeExtractedExpensesWithState(autoParsedExpenseResult, latestStateRef.current.expenses);
        finalExpenses = merged.expenses;
        setExpenses(finalExpenses);
        setAutoParsedBanner({
          fileName: merged.sourceFileName,
          sheetName: merged.sourceSheetName,
          appliedCount: merged.appliedCount,
          totalExpense: merged.totalExpense
        });
        // Immediately persist expenses to storage
        persistCurrentData(selectedMonth, { expenses: finalExpenses });
      }
    } catch (parseErr) {
      console.warn("Auto-parsing expenses error:", parseErr);
    }

    setUploadProgress({
      percent: 60,
      currentFileIndex: 1,
      totalFiles: files.length,
      currentFileName: files[0].name,
      statusText: `⚡ 증빙 뷰어 고속 이미지 변환 중...`,
      stage: "converting"
    });

    // 🌟 2. FAST PARALLEL CONVERSION: Convert files concurrently
    const conversionPromises = files.map(async (file) => {
      try {
        return await convertFileToImages(file);
      } catch (err) {
        console.error("File conversion error:", err);
        return null;
      }
    });

    const results = await Promise.all(conversionPromises);
    const newAttachments = results.filter((res) => res && res.pages?.length > 0);

    if (newAttachments.length > 0) {
      const mergedAttachments = [...latestStateRef.current.attachments, ...newAttachments];
      setAttachments(mergedAttachments);
      setActiveViewerAttId(newAttachments[0].id);
      setActiveViewerPageIndex(0);

      await persistCurrentData(selectedMonth, {
        attachments: mergedAttachments,
        expenses: finalExpenses
      });
    }

    const completionMsg = autoParsedExpenseResult
      ? `✨ [${autoParsedExpenseResult.fileName}]에서 ${autoParsedExpenseResult.items.length}개 지출 항목(₩${autoParsedExpenseResult.totalExpense.toLocaleString()}) 즉시 입력 완료!`
      : `✅ 총 ${files.length}개 파일 업로드 및 변환 완료!`;

    setUploadProgress({
      percent: 100,
      currentFileIndex: files.length,
      totalFiles: files.length,
      currentFileName: "",
      statusText: completionMsg,
      stage: "completed"
    });

    // Show completion toast
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);

    setTimeout(() => {
      setIsConverting(false);
      setUploadProgress({
        percent: 0,
        currentFileIndex: 0,
        totalFiles: 0,
        currentFileName: "",
        statusText: "",
        stage: "idle"
      });
    }, 1000);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Delete Attachment
  const handleDeleteAttachment = async (attId) => {
    const remaining = attachments.filter((a) => a.id !== attId);
    setAttachments(remaining);
    if (activeViewerAttId === attId) {
      if (remaining.length > 0) {
        setActiveViewerAttId(remaining[0].id);
        setActiveViewerPageIndex(0);
      } else {
        setActiveViewerAttId(null);
        setIsViewerModalOpen(false);
      }
    }
    await persistCurrentData(selectedMonth, { attachments: remaining });
  };

  // Open Full-Screen Image Viewer
  const handleOpenViewer = (attId = null, pageIdx = 0) => {
    if (attId) {
      setActiveViewerAttId(attId);
      setActiveViewerPageIndex(pageIdx);
    } else if (attachments.length > 0) {
      setActiveViewerAttId(attachments[0].id);
      setActiveViewerPageIndex(0);
    }
    setIsViewerModalOpen(true);
  };

  // Month Change: Save current month before switching
  const handleMonthChange = async (newMonth) => {
    if (newMonth === selectedMonth) return;
    await persistCurrentData(selectedMonth);
    setSelectedMonth(newMonth);
    setAutoParsedBanner(null);
  };

  // Explicit Save Current Month Data
  const handleSave = async () => {
    setIsAutoSaving(true);
    const saved = await persistCurrentData(selectedMonth);
    setStatus(saved.status);
    setIsAutoSaving(false);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  // Close Modal: Save latest values automatically on exit
  const handleModalClose = async () => {
    await persistCurrentData(selectedMonth);
    onClose();
  };

  // Reset All Expenses to 0
  const handleResetExpenses = async () => {
    if (!window.confirm("모든 지출/공제 금액을 0원으로 초기화하시겠습니까?")) return;
    const resetList = expenses.map((e) => ({ ...e, amount: 0 }));
    setExpenses(resetList);
    await persistCurrentData(selectedMonth, { expenses: resetList });
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportItems = expenses.filter(e => Number(e.amount) > 0);
    const targetItems = exportItems.length > 0 ? exportItems : expenses;

    const sheetData = [
      [`협력업체 (주)한울 ${selectedMonth} 공통비 및 지출 공제내역서`],
      [`정산월: ${selectedMonth}`, `정산일자: ${settlementDate}`, `업체명: (주)한울`],
      [],
      ["[공통비 및 지출 공제내역]"],
      ["No", "지출/공제 항목", "금액(원)", "세부내역/비고"],
      ...targetItems.map((e, idx) => [
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

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className={`relative w-full ${viewMode === "split" ? "max-w-[96vw] xl:max-w-7xl" : "max-w-5xl"} bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-emerald-500/50 flex flex-col max-h-[95vh] h-[92vh] overflow-hidden transition-all duration-200`}>
        {/* Top Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white border-b border-emerald-500/30 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-xl bg-emerald-600/90 text-white shadow-sm ring-1 ring-white/20 shrink-0">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-200" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm md:text-base font-black text-white tracking-tight truncate">
                  (주)한울 공제내역등록 • 공통비 및 지출 공제
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 shrink-0">
                  {status === "CONFIRMED" ? "✓ 등록완료" : "✏️ 작성중"}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleModalClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Controls: Dropdown Month Selector, View Mode Switches & Actions */}
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Left: Dropdown Month Selector */}
          <div className="flex items-center gap-2 min-w-0">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>정산월 :</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="px-2.5 py-1 rounded-xl border-2 border-emerald-500/60 bg-white dark:bg-slate-800 text-xs sm:text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
            >
              {monthDropdownOptions.map((opt) => (
                <option key={opt.ym} value={opt.ym}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Center: View Mode Toggle Tabs */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800/80 p-0.5 rounded-xl gap-0.5">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                viewMode === "split"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="좌측 항목 입력창과 우측 증빙 이미지 뷰어를 나란히 보며 작성"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>나란히 보기 (좌:항목 / 우:뷰어)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("form")}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                viewMode === "form"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="항목 입력창만 넓게 보기"
            >
              📝 항목만 보기
            </button>
            {attachments.length > 0 && (
              <button
                type="button"
                onClick={() => handleOpenViewer()}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer"
                title="변환된 증빙 이미지만 크게 보기"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>이미지만 보기</span>
              </button>
            )}
          </div>

          {/* Right: File Upload & Actions */}
          <div className="flex items-center gap-1.5 ml-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept=".pdf,.xlsx,.xls,.csv,image/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isConverting}
              className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1 shadow-sm shadow-emerald-600/30 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
              title="엑셀, PDF, 영수증 파일을 업로드하면 지출내역을 자동 분석하여 왼쪽 항목에 즉시 입력하고 우측 뷰어에 고화질 이미지로 표시합니다"
            >
              {isConverting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5 text-emerald-200" />
              )}
              <span>{isConverting ? "분석 및 변환중..." : "지출/증빙 파일 업로드 (자동분석)"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-2 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
              title="지출공제 엑셀 파일 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">엑셀</span>
            </button>

            <button
              type="button"
              onClick={handleResetExpenses}
              className="px-2 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
              title="모든 항목 금액을 0원으로 초기화"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">초기화</span>
            </button>
          </div>
        </div>

        {/* 🌟 Multi-File Upload & Real-Time Progress Bar Banner (숫자 + 진행률 그래프) */}
        {isConverting && (
          <div className="px-4 py-2 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white border-b border-emerald-500/40 flex flex-col gap-1.5 shrink-0 animate-fadeIn shadow-inner">
            {/* Row 1: File Info & Percentage Badge */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <div className="p-1 rounded-lg bg-emerald-500 text-slate-950 shrink-0 shadow-xs flex items-center justify-center">
                  {uploadProgress.stage === "completed" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 font-black" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <span className="text-xs font-black text-white truncate">
                    {uploadProgress.statusText}
                  </span>
                </div>
              </div>

              {/* Progress Percentage & File Counter Badge */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/40 flex items-center gap-1">
                  <span>{uploadProgress.percent}%</span>
                  {uploadProgress.totalFiles > 1 && (
                    <span className="text-[10px] font-bold text-slate-900/80">
                      ({uploadProgress.currentFileIndex}/{uploadProgress.totalFiles} 파일)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Row 2: Animated Progress Bar Graph */}
            <div className="w-full h-2 rounded-full bg-slate-800 border border-slate-700/80 overflow-hidden relative shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out relative ${
                  uploadProgress.stage === "completed"
                    ? "bg-gradient-to-r from-emerald-400 to-teal-300 shadow-md shadow-emerald-400/50"
                    : "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400"
                }`}
                style={{ width: `${Math.max(4, uploadProgress.percent)}%` }}
              >
                {/* Shimmer light reflection effect */}
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {conversionError && (
          <div className="px-4 py-1.5 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-300 dark:border-rose-800 flex items-center justify-between gap-2 text-xs font-bold text-rose-800 dark:text-rose-200 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{conversionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setConversionError("")}
              className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Attached Files & Converted Images Quick Badge Bar */}
        {attachments.length > 0 && (
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase shrink-0 flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-emerald-600" />
              <span>증빙 이미지 ({attachments.length}개):</span>
            </span>

            {attachments.map((att) => {
              const numPages = att.pages?.length || 1;
              const isSelected = activeViewerAttId === att.id;
              return (
                <div
                  key={att.id}
                  className={`flex items-center rounded-lg border shadow-2xs overflow-hidden shrink-0 transition-all ${
                    isSelected
                      ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-400"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveViewerAttId(att.id);
                      setActiveViewerPageIndex(0);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 cursor-pointer"
                    title={`클릭하여 우측 뷰어에 '${att.fileName}' 표시`}
                  >
                    {att.fileType === "pdf" ? (
                      <FileText className="w-3 h-3 text-rose-500 shrink-0" />
                    ) : att.fileType === "excel" ? (
                      <FileSpreadsheet className="w-3 h-3 text-emerald-500 shrink-0" />
                    ) : (
                      <ImageIcon className="w-3 h-3 text-blue-500 shrink-0" />
                    )}
                    <span className="truncate max-w-[120px] sm:max-w-[160px] text-[11px]">{att.fileName}</span>
                    <span className="px-1 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {numPages}p
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="px-1 py-0.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer border-l border-slate-100 dark:border-slate-700"
                    title="증빙 삭제"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-0.5 rounded-lg border border-dashed border-emerald-500/70 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-0.5 cursor-pointer shrink-0"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>추가</span>
            </button>
          </div>
        )}

        {/* KPI Summary Card: Total Expense & Active Items Filter */}
        <div className="px-3.5 py-2 bg-rose-50/60 dark:bg-rose-950/20 border-b border-rose-200/80 dark:border-rose-800/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {selectedMonth} 지출/공제 항목: <strong className="text-slate-950 dark:text-white font-black">{visibleExpenses.length}개</strong>
            </span>
            <button
              type="button"
              onClick={() => setShowOnlyWithAmount((prev) => !prev)}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                showOnlyWithAmount
                  ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shadow-2xs"
              }`}
              title={showOnlyWithAmount ? "금액 0원 항목 숨김 상태 (클릭 시 전체 항목 표시)" : "전체 항목 표시 상태 (클릭 시 금액 있는 항목만 표시)"}
            >
              <span>{showOnlyWithAmount ? "금액 있는 항목만 표시" : "전체 항목 표시"}</span>
              <span className="opacity-75 font-mono text-[10px]">
                ({showOnlyWithAmount ? `${visibleExpenses.length}개` : `${expenses.length}개`})
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-black text-rose-700 dark:text-rose-300">
              공통비 / 지출공제 총합계 :
            </span>
            <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
              - {formatAmount(calculatedTotals.totalExpense)}
            </span>
          </div>
        </div>

        {/* 🌟 Modal Main Content Area: Left = Input Items Panel / Right = Document Image Viewer Panel */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* 🌟 1. [LEFT PANEL]: Expense Input Grid (항목 패널이 왼쪽) - Slim & Compact for High Visibility */}
          <div className={`${viewMode === "split" ? "w-full md:w-[50%] lg:w-[48%] border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800" : "w-full"} p-2.5 sm:p-3 overflow-y-auto flex flex-col space-y-1.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700`}>
            
            {/* 🌟 Auto-Parsed Notification Banner */}
            {autoParsedBanner && (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/70 dark:via-teal-950/50 dark:to-indigo-950/50 border-2 border-emerald-500/80 dark:border-emerald-500 shadow-sm flex items-center justify-between gap-2 animate-fadeIn shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs shrink-0">
                    <Sparkles className="w-4 h-4 text-emerald-100" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-emerald-950 dark:text-emerald-100 truncate">
                        ✨ [{autoParsedBanner.fileName}{autoParsedBanner.sheetName ? ` • ${autoParsedBanner.sheetName}` : ""}] 지출내역 자동 분석 완료!
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[10.5px] font-black bg-emerald-500 text-slate-950 shadow-2xs">
                        총 {autoParsedBanner.appliedCount}개 항목 입력됨
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold mt-0.5">
                      공제총액: <strong className="font-mono font-black text-slate-950 dark:text-white">₩{autoParsedBanner.totalExpense.toLocaleString()}</strong> 이 왼쪽 항목에 자동 반영 및 저장되었습니다.
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
                  상단의 <strong>[지출/증빙 파일 업로드]</strong> 버튼으로 파일을 올리면 항목이 자동 분석되어 입력되며, 아래 <strong>[항목 직접 추가]</strong>를 눌러 직접 등록할 수도 있습니다.
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
              <div className={`grid grid-cols-1 ${viewMode === "form" ? "md:grid-cols-2" : "grid-cols-1"} gap-1.5`}>
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

            {/* Bottom Placement: 항목 직접 추가 Button (No + icon) */}
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

          {/* 🌟 2. [RIGHT PANEL]: Converted Document Image Viewer Panel (뷰어 패널은 오른쪽) with Wheel Zoom & Pan Scroll */}
          {viewMode === "split" && (
            <div className="w-full md:w-[50%] lg:w-[52%] p-2 sm:p-2.5 flex flex-col min-h-[360px] md:min-h-0 bg-slate-950">
              <HanulDocumentImageViewer
                attachments={attachments}
                activeAttachmentId={activeViewerAttId}
                initialPageIndex={activeViewerPageIndex}
                isEmbedded={true}
                onDeleteAttachment={handleDeleteAttachment}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-3.5 py-2 sm:px-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {isSavedToast && (
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black border border-emerald-300 animate-fadeIn flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>지출 공제내역이 안전하게 저장되었습니다!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black transition-all cursor-pointer"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm shadow-emerald-600/30 cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>지출 공제내역 저장</span>
            </button>
          </div>
        </div>
      </div>

      {/* Standalone Fullscreen Converted Document Image Viewer Lightbox */}
      <HanulDocumentImageViewer
        isOpen={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
        attachments={attachments}
        activeAttachmentId={activeViewerAttId}
        initialPageIndex={activeViewerPageIndex}
        onDeleteAttachment={handleDeleteAttachment}
      />
    </div>,
    document.body
  );
};
export default HanulSettlementModal;
