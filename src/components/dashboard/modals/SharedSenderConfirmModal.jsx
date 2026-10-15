import React from "react";
import {
  Clock,
  User,
  ShieldCheck,
  CheckCheck,
  MessageSquare,
  X,
  Users
} from "lucide-react";
import { formatKSTDateTime } from "../../../utils/dateUtils";

export default function SharedSenderConfirmModal({
  sharedSenderConfirmModalItem,
  setSharedSenderConfirmModalItem,
  confirmSubmitting,
  handleConfirmSenderDismiss
}) {
  if (!sharedSenderConfirmModalItem) return null;

  return (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget && !confirmSubmitting) setSharedSenderConfirmModalItem(null);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-indigo-500/50 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20 text-white shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black flex items-center gap-1.5">
                    <span>공유 대상자 회신(답변) 확인 및 처리</span>
                  </h3>
                  <p className="text-[11px] opacity-90">
                    동료 작업자들의 회신 내용을 확인 후 일정을 최종 처리합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={confirmSubmitting}
                onClick={() => setSharedSenderConfirmModalItem(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
              {/* Notice Box */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">회신 확인 및 최종 삭제 절차</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    공유한 작업자들이 보낸 답장 내용을 확인한 후, [완료 처리] 또는 [완전 삭제]를 선택하실 수 있습니다.
                  </p>
                </div>
              </div>

              {/* My Schedule Info */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">등록 일자:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{sharedSenderConfirmModalItem.startDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">구분 / 내용:</span>
                  <span className="font-black text-slate-900 dark:text-slate-100">
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 mr-1.5">
                      {sharedSenderConfirmModalItem.leaveType}
                    </span>
                    {sharedSenderConfirmModalItem.reason || sharedSenderConfirmModalItem.leaveType}
                  </span>
                </div>
              </div>

              {/* Shared Recipients Status List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                    <span>공유 작업자별 회신 현황</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    총 {sharedSenderConfirmModalItem.sharedWithDetails?.length || sharedSenderConfirmModalItem.sharedWith?.length || 0}명
                  </span>
                </div>

                <div className="space-y-2">
                  {(() => {
                    const details = sharedSenderConfirmModalItem.sharedWithDetails || [];
                    const simpleNames = sharedSenderConfirmModalItem.sharedWith || [];

                    if (details.length === 0 && simpleNames.length === 0) {
                      return (
                        <div className="p-3 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                          공유 대상 작업자가 없습니다.
                        </div>
                      );
                    }

                    // Render detailed recipients
                    if (details.length > 0) {
                      return details.map((r, idx) => {
                        const isReplied = r.status === "REPLIED" || Boolean(r.replyText);
                        return (
                          <div
                            key={r.id || idx}
                            className={`p-3 rounded-xl border transition-all ${
                              isReplied
                                ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
                                : "bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <span>
                                  [{r.plant || "공장"}] {r.name} {r.title || "선임"}
                                </span>
                              </span>
                              {isReplied ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10.5px] font-black flex items-center gap-1">
                                  <CheckCheck className="w-3 h-3" />
                                  <span>회신 완료</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10.5px] font-black flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>답변 대기중</span>
                                </span>
                              )}
                            </div>

                            {isReplied ? (
                              <div className="mt-1.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                                <p className="font-bold text-slate-800 dark:text-slate-100">
                                  💬 "{r.replyText || "확인했습니다"}"
                                </p>
                                {r.replyAt && (
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    회신 시간: {formatKSTDateTime(r.replyAt)}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-[11px] text-amber-700 dark:text-amber-300 italic mt-0.5">
                                아직 작업자의 답장이 등록되지 않았습니다.
                              </p>
                            )}
                          </div>
                        );
                      });
                    }

                    // Fallback to simpleNames
                    return simpleNames.map((name, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-xs flex items-center justify-between"
                      >
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{name}</span>
                        </span>
                        <span className="text-[11px] text-slate-400">공유됨</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                disabled={confirmSubmitting}
                onClick={() => setSharedSenderConfirmModalItem(null)}
                className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                닫기 (유지)
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={confirmSubmitting}
                  onClick={() => handleConfirmSenderDismiss("delete")}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{confirmSubmitting ? "처리 중..." : "✓ 회신 확인 및 완료 삭제"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
  );
}
