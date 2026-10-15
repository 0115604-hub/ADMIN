import React from "react";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  MessageSquare,
  Clock,
  Lock,
  Edit3,
  Trash2,
  Plus
} from "lucide-react";

export const DailyWorkLogTableSection = ({
  isMyeongjae,
  isDongwook,
  isAdmin,
  pendingSamrangjinCount = 0,
  pendingHallimCount = 0,
  setIsWorkLogsSummaryModalOpen,
  filterPlant,
  setFilterPlant,
  workLogs = [],
  pushModalHistory,
  paginatedLogs = [],
  handleOpenLogDetail,
  canApproveLog,
  isWorkLogApproved,
  handleOpenEditModal,
  handleDeleteLog,
  currentProfile,
  filteredLogs = [],
  currentLogPage = 1,
  setCurrentLogPage,
  LOGS_PER_PAGE = 12,
  totalLogPages = 1,
  handleOpenWorkLogModal
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5 min-w-0 max-w-full overflow-hidden">
      {/* Manager Dedicated Information Banners (No batch approval - Requires reading details) */}
      {isMyeongjae && pendingSamrangjinCount > 0 && (
        <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-wrap items-center justify-between gap-2 animate-fadeIn min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
              결재
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-xs text-amber-900 dark:text-amber-200">
                [이명재 총괄이사] 삼랑진공장 결재 대기 업무일지가{" "}
                <strong className="text-rose-600 dark:text-rose-400 underline font-black">
                  {pendingSamrangjinCount}건
                </strong>{" "}
                있습니다.
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.2">
                목록에서 업무일지를 클릭하여 세부 작업 내용을 꼼꼼히 확인하신 후 결재를 진행해 주세요.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => setIsWorkLogsSummaryModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            >
              <span>대기 일지 확인 및 승인</span>
            </button>
            <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[11px] font-black">
              {pendingSamrangjinCount}건
            </span>
          </div>
        </div>
      )}

      {isDongwook && pendingHallimCount > 0 && (
        <div className="p-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex flex-wrap items-center justify-between gap-2 animate-fadeIn min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
              결재
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-xs text-emerald-900 dark:text-emerald-200">
                [김동욱 총괄책임] 한림공장 결재 대기 업무일지가{" "}
                <strong className="text-rose-600 dark:text-rose-400 underline font-black">
                  {pendingHallimCount}건
                </strong>{" "}
                있습니다.
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.2">
                목록에서 업무일지를 클릭하여 세부 작업 내용을 꼼꼼히 확인하신 후 결재를 진행해 주세요.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => setIsWorkLogsSummaryModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            >
              <span>대기 일지 확인 및 승인</span>
            </button>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[11px] font-black">
              {pendingHallimCount}건
            </span>
          </div>
        </div>
      )}

      {isAdmin && (pendingSamrangjinCount > 0 || pendingHallimCount > 0) && (
        <div className="p-2.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-wrap items-center justify-between gap-2 animate-fadeIn min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
              ADMIN
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-xs text-blue-900 dark:text-blue-200 truncate">
                [관리자 결재 현황] 삼랑진{" "}
                <strong className="text-blue-600 dark:text-blue-400">{pendingSamrangjinCount}건</strong> • 한림{" "}
                <strong className="text-emerald-600 dark:text-emerald-400">{pendingHallimCount}건</strong> 결재 대기중
              </p>
              <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.2 truncate">
                각 업무일지를 탭하여 세부 내용을 검토하신 후 전자결재를 진행할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsWorkLogsSummaryModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all ml-auto sm:ml-0 shrink-0"
          >
            <span>전체 대기 일지 확인 및 승인</span>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 truncate">
          <h2 className="text-xs sm:text-base font-black text-slate-900 dark:text-white truncate">
            5. 일일업무일지 현황
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <select
            value={filterPlant}
            onChange={(e) => setFilterPlant(e.target.value)}
            className="px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="all">전체 ({workLogs.length})</option>
            <option value="본사">
              본사 (
              {
                workLogs.filter(
                  (l) =>
                    l.plant === "본사" ||
                    l.writer === "권태형" ||
                    l.writer === "최미영" ||
                    l.department === "본사 관리팀"
                ).length
              }
              )
            </option>
            <option value="삼랑진공장">
              삼랑진 (
              {
                workLogs.filter(
                  (l) =>
                    (l.plant === "삼랑진공장" || !l.plant) &&
                    l.plant !== "본사" &&
                    l.writer !== "권태형" &&
                    l.writer !== "최미영" &&
                    !["김동욱", "TEST", "오상민", "정현규", "부림텍", "한울"].includes(l.writer)
                ).length
              }
              )
            </option>
            <option value="한림공장">
              한림 (
              {
                workLogs.filter(
                  (l) =>
                    l.plant === "한림공장" ||
                    ["김동욱", "TEST", "오상민", "정현규", "부림텍", "한울"].includes(l.writer)
                ).length
              }
              )
            </option>
          </select>
          <button
            type="button"
            onClick={() => {
              if (pushModalHistory) pushModalHistory("recent_work_logs_summary_modal");
              setIsWorkLogsSummaryModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black border border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/50 shadow-xs shadow-emerald-500/20 animate-pulse transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
            title="최근일 기준 전작업자 업무일지 종합 요약보기"
          >
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
            </span>
            <span>업무일지 상세</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
          </button>
        </div>
      </div>

      {/* 한줄 리스트 테이블 */}
      <div className="w-full max-w-full overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse table-fixed min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold h-7 text-[10.5px]">
              <th className="py-1 px-2 w-[10%] text-center">일자</th>
              <th className="py-1 px-2 w-[8%] text-center">공장</th>
              <th className="py-1 px-2 w-[12%]">작성자</th>
              <th className="py-1 px-2 w-[38%]">작업 내용</th>
              <th className="py-1 px-2 w-[10%]">부적합 / 특이사항</th>
              <th className="py-1 px-2 w-[11%] text-center">결재 현황</th>
              <th className="py-1 px-2 w-[11%] text-center">수정 / 관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-5 text-center text-slate-400 font-bold text-xs">
                  등록된 일일업무일지가 없습니다.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log, index) => {
                const currentDate = log.date ? (log.date.length === 10 ? log.date.slice(5) : log.date) : "";
                const prevLog = index > 0 ? paginatedLogs[index - 1] : null;
                const prevDate = prevLog?.date ? (prevLog.date.length === 10 ? prevLog.date.slice(5) : prevLog.date) : "";
                const isSameDateAsPrev = index > 0 && currentDate === prevDate;

                return (
                  <tr
                    key={log.id}
                    onClick={() => handleOpenLogDetail(log)}
                    className="hover:bg-blue-50/70 dark:hover:bg-blue-950/30 cursor-pointer transition-colors h-8 sm:h-8.5 group text-[11px]"
                    title="클릭하여 상세내용 확인 및 결재 진행"
                  >
                    <td className="py-1 px-2 text-center font-bold font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {!isSameDateAsPrev ? (
                        <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-[10.5px]">
                          {currentDate}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-1 px-2 text-center">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9.5px] font-black ${
                          log.plant === "한림공장"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : log.plant === "본사" || log.writer === "권태형" || log.writer === "최미영"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {log.plant === "한림공장"
                          ? "한림"
                          : log.plant === "본사" || log.writer === "권태형" || log.writer === "최미영"
                          ? "본사"
                          : "삼랑진"}
                      </span>
                    </td>
                    <td className="py-1 px-2 font-bold text-slate-900 dark:text-white truncate">
                      {log.writer} {log.title || ""}
                    </td>
                    <td
                      className="py-1 px-2 font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400"
                      title={log.workContent}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{log.workContent}</span>
                        {Array.isArray(log.lineFileMatches) && log.lineFileMatches.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                            {log.lineFileMatches.length}개 라인 매칭
                          </span>
                        )}
                        {Array.isArray(log.images) && log.images.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 shrink-0 flex items-center gap-0.5">
                            <Camera className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                            <span>사진 {log.images.length}장</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-1 px-2 text-slate-500 dark:text-slate-400 truncate" title={log.issues || "-"}>
                      {log.issues && log.issues !== "특이사항 없음" ? log.issues : "-"}
                    </td>

                    {/* 결재 상태 열 */}
                    <td className="py-1 px-2 text-center whitespace-nowrap">
                      {log.approvalStatus === "결재완료" ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9.5px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs"
                          title={`결재자: ${log.approverName || "총괄관리자"} ${log.approverTitle || ""} (${log.approvedAt || ""})${
                            log.approvalComment ? "\n지시사항: " + log.approvalComment : ""
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>
                            {log.approverName ||
                              (log.plant === "본사" || log.writer === "권태형"
                                ? "권태형"
                                : log.plant === "한림공장"
                                ? "김동욱"
                                : "이명재")}{" "}
                            {log.approverTitle ||
                              (log.plant === "본사" || log.writer === "권태형"
                                ? "대표이사"
                                : log.plant === "한림공장"
                                ? "책임"
                                : "이사")}
                          </span>
                          {log.approvalComment && log.approvalComment !== "확인 및 전자결재 승인 완료" && (
                            <span
                              className="p-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200"
                              title={`코멘트: ${log.approvalComment}`}
                            >
                              <MessageSquare className="w-2 h-2" />
                            </span>
                          )}
                        </span>
                      ) : log.approvalStatus === "반려" ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
                          반려됨
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9.5px] font-bold ${
                            canApproveLog && canApproveLog(log)
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{canApproveLog && canApproveLog(log) ? "확인 후 결재" : "결재대기"}</span>
                        </span>
                      )}
                    </td>

                    {/* 수정 / 관리 열 */}
                    <td className="py-1 px-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        {isWorkLogApproved(log) && !isAdmin ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9.5px] font-bold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200/80 dark:border-slate-700 cursor-not-allowed select-none shadow-2xs"
                            title="결재가 완료되어 내용 수정이 불가합니다."
                          >
                            <Lock className="w-2.5 h-2.5" />
                            <span>수정불가</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9.5px] font-black bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/70 dark:text-blue-300 dark:hover:bg-blue-900 border border-blue-300 dark:border-blue-700 shadow-2xs active:scale-95 transition-all cursor-pointer ring-1 ring-blue-400/20"
                            title={isWorkLogApproved(log) ? "관리자 권한으로 내용 수정" : "결재 전 일지 내용 수정"}
                          >
                            <Edit3 className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                            <span>{isWorkLogApproved(log) ? "관리자수정" : "내용수정"}</span>
                          </button>
                        )}

                        {(currentProfile?.name === log.writer || isAdmin) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1 text-slate-300 hover:text-rose-600 transition-colors rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 하단 페이징 컨트롤 및 업무일지 등록 버튼 */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
          <span>
            총 <strong className="text-slate-900 dark:text-white font-mono">{filteredLogs.length}</strong>건 중{" "}
            <strong className="text-blue-600 dark:text-blue-400 font-mono">
              {filteredLogs.length === 0 ? 0 : (currentLogPage - 1) * LOGS_PER_PAGE + 1}
            </strong>
            ~
            <strong className="text-blue-600 dark:text-blue-400 font-mono">
              {Math.min(currentLogPage * LOGS_PER_PAGE, filteredLogs.length)}
            </strong>
            건
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            (페이지당 12개)
          </span>
        </div>

        {/* Pagination Buttons */}
        {totalLogPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              disabled={currentLogPage === 1}
              onClick={() => setCurrentLogPage(1)}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-black text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="첫 페이지"
            >
              «
            </button>
            <button
              disabled={currentLogPage === 1}
              onClick={() => setCurrentLogPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              이전
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalLogPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalLogPages || Math.abs(p - currentLogPage) <= 2)
                .map((p, idx, arr) => {
                  const prevP = arr[idx - 1];
                  const isGap = prevP && p - prevP > 1;
                  return (
                    <React.Fragment key={p}>
                      {isGap && <span className="text-slate-400 text-xs px-0.5">...</span>}
                      <button
                        onClick={() => setCurrentLogPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          currentLogPage === p
                            ? "bg-blue-600 text-white shadow-xs shadow-blue-500/30 scale-105"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              disabled={currentLogPage === totalLogPages}
              onClick={() => setCurrentLogPage((p) => Math.min(totalLogPages, p + 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              다음
            </button>
            <button
              disabled={currentLogPage === totalLogPages}
              onClick={() => setCurrentLogPage(totalLogPages)}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-black text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="마지막 페이지"
            >
              »
            </button>
          </div>
        )}

        <button
          onClick={handleOpenWorkLogModal}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>오늘의 업무일지 등록하기</span>
        </button>
      </div>
    </div>
  );
};
