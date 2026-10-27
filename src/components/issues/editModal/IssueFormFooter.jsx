import { Save } from "lucide-react";

export default function IssueFormFooter({
  onClose,
  editingIssue,
  newIssueForm
}) {
  return (
    <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs transition-all active:scale-95"
      >
        닫기
      </button>

      <button
        type="submit"
        className={`px-6 py-2.5 rounded-xl text-white font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
          newIssueForm.category === "회의일정"
            ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-500/25"
            : newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지"
            ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-500/25"
            : newIssueForm.category === "오픈이슈"
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25"
            : "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-rose-500/25"
        }`}
      >
        <Save className="w-4 h-4" />
        <span>
          {editingIssue
            ? "최종등록"
            : newIssueForm.category === "회의일정"
            ? "회의일정 등록"
            : newIssueForm.category === "공지사항" || newIssueForm.category === "사내공지"
            ? "사내공지 등록"
            : newIssueForm.category === "오픈이슈"
            ? "오픈이슈 등록"
            : "부적합경보 등록"}
        </span>
      </button>
    </div>
  );
}
