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
  subscribeMachiningQualityIssues,
  getLocalMachiningQualityIssues,
  acknowledgeMachiningQualityIssue
} from "../../services/machiningQualityIssueService";
import {
  subscribeMachiningWorkReports,
  getLocalMachiningWorkReports,
  exportMachiningReportToExcel,
  deleteMachiningWorkReport,
  isExcludedFromMachiningWorkReport
} from "../../services/machiningWorkReportService";
import {
  subscribeUrgentIssues,
  getLocalUrgentIssues
} from "../../services/urgentIssueService";
import { isWorkerManagerRole } from "../../services/personnelCardService";
import {
  getOverallDaySampleStatus,
  getSampleInspectionStatus
} from "../../utils/sampleInspectionUtils";

const MachiningWorkReportModal = lazy(() =>
  import("./MachiningWorkReportModal").then((m) => ({
    default: m.MachiningWorkReportModal || m.default
  }))
);

export const MachiningWorkerDashboardView = () => {
  const { currentProfile } = useAuth();
  const [qualityIssues, setQualityIssues] = useState(() => getLocalMachiningQualityIssues());
  const [urgentIssues, setUrgentIssues] = useState(() => getLocalUrgentIssues());
  const [workReports, setWorkReports] = useState(() => getLocalMachiningWorkReports());

  // Filters
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("ALL"); // "ALL" | "JA" | "NX4" | "NX4A" | "HR"
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ACTIVE"); // "ACTIVE" | "RESOLVED" | "ALL"
  const [searchQuery, setSearchQuery] = useState("");
  const [reportScope, setReportScope] = useState("my"); // "my" | "all"

  // Modals
  const [previewImage, setPreviewImage] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalProject, setReportModalProject] = useState("JA");
  const [editReportData, setEditReportData] = useState(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

  const isManager = useMemo(() => isWorkerManagerRole(currentProfile), [currentProfile]);
  const displayTitle = currentProfile?.title || currentProfile?.position || (isManager ? "반장" : "사원");
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // 1. Subscribe to Machining Quality Issues
  useEffect(() => {
    const unsub = subscribeMachiningQualityIssues((list) => {
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

  // 3. Subscribe to Machining Work Reports
  useEffect(() => {
    const unsub = subscribeMachiningWorkReports((list) => {
      setWorkReports(list);
    });
    return () => unsub();
  }, []);

  // 4. Listen to open-machining-work-report-modal event and auto-open session trigger
  useEffect(() => {
    const handleOpen = (e) => {
      const proj = e?.detail?.project || "JA";
      setReportModalProject(proj);
      setIsReportModalOpen(true);
    };
    window.addEventListener("open-machining-work-report-modal", handleOpen);

    // Check if auto-open requested via sessionStorage from WorkerPinModal
    try {
      const autoProj = sessionStorage.getItem("auto_open_machining_report");
      if (autoProj) {
        sessionStorage.removeItem("auto_open_machining_report");
        setReportModalProject(autoProj);
        setIsReportModalOpen(true);
      }
    } catch (err) {}

    return () => window.removeEventListener("open-machining-work-report-modal", handleOpen);
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
        const lineText = String(it.line || "").toUpperCase();
        if (!lineText.includes(selectedProjectFilter)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (it.title || "").toLowerCase().includes(q);
        const matchContent = (it.content || "").toLowerCase().includes(q);
        const matchLine = (it.line || "").toLowerCase().includes(q);
        const matchDefect = (it.defectType || "").toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchLine && !matchDefect) return false;
      }
      return true;
    });
  }, [qualityIssues, selectedStatusFilter, selectedProjectFilter, searchQuery]);

  const activeQualityCount = useMemo(() => {
    return qualityIssues.filter((it) => it && it.status !== "RESOLVED").length;
  }, [qualityIssues]);

  // Filtered Work Reports
  const filteredWorkReports = useMemo(() => {
    return (workReports || []).filter((r) => {
      if (!r) return false;
      if (selectedProjectFilter !== "ALL") {
        if (r.project !== selectedProjectFilter) return false;
      }
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
    if (currentProfile?.name && !isExcludedFromMachiningWorkReport(currentProfile.name)) {
      return currentProfile.name;
    }
    return "크리스토퍼";
  }, [currentProfile?.name]);

  const handleOpenReportModal = (projectCode = "JA", editData = null) => {
    setReportModalProject(projectCode);
    setEditReportData(editData);
    setIsReportModalOpen(true);
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm("선택한 작업일보를 삭제하시겠습니까?")) return;
    await deleteMachiningWorkReport(id);
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16 max-w-[1600px] mx-auto min-w-0">
      {/* ========================================================================= */}
      {/* 🏭 상단 바: 초·중·종물 기록 여부만 표출 (6단계 라벨 및 일보 작성 뱃지 제거) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 rounded-2xl shadow-lg border border-slate-800 p-3.5 sm:p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0">
            <Factory className="w-6 h-6" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                삼랑진공장 (주)오륙 가공동
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-600/30 text-amber-300 border border-amber-400/40">
                [작업자] {currentProfile?.name || "가공동"} {displayTitle}
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
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-orange-950/80 rounded-2xl p-4 sm:p-5 border-2 border-amber-500/50 shadow-md space-y-3.5 text-white">
          <div className="flex items-center justify-between pb-2.5 border-b border-amber-500/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/30 shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base text-white">
                    📢 사내 공지사항
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-2xs">
                    {activeCompanyNotices.length}건 유효 공지
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/90 font-medium mt-0.5">
                  삼랑진공장 가공동 현장 전달 사내공지 사항입니다.
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
                  className="p-3.5 sm:p-4 rounded-xl bg-white/10 dark:bg-slate-900/60 backdrop-blur-xs border border-amber-400/40 space-y-2.5"
                >
                  <h4 className="font-black text-sm sm:text-base text-white">
                    {notice.title}
                  </h4>
                  {notice.content && (
                    <p className="text-xs text-slate-100 leading-relaxed whitespace-pre-wrap bg-slate-950/40 p-3 rounded-xl border border-amber-500/20">
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
                            className="relative w-16 h-16 rounded-xl overflow-hidden border border-amber-400/60 cursor-pointer shrink-0"
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
      {/* 🚨 4. 가공동 관리자 품질이슈 공유판 (JA, NX4, NX4a, HR) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border-2 border-rose-500/40 shadow-md space-y-4 text-slate-900 dark:text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-md shadow-rose-600/30 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-rose-600 dark:text-rose-400">
                  🚨 가공동 (JA • NX4 • NX4a • HR) 품질이슈 공유판
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-2xs">
                  {activeQualityCount}건 진행중
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                4대 차종 G/RUN 불량 현상, 발생원인 및 조치결과를 확인하고 숙지 완료해주세요.
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
          <div className="py-10 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p>해당 조건의 가공동 품질이슈가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQualityIssues.map((issue) => {
              const isResolved = issue.status === "RESOLVED";
              const isAcked = Array.isArray(issue.acknowledgedBy) && issue.acknowledgedBy.includes(currentProfile?.name);
              const actionText = issue.actionResult || issue.actionGuide || "";

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
                        {isResolved ? "✓ 조치완료" : "🚨 조치중"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-amber-600 text-white font-mono">
                        {issue.line || "가공동 G/RUN"}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {issue.defectType}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => acknowledgeMachiningQualityIssue(issue.id, currentProfile?.name || "가공작업자")}
                      disabled={isAcked}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        isAcked
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-600 text-white hover:bg-amber-700"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isAcked ? "숙지 완료됨" : "숙지 확인"}</span>
                    </button>
                  </div>

                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    {issue.title}
                  </h4>
                  {issue.content && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {issue.content}
                    </p>
                  )}
                  {actionText && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-xs text-emerald-900 dark:text-emerald-200">
                      <strong>조치 내용: </strong> {actionText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📋 5. 가공동 작업일보 등록 현황 및 내역 (Work Reports Table) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              <span>가공동 (JA • NX4 • NX4a • HR) 작업일보 등록 내역</span>
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
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
                    ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs"
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
                    ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                가공동 전체
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold h-8 text-[11px]">
                <th className="py-1 px-3 w-[11%] text-center">일자</th>
                <th className="py-1 px-3 w-[12%] text-center">차종/라인</th>
                <th className="py-1 px-3 w-[12%]">공정</th>
                <th className="py-1 px-3 w-[10%]">작업자</th>
                <th className="py-1 px-3 w-[20%] text-center">생산 실적 (양품/불량/총생산)</th>
                <th className="py-1 px-3 w-[15%] text-center">초·중·종물 검사</th>
                <th className="py-1 px-3 w-[10%]">특이사항</th>
                <th className="py-1 px-3 w-[10%] text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredWorkReports.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400 font-bold">
                    <p className="text-sm text-slate-500 dark:text-slate-400">등록된 가공동 작업일보가 없습니다.</p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenReportModal("JA")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-xs cursor-pointer"
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>🚗 JA 첫 일보 작성</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenReportModal("NX4")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black shadow-xs cursor-pointer"
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>🚙 NX4 첫 일보 작성</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWorkReports.map((report) => {
                  const gross = (report.summary?.totalGross ?? (
                    (Number(report.production?.genuineLH || 0) + Number(report.production?.genuineRH || 0)) +
                    (Number(report.production?.badLH || 0) + Number(report.production?.badRH || 0))
                  ));
                  const gen = report.summary?.totalGenuine ?? (
                    (Number(report.production?.genuineLH || 0) + Number(report.production?.genuineRH || 0))
                  );
                  const bad = report.summary?.totalBad ?? (
                    (Number(report.production?.badLH || 0) + Number(report.production?.badRH || 0))
                  );
                  const insp = getSampleInspectionStatus(report);

                  return (
                    <tr key={report.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                        {report.date}
                        <span className="block text-[10px] text-slate-400">{report.shift}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                          {report.project} G/RUN
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                        {report.processId}
                        <span className="block text-[10px] text-slate-400">
                          {report.subProcess || report.jointType || report.inspectionType || ""}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                        {report.worker}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-mono text-[11px]">
                          <span className="text-emerald-600 font-bold">{gen}EA</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-rose-600 font-bold">{bad}EA</span>
                          <span className="text-slate-300">/</span>
                          <span className="font-black text-slate-900 dark:text-white">{gross}EA</span>
                        </div>
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
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-[120px]">
                        {report.notes || report.machineTrouble || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => exportMachiningReportToExcel(report)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 transition"
                            title="엑셀 다운로드"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReportModal(report.project, report)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition"
                            title="수정"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReport(report.id)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600 transition"
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

      {/* Machining Work Report Modal */}
      {isReportModalOpen && (
        <Suspense fallback={null}>
          <MachiningWorkReportModal
            isOpen={isReportModalOpen}
            onClose={() => {
              setIsReportModalOpen(false);
              setEditReportData(null);
            }}
            initialProject={reportModalProject}
            initialWorker={initialWorkerName}
            editReport={editReportData}
          />
        </Suspense>
      )}

      {/* Digital Inspection / TPM Modal */}
      {isInspectionModalOpen && (
        <DigitalInspectionModal
          isOpen={isInspectionModalOpen}
          onClose={() => setIsInspectionModalOpen(false)}
          initialPlant="삼랑진공장"
          initialWorker={currentProfile?.name || "가공작업자"}
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          imageUrl={previewImage.url}
          title={previewImage.name}
        />
      )}
    </div>
  );
};

export default MachiningWorkerDashboardView;
