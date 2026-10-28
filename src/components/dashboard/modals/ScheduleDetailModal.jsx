import React from "react";
import {
  Calendar,
  Plus,
  CheckCircle2,
  X,
  MessageCircle,
  RotateCcw
} from "lucide-react";
import { formatKSTDateTime } from "../../../utils/dateUtils";
import ScheduleDetailFilterNav from "./schedule/ScheduleDetailFilterNav";
import ScheduleItemCard from "./schedule/ScheduleItemCard";
import ScheduleCompletedTabView from "./schedule/ScheduleCompletedTabView";
import ScheduleSharedTabView from "./schedule/ScheduleSharedTabView";

export default function ScheduleDetailModal({
  scheduleDetailModal,
  setScheduleDetailModal,
  currentProfile,
  workerFullName,
  workerPlant,
  officialTitle,
  myWeeklyCalendarDays,
  annualLeaves,
  todayDateStr,
  handleReactivateLeave,
  handleDeleteLeave,
  handleRequestDismissOrDelete,
  setScheduleSelectedDate,
  setPreviewImageModal
}) {
  if (!scheduleDetailModal) return null;

  const myId = currentProfile?.id;
  const myName = workerFullName;

  // 받은 사람 뷰 여부 판정 (공유받은 일정이 포함된 경우 '회신 목록' 및 '회신 등록' 모드로 전환)
  const hasRecipientOnSelectedDate = (annualLeaves || []).some((l) => {
    if (!l) return false;
    const matchUser = (myId && l.userId === myId) || (myName && l.userName === myName);
    if (!matchUser) return false;
    const targetDate = scheduleDetailModal.selectedDate;
    const inDate = (l.startDate || "") <= targetDate && (l.endDate || l.startDate || "") >= targetDate;
    return inDate && Boolean(l.isSharedRecipient || l.sharedBy);
  });

  const isRecipientModal = Boolean(scheduleDetailModal.isRecipient || hasRecipientOnSelectedDate);
  const isSharedTab = scheduleDetailModal.filterTab === "shared" || scheduleDetailModal.filterTab === "all";
  const modalTitle = isSharedTab
    ? "전체리스트 관리"
    : scheduleDetailModal.filterTab === "completed"
    ? "완료 / 마무리 이력"
    : scheduleDetailModal.filterTab === "active"
    ? "진행 중인 일정 목록"
    : isRecipientModal
    ? "공유받은 내용 & 답장"
    : "목록관리";

  // Pre-filter user schedules
  const userAllLeaves = (annualLeaves || []).filter((l) => {
    if (!l) return false;
    return (myId && l.userId === myId) || (myName && l.userName === myName);
  });

  const targetDate = scheduleDetailModal.selectedDate || todayDateStr;
  const dayActive = userAllLeaves.filter((l) => {
    if (l.isCompleted || l.isDismissed) return false;
    return (l.startDate || "") <= targetDate && (l.endDate || l.startDate || "") >= targetDate;
  });

  const weekDates = myWeeklyCalendarDays.map((d) => d.dateStr);
  const minDate = weekDates[0] || "";
  const maxDate = weekDates[weekDates.length - 1] || "";
  const weekActive = userAllLeaves.filter((l) => {
    if (l.isCompleted || l.isDismissed) return false;
    const s = l.startDate || "";
    const e = l.endDate || l.startDate || "";
    return s <= maxDate && e >= minDate;
  });

  const totalActive = userAllLeaves.filter((l) => !l.isCompleted && !l.isDismissed);
  const totalCompleted = userAllLeaves.filter((l) => l.isCompleted || l.isDismissed);

  const sharedLeaves = userAllLeaves.filter((l) => {
    return (
      Boolean(l.isSharedRecipient || l.sharedBy) ||
      Boolean(l.isSharedOrigin) ||
      (Array.isArray(l.sharedWithDetails) && l.sharedWithDetails.length > 0) ||
      (Array.isArray(l.sharedWith) && l.sharedWith.length > 0) ||
      Boolean(l.originLeaveId)
    );
  });

  // Current tab items list
  let currentList = userAllLeaves;
  if (scheduleDetailModal.filterTab === "day") {
    currentList = currentList.filter((l) => (l.startDate || "") <= targetDate && (l.endDate || l.startDate || "") >= targetDate);
  } else if (scheduleDetailModal.filterTab === "week") {
    currentList = currentList.filter((l) => {
      const s = l.startDate || "";
      const e = l.endDate || l.startDate || "";
      return s <= maxDate && e >= minDate;
    });
  } else if (scheduleDetailModal.filterTab === "active") {
    currentList = currentList.filter((l) => !l.isCompleted && !l.isDismissed);
  } else if (scheduleDetailModal.filterTab === "completed") {
    currentList = currentList.filter((l) => l.isCompleted || l.isDismissed);
  } else if (isSharedTab) {
    currentList = sharedLeaves;
  }

  currentList.sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) setScheduleDetailModal(null);
      }}
    >
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp my-auto cursor-default ${
          isRecipientModal || isSharedTab ? "border-purple-500/50" : "border-blue-500/40"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between p-3.5 sm:p-4 text-white ${
            isRecipientModal || isSharedTab
              ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700"
              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-white/20 text-white shrink-0">
              {isRecipientModal || isSharedTab ? <MessageCircle className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black truncate flex items-center gap-1.5">
                <span>{modalTitle}</span>
              </h3>
              <p className="text-[11px] opacity-90 truncate">
                [{workerPlant}] {workerFullName} {officialTitle} • {scheduleDetailModal.selectedDate} {scheduleDetailModal.dayName ? `(${scheduleDetailModal.dayName}요일)` : ""} • {modalTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScheduleDetailModal(null)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer shrink-0"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Navigation Tabs */}
        <ScheduleDetailFilterNav
          filterTab={scheduleDetailModal.filterTab}
          onSelectTab={(tabKey) => setScheduleDetailModal((prev) => ({ ...prev, filterTab: tabKey }))}
          isRecipientModal={isRecipientModal}
          targetDate={targetDate}
          dayCount={dayActive.length}
          weekCount={weekActive.length}
          activeCount={totalActive.length}
          completedCount={totalCompleted.length}
          sharedCount={sharedLeaves.length}
        />

        {/* Modal Body */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[58vh]">
          {scheduleDetailModal.filterTab === "completed" ? (
            <ScheduleCompletedTabView
              list={currentList}
              workerFullName={workerFullName}
              workerPlant={workerPlant}
              handleReactivateLeave={handleReactivateLeave}
              handleDeleteLeave={handleDeleteLeave}
              handleRequestDismissOrDelete={handleRequestDismissOrDelete}
              setPreviewImageModal={setPreviewImageModal}
            />
          ) : isSharedTab ? (
            <ScheduleSharedTabView
              list={currentList}
              todayDateStr={todayDateStr}
              workerFullName={workerFullName}
              workerPlant={workerPlant}
              handleReactivateLeave={handleReactivateLeave}
              handleDeleteLeave={handleDeleteLeave}
              handleRequestDismissOrDelete={handleRequestDismissOrDelete}
              setPreviewImageModal={setPreviewImageModal}
            />
          ) : (
            (() => {
              const activeList = currentList.filter((l) => !l.isCompleted && !l.isDismissed);
              const completedList = currentList.filter((l) => l.isCompleted || l.isDismissed);

              if (activeList.length === 0 && completedList.length === 0) {
                return (
                  <div className="py-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                      {isRecipientModal ? <MessageCircle className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                    </div>
                    <p className="text-xs font-bold text-slate-500">
                      {scheduleDetailModal.filterTab === "day"
                        ? `${scheduleDetailModal.selectedDate}에 등록된 ${isRecipientModal ? "공유받은 내용이" : "일정이"} 없습니다.`
                        : scheduleDetailModal.filterTab === "week"
                        ? `이번 주간에 등록된 ${isRecipientModal ? "공유받은 내용이" : "일정이"} 없습니다.`
                        : scheduleDetailModal.filterTab === "active"
                        ? "현재 진행 중인 등록 일정이 없습니다."
                        : `등록된 ${isRecipientModal ? "공유받은 내용 & 답장이" : "일정 내역이"} 없습니다.`}
                    </p>
                    {!isRecipientModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setScheduleSelectedDate(scheduleDetailModal.selectedDate);
                          setScheduleDetailModal(null);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>등록</span>
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {/* 1. Active Schedules */}
                  {activeList.length > 0 ? (
                    <div className="space-y-2.5">
                      {activeList.map((item) => (
                        <ScheduleItemCard
                          key={item.id}
                          item={item}
                          isToday={(item.startDate || "") === todayDateStr}
                          workerFullName={workerFullName}
                          workerPlant={workerPlant}
                          handleReactivateLeave={handleReactivateLeave}
                          handleDeleteLeave={handleDeleteLeave}
                          handleRequestDismissOrDelete={handleRequestDismissOrDelete}
                          setPreviewImageModal={setPreviewImageModal}
                          variant="active"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      현재 진행 중인 등록 일정이 없습니다.
                    </div>
                  )}

                  {/* 2. Finished / Completed History (한 줄 간단 기록) */}
                  {completedList.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>마무리 / 완료 이력 ({completedList.length}건)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setScheduleDetailModal((prev) => ({ ...prev, filterTab: "completed" }))}
                          className="text-[10.5px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <span>완료 탭에서 상세 관리</span>
                          <span>▶</span>
                        </button>
                      </div>

                      <div className="space-y-1 max-h-[26vh] overflow-y-auto pr-0.5">
                        {completedList.map((item) => {
                          const isRecipient = Boolean(item.isSharedRecipient || item.sharedBy);
                          const isOrigin = Boolean(
                            item.isSharedOrigin ||
                            (Array.isArray(item.sharedWithDetails) && item.sharedWithDetails.length > 0) ||
                            (Array.isArray(item.sharedWith) && item.sharedWith.length > 0)
                          );
                          const replyText = item.replyText || "";
                          const formattedDate = item.startDate ? item.startDate.slice(5) : "";
                          const completeTime = item.completedAt || item.replyAt || item.updatedAt;

                          return (
                            <div
                              key={item.id}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[11px] flex items-center justify-between gap-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/90"
                            >
                              <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="font-extrabold text-slate-700 dark:text-slate-200 shrink-0">
                                  [{formattedDate}]
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 shrink-0">
                                  {item.leaveType}
                                </span>
                                <span className="truncate text-slate-700 dark:text-slate-300 font-bold">
                                  {item.reason || item.leaveType}
                                </span>

                                {isRecipient && (
                                  <span className="text-[10px] text-purple-700 dark:text-purple-300 truncate shrink-0">
                                    • {item.sharedBy} 공유 {replyText ? `(답장: "${replyText}")` : "(답장 완료)"}
                                  </span>
                                )}
                                {isOrigin && Array.isArray(item.sharedWithDetails) && item.sharedWithDetails.length > 0 && (
                                  <span className="text-[10px] text-indigo-700 dark:text-indigo-300 truncate shrink-0">
                                    • 공유 {item.sharedWithDetails.length}명 회신 완료
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-slate-400">
                                {completeTime && (
                                  <span className="hidden sm:inline font-mono">{formatKSTDateTime(completeTime)}</span>
                                )}
                                <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-[9.5px]">
                                  {isRecipient ? "답장 완료" : "완료됨"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleReactivateLeave(item)}
                                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold cursor-pointer"
                                  title="진행중으로 복구"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-500 truncate">
            선택 일자: {scheduleDetailModal.selectedDate}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {!isRecipientModal && (
              <button
                type="button"
                onClick={() => {
                  setScheduleSelectedDate(scheduleDetailModal.selectedDate);
                  setScheduleDetailModal(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>등록</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setScheduleDetailModal(null)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
