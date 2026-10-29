import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import {
  Factory,
  ShieldAlert,
  Megaphone,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Check,
  ZoomIn,
  Camera,
  Calendar,
  Clock,
  User,
  Search,
  Layers,
  ArrowRight,
  Eye,
  Info,
  Sparkles,
  Gauge
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { SevereDisasterBar } from "../SevereDisasterBar";
import { ImagePreviewModal } from "../common/ImagePreviewModal";
import { DigitalInspectionModal } from "../sq/DigitalInspectionModal";
import {
  subscribeExtrusionQualityIssues,
  getLocalExtrusionQualityIssues,
  acknowledgeExtrusionQualityIssue,
  EXTRUSION_LINES
} from "../../services/extrusionQualityIssueService";
import {
  subscribeUrgentIssues,
  getLocalUrgentIssues
} from "../../services/urgentIssueService";
import {
  saveExtrusionReport,
  getLocalExtrusionReports,
  subscribeToExtrusionReports
} from "../../services/extrusionProductionService";
import { getWorkLogText } from "../../services/workLogI18nService";
import { isWorkerManagerRole } from "../../services/personnelCardService";
import {
  getOverallDaySampleStatus,
  getSampleInspectionStatus
} from "../../utils/sampleInspectionUtils";
import { getKSTDateString } from "../../utils/dateUtils";
import ExtrusionMaterialBOMQuickPanel from "./ExtrusionMaterialBOMQuickPanel";
import { WorkerPersonalExtrusionReportList } from "./WorkerPersonalExtrusionReportList";

const ExtrusionWorkReportModal = lazy(() =>
  import("./ExtrusionWorkReportModal").then((m) => ({
    default: m.ExtrusionWorkReportModal || m.default
  }))
);

export const ExtrusionWorkerDashboardView = ({ onNavigateTab }) => {
  const { currentProfile } = useAuth();
  const [qualityIssues, setQualityIssues] = useState(() => getLocalExtrusionQualityIssues());
  const [urgentIssues, setUrgentIssues] = useState(() => getLocalUrgentIssues());
  const [selectedLineFilter, setSelectedLineFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ACTIVE"); // "ACTIVE", "ALL", "RESOLVED"
  const [searchQuery, setSearchQuery] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [saveToastMessage, setSaveToastMessage] = useState("");

  const isManager = useMemo(() => isWorkerManagerRole(currentProfile), [currentProfile]);
  const displayTitle = currentProfile?.title || (
    currentProfile?.name === "공영국" ? "대리" :
    ["심임대", "이상은"].includes(currentProfile?.name) ? "반장" :
    currentProfile?.name === "설유철" ? "책임" :
    (isManager ? "반장" : "사원")
  );

  const todayStr = useMemo(() => getKSTDateString(), []);

  // Subscribe to Extrusion Quality Issues
  useEffect(() => {
    const unsub = subscribeExtrusionQualityIssues((list) => {
      setQualityIssues(list);
    });
    return () => unsub();
  }, []);

  // Subscribe to Company Notices (사내공지)
  useEffect(() => {
    const unsub = subscribeUrgentIssues((list) => {
      setUrgentIssues(list);
    });
    return () => unsub();
  }, []);

  // Subscribe to Extrusion Reports for Sample Completion Status
  const [extrusionReports, setExtrusionReports] = useState(() => getLocalExtrusionReports());

  useEffect(() => {
    const unsub = subscribeToExtrusionReports((list) => {
      setExtrusionReports(list || []);
    });
    return () => unsub();
  }, []);

  const sampleStatus = useMemo(() => {
    return getOverallDaySampleStatus(extrusionReports, todayStr);
  }, [extrusionReports, todayStr]);

  // Listen to open-extrusion-work-report-modal event and auto-open session trigger
  useEffect(() => {
    const handleOpen = () => {
      setIsReportModalOpen(true);
    };
    window.addEventListener("open-extrusion-work-report-modal", handleOpen);

    try {
      if (sessionStorage.getItem("auto_open_extrusion_report") === "true") {
        sessionStorage.removeItem("auto_open_extrusion_report");
        setIsReportModalOpen(true);
      }
    } catch (e) {}

    return () => window.removeEventListener("open-extrusion-work-report-modal", handleOpen);
  }, []);

  // Save handler for Extrusion Work Report
  const handleSaveExtrusionReport = async (reportData) => {
    try {
      await saveExtrusionReport(reportData);
      setIsReportModalOpen(false);
      setSaveToastMessage("✅ 압출 작업일보 및 TPM 점검이 성공적으로 저장되었습니다!");
      setTimeout(() => setSaveToastMessage(""), 3500);

      // 5단계 이후: 한울과 동일하게 품질이슈목록보기로 자동 스크롤
      setTimeout(() => {
        const el = document.getElementById("extrusion-quality-issues-board");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (err) {
      console.error("Save extrusion report error:", err);
      alert("작업일보 저장 중 오류가 발생했습니다.");
    }
  };

  // Filter Active Company Notices (사내공지가 등록될 경우만 종료일까지 표시)
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

      // Check Expiration / End Date (종료일까지 표시)
      const expDate = item.expireDate || item.endDate || item.targetDate || "";
      if (expDate && expDate < todayStr) {
        return false; // 이미 종료일이 지난 공지는 숨김
      }

      return true;
    });
  }, [urgentIssues, todayStr]);

  // Filter Quality Issues posted by Seol Yu-cheol (or active)
  const filteredQualityIssues = useMemo(() => {
    return qualityIssues.filter((it) => {
      if (!it) return false;

      // Status filter
      if (selectedStatusFilter !== "ALL") {
        if (it.status !== selectedStatusFilter) return false;
      }

      // Line filter
      if (selectedLineFilter !== "all") {
        if (it.line !== selectedLineFilter && it.line !== "전 라인 (공통)") return false;
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
  }, [qualityIssues, selectedStatusFilter, selectedLineFilter, searchQuery]);

  const activeQualityCount = useMemo(() => {
    return qualityIssues.filter((it) => it && it.status === "ACTIVE").length;
  }, [qualityIssues]);

  const handleAcknowledge = (issueId) => {
    if (currentProfile?.name) {
      acknowledgeExtrusionQualityIssue(issueId, currentProfile.name);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16 max-w-[1600px] mx-auto min-w-0">
      {/* ========================================================================= */}
      {/* 🏭 상단 바: 초·중·종물 기록 여부만 표출 (6단계 라벨 및 일보 작성 뱃지 제거) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 rounded-2xl shadow-lg border border-slate-800 p-3.5 sm:p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 shrink-0">
            <Factory className="w-6 h-6" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                삼랑진공장 압출동
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-600/30 text-teal-300 border border-teal-400/40">
                [작업자] {currentProfile?.name} {displayTitle}
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

      {/* Save Success Toast */}
      {saveToastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white text-xs sm:text-sm font-black shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{saveToastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveToastMessage("")}
            className="text-white/80 hover:text-white text-xs font-bold"
          >
            닫기
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 설유철 작업자 전용 BOM 등록 및 오탈자/재료변경 수정 패널 */}
      {/* ========================================================================= */}
      <ExtrusionMaterialBOMQuickPanel />

      {/* ========================================================================= */}
      {/* 📢 2. 사내공지 (등록된 공지가 있을 때만 종료일까지 표시) */}
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
                  전사 및 현장 전달 사내공지 사항입니다. 지정된 종료일까지 게시됩니다.
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

                  {/* Notice Images */}
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
      {/* 🚨 3. 설유철이 올린 품질이슈공유 내용 (실시간 압출 품질이슈 공유 보드 - 이슈목록보기) */}
      {/* ========================================================================= */}
      <div id="extrusion-quality-issues-board" className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border-2 border-rose-500/40 shadow-md space-y-4 text-slate-900 dark:text-white scroll-mt-20">
        {/* Quality Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-md shadow-rose-600/30 shrink-0 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-rose-600 dark:text-rose-400">
                  🚨 압출동 부적합품 경보 공유판 (설유철 책임 전파)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-2xs">
                  {activeQualityCount}건 진행중
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                라인별 불량 현상, 발생원인 사진 및 조치결과를 확인하고 숙지 완료 버튼을 눌러주세요.
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="제목, 라인, 불량 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          {/* Status Filter */}
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

          {/* Line Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400">라인:</span>
            <select
              value={selectedLineFilter}
              onChange={(e) => setSelectedLineFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
            >
              <option value="all">전체 라인</option>
              {EXTRUSION_LINES.map((l) => (
                <option key={l.id} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quality Issues List */}
        {filteredQualityIssues.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p>해당 조건의 압출 품질이슈가 없습니다.</p>
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
                  {/* Badges & Meta Header */}
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
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                        {issue.line}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-white dark:bg-slate-800 text-rose-600 border border-rose-200 dark:border-rose-800">
                        {issue.defectType}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {issue.date || issue.createdAt?.slice(0, 10)} {issue.time || ""}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-slate-500">
                      작성자: {issue.author || "설유철"} {issue.authorTitle || "책임"}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    {issue.title}
                  </h4>

                  {/* 1) 발생원인 내용 및 사진 */}
                  <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 space-y-2 text-xs">
                    <span className="font-black text-[11px] text-rose-700 dark:text-rose-300 block flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>1. 세부 불량 현상 및 발생 원인</span>
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                      {issue.content}
                    </p>

                    {/* 발생원인 사진 */}
                    {causeImgs.length > 0 && (
                      <div className="pt-1.5 border-t border-rose-100 dark:border-rose-900/40">
                        <span className="text-[10.5px] font-bold text-rose-600 dark:text-rose-400 block mb-1">
                          📸 발생원인 사진 ({causeImgs.length}장 - 클릭하여 확대):
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto pt-0.5">
                          {causeImgs.map((img, i) => (
                            <div
                              key={img.id || i}
                              onClick={() => setPreviewImage({ url: img.dataUrl, name: `[원인] ${img.name}` })}
                              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-rose-300 dark:border-rose-700 cursor-pointer group shrink-0 shadow-2xs"
                            >
                              <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <ZoomIn className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2) 조치결과 내용 및 사진 */}
                  {actionText && (
                    <div className="p-3 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800/80 space-y-2 text-xs">
                      <span className="font-black text-teal-800 dark:text-teal-300 text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>2. 조치결과 및 개선사항</span>
                      </span>
                      <p className="text-teal-950 dark:text-teal-100 font-bold leading-relaxed whitespace-pre-wrap">
                        {actionText}
                      </p>

                      {/* 조치결과 사진 */}
                      {actionImgs.length > 0 && (
                        <div className="pt-1.5 border-t border-teal-200 dark:border-teal-900/40">
                          <span className="text-[10.5px] font-bold text-teal-700 dark:text-teal-300 block mb-1">
                            📸 조치결과 사진 ({actionImgs.length}장 - 클릭하여 확대):
                          </span>
                          <div className="flex items-center gap-2 overflow-x-auto pt-0.5">
                            {actionImgs.map((img, i) => (
                              <div
                                key={img.id || i}
                                onClick={() => setPreviewImage({ url: img.dataUrl, name: `[조치] ${img.name}` })}
                                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-teal-300 dark:border-teal-700 cursor-pointer group shrink-0 shadow-2xs"
                              >
                                <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                                <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                  <ZoomIn className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Worker Acknowledge Bottom Bar */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 dark:border-slate-800 text-xs">
                    <span className="text-[10.5px] text-slate-500 font-mono">
                      확인한 작업자: {(issue.acknowledgedBy || []).join(", ") || "확인 대기"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleAcknowledge(issue.id)}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs transition flex items-center gap-1 cursor-pointer ${
                        isAcked
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
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
      {/* 📋 4. 본인 작성 압출 작업일보 목록 (5건씩 페이징 표출)                   */}
      {/* ========================================================================= */}
      <WorkerPersonalExtrusionReportList
        reports={extrusionReports}
        currentWorkerName={currentProfile?.name || "작업자"}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Image Lightbox Modal */}
      {previewImage && (
        <ImagePreviewModal previewImage={previewImage} onClose={() => setPreviewImage(null)} />
      )}

      {/* Digital Inspection Modal */}
      <DigitalInspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
      />

      {/* 📋 삼랑진공장 압출동 작업일보 모달 (4단계 TPM 점검 10개 항목 현행유지) */}
      {isReportModalOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50" />}>
          <ExtrusionWorkReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            onSave={handleSaveExtrusionReport}
          />
        </Suspense>
      )}
    </div>
  );
};
