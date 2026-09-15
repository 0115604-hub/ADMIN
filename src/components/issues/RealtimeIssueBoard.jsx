import React from "react";
import {
  Pin,
  ListOrdered,
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  CheckCircle2,
  MessageSquare
} from "lucide-react";

const formatMonthDayWithDayOfWeek = (dateStr) => {
  if (!dateStr) return "";
  try {
    const parts = dateStr.slice(0, 10).split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month - 1, day);
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      const dayName = dayNames[d.getDay()];
      const mStr = String(month).padStart(2, "0");
      const dStr = String(day).padStart(2, "0");
      return `${mStr}/${dStr}(${dayName})`;
    }
  } catch (e) {
    // fallback
  }
  return dateStr.slice(5);
};

const getIssueOpinionCount = (item) => {
  if (!item) return 0;
  const replyCount = Array.isArray(item.replies) ? item.replies.length : 0;
  const hasAction = typeof item.actionResult === "string" && item.actionResult.trim().length > 0;
  if (replyCount > 0) return replyCount;
  return hasAction ? 1 : 0;
};

export const RealtimeIssueBoard = ({
  activeIssues,
  displayedActiveIssues,
  qualityAlertCount,
  meetingIssuesCount,
  qualityIssueCount,
  noticeIssuesCount,
  openIssueCategoryFilter,
  setOpenIssueCategoryFilter,
  isIssueExpanded,
  setIsIssueExpanded,
  onOpenListModal,
  onOpenNewIssue,
  onOpenDeleteModal,
  onSelectCardCategory
}) => {
  return (
    <div className="mb-3.5 sm:mb-5 rounded-2xl border-2 border-rose-300/80 dark:border-rose-900/80 bg-rose-50/40 dark:bg-rose-950/20 shadow-md overflow-hidden transition-all min-w-0">
      {/* Panel Top Bar: Metrics & Actions */}
      <div className="p-2 sm:p-2.5 px-2.5 sm:px-3 flex items-center justify-between gap-2 border-b-2 border-rose-200/80 dark:border-rose-900/60 bg-gradient-to-r from-rose-100/80 via-purple-50/60 to-emerald-50/60 dark:from-rose-950/70 dark:via-purple-950/50 dark:to-emerald-950/50">
        {/* Left: Title & Icon */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-2xs shrink-0">
            <Pin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <h3 className="font-black text-xs sm:text-sm md:text-base text-slate-900 dark:text-white tracking-tight truncate">
            실시간 공지 & 오픈이슈 현황
          </h3>
        </div>

        {/* Right: [목록] [등록] & Fold/Unfold */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          <button
            type="button"
            onClick={onOpenListModal}
            className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10.5px] sm:text-xs font-black bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-rose-200 dark:border-rose-900/60 shadow-2xs flex items-center gap-0.5 sm:gap-1 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer active:scale-95"
            title="오픈이슈 목록 전체 보기"
          >
            <ListOrdered className="w-3 h-3 text-slate-600 dark:text-slate-300" />
            <span>목록</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const targetCategory =
                openIssueCategoryFilter === "meeting"
                  ? "회의일정"
                  : openIssueCategoryFilter === "notice"
                  ? "공지사항"
                  : openIssueCategoryFilter === "quality_alert"
                  ? "품질경보"
                  : "오픈이슈";

              onOpenNewIssue(targetCategory);
            }}
            className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-md"
            title="신규 오픈이슈/공지/회의/품질경보 등록"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>등록</span>
          </button>

          {/* Fold/Unfold Button */}
          {activeIssues.length > 0 && (
            <button
              type="button"
              onClick={() => setIsIssueExpanded((prev) => !prev)}
              className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
              title={isIssueExpanded ? "패널 접기" : "패널 펼치기"}
            >
              {isIssueExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills (순서: 품질경보 -> 회의일정 -> 오픈이슈 -> 사내공지) */}
      {isIssueExpanded && activeIssues.length > 0 && (
        <div className="px-3 sm:px-4 py-2 flex items-center gap-1.5 overflow-x-auto border-b border-rose-100 dark:border-rose-900/30 text-[11px] scrollbar-none">
          {/* 1) 품질경보 */}
          <button
            type="button"
            onClick={() => setOpenIssueCategoryFilter((prev) => (prev === "quality_alert" ? "all" : "quality_alert"))}
            className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
              openIssueCategoryFilter === "quality_alert"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>🚨 품질경보 ({qualityAlertCount})</span>
          </button>

          {/* 2) 회의일정 */}
          <button
            type="button"
            onClick={() => setOpenIssueCategoryFilter((prev) => (prev === "meeting" ? "all" : "meeting"))}
            className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
              openIssueCategoryFilter === "meeting"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>📅 회의일정 ({meetingIssuesCount})</span>
          </button>

          {/* 3) 오픈이슈 */}
          <button
            type="button"
            onClick={() => setOpenIssueCategoryFilter((prev) => (prev === "open_issue" || prev === "quality_issue" || prev === "quality" ? "all" : "open_issue"))}
            className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
              openIssueCategoryFilter === "open_issue" || openIssueCategoryFilter === "quality_issue" || openIssueCategoryFilter === "quality"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>📌 오픈이슈 ({qualityIssueCount})</span>
          </button>

          {/* 4) 사내공지 */}
          <button
            type="button"
            onClick={() => setOpenIssueCategoryFilter((prev) => (prev === "notice" ? "all" : "notice"))}
            className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
              openIssueCategoryFilter === "notice"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>📢 사내공지 ({noticeIssuesCount})</span>
          </button>

          {/* 5) 전체보기 해제 버튼 (필터 선택 시 노출) */}
          {openIssueCategoryFilter !== "all" && (
            <button
              type="button"
              onClick={() => setOpenIssueCategoryFilter("all")}
              className="px-2 py-1 rounded-lg font-bold text-[10.5px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all cursor-pointer shrink-0 ml-auto flex items-center gap-1"
            >
              <span>✕ 전체보기 ({activeIssues.length})</span>
            </button>
          )}
        </div>
      )}

      {/* Empty State when no active issues overall */}
      {activeIssues.length === 0 && (
        <div className="p-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-slate-900/40">
          ✨ 현재 미결된 오픈이슈 및 공지사항이 없습니다. (상단 [목록] 버튼으로 전체 이력 조회 가능)
        </div>
      )}

      {/* Empty State when selected category filter has 0 items */}
      {isIssueExpanded && activeIssues.length > 0 && displayedActiveIssues.length === 0 && (
        <div className="p-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-slate-900/40">
          {openIssueCategoryFilter === "open_issue" || openIssueCategoryFilter === "quality_issue" || openIssueCategoryFilter === "quality"
            ? "✨ 현재 진행중인 오픈이슈가 없습니다."
            : openIssueCategoryFilter === "quality_alert"
            ? "✨ 현재 진행중인 품질경보가 없습니다."
            : openIssueCategoryFilter === "meeting"
            ? "✨ 현재 예정된 회의일정이 없습니다."
            : openIssueCategoryFilter === "notice"
            ? "✨ 현재 게시중인 사내공지가 없습니다."
            : "✨ 현재 표시할 항목이 없습니다."}
        </div>
      )}

      {/* Issue Cards List */}
      {isIssueExpanded && displayedActiveIssues.length > 0 && (
        <div className="p-2 sm:p-3 space-y-2">
          {displayedActiveIssues.map((item) => {
            const isMeeting = item.category === "회의일정";
            const isNotice = item.category === "공지사항" || item.category === "사내공지" || item.category === "공유사항";
            const isOpenIssue = item.category === "오픈이슈" || item.category === "품질이슈";
            const isQualityAlert = item.category === "품질경보";

            const actionContent =
              (typeof item.actionResult === "string" && item.actionResult.trim().length > 0)
                ? item.actionResult.trim()
                : Array.isArray(item.replies) && item.replies.length > 0
                ? item.replies[item.replies.length - 1].content?.trim() || ""
                : "";

            const actionAuthor =
              item.actionAuthor ||
              (Array.isArray(item.replies) && item.replies.length > 0
                ? item.replies[item.replies.length - 1].author || ""
                : "");

            const actionDate =
              item.actionAt ||
              (Array.isArray(item.replies) && item.replies.length > 0
                ? item.replies[item.replies.length - 1].actionDate || item.replies[item.replies.length - 1].createdAt || ""
                : "");

            const hasReplies = Array.isArray(item.replies) && item.replies.length > 0;
            const hasAction = Boolean(actionContent) || hasReplies;

            // 최신 의견이 위쪽으로 오도록 역순 정렬 후 최대 3건 추출
            const recentReplies = hasReplies ? [...item.replies].reverse().slice(0, 3) : [];

            return (
              <div
                key={item.id}
                onClick={() => onSelectCardCategory(item)}
                className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col gap-2 shadow-2xs cursor-pointer hover:shadow-md hover:border-blue-400 dark:hover:border-blue-700 active:scale-[0.99] group ${
                  item.isResolved
                    ? "bg-white/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800"
                    : isQualityAlert
                    ? "bg-rose-50/50 dark:bg-rose-950/25 border-rose-300 dark:border-rose-900/80 ring-1 ring-rose-400/20"
                    : isMeeting
                    ? "bg-purple-50/50 dark:bg-purple-950/25 border-purple-300 dark:border-purple-800/80 ring-1 ring-purple-400/20"
                    : isNotice
                    ? "bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-800/80 ring-1 ring-emerald-400/20"
                    : "bg-blue-50/50 dark:bg-blue-950/25 border-blue-300 dark:border-blue-900/80 ring-1 ring-blue-400/20"
                }`}
                title="탭하여 목록(대장)으로 이동"
              >
                {/* 1단: 상태 배지 + 공장 + 일시 + 사진 + 의견수 + 삭제버튼 */}
                <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-800/60 flex-wrap">
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {isQualityAlert ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-rose-600 text-white shrink-0 shadow-2xs">
                        🚨 품질경보
                      </span>
                    ) : isMeeting ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-purple-600 text-white shrink-0 shadow-2xs">
                        📅 회의일정
                      </span>
                    ) : isNotice ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-600 text-white shrink-0 shadow-2xs">
                        📢 사내공지
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0 shadow-2xs">
                        📌 오픈이슈
                      </span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-black shrink-0 ${
                      item.plant === "한림공장"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                        : item.plant === "삼랑진공장"
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200"
                        : "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-200"
                    }`}>
                      {item.plant}
                    </span>
                    {item.expireDate && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold shrink-0 font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {isQualityAlert
                          ? `🚨 등록일: ${formatMonthDayWithDayOfWeek(item.expireDate)}`
                          : isMeeting
                          ? `📅 회의: ${formatMonthDayWithDayOfWeek(item.expireDate)}${item.meetingTime ? ` ${item.meetingTime}` : ""}`
                          : isNotice
                          ? `📅 만료: ~${formatMonthDayWithDayOfWeek(item.expireDate)}`
                          : `🚩 D-DAY: ${formatMonthDayWithDayOfWeek(item.expireDate)}`}
                      </span>
                    )}
                    {item.author && (
                      <span className="text-[10.5px] text-slate-400 hidden sm:inline font-medium">
                        등록: {item.author} {item.authorTitle || ""}
                      </span>
                    )}
                  </div>

                  {/* 우측 삭제 버튼 (빨간색 뱃지로 시인성 대폭 개선) */}
                  <div className="flex items-center gap-1.5 ml-auto shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDeleteModal(item, e);
                      }}
                      className="p-1 sm:p-1.5 rounded-lg bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-950/80 dark:hover:bg-rose-600 dark:text-rose-300 dark:hover:text-white border border-rose-300 dark:border-rose-700 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0 flex items-center justify-center"
                      title="이 항목 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2단: 전체 너비 제목 및 내용 (엔터 줄바꿈 보존 및 내용 폰트 크기 60% 조정) */}
                <div className="min-w-0">
                  <h4 className={`text-xs sm:text-sm md:text-base font-black leading-snug break-words whitespace-pre-wrap flex items-center gap-1.5 flex-wrap group-hover:underline ${
                    isQualityAlert
                      ? "text-rose-700 dark:text-rose-300"
                      : isMeeting
                      ? "text-purple-800 dark:text-purple-300"
                      : isNotice
                      ? "text-slate-900 dark:text-white"
                      : "text-blue-800 dark:text-blue-300"
                  }`}>
                    <span>{item.title || item.content}</span>
                    <span className="px-1.5 py-0.2 rounded-md text-[10.5px] font-mono font-black bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800 shadow-2xs no-underline inline-flex items-center gap-0.5" title="조치결과 및 의견 수">
                      💬 {getIssueOpinionCount(item)}
                    </span>
                  </h4>
                  {item.title && item.content && (
                    <p className="text-[9.5px] sm:text-[10px] font-medium leading-relaxed text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap break-words">
                      {item.content}
                    </p>
                  )}
                </div>

                {/* 3단: 조치결과 및 등록 의견 (최신 의견이 위쪽으로, 최대 3건 표현) */}
                {hasAction && (
                  <div className={`mt-0.5 p-2.5 rounded-xl border space-y-1.5 ${
                    isQualityAlert
                      ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60"
                      : isMeeting
                      ? "bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/60"
                      : item.isResolved
                      ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60"
                      : "bg-blue-50/60 dark:bg-slate-800/60 border-blue-200/80 dark:border-slate-700"
                  }`}>
                    {/* 상단 라벨 */}
                    <div className="flex items-center justify-between gap-1 text-[11px] font-black pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className={`flex items-center gap-1 ${
                        isQualityAlert || item.isResolved
                          ? "text-emerald-800 dark:text-emerald-300"
                          : isMeeting
                          ? "text-purple-800 dark:text-purple-300"
                          : "text-blue-800 dark:text-blue-300"
                      }`}>
                        {isQualityAlert || item.isResolved ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : isMeeting ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5" />
                        )}
                        <span>{isQualityAlert ? "조치결과" : isMeeting ? "회의 결과 및 결정 사항" : item.isResolved ? "조치완료 결과" : "등록 의견"}</span>
                      </span>

                      {hasReplies && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                          {item.replies.length > 3
                            ? `총 ${item.replies.length}건 중 최근 3건`
                            : `총 ${item.replies.length}건`}
                        </span>
                      )}
                    </div>

                    {/* 의견 목록 (최신순 3건) */}
                    {hasReplies ? (
                      <div className="space-y-1.5">
                        {recentReplies.map((rep, rIdx) => (
                          <div
                            key={rep.id || rIdx}
                            className="p-2 rounded-lg bg-white/95 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 space-y-1 shadow-2xs"
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                👤 {rep.author || "담당자"} {rep.authorTitle || ""}
                              </span>
                              <span className="font-mono text-[9.5px]">
                                {rep.actionDate || rep.createdAt || ""}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-white whitespace-pre-wrap break-words leading-relaxed">
                              {rep.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-white/95 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 space-y-1 shadow-2xs">
                        {(actionAuthor || actionDate) && (
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              👤 {actionAuthor}
                            </span>
                            <span className="font-mono text-[9.5px]">{actionDate}</span>
                          </div>
                        )}
                        <div className="text-xs font-semibold text-slate-900 dark:text-white whitespace-pre-wrap break-words leading-relaxed">
                          {actionContent}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
