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
  Check
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";
import {
  getLocalOvertimeReports,
  saveOvertimeReport,
  deleteOvertimeReport,
  subscribeOvertimeReports,
  formatKoreanWorkDate,
  formatShortWorkDate
} from "../services/overtimeService";

export const OvertimeStatusView = () => {
  const { currentProfile, isAdmin } = useAuth();
  const printRef = useRef(null);

  const [reports, setReports] = useState(() => getLocalOvertimeReports());
  const [activePlant, setActivePlant] = useState("삼랑진공장");
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

  // Filter reports by active plant
  const plantReports = useMemo(() => {
    const list = reports.filter((r) => r.plant === activePlant);
    return list.length > 0 ? list : reports.filter((r) => r.plant === "삼랑진공장");
  }, [reports, activePlant]);

  // Current active report
  const currentReport = useMemo(() => {
    const found = reports.find((r) => r.id === selectedReportId);
    if (found && found.plant === activePlant) return found;
    return plantReports[0] || reports[0];
  }, [reports, selectedReportId, activePlant, plantReports]);

  // Calculations
  const totalCount = useMemo(() => {
    return currentReport?.items?.reduce((sum, item) => sum + (Number(item.count) || 0), 0) || 0;
  }, [currentReport]);

  const totalManHours = useMemo(() => {
    return currentReport?.items?.reduce((sum, item) => sum + ((Number(item.hours) || 0) * (Number(item.count) || 0)), 0) || 0;
  }, [currentReport]);

  const totalCost = useMemo(() => {
    return totalManHours * 15000;
  }, [totalManHours]);

  // Group breakdown by category
  const categoryStats = useMemo(() => {
    const map = {};
    currentReport?.items?.forEach((item) => {
      const cat = item.category || "기타";
      map[cat] = (map[cat] || 0) + (Number(item.count) || 0);
    });
    return Object.entries(map).map(([category, count]) => ({ category, count }));
  }, [currentReport]);

  // Switch Plant
  const handleSwitchPlant = (plantName) => {
    setActivePlant(plantName);
    const targetReports = reports.filter((r) => r.plant === plantName);
    if (targetReports.length > 0) {
      setSelectedReportId(targetReports[0].id);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!currentReport) return;
    setEditFormData({
      id: currentReport.id,
      isNew: false,
      plant: currentReport.plant,
      workDate: currentReport.workDate,
      author: currentReport.author,
      authorTitle: currentReport.authorTitle || "선임",
      items: JSON.parse(JSON.stringify(currentReport.items || [])),
      reasonsText: (currentReport.reasons || []).join("\n\n")
    });
    setIsEditModalOpen(true);
  };

  // Open New Report Modal with Date Picker
  const handleOpenNewReport = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    setEditFormData({
      id: `report_${activePlant === "한림공장" ? "hanlim" : "samrangjin"}_${todayStr.replace(/-/g, "")}_${Date.now()}`,
      isNew: true,
      plant: activePlant,
      workDate: todayStr,
      author: currentProfile?.name || (activePlant === "한림공장" ? "우창용" : "양인나"),
      authorTitle: currentProfile?.title || "선임",
      items: activePlant === "한림공장" ? [
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
      setActivePlant(saved.plant);
    }
    setIsEditModalOpen(false);
  };

  const handleDeleteCurrentReport = async () => {
    if (!currentReport) return;
    if (reports.length <= 1) {
      alert("최소 1개의 특근보고서는 유지되어야 합니다.");
      return;
    }
    if (!window.confirm(`[${currentReport.plant}] ${currentReport.workDate} 특근보고서를 삭제하시겠습니까?`)) {
      return;
    }
    const updated = await deleteOvertimeReport(currentReport.id);
    setReports(updated);
    setSelectedReportId(updated[0]?.id || "");
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel
  const handleExportExcel = () => {
    const rows = [
      [`${currentReport.plant} 특근보고서`],
      ["근무일자", currentReport.workDateFormatted, "작성자", `${currentReport.author} ${currentReport.authorTitle || ""}`, "총원", `${totalCount}명`, "총 투입공수", `${totalManHours} M/H`, "특근산출비용", `₩${totalCost.toLocaleString()}원`],
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

  return (
    <div className="space-y-6 animate-fadeIn pb-24 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & FACTORY / DATE SELECTOR (삼랑진공장 / 한림공장 & 날짜별 보고서) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                공장별 특근보고서 (Overtime Status)
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                currentReport.plant === "한림공장"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              }`}>
                {currentReport.plant} (총 {totalCount}명)
              </span>
              {currentReport.id === plantReports[0]?.id && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  마지막 수정본 (최신)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              공식 특근 결재 문서 • 근무일시: <strong>{currentReport.workDateFormatted}</strong> | 총 투입공수: <strong>{totalManHours} M/H</strong> | 특근 산출비용: <strong className="text-rose-600 dark:text-rose-400">₩{totalCost.toLocaleString()}원</strong>
            </p>
          </div>
        </div>

        {/* Factory Switcher, Date Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Factory Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {["삼랑진공장", "한림공장"].map((plantName) => {
              const isSelected = activePlant === plantName;
              const countForPlant = reports.filter((r) => r.plant === plantName).length;
              return (
                <button
                  key={plantName}
                  onClick={() => handleSwitchPlant(plantName)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? plantName === "한림공장"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-amber-500 text-slate-950 shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  {plantName === "한림공장" ? <Building2 className="w-3.5 h-3.5" /> : <Factory className="w-3.5 h-3.5" />}
                  <span>{plantName} ({countForPlant}건)</span>
                </button>
              );
            })}
          </div>

          {/* Date Selector for Active Plant (when multiple reports exist) */}
          {plantReports.length > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <select
                value={selectedReportId}
                onChange={(e) => setSelectedReportId(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-900 dark:text-white cursor-pointer focus:outline-none"
              >
                {plantReports.map((rep, idx) => (
                  <option key={rep.id} value={rep.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                    📅 {rep.workDate} {idx === 0 ? "(최신 수정본)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* New Report Button */}
          <button
            onClick={handleOpenNewReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-sm active:scale-95"
            title="새로운 근무 날짜의 특근보고서 작성"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>신규 특근 작성</span>
          </button>

          {/* Edit Button */}
          <button
            onClick={handleOpenEdit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 transition-all shadow-sm active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
            <span>보고서 수정</span>
          </button>

          {/* Delete Button (when multiple exist) */}
          {reports.length > 1 && (
            <button
              onClick={handleDeleteCurrentReport}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
              title="이 특근보고서 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>엑셀</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md shadow-blue-500/25 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>인쇄</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ⭐ 와이드스크린 가로형 대시보드 (좌측 넓은 표 + 우측 결재/사유 패널) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
        {/* ========================================================= */}
        {/* 좌측 메인: 와이드 특근 보고 테이블 (8 컬럼) */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  currentReport.plant === "한림공장" ? "bg-emerald-500" : "bg-amber-500"
                }`}></span>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {currentReport.plant} 특근 상세 내역 ({currentReport.items.length}개 항목)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">
                  근무일자: <strong className="text-slate-800 dark:text-slate-200 font-black">{currentReport.workDateFormatted}</strong>
                </span>
              </div>
            </div>

            {/* 고가독성 와이드 테이블 */}
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
                      {totalManHours} M/H
                    </td>
                    <td className={`py-3 px-2 text-center font-black text-base ${
                      currentReport.plant === "한림공장" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {totalCount} 명
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
                ₩{totalCost.toLocaleString()}원
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
              {categoryStats.map(({ category, count }) => (
                <div key={category} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-300">{category}</span>
                  <span className={`font-black ${
                    currentReport.plant === "한림공장" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                  }`}>{count}명</span>
                </div>
              ))}
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
