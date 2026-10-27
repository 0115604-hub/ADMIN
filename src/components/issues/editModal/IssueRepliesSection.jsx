import { MessageSquare } from "lucide-react";

export default function IssueRepliesSection({
  editingIssue,
  newIssueForm,
  allWorkers = [],
  replyForm,
  setReplyForm,
  isSubmittingReply,
  onModalAddReply,
  onModalDeleteReply
}) {
  if (!editingIssue || newIssueForm.category === "오픈이슈" || newIssueForm.category === "품질경보" || newIssueForm.category === "부적합경보") {
    return null;
  }

  return (
    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
          <span>회신 및 참석 코멘트 ({newIssueForm.replies?.length || 0}건)</span>
        </span>
      </div>

      {newIssueForm.replies && newIssueForm.replies.length > 0 && (
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {newIssueForm.replies.map((rep) => (
            <div
              key={rep.id}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 space-y-1 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black shrink-0 ${
                    rep.attendanceStatus === "참석"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}>
                    {rep.attendanceStatus || "확인"}
                  </span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    {rep.author}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-auto">
                  <span className="text-[9.5px] text-slate-400 font-mono">
                    {rep.createdAt?.slice(5) || ""}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => onModalDeleteReply(rep.id, e)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                    title="회신 삭제"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white break-words whitespace-pre-wrap leading-relaxed">
                {rep.content}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-1 flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
        <select
          value={replyForm.author || ""}
          onChange={(e) => setReplyForm({ ...replyForm, author: e.target.value })}
          className="px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white shrink-0"
        >
          <option value="">-- 작성자 선택 --</option>
          <optgroup label="👑 본사 임원진">
            {allWorkers?.filter((w) => w.plantName === "본사").map((w) => (
              <option key={w.id} value={w.name}>본사 • {w.name} {w.title || ""}</option>
            ))}
          </optgroup>
          <optgroup label="🏢 삼랑진공장">
            {allWorkers?.filter((w) => w.plantName === "삼랑진공장" && !w.isPartner).map((w) => (
              <option key={w.id} value={w.name}>삼랑진 • {w.name} {w.title || ""}</option>
            ))}
          </optgroup>
          <optgroup label="🏢 한림공장">
            {allWorkers?.filter((w) => w.plantName === "한림공장" && !w.isPartner).map((w) => (
              <option key={w.id} value={w.name}>한림 • {w.name} {w.title || ""}</option>
            ))}
          </optgroup>
          <optgroup label="🤝 협력업체">
            {allWorkers?.filter((w) => w.isPartner).map((w) => (
              <option key={w.id} value={w.name}>협력 • {w.name} ({w.plantName})</option>
            ))}
          </optgroup>
        </select>
        {newIssueForm.category === "회의일정" && (
          <select
            value={replyForm.attendanceStatus}
            onChange={(e) => setReplyForm({ ...replyForm, attendanceStatus: e.target.value })}
            className="px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white shrink-0"
          >
            <option value="참석">참석</option>
            <option value="불참">불참</option>
            <option value="확인">확인</option>
          </select>
        )}
        <input
          type="text"
          placeholder="회신 또는 전달 내용을 입력해 주세요"
          value={replyForm.content}
          onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })}
          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white min-w-[140px]"
        />
        <button
          type="button"
          disabled={isSubmittingReply}
          onClick={onModalAddReply}
          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shrink-0 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
        >
          회신 등록
        </button>
      </div>
    </div>
  );
}
