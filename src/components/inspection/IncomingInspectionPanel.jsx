import { useState, useEffect, useMemo } from "react";
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  Layers,
  Component,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  ShieldAlert,
  FileSpreadsheet,
  RefreshCw,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Truck,
  Warehouse,
  FileText,
  Clock,
  PackageCheck,
  ArrowRight
} from "lucide-react";
import {
  INSPECTION_CATEGORIES,
  RECEIVING_STATUS,
  subscribeIncomingInspections,
  saveIncomingInspection,
  saveBatchIncomingInspections,
  deleteIncomingInspection,
  syncInspectionToFourMLedger,
  getTargetSuppliersConfig,
  saveTargetSuppliersConfig,
  DEFAULT_RAW_SUPPLIERS,
  DEFAULT_SUB_SUPPLIERS
} from "../../services/incomingInspectionService";
import { IncomingInspectionModal } from "./IncomingInspectionModal";
import { MonthlyPurchasesImportModal } from "./MonthlyPurchasesImportModal";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import { PANEL_THEMES, cleanTitleWithoutEmoji } from "../../config/panelThemeConfig";

export const IncomingInspectionPanel = ({
  currentProfile = null,
  onNavigateTab = null,
  customSettings = null,
  isInlineEditing = false,
  onUpdateDraft = null
}) => {
  const [inspections, setInspections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 🌟 3가지 대장 뷰 모드: "RECEIVING" (입고대장) | "INSPECTION" (수입검사) | "ALL" (통합)
  const [activeLedgerView, setActiveLedgerView] = useState("RECEIVING");

  // 카테고리 필터: ALL, RAW_MATERIAL, SUB_MATERIAL, PENDING_ONLY, REJECT_ONLY
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultMode, setModalDefaultMode] = useState("FULL");
  const [modalInitialCategory, setModalInitialCategory] = useState("RAW_MATERIAL");
  const [selectedItemForEdit, setSelectedItemForEdit] = useState(null);
  const [isPurchasesModalOpen, setIsPurchasesModalOpen] = useState(false);
  const [purchasesModalInitialTab, setPurchasesModalInitialTab] = useState("RAW_MATERIAL");
  const [previewImage, setPreviewImage] = useState(null);
  const [syncingId, setSyncingId] = useState(null);

  // 🌟 관리자 전용 수입검사 대상 업체 선택 및 영구 보존 설정
  const [targetSuppliers, setTargetSuppliers] = useState(() => getTargetSuppliersConfig());
  const [isSupplierFilterExpanded, setIsSupplierFilterExpanded] = useState(false);

  useEffect(() => {
    const handleConfigUpdated = (e) => {
      if (e?.detail) setTargetSuppliers(e.detail);
    };
    window.addEventListener("oryuk_incoming_suppliers_config_updated", handleConfigUpdated);
    return () => window.removeEventListener("oryuk_incoming_suppliers_config_updated", handleConfigUpdated);
  }, []);

  const handleToggleSupplier = (type, supplierName) => {
    const currentList = targetSuppliers[type] || [];
    const isSelected = currentList.includes(supplierName);
    const nextList = isSelected
      ? currentList.filter((s) => s !== supplierName)
      : [...currentList, supplierName];
    const nextConfig = {
      ...targetSuppliers,
      [type]: nextList
    };
    setTargetSuppliers(nextConfig);
    saveTargetSuppliersConfig(nextConfig);
  };

  // 실시간 수입검사 & 입고대장 데이터 구독
  useEffect(() => {
    const unsubscribe = subscribeIncomingInspections((data) => {
      setInspections(data);
    });
    return () => unsubscribe();
  }, []);

  // 커스텀 테마 & 타이틀 설정 계산
  const themeKey = customSettings?.theme || "indigo";
  const themeObj = PANEL_THEMES[themeKey] || PANEL_THEMES.indigo;
  const rawTitle = customSettings?.customTitle || "원부자재 입고 및 수입검사 통합대장";
  const titleValue = cleanTitleWithoutEmoji(rawTitle) || "원부자재 입고 및 수입검사 통합대장";
  const defaultBadgeText = currentProfile?.name
    ? `${currentProfile.name} ${currentProfile.title || "관리자"} 관제`
    : "자재·품질 통합관제";
  const badgeValue =
    customSettings?.customBadge !== undefined && customSettings.customBadge !== ""
      ? cleanTitleWithoutEmoji(customSettings.customBadge)
      : cleanTitleWithoutEmoji(defaultBadgeText);
  const isBadgeHidden = Boolean(customSettings?.hideBadge);

  // 통계 계산
  const stats = useMemo(() => {
    const total = inspections.length;
    const rawMaterialCount = inspections.filter((i) => i.category === "RAW_MATERIAL").length;
    const subMaterialCount = inspections.filter((i) => i.category === "SUB_MATERIAL").length;
    const passedCount = inspections.filter((i) => i.receivingStatus === "PASSED" || i.overallResult === "PASS").length;
    const pendingCount = inspections.filter((i) => i.receivingStatus === "PENDING" || i.overallResult === "PENDING").length;
    const rejectCount = inspections.filter((i) => i.receivingStatus === "REJECTED" || i.overallResult === "REJECT").length;
    const conditionalCount = inspections.filter((i) => i.receivingStatus === "CONDITIONAL" || i.overallResult === "CONDITIONAL").length;
    const synced4MCount = inspections.filter((i) => i.syncedTo4M).length;
    const inspectedTotal = passedCount + rejectCount + conditionalCount;
    const passRate = inspectedTotal > 0 ? Math.round((passedCount / inspectedTotal) * 100) : 100;

    return {
      total,
      rawMaterialCount,
      subMaterialCount,
      passedCount,
      pendingCount,
      rejectCount,
      conditionalCount,
      synced4MCount,
      passRate
    };
  }, [inspections]);

  // 필터링 적용
  const filteredList = useMemo(() => {
    return inspections.filter((item) => {
      // 카테고리 필터
      if (selectedCategoryTab === "RAW_MATERIAL" && item.category !== "RAW_MATERIAL") return false;
      if (selectedCategoryTab === "SUB_MATERIAL" && item.category !== "SUB_MATERIAL") return false;
      if (selectedCategoryTab === "PENDING_ONLY" && item.receivingStatus !== "PENDING" && item.overallResult !== "PENDING") return false;
      if (selectedCategoryTab === "REJECT_ONLY" && item.receivingStatus !== "REJECTED" && item.overallResult !== "REJECT" && item.overallResult !== "CONDITIONAL") return false;

      // 🌟 [핵심 요구사항]: 관리자가 지정한 수입검사 대상 업체 필터링
      // 원자재의 경우 targetSuppliers.rawMaterials에 등록된 공급사인지 검증
      if (item.category === "RAW_MATERIAL" && Array.isArray(targetSuppliers.rawMaterials) && targetSuppliers.rawMaterials.length > 0) {
        const itemSupp = String(item.supplier || "").trim();
        const isTarget = targetSuppliers.rawMaterials.some((s) => itemSupp.includes(s) || s.includes(itemSupp));
        if (!isTarget) return false;
      }
      // 부자재의 경우 targetSuppliers.subMaterials에 등록된 공급사인지 검증
      if (item.category === "SUB_MATERIAL" && Array.isArray(targetSuppliers.subMaterials) && targetSuppliers.subMaterials.length > 0) {
        const itemSupp = String(item.supplier || "").trim();
        const isTarget = targetSuppliers.subMaterials.some((s) => itemSupp.includes(s) || s.includes(itemSupp));
        if (!isTarget) return false;
      }

      // 검색어 필터 (품명, 공급사, LOT, 거래명세서, 보관창고)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = (item.itemName || "").toLowerCase().includes(term);
        const matchSupplier = (item.supplier || "").toLowerCase().includes(term);
        const matchLot = (item.lotNo || "").toLowerCase().includes(term);
        const matchSlip = (item.deliveryNoteNo || "").toLowerCase().includes(term);
        const matchLoc = (item.storageLocation || "").toLowerCase().includes(term);
        const matchInspector = (item.inspector || "").toLowerCase().includes(term);
        const matchReceiver = (item.receivedBy || "").toLowerCase().includes(term);
        if (!matchName && !matchSupplier && !matchLot && !matchSlip && !matchLoc && !matchInspector && !matchReceiver) {
          return false;
        }
      }

      return true;
    });
  }, [inspections, selectedCategoryTab, searchTerm]);

  // 신규 등록 열기 (입고+검사 동시)
  const handleOpenNewModal = (mode = "FULL", initialCategory = "RAW_MATERIAL") => {
    setSelectedItemForEdit(null);
    setModalDefaultMode(mode);
    setModalInitialCategory(initialCategory);
    setIsModalOpen(true);
  };

  // 상세/수정 열기
  const handleOpenEditModal = (item) => {
    setSelectedItemForEdit(item);
    setModalDefaultMode("FULL");
    setIsModalOpen(true);
  };

  // 저장 처리
  const handleSaveInspection = async (record) => {
    const inspectorName = currentProfile?.name || "이창엽";
    await saveIncomingInspection(record, inspectorName);
  };

  // 삭제 처리
  const handleDeleteInspection = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("해당 입고 및 검사 대장 기록을 정말 삭제하시겠습니까?")) return;
    await deleteIncomingInspection(id);
  };

  // 4M 실시간 대장 수동 즉시 이관
  const handleManualSync4M = async (item, e) => {
    e.stopPropagation();
    setSyncingId(item.id);
    try {
      const inspectorName = currentProfile?.name || "이창엽";
      const fourMId = await syncInspectionToFourMLedger(item, inspectorName);
      await saveIncomingInspection({
        ...item,
        syncedTo4M: true,
        fourMLedgerId: fourMId,
        syncedTo4MAt: new Date().toISOString()
      }, inspectorName);
      alert(`4M 공식대장에 성공적으로 이관되었습니다. (ID: ${fourMId})`);
    } catch (err) {
      console.error("[IncomingInspectionPanel] 4M sync error:", err);
      alert("4M 대장 이관 중 오류가 발생했습니다.");
    } finally {
      setSyncingId(null);
    }
  };

  // 엑셀 (CSV) 내보내기 (현재 뷰 모드에 따라 최적화된 양식 다운로드)
  const handleExportCSV = () => {
    if (filteredList.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    let headers = [];
    let rows = [];
    let fileName = "";

    if (activeLedgerView === "RECEIVING") {
      // 📋 원부자재 입고대장 표준 양식
      fileName = `원부자재_입고대장_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        "입고일자",
        "입고시간",
        "공장",
        "거래명세서번호",
        "공급사",
        "분류",
        "품명및규격",
        "입고LOT",
        "입고수량",
        "보관창고/위치",
        "입고담당자",
        "진행상태",
        "특기사항"
      ];
      rows = filteredList.map((it) => [
        it.receivingDate || it.date,
        it.receivingTime || it.time,
        it.plant || "삼랑진공장",
        `"${(it.deliveryNoteNo || "").replace(/"/g, '""')}"`,
        `"${(it.supplier || "").replace(/"/g, '""')}"`,
        it.category === "RAW_MATERIAL" ? "고무/압출 원소재" : "조립/체결 부자재",
        `"${(it.itemName || "").replace(/"/g, '""')}"`,
        it.lotNo || "",
        it.quantity || (it.quantityNum ? `${it.quantityNum} ${it.quantityUnit}` : ""),
        `"${(it.storageLocation || "").replace(/"/g, '""')}"`,
        it.receivedBy || "",
        it.receivingStatus === "PENDING" ? "검사대기" : it.receivingStatus === "PASSED" ? "정상입고" : "불합격반품",
        `"${(it.remarks || "").replace(/"/g, '""')}"`
      ]);
    } else {
      // 🔍 수입검사 성적서 표준 양식
      fileName = `수입검사_성적서대장_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        "검사일자",
        "공장",
        "분류",
        "품명및규격",
        "공급사",
        "입고LOT",
        "입고수량",
        "종합판정",
        "4M대장연동",
        "검사원",
        "주요실측요약",
        "특기사항"
      ];
      rows = filteredList.map((it) => {
        const measuredStr = (it.inspectionChecks || [])
          .map((c) => `${c.name}:${c.measured || '-'}(${c.result})`)
          .join(" | ");
        return [
          it.date,
          it.plant || "삼랑진공장",
          it.category === "RAW_MATERIAL" ? "고무/압출 원소재" : "조립/체결 부자재",
          `"${(it.itemName || "").replace(/"/g, '""')}"`,
          `"${(it.supplier || "").replace(/"/g, '""')}"`,
          it.lotNo || "",
          it.quantity || "",
          it.overallResult === "PASS" ? "합격" : it.overallResult === "REJECT" ? "불합격" : it.overallResult === "PENDING" ? "검사대기" : "조건부합격",
          it.syncedTo4M ? "4M등록완료" : "미등록",
          it.inspector || "",
          `"${measuredStr.replace(/"/g, '""')}"`,
          `"${(it.remarks || "").replace(/"/g, '""')}"`
        ];
      });
    }

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`w-full ${themeObj.cardBg} border-2 ${themeObj.borderClass} ${customSettings?.borderRadius || "rounded-2xl"} shadow-lg overflow-hidden transition-all duration-200 animate-fadeIn`}>
      {/* 1. Header Bar (울트라고밀도 스타일) */}
      <div className={`p-2.5 sm:p-3 border-b border-slate-700/50 ${themeObj.headerBg} flex flex-col md:flex-row md:items-center justify-between gap-2.5`}>
        {/* Title & Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1.5 rounded-lg bg-cyan-600/30 border border-cyan-400/30 text-cyan-300">
            <ClipboardCheck className="w-4 h-4 text-cyan-400" />
          </div>

          {/* 제목 인라인 편집 또는 디스플레이 */}
          {isInlineEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={customSettings?.customTitle !== undefined ? customSettings.customTitle : "원부자재 입고 및 수입검사 통합대장"}
                onChange={(e) => onUpdateDraft && onUpdateDraft({ customTitle: e.target.value })}
                className="bg-slate-900 border border-cyan-500 rounded px-2 py-0.5 text-xs text-white font-black focus:outline-none"
                placeholder="패널 타이틀"
              />
              <input
                type="text"
                value={customSettings?.customBadge !== undefined ? customSettings.customBadge : defaultBadgeText}
                onChange={(e) => onUpdateDraft && onUpdateDraft({ customBadge: e.target.value })}
                className="bg-slate-900 border border-cyan-500 rounded px-2 py-0.5 text-[10px] text-cyan-300 font-bold focus:outline-none w-28"
                placeholder="뱃지 명칭"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                {titleValue}
              </h2>
              {!isBadgeHidden && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${themeObj.accentBadge}`}>
                  {badgeValue}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 🌟 상단 뷰 모드 탭 (원자재(FMB) 입고대장 ↔ 부자재 입고대장 ↔ 수입검사 성적서 ↔ 통합) */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-700/60 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => {
              setActiveLedgerView("RECEIVING");
              setSelectedCategoryTab("RAW_MATERIAL");
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition ${
              activeLedgerView === "RECEIVING" && selectedCategoryTab === "RAW_MATERIAL"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>📋 원자재(FMB) 입고대장</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveLedgerView("RECEIVING");
              setSelectedCategoryTab("SUB_MATERIAL");
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition ${
              activeLedgerView === "RECEIVING" && selectedCategoryTab === "SUB_MATERIAL"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Component className="w-3.5 h-3.5 text-emerald-400" />
            <span>📦 부자재 입고대장</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveLedgerView("INSPECTION");
              setSelectedCategoryTab("ALL");
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition ${
              activeLedgerView === "INSPECTION"
                ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>🔍 수입검사 성적서</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveLedgerView("ALL");
              setSelectedCategoryTab("ALL");
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition ${
              activeLedgerView === "ALL"
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>📊 통합 전체</span>
          </button>
        </div>

        {/* Action Buttons: 2가지 분리된 신규 등록 버튼 (원자재 vs 부자재) + 조인주 매입내역 연동 */}
        <div className="flex items-center gap-1.5 self-end md:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            title={activeLedgerView === "RECEIVING" ? "입고대장 CSV 다운로드" : "수입검사대장 CSV 다운로드"}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-slate-300 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">엑셀</span>
          </button>

          {/* 🌟 조인주 매입내역 연동 버튼 */}
          <button
            type="button"
            onClick={() => {
              setPurchasesModalInitialTab(selectedCategoryTab === "SUB_MATERIAL" ? "SUB_MATERIAL" : "RAW_MATERIAL");
              setIsPurchasesModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/60 text-indigo-300 hover:text-white text-[11px] font-black shadow-sm transition active:scale-95 cursor-pointer"
            title="조인주 선임이 올린 매입매출 파일에서 구매처별 원자재/부자재 품목을 조회하고 입고대장으로 가져옵니다."
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>조인주 매입내역 연동</span>
          </button>

          <div className="flex items-center gap-1.5">
            {/* 1. 원자재(FMB) 신규 등록 버튼 */}
            <button
              type="button"
              onClick={() => handleOpenNewModal("FULL", "RAW_MATERIAL")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-black shadow-md shadow-blue-950/60 transition active:scale-95 cursor-pointer"
              title="고무/압출 원소재(FMB, CMB, 펠릿, 심재) 입고 및 수입검사 등록"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>원자재(FMB) 입고·검사</span>
            </button>

            {/* 2. 부자재 신규 등록 버튼 */}
            <button
              type="button"
              onClick={() => handleOpenNewModal("FULL", "SUB_MATERIAL")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-black shadow-md shadow-emerald-950/60 transition active:scale-95 cursor-pointer"
              title="조립/체결 부자재(클립, 브라켓, 테이프, 본드 등) 입고 및 수입검사 등록"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>부자재 입고·검사</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 통계 KPI 요약 바 (Ultra High-Density) */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 p-2 sm:p-2.5 bg-slate-950/60 border-b border-slate-800 text-xs">
        {/* 전체 건수 */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400">총 입고·검사</span>
          <span className="text-xs font-black text-white">{stats.total}건</span>
        </div>

        {/* 정상 입고 */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-900/50">
          <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            정상입고
          </span>
          <span className="text-xs font-black text-emerald-200">{stats.passedCount}건</span>
        </div>

        {/* 검사 대기 */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-900/50">
          <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            검사대기
          </span>
          <span className="text-xs font-black text-amber-200">{stats.pendingCount}건</span>
        </div>

        {/* 원소재 */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-blue-950/40 border border-blue-900/50">
          <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1">
            <Layers className="w-3 h-3 text-blue-400" />
            원소재
          </span>
          <span className="text-xs font-black text-blue-200">{stats.rawMaterialCount}건</span>
        </div>

        {/* 부자재 */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
            <Component className="w-3 h-3 text-slate-400" />
            부자재
          </span>
          <span className="text-xs font-black text-slate-200">{stats.subMaterialCount}건</span>
        </div>

        {/* 4M 연동 부적합 */}
        <div className="col-span-2 sm:col-span-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-rose-950/40 border border-rose-900/60">
          <span className="text-[11px] font-black text-rose-300 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            4M 부적합
          </span>
          <span className="text-xs font-black text-rose-200">
            {stats.rejectCount + stats.conditionalCount}건
          </span>
        </div>
      </div>

      {/* 2.5 🌟 관리자 수입검사 대상 업체 선택 토글 바 (영구 보존) */}
      <div className="mx-2.5 sm:mx-3 my-1.5 p-2.5 rounded-xl bg-slate-950/90 border border-indigo-500/40 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-indigo-300 flex items-center gap-1">
              <span>⚙️ 관리자 수입검사 대상 업체 필터</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">영구유지</span>
            </span>
            <span className="text-[11px] text-slate-400">
              (원자재 {targetSuppliers.rawMaterials?.length || 0}개사 / 부자재 {targetSuppliers.subMaterials?.length || 0}개사 선택됨)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSupplierFilterExpanded(!isSupplierFilterExpanded)}
            className="px-2 py-0.5 rounded-md bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-[11px] font-bold cursor-pointer transition flex items-center gap-1"
          >
            <span>{isSupplierFilterExpanded ? "▲ 업체 설정 접기" : "▼ 대상 업체 선택/수정"}</span>
          </button>
        </div>

        {isSupplierFilterExpanded && (
          <div className="pt-2 border-t border-slate-800 space-y-3 animate-fadeIn text-xs">
            {/* 원자재 업체 목록 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-300 text-[11px] flex items-center gap-1">
                  <Layers className="w-3 h-3 text-blue-400" />
                  원자재 납품 업체 (선택된 업체만 아래 대장에 노출)
                </span>
                <span className="text-[10px] text-slate-500">※ 미선택 업체는 목록에서 숨겨집니다.</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {DEFAULT_RAW_SUPPLIERS.map((supp) => {
                  const checked = (targetSuppliers.rawMaterials || []).includes(supp);
                  return (
                    <label
                      key={supp}
                      onClick={() => handleToggleSupplier("rawMaterials", supp)}
                      className={`px-2 py-1 rounded-lg border text-xs font-bold cursor-pointer transition flex items-center gap-1.5 select-none ${
                        checked
                          ? "bg-blue-600/30 text-blue-200 border-blue-400 shadow-2xs"
                          : "bg-slate-900 text-slate-500 border-slate-800 opacity-60 hover:opacity-90"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="rounded accent-blue-500 pointer-events-none"
                      />
                      <span>{supp}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 부자재 업체 목록 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 text-[11px] flex items-center gap-1">
                  <Component className="w-3 h-3 text-emerald-400" />
                  부자재 납품 업체 (선택된 업체만 아래 대장에 노출)
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {DEFAULT_SUB_SUPPLIERS.map((supp) => {
                  const checked = (targetSuppliers.subMaterials || []).includes(supp);
                  return (
                    <label
                      key={supp}
                      onClick={() => handleToggleSupplier("subMaterials", supp)}
                      className={`px-2 py-1 rounded-lg border text-xs font-bold cursor-pointer transition flex items-center gap-1.5 select-none ${
                        checked
                          ? "bg-emerald-600/30 text-emerald-200 border-emerald-400 shadow-2xs"
                          : "bg-slate-900 text-slate-500 border-slate-800 opacity-60 hover:opacity-90"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="rounded accent-emerald-500 pointer-events-none"
                      />
                      <span>{supp}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. 필터 및 검색 바 */}
      <div className="p-2 sm:p-2.5 bg-slate-900/80 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
        {/* 필터 칩 */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCategoryTab("ALL")}
            className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
              selectedCategoryTab === "ALL"
                ? "bg-slate-700 text-white shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            전체 ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryTab("RAW_MATERIAL")}
            className={`px-2 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
              selectedCategoryTab === "RAW_MATERIAL"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-blue-300/80 hover:text-blue-200 hover:bg-blue-950/60"
            }`}
          >
            <Layers className="w-3 h-3" />
            고무/압출 원소재 ({stats.rawMaterialCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryTab("SUB_MATERIAL")}
            className={`px-2 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
              selectedCategoryTab === "SUB_MATERIAL"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-300/80 hover:text-emerald-200 hover:bg-emerald-950/60"
            }`}
          >
            <Component className="w-3 h-3" />
            조립/체결 부자재 ({stats.subMaterialCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryTab("PENDING_ONLY")}
            className={`px-2 py-1 rounded-md text-[11px] font-black transition flex items-center gap-1 ${
              selectedCategoryTab === "PENDING_ONLY"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-amber-400 hover:text-amber-300 hover:bg-amber-950/60"
            }`}
          >
            <Clock className="w-3 h-3" />
            검사대기건 ({stats.pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryTab("REJECT_ONLY")}
            className={`px-2 py-1 rounded-md text-[11px] font-black transition flex items-center gap-1 ${
              selectedCategoryTab === "REJECT_ONLY"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-rose-400/90 hover:text-rose-300 hover:bg-rose-950/60"
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            🚨 4M 부적합건 ({stats.rejectCount + stats.conditionalCount})
          </button>
        </div>

        {/* 검색창 */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="품명, 송장, 공급사, LOT, 창고 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
          />
        </div>
      </div>

      {/* 4. 고밀도 대장 테이블 (선택된 뷰 모드에 따라 컬럼 동적 최적화) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* ======================= CASE 1: 원부자재 입고대장 모드 ======================= */}
          {activeLedgerView === "RECEIVING" && (
            <>
              <thead className="bg-slate-900/90 text-slate-300 border-b border-slate-800 font-bold text-[11px]">
                <tr>
                  <th className="py-2 px-2.5 w-24">입고일시</th>
                  <th className="py-2 px-2.5 w-24">송장번호</th>
                  <th className="py-2 px-2.5 w-20">공장</th>
                  <th className="py-2 px-2.5 w-24">분류</th>
                  <th className="py-2 px-2.5">품명 및 규격</th>
                  <th className="py-2 px-2.5 w-28">공급사</th>
                  <th className="py-2 px-2.5 w-28">입고 LOT</th>
                  <th className="py-2 px-2.5 w-24 text-right">입고수량</th>
                  <th className="py-2 px-2.5 w-32">보관 창고 / 위치</th>
                  <th className="py-2 px-2.5 w-20">입고자</th>
                  <th className="py-2 px-2.5 w-24 text-center">진행 상태</th>
                  <th className="py-2 px-2.5 w-28 text-center">수입검사 조치</th>
                  <th className="py-2 px-2 w-16 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-[11px]">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-500">
                      등록된 원부자재 입고 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => {
                    const isRaw = item.category === "RAW_MATERIAL";
                    const isPending = item.receivingStatus === "PENDING" || item.overallResult === "PENDING";
                    const isPassed = item.receivingStatus === "PASSED" || item.overallResult === "PASS";
                    const isReject = item.receivingStatus === "REJECTED" || item.overallResult === "REJECT";
                    const isCond = item.receivingStatus === "CONDITIONAL" || item.overallResult === "CONDITIONAL";

                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleOpenEditModal(item)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        {/* 입고일시 */}
                        <td className="py-2 px-2.5 text-slate-300 font-medium whitespace-nowrap">
                          <div>{item.receivingDate || item.date}</div>
                          <div className="text-[10px] text-slate-500">{item.receivingTime || item.time || "09:30"}</div>
                        </td>

                        {/* 송장번호 */}
                        <td className="py-2 px-2.5 text-slate-300 font-mono text-[10px] whitespace-nowrap">
                          {item.deliveryNoteNo || "-"}
                        </td>

                        {/* 공장 */}
                        <td className="py-2 px-2.5 text-slate-400 whitespace-nowrap">
                          {item.plant || "삼랑진"}
                        </td>

                        {/* 분류 */}
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          {isRaw ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1 w-fit">
                              <Layers className="w-2.5 h-2.5" />
                              원소재
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 w-fit">
                              <Component className="w-2.5 h-2.5" />
                              부자재
                            </span>
                          )}
                        </td>

                        {/* 품명 및 규격 */}
                        <td className="py-2 px-2.5 font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{item.itemName}</span>
                            {item.itemType && (
                              <span className="text-[10px] font-normal text-slate-400">
                                ({item.itemType})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 공급사 */}
                        <td className="py-2 px-2.5 text-slate-300 font-medium whitespace-nowrap">
                          {item.supplier}
                        </td>

                        {/* 입고 LOT */}
                        <td className="py-2 px-2.5 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                          {item.lotNo}
                        </td>

                        {/* 입고수량 */}
                        <td className="py-2 px-2.5 text-right text-slate-200 font-bold whitespace-nowrap">
                          {item.quantity || (item.quantityNum ? `${item.quantityNum.toLocaleString()} ${item.quantityUnit}` : "-")}
                        </td>

                        {/* 보관창고 */}
                        <td className="py-2 px-2.5 text-slate-300 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Warehouse className="w-3 h-3 text-slate-500" />
                            {item.storageLocation || "삼랑진 원재료창고"}
                          </span>
                        </td>

                        {/* 입고자 */}
                        <td className="py-2 px-2.5 text-slate-400 whitespace-nowrap">
                          {item.receivedBy || "유동길"}
                        </td>

                        {/* 진행 상태 */}
                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
                          {isPending && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-600 animate-pulse">
                              검사대기
                            </span>
                          )}
                          {isPassed && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-600">
                              정상입고
                            </span>
                          )}
                          {isReject && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-600">
                              불합격반품
                            </span>
                          )}
                          {isCond && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-950 text-orange-300 border border-orange-600">
                              조건부특채
                            </span>
                          )}
                        </td>

                        {/* 수입검사 조치 버튼 */}
                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
                          {isPending ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(item);
                              }}
                              className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[10px] shadow-xs flex items-center justify-center gap-1 mx-auto"
                            >
                              <ClipboardCheck className="w-3 h-3" />
                              <span>검사실시</span>
                            </button>
                          ) : isReject || isCond ? (
                            <span className="text-[10px] font-bold text-rose-400 flex items-center justify-center gap-0.5">
                              <ShieldAlert className="w-3 h-3" />
                              4M 대장이관
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              검사완료
                            </span>
                          )}
                        </td>

                        {/* 작업 (수정 / 삭제) */}
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(item);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                              title="수정"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteInspection(item.id, e)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </>
          )}

          {/* ======================= CASE 2: 수입검사 성적서 모드 ======================= */}
          {activeLedgerView === "INSPECTION" && (
            <>
              <thead className="bg-slate-900/90 text-slate-300 border-b border-slate-800 font-bold text-[11px]">
                <tr>
                  <th className="py-2 px-2.5 w-24">검사일자</th>
                  <th className="py-2 px-2.5 w-20">공장</th>
                  <th className="py-2 px-2.5 w-24">분류</th>
                  <th className="py-2 px-2.5">품명 및 규격</th>
                  <th className="py-2 px-2.5 w-28">공급사</th>
                  <th className="py-2 px-2.5 w-28">입고 LOT</th>
                  <th className="py-2 px-2.5 w-24 text-right">입고수량</th>
                  <th className="py-2 px-2.5 w-48">주요 물성/스펙 실측치</th>
                  <th className="py-2 px-2 w-12 text-center">성적서</th>
                  <th className="py-2 px-2.5 w-20 text-center">판정</th>
                  <th className="py-2 px-2.5 w-32 text-center">4M 대장 연동</th>
                  <th className="py-2 px-2 w-16 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-[11px]">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-500">
                      등록된 수입검사 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => {
                    const isRaw = item.category === "RAW_MATERIAL";
                    const isPass = item.overallResult === "PASS";
                    const isReject = item.overallResult === "REJECT";
                    const isCond = item.overallResult === "CONDITIONAL";
                    const isPending = item.overallResult === "PENDING" || item.receivingStatus === "PENDING";

                    const measuredSummary = (item.inspectionChecks || [])
                      .filter((c) => c.measured && c.measured.trim() !== "")
                      .slice(0, 2)
                      .map((c) => `${c.name.split(" ")[0]}: ${c.measured}${c.unit ? c.unit.split(" ")[0] : ""}`)
                      .join(" | ");

                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleOpenEditModal(item)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-2 px-2.5 text-slate-300 font-medium whitespace-nowrap">
                          <div>{item.date}</div>
                          <div className="text-[10px] text-slate-500">{item.time || "09:00"}</div>
                        </td>

                        <td className="py-2 px-2.5 text-slate-400 whitespace-nowrap">
                          {item.plant || "삼랑진"}
                        </td>

                        <td className="py-2 px-2.5 whitespace-nowrap">
                          {isRaw ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1 w-fit">
                              <Layers className="w-2.5 h-2.5" /> 원소재
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 w-fit">
                              <Component className="w-2.5 h-2.5" /> 부자재
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-2.5 font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{item.itemName}</span>
                            {item.itemType && (
                              <span className="text-[10px] font-normal text-slate-400">
                                ({item.itemType})
                              </span>
                            )}
                          </div>
                          {item.remarks && (
                            <div className="text-[10px] font-normal text-slate-400 truncate max-w-xs">
                              {item.remarks}
                            </div>
                          )}
                        </td>

                        <td className="py-2 px-2.5 text-slate-300 font-medium whitespace-nowrap">
                          {item.supplier}
                        </td>

                        <td className="py-2 px-2.5 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                          {item.lotNo}
                        </td>

                        <td className="py-2 px-2.5 text-right text-slate-300 font-bold whitespace-nowrap">
                          {item.quantity || (item.quantityNum ? `${item.quantityNum} ${item.quantityUnit}` : "-")}
                        </td>

                        <td className="py-2 px-2.5 text-slate-400">
                          {isPending ? (
                            <span className="text-amber-400 font-bold text-[10px] flex items-center gap-1">
                              <Clock className="w-3 h-3" /> 검사실시 대기 중
                            </span>
                          ) : (
                            <span className="truncate block max-w-xs text-[10px]">
                              {measuredSummary || "성적서 전 항목 합격"}
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-2 text-center">
                          {(item.mSheetPhotos && item.mSheetPhotos.length > 0) ||
                          (item.defectPhotos && item.defectPhotos.length > 0) ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const firstPhoto = item.mSheetPhotos?.[0]?.dataUrl || item.defectPhotos?.[0]?.dataUrl;
                                if (firstPhoto) setPreviewImage(firstPhoto);
                              }}
                              className="p-1 rounded bg-slate-800 text-cyan-400 hover:bg-slate-700"
                              title="성적서/사진 보기"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
                          {isPending && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-700">
                              대기
                            </span>
                          )}
                          {isPass && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-700">
                              합격
                            </span>
                          )}
                          {isReject && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-700">
                              불합격
                            </span>
                          )}
                          {isCond && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-700">
                              조건부
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
                          {item.syncedTo4M ? (
                            <span
                              title={`4M 등록일시: ${item.syncedTo4MAt || "등록완료"}`}
                              className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-950 text-indigo-300 border border-indigo-700/80 flex items-center justify-center gap-1"
                            >
                              <ShieldAlert className="w-2.5 h-2.5 text-indigo-400" />
                              4M 연동완료
                            </span>
                          ) : isReject || isCond ? (
                            <button
                              type="button"
                              disabled={syncingId === item.id}
                              onClick={(e) => handleManualSync4M(item, e)}
                              className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 hover:bg-rose-500 text-white transition active:scale-95 flex items-center justify-center gap-1 shadow-xs"
                            >
                              <ShieldAlert className="w-2.5 h-2.5" />
                              {syncingId === item.id ? "연동중..." : "4M 즉시이관"}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500">-</span>
                          )}
                        </td>

                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(item);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                              title="수정"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteInspection(item.id, e)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </>
          )}

          {/* ======================= CASE 3: 통합 전체 뷰 ======================= */}
          {activeLedgerView === "ALL" && (
            <>
              <thead className="bg-slate-900/90 text-slate-300 border-b border-slate-800 font-bold text-[11px]">
                <tr>
                  <th className="py-2 px-2.5 w-24">일자</th>
                  <th className="py-2 px-2.5 w-24">송장번호</th>
                  <th className="py-2 px-2.5 w-24">분류</th>
                  <th className="py-2 px-2.5">품명 및 규격</th>
                  <th className="py-2 px-2.5 w-28">공급사</th>
                  <th className="py-2 px-2.5 w-28">입고 LOT</th>
                  <th className="py-2 px-2.5 w-24 text-right">수량</th>
                  <th className="py-2 px-2.5 w-28">창고위치</th>
                  <th className="py-2 px-2.5 w-20 text-center">판정/상태</th>
                  <th className="py-2 px-2.5 w-28 text-center">4M 연동</th>
                  <th className="py-2 px-2 w-16 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-[11px]">
                {filteredList.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenEditModal(item)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-2.5 text-slate-300 font-medium whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-2 px-2.5 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                      {item.deliveryNoteNo || "-"}
                    </td>
                    <td className="py-2 px-2.5 whitespace-nowrap">
                      {item.category === "RAW_MATERIAL" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-950 text-blue-300 border border-blue-800">
                          원소재
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800">
                          부자재
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 font-bold text-white">
                      {item.itemName}
                    </td>
                    <td className="py-2 px-2.5 text-slate-300 whitespace-nowrap">
                      {item.supplier}
                    </td>
                    <td className="py-2 px-2.5 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                      {item.lotNo}
                    </td>
                    <td className="py-2 px-2.5 text-right text-slate-200 font-bold whitespace-nowrap">
                      {item.quantity || (item.quantityNum ? `${item.quantityNum} ${item.quantityUnit}` : "-")}
                    </td>
                    <td className="py-2 px-2.5 text-slate-300 text-[10px] whitespace-nowrap">
                      {item.storageLocation || "원재료창고"}
                    </td>
                    <td className="py-2 px-2.5 text-center whitespace-nowrap">
                      {item.overallResult === "PASS" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-600">
                          정상입고
                        </span>
                      ) : item.overallResult === "REJECT" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-600">
                          불합격반품
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-600">
                          검사대기
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-center whitespace-nowrap">
                      {item.syncedTo4M ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-950 text-indigo-300 border border-indigo-700/80">
                          4M 완료
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(item);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteInspection(item.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
      </div>

      {/* 5. 신규/수정 검사 모달 */}
      {isModalOpen && (
        <IncomingInspectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveInspection}
          initialData={selectedItemForEdit}
          currentProfile={currentProfile}
          defaultMode={modalDefaultMode}
          initialCategory={modalInitialCategory}
        />
      )}

      {/* 6. 사진 확대 모달 */}
      {previewImage && (
        <ImagePreviewModal
          previewImage={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* 7. 조인주 매입내역 연동 모달 */}
      {isPurchasesModalOpen && (
        <MonthlyPurchasesImportModal
          isOpen={isPurchasesModalOpen}
          onClose={() => setIsPurchasesModalOpen(false)}
          initialTab={purchasesModalInitialTab}
          onImportItem={(importedItem) => {
            setSelectedItemForEdit({
              category: importedItem.category,
              supplier: importedItem.supplier,
              itemName: importedItem.itemName,
              quantityNum: importedItem.quantityNum,
              quantityUnit: importedItem.quantityUnit,
              lotNo: importedItem.lotNo,
              storageLocation: importedItem.category === "RAW_MATERIAL" ? "삼랑진 원재료창고" : "삼랑진 가공동 부자재랙",
              receivingDate: new Date().toISOString().slice(0, 10),
              receivingTime: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
            });
            setModalDefaultMode("FULL");
            setModalInitialCategory(importedItem.category);
            setIsModalOpen(true);
          }}
          onBatchImport={async (batchItems) => {
            const registeredBy = currentProfile?.name || "유동길";
            await saveBatchIncomingInspections(batchItems, registeredBy);
            // 등록 완료 후 검사대기 탭으로 전환하여 한눈에 보이도록 함
            setSelectedCategoryTab("PENDING_ONLY");
            setActiveLedgerView("RECEIVING");
            alert(`선택하신 ${batchItems.length}건이 입고대장에 [검사대기 (PENDING)] 상태로 일괄 등록되었습니다.\n이제 입고대장의 [검사실시] 버튼을 눌러 SQ 수입검사를 진행할 수 있습니다.`);
          }}
        />
      )}
    </div>
  );
};
