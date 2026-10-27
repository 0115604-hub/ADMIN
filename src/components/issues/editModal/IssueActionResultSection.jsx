import { CheckCircle2, Camera, Image as ImageIcon } from "lucide-react";

export default function IssueActionResultSection({
  newIssueForm,
  setNewIssueForm,
  allWorkers = [],
  isProcessingActionImages,
  onNewIssueActionImageFiles,
  onRemoveNewIssueActionImage,
  onPreviewImage
}) {
  return (
    <div className={`p-3.5 rounded-2xl border-2 space-y-2.5 transition-all ${
      newIssueForm.category === "회의일정"
        ? "bg-purple-50/70 dark:bg-purple-950/30 border-purple-400 dark:border-purple-800/80"
        : "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-800/80"
    }`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className={`w-4 h-4 ${newIssueForm.category === "회의일정" ? "text-purple-600" : "text-emerald-600"}`} />
          <strong className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
            {newIssueForm.category === "회의일정" ? "회의 결과 및 결정 사항" : "조치 결과 입력"}
          </strong>
        </div>

        {/* Status Toggle Button (회의일정 전용 유지) */}
        {newIssueForm.category === "회의일정" && (
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setNewIssueForm({ ...newIssueForm, isResolved: false })}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                !newIssueForm.isResolved
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              진행대기
            </button>
            <button
              type="button"
              onClick={() => setNewIssueForm({ ...newIssueForm, isResolved: true })}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                newIssueForm.isResolved
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              회의종결
            </button>
          </div>
        )}
      </div>

      <div className={newIssueForm.category === "회의일정" ? "grid grid-cols-1 sm:grid-cols-2 gap-2" : ""}>
        <div>
          <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
            {newIssueForm.category === "회의일정" ? "보고자 / 작성자" : "조치자"} (직접 선택)
          </label>
          <select
            value={newIssueForm.actionAuthor || ""}
            onChange={(e) => setNewIssueForm({ ...newIssueForm, actionAuthor: e.target.value })}
            className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
              !newIssueForm.actionAuthor
                ? "border-blue-400 bg-blue-50/60 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-400/40"
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            }`}
          >
            <option value="">-- {newIssueForm.category === "회의일정" ? "작성자 / 보고자" : "조치자"} 직접 선택 --</option>
            {newIssueForm.actionAuthor && !(allWorkers || []).some((w) => w.name === newIssueForm.actionAuthor) && (
              <option value={newIssueForm.actionAuthor}>현장 • {newIssueForm.actionAuthor}</option>
            )}
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

        {newIssueForm.category === "회의일정" && (
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
              회의 상태
            </label>
            <div className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>{newIssueForm.isResolved ? "✅ 회의 완료/종결" : "⏳ 진행/대기중"}</span>
              <span className="text-[10px] text-slate-400 font-mono">회의종결</span>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
          {newIssueForm.category === "회의일정" ? "회의 결과 및 결정 안건 상세" : "조치결과 상세 내용"}
        </label>
        <textarea
          rows="5"
          placeholder={
            newIssueForm.category === "회의일정"
              ? "예:\n1. 불량 원인 규명 및 금형 히터 교체 일정 확정\n2. 다음 주부터 2공장 표준 점검표 적용 시행"
              : "예: 센서 커넥터 재체결 및 예열 온도 정상치(180℃) 도달 확인 완료 (설비 정상 가동)"
          }
          value={newIssueForm.actionResult}
          onChange={(e) => {
            const val = e.target.value;
            setNewIssueForm({
              ...newIssueForm,
              actionResult: val,
              isResolved: val.trim().length > 0 ? true : newIssueForm.isResolved
            });
          }}
          className="w-full p-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold leading-relaxed text-slate-900 dark:text-white min-h-[110px]"
        ></textarea>
      </div>

      {/* 조치 완료 / 회의 결과 사진 첨부 */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Camera className={`w-3.5 h-3.5 ${newIssueForm.category === "회의일정" ? "text-purple-600" : "text-emerald-600"}`} />
            <span>{newIssueForm.category === "회의일정" ? "회의록/현장 결과 사진 (선택)" : "조치 완료 사진 첨부 (선택)"}</span>
          </label>
          <span className="text-[10px] text-slate-400 font-mono">
            {newIssueForm.actionImages?.length || 0}/3장
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label
            htmlFor="modal-action-camera-input"
            className={`py-2 px-2 rounded-xl border-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
              (newIssueForm.actionImages?.length || 0) >= 3
                ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                : newIssueForm.category === "회의일정"
                ? "border-purple-400 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-black"
                : "border-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black"
            }`}
          >
            <input
              type="file"
              id="modal-action-camera-input"
              accept="image/*"
              capture="environment"
              disabled={isProcessingActionImages || (newIssueForm.actionImages?.length || 0) >= 3}
              onChange={(e) => {
                if (e.target.files) {
                  onNewIssueActionImageFiles(e.target.files);
                  e.target.value = "";
                }
              }}
              className="hidden"
            />
            <Camera className="w-3.5 h-3.5" />
            <span>📸 결과사진 촬영</span>
          </label>

          <label
            htmlFor="modal-action-gallery-input"
            className={`py-2 px-2 rounded-xl border-2 border-dashed flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center ${
              (newIssueForm.actionImages?.length || 0) >= 3
                ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
            }`}
          >
            <input
              type="file"
              id="modal-action-gallery-input"
              accept="image/*"
              multiple
              disabled={isProcessingActionImages || (newIssueForm.actionImages?.length || 0) >= 3}
              onChange={(e) => {
                if (e.target.files) {
                  onNewIssueActionImageFiles(e.target.files);
                  e.target.value = "";
                }
              }}
              className="hidden"
            />
            <ImageIcon className="w-3.5 h-3.5" />
            <span>📁 앨범 선택</span>
          </label>
        </div>

        {newIssueForm.actionImages && newIssueForm.actionImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            {newIssueForm.actionImages.map((img, idx) => (
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
                  onClick={() => onRemoveNewIssueActionImage(idx)}
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
    </div>
  );
}
