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
  LayoutList
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
import { ImagePreviewModal } from "../common/ImagePreviewModal";
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
  currentProfile = null
}) => {
  // Real-time state streams
  const [urgentIssues, setUrgentIssues] = useState(() => getLocalUrgentIssues());
  const [extrusionReports, setExtrusionReports] = useState([]);
  const [extrusionQualityAlerts, setExtrusionQualityAlerts] = useState(() => getLocalExtrusionQualityIssues());
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  // View Mode: 'table' (1-line ledger table) vs 'card' (detailed cards)
  const [viewMode, setViewMode] = useState("table");

  // Filter States
  const [selectedPlant, setSelectedPlant] = useState("ALL"); // ALL | 삼랑진공장 | 한림공장
  const [selected4MTab, setSelected4MTab] = useState("ALL"); // ALL | MACHINE | MATERIAL | METHOD
  const [selectedOriginFilter, setSelectedOriginFilter] = useState("ALL"); // ALL | 설비수리 | 비가동 | 불량손실 | TPM이상신고 | 품질경보
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
  const [actionAuthorInput, setActionAuthorInput] = useState(currentProfile?.name || "TEST 선임");
  const [actionPhotos, setActionPhotos] = useState([]);
  const [isSavingAction, setIsSavingAction] = useState(false);

  // Subscriptions
  useEffect(() => {
    setIsLoading(true);

    // 1. Urgent Issues (품질경보 실시간 수신)
    const unsubIssues = subscribeUrgentIssues((issues) => {
      setUrgentIssues(issues || []);
      setLastRefreshedAt(new Date());
      setIsLoading(false);
    });

    // 2. Extrusion Reports (압출 작업일보, TPM 이상신고, 비가동/불량)
    const unsubExt = subscribeToExtrusionReports((reports) => {
      setExtrusionReports(reports || []);
      setLastRefreshedAt(new Date());
    });

    // 3. Extrusion Quality Issues (압출 품질경보 실시간 수신)
    const unsubExtQuality = subscribeExtrusionQualityIssues((alerts) => {
      setExtrusionQualityAlerts(alerts || []);
      setLastRefreshedAt(new Date());
    });

    return () => {
      if (unsubIssues) unsubIssues();
      if (unsubExt) unsubExt();
      if (unsubExtQuality) unsubExtQuality();
    };
  }, []);

  const handleManualRefresh = () => {
    setLastRefreshedAt(new Date());
    setUrgentIssues(getLocalUrgentIssues());
    setExtrusionQualityAlerts(getLocalExtrusionQualityIssues());
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
    // 1. [Method] 관리자 품질경보만 취합 (오픈이슈, 회의일정, 사내공지 제외!)
    // -----------------------------------------------------------------------
    (urgentIssues || []).forEach((issue) => {
      if (!issue) return;
      if (issue.isDeleted === true || issue.isDeleted === "true" || issue.deleted === true) return;

      const rawCat = String(issue.category || "").trim();
      const catLower = rawCat.toLowerCase();
      const titleLower = String(issue.title || "").toLowerCase();
      const contentLower = String(issue.content || "").toLowerCase();

      const isQualityAlert =
        rawCat === "품질경보" ||
        rawCat === "품질 경보" ||
        rawCat === "품질이슈" ||
        rawCat === "품질 이슈" ||
        catLower === "quality_alert" ||
        catLower === "quality_issue" ||
        catLower === "quality" ||
        rawCat.includes("품질경보") ||
        rawCat.includes("품질") ||
        issue.type === "QUALITY_ALERT" ||
        issue.type === "품질경보" ||
        titleLower.includes("품질경보") ||
        contentLower.includes("품질경보");

      if (!isQualityAlert) return; // 품질경보만 엄선 수집

      const rawDate =
        issue.date ||
        issue.expireDate ||
        issue.startDate ||
        issue.targetDate ||
        (issue.createdAt ? String(issue.createdAt).slice(0, 10) : todayStr);
      const dateStr = String(rawDate).slice(0, 10);

      const isResolved = Boolean(
        issue.isResolved || (issue.actionResult && issue.actionResult.trim())
      );

      const displayTitle = issue.title || issue.content || "(품질경보 발령)";
      const displayContent = issue.content || issue.details || "";

      unified.push({
        id: `urg_${issue.id || issue._docId || Math.random()}`,
        fourM: "Method",
        origin: "품질경보",
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
          severity: abnormalChecks.some((c) => c.status === "NG") ? "HIGH" : "MEDIUM",
          downtimeMinutes: 0,
          scrapKg: 0,
          raw: report
        });
      }

      // 3-2. 비가동 (Machine) & 불량손실 (Material)
      const dtEvents = Array.isArray(report.downtimeEvents) ? report.downtimeEvents : [];
      dtEvents.forEach((ev, evIdx) => {
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
            severity: scrapKg >= 10 || minutes >= 60 ? "HIGH" : "NORMAL",
            downtimeMinutes: minutes,
            scrapKg: scrapKg,
            raw: { report, event: ev }
          });
        }
      });
    });

    // -----------------------------------------------------------------------
    // 4. [Method] 압출 전용 품질 이슈 (품질경보)
    // -----------------------------------------------------------------------
    (extrusionQualityAlerts || []).forEach((alert) => {
      if (alert.id === "ext_qual_demo_1" || alert.id === "ext_qual_demo_2" || String(alert.id).startsWith("demo_")) return;

      const title = alert.title
        ? `[품질경보] ${alert.title}`
        : `[품질경보] ${alert.defectType || "압출 품질이상"}`;
      const content = alert.content || alert.details || alert.description || alert.defectType || "";
      const rawDate = alert.date || (alert.createdAt ? String(alert.createdAt).slice(0, 10) : todayStr);
      const isResolved = alert.status === "RESOLVED" || Boolean(alert.actionResult && alert.actionResult.trim());

      const causeImages = Array.isArray(alert.causeImages)
        ? alert.causeImages
        : Array.isArray(alert.images)
        ? alert.images
        : [];
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      unified.push({
        id: `ext_q_${alert.id}`,
        fourM: "Method",
        origin: "품질경보",
        sourceType: "QUALITY_ALERT",
        badgeColor: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700",
        plant: alert.plant || "삼랑진공장",
        line: alert.line || alert.lineId || "압출라인",
        writer: alert.author ? `${alert.author} ${alert.authorTitle || ""}`.trim() : "설유철 책임",
        title: title,
        date: String(rawDate).slice(0, 10),
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        content: content,
        actionResult: alert.actionResult || alert.actionNotes || alert.actionGuide || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionAt: alert.updatedAt || alert.actionAt || "",
        images: causeImages,
        actionImages: actionImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        isResolved: isResolved,
        severity: "HIGH",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: alert
      });
    });

    // 최신 발생일자 DESC, ID DESC 정렬
    return unified.sort((a, b) => {
      if (b.date !== a.date) return (b.date || "").localeCompare(a.date || "");
      if (b.time !== a.time) return (b.time || "").localeCompare(a.time || "");
      return String(b.id || "").localeCompare(String(a.id || ""));
    });
  }, [urgentIssues, extrusionReports, workLogs, extrusionQualityAlerts, todayStr]);

  // =========================================================================
  // 🔍 필터링 연산
  // =========================================================================
  const filteredRecords = useMemo(() => {
    return allUnifiedRecords.filter((rec) => {
      // 1. 공장 필터
      if (selectedPlant !== "ALL") {
        if (!rec.plant || !rec.plant.includes(selectedPlant.replace("공장", ""))) return false;
      }

      // 2. 4M 구분 탭 필터
      if (selected4MTab !== "ALL") {
        if (rec.fourM.toUpperCase() !== selected4MTab.toUpperCase()) return false;
      }

      // 3. 출처 구분 필터
      if (selectedOriginFilter !== "ALL") {
        if (rec.origin !== selectedOriginFilter) return false;
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
  }, [allUnifiedRecords, selectedPlant, selected4MTab, selectedOriginFilter, selectedStatusFilter, selectedPhotoFilter, selectedDateFilter, customDateInput, searchQuery, todayStr]);

  // =========================================================================
  // 📊 4M 통계 집계
  // =========================================================================
  const stats = useMemo(() => {
    const totalCount = allUnifiedRecords.length;

    // 1. Machine: 설비수리 + 비가동 + TPM
    const machineRecords = allUnifiedRecords.filter((r) => r.fourM === "Machine");
    const repairCount = machineRecords.filter((r) => r.origin === "설비수리").length;
    const downtimeCount = machineRecords.filter((r) => r.origin === "비가동").length;
    const tpmCount = machineRecords.filter((r) => r.origin === "TPM 이상신고").length;
    const totalDowntimeMin = machineRecords.reduce((acc, r) => acc + (r.downtimeMinutes || 0), 0);

    // 2. Material: 불량손실
    const materialRecords = allUnifiedRecords.filter((r) => r.fourM === "Material");
    const totalScrapKg = Number(materialRecords.reduce((acc, r) => acc + (r.scrapKg || 0), 0).toFixed(1));

    // 3. Method: 품질경보
    const methodRecords = allUnifiedRecords.filter((r) => r.fourM === "Method");
    const methodPending = methodRecords.filter((r) => !r.isResolved).length;

    // 사진 총 건수
    const totalPhotos = allUnifiedRecords.reduce((acc, r) => acc + (r.images?.length || 0) + (r.actionImages?.length || 0), 0);

    return {
      totalCount,
      machineCount: machineRecords.length,
      repairCount,
      downtimeCount,
      tpmCount,
      totalDowntimeMin,
      materialCount: materialRecords.length,
      totalScrapKg,
      methodCount: methodRecords.length,
      methodPending,
      totalPhotos
    };
  }, [allUnifiedRecords]);

  // 상세 모달 열기
  const handleOpenDetailModal = (item) => {
    setSelectedItemForDetail(item);
    setActionInputText(item.actionResult || "");
    setActionAuthorInput(currentProfile?.name || "TEST 선임");
    setActionPhotos([]);
  };

  // 상세 모달 닫기
  const handleCloseDetailModal = () => {
    setSelectedItemForDetail(null);
    setActionInputText("");
    setActionPhotos([]);
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
    if (!actionInputText.trim()) {
      alert("조치 내용을 입력해 주세요.");
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
      const newActionImages = actionPhotos.map((p) => p.dataUrl || p);
      if (selectedItemForDetail.sourceType === "QUALITY_ALERT") {
        const rawIssue = selectedItemForDetail.raw;
        if (rawIssue && rawIssue.id) {
          if (String(selectedItemForDetail.id).startsWith("urg_")) {
            await updateUrgentIssueActionResult(
              rawIssue.id,
              actionInputText.trim(),
              actionAuthorInput || "TEST 선임",
              newActionImages
            );
            await addIssueReply(rawIssue.id, {
              author: actionAuthorInput || "TEST 선임",
              content: `[4M 조치등록] ${actionInputText.trim()}`,
              files: newActionImages,
              actionDate: nowStr
            }).catch(() => {});
          } else if (String(selectedItemForDetail.id).startsWith("ext_q_")) {
            await saveExtrusionQualityIssue({
              ...rawIssue,
              actionResult: actionInputText.trim(),
              actionAuthor: actionAuthorInput || "TEST 선임",
              actionImages: [...(rawIssue.actionImages || []), ...newActionImages],
              status: "RESOLVED"
            });
          }
        }
      }

      setSelectedItemForDetail((prev) => ({
        ...prev,
        actionResult: actionInputText.trim(),
        actionAuthor: actionAuthorInput || "TEST 선임",
        actionAt: nowStr,
        actionImages: [...(prev.actionImages || []), ...newActionImages],
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

  // 현대차형 4M 엑셀 추출
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      alert("출력할 데이터가 없습니다.");
      return;
    }

    const rows = filteredRecords.map((r, i) => ({
      "No": i + 1,
      "4M 구분": r.fourM,
      "구분": r.origin,
      "발생일자": r.date,
      "발생시간": r.time || "-",
      "공장": r.plant,
      "라인/설비": r.line || "-",
      "보고자": r.writer,
      "변동 및 이상 발생내용": r.title,
      "상세 내용": r.content,
      "비가동(분)": r.downtimeMinutes || 0,
      "불량손실(kg)": r.scrapKg || 0,
      "조치 상태": r.isResolved ? "조치완료" : "미조치(진행중)",
      "조치 내용": r.actionResult || "-",
      "조치자": r.actionAuthor || "-",
      "조치일시": r.actionAt || "-",
      "첨부사진 수": (r.images?.length || 0) + (r.actionImages?.length || 0)
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
                  <span>📋 4M 변동점 관리대장 (설비수리·비가동·불량·품질경보)</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white shadow-xs border border-indigo-400/40">
                  한림공장 TEST 관제
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/90 font-medium">
                작업일보 <b>비가동·불량·TPM</b> + 전재율 <b>설비수리</b> + 관리자 <b>품질경보</b> 핵심 변동점을 1줄로 취합합니다.
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

        {/* 3 Core 4M KPI Cards */}
        <div className="grid grid-cols-3 gap-2 pt-0.5">
          {/* Machine: 설비수리·비가동·TPM */}
          <div
            onClick={() => setSelected4MTab("MACHINE")}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              selected4MTab === "MACHINE"
                ? "bg-indigo-950/90 border-indigo-400 ring-1 ring-indigo-400/40"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-indigo-300 font-bold">
              <span className="flex items-center gap-1">
                <Wrench className="w-3 h-3 text-indigo-400" />
                <span>[Machine] 설비</span>
              </span>
              <span className="text-[10px] text-indigo-200">
                비가동 {stats.totalDowntimeMin}분
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline justify-between">
              <span className="text-base sm:text-lg font-black text-white">{stats.machineCount}건</span>
              <span className="text-[10px] text-indigo-300">수리 {stats.repairCount} · 비가동 {stats.downtimeCount} · TPM {stats.tpmCount}</span>
            </div>
          </div>

          {/* Material: 불량손실 */}
          <div
            onClick={() => setSelected4MTab("MATERIAL")}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              selected4MTab === "MATERIAL"
                ? "bg-rose-950/90 border-rose-400 ring-1 ring-rose-400/40"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-rose-300 font-bold">
              <span className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-rose-400" />
                <span>[Material] 불량</span>
              </span>
              <span className="text-[10px] text-rose-200">
                손실 {stats.totalScrapKg} kg
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline justify-between">
              <span className="text-base sm:text-lg font-black text-white">{stats.materialCount}건</span>
              <span className="text-[10px] text-rose-300">뜯김/철심/스코치</span>
            </div>
          </div>

          {/* Method: 품질경보 */}
          <div
            onClick={() => setSelected4MTab("METHOD")}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              selected4MTab === "METHOD"
                ? "bg-amber-950/90 border-amber-400 ring-1 ring-amber-400/40"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold">
              <span className="flex items-center gap-1">
                <AlertOctagon className="w-3 h-3 text-amber-400" />
                <span>[Method] 품질경보</span>
              </span>
              <span className="text-[10px] text-amber-200">
                미조치 {stats.methodPending}건
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline justify-between">
              <span className="text-base sm:text-lg font-black text-white">{stats.methodCount}건</span>
              <span className="text-[10px] text-amber-300">관리자 발령</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Filter Bar */}
      {/* ========================================================================= */}
      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        {/* Row 1: 4M Tab Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar flex-nowrap">
          <button
            type="button"
            onClick={() => { setSelected4MTab("ALL"); setSelectedOriginFilter("ALL"); }}
            className={`px-2.5 py-1 rounded-lg font-black text-xs shrink-0 transition-all cursor-pointer ${
              selected4MTab === "ALL" && selectedOriginFilter === "ALL"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            전체 ({allUnifiedRecords.length})
          </button>

          <button
            type="button"
            onClick={() => { setSelected4MTab("MACHINE"); setSelectedOriginFilter("설비수리"); }}
            className={`px-2.5 py-1 rounded-lg font-black text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
              selectedOriginFilter === "설비수리"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>🔧 설비수리</span>
            <span className="text-[10px] opacity-80">({stats.repairCount})</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelected4MTab("MACHINE"); setSelectedOriginFilter("비가동"); }}
            className={`px-2.5 py-1 rounded-lg font-black text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
              selectedOriginFilter === "비가동"
                ? "bg-orange-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>⏸️ 비가동</span>
            <span className="text-[10px] opacity-80">({stats.downtimeCount})</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelected4MTab("MACHINE"); setSelectedOriginFilter("TPM 이상신고"); }}
            className={`px-2.5 py-1 rounded-lg font-black text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
              selectedOriginFilter === "TPM 이상신고"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>⚡ TPM 이상신고</span>
            <span className="text-[10px] opacity-80">({stats.tpmCount})</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelected4MTab("MATERIAL"); setSelectedOriginFilter("불량손실"); }}
            className={`px-2.5 py-1 rounded-lg font-black text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
              selectedOriginFilter === "불량손실"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>🛑 불량손실</span>
            <span className="text-[10px] opacity-80">({stats.materialCount})</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelected4MTab("METHOD"); setSelectedOriginFilter("품질경보"); }}
            className={`px-2.5 py-1 rounded-lg font-black text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
              selectedOriginFilter === "품질경보"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>🚨 품질경보</span>
            <span className="text-[10px] opacity-80">({stats.methodCount})</span>
          </button>
        </div>

        {/* Row 2: Select Filters & Search */}
        <div className="grid grid-cols-2 sm:grid-cols-12 gap-1.5 items-center text-xs">
          <div className="sm:col-span-2">
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-xs"
            >
              <option value="ALL">전 공장</option>
              <option value="삼랑진공장">삼랑진</option>
              <option value="한림공장">한림</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-xs"
            >
              <option value="ALL">전체 상태</option>
              <option value="PENDING">🚨 미조치</option>
              <option value="RESOLVED">✅ 조치완료</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={selectedPhotoFilter}
              onChange={(e) => setSelectedPhotoFilter(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-xs"
            >
              <option value="ALL">전체 사진</option>
              <option value="ONLY_PHOTOS">📷 사진 첨부만</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={selectedDateFilter}
              onChange={(e) => {
                setSelectedDateFilter(e.target.value);
                if (e.target.value !== "CUSTOM") setCustomDateInput("");
              }}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-xs"
            >
              <option value="ALL">전체 기간</option>
              <option value="TODAY">오늘</option>
              <option value="WEEK">최근 7일</option>
              <option value="CUSTOM">직접선택</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-4">
            {selectedDateFilter === "CUSTOM" ? (
              <input
                type="date"
                value={customDateInput}
                onChange={(e) => setCustomDateInput(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-indigo-400 bg-indigo-50 dark:bg-slate-800 text-xs font-bold"
              />
            ) : (
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="설비/품목/작업자/내용 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 1줄짜리 초간결 목록표 (High-Density 1-Line Table View) */}
      {/* ========================================================================= */}
      {viewMode === "table" ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700 whitespace-nowrap text-[11px]">
                  <th className="py-2.5 px-2 text-center w-7">No</th>
                  <th className="py-2.5 px-2 text-center w-20">구분</th>
                  <th className="py-2.5 px-2 text-center w-20">일시</th>
                  <th className="py-2.5 px-2 text-center w-12">공장</th>
                  <th className="py-2.5 px-3 min-w-[340px] w-full">변동 및 발생내용 (클릭 시 상세 팝업)</th>
                  <th className="py-2.5 px-2 text-center w-14">손실</th>
                  <th className="py-2.5 px-2 text-center w-16">조치</th>
                  <th className="py-2.5 px-1.5 text-center w-12">사진</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
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
                        : "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300";

                    // Plant formatting (초간결: 삼 / 한)
                    const pShort = item.plant?.includes("한림") ? "한" : "삼";

                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleOpenDetailModal(item)}
                        className="hover:bg-indigo-50/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
                        title="클릭하여 상세 내용 및 조치 등록 팝업 열기"
                      >
                        {/* No */}
                        <td className="py-2.5 px-2 text-center font-mono text-slate-400 text-[10.5px] whitespace-nowrap">
                          {idx + 1}
                        </td>

                        {/* 구분 */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                            {item.origin}
                          </span>
                        </td>

                        {/* 일시 */}
                        <td className="py-2.5 px-2 text-center font-mono text-slate-600 dark:text-slate-400 text-[10.5px] whitespace-nowrap">
                          {item.date}
                        </td>

                        {/* 공장 (삼 / 한) */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black text-[11px]">
                            {pShort}
                          </span>
                        </td>

                        {/* 변동 및 발생내용 (화면 공간을 최대로 활용하여 제목과 상세 내용 모두 표출) */}
                        <td className="py-2.5 px-3 min-w-[340px] w-full">
                          <div className="font-black text-slate-900 dark:text-white text-xs leading-relaxed group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors break-words">
                            {item.title}
                          </div>
                          {item.content && item.content.trim() !== item.title.trim() && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line break-words leading-relaxed font-normal">
                              {item.content}
                            </div>
                          )}
                          {item.actionResult && (
                            <div className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
                              <span>↳ 🟢 [조치] {item.actionResult}</span>
                            </div>
                          )}
                        </td>

                        {/* 손실 (분/kg) */}
                        <td className="py-2.5 px-2 text-center font-mono text-[10.5px] whitespace-nowrap">
                          {item.downtimeMinutes > 0 ? (
                            <span className="text-orange-600 dark:text-orange-400 font-bold">{item.downtimeMinutes}분</span>
                          ) : item.scrapKg > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">{item.scrapKg}kg</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">-</span>
                          )}
                        </td>

                        {/* 조치 (조치완료 vs 조치중) */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                              item.isResolved
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse"
                            }`}
                          >
                            {item.isResolved ? "조치완료" : "조치중"}
                          </span>
                        </td>

                        {/* 사진 */}
                        <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                          {hasPhotos ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const firstImg = item.images?.[0] || item.actionImages?.[0];
                                const src = typeof firstImg === "object" ? firstImg.dataUrl || firstImg.url : firstImg;
                                if (src) setPreviewImage(src);
                              }}
                              className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[10px] font-bold hover:scale-105"
                              title="사진 미리보기"
                            >
                              <Camera className="w-2.5 h-2.5 text-amber-600" />
                              <span>{photoCount}</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">-</span>
                          )}
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
                <div className="flex items-center gap-1.5">
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
                  <span className="text-slate-400 block">발생일시</span>
                  <span className="font-black text-slate-900 dark:text-white">{selectedItemForDetail.date} {selectedItemForDetail.time || ""}</span>
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

                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={handleCloseDetailModal}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
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
