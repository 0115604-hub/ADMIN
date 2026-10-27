import React from "react";
import { Calendar, AlertCircle, ZoomIn, CheckCircle2 } from "lucide-react";

export const QualityIssueDetailModal = ({
  detailModalIssue,
  setDetailModalIssue,
  setPreviewImage,
  handleResolve,
  handleEdit
}) => {
  if (!detailModalIssue) return null;

  const isResolved = detailModalIssue.status === "RESOLVED";
  const actionText =
    detailModalIssue.actionResult ||
    detailModalIssue.actionGuide ||
    detailModalIssue.resolutionNote ||
    "";
  const causeImgs = Array.isArray(detailModalIssue.causeImages)
    ? detailModalIssue.causeImages
    : Array.isArray(detailModalIssue.images)
    ? detailModalIssue.images
    : [];
  const actionImgs = Array.isArray(detailModalIssue.actionImages)
    ? detailModalIssue.actionImages
    : [];

  return (
    <div
      onClick={() => setDetailModalIssue(null)}
      className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 border border-purple-500/40 shadow-2xl space-y-4 animate-scaleUp cursor-default text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                isResolved
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-rose-50 text-rose-700 border-rose-300"
              }`}
            >
              {isResolved ? "✓ 조치완료" : "● 진행중"}
            </span>
            <span className="font-bold text-xs bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
              {detailModalIssue.line}
            </span>
            <span className="font-bold text-xs text-rose-600">
              {detailModalIssue.defectType}
            </span>
            <span className="font-mono text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 flex items-center gap-1 shadow-2xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                등록일: {detailModalIssue.date || detailModalIssue.createdAt?.slice(0, 10)}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDetailModalIssue(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        <h3 className="font-black text-base text-slate-900 dark:text-white">
          {detailModalIssue.title}
        </h3>

        {/* 1) 발생원인 내용 및 사진 */}
        <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2 text-xs">
          <span className="font-black text-rose-800 dark:text-rose-300 text-[11.5px] flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>1. 세부 불량 현상 및 발생 원인</span>
          </span>
          <p className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
            {detailModalIssue.content}
          </p>

          {/* 발생원인 사진 */}
          {causeImgs.length > 0 && (
            <div className="pt-1.5 border-t border-rose-200/60 dark:border-rose-900/40">
              <span className="font-bold text-rose-700 dark:text-rose-300 block mb-1.5 text-[10.5px]">
                📸 발생원인 사진 ({causeImgs.length}장 - 클릭하여 확대)
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pt-0.5">
                {causeImgs.map((img, i) => (
                  <div
                    key={img.id || i}
                    onClick={() =>
                      setPreviewImage({
                        url: img.dataUrl || img.url,
                        name: `[원인] ${img.name || "원인 사진"}`
                      })
                    }
                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-rose-300 dark:border-rose-700 cursor-pointer group shrink-0"
                  >
                    <img
                      src={img.dataUrl || img.url}
                      alt={img.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <ZoomIn className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2) 조치결과 내용 및 사진 */}
        <div className="p-3.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 space-y-2 text-xs">
          <span className="font-black text-teal-800 dark:text-teal-300 text-[11.5px] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            <span>2. 조치결과 (현장 조치 및 개선 내용)</span>
          </span>
          <p className="whitespace-pre-wrap leading-relaxed text-teal-950 dark:text-teal-100 font-medium">
            {actionText || "등록된 조치결과가 없습니다."}
          </p>

          {/* 조치결과 사진 */}
          {actionImgs.length > 0 && (
            <div className="pt-1.5 border-t border-teal-200/60 dark:border-teal-900/40">
              <span className="font-bold text-teal-700 dark:text-teal-300 block mb-1.5 text-[10.5px]">
                📸 조치결과 사진 ({actionImgs.length}장 - 클릭하여 확대)
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pt-0.5">
                {actionImgs.map((img, i) => (
                  <div
                    key={img.id || i}
                    onClick={() =>
                      setPreviewImage({
                        url: img.dataUrl || img.url,
                        name: `[조치] ${img.name || "조치 사진"}`
                      })
                    }
                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-teal-300 dark:border-teal-700 cursor-pointer group shrink-0"
                  >
                    <img
                      src={img.dataUrl || img.url}
                      alt={img.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <ZoomIn className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px] font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
            <span>
              등록일시: <strong>{detailModalIssue.date || detailModalIssue.createdAt?.slice(0, 10)}</strong>{" "}
              {detailModalIssue.time || ""} (작성: {detailModalIssue.author}{" "}
              {detailModalIssue.authorTitle || ""})
            </span>
          </span>

          <div className="flex items-center gap-1.5">
            {!isResolved && (
              <button
                type="button"
                onClick={() => {
                  handleResolve(detailModalIssue);
                  setDetailModalIssue(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black cursor-pointer shadow-xs"
              >
                ✓ 조치 완료 처리
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                handleEdit(detailModalIssue);
                setDetailModalIssue(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
            >
              수정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
