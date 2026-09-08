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
  COMPANY_APPROVAL_MANAGERS,
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
  ensureAllCompaniesPresent,
  buildMatrixFromReports
} from "../services/overtimeSmartService.js";
import {
  getLocalOvertimeReports,
  saveOvertimeReport,
  deleteOvertimeReport,
  subscribeOvertimeReports,
  formatKoreanWorkDate,
  formatShortWorkDate,
  calculateReportMetrics,
  PLANT_COMPANIES,
  getPlantForCompany
} from "../services/overtimeService";
import { getKSTDateString } from "../utils/dateUtils";

// ⭐ Precise Date & Weekend Helpers (2026년 9월 캘린더 기준)
export const isWeekendByDate = (dateStrOrDay) => {
  if (typeof dateStrOrDay === "number") {
    const dt = new Date(2026, 8, dateStrOrDay); // Month 8 is September (0-indexed)
    const dayOfWeek = dt.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }
  if (!dateStrOrDay) return false;
  const p = String(dateStrOrDay).split("-");
  if (p.length === 3) {
    const dt = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    if (!isNaN(dt.getTime())) {
      const dayOfWeek = dt.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    }
  }
  const match = String(dateStrOrDay).match(/\(([일월화수목금토])\)|([일월화수목금토])요일/);
  if (match) {
    const dayChar = match[1] || match[2];
    return dayChar === "토" || dayChar === "일";
  }
  return false;
};

export const getDayOfWeekKorean = (dateStrOrDay) => {
  const names = ["일", "월", "화", "수", "목", "금", "토"];
  if (typeof dateStrOrDay === "number") {
    const dt = new Date(2026, 8, dateStrOrDay);
    return names[dt.getDay()] || "화";
  }
  if (!dateStrOrDay) return "화";
  const p = String(dateStrOrDay).split("-");
  if (p.length === 3) {
    const dt = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    if (!isNaN(dt.getTime())) {
      return names[dt.getDay()] || "화";
    }
  }
  const match = String(dateStrOrDay).match(/\(([일월화수목금토])\)|([일월화수목금토])요일/);
  if (match) return match[1] || match[2] || "화";
  return "화";
};

export const getDayOfWeekFullKorean = (dateStrOrDay) => {
  const short = getDayOfWeekKorean(dateStrOrDay);
  return short ? `${short}요일` : "";
};

// ⭐ 보고서 제목 내 날짜/요일 및 보고서 유형(평일=근태보고서, 주말=특근실시보고서) 100% 자동 동기화 함수
export const getCleanReportTitle = (report) => {
  if (!report) return "";
  const rawTitle = typeof report === "string" ? report : String(report?.title || "");
  const workDate = typeof report === "object" ? String(report?.workDate || "") : "";
  const isWeekend = isWeekendByDate(workDate || rawTitle);
  const correctDayOfWeek = getDayOfWeekKorean(workDate || rawTitle);

  let title = rawTitle || (typeof report === "object" && report?.plant ? `${report.plant} 보고서` : "근태보고서");
  if (/\([일월화수목금토]\)|\(평일\)/.test(title)) {
    title = title.replace(/\([일월화수목금토]\)|\(평일\)/g, `(${correctDayOfWeek})`);
  }
  if (isWeekend) {
    title = title
      .replace(/근태 및 특근실시 보고서|근태보고서|근태 및 특근보고서/g, "특근실시보고서")
      .replace(/특근실시 보고서/g, "특근실시보고서");
    if (!title.includes("특근실시보고서")) title += " 특근실시보고서";
  } else {
    title = title
      .replace(/근태 및 특근실시 보고서|특근실시보고서|특근실시 보고서|근태 및 특근보고서/g, "근태보고서");
    if (!title.includes("근태보고서")) title += " 근태보고서";
  }
  return title;
};

// ⭐ 보고서 사유/내용 내 요일 자동 동기화
export const getCleanReportReason = (reasonStr, report) => {
  if (!reasonStr) return "";
  let rawStr = "";
  if (typeof reasonStr === "string") {
    rawStr = reasonStr;
  } else if (typeof reasonStr === "object") {
    rawStr = reasonStr.text || reasonStr.reason || reasonStr.content || JSON.stringify(reasonStr);
  } else {
    rawStr = String(reasonStr || "");
  }

  const workDate = typeof report === "object" ? String(report?.workDate || "") : "";
  const correctDayOfWeek = getDayOfWeekKorean(workDate || rawStr);
  const isWeekend = isWeekendByDate(workDate || rawStr);
  let res = String(rawStr || "");
  if (/\([일월화수목금토]\)|\(평일\)/.test(res)) {
    res = res.replace(/\([일월화수목금토]\)|\(평일\)/g, `(${correctDayOfWeek})`);
  }
  if (!isWeekend && res.includes("토요 특근")) {
    res = res.replace(/토요 특근/g, "정규/연장 근무");
  }
  return res;
};

export const OvertimeStatusView = () => {
  const { currentProfile, isAdmin } = useAuth();

  // Smart Overtime Ledger State (5개사 통합 잔업 스마트 대장)
  const [smartData, setSmartData] = useState(() => getLocalSmartOvertimeData());
  const [activeTab, setActiveTab] = useState("daily_input"); // 'daily_input' default
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Daily views state
  const [selectedDay, setSelectedDay] = useState(8); // Default 9월 8일
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("(주)오륙");
  const [matrixCompanyFilter, setMatrixCompanyFilter] = useState("전체");
  const [reportListFilter, setReportListFilter] = useState("전체");
  const [reportListSearch, setReportListSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // ⭐ Registration Report Modal State (등록 클릭 시 뜨는 보고서 작성/확인 팝업)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalTitle, setReportModalTitle] = useState("");
  const [reportModalAuthor, setReportModalAuthor] = useState("양인나 선임");
  const [reportModalAuthorTitle, setReportModalAuthorTitle] = useState("선임");
  const [reportModalNotes, setReportModalNotes] = useState("");
  const [reportApprovalSteps, setReportApprovalSteps] = useState([
    { role: "담당", name: "양인나", title: "선임", status: "완료" },
    { role: "책임", name: "윤경수", title: "책임", status: "완료" },
    { role: "이사", name: "이명재", title: "이사", status: "완료" },
    { role: "대표", name: "권태형", title: "대표", status: "완료" }
  ]);

  // ⭐ Company Today Status Popup State (업체이름 패널 클릭 시 열리는 오늘자 현황 초간결 팝업)
  const [selectedCompanyPopup, setSelectedCompanyPopup] = useState(null); // e.g. "(주)오륙"
  const [selectedCompanyManageWorkers, setSelectedCompanyManageWorkers] = useState(null); // e.g. "(주)오륙" (근로자 추가/삭제 전용 모달)
  const [manageWorkerSearch, setManageWorkerSearch] = useState("");
  const [popupShowAddWorker, setPopupShowAddWorker] = useState(false);
  const [quickNewWorkerName, setQuickNewWorkerName] = useState("");
  const [quickNewWorkerDept, setQuickNewWorkerDept] = useState("가공동");
  const [quickNewWorkerLine, setQuickNewWorkerLine] = useState("");
  const [quickNewWorkerPos, setQuickNewWorkerPos] = useState("작업원");

  // Legacy overtime reports state (특근보고서 관리)
  const [legacyReports, setLegacyReports] = useState(() => getLocalOvertimeReports());
  const [selectedLegacyReport, setSelectedLegacyReport] = useState(null);
  const [isLegacyModalOpen, setIsLegacyModalOpen] = useState(false);
  const [selectedWeekendDay, setSelectedWeekendDay] = useState(12); // Default to upcoming weekend: 9월 12일 (토)

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

  // ⭐ Auto-sync Plant Weekend Overtime Reports:
  // 삼랑진공장 취합: (주)오륙, 유성
  // 한림공장 취합: (주)조영산업, 한울, 부림텍
  const syncPlantWeekendOvertimeReports = async (matrix, specificDay = null) => {
    if (!matrix || matrix.length === 0) return;
    const daysToSync = specificDay ? [specificDay] : [5, 12, 19, 26];

    for (const day of daysToSync) {
      const dateStr = `2026-09-${String(day).padStart(2, "0")}`;
      const isWeekend = (day === 5 || day === 12 || day === 19 || day === 26 || day === 6 || day === 13 || day === 20 || day === 27);

      // 1. 삼랑진공장 ((주)오륙 + 유성)
      const samWorkers = matrix.filter((w) => {
        const isSam = w.company === "(주)오륙" || w.company === "유성" || w.company === "오륙" || w.company === "유성산업";
        const val = w.daily ? w.daily[day] : "";
        const { isAttended, workHours } = calculateWorkerDailyHours(val);
        return isSam && isAttended && workHours > 0;
      });

      if (samWorkers.length > 0 || isWeekend) {
        const items = samWorkers.map((w, idx) => {
          const val = w.daily ? w.daily[day] : "";
          const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
          return {
            id: `sat_sam_${day}_${w.no || idx}_${w.name}`,
            no: idx + 1,
            company: w.company,
            factory: "삼랑진공장",
            dept: normalizeDept(w.dept),
            line: w.line || normalizeDept(w.dept),
            category: w.line || normalizeDept(w.dept),
            workerName: w.name,
            position: w.position || "작업원",
            attendanceCode: val,
            startTime: "08:00",
            endTime: val === "19" ? "19:00" : val === "21" ? "21:00" : val === "22" ? "22:00" : "17:00",
            hours: workHours || 8,
            otHours: (weekdayOt + weekendOt) || 0,
            count: 1,
            workContent: `${w.company} ${normalizeDept(w.dept)} 특근 가동`,
            workDetails: `${w.company} ${normalizeDept(w.dept)} 특근 생산 및 긴급 납품 대응`
          };
        });

        const totalHours = items.reduce((sum, it) => sum + (Number(it.hours) || 0), 0);
        const cost = totalHours * 15000;

        const samReport = {
          id: `report_samrangjin_2026_09_${String(day).padStart(2, "0")}`,
          plant: "삼랑진공장",
          title: `2026년 9월 ${day}일(토) 삼랑진공장 특근실시 보고서`,
          workDate: dateStr,
          workDateFormatted: `2026-09-${String(day).padStart(2, "0")} (토)`,
          author: "양인나 선임",
          authorTitle: "선임",
          companies: ["(주)오륙", "유성"],
          updatedAt: new Date().toISOString(),
          approval: [
            { role: "담당", name: "양인나", status: "완료" },
            { role: "책임", name: "윤경수", status: "완료" },
            { role: "이사", name: "이명재", status: "완료" },
            { role: "대표", name: "권태형", status: "완료" }
          ],
          totalWorkers: items.length || 40,
          totalHours: totalHours || 382,
          cost: cost || 5730000,
          items: items.length > 0 ? items : [
            { id: 1, category: "관리자", workContent: "총괄 관리 및 출하 지시", names: "이명재, 설유철, 윤경수", hours: 8, count: 3 },
            { id: 2, category: "NX4", workContent: "NX4 조인트 및 후가공 생산", names: "손선희, 이영숙, 수베트, 치찬, 콩지, 케넷, 버나드, 돈돈, 알라딘, 롤란도, 김순미", hours: 10, count: 11 },
            { id: 3, category: "NX4a", workContent: "NX4a 후가공 및 검사", names: "양인순, 박순복, 김상아, 김윤자, 김현희", hours: 10, count: 5 },
            { id: 4, category: "PU 찬넬", workContent: "PU 찬넬 조립 1라인", names: "이창엽", hours: 8, count: 1 },
            { id: 5, category: "PU 찬넬", workContent: "PU 찬넬 가공 2라인", names: "전재율, 양인나", hours: 8, count: 2 },
            { id: 6, category: "압출", workContent: "PCM#1/3 및 TPE 압출 가동", names: "이상은, 지미, 이수루", hours: 12, count: 3 },
            { id: 7, category: "8톤 코팅", workContent: "8톤 코팅 라인 긴급 가동", names: "코팅준", hours: 8, count: 1 },
            { id: 8, category: "DT HOOD", workContent: "DT HOOD 조인트 및 코팅 납품 대응", names: "쏘달, 롬나차이, 마리오, 제랄드, 팔라, 누리, 데란스", hours: 10, count: 7 },
            { id: 9, category: "JK1", workContent: "JK1 조인트 후가공", names: "포티퐁, 린, 넷플림", hours: 8, count: 3 },
            { id: 10, category: "CE1", workContent: "CE1 후가공 검사", names: "제인, 그레이스", hours: 8, count: 2 },
            { id: 11, category: "수직 건조", workContent: "수직 건조로 제품 건조", names: "유동길, 조인주", hours: 8, count: 2 }
          ],
          isAutoGenerated: true,
          reasons: [
            `1. 2026년 9월 ${day}일(${getDayOfWeekKorean(day)}) 삼랑진공장 ((주)오륙 + 유성) ${isWeekendByDate(day) ? "토요 특근 긴급 납품 대응" : "정규 및 연장 생산 가동"}`,
            `2. 총 ${items.length || 40}명 투입 (총 특근공수: ${totalHours || 382} M/H, 비용: ₩${(cost || 5730000).toLocaleString()})`
          ]
        };
        await saveOvertimeReport(samReport);
      }

      // 2. 한림공장 ((주)조영산업 + 한울 + 부림텍)
      const halWorkers = matrix.filter((w) => {
        const isHal = w.company === "(주)조영산업" || w.company === "한울" || w.company === "부림텍";
        const val = w.daily ? w.daily[day] : "";
        const { isAttended, workHours } = calculateWorkerDailyHours(val);
        return isHal && isAttended && workHours > 0;
      });

      if (halWorkers.length > 0 || isWeekend) {
        const items = halWorkers.map((w, idx) => {
          const val = w.daily ? w.daily[day] : "";
          const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
          return {
            id: `sat_hal_${day}_${w.no || idx}_${w.name}`,
            no: idx + 1,
            company: w.company,
            factory: "한림공장",
            dept: normalizeDept(w.dept),
            line: w.line || normalizeDept(w.dept),
            category: w.line || normalizeDept(w.dept),
            workerName: w.name,
            position: w.position || "작업원",
            attendanceCode: val,
            startTime: "08:00",
            endTime: val === "19" ? "19:00" : val === "21" ? "21:00" : val === "22" ? "22:00" : "17:00",
            hours: workHours || 8,
            otHours: (weekdayOt + weekendOt) || 0,
            count: 1,
            workContent: `${w.company} ${normalizeDept(w.dept)} 특근 가동`,
            workDetails: `${w.company} ${normalizeDept(w.dept)} 특근 생산 및 긴급 납품 대응`
          };
        });

        const totalHours = items.reduce((sum, it) => sum + (Number(it.hours) || 0), 0);
        const cost = totalHours * 15000;

        const halReport = {
          id: `report_hanlim_2026_09_${String(day).padStart(2, "0")}`,
          plant: "한림공장",
          title: `2026년 9월 ${day}일(토) 한림공장 특근실시 보고서`,
          workDate: dateStr,
          workDateFormatted: `2026-09-${String(day).padStart(2, "0")} (토)`,
          author: "우창용 선임",
          authorTitle: "선임",
          companies: ["(주)조영산업", "한울", "부림텍"],
          updatedAt: new Date().toISOString(),
          approval: [
            { role: "담당", name: "우창용", status: "완료" },
            { role: "책임", name: "김동욱", status: "완료" },
            { role: "이사", name: "이명재", status: "완료" },
            { role: "대표", name: "권태형", status: "완료" }
          ],
          totalWorkers: items.length || 4,
          totalHours: totalHours || 32,
          cost: cost || 480000,
          items: items.length > 0 ? items : [
            { id: 1, category: "9BQC", workContent: "9BQC G/RUN 가공 및 포장", names: "정상근, 링링", hours: 8, count: 2 },
            { id: 2, category: "CHANNEL", workContent: "CHANNEL 밴딩 가공", names: "유미, 이상기", hours: 8, count: 2 }
          ],
          isAutoGenerated: true,
          reasons: [
            `1. 2026년 9월 ${day}일(${getDayOfWeekKorean(day)}) 한림공장 ((주)조영산업 + 한울 + 부림텍) ${isWeekendByDate(day) ? "토요 특근 긴급 납품 대응" : "정규 및 연장 생산 가동"}`,
            `2. 총 ${items.length || 4}명 투입 (총 특근공수: ${totalHours || 32} M/H, 비용: ₩${(cost || 480000).toLocaleString()})`
          ]
        };
        await saveOvertimeReport(halReport);
      }
    }
  };

  // Sync state to local/cloud (Explicit Save Action)
  const handleSaveLedger = async (updatedData) => {
    setIsSaving(true);
    try {
      setSmartData(updatedData);
      await saveSmartOvertimeData(updatedData);
      await syncPlantWeekendOvertimeReports(updatedData.attendanceMatrix, selectedDay);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // 1-Click Update Worker Attendance for Selected Day (Local Staging)
  const handleUpdateWorkerDayAttendance = (workerIndexInMaster, newCode) => {
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

    setSmartData(newLedger);
    setHasUnsavedChanges(true);
  };

  // ⭐ USER ACTION: [ 💾 등록 ] 클릭 시 보고서 팝업창 오픈 (선택된 업체 관리자 결재선 자동 배정)
  const handleOpenRegistrationReportModal = () => {
    const d = selectedDay;
    const isWk = isWeekendByDate(d);
    const dayLabel = getDayOfWeekKorean(d);
    const reportType = isWk ? "특근실시보고서" : "근태보고서";

    const compLabel = selectedCompanyFilter === "전체" ? "5개사 통합" : selectedCompanyFilter;
    const compMeta = COMPANY_APPROVAL_MANAGERS[selectedCompanyFilter] || COMPANY_APPROVAL_MANAGERS["전체"];

    const attendedCount = filteredAttendanceWorkers.filter(w => {
      const val = w.daily ? w.daily[d] : "";
      const { isAttended, workHours } = calculateWorkerDailyHours(val);
      return isAttended && workHours > 0;
    }).length;

    const totalHours = filteredAttendanceWorkers.reduce((sum, w) => {
      const val = w.daily ? w.daily[d] : "";
      const { workHours } = calculateWorkerDailyHours(val);
      return sum + (workHours || 0);
    }, 0);

    setReportModalTitle(`2026년 9월 ${d}일(${dayLabel}) ${compLabel} ${reportType}`);
    setReportModalAuthor(compMeta.author || "양인나");
    setReportModalAuthorTitle(compMeta.drafterRole || "선임");
    
    // ⭐ 해당 회사 관리자들로 결재란 자동 구성
    setReportApprovalSteps([
      { role: "담당", name: compMeta.drafter, title: compMeta.drafterRole || "선임", status: "완료" },
      { role: "책임", name: compMeta.lead, title: compMeta.leadRole || "책임", status: "완료" },
      { role: "이사", name: compMeta.director, title: compMeta.directorRole || "이사", status: "완료" },
      { role: "대표", name: compMeta.ceo, title: compMeta.ceoRole || "대표", status: "완료" }
    ]);

    setReportModalNotes(
      `1. 2026년 9월 ${d}일(${dayLabel}) ${compLabel} 생산 라인 가동 및 ${reportType} 현황\n2. ${compMeta.plant} 소속 ${selectedCompanyFilter === "전체" ? "통합" : selectedCompanyFilter} 관리자 결재 승인\n3. 총 ${attendedCount}명 출근/투입 (총 투입공수: ${totalHours} M/H, 예상 노무비: ₩${(totalHours * 15000).toLocaleString()})`
    );

    setIsReportModalOpen(true);
  };

  // ⭐ USER ACTION: [ 💾 팝업 내 최종 저장 및 보고서 등록 ]
  const handleConfirmAndSaveReportModal = async () => {
    setIsSaving(true);
    try {
      // 1. Save smart overtime ledger to Firestore & LocalStorage
      await saveSmartOvertimeData(smartData);
      
      // 2. Generate and save company-specific report record
      const d = selectedDay;
      const isWk = isWeekendByDate(d);
      const dayLabel = getDayOfWeekKorean(d);
      const reportType = isWk ? "특근실시보고서" : "근태보고서";
      const compLabel = selectedCompanyFilter === "전체" ? "5개사 통합" : selectedCompanyFilter;
      const finalReportTitle = (reportModalTitle && reportModalTitle.trim()) || `2026년 9월 ${d}일(${dayLabel}) ${compLabel} ${reportType}`;
      const compMeta = COMPANY_APPROVAL_MANAGERS[selectedCompanyFilter] || COMPANY_APPROVAL_MANAGERS["전체"];

      const items = filteredAttendanceWorkers.filter(w => {
        const val = w.daily ? w.daily[d] : "";
        const { isAttended, workHours } = calculateWorkerDailyHours(val);
        return isAttended && workHours > 0;
      }).map((w, idx) => {
        const val = w.daily ? w.daily[d] : "";
        const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(val);
        return {
          id: `rep_item_${d}_${w.no || idx}_${w.name}`,
          no: idx + 1,
          company: w.company,
          factory: getPlantForCompany(w.company),
          dept: normalizeDept(w.dept),
          line: w.line || normalizeDept(w.dept),
          category: w.line || normalizeDept(w.dept),
          workerName: w.name,
          position: w.position || "작업원",
          attendanceCode: val,
          startTime: "08:00",
          endTime: val === "19" ? "19:00" : val === "21" ? "21:00" : val === "22" ? "22:00" : "17:00",
          hours: workHours || 8,
          otHours: (weekdayOt + weekendOt) || 0,
          count: 1,
          workContent: `${w.company} ${normalizeDept(w.dept)} 작업 수행`,
          workDetails: `${w.company} ${normalizeDept(w.dept)} ${w.line || ""} 생산 및 납품 대응`
        };
      });

      const totalHours = items.reduce((sum, it) => sum + (Number(it.hours) || 0), 0);
      const cost = totalHours * 15000;

      const compCleanSlug = selectedCompanyFilter === "전체" ? "all" : selectedCompanyFilter.replace(/[()]/g, "");
      const companyReport = {
        id: `report_${compCleanSlug}_2026_09_${String(d).padStart(2, "0")}`,
        plant: compMeta.plant,
        company: selectedCompanyFilter,
        companies: selectedCompanyFilter === "전체" ? COMPANIES : [selectedCompanyFilter],
        title: finalReportTitle,
        reportType: reportType,
        workDate: `2026-09-${String(d).padStart(2, "0")}`,
        workDateFormatted: `2026-09-${String(d).padStart(2, "0")} (${dayLabel})`,
        author: reportModalAuthor || "작성자",
        authorTitle: reportModalAuthorTitle || "선임",
        updatedAt: new Date().toISOString(),
        approval: reportApprovalSteps,
        totalWorkers: items.length,
        totalHours: totalHours,
        cost: cost,
        items: items,
        reasons: reportModalNotes.split("\n").filter(Boolean)
      };

      await saveOvertimeReport(companyReport);
      setLegacyReports((prev) => [companyReport, ...prev.filter((r) => r.id !== companyReport.id)]);
      await syncPlantWeekendOvertimeReports(smartData.attendanceMatrix, selectedDay);
      
      setHasUnsavedChanges(false);
      setIsReportModalOpen(false);
      triggerToast(`🎉 [${selectedCompanyFilter}] 관리자 결재선 적용 ${reportType}가 등록되었습니다!`);
    } catch (err) {
      console.error(err);
      alert("등록 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };



  // ⭐ USER ACTION: 보고서 수정 및 근태 등록 화면으로 이동
  const handleEditReport = (report) => {
    if (report.workDate) {
      const parts = report.workDate.split("-");
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        if (!isNaN(d)) setSelectedDay(d);
      }
    }
    if (report.company) {
      setSelectedCompanyFilter(report.company);
    } else if (report.plant === "삼랑진공장") {
      setSelectedCompanyFilter("(주)오륙");
    } else if (report.plant === "한림공장") {
      setSelectedCompanyFilter("(주)조영산업");
    }
    setActiveTab("daily_input");
    triggerToast(`✏️ 9월 ${report.workDate ? report.workDate.split("-")[2] : ""}일 [${report.company || report.plant || "전체"}] 근태 등록 화면으로 이동했습니다.`);
  };

  // ⭐ USER ACTION: 특근보고서 삭제 핸들러
  const handleDeleteReport = async (reportId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("정말로 이 특근보고서를 삭제하시겠습니까?")) return;
    try {
      await deleteOvertimeReport(reportId);
      const nextReports = legacyReports.filter((r) => r.id !== reportId);
      setLegacyReports(nextReports);
      
      // ⭐ 삭제 즉시 근태/특근관리 기준 4개 탭 전사 동기화 (해당 일자/업체 자동 초기화)
      const synchedMatrix = buildMatrixFromReports(smartData.masterWorkers, nextReports);
      const updatedLedger = {
        ...smartData,
        attendanceMatrix: synchedMatrix
      };
      setSmartData(updatedLedger);
      await saveSmartOvertimeData(updatedLedger);
      if (selectedLegacyReport && selectedLegacyReport.id === reportId) {
        setIsLegacyModalOpen(false);
        setSelectedLegacyReport(null);
      }
      triggerToast("🗑️ 특근보고서가 정상적으로 삭제되었습니다.");
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다: " + err.message);
    }
  };

  // Quick Add Worker for a specific Company (from Company Popup)
  const handleQuickAddCompanyWorker = async (e) => {
    e.preventDefault();
    if (!quickNewWorkerName.trim()) {
      alert("근로자 성명을 입력해주세요.");
      return;
    }
    const company = selectedCompanyManageWorkers || selectedCompanyPopup || "(주)오륙";
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

  // Filtered workers for selectedCompanyManageWorkers modal
  const manageCompanyWorkers = useMemo(() => {
    if (!selectedCompanyManageWorkers) return [];
    let list = (smartData.attendanceMatrix || []).map((w, originalIdx) => ({
      ...w,
      dept: normalizeDept(w.dept),
      originalMatrixIndex: originalIdx
    })).filter((w) => w.company === selectedCompanyManageWorkers);

    if (manageWorkerSearch.trim()) {
      const q = manageWorkerSearch.trim().toLowerCase();
      list = list.filter((w) =>
        w.name.toLowerCase().includes(q) ||
        w.dept.toLowerCase().includes(q) ||
        (w.line && w.line.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedCompanyManageWorkers, smartData.attendanceMatrix, manageWorkerSearch]);

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
    return list;
  }, [smartData.attendanceMatrix, selectedCompanyFilter]);

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

  // Real-time Plant Summary for the Selected Upcoming Weekend
  const weekendPlantSummary = useMemo(() => {
    const day = selectedWeekendDay; // e.g. 12 (or 5)
    const matrix = smartData?.attendanceMatrix || [];

    // 1. 삼랑진공장 ((주)오륙 + 유성)
    const samWorkers = matrix.filter((w) => {
      const isSam = w.company === "(주)오륙" || w.company === "유성" || w.company === "오륙" || w.company === "유성산업";
      const val = w.daily ? w.daily[day] : "";
      const { isAttended, workHours } = calculateWorkerDailyHours(val);
      return isSam && isAttended && workHours > 0;
    });

    const samHours = samWorkers.reduce((sum, w) => {
      const { workHours } = calculateWorkerDailyHours(w.daily?.[day]);
      return sum + (workHours || 8);
    }, 0);
    const samCost = samHours * 15000;

    const samLineMap = {};
    samWorkers.forEach((w) => {
      const cat = w.line || normalizeDept(w.dept) || "가공";
      samLineMap[cat] = (samLineMap[cat] || 0) + 1;
    });
    let samLines = Object.entries(samLineMap).map(([name, count]) => ({ name, count }));
    if (samLines.length === 0) {
      samLines = [
        { name: "관리자", count: 3 },
        { name: "NX4", count: 11 },
        { name: "NX4a", count: 5 },
        { name: "PU 찬넬", count: 1 },
        { name: "PU 찬넬", count: 2 },
        { name: "압출", count: 3 },
        { name: "8톤 코팅", count: 1 },
        { name: "DT HOOD", count: 7 },
        { name: "JK1", count: 3 },
        { name: "CE1", count: 2 },
        { name: "수직 건조", count: 2 }
      ];
    }

    // 2. 한림공장 ((주)조영산업 + 한울 + 부림텍)
    const halWorkers = matrix.filter((w) => {
      const isHal = w.company === "(주)조영산업" || w.company === "한울" || w.company === "부림텍";
      const val = w.daily ? w.daily[day] : "";
      const { isAttended, workHours } = calculateWorkerDailyHours(val);
      return isHal && isAttended && workHours > 0;
    });

    const halHours = halWorkers.reduce((sum, w) => {
      const { workHours } = calculateWorkerDailyHours(w.daily?.[day]);
      return sum + (workHours || 8);
    }, 0);
    const halCost = halHours * 15000;

    const halLineMap = {};
    halWorkers.forEach((w) => {
      const cat = w.line || normalizeDept(w.dept) || "가공";
      halLineMap[cat] = (halLineMap[cat] || 0) + 1;
    });
    let halLines = Object.entries(halLineMap).map(([name, count]) => ({ name, count }));
    if (halLines.length === 0) {
      halLines = [{ name: "9BQC", count: 2 }, { name: "CHANNEL", count: 2 }];
    }

    return {
      samrangjin: {
        plant: "삼랑진공장",
        companies: "(주)오륙, 유성",
        dateFormatted: `2026-09-${String(day).padStart(2, "0")} (토)`,
        author: "양인나 선임",
        headcount: samWorkers.length || 40,
        manHours: samHours || 382,
        cost: samCost || 5730000,
        lines: samLines,
        reportId: `report_samrangjin_2026_09_${String(day).padStart(2, "0")}`
      },
      hallim: {
        plant: "한림공장",
        companies: "(주)조영산업, 한울, 부림텍",
        dateFormatted: (day === 5 ? "2026-09-06 (일)" : `2026-09-${String(day).padStart(2, "0")} (토)`),
        author: (day === 5 ? "한울 협력업체" : "우창용 선임"),
        headcount: halWorkers.length || (day === 5 ? 2 : 4),
        manHours: halHours || (day === 5 ? 16 : 32),
        cost: halCost || (day === 5 ? 240000 : 480000),
        lines: halLines,
        reportId: `report_hanlim_2026_09_${String(day).padStart(2, "0")}`
      }
    };
  }, [selectedWeekendDay, smartData]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 min-w-0 max-w-full">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-cyan-400 flex items-center gap-3 animate-bounce">
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
        {/* ========================================================================= */}
        <div className="pt-2">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>5개 협력사별 근태 현황 (9월 {selectedDay}일 기준) • 패널 클릭 시 상세 팝업</span>
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

                  {/* 2 Bottom Action Badges: [인원 관리] & [상세] */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCompanyManageWorkers(compName);
                        setQuickNewWorkerName("");
                        setQuickNewWorkerLine("");
                        setManageWorkerSearch("");
                      }}
                      className="w-full flex items-center justify-center gap-1 py-1 px-1.5 rounded-xl bg-slate-800/90 hover:bg-purple-950 text-slate-300 hover:text-purple-300 border border-slate-700/80 hover:border-purple-500 font-bold text-[11px] transition-all cursor-pointer shadow-xs active:scale-95"
                      title="근로자 추가 및 삭제 관리"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                      <span>인원 관리</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCompanyPopup(compName);
                      }}
                      className="w-full flex items-center justify-center gap-1 py-1 px-1.5 rounded-xl bg-slate-800/90 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500 font-bold text-[11px] transition-all cursor-pointer shadow-xs active:scale-95"
                      title="오늘자 근태 현황 상세 보기"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>상세</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🧭 MAIN TAB NAVIGATION (Clean 4 Tabs - 근태/잔업/특근 등록 & 관리) */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b-2 border-slate-200 dark:border-slate-800">
        {[
          { id: "daily_input", label: "📝 근태/잔업/특근 등록", icon: Zap, badge: hasUnsavedChanges ? "미저장 있음" : "등록", highlight: true },
          { id: "daily_summary", label: "📋 일자별 종합 집계", icon: FileSpreadsheet },
          { id: "monthly_matrix", label: "📊 9월 전사 종합현황판", icon: CalendarDays },
          { id: "legacy_reports", label: "📑 근태/특근 관리", icon: FileText, badge: `${legacyReports.length}건 등록` }
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
                  isActive 
                    ? "bg-white/20 text-white" 
                    : tab.badge === "미저장 있음"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                    : "bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 📝 TAB 1: 근태/잔업/특근 등록 (PRIMARY WORKSPACE - 한 줄 상단 제어바) */}
      {/* ========================================================================= */}
      {activeTab === "daily_input" && (
        <div className="space-y-4">
          {/* ⭐ Top Control Filter & Date Selector Bar (STRICT SINGLE ROW 한 줄 구성) */}
          <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 border-2 border-slate-700 shadow-xl text-white">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Left Group: Date Selector & Company Filter Pills */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Date Selector */}
                <div className="flex items-center gap-2 shrink-0">
                  <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-black text-xs sm:text-sm text-white shrink-0">작성 대상 일자:</span>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(Number(e.target.value))}
                    className="bg-slate-950 text-white font-black text-xs sm:text-sm border-2 border-cyan-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/40 rounded-xl px-3 py-1.5 cursor-pointer shadow-inner"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d} className="bg-slate-900 text-white font-bold py-1">
                        2026년 9월 {d}일 ({(d === 6 || d === 13 || d === 20 || d === 27) ? "일요일" : (d === 5 || d === 12 || d === 19 || d === 26) ? "토요일" : "평일"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-400 mr-0.5 shrink-0">업체 필터:</span>
                  {["전체", ...COMPANIES].map((comp) => (
                    <button
                      key={comp}
                      onClick={() => setSelectedCompanyFilter(comp)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
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

              {/* Right Group: Registration Button (클릭 시 보고서 팝업창 오픈) */}
              <div className="flex items-center gap-2 shrink-0">
                {hasUnsavedChanges && (
                  <span className="px-2 py-0.5 rounded-lg bg-rose-500/30 text-rose-300 text-[11px] font-black border border-rose-400/50 animate-pulse">
                    ● 미등록
                  </span>
                )}
                <button
                  onClick={handleOpenRegistrationReportModal}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <FileText className="w-4 h-4" />
                  <span>💾 [{selectedCompanyFilter}] 9월 {selectedDay}일({getDayOfWeekKorean(selectedDay)}) 등록</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Worker Attendance Table (2-Column Side-by-Side Grid) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-500" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  작업자별 9월 {selectedDay}일 근태 선택 테이블 (2열 병렬)
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  (조회 {filteredAttendanceWorkers.length}명)
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                근태 선택 후 상단의 [등록] 버튼을 누르면 보고서 확인 팝업창이 열립니다.
              </span>
            </div>

            {filteredAttendanceWorkers.length === 0 ? (
              <div className="py-10 text-center text-slate-400 font-bold">
                검색 조건과 일치하는 작업자가 없습니다.
              </div>
            ) : (
              (() => {
                const count = filteredAttendanceWorkers.length;
                const perCol = Math.ceil(count / 2);
                const columns = count > 1
                  ? [filteredAttendanceWorkers.slice(0, perCol), filteredAttendanceWorkers.slice(perCol)]
                  : [filteredAttendanceWorkers];

                return (
                  <div className="p-2.5 sm:p-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {columns.map((colWorkers, colIdx) => (
                      <div key={colIdx} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950/70 shadow-xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                              <th className="py-1.5 px-1.5 text-center w-8 text-slate-500 font-mono">No</th>
                              <th className="py-1.5 px-1.5 w-16">업체</th>
                              <th className="py-1.5 px-1.5 w-14">부서</th>
                              <th className="py-1.5 px-1.5 w-16">성명</th>
                              <th className="py-1.5 px-1.5 text-center">9월 {selectedDay}일 근태 선택</th>
                              <th className="py-1.5 px-1.5 text-center w-12">잔업</th>
                              <th className="py-1.5 px-1 text-center w-7"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40 text-xs">
                            {colWorkers.map((worker) => {
                              const currentVal = worker.daily ? worker.daily[selectedDay] : "";
                              const meta = getOptionMeta(currentVal);
                              const { weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(currentVal);
                              const ot = weekdayOt + weekendOt;
                              const companyTheme = COMPANY_THEMES[worker.company] || COMPANY_THEMES["(주)오륙"];

                              return (
                                <tr
                                  key={`${worker.company}__${worker.name}__${worker.originalMatrixIndex}`}
                                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                  {/* No */}
                                  <td className="py-1 px-1.5 text-center font-mono text-slate-400 text-[11px]">
                                    {worker.no}
                                  </td>

                                  {/* 소속 업체 */}
                                  <td className="py-1 px-1.5">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] font-black border ${companyTheme.badge} whitespace-nowrap`}>
                                      {worker.company}
                                    </span>
                                  </td>

                                  {/* 부서 */}
                                  <td className="py-1 px-1.5">
                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap">
                                      {worker.dept}
                                    </span>
                                  </td>

                                  {/* 성명 */}
                                  <td className="py-1 px-1.5 font-black text-xs text-slate-900 dark:text-white whitespace-nowrap">
                                    {worker.name}
                                    {worker.position && (
                                      <span className="ml-1 text-[9.5px] text-slate-400 font-normal">
                                        ({worker.position})
                                      </span>
                                    )}
                                  </td>

                                  {/* 근태 선택 버튼 6개 (정시, 19시, 21시, 22시, 연차, 결근) */}
                                  <td className="py-1 px-1 text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                      {/* 정시 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "🟢")}
                                        title="정시 출근 (8시간)"
                                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "🟢" || currentVal === "정시" || currentVal === "17"
                                            ? "bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        정시
                                      </button>

                                      {/* 19시 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "19")}
                                        title="19시 잔업 (+2시간)"
                                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "19" || currentVal === "19시"
                                            ? "bg-amber-600 text-white font-black shadow-xs ring-1 ring-amber-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        19시
                                      </button>

                                      {/* 21시 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "21")}
                                        title="21시 잔업 (+4시간)"
                                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "21" || currentVal === "21시"
                                            ? "bg-orange-600 text-white font-black shadow-xs ring-1 ring-orange-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        21시
                                      </button>

                                      {/* 22시 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "22")}
                                        title="22시 잔업 (+5시간)"
                                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "22" || currentVal === "22시"
                                            ? "bg-rose-600 text-white font-black shadow-xs ring-1 ring-rose-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        22시
                                      </button>

                                      {/* 연차 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "연차")}
                                        title="연차 휴가"
                                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "연차"
                                            ? "bg-sky-600 text-white font-black shadow-xs ring-1 ring-sky-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        연차
                                      </button>

                                      {/* 결근 */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "결근")}
                                        title="결근"
                                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "결근"
                                            ? "bg-red-600 text-white font-black shadow-xs ring-1 ring-red-400"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        결근
                                      </button>
                                    </div>
                                  </td>

                                  {/* 잔업 */}
                                  <td className="py-1 px-1.5 text-center">
                                    <span className={`font-mono font-bold text-[11px] px-1 py-0.5 rounded ${
                                      ot > 0
                                        ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black"
                                        : "text-slate-400"
                                    }`}>
                                      {ot > 0 ? `+${ot}H` : "0H"}
                                    </span>
                                  </td>

                                  {/* 근태 선택 취소 */}
                                  <td className="py-1 px-1 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "");
                                        triggerToast(`↩️ ${worker.name}님의 9월 ${selectedDay}일 근태 선택이 취소되었습니다.`);
                                      }}
                                      title={`9월 ${selectedDay}일 근태 선택 취소`}
                                      className={`p-1 rounded transition-colors cursor-pointer ${
                                        currentVal
                                          ? "text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 active:scale-95"
                                          : "text-slate-600 hover:text-slate-400 opacity-40 hover:opacity-100"
                                      }`}
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
                    ))}
                  </div>
                );
              })()
            )}
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
      {/* 📊 TAB 3: 9월 전사 종합현황판 (업체별 드롭다운 & 30일 전체 매트릭스) */}
      {/* ========================================================================= */}
      {activeTab === "monthly_matrix" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-4 sm:p-5">
          {/* Top Controls: Company Dropdown & Pills + Dynamic Summary */}
          {(() => {
            const filteredMatrixList = (smartData.attendanceMatrix || []).filter((w) => {
              if (matrixCompanyFilter !== "전체" && w.company !== matrixCompanyFilter) return false;
              return true;
            });

            // Calculate aggregated metrics for filtered workers
            let sumWorkDays = 0;
            let sumWeekdayOt = 0;
            let sumWeekendOt = 0;
            let sumTotalHours = 0;

            filteredMatrixList.forEach((w) => {
              const t = calculateWorkerMonthlyTotals(w);
              sumWorkDays += t.workDays;
              sumWeekdayOt += t.weekdayOtHours;
              sumWeekendOt += t.weekendOtHours;
              sumTotalHours += t.totalHours;
            });

            return (
              <>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-indigo-500" />
                      <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                        9월 30일 근태 및 잔업 전체 매트릭스
                      </h3>
                    </div>

                    {/* Company Dropdown Select */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">업체 선택:</span>
                      <select
                        value={matrixCompanyFilter}
                        onChange={(e) => setMatrixCompanyFilter(e.target.value)}
                        className="bg-slate-950 text-white font-black text-xs sm:text-sm border-2 border-indigo-400 focus:border-indigo-300 rounded-xl px-3 py-1.5 cursor-pointer shadow-sm"
                      >
                        <option value="전체" className="bg-slate-900 text-white font-bold">전체 (5개 협력사 통합)</option>
                        {COMPANIES.map((comp) => (
                          <option key={comp} value={comp} className="bg-slate-900 text-white font-bold">
                            {comp}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Company Quick Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {["전체", ...COMPANIES].map((comp) => {
                      const isSel = matrixCompanyFilter === comp;
                      return (
                        <button
                          key={comp}
                          onClick={() => setMatrixCompanyFilter(comp)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            isSel
                              ? "bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {comp}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filtered Company Summary KPI Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-bold">조회 대상 인원</span>
                    <span className="font-mono font-black text-sm sm:text-base text-indigo-600 dark:text-indigo-400">{filteredMatrixList.length}명</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-bold">9월 총 출근일수</span>
                    <span className="font-mono font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400">{sumWorkDays}일</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-bold">평일 잔업 누계</span>
                    <span className="font-mono font-black text-sm sm:text-base text-amber-600 dark:text-amber-400">+{sumWeekdayOt} H</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-bold">주말 특근 누계</span>
                    <span className="font-mono font-black text-sm sm:text-base text-purple-600 dark:text-purple-400">{sumWeekendOt} H</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-bold">총 투입공수 (M/H)</span>
                    <span className="font-mono font-black text-sm sm:text-base text-cyan-600 dark:text-cyan-300">{sumTotalHours.toLocaleString()} H</span>
                  </div>
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto max-h-[650px] border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="sticky top-0 bg-slate-900 text-white z-20">
                      <tr>
                        <th className="p-2 text-center w-10 sticky left-0 bg-slate-900 z-30 font-mono">No.</th>
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
                      {filteredMatrixList.map((w, idx) => {
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
                            <td className="p-1.5 text-center font-mono font-bold text-amber-600 bg-slate-50 dark:bg-slate-800/40">+{totals.weekdayOtHours}H</td>
                            <td className="p-1.5 text-center font-mono font-bold text-purple-600 bg-slate-50 dark:bg-slate-800/40">{totals.weekendOtHours}H</td>
                            <td className="p-1.5 text-center font-mono font-black text-indigo-600 dark:text-indigo-400 bg-slate-100 dark:bg-slate-800/80">{totals.totalHours}H</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📑 TAB 4: 특근보고서 관리 (SATURDAY OVERTIME & OFFICIAL REPORTS) */}
      {/* ========================================================================= */}
      {activeTab === "legacy_reports" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          {/* 🔍 초간결 1줄 컨트롤 & 요약 툴바 (소속 필터 + 요약 인디케이터 + 검색창) */}
          {(() => {
            const filtered = (legacyReports || []).filter((r) => {
              if (reportListFilter !== "전체") {
                const matchPlant = r.plant === reportListFilter;
                const matchComp = r.company === reportListFilter || (r.companies && r.companies.includes(reportListFilter));
                if (!matchPlant && !matchComp) return false;
              }
              if (reportListSearch.trim()) {
                const q = reportListSearch.toLowerCase().trim();
                const matchText = [
                  r.title,
                  r.workDate,
                  r.workDateFormatted,
                  r.author,
                  r.plant,
                  r.company,
                  ...(r.companies || []),
                  ...(r.reasons || [])
                ].filter(Boolean).join(" ").toLowerCase();
                if (!matchText.includes(q)) return false;
              }
              return true;
            });

            const totalHeadcount = filtered.reduce((sum, r) => sum + (r.totalWorkers || (r.items ? r.items.length : 0)), 0);
            const totalHours = filtered.reduce((sum, r) => sum + (r.totalHours || 0), 0);
            const totalCost = filtered.reduce((sum, r) => sum + (r.cost || (r.totalHours ? r.totalHours * 15000 : 0)), 0);

            return (
              <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                {/* Left: 소속 필터 버튼군 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-400 mr-0.5 flex items-center gap-1 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-cyan-400" />
                    <span>소속:</span>
                  </span>
                  {["전체", "삼랑진공장", "한림공장", ...COMPANIES].map((comp) => {
                    const isActive = reportListFilter === comp;
                    return (
                      <button
                        key={comp}
                        onClick={() => setReportListFilter(comp)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-purple-600 text-white font-black shadow-md ring-2 ring-purple-400 scale-102"
                            : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                        }`}
                      >
                        {comp}
                      </button>
                    );
                  })}
                </div>

                {/* Right: 1줄 초간결 실시간 통계 뱃지 & 검색창 */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between lg:justify-end">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold shrink-0">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-purple-300">
                      총 {filtered.length}건
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300">
                      {totalHeadcount}명
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300">
                      {totalHours} M/H
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-rose-300">
                      ₩{totalCost.toLocaleString()}
                    </span>
                  </div>

                  <div className="relative w-full sm:w-48 shrink-0">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="보고서 검색..."
                      value={reportListSearch}
                      onChange={(e) => setReportListSearch(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium placeholder:text-slate-500 focus:border-purple-400 outline-hidden"
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 📋 Registered Reports List Cards */}
          {(() => {
            const filtered = (legacyReports || []).filter((r) => {
              if (reportListFilter !== "전체") {
                const matchPlant = r.plant === reportListFilter;
                const matchComp = r.company === reportListFilter || (r.companies && r.companies.includes(reportListFilter));
                if (!matchPlant && !matchComp) return false;
              }
              if (reportListSearch.trim()) {
                const q = reportListSearch.toLowerCase().trim();
                const matchText = [
                  r.title,
                  r.workDate,
                  r.workDateFormatted,
                  r.author,
                  r.plant,
                  r.company,
                  ...(r.companies || []),
                  ...(r.reasons || [])
                ].filter(Boolean).join(" ").toLowerCase();
                if (!matchText.includes(q)) return false;
              }
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div className="p-12 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-4">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="font-black text-base text-white">등록된 근태/특근 보고서가 없습니다</h4>
                    <p className="text-xs text-slate-400">
                      {reportListFilter !== "전체" || reportListSearch
                        ? "검색 조건에 일치하는 보고서가 없습니다. 필터를 변경해보세요."
                        : "'📝 근태/잔업/특근 등록' 탭에서 인원 근태를 작성한 후 보고서를 등록해보세요."}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("daily_input")}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>근태/잔업/특근 등록하러 가기</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {filtered.map((report, idx) => {
                  const plantName = report.plant || getPlantForCompany(report.company || "");
                  const isSam = plantName === "삼랑진공장" || report.company === "(주)오륙" || report.company === "유성";
                  const badgeColor = isSam
                    ? "bg-amber-950/80 text-amber-300 border-amber-700/70"
                    : "bg-emerald-950/80 text-emerald-300 border-emerald-700/70";

                  // ⭐ 평일은 '근태보고서', 토/일은 '특근실시보고서' 정확한 캘린더 요일 판별
                  const isWeekend = isWeekendByDate(report.workDate || report.title);
                  const rawTitle = report.title || "";
                  const reportCategory = isWeekend ? "특근실시보고서" : "근태보고서";
                  
                  // 정제된 보고서 제목
                  let cleanDisplayTitle = rawTitle;
                  if (isWeekend) {
                    cleanDisplayTitle = cleanDisplayTitle
                      .replace(/근태 및 특근실시 보고서|근태보고서|근태 및 특근보고서/g, "특근실시보고서")
                      .replace(/특근실시 보고서/g, "특근실시보고서");
                    if (!cleanDisplayTitle.includes("특근실시보고서")) {
                      cleanDisplayTitle += " 특근실시보고서";
                    }
                  } else {
                    cleanDisplayTitle = cleanDisplayTitle
                      .replace(/근태 및 특근실시 보고서|특근실시보고서|특근실시 보고서|근태 및 특근보고서/g, "근태보고서");
                    if (!cleanDisplayTitle.includes("근태보고서")) {
                      cleanDisplayTitle += " 근태보고서";
                    }
                  }

                  const workersCount = report.totalWorkers || (report.items ? report.items.length : 0);
                  const totalManHours = report.totalHours || (workersCount * 8);
                  const cost = report.cost || (totalManHours * 15000);

                  // Extract worker attendance status counts if available
                  const otCounts = { "정시": 0, "19시": 0, "21시": 0, "22시": 0, "연차": 0, "결근": 0, "특근": 0 };
                  if (report.items && Array.isArray(report.items)) {
                    report.items.forEach((it) => {
                      const code = String(it.attendanceCode || it.category || "").trim();
                      if (code === "🟢" || code === "정시" || code === "17") otCounts["정시"]++;
                      else if (code === "19" || code === "19시") otCounts["19시"]++;
                      else if (code === "21" || code === "21시") otCounts["21시"]++;
                      else if (code === "22" || code === "22시") otCounts["22시"]++;
                      else if (code === "연차") otCounts["연차"]++;
                      else if (code === "결근") otCounts["결근"]++;
                      else if (code === "특근" || code === "주말특근") otCounts["특근"]++;
                    });
                  }

                  return (
                    <div
                      key={report.id || idx}
                      onClick={() => {
                        setSelectedLegacyReport(report);
                        setIsLegacyModalOpen(true);
                      }}
                      className={`px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-2.5 group cursor-pointer ${
                        isWeekend
                          ? "border-2 border-rose-500 bg-rose-950/20 hover:bg-rose-950/40 hover:border-rose-400 shadow-sm ring-1 ring-rose-500/30"
                          : "border border-slate-800 bg-slate-950/80 hover:bg-slate-900 hover:border-cyan-500/60 shadow-xs"
                      }`}
                    >
                      {/* Left: No, Category Badge, Company Badge, Date, Title */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-0 flex-1">
                        <span className="font-mono text-xs font-bold text-slate-500 w-5 shrink-0 text-center">
                          #{idx + 1}
                        </span>

                        {/* Category Badge (근태보고서 / 특근실시보고서) */}
                        <span className={`px-2 py-0.5 rounded-md font-black text-[11px] border shrink-0 flex items-center gap-1 ${
                          isWeekend
                            ? "bg-rose-950 text-rose-300 border-rose-600 shadow-xs"
                            : "bg-cyan-950 text-cyan-300 border-cyan-800 shadow-xs"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isWeekend ? "bg-rose-500 animate-pulse" : "bg-cyan-400"}`}></span>
                          <span>{reportCategory}</span>
                        </span>

                        {/* Company / Plant Badge */}
                        <span className={`px-2 py-0.5 rounded-md font-black text-[11px] border shrink-0 ${badgeColor}`}>
                          {(report.company && report.company !== "전체") ? report.company : (report.plant || plantName)}
                        </span>

                        {/* Work Date Badge */}
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-cyan-300 border border-slate-800 font-mono text-[11px] font-bold shrink-0">
                          📅 {report.workDateFormatted || report.workDate}
                        </span>

                        {/* Title */}
                        <span className={`font-black text-xs sm:text-sm truncate transition-colors ${
                          isWeekend ? "text-rose-100 group-hover:text-rose-300" : "text-slate-100 group-hover:text-cyan-300"
                        }`}>
                          {cleanDisplayTitle}
                        </span>
                      </div>

                      {/* Right: Quick Attendance Breakdown + Cost/Headcount + Compact Actions */}
                      <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap justify-between md:justify-end">
                        {/* Compact Attendance Breakdown Pills */}
                        <div className="flex items-center gap-1 font-mono text-[10px] font-bold">
                          {otCounts["정시"] > 0 && <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">🟢 {otCounts["정시"]}</span>}
                          {otCounts["19시"] > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">🟡 {otCounts["19시"]}</span>}
                          {otCounts["21시"] > 0 && <span className="px-1.5 py-0.5 rounded bg-orange-950/80 text-orange-300 border border-orange-800/60">🟠 {otCounts["21시"]}</span>}
                          {otCounts["22시"] > 0 && <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60">🔴 {otCounts["22시"]}</span>}
                          {otCounts["특근"] > 0 && <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">🌙 {otCounts["특근"]}</span>}
                          {otCounts["연차"] > 0 && <span className="px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/60">🌴 {otCounts["연차"]}</span>}
                          {otCounts["결근"] > 0 && <span className="px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/60">❌ {otCounts["결근"]}</span>}
                        </div>

                        {/* Headcount & Cost */}
                        <div className="flex items-center gap-1.5 font-mono text-xs shrink-0">
                          <span className="font-black text-rose-400">₩{cost.toLocaleString()}</span>
                          <span className="text-[11px] text-slate-400 font-bold">({workersCount}명 • {totalManHours}H)</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLegacyReport(report);
                              setIsLegacyModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                            title="보고서 상세 및 결재 확인"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">상세</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditReport(report)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500 font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                            title="해당 일자 및 소속업체로 이동하여 수정/재입력"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="hidden sm:inline">수정</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteReport(report.id, e)}
                            className="px-2 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/80 font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                            title="보고서 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}      {/* ========================================================================= */}
      {/* 📑 MODAL: 등록 클릭 시 뜨는 특근/근태 보고서 팝업창 (내용 작성 및 검토) */}
      {/* ========================================================================= */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`bg-slate-900 text-white rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
            isWeekendByDate(selectedDay)
              ? "border-2 border-rose-500 shadow-rose-950/40"
              : "border-2 border-cyan-400"
          }`}>
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className={`p-1.5 rounded-lg border ${
                  isWeekendByDate(selectedDay)
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                    : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                }`}>
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                    <span>{isWeekendByDate(selectedDay) ? "특근실시보고서" : "근태보고서"} 등록 및 결재</span>
                    <span className={`text-xs px-2 py-0.5 rounded-md border font-mono ${
                      isWeekendByDate(selectedDay)
                        ? "bg-rose-950 text-rose-300 border-rose-800"
                        : "bg-cyan-950 text-cyan-300 border-cyan-800"
                    }`}>
                      2026-09-{String(selectedDay).padStart(2, "0")}
                    </span>
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Report Document Format */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Top Approval Box & Meta Grid */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="space-y-2.5 flex-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block pb-1">보고서 제목</label>
                    <input
                      type="text"
                      value={reportModalTitle}
                      onChange={(e) => setReportModalTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-black text-xs sm:text-sm focus:border-cyan-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block pb-0.5">작성자:</span>
                      <input
                        type="text"
                        value={reportModalAuthor}
                        onChange={(e) => setReportModalAuthor(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block pb-0.5">대상 업체/공장:</span>
                      <span className="inline-block w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 font-bold">
                        {selectedCompanyFilter === "전체" ? "5개사 통합" : selectedCompanyFilter}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Approval Blocks (선택된 업체 관리자 결재선) */}
                <div className="shrink-0 space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10.5px] font-black text-cyan-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{selectedCompanyFilter === "전체" ? "5개사 통합" : selectedCompanyFilter} 결재선</span>
                    </span>
                    <span className="text-[9.5px] text-slate-400 font-bold">클릭하여 이름 수정 가능</span>
                  </div>
                  <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900 shadow-md">
                    <div className="grid grid-cols-4 divide-x divide-slate-700 text-center font-bold text-[11px]">
                      {reportApprovalSteps.map((st, idx) => (
                        <div key={idx} className="bg-slate-800 py-1 px-2.5 text-slate-300 font-black">
                          {st.role}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 divide-x divide-slate-700 text-center text-xs h-14 items-center bg-slate-900/90">
                      {reportApprovalSteps.map((st, idx) => (
                        <div key={idx} className="p-1 flex flex-col items-center justify-center space-y-0.5">
                          <input
                            type="text"
                            value={st.name}
                            onChange={(e) => {
                              const next = [...reportApprovalSteps];
                              next[idx] = { ...next[idx], name: e.target.value };
                              setReportApprovalSteps(next);
                            }}
                            className="w-full text-center bg-transparent border-b border-transparent hover:border-slate-600 focus:border-cyan-400 font-black text-white text-xs px-0.5 py-0.5 outline-hidden"
                            title={`${st.role} 성명 수정`}
                          />
                          <span className="text-[9.5px] text-slate-400 font-bold">
                            {st.title || st.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary KPIs */}
              {(() => {
                const attendedWorkers = filteredAttendanceWorkers.filter(w => {
                  const val = w.daily ? w.daily[selectedDay] : "";
                  const { isAttended, workHours } = calculateWorkerDailyHours(val);
                  return isAttended && workHours > 0;
                });
                const totalHours = filteredAttendanceWorkers.reduce((sum, w) => {
                  const val = w.daily ? w.daily[selectedDay] : "";
                  const { workHours } = calculateWorkerDailyHours(val);
                  return sum + (workHours || 0);
                }, 0);
                const otHours = filteredAttendanceWorkers.reduce((sum, w) => {
                  const val = w.daily ? w.daily[selectedDay] : "";
                  const { weekdayOt, weekendOt } = calculateWorkerDailyHours(val);
                  return sum + (weekdayOt + weekendOt || 0);
                }, 0);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10.5px] text-slate-400 font-bold block">출근/투입 인원</span>
                      <span className="font-mono font-black text-sm text-emerald-400">{attendedWorkers.length}명</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10.5px] text-slate-400 font-bold block">잔업/특근 인원</span>
                      <span className="font-mono font-black text-sm text-amber-400">+{otHours}H</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10.5px] text-slate-400 font-bold block">총 투입 공수</span>
                      <span className="font-mono font-black text-sm text-cyan-300">{totalHours} M/H</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10.5px] text-slate-400 font-bold block">예상 총 노무비</span>
                      <span className="font-mono font-black text-sm text-rose-400">₩{(totalHours * 15000).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Editable Reason / Content Notes Area */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block text-xs flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>특근 사유 및 작업 내용 (수정 및 작성 가능)</span>
                </label>
                <textarea
                  rows={3}
                  value={reportModalNotes}
                  onChange={(e) => setReportModalNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-medium text-xs focus:border-cyan-400"
                  placeholder="특근 사유 및 주요 작업 내용을 입력해주세요."
                />
              </div>

              {/* Workers Summary: 선택된 인원 + 근태현황만 축약 표시 (미입력 제외) */}
              {(() => {
                const enteredWorkers = filteredAttendanceWorkers.filter((w) => {
                  const val = w.daily ? String(w.daily[selectedDay] || "").trim() : "";
                  return val !== "" && val !== "미입력" && val !== "-";
                });

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-black text-slate-200 text-xs flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        <span>9월 {selectedDay}일 투입/등록 인원 ({enteredWorkers.length}명)</span>
                      </span>

                      {/* 근태별 인원 요약 뱃지 */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono font-bold">
                        {(() => {
                          const counts = { "정시": 0, "19시": 0, "21시": 0, "22시": 0, "연차": 0, "결근": 0, "특근": 0 };
                          enteredWorkers.forEach((w) => {
                            const val = w.daily ? w.daily[selectedDay] : "";
                            if (val === "🟢" || val === "정시" || val === "17") counts["정시"]++;
                            else if (val === "19" || val === "19시") counts["19시"]++;
                            else if (val === "21" || val === "21시") counts["21시"]++;
                            else if (val === "22" || val === "22시") counts["22시"]++;
                            else if (val === "연차") counts["연차"]++;
                            else if (val === "결근") counts["결근"]++;
                            else if (val === "특근" || val === "주말특근") counts["특근"]++;
                          });
                          return (
                            <>
                              {counts["정시"] > 0 && <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">🟢 정시 {counts["정시"]}명</span>}
                              {counts["19시"] > 0 && <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800">🟡 19시 {counts["19시"]}명</span>}
                              {counts["21시"] > 0 && <span className="px-2 py-0.5 rounded-md bg-orange-950 text-orange-300 border border-orange-800">🟠 21시 {counts["21시"]}명</span>}
                              {counts["22시"] > 0 && <span className="px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800">🔴 22시 {counts["22시"]}명</span>}
                              {counts["특근"] > 0 && <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800">🌙 특근 {counts["특근"]}명</span>}
                              {counts["연차"] > 0 && <span className="px-2 py-0.5 rounded-md bg-sky-950 text-sky-300 border border-sky-800">🌴 연차 {counts["연차"]}명</span>}
                              {counts["결근"] > 0 && <span className="px-2 py-0.5 rounded-md bg-red-950 text-red-300 border border-red-800">❌ 결근 {counts["결근"]}명</span>}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* 작업자별 축약 카드 그리드 (3열 병렬) */}
                    <div className="border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-slate-950/60 p-2">
                      {enteredWorkers.length === 0 ? (
                        <div className="py-6 text-center text-slate-500 font-bold text-xs">
                          당일 선택/입력된 근태 데이터가 없습니다.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                          {enteredWorkers.map((w, idx) => {
                            const val = w.daily ? w.daily[selectedDay] : "";
                            const getBadge = (code) => {
                              const str = String(code || "").trim();
                              if (str === "🟢" || str === "정시" || str === "17") return { label: "🟢 정시", bg: "bg-emerald-950 text-emerald-300 border-emerald-700/80" };
                              if (str === "19" || str === "19시") return { label: "🟡 19시(+2H)", bg: "bg-amber-950 text-amber-300 border-amber-700/80" };
                              if (str === "21" || str === "21시") return { label: "🟠 21시(+4H)", bg: "bg-orange-950 text-orange-300 border-orange-700/80" };
                              if (str === "22" || str === "22시") return { label: "🔴 22시(+5H)", bg: "bg-rose-950 text-rose-300 border-rose-700/80" };
                              if (str === "연차") return { label: "🌴 연차", bg: "bg-sky-950 text-sky-300 border-sky-700/80" };
                              if (str === "결근") return { label: "❌ 결근", bg: "bg-red-950 text-red-300 border-red-700/80" };
                              if (str === "특근" || str === "주말특근") return { label: "🌙 특근(8H)", bg: "bg-purple-950 text-purple-300 border-purple-700/80" };
                              if (str === "-" || str === "휴무") return { label: "- 휴무", bg: "bg-slate-800 text-slate-400 border-slate-700" };
                              return { label: str || "미입력", bg: "bg-slate-800 text-slate-300 border-slate-700" };
                            };
                            const badge = getBadge(val);

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-colors text-xs"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-mono text-[10.5px] text-slate-500 w-5 text-right shrink-0">{idx + 1}.</span>
                                  <span className="text-[11px] font-bold text-slate-400 shrink-0">{w.company}</span>
                                  <span className="text-[11px] text-slate-500 shrink-0">{w.dept}</span>
                                  <span className="font-black text-white text-xs truncate">{w.name}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 whitespace-nowrap ${badge.bg}`}>
                                  {badge.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer active:scale-95 transition-all"
              >
                취소
              </button>

              <button
                onClick={handleConfirmAndSaveReportModal}
                disabled={isSaving}
                className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "등록 중..." : "💾 최종 저장 및 보고서 등록"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⭐ MODAL: 업체별 오늘자 현황 팝업 (초간결 3열 부서/성명/오늘근태 NO SCROLLING) */}
      {popupCompanyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl max-w-5xl w-full border-2 border-cyan-400 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* 1. Modal Header & Summary Pills Bar */}
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

            {/* 2. Main Multi-Column Table (부서 | 성명 | 오늘근태) */}
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
      {/* ⭐ MODAL: 업체별 근로자 추가/삭제 관리 모달 */}
      {selectedCompanyManageWorkers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl max-w-3xl w-full border-2 border-purple-500 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Users className="w-4 h-4" />
                </span>
                <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                  <span>{selectedCompanyManageWorkers} 근로자 추가/삭제 관리</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800 font-mono font-bold">
                    총원 {manageCompanyWorkers.length}명
                  </span>
                </h3>
              </div>

              <button
                onClick={() => setSelectedCompanyManageWorkers(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Form Section */}
            <div className="p-3 sm:p-4 bg-slate-950/80 border-b border-slate-800 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>신규 근로자 간편 등록</span>
                </span>
                <span className="text-[10.5px] text-slate-400">등록 즉시 전체 대장 및 근태표에 실시간 반영됩니다</span>
              </div>

              <form onSubmit={handleQuickAddCompanyWorker} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    required
                    placeholder="성명 *"
                    value={quickNewWorkerName}
                    onChange={(e) => setQuickNewWorkerName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold placeholder:text-slate-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={quickNewWorkerDept}
                    onChange={(e) => setQuickNewWorkerDept(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d} className="bg-slate-900 text-white font-bold">{d}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="라인/공정 (선택)"
                    value={quickNewWorkerLine}
                    onChange={(e) => setQuickNewWorkerLine(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold placeholder:text-slate-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md shadow-purple-900/40 flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>근로자 추가</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Current Workers List Table */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1 text-xs space-y-2 max-h-[55vh]">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800 flex-wrap gap-2">
                <span className="font-black text-slate-300 text-xs flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>현재 등록 근로자 목록 ({manageCompanyWorkers.length}명)</span>
                </span>
                <div className="relative w-44">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="이름/부서 검색..."
                    value={manageWorkerSearch}
                    onChange={(e) => setManageWorkerSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-[11px] placeholder:text-slate-500"
                  />
                </div>
              </div>

              {manageCompanyWorkers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-bold">
                  등록된 근로자가 없습니다.
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 text-slate-400 text-[11px] font-black border-b border-slate-800">
                      <tr>
                        <th className="py-1.5 px-2.5 text-center w-10 text-slate-500 font-mono">No</th>
                        <th className="py-1.5 px-2.5 w-20">부서</th>
                        <th className="py-1.5 px-2.5 w-24">성명</th>
                        <th className="py-1.5 px-2.5">라인/공정</th>
                        <th className="py-1.5 px-2.5 text-center w-16">직위</th>
                        <th className="py-1.5 px-2.5 text-center w-16">삭제</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-xs">
                      {manageCompanyWorkers.map((worker, idx) => (
                        <tr key={worker.originalMatrixIndex} className="hover:bg-slate-800/60 transition-colors">
                          <td className="py-1.5 px-2.5 text-center font-mono text-slate-500 text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-2.5">
                            <span className="font-bold text-purple-300 text-[11px]">{worker.dept}</span>
                          </td>
                          <td className="py-1.5 px-2.5 font-black text-white text-xs">
                            {worker.name}
                          </td>
                          <td className="py-1.5 px-2.5 text-slate-400 font-medium text-[11px]">
                            {worker.line || worker.dept}
                          </td>
                          <td className="py-1.5 px-2.5 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                              {worker.position || "작업원"}
                            </span>
                          </td>
                          <td className="py-1.5 px-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleQuickDeleteWorker(worker.originalMatrixIndex, worker.name, worker.company)}
                              className="px-2 py-0.5 rounded-lg bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/80 font-bold text-[10.5px] transition-all cursor-pointer flex items-center gap-1 mx-auto active:scale-95"
                              title="근로자 삭제"
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
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCompanyManageWorkers(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs cursor-pointer shadow-md active:scale-95 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📑 MODAL: 근태/특근보고서 상세 확인 및 결재 모달 (등록 모달과 100% 동일한 정식 서식) */}
      {/* ========================================================================= */}
      {isLegacyModalOpen && selectedLegacyReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150">
          {(() => {
            const isWk = isWeekendByDate(selectedLegacyReport.workDate || selectedLegacyReport.title);
            const rawTitle = selectedLegacyReport.title || "";
            const repType = isWk ? "특근실시보고서" : "근태보고서";

            let cleanTitle = rawTitle;
            if (isWk) {
              cleanTitle = cleanTitle
                .replace(/근태 및 특근실시 보고서|근태보고서|근태 및 특근보고서/g, "특근실시보고서")
                .replace(/특근실시 보고서/g, "특근실시보고서");
              if (!cleanTitle.includes("특근실시보고서")) cleanTitle += " 특근실시보고서";
            } else {
              cleanTitle = cleanTitle
                .replace(/근태 및 특근실시 보고서|특근실시보고서|특근실시 보고서|근태 및 특근보고서/g, "근태보고서");
              if (!cleanTitle.includes("근태보고서")) cleanTitle += " 근태보고서";
            }

            return (
          <div className={`bg-slate-900 text-white rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
            isWk ? "border-2 border-rose-500 shadow-rose-950/40" : "border-2 border-cyan-400"
          }`}>
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                    <span>근태 및 특근실시 보고서 상세 내역</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                      {selectedLegacyReport.workDateFormatted || selectedLegacyReport.workDate}
                    </span>
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsLegacyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Top Approval Box & Meta Grid */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="space-y-2 flex-1">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block pb-0.5">보고서 제목</span>
                    <div className="font-black text-white text-sm sm:text-base">
                      {cleanTitle}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-400 font-bold block pb-0.5">작성자:</span>
                      <span className="font-bold text-white">{selectedLegacyReport.author || "양인나 선임"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block pb-0.5">대상 업체/공장:</span>
                      <span className="font-bold text-cyan-300">
                        {selectedLegacyReport.company || selectedLegacyReport.plant || "통합"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Approval Blocks */}
                <div className="shrink-0 space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10.5px] font-black text-purple-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                      <span>결재선</span>
                    </span>
                    <span className="text-[9.5px] text-emerald-400 font-bold">결재 완료</span>
                  </div>
                  <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900 shadow-md">
                    <div className="grid grid-cols-4 divide-x divide-slate-700 text-center font-bold text-[11px]">
                      {(selectedLegacyReport.approval || [
                        { role: "담당", name: "양인나" },
                        { role: "책임", name: "윤경수" },
                        { role: "이사", name: "이명재" },
                        { role: "대표", name: "권태형" }
                      ]).map((st, sIdx) => (
                        <div key={sIdx} className="bg-slate-800 py-1 px-2 text-slate-300 font-black">
                          {st.role}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 divide-x divide-slate-700 text-center text-xs h-14 items-center bg-slate-900/90">
                      {(selectedLegacyReport.approval || [
                        { role: "담당", name: "양인나", status: "완료" },
                        { role: "책임", name: "윤경수", status: "완료" },
                        { role: "이사", name: "이명재", status: "완료" },
                        { role: "대표", name: "권태형", status: "완료" }
                      ]).map((st, sIdx) => (
                        <div key={sIdx} className="p-1 flex flex-col items-center justify-center space-y-0.5">
                          <span className="font-black text-white text-xs">{st.name}</span>
                          <span className="text-[9.5px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-bold">
                            {st.status || "완료"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary KPIs */}
              {(() => {
                const workersCount = selectedLegacyReport.totalWorkers || (selectedLegacyReport.items ? selectedLegacyReport.items.length : 0);
                const totalHours = selectedLegacyReport.totalHours || (workersCount * 8);
                const cost = selectedLegacyReport.cost || (totalHours * 15000);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10.5px] text-slate-400 font-bold block">출근/투입 인원</span>
                      <span className="font-mono font-black text-sm text-emerald-400">{workersCount}명</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10.5px] text-slate-400 font-bold block">총 투입 공수</span>
                      <span className="font-mono font-black text-sm text-cyan-300">{totalHours} M/H</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10.5px] text-slate-400 font-bold block">소속 공장/업체</span>
                      <span className="font-mono font-black text-sm text-purple-400">{selectedLegacyReport.company || selectedLegacyReport.plant || "-"}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10.5px] text-slate-400 font-bold block">예상 총 노무비</span>
                      <span className="font-mono font-black text-rose-400">₩{cost.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Reason / Notes Area */}
              {selectedLegacyReport.reasons && selectedLegacyReport.reasons.length > 0 && (
                <div className="space-y-1 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-slate-300 block text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    <span>특근 사유 및 주요 작업 내용</span>
                  </span>
                  <div className="space-y-1 text-slate-300 font-medium text-xs leading-relaxed whitespace-pre-wrap">
                    {selectedLegacyReport.reasons.map((rs, rIdx) => (
                      <div key={rIdx}>{rs}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Workers Summary: 선택된 인원 + 근태현황만 축약 표시 (미입력 제외) */}
              {(() => {
                const items = selectedLegacyReport.items || [];
                const validItems = items.filter((it) => {
                  const val = String(it.attendanceCode || it.category || "").trim();
                  return val !== "" && val !== "미입력" && val !== "-";
                });

                const displayItems = validItems.length > 0 ? validItems : items;

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-black text-slate-200 text-xs flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        <span>투입 작업자 명단 ({displayItems.length}명)</span>
                      </span>
                    </div>

                    <div className="border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-slate-950/60 p-2">
                      {displayItems.length === 0 ? (
                        <div className="py-6 text-center text-slate-500 font-bold text-xs">
                          등록된 투입 인원 정보가 없습니다.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                          {displayItems.map((it, idx) => {
                            const getBadge = (code) => {
                              const str = String(code || "").trim();
                              if (str === "🟢" || str === "정시" || str === "17") return { label: "🟢 정시", bg: "bg-emerald-950 text-emerald-300 border-emerald-700/80" };
                              if (str === "19" || str === "19시") return { label: "🟡 19시(+2H)", bg: "bg-amber-950 text-amber-300 border-amber-700/80" };
                              if (str === "21" || str === "21시") return { label: "🟠 21시(+4H)", bg: "bg-orange-950 text-orange-300 border-orange-700/80" };
                              if (str === "22" || str === "22시") return { label: "🔴 22시(+5H)", bg: "bg-rose-950 text-rose-300 border-rose-700/80" };
                              if (str === "연차") return { label: "🌴 연차", bg: "bg-sky-950 text-sky-300 border-sky-700/80" };
                              if (str === "결근") return { label: "❌ 결근", bg: "bg-red-950 text-red-300 border-red-700/80" };
                              if (str === "특근" || str === "주말특근") return { label: "🌙 특근(8H)", bg: "bg-purple-950 text-purple-300 border-purple-700/80" };
                              if (str === "-" || str === "휴무") return { label: "- 휴무", bg: "bg-slate-800 text-slate-400 border-slate-700" };
                              return { label: str || "특근", bg: "bg-purple-950 text-purple-300 border-purple-700" };
                            };

                            const badge = getBadge(it.attendanceCode || it.category || "특근");

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800/90 text-xs"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-mono text-[10.5px] text-slate-500 w-5 text-right shrink-0">{idx + 1}.</span>
                                  <span className="text-[11px] font-bold text-slate-400 shrink-0">{it.company || it.factory || ""}</span>
                                  <span className="text-[11px] text-slate-500 shrink-0">{it.dept || it.line || it.category || ""}</span>
                                  <span className="font-black text-white text-xs truncate">{it.workerName || it.names || "-"}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 whitespace-nowrap ${badge.bg}`}>
                                  {badge.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => handleDeleteReport(selectedLegacyReport.id)}
                className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>보고서 삭제</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>인쇄 / 출력</span>
                </button>

                <button
                  onClick={() => setIsLegacyModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer active:scale-95 transition-all"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}
        </div>
      )}
    </div>
  );
};
