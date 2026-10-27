import React from "react";
import { FileUp, FileCheck, CheckCircle2 } from "lucide-react";

/**
 * DailyQualityExcelUploadBanner
 * Excel drag-and-drop & file upload area for DailyQualityView.
 */
export const DailyQualityExcelUploadBanner = ({
  handleDragOver,
  handleDragLeave,
  handleDrop,
  fileInputRef,
  handleUploadFiles,
  isDragging,
  isUploading,
  uploadedFileNames = [],
  uploadToast,
}) => {
  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDragging
            ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-4 ring-indigo-500/20 scale-[1.01]"
            : "border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 hover:border-indigo-400 hover:bg-indigo-50/30"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleUploadFiles(e.target.files)}
          multiple
          accept=".xlsx, .xls"
          className="hidden"
        />

        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-2xl transition-all shrink-0 ${
              isDragging
                ? "bg-indigo-600 text-white scale-110"
                : "bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400"
            }`}
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FileUp className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              G-RUN 불량율 집계 & AB동 최종검사 정리 엑셀 파일 드래그 업로드
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              이창엽 책임의 엑셀 파일을 여기에 <strong>드래그하여 놓거나 클릭</strong>하여 업로드하면, 일자별 아이템 실적이 <strong>중복 없이 자동 동기화</strong>됩니다.
            </p>
          </div>
        </div>

        {/* Uploaded File Tags */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {uploadedFileNames.map((fn, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate max-w-[160px]">{fn}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Result Toast */}
      {uploadToast && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-black flex items-center gap-2 animate-fadeIn ${
            uploadToast.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-800 dark:text-rose-200"
              : "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{uploadToast.message}</span>
        </div>
      )}
    </>
  );
};

export default DailyQualityExcelUploadBanner;
