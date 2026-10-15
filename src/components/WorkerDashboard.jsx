import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense, lazy } from "react";
import {
  Factory,
  Calendar,
  Clock,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  ClipboardList,
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
  MessageCircle,
  RotateCcw,
  Receipt,
  Cpu,
  ShieldAlert
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
import { SevereDisasterBar } from "./SevereDisasterBar";
import FieldWorkerDashboardView from "./dashboard/FieldWorkerDashboardView";
import { useAuth, PLANTS, ADMIN_USERS, isManagerOrAdminUser } from "../context/AuthContext";
import { useMonth, DEFAULT_MONTH_LIST } from "../context/MonthContext";
import { useCurrency } from "../context/CurrencyContext";
import { parseExcelFile } from "../utils/excelHelper";
import {
  getLocalSmartOvertimeData,
  calculateDailySummary,
  subscribeSmartOvertimeData,
  cleanCompanyName,
  buildMatrixFromReports,
  getReportDateSortKey
} from "../services/overtimeSmartService.js";
import {
  getLocalApprovalDocs,
  subscribeApprovalDocs,
  checkApprovalPermission,
  approveDocumentStep,
  holdDocumentStep,
  rejectDocumentStep,
  isApprovalDocPending
} from "../services/approvalService";
import { getLocalAccessLogs, subscribeAccessLogs } from "../services/accessLogService";
import { parseExtrusionExcelFile, saveExtrusionDowntimeBatch, clearAllExtrusionDowntimeLogs } from "../services/extrusionDowntimeService";
import {
  getLocalOvertimeReports,
  subscribeOvertimeReports,
  getLatestOvertimeSummary,
  formatKoreanWorkDate,
  isWeekendByDate
} from "../services/overtimeService";
import {
  getWorkLogs,
  saveWorkLog,
  updateWorkLog,
  isWorkLogApproved,
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
  reactivateAnnualLeave,
  getUserLeaveStatus,
  replyToSharedLeave,
  confirmSharedLeaveReplies
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
  getScheduleCategoryMeta,
  isScheduleAdminRestricted,
  isUserAdminOrHeadquarter,
  filterSchedulesForUser
} from "../services/commonScheduleService";
import { sendDailyPnLMorningBriefingTelegram, sendCommonScheduleRegisteredTelegram, sendCommonScheduleCommentTelegram } from "../services/telegramService";
import { getKSTDateString, formatKSTDateTime, formatKSTDate, formatRelativeAccessTime, isThisWeek } from "../utils/dateUtils";
import { pushModalHistory, subscribeCloseAllModals, useModalHistory } from "../utils/modalHistory";
import { ImagePreviewModal } from "./common/ImagePreviewModal";
import { ExtrusionWorkerDashboardView } from "./extrusion/ExtrusionWorkerDashboardView";
import { isExtrusionWorkerProfile } from "../services/extrusionQualityIssueService";
import { HanulWorkerDashboardView } from "./hanul/HanulWorkerDashboardView";
import { isHanulWorkerProfile } from "../services/hanulQualityIssueService";
import { UnifiedAbnormalityControlPanel } from "./dashboard/UnifiedAbnormalityControlPanel";
import { DashboardModalsContainer } from "./dashboard/DashboardModalsContainer";
import { getWorkLogText } from "../services/workLogI18nService";
import { getWorkerPersonnelCard, isWorkerManagerRole } from "../services/personnelCardService";
import {
  CommonScheduleBar,
  WorkerScheduleCalendarSection,
  HanulAndSevereDisasterSection,
  SalesPurchaseSummarySection,
  AttendanceSummarySection,
  QualityStatusSection,
  ExtrusionDowntimeSection,
  DailyWorkLogTableSection,
  AdminAccessAndIncidentSection
} from "./dashboard/sections";
import { HanulWorkReportTable } from "./HanulWorkReportTable";
import { isExcludedFromWorkReport } from "../services/hanulWorkReportService";
import {
  subscribeHanulQualityIssues,
  getLocalHanulQualityIssues
} from "../services/hanulQualityIssueService";

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

// ⭐ 부적합 분류 드롭다운 옵션 그룹 (제품부적합 / 공정부적합)
export const DEFECT_TYPE_GROUPS = [
  {
    category: "제품부적합",
    label: "📦 제품부적합",
    items: [
      { value: "[제품부적합] 치수", name: "치수" },
      { value: "[제품부적합] 외관", name: "외관" },
      { value: "[제품부적합] 조립", name: "조립" },
      { value: "[제품부적합] 누락/혼입", name: "누락/혼입" }
    ]
  },
  {
    category: "공정부적합",
    label: "⚙️ 공정부적합",
    items: [
      { value: "[공정부적합] 작업조건미준수", name: "작업조건미준수" },
      { value: "[공정부적합] 검사누락", name: "검사누락" },
      { value: "[공정부적합] 설비조건이상", name: "설비조건이상" },
      { value: "[공정부적합] 금형이상", name: "금형이상" },
      { value: "[공정부적합] 치공구이상", name: "치공구이상" }
    ]
  }
];

// Storage key for Extrusion 4-Lines Downtime Data (Synced directly with ExtrusionDowntimeView)
const STORAGE_KEY_EXTRUSION = "factory_extrusion_downtime_user_uploaded_v5";

// Dynamic Extrusion 4-Lines Summary calculated purely from real uploaded data
export const getExtrusionSummaryData = () => {
  let store = {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY_EXTRUSION);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") store = parsed;
    }
  } catch (e) {
    console.error("Failed to load extrusion store:", e);
  }

  const lineKeys = [
    { key: "pcm1", defaultName: "압출 1호 (PCM #1)", defaultCode: "PCM #1", themeColor: "teal" },
    { key: "pcm3", defaultName: "압출 3호 (PCM #3)", defaultCode: "PCM #3", themeColor: "blue" },
    { key: "pvc", defaultName: "압출 PVC 라인", defaultCode: "PVC", themeColor: "amber" },
    { key: "tpe", defaultName: "압출 TPE 라인", defaultCode: "TPE", themeColor: "purple" }
  ];

  return lineKeys.map(({ key, defaultName, defaultCode, themeColor }) => {
    const lObj = store[key] || {};
    const lineName = lObj.name || defaultName;
    const lineCode = lObj.code || defaultCode;
    const sheets = lObj.sheets || lObj.weeklyData || {};
    const sheetKeys = Object.keys(sheets);

    // If no data uploaded yet for this line, display clean initial empty state
    if (sheetKeys.length === 0) {
      return {
        lineKey: key,
        line: lineName,
        code: lineCode,
        themeColor,
        currentMonth: "9월",
        currentMonthMin: 0,
        currentMonthHours: "0.0h",
        lossRate: "0.0%",
        opRatio: "100.0",
        isPending: true,
        monthlyTrend: [
          { month: "7월", opRate: "-", opNum: 100, lossRate: "-", lossNum: 0, isCurrent: false },
          { month: "8월", opRate: "-", opNum: 100, lossRate: "-", lossNum: 0, isCurrent: false },
          { month: "9월", opRate: "-", opNum: 100, lossRate: "-", lossNum: 0, isCurrent: true }
        ]
      };
    }

    // Monthly trends dynamically calculated from uploaded sheets
    const months = ["7월", "8월", "9월"];
    const monthlyTrend = months.map((m) => {
      const mSheets = sheetKeys.filter((k) => k.startsWith(m) || k.includes(m));
      if (mSheets.length === 0) {
        return {
          month: m,
          opRate: "-",
          opNum: 100,
          lossRate: "-",
          lossNum: 0,
          isCurrent: m === "9월"
        };
      }

      let mTotalMin = 0;
      let mPlanMin = 0;
      const mTotalBase = mSheets.length * 7200; // 5 days 24h per week (7,200 min)

      mSheets.forEach((w) => {
        const sh = sheets[w];
        const rows = Array.isArray(sh?.rows) ? sh.rows : [];
        rows.forEach((r) => {
          const noStr = String(r.no || "").trim();
          const taskStr = String(r.task || "").trim();
          if (noStr.includes("합계") || taskStr.includes("합계") || taskStr.includes("총 합계")) return;
          const min = Number(r.minutes || 0);
          mTotalMin += min;
          if (r.plan === "Y" || r.plan === "y") mPlanMin += min;
        });
      });

      const netDowntime = Math.max(0, mTotalMin - mPlanMin);
      const netRunTime = Math.max(0, mTotalBase - mPlanMin);
      const opNum = netRunTime > 0 ? ((netRunTime - netDowntime) / netRunTime) * 100 : 100;
      const lossNum = mTotalBase > 0 ? (mTotalMin / mTotalBase) * 100 : 0;

      return {
        month: m,
        opRate: `${opNum.toFixed(1)}%`,
        opNum: Number(opNum.toFixed(1)),
        lossRate: `${lossNum.toFixed(1)}%`,
        lossNum: Number(lossNum.toFixed(1)),
        isCurrent: m === "9월"
      };
    });

    // 9월 (당월) 누적 비가동 시간 계산
    const sepSheets = sheetKeys.filter((w) => w.startsWith("9월") || w.includes("9월"));
    let sepMin = 0;
    let sepPlanMin = 0;
    const sepTotalBase = Math.max(1, sepSheets.length) * 7200;

    sepSheets.forEach((w) => {
      const sh = sheets[w];
      const rows = Array.isArray(sh?.rows) ? sh.rows : [];
      rows.forEach((r) => {
        const noStr = String(r.no || "").trim();
        const taskStr = String(r.task || "").trim();
        if (noStr.includes("합계") || taskStr.includes("합계") || taskStr.includes("총 합계")) return;
        const min = Number(r.minutes || 0);
        sepMin += min;
        if (r.plan === "Y" || r.plan === "y") sepPlanMin += min;
      });
    });

    const currSep = monthlyTrend.find((m) => m.month === "9월") || monthlyTrend[monthlyTrend.length - 1];
    const sepHours = (sepMin / 60).toFixed(1) + "h";
    const sepNetDowntime = Math.max(0, sepMin - sepPlanMin);
    const sepNetRunTime = Math.max(0, sepTotalBase - sepPlanMin);
    const sepOpRatio =
      sepSheets.length > 0 && sepNetRunTime > 0
        ? (((sepNetRunTime - sepNetDowntime) / sepNetRunTime) * 100).toFixed(1)
        : "100.0";
    const sepLossRate =
      sepSheets.length > 0 && sepTotalBase > 0
        ? `${((sepMin / sepTotalBase) * 100).toFixed(1)}%`
        : "0.0%";

    return {
      lineKey: key,
      line: lineName,
      code: lineCode,
      themeColor,
      currentMonth: "9월",
      currentMonthMin: sepMin,
      currentMonthHours: sepHours,
      lossRate: sepSheets.length > 0 ? sepLossRate : "0.0%",
      opRatio: sepSheets.length > 0 ? sepOpRatio : "100.0",
      isPending: false,
      monthlyTrend
    };
  });
};

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
  "압출기": ["PCM 1호", "PCM 3호", "TPE 1호", "PVC", "내용직접입력"],
  "사출기": ["300TON", "45TON", "25TON", "내용직접입력"],
  "컴프레셔": ["압출동 컴프레셔", "AB동 컴프레셔", "C동 컴프레셔", "내용직접입력"],
  "코팅설비": ["코팅(8턴)", "코팅(서랍)", "내용직접입력"],
  "치공구": ["내용직접입력"],
  "기타": ["내용직접입력"]
};

export const WorkerDashboard = ({ onBulkUpload, onNavigateTab }) => {
  const { currentProfile, isOperator, isAdmin, logout } = useAuth();
  const { selectedMonth, currentMonthData, uploadMonthlyData, availableMonths, changeMonth, currentYearMonth, isCurrentMonth, allMonthlyData } = useMonth();
  const { formatAmount } = useCurrency();

  const isManagerRole = isWorkerManagerRole(currentProfile);
  const workerPlant = currentProfile?.plant || "삼랑진공장";
  const workerFullName = currentProfile?.name || "작업자";
  const officialTitle = currentProfile?.title || (
    currentProfile?.name === "공영국" ? "대리" :
    ["심임대", "이상은", "박종미", "최현영"].includes(currentProfile?.name) ? "반장" :
    currentProfile?.name === "설유철" ? "책임" :
    (isManagerRole ? "반장" : "작업원")
  );
  const assignedProcess = currentProfile?.assignedProcess || (
    currentProfile?.building === "압출동" ? "압출" :
    isExtrusionWorker ? "압출" :
    isHanul ? "외주가공 (한울)" :
    isPartnerProfile ? "외주가공" :
    "가공"
  );
  const isInjoo = currentProfile?.name === "조인주" || currentProfile?.id === "sam_ij";
  const isJaeyul = currentProfile?.name === "전재율" || currentProfile?.id === "sam_jy" || currentProfile?.assignedProcess === "설비보전" || (assignedProcess?.includes("설비보전"));
  const isQualityWorker = currentProfile?.assignedProcess === "품질관리" || currentProfile?.name === "이창엽" || currentProfile?.name === "이상기" || currentProfile?.id === "sam_cy" || currentProfile?.id === "sam_sg";
  const isExtrusionWorker = currentProfile?.name === "설유철" || currentProfile?.id === "sam_yc" || currentProfile?.assignedProcess?.includes("압출") || (assignedProcess?.includes("압출"));
  const isHanul = Boolean(
    currentProfile?.name === "한울" ||
    currentProfile?.company === "한울" ||
    currentProfile?.company?.includes("한울") ||
    currentProfile?.id === "hal_hu" ||
    String(currentProfile?.id || "").startsWith("hal_hu") ||
    (currentProfile?.isPartner && currentProfile?.name?.includes("한울")) ||
    workerFullName?.includes("한울") ||
    currentProfile?.assignedProcess?.includes("한울") ||
    [
      "황수현", "박종미", "마이클", "마크", "로렉스", "무피드", "마틴",
      "박민정", "지라완", "레이놀드", "맥리", "조제인", "새드릭", "니사낫",
      "수파따", "와히드", "찬티마", "데이브", "위간", "프랭클린", "에일리",
      "마이카", "알프레도", "아이린", "에릭", "언"
    ].includes(currentProfile?.name)
  );
  const isTestUser = currentProfile?.name === "TEST" || currentProfile?.id === "hal_test";
  const [isHanulSettlementModalOpen, setIsHanulSettlementModalOpen] = useState(false);
  const [isHanulWorkReportModalOpen, setIsHanulWorkReportModalOpen] = useState(false);
  const [isHanulQualityIssueModalOpen, setIsHanulQualityIssueModalOpen] = useState(false);
  const [hanulQualityIssues, setHanulQualityIssues] = useState(() => getLocalHanulQualityIssues());
  const [hanulReportProject, setHanulReportProject] = useState("9BQC");
  const [hanulReportProcess, setHanulReportProcess] = useState("소재준비");
  const [hanulReportEditData, setHanulReportEditData] = useState(null);
  const [isWorkLogsSummaryModalOpen, setIsWorkLogsSummaryModalOpen] = useState(false);
  useModalHistory(isHanulSettlementModalOpen, () => setIsHanulSettlementModalOpen(false), "workerDashboardHanulModal");
  useModalHistory(isHanulWorkReportModalOpen, () => setIsHanulWorkReportModalOpen(false), "workerDashboardHanulReportModal");
  useModalHistory(isHanulQualityIssueModalOpen, () => setIsHanulQualityIssueModalOpen(false), "workerDashboardHanulQualityModal");
  useModalHistory(isWorkLogsSummaryModalOpen, () => setIsWorkLogsSummaryModalOpen(false), "workerDashboardWorkLogsSummaryModal");

  useEffect(() => {
    const unsub = subscribeHanulQualityIssues((list) => {
      setHanulQualityIssues(list || []);
    });
    return () => unsub();
  }, []);

  const activeHanulQualityCount = useMemo(() => {
    return (hanulQualityIssues || []).filter((i) => i && i.status === "ACTIVE").length;
  }, [hanulQualityIssues]);

  const handleOpenHanulReport = (proj = "9BQC", proc = "소재준비", editData = null) => {
    setHanulReportProject(proj);
    setHanulReportProcess(proc);
    setHanulReportEditData(editData);
    setIsHanulWorkReportModalOpen(true);
  };
  const [selectedOvertimeReportForModal, setSelectedOvertimeReportForModal] = useState(null);

  const workerCard = useMemo(() => {
    return getWorkerPersonnelCard(currentProfile || {});
  }, [currentProfile]);

  const isPartnerProfile = !currentProfile?.isFieldWorker && (
    currentProfile?.isPartner ||
    currentProfile?.name === "유성" ||
    currentProfile?.name === "한울" ||
    currentProfile?.name === "부림텍" ||
    (!String(currentProfile?.id || "").includes("_") && (currentProfile?.company === "유성" || currentProfile?.company === "한울" || currentProfile?.company === "부림텍"))
  );
  const isJaeyulWorker = isJaeyul || currentProfile?.name === "전재율" || currentProfile?.assignedProcess === "설비보전";
  const isHeadquarterUser = isAdmin || currentProfile?.role === "ADMIN" || currentProfile?.name === "권태형" || currentProfile?.name === "최미영" || currentProfile?.plant === "본사";
  const isMyeongjae = currentProfile?.name === "이명재" || currentProfile?.id === "sam_mj";
  const isDongwook = currentProfile?.name === "김동욱" || currentProfile?.id === "hal_dw";
  const isGeneralManager = isMyeongjae || isDongwook || isAdmin || currentProfile?.assignedProcess === "총괄관리";

  const workerDept = isPartnerProfile
    ? (currentProfile?.name || currentProfile?.company || "유성")
    : isHeadquarterUser
    ? "본사 관리팀"
    : (isGeneralManager || isInjoo || currentProfile?.assignedProcess === "총괄관리" || currentProfile?.assignedProcess === "관리팀")
    ? "관리팀"
    : (isJaeyulWorker ? "설비보전팀" : isQualityWorker ? "품질관리팀" : isExtrusionWorker ? "압출관리팀" : (workerCard?.dept || "생산팀"));
  const workerPosition = isPartnerProfile
    ? "대표이사"
    : (officialTitle || workerCard?.position || "작업원");
  const isManagerOrAdmin = isManagerOrAdminUser(currentProfile, isAdmin);
  const isExtrusionWorkerOnly = isExtrusionWorkerProfile(currentProfile);


  // Extrusion 4-Lines Downtime Summary (실시간 업로드 데이터 연동)
  const [extrusionSummaryList, setExtrusionSummaryList] = useState(() => getExtrusionSummaryData());

  useEffect(() => {
    const refreshExtrusionData = () => {
      setExtrusionSummaryList(getExtrusionSummaryData());
    };
    window.addEventListener("storage", refreshExtrusionData);
    window.addEventListener("focus", refreshExtrusionData);
    window.addEventListener("extrusion-data-updated", refreshExtrusionData);
    return () => {
      window.removeEventListener("storage", refreshExtrusionData);
      window.removeEventListener("focus", refreshExtrusionData);
      window.removeEventListener("extrusion-data-updated", refreshExtrusionData);
    };
  }, []);

  // 5 Company Smart Overtime Ledger & Reports Subscription
  const [smartOvertimeData, setSmartOvertimeData] = useState(() => getLocalSmartOvertimeData());
  const [overtimeReports, setOvertimeReports] = useState(() => getLocalOvertimeReports());

  useEffect(() => {
    const unsubSmart = subscribeSmartOvertimeData((data) => {
      if (data && data.attendanceMatrix) {
        setSmartOvertimeData(data);
      }
    });
    const unsubReports = subscribeOvertimeReports((reports) => {
      setOvertimeReports(reports || []);
    });
    const handleOvertimeUpdated = (e) => {
      if (e.detail?.reports) {
        setOvertimeReports(e.detail.reports);
      } else {
        setOvertimeReports(getLocalOvertimeReports());
      }
    };
    window.addEventListener("oryuk_overtime_reports_updated", handleOvertimeUpdated);
    return () => {
      unsubSmart();
      unsubReports();
      window.removeEventListener("oryuk_overtime_reports_updated", handleOvertimeUpdated);
    };
  }, []);

  // 당일 작성여부 및 미작성 업체 계산 (보고서와 대장 실시간 통합)
  const { companyOverviewStats, unwrittenCompanies } = useMemo(() => {
    const rawMatrix = smartOvertimeData?.attendanceMatrix || [];
    const todayStr = getKSTDateString();
    const todayParts = todayStr.split("-");
    const todayDayNum = todayParts.length === 3 ? parseInt(todayParts[2], 10) : new Date().getDate();
    const todayYear = todayParts.length === 3 ? parseInt(todayParts[0], 10) : 2026;
    const todayMonth = todayParts.length === 3 ? parseInt(todayParts[1], 10) : 10;

    // 🔒 Direct Authoritative Matrix: Use official ledger without report re-synthesis
    const matrix = rawMatrix;

    const daily = calculateDailySummary(matrix, todayDayNum, todayYear, todayMonth);
    const companyStyles = {
      "오륙": { dot: "bg-blue-500", borderHover: "hover:border-blue-400 dark:hover:border-blue-500", badgeColor: "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800" },
      "조영": { dot: "bg-purple-500", borderHover: "hover:border-purple-400 dark:hover:border-purple-500", badgeColor: "text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 border-purple-200 dark:border-purple-800" },
      "한울": { dot: "bg-emerald-500", borderHover: "hover:border-emerald-400 dark:hover:border-emerald-500", badgeColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800" },
      "부림텍": { dot: "bg-amber-500", borderHover: "hover:border-amber-400 dark:hover:border-amber-500", badgeColor: "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800" },
      "유성": { dot: "bg-cyan-500", borderHover: "hover:border-cyan-400 dark:hover:border-cyan-500", badgeColor: "text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-800" }
    };

    const companies = ["오륙", "조영", "한울", "부림텍", "유성"].map((name) => {
      const styles = companyStyles[name] || companyStyles["오륙"];
      const cleanCompName = cleanCompanyName(name);
      const b = daily?.companyBreakdown?.[cleanCompName] || daily?.companyBreakdown?.[name];
      const compWorkers = matrix.filter((w) => cleanCompanyName(w.company) === cleanCompName);
      const hasDirectReport = (overtimeReports || []).some((r) => {
        if (!r) return false;
        const rDateKey = getReportDateSortKey(r);
        if (rDateKey !== todayStr) return false;
        const rComp = cleanCompanyName(r.company || "");
        if (rComp && rComp !== "전체" && rComp !== "5개사 통합" && rComp !== "전사" && rComp !== "통합" && rComp !== "ALL") {
          return rComp === cleanCompName;
        }
        if (Array.isArray(r.companies) && r.companies.length > 0) {
          return r.companies.some((c) => cleanCompanyName(c) === cleanCompName);
        }
        return false;
      });

      const enteredCount = compWorkers.filter((w) => {
        const v = (w.daily && (w.daily[todayDayNum] !== undefined ? w.daily[todayDayNum] : w.daily[String(todayDayNum)])) ?? w[todayDayNum] ?? w[String(todayDayNum)];
        const str = String(v ?? "").trim();
        return str !== "" && str !== "미입력" && str !== "-" && str !== "undefined" && str !== "null";
      }).length;

      const isWritten = hasDirectReport || (compWorkers.length > 0 ? enteredCount > 0 : false);
      const shortName = name.replace(/[()주]/g, "");

      const workers = b?.total && b.total > 0 ? b.total : compWorkers.length;
      const attended = b ? (b.attended || 0) : 0;
      const absent = b ? (b.absent || 0) : 0;
      const otWorkers = b ? (b.otWorkers || 0) : 0;
      const otHours = b ? (b.otHours || 0) : 0;
      const totalHours = b ? (b.totalHours || 0) : 0;

      const statusBadgeText = isWritten ? "작성완료" : "작성전";
      const statusBadgeClass = isWritten
        ? "bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
        : "bg-amber-100 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold";

      return {
        name,
        shortName,
        isWritten,
        statusBadgeText,
        statusBadgeClass,
        workers,
        attended,
        absent,
        otWorkers,
        otHours,
        totalHours,
        dot: styles.dot,
        borderHover: styles.borderHover,
        badgeColor: styles.badgeColor,
        isTotal: false
      };
    });

    const unwritten = companies.filter((c) => !c.isWritten);

    const totalWorkers = companies.reduce((acc, c) => acc + (c.workers || 0), 0);
    const totalAttended = companies.reduce((acc, c) => acc + (c.attended || 0), 0);
    const totalAbsent = companies.reduce((acc, c) => acc + (c.absent || 0), 0);
    const totalOtWorkers = companies.reduce((acc, c) => acc + (c.otWorkers || 0), 0);
    const totalOtHours = companies.reduce((acc, c) => acc + (c.otHours || 0), 0);
    const totalHours = companies.reduce((acc, c) => acc + (c.totalHours || 0), 0);

    const totalItem = {
      name: "전회사 TOTAL",
      shortName: "전사",
      isWritten: unwritten.length === 0,
      statusBadgeText: unwritten.length === 0 ? "전사 완료" : `${5 - unwritten.length}/5 완료`,
      statusBadgeClass: unwritten.length === 0
        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
        : "bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700",
      workers: totalWorkers,
      attended: totalAttended,
      absent: totalAbsent,
      otWorkers: totalOtWorkers,
      otHours: totalOtHours,
      totalHours: totalHours,
      dot: "bg-rose-500",
      borderHover: "hover:border-cyan-500 dark:hover:border-cyan-400 ring-1 ring-cyan-400/40 dark:ring-cyan-500/30",
      badgeColor: "text-cyan-800 dark:text-cyan-200 bg-cyan-100 dark:bg-cyan-950 border-cyan-300 dark:border-cyan-800",
      isTotal: true
    };

    return {
      companyOverviewStats: [totalItem, ...companies],
      unwrittenCompanies: unwritten
    };
  }, [smartOvertimeData, overtimeReports]);

  const [approvalDocs, setApprovalDocs] = useState(() => getLocalApprovalDocs());

  useEffect(() => {
    const unsub = subscribeApprovalDocs((docs) => {
      setApprovalDocs(docs);
    });
    const handleApprovalUpdated = (e) => {
      if (e.detail?.docs) {
        setApprovalDocs(e.detail.docs);
      } else {
        setApprovalDocs(getLocalApprovalDocs());
      }
    };
    window.addEventListener("oryuk_approval_document_updated", handleApprovalUpdated);
    return () => {
      unsub();
      window.removeEventListener("oryuk_approval_document_updated", handleApprovalUpdated);
    };
  }, []);

  const pendingOrHoldDocs = useMemo(() => {
    return approvalDocs.filter((d) => isApprovalDocPending(d, currentProfile, isAdmin) || d.status === "HOLD");
  }, [approvalDocs, currentProfile, isAdmin]);

  const pendingCount = useMemo(() => {
    return approvalDocs.filter((d) => isApprovalDocPending(d, currentProfile, isAdmin)).length;
  }, [approvalDocs, currentProfile, isAdmin]);

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

  // Browser/Android Back Button safe modal stack management
  useModalHistory(isModalOpen, () => setIsModalOpen(false), "workerDashboardLogModal");
  useModalHistory(Boolean(selectedLogDetail), () => setSelectedLogDetail(null), "workerDashboardLogDetailModal");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlant, setFilterPlant] = useState(() => {
    if (isMyeongjae) return "삼랑진공장";
    if (isDongwook) return "한림공장";
    return "all";
  });
  const [logSavedToast, setLogSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("업무일지가 저장되었습니다.");
  const [approvalCommentInput, setApprovalCommentInput] = useState("");
  const [editingLog, setEditingLog] = useState(null);
  const [editFormData, setEditFormData] = useState({
    id: "",
    date: "",
    plant: "삼랑진공장",
    writer: "",
    title: "",
    process: "",
    shift: "주간",
    line: "",
    workContent: "",
    issues: "",
    images: []
  });
  const [editMaintenanceItems, setEditMaintenanceItems] = useState([]);
  const [isEditProcessingImages, setIsEditProcessingImages] = useState(false);

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

  const overtimeSummary = useMemo(() => {
    return getLatestOvertimeSummary(overtimeReports);
  }, [overtimeReports]);

  // 오늘 날짜 포맷 (예: 9월 14일 (월))
  const todayFormattedLabel = useMemo(() => {
    const todayStr = getKSTDateString();
    const parts = todayStr.split("-");
    if (parts.length === 3) {
      const dateObj = new Date(`${todayStr}T00:00:00+09:00`);
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      const dayName = dayNames[dateObj.getDay()] || "";
      return `${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일 (${dayName})`;
    }
    return todayStr;
  }, []);

  // 특근보고서 결재 완료 여부 확인 (평일 보고서는 작성자 전결이므로 무조건 완료, 주말 특근만 결재 완료 시 대시보드에서 자동 숨김)
  const isOvertimeReportApproved = useCallback((rep) => {
    if (!rep) return false;
    // ⭐ 평일(월~금) 근태보고서는 작성자 전결이므로 무조건 승인 완료로 간주
    const isWk = isWeekendByDate(rep.workDate || rep.title || rep.workDateFormatted);
    if (!isWk) return true;

    if (rep.approvalStatus === "결재완료" || rep.approvalStatus === "APPROVED" || rep.status === "APPROVED" || rep.status === "결재완료") {
      return true;
    }
    if (Array.isArray(rep.approval) && rep.approval.length > 0 && rep.approval.every((st) => st.status === "완료" || st.status === "APPROVED")) {
      return true;
    }
    if (Array.isArray(approvalDocs)) {
      const isSam = rep.plant === "삼랑진공장" || rep.company === "(주)오륙" || rep.company === "유성" || rep.plant?.includes("삼랑진");
      const plantKey = isSam ? "samrangjin" : "hanlim";
      const targetPlant = isSam ? "삼랑진공장" : "한림공장";
      const dateKey = rep.workDate ? rep.workDate.replace(/-/g, "") : "";
      const matchedDoc = approvalDocs.find((d) => {
        const isOt = d.type === "OVERTIME" || d.docType === "OVERTIME" || d.category === "OVERTIME";
        if (!isOt) return false;
        const matchesPlant = d.plant === targetPlant || d.targetPlant === targetPlant || (d.id && d.id.includes(plantKey)) || (d.title && d.title.includes(isSam ? "삼랑진" : "한림"));
        const matchesDate = (dateKey && d.id && d.id.includes(dateKey)) || d.workDate === rep.workDate || (d.title && rep.workDate && d.title.includes(rep.workDate));
        return matchesPlant && matchesDate;
      });
      if (matchedDoc) {
        if (matchedDoc.status === "APPROVED" || matchedDoc.status === "결재완료") {
          return true;
        }
        if (Array.isArray(matchedDoc.steps) && matchedDoc.steps.every((st) => st.status === "APPROVED" || st.status === "완료")) {
          return true;
        }
        if (currentProfile) {
          const perm = checkApprovalPermission(matchedDoc, currentProfile, isAdmin);
          if (perm.hasApproved) {
            return true;
          }
        }
      }
    }
    return false;
  }, [approvalDocs, currentProfile, isAdmin]);

  // 🌟 공장별 최신 일자의 미결재 특근보고서 추출 (주말/공휴일 특근보고서만 대상, 평일 근태보고서 완전 제외, 결재 완료 시 자동 숨김)
  const pendingApprovalCards = useMemo(() => {
    if (!Array.isArray(overtimeReports)) return [];
    const list = [];
    const seenIds = new Set();

    // 1. 삼랑진공장: 최신 일자 미결재 특근보고서 추출 (오륙, 유성 - 주말/특근만)
    const unapprovedSam = overtimeReports.filter((r) => {
      if (!r) return false;
      const isSam = r.plant === "삼랑진공장" || r.company === "(주)오륙" || r.company === "유성" || (r.plant?.includes("삼랑진") && !r.plant?.includes("한림"));
      if (!isSam) return false;
      const isWk = isWeekendByDate(r.workDate || r.title || r.workDateFormatted);
      if (!isWk) return false; // 평일 근태보고서는 전결이므로 제외
      return !isOvertimeReportApproved(r);
    }).sort((a, b) => (b.workDate || b.updatedAt || "").localeCompare(a.workDate || a.updatedAt || ""));

    if (unapprovedSam.length > 0) {
      const latestSamDate = unapprovedSam[0].workDate;
      const samLatestReports = unapprovedSam.filter((r) => (r.workDate || "") === latestSamDate);
      samLatestReports.forEach((rep) => {
        const companyLabel = rep.company || (rep.companies && rep.companies.length === 1 ? rep.companies[0] : "");
        const badgeLabel = companyLabel ? `삼랑진공장 (${cleanCompanyName(companyLabel)})` : "삼랑진공장 특근";
        const cardId = rep.id || `rep_sam_${rep.workDate}_${companyLabel}`;
        if (!seenIds.has(cardId)) {
          seenIds.add(cardId);
          list.push({
            id: cardId,
            docId: rep.id,
            plant: "삼랑진공장",
            company: cleanCompanyName(companyLabel),
            isHallim: false,
            badgeLabel: badgeLabel,
            title: rep.title || `${badgeLabel} 보고서`,
            workDate: rep.workDate || "",
            workDateFormatted: formatKoreanWorkDate(rep.workDate) || rep.workDateFormatted || rep.workDate || "",
            author: rep.author || "선임",
            authorTitle: rep.authorTitle || "선임",
            cost: Number(rep.cost || 0),
            totalWorkers: Number(rep.totalWorkers || rep.headcount || (rep.items ? rep.items.length : 0)) || 0,
            items: rep.items || [],
            statusLabel: rep.status === "HOLD" ? "결재보류" : (rep.status === "APPROVED" ? "결재완료" : "결재진행중"),
            sourceType: "overtime",
            reportType: rep.reportType || "특근보고서"
          });
        }
      });
    }

    // 2. 한림공장: 최신 일자 미결재 특근보고서 추출 (한울, 조영, 부림텍 - 주말/특근만)
    const unapprovedHal = overtimeReports.filter((r) => {
      if (!r) return false;
      const isHal = r.plant === "한림공장" || r.company === "한울" || r.company === "부림텍" || r.company === "(주)조영산업" || r.company === "조영" || r.plant?.includes("한림");
      if (!isHal) return false;
      const isWk = isWeekendByDate(r.workDate || r.title || r.workDateFormatted);
      if (!isWk) return false; // 평일 근태보고서는 전결이므로 제외
      return !isOvertimeReportApproved(r);
    }).sort((a, b) => (b.workDate || b.updatedAt || "").localeCompare(a.workDate || a.updatedAt || ""));

    if (unapprovedHal.length > 0) {
      const latestHalDate = unapprovedHal[0].workDate;
      const halLatestReports = unapprovedHal.filter((r) => (r.workDate || "") === latestHalDate);
      halLatestReports.forEach((rep) => {
        const companyLabel = rep.company || (rep.companies && rep.companies.length === 1 ? rep.companies[0] : "");
        const badgeLabel = companyLabel ? `한림공장 (${cleanCompanyName(companyLabel)})` : "한림공장 특근";
        const cardId = rep.id || `rep_hal_${rep.workDate}_${companyLabel}`;
        if (!seenIds.has(cardId)) {
          seenIds.add(cardId);
          list.push({
            id: cardId,
            docId: rep.id,
            plant: "한림공장",
            company: cleanCompanyName(companyLabel),
            isHallim: true,
            badgeLabel: badgeLabel,
            title: rep.title || `${badgeLabel} 보고서`,
            workDate: rep.workDate || "",
            workDateFormatted: formatKoreanWorkDate(rep.workDate) || rep.workDateFormatted || rep.workDate || "",
            author: rep.author || "선임",
            authorTitle: rep.authorTitle || "선임",
            cost: Number(rep.cost || 0),
            totalWorkers: Number(rep.totalWorkers || rep.headcount || (rep.items ? rep.items.length : 0)) || 0,
            items: rep.items || [],
            statusLabel: rep.status === "HOLD" ? "결재보류" : (rep.status === "APPROVED" ? "결재완료" : "결재진행중"),
            sourceType: "overtime",
            reportType: rep.reportType || "특근보고서"
          });
        }
      });
    }

    return list;
  }, [overtimeReports, isOvertimeReportApproved]);

  const getReportWorkersList = (report) => {
    if (!report) return [];

    // 1. If report has items array with worker-level details
    if (Array.isArray(report.items) && report.items.length > 0) {
      const list = [];
      report.items.forEach((it) => {
        if (it.workerName || it.name) {
          list.push({
            no: list.length + 1,
            name: it.workerName || it.name,
            dept: it.dept || it.category || "생산",
            line: it.line || it.category || "-",
            hours: it.hours ? `${it.hours}H` : (it.otHours ? `${it.otHours}H` : "8H"),
            otHours: it.otHours ? `${it.otHours}H` : (it.hours ? `${it.hours}H` : "8H"),
            workContent: it.workContent || it.workDetails || it.details || "특근 및 생산 작업 수행",
            note: it.attendanceCode ? `근태: ${it.attendanceCode}` : ""
          });
        } else if (it.names && typeof it.names === "string") {
          const splitNames = it.names.split(",").map((s) => s.trim()).filter(Boolean);
          splitNames.forEach((nm) => {
            list.push({
              no: list.length + 1,
              name: nm,
              dept: it.dept || it.category || "가공동",
              line: it.line || it.category || "-",
              hours: it.hours ? `${it.hours}H` : "8H",
              otHours: it.hours ? `${it.hours}H` : "8H",
              workContent: it.workContent || it.workDetails || "특근 및 생산 작업 수행",
              note: ""
            });
          });
        }
      });
      if (list.length > 0) return list;
    }

    // 2. If no detailed items, look up smartOvertimeData.attendanceMatrix for this company and workDate!
    if (smartOvertimeData && Array.isArray(smartOvertimeData.attendanceMatrix) && report.workDate) {
      const parts = String(report.workDate).split("-");
      const dayNum = parts.length >= 3 ? parseInt(parts[2], 10) : NaN;
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return [];
      const targetComp = cleanCompanyName(report.company || (report.badgeLabel || ""));
      const matched = smartOvertimeData.attendanceMatrix.filter((w) => {
        const matchComp = !targetComp || cleanCompanyName(w.company) === targetComp;
        if (!matchComp) return false;
        const code = w.daily ? w.daily[dayNum] : "";
        return code === "특근" || code === "주말특근" || code === "19" || code === "21" || code === "22" || code === "🟢" || code === "야간" || code === "주야";
      });

      if (matched.length > 0) {
        return matched.map((w, idx) => ({
          no: idx + 1,
          name: w.name,
          dept: w.dept || "생산",
          line: w.line || w.dept || "-",
          hours: (w.daily?.[dayNum] === "19" ? "10H (+2H)" : w.daily?.[dayNum] === "21" ? "12H (+4H)" : w.daily?.[dayNum] === "22" ? "13H (+5H)" : "8H (특근)"),
          otHours: (w.daily?.[dayNum] === "19" ? "2H" : w.daily?.[dayNum] === "21" ? "4H" : w.daily?.[dayNum] === "22" ? "5H" : "8H"),
          workContent: `${w.dept || ""} ${w.line || ""} 생산 및 특근 대응`,
          note: `근태코드: ${w.daily?.[dayNum] || "특근"}`
        }));
      }
    }

    return [];
  };

  const handleOpenWorkerLogs = (worker) => {
    pushModalHistory("worker_access_logs");
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

  // 🌟 Global Auto-close all modals on popstate (뒤로가기 시 팝업 닫기)
  useEffect(() => {
    const unsub = subscribeCloseAllModals(() => {
      setIsModalOpen(false);
      setEditingLog(null);
      setSelectedLogDetail(null);
      setSelectedWorkerForLogs(null);
      setQualityPopupItem(null);
      setPreviewImageModal(null);
      setIsHanulSettlementModalOpen(false);
    });
    return () => unsub();
  }, []);

  const handleOpenHanulSettlementModal = () => {
    pushModalHistory("hanul_settlement_modal");
    setIsHanulSettlementModalOpen(true);
  };

  const handleOpenWorkLogModal = () => {
    pushModalHistory("worklog_write");
    setIsModalOpen(true);
  };

  const handleOpenLogDetail = (log) => {
    pushModalHistory("worklog_detail");
    setSelectedLogDetail(log);
    setApprovalCommentInput(log?.approvalComment || "");
  };

  // ⭐ Field Worker (작업자 전용 모드) 상태 및 오늘 일보 확인 (workLogs, handleOpenWorkLogModal 초기화 후 안전하게 선언)
  const [workerLogScope, setWorkerLogScope] = useState("my"); // "my" | "plant"
  const [workerLogApprovalFilter, setWorkerLogApprovalFilter] = useState("all"); // "all" | "대기" | "승인"

  const currentWorkerTodayDateStr = useMemo(() => getKSTDateString(), []);
  const todayLog = useMemo(() => {
    return (workLogs || []).find(
      (l) =>
        Boolean(l) &&
        l.date === currentWorkerTodayDateStr &&
        (l.writer === workerFullName ||
          l.writer === currentProfile?.name ||
          l.author === currentProfile?.name ||
          (currentProfile?.name && typeof l.writer === "string" && l.writer.includes(currentProfile.name)))
    );
  }, [workLogs, currentWorkerTodayDateStr, workerFullName, currentProfile?.name]);

  const workerLogsList = useMemo(() => {
    return (workLogs || [])
      .filter((log) => {
        if (!log) return false;
        // 1. Scope filter
        if (workerLogScope === "my") {
          const isMy =
            log.writer === workerFullName ||
            log.writer === currentProfile?.name ||
            log.author === currentProfile?.name ||
            (currentProfile?.name && typeof log.writer === "string" && log.writer.includes(currentProfile.name));
          if (!isMy) return false;
        } else if (workerLogScope === "plant") {
          if (workerPlant && log.plant && log.plant !== workerPlant) return false;
        }

        // 2. Approval filter
        if (workerLogApprovalFilter === "대기") {
          if (isWorkLogApproved(log)) return false;
        } else if (workerLogApprovalFilter === "승인") {
          if (!isWorkLogApproved(log)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return (b.date || "").localeCompare(a.date || "");
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });
  }, [workLogs, workerLogScope, workerFullName, currentProfile?.name, workerPlant, workerLogApprovalFilter]);

  // Header "✍️ 일보작성" 버튼 연동 리스너 및 핀 로그인 즉시 일보작성 연결
  useEffect(() => {
    const handleOpen = () => {
      handleOpenWorkLogModal();
    };
    window.addEventListener("open-worker-worklog-modal", handleOpen);

    try {
      if (sessionStorage.getItem("auto_open_worker_worklog") === "true") {
        sessionStorage.removeItem("auto_open_worker_worklog");
        setTimeout(() => {
          handleOpenWorkLogModal();
        }, 100);
      }
    } catch (e) {}

    return () => window.removeEventListener("open-worker-worklog-modal", handleOpen);
  }, []);

  const handleOpenQualityPopup = (it) => {
    pushModalHistory("quality_popup");
    setQualityPopupItem(it);
  };

  const handleOpenPreviewImage = (img) => {
    pushModalHistory("image_preview");
    setPreviewImageModal(img);
  };

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
    defectType: "",
    issues: "",
    images: [], // 전체 첨부 사진 목록
    imagesBefore: [], // 🔴 개선 전 (Before) 사진 목록
    imagesAfter: [] // 🟢 개선 후 (After) 사진 목록
  });
  const [isSavingLog, setIsSavingLog] = useState(false);

  useEffect(() => {
    if (currentProfile) {
      const isHQ = isAdmin || currentProfile.role === "ADMIN" || currentProfile.name === "권태형" || currentProfile.name === "최미영" || currentProfile.plant === "본사";
      const isGM = isMyeongjae || isDongwook || currentProfile.assignedProcess === "총괄관리";
      setFormData((prev) => ({
        ...prev,
        plant: prev.plant || currentProfile.plant || (isHQ ? "본사" : "삼랑진공장"),
        writer: currentProfile.name || "작업자",
        process: isInjoo
          ? "경리업무"
          : isQualityWorker
          ? "품질관리"
          : isHQ
          ? "총괄경영관리"
          : isGM
          ? "총괄관리"
          : (currentProfile.assignedProcess || "가공동 관리"),
        line: isInjoo
          ? "본사/현장 정산 및 전표 마감"
          : isQualityWorker
          ? "전라인 품질 검사 및 불량 분석"
          : isHQ
          ? "본사 총괄 경영 및 운영 관리"
          : isGM
          ? `${currentProfile.plant || "공장"} 총괄 운영 관리`
          : (currentProfile.assignedProcess?.includes("압출") ? "9BQC 압출 1호기" : "가공 라인")
      }));
    }
  }, [currentProfile?.id, currentProfile?.name, isInjoo, isQualityWorker, isExtrusionWorker, isAdmin, isMyeongjae, isDongwook]);

  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState(null); // { url, name }
  useModalHistory(Boolean(previewImageModal), () => setPreviewImageModal(null), "workerDashboardPreviewImageModal");

  const handleWorkLogImageFiles = async (files, type = "all") => {
    if (!files || files.length === 0) return;
    const isSeparated = type === "before" || type === "after";
    const currentBefore = formData.imagesBefore || [];
    const currentAfter = formData.imagesAfter || [];
    const totalCount = isSeparated
      ? currentBefore.length + currentAfter.length
      : (formData.images || []).length;
    
    const maxLimit = isSeparated ? 3 : 5;
    if (totalCount >= maxLimit) {
      alert(`현장 사진은 최대 ${maxLimit}장까지 첨부할 수 있습니다.`);
      return;
    }
    const remainingSlots = maxLimit - totalCount;
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, remainingSlots);
    if (validFiles.length === 0) return;

    setIsProcessingImages(true);
    try {
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setFormData((prev) => {
        if (type === "before") {
          const nextBefore = [...(prev.imagesBefore || []), ...processed].slice(0, 3);
          const nextAfter = prev.imagesAfter || [];
          return {
            ...prev,
            imagesBefore: nextBefore,
            imagesAfter: nextAfter,
            images: [...nextBefore, ...nextAfter]
          };
        } else if (type === "after") {
          const nextBefore = prev.imagesBefore || [];
          const nextAfter = [...(prev.imagesAfter || []), ...processed].slice(0, 3);
          return {
            ...prev,
            imagesBefore: nextBefore,
            imagesAfter: nextAfter,
            images: [...nextBefore, ...nextAfter]
          };
        } else {
          return {
            ...prev,
            images: [...(prev.images || []), ...processed].slice(0, 5)
          };
        }
      });
    } catch (err) {
      console.error("사진 처리 오류:", err);
      alert("사진을 불러오거나 압축하는 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleRemoveWorkLogImage = (idx, type = "all") => {
    setFormData((prev) => {
      if (type === "before") {
        const nextBefore = (prev.imagesBefore || []).filter((_, i) => i !== idx);
        const nextAfter = prev.imagesAfter || [];
        return {
          ...prev,
          imagesBefore: nextBefore,
          imagesAfter: nextAfter,
          images: [...nextBefore, ...nextAfter]
        };
      } else if (type === "after") {
        const nextBefore = prev.imagesBefore || [];
        const nextAfter = (prev.imagesAfter || []).filter((_, i) => i !== idx);
        return {
          ...prev,
          imagesBefore: nextBefore,
          imagesAfter: nextAfter,
          images: [...nextBefore, ...nextAfter]
        };
      } else {
        return {
          ...prev,
          images: (prev.images || []).filter((_, i) => i !== idx)
        };
      }
    });
  };

  // 🌟 [전재율 책임 전용] 설비보전 항목 동적 추가/수정/삭제 상태 (항목별 개선전/개선후 사진 첨부 지원)
  const [maintenanceItems, setMaintenanceItems] = useState([
    {
      id: 1,
      category: "압출기",
      equipmentName: "PCM 1호",
      customEquipmentName: "",
      content: "",
      imagesBefore: [],
      imagesAfter: []
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
        content: "",
        imagesBefore: [],
        imagesAfter: []
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

  // 📷 [전재율 책임 전용] 항목별 개선전 / 개선후 사진 첨부 (최대 3장씩)
  const handleMaintenanceItemImageFiles = async (itemId, files, type = "before") => {
    if (!files || files.length === 0) return;
    const targetItem = maintenanceItems.find((it) => it.id === itemId);
    if (!targetItem) return;
    const key = type === "before" ? "imagesBefore" : "imagesAfter";
    const currentImgs = targetItem[key] || [];
    if (currentImgs.length >= 3) {
      alert(`${type === "before" ? "개선 전" : "개선 후"} 사진은 항목당 최대 3장까지 등록 가능합니다.`);
      return;
    }
    const remainingSlots = 3 - currentImgs.length;
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, remainingSlots);
    if (validFiles.length === 0) return;

    setIsProcessingImages(true);
    try {
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setMaintenanceItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            [key]: [...(item[key] || []), ...processed].slice(0, 3)
          };
        })
      );
    } catch (err) {
      console.error("사진 처리 오류:", err);
      alert("사진을 불러오거나 압축하는 중 오류가 발생했습니다.");
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleRemoveMaintenanceItemImage = (itemId, imgIdx, type = "before") => {
    const key = type === "before" ? "imagesBefore" : "imagesAfter";
    setMaintenanceItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          [key]: (item[key] || []).filter((_, i) => i !== imgIdx)
        };
      })
    );
  };


  useEffect(() => {
    if (currentProfile) {
      const isHQ = isAdmin || currentProfile.role === "ADMIN" || currentProfile.name === "권태형" || currentProfile.name === "최미영" || currentProfile.plant === "본사";
      const isGM = isMyeongjae || isDongwook || currentProfile.assignedProcess === "총괄관리";
      setFormData((prev) => ({
        ...prev,
        plant: prev.plant || (isHQ ? "본사" : workerPlant),
        writer: workerFullName,
        process: isInjoo
          ? "경리업무"
          : isQualityWorker
          ? "품질관리"
          : isHQ
          ? "총괄경영관리"
          : isGM
          ? "총괄관리"
          : (currentProfile.assignedProcess || prev.process || "가공동 관리"),
        line: isInjoo
          ? "본사/현장 정산 및 전표 마감"
          : isQualityWorker
          ? "전라인 품질 검사 및 불량 분석"
          : isHQ
          ? "본사 총괄 경영 및 운영 관리"
          : isGM
          ? `${workerPlant} 총괄 운영 관리`
          : (prev.line || "가공 라인")
      }));

      // Automatically focus on manager's dedicated plant
      if (isMyeongjae) setFilterPlant("삼랑진공장");
      else if (isDongwook) setFilterPlant("한림공장");
    }
  }, [currentProfile, isOperator, workerFullName, workerPlant, assignedProcess, isInjoo, isQualityWorker, isMyeongjae, isDongwook, isAdmin]);

  // Real-time Cloud Synchronization for Work Logs across all mobile phones & PCs
  useEffect(() => {
    const unsubscribe = subscribeWorkLogs((logs) => {
      setWorkLogs(logs);
    });
    const handleWorkLogsUpdated = (e) => {
      if (e.detail?.logs) {
        setWorkLogs(e.detail.logs);
      } else {
        setWorkLogs(getWorkLogs());
      }
    };
    window.addEventListener("oryuk_work_logs_updated", handleWorkLogsUpdated);
    return () => {
      unsubscribe();
      window.removeEventListener("oryuk_work_logs_updated", handleWorkLogsUpdated);
    };
  }, []);

  // Pending Approvals Count for General Managers
  const pendingSamrangjinCount = useMemo(() => {
    return workLogs.filter((l) => l.plant === "삼랑진공장" && l.approvalStatus === "결재대기" && !l.isDeleted).length;
  }, [workLogs]);

  const pendingHallimCount = useMemo(() => {
    return workLogs.filter((l) => l.plant === "한림공장" && l.approvalStatus === "결재대기" && !l.isDeleted).length;
  }, [workLogs]);

  // Approval Handlers (With Comment Support)
  const handleApproveLog = async (logId, customComment) => {
    const finalComment = (typeof customComment === "string" && customComment.trim())
      ? customComment.trim()
      : (approvalCommentInput.trim() || "확인 및 전자결재 승인 완료");

    const targetLog = workLogs.find((l) => String(l.id) === String(logId));
    const targetPlant = targetLog?.plant || (["김동욱", "TEST", "오상민", "정현규", "부림텍", "한울"].includes(targetLog?.writer) ? "한림공장" : (currentProfile?.plant || workerPlant));
    const approver = {
      name: currentProfile?.name || (targetPlant === "한림공장" ? "김동욱" : "이명재"),
      title: currentProfile?.title || (targetPlant === "한림공장" ? "책임" : "이사"),
      plant: currentProfile?.plant || targetPlant,
      comment: finalComment
    };

    const nowFormatted = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    const approvedLog = {
      ...(targetLog || {}),
      id: String(logId),
      plant: targetPlant,
      approvalStatus: "결재완료",
      approverName: approver.name,
      approverTitle: approver.title,
      approverPlant: targetPlant,
      approvedAt: nowFormatted,
      approvalComment: finalComment,
      updatedAt: new Date().toISOString()
    };

    // 1. Immediately update UI state in React without dropping other logs
    setWorkLogs((prev) => {
      const exists = prev.some((l) => String(l.id) === String(logId));
      if (exists) {
        return prev.map((l) => (String(l.id) === String(logId) ? approvedLog : l));
      }
      return [approvedLog, ...prev];
    });

    if (selectedLogDetail && String(selectedLogDetail.id) === String(logId)) {
      setSelectedLogDetail(approvedLog);
    }

    // 2. Persist to Firestore cloud
    try {
      await approveWorkLog(logId, approver, targetLog);
    } catch (e) {
      console.error("Cloud approval error:", e);
    }

    setToastMessage("결재 및 지시사항 코멘트가 정상적으로 등록되었습니다.");
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 3000);
  };

  const handleBatchApproveLogs = async (logIds) => {
    if (!Array.isArray(logIds) || logIds.length === 0) return;
    const nowFormatted = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    const targetIds = new Set(logIds.map(String));
    const updated = workLogs.map((l) => {
      if (targetIds.has(String(l.id))) {
        const targetPlant = l.plant || (["김동욱", "TEST", "오상민", "정현규", "부림텍", "한울"].includes(l.writer) ? "한림공장" : (currentProfile?.plant || workerPlant));
        const approverName = currentProfile?.name || (targetPlant === "한림공장" ? "김동욱" : "이명재");
        const approverTitle = currentProfile?.title || (targetPlant === "한림공장" ? "책임" : "이사");
        return {
          ...l,
          plant: targetPlant,
          approvalStatus: "결재완료",
          approverName,
          approverTitle,
          approverPlant: targetPlant,
          approvedAt: nowFormatted,
          approvalComment: `${targetPlant} 일괄 확인 및 전자결재 승인 완료`,
          updatedAt: new Date().toISOString()
        };
      }
      return l;
    });

    setWorkLogs(updated);

    try {
      await batchApproveWorkLogs(logIds, {
        name: currentProfile?.name,
        title: currentProfile?.title,
        plant: currentProfile?.plant || workerPlant
      });
    } catch (e) {
      console.error("Batch approve work logs error:", e);
    }

    setToastMessage(`선택된 ${logIds.length}건의 업무일지가 일괄 결재 승인되었습니다.`);
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 3000);
  };

  const handleRejectLog = async (logId) => {
    const reason = window.prompt("반려 사유 또는 보완 요청 사항을 입력해주세요:", "내용 보완 후 재상신 요망");
    if (!reason) return;

    const targetLog = workLogs.find((l) => String(l.id) === String(logId));
    const targetPlant = targetLog?.plant || (["김동욱", "TEST", "오상민", "정현규", "부림텍", "한울"].includes(targetLog?.writer) ? "한림공장" : (currentProfile?.plant || workerPlant));
    const approver = {
      name: currentProfile?.name || (targetPlant === "한림공장" ? "김동욱" : "이명재"),
      title: currentProfile?.title || (targetPlant === "한림공장" ? "책임" : "이사"),
      plant: currentProfile?.plant || targetPlant
    };

    const nowFormatted = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    const rejectedLog = {
      ...(targetLog || {}),
      id: String(logId),
      plant: targetPlant,
      approvalStatus: "반려",
      approverName: approver.name,
      approverTitle: approver.title,
      approverPlant: targetPlant,
      approvedAt: nowFormatted,
      approvalComment: reason,
      updatedAt: new Date().toISOString()
    };

    // 1. Immediately update UI state in React without dropping other logs
    setWorkLogs((prev) => {
      const exists = prev.some((l) => String(l.id) === String(logId));
      if (exists) {
        return prev.map((l) => (String(l.id) === String(logId) ? rejectedLog : l));
      }
      return [rejectedLog, ...prev];
    });

    if (selectedLogDetail && String(selectedLogDetail.id) === String(logId)) {
      setSelectedLogDetail(rejectedLog);
    }

    // 2. Persist to Firestore cloud
    try {
      await rejectWorkLog(logId, approver, reason, targetLog);
    } catch (e) {
      console.error("Cloud rejection error:", e);
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

  const handleDeleteLeave = async (leaveId, originLeaveId) => {
    const targetId = originLeaveId || leaveId;
    const leave = (annualLeaves || []).find((l) => l.id === targetId || l.originLeaveId === targetId || l.id === leaveId);
    if (!isAdmin && leave && leave.workerId && leave.workerId !== currentProfile?.id && leave.workerName !== currentProfile?.name) {
      alert("본인이 등록한 일정만 삭제할 수 있습니다.");
      return;
    }
    if (!window.confirm("이 일정을 영구 삭제하시겠습니까?\n(공유된 모든 작업자의 일정에서도 함께 자동 삭제됩니다)")) return;
    await deleteAnnualLeave(targetId, true);
    setToastMessage("일정이 삭제되었습니다. (공유 작업자 일정에서도 자동 삭제 완료)");
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 3000);
  };

  // -------------------------------------------------------------------------
  // 🗓️ 전작업자 공통 스마트 일정 관리 States & Handlers
  // -------------------------------------------------------------------------
  const [scheduleSelectedDate, setScheduleSelectedDate] = useState(() => getKSTDateString());
  const [scheduleLeaveType, setScheduleLeaveType] = useState("할일");
  const [scheduleReasonInput, setScheduleReasonInput] = useState("");
  const [sharedWorkers, setSharedWorkers] = useState([]); // 전작업자 선택 목록
  const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
  const shareDropdownRef = useRef(null);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [scheduleDetailModal, setScheduleDetailModal] = useState(null); // { selectedDate, dayName, filterTab: 'day'|'week'|'all' }

  // 📸 & 📁 일정 등록 사진/파일 첨부 State & Handlers
  const [scheduleAttachedFiles, setScheduleAttachedFiles] = useState([]); // [{ id, name, size, dataUrl, fileType: 'image'|'file' }]
  const [isProcessingScheduleFiles, setIsProcessingScheduleFiles] = useState(false);
  const scheduleCameraInputRef = useRef(null);
  const scheduleFileInputRef = useRef(null);

  const handleScheduleFiles = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (scheduleAttachedFiles.length >= 10) {
      alert("일정 첨부 파일은 최대 10개까지 등록 가능합니다.");
      return;
    }

    const remainingSlots = 10 - scheduleAttachedFiles.length;
    const filesToProcess = Array.from(selectedFiles).slice(0, remainingSlots);

    setIsProcessingScheduleFiles(true);
    try {
      const processedList = [];
      for (const file of filesToProcess) {
        if (file.type.startsWith("image/")) {
          // 사진 압축 (카메라 촬영 / 앨범 사진)
          const compressed = await compressImage(file, 1200, 1200, 0.75);
          processedList.push({
            id: compressed.id,
            name: compressed.name || file.name,
            size: compressed.size,
            dataUrl: compressed.dataUrl,
            fileType: "image"
          });
        } else {
          // 문서 및 일반 파일 (PDF, Excel, Word 등)
          const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          processedList.push({
            id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            size: (file.size / 1024).toFixed(1) + " KB",
            dataUrl: base64Data,
            fileType: "file"
          });
        }
      }

      setScheduleAttachedFiles((prev) => [...prev, ...processedList].slice(0, 10));
    } catch (err) {
      console.error("일정 첨부파일 처리 오류:", err);
      alert("파일을 처리하는 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsProcessingScheduleFiles(false);
      e.target.value = "";
    }
  };

  const handleRemoveScheduleFile = (idx) => {
    setScheduleAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // 💬 공유 일정 답장(회신) 및 확인 모달 States
  const [sharedReplyModalItem, setSharedReplyModalItem] = useState(null); // 받은 작업자 답장 모달
  const [replyTextInput, setReplyTextInput] = useState("확인했습니다 👍");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const [sharedSenderConfirmModalItem, setSharedSenderConfirmModalItem] = useState(null); // 보낸 작업자 회신확인 모달
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

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

        const regDate = l.createdAt ? formatKSTDate(l.createdAt) : (l.createdDate || l.startDate || "");
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
      setToastMessage("일정이 완료되었습니다. (완료 탭에서 확인 가능)");
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
    } catch (err) {
      alert("일정 완료 처리 중 오류: " + err.message);
    }
  };

  const handleReactivateLeave = async (item) => {
    if (!item) return;
    try {
      await reactivateAnnualLeave(item.id);
      setToastMessage(`[${item.leaveType}] 일정을 다시 '진행중'으로 복구하였습니다.`);
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
    } catch (err) {
      alert("일정 복구 중 오류 발생: " + err.message);
    }
  };

  // 💬 공유 일정 삭제/완료 요청 통합 핸들러
  const handleRequestDismissOrDelete = (item, actionType = "dismiss") => {
    if (!item) return;

    // 1. 공유받은 일정인 경우 (받은 작업자는 보낸 작업자에게 답장을 보내거나 직접 삭제 가능)
    if (item.isSharedRecipient || item.sharedBy) {
      if (actionType === "direct_delete" || actionType === "delete") {
        handleDeleteLeave(item.id);
        return;
      }
      setReplyTextInput("확인했습니다 👍");
      setSharedReplyModalItem(item);
      return;
    }

    // 2. 작성자(보낸 사람)인 경우: X 버튼 또는 삭제 시 공유된 대상자들의 일정까지 모두 자동 삭제
    handleDeleteLeave(item.id, item.originLeaveId);
  };

  // 💬 받은 작업자: 답장 전송 및 내 일정 삭제/완료 처리
  const handleSendSharedReply = async () => {
    if (!sharedReplyModalItem) return;
    if (!replyTextInput.trim()) {
      alert("보낸 작업자에게 전달할 답장 내용을 입력해주세요.");
      return;
    }
    setReplySubmitting(true);
    try {
      await replyToSharedLeave(sharedReplyModalItem.id, replyTextInput.trim(), currentProfile);
      setToastMessage(
        `💬 [${sharedReplyModalItem.sharedBy || "보낸작업자"}]님에게 답장을 전송하고 내 일정에서 완전 삭제하였습니다.`
      );
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3500);
      setSharedReplyModalItem(null);
      setReplyTextInput("");
    } catch (err) {
      alert("답장 전송 중 오류 발생: " + err.message);
    } finally {
      setReplySubmitting(false);
    }
  };

  // ✓ 보낸 작업자: 회신 확인 완료 및 최종 삭제/완료 처리 (공유 작업자 일정에서도 자동 삭제)
  const handleConfirmSenderDismiss = async (actionType = "delete") => {
    if (!sharedSenderConfirmModalItem) return;
    setConfirmSubmitting(true);
    try {
      await confirmSharedLeaveReplies(sharedSenderConfirmModalItem.id, currentProfile, "delete");
      setToastMessage("공유 일정이 삭제되었습니다. (공유 작업자 일정에서도 자동 삭제 완료)");
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3500);
      setSharedSenderConfirmModalItem(null);
    } catch (err) {
      alert("일정 처리 중 오류 발생: " + err.message);
    } finally {
      setConfirmSubmitting(false);
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

      // 진행중인 일정을 우선 노출하고, 완료된 일정은 뒤로 정렬
      dayEvents.sort((a, b) => {
        const aDone = a.isCompleted || a.isDismissed ? 1 : 0;
        const bDone = b.isCompleted || b.isDismissed ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return (a.startDate || "").localeCompare(b.startDate || "");
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
      const originLeaveId = `leave_${Date.now()}_${myId}`;

      const sharedWithDetails = (sharedWorkers || []).map((w) => ({
        id: w.id,
        name: w.name,
        plant: w.plant || myPlant,
        title: w.title || "선임",
        status: "PENDING",
        replyText: "",
        replyAt: null
      }));

      // 첨부된 사진/파일 데이터 복사
      const attachedFiles = [...scheduleAttachedFiles];
      const attachedImages = attachedFiles.filter(
        (f) => f.fileType === "image" || f.dataUrl?.startsWith("data:image")
      );

      // 1. 현재 로그인한 작업자(보낸이) 원본 일정 등록
      const newLeave = {
        id: originLeaveId,
        originLeaveId: originLeaveId,
        userId: myId,
        userName: myName,
        plant: myPlant,
        title: myTitle,
        startDate: scheduleSelectedDate,
        endDate: scheduleSelectedDate,
        leaveType: scheduleLeaveType,
        reason: baseReason,
        sharedWith: sharedWorkers.map((w) => w.name),
        sharedWithDetails: sharedWithDetails,
        replies: [],
        files: attachedFiles,
        images: attachedImages,
        isSharedOrigin: sharedWorkers.length > 0,
        hasNewReply: false,
        createdAt: nowIso,
        createdDate: todayDateStr,
        isCompleted: false,
        isDismissed: false
      };
      await saveAnnualLeave(newLeave);

      // 2. 선택된 공유작업자(받은이) 각각의 일정 등록
      if (sharedWorkers.length > 0) {
        for (let i = 0; i < sharedWorkers.length; i++) {
          const sw = sharedWorkers[i];
          const sharedLeave = {
            id: `leave_${Date.now()}_${sw.id}_${i}`,
            originLeaveId: originLeaveId,
            userId: sw.id,
            userName: sw.name,
            plant: sw.plant || myPlant,
            title: sw.title || "선임",
            startDate: scheduleSelectedDate,
            endDate: scheduleSelectedDate,
            leaveType: scheduleLeaveType,
            reason: `${baseReason} (${myName} 공유)`,
            sharedBy: myName,
            sharedById: myId,
            sharedByPlant: myPlant,
            sharedByTitle: myTitle,
            isSharedRecipient: true,
            replyStatus: "PENDING",
            replyText: "",
            replyAt: null,
            files: attachedFiles,
            images: attachedImages,
            createdAt: nowIso,
            createdDate: todayDateStr,
            isCompleted: false,
            isDismissed: false
          };
          await saveAnnualLeave(sharedLeave);
        }
      }

      const shareNames = sharedWorkers.map((w) => w.name).join(", ");
      const attachCountMsg = attachedFiles.length > 0 ? ` (사진/파일 ${attachedFiles.length}개 첨부)` : "";
      setToastMessage(
        `[${myName} ${myTitle}] ${scheduleSelectedDate} ${scheduleLeaveType} 일정이 등록되었습니다.${
          shareNames ? ` (공유 작업자: ${shareNames} 자동 등록)` : ""
        }${attachCountMsg}`
      );
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3500);
      setScheduleReasonInput("");
      setSharedWorkers([]);
      setScheduleAttachedFiles([]);
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
  useModalHistory(commonScheduleModalOpen, () => setCommonScheduleModalOpen(false), "workerDashboardCommonScheduleModal");
  const [commonScheduleArchive, setCommonScheduleArchive] = useState([]);
  const [selectedCommonScheduleForComments, setSelectedCommonScheduleForComments] = useState(null);
  const [commonScheduleCommentInput, setCommonScheduleCommentInput] = useState("");
  const [commonScheduleCommentSubmitting, setCommonScheduleCommentSubmitting] = useState(false);
  const [dailyPnLModalOpen, setDailyPnLModalOpen] = useState(false);
  useModalHistory(dailyPnLModalOpen, () => setDailyPnLModalOpen(false), "workerDashboardDailyPnLModal");
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

  // 🔒 본사 ADMIN 작성 일정 일반 관리자/작업자 노출 방지 필터 헬퍼
  const isScheduleVisibleToUser = (schedule, profile) => {
    if (!schedule) return false;
    if (isUserAdminOrHeadquarter(profile)) return true;

    // 🔒 [철칙] ADMIN에서 작성된 내용은 타 일반 관리자/작업자에게 절대 공유/노출 금지
    if (isScheduleAdminRestricted(schedule)) return false;

    // 공장별 타겟 분리
    const userPlant = String(profile?.plant || "").trim();
    const target = String(schedule.target || "").trim();
    if (userPlant === "삼랑진공장" && target.includes("한림")) return false;
    if (userPlant === "한림공장" && target.includes("삼랑진")) return false;

    return true;
  };

  const allActiveCommonSchedules = useMemo(() => {
    if (!commonSchedules || !Array.isArray(commonSchedules)) return [];
    const now = Date.now();
    const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

    return commonSchedules
      .filter((s) => !s.isCompleted && (s.endDate || s.startDate || s.date) >= todayDateStr && isScheduleVisibleToUser(s, currentProfile))
      .map((s) => {
        const comments = Array.isArray(s.comments) ? s.comments : [];
        const isRecentItem = s.createdAt && (now - new Date(s.createdAt).getTime()) < TWO_DAYS_MS;
        const latestComment = comments.length > 0 ? comments[comments.length - 1] : null;
        const isRecentComment = latestComment && latestComment.createdAt && (now - new Date(latestComment.createdAt).getTime()) < TWO_DAYS_MS;
        const hasNewMessage = Boolean(isRecentItem || isRecentComment || comments.length > 0);

        return {
          ...s,
          hasNewMessage,
          isRecent: isRecentItem
        };
      })
      .sort((a, b) => {
        if (a.hasNewMessage && !b.hasNewMessage) return -1;
        if (!a.hasNewMessage && b.hasNewMessage) return 1;
        const aStart = a.startDate || a.date || "";
        const bStart = b.startDate || b.date || "";
        if (aStart !== bStart) return aStart.localeCompare(bStart);
        const aEnd = a.endDate || aStart;
        const bEnd = b.endDate || bStart;
        if (aEnd !== bEnd) return aEnd.localeCompare(bEnd);
        return (a.time || "").localeCompare(b.time || "");
      });
  }, [commonSchedules, todayDateStr, currentProfile]);

  const hasNewScheduleMessage = useMemo(() => {
    return (allActiveCommonSchedules || []).some((item) => item.hasNewMessage);
  }, [allActiveCommonSchedules]);

  const uncompletedCommonSchedules = useMemo(() => {
    if (!commonSchedules || !Array.isArray(commonSchedules)) return [];
    return commonSchedules
      .filter((s) => !s.isCompleted && isScheduleVisibleToUser(s, currentProfile))
      .sort((a, b) => {
        const aStart = a.startDate || a.date || "";
        const bStart = b.startDate || b.date || "";
        if (aStart !== bStart) return aStart.localeCompare(bStart);
        const aEnd = a.endDate || aStart;
        const bEnd = b.endDate || bStart;
        if (aEnd !== bEnd) return aEnd.localeCompare(bEnd);
        return (a.time || "").localeCompare(b.time || "");
      });
  }, [commonSchedules, currentProfile]);

  const todayCommonSchedules = useMemo(() => {
    if (!commonSchedules || !Array.isArray(commonSchedules)) return [];
    return commonSchedules.filter((s) => {
      if (s.isCompleted || !isScheduleVisibleToUser(s, currentProfile)) return false;
      const regDate = s.createdAt ? formatKSTDate(s.createdAt) : (s.startDate || s.date);
      const startDate = s.startDate || s.date;
      const endDate = s.endDate || startDate;
      const effectiveStart = regDate <= startDate ? regDate : startDate;
      return Boolean(effectiveStart && endDate && effectiveStart <= todayDateStr && todayDateStr <= endDate);
    });
  }, [commonSchedules, todayDateStr, currentProfile]);

  const scheduleCounts = useMemo(() => {
    const active = (commonSchedules || []).filter((s) => !isScheduleExpired(s) && !s.isCompleted && isScheduleVisibleToUser(s, currentProfile)).length;
    const archive = (commonScheduleArchive || []).filter((s) => isScheduleVisibleToUser(s, currentProfile)).length;
    return { all: active + archive, active, archive };
  }, [commonSchedules, commonScheduleArchive, currentProfile]);

  const modalFilteredSchedules = useMemo(() => {
    if (commonScheduleFilterTab === "archive") {
      return [...(commonScheduleArchive || [])]
        .filter((s) => isScheduleVisibleToUser(s, currentProfile))
        .sort((a, b) => new Date(b.archivedAt || 0) - new Date(a.archivedAt || 0));
    }
    // Default: active non-expired schedules
    return (commonSchedules || [])
      .filter((s) => !isScheduleExpired(s) && !s.isCompleted && isScheduleVisibleToUser(s, currentProfile))
      .sort((a, b) => {
        const aDate = a.startDate || a.date || "";
        const bDate = b.startDate || b.date || "";
        if (aDate !== bDate) return aDate.localeCompare(bDate);
        return (a.time || "").localeCompare(b.time || "");
      });
  }, [commonSchedules, commonScheduleArchive, commonScheduleFilterTab, currentProfile]);

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
    const item = (commonSchedules || []).find((s) => s.id === id);
    if (!isAdmin && item && item.author !== currentProfile?.name && item.userName !== currentProfile?.name) {
      alert("사내 공통일정은 관리자 또는 본인이 등록한 일정만 삭제할 수 있습니다.");
      return;
    }
    const title = item?.title ? `"${item.title}" ` : "";
    if (!window.confirm(`${title}일정을 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`)) return;
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

  const safeSelectedMonth = selectedMonth || "2026-09";
  const monthParts = safeSelectedMonth.split("-");
  const monthTitle = `${monthParts[0] || "2026"}년 ${monthParts[1] || "09"}월`;

  const totalSales = currentMonthData?.salesSummary?.totalSales || currentMonthData?.totalSales || 0;
  const totalPurchases =
    currentMonthData?.purchaseSummary?.ledgerBenchmark ||
    currentMonthData?.purchaseSummary?.totalExpenses ||
    currentMonthData?.jajaeSummary?.totalAmount ||
    currentMonthData?.totalExpenses ||
    0;
  const purchaseRatio = totalSales > 0 ? ((totalPurchases / totalSales) * 100).toFixed(1) : "0.0";

  // PnL Achievement calculations for Morning Briefing
  const prevMonthKey = useMemo(() => {
    if (!safeSelectedMonth) return "2026-08";
    const [y, m] = safeSelectedMonth.split("-").map(Number);
    const prevD = new Date(y || 2026, (m || 9) - 2, 1);
    const prevY = prevD.getFullYear();
    const prevM = String(prevD.getMonth() + 1).padStart(2, "0");
    return `${prevY}-${prevM}`;
  }, [safeSelectedMonth]);

  const prevMonthData = useMemo(() => {
    return allMonthlyData?.[prevMonthKey] || null;
  }, [allMonthlyData, prevMonthKey]);

  const prevSales = prevMonthData?.salesSummary?.totalSales || prevMonthData?.totalSales || 0;
  const prevPurchases =
    prevMonthData?.purchaseSummary?.ledgerBenchmark ||
    prevMonthData?.purchaseSummary?.totalExpenses ||
    prevMonthData?.jajaeSummary?.totalAmount ||
    prevMonthData?.totalExpenses ||
    0;

  const salesAchievementPct = prevSales > 0 ? ((totalSales / prevSales) * 100).toFixed(1) : "100.0";
  const purchaseAchievementPct = prevPurchases > 0 ? ((totalPurchases / prevPurchases) * 100).toFixed(1) : "100.0";

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

  // Changyeop Quality Files Handler
  const handleQualityFiles = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setQualityRawFiles(fileList);
    setQualityParsing(true);
    setQualityUploadSuccess(false);
    setQualitySuccessMessage("");

    setTimeout(() => {
      setQualityFiles(fileList.map((f, idx) => ({
        id: idx + 1,
        name: f.name,
        size: (f.size / 1024).toFixed(1) + " KB",
        type: f.name.includes("불량") ? "불량유형 분석 데이터" : f.name.includes("정리") ? "최종검사 정리 데이터" : "품질 검사실적 데이터"
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
        if (records && records.length > 0) {
          await saveQualityRecordsBatch(records);
          if (yearMonth && changeMonth && yearMonth !== selectedMonth) {
            changeMonth(yearMonth);
          }
          setQualitySuccessMessage(`품질 엑셀 ${qualityFiles.length}개 파일에서 총 ${count}건의 일자별 실적이 중복 없이 데이터베이스에 성공적으로 반영되었습니다!`);
          setQualityUploadSuccess(true);
        } else {
          setQualitySuccessMessage("선택하신 엑셀 파일에서 품질 실적 데이터를 찾지 못했습니다. 파일 서식을 확인해 주세요.");
          setQualityUploadSuccess(false);
          alert("선택하신 엑셀 파일에서 유효한 품질 실적 데이터를 찾지 못했습니다. 파일 서식을 확인해 주세요.");
        }
      } else {
        setQualitySuccessMessage("업로드할 파일이 없습니다.");
        setQualityUploadSuccess(false);
      }
    } catch (err) {
      console.error("Quality upload error:", err);
      setQualitySuccessMessage("엑셀 파일 파싱 및 저장 중 오류가 발생했습니다: " + (err.message || ""));
      setQualityUploadSuccess(false);
      alert("품질 엑셀 저장 중 오류 발생: " + (err.message || "파일 형식을 확인해 주세요."));
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
      const result = await parseExcelFile(file, selectedMonth);
      setParsedResult({
        file,
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + " KB",
        ...result
      });
    } catch (err) {
      console.error("Excel parse error:", err);
      alert("엑셀 파일 파싱 오류: " + (err.message || "파일 형식을 확인해 주세요."));
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
      const targetYM = parsedResult.yearMonth || selectedMonth || currentYearMonth || "2026-09";
      await uploadMonthlyData(targetYM, parsedResult, {
        fileName: parsedResult.fileName,
        uploadedBy: `${workerFullName} (${workerPlant})`,
        fileSize: parsedResult.fileSize
      });
      if (onBulkUpload && parsedResult.items && parsedResult.items.length > 0) {
        try {
          await onBulkUpload(parsedResult.items);
        } catch (e) {
          console.warn("Bulk upload secondary sync warning:", e);
        }
      }
      setUploadSuccess(true);
      setSuccessMessage(`${targetYM} 최신 파일(${parsedResult.fileName}) 기준으로 데이터가 갱신되었습니다. (이전 파일 대체 완료)`);
    } catch (err) {
      console.error("Excel upload error:", err);
      alert("업로드 중 오류 발생: " + (err.message || "저장 중 오류가 발생했습니다."));
    } finally {
      setUploading(false);
    }
  };

  // Save work log (Cloud Firestore + Local)
  const handleSaveLog = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSavingLog) return;
    setIsSavingLog(true);

    try {
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

        const allImagesBefore = filledItems.flatMap((it) => it.imagesBefore || []);
        const allImagesAfter = filledItems.flatMap((it) => it.imagesAfter || []);
        const allImages = [...allImagesBefore, ...allImagesAfter];

        const newLog = {
          id: String(Date.now()),
          date: formData.date || getKSTDateString(),
          plant: formData.plant || workerPlant || "삼랑진공장",
          writer: currentProfile?.name || workerFullName || "작업자",
          title: officialTitle || "선임",
          process: "설비보전",
          shift: formData.shift || "주간",
          line: lineSummary || "설비보전 점검",
          workContent: formattedContent,
          maintenanceItems: filledItems.map((it) => ({
            category: it.category,
            equipmentName: (it.equipmentName === "내용직접입력" || it.equipmentName === "직접입력" || it.equipmentName === "내용입력 (직접입력)")
              ? (it.customEquipmentName?.trim() || "직접입력")
              : it.equipmentName,
            content: it.content.trim(),
            imagesBefore: Array.isArray(it.imagesBefore) ? it.imagesBefore : [],
            imagesAfter: Array.isArray(it.imagesAfter) ? it.imagesAfter : []
          })),
          issues: "-",
          imagesBefore: allImagesBefore,
          imagesAfter: allImagesAfter,
          images: allImages.length > 0 ? allImages : (formData.images || []),
          status: "완료",
          createdAt: new Date().toLocaleString("ko-KR", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          })
        };

        const updatedList = await saveWorkLog(newLog);
        if (Array.isArray(updatedList)) {
          setWorkLogs(updatedList);
        }

        setMaintenanceItems([
          {
            id: 1,
            category: "압출기",
            equipmentName: "PCM 1호",
            customEquipmentName: "",
            content: "",
            imagesBefore: [],
            imagesAfter: []
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

      if (!formData.workContent || !formData.workContent.trim()) {
        alert("작업 내용을 입력해 주세요.");
        return;
      }

      let finalIssues = formData.issues?.trim() || "";
      if (formData.defectType && formData.defectType !== "[직접입력] 기타부적합" && !finalIssues.includes(formData.defectType)) {
        finalIssues = finalIssues ? `${formData.defectType} ${finalIssues}` : formData.defectType;
      }
      if (!finalIssues) finalIssues = "-";

      const isWriterAdmin = isAdmin || currentProfile?.name === "권태형" || currentProfile?.name === "최미영" || currentProfile?.role === "ADMIN";
      const nowFormatted = new Date().toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });

      const targetPlant = formData.plant || (isWriterAdmin ? "본사" : workerPlant) || "삼랑진공장";
      const isGM = isMyeongjae || isDongwook || currentProfile?.assignedProcess === "총괄관리";

      const newLog = {
        id: String(Date.now()),
        date: formData.date || getKSTDateString(),
        plant: targetPlant,
        writer: currentProfile?.name || workerFullName || "작업자",
        title: officialTitle || workerPosition || "선임",
        department: workerDept,
        process: isInjoo
          ? "경리업무"
          : isQualityWorker
          ? "품질관리"
          : isWriterAdmin
          ? "총괄경영관리"
          : isGM
          ? "총괄관리"
          : (formData.process || assignedProcess || "가공동 관리"),
        shift: formData.shift || "주간",
        line: isInjoo
          ? "본사/현장 정산 및 전표 마감"
          : isQualityWorker
          ? (formData.line || "전라인 품질 검사 및 불량 분석")
          : isWriterAdmin
          ? "본사 총괄 경영 및 운영 관리"
          : isGM
          ? `${targetPlant} 총괄 운영 관리`
          : (formData.line || "생산 라인"),
        workContent: formData.workContent,
        defectType: formData.defectType || "",
        issues: finalIssues,
        images: formData.images || [...(formData.imagesBefore || []), ...(formData.imagesAfter || [])],
        imagesBefore: formData.imagesBefore || [],
        imagesAfter: formData.imagesAfter || [],
        status: "완료",
        approvalStatus: isWriterAdmin ? "결재완료" : "결재대기",
        approverName: isWriterAdmin ? (currentProfile?.name || "권태형") : undefined,
        approverTitle: isWriterAdmin ? (officialTitle || (currentProfile?.name === "최미영" ? "전무" : "대표이사")) : undefined,
        approverPlant: isWriterAdmin ? "본사" : undefined,
        approvedAt: isWriterAdmin ? nowFormatted : undefined,
        approvalComment: isWriterAdmin ? "대표이사 전결 승인 완료" : "",
        createdAt: new Date().toLocaleString("ko-KR", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })
      };

      const updatedList = await saveWorkLog(newLog);
      if (Array.isArray(updatedList)) {
        setWorkLogs(updatedList);
      }

      setFormData((prev) => ({
        ...prev,
        workContent: "",
        defectType: "",
        issues: "",
        images: [],
        imagesBefore: [],
        imagesAfter: []
      }));

      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Work log save error:", err);
      alert("업무일지 저장 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsSavingLog(false);
    }
  };

  const handleDeleteLog = async (id) => {
    const log = (workLogs || []).find((l) => String(l.id) === String(id));
    if (log && isWorkLogApproved(log)) {
      alert("이미 관리자 승인(결재)이 완료된 업무일보는 삭제할 수 없습니다.");
      return;
    }
    if (!isAdmin && log && log.workerName !== currentProfile?.name && log.writer !== currentProfile?.name) {
      alert("본인이 작성한 업무일지만 삭제할 수 있습니다.");
      return;
    }
    if (!window.confirm("이 업무일지를 영구 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.")) return;
    await deleteWorkLog(id);
    setToastMessage("업무일지가 삭제되었습니다.");
    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 3000);
  };

  // ✏️ Open Work Log Edit Modal (Only allowed before approval, or by Admin)
  const handleOpenEditModal = (log) => {
    if (!log) return;
    if (isWorkLogApproved(log) && !isAdmin) {
      alert("결재가 완료된 업무일지는 내용을 수정할 수 없습니다.");
      return;
    }
    pushModalHistory("worklog_edit");
    setEditingLog(log);
    let defectType = log.defectType || "";
    let cleanIssues = log.issues === "-" ? "" : (log.issues || "");
    if (!defectType && cleanIssues) {
      for (const grp of DEFECT_TYPE_GROUPS) {
        for (const it of grp.items) {
          if (cleanIssues.startsWith(it.value)) {
            defectType = it.value;
            cleanIssues = cleanIssues.replace(it.value, "").trim();
            break;
          }
        }
        if (defectType) break;
      }
    }

    setEditFormData({
      id: log.id,
      date: log.date || getKSTDateString(),
      plant: log.plant || "삼랑진공장",
      writer: log.writer || "",
      title: log.title || "",
      process: log.process || "",
      shift: log.shift || "주간",
      line: log.line || "",
      workContent: log.workContent || "",
      defectType: defectType,
      issues: cleanIssues,
      images: Array.isArray(log.images) ? [...log.images] : [],
      imagesBefore: Array.isArray(log.imagesBefore) ? [...log.imagesBefore] : [],
      imagesAfter: Array.isArray(log.imagesAfter) ? [...log.imagesAfter] : []
    });

    const isJaeyulLog = log.process === "설비보전" || log.writer === "전재율" || (log.line && log.line.includes("설비보전")) || isJaeyul;
    if (Array.isArray(log.maintenanceItems) && log.maintenanceItems.length > 0) {
      setEditMaintenanceItems(
        log.maintenanceItems.map((it, idx) => {
          const category = it.category || "압출기";
          const standardList = JAEYUL_CATEGORY_EQUIPMENT_MAP[category] || JAEYUL_EQUIPMENT_OPTIONS;
          const isStandard = standardList.includes(it.equipmentName) && it.equipmentName !== "내용직접입력" && it.equipmentName !== "직접입력" && it.equipmentName !== "내용입력 (직접입력)";
          return {
            id: it.id || Date.now() + idx,
            category: category,
            equipmentName: isStandard ? it.equipmentName : "내용직접입력",
            customEquipmentName: isStandard ? "" : (it.customEquipmentName || it.equipmentName || ""),
            content: it.content || it.workContent || "",
            imagesBefore: Array.isArray(it.imagesBefore) ? [...it.imagesBefore] : [],
            imagesAfter: Array.isArray(it.imagesAfter) ? [...it.imagesAfter] : []
          };
        })
      );
    } else if (isJaeyulLog) {
      setEditMaintenanceItems([
        {
          id: 1,
          category: "압출기",
          equipmentName: "PCM 1호",
          customEquipmentName: "",
          content: log.workContent || "",
          imagesBefore: Array.isArray(log.imagesBefore) ? [...log.imagesBefore] : [],
          imagesAfter: Array.isArray(log.imagesAfter) ? [...log.imagesAfter] : []
        }
      ]);
    } else {
      setEditMaintenanceItems([]);
    }
  };

  const handleEditLogImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    const currentImages = editFormData.images || [];
    if (currentImages.length >= 5) {
      alert("현장 사진은 최대 5장까지 첨부할 수 있습니다.");
      return;
    }
    const remainingSlots = 5 - currentImages.length;
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, remainingSlots);
    if (validFiles.length === 0) return;

    setIsEditProcessingImages(true);
    try {
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setEditFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...processed].slice(0, 5)
      }));
    } catch (err) {
      console.error("사진 처리 오류:", err);
      alert("사진을 불러오거나 압축하는 중 오류가 발생했습니다.");
    } finally {
      setIsEditProcessingImages(false);
    }
  };

  const handleRemoveEditLogImage = (idx) => {
    setEditFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== idx)
    }));
  };

  const handleAddEditMaintenanceItem = () => {
    setEditMaintenanceItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        category: "압출기",
        equipmentName: "PCM 1호",
        customEquipmentName: "",
        content: "",
        imagesBefore: [],
        imagesAfter: []
      }
    ]);
  };

  const handleRemoveEditMaintenanceItem = (id) => {
    if (editMaintenanceItems.length <= 1) {
      alert("최소 1개 이상의 설비보전 항목이 필요합니다.");
      return;
    }
    setEditMaintenanceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateEditMaintenanceItem = (id, field, value) => {
    setEditMaintenanceItems((prev) =>
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

  // 📷 [전재율 책임 전용] 수정 모달 항목별 개선전 / 개선후 사진 첨부 (최대 3장씩)
  const handleEditMaintenanceItemImageFiles = async (itemId, files, type = "before") => {
    if (!files || files.length === 0) return;
    const targetItem = editMaintenanceItems.find((it) => it.id === itemId);
    if (!targetItem) return;
    const key = type === "before" ? "imagesBefore" : "imagesAfter";
    const currentImgs = targetItem[key] || [];
    if (currentImgs.length >= 3) {
      alert(`${type === "before" ? "개선 전" : "개선 후"} 사진은 항목당 최대 3장까지 등록 가능합니다.`);
      return;
    }
    const remainingSlots = 3 - currentImgs.length;
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, remainingSlots);
    if (validFiles.length === 0) return;

    setIsEditProcessingImages(true);
    try {
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setEditMaintenanceItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            [key]: [...(item[key] || []), ...processed].slice(0, 3)
          };
        })
      );
    } catch (err) {
      console.error("사진 처리 오류:", err);
      alert("사진을 불러오거나 압축하는 중 오류가 발생했습니다.");
    } finally {
      setIsEditProcessingImages(false);
    }
  };

  const handleRemoveEditMaintenanceItemImage = (itemId, imgIdx, type = "before") => {
    const key = type === "before" ? "imagesBefore" : "imagesAfter";
    setEditMaintenanceItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          [key]: (item[key] || []).filter((_, i) => i !== imgIdx)
        };
      })
    );
  };

  const handleSaveEditedLog = async (e) => {
    if (e) e.preventDefault();
    if (!editingLog) return;

    if (isWorkLogApproved(editingLog) && !isAdmin) {
      alert("결재가 완료된 업무일지는 수정할 수 없습니다.");
      return;
    }

    let formattedWorkContent = editFormData.workContent;
    let lineSummary = editFormData.line;
    let formattedItems = [];

    const isJaeyulLog =
      editFormData.process === "설비보전" ||
      editingLog.process === "설비보전" ||
      editingLog.writer === "전재율" ||
      editMaintenanceItems.length > 0;

    if (isJaeyulLog && editMaintenanceItems.length > 0) {
      formattedItems = editMaintenanceItems
        .filter((it) => it.content && it.content.trim())
        .map((it) => {
          const isCustom =
            it.equipmentName === "내용직접입력" ||
            it.equipmentName === "직접입력" ||
            it.equipmentName === "내용입력 (직접입력)" ||
            !JAEYUL_CATEGORY_EQUIPMENT_MAP[it.category]?.includes(it.equipmentName);
          const finalEqName = isCustom ? (it.customEquipmentName?.trim() || "직접입력") : it.equipmentName;
          return {
            id: it.id,
            category: it.category || "기타",
            equipmentName: finalEqName,
            customEquipmentName: isCustom ? (it.customEquipmentName?.trim() || "") : "",
            content: it.content.trim(),
            imagesBefore: Array.isArray(it.imagesBefore) ? it.imagesBefore : [],
            imagesAfter: Array.isArray(it.imagesAfter) ? it.imagesAfter : []
          };
        });

      if (formattedItems.length > 0) {
        formattedWorkContent = formattedItems
          .map((it, idx) => `[${idx + 1}] ${it.category} > ${it.equipmentName}\n• 설비보전내용: ${it.content}`)
          .join("\n\n");

        lineSummary = formattedItems
          .map((it) => `${it.category}(${it.equipmentName})`)
          .join(", ");
      }
    }

    if (!formattedWorkContent || !formattedWorkContent.trim()) {
      alert("작업 내용을 입력해 주세요.");
      return;
    }

    let finalEditIssues = editFormData.issues?.trim() || "";
    if (editFormData.defectType && editFormData.defectType !== "[직접입력] 기타부적합" && !finalEditIssues.includes(editFormData.defectType)) {
      finalEditIssues = finalEditIssues ? `${editFormData.defectType} ${finalEditIssues}` : editFormData.defectType;
    }

    try {
      const allEditBefore = formattedItems.flatMap((it) => it.imagesBefore || []);
      const allEditAfter = formattedItems.flatMap((it) => it.imagesAfter || []);
      const allEditImages = [...allEditBefore, ...allEditAfter];

      const updatedFields = {
        date: editFormData.date,
        plant: editFormData.plant,
        shift: editFormData.shift,
        line: lineSummary || editFormData.line,
        workContent: formattedWorkContent,
        defectType: editFormData.defectType || "",
        issues: finalEditIssues === "" ? "-" : finalEditIssues,
        images: allEditImages.length > 0 ? allEditImages : (editFormData.images || []),
        imagesBefore: allEditBefore.length > 0 ? allEditBefore : (editFormData.imagesBefore || []),
        imagesAfter: allEditAfter.length > 0 ? allEditAfter : (editFormData.imagesAfter || []),
        maintenanceItems: formattedItems.length > 0 ? formattedItems : (editingLog.maintenanceItems || []),
        approvalStatus: editingLog.approvalStatus === "반려" ? "결재대기" : (editingLog.approvalStatus || "결재대기"),
        _forceAdminEdit: isAdmin
      };

      const targetLogId = editingLog.id || editFormData.id;
      const updatedList = await updateWorkLog(targetLogId, updatedFields, editingLog);
      setWorkLogs(updatedList);

      if (selectedLogDetail && String(selectedLogDetail.id) === String(targetLogId)) {
        setSelectedLogDetail(updatedList.find((l) => String(l.id) === String(targetLogId)) || null);
      }

      setEditingLog(null);
      setToastMessage("업무일지 내용이 성공적으로 수정되었습니다.");
      setLogSavedToast(true);
      setTimeout(() => setLogSavedToast(false), 3000);
    } catch (err) {
      alert("업무일지 수정 중 오류: " + err.message);
    }
  };

  const filteredLogs = useMemo(() => {
    const term = (searchTerm || "").trim().toLowerCase();
    return (workLogs || [])
      .filter((log) => {
        if (!log || typeof log !== "object") return false;
        const writerWithTitle = `${log.writer || ""} ${log.title || ""} ${log.process || ""}`.toLowerCase();
        const content = String(log.workContent || "").toLowerCase();
        const line = String(log.line || "").toLowerCase();
        const issues = String(log.issues || "").toLowerCase();

        const matchSearch =
          !term ||
          writerWithTitle.includes(term) ||
          content.includes(term) ||
          line.includes(term) ||
          issues.includes(term);

        const logPlant = log.plant || log.approverPlant || (["김동욱", "TEST", "오상민", "정현규", "부림텍", "한울"].includes(log.writer) ? "한림공장" : (["권태형", "최미영"].includes(log.writer) || log.department === "본사 관리팀" ? "본사" : "삼랑진공장"));

        const matchPlant =
          filterPlant === "all" ||
          logPlant === filterPlant ||
          (filterPlant === "한림공장" && (logPlant.includes("한림") || logPlant === "한림")) ||
          (filterPlant === "삼랑진공장" && (logPlant.includes("삼랑진") || logPlant === "삼랑진")) ||
          (filterPlant === "본사" && (logPlant.includes("본사") || logPlant === "본사"));

        return matchSearch && matchPlant;
      })
      .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || "").localeCompare(a.createdAt || "") || String(b.id || "").localeCompare(String(a.id || "")));
  }, [workLogs, searchTerm, filterPlant]);

  // Reset pagination when search or plant filter changes
  useEffect(() => {
    setCurrentLogPage(1);
  }, [searchTerm, filterPlant]);

  const totalLogPages = useMemo(() => {
    return Math.ceil(filteredLogs.length / LOGS_PER_PAGE) || 1;
  }, [filteredLogs.length]);

  const safeLogPage = Math.min(Math.max(1, currentLogPage), totalLogPages);

  const paginatedLogs = useMemo(() => {
    const startIdx = (safeLogPage - 1) * LOGS_PER_PAGE;
    return filteredLogs.slice(startIdx, startIdx + LOGS_PER_PAGE);
  }, [filteredLogs, safeLogPage]);

  // 🌟 압출동 일반 현장작업자 로그인 시: 중대재해공유판 + 설유철 품질이슈 공유판 + 사내공지(종료일 유효한 경우만) 표시 (설유철 책임은 관리자이므로 제외)
  const isExtrusionOperatorWorker =
    isExtrusionWorkerProfile(currentProfile) &&
    currentProfile?.name !== "설유철" &&
    currentProfile?.id !== "sam_yc" &&
    !isAdmin;

  if (isExtrusionOperatorWorker) {
    return (
      <ExtrusionWorkerDashboardView
        onNavigateTab={onNavigateTab}
      />
    );
  }

  // 🌟 한울 외주가공 현장작업자 (상단 포털을 통해 로그인한 현장작업자만 해당)
  // 첫 화면 아래쪽 한울 뱃지(대표이사)는 관리자이므로 기존 관리자 화면을 유지함
  const isHanulOperatorWorker =
    Boolean(currentProfile?.isFieldWorker) &&
    isHanulWorkerProfile(currentProfile) &&
    !isAdmin;

  if (isHanulOperatorWorker) {
    return (
      <HanulWorkerDashboardView
        onNavigateTab={onNavigateTab}
      />
    );
  }

  return (
    <div className="space-y-2.5 sm:space-y-3 animate-fadeIn pb-12 max-w-[1600px] w-full mx-auto px-0.5 sm:px-0 min-w-0 max-w-full">
      {!isManagerOrAdmin ? (
        /* 🏭 [현장 작업자 전용 모드] - 독립 컴포넌트로 분리되어 관리자 화면과 완전 격리 */
        <FieldWorkerDashboardView
          workerPlant={workerPlant}
          workerFullName={workerFullName}
          workerPosition={workerPosition}
          assignedProcess={assignedProcess}
          todayFormattedLabel={todayFormattedLabel}
          handleOpenWorkLogModal={handleOpenWorkLogModal}
          isExtrusionWorkerOnly={isExtrusionWorkerOnly}
          onNavigateTab={onNavigateTab}
          todayLog={todayLog}
          isWorkLogApproved={isWorkLogApproved}
          handleOpenLogDetail={handleOpenLogDetail}
          handleOpenEditModal={handleOpenEditModal}
          workerLogsList={workerLogsList}
          workerLogScope={workerLogScope}
          setWorkerLogScope={setWorkerLogScope}
          workerLogApprovalFilter={workerLogApprovalFilter}
          setWorkerLogApprovalFilter={setWorkerLogApprovalFilter}
          currentProfile={currentProfile}
          handleDeleteLog={handleDeleteLog}
        />
      ) : (
        <>

      {/* 🌟 압출동 일반작업자 전용 상단 배너 (설유철 책임은 관리자이므로 제외) */}
      {(currentProfile?.building === "압출동" || currentProfile?.id?.startsWith("ext_") || currentProfile?.name === "공영국") && currentProfile?.name !== "설유철" && currentProfile?.id !== "sam_yc" && (
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs text-white shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight">
                🏭 삼랑진공장 압출동 작업자 모드 ({currentProfile.name}{currentProfile.title ? ` ${currentProfile.title}` : ""})
              </h3>
              <p className="text-xs text-teal-100 font-medium">
                압출 생산관리 탭에서 실시간 작업일보 작성 및 생산실적/비가동 분석을 확인하세요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem("factory_extrusion_active_subtab", "production");
              } catch (e) {}
              if (onNavigateTab) onNavigateTab("extrusion_downtime");
            }}
            className="px-4 py-2 rounded-xl bg-white text-teal-800 font-black text-xs sm:text-sm hover:bg-teal-50 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer text-center"
          >
            🏭 압출 생산관리 및 작업일보 바로가기 ➡️
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ [한림공장 TEST 전용] 전사 이상발생 / 품질경보 / TPM / 비가동 및 불량 / 일지 통합 관제 패널 */}
      {/* ========================================================================= */}
      {isTestUser && (
        <UnifiedAbnormalityControlPanel
          workLogs={workLogs}
          currentProfile={currentProfile}
          onOpenWorkLogDetail={(log) => setSelectedLogDetail(log)}
          onOpenExtrusionReport={(rep) => {
            try {
              localStorage.setItem("factory_extrusion_active_subtab", "production");
            } catch (e) {}
            if (onNavigateTab) onNavigateTab("extrusion_downtime");
          }}
          onOpenIssueModal={(issue) => {
            if (onNavigateTab) onNavigateTab("quality_control");
          }}
        />
      )}

      {/* 📌 사내 공통일정 (1줄 간결 바 • 결재 패널 상단 • ADMIN 전용 노출) */}
      <CommonScheduleBar
        isAdmin={isAdmin}
        hasNewScheduleMessage={hasNewScheduleMessage}
        allActiveCommonSchedules={allActiveCommonSchedules}
        setSelectedCommonScheduleForComments={setSelectedCommonScheduleForComments}
        todayDateStr={todayDateStr}
        isGeneralManager={isGeneralManager}
        handleDeleteCommonSchedule={handleDeleteCommonSchedule}
        setCommonScheduleModalOpen={setCommonScheduleModalOpen}
      />

      {/* 🌟 작업자 일정/연차 및 스마트 캘린더 센터 */}
      <WorkerScheduleCalendarSection
        workerPlant={workerPlant}
        workerFullName={workerFullName}
        onNavigateTab={onNavigateTab}
        pendingCount={pendingCount}
        holdCount={holdCount}
        officialTitle={officialTitle}
        isAdmin={isAdmin}
        isManagerRole={isManagerRole}
        scheduleLeaveType={scheduleLeaveType}
        setScheduleLeaveType={setScheduleLeaveType}
        scheduleSelectedDate={scheduleSelectedDate}
        setScheduleSelectedDate={setScheduleSelectedDate}
        scheduleReasonInput={scheduleReasonInput}
        setScheduleReasonInput={setScheduleReasonInput}
        handleRegisterSchedule={handleRegisterSchedule}
        scheduleSaving={scheduleSaving}
        scheduleCameraInputRef={scheduleCameraInputRef}
        scheduleFileInputRef={scheduleFileInputRef}
        handleScheduleFiles={handleScheduleFiles}
        scheduleAttachedFiles={scheduleAttachedFiles}
        isProcessingScheduleFiles={isProcessingScheduleFiles}
        handleRemoveScheduleFile={handleRemoveScheduleFile}
        setPreviewImageModal={setPreviewImageModal}
        shareDropdownRef={shareDropdownRef}
        isShareDropdownOpen={isShareDropdownOpen}
        setIsShareDropdownOpen={setIsShareDropdownOpen}
        sharedWorkers={sharedWorkers}
        setSharedWorkers={setSharedWorkers}
        toggleSharedWorker={toggleSharedWorker}
        togglePlantSharedWorkers={togglePlantSharedWorkers}
        currentProfile={currentProfile}
        ADMIN_USERS={ADMIN_USERS}
        PLANTS={PLANTS}
        myActiveLeaves={myActiveLeaves}
        todayDateStr={todayDateStr}
        formatKSTDate={formatKSTDate}
        setScheduleDetailModal={setScheduleDetailModal}
        handleRequestDismissOrDelete={handleRequestDismissOrDelete}
        showMiniCalendar={showMiniCalendar}
        setShowMiniCalendar={setShowMiniCalendar}
        scheduleWeekAnchor={scheduleWeekAnchor}
        handlePrevWeek={handlePrevWeek}
        handleResetToToday={handleResetToToday}
        handleNextWeek={handleNextWeek}
        myWeeklyCalendarDays={myWeeklyCalendarDays}
      />

      {/* 🌟 한울 외주가공 지출내역 / 품질경보 / 일보 & 중대재해 안전판 */}
      <HanulAndSevereDisasterSection
        isHanul={isHanul}
        isAdmin={isAdmin}
        handleOpenHanulSettlementModal={handleOpenHanulSettlementModal}
        setIsHanulQualityIssueModalOpen={setIsHanulQualityIssueModalOpen}
        activeHanulQualityCount={activeHanulQualityCount}
        handleOpenHanulReport={handleOpenHanulReport}
        currentProfile={currentProfile}
        SevereDisasterBar={SevereDisasterBar}
      />

      {/* 1. 매입매출현황 요약 */}
      <SalesPurchaseSummarySection
        monthTitle={monthTitle}
        currentMonthData={currentMonthData}
        todayFormattedLabel={todayFormattedLabel}
        onNavigateTab={onNavigateTab}
        formatAmount={formatAmount}
        totalSales={totalSales}
        totalPurchases={totalPurchases}
        purchaseRatio={purchaseRatio}
      />

      {/* 2. 근태현황 및 관리 */}
      <AttendanceSummarySection
        todayFormattedLabel={todayFormattedLabel}
        unwrittenCompanies={unwrittenCompanies}
        onNavigateTab={onNavigateTab}
        companyOverviewStats={companyOverviewStats}
        pendingApprovalCards={pendingApprovalCards}
        pushModalHistory={pushModalHistory}
        setSelectedOvertimeReportForModal={setSelectedOvertimeReportForModal}
        formatKoreanWorkDate={formatKoreanWorkDate}
      />

      {/* 3. 금형별 일일품질 요약 */}
      <QualityStatusSection
        selectedMonth={selectedMonth}
        onNavigateTab={onNavigateTab}
        liveQualityCurrentMonthly={liveQualityCurrentMonthly}
        liveQualityPrevMonthly={liveQualityPrevMonthly}
        handleOpenQualityPopup={handleOpenQualityPopup}
      />

      {/* 4. 압출동 주간 비가동내역 요약 */}
      <ExtrusionDowntimeSection
        onNavigateTab={onNavigateTab}
        extrusionSummaryList={extrusionSummaryList}
      />

      {/* 5. 일일업무일지 현황 */}
      <DailyWorkLogTableSection
        isMyeongjae={isMyeongjae}
        isDongwook={isDongwook}
        isAdmin={isAdmin}
        pendingSamrangjinCount={pendingSamrangjinCount}
        pendingHallimCount={pendingHallimCount}
        setIsWorkLogsSummaryModalOpen={setIsWorkLogsSummaryModalOpen}
        filterPlant={filterPlant}
        setFilterPlant={setFilterPlant}
        workLogs={workLogs}
        pushModalHistory={pushModalHistory}
        paginatedLogs={paginatedLogs}
        handleOpenLogDetail={handleOpenLogDetail}
        canApproveLog={canApproveLog}
        isWorkLogApproved={isWorkLogApproved}
        handleOpenEditModal={handleOpenEditModal}
        handleDeleteLog={handleDeleteLog}
        currentProfile={currentProfile}
        filteredLogs={filteredLogs}
        currentLogPage={currentLogPage}
        setCurrentLogPage={setCurrentLogPage}
        LOGS_PER_PAGE={LOGS_PER_PAGE}
        totalLogPages={totalLogPages}
        handleOpenWorkLogModal={handleOpenWorkLogModal}
      />

      {/* 6. 실시간 접속기록 현황 & 7. 시스템 오류 및 조치 이력 관리 */}
      <AdminAccessAndIncidentSection
        isAdmin={isAdmin}
        PLANTS={PLANTS}
        accessLogs={accessLogs}
        handleOpenWorkerLogs={handleOpenWorkerLogs}
        formatRelativeAccessTime={formatRelativeAccessTime}
        onNavigateTab={onNavigateTab}
      />
        </>
      )}

      {/* 🌟 전체 대시보드 모달 컨테이너 (13개 핵심 모달 통합 관리) */}
      <DashboardModalsContainer
        selectedLogDetail={selectedLogDetail}
        setSelectedLogDetail={setSelectedLogDetail}
        handleOpenLogDetail={handleOpenLogDetail}
        isWorkLogApproved={isWorkLogApproved}
        handleOpenEditModal={handleOpenEditModal}
        setPreviewImageModal={setPreviewImageModal}
        handleCopyLineMatchText={handleCopyLineMatchText}
        copyToast={copyToast}
        canApproveLog={canApproveLog}
        approvalCommentInput={approvalCommentInput}
        setApprovalCommentInput={setApprovalCommentInput}
        handleRejectLog={handleRejectLog}
        handleApproveLog={handleApproveLog}
        currentProfile={currentProfile}
        isAdmin={isAdmin}
        handleDeleteLog={handleDeleteLog}
        editingLog={editingLog}
        setEditingLog={setEditingLog}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        handleSaveEditedLog={handleSaveEditedLog}
        editMaintenanceItems={editMaintenanceItems}
        handleAddEditMaintenanceItem={handleAddEditMaintenanceItem}
        handleRemoveEditMaintenanceItem={handleRemoveEditMaintenanceItem}
        handleUpdateEditMaintenanceItem={handleUpdateEditMaintenanceItem}
        isEditProcessingImages={isEditProcessingImages}
        handleEditMaintenanceItemImageFiles={handleEditMaintenanceItemImageFiles}
        handleRemoveEditMaintenanceItemImage={handleRemoveEditMaintenanceItemImage}
        handleEditLogImageFiles={handleEditLogImageFiles}
        handleRemoveEditLogImage={handleRemoveEditLogImage}
        selectedWorkerForLogs={selectedWorkerForLogs}
        setSelectedWorkerForLogs={setSelectedWorkerForLogs}
        accessLogs={accessLogs}
        lineMatchShareModal={lineMatchShareModal}
        setLineMatchShareModal={setLineMatchShareModal}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isInjoo={isInjoo}
        isJaeyul={isJaeyul}
        isExtrusionWorker={isExtrusionWorker}
        isQualityWorker={isQualityWorker}
        isGeneralManager={isGeneralManager}
        logout={logout}
        assignedProcess={assignedProcess}
        formData={formData}
        setFormData={setFormData}
        handleSaveLog={handleSaveLog}
        isSavingLog={isSavingLog}
        logSavedToast={logSavedToast}
        formatAmount={formatAmount}
        workerFullName={workerFullName}
        workerPlant={workerPlant}
        officialTitle={officialTitle}
        workerDept={workerDept}
        workerPosition={workerPosition}
        isProcessingImages={isProcessingImages}
        handleWorkLogImageFiles={handleWorkLogImageFiles}
        handleRemoveWorkLogImage={handleRemoveWorkLogImage}
        previewImageModal={previewImageModal}
        selectedMonth={selectedMonth}
        currentYearMonth={currentYearMonth}
        availableMonths={availableMonths}
        DEFAULT_MONTH_LIST={DEFAULT_MONTH_LIST}
        parsedResult={parsedResult}
        setParsedResult={setParsedResult}
        uploadSuccess={uploadSuccess}
        setUploadSuccess={setUploadSuccess}
        fileInputRef={fileInputRef}
        handleExcelFile={handleExcelFile}
        handleDrag={handleDrag}
        handleDrop={handleDrop}
        dragActive={dragActive}
        parsing={parsing}
        uploading={uploading}
        successMessage={successMessage}
        handleConfirmExcelUpload={handleConfirmExcelUpload}
        maintenanceItems={maintenanceItems}
        handleAddMaintenanceItem={handleAddMaintenanceItem}
        handleRemoveMaintenanceItem={handleRemoveMaintenanceItem}
        handleUpdateMaintenanceItem={handleUpdateMaintenanceItem}
        handleMaintenanceItemImageFiles={handleMaintenanceItemImageFiles}
        handleRemoveMaintenanceItemImage={handleRemoveMaintenanceItemImage}
        qualityFiles={qualityFiles}
        setQualityFiles={setQualityFiles}
        qualityUploadSuccess={qualityUploadSuccess}
        setQualityUploadSuccess={setQualityUploadSuccess}
        qualityFileInputRef={qualityFileInputRef}
        handleQualityFiles={handleQualityFiles}
        handleQualityDrag={handleQualityDrag}
        handleQualityDrop={handleQualityDrop}
        qualityDragActive={qualityDragActive}
        qualityParsing={qualityParsing}
        qualityUploading={qualityUploading}
        qualitySuccessMessage={qualitySuccessMessage}
        handleConfirmQualityUpload={handleConfirmQualityUpload}
        commonScheduleModalOpen={commonScheduleModalOpen}
        setCommonScheduleModalOpen={setCommonScheduleModalOpen}
        commonScheduleForm={commonScheduleForm}
        setCommonScheduleForm={setCommonScheduleForm}
        commonScheduleSaving={commonScheduleSaving}
        handleRegisterCommonSchedule={handleRegisterCommonSchedule}
        todayDateStr={todayDateStr}
        TIME_OPTIONS_30MIN={TIME_OPTIONS_30MIN}
        scheduleCounts={scheduleCounts}
        commonScheduleFilterTab={commonScheduleFilterTab}
        setCommonScheduleFilterTab={setCommonScheduleFilterTab}
        modalFilteredSchedules={modalFilteredSchedules}
        handleToggleCompleteCommonSchedule={handleToggleCompleteCommonSchedule}
        handleDeleteCommonSchedule={handleDeleteCommonSchedule}
        setSelectedCommonScheduleForComments={setSelectedCommonScheduleForComments}
        dailyPnLModalOpen={dailyPnLModalOpen}
        setDailyPnLModalOpen={setDailyPnLModalOpen}
        selectedPnLChannel={selectedPnLChannel}
        setSelectedPnLChannel={setSelectedPnLChannel}
        sendingDailyPnL={sendingDailyPnL}
        handleSendDailyPnLTelegram={handleSendDailyPnLTelegram}
        customPnLBriefing={customPnLBriefing}
        setCustomPnLBriefing={setCustomPnLBriefing}
        totalSales={totalSales}
        totalPurchases={totalPurchases}
        salesAchievementPct={salesAchievementPct}
        purchaseAchievementPct={purchaseAchievementPct}
        prevMonthKey={prevMonthKey}
        uncompletedCommonSchedules={uncompletedCommonSchedules}
        scheduleDetailModal={scheduleDetailModal}
        setScheduleDetailModal={setScheduleDetailModal}
        myWeeklyCalendarDays={myWeeklyCalendarDays}
        annualLeaves={annualLeaves}
        handleReactivateLeave={handleReactivateLeave}
        handleDeleteLeave={handleDeleteLeave}
        handleRequestDismissOrDelete={handleRequestDismissOrDelete}
        setScheduleSelectedDate={setScheduleSelectedDate}
        sharedReplyModalItem={sharedReplyModalItem}
        setSharedReplyModalItem={setSharedReplyModalItem}
        replySubmitting={replySubmitting}
        replyTextInput={replyTextInput}
        setReplyTextInput={setReplyTextInput}
        handleSendSharedReply={handleSendSharedReply}
        sharedSenderConfirmModalItem={sharedSenderConfirmModalItem}
        setSharedSenderConfirmModalItem={setSharedSenderConfirmModalItem}
        confirmSubmitting={confirmSubmitting}
        handleConfirmSenderDismiss={handleConfirmSenderDismiss}
        qualityPopupItem={qualityPopupItem}
        setQualityPopupItem={setQualityPopupItem}
        liveQualityDaily={liveQualityDaily}
        handleExportQualityItemExcel={handleExportQualityItemExcel}
        selectedCommonScheduleForComments={selectedCommonScheduleForComments}
        commonScheduleCommentInput={commonScheduleCommentInput}
        setCommonScheduleCommentInput={setCommonScheduleCommentInput}
        commonScheduleCommentSubmitting={commonScheduleCommentSubmitting}
        handleAddCommonScheduleComment={handleAddCommonScheduleComment}
        handleDeleteCommonScheduleComment={handleDeleteCommonScheduleComment}
        selectedOvertimeReportForModal={selectedOvertimeReportForModal}
        setSelectedOvertimeReportForModal={setSelectedOvertimeReportForModal}
        getReportWorkersList={getReportWorkersList}
        onNavigateTab={onNavigateTab}
        isWorkLogsSummaryModalOpen={isWorkLogsSummaryModalOpen}
        setIsWorkLogsSummaryModalOpen={setIsWorkLogsSummaryModalOpen}
        workLogs={workLogs}
        handleBatchApproveLogs={handleBatchApproveLogs}
        isHanulSettlementModalOpen={isHanulSettlementModalOpen}
        setIsHanulSettlementModalOpen={setIsHanulSettlementModalOpen}
        getPreviousYearMonth={getPreviousYearMonth}
        isHanulWorkReportModalOpen={isHanulWorkReportModalOpen}
        setIsHanulWorkReportModalOpen={setIsHanulWorkReportModalOpen}
        hanulReportProject={hanulReportProject}
        hanulReportProcess={hanulReportProcess}
        hanulReportEditData={hanulReportEditData}
        isHanulQualityIssueModalOpen={isHanulQualityIssueModalOpen}
        setIsHanulQualityIssueModalOpen={setIsHanulQualityIssueModalOpen}
      />

    </div>
  );
};
