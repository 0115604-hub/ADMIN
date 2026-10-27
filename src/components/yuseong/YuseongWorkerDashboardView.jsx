import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import {
  Factory,
  ShieldAlert,
  Megaphone,
  CheckCircle2,
  Check,
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
  subscribeYuseongQualityIssues,
  getLocalYuseongQualityIssues,
  acknowledgeYuseongQualityIssue
} from "../../services/yuseongQualityIssueService";
import {
  subscribeYuseongWorkReports,
  getLocalYuseongWorkReports,
  exportYuseongReportToExcel,
  deleteYuseongWorkReport
} from "../../services/yuseongWorkReportService";
import {
  subscribeUrgentIssues,
  getLocalUrgentIssues
} from "../../services/urgentIssueService";
import { isWorkerManagerRole } from "../../services/personnelCardService";
import {
  getOverallDaySampleStatus,
  getSampleInspectionStatus
} from "../../utils/sampleInspectionUtils";

const YuseongWorkReportModal = lazy(() =>
  import("./YuseongWorkReportModal").then((m) => ({
    default: m.YuseongWorkReportModal || m.default
  }))
);

export const YuseongWorkerDashboardView = () => {
  const { currentProfile } = useAuth();
  const [qualityIssues, setQualityIssues] = useState(() => getLocalYuseongQualityIssues());
  const [urgentIssues, setUrgentIssues] = useState(() => getLocalUrgentIssues());
  const [workReports, setWorkReports] = useState(() => getLocalYuseongWorkReports());

  // Filters
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("ALL"); // "ALL" | "JK1" | "CE1" | "DT"
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ACTIVE"); // "ACTIVE" | "RESOLVED" | "ALL"
  const [searchQuery, setSearchQuery] = useState("");
  const [reportScope, setReportScope] = useState("my"); // "my" | "all"

  // Modals
  const [previewImage, setPreviewImage] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalProject, setReportModalProject] = useState("JK1");
  const [editReportData, setEditReportData] = useState(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

  const isManager = useMemo(() => isWorkerManagerRole(currentProfile), [currentProfile]);
  const displayTitle = currentProfile?.title || currentProfile?.position || (isManager ? "반장" : "사원");
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // 1. Subscribe to Yuseong Quality Issues
  useEffect(() => {
    const unsub = subscribeYuseongQualityIssues((list) => {
      setQualityIssues(list);
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Company Notices
  useEffect(() => {
    const unsub = subscribeUrgentIssues((list) => {
      setUrgentIssues(list);
    });
    return () => unsub();
  }, []);

  // 3. Subscribe to Yuseong Work Reports
  useEffect(() => {
    const unsub = subscribeYuseongWorkReports((list) => {
      setWorkReports(list);
    });
    return () => unsub();
  }, []);

  // 4. Listen to open-yuseong-work-report-modal event and auto-open session trigger
  useEffect(() => {
    const handleOpen = (e) => {
      const proj = e?.detail?.project || "JK1";
      setReportModalProject(proj);
      setIsReportModalOpen(true);
    };
    window.addEventListener("open-yuseong-work-report-modal", handleOpen);

    // Check if auto-open requested via sessionStorage from WorkerPinModal
    try {
      const autoProj = sessionStorage.getItem("auto_open_yuseong_report");
      if (autoProj) {
        sessionStorage.removeItem("auto_open_yuseong_report");
        setReportModalProject(autoProj);
        setIsReportModalOpen(true);
      }
    } catch (err) {}

    return () => window.removeEventListener("open-yuseong-work-report-modal", handleOpen);
  }, []);

  // Active Company Notices
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
      if (selectedStatusFilter !== "ALL") {
        if (it.status !== selectedStatusFilter) return false;
      }
      if (selectedProjectFilter !== "ALL") {
        const lineText = String(it.line || it.project || "").toUpperCase();
        if (!lineText.includes(selectedProjectFilter)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (it.title || "").toLowerCase().includes(q);
        const matchContent = (it.content || "").toLowerCase().includes(q);
        const matchDefect = (it.defectType || "").toLowerCase().includes(q);
        const matchLine = (it.line || "").toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchDefect && !matchLine) return false;
      }
      return true;
    });
  }, [qualityIssues, selectedStatusFilter, selectedProjectFilter, searchQuery]);

  const activeQualityCount = useMemo(() => {
    return qualityIssues.filter((it) => it && it.status === "ACTIVE").length;
  }, [qualityIssues]);

  // Filtered Work Reports
  const filteredReports = useMemo(() => {
    return workReports.filter((rep) => {
      if (!rep) return false;
      if (selectedProjectFilter !== "ALL") {
        if (rep.project !== selectedProjectFilter) return false;
      }
      if (reportScope === "my" && currentProfile?.name) {
        if (!String(rep.worker || "").includes(currentProfile.name)) return false;
      }
      return true;
    });
  }, [workReports, selectedProjectFilter, reportScope, currentProfile]);

  const todayReportsCount = useMemo(() => {
    return workReports.filter((r) => r.date === todayStr).length;
  }, [workReports, todayStr]);

  const sampleStatus = useMemo(() => {
    return getOverallDaySampleStatus(workReports, todayStr);
  }, [workReports, todayStr]);

  // Handlers
  const handleAcknowledge = (issueId) => {
    if (currentProfile?.name) {
      acknowledgeYuseongQualityIssue(issueId, currentProfile.name);
    }
  };

  const handleOpenReportModal = (projectCode = "JK1", reportToEdit = null) => {
    setReportModalProject(projectCode);
    setEditReportData(reportToEdit);
    setIsReportModalOpen(true);
  };

  const handleDeleteReport = async (repId) => {
    if (window.confirm("정말 이 작업일보를 삭제하시겠습니까?")) {
      await deleteYuseongWorkReport(repId);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16 max-w-[1600px] mx-auto min-w-0">
      {/* ========================================================================= */}
      {/* 🏭 상단 바: 초·중·종물 기록 여부만 표출 (6단계 라벨 및 일보 작성 뱃지 제거) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 rounded-2xl shadow-lg border border-slate-800 p-3.5 sm:p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shrink-0">
            <Factory className="w-6 h-6" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                (주)유성 가공/협력업체
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600/30 text-indigo-300 border border-indigo-400/40">
                [작업자] {currentProfile?.name || "유성"} {displayTitle}
              </span>

              {/* 🔥 초·중·종물 기록 여부 뱃지만 표출 */}
              {sampleStatus.isComplete ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-500/80 flex items-center gap-1.5 shadow-sm shadow-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>✓ 초·중·종물 기록 완료</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-950 text-amber-300 border border-amber-500/80 flex items-center gap-1.5 shadow-sm shadow-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  <span>⏳ 초·중·종물 기록 진행중 (종물 대기)</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 font-medium mt-1 truncate">
              품질이슈 공유판의 최신 불량 및 표준 조치사항을 숙지한 후 작업을 개시하세요.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 flex items-center sm:flex-col sm:items-end justify-between gap-1">
          <span className="text-xs font-mono font-bold text-slate-400">{todayStr}</span>
          <span className={`text-[11px] font-black font-mono ${sampleStatus.isComplete ? "text-emerald-400" : "text-amber-400"}`}>
            {sampleStatus.summary}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📢 3. 사내공지 (등록된 공지가 있을 때만 종료일까지 표시) */}
      {/* ========================================================================= */}
      {activeCompanyNotices.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-blue-950/80 rounded-2xl p-4 sm:p-5 border-2 border-indigo-500/50 shadow-md space-y-3.5 text-white">
          <div className="flex items-center justify-between pb-2.5 border-b border-indigo-500/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base text-white">
                    📢 사내 공지사항
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white shadow-2xs">
                    {activeCompanyNotices.length}건 유효 공지
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200/90 font-medium mt-0.5">
                  (주)유성 가공/협력업체 현장 전달 사내공지 사항입니다.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {activeCompanyNotices.map((notice) => {
              const hasImages = Array.isArray(notice.images) && notice.images.length > 0;
              return (
                <div
                  key={notice.id || notice._docId}
                  className="p-3.5 sm:p-4 rounded-xl bg-white/10 dark:bg-slate-900/60 backdrop-blur-xs border border-indigo-400/40 space-y-2.5"
                >
                  <h4 className="font-black text-sm sm:text-base text-white">
                    {notice.title}
                  </h4>
                  {notice.content && (
                    <p className="text-xs text-slate-100 leading-relaxed whitespace-pre-wrap bg-slate-950/40 p-3 rounded-xl border border-indigo-500/20">
                      {notice.content}
                    </p>
                  )}
                  {hasImages && (
                    <div className="flex items-center gap-2 overflow-x-auto pt-1">
                      {notice.images.map((img, idx) => {
                        const imgUrl = typeof img === "string" ? img : img.dataUrl || img.url;
                        return (
                          <div
                            key={idx}
                            onClick={() => setPreviewImage({ url: imgUrl, name: notice.title })}
                            className="relative w-16 h-16 rounded-xl overflow-hidden border border-indigo-400/60 cursor-pointer shrink-0"
                          >
                            <img src={imgUrl} alt="공지 사진" className="w-full h-full object-cover" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚨 4. 유성 품질이슈 공유판 (JK1 • CE1 • DT Hood) - 이슈목록보기 */}
      {/* ========================================================================= */}
      <div id="yuseong-quality-issues-board" className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border-2 border-rose-500/40 shadow-md space-y-4 text-slate-900 dark:text-white scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 text-white shadow-md shadow-rose-600/30 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-rose-600 dark:text-rose-400">
                  🚨 (주)유성 (JK1 • CE1 • DT Hood) 품질이슈 공유판 (이슈목록보기)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-2xs">
                  {activeQualityCount}건 진행중
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                3대 아이템 불량 현상, 발생원인 및 조치결과를 확인하고 숙지 완료해주세요.
              </p>
            </div>
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="제목, 차종, 불량 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
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

          <span className="text-[11px] font-bold text-slate-400">
            총 {filteredQualityIssues.length}건 등록됨
          </span>
        </div>

        {/* Quality Issues List */}
        {filteredQualityIssues.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p>현재 등록된 유성 품질이슈가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQualityIssues.map((issue) => {
              const isResolved = issue.status === "RESOLVED";
              const isAcked = Array.isArray(issue.acknowledgedBy) && issue.acknowledgedBy.includes(currentProfile?.name);
              const actionText = issue.actionResult || issue.actionGuide || issue.resolutionNote || "";
              const hasPhotos = Array.isArray(issue.photos) && issue.photos.length > 0;

              return (
                <div
                  key={issue.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                    isResolved
                      ? "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                      : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-600 text-white">
                        {issue.line || issue.project || "유성 공통"}
                      </span>
                      {issue.defectType && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          {issue.defectType}
                        </span>
                      )}
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">
                        {issue.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{issue.author || "관리자"}</span>
                      <span>•</span>
                      <span>{issue.date || issue.createdAt?.slice(0, 10)}</span>
                    </div>
                  </div>

                  {issue.content && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-2 whitespace-pre-wrap">
                      {issue.content}
                    </p>
                  )}

                  {/* Defect Photos */}
                  {hasPhotos && (
                    <div className="flex items-center gap-2 overflow-x-auto pt-2">
                      {issue.photos.map((ph, idx) => {
                        const url = typeof ph === "string" ? ph : ph.url || ph.dataUrl;
                        return (
                          <div
                            key={idx}
                            onClick={() => setPreviewImage({ url, name: issue.title })}
                            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-rose-300 dark:border-rose-800 cursor-pointer group shrink-0"
                          >
                            <img src={url} alt="불량 사진" className="w-full h-full object-cover group-hover:scale-105 transition" />
                            <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <ZoomIn className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Action guide / result */}
                  {actionText && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>개선 대책 및 현장 조치결과:</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed pl-5 whitespace-pre-wrap">
                        {actionText}
                      </p>
                    </div>
                  )}

                  {/* Worker Acknowledge Button */}
                  <div className="pt-2.5 mt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono">
                      확인 작업자: {(issue.acknowledgedBy || []).join(", ") || "확인 대기"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleAcknowledge(issue.id)}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs transition flex items-center gap-1 cursor-pointer ${
                        isAcked
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-rose-600 hover:bg-rose-700 text-white shadow-xs active:scale-95"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isAcked ? "확인 완료됨" : "확인완료 작업개시 ✓"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📋 5. 유성 작업일보 등록 현황 및 이력 테이블 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                📋 (주)유성 작업일보 등록 이력
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                JK1 • CE1 • DT Hood 실시간 공정별 작업 실적 및 TPM 완료 내역
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setReportScope("my")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  reportScope === "my"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                내 일보만
              </button>
              <button
                type="button"
                onClick={() => setReportScope("all")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  reportScope === "all"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                전체 일보
              </button>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">일자 / 근무</th>
                <th className="py-2.5 px-3">작업자</th>
                <th className="py-2.5 px-3">아이템 / 공정</th>
                <th className="py-2.5 px-3 text-right">총생산(EA)</th>
                <th className="py-2.5 px-3 text-right">정품(EA)</th>
                <th className="py-2.5 px-3 text-right">불량(EA)</th>
                <th className="py-2.5 px-3 text-center">초·중·종물 검사</th>
                <th className="py-2.5 px-3 text-center">TPM 점검</th>
                <th className="py-2.5 px-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    등록된 유성 작업일보가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredReports.map((rep) => {
                  const yieldPct = rep.summary?.yieldPct ?? 100;
                  const insp = getSampleInspectionStatus(rep);
                  return (
                    <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <div>{rep.date}</div>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                          rep.shift === "야간" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {rep.shift}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                        {rep.worker}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-black text-indigo-600 dark:text-indigo-400">
                          {rep.project}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {rep.processId} {rep.subProcess ? `(${rep.subProcess})` : ""}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {rep.summary?.totalGross || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        {rep.summary?.totalGenuine || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                        {rep.summary?.totalBad || 0}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {insp.isComplete ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                            완료 (초·중·종 OK)
                          </span>
                        ) : insp.hasAny ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                            진행중 (종물 대기)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            미기록
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          완료
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => exportYuseongReportToExcel(rep)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 hover:text-emerald-600 transition"
                            title="엑셀 다운로드"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReportModal(rep.project, rep)}
                            className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-indigo-600 transition"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReport(rep.id)}
                            className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Image Lightbox Modal */}
      {previewImage && (
        <ImagePreviewModal
          previewImage={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* Digital Inspection Modal */}
      <DigitalInspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
      />

      {/* 📋 유성 가공/협력업체 작업일보 모달 (4단계 TPM 점검 ➔ 5단계 공정별 일보) */}
      {isReportModalOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50" />}>
          <YuseongWorkReportModal
            isOpen={isReportModalOpen}
            onClose={() => {
              setIsReportModalOpen(false);
              setEditReportData(null);
            }}
            initialProject={reportModalProject}
            initialWorker={currentProfile?.name || "이성기"}
            editReport={editReportData}
          />
        </Suspense>
      )}
    </div>
  );
};

export default YuseongWorkerDashboardView;
