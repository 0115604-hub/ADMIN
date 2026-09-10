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
  Send,
  Camera,
  Download,
  Image as ImageIcon,
  Copy,
  Eye,
  MessageCircle
} from "lucide-react";
import * as XLSX from "xlsx";

// Client-side image compression for fast sync & light Firestore storage
const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: (dataUrl.length * (3 / 4) / 1024).toFixed(1) + " KB",
          dataUrl
        });
      };
    };
  });
};
import { useAuth, PLANTS } from "../context/AuthContext";
import { useMonth, DEFAULT_MONTH_LIST } from "../context/MonthContext";
import { useCurrency } from "../context/CurrencyContext";
import { parseExcelFile } from "../utils/excelHelper";
import {
  getLocalSmartOvertimeData,
  calculateDailySummary,
  subscribeSmartOvertimeData
} from "../services/overtimeSmartService.js";
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
  completeOrDismissAnnualLeave,
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
  toggleCompleteCommonSchedule,
  subscribeCommonSchedules,
  subscribeCommonScheduleArchive,
  getLocalCommonScheduleArchive,
  isScheduleExpired,
  addCommonScheduleComment,
  deleteCommonScheduleComment,
  getTodayCommonSchedules,
  cleanupExpiredCommonSchedules,
  formatCommonSchedulesForTelegram,
  getUncompletedCommonSchedules,
  getScheduleCategoryMeta
} from "../services/commonScheduleService";
import { sendDailyPnLMorningBriefingTelegram, sendCommonScheduleRegisteredTelegram, sendCommonScheduleCommentTelegram } from "../services/telegramService";
import { getKSTDateString, formatRelativeAccessTime } from "../utils/dateUtils";

// 30분 단위 시간 선택 목록 (종일 + 24시간 30분 간격)
const TIME_OPTIONS_30MIN = [
  "종일",
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30",
  "03:00", "03:30", "04:00", "04:30", "05:00", "05:30"
];

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
  author: "오상민 선임",
  headcount: 12,
  manHours: 96,
  cost: 1440000,
  monthHeadcount: 48,
  monthManHours: 384,
  monthCumulativeCost: 5760000,
  approval: [
    { role: "담당", name: "오상민" },
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

// 🌟 [설비보전 전용: 전재율 책임] 설비 대분류 및 설비명 드롭다운 항목 정의
export const JAEYUL_EQUIPMENT_CATEGORIES = [
  "압출기",
  "사출기",
  "컴프레셔",
  "코팅설비",
  "치공구",
  "기타"
];

export const JAEYUL_EQUIPMENT_OPTIONS = [
  "PCM 1호",
  "PCM 2호",
  "PCM 3호",
  "TPE 1호",
  "PVC",
  "300TON",
  "45TON",
  "25TON",
  "압출동 컴프레셔",
  "AB동 컴프레셔",
  "C동 컴프레셔",
  "코팅(8턴)",
  "코팅(서랍)",
  "내용직접입력"
];

export const JAEYUL_CATEGORY_EQUIPMENT_MAP = {
  "압출기": ["PCM 1호", "PCM 2호", "PCM 3호", "TPE 1호", "PVC", "내용직접입력"],
  "사출기": ["300TON", "45TON", "25TON", "내용직접입력"],
  "컴프레셔": ["압출동 컴프레셔", "AB동 컴프레셔", "C동 컴프레셔", "내용직접입력"],
  "코팅설비": ["코팅(8턴)", "코팅(서랍)", "내용직접입력"],
  "치공구": ["내용직접입력"],
  "기타": ["내용직접입력"]
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
  const isJaeyul = currentProfile?.name === "전재율" || currentProfile?.id === "sam_jy" || currentProfile?.assignedProcess === "설비보전" || (assignedProcess?.includes("설비보전"));
  const isQualityWorker = currentProfile?.assignedProcess === "품질관리" || currentProfile?.name === "이창엽" || currentProfile?.name === "이상기" || currentProfile?.id === "sam_cy" || currentProfile?.id === "sam_sg";
  const isExtrusionWorker = currentProfile?.name === "설유철" || currentProfile?.id === "sam_yc" || currentProfile?.assignedProcess?.includes("압출") || (assignedProcess?.includes("압출"));
  const isChangyong = currentProfile?.name === "우창용" || currentProfile?.id === "hal_cy";

  // General Manager Identification
  const isMyeongjae = currentProfile?.name === "이명재" || currentProfile?.id === "sam_mj";
  const isDongwook = currentProfile?.name === "김동욱" || currentProfile?.id === "hal_dw";
  const isGeneralManager = isMyeongjae || isDongwook || isAdmin || currentProfile?.assignedProcess === "총괄관리";

  // Approval Documents Subscription (Real-time for Top Panel)
  // 5 Company Smart Overtime Ledger Subscription for Panel 4
  const [smartOvertimeData, setSmartOvertimeData] = useState(() => getLocalSmartOvertimeData());

  useEffect(() => {
    const unsub = subscribeSmartOvertimeData((data) => {
      if (data && data.attendanceMatrix) {
        setSmartOvertimeData(data);
      }
    });
    return () => unsub();
  }, []);

  const companyOverviewStats = useMemo(() => {
    const matrix = smartOvertimeData?.attendanceMatrix || [];
    const daily = calculateDailySummary(matrix, 8);
    const defaultMeta = {
      "(주)오륙": { workers: 67, attended: 67, otHours: 97, totalHours: 633, dot: "bg-blue-500", borderHover: "hover:border-blue-400 dark:hover:border-blue-500", badgeColor: "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800" },
      "(주)조영산업": { workers: 18, attended: 18, otHours: 36, totalHours: 180, dot: "bg-purple-500", borderHover: "hover:border-purple-400 dark:hover:border-purple-500", badgeColor: "text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 border-purple-200 dark:border-purple-800" },
      "한울": { workers: 12, attended: 12, otHours: 21, totalHours: 117, dot: "bg-emerald-500", borderHover: "hover:border-emerald-400 dark:hover:border-emerald-500", badgeColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800" },
      "부림텍": { workers: 10, attended: 10, otHours: 14, totalHours: 94, dot: "bg-amber-500", borderHover: "hover:border-amber-400 dark:hover:border-amber-500", badgeColor: "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800" },
      "유성": { workers: 5, attended: 5, otHours: 6, totalHours: 44, dot: "bg-cyan-500", borderHover: "hover:border-cyan-400 dark:hover:border-cyan-500", badgeColor: "text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-800" }
    };

    return ["(주)오륙", "(주)조영산업", "한울", "부림텍", "유성"].map((name) => {
      const meta = defaultMeta[name];
      const b = daily?.companyBreakdown?.[name];
      return {
        name,
        workers: b?.total ?? meta.workers,
        attended: b?.attended ?? meta.attended,
        otHours: b?.otHours ?? meta.otHours,
        totalHours: b?.totalHours ?? meta.totalHours,
        dot: meta.dot,
        borderHover: meta.borderHover,
        badgeColor: meta.badgeColor
      };
    });
  }, [smartOvertimeData]);

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
  const [qualityPopupItem, setQualityPopupItem] = useState(null);
  const [qualityGraphMode, setQualityGraphMode] = useState("trend"); // "trend" | "bar"
  const [qualityGraphFilter, setQualityGraphFilter] = useState("all"); // "all" | "hr" | "ja" | "nx4a" | "nx4"

  useEffect(() => {
    const unsub = subscribeQualityRecords((recs) => {
      setQualityRecords(recs);
    });
    return () => unsub();
  }, []);

  // ESC to close quality popup
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setQualityPopupItem(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  const liveQualityCurrentMonthly = useMemo(() => {
    return getQualityMonthlyAggregation(qualityRecords, selectedMonth || "2026-09");
  }, [qualityRecords, selectedMonth]);

  const liveQualityDaily = useMemo(() => {
    return getQualityDailyAggregation(qualityRecords, selectedMonth || "2026-09");
  }, [qualityRecords, selectedMonth]);

  const handleExportQualityItemExcel = (targetItem) => {
    if (!targetItem) return;
    const rows = [
      [`[${targetItem.name}] ${selectedMonth || "2026-09"} 일자별 품질 검사 & 불량 정리본`],
      ["차종", targetItem.carModel, "조회기준월", selectedMonth || "2026-09", "품질목표", "0.70% 이하", "출력일시", new Date().toLocaleString("ko-KR")],
      [],
      ["검사일자", "요일", "검사수량(EA)", "불량수량(EA)", "아이템 불량률(%)", "품질 손실금액(원)", "주요 불량 사유(WORST)"]
    ];

    liveQualityDaily.forEach((d) => {
      const it = d.items?.[targetItem.id] || { inspectQty: 0, defectQty: 0, defectRate: 0, lossAmount: 0, worstReason: "-" };
      rows.push([
        d.date,
        `${d.dayOfWeek}요일`,
        it.inspectQty,
        it.defectQty,
        `${it.defectRate}%`,
        it.lossAmount,
        it.worstReason || "-"
      ]);
    });

    rows.push([]);
    rows.push([
      "월간 누계 합계",
      "-",
      targetItem.inspectQty,
      targetItem.defectQty,
      `${targetItem.defectRate}%`,
      targetItem.lossAmount,
      targetItem.worstReason
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, targetItem.carModel);
    XLSX.writeFile(wb, `${targetItem.carModel}_일자별품질정리본_${selectedMonth || "2026-09"}.xlsx`);
  };

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
    issues: "",
    images: [] // 📷 첨부된 현장 작업 사진 목록 (최대 5장)
  });

  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState(null); // { url, name }

  const handleWorkLogImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    const currentImages = formData.images || [];
    if (currentImages.length >= 5) {
      alert("현장 사진은 최대 5장까지 첨부할 수 있습니다.");
      return;
    }
    const remainingSlots = 5 - currentImages.length;
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, remainingSlots);
    if (validFiles.length === 0) return;

    setIsProcessingImages(true);
    try {
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...processed].slice(0, 5)
      }));
    } catch (err) {
      console.error("사진 처리 오류:", err);
      alert("사진을 불러오거나 압축하는 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleRemoveWorkLogImage = (idx) => {
    setFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== idx)
    }));
  };

  // 🌟 [전재율 책임 전용] 설비보전 항목 동적 추가/수정/삭제 상태
  const [maintenanceItems, setMaintenanceItems] = useState([
    {
      id: 1,
      category: "압출기",
      equipmentName: "PCM 1호",
      customEquipmentName: "",
      content: ""
    }
  ]);

  const handleAddMaintenanceItem = () => {
    setMaintenanceItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        category: "압출기",
        equipmentName: "PCM 1호",
        customEquipmentName: "",
        content: ""
      }
    ]);
  };

  const handleRemoveMaintenanceItem = (id) => {
    if (maintenanceItems.length <= 1) {
      alert("최소 1개 이상의 설비보전 항목이 필요합니다.");
      return;
    }
    setMaintenanceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateMaintenanceItem = (id, field, value) => {
    setMaintenanceItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === "category") {
          const defaultEquips = JAEYUL_CATEGORY_EQUIPMENT_MAP[value] || JAEYUL_EQUIPMENT_OPTIONS;
          return {
            ...item,
            category: value,
            equipmentName: defaultEquips[0] || "PCM 1호",
            customEquipmentName: ""
          };
        }
        return { ...item, [field]: value };
      })
    );
  };

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
    leaveType: "연차(하루)",
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
    return getUserLeaveStatus(currentProfile?.id, workerFullName, annualLeaves || [], { excludeTodo: false });
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
        leaveType: "연차(하루)",
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
  // 🗓️ 전작업자 공통 스마트 일정 관리 States & Handlers
  // -------------------------------------------------------------------------
  const [scheduleSelectedDate, setScheduleSelectedDate] = useState(() => getKSTDateString());
  const [scheduleLeaveType, setScheduleLeaveType] = useState("연차(하루)");
  const [scheduleReasonInput, setScheduleReasonInput] = useState("");
  const [sharedWorkers, setSharedWorkers] = useState([]); // 전작업자 선택 목록
  const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
  const shareDropdownRef = useRef(null);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [scheduleDetailModal, setScheduleDetailModal] = useState(null); // { selectedDate, dayName, filterTab: 'day'|'week'|'all' }

  // Click outside to close share dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(e.target)) {
        setIsShareDropdownOpen(false);
      }
    };
    if (isShareDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isShareDropdownOpen]);

  const toggleSharedWorker = (worker) => {
    setSharedWorkers((prev) => {
      const exists = prev.some((w) => w.id === worker.id);
      if (exists) {
        return prev.filter((w) => w.id !== worker.id);
      } else {
        return [...prev, worker];
      }
    });
  };

  const togglePlantSharedWorkers = (plantIndex) => {
    const targetPlantWorkers =
      PLANTS[plantIndex]?.workers?.filter(
        (w) => w.id !== currentProfile?.id && w.name !== workerFullName
      ) || [];
    if (targetPlantWorkers.length === 0) return;

    setSharedWorkers((prev) => {
      const allSelected = targetPlantWorkers.every((pw) => prev.some((sw) => sw.id === pw.id));
      if (allSelected) {
        // 해당 공장 전체 작업자 선택 해제
        const targetIds = new Set(targetPlantWorkers.map((pw) => pw.id));
        return prev.filter((sw) => !targetIds.has(sw.id));
      } else {
        // 해당 공장 전체 작업자 선택 (기존 선택 유지하며 추가)
        const currentMap = new Map(prev.map((w) => [w.id, w]));
        targetPlantWorkers.forEach((pw) => {
          currentMap.set(pw.id, pw);
        });
        return Array.from(currentMap.values());
      }
    });
  };

  const [scheduleWeekAnchor, setScheduleWeekAnchor] = useState(() => getKSTDateString());

  const handlePrevWeek = () => {
    setScheduleWeekAnchor((prev) => {
      const d = new Date(prev + "T00:00:00+09:00");
      d.setDate(d.getDate() - 7);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    });
  };

  const handleNextWeek = () => {
    setScheduleWeekAnchor((prev) => {
      const d = new Date(prev + "T00:00:00+09:00");
      d.setDate(d.getDate() + 7);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    });
  };

  const handleResetToToday = () => {
    const today = getKSTDateString();
    setScheduleWeekAnchor(today);
    setScheduleSelectedDate(today);
  };

  const todayDateStr = getKSTDateString();

  // 🗓️ 현재 로그인한 작업자의 활성 등록 일정 (등록일부터 완료 또는 지정날짜까지 노출)
  const myActiveLeaves = useMemo(() => {
    if (!annualLeaves || !Array.isArray(annualLeaves)) return [];
    const myId = currentProfile?.id;
    const myName = workerFullName;

    return annualLeaves
      .filter((l) => {
        if (!l) return false;
        const matchUser = (myId && l.userId === myId) || (myName && l.userName === myName);
        if (!matchUser) return false;
        if (l.isCompleted || l.isDismissed) return false;

        const regDate = l.createdAt ? l.createdAt.slice(0, 10) : (l.createdDate || l.startDate || "");
        const startDate = l.startDate || l.date || regDate;
        const targetEndDate = l.endDate || l.startDate || l.date || regDate;
        const effectiveStart = regDate && regDate <= startDate ? regDate : startDate;

        // 노출기간: 등록일부터 지정날짜까지
        return Boolean(effectiveStart && targetEndDate && effectiveStart <= todayDateStr && todayDateStr <= targetEndDate);
      })
      .sort((a, b) => {
        const aDate = a.startDate || "";
        const bDate = b.startDate || "";
        return aDate.localeCompare(bDate);
      });
  }, [annualLeaves, todayDateStr, currentProfile?.id, workerFullName]);

  const handleDismissMyLeave = async (leaveId) => {
    try {
      await completeOrDismissAnnualLeave(leaveId);
      setToastMessage("일정이 완료되었습니다. (주차별 달력에는 기록이 보존됩니다)");
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
    } catch (err) {
      alert("일정 완료 처리 중 오류: " + err.message);
    }
  };

  // Weekly Calendar Days (주차별 7일 계산)
  const myWeeklyCalendarDays = useMemo(() => {
    if (!scheduleWeekAnchor) return [];
    const baseDate = new Date(scheduleWeekAnchor + "T00:00:00+09:00");
    const dayOfWeek = baseDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const sundayDate = new Date(baseDate);
    sundayDate.setDate(baseDate.getDate() - dayOfWeek);

    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const weekDays = [];
    const myId = currentProfile?.id;
    const myName = workerFullName;

    for (let i = 0; i < 7; i++) {
      const d = new Date(sundayDate);
      d.setDate(sundayDate.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const isToday = dateStr === todayDateStr;
      const isSelected = dateStr === scheduleSelectedDate;

      const dayEvents = (annualLeaves || []).filter((l) => {
        if (!l) return false;
        const matchUser = (myId && l.userId === myId) || (myName && l.userName === myName);
        if (!matchUser) return false;
        return (l.startDate || "") <= dateStr && (l.endDate || l.startDate || "") >= dateStr;
      });

      weekDays.push({
        dateStr,
        year: yyyy,
        month: parseInt(mm, 10),
        dayNumber: parseInt(dd, 10),
        dayName: dayNames[i],
        dayOfWeek: i,
        isToday,
        isSelected,
        events: dayEvents
      });
    }

    return weekDays;
  }, [scheduleWeekAnchor, scheduleSelectedDate, annualLeaves, todayDateStr, currentProfile?.id, workerFullName]);

  const handleRegisterSchedule = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!scheduleSelectedDate) {
      alert("일정을 등록할 일자를 선택해주세요.");
      return;
    }
    setScheduleSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const baseReason = scheduleReasonInput.trim() || scheduleLeaveType;
      const myId = currentProfile?.id || `user_${workerFullName}`;
      const myName = workerFullName;
      const myPlant = workerPlant;
      const myTitle = officialTitle;

      // 1. 현재 로그인한 작업자 일정 등록
      const newLeave = {
        userId: myId,
        userName: myName,
        plant: myPlant,
        title: myTitle,
        startDate: scheduleSelectedDate,
        endDate: scheduleSelectedDate,
        leaveType: scheduleLeaveType,
        reason: baseReason,
        sharedWith: sharedWorkers.map((w) => w.name),
        createdAt: nowIso,
        createdDate: todayDateStr,
        isCompleted: false,
        isDismissed: false
      };
      await saveAnnualLeave(newLeave);

      // 2. 선택된 전작업자(단수/복수) 일정 자동 등록
      if (sharedWorkers.length > 0) {
        for (let i = 0; i < sharedWorkers.length; i++) {
          const sw = sharedWorkers[i];
          const sharedLeave = {
            id: `leave_${Date.now()}_${sw.id}_${i}`,
            userId: sw.id,
            userName: sw.name,
            plant: sw.plant || myPlant,
            title: sw.title || "선임",
            startDate: scheduleSelectedDate,
            endDate: scheduleSelectedDate,
            leaveType: scheduleLeaveType,
            reason: `${baseReason} (${myName} 공유)`,
            sharedBy: myName,
            createdAt: nowIso,
            createdDate: todayDateStr,
            isCompleted: false,
            isDismissed: false
          };
          await saveAnnualLeave(sharedLeave);
        }
      }

      const shareNames = sharedWorkers.map((w) => w.name).join(", ");
      setToastMessage(
        `[${myName} ${myTitle}] ${scheduleSelectedDate} ${scheduleLeaveType} 일정이 등록되었습니다.${
          shareNames ? ` (공유 작업자: ${shareNames} 자동 등록)` : ""
        }`
      );
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3500);
      setScheduleReasonInput("");
      setSharedWorkers([]);
      setIsShareDropdownOpen(false);
    } catch (err) {
      alert("일정 등록 중 오류가 발생했습니다: " + err.message);
    } finally {
      setScheduleSaving(false);
    }
  };

  // 태형&미영 일정 State & Subscription
  const [commonSchedules, setCommonSchedules] = useState(() => getLocalCommonSchedules());
  const [commonScheduleFilterTab, setCommonScheduleFilterTab] = useState("all"); // 'all', 'active', 'completed'
  const [commonScheduleForm, setCommonScheduleForm] = useState({
    date: getKSTDateString(),
    time: "09:30",
    target: "세미나",
    title: ""
  });
  const [commonScheduleSaving, setCommonScheduleSaving] = useState(false);
  const [commonScheduleModalOpen, setCommonScheduleModalOpen] = useState(false);
  const [commonScheduleArchive, setCommonScheduleArchive] = useState([]);
  const [selectedCommonScheduleForComments, setSelectedCommonScheduleForComments] = useState(null);
  const [commonScheduleCommentInput, setCommonScheduleCommentInput] = useState("");
  const [commonScheduleCommentSubmitting, setCommonScheduleCommentSubmitting] = useState(false);
  const [dailyPnLModalOpen, setDailyPnLModalOpen] = useState(false);
  const [sendingDailyPnL, setSendingDailyPnL] = useState(false);
  const [customPnLBriefing, setCustomPnLBriefing] = useState(null);

  useEffect(() => {
    cleanupExpiredCommonSchedules();
    const unsubSched = subscribeCommonSchedules((scheds) => {
      setCommonSchedules(scheds);
    });
    const unsubArch = subscribeCommonScheduleArchive((archs) => {
      setCommonScheduleArchive(archs);
    });

    // 30초 주기로 시간 경과 일정 실시간 자동 삭제 및 대장 이관
    const timer = setInterval(() => {
      cleanupExpiredCommonSchedules();
    }, 30000);

    return () => {
      unsubSched();
      unsubArch();
      clearInterval(timer);
    };
  }, []);

  const allActiveCommonSchedules = useMemo(() => {
    if (!commonSchedules || !Array.isArray(commonSchedules)) return [];
    return commonSchedules
      .filter((s) => !s.isCompleted && (s.endDate || s.startDate || s.date) >= todayDateStr)
      .sort((a, b) => {
        const aStart = a.startDate || a.date || "";
        const bStart = b.startDate || b.date || "";
        if (aStart !== bStart) return aStart.localeCompare(bStart);
        const aEnd = a.endDate || aStart;
        const bEnd = b.endDate || bStart;
        if (aEnd !== bEnd) return aEnd.localeCompare(bEnd);
        return (a.time || "").localeCompare(b.time || "");
      });
  }, [commonSchedules, todayDateStr]);

  const uncompletedCommonSchedules = useMemo(() => {
    if (!commonSchedules || !Array.isArray(commonSchedules)) return [];
    return commonSchedules.filter((s) => !s.isCompleted).sort((a, b) => {
      const aStart = a.startDate || a.date || "";
      const bStart = b.startDate || b.date || "";
      if (aStart !== bStart) return aStart.localeCompare(bStart);
      const aEnd = a.endDate || aStart;
      const bEnd = b.endDate || bStart;
      if (aEnd !== bEnd) return aEnd.localeCompare(bEnd);
      return (a.time || "").localeCompare(b.time || "");
    });
  }, [commonSchedules]);

  const todayCommonSchedules = useMemo(() => {
    if (!commonSchedules || !Array.isArray(commonSchedules)) return [];
    return commonSchedules.filter((s) => {
      if (s.isCompleted) return false;
      const regDate = s.createdAt ? s.createdAt.slice(0, 10) : (s.startDate || s.date);
      const startDate = s.startDate || s.date;
      const endDate = s.endDate || startDate;
      const effectiveStart = regDate <= startDate ? regDate : startDate;
      return Boolean(effectiveStart && endDate && effectiveStart <= todayDateStr && todayDateStr <= endDate);
    });
  }, [commonSchedules, todayDateStr]);

  const scheduleCounts = useMemo(() => {
    const active = (commonSchedules || []).filter((s) => !isScheduleExpired(s) && !s.isCompleted).length;
    const archive = (commonScheduleArchive || []).length;
    return { all: active + archive, active, archive };
  }, [commonSchedules, commonScheduleArchive]);

  const modalFilteredSchedules = useMemo(() => {
    if (commonScheduleFilterTab === "archive") {
      return [...(commonScheduleArchive || [])].sort((a, b) => new Date(b.archivedAt || 0) - new Date(a.archivedAt || 0));
    }
    // Default: active non-expired schedules
    return (commonSchedules || [])
      .filter((s) => !isScheduleExpired(s) && !s.isCompleted)
      .sort((a, b) => {
        const aDate = a.startDate || a.date || "";
        const bDate = b.startDate || b.date || "";
        if (aDate !== bDate) return aDate.localeCompare(bDate);
        return (a.time || "").localeCompare(b.time || "");
      });
  }, [commonSchedules, commonScheduleArchive, commonScheduleFilterTab]);

  const handleToggleCompleteCommonSchedule = async (id, currentCompleted) => {
    const nextCompleted = !currentCompleted;
    await toggleCompleteCommonSchedule(id, nextCompleted);
    setToastMessage(nextCompleted ? "일정이 완료 처리되었습니다." : "일정이 진행중으로 복원되었습니다.");
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 2500);
  };

  const handleRegisterCommonSchedule = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!commonScheduleForm.title?.trim()) {
      alert("일정 내용을 입력해 주세요.");
      return;
    }
    setCommonScheduleSaving(true);
    try {
      const todayStr = getKSTDateString();
      const schedDate = commonScheduleForm.date || todayStr;
      const newSchedule = {
        ...commonScheduleForm,
        date: schedDate,
        startDate: schedDate,
        endDate: schedDate,
        createdAt: new Date().toISOString(),
        author: currentProfile?.name || "ADMIN"
      };
      const updated = await saveCommonSchedule(newSchedule);
      if (updated && Array.isArray(updated)) {
        setCommonSchedules(updated);
      }

      // 🚀 경영방으로 신규 일정 등록 알림 즉시 발송
      try {
        await sendCommonScheduleRegisteredTelegram(newSchedule);
      } catch (telErr) {
        console.warn("Telegram notification send error:", telErr);
      }

      setToastMessage("일정이 성공적으로 등록되었습니다!");
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 2500);

      setCommonScheduleForm({
        date: todayStr,
        time: "09:30",
        target: "세미나",
        title: ""
      });

      // 닫기 후 의견 팝업 열기
      setCommonScheduleModalOpen(false);
      setSelectedCommonScheduleForComments(newSchedule);
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

  useEffect(() => {
    if (selectedCommonScheduleForComments && Array.isArray(commonSchedules)) {
      const latest = commonSchedules.find((s) => s.id === selectedCommonScheduleForComments.id);
      if (latest) {
        setSelectedCommonScheduleForComments(latest);
      }
    }
  }, [commonSchedules]);

  const handleAddCommonScheduleComment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedCommonScheduleForComments || !commonScheduleCommentInput.trim()) return;

    setCommonScheduleCommentSubmitting(true);
    try {
      const commentData = {
        author: currentProfile?.name || "관리자",
        role: currentProfile?.role || currentProfile?.title || "선임",
        plant: currentProfile?.plant || "",
        text: commonScheduleCommentInput.trim()
      };
      const res = await addCommonScheduleComment(selectedCommonScheduleForComments.id, commentData);
      if (res.updatedList) {
        setCommonSchedules(res.updatedList);
      }
      if (res.updatedItem) {
        setSelectedCommonScheduleForComments(res.updatedItem);
        // 즉시 텔레그램 발송 (경영방으로 새 의견 알림)
        try {
          await sendCommonScheduleCommentTelegram(res.updatedItem, res.newComment);
        } catch (tgErr) {
          console.warn("Telegram comment alert error:", tgErr);
        }
      }
      setCommonScheduleCommentInput("");
      setToastMessage("의견이 등록되었으며 경영방으로 전송되었습니다.");
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 2000);
    } catch (err) {
      console.error("Failed to add comment:", err);
      alert("의견 등록 중 오류가 발생했습니다: " + err.message);
    } finally {
      setCommonScheduleCommentSubmitting(false);
    }
  };

  const handleDeleteCommonScheduleComment = async (commentId) => {
    if (!selectedCommonScheduleForComments) return;
    if (!window.confirm("이 의견을 삭제하시겠습니까?")) return;
    try {
      const res = await deleteCommonScheduleComment(selectedCommonScheduleForComments.id, commentId);
      if (res.updatedList) {
        setCommonSchedules(res.updatedList);
      }
      if (res.updatedItem) {
        setSelectedCommonScheduleForComments(res.updatedItem);
      }
      setToastMessage("의견이 삭제되었습니다.");
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 2000);
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
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
      const uncompletedSchedsText = formatCommonSchedulesForTelegram(uncompletedCommonSchedules, todayDateStr);

      const channelName = selectedPnLChannel === "-1003939516875" ? "경영방 (대표·전무)" : selectedPnLChannel === "290615483" ? "대표님 1:1" : "오륙 통합방";

      const res = await sendDailyPnLMorningBriefingTelegram({
        salesAmount: customPnLBriefing?.salesAmount ?? totalSales,
        purchaseAmount: customPnLBriefing?.purchaseAmount ?? totalPurchases,
        salesAchievementRate: customPnLBriefing?.salesAchievementRate || `${salesAchievementPct}% (${Number(salesAchievementPct) >= 100 ? `▲ +${(Number(salesAchievementPct) - 100).toFixed(1)}%` : `▼ ${(Number(salesAchievementPct) - 100).toFixed(1)}%`})`,
        purchaseAchievementRate: customPnLBriefing?.purchaseAchievementRate || `${purchaseAchievementPct}% (${Number(purchaseAchievementPct) <= 100 ? `▼ ${(100 - Number(purchaseAchievementPct)).toFixed(1)}% 절감` : `▲ +${(Number(purchaseAchievementPct) - 100).toFixed(1)}% 증가`})`,
        commonSchedules: customPnLBriefing?.commonSchedules || uncompletedSchedsText,
        targetChatId: selectedPnLChannel
      }, selectedPnLChannel);

      if (res.success) {
        setToastMessage(`[${channelName}]으로 매출 & 일정공유 브리핑이 발송되었습니다.`);
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
        images: formData.images || [],
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

      setFormData((prev) => ({
        ...prev,
        workContent: "",
        issues: "",
        images: []
      }));

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

    // 🌟 [설비보전 전용: 전재율 책임]
    if (isJaeyul) {
      const filledItems = maintenanceItems.filter((it) => it.content && it.content.trim());
      if (filledItems.length === 0) {
        alert("최소 1개 이상의 설비보전내용을 입력해 주세요.");
        return;
      }

      const formattedContent = filledItems
        .map((it, idx) => {
          const eqName = (it.equipmentName === "내용직접입력" || it.equipmentName === "직접입력" || it.equipmentName === "내용입력 (직접입력)")
            ? (it.customEquipmentName?.trim() || "직접입력")
            : it.equipmentName;
          return `[${idx + 1}] ${it.category} > ${eqName}\n• 설비보전내용: ${it.content.trim()}`;
        })
        .join("\n\n");

      const lineSummary = filledItems
        .map((it) => {
          const eqName = (it.equipmentName === "내용직접입력" || it.equipmentName === "직접입력" || it.equipmentName === "내용입력 (직접입력)")
            ? (it.customEquipmentName?.trim() || "직접입력")
            : it.equipmentName;
          return `${it.category}(${eqName})`;
        })
        .join(", ");

      const newLog = {
        id: String(Date.now()),
        date: formData.date,
        plant: formData.plant,
        writer: currentProfile?.name || workerFullName,
        title: officialTitle,
        process: "설비보전",
        shift: formData.shift,
        line: lineSummary || "설비보전 점검",
        workContent: formattedContent,
        maintenanceItems: filledItems.map((it) => ({
          category: it.category,
          equipmentName: (it.equipmentName === "내용직접입력" || it.equipmentName === "직접입력" || it.equipmentName === "내용입력 (직접입력)")
            ? (it.customEquipmentName?.trim() || "직접입력")
            : it.equipmentName,
          content: it.content.trim()
        })),
        issues: "-",
        images: formData.images || [],
        status: "완료",
        createdAt: new Date().toLocaleString("ko-KR", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })
      };

      await saveWorkLog(newLog);

      setMaintenanceItems([
        {
          id: 1,
          category: "압출기",
          equipmentName: "PCM 1호",
          customEquipmentName: "",
          content: ""
        }
      ]);

      setFormData((prev) => ({
        ...prev,
        workContent: "",
        issues: "",
        images: []
      }));

      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
      setIsModalOpen(false);
      return;
    }

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
      images: formData.images || [],
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
      issues: "",
      images: []
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
      {/* 📌 사내 공통일정 (1줄 간결 바 • 결재 패널 상단 • ADMIN 전용 노출 • 클릭 시 실시간 의견/코멘트 팝업) */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-xl px-3 sm:px-3.5 py-2 border border-indigo-500/40 dark:border-indigo-600/40 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 min-w-0 max-w-full">
          {/* Mobile Top Header / Desktop Left Section */}
          <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0 sm:flex-1 overflow-hidden">
            <div className="flex items-center gap-2 shrink-0">
              <div className="p-1 rounded-lg bg-indigo-600 text-white shadow-xs shrink-0">
                <CalendarDays className="w-3.5 h-3.5" />
              </div>
              <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white shrink-0">
                공통일정
              </span>
            </div>

            {/* Desktop Only: Inline Chips */}
            <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1 pl-2 border-l border-slate-200 dark:border-slate-800">
              {allActiveCommonSchedules.length > 0 ? (
                allActiveCommonSchedules.map((item) => {
                  const commentCount = item.comments?.length || 0;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedCommonScheduleForComments(item)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-300 dark:border-indigo-700/80 text-xs shadow-2xs shrink-0 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all group"
                      title="탭하여 일정 상세 보기 및 실시간 의견 작성하기"
                    >
                      {(() => {
                        const start = item.startDate || item.date;
                        const end = item.endDate || item.startDate || item.date;
                        const hasRange = start && end && start !== end;
                        if (hasRange) {
                          return (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300">
                              {start.slice(5)}~{end.slice(5)}
                            </span>
                          );
                        }
                        if (start) {
                          return (
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              start === todayDateStr
                                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                            }`}>
                              {start === todayDateStr ? "오늘" : start.slice(5)}
                            </span>
                          );
                        }
                        return null;
                      })()}
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
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate max-w-[130px] sm:max-w-[220px] group-hover:underline">
                        {item.title}
                      </span>

                      {/* Opinion / Comment Badge */}
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold flex items-center gap-0.5 border shadow-2xs ${
                        commentCount > 0
                          ? "bg-purple-600 text-white border-purple-500 animate-pulse"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                      }`}>
                        <MessageCircle className="w-2.5 h-2.5" />
                        <span>{commentCount > 0 ? `의견 ${commentCount}` : "의견"}</span>
                      </span>

                      {(isAdmin || isGeneralManager) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCommonSchedule(item.id);
                          }}
                          className="ml-0.5 p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                          title="일정 삭제"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-slate-500" />
                  <span>등록된 공통일정 없음</span>
                </span>
              )}
            </div>

            {/* Mobile Top Right: '+ 일정 등록' button */}
            <div className="flex sm:hidden items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setCommonScheduleModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
                title="공통 일정 등록 및 관리"
              >
                <Plus className="w-3 h-3" />
                <span>+ 일정 등록</span>
              </button>
            </div>
          </div>

          {/* Mobile Only Bottom Row: Full-width horizontal scrolling chips */}
          <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full min-w-0">
            {allActiveCommonSchedules.length > 0 ? (
              allActiveCommonSchedules.map((item) => {
                const commentCount = item.comments?.length || 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCommonScheduleForComments(item)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 border border-indigo-300 dark:border-indigo-700/80 text-[11px] shadow-2xs shrink-0 cursor-pointer active:scale-95 transition-all group"
                    title="탭하여 일정 상세 보기 및 실시간 의견 작성하기"
                  >
                    {(() => {
                      const start = item.startDate || item.date;
                      const end = item.endDate || item.startDate || item.date;
                      const hasRange = start && end && start !== end;
                      if (hasRange) {
                        return (
                          <span className="px-1 py-0.2 rounded text-[9.5px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300">
                            {start.slice(5)}~{end.slice(5)}
                          </span>
                        );
                      }
                      if (start) {
                        return (
                          <span className={`px-1 py-0.2 rounded text-[9.5px] font-bold ${
                            start === todayDateStr
                              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          }`}>
                            {start === todayDateStr ? "오늘" : start.slice(5)}
                          </span>
                        );
                      }
                      return null;
                    })()}
                    <span className={`px-1 py-0.2 rounded text-[9.5px] font-black ${
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
                      <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        [{item.time}]
                      </span>
                    )}
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] truncate max-w-[120px]">
                      {item.title}
                    </span>

                    {/* Opinion / Comment Badge */}
                    <span className={`px-1 py-0.2 rounded-full text-[9px] font-extrabold flex items-center gap-0.5 border shadow-2xs ${
                      commentCount > 0
                        ? "bg-purple-600 text-white border-purple-500 animate-pulse"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                    }`}>
                      <MessageCircle className="w-2.5 h-2.5" />
                      <span>{commentCount > 0 ? `${commentCount}` : "0"}</span>
                    </span>

                    {(isAdmin || isGeneralManager) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCommonSchedule(item.id);
                        }}
                        className="p-0.5 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="일정 삭제"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 text-slate-500" />
                <span>등록된 공통일정 없음</span>
              </span>
            )}
          </div>

          {/* Desktop Right Side: '+ 일정 등록' button */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setCommonScheduleModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
              title="공통 일정 등록 및 관리"
            >
              <Plus className="w-3 h-3" />
              <span>+ 일정 등록</span>
            </button>
          </div>
        </div>
      )}

      {/* 📑 전자결재 대기 현황 (1줄 완벽 바) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 border border-emerald-500/40 dark:border-emerald-600/40 shadow-2xs flex items-center justify-between gap-2 min-w-0 max-w-full">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
          <div className="p-1 rounded-lg bg-emerald-600 text-white shadow-xs shrink-0">
            <FileSignature className="w-3.5 h-3.5" />
          </div>
          <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white shrink-0">
            전자결재 대기
          </span>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {pendingCount > 0 && (
              <span className="px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-black bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 animate-pulse flex items-center gap-0.5 sm:gap-1">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>미결 {pendingCount}건</span>
              </span>
            )}
            {holdCount > 0 && (
              <span className="px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-black bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 flex items-center gap-0.5 sm:gap-1">
                <PauseCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>보류 {holdCount}건</span>
              </span>
            )}
            {pendingOrHoldDocs.length === 0 && (
              <span className="px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 flex items-center gap-0.5 sm:gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                <span>대기 없음</span>
              </span>
            )}
          </div>

          {pendingOrHoldDocs.length > 0 && (
            <div className="hidden lg:flex items-center gap-2 min-w-0 flex-1 pl-2 border-l border-slate-200 dark:border-slate-800">
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

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab("electronic_approval")}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-[11px] sm:text-xs font-black transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
          >
            <span>결재함</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 🌟 작업자 일정/연차 및 스마트 캘린더 센터 (전작업자 공통 적용) */}
      {!isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border-2 border-blue-500/40 dark:border-blue-500/30 shadow-sm space-y-2.5 min-w-0 max-w-full relative z-20">
          {/* Top Bar: Worker Profile & Quick Schedule Register Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center">
            {/* Left: Worker Name and Title (Executive Luxury VIP Tab Design) */}
            <div className="lg:col-span-3 min-w-0">
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl px-3 py-2 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-2 border-indigo-500/40 dark:border-indigo-400/40 shadow-md shadow-indigo-950/40 ring-1 ring-white/10 group transition-all">
                {/* Ambient Soft Glow Highlights */}
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-transparent rounded-full blur-xl pointer-events-none" />
                <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-tr from-cyan-500/15 to-transparent rounded-full blur-lg pointer-events-none" />

                <div className="relative flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0 truncate">
                    {/* Dynamic Glowing Avatar with Online Status Indicator */}
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 p-[1.5px] shadow-sm shadow-cyan-500/30">
                        <div className="w-full h-full rounded-[10px] bg-slate-900/90 backdrop-blur-xs flex items-center justify-center text-cyan-300">
                          <User className="w-4 h-4 text-cyan-300 drop-shadow-xs" />
                        </div>
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full shadow-xs ring-1 ring-emerald-400/50">
                        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                      </span>
                    </div>

                    {/* Worker Name with Sub-tag */}
                    <div className="flex flex-col min-w-0 truncate leading-tight">
                      <span className="text-[9px] font-extrabold text-cyan-400/90 tracking-wider flex items-center gap-1 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
                        LOGIN USER
                      </span>
                      <span className="text-sm sm:text-base font-black text-white tracking-tight drop-shadow-xs truncate">
                        {workerFullName}
                      </span>
                    </div>
                  </div>

                  {/* Sleek Jewel Title Badge */}
                  <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-400/40 text-xs font-black tracking-wide shadow-sm shadow-indigo-500/30 shrink-0">
                    {officialTitle}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Schedule Register Form (9 cols) */}
            <div className="lg:col-span-9 min-w-0">
              <form onSubmit={handleRegisterSchedule} className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-center">
                {/* 1. Leave Type Selector (2 cols) */}
                <div className="sm:col-span-2 min-w-0">
                  <select
                    value={scheduleLeaveType}
                    onChange={(e) => setScheduleLeaveType(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                  >
                    <option value="연차(하루)">🌴 연차(하루)</option>
                    <option value="오전반차">🌤️ 오전반차</option>
                    <option value="오후반차">⛅ 오후반차</option>
                    <option value="할일">📝 할일</option>
                    <option value="삼랑진공장">🏭 삼랑진공장</option>
                    <option value="한림공장">🏭 한림공장</option>
                    <option value="RNA 회의">👔 RNA 회의</option>
                    <option value="외출">🚶 외출</option>
                    <option value="특근(휴일근무)">⚡ 특근(휴일)</option>
                    <option value="출장/외부교육">🚄 출장/교육</option>
                  </select>
                </div>

                {/* 2. Date Picker (2 cols) */}
                <div className="sm:col-span-2 min-w-0">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-blue-400 bg-white dark:bg-slate-800 shadow-2xs">
                    <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                    <input
                      type="date"
                      required
                      value={scheduleSelectedDate}
                      onChange={(e) => setScheduleSelectedDate(e.target.value)}
                      className="w-full bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer py-0.5"
                    />
                  </div>
                </div>

                {/* 3. Reason/Memo Input (3 cols) */}
                <div className="sm:col-span-3 min-w-0">
                  <input
                    type="text"
                    value={scheduleReasonInput}
                    onChange={(e) => setScheduleReasonInput(e.target.value)}
                    placeholder="내용"
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-2xs placeholder:text-slate-400 placeholder:text-xs"
                  />
                </div>

                {/* 4. 전작업자 선택창 (단수/복수 선택) (3 cols) */}
                <div className="sm:col-span-3 relative min-w-0" ref={shareDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsShareDropdownOpen((prev) => !prev)}
                    className={`w-full px-2 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-between gap-1 shadow-2xs cursor-pointer ${
                      sharedWorkers.length > 0
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 font-black ring-1 ring-blue-400"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400"
                    }`}
                    title="원하는 공유 작업자: 선택 시 해당 작업자의 일정에도 함께 등록됩니다"
                  >
                    <div className="flex items-center gap-1 truncate min-w-0">
                      <Users className={`w-3.5 h-3.5 shrink-0 ${sharedWorkers.length > 0 ? "text-blue-600" : "text-slate-400"}`} />
                      <span className="truncate text-[11px]">
                        {sharedWorkers.length === 0
                          ? "원하는 공유 작업자"
                          : sharedWorkers.length === 1
                          ? sharedWorkers[0].name
                          : `${sharedWorkers[0].name} 외 ${sharedWorkers.length - 1}명`}
                      </span>
                    </div>
                    {sharedWorkers.length > 0 ? (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSharedWorkers([]);
                        }}
                        className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-900 rounded text-slate-400 hover:text-slate-700"
                        title="선택 초기화"
                      >
                        <X className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">▼</span>
                    )}
                  </button>

                  {/* 전작업자 드롭다운 팝업 */}
                  {isShareDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-slate-300 dark:border-slate-700 p-2.5 z-50 animate-fadeIn space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          <span>원하는 공유 작업자 선택</span>
                        </span>
                        {sharedWorkers.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSharedWorkers([])}
                            className="text-[10.5px] font-bold text-rose-500 hover:underline cursor-pointer"
                          >
                            전체해제
                          </button>
                        )}
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-2 pr-1 no-scrollbar text-xs">
                        {/* 한림공장 작업자 */}
                        <div>
                          {(() => {
                            const plantWorkers =
                              PLANTS[1]?.workers?.filter(
                                (w) => w.id !== currentProfile?.id && w.name !== workerFullName
                              ) || [];
                            const isAllPlantSelected =
                              plantWorkers.length > 0 &&
                              plantWorkers.every((w) => sharedWorkers.some((sw) => sw.id === w.id));

                            return (
                              <div
                                onClick={() => togglePlantSharedWorkers(1)}
                                className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center justify-between p-1.5 px-2 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/80 cursor-pointer transition-all select-none group active:scale-[0.99]"
                                title="한림공장 작업자 전체 선택 / 해제"
                              >
                                <div className="flex items-center gap-1.5">
                                  <Factory className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-emerald-600" />
                                  <span className="group-hover:underline">한림공장</span>
                                  <span className="text-[9.5px] font-normal text-slate-500 dark:text-slate-400">
                                    ({plantWorkers.length}명)
                                  </span>
                                </div>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-black transition-all ${
                                    isAllPlantSelected
                                      ? "bg-emerald-600 text-white shadow-2xs"
                                      : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                                  }`}
                                >
                                  {isAllPlantSelected ? "✓ 전체해제" : "+ 전체선택"}
                                </span>
                              </div>
                            );
                          })()}
                          <div className="grid grid-cols-2 gap-1">
                            {PLANTS[1]?.workers
                              ?.filter((w) => w.id !== currentProfile?.id && w.name !== workerFullName)
                              .map((w) => {
                                const isSelected = sharedWorkers.some((sw) => sw.id === w.id);
                                return (
                                  <button
                                    key={w.id}
                                    type="button"
                                    onClick={() => toggleSharedWorker(w)}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer active:scale-95 ${
                                      isSelected
                                        ? "bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-black shadow-2xs ring-1 ring-emerald-400/50"
                                        : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300"
                                    }`}
                                  >
                                    <span>{w.name}</span>
                                    <span className="text-[9.5px] opacity-70">
                                      {isSelected ? "✓" : w.title || "선임"}
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>

                        {/* 삼랑진공장 작업자 */}
                        <div>
                          {(() => {
                            const plantWorkers =
                              PLANTS[0]?.workers?.filter(
                                (w) => w.id !== currentProfile?.id && w.name !== workerFullName
                              ) || [];
                            const isAllPlantSelected =
                              plantWorkers.length > 0 &&
                              plantWorkers.every((w) => sharedWorkers.some((sw) => sw.id === w.id));

                            return (
                              <div
                                onClick={() => togglePlantSharedWorkers(0)}
                                className="text-[11px] font-black text-amber-700 dark:text-amber-400 mb-1.5 flex items-center justify-between p-1.5 px-2 rounded-lg bg-amber-50/70 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 border border-amber-200/80 dark:border-amber-800/80 cursor-pointer transition-all select-none group active:scale-[0.99]"
                                title="삼랑진공장 작업자 전체 선택 / 해제"
                              >
                                <div className="flex items-center gap-1.5">
                                  <Factory className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-amber-600" />
                                  <span className="group-hover:underline">삼랑진공장</span>
                                  <span className="text-[9.5px] font-normal text-slate-500 dark:text-slate-400">
                                    ({plantWorkers.length}명)
                                  </span>
                                </div>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-black transition-all ${
                                    isAllPlantSelected
                                      ? "bg-amber-600 text-white shadow-2xs"
                                      : "bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                                  }`}
                                >
                                  {isAllPlantSelected ? "✓ 전체해제" : "+ 전체선택"}
                                </span>
                              </div>
                            );
                          })()}
                          <div className="grid grid-cols-2 gap-1">
                            {PLANTS[0]?.workers
                              ?.filter((w) => w.id !== currentProfile?.id && w.name !== workerFullName)
                              .map((w) => {
                                const isSelected = sharedWorkers.some((sw) => sw.id === w.id);
                                return (
                                  <button
                                    key={w.id}
                                    type="button"
                                    onClick={() => toggleSharedWorker(w)}
                                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer active:scale-95 ${
                                      isSelected
                                        ? "bg-amber-100 dark:bg-amber-950/80 border-amber-500 text-amber-900 dark:text-amber-100 font-black shadow-2xs ring-1 ring-amber-400/50"
                                        : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300"
                                    }`}
                                  >
                                    <span>{w.name}</span>
                                    <span className="text-[9.5px] opacity-70">
                                      {isSelected ? "✓" : w.title || "선임"}
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-[10.5px] font-bold text-slate-500">
                          {sharedWorkers.length > 0 ? `${sharedWorkers.length}명 선택됨` : "작업자 선택 안함"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsShareDropdownOpen(false)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] cursor-pointer"
                        >
                          선택 완료
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Submit Button (2 cols) */}
                <div className="sm:col-span-2 min-w-0">
                  <button
                    type="submit"
                    disabled={scheduleSaving}
                    className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-2xs shadow-blue-500/25 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{scheduleSaving ? "등록중..." : "+ 등록"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Bottom Bar: Registered schedules strip & Weekly mini-calendar toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
            {/* Active Registered Schedules List */}
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 shrink-0">
                나의 등록 일정:
              </span>
              {myActiveLeaves.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic">등록된 활성 일정이 없습니다.</span>
              ) : (
                myActiveLeaves.map((l) => {
                  const isToday = (l.startDate || "") === todayDateStr;
                  const isShared = Boolean(l.sharedBy);
                  return (
                    <span
                      key={l.id}
                      onClick={() =>
                        setScheduleDetailModal({
                          selectedDate: l.startDate || todayDateStr,
                          dayName: "",
                          filterTab: "day"
                        })
                      }
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer hover:shadow-xs active:scale-95 ${
                        isToday
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs ring-2 ring-blue-400/40 animate-pulse"
                          : "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800 hover:border-blue-400"
                      }`}
                      title={`[클릭 시 상세/전체목록 확인] 등록일: ${l.createdAt?.slice(0, 10) || l.createdDate || "미상"} ~ 만료일: ${l.endDate || l.startDate}`}
                    >
                      <span className="font-extrabold">{l.startDate?.slice(5)}</span>
                      <span className="opacity-90">{l.leaveType}</span>
                      {l.reason && l.reason !== l.leaveType && (
                        <span className="max-w-[120px] truncate text-[10.5px] opacity-85">({l.reason})</span>
                      )}
                      {isShared && (
                        <span className="text-[9.5px] px-1 py-0.2 rounded bg-amber-500 text-white font-black shrink-0">공유</span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismissMyLeave(l.id);
                        }}
                        className={`p-0.5 rounded transition-all cursor-pointer ${
                          isToday ? "hover:bg-blue-700 text-white/80 hover:text-white" : "hover:bg-blue-200 dark:hover:bg-blue-900 text-slate-400 hover:text-slate-700"
                        }`}
                        title="완료 / 목록에서 삭제"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  );
                })
              )}
            </div>

            {/* Toggle Weekly Calendar View Button & All List Quick Button */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() =>
                  setScheduleDetailModal({
                    selectedDate: scheduleSelectedDate || todayDateStr,
                    dayName: "",
                    filterTab: "all"
                  })
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-black transition-all cursor-pointer border border-indigo-200 dark:border-indigo-800 shadow-2xs"
                title="전체 등록 일정 목록 팝업 열기"
              >
                <FileText className="w-3 h-3 text-indigo-600" />
                <span>전체 리스트</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMiniCalendar((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Calendar className="w-3 h-3 text-blue-600" />
                <span>{showMiniCalendar ? "달력 접기" : "주차별 달력보기"}</span>
                <span className="text-[10px] text-slate-400">{showMiniCalendar ? "▲" : "▼"}</span>
              </button>
            </div>
          </div>

          {/* Collapsible Weekly Calendar Grid */}
          {showMiniCalendar && (
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between px-1 flex-wrap gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{scheduleWeekAnchor.slice(0, 7)} 주간 일정 현황</span>
                  </span>
                  <span className="text-[10.5px] text-slate-400 font-bold hidden sm:inline">
                    (날짜나 일정을 탭하면 전체 리스트가 팝업됩니다)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevWeek}
                    className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black"
                  >
                    ◀ 이전주
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToToday}
                    className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 text-[11px] font-black border border-blue-200 dark:border-blue-900"
                  >
                    오늘
                  </button>
                  <button
                    type="button"
                    onClick={handleNextWeek}
                    className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black"
                  >
                    다음주 ▶
                  </button>
                </div>
              </div>

              {/* 7 Days Row */}
              <div className="grid grid-cols-7 gap-1">
                {myWeeklyCalendarDays.map((day) => {
                  const isSun = day.dayOfWeek === 0;
                  const isSat = day.dayOfWeek === 6;
                  return (
                    <div
                      key={day.dateStr}
                      onClick={() => {
                        setScheduleSelectedDate(day.dateStr);
                        setScheduleDetailModal({
                          selectedDate: day.dateStr,
                          dayName: day.dayName,
                          filterTab: day.events.length > 0 ? "day" : "all"
                        });
                      }}
                      className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer min-h-[68px] flex flex-col justify-between hover:shadow-xs group ${
                        day.isSelected
                          ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/70 dark:bg-blue-950/50"
                          : day.isToday
                          ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
                          : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700"
                      }`}
                      title={`[탭 시 전체리스트 팝업] ${day.dateStr} (${day.dayName}) 등록 일정: ${day.events.length}건`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`font-black ${isSun ? "text-rose-600" : isSat ? "text-blue-600" : "text-slate-700 dark:text-slate-300"}`}>
                          {day.dayName}
                        </span>
                        <span className={`text-[10px] font-bold ${day.isToday ? "px-1 rounded bg-amber-500 text-white font-black" : "text-slate-500"}`}>
                          {day.month}/{day.dayNumber}
                        </span>
                      </div>

                      <div className="space-y-0.5 mt-1 overflow-hidden">
                        {day.events.length === 0 ? (
                          <span className="text-[10px] text-slate-300 dark:text-slate-600 block">-</span>
                        ) : (
                          day.events.slice(0, 2).map((ev) => {
                            const isTodo = ev.leaveType === "할일" || ev.leaveType?.includes("할일");
                            const displayText = isTodo
                              ? (ev.reason && ev.reason !== "할일" ? `📝 ${ev.reason}` : "📝 할일")
                              : (ev.reason && ev.reason !== ev.leaveType ? `${ev.leaveType} (${ev.reason})` : ev.leaveType);

                            return (
                              <div
                                key={ev.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setScheduleSelectedDate(day.dateStr);
                                  setScheduleDetailModal({
                                    selectedDate: day.dateStr,
                                    dayName: day.dayName,
                                    filterTab: "day"
                                  });
                                }}
                                className={`text-[9.5px] px-1 py-0.5 rounded font-bold truncate text-left transition-all ${
                                  isTodo
                                    ? "bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700 shadow-2xs"
                                    : "bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-900 dark:text-blue-200"
                                }`}
                                title={`${ev.leaveType}: ${ev.reason || ""} (탭하여 전체 리스트 보기)`}
                              >
                                {displayText}
                              </div>
                            );
                          })
                        )}
                        {day.events.length > 2 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setScheduleSelectedDate(day.dateStr);
                              setScheduleDetailModal({
                                selectedDate: day.dateStr,
                                dayName: day.dayName,
                                filterTab: "day"
                              });
                            }}
                            className="text-[9px] text-blue-600 dark:text-blue-400 font-bold block hover:underline"
                          >
                            +{day.events.length - 2}건 상세▶
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ⭐ [1위치] 매입매출현황 요약 (주석 삭제 • 깔끔한 핵심 수치만 표시) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5 min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 truncate">
            <h2 className="text-xs sm:text-base font-black text-slate-900 dark:text-white truncate">
              1. {monthTitle} 매입매출현황 요약
            </h2>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("vehicle_sales")}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black border border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/50 shadow-xs shadow-emerald-500/20 animate-pulse transition-all active:scale-95 cursor-pointer shrink-0 ml-auto whitespace-nowrap"
            >
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
              </span>
              <span>매출 상세</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5 min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
            <h2 className="text-xs sm:text-base font-black text-slate-900 dark:text-white truncate">
              2. 압출동 주간 비가동내역 요약
            </h2>
            <span className="px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
              9월 당월 누적
            </span>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("extrusion_downtime")}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black border border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/50 shadow-xs shadow-emerald-500/20 animate-pulse transition-all active:scale-95 cursor-pointer shrink-0 ml-auto whitespace-nowrap"
            >
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
              </span>
              <span>비가동 상세</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
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
      {/* 3. ⭐ 4대 코어 품목별 품질현황 (기존 아이템 패널) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5 min-w-0 max-w-full overflow-hidden">
        {/* Header with Quality Detail Link */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
            <h2 className="text-xs sm:text-base font-black text-slate-900 dark:text-white truncate">
              3. 중요ITEM 품질현황
            </h2>
            <span className="px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
              {selectedMonth?.slice(5, 7) || "9"}월 실적
            </span>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("daily_quality")}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black border border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/50 shadow-xs shadow-emerald-500/20 animate-pulse transition-all active:scale-95 cursor-pointer shrink-0 ml-auto whitespace-nowrap"
            >
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
              </span>
              <span>품질 상세</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}
        </div>

        {/* 4 Core Item Quick Chips (Click to Open Detail Popup) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(() => {
            const items = liveQualityCurrentMonthly?.items || liveQualityPrevMonthly.items;
            return items.map((it) => {
              const isGood = it.defectRate <= 0.70;

              return (
                <div
                  key={it.id}
                  onClick={() => setQualityPopupItem(it)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setQualityPopupItem(it)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                    isGood
                      ? "border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-400"
                      : "border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-400"
                  } hover:scale-[1.02] active:scale-98 shadow-xs space-y-1.5`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {it.name}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                        isGood
                          ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                          : "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 animate-pulse"
                      }`}
                    >
                      {isGood ? "목표달성" : "관리주의"}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <span
                      className={`text-lg sm:text-xl font-black font-mono leading-none ${
                        isGood ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {it.defectRate}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {it.inspectQty.toLocaleString()}EA / {it.defectQty}불량
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[9.5px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="truncate">손실: ₩{it.lossAmount.toLocaleString()}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                      <span>팝업</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ⭐ [4위치] 근태현황 및 관리 (잔업 스마트 통합관리대장 연동) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
            <h2 className="text-xs sm:text-base font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
              <span>4. 근태현황 및 관리</span>
              <span className="hidden sm:inline-block text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300">
                5개사 잔업스마트대장
              </span>
            </h2>
            <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800 shrink-0">
              9월: 평일 880H • 주말 440H
            </span>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab("overtime_status")}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/80 dark:hover:bg-cyan-900 text-cyan-800 dark:text-cyan-200 text-xs font-black border border-cyan-400 dark:border-cyan-600 ring-2 ring-cyan-400/40 shadow-xs shadow-cyan-500/20 animate-pulse transition-all active:scale-95 cursor-pointer shrink-0 ml-auto whitespace-nowrap"
            >
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-cyan-500"></span>
              </span>
              <span>근태 상세</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-600 dark:text-cyan-400" />
            </button>
          )}
        </div>

        {/* 5 Company Today Overview Cards - Simple & Bold Number Design */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
          {companyOverviewStats.map((comp) => (
            <div
              key={comp.name}
              onClick={() => onNavigateTab && onNavigateTab("overtime_status")}
              className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200/90 dark:border-slate-800 ${comp.borderHover} transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group flex flex-col justify-between space-y-2`}
              title="클릭 시 5개사 근태/잔업 대장 상세관리로 이동"
            >
              {/* Header: Company Name + Attendance Status */}
              <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-200/70 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full ${comp.dot} shrink-0`}></span>
                  <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors truncate">
                    {comp.name}
                  </span>
                </div>
                <span className={`text-[10px] sm:text-[10.5px] font-mono font-black px-1.5 py-0.5 rounded-md border shrink-0 ${comp.badgeColor}`}>
                  {comp.attended}/{comp.workers}명
                </span>
              </div>

              {/* Bold Large Metric Numbers Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                {/* 당일 잔업 */}
                <div className="bg-white dark:bg-slate-900/90 p-1.5 sm:p-2 rounded-xl border border-slate-200/80 dark:border-slate-800/90 text-center">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">당일 잔업</div>
                  <div className="font-mono font-black text-base sm:text-lg text-amber-600 dark:text-amber-400 leading-tight mt-0.5">
                    +{comp.otHours}<span className="text-[10px] font-bold ml-0.5">H</span>
                  </div>
                </div>

                {/* 투입 공수 */}
                <div className="bg-white dark:bg-slate-900/90 p-1.5 sm:p-2 rounded-xl border border-slate-200/80 dark:border-slate-800/90 text-center">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">투입 공수</div>
                  <div className="font-mono font-black text-base sm:text-lg text-cyan-600 dark:text-cyan-300 leading-tight mt-0.5">
                    {comp.totalHours}<span className="text-[10px] font-bold ml-0.5">H</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 2 Factory Overtime Legacy Cards Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
          {/* 삼랑진공장 */}
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1 min-w-0">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60 flex-wrap gap-1">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[9.5px] font-black shrink-0">
                  삼랑진공장
                </span>
                <span className="text-[9.5px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 shrink-0">
                  {overtimeSummary.samrangjin.date}
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
                  {overtimeSummary.hallim.date}
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5 min-w-0 max-w-full overflow-hidden">
        {/* Manager Dedicated Information Banners (No batch approval - Requires reading details) */}
        {isMyeongjae && pendingSamrangjinCount > 0 && (
          <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-wrap items-center justify-between gap-2 animate-fadeIn min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                결재
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-xs text-amber-900 dark:text-amber-200">
                  [이명재 총괄이사] 삼랑진공장 결재 대기 업무일지가 <strong className="text-rose-600 dark:text-rose-400 underline font-black">{pendingSamrangjinCount}건</strong> 있습니다.
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
                  [김동욱 총괄책임] 한림공장 결재 대기 업무일지가 <strong className="text-rose-600 dark:text-rose-400 underline font-black">{pendingHallimCount}건</strong> 있습니다.
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

        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 truncate">
            <h2 className="text-xs sm:text-base font-black text-slate-900 dark:text-white truncate">
              5. 일일업무일지 현황
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <select
              value={filterPlant}
              onChange={(e) => setFilterPlant(e.target.value)}
              className="px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">전체 ({workLogs.length})</option>
              <option value="삼랑진공장">삼랑진 ({workLogs.filter((l) => l.plant === "삼랑진공장").length})</option>
              <option value="한림공장">한림 ({workLogs.filter((l) => l.plant === "한림공장").length})</option>
            </select>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab("electronic_approval")}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black border border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/50 shadow-xs shadow-emerald-500/20 animate-pulse transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
                </span>
                <span>업무일지 상세</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
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
                            {log.lineFileMatches.length}개 라인 매칭
                          </span>
                        )}
                        {Array.isArray(log.images) && log.images.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 shrink-0 flex items-center gap-0.5">
                            <Camera className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                            <span>사진 {log.images.length}장</span>
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
        <div
          onClick={() => setSelectedLogDetail(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
          >
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
                <span>
                  {selectedLogDetail.process === "설비보전" || selectedLogDetail.writer === "전재율"
                    ? "1. 설비보전 작업 및 점검 내용 전문"
                    : "1. 작업 내용 전문"}
                </span>
              </span>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs leading-relaxed font-medium whitespace-pre-wrap">
                {selectedLogDetail.workContent || "작업 내용이 없습니다."}
              </div>
            </div>

            {/* 2. 특이사항 및 전달사항 (설비보전 일지에는 비노출) */}
            {selectedLogDetail.process !== "설비보전" && selectedLogDetail.writer !== "전재율" && (
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
            )}

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

            {/* 📷 현장 작업 사진 증빙 (첨부된 경우) */}
            {Array.isArray(selectedLogDetail.images) && selectedLogDetail.images.length > 0 && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>현장 작업 사진 증빙 ({selectedLogDetail.images.length}장)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">클릭하여 확대</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {selectedLogDetail.images.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `현장사진_${idx + 1}` })}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-xs aspect-square hover:border-indigo-500 hover:ring-2 hover:ring-indigo-400/30 transition-all"
                    >
                      <img
                        src={img.dataUrl}
                        alt={img.name || `현장 사진 ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                        <span className="text-[9px] text-white font-bold truncate">
                          {img.name || `사진 ${idx + 1}`}
                        </span>
                      </div>
                      <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-black/60 text-white text-[8.5px] font-mono font-bold">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
        <div
          onClick={() => setSelectedWorkerForLogs(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
          >
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
        <div
          onClick={() => setLineMatchShareModal(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-7 border-2 border-emerald-500 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
          >
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
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer"
        >
          {isInjoo ? (
            /* ========================================================================= */
            /* ⭐ [조인주 선임 전용] 탭했을 때 뜨는: 1. 작성란 & 2. 드래그업로드 창 */
            /* ========================================================================= */
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
            >
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

                    {/* 📷 현장 작업 사진 첨부 (촬영 우선) */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>현장 작업 사진 첨부 (촬영 우선, 최대 5장)</span>
                        </label>
                        <span className="text-[9.5px] text-slate-400 font-mono">
                          {formData.images?.length || 0}/5장
                        </span>
                      </div>

                      {/* Dual Buttons: 1. 📸 촬영 우선 / 2. 📁 앨범·파일 선택 */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <input
                            type="file"
                            id="worklog-camera-injoo"
                            accept="image/*"
                            capture="environment"
                            disabled={isProcessingImages || (formData.images?.length || 0) >= 5}
                            onChange={(e) => {
                              if (e.target.files) {
                                handleWorkLogImageFiles(e.target.files);
                                e.target.value = "";
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="worklog-camera-injoo"
                            className={`w-full py-2 px-2 rounded-xl border-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 text-center ${
                              (formData.images?.length || 0) >= 5
                                ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                : "border-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-200 ring-1 ring-blue-500/30 font-black"
                            }`}
                          >
                            <Camera className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                            <span className="text-[11px] font-black truncate">
                              {isProcessingImages ? "압축 중..." : (formData.images?.length || 0) >= 5 ? "5장 완료" : "📸 사진 즉시 촬영"}
                            </span>
                          </label>
                        </div>

                        <div>
                          <input
                            type="file"
                            id="worklog-gallery-injoo"
                            accept="image/*"
                            multiple
                            disabled={isProcessingImages || (formData.images?.length || 0) >= 5}
                            onChange={(e) => {
                              if (e.target.files) {
                                handleWorkLogImageFiles(e.target.files);
                                e.target.value = "";
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="worklog-gallery-injoo"
                            className={`w-full py-2 px-2 rounded-xl border-2 border-dashed flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
                              (formData.images?.length || 0) >= 5
                                ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                            }`}
                          >
                            <UploadCloud className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="text-[11px] font-bold truncate">📁 앨범 / 파일</span>
                          </label>
                        </div>
                      </div>

                      {/* Attached Image Thumbnails */}
                      {formData.images && formData.images.length > 0 && (
                        <div className="grid grid-cols-5 gap-1.5 pt-1">
                          {formData.images.map((img, idx) => (
                            <div
                              key={img.id || idx}
                              className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-2xs"
                            >
                              <img
                                src={img.dataUrl}
                                alt={img.name || `사진 ${idx + 1}`}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `첨부사진 ${idx + 1}` })}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveWorkLogImage(idx)}
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-[9px] font-black transition-colors cursor-pointer"
                                title="삭제"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
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
                    <div className="space-y-2.5 flex-1 flex flex-col justify-between text-xs">
                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                        {/* File Meta Header */}
                        <div className="flex items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-800/60 pb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-black text-xs text-slate-900 dark:text-white block truncate" title={parsedResult.fileName}>
                                {parsedResult.fileName}
                              </span>
                              <span className="text-[10.5px] text-slate-400 font-medium">
                                용량: {parsedResult.fileSize} • 시트 {parsedResult.sheetCount || 1}개
                              </span>
                            </div>
                          </div>

                          {/* Month Selector */}
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] font-bold text-slate-500">반영월:</span>
                            <select
                              value={parsedResult.yearMonth || selectedMonth || "2026-08"}
                              onChange={(e) => setParsedResult((prev) => ({ ...prev, yearMonth: e.target.value }))}
                              className="px-2 py-1 rounded-lg border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-800 font-black text-xs text-emerald-900 dark:text-emerald-100 cursor-pointer shadow-2xs"
                            >
                              {(availableMonths || DEFAULT_MONTH_LIST || ["2026-09", "2026-08", "2026-07"]).map((m) => (
                                <option key={m} value={m}>
                                  {m.slice(0, 4)}년 {parseInt(m.slice(5), 10)}월
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Extracted Stats Grid */}
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-900/40">
                            <span className="text-[10px] font-bold text-slate-500 block">추출 총 매출액</span>
                            <span className="text-xs font-black text-blue-700 dark:text-blue-300">
                              {parsedResult.totalSales > 0 ? formatAmount(parsedResult.totalSales) : "기존 매출 유지"}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-900/40">
                            <span className="text-[10px] font-bold text-slate-500 block">추출 총 매입/비용</span>
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                              {parsedResult.totalExpenses > 0 ? formatAmount(parsedResult.totalExpenses) : "기존 매입 유지"}
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 text-[10.5px] text-slate-600 dark:text-slate-300 font-bold col-span-2 flex items-center justify-between">
                            <span>자재/전표 거래내역: <strong className="text-emerald-600 dark:text-emerald-400">{parsedResult.items?.length || 0}건</strong></span>
                            <span>차종별 매출군: <strong className="text-blue-600 dark:text-blue-400">{parsedResult.vehicleSales?.length || 0}개</strong></span>
                          </div>
                        </div>
                      </div>

                      {uploadSuccess ? (
                        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{successMessage}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={handleConfirmExcelUpload}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {uploading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>데이터베이스 반영 중...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{parsedResult.yearMonth || selectedMonth} 매입매출 데이터베이스 즉시 반영하기</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isJaeyul ? (
            /* ========================================================================= */
            /* ⭐ [설비보전 전용: 전재율 책임] 설비보전일지 작성 모달 (동적 항목 추가 지원) */
            /* ========================================================================= */
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-7 border-2 border-blue-500/40 dark:border-blue-600/40 shadow-2xl space-y-4 my-6 animate-scaleUp">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
                    <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <span>오늘의 설비보전일지 작성</span>
                    </h3>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                      {workerPlant} • {workerFullName} {officialTitle} [설비보전]
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

              <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
                {/* 1. 작성일자, 소속공장, 근무형태 (상단 기본 정보) */}
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
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">소속공장</label>
                    <select
                      value={formData.plant}
                      onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="삼랑진공장">삼랑진공장</option>
                      <option value="한림공장">한림공장</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">근무형태</label>
                    <select
                      value={formData.shift}
                      onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="주간">주간 (08:00~17:00)</option>
                      <option value="야간">야간 (20:00~05:00)</option>
                      <option value="특근">주말 특근</option>
                    </select>
                  </div>
                </div>

                {/* 2. 설비보전 점검 및 작업 내역 (동적 항목 리스트) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>설비보전 작업 및 점검 내역 ({maintenanceItems.length}개 항목)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMaintenanceItem}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 font-black text-xs border border-blue-200 dark:border-blue-800 active:scale-95 transition-all shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ 항목 추가</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {maintenanceItems.map((item, index) => {
                      const isCustom = item.equipmentName === "내용직접입력" || item.equipmentName === "직접입력" || item.equipmentName === "내용입력 (직접입력)";

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border-2 border-slate-200/80 dark:border-slate-700/80 space-y-2.5 relative group"
                        >
                          {/* Item Card Header */}
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 text-white font-black text-[11px] shadow-2xs">
                              항목 #{index + 1}
                            </span>

                            {maintenanceItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMaintenanceItem(item.id)}
                                className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 text-xs font-black px-2 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                ✕ 항목 삭제
                              </button>
                            )}
                          </div>

                          {/* Selectors: 대분류 & 설비명 */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* 대분류 */}
                            <div>
                              <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                대분류
                              </label>
                              <select
                                value={item.category}
                                onChange={(e) => handleUpdateMaintenanceItem(item.id, "category", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                              >
                                {JAEYUL_EQUIPMENT_CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>

                            {/* 설비명 (대분류에 연동되며, 내용직접입력 선택 시 별도 하위창 없이 해당 칸에 직접 입력) */}
                            <div>
                              <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                설비명 ({item.category})
                              </label>

                              {isCustom ? (
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    autoFocus
                                    placeholder={item.category === "치공구" ? "치공구명 직접 입력" : "설비명 직접 입력"}
                                    value={item.customEquipmentName || ""}
                                    onChange={(e) => handleUpdateMaintenanceItem(item.id, "customEquipmentName", e.target.value)}
                                    className="w-full px-2.5 py-1.5 pr-14 rounded-xl border-2 border-blue-500 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none shadow-2xs"
                                  />
                                  {JAEYUL_CATEGORY_EQUIPMENT_MAP[item.category]?.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const firstEq = JAEYUL_CATEGORY_EQUIPMENT_MAP[item.category][0];
                                        handleUpdateMaintenanceItem(item.id, "equipmentName", firstEq);
                                        handleUpdateMaintenanceItem(item.id, "customEquipmentName", "");
                                      }}
                                      className="absolute right-1 top-1 bottom-1 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-0.5 cursor-pointer"
                                      title="목록에서 다시 선택하기"
                                    >
                                      <span>목록</span>
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <select
                                  value={item.equipmentName}
                                  onChange={(e) => {
                                    handleUpdateMaintenanceItem(item.id, "equipmentName", e.target.value);
                                    if (e.target.value === "내용직접입력") {
                                      handleUpdateMaintenanceItem(item.id, "customEquipmentName", "");
                                    }
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                                >
                                  {(JAEYUL_CATEGORY_EQUIPMENT_MAP[item.category] || ["내용직접입력"]).map((eq) => (
                                    <option key={eq} value={eq}>
                                      {eq === "내용직접입력" ? "✏️ 내용직접입력 (직접입력)" : eq}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>

                          {/* 설비보전내용 입력란 */}
                          <div>
                            <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              설비보전내용 <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                              rows="2"
                              placeholder="설비 점검, 정비, 부품 교체, 트러블 슈팅, 오일 보충 내역 등을 상세히 기록해 주세요."
                              value={item.content}
                              onChange={(e) => handleUpdateMaintenanceItem(item.id, "content", e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            ></textarea>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom + 항목 추가 button */}
                  <button
                    type="button"
                    onClick={handleAddMaintenanceItem}
                    className="w-full py-2.5 rounded-2xl border-2 border-dashed border-blue-400/80 dark:border-blue-600/80 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-black text-xs transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>설비보전 항목 추가하기</span>
                  </button>
                </div>

                {/* 📷 현장 작업 사진 첨부 (촬영 우선) */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>설비보전 현장 / 부품 사진 첨부 (촬영 우선, 최대 5장)</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formData.images?.length || 0}/5장
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="file"
                        id="worklog-camera-jaeyul"
                        accept="image/*"
                        capture="environment"
                        disabled={isProcessingImages || (formData.images?.length || 0) >= 5}
                        onChange={(e) => {
                          if (e.target.files) {
                            handleWorkLogImageFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="worklog-camera-jaeyul"
                        className={`w-full py-2.5 px-2 rounded-xl border-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 text-center ${
                          (formData.images?.length || 0) >= 5
                            ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                            : "border-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-200 ring-1 ring-blue-500/30 font-black"
                        }`}
                      >
                        <Camera className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-black truncate">
                          {isProcessingImages ? "압축 중..." : (formData.images?.length || 0) >= 5 ? "5장 완료" : "📸 현장 사진 즉시 촬영"}
                        </span>
                      </label>
                    </div>

                    <div>
                      <input
                        type="file"
                        id="worklog-gallery-jaeyul"
                        accept="image/*"
                        multiple
                        disabled={isProcessingImages || (formData.images?.length || 0) >= 5}
                        onChange={(e) => {
                          if (e.target.files) {
                            handleWorkLogImageFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="worklog-gallery-jaeyul"
                        className={`w-full py-2.5 px-2 rounded-xl border-2 border-dashed flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
                          (formData.images?.length || 0) >= 5
                            ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                            : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                        }`}
                      >
                        <UploadCloud className="w-4 h-4 shrink-0 text-slate-400" />
                        <span className="text-xs font-bold truncate">📁 앨범 / 파일 선택</span>
                      </label>
                    </div>
                  </div>

                  {formData.images && formData.images.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {formData.images.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-2xs"
                        >
                          <img
                            src={img.dataUrl}
                            alt={img.name || `사진 ${idx + 1}`}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `첨부사진 ${idx + 1}` })}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveWorkLogImage(idx)}
                            className="absolute top-1 right-1 w-4.5 h-4.5 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] font-black transition-colors cursor-pointer"
                            title="삭제"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  {logSavedToast && (
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
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
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>오늘의 설비보전일지 등록</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : isExtrusionWorker ? (
            /* ========================================================================= */
            /* ⭐ [압출동 전용: 설유철 책임] 압출동 업무일지 작성 모달 (엑셀 업로드 제거) */
            /* ========================================================================= */
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-7 border-2 border-emerald-500/40 dark:border-emerald-600/40 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
            >
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

                {/* 📷 현장 작업 사진 첨부 (촬영 우선) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>현장 설비 / 작업 사진 첨부 (촬영 우선, 최대 5장)</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formData.images?.length || 0}/5장
                    </span>
                  </div>

                  {/* Dual Buttons: 1. 📸 촬영 우선 / 2. 📁 앨범·파일 선택 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="file"
                        id="worklog-camera-extrusion"
                        accept="image/*"
                        capture="environment"
                        disabled={isProcessingImages || (formData.images?.length || 0) >= 5}
                        onChange={(e) => {
                          if (e.target.files) {
                            handleWorkLogImageFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="worklog-camera-extrusion"
                        className={`w-full py-2.5 px-2 rounded-xl border-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 text-center ${
                          (formData.images?.length || 0) >= 5
                            ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                            : "border-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-200 ring-1 ring-emerald-500/30 font-black"
                        }`}
                      >
                        <Camera className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-black truncate">
                          {isProcessingImages ? "압축 중..." : (formData.images?.length || 0) >= 5 ? "5장 완료" : "📸 현장 사진 즉시 촬영"}
                        </span>
                      </label>
                    </div>

                    <div>
                      <input
                        type="file"
                        id="worklog-gallery-extrusion"
                        accept="image/*"
                        multiple
                        disabled={isProcessingImages || (formData.images?.length || 0) >= 5}
                        onChange={(e) => {
                          if (e.target.files) {
                            handleWorkLogImageFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="worklog-gallery-extrusion"
                        className={`w-full py-2.5 px-2 rounded-xl border-2 border-dashed flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
                          (formData.images?.length || 0) >= 5
                            ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                            : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                        }`}
                      >
                        <UploadCloud className="w-4 h-4 shrink-0 text-slate-400" />
                        <span className="text-xs font-bold truncate">📁 앨범 / 파일 선택</span>
                      </label>
                    </div>
                  </div>

                  {/* Attached Image Thumbnails */}
                  {formData.images && formData.images.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {formData.images.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-2xs"
                        >
                          <img
                            src={img.dataUrl}
                            alt={img.name || `사진 ${idx + 1}`}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `첨부사진 ${idx + 1}` })}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveWorkLogImage(idx)}
                            className="absolute top-1 right-1 w-4.5 h-4.5 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] font-black transition-colors cursor-pointer"
                            title="삭제"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
            >
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

                    {/* 📷 현장 작업 사진 첨부 (촬영 우선) */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>품질 불량 / 현장 사진 첨부 (촬영 우선, 최대 5장)</span>
                        </label>
                        <span className="text-[9.5px] text-slate-400 font-mono">
                          {formData.images?.length || 0}/5장
                        </span>
                      </div>

                      {/* Dual Buttons: 1. 📸 촬영 우선 / 2. 📁 앨범·파일 선택 */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <input
                            type="file"
                            id="worklog-camera-quality"
                            accept="image/*"
                            capture="environment"
                            disabled={isProcessingImages || (formData.images?.length || 0) >= 5}
                            onChange={(e) => {
                              if (e.target.files) {
                                handleWorkLogImageFiles(e.target.files);
                                e.target.value = "";
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="worklog-camera-quality"
                            className={`w-full py-2 px-2 rounded-xl border-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 text-center ${
                              (formData.images?.length || 0) >= 5
                                ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                : "border-indigo-500 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-200 ring-1 ring-indigo-500/30 font-black"
                            }`}
                          >
                            <Camera className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-[11px] font-black truncate">
                              {isProcessingImages ? "압축 중..." : (formData.images?.length || 0) >= 5 ? "5장 완료" : "📸 사진 즉시 촬영"}
                            </span>
                          </label>
                        </div>

                        <div>
                          <input
                            type="file"
                            id="worklog-gallery-quality"
                            accept="image/*"
                            multiple
                            disabled={isProcessingImages || (formData.images?.length || 0) >= 5}
                            onChange={(e) => {
                              if (e.target.files) {
                                handleWorkLogImageFiles(e.target.files);
                                e.target.value = "";
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="worklog-gallery-quality"
                            className={`w-full py-2 px-2 rounded-xl border-2 border-dashed flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
                              (formData.images?.length || 0) >= 5
                                ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                            }`}
                          >
                            <UploadCloud className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="text-[11px] font-bold truncate">📁 앨범 / 파일</span>
                          </label>
                        </div>
                      </div>

                      {/* Attached Image Thumbnails */}
                      {formData.images && formData.images.length > 0 && (
                        <div className="grid grid-cols-5 gap-1.5 pt-1">
                          {formData.images.map((img, idx) => (
                            <div
                              key={img.id || idx}
                              className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-2xs"
                            >
                              <img
                                src={img.dataUrl}
                                alt={img.name || `사진 ${idx + 1}`}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `첨부사진 ${idx + 1}` })}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveWorkLogImage(idx)}
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-[9px] font-black transition-colors cursor-pointer"
                                title="삭제"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
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
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
            >
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

                {/* 📷 현장 작업 사진 첨부 (촬영 우선) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>현장 작업 사진 첨부 (촬영 우선, 최대 5장)</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formData.images?.length || 0}/5장
                    </span>
                  </div>

                  {/* Dual Buttons: 1. 📸 촬영 우선 / 2. 📁 앨범·파일 선택 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="file"
                        id="worklog-camera-standard"
                        accept="image/*"
                        capture="environment"
                        disabled={isProcessingImages || (formData.images?.length || 0) >= 5}
                        onChange={(e) => {
                          if (e.target.files) {
                            handleWorkLogImageFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="worklog-camera-standard"
                        className={`w-full py-2.5 px-2 rounded-xl border-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 text-center ${
                          (formData.images?.length || 0) >= 5
                            ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                            : "border-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-200 ring-1 ring-blue-500/30 font-black"
                        }`}
                      >
                        <Camera className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-black truncate">
                          {isProcessingImages ? "압축 중..." : (formData.images?.length || 0) >= 5 ? "5장 완료" : "📸 사진 즉시 촬영"}
                        </span>
                      </label>
                    </div>

                    <div>
                      <input
                        type="file"
                        id="worklog-gallery-standard"
                        accept="image/*"
                        multiple
                        disabled={isProcessingImages || (formData.images?.length || 0) >= 5}
                        onChange={(e) => {
                          if (e.target.files) {
                            handleWorkLogImageFiles(e.target.files);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="worklog-gallery-standard"
                        className={`w-full py-2.5 px-2 rounded-xl border-2 border-dashed flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
                          (formData.images?.length || 0) >= 5
                            ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                            : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                        }`}
                      >
                        <UploadCloud className="w-4 h-4 shrink-0 text-slate-400" />
                        <span className="text-xs font-bold truncate">📁 앨범 / 파일 선택</span>
                      </label>
                    </div>
                  </div>

                  {/* Attached Image Thumbnails */}
                  {formData.images && formData.images.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {formData.images.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-2xs"
                        >
                          <img
                            src={img.dataUrl}
                            alt={img.name || `사진 ${idx + 1}`}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `첨부사진 ${idx + 1}` })}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveWorkLogImage(idx)}
                            className="absolute top-1 right-1 w-4.5 h-4.5 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] font-black transition-colors cursor-pointer"
                            title="삭제"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
      {/* 📌 태형&미영 일정 등록 및 완료 관리 모달 */}
      {/* ========================================================================= */}
      {commonScheduleModalOpen && (
        <div
          onClick={() => setCommonScheduleModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col border border-indigo-500/40 shadow-2xl animate-scaleUp overflow-hidden cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    태형&미영 일정 관리
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    일정을 등록하고 완료된 일정을 관리할 수 있습니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCommonScheduleModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 divide-y divide-slate-100 dark:divide-slate-800">
              {/* TOP: Registration Form */}
              <form onSubmit={handleRegisterCommonSchedule} className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> 신규 일정 등록
                  </span>
                  <span className="text-[11px] text-slate-400">
                    등록시점부터 일정일까지 유지 및 관리
                  </span>
                </div>

                {/* 구분 선택 버튼 그룹 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    구분 선택
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

                {/* 일정 일자 선택 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    일정 일자 (약속 / 행사일)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="date"
                        required
                        value={commonScheduleForm.date || todayDateStr}
                        onChange={(e) => setCommonScheduleForm({ ...commonScheduleForm, date: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                      />
                      <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setCommonScheduleForm({ ...commonScheduleForm, date: todayDateStr })}
                        className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          (commonScheduleForm.date || todayDateStr) === todayDateStr
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                        }`}
                      >
                        오늘
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 1);
                          const y = d.getFullYear();
                          const m = String(d.getMonth() + 1).padStart(2, "0");
                          const day = String(d.getDate()).padStart(2, "0");
                          setCommonScheduleForm({ ...commonScheduleForm, date: `${y}-${m}-${day}` });
                        }}
                        className="px-2.5 py-2 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer"
                      >
                        내일
                      </button>
                    </div>
                  </div>
                </div>

                {/* 시간 선택 (30분 단위 선택창) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    시간 선택 (30분 단위)
                  </label>
                  <div className="relative">
                    <select
                      value={commonScheduleForm.time || "09:30"}
                      onChange={(e) => setCommonScheduleForm({ ...commonScheduleForm, time: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                    >
                      {TIME_OPTIONS_30MIN.map((t) => (
                        <option key={t} value={t}>
                          {t === "종일" ? "🌅 종일 (시간 지정 없음)" : `⏰ ${t}`}
                        </option>
                      ))}
                    </select>
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Quick Time Presets */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10.5px] text-slate-400 font-bold">빠른 선택:</span>
                    {["종일", "09:30", "13:00", "15:30", "17:00", "19:00"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCommonScheduleForm({ ...commonScheduleForm, time: t })}
                        className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border transition-all cursor-pointer ${
                          commonScheduleForm.time === t
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 일정 내용 & 등록 버튼 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    일정 내용
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="예: 산재요율 교육 / 상동 캠핑장 / 맛집 탐방"
                      value={commonScheduleForm.title}
                      onChange={(e) => setCommonScheduleForm({ ...commonScheduleForm, title: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl border border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="submit"
                      disabled={commonScheduleSaving}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{commonScheduleSaving ? "등록 중..." : "등록"}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* BOTTOM: Schedule Management & Completion List */}
              <div className="pt-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      일정 이력 및 완료 관리
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      (총 {scheduleCounts.all}건)
                    </span>
                  </div>

                  {/* Filter Tabs */}
                  <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setCommonScheduleFilterTab("all")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                        commonScheduleFilterTab === "all"
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-black"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      전체 ({scheduleCounts.all})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommonScheduleFilterTab("active")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                        commonScheduleFilterTab === "active"
                          ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs font-black"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      진행중 ({scheduleCounts.active})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommonScheduleFilterTab("completed")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                        commonScheduleFilterTab === "completed"
                          ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-2xs font-black"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      완료됨 ({scheduleCounts.completed})
                    </button>
                  </div>
                </div>

                {/* List of Schedules */}
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-0.5">
                  {modalFilteredSchedules.length === 0 ? (
                    <div className="py-7 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-400 font-bold">
                        {commonScheduleFilterTab === "completed"
                          ? "완료된 일정이 없습니다."
                          : commonScheduleFilterTab === "active"
                          ? "진행 중인 일정이 없습니다."
                          : "등록된 일정이 없습니다."}
                      </p>
                    </div>
                  ) : (
                    modalFilteredSchedules.map((item) => {
                      const isDone = Boolean(item.isCompleted);
                      const targetStyle =
                        item.target === "세미나"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                          : item.target === "교육"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                          : item.target === "여행"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                          : item.target === "맛집"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-700";

                      const schedDate = item.startDate || item.date || todayDateStr;
                      const regDate = item.createdAt ? item.createdAt.slice(0, 10) : schedDate;
                      const isToday = schedDate === todayDateStr;
                      const formattedSched = schedDate.slice(5).replace("-", ".");
                      const formattedReg = regDate.slice(5).replace("-", ".");

                      return (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                            isDone
                              ? "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75"
                              : "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700"
                          }`}
                        >
                          {/* Left: Check toggle & Info */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => handleToggleCompleteCommonSchedule(item.id, isDone)}
                              title={isDone ? "진행중으로 변경" : "완료 처리"}
                              className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                isDone
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-transparent"
                              }`}
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-black border ${targetStyle}`}>
                                  {item.target || "공통"}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    isToday
                                      ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                  }`}
                                >
                                  {isToday ? `오늘 (${formattedSched})` : formattedSched}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {item.time === "종일" ? "종일" : item.time}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  (등록: {formattedReg})
                                </span>
                                {isDone ? (
                                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                                    완료됨
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    진행중
                                  </span>
                                )}
                              </div>
                              <p
                                className={`text-xs font-bold mt-0.5 truncate ${
                                  isDone
                                    ? "line-through text-slate-400 dark:text-slate-500"
                                    : "text-slate-800 dark:text-slate-100"
                                }`}
                              >
                                {item.title}
                              </p>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedCommonScheduleForComments(item)}
                              className="px-2 py-1 rounded-lg text-[10.5px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 hover:bg-purple-100 flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                              title="의견 및 코멘트 작성/확인"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>의견 {(item.comments || []).length}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleCompleteCommonSchedule(item.id, isDone)}
                              className={`px-2 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                                isDone
                                  ? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-200"
                                  : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
                              }`}
                            >
                              {isDone ? "복원" : "완료"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCommonSchedule(item.id)}
                              title="삭제"
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setCommonScheduleModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📱 매일 아침 손익결산 브리핑 예시화면 및 텔레그램 발송 모달 */}
      {/* ========================================================================= */}
      {dailyPnLModalOpen && (
        <div
          onClick={() => setDailyPnLModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-4 py-4 sm:py-8 flex justify-center items-start sm:items-center animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto animate-scaleUp cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md">
                  <Send className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>📱 매일 아침 매출 & 일정공유 텔레그램 메시지 예시화면</span>
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
                      <span>⬛ [오륙] 매출 & 일정공유</span>
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

                    {/* [3] 태형이랑 & 미영이랑 */}
                    <div>
                      <div className="font-extrabold text-purple-400 text-xs mb-1">
                        [3] 사내 공통일정
                      </div>
                      <div className="pl-2 whitespace-pre-wrap text-slate-200 text-[11px] leading-relaxed">
                        {customPnLBriefing?.commonSchedules || formatCommonSchedulesForTelegram(uncompletedCommonSchedules, todayDateStr)}
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
                    <label className="font-bold text-slate-600 dark:text-slate-400 block mb-0.5">사내 공통일정 (미완료 전체)</label>
                    <textarea
                      rows="3"
                      value={customPnLBriefing?.commonSchedules ?? formatCommonSchedulesForTelegram(uncompletedCommonSchedules, todayDateStr)}
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
                      ? "경영진/대표·전무 전용 경영방으로 매출 & 일정공유 브리핑이 안전하게 구분 발송됩니다."
                      : selectedPnLChannel === "290615483"
                      ? "권태형 대표님 1:1 개인톡으로 매출 & 일정공유 브리핑이 발송됩니다."
                      : "오륙 전체 통합방으로 매출 & 일정공유 브리핑이 발송됩니다."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 🗓️ 등록 일정 상세 & 전체 리스트 팝업 모달 */}
      {/* ========================================================================= */}
      {scheduleDetailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto"
          onClick={() => setScheduleDetailModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-blue-500/40 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-white/20 text-white shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black truncate flex items-center gap-1.5">
                    <span>등록 일정 상세 & 전체 목록</span>
                  </h3>
                  <p className="text-[11px] opacity-90 truncate">
                    [{workerPlant}] {workerFullName} {officialTitle} • {scheduleDetailModal.selectedDate} {scheduleDetailModal.dayName ? `(${scheduleDetailModal.dayName}요일)` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScheduleDetailModal(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer shrink-0"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-bold overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setScheduleDetailModal((prev) => ({ ...prev, filterTab: "day" }))}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                  scheduleDetailModal.filterTab === "day"
                    ? "bg-blue-600 text-white font-black shadow-xs"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>
                  선택 일자 ({scheduleDetailModal.selectedDate?.slice(5)}) (
                  {
                    (annualLeaves || []).filter((l) => {
                      const myId = currentProfile?.id;
                      const myName = workerFullName;
                      const matchUser = (myId && l.userId === myId) || (myName && l.userName === myName);
                      if (!matchUser) return false;
                      return (l.startDate || "") <= scheduleDetailModal.selectedDate && (l.endDate || l.startDate || "") >= scheduleDetailModal.selectedDate;
                    }).length
                  }
                  건)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleDetailModal((prev) => ({ ...prev, filterTab: "week" }))}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                  scheduleDetailModal.filterTab === "week"
                    ? "bg-blue-600 text-white font-black shadow-xs"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  이번 주간 (
                  {
                    myWeeklyCalendarDays.reduce((acc, d) => acc + (d.events?.length || 0), 0)
                  }
                  건)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleDetailModal((prev) => ({ ...prev, filterTab: "all" }))}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                  scheduleDetailModal.filterTab === "all"
                    ? "bg-blue-600 text-white font-black shadow-xs"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>
                  전체 등록 이력 (
                  {
                    (annualLeaves || []).filter((l) => {
                      const myId = currentProfile?.id;
                      const myName = workerFullName;
                      return (myId && l.userId === myId) || (myName && l.userName === myName);
                    }).length
                  }
                  건)
                </span>
              </button>
            </div>

            {/* Modal Body - Schedules List */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[58vh]">
              {(() => {
                const myId = currentProfile?.id;
                const myName = workerFullName;
                let list = (annualLeaves || []).filter((l) => {
                  if (!l) return false;
                  return (myId && l.userId === myId) || (myName && l.userName === myName);
                });

                if (scheduleDetailModal.filterTab === "day") {
                  const targetDate = scheduleDetailModal.selectedDate;
                  list = list.filter((l) => (l.startDate || "") <= targetDate && (l.endDate || l.startDate || "") >= targetDate);
                } else if (scheduleDetailModal.filterTab === "week") {
                  const weekDates = myWeeklyCalendarDays.map((d) => d.dateStr);
                  const minDate = weekDates[0] || "";
                  const maxDate = weekDates[weekDates.length - 1] || "";
                  list = list.filter((l) => {
                    const s = l.startDate || "";
                    const e = l.endDate || l.startDate || "";
                    return s <= maxDate && e >= minDate;
                  });
                }

                list.sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));

                if (list.length === 0) {
                  return (
                    <div className="py-10 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-500">
                        {scheduleDetailModal.filterTab === "day"
                          ? `${scheduleDetailModal.selectedDate}에 등록된 일정이 없습니다.`
                          : scheduleDetailModal.filterTab === "week"
                          ? "이번 주간에 등록된 일정이 없습니다."
                          : "등록된 일정 내역이 없습니다."}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setScheduleSelectedDate(scheduleDetailModal.selectedDate);
                          setScheduleDetailModal(null);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>이 날짜로 새 일정 등록하기</span>
                      </button>
                    </div>
                  );
                }

                return list.map((item) => {
                  const isToday = (item.startDate || "") === todayDateStr;
                  const isShared = Boolean(item.sharedBy);
                  const isDone = item.isCompleted || item.isDismissed;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all space-y-2 ${
                        isToday
                          ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-400/80 shadow-xs ring-1 ring-blue-400/30"
                          : isDone
                          ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-70"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs"
                      }`}
                    >
                      {/* Top row: Badges & Actions */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-xs font-black shadow-2xs flex items-center gap-1">
                            <span>{item.leaveType}</span>
                          </span>

                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-blue-500" />
                            <span>
                              {item.startDate}
                              {item.endDate && item.endDate !== item.startDate ? ` ~ ${item.endDate}` : ""}
                            </span>
                          </span>

                          {isToday && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[10px] font-black animate-pulse">
                              오늘
                            </span>
                          )}

                          {isShared && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-500 text-white text-[10px] font-black">
                              공유받음 ({item.sharedBy})
                            </span>
                          )}

                          {item.sharedWith && item.sharedWith.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                              공유대상: {item.sharedWith.join(", ")}
                            </span>
                          )}

                          {isDone && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                              완료됨
                            </span>
                          )}
                        </div>

                        {/* Delete / Dismiss Action */}
                        <div className="flex items-center gap-1">
                          {!isDone && (
                            <button
                              type="button"
                              onClick={() => handleDismissMyLeave(item.id)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-0.5"
                              title="일정 완료 처리"
                            >
                              <CheckCheck className="w-3 h-3" />
                              <span>완료</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteLeave(item.id)}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800 transition-all cursor-pointer flex items-center gap-0.5"
                            title="일정 완전 삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>삭제</span>
                          </button>
                        </div>
                      </div>

                      {/* Content / Reason */}
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100">
                        <span className="text-slate-400 font-normal mr-1.5">내용:</span>
                        <span>{item.reason || item.leaveType}</span>
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-0.5 flex-wrap gap-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>
                            작성: {item.userName || workerFullName} ({item.plant || workerPlant})
                          </span>
                        </span>
                        <span>
                          등록: {item.createdAt ? item.createdAt.slice(0, 16).replace("T", " ") : item.createdDate || "-"}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-500 truncate">
                선택 일자: {scheduleDetailModal.selectedDate}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setScheduleSelectedDate(scheduleDetailModal.selectedDate);
                    setScheduleDetailModal(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>이 날짜로 일정 등록</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleDetailModal(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 첨부 사진 확대 및 원본 보기 모달 */}
            {/* ========================================================================= */}
      {/* 📊 4대 코어 품목별 일일 불량현황 & 일자별 상세 정리본 팝업 모달 */}
      {/* ========================================================================= */}
      {qualityPopupItem && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setQualityPopupItem(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between gap-3 border-b border-slate-700 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight truncate">
                    [{qualityPopupItem.name}] {selectedMonth || "2026-09"} 일자별 품질 검사 & 불량 정리본
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-xs ${
                      qualityPopupItem.defectRate <= 0.70
                        ? "bg-emerald-500 text-white"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    {qualityPopupItem.defectRate <= 0.70 ? "목표달성" : "관리주의"}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 truncate">
                  차종: <strong className="text-slate-100">{qualityPopupItem.carModel}</strong> | 기본단가: ₩
                  {qualityPopupItem.id === "ja"
                    ? "28,500"
                    : qualityPopupItem.id === "nx4a"
                    ? "32,000"
                    : qualityPopupItem.id === "nx4"
                    ? "31,500"
                    : "29,000"}{" "}
                  | 품질목표: 0.70% 이하
                </p>
              </div>

              <button
                type="button"
                onClick={() => setQualityPopupItem(null)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                title="팝업 닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal KPI Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] text-slate-500 font-bold block">총 검사수량</span>
                <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                  {qualityPopupItem.inspectQty.toLocaleString()} EA
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] text-slate-500 font-bold block">총 불량수량</span>
                <span
                  className={`text-base sm:text-lg font-black font-mono ${
                    qualityPopupItem.defectQty > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                  }`}
                >
                  {qualityPopupItem.defectQty.toLocaleString()} EA
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] text-slate-500 font-bold block">누적 불량률</span>
                <span
                  className={`text-base sm:text-lg font-black font-mono ${
                    qualityPopupItem.defectRate <= 0.70 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {qualityPopupItem.defectRate}%
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] text-slate-500 font-bold block">품질 손실금액</span>
                <span className="text-base sm:text-lg font-black font-mono text-amber-600 dark:text-amber-400">
                  ₩ {qualityPopupItem.lossAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Modal Body: Scrollable Day-by-day Breakdown Table */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>일자별 일일 검사 및 불량 원인 내역 (일일 불량 정리본)</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-bold">
                  {selectedMonth || "2026-09"} 전체 일자
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3 text-center">검사일자</th>
                      <th className="p-3 text-right">검사수량(EA)</th>
                      <th className="p-3 text-right">불량수량(EA)</th>
                      <th className="p-3 text-center">일일 불량률(%)</th>
                      <th className="p-3 text-left">주요 불량 사유 및 건수 (WORST)</th>
                      <th className="p-3 text-right">품질 손실액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {liveQualityDaily.map((d) => {
                      const rec = d.items?.[qualityPopupItem.id] || {
                        inspectQty: 0,
                        defectQty: 0,
                        defectRate: 0,
                        lossAmount: 0,
                        worstReason: "-"
                      };
                      const isGood = rec.defectRate <= 0.70;
                      const hasWork = rec.inspectQty > 0 || rec.defectQty > 0;

                      return (
                        <tr
                          key={d.date}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                            hasWork ? "bg-white dark:bg-slate-900" : "bg-slate-50/40 dark:bg-slate-900/30 text-slate-400"
                          }`}
                        >
                          {/* Date */}
                          <td className="p-3 text-center whitespace-nowrap font-black text-slate-900 dark:text-white">
                            {d.date} ({d.dayOfWeek})
                          </td>

                          {/* Inspect Qty */}
                          <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                            {hasWork ? `${rec.inspectQty.toLocaleString()} EA` : "-"}
                          </td>

                          {/* Defect Qty */}
                          <td className="p-3 text-right font-mono font-bold">
                            {hasWork ? (
                              <span className={rec.defectQty > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"}>
                                {rec.defectQty.toLocaleString()} EA
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>

                          {/* Daily Defect Rate */}
                          <td className="p-3 text-center whitespace-nowrap">
                            {hasWork ? (
                              <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-black ${
                                isGood
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              }`}>
                                {rec.defectRate}%
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>

                          {/* Defect Reasons */}
                          <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                            {hasWork ? (
                              <span className="font-semibold">{rec.worstReason || "-"}</span>
                            ) : (
                              <span className="text-slate-400 italic">미가동 / 휴무</span>
                            )}
                          </td>

                          {/* Loss Amount */}
                          <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {hasWork && rec.lossAmount > 0 ? `₩ ${rec.lossAmount.toLocaleString()}` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Summary Footer */}
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-emerald-500">
                      <td className="p-3 text-center">9월 총 누계</td>
                      <td className="p-3 text-right font-mono text-emerald-400">
                        {qualityPopupItem.inspectQty.toLocaleString()} EA
                      </td>
                      <td className="p-3 text-right font-mono text-rose-400">
                        {qualityPopupItem.defectQty.toLocaleString()} EA
                      </td>
                      <td className="p-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          qualityPopupItem.defectRate <= 0.70 ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                        }`}>
                          {qualityPopupItem.defectRate}%
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 text-[11px]">
                        월간 주요 원인: {qualityPopupItem.worstReason}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-300 whitespace-nowrap">
                        ₩ {qualityPopupItem.lossAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
                💡 이 데이터는 이창엽 선임이 업로드한 원본 엑셀 파일과 100% 동일합니다.
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleExportQualityItemExcel(qualityPopupItem)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>이 정리본 엑셀 다운로드</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQualityPopupItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-black transition-colors cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

{/* ========================================================================= */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="w-full flex items-center justify-between p-3.5 px-5 bg-slate-950/80 border-b border-slate-800 text-white text-xs">
              <span className="font-bold truncate max-w-[240px] sm:max-w-md">
                {previewImageModal.name || "첨부 사진 확인"}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImageModal.url}
                  download={previewImageModal.name || "현장사진.jpg"}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 text-[11px]"
                  title="사진 다운로드"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">다운로드</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImageModal(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white transition-colors cursor-pointer"
                  title="닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image display */}
            <div className="p-3 sm:p-6 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={previewImageModal.url}
                alt={previewImageModal.name || "첨부 사진"}
                className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    
      {/* ========================================================================= */}
      {/* 💬 공통일정 상세 & 의견(코멘트) 작성 팝업 모달 */}
      {/* ========================================================================= */}
      {selectedCommonScheduleForComments && (
        <div
          onClick={() => setSelectedCommonScheduleForComments(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col border border-indigo-500/40 shadow-2xl animate-scaleUp overflow-hidden cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                  <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-base text-slate-900 dark:text-white truncate">
                    공통일정 상세 및 의견 교환
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    일정 세부 내용을 확인하고 관련 의견이나 피드백을 남길 수 있습니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCommonScheduleForComments(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 divide-y divide-slate-100 dark:divide-slate-800 flex-1">
              {/* Schedule Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300">
                      {selectedCommonScheduleForComments.target || "공통"}
                    </span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono">
                      {selectedCommonScheduleForComments.startDate || selectedCommonScheduleForComments.date}
                      {selectedCommonScheduleForComments.endDate && selectedCommonScheduleForComments.endDate !== (selectedCommonScheduleForComments.startDate || selectedCommonScheduleForComments.date)
                        ? ` ~ ${selectedCommonScheduleForComments.endDate}`
                        : ""}
                    </span>
                    {selectedCommonScheduleForComments.time && selectedCommonScheduleForComments.time !== "종일" && (
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        [{selectedCommonScheduleForComments.time}]
                      </span>
                    )}
                  </div>
                  <span className="text-[10.5px] text-slate-400 font-medium">
                    등록자: {selectedCommonScheduleForComments.author || "ADMIN"}
                  </span>
                </div>

                <h4 className="font-black text-base text-slate-900 dark:text-white leading-snug">
                  {selectedCommonScheduleForComments.title}
                </h4>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">
                    상태: <strong className={selectedCommonScheduleForComments.isCompleted ? "text-slate-400" : "text-emerald-600 dark:text-emerald-400 font-black"}>{selectedCommonScheduleForComments.isCompleted ? "완료됨" : "진행중"}</strong>
                  </span>
                  {(isAdmin || isGeneralManager) && (
                    <button
                      type="button"
                      onClick={async () => {
                        const isDone = Boolean(selectedCommonScheduleForComments.isCompleted);
                        await handleToggleCompleteCommonSchedule(selectedCommonScheduleForComments.id, isDone);
                        setSelectedCommonScheduleForComments((prev) => prev ? { ...prev, isCompleted: !isDone } : null);
                      }}
                      className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {selectedCommonScheduleForComments.isCompleted ? "진행중으로 변경" : "일정 완료 처리"}
                    </button>
                  )}
                </div>
              </div>

              {/* Comments / Opinions List */}
              <div className="pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>의견 및 피드백</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {(selectedCommonScheduleForComments.comments || []).length}
                    </span>
                  </span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {(!selectedCommonScheduleForComments.comments || selectedCommonScheduleForComments.comments.length === 0) ? (
                    <div className="py-6 text-center text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      등록된 의견이 없습니다. 첫 번째 의견을 남겨보세요!
                    </div>
                  ) : (
                    selectedCommonScheduleForComments.comments.map((cmt) => {
                      const canDelete = isAdmin || isGeneralManager || cmt.author === currentProfile?.name;
                      const timeStr = cmt.createdAt ? new Date(cmt.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "";
                      const dateStr = cmt.createdAt ? cmt.createdAt.slice(5, 10).replace("-", "/") : "";

                      return (
                        <div
                          key={cmt.id}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-slate-900 dark:text-white">
                                {cmt.author}
                              </span>
                              {cmt.role && (
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {cmt.role}
                                </span>
                              )}
                              {cmt.plant && (
                                <span className="text-[9.5px] text-slate-400 font-bold">
                                  ({cmt.plant})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {dateStr} {timeStr}
                              </span>
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCommonScheduleComment(cmt.id)}
                                  className="p-0.5 text-slate-300 hover:text-rose-600 transition-colors"
                                  title="의견 삭제"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-words leading-relaxed">
                            {cmt.text}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Comment Input Form */}
              <form onSubmit={handleAddCommonScheduleComment} className="pt-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                  <span>
                    작성자: <strong className="text-slate-900 dark:text-white">{currentProfile?.name || "관리자"}</strong> ({currentProfile?.role || currentProfile?.title || "선임"})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commonScheduleCommentInput}
                    onChange={(e) => setCommonScheduleCommentInput(e.target.value)}
                    placeholder="의견이나 조율 내용을 입력하세요..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={commonScheduleCommentSubmitting || !commonScheduleCommentInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
                  >
                    {commonScheduleCommentSubmitting ? "등록중..." : "의견 등록"}
                  </button>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCommonScheduleForComments(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
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
