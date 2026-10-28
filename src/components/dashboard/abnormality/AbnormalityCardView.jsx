import React, { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * AbnormalityCardView
 * Responsive card-style layout for mobile screens or compact view mode with 8-item pagination.
 */
export const AbnormalityCardView = ({
  filteredRecords = [],
  onOpenDetailModal,
  onUpdateItemFourM
}) => {
  const PAGE_SIZE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredRecords.length]);

  const totalPages = Math.max(1, Math.ceil((filteredRecords?.length || 0) / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return (filteredRecords || []).slice(start, start + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  return (
    <div className="space-y-2">
      {paginatedRecords.map((item) => (
        <div
          key={item.id}
          onClick={() => onOpenDetailModal(item)}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-400 transition-all cursor-pointer space-y-1.5"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <select
                value={item.fourM || "Method"}
                onChange={(e) => onUpdateItemFourM(item, e.target.value)}
                className={`text-[10px] font-black py-0.5 px-1.5 rounded-lg border cursor-pointer outline-none ${
                  item.fourM === "Machine"
                    ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                    : item.fourM === "Material"
                    ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                    : item.fourM === "Man"
                    ? "bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700"
                    : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                }`}
                title="4M 카테고리 수정 (클릭하여 변경)"
              >
                <option value="Machine">⚙️ Machine</option>
                <option value="Material">🧱 Material</option>
                <option value="Man">👤 Man</option>
                <option value="Method">📐 Method</option>
              </select>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                item.origin === "설비수리"
                  ? "bg-indigo-100 text-indigo-900 border-indigo-300"
                  : item.origin === "비가동"
                  ? "bg-orange-100 text-orange-900 border-orange-300"
                  : item.origin === "TPM 이상신고"
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-rose-100 text-rose-900 border-rose-300"
              }`}>
                {item.origin}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{item.plant}</span>
              <span className="text-slate-500">작성자: {item.writer}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-500">{item.date}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${item.isResolved ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                {item.isResolved ? "완료" : "미조치"}
              </span>
            </div>
          </div>

          <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">{item.title}</h4>
          {item.content && item.content.trim() !== item.title.trim() && (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
              {item.content}
            </p>
          )}
          {item.actionResult && (
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[11px] text-emerald-900 dark:text-emerald-200 font-medium">
              <b>조치결과:</b> {item.actionResult}
            </div>
          )}
        </div>
      ))}

      {/* 🌟 8개씩 페이지네이션 컨트롤 바 */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <div className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">
            <span>총 {filteredRecords.length}건 중 </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-black">
              {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredRecords.length)}건
            </span>
            <span> 노출 (페이지 {currentPage} / {totalPages})</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 font-bold transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setCurrentPage(num)}
                className={`min-w-[26px] h-6 px-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                  currentPage === num
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 font-bold transition cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbnormalityCardView;
