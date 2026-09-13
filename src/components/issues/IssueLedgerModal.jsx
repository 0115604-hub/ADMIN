import React from "react";
import { createPortal } from "react-dom";
import {
  ListOrdered,
  CheckCircle2,
  Calendar,
  Shield,
  Camera,
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

        {/* 📅 [오픈이슈 전용 일정표] - 오픈이슈 탭에서만 일정표 노출 */}
        {(ledgerCategoryTab === "open_issue" || ledgerCategoryTab === "quality_issue") && (
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/30 border-2 border-blue-500/40 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                <strong className="text-xs sm:text-sm font-black text-blue-300">
                  오픈이슈 조치/목표 일정표 (Schedule Timeline)
                </strong>
              </div>
              {selectedScheduleDate ? (
                <button
                  type="button"
                  onClick={() => setSelectedScheduleDate("")}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-200 underline cursor-pointer"
                >
                  {selectedScheduleDate} 필터 해제 (전체 보기) ✕
                </button>
              ) : (
                <span className="text-[10.5px] text-slate-400">
                  * 날짜 클릭 시 해당 일자 오픈이슈만 필터링됩니다.
                </span>
              )}
            </div>

            {/* 7-Days Schedule Strip */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-xs">
              {openIssueScheduleDays?.map((day) => {
                const isSelected = selectedScheduleDate === day.dateStr;
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedScheduleDate((prev) => (prev === day.dateStr ? "" : day.dateStr));
                      setIssueModalPage(1);
                    }}
                    className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-between min-h-[54px] ${
                      isSelected
                        ? "bg-orange-600 text-white border-orange-400 ring-2 ring-orange-400/50 shadow-md scale-105"
                        : day.isToday
                        ? "bg-orange-950/60 border-orange-500/80 text-orange-200 ring-1 ring-orange-500/30 font-black"
                        : day.totalCount > 0
                        ? "bg-slate-800 border-slate-700 hover:border-orange-400/60 text-slate-200"
                        : "bg-slate-800/40 border-slate-700/50 text-slate-500 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="text-[9.5px] sm:text-[10px] font-mono leading-tight">
                      {day.isToday ? "오늘" : `${day.dateStr.slice(5)}`}
                      <span className="block text-[8.5px] opacity-75">({day.dayName})</span>
                    </div>
                    <div className="mt-1">
                      {day.unresolvedCount > 0 ? (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                          isSelected ? "bg-white text-rose-600" : "bg-rose-600 text-white"
                        }`}>
                          미결 {day.unresolvedCount}
                        </span>
                      ) : day.resolvedCount > 0 ? (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                          isSelected ? "bg-white text-emerald-600" : "bg-emerald-600/80 text-white"
                        }`}>
                          ✓ {day.resolvedCount}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-500">-</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
                const isItResolved = Boolean(it.isResolved);
                const isItUnresolved = !isItDeleted && !isItResolved;
                const itemNum = (validIssuePage - 1) * ISSUES_PER_PAGE + idx + 1;
                const totalImgCount = (it.images?.length || 0) + (it.actionImages?.length || 0);

                return (
                  <div
                    key={it.id || idx}
                    onClick={() => {
                      if (openActionMenuId === it.id) return;
                      onOpenEditIssue(it, null, false, true);
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col gap-1.5 cursor-pointer ${
                      isCurrent
                        ? "bg-blue-50/95 dark:bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/30 shadow-md scale-[1.005]"
                        : isItDeleted
                        ? "bg-slate-100/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-slate-200/60 opacity-80"
                        : isItUnresolved
                        ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100/50"
                        : "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50 hover:bg-emerald-100/40"
                    }`}
                    title="클릭하여 상세 조회"
                  >
                    {/* Row: [맨 왼쪽: 카테고리 뱃지] ── [중앙: 제목 내용] ── [우측: 삭제/상태 뱃지 + 수정 버튼] */}
                    <div className="flex items-center justify-between gap-2 sm:gap-3 w-full min-w-0">
                      {/* 1. 맨 왼쪽: 카테고리 뱃지 (회의일정 / 품질경보 / 사내공지 / 오픈이슈) */}
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

                      {/* 2. 중앙: 제목 및 내용 (충분한 flex-1 min-w-0 공간 확보하여 명확하게 노출) */}
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        <span className={`text-xs sm:text-[13px] truncate block ${
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
                        {totalImgCount > 0 && (
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-0.5 shrink-0 font-bold hidden sm:inline-flex">
                            <Camera className="w-2.5 h-2.5 text-rose-500" />
                            <span>{totalImgCount}</span>
                          </span>
                        )}
                      </div>

                      {/* 3. 우측: 삭제 뱃지 + 수정 버튼 (shrink-0으로 제목과 절대 겹치지 않음) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isItDeleted ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shrink-0">
                            삭제
                          </span>
                        ) : isItResolved ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shrink-0">
                            {isItMeeting ? "회의종결" : "조치완료"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0 animate-pulse">
                            {isItMeeting ? "회의예정" : "조치대기"}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionMenuId((prev) => (prev === it.id ? null : it.id));
                          }}
                          className={`px-2 py-1 rounded-lg text-[10.5px] font-black shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center gap-0.5 border shrink-0 ${
                            openActionMenuId === it.id
                              ? "bg-amber-500 text-slate-950 border-amber-600 shadow-amber-500/25 ring-2 ring-amber-400/40"
                              : "bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                          }`}
                          title="수정 및 결과 입력 메뉴 열기"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>수정</span>
                          {openActionMenuId === it.id ? (
                            <ChevronUp className="w-3 h-3 text-slate-900" />
                          ) : (
                            <ChevronDown className="w-3 h-3 opacity-60" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Row Bottom: Expanded Action Bar */}
                    {openActionMenuId === it.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1.5 flex-wrap animate-fadeIn bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200/80 dark:border-amber-900/50 shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {ledgerCategoryTab === "closed_deleted" || ledgerCategoryTab === "deleted" || isItDeleted ? (
                            <>
                              {/* 1. 내용수정 */}
                              <button
                                type="button"
                                onClick={(e) => onExecuteEditContent(it, e)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                                title="제목, 내용, 일정, 첨부사진 등 내용 수정"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>내용수정</span>
                              </button>

                              {/* 2. 재등록 */}
                              <button
                                type="button"
                                onClick={(e) => onExecuteRestore(it, e)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                                title="첫 화면(실시간 이슈보드)에 재등록"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>재등록</span>
                              </button>

                              {/* 3. 영구삭제 */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenuId(null);
                                  onOpenDeleteModal(it, e, true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 ring-1 ring-rose-500/50 shadow-rose-900/30 text-white font-black text-[11px] shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                                title="데이터베이스에서 영구 삭제 (Admin 전용)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>영구삭제</span>
                              </button>
                            </>
                          ) : (
                            <>
                              {/* 1. 회의결과입력 / 조치결과입력 */}
                              <button
                                type="button"
                                onClick={(e) => onExecuteMeetingResult(it, e)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer text-white ${
                                  isItMeeting
                                    ? "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
                                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                                }`}
                                title={isItMeeting ? "회의 결과 및 결정사항 입력" : "조치 결과 입력"}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isItMeeting ? "회의결과입력" : "조치결과입력"}</span>
                              </button>

                              {/* 2. 내용수정 */}
                              <button
                                type="button"
                                onClick={(e) => onExecuteEditContent(it, e)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                                title="제목, 내용, 일정, 첨부사진 등 내용 수정"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>내용수정</span>
                              </button>

                              {/* 3. 삭제 버튼 */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenuId(null);
                                  onOpenDeleteModal(it, e, false);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-[11px] shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                title="이 항목 삭제 (종결/삭제 관리로 이동)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>삭제</span>
                              </button>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionMenuId(null);
                          }}
                          className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          title="메뉴 닫기"
                        >
                          ✕
                        </button>
                      </div>
                    )}
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
