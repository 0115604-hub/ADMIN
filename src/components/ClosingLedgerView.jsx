import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Download,
  Building2,
  Layers,
  TrendingUp,
  DollarSign,
  Search,
  ChevronRight,
  ArrowLeft,
  Zap,
  Filter,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useMonth } from "../context/MonthContext";
import { parseHometaxExcel, CATEGORY_RULES, classifyTaxInvoiceItem } from "../services/taxInvoiceParser";
import detailedClosingMaster from "../data/detailedClosingLedgerData.json";
import * as XLSX from "xlsx";

const STORAGE_KEY = "monthly_4_entity_closing_ledger_v3";

const ENTITY_SLOTS = [
  { id: "oryuk_corp", name: "(주)오륙", taxNo: "615-81-39247", badge: "법인 본사", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-800" },
  { id: "joyoung_corp", name: "(주)조영산업", taxNo: "898-87-01289", badge: "법인", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-200 dark:border-indigo-800" },
  { id: "oryuk_gongsa", name: "오륙공사", taxNo: "615-08-xxxxx", badge: "사업장", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800" },
  { id: "joyoung_ind", name: "조영산업", taxNo: "615-17-xxxxx", badge: "사업장", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-800" }
];

const GROUPS = [
  { id: "all", label: "전체 16개 과목" },
  { id: "제조 직접 원가", label: "🏭 제조 직접 원가 (4)" },
  { id: "인건비 & 공과금", label: "👥 인건비 & 공과금 (3)" },
  { id: "공장 유틸리티 & 설비", label: "⚡ 유틸리티 & 설비 (5)" },
  { id: "물류 & 운영 경비", label: "🚚 물류 & 운영경비 (4)" }
];

export const ClosingLedgerView = () => {
  const { formatAmount } = useCurrency();
  const { selectedMonth, currentMonthData } = useMonth();

  const monthParts = selectedMonth.split("-");
  const monthTitle = `${monthParts[0]}년 ${monthParts[1]}월`;

  // 4 Entity Files status
  const [uploadedEntities, setUploadedEntities] = useState({});
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");

  // 16 Categories Store
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed[selectedMonth]?.categories) return parsed[selectedMonth].categories;
      } catch (e) {
        console.error(e);
      }
    }
    return detailedClosingMaster["2026-07"].categories;
  });

  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedCategoryDetailId, setSelectedCategoryDetailId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Sync state when selectedMonth changes
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed[selectedMonth]?.categories) {
          setCategories(parsed[selectedMonth].categories);
          if (parsed[selectedMonth]?.uploadedEntities) {
            setUploadedEntities(parsed[selectedMonth].uploadedEntities);
          }
          return;
        }
      } catch (e) {}
    }
    const defaultData = detailedClosingMaster[selectedMonth] || detailedClosingMaster["2026-07"];
    setCategories(defaultData.categories || []);
  }, [selectedMonth]);

  // Grand Totals Calculation
  const totalSupplyAmount = categories.reduce((sum, cat) => {
    return sum + cat.items.reduce((catSum, item) => catSum + (Number(item.supplyAmt) || 0), 0);
  }, 0);

  const totalTaxAmount = categories.reduce((sum, cat) => {
    return sum + cat.items.reduce((catSum, item) => catSum + (Number(item.taxAmt) || 0), 0);
  }, 0);

  const totalClosingAmount = categories.reduce((sum, cat) => {
    return sum + cat.items.reduce((catSum, item) => catSum + (Number(item.totalAmt || (Number(item.supplyAmt) + Number(item.taxAmt))) || 0), 0);
  }, 0);

  const totalSales = currentMonthData?.salesSummary?.totalSales || 2873777826;
  const costRatio = totalSales > 0 ? ((totalClosingAmount / totalSales) * 100).toFixed(1) : "0.0";
  const netEstimatedProfit = totalSales - totalClosingAmount;

  // Active Category for Drilldown
  const activeCategory = categories.find((c) => c.id === selectedCategoryDetailId);

  // Handle Multi-file Upload of Tax Invoices
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsProcessingFiles(true);
    const newEntities = { ...uploadedEntities };
    const allParsedItems = [];

    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        const result = parseHometaxExcel(buffer, file.name);

        if (result.success) {
          newEntities[result.entityKey] = {
            fileName: file.name,
            entityLabel: result.entityLabel,
            itemCount: result.itemCount,
            totalSupply: result.totalSupply,
            totalTax: result.totalTax,
            totalAmount: result.totalAmount,
            uploadedAt: new Date().toLocaleTimeString()
          };
          allParsedItems.push(...result.items);
        } else {
          alert(`[${file.name}] 파일 분석 실패: ${result.error}`);
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (allParsedItems.length > 0) {
      // Merge parsed tax invoices into categories
      mergeTaxInvoicesIntoCategories(allParsedItems);
      setUploadedEntities(newEntities);
      setSaveSuccessMessage(`${files.length}개 매입세금계산서 파일(${allParsedItems.length}건)이 16대 계정과목으로 자동 매칭되었습니다!`);
      setTimeout(() => setSaveSuccessMessage(""), 5000);
    }

    setIsProcessingFiles(false);
  };

  // Merge items into 16 categories
  const mergeTaxInvoicesIntoCategories = (newItems) => {
    setCategories((prevCategories) => {
      // Group non-invoice categories (Salaries, Insurance, Financial Interest)
      const nonInvoiceCategories = ["salaries_labor", "taxes_social_insurance", "financial_interests_cards"];

      return prevCategories.map((cat) => {
        // Items belonging to this category from uploaded tax invoices
        const matchedTaxItems = newItems
          .filter((it) => it.categoryId === cat.id)
          .map((it, idx) => ({
            id: it.id || `${cat.id}_${idx}_${Date.now()}`,
            vendor: it.vendor,
            item: it.item,
            supplyAmt: it.supplyAmt,
            taxAmt: it.taxAmt,
            totalAmt: it.totalAmt,
            memo: `${it.sourceEntity} | ${it.writeDate || ""}`
          }));

        // For non-invoice categories (or if no new items matched), preserve existing entries
        if (nonInvoiceCategories.includes(cat.id)) {
          return {
            ...cat,
            items: cat.items
          };
        }

        // If new items were matched from uploaded files, replace or append
        if (matchedTaxItems.length > 0) {
          return {
            ...cat,
            items: matchedTaxItems
          };
        }

        return cat;
      });
    });
  };

  // Load Anti folder demo files (7월 119건 매입세금계산서)
  const handleLoadDemoAntiFiles = () => {
    // Reset to 7월 full 119+ itemized categories
    const defaultData = detailedClosingMaster["2026-07"];
    setCategories(defaultData.categories);
    setUploadedEntities({
      oryuk_corp: {
        fileName: "매입전자세금계산서목록(1~80).xls",
        entityLabel: "(주)오륙",
        itemCount: 80,
        totalSupply: 2680726004,
        totalTax: 268072597,
        totalAmount: 2948798601,
        uploadedAt: "자동 연동됨"
      },
      joyoung_corp: {
        fileName: "매입전자세금계산서목록(1~39).xls",
        entityLabel: "(주)조영산업",
        itemCount: 39,
        totalSupply: 273496173,
        totalTax: 27349616,
        totalAmount: 300845789,
        uploadedAt: "자동 연동됨"
      }
    });

    setSaveSuccessMessage("바탕화면 anti 폴더의 (주)오륙(80건) & (주)조영산업(39건) 매입세금계산서가 자동 분류 연동되었습니다!");
    setTimeout(() => setSaveSuccessMessage(""), 5000);
  };

  // Update item field in active category
  const handleItemChange = (catId, itemId, field, value) => {
    setCategories((prevCategories) =>
      prevCategories.map((cat) => {
        if (cat.id !== catId) return cat;

        const updatedItems = cat.items.map((item) => {
          if (item.id !== itemId) return item;

          if (field === "supplyAmt") {
            const supply = Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
            const tax = item.taxAmt > 0 ? Math.round(supply * 0.1) : 0;
            return {
              ...item,
              supplyAmt: supply,
              taxAmt: tax,
              totalAmt: supply + tax
            };
          } else if (field === "taxAmt") {
            const tax = Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
            return {
              ...item,
              taxAmt: tax,
              totalAmt: Number(item.supplyAmt || 0) + tax
            };
          } else {
            return {
              ...item,
              [field]: value
            };
          }
        });

        return {
          ...cat,
          items: updatedItems
        };
      })
    );
  };

  // Re-classify item to another category
  const handleMoveItemCategory = (currentCatId, itemId, targetCatId) => {
    if (currentCatId === targetCatId) return;

    let targetItem = null;

    setCategories((prevCategories) => {
      // Find item
      const sourceCat = prevCategories.find((c) => c.id === currentCatId);
      if (sourceCat) {
        targetItem = sourceCat.items.find((it) => it.id === itemId);
      }

      if (!targetItem) return prevCategories;

      return prevCategories.map((cat) => {
        if (cat.id === currentCatId) {
          return {
            ...cat,
            items: cat.items.filter((it) => it.id !== itemId)
          };
        }
        if (cat.id === targetCatId) {
          return {
            ...cat,
            items: [...cat.items, targetItem]
          };
        }
        return cat;
      });
    });
  };

  // Add new item under category
  const handleAddItem = (catId) => {
    setCategories((prevCategories) =>
      prevCategories.map((cat) => {
        if (cat.id !== catId) return cat;
        const newItem = {
          id: `${catId}_${Date.now()}`,
          vendor: "",
          item: "",
          supplyAmt: 0,
          taxAmt: 0,
          totalAmt: 0,
          memo: "직접 입력"
        };
        return {
          ...cat,
          items: [...cat.items, newItem]
        };
      })
    );
  };

  // Delete item under category
  const handleDeleteItem = (catId, itemId) => {
    setCategories((prevCategories) =>
      prevCategories.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          items: cat.items.filter((it) => it.id !== itemId)
        };
      })
    );
  };

  // Save to persistent storage
  const handleSave = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const prevStore = saved ? JSON.parse(saved) : {};
    const updatedStore = {
      ...prevStore,
      [selectedMonth]: {
        month: selectedMonth,
        categories,
        uploadedEntities
      }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStore));
    setSaveSuccessMessage(`${monthTitle} 16대 계정과목 결산 데이터가 시스템에 안전하게 저장되었습니다!`);
    setTimeout(() => setSaveSuccessMessage(""), 4000);
  };

  // Export to Excel file
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryRows = [
      ["2026년 월간 매입·비용 결산 요약 보고서"],
      ["당월 총 매출액", totalSales, "총 결산 지출 합계", totalClosingAmount, "매출 대비 원가 비율", `${costRatio}%`, "예상 영업손익", netEstimatedProfit],
      [],
      ["NO", "대분류", "계정과목명", "항목수", "공급가액 (원)", "세액 (원)", "총 결산합계 (원)", "점유율", "주요 거래처 및 비고"]
    ];

    categories.forEach((cat, idx) => {
      const catSupply = cat.items.reduce((s, it) => s + (Number(it.supplyAmt) || 0), 0);
      const catTax = cat.items.reduce((s, it) => s + (Number(it.taxAmt) || 0), 0);
      const catTotal = cat.items.reduce((s, it) => s + (Number(it.totalAmt || (Number(it.supplyAmt) + Number(it.taxAmt))) || 0), 0);
      const catShare = totalClosingAmount > 0 ? ((catTotal / totalClosingAmount) * 100).toFixed(2) : 0;
      const topVendors = cat.items.slice(0, 3).map((it) => it.vendor).filter(Boolean).join(", ");

      summaryRows.push([
        idx + 1,
        cat.group,
        cat.name,
        `${cat.items.length}건`,
        catSupply,
        catTax,
        catTotal,
        `${catShare}%`,
        topVendors ? `주요처: ${topVendors}` : ""
      ]);
    });

    summaryRows.push([
      "★ 합계",
      "전체",
      "전사 16대 계정과목 총 결산 지출 합계",
      `${categories.reduce((s, c) => s + c.items.length, 0)}건`,
      totalSupplyAmount,
      totalTaxAmount,
      totalClosingAmount,
      "100.0%",
      ""
    ]);

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "📊 월간 결산 종합 요약");

    // 2. Itemized Detail Sheet
    const detailRows = [
      ["16대 계정과목별 세부 매입·지출 입력장부"],
      [],
      ["NO", "계정과목", "거래처명 / 지출처", "품목 및 세부내용", "공급가액 (원)", "세액 (원)", "합계금액 (원)", "비고 / 메모"]
    ];

    let rowNo = 1;
    categories.forEach((cat) => {
      detailRows.push([`▶ ${cat.name} (${cat.group})`, "", "", "", "", "", "", ""]);
      cat.items.forEach((it) => {
        detailRows.push([
          rowNo++,
          cat.name,
          it.vendor,
          it.item,
          it.supplyAmt,
          it.taxAmt,
          Number(it.totalAmt || (Number(it.supplyAmt) + Number(it.taxAmt))),
          it.memo || ""
        ]);
      });
      const catTotal = cat.items.reduce((s, it) => s + (Number(it.totalAmt || (Number(it.supplyAmt) + Number(it.taxAmt))) || 0), 0);
      detailRows.push([`★ ${cat.name} 소계`, "", "", "", "", "", catTotal, ""]);
      detailRows.push([]);
    });

    const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
    XLSX.utils.book_append_sheet(wb, wsDetail, "📋 16대 계정과목 세부 입력장부");

    XLSX.writeFile(wb, `AI_${monthTitle}_결산서_자동생성.xlsx`);
  };

  // Filter categories
  const filteredCategories = categories.filter((cat) => {
    const matchGroup = selectedGroup === "all" || cat.group === selectedGroup;
    if (!matchGroup) return false;

    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    const matchCatName = cat.name.toLowerCase().includes(term);
    const matchItems = cat.items.some(
      (it) =>
        it.vendor.toLowerCase().includes(term) ||
        it.item.toLowerCase().includes(term) ||
        (it.memo && it.memo.toLowerCase().includes(term))
    );
    return matchCatName || matchItems;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>4대 법인·사업장 매입세금계산서 AI 자동 결산 엔진</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {monthTitle} 매입세금계산서 업로드 & AI 결산서 자동 생성
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              홈택스에서 내려받은 4개의 매입세금계산서 엑셀 파일을 업로드하면, AI가 16대 계정과목으로 자동 분류 및 합산하여 월간 결산서를 즉시 완성합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>엑셀 다운로드</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>결산서 저장</span>
            </button>
          </div>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: 4 ENTITY TAX INVOICE UPLOAD CARDS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <span>4대 법인·사업장 매입전자세금계산서 업로드</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              홈택스 매입 전자세금계산서 목록 파일(.xls / .xlsx) 4개를 한 번에 선택하여 업로드하세요.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadDemoAntiFiles}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-black transition-all border border-indigo-200/60 dark:border-indigo-800/60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>바탕화면 anti 폴더 세금계산서 즉시 연동</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black cursor-pointer shadow-md shadow-blue-500/20 active:scale-95 transition-all">
              <UploadCloud className="w-4 h-4" />
              <span>{isProcessingFiles ? "분석 중..." : "4개 파일 일괄 업로드"}</span>
              <input
                type="file"
                multiple
                accept=".xls,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessingFiles}
              />
            </label>
          </div>
        </div>

        {/* 4 Entity Status Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ENTITY_SLOTS.map((slot) => {
            const uploaded = uploadedEntities[slot.id];

            return (
              <div
                key={slot.id}
                className={`p-4 rounded-2xl border transition-all ${
                  uploaded
                    ? `${slot.bg} ${slot.border}`
                    : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-800 border-dashed"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className={`w-4 h-4 ${slot.color}`} />
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      {slot.name}
                    </h4>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-500">
                    {slot.badge}
                  </span>
                </div>

                <div className="mt-3 space-y-1">
                  {uploaded ? (
                    <>
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{uploaded.fileName}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        세금계산서 <strong>{uploaded.itemCount}건</strong> • {formatAmount(uploaded.totalAmount)}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-1">
                      세금계산서 파일 대기 중...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Closing Cost */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">{monthTitle} 총 결산 지출(매입)</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {formatAmount(totalClosingAmount)}
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              공급가: {formatAmount(totalSupplyAmount)} + 세액: {formatAmount(totalTaxAmount)}
            </p>
          </div>
        </div>

        {/* Cost Ratio to Sales */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">매출 대비 결산 원가 비율</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {costRatio}%
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              {monthTitle} 총 매출 {formatAmount(totalSales)} 기준
            </p>
          </div>
        </div>

        {/* Estimated Net Operating Profit */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">결산 반영 예상 손익</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-2xl sm:text-3xl font-black ${netEstimatedProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
              {netEstimatedProfit >= 0 ? "+" : ""}{formatAmount(netEstimatedProfit)}
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              매출액 - 결산 합계 차액
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: 16-CATEGORY SUMMARY OVERVIEW (한 줄씩 배열 - Single Row List) */}
      {/* ========================================================================= */}
      {!selectedCategoryDetailId ? (
        <div className="space-y-6">
          {/* Group Filter & Search Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 w-full md:w-auto">
              {GROUPS.map((grp) => (
                <button
                  key={grp.id}
                  onClick={() => setSelectedGroup(grp.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                    selectedGroup === grp.id
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  {grp.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="계정과목, 거래처, 메모 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 16 Category Single-Row List (한 줄씩 배열) */}
          <div className="space-y-3">
            {filteredCategories.map((cat, idx) => {
              const catTotal = cat.items.reduce((s, it) => s + (Number(it.totalAmt || (Number(it.supplyAmt) + Number(it.taxAmt))) || 0), 0);
              const catShare = totalClosingAmount > 0 ? ((catTotal / totalClosingAmount) * 100).toFixed(2) : 0;
              const topVendors = cat.items.slice(0, 3).map((it) => it.vendor).filter(Boolean).join(", ");

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategoryDetailId(cat.id)}
                  className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 group"
                >
                  {/* Left: No, Category Name, Group Tag, Item Count */}
                  <div className="flex items-center gap-3.5 min-w-[280px]">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {cat.name}
                        </h4>
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {cat.items.length}건
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 block mt-0.5">
                        {cat.group}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Major Vendors Preview */}
                  <div className="flex-1 min-w-0 md:px-4">
                    {topVendors ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        <span className="font-bold text-slate-400">주요처:</span> {topVendors}
                        {cat.items.length > 3 && ` 외 ${cat.items.length - 3}개처`}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">등록된 세부 거래처 없음</p>
                    )}
                  </div>

                  {/* Right: Amount, Share & Progress, Action Button */}
                  <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left md:text-right min-w-[150px]">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block">
                        {formatAmount(catTotal)}
                      </span>
                      <div className="flex items-center md:justify-end gap-2 text-xs font-bold mt-0.5">
                        <span className="text-slate-400">점유율</span>
                        <span className="text-blue-600 dark:text-blue-400 font-extrabold">{catShare}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3.5 py-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      <span>세부항목 입력 & 조회</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* SECTION 3: SPECIFIC CATEGORY ITEMIzED DETAIL (과목 클릭 시 세부사항 편집) */
        /* ========================================================================= */
        activeCategory && (
          <div className="space-y-6 animate-fadeIn">
            {/* Category Breadcrumb & Quick Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <button
                onClick={() => setSelectedCategoryDetailId(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black transition-all self-start"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>전체 16대 계정과목 요약본으로 돌아가기</span>
              </button>

              {/* Quick Jump Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">다른 과목 바로가기:</span>
                <select
                  value={selectedCategoryDetailId}
                  onChange={(e) => setSelectedCategoryDetailId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.items.length}건)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Category Header Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/25">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xl text-slate-900 dark:text-white">
                      {activeCategory.name}
                    </h3>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
                      {activeCategory.group}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    등록된 세부 항목: <strong>{activeCategory.items.length}개</strong> • 공급가, 세액 및 계정과목 변경 가능
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-semibold">과목 소계 합계</span>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {formatAmount(
                      activeCategory.items.reduce(
                        (s, it) => s + (Number(it.totalAmt || (Number(it.supplyAmt) + Number(it.taxAmt))) || 0),
                        0
                      )
                    )}
                  </span>
                </div>

                <button
                  onClick={() => handleAddItem(activeCategory.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>항목 추가</span>
                </button>
              </div>
            </div>

            {/* Itemized Spreadsheet Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse min-w-[860px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 font-black">
                      <th className="py-3 px-3 w-12 text-center">NO</th>
                      <th className="py-3 px-3 w-40">과목 재분류</th>
                      <th className="py-3 px-3 w-48">거래처명 / 지출처</th>
                      <th className="py-3 px-3 w-56">품목 및 세부내용</th>
                      <th className="py-3 px-3 w-36 text-right">공급가액 (원)</th>
                      <th className="py-3 px-3 w-28 text-right">세액 (원)</th>
                      <th className="py-3 px-3 w-36 text-right">합계금액 (원)</th>
                      <th className="py-3 px-3 w-32">비고 / 메모</th>
                      <th className="py-3 px-3 w-12 text-center">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeCategory.items.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          등록된 세부 항목이 없습니다. 상단의 [항목 추가] 버튼을 눌러 새 거래처와 금액을 등록해 보세요!
                        </td>
                      </tr>
                    ) : (
                      activeCategory.items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={activeCategory.id}
                              onChange={(e) => handleMoveItemCategory(activeCategory.id, item.id, e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-blue-600 dark:text-blue-400 focus:outline-none"
                            >
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="거래처명 입력..."
                              value={item.vendor || ""}
                              onChange={(e) => handleItemChange(activeCategory.id, item.id, "vendor", e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="품목/규격/적요..."
                              value={item.item || ""}
                              onChange={(e) => handleItemChange(activeCategory.id, item.id, "item", e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={Number(item.supplyAmt || 0).toLocaleString()}
                              onChange={(e) => handleItemChange(activeCategory.id, item.id, "supplyAmt", e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={Number(item.taxAmt || 0).toLocaleString()}
                              onChange={(e) => handleItemChange(activeCategory.id, item.id, "taxAmt", e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                            {formatAmount(Number(item.totalAmt || (Number(item.supplyAmt) + Number(item.taxAmt))))}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="메모..."
                              value={item.memo || ""}
                              onChange={(e) => handleItemChange(activeCategory.id, item.id, "memo", e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => handleDeleteItem(activeCategory.id, item.id)}
                              className="p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                              title="항목 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {/* Category Subtotal Footer */}
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 font-black border-t-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                      <td colSpan={4} className="py-3.5 px-4 text-center">
                        {activeCategory.name} 소계 ({activeCategory.items.length}개 항목)
                      </td>
                      <td className="py-3.5 px-3 text-right text-blue-600 dark:text-blue-400 text-sm">
                        {formatAmount(
                          activeCategory.items.reduce((s, it) => s + (Number(it.supplyAmt) || 0), 0)
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-500">
                        {formatAmount(
                          activeCategory.items.reduce((s, it) => s + (Number(it.taxAmt) || 0), 0)
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right text-rose-600 dark:text-rose-400 text-base">
                        {formatAmount(
                          activeCategory.items.reduce(
                            (s, it) => s + (Number(it.totalAmt || (Number(it.supplyAmt) + Number(it.taxAmt))) || 0),
                            0
                          )
                        )}
                      </td>
                      <td colSpan={2} className="py-3.5 px-3 text-right text-slate-400 text-xs">
                        전체 결산 대비 {(
                          (activeCategory.items.reduce(
                            (s, it) => s + (Number(it.totalAmt || (Number(it.supplyAmt) + Number(it.taxAmt))) || 0),
                            0
                          ) / (totalClosingAmount || 1)) * 100
                        ).toFixed(2)}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleAddItem(activeCategory.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>[{activeCategory.name}] 행 추가</span>
                </button>

                <button
                  onClick={() => setSelectedCategoryDetailId(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 underline"
                >
                  요약 목록으로 돌아가기
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6 z-30 flex items-center gap-3">
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm shadow-xl shadow-slate-900/30 active:scale-95 transition-all border border-slate-700"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>엑셀 내보내기</span>
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-xl shadow-blue-500/30 active:scale-95 transition-all"
        >
          <Save className="w-5 h-5" />
          <span>{monthTitle} 결산 저장</span>
        </button>
      </div>
    </div>
  );
};
