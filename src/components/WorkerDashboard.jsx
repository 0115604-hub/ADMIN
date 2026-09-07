import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Factory,
  Calendar,
  Clock,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  Layers,
  ArrowUpRight,
  Search,
  Filter,
  Save,
  Edit3,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  PauseCircle,
  CheckSquare,
  Wrench,
  BarChart2,
  ArrowRight,
  Building2,
  CheckCheck,
  FileSpreadsheet,
  FileCheck,
  Sparkles,
  RotateCw,
  MessageSquare,
  Palmtree,
  CalendarDays,
  X,
  Users,
  Smartphone,
  Laptop,
  History,
  Radio,
  Activity,
  Crown,
  Lock,
  FileSignature,
  Stamp,
  Send
} from "lucide-react";
import { useAuth, PLANTS } from "../context/AuthContext";
import { useMonth } from "../context/MonthContext";
import { useCurrency } from "../context/CurrencyContext";
import {
  getLocalApprovalDocs,
  subscribeApprovalDocs,
  checkApprovalPermission,
  approveDocumentStep,
  holdDocumentStep,
  rejectDocumentStep
} from "../services/approvalService";
import { getLocalAccessLogs, subscribeAccessLogs } from "../services/accessLogService";
import { parseExtrusionExcelFile, saveExtrusionDowntimeBatch, clearAllExtrusionDowntimeLogs } from "../services/extrusionDowntimeService";
import {
  getLocalOvertimeReports,
  subscribeOvertimeReports,
  getLatestOvertimeSummary
} from "../services/overtimeService";
import {
  getWorkLogs,
  saveWorkLog,
  deleteWorkLog,
  subscribeWorkLogs,
  approveWorkLog,
  batchApproveWorkLogs,
  rejectWorkLog
} from "../services/workLogService";
import {
  getAnnualLeaves,
  subscribeAnnualLeaves,
  saveAnnualLeave,
  deleteAnnualLeave,
  getUserLeaveStatus
} from "../services/annualLeaveService";
import {
  subscribeQualityRecords,
  saveQualityRecordsBatch,
  getQualityMonthlyAggregation,
  getQualityDailyAggregation,
  getPreviousYearMonth,
  parseQualityExcelFiles,
  QUALITY_CORE_ITEMS
} from "../services/qualityService";
import {
  getLocalCommonSchedules,
  saveCommonSchedule,
  deleteCommonSchedule,
  subscribeCommonSchedules,
  getTodayCommonSchedules
} from "../services/commonScheduleService";
import { sendDailyPnLMorningBriefingTelegram } from "../services/telegramService";
import { getKSTDateString, formatRelativeAccessTime } from "../utils/dateUtils";

// Extrusion 4-Lines Summary (PCM 1호, PCM 3호, PVC, TPE) - Real Excel Verified
const EXTRUSION_SUMMARY = [
  {
    line: "압출 1호 (PCM #1)",
    code: "PCM #1",
    themeColor: "teal",
    currentMonth: "9월",
    currentMonthMin: 570,
    currentMonthHours: "9.5h",
    lossRate: "6.6%",
    opRatio: "92.1",
    monthlyTrend: [
      { month: "7월", min: 5622, hours: "93.7h", loss: "7.2%" },
      { month: "8월", min: 3643, hours: "60.7h", loss: "5.3%" },
      { month: "9월", min: 570, hours: "9.5h", loss: "6.6%", isCurrent: true }
    ],
    weeklyTrend: [
      { week: "1주", min: 570 }
    ]
  },
  {
    line: "압출 3호 (PCM #3)",
    code: "PCM #3",
    themeColor: "blue",
    currentMonth: "9월",
    currentMonthMin: 690,
    currentMonthHours: "11.5h",
    lossRate: "6.6%",
    opRatio: "90.4",
    monthlyTrend: [
      { month: "7월", min: 6835, hours: "113.9h", loss: "7.6%" },
      { month: "8월", min: 4835, hours: "80.6h", loss: "6.3%" },
      { month: "9월", min: 690, hours: "11.5h", loss: "6.6%", isCurrent: true }
    ],
    weeklyTrend: [
      { week: "1주", min: 690 }
    ]
  },
  {
    line: "압출 PVC 라인",
    code: "PVC",
    themeColor: "amber",
    currentMonth: "9월",
    currentMonthMin: 1440,
    currentMonthHours: "24.0h",
    lossRate: "8.3%",
    opRatio: "80.0",
    monthlyTrend: [
      { month: "7월", min: 25876, hours: "431.3h", loss: "10.4%" },
      { month: "8월", min: 15529, hours: "258.8h", loss: "3.5%" },
      { month: "9월", min: 1440, hours: "24.0h", loss: "8.3%", isCurrent: true }
    ],
    weeklyTrend: [
      { week: "1주", min: 1440 }
    ]
  },
  {
    line: "압출 TPE 라인",
    code: "TPE",
    themeColor: "purple",
    currentMonth: "9월",
    currentMonthMin: 180,
    currentMonthHours: "3.0h",
    lossRate: "4.7%",
    opRatio: "97.5",
    monthlyTrend: [
      { month: "7월", min: 9925, hours: "165.4h", loss: "3.7%" },
      { month: "8월", min: 5970, hours: "99.5h", loss: "10.3%" },
      { month: "9월", min: 180, hours: "3.0h", loss: "4.7%", isCurrent: true }
    ],
    weeklyTrend: [
      { week: "1주", min: 180 }
    ]
  }
];

// Quality 4 Core Items Summary (당월 누적 불량률)
const QUALITY_MONTHLY_SUMMARY = [
  { id: "ja", name: "JA G-RUN", inspectQty: 57596, defectQty: 732, defectRate: 1.27, isMax: false },
  { id: "nx4a", name: "NX4a G-RUN", inspectQty: 50400, defectQty: 302, defectRate: 0.60, isMax: false },
  { id: "nx4", name: "NX4 G-RUN", inspectQty: 25880, defectQty: 34, defectRate: 0.13, isMax: false },
  { id: "hr", name: "HR G-RUN", inspectQty: 20858, defectQty: 270, defectRate: 1.29, isMax: true }
];

// Quality 4 Core Items Summary (일일 불량률)
const QUALITY_DAILY_SUMMARY = [
  { id: "ja", name: "JA G-RUN", inspectQty: 1563, defectQty: 7, defectRate: 0.45, isMax: false },
  { id: "nx4a", name: "NX4a G-RUN", inspectQty: 960, defectQty: 4, defectRate: 0.42, isMax: false },
  { id: "nx4", name: "NX4 G-RUN", inspectQty: 1100, defectQty: 3, defectRate: 0.27, isMax: false },
  { id: "hr", name: "HR G-RUN", inspectQty: 627, defectQty: 7, defectRate: 1.12, isMax: true }
];

const QUALITY_SUMMARY = QUALITY_MONTHLY_SUMMARY;

// Split Overtime Summary (삼랑진공장 & 한림공장)
const SAMRANGJIN_OVERTIME = {
  plant: "삼랑진공장",
  date: "2026-08-29 (토)",
  author: "양인나 선임",
  headcount: 32,
  manHours: 272,
  cost: 4080000,
  monthHeadcount: 128,
  monthManHours: 1088,
  monthCumulativeCost: 16320000,
  approval: [
    { role: "담당", name: "양인나" },
    { role: "책임", name: "윤경수" },
    { role: "이사", name: "이명재" },
    { role: "대표", name: "권태형" }
  ],
  lines: [
    { name: "JA", count: 9 },
    { name: "NX4", count: 8 },
    { name: "압출", count: 4 },
    { name: "코팅", count: 3 },
    { name: "DT", count: 8 }
  ],
  reason: "PCM 1/3호/TPE 형교환 생산, DT HOOD 코팅 납품 대응, NX4a 수출창고 입고"
};

const HANLIM_OVERTIME = {
  plant: "한림공장",
  date: "2026-08-29 (토)",
  author: "우창용 선임",
  headcount: 12,
  manHours: 96,
  cost: 1440000,
  monthHeadcount: 48,
  monthManHours: 384,
  monthCumulativeCost: 5760000,
  approval: [
    { role: "담당", name: "우창용" },
    { role: "책임", name: "김동욱" },
    { role: "이사", name: "이명재" },
    { role: "대표", name: "권태형" }
  ],
  lines: [
    { name: "JK1", count: 4 },
    { name: "CHANNEL", count: 3 },
    { name: "CE1/DT", count: 3 },
    { name: "관리", count: 2 }
  ],
  reason: "CHANNEL 밴딩/가공 지원, JK1 조인트 및 후가공 납품 대응, PU KD 재고 확보"
};

export const WorkerDashboard = ({ onBulkUpload, onNavigateTab }) => {
  const { currentProfile, isOperator, isAdmin } = useAuth();
  const { selectedMonth, currentMonthData, uploadMonthlyData, availableMonths, changeMonth, currentYearMonth, isCurrentMonth, allMonthlyData } = useMonth();
  const { formatAmount } = useCurrency();

  const workerPlant = currentProfile?.plant || "삼랑진공장";
  const workerFullName = currentProfile?.name || "작업자";
  const officialTitle = currentProfile?.title || "선임";
  const assignedProcess = currentProfile?.assignedProcess || "가공동 관리";
  const isInjoo = currentProfile?.name === "조인주" || currentProfile?.id === "sam_ij";
  const isQualityWorker = currentProfile?.assignedProcess === "품질관리" || currentProfile?.name === "이창엽" || currentProfile?.name === "이상기" || currentProfile?.id === "sam_cy" || currentProfile?.id === "sam_sg";
  const isExtrusionWorker = currentProfile?.name === "설유철" || currentProfile?.id === "sam_yc" || currentProfile?.assignedProcess?.includes("압출") || (assignedProcess?.includes("압출"));
  const isChangyong = currentProfile?.name === "우창용" || currentProfile?.id === "hal_cy";

  // General Manager Identification
  const isMyeongjae = currentProfile?.name === "이명재" || currentProfile?.id === "sam_mj";
  const isDongwook = currentProfile?.name === "김동욱" || currentProfile?.id === "hal_dw";
  const isGeneralManager = isMyeongjae || isDongwook || isAdmin || currentProfile?.assignedProcess === "총괄관리";

  // Approval Documents Subscription (Real-time for Top Panel)
  const [approvalDocs, setApprovalDocs] = useState(() => getLocalApprovalDocs());

  useEffect(() => {
    const unsub = subscribeApprovalDocs((docs) => {
      setApprovalDocs(docs);
    });
    return () => unsub();
  }, []);

  const pendingOrHoldDocs = useMemo(() => {
    return approvalDocs.filter((d) => d.status === "IN_PROGRESS" || d.status === "HOLD");
  }, [approvalDocs]);

  const pendingCount = useMemo(() => approvalDocs.filter((d) => d.status === "IN_PROGRESS").length, [approvalDocs]);
  const holdCount = useMemo(() => approvalDocs.filter((d) => d.status === "HOLD").length, [approvalDocs]);

  // Plant-specific approval authority
  const canApproveSamrangjin = isMyeongjae || (currentProfile?.plant === "삼랑진공장" && currentProfile?.assignedProcess === "총괄관리") || isAdmin;
  const canApproveHallim = isDongwook || (currentProfile?.plant === "한림공장" && currentProfile?.assignedProcess === "총괄관리") || isAdmin;

  const canApproveLog = (log) => {
    if (!log) return false;
    if (isAdmin) return true;
    if (log.plant === "삼랑진공장" && canApproveSamrangjin) return true;
    if (log.plant === "한림공장" && canApproveHallim) return true;
    return false;
  };

  const [workLogs, setWorkLogs] = useState(() => getWorkLogs());
  const LOGS_PER_PAGE = 12;
  const [currentLogPage, setCurrentLogPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlant, setFilterPlant] = useState(() => {
    if (isMyeongjae) return "삼랑진공장";
    if (isDongwook) return "한림공장";
    return "all";
  });
  const [logSavedToast, setLogSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("업무일지가 저장되었습니다.");
  const [approvalCommentInput, setApprovalCommentInput] = useState("");

  // Sync approval comment when modal opens/changes
  useEffect(() => {
    if (selectedLogDetail) {
      setApprovalCommentInput(
        selectedLogDetail.approvalComment && selectedLogDetail.approvalComment !== "확인 및 전자결재 승인 완료"
          ? selectedLogDetail.approvalComment
          : ""
      );
    } else {
      setApprovalCommentInput("");
    }
  }, [selectedLogDetail]);

  // Access Logs State for ADMIN
  const [selectedWorkerForLogs, setSelectedWorkerForLogs] = useState(null);
  const [accessLogs, setAccessLogs] = useState(() => getLocalAccessLogs());

  // Real-time Cloud Synchronization for Access Logs
  useEffect(() => {
    const unsub = subscribeAccessLogs((logs) => {
      setAccessLogs(logs);
    });
    return () => unsub();
  }, []);

  // Real-time Overtime Reports State & Summary (마지막 수정본 자동 반영)
  const [overtimeReports, setOvertimeReports] = useState(() => getLocalOvertimeReports());

  useEffect(() => {
    const unsub = subscribeOvertimeReports((reports) => {
      setOvertimeReports(reports);
    });
    return () => unsub();
  }, []);

  const overtimeSummary = useMemo(() => {
    return getLatestOvertimeSummary(overtimeReports);
  }, [overtimeReports]);

  const handleOpenWorkerLogs = (worker) => {
    const freshLogs = getLocalAccessLogs();
    setAccessLogs(freshLogs);
    setSelectedWorkerForLogs(worker);
  };

  // Injoo's Excel Upload State
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Changyeop's Quality 2-Files Upload State
  const qualityFileInputRef = useRef(null);
  const [qualityDragActive, setQualityDragActive] = useState(false);
  const [qualityParsing, setQualityParsing] = useState(false);
  const [qualityUploading, setQualityUploading] = useState(false);
  const [qualityFiles, setQualityFiles] = useState([]);
  const [qualityRawFiles, setQualityRawFiles] = useState([]);
  const [qualityUploadSuccess, setQualityUploadSuccess] = useState(false);
  const [qualitySuccessMessage, setQualitySuccessMessage] = useState("");

  // Quality Real-time data for Dashboard
  const [qualityRecords, setQualityRecords] = useState([]);
  useEffect(() => {
    const unsub = subscribeQualityRecords((recs) => {
      setQualityRecords(recs);
    });
    return () => unsub();
  }, []);

  const prevYearMonth = useMemo(() => {
    return getPreviousYearMonth(selectedMonth || currentYearMonth || "2026-09");
  }, [selectedMonth, currentYearMonth]);

  const prevMonthLabel = useMemo(() => {
    const m = prevYearMonth.slice(5, 7);
    return `${m}월`;
  }, [prevYearMonth]);

  const liveQualityPrevMonthly = useMemo(() => {
    return getQualityMonthlyAggregation(qualityRecords, prevYearMonth);
  }, [qualityRecords, prevYearMonth]);

  const liveQualityDaily = useMemo(() => {
    return getQualityDailyAggregation(qualityRecords, selectedMonth || "2026-08");
  }, [qualityRecords, selectedMonth]);

  const latestDayInfo = useMemo(() => {
    if (liveQualityDaily.length > 0) return liveQualityDaily[0];
    return {
      date: "2026-08-29",
      dayOfWeek: "토",
      totalInspectQty: 4810,
      totalDefectQty: 21,
      defectRate: 0.44,
      items: {
        ja: { inspectQty: 1563, defectQty: 7, defectRate: 0.45 },
        nx4a: { inspectQty: 960, defectQty: 4, defectRate: 0.42 },
        nx4: { inspectQty: 1100, defectQty: 3, defectRate: 0.27 },
        hr: { inspectQty: 627, defectQty: 7, defectRate: 1.12 }
      }
    };
  }, [liveQualityDaily]);

  const latestDateLabel = useMemo(() => {
    if (!latestDayInfo?.date) return "당일 실적";
    const parts = latestDayInfo.date.split("-");
    if (parts.length === 3) {
      const daySuffix = latestDayInfo.dayOfWeek ? ` (${latestDayInfo.dayOfWeek})` : "";
      return `${parts[1]}월 ${parts[2]}일${daySuffix}`;
    }
    return latestDayInfo.date;
  }, [latestDayInfo]);

  // Sort daily quality items by defect rate descending (불량률 높은 아이템 순서로 정렬)
  const sortedDailyQualityItems = useMemo(() => {
    return QUALITY_CORE_ITEMS.map((core) => {
      const dayItem = latestDayInfo.items?.[core.id] || { inspectQty: 0, defectQty: 0, defectRate: 0 };
      return {
        ...core,
        inspectQty: dayItem.inspectQty || 0,
        defectQty: dayItem.defectQty || 0,
        defectRate: Number(dayItem.defectRate) || 0
      };
    }).sort((a, b) => (Number(b.defectRate) || 0) - (Number(a.defectRate) || 0));
  }, [latestDayInfo]);

  const [formData, setFormData] = useState({
    date: getKSTDateString(),
    plant: workerPlant,
    writer: workerFullName,
    process: isInjoo ? "경리업무" : isQualityWorker ? "품질관리" : assignedProcess,
    shift: "주간",
    line: isInjoo ? "본사/현장 정산 및 전표 마감" : isQualityWorker ? "전라인 품질 검사 및 불량 분석" : "9BQC 압출 1호기",
    workContent: "",
    issues: ""
  });

  useEffect(() => {
    if (currentProfile) {
      setFormData((prev) => ({
        ...prev,
        plant: workerPlant,
        writer: workerFullName,
        process: isInjoo ? "경리업무" : isQualityWorker ? "품질관리" : (currentProfile.assignedProcess || prev.process || "가공동 관리"),
        line: isInjoo ? "본사/현장 정산 및 전표 마감" : isQualityWorker ? "전라인 품질 검사 및 불량 분석" : prev.line
      }));

      // Automatically focus on manager's dedicated plant
      if (isMyeongjae) setFilterPlant("삼랑진공장");
      else if (isDongwook) setFilterPlant("한림공장");
    }
  }, [currentProfile, isOperator, workerFullName, workerPlant, assignedProcess, isInjoo, isQualityWorker, isMyeongjae, isDongwook]);

  // Real-time Cloud Synchronization for Work Logs across all mobile phones & PCs
  useEffect(() => {
    const unsubscribe = subscribeWorkLogs((logs) => {
      setWorkLogs(logs);
    });
    return () => unsubscribe();
  }, []);

  // Pending Approvals Count for General Managers
  const pendingSamrangjinCount = useMemo(() => {
    return workLogs.filter((l) => l.plant === "삼랑진공장" && l.approvalStatus !== "결재완료").length;
  }, [workLogs]);

  const pendingHallimCount = useMemo(() => {
    return workLogs.filter((l) => l.plant === "한림공장" && l.approvalStatus !== "결재완료").length;
  }, [workLogs]);

  // Approval Handlers (With Comment Support)
  const handleApproveLog = async (logId, customComment) => {
    const finalComment = (typeof customComment === "string" && customComment.trim())
      ? customComment.trim()
      : (approvalCommentInput.trim() || "확인 및 전자결재 승인 완료");

    const approver = {
      name: currentProfile?.name || "총괄관리자",
      title: currentProfile?.title || "이사",
      plant: currentProfile?.plant || "",
      comment: finalComment
    };
    const updated = await approveWorkLog(logId, approver);
    setWorkLogs(updated);
    if (selectedLogDetail && String(selectedLogDetail.id) === String(logId)) {
      setSelectedLogDetail(updated.find((l) => String(l.id) === String(logId)) || null);
    }
    setToastMessage("결재 및 지시사항 코멘트가 정상적으로 등록되었습니다.");
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 3000);
  };

  const handleRejectLog = async (logId) => {
    const reason = window.prompt("반려 사유 또는 보완 요청 사항을 입력해주세요:", "내용 보완 후 재상신 요망");
    if (!reason) return;

    const approver = {
      name: currentProfile?.name || "총괄관리자",
      title: currentProfile?.title || "이사",
      plant: currentProfile?.plant || ""
    };
    const updated = await rejectWorkLog(logId, approver, reason);
    setWorkLogs(updated);
    if (selectedLogDetail && String(selectedLogDetail.id) === String(logId)) {
      setSelectedLogDetail(updated.find((l) => String(l.id) === String(logId)) || null);
    }
    setToastMessage("업무일지가 반려 처리되었습니다.");
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 3000);
  };

  // Annual Leaves State & Real-time Cloud Subscription
  const [annualLeaves, setAnnualLeaves] = useState(() => getAnnualLeaves());
  const [leaveForm, setLeaveForm] = useState({
    startDate: getKSTDateString(),
    endDate: getKSTDateString(),
    leaveType: "연차(전일)",
    reason: ""
  });
  const [leaveSaving, setLeaveSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeAnnualLeaves((leaves) => {
      setAnnualLeaves(leaves);
    });
    return () => unsub();
  }, []);

  const myLeaveStatus = useMemo(() => {
    return getUserLeaveStatus(currentProfile?.id, workerFullName, annualLeaves || []);
  }, [currentProfile, workerFullName, annualLeaves]);

  const myLeaves = useMemo(() => {
    if (!annualLeaves || !Array.isArray(annualLeaves)) return [];
    return annualLeaves.filter(
      (l) => Boolean(l && (((currentProfile?.id && l.userId === currentProfile.id) || (workerFullName && l.userName === workerFullName))))
    );
  }, [annualLeaves, currentProfile, workerFullName]);

  const handleRegisterLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.startDate) {
      alert("일자를 선택해 주세요.");
      return;
    }
    setLeaveSaving(true);
    try {
      const newLeave = {
        userId: currentProfile?.id || `user_${workerFullName}`,
        userName: workerFullName,
        plant: workerPlant,
        title: officialTitle,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate || leaveForm.startDate,
        leaveType: leaveForm.leaveType,
        reason: leaveForm.reason || leaveForm.leaveType
      };
      await saveAnnualLeave(newLeave);
      setToastMessage(`${leaveForm.leaveType} 일정이 정상적으로 등록되었습니다.`);
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
      setLeaveForm({
        startDate: getKSTDateString(),
        endDate: getKSTDateString(),
        leaveType: "연차(전일)",
        reason: ""
      });
    } catch (err) {
      alert("일정 등록 중 오류 발생: " + err.message);
    } finally {
      setLeaveSaving(false);
    }
  };

  const handleDeleteLeave = async (leaveId) => {
    if (!window.confirm("이 연차 일정을 취소/삭제하시겠습니까?")) return;
    await deleteAnnualLeave(leaveId);
    setToastMessage("연차 일정이 삭제되었습니다.");
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 3000);
  };

  // -------------------------------------------------------------------------
  // 🗓️ 우창용 선임 전용 심플 스마트 일정 관리 States & Handlers
  // -------------------------------------------------------------------------
  const [changyongSelectedDate, setChangyongSelectedDate] = useState(() => getKSTDateString());
  const [changyongLeaveType, setChangyongLeaveType] = useState("연차(전일)");
  const [changyongReasonInput, setChangyongReasonInput] = useState("");
  const [changyongSaving, setChangyongSaving] = useState(false);
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);

  const [changyongCalYM, setChangyongCalYM] = useState(() => getKSTDateString().slice(0, 7));

  const handlePrevCalMonth = () => {
    setChangyongCalYM((prev) => {
      const [yearStr, monthStr] = prev.split("-");
      let year = parseInt(yearStr, 10);
      let month = parseInt(monthStr, 10) - 1;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
      return `${year}-${String(month).padStart(2, "0")}`;
    });
  };

  const handleNextCalMonth = () => {
    setChangyongCalYM((prev) => {
      const [yearStr, monthStr] = prev.split("-");
      let year = parseInt(yearStr, 10);
      let month = parseInt(monthStr, 10) + 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      return `${year}-${String(month).padStart(2, "0")}`;
    });
  };

  const handleResetToToday = () => {
    const today = getKSTDateString();
    setChangyongCalYM(today.slice(0, 7));
    setChangyongSelectedDate(today);
  };

  // 우창용 선임이 등록한 전체 일정 목록 (최신순)
  const changyongMyLeaves = useMemo(() => {
    if (!annualLeaves || !Array.isArray(annualLeaves)) return [];
    return annualLeaves
      .filter((l) => Boolean(l && (l.userId === "hal_cy" || l.userName === "우창용")))
      .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
  }, [annualLeaves]);

  // Mini Calendar Days
  const changyongCalendarDays = useMemo(() => {
    if (!changyongCalYM) return [];
    const [yearStr, monthStr] = changyongCalYM.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const totalDays = new Date(year, month, 0).getDate();
    const todayStr = getKSTDateString();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ isEmpty: true, key: `empty-${i}` });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = (firstDayIndex + d - 1) % 7;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === changyongSelectedDate;

      const dayEvents = (annualLeaves || []).filter(
        (l) =>
          Boolean(l && (l.userId === "hal_cy" || l.userName === "우창용")) &&
          l.startDate <= dateStr &&
          (l.endDate || l.startDate) >= dateStr
      );

      days.push({
        isEmpty: false,
        key: `day-${d}`,
        dayNumber: d,
        dateStr,
        dayOfWeek,
        isToday,
        isSelected,
        events: dayEvents
      });
    }

    return days;
  }, [changyongCalYM, changyongSelectedDate, annualLeaves]);

  const handleChangyongRegisterSchedule = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!changyongSelectedDate) {
      alert("일정을 등록할 일자를 선택해주세요.");
      return;
    }
    setChangyongSaving(true);
    try {
      const newLeave = {
        userId: "hal_cy",
        userName: "우창용",
        plant: "한림공장",
        title: "선임",
        startDate: changyongSelectedDate,
        endDate: changyongSelectedDate,
        leaveType: changyongLeaveType,
        reason: changyongReasonInput.trim() || changyongLeaveType
      };
      await saveAnnualLeave(newLeave);
      setToastMessage(`[우창용 선임] ${changyongSelectedDate} ${changyongLeaveType} 일정이 등록되었습니다.`);
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
      setChangyongReasonInput("");
    } catch (err) {
      alert("일정 등록 중 오류가 발생했습니다: " + err.message);
    } finally {
      setChangyongSaving(false);
    }
  };

  // 태형&미영 일정 State & Subscription
  const [commonSchedules, setCommonSchedules] = useState(() => getLocalCommonSchedules());
  const [commonScheduleForm, setCommonScheduleForm] = useState({
    date: getKSTDateString(),
    time: "09:30",
    target: "세미나",
    title: ""
  });
  const [commonScheduleSaving, setCommonScheduleSaving] = useState(false);
  const [commonScheduleModalOpen, setCommonScheduleModalOpen] = useState(false);
  const [dailyPnLModalOpen, setDailyPnLModalOpen] = useState(false);
  const [sendingDailyPnL, setSendingDailyPnL] = useState(false);
  const [customPnLBriefing, setCustomPnLBriefing] = useState(null);

  useEffect(() => {
    const unsub = subscribeCommonSchedules((scheds) => {
      setCommonSchedules(scheds);
    });
    return () => unsub();
  }, []);

  const todayDateStr = getKSTDateString();
  const todayCommonSchedules = useMemo(() => {
    if (!commonSchedules || !Array.isArray(commonSchedules)) return [];
    return commonSchedules.filter((s) => s.date === todayDateStr);
  }, [commonSchedules, todayDateStr]);

  const handleRegisterCommonSchedule = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!commonScheduleForm.title?.trim()) {
      alert("일정 내용을 입력해 주세요.");
      return;
    }
    setCommonScheduleSaving(true);
    try {
      await saveCommonSchedule({
        ...commonScheduleForm,
        author: currentProfile?.name || "관리자"
      });
      setToastMessage("일정이 정상적으로 등록되었습니다.");
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
      setCommonScheduleForm((prev) => ({
        ...prev,
        title: ""
      }));
      setCommonScheduleModalOpen(false);
    } catch (err) {
      alert("일정 등록 중 오류 발생: " + err.message);
    } finally {
      setCommonScheduleSaving(false);
    }
  };

  const handleDeleteCommonSchedule = async (id) => {
    if (!window.confirm("이 일정을 삭제하시겠습니까?")) return;
    await deleteCommonSchedule(id);
    setToastMessage("일정이 삭제되었습니다.");
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 3000);
  };

  const monthParts = selectedMonth.split("-");
  const monthTitle = `${monthParts[0]}년 ${monthParts[1]}월`;

  const totalSales = currentMonthData?.salesSummary?.totalSales || 1756104735;
  const totalPurchases = currentMonthData?.purchaseSummary?.ledgerBenchmark || currentMonthData?.jajaeSummary?.totalAmount || 1248400884.5;
  const purchaseRatio = totalSales > 0 ? ((totalPurchases / totalSales) * 100).toFixed(1) : "71.1";

  // PnL Achievement calculations for Morning Briefing
  const prevMonthKey = useMemo(() => {
    if (!selectedMonth) return "2026-08";
    const [y, m] = selectedMonth.split("-").map(Number);
    const prevD = new Date(y, m - 2, 1);
    const prevY = prevD.getFullYear();
    const prevM = String(prevD.getMonth() + 1).padStart(2, "0");
    return `${prevY}-${prevM}`;
  }, [selectedMonth]);

  const prevMonthData = useMemo(() => {
    return allMonthlyData?.[prevMonthKey] || null;
  }, [allMonthlyData, prevMonthKey]);

  const prevSales = prevMonthData?.salesSummary?.totalSales || 1714856000;
  const prevPurchases = prevMonthData?.purchaseSummary?.ledgerBenchmark || prevMonthData?.jajaeSummary?.totalAmount || 1264841000;

  const salesAchievementPct = prevSales > 0 ? ((totalSales / prevSales) * 100).toFixed(1) : "102.4";
  const purchaseAchievementPct = prevPurchases > 0 ? ((totalPurchases / prevPurchases) * 100).toFixed(1) : "98.7";

  const [selectedPnLChannel, setSelectedPnLChannel] = useState("-1003939516875"); // Default: 경영방 (대표·전무 전용)

  const handleSendDailyPnLTelegram = async () => {
    setSendingDailyPnL(true);
    try {
      const todaySchedsText = todayCommonSchedules.length > 0
        ? todayCommonSchedules.map((s) => `• ${s.time && s.time !== "종일" ? `[${s.time}] ` : ""}${s.target ? `[${s.target}] ` : ""}${s.title}`).join("\n")
        : "• 등록된 전사 공통일정이 없습니다. (정상 생산 가동)";

      const channelName = selectedPnLChannel === "-1003939516875" ? "경영방 (대표·전무)" : selectedPnLChannel === "290615483" ? "대표님 1:1" : "오륙 통합방";

      const res = await sendDailyPnLMorningBriefingTelegram({
        salesAmount: customPnLBriefing?.salesAmount ?? totalSales,
        purchaseAmount: customPnLBriefing?.purchaseAmount ?? totalPurchases,
        salesAchievementRate: customPnLBriefing?.salesAchievementRate || `${salesAchievementPct}% (${Number(salesAchievementPct) >= 100 ? `▲ +${(Number(salesAchievementPct) - 100).toFixed(1)}%` : `▼ ${(Number(salesAchievementPct) - 100).toFixed(1)}%`})`,
        purchaseAchievementRate: customPnLBriefing?.purchaseAchievementRate || `${purchaseAchievementPct}% (${Number(purchaseAchievementPct) <= 100 ? `▼ ${(100 - Number(purchaseAchievementPct)).toFixed(1)}% 절감` : `▲ +${(Number(purchaseAchievementPct) - 100).toFixed(1)}% 증가`})`,
        commonSchedules: customPnLBriefing?.commonSchedules || todaySchedsText,
        targetChatId: selectedPnLChannel
      }, selectedPnLChannel);

      if (res.success) {
        setToastMessage(`[${channelName}]으로 아침 손익결산 브리핑이 발송되었습니다.`);
        setLogSavedToast(true);
        setTimeout(() => setLogSavedToast(false), 3000);
        setDailyPnLModalOpen(false);
      } else {
        alert("전송 실패: " + (res.error || "설정을 확인해주세요."));
      }
    } catch (err) {
      alert("발송 중 오류 발생: " + err.message);
    } finally {
      setSendingDailyPnL(false);
    }
  };


  const generateLineMatchShareText = (matches, dateStr, writerName) => {
    if (!matches || matches.length === 0) return "";
    const totalMin = matches.reduce((acc, cur) => acc + (cur.totalMinutes || 0), 0);
    let text = `[오륙산업 삼랑진공장 - 압출동 라인별 비가동 엑셀 업로드 및 매칭 내역 공유]
`;
    text += `• 작성자: ${writerName || "설유철 책임"} (${dateStr || getKSTDateString()})
`;
    text += `• 업로드 라인: 총 ${matches.length}개 라인 (합계 비가동 ${totalMin}분)

`;

    matches.forEach((m, idx) => {
      text += `${idx + 1}. [${m.lineName}] ${m.fileName} (${m.totalMinutes || 0}분)
`;
      if (m.records && m.records.length > 0) {
        m.records.forEach((r) => {
          text += `   - ${r.reason} (${r.durationMinutes}분): ${r.details || "-"}
`;
          if (r.actionTaken) text += `     [조치] ${r.actionTaken}
`;
        });
      } else {
        text += `   - 비가동 정상 접수 및 가동 완료
`;
      }
      text += "\n";
    });

    text += `▶ 실시간 시스템 확인: https://profit-and-loss-7d09b.web.app`;
    return text;
  };

  const handleCopyLineMatchText = (matches, dateStr, writerName) => {
    const text = generateLineMatchShareText(matches, dateStr, writerName);
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    }).catch((err) => {
      console.error("Clipboard error:", err);
    });
  };

  // Seol Yoo-cheol Extrusion Multi-Files Handler (4~6 Line Excel Files)
  const [extrusionFiles, setExtrusionFiles] = useState([]);
  const [lineMatchShareModal, setLineMatchShareModal] = useState(null);
  const [copyToast, setCopyToast] = useState(false);
  const [extrusionDragActive, setExtrusionDragActive] = useState(false);
  const [extrusionParsing, setExtrusionParsing] = useState(false);
  const [extrusionUploading, setExtrusionUploading] = useState(false);
  const [extrusionUploadSuccess, setExtrusionUploadSuccess] = useState(false);
  const [extrusionSuccessMessage, setExtrusionSuccessMessage] = useState("");
  const extrusionFileInputRef = useRef(null);

  const handleExtrusionFiles = async (files) => {
    if (!files || files.length === 0) return;
    setExtrusionParsing(true);
    setExtrusionUploadSuccess(false);
    setExtrusionSuccessMessage("");

    const newParsedList = [...extrusionFiles];
    for (const f of Array.from(files)) {
      try {
        const parsed = await parseExtrusionExcelFile(f);
        const existingIdx = newParsedList.findIndex((item) => item.fileName === f.name);
        if (existingIdx >= 0) {
          newParsedList[existingIdx] = parsed;
        } else {
          newParsedList.push(parsed);
        }
      } catch (err) {
        console.warn("Extrusion file parse warning:", err);
      }
    }

    setExtrusionFiles(newParsedList.slice(0, 8)); // Support up to 6~8 line files
    setExtrusionParsing(false);
  };

  const handleExtrusionDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setExtrusionDragActive(true);
    } else if (e.type === "dragleave") {
      setExtrusionDragActive(false);
    }
  };

  const handleExtrusionDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setExtrusionDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleExtrusionFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveExtrusionFile = (idx) => {
    setExtrusionFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirmExtrusionUpload = async (e) => {
    if (e) e.preventDefault();
    if (extrusionFiles.length === 0 && !formData.workContent.trim()) {
      alert("업무일지 내용을 입력하거나 압출 엑셀 파일을 드래그 업로드해 주세요.");
      return;
    }

    setExtrusionUploading(true);
    try {
      const allDowntimeRecords = extrusionFiles.flatMap((f) => f.records);
      const totalMinutes = extrusionFiles.reduce((acc, cur) => acc + (cur.totalMinutes || 0), 0);
      const lineNames = Array.from(new Set(extrusionFiles.map((f) => f.lineName))).join(", ");

      if (allDowntimeRecords.length > 0) {
        await saveExtrusionDowntimeBatch(allDowntimeRecords);
      }

      const lineFileMatches = extrusionFiles.map((f) => ({
        lineName: f.lineName,
        fileName: f.fileName,
        fileSize: f.fileSize,
        rowCount: f.rowCount,
        totalMinutes: f.totalMinutes,
        records: f.records || []
      }));

      const newLog = {
        id: String(Date.now()),
        date: formData.date,
        plant: "삼랑진공장",
        writer: currentProfile?.name || workerFullName,
        title: officialTitle,
        process: "압출동 관리",
        shift: formData.shift || "주간",
        line: lineNames || "압출 전 라인 (PCM 1호, PCM 3호, TPE 1호, PVC 등)",
        workContent: formData.workContent || `압출 라인별 주간 비가동내역 엑셀 파일(${extrusionFiles.length}개 라인) 업로드 및 DB 동기화 완료 (총 ${totalMinutes}분 비가동 분석)`,
        issues: formData.issues || (extrusionFiles.length > 0 ? `업로드 파일: ${extrusionFiles.map((f) => f.fileName).join(", ")}` : "정상 가동 완료"),
        lineFileMatches: lineFileMatches,
        status: "완료",
        createdAt: new Date().toLocaleString("ko-KR", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })
      };

      await saveWorkLog(newLog);

      setExtrusionUploadSuccess(true);
      setExtrusionSuccessMessage(`압출 라인별 엑셀 ${extrusionFiles.length}개 파일(총 ${totalMinutes}분 비가동)이 데이터베이스에 정상 반영되었습니다.`);
      setLogSavedToast(true);
      
      // Auto-open Line Match Sharing Report
      setLineMatchShareModal({
        date: formData.date,
        writer: currentProfile?.name || workerFullName,
        matches: lineFileMatches,
        totalMinutes
      });

      setTimeout(() => {
        setLogSavedToast(false);
        setIsModalOpen(false);
        setExtrusionUploadSuccess(false);
      }, 1000);
    } catch (err) {
      alert("압출 비가동 엑셀 업로드 중 오류: " + err.message);
    } finally {
      setExtrusionUploading(false);
    }
  };

  // Changyeop Quality 2-Files Handler
  const handleQualityFiles = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files).slice(0, 2);
    setQualityRawFiles(fileList);
    setQualityParsing(true);
    setQualityUploadSuccess(false);
    setQualitySuccessMessage("");

    setTimeout(() => {
      setQualityFiles(fileList.map((f, idx) => ({
        id: idx + 1,
        name: f.name,
        size: (f.size / 1024).toFixed(1) + " KB",
        type: idx === 0 ? "검사실적 데이터" : "불량유형 분석 데이터"
      })));
      setQualityParsing(false);
    }, 300);
  };

  const handleQualityDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setQualityDragActive(true);
    } else if (e.type === "dragleave") {
      setQualityDragActive(false);
    }
  };

  const handleQualityDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQualityDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleQualityFiles(e.dataTransfer.files);
    }
  };

  const handleConfirmQualityUpload = async () => {
    if (qualityFiles.length === 0) return;
    setQualityUploading(true);
    try {
      if (qualityRawFiles && qualityRawFiles.length > 0) {
        const { records, count, yearMonth } = await parseQualityExcelFiles(qualityRawFiles);
        if (records.length > 0) {
          await saveQualityRecordsBatch(records);
          if (yearMonth && changeMonth && yearMonth !== selectedMonth) {
            changeMonth(yearMonth);
          }
          setQualitySuccessMessage(`품질 엑셀 ${qualityFiles.length}개 파일에서 총 ${count}건의 일자별 실적이 중복 없이 데이터베이스에 성공적으로 반영되었습니다!`);
        } else {
          setQualitySuccessMessage(`품질 관련 엑셀 ${qualityFiles.length}개 파일이 데이터베이스에 성공적으로 반영되었습니다!`);
        }
      } else {
        setQualitySuccessMessage(`품질 관련 엑셀 ${qualityFiles.length}개 파일이 데이터베이스에 성공적으로 반영되었습니다!`);
      }
      setQualityUploadSuccess(true);
    } catch (err) {
      console.error("Quality upload error:", err);
      setQualitySuccessMessage("엑셀 파일 파싱 및 저장 중 오류가 발생했습니다.");
    } finally {
      setQualityUploading(false);
    }
  };

  // Injoo Excel Process
  const handleExcelFile = async (file) => {
    if (!file) return;
    setParsing(true);
    setUploadSuccess(false);
    setSuccessMessage("");
    try {
      const result = await parseExcelFile(file);
      setParsedResult({
        file,
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + " KB",
        ...result
      });
    } catch (err) {
      alert("엑셀 파일 파싱 오류: " + err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleExcelFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmExcelUpload = async () => {
    if (!parsedResult) return;
    setUploading(true);
    try {
      const targetYM = parsedResult.yearMonth || selectedMonth || "2026-08";
      await uploadMonthlyData(targetYM, parsedResult, {
        fileName: parsedResult.fileName,
        uploadedBy: `${workerFullName} (${workerPlant})`,
        fileSize: parsedResult.fileSize
      });
      if (onBulkUpload && parsedResult.items && parsedResult.items.length > 0) {
        await onBulkUpload(parsedResult.items);
      }
      setUploadSuccess(true);
      setSuccessMessage(`${targetYM} 최신 파일(${parsedResult.fileName}) 기준으로 데이터가 갱신되었습니다. (이전 파일 대체 완료)`);
    } catch (err) {
      alert("업로드 중 오류 발생: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Save work log (Cloud Firestore + Local)
  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!formData.workContent.trim()) {
      alert("작업 내용을 입력해 주세요.");
      return;
    }

    const newLog = {
      id: String(Date.now()),
      date: formData.date,
      plant: formData.plant,
      writer: currentProfile?.name || workerFullName,
      title: officialTitle,
      process: isInjoo ? "경리업무" : isQualityWorker ? "품질관리" : (formData.process || assignedProcess),
      shift: formData.shift,
      line: isInjoo ? "본사/현장 정산 및 전표 마감" : isQualityWorker ? (formData.line || "전라인 품질 검사 및 불량 분석") : formData.line,
      workContent: formData.workContent,
      issues: formData.issues || "-",
      status: "완료",
      createdAt: new Date().toLocaleString("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    await saveWorkLog(newLog);

    setFormData((prev) => ({
      ...prev,
      workContent: "",
      issues: ""
    }));

    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 3000);
    setIsModalOpen(false);
  };

  const handleDeleteLog = async (id) => {
    if (!window.confirm("이 업무일지를 삭제하시겠습니까?")) return;
    await deleteWorkLog(id);
  };

  const filteredLogs = useMemo(() => {
    return workLogs
      .filter((log) => {
        const writerWithTitle = `${log.writer} ${log.title || ""} ${log.process || ""}`;
        const matchSearch =
          writerWithTitle.includes(searchTerm) ||
          log.workContent.includes(searchTerm) ||
          log.line.includes(searchTerm) ||
          (log.issues && log.issues.includes(searchTerm));
        const matchPlant = filterPlant === "all" || log.plant === filterPlant;
        return matchSearch && matchPlant;
      })
      .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [workLogs, searchTerm, filterPlant]);

  // Reset pagination when search or plant filter changes
  useEffect(() => {
    setCurrentLogPage(1);
  }, [searchTerm, filterPlant]);

  const totalLogPages = useMemo(() => {
    return Math.ceil(filteredLogs.length / LOGS_PER_PAGE) || 1;
  }, [filteredLogs.length]);

  const paginatedLogs = useMemo(() => {
    const startIdx = (currentLogPage - 1) * LOGS_PER_PAGE;
    return filteredLogs.slice(startIdx, startIdx + LOGS_PER_PAGE);
  }, [filteredLogs, currentLogPage]);

  return (
    <div className="space-y-2.5 sm:space-y-3 animate-fadeIn pb-12 max-w-[1600px] w-full mx-auto px-0.5 sm:px-0 min-w-0 max-w-full">
      {/* ========================================================================= */}
      {/* 📌 태형&미영 일정 (1줄 간결 바 • 결재 패널 상단 • 관리자만 노출) */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-xl px-3 sm:px-3.5 py-2 border border-indigo-500/40 dark:border-indigo-600/40 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0 max-w-full">
          <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
            <div className="p-1 rounded-lg bg-indigo-600 text-white shadow-xs shrink-0">
              <CalendarDays className="w-3.5 h-3.5" />
            </div>
            <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white shrink-0">
              태형&미영
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              {todayCommonSchedules.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-300 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 text-indigo-600" />
                  <span>오늘 {todayCommonSchedules.length}건</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-slate-500" />
                  <span>등록된 일정 없음</span>
                </span>
              )}
            </div>

            {/* Today's Schedule Chips List in 1-line */}
            {todayCommonSchedules.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                {todayCommonSchedules.map((item) => (
                  <div
                    key={item.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs shrink-0 hover:border-indigo-400 transition-all"
                  >
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                      item.target === "세미나"
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                        : item.target === "교육"
                        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                        : item.target === "여행"
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                        : item.target === "맛집"
                        ? "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                        : item.target === "기타"
                        ? "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-700"
                        : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600"
                    }`}>
                      {item.target || "기타"}
                    </span>
                    {item.time && item.time !== "종일" && (
                      <span className="font-mono text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400">
                        [{item.time}]
                      </span>
                    )}
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[130px] sm:max-w-[200px]">
                      {item.title}
                    </span>
                    {(isAdmin || isGeneralManager) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCommonSchedule(item.id)}
                        className="ml-0.5 p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                        title="일정 삭제"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            {(isAdmin || isGeneralManager) && (
              <button
                type="button"
                onClick={() => setCommonScheduleModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-3 h-3" />
                <span>+ 일정 등록</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setDailyPnLModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-black transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
              title="매일아침 손익결산 메시지 예시화면 및 텔레그램 발송"
            >
              <Send className="w-3 h-3 text-white" />
              <span>📱 손익결산 브리핑</span>
            </button>
          </div>
        </div>
      )}

      {/* 📑 전자결재 대기 현황 (1줄 간결 바) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl px-3 sm:px-3.5 py-2 border border-emerald-500/40 dark:border-emerald-600/40 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0 max-w-full">
        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
          <div className="p-1 rounded-lg bg-emerald-600 text-white shadow-xs shrink-0">
            <FileSignature className="w-3.5 h-3.5" />
          </div>
          <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white shrink-0">
            전자결재 대기 현황
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 animate-pulse flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>미결 {pendingCount}건</span>
              </span>
            )}
            {holdCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
                <PauseCircle className="w-3 h-3" />
                <span>보류 {holdCount}건</span>
              </span>
            )}
            {pendingOrHoldDocs.length === 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>대기 없음 (완료)</span>
              </span>
            )}
          </div>

          {pendingOrHoldDocs.length > 0 && (
            <div className="hidden md:flex items-center gap-2 min-w-0 flex-1 pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="text-[10.5px] font-extrabold text-slate-500 dark:text-slate-400 shrink-0">최근 대기:</span>
              <div
                onClick={() => onNavigateTab && onNavigateTab("electronic_approval")}
                className="flex items-center gap-1.5 truncate text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
              >
                <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-300">
                  {pendingOrHoldDocs[0].plant === "한림공장" ? "한림" : "삼랑진"}
                </span>
                <span className="truncate">{pendingOrHoldDocs[0].title}</span>
                <span className="text-slate-400 text-[10px] shrink-0">({pendingOrHoldDocs[0].drafter})</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab("settings")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 text-xs font-black transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="텔레그램 품질경보 실시간 알림 봇 연동 설정"
          >
            <Send className="w-3 h-3 text-sky-500" />
            <span>텔레그램 설정</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab("electronic_approval")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-black transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
          >
            <span>전체 결재함</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 🌟 작업자 정보 & 간편 일정/연차 설정 패널 (우창용 선임인 경우 전용 스마트 캘린더 센터 파일럿 가동) */}
      {!isAdmin && (
        isChangyong ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border-2 border-blue-500/40 dark:border-blue-500/30 shadow-sm space-y-2.5 min-w-0 max-w-full overflow-hidden">
            {/* Top Bar: Worker Profile & Quick Schedule Register Form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center">
              {/* Left: Plant, Worker Name, Title, and Live Status Badge (4 cols) */}
              <div className="lg:col-span-4 flex items-center justify-between sm:justify-start gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 shrink-0">
                    <Factory className="w-3 h-3" />
                    <span>한림공장</span>
                  </span>

                  <div className="flex items-baseline gap-1.5 min-w-0 truncate">
                    <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                      우창용
                    </span>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 shrink-0">
                      선임
                    </span>
                  </div>

                  <span className="text-[10.5px] font-bold px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 shrink-0 hidden sm:inline-block">
                    가공동 관리
                  </span>

                  {/* Live Status Badge */}
                  {myLeaveStatus?.status === "ACTIVE" ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-2xs animate-pulse flex items-center gap-1 shrink-0 ${myLeaveStatus.badgeColor}`}>
                      <span>{myLeaveStatus.emoji} {myLeaveStatus.label}</span>
                    </span>
                  ) : myLeaveStatus?.status === "SCHEDULED" ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 ${myLeaveStatus.badgeColor}`}>
                      <span>{myLeaveStatus.label}</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 flex items-center gap-1 shrink-0">
                      <span>🟢 정상근무</span>
                    </span>
                  )}
                </div>

                {myLeaveStatus?.leave && (
                  <button
                    type="button"
                    onClick={() => handleDeleteLeave(myLeaveStatus.leave.id)}
                    className="ml-auto p-1 rounded-md bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:border-rose-900 text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    title="등록된 오늘 일정 취소/삭제"
                  >
                    <X className="w-3 h-3" />
                    <span>취소</span>
                  </button>
                )}
              </div>

              {/* Right: Quick Schedule Register Form (8 cols) */}
              <div className="lg:col-span-8 min-w-0">
                <form onSubmit={handleChangyongRegisterSchedule} className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-center">
                  {/* 1. Leave Type Selector (3 cols) */}
                  <div className="sm:col-span-3 min-w-0">
                    <select
                      value={changyongLeaveType}
                      onChange={(e) => setChangyongLeaveType(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                    >
                      <option value="연차(전일)">🌴 연차(전일)</option>
                      <option value="오전반차">🌤️ 오전반차</option>
                      <option value="오후반차">⛅ 오후반차</option>
                      <option value="업체방문">🏢 업체방문</option>
                      <option value="RNA 회의">👔 RNA 회의</option>
                      <option value="외출">🚶 외출</option>
                      <option value="특근(휴일근무)">⚡ 특근(휴일)</option>
                      <option value="출장/외부교육">🚄 출장/교육</option>
                    </select>
                  </div>

                  {/* 2. Date Picker (3 cols) */}
                  <div className="sm:col-span-3 min-w-0">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-blue-400 bg-white dark:bg-slate-800 shadow-2xs">
                      <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                      <input
                        type="date"
                        required
                        value={changyongSelectedDate}
                        onChange={(e) => setChangyongSelectedDate(e.target.value)}
                        className="w-full bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer py-0.5"
                      />
                    </div>
                  </div>

                  {/* 3. Reason/Memo Input (4 cols) */}
                  <div className="sm:col-span-4 min-w-0">
                    <input
                      type="text"
                      value={changyongReasonInput}
                      onChange={(e) => setChangyongReasonInput(e.target.value)}
                      placeholder="사유/메모 (선택사항)"
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-2xs placeholder:text-slate-400 placeholder:text-xs"
                    />
                  </div>

                  {/* 4. Submit Button (2 cols) */}
                  <div className="sm:col-span-2 min-w-0">
                    <button
                      type="submit"
                      disabled={changyongSaving}
                      className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-2xs shadow-blue-500/25 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{changyongSaving ? "등록중" : "등록"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Bottom Row: My Registered Schedules Strip & Optional Mini-Calendar Toggle */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {/* Left: Registered Schedules Tags */}
              <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 text-blue-500" />
                  <span>나의 등록 일정:</span>
                </span>

                {changyongMyLeaves.length > 0 ? (
                  changyongMyLeaves.slice(0, 5).map((ev) => {
                    let badgeColor = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900";
                    let emoji = "🌴";
                    if (ev.leaveType?.includes("반차")) {
                      badgeColor = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900";
                      emoji = "⛅";
                    } else if (ev.leaveType?.includes("업체방문") || ev.leaveType?.includes("출장")) {
                      badgeColor = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900";
                      emoji = "🏢";
                    } else if (ev.leaveType?.includes("특근")) {
                      badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900";
                      emoji = "⚡";
                    } else if (ev.leaveType?.includes("외출")) {
                      badgeColor = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900";
                      emoji = "🚶";
                    }

                    return (
                      <span
                        key={ev.id}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border shadow-2xs ${badgeColor}`}
                      >
                        <span>{emoji}</span>
                        <span>{ev.startDate?.slice(5)} {ev.leaveType}</span>
                        {ev.reason && ev.reason !== ev.leaveType && (
                          <span className="text-[10px] opacity-75 truncate max-w-[80px]">({ev.reason})</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteLeave(ev.id)}
                          className="hover:text-rose-600 dark:hover:text-rose-400 ml-0.5 font-black cursor-pointer"
                          title="이 일정 취소/삭제"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                    등록된 일정이 없습니다. 우측 폼에서 날짜를 선택하여 간편하게 등록하세요.
                  </span>
                )}
              </div>

              {/* Right: Optional Mini-Calendar Toggle Button */}
              <button
                type="button"
                onClick={() => setShowMiniCalendar((prev) => !prev)}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-black border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
              >
                <Calendar className="w-3 h-3 text-blue-500" />
                <span>{showMiniCalendar ? "달력 닫기 ▲" : "월간 달력 보기 ▼"}</span>
              </button>
            </div>

            {/* Optional Collapsible Clean Mini Calendar Grid (Only visible when toggled) */}
            {showMiniCalendar && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 animate-fadeIn">
                {/* Month Navigator Header */}
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={handlePrevCalMonth}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                      title="이전 달"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-xs font-black text-slate-900 dark:text-white">
                      {changyongCalYM.split("-")[0]}년 {parseInt(changyongCalYM.split("-")[1], 10)}월
                    </span>
                    <button
                      type="button"
                      onClick={handleNextCalMonth}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                      title="다음 달"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetToToday}
                    className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10.5px] font-black border border-blue-200 dark:border-blue-800"
                  >
                    오늘로
                  </button>
                </div>

                {/* 7-Column Mini Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
                    <div
                      key={d}
                      className={`text-[10px] font-black py-0.5 rounded ${
                        i === 0 ? "text-rose-600 bg-rose-50 dark:bg-rose-950/40" : i === 6 ? "text-blue-600 bg-blue-50 dark:bg-blue-950/40" : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
                      }`}
                    >
                      {d}
                    </div>
                  ))}

                  {changyongCalendarDays.map((cell) => {
                    if (cell.isEmpty) {
                      return <div key={cell.key} className="h-9 rounded bg-slate-50/50 dark:bg-slate-900/30" />;
                    }

                    const hasEvent = cell.events && cell.events.length > 0;
                    return (
                      <div
                        key={cell.key}
                        onClick={() => {
                          setChangyongSelectedDate(cell.dateStr);
                        }}
                        className={`h-9 p-0.5 rounded border transition-all cursor-pointer flex flex-col justify-between items-center select-none ${
                          cell.isSelected
                            ? "bg-blue-100 dark:bg-blue-900/70 border-blue-500 font-black ring-1 ring-blue-500"
                            : cell.isToday
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 font-black"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                        }`}
                      >
                        <span className={`text-[10.5px] font-black ${cell.dayOfWeek === 0 ? "text-rose-600" : cell.dayOfWeek === 6 ? "text-blue-600" : "text-slate-800 dark:text-slate-200"}`}>
                          {cell.dayNumber}
                        </span>
                        {hasEvent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title={cell.events.map(e => e.leaveType).join(", ")} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Non-Changyong Workers Standard Compact Schedule Bar */
          <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 sm:p-3 border border-slate-200/90 dark:border-slate-800 shadow-xs min-w-0 max-w-full overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center">
              {/* Left: Plant Badge, Worker Name, Title, and Process + Live Status Badge (5 cols) */}
              <div className="lg:col-span-5 flex items-center justify-between sm:justify-start gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black shadow-2xs shrink-0 ${
                    workerPlant === "한림공장"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                      : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200"
                  }`}>
                    <Factory className="w-3 h-3" />
                    <span>{workerPlant}</span>
                  </span>

                  <div className="flex items-baseline gap-1.5 min-w-0 truncate">
                    <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                      {workerFullName}
                    </span>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 shrink-0">
                      {officialTitle}
                    </span>
                  </div>

                  <span className="text-[10.5px] font-bold px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 shrink-0 hidden sm:inline-block">
                    {isInjoo ? "경리업무" : isQualityWorker ? "품질관리" : assignedProcess}
                  </span>

                  {/* Active (연차사용중) / Scheduled (연차예정 M/D) Live Badge */}
                  {myLeaveStatus?.status === "ACTIVE" ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-2xs animate-pulse flex items-center gap-1 shrink-0 ${myLeaveStatus.badgeColor}`}>
                      <span>{myLeaveStatus.emoji} {myLeaveStatus.label}</span>
                    </span>
                  ) : myLeaveStatus?.status === "SCHEDULED" ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 ${myLeaveStatus.badgeColor}`}>
                      <span>{myLeaveStatus.label}</span>
                    </span>
                  ) : null}
                </div>

                {/* If current worker already has an active or scheduled leave, show cancellation button */}
                {myLeaveStatus?.leave && (
                  <button
                    type="button"
                    onClick={() => handleDeleteLeave(myLeaveStatus.leave.id)}
                    className="ml-auto p-1 rounded-md bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:border-rose-900 text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    title="등록된 일정 취소/삭제"
                  >
                    <X className="w-3 h-3" />
                    <span>취소</span>
                  </button>
                )}
              </div>

              {/* Right: Full-width Schedule & Annual Leave Setting Form (7 cols) */}
              <div className="lg:col-span-7 min-w-0">
                <form onSubmit={handleRegisterLeave} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  {/* 1. Leave / Schedule Type Selector (5 cols) - 6 options */}
                  <div className="sm:col-span-5 min-w-0">
                    <select
                      value={leaveForm.leaveType}
                      onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="연차(전일)">연차(전일)</option>
                      <option value="오전반차">오전반차</option>
                      <option value="오후반차">오후반차</option>
                      <option value="업체방문">업체방문</option>
                      <option value="RNA 회의">RNA 회의</option>
                      <option value="외출">외출</option>
                    </select>
                  </div>

                  {/* 2. Date Picker (5 cols) */}
                  <div className="sm:col-span-5 min-w-0">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-blue-400 dark:border-blue-500/80 bg-white dark:bg-slate-800 shadow-2xs">
                      <div className="p-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 shrink-0">
                        <Calendar className="w-3 h-3" />
                      </div>
                      <input
                        type="date"
                        required
                        value={leaveForm.startDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLeaveForm((prev) => ({
                            ...prev,
                            startDate: val,
                            endDate: val
                          }));
                        }}
                        className="w-full bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer py-0.5"
                      />
                    </div>
                  </div>

                  {/* 3. Submit Button (2 cols) */}
                  <div className="sm:col-span-2 min-w-0">
                    <button
                      type="submit"
                      disabled={leaveSaving}
                      className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-2xs shadow-blue-500/25 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{leaveSaving ? "설정중" : "설정"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* 1. ⭐ [1위치] 매입매출현황 요약 (주석 삭제 • 깔끔한 핵심 수치만 표시) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 gap-1.5">
          <div className="flex items-center gap-2 min-w-0 truncate">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 shrink-0">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
              1. {monthTitle} 매입매출현황 요약
            </h2>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("vehicle_sales")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black border border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/50 shadow-xs shadow-emerald-500/20 animate-pulse transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>매출 상세</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}
        </div>

        {/* 3 Core KPI Cards (Clean numbers without annotations) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="p-2 sm:p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between min-w-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">총매출액</span>
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {formatAmount(totalSales)}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between min-w-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">총매입액 (원가)</span>
            <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">
              {formatAmount(totalPurchases)}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between min-w-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">매출대비 매입원가율</span>
            <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
              {purchaseRatio}%
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ⭐ [2위치] 압출동 주간 비가동내역 요약 (월별 그래프 + 당월 누적시간 단독 합산) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 sm:p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2.5 min-w-0 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 gap-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-200/60 dark:border-amber-800/60 shrink-0">
              <Wrench className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                  2. 압출동 주간 비가동내역 요약
                </h2>
                <span className="text-[10px] font-black px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0">
                  9월 당월 누적 합산 기준
                </span>
              </div>
              <p className="text-[10px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.2 truncate">
                4개 라인의 9월 당월 누적 비가동시간과 7월~9월 월별 비교 추이 그래프입니다.
              </p>
            </div>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("extrusion_downtime")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black border border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/50 shadow-xs shadow-emerald-500/20 animate-pulse transition-all active:scale-95 cursor-pointer self-end sm:self-auto shrink-0"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>비가동 상세</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}
        </div>

        {/* 4 Line Cards with Monthly Mini Graph & Current Month Downtime */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
          {EXTRUSION_SUMMARY.map((ex) => {
            const maxM = Math.max(...ex.monthlyTrend.map((m) => m.min), 500);

            return (
              <div
                key={ex.line}
                className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs transition-all space-y-2 min-w-0"
              >
                {/* Tile Top Header: Line Name & LOSS Rate Badge */}
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70 dark:border-slate-700/70 gap-1">
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">{ex.line}</span>
                  </div>
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0">
                    LOSS {ex.lossRate}
                  </span>
                </div>

                {/* Left (당월 누적시간) & Right (월별 비교 그래프) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                  {/* Left Side: 당월 누적 합산 */}
                  <div className="flex flex-col justify-center pr-1 sm:border-r border-slate-200/70 dark:border-slate-700/70 min-w-0">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                      <Clock className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">[{ex.currentMonth}] 당월 누적시간</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight leading-none">
                        {ex.currentMonthMin.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">분</span>
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 font-bold mt-0.5 truncate">
                      ({ex.currentMonthHours}) • 가동률 {ex.opRatio}%
                    </span>
                  </div>

                  {/* Right Side: 월별 비가동 비교 미니 바 그래프 */}
                  <div className="flex flex-col justify-center space-y-1 min-w-0">
                    <div className="flex items-center justify-between text-[9.5px] font-extrabold text-slate-500 dark:text-slate-400">
                      <span>월별 추이 (7~9월)</span>
                      <span>시간(h)</span>
                    </div>

                    <div className="space-y-0.5">
                      {ex.monthlyTrend.map((mItem) => {
                        const barPct = Math.min(100, Math.max(12, (mItem.min / maxM) * 100));

                        return (
                          <div key={mItem.month} className="flex items-center gap-1 text-[9.5px]">
                            <span
                              className={`w-5 text-center font-bold shrink-0 ${
                                mItem.isCurrent
                                  ? "text-amber-600 dark:text-amber-400 font-black"
                                  : "text-slate-400"
                              }`}
                            >
                              {mItem.month}
                            </span>
                            <div className="flex-1 bg-slate-200 dark:bg-slate-900 rounded-full h-2.5 p-0.2 overflow-hidden min-w-0">
                              <div
                                className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1 ${
                                  mItem.isCurrent
                                    ? "bg-gradient-to-r from-amber-500 to-rose-500"
                                    : "bg-slate-400 dark:bg-slate-600"
                                }`}
                                style={{ width: `${barPct}%` }}
                              >
                                {barPct > 45 && (
                                  <span className="text-[8px] font-black text-white">
                                    {mItem.hours}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="w-8 text-right font-black text-slate-700 dark:text-slate-300 shrink-0">
                              {mItem.hours}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ⭐ [3위치] 일일품질현황 요약 (좌측: 당월불량률 / 우측: 일일불량률) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 gap-1.5">
          <div className="flex items-center gap-2 min-w-0 truncate">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
              3. 일일품질현황 요약
            </h2>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("daily_quality")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black border border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/50 shadow-xs shadow-emerald-500/20 animate-pulse transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>품질 상세</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}
        </div>

        {/* 2-Halves Split: Left (당월 불량률) vs Right (일일 불량률) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {/* ========================================== */}
          {/* 1. [왼쪽] 전월누적불량율 (**월) (전월 누적 실적) */}
          {/* ========================================== */}
          <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 space-y-1.5 min-w-0">
            <div className="flex items-center justify-between px-0.5 gap-1">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 truncate">
                  전월누적불량율 ({prevMonthLabel})
                </span>
              </div>
              <span className="text-[9.5px] sm:text-[10px] font-bold text-indigo-600/80 dark:text-indigo-400 font-mono shrink-0">
                전월 총 {liveQualityPrevMonthly.totalInspectQty.toLocaleString()} EA ({liveQualityPrevMonthly.totalDefectQty.toLocaleString()}건 • {liveQualityPrevMonthly.overallDefectRate}%)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {liveQualityPrevMonthly.items.map((item) => {
                const isMax = item.id === liveQualityPrevMonthly.maxDefectItem?.id;
                return (
                  <div
                    key={item.id}
                    className={`p-2 rounded-lg border flex flex-col justify-between bg-white dark:bg-slate-900 shadow-2xs min-w-0 ${
                      isMax
                        ? "border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/20"
                        : "border-slate-200/70 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-black text-[10.5px] text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                      {isMax && (
                        <span className="text-[8px] font-black px-1 py-0.2 rounded bg-rose-500 text-white shrink-0">
                          최고
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between mt-1 min-w-0">
                      <span className={`text-sm sm:text-base font-black font-mono leading-none ${
                        item.defectRate > 1.0 ? "text-rose-600 dark:text-rose-400" : "text-indigo-600 dark:text-indigo-400"
                      }`}>
                        {item.defectRate}%
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold font-mono truncate">
                        {item.inspectQty.toLocaleString()}EA
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================== */}
          {/* 2. [오른쪽] 일일 불량률 (업로드 일자 실적) */}
          {/* ========================================== */}
          <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 space-y-1.5 min-w-0">
            <div className="flex items-center justify-between px-0.5 gap-1">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 truncate">
                  일일 불량률 ({latestDateLabel})
                </span>
              </div>
              <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-600/80 dark:text-emerald-400 font-mono shrink-0">
                {latestDateLabel} 총 {latestDayInfo.totalInspectQty.toLocaleString()} EA ({latestDayInfo.totalDefectQty.toLocaleString()}건 • {latestDayInfo.defectRate}%)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {sortedDailyQualityItems.map((item, idx) => {
                const isMax = idx === 0 && item.defectRate > 0;
                return (
                  <div
                    key={item.id}
                    className={`p-2 rounded-lg border flex flex-col justify-between bg-white dark:bg-slate-900 shadow-2xs min-w-0 ${
                      isMax
                        ? "border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/20"
                        : "border-slate-200/70 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-black text-[10.5px] text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                      {isMax && (
                        <span className="text-[8px] font-black px-1 py-0.2 rounded bg-rose-500 text-white shrink-0">
                          최고
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between mt-1 min-w-0">
                      <span className={`text-sm sm:text-base font-black font-mono leading-none ${
                        item.defectRate > 1.0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {item.defectRate}%
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold font-mono truncate">
                        {item.inspectQty.toLocaleString()}EA
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ⭐ [4위치] 공장별 특근현황 요약 (마지막 수정본 실시간 자동 연동) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 min-w-0 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white shrink-0">
              4. 공장별 특근현황 요약
            </h2>
            <span className="text-[9.5px] sm:text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-rose-500 shrink-0" />
              <span>당월 누적: <strong className="font-mono text-[10.5px] sm:text-[11px] font-black text-rose-600 dark:text-rose-400">₩{overtimeSummary.totalMonthCumulativeCost.toLocaleString()}원</strong> (총 176명 • 1,472 M/H)</span>
            </span>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("overtime_status")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black border border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/50 shadow-xs shadow-emerald-500/20 animate-pulse transition-all active:scale-95 cursor-pointer self-end sm:self-auto shrink-0"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>특근 상세</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}
        </div>

        {/* 2 Factory Split Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* 삼랑진공장 */}
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1 min-w-0">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60 flex-wrap gap-1">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[9.5px] font-black shrink-0">
                  삼랑진공장
                </span>
                <span className="text-[9.5px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 shrink-0">
                  📅 {overtimeSummary.samrangjin.date}
                </span>
                <span className="text-[9.5px] text-slate-500 font-bold truncate">{overtimeSummary.samrangjin.author} {overtimeSummary.samrangjin.authorTitle || "선임"}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                  ₩{overtimeSummary.samrangjin.cost.toLocaleString()}
                </span>
                <span className="text-[9.5px] text-slate-400 font-bold">
                  ({overtimeSummary.samrangjin.headcount}명)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {overtimeSummary.samrangjin.lines.map((ln) => (
                <span key={ln.name} className="px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-[9px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                  {ln.name}: <strong className="text-purple-600 dark:text-purple-400">{ln.count}명</strong>
                </span>
              ))}
            </div>
          </div>

          {/* 한림공장 */}
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1 min-w-0">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60 flex-wrap gap-1">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9.5px] font-black shrink-0">
                  한림공장
                </span>
                <span className="text-[9.5px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 shrink-0">
                  📅 {overtimeSummary.hallim.date}
                </span>
                <span className="text-[9.5px] text-slate-500 font-bold truncate">{overtimeSummary.hallim.author} {overtimeSummary.hallim.authorTitle || "선임"}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                  ₩{overtimeSummary.hallim.cost.toLocaleString()}
                </span>
                <span className="text-[9.5px] text-slate-400 font-bold">
                  ({overtimeSummary.hallim.headcount}명)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {overtimeSummary.hallim.lines.map((ln) => (
                <span key={ln.name} className="px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-[9px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                  {ln.name}: <strong className="text-purple-600 dark:text-purple-400">{ln.count}명</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. ⭐ [5위치] 일일업무일지 현황 (상세내용 확인 후 개별 전자결재) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 min-w-0 max-w-full overflow-hidden">
        {/* Manager Dedicated Information Banners (No batch approval - Requires reading details) */}
        {isMyeongjae && pendingSamrangjinCount > 0 && (
          <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-wrap items-center justify-between gap-2 animate-fadeIn min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                결재
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-xs text-amber-900 dark:text-amber-200">
                  👑 [이명재 총괄이사] 삼랑진공장 결재 대기 업무일지가 <strong className="text-rose-600 dark:text-rose-400 underline font-black">{pendingSamrangjinCount}건</strong> 있습니다.
                </p>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.2">
                  목록에서 업무일지를 클릭하여 세부 작업 내용을 꼼꼼히 확인하신 후 결재를 진행해 주세요.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[11px] font-black shrink-0 ml-auto sm:ml-0">
              결재 대기 {pendingSamrangjinCount}건
            </span>
          </div>
        )}

        {isDongwook && pendingHallimCount > 0 && (
          <div className="p-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex flex-wrap items-center justify-between gap-2 animate-fadeIn min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                결재
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-xs text-emerald-900 dark:text-emerald-200">
                  👑 [김동욱 총괄책임] 한림공장 결재 대기 업무일지가 <strong className="text-rose-600 dark:text-rose-400 underline font-black">{pendingHallimCount}건</strong> 있습니다.
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.2">
                  목록에서 업무일지를 클릭하여 세부 작업 내용을 꼼꼼히 확인하신 후 결재를 진행해 주세요.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[11px] font-black shrink-0 ml-auto sm:ml-0">
              결재 대기 {pendingHallimCount}건
            </span>
          </div>
        )}

        {isAdmin && (pendingSamrangjinCount > 0 || pendingHallimCount > 0) && (
          <div className="p-2.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-2 animate-fadeIn min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                ADMIN
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-xs text-blue-900 dark:text-blue-200 truncate">
                  [관리자 결재 현황] 삼랑진 <strong className="text-blue-600 dark:text-blue-400">{pendingSamrangjinCount}건</strong> • 한림 <strong className="text-emerald-600 dark:text-emerald-400">{pendingHallimCount}건</strong> 결재 대기중
                </p>
                <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.2 truncate">
                  각 업무일지를 탭하여 세부 내용을 검토하신 후 전자결재를 진행할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-800 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
              5. 일일업무일지 현황
            </h3>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <select
              value={filterPlant}
              onChange={(e) => setFilterPlant(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">전체 ({workLogs.length})</option>
              <option value="삼랑진공장">삼랑진 ({workLogs.filter((l) => l.plant === "삼랑진공장").length})</option>
              <option value="한림공장">한림 ({workLogs.filter((l) => l.plant === "한림공장").length})</option>
            </select>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab("electronic_approval")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black border border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/50 shadow-xs shadow-emerald-500/20 animate-pulse transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>업무일지 상세</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </button>
            )}
          </div>
        </div>

        {/* 한줄 리스트 테이블 */}
        <div className="w-full max-w-full overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse table-fixed min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold h-7 text-[10.5px]">
                <th className="py-1 px-2 w-[10%] text-center">일자</th>
                <th className="py-1 px-2 w-[8%] text-center">공장</th>
                <th className="py-1 px-2 w-[13%]">작성자</th>
                <th className="py-1 px-2 w-[44%]">작업 내용</th>
                <th className="py-1 px-2 w-[10%]">특이사항</th>
                <th className="py-1 px-2 w-[11%] text-center">결재 현황</th>
                <th className="py-1 px-1 w-[4%] text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-5 text-center text-slate-400 font-bold text-xs">
                    등록된 일일업무일지가 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => {
                  const currentDate = log.date ? (log.date.length === 10 ? log.date.slice(5) : log.date) : "";
                  const prevLog = index > 0 ? paginatedLogs[index - 1] : null;
                  const prevDate = prevLog?.date ? (prevLog.date.length === 10 ? prevLog.date.slice(5) : prevLog.date) : "";
                  const isSameDateAsPrev = index > 0 && currentDate === prevDate;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLogDetail(log)}
                      className="hover:bg-blue-50/70 dark:hover:bg-blue-950/30 cursor-pointer transition-colors h-8 sm:h-8.5 group text-[11px]"
                      title="클릭하여 상세내용 확인 및 결재 진행"
                    >
                      <td className="py-1 px-2 text-center font-bold font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {!isSameDateAsPrev ? (
                          <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-[10.5px]">
                            {currentDate}
                          </span>
                        ) : null}
                      </td>
                    <td className="py-1 px-2 text-center">
                      <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black ${
                        log.plant === "한림공장"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}>
                        {log.plant === "한림공장" ? "한림" : "삼랑진"}
                      </span>
                    </td>
                    <td className="py-1 px-2 font-bold text-slate-900 dark:text-white truncate">
                      {log.writer} {log.title || ""}
                    </td>
                    <td className="py-1 px-2 font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400" title={log.workContent}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{log.workContent}</span>
                        {Array.isArray(log.lineFileMatches) && log.lineFileMatches.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                            📊 {log.lineFileMatches.length}개라인 매칭
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-1 px-2 text-slate-500 dark:text-slate-400 truncate" title={log.issues || "-"}>
                      {log.issues && log.issues !== "특이사항 없음" ? log.issues : "-"}
                    </td>

                    {/* 결재 상태 열 (클릭 시 상세 모달 열기) */}
                    <td className="py-1 px-2 text-center whitespace-nowrap">
                      {log.approvalStatus === "결재완료" ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9.5px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs"
                          title={`결재자: ${log.approverName || "총괄관리자"} ${log.approverTitle || ""} (${log.approvedAt || ""})${log.approvalComment ? '\n지시사항: ' + log.approvalComment : ''}`}
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{log.approverName || (log.plant === "한림공장" ? "김동욱" : "이명재")} {log.approverTitle || "결재"}</span>
                          {log.approvalComment && log.approvalComment !== "확인 및 전자결재 승인 완료" && (
                            <span className="p-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200" title={`코멘트: ${log.approvalComment}`}>
                              <MessageSquare className="w-2 h-2" />
                            </span>
                          )}
                        </span>
                      ) : log.approvalStatus === "반려" ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
                          반려됨
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9.5px] font-bold ${
                          canApproveLog(log)
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{canApproveLog(log) ? "확인 후 결재" : "결재대기"}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-1 px-1 text-center">
                      {(currentProfile?.name === log.writer || isAdmin) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLog(log.id);
                          }}
                          className="p-0.5 text-slate-300 hover:text-rose-600 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 하단 페이징 컨트롤 및 업무일지 등록 버튼 */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
            <span>
              총 <strong className="text-slate-900 dark:text-white font-mono">{filteredLogs.length}</strong>건 중{" "}
              <strong className="text-blue-600 dark:text-blue-400 font-mono">
                {filteredLogs.length === 0 ? 0 : (currentLogPage - 1) * LOGS_PER_PAGE + 1}
              </strong>
              ~
              <strong className="text-blue-600 dark:text-blue-400 font-mono">
                {Math.min(currentLogPage * LOGS_PER_PAGE, filteredLogs.length)}
              </strong>
              건
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
              (페이지당 12개)
            </span>
          </div>

          {/* Pagination Buttons */}
          {totalLogPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={currentLogPage === 1}
                onClick={() => setCurrentLogPage(1)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-black text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="첫 페이지"
              >
                «
              </button>
              <button
                disabled={currentLogPage === 1}
                onClick={() => setCurrentLogPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                이전
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalLogPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalLogPages || Math.abs(p - currentLogPage) <= 2)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const isGap = prevP && p - prevP > 1;
                    return (
                      <React.Fragment key={p}>
                        {isGap && <span className="text-slate-400 text-xs px-0.5">...</span>}
                        <button
                          onClick={() => setCurrentLogPage(p)}
                          className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                            currentLogPage === p
                              ? "bg-blue-600 text-white shadow-xs shadow-blue-500/30 scale-105"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                disabled={currentLogPage === totalLogPages}
                onClick={() => setCurrentLogPage((p) => Math.min(totalLogPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                다음
              </button>
              <button
                disabled={currentLogPage === totalLogPages}
                onClick={() => setCurrentLogPage(totalLogPages)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-black text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="마지막 페이지"
              >
                »
              </button>
            </div>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>오늘의 업무일지 등록하기</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. ⭐ [ADMIN 전용] 실시간 접속기록 현황 (이름 + 접속기록 간결화) */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5 min-w-0 max-w-full overflow-hidden">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                6. 실시간 접속기록 현황
              </h3>
              <span className="px-2 py-0.2 rounded-full text-[9.5px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                ADMIN 전용
              </span>
            </div>
            <span className="text-[10.5px] text-slate-400 font-medium truncate">
              💡 탭하여 상세 접속 이력 조회
            </span>
          </div>

          {/* Plant Groups Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {PLANTS.map((plant) => (
              <div key={plant.id} className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 space-y-2 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs text-slate-900 dark:text-white">
                    <Factory className={`w-3.5 h-3.5 ${plant.name === "한림공장" ? "text-emerald-600" : "text-amber-500"}`} />
                    <span>{plant.name}</span>
                  </div>
                  <span className="text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {plant.workers.length}명
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {plant.workers.map((worker) => {
                    const workerLogs = accessLogs[worker.id] || [];
                    const lastLog = workerLogs[0] || null;
                    const isMobile = lastLog?.deviceType === "MOBILE";

                    return (
                      <button
                        key={worker.id}
                        type="button"
                        onClick={() => handleOpenWorkerLogs(worker)}
                        className="flex flex-col justify-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 hover:shadow-xs transition-all text-left group cursor-pointer w-full min-w-0 active:scale-[0.98]"
                      >
                        {/* 1줄: 이름 + 직책 */}
                        <div className="flex items-center justify-between gap-1 w-full min-w-0">
                          <div className="flex items-baseline gap-1 min-w-0 truncate">
                            <span className="font-black text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                              {worker.name}
                            </span>
                            <span className="text-[9.5px] font-bold text-slate-400 shrink-0">
                              {worker.title}
                            </span>
                          </div>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${lastLog ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`} />
                        </div>

                        {/* 2줄: 접속기록 */}
                        <div className="text-[10px] font-bold w-full truncate mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                          {lastLog ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 truncate">
                              {isMobile ? (
                                <Smartphone className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                              ) : (
                                <Laptop className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                              )}
                              <span className="truncate">{formatRelativeAccessTime(lastLog.timestamp)}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium inline-flex items-center gap-1">
                              <Clock className="w-2 h-2 text-slate-300 dark:text-slate-600 shrink-0" />
                              <span>미접속</span>
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work Log Detail View Modal (상세내용 확인 & 코멘트 입력 & 전자결재 모달) */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-md ${
                  selectedLogDetail.plant === "한림공장" ? "bg-emerald-600 ring-2 ring-emerald-400/30" : "bg-amber-500 ring-2 ring-amber-400/30"
                }`}>
                  {selectedLogDetail.writer ? selectedLogDetail.writer[0] : "작"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {selectedLogDetail.writer} {selectedLogDetail.title || ""}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      selectedLogDetail.plant === "한림공장"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}>
                      {selectedLogDetail.plant}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedLogDetail.date} ({selectedLogDetail.shift || "주간"}) • {selectedLogDetail.createdAt || "최근 작성"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLogDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-black rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Meta Chips */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-400 block">담당 공정</span>
                <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{selectedLogDetail.process || "-"}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-400 block">담당 라인 / 설비</span>
                <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{selectedLogDetail.line || "-"}</p>
              </div>
            </div>

            {/* 1. 작업 내용 전문 (반드시 확인해야 하는 내용) */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>1. 작업 내용 전문</span>
              </span>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs leading-relaxed font-medium whitespace-pre-wrap">
                {selectedLogDetail.workContent || "작업 내용이 없습니다."}
              </div>
            </div>

            {/* 2. 특이사항 및 전달사항 */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>2. 특이사항 및 전달사항</span>
              </span>
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs leading-relaxed font-medium whitespace-pre-wrap">
                {selectedLogDetail.issues && selectedLogDetail.issues !== "특이사항 없음"
                  ? selectedLogDetail.issues
                  : "특이사항 없음 (정상 작업 완료)"}
              </div>
            </div>

            {/* ⭐ 라인별 엑셀 파일 매칭 & 비가동 공유 섹션 (실제 lineFileMatches 보유 시만 표시) */}
            {(() => {
              let matches = [];
              if (selectedLogDetail.lineFileMatches) {
                if (Array.isArray(selectedLogDetail.lineFileMatches)) {
                  matches = selectedLogDetail.lineFileMatches;
                } else if (typeof selectedLogDetail.lineFileMatches === "string") {
                  try { matches = JSON.parse(selectedLogDetail.lineFileMatches); } catch {}
                }
              }

              if (!matches || matches.length === 0) return null;

              return (
                <div className="space-y-2 p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800/80">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-black text-xs text-slate-900 dark:text-white">
                        라인별 엑셀 파일 & 비가동 매칭 내역 ({matches.length}개 라인)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyLineMatchText(matches, selectedLogDetail.date, selectedLogDetail.writer)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] shadow-xs active:scale-95 transition-all"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copyToast ? "복사완료!" : "매칭내역 복사"}</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {matches.map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/60 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md font-black text-[10px] bg-emerald-600 text-white shadow-xs">
                              {m.lineName}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] truncate max-w-[180px]">
                              📁 {m.fileName}
                            </span>
                          </div>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-[11px] font-mono">
                            {m.totalMinutes || 0}분 비가동
                          </span>
                        </div>

                        {m.records && m.records.length > 0 && (
                          <div className="pl-2 border-l-2 border-emerald-400/60 dark:border-emerald-700 text-[10.5px] text-slate-600 dark:text-slate-300 space-y-0.5 mt-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              사유: <span className="text-emerald-700 dark:text-emerald-300">{m.records[0].reason}</span> ({m.records[0].durationMinutes}분)
                            </p>
                            <p className="truncate">현상: {m.records[0].details}</p>
                            {m.records[0].actionTaken && (
                              <p className="text-slate-500 dark:text-slate-400">조치: {m.records[0].actionTaken}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 3. 전자결재 승인 및 총괄관리자 코멘트 섹션 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>3. 공장 총괄관리자 전자결재 & 코멘트</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                  selectedLogDetail.approvalStatus === "결재완료"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : selectedLogDetail.approvalStatus === "반려"
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}>
                  {selectedLogDetail.approvalStatus === "결재완료" ? "결재완료 (승인됨)" : selectedLogDetail.approvalStatus === "반려" ? "반려됨" : "내용 확인 후 결재 대기"}
                </span>
              </div>

              {/* Approval Stamp Badges */}
              <div className="grid grid-cols-2 gap-3">
                {/* 1. 작성자 날인 */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">작성자 제출</span>
                  <div className="inline-block border-2 border-blue-600 text-blue-600 rounded-xl px-3 py-1 font-black text-xs font-serif tracking-wider">
                    {selectedLogDetail.writer} [인]
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">{selectedLogDetail.createdAt || selectedLogDetail.date}</p>
                </div>

                {/* 2. 총괄관리자 결재 도장 */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    {selectedLogDetail.plant === "한림공장" ? "한림 총괄 (김동욱 책임)" : "삼랑진 총괄 (이명재 이사)"} 결재
                  </span>
                  {selectedLogDetail.approvalStatus === "결재완료" ? (
                    <div className="animate-scaleUp">
                      <div className="inline-block border-2 border-rose-600 text-rose-600 rounded-xl px-3 py-1 font-black text-xs font-serif tracking-wider shadow-xs">
                        {selectedLogDetail.approverName || (selectedLogDetail.plant === "한림공장" ? "김동욱" : "이명재")} [결재]
                      </div>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 font-mono">
                        {selectedLogDetail.approvedAt || "승인완료"}
                      </p>
                    </div>
                  ) : (
                    <div className="py-0.5">
                      <div className="inline-block border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 rounded-xl px-3 py-1 font-bold text-xs">
                        내용 확인 대기
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {selectedLogDetail.plant === "한림공장" ? "김동욱 책임" : "이명재 이사"} 결재 예정
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 💬 총괄관리자 결재 의견 / 피드백 카드 (결재 완료 시 표시) */}
              {selectedLogDetail.approvalStatus === "결재완료" && selectedLogDetail.approvalComment && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-black text-indigo-950 dark:text-indigo-200">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>총괄관리자 결재 의견 및 지시사항</span>
                    </span>
                    <span className="text-[10.5px] text-indigo-600 dark:text-indigo-400 font-bold">
                      {selectedLogDetail.approverName} {selectedLogDetail.approverTitle} 날인
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-950 dark:text-indigo-100 font-medium leading-relaxed shadow-2xs whitespace-pre-wrap">
                    "{selectedLogDetail.approvalComment}"
                  </div>
                </div>
              )}

              {/* ✍️ 결재 코멘트 입력창 및 승인 액션 (권한 있는 총괄관리자에게 표시) */}
              {canApproveLog(selectedLogDetail) && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  {selectedLogDetail.approvalStatus !== "결재완료" ? (
                    <>
                      {/* 결재 코멘트 입력란 */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>결재 코멘트 / 지시사항 입력 (선택)</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-medium">
                            작업자에게 전달될 피드백을 남겨주세요
                          </span>
                        </div>
                        <textarea
                          rows="2"
                          value={approvalCommentInput}
                          onChange={(e) => setApprovalCommentInput(e.target.value)}
                          placeholder="예: 특이사항 확인 완료. 금형 예열 및 2라인 안전 작업 철저히 진행 바랍니다."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium shadow-2xs"
                        />

                        {/* 빠른 선택 프리셋 버튼 */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {[
                            "확인 완료. 수고하셨습니다.",
                            "안전 작업 및 설비 점검 철저",
                            "품질 치수 및 불량률 집중 관리",
                            "납기 대응 일정 준수 바람"
                          ].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setApprovalCommentInput(preset)}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 transition-all border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 하단 액션 버튼 */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleRejectLog(selectedLogDetail.id)}
                          className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all"
                        >
                          보완요청 / 반려
                        </button>
                        <button
                          onClick={() => handleApproveLog(selectedLogDetail.id, approvalCommentInput)}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                        >
                          <CheckCheck className="w-4 h-4" />
                          <span>내용 확인 & 코멘트 결재 승인 (도장 날인)</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    /* 이미 결재 완료된 경우 */
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>정상 결재 승인된 일지입니다.</span>
                      </div>
                      <button
                        onClick={() => handleRejectLog(selectedLogDetail.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all"
                      >
                        결재 취소 / 반려
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div>
                {(currentProfile?.name === selectedLogDetail.writer || isAdmin) && (
                  <button
                    onClick={() => {
                      if (window.confirm("이 업무일지를 삭제하시겠습니까?")) {
                        handleDeleteLog(selectedLogDetail.id);
                        setSelectedLogDetail(null);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>삭제</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedLogDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 [ADMIN 전용] 작업자별 접속 기록 상세 조회 모달 */}
      {/* ========================================================================= */}
      {selectedWorkerForLogs && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base text-white shadow-md ${
                  selectedWorkerForLogs.plant === "한림공장" ? "bg-emerald-600 ring-2 ring-emerald-400/30" : "bg-amber-500 ring-2 ring-amber-400/30"
                }`}>
                  {selectedWorkerForLogs.avatar || selectedWorkerForLogs.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {selectedWorkerForLogs.name} {selectedWorkerForLogs.title || ""} 접속 기록
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      selectedWorkerForLogs.plant === "한림공장"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}>
                      {selectedWorkerForLogs.plant}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    담당 공정: {selectedWorkerForLogs.assignedProcess} • 총 접속 이력 {(accessLogs[selectedWorkerForLogs.id] || []).length}건
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedWorkerForLogs(null)}
                className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Access Logs List */}
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {!(accessLogs[selectedWorkerForLogs.id]?.length > 0) ? (
                <div className="py-12 px-4 text-center space-y-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-500">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-800 dark:text-slate-200">
                      등록된 실시간 접속 기록이 없습니다.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      이 시점 이후 해당 작업자({selectedWorkerForLogs.name} {selectedWorkerForLogs.title})가 모바일 또는 PC로 로그인하면 접속 일시와 기기 정보가 자동 기록됩니다.
                    </p>
                  </div>
                </div>
              ) : (
                accessLogs[selectedWorkerForLogs.id].map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg ${
                          entry.deviceType === "MOBILE"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        }`}>
                          {entry.deviceType === "MOBILE" ? (
                            <Smartphone className="w-4 h-4" />
                          ) : (
                            <Laptop className="w-4 h-4" />
                          )}
                        </span>
                        <div>
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {entry.device}
                          </span>
                          <span className="ml-2 text-[10px] text-slate-400 font-mono">
                            {entry.ip}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700" title={entry.timestamp}>
                        {formatRelativeAccessTime(entry.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-indigo-500" />
                        <span>{entry.action || "포털 로그인"}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        📍 {entry.location || selectedWorkerForLogs.plant}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Close */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedWorkerForLogs(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ [업로드 직후 자동 팝업] 라인별 엑셀 파일 매칭 공유 리포트 모달 */}
      {lineMatchShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-7 border-2 border-emerald-500 shadow-2xl space-y-4 my-6 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/25">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <span>압출 라인별 엑셀 파일 매칭 및 비가동 공유 리포트</span>
                  </h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    {lineMatchShareModal.writer} 책임 • {lineMatchShareModal.date} 주간 실적 (총 {lineMatchShareModal.totalMinutes}분 비가동)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLineMatchShareModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 text-base font-black rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Explanatory Banner */}
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 font-medium">
              💡 업로드하신 각 라인별 엑셀 파일이 설비 라인과 정확하게 매칭되어 데이터베이스에 반영되었습니다. 아래 버튼을 눌러 카카오톡이나 사내 메신저로 즉시 공유하실 수 있습니다.
            </div>

            {/* Matched Lines List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {lineMatchShareModal.matches.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg font-black text-xs bg-emerald-600 text-white shadow-xs">
                        {m.lineName}
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                        📁 {m.fileName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">({m.fileSize})</span>
                    </div>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                      {m.totalMinutes || 0}분 비가동
                    </span>
                  </div>

                  {m.records && m.records.length > 0 && (
                    <div className="pl-3 border-l-2 border-emerald-500 dark:border-emerald-600 text-slate-700 dark:text-slate-300 text-[11px] space-y-0.5">
                      <p className="font-bold text-slate-900 dark:text-white">
                        • 사유: <strong className="text-emerald-700 dark:text-emerald-300">{m.records[0].reason}</strong> ({m.records[0].durationMinutes}분)
                      </p>
                      <p>• 현상: {m.records[0].details}</p>
                      {m.records[0].actionTaken && (
                        <p className="text-slate-500 dark:text-slate-400">• 조치: {m.records[0].actionTaken}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setLineMatchShareModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
              >
                닫기
              </button>

              <button
                type="button"
                onClick={() => handleCopyLineMatchText(lineMatchShareModal.matches, lineMatchShareModal.date, lineMatchShareModal.writer)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>{copyToast ? "✓ 클립보드에 복사 완료!" : "📋 라인별 매칭 내용 전체 복사 (공유용)"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write Work Log & Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto">
          {isInjoo ? (
            /* ========================================================================= */
            /* ⭐ [조인주 선임 전용] 탭했을 때 뜨는: 1. 작성란 & 2. 드래그업로드 창 */
            /* ========================================================================= */
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                      오늘의 업무일지 작성 & 매입매출 엑셀 등록
                    </h3>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                      삼랑진공장 • 조인주 선임 [경리업무]
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-black rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* 2 Dedicated Panes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PANE 1: 📝 오늘의 업무일지 작성란 */}
                <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
                    <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>1. 업무일지 작성란</span>
                    </h4>
                    <span className="text-[11px] font-bold text-slate-400">
                      {formData.date}
                    </span>
                  </div>

                  <form onSubmit={handleSaveLog} className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">작성일자</label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">근무형태</label>
                        <select
                          value={formData.shift}
                          onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200"
                        >
                          <option value="주간">주간</option>
                          <option value="야간">야간</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">담당공정</label>
                        <input
                          type="text"
                          value="경리업무"
                          disabled
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                        주요 작업 내용 (경리 / 결산 / 정산)
                      </label>
                      <textarea
                        rows="3"
                        placeholder="예: 8월 매입매출 마감 전표 대조, 전자세금계산서 발행 및 현장 정산 정리"
                        value={formData.workContent}
                        onChange={(e) => setFormData({ ...formData, workContent: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                        특이사항 및 전달사항 (선택)
                      </label>
                      <input
                        type="text"
                        placeholder="특이사항 입력 (없을 시 비워두기)"
                        value={formData.issues}
                        onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {logSavedToast && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>일지가 저장되었습니다!</span>
                        </span>
                      )}
                      <button
                        type="submit"
                        className="ml-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>오늘의 업무일지 등록</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* PANE 2: 📊 매입매출현황 엑셀 드래그 앤 드롭 업로드 창 */}
                <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
                    <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-emerald-600" />
                      <span>2. 매입매출 엑셀 드래그 업로드</span>
                    </h4>
                    {parsedResult && (
                      <button
                        onClick={() => { setParsedResult(null); setUploadSuccess(false); }}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline"
                      >
                        새 파일 올리기
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={(e) => handleExcelFile(e.target.files?.[0])}
                  />

                  {!parsedResult ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[170px] ${
                        dragActive
                          ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 scale-[1.01]"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-emerald-400 hover:bg-emerald-50/20"
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shadow-sm">
                        {parsing ? (
                          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <FileSpreadsheet className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {parsing ? "엑셀 데이터 분석 중..." : "매입매출 엑셀 파일을 여기에 드래그하세요"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          또는 클릭하여 컴퓨터에서 파일 선택 (.xlsx, .xls)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <div className="text-left min-w-0">
                            <span className="font-black text-xs text-slate-900 dark:text-white block truncate max-w-[170px]">
                              {parsedResult.fileName}
                            </span>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                              {parsedResult.yearMonth} 기준 • 추출 {parsedResult.items?.length || 0}건
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          매출: {formatAmount(parsedResult.totalSales || 0)}
                        </span>
                      </div>

                      {uploadSuccess ? (
                        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">{successMessage}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={handleConfirmExcelUpload}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          {uploading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>데이터베이스 반영 중...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{parsedResult.yearMonth} 매입매출 데이터베이스 즉시 반영하기</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isExtrusionWorker ? (
            /* ========================================================================= */
            /* ⭐ [압출동 전용: 설유철 책임] 압출동 업무일지 작성 모달 (엑셀 업로드 제거) */
            /* ========================================================================= */
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-7 border-2 border-emerald-500/40 dark:border-emerald-600/40 shadow-2xl space-y-4 my-6 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                    <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <span>압출동 업무일지 작성</span>
                    </h3>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      {workerPlant} • {workerFullName} {officialTitle} [압출동 관리]
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-black rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveLog} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">작성일자</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">근무형태</label>
                    <select
                      value={formData.shift}
                      onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="주간">주간 (08:00~17:00)</option>
                      <option value="야간">야간 (20:00~05:00)</option>
                      <option value="특근">주말 특근</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">작성자</label>
                    <input
                      type="text"
                      value={workerFullName + " " + officialTitle}
                      disabled
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-xs font-bold text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    담당 공정 및 압출 라인
                  </label>
                  <input
                    type="text"
                    value={formData.line || "압출 전 라인 (PCM 1호, PCM 3호, TPE 1호, PVC 등)"}
                    onChange={(e) => setFormData({ ...formData, line: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    주요 작업 실적 및 라인별 가동/비가동 요약 <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows="4"
                    placeholder="오늘 진행한 압출 라인별 생산 실적, 금형 세팅 및 교체, 가동 현황, 비가동 조치사항을 입력해 주세요."
                    value={formData.workContent}
                    onChange={(e) => setFormData({ ...formData, workContent: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    특이사항 및 설비 조치사항 (선택)
                  </label>
                  <input
                    type="text"
                    placeholder="설비 이상, 히터/온도 센서 점검, 원료 로트 교체 등 (선택)"
                    value={formData.issues}
                    onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  {logSavedToast && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>일지가 저장되었습니다!</span>
                    </span>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>오늘의 압출동 업무일지 등록</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : isQualityWorker ? (
            /* ========================================================================= */
            /* ⭐ [품질관리 전용: 이창엽/이상기] 탭했을 때 뜨는: 1. 업무일지 작성란 & 2. 품질 2개 파일 드래그업로드 창 */
            /* ========================================================================= */
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                      오늘의 업무일지 작성 & 일일 품질현황 엑셀 2개 파일 등록
                    </h3>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      {workerPlant} • {workerFullName} {officialTitle} [품질관리]
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-black rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* 2 Dedicated Panes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PANE 1: 📝 오늘의 업무일지 작성란 */}
                <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
                    <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>1. 업무일지 작성란</span>
                    </h4>
                    <span className="text-[11px] font-bold text-slate-400">
                      {formData.date}
                    </span>
                  </div>

                  <form onSubmit={handleSaveLog} className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">작성일자</label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">근무형태</label>
                        <select
                          value={formData.shift}
                          onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200"
                        >
                          <option value="주간">주간</option>
                          <option value="야간">야간</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">담당공정</label>
                        <input
                          type="text"
                          value="품질관리"
                          disabled
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                        주요 작업 내용 (품질 검사 / 불량 분석 / 로트 추적)
                      </label>
                      <textarea
                        rows="3"
                        placeholder="예: JA / HR / NX4 G-RUN 일일 품질검사 실적 및 불량률(수포, 어퍼떨어짐 등) 집계 및 부적합 조치"
                        value={formData.workContent}
                        onChange={(e) => setFormData({ ...formData, workContent: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                        특이사항 및 개선 조치 (선택)
                      </label>
                      <input
                        type="text"
                        placeholder="특이사항 입력 (예: HR G-RUN 어퍼떨어짐 공정 피드백 완료)"
                        value={formData.issues}
                        onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {logSavedToast && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>일지가 저장되었습니다!</span>
                        </span>
                      )}
                      <button
                        type="submit"
                        className="ml-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>오늘의 업무일지 등록</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* PANE 2: 🔍 일일 품질현황 엑셀 파일 2개 드래그 앤 드롭 업로드 창 */}
                <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-800/80 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
                    <div className="flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                        2. 품질 엑셀 파일 2개 드래그 업로드
                      </h4>
                    </div>
                    {qualityFiles.length > 0 && (
                      <button
                        onClick={() => { setQualityFiles([]); setQualityUploadSuccess(false); }}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline"
                      >
                        새 파일 올리기
                      </button>
                    )}
                  </div>

                  <input
                    ref={qualityFileInputRef}
                    type="file"
                    multiple
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={(e) => handleQualityFiles(e.target.files)}
                  />

                  {qualityFiles.length === 0 ? (
                    <div
                      onDragEnter={handleQualityDrag}
                      onDragOver={handleQualityDrag}
                      onDragLeave={handleQualityDrag}
                      onDrop={handleQualityDrop}
                      onClick={() => qualityFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[170px] ${
                        qualityDragActive
                          ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 scale-[1.01]"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-400 hover:bg-indigo-50/20"
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shadow-sm">
                        {qualityParsing ? (
                          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <FileSpreadsheet className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {qualityParsing ? "품질 엑셀 파일 분석 중..." : "품질 관련 엑셀 파일 2개를 여기에 드래그하세요"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          (일일품질검사실적.xlsx & 불량내역분석.xlsx)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        {qualityFiles.map((f, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                              <div className="text-left min-w-0">
                                <span className="font-bold text-[11px] text-slate-900 dark:text-white block truncate max-w-[180px]">
                                  {f.name}
                                </span>
                                <span className="text-[9.5px] text-indigo-600 dark:text-indigo-400 font-bold">
                                  파일 #{i + 1} • {f.size}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                              준비완료
                            </span>
                          </div>
                        ))}
                      </div>

                      {qualityUploadSuccess ? (
                        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">{qualitySuccessMessage}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={qualityUploading}
                          onClick={handleConfirmQualityUpload}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          {qualityUploading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>품질 데이터베이스 반영 중...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>품질 엑셀 {qualityFiles.length}개 파일 데이터베이스 즉시 반영하기</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* ⭐ [일반 작업자용] 표준 업무일지 작성 모달 */
            /* ========================================================================= */
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>오늘의 업무일지 작성</span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 text-sm font-black"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveLog} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">작성 일자</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">소속 공장</label>
                    <select
                      value={formData.plant}
                      onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    >
                      <option value="삼랑진공장">삼랑진공장</option>
                      <option value="한림공장">한림공장</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">작성자</label>
                    <input
                      type="text"
                      value={formData.writer}
                      disabled
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">담당 공정</label>
                    <input
                      type="text"
                      value={formData.process}
                      disabled
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">세부 라인 / 설비</label>
                  <input
                    type="text"
                    placeholder="예: PCM 1호 라인, JA 가공 2호기 등"
                    value={formData.line}
                    onChange={(e) => setFormData({ ...formData, line: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">주요 작업 실적</label>
                  <textarea
                    rows="3"
                    placeholder="오늘 진행한 주요 작업 내용 및 생산 수량을 입력해 주세요."
                    value={formData.workContent}
                    onChange={(e) => setFormData({ ...formData, workContent: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                  ></textarea>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">특이사항 및 전달사항</label>
                  <input
                    type="text"
                    placeholder="설비 이상, 원료 교체, 품질 이슈 등 (선택)"
                    value={formData.issues}
                    onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-500/25"
                  >
                    등록하기
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📌 태형&미영 일정 등록 모달 */}
      {/* ========================================================================= */}
      {commonScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-indigo-500/40 shadow-2xl p-4 sm:p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    태형&미영 일정 등록
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    세미나, 교육, 여행, 맛집, 기타 중 분류를 선택하여 일정을 등록합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCommonScheduleModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterCommonSchedule} className="space-y-3.5">
              {/* 구분 선택 버튼 그룹 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  선택
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { key: "세미나", label: "세미나", activeBg: "bg-blue-600 text-white border-blue-600 shadow-xs" },
                    { key: "교육", label: "교육", activeBg: "bg-emerald-600 text-white border-emerald-600 shadow-xs" },
                    { key: "여행", label: "여행", activeBg: "bg-amber-600 text-white border-amber-600 shadow-xs" },
                    { key: "맛집", label: "맛집", activeBg: "bg-rose-600 text-white border-rose-600 shadow-xs" },
                    { key: "기타", label: "기타", activeBg: "bg-purple-600 text-white border-purple-600 shadow-xs" }
                  ].map((item) => {
                    const isSelected = commonScheduleForm.target === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setCommonScheduleForm({ ...commonScheduleForm, target: item.key })}
                        className={`py-1.5 px-1 rounded-xl text-xs font-black border transition-all cursor-pointer text-center ${
                          isSelected
                            ? item.activeBg
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 일자 & 시간 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    일자
                  </label>
                  <input
                    type="date"
                    required
                    value={commonScheduleForm.date}
                    onChange={(e) => setCommonScheduleForm({ ...commonScheduleForm, date: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    시간
                  </label>
                  <input
                    type="text"
                    placeholder="예: 09:30, 14:00, 종일"
                    value={commonScheduleForm.time}
                    onChange={(e) => setCommonScheduleForm({ ...commonScheduleForm, time: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Quick Time Presets */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-bold">빠른 시간:</span>
                {["09:30", "14:00", "16:00", "종일"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCommonScheduleForm({ ...commonScheduleForm, time: t })}
                    className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* 일정 내용 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  일정 내용
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: AI 세미나 참석 / 주말 가족 여행 / 맛집 탐방"
                  value={commonScheduleForm.title}
                  onChange={(e) => setCommonScheduleForm({ ...commonScheduleForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCommonScheduleModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={commonScheduleSaving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{commonScheduleSaving ? "등록 중..." : "일정 등록"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📱 매일 아침 손익결산 브리핑 예시화면 및 텔레그램 발송 모달 */}
      {/* ========================================================================= */}
      {dailyPnLModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-4 py-4 sm:py-8 flex justify-center items-start sm:items-center animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md">
                  <Send className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>📱 매일 아침 손익결산 텔레그램 메시지 예시화면</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      07:30 정기 브리핑
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    매출액, 매입액, 전월대비 매출/매입 달성율, 공통일정을 포함한 실시간 발송 템플릿입니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDailyPnLModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 2-Column Layout: Left (Smartphone Mockup) vs Right (Live Form Controls) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Left Side: Smartphone / Telegram Bubble Mockup (7 cols) */}
              <div className="md:col-span-7 bg-slate-900 text-slate-100 rounded-2xl p-4 border border-slate-800 shadow-inner space-y-3 font-sans">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>
                      {selectedPnLChannel === "-1003939516875"
                        ? "👑 경영방 (대표·전무 전용 채널)"
                        : selectedPnLChannel === "290615483"
                        ? "👤 권태형 대표님 1:1 대화방"
                        : "📢 오륙 통합방 채널"}
                    </span>
                  </div>
                  <span className="text-[10.5px] font-mono">07:30 AM</span>
                </div>

                {/* Telegram Message Bubble */}
                <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 space-y-3 text-xs leading-relaxed shadow-md">
                  {/* Header */}
                  <div>
                    <div className="font-black text-sm text-white flex items-center gap-1.5">
                      <span>⬛ [오륙 {selectedPnLChannel === "-1003939516875" || selectedPnLChannel === "290615483" ? "경영진/임원" : "경영정보"}] 일일 아침 손익결산 브리핑</span>
                    </div>
                    <div className="text-[11px] font-extrabold text-sky-400 mt-0.5">
                      {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })} 07:30 기준
                    </div>
                  </div>

                  <div className="border-t border-slate-700/60 pt-2 space-y-2">
                    {/* [1] 매입 / 매출 현황 */}
                    <div>
                      <div className="font-extrabold text-amber-400 text-xs mb-1">
                        [1] 당월 매입 / 매출 결산 현황
                      </div>
                      <div className="pl-2 space-y-0.5 text-slate-200">
                        <div>• <strong>매출액:</strong> <span className="font-bold text-white">₩{Number(customPnLBriefing?.salesAmount ?? totalSales).toLocaleString()}원</span></div>
                        <div>• <strong>매입액:</strong> <span className="font-bold text-rose-300">₩{Number(customPnLBriefing?.purchaseAmount ?? totalPurchases).toLocaleString()}원</span></div>
                        <div>• <strong>매출대비 원가율:</strong> <span className="font-bold text-indigo-300">{(((customPnLBriefing?.purchaseAmount ?? totalPurchases) / ((customPnLBriefing?.salesAmount ?? totalSales) || 1)) * 100).toFixed(1)}%</span></div>
                      </div>
                    </div>

                    {/* [2] 전월 실적 대비 달성율 */}
                    <div>
                      <div className="font-extrabold text-emerald-400 text-xs mb-1">
                        [2] 전월 실적 대비 달성율 ({prevMonthKey?.split("-")[1] || "8"}월 실적 대비)
                      </div>
                      <div className="pl-2 space-y-0.5 text-slate-200">
                        <div>• <strong>전월대비 매출 달성율:</strong> <strong className="text-emerald-300 font-bold">{customPnLBriefing?.salesAchievementRate || `${salesAchievementPct}% (${Number(salesAchievementPct) >= 100 ? `▲ +${(Number(salesAchievementPct) - 100).toFixed(1)}% 초과` : `▼ ${(Number(salesAchievementPct) - 100).toFixed(1)}%`})`}</strong></div>
                        <div>• <strong>전월대비 매입 달성율:</strong> <strong className="text-sky-300 font-bold">{customPnLBriefing?.purchaseAchievementRate || `${purchaseAchievementPct}% (${Number(purchaseAchievementPct) <= 100 ? `▼ ${(100 - Number(purchaseAchievementPct)).toFixed(1)}% 절감` : `▲ +${(Number(purchaseAchievementPct) - 100).toFixed(1)}%`})`}</strong></div>
                      </div>
                    </div>

                    {/* [3] 오늘의 태형&미영 일정 */}
                    <div>
                      <div className="font-extrabold text-purple-400 text-xs mb-1">
                        [3] 오늘의 태형&미영 일정
                      </div>
                      <div className="pl-2 whitespace-pre-wrap text-slate-200 text-[11px] leading-relaxed">
                        {customPnLBriefing?.commonSchedules || (todayCommonSchedules.length > 0
                          ? todayCommonSchedules.map((s) => `• ${s.time && s.time !== "종일" ? `[${s.time}] ` : ""}${s.target ? `[${s.target}] ` : ""}${s.title}`).join("\n")
                          : "• 등록된 태형&미영 일정이 없습니다. (정상 생산 가동)")}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-blue-400 underline cursor-pointer hover:text-blue-300">
                      손익관리시스템 바로가기
                    </span>
                    <span className="text-[10px] text-slate-500">오륙 텔레그램 알림봇</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Interactive Controls (5 cols) */}
              <div className="md:col-span-5 space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 dark:text-white text-xs">
                      📊 발송 수치 실시간 조정
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomPnLBriefing(null)}
                      className="text-[10.5px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      실시간 값 리셋
                    </button>
                  </div>

                  {/* 발송 대상 채널 선택 (경영방 / 통합방 / 대표 1:1) */}
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      발송 대상 채널 (수신처 구분)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "-1003939516875", label: "👑 경영방", desc: "대표·전무 전용", activeBg: "bg-purple-600 text-white border-purple-600 shadow-xs" },
                        { id: "-4186792536", label: "📢 통합방", desc: "오륙 전체방", activeBg: "bg-blue-600 text-white border-blue-600 shadow-xs" },
                        { id: "290615483", label: "👤 대표님 1:1", desc: "개인 직송", activeBg: "bg-amber-600 text-white border-amber-600 shadow-xs" }
                      ].map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setSelectedPnLChannel(ch.id)}
                          className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                            selectedPnLChannel === ch.id
                              ? ch.activeBg
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                          }`}
                        >
                          <div className="text-xs font-black">{ch.label}</div>
                          <div className="text-[10px] opacity-80">{ch.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 매출액 */}
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-0.5">매출액 (원)</label>
                    <input
                      type="number"
                      value={customPnLBriefing?.salesAmount ?? totalSales}
                      onChange={(e) => setCustomPnLBriefing({
                        ...(customPnLBriefing || {}),
                        salesAmount: Number(e.target.value)
                      })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* 매입액 */}
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-0.5">매입액 (원)</label>
                    <input
                      type="number"
                      value={customPnLBriefing?.purchaseAmount ?? totalPurchases}
                      onChange={(e) => setCustomPnLBriefing({
                        ...(customPnLBriefing || {}),
                        purchaseAmount: Number(e.target.value)
                      })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* 매출 달성율 */}
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-0.5">전월대비 매출 달성율 문구</label>
                    <input
                      type="text"
                      placeholder="예: 102.4% (▲ 2.4% 초과)"
                      value={customPnLBriefing?.salesAchievementRate ?? `${salesAchievementPct}% (${Number(salesAchievementPct) >= 100 ? `▲ +${(Number(salesAchievementPct) - 100).toFixed(1)}% 초과` : `▼ ${(Number(salesAchievementPct) - 100).toFixed(1)}%`})`}
                      onChange={(e) => setCustomPnLBriefing({
                        ...(customPnLBriefing || {}),
                        salesAchievementRate: e.target.value
                      })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* 매입 달성율 */}
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-0.5">전월대비 매입 달성율 문구</label>
                    <input
                      type="text"
                      placeholder="예: 98.7% (▼ 1.3% 절감)"
                      value={customPnLBriefing?.purchaseAchievementRate ?? `${purchaseAchievementPct}% (${Number(purchaseAchievementPct) <= 100 ? `▼ ${(100 - Number(purchaseAchievementPct)).toFixed(1)}% 절감` : `▲ +${(Number(purchaseAchievementPct) - 100).toFixed(1)}%`})`}
                      onChange={(e) => setCustomPnLBriefing({
                        ...(customPnLBriefing || {}),
                        purchaseAchievementRate: e.target.value
                      })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* 공통일정 문구 */}
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-0.5">공통일정 포함 내용</label>
                    <textarea
                      rows="3"
                      value={customPnLBriefing?.commonSchedules ?? (todayCommonSchedules.length > 0
                        ? todayCommonSchedules.map((s) => `• ${s.time && s.time !== "종일" ? `[${s.time}] ` : ""}${s.target ? `[${s.target}] ` : ""}${s.title}`).join("\n")
                        : "• 등록된 전사 공통일정이 없습니다. (정상 생산 가동)")}
                      onChange={(e) => setCustomPnLBriefing({
                        ...(customPnLBriefing || {}),
                        commonSchedules: e.target.value
                      })}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white text-[11px]"
                    ></textarea>
                  </div>
                </div>

                {/* Trigger Button */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    disabled={sendingDailyPnL}
                    onClick={handleSendDailyPnLTelegram}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 hover:from-black hover:to-blue-950 text-white font-black text-xs shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-sky-400" />
                    <span>
                      {sendingDailyPnL
                        ? "텔레그램 발송 중..."
                        : `🚀 [${selectedPnLChannel === "-1003939516875" ? "경영방 (대표·전무)" : selectedPnLChannel === "290615483" ? "대표님 1:1" : "통합방"}]으로 즉시 발송하기`}
                    </span>
                  </button>
                  <p className="text-[10px] text-center text-slate-400">
                    {selectedPnLChannel === "-1003939516875"
                      ? "경영진/대표·전무 전용 경영방으로 손익결산 브리핑이 안전하게 구분 발송됩니다."
                      : selectedPnLChannel === "290615483"
                      ? "권태형 대표님 1:1 개인톡으로 손익결산 브리핑이 발송됩니다."
                      : "오륙 전체 통합방으로 손익결산 브리핑이 발송됩니다."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
