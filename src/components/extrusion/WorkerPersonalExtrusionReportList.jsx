import React, { useState, useMemo } from "react";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";

/**
 * WorkerPersonalExtrusionReportList
 * 로그인한 본인 작업자가 작성한 압출 작업일보만 목록화하여 5개씩 페이징 표출하는 컴포넌트
 */
export const WorkerPersonalExtrusionReportList = ({
  reports = [],
  currentWorkerName = "",
  onOpenReportModal,
  onEditReport = null
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // 이름에서 호칭(반장, 대리, 사원 등)을 제거하고 순수 이름만 추출
  const normalizeName = (str) => {
    if (!str) return "";
    return String(str)
      .replace(/(반장|대리|사원|과장|차장|부장|팀장|주임|기사|선임|책임|수석|이사|대표)/g, "")
      .trim();
  };

  // 본인이 단독 작성했거나 동료와 공동 작업자로 포함된 일보만 엄격하게 매칭
  const myReports = useMemo(() => {
    if (!currentWorkerName) return [];
    const pureMyName = normalizeName(currentWorkerName);
    if (!pureMyName) return [];

    return (reports || []).filter((r) => {
      if (!r) return false;

      // 1. 단독/공동 작업자 문자열 또는 배열 수집
      const allWorkerTokens = [];

      if (r.worker) {
        String(r.worker)
          .split(/[,/·+&]/)
          .forEach((t) => {
            const norm = normalizeName(t);
            if (norm) allWorkerTokens.push(norm);
          });
      }
      if (r.subWorkers) {
        String(r.subWorkers)
          .split(/[,/·+&]/)
          .forEach((t) => {
            const norm = normalizeName(t);
            if (norm) allWorkerTokens.push(norm);
          });
      }
      if (r.writer) allWorkerTokens.push(normalizeName(r.writer));
      if (r.author) allWorkerTokens.push(normalizeName(r.author));
      if (r.registeredBy) allWorkerTokens.push(normalizeName(r.registeredBy));
      if (r.createdBy) allWorkerTokens.push(normalizeName(r.createdBy));
      if (r.updatedBy) allWorkerTokens.push(normalizeName(r.updatedBy));

      if (Array.isArray(r.workers)) {
        r.workers.forEach((w) => allWorkerTokens.push(normalizeName(w?.name || w)));
      }
      if (Array.isArray(r.workerList)) {
        r.workerList.forEach((w) => allWorkerTokens.push(normalizeName(w?.name || w)));
      }

      // 🌟 또한 문자열 전체에 순수 이름이 포함되어 있는지 확인 (원문 검색)
      const rawCombinedString = `${r.worker || ""} ${r.subWorkers || ""} ${r.writer || ""} ${r.registeredBy || ""} ${r.createdBy || ""}`;
      if (rawCombinedString.includes(pureMyName)) return true;

      // 정확하게 토큰 목록 중에 본인의 순수 이름이 포함되어 있는지 확인 (부분일치/동등 모두 검증)
      return allWorkerTokens.some(
        (tok) => tok === pureMyName || tok.includes(pureMyName) || pureMyName.includes(tok)
      );
    });
  }, [reports, currentWorkerName]);

  const totalPages = Math.ceil(myReports.length / pageSize) || 1;

  // Safe page clamp
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedReports = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return myReports.slice(startIndex, startIndex + pageSize);
  }, [myReports, safeCurrentPage, pageSize]);

  return (
    <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-sm sm:text-base text-white">
                📋 내가 작성한 압출 작업일보 내역
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-950 text-teal-300 border border-teal-700">
                총 {myReports.length}건
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              [{currentWorkerName}] 님이 직접 작성하고 등록한 작업일보 목록입니다. (5건씩 표시)
            </p>
          </div>
        </div>

        {/* 새 일보 작성 버튼 */}
        {typeof onOpenReportModal === "function" && (
          <button
            type="button"
            onClick={onOpenReportModal}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-teal-900/40 flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span>+ 작업일보 작성</span>
          </button>
        )}
      </div>

      {/* List Table */}
      {myReports.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 space-y-1">
          <FileText className="w-7 h-7 mx-auto text-slate-600 mb-1" />
          <p className="font-bold text-slate-400">작성한 압출 작업일보가 없습니다.</p>
          <p className="text-[11px]">우측 상단의 '+ 작업일보 작성' 버튼을 눌러 첫 일보를 등록해보세요.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold text-slate-400">
                  <th className="py-2.5 px-3">일자 / 라인</th>
                  <th className="py-2.5 px-3">작업자 (공동작업)</th>
                  <th className="py-2.5 px-3">생산 품목 / 차종</th>
                  <th className="py-2.5 px-3 text-right">총 실적 (EA)</th>
                  <th className="py-2.5 px-3 text-right">양품수량</th>
                  <th className="py-2.5 px-3 text-right">불량&스크랩(kg)</th>
                  <th className="py-2.5 px-3 text-center">결재상태</th>
                  <th className="py-2.5 px-3 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {paginatedReports.map((r, idx) => {
                  const items = Array.isArray(r.items) ? r.items : [];
                  const firstItem = items[0] || {};
                  const itemCount = items.length;
                  const itemSummary = firstItem.itemName
                    ? `[${firstItem.vehicle || "-"}] ${firstItem.itemName}${
                        itemCount > 1 ? ` 외 ${itemCount - 1}건` : ""
                      }`
                    : r.partName || r.item || "-";

                  const actualQty = Number(r.actualQty || r.totalActualQty || 0);
                  const goodQty = Number(r.goodQty || r.totalGoodQty || 0);
                  const scrapKg = Number(r.scrapKg || r.totalScrapKg || r.scrapWeightKg || 0);

                  // 설유철 승인 여부 판별 (승인 완료 시 수정 불가)
                  const isApproved =
                    Boolean(r.isApproved || r.approved) ||
                    String(r.approvalStatus || "").trim() === "승인" ||
                    String(r.approvalStatus || "").trim() === "승인완료";

                  // 작업자 표시 (공동 작업자 중복 완벽 제거)
                  const seenPureNames = new Set();
                  const uniqueWorkersList = [];

                  const addWorkerToken = (rawToken) => {
                    if (!rawToken) return;
                    const cleanLabel = String(rawToken).trim();
                    const pure = normalizeName(cleanLabel);
                    if (pure && !seenPureNames.has(pure)) {
                      seenPureNames.add(pure);
                      uniqueWorkersList.push(cleanLabel);
                    }
                  };

                  if (r.worker) {
                    String(r.worker).split(/[,/·+&]/).forEach(addWorkerToken);
                  }
                  if (r.subWorkers) {
                    String(r.subWorkers).split(/[,/·+&]/).forEach(addWorkerToken);
                  }
                  if (Array.isArray(r.workers)) {
                    r.workers.forEach((w) => addWorkerToken(w?.name || w));
                  }
                  if (Array.isArray(r.workerList)) {
                    r.workerList.forEach((w) => addWorkerToken(w?.name || w));
                  }

                  const workersDisplay = uniqueWorkersList.join(", ") || r.writer || "작업자";

                  return (
                    <tr
                      key={r.id || r._docId || idx}
                      className="hover:bg-slate-800/40 transition group font-medium"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-cyan-300 font-bold">
                            {r.date || r.workDate || "-"}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700">
                            {r.lineId || r.line || "압출"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-800/80 text-amber-300 border border-amber-600/30">
                          👥 {workersDisplay}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-white font-bold">{itemSummary}</span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        {actualQty.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-blue-400">
                        {goodQty.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">
                        {scrapKg > 0 ? `${scrapKg.toLocaleString()} kg` : "-"}
                      </td>

                      {/* 설유철 결재 상태 */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black border ${
                            isApproved
                              ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                              : "bg-amber-950/80 text-amber-400 border-amber-800"
                          }`}
                        >
                          {isApproved ? "✓ 승인완료" : "⏳ 승인대기"}
                        </span>
                      </td>

                      {/* 수정 버튼: 설유철의 승인이 나지 않은 경우 수정 가능 */}
                      <td className="py-3 px-3 text-center">
                        {isApproved ? (
                          <span className="text-[10px] text-slate-500 font-bold">수정불가(승인됨)</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEditReport && onEditReport(r)}
                            className="px-2.5 py-1 rounded-lg bg-teal-600/30 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/50 text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
                          >
                            ✏️ 수정
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls (5개씩 페이징) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 text-[11px] font-mono">
                전체 {myReports.length}건 중 {(safeCurrentPage - 1) * pageSize + 1} -{" "}
                {Math.min(safeCurrentPage * pageSize, myReports.length)}건 표시
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCurrentPage(num)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                        safeCurrentPage === num
                          ? "bg-teal-600 text-white font-black shadow-xs shadow-teal-900"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
