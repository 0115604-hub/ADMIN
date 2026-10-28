import React from "react";
import { Camera, Eye, Download } from "lucide-react";

/**
 * ScheduleAttachmentsList
 * Reusable image gallery thumbnail and file download list for schedules
 */
export default function ScheduleAttachmentsList({
  item,
  setPreviewImageModal,
  borderTopClass = "border-t border-slate-200/60 dark:border-slate-700/60"
}) {
  const hasFiles = item?.files && item.files.length > 0;
  const hasImages = item?.images && item.images.length > 0;

  if (!hasFiles && !hasImages) return null;

  const imageList = item.images || item.files?.filter((f) => f.fileType === "image" || f.dataUrl?.startsWith("data:image")) || [];
  const fileList = item.files?.filter((f) => f.fileType !== "image" && !f.dataUrl?.startsWith("data:image")) || [];

  return (
    <div className={`mt-1.5 pt-1.5 ${borderTopClass} space-y-1`}>
      <div className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
        <Camera className="w-3 h-3 text-rose-500" />
        <span>첨부 파일 / 사진:</span>
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {imageList.map((img, imgIdx) => {
          const url = img.dataUrl || img;
          const name = img.name || `사진 ${imgIdx + 1}`;
          return (
            <div
              key={img.id || imgIdx}
              onClick={() => setPreviewImageModal && setPreviewImageModal({ url, name })}
              className="group relative w-11 h-11 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden cursor-pointer shadow-2xs hover:border-blue-500 transition-all shrink-0"
              title="클릭하여 크게보기"
            >
              <img src={url} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Eye className="w-3 h-3" />
              </div>
            </div>
          );
        })}

        {fileList.map((f, fIdx) => (
          <a
            key={f.id || fIdx}
            href={f.dataUrl}
            download={f.name || "첨부파일"}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-800 dark:text-slate-200 text-[10.5px] font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
            title="클릭하여 다운로드"
          >
            <Download className="w-3 h-3 text-blue-500 shrink-0" />
            <span className="max-w-[100px] truncate">{f.name}</span>
            <span className="text-[9px] text-slate-400 font-normal">({f.size})</span>
          </a>
        ))}
      </div>
    </div>
  );
}
