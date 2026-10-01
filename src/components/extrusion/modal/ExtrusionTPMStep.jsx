import React from "react";
import {
  Wrench,
  Check,
  AlertOctagon,
  Camera,
  X
} from "lucide-react";
import { TPM_CHECK_ITEMS } from "../../../services/extrusionProductionService";

export const ExtrusionTPMStep = ({
  tpmChecks = [],
  onTpmCheckChange,
  onTpmNoteChange,
  onSetAllOk,
  tpmIssueText = "",
  onTpmIssueTextChange,
  tpmIssuePhotos = [],
  onPhotoCapture,
  onRemovePhoto,
  onSelectPhotoPreview,
  isCapturingPhoto = false,
  fileInputRef
}) => {
  return (
    <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 text-slate-800 dark:text-slate-100 text-xs sm:text-sm animate-fadeIn">
      {/* Guide Header Banner */}
      <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Wrench className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <div>
            <h4 className="font-black text-teal-900 dark:text-teal-200 text-xs sm:text-sm">
              압출 설비 TPM 10대 자주보전 항목 점검 (필수)
            </h4>
            <p className="text-[11px] text-teal-700/80 dark:text-teal-300/80 mt-0.5">
              각 항목의 점검 상태(양호/요관찰/불량)를 탭하여 체크해 주세요.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-teal-600 text-white shadow-2xs">
            총 {TPM_CHECK_ITEMS.length}개 항목
          </span>
          <button
            type="button"
            onClick={onSetAllOk}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span>⚡ 전체 양호(○) 일괄 체크</span>
          </button>
        </div>
      </div>

      {/* TPM 10 Items List - Simplified & Directly Tappable */}
      <div className="space-y-2">
        {TPM_CHECK_ITEMS.map((item, idx) => {
          const currentCheck = (Array.isArray(tpmChecks) ? tpmChecks : []).find((c) => c?.id === item.id) || { status: "OK", note: "" };
          const isOK = currentCheck.status === "OK";
          const isWarn = currentCheck.status === "WARN";
          const isNG = currentCheck.status === "NG";

          return (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border transition-all ${
                isNG
                  ? "bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-1 ring-rose-400/30"
                  : isWarn
                  ? "bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-1 ring-amber-400/30"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Left: Item Index, Category & Name */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[11px] flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
                    {idx + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-black text-[11px] shrink-0">
                    {item.category}
                  </span>
                  <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                    {item.name}
                  </span>
                </div>

                {/* Right: 3-Way Tappable Buttons (○ 양호 / △ 요관찰 / ✕ 불량) */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => onTpmCheckChange(item.id, "OK")}
                    className={`min-w-[68px] py-1.5 px-2.5 rounded-xl font-black text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 border ${
                      isOK
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-400/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    }`}
                  >
                    <span>○</span>
                    <span>양호</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onTpmCheckChange(item.id, "WARN")}
                    className={`min-w-[68px] py-1.5 px-2.5 rounded-xl font-black text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 border ${
                      isWarn
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    }`}
                  >
                    <span>△</span>
                    <span>요관찰</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onTpmCheckChange(item.id, "NG")}
                    className={`min-w-[68px] py-1.5 px-2.5 rounded-xl font-black text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 border ${
                      isNG
                        ? "bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-400/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    }`}
                  >
                    <span>✕</span>
                    <span>불량</span>
                  </button>
                </div>
              </div>

              {/* Note Input for Warn/NG */}
              {(isWarn || isNG) && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <input
                    type="text"
                    value={currentCheck.note || ""}
                    onChange={(e) => onTpmNoteChange(item.id, e.target.value)}
                    placeholder="이상 증상 및 조치 내용 입력 (선택)"
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 맨 아래 이상발생신고란 한 줄 + 사진촬영 */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0">
              <AlertOctagon className="w-4 h-4" />
            </span>
            <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
              이상발생신고
            </span>
            <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold hidden sm:inline">
              (설비/안전/품질 특이사항 발생 시 기재 및 사진 첨부)
            </span>
          </div>

          {/* Camera Capture Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onPhotoCapture}
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCapturingPhoto}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isCapturingPhoto ? "압축중..." : "📷 사진촬영"}</span>
            </button>
          </div>
        </div>

        {/* Single Line Text Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tpmIssueText || ""}
            onChange={(e) => onTpmIssueTextChange(e.target.value)}
            placeholder="이상 발생 내용 및 긴급 조치 요청사항을 입력하세요 (선택)"
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 font-bold text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        {/* Photos Preview Thumbnails */}
        {Array.isArray(tpmIssuePhotos) && tpmIssuePhotos.length > 0 && (
          <div className="flex items-center gap-2.5 pt-1 overflow-x-auto pb-1">
            {tpmIssuePhotos.map((photo, pIdx) => (
              <div key={photo.id || pIdx} className="relative group shrink-0">
                <img
                  src={photo.dataUrl}
                  alt={photo.name || "이상발생 사진"}
                  onClick={() => onSelectPhotoPreview && onSelectPhotoPreview(photo.dataUrl)}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border-2 border-amber-400 dark:border-amber-600 shadow-xs cursor-pointer hover:opacity-90 transition"
                />
                <button
                  type="button"
                  onClick={() => onRemovePhoto(photo.id)}
                  className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md cursor-pointer transition active:scale-90"
                  title="사진 삭제"
                >
                  <X className="w-3 h-3" />
                </button>
                <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-slate-950/70 text-white text-[9px] font-bold">
                  {photo.size || "사진"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtrusionTPMStep;
