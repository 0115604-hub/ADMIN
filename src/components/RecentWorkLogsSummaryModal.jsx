import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Copy,
  Wrench,
  Camera,
  ArrowRight
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

  // 🌟 Extract ONLY dates that actually have registered workers/logs
  const availableDates = useMemo(() => {
    const dateSet = new Set();
    workLogs.forEach((l) => {
      if (l.date && !l.isDeleted) {
        dateSet.add(l.date);
      }
    });

    const sorted = Array.from(dateSet).sort((a, b) => b.localeCompare(a));
    if (sorted.length === 0) {
      return [getKSTDateString()];
    }
    return sorted;
  }, [workLogs]);

  // Default to the most recent date with actual work logs
  const [selectedDate, setSelectedDate] = useState(() => {
    return availableDates[0] || getKSTDateString();
  });

  // Keep selected date updated to latest available date
  useEffect(() => {
    if (availableDates.length > 0 && (!selectedDate || !availableDates.includes(selectedDate))) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates]);

  const [copiedToast, setCopiedToast] = useState(false);

  // Filter logs for the selected date
  const dateLogs = useMemo(() => {
    return workLogs.filter((l) => !l.isDeleted && l.date === selectedDate);
  }, [workLogs, selectedDate]);

  // Group by plant
  const samLogs = useMemo(() => dateLogs.filter((l) => {
    const plant = l.plant || l.approverPlant || (["김동욱", "우창용", "오상민", "부림텍", "한울"].includes(l.writer) ? "한림공장" : "삼랑진공장");
    return plant === "삼랑진공장";
  }), [dateLogs]);

  const hanLogs = useMemo(() => dateLogs.filter((l) => {
    const plant = l.plant || l.approverPlant || (["김동욱", "우창용", "오상민", "부림텍", "한울"].includes(l.writer) ? "한림공장" : "삼랑진공장");
    return plant === "한림공장";
  }), [dateLogs]);

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

  // Copy summary text to clipboard
  const handleCopySummary = () => {
    const lines = [];
    lines.push(`📋 [오륙 생산관리] ${formatYYYYMMDDWithWeekday(selectedDate)} 전작업자 일일업무일지 종합 요약`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    lines.push(`[1] 삼랑진공장 (${samLogs.length}명)`);
    if (samLogs.length === 0) {
      lines.push(` • 등록된 업무일지가 없습니다.`);
    } else {
      samLogs.forEach((l) => {
        lines.push(`▶ ${l.writer} ${l.title || "선임"} (${l.process || "생산"} • ${l.line || "라인"}, ${l.shift || "주간"}) [${l.approvalStatus || "대기"}]`);
        lines.push(` - 업무내용: ${l.workContent || "내용 없음"}`);
        if (l.issues && !l.issues.includes("특이사항 없음") && !l.issues.includes("정상")) {
          lines.push(` - 특이사항: ${l.issues}`);
        }
      });
    }

    lines.push(`\n[2] 한림공장 (${hanLogs.length}명)`);
    if (hanLogs.length === 0) {
      lines.push(` • 등록된 업무일지가 없습니다.`);
    } else {
      hanLogs.forEach((l) => {
        lines.push(`▶ ${l.writer} ${l.title || "선임"} (${l.process || "생산"} • ${l.line || "라인"}, ${l.shift || "주간"}) [${l.approvalStatus || "대기"}]`);
        lines.push(` - 업무내용: ${l.workContent || "내용 없음"}`);
        if (l.issues && !l.issues.includes("특이사항 없음") && !l.issues.includes("정상")) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Simple & Clean */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-xl bg-blue-600 text-white shrink-0">
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-white tracking-tight truncate">
                전작업자 일일 업무일지 요약
              </h3>
              <p className="text-[11px] text-slate-300 font-medium truncate">
                {formatYYYYMMDDWithWeekday(selectedDate)} ({dateLogs.length}명 등록)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              title="클립보드 복사"
            >
              <Copy className="w-3.5 h-3.5 text-blue-400" />
              <span>{copiedToast ? "복사됨!" : "복사"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* 🌟 ONLY Date Selection Badges (일자 선택 뱃지만 유지) */}
        <div className="px-3 sm:px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 mr-1">
              일자 선택:
            </span>
            {availableDates.slice(0, 7).map((d, idx) => {
              const isSelected = d === selectedDate;
              const isLatest = idx === 0;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDate(d)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs font-black"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{formatMMDDWithWeekday(d)}</span>
                  {isLatest && (
                    <span className={`text-[9px] px-1 rounded-full font-black ${
                      isSelected ? "bg-white text-blue-700" : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    }`}>
                      최근
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs shrink-0">
            <button
              type="button"
              onClick={handlePrevDate}
              disabled={currentIndex >= availableDates.length - 1}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 rounded transition-colors cursor-pointer"
              title="이전 일자"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              type="button"
              onClick={handleNextDate}
              disabled={currentIndex <= 0}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 rounded transition-colors cursor-pointer"
              title="다음 일자"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>

        {/* Minimal Work Logs Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 min-h-0">
          {dateLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-1">
              <ClipboardList className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 opacity-60" />
              <div className="font-bold text-xs">해당 일자에 등록된 업무일지가 없습니다.</div>
            </div>
          ) : (
            <>
              {/* 1. 삼랑진공장 */}
              {samLogs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-700">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <h4 className="font-black text-xs text-slate-900 dark:text-white">
                      삼랑진공장 ({samLogs.length}명)
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {samLogs.map((log) => {
                      const isApproved = log.approvalStatus === "결재완료";
                      const hasIssues = log.issues && !log.issues.includes("특이사항 없음") && !log.issues.includes("정상");
                      const hasImages = Array.isArray(log.images) && log.images.length > 0;
                      const hasMaintenance = Array.isArray(log.maintenanceItems) && log.maintenanceItems.length > 0;

                      return (
                        <div
                          key={log.id}
                          onClick={() => onOpenIndividualLog && onOpenIndividualLog(log)}
                          className={`p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-blue-400 transition-all text-xs space-y-1.5 ${
                            onOpenIndividualLog ? "cursor-pointer" : ""
                          }`}
                        >
                          {/* Top Row: Worker Name, Process, Status */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-black text-slate-900 dark:text-white text-xs">
                                {log.writer} {log.title || "선임"}
                              </span>
                              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                [{log.process || "생산"} • {log.line || "라인"}]
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                ({log.shift || "주간"})
                              </span>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
                                isApproved
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {isApproved ? `✓ 승인 (${log.approverName || "완료"})` : "⏳ 결재대기"}
                            </span>
                          </div>

                          {/* Work Content */}
                          <p className="text-slate-700 dark:text-slate-300 text-[11.5px] leading-relaxed whitespace-pre-line font-medium pl-1 border-l-2 border-slate-200 dark:border-slate-700">
                            {log.workContent || "작업 내용 없음"}
                          </p>

                          {/* Maintenance items if any */}
                          {hasMaintenance && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 pl-2 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
                              <div className="font-bold text-indigo-600 flex items-center gap-1">
                                <Wrench className="w-3 h-3" />
                                <span>설비보전:</span>
                              </div>
                              {log.maintenanceItems.map((m, idx) => (
                                <div key={idx} className="truncate">
                                  • [{m.category || m.equipment || "설비"}] {m.content || m.action}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Issues if any */}
                          {hasIssues && (
                            <div className="text-[11px] text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-lg">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span className="truncate">이슈: {log.issues}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. 한림공장 */}
              {hanLogs.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <h4 className="font-black text-xs text-slate-900 dark:text-white">
                      한림공장 ({hanLogs.length}명)
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {hanLogs.map((log) => {
                      const isApproved = log.approvalStatus === "결재완료";
                      const hasIssues = log.issues && !log.issues.includes("특이사항 없음") && !log.issues.includes("정상");

                      return (
                        <div
                          key={log.id}
                          onClick={() => onOpenIndividualLog && onOpenIndividualLog(log)}
                          className={`p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-emerald-400 transition-all text-xs space-y-1.5 ${
                            onOpenIndividualLog ? "cursor-pointer" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-black text-slate-900 dark:text-white text-xs">
                                {log.writer} {log.title || "선임"}
                              </span>
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                [{log.process || "생산"} • {log.line || "라인"}]
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                ({log.shift || "주간"})
                              </span>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
                                isApproved
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {isApproved ? `✓ 승인 (${log.approverName || "완료"})` : "⏳ 결재대기"}
                            </span>
                          </div>

                          <p className="text-slate-700 dark:text-slate-300 text-[11.5px] leading-relaxed whitespace-pre-line font-medium pl-1 border-l-2 border-slate-200 dark:border-slate-700">
                            {log.workContent || "작업 내용 없음"}
                          </p>

                          {hasIssues && (
                            <div className="text-[11px] text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-lg">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span className="truncate">이슈: {log.issues}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            💡 항목을 클릭하면 세부 전자결재 및 검토 화면이 열립니다.
          </div>

          <div className="flex items-center gap-2">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab("electronic_approval");
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all cursor-pointer"
              >
                <span>전자결재 바로가기</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-black text-xs transition-colors cursor-pointer"
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
