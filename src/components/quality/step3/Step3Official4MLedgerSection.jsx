import React from "react";
import { Search, Edit3 } from "lucide-react";
import { getFourMBadgeColor } from "../../../services/fourMChangePointService";

export const Step3Official4MLedgerSection = ({
  official4MItems,
  selectedFourMFilter,
  setSelectedFourMFilter,
  searchQuery,
  setSearchQuery,
  approvalDocs,
  approvalDocsMap,
  checkIsCeoApproved,
  handleOpenCapaModal
}) => {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-black text-xs">
            4M 대장
          </span>
          <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>📋 2. 공식 4M 변동점 관리대장 & 시정/예방조치(CAPA) 실행</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              {official4MItems.length}건
            </span>
          </h4>
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
              placeholder="공정/차종/대책 검색..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* 4M Items Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300 border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 text-[11px] font-black border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
            <tr>
              <th className="py-2.5 px-3 w-28">관리번호</th>
              <th className="py-2.5 px-2 text-center w-20">4M 구분</th>
              <th className="py-2.5 px-2.5 w-28">공정/차종</th>
              <th className="py-2.5 px-3 min-w-[200px]">변동점 및 이상 내용</th>
              <th className="py-2.5 px-3 min-w-[240px]">시정대책(CAPA) 및 조치결과</th>
              <th className="py-2.5 px-2 text-center w-24">진행상태</th>
              <th className="py-2.5 px-3 text-center w-32">수정&결재</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
            {official4MItems
              .filter((rec) => {
                if (selectedFourMFilter !== "ALL" && rec.fourM !== selectedFourMFilter) return false;
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase();
                  const line = String(rec.line || "").toLowerCase();
                  const title = String(rec.title || "").toLowerCase();
                  const content = String(rec.content || "").toLowerCase();
                  const action = String(rec.actionResult || "").toLowerCase();
                  return line.includes(q) || title.includes(q) || content.includes(q) || action.includes(q);
                }
                return true;
              })
              .map((rec) => {
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

                    {/* Line / Vehicle */}
                    <td className="py-2.5 px-2.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {rec.line || rec.plant}
                      </div>
                      <div className="text-[10.5px] text-slate-400">
                        {rec.plant}
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
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Step3Official4MLedgerSection;
