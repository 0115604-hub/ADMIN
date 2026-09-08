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
  ChevronDown,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  BarChart3,
  CalendarDays,
  UserCheck,
  UserPlus,
  UserMinus,
  ShieldCheck,
  AlertCircle,
  X,
  FileSpreadsheet,
  ArrowRight,
  Sun,
  Moon,
  Zap,
  CheckSquare
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";
import {
  COMPANIES,
  DEPARTMENTS,
  COMPANY_THEMES,
  ATTENDANCE_OPTIONS,
  getOptionMeta,
  calculateWorkerDailyHours,
  calculateWorkerMonthlyTotals,
  calculateDailySummary,
  calculateCompanySummary,
  calculateDeptSummary,
  getLocalSmartOvertimeData,
  saveSmartOvertimeData,
  subscribeSmartOvertimeData,
  exportSmartOvertimeToExcel,
  normalizeDept,
  ensureAllCompaniesPresent
} from "../services/overtimeSmartService.js";
import {
  getLocalOvertimeReports,
  saveOvertimeReport,
  deleteOvertimeReport,
  subscribeOvertimeReports,
  formatKoreanWorkDate,
  formatShortWorkDate,
  calculateReportMetrics
} from "../services/overtimeService";
import { getKSTDateString } from "../utils/dateUtils";

export const OvertimeStatusView = () => {
  const { currentProfile, isAdmin } = useAuth();

  // Smart Overtime Ledger State (5개사 통합 잔업 스마트 대장)
  const [smartData, setSmartData] = useState(() => getLocalSmartOvertimeData());
  const [activeTab, setActiveTab] = useState("daily_input"); // 'daily_input' default for fastest attendance entry!
  
  // Daily views state
  const [selectedDay, setSelectedDay] = useState(8); // Default 9월 8일
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("전체");
  const [searchWorkerQuery, setSearchWorkerQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("전체"); // '전체', '관리부', '가공동', '압출동'
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // ⭐ Company Today Status Popup State (업체이름 패널 클릭 시 열리는 오늘자 현황 초간결 팝업)
  const [selectedCompanyPopup, setSelectedCompanyPopup] = useState(null); // e.g. "(주)오륙"
  const [popupShowAddWorker, setPopupShowAddWorker] = useState(false);
  const [quickNewWorkerName, setQuickNewWorkerName] = useState("");
  const [quickNewWorkerDept, setQuickNewWorkerDept] = useState("가공동");
  const [quickNewWorkerLine, setQuickNewWorkerLine] = useState("");
  const [quickNewWorkerPos, setQuickNewWorkerPos] = useState("작업원");

  // Legacy overtime reports state (기존 특근보고서 보관함)
  const [legacyReports, setLegacyReports] = useState(() => getLocalOvertimeReports());
  const [selectedLegacyReport, setSelectedLegacyReport] = useState(null);
  const [isLegacyModalOpen, setIsLegacyModalOpen] = useState(false);

  // Show Toast notification
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2800);
  };

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    const unsubSmart = subscribeSmartOvertimeData((newData) => {
      if (newData && newData.attendanceMatrix) {
        setSmartData(newData);
      }
    });

    const unsubLegacy = subscribeOvertimeReports((reports) => {
      setLegacyReports(reports);
      if (reports.length > 0 && !selectedLegacyReport) {
        setSelectedLegacyReport(reports[0]);
      }
    });

    return () => {
      unsubSmart();
      unsubLegacy();
    };
  }, []);

  // Sync state to local/cloud
  const handleSaveLedger = async (updatedData) => {
    setIsSaving(true);
    setSmartData(updatedData);
    await saveSmartOvertimeData(updatedData);
    setIsSaving(false);
  };

  // 1-Click Update Worker Attendance for Selected Day
  const handleUpdateWorkerDayAttendance = async (workerIndexInMaster, newCode) => {
    const updatedMatrix = [...smartData.attendanceMatrix];
    if (!updatedMatrix[workerIndexInMaster]) return;

    const worker = updatedMatrix[workerIndexInMaster];
    const prevDaily = worker.daily || {};
    const updatedDaily = { ...prevDaily, [selectedDay]: newCode };

    updatedMatrix[workerIndexInMaster] = {
      ...worker,
      daily: updatedDaily
    };

    const newLedger = {
      ...smartData,
      attendanceMatrix: updatedMatrix
    };

    await handleSaveLedger(newLedger);
    const meta = getOptionMeta(newCode);
    triggerToast(`✅ [${worker.company}] ${worker.name} 9월 ${selectedDay}일: ${meta.label} 등록 완료`);
  };

  // Batch update attendance for all currently filtered workers
  const handleBatchUpdateFiltered = async (newCode) => {
    const meta = getOptionMeta(newCode);
    if (!window.confirm(`현재 조회된 ${filteredAttendanceWorkers.length}명의 9월 ${selectedDay}일 근태를 [${meta.label}] (으)로 일괄 변경하시겠습니까?`)) {
      return;
    }

    const targetNames = new Set(filteredAttendanceWorkers.map(w => `${w.company}__${w.name}`));
    const updatedMatrix = smartData.attendanceMatrix.map((w) => {
      const key = `${w.company}__${w.name}`;
      if (targetNames.has(key)) {
        return {
          ...w,
          daily: {
            ...(w.daily || {}),
            [selectedDay]: newCode
          }
        };
      }
      return w;
    });

    const newLedger = {
      ...smartData,
      attendanceMatrix: updatedMatrix
    };

    await handleSaveLedger(newLedger);
    triggerToast(`⚡ ${filteredAttendanceWorkers.length}명 9월 ${selectedDay}일 근태 '${meta.label}' 일괄 적용 완료!`);
  };

  // Quick Add Worker for a specific Company (from Company Popup)
  const handleQuickAddCompanyWorker = async (e) => {
    e.preventDefault();
    if (!quickNewWorkerName.trim()) {
      alert("근로자 성명을 입력해주세요.");
      return;
    }
    const company = selectedCompanyPopup || "(주)오륙";
    const dept = normalizeDept(quickNewWorkerDept || "가공동");
    const line = quickNewWorkerLine.trim() || dept;
    const name = quickNewWorkerName.trim();
    const position = quickNewWorkerPos || "작업원";

    // Create empty daily attendance
    const emptyDaily = {};
    for (let d = 1; d <= 30; d++) {
      emptyDaily[d] = (d === 6 || d === 13 || d === 20 || d === 27) ? "-" : "🟢";
    }

    const nextNo = (smartData.masterWorkers?.length || 0) + 1;
    const newWorkerObj = {
      no: nextNo,
      company,
      dept,
      line,
      name,
      position,
      employmentType: "정규직",
      status: "재직",
      note: ""
    };

    const newMatrixRow = {
      no: nextNo,
      company,
      dept,
      line,
      name,
      position,
      daily: emptyDaily
    };

    const updatedData = {
      ...smartData,
      masterWorkers: [...(smartData.masterWorkers || []), newWorkerObj],
      attendanceMatrix: [...(smartData.attendanceMatrix || []), newMatrixRow]
    };

    await handleSaveLedger(updatedData);
    setQuickNewWorkerName("");
    setQuickNewWorkerLine("");
    setPopupShowAddWorker(false);
    triggerToast(`🎉 [${company}] ${name} 신규 근로자 등록 완료 (${dept})`);
  };

  // Quick Delete Worker (from Company Popup)
  const handleQuickDeleteWorker = async (workerIndexInMatrix, workerName, companyName) => {
    if (!window.confirm(`정말로 [${companyName}] ${workerName} 근로자를 삭제하시겠습니까?\n(해당 작업자의 모든 9월 근태 내역이 삭제됩니다)`)) {
      return;
    }

    const updatedMatrix = smartData.attendanceMatrix.filter((_, idx) => idx !== workerIndexInMatrix);
    const updatedMaster = (smartData.masterWorkers || []).filter((w) => !(w.company === companyName && w.name === workerName));

    const reindexedMatrix = updatedMatrix.map((w, idx) => ({ ...w, no: idx + 1 }));
    const reindexedMaster = updatedMaster.map((w, idx) => ({ ...w, no: idx + 1 }));

    const updatedData = {
      ...smartData,
      masterWorkers: reindexedMaster,
      attendanceMatrix: reindexedMatrix
    };

    await handleSaveLedger(updatedData);
    triggerToast(`🗑️ [${companyName}] ${workerName} 근로자 삭제 완료`);
  };

  // Excel Export Handler
  const handleExportExcel = () => {
    try {
      const filename = exportSmartOvertimeToExcel(smartData);
      triggerToast(`📥 엑셀 다운로드 완료 (${filename})`);
    } catch (err) {
      alert("엑셀 내보내기 중 오류가 발생했습니다: " + err.message);
    }
  };

  // Calculations & Summaries for 5 Companies
  const dailySummary = useMemo(() => {
    return calculateDailySummary(smartData.attendanceMatrix || [], selectedDay);
  }, [smartData.attendanceMatrix, selectedDay]);

  const companySummary = useMemo(() => {
    return calculateCompanySummary(smartData.attendanceMatrix || []);
  }, [smartData.attendanceMatrix]);

  const deptSummary = useMemo(() => {
    return calculateDeptSummary(smartData.attendanceMatrix || [], selectedDay);
  }, [smartData.attendanceMatrix, selectedDay]);

  // Filtered attendance rows for Daily Input and Summary tabs
  const filteredAttendanceWorkers = useMemo(() => {
    let list = (smartData.attendanceMatrix || []).map((w, originalIdx) => ({
      ...w,
      dept: normalizeDept(w.dept),
      originalMatrixIndex: originalIdx
    }));

    if (selectedCompanyFilter !== "전체") {
      list = list.filter((w) => w.company === selectedCompanyFilter);
    }
    if (selectedDeptFilter !== "전체") {
      list = list.filter((w) => w.dept === selectedDeptFilter);
    }
    if (searchWorkerQuery.trim()) {
      const q = searchWorkerQuery.trim().toLowerCase();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.company.toLowerCase().includes(q) ||
          w.dept.toLowerCase().includes(q) ||
          (w.line && w.line.toLowerCase().includes(q))
      );
    }
    return list;
  }, [smartData.attendanceMatrix, selectedCompanyFilter, selectedDeptFilter, searchWorkerQuery]);

  // Data for Company Popup Modal (간결화)
  const popupCompanyData = useMemo(() => {
    if (!selectedCompanyPopup) return null;
    const company = selectedCompanyPopup;
    const breakdown = dailySummary.companyBreakdown?.[company] || {
      total: 0,
      attended: 0,
      regular: 0,
      ot19: 0,
      ot21: 0,
      ot22: 0,
      specialNight: 0,
      otHours: 0,
      totalHours: 0
    };

    const workers = (smartData.attendanceMatrix || [])
      .map((w, originalMatrixIndex) => ({
        ...w,
        dept: normalizeDept(w.dept),
        originalMatrixIndex
      }))
      .filter((w) => w.company === company);

    return {
      company,
      breakdown,
      workers
    };
  }, [selectedCompanyPopup, dailySummary, smartData.attendanceMatrix, selectedDay]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 min-w-0 max-w-full">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl border-2 border-cyan-400 flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" />
          <span className="text-sm font-black tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-700 shadow-xl text-white space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>근태현황 및 관리</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-400/40">
                  5개사 잔업 스마트 대장
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              (주)오륙 • (주)조영산업 • 한울 • 부림텍 • <strong className="text-cyan-300 font-black">유성</strong> 5개사 | 부서: <strong className="text-white font-bold">관리부 • 가공동 • 압출동</strong>
            </p>
          </div>

          {/* Clean Quick Action Button (Excel Export Only) */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-900/30 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Excel 6개시트 다운로드</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ⭐ TOP 5 COMPANY SUMMARY CARDS (오륙, 조영산업, 한울, 부림텍, 유성) */}
        {/* 클릭 시 오늘자 현황 팝업 모달이 즉시 열립니다 */}
        {/* ========================================================================= */}
        <div className="pt-2">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>5개 협력사별 실시간 근태 현황 (9월 {selectedDay}일 기준) • 패널 클릭 시 상세 팝업</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              전체 총원: <strong className="text-white font-mono">{smartData.attendanceMatrix?.length || 0}명</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {COMPANIES.map((compName) => {
              const theme = COMPANY_THEMES[compName] || COMPANY_THEMES["(주)오륙"];
              const breakdown = dailySummary.companyBreakdown?.[compName] || {
                total: 0,
                attended: 0,
                regular: 0,
                ot19: 0,
                ot21: 0,
                ot22: 0,
                specialNight: 0,
                otHours: 0,
                totalHours: 0
              };
              const dotColor = compName === "(주)오륙" ? "bg-blue-400" :
                compName === "(주)조영산업" ? "bg-purple-400" :
                compName === "한울" ? "bg-emerald-400" :
                compName === "부림텍" ? "bg-amber-400" : "bg-cyan-400";

              return (
                <div
                  key={compName}
                  onClick={() => {
                    setSelectedCompanyPopup(compName);
                    setPopupShowAddWorker(false);
                    setQuickNewWorkerDept("가공동");
                  }}
                  className="bg-slate-950/90 hover:bg-slate-900 rounded-2xl p-3 border-2 border-slate-700/80 hover:border-cyan-400 transition-all duration-200 space-y-2 shadow-lg flex flex-col justify-between cursor-pointer group active:scale-98"
                  title="클릭 시 오늘자 근태/인원 현황 팝업 보기"
                >
                  {/* Top: Company Name + Attendance Rate */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5 group-hover:text-cyan-300 transition-colors">
                      <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`}></span>
                      {compName}
                    </span>
                    <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 border border-slate-700 shrink-0">
                      {breakdown.attended}/{breakdown.total}명
                    </span>
                  </div>

                  {/* 2 Big Bold KPI Boxes */}
                  <div className="grid grid-cols-2 gap-1.5 text-center">
                    <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800/90">
                      <div className="text-[10px] font-bold text-slate-400">당일 잔업</div>
                      <div className="font-mono font-black text-base sm:text-lg text-amber-400 leading-tight mt-0.5">
                        +{breakdown.otHours}<span className="text-[10px] font-bold text-amber-500/80 ml-0.5">H</span>
                      </div>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800/90">
                      <div className="text-[10px] font-bold text-slate-400">투입 공수</div>
                      <div className="font-mono font-black text-base sm:text-lg text-cyan-300 leading-tight mt-0.5">
                        {breakdown.totalHours}<span className="text-[10px] font-bold text-cyan-500/80 ml-0.5">H</span>
                      </div>
                    </div>
                  </div>

                  {/* Trigger Hint Button */}
                  <div className="w-full flex items-center justify-center gap-1 py-1 px-2 rounded-xl bg-slate-800/80 group-hover:bg-cyan-950 text-slate-300 group-hover:text-cyan-300 border border-slate-700/80 group-hover:border-cyan-500 font-bold text-[11px] transition-all">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>오늘자 현황 팝업</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🧭 MAIN TAB NAVIGATION (Clean 5 Tabs) */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b-2 border-slate-200 dark:border-slate-800">
        {[
          { id: "daily_input", label: "📝 오늘자 근태/잔업 즉시 작성", icon: Zap, badge: "원클릭 등록", highlight: true },
          { id: "daily_summary", label: "📋 일자별 종합 집계", icon: FileSpreadsheet },
          { id: "monthly_matrix", label: "📊 9월 전사 종합현황판", icon: CalendarDays },
          { id: "company_settle", label: "🏢 업체별 결산 요약", icon: Building2 },
          { id: "legacy_reports", label: "📑 이전 특근보고서 보관함", icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? tab.highlight
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 scale-102 ring-2 ring-cyan-400"
                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? (tab.highlight ? "text-white" : "text-cyan-400") : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 📝 TAB 1: 오늘자 근태/잔업 즉시 작성 (PRIMARY WORKSPACE) */}
      {/* ========================================================================= */}
      {activeTab === "daily_input" && (
        <div className="space-y-4">
          {/* Top Control Filter & Date Selector Bar (HIGH-CONTRAST DARK DROPDOWNS) */}
          <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 border-slate-700 shadow-xl text-white space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Date Selector */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  <span className="font-black text-sm text-white">작성 대상 일자:</span>
                </div>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="bg-slate-950 text-white font-black text-sm sm:text-base border-2 border-cyan-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/40 rounded-xl px-4 py-2 cursor-pointer shadow-inner"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d} className="bg-slate-900 text-white font-bold py-1">
                      2026년 9월 {d}일 ({(d === 6 || d === 13 || d === 20 || d === 27) ? "일요일" : (d === 5 || d === 12 || d === 19 || d === 26) ? "토요일" : "평일"})
                    </option>
                  ))}
                </select>
                <span className="text-xs text-cyan-300 font-bold px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30">
                  9월 {selectedDay}일 실시간 근태 입력 중
                </span>
              </div>

              {/* Company Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-400 mr-1">업체 필터:</span>
                {["전체", ...COMPANIES].map((comp) => (
                  <button
                    key={comp}
                    onClick={() => setSelectedCompanyFilter(comp)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedCompanyFilter === comp
                        ? "bg-cyan-500 text-slate-950 shadow-md font-black ring-2 ring-cyan-300"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>

            {/* ⭐ STRICT 3 DEPARTMENTS FILTER (관리부, 가공동, 압출동) & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-300 whitespace-nowrap">부서 선택:</span>
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="bg-slate-950 text-white font-black text-xs sm:text-sm border-2 border-cyan-400 focus:border-cyan-300 rounded-xl px-3.5 py-2 cursor-pointer w-full sm:w-56 shadow-sm"
                >
                  <option value="전체" className="bg-slate-900 text-white font-bold">전체 부서 (전체보기)</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d} className="bg-slate-900 text-white font-bold">{d}</option>
                  ))}
                </select>

                {/* Quick Department Buttons for Extra Speed */}
                <div className="hidden md:flex items-center gap-1 ml-2">
                  {["전체", ...DEPARTMENTS].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDeptFilter(d)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        selectedDeptFilter === d
                          ? "bg-cyan-400 text-slate-950 font-black shadow-xs ring-1 ring-cyan-200"
                          : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-[11px]"
                      }`}
                    >
                      {d === "전체" ? "전체" : d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="작업자 성명 / 차종 / 라인 검색..."
                  value={searchWorkerQuery}
                  onChange={(e) => setSearchWorkerQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-950 text-white placeholder-slate-500 text-xs sm:text-sm border-2 border-slate-600 focus:border-cyan-400 focus:outline-none"
                />
                {searchWorkerQuery && (
                  <button
                    onClick={() => setSearchWorkerQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* ⚡ Fast Batch Update Toolbar (초고속 일괄 근태 적용 바) */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>현재 조회된 작업자 ({filteredAttendanceWorkers.length}명) 9월 {selectedDay}일 일괄 근태 적용:</span>
                </span>
                <span className="text-[11px] font-bold text-slate-400">클릭 시 즉시 전원 적용됩니다</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handleBatchUpdateFiltered("🟢")}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>🟢 전체 정시 (8H)</span>
                </button>
                <button
                  onClick={() => handleBatchUpdateFiltered("19")}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>🟡 전체 19시 (+2H)</span>
                </button>
                <button
                  onClick={() => handleBatchUpdateFiltered("21")}
                  className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>🟠 전체 21시 (+4H)</span>
                </button>
                <button
                  onClick={() => handleBatchUpdateFiltered("22")}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>🔴 전체 22시 (+5H)</span>
                </button>
                <button
                  onClick={() => handleBatchUpdateFiltered("특근")}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>🌙 전체 특근 (8H)</span>
                </button>
                <button
                  onClick={() => handleBatchUpdateFiltered("야간")}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>🌌 전체 야간</span>
                </button>
                <button
                  onClick={() => handleBatchUpdateFiltered("연차")}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>🌴 전체 연차</span>
                </button>
                <button
                  onClick={() => handleBatchUpdateFiltered("-")}
                  className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>- 전체 휴무</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time KPI Bar for the Selected Day */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">당일 출근 총원</span>
                <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {dailySummary.totalAttended} <span className="text-xs font-bold text-slate-400">/ {smartData.attendanceMatrix?.length}명</span>
                </div>
              </div>
              <UserCheck className="w-8 h-8 text-emerald-500/30" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">정시 근무 인원</span>
                <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {dailySummary.regularCount} <span className="text-xs font-bold text-slate-400">명</span>
                </div>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">당일 잔업 총시간</span>
                <div className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  +{dailySummary.dayOtHours} <span className="text-xs font-bold text-slate-400">H</span>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-500/30" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">당일 총 투입공수</span>
                <div className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {dailySummary.dayTotalHours} <span className="text-xs font-bold text-slate-400">M/H</span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-indigo-500/30" />
            </div>
          </div>

          {/* Interactive Worker Attendance Table (1-CLICK SPEED EDITOR) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-500" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  작업자별 9월 {selectedDay}일 근태 원클릭 작성 테이블
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  (조회 {filteredAttendanceWorkers.length}명)
                </span>
              </div>
              <span className="text-xs font-bold text-slate-500">
                버튼 클릭 시 실시간으로 즉시 저장 및 전산에 반영됩니다.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                    <th className="p-3 text-center w-12">No.</th>
                    <th className="p-3 w-28">소속 업체</th>
                    <th className="p-3 w-28">소속 부서</th>
                    <th className="p-3 w-28">차종/라인</th>
                    <th className="p-3 w-28">작업자 성명</th>
                    <th className="p-3 min-w-[340px]">⭐ 9월 {selectedDay}일 근태 원클릭 선택 (초고속 입력)</th>
                    <th className="p-3 text-center w-24">잔업시간(H)</th>
                    <th className="p-3 text-center w-24">총근무(H)</th>
                    <th className="p-3 text-center w-20">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredAttendanceWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                        검색 조건과 일치하는 작업자가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendanceWorkers.map((worker) => {
                      const currentVal = worker.daily ? worker.daily[selectedDay] : "";
                      const meta = getOptionMeta(currentVal);
                      const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(currentVal);
                      const ot = weekdayOt + weekendOt;
                      const companyTheme = COMPANY_THEMES[worker.company] || COMPANY_THEMES["(주)오륙"];

                      return (
                        <tr
                          key={`${worker.company}__${worker.name}__${worker.originalMatrixIndex}`}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="p-3 text-center font-mono text-slate-400 font-bold">
                            {worker.no}
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black border ${companyTheme.badge}`}>
                              {worker.company}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              {worker.dept}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 font-medium">
                            {worker.line || "-"}
                          </td>
                          <td className="p-3 font-black text-sm text-slate-900 dark:text-white">
                            {worker.name}
                            {worker.position && (
                              <span className="ml-1 text-[10px] text-slate-400 font-normal">
                                ({worker.position})
                              </span>
                            )}
                          </td>

                          {/* 1-Click Fast Attendance Button Group */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* 🟢 정시 (8H) */}
                              <button
                                onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "🟢")}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                                  currentVal === "🟢" || currentVal === "정시" || currentVal === "17"
                                    ? "bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-md scale-105"
                                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800"
                                }`}
                              >
                                🟢 정시(8H)
                              </button>

                              {/* 🟡 19시 (+2H) */}
                              <button
                                onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "19")}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                                  currentVal === "19" || currentVal === "19시"
                                    ? "bg-amber-600 text-white ring-2 ring-amber-400 shadow-md scale-105"
                                    : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800"
                                }`}
                              >
                                🟡 19시(+2H)
                              </button>

                              {/* 🟠 21시 (+4H) */}
                              <button
                                onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "21")}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                                  currentVal === "21" || currentVal === "21시"
                                    ? "bg-orange-600 text-white ring-2 ring-orange-400 shadow-md scale-105"
                                    : "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 hover:bg-orange-100 border border-orange-200 dark:border-orange-800"
                                }`}
                              >
                                🟠 21시(+4H)
                              </button>

                              {/* 🔴 22시 (+5H) */}
                              <button
                                onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "22")}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                                  currentVal === "22" || currentVal === "22시"
                                    ? "bg-rose-600 text-white ring-2 ring-rose-400 shadow-md scale-105"
                                    : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800"
                                }`}
                              >
                                🔴 22시(+5H)
                              </button>

                              {/* 🌙 특근 */}
                              <button
                                onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "특근")}
                                className={`px-2 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                                  currentVal === "특근" || currentVal === "주말특근"
                                    ? "bg-purple-600 text-white ring-2 ring-purple-400 shadow-md scale-105"
                                    : "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800"
                                }`}
                              >
                                🌙 특근
                              </button>

                              {/* Other Options Dropdown (HIGH CONTRAST DARK SELECT) */}
                              <select
                                value={currentVal || ""}
                                onChange={(e) => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, e.target.value)}
                                className="bg-slate-950 text-white font-black text-xs border-2 border-slate-600 focus:border-cyan-400 rounded-lg px-2 py-1 cursor-pointer"
                              >
                                <option value="" className="bg-slate-900 text-white font-bold">선택 (전체옵션)</option>
                                {ATTENDANCE_OPTIONS.map((opt) => (
                                  <option key={opt.code} value={opt.code} className="bg-slate-900 text-white font-bold">
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* 잔업시간(H) */}
                          <td className="p-3 text-center">
                            <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-md ${
                              ot > 0
                                ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold"
                                : "text-slate-400"
                            }`}>
                              {ot > 0 ? `+${ot}H` : "0H"}
                            </span>
                          </td>

                          {/* 총근무(H) */}
                          <td className="p-3 text-center font-mono font-black text-xs text-indigo-600 dark:text-indigo-400">
                            {workHours}H
                          </td>

                          {/* 관리 (근로자 삭제) */}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleQuickDeleteWorker(worker.originalMatrixIndex, worker.name, worker.company)}
                              title="근로자 삭제"
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📋 TAB 2: 일자별 종합 집계 (DAILY SUMMARY TABLE) */}
      {/* ========================================================================= */}
      {activeTab === "daily_summary" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-cyan-600" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  9월 {selectedDay}일 5개사 일일 종합 집계표
                </h3>
              </div>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="bg-slate-950 text-white font-black text-xs sm:text-sm border-2 border-slate-600 rounded-xl px-3 py-1.5 cursor-pointer"
              >
                {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white font-bold">
                    9월 {d}일 ({d % 7 === 6 || d % 7 === 0 ? "주말" : "평일"})
                  </option>
                ))}
              </select>
            </div>

            {/* 5 Companies Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black">
                    <th className="p-3">구분 (소속업체)</th>
                    <th className="p-3 text-center">총 배속인원</th>
                    <th className="p-3 text-center">당일 출근인원</th>
                    <th className="p-3 text-center">🟢 정시(8H)</th>
                    <th className="p-3 text-center">🟡 19시(+2H)</th>
                    <th className="p-3 text-center">🟠 21시(+4H)</th>
                    <th className="p-3 text-center">🔴 22시(+5H)</th>
                    <th className="p-3 text-center">🌙 특근/야간</th>
                    <th className="p-3 text-center">당일 잔업합계(H)</th>
                    <th className="p-3 text-center">당일 총투입공수(H)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {COMPANIES.map((comp) => {
                    const row = dailySummary.companyBreakdown?.[comp] || {};
                    return (
                      <tr key={comp} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-cyan-500" />
                          <span>{comp}</span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-600 dark:text-slate-300">{row.total || 0}명</td>
                        <td className="p-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{row.attended || 0}명</td>
                        <td className="p-3 text-center font-mono">{row.regular || 0}명</td>
                        <td className="p-3 text-center font-mono text-amber-600">{row.ot19 || 0}명</td>
                        <td className="p-3 text-center font-mono text-orange-600">{row.ot21 || 0}명</td>
                        <td className="p-3 text-center font-mono text-rose-600">{row.ot22 || 0}명</td>
                        <td className="p-3 text-center font-mono text-purple-600">{row.specialNight || 0}명</td>
                        <td className="p-3 text-center font-mono font-black text-amber-600 dark:text-amber-400">+{row.otHours || 0} H</td>
                        <td className="p-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400">{row.totalHours || 0} H</td>
                      </tr>
                    );
                  })}
                  {/* Total Row */}
                  <tr className="bg-slate-900 text-white font-black">
                    <td className="p-3 text-cyan-400 font-bold">5개사 합계</td>
                    <td className="p-3 text-center font-mono">{smartData.attendanceMatrix?.length || 0}명</td>
                    <td className="p-3 text-center font-mono text-emerald-400">{dailySummary.totalAttended}명</td>
                    <td className="p-3 text-center font-mono">{dailySummary.regularCount}명</td>
                    <td className="p-3 text-center font-mono text-amber-300">{dailySummary.ot19Count}명</td>
                    <td className="p-3 text-center font-mono text-orange-300">{dailySummary.ot21Count}명</td>
                    <td className="p-3 text-center font-mono text-rose-300">{dailySummary.ot22Count}명</td>
                    <td className="p-3 text-center font-mono text-purple-300">{dailySummary.specialNightCount}명</td>
                    <td className="p-3 text-center font-mono text-amber-300">+{dailySummary.dayOtHours} H</td>
                    <td className="p-3 text-center font-mono text-cyan-300">{dailySummary.dayTotalHours} M/H</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 TAB 3: 9월 전사 종합현황판 (MONTHLY MATRIX 1~30) */}
      {/* ========================================================================= */}
      {activeTab === "monthly_matrix" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-3 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                2026년 9월 5개사 전 작업자 30일 근태 및 잔업 전체 매트릭스
              </h3>
            </div>
            <div className="text-xs text-slate-500 font-bold">
              총 {smartData.attendanceMatrix?.length || 0}명 인원 배속 중
            </div>
          </div>

          <div className="overflow-x-auto max-h-[650px]">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="sticky top-0 bg-slate-900 text-white z-20">
                <tr>
                  <th className="p-2 text-center w-10 sticky left-0 bg-slate-900 z-30">No.</th>
                  <th className="p-2 w-20 sticky left-10 bg-slate-900 z-30">업체</th>
                  <th className="p-2 w-20">부서</th>
                  <th className="p-2 w-20 sticky left-28 bg-slate-900 z-30">성명</th>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                    <th key={d} className={`p-1 text-center w-7 ${(d === 6 || d === 13 || d === 20 || d === 27) ? "bg-rose-950/80 text-rose-300" : (d === 5 || d === 12 || d === 19 || d === 26) ? "bg-blue-950/80 text-blue-300" : ""}`}>
                      {d}
                    </th>
                  ))}
                  <th className="p-2 text-center w-14 bg-slate-800">출근일</th>
                  <th className="p-2 text-center w-14 bg-slate-800 text-amber-300">평일잔업</th>
                  <th className="p-2 text-center w-14 bg-slate-800 text-purple-300">특근(H)</th>
                  <th className="p-2 text-center w-14 bg-slate-800 text-cyan-300">총공수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(smartData.attendanceMatrix || []).map((w, idx) => {
                  const totals = calculateWorkerMonthlyTotals(w);
                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-1.5 text-center font-mono text-slate-400 sticky left-0 bg-white dark:bg-slate-900 z-10">{idx + 1}</td>
                      <td className="p-1.5 font-bold sticky left-10 bg-white dark:bg-slate-900 z-10 truncate max-w-[80px]">{w.company}</td>
                      <td className="p-1.5 text-slate-500 truncate max-w-[80px]">{normalizeDept(w.dept)}</td>
                      <td className="p-1.5 font-black sticky left-28 bg-white dark:bg-slate-900 z-10">{w.name}</td>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                        const val = w.daily ? w.daily[d] : "";
                        return (
                          <td key={d} className="p-0.5 text-center font-mono text-[10px]">
                            <span className={`inline-block w-6 py-0.5 rounded font-bold ${
                              val === "🟢" || val === "정시" ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" :
                              val === "19" ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300" :
                              val === "21" ? "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300" :
                              val === "22" ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300" :
                              val === "특근" ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300" :
                              val === "야간" ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300" :
                              val === "-" ? "text-slate-300 dark:text-slate-600" : ""
                            }`}>
                              {val || "-"}
                            </span>
                          </td>
                        );
                      })}
                      <td className="p-1.5 text-center font-mono font-bold bg-slate-50 dark:bg-slate-800/40">{totals.workDays}일</td>
                      <td className="p-1.5 text-center font-mono font-bold text-amber-600 bg-slate-50 dark:bg-slate-800/40">{totals.weekdayOtHours}H</td>
                      <td className="p-1.5 text-center font-mono font-bold text-purple-600 bg-slate-50 dark:bg-slate-800/40">{totals.weekendOtHours}H</td>
                      <td className="p-1.5 text-center font-mono font-black text-indigo-600 dark:text-indigo-400 bg-slate-100 dark:bg-slate-800/80">{totals.totalHours}H</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏢 TAB 4: 업체별 결산 요약 (COMPANY SETTLEMENT) */}
      {/* ========================================================================= */}
      {activeTab === "company_settle" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-600" />
              <span>2026년 9월 5개사 업체별 근태 및 잔업 투입공수 통합 결산서</span>
            </h3>
            <span className="text-xs text-slate-500 font-bold">
              누적 실시간 정산
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black">
                  <th className="p-3">소속 업체명</th>
                  <th className="p-3 text-center">관리 인원수</th>
                  <th className="p-3 text-center">누적 출근일수</th>
                  <th className="p-3 text-center">평일잔업 누계(H)</th>
                  <th className="p-3 text-center">주말특근 누계(H)</th>
                  <th className="p-3 text-center">야간근무 누계(일)</th>
                  <th className="p-3 text-center">총 투입공수(M/H)</th>
                  <th className="p-3 text-center">공수 점유율(%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {companySummary.map((item) => (
                  <tr key={item.company} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                      {item.company}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-600 dark:text-slate-300">{item.workerCount}명</td>
                    <td className="p-3 text-center font-mono">{item.totalWorkDays}일</td>
                    <td className="p-3 text-center font-mono font-bold text-amber-600">{item.weekdayOtHours} H</td>
                    <td className="p-3 text-center font-mono font-bold text-purple-600">{item.weekendOtHours} H</td>
                    <td className="p-3 text-center font-mono text-indigo-600">{item.nightDays} 일</td>
                    <td className="p-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">{item.totalHours.toLocaleString()} H</td>
                    <td className="p-3 text-center font-mono font-black text-cyan-600 dark:text-cyan-400">{item.ratio}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📑 TAB 5: 이전 특근보고서 보관함 (LEGACY REPORTS) */}
      {/* ========================================================================= */}
      {activeTab === "legacy_reports" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>이전 일일 특근실시 보고서 목록</span>
            </h3>
            <span className="text-xs text-slate-500 font-bold">
              총 {legacyReports.length}건 보관 중
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {legacyReports.map((rep) => (
              <div
                key={rep.id}
                className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {rep.title || formatKoreanWorkDate(rep.workDate)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {rep.workDate}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  작성자: <strong className="font-bold">{rep.author || "관리자"}</strong> • 총 {rep.items?.length || 0}개 라인
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedLegacyReport(rep);
                      setIsLegacyModalOpen(true);
                    }}
                    className="px-3 py-1 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 cursor-pointer"
                  >
                    상세보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⭐ MODAL: 업체별 오늘자 현황 팝업 (초간결 3열 부서/성명/오늘근태 NO SCROLLING 컴팩트 디자인) */}
      {popupCompanyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl max-w-5xl w-full border-2 border-cyan-400 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* 1. Modal Header & Summary Pills Bar (Ultra-Compact Integrated Header) */}
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0 gap-2">
              <div className="flex items-center gap-3 flex-wrap min-w-0">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                    <span>{popupCompanyData.company}</span>
                    <span className="text-cyan-300 font-normal text-xs sm:text-sm">9월 {selectedDay}일 오늘자 근태 현황</span>
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono font-black flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    총원 {popupCompanyData.breakdown.total}명
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                    출근 {popupCompanyData.breakdown.attended}명
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800">
                    잔업 {popupCompanyData.breakdown.ot19 + popupCompanyData.breakdown.ot21 + popupCompanyData.breakdown.ot22 + popupCompanyData.breakdown.specialNight}명 (+{popupCompanyData.breakdown.otHours}H)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
                    공수 {popupCompanyData.breakdown.totalHours}H
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCompanyPopup(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Main Multi-Column Table (부서 | 성명 | 오늘근태 - 3열 병렬 배치로 스크롤 최소화/제거) */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1 text-xs">
              {popupCompanyData.workers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-bold">
                  등록된 근로자가 없습니다.
                </div>
              ) : (
                (() => {
                  const workers = popupCompanyData.workers;
                  const count = workers.length;
                  const numCols = count > 30 ? 3 : count > 10 ? 2 : 1;
                  const perCol = Math.ceil(count / numCols);

                  const columns = [];
                  for (let i = 0; i < numCols; i++) {
                    columns.push(workers.slice(i * perCol, (i + 1) * perCol));
                  }

                  const renderBadge = (code) => {
                    const str = code ? String(code).trim() : "";
                    if (!str || str === "-") {
                      return <span className="px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-slate-800 text-slate-400">-</span>;
                    }
                    if (str === "🟢" || str === "정시" || str === "17") {
                      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-emerald-600 text-white shadow-2xs">🟢정시</span>;
                    }
                    if (str === "19" || str === "19시") {
                      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-amber-600 text-white shadow-2xs">🟡19시</span>;
                    }
                    if (str === "21" || str === "21시") {
                      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-orange-600 text-white shadow-2xs">🟠21시</span>;
                    }
                    if (str === "22" || str === "22시") {
                      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-rose-600 text-white shadow-2xs">🔴22시</span>;
                    }
                    if (str === "특근" || str === "주말특근") {
                      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-purple-600 text-white shadow-2xs">🌙특근</span>;
                    }
                    if (str === "연차") {
                      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-sky-600 text-white shadow-2xs">🌴연차</span>;
                    }
                    if (str === "반차") {
                      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-blue-600 text-white shadow-2xs">⛅반차</span>;
                    }
                    if (str === "결근") {
                      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-red-600 text-white shadow-2xs">❌결근</span>;
                    }
                    return <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">{str}</span>;
                  };

                  return (
                    <div className={`grid gap-2.5 ${numCols === 3 ? "grid-cols-1 md:grid-cols-3" : numCols === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                      {columns.map((colWorkers, colIdx) => (
                        <div key={colIdx} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70 shadow-xs">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-950 text-slate-400 text-[11px] font-black border-b border-slate-800">
                              <tr>
                                <th className="py-1 px-1.5 text-center w-7 text-slate-500 font-mono">No</th>
                                <th className="py-1 px-1.5 w-14">부서</th>
                                <th className="py-1 px-1.5 w-16">성명</th>
                                <th className="py-1 px-1.5 text-center">오늘근태</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-xs">
                              {colWorkers.map((worker, rowIdx) => {
                                const globalNo = colIdx * perCol + rowIdx + 1;
                                const currentVal = worker.daily ? worker.daily[selectedDay] : "";

                                return (
                                  <tr key={worker.originalMatrixIndex || globalNo} className="hover:bg-slate-800/60 transition-colors">
                                    <td className="py-1 px-1.5 text-center font-mono text-slate-500 text-[10.5px]">
                                      {globalNo}
                                    </td>
                                    <td className="py-1 px-1.5">
                                      <span className="font-bold text-slate-300 text-[11px] whitespace-nowrap">{worker.dept}</span>
                                    </td>
                                    <td className="py-1 px-1.5 font-black text-white text-xs whitespace-nowrap">
                                      {worker.name}
                                    </td>
                                    <td className="py-1 px-1.5 text-center whitespace-nowrap">
                                      {renderBadge(currentVal)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>

            {/* 3. Modal Footer (Compact) */}
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCompanyPopup(null)}
                className="px-4 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs cursor-pointer shadow-md active:scale-95 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📑 MODAL: 이전 특근보고서 상세 모달 */}
      {/* ========================================================================= */}
      {isLegacyModalOpen && selectedLegacyReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span>{selectedLegacyReport.title || formatKoreanWorkDate(selectedLegacyReport.workDate)} 상세 내역</span>
              </h3>
              <button
                onClick={() => setIsLegacyModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-2xl">
                <div>작성자: <strong>{selectedLegacyReport.author}</strong></div>
                <div>일자: <strong>{selectedLegacyReport.workDate}</strong></div>
                <div>총 인원: <strong>{selectedLegacyReport.totalWorkers || selectedLegacyReport.items?.length}명</strong></div>
                <div>총 공수: <strong>{selectedLegacyReport.totalHours}H</strong></div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      <th className="p-2">No.</th>
                      <th className="p-2">공장/업체</th>
                      <th className="p-2">차종/라인</th>
                      <th className="p-2">작업자</th>
                      <th className="p-2">근무시간</th>
                      <th className="p-2">공수(H)</th>
                      <th className="p-2">작업내용</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(selectedLegacyReport.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2 font-bold">{it.factory || it.company || "-"}</td>
                        <td className="p-2">{it.carType || it.line || "-"}</td>
                        <td className="p-2 font-bold">{it.workerName}</td>
                        <td className="p-2">{it.startTime || "08:00"} ~ {it.endTime || "17:00"}</td>
                        <td className="p-2 font-mono font-bold text-purple-600">{it.hours || 8}H</td>
                        <td className="p-2 text-slate-500">{it.workDetails || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsLegacyModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white font-black text-xs cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
