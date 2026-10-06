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
import { subscribeUrgentIssues, addIssueReply, saveUrgentIssue } from "../../services/urgentIssueService";
import { subscribeToExtrusionReports } from "../../services/extrusionProductionService";
import { getLocalExtrusionQualityIssues } from "../../services/extrusionQualityIssueService";
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
  const [urgentIssues, setUrgentIssues] = useState([]);
  const [extrusionReports, setExtrusionReports] = useState([]);
  const [extrusionQualityAlerts, setExtrusionQualityAlerts] = useState(() => getLocalExtrusionQualityIssues());
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  // View Mode: 'table' (1-line ledger table) vs 'card' (detailed timeline cards)
  const [viewMode, setViewMode] = useState("table");

  // Filter States
  const [selectedPlant, setSelectedPlant] = useState("ALL"); // ALL | 삼랑진공장 | 한림공장
  const [selected4MTab, setSelected4MTab] = useState("ALL"); // ALL | MACHINE | MATERIAL | METHOD | MAN
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

    // 1. Urgent Issues (품질경보, 오픈이슈)
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

    return () => {
      if (unsubIssues) unsubIssues();
      if (unsubExt) unsubExt();
    };
  }, []);

  const handleManualRefresh = () => {
    setLastRefreshedAt(new Date());
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
  // 🌟 4M Change Point Data Aggregation Engine (현대차 4M 변동점 관리대장 표준)
  // =========================================================================
  const allUnifiedRecords = useMemo(() => {
    const unified = [];

    // -----------------------------------------------------------------------
    // 1. [Method / 품질경보] 관리자 품질경보 & 오픈이슈 (urgentIssues)
    // -----------------------------------------------------------------------
    (urgentIssues || []).forEach((issue) => {
      if (issue.isDeleted) return;

      const isQuality = issue.category === "품질경보";
      const isOpen = issue.category === "오픈이슈" || issue.category === "품질이슈";
      const isNotice = issue.category === "공지사항" || issue.category === "사내공지";
      const isMeeting = issue.category === "회의일정";

      const dateStr = issue.date || (issue.createdAt ? String(issue.createdAt).slice(0, 10) : todayStr);
      const isResolved = Boolean(issue.isResolved || (isQuality && issue.actionResult));

      const fourMType = isQuality ? "Method" : (isOpen ? "Method" : (isMeeting ? "Method" : "Man"));
      const originName = isQuality ? "품질경보" : (isOpen ? "오픈이슈" : (isMeeting ? "회의일정" : "사내공지"));

      unified.push({
        id: `urg_${issue.id || issue._docId || Math.random()}`,
        fourM: fourMType, // 'Machine' | 'Material' | 'Method' | 'Man'
        origin: originName,
        sourceType: isQuality ? "QUALITY_ALERT" : (isOpen ? "OPEN_ISSUE" : (isMeeting ? "MEETING" : "NOTICE")),
        badgeColor: isQuality
          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800"
          : isOpen
          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-800"
          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800",
        plant: issue.plant || (isQuality ? "삼랑진공장" : "전공장"),
        line: issue.line || "품질/제조",
        writer: issue.author ? `${issue.author} ${issue.authorTitle || ""}`.trim() : "관리자",
        title: issue.title || "(제목 없음)",
        date: dateStr,
        time: issue.time || (issue.createdAt && issue.createdAt.includes(":") ? issue.createdAt.slice(11, 16) : ""),
        content: issue.content || "",
        actionResult: issue.actionResult || "",
        actionAuthor: issue.actionAuthor || "",
        actionAt: issue.actionAt || "",
        images: Array.isArray(issue.images) ? issue.images : [],
        actionImages: Array.isArray(issue.actionImages) ? issue.actionImages : [],
        replies: Array.isArray(issue.replies) ? issue.replies : [],
        isResolved,
        severity: isQuality ? "HIGH" : "NORMAL",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: issue
      });
    });

    // -----------------------------------------------------------------------
    // 2. [Machine / 설비보전] 전재율 책임 설비수리이력 & 현장 설비보전 일지
    // -----------------------------------------------------------------------
    (workLogs || []).forEach((log) => {
      if (log.isDeleted) return;

      const isMaintenance = log.process === "설비보전" || log.writer === "전재율" || (Array.isArray(log.maintenanceItems) && log.maintenanceItems.length > 0);
      const hasIssues = Boolean(log.issues && log.issues.trim() && log.issues.trim() !== "없음" && log.issues.trim() !== "-");
      const hasSpecial = Boolean(log.specialNotes && log.specialNotes.trim() && log.specialNotes.trim() !== "없음" && log.specialNotes.trim() !== "-");

      const plant = log.plant || (["김동욱", "우창용", "TEST", "오상민", "정현규", "부림텍", "한울"].includes(log.writer) ? "한림공장" : "삼랑진공장");

      // Case A: 전재율 책임 설비수리/보전 이력 (Machine 4M)
      if (isMaintenance) {
        const mItems = Array.isArray(log.maintenanceItems) ? log.maintenanceItems : [];
        const maintSummary = mItems
          .map((m, idx) => `[${idx + 1}] ${m.category || "설비"} (${m.equipmentName || "일반"}): ${m.content || ""}`)
          .join("\n");

        const fullContent = [
          maintSummary ? `[설비보전 및 수리점검 내역]\n${maintSummary}` : "",
          log.workContent ? `[작업 상세]\n${log.workContent}` : "",
          hasIssues ? `[특이 이상발생]\n${log.issues}` : ""
        ].filter(Boolean).join("\n\n");

        unified.push({
          id: `wl_maint_${log.id}`,
          fourM: "Machine",
          origin: "전재율 설비수리",
          sourceType: "MAINTENANCE",
          badgeColor: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700",
          plant,
          line: log.line || "설비보전팀",
          writer: log.writer || "전재율 책임",
          title: `[설비수리] ${log.writer} (${log.line || "설비보전"}) 수리 및 점검 이력`,
          date: log.date || todayStr,
          time: log.createdAt ? log.createdAt.slice(11, 16) : "",
          content: fullContent || log.workContent || "설비보전 수리 점검 완료",
          actionResult: log.approvalComment || "정기 점검 및 수리 조치 완료",
          actionAuthor: log.approverName || "전재율",
          actionAt: log.approvalDate || log.date || "",
          images: Array.isArray(log.images) ? log.images : (Array.isArray(log.photos) ? log.photos : []),
          actionImages: [],
          replies: [],
          isResolved: true,
          severity: "NORMAL",
          downtimeMinutes: 0,
          scrapKg: 0,
          raw: log
        });
      }

      // Case B: 일반 현장 작업일지 특이사항 & 이상발생 (Man 4M)
      if (!isMaintenance && (hasIssues || hasSpecial)) {
        const fullContent = [
          hasIssues ? `[주요 이슈 및 이상발생]\n${log.issues}` : "",
          hasSpecial ? `[특이사항 및 전달사항]\n${log.specialNotes}` : ""
        ].filter(Boolean).join("\n\n");

        unified.push({
          id: `wl_issue_${log.id}`,
          fourM: "Man",
          origin: "현장일지 특이사항",
          sourceType: "WORK_LOG_ISSUE",
          badgeColor: "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200 border-teal-300 dark:border-teal-700",
          plant,
          line: log.process || log.line || "가공동",
          writer: log.writer || "현장 작업자",
          title: `[현장특이사항] ${log.writer} (${log.process || "가공"}) 업무일지 전달사항`,
          date: log.date || todayStr,
          time: log.createdAt ? log.createdAt.slice(11, 16) : "",
          content: fullContent,
          actionResult: log.approvalComment || "",
          actionAuthor: log.approverName || "",
          actionAt: log.approvalDate || "",
          images: Array.isArray(log.photos) ? log.photos : (Array.isArray(log.images) ? log.images : []),
          actionImages: [],
          replies: [],
          isResolved: log.approvalStatus === "결재완료" || log.approvalStatus === "APPROVED",
          severity: hasIssues ? "HIGH" : "NORMAL",
          downtimeMinutes: 0,
          scrapKg: 0,
          raw: log
        });
      }
    });

    // -----------------------------------------------------------------------
    // 3. [Machine & Material] 압출 작업일보 - TPM 이상발생 / 비가동 / 불량
    // -----------------------------------------------------------------------
    (extrusionReports || []).forEach((report) => {
      // 3-1. TPM 이상신고 (Machine 4M)
      const hasTpmText = Boolean(report.tpmIssueText && report.tpmIssueText.trim());
      const hasTpmPhotos = Array.isArray(report.tpmIssuePhotos) && report.tpmIssuePhotos.length > 0;
      const abnormalChecks = (report.tpmChecks || []).filter((c) => c && (c.status === "WARN" || c.status === "NG"));

      if (hasTpmText || hasTpmPhotos || abnormalChecks.length > 0) {
        const checkSummary = abnormalChecks
          .map((c) => `• [${c.status === "NG" ? "✕ 불량" : "△ 요관찰"}] ${c.id}: ${c.note || "조치 필요"}`)
          .join("\n");

        const fullContent = [
          hasTpmText ? `[현장 이상신고] ${report.tpmIssueText}` : "",
          abnormalChecks.length > 0 ? `[TPM 10대 자주보전 이상 점검]\n${checkSummary}` : ""
        ].filter(Boolean).join("\n\n");

        unified.push({
          id: `ext_tpm_${report.id}`,
          fourM: "Machine",
          origin: "압출 TPM 이상신고",
          sourceType: "EXTRUSION_TPM",
          badgeColor: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700",
          plant: report.plant || "삼랑진공장",
          line: report.lineName || report.lineId || "압출라인",
          writer: report.worker || "압출 작업자",
          title: `[TPM 이상발생] ${report.lineName || report.lineId} 설비·품질 이상신고 (${report.shift || "주간"})`,
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

      // 3-2. 비가동 (Machine 4M) & 불량 (Material 4M) 이벤트
      const dtEvents = Array.isArray(report.downtimeEvents) ? report.downtimeEvents : [];
      dtEvents.forEach((ev, evIdx) => {
        const isDefect = ev.type === "불량" || ["뜯김", "철심", "재압출", "단면형상", "스코치", "이물", "미분산", "발포", "원인불명", "밴딩", "심금절단", "심금노출", "천공", "연고무절단", "길이", "코팅"].includes(ev.category);
        const minutes = Number(ev.minutes) || 0;
        const scrapKg = Number(ev.scrapKg) || 0;

        if (minutes > 0 || scrapKg > 0 || ev.detail) {
          const fourMType = isDefect ? "Material" : "Machine";
          const originName = isDefect ? "작업일보 불량손실" : "작업일보 설비비가동";

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
            title: `[${isDefect ? "불량발생" : "설비비가동"}] ${ev.category} (${minutes > 0 ? `${minutes}분 ` : ""}${scrapKg > 0 ? `${scrapKg}kg` : ""})`,
            date: report.date || todayStr,
            time: ev.startTime ? `${ev.startTime}~${ev.endTime}` : (report.createdAt ? report.createdAt.slice(11, 16) : ""),
            content: ev.detail || `${ev.category} 발생으로 인한 ${isDefect ? "불량 손실" : "설비 비가동"} 발생`,
            actionResult: report.notes || "현장 라인 즉시 조치 및 정상 재가동",
            actionAuthor: report.worker || report.approvedBy || "작업자",
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
    // 4. [Method & Material] 압출 전용 품질 이슈 (extrusionQualityAlerts)
    // -----------------------------------------------------------------------
    (extrusionQualityAlerts || []).forEach((alert) => {
      unified.push({
        id: `ext_q_${alert.id}`,
        fourM: "Method",
        origin: "압출 품질경보",
        sourceType: "QUALITY_ALERT",
        badgeColor: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700",
        plant: "삼랑진공장",
        line: alert.line || "압출라인",
        writer: alert.author ? `${alert.author} ${alert.authorTitle || ""}` : "설유철 책임",
        title: `[압출품질] ${alert.title || alert.defectType}`,
        date: alert.date || todayStr,
        time: alert.time || "",
        content: alert.content || alert.details || "",
        actionResult: alert.actionResult || alert.actionNotes || "",
        actionAuthor: alert.author || "",
        actionAt: alert.updatedAt || "",
        images: Array.isArray(alert.images) ? alert.images : [],
        actionImages: [],
        replies: [],
        isResolved: alert.status === "RESOLVED",
        severity: "HIGH",
        downtimeMinutes: 0,
        scrapKg: 0,
        raw: alert
      });
    });

    // Sort strictly by latest date DESC, then ID DESC
    return unified.sort((a, b) => {
      if (b.date !== a.date) return (b.date || "").localeCompare(a.date || "");
      if (b.time !== a.time) return (b.time || "").localeCompare(a.time || "");
      return String(b.id || "").localeCompare(String(a.id || ""));
    });
  }, [urgentIssues, extrusionReports, workLogs, extrusionQualityAlerts, todayStr]);

  // =========================================================================
  // 🔍 Filtered Records Computation
  // =========================================================================
  const filteredRecords = useMemo(() => {
    return allUnifiedRecords.filter((rec) => {
      // 1. Plant Filter
      if (selectedPlant !== "ALL") {
        if (!rec.plant || !rec.plant.includes(selectedPlant.replace("공장", ""))) return false;
      }

      // 2. 4M Tab Filter
      if (selected4MTab !== "ALL") {
        if (rec.fourM.toUpperCase() !== selected4MTab.toUpperCase()) return false;
      }

      // 3. Status Filter
      if (selectedStatusFilter === "PENDING" && rec.isResolved) return false;
      if (selectedStatusFilter === "RESOLVED" && !rec.isResolved) return false;

      // 4. Photo Filter
      if (selectedPhotoFilter === "ONLY_PHOTOS") {
        const hasP = (rec.images && rec.images.length > 0) || (rec.actionImages && rec.actionImages.length > 0);
        if (!hasP) return false;
      }

      // 5. Date Filter
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

      // 6. Search Query
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
  }, [allUnifiedRecords, selectedPlant, selected4MTab, selectedStatusFilter, selectedPhotoFilter, selectedDateFilter, customDateInput, searchQuery, todayStr]);

  // =========================================================================
  // 📊 4M Summary Statistics
  // =========================================================================
  const stats = useMemo(() => {
    const totalCount = allUnifiedRecords.length;

    // 1. Machine (전재율 수리 + 압출 TPM + 설비 비가동)
    const machineRecords = allUnifiedRecords.filter((r) => r.fourM === "Machine");
    const machinePending = machineRecords.filter((r) => !r.isResolved).length;
    const totalDowntimeMin = machineRecords.reduce((acc, r) => acc + (r.downtimeMinutes || 0), 0);

    // 2. Material (불량 손실 + 원자재)
    const materialRecords = allUnifiedRecords.filter((r) => r.fourM === "Material");
    const totalScrapKg = Number(materialRecords.reduce((acc, r) => acc + (r.scrapKg || 0), 0).toFixed(1));

    // 3. Method (품질경보 + 오픈이슈)
    const methodRecords = allUnifiedRecords.filter((r) => r.fourM === "Method");
    const methodPending = methodRecords.filter((r) => !r.isResolved).length;

    // 4. Man (작업자 + 현장일지 특이사항)
    const manRecords = allUnifiedRecords.filter((r) => r.fourM === "Man");

    // Photos count
    const totalPhotos = allUnifiedRecords.reduce((acc, r) => acc + (r.images?.length || 0) + (r.actionImages?.length || 0), 0);

    return {
      totalCount,
      machineCount: machineRecords.length,
      machinePending,
      totalDowntimeMin,
      materialCount: materialRecords.length,
      totalScrapKg,
      methodCount: methodRecords.length,
      methodPending,
      manCount: manRecords.length,
      totalPhotos
    };
  }, [allUnifiedRecords]);

  // Open Detail Modal Handler
  const handleOpenDetailModal = (item) => {
    setSelectedItemForDetail(item);
    setActionInputText(item.actionResult || "");
    setActionAuthorInput(currentProfile?.name || "TEST 선임");
    setActionPhotos([]);
  };

  // Close Detail Modal Handler
  const handleCloseDetailModal = () => {
    setSelectedItemForDetail(null);
    setActionInputText("");
    setActionPhotos([]);
  };

  // Handle Photo Upload in Action Form
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

  // Save Action Result & Photos Handler
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
      // 1. If urgentIssue / 품질경보
      if (selectedItemForDetail.sourceType === "QUALITY_ALERT" || selectedItemForDetail.sourceType === "OPEN_ISSUE") {
        const rawIssue = selectedItemForDetail.raw;
        if (rawIssue && rawIssue.id) {
          await addIssueReply(rawIssue.id, {
            author: actionAuthorInput || "TEST 선임",
            content: actionInputText.trim(),
            files: actionPhotos.map((p) => p.dataUrl || p),
            actionDate: nowStr
          });
        }
      }

      // Optimistic local update on selected item
      setSelectedItemForDetail((prev) => ({
        ...prev,
        actionResult: actionInputText.trim(),
        actionAuthor: actionAuthorInput || "TEST 선임",
        actionAt: nowStr,
        actionImages: [...(prev.actionImages || []), ...actionPhotos.map((p) => p.dataUrl || p)],
        isResolved: true
      }));

      alert("조치 내용 및 첨부 사진이 성공적으로 등록·저장되었습니다.");
    } catch (err) {
      console.error("Save action error:", err);
      alert("조치 내용 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingAction(false);
    }
  };

  // =========================================================================
  // 📥 Hyundai-style 4M Change Point Ledger Excel Export
  // =========================================================================
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      alert("출력할 데이터가 없습니다.");
      return;
    }

    const rows = filteredRecords.map((r, i) => ({
      "No": i + 1,
      "4M 구분": r.fourM,
      "상세 출처": r.origin,
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
      "조치 결과 및 피드백": r.actionResult || "-",
      "조치자": r.actionAuthor || "-",
      "조치일시": r.actionAt || "-",
      "첨부사진 수": (r.images?.length || 0) + (r.actionImages?.length || 0)
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "4M_변동점_관리대장");
    XLSX.writeFile(wb, `현대차형_4M_변동점_관리대장_${todayStr}.xlsx`);
  };

  return (
    <div className="space-y-3.5 sm:space-y-4 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. 4M Change Point Ledger Header Banner */}
      {/* ========================================================================= */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-2 border-indigo-500/50 shadow-xl space-y-3 relative overflow-hidden">
        {/* Soft Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-500 text-white shadow-md shadow-rose-500/20 shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-sm sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                  <span>📋 4M 변동점 관리대장 (통합 이상·설비수리·비가동·품질 관제)</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white shadow-xs border border-indigo-400/40">
                  한림공장 TEST 전용 관제
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-indigo-200/90 mt-0.5 font-medium">
                현대자동차 4M 변동점 관리 기준: <b>작업일보 비가동·불량·TPM</b> + <b>전재율 책임 설비수리이력</b> + <b>관리자 품질경보</b>를 1줄 대장으로 목록화합니다.
              </p>
            </div>
          </div>

          {/* Action & View Toggle Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-800/90 rounded-xl p-0.5 border border-indigo-500/30">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "table"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white"
                }`}
                title="1줄 관리대장 표 뷰"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">1줄 대장형</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "card"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white"
                }`}
                title="상세 카드 타임라인 뷰"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">카드형</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-indigo-200 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="실시간 데이터 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
              <span className="hidden sm:inline">새로고침</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/40"
              title="현대차 4M 변동점 관리대장 양식으로 엑셀 다운로드"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>4M 대장 엑셀</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. Top 4M Standard KPI Counters */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 pt-1">
          {/* KPI 1: [Machine] 설비/금형 (전재율 수리 + TPM + 비가동) */}
          <div
            onClick={() => setSelected4MTab("MACHINE")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              selected4MTab === "MACHINE"
                ? "bg-indigo-950/90 border-indigo-400 ring-2 ring-indigo-400/40"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-indigo-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                <span>[Machine] 설비수리·비가동</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-[10px] text-indigo-200">
                {stats.totalDowntimeMin}분
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg sm:text-xl font-black text-white">{stats.machineCount}건</span>
              <span className="text-[11px] text-indigo-300 font-medium">전재율/TPM/비가동</span>
            </div>
          </div>

          {/* KPI 2: [Material] 재료/불량 (압출 불량 발생 & 스크랩 손실) */}
          <div
            onClick={() => setSelected4MTab("MATERIAL")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              selected4MTab === "MATERIAL"
                ? "bg-rose-950/90 border-rose-400 ring-2 ring-rose-400/40"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-300 font-bold">
              <span className="flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                <span>[Material] 불량·원자재</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-rose-500/30 text-[10px] text-rose-200">
                {stats.totalScrapKg} kg
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg sm:text-xl font-black text-white">{stats.materialCount}건</span>
              <span className="text-[11px] text-rose-300 font-medium">뜯김/철심/스크랩</span>
            </div>
          </div>

          {/* KPI 3: [Method] 작업방법/품질 (관리자 품질경보 & 오픈이슈) */}
          <div
            onClick={() => setSelected4MTab("METHOD")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              selected4MTab === "METHOD"
                ? "bg-amber-950/90 border-amber-400 ring-2 ring-amber-400/40"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
              <span className="flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                <span>[Method] 품질경보·이슈</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-[10px] text-amber-200">
                미조치 {stats.methodPending}건
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg sm:text-xl font-black text-white">{stats.methodCount}건</span>
              <span className="text-[11px] text-amber-300 font-medium">관리자 발령</span>
            </div>
          </div>

          {/* KPI 4: [Man] 사람/작업자 (현장 일지 특이사항 & 작업자 전달사항) */}
          <div
            onClick={() => setSelected4MTab("MAN")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              selected4MTab === "MAN"
                ? "bg-teal-950/90 border-teal-400 ring-2 ring-teal-400/40"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-teal-300 font-bold">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span>[Man] 작업자·일지특이</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-teal-500/30 text-[10px] text-teal-200">
                사진 {stats.totalPhotos}장
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg sm:text-xl font-black text-white">{stats.manCount}건</span>
              <span className="text-[11px] text-teal-300 font-medium">가공/외주/전달사항</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Multi-Filter & Search Bar */}
      {/* ========================================================================= */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
        {/* Row 1: 4M Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-nowrap">
          <button
            type="button"
            onClick={() => setSelected4MTab("ALL")}
            className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer ${
              selected4MTab === "ALL"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            🌟 전체 4M 변동점 대장 ({allUnifiedRecords.length})
          </button>

          <button
            type="button"
            onClick={() => setSelected4MTab("MACHINE")}
            className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
              selected4MTab === "MACHINE"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>🔧 [Machine] 설비수리·비가동</span>
            <span className="text-[10px] opacity-80">({stats.machineCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelected4MTab("MATERIAL")}
            className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
              selected4MTab === "MATERIAL"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>🛑 [Material] 불량·원자재</span>
            <span className="text-[10px] opacity-80">({stats.materialCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelected4MTab("METHOD")}
            className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
              selected4MTab === "METHOD"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>🚨 [Method] 품질경보·이슈</span>
            <span className="text-[10px] opacity-80">({stats.methodCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelected4MTab("MAN")}
            className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
              selected4MTab === "MAN"
                ? "bg-teal-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>👷 [Man] 작업자·일지</span>
            <span className="text-[10px] opacity-80">({stats.manCount})</span>
          </button>
        </div>

        {/* Row 2: Plant, Status, Photo & Date Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
          {/* Plant Select */}
          <div className="sm:col-span-2">
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="ALL">🏢 전 공장</option>
              <option value="삼랑진공장">🏭 삼랑진공장</option>
              <option value="한림공장">🏭 한림공장</option>
            </select>
          </div>

          {/* Status Select */}
          <div className="sm:col-span-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="ALL">전체 조치상태</option>
              <option value="PENDING">🚨 미조치 / 진행중</option>
              <option value="RESOLVED">✅ 조치완료</option>
            </select>
          </div>

          {/* Photo Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedPhotoFilter}
              onChange={(e) => setSelectedPhotoFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="ALL">전체 내역</option>
              <option value="ONLY_PHOTOS">📷 사진 첨부 건만</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedDateFilter}
              onChange={(e) => {
                setSelectedDateFilter(e.target.value);
                if (e.target.value !== "CUSTOM") setCustomDateInput("");
              }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="ALL">📅 전체 기간</option>
              <option value="TODAY">📅 오늘 ({todayStr})</option>
              <option value="WEEK">📅 최근 7일</option>
              <option value="CUSTOM">📅 일자 직접지정</option>
            </select>
          </div>

          {/* Search Input or Custom Date */}
          <div className="sm:col-span-4">
            {selectedDateFilter === "CUSTOM" ? (
              <input
                type="date"
                value={customDateInput}
                onChange={(e) => setCustomDateInput(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-indigo-400 bg-indigo-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            ) : (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="설비/품목/작업자/이상내용/조치 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Main Ledger View: (Table Mode vs Card Mode) */}
      {/* ========================================================================= */}
      {viewMode === "table" ? (
        /* ======================================================================= */
        /* 📋 High-Density 1-Line Table Ledger (일목요연한 한줄짜리 목록) */
        /* ======================================================================= */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                  <th className="py-2.5 px-2.5 text-center w-10">No</th>
                  <th className="py-2.5 px-2 text-center w-24">4M 구분</th>
                  <th className="py-2.5 px-2.5 w-28">출처 구분</th>
                  <th className="py-2.5 px-2.5 w-24">발생일시</th>
                  <th className="py-2.5 px-2.5 w-28">공장 / 설비·라인</th>
                  <th className="py-2.5 px-2.5 w-24">보고자</th>
                  <th className="py-2.5 px-3 min-w-[240px]">변동 및 이상 발생내용 (클릭 시 상세)</th>
                  <th className="py-2.5 px-2 text-center w-20">손실규모</th>
                  <th className="py-2.5 px-3 min-w-[180px]">조치 내용 & 결과</th>
                  <th className="py-2.5 px-2 text-center w-16">사진</th>
                  <th className="py-2.5 px-2 text-center w-20">조치상태</th>
                  <th className="py-2.5 px-2 text-center w-16">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                        해당 조건의 4M 변동점 및 이상발생 내역이 없습니다.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">모든 라인 및 설비가 정상 가동 중입니다.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item, idx) => {
                    const hasPhotos = (item.images && item.images.length > 0) || (item.actionImages && item.actionImages.length > 0);
                    const photoCount = (item.images?.length || 0) + (item.actionImages?.length || 0);

                    // 4M Badge styling
                    const fourMBadge =
                      item.fourM === "Machine"
                        ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 border-indigo-300"
                        : item.fourM === "Material"
                        ? "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300"
                        : item.fourM === "Method"
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300"
                        : "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200 border-teal-300";

                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleOpenDetailModal(item)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                      >
                        {/* No */}
                        <td className="py-2.5 px-2.5 text-center font-mono text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>

                        {/* 4M 구분 */}
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10.5px] font-black border ${fourMBadge}`}>
                            [{item.fourM}]
                          </span>
                        </td>

                        {/* 출처 구분 */}
                        <td className="py-2.5 px-2.5">
                          <span className="font-bold text-slate-700 dark:text-slate-300 truncate block">
                            {item.origin}
                          </span>
                        </td>

                        {/* 발생일시 */}
                        <td className="py-2.5 px-2.5 font-mono text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          <div>{item.date}</div>
                          {item.time && <div className="text-[10px] text-slate-400">{item.time}</div>}
                        </td>

                        {/* 공장 / 라인 */}
                        <td className="py-2.5 px-2.5">
                          <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {item.plant}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.line || "-"}
                          </div>
                        </td>

                        {/* 보고자 */}
                        <td className="py-2.5 px-2.5 font-medium text-slate-800 dark:text-slate-200 truncate">
                          {item.writer}
                        </td>

                        {/* 변동 및 이상 발생내용 (한줄 요약) */}
                        <td className="py-2.5 px-3">
                          <div className="font-black text-slate-900 dark:text-white text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                            {item.title}
                          </div>
                          {item.content && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-normal">
                              {item.content.replace(/\n/g, " ")}
                            </div>
                          )}
                        </td>

                        {/* 손실규모 (비가동 분 / 스크랩 kg) */}
                        <td className="py-2.5 px-2 text-center font-mono">
                          {item.downtimeMinutes > 0 && (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 text-[10px] font-black">
                              {item.downtimeMinutes}분
                            </span>
                          )}
                          {item.scrapKg > 0 && (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 text-[10px] font-black ml-1">
                              {item.scrapKg}kg
                            </span>
                          )}
                          {!item.downtimeMinutes && !item.scrapKg && <span className="text-slate-300">-</span>}
                        </td>

                        {/* 조치 내용 & 결과 */}
                        <td className="py-2.5 px-3">
                          {item.actionResult ? (
                            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium line-clamp-1">
                              {item.actionResult}
                            </div>
                          ) : (
                            <span className="text-[11px] text-rose-500 font-bold">
                              🚨 미조치 (원인분석/조치필요)
                            </span>
                          )}
                        </td>

                        {/* 사진 첨부 */}
                        <td className="py-2.5 px-2 text-center">
                          {hasPhotos ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const firstImg = item.images?.[0] || item.actionImages?.[0];
                                const src = typeof firstImg === "object" ? firstImg.dataUrl || firstImg.url : firstImg;
                                if (src) setPreviewImage(src);
                              }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[10.5px] font-bold hover:scale-105 transition-all"
                              title="탭하여 사진 바로보기"
                            >
                              <Camera className="w-3 h-3 text-amber-600" />
                              <span>{photoCount}</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">-</span>
                          )}
                        </td>

                        {/* 조치상태 */}
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                              item.isResolved
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 animate-pulse"
                            }`}
                          >
                            {item.isResolved ? "✅ 완료" : "🚨 미조치"}
                          </span>
                        </td>

                        {/* 관리 버튼 */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetailModal(item);
                            }}
                            className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-[10.5px] transition-all"
                          >
                            상세/조치
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
      ) : (
        /* ======================================================================= */
        /* 🗂️ Card Timeline View (상세 카드 형태 뷰) */
        /* ======================================================================= */
        <div className="space-y-2.5">
          {filteredRecords.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">
                해당 조건의 4M 변동점 내역이 없습니다.
              </h4>
            </div>
          ) : (
            filteredRecords.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenDetailModal(item)}
                className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 text-xs font-black border border-indigo-300">
                      [{item.fourM}] {item.origin}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                      {item.plant} {item.line ? `• ${item.line}` : ""}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">보고자: {item.writer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">{item.date} {item.time || ""}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${item.isResolved ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800 animate-pulse"}`}>
                      {item.isResolved ? "✅ 조치완료" : "🚨 미조치"}
                    </span>
                  </div>
                </div>

                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  {item.title}
                </h3>

                {item.content && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line">
                    {item.content}
                  </div>
                )}

                {/* Photos */}
                {Array.isArray(item.images) && item.images.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pt-1">
                    {item.images.map((img, imgIdx) => {
                      const src = typeof img === "object" ? img.dataUrl || img.url : img;
                      if (!src) return null;
                      return (
                        <img
                          key={imgIdx}
                          src={src}
                          alt="현장 사진"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(src);
                          }}
                          className="w-16 h-16 object-cover rounded-lg border border-amber-400 hover:scale-105 transition shrink-0"
                        />
                      );
                    })}
                  </div>
                )}

                {/* Action summary */}
                {item.actionResult && (
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-900 dark:text-emerald-200">
                    <b>조치결과:</b> {item.actionResult} {item.actionAuthor ? `(조치자: ${item.actionAuthor})` : ""}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. Detail & Action/Photo Registration Modal */}
      {/* ========================================================================= */}
      {selectedItemForDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-2 border-b border-indigo-500/30">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500 text-white font-black text-xs">
                  [{selectedItemForDetail.fourM}] {selectedItemForDetail.origin}
                </span>
                <h3 className="font-black text-sm sm:text-base text-white truncate">
                  4M 변동점 상세 및 조치 등록
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseDetailModal}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 font-bold block text-[10.5px]">발생일시</span>
                  <span className="font-black text-slate-900 dark:text-white">{selectedItemForDetail.date} {selectedItemForDetail.time || ""}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10.5px]">공장 / 라인</span>
                  <span className="font-black text-slate-900 dark:text-white">{selectedItemForDetail.plant} • {selectedItemForDetail.line || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10.5px]">보고자</span>
                  <span className="font-black text-slate-900 dark:text-white">{selectedItemForDetail.writer}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10.5px]">조치상태</span>
                  <span className={`font-black ${selectedItemForDetail.isResolved ? "text-emerald-600" : "text-rose-600"}`}>
                    {selectedItemForDetail.isResolved ? "✅ 조치완료" : "🚨 미조치"}
                  </span>
                </div>
              </div>

              {/* Title & Loss stats */}
              <div>
                <span className="text-slate-400 font-bold block text-[11px] mb-1">변동 및 이상 발생 항목</span>
                <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  {selectedItemForDetail.title}
                </h4>
                {(selectedItemForDetail.downtimeMinutes > 0 || selectedItemForDetail.scrapKg > 0) && (
                  <div className="flex items-center gap-2 mt-1.5">
                    {selectedItemForDetail.downtimeMinutes > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 font-black">
                        비가동: {selectedItemForDetail.downtimeMinutes}분
                      </span>
                    )}
                    {selectedItemForDetail.scrapKg > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 font-black">
                        불량손실: {selectedItemForDetail.scrapKg}kg
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Detailed Description */}
              <div>
                <span className="text-slate-400 font-bold block text-[11px] mb-1">상세 발생 내용</span>
                <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-medium">
                  {selectedItemForDetail.content || "(상세 내용 없음)"}
                </div>
              </div>

              {/* Photos Gallery */}
              {Array.isArray(selectedItemForDetail.images) && selectedItemForDetail.images.length > 0 && (
                <div>
                  <span className="text-slate-400 font-bold block text-[11px] mb-1.5 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-amber-500" />
                    <span>발생 당시 현장 사진 ({selectedItemForDetail.images.length}장) - 탭하여 확대</span>
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {selectedItemForDetail.images.map((img, iIdx) => {
                      const src = typeof img === "object" ? img.dataUrl || img.url : img;
                      if (!src) return null;
                      return (
                        <img
                          key={iIdx}
                          src={src}
                          alt={`현장사진 ${iIdx + 1}`}
                          onClick={() => setPreviewImage(src)}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border-2 border-amber-400 dark:border-amber-600 cursor-pointer hover:opacity-90 hover:scale-105 transition shrink-0 shadow-xs"
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Resolution Form */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>원인분석 및 조치내용 등록·피드백</span>
                  </span>
                  {selectedItemForDetail.actionAt && (
                    <span className="text-[10.5px] font-mono text-slate-400">
                      최근 조치일시: {selectedItemForDetail.actionAt}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 font-bold block text-[11px] mb-1">조치자 성명</label>
                    <input
                      type="text"
                      value={actionAuthorInput}
                      onChange={(e) => setActionAuthorInput(e.target.value)}
                      placeholder="조치자 성명"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-bold block text-[11px] mb-1">조치 후 확인 사진 추가</label>
                    <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold cursor-pointer hover:bg-indigo-100 transition">
                      <Camera className="w-3.5 h-3.5" />
                      <span>사진 파일 선택 ({actionPhotos.length}장)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleActionPhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Uploaded action photos preview */}
                {actionPhotos.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {actionPhotos.map((p, pIdx) => (
                      <div key={pIdx} className="relative shrink-0">
                        <img
                          src={p.dataUrl}
                          alt="조치사진"
                          className="w-16 h-16 object-cover rounded-lg border border-emerald-400"
                        />
                        <button
                          type="button"
                          onClick={() => setActionPhotos((prev) => prev.filter((_, idx) => idx !== pIdx))}
                          className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 shadow-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="text-slate-500 font-bold block text-[11px] mb-1">조치 내용 및 원인 분석 결과</label>
                  <textarea
                    rows={3}
                    value={actionInputText}
                    onChange={(e) => setActionInputText(e.target.value)}
                    placeholder="이상 원인, 조치 내용, 재발방지 대책 등을 입력하세요..."
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCloseDetailModal}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition"
                  >
                    닫기
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveActionResult}
                    disabled={isSavingAction}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingAction ? "저장 중..." : "조치 내용 및 사진 저장"}</span>
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
