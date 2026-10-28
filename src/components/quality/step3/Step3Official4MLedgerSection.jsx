import React, { useState, useMemo, useEffect } from "react";
import { Search, Edit3, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { getFourMBadgeColor, getFourMRecordCompany } from "../../../services/fourMChangePointService";

export const Step3Official4MLedgerSection = ({
  official4MItems,
  selectedFourMFilter,
  setSelectedFourMFilter,
  searchQuery,
  setSearchQuery,
  approvalDocs,
  approvalDocsMap,
  checkIsCeoApproved,
  handleOpenCapaModal,
  customTitle,
  themeObj,
  isInlineEditing = false,
  customSettings = null,
  onUpdateDraft = null
}) => {
  const PAGE_SIZE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // 1. 4M 구분 및 검색어 필터링
  const filteredItems = useMemo(() => {
    return (official4MItems || []).filter((rec) => {
      if (selectedFourMFilter !== "ALL" && rec.fourM !== selectedFourMFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const comp = getFourMRecordCompany(rec).toLowerCase();
        const line = String(rec.line || "").toLowerCase();
        const plant = String(rec.plant || "").toLowerCase();
        const title = String(rec.title || "").toLowerCase();
        const content = String(rec.content || "").toLowerCase();
        const action = String(rec.actionResult || "").toLowerCase();
        return (
          comp.includes(q) ||
          line.includes(q) ||
          plant.includes(q) ||
          title.includes(q) ||
          content.includes(q) ||
          action.includes(q)
        );
      }
      return true;
    });
  }, [official4MItems, selectedFourMFilter, searchQuery]);

  // 필터나 검색어가 바뀌면 페이지를 1페이지로 자동 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFourMFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  // 현재 페이지가 전체 페이지 수를 초과하지 않도록 보정
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // 2. 8개씩 페이지네이션 슬라이스
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {isInlineEditing ? (
            <>
              {!customSettings?.hideOfficialSubBadge ? (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600 text-white font-black text-xs">
                  <input
                    type="text"
                    value={customSettings?.officialSubBadge !== undefined ? customSettings.officialSubBadge : "4M 정식대장"}
                    onChange={(e) => onUpdateDraft?.({ officialSubBadge: e.target.value })}
                    className="bg-transparent text-white font-black text-xs outline-none w-20 border-b border-white/40 focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateDraft?.({ hideOfficialSubBadge: true })}
                    className="p-0.5 hover:bg-black/20 rounded-full cursor-pointer text-white/70 hover:text-white"
                    title="4M 정식대장 뱃지 숨김/삭제"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onUpdateDraft?.({ hideOfficialSubBadge: false, officialSubBadge: "4M 정식대장" })}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-dashed border-indigo-400 text-indigo-400 hover:bg-indigo-500/10 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>+ 4M 정식대장 뱃지 복원</span>
                </button>
              )}

              <input
                type="text"
                value={customSettings?.officialSubTitle !== undefined ? customSettings.officialSubTitle : "📋 이창엽의 4M 정식대장 & 시정조치(CAPA)"}
                onChange={(e) => onUpdateDraft?.({ officialSubTitle: e.target.value })}
                className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border-2 border-indigo-400 text-slate-900 dark:text-white font-black text-xs sm:text-sm outline-none min-w-[240px]"
              />
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                총 {filteredItems.length}건
              </span>
            </>
          ) : (
            <>
              {!customSettings?.hideOfficialSubBadge && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-black text-xs">
                  {customSettings?.officialSubBadge || "4M 정식대장"}
                </span>
              )}
              <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{customSettings?.officialSubTitle || "📋 이창엽의 4M 정식대장 & 시정조치(CAPA)"}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  총 {filteredItems.length}건
                </span>
              </h4>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* 4M Filter */}
          <select
            value={selectedFourMFilter}
            onChange={(e) => setSelectedFourMFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs outline-none cursor-pointer"
          >
            <option value="ALL">4M 전체 구분</option>
            <option value="Machine">Machine (설비)</option>
            <option value="Material">Material (자재)</option>
            <option value="Method">Method (공법)</option>
            <option value="Man">Man (작업자)</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="소속사/공정/차종/대책 검색..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* 4M Items Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300 border-collapse">
          <thead className={`${themeObj?.tableThead || "bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300"} text-[11px] font-black border-b border-slate-200 dark:border-slate-700 whitespace-nowrap`}>
            <tr>
              <th className="py-2.5 px-3 w-28">관리번호</th>
              <th className="py-2.5 px-2 text-center w-20">4M 구분</th>
              <th className="py-2.5 px-2.5 w-32">소속사 / 공정</th>
              <th className="py-2.5 px-3 min-w-[200px]">변동점 및 이상 내용</th>
              <th className="py-2.5 px-3 min-w-[240px]">시정대책(CAPA) 및 조치결과</th>
              <th className="py-2.5 px-2 text-center w-24">진행상태</th>
              <th className="py-2.5 px-3 text-center w-32">수정&결재</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-bold text-xs">
                  등록된 4M 정식대장 항목이 없습니다.
                </td>
              </tr>
            ) : (
              paginatedItems.map((rec) => {
                const badgeColor = getFourMBadgeColor(rec.fourM);
                const isCeoApproved = checkIsCeoApproved(rec);
                const isApproved = isCeoApproved || rec.approvalStatus === "APPROVED";
                const isPendingApproval = !isApproved && rec.approvalStatus === "PENDING_APPROVAL";
                const isResolved = isApproved || Boolean(rec.isResolved || rec.status === "RESOLVED");

                return (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    {/* ID / Date */}
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {String(rec.id).replace(/^ledger_/, "").slice(0, 16)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {rec.date} {rec.time}
                      </div>
                    </td>

                    {/* 4M Badge */}
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-black border ${badgeColor}`}>
                        {rec.fourM || "Machine"}
                      </span>
                      {rec.isSqNotice && (
                        <div className="mt-1">
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 text-[9.5px] font-black border border-amber-500/30">
                            SQ통보
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Company / Process */}
                    <td className="py-2.5 px-2.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11.5px] font-black tracking-wide">
                          {getFourMRecordCompany(rec)}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-slate-400 mt-1">
                        {rec.line || rec.process || "압출"} · {rec.plant}
                      </div>
                    </td>

                    {/* Defect Content */}
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {rec.title || rec.content}
                      </div>
                      {rec.content && rec.content !== rec.title && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {rec.content}
                        </div>
                      )}
                      {(rec.downtimeMinutes > 0 || rec.scrapKg > 0) && (
                        <div className="flex items-center gap-1.5 mt-1 text-[10.5px] text-slate-400 font-mono">
                          {rec.downtimeMinutes > 0 && <span>⏱️ {rec.downtimeMinutes}분</span>}
                          {rec.scrapKg > 0 && <span>🗑️ {rec.scrapKg}kg</span>}
                        </div>
                      )}
                    </td>

                    {/* Corrective Action */}
                    <td className="py-2.5 px-3">
                      {rec.actionResult || rec.correctiveAction ? (
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          <span className="font-bold">🛠️ 대책: </span>
                          <span>{rec.actionResult || rec.correctiveAction}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-rose-500 dark:text-rose-400 font-bold">
                          ⚠️ 시정 및 재발방지대책 수립 필요
                        </div>
                      )}
                      {rec.actionAuthor && (
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          조치자: {rec.actionAuthor} ({rec.actionAt?.slice(0, 16) || ""})
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      {isCeoApproved ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-black text-[10.5px] inline-flex items-center gap-1 shadow-xs">
                          <span className="text-xs">✅</span>
                          <span>대표이사 승인 (3/3)</span>
                        </span>
                      ) : isPendingApproval ? (
                        (() => {
                          const docMatch =
                            (rec.approvalDocId && approvalDocsMap[rec.approvalDocId]) ||
                            approvalDocsMap[rec.id] ||
                            approvalDocsMap[String(rec.id).replace(/^ledger_/, "")] ||
                            (approvalDocs || []).find((d) =>
                              d.id === rec.approvalDocId ||
                              (d.id && rec.id && d.id.includes(rec.id)) ||
                              (d.id && rec.id && d.id.includes(String(rec.id).replace(/^ledger_/, ""))) ||
                              (rec.originalId && d.id && d.id.includes(rec.originalId))
                            );
                          const pendingStep = (docMatch?.steps || []).find((s) => s.status === "PENDING");
                          const pendingIdx = (docMatch?.steps || []).findIndex((s) => s.status === "PENDING");
                          const totalSteps = docMatch?.steps?.length || 3;
                          const stepText = pendingIdx >= 0
                            ? `[${pendingIdx + 1}/${totalSteps}단계] ${pendingStep?.name ? `${pendingStep.name} ${pendingStep.role}` : pendingStep?.role || "검토"} 대기`
                            : "[2/3단계] 이명재 이사 검토대기";

                          return (
                            <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 font-bold text-[10.5px] inline-flex items-center gap-1">
                              <span>🚀</span>
                              <span>{stepText}</span>
                            </span>
                          );
                        })()
                      ) : isResolved ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold text-[10.5px]">
                          🟢 조치완료
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-[10.5px]">
                          🛠️ 대책수립중
                        </span>
                      )}
                    </td>

                    {/* Follow-up Action Buttons */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenCapaModal(rec)}
                        className={`px-3 py-1.5 rounded-lg font-black text-[11px] border transition cursor-pointer inline-flex items-center gap-1.5 shadow-xs ${
                          isCeoApproved
                            ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-500/20"
                            : "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800"
                        }`}
                        title={isCeoApproved ? "대표이사 결재완료건 (수정 및 결재내역 열람)" : "수정 & 임원결재"}
                      >
                        {isCeoApproved ? (
                          <span className="text-xs">✅</span>
                        ) : (
                          <Edit3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        )}
                        <span>수정&결재</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 🌟 8개씩 페이지네이션 컨트롤 바 */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <div className="text-slate-500 dark:text-slate-400 font-bold text-[11.5px]">
            <span>{customTitle ? `${customTitle} 총 ` : "이창엽의 4M 정식대장 총 "}{filteredItems.length}건 중 </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-black">
              {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredItems.length)}건
            </span>
            <span> 노출 (페이지 {currentPage} / {totalPages})</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition cursor-pointer"
              title="이전 페이지"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setCurrentPage(num)}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-black transition cursor-pointer ${
                  currentPage === num
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition cursor-pointer"
              title="다음 페이지"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step3Official4MLedgerSection;
