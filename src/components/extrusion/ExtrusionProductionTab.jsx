import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit,
  Search,
  Printer,
  Sun,
  Moon
} from "lucide-react";
import {
  EXTRUSION_LINE_OPTIONS,
  subscribeToExtrusionReports,
  saveExtrusionReport,
  deleteExtrusionReport,
  toggleExtrusionReportApproval,
  calculateExtrusionMetrics,
  exportExtrusionReportsToExcel,
  exportExtrusionCheckSheetExcel
} from "../../services/extrusionProductionService";
import { useAuth } from "../../context/AuthContext";
import ExtrusionWorkReportModal from "./ExtrusionWorkReportModal";

export const ExtrusionProductionTab = () => {
  const { currentProfile, isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Listen for open report modal event from Header
  useEffect(() => {
    const handleOpenModal = () => {
      setEditingReport(null);
      setIsModalOpen(true);
    };
    window.addEventListener("open-extrusion-work-report-modal", handleOpenModal);
    return () => {
      window.removeEventListener("open-extrusion-work-report-modal", handleOpenModal);
    };
  }, []);

  // Filters
  const [dateFilterMode, setDateFilterMode] = useState("all"); // all | today | 7days | custom
  const [customDate, setCustomDate] = useState("");
  const [selectedLineFilter, setSelectedLineFilter] = useState("all"); // all | pcm1 | pcm3 | pvc | tpe
  const [selectedShiftFilter, setSelectedShiftFilter] = useState("all"); // all | 주간 | 야간
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApprovalFilter, setSelectedApprovalFilter] = useState("all"); // all | 승인 | 대기

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Real-time listener
  useEffect(() => {
    const unsub = subscribeToExtrusionReports((data) => {
      setReports(data);
    });
    return () => unsub();
  }, []);

  // Filtered reports
  const filteredReports = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    return reports.filter((r) => {
      // 1. Date Filter
      if (dateFilterMode === "today") {
        if (r.date !== todayStr) return false;
      } else if (dateFilterMode === "7days") {
        const d = new Date(r.date);
        const diffDays = (new Date() - d) / (1000 * 60 * 60 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      } else if (dateFilterMode === "custom" && customDate) {
        if (r.date !== customDate) return false;
      }

      // 2. Line Filter
      if (selectedLineFilter !== "all" && r.lineId !== selectedLineFilter) {
        return false;
      }

      // 3. Shift Filter
      if (selectedShiftFilter !== "all" && r.shift !== selectedShiftFilter) {
        return false;
      }

      // 4. Approval Filter
      if (selectedApprovalFilter !== "all" && r.approvalStatus !== selectedApprovalFilter) {
        return false;
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (r.worker && r.worker.toLowerCase().includes(q)) ||
          (r.vehicle && r.vehicle.toLowerCase().includes(q)) ||
          (r.itemCode && r.itemCode.toLowerCase().includes(q)) ||
          (r.itemName && r.itemName.toLowerCase().includes(q)) ||
          (r.lineName && r.lineName.toLowerCase().includes(q)) ||
          (r.downtimeDetail && r.downtimeDetail.toLowerCase().includes(q)) ||
          (r.notes && r.notes.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [reports, dateFilterMode, customDate, selectedLineFilter, selectedShiftFilter, selectedApprovalFilter, searchQuery]);

  // Aggregated metrics
  const metrics = useMemo(() => {
    return calculateExtrusionMetrics(filteredReports);
  }, [filteredReports]);

  // Handler: Open modal for new report
  const handleOpenCreateModal = () => {
    setEditingReport(null);
    setIsModalOpen(true);
  };

  // Handler: Open modal for editing report
  const handleOpenEditModal = (report) => {
    setEditingReport(report);
    setIsModalOpen(true);
  };

  // Handler: Save report
  const handleSaveReport = async (reportData) => {
    try {
      await saveExtrusionReport(reportData);
      setIsModalOpen(false);
      showToast(editingReport ? "✅ 작업일보가 성공적으로 수정되었습니다." : "✅ 새 작업일보가 실시간 등록되었습니다.");
    } catch (e) {
      console.error(e);
      showToast("❌ 작업일보 저장 중 오류가 발생했습니다.");
    }
  };

  // Handler: Delete report
  const handleDeleteReport = async (reportId) => {
    if (window.confirm("선택한 작업일보를 삭제하시겠습니까?")) {
      await deleteExtrusionReport(reportId);
      showToast("🗑️ 작업일보가 삭제되었습니다.");
    }
  };

  // Handler: Toggle Approval
  const handleToggleApproval = async (report) => {
    const next = await toggleExtrusionReportApproval(report.id, report.approvalStatus, "이명재 이사");
    if (next) {
      showToast(`결재 상태가 [${next.approvalStatus}]로 변경되었습니다.`);
    }
  };

  // Handler: Export Excel
  const handleExportExcel = () => {
    if (filteredReports.length === 0) {
      showToast("내보낼 작업일보 데이터가 없습니다.");
      return;
    }
    const filterTitle =
      dateFilterMode === "today"
        ? "오늘 실적"
        : dateFilterMode === "7days"
        ? "최근 7일"
        : selectedLineFilter !== "all"
        ? selectedLineFilter
        : "종합 실적";
    exportExtrusionReportsToExcel(filteredReports, metrics, filterTitle);
    showToast("📊 생산실적 및 작업일보 엑셀 파일이 다운로드되었습니다.");
  };

  // Handler: Download Blank / Standard Check Sheet
  const handleDownloadBlankCheckSheet = async () => {
    try {
      await exportExtrusionCheckSheetExcel(null);
      showToast("📄 A4 압출작업 표준 체크시트 양식이 다운로드되었습니다.");
    } catch (e) {
      console.error(e);
      showToast("❌ 체크시트 양식 다운로드 중 오류가 발생했습니다.");
    }
  };

  // Handler: Download Individual Report Check Sheet
  const handleDownloadCheckSheet = async (report) => {
    try {
      await exportExtrusionCheckSheetExcel(report);
      showToast(`📄 [${report.lineName || "압출"} ${report.itemCode || ""}] A4 표준 체크시트가 다운로드되었습니다.`);
    } catch (e) {
      console.error(e);
      showToast("❌ 체크시트 엑셀 다운로드 중 오류가 발생했습니다.");
    }
  };

  // Handler: Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-fadeIn max-w-[1600px] mx-auto min-w-0">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-slate-700 backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Main Real-time Reports Ledger Table (주)오륙 압출 생산관리 및 작업일보 대장) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Panel Top: Title & 엑셀취합 뱃지 (한줄 구성) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-500/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white whitespace-nowrap">
                주)오륙 압출 생산관리 및 작업일보
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0">
                총 <strong className="font-black text-teal-600">{filteredReports.length}</strong>건
              </span>
            </div>
          </div>

          {/* Right Action: 엑셀취합 뱃지만 생성 */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-500/20 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>엑셀취합</span>
            </button>
          </div>
        </div>

        {/* Panel Sub: Integrated Filter & Search Toolbar */}
        <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Left Filter Groups */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Filter */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDateFilterMode("all")}
                className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer ${
                  dateFilterMode === "all"
                    ? "bg-slate-900 text-white dark:bg-slate-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setDateFilterMode("today")}
                className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer flex items-center gap-1 ${
                  dateFilterMode === "today"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                <span>⭐ 오늘</span>
              </button>
              <button
                type="button"
                onClick={() => setDateFilterMode("7days")}
                className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer ${
                  dateFilterMode === "7days"
                    ? "bg-slate-900 text-white dark:bg-slate-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                최근 7일
              </button>
            </div>

            {/* Line Filter */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedLineFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer ${
                  selectedLineFilter === "all"
                    ? "bg-slate-900 text-white dark:bg-slate-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                전체호기
              </button>
              {EXTRUSION_LINE_OPTIONS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedLineFilter(l.id)}
                  className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer ${
                    selectedLineFilter === l.id
                      ? l.id === "pcm1"
                        ? "bg-teal-600 text-white shadow-xs"
                        : l.id === "pcm3"
                        ? "bg-blue-600 text-white shadow-xs"
                        : l.id === "pvc"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-purple-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  {l.badge || l.shortName}
                </button>
              ))}
            </div>

            {/* Shift Filter */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedShiftFilter("all")}
                className={`px-2 py-1 rounded-lg font-black transition cursor-pointer ${
                  selectedShiftFilter === "all"
                    ? "bg-slate-900 text-white dark:bg-slate-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                주/야간
              </button>
              <button
                type="button"
                onClick={() => setSelectedShiftFilter("주간")}
                className={`px-2 py-1 rounded-lg font-black transition cursor-pointer flex items-center gap-1 ${
                  selectedShiftFilter === "주간"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                <Sun className="w-3 h-3" /> 주간
              </button>
              <button
                type="button"
                onClick={() => setSelectedShiftFilter("야간")}
                className={`px-2 py-1 rounded-lg font-black transition cursor-pointer flex items-center gap-1 ${
                  selectedShiftFilter === "야간"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                <Moon className="w-3 h-3" /> 야간
              </button>
            </div>

            {/* Approval Filter */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedApprovalFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer ${
                  selectedApprovalFilter === "all"
                    ? "bg-slate-900 text-white dark:bg-slate-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                결재전체
              </button>
              <button
                type="button"
                onClick={() => setSelectedApprovalFilter("승인")}
                className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer ${
                  selectedApprovalFilter === "승인"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                승인완료
              </button>
              <button
                type="button"
                onClick={() => setSelectedApprovalFilter("대기")}
                className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer ${
                  selectedApprovalFilter === "대기"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                결재대기
              </button>
            </div>
          </div>

          {/* Right Search Input */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="작업자, 차종, 품번 검색..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3">일자 / 근무조</th>
                <th className="py-3 px-3">호기 / 작업자</th>
                <th className="py-3 px-3">차종 / 품명</th>
                <th className="py-3 px-2 text-right">계획(m)</th>
                <th className="py-3 px-2 text-right">실적(m)</th>
                <th className="py-3 px-2 text-right">양품(m)</th>
                <th className="py-3 px-2 text-right">수율(%)</th>
                <th className="py-3 px-2 text-right">스크랩</th>
                <th className="py-3 px-3 text-right">비가동</th>
                <th className="py-3 px-3">비가동 사유 및 조치</th>
                <th className="py-3 px-2 text-center">결재상태</th>
                <th className="py-3 px-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredReports.length > 0 ? (
                filteredReports.map((r, idx) => {
                  const isApproved = r.approvalStatus === "승인";
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition font-medium"
                    >
                      {/* No */}
                      <td className="py-3 px-3 text-center text-slate-400 font-bold text-xs">
                        {idx + 1}
                      </td>

                      {/* Date & Shift */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-black text-slate-900 dark:text-white">
                          {r.date}
                        </div>
                        <span
                          className={`inline-block text-[10px] font-black px-1.5 py-0.2 rounded-md mt-0.5 ${
                            r.shift === "주간"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                          }`}
                        >
                          {r.shift}
                        </span>
                      </td>

                      {/* Line & Worker */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-black text-teal-700 dark:text-teal-400">
                          {r.lineName}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 font-bold">
                          {r.worker}
                          {r.subWorkers ? ` (${r.subWorkers})` : ""}
                        </div>
                      </td>

                      {/* Vehicle & Item */}
                      <td className="py-3 px-3 max-w-[240px]">
                        {Array.isArray(r.items) && r.items.length > 1 ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-black">
                                다품목 {r.items.length}종
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              {r.items.map((it, i) => (
                                <div key={it.id || i} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1 truncate">
                                  <span className="px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[9.5px] font-black shrink-0">
                                    {it.vehicle}
                                  </span>
                                  <span className="truncate font-medium text-[10.5px]">{it.itemName}</span>
                                  <span className="text-[10px] text-slate-400 shrink-0 font-bold">({it.actualQty}m)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-black text-slate-900 dark:text-white flex items-center gap-1">
                              <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-black">
                                {r.vehicle}
                              </span>
                              <span className="truncate text-xs">{r.itemCode || ""}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                              {r.itemName || "-"}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Target Qty */}
                      <td className="py-3 px-2 text-right text-slate-500 font-bold">
                        {r.targetQty ? r.targetQty.toLocaleString() : "-"}
                      </td>

                      {/* Actual Qty */}
                      <td className="py-3 px-2 text-right font-black text-slate-900 dark:text-white text-sm">
                        {r.actualQty ? r.actualQty.toLocaleString() : "0"}
                      </td>

                      {/* Good Qty */}
                      <td className="py-3 px-2 text-right font-black text-blue-700 dark:text-blue-400">
                        {r.goodQty ? r.goodQty.toLocaleString() : "0"}
                      </td>

                      {/* Yield Rate */}
                      <td className="py-3 px-2 text-right">
                        <span
                          className={`font-black text-xs px-1.5 py-0.5 rounded-md ${
                            r.yieldRate >= 97
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {r.yieldRate}%
                        </span>
                      </td>

                      {/* Scrap Kg */}
                      <td className="py-3 px-2 text-right text-amber-600 font-bold">
                        {r.scrapKg > 0 ? `${r.scrapKg}kg` : "-"}
                      </td>

                      {/* Downtime */}
                      <td className="py-3 px-3 text-right">
                        {r.downtimeMinutes > 0 ? (
                          <div>
                            <span className="font-black text-rose-600 dark:text-rose-400 text-xs">
                              {r.downtimeMinutes}분
                            </span>
                            <div className="text-[10px] text-slate-400 font-bold">
                              ({(r.downtimeMinutes / 60).toFixed(1)}h)
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Downtime Reason / Notes */}
                      <td className="py-3 px-3 max-w-[220px]">
                        {r.downtimeMinutes > 0 && (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-900 border border-rose-200">
                                {r.downtimeCategory || "형교환"}
                              </span>
                              {r.downtimeScrapKg > 0 && (
                                <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded bg-orange-100 text-orange-900 border border-orange-200">
                                  폐기 {r.downtimeScrapKg}kg
                                </span>
                              )}
                            </div>
                            <div className="text-slate-700 dark:text-slate-300 text-xs truncate">
                              {r.downtimeDetail || "-"}
                            </div>
                          </div>
                        )}
                        {(r.tpmIssueText || (Array.isArray(r.tpmIssuePhotos) && r.tpmIssuePhotos.length > 0)) && (
                          <div className="flex items-center gap-1 text-[10.5px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 truncate">
                            <span className="px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9.5px] font-black">
                              🚨 TPM이상
                            </span>
                            <span className="truncate">{r.tpmIssueText || "점검 사진 등록"}</span>
                            {Array.isArray(r.tpmIssuePhotos) && r.tpmIssuePhotos.length > 0 && (
                              <span className="text-[10px]">📷 {r.tpmIssuePhotos.length}장</span>
                            )}
                          </div>
                        )}
                        {r.notes && (
                          <p className="text-[10.5px] text-slate-500 italic truncate mt-0.5">
                            📝 {r.notes}
                          </p>
                        )}
                      </td>

                      {/* Approval Status Toggle */}
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleApproval(r)}
                          title="클릭하여 승인/대기 토글"
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition active:scale-95 cursor-pointer border ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {isApproved ? "✓ 승인완료" : "⏳ 결재대기"}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDownloadCheckSheet(r)}
                            title="A4 표준 체크시트 엑셀 다운로드"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:text-blue-400 transition active:scale-95 cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(r)}
                            title="수정"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition active:scale-95 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReport(r.id)}
                            title="삭제"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/50 transition active:scale-95 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={13} className="py-14 text-center text-slate-400 space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold">등록된 작업일보 내역이 없습니다.</p>
                    <p className="text-xs text-slate-400">
                      상단의 [작업일보 신규작성] 버튼을 눌러 오늘 실적을 등록해보세요.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
            {filteredReports.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800/90 border-t-2 border-slate-300 dark:border-slate-700 font-black text-xs text-slate-900 dark:text-white">
                  <td colSpan={4} className="py-3 px-4 text-center font-black text-sm">
                    ■ 생산 실적 합계 ({(filteredReports || []).length}건)
                  </td>
                  <td className="py-3 px-2 text-right text-slate-600 dark:text-slate-400">
                    {(metrics?.totalTarget || 0).toLocaleString()}m
                  </td>
                  <td className="py-3 px-2 text-right text-slate-900 dark:text-white font-black text-sm">
                    {(metrics?.totalActual || 0).toLocaleString()}m
                  </td>
                  <td className="py-3 px-2 text-right text-blue-700 dark:text-blue-400 font-black text-sm">
                    {(metrics?.totalGood || 0).toLocaleString()}m
                  </td>
                  <td className="py-3 px-2 text-right text-emerald-600 font-black">
                    {metrics?.yieldRate ?? 0}%
                  </td>
                  <td className="py-3 px-2 text-right text-amber-600 font-black">
                    {metrics?.totalScrapKg ?? 0}kg
                  </td>
                  <td className="py-3 px-3 text-right text-rose-600 font-black">
                    {metrics?.totalDowntimeMinutes ?? 0}분
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-slate-500 italic text-xs">
                    (달성률: <strong>{metrics?.attainmentRate ?? 0}%</strong>, 비가동: <strong>{metrics?.totalDowntimeHours ?? 0}시간</strong>)
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Work Report Create / Edit Modal */}
      {/* ========================================================================= */}
      <ExtrusionWorkReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveReport}
        initialData={editingReport}
        isEditing={Boolean(editingReport)}
        existingReports={reports}
      />
    </div>
  );
};

export default ExtrusionProductionTab;
