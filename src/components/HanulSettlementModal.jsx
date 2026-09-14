import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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

export const HanulSettlementModal = ({ isOpen, onClose, initialMonth = "2026-08" }) => {
  const { formatAmount } = useCurrency() || { formatAmount: (v) => `₩${Number(v || 0).toLocaleString()}` };

  const [selectedMonth, setSelectedMonth] = useState(initialMonth || "2026-08");

  // Current Month State
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [settlementDate, setSettlementDate] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // UI View Modes: "form" (기본 입력), "split" (증빙 나란히 보기), "imageOnly" (이미지만 보기)
  const [viewMode, setViewMode] = useState("form");
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [activeViewerAttId, setActiveViewerAttId] = useState(null);
  const [activeViewerPageIndex, setActiveViewerPageIndex] = useState(0);

  // File Upload & Conversion State
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState("");
  const [conversionError, setConversionError] = useState("");
  const fileInputRef = useRef(null);

  // Keep a ref of latest values to prevent any race condition or lost inputs
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
      // Ensure expenses are cleanly renumbered on initial load
      setExpenses(renumberExpenses(data.expenses || []));
      setAttachments(data.attachments || []);
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

  // Immediate save on input blur (focus out) to ensure the very last typed value is saved instantly
  const handleInputBlur = () => {
    persistCurrentData(selectedMonth);
  };

  // Add Custom Expense Item (No + icon on button)
  const handleAddExpenseItem = async () => {
    const newId = `exp_custom_${Date.now()}`;
    const nextCode = expenses.length + 1;
    const newItem = {
      id: newId,
      category: `${nextCode}. 신규 공통비/공제 항목`,
      amount: 0,
      note: ""
    };
    const updated = [...expenses, newItem];
    setExpenses(updated);
    await persistCurrentData(selectedMonth, { expenses: updated });
  };

  // 🌟 Delete Expense Item & Auto-Renumber Sequentially (1, 2, 3...)
  const handleDeleteExpenseItem = async (id) => {
    if (!window.confirm("이 지출/공제 항목을 삭제하시겠습니까?\n(삭제 후 나머지 항목들이 자동으로 재정렬 및 재번호 부여됩니다.)")) return;
    
    // 1. Filter out deleted item
    const filtered = expenses.filter((e) => e.id !== id);
    // 2. Automatically renumber remaining items cleanly
    const reordered = renumberExpenses(filtered);
    
    setExpenses(reordered);
    // 3. Immediately persist the reordered list to guarantee latest values are saved
    await persistCurrentData(selectedMonth, { expenses: reordered });
  };

  // Handle File Upload & Conversion to Image
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsConverting(true);
    setConversionError("");
    setConversionStatus("업로드된 파일을 분석하고 이미지로 변환 중입니다...");

    const newAttachments = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setConversionStatus(`[${i + 1}/${files.length}] '${file.name}' 이미지 변환 중...`);
        const converted = await convertFileToImages(file, (progress) => {
          setConversionStatus(progress.message || "변환 진행 중...");
        });
        if (converted && converted.pages?.length > 0) {
          newAttachments.push(converted);
        }
      } catch (err) {
        console.error("File conversion error:", err);
        setConversionError(`'${file.name}' 변환 실패: ${err.message}`);
      }
    }

    if (newAttachments.length > 0) {
      const mergedAttachments = [...attachments, ...newAttachments];
      setAttachments(mergedAttachments);
      setActiveViewerAttId(newAttachments[0].id);
      setActiveViewerPageIndex(0);
      await persistCurrentData(selectedMonth, { attachments: mergedAttachments });
    }

    setIsConverting(false);
    setConversionStatus("");
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
      <div className={`relative w-full ${viewMode === "split" ? "max-w-7xl" : "max-w-5xl"} bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-emerald-500/50 flex flex-col max-h-[94vh] overflow-hidden transition-all duration-200`}>
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
            onClick={handleModalClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Controls: Dropdown Month Selector, View Mode Switches & Actions */}
        <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Left: Dropdown Month Selector */}
          <div className="flex items-center gap-2 min-w-0">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>정산 기준월 :</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl border-2 border-emerald-500/60 bg-white dark:bg-slate-800 text-xs sm:text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
            >
              {monthDropdownOptions.map((opt) => (
                <option key={opt.ym} value={opt.ym}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Center: View Mode Toggle Tabs */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setViewMode("form")}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                viewMode === "form"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              📝 항목 입력
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                viewMode === "split"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="증빙 이미지와 항목 입력을 한눈에 나란히 비교하며 입력"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>증빙 나란히 보기</span>
            </button>
            {attachments.length > 0 && (
              <button
                type="button"
                onClick={() => handleOpenViewer()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer"
                title="변환된 증빙 이미지만 크게 보기"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>이미지만 보기</span>
              </button>
            )}
          </div>

          {/* Right: File Upload & Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept=".pdf,.xlsx,.xls,.csv,image/*"
              className="hidden"
            />

            {/* Upload File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isConverting}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
              title="PDF, 엑셀, 영수증 사진을 업로드하면 자동으로 고화질 이미지로 변환됩니다"
            >
              {isConverting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5 text-emerald-200" />
              )}
              <span>{isConverting ? "이미지 변환중..." : "증빙 파일 업로드"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              title="지출공제 엑셀 파일 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">엑셀</span>
            </button>

            <button
              type="button"
              onClick={handleResetExpenses}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
              title="모든 항목 금액을 0원으로 초기화"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">초기화</span>
            </button>
          </div>
        </div>

        {/* Conversion Status / Progress Banner */}
        {isConverting && (
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-300 dark:border-emerald-800 flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
            <span>{conversionStatus}</span>
          </div>
        )}

        {/* Error Banner */}
        {conversionError && (
          <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-300 dark:border-rose-800 flex items-center justify-between gap-2 text-xs font-bold text-rose-800 dark:text-rose-200">
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
          <div className="px-3 sm:px-4 py-2 bg-slate-100/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase shrink-0 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>변환된 증빙 이미지 ({attachments.length}개 파일):</span>
            </span>

            {attachments.map((att) => {
              const numPages = att.pages?.length || 1;
              return (
                <div
                  key={att.id}
                  className="flex items-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden shrink-0 group hover:border-emerald-500 transition-all"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveViewerAttId(att.id);
                      setActiveViewerPageIndex(0);
                      if (viewMode !== "split") {
                        setIsViewerModalOpen(true);
                      }
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 cursor-pointer"
                    title={`클릭하여 '${att.fileName}' 변환 이미지 보기`}
                  >
                    {att.fileType === "pdf" ? (
                      <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    ) : att.fileType === "excel" ? (
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    )}
                    <span className="truncate max-w-[140px]">{att.fileName}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {numPages}장
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="px-1.5 py-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer border-l border-slate-100 dark:border-slate-700"
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
              className="px-2 py-1 rounded-xl border border-dashed border-emerald-500/70 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>추가</span>
            </button>
          </div>
        )}

        {/* KPI Summary Card: Total Expense */}
        <div className="px-4 py-2.5 bg-rose-50/60 dark:bg-rose-950/20 border-b border-rose-200/80 dark:border-rose-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {selectedMonth} 등록 항목: <strong className="text-slate-900 dark:text-white font-black">{expenses.length}개 항목</strong>
              {expenses.filter(e => e.amount > 0).length > 0 && (
                <span className="text-rose-600 dark:text-rose-400 ml-1">
                  ({expenses.filter(e => e.amount > 0).length}개 금액 입력됨)
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

        {/* Modal Main Content Area: Split-view or Form-only */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Panel: Converted Image Viewer (Visible in Split View Mode) */}
          {viewMode === "split" && (
            <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-2 sm:p-3 flex flex-col min-h-[350px] md:min-h-0 bg-slate-950">
              <HanulDocumentImageViewer
                attachments={attachments}
                activeAttachmentId={activeViewerAttId}
                initialPageIndex={activeViewerPageIndex}
                isEmbedded={true}
                onDeleteAttachment={handleDeleteAttachment}
              />
            </div>
          )}

          {/* Right Panel (or Full Panel): Expense Input Grid */}
          <div className={`${viewMode === "split" ? "w-full md:w-1/2" : "w-full"} p-3 sm:p-4 overflow-y-auto flex-1 space-y-3`}>
            {/* If no attachments and in split view, show quick upload guide */}
            {viewMode === "split" && attachments.length === 0 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-2xl border-2 border-dashed border-emerald-500/50 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/30 transition-all cursor-pointer text-center"
              >
                <UploadCloud className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-black text-slate-800 dark:text-slate-200 mb-0.5">
                  정산표 파일(PDF, 엑셀, 사진)을 업로드하여 좌측에 띄우세요
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  클릭하거나 파일을 드래그하면 즉시 고화질 이미지로 변환되어 표시됩니다.
                </p>
              </div>
            )}

            {/* Expense Items Grid */}
            <div className={`grid grid-cols-1 ${viewMode === "split" ? "sm:grid-cols-1" : "md:grid-cols-2"} gap-2.5`}>
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
                          onBlur={handleInputBlur}
                          onChange={(e) => handleExpenseChange(exp.id, "category", e.target.value)}
                          className="w-full px-1.5 py-0.5 rounded bg-transparent font-black text-xs sm:text-sm text-slate-900 dark:text-white border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteExpenseItem(exp.id)}
                        className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer shrink-0"
                        title="항목 삭제 (삭제 시 순서가 자동 재정렬됩니다)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Input Grid: Clean Amount and Remark */}
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
                            onBlur={handleInputBlur}
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
                          onBlur={handleInputBlur}
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
              onClick={handleModalClose}
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

      {/* Standalone Fullscreen Converted Document Image Viewer Lightbox */}
      <HanulDocumentImageViewer
        isOpen={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
        attachments={attachments}
        activeAttachmentId={activeViewerAttId}
        initialPageIndex={activeViewerPageIndex}
        onDeleteAttachment={handleDeleteAttachment}
      />
    </div>
  );
};
export default HanulSettlementModal;
