import React from "react";
import {
  Sparkles,
  X,
  Send,
  MessageCircle
} from "lucide-react";

export default function SharedReplyModal({
  sharedReplyModalItem,
  setSharedReplyModalItem,
  replySubmitting,
  replyTextInput,
  setReplyTextInput,
  handleSendSharedReply
}) {
  if (!sharedReplyModalItem) return null;

  return (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget && !replySubmitting) setSharedReplyModalItem(null);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-purple-500/50 w-full max-w-lg overflow-hidden animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20 text-white shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black flex items-center gap-1.5">
                    <span>공유 일정 답장 및 완전 삭제</span>
                  </h3>
                  <p className="text-[11px] opacity-90">
                    보낸 작업자에게 답장을 전송하면 내 일정에서 완전 삭제됩니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={replySubmitting}
                onClick={() => setSharedReplyModalItem(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Notice Box */}
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">공유 일정 확인 및 회신 안내</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    공유받은 일정은 보낸 작업자에게 확인 답장을 보내면 내 화면 및 데이터에서 즉시 완전 삭제되며, 보낸 작업자에게는 답장 내용이 전달됩니다.
                  </p>
                </div>
              </div>

              {/* Sender & Schedule Info Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">보낸 사람:</span>
                  <span className="font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                    {sharedReplyModalItem.sharedByPlant ? `[${sharedReplyModalItem.sharedByPlant}] ` : ""}
                    {sharedReplyModalItem.sharedBy || "동료 작업자"}
                    {sharedReplyModalItem.sharedByTitle ? ` ${sharedReplyModalItem.sharedByTitle}` : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">일정 일자:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {sharedReplyModalItem.startDate}
                    {sharedReplyModalItem.endDate && sharedReplyModalItem.endDate !== sharedReplyModalItem.startDate ? ` ~ ${sharedReplyModalItem.endDate}` : ""}
                  </span>
                </div>
                <div className="flex items-start justify-between text-xs gap-2">
                  <span className="font-bold text-slate-500 shrink-0">내용 / 구분:</span>
                  <span className="font-black text-slate-900 dark:text-slate-100 text-right">
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 mr-1.5">
                      {sharedReplyModalItem.leaveType}
                    </span>
                    {sharedReplyModalItem.reason || sharedReplyModalItem.leaveType}
                  </span>
                </div>
              </div>

              {/* Quick Reply Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500">빠른 답장 선택:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "확인했습니다 👍",
                    "일정 인지했습니다. 수고하세요! 🙇",
                    "당일 업무 지원 가능합니다 ✅",
                    "확인 완료했습니다 🙆‍♂️",
                    "일정 확인 완료 (이상 무)"
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => setReplyTextInput(phrase)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        replyTextInput === phrase
                          ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>보낸 작업자에게 전달할 답장 내용:</span>
                  <span className="text-[10.5px] text-purple-600 font-bold">* 필수 입력</span>
                </label>
                <textarea
                  rows={3}
                  value={replyTextInput}
                  onChange={(e) => setReplyTextInput(e.target.value)}
                  placeholder="예: 확인했습니다! 해당 일자 일정 숙지하겠습니다."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none font-medium"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={replySubmitting}
                onClick={() => setSharedReplyModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                취소 (일정 유지)
              </button>
              <button
                type="button"
                disabled={replySubmitting || !replyTextInput.trim()}
                onClick={handleSendSharedReply}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-purple-500/25 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{replySubmitting ? "답장 전송 중..." : "💬 답장 전송 및 내 일정 완전 삭제"}</span>
              </button>
            </div>
          </div>
        </div>
  );
}
