import React from "react";
import { createPortal } from "react-dom";
import { Download, X } from "lucide-react";

export const ImagePreviewModal = ({ previewImage, onClose }) => {
  if (!previewImage || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between p-3.5 px-5 bg-slate-950/80 border-b border-slate-800 text-white text-xs">
          <span className="font-bold truncate max-w-[240px] sm:max-w-md">
            {previewImage.name || "첨부 사진 확인"}
          </span>
          <div className="flex items-center gap-2">
            <a
              href={previewImage.url}
              download={previewImage.name || "품질경보사진.jpg"}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 text-[11px]"
              title="사진 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">다운로드</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image display */}
        <div className="p-3 sm:p-6 flex items-center justify-center max-h-[75vh] overflow-auto">
          <img
            src={previewImage.url}
            alt={previewImage.name || "미리보기"}
            className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg"
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
