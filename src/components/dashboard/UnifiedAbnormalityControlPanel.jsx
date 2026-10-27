import React, { useState, useEffect, useMemo } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Camera,
  Activity,
  Calendar,
  Factory,
  Wrench,
  ChevronDown,
  ChevronUp,
  Layers,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Info,
  SlidersHorizontal,
  XCircle,
  TrendingDown,
  ShieldAlert,
  Flame,
  User,
  Eye,
  Check,
  Edit3,
  X,
  Upload,
  Plus,
  Table as TableIcon,
  LayoutList,
  Users
} from "lucide-react";
import {
  subscribeUrgentIssues,
  getLocalUrgentIssues,
  addIssueReply,
  updateUrgentIssueActionResult
} from "../../services/urgentIssueService";
import { subscribeToExtrusionReports } from "../../services/extrusionProductionService";
import {
  subscribeExtrusionQualityIssues,
  getLocalExtrusionQualityIssues,
  saveExtrusionQualityIssue
} from "../../services/extrusionQualityIssueService";
import {
  subscribeHanulQualityIssues,
  getLocalHanulQualityIssues,
  saveHanulQualityIssue
} from "../../services/hanulQualityIssueService";
import {
  subscribeYuseongQualityIssues,
  getLocalYuseongQualityIssues,
  saveYuseongQualityIssue
} from "../../services/yuseongQualityIssueService";
import {
  subscribeMachiningQualityIssues,
  getLocalMachiningQualityIssues,
  saveMachiningQualityIssue
} from "../../services/machiningQualityIssueService";
import {
  getCore4MId,
  getNormalizedTitleKey,
  mergeUnified4MRecords,
  subscribeFourMChangePoints,
  getLocalFourMChangePoints,
  registerToFourMLedger,
  unregisterFromFourMLedger,
  determineFourMCategory,
  autoSyncAllQualityIssuesToFourMLedger,
  syncQualityAlertToFourMLedger,
  updateFourMClassification,
  getFourMBadgeColor
} from "../../services/fourMChangePointService";
import {
  subscribeSmartOvertimeData,
  getLocalSmartOvertimeData,
  cleanCompanyName,
  isWeekendByDate
} from "../../services/overtimeSmartService";
import {
  subscribe4MAbsenceLogs,
  getLocal4MAbsenceLogsMap
} from "../../services/absence4MService";
import {
  subscribePersonnelCards,
  getLocalPersonnelCardsMap
} from "../../services/personnelCardService";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import WorkReportNonconformanceLedgerPanel from "../common/WorkReportNonconformanceLedgerPanel";
import Step2ProductionManagerPanel from "../production/Step2ProductionManagerPanel";
import Step3QualityControlPanel from "../quality/Step3QualityControlPanel";
import Step4ExecutiveApprovalPanel from "../executive/Step4ExecutiveApprovalPanel";
import * as XLSX from "xlsx";

// Image compression helper for modal photo uploads
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
          dataUrl
        });
      };
    };
  });
};

export const UnifiedAbnormalityControlPanel = ({
  workLogs = [],
  onOpenWorkLogDetail = null,
  onOpenIssueModal = null,
  onOpenExtrusionReport = null,
  currentProfile = null,
  onNavigateTab = null
}) => {
  // Real-time state streams
  const [urgentIssues, setUrgentIssues] = useState(() => getLocalUrgentIssues());
  const [extrusionReports, setExtrusionReports] = useState([]);
  const [extrusionQualityAlerts, setExtrusionQualityAlerts] = useState(() => getLocalExtrusionQualityIssues());
  const [hanulQualityIssues, setHanulQualityIssues] = useState(() => getLocalHanulQualityIssues());
  const [yuseongQualityIssues, setYuseongQualityIssues] = useState(() => getLocalYuseongQualityIssues());
  const [machiningQualityIssues, setMachiningQualityIssues] = useState(() => getLocalMachiningQualityIssues());
  const [fourMLedgerRecords, setFourMLedgerRecords] = useState(() => getLocalFourMChangePoints());
  const [fourMRevision, setFourMRevision] = useState(0);
  const [smartOvertimeData, setSmartOvertimeData] = useState(() => getLocalSmartOvertimeData());
  const [absenceLogsMap, setAbsenceLogsMap] = useState(() => getLocal4MAbsenceLogsMap());
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  // View Mode: 'table' (1-line ledger table) vs 'card' (detailed cards)
  const [viewMode, setViewMode] = useState("table");

  // Filter States
  const [selectedPlant, setSelectedPlant] = useState("ALL"); // ALL | 삼랑진공장 | 한림공장
  const [selected4MTab, setSelected4MTab] = useState("ALL"); // ALL | MACHINE | MAN | MATERIAL | METHOD | OFFICIAL_LEDGER
  const [selectedOriginFilter, setSelectedOriginFilter] = useState("ALL"); // ALL | OFFICIAL_LEDGER | 설비수리 | 비가동 | 불량손실 | TPM이상신고 | 품질경보 | 결근발생 | 4M대체투입
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL"); // ALL | PENDING | RESOLVED
  const [selectedPhotoFilter, setSelectedPhotoFilter] = useState("ALL"); // ALL | ONLY_PHOTOS
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("ALL"); // ALL | TODAY | WEEK | custom YYYY-MM-DD
  const [customDateInput, setCustomDateInput] = useState("");

  // Modal / Detail state
  const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Action form state inside Detail Modal
  const [actionInputText, setActionInputText] = useState("");
  const [actionAuthorInput, setActionAuthorInput] = useState(currentProfile?.name || "관리자");
  const [actionPhotos, setActionPhotos] = useState([]);
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [personnelCardsMap, setPersonnelCardsMap] = useState(() => getLocalPersonnelCardsMap());

  // Subscriptions
  useEffect(() => {
    setIsLoading(true);

    // 1. Urgent Issues (품질경보 실시간 수신)
    const unsubIssues = subscribeUrgentIssues((issues) => {
      setUrgentIssues(issues || []);
      setIsLoading(false);
    });

    // 2. Extrusion Reports (압출 작업일보, TPM 이상신고, 비가동/불량)
    const unsubExt = subscribeToExtrusionReports((reports) => {
      setExtrusionReports(reports || []);
    });

    // 3. Extrusion Quality Issues (압출 부적합경보 실시간 수신)
    const unsubExtQuality = subscribeExtrusionQualityIssues((alerts) => {
      setExtrusionQualityAlerts(alerts || []);
    });

    // 3-B. Hanul Quality Issues (한울 부적합경보 실시간 수신)
    const unsubHanulQuality = subscribeHanulQualityIssues((alerts) => {
      setHanulQualityIssues(alerts || []);
    });

    // 3-C. Yuseong Quality Issues (유성 부적합경보 실시간 수신)
    const unsubYuseongQuality = subscribeYuseongQualityIssues((alerts) => {
      setYuseongQualityIssues(alerts || []);
    });

    // 3-D. Machining Quality Issues (가공동 부적합경보 실시간 수신)
    const unsubMachQuality = subscribeMachiningQualityIssues((alerts) => {
      setMachiningQualityIssues(alerts || []);
    });

    // 4. Official 4M Change Point Ledger (공식 변동점 관리대장 실시간 수신)
    const unsubLedger = subscribeFourMChangePoints((ledgerList) => {
      setFourMLedgerRecords(ledgerList || []);
    });

    // 5. Smart Overtime & 5 Companies Attendance Data
    const unsubSmartOt = subscribeSmartOvertimeData((data) => {
      if (data) {
        setSmartOvertimeData(data);
      }
    });

    // 6. 4M Absence / Substitute Logs
    const unsubAbsenceLogs = subscribe4MAbsenceLogs((logs) => {
      if (logs) {
        setAbsenceLogsMap(logs);
      }
    });

    // 7. Personnel Cards (인사카드 실시간 수신 및 동기화)
    const unsubCards = subscribePersonnelCards((cards) => {
      if (cards) {
        setPersonnelCardsMap(cards);
      }
    });

    const handleCardEvent = (e) => {
      if (e.detail?.cardData) {
        const { cardKey, cardData } = e.detail;
        setPersonnelCardsMap((prev) => ({
          ...prev,
          [cardKey]: cardData,
          [`${cleanCompanyName(cardData.company)}_${cardData.name}`]: cardData,
          [`${cardData.company}_${cardData.name}`]: cardData
        }));
      }
    };
    const handleFourMOverrideEvent = () => {
      setFourMLedgerRecords(getLocalFourMChangePoints());
      setFourMRevision((r) => r + 1);
    };
    window.addEventListener("oryuk_personnel_card_updated", handleCardEvent);
    window.addEventListener("fourM_override_updated", handleFourMOverrideEvent);

    return () => {
      if (unsubIssues) unsubIssues();
      if (unsubExt) unsubExt();
      if (unsubExtQuality) unsubExtQuality();
      if (unsubHanulQuality) unsubHanulQuality();
      if (unsubYuseongQuality) unsubYuseongQuality();
      if (unsubMachQuality) unsubMachQuality();
      if (unsubLedger) unsubLedger();
      if (unsubSmartOt) unsubSmartOt();
      if (unsubAbsenceLogs) unsubAbsenceLogs();
      if (unsubCards) unsubCards();
      window.removeEventListener("oryuk_personnel_card_updated", handleCardEvent);
      window.removeEventListener("fourM_override_updated", handleFourMOverrideEvent);
    };
  }, []);


  const handleManualRefresh = () => {
    setLastRefreshedAt(new Date());
    setUrgentIssues(getLocalUrgentIssues());
    setExtrusionQualityAlerts(getLocalExtrusionQualityIssues());
    setHanulQualityIssues(getLocalHanulQualityIssues());
    setYuseongQualityIssues(getLocalYuseongQualityIssues());
    setMachiningQualityIssues(getLocalMachiningQualityIssues());
    setFourMLedgerRecords(getLocalFourMChangePoints());
    setSmartOvertimeData(getLocalSmartOvertimeData());
    setAbsenceLogsMap(getLocal4MAbsenceLogsMap());
    setPersonnelCardsMap(getLocalPersonnelCardsMap());
  };

  // Safe date normalizer (YYYY-MM-DD)
  const normalizeDateStr = (raw, fallback = "") => {
    if (!raw) return fallback;
    if (typeof raw === "object" && raw.seconds) {
      return new Date(raw.seconds * 1000).toISOString().slice(0, 10);
    }
    const str = String(raw).trim();
    const match = str.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
    if (match) {
      return `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(match[3]).padStart(2, "0")}`;
    }
    return str.slice(0, 10) || fallback;
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // =========================================================================
  // 🌟 엄선된 4M 변동점 데이터 취합 (오픈이슈/회의/공지/타관리자일지 제외)
  // =========================================================================
  const allUnifiedRecords = useMemo(() => {
    const unified = [];

    // -----------------------------------------------------------------------
    // 1. [Method/Machine/Material] 관리자 품질경보 및 부적합/결함 변동점 취합
    // -----------------------------------------------------------------------
    (urgentIssues || []).forEach((issue) => {
      if (!issue) return;
      const isDel = issue.isDeleted === true || issue.isDeleted === "true" || issue.deleted === true;

      const rawCat = String(issue.category || "").trim();
      // 🔒 오픈이슈, 회의일정, 사내공지는 4M 변동점 관리대장에서 완전 제외
      if (
        rawCat === "오픈이슈" ||
        rawCat === "open_issue" ||
        rawCat.includes("오픈이슈") ||
        rawCat === "회의일정" ||
        rawCat.includes("회의") ||
        rawCat === "공지사항" ||
        rawCat === "사내공지" ||
        rawCat === "공유사항"
      ) {
        return;
      }

      const catLower = rawCat.toLowerCase();
      const titleLower = String(issue.title || "").toLowerCase();
      const contentLower = String(issue.content || "").toLowerCase();

      const isQualityAlert =
        rawCat === "품질경보" ||
        rawCat === "부적합경보" ||
        rawCat === "품질 경보" ||
        rawCat === "부적합 경보" ||
        rawCat === "품질이슈" ||
        rawCat === "품질 이슈" ||
        catLower === "quality_alert" ||
        catLower === "quality_issue" ||
        catLower === "quality" ||
        rawCat.includes("품질경보") ||
        rawCat.includes("부적합경보") ||
        rawCat.includes("품질") ||
        rawCat.includes("부적합") ||
        issue.type === "QUALITY_ALERT" ||
        issue.type === "품질경보" ||
        titleLower.includes("품질경보") ||
        titleLower.includes("부적합경보") ||
        titleLower.includes("가류조") ||
        titleLower.includes("코팅") ||
        titleLower.includes("클립") ||
        titleLower.includes("불량") ||
        titleLower.includes("이상") ||
        contentLower.includes("가류조") ||
        contentLower.includes("코팅") ||
        contentLower.includes("클립");

      if (!isQualityAlert) return; // 품질/부적합 및 결함 이상만 수집

      const rawDate =
        issue.date ||
        issue.expireDate ||
        issue.startDate ||
        issue.targetDate ||
        (issue.createdAt ? issue.createdAt : todayStr);
      const dateStr = normalizeDateStr(rawDate, todayStr);

      const isResolved = Boolean(
        issue.isResolved || (issue.actionResult && issue.actionResult.trim()) || isDel
      );

      const displayTitle = issue.title || issue.content || "(부적합경보 발령)";
      const displayContent = issue.content || issue.details || "";

      unified.push({
        id: `urg_${issue.id || issue._docId || Math.random()}`,
        fourM: determineFourMCategory(issue),
        origin: "부적합경보",
        sourceType: "QUALITY_ALERT",
        badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800",
        plant: issue.plant || "삼랑진공장",
        line: issue.line || issue.process || "품질/제조",
        writer: issue.author ? `${issue.author} ${issue.authorTitle || ""}`.trim() : "품질관리자",
        title: displayTitle,
        date: dateStr,
        time: issue.time || (issue.createdAt && issue.createdAt.includes(":") ? issue.createdAt.slice(11, 16) : ""),
        content: displayContent,
        actionResult: issue.actionResult || "",
        actionAuthor: issue.actionAuthor || "",
        actionAt: issue.actionAt || "",
        images: Array.isArray(issue.images) ? issue.images : [],
        actionImages: Array.isArray(issue.actionImages) ? issue.actionImages : [],
        replies: Array.isArray(issue.replies) ? issue.replies : [],
        isResolved,
        validation: isResolved ? "초·중·종물 한도견본 대조 및 유효성 확인" : "유효성 검증 대기중",
        severity: "HIGH",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: issue
      });
    });

    // -----------------------------------------------------------------------
    // 2. [Machine] 전재율 책임의 설비수리이력만 취합 (실제 등록된 수리내역 추출)
    // -----------------------------------------------------------------------
    (workLogs || []).forEach((log) => {
      if (log.isDeleted) return;

      // 전재율 책임 또는 설비보전 일지만 엄격 필터링
      const isJeonOrMaintenance = log.writer === "전재율" || log.process === "설비보전" || (Array.isArray(log.maintenanceItems) && log.maintenanceItems.length > 0) || (typeof log.maintenanceItems === "string" && log.maintenanceItems.includes("content"));
      if (!isJeonOrMaintenance) return;

      // 1. maintenanceItems 안전 파싱
      let mItems = [];
      if (Array.isArray(log.maintenanceItems)) {
        mItems = log.maintenanceItems;
      } else if (typeof log.maintenanceItems === "string" && log.maintenanceItems.trim().startsWith("[")) {
        try {
          mItems = JSON.parse(log.maintenanceItems);
        } catch (e) {
          mItems = [];
        }
      }

      // 2. 실제 구체적인 수리 내용 요약 (한줄 제목용)
      let repairSummaryTitle = "";
      if (mItems.length > 0) {
        repairSummaryTitle = mItems
          .map((m) => {
            const eq = m.equipmentName && m.equipmentName !== "직접입력" && m.equipmentName !== "내용직접입력" ? `[${m.equipmentName}] ` : "";
            return `${eq}${m.content || ""}`.trim();
          })
          .filter(Boolean)
          .join(" / ");
      }

      if (!repairSummaryTitle && log.workContent) {
        const cleanLines = log.workContent
          .split("\n")
          .map((l) => l.replace(/^[•\-\*\[\d\]\s>]+/, "").replace(/설비보전내용:\s*/, "").trim())
          .filter(Boolean);
        repairSummaryTitle = cleanLines.slice(0, 2).join(" / ");
      }

      // 대표 설비명 요약
      const lineOrEquipment = log.line || (mItems[0] ? `${mItems[0].category}(${mItems[0].equipmentName || ""})` : "설비보전");
      const displayTitle = repairSummaryTitle || `[${lineOrEquipment}] 점검 및 보전수리`;

      // 상세 내용 서식화
      const maintDetailList = mItems
        .map((m, idx) => `[${idx + 1}] ${m.category || "설비"} > ${m.equipmentName || "일반"}\n• 설비보전내용: ${m.content || ""}`)
        .join("\n\n");

      const fullContent = [
        maintDetailList ? `[설비보전 및 수리점검 내역]\n${maintDetailList}` : "",
        !maintDetailList && log.workContent ? `[작업 상세]\n${log.workContent}` : "",
        log.issues && log.issues !== "-" && log.issues !== "없음" ? `[특이 이상발생]\n${log.issues}` : ""
      ].filter(Boolean).join("\n\n");

      // 사진 파싱
      let parsedImages = [];
      if (Array.isArray(log.images)) parsedImages = log.images;
      else if (Array.isArray(log.photos)) parsedImages = log.photos;
      else if (typeof log.images === "string" && log.images.trim().startsWith("[")) {
        try { parsedImages = JSON.parse(log.images); } catch (e) {}
      } else if (typeof log.photos === "string" && log.photos.trim().startsWith("[")) {
        try { parsedImages = JSON.parse(log.photos); } catch (e) {}
      }

      unified.push({
        id: `wl_maint_${log.id}`,
        fourM: "Machine",
        origin: "설비수리",
        sourceType: "MAINTENANCE",
        badgeColor: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700",
        plant: log.plant || "삼랑진공장",
        line: lineOrEquipment,
        writer: "전재율 책임",
        title: displayTitle,
        date: log.date || todayStr,
        time: log.createdAt ? log.createdAt.slice(11, 16) : "",
        content: fullContent || log.workContent || displayTitle,
        actionResult: log.approvalComment || "수리 및 점검 조치 완료",
        actionAuthor: log.approverName || "전재율",
        actionAt: log.approvalDate || log.date || "",
        images: parsedImages,
        actionImages: [],
        replies: [],
        isResolved: true,
        validation: "설비 점검 및 보전수리 초물 가동 합격",
        severity: "NORMAL",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: log
      });
    });

    // -----------------------------------------------------------------------
    // 3. [Machine & Material] 작업자 작업일보 - TPM 이상발생, 비가동, 불량손실
    // -----------------------------------------------------------------------
    (extrusionReports || []).forEach((report) => {
      // 3-1. TPM 이상신고 (Machine)
      const hasTpmText = Boolean(report.tpmIssueText && report.tpmIssueText.trim());
      const hasTpmPhotos = Array.isArray(report.tpmIssuePhotos) && report.tpmIssuePhotos.length > 0;
      const abnormalChecks = (report.tpmChecks || []).filter((c) => c && (c.status === "WARN" || c.status === "NG"));

      if (hasTpmText || hasTpmPhotos || abnormalChecks.length > 0) {
        const checkSummary = abnormalChecks
          .map((c) => `• [${c.status === "NG" ? "불량" : "요관찰"}] ${c.id}: ${c.note || "조치필요"}`)
          .join("\n");

        const fullContent = [
          hasTpmText ? `[현장 이상신고] ${report.tpmIssueText}` : "",
          abnormalChecks.length > 0 ? `[TPM 10대 자주보전 점검]\n${checkSummary}` : ""
        ].filter(Boolean).join("\n\n");

        const tpmDisplayTitle = report.tpmIssueText
          ? `[${report.lineName || report.lineId || "압출"}] ${report.tpmIssueText}`
          : `[TPM 이상] ${report.lineName || report.lineId} 자주보전 이상신고`;

        unified.push({
          id: `ext_tpm_${report.id}`,
          fourM: "Machine",
          origin: "TPM 이상신고",
          sourceType: "EXTRUSION_TPM",
          badgeColor: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700",
          plant: report.plant || "삼랑진공장",
          line: report.lineName || report.lineId || "압출라인",
          writer: report.worker || "압출 작업자",
          title: tpmDisplayTitle,
          date: report.date || todayStr,
          time: report.createdAt ? report.createdAt.slice(11, 16) : "",
          content: fullContent,
          actionResult: report.notes || "",
          actionAuthor: report.approvedBy || "",
          actionAt: report.approvedAt || "",
          images: report.tpmIssuePhotos || [],
          actionImages: [],
          replies: [],
          isResolved: report.approvalStatus === "승인",
          validation: report.approvalStatus === "승인" ? "TPM 조치 및 자주보전 검증 완료" : "TPM 점검 및 조치 진행중",
          severity: abnormalChecks.some((c) => c.status === "NG") ? "HIGH" : "MEDIUM",
          downtimeMinutes: 0,
          scrapKg: 0,
          raw: report
        });
      }

      // 3-2. 비가동 (Machine) & 불량손실 (Material)
      const dtEvents = Array.isArray(report.downtimeEvents) ? report.downtimeEvents : [];
      dtEvents.forEach((ev, evIdx) => {
        const catClean = String(ev.category || "").replace(/\s+/g, "").toUpperCase();
        // ⭐ 사용자 요청: 압개시, 형교환, 종료, 기술TRY 항목은 일상 셋업/정상 공정 비가동이므로 4M 변동점 적용에서 완전 제외
        if (
          catClean === "압개시" ||
          catClean === "형교환" ||
          catClean === "종료" ||
          catClean === "기술TRY" ||
          catClean.startsWith("압개시") ||
          catClean.startsWith("형교환") ||
          catClean.startsWith("종료") ||
          catClean.startsWith("기술TRY")
        ) {
          return;
        }

        const isDefect = ev.type === "불량" || ["뜯김", "철심", "재압출", "단면형상", "스코치", "이물", "미분산", "발포", "원인불명", "밴딩", "심금절단", "심금노출", "천공", "연고무절단", "길이", "코팅"].includes(ev.category);
        const minutes = Number(ev.minutes) || 0;
        const scrapKg = Number(ev.scrapKg) || 0;

        if (minutes > 0 || scrapKg > 0 || ev.detail) {
          const fourMType = isDefect ? "Material" : "Machine";
          const originName = isDefect ? "불량손실" : "비가동";

          unified.push({
            id: `ext_dt_${report.id}_${ev.id || evIdx}`,
            fourM: fourMType,
            origin: originName,
            sourceType: isDefect ? "EXTRUSION_DEFECT" : "EXTRUSION_DOWNTIME",
            badgeColor: isDefect
              ? "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700"
              : "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 border-orange-300 dark:border-orange-700",
            plant: report.plant || "삼랑진공장",
            line: report.lineName || report.lineId || "압출라인",
            writer: report.worker || "압출 작업자",
            title: `[${report.lineName || report.lineId || "압출"}] ${ev.category} ${ev.detail ? `(${ev.detail})` : ""}`,
            date: report.date || todayStr,
            time: ev.startTime ? `${ev.startTime}~${ev.endTime}` : (report.createdAt ? report.createdAt.slice(11, 16) : ""),
            content: ev.detail || `${ev.category} 발생으로 인한 ${originName}`,
            actionResult: report.notes || "현장 라인 즉시 조치 및 정상 가동",
            actionAuthor: report.worker || "작업자",
            actionAt: report.approvedAt || report.date || "",
            images: [],
            actionImages: [],
            replies: [],
            isResolved: true,
            validation: isDefect ? "불량 원인제거 및 유효성 확인" : "라인 정상가동 및 초물검사 완료",
            severity: scrapKg >= 10 || minutes >= 60 ? "HIGH" : "NORMAL",
            downtimeMinutes: minutes,
            scrapKg: scrapKg,
            raw: { report, event: ev }
          });
        }
      });
    });

    // -----------------------------------------------------------------------
    // 4. [Method] 압출 전용 품질 이슈 (부적합경보)
    // -----------------------------------------------------------------------
    (extrusionQualityAlerts || []).forEach((alert) => {
      if (!alert || alert.id === "ext_qual_demo_1" || alert.id === "ext_qual_demo_2" || String(alert.id).startsWith("demo_")) return;

      const title = alert.title
        ? `[부적합경보] ${alert.title}`
        : `[부적합경보] ${alert.defectType || "압출 품질이상"}`;
      const content = alert.content || alert.details || alert.description || alert.defectType || "";
      const dateStr = normalizeDateStr(alert.date || alert.createdAt, todayStr);
      const isResolved = Boolean(alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.isResolved || (alert.actionResult && alert.actionResult.trim().length > 0));

      const causeImages = Array.isArray(alert.causeImages)
        ? alert.causeImages
        : Array.isArray(alert.images)
        ? alert.images
        : [];
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      unified.push({
        id: `ext_q_${alert.id}`,
        fourM: determineFourMCategory(alert),
        origin: "부적합경보",
        sourceType: "QUALITY_ALERT",
        badgeColor: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700",
        plant: alert.plant || "삼랑진공장",
        line: alert.line || alert.lineId || "압출라인",
        writer: alert.author ? `${alert.author} ${alert.authorTitle || ""}`.trim() : "설유철 책임",
        title: title,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        content: content,
        actionResult: alert.actionResult || alert.actionNotes || alert.actionGuide || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionAt: alert.updatedAt || alert.actionAt || "",
        images: causeImages,
        actionImages: actionImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        isResolved: isResolved,
        validation: isResolved ? "압출 부적합경보 조치 및 유효성 확인 완료" : "유효성 검증 대기중",
        severity: "HIGH",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: alert
      });
    });

    // -----------------------------------------------------------------------
    // 4-B. 한울 외주가공 부적합경보
    // -----------------------------------------------------------------------
    (hanulQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.status === "DELETED") return;

      const title = alert.title
        ? `[한울 부적합] ${alert.title}`
        : `[한울 부적합] ${alert.defectType || "한울 품질이상"}`;
      const content = alert.content || alert.defectType || "";
      const dateStr = normalizeDateStr(alert.targetDate || alert.date || alert.createdAt, todayStr);
      const isResolved = Boolean(alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.isResolved || (alert.actionResult && alert.actionResult.trim().length > 0));

      const causeImages = Array.isArray(alert.causeImages)
        ? alert.causeImages
        : Array.isArray(alert.images)
        ? alert.images
        : [];
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      unified.push({
        id: `hanul_q_${alert.id}`,
        fourM: determineFourMCategory(alert),
        origin: "부적합경보",
        sourceType: "QUALITY_ALERT",
        badgeColor: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700",
        plant: alert.plant || "한림공장",
        line: alert.line || "외주가공(한울)",
        writer: alert.author ? `${alert.author} ${alert.authorTitle || ""}`.trim() : "한울 관리자",
        title: title,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        content: content,
        actionResult: alert.actionResult || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionAt: alert.actionAt || alert.updatedAt || "",
        images: causeImages,
        actionImages: actionImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        isResolved: isResolved,
        validation: isResolved ? "한울 부적합경보 조치 및 유효성 확인 완료" : "유효성 검증 대기중",
        severity: alert.severity || "HIGH",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: alert
      });
    });

    // -----------------------------------------------------------------------
    // 4-C. 유성 외주가공 부적합경보
    // -----------------------------------------------------------------------
    (yuseongQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.status === "DELETED") return;

      const title = alert.title
        ? `[유성 부적합] ${alert.title}`
        : `[유성 부적합] ${alert.defectType || "유성 품질이상"}`;
      const content = alert.content || alert.description || alert.defectType || "";
      const dateStr = normalizeDateStr(alert.date || alert.createdAt, todayStr);
      const isResolved = Boolean(alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.isResolved || (alert.actionResult && alert.actionResult.trim().length > 0));

      const causeImages = Array.isArray(alert.causeImages)
        ? alert.causeImages
        : Array.isArray(alert.images)
        ? alert.images
        : [];
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      unified.push({
        id: `ys_q_${alert.id}`,
        fourM: determineFourMCategory(alert),
        origin: "부적합경보",
        sourceType: "QUALITY_ALERT",
        badgeColor: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700",
        plant: alert.plant || "삼랑진공장",
        line: alert.project || alert.line || "외주가공(유성)",
        writer: alert.author ? `${alert.author} ${alert.authorTitle || ""}`.trim() : "유성 관리자",
        title: title,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        content: content,
        actionResult: alert.actionResult || alert.actionNotes || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionAt: alert.actionAt || alert.updatedAt || "",
        images: causeImages,
        actionImages: actionImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        isResolved: isResolved,
        validation: isResolved ? "유성 부적합경보 조치 및 유효성 확인 완료" : "유효성 검증 대기중",
        severity: alert.severity || "HIGH",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: alert
      });
    });

    // -----------------------------------------------------------------------
    // 4-D. 가공동 부적합경보
    // -----------------------------------------------------------------------
    (machiningQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.status === "DELETED") return;

      const title = alert.title
        ? `[가공 부적합] ${alert.title}`
        : `[가공 부적합] ${alert.defectType || "가공 품질이상"}`;
      const content = alert.content || alert.defectType || "";
      const dateStr = normalizeDateStr(alert.date || alert.createdAt, todayStr);
      const isResolved = alert.status === "RESOLVED" || (alert.status !== "ACTIVE" && Boolean(alert.actionResult && alert.actionResult.trim()));

      const causeImages = Array.isArray(alert.causeImages)
        ? alert.causeImages
        : Array.isArray(alert.images)
        ? alert.images
        : [];
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      unified.push({
        id: `mach_q_${alert.id}`,
        fourM: determineFourMCategory(alert),
        origin: "부적합경보",
        sourceType: "QUALITY_ALERT",
        badgeColor: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700",
        plant: alert.plant || "삼랑진공장",
        line: alert.line || "가공동",
        writer: alert.author ? `${alert.author} ${alert.authorTitle || ""}`.trim() : "가공동",
        title: title,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        content: content,
        actionResult: alert.actionResult || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionAt: alert.actionAt || alert.updatedAt || "",
        images: causeImages,
        actionImages: actionImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        isResolved: isResolved,
        validation: isResolved ? "가공 부적합경보 조치 및 유효성 확인 완료" : "유효성 검증 대기중",
        severity: alert.severity || "HIGH",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: alert
      });
    });

    // -----------------------------------------------------------------------
    // 5. [Man] 5개 업체 결근 및 4M 인원 대체투입 취합 (오륙, 조영, 유성, 한울, 부림텍)
    // -----------------------------------------------------------------------
    const registeredAbsenceKeys = new Set();

    // 5-1. 4M 결근 및 대체투입 상세 로그 (Absence4MModal 등록분)
    const absenceList = Object.values(absenceLogsMap || {});
    absenceList.forEach((log) => {
      if (!log || !log.date) return;
      const compClean = cleanCompanyName(log.company || "오륙");
      const workerName = String(log.absentWorker?.name || log.name || "").trim();
      const key = `${compClean}_${workerName}_${log.date}`;
      registeredAbsenceKeys.add(key);

      // 최신 인사카드 데이터 매핑
      const cardKey = `${compClean}_${workerName}`;
      const absentCard = personnelCardsMap[cardKey] || personnelCardsMap[`${log.company}_${workerName}`] || log.absentWorker || {};
      const absentDept = absentCard.dept || log.absentWorker?.dept || "생산팀";
      const absentPos = absentCard.position || log.absentWorker?.position || "사원";
      const absentSkill = absentCard.skillLevel || log.absentWorker?.skillLevel || 3;
      const absentMainProc = absentCard.mainProcess || log.process || log.line || "압출";
      const absentReason = log.absentWorker?.reason || log.reason || "휴가";
      const absentPhoto = absentCard.photoUrl || log.absentWorker?.photoUrl || "";

      const isSub = Boolean(log.substituteWorker?.name && log.substituteWorker?.name !== "라인비가동" && !log.substituteWorker?.isLineStopped);
      const isLineStopped = log.substituteWorker?.name === "라인비가동" || log.substituteWorker?.isLineStopped;

      let subName = isLineStopped ? "라인비가동" : (log.substituteWorker?.name || "");
      let subPos = "사원";
      let subDept = "생산팀";
      let subPhoto = "";
      if (isSub) {
        const subCardKey = `${compClean}_${log.substituteWorker.name}`;
        const subCard = personnelCardsMap[subCardKey] || personnelCardsMap[`${log.company}_${log.substituteWorker.name}`] || log.substituteWorker || {};
        subPos = subCard.position || log.substituteWorker.position || "사원";
        subDept = subCard.dept || log.substituteWorker.dept || "생산팀";
        subPhoto = subCard.photoUrl || log.substituteWorker.photoUrl || "";
      }

      const plant = log.plant || (compClean === "오륙" || compClean === "유성" ? "삼랑진공장" : "한림공장");
      const line = `${absentMainProc} 공정`;

      const title = isLineStopped
        ? `[${compClean}] ${workerName}(${absentPos}, ${absentDept}) 결근 ➔ [라인비가동]`
        : `[${compClean}] ${workerName}(${absentPos}, ${absentDept}) 결근 ➔ ${isSub ? `${subName}(${subPos}) 대체투입` : "대체 미투입 (라인조정)"}`;

      const content = [
        `[4M Man 인원변동 결근내역]`,
        `• 소속업체: ${compClean}`,
        `• 소속부서: ${absentDept}`,
        `• 결근근로자: ${workerName} (${absentPos}, Lv.${absentSkill})`,
        `• 대체작업자: ${isLineStopped ? "라인비가동 (대체 미투입)" : (isSub ? `${subName} (${subPos}, ${subDept})` : "미배치 (라인 가동 조정)")}`,
        `• 결근사유: ${absentReason}`,
        `• 담당공정: ${line}`,
        log.remarks || log.notes ? `• 특기사항: ${log.remarks || log.notes}` : ""
      ].filter(Boolean).join("\n");

      const actionResult = isLineStopped
        ? "라인 비가동 (공정 정지/품질영향 없음)"
        : (isSub
            ? `대체작업자 ${subName}(${subPos}) 투입 완료 (${log.checkpoints?.firstPieceCheck ? "초물검사 완료" : "초물검사 미실시"} / ${log.checkpoints?.workInstructionTold ? "특별교육 완료" : "특별교육 미실시"})`
            : "라인 작업 인원 조정 및 비가동 조치");

      const validation = isLineStopped
        ? "라인 비가동 확인 (품질영향 없음)"
        : (isSub
            ? (log.checkpoints?.firstPieceCheck ? "초물 한도검사 & 특별교육 유효성 확인 완료" : "초물검사 및 특별교육 실시 필수")
            : "대체 투입 시 초물검사 및 특별교육 필수");

      const images = [absentPhoto, subPhoto].filter(Boolean);
      if (Array.isArray(log.photos)) {
        log.photos.forEach((p) => { if (p && !images.includes(p)) images.push(p); });
      }

      unified.push({
        id: `man_log_${log.id || key}`,
        fourM: "Man",
        origin: isSub ? "4M 대체투입" : "결근발생",
        sourceType: "MAN_ABSENCE_LOG",
        badgeColor: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-700",
        plant,
        line,
        writer: log.supervisor || log.writer || `${compClean} 관리자`,
        title,
        date: log.date,
        time: log.time || "",
        content,
        actionResult,
        actionAuthor: log.supervisor || "관리자",
        actionAt: log.date || "",
        images: images,
        actionImages: [],
        replies: [],
        isResolved: isSub || isLineStopped,
        validation,
        severity: log.riskLevel === "HIGH" ? "HIGH" : "NORMAL",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: log
      });
    });

    // 5-2. 5개사 근태/연장근무 매트릭스 결근 발생분 (스마트 연장근무 출근부 연동)
    const ym = smartOvertimeData?.yearMonth || todayStr.slice(0, 7);
    const matrix = smartOvertimeData?.attendanceMatrix || [];

    // ⚡ 성능 최적화: 31일 주말/공휴일 판정을 작업자 루프 외부에서 1회만 사전 계산 (4,600+ 회 Date 객체 생성 제거)
    const weekendDaysSet = new Set();
    for (let d = 1; d <= 31; d++) {
      const dStr = String(d).padStart(2, "0");
      if (isWeekendByDate(`${ym}-${dStr}`)) {
        weekendDaysSet.add(d);
      }
    }

    matrix.forEach((w) => {
      if (!w || !w.name) return;
      const rawComp = w.company || "오륙";
      const compClean = cleanCompanyName(rawComp);
      const workerName = String(w.name).trim();

      // 최신 인사카드 데이터 매핑
      const cardKey = `${compClean}_${workerName}`;
      const card = personnelCardsMap[cardKey] || personnelCardsMap[`${rawComp}_${workerName}`] || w.personnelCard || {};
      const resolvedComp = card?.company ? cleanCompanyName(card.company) : compClean;
      const resolvedDept = card?.dept || w.dept || "생산팀";
      const resolvedPos = card?.position || w.position || "사원";
      const resolvedSkill = card?.skillLevel || 3;
      const resolvedMainProc = card?.mainProcess || w.line || "압출";
      const photoUrl = card?.photoUrl || w.photoUrl || "";
      const plant = (resolvedComp === "오륙" || resolvedComp === "유성") ? "삼랑진공장" : "한림공장";
      const line = `${resolvedMainProc} 공정`;
      const dailyObj = w.daily || w;

      // Check days 1 to 31 (주말 및 법정 휴무일은 특근일이므로 결근 이상발생 건에서 제외)
      for (let d = 1; d <= 31; d++) {
        if (weekendDaysSet.has(d)) continue;

        const val = dailyObj[d] !== undefined ? dailyObj[d] : dailyObj[String(d)];
        if (!val) continue;
        const strVal = typeof val === "string" ? val.trim() : String(val).trim();
        if (strVal === "결근" || strVal === "무단결근" || strVal === "휴가" || strVal === "연차" || strVal === "반차" || strVal.includes("결근")) {
          const dStr = String(d).padStart(2, "0");
          const dateStr = `${ym}-${dStr}`;
          const key = `${resolvedComp}_${workerName}_${dateStr}`;
          if (registeredAbsenceKeys.has(key)) continue; // avoid duplication with detailed log
          registeredAbsenceKeys.add(key);

          const title = `[${resolvedComp}] ${workerName}(${resolvedPos}, ${resolvedDept}) 결근 발생 (${line})`;
          const content = `[4M Man 인원변동 결근내역]\n• 소속업체: ${resolvedComp}\n• 소속부서: ${resolvedDept}\n• 결근근로자: ${workerName} (${resolvedPos}, Lv.${resolvedSkill})\n• 담당공정: ${line}\n• 발생일자: ${dateStr}\n• 근태구분: ${strVal}\n• 조치내용: 4M Man 작업자 결근에 따른 대체인원 투입 점검, 특별교육 및 공정 초물검사 실시`;

          unified.push({
            id: `man_matrix_${resolvedComp}_${workerName}_${dateStr}`,
            fourM: "Man",
            origin: "결근발생",
            sourceType: "MAN_ABSENCE_MATRIX",
            badgeColor: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-700",
            plant,
            line,
            writer: `${workerName} (${resolvedComp})`,
            title,
            date: dateStr,
            time: "",
            content,
            actionResult: "대체인원 투입 점검, 특별교육 및 현장 공정 모니터링 진행",
            actionAuthor: "관리자",
            actionAt: dateStr,
            images: photoUrl ? [photoUrl] : [],
            actionImages: [],
            replies: [],
            isResolved: false,
            validation: "대체 투입 시 초물검사 및 특별교육 필수",
            severity: "NORMAL",
            downtimeMinutes: 0,
            scrapKg: 0,
            raw: { ...w, personnelCard: card }
          });
        }
      }
    });

    // -----------------------------------------------------------------------
    // 6. [Canonical 4M Pipeline] 공식 4M 변동점 관리대장(four_m_change_points) 및 전 소스 단일 원천 통합
    // -----------------------------------------------------------------------
    const rawLedgerItems = (fourMLedgerRecords || []).filter((rec) => {
      if (!rec) return false;
      const cat = String(rec.category || rec.sourceCategory || rec.raw?.category || "").trim();
      const origin = String(rec.origin || "").trim();
      return !(
        cat === "오픈이슈" ||
        cat === "open_issue" ||
        cat.includes("오픈이슈") ||
        origin === "오픈이슈" ||
        cat === "회의일정" ||
        cat.includes("회의") ||
        cat === "공지사항" ||
        cat === "사내공지"
      );
    }).map((rec) => {
      const recId = String(rec.id || "");
      const origId = String(rec.originalId || "");
      const rawId = String(rec.rawId || "");
      return {
        id: recId.startsWith("ledger_") ? recId : `ledger_${recId}`,
        originalId: origId || recId,
        rawId: rawId,
        fourM: rec.fourM || determineFourMCategory(rec),
        origin: rec.origin || "변동점대장",
        sourceType: rec.sourceType || "OFFICIAL_LEDGER",
        badgeColor: rec.badgeColor || getFourMBadgeColor(rec.fourM || "Method"),
        plant: rec.plant || "삼랑진공장",
        line: rec.line || "생산/품질",
        writer: rec.writer || rec.registeredBy || "관리자",
        title: rec.title || "(변동점)",
        date: rec.date || todayStr,
        time: rec.time || "",
        content: rec.content || "",
        actionResult: rec.actionResult || "",
        actionAuthor: rec.actionAuthor || "",
        actionAt: rec.actionAt || "",
        images: Array.isArray(rec.images) ? rec.images : [],
        actionImages: Array.isArray(rec.actionImages) ? rec.actionImages : [],
        replies: Array.isArray(rec.replies) ? rec.replies : [],
        isResolved: Boolean(rec.isResolved),
        validation: rec.validation || (rec.isResolved ? "조치 및 유효성 확인 완료" : "유효성 검증 대기중"),
        severity: rec.severity || "NORMAL",
        downtimeMinutes: Number(rec.downtimeMinutes) || 0,
        scrapKg: Number(rec.scrapKg) || 0,
        raw: rec,
        isOfficialLedger: true
      };
    });

    // 🔒 Canonical Single Source of Truth Pipeline: 중복 레코드 원천 차단 및 단일화
    const canonicalMap = new Map();
    const titleIndexMap = new Map();

    [...unified, ...rawLedgerItems].forEach((item) => {
      if (!item) return;
      const coreId = getCore4MId(item);
      const titleKey = getNormalizedTitleKey(item);

      let matchedKey = null;
      if (coreId && coreId.length >= 8 && canonicalMap.has(`core_${coreId}`)) {
        matchedKey = `core_${coreId}`;
      } else if (titleKey && titleIndexMap.has(titleKey)) {
        matchedKey = titleIndexMap.get(titleKey);
      }

      if (matchedKey && canonicalMap.has(matchedKey)) {
        const existing = canonicalMap.get(matchedKey);
        canonicalMap.set(matchedKey, mergeUnified4MRecords(existing, item));
      } else {
        const primaryKey = (coreId && coreId.length >= 8) ? `core_${coreId}` : `item_${item.id || Math.random()}`;
        canonicalMap.set(primaryKey, item);
        if (titleKey) {
          titleIndexMap.set(titleKey, primaryKey);
        }
      }
    });

    const dedupedUnified = Array.from(canonicalMap.values());

    const ledgerSet = new Set(
      (fourMLedgerRecords || []).flatMap((r) => [
        r.originalId,
        r.id,
        r.rawId,
        `ledger_${r.originalId}`,
        `ledger_${r.id}`,
        getCore4MId(r)
      ].filter(Boolean))
    );

    // 최신 발생일자 DESC, ID DESC 정렬 및 대장 등록 여부 매핑
    return dedupedUnified
      .map((item) => {
        const coreId = getCore4MId(item);
        const isReg =
          ledgerSet.has(item.id) ||
          ledgerSet.has(`ledger_${item.id}`) ||
          (coreId && ledgerSet.has(coreId)) ||
          Boolean(item.raw?.id && ledgerSet.has(item.raw.id)) ||
          Boolean(item.isOfficialLedger && (item.classifiedBy === "이창엽" || item.registeredBy === "이창엽" || item.isQualityClassified));

        return {
          ...item,
          isRegisteredInLedger: isReg
        };
      })
      .sort((a, b) => {
        if (b.date !== a.date) return (b.date || "").localeCompare(a.date || "");
        if (b.time !== a.time) return (b.time || "").localeCompare(a.time || "");
        return String(b.id || "").localeCompare(String(a.id || ""));
      });
  }, [
    urgentIssues,
    extrusionReports,
    workLogs,
    extrusionQualityAlerts,
    hanulQualityIssues,
    yuseongQualityIssues,
    machiningQualityIssues,
    fourMLedgerRecords,
    smartOvertimeData,
    absenceLogsMap,
    todayStr,
    personnelCardsMap,
    fourMRevision
  ]);

  // =========================================================================
  // 🔍 필터링 연산
  // =========================================================================
  const filteredRecords = useMemo(() => {
    const ledgerSet = new Set(
      (fourMLedgerRecords || []).flatMap((r) => [r.originalId, r.id, r.rawId, `ledger_${r.originalId}`, `ledger_${r.id}`].filter(Boolean))
    );

    return allUnifiedRecords.filter((rec) => {
      // 0. 공식 변동점 관리대장 필터
      if (selectedOriginFilter === "OFFICIAL_LEDGER" || selected4MTab === "OFFICIAL_LEDGER") {
        const isRegistered = ledgerSet.has(rec.id) || ledgerSet.has(`ledger_${rec.id}`) || Boolean(rec.raw?.id && ledgerSet.has(rec.raw.id)) || rec.isOfficialLedger;
        const isQualityAlert = rec.origin === "부적합경보" || rec.origin === "품질경보" || rec.sourceType === "QUALITY_ALERT";
        if (!isRegistered && !isQualityAlert) return false;
      }

      // 1. 공장 필터
      if (selectedPlant !== "ALL") {
        const pNorm = (rec.plant || "").toLowerCase();
        const targetP = selectedPlant.replace("공장", "");
        if (targetP === "한림") {
          if (!pNorm.includes("한림") && !pNorm.includes("한울") && !pNorm.includes("부림")) return false;
        } else if (targetP === "삼랑진") {
          if (!pNorm.includes("삼랑진") && !pNorm.includes("압출") && !pNorm.includes("가공") && !pNorm.includes("유성")) return false;
        } else {
          if (!pNorm.includes(targetP)) return false;
        }
      }

      // 2. 4M 구분 탭 필터 (OFFICIAL_LEDGER 제외 시 적용)
      if (selected4MTab !== "ALL" && selected4MTab !== "OFFICIAL_LEDGER") {
        if (rec.fourM.toUpperCase() !== selected4MTab.toUpperCase()) return false;
      }

      // 3. 출처 구분 필터 (OFFICIAL_LEDGER 제외 시 적용)
      if (selectedOriginFilter !== "ALL" && selectedOriginFilter !== "OFFICIAL_LEDGER") {
        if (selectedOriginFilter === "부적합경보" || selectedOriginFilter === "품질경보") {
          if (rec.origin !== "부적합경보" && rec.origin !== "품질경보") return false;
        } else if (rec.origin !== selectedOriginFilter) {
          return false;
        }
      }

      // 4. 조치 상태 필터
      if (selectedStatusFilter === "PENDING" && rec.isResolved) return false;
      if (selectedStatusFilter === "RESOLVED" && !rec.isResolved) return false;

      // 5. 사진 유무 필터
      if (selectedPhotoFilter === "ONLY_PHOTOS") {
        const hasP = (rec.images && rec.images.length > 0) || (rec.actionImages && rec.actionImages.length > 0);
        if (!hasP) return false;
      }

      // 6. 기간 필터
      if (selectedDateFilter === "TODAY") {
        if (rec.date !== todayStr) return false;
      } else if (selectedDateFilter === "WEEK") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const weekAgoStr = d.toISOString().slice(0, 10);
        if (rec.date < weekAgoStr) return false;
      } else if (selectedDateFilter === "CUSTOM" && customDateInput) {
        if (rec.date !== customDateInput) return false;
      }

      // 7. 검색어 필터
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = rec.title?.toLowerCase().includes(q);
        const matchContent = rec.content?.toLowerCase().includes(q);
        const matchWriter = rec.writer?.toLowerCase().includes(q);
        const matchLine = rec.line?.toLowerCase().includes(q);
        const matchPlant = rec.plant?.toLowerCase().includes(q);
        const matchOrigin = rec.origin?.toLowerCase().includes(q);
        const matchAction = rec.actionResult?.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchWriter && !matchLine && !matchPlant && !matchOrigin && !matchAction) return false;
      }

      return true;
    });
  }, [allUnifiedRecords, fourMLedgerRecords, selectedPlant, selected4MTab, selectedOriginFilter, selectedStatusFilter, selectedPhotoFilter, selectedDateFilter, customDateInput, searchQuery, todayStr]);

  // =========================================================================
  // 📊 4M 통계 집계 (변동점 관리대장 / Machine / Man / Method / Material)
  // ⚡ 성능 최적화: 단일 루프 순회로 O(N) 처리 및 중간 임시 배열 생성(GC 부하) 제거
  // =========================================================================
  const stats = useMemo(() => {
    let machineCount = 0;
    let repairCount = 0;
    let downtimeCount = 0;
    let tpmCount = 0;
    let totalDowntimeMin = 0;
    let manCount = 0;
    let methodCount = 0;
    let methodPending = 0;
    let materialCount = 0;
    let totalScrapKg = 0;
    let totalPhotos = 0;

    const list = Array.isArray(allUnifiedRecords) ? allUnifiedRecords : [];
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (!r) continue;
      const fourM = (r.fourM || "").toUpperCase();
      if (fourM === "MACHINE") {
        machineCount++;
        if (r.origin === "설비수리") repairCount++;
        else if (r.origin === "비가동") downtimeCount++;
        else if (r.origin === "TPM 이상신고") tpmCount++;
        totalDowntimeMin += (r.downtimeMinutes || 0);
      } else if (fourM === "MAN") {
        manCount++;
      } else if (fourM === "METHOD") {
        methodCount++;
        if (!r.isResolved) methodPending++;
      } else if (fourM === "MATERIAL") {
        materialCount++;
        totalScrapKg += (r.scrapKg || 0);
      }
      totalPhotos += (r.images?.length || 0) + (r.actionImages?.length || 0);
    }

    return {
      totalCount: list.length,
      officialLedgerCount: fourMLedgerRecords?.length || 0,
      machineCount,
      repairCount,
      downtimeCount,
      tpmCount,
      totalDowntimeMin,
      manCount,
      materialCount,
      totalScrapKg: Number(totalScrapKg.toFixed(1)),
      methodCount,
      methodPending,
      totalPhotos
    };
  }, [allUnifiedRecords, fourMLedgerRecords]);

  // 상세 모달 열기
  const handleOpenDetailModal = (item) => {
    setSelectedItemForDetail(item);
    setActionInputText(item.actionResult || "");
    setActionAuthorInput(currentProfile?.name || "관리자");
    setActionPhotos([]);
  };

  // 상세 모달 닫기
  const handleCloseDetailModal = () => {
    setSelectedItemForDetail(null);
    setActionInputText("");
    setActionPhotos([]);
  };

  // 🌟 4M 카테고리 수동 변경 핸들러 (Machine / Material / Man / Method)
  const handleUpdateItemFourM = async (item, newFourM) => {
    if (!item || !newFourM) return;
    if (item.fourM === newFourM) return;

    try {
      const updatedList = await updateFourMClassification(
        item,
        newFourM,
        currentProfile?.name || "관리자"
      );

      if (updatedList) {
        setFourMLedgerRecords(updatedList);
      }

      setSelectedItemForDetail((prev) => {
        if (!prev) return null;
        const pId = String(prev.id || "");
        const itId = String(item.id || "");
        if (pId === itId || (item.originalId && pId === item.originalId)) {
          return { ...prev, fourM: newFourM, isManualFourM: true };
        }
        return prev;
      });

      setFourMRevision((r) => r + 1);
    } catch (err) {
      console.error("Failed to update 4M classification:", err);
      alert("4M 분류 변경 중 오류가 발생했습니다.");
    }
  };

  // 조치 사진 업로드 핸들러
  const handleActionPhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const compressedList = await Promise.all(
        files.map((file) => compressImage(file, 1200, 1200, 0.8))
      );
      setActionPhotos((prev) => [...prev, ...compressedList]);
    } catch (err) {
      console.error("Action photo upload error:", err);
      alert("사진 처리 중 오류가 발생했습니다.");
    }
  };

  // 조치 내용 및 사진 저장 핸들러
  const handleSaveActionResult = async () => {
    if (!selectedItemForDetail) return;
    const newActionImages = actionPhotos.map((p) => p.dataUrl || p);
    if (!actionInputText.trim() && newActionImages.length === 0) {
      alert("조치 내용 또는 첨부 사진을 입력해 주세요.");
      return;
    }

    setIsSavingAction(true);
    const nowStr = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    try {
      const effectiveAuthor = actionAuthorInput || currentProfile?.name || "관리자";
      const actionText = actionInputText.trim() || "조치 사진 첨부 완료";
      const idStr = String(selectedItemForDetail.id || "");
      const rawIssue = selectedItemForDetail.raw || {};
      const originStr = String(selectedItemForDetail.origin || rawIssue.origin || "");
      const coreId = getCore4MId(rawIssue.id || idStr);

      if (idStr.startsWith("ext_q_") || originStr === "EXTRUSION_QUALITY") {
        const targetId = rawIssue.id && !String(rawIssue.id).startsWith("ledger_") ? rawIssue.id : coreId;
        await saveExtrusionQualityIssue({
          ...rawIssue,
          id: targetId,
          actionResult: actionText,
          actionAuthor: effectiveAuthor,
          actionAt: nowStr,
          actionImages: Array.from(new Set([...(rawIssue.actionImages || []), ...newActionImages])),
          status: "RESOLVED",
          isResolved: true
        });
      } else if (idStr.startsWith("hanul_q_") || originStr === "HANUL_QUALITY") {
        const targetId = rawIssue.id && !String(rawIssue.id).startsWith("ledger_") ? rawIssue.id : coreId;
        await saveHanulQualityIssue({
          ...rawIssue,
          id: targetId,
          actionResult: actionText,
          actionAuthor: effectiveAuthor,
          actionAt: nowStr,
          actionImages: Array.from(new Set([...(rawIssue.actionImages || []), ...newActionImages])),
          status: "RESOLVED",
          isResolved: true
        });
      } else if (idStr.startsWith("ys_q_") || originStr === "YUSEONG_QUALITY") {
        const targetId = rawIssue.id && !String(rawIssue.id).startsWith("ledger_") ? rawIssue.id : coreId;
        await saveYuseongQualityIssue({
          ...rawIssue,
          id: targetId,
          actionResult: actionText,
          actionAuthor: effectiveAuthor,
          actionAt: nowStr,
          actionImages: Array.from(new Set([...(rawIssue.actionImages || []), ...newActionImages])),
          status: "RESOLVED",
          isResolved: true
        });
      } else if (idStr.startsWith("mach_q_") || originStr === "MACHINING_QUALITY") {
        const targetId = rawIssue.id && !String(rawIssue.id).startsWith("ledger_") ? rawIssue.id : coreId;
        await saveMachiningQualityIssue({
          ...rawIssue,
          id: targetId,
          actionResult: actionText,
          actionAuthor: effectiveAuthor,
          actionAt: nowStr,
          actionImages: Array.from(new Set([...(rawIssue.actionImages || []), ...newActionImages])),
          status: "RESOLVED",
          isResolved: true
        });
      } else if (
        idStr.startsWith("urg_") ||
        originStr === "URGENT_ISSUE" ||
        selectedItemForDetail.sourceType === "QUALITY_ALERT" ||
        String(coreId).startsWith("issue_")
      ) {
        const targetId = rawIssue.id && !String(rawIssue.id).startsWith("ledger_") ? rawIssue.id : coreId;
        await updateUrgentIssueActionResult(
          targetId,
          actionText,
          effectiveAuthor,
          newActionImages,
          rawIssue
        );
      }

      if (selectedItemForDetail.isRegisteredInLedger || selectedItemForDetail.sourceType === "OFFICIAL_LEDGER" || idStr.startsWith("ledger_")) {
        await registerToFourMLedger(
          {
            ...selectedItemForDetail,
            actionResult: actionText,
            actionAuthor: effectiveAuthor,
            actionAt: nowStr,
            actionImages: Array.from(new Set([...(selectedItemForDetail.actionImages || []), ...newActionImages])),
            isResolved: true
          },
          effectiveAuthor
        ).catch(() => {});
      }

      setSelectedItemForDetail((prev) => ({
        ...prev,
        actionResult: actionText,
        actionAuthor: effectiveAuthor,
        actionAt: nowStr,
        actionImages: Array.from(new Set([...(prev.actionImages || []), ...newActionImages])),
        isResolved: true
      }));

      alert("조치 내용 및 첨부 사진이 성공적으로 저장되었습니다.");
    } catch (err) {
      console.error("Save action error:", err);
      alert("조치 내용 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingAction(false);
    }
  };

  // 🌟 사내관리등록 상태 저장 (변동점등록 vs 사내관리등록 구분)
  const [internalMgmtMap, setInternalMgmtMap] = useState(() => {
    try {
      const raw = localStorage.getItem("factory_internal_mgmt_registry_v1");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const handleRegisterAsInternalMgmt = async (item) => {
    if (!item) return;
    const rawId = item.raw?.id || "";
    const isAlreadyIn4M = fourMLedgerRecords.some(
      (r) =>
        r.originalId === item.id ||
        r.id === item.id ||
        r.id === `ledger_${item.id}` ||
        `ledger_${r.originalId}` === item.id ||
        (rawId && (r.rawId === rawId || r.originalId === rawId || r.id === rawId || r.id === `ledger_${rawId}`))
    );
    if (isAlreadyIn4M) {
      const updated = await unregisterFromFourMLedger(item);
      setFourMLedgerRecords(updated || []);
    }
    const nextMap = { ...internalMgmtMap, [item.id]: true };
    setInternalMgmtMap(nextMap);
    try {
      localStorage.setItem("factory_internal_mgmt_registry_v1", JSON.stringify(nextMap));
    } catch {}
  };

  // 🌟 공식 변동점 관리대장 등록 및 해제 (복사본 저장)
  const handleToggleLedger = async (item) => {
    if (!item) return;
    const rawId = item.raw?.id || "";
    const isAlready = fourMLedgerRecords.some(
      (r) =>
        r.originalId === item.id ||
        r.id === item.id ||
        r.id === `ledger_${item.id}` ||
        `ledger_${r.originalId}` === item.id ||
        (rawId && (r.rawId === rawId || r.originalId === rawId || r.id === rawId || r.id === `ledger_${rawId}`))
    );

    if (isAlready) {
      if (window.confirm(`[${item.title}]\n\n항목을 공식 변동점 관리대장에서 등록 해제(삭제)하시겠습니까?`)) {
        const updated = await unregisterFromFourMLedger(item);
        setFourMLedgerRecords(updated || []);
        alert(`[${item.title}]\n\n변동점 관리대장에서 정상적으로 등록 해제되었습니다.`);
      }
    } else {
      const newItem = await registerToFourMLedger(
        {
          ...item,
          classifiedBy: currentProfile?.name || "이창엽",
          registeredBy: currentProfile?.name || "이창엽",
          isQualityClassified: true,
          isOfficialLedger: true
        },
        currentProfile?.name || "이창엽"
      );
      if (newItem) {
        setFourMLedgerRecords((prev) => [
          newItem,
          ...prev.filter((it) => it.id !== newItem.id && it.originalId !== newItem.originalId)
        ]);
        if (internalMgmtMap[item.id]) {
          const nextMap = { ...internalMgmtMap };
          delete nextMap[item.id];
          setInternalMgmtMap(nextMap);
          try {
            localStorage.setItem("factory_internal_mgmt_registry_v1", JSON.stringify(nextMap));
          } catch {}
        }
        alert(`[${item.title}]\n\n항목이 공식 변동점 관리대장에 복사본으로 저장되었습니다.`);
      }
    }
  };

  // 4M 변동점 관리대장 엑셀 추출 (사용자 요청 항목 순서 정렬)
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      alert("출력할 데이터가 없습니다.");
      return;
    }

    const rows = filteredRecords.map((r, i) => ({
      "NO": i + 1,
      "4M구분": r.fourM,
      "구분": `[${r.fourM}] ${r.origin}`,
      "일시": r.time ? `${r.date} ${r.time}` : r.date,
      "공장": r.plant,
      "변동점내용": r.title,
      "사진": `${(r.images?.length || 0) + (r.actionImages?.length || 0)}장`,
      "진행상태": r.isResolved ? "조치완료" : "진행중",
      "유효성검증": r.validation || (r.isResolved ? "유효성 검증 완료" : "검증 대기"),
      "변동점대장": r.isRegisteredInLedger ? "대장등록됨" : "미등록",
      "상세 내용": r.content || "-",
      "조치 내용": r.actionResult || "-",
      "조치자": r.actionAuthor || "-",
      "보고자": r.writer || "-"
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "4M_변동점_관리대장");
    XLSX.writeFile(wb, `4M_변동점_관리대장_${todayStr}.xlsx`);
  };

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. Header Banner */}
      {/* ========================================================================= */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-2 border-indigo-500/40 shadow-xl space-y-2.5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-500 text-white shadow-md shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                  <span>📋 4M 변동점 관리대장 (설비수리·비가동·불량·부적합경보)</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white shadow-xs border border-indigo-400/40">
                  {currentProfile?.name ? `${currentProfile.name} ${currentProfile.title || "관리자"} 관제` : "4M 변동점 관제"}
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/90 font-medium">
                작업일보 <b>비가동·불량·TPM</b> + 전재율 <b>설비수리</b> + 관리자 <b>부적합경보</b>를 취합하고 <b>변동점 관리대장</b>으로 공식 등록합니다.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-indigo-500/30">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === "table" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                }`}
                title="1줄 목록표 뷰"
              >
                <TableIcon className="w-3 h-3" />
                <span>1줄 대장</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === "card" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                }`}
                title="카드형 뷰"
              >
                <LayoutList className="w-3 h-3" />
                <span>카드형</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-indigo-200 hover:text-white border border-indigo-500/30 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="새로고침"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
              <span className="hidden sm:inline">새로고침</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs"
              title="엑셀 다운로드"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>엑셀 다운로드</span>
            </button>
          </div>
        </div>

        {/* 5 Core KPI Badges in user-specified order:
            1. 변동점 관리대장
            2. MACHINE
            3. MAN
            4. METHOD (MATHOD)
            5. MATERIAL
        */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-0.5">
          {/* 1. 변동점 관리대장 */}
          <div
            onClick={() => {
              setSelected4MTab(selected4MTab === "OFFICIAL_LEDGER" ? "ALL" : "OFFICIAL_LEDGER");
              setSelectedOriginFilter(selectedOriginFilter === "OFFICIAL_LEDGER" ? "ALL" : "OFFICIAL_LEDGER");
            }}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selected4MTab === "OFFICIAL_LEDGER" || selectedOriginFilter === "OFFICIAL_LEDGER"
                ? "bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-400/50 shadow-md"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold truncate">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">📋 변동점 관리대장</span>
            </div>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-black text-white">{stats.officialLedgerCount}건</span>
            </div>
          </div>

          {/* 2. MACHINE */}
          <div
            onClick={() => {
              setSelected4MTab(selected4MTab === "MACHINE" ? "ALL" : "MACHINE");
              if (selectedOriginFilter === "OFFICIAL_LEDGER") setSelectedOriginFilter("ALL");
            }}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selected4MTab === "MACHINE"
                ? "bg-indigo-950/90 border-indigo-400 ring-2 ring-indigo-400/50 shadow-md"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-bold truncate">
              <Wrench className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">🔧 MACHINE</span>
            </div>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-black text-white">{stats.machineCount}건</span>
            </div>
          </div>

          {/* 3. MAN */}
          <div
            onClick={() => {
              setSelected4MTab(selected4MTab === "MAN" ? "ALL" : "MAN");
              if (selectedOriginFilter === "OFFICIAL_LEDGER") setSelectedOriginFilter("ALL");
            }}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selected4MTab === "MAN"
                ? "bg-sky-950/90 border-sky-400 ring-2 ring-sky-400/50 shadow-md"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs text-sky-300 font-bold truncate">
              <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">👥 MAN</span>
            </div>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-black text-white">{stats.manCount}건</span>
            </div>
          </div>

          {/* 4. METHOD (MATHOD) */}
          <div
            onClick={() => {
              setSelected4MTab(selected4MTab === "METHOD" ? "ALL" : "METHOD");
              if (selectedOriginFilter === "OFFICIAL_LEDGER") setSelectedOriginFilter("ALL");
            }}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selected4MTab === "METHOD"
                ? "bg-amber-950/90 border-amber-400 ring-2 ring-amber-400/50 shadow-md"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold truncate">
              <AlertOctagon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">🚨 METHOD</span>
            </div>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-black text-white">{stats.methodCount}건</span>
            </div>
          </div>

          {/* 5. MATERIAL */}
          <div
            onClick={() => {
              setSelected4MTab(selected4MTab === "MATERIAL" ? "ALL" : "MATERIAL");
              if (selectedOriginFilter === "OFFICIAL_LEDGER") setSelectedOriginFilter("ALL");
            }}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selected4MTab === "MATERIAL"
                ? "bg-rose-950/90 border-rose-400 ring-2 ring-rose-400/50 shadow-md"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs text-rose-300 font-bold truncate">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">📉 MATERIAL</span>
            </div>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-black text-white">{stats.materialCount}건</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {selected4MTab !== "ALL" && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>
              현재 <strong>{selected4MTab === "OFFICIAL_LEDGER" ? "변동점 관리대장" : selected4MTab}</strong> 필터 적용 중 ({filteredRecords.length}건)
            </span>
          </div>
          <button
            type="button"
            onClick={() => { setSelected4MTab("ALL"); setSelectedOriginFilter("ALL"); }}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
          >
            <X className="w-3 h-3" />
            <span>전체 보기</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.5. 단계별 맞춤 관제 패널 (4단계 경영진 vs 3단계 품질관리자 vs 2단계 생산관리자) */}
      {/* ========================================================================= */}
      {(() => {
        const isExecutiveUser = Boolean(
          currentProfile?.name === "이명재" ||
          currentProfile?.id === "sam_mj" ||
          currentProfile?.name === "김동욱" ||
          currentProfile?.id === "hal_dw" ||
          currentProfile?.name === "권태형" ||
          currentProfile?.id === "admin_kwon" ||
          currentProfile?.name === "최미영" ||
          currentProfile?.id === "admin_choi" ||
          currentProfile?.title === "이사" ||
          currentProfile?.title === "대표이사" ||
          currentProfile?.title === "전무" ||
          currentProfile?.title === "대표(전무)" ||
          currentProfile?.role === "ADMIN"
        );

        const isQualityUser = Boolean(
          currentProfile?.name === "이창엽" ||
          currentProfile?.id === "sam_cy" ||
          currentProfile?.name === "이상기" ||
          currentProfile?.id === "sam_sg" ||
          currentProfile?.assignedProcess === "품질관리" ||
          currentProfile?.department === "품질보증팀"
        );

        let managerCompanyFilter = "";
        let managerTitlePrefix = "전사";
        const name = currentProfile?.name || "";
        const process = currentProfile?.assignedProcess || "";
        const plant = currentProfile?.plant || "";

        if (name === "설유철" || process.includes("압출")) {
          managerCompanyFilter = "압출동";
          managerTitlePrefix = "삼랑진 압출동";
        } else if (name === "윤경수" || name === "양인나" || name === "유동길" || (plant === "삼랑진공장" && process.includes("가공"))) {
          managerCompanyFilter = "오륙";
          managerTitlePrefix = "삼랑진 가공동";
        } else if (name === "오상민" || (plant === "한림공장" && process.includes("가공"))) {
          managerCompanyFilter = "한림공장";
          managerTitlePrefix = "한림 가공동";
        } else if (name === "전재율" || process.includes("보전")) {
          managerCompanyFilter = "";
          managerTitlePrefix = "설비보전";
        } else if (currentProfile?.company) {
          managerCompanyFilter = currentProfile.company;
          managerTitlePrefix = currentProfile.company;
        }

        if (isExecutiveUser) {
          return (
            <Step4ExecutiveApprovalPanel
              currentProfile={currentProfile}
              onOpenIssueModal={onOpenIssueModal}
              onNavigateTab={onNavigateTab}
            />
          );
        }

        if (isQualityUser) {
          return (
            <Step3QualityControlPanel
              currentProfile={currentProfile}
              onOpenIssueModal={onOpenIssueModal}
              onNavigateTab={onNavigateTab}
            />
          );
        }

        // 🏭 2단계: 공정·생산관리자 전용 생산오더 & 비가동 1차 소팅 패널
        return (
          <Step2ProductionManagerPanel
            currentProfile={currentProfile}
            onOpenIssueModal={onOpenIssueModal}
            onNavigateTab={onNavigateTab}
          />
        );
      })()}

      {/* ========================================================================= */}
      {/* 3. 1줄짜리 초간결 목록표 (High-Density 1-Line Table View) */}
      {/* ========================================================================= */}
      {viewMode === "table" ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700 whitespace-nowrap text-[11px]">
                  <th className="py-2.5 px-2 text-center w-8">NO</th>
                  <th className="py-2.5 px-2 text-center w-36">4M 분류 (수정)</th>
                  <th className="py-2.5 px-2 text-center w-20">출처</th>
                  <th className="py-2.5 px-2 text-center w-24">등록일자 (발생)</th>
                  <th className="py-2.5 px-2 text-center w-14">공장</th>
                  <th className="py-2.5 px-3 min-w-[300px] w-full">변동점내용</th>
                  <th className="py-2.5 px-2 text-center w-14">사진</th>
                  <th className="py-2.5 px-2 text-center w-20">진행상태</th>
                  <th className="py-2.5 px-2 text-center w-28">유효성검증</th>
                  <th className="py-2.5 px-2 text-center w-44">등록구분 (변동점 / 사내관리)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                      <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
                        해당 조건의 변동점 내역이 없습니다.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item, idx) => {
                    const hasPhotos = (item.images && item.images.length > 0) || (item.actionImages && item.actionImages.length > 0);
                    const photoCount = (item.images?.length || 0) + (item.actionImages?.length || 0);

                    // Origin Badge Color
                    const badgeClass =
                      item.origin === "설비수리"
                        ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 border-indigo-300"
                        : item.origin === "비가동"
                        ? "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 border-orange-300"
                        : item.origin === "TPM 이상신고"
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300"
                        : item.origin === "불량손실"
                        ? "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300"
                        : item.origin === "결근발생" || item.origin === "4M 대체투입" || item.fourM === "Man"
                        ? "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border-purple-300"
                        : "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300";

                    // Plant formatting (삼랑진 / 한림)
                    const isHallim = item.plant?.includes("한림");

                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleOpenDetailModal(item)}
                        className="hover:bg-indigo-50/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
                        title="클릭하여 상세 내용 및 조치 등록 팝업 열기"
                      >
                        {/* 1. NO */}
                        <td className="py-2.5 px-2 text-center font-mono text-slate-400 text-[10.5px] whitespace-nowrap">
                          {idx + 1}
                        </td>

                        {/* 2. 4M 분류 (직접 수정 셀렉트박스) */}
                        <td className="py-2 px-1 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={item.fourM || "Method"}
                            onChange={(e) => handleUpdateItemFourM(item, e.target.value)}
                            className={`text-[11px] font-black py-1 px-1.5 rounded-lg border cursor-pointer outline-none transition-all shadow-2xs font-sans ${
                              item.fourM === "Machine"
                                ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                                : item.fourM === "Material"
                                ? "bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                                : item.fourM === "Man"
                                ? "bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700"
                                : "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                            }`}
                            title="4M 카테고리 수정 (클릭하여 Machine / Material / Man / Method 직접 변경)"
                          >
                            <option value="Machine" className="bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-bold">⚙️ Machine (설비)</option>
                            <option value="Material" className="bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 font-bold">🧱 Material (재료)</option>
                            <option value="Man" className="bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 font-bold">👤 Man (인원)</option>
                            <option value="Method" className="bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 font-bold">📐 Method (공법)</option>
                          </select>
                        </td>

                        {/* 3. 출처 구분 */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                            {item.origin}
                          </span>
                        </td>

                        {/* 3. 등록일자 (발생일시) */}
                        <td className="py-2.5 px-2 text-center font-mono text-slate-700 dark:text-slate-300 font-bold text-[10.5px] whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{item.date}</span>
                          </div>
                          {item.time ? <div className="text-[9.5px] text-slate-400 font-normal">{item.time}</div> : null}
                        </td>

                        {/* 4. 공장 */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded border font-black text-[10.5px] ${
                            isHallim
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                              : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                          }`}>
                            {isHallim ? "한림" : "삼랑진"}
                          </span>
                        </td>

                        {/* 5. 변동점내용 */}
                        <td className="py-2.5 px-3 min-w-[320px] w-full">
                          <div className="font-black text-slate-900 dark:text-white text-xs leading-relaxed group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors break-words">
                            {item.title}
                          </div>
                          {item.content && item.content.trim() !== item.title.trim() && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line break-words leading-relaxed font-normal">
                              {item.content}
                            </div>
                          )}
                          {item.actionResult && item.actionResult.trim() && (
                            <div className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1 bg-emerald-50/80 dark:bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                              <span>↳ 🟢 <b>[조치결과]</b> {item.actionResult}</span>
                            </div>
                          )}
                        </td>

                        {/* 6. 사진 */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          {hasPhotos ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const firstImg = item.images?.[0] || item.actionImages?.[0];
                                const src = typeof firstImg === "object" ? firstImg.dataUrl || firstImg.url : firstImg;
                                if (src) setPreviewImage(src);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[10.5px] font-bold hover:scale-105 cursor-pointer shadow-2xs"
                              title="사진 미리보기"
                            >
                              <Camera className="w-3 h-3 text-amber-600" />
                              <span>{photoCount}장</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700 text-xs font-mono">-</span>
                          )}
                        </td>

                        {/* 7. 진행상태 */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              item.isResolved
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse"
                            }`}
                          >
                            {item.isResolved ? "조치완료" : "진행중"}
                          </span>
                        </td>

                        {/* 8. 유효성검증 */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                              item.isResolved
                                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                            }`}
                            title={item.validation}
                          >
                            <span className="flex items-center justify-center gap-1">
                              <CheckCircle2 className={`w-3 h-3 ${item.isResolved ? "text-blue-500" : "text-slate-400"}`} />
                              <span className="truncate max-w-[95px]">{item.validation || "초·중·종물 검증"}</span>
                            </span>
                          </span>
                        </td>

                        {/* 9. 등록구분 (변동점등록 뱃지 / 사내관리등록 뱃지) */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1">
                            {/* 변동점등록 뱃지 */}
                            {item.isRegisteredInLedger ? (
                              <button
                                type="button"
                                onClick={() => handleToggleLedger(item)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-rose-600 text-white text-[10px] font-black transition-all shadow-2xs group/btn cursor-pointer"
                                title="변동점관리대장 등록됨 (클릭 시 해제)"
                              >
                                <Check className="w-2.5 h-2.5 group-hover/btn:hidden" />
                                <X className="w-2.5 h-2.5 hidden group-hover/btn:inline" />
                                <span className="group-hover/btn:hidden">🔄 변동점등록됨</span>
                                <span className="hidden group-hover/btn:inline">해제</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleLedger(item)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-emerald-600 text-indigo-700 dark:text-indigo-300 hover:text-white border border-indigo-300 dark:border-indigo-700 text-[10px] font-black transition-all cursor-pointer shadow-2xs"
                                title="변동점등록 뱃지: 클릭 시 변동점관리대장에 동시 등록됩니다."
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>🔄 변동점등록</span>
                              </button>
                            )}

                            {/* 사내관리등록 뱃지 */}
                            <button
                              type="button"
                              onClick={() => handleRegisterAsInternalMgmt(item)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-2xs border ${
                                !item.isRegisteredInLedger && internalMgmtMap[item.id]
                                  ? "bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400/40"
                                  : "bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 text-slate-600 dark:text-slate-300 hover:text-white border-slate-300 dark:border-slate-700"
                              }`}
                              title="사내관리등록 뱃지: 부적합관리대장 내 사내관리 항목으로 등록합니다."
                            >
                              {!item.isRegisteredInLedger && internalMgmtMap[item.id] ? (
                                <>
                                  <Check className="w-2.5 h-2.5" />
                                  <span>🏢 사내관리됨</span>
                                </>
                              ) : (
                                <span>🏢 사내관리등록</span>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 카드형 뷰 */
        <div className="space-y-2">
          {filteredRecords.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenDetailModal(item)}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-400 transition-all cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={item.fourM || "Method"}
                    onChange={(e) => handleUpdateItemFourM(item, e.target.value)}
                    className={`text-[10px] font-black py-0.5 px-1.5 rounded-lg border cursor-pointer outline-none ${
                      item.fourM === "Machine"
                        ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                        : item.fourM === "Material"
                        ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                        : item.fourM === "Man"
                        ? "bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700"
                        : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                    }`}
                    title="4M 카테고리 수정 (클릭하여 변경)"
                  >
                    <option value="Machine">⚙️ Machine</option>
                    <option value="Material">🧱 Material</option>
                    <option value="Man">👤 Man</option>
                    <option value="Method">📐 Method</option>
                  </select>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    item.origin === "설비수리"
                      ? "bg-indigo-100 text-indigo-900 border-indigo-300"
                      : item.origin === "비가동"
                      ? "bg-orange-100 text-orange-900 border-orange-300"
                      : item.origin === "TPM 이상신고"
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-rose-100 text-rose-900 border-rose-300"
                  }`}>
                    {item.origin}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.plant}</span>
                  <span className="text-slate-500">작성자: {item.writer}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-500">{item.date}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${item.isResolved ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                    {item.isResolved ? "완료" : "미조치"}
                  </span>
                </div>
              </div>
              <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">{item.title}</h4>
              {item.content && item.content.trim() !== item.title.trim() && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                  {item.content}
                </p>
              )}
              {item.actionResult && (
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[11px] text-emerald-900 dark:text-emerald-200 font-medium">
                  <b>조치결과:</b> {item.actionResult}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. Detail & Action Modal */}
      {/* ========================================================================= */}
      {selectedItemForDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
            <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/30">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500 text-white font-black text-xs">
                  [{selectedItemForDetail.fourM}] {selectedItemForDetail.origin}
                </span>
                <h3 className="font-black text-sm text-white truncate">
                  변동점 상세 및 조치 등록
                </h3>
              </div>
              <button type="button" onClick={handleCloseDetailModal} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px]">
                <div>
                  <span className="text-slate-400 block">등록일시 (발생일)</span>
                  <span className="font-black text-slate-900 dark:text-white flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    <span>{selectedItemForDetail.date} {selectedItemForDetail.time || ""}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">공장 / 라인</span>
                  <span className="font-black text-slate-900 dark:text-white">{selectedItemForDetail.plant} • {selectedItemForDetail.line}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">보고자</span>
                  <span className="font-black text-slate-900 dark:text-white">{selectedItemForDetail.writer}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">조치상태</span>
                  <span className={`font-black ${selectedItemForDetail.isResolved ? "text-emerald-600" : "text-rose-600"}`}>
                    {selectedItemForDetail.isResolved ? "✅ 조치완료" : "🚨 미조치"}
                  </span>
                </div>
              </div>

              {/* 4M 분류 변경 컨트롤 */}
              <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>4M 카테고리 분류 변경 (수정)</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    현재 적용: <b className="text-indigo-600 dark:text-indigo-400 font-black">{selectedItemForDetail.fourM}</b>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { key: "Machine", label: "⚙️ Machine", desc: "설비·기계·수리", active: "bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-400/50 shadow-xs" },
                    { key: "Material", label: "🧱 Material", desc: "원료·자재·불량", active: "bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400/50 shadow-xs" },
                    { key: "Man", label: "👤 Man", desc: "결근·대체투입", active: "bg-sky-600 text-white border-sky-700 ring-2 ring-sky-400/50 shadow-xs" },
                    { key: "Method", label: "📐 Method", desc: "공법·작업표준", active: "bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400/50 shadow-xs" }
                  ].map((m) => {
                    const isSelected = selectedItemForDetail.fourM === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => handleUpdateItemFourM(selectedItemForDetail, m.key)}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? m.active
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"
                        }`}
                      >
                        <div className="font-black text-xs">{m.label}</div>
                        <div className={`text-[10px] mt-0.5 truncate ${isSelected ? "text-white/90" : "text-slate-400"}`}>{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Stats */}
              <div>
                <span className="text-slate-400 block text-[10.5px] mb-0.5">변동 및 발생 항목</span>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  {selectedItemForDetail.title}
                </h4>
                {(selectedItemForDetail.downtimeMinutes > 0 || selectedItemForDetail.scrapKg > 0) && (
                  <div className="flex items-center gap-2 mt-1">
                    {selectedItemForDetail.downtimeMinutes > 0 && (
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 font-black text-[11px]">
                        비가동: {selectedItemForDetail.downtimeMinutes}분
                      </span>
                    )}
                    {selectedItemForDetail.scrapKg > 0 && (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 font-black text-[11px]">
                        불량손실: {selectedItemForDetail.scrapKg}kg
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Detailed Content */}
              <div>
                <span className="text-slate-400 block text-[10.5px] mb-1">상세 내용</span>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-medium">
                  {selectedItemForDetail.content || "(상세 내용 없음)"}
                </div>
              </div>

              {/* Attached Photos */}
              {Array.isArray(selectedItemForDetail.images) && selectedItemForDetail.images.length > 0 && (
                <div>
                  <span className="text-slate-400 block text-[10.5px] mb-1 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-amber-500" />
                    <span>현장 사진 ({selectedItemForDetail.images.length}장) - 클릭 시 확대</span>
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {selectedItemForDetail.images.map((img, iIdx) => {
                      const src = typeof img === "object" ? img.dataUrl || img.url : img;
                      if (!src) return null;
                      return (
                        <img
                          key={iIdx}
                          src={src}
                          alt="현장 사진"
                          onClick={() => setPreviewImage(src)}
                          className="w-16 h-16 object-cover rounded-lg border-2 border-amber-400 cursor-pointer hover:scale-105 transition shrink-0"
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Result Form */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>원인분석 및 조치내용 등록</span>
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 block text-[10.5px] mb-0.5">조치자</label>
                    <input
                      type="text"
                      value={actionAuthorInput}
                      onChange={(e) => setActionAuthorInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block text-[10.5px] mb-0.5">조치 확인 사진</label>
                    <label className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold cursor-pointer text-[11px]">
                      <Camera className="w-3 h-3" />
                      <span>사진 ({actionPhotos.length}장)</span>
                      <input type="file" accept="image/*" multiple onChange={handleActionPhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {actionPhotos.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {actionPhotos.map((p, pIdx) => (
                      <div key={pIdx} className="relative shrink-0">
                        <img src={p.dataUrl} alt="조치사진" className="w-14 h-14 object-cover rounded-lg border border-emerald-400" />
                        <button
                          type="button"
                          onClick={() => setActionPhotos((prev) => prev.filter((_, idx) => idx !== pIdx))}
                          className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="text-slate-500 block text-[10.5px] mb-0.5">조치 내용 및 결과</label>
                  <textarea
                    rows={2}
                    value={actionInputText}
                    onChange={(e) => setActionInputText(e.target.value)}
                    placeholder="조치 내용, 원인 및 재발방지 내용을 입력하세요..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>

                <div className="flex items-center justify-between gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleLedger(selectedItemForDetail);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1 cursor-pointer ${
                      fourMLedgerRecords.some((r) => r.originalId === selectedItemForDetail.id || r.id === selectedItemForDetail.id)
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-600 hover:text-white"
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>
                      {fourMLedgerRecords.some((r) => r.originalId === selectedItemForDetail.id || r.id === selectedItemForDetail.id)
                        ? "공식 대장 등록됨 (클릭 시 해제)"
                        : "➕ 공식 변동점 대장 등록"}
                    </span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCloseDetailModal}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                    >
                      닫기
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveActionResult}
                      disabled={isSavingAction}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-xs transition cursor-pointer"
                    >
                      {isSavingAction ? "저장 중..." : "조치 저장"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          previewImage={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
};
