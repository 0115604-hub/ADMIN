import React from "react";
import {
  CalendarDays,
  MessageCircle,
  X,
  Plus,
  CheckCircle2
} from "lucide-react";

export const CommonScheduleBar = ({
  isAdmin,
  hasNewScheduleMessage,
  allActiveCommonSchedules = [],
  setSelectedCommonScheduleForComments,
  todayDateStr,
  isGeneralManager,
  handleDeleteCommonSchedule,
  setCommonScheduleModalOpen
}) => {
  if (!isAdmin) return null;

  return (
    <div
      className={`rounded-xl px-3 sm:px-3.5 py-2 border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 min-w-0 max-w-full transition-all ${
        hasNewScheduleMessage
          ? "bg-gradient-to-r from-indigo-50/95 via-purple-50/90 to-indigo-50/95 dark:from-indigo-950/85 dark:via-purple-950/70 dark:to-indigo-950/85 border-2 border-indigo-400 dark:border-indigo-500 ring-4 ring-indigo-400/40 shadow-xl shadow-indigo-500/25 animate-pulse"
          : "bg-white dark:bg-slate-900 border-indigo-500/40 dark:border-indigo-600/40"
      }`}
    >
      {/* Mobile Top Header / Desktop Left Section */}
      <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0 sm:flex-1 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`p-1 rounded-lg text-white shadow-xs shrink-0 ${
              hasNewScheduleMessage
                ? "bg-gradient-to-br from-rose-500 to-indigo-600 animate-bounce"
                : "bg-indigo-600"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
          </div>
          <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white shrink-0">
            공통일정
          </span>
          {hasNewScheduleMessage && (
            <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 animate-pulse flex items-center gap-1 shadow-2xs shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>새 메시지(점멸)</span>
            </span>
          )}
        </div>

        {/* Desktop Only: Inline Chips */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1 pl-2 border-l border-slate-200 dark:border-slate-800">
          {allActiveCommonSchedules.length > 0 ? (
            allActiveCommonSchedules.map((item) => {
              const commentCount = item.comments?.length || 0;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCommonScheduleForComments(item)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs shadow-2xs shrink-0 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all group ${
                    item.hasNewMessage
                      ? "bg-indigo-100/90 dark:bg-indigo-900/80 border-indigo-400 dark:border-indigo-500 ring-2 ring-purple-400/80 animate-pulse"
                      : "bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border-indigo-300 dark:border-indigo-700/80"
                  }`}
                  title="탭하여 일정 상세 보기 및 실시간 의견 작성하기"
                >
                  {(() => {
                    const start = item.startDate || item.date;
                    const end = item.endDate || item.startDate || item.date;
                    const hasRange = start && end && start !== end;
                    if (hasRange) {
                      return (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300">
                          {start.slice(5)}~{end.slice(5)}
                        </span>
                      );
                    }
                    if (start) {
                      return (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            start === todayDateStr
                              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {start === todayDateStr ? "오늘" : start.slice(5)}
                        </span>
                      );
                    }
                    return null;
                  })()}
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                      item.target === "세미나"
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                        : item.target === "교육"
                        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                        : item.target === "여행"
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                        : item.target === "맛집"
                        ? "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                        : item.target === "기타"
                        ? "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-700"
                        : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {item.target || "기타"}
                  </span>
                  {item.time && item.time !== "종일" && (
                    <span className="font-mono text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400">
                      [{item.time}]
                    </span>
                  )}
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate max-w-[130px] sm:max-w-[220px] group-hover:underline">
                    {item.title}
                  </span>

                  {/* Opinion / Comment Badge */}
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold flex items-center gap-0.5 border shadow-2xs ${
                      commentCount > 0
                        ? "bg-purple-600 text-white border-purple-500 animate-pulse"
                        : item.isRecent
                        ? "bg-rose-600 text-white border-rose-500 animate-pulse"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    {commentCount > 0 ? (
                      <>
                        <MessageCircle className="w-2.5 h-2.5" />
                        <span>의견 {commentCount}</span>
                      </>
                    ) : item.isRecent ? (
                      <span>⚡ NEW</span>
                    ) : (
                      <span>의견</span>
                    )}
                  </span>

                  {(isAdmin || isGeneralManager) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCommonSchedule(item.id);
                      }}
                      className="ml-0.5 p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                      title="일정 삭제"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-slate-500" />
              <span>등록된 공통일정 없음</span>
            </span>
          )}
        </div>

        {/* Mobile Top Right: '+ 일정 등록' button */}
        <div className="flex sm:hidden items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setCommonScheduleModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="공통 일정 등록 및 관리"
          >
            <Plus className="w-3 h-3" />
            <span>+ 일정 등록</span>
          </button>
        </div>
      </div>

      {/* Mobile Only Bottom Row: Full-width horizontal scrolling chips */}
      <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full min-w-0">
        {allActiveCommonSchedules.length > 0 ? (
          allActiveCommonSchedules.map((item) => {
            const commentCount = item.comments?.length || 0;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedCommonScheduleForComments(item)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] shadow-2xs shrink-0 cursor-pointer active:scale-95 transition-all group ${
                  item.hasNewMessage
                    ? "bg-indigo-100/90 dark:bg-indigo-900/80 border-indigo-400 dark:border-indigo-500 ring-2 ring-purple-400/80 animate-pulse"
                    : "bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 border-indigo-300 dark:border-indigo-700/80"
                }`}
                title="탭하여 일정 상세 보기 및 실시간 의견 작성하기"
              >
                {(() => {
                  const start = item.startDate || item.date;
                  const end = item.endDate || item.startDate || item.date;
                  const hasRange = start && end && start !== end;
                  if (hasRange) {
                    return (
                      <span className="px-1 py-0.2 rounded text-[9.5px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300">
                        {start.slice(5)}~{end.slice(5)}
                      </span>
                    );
                  }
                  if (start) {
                    return (
                      <span
                        className={`px-1 py-0.2 rounded text-[9.5px] font-bold ${
                          start === todayDateStr
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {start === todayDateStr ? "오늘" : start.slice(5)}
                      </span>
                    );
                  }
                  return null;
                })()}
                <span
                  className={`px-1 py-0.2 rounded text-[9.5px] font-black ${
                    item.target === "세미나"
                      ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                      : item.target === "교육"
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                      : item.target === "여행"
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                      : item.target === "맛집"
                      ? "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                      : item.target === "기타"
                      ? "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-700"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {item.target || "기타"}
                </span>
                {item.time && item.time !== "종일" && (
                  <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    [{item.time}]
                  </span>
                )}
                <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] truncate max-w-[120px]">
                  {item.title}
                </span>

                {/* Opinion / Comment Badge */}
                <span
                  className={`px-1 py-0.2 rounded-full text-[9px] font-extrabold flex items-center gap-0.5 border shadow-2xs ${
                    commentCount > 0
                      ? "bg-purple-600 text-white border-purple-500 animate-pulse"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <MessageCircle className="w-2.5 h-2.5" />
                  <span>{commentCount > 0 ? `${commentCount}` : "0"}</span>
                </span>

                {(isAdmin || isGeneralManager) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCommonSchedule(item.id);
                    }}
                    className="p-0.5 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="일정 삭제"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-slate-500" />
            <span>등록된 공통일정 없음</span>
          </span>
        )}
      </div>

      {/* Desktop Right Side: '+ 일정 등록' button */}
      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setCommonScheduleModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
          title="공통 일정 등록 및 관리"
        >
          <Plus className="w-3 h-3" />
          <span>+ 일정 등록</span>
        </button>
      </div>
    </div>
  );
};
