import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import {
  Factory,
  ShieldAlert,
  Megaphone,
  CheckCircle2,
  ZoomIn,
  Search,
  Plus,
  ArrowRight,
  FileSpreadsheet,
  Download,
  Trash2,
  Clock,
  Car,
  Zap,
  Sparkles,
  Gauge
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { SevereDisasterBar } from "../SevereDisasterBar";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import { DigitalInspectionModal } from "../sq/DigitalInspectionModal";
import {
  subscribeHanulQualityIssues,
  getLocalHanulQualityIssues,
  acknowledgeHanulQualityIssue
} from "../../services/hanulQualityIssueService";
import {
  subscribeHanulWorkReports,
  getLocalHanulWorkReports,
  exportHanulReportToExcel,
  deleteHanulWorkReport,
  isExcludedFromWorkReport
} from "../../services/hanulWorkReportService";
import {
  subscribeUrgentIssues,
  getLocalUrgentIssues
} from "../../services/urgentIssueService";
import { isWorkerManagerRole } from "../../services/personnelCardService";
import {
  getOverallDaySampleStatus,
  getSampleInspectionStatus
} from "../../utils/sampleInspectionUtils";
import {
  getWorkLogText,
  getCurrentWorkLogLanguage,
  setWorkLogLanguage,
  SUPPORTED_LANGUAGES,
  getWorkerLanguageInfo,
  syncWorkerLanguage
} from "../../services/workLogI18nService";

const HanulWorkReportModal = lazy(() =>
  import("../HanulWorkReportModal").then((m) => ({
    default: m.HanulWorkReportModal || m.default
  }))
);

export const HanulWorkerDashboardView = () => {
  const { currentProfile } = useAuth();
  const [currentLang, setCurrentLang] = useState(() => getCurrentWorkLogLanguage());
  const [qualityIssues, setQualityIssues] = useState(() => getLocalHanulQualityIssues());
  const [urgentIssues, setUrgentIssues] = useState(() => getLocalUrgentIssues());
  const [workReports, setWorkReports] = useState(() => getLocalHanulWorkReports());

  // Filters
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("ALL"); // "ALL" | "9BQC" | "LQ2"
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ACTIVE"); // "ACTIVE" | "RESOLVED" | "ALL"
  const [searchQuery, setSearchQuery] = useState("");
  const [reportScope, setReportScope] = useState("my"); // "my" | "all"

  // Modals
  const [previewImage, setPreviewImage] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalProject, setReportModalProject] = useState("9BQC");
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

  // 🌐 언어 변경 이벤트 리스너
  useEffect(() => {
    const handleLangChange = (e) => {
      if (e?.detail?.lang) {
        setCurrentLang(e.detail.lang);
      }
    };
    window.addEventListener("factory_language_changed", handleLangChange);
    return () => window.removeEventListener("factory_language_changed", handleLangChange);
  }, []);

  // 🌍 현재 로그인한 현장작업자 국적 및 모국어 정보
  const workerLangInfo = useMemo(() => {
    return getWorkerLanguageInfo(currentProfile);
  }, [currentProfile]);

  // 프로필 변경 시 해당 근로자의 국적(태국, 인도네시아, 베트남, 미얀마 등) 언어로 자동 전환
  useEffect(() => {
    if (currentProfile) {
      const synched = syncWorkerLanguage(currentProfile);
      setCurrentLang(synched);
    }
  }, [currentProfile]);

  const isManager = useMemo(() => isWorkerManagerRole(currentProfile), [currentProfile]);
  const displayTitle = currentProfile?.title || currentProfile?.position || (
    currentProfile?.name === "박종미" ? "반장" : (isManager ? "반장" : "사원")
  );

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // 1. Subscribe to Hanul Quality Issues
  useEffect(() => {
    const unsub = subscribeHanulQualityIssues((list) => {
      setQualityIssues(list);
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Company Notices (사내공지)
  useEffect(() => {
    const unsub = subscribeUrgentIssues((list) => {
      setUrgentIssues(list);
    });
    return () => unsub();
  }, []);

  // 3. Subscribe to Hanul Work Reports
  useEffect(() => {
    const unsub = subscribeHanulWorkReports((list) => {
      setWorkReports(list);
    });
    return () => unsub();
  }, []);

  // 4. Listen to open-hanul-work-report-modal event and auto-open session trigger
  useEffect(() => {
    const handleOpen = (e) => {
      const proj = e?.detail?.project || "9BQC";
      setReportModalProject(proj === "LQ2A" ? "LQ2" : proj);
      setIsReportModalOpen(true);
    };
    window.addEventListener("open-hanul-work-report-modal", handleOpen);

    try {
      const autoProj = sessionStorage.getItem("auto_open_hanul_report");
      if (autoProj) {
        sessionStorage.removeItem("auto_open_hanul_report");
        setReportModalProject(autoProj === "LQ2A" ? "LQ2" : autoProj);
        setIsReportModalOpen(true);
      }
    } catch (e) {}

    return () => window.removeEventListener("open-hanul-work-report-modal", handleOpen);
  }, []);

  // Active Company Notices (종료일까지 유효한 공지만)
  const activeCompanyNotices = useMemo(() => {
    return urgentIssues.filter((item) => {
      if (!item || item.isDeleted) return false;
      const cat = String(item.category || "").trim();
      const isNotice =
        cat === "사내공지" ||
        cat === "공지사항" ||
        cat === "공지" ||
        cat === "사내공지사항" ||
        cat === "공통공지";
      if (!isNotice) return false;

      const expDate = item.expireDate || item.endDate || item.targetDate || "";
      if (expDate && expDate < todayStr) return false;
      return true;
    });
  }, [urgentIssues, todayStr]);

  // Filtered Quality Issues
  const filteredQualityIssues = useMemo(() => {
    return qualityIssues.filter((it) => {
      if (!it) return false;

      // Status filter
      if (selectedStatusFilter !== "ALL") {
        if (it.status !== selectedStatusFilter) return false;
      }

      // Line / Project filter
      if (selectedProjectFilter !== "ALL") {
        const lineText = String(it.line || "").toUpperCase();
        if (selectedProjectFilter === "9BQC") {
          if (!lineText.includes("9BQC")) return false;
        } else if (selectedProjectFilter === "LQ2") {
          if (!lineText.includes("LQ2")) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const actionText = it.actionResult || it.actionGuide || it.resolutionNote || "";
        const match =
          (it.title || "").toLowerCase().includes(q) ||
          (it.line || "").toLowerCase().includes(q) ||
          (it.content || "").toLowerCase().includes(q) ||
          (it.defectType || "").toLowerCase().includes(q) ||
          actionText.toLowerCase().includes(q) ||
          (it.author || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [qualityIssues, selectedStatusFilter, selectedProjectFilter, searchQuery]);

  const activeQualityCount = useMemo(() => {
    return qualityIssues.filter((it) => it && it.status === "ACTIVE").length;
  }, [qualityIssues]);

  const handleAcknowledge = React.useCallback((issueId) => {
    if (currentProfile?.name) {
      acknowledgeHanulQualityIssue(issueId, currentProfile.name);
    }
  }, [currentProfile?.name]);

  const handleOpenReportModal = React.useCallback((project = "9BQC") => {
    setReportModalProject(project);
    setIsReportModalOpen(true);
  }, []);

  const handleDeleteReport = React.useCallback((reportId) => {
    if (window.confirm("이 작업일보를 삭제하시겠습니까?")) {
      deleteHanulWorkReport(reportId);
    }
  }, []);

  // ⚡ 다국어 레이블 일괄 사전 계산 (렌더링 프레임당 중복 조회 및 함수 호출 오버헤드 영구 제거)
  const labels = useMemo(() => ({
    hanul_plant_title: getWorkLogText("hanul_plant_title", currentLang),
    worker: getWorkLogText("worker", currentLang),
    sample_complete: getWorkLogText("sample_complete", currentLang),
    sample_pending: getWorkLogText("sample_pending", currentLang),
    auto_translated_notice: getWorkLogText("auto_translated_notice", currentLang),
    auto_translated_badge: getWorkLogText("auto_translated_badge", currentLang),
    write_9bqc_report: getWorkLogText("write_9bqc_report", currentLang),
    write_lq2_report: getWorkLogText("write_lq2_report", currentLang),
    tpm_sheet_subtitle: getWorkLogText("tpm_sheet_subtitle", currentLang),
    quality_issues_board: getWorkLogText("quality_issues_board", currentLang),
    status_in_progress: getWorkLogText("status_in_progress", currentLang),
    status_resolved: getWorkLogText("status_resolved", currentLang),
    view_all: getWorkLogText("view_all", currentLang),
    mark_as_read: getWorkLogText("mark_as_read", currentLang),
    marked_as_read: getWorkLogText("marked_as_read", currentLang),
    work_report_records: getWorkLogText("work_report_records", currentLang),
    my_reports: getWorkLogText("my_reports", currentLang),
    all_reports: getWorkLogText("all_reports", currentLang),
    date: getWorkLogText("date", currentLang),
    process: getWorkLogText("process", currentLang),
    production_qty: getWorkLogText("production_qty", currentLang),
    good_qty: getWorkLogText("good_qty", currentLang),
    defect_qty: getWorkLogText("defect_qty", currentLang),
    dimension_inspection: getWorkLogText("dimension_inspection", currentLang),
    special_notes: getWorkLogText("special_notes", currentLang),
    action_management: getWorkLogText("action_management", currentLang),
    delete_report: getWorkLogText("delete_report", currentLang),
    excel_download: getWorkLogText("excel_download", currentLang)
  }), [currentLang]);

  // Filtered Work Reports (9BQC / LQ2a)
  const filteredWorkReports = useMemo(() => {
    return (workReports || []).filter((r) => {
      if (!r) return false;

      // Project filter
      if (selectedProjectFilter !== "ALL") {
        const p = String(r.project || "").toUpperCase();
        if (selectedProjectFilter === "9BQC" && !p.includes("9BQC")) return false;
        if (selectedProjectFilter === "LQ2" && !p.includes("LQ2")) return false;
      }

      // Scope filter (내 일보만 vs 전체)
      if (reportScope === "my" && currentProfile?.name) {
        const isMy =
          r.worker === currentProfile.name ||
          r.writer === currentProfile.name ||
          (typeof r.worker === "string" && r.worker.includes(currentProfile.name));
        if (!isMy) return false;
      }

      return true;
    });
  }, [workReports, selectedProjectFilter, reportScope, currentProfile?.name]);

  const todayReportsCount = useMemo(() => {
    return (workReports || []).filter((r) => r && r.date === todayStr).length;
  }, [workReports, todayStr]);

  const sampleStatus = useMemo(() => {
    return getOverallDaySampleStatus(workReports, todayStr);
  }, [workReports, todayStr]);

  const initialWorkerName = useMemo(() => {
    if (currentProfile?.name && !isExcludedFromWorkReport(currentProfile.name)) {
      return currentProfile.name;
    }
    return "박종미";
  }, [currentProfile?.name]);

  return (
    <div className="space-y-4 animate-fadeIn pb-16 max-w-[1600px] mx-auto min-w-0">
      {/* ========================================================================= */}
      {/* 🏭 상단 바: 초·중·종물 기록 여부 + 4개국어 자동번역 뱃지 및 언어선택기 */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 rounded-2xl shadow-lg border border-slate-800 p-3.5 sm:p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shrink-0">
            <Factory className="w-6 h-6" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                {labels.hanul_plant_title}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-600/30 text-purple-300 border border-purple-400/40">
                [{labels.worker}] {currentProfile?.name || "한울"} {displayTitle}
              </span>

              {/* 🔥 초·중·종물 기록 여부 뱃지만 표출 */}
              {sampleStatus.isComplete ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-500/80 flex items-center gap-1.5 shadow-sm shadow-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>✓ {labels.sample_complete}</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-950 text-amber-300 border border-amber-500/80 flex items-center gap-1.5 shadow-sm shadow-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  <span>⏳ {labels.sample_pending}</span>
                </span>
              )}
            </div>

            {/* 🌐 국적 기반 자동 번역 안내 문구 */}
            <p className="text-xs text-slate-300 font-medium mt-1 truncate flex items-center gap-1.5">
              <span>{workerLangInfo.nationalityFlag || workerLangInfo.flag}</span>
              <span>{labels.auto_translated_notice}</span>
            </p>
          </div>
        </div>

        {/* 우측: 날짜 & 국적/언어 뱃지 및 변경 드롭다운 */}
        <div className="shrink-0 flex items-center sm:flex-col sm:items-end justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold text-slate-400">{todayStr}</span>
            <span className={`text-[11px] font-black font-mono ${sampleStatus.isComplete ? "text-emerald-400" : "text-amber-400"}`}>
              {sampleStatus.summary}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {workerLangInfo.isAutoTranslated && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-700/80 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>{labels.auto_translated_badge}</span>
                <span className="text-cyan-200 font-bold">({workerLangInfo.nationality})</span>
              </span>
            )}
            <select
              value={currentLang}
              onChange={(e) => {
                setWorkLogLanguage(e.target.value);
                setCurrentLang(e.target.value);
              }}
              className="px-2 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 focus:border-indigo-400 cursor-pointer shadow-xs"
              title="언어 변경"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.nativeName} ({l.country || l.name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 현장 작업일보 및 TPM 점검 즉시 작성 버튼 바 (9BQC / LQ2) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOpenReportModal("9BQC")}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/30 flex items-center justify-between transition-all active:scale-98 cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-white/20 shrink-0 group-hover:scale-110 transition-transform">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div className="text-left min-w-0">
              <div className="font-black text-sm sm:text-base leading-tight truncate">
                {labels.write_9bqc_report}
              </div>
              <div className="text-[11px] text-indigo-200 font-medium truncate mt-0.5">
                {labels.tpm_sheet_subtitle}
              </div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => handleOpenReportModal("LQ2")}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-600/30 flex items-center justify-between transition-all active:scale-98 cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-white/20 shrink-0 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="text-left min-w-0">
              <div className="font-black text-sm sm:text-base leading-tight truncate">
                {labels.write_lq2_report}
              </div>
              <div className="text-[11px] text-purple-200 font-medium truncate mt-0.5">
                LQ2 Door Harness Sub-assy 가공/협력업체 작업일보
              </div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 📢 3. 사내공지 (등록된 공지가 있을 때만 종료일까지 표시) */}
      {/* ========================================================================= */}
      {activeCompanyNotices.length > 0 && (
        <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 rounded-2xl p-4 sm:p-5 border-2 border-blue-500/50 shadow-md space-y-3.5 text-white">
          <div className="flex items-center justify-between pb-2.5 border-b border-blue-500/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30 shrink-0 animate-bounce">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base text-white">
                    📢 사내 공지사항
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500 text-white shadow-2xs">
                    {activeCompanyNotices.length}건 유효 공지
                  </span>
                </div>
                <p className="text-[11px] text-blue-200/90 font-medium mt-0.5">
                  전사 및 한림공장 현장 전달 사내공지 사항입니다. 지정된 종료일까지 게시됩니다.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {activeCompanyNotices.map((notice) => {
              const expDate = notice.expireDate || notice.endDate || notice.targetDate || "";
              const hasImages = Array.isArray(notice.images) && notice.images.length > 0;

              return (
                <div
                  key={notice.id || notice._docId}
                  className="p-3.5 sm:p-4 rounded-xl bg-white/10 dark:bg-slate-900/60 backdrop-blur-xs border border-blue-400/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-blue-600 text-white">
                        사내공지
                      </span>
                      {expDate && (
                        <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-500 text-slate-950 font-mono">
                          📅 {expDate}까지 게시
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-blue-200">
                        {notice.date || notice.createdAt?.slice(0, 10)}
                      </span>
                    </div>

                    <span className="text-[11px] text-blue-200 font-bold">
                      작성자: {notice.author || notice.registeredBy || "관리팀"}
                    </span>
                  </div>

                  <h4 className="font-black text-sm sm:text-base text-white">
                    {notice.title}
                  </h4>

                  {notice.content && (
                    <p className="text-xs text-slate-100 leading-relaxed whitespace-pre-wrap bg-slate-950/40 p-3 rounded-xl border border-blue-500/20">
                      {notice.content}
                    </p>
                  )}

                  {hasImages && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10.5px] font-bold text-blue-200">첨부 사진 (클릭하여 확대):</span>
                      <div className="flex items-center gap-2 overflow-x-auto">
                        {notice.images.map((img, idx) => {
                          const imgUrl = typeof img === "string" ? img : img.dataUrl || img.url;
                          const imgName = typeof img === "string" ? "공지 사진" : img.name || "공지 사진";
                          return (
                            <div
                              key={idx}
                              onClick={() => setPreviewImage({ url: imgUrl, name: imgName })}
                              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-blue-400/60 cursor-pointer group shrink-0"
                            >
                              <img src={imgUrl} alt={imgName} className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <ZoomIn className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚨 4. 한울 관리자 품질이슈 공유판 (9BQC / LQ2 가공/협력업체 전용) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border-2 border-rose-500/40 shadow-md space-y-4 text-slate-900 dark:text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 text-white shadow-md shadow-rose-600/30 shrink-0 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-rose-600 dark:text-rose-400">
                  🚨 {labels.quality_issues_board}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-2xs">
                  {activeQualityCount}건 진행중
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                9BQC 및 LQ2 라인별 불량 현상, 발생원인 사진 및 조치결과를 확인하고 숙지 완료 버튼을 눌러주세요.
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="제목, 공정, 불량 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { id: "ACTIVE", label: `🚨 ${labels.status_in_progress}` },
              { id: "RESOLVED", label: `✅ ${labels.status_resolved}` },
              { id: "ALL", label: labels.view_all }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedStatusFilter === st.id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-bold text-slate-400">
            총 {filteredQualityIssues.length}건
          </div>
        </div>

        {/* Quality Issues List */}
        {filteredQualityIssues.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p>해당 조건의 한울 품질이슈가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredQualityIssues.map((issue) => {
              const isResolved = issue.status === "RESOLVED";
              const isAcked = Array.isArray(issue.acknowledgedBy) && issue.acknowledgedBy.includes(currentProfile?.name);
              const actionText = issue.actionResult || issue.actionGuide || issue.resolutionNote || "";
              const causeImgs = Array.isArray(issue.causeImages)
                ? issue.causeImages
                : Array.isArray(issue.images)
                ? issue.images
                : [];
              const actionImgs = Array.isArray(issue.actionImages) ? issue.actionImages : [];

              return (
                <div
                  key={issue.id}
                  className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                    isResolved
                      ? "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-80"
                      : "bg-rose-50/40 dark:bg-rose-950/25 border-rose-300 dark:border-rose-800/80 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10.5px] font-black border ${
                          isResolved
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300"
                            : "bg-rose-600 text-white border-rose-700 animate-pulse shadow-2xs"
                        }`}
                      >
                        {isResolved ? "✓ 조치완료" : "🚨 조치중 (진행)"}
                      </span>

                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-indigo-600 text-white font-mono">
                        {issue.line || "9BQC/LQ2"}
                      </span>

                      {issue.defectType && (
                        <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-500 text-slate-950">
                          {issue.defectType}
                        </span>
                      )}

                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {issue.date || issue.createdAt?.slice(0, 10)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2">
                      <span>작성: {issue.author || "한울 관리자"}</span>
                      {isAcked ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                          {labels.marked_as_read}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAcknowledge(issue.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10.5px] shadow-xs cursor-pointer active:scale-95"
                        >
                          {labels.mark_as_read}
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    {issue.title}
                  </h4>

                  {issue.content && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      {issue.content}
                    </p>
                  )}

                  {/* Photos */}
                  {(causeImgs.length > 0 || actionImgs.length > 0) && (
                    <div className="space-y-2 pt-1">
                      {causeImgs.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10.5px] font-bold text-rose-600 dark:text-rose-400">
                            🔍 불량 현상 및 발생 사진:
                          </span>
                          <div className="flex items-center gap-2 overflow-x-auto">
                            {causeImgs.map((img, idx) => {
                              const imgUrl = typeof img === "string" ? img : img.dataUrl || img.url;
                              return (
                                <div
                                  key={idx}
                                  onClick={() => setPreviewImage({ url: imgUrl, name: `${issue.title} 원인사진` })}
                                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-rose-300 dark:border-rose-800 cursor-pointer group shrink-0"
                                >
                                  <img src={imgUrl} alt="원인" className="w-full h-full object-cover group-hover:scale-105 transition" />
                                  <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <ZoomIn className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {actionImgs.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                            🛠️ 조치 및 개선 사진:
                          </span>
                          <div className="flex items-center gap-2 overflow-x-auto">
                            {actionImgs.map((img, idx) => {
                              const imgUrl = typeof img === "string" ? img : img.dataUrl || img.url;
                              return (
                                <div
                                  key={idx}
                                  onClick={() => setPreviewImage({ url: imgUrl, name: `${issue.title} 조치사진` })}
                                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-emerald-300 dark:border-emerald-800 cursor-pointer group shrink-0"
                                >
                                  <img src={imgUrl} alt="조치" className="w-full h-full object-cover group-hover:scale-105 transition" />
                                  <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <ZoomIn className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {actionText && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-200">
                      <div className="font-bold flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>조치 내용 및 표준 가이드:</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed pl-5 font-medium">
                        {actionText}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📋 5. 한울 9BQC & LQ2 작업일보 등록 현황 및 내역 (Work Reports Table) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span>{labels.work_report_records}</span>
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              총 {filteredWorkReports.length}건
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setReportScope("my")}
                className={`px-3 py-1 rounded-lg font-black transition-all ${
                  reportScope === "my"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {labels.my_reports}
              </button>
              <button
                type="button"
                onClick={() => setReportScope("all")}
                className={`px-3 py-1 rounded-lg font-black transition-all ${
                  reportScope === "all"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {labels.all_reports}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold h-8 text-[11px]">
                <th className="py-1 px-3 w-[11%] text-center">{labels.date}</th>
                <th className="py-1 px-3 w-[11%] text-center">프로젝트/라인</th>
                <th className="py-1 px-3 w-[10%]">{labels.process}</th>
                <th className="py-1 px-3 w-[9%]">{labels.worker}</th>
                <th className="py-1 px-3 w-[20%] text-center">{labels.production_qty} ({labels.good_qty}/{labels.defect_qty}/총생산)</th>
                <th className="py-1 px-3 w-[15%] text-center">{labels.dimension_inspection}</th>
                <th className="py-1 px-3 w-[12%]">{labels.special_notes}</th>
                <th className="py-1 px-3 w-[12%] text-center">{labels.action_management}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredWorkReports.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400 font-bold">
                    <p className="text-sm text-slate-500 dark:text-slate-400">등록된 작업일보가 없습니다.</p>
                  </td>
                </tr>
              ) : (
                filteredWorkReports.map((report) => {
                  const isMy =
                    report.worker === currentProfile?.name ||
                    report.writer === currentProfile?.name ||
                    (currentProfile?.name && typeof report.worker === "string" && report.worker.includes(currentProfile.name));

                  const totalProd = Number(report.totalProduced || report.productionQty || 0);
                  const totalGood = Number(report.goodQty || totalProd - (report.defectQty || 0));
                  const totalDefect = Number(report.defectQty || 0);
                  const insp = getSampleInspectionStatus(report);

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors h-10 group text-[11.5px]"
                    >
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {report.date}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10.5px] font-black font-mono ${
                            String(report.project).includes("9BQC")
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300"
                          }`}
                        >
                          {report.project || "9BQC"}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                        {report.processId === "외주가공" ? "가공/협력업체" : (report.processId || report.processName || "가공/협력업체")}
                        {report.shift && (
                          <span className="ml-1 text-[10px] text-slate-400 font-normal">
                            ({report.shift})
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200 truncate">
                        {report.worker || "한울"}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {totalGood.toLocaleString()}
                          </span>
                          <span className="text-slate-400">/</span>
                          <span className="text-rose-600 dark:text-rose-400">
                            {totalDefect.toLocaleString()}
                          </span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-900 dark:text-slate-100">
                            {totalProd.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {insp.isComplete ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                            ✓ {labels.sample_complete}
                          </span>
                        ) : insp.hasAny ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                            ⏳ {labels.sample_pending}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            -
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                        {report.notes || report.issues || "-"}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => exportHanulReportToExcel(report)}
                            title={labels.excel_download}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10.5px] cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {isMy && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReport(report.id)}
                              title={labels.delete_report}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10.5px] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* ========================================================================= */}
      {/* 🖼️ 이미지 확대 모달 */}
      {/* ========================================================================= */}
      {previewImage && (
        <ImagePreviewModal
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          imageUrl={previewImage.url}
          imageName={previewImage.name}
        />
      )}

      {/* ========================================================================= */}
      {/* 📋 한울 가공/협력업체 작업일보 작성 모달 (9BQC / LQ2a) */}
      {/* ========================================================================= */}
      {isReportModalOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50" />}>
          <HanulWorkReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            initialProject={reportModalProject}
            initialWorker={initialWorkerName}
          />
        </Suspense>
      )}

      {/* Digital Inspection Modal */}
      <DigitalInspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
      />
    </div>
  );
};

export default HanulWorkerDashboardView;
