import React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Camera, Image as ImageIcon, Check } from "lucide-react";

export const IssueActionModal = ({
  actionModalData,
  setActionModalData,
  onClose,
  onSaveActionResult,
  allWorkers,
  isProcessingActionImages,
  onActionImageFiles,
  onRemoveActionImage,
  onPreviewImage
}) => {
  if (!actionModalData?.isOpen || !actionModalData?.issue || typeof document === "undefined") {
    return null;
  }

  const isMeetingAction = actionModalData.issue.category === "회의일정";

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-2 sm:p-4 py-2 sm:py-8 flex justify-center items-start sm:items-center animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-lg w-full p-3.5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 sm:space-y-4 my-auto animate-scaleUp cursor-default"
      >
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl text-white shadow-xs ${isMeetingAction ? "bg-purple-600" : "bg-emerald-500"}`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                {isMeetingAction ? "회의결과 등록 및 종결 처리" : "조치결과 입력 및 조치완료 처리"}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {isMeetingAction
                  ? "해당 회의일정에 대한 결정 사항 및 회의록을 기록합니다."
                  : "해당 품질경보 및 공지사항에 대한 조치 완료 결과를 기록합니다."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Target Issue Reference Info */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
              actionModalData.issue.category === "회의일정"
                ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                : actionModalData.issue.category === "공지사항" || actionModalData.issue.category === "사내공지"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : actionModalData.issue.category === "오픈이슈"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
            }`}>
              {actionModalData.issue.plant} • {
                actionModalData.issue.category === "회의일정"
                  ? "📅 회의일정"
                  : (actionModalData.issue.category === "공지사항" || actionModalData.issue.category === "사내공지")
                  ? "📢 사내공지"
                  : actionModalData.issue.category === "오픈이슈"
                  ? "📌 오픈이슈"
                  : "🚨 품질경보"
              }
            </span>
            <strong className="text-slate-900 dark:text-white font-black truncate">
              {actionModalData.issue.title}
            </strong>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
            {actionModalData.issue.content}
          </p>
        </div>

        <form onSubmit={onSaveActionResult} className="space-y-3 sm:space-y-4 text-xs">
          {/* 조치자 / 작성자 선택 */}
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
              {isMeetingAction ? "작성자 / 보고자" : "조치자"} (직접 선택)
            </label>
            <select
              value={actionModalData.actionAuthor || ""}
              required
              onChange={(e) => setActionModalData((prev) => ({ ...prev, actionAuthor: e.target.value }))}
              className={`w-full px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                !actionModalData.actionAuthor
                  ? "border-blue-400 bg-blue-50/60 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-400/40"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              }`}
            >
              <option value="">-- {isMeetingAction ? "작성자 / 보고자" : "조치자"} 직접 선택 (필수) --</option>
              <optgroup label="👑 본사 임원진">
                {allWorkers?.filter((w) => w.plantName === "본사").map((w) => (
                  <option key={w.id} value={w.name}>본사 • {w.name} {w.title || ""}</option>
                ))}
              </optgroup>
              <optgroup label="🏢 삼랑진공장">
                {allWorkers?.filter((w) => w.plantName === "삼랑진공장" && !w.isPartner).map((w) => (
                  <option key={w.id} value={w.name}>삼랑진 • {w.name} {w.title || ""}</option>
                ))}
              </optgroup>
              <optgroup label="🏢 한림공장">
                {allWorkers?.filter((w) => w.plantName === "한림공장" && !w.isPartner).map((w) => (
                  <option key={w.id} value={w.name}>한림 • {w.name} {w.title || ""}</option>
                ))}
              </optgroup>
              <optgroup label="🤝 협력업체">
                {allWorkers?.filter((w) => w.isPartner).map((w) => (
                  <option key={w.id} value={w.name}>협력 • {w.name} ({w.plantName})</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 결과 상세 내용 */}
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
              {isMeetingAction ? "회의 결과 및 결정 사항" : "조치결과 상세 내용"}
            </label>
            <textarea
              rows="4"
              required
              placeholder={
                isMeetingAction
                  ? "예:\n1. 품질 개선 프로세스 표준화 방안 확정\n2. 2공장 라인 적용 일정 수립 (다음 주 월요일부터 시행)\n3. 담당자별 후속 조치 업무 분장 완료"
                  : "예: 센서 커넥터 재체결 및 예열 온도 정상치(180℃) 도달 확인 완료 (설비 정상 가동)"
              }
              value={actionModalData.actionResult}
              onChange={(e) => setActionModalData((prev) => ({ ...prev, actionResult: e.target.value }))}
              className={`w-full p-3.5 rounded-xl border-2 bg-white dark:bg-slate-800 font-semibold leading-relaxed text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                isMeetingAction
                  ? "border-purple-500/50 dark:border-purple-500/40 focus:ring-purple-500"
                  : "border-emerald-500/50 dark:border-emerald-500/40 focus:ring-emerald-500"
              }`}
            ></textarea>
          </div>

          {/* 📷 사진 첨부 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Camera className={`w-3.5 h-3.5 ${isMeetingAction ? "text-purple-500" : "text-emerald-500"}`} />
                <span>{isMeetingAction ? "회의록 / 결과 사진 첨부 (선택, 최대 3장)" : "조치 후 사진 첨부 (선택, 최대 3장)"}</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {actionModalData.actionImages?.length || 0}/3장
              </span>
            </div>

            {/* Dual Buttons: 1. 📸 즉시 카메라 촬영 / 2. 📁 앨범·파일 선택 */}
            <div className="grid grid-cols-2 gap-2">
              {/* Option 1: 📸 즉시 카메라 촬영 */}
              <div>
                <input
                  type="file"
                  id="action-issue-camera-input"
                  accept="image/*"
                  capture="environment"
                  disabled={isProcessingActionImages || (actionModalData.actionImages?.length || 0) >= 3}
                  onChange={(e) => {
                    if (e.target.files) {
                      onActionImageFiles(e.target.files);
                      e.target.value = "";
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="action-issue-camera-input"
                  className={`w-full py-2.5 px-2.5 rounded-xl border-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 ${
                    (actionModalData.actionImages?.length || 0) >= 3
                      ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                      : isMeetingAction
                      ? "border-purple-500 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-200 ring-1 ring-purple-500/30 font-black"
                      : "border-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-200 ring-1 ring-emerald-500/30 font-black"
                  }`}
                >
                  <Camera className={`w-4 h-4 shrink-0 ${isMeetingAction ? "text-purple-600 dark:text-purple-400" : "text-emerald-600 dark:text-emerald-400"}`} />
                  <span className="text-xs font-black truncate">
                    {isProcessingActionImages
                      ? "압축 처리 중..."
                      : (actionModalData.actionImages?.length || 0) >= 3
                      ? "최대 3장 완료"
                      : "📸 사진 즉시 촬영"}
                  </span>
                </label>
              </div>

              {/* Option 2: 📁 앨범 / 파일 선택 */}
              <div>
                <input
                  type="file"
                  id="action-issue-gallery-input"
                  accept="image/*"
                  multiple
                  disabled={isProcessingActionImages || (actionModalData.actionImages?.length || 0) >= 3}
                  onChange={(e) => {
                    if (e.target.files) {
                      onActionImageFiles(e.target.files);
                      e.target.value = "";
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="action-issue-gallery-input"
                  className={`w-full py-2.5 px-2.5 rounded-xl border-2 border-dashed flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                    (actionModalData.actionImages?.length || 0) >= 3
                      ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                      : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs font-bold truncate">
                    📁 앨범/파일 선택
                  </span>
                </label>
              </div>
            </div>

            {actionModalData.actionImages && actionModalData.actionImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {actionModalData.actionImages.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square shadow-xs"
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      onClick={() => onPreviewImage({ url: img.dataUrl, name: img.name })}
                      className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveActionImage(idx)}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-white font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
                isMeetingAction
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-500/25"
                  : "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-500/25"
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isMeetingAction ? "회의결과 저장 및 종결" : "조치결과 저장 및 완료"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
