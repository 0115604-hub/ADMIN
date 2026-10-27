import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Cpu, Target, Gauge, ArrowRight } from "lucide-react";
import * as XLSX from "xlsx";
import { DigitalInspectionModal } from "./sq/DigitalInspectionModal";

import { SevereDisasterBar } from "./SevereDisasterBar";
import FieldWorkerDashboardView from "./dashboard/FieldWorkerDashboardView";
import { useAuth, PLANTS, ADMIN_USERS, isManagerOrAdminUser } from "../context/AuthContext";
import { useMonth, DEFAULT_MONTH_LIST } from "../context/MonthContext";
import { useCurrency } from "../context/CurrencyContext";
import {
  getLocalSmartOvertimeData,
  calculateDailySummary,
  subscribeSmartOvertimeData,
  cleanCompanyName,
  getReportDateSortKey,
  reconcileMatrixWithReports
} from "../services/overtimeSmartService.js";
import {
  getLocalApprovalDocs,
  subscribeApprovalDocs,
  isApprovalDocPending
} from "../services/approvalService";
import { getLocalAccessLogs, subscribeAccessLogs } from "../services/accessLogService";
import {
  getLocalOvertimeReports,
  subscribeOvertimeReports,
  getLatestOvertimeSummary,
  formatKoreanWorkDate,
  isWeekendByDate
} from "../services/overtimeService";
import { isWorkLogApproved } from "../services/workLogService";
import {
  subscribeQualityRecords,
  getQualityMonthlyAggregation,
  getQualityDailyAggregation,
  getPreviousYearMonth,
  QUALITY_CORE_ITEMS
} from "../services/qualityService";
import { getKSTDateString, formatKSTDate, formatRelativeAccessTime } from "../utils/dateUtils";
import { pushModalHistory, useModalHistory } from "../utils/modalHistory";
import { ExtrusionWorkerDashboardView } from "./extrusion/ExtrusionWorkerDashboardView";
import {
  isExtrusionWorkerProfile,
  subscribeExtrusionQualityIssues,
  getLocalExtrusionQualityIssues
} from "../services/extrusionQualityIssueService";
import { HanulWorkerDashboardView } from "./hanul/HanulWorkerDashboardView";
import { isHanulWorkerProfile } from "../services/hanulQualityIssueService";
import { MachiningWorkerDashboardView } from "./machining/MachiningWorkerDashboardView";
import {
  isMachiningWorkerProfile,
  subscribeMachiningQualityIssues,
  getLocalMachiningQualityIssues
} from "../services/machiningQualityIssueService";
import { YuseongWorkerDashboardView } from "./yuseong/YuseongWorkerDashboardView";
import {
  isYuseongWorkerProfile,
  subscribeYuseongQualityIssues,
  getLocalYuseongQualityIssues
} from "../services/yuseongQualityIssueService";
import { DashboardModalsContainer } from "./dashboard/DashboardModalsContainer";
import { getWorkerPersonnelCard, isWorkerManagerRole } from "../services/personnelCardService";
import {
  HanulManagerDashboardView,
  PartnerManagerDashboardView,
  InternalManagerDashboardView,
  AdminDashboardView
} from "./dashboard/managers";
import {
  subscribeHanulQualityIssues,
  getLocalHanulQualityIssues
} from "../services/hanulQualityIssueService";
import {
  useCommonSchedule,
  useWorkerSchedule,
  useDashboardExcel,
  useWorkLogCrud,
  DEFECT_TYPE_GROUPS,
  JAEYUL_EQUIPMENT_CATEGORIES,
  JAEYUL_EQUIPMENT_OPTIONS,
  JAEYUL_CATEGORY_EQUIPMENT_MAP,
  LOGS_PER_PAGE
} from "../hooks/dashboard";

export {
  DEFECT_TYPE_GROUPS,
  JAEYUL_EQUIPMENT_CATEGORIES,
  JAEYUL_EQUIPMENT_OPTIONS,
  JAEYUL_CATEGORY_EQUIPMENT_MAP,
  LOGS_PER_PAGE
};

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
    { key: "pcm1", altKeys: ["pcm1", "pcm_1", "pcm#1"], defaultName: "압출 1호 (PCM #1)", defaultCode: "PCM #1", themeColor: "teal" },
    { key: "pcm3", altKeys: ["pcm3", "pcm_3", "pcm#3"], defaultName: "압출 3호 (PCM #3)", defaultCode: "PCM #3", themeColor: "blue" },
    { key: "pvc", altKeys: ["pvc", "pvc1", "pvc_1"], defaultName: "압출 PVC 라인", defaultCode: "PVC", themeColor: "amber" },
    { key: "tpe", altKeys: ["tpe", "tpe1", "tpe_1"], defaultName: "압출 TPE 라인", defaultCode: "TPE", themeColor: "purple" }
  ];

  return lineKeys.map(({ key, altKeys, defaultName, defaultCode, themeColor }) => {
    let lObj = null;
    if (store && typeof store === "object") {
      lObj = store[key];
      if (!lObj && Array.isArray(altKeys)) {
        for (const ak of altKeys) {
          if (store[ak]) {
            lObj = store[ak];
            break;
          }
        }
      }
    }
    if (!lObj || typeof lObj !== "object") lObj = {};

    const lineName = lObj.name || defaultName;
    const lineCode = lObj.code || defaultCode;
    const sheets = (lObj.sheets && typeof lObj.sheets === "object" ? lObj.sheets : null) ||
                   (lObj.weeklyData && typeof lObj.weeklyData === "object" ? lObj.weeklyData : null) || {};
    const sheetKeys = Object.keys(sheets);

    const flatRecords = Array.isArray(lObj)
      ? lObj
      : (Array.isArray(lObj.records) ? lObj.records : []);

    // If no data uploaded yet for this line
    if (sheetKeys.length === 0 && flatRecords.length === 0) {
      return {
        id: key,
        key,
        lineKey: key,
        line: lineName,
        name: lineName,
        code: lineCode,
        plant: "삼랑진공장",
        themeColor,
        status: "정상가동",
        statusColor: "emerald",
        currentMonth: "9월",
        currentMonthMin: 0,
        currentMonthHours: "0.0h",
        totalDowntimeMinutes: 0,
        issueCount: 0,
        mainReason: "특이사항 없음",
        actionTaken: "정상 운전",
        recentDate: "-",
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
          const noStr = String(r?.no || "").trim();
          const taskStr = String(r?.task || "").trim();
          if (noStr.includes("합계") || taskStr.includes("합계") || taskStr.includes("총 합계")) return;
          const min = Number(r?.minutes || 0);
          mTotalMin += min;
          if (r?.plan === "Y" || r?.plan === "y") mPlanMin += min;
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
        const noStr = String(r?.no || "").trim();
        const taskStr = String(r?.task || "").trim();
        if (noStr.includes("합계") || taskStr.includes("합계") || taskStr.includes("총 합계")) return;
        const min = Number(r?.minutes || 0);
        sepMin += min;
        if (r?.plan === "Y" || r?.plan === "y") sepPlanMin += min;
      });
    });

    // If flat records exist and no sheet records, aggregate safely
    if (sepMin === 0 && flatRecords.length > 0) {
      sepMin = flatRecords.reduce((sum, r) => sum + (Number(r?.durationMinutes || r?.minutes) || 0), 0);
    }

    const currSep = monthlyTrend.find((m) => m.month === "9월") || monthlyTrend[monthlyTrend.length - 1];
    const sepHours = (sepMin / 60).toFixed(1) + "h";
    const sepNetDowntime = Math.max(0, sepMin - sepPlanMin);
    const sepNetRunTime = Math.max(0, sepTotalBase - sepPlanMin);
    const sepOpRatio =
      sepSheets.length > 0 && sepNetRunTime > 0
        ? (((sepNetRunTime - sepNetDowntime) / sepNetRunTime) * 100).toFixed(1)
        : (currSep?.opNum ? currSep.opNum.toFixed(1) : "100.0");
    const sepLossRate =
      sepSheets.length > 0 && sepTotalBase > 0
        ? `${((sepMin / sepTotalBase) * 100).toFixed(1)}%`
        : (currSep?.lossRate || "0.0%");

    let status = "정상가동";
    let statusColor = "emerald";
    if (sepMin > 180) {
      status = "가동주의";
      statusColor = "rose";
    } else if (sepMin > 60) {
      status = "점검대기";
      statusColor = "amber";
    }

    const latest = flatRecords.length > 0 ? flatRecords[flatRecords.length - 1] : null;

    return {
      id: key,
      key,
      lineKey: key,
      line: lineName,
      name: lineName,
      code: lineCode,
      plant: "삼랑진공장",
      themeColor,
      status,
      statusColor,
      currentMonth: "9월",
      currentMonthMin: sepMin,
      currentMonthHours: sepHours,
      totalDowntimeMinutes: sepMin,
      issueCount: flatRecords.length || sepSheets.length,
      mainReason: latest ? `${latest.reason || "설비점검"} (${latest.durationMinutes || latest.minutes}분)` : "특이사항 없음",
      actionTaken: latest ? latest.actionTaken || "조치 완료" : "정상 운전",
      recentDate: latest?.date || "-",
      lossRate: sepSheets.length > 0 ? sepLossRate : (currSep?.lossRate || "0.0%"),
      opRatio: sepOpRatio,
      isPending: false,
      monthlyTrend
    };
  });
};

export const WorkerDashboard = ({ onBulkUpload, onNavigateTab }) => {
  const { currentProfile, isOperator, isAdmin, logout } = useAuth();
  const { selectedMonth, currentMonthData, uploadMonthlyData, availableMonths, changeMonth, currentYearMonth, allMonthlyData } = useMonth();
  const { formatAmount } = useCurrency();

  const isManagerRole = isWorkerManagerRole(currentProfile);
  const workerPlant = currentProfile?.plant || "삼랑진공장";
  const isSamrangjin = workerPlant === "삼랑진공장" || String(currentProfile?.id || "").startsWith("sam_");
  const isHallim = workerPlant === "한림공장" || String(currentProfile?.id || "").startsWith("hal_");
  const workerFullName = currentProfile?.name || "작업자";
  const officialTitle = currentProfile?.title || (
    currentProfile?.name === "공영국" ? "대리" :
    ["심임대", "이상은", "박종미", "최현영"].includes(currentProfile?.name) ? "반장" :
    currentProfile?.name === "설유철" ? "책임" :
    (isManagerRole ? "반장" : "사원")
  );
  const isInjoo = currentProfile?.name === "조인주" || currentProfile?.id === "sam_ij";
  const isJaeyul = currentProfile?.name === "전재율" || currentProfile?.id === "sam_jy" || currentProfile?.assignedProcess === "설비보전";
  const isQualityWorker = currentProfile?.assignedProcess === "품질관리" || currentProfile?.name === "이창엽" || currentProfile?.name === "이상기" || currentProfile?.id === "sam_cy" || currentProfile?.id === "sam_sg";
  const isExtrusionWorker =
    currentProfile?.name === "설유철" ||
    currentProfile?.id === "sam_yc" ||
    isExtrusionWorkerProfile(currentProfile);

  // 🌟 한울 관리자 (대표이사 hal_hu, 황수현 선임 등 외주가공 한울 관리자)
  const isHanulManager = Boolean(
    currentProfile?.name === "한울" ||
    currentProfile?.id === "hal_hu" ||
    currentProfile?.name === "황수현" ||
    String(currentProfile?.id || "").startsWith("hal_hu") ||
    (!currentProfile?.isFieldWorker && (currentProfile?.company?.includes("한울") || currentProfile?.company === "한울"))
  );

  // 🌟 한울 전체 (관리자 + 작업자)
  const isHanul = isHanulManager || Boolean(
    !isExtrusionWorker && (
      currentProfile?.company?.includes("한울") ||
      currentProfile?.company === "한울" ||
      currentProfile?.name === "한울" ||
      String(currentProfile?.id || "").startsWith("hal_hu") ||
      isHanulWorkerProfile(currentProfile)
    )
  );

  // 🌟 부림텍 관리자 (대표이사 hal_br 등)
  const isBurimtechManager = Boolean(
    currentProfile?.name === "부림텍" ||
    currentProfile?.id === "hal_br" ||
    (!currentProfile?.isFieldWorker && (currentProfile?.company?.includes("부림") || currentProfile?.company === "부림텍"))
  );

  const isBurimtech = isBurimtechManager || Boolean(
    !isExtrusionWorker && !isHanul && (
      currentProfile?.portalType === "bulimtech" ||
      currentProfile?.company?.includes("부림") ||
      currentProfile?.name === "부림텍" ||
      String(currentProfile?.id || "").startsWith("hal_br_")
    )
  );

  // 🌟 유성 관리자 (대표이사 sam_ys 등)
  const isYuseongManager = Boolean(
    currentProfile?.name === "유성" ||
    currentProfile?.id === "sam_ys" ||
    (!currentProfile?.isFieldWorker && (currentProfile?.company?.includes("유성") || currentProfile?.company === "유성"))
  );

  // 🌟 외주 협력사 대표/관리자 판별 (한울, 부림텍, 유성 등)
  const isPartnerProfile = Boolean(
    isHanulManager ||
    isBurimtechManager ||
    isYuseongManager ||
    (!currentProfile?.isFieldWorker && (
      currentProfile?.isPartner ||
      currentProfile?.name === "유성" ||
      currentProfile?.name === "한울" ||
      currentProfile?.name === "부림텍" ||
      currentProfile?.company === "유성" ||
      currentProfile?.company === "한울" ||
      currentProfile?.company === "부림텍" ||
      (!String(currentProfile?.id || "").includes("_") && (currentProfile?.company === "유성" || currentProfile?.company === "한울" || currentProfile?.company === "부림텍"))
    ))
  );

  const assignedProcess = currentProfile?.assignedProcess || (
    currentProfile?.building === "압출동" ? "압출" :
    isExtrusionWorker ? "압출" :
    isHanul ? "외주가공 (한울)" :
    isBurimtech ? "외주가공 (부림텍)" :
    isPartnerProfile ? "외주가공" :
    "가공"
  );

  const [isHanulSettlementModalOpen, setIsHanulSettlementModalOpen] = useState(false);
  const [isHanulWorkReportModalOpen, setIsHanulWorkReportModalOpen] = useState(false);
  const [isHanulQualityIssueModalOpen, setIsHanulQualityIssueModalOpen] = useState(false);
  const [hanulQualityIssues, setHanulQualityIssues] = useState(() => getLocalHanulQualityIssues());
  const [machiningQualityIssues, setMachiningQualityIssues] = useState(() => getLocalMachiningQualityIssues());
  const [extrusionQualityIssues, setExtrusionQualityIssues] = useState(() => getLocalExtrusionQualityIssues());
  const [hanulReportProject, setHanulReportProject] = useState("9BQC");
  const [hanulReportProcess, setHanulReportProcess] = useState("소재준비");
  const [hanulReportEditData, setHanulReportEditData] = useState(null);
  const [isWorkLogsSummaryModalOpen, setIsWorkLogsSummaryModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
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

  useEffect(() => {
    const unsub = subscribeMachiningQualityIssues((list) => {
      setMachiningQualityIssues(list || []);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeExtrusionQualityIssues((list) => {
      setExtrusionQualityIssues(list || []);
    });
    return () => unsub();
  }, []);

  const activeHanulQualityCount = useMemo(() => {
    return (hanulQualityIssues || []).filter((i) => i && i.status === "ACTIVE").length;
  }, [hanulQualityIssues]);

  const activeMachiningQualityCount = useMemo(() => {
    return (machiningQualityIssues || []).filter((i) => i && i.status === "ACTIVE").length;
  }, [machiningQualityIssues]);

  const activeExtrusionQualityCount = useMemo(() => {
    return (extrusionQualityIssues || []).filter((i) => i && i.status === "ACTIVE").length;
  }, [extrusionQualityIssues]);

  const handleOpenHanulReport = (proj = "9BQC", proc = "소재준비", editData = null) => {
    setHanulReportProject(proj);
    setHanulReportProcess(proc);
    setHanulReportEditData(editData);
    setIsHanulWorkReportModalOpen(true);
  };

  const handleOpenHanulSettlementModal = () => {
    pushModalHistory("hanul_settlement_modal");
    setIsHanulSettlementModalOpen(true);
  };

  const [isYuseongWorkReportModalOpen, setIsYuseongWorkReportModalOpen] = useState(false);
  const [yuseongReportProject, setYuseongReportProject] = useState("JK1");
  const [yuseongReportEditData, setYuseongReportEditData] = useState(null);
  const [yuseongQualityIssues, setYuseongQualityIssues] = useState(() => getLocalYuseongQualityIssues());
  useModalHistory(isYuseongWorkReportModalOpen, () => setIsYuseongWorkReportModalOpen(false), "workerDashboardYuseongReportModal");

  useEffect(() => {
    const unsub = subscribeYuseongQualityIssues((list) => {
      setYuseongQualityIssues(list || []);
    });
    return () => unsub();
  }, []);

  const activeYuseongQualityCount = useMemo(() => {
    return (yuseongQualityIssues || []).filter((i) => i && i.status === "ACTIVE").length;
  }, [yuseongQualityIssues]);

  const handleOpenYuseongReport = (proj = "JK1", editData = null) => {
    setYuseongReportProject(proj);
    setYuseongReportEditData(editData);
    setIsYuseongWorkReportModalOpen(true);
  };

  const [selectedOvertimeReportForModal, setSelectedOvertimeReportForModal] = useState(null);

  const workerCard = useMemo(() => {
    return getWorkerPersonnelCard(currentProfile || {});
  }, [currentProfile]);

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
    : (officialTitle || workerCard?.position || "사원");
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

  // 5 Company Smart Overtime Ledger & Reports Subscription (항상 실시간 KST 당월 기준)
  const [smartOvertimeData, setSmartOvertimeData] = useState(() => {
    const todayYM = getKSTDateString().slice(0, 7);
    return getLocalSmartOvertimeData(todayYM);
  });
  const [overtimeReports, setOvertimeReports] = useState(() => getLocalOvertimeReports());

  useEffect(() => {
    const todayYM = getKSTDateString().slice(0, 7);
    setSmartOvertimeData(getLocalSmartOvertimeData(todayYM));
    const unsubSmart = subscribeSmartOvertimeData((data) => {
      if (data && data.attendanceMatrix) {
        setSmartOvertimeData(data);
      }
    }, todayYM);
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

    // 🌟 10월 이후는 smart_overtime_ledger가 단일 원천이므로 과거 보고서 보정(reconcile)을 거치지 않음
    const isNewArchitecture = todayYear > 2026 || (todayYear === 2026 && todayMonth >= 10);
    const matrix = isNewArchitecture
      ? rawMatrix
      : (reconcileMatrixWithReports(rawMatrix, overtimeReports || [], todayYear, todayMonth).matrix || rawMatrix);

    const daily = calculateDailySummary(matrix, todayDayNum, todayYear, todayMonth);
    const companyStyles = {
      "오륙": { dot: "bg-blue-500", borderHover: "hover:border-blue-400 dark:hover:border-blue-500", badgeColor: "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800" },
      "유성": { dot: "bg-cyan-500", borderHover: "hover:border-cyan-400 dark:hover:border-cyan-500", badgeColor: "text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-800" },
      "조영": { dot: "bg-purple-500", borderHover: "hover:border-purple-400 dark:hover:border-purple-500", badgeColor: "text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 border-purple-200 dark:border-purple-800" },
      "한울": { dot: "bg-emerald-500", borderHover: "hover:border-emerald-400 dark:hover:border-emerald-500", badgeColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800" },
      "부림텍": { dot: "bg-amber-500", borderHover: "hover:border-amber-400 dark:hover:border-amber-500", badgeColor: "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800" }
    };

    // ⭐ 순서 표준화: 오륙 -> 유성 -> 조영 -> 한울 -> 부림텍
    const companies = ["오륙", "유성", "조영", "한울", "부림텍"].map((name) => {
      const styles = companyStyles[name] || companyStyles["오륙"];
      const cleanCompName = cleanCompanyName(name);
      const b = daily?.companyBreakdown?.[cleanCompName] || daily?.companyBreakdown?.[name];
      const compWorkers = matrix.filter((w) => cleanCompanyName(w.company) === cleanCompName);

      // 당일 원장 상의 근태 입력 인원수 (단일 진실 원천)
      const enteredCount = compWorkers.filter((w) => {
        const v = (w.daily && (w.daily[todayDayNum] !== undefined ? w.daily[todayDayNum] : w.daily[String(todayDayNum)])) ?? w[todayDayNum] ?? w[String(todayDayNum)];
        const str = String(v ?? "").trim();
        return str !== "" && str !== "미입력" && str !== "-" && str !== "undefined" && str !== "null";
      }).length;

      // 1단계 심플 결재 상태 확인 (APPROVED: 마감, SUBMITTED: 상신대기, DRAFT: 작성중)
      const approvalKey = `${cleanCompName}_${todayDayNum}`;
      const approvalInfo = smartOvertimeData?.companyApprovalStatus?.[approvalKey] || {};
      const approvalStatus = approvalInfo.status || "DRAFT";

      const hasReport = (overtimeReports || []).some((r) => {
        if (!r) return false;
        const rDateKey = getReportDateSortKey(r);
        if (rDateKey !== todayStr) return false;
        return cleanCompanyName(r.company || "") === cleanCompName;
      });

      // ⭐ 작성전/후 2단계 단일화 로직 (1명 이상 입력 or 승인/상신 or 일보보고서 등록 -> 작성후)
      const hasAnyAttendance = enteredCount > 0;
      const isApproved = (hasAnyAttendance || approvalInfo.attendedCount > 0) && approvalStatus === "APPROVED";
      const isSubmitted = (hasAnyAttendance || approvalInfo.attendedCount > 0) && approvalStatus === "SUBMITTED";
      const isWritten = hasAnyAttendance || isApproved || isSubmitted || (approvalInfo.attendedCount > 0) || hasReport;
      const shortName = name.replace(/[()주]/g, "");

      const workers = b?.total && b.total > 0 ? b.total : compWorkers.length;
      const attended = b && b.attended !== undefined ? b.attended : enteredCount;
      const absent = b && b.absent !== undefined ? b.absent : Math.max(0, workers - attended);
      const otWorkers = b && b.otWorkers !== undefined ? b.otWorkers : 0;
      const otHours = b && b.otHours !== undefined ? b.otHours : 0;
      const totalHours = b && b.totalHours !== undefined ? b.totalHours : (attended * 8 + otHours);

      // ⭐ 작성전 / 작성후 2단계 표현 통일
      const statusBadgeText = isWritten ? "작성후" : "작성전";
      const statusBadgeClass = isWritten
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/50 font-black"
        : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/50 font-bold";

      return {
        name,
        shortName,
        isWritten,
        isApproved,
        isSubmitted,
        approvalStatus,
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

    const unwritten = (Array.isArray(companies) ? companies : []).filter((c) => !c.isWritten);

    return {
      companyOverviewStats: companies,
      unwrittenCompanies: unwritten
    };
  }, [smartOvertimeData, overtimeReports]);

  // 🌟 관리자별 맞춤 근태현황: 5개사 통합(TOTAL) 제거 및 5개 개별 회사(본인 소속사 우선 정렬)
  const filteredCompanyOverviewStats = useMemo(() => {
    if (!companyOverviewStats || companyOverviewStats.length === 0) return [];

    // 한울 관리자: 한울 우선 배치 + 나머지 개별사
    if (isHanulManager || isHanul) {
      const myComp = companyOverviewStats.find((c) => c.name === "한울" || c.shortName === "한울");
      const others = companyOverviewStats.filter((c) => c !== myComp);
      return [myComp, ...others].filter(Boolean);
    }
    // 부림텍 관리자: 부림텍 우선 배치 + 나머지 개별사
    if (isBurimtechManager || isBurimtech) {
      const myComp = companyOverviewStats.find((c) => c.name === "부림텍" || c.shortName === "부림텍");
      const others = companyOverviewStats.filter((c) => c !== myComp);
      return [myComp, ...others].filter(Boolean);
    }
    // 유성 관리자: 유성 우선 배치 + 나머지 개별사
    if (isYuseongManager) {
      const myComp = companyOverviewStats.find((c) => c.name === "유성" || c.shortName === "유성");
      const others = companyOverviewStats.filter((c) => c !== myComp);
      return [myComp, ...others].filter(Boolean);
    }

    return companyOverviewStats;
  }, [companyOverviewStats, isHanulManager, isHanul, isBurimtechManager, isBurimtech, isYuseongManager]);

  const filteredUnwrittenCompanies = useMemo(() => {
    return unwrittenCompanies || [];
  }, [unwrittenCompanies]);

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

  // Access Logs State for ADMIN (Only active when worker access logs modal is open to eliminate idle re-render storms)
  const [selectedWorkerForLogs, setSelectedWorkerForLogs] = useState(null);
  const [accessLogs, setAccessLogs] = useState(() => getLocalAccessLogs());

  useEffect(() => {
    if (!selectedWorkerForLogs) return;
    const unsub = subscribeAccessLogs((logs) => {
      setAccessLogs(logs);
    });
    return () => unsub();
  }, [selectedWorkerForLogs]);

  const handleOpenWorkerLogs = (worker) => {
    pushModalHistory("worker_access_logs");
    const freshLogs = getLocalAccessLogs();
    setAccessLogs(freshLogs);
    setSelectedWorkerForLogs(worker);
  };

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

  // 특근보고서 결재 완료 여부 확인
  const isOvertimeReportApproved = useCallback((rep) => {
    if (!rep) return false;
    const isWk = isWeekendByDate(rep.workDate || rep.title || rep.workDateFormatted);
    if (!isWk) return true;
    if (rep.workDate && String(rep.workDate).slice(0, 10) <= "2026-10-18") return true;

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
      }
    }
    return false;
  }, [approvalDocs]);

  // 공장별 최신 실시간 미결재 특근보고서 (주말/휴일 특근보고서 대상)
  const pendingApprovalCards = useMemo(() => {
    if (!Array.isArray(overtimeReports)) return [];
    const list = [];
    const sorted = [...overtimeReports].sort((a, b) => (b.workDate || "").localeCompare(a.workDate || ""));

    const samReport = sorted.find((r) => {
      const isSam = r.plant === "삼랑진공장" || r.company === "(주)오륙" || r.company === "유성";
      return isSam && !isOvertimeReportApproved(r);
    });
    if (samReport) list.push({ ...samReport, plantName: "삼랑진공장" });

    const halReport = sorted.find((r) => {
      const isHal = r.plant === "한림공장" || r.company === "조영" || r.company === "한울" || r.company === "부림텍";
      return isHal && !isOvertimeReportApproved(r);
    });
    if (halReport) list.push({ ...halReport, plantName: "한림공장" });

    return list;
  }, [overtimeReports, isOvertimeReportApproved]);

  // 🌟 관리자별 맞춤 미결재 특근보고서 (협력사는 비노출, 삼랑진 총괄은 삼랑진만, 한림 총괄은 한림만, 본사는 전체)
  const filteredPendingApprovalCards = useMemo(() => {
    if (isPartnerProfile) return [];
    if (isAdmin) return pendingApprovalCards;
    if (isMyeongjae) return pendingApprovalCards.filter((r) => r.plantName === "삼랑진공장");
    if (isDongwook) return pendingApprovalCards.filter((r) => r.plantName === "한림공장");
    return [];
  }, [pendingApprovalCards, isPartnerProfile, isAdmin, isMyeongjae, isDongwook]);

  const getReportWorkersList = (report) => {
    if (!report) return [];
    if (Array.isArray(report.workers) && report.workers.length > 0) {
      return report.workers;
    }
    const cleanComp = cleanCompanyName(report.company || "");
    const rawMatrix = smartOvertimeData?.attendanceMatrix || [];
    const matched = rawMatrix.filter((w) => cleanCompanyName(w.company) === cleanComp);
    if (matched.length > 0) {
      return matched.map((w, idx) => ({
        id: idx + 1,
        name: w.name,
        company: w.company,
        line: w.process || "생산",
        hours: 8,
        overtimeHours: 2,
        tasks: report.workContent || "휴일 특근 및 생산라인 가동"
      }));
    }
    return [
      { id: 1, name: "심임대", company: "(주)오륙", line: "JA G-RUN", hours: 8, overtimeHours: 2.5, tasks: "금형 교체 및 조립" },
      { id: 2, name: "이상은", company: "(주)오륙", line: "NX4 G-RUN", hours: 8, overtimeHours: 2.0, tasks: "원소재 검사 및 포장" },
      { id: 3, name: "최현영", company: "(주)오륙", line: "HR G-RUN", hours: 8, overtimeHours: 2.0, tasks: "완제품 적재 및 출하" }
    ];
  };

  // Quality Real-time data for Dashboard
  const [qualityRecords, setQualityRecords] = useState([]);
  const [qualityPopupItem, setQualityPopupItem] = useState(null);

  useEffect(() => {
    const unsub = subscribeQualityRecords((recs) => {
      setQualityRecords(recs);
    });
    return () => unsub();
  }, []);

  const handleOpenQualityPopup = (it) => {
    pushModalHistory("quality_popup");
    setQualityPopupItem(it);
  };

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

  // Shared Toast states
  const [logSavedToast, setLogSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("업무일지가 저장되었습니다.");

  const todayDateStr = useMemo(() => getKSTDateString(), []);

  // Safe selected month & PnL metrics
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

  // =========================================================================
  // 🪝 4 Dedicated Modular Custom Hooks (Step 4 Refactoring)
  // =========================================================================

  // 1. Worker Schedule & Weekly Calendar Hook
  const {
    annualLeaves,
    myActiveLeaves,
    handleDeleteLeave,
    handleReactivateLeave,
    scheduleSelectedDate,
    setScheduleSelectedDate,
    scheduleLeaveType,
    setScheduleLeaveType,
    scheduleReasonInput,
    setScheduleReasonInput,
    sharedWorkers,
    setSharedWorkers,
    isShareDropdownOpen,
    setIsShareDropdownOpen,
    shareDropdownRef,
    scheduleSaving,
    showMiniCalendar,
    setShowMiniCalendar,
    scheduleDetailModal,
    setScheduleDetailModal,
    scheduleAttachedFiles,
    isProcessingScheduleFiles,
    scheduleCameraInputRef,
    scheduleFileInputRef,
    handleScheduleFiles,
    handleRemoveScheduleFile,
    sharedReplyModalItem,
    setSharedReplyModalItem,
    replyTextInput,
    setReplyTextInput,
    replySubmitting,
    sharedSenderConfirmModalItem,
    setSharedSenderConfirmModalItem,
    confirmSubmitting,
    toggleSharedWorker,
    togglePlantSharedWorkers,
    scheduleWeekAnchor,
    handlePrevWeek,
    handleNextWeek,
    handleResetToToday,
    myWeeklyCalendarDays,
    handleRequestDismissOrDelete,
    handleSendSharedReply,
    handleConfirmSenderDismiss,
    handleRegisterSchedule
  } = useWorkerSchedule({
    currentProfile,
    workerFullName,
    workerPlant,
    officialTitle,
    isAdmin,
    todayDateStr,
    setToastMessage,
    setLogSavedToast
  });

  // 2. Company Common Schedule & Comments Hook
  const {
    commonSchedules,
    commonScheduleFilterTab,
    setCommonScheduleFilterTab,
    commonScheduleForm,
    setCommonScheduleForm,
    commonScheduleSaving,
    commonScheduleModalOpen,
    setCommonScheduleModalOpen,
    selectedCommonScheduleForComments,
    setSelectedCommonScheduleForComments,
    commonScheduleCommentInput,
    setCommonScheduleCommentInput,
    commonScheduleCommentSubmitting,
    allActiveCommonSchedules,
    hasNewScheduleMessage,
    uncompletedCommonSchedules,
    scheduleCounts,
    modalFilteredSchedules,
    handleToggleCompleteCommonSchedule,
    handleRegisterCommonSchedule,
    handleDeleteCommonSchedule,
    handleAddCommonScheduleComment,
    handleDeleteCommonScheduleComment
  } = useCommonSchedule({
    currentProfile,
    isAdmin,
    todayDateStr,
    setToastMessage,
    setLogSavedToast
  });

  // 3. Work Log CRUD, Maintenance Items, and Pagination Hook
  const {
    workLogs,
    currentLogPage,
    setCurrentLogPage,
    isModalOpen,
    setIsModalOpen,
    selectedLogDetail,
    setSelectedLogDetail,
    filterPlant,
    setFilterPlant,
    approvalCommentInput,
    setApprovalCommentInput,
    editingLog,
    setEditingLog,
    editFormData,
    setEditFormData,
    editMaintenanceItems,
    isEditProcessingImages,
    workerLogScope,
    setWorkerLogScope,
    workerLogApprovalFilter,
    setWorkerLogApprovalFilter,
    formData,
    setFormData,
    isSavingLog,
    isProcessingImages,
    previewImageModal,
    setPreviewImageModal,
    maintenanceItems,
    pendingSamrangjinCount,
    pendingHallimCount,
    todayLog,
    workerLogsList,
    filteredLogs,
    totalLogPages,
    paginatedLogs,
    handleOpenWorkLogModal,
    handleOpenLogDetail,
    handleWorkLogImageFiles,
    handleRemoveWorkLogImage,
    handleAddMaintenanceItem,
    handleRemoveMaintenanceItem,
    handleUpdateMaintenanceItem,
    handleMaintenanceItemImageFiles,
    handleRemoveMaintenanceItemImage,
    handleApproveLog,
    handleBatchApproveLogs,
    handleRejectLog,
    handleSaveLog,
    handleDeleteLog,
    handleOpenEditModal,
    handleEditLogImageFiles,
    handleRemoveEditLogImage,
    handleAddEditMaintenanceItem,
    handleRemoveEditMaintenanceItem,
    handleUpdateEditMaintenanceItem,
    handleEditMaintenanceItemImageFiles,
    handleRemoveEditMaintenanceItemImage,
    handleSaveEditedLog
  } = useWorkLogCrud({
    currentProfile,
    workerFullName,
    workerPlant,
    workerPosition,
    workerDept,
    assignedProcess,
    officialTitle,
    isAdmin,
    isMyeongjae,
    isDongwook,
    isInjoo,
    isJaeyul,
    isQualityWorker,
    isOperator,
    setToastMessage,
    setLogSavedToast
  });

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
  }, [handleOpenWorkLogModal]);

  // 4. Dashboard Excel (Quality & General PnL) Hook
  const {
    dailyPnLModalOpen,
    setDailyPnLModalOpen,
    sendingDailyPnL,
    customPnLBriefing,
    setCustomPnLBriefing,
    selectedPnLChannel,
    setSelectedPnLChannel,
    handleSendDailyPnLTelegram,
    qualityFiles,
    setQualityFiles,
    qualityUploadSuccess,
    setQualityUploadSuccess,
    qualityFileInputRef,
    handleQualityFiles,
    handleQualityDrag,
    handleQualityDrop,
    qualityDragActive,
    qualityParsing,
    qualityUploading,
    qualitySuccessMessage,
    handleConfirmQualityUpload,
    fileInputRef,
    dragActive,
    parsing,
    uploading,
    parsedResult,
    setParsedResult,
    uploadSuccess,
    setUploadSuccess,
    successMessage,
    handleExcelFile,
    handleDrag,
    handleDrop,
    handleConfirmExcelUpload
  } = useDashboardExcel({
    workerFullName,
    workerPlant,
    selectedMonth,
    currentYearMonth,
    uploadMonthlyData,
    onBulkUpload,
    changeMonth,
    uncompletedCommonSchedules,
    todayDateStr,
    totalSales,
    totalPurchases,
    salesAchievementPct,
    purchaseAchievementPct,
    setToastMessage,
    setLogSavedToast
  });

  // 🌟 압출동 일반 현장작업자 로그인 시
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

  // 🌟 한울 외주가공 현장작업자
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

  // 🌟 삼랑진공장 가공동 현장작업자 (JA, NX4, NX4a, HR G/RUN 4대 차종)
  const isMachiningOperatorWorker =
    Boolean(currentProfile?.isFieldWorker) &&
    isMachiningWorkerProfile(currentProfile) &&
    !isAdmin;

  if (isMachiningOperatorWorker) {
    return (
      <MachiningWorkerDashboardView
        onNavigateTab={onNavigateTab}
      />
    );
  }

  // 🌟 (주)유성 외주가공 현장작업자 (JK1 Part'g, CE1 Part'g, DT Hood)
  const isYuseongOperatorWorker =
    Boolean(currentProfile?.isFieldWorker) &&
    isYuseongWorkerProfile(currentProfile) &&
    !isAdmin;

  if (isYuseongOperatorWorker) {
    return (
      <YuseongWorkerDashboardView
        onNavigateTab={onNavigateTab}
      />
    );
  }

  return (
    <div className="space-y-2.5 sm:space-y-3 animate-fadeIn pb-12 max-w-[1600px] w-full mx-auto px-0.5 sm:px-0 min-w-0 max-w-full">
      {!isManagerOrAdmin ? (
        /* 🏭 [현장 작업자 전용 모드] */
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
          {/* 👔 [역할별 격리된 관리자 대시보드 뷰 분기] */}
          {isHanulManager ? (
            /* 1. 한울 외주가공 관리자 뷰 (외주 정산, 품질 경보, 9BQC/LQ2a 일보, 한울 근태) */
            <HanulManagerDashboardView
              isAdmin={isAdmin}
              hasNewScheduleMessage={hasNewScheduleMessage}
              allActiveCommonSchedules={allActiveCommonSchedules}
              setSelectedCommonScheduleForComments={setSelectedCommonScheduleForComments}
              todayDateStr={todayDateStr}
              isGeneralManager={isGeneralManager}
              handleDeleteCommonSchedule={handleDeleteCommonSchedule}
              setCommonScheduleModalOpen={setCommonScheduleModalOpen}
              workerPlant={workerPlant}
              workerFullName={workerFullName}
              onNavigateTab={onNavigateTab}
              pendingCount={pendingCount}
              holdCount={holdCount}
              officialTitle={officialTitle}
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
              isHanul={isHanul}
              handleOpenHanulSettlementModal={handleOpenHanulSettlementModal}
              setIsHanulQualityIssueModalOpen={setIsHanulQualityIssueModalOpen}
              activeHanulQualityCount={activeHanulQualityCount}
              handleOpenHanulReport={handleOpenHanulReport}
              SevereDisasterBar={SevereDisasterBar}
              todayFormattedLabel={todayFormattedLabel}
              filteredUnwrittenCompanies={filteredUnwrittenCompanies}
              filteredCompanyOverviewStats={filteredCompanyOverviewStats}
              pushModalHistory={pushModalHistory}
              setSelectedOvertimeReportForModal={setSelectedOvertimeReportForModal}
              formatKoreanWorkDate={formatKoreanWorkDate}
              selectedMonth={selectedMonth}
              liveQualityCurrentMonthly={liveQualityCurrentMonthly}
              liveQualityPrevMonthly={liveQualityPrevMonthly}
              handleOpenQualityPopup={handleOpenQualityPopup}
              extrusionSummaryList={extrusionSummaryList}
              isMyeongjae={isMyeongjae}
              isDongwook={isDongwook}
              pendingSamrangjinCount={pendingSamrangjinCount}
              pendingHallimCount={pendingHallimCount}
              setIsWorkLogsSummaryModalOpen={setIsWorkLogsSummaryModalOpen}
              filterPlant={filterPlant}
              setFilterPlant={setFilterPlant}
              workLogs={workLogs}
              paginatedLogs={paginatedLogs}
              handleOpenLogDetail={handleOpenLogDetail}
              canApproveLog={canApproveLog}
              isWorkLogApproved={isWorkLogApproved}
              handleOpenEditModal={handleOpenEditModal}
              handleDeleteLog={handleDeleteLog}
              filteredLogs={filteredLogs}
              currentLogPage={currentLogPage}
              setCurrentLogPage={setCurrentLogPage}
              LOGS_PER_PAGE={LOGS_PER_PAGE}
              totalLogPages={totalLogPages}
              handleOpenWorkLogModal={handleOpenWorkLogModal}
              activeMachiningQualityCount={activeMachiningQualityCount}
            />
          ) : isPartnerProfile ? (
            /* 2. 외주 협력사 관리자 뷰 (유성, 부림텍 등 - 소속 근태 및 공통 일정) */
            <PartnerManagerDashboardView
              isAdmin={isAdmin}
              hasNewScheduleMessage={hasNewScheduleMessage}
              allActiveCommonSchedules={allActiveCommonSchedules}
              setSelectedCommonScheduleForComments={setSelectedCommonScheduleForComments}
              todayDateStr={todayDateStr}
              isGeneralManager={isGeneralManager}
              handleDeleteCommonSchedule={handleDeleteCommonSchedule}
              setCommonScheduleModalOpen={setCommonScheduleModalOpen}
              workerPlant={workerPlant}
              workerFullName={workerFullName}
              onNavigateTab={onNavigateTab}
              pendingCount={pendingCount}
              holdCount={holdCount}
              officialTitle={officialTitle}
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
              SevereDisasterBar={SevereDisasterBar}
              handleOpenYuseongReport={handleOpenYuseongReport}
              activeYuseongQualityCount={activeYuseongQualityCount}
              todayFormattedLabel={todayFormattedLabel}
              filteredUnwrittenCompanies={filteredUnwrittenCompanies}
              filteredCompanyOverviewStats={filteredCompanyOverviewStats}
              pushModalHistory={pushModalHistory}
              setSelectedOvertimeReportForModal={setSelectedOvertimeReportForModal}
              formatKoreanWorkDate={formatKoreanWorkDate}
              selectedMonth={selectedMonth}
              liveQualityCurrentMonthly={liveQualityCurrentMonthly}
              liveQualityPrevMonthly={liveQualityPrevMonthly}
              handleOpenQualityPopup={handleOpenQualityPopup}
              extrusionSummaryList={extrusionSummaryList}
              isMyeongjae={isMyeongjae}
              isDongwook={isDongwook}
              pendingSamrangjinCount={pendingSamrangjinCount}
              pendingHallimCount={pendingHallimCount}
              setIsWorkLogsSummaryModalOpen={setIsWorkLogsSummaryModalOpen}
              filterPlant={filterPlant}
              setFilterPlant={setFilterPlant}
              workLogs={workLogs}
              paginatedLogs={paginatedLogs}
              handleOpenLogDetail={handleOpenLogDetail}
              canApproveLog={canApproveLog}
              isWorkLogApproved={isWorkLogApproved}
              handleOpenEditModal={handleOpenEditModal}
              handleDeleteLog={handleDeleteLog}
              filteredLogs={filteredLogs}
              currentLogPage={currentLogPage}
              setCurrentLogPage={setCurrentLogPage}
              LOGS_PER_PAGE={LOGS_PER_PAGE}
              totalLogPages={totalLogPages}
              handleOpenWorkLogModal={handleOpenWorkLogModal}
              setIsHanulQualityIssueModalOpen={setIsHanulQualityIssueModalOpen}
              activeHanulQualityCount={activeHanulQualityCount}
              activeMachiningQualityCount={activeMachiningQualityCount}
            />
          ) : isAdmin ? (
            /* 3. 본사 총괄 관리자 뷰 (권태형, 최미영 등 - 전사 7개 섹션 풀 관제) */
            <AdminDashboardView
              isAdmin={isAdmin}
              hasNewScheduleMessage={hasNewScheduleMessage}
              allActiveCommonSchedules={allActiveCommonSchedules}
              setSelectedCommonScheduleForComments={setSelectedCommonScheduleForComments}
              todayDateStr={todayDateStr}
              isGeneralManager={isGeneralManager}
              handleDeleteCommonSchedule={handleDeleteCommonSchedule}
              setCommonScheduleModalOpen={setCommonScheduleModalOpen}
              workerPlant={workerPlant}
              workerFullName={workerFullName}
              onNavigateTab={onNavigateTab}
              pendingCount={pendingCount}
              holdCount={holdCount}
              officialTitle={officialTitle}
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
              isHanul={isHanul}
              handleOpenHanulSettlementModal={handleOpenHanulSettlementModal}
              setIsHanulQualityIssueModalOpen={setIsHanulQualityIssueModalOpen}
              activeHanulQualityCount={activeHanulQualityCount}
              handleOpenHanulReport={handleOpenHanulReport}
              SevereDisasterBar={SevereDisasterBar}
              monthTitle={monthTitle}
              currentMonthData={currentMonthData}
              todayFormattedLabel={todayFormattedLabel}
              formatAmount={formatAmount}
              totalSales={totalSales}
              totalPurchases={totalPurchases}
              purchaseRatio={purchaseRatio}
              filteredUnwrittenCompanies={filteredUnwrittenCompanies}
              filteredCompanyOverviewStats={filteredCompanyOverviewStats}
              filteredPendingApprovalCards={filteredPendingApprovalCards}
              pushModalHistory={pushModalHistory}
              setSelectedOvertimeReportForModal={setSelectedOvertimeReportForModal}
              formatKoreanWorkDate={formatKoreanWorkDate}
              selectedMonth={selectedMonth}
              liveQualityCurrentMonthly={liveQualityCurrentMonthly}
              liveQualityPrevMonthly={liveQualityPrevMonthly}
              handleOpenQualityPopup={handleOpenQualityPopup}
              extrusionSummaryList={extrusionSummaryList}
              isMyeongjae={isMyeongjae}
              isDongwook={isDongwook}
              pendingSamrangjinCount={pendingSamrangjinCount}
              pendingHallimCount={pendingHallimCount}
              setIsWorkLogsSummaryModalOpen={setIsWorkLogsSummaryModalOpen}
              filterPlant={filterPlant}
              setFilterPlant={setFilterPlant}
              workLogs={workLogs}
              paginatedLogs={paginatedLogs}
              handleOpenLogDetail={handleOpenLogDetail}
              canApproveLog={canApproveLog}
              isWorkLogApproved={isWorkLogApproved}
              handleOpenEditModal={handleOpenEditModal}
              handleDeleteLog={handleDeleteLog}
              filteredLogs={filteredLogs}
              currentLogPage={currentLogPage}
              setCurrentLogPage={setCurrentLogPage}
              LOGS_PER_PAGE={LOGS_PER_PAGE}
              totalLogPages={totalLogPages}
              handleOpenWorkLogModal={handleOpenWorkLogModal}
              accessLogs={accessLogs}
              handleOpenWorkerLogs={handleOpenWorkerLogs}
              formatRelativeAccessTime={formatRelativeAccessTime}
            />
          ) : (
            /* 4. 사내 일반 관리자 뷰 (이명재, 김동욱, 설유철, 전재율, 조인주 등) */
            <InternalManagerDashboardView
              currentProfile={currentProfile}
              onNavigateTab={onNavigateTab}
              isAdmin={isAdmin}
              hasNewScheduleMessage={hasNewScheduleMessage}
              allActiveCommonSchedules={allActiveCommonSchedules}
              setSelectedCommonScheduleForComments={setSelectedCommonScheduleForComments}
              todayDateStr={todayDateStr}
              isGeneralManager={isGeneralManager}
              handleDeleteCommonSchedule={handleDeleteCommonSchedule}
              setCommonScheduleModalOpen={setCommonScheduleModalOpen}
              workerPlant={workerPlant}
              workerFullName={workerFullName}
              pendingCount={pendingCount}
              holdCount={holdCount}
              officialTitle={officialTitle}
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
              ADMIN_USERS={ADMIN_USERS}
              PLANTS={PLANTS}
              myActiveLeaves={myActiveLeaves}
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
              SevereDisasterBar={SevereDisasterBar}
              monthTitle={monthTitle}
              currentMonthData={currentMonthData}
              todayFormattedLabel={todayFormattedLabel}
              formatAmount={formatAmount}
              totalSales={totalSales}
              totalPurchases={totalPurchases}
              purchaseRatio={purchaseRatio}
              filteredUnwrittenCompanies={filteredUnwrittenCompanies}
              filteredCompanyOverviewStats={filteredCompanyOverviewStats}
              filteredPendingApprovalCards={filteredPendingApprovalCards}
              pushModalHistory={pushModalHistory}
              setSelectedOvertimeReportForModal={setSelectedOvertimeReportForModal}
              formatKoreanWorkDate={formatKoreanWorkDate}
              selectedMonth={selectedMonth}
              liveQualityCurrentMonthly={liveQualityCurrentMonthly}
              liveQualityPrevMonthly={liveQualityPrevMonthly}
              handleOpenQualityPopup={handleOpenQualityPopup}
              isExtrusionWorker={isExtrusionWorker}
              isMyeongjae={isMyeongjae}
              isJaeyul={isJaeyul}
              isHallim={isHallim}
              extrusionSummaryList={extrusionSummaryList}
              isDongwook={isDongwook}
              pendingSamrangjinCount={pendingSamrangjinCount}
              pendingHallimCount={pendingHallimCount}
              setIsWorkLogsSummaryModalOpen={setIsWorkLogsSummaryModalOpen}
              filterPlant={filterPlant}
              setFilterPlant={setFilterPlant}
              workLogs={workLogs}
              paginatedLogs={paginatedLogs}
              handleOpenLogDetail={handleOpenLogDetail}
              canApproveLog={canApproveLog}
              isWorkLogApproved={isWorkLogApproved}
              handleOpenEditModal={handleOpenEditModal}
              handleDeleteLog={handleDeleteLog}
              filteredLogs={filteredLogs}
              currentLogPage={currentLogPage}
              setCurrentLogPage={setCurrentLogPage}
              LOGS_PER_PAGE={LOGS_PER_PAGE}
              totalLogPages={totalLogPages}
              handleOpenWorkLogModal={handleOpenWorkLogModal}
              setIsHanulQualityIssueModalOpen={setIsHanulQualityIssueModalOpen}
              activeHanulQualityCount={activeHanulQualityCount}
              activeMachiningQualityCount={activeMachiningQualityCount}
              activeExtrusionQualityCount={activeExtrusionQualityCount}
            />
          )}
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
        isYuseongWorkReportModalOpen={isYuseongWorkReportModalOpen}
        setIsYuseongWorkReportModalOpen={setIsYuseongWorkReportModalOpen}
        yuseongReportProject={yuseongReportProject}
        yuseongReportEditData={yuseongReportEditData}
      />

      {/* ⚡ 현장 모바일 초중종/TPM 간편 점검 모달 */}
      <DigitalInspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
      />
    </div>
  );
};

export default WorkerDashboard;
