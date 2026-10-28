import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { useCurrency } from "../../../context/CurrencyContext";
import { useModalHistory } from "../../../utils/modalHistory";
import {
  getHanulSettlementMonthData,
  saveHanulSettlementMonthData,
  subscribeHanulSettlementStore
} from "../../../services/hanulSettlementService";
import { convertFileToImages } from "../../../utils/fileToImageConverter";
import {
  parseHanulExpensesFromMultipleFiles,
  mergeExtractedExpensesWithState
} from "../../../utils/hanulExpenseParser";
import {
  renumberExpenses,
  getPreviousYearMonth,
  getHanulSettlementMonthOptions
} from "./hanulSettlementHelpers";

/**
 * useHanulSettlementModalState
 * 한울 지출내역 등록 및 증빙 뷰어 상태 관리 훅
 */
export const useHanulSettlementModalState = ({ isOpen, onClose, initialMonth }) => {
  useModalHistory(isOpen, onClose, "hanulSettlementModal");
  const { formatAmount } = useCurrency() || {
    formatAmount: (v) => `₩${Number(v || 0).toLocaleString()}`
  };

  // 입력시점의 전월 데이터를 기본으로 표시 (Default: Previous Month)
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
  const [autoParsedBanner, setAutoParsedBanner] = useState(null);

  // UI View Modes: "split" | "form" | "imageOnly"
  const [viewMode, setViewMode] = useState("split");
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  useModalHistory(isViewerModalOpen, () => setIsViewerModalOpen(false), "hanulDocumentViewerModal");
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
    stage: "idle"
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

  // Available Month Dropdown Options
  const monthDropdownOptions = useMemo(() => getHanulSettlementMonthOptions(), []);

  // Load Month Data & Subscribe to real-time updates
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

    const unsub = subscribeHanulSettlementStore((store) => {
      if (store && store[selectedMonth]) {
        const d = store[selectedMonth];
        setProducts(d.products || []);
        setExpenses(renumberExpenses(d.expenses || []));
        setAttachments(d.attachments || []);
        setSettlementDate(d.settlementDate || `${selectedMonth}-28`);
        setStatus(d.status || "DRAFT");
      }
    });

    return () => unsub();
  }, [isOpen, selectedMonth]);

  // UI Filter: 금액이 없는 항목 숨김
  const [showOnlyWithAmount, setShowOnlyWithAmount] = useState(true);
  const [focusedExpenseId, setFocusedExpenseId] = useState(null);

  // Calculations
  const calculatedTotals = useMemo(() => {
    const totalQty = products.reduce((s, p) => s + (Number(p.qty) || 0), 0);
    const supplyAmount = products.reduce((s, p) => s + Number(p.unitPrice || 0) * Number(p.qty || 0), 0);
    const taxAmount = Math.round(supplyAmount * 0.1);
    const totalWithTax = supplyAmount + taxAmount;

    const totalExpense = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const netSettlement = totalWithTax > 0 ? totalWithTax - totalExpense : totalExpense > 0 ? -totalExpense : 0;

    return {
      totalQty,
      supplyAmount,
      taxAmount,
      totalWithTax,
      totalExpense,
      netSettlement
    };
  }, [products, expenses]);

  // Visible Expenses
  const visibleExpenses = useMemo(() => {
    if (showOnlyWithAmount) {
      return expenses.filter((exp) => Number(exp.amount) > 0 || exp.isNewlyAdded || exp.id === focusedExpenseId);
    }
    return expenses;
  }, [expenses, showOnlyWithAmount, focusedExpenseId]);

  // Core Persistence Function
  const persistCurrentData = useCallback(
    async (targetMonth = selectedMonth, overrides = {}) => {
      const currentExpenses = overrides.expenses !== undefined ? overrides.expenses : latestStateRef.current.expenses;
      const currentAttachments =
        overrides.attachments !== undefined ? overrides.attachments : latestStateRef.current.attachments;
      const currentProducts = overrides.products !== undefined ? overrides.products : latestStateRef.current.products;
      const currentSettlementDate =
        overrides.settlementDate !== undefined ? overrides.settlementDate : latestStateRef.current.settlementDate;

      const totalQty = currentProducts.reduce((s, p) => s + (Number(p.qty) || 0), 0);
      const supplyAmount = currentProducts.reduce((s, p) => s + Number(p.unitPrice || 0) * Number(p.qty || 0), 0);
      const taxAmount = Math.round(supplyAmount * 0.1);
      const totalWithTax = supplyAmount + taxAmount;
      const totalExpense = currentExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const netSettlement = totalWithTax > 0 ? totalWithTax - totalExpense : totalExpense > 0 ? -totalExpense : 0;

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
    },
    [selectedMonth]
  );

  // Handle Expense Change
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

  const handleInputBlur = () => {
    persistCurrentData(selectedMonth);
  };

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

  const handleDeleteExpenseItem = async (id) => {
    if (!window.confirm("이 지출/공제 항목을 삭제하시겠습니까?")) return;

    const filtered = expenses.filter((e) => e.id !== id);
    setExpenses(filtered);
    await persistCurrentData(selectedMonth, { expenses: filtered });
  };

  // Handle File Upload & Conversion
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

  const handleMonthChange = async (newMonth) => {
    if (newMonth === selectedMonth) return;
    await persistCurrentData(selectedMonth);
    setSelectedMonth(newMonth);
    setAutoParsedBanner(null);
  };

  const handleSave = async () => {
    setIsAutoSaving(true);
    const saved = await persistCurrentData(selectedMonth);
    setStatus(saved.status);
    setIsAutoSaving(false);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const handleModalClose = async () => {
    await persistCurrentData(selectedMonth);
    onClose();
  };

  const handleResetExpenses = async () => {
    if (!window.confirm("모든 지출/공제 금액을 0원으로 초기화하시겠습니까?")) return;
    const resetList = expenses.map((e) => ({ ...e, amount: 0 }));
    setExpenses(resetList);
    await persistCurrentData(selectedMonth, { expenses: resetList });
  };

  const handleExportExcel = () => {
    const exportItems = expenses.filter((e) => Number(e.amount) > 0);
    const targetItems = exportItems.length > 0 ? exportItems : expenses;

    const sheetData = [
      [`협력업체 (주)한울 ${selectedMonth} 공통비 및 지출 공제내역서`],
      [`정산월: ${selectedMonth}`, `정산일자: ${settlementDate}`, `업체명: (주)한울`],
      [],
      ["[공통비 및 지출 공제내역]"],
      ["No", "지출/공제 항목", "금액(원)", "세부내역/비고"],
      ...targetItems.map((e, idx) => [idx + 1, e.category, e.amount, e.note || ""]),
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

  return {
    formatAmount,
    selectedMonth,
    status,
    viewMode,
    setViewMode,
    isViewerModalOpen,
    setIsViewerModalOpen,
    activeViewerAttId,
    setActiveViewerAttId,
    activeViewerPageIndex,
    setActiveViewerPageIndex,
    isConverting,
    uploadProgress,
    conversionError,
    setConversionError,
    fileInputRef,
    monthDropdownOptions,
    attachments,
    showOnlyWithAmount,
    setShowOnlyWithAmount,
    focusedExpenseId,
    setFocusedExpenseId,
    calculatedTotals,
    visibleExpenses,
    expenses,
    autoParsedBanner,
    setAutoParsedBanner,
    isSavedToast,
    handleExpenseChange,
    handleInputBlur,
    handleAddExpenseItem,
    handleDeleteExpenseItem,
    handleFileUpload,
    handleDeleteAttachment,
    handleOpenViewer,
    handleMonthChange,
    handleSave,
    handleModalClose,
    handleResetExpenses,
    handleExportExcel
  };
};
