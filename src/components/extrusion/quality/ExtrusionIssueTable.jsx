import React from "react";
import {
  Layers,
  Search,
  CheckCircle2,
  Calendar,
  Camera,
  Check,
  Edit3,
  Trash2
} from "lucide-react";
import { EXTRUSION_LINES } from "../../../services/extrusionQualityIssueService";

/**
 * 3. Bottom Section: 1-Line Table View for Extrusion Issues (1줄짜리 목록)
 */
export default function ExtrusionIssueTable({
  issues,
  filteredIssues,
  searchQuery,
  setSearchQuery,
  selectedStatusFilter,
  setSelectedStatusFilter,
  selectedLineFilter,
  setSelectedLineFilter,
  onSelectIssue,
  onPreviewImage,
  onResolve,
  onEdit,
  onDelete
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
              압출 품질이슈 목록
            </h3>
            <p className="text-[11px] text-slate-400">
              총 {issues.length}건 등록됨 (현재 조건: {filteredIssues.length}건)
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="제목, 라인, 불량유형, 조치결과 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: "ACTIVE", label: "🚨 진행중 (조치중)" },
            { id: "RESOLVED", label: "✅ 조치완료" },
            { id: "ALL", label: "전체보기" }
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setSelectedStatusFilter(st.id)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedStatusFilter === st.id
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Line Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400">라인:</span>
          <select
            value={selectedLineFilter}
            onChange={(e) => setSelectedLineFilter(e.target.value)}
            className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
          >
            <option value="all">전체 라인</option>
            {EXTRUSION_LINES.map((l) => (
              <option key={l.id} value={l.name}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1-Line Table Container */}
      {/* ========================================================================= */}
      {filteredIssues.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 space-y-2">
          <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
          <p>해당 조건의 압출 품질이슈가 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-black text-[11px]">
                <th className="py-2.5 px-3 text-center w-16">상태</th>
                <th className="py-2.5 px-2.5 text-center w-24">등록일자</th>
                <th className="py-2.5 px-2.5 text-center w-24">라인</th>
                <th className="py-2.5 px-2.5 w-28">불량유형</th>
                <th className="py-2.5 px-3 min-w-[220px]">품질이슈 제목 (불량 현상)</th>
                <th className="py-2.5 px-3 min-w-[180px]">조치결과</th>
                <th className="py-2.5 px-2 text-center min-w-[120px]">사진 (원인/조치)</th>
                <th className="py-2.5 px-2.5 text-center w-20">등록자</th>
                <th className="py-2.5 px-3 text-center w-28">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredIssues.map((issue) => {
                const isResolved = issue.status === "RESOLVED";
                const actionText = issue.actionResult || issue.actionGuide || issue.resolutionNote || "";
                const causeImgs = Array.isArray(issue.causeImages)
                  ? issue.causeImages
                  : Array.isArray(issue.images)
                  ? issue.images
                  : [];
                const actionImgs = Array.isArray(issue.actionImages) ? issue.actionImages : [];

                return (
                  <tr
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer group ${
                      isResolved ? "opacity-75 bg-slate-50/30 dark:bg-slate-900/40" : ""
                    }`}
                  >
                    {/* 상태 */}
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          isResolved
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 animate-pulse"
                        }`}
                      >
                        {isResolved ? "✓ 완료" : "● 진행"}
                      </span>
                    </td>

                    {/* 등록일자 */}
                    <td className="py-2 px-2.5 text-center font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <Calendar className="w-3 h-3 text-rose-500" />
                        <span>{issue.date || issue.createdAt?.slice(0, 10)}</span>
                      </span>
                    </td>

                    {/* 라인 */}
                    <td className="py-2 px-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10.5px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700">
                        {issue.line}
                      </span>
                    </td>

                    {/* 불량유형 */}
                    <td className="py-2 px-2.5 font-bold text-rose-700 dark:text-rose-300">
                      <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[10.5px]">
                        {issue.defectType}
                      </span>
                    </td>

                    {/* 제목 */}
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900 dark:text-white max-w-[260px] sm:max-w-[320px] truncate" title={issue.title}>
                        {issue.title}
                      </div>
                    </td>

                    {/* 조치결과 */}
                    <td className="py-2 px-3">
                      <div
                        className={`max-w-[200px] sm:max-w-[260px] truncate text-[11px] ${
                          actionText ? "text-teal-700 dark:text-teal-300 font-medium" : "text-slate-400 italic"
                        }`}
                        title={actionText || "조치 내용 없음"}
                      >
                        {actionText || "-"}
                      </div>
                    </td>

                    {/* 사진 (원인/조치 분리 표시) */}
                    <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {causeImgs.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onPreviewImage({ url: causeImgs[0].dataUrl, name: `[원인] ${causeImgs[0].name}` })}
                            className="px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-[10px] hover:bg-rose-100 flex items-center gap-0.5 cursor-pointer shadow-2xs"
                            title="발생원인 사진 확대보기"
                          >
                            <Camera className="w-2.5 h-2.5" />
                            <span>원인 {causeImgs.length}</span>
                          </button>
                        )}
                        {actionImgs.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onPreviewImage({ url: actionImgs[0].dataUrl, name: `[조치] ${actionImgs[0].name}` })}
                            className="px-1.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-bold text-[10px] hover:bg-teal-100 flex items-center gap-0.5 cursor-pointer shadow-2xs"
                            title="조치결과 사진 확대보기"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>조치 {actionImgs.length}</span>
                          </button>
                        )}
                        {causeImgs.length === 0 && actionImgs.length === 0 && (
                          <span className="text-slate-300 dark:text-slate-600 text-[11px]">-</span>
                        )}
                      </div>
                    </td>

                    {/* 등록자 */}
                    <td className="py-2 px-2.5 text-center text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      {issue.author || "설유철"}
                    </td>

                    {/* 관리 버튼 */}
                    <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {!isResolved && (
                          <button
                            type="button"
                            onClick={() => onResolve(issue)}
                            className="px-2 py-0.8 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10.5px] shadow-2xs flex items-center gap-0.5 cursor-pointer"
                            title="조치 완료 처리"
                          >
                            <Check className="w-3 h-3" />
                            <span>조치</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEdit(issue)}
                          className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                          title="수정"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(issue.id)}
                          className="p-1 rounded-md bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-600 hover:text-white text-rose-600 transition cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
