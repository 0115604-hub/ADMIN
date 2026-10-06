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
  User
} from "lucide-react";
import { subscribeUrgentIssues } from "../../services/urgentIssueService";
import { subscribeToExtrusionReports } from "../../services/extrusionProductionService";
import { getLocalExtrusionQualityIssues } from "../../services/extrusionQualityIssueService";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import * as XLSX from "xlsx";

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

  // Filter States
  const [selectedPlant, setSelectedPlant] = useState("ALL"); // ALL | 삼랑진공장 | 한림공장
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("ALL"); // ALL | QUALITY_ALERT | EXTRUSION_TPM | DOWNTIME_DEFECT | WORK_LOG_ISSUE
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL"); // ALL | PENDING | RESOLVED
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("ALL"); // ALL | TODAY | WEEK | custom YYYY-MM-DD
  const [customDateInput, setCustomDateInput] = useState("");

  // Lightbox / Image Preview
  const [previewImage, setPreviewImage] = useState(null);

  // Subscriptions
  useEffect(() => {
    setIsLoading(true);

    // 1. Urgent Issues (품질경보, 오픈이슈, 사내공지)
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
  // 🌟 Unified Data Aggregation Engine (모든 이상/품질/비가동/일지 취합)
  // =========================================================================
  const allUnifiedRecords = useMemo(() => {
    const unified = [];

    // 1. 품질경보 & 오픈이슈 & 사내공지 (urgentIssues)
    (urgentIssues || []).forEach((issue) => {
      if (issue.isDeleted) return;

      const isQuality = issue.category === "품질경보";
      const isOpen = issue.category === "오픈이슈" || issue.category === "품질이슈";
      const isNotice = issue.category === "공지사항" || issue.category === "사내공지";
      const isMeeting = issue.category === "회의일정";

      const dateStr = issue.date || (issue.createdAt ? String(issue.createdAt).slice(0, 10) : todayStr);
      const isResolved = Boolean(issue.isResolved || (isQuality && issue.actionResult));

      unified.push({
        id: `urg_${issue.id || issue._docId || Math.random()}`,
        sourceType: isQuality ? "QUALITY_ALERT" : (isOpen ? "OPEN_ISSUE" : (isMeeting ? "MEETING" : "NOTICE")),
        sourceLabel: isQuality ? "🚨 품질경보" : (isOpen ? "📌 오픈이슈" : (isMeeting ? "📅 회의일정" : "📢 사내공지")),
        badgeColor: isQuality
          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800"
          : isOpen
          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-800"
          : isMeeting
          ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-800"
          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800",
        plant: issue.plant || (isQuality ? "삼랑진공장" : "공통"),
        line: issue.line || "",
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

    // 2. 압출 작업일보 - TPM 이상발생신고 & 10대 자주보전 이상
    (extrusionReports || []).forEach((report) => {
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
          sourceType: "EXTRUSION_TPM",
          sourceLabel: "⚡ 압출 TPM 이상신고",
          badgeColor: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700",
          plant: report.plant || "삼랑진공장",
          line: report.lineName || report.lineId || "압출라인",
          writer: report.worker || "압출 작업자",
          title: `[${report.lineName || report.lineId}] TPM 설비·품질 이상발생신고 (${report.shift || "주간"})`,
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

      // 3. 압출 작업일보 - 비가동 및 불량 이벤트 (downtimeEvents)
      const dtEvents = Array.isArray(report.downtimeEvents) ? report.downtimeEvents : [];
      dtEvents.forEach((ev, evIdx) => {
        const isDefect = ev.type === "불량" || ["뜯김", "철심", "재압출", "단면형상", "스코치", "이물", "미분산", "발포", "원인불명", "밴딩", "심금절단", "심금노출", "천공", "연고무절단", "길이", "코팅"].includes(ev.category);
        const minutes = Number(ev.minutes) || 0;
        const scrapKg = Number(ev.scrapKg) || 0;

        if (minutes > 0 || scrapKg > 0 || ev.detail) {
          unified.push({
            id: `ext_dt_${report.id}_${ev.id || evIdx}`,
            sourceType: isDefect ? "EXTRUSION_DEFECT" : "EXTRUSION_DOWNTIME",
            sourceLabel: isDefect ? "🛑 압출 불량 손실" : "⏸️ 압출 설비 비가동",
            badgeColor: isDefect
              ? "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700"
              : "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 border-orange-300 dark:border-orange-700",
            plant: report.plant || "삼랑진공장",
            line: report.lineName || report.lineId || "압출라인",
            writer: report.worker || "압출 작업자",
            title: `[${report.lineName || report.lineId}] ${ev.category} (${isDefect ? "불량발생" : "비가동"} ${minutes}분 / ${scrapKg}kg)`,
            date: report.date || todayStr,
            time: ev.startTime ? `${ev.startTime}~${ev.endTime}` : (report.createdAt ? report.createdAt.slice(11, 16) : ""),
            content: ev.detail || `${ev.category} 발생으로 인한 ${isDefect ? "불량 손실" : "설비 비가동"}`,
            actionResult: report.notes || "",
            actionAuthor: report.approvedBy || "",
            actionAt: report.approvedAt || "",
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

    // 4. 현장 업무일지 (workLogs) - 주요 이슈 & 특이사항 & 설비보전 점검
    (workLogs || []).forEach((log) => {
      if (log.isDeleted) return;

      const hasIssues = Boolean(log.issues && log.issues.trim() && log.issues.trim() !== "없음" && log.issues.trim() !== "-");
      const hasSpecial = Boolean(log.specialNotes && log.specialNotes.trim() && log.specialNotes.trim() !== "없음" && log.specialNotes.trim() !== "-");
      const isMaintenance = log.process === "설비보전" || (Array.isArray(log.maintenanceItems) && log.maintenanceItems.length > 0);

      if (hasIssues || hasSpecial || isMaintenance) {
        const maintSummary = (Array.isArray(log.maintenanceItems) ? log.maintenanceItems : [])
          .map((m) => `• [${m.status || "점검"}] ${m.machine || m.line || "설비"}: ${m.action || m.content || ""}`)
          .join("\n");

        const fullContent = [
          hasIssues ? `[주요 이슈 및 이상발생]\n${log.issues}` : "",
          hasSpecial ? `[특이사항 및 개선요청]\n${log.specialNotes}` : "",
          isMaintenance && maintSummary ? `[설비보전 점검 내역]\n${maintSummary}` : "",
          !hasIssues && !hasSpecial && !maintSummary && log.content ? log.content : ""
        ].filter(Boolean).join("\n\n");

        const plant = log.plant || (["김동욱", "우창용", "TEST", "오상민", "정현규", "부림텍", "한울"].includes(log.writer) ? "한림공장" : "삼랑진공장");

        unified.push({
          id: `wl_${log.id}`,
          sourceType: isMaintenance ? "MAINTENANCE" : "WORK_LOG_ISSUE",
          sourceLabel: isMaintenance ? "🔧 설비보전 점검" : "📋 현장 일지 특이사항",
          badgeColor: isMaintenance
            ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700"
            : "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200 border-teal-300 dark:border-teal-700",
          plant,
          line: log.process || log.line || "가공동",
          writer: log.writer || "현장 작업자",
          title: `[${plant}] ${log.writer} (${log.process || "생산"}) 업무일지 이상 및 특이사항`,
          date: log.date || todayStr,
          time: log.createdAt ? log.createdAt.slice(11, 16) : "",
          content: fullContent,
          actionResult: log.approvalComment || "",
          actionAuthor: log.approverName || "",
          actionAt: log.approvalDate || "",
          images: Array.isArray(log.photos) ? log.photos : [],
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

    // 5. 압출 전용 품질 이슈 (extrusionQualityAlerts)
    (extrusionQualityAlerts || []).forEach((alert) => {
      unified.push({
        id: `ext_q_${alert.id}`,
        sourceType: "QUALITY_ALERT",
        sourceLabel: "🚨 압출 품질경보",
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

      // 2. Category Tab Filter
      if (selectedCategoryTab !== "ALL") {
        if (selectedCategoryTab === "QUALITY_ALERT" && rec.sourceType !== "QUALITY_ALERT" && rec.sourceType !== "OPEN_ISSUE") return false;
        if (selectedCategoryTab === "EXTRUSION_TPM" && rec.sourceType !== "EXTRUSION_TPM") return false;
        if (selectedCategoryTab === "DOWNTIME_DEFECT" && rec.sourceType !== "EXTRUSION_DOWNTIME" && rec.sourceType !== "EXTRUSION_DEFECT") return false;
        if (selectedCategoryTab === "WORK_LOG_ISSUE" && rec.sourceType !== "WORK_LOG_ISSUE" && rec.sourceType !== "MAINTENANCE") return false;
      }

      // 3. Status Filter
      if (selectedStatusFilter === "PENDING" && rec.isResolved) return false;
      if (selectedStatusFilter === "RESOLVED" && !rec.isResolved) return false;

      // 4. Date Filter
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

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = rec.title?.toLowerCase().includes(q);
        const matchContent = rec.content?.toLowerCase().includes(q);
        const matchWriter = rec.writer?.toLowerCase().includes(q);
        const matchLine = rec.line?.toLowerCase().includes(q);
        const matchPlant = rec.plant?.toLowerCase().includes(q);
        const matchAction = rec.actionResult?.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchWriter && !matchLine && !matchPlant && !matchAction) return false;
      }

      return true;
    });
  }, [allUnifiedRecords, selectedPlant, selectedCategoryTab, selectedStatusFilter, selectedDateFilter, customDateInput, searchQuery, todayStr]);

  // =========================================================================
  // 📊 KPI Summary Statistics
  // =========================================================================
  const stats = useMemo(() => {
    const totalCount = allUnifiedRecords.length;
    const qualityAlerts = allUnifiedRecords.filter((r) => r.sourceType === "QUALITY_ALERT" || r.sourceType === "OPEN_ISSUE");
    const qualityPending = qualityAlerts.filter((r) => !r.isResolved).length;

    const tpmIssues = allUnifiedRecords.filter((r) => r.sourceType === "EXTRUSION_TPM");
    const tpmWithPhotos = tpmIssues.filter((r) => r.images && r.images.length > 0).length;

    const dtDefects = allUnifiedRecords.filter((r) => r.sourceType === "EXTRUSION_DOWNTIME" || r.sourceType === "EXTRUSION_DEFECT");
    const totalDowntimeMin = dtDefects.reduce((acc, r) => acc + (r.downtimeMinutes || 0), 0);
    const totalScrapKg = Number(dtDefects.reduce((acc, r) => acc + (r.scrapKg || 0), 0).toFixed(1));

    const workLogIssues = allUnifiedRecords.filter((r) => r.sourceType === "WORK_LOG_ISSUE" || r.sourceType === "MAINTENANCE");

    return {
      totalCount,
      qualityTotal: qualityAlerts.length,
      qualityPending,
      tpmTotal: tpmIssues.length,
      tpmWithPhotos,
      totalDowntimeMin,
      totalScrapKg,
      workLogTotal: workLogIssues.length
    };
  }, [allUnifiedRecords]);

  // =========================================================================
  // 📥 Excel Export Handler
  // =========================================================================
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      alert("출력할 데이터가 없습니다.");
      return;
    }

    const rows = filteredRecords.map((r, i) => ({
      "No": i + 1,
      "구분": r.sourceLabel.replace(/^[^\s]+\s*/, ""),
      "발생일자": r.date,
      "시간": r.time || "-",
      "공장": r.plant,
      "라인/공정": r.line || "-",
      "작성자/조치자": r.writer,
      "제목 및 이상 내용": r.title,
      "상세 내용": r.content,
      "비가동(분)": r.downtimeMinutes || 0,
      "불량손실(kg)": r.scrapKg || 0,
      "조치 상태": r.isResolved ? "조치완료" : "미조치(진행중)",
      "조치 결과 및 코멘트": r.actionResult || "-",
      "사진 첨부 수": (r.images?.length || 0) + (r.actionImages?.length || 0)
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "통합이상및비가동관제");
    XLSX.writeFile(wb, `통합_이상발생_비가동_품질관제_리포트_${todayStr}.xlsx`);
  };

  return (
    <div className="space-y-3.5 sm:space-y-4 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. Header Banner & Status Bar */}
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
                  <span>🚨 전사 이상발생 / 비가동·불량 / 품질경보 통합 관제 패널</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white shadow-xs border border-indigo-400/40">
                  한림공장 TEST 전용 모드
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-indigo-200/90 mt-0.5 font-medium">
                압출 TPM 이상신고, 비가동/불량 손실, 가공동 현장일지 이슈, 관리자 품질경보를 실시간으로 모두 취합하여 한눈에 관제합니다.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleManualRefresh}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-indigo-200 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="실시간 데이터 즉시 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
              <span className="hidden sm:inline">새로고침</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/40"
              title="현재 조회된 통합 관제 내역을 엑셀로 다운로드"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>엑셀 다운로드</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. Top 4-Grid KPI Counters */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 pt-1">
          {/* KPI 1: 품질경보 & 오픈이슈 */}
          <div
            onClick={() => setSelectedCategoryTab("QUALITY_ALERT")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              selectedCategoryTab === "QUALITY_ALERT"
                ? "bg-rose-950/80 border-rose-400 ring-2 ring-rose-400/40"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-300 font-bold">
              <span className="flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                <span>품질경보 & 오픈이슈</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-rose-500/30 text-[10px] text-rose-200">
                미조치 {stats.qualityPending}건
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg sm:text-xl font-black text-white">{stats.qualityTotal}건</span>
              <span className="text-[11px] text-rose-300 font-medium">관리자 발령</span>
            </div>
          </div>

          {/* KPI 2: 압출 TPM 이상신고 */}
          <div
            onClick={() => setSelectedCategoryTab("EXTRUSION_TPM")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              selectedCategoryTab === "EXTRUSION_TPM"
                ? "bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/40"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>압출 TPM 이상신고</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-[10px] text-amber-200">
                사진 {stats.tpmWithPhotos}건
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg sm:text-xl font-black text-white">{stats.tpmTotal}건</span>
              <span className="text-[11px] text-amber-300 font-medium">자주보전 이상</span>
            </div>
          </div>

          {/* KPI 3: 압출 비가동 & 불량손실 */}
          <div
            onClick={() => setSelectedCategoryTab("DOWNTIME_DEFECT")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              selectedCategoryTab === "DOWNTIME_DEFECT"
                ? "bg-orange-950/80 border-orange-400 ring-2 ring-orange-400/40"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-orange-300 font-bold">
              <span className="flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-orange-400" />
                <span>비가동 & 불량손실</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-orange-500/30 text-[10px] text-orange-200">
                {stats.totalScrapKg} kg
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg sm:text-xl font-black text-white">{stats.totalDowntimeMin}분</span>
              <span className="text-[11px] text-orange-300 font-medium">총 손실시간</span>
            </div>
          </div>

          {/* KPI 4: 현장 일지 특이사항 */}
          <div
            onClick={() => setSelectedCategoryTab("WORK_LOG_ISSUE")}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              selectedCategoryTab === "WORK_LOG_ISSUE"
                ? "bg-teal-950/80 border-teal-400 ring-2 ring-teal-400/40"
                : "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-teal-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                <span>현장 일지 특이사항</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-teal-500/30 text-[10px] text-teal-200">
                가공/외주/보전
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg sm:text-xl font-black text-white">{stats.workLogTotal}건</span>
              <span className="text-[11px] text-teal-300 font-medium">일지 이슈</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Multi-Filter & Search Bar */}
      {/* ========================================================================= */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
        {/* Row 1: Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-nowrap">
          <button
            type="button"
            onClick={() => setSelectedCategoryTab("ALL")}
            className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer ${
              selectedCategoryTab === "ALL"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            🌟 전체 통합 타임라인 ({allUnifiedRecords.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryTab("QUALITY_ALERT")}
            className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
              selectedCategoryTab === "QUALITY_ALERT"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>🚨 품질경보 & 오픈이슈</span>
            <span className="text-[10px] opacity-80">({stats.qualityTotal})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryTab("EXTRUSION_TPM")}
            className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
              selectedCategoryTab === "EXTRUSION_TPM"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>⚡ 압출 TPM 이상신고</span>
            <span className="text-[10px] opacity-80">({stats.tpmTotal})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryTab("DOWNTIME_DEFECT")}
            className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
              selectedCategoryTab === "DOWNTIME_DEFECT"
                ? "bg-orange-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>🛑 비가동 & 불량 발생</span>
            <span className="text-[10px] opacity-80">({stats.totalDowntimeMin}분)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryTab("WORK_LOG_ISSUE")}
            className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
              selectedCategoryTab === "WORK_LOG_ISSUE"
                ? "bg-teal-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>📋 현장 일지 특이사항</span>
            <span className="text-[10px] opacity-80">({stats.workLogTotal})</span>
          </button>
        </div>

        {/* Row 2: Plant, Status, Date & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
          {/* Plant Select */}
          <div className="sm:col-span-3">
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="ALL">🏢 전 공장 (삼랑진 + 한림)</option>
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
              <option value="ALL">전체 상태</option>
              <option value="PENDING">🚨 미조치 / 진행중</option>
              <option value="RESOLVED">✅ 조치완료</option>
            </select>
          </div>

          {/* Date Quick Filter */}
          <div className="sm:col-span-3">
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
              <option value="CUSTOM">📅 특정 일자 직접지정</option>
            </select>
          </div>

          {/* Custom Date Input (if CUSTOM) or Search Input */}
          <div className="sm:col-span-4">
            {selectedDateFilter === "CUSTOM" ? (
              <input
                type="date"
                value={customDateInput}
                onChange={(e) => setCustomDateInput(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-blue-400 bg-blue-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            ) : (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="품명/차종/작업자/불량명 검색..."
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
      {/* 4. Unified Timeline Records Stream */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        {filteredRecords.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">
              해당 조건의 이상발생 및 비가동 내역이 없습니다.
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              현재 선택된 필터 조건에 부합하는 품질경보, TPM 이상신고, 비가동/불량 손실 내역이 존재하지 않거나 모두 정상 가동 중입니다.
            </p>
          </div>
        ) : (
          filteredRecords.map((item) => {
            const isHighSeverity = item.severity === "HIGH";
            const hasPhotos = (item.images && item.images.length > 0) || (item.actionImages && item.actionImages.length > 0);

            return (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isHighSeverity
                    ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/80 shadow-xs hover:border-rose-400"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400"
                }`}
              >
                {/* Header Row: Source Badge, Plant, Date/Time, Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Source Category Badge */}
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black border ${item.badgeColor}`}>
                      {item.sourceLabel}
                    </span>

                    {/* Plant & Line */}
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                      {item.plant} {item.line ? `• ${item.line}` : ""}
                    </span>

                    {/* Writer */}
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{item.writer}</span>
                    </span>
                  </div>

                  {/* Right side: Date/Time + Status Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.date} {item.time ? `(${item.time})` : ""}</span>
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
                      item.isResolved
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700 animate-pulse"
                    }`}>
                      {item.isResolved ? "✅ 조치완료" : "🚨 미조치 / 진행중"}
                    </span>
                  </div>
                </div>

                {/* Main Content Body */}
                <div className="pt-2.5 space-y-2">
                  {/* Title */}
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {/* Downtime / Defect Loss Stats Badges (if applicable) */}
                  {(item.downtimeMinutes > 0 || item.scrapKg > 0) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.downtimeMinutes > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 text-xs font-black flex items-center gap-1 border border-orange-300 dark:border-orange-800">
                          <Clock className="w-3 h-3 text-orange-500" />
                          <span>비가동 시간: {item.downtimeMinutes}분</span>
                        </span>
                      )}
                      {item.scrapKg > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 text-xs font-black flex items-center gap-1 border border-rose-300 dark:border-rose-800">
                          <TrendingDown className="w-3 h-3 text-rose-500" />
                          <span>불량 손실: {item.scrapKg} kg</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Detailed Description */}
                  {item.content && (
                    <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                      {item.content}
                    </div>
                  )}

                  {/* Attached Photos Gallery (현장 이상 사진) */}
                  {Array.isArray(item.images) && item.images.length > 0 && (
                    <div className="pt-1">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-amber-500" />
                        <span>현장 첨부 사진 ({item.images.length}장) - 탭하여 확대</span>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {item.images.map((img, imgIdx) => {
                          const src = typeof img === "object" ? img.dataUrl || img.url : img;
                          if (!src) return null;
                          return (
                            <img
                              key={imgIdx}
                              src={src}
                              alt={`현장 이상 사진 ${imgIdx + 1}`}
                              onClick={() => setPreviewImage(src)}
                              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border-2 border-amber-400 dark:border-amber-600 shadow-xs cursor-pointer hover:opacity-90 hover:scale-105 transition-all shrink-0"
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Result / Resolution Details (조치 결과 및 피드백) */}
                  {item.actionResult && (
                    <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 text-xs space-y-1">
                      <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-200 font-bold">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>조치 완료 결과 {item.actionAuthor ? `(조치자: ${item.actionAuthor})` : ""}</span>
                        </span>
                        {item.actionAt && (
                          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                            {item.actionAt}
                          </span>
                        )}
                      </div>
                      <p className="text-emerald-950 dark:text-emerald-100 whitespace-pre-line font-medium leading-relaxed">
                        {item.actionResult}
                      </p>

                      {/* Action Result Attached Photos */}
                      {Array.isArray(item.actionImages) && item.actionImages.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-1.5">
                          {item.actionImages.map((aimg, aIdx) => {
                            const asrc = typeof aimg === "object" ? aimg.dataUrl || aimg.url : aimg;
                            if (!asrc) return null;
                            return (
                              <img
                                key={aIdx}
                                src={asrc}
                                alt={`조치완료 사진 ${aIdx + 1}`}
                                onClick={() => setPreviewImage(asrc)}
                                className="w-16 h-16 object-cover rounded-lg border border-emerald-400 cursor-pointer hover:opacity-90 transition shrink-0"
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Replies List (의견/댓글) */}
                  {Array.isArray(item.replies) && item.replies.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-indigo-500" />
                        <span>등록된 조치 의견 및 회신 ({item.replies.length}건)</span>
                      </div>
                      <div className="space-y-1">
                        {item.replies.map((rep, rIdx) => (
                          <div key={rep.id || rIdx} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-baseline gap-1.5">
                            <span className="font-black text-slate-900 dark:text-white shrink-0">
                              {rep.author} ({rep.authorTitle || "직책"}):
                            </span>
                            <span className="font-medium">{rep.content}</span>
                            <span className="text-[9.5px] text-slate-400 font-mono shrink-0 ml-auto">
                              {rep.actionDate || rep.createdAt || ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

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
