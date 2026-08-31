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
  CheckCheck,
  Building2,
  Factory
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";

// Default Initial Overtime Reports (Split into 삼랑진공장 & 한림공장)
const INITIAL_REPORTS = [
  {
    id: "report_samrangjin_20260829",
    plant: "삼랑진공장",
    title: "삼랑진공장 특근보고서",
    workDate: "2026-08-29",
    workDateFormatted: "2026년 8월 29일 토요일",
    author: "양인나",
    authorTitle: "선임",
    approval: [
      { role: "담당", name: "양인나", status: "완료" },
      { role: "책임", name: "윤경수", status: "완료" },
      { role: "이사", name: "이명재", status: "완료" },
      { role: "대표", name: "권태형", status: "완료" }
    ],
    items: [
      { id: 1, category: "관리자", workContent: "출하 및 공정관리", names: "유동길", hours: 8, count: 1 },
      { id: 2, category: "JA", workContent: "조인트", names: "로빈, 찬턴, 크리스토퍼", hours: 8, count: 3 },
      { id: 3, category: "JA", workContent: "후가공", names: "채수연, 피아, 데이시, 짱", hours: 8, count: 4 },
      { id: 4, category: "JA", workContent: "검사", names: "김선옥", hours: 8, count: 1 },
      { id: 5, category: "JA, HR", workContent: "소재준비", names: "이스라엘", hours: 8, count: 1 },
      { id: 6, category: "NX4", workContent: "소재준비", names: "손선희, 이영숙, 수베트, 치찬, 콩지", hours: 8, count: 5 },
      { id: 7, category: "NX4", workContent: "조인트", names: "버나드, 돈돈, 알라딘", hours: 8, count: 3 },
      { id: 8, category: "NX4a", workContent: "조인트", names: "롤란도", hours: 8, count: 1 },
      { id: 9, category: "NX4a", workContent: "후가공, 검사", names: "김순미, 양인순", hours: 8, count: 2 },
      { id: 10, category: "압출", workContent: "압출", names: "이상은", hours: 12, count: 1 },
      { id: 11, category: "압출", workContent: "TPE 압출", names: "지미", hours: 12, count: 1 },
      { id: 12, category: "압출", workContent: "PCM#3 압출", names: "이수루", hours: 12, count: 1 },
      { id: 13, category: "압출", workContent: "PCM#1 압출", names: "샤면", hours: 12, count: 1 },
      { id: 14, category: "코팅", workContent: "코팅", names: "코팅준", hours: 8, count: 1 },
      { id: 15, category: "공통", workContent: "코팅", names: "이성기, 조마루", hours: 8, count: 2 },
      { id: 16, category: "CE1, DT HOOD", workContent: "소재준비", names: "쏘달", hours: 8, count: 1 },
      { id: 17, category: "DT HOOD", workContent: "조인트", names: "롬나차이, 마리오, 제랄드, 포티퐁", hours: 8, count: 4 }
    ],
    reasons: [
      "1. PCM 1호 : DT SILL SEAL / PCM 3호 : DT 호리젠탈 / TPE : JA 압출 가동",
      "2. DT HOOD 코팅 긴급 납품 수량 대응",
      "3. NX4a 단산까지 수출 창고 입고 요청 대응"
    ]
  },
  {
    id: "report_hanlim_20260829",
    plant: "한림공장",
    title: "한림공장 특근보고서",
    workDate: "2026-08-29",
    workDateFormatted: "2026년 8월 29일 토요일",
    author: "우창용",
    authorTitle: "선임",
    approval: [
      { role: "담당", name: "우창용", status: "완료" },
      { role: "책임", name: "김동욱", status: "완료" },
      { role: "이사", name: "이명재", status: "완료" },
      { role: "대표", name: "권태형", status: "완료" }
    ],
    items: [
      { id: 1, category: "관리자", workContent: "한림공장 총괄 지원", names: "이명재, 김동욱", hours: 8, count: 2 },
      { id: 2, category: "CHANNEL", workContent: "밴딩", names: "정상근", hours: 8, count: 1 },
      { id: 3, category: "CHANNEL", workContent: "가공", names: "링링, 유미", hours: 8, count: 2 },
      { id: 4, category: "CE1", workContent: "후가공", names: "팔라, 린", hours: 8, count: 2 },
      { id: 5, category: "DT HOOD", workContent: "후가공", names: "누리", hours: 8, count: 1 },
      { id: 6, category: "JK1", workContent: "조인트", names: "테란스", hours: 8, count: 1 },
      { id: 7, category: "JK1", workContent: "후가공", names: "넷플림, 그레이스, 제인", hours: 8, count: 3 }
    ],
    reasons: [
      "1. 한림 가공동 CHANNEL 밴딩 및 사출 가공 지원",
      "2. CE1 / DT HOOD 후가공 품질 검사 및 납품 대응",
      "3. JK1 조인트 및 후가공 생산 긴급 납품",
      "4. PU KD 재고 사전 확보"
    ]
  }
];

const STORAGE_KEY = "official_overtime_reports_store_v3_plants";

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

  const [selectedPlant, setSelectedPlant] = useState("삼랑진공장"); // "삼랑진공장" | "한림공장" | "ALL"
  const [selectedReportId, setSelectedReportId] = useState(reports[0]?.id || "report_samrangjin_20260829");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Sync selected report when plant tab changes
  const handleSelectPlant = (plantName) => {
    setSelectedPlant(plantName);
    const matched = reports.find((r) => r.plant === plantName);
    if (matched) {
      setSelectedReportId(matched.id);
    }
  };

  const currentReport = useMemo(() => {
    return reports.find((r) => r.id === selectedReportId) || reports[0];
  }, [reports, selectedReportId]);

  // Combined calculations
  const totalCount = useMemo(() => {
    if (selectedPlant === "ALL") {
      return reports.reduce((sum, r) => sum + (r.items?.reduce((s, it) => s + (Number(it.count) || 0), 0) || 0), 0);
    }
    return currentReport?.items?.reduce((sum, item) => sum + (Number(item.count) || 0), 0) || 0;
  }, [reports, currentReport, selectedPlant]);

  const totalManHours = useMemo(() => {
    if (selectedPlant === "ALL") {
      return reports.reduce((sum, r) => sum + (r.items?.reduce((s, it) => s + ((Number(it.hours) || 0) * (Number(it.count) || 0)), 0) || 0), 0);
    }
    return currentReport?.items?.reduce((sum, item) => sum + ((Number(item.hours) || 0) * (Number(item.count) || 0)), 0) || 0;
  }, [reports, currentReport, selectedPlant]);

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel
  const handleExportExcel = () => {
    const rows = [
      [`${currentReport.plant} 특근보고서`],
      ["근무일자", currentReport.workDateFormatted, "작성자", `${currentReport.author} ${currentReport.authorTitle || ""}`, "총원", `${totalCount}명`, "총 투입공수", `${totalManHours} M/H`],
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
      {/* 1. TOP HEADER & PLANT SWITCHER */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                공장별 특근현황 보고서
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-black">
                삼랑진공장 • 한림공장 분할 관리
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              기준일자: <strong>{currentReport.workDateFormatted}</strong> | 총 특근 투입: <strong className="text-purple-600 font-black">{totalCount}명 ({totalManHours} M/H)</strong>
            </p>
          </div>
        </div>

        {/* Plant Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => handleSelectPlant("삼랑진공장")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                selectedPlant === "삼랑진공장"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span>삼랑진공장 (32명)</span>
            </button>

            <button
              onClick={() => handleSelectPlant("한림공장")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                selectedPlant === "한림공장"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>한림공장 (12명)</span>
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>엑셀 다운로드</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md shadow-purple-500/25 active:scale-95 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>인쇄 / PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. OFFICIAL OVERTIME REPORT DOCUMENT (A4 WIDESCREEN 2-COLUMN SPLIT) */}
      {/* ========================================================================= */}
      <div ref={printRef} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        {/* Document Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b-2 border-slate-900 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-black text-white ${
                currentReport.plant === "한림공장" ? "bg-emerald-600" : "bg-amber-500 text-slate-950"
              }`}>
                {currentReport.plant}
              </span>
              <h2 className="text-2xl font-black tracking-wider text-slate-900 dark:text-white">
                {currentReport.title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-1">
              근무일자: <strong className="text-slate-900 dark:text-white">{currentReport.workDateFormatted}</strong> | 작성자: <strong>{currentReport.author} {currentReport.authorTitle || "선임"}</strong>
            </p>
          </div>

          {/* Official Approval Box (담당 | 책임 | 이사 | 대표) */}
          <div className="flex items-center self-end sm:self-auto border-2 border-slate-900 dark:border-slate-600 rounded-xl overflow-hidden bg-white dark:bg-slate-800 text-center text-xs">
            <div className="w-8 py-4 bg-slate-100 dark:bg-slate-700/80 font-black border-r border-slate-900 dark:border-slate-600 flex items-center justify-center writing-vertical text-[11px]">
              결재
            </div>
            {currentReport.approval.map((ap, idx) => (
              <div key={ap.role} className={`w-16 ${idx < 3 ? "border-r border-slate-900 dark:border-slate-600" : ""}`}>
                <div className="py-1 bg-slate-50 dark:bg-slate-700 border-b border-slate-900 dark:border-slate-600 font-bold text-[11px] text-slate-600 dark:text-slate-300">
                  {ap.role}
                </div>
                <div className="h-12 flex flex-col items-center justify-center p-1">
                  <span className="font-black text-xs text-slate-900 dark:text-white">{ap.name}</span>
                  <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-0.5">
                    <CheckCheck className="w-2.5 h-2.5" />
                    <span>완료</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2-Column Split: Left (Worker Table) | Right (Reasons & Summary) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Table (8 Cols) */}
          <div className="xl:col-span-8 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse table-fixed min-w-[650px] border border-slate-200 dark:border-slate-700">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black border-b-2 border-slate-300 dark:border-slate-600">
                  <th className="py-2.5 px-3 w-[16%] border-r border-slate-200 dark:border-slate-700 text-center">구분</th>
                  <th className="py-2.5 px-3 w-[22%] border-r border-slate-200 dark:border-slate-700">작업 내용</th>
                  <th className="py-2.5 px-3 w-[42%] border-r border-slate-200 dark:border-slate-700">작업자 명단</th>
                  <th className="py-2.5 px-2 w-[10%] text-center border-r border-slate-200 dark:border-slate-700">시간</th>
                  <th className="py-2.5 px-2 w-[10%] text-center">인원</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentReport.items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors h-10">
                    <td className="py-2 px-3 font-black text-slate-900 dark:text-white text-center border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      {it.category}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 truncate">
                      {it.workContent}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 truncate" title={it.names}>
                      {it.names}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      {it.hours}h
                    </td>
                    <td className="py-2 px-2 text-center font-black text-purple-600 dark:text-purple-400 whitespace-nowrap">
                      {it.count}명
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs border-t-2 border-slate-900 dark:border-slate-600">
                  <td colSpan={3} className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700">
                    {currentReport.plant} 특근 총 합계
                  </td>
                  <td className="py-3 px-2 text-center border-r border-slate-200 dark:border-slate-700">
                    {totalManHours} M/H
                  </td>
                  <td className="py-3 px-2 text-center text-purple-600 dark:text-purple-400 text-sm">
                    {totalCount}명
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Right Summary & Reasons (4 Cols) */}
          <div className="xl:col-span-4 space-y-4">
            {/* Quick Metrics */}
            <div className="p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-3">
              <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                {currentReport.plant} 특근 투입 요약
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-black text-purple-700 dark:text-purple-300">
                    {totalCount}
                  </span>
                  <span className="text-sm font-bold text-purple-900 dark:text-purple-200 ml-1">명</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {totalManHours}
                  </span>
                  <span className="text-xs text-slate-500 font-bold ml-1">총 공수(M/H)</span>
                </div>
              </div>
            </div>

            {/* Reasons Box */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <h3 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-700">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>※ 특근 실시 사유</span>
              </h3>
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {currentReport.reasons.map((r, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 leading-relaxed font-medium">
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
