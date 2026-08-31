import React, { useState, useMemo, useRef } from "react";
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
  CheckCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";

// Default Initial Overtime Report Dataset from User's uploaded official document
const INITIAL_REPORTS = [
  {
    id: "report_20260829",
    title: "특 근 보 고 서",
    workDate: "2026-08-29",
    workDateFormatted: "2026년 8월 29일 토요일",
    author: "양인나",
    authorTitle: "선임",
    items: [
      { id: 1, category: "관리자", workContent: "한림 공장 지원", names: "이명재", hours: 8, count: 1 },
      { id: 2, category: "관리자", workContent: "출하관리", names: "유동길", hours: 8, count: 1 },
      { id: 3, category: "JA", workContent: "조인트", names: "로빈, 찬턴, 크리스토퍼", hours: 8, count: 3 },
      { id: 4, category: "JA", workContent: "후가공", names: "채수연, 피아, 데이시, 짱", hours: 8, count: 4 },
      { id: 5, category: "JA", workContent: "검사", names: "김선옥", hours: 8, count: 1 },
      { id: 6, category: "JA, HR", workContent: "소재준비", names: "이스라엘", hours: 8, count: 1 },
      { id: 7, category: "NX4", workContent: "소재준비", names: "손선희, 이영숙, 수베트, 치찬, 콩지", hours: 8, count: 5 },
      { id: 8, category: "NX4", workContent: "조인트", names: "버나드, 돈돈, 알라딘", hours: 8, count: 3 },
      { id: 9, category: "NX4a", workContent: "조인트", names: "롤란도", hours: 8, count: 1 },
      { id: 10, category: "NX4a", workContent: "후가공, 검사", names: "김순미, 양인순", hours: 8, count: 2 },
      { id: 11, category: "CHANNEL", workContent: "밴딩", names: "정상근", hours: 8, count: 1 },
      { id: 12, category: "CHANNEL", workContent: "가공", names: "링링, 유미", hours: 8, count: 2 },
      { id: 13, category: "압출", workContent: "압출", names: "이상은", hours: 12, count: 1 },
      { id: 14, category: "압출", workContent: "TPE 압출", names: "지미", hours: 12, count: 1 },
      { id: 15, category: "압출", workContent: "PCM#3 압출", names: "이수루", hours: 12, count: 1 },
      { id: 16, category: "압출", workContent: "PCM#1 압출", names: "샤면", hours: 12, count: 1 },
      { id: 17, category: "코팅", workContent: "코팅", names: "코팅준", hours: 8, count: 1 },
      { id: 18, category: "공통", workContent: "코팅", names: "이성기, 조마루", hours: 8, count: 2 },
      { id: 19, category: "CE1, DT HOOD", workContent: "소재준비", names: "쏘달", hours: 8, count: 1 },
      { id: 20, category: "DT HOOD", workContent: "조인트", names: "롬나차이, 마리오, 제랄드, 포티퐁", hours: 8, count: 4 },
      { id: 21, category: "CE1", workContent: "후가공", names: "팔라, 린", hours: 8, count: 2 },
      { id: 22, category: "DT HOOD", workContent: "후가공", names: "누리", hours: 8, count: 1 },
      { id: 23, category: "JK1", workContent: "조인트", names: "테란스", hours: 8, count: 1 },
      { id: 24, category: "JK1", workContent: "후가공", names: "넷플림, 그레이스, 제인", hours: 8, count: 3 }
    ],
    reasons: [
      "1. PCM 1호 : DT SILL SEAL\n   →PCM 3호 : DT 호리젠탈\n   →TPE : JA",
      "2. DT HOOD 코팅",
      "3. NX4a 단산까지 수출 창고 입고 요청",
      "4. PU KD 재고 확보"
    ]
  }
];

const STORAGE_KEY = "official_overtime_reports_store_v2_horizontal";

export const OvertimeStatusView = () => {
  const { currentProfile } = useAuth();
  const printRef = useRef(null);

  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_REPORTS;
    } catch {
      return INITIAL_REPORTS;
    }
  });

  const [selectedReportId, setSelectedReportId] = useState(reports[0]?.id || "report_20260829");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const currentReport = useMemo(() => {
    return reports.find((r) => r.id === selectedReportId) || reports[0];
  }, [reports, selectedReportId]);

  // Form State for editing/creating report
  const [editFormData, setEditFormData] = useState(null);

  // Total calculations
  const totalCount = useMemo(() => {
    return currentReport?.items?.reduce((sum, item) => sum + (Number(item.count) || 0), 0) || 0;
  }, [currentReport]);

  const totalManHours = useMemo(() => {
    return currentReport?.items?.reduce((sum, item) => sum + ((Number(item.hours) || 0) * (Number(item.count) || 0)), 0) || 0;
  }, [currentReport]);

  // Group breakdown by category
  const categoryStats = useMemo(() => {
    const map = {};
    currentReport?.items?.forEach((item) => {
      const cat = item.category || "기타";
      map[cat] = (map[cat] || 0) + (Number(item.count) || 0);
    });
    return Object.entries(map).map(([category, count]) => ({ category, count }));
  }, [currentReport]);

  // Format date in Korean (YYYY년 M월 D일 요일)
  const formatDateToKorean = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${days[date.getDay()]}`;
    } catch {
      return dateStr;
    }
  };

  // Open Edit Modal
  const handleOpenEdit = () => {
    setEditFormData({
      id: currentReport.id,
      workDate: currentReport.workDate,
      author: currentReport.author,
      items: JSON.parse(JSON.stringify(currentReport.items || [])),
      reasonsText: (currentReport.reasons || []).join("\n\n")
    });
    setIsEditModalOpen(true);
  };

  // Open Create New Report Modal
  const handleOpenCreateNew = () => {
    const today = new Date().toISOString().split("T")[0];
    setEditFormData({
      id: "report_" + Date.now(),
      workDate: today,
      author: currentProfile?.name || "양인나",
      items: [
        { id: 1, category: "관리자", workContent: "공장 총괄 관리", names: currentProfile?.name || "이명재", hours: 8, count: 1 },
        { id: 2, category: "압출", workContent: "압출 라인 가동", names: "설유철", hours: 8, count: 1 },
        { id: 3, category: "가공", workContent: "절단 및 후가공", names: "윤경수, 양인나", hours: 8, count: 2 },
        { id: 4, category: "품질", workContent: "출하 검사", names: "이창엽", hours: 8, count: 1 }
      ],
      reasonsText: "1. 9BQC 긴급 출하 대응을 위한 주말 생산 가동\n\n2. DT 수출품 포장 및 전수 검사\n\n3. 재고 확보 및 설비 점검"
    });
    setIsEditModalOpen(true);
  };

  // Handle Form Item Change
  const handleItemChange = (index, field, value) => {
    if (!editFormData) return;
    const newItems = [...editFormData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto calculate count from comma-separated names if name changed
    if (field === "names" && typeof value === "string") {
      const namesList = value.split(/[,，]/).map(n => n.trim()).filter(n => n.length > 0);
      if (namesList.length > 0) {
        newItems[index].count = namesList.length;
      }
    }

    setEditFormData({ ...editFormData, items: newItems });
  };

  // Add Item Row
  const handleAddItemRow = () => {
    if (!editFormData) return;
    const newItem = {
      id: Date.now() + Math.random(),
      category: "",
      workContent: "",
      names: "",
      hours: 8,
      count: 1
    };
    setEditFormData({
      ...editFormData,
      items: [...editFormData.items, newItem]
    });
  };

  // Remove Item Row
  const handleRemoveItemRow = (index) => {
    if (!editFormData) return;
    const newItems = editFormData.items.filter((_, idx) => idx !== index);
    setEditFormData({ ...editFormData, items: newItems });
  };

  // Save Report
  const handleSaveReport = (e) => {
    e.preventDefault();
    if (!editFormData) return;

    const reasonsArr = editFormData.reasonsText
      .split("\n\n")
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const updatedReport = {
      id: editFormData.id,
      title: "특 근 보 고 서",
      workDate: editFormData.workDate,
      workDateFormatted: formatDateToKorean(editFormData.workDate),
      author: editFormData.author,
      items: editFormData.items.filter(it => it.category || it.names || it.workContent),
      reasons: reasonsArr.length > 0 ? reasonsArr : [editFormData.reasonsText]
    };

    const exists = reports.some(r => r.id === updatedReport.id);
    let newReportsList;
    if (exists) {
      newReportsList = reports.map(r => r.id === updatedReport.id ? updatedReport : r);
    } else {
      newReportsList = [updatedReport, ...reports];
    }

    setReports(newReportsList);
    setSelectedReportId(updatedReport.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newReportsList));
    setIsEditModalOpen(false);
  };

  // Delete Current Report
  const handleDeleteReport = () => {
    if (reports.length <= 1) {
      alert("최소 1개의 특근보고서는 유지되어야 합니다.");
      return;
    }
    if (!window.confirm(`[${currentReport.workDateFormatted}] 특근보고서를 삭제하시겠습니까?`)) return;

    const updated = reports.filter(r => r.id !== currentReport.id);
    setReports(updated);
    setSelectedReportId(updated[0].id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel Matching Exact Sheet Structure
  const handleExportExcel = () => {
    const r = currentReport;
    const rows = [
      ["특  근  보  고  서", "", "", "결재", "담당", "책임", "이사", "대표"],
      ["", "", "", "", "", "", "", ""],
      [`작 업 일 시 : ${r.workDateFormatted}`, "", "", "", "", `작성자 : ${r.author}`, "", ""],
      [],
      ["구 분", "작업내용", "명  단", "작업시간", "인 원"]
    ];

    r.items.forEach((item) => {
      rows.push([
        item.category,
        item.workContent,
        item.names,
        item.hours,
        item.count
      ]);
    });

    // Total row
    rows.push(["", "", "", "합계", totalCount]);
    rows.push([]);
    rows.push(["※ 특 근 실 시 사 유"]);

    r.reasons.forEach((reason) => {
      rows.push([reason]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "특근보고서");
    XLSX.writeFile(wb, `특근보고서_${r.workDate}_${r.author}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP HORIZONTAL CONTROL BAR */}
      {/* ========================================================================= */}
      <div className="print:hidden bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Title & Quick Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                특근현황 • 공식 특근보고서
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-black">
                {currentReport.workDateFormatted}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              작성자: <strong>{currentReport.author}</strong> | 총 특근인원: <strong className="text-amber-600 font-black">{totalCount}명</strong> (총 {totalManHours} M/H)
            </p>
          </div>
        </div>

        {/* Right: Date Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Report Date Select Dropdown */}
          <select
            value={selectedReportId}
            onChange={(e) => setSelectedReportId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {reports.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.workDateFormatted} (작성: {rep.author})
              </option>
            ))}
          </select>

          <button
            onClick={handleOpenEdit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 transition-all shadow-sm active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
            <span>보고서 수정</span>
          </button>

          <button
            onClick={handleOpenCreateNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 보고서 작성</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>엑셀 다운로드</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md shadow-blue-500/25 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>인쇄 / PDF 저장</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. WIDESCREEN HORIZONTAL DASHBOARD (TABLE + SIDEBAR REASONS & APPROVAL) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
        {/* ========================================================= */}
        {/* LEFT MAIN: WIDE OVERTIME REPORT TABLE (8 Columns on Large Screens) */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  특근 작업 상세 내역 ({currentReport.items.length}개 항목)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">
                  작업일시: <strong className="text-slate-800 dark:text-slate-200">{currentReport.workDateFormatted}</strong>
                </span>
              </div>
            </div>

            {/* High Readability Wide Table */}
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
                      <td className="py-2.5 px-2 text-center font-black text-amber-600 dark:text-amber-400 text-sm">
                        {item.count} 명
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Total Footer Row */}
                <tfoot>
                  <tr className="border-t-2 border-slate-900 dark:border-slate-600 bg-amber-50/60 dark:bg-amber-950/40 font-black text-xs">
                    <td colSpan="3" className="py-3 px-4 text-right text-slate-800 dark:text-slate-200 font-extrabold">
                      총 합 계
                    </td>
                    <td className="py-3 px-2 text-center text-slate-900 dark:text-white font-black text-sm">
                      {totalManHours} M/H
                    </td>
                    <td className="py-3 px-2 text-center text-amber-600 dark:text-amber-400 font-black text-base">
                      {totalCount} 명
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT SIDE PANEL: APPROVAL, REASONS & CATEGORY BREAKDOWN (4 Columns) */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Official Document Card with Approval Box (결재란) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  특근 보고 결재 정보
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                작성: {currentReport.author}
              </span>
            </div>

            {/* Approval Table Box */}
            <div className="border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden shadow-inner text-xs text-center">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-300 dark:border-slate-700">
                    <td rowSpan="2" className="border-r border-slate-300 dark:border-slate-700 px-2 py-3 bg-slate-200/60 dark:bg-slate-800/90 font-black w-10 text-[11px] align-middle">
                      결<br />재
                    </td>
                    <td className="border-r border-slate-300 dark:border-slate-700 py-1.5">담당</td>
                    <td className="border-r border-slate-300 dark:border-slate-700 py-1.5">책임</td>
                    <td className="border-r border-slate-300 dark:border-slate-700 py-1.5">이사</td>
                    <td className="py-1.5">대표</td>
                  </tr>
                  <tr className="h-14 bg-white dark:bg-slate-900">
                    <td className="border-r border-slate-300 dark:border-slate-700 text-[10px] text-slate-400 font-semibold align-bottom pb-1">
                      {currentReport.author} (인)
                    </td>
                    <td className="border-r border-slate-300 dark:border-slate-700 text-[10px] text-slate-300 font-semibold align-bottom pb-1">
                      (서명)
                    </td>
                    <td className="border-r border-slate-300 dark:border-slate-700 text-[10px] text-slate-300 font-semibold align-bottom pb-1">
                      (서명)
                    </td>
                    <td className="text-[10px] text-slate-300 font-semibold align-bottom pb-1">
                      (서명)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Quick Metadata */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">작업 일시:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{currentReport.workDateFormatted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">작 성 자:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{currentReport.author} 선임</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">총 출근 인원:</span>
                <span className="font-black text-amber-600 dark:text-amber-400">{totalCount} 명</span>
              </div>
            </div>
          </div>

          {/* 2. ※ 특 근 실 시 사 유 (Overtime Reasons Card) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                ※ 특 근 실 시 사 유
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              {currentReport.reasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-slate-800 dark:text-slate-200 font-semibold whitespace-pre-line leading-relaxed"
                >
                  {reason}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Category Breakdown (구분별 인원 요약) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Users className="w-4 h-4 text-emerald-500" />
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                공정 / 구분별 투입 인원 요약
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {categoryStats.map(({ category, count }) => (
                <div
                  key={category}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-xs"
                >
                  <span className="font-bold text-slate-600 dark:text-slate-300">{category}</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">{count}명</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINT-ONLY OFFICIAL FORMAT (Visible only when Printing on A4 paper) */}
      {/* ========================================================================= */}
      <div className="hidden print:block font-sans text-black p-4">
        <div className="flex items-start justify-between mb-4 pb-2 border-b-2 border-black">
          <div>
            <h1 className="text-3xl font-black tracking-[0.3em] text-black">
              특 근 보 고 서
            </h1>
            <div className="text-xs font-bold mt-2">
              작 업 일 시 : <span className="font-black text-sm">{currentReport.workDateFormatted}</span>
            </div>
          </div>

          {/* Print Approval Box */}
          <div className="border border-black text-xs text-center">
            <table className="border-collapse">
              <tbody>
                <tr>
                  <td rowSpan="2" className="border border-black px-2 py-3 bg-slate-100 font-bold text-[10px] align-middle">
                    결<br />재
                  </td>
                  <td className="border border-black px-3 py-1 font-bold w-14 bg-slate-100">담당</td>
                  <td className="border border-black px-3 py-1 font-bold w-14 bg-slate-100">책임</td>
                  <td className="border border-black px-3 py-1 font-bold w-14 bg-slate-100">이사</td>
                  <td className="border border-black px-3 py-1 font-bold w-14 bg-slate-100">대표</td>
                </tr>
                <tr>
                  <td className="border border-black h-10 text-[9px] align-bottom pb-1">{currentReport.author}</td>
                  <td className="border border-black h-10"></td>
                  <td className="border border-black h-10"></td>
                  <td className="border border-black h-10"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Print Subheader */}
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span>작업일시 : {currentReport.workDateFormatted}</span>
          <span>작성자 : {currentReport.author}</span>
        </div>

        {/* Print Table */}
        <table className="w-full border-collapse border border-black text-[10px] text-center">
          <thead>
            <tr className="bg-slate-200 border-b border-black font-extrabold">
              <th className="border border-black py-1.5 px-1 w-[16%]">구 분</th>
              <th className="border border-black py-1.5 px-1 w-[22%]">작업내용</th>
              <th className="border border-black py-1.5 px-2 w-[46%] text-center">명 단</th>
              <th className="border border-black py-1.5 px-1 w-[8%]">작업시간</th>
              <th className="border border-black py-1.5 px-1 w-[8%]">인 원</th>
            </tr>
          </thead>
          <tbody>
            {currentReport.items.map((item, idx) => (
              <tr key={idx} className="border-b border-black">
                <td className="border border-black py-1 px-1 font-bold">{item.category}</td>
                <td className="border border-black py-1 px-1">{item.workContent}</td>
                <td className="border border-black py-1 px-2 text-left">{item.names}</td>
                <td className="border border-black py-1 px-1 font-bold">{item.hours}</td>
                <td className="border border-black py-1 px-1 font-bold">{item.count}</td>
              </tr>
            ))}
            <tr className="bg-slate-200 border-t-2 border-black font-black text-xs">
              <td colSpan="4" className="border border-black py-1.5 px-2 text-right pr-4">합 계 (총 인원)</td>
              <td className="border border-black py-1.5 px-1 text-center font-black">{totalCount}</td>
            </tr>
          </tbody>
        </table>

        {/* Print Reasons */}
        <div className="mt-4 border-t-2 border-black pt-2 space-y-1">
          <div className="font-black text-xs">※ 특 근 실 시 사 유</div>
          {currentReport.reasons.map((reason, idx) => (
            <div key={idx} className="text-[10px] whitespace-pre-line leading-relaxed pl-1">
              {reason}
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EDIT / CREATE OVERTIME REPORT */}
      {/* ========================================================================= */}
      {isEditModalOpen && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    특근보고서 작성 / 수정
                  </h3>
                  <p className="text-xs text-slate-400">
                    작업일시, 작성자, 구분별 명단 및 특근 사유를 입력합니다.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                닫기
              </button>
            </div>

            <form onSubmit={handleSaveReport} className="space-y-6 text-xs">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    작업 일시
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.workDate}
                    onChange={(e) => setEditFormData({ ...editFormData, workDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[11px] text-amber-600 font-bold mt-1 block">
                    {formatDateToKorean(editFormData.workDate)}
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    작성자 성명
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.author}
                    onChange={(e) => setEditFormData({ ...editFormData, author: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
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
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-black hover:bg-blue-100 transition-colors"
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
                              placeholder="예: JA / NX4"
                              value={item.category}
                              onChange={(e) => handleItemChange(idx, "category", e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold bg-white dark:bg-slate-900"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              placeholder="예: 조인트 / 후가공"
                              value={item.workContent}
                              onChange={(e) => handleItemChange(idx, "workContent", e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium bg-white dark:bg-slate-900"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              placeholder="예: 로빈, 찬턴, 크리스토퍼"
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

              {/* Reasons Section */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  ※ 특 근 실 시 사 유 (단락별 2번 줄바꿈으로 구분)
                </label>
                <textarea
                  rows="4"
                  value={editFormData.reasonsText}
                  onChange={(e) => setEditFormData({ ...editFormData, reasonsText: e.target.value })}
                  placeholder="1. PCM 1호 : DT SILL SEAL..."
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleDeleteReport}
                  className="px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>보고서 삭제</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>특근보고서 저장</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
