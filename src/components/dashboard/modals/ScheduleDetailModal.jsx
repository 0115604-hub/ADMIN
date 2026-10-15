import React from "react";
import {
  Calendar,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  Filter,
  CheckCheck,
  CalendarDays,
  X,
  Users,
  History,
  Activity,
  Camera,
  Download,
  Eye,
  MessageCircle,
  RotateCcw
} from "lucide-react";
import { formatKSTDateTime } from "../../../utils/dateUtils";

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
        const isAllTab = isSharedTab;
        const modalTitle = isSharedTab
          ? "전체리스트 관리"
          : scheduleDetailModal.filterTab === "completed"
          ? "완료 / 마무리 이력"
          : scheduleDetailModal.filterTab === "active"
          ? "진행 중인 일정 목록"
          : isRecipientModal
          ? "공유받은 내용 & 답장"
          : "목록관리";

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

              {/* Filter Tabs */}
              {(() => {
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

                return (
                  <div className="flex items-center gap-1.5 p-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-bold overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setScheduleDetailModal((prev) => ({ ...prev, filterTab: "day" }))}
                      className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                        scheduleDetailModal.filterTab === "day"
                          ? (isRecipientModal ? "bg-purple-600 text-white font-black shadow-xs" : "bg-blue-600 text-white font-black shadow-xs")
                          : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                      }`}
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>선택 일자 ({targetDate.slice(5)}) ({dayActive.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setScheduleDetailModal((prev) => ({ ...prev, filterTab: "week" }))}
                      className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                        scheduleDetailModal.filterTab === "week"
                          ? (isRecipientModal ? "bg-purple-600 text-white font-black shadow-xs" : "bg-blue-600 text-white font-black shadow-xs")
                          : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>이번 주간 ({weekActive.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setScheduleDetailModal((prev) => ({ ...prev, filterTab: "active" }))}
                      className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                        scheduleDetailModal.filterTab === "active"
                          ? "bg-blue-600 text-white font-black shadow-xs"
                          : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>진행중 ({totalActive.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setScheduleDetailModal((prev) => ({ ...prev, filterTab: "completed" }))}
                      className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                        scheduleDetailModal.filterTab === "completed"
                          ? "bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-400/50"
                          : "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>완료 / 마무리 ({totalCompleted.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setScheduleDetailModal((prev) => ({ ...prev, filterTab: "shared" }))}
                      className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                        scheduleDetailModal.filterTab === "shared" || scheduleDetailModal.filterTab === "all"
                          ? "bg-purple-600 text-white font-black shadow-xs ring-1 ring-purple-400/50"
                          : "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-purple-200 dark:border-purple-800"
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>공유답장 ({sharedLeaves.length})</span>
                    </button>
                  </div>
                );
              })()}

              {/* Modal Body - Schedules List */}
              <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[58vh]">
                {(() => {
                  let list = (annualLeaves || []).filter((l) => {
                    if (!l) return false;
                    return (myId && l.userId === myId) || (myName && l.userName === myName);
                  });

                  if (scheduleDetailModal.filterTab === "day") {
                    const targetDate = scheduleDetailModal.selectedDate || todayDateStr;
                    list = list.filter((l) => (l.startDate || "") <= targetDate && (l.endDate || l.startDate || "") >= targetDate);
                  } else if (scheduleDetailModal.filterTab === "week") {
                    const weekDates = myWeeklyCalendarDays.map((d) => d.dateStr);
                    const minDate = weekDates[0] || "";
                    const maxDate = weekDates[weekDates.length - 1] || "";
                    list = list.filter((l) => {
                      const s = l.startDate || "";
                      const e = l.endDate || l.startDate || "";
                      return s <= maxDate && e >= minDate;
                    });
                  } else if (scheduleDetailModal.filterTab === "active") {
                    list = list.filter((l) => !l.isCompleted && !l.isDismissed);
                  } else if (scheduleDetailModal.filterTab === "completed") {
                    list = list.filter((l) => l.isCompleted || l.isDismissed);
                  } else if (scheduleDetailModal.filterTab === "shared" || scheduleDetailModal.filterTab === "all") {
                    list = list.filter((l) => {
                      return (
                        Boolean(l.isSharedRecipient || l.sharedBy) ||
                        Boolean(l.isSharedOrigin) ||
                        (Array.isArray(l.sharedWithDetails) && l.sharedWithDetails.length > 0) ||
                        (Array.isArray(l.sharedWith) && l.sharedWith.length > 0) ||
                        Boolean(l.originLeaveId)
                      );
                    });
                  }

                  list.sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));

                  // Special Dedicated 'Completed' View Tab
                  if (scheduleDetailModal.filterTab === "completed") {
                    if (list.length === 0) {
                      return (
                        <div className="py-10 text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 mx-auto flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-bold text-slate-500">
                            완료되거나 마무리가 끝난 일정이 없습니다.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 pb-1">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>완료 및 마무리된 일정 목록 ({list.length}건)</span>
                          </span>
                          <span className="text-[10.5px] text-slate-400 font-normal">
                            실수로 완료한 경우 '진행중으로 복구'가 가능합니다
                          </span>
                        </div>

                        {list.map((item) => {
                          const isRecipient = Boolean(item.isSharedRecipient || item.sharedBy);
                          const isOrigin = Boolean(
                            item.isSharedOrigin ||
                            (Array.isArray(item.sharedWithDetails) && item.sharedWithDetails.length > 0) ||
                            (Array.isArray(item.sharedWith) && item.sharedWith.length > 0)
                          );
                          const completeTime = item.completedAt || item.replyAt || item.updatedAt;

                          return (
                            <div
                              key={item.id}
                              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/70 shadow-2xs space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-600 text-white text-xs font-bold flex items-center gap-1">
                                    <span>{item.leaveType}</span>
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-500" />
                                    <span>
                                      {item.startDate}
                                      {item.endDate && item.endDate !== item.startDate ? ` ~ ${item.endDate}` : ""}
                                    </span>
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-black border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                    <CheckCheck className="w-3 h-3 text-emerald-600" />
                                    <span>{isRecipient ? "답장 및 마무리 완료" : "완료됨"}</span>
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleReactivateLeave(item)}
                                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-300 text-[11px] font-bold border border-blue-200 dark:border-blue-800 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                                    title="일정을 다시 '진행중' 상태로 복구합니다"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>진행중으로 복구</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLeave(item.id, item.originLeaveId)}
                                    className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                                    title="일정 완전 삭제 (공유된 작업자의 일정에서도 자동 삭제)"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>삭제</span>
                                  </button>
                                </div>
                              </div>

                              <div className="p-2 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 space-y-1">
                                <div>
                                  <span className="text-slate-400 font-normal mr-1.5">내용:</span>
                                  <span>{item.reason || item.leaveType}</span>
                                </div>
                                {isRecipient && item.replyText && (
                                  <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 text-purple-800 dark:text-purple-300 text-[11px]">
                                    내가 보낸 답장: <strong className="font-black">"{item.replyText}"</strong>
                                  </div>
                                )}

                                {/* 첨부 사진 & 파일 목록 */}
                                {((item.files && item.files.length > 0) || (item.images && item.images.length > 0)) && (
                                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                                    <div className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                      <Camera className="w-3 h-3 text-rose-500" />
                                      <span>첨부 파일 / 사진:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                      {(item.images || item.files?.filter((f) => f.fileType === "image" || f.dataUrl?.startsWith("data:image")) || []).map((img, imgIdx) => {
                                        const url = img.dataUrl || img;
                                        const name = img.name || `사진 ${imgIdx + 1}`;
                                        return (
                                          <div
                                            key={img.id || imgIdx}
                                            onClick={() => setPreviewImageModal({ url, name })}
                                            className="group relative w-11 h-11 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden cursor-pointer shadow-2xs hover:border-blue-500 transition-all shrink-0"
                                            title="클릭하여 크게보기"
                                          >
                                            <img src={url} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                              <Eye className="w-3 h-3" />
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {(item.files?.filter((f) => f.fileType !== "image" && !f.dataUrl?.startsWith("data:image")) || []).map((f, fIdx) => (
                                        <a
                                          key={f.id || fIdx}
                                          href={f.dataUrl}
                                          download={f.name || "첨부파일"}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-800 dark:text-slate-200 text-[10.5px] font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                                          title="클릭하여 다운로드"
                                        >
                                          <Download className="w-3 h-3 text-blue-500 shrink-0" />
                                          <span className="max-w-[100px] truncate">{f.name}</span>
                                          <span className="text-[9px] text-slate-400 font-normal">({f.size})</span>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-0.5 flex-wrap gap-1">
                                <span>작성: {item.userName || workerFullName} ({item.plant || workerPlant})</span>
                                {completeTime && <span>완료 시각: {formatKSTDateTime(completeTime)}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // 💬 Special Dedicated 'Shared' View Tab (진행 중인 공유 일정과 답장 후 삭제된 항목 구분)
                  if (scheduleDetailModal.filterTab === "shared" || scheduleDetailModal.filterTab === "all") {
                    const activeShared = list.filter((l) => !l.isCompleted && !l.isDismissed && l.replyStatus !== "REPLIED" && !l.replyText);
                    const repliedShared = list.filter((l) => l.isCompleted || l.isDismissed || l.replyStatus === "REPLIED" || Boolean(l.replyText));

                    if (activeShared.length === 0 && repliedShared.length === 0) {
                      return (
                        <div className="py-10 text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-500 mx-auto flex items-center justify-center">
                            <MessageCircle className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-bold text-slate-500">
                            공유받거나 동료에게 보낸 공유답장 내역이 없습니다.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {/* 1. 진행 중인 공유 일정 (미답장 / 확인 대기) */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 pb-0.5">
                            <span className="flex items-center gap-1.5">
                              <MessageCircle className="w-4 h-4 text-purple-600" />
                              <span>진행 중인 공유 일정 ({activeShared.length}건)</span>
                            </span>
                            <span className="text-[10.5px] text-slate-400 font-normal">
                              답장 작성 후 삭제하거나 회신을 확인할 수 있습니다
                            </span>
                          </div>

                          {activeShared.length === 0 ? (
                            <div className="py-3.5 px-3 text-center text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                              현재 대기 중인 공유 일정이 없습니다.
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {activeShared.map((item) => {
                                const isToday = (item.startDate || "") === todayDateStr;
                                const isRecipient = Boolean(item.isSharedRecipient || item.sharedBy);
                                const isOrigin = Boolean(
                                  item.isSharedOrigin ||
                                  (Array.isArray(item.sharedWithDetails) && item.sharedWithDetails.length > 0) ||
                                  (Array.isArray(item.sharedWith) && item.sharedWith.length > 0)
                                );
                                const repliedCount = Array.isArray(item.sharedWithDetails)
                                  ? item.sharedWithDetails.filter((d) => d.status === "REPLIED" || Boolean(d.replyText)).length
                                  : 0;
                                const totalSharedCount = Array.isArray(item.sharedWithDetails)
                                  ? item.sharedWithDetails.length
                                  : (item.sharedWith?.length || 0);

                                return (
                                  <div
                                    key={item.id}
                                    className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-white dark:bg-slate-800 shadow-2xs space-y-2.5"
                                  >
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-xs font-black shadow-2xs flex items-center gap-1">
                                          <span>{item.leaveType}</span>
                                        </span>

                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                                          <Calendar className="w-3 h-3 text-blue-500" />
                                          <span>
                                            {item.startDate}
                                            {item.endDate && item.endDate !== item.startDate ? ` ~ ${item.endDate}` : ""}
                                          </span>
                                        </span>

                                        {isToday && (
                                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[10px] font-black animate-pulse">
                                            오늘
                                          </span>
                                        )}

                                        {isRecipient && (
                                          <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[11px] font-black flex items-center gap-1">
                                            <MessageCircle className="w-3 h-3" />
                                            <span>공유받음 ({item.sharedBy || "동료작업자"})</span>
                                          </span>
                                        )}

                                        {isOrigin && (
                                          <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[11px] font-black flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            <span>공유 {totalSharedCount}명 {repliedCount > 0 ? `(회신 ${repliedCount}/${totalSharedCount})` : ""}</span>
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        {isRecipient ? (
                                          <button
                                            type="button"
                                            onClick={() => handleRequestDismissOrDelete(item, "dismiss")}
                                            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-[11px] font-black shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                            title="보낸 작업자에게 답장을 보내고 내 일정에서 완전 삭제합니다"
                                          >
                                            <MessageCircle className="w-3 h-3" />
                                            <span>답장 후 삭제</span>
                                          </button>
                                        ) : isOrigin ? (
                                          <button
                                            type="button"
                                            onClick={() => handleRequestDismissOrDelete(item, "dismiss")}
                                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[11px] font-black border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1"
                                            title="공유 작업자들의 회신 내용을 확인하고 완료/삭제합니다"
                                          >
                                            <Users className="w-3 h-3" />
                                            <span>회신 확인 및 완료</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleRequestDismissOrDelete(item, "dismiss")}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-0.5"
                                          >
                                            <CheckCheck className="w-3 h-3" />
                                            <span>완료</span>
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => handleDeleteLeave(item.id, item.originLeaveId)}
                                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                                          title="일정 완전 삭제 (공유된 작업자의 일정에서도 자동 삭제)"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          <span>삭제</span>
                                        </button>
                                      </div>
                                    </div>

                                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 space-y-1">
                                      <div>
                                        <span className="text-slate-400 font-normal mr-1.5">일정 내용:</span>
                                        <span>{item.reason || item.leaveType}</span>
                                      </div>

                                      {/* 첨부 사진 & 파일 목록 */}
                                      {((item.files && item.files.length > 0) || (item.images && item.images.length > 0)) && (
                                        <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                                          <div className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                            <Camera className="w-3 h-3 text-rose-500" />
                                            <span>첨부 파일 / 사진:</span>
                                          </div>
                                          <div className="flex flex-wrap gap-1.5 items-center">
                                            {(item.images || item.files?.filter((f) => f.fileType === "image" || f.dataUrl?.startsWith("data:image")) || []).map((img, imgIdx) => {
                                              const url = img.dataUrl || img;
                                              const name = img.name || `사진 ${imgIdx + 1}`;
                                              return (
                                                <div
                                                  key={img.id || imgIdx}
                                                  onClick={() => setPreviewImageModal({ url, name })}
                                                  className="group relative w-11 h-11 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden cursor-pointer shadow-2xs hover:border-blue-500 transition-all shrink-0"
                                                  title="클릭하여 크게보기"
                                                >
                                                  <img src={url} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                    <Eye className="w-3 h-3" />
                                                  </div>
                                                </div>
                                              );
                                            })}
                                            {(item.files?.filter((f) => f.fileType !== "image" && !f.dataUrl?.startsWith("data:image")) || []).map((f, fIdx) => (
                                              <a
                                                key={f.id || fIdx}
                                                href={f.dataUrl}
                                                download={f.name || "첨부파일"}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-800 dark:text-slate-200 text-[10.5px] font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                                                title="클릭하여 다운로드"
                                              >
                                                <Download className="w-3 h-3 text-blue-500 shrink-0" />
                                                <span className="max-w-[100px] truncate">{f.name}</span>
                                                <span className="text-[9px] text-slate-400 font-normal">({f.size})</span>
                                              </a>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {isOrigin && Array.isArray(item.sharedWithDetails) && item.sharedWithDetails.length > 0 && (
                                        <div className="mt-1 pt-1.5 border-t border-indigo-200/60 dark:border-indigo-900/40 text-[11px] space-y-1">
                                          <span className="text-slate-500 font-bold block">공유 대상자 회신 현황:</span>
                                          <div className="flex flex-wrap gap-1.5">
                                            {item.sharedWithDetails.map((d, dIdx) => (
                                              <span
                                                key={dIdx}
                                                className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border flex items-center gap-1 ${
                                                  d.status === "REPLIED" || Boolean(d.replyText)
                                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
                                                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800"
                                                }`}
                                              >
                                                <span>{d.name}</span>
                                                {d.status === "REPLIED" || Boolean(d.replyText) ? (
                                                  <span className="font-black text-emerald-600 dark:text-emerald-400">"{d.replyText || "확인"}"</span>
                                                ) : (
                                                  <span className="text-amber-600 dark:text-amber-400 font-normal">미회신</span>
                                                )}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-0.5 flex-wrap gap-1">
                                      <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        <span>작성: {item.userName || workerFullName} ({item.plant || workerPlant})</span>
                                      </span>
                                      <span>등록: {item.createdAt ? formatKSTDateTime(item.createdAt) : item.createdDate || "-"}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 2. 답장 후 삭제 및 완료된 공유 이력 (별도 구분 섹션) */}
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 pb-0.5">
                            <span className="flex items-center gap-1.5">
                              <CheckCheck className="w-4 h-4 text-emerald-600" />
                              <span>✓ 답장 후 삭제 및 완료된 공유 이력 ({repliedShared.length}건)</span>
                            </span>
                            <span className="text-[10.5px] text-slate-400 font-normal">
                              실수로 삭제/완료한 경우 '진행중으로 복구'할 수 있습니다
                            </span>
                          </div>

                          {repliedShared.length === 0 ? (
                            <div className="py-3.5 px-3 text-center text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                              답장 후 삭제되거나 마무리된 공유 이력이 없습니다.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {repliedShared.map((item) => {
                                const isRecipient = Boolean(item.isSharedRecipient || item.sharedBy);
                                const isOrigin = Boolean(
                                  item.isSharedOrigin ||
                                  (Array.isArray(item.sharedWithDetails) && item.sharedWithDetails.length > 0) ||
                                  (Array.isArray(item.sharedWith) && item.sharedWith.length > 0)
                                );
                                const completeTime = item.completedAt || item.replyAt || item.updatedAt;

                                return (
                                  <div
                                    key={item.id}
                                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/70 shadow-2xs space-y-2"
                                  >
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="px-2 py-0.5 rounded-md bg-slate-600 text-white text-xs font-bold flex items-center gap-1">
                                          <span>{item.leaveType}</span>
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                                          <Calendar className="w-3 h-3 text-slate-500" />
                                          <span>
                                            {item.startDate}
                                            {item.endDate && item.endDate !== item.startDate ? ` ~ ${item.endDate}` : ""}
                                          </span>
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[11px] font-black border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                                          <CheckCheck className="w-3 h-3 text-purple-600" />
                                          <span>{isRecipient ? `답장 완료 (${item.sharedBy || "동료"})` : "회신 완료 및 삭제"}</span>
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleReactivateLeave(item)}
                                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-300 text-[11px] font-bold border border-blue-200 dark:border-blue-800 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                                          title="일정을 다시 '진행중' 상태로 복구합니다"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                          <span>진행중으로 복구</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleDeleteLeave(item.id, item.originLeaveId)}
                                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                                          title="일정 완전 삭제 (공유된 작업자의 일정에서도 자동 삭제)"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          <span>삭제</span>
                                        </button>
                                      </div>
                                    </div>

                                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 space-y-1">
                                      <div>
                                        <span className="text-slate-400 font-normal mr-1.5">내용:</span>
                                        <span>{item.reason || item.leaveType}</span>
                                      </div>
                                      {isRecipient && item.replyText && (
                                        <div className="mt-1 pt-1 border-t border-purple-100 dark:border-purple-900/50 text-purple-800 dark:text-purple-300 text-[11px]">
                                          내가 보낸 답장: <strong className="font-black">"{item.replyText}"</strong>
                                        </div>
                                      )}
                                      {isOrigin && Array.isArray(item.sharedWithDetails) && item.sharedWithDetails.length > 0 && (
                                        <div className="mt-1 pt-1 border-t border-indigo-100 dark:border-indigo-900/50 text-[11px] flex flex-wrap gap-1">
                                          {item.sharedWithDetails.map((d, dIdx) => (
                                            <span key={dIdx} className="text-slate-600 dark:text-slate-300">
                                              {d.name}: <strong>"{d.replyText || "확인"}"</strong>
                                            </span>
                                          ))}
                                        </div>
                                      )}

                                      {/* 첨부 사진 & 파일 목록 */}
                                      {((item.files && item.files.length > 0) || (item.images && item.images.length > 0)) && (
                                        <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                                          <div className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                            <Camera className="w-3 h-3 text-rose-500" />
                                            <span>첨부 파일 / 사진:</span>
                                          </div>
                                          <div className="flex flex-wrap gap-1.5 items-center">
                                            {(item.images || item.files?.filter((f) => f.fileType === "image" || f.dataUrl?.startsWith("data:image")) || []).map((img, imgIdx) => {
                                              const url = img.dataUrl || img;
                                              const name = img.name || `사진 ${imgIdx + 1}`;
                                              return (
                                                <div
                                                  key={img.id || imgIdx}
                                                  onClick={() => setPreviewImageModal({ url, name })}
                                                  className="group relative w-11 h-11 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden cursor-pointer shadow-2xs hover:border-blue-500 transition-all shrink-0"
                                                  title="클릭하여 크게보기"
                                                >
                                                  <img src={url} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                    <Eye className="w-3 h-3" />
                                                  </div>
                                                </div>
                                              );
                                            })}
                                            {(item.files?.filter((f) => f.fileType !== "image" && !f.dataUrl?.startsWith("data:image")) || []).map((f, fIdx) => (
                                              <a
                                                key={f.id || fIdx}
                                                href={f.dataUrl}
                                                download={f.name || "첨부파일"}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-800 dark:text-slate-200 text-[10.5px] font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                                                title="클릭하여 다운로드"
                                              >
                                                <Download className="w-3 h-3 text-blue-500 shrink-0" />
                                                <span className="max-w-[100px] truncate">{f.name}</span>
                                                <span className="text-[9px] text-slate-400 font-normal">({f.size})</span>
                                              </a>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-0.5 flex-wrap gap-1">
                                      <span>작성: {item.userName || workerFullName} ({item.plant || workerPlant})</span>
                                      {completeTime && <span>처리 시각: {formatKSTDateTime(completeTime)}</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  const activeList = list.filter((l) => !l.isCompleted && !l.isDismissed);
                  const completedList = list.filter((l) => l.isCompleted || l.isDismissed);

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
                          {activeList.map((item) => {
                            const isToday = (item.startDate || "") === todayDateStr;
                            const isRecipient = Boolean(item.isSharedRecipient || item.sharedBy);
                            const isOrigin = Boolean(
                              item.isSharedOrigin ||
                              (Array.isArray(item.sharedWithDetails) && item.sharedWithDetails.length > 0) ||
                              (Array.isArray(item.sharedWith) && item.sharedWith.length > 0)
                            );
                            const isDone = item.isCompleted || item.isDismissed;
                            const isReplied = item.replyStatus === "REPLIED" || Boolean(item.replyText);

                            const repliedCount = Array.isArray(item.sharedWithDetails)
                              ? item.sharedWithDetails.filter((d) => d.status === "REPLIED" || Boolean(d.replyText)).length
                              : 0;
                            const totalSharedCount = Array.isArray(item.sharedWithDetails)
                              ? item.sharedWithDetails.length
                              : (item.sharedWith?.length || 0);

                            return (
                              <div
                                key={item.id}
                                className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                                  isToday
                                    ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-400/80 shadow-xs ring-1 ring-blue-400/30"
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs"
                                }`}
                              >
                                {/* Top row: Badges & Actions */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-xs font-black shadow-2xs flex items-center gap-1">
                                      <span>{item.leaveType}</span>
                                    </span>

                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-blue-500" />
                                      <span>
                                        {item.startDate}
                                        {item.endDate && item.endDate !== item.startDate ? ` ~ ${item.endDate}` : ""}
                                      </span>
                                    </span>

                                    {isToday && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[10px] font-black animate-pulse">
                                        오늘
                                      </span>
                                    )}

                                    {isRecipient && (
                                      <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[11px] font-black flex items-center gap-1">
                                        <MessageCircle className="w-3 h-3" />
                                        <span>공유받음 ({item.sharedBy || "동료작업자"})</span>
                                      </span>
                                    )}

                                    {isOrigin && (
                                      <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[11px] font-black flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        <span>공유 {totalSharedCount}명 {repliedCount > 0 ? `(회신 ${repliedCount}/${totalSharedCount})` : ""}</span>
                                      </span>
                                    )}
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-1.5">
                                    {isRecipient ? (
                                      <button
                                        type="button"
                                        onClick={() => handleRequestDismissOrDelete(item, "dismiss")}
                                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-[11px] font-black shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                        title="보낸 작업자에게 답장을 보내고 내 일정에서 완전 삭제합니다"
                                      >
                                        <MessageCircle className="w-3 h-3" />
                                        <span>답장 후 삭제</span>
                                      </button>
                                    ) : isOrigin ? (
                                      <button
                                        type="button"
                                        onClick={() => handleRequestDismissOrDelete(item, "dismiss")}
                                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[11px] font-black border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1"
                                        title="공유 작업자들의 회신 내용을 확인하고 완료/삭제합니다"
                                      >
                                        <Users className="w-3 h-3" />
                                        <span>회신 확인 및 완료</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleRequestDismissOrDelete(item, "dismiss")}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-0.5"
                                        title="일정 완료 처리"
                                      >
                                        <CheckCheck className="w-3 h-3" />
                                        <span>완료</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLeave(item.id, item.originLeaveId)}
                                      className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                                      title="일정 완전 삭제 (공유된 작업자의 일정에서도 자동 삭제)"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>삭제</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Content / Reason */}
                                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 space-y-1">
                                  <div>
                                    <span className="text-slate-400 font-normal mr-1.5">일정 내용:</span>
                                    <span>{item.reason || item.leaveType}</span>
                                  </div>

                                  {/* 첨부 사진 & 파일 목록 */}
                                  {((item.files && item.files.length > 0) || (item.images && item.images.length > 0)) && (
                                    <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                                      <div className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <Camera className="w-3 h-3 text-rose-500" />
                                        <span>첨부 파일 / 사진:</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5 items-center">
                                        {(item.images || item.files?.filter((f) => f.fileType === "image" || f.dataUrl?.startsWith("data:image")) || []).map((img, imgIdx) => {
                                          const url = img.dataUrl || img;
                                          const name = img.name || `사진 ${imgIdx + 1}`;
                                          return (
                                            <div
                                              key={img.id || imgIdx}
                                              onClick={() => setPreviewImageModal({ url, name })}
                                              className="group relative w-11 h-11 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden cursor-pointer shadow-2xs hover:border-blue-500 transition-all shrink-0"
                                              title="클릭하여 크게보기"
                                            >
                                              <img src={url} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                <Eye className="w-3 h-3" />
                                              </div>
                                            </div>
                                          );
                                        })}
                                        {(item.files?.filter((f) => f.fileType !== "image" && !f.dataUrl?.startsWith("data:image")) || []).map((f, fIdx) => (
                                          <a
                                            key={f.id || fIdx}
                                            href={f.dataUrl}
                                            download={f.name || "첨부파일"}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-800 dark:text-slate-200 text-[10.5px] font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                                            title="클릭하여 다운로드"
                                          >
                                            <Download className="w-3 h-3 text-blue-500 shrink-0" />
                                            <span className="max-w-[100px] truncate">{f.name}</span>
                                            <span className="text-[9px] text-slate-400 font-normal">({f.size})</span>
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Recipient Reply Display */}
                                  {isRecipient && isReplied && (
                                    <div className="mt-1 pt-1.5 border-t border-purple-200/60 dark:border-purple-900/40 text-purple-900 dark:text-purple-200 text-[11px] flex items-center gap-1.5">
                                      <CheckCheck className="w-3 h-3 text-purple-600 shrink-0" />
                                      <span>
                                        내가 보낸 답장: <strong className="font-black">"{item.replyText}"</strong>
                                        {item.replyAt && <span className="opacity-75 text-[10px] ml-1">({formatKSTDateTime(item.replyAt)})</span>}
                                      </span>
                                    </div>
                                  )}

                                  {/* Origin Sender Replies Summary Preview */}
                                  {isOrigin && Array.isArray(item.sharedWithDetails) && item.sharedWithDetails.length > 0 && (
                                    <div className="mt-1 pt-1.5 border-t border-indigo-200/60 dark:border-indigo-900/40 text-[11px] space-y-1">
                                      <span className="text-slate-500 font-bold block">공유 대상자 회신 현황:</span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {item.sharedWithDetails.map((d, dIdx) => (
                                          <span
                                            key={dIdx}
                                            className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border flex items-center gap-1 ${
                                              d.status === "REPLIED" || Boolean(d.replyText)
                                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
                                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800"
                                            }`}
                                          >
                                            <span>{d.name}</span>
                                            {d.status === "REPLIED" || Boolean(d.replyText) ? (
                                              <span className="font-black text-emerald-600 dark:text-emerald-400">"{d.replyText || "확인"}"</span>
                                            ) : (
                                              <span className="text-amber-600 dark:text-amber-400 font-normal">미회신</span>
                                            )}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Footer Info */}
                                <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-0.5 flex-wrap gap-1">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    <span>
                                      작성: {item.userName || workerFullName} ({item.plant || workerPlant})
                                    </span>
                                  </span>
                                  <span>
                                    등록: {item.createdAt ? formatKSTDateTime(item.createdAt) : item.createdDate || "-"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                          현재 진행 중인 등록 일정이 없습니다.
                        </div>
                      )}

                      {/* 2. Finished / Completed History (한 줄 간단 기록 - 클릭 시 완료탭 이동 가능) */}
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
                                  {/* Left: 1-line summary */}
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

                                    {/* Shared / Reply contextual note */}
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

                                  {/* Right: Completion Timestamp & Complete Badge & Quick Reactivate */}
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
                })()}
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
