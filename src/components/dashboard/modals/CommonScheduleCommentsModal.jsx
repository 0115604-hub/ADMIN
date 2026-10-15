import React from "react";
import {
  Trash2,
  MessageSquare,
  CalendarDays
} from "lucide-react";
import { isUserAdminOrHeadquarter } from "../../../services/commonScheduleService";

export default function CommonScheduleCommentsModal({
  selectedCommonScheduleForComments,
  setSelectedCommonScheduleForComments,
  currentProfile,
  isAdmin,
  isGeneralManager,
  commonScheduleCommentInput,
  setCommonScheduleCommentInput,
  commonScheduleCommentSubmitting,
  handleAddCommonScheduleComment,
  handleDeleteCommonScheduleComment,
  handleToggleCompleteCommonSchedule
}) {
  if (!selectedCommonScheduleForComments) return null;

  return (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCommonScheduleForComments(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col border border-indigo-500/40 shadow-2xl animate-scaleUp overflow-hidden cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                  <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-base text-slate-900 dark:text-white truncate">
                    공통일정 상세 및 의견 교환
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    일정 세부 내용을 확인하고 관련 의견이나 피드백을 남길 수 있습니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCommonScheduleForComments(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 divide-y divide-slate-100 dark:divide-slate-800 flex-1">
              {/* Schedule Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300">
                      {selectedCommonScheduleForComments.target || "공통"}
                    </span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono">
                      {selectedCommonScheduleForComments.startDate || selectedCommonScheduleForComments.date}
                      {selectedCommonScheduleForComments.endDate && selectedCommonScheduleForComments.endDate !== (selectedCommonScheduleForComments.startDate || selectedCommonScheduleForComments.date)
                        ? ` ~ ${selectedCommonScheduleForComments.endDate}`
                        : ""}
                    </span>
                    {selectedCommonScheduleForComments.time && selectedCommonScheduleForComments.time !== "종일" && (
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        [{selectedCommonScheduleForComments.time}]
                      </span>
                    )}
                  </div>
                  <span className="text-[10.5px] text-slate-400 font-medium">
                    등록자: {selectedCommonScheduleForComments.author || "ADMIN"}
                  </span>
                </div>

                <h4 className="font-black text-base text-slate-900 dark:text-white leading-snug">
                  {selectedCommonScheduleForComments.title}
                </h4>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">
                    상태: <strong className={selectedCommonScheduleForComments.isCompleted ? "text-slate-400" : "text-emerald-600 dark:text-emerald-400 font-black"}>{selectedCommonScheduleForComments.isCompleted ? "완료됨" : "진행중"}</strong>
                  </span>
                  {(isAdmin || isGeneralManager) && (
                    <button
                      type="button"
                      onClick={async () => {
                        const isDone = Boolean(selectedCommonScheduleForComments.isCompleted);
                        await handleToggleCompleteCommonSchedule(selectedCommonScheduleForComments.id, isDone);
                        setSelectedCommonScheduleForComments((prev) => prev ? { ...prev, isCompleted: !isDone } : null);
                      }}
                      className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {selectedCommonScheduleForComments.isCompleted ? "진행중으로 변경" : "일정 완료 처리"}
                    </button>
                  )}
                </div>
              </div>

              {/* Comments / Opinions List */}
              <div className="pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>의견 및 피드백</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {(selectedCommonScheduleForComments.comments || []).length}
                    </span>
                  </span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {(!selectedCommonScheduleForComments.comments || selectedCommonScheduleForComments.comments.length === 0) ? (
                    <div className="py-6 text-center text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      등록된 의견이 없습니다. 첫 번째 의견을 남겨보세요!
                    </div>
                  ) : (
                    selectedCommonScheduleForComments.comments
                      .filter((cmt) => {
                        if (!cmt) return false;
                        if (isUserAdminOrHeadquarter(currentProfile)) return true;
                        const author = String(cmt.author || "").trim().toLowerCase();
                        const role = String(cmt.role || "").trim().toUpperCase();
                        if (
                          author === "admin" ||
                          author === "권태형" ||
                          author === "최미영" ||
                          author === "대표이사" ||
                          author === "전무" ||
                          role === "ADMIN"
                        ) {
                          return false;
                        }
                        return true;
                      })
                      .map((cmt) => {
                      const canDelete = isAdmin || isGeneralManager || cmt.author === currentProfile?.name;
                      const timeStr = cmt.createdAt ? new Date(cmt.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "";
                      const dateStr = cmt.createdAt ? cmt.createdAt.slice(5, 10).replace("-", "/") : "";

                      return (
                        <div
                          key={cmt.id}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-slate-900 dark:text-white">
                                {cmt.author}
                              </span>
                              {cmt.role && (
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {cmt.role}
                                </span>
                              )}
                              {cmt.plant && (
                                <span className="text-[9.5px] text-slate-400 font-bold">
                                  ({cmt.plant})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {dateStr} {timeStr}
                              </span>
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCommonScheduleComment(cmt.id)}
                                  className="p-0.5 text-slate-300 hover:text-rose-600 transition-colors"
                                  title="의견 삭제"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-words leading-relaxed">
                            {cmt.text}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Comment Input Form */}
              <form onSubmit={handleAddCommonScheduleComment} className="pt-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                  <span>
                    작성자: <strong className="text-slate-900 dark:text-white">{currentProfile?.name || "관리자"}</strong> ({currentProfile?.role || currentProfile?.title || "선임"})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commonScheduleCommentInput}
                    onChange={(e) => setCommonScheduleCommentInput(e.target.value)}
                    placeholder="의견이나 조율 내용을 입력하세요..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={commonScheduleCommentSubmitting || !commonScheduleCommentInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
                  >
                    {commonScheduleCommentSubmitting ? "등록중..." : "의견 등록"}
                  </button>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCommonScheduleForComments(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
  );
}
