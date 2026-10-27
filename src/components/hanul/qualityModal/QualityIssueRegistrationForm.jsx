import React from "react";
import {
  Edit3,
  Flame,
  Calendar,
  Camera,
  ZoomIn,
  X,
  User,
  ShieldAlert,
  Send
} from "lucide-react";

export const QualityIssueRegistrationForm = ({
  companyLabel,
  currentProfile,
  editingIssueId,
  setEditingIssueId,
  todayStr,
  defaultLineName,
  form,
  setForm,
  handleSubmit,
  processOptions,
  defectOptions,
  causeFileInputRef,
  actionFileInputRef,
  isProcessingCauseImages,
  isProcessingActionImages,
  handleCauseImageFiles,
  handleRemoveCauseImage,
  handleActionImageFiles,
  handleRemoveActionImage,
  setPreviewImage,
  isProcessing,
  handleRegisterWithMode
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border-2 border-rose-500/40 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${editingIssueId ? "bg-teal-600" : "bg-rose-600"} text-white shadow-xs`}>
            {editingIssueId ? <Edit3 className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
              {editingIssueId ? `${companyLabel} 부적합경보 수정` : `${companyLabel} 부적합경보 등록 및 현장전파`}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {editingIssueId && (
            <button
              type="button"
              onClick={() => {
                setEditingIssueId(null);
                setForm({
                  date: todayStr,
                  createdAt: undefined,
                  line: defaultLineName,
                  defectType: "외관 스크래치 / 찍힘",
                  title: "",
                  content: "",
                  actionResult: "",
                  causeImages: [],
                  actionImages: [],
                  isFirstScreenBroadcast: false
                });
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              수정 취소
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Row 1: 발생일자(등록일) & 대상 공정 & 불량 유형 (3열 그리드) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 발생일자 (등록일) */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
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

          {/* 대상 공정 */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              대상 공정 / 품목 <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.line}
              onChange={(e) => setForm({ ...form, line: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20"
            >
              {processOptions.map((l) => (
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
              {defectOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: 품질경보 제목 */}
        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
            품질경보 제목 (불량 현상 핵심 요약) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="예: 9BQC G/RUN 조립부 테이프 접착 들뜸 및 외관 스크래치 발생"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        {/* Row 3: 발생원인 영역 & 조치결과 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 1) 발생원인 내용 및 발생원인 사진 촬영 */}
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
              onChange={(e) => handleCauseImageFiles(e.target.files)}
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
                          setPreviewImage({ url: img.dataUrl, name: img.name });
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
                          handleRemoveCauseImage(idx);
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

          {/* 2) 조치결과 내용 및 조치결과 사진 촬영 */}
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
              placeholder="예: 조립 가이드 위치 교정 완료, 테이프 압착 압력 강화 및 초물 전수검사 합격 확인"
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
              onChange={(e) => handleActionImageFiles(e.target.files)}
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
                          setPreviewImage({ url: img.dataUrl, name: img.name });
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
                          handleRemoveActionImage(idx);
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

        {/* Submit Badges (2개 등록뱃지: 전사부적합등록 / 현장내전파등록) */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-purple-600" />
            <span>
              등록자: <strong>{currentProfile?.name || "한울"} {currentProfile?.title || "사원"}</strong>
            </span>
          </span>

          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            {/* 1. 전사부적합등록 뱃지 */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleRegisterWithMode("GLOBAL")}
              className="px-4 sm:px-5 py-2.5 rounded-xl font-black text-white text-xs sm:text-sm shadow-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 hover:from-rose-500 hover:to-amber-500 border border-amber-300/60 shadow-rose-600/25 disabled:opacity-50"
            >
              <ShieldAlert className="w-4 h-4 text-amber-200" />
              <span>{editingIssueId ? "전사부적합 수정등록" : "전사부적합등록"}</span>
            </button>

            {/* 2. 현장내전파등록 뱃지 */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleRegisterWithMode("SITE_ONLY")}
              className="px-4 sm:px-5 py-2.5 rounded-xl font-black text-white text-xs sm:text-sm shadow-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 border border-indigo-400/50 shadow-indigo-600/25 disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-cyan-200" />
              <span>{editingIssueId ? "현장내전파 수정등록" : "현장내전파등록"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
