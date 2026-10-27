import {
  Calendar,
  Megaphone,
  Pin,
  AlertTriangle
} from "lucide-react";

/**
 * IssueModalHeader
 * Top banner with category icon, badges, title, and close button.
 */
export const IssueModalHeader = ({
  newIssueForm,
  editingIssue,
  opinionCount = 0,
  onClose
}) => {
  const category = newIssueForm.category;

  return (
    <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-white shadow-xs shrink-0 ${
          category === "회의일정"
            ? "bg-purple-600"
            : category === "공지사항"
            ? "bg-emerald-600"
            : category === "오픈이슈"
            ? "bg-gradient-to-tr from-blue-600 to-indigo-600"
            : "bg-rose-600"
        }`}>
          {category === "회의일정" ? (
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : category === "공지사항" ? (
            <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : category === "오픈이슈" ? (
            <Pin className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black text-white shrink-0 ${
              category === "회의일정"
                ? "bg-purple-600"
                : category === "공지사항" || category === "사내공지"
                ? "bg-emerald-600"
                : category === "오픈이슈"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                : "bg-rose-600"
            }`}>
              {category === "회의일정"
                ? "📅 회의일정"
                : (category === "공지사항" || category === "사내공지")
                ? "📢 사내공지"
                : category === "오픈이슈"
                ? "📌 오픈이슈"
                : "🚨 부적합경보"}
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {newIssueForm.plant}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black shrink-0 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300" title="조치결과 및 의견 수">
              💬 {opinionCount}건
            </span>
            {editingIssue && (
              <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black shrink-0 ${
                newIssueForm.isResolved
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                  : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 animate-pulse"
              }`}>
                {newIssueForm.isResolved ? "조치완료" : "조치대기"}
              </span>
            )}
          </div>
          <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mt-0.5 truncate">
            {editingIssue
              ? `${newIssueForm.plant} ${category === "공지사항" ? "사내공지" : category} 상세 및 처리`
              : `신규 ${category === "공지사항" ? "사내공지" : category} 등록`}
          </h3>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="닫기"
      >
        ✕
      </button>
    </div>
  );
};

export default IssueModalHeader;
