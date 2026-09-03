import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Clock,
  Printer,
  Download,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Calendar,
  User,
  Save,
  FileText,
  Copy,
  Users,
  Layers,
  Sparkles,
  Award,
  CheckCheck,
  Building2,
  Factory,
  Eye,
  Check,
  ChevronRight,
  DollarSign
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";
import {
  getLocalOvertimeReports,
  saveOvertimeReport,
  deleteOvertimeReport,
  subscribeOvertimeReports,
  formatKoreanWorkDate,
  formatShortWorkDate,
  calculateReportMetrics
} from "../services/overtimeService";

export const OvertimeStatusView = () => {
  const { currentProfile, isAdmin } = useAuth();
  const detailSectionRef = useRef(null);

  const [reports, setReports] = useState(() => getLocalOvertimeReports());
  const [filterPlant, setFilterPlant] = useState("전체");
  const [selectedReportId, setSelectedReportId] = useState(() => {
    const initial = getLocalOvertimeReports();
    return initial[0]?.id || "report_samrangjin_20260829";
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  // Real-time Cloud Synchronization for Overtime Reports
  useEffect(() => {
    const unsub = subscribeOvertimeReports((syncedReports) => {
      setReports(syncedReports);
    });
    return () => unsub();
  }, []);

  // Filtered reports list for table display
  const displayedReports = useMemo(() => {
    if (filterPlant === "전체") return reports;
    return reports.filter((r) => r.plant === filterPlant);
  }, [reports, filterPlant]);

  // Current active selected report for detail view
  const currentReport = useMemo(() => {
    const found = reports.find((r) => r.id === selectedReportId);
    return found || reports[0];
  }, [reports, selectedReportId]);

  // Current report calculated metrics
  const currentMetrics = useMemo(() => {
    return calculateReportMetrics(currentReport);
  }, [currentReport]);

  // Open Edit Modal for a specific report
  const handleOpenEdit = (reportToEdit = currentReport) => {
    if (!reportToEdit) return;
    setEditFormData({
      id: reportToEdit.id,
      isNew: false,
      plant: reportToEdit.plant,
      workDate: reportToEdit.workDate,
      author: reportToEdit.author,
      authorTitle: reportToEdit.authorTitle || "선임",
      items: JSON.parse(JSON.stringify(reportToEdit.items || [])),
      reasonsText: (reportToEdit.reasons || []).join("\n\n")
    });
    setIsEditModalOpen(true);
  };

  // Open New Report Modal with Date Picker
  const handleOpenNewReport = (defaultPlant = "삼랑진공장") => {
    const targetPlant = filterPlant !== "전체" ? filterPlant : defaultPlant;
    const todayStr = new Date().toISOString().split("T")[0];
    setEditFormData({
      id: `report_${targetPlant === "한림공장" ? "hanlim" : "samrangjin"}_${todayStr.replace(/-/g, "")}_${Date.now()}`,
      isNew: true,
      plant: targetPlant,
      workDate: todayStr,
      author: currentProfile?.name || (targetPlant === "한림공장" ? "우창용" : "양인나"),
      authorTitle: currentProfile?.title || "선임",
      items: targetPlant === "한림공장" ? [
        { id: 1, category: "CHANNEL", workContent: "밴딩 및 가공", names: "정상근, 링링", hours: 8, count: 2 },
        { id: 2, category: "JK1", workContent: "조인트 및 후가공", names: "테란스, 넷플림", hours: 8, count: 2 }
      ] : [
        { id: 1, category: "JA", workContent: "조인트 및 후가공", names: "로빈, 찬턴, 채수연", hours: 8, count: 3 },
        { id: 2, category: "NX4", workContent: "소재준비 및 조인트", names: "손선희, 이영숙, 버나드", hours: 8, count: 3 }
      ],
      reasonsText: "1. 주간 생산 물량 납품 대응\n\n2. 긴급 조인트 및 후가공 재고 확보"
    });
    setIsEditModalOpen(true);
  };

  // Select Report to View in Detail
  const handleSelectReport = (rep) => {
    setSelectedReportId(rep.id);
    if (detailSectionRef.current) {
      detailSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Handle Form Change
  const handleItemChange = (index, field, value) => {
    if (!editFormData) return;
    const newItems = [...editFormData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditFormData({ ...editFormData, items: newItems });
  };

  const handleAddItemRow = () => {
    if (!editFormData) return;
    const newItem = {
      id: Date.now(),
      category: editFormData.plant === "한림공장" ? "CHANNEL" : "JA",
      workContent: "작업내용 입력",
      names: "작업자명",
      hours: 8,
      count: 1
    };
    setEditFormData({ ...editFormData, items: [...editFormData.items, newItem] });
  };

  const handleRemoveItemRow = (index) => {
    if (!editFormData) return;
    const newItems = editFormData.items.filter((_, idx) => idx !== index);
    setEditFormData({ ...editFormData, items: newItems });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editFormData.workDate) {
      alert("근무 작업 일자를 지정해 주세요.");
      return;
    }

    const reportToSave = {
      id: editFormData.id,
      plant: editFormData.plant,
      title: `${editFormData.plant} 특근보고서`,
      workDate: editFormData.workDate,
      author: editFormData.author,
      authorTitle: editFormData.authorTitle || "선임",
      items: editFormData.items,
      reasons: editFormData.reasonsText.split("\n\n").filter((s) => s.trim())
    };

    const saved = await saveOvertimeReport(reportToSave);
    if (saved) {
      setSelectedReportId(saved.id);
    }
    setIsEditModalOpen(false);
  };

  const handleDeleteReport = async (rep, e) => {
    if (e) e.stopPropagation();
    if (reports.length <= 1) {
      alert("최소 1개의 특근보고서는 유지되어야 합니다.");
      return;
    }
    if (!window.confirm(`[${rep.plant}] ${rep.workDate} 특근보고서를 삭제하시겠습니까?`)) {
      return;
    }
    const updated = await deleteOvertimeReport(rep.id);
    setReports(updated);
    if (selectedReportId === rep.id) {
      setSelectedReportId(updated[0]?.id || "");
    }
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!currentReport) return;
    const rows = [
      [`${currentReport.plant} 특근보고서`],
      ["근무일자", currentReport.workDateFormatted, "작성자", `${currentReport.author} ${currentReport.authorTitle || ""}`, "총원", `${currentMetrics.headcount}명`, "총 투입공수", `${currentMetrics.manHours} M/H`, "특근산출비용", `₩${currentMetrics.cost.toLocaleString()}원`],
      [],
      ["구분", "작업내용", "작업자 명단", "특근시간", "인원(명)"]
    ];

    currentReport.items.forEach((item) => {
      rows.push([item.category, item.workContent, item.names, `${item.hours}시간`, `${item.count}명`]);
    });

    rows.push([]);
    rows.push(["※ 특근 실시 사유"]);
    currentReport.reasons.forEach((r, idx) => {
      rows.push([`${idx + 1}. ${r}`]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${currentReport.plant}_특근보고서`);
    XLSX.writeFile(wb, `${currentReport.plant}_특근보고서_${currentReport.workDate}.xlsx`);
  };

  // Helper to check if a report is the latest for its plant
  const isLatestForPlant = (rep) => {
    const plantList = reports.filter((r) => r.plant === rep.plant);
    return plantList[0]?.id === rep.id;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & ACTION BAR */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                공장별 특근보고서 관리 및 상세 현황
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                총 {reports.length}건 등록됨
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              등록된 특근보고서 목록을 한 줄씩 조회하고, 원하는 보고서를 클릭하여 상세 결재 내역을 확인 및 수정할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenNewReport("삼랑진공장")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ 신규 특근 작성 (날짜지정)</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>엑셀 다운로드</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md shadow-blue-500/25 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>인쇄 / PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ⭐ [요청사항 반영] 등록된 특근보고서 전체 목록 (한 줄씩 나열된 리스트 테이블) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* Table Top Filter & Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                등록된 특근보고서 목록 (전체 한줄 조회)
              </h2>
              <span className="text-[11px] text-slate-400">
                행을 클릭(탭)하면 하단에 해당 보고서의 상세 결재 문서가 즉시 표시됩니다.
              </span>
            </div>
          </div>

          {/* Plant Filter Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            {["전체", "삼랑진공장", "한림공장"].map((pName) => {
              const isSelected = filterPlant === pName;
              const count = pName === "전체" ? reports.length : reports.filter((r) => r.plant === pName).length;
              return (
                <button
                  key={pName}
                  onClick={() => setFilterPlant(pName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  {pName === "삼랑진공장" && <Factory className="w-3 h-3 text-amber-500" />}
                  {pName === "한림공장" && <Building2 className="w-3 h-3 text-emerald-500" />}
                  <span>{pName}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Informative Table (한 줄씩 나열) */}
        <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-extrabold">
                <th className="py-3 px-3 w-[6%] text-center">No</th>
                <th className="py-3 px-3 w-[11%] text-center">공장 구분</th>
                <th className="py-3 px-4 w-[16%]">근무 일자</th>
                <th className="py-3 px-3 w-[11%]">작성자</th>
                <th className="py-3 px-3 w-[10%] text-center">특근 인원</th>
                <th className="py-3 px-3 w-[10%] text-center">투입 공수</th>
                <th className="py-3 px-3 w-[13%] text-right">특근 산출비용</th>
                <th className="py-3 px-3 w-[10%] text-center">결재 상태</th>
                <th className="py-3 px-3 w-[13%] text-center">보고서 관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedReports.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 font-bold">
                    등록된 특근보고서가 없습니다. 상단의 [+ 신규 특근 작성] 버튼을 눌러 새 보고서를 등록해 주세요.
                  </td>
                </tr>
              ) : (
                displayedReports.map((rep, idx) => {
                  const isSelected = rep.id === currentReport?.id;
                  const isLatest = isLatestForPlant(rep);
                  const m = calculateReportMetrics(rep);

                  return (
                    <tr
                      key={rep.id}
                      onClick={() => handleSelectReport(rep)}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-l-indigo-600 font-semibold"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      {/* 1. No & State */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <span className="font-mono font-bold text-slate-500 text-xs">
                            {idx + 1}
                          </span>
                          {isLatest && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 whitespace-nowrap">
                              최신본
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Plant Badge */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black ${
                          rep.plant === "한림공장"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800"
                            : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800"
                        }`}>
                          {rep.plant === "한림공장" ? <Building2 className="w-3 h-3" /> : <Factory className="w-3 h-3" />}
                          <span>{rep.plant}</span>
                        </span>
                      </td>

                      {/* 3. Work Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-black text-xs text-slate-900 dark:text-white">
                            {formatShortWorkDate(rep.workDate)}
                          </span>
                          {isSelected && (
                            <span className="ml-1 px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold">
                              조회중
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Author */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {rep.author} {rep.authorTitle || "선임"}
                        </span>
                      </td>

                      {/* 5. Headcount */}
                      <td className="py-3 px-3 text-center font-black text-xs text-slate-900 dark:text-white">
                        {m.headcount}명
                      </td>

                      {/* 6. Total Man-Hours */}
                      <td className="py-3 px-3 text-center font-bold text-xs text-purple-600 dark:text-purple-400 font-mono">
                        {m.manHours} M/H
                      </td>

                      {/* 7. Cost */}
                      <td className="py-3 px-3 text-right font-black text-xs text-rose-600 dark:text-rose-400 font-mono">
                        ₩{m.cost.toLocaleString()}원
                      </td>

                      {/* 8. Approval Status */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10.5px] font-black">
                          <CheckCheck className="w-3 h-3 text-emerald-500" />
                          <span>결재완료</span>
                        </span>
                      </td>

                      {/* 9. Actions */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectReport(rep)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 font-bold text-[11px] transition-colors"
                            title="상세 결재 문서 보기"
                          >
                            상세
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(rep)}
                            className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="보고서 수정"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                          </button>
                          {reports.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteReport(rep, e)}
                              className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                              title="보고서 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ⭐ [선택된 보고서] 특근 결재 문서 상세 내역 (와이드 테이블 + 결재란 + 사유) */}
      {/* ========================================================================= */}
      <div ref={detailSectionRef} className="space-y-4 pt-2">
        {/* Active Report Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
              currentReport.plant === "한림공장" ? "bg-emerald-600 text-white" : "bg-amber-500 text-slate-950"
            }`}>
              {currentReport.plant}
            </span>
            <span className="font-black text-sm sm:text-base">
              📅 {currentReport.workDateFormatted} 특근 결재 상세 문서
            </span>
            {isLatestForPlant(currentReport) && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                ⭐ 메인 대시보드 현황 반영중
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenEdit(currentReport)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
            >
              <Edit3 className="w-3 h-3 text-amber-400" />
              <span>이 보고서 수정</span>
            </button>
          </div>
        </div>

        {/* 2-Columns Layout: 좌측 와이드 테이블 + 우측 결재/사유 패널 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
          {/* ========================================================= */}
          {/* 좌측: 와이드 특근 상세 테이블 (8 컬럼) */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    currentReport.plant === "한림공장" ? "bg-emerald-500" : "bg-amber-500"
                  }`}></span>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {currentReport.plant} 특근 세부 내역 ({currentReport.items.length}개 항목)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">
                    근무일자: <strong className="text-slate-800 dark:text-slate-200 font-black">{currentReport.workDateFormatted}</strong>
                  </span>
                </div>
              </div>

              {/* 와이드 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-extrabold">
                      <th className="py-3 px-3 w-[15%]">구 분</th>
                      <th className="py-3 px-3 w-[20%]">작업내용</th>
                      <th className="py-3 px-3 w-[45%]">명 단</th>
                      <th className="py-3 px-2 w-[10%] text-center">작업시간</th>
                      <th className="py-3 px-2 w-[10%] text-center">인 원</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentReport.items.map((item, idx) => (
                      <tr
                        key={item.id || idx}
                        className="hover:bg-amber-50/30 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                          {item.workContent}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white leading-relaxed">
                          {item.names}
                        </td>
                        <td className="py-2.5 px-2 text-center font-black text-slate-700 dark:text-slate-300">
                          {item.hours} 시간
                        </td>
                        <td className={`py-2.5 px-2 text-center font-black text-sm ${
                          currentReport.plant === "한림공장" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                        }`}>
                          {item.count} 명
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Total Footer Row */}
                  <tfoot>
                    <tr className="border-t-2 border-slate-900 dark:border-slate-600 bg-amber-50/60 dark:bg-amber-950/40 font-black text-xs">
                      <td colSpan="3" className="py-3 px-4 text-right text-slate-800 dark:text-slate-200 font-extrabold">
                        {currentReport.plant} 총 합 계
                      </td>
                      <td className="py-3 px-2 text-center text-slate-900 dark:text-white font-black text-sm">
                        {currentMetrics.manHours} M/H
                      </td>
                      <td className={`py-3 px-2 text-center font-black text-base ${
                        currentReport.plant === "한림공장" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                      }`}>
                        {currentMetrics.headcount} 명
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 우측 사이드 패널: 결재란, 실시 사유 & 구분별 인원 요약 (4 컬럼) */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. 공식 결재란 (담당 | 책임 | 이사 | 대표) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Award className={`w-4 h-4 ${currentReport.plant === "한림공장" ? "text-emerald-500" : "text-amber-500"}`} />
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {currentReport.plant} 결재 정보
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  작성자: <strong className="text-slate-700 dark:text-slate-300">{currentReport.author} {currentReport.authorTitle || "선임"}</strong>
                </span>
              </div>

              {/* Approval Stamp Matrix */}
              <div className="border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/40">
                <table className="w-full text-center border-collapse text-xs">
                  <tbody>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-300 dark:border-slate-700">
                      <td rowSpan="2" className="w-10 border-r border-slate-300 dark:border-slate-700 py-3 bg-slate-200/60 dark:bg-slate-700/60 font-black text-[11px]">
                        결<br />재
                      </td>
                      {currentReport.approval.map((ap, idx) => (
                        <td key={ap.role} className={`py-1.5 font-extrabold text-[11px] ${idx < 3 ? "border-r border-slate-300 dark:border-slate-700" : ""}`}>
                          {ap.role}
                        </td>
                      ))}
                    </tr>
                    <tr className="h-14">
                      {currentReport.approval.map((ap, idx) => (
                        <td key={ap.role} className={`p-1.5 align-middle ${idx < 3 ? "border-r border-slate-300 dark:border-slate-700" : ""}`}>
                          <div className="flex flex-col items-center justify-center">
                            <span className="font-black text-xs text-slate-900 dark:text-white">{ap.name}</span>
                            <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-0.5 mt-0.5">
                              <CheckCheck className="w-2.5 h-2.5" />
                              <span>완료</span>
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Quick Plant Badge & Stats */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">특근 산출 비용</span>
                <span className="font-black text-sm text-rose-600 dark:text-rose-400 font-mono">
                  ₩{currentMetrics.cost.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* 2. 특근 실시 사유 패널 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <FileText className="w-4 h-4 text-blue-500" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  ※ 특근 실시 사유
                </h3>
              </div>
              <div className="space-y-2">
                {currentReport.reasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-amber-50/50 dark:bg-slate-800/60 border border-amber-200/60 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-wrap"
                  >
                    {reason}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. 구분별 인원 통계 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Layers className="w-4 h-4 text-purple-500" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  공정/차종별 인원 구성
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {currentMetrics.lines.map(({ name, count }) => (
                  <div key={name} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-300">{name}</span>
                    <span className={`font-black ${
                      currentReport.plant === "한림공장" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    }`}>{count}명</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 EDIT / CREATE MODAL (날짜 지정 및 내용 수정) */}
      {/* ========================================================================= */}
      {isEditModalOpen && editFormData && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-6 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-500" />
                  <span>{editFormData.isNew ? `${editFormData.plant} 신규 특근보고서 작성` : `${editFormData.plant} 특근보고서 수정`}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  근무 일자를 지정하고 투입 인원 및 특근 시간을 입력해 주세요. (저장 시 현황에 마지막 수정본으로 자동 반영됩니다)
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 1. 공장 선택 */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">소속 공장</label>
                  <select
                    value={editFormData.plant}
                    onChange={(e) => setEditFormData({ ...editFormData, plant: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white"
                  >
                    <option value="삼랑진공장">삼랑진공장</option>
                    <option value="한림공장">한림공장</option>
                  </select>
                </div>

                {/* 2. 작업 일자 선택 (Date Picker) */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    📅 근무 작업 일자
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.workDate}
                    onChange={(e) => setEditFormData({ ...editFormData, workDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-indigo-500/50 dark:border-indigo-500/40 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block mt-1">
                    {formatKoreanWorkDate(editFormData.workDate)}
                  </span>
                </div>

                {/* 3. 작성자 */}
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">작성자 / 직위</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      placeholder="작성자명"
                      value={editFormData.author}
                      onChange={(e) => setEditFormData({ ...editFormData, author: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="직위"
                      value={editFormData.authorTitle || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, authorTitle: e.target.value })}
                      className="w-20 px-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Items Table Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    특근 작업 명단 및 시간 입력 ({editFormData.items.length}개 항목)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 font-black hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>행 추가</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl max-h-80 overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse min-w-[650px]">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                      <tr className="font-black text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-2 w-[18%]">구 분</th>
                        <th className="py-2.5 px-2 w-[22%]">작업내용</th>
                        <th className="py-2.5 px-2 w-[36%]">명 단 (쉼표 구분)</th>
                        <th className="py-2.5 px-2 w-[10%] text-center">시간</th>
                        <th className="py-2.5 px-2 w-[10%] text-center">인원</th>
                        <th className="py-2.5 px-1 w-[4%] text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {editFormData.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={item.category}
                              onChange={(e) => handleItemChange(idx, "category", e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold bg-white dark:bg-slate-900"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={item.workContent}
                              onChange={(e) => handleItemChange(idx, "workContent", e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium bg-white dark:bg-slate-900"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={item.names}
                              onChange={(e) => handleItemChange(idx, "names", e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium bg-white dark:bg-slate-900"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <input
                              type="number"
                              min="1"
                              max="24"
                              value={item.hours}
                              onChange={(e) => handleItemChange(idx, "hours", e.target.value)}
                              className="w-14 px-1.5 py-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 font-bold bg-white dark:bg-slate-900"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.count}
                              onChange={(e) => handleItemChange(idx, "count", e.target.value)}
                              className="w-14 px-1.5 py-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 font-black text-amber-600 bg-white dark:bg-slate-900"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="p-1 text-slate-300 hover:text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reasons */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  ※ 특 근 실 시 사 유 (단락별 2번 줄바꿈으로 구분)
                </label>
                <textarea
                  rows="4"
                  value={editFormData.reasonsText}
                  onChange={(e) => setEditFormData({ ...editFormData, reasonsText: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium leading-relaxed"
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black shadow-md shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>특근보고서 저장 (현황 자동 반영)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
