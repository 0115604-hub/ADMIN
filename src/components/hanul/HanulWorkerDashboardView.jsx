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
  Sparkles
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { SevereDisasterBar } from "../SevereDisasterBar";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
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

const HanulWorkReportModal = lazy(() =>
  import("../HanulWorkReportModal").then((m) => ({
    default: m.HanulWorkReportModal || m.default
  }))
);

export const HanulWorkerDashboardView = () => {
  const { currentProfile } = useAuth();
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

  const handleAcknowledge = (issueId) => {
    if (currentProfile?.name) {
      acknowledgeHanulQualityIssue(issueId, currentProfile.name);
    }
  };

  const handleOpenReportModal = (project = "9BQC") => {
    setReportModalProject(project);
    setIsReportModalOpen(true);
  };

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

  const initialWorkerName = useMemo(() => {
    if (currentProfile?.name && !isExcludedFromWorkReport(currentProfile.name)) {
      return currentProfile.name;
    }
    return "박종미";
  }, [currentProfile?.name]);

  return (
    <div className="space-y-4 animate-fadeIn pb-16 max-w-[1600px] mx-auto min-w-0">
      {/* ========================================================================= */}
      {/* 🌟 0. Top Hanul Worker Welcome & Quick Link Banner (압출동과 100% 동일한 고급 카드) */}
      {/* ========================================================================= */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-800 via-slate-900 to-purple-900 text-white shadow-md border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 backdrop-blur-xs text-indigo-300 border border-indigo-400/40 shrink-0">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-sm sm:text-base leading-tight">
                🏭 한림공장 (주)한울 외주가공 (작업일보)
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-black shadow-2xs ${
                  isManager
                    ? "bg-purple-600 text-white border border-purple-300/40"
                    : "bg-indigo-500 text-white"
                }`}
              >
                {isManager ? "[현장관리자] " : "[일반작업자] "}
                {currentProfile?.name || "한울"} {displayTitle}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-purple-300 border border-purple-400/40">
                9BQC • LQ2
              </span>
            </div>
            <p className="text-xs text-indigo-200/90 font-medium mt-0.5">
              안전제일 • 9BQC G/RUN & LQ2a Hood Side 생산품질 무결점 실현
            </p>
          </div>
        </div>

        {/* 1-Click Action Buttons: 9BQC 및 LQ2a 작업일보 작성 */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => handleOpenReportModal("9BQC")}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-black text-xs sm:text-sm active:scale-95 transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Car className="w-4 h-4" />
            <span>🚗 9BQC 일보 작성</span>
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenReportModal("LQ2A")}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-black text-xs sm:text-sm active:scale-95 transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4" />
            <span>⚡ LQ2a 일보 작성</span>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 1. 한울 9BQC & LQ2 핵심 라인 선택 탭 (사용자 요구사항 완벽 반영) */}
      {/* ========================================================================= */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>생산 라인 선택:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedProjectFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              selectedProjectFilter === "ALL"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            전체 라인 (9BQC + LQ2)
          </button>
          <button
            type="button"
            onClick={() => setSelectedProjectFilter("9BQC")}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedProjectFilter === "9BQC"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>🚗 9BQC (G/RUN)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedProjectFilter("LQ2")}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedProjectFilter === "LQ2"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>⚡ LQ2 / LQ2a (Hood Side)</span>
          </button>
        </div>

        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2">
          당일 등록 일보: <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{todayReportsCount}건</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚨 2. 중대재해공유판 (항상 최상단 안전 공유) */}
      {/* ========================================================================= */}
      <SevereDisasterBar />

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
      {/* 🚨 4. 한울 관리자 품질이슈 공유판 (9BQC / LQ2 외주가공 전용) */}
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
                  🚨 (주)한울 9BQC / LQ2 품질이슈 공유판
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
              { id: "ACTIVE", label: "🚨 진행중 (조치중)" },
              { id: "RESOLVED", label: "✅ 조치완료" },
              { id: "ALL", label: "전체보기" }
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
                          ✓ 숙지완료
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAcknowledge(issue.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10.5px] shadow-xs cursor-pointer active:scale-95"
                        >
                          숙지 완료
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
              <span>한울 외주가공 (9BQC • LQ2) 작업일보 등록 내역</span>
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
                내 일보만
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
                한울 전체
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOpenReportModal(selectedProjectFilter === "LQ2" ? "LQ2A" : "9BQC")}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>신규 일보 작성</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold h-8 text-[11px]">
                <th className="py-1 px-3 w-[12%] text-center">일자</th>
                <th className="py-1 px-3 w-[12%] text-center">프로젝트/라인</th>
                <th className="py-1 px-3 w-[12%]">공정</th>
                <th className="py-1 px-3 w-[10%]">작업자</th>
                <th className="py-1 px-3 w-[24%] text-center">생산 실적 (양품/불량/총생산)</th>
                <th className="py-1 px-3 w-[16%]">특이사항</th>
                <th className="py-1 px-3 w-[14%] text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredWorkReports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400 font-bold">
                    <p className="text-sm text-slate-500 dark:text-slate-400">등록된 작업일보가 없습니다.</p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenReportModal("9BQC")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs cursor-pointer"
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>🚗 9BQC 첫 일보 작성</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenReportModal("LQ2A")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-xs cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>⚡ LQ2a 첫 일보 작성</span>
                      </button>
                    </div>
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
                        {report.processId || report.processName || "외주가공"}
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
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                        {report.notes || report.issues || "-"}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => exportHanulReportToExcel(report)}
                            title="엑셀 다운로드"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10.5px] cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {isMy && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm("이 작업일보를 삭제하시겠습니까?")) {
                                  deleteHanulWorkReport(report.id);
                                }
                              }}
                              title="삭제"
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
      {/* 📋 한울 외주가공 작업일보 작성 모달 (9BQC / LQ2a) */}
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
    </div>
  );
};

export default HanulWorkerDashboardView;
