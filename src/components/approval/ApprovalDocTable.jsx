import React from "react";
import {
  FileText,
  Clock,
  Edit3,
  Trash2
} from "lucide-react";
import {
  isOvertimeApprovalDoc,
  isFourMApprovalDoc,
  isApprovalDocApproved,
  isApprovalDocHold,
  isApprovalDocRejected,
  isApprovalDocPending
} from "../../services/approvalService";

export const formatConciseApprovalTitle = (rawTitle) => {
  if (!rawTitle) return "";
  let str = String(rawTitle).trim();
  str = str.replace(/^\[(특근보고서|근태보고서|삼랑진공장|한림공장|공장취합|통합)\]\s*/g, "");
  str = str.replace(/삼랑진공장\s*/g, "");
  str = str.replace(/한림공장\s*/g, "");
  str = str.replace(/\(주\)조영산업/g, "조영");
  str = str.replace(/\(주\)오륙/g, "오륙");
  str = str.replace(/\(주\)/g, "");
  str = str.replace(/조영산업/g, "조영");
  str = str.replace(/유성산업/g, "유성");
  str = str.replace(/특근실시보고서|특근실시 보고서/g, "특근보고서");
  str = str.replace(/근태 및 특근보고서|근태 및 특근실시 보고서/g, "근태보고서");
  str = str.replace(/\s*의\s*건$/, "");
  return str.replace(/\s+/g, " ").trim();
};

export const ApprovalDocTable = ({
  filteredDocs,
  handleOpenDocModal,
  handleOpenEditModal,
  handleDelete,
  canEditDoc,
  isAdmin,
  currentProfile,
  docCategoryFilter,
  selectedTab,
  selectedPlant,
  searchQuery,
  setDocCategoryFilter,
  setSelectedTab,
  setSelectedPlant,
  setSearchQuery
}) => {
  if (filteredDocs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden py-12 text-center text-xs text-slate-400 space-y-3">
        <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
        <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
          현재 필터 조건에 해당하는 결재 문서가 없습니다.
        </p>
        <p className="text-xs text-slate-400">
          선택 분류: {docCategoryFilter === "ALL" ? "전체 서류" : docCategoryFilter === "FOUR_M" ? "4M변동점" : docCategoryFilter === "GENERAL" ? "일반결재" : "특근보고서"} / 
          상태: {selectedTab === "ALL" ? "전체" : selectedTab === "PENDING" ? "미결/대기" : selectedTab === "APPROVED" ? "승인완료" : selectedTab === "HOLD" ? "보류" : selectedTab === "MY_DRAFTS" ? "내 기안함" : "반려"}
        </p>
        {(docCategoryFilter !== "ALL" || selectedTab !== "ALL" || selectedPlant !== "ALL" || searchQuery.trim()) && (
          <button
            type="button"
            onClick={() => {
              setDocCategoryFilter("ALL");
              setSelectedTab("ALL");
              setSelectedPlant("ALL");
              setSearchQuery("");
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>🔄 전체 결재문서 목록 보기 (필터 초기화)</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
              <th className="py-3 px-3 w-20 whitespace-nowrap text-center">공장</th>
              <th className="py-3 px-4 min-w-[240px]">문서제목</th>
              <th className="py-3 px-3 w-28 whitespace-nowrap">기안자</th>
              <th className="py-3 px-3 w-28 whitespace-nowrap text-right">소요금액</th>
              <th className="py-3 px-3 w-28 text-center whitespace-nowrap">문서상태</th>
              <th className="py-3 px-3 w-24 text-center whitespace-nowrap">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filteredDocs.map((doc) => {
              const isApproved = isApprovalDocApproved(doc);
              const isPending = isApprovalDocPending(doc, currentProfile, isAdmin);
              const isHold = isApprovalDocHold(doc);
              const isRejected = isApprovalDocRejected(doc);

              return (
                <tr
                  key={doc.id}
                  onClick={() => handleOpenDocModal(doc)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                    isPending ? "bg-rose-50/20 dark:bg-rose-950/10" : isHold ? "bg-amber-50/20 dark:bg-amber-950/10" : ""
                  }`}
                >
                  {/* 공장 */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      doc.plant === "삼랑진공장"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    }`}>
                      {doc.plant === "삼랑진공장" ? "삼랑진" : doc.plant === "한림공장" ? "한림" : (doc.plant || "전사")}
                    </span>
                  </td>

                  {/* 문서제목 */}
                  <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isOvertimeApprovalDoc(doc) ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shrink-0">
                          특근보고서
                        </span>
                      ) : isFourMApprovalDoc(doc) ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shrink-0 flex items-center gap-0.5">
                          🛡️ 4M변동점
                        </span>
                      ) : doc.type === "LEAVE" || doc.title?.includes("휴가") || doc.title?.includes("휴무") ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 shrink-0">
                          휴가/연차
                        </span>
                      ) : doc.type === "EXPENSE" || doc.title?.includes("품의") || doc.title?.includes("구매") || doc.title?.includes("교체") ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shrink-0">
                          품의/지출
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800 shrink-0">
                          일반기안
                        </span>
                      )}
                      <span className="hover:underline text-slate-900 dark:text-white text-xs font-bold leading-tight">
                        {formatConciseApprovalTitle(doc.title)}
                      </span>
                    </div>
                  </td>

                  {/* 기안자 */}
                  <td className="py-3 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-bold text-xs">
                    {doc.drafter} <span className="text-slate-400 font-normal text-[11px]">{doc.drafterTitle}</span>
                  </td>

                  {/* 소요금액 */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono font-black text-xs text-right text-emerald-600 dark:text-emerald-400">
                    {doc.amount || "-"}
                  </td>

                  {/* 문서상태 */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {(() => {
                      const totalSteps = doc.steps?.length || 4;
                      if (isApproved) {
                        return (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 inline-flex items-center gap-1 shadow-2xs">
                            <span>✓</span>
                            <span>결재완료 ({totalSteps}/{totalSteps})</span>
                          </span>
                        );
                      }
                      if (isHold) {
                        const holdIdx = (doc.steps || []).findIndex((s) => s.status === "HOLD");
                        const holdStepNum = holdIdx >= 0 ? holdIdx + 1 : 1;
                        return (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 inline-flex items-center gap-1 shadow-2xs">
                            <span>⏸️</span>
                            <span>보류중 [{holdStepNum}/{totalSteps}단계]</span>
                          </span>
                        );
                      }
                      if (isRejected) {
                        return (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 inline-flex items-center gap-1 shadow-2xs">
                            <span>✕</span>
                            <span>반려됨</span>
                          </span>
                        );
                      }

                      const pendingIdx = (doc.steps || []).findIndex((s) => s.status === "PENDING");
                      const pendingStep = pendingIdx >= 0 ? doc.steps[pendingIdx] : null;
                      const currentStepNum = pendingIdx >= 0 ? pendingIdx + 1 : 1;
                      const role = pendingStep?.role || "검토";
                      const name = pendingStep?.name || "";

                      const isCeo = role === "대표" || role === "승인";
                      const isDirector = role === "이사";
                      const isLead = role === "책임" || role === "검토";

                      const badgeStyle = isCeo
                        ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 ring-1 ring-rose-400/30"
                        : isDirector
                        ? "bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 ring-1 ring-indigo-400/30"
                        : isLead
                        ? "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 ring-1 ring-sky-400/30"
                        : "bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

                      const userName = currentProfile?.name || "";
                      const isMyDraftDoc = Boolean(
                        userName &&
                        doc.drafter &&
                        (doc.drafter === userName || doc.drafter.includes(userName))
                      );
                      const isMyTurn = Boolean(name && userName && (name === userName || name.includes(userName)));

                      return (
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border inline-flex items-center gap-1.5 shadow-2xs ${badgeStyle}`}>
                          <Clock className="w-3 h-3 shrink-0" />
                          {isMyDraftDoc && !isMyTurn ? (
                            <span>[상신 진행중] {role}{name ? ` (${name})` : ""} 대기</span>
                          ) : (
                            <span>[{currentStepNum}/{totalSteps}단계] {role}{name ? ` (${name})` : ""} 대기</span>
                          )}
                        </span>
                      );
                    })()}
                  </td>

                  {/* 관리 */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenDocModal(doc)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white dark:bg-slate-800 dark:hover:white dark:hover:text-slate-950 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-xs"
                      >
                        상세
                      </button>
                      {canEditDoc(doc) && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModal(doc, e)}
                          className="px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-600 hover:text-white dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-xs font-bold transition-all shadow-xs flex items-center gap-1 border border-teal-200 dark:border-teal-800"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>수정</span>
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(doc.id, e)}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all shadow-xs flex items-center gap-1 border border-rose-200 dark:border-rose-800"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>삭제</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
