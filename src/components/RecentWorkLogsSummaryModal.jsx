import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Factory,
  User,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowRight,
  FileText,
  Copy,
  Printer,
  Wrench,
  Sparkles,
  Camera,
  ExternalLink,
  ShieldCheck,
  CheckCheck
} from "lucide-react";
import { formatYYYYMMDDWithWeekday, formatMMDDWithWeekday, getKSTDateString } from "../utils/dateUtils";
import { pushModalHistory, subscribeCloseAllModals } from "../utils/modalHistory";

// Standard Workers list for un-registration check (Excludes general managers: 이명재, 김동욱)
const TARGET_WORKERS = {
  "삼랑진공장": ["설유철", "윤경수", "이창엽", "전재율", "양인나", "유동길", "조인주", "이상기"],
  "한림공장": ["우창용", "오상민"]
};

export const RecentWorkLogsSummaryModal = ({
  isOpen,
  onClose,
  workLogs = [],
  onOpenIndividualLog = null,
  onNavigateTab = null
}) => {
  useEffect(() => {
    if (isOpen) {
      pushModalHistory("recent_work_logs_summary_modal");
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = subscribeCloseAllModals(() => {
      if (isOpen && onClose) onClose();
    });
    return () => unsub();
  }, [isOpen, onClose]);

  // Extract all distinct dates in descending order
  const availableDates = useMemo(() => {
    const dateSet = new Set();
    workLogs.forEach((l) => {
      if (l.date && !l.isDeleted) {
        dateSet.add(l.date);
      }
    });
    const today = getKSTDateString();
    dateSet.add(today);

    return Array.from(dateSet).sort((a, b) => b.localeCompare(a));
  }, [workLogs]);

  // Most recent date by default
  const [selectedDate, setSelectedDate] = useState(() => {
    return availableDates[0] || getKSTDateString();
  });

  // Keep selected date updated when availableDates change
  useEffect(() => {
    if (availableDates.length > 0 && (!selectedDate || !availableDates.includes(selectedDate))) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates]);

  const [plantFilter, setPlantFilter] = useState("all"); // 'all' | '삼랑진공장' | '한림공장' | 'pending'
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'
  const [copiedToast, setCopiedToast] = useState(false);

  // Filter logs for the selected date
  const dateLogs = useMemo(() => {
    return workLogs.filter((l) => !l.isDeleted && l.date === selectedDate);
  }, [workLogs, selectedDate]);

  // Filtered by plant or status
  const filteredLogs = useMemo(() => {
    if (plantFilter === "pending") {
      return dateLogs.filter((l) => l.approvalStatus !== "결재완료" && l.approvalStatus !== "반려");
    }
    if (plantFilter === "삼랑진공장") {
      return dateLogs.filter((l) => l.plant === "삼랑진공장");
    }
    if (plantFilter === "한림공장") {
      return dateLogs.filter((l) => l.plant === "한림공장");
    }
    return dateLogs;
  }, [dateLogs, plantFilter]);

  // Stats for the selected date
  const samLogs = dateLogs.filter((l) => l.plant === "삼랑진공장");
  const hanLogs = dateLogs.filter((l) => l.plant === "한림공장");
  const approvedCount = dateLogs.filter((l) => l.approvalStatus === "결재완료").length;
  const pendingCount = dateLogs.filter((l) => l.approvalStatus !== "결재완료" && l.approvalStatus !== "반려").length;

  // Registered writers
  const registeredWriters = new Set(dateLogs.map((l) => (l.writer || "").trim()).filter(Boolean));
  const samUnregistered = TARGET_WORKERS["삼랑진공장"].filter((name) => !registeredWriters.has(name));
  const hanUnregistered = TARGET_WORKERS["한림공장"].filter((name) => !registeredWriters.has(name));
  const totalUnregistered = samUnregistered.length + hanUnregistered.length;

  // Date navigation handlers
  const currentIndex = availableDates.indexOf(selectedDate);
  const handlePrevDate = () => {
    if (currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    }
  };
  const handleNextDate = () => {
    if (currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    }
  };

  // Copy full summary to clipboard
  const handleCopySummary = () => {
    const lines = [];
    lines.push(`📋 [오륙 생산관리] ${formatYYYYMMDDWithWeekday(selectedDate)} 전작업자 일일업무일지 종합 요약`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`👥 등록 현황: 총 ${dateLogs.length}명 (삼랑진 ${samLogs.length}명, 한림 ${hanLogs.length}명 / 결재완료 ${approvedCount}건, 대기 ${pendingCount}건)`);
    if (totalUnregistered > 0) {
      lines.push(`⚠️ 미등록 작업자 (${totalUnregistered}명): ${[...samUnregistered, ...hanUnregistered].join(", ")}`);
    }
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    lines.push(`[1] 삼랑진공장 (${samLogs.length}명)`);
    if (samLogs.length === 0) {
      lines.push(` • 등록된 업무일지가 없습니다.`);
    } else {
      samLogs.forEach((l) => {
        lines.push(`▶ ${l.writer} ${l.title || "선임"} (${l.process || "생산"}/${l.line || "라인"}, ${l.shift || "주간"}) [${l.approvalStatus || "대기"}]`);
        lines.push(` - 업무내용: ${l.workContent || "내용 없음"}`);
        if (l.issues && !l.issues.includes("특이사항 없음")) {
          lines.push(` - 특이사항: ${l.issues}`);
        }
      });
    }

    lines.push(`\n[2] 한림공장 (${hanLogs.length}명)`);
    if (hanLogs.length === 0) {
      lines.push(` • 등록된 업무일지가 없습니다.`);
    } else {
      hanLogs.forEach((l) => {
        lines.push(`▶ ${l.writer} ${l.title || "선임"} (${l.process || "생산"}/${l.line || "라인"}, ${l.shift || "주간"}) [${l.approvalStatus || "대기"}]`);
        lines.push(` - 업무내용: ${l.workContent || "내용 없음"}`);
        if (l.issues && !l.issues.includes("특이사항 없음")) {
          lines.push(` - 특이사항: ${l.issues}`);
        }
      });
    }

    lines.push(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`📌 오륙 생산관리시스템: https://profit-and-loss-7d09b.web.app`);

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 shrink-0">
              <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-lg text-white tracking-tight truncate">
                  전작업자 일일 업무일지 종합 요약
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-[10px]">
                  최근일 실시간 연동
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-indigo-200/80 font-medium truncate mt-0.5">
                📅 <strong>{formatYYYYMMDDWithWeekday(selectedDate)}</strong> 기준 (전사 {dateLogs.length}명 등록완료)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {/* Quick Date Navigator */}
            <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10 text-xs">
              <button
                type="button"
                onClick={handlePrevDate}
                disabled={currentIndex >= availableDates.length - 1}
                className="p-1.5 hover:bg-white/20 disabled:opacity-30 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="이전 근무일 보기"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-bold text-xs whitespace-nowrap">
                {selectedDate.slice(5)}
              </span>
              <button
                type="button"
                onClick={handleNextDate}
                disabled={currentIndex <= 0}
                className="p-1.5 hover:bg-white/20 disabled:opacity-30 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                title="다음 근무일 보기"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Date Pills Carousel & Top Metric Chips */}
        <div className="px-3 sm:px-5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
          {/* Recent Dates Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 mr-1">
              일자 선택:
            </span>
            {availableDates.slice(0, 6).map((d, idx) => {
              const isSelected = d === selectedDate;
              const isLatest = idx === 0;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDate(d)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{formatMMDDWithWeekday(d)}</span>
                  {isLatest && (
                    <span className={`text-[9px] px-1 rounded-full font-black ${
                      isSelected ? "bg-white text-indigo-700" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    }`}>
                      최근
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* KPI Stat Chips */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span>총 <strong>{dateLogs.length}명</strong> 등록</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-200 shadow-2xs">
              <span>삼랑진: <strong>{samLogs.length}명</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 shadow-2xs">
              <span>한림: <strong>{hanLogs.length}명</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-800 dark:text-purple-200 shadow-2xs">
              <span>결재완료: <strong>{approvedCount}</strong> / 대기: <strong>{pendingCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Filter Tabs & View Modes */}
        <div className="px-3 sm:px-5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setPlantFilter("all")}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                plantFilter === "all"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              전체 ({dateLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setPlantFilter("삼랑진공장")}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                plantFilter === "삼랑진공장"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-amber-700 dark:text-amber-400 hover:text-amber-900"
              }`}
            >
              삼랑진 ({samLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setPlantFilter("한림공장")}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                plantFilter === "한림공장"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-700 dark:text-emerald-400 hover:text-emerald-900"
              }`}
            >
              한림 ({hanLogs.length})
            </button>
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={() => setPlantFilter("pending")}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  plantFilter === "pending"
                    ? "bg-rose-500 text-white shadow-xs"
                    : "text-rose-600 dark:text-rose-400 hover:text-rose-800"
                }`}
              >
                ⏳ 결재대기 ({pendingCount})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              title="전체 요약 클립보드 복사"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-500" />
              <span>{copiedToast ? "복사완료!" : "요약복사"}</span>
            </button>
          </div>
        </div>

        {/* Unregistered Alert Banner */}
        {totalUnregistered > 0 && (
          <div className="mx-3 sm:mx-5 mt-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="text-amber-900 dark:text-amber-200 text-[11px] truncate">
                <strong>일지 미등록 작업자 ({totalUnregistered}명):</strong>{" "}
                {samUnregistered.length > 0 && `[삼랑진] ${samUnregistered.join(", ")} `}
                {hanUnregistered.length > 0 && `[한림] ${hanUnregistered.join(", ")}`}
              </div>
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold shrink-0">
              ※ 이명재/김동욱 제외
            </span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 min-h-0">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <ClipboardList className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 opacity-60" />
              <div className="font-bold text-sm">해당 조건에 등록된 일일업무일지가 없습니다.</div>
              <p className="text-xs text-slate-400">다른 일자를 선택하거나 작업자의 일지 등록을 기다려주세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {filteredLogs.map((log) => {
                const isHallim = log.plant === "한림공장";
                const isApproved = log.approvalStatus === "결재완료";
                const hasIssues = log.issues && !log.issues.includes("특이사항 없음") && !log.issues.includes("정상");
                const hasImages = Array.isArray(log.images) && log.images.length > 0;
                const hasMaintenance = Array.isArray(log.maintenanceItems) && log.maintenanceItems.length > 0;

                return (
                  <div
                    key={log.id}
                    onClick={() => onOpenIndividualLog && onOpenIndividualLog(log)}
                    className={`p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md ${
                      onOpenIndividualLog ? "cursor-pointer" : ""
                    } ${
                      isHallim
                        ? "bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-400"
                        : "bg-amber-50/20 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/60 hover:border-amber-400"
                    }`}
                  >
                    {/* Worker Top Info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-2xl text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0 ${
                            isHallim ? "bg-emerald-600" : "bg-amber-500"
                          }`}
                        >
                          {log.writer ? log.writer[0] : "작"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {log.writer} {log.title || "선임"}
                            </h4>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                isHallim
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                              }`}
                            >
                              {log.plant?.replace("공장", "") || "삼랑진"}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {log.shift || "주간"}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                            {log.process || "생산"} • {log.line || "생산라인"}
                          </p>
                        </div>
                      </div>

                      {/* Approval Status Badge */}
                      <div className="shrink-0 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black shadow-2xs ${
                            isApproved
                              ? "bg-emerald-500 text-white"
                              : "bg-amber-400 text-slate-950 animate-pulse"
                          }`}
                        >
                          {isApproved ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>결재완료</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>결재대기</span>
                            </>
                          )}
                        </span>
                        {log.approverName && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            승인: {log.approverName}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Main Work Content (작업 내용) */}
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
                      <div className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-indigo-500" />
                        <span>주요 작업 내용:</span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line">
                        {log.workContent || "작업 내용이 입력되지 않았습니다."}
                      </p>

                      {/* Jaeyul Equipment Maintenance Items */}
                      {hasMaintenance && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1">
                          <div className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            <span>설비보전 작업 ({log.maintenanceItems.length}건):</span>
                          </div>
                          <div className="space-y-1 pl-2 text-[11px] text-slate-700 dark:text-slate-300">
                            {log.maintenanceItems.map((m, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <span className="font-bold text-indigo-600">• [{m.category || m.equipment || "설비"}]</span>
                                <span className="truncate">{m.content || m.action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attached Photos Preview */}
                      {hasImages && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2 overflow-x-auto">
                          <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                            <Camera className="w-3 h-3 text-blue-500" />
                            <span>사진 {log.images.length}장:</span>
                          </span>
                          {log.images.slice(0, 3).map((img, i) => (
                            <img
                              key={i}
                              src={img.dataUrl || img.url || img}
                              alt={`첨부_${i}`}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Issues / Special Notes (특이사항) */}
                    <div
                      className={`p-2 rounded-xl text-[11px] flex items-start gap-1.5 ${
                        hasIssues
                          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900/60"
                          : "bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {hasIssues ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <strong className="font-bold">특이사항: </strong>
                        <span className="truncate">{log.issues || "특이사항 없음 (정상 가동)"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
            💡 항목을 클릭하면 세부 전자결재 및 검토 화면이 열립니다.
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab("electronic_approval");
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <span>전자결재 화면 이동</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-black text-xs transition-colors shadow-xs cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentWorkLogsSummaryModal;
