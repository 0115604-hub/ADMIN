import React from "react";
import { createPortal } from "react-dom";
import {
  ListOrdered,
  CheckCircle2,
  Calendar,
  Shield,
  MessageSquare,
  Edit3,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Trash2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Plus
} from "lucide-react";
import { isMeetingExpired, isIssueClosed } from "../../services/urgentIssueService";
import { getKSTDateString } from "../../utils/dateUtils";
import { useModalHistory } from "../../utils/modalHistory";

const getIssueOpinionCount = (item) => {
  if (!item) return 0;
  const replyCount = Array.isArray(item.replies) ? item.replies.length : 0;
  const hasAction = typeof item.actionResult === "string" && item.actionResult.trim().length > 0;
  if (replyCount > 0) return replyCount;
  return hasAction ? 1 : 0;
};

export const IssueLedgerModal = ({
  isOpen,
  onClose,
  urgentIssues,
  filteredIssues,
  restoreToast,
  setRestoreToast,
  ledgerCategoryTab,
  setLedgerCategoryTab,
  selectedScheduleDate,
  setSelectedScheduleDate,
  issueModalPage,
  setIssueModalPage,
  openIssueScheduleDays,
  allQualityAlerts,
  allMeetings,
  allQualityIssues,
  allNotices,
  closedQualityAlertCount = 0,
  closedMeetingCount = 0,
  closedQualityIssueCount = 0,
  closedNoticeCount = 0,
  totalClosedCount = 0,
  selectedListItem,
  openActionMenuId,
  setOpenActionMenuId,
  onOpenEditIssue,
  onExecuteMeetingResult,
  onExecuteEditContent,
  onExecuteRestore,
  onExecuteCancelRestore,
  onOpenDeleteModal,
  onOpenNewIssue
}) => {
  useModalHistory(isOpen, onClose, "issueLedgerModal");

  const sortedFilteredIssues = React.useMemo(() => {
    if (!Array.isArray(filteredIssues)) return [];
    return [...filteredIssues].sort((a, b) => {
      const timeA = a.createdAt || a.updatedAt || a.date || a.startDate || a.expireDate || "";
      const timeB = b.createdAt || b.updatedAt || b.date || b.startDate || b.expireDate || "";
      if (timeA !== timeB) {
        return timeB.localeCompare(timeA);
      }
      return String(b.id || "").localeCompare(String(a.id || ""));
    });
  }, [filteredIssues]);

  if (!isOpen || typeof document === "undefined") return null;

  const ISSUES_PER_PAGE = 5;
  const totalIssuePages = Math.max(1, Math.ceil(sortedFilteredIssues.length / ISSUES_PER_PAGE));
  const validIssuePage = Math.min(Math.max(1, issueModalPage), totalIssuePages);
  const paginatedIssues = sortedFilteredIssues.slice(
    (validIssuePage - 1) * ISSUES_PER_PAGE,
    validIssuePage * ISSUES_PER_PAGE
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-4 py-2 sm:py-8 flex justify-center items-start sm:items-center animate-fadeIn cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-3 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 sm:space-y-4 my-auto animate-scaleUp text-xs max-h-[94vh] flex flex-col cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white shadow-md shrink-0">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  부적합경보 • 회의일정 • 사내공지 • 오픈이슈 관리목록
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  총 {sortedFilteredIssues.length}건 (종료 {totalClosedCount}건)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                완료·종결된 항목은 중간 실선(취소선)으로 표시되며, 시간순으로 자동 정렬됩니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* Restore Toast Notification */}
        {restoreToast && (
          <div className="p-2.5 rounded-xl bg-emerald-500 text-white text-xs font-black flex items-center justify-between shadow-md animate-bounce">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{restoreToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setRestoreToast("")}
              className="text-white/80 hover:text-white text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 🌟 Modal Category Tabs: [전체] [부적합경보] [회의일정] [오픈이슈] [사내공지] (종료 건수 표시, 종결삭제관리 탭 삭제 완료!) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto shrink-0">
          {/* 0) 전체보기 */}
          <button
            type="button"
            onClick={() => {
              setLedgerCategoryTab("all");
              setSelectedScheduleDate("");
              setIssueModalPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
              ledgerCategoryTab === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>전체</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
              {totalClosedCount}
            </span>
          </button>

          {/* 1) 부적합경보 */}
          <button
            type="button"
            onClick={() => {
              setLedgerCategoryTab((prev) => (prev === "quality_alert" ? "all" : "quality_alert"));
              setSelectedScheduleDate("");
              setIssueModalPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
              ledgerCategoryTab === "quality_alert"
                ? "bg-rose-600 text-white shadow-md ring-1 ring-rose-400/40"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>🚨 부적합경보</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200">
              {closedQualityAlertCount}
            </span>
          </button>

          {/* 2) 회의일정 */}
          <button
            type="button"
            onClick={() => {
              setLedgerCategoryTab((prev) => (prev === "meeting" ? "all" : "meeting"));
              setSelectedScheduleDate("");
              setIssueModalPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
              ledgerCategoryTab === "meeting"
                ? "bg-purple-600 text-white shadow-md ring-1 ring-purple-400/40"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>📅 회의일정</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200">
              {closedMeetingCount}
            </span>
          </button>

          {/* 3) 오픈이슈 */}
          <button
            type="button"
            onClick={() => {
              setLedgerCategoryTab((prev) => (prev === "open_issue" || prev === "quality_issue" ? "all" : "open_issue"));
              setIssueModalPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
              ledgerCategoryTab === "open_issue" || ledgerCategoryTab === "quality_issue"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md ring-1 ring-blue-400/40"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>📌 오픈이슈</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200">
              {closedQualityIssueCount}
            </span>
          </button>

          {/* 4) 사내공지 */}
          <button
            type="button"
            onClick={() => {
              setLedgerCategoryTab((prev) => (prev === "notice" ? "all" : "notice"));
              setSelectedScheduleDate("");
              setIssueModalPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
              ledgerCategoryTab === "notice"
                ? "bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400/40"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>📢 사내공지</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200">
              {closedNoticeCount}
            </span>
          </button>
        </div>

        {/* Modal Body - Scrollable (한줄짜리 패널 목록) */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-[68vh] mt-2">
          <div className="space-y-1.5">
            {paginatedIssues.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-lg">📭</div>
                <p>
                  {ledgerCategoryTab === "quality_alert"
                    ? "등록된 부적합경보 내역이 없습니다."
                    : ledgerCategoryTab === "meeting"
                    ? "등록된 회의일정 내역이 없습니다."
                    : ledgerCategoryTab === "open_issue" || ledgerCategoryTab === "quality_issue"
                    ? "등록된 오픈이슈 내역이 없습니다."
                    : ledgerCategoryTab === "notice"
                    ? "등록된 사내공지 내역이 없습니다."
                    : "등록된 관리목록 이력이 없습니다."}
                </p>
              </div>
            ) : (
              paginatedIssues.map((it, idx) => {
                const isCurrent = selectedListItem?.id === it.id;
                const isItMeeting = it.category === "회의일정" || it.category === "meeting" || String(it.category || "").includes("회의");
                const isItNotice = it.category === "공지사항" || it.category === "사내공지" || it.category === "공유사항" || it.category === "notice" || String(it.category || "").includes("공지");
                const isItQualityAlert = it.category === "품질경보" || it.category === "부적합경보" || it.category === "quality_alert" || String(it.category || "").includes("품질경보") || String(it.category || "").includes("부적합경보");
                const todayStr = getKSTDateString();
                
                // 🌟 항목 종료 상태 판별
                const isClosed = isIssueClosed(it, todayStr);
                const isItDeleted = Boolean(it.isDeleted || it.deleted === true || it.status === "DELETED");

                return (
                  <div
                    key={it.id || idx}
                    onClick={() => onOpenEditIssue(it, null, true, false)}
                    className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all flex items-center justify-between gap-2 sm:gap-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-md active:scale-[0.99] ${
                      isCurrent
                        ? "bg-blue-50/95 dark:bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/30 shadow-md scale-[1.005]"
                        : isClosed
                        ? "bg-slate-100/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-slate-200/60 opacity-80"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300"
                    }`}
                    title="클릭 시 상세 내용 및 수정 화면으로 이동"
                  >
                    {/* 1. 맨 왼쪽: 카테고리 뱃지 & 등록일자 */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-black text-white shrink-0 shadow-2xs ${
                        isItQualityAlert
                          ? "bg-rose-600"
                          : isItMeeting
                          ? "bg-purple-600"
                          : isItNotice
                          ? "bg-emerald-600"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600"
                      }`}>
                        {isItQualityAlert ? "🚨 부적합경보" : isItMeeting ? "📅 회의일정" : isItNotice ? "📢 사내공지" : "📌 오픈이슈"}
                      </span>

                      {/* 📅 등록일자 (발생일) 표시 */}
                      <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-[10.5px] font-mono font-bold bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 inline-flex items-center gap-1 shadow-2xs" title="등록일자">
                        <Calendar className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>
                          {isItQualityAlert
                            ? `등록일: ${it.date || it.startDate || (it.createdAt ? it.createdAt.slice(0, 10) : it.expireDate || "-")}`
                            : isItMeeting
                            ? `회의: ${it.startDate || it.date || it.expireDate || "-"}`
                            : isItNotice
                            ? `등록: ${it.date || it.startDate || (it.createdAt ? it.createdAt.slice(0, 10) : "-")}`
                            : `일정: ${it.startDate || it.date || (it.createdAt ? it.createdAt.slice(0, 10) : "-")}`}
                        </span>
                      </span>
                    </div>

                    {/* 2. 중앙: 제목 및 내용 (🌟 완료/종결된 항목은 중간 실선 그어주기) */}
                    <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs sm:text-[13px] break-words ${
                        isClosed
                          ? "line-through text-slate-400 dark:text-slate-500 font-medium decoration-slate-400 dark:decoration-slate-500 decoration-2"
                          : isCurrent
                          ? "font-black text-blue-950 dark:text-blue-100"
                          : "font-bold text-slate-900 dark:text-slate-100"
                      }`}>
                        {it.title || it.content}
                      </span>

                      {/* 완료/종결 뱃지 */}
                      {isClosed && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                          {isItDeleted ? "삭제됨" : isItMeeting ? "회의종결" : "완료"}
                        </span>
                      )}

                      <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800 shrink-0 inline-flex items-center gap-0.5" title="조치결과 및 의견 수">
                        💬 {getIssueOpinionCount(it)}
                      </span>
                    </div>

                    {/* 3. 우측: 심플한 수정 및 삭제/재등록 버튼 */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* 1. 수정 -> 전체 내용 수정 화면 직결 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditIssue(it, e, true, false);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                        title="전체 내용 수정"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>수정</span>
                      </button>

                      {/* 2. 재등록 (종료된 건은 첫 화면에 다시 올리기 지원) */}
                      {isClosed && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onExecuteRestore(it, e);
                          }}
                          className="px-2 py-1 rounded-lg text-[10.5px] font-black bg-blue-600 hover:bg-blue-700 text-white shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center gap-0.5"
                          title="첫 화면에 재등록"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>재등록</span>
                        </button>
                      )}

                      {/* 3. 삭제 버튼 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDeleteModal(it, e, Boolean(it.isDeleted));
                        }}
                        className={`p-1 sm:p-1.5 rounded-lg border shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0 flex items-center justify-center ${
                          it.isDeleted
                            ? "bg-rose-700 hover:bg-rose-800 text-white border-rose-800"
                            : "bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-950/80 dark:hover:bg-rose-600 dark:text-rose-300 dark:hover:text-white border border-rose-300 dark:border-rose-700"
                        }`}
                        title={it.isDeleted ? "데이터베이스에서 영구 삭제" : "이 항목 삭제"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 5-Item Pagination */}
          {totalIssuePages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={validIssuePage <= 1}
                  onClick={() => setIssueModalPage(1)}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  title="첫 페이지"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={validIssuePage <= 1}
                  onClick={() => setIssueModalPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-0.5 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>이전</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalIssuePages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setIssueModalPage(pageNum)}
                    className={`w-6 h-6 rounded-lg font-black text-xs transition-all cursor-pointer ${
                      pageNum === validIssuePage
                        ? "bg-blue-600 text-white shadow-xs scale-105"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={validIssuePage >= totalIssuePages}
                  onClick={() => setIssueModalPage((p) => Math.min(totalIssuePages, p + 1))}
                  className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-0.5 cursor-pointer"
                >
                  <span>다음</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={validIssuePage >= totalIssuePages}
                  onClick={() => setIssueModalPage(totalIssuePages)}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  title="마지막 페이지"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Fixed Action Buttons */}
        <div className="pt-2.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => {
              const targetCat =
                ledgerCategoryTab === "meeting"
                  ? "회의일정"
                  : ledgerCategoryTab === "notice"
                  ? "공지사항"
                  : ledgerCategoryTab === "quality_alert"
                  ? "품질경보"
                  : "오픈이슈";
              onOpenNewIssue(targetCat);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-black shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ 신규 등록</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black hover:bg-slate-200 dark:hover:bg-slate-700 text-xs cursor-pointer shadow-xs"
          >
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
