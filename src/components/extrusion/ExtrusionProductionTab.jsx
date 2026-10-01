import React, { useState, useEffect, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit,
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
import ExtrusionMaterialBOMQuickPanel from "./ExtrusionMaterialBOMQuickPanel";

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

  // Filtered and Sorted reports (최근순 정렬: 최신 일자/등록순)
  const filteredReports = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    const list = reports.filter((r) => {
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

      return true;
    });

    // 최근순 정렬 (날짜 내림차순 -> 등록시간/ID 내림차순)
    return list.sort((a, b) => {
      const dateA = String(a.date || "");
      const dateB = String(b.date || "");
      if (dateB !== dateA) {
        return dateB.localeCompare(dateA);
      }
      const timeA = String(a.createdAt || a.id || "");
      const timeB = String(b.createdAt || b.id || "");
      return timeB.localeCompare(timeA);
    });
  }, [reports, dateFilterMode, customDate, selectedLineFilter, selectedShiftFilter, selectedApprovalFilter]);

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
      showToast(editingReport ? "✅ 작업일보가 수정되었습니다." : "✅ 작업일보가 등록되었습니다.");
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

  return (
    <div className="space-y-3 animate-fadeIn max-w-[1600px] mx-auto min-w-0">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-slate-700 backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 설유철 책임 전용 품목별 원재료 BOM 등록 패널 (설유철/Admin만 노출) */}
      {/* ========================================================================= */}
      <ExtrusionMaterialBOMQuickPanel />

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
                총 <strong className="font-black text-teal-600">{filteredReports.length}</strong>건 (최근순)
              </span>
            </div>
          </div>

          {/* Right Action: 엑셀취합 뱃지만 단독 생성 */}
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

        {/* Panel Sub: Compact Filter Toolbar (검색창 완전 삭제 & 간결한 필터 뱃지) */}
        <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-wrap text-xs">
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
                className={`px-2 py-1 rounded-lg font-black transition cursor-pointer ${
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

        {/* Scrollable Table (간략하고 명확한 최근순 목록표) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700 text-[11px]">
                <th className="py-2.5 px-2 text-center w-10">No</th>
                <th className="py-2.5 px-3 whitespace-nowrap">일자 / 조</th>
                <th className="py-2.5 px-3 whitespace-nowrap">호기 / 작업자</th>
                <th className="py-2.5 px-3">차종 / 품명</th>
                <th className="py-2.5 px-3 text-right">수율</th>
                <th className="py-2.5 px-3 text-right">스크랩</th>
                <th className="py-2.5 px-3 text-right">비가동</th>
                <th className="py-2.5 px-2 text-center">결재</th>
                <th className="py-2.5 px-2.5 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredReports.length > 0 ? (
                filteredReports.map((r, idx) => {
                  const isApproved = r.approvalStatus === "승인";
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-teal-50/40 dark:hover:bg-teal-950/25 transition font-medium"
                    >
                      {/* No */}
                      <td className="py-2.5 px-2 text-center text-slate-400 font-bold text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Date & Shift */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-black text-slate-900 dark:text-white text-xs">
                          {r.date}
                        </div>
                        <span
                          className={`inline-block text-[9.5px] font-black px-1.5 py-0.2 rounded mt-0.5 ${
                            r.shift === "주간"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                          }`}
                        >
                          {r.shift}
                        </span>
                      </td>

                      {/* Line & Worker */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-black text-teal-700 dark:text-teal-400 text-xs">
                          {r.lineName}
                        </div>
                        <div className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                          {r.worker || "-"}
                        </div>
                      </td>

                      {/* Vehicle & Item */}
                      <td className="py-2.5 px-3 max-w-[220px]">
                        {Array.isArray(r.items) && r.items.length > 1 ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[9.5px] font-black">
                                다품목 {r.items.length}종
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold truncate">
                                {r.items.map(it => it.vehicle).filter(Boolean).join(", ")}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="truncate">
                            <div className="font-black text-slate-900 dark:text-white flex items-center gap-1">
                              <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[9.5px] font-black shrink-0">
                                {r.vehicle || "압출"}
                              </span>
                              <span className="truncate text-xs font-bold">{r.itemCode || r.itemName || "-"}</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Yield Rate */}
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`font-black text-[11px] px-1.5 py-0.5 rounded ${
                            r.yieldRate >= 97
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {r.yieldRate}%
                        </span>
                      </td>

                      {/* Scrap Kg */}
                      <td className="py-2.5 px-3 text-right font-black text-amber-600 text-xs">
                        {r.scrapKg > 0 ? `${r.scrapKg}kg` : "-"}
                      </td>

                      {/* Downtime */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {r.downtimeMinutes > 0 ? (
                          <div>
                            <span className="font-black text-rose-600 dark:text-rose-400 text-xs">
                              {r.downtimeMinutes}분
                            </span>
                            {r.downtimeCategory && (
                              <div className="text-[10px] text-slate-500 truncate max-w-[120px] ml-auto">
                                {r.downtimeCategory}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Approval Status Toggle */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleApproval(r)}
                          title="클릭하여 승인/대기 토글"
                          className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black transition active:scale-95 cursor-pointer border ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {isApproved ? "승인" : "대기"}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDownloadCheckSheet(r)}
                            title="A4 표준 체크시트 엑셀 다운로드"
                            className="p-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:text-blue-400 transition active:scale-95 cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(r)}
                            title="수정"
                            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition active:scale-95 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReport(r.id)}
                            title="삭제"
                            className="p-1 rounded-md bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/50 transition active:scale-95 cursor-pointer"
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
                  <td colSpan={9} className="py-12 text-center text-slate-400 space-y-1.5">
                    <AlertCircle className="w-7 h-7 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold">등록된 작업일보 내역이 없습니다.</p>
                  </td>
                </tr>
              )}
            </tbody>
            {filteredReports.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800/90 border-t-2 border-slate-300 dark:border-slate-700 font-black text-xs text-slate-900 dark:text-white">
                  <td colSpan={4} className="py-2.5 px-3 text-center font-black text-xs">
                    ■ 합계 ({(filteredReports || []).length}건)
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 font-black text-xs">
                    {metrics?.yieldRate ?? 0}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-600 font-black text-xs">
                    {metrics?.totalScrapKg ?? 0}kg
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-600 font-black text-xs">
                    {metrics?.totalDowntimeMinutes ?? 0}분
                  </td>
                  <td colSpan={2} className="py-2.5 px-3 text-center text-slate-500 text-[11px]">
                    (비가동: <strong>{metrics?.totalDowntimeHours ?? 0}h</strong>)
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
