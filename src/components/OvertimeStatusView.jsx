import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Clock,
  Printer,
  Download,
  Upload,
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
  FileSpreadsheet
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";
import {
  COMPANIES,
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
  importSmartOvertimeFromExcel
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

  // Smart Overtime Ledger State (4개사 통합 잔업 스마트 대장)
  const [smartData, setSmartData] = useState(() => getLocalSmartOvertimeData());
  const [activeTab, setActiveTab] = useState("daily_summary"); // 'daily_summary', 'daily_input', 'monthly_matrix', 'company_settle', 'master_workers', 'legacy_reports'
  
  // Daily views state
  const [selectedDay, setSelectedDay] = useState(8); // Default 9월 8일
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("전체");
  const [searchWorkerQuery, setSearchWorkerQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("전체");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Dedicated Company Worker Management Modal (공장별 근로자 추가 및 삭제 관리)
  const [managingCompany, setManagingCompany] = useState(null); // e.g. "(주)오륙"
  const [quickNewWorkerName, setQuickNewWorkerName] = useState("");
  const [quickNewWorkerDept, setQuickNewWorkerDept] = useState("");
  const [quickNewWorkerLine, setQuickNewWorkerLine] = useState("");
  const [quickNewWorkerPos, setQuickNewWorkerPos] = useState("작업원");

  // Master worker add/edit modal
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [workerFormData, setWorkerFormData] = useState({
    company: "(주)오륙",
    dept: "관리부",
    line: "관리부",
    name: "",
    position: "작업원",
    employmentType: "정규직",
    status: "재직",
    note: ""
  });

  // Cell quick edit popover
  const [cellEditTarget, setCellEditTarget] = useState(null); // { workerNo, dayNum, currentVal }

  // Legacy Overtime Report State
  const [legacyReports, setLegacyReports] = useState(() => getLocalOvertimeReports());
  const [selectedLegacyReportId, setSelectedLegacyReportId] = useState(() => {
    const initial = getLocalOvertimeReports();
    return initial[0]?.id || "report_samrangjin_20260829";
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailReport, setDetailReport] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  const fileInputRef = useRef(null);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubSmart = subscribeSmartOvertimeData((data) => {
      if (data && Array.isArray(data.attendanceMatrix)) {
        setSmartData(data);
      }
    });
    const unsubLegacy = subscribeOvertimeReports((reps) => {
      if (reps && Array.isArray(reps)) {
        setLegacyReports(reps);
      }
    });
    return () => {
      unsubSmart();
      unsubLegacy();
    };
  }, []);

  const showNotification = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Day summary calculation
  const daySummary = useMemo(() => {
    return calculateDailySummary(smartData.attendanceMatrix, selectedDay);
  }, [smartData.attendanceMatrix, selectedDay]);

  // Company summary calculation
  const companySummaryList = useMemo(() => {
    return calculateCompanySummary(smartData.attendanceMatrix);
  }, [smartData.attendanceMatrix]);

  // Dept summary calculation
  const deptSummaryList = useMemo(() => {
    return calculateDeptSummary(smartData.attendanceMatrix);
  }, [smartData.attendanceMatrix]);

  // Company-specific real-time stats for the top cards (총원 00명, 잔업 00명)
  const companyStatsMap = useMemo(() => {
    const map = {};
    COMPANIES.forEach((comp) => {
      const compWorkers = (smartData.attendanceMatrix || []).filter((w) => w.company === comp);
      const totalCount = compWorkers.length;
      let otCount = 0;
      let otHours = 0;
      let attendedCount = 0;

      compWorkers.forEach((w) => {
        const val = w.daily ? w.daily[selectedDay] : "";
        const { isAttended, weekdayOt, weekendOt } = calculateWorkerDailyHours(val);
        const ot = weekdayOt + weekendOt;
        if (isAttended) attendedCount++;
        if (ot > 0) {
          otCount++;
          otHours += ot;
        }
      });

      map[comp] = {
        totalCount,
        otCount,
        otHours,
        attendedCount,
        workers: compWorkers
      };
    });
    return map;
  }, [smartData.attendanceMatrix, selectedDay]);

  // Filtered workers for Daily Summary & Input tabs
  const filteredAttendanceList = useMemo(() => {
    if (!smartData.attendanceMatrix) return [];
    return smartData.attendanceMatrix.filter((w) => {
      if (selectedCompanyFilter !== "전체" && w.company !== selectedCompanyFilter) return false;
      if (selectedDeptFilter !== "전체" && w.dept !== selectedDeptFilter) return false;
      if (searchWorkerQuery.trim()) {
        const q = searchWorkerQuery.trim().toLowerCase();
        const matchName = w.name?.toLowerCase().includes(q);
        const matchDept = w.dept?.toLowerCase().includes(q);
        const matchLine = w.line?.toLowerCase().includes(q);
        if (!matchName && !matchDept && !matchLine) return false;
      }
      return true;
    });
  }, [smartData.attendanceMatrix, selectedCompanyFilter, selectedDeptFilter, searchWorkerQuery]);

  // Unique Depts list
  const uniqueDepts = useMemo(() => {
    if (!smartData.attendanceMatrix) return [];
    const set = new Set(smartData.attendanceMatrix.map((w) => w.dept).filter(Boolean));
    return Array.from(set);
  }, [smartData.attendanceMatrix]);

  // Handle cell/attendance update
  const handleUpdateWorkerAttendance = async (workerNo, dayNum, newCode) => {
    const updatedMatrix = smartData.attendanceMatrix.map((w) => {
      if (w.no === workerNo) {
        return {
          ...w,
          daily: {
            ...(w.daily || {}),
            [dayNum]: newCode
          }
        };
      }
      return w;
    });

    const updatedData = {
      ...smartData,
      attendanceMatrix: updatedMatrix
    };

    setSmartData(updatedData);
    await saveSmartOvertimeData(updatedData);
    setCellEditTarget(null);
  };

  // Batch Apply to Filtered Workers on Selected Day
  const handleBatchApplyDay = async (code) => {
    if (!window.confirm(`선택된 ${filteredAttendanceList.length}명의 작업자에게 9월 ${selectedDay}일 근태를 '${code}'(으)로 일괄 적용하시겠습니까?`)) {
      return;
    }

    const targetNos = new Set(filteredAttendanceList.map((w) => w.no));
    const updatedMatrix = smartData.attendanceMatrix.map((w) => {
      if (targetNos.has(w.no)) {
        return {
          ...w,
          daily: {
            ...(w.daily || {}),
            [selectedDay]: code
          }
        };
      }
      return w;
    });

    const updatedData = {
      ...smartData,
      attendanceMatrix: updatedMatrix
    };

    setSmartData(updatedData);
    await saveSmartOvertimeData(updatedData);
    showNotification(`9월 ${selectedDay}일 ${filteredAttendanceList.length}명 '${code}' 일괄 적용 완료`);
  };

  // Quick Add Worker for Specific Company
  const handleQuickAddCompanyWorker = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!quickNewWorkerName.trim() || !managingCompany) {
      alert("작업자 성명을 입력해주세요.");
      return;
    }

    let updatedMaster = [...(smartData.masterWorkers || [])];
    let updatedMatrix = [...(smartData.attendanceMatrix || [])];

    const nextNo = (updatedMaster[updatedMaster.length - 1]?.no || 0) + 1;
    const newWorker = {
      no: nextNo,
      company: managingCompany,
      dept: quickNewWorkerDept.trim() || "생산팀",
      line: quickNewWorkerLine.trim() || "라인1",
      name: quickNewWorkerName.trim(),
      position: quickNewWorkerPos || "작업원",
      employmentType: "정규직",
      status: "재직",
      note: ""
    };

    updatedMaster.push(newWorker);
    updatedMatrix.push({
      no: nextNo,
      company: newWorker.company,
      dept: newWorker.dept,
      line: newWorker.line,
      name: newWorker.name,
      daily: {}
    });

    const updatedData = {
      ...smartData,
      masterWorkers: updatedMaster,
      attendanceMatrix: updatedMatrix
    };

    setSmartData(updatedData);
    await saveSmartOvertimeData(updatedData);

    setQuickNewWorkerName("");
    setQuickNewWorkerDept("");
    setQuickNewWorkerLine("");
    showNotification(`[${managingCompany}] ${newWorker.name} 작업자가 등록되었습니다.`);
  };

  // Open Add Modal for specific company
  const handleOpenAddForCompany = (comp) => {
    setEditingWorker(null);
    setWorkerFormData({
      company: comp,
      dept: comp === "(주)오륙" ? "가공동(AB동)" : "생산팀",
      line: "",
      name: "",
      position: "작업원",
      employmentType: "정규직",
      status: "재직",
      note: ""
    });
    setIsWorkerModalOpen(true);
  };

  // Delete worker
  const handleDeleteWorker = async (workerNo, workerName) => {
    if (!window.confirm(`'${workerName}' 작업자를 마스터 대장에서 삭제하시겠습니까?`)) return;

    const updatedMaster = (smartData.masterWorkers || []).filter((m) => m.no !== workerNo);
    const updatedMatrix = (smartData.attendanceMatrix || []).filter((m) => m.no !== workerNo);

    const updatedData = {
      ...smartData,
      masterWorkers: updatedMaster,
      attendanceMatrix: updatedMatrix
    };

    setSmartData(updatedData);
    await saveSmartOvertimeData(updatedData);
    showNotification(`${workerName} 작업자가 삭제되었습니다.`);
  };

  // Excel Export
  const handleExportExcel = () => {
    try {
      exportSmartOvertimeToExcel(smartData);
      showNotification("엑셀 파일(6개 시트)이 다운로드되었습니다.");
    } catch (err) {
      alert("엑셀 다운로드 오류: " + err.message);
    }
  };

  // Excel Import
  const handleImportExcel = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target.result;
        const parsed = importSmartOvertimeFromExcel(buffer);
        setSmartData(parsed);
        await saveSmartOvertimeData(parsed);
        showNotification(`엑셀 대장 가져오기 완료: 작업자 ${parsed.masterWorkers.length}명 등록됨`);
      } catch (err) {
        alert("엑셀 파일 분석 오류: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // Manual Save
  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      await saveSmartOvertimeData(smartData);
      showNotification("잔업 스마트 통합관리대장이 안전하게 저장되었습니다.");
    } catch (err) {
      alert("저장 실패: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default template
  const handleResetTemplate = async () => {
    if (!window.confirm("초기 엑셀 원본 템플릿 데이터로 초기화하시겠습니까?")) return;
    localStorage.removeItem("oryuk_smart_overtime_data_v1");
    const init = getLocalSmartOvertimeData();
    setSmartData(init);
    await saveSmartOvertimeData(init);
    showNotification("초기 템플릿으로 리셋되었습니다.");
  };

  // Master worker save modal
  const handleSaveWorkerModal = async (e) => {
    e.preventDefault();
    if (!workerFormData.name.trim()) {
      alert("작업자 성명을 입력해주세요.");
      return;
    }

    let updatedMaster = [...(smartData.masterWorkers || [])];
    let updatedMatrix = [...(smartData.attendanceMatrix || [])];

    if (editingWorker) {
      // Edit
      updatedMaster = updatedMaster.map((m) => {
        if (m.no === editingWorker.no) {
          return { ...m, ...workerFormData };
        }
        return m;
      });
      updatedMatrix = updatedMatrix.map((m) => {
        if (m.no === editingWorker.no) {
          return { ...m, ...workerFormData };
        }
        return m;
      });
      showNotification(`${workerFormData.name} 작업자 정보가 수정되었습니다.`);
    } else {
      // Add
      const nextNo = (updatedMaster[updatedMaster.length - 1]?.no || 0) + 1;
      const newWorker = {
        no: nextNo,
        ...workerFormData
      };
      updatedMaster.push(newWorker);
      updatedMatrix.push({
        no: nextNo,
        company: newWorker.company,
        dept: newWorker.dept,
        line: newWorker.line,
        name: newWorker.name,
        daily: {}
      });
      showNotification(`새 작업자 ${workerFormData.name}님이 등록되었습니다.`);
    }

    const updatedData = {
      ...smartData,
      masterWorkers: updatedMaster,
      attendanceMatrix: updatedMatrix
    };

    setSmartData(updatedData);
    await saveSmartOvertimeData(updatedData);
    setIsWorkerModalOpen(false);
  };

  // Style configurations for company cards
  const COMPANY_THEMES = {
    "(주)오륙": {
      name: "(주)오륙",
      shortName: "오륙",
      tag: "본사/메인",
      badgeBg: "bg-blue-600 text-white",
      cardBg: "bg-gradient-to-br from-blue-950/80 via-slate-900 to-indigo-950/80 border-blue-500/50 hover:border-blue-400",
      accentText: "text-blue-300",
      otText: "text-amber-400",
      btnClass: "bg-blue-600 hover:bg-blue-500 text-white"
    },
    "(주)조영산업": {
      name: "(주)조영산업",
      shortName: "조영산업",
      tag: "협력사",
      badgeBg: "bg-purple-600 text-white",
      cardBg: "bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-900 border-purple-500/50 hover:border-purple-400",
      accentText: "text-purple-300",
      otText: "text-amber-400",
      btnClass: "bg-purple-600 hover:bg-purple-500 text-white"
    },
    "한울": {
      name: "한울",
      shortName: "한울",
      tag: "협력사",
      badgeBg: "bg-emerald-600 text-white",
      cardBg: "bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border-emerald-500/50 hover:border-emerald-400",
      accentText: "text-emerald-300",
      otText: "text-amber-400",
      btnClass: "bg-emerald-600 hover:bg-emerald-500 text-white"
    },
    "부림텍": {
      name: "부림텍",
      shortName: "부림텍",
      tag: "협력사",
      badgeBg: "bg-amber-600 text-white",
      cardBg: "bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-900 border-amber-500/50 hover:border-amber-400",
      accentText: "text-amber-300",
      otText: "text-amber-400",
      btnClass: "bg-amber-600 hover:bg-amber-500 text-white"
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn max-w-[1700px] mx-auto">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-black">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Top Header & Factory Summary Panels (주)오륙, (주)조영산업, 한울, 부림텍 */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-4 sm:p-6 text-white shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-2xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>공장별 일일근태현황 및 특근현황 요약</span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  4개사 스마트 통합관리
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              (주)오륙 • (주)조영산업 • 한울 • 부림텍 공장별 실시간 근태 집계 및 근로자 관리 대장
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportExcel}
              accept=".xlsx, .xls"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-xs font-bold text-slate-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-102"
              title="엑셀 파일(잔업 스마트 통합관리대장.xlsx)을 업로드하여 일괄 갱신합니다"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>엑셀 업로드</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20 hover:scale-102"
              title="현재 데이터를 6개 시트 엑셀 파일로 다운로드합니다"
            >
              <Download className="w-3.5 h-3.5" />
              <span>엑셀 다운로드 (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleManualSave}
              disabled={isSaving}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20 hover:scale-102"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "저장 중..." : "클라우드 저장"}</span>
            </button>

            <button
              type="button"
              onClick={handleResetTemplate}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border-2 border-slate-600 transition-all cursor-pointer shadow-md"
              title="원본 템플릿으로 리셋"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 🌟 4개 공장별(업체별) 요약 패널 : (주)오륙 / (주)조영산업 / 한울 / 부림텍 */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-300 flex items-center gap-1">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>공장별 실시간 요약 (9월 {selectedDay}일 기준)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                (총원 • 당일 잔업 인원수 및 근로자 간편 관리)
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              전사 총원: <strong className="text-white font-black">{smartData.attendanceMatrix?.length || 107}명</strong> • 
              당일 출근: <strong className="text-sky-300 font-black">{daySummary.totalAttended}명</strong> • 
              당일 잔업: <strong className="text-amber-400 font-black">{daySummary.ot19Count + daySummary.ot21Count + daySummary.ot22Count + daySummary.specialNightCount}명</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {COMPANIES.map((comp) => {
              const theme = COMPANY_THEMES[comp] || COMPANY_THEMES["(주)오륙"];
              const stats = companyStatsMap[comp] || { totalCount: 0, otCount: 0, otHours: 0, attendedCount: 0, workers: [] };

              return (
                <div
                  key={comp}
                  className={`p-3.5 rounded-2xl border-2 shadow-lg transition-all space-y-2.5 relative group ${theme.cardBg}`}
                >
                  {/* Company Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10.5px] font-black px-2 py-0.5 rounded-lg ${theme.badgeBg} shadow-xs`}>
                        {comp}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {theme.tag}
                      </span>
                    </div>

                    <span className="text-[10.5px] font-bold text-slate-400">
                      출근 {stats.attendedCount}명
                    </span>
                  </div>

                  {/* Prominent Totals: 총원 00명 • 잔업 00명 */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block">👥 총원</span>
                      <span className="text-lg font-black text-white">
                        {stats.totalCount}<span className="text-xs font-bold text-slate-400 ml-0.5">명</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold text-amber-400 block">⚡ 잔업</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-amber-300">
                          {stats.otCount}<span className="text-xs font-bold text-amber-400/80 ml-0.5">명</span>
                        </span>
                        {stats.otHours > 0 && (
                          <span className="text-[10px] font-bold text-amber-400/90 font-mono">
                            (+{stats.otHours}H)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons for Adding & Managing Workers */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenAddForCompany(comp)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer ${theme.btnClass}`}
                      title={`[${comp}] 새 근로자 등록`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ 근로자 추가</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setManagingCompany(comp)}
                      className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-[11px] font-black text-slate-200 hover:text-white flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md"
                      title={`[${comp}] 근로자 목록 조회 및 삭제 관리`}
                    >
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>근로자 관리</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900 border-2 border-slate-700 overflow-x-auto no-scrollbar shadow-md">
        {[
          { id: "daily_summary", label: "📋 일자별 근태정리본", icon: CalendarDays },
          { id: "daily_input", label: "📝 일일근태 간편입력", icon: Edit3 },
          { id: "monthly_matrix", label: "📊 9월 종합 현황판 (달력형 매트릭스)", icon: BarChart3 },
          { id: "company_settle", label: "🏢 업체별 & 공정별 결산요약", icon: Building2 },
          { id: "master_workers", label: "👥 인원정보 마스터관리", icon: Users },
          { id: "legacy_reports", label: "📑 주말특근 결재보고서", icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg border border-blue-400 ring-2 ring-blue-500/40"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 📋 일자별 근태정리본 */}
      {/* ========================================================================= */}
      {activeTab === "daily_summary" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Day Selector & High Contrast Filter Ribbon */}
          <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 border-2 border-slate-700 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3 flex-wrap">
                {/* High Contrast Date Selector Dropdown */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950 border-2 border-blue-500 shadow-inner">
                  <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-black text-blue-300">조회 일자:</span>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(Number(e.target.value))}
                    className="bg-slate-950 text-white text-xs sm:text-sm font-black focus:outline-none cursor-pointer pr-2"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d} className="bg-slate-900 text-white font-bold py-1">
                        2026년 9월 {d}일 ({["화","수","목","금","토","일","월"][(d - 1) % 7]})
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-xs font-bold text-slate-300">
                  총 <strong className="text-white font-black">{filteredAttendanceList.length}명</strong> 작업자 표시
                </span>
              </div>

              {/* High Contrast Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Company Filter Dropdown */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950 border-2 border-slate-600 shadow-inner text-xs">
                  <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <select
                    value={selectedCompanyFilter}
                    onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                    className="bg-slate-950 text-white font-black focus:outline-none cursor-pointer"
                  >
                    <option value="전체" className="bg-slate-900 text-white font-bold">🏢 전체 업체 (4개사)</option>
                    {COMPANIES.map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-white font-bold">{c}</option>
                    ))}
                  </select>
                </div>

                {/* Dept Filter Dropdown */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950 border-2 border-slate-600 shadow-inner text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="bg-slate-950 text-white font-black focus:outline-none cursor-pointer"
                  >
                    <option value="전체" className="bg-slate-900 text-white font-bold">📂 전체 부서</option>
                    {uniqueDepts.map((d) => (
                      <option key={d} value={d} className="bg-slate-900 text-white font-bold">{d}</option>
                    ))}
                  </select>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="작업자/차종 검색..."
                    value={searchWorkerQuery}
                    onChange={(e) => setSearchWorkerQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-2xl bg-slate-950 border-2 border-slate-600 text-white text-xs font-bold focus:outline-none focus:border-blue-400 w-36 sm:w-44 shadow-inner placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Daily KPI Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-blue-950/60 border border-blue-700/80">
                <span className="text-[10px] font-extrabold text-blue-300 block">👥 당일 출근총원</span>
                <span className="text-sm sm:text-base font-black text-white">{daySummary.totalAttended}명</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/80">
                <span className="text-[10px] font-extrabold text-emerald-300 block">🟢 정시 (8H)</span>
                <span className="text-sm sm:text-base font-black text-emerald-200">{daySummary.regularCount}명</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-amber-950/60 border border-amber-700/80">
                <span className="text-[10px] font-extrabold text-amber-300 block">🟡 19시 (+2H)</span>
                <span className="text-sm sm:text-base font-black text-amber-200">{daySummary.ot19Count}명</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-orange-950/60 border border-orange-700/80">
                <span className="text-[10px] font-extrabold text-orange-300 block">🟠 21시 (+4H)</span>
                <span className="text-sm sm:text-base font-black text-orange-200">{daySummary.ot21Count}명</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-rose-950/60 border border-rose-700/80">
                <span className="text-[10px] font-extrabold text-rose-300 block">🔴 22시 (+5H)</span>
                <span className="text-sm sm:text-base font-black text-rose-200">{daySummary.ot22Count}명</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-purple-950/60 border border-purple-700/80">
                <span className="text-[10px] font-extrabold text-purple-300 block">🌙 특근/야간</span>
                <span className="text-sm sm:text-base font-black text-purple-200">{daySummary.specialNightCount}명</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50">
                <span className="text-[10px] font-extrabold text-amber-300 block">⚡ 당일 잔업합계</span>
                <span className="text-sm sm:text-base font-black text-amber-300 font-mono">+{daySummary.dayOtHours}H</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-indigo-950/60 border border-indigo-700/80">
                <span className="text-[10px] font-extrabold text-indigo-300 block">⏱ 당일 총투입공수</span>
                <span className="text-sm sm:text-base font-black text-indigo-200 font-mono">{daySummary.dayTotalHours}H</span>
              </div>
            </div>
          </div>

          {/* Workers Daily Summary Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>9월 {selectedDay}일 전 작업자 근태 및 잔업 상세</span>
                  <span className="text-xs text-slate-400 font-bold">({filteredAttendanceList.length}명)</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddForCompany(selectedCompanyFilter === "전체" ? "(주)오륙" : selectedCompanyFilter)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ 근로자 추가</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-900 text-white font-black sticky top-0 z-10 border-b-2 border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">No.</th>
                    <th className="py-2.5 px-3">소속 업체</th>
                    <th className="py-2.5 px-3">소속 부서</th>
                    <th className="py-2.5 px-3">차종 / 라인</th>
                    <th className="py-2.5 px-3 font-black">작업자 성명</th>
                    <th className="py-2.5 px-3 text-center">9월 {selectedDay}일 근태/잔업</th>
                    <th className="py-2.5 px-3 text-right">잔업시간(H)</th>
                    <th className="py-2.5 px-3 text-right font-black">총근무시간(H)</th>
                    <th className="py-2.5 px-3">월간 누적</th>
                    <th className="py-2.5 px-3 text-center w-16">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredAttendanceList.map((w, idx) => {
                    const val = w.daily ? w.daily[selectedDay] : "";
                    const meta = getOptionMeta(val);
                    const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
                    const totals = calculateWorkerMonthlyTotals(w);
                    const isEditing = cellEditTarget?.workerNo === w.no && cellEditTarget?.dayNum === selectedDay;

                    return (
                      <tr key={w.no} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-200">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold border ${
                            w.company === "(주)오륙"
                              ? "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200"
                              : w.company === "(주)조영산업"
                              ? "bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200"
                              : w.company === "한울"
                              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200"
                              : "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200"
                          }`}>
                            {w.company}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{w.dept || "-"}</td>
                        <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{w.line || "-"}</td>
                        <td className="py-2 px-3 font-black text-slate-900 dark:text-white text-sm">
                          {w.name}
                        </td>

                        {/* Attendance Code / Selector */}
                        <td className="py-2 px-3 text-center relative">
                          {isEditing ? (
                            <div className="absolute z-30 left-1/2 -translate-x-1/2 top-1 bg-slate-900 p-2.5 rounded-2xl shadow-2xl border-2 border-blue-500 grid grid-cols-3 gap-1 min-w-[290px]">
                              {ATTENDANCE_OPTIONS.map((opt) => (
                                <button
                                  key={opt.code}
                                  type="button"
                                  onClick={() => handleUpdateWorkerAttendance(w.no, selectedDay, opt.code)}
                                  className={`p-1.5 rounded-lg border text-[10.5px] font-black cursor-pointer transition-all hover:scale-105 ${opt.bg}`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setCellEditTarget(null)}
                                className="col-span-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
                              >
                                닫기 ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCellEditTarget({ workerNo: w.no, dayNum: selectedDay, currentVal: val })}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-black shadow-2xs transition-all hover:scale-105 cursor-pointer ${meta.bg}`}
                              title="클릭하여 근태/잔업 변경"
                            >
                              {val ? meta.label : <span className="text-slate-400 font-normal">선택</span>}
                            </button>
                          )}
                        </td>

                        <td className="py-2 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          {weekdayOt + weekendOt > 0 ? `+${weekdayOt + weekendOt}H` : "0H"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                          {workHours}H
                        </td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                          출근 {totals.workDays}일 / <strong className="text-indigo-600 dark:text-indigo-400">{totals.totalHours}H</strong>
                        </td>

                        {/* Quick Delete action */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteWorker(w.no, w.name)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                            title="작업자 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 📝 일일근태 간편입력 */}
      {/* ========================================================================= */}
      {activeTab === "daily_input" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Quick Action Top Bar with High Contrast Dropdowns */}
          <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 border-2 border-slate-700 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Date dropdown */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950 border-2 border-blue-500 shadow-inner">
                  <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-black text-blue-300">작성 일자:</span>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(Number(e.target.value))}
                    className="bg-slate-950 text-white text-xs sm:text-sm font-black focus:outline-none cursor-pointer pr-2"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d} className="bg-slate-900 text-white font-bold py-1">
                        2026년 9월 {d}일 ({["화","수","목","금","토","일","월"][(d - 1) % 7]})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company dropdown */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950 border-2 border-slate-600 shadow-inner text-xs">
                  <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-400">관리 대상:</span>
                  <select
                    value={selectedCompanyFilter}
                    onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                    className="bg-slate-950 text-white font-black focus:outline-none cursor-pointer"
                  >
                    <option value="전체" className="bg-slate-900 text-white font-bold">🏢 전체(4개사)</option>
                    {COMPANIES.map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-white font-bold">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Batch Quick Apply Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-400 mr-1">일괄적용:</span>
                <button
                  type="button"
                  onClick={() => handleBatchApplyDay("🟢")}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:scale-105 transition-all cursor-pointer shadow-md"
                >
                  🟢 전체 정시(8H)
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchApplyDay("19")}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-black hover:scale-105 transition-all cursor-pointer shadow-md"
                >
                  🟡 전체 19시(+2H)
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchApplyDay("21")}
                  className="px-2.5 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-black hover:scale-105 transition-all cursor-pointer shadow-md"
                >
                  🟠 전체 21시(+4H)
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchApplyDay("-")}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-700 text-slate-200 text-xs font-black hover:scale-105 transition-all cursor-pointer border border-slate-600 shadow-md"
                >
                  - 전체 휴무(0H)
                </button>
              </div>
            </div>

            {/* Live Stats Ribbon for Selected Day */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex-wrap gap-2">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-extrabold text-slate-300">9월 {selectedDay}일 실시간 집계:</span>
                <span className="font-bold text-emerald-400">정시 {daySummary.regularCount}명</span>
                <span className="font-bold text-amber-400">19시 {daySummary.ot19Count}명</span>
                <span className="font-bold text-orange-400">21시 {daySummary.ot21Count}명</span>
                <span className="font-bold text-rose-400">22시 {daySummary.ot22Count}명</span>
                <span className="font-bold text-purple-400">특근/야간 {daySummary.specialNightCount}명</span>
              </div>
              <div className="flex items-center gap-3 font-mono font-black text-sm">
                <span>잔업 <strong className="text-amber-400 font-bold">+{daySummary.dayOtHours}H</strong></span>
                <span>총공수 <strong className="text-sky-300 font-bold">{daySummary.dayTotalHours}H</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Input Grid by Worker Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAttendanceList.map((w, idx) => {
              const val = w.daily ? w.daily[selectedDay] : "";
              const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);

              return (
                <div key={w.no} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] font-mono text-slate-400 font-bold">#{idx + 1}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{w.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                        {w.dept}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400">{w.company}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteWorker(w.no, w.name)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="작업자 삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Fast Button Picker */}
                  <div className="grid grid-cols-5 gap-1 text-[10.5px] font-black">
                    {[
                      { code: "🟢", label: "정시", bg: "hover:bg-emerald-100", active: "bg-emerald-600 text-white border-emerald-600" },
                      { code: "19", label: "19시", bg: "hover:bg-amber-100", active: "bg-amber-600 text-white border-amber-600" },
                      { code: "21", label: "21시", bg: "hover:bg-orange-100", active: "bg-orange-600 text-white border-orange-600" },
                      { code: "22", label: "22시", bg: "hover:bg-rose-100", active: "bg-rose-600 text-white border-rose-600" },
                      { code: "특근", label: "특근", bg: "hover:bg-purple-100", active: "bg-purple-600 text-white border-purple-600" },
                      { code: "야간", label: "야간", bg: "hover:bg-indigo-100", active: "bg-indigo-600 text-white border-indigo-600" },
                      { code: "주야", label: "주야", bg: "hover:bg-cyan-100", active: "bg-cyan-600 text-white border-cyan-600" },
                      { code: "연차", label: "연차", bg: "hover:bg-teal-100", active: "bg-teal-600 text-white border-teal-600" },
                      { code: "반차", label: "반차", bg: "hover:bg-sky-100", active: "bg-sky-600 text-white border-sky-600" },
                      { code: "-", label: "휴무", bg: "hover:bg-slate-200", active: "bg-slate-700 text-white border-slate-700" }
                    ].map((btn) => {
                      const isSelected = String(val).trim() === btn.code || (btn.code === "🟢" && (val === "정시" || val === "17"));
                      return (
                        <button
                          key={btn.code}
                          type="button"
                          onClick={() => handleUpdateWorkerAttendance(w.no, selectedDay, btn.code)}
                          className={`py-1 rounded-lg border text-center transition-all cursor-pointer font-black ${
                            isSelected
                              ? btn.active + " shadow-xs ring-1 ring-white"
                              : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 " + btn.bg
                          }`}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Hours Result */}
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-bold">
                      잔업: <strong className="text-amber-600 dark:text-amber-400 font-mono">+{weekdayOt + weekendOt}H</strong>
                    </span>
                    <span className="text-slate-500 font-bold">
                      당일 근무: <strong className="text-blue-600 dark:text-blue-400 font-mono text-xs font-black">{workHours}H</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 📊 9월 종합 현황판 (달력형 매트릭스) */}
      {/* ========================================================================= */}
      {activeTab === "monthly_matrix" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fadeIn space-y-3 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>2026년 9월 4개사 통합 근태 및 잔업 스마트 종합관리대장</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-extrabold">(1일~30일 전체)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ※ 셀을 클릭하여 원하는 날짜의 근태 코드를 즉시 변경할 수 있습니다. (🟢=정시, 19=+2H, 21=+4H, 22=+5H, 특근=+8H, -=휴무)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-2xl bg-slate-900 border-2 border-slate-600 shadow-md">
                <select
                  value={selectedCompanyFilter}
                  onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                  className="bg-slate-900 text-white text-xs font-black focus:outline-none cursor-pointer"
                >
                  <option value="전체" className="bg-slate-900 text-white font-bold">🏢 전체(4개사)</option>
                  {COMPANIES.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white font-bold">{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Matrix Table with Sticky Columns */}
          <div className="overflow-x-auto max-h-[650px] overflow-y-auto border border-slate-200 dark:border-slate-700/80 rounded-2xl">
            <table className="w-full text-center border-collapse text-[11px]">
              <thead className="bg-slate-900 text-white font-black sticky top-0 z-20 shadow-md">
                {/* Day of week row */}
                <tr className="border-b border-slate-700 text-[10px]">
                  <th className="py-1.5 px-2 sticky left-0 bg-slate-900 z-30 w-10">No</th>
                  <th className="py-1.5 px-2 sticky left-10 bg-slate-900 z-30 min-w-[70px]">업체</th>
                  <th className="py-1.5 px-2 sticky left-28 bg-slate-900 z-30 min-w-[70px]">부서</th>
                  <th className="py-1.5 px-2 sticky left-44 bg-slate-900 z-30 min-w-[65px]">성명</th>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                    const dow = ["화","수","목","금","토","일","월"][(d - 1) % 7];
                    const isWeekend = dow === "토" || dow === "일";
                    return (
                      <th
                        key={d}
                        className={`py-1 px-1 min-w-[32px] ${
                          isWeekend ? "text-rose-400 bg-rose-950/60 font-black" : ""
                        }`}
                      >
                        {dow}
                      </th>
                    );
                  })}
                  <th className="py-1.5 px-2 bg-slate-800 min-w-[45px]">출근</th>
                  <th className="py-1.5 px-2 bg-amber-950 text-amber-300 min-w-[50px]">평일잔업</th>
                  <th className="py-1.5 px-2 bg-purple-950 text-purple-300 min-w-[50px]">주말특근</th>
                  <th className="py-1.5 px-2 bg-indigo-950 text-indigo-300 min-w-[40px]">야간</th>
                  <th className="py-1.5 px-2 bg-blue-600 text-white min-w-[55px]">총공수</th>
                </tr>

                {/* Day of month row */}
                <tr className="border-b-2 border-slate-700 text-[9.5px]">
                  <th colSpan={4} className="py-0.5 px-2 sticky left-0 bg-slate-900 z-30">일자 구분</th>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                    <th key={d} className="py-0.5 px-1 font-mono">{d}일</th>
                  ))}
                  <th className="py-0.5 px-1 bg-slate-800">일수</th>
                  <th className="py-0.5 px-1 bg-amber-950 text-amber-300">시간(H)</th>
                  <th className="py-0.5 px-1 bg-purple-950 text-purple-300">시간(H)</th>
                  <th className="py-0.5 px-1 bg-indigo-950 text-indigo-300">일</th>
                  <th className="py-0.5 px-1 bg-blue-600 text-white">시간(H)</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold">
                {filteredAttendanceList.map((w, idx) => {
                  const totals = calculateWorkerMonthlyTotals(w);

                  return (
                    <tr key={w.no} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-1 px-2 sticky left-0 bg-white dark:bg-slate-900 z-10 text-slate-400 font-mono text-[10px]">
                        {idx + 1}
                      </td>
                      <td className="py-1 px-2 sticky left-10 bg-white dark:bg-slate-900 z-10 text-[10px] text-slate-600 dark:text-slate-300 truncate max-w-[70px]">
                        {w.company?.replace("(주)", "")}
                      </td>
                      <td className="py-1 px-2 sticky left-28 bg-white dark:bg-slate-900 z-10 text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[70px]">
                        {w.dept}
                      </td>
                      <td className="py-1 px-2 sticky left-44 bg-white dark:bg-slate-900 z-10 text-xs font-black text-slate-900 dark:text-white truncate max-w-[65px]">
                        {w.name}
                      </td>

                      {/* 30 Day Cells */}
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                        const val = w.daily ? w.daily[d] : "";
                        const meta = getOptionMeta(val);

                        return (
                          <td
                            key={d}
                            onClick={() => {
                              // Cycle options
                              const codes = ["🟢", "19", "21", "22", "특근", "야간", "-"];
                              const curIdx = codes.indexOf(val);
                              const nextCode = codes[(curIdx + 1) % codes.length];
                              handleUpdateWorkerAttendance(w.no, d, nextCode);
                            }}
                            className={`py-1 px-0.5 border-r border-slate-100 dark:border-slate-800/60 cursor-pointer select-none transition-all hover:ring-2 hover:ring-blue-400 ${
                              val === "🟢" || val === "정시"
                                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20"
                                : val === "19"
                                ? "text-amber-600 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/40 font-black"
                                : val === "21"
                                ? "text-orange-600 dark:text-orange-400 bg-orange-50/70 dark:bg-orange-950/40 font-black"
                                : val === "22"
                                ? "text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/40 font-black"
                                : val === "특근"
                                ? "text-purple-600 dark:text-purple-400 bg-purple-50/70 dark:bg-purple-950/40 font-black"
                                : val === "-"
                                ? "text-slate-300 dark:text-slate-600"
                                : "text-slate-400"
                            }`}
                            title={`${w.name} 9월 ${d}일: ${val || '미입력'} (클릭 시 변경)`}
                          >
                            {val || ""}
                          </td>
                        );
                      })}

                      {/* Summary Columns */}
                      <td className="py-1 px-2 font-mono bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                        {totals.workDays}
                      </td>
                      <td className="py-1 px-2 font-mono bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-black">
                        {totals.weekdayOtHours}
                      </td>
                      <td className="py-1 px-2 font-mono bg-purple-50/60 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 font-black">
                        {totals.weekendOtHours}
                      </td>
                      <td className="py-1 px-2 font-mono bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300">
                        {totals.nightDays}
                      </td>
                      <td className="py-1 px-2 font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black text-xs">
                        {totals.totalHours}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: 🏢 업체별 & 공정별 결산요약 */}
      {/* ========================================================================= */}
      {activeTab === "company_settle" && (
        <div className="space-y-4 animate-fadeIn">
          {/* 4 Companies Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>2026년 9월 업체별 근태 및 잔업 투입공수 통합 결산표</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-900 text-white font-black border-b-2 border-slate-700">
                  <tr>
                    <th className="py-3 px-4">구분 (업체명)</th>
                    <th className="py-3 px-4 text-center">관리 인원수</th>
                    <th className="py-3 px-4 text-right">누적 출근일수</th>
                    <th className="py-3 px-4 text-right">평일잔업 누계(H)</th>
                    <th className="py-3 px-4 text-right">주말특근 누계(H)</th>
                    <th className="py-3 px-4 text-right">야간근무 누계(일)</th>
                    <th className="py-3 px-4 text-right font-black text-blue-400">총 투입공수(H)</th>
                    <th className="py-3 px-4 text-right font-black">공수 비중(%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold">
                  {companySummaryList.map((c, idx) => {
                    const isTotal = c.company.includes("합계");
                    return (
                      <tr
                        key={c.company}
                        className={`${
                          isTotal
                            ? "bg-blue-50/80 dark:bg-blue-950/60 font-black text-blue-900 dark:text-blue-200 text-sm"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <td className="py-3 px-4 flex items-center gap-2">
                          {!isTotal && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                          <span>{c.company}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">{c.workerCount}명</td>
                        <td className="py-3 px-4 text-right font-mono">{c.totalWorkDays.toLocaleString()}일</td>
                        <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400">{c.weekdayOtHours.toLocaleString()}H</td>
                        <td className="py-3 px-4 text-right font-mono text-purple-600 dark:text-purple-400">{c.weekendOtHours.toLocaleString()}H</td>
                        <td className="py-3 px-4 text-right font-mono text-indigo-600 dark:text-indigo-400">{c.nightDays}일</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-sm text-blue-700 dark:text-blue-300">
                          {c.totalHours.toLocaleString()}H
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <div className="flex items-center justify-end gap-2">
                            <span>{c.ratio}%</span>
                            {!isTotal && (
                              <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full"
                                  style={{ width: `${c.ratio}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department / Line Statistics */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Factory className="w-5 h-5 text-emerald-600" />
              <span>부서 및 공정/라인별 근태 통계 집계표</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {deptSummaryList.map((d) => (
                <div key={d.dept} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900 dark:text-white">{d.dept}</span>
                    <span className="text-xs font-bold text-slate-500">{d.workerCount}명</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10.5px] text-center font-bold">
                    <div className="bg-white dark:bg-slate-700 rounded p-1 border border-slate-200 dark:border-slate-600">
                      출근 {d.totalWorkDays}일
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded p-1 border border-amber-200">
                      잔업 {d.weekdayOtHours}H
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded p-1 border border-purple-200">
                      특근 {d.weekendOtHours}H
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <span className="text-slate-400 font-bold">총 투입공수</span>
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400">{d.totalHours.toLocaleString()}H</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: 👥 인원정보 마스터관리 */}
      {/* ========================================================================= */}
      {activeTab === "master_workers" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>4개사 소속 인원 정보 마스터 관리 대장</span>
                <span className="text-xs text-slate-400 font-bold">({smartData.masterWorkers?.length || 108}명)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                작업자 추가/수정/삭제 시 모든 시트 및 일일 근태 현황에 실시간 자동 반영됩니다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddForCompany("(주)오륙")}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>새 작업자 추가</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 text-white font-black sticky top-0 z-10 border-b-2 border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">No.</th>
                  <th className="py-2.5 px-3">소속 업체명</th>
                  <th className="py-2.5 px-3">소속 부서 / 공정</th>
                  <th className="py-2.5 px-3">담당 차종 / 라인</th>
                  <th className="py-2.5 px-3 font-black">작업자 성명</th>
                  <th className="py-2.5 px-3">직급 / 직책</th>
                  <th className="py-2.5 px-3">고용 형태</th>
                  <th className="py-2.5 px-3">재직 상태</th>
                  <th className="py-2.5 px-3 text-center w-24">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {(smartData.masterWorkers || []).map((w, idx) => (
                  <tr key={w.no} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-200">{w.company}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{w.dept}</td>
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{w.line || "-"}</td>
                    <td className="py-2 px-3 font-black text-slate-900 dark:text-white text-sm">{w.name}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{w.position}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{w.employmentType}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                        w.status === "퇴사"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}>
                        {w.status || "재직"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingWorker(w);
                            setWorkerFormData({
                              company: w.company || "(주)오륙",
                              dept: w.dept || "",
                              line: w.line || "",
                              name: w.name || "",
                              position: w.position || "작업원",
                              employmentType: w.employmentType || "정규직",
                              status: w.status || "재직",
                              note: w.note || ""
                            });
                            setIsWorkerModalOpen(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                          title="수정"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWorker(w.no, w.name)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: 📑 주말특근 결재보고서 (Legacy Report Preserved) */}
      {/* ========================================================================= */}
      {activeTab === "legacy_reports" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Legacy Overtime Report Selector */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span>주말 특근보고서 (결재선 포함 전자문서)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {legacyReports.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => {
                    setDetailReport(rep);
                    setIsDetailModalOpen(true);
                  }}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700 hover:border-purple-500 transition-all cursor-pointer space-y-2 hover:scale-102"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-600 dark:text-purple-400">{rep.plant}</span>
                    <span className="text-[11px] font-mono text-slate-400">{rep.workDate}</span>
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">{rep.title}</h4>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">작성자: <strong>{rep.author}</strong></span>
                    <span className="text-purple-600 font-bold flex items-center gap-1">
                      <span>상세보기</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: 🏢 공장별 근로자 간편 관리 모달 (추가 및 삭제 전용) */}
      {/* ========================================================================= */}
      {managingCompany && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 border-2 border-blue-500/80 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-600 text-white">
                  <Building2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-white flex items-center gap-2">
                    <span>{managingCompany} 근로자 관리</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 font-extrabold border border-blue-500/40">
                      총 {(companyStatsMap[managingCompany]?.workers || []).length}명
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    새 근로자를 즉시 추가하거나 등록된 근로자를 원클릭으로 삭제할 수 있습니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagingCompany(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Add Form on Top of Modal */}
            <form onSubmit={handleQuickAddCompanyWorker} className="p-3 rounded-2xl bg-slate-950 border-2 border-slate-700 space-y-2 shrink-0">
              <span className="text-xs font-black text-blue-400 flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5" />
                <span>[{managingCompany}] 새 근로자 즉시 추가</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    required
                    placeholder="성명 (예: 김철수)"
                    value={quickNewWorkerName}
                    onChange={(e) => setQuickNewWorkerName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border-2 border-slate-600 text-white text-xs font-black focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="소속 부서 (예: 가공팀)"
                    value={quickNewWorkerDept}
                    onChange={(e) => setQuickNewWorkerDept(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border-2 border-slate-600 text-white text-xs font-bold focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="차종/라인 (예: JA, NX4)"
                    value={quickNewWorkerLine}
                    onChange={(e) => setQuickNewWorkerLine(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border-2 border-slate-600 text-white text-xs font-bold focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    + 추가
                  </button>
                </div>
              </div>
            </form>

            {/* Scrollable Worker List with Instant Delete Button */}
            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-300 font-black sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                    <th className="py-2.5 px-3">성명</th>
                    <th className="py-2.5 px-3">부서 / 공정</th>
                    <th className="py-2.5 px-3">차종 / 라인</th>
                    <th className="py-2.5 px-3">직급</th>
                    <th className="py-2.5 px-3 text-center w-20">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(companyStatsMap[managingCompany]?.workers || []).map((w, idx) => (
                    <tr key={w.no} className="hover:bg-slate-800/60 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-black text-white text-sm">{w.name}</td>
                      <td className="py-2 px-3 text-slate-300">{w.dept || "-"}</td>
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{w.line || "-"}</td>
                      <td className="py-2 px-3 text-slate-400">{w.position || "작업원"}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteWorker(w.no, w.name)}
                          className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-800 border border-rose-600 text-rose-300 hover:text-white text-[10.5px] font-black transition-all flex items-center gap-1 mx-auto cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>삭제</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setManagingCompany(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Full Worker Master Add/Edit Modal */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full p-5 border-2 border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-black text-base text-white">
                {editingWorker ? "작업자 정보 수정" : "새 작업자 마스터 등록"}
              </h3>
              <button
                type="button"
                onClick={() => setIsWorkerModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWorkerModal} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">소속 업체</label>
                <div className="p-1 rounded-xl bg-slate-950 border-2 border-slate-600">
                  <select
                    value={workerFormData.company}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, company: e.target.value })}
                    className="w-full bg-slate-950 text-white font-black p-1.5 focus:outline-none"
                  >
                    {COMPANIES.map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-white font-bold">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">소속 부서 / 공정</label>
                <input
                  type="text"
                  required
                  placeholder="예: 가공동(AB동), 압출, 조립1팀"
                  value={workerFormData.dept}
                  onChange={(e) => setWorkerFormData({ ...workerFormData, dept: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border-2 border-slate-600 text-white font-bold focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">담당 차종 / 라인</label>
                <input
                  type="text"
                  placeholder="예: JA, NX4, 압출#1"
                  value={workerFormData.line}
                  onChange={(e) => setWorkerFormData({ ...workerFormData, line: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border-2 border-slate-600 text-white font-bold focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">작업자 성명</label>
                <input
                  type="text"
                  required
                  placeholder="예: 홍길동"
                  value={workerFormData.name}
                  onChange={(e) => setWorkerFormData({ ...workerFormData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border-2 border-slate-600 text-white font-black text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">직급</label>
                  <input
                    type="text"
                    value={workerFormData.position}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, position: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border-2 border-slate-600 text-white font-bold focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">고용형태</label>
                  <div className="p-0.5 rounded-xl bg-slate-950 border-2 border-slate-600">
                    <select
                      value={workerFormData.employmentType}
                      onChange={(e) => setWorkerFormData({ ...workerFormData, employmentType: e.target.value })}
                      className="w-full bg-slate-950 text-white font-bold p-1 text-xs focus:outline-none"
                    >
                      <option value="정규직" className="bg-slate-900 text-white font-bold">정규직</option>
                      <option value="계약직" className="bg-slate-900 text-white font-bold">계약직</option>
                      <option value="파견직" className="bg-slate-900 text-white font-bold">파견직</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">재직상태</label>
                  <div className="p-0.5 rounded-xl bg-slate-950 border-2 border-slate-600">
                    <select
                      value={workerFormData.status}
                      onChange={(e) => setWorkerFormData({ ...workerFormData, status: e.target.value })}
                      className="w-full bg-slate-950 text-white font-bold p-1 text-xs focus:outline-none"
                    >
                      <option value="재직" className="bg-slate-900 text-white font-bold">재직</option>
                      <option value="퇴사" className="bg-slate-900 text-white font-bold">퇴사</option>
                      <option value="휴직" className="bg-slate-900 text-white font-bold">휴직</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold hover:text-white cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Legacy Overtime Report Detail / Print */}
      {isDetailModalOpen && detailReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  {detailReport.plant}
                </span>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {detailReport.title} ({detailReport.workDate})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Electronic Sign Box */}
            <div className="flex items-center justify-end gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              {(detailReport.approval || []).map((ap, idx) => (
                <div key={idx} className="text-center border border-slate-300 dark:border-slate-600 rounded-lg p-1.5 bg-white dark:bg-slate-800 w-16">
                  <span className="text-[10px] text-slate-400 block font-bold">{ap.role}</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block my-0.5">승인</span>
                  <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-200">{ap.name}</span>
                </div>
              ))}
            </div>

            {/* Line items table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-black">
                  <tr>
                    <th className="p-2.5">구분</th>
                    <th className="p-2.5">작업내용</th>
                    <th className="p-2.5">작업자</th>
                    <th className="p-2.5 text-center">인원</th>
                    <th className="p-2.5 text-center">시간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(detailReport.items || []).map((it) => (
                    <tr key={it.id}>
                      <td className="p-2 font-bold">{it.category}</td>
                      <td className="p-2 text-slate-600 dark:text-slate-300">{it.workContent}</td>
                      <td className="p-2 font-black">{it.names}</td>
                      <td className="p-2 text-center">{it.count}명</td>
                      <td className="p-2 text-center">{it.hours}H</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>인쇄하기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
