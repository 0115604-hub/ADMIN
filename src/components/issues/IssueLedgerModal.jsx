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
  allClosedDeletedIssues,
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
  if (!isOpen || typeof document === "undefined") return null;

  const ISSUES_PER_PAGE = 5;
  const totalIssuePages = Math.max(1, Math.ceil(filteredIssues.length / ISSUES_PER_PAGE));
  const validIssuePage = Math.min(Math.max(1, issueModalPage), totalIssuePages);
  const paginatedIssues = filteredIssues.slice(
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
                  품질경보 • 회의일정 • 사내공지 • 오픈이슈 관리목록
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  총 {urgentIssues?.length || 0}건
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                등록된 이력 목록을 조회하고, 항목 선택 또는 우측 <strong>[복구]</strong> 버튼으로 첫화면에 다시 활성화할 수 있습니다.
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

        {/* 🌟 Modal Category Tabs (순서: 품질경보 -> 회의일정 -> 오픈이슈 -> 사내공지 -> 종결삭제관리) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto shrink-0">
          {/* 1) 품질경보 */}
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
            <span>🚨 품질경보</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200">
              {allQualityAlerts?.length || 0}
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
              {allMeetings?.length || 0}
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
              {allQualityIssues?.length || 0}
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
              {allNotices?.length || 0}
            </span>
          </button>

          {/* 5) 종결삭제관리 */}
          <button
            type="button"
            onClick={() => {
              setLedgerCategoryTab((prev) => (prev === "closed_deleted" || prev === "deleted" ? "all" : "closed_deleted"));
              setSelectedScheduleDate("");
              setIssueModalPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95 ${
              ledgerCategoryTab === "closed_deleted" || ledgerCategoryTab === "deleted"
                ? "bg-slate-700 text-white shadow-md ring-1 ring-slate-400/40"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>🗂️ 종결삭제관리</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
              {allClosedDeletedIssues?.length || 0}
            </span>
          </button>
        </div>



        {/* 🗂️ [종결삭제관리 전용 안내 바] */}
        {(ledgerCategoryTab === "closed_deleted" || ledgerCategoryTab === "deleted") && (
          <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Shield className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-bold">
                종결 및 삭제 보관 항목 ({allClosedDeletedIssues?.length || 0}건) — <strong>[첫화면 복구]</strong>로 다시 게시하거나, <strong>[영구삭제 (Admin)]</strong>로 DB에서 영구 파기할 수 있습니다.
              </span>
            </div>
          </div>
        )}

        {/* Modal Body - Scrollable (한줄짜리 패널 목록) */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-[68vh] mt-2">
          <div className="space-y-1.5">
            {paginatedIssues.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-lg">📭</div>
                <p>
                  {ledgerCategoryTab === "closed_deleted" || ledgerCategoryTab === "deleted"
                    ? "종결 또는 삭제/만료된 내역이 없습니다."
                    : ledgerCategoryTab === "quality_alert"
                    ? "현재 진행중인 품질경보 내역이 없습니다."
                    : ledgerCategoryTab === "meeting"
                    ? "현재 예정된 회의일정 내역이 없습니다."
                    : ledgerCategoryTab === "open_issue" || ledgerCategoryTab === "quality_issue"
                    ? "현재 진행중인 오픈이슈 내역이 없습니다."
                    : ledgerCategoryTab === "notice"
                    ? "현재 게시중인 사내공지 내역이 없습니다."
                    : "등록된 미결 관리대장 이력이 없습니다."}
                </p>
              </div>
            ) : (
              paginatedIssues.map((it, idx) => {
                const isCurrent = selectedListItem?.id === it.id;
                const isItMeeting = it.category === "회의일정";
                const isItNotice = it.category === "공지사항" || it.category === "사내공지" || it.category === "공유사항";
                const isItQualityAlert = it.category === "품질경보";
                const isItDeleted = Boolean(it.isDeleted);
                const hasAction = typeof it.actionResult === "string" && it.actionResult.trim().length > 0;
                const isItResolved = Boolean(it.isResolved || hasAction);
                const isItUnresolved = !isItDeleted && !isItResolved;
                const itemNum = (validIssuePage - 1) * ISSUES_PER_PAGE + idx + 1;

                return (
                  <div
                    key={it.id || idx}
                    onClick={() => onOpenEditIssue(it, null, true, false)}
                    className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all flex items-center justify-between gap-2 sm:gap-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-md active:scale-[0.99] ${
                      isCurrent
                        ? "bg-blue-50/95 dark:bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/30 shadow-md scale-[1.005]"
                        : isItDeleted
                        ? "bg-slate-100/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-slate-200/60 opacity-80"
                        : isItUnresolved
                        ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100/50"
                        : "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50 hover:bg-emerald-100/40"
                    }`}
                    title="클릭 시 전체 내용 수정 화면으로 이동"
                  >
                    {/* 1. 맨 왼쪽: 카테고리 뱃지 */}
                    <span className={`px-2 py-0.5 rounded text-[10.5px] font-black text-white shrink-0 shadow-2xs ${
                      isItQualityAlert
                        ? "bg-rose-600"
                        : isItMeeting
                        ? "bg-purple-600"
                        : isItNotice
                        ? "bg-emerald-600"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600"
                    }`}>
                      {isItQualityAlert ? "🚨 품질경보" : isItMeeting ? "📅 회의일정" : isItNotice ? "📢 사내공지" : "📌 오픈이슈"}
                    </span>

                    {/* 2. 중앙: 제목 및 내용 */}
                    <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs sm:text-[13px] truncate ${
                        isCurrent
                          ? "font-black text-blue-950 dark:text-blue-100"
                          : isItDeleted
                          ? "font-semibold text-slate-700 dark:text-slate-300"
                          : isItUnresolved
                          ? "font-black text-amber-950 dark:text-amber-200"
                          : "font-bold text-slate-900 dark:text-slate-100"
                      }`}>
                        {it.title || it.content}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800 shrink-0 inline-flex items-center gap-0.5" title="조치결과 및 의견 수">
                        💬 {getIssueOpinionCount(it)}
                      </span>
                    </div>

                    {/* 3. 우측: 심플한 수정 및 삭제/재등록 버튼 */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isItDeleted ? (
                        <>
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

                          {/* 2. 재등록 */}
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

                          {/* 3. 영구삭제 */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDeleteModal(it, e, true);
                            }}
                            className="px-2 py-1 rounded-lg text-[10.5px] font-black bg-rose-700 hover:bg-rose-800 text-white shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center gap-0.5"
                            title="데이터베이스에서 영구 삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>삭제</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {/* 조치완료 상태 표시 */}
                          {isItResolved && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                              {isItMeeting ? "회의종결" : "조치완료"}
                            </span>
                          )}

                          {/* 1. 수정 버튼 -> 전체 내용 수정 화면 직결 */}
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

                          {/* 2. 삭제 버튼 (빨간색 뱃지로 시인성 개선) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDeleteModal(it, e, false);
                            }}
                            className="p-1 sm:p-1.5 rounded-lg bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-950/80 dark:hover:bg-rose-600 dark:text-rose-300 dark:hover:text-white border border-rose-300 dark:border-rose-700 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0 flex items-center justify-center"
                            title="이 항목 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
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
