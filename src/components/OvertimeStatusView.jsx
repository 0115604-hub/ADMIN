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
  CheckSquare,
  PenTool,
  Send,
  Sliders
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
  calculateReportMetrics,
  PLANT_COMPANIES,
  getPlantForCompany
} from "../services/overtimeService";
import { getKSTDateString } from "../utils/dateUtils";

export const OvertimeStatusView = () => {
  const { currentProfile, isAdmin } = useAuth();

  // Smart Overtime Ledger State (5개사 통합 잔업 스마트 대장)
  const [smartData, setSmartData] = useState(() => getLocalSmartOvertimeData());
  const [activeTab, setActiveTab] = useState("daily_input"); // 'daily_input' default for fastest attendance entry!
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Daily views state
  const [selectedDay, setSelectedDay] = useState(8); // Default 9월 8일
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("전체");
  const [searchWorkerQuery, setSearchWorkerQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("전체"); // '전체', '관리부', '가공동', '압출동'
  const [matrixCompanyFilter, setMatrixCompanyFilter] = useState("전체"); // '전체' | '(주)오륙' | '(주)조영산업' | '한울' | '부림텍' | '유성'
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

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
  const [selectedReportPlantFilter, setSelectedReportPlantFilter] = useState("전체"); // '전체' | '삼랑진공장' | '한림공장'

  // =========================================================================
  // ✍️ Dedicated Overtime Report Creation State (특근보고서 작성 탭 전용 상태)
  // =========================================================================
  const [reportCreateDay, setReportCreateDay] = useState(12); // Default 9월 12일
  const [reportCreatePlant, setReportCreatePlant] = useState("삼랑진공장"); // "삼랑진공장" | "한림공장" | "5개사 통합"
  const [reportCreateTitle, setReportCreateTitle] = useState("2026년 9월 12일(토) 삼랑진공장 특근실시 보고서");
  const [reportCreateAuthor, setReportCreateAuthor] = useState("양인나 선임");
  const [reportCreateAuthorTitle, setReportCreateAuthorTitle] = useState("선임");
  const [reportCreateReasons, setReportCreateReasons] = useState(
    "1. 2026년 9월 12일(토) 삼랑진공장 ((주)오륙 + 유성) 토요 특근 긴급 납품 및 공정 가동 대응\n2. 총 40명 투입 (총 특근공수: 382 M/H, 비용: ₩5,730,000)"
  );
  const [reportCreateItems, setReportCreateItems] = useState([
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
  ]);

  // Show Toast notification
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3200);
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

  // ⭐ Auto-generate/sync Plant Weekend Overtime Reports:
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
            `1. 2026년 9월 ${day}일(토) 삼랑진공장 ((주)오륙 + 유성) 토요 특근 긴급 납품 및 공정 가동 대응`,
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
            `1. 2026년 9월 ${day}일(토) 한림공장 ((주)조영산업 + 한울 + 부림텍) 토요 특근 긴급 납품 및 공정 가동 대응`,
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

  // ⭐ USER ACTION: 1-Click Update Worker Attendance for Selected Day (Local Staging)
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

  // ⭐ USER ACTION: [ 💾 근태 등록 및 특근보고서 생성 ] (Manual Registration Trigger)
  const handleRegisterAttendanceAndGenerateReport = async () => {
    setIsSaving(true);
    try {
      // 1. Save smart overtime ledger to Firestore & LocalStorage
      await saveSmartOvertimeData(smartData);
      
      // 2. Generate/sync overtime reports for the selected day
      await syncPlantWeekendOvertimeReports(smartData.attendanceMatrix, selectedDay);
      
      setHasUnsavedChanges(false);
      triggerToast(`🎉 9월 ${selectedDay}일 근태 등록 및 공장별 특근보고서 생성이 완료되었습니다!`);
    } catch (err) {
      console.error(err);
      alert("근태 등록 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Batch update attendance for all currently filtered workers
  const handleBatchUpdateFiltered = (newCode) => {
    const meta = getOptionMeta(newCode);
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

    setSmartData(newLedger);
    setHasUnsavedChanges(true);
    triggerToast(`선택 변경: ${filteredAttendanceWorkers.length}명 '${meta.label}' 설정됨 (등록 버튼을 눌러 확정하세요)`);
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

  // =========================================================================
  // ✍️ Function: Auto-populate Overtime Report from Attendance Matrix
  // =========================================================================
  const handleAutoPopulateReport = (targetDay, targetPlant) => {
    const day = targetDay || reportCreateDay;
    const plant = targetPlant || reportCreatePlant;
    const matrix = smartData?.attendanceMatrix || [];

    const isSaturday = (day === 5 || day === 12 || day === 19 || day === 26);
    const isSunday = (day === 6 || day === 13 || day === 20 || day === 27);
    const dayLabel = isSaturday ? "토" : isSunday ? "일" : "평일";

    // Filter relevant workers
    let targetWorkers = [];
    let companies = [];
    let authorName = "양인나 선임";

    if (plant === "삼랑진공장") {
      companies = ["(주)오륙", "유성"];
      authorName = "양인나 선임";
      targetWorkers = matrix.filter((w) => {
        const isSam = w.company === "(주)오륙" || w.company === "유성" || w.company === "오륙" || w.company === "유성산업";
        const val = w.daily ? w.daily[day] : "";
        const { isAttended, workHours } = calculateWorkerDailyHours(val);
        return isSam && isAttended && workHours > 0;
      });
    } else if (plant === "한림공장") {
      companies = ["(주)조영산업", "한울", "부림텍"];
      authorName = "우창용 선임";
      targetWorkers = matrix.filter((w) => {
        const isHal = w.company === "(주)조영산업" || w.company === "한울" || w.company === "부림텍";
        const val = w.daily ? w.daily[day] : "";
        const { isAttended, workHours } = calculateWorkerDailyHours(val);
        return isHal && isAttended && workHours > 0;
      });
    } else {
      companies = COMPANIES;
      authorName = "관리자";
      targetWorkers = matrix.filter((w) => {
        const val = w.daily ? w.daily[day] : "";
        const { isAttended, workHours } = calculateWorkerDailyHours(val);
        return isAttended && workHours > 0;
      });
    }

    // Group workers by Line or Dept
    const groupMap = {};
    targetWorkers.forEach((w) => {
      const cat = w.line || normalizeDept(w.dept) || "가공";
      if (!groupMap[cat]) {
        groupMap[cat] = {
          category: cat,
          workerNames: [],
          hoursList: []
        };
      }
      groupMap[cat].workerNames.push(w.name);
      const { workHours } = calculateWorkerDailyHours(w.daily?.[day]);
      groupMap[cat].hoursList.push(workHours || 8);
    });

    let newItems = Object.entries(groupMap).map(([cat, data], idx) => {
      const avgHours = data.hoursList.length > 0 
        ? Math.round((data.hoursList.reduce((a, b) => a + b, 0) / data.hoursList.length)) 
        : 8;
      return {
        id: idx + 1,
        category: cat,
        workContent: `${plant} ${cat} 긴급 가동 및 납품 대응`,
        names: data.workerNames.join(", "),
        hours: avgHours,
        count: data.workerNames.length
      };
    });

    // Fallback benchmark items if empty
    if (newItems.length === 0) {
      if (plant === "삼랑진공장") {
        newItems = [
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
        ];
      } else {
        newItems = [
          { id: 1, category: "9BQC", workContent: "9BQC G/RUN 긴급 조립 및 납품", names: "정상근, 링링", hours: 8, count: 2 },
          { id: 2, category: "CHANNEL", workContent: "CHANNEL 밴딩 가공", names: "유미, 이상기", hours: 8, count: 2 }
        ];
      }
    }

    const totalCnt = newItems.reduce((s, it) => s + (Number(it.count) || 0), 0);
    const totalManHours = newItems.reduce((s, it) => s + ((Number(it.count) || 0) * (Number(it.hours) || 8)), 0);
    const cost = totalManHours * 15000;

    setReportCreateTitle(`2026년 9월 ${day}일(${dayLabel}) ${plant} 특근실시 보고서`);
    setReportCreateAuthor(authorName);
    setReportCreateItems(newItems);
    setReportCreateReasons(
      `1. 2026년 9월 ${day}일(${dayLabel}) ${plant} (${companies.join(", ")}) 특근 긴급 생산 및 납품 대응\n2. 총 ${totalCnt}명 투입 (총 특근공수: ${totalManHours} M/H, 예상 노무비: ₩${cost.toLocaleString()})`
    );

    triggerToast(`📥 9월 ${day}일 ${plant} 특근 작업자 데이터(${totalCnt}명)를 불러왔습니다.`);
  };

  // ⭐ USER ACTION: [ 📑 특근보고서 최종 등록 및 보관함 저장 ]
  const handleSaveCreatedReport = async () => {
    setIsSaving(true);
    try {
      const day = reportCreateDay;
      const isSaturday = (day === 5 || day === 12 || day === 19 || day === 26);
      const isSunday = (day === 6 || day === 13 || day === 20 || day === 27);
      const dayLabel = isSaturday ? "토" : isSunday ? "일" : "평일";

      const totalWorkers = reportCreateItems.reduce((s, it) => s + (Number(it.count) || 0), 0);
      const totalHours = reportCreateItems.reduce((s, it) => s + ((Number(it.count) || 0) * (Number(it.hours) || 8)), 0);
      const cost = totalHours * 15000;

      const plantCompMap = {
        "삼랑진공장": ["(주)오륙", "유성"],
        "한림공장": ["(주)조영산업", "한울", "부림텍"],
        "5개사 통합": COMPANIES
      };

      const plantPrefix = reportCreatePlant === "삼랑진공장" ? "samrangjin" : reportCreatePlant === "한림공장" ? "hanlim" : "total";
      const reportId = `report_${plantPrefix}_2026_09_${String(day).padStart(2, "0")}`;

      const approval = reportCreatePlant === "삼랑진공장" ? [
        { role: "담당", name: "양인나", status: "완료" },
        { role: "책임", name: "윤경수", status: "완료" },
        { role: "이사", name: "이명재", status: "완료" },
        { role: "대표", name: "권태형", status: "완료" }
      ] : [
        { role: "담당", name: "우창용", status: "완료" },
        { role: "책임", name: "김동욱", status: "완료" },
        { role: "이사", name: "이명재", status: "완료" },
        { role: "대표", name: "권태형", status: "완료" }
      ];

      const newReport = {
        id: reportId,
        plant: reportCreatePlant,
        title: reportCreateTitle,
        workDate: `2026-09-${String(day).padStart(2, "0")}`,
        workDateFormatted: `2026-09-${String(day).padStart(2, "0")} (${dayLabel})`,
        author: reportCreateAuthor,
        authorTitle: reportCreateAuthorTitle,
        companies: plantCompMap[reportCreatePlant] || COMPANIES,
        updatedAt: new Date().toISOString(),
        approval,
        totalWorkers,
        totalHours,
        cost,
        items: reportCreateItems,
        isAutoGenerated: false,
        reasons: reportCreateReasons.split("\n").filter(r => r.trim().length > 0)
      };

      await saveOvertimeReport(newReport);
      setSelectedLegacyReport(newReport);
      triggerToast(`🎉 [${reportCreatePlant}] 특근보고서가 보관함에 성공적으로 등록되었습니다!`);
      setActiveTab("legacy_reports");
    } catch (err) {
      console.error(err);
      alert("특근보고서 저장 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSaving(false);
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
      {/* 🧭 MAIN TAB NAVIGATION (5 Tabs - 특근보고서 작성 탭 포함) */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b-2 border-slate-200 dark:border-slate-800">
        {[
          { id: "daily_input", label: "📝 오늘자 근태/잔업 등록", icon: Zap, badge: hasUnsavedChanges ? "미저장 있음" : "선택 후 등록", highlight: true },
          { id: "report_create", label: "✍️ 특근보고서 작성", icon: PenTool, badge: "보고서 발행", special: true },
          { id: "legacy_reports", label: "📑 특근보고서 관리", icon: FileText, badge: "토요특근 연동" },
          { id: "daily_summary", label: "📋 일자별 종합 집계", icon: FileSpreadsheet },
          { id: "monthly_matrix", label: "📊 9월 전사 종합현황판", icon: CalendarDays }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "report_create") {
                  handleAutoPopulateReport(selectedDay, "삼랑진공장");
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? tab.special
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-102 ring-2 ring-purple-400"
                    : tab.highlight
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 scale-102 ring-2 ring-cyan-400"
                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : tab.special ? "text-purple-500" : "text-slate-400"}`} />
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
      {/* 📝 TAB 1: 오늘자 근태/잔업 등록 (선택 후 등록버튼으로 저장 & 보고서 생성) */}
      {/* ========================================================================= */}
      {activeTab === "daily_input" && (
        <div className="space-y-4">
          {/* Top Control Filter & Date Selector Bar */}
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
                  9월 {selectedDay}일 근태 작업 중
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

            {/* Strict 3 Departments Filter & Search Bar */}
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
          </div>

          {/* ⭐ PROMINENT REGISTRATION ACTION BAR (등록 버튼 및 보고서 생성 안내) */}
          <div className="p-4 rounded-2xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/40">
                <CheckCircle2 className="w-6 h-6 text-cyan-400" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm sm:text-base text-white">
                    9월 {selectedDay}일 근태 선택 완료 후 [등록]을 눌러주세요
                  </h4>
                  {hasUnsavedChanges && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/30 text-rose-300 text-xs font-black border border-rose-400/50 animate-pulse">
                      ● 변경사항 등록 대기 중
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  등록 버튼을 누르면 선택한 작업자들이 정리되어 전산에 저장되고 <strong className="text-cyan-300 font-bold">공장별 특근보고서로 자동 생성</strong>됩니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                onClick={handleRegisterAttendanceAndGenerateReport}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-sm shadow-lg shadow-cyan-900/40 active:scale-95 transition-all cursor-pointer border border-cyan-400/50 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "등록 중..." : `💾 9월 ${selectedDay}일 근태 등록 & 특근보고서 생성`}</span>
              </button>

              <button
                onClick={() => {
                  handleAutoPopulateReport(selectedDay, "삼랑진공장");
                  setActiveTab("report_create");
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                title="선택된 일자의 특근보고서 직접 작성/편집"
              >
                <PenTool className="w-4 h-4" />
                <span>특근보고서 작성 탭</span>
              </button>
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
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400">
                  근태 선택 후 상단의 [근태 등록 & 특근보고서 생성] 버튼을 누르면 최종 확정됩니다.
                </span>
              </div>
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

                                  {/* 근태 선택 버튼군 */}
                                  <td className="py-1 px-1 text-center">
                                    <div className="flex items-center justify-center gap-1 flex-wrap">
                                      {/* 정시 */}
                                      <button
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "🟢")}
                                        title="정시 출근 (8시간)"
                                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "🟢" || currentVal === "정시" || currentVal === "17"
                                            ? "bg-emerald-600 text-white font-black shadow-xs"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        정시
                                      </button>

                                      {/* 19시 */}
                                      <button
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "19")}
                                        title="19시 잔업 (+2시간)"
                                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "19" || currentVal === "19시"
                                            ? "bg-amber-600 text-white font-black shadow-xs"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        19시
                                      </button>

                                      {/* 21시 */}
                                      <button
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "21")}
                                        title="21시 잔업 (+4시간)"
                                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "21" || currentVal === "21시"
                                            ? "bg-orange-600 text-white font-black shadow-xs"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        21시
                                      </button>

                                      {/* 22시 */}
                                      <button
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "22")}
                                        title="22시 잔업 (+5시간)"
                                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "22" || currentVal === "22시"
                                            ? "bg-rose-600 text-white font-black shadow-xs"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        22시
                                      </button>

                                      {/* 특근 */}
                                      <button
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "특근")}
                                        title="주말/휴일 특근 (8시간)"
                                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "특근" || currentVal === "주말특근"
                                            ? "bg-purple-600 text-white font-black shadow-xs"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                        }`}
                                      >
                                        특근
                                      </button>

                                      {/* 휴무 */}
                                      <button
                                        onClick={() => handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, "-")}
                                        title="휴무 / 미출근"
                                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                          currentVal === "-" || currentVal === "휴무"
                                            ? "bg-slate-600 text-white font-black shadow-xs"
                                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-slate-700"
                                        }`}
                                      >
                                        휴무
                                      </button>

                                      {/* 기타 옵션 */}
                                      <select
                                        value={
                                          ["🟢", "정시", "17", "19", "19시", "21", "21시", "22", "22시", "특근", "주말특근", "-", "휴무"].includes(currentVal)
                                            ? ""
                                            : (currentVal || "")
                                        }
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            handleUpdateWorkerDayAttendance(worker.originalMatrixIndex, e.target.value);
                                          }
                                        }}
                                        className={`bg-slate-950 text-[11px] font-bold rounded px-1 py-0.5 border cursor-pointer ${
                                          !["🟢", "정시", "17", "19", "19시", "21", "21시", "22", "22시", "특근", "주말특근", "-", "휴무", ""].includes(currentVal)
                                            ? "border-cyan-400 text-cyan-300 bg-cyan-950"
                                            : "border-slate-700 text-slate-400"
                                        }`}
                                      >
                                        <option value="" className="bg-slate-900 text-slate-400 font-normal">
                                          {!["🟢", "정시", "17", "19", "19시", "21", "21시", "22", "22시", "특근", "주말특근", "-", "휴무", ""].includes(currentVal)
                                            ? meta.label
                                            : "기타▾"}
                                        </option>
                                        {ATTENDANCE_OPTIONS.filter(opt => !["🟢", "19", "21", "22", "특근", "-"].includes(opt.code)).map((opt) => (
                                          <option key={opt.code} value={opt.code} className="bg-slate-900 text-white font-bold">
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>
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

                                  {/* 삭제 */}
                                  <td className="py-1 px-1 text-center">
                                    <button
                                      onClick={() => handleQuickDeleteWorker(worker.originalMatrixIndex, worker.name, worker.company)}
                                      title="근로자 삭제"
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
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
      {/* ✍️ TAB 2: 특근보고서 작성 (DEDICATED OVERTIME REPORT CREATION TAB) */}
      {/* ========================================================================= */}
      {activeTab === "report_create" && (
        <div className="space-y-4">
          {/* Top Configuration & Control Bar */}
          <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-purple-500/60 shadow-xl text-white space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/40">
                    <PenTool className="w-5 h-5" />
                  </span>
                  <h3 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
                    <span>특근실시 보고서 신규 작성 및 편집</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 font-bold border border-purple-700">
                      정식 결재 양식
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  대상 일자와 공장을 선택하고 작업자들을 라인별로 정리한 후 [보고서 보관함 저장]을 눌러주세요.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => handleAutoPopulateReport(reportCreateDay, reportCreatePlant)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>📥 근태 데이터에서 작업자 자동 불러오기</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveCreatedReport}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-purple-900/40 cursor-pointer transition-all active:scale-95 border border-purple-400 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "저장 중..." : "📑 특근보고서 최종 등록 및 보관함 저장"}</span>
                </button>
              </div>
            </div>

            {/* Selectors: Date, Plant, Author */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
              {/* Target Date */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>특근 실시 일자</span>
                </label>
                <select
                  value={reportCreateDay}
                  onChange={(e) => {
                    const d = Number(e.target.value);
                    setReportCreateDay(d);
                    handleAutoPopulateReport(d, reportCreatePlant);
                  }}
                  className="w-full bg-slate-950 text-white font-black rounded-xl p-2.5 border-2 border-slate-700 focus:border-purple-400 cursor-pointer"
                >
                  {[5, 6, 12, 13, 19, 20, 26, 27].map((d) => (
                    <option key={d} value={d} className="bg-slate-900 text-white font-bold">
                      2026년 9월 {d}일 ({(d === 6 || d === 13 || d === 20 || d === 27) ? "일요일" : "토요일"}) {d === 12 ? "🌟 다가올 주말" : ""}
                    </option>
                  ))}
                  {Array.from({ length: 30 }, (_, i) => i + 1).filter(d => ![5, 6, 12, 13, 19, 20, 26, 27].includes(d)).map((d) => (
                    <option key={d} value={d} className="bg-slate-900 text-white font-bold">
                      2026년 9월 {d}일 (평일)
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Plant */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 flex items-center gap-1">
                  <Factory className="w-3.5 h-3.5 text-amber-400" />
                  <span>대상 공장 및 협력사</span>
                </label>
                <select
                  value={reportCreatePlant}
                  onChange={(e) => {
                    const p = e.target.value;
                    setReportCreatePlant(p);
                    handleAutoPopulateReport(reportCreateDay, p);
                  }}
                  className="w-full bg-slate-950 text-white font-black rounded-xl p-2.5 border-2 border-slate-700 focus:border-purple-400 cursor-pointer"
                >
                  <option value="삼랑진공장" className="bg-slate-900 text-white font-bold">🏭 삼랑진공장 ((주)오륙, 유성)</option>
                  <option value="한림공장" className="bg-slate-900 text-white font-bold">🏭 한림공장 ((주)조영산업, 한울, 부림텍)</option>
                  <option value="5개사 통합" className="bg-slate-900 text-white font-bold">🌐 5개사 통합 전체</option>
                </select>
              </div>

              {/* Author */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span>작성자 / 직위</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={reportCreateAuthor}
                    onChange={(e) => setReportCreateAuthor(e.target.value)}
                    placeholder="작성자 성명"
                    className="w-2/3 bg-slate-950 text-white font-bold rounded-xl p-2.5 border-2 border-slate-700 focus:border-purple-400"
                  />
                  <input
                    type="text"
                    value={reportCreateAuthorTitle}
                    onChange={(e) => setReportCreateAuthorTitle(e.target.value)}
                    placeholder="직위 (선임)"
                    className="w-1/3 bg-slate-950 text-white font-bold rounded-xl p-2.5 border-2 border-slate-700 focus:border-purple-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Report Live Summary KPIs */}
          {(() => {
            const totalCnt = reportCreateItems.reduce((s, it) => s + (Number(it.count) || 0), 0);
            const totalManHours = reportCreateItems.reduce((s, it) => s + ((Number(it.count) || 0) * (Number(it.hours) || 8)), 0);
            const cost = totalManHours * 15000;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold">대상 공장/협력업체</span>
                  <span className="font-black text-sm text-purple-600 dark:text-purple-400">{reportCreatePlant}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold">총 투입인원</span>
                  <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">{totalCnt}명</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold">총 특근 공수</span>
                  <span className="font-mono font-black text-base text-cyan-600 dark:text-cyan-400">{totalManHours} M/H</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold">예상 총 노무비</span>
                  <span className="font-mono font-black text-base text-rose-600 dark:text-rose-400">₩{cost.toLocaleString()}</span>
                </div>
              </div>
            );
          })()}

          {/* Title & Reasons Editor */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block pb-1">보고서 제목</label>
              <input
                type="text"
                value={reportCreateTitle}
                onChange={(e) => setReportCreateTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-black text-sm rounded-xl p-2.5 border border-slate-300 dark:border-slate-700 focus:border-purple-400"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block pb-1">특근 사유 및 특이사항</label>
              <textarea
                rows={3}
                value={reportCreateReasons}
                onChange={(e) => setReportCreateReasons(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium text-xs rounded-xl p-2.5 border border-slate-300 dark:border-slate-700 focus:border-purple-400"
                placeholder="특근 사유를 입력하세요 (줄바꿈으로 구분)"
              />
            </div>
          </div>

          {/* Detailed Line Breakdown Items Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-3 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" />
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  라인/공정별 투입 작업자 상세 내역 ({reportCreateItems.length}개 라인)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newId = reportCreateItems.length + 1;
                  setReportCreateItems([
                    ...reportCreateItems,
                    { id: newId, category: "신규공정", workContent: "특근 긴급 생산", names: "", hours: 8, count: 1 }
                  ]);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-bold text-xs cursor-pointer hover:bg-purple-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>라인/공정 행 추가</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-2 text-center w-8">No</th>
                    <th className="p-2 w-28">라인/공정명</th>
                    <th className="p-2 w-48">작업내용</th>
                    <th className="p-2">투입 작업자 명단</th>
                    <th className="p-2 text-center w-16">인원(명)</th>
                    <th className="p-2 text-center w-16">시간(H)</th>
                    <th className="p-2 text-center w-20">소계공수</th>
                    <th className="p-2 text-center w-10">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportCreateItems.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={it.category}
                          onChange={(e) => {
                            const updated = [...reportCreateItems];
                            updated[idx].category = e.target.value;
                            setReportCreateItems(updated);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 font-bold text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={it.workContent}
                          onChange={(e) => {
                            const updated = [...reportCreateItems];
                            updated[idx].workContent = e.target.value;
                            setReportCreateItems(updated);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={it.names}
                          onChange={(e) => {
                            const updated = [...reportCreateItems];
                            updated[idx].names = e.target.value;
                            // auto count if comma separated
                            const namesList = e.target.value.split(",").map(n => n.trim()).filter(Boolean);
                            if (namesList.length > 0) {
                              updated[idx].count = namesList.length;
                            }
                            setReportCreateItems(updated);
                          }}
                          placeholder="작업자 성명 (쉼표로 구분)"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-slate-900 dark:text-white font-mono"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <input
                          type="number"
                          value={it.count}
                          onChange={(e) => {
                            const updated = [...reportCreateItems];
                            updated[idx].count = Number(e.target.value) || 0;
                            setReportCreateItems(updated);
                          }}
                          className="w-14 text-center bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 font-mono font-black text-purple-600 dark:text-purple-400"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <input
                          type="number"
                          value={it.hours}
                          onChange={(e) => {
                            const updated = [...reportCreateItems];
                            updated[idx].hours = Number(e.target.value) || 0;
                            setReportCreateItems(updated);
                          }}
                          className="w-14 text-center bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 font-mono font-bold"
                        />
                      </td>
                      <td className="p-2 text-center font-mono font-black text-cyan-600 dark:text-cyan-300">
                        {(Number(it.count) || 0) * (Number(it.hours) || 8)}H
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setReportCreateItems(reportCreateItems.filter((_, i) => i !== idx));
                          }}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Final Action Bar */}
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                작성이 완료되면 등록 버튼을 눌러 결재함 및 특근보고서 보관함에 즉시 반영하세요.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("legacy_reports")}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-200"
                >
                  취소 / 보고서 관리로 이동
                </button>
                <button
                  type="button"
                  onClick={handleSaveCreatedReport}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? "등록 중..." : "📑 특근보고서 최종 등록"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📋 TAB 3: 일자별 종합 집계 (DAILY SUMMARY TABLE) */}
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
      {/* 📊 TAB 4: 9월 전사 종합현황판 (업체별 드롭다운 & 30일 전체 매트릭스) */}
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
      {/* 📑 TAB 5: 특근보고서 관리 (SATURDAY OVERTIME & OFFICIAL REPORTS) */}
      {/* ========================================================================= */}
      {activeTab === "legacy_reports" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          {/* Header & Plant Mapping Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>특근실시 보고서 관리</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                  ⚡ 공장별 실시간 자동 연동
                </span>
              </h3>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  handleAutoPopulateReport(selectedWeekendDay, "삼랑진공장");
                  setActiveTab("report_create");
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>✍️ 신규 특근보고서 작성</span>
              </button>

              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800">
                  🏭 삼랑진공장: (주)오륙, 유성
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                  🏭 한림공장: (주)조영산업, 한울, 부림텍
                </span>
              </div>
            </div>
          </div>

          {/* 🌟 다가올 주말 기준 공장별 취합 위젯 (삼랑진공장 & 한림공장 요약 카드) */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border-2 border-indigo-500/40 shadow-lg">
            {/* Weekend Selector Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
              <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>주말 특근 취합 기준일 선택:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { day: 5, label: "9월 5일(토) [1차 지난 주말]" },
                  { day: 12, label: "🌟 9월 12일(토) [다가올 이번 주말]" },
                  { day: 19, label: "9월 19일(토) [3차]" },
                  { day: 26, label: "9월 26일(토) [4차]" }
                ].map((wk) => (
                  <button
                    key={wk.day}
                    onClick={() => setSelectedWeekendDay(wk.day)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedWeekendDay === wk.day
                        ? "bg-indigo-600 text-white font-black ring-2 ring-indigo-400 shadow-md scale-105"
                        : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                    }`}
                  >
                    {wk.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2 Plant Weekend Cards Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5 pt-1">
              {/* Card 1: 삼랑진공장 ((주)오륙 + 유성 취합) */}
              <div
                onClick={() => {
                  const rep = legacyReports.find(r => r.id === weekendPlantSummary.samrangjin.reportId) || {
                    id: weekendPlantSummary.samrangjin.reportId,
                    plant: "삼랑진공장",
                    title: `2026년 9월 ${selectedWeekendDay}일(토) 삼랑진공장 특근실시 보고서`,
                    workDate: `2026-09-${String(selectedWeekendDay).padStart(2, "0")}`,
                    workDateFormatted: weekendPlantSummary.samrangjin.dateFormatted,
                    author: "양인나 선임",
                    authorTitle: "선임",
                    totalWorkers: weekendPlantSummary.samrangjin.headcount,
                    totalHours: weekendPlantSummary.samrangjin.manHours,
                    cost: weekendPlantSummary.samrangjin.cost,
                    approval: [
                      { role: "담당", name: "양인나", status: "완료" },
                      { role: "책임", name: "윤경수", status: "완료" },
                      { role: "이사", name: "이명재", status: "완료" },
                      { role: "대표", name: "권태형", status: "완료" }
                    ],
                    items: weekendPlantSummary.samrangjin.lines.map((ln, idx) => ({
                      id: idx + 1,
                      category: ln.name,
                      workContent: `삼랑진공장 ${ln.name} 특근 긴급 가동`,
                      names: "(주)오륙 + 유성 작업자",
                      hours: 8,
                      count: ln.count
                    }))
                  };
                  setSelectedLegacyReport(rep);
                  setIsLegacyModalOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/50 hover:border-amber-400 transition-all space-y-2.5 shadow-md cursor-pointer group"
                title="클릭 시 삼랑진공장 특근보고서 상세 보기"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between flex-wrap gap-1.5 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-white font-black text-xs shadow-xs">
                      삼랑진공장
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-950 text-amber-200 border border-amber-600/50 font-mono text-xs font-bold">
                      {weekendPlantSummary.samrangjin.dateFormatted}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {weekendPlantSummary.samrangjin.author}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm sm:text-base font-black text-rose-400 font-mono">
                      ₩{weekendPlantSummary.samrangjin.cost.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      ({weekendPlantSummary.samrangjin.headcount}명)
                    </span>
                  </div>
                </div>

                {/* Line Breakdown Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {weekendPlantSummary.samrangjin.lines.map((ln, idx) => (
                    <span
                      key={`${ln.name}_${idx}`}
                      className="px-2 py-0.5 rounded-md bg-slate-950 text-[11px] font-bold border border-slate-800 text-slate-300 flex items-center gap-1"
                    >
                      <span>{ln.name}:</span>
                      <strong className="text-purple-400 font-black">{ln.count}명</strong>
                    </span>
                  ))}
                </div>

                <div className="pt-1 flex justify-end">
                  <span className="text-[11px] font-black text-amber-400 group-hover:underline flex items-center gap-1">
                    <span>📑 삼랑진공장 특근보고서 상세 확인 및 결재</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Card 2: 한림공장 ((주)조영산업 + 한울 + 부림텍 취합) */}
              <div
                onClick={() => {
                  const rep = legacyReports.find(r => r.id === weekendPlantSummary.hallim.reportId) || {
                    id: weekendPlantSummary.hallim.reportId,
                    plant: "한림공장",
                    title: `2026년 9월 ${selectedWeekendDay}일(토) 한림공장 특근실시 보고서`,
                    workDate: `2026-09-${String(selectedWeekendDay).padStart(2, "0")}`,
                    workDateFormatted: weekendPlantSummary.hallim.dateFormatted,
                    author: weekendPlantSummary.hallim.author,
                    authorTitle: "선임",
                    totalWorkers: weekendPlantSummary.hallim.headcount,
                    totalHours: weekendPlantSummary.hallim.manHours,
                    cost: weekendPlantSummary.hallim.cost,
                    approval: [
                      { role: "담당", name: "우창용", status: "완료" },
                      { role: "책임", name: "김동욱", status: "완료" },
                      { role: "이사", name: "이명재", status: "완료" },
                      { role: "대표", name: "권태형", status: "완료" }
                    ],
                    items: weekendPlantSummary.hallim.lines.map((ln, idx) => ({
                      id: idx + 1,
                      category: ln.name,
                      workContent: `한림공장 ${ln.name} 특근 가동`,
                      names: "(주)조영산업 + 한울 + 부림텍 작업자",
                      hours: 8,
                      count: ln.count
                    }))
                  };
                  setSelectedLegacyReport(rep);
                  setIsLegacyModalOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/50 hover:border-emerald-400 transition-all space-y-2.5 shadow-md cursor-pointer group"
                title="클릭 시 한림공장 특근보고서 상세 보기"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between flex-wrap gap-1.5 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-xs shadow-xs">
                      한림공장
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-200 border border-emerald-600/50 font-mono text-xs font-bold">
                      {weekendPlantSummary.hallim.dateFormatted}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {weekendPlantSummary.hallim.author}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm sm:text-base font-black text-rose-400 font-mono">
                      ₩{weekendPlantSummary.hallim.cost.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      ({weekendPlantSummary.hallim.headcount}명)
                    </span>
                  </div>
                </div>

                {/* Line Breakdown Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {weekendPlantSummary.hallim.lines.map((ln, idx) => (
                    <span
                      key={`${ln.name}_${idx}`}
                      className="px-2 py-0.5 rounded-md bg-slate-950 text-[11px] font-bold border border-slate-800 text-slate-300 flex items-center gap-1"
                    >
                      <span>{ln.name}:</span>
                      <strong className="text-purple-400 font-black">{ln.count}명</strong>
                    </span>
                  ))}
                </div>

                <div className="pt-1 flex justify-end">
                  <span className="text-[11px] font-black text-emerald-400 group-hover:underline flex items-center gap-1">
                    <span>📑 한림공장 특근보고서 상세 확인 및 결재</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Plant Filter Buttons & Reports Archive Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">공장별 필터:</span>
                {["전체", "삼랑진공장", "한림공장"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedReportPlantFilter(p)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedReportPlantFilter === p
                        ? "bg-purple-600 text-white font-black shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white"
                    }`}
                  >
                    {p === "삼랑진공장" ? "🏭 삼랑진공장 ((주)오륙, 유성)" : p === "한림공장" ? "🏭 한림공장 ((주)조영, 한울, 부림텍)" : "전체 공장"}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-500 font-bold">
                총 <strong className="text-purple-600 dark:text-purple-400 font-mono text-sm">{legacyReports.length}</strong>건 등록됨
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {legacyReports
                .filter(r => selectedReportPlantFilter === "전체" || r.plant === selectedReportPlantFilter || (r.plant === "5개사 통합"))
                .map((rep) => {
                  const isSam = rep.plant === "삼랑진공장";
                  const isHal = rep.plant === "한림공장";

                  return (
                    <div
                      key={rep.id}
                      className={`bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border ${
                        isSam ? "border-amber-500/40 hover:border-amber-400" : isHal ? "border-emerald-500/40 hover:border-emerald-400" : "border-slate-200 dark:border-slate-700 hover:border-purple-400"
                      } space-y-2 transition-all shadow-xs`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${isSam ? "bg-amber-400" : isHal ? "bg-emerald-400" : "bg-purple-400"}`}></span>
                          <span>{rep.title || formatKoreanWorkDate(rep.workDate)}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-500 font-bold">{rep.workDateFormatted || rep.workDate}</span>
                        <span className={`text-[10.5px] font-black px-2 py-0.5 rounded ${
                          isSam ? "bg-amber-950 text-amber-300 border border-amber-800" : isHal ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-purple-950 text-purple-300 border border-purple-800"
                        }`}>
                          {rep.plant} {rep.companies ? `(${rep.companies.join(", ")})` : ""}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span>작성: <strong className="font-bold">{rep.author || "관리자"} {rep.authorTitle || ""}</strong></span>
                        <span className="font-bold text-purple-600 dark:text-purple-300 font-mono">
                          {rep.totalWorkers || rep.items?.length || 0}명 ({rep.totalHours || 0}H)
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedLegacyReport(rep);
                            setIsLegacyModalOpen(true);
                          }}
                          className={`w-full py-1.5 rounded-xl ${
                            isSam ? "bg-amber-600 hover:bg-amber-500" : isHal ? "bg-emerald-600 hover:bg-emerald-500" : "bg-purple-600 hover:bg-purple-500"
                          } text-white font-black text-xs transition-all cursor-pointer shadow-sm active:scale-95 text-center flex items-center justify-center gap-1`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>특근보고서 상세 보기 / 결재</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
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

      {/* 📑 MODAL: 특근보고서 상세 모달 */}
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
                        <td className="p-2 font-bold">{it.factory || it.company || selectedLegacyReport.plant || "-"}</td>
                        <td className="p-2">{it.category || it.carType || it.line || "-"}</td>
                        <td className="p-2 font-bold">{it.workerName || it.names || "-"}</td>
                        <td className="p-2">{it.startTime || "08:00"} ~ {it.endTime || "17:00"}</td>
                        <td className="p-2 font-mono font-bold text-purple-600">{(it.hours || 8) * (it.count || 1)}H</td>
                        <td className="p-2 text-slate-500">{it.workContent || it.workDetails || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsLegacyModalOpen(false);
                  if (selectedLegacyReport.workDate) {
                    const dayMatch = selectedLegacyReport.workDate.match(/\d{4}-\d{2}-(\d{2})/);
                    if (dayMatch) {
                      setReportCreateDay(Number(dayMatch[1]));
                    }
                  }
                  if (selectedLegacyReport.plant) {
                    setReportCreatePlant(selectedLegacyReport.plant);
                  }
                  if (selectedLegacyReport.title) {
                    setReportCreateTitle(selectedLegacyReport.title);
                  }
                  if (selectedLegacyReport.author) {
                    setReportCreateAuthor(selectedLegacyReport.author);
                  }
                  if (selectedLegacyReport.items && selectedLegacyReport.items.length > 0) {
                    setReportCreateItems(selectedLegacyReport.items);
                  }
                  if (selectedLegacyReport.reasons) {
                    setReportCreateReasons(selectedLegacyReport.reasons.join("\n"));
                  }
                  setActiveTab("report_create");
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>이 보고서 수정/재발행하기</span>
              </button>

              <button
                onClick={() => setIsLegacyModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs cursor-pointer"
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
