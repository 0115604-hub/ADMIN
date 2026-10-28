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
  SlidersHorizontal
} from "lucide-react";
import {
  INSPECTION_CATEGORIES,
  subscribeIncomingInspections,
  saveIncomingInspection,
  deleteIncomingInspection,
  syncInspectionToFourMLedger
} from "../../services/incomingInspectionService";
import { IncomingInspectionModal } from "./IncomingInspectionModal";
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
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("ALL"); // ALL, RAW_MATERIAL, SUB_MATERIAL, REJECT_ONLY
  const [selectedResultFilter, setSelectedResultFilter] = useState("ALL"); // ALL, PASS, REJECT, CONDITIONAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [syncingId, setSyncingId] = useState(null);

  // 실시간 수입검사 데이터 구독
  useEffect(() => {
    const unsubscribe = subscribeIncomingInspections((data) => {
      setInspections(data);
    });
    return () => unsubscribe();
  }, []);

  // 커스텀 테마 & 타이틀 설정 계산
  const themeKey = customSettings?.theme || "indigo";
  const themeObj = PANEL_THEMES[themeKey] || PANEL_THEMES.indigo;
  const rawTitle = customSettings?.customTitle || "원부자재 수입검사 센터";
  const titleValue = cleanTitleWithoutEmoji(rawTitle) || "원부자재 수입검사 센터";
  const defaultBadgeText = currentProfile?.name
    ? `${currentProfile.name} ${currentProfile.title || "관리자"} 관제`
    : "품질보증 관제";
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
    const passCount = inspections.filter((i) => i.overallResult === "PASS").length;
    const rejectCount = inspections.filter((i) => i.overallResult === "REJECT").length;
    const conditionalCount = inspections.filter((i) => i.overallResult === "CONDITIONAL").length;
    const synced4MCount = inspections.filter((i) => i.syncedTo4M).length;
    const passRate = total > 0 ? Math.round((passCount / total) * 100) : 100;

    return {
      total,
      rawMaterialCount,
      subMaterialCount,
      passCount,
      rejectCount,
      conditionalCount,
      synced4MCount,
      passRate
    };
  }, [inspections]);

  // 필터링 적용
  const filteredInspections = useMemo(() => {
    return inspections.filter((item) => {
      // 카테고리 필터
      if (selectedCategoryTab === "RAW_MATERIAL" && item.category !== "RAW_MATERIAL") return false;
      if (selectedCategoryTab === "SUB_MATERIAL" && item.category !== "SUB_MATERIAL") return false;
      if (selectedCategoryTab === "REJECT_ONLY" && item.overallResult !== "REJECT" && item.overallResult !== "CONDITIONAL") return false;

      // 판정 필터
      if (selectedResultFilter !== "ALL" && item.overallResult !== selectedResultFilter) return false;

      // 검색어 필터 (품명, 공급사, LOT, 검사원)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = (item.itemName || "").toLowerCase().includes(term);
        const matchSupplier = (item.supplier || "").toLowerCase().includes(term);
        const matchLot = (item.lotNo || "").toLowerCase().includes(term);
        const matchInspector = (item.inspector || "").toLowerCase().includes(term);
        if (!matchName && !matchSupplier && !matchLot && !matchInspector) return false;
      }

      return true;
    });
  }, [inspections, selectedCategoryTab, selectedResultFilter, searchTerm]);

  // 신규 등록 열기
  const handleOpenNewModal = () => {
    setSelectedItemForEdit(null);
    setIsModalOpen(true);
  };

  // 상세/수정 열기
  const handleOpenEditModal = (item) => {
    setSelectedItemForEdit(item);
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
    if (!window.confirm("해당 수입검사 성적서를 정말 삭제하시겠습니까?")) return;
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

  // 엑셀 (CSV) 내보내기
  const handleExportCSV = () => {
    if (filteredInspections.length === 0) {
      alert("다운로드할 수입검사 내역이 없습니다.");
      return;
    }

    const headers = [
      "검사일자",
      "공장",
      "분류",
      "품목구분",
      "품명및규격",
      "공급사",
      "입고LOT",
      "입고수량",
      "종합판정",
      "4M대장연동여부",
      "검사원",
      "특기사항"
    ];

    const rows = filteredInspections.map((it) => [
      it.date,
      it.plant || "삼랑진공장",
      it.category === "RAW_MATERIAL" ? "고무/압출 원소재" : "조립/체결 부자재",
      it.itemType || "",
      `"${(it.itemName || "").replace(/"/g, '""')}"`,
      `"${(it.supplier || "").replace(/"/g, '""')}"`,
      it.lotNo || "",
      it.quantity || "",
      it.overallResult === "PASS" ? "합격" : it.overallResult === "REJECT" ? "불합격" : "조건부합격",
      it.syncedTo4M ? "4M등록완료" : "미등록",
      it.inspector || "",
      `"${(it.remarks || "").replace(/"/g, '""')}"`
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `수입검사성적서_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`w-full ${themeObj.cardBg} border-2 ${themeObj.borderClass} ${customSettings?.borderRadius || "rounded-2xl"} shadow-lg overflow-hidden transition-all duration-200 animate-fadeIn`}>
      {/* 1. Header Bar (울트라고밀도 스타일) */}
      <div className={`p-2.5 sm:p-3 border-b border-slate-700/50 ${themeObj.headerBg} flex flex-col sm:flex-row sm:items-center justify-between gap-2.5`}>
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
                value={customSettings?.customTitle !== undefined ? customSettings.customTitle : "원부자재 수입검사 센터"}
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

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            title="CSV 엑셀 다운로드"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-slate-300 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">엑셀</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-[11px] font-black shadow-md shadow-cyan-950/60 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>신규 수입검사 등록</span>
          </button>
        </div>
      </div>

      {/* 2. 통계 KPI 요약 바 (Ultra High-Density) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-2 sm:p-2.5 bg-slate-950/60 border-b border-slate-800 text-xs">
        {/* 전체 */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400">총 검사건수</span>
          <span className="text-xs font-black text-white">{stats.total}건</span>
        </div>

        {/* 고무/압출 원소재 */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-blue-950/40 border border-blue-900/50">
          <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1">
            <Layers className="w-3 h-3 text-blue-400" />
            원소재
          </span>
          <span className="text-xs font-black text-blue-200">{stats.rawMaterialCount}건</span>
        </div>

        {/* 조립/체결 부자재 */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-900/50">
          <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
            <Component className="w-3 h-3 text-emerald-400" />
            부자재
          </span>
          <span className="text-xs font-black text-emerald-200">{stats.subMaterialCount}건</span>
        </div>

        {/* 합격률 */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400">합격률</span>
          <span className={`text-xs font-black ${stats.passRate >= 95 ? "text-emerald-400" : "text-amber-400"}`}>
            {stats.passRate}%
          </span>
        </div>

        {/* 4M 자동연동 부적합건 */}
        <div className="col-span-2 sm:col-span-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-rose-950/40 border border-rose-900/60">
          <span className="text-[11px] font-black text-rose-300 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            4M 연동부적합
          </span>
          <span className="text-xs font-black text-rose-200">
            {stats.rejectCount + stats.conditionalCount}건
          </span>
        </div>
      </div>

      {/* 3. 필터 및 검색 바 */}
      <div className="p-2 sm:p-2.5 bg-slate-900/80 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
        {/* 카테고리 탭 */}
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
            onClick={() => setSelectedCategoryTab("REJECT_ONLY")}
            className={`px-2 py-1 rounded-md text-[11px] font-black transition flex items-center gap-1 ${
              selectedCategoryTab === "REJECT_ONLY"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-rose-400/90 hover:text-rose-300 hover:bg-rose-950/60"
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            🚨 4M 연동 부적합건만 ({stats.rejectCount + stats.conditionalCount})
          </button>
        </div>

        {/* 검색창 */}
        <div className="relative w-full md:w-60">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="품명, 규격, 공급사, LOT 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
          />
        </div>
      </div>

      {/* 4. 고밀도 수입검사 목록 테이블 (Responsive Table) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900/90 text-slate-300 border-b border-slate-800 font-bold text-[11px]">
            <tr>
              <th className="py-2 px-2.5 w-24">검사일자</th>
              <th className="py-2 px-2.5 w-20">공장</th>
              <th className="py-2 px-2.5 w-24">분류</th>
              <th className="py-2 px-2.5">품명 및 규격</th>
              <th className="py-2 px-2.5 w-28">공급사</th>
              <th className="py-2 px-2.5 w-28">입고 LOT</th>
              <th className="py-2 px-2.5 w-24 text-right">입고수량</th>
              <th className="py-2 px-2.5 w-44">주요 물성/스펙 실측치</th>
              <th className="py-2 px-2 w-12 text-center">성적서</th>
              <th className="py-2 px-2.5 w-20 text-center">판정</th>
              <th className="py-2 px-2.5 w-32 text-center">4M 대장 연동</th>
              <th className="py-2 px-2 w-16 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-[11px]">
            {filteredInspections.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-slate-500">
                  등록된 수입검사 내역이 없습니다.
                </td>
              </tr>
            ) : (
              filteredInspections.map((item) => {
                const isRaw = item.category === "RAW_MATERIAL";
                const isPass = item.overallResult === "PASS";
                const isReject = item.overallResult === "REJECT";
                const isCond = item.overallResult === "CONDITIONAL";

                // 물성 요약 추출 (실측치가 있는 주요 2~3개)
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
                    {/* 일자 */}
                    <td className="py-2 px-2.5 text-slate-300 font-medium whitespace-nowrap">
                      <div>{item.date}</div>
                      <div className="text-[10px] text-slate-500">{item.time || "09:00"}</div>
                    </td>

                    {/* 공장 */}
                    <td className="py-2 px-2.5 text-slate-400 whitespace-nowrap">
                      {item.plant || "삼랑진"}
                    </td>

                    {/* 분류 뱃지 */}
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
                      {item.remarks && (
                        <div className="text-[10px] font-normal text-slate-400 truncate max-w-xs">
                          {item.remarks}
                        </div>
                      )}
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
                    <td className="py-2 px-2.5 text-right text-slate-300 font-bold whitespace-nowrap">
                      {item.quantity || "-"}
                    </td>

                    {/* 주요 물성 실측 요약 */}
                    <td className="py-2 px-2.5 text-slate-400">
                      <span className="truncate block max-w-xs text-[10px]">
                        {measuredSummary || "검사 성적서 확인"}
                      </span>
                    </td>

                    {/* 성적서 사진 아이콘 */}
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

                    {/* 판정 결과 */}
                    <td className="py-2 px-2.5 text-center whitespace-nowrap">
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

                    {/* 4M 실시간 대장 연동 상태 */}
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
        />
      )}

      {/* 6. 사진 확대 모달 */}
      {previewImage && (
        <ImagePreviewModal
          previewImage={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
};
