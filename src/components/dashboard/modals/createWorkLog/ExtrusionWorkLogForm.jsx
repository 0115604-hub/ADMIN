import {
  Wrench,
  CheckCircle2,
  Camera,
  Save,
  AlertTriangle
} from "lucide-react";
import { DEFECT_TYPE_GROUPS } from "../../../../hooks/dashboard/useWorkLogCrud";

export default function ExtrusionWorkLogForm({
  setIsModalOpen,
  workerPlant,
  workerFullName,
  officialTitle,
  assignedProcess,
  logout,
  formData,
  setFormData,
  workerDept,
  workerPosition,
  handleSaveLog,
  isSavingLog,
  logSavedToast,
  isProcessingImages,
  handleWorkLogImageFiles,
  handleRemoveWorkLogImage,
  setPreviewImageModal
}) {
  return (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-7 border-2 border-emerald-500/40 dark:border-emerald-600/40 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                        <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                          <span>압출동 업무일지 작성</span>
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                            {workerPlant} • {workerFullName} {officialTitle} [{assignedProcess}]
                          </span>
                          <button
                            type="button"
                            onClick={logout}
                            className="text-[10.5px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer bg-rose-50 dark:bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800"
                            title="작업자가 다른 경우 클릭하여 즉시 변경하세요"
                          >
                            본인이 아니신가요? 작업자 변경
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-black rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
    
                  <form onSubmit={handleSaveLog} className="space-y-3.5 text-xs">
                    {/* Row 1: [작성일자] [부서 (자동)] [이름(직책) (자동)] */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mb-1">작성일자</label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mb-1">부서</label>
                        <input
                          type="text"
                          value={workerDept || "압출관리팀"}
                          disabled
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mb-1">이름(직책)</label>
                        <input
                          type="text"
                          value={`${workerFullName} (${workerPosition})`}
                          disabled
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate shadow-inner"
                        />
                      </div>
                    </div>
    
                    {/* Row 2: 1. 주요 작업 실적 및 라인별 가동/비가동 요약 (2배 대형 패널) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        주요 작업 실적 및 라인별 가동/비가동 요약 <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={6}
                        placeholder="오늘 진행한 압출 라인별 생산 실적, 금형 세팅 및 교체, 가동 현황, 비가동 조치사항을 입력해 주세요."
                        value={formData.workContent}
                        onChange={(e) => setFormData({ ...formData, workContent: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      ></textarea>
                    </div>
    
                    {/* Row 3: 2. ⚠️ 부적합사항 및 개선조치 + 사진 첨부 (통합 카테고리, 최대 3장) */}
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-800/60 p-3 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between pb-1 border-b border-amber-200 dark:border-amber-900/50">
                        <span className="text-[11px] font-black text-amber-900 dark:text-amber-300 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>2. 부적합사항 및 개선조치</span>
                        </span>
                        <span className="text-[9.5px] font-mono font-bold text-amber-700 dark:text-amber-400">
                          사진 {((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0))} / 최대 3장
                        </span>
                      </div>
    
                      {/* 부적합 유형 선택 (드롭다운 선택 또는 직접 작성) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            부적합 분류 선택
                          </label>
                          {formData.defectType && (
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, defectType: "" }))}
                              className="text-[9.5px] text-slate-400 hover:text-rose-500 underline font-bold cursor-pointer"
                            >
                              선택 해제
                            </button>
                          )}
                        </div>
    
                        <select
                          value={formData.defectType || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, defectType: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs font-bold text-amber-950 dark:text-amber-200 focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-inner"
                        >
                          <option value="">✏️ 내용 직접 작성 (선택 안함)</option>
                          {DEFECT_TYPE_GROUPS.map((grp) => (
                            <optgroup key={grp.category} label={grp.label}>
                              {grp.items.map((it) => (
                                <option key={it.value} value={it.value}>
                                  {it.name} ({grp.category})
                                </option>
                              ))}
                            </optgroup>
                          ))}
                          <option value="[직접입력] 기타부적합">✏️ 기타 직접 입력</option>
                        </select>
    
                        <textarea
                          rows={2.5}
                          placeholder={formData.defectType ? `선택된 ${formData.defectType} 관련 상세 내용 및 조치사항 입력...` : "부적합 발생 내용, 원인 및 개선 조치 사항 입력 (드롭다운 선택 또는 직접 작성)"}
                          value={formData.issues}
                          onChange={(e) => setFormData((prev) => ({ ...formData, issues: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
    
                      {/* 개선 전(Before) / 개선 후(After) 사진 첨부란 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                        {/* 🔴 개선 전 (Before) */}
                        <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-rose-300 dark:border-rose-900/60 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400">
                              🔴 개선 전 (Before)
                            </span>
                            <span className="text-[9px] font-mono text-rose-500 font-bold">
                              {formData.imagesBefore?.length || 0}장
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div>
                              <input
                                type="file"
                                id="worklog-camera-extrusion-before"
                                accept="image/*"
                                capture="environment"
                                disabled={isProcessingImages || (((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3)}
                                onChange={(e) => {
                                  if (e.target.files) {
                                    handleWorkLogImageFiles(e.target.files, "before");
                                    e.target.value = "";
                                  }
                                }}
                                className="hidden"
                              />
                              <label
                                htmlFor="worklog-camera-extrusion-before"
                                className={`w-full py-2 px-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer text-center text-[10.5px] font-bold ${
                                  ((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3
                                    ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                    : "border-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-200"
                                }`}
                              >
                                <Camera className="w-3.5 h-3.5 text-rose-600" />
                                <span>촬영</span>
                              </label>
                            </div>
                            <div>
                              <input
                                type="file"
                                id="worklog-gallery-extrusion-before"
                                accept="image/*"
                                multiple
                                disabled={isProcessingImages || (((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3)}
                                onChange={(e) => {
                                  if (e.target.files) {
                                    handleWorkLogImageFiles(e.target.files, "before");
                                    e.target.value = "";
                                  }
                                }}
                                className="hidden"
                              />
                              <label
                                htmlFor="worklog-gallery-extrusion-before"
                                className={`w-full py-2 px-1 rounded-lg border border-dashed flex items-center justify-center gap-1 cursor-pointer text-center text-[10.5px] font-bold ${
                                  ((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3
                                    ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                                <span>앨범</span>
                              </label>
                            </div>
                          </div>
                          {formData.imagesBefore && formData.imagesBefore.length > 0 && (
                            <div className="grid grid-cols-3 gap-1 pt-1">
                              {formData.imagesBefore.map((img, idx) => (
                                <div key={img.id || idx} className="relative group rounded-md overflow-hidden border border-rose-300 dark:border-rose-800 aspect-square">
                                  <img src={img.dataUrl} alt="Before" className="w-full h-full object-cover cursor-pointer" onClick={() => setPreviewImageModal({ url: img.dataUrl, name: "개선 전 사진" })} />
                                  <span className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-rose-600 text-white text-[8px] font-black">Before</span>
                                  <button type="button" onClick={() => handleRemoveWorkLogImage(idx, "before")} className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-black/70 text-white flex items-center justify-center text-[8px] font-black">✕</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
    
                        {/* 🟢 개선 후 (After) */}
                        <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-300 dark:border-emerald-900/60 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                              🟢 개선 후 (After)
                            </span>
                            <span className="text-[9px] font-mono text-emerald-500 font-bold">
                              {formData.imagesAfter?.length || 0}장
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div>
                              <input
                                type="file"
                                id="worklog-camera-extrusion-after"
                                accept="image/*"
                                capture="environment"
                                disabled={isProcessingImages || (((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3)}
                                onChange={(e) => {
                                  if (e.target.files) {
                                    handleWorkLogImageFiles(e.target.files, "after");
                                    e.target.value = "";
                                  }
                                }}
                                className="hidden"
                              />
                              <label
                                htmlFor="worklog-camera-extrusion-after"
                                className={`w-full py-2 px-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer text-center text-[10.5px] font-bold ${
                                  ((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3
                                    ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                    : "border-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-200 font-bold"
                                }`}
                              >
                                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                                <span>촬영</span>
                              </label>
                            </div>
                            <div>
                              <input
                                type="file"
                                id="worklog-gallery-extrusion-after"
                                accept="image/*"
                                multiple
                                disabled={isProcessingImages || (((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3)}
                                onChange={(e) => {
                                  if (e.target.files) {
                                    handleWorkLogImageFiles(e.target.files, "after");
                                    e.target.value = "";
                                  }
                                }}
                                className="hidden"
                              />
                              <label
                                htmlFor="worklog-gallery-extrusion-after"
                                className={`w-full py-2 px-1 rounded-lg border border-dashed flex items-center justify-center gap-1 cursor-pointer text-center text-[10.5px] font-bold ${
                                  ((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3
                                    ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                                <span>앨범</span>
                              </label>
                            </div>
                          </div>
                          {formData.imagesAfter && formData.imagesAfter.length > 0 && (
                            <div className="grid grid-cols-3 gap-1 pt-1">
                              {formData.imagesAfter.map((img, idx) => (
                                <div key={img.id || idx} className="relative group rounded-md overflow-hidden border border-emerald-300 dark:border-emerald-800 aspect-square">
                                  <img src={img.dataUrl} alt="After" className="w-full h-full object-cover cursor-pointer" onClick={() => setPreviewImageModal({ url: img.dataUrl, name: "개선 후 사진" })} />
                                  <span className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-emerald-600 text-white text-[8px] font-black">After</span>
                                  <button type="button" onClick={() => handleRemoveWorkLogImage(idx, "after")} className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-black/70 text-white flex items-center justify-center text-[8px] font-black">✕</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
    
                    {/* Footer Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      {logSavedToast && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>일지가 저장되었습니다!</span>
                        </span>
                      )}
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingLog}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isSavingLog ? "저장 중..." : "오늘의 압출동 업무일지 등록"}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
  );
}
