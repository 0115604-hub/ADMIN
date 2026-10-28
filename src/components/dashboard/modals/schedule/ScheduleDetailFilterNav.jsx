import React from "react";
import {
  Calendar,
  Activity,
  CheckCircle2,
  CalendarDays,
  MessageCircle
} from "lucide-react";

/**
 * ScheduleDetailFilterNav
 * 5-tab filter navigation bar for ScheduleDetailModal
 */
export default function ScheduleDetailFilterNav({
  filterTab,
  onSelectTab,
  isRecipientModal,
  targetDate,
  dayCount = 0,
  weekCount = 0,
  activeCount = 0,
  completedCount = 0,
  sharedCount = 0
}) {
  const isDaySelected = filterTab === "day";
  const isWeekSelected = filterTab === "week";
  const isActiveSelected = filterTab === "active";
  const isCompletedSelected = filterTab === "completed";
  const isSharedSelected = filterTab === "shared" || filterTab === "all";

  return (
    <div className="flex items-center gap-1.5 p-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-bold overflow-x-auto no-scrollbar">
      <button
        type="button"
        onClick={() => onSelectTab("day")}
        className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
          isDaySelected
            ? isRecipientModal
              ? "bg-purple-600 text-white font-black shadow-xs"
              : "bg-blue-600 text-white font-black shadow-xs"
            : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
        }`}
      >
        <CalendarDays className="w-3.5 h-3.5" />
        <span>선택 일자 ({targetDate.slice(5)}) ({dayCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab("week")}
        className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
          isWeekSelected
            ? isRecipientModal
              ? "bg-purple-600 text-white font-black shadow-xs"
              : "bg-blue-600 text-white font-black shadow-xs"
            : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
        }`}
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>이번 주간 ({weekCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab("active")}
        className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
          isActiveSelected
            ? "bg-blue-600 text-white font-black shadow-xs"
            : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
        }`}
      >
        <Activity className="w-3.5 h-3.5" />
        <span>진행중 ({activeCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab("completed")}
        className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
          isCompletedSelected
            ? "bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-400/50"
            : "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
        }`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>완료 / 마무리 ({completedCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab("shared")}
        className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
          isSharedSelected
            ? "bg-purple-600 text-white font-black shadow-xs ring-1 ring-purple-400/50"
            : "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-purple-200 dark:border-purple-800"
        }`}
      >
        <MessageCircle className="w-3.5 h-3.5" />
        <span>공유답장 ({sharedCount})</span>
      </button>
    </div>
  );
}
