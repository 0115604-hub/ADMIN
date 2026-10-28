import React, { useRef } from "react";
import {
  Calendar,
  Camera,
  Edit3,
  Flame,
  User,
  Check,
  Send,
  ZoomIn,
  X
} from "lucide-react";
import { EXTRUSION_LINES, DEFECT_TYPES } from "../../../services/extrusionQualityIssueService";

/**
 * 2. Top Section: Quality Issue Registration Panel (품질이슈 등록 패널)
 */
export default function ExtrusionIssueForm({
  form,
  setForm,
  editingIssueId,
  onCancelEdit,
  onSubmit,
  isProcessing,
  currentProfile,
  todayStr,
  isProcessingCauseImages,
  onCauseImageFiles,
  onRemoveCauseImage,
  isProcessingActionImages,
  onActionImageFiles,
  onRemoveActionImage,
  onPreviewImage
}) {
  const causeFileInputRef = useRef(null);
  const actionFileInputRef = useRef(null);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border-2 border-rose-500/40 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${editingIssueId ? "bg-teal-600" : "bg-rose-600"} text-white shadow-xs`}>
            {editingIssueId ? <Edit3 className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
              {editingIssueId ? "압출 품질이슈 수정" : "품질이슈 등록 및 현장전파"}
            </h3>
            <p className="text-[11px] text-slate-400">
              발생원인 사진과 조치결과 사진을 분리하여 촬영·등록할 수 있습니다.
            </p>
          </div>
        </div>

        {editingIssueId && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            수정 취소
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        {/* Row 1: 발생일자(등록일) & 압출 대상 라인 & 불량 유형 (3열 그리드) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 발생일자 (등록일) */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-600" />
              <span>발생일자 (등록일)</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={form.date || todayStr}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          {/* 압출 라인 */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              압출 대상 라인 <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.line}
              onChange={(e) => setForm({ ...form, line: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20"
            >
              {EXTRUSION_LINES.map((l) => (
                <option key={l.id} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* 불량 유형 */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              불량 유형 <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.defectType}
              onChange={(e) => setForm({ ...form, defectType: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20"
            >
              {DEFECT_TYPES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: 품질이슈 제목 */}
        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
            품질이슈 제목 (불량 현상 핵심 요약) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="예: PCM 1호 다이스 토출구 이물 누적에 따른 외관 미세 스크래치 발생"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        {/* Row 3: 발생원인 영역 & 조치결과 영역 (각각 촬영 버튼 및 미리보기 완벽 분리) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ========================================= */}
          {/* 1) 발생원인 내용 및 발생원인 사진 촬영 */}
          {/* ========================================= */}
          <div className="p-3.5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-black text-rose-800 dark:text-rose-300 flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>1. 세부 불량 현상 및 발생 원인</span>
                <span className="text-rose-600">*</span>
              </label>
              <span className="text-[10.5px] text-rose-600/80 font-bold">
                원인 사진: {form.causeImages?.length || 0}/8장
              </span>
            </div>

            <textarea
              rows="3"
              required
              placeholder="구체적인 불량 현상, 발생 부위 및 추정 원인을 작성해 주세요."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-rose-500/20"
            ></textarea>

            {/* 발생원인 전용 사진 첨부 input & button */}
            <input
              ref={causeFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onCauseImageFiles(e.target.files)}
            />

            <button
              type="button"
              onClick={() => causeFileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-rose-400 dark:border-rose-700 bg-white dark:bg-slate-900 rounded-xl py-2 px-3 text-center cursor-pointer hover:bg-rose-100/50 dark:hover:bg-rose-950/40 transition-all flex items-center justify-center gap-2 shadow-2xs"
            >
              <Camera className="w-4 h-4 text-rose-600 animate-pulse" />
              <span className="font-black text-rose-700 dark:text-rose-300 text-xs">
                {isProcessingCauseImages ? "사진 압축 처리 중..." : "📷 발생원인 사진 촬영 또는 사진선택"}
              </span>
            </button>

            {/* 발생원인 사진 썸네일 */}
            {form.causeImages && form.causeImages.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-1">
                {form.causeImages.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="relative group rounded-xl overflow-hidden border border-rose-300 dark:border-rose-800 aspect-square bg-slate-100 dark:bg-slate-800"
                  >
                    <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewImage({ url: img.dataUrl, name: img.name });
                        }}
                        className="p-1 rounded bg-white text-slate-900 cursor-pointer"
                        title="확대보기"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveCauseImage(idx);
                        }}
                        className="p-1 rounded bg-rose-600 text-white cursor-pointer"
                        title="삭제"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========================================= */}
          {/* 2) 조치결과 내용 및 조치결과 사진 촬영 */}
          {/* ========================================= */}
          <div className="p-3.5 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border-2 border-teal-200 dark:border-teal-900/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-black text-teal-800 dark:text-teal-300 flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                <span>2. 조치결과 (현장 조치 및 개선 내용)</span>
              </label>
              <span className="text-[10.5px] text-teal-600/80 font-bold">
                조치 사진: {form.actionImages?.length || 0}/8장
              </span>
            </div>

            <textarea
              rows="3"
              placeholder="예: 다이스 토출구 이물 제거 및 청소 실시 완료, 초물 측정 규격 합격 확인"
              value={form.actionResult}
              onChange={(e) => setForm({ ...form, actionResult: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-teal-200 dark:border-teal-800/80 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-teal-500/20"
            ></textarea>

            {/* 조치결과 전용 사진 첨부 input & button */}
            <input
              ref={actionFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onActionImageFiles(e.target.files)}
            />

            <button
              type="button"
              onClick={() => actionFileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-teal-400 dark:border-teal-700 bg-white dark:bg-slate-900 rounded-xl py-2 px-3 text-center cursor-pointer hover:bg-teal-100/50 dark:hover:bg-teal-950/40 transition-all flex items-center justify-center gap-2 shadow-2xs"
            >
              <Camera className="w-4 h-4 text-teal-600 animate-pulse" />
              <span className="font-black text-teal-700 dark:text-teal-300 text-xs">
                {isProcessingActionImages ? "사진 압축 처리 중..." : "📷 조치결과 사진 촬영 또는 사진선택"}
              </span>
            </button>

            {/* 조치결과 사진 썸네일 */}
            {form.actionImages && form.actionImages.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-1">
                {form.actionImages.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="relative group rounded-xl overflow-hidden border border-teal-300 dark:border-teal-800 aspect-square bg-slate-100 dark:bg-slate-800"
                  >
                    <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewImage({ url: img.dataUrl, name: img.name });
                        }}
                        className="p-1 rounded bg-white text-slate-900 cursor-pointer"
                        title="확대보기"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveActionImage(idx);
                        }}
                        className="p-1 rounded bg-rose-600 text-white cursor-pointer"
                        title="삭제"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-rose-600" />
            <span>등록자: <strong>{currentProfile?.name || "설유철"} {currentProfile?.title || "책임"}</strong></span>
          </span>

          <button
            type="submit"
            disabled={isProcessing}
            className={`px-6 py-2.5 rounded-xl font-black text-white text-xs sm:text-sm shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
              editingIssueId
                ? "bg-gradient-to-r from-teal-600 to-cyan-600 shadow-teal-500/25 hover:from-teal-700 hover:to-cyan-700"
                : "bg-gradient-to-r from-rose-600 to-amber-600 shadow-rose-500/25 hover:from-rose-700 hover:to-amber-700"
            }`}
          >
            {editingIssueId ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            <span>{editingIssueId ? "품질이슈 수정 완료" : "🚨 품질이슈 등록 및 현장전파"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
