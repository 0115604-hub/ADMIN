import React from "react";
import {
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Save,
  UploadCloud,
  ShieldCheck,
  Wrench,
  FileSpreadsheet,
  FileCheck,
  Sparkles,
  Camera
} from "lucide-react";
import {
  DEFECT_TYPE_GROUPS,
  JAEYUL_CATEGORY_EQUIPMENT_MAP,
  JAEYUL_EQUIPMENT_CATEGORIES
} from "../../WorkerDashboard";

export default function CreateWorkLogModal({
  isModalOpen,
  setIsModalOpen,
  isInjoo,
  isJaeyul,
  isExtrusionWorker,
  isQualityWorker,
  isAdmin,
  isGeneralManager,
  logout,
  assignedProcess,
  formData,
  setFormData,
  handleSaveLog,
  isSavingLog,
  logSavedToast,
  formatAmount,
  currentProfile,
  workerFullName,
  workerPlant,
  officialTitle,
  workerDept,
  workerPosition,
  isProcessingImages,
  handleWorkLogImageFiles,
  handleRemoveWorkLogImage,
  previewImageModal,
  setPreviewImageModal,
  selectedMonth,
  currentYearMonth,
  availableMonths,
  DEFAULT_MONTH_LIST,
  // Excel / Injoo upload
  parsedResult,
  setParsedResult,
  uploadSuccess,
  setUploadSuccess,
  fileInputRef,
  handleExcelFile,
  handleDrag,
  handleDrop,
  dragActive,
  parsing,
  uploading,
  successMessage,
  handleConfirmExcelUpload,
  // Maintenance items
  maintenanceItems,
  handleAddMaintenanceItem,
  handleRemoveMaintenanceItem,
  handleUpdateMaintenanceItem,
  handleMaintenanceItemImageFiles,
  handleRemoveMaintenanceItemImage,
  // Quality files upload
  qualityFiles,
  setQualityFiles,
  qualityUploadSuccess,
  setQualityUploadSuccess,
  qualityFileInputRef,
  handleQualityFiles,
  handleQualityDrag,
  handleQualityDrop,
  qualityDragActive,
  qualityParsing,
  qualityUploading,
  qualitySuccessMessage,
  handleConfirmQualityUpload
}) {
  if (!isModalOpen) return null;

  return (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer"
        >
          {isInjoo ? (
            /* ========================================================================= */
            /* ⭐ [조인주 선임 전용] 탭했을 때 뜨는: 1. 작성란 & 2. 드래그업로드 창 */
            /* ========================================================================= */
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                      오늘의 업무일지 작성 & 매입매출 엑셀 등록
                    </h3>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                      삼랑진공장 • 조인주 선임 [경리업무]
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-black rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* 2 Dedicated Panes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PANE 1: 📝 오늘의 업무일지 작성란 */}
                <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
                    <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>1. 업무일지 작성란</span>
                    </h4>
                    <span className="text-[11px] font-bold text-slate-400">
                      {formData.date}
                    </span>
                  </div>

                  <form onSubmit={handleSaveLog} className="space-y-3 text-xs flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      {/* Row 1: [작성일자] [부서 (자동)] [이름(직책) (자동)] */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">작성일자</label>
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 shadow-inner"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">부서</label>
                          <input
                            type="text"
                            value={workerDept || "관리팀"}
                            disabled
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate shadow-inner"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">이름(직책)</label>
                          <input
                            type="text"
                            value={`${workerFullName} (${workerPosition})`}
                            disabled
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold text-blue-600 dark:text-blue-400 truncate shadow-inner"
                          />
                        </div>
                      </div>

                      {/* Row 2: 1. 주요 작업 내용 (2배 대형 패널) */}
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          주요 작업 내용 (경리 / 결산 / 정산) <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={6}
                          placeholder="예: 매입매출 마감 전표 대조, 전자세금계산서 발행 및 현장 정산 정리 내역 입력"
                          value={formData.workContent}
                          onChange={(e) => setFormData({ ...formData, workContent: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                      </div>

                      {/* Row 3: 2. ⚠️ 부적합사항 및 개선조치 + 사진 첨부 (통합 카테고리, 최대 3장) */}
                      <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-800/60 p-2.5 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-amber-200 dark:border-amber-900/50">
                          <span className="text-[10.5px] font-black text-amber-900 dark:text-amber-300 flex items-center gap-1">
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
                            className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-amber-500"
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
                                  id="worklog-camera-injoo-before"
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
                                  htmlFor="worklog-camera-injoo-before"
                                  className={`w-full py-1.5 px-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer text-center text-[10px] font-bold ${
                                    ((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3
                                      ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                      : "border-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-200 font-bold"
                                  }`}
                                >
                                  <Camera className="w-3 h-3 text-rose-600" />
                                  <span>촬영</span>
                                </label>
                              </div>
                              <div>
                                <input
                                  type="file"
                                  id="worklog-gallery-injoo-before"
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
                                  htmlFor="worklog-gallery-injoo-before"
                                  className={`w-full py-1.5 px-1 rounded-lg border border-dashed flex items-center justify-center gap-1 cursor-pointer text-center text-[10px] font-bold ${
                                    ((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3
                                      ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                  }`}
                                >
                                  <UploadCloud className="w-3 h-3 text-slate-400" />
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
                                  id="worklog-camera-injoo-after"
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
                                  htmlFor="worklog-camera-injoo-after"
                                  className={`w-full py-1.5 px-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer text-center text-[10px] font-bold ${
                                    ((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3
                                      ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                      : "border-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-200 font-bold"
                                  }`}
                                >
                                  <Camera className="w-3 h-3 text-emerald-600" />
                                  <span>촬영</span>
                                </label>
                              </div>
                              <div>
                                <input
                                  type="file"
                                  id="worklog-gallery-injoo-after"
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
                                  htmlFor="worklog-gallery-injoo-after"
                                  className={`w-full py-1.5 px-1 rounded-lg border border-dashed flex items-center justify-center gap-1 cursor-pointer text-center text-[10px] font-bold ${
                                    ((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3
                                      ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                  }`}
                                >
                                  <UploadCloud className="w-3 h-3 text-slate-400" />
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
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {logSavedToast && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>일지가 저장되었습니다!</span>
                        </span>
                      )}
                      <button
                        type="submit"
                        disabled={isSavingLog}
                        className="ml-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingLog ? "저장 중..." : "오늘의 업무일지 등록"}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* PANE 2: 📊 매입매출현황 엑셀 드래그 앤 드롭 업로드 창 */}
                <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
                    <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-emerald-600" />
                      <span>2. 매입매출 엑셀 드래그 업로드</span>
                    </h4>
                    {parsedResult && (
                      <button
                        onClick={() => { setParsedResult(null); setUploadSuccess(false); }}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline"
                      >
                        새 파일 올리기
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={(e) => handleExcelFile(e.target.files?.[0])}
                  />

                  {!parsedResult ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[170px] ${
                        dragActive
                          ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 scale-[1.01]"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-emerald-400 hover:bg-emerald-50/20"
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shadow-sm">
                        {parsing ? (
                          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <FileSpreadsheet className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {parsing ? "엑셀 데이터 분석 중..." : "매입매출 엑셀 파일을 여기에 드래그하세요"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          또는 클릭하여 컴퓨터에서 파일 선택 (.xlsx, .xls)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 flex-1 flex flex-col justify-between text-xs">
                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                        {/* File Meta Header */}
                        <div className="flex items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-800/60 pb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-black text-xs text-slate-900 dark:text-white block truncate" title={parsedResult.fileName}>
                                {parsedResult.fileName}
                              </span>
                              <span className="text-[10.5px] text-slate-400 font-medium">
                                용량: {parsedResult.fileSize} • 시트 {parsedResult.sheetCount || 1}개
                              </span>
                            </div>
                          </div>

                          {/* Month Selector */}
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] font-bold text-slate-500">반영월:</span>
                            <select
                              value={parsedResult.yearMonth || selectedMonth || currentYearMonth || "2026-09"}
                              onChange={(e) => setParsedResult((prev) => ({ ...prev, yearMonth: e.target.value }))}
                              className="px-2 py-1 rounded-lg border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-800 font-black text-xs text-emerald-900 dark:text-emerald-100 cursor-pointer shadow-2xs"
                            >
                              {(availableMonths || DEFAULT_MONTH_LIST || ["2026-09", "2026-08", "2026-07"]).map((m) => (
                                <option key={m} value={m}>
                                  {m.slice(0, 4)}년 {parseInt(m.slice(5), 10)}월
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Extracted Stats Grid */}
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-900/40">
                            <span className="text-[10px] font-bold text-slate-500 block">추출 총 매출액</span>
                            <span className="text-xs font-black text-blue-700 dark:text-blue-300">
                              {parsedResult.totalSales > 0 ? formatAmount(parsedResult.totalSales) : "기존 매출 유지"}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-900/40">
                            <span className="text-[10px] font-bold text-slate-500 block">추출 총 매입/비용</span>
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                              {parsedResult.totalExpenses > 0 ? formatAmount(parsedResult.totalExpenses) : "기존 매입 유지"}
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 text-[10.5px] text-slate-600 dark:text-slate-300 font-bold col-span-2 flex items-center justify-between">
                            <span>자재/전표 거래내역: <strong className="text-emerald-600 dark:text-emerald-400">{parsedResult.items?.length || 0}건</strong></span>
                            <span>차종별 매출군: <strong className="text-blue-600 dark:text-blue-400">{parsedResult.vehicleSales?.length || 0}개</strong></span>
                          </div>
                        </div>
                      </div>

                      {uploadSuccess ? (
                        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{successMessage}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={handleConfirmExcelUpload}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {uploading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>데이터베이스 반영 중...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{parsedResult.yearMonth || selectedMonth} 매입매출 데이터베이스 즉시 반영하기</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isJaeyul ? (
            /* ========================================================================= */
            /* ⭐ [설비보전 전용: 전재율 책임] 설비보전일지 작성 모달 (동적 항목 추가 지원) */
            /* ========================================================================= */
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-7 border-2 border-blue-500/40 dark:border-blue-600/40 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
                    <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <span>오늘의 설비보전일지 작성</span>
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                        {workerPlant} • {workerFullName} {officialTitle} [설비보전]
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
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-black rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
                {/* 1. 작성일자, 소속공장, 근무형태 (상단 기본 정보) */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">작성일자</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">소속공장</label>
                    <select
                      value={formData.plant}
                      onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="삼랑진공장">삼랑진공장</option>
                      <option value="한림공장">한림공장</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">근무형태</label>
                    <select
                      value={formData.shift}
                      onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="주간">주간 (08:00~17:00)</option>
                      <option value="야간">야간 (20:00~05:00)</option>
                      <option value="특근">주말 특근</option>
                    </select>
                  </div>
                </div>

                {/* 2. 설비보전 점검 및 작업 내역 (동적 항목 리스트) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>설비보전 작업 및 점검 내역 ({maintenanceItems.length}개 항목)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMaintenanceItem}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 font-black text-xs border border-blue-200 dark:border-blue-800 active:scale-95 transition-all shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ 항목 추가</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {maintenanceItems.map((item, index) => {
                      const isCustom = item.equipmentName === "내용직접입력" || item.equipmentName === "직접입력" || item.equipmentName === "내용입력 (직접입력)";

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border-2 border-slate-200/80 dark:border-slate-700/80 space-y-2.5 relative group"
                        >
                          {/* Item Card Header */}
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 text-white font-black text-[11px] shadow-2xs">
                              항목 #{index + 1}
                            </span>

                            {maintenanceItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMaintenanceItem(item.id)}
                                className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 text-xs font-black px-2 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                ✕ 항목 삭제
                              </button>
                            )}
                          </div>

                          {/* Selectors: 대분류 & 설비명 */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* 대분류 */}
                            <div>
                              <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                대분류
                              </label>
                              <select
                                value={item.category}
                                onChange={(e) => handleUpdateMaintenanceItem(item.id, "category", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                              >
                                {JAEYUL_EQUIPMENT_CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>

                            {/* 설비명 (대분류에 연동되며, 내용직접입력 선택 시 별도 하위창 없이 해당 칸에 직접 입력) */}
                            <div>
                              <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                설비명 ({item.category})
                              </label>

                              {isCustom ? (
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    autoFocus
                                    placeholder={item.category === "치공구" ? "치공구명 직접 입력" : "설비명 직접 입력"}
                                    value={item.customEquipmentName || ""}
                                    onChange={(e) => handleUpdateMaintenanceItem(item.id, "customEquipmentName", e.target.value)}
                                    className="w-full px-2.5 py-1.5 pr-14 rounded-xl border-2 border-blue-500 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none shadow-2xs"
                                  />
                                  {JAEYUL_CATEGORY_EQUIPMENT_MAP[item.category]?.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const firstEq = JAEYUL_CATEGORY_EQUIPMENT_MAP[item.category][0];
                                        handleUpdateMaintenanceItem(item.id, "equipmentName", firstEq);
                                        handleUpdateMaintenanceItem(item.id, "customEquipmentName", "");
                                      }}
                                      className="absolute right-1 top-1 bottom-1 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-0.5 cursor-pointer"
                                      title="목록에서 다시 선택하기"
                                    >
                                      <span>목록</span>
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <select
                                  value={item.equipmentName}
                                  onChange={(e) => {
                                    handleUpdateMaintenanceItem(item.id, "equipmentName", e.target.value);
                                    if (e.target.value === "내용직접입력") {
                                      handleUpdateMaintenanceItem(item.id, "customEquipmentName", "");
                                    }
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                                >
                                  {(JAEYUL_CATEGORY_EQUIPMENT_MAP[item.category] || ["내용직접입력"]).map((eq) => (
                                    <option key={eq} value={eq}>
                                      {eq === "내용직접입력" ? "✏️ 내용직접입력 (직접입력)" : eq}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>

                          {/* 설비보전내용 입력란 */}
                          <div>
                            <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              설비보전내용 <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                              rows="2"
                              placeholder="설비 점검, 정비, 부품 교체, 트러블 슈팅, 오일 보충 내역 등을 상세히 기록해 주세요."
                              value={item.content}
                              onChange={(e) => handleUpdateMaintenanceItem(item.id, "content", e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            ></textarea>
                          </div>

                          {/* 📷 [항목별 개선 전 / 개선 후 사진 첨부] */}
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10.5px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>설비보전 사진 첨부 (항목별 개선전 / 개선후)</span>
                              </span>
                              <span className="text-[9.5px] text-slate-400 font-medium">각 최대 3장</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {/* 🔴 개선 전 (Before) */}
                              <div className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10.5px] font-black text-rose-700 dark:text-rose-400 flex items-center gap-1">
                                    🔴 개선 전 (Before)
                                  </span>
                                  <span className="text-[9px] font-bold text-rose-500 font-mono">
                                    {(item.imagesBefore?.length || 0)}/3장
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5">
                                  <div>
                                    <input
                                      type="file"
                                      id={`camera-before-${item.id}`}
                                      accept="image/*"
                                      capture="environment"
                                      disabled={isProcessingImages || (item.imagesBefore?.length || 0) >= 3}
                                      onChange={(e) => {
                                        if (e.target.files) {
                                          handleMaintenanceItemImageFiles(item.id, e.target.files, "before");
                                          e.target.value = "";
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor={`camera-before-${item.id}`}
                                      className={`w-full py-1.5 px-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-all text-center ${(item.imagesBefore?.length || 0) >= 3 ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed text-[10px]" : "border-rose-300 bg-white hover:bg-rose-100 dark:bg-slate-900 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] font-bold shadow-2xs active:scale-95"}`}
                                    >
                                      <Camera className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                                      <span className="truncate">촬영</span>
                                    </label>
                                  </div>

                                  <div>
                                    <input
                                      type="file"
                                      id={`album-before-${item.id}`}
                                      accept="image/*"
                                      multiple
                                      disabled={isProcessingImages || (item.imagesBefore?.length || 0) >= 3}
                                      onChange={(e) => {
                                        if (e.target.files) {
                                          handleMaintenanceItemImageFiles(item.id, e.target.files, "before");
                                          e.target.value = "";
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor={`album-before-${item.id}`}
                                      className={`w-full py-1.5 px-1 rounded-lg border border-dashed flex items-center justify-center gap-1 cursor-pointer transition-all text-center ${(item.imagesBefore?.length || 0) >= 3 ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed text-[10px]" : "border-rose-300 hover:border-rose-400 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-[10px] font-bold shadow-2xs active:scale-95"}`}
                                    >
                                      <UploadCloud className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="truncate">앨범/파일</span>
                                    </label>
                                  </div>
                                </div>

                                {item.imagesBefore && item.imagesBefore.length > 0 && (
                                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                                    {item.imagesBefore.map((img, imgIdx) => (
                                      <div key={img.id || imgIdx} className="relative group rounded-lg overflow-hidden border border-rose-300 dark:border-rose-800 bg-slate-100 dark:bg-slate-800 aspect-square shadow-2xs">
                                        <img
                                          src={img.dataUrl}
                                          alt="Before"
                                          className="w-full h-full object-cover cursor-pointer"
                                          onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `개선전_${imgIdx + 1}` })}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveMaintenanceItemImage(item.id, imgIdx, "before")}
                                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-[9px] font-black cursor-pointer shadow-xs"
                                          title="삭제"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* 🟢 개선 후 (After) */}
                              <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10.5px] font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                    🟢 개선 후 (After)
                                  </span>
                                  <span className="text-[9px] font-bold text-emerald-500 font-mono">
                                    {(item.imagesAfter?.length || 0)}/3장
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5">
                                  <div>
                                    <input
                                      type="file"
                                      id={`camera-after-${item.id}`}
                                      accept="image/*"
                                      capture="environment"
                                      disabled={isProcessingImages || (item.imagesAfter?.length || 0) >= 3}
                                      onChange={(e) => {
                                        if (e.target.files) {
                                          handleMaintenanceItemImageFiles(item.id, e.target.files, "after");
                                          e.target.value = "";
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor={`camera-after-${item.id}`}
                                      className={`w-full py-1.5 px-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-all text-center ${(item.imagesAfter?.length || 0) >= 3 ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed text-[10px]" : "border-emerald-300 bg-white hover:bg-emerald-100 dark:bg-slate-900 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shadow-2xs active:scale-95"}`}
                                    >
                                      <Camera className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      <span className="truncate">촬영</span>
                                    </label>
                                  </div>

                                  <div>
                                    <input
                                      type="file"
                                      id={`album-after-${item.id}`}
                                      accept="image/*"
                                      multiple
                                      disabled={isProcessingImages || (item.imagesAfter?.length || 0) >= 3}
                                      onChange={(e) => {
                                        if (e.target.files) {
                                          handleMaintenanceItemImageFiles(item.id, e.target.files, "after");
                                          e.target.value = "";
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor={`album-after-${item.id}`}
                                      className={`w-full py-1.5 px-1 rounded-lg border border-dashed flex items-center justify-center gap-1 cursor-pointer transition-all text-center ${(item.imagesAfter?.length || 0) >= 3 ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed text-[10px]" : "border-emerald-300 hover:border-emerald-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold shadow-2xs active:scale-95"}`}
                                    >
                                      <UploadCloud className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="truncate">앨범/파일</span>
                                    </label>
                                  </div>
                                </div>

                                {item.imagesAfter && item.imagesAfter.length > 0 && (
                                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                                    {item.imagesAfter.map((img, imgIdx) => (
                                      <div key={img.id || imgIdx} className="relative group rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-800 bg-slate-100 dark:bg-slate-800 aspect-square shadow-2xs">
                                        <img
                                          src={img.dataUrl}
                                          alt="After"
                                          className="w-full h-full object-cover cursor-pointer"
                                          onClick={() => setPreviewImageModal({ url: img.dataUrl, name: img.name || `개선후_${imgIdx + 1}` })}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveMaintenanceItemImage(item.id, imgIdx, "after")}
                                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center text-[9px] font-black cursor-pointer shadow-xs"
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
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom + 항목 추가 button */}
                  <button
                    type="button"
                    onClick={handleAddMaintenanceItem}
                    className="w-full py-2.5 rounded-2xl border-2 border-dashed border-blue-400/80 dark:border-blue-600/80 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-black text-xs transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>설비보전 항목 추가하기</span>
                  </button>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  {logSavedToast && (
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
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
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>오늘의 설비보전일지 등록</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : isExtrusionWorker ? (
            /* ========================================================================= */
            /* ⭐ [압출동 전용: 설유철 책임] 압출동 업무일지 작성 모달 (엑셀 업로드 제거) */
            /* ========================================================================= */
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
                      <span>{isInjoo ? "경리업무일지" : isQualityWorker ? "품질관리일지" : isExtrusionWorker ? "압출동 업무일지" : "가공동 업무일지"} 작성</span>
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
          ) : isQualityWorker ? (
            /* ========================================================================= */
            /* ⭐ [품질관리 전용: 이창엽/이상기] 탭했을 때 뜨는: 1. 업무일지 작성란 & 2. 품질 2개 파일 드래그업로드 창 */
            /* ========================================================================= */
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                      오늘의 업무일지 작성 & 일일 품질현황 엑셀 2개 파일 등록
                    </h3>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      {workerPlant} • {workerFullName} {officialTitle} [품질관리]
                    </span>
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

              {/* 2 Dedicated Panes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PANE 1: 📝 오늘의 업무일지 작성란 */}
                <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
                    <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>1. 업무일지 작성란</span>
                    </h4>
                    <span className="text-[11px] font-bold text-slate-400">
                      {formData.date}
                    </span>
                  </div>

                  <form onSubmit={handleSaveLog} className="space-y-3 text-xs flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      {/* Row 1: [작성일자] [부서 (자동)] [이름(직책) (자동)] */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">작성일자</label>
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 shadow-inner"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">부서</label>
                          <input
                            type="text"
                            value={workerDept}
                            disabled
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate shadow-inner"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">이름(직책)</label>
                          <input
                            type="text"
                            value={`${workerFullName} (${workerPosition})`}
                            disabled
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 truncate shadow-inner"
                          />
                        </div>
                      </div>

                      {/* Row 2: 1. 주요 작업 내용 (2배 대형 패널) */}
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          주요 작업 내용 (품질 검사 / 불량 분석 / 로트 추적) <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={6}
                          placeholder="예: JA / HR / NX4 G-RUN 일일 품질검사 실적 및 불량률(수포, 어퍼떨어짐 등) 집계 및 부적합 조치"
                          value={formData.workContent}
                          onChange={(e) => setFormData({ ...formData, workContent: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        ></textarea>
                      </div>

                      {/* Row 3: 2. ⚠️ 부적합사항 및 개선조치 + 사진 첨부 (통합 카테고리, 최대 3장) */}
                      <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-800/60 p-2.5 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-amber-200 dark:border-amber-900/50">
                          <span className="text-[10.5px] font-black text-amber-900 dark:text-amber-300 flex items-center gap-1">
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
                            className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-amber-500"
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
                                  id="worklog-camera-quality-before"
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
                                  htmlFor="worklog-camera-quality-before"
                                  className={`w-full py-1.5 px-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer text-center text-[10px] font-bold ${
                                    ((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3
                                      ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                      : "border-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-200 font-bold"
                                  }`}
                                >
                                  <Camera className="w-3 h-3 text-rose-600" />
                                  <span>촬영</span>
                                </label>
                              </div>
                              <div>
                                <input
                                  type="file"
                                  id="worklog-gallery-quality-before"
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
                                  htmlFor="worklog-gallery-quality-before"
                                  className={`w-full py-1.5 px-1 rounded-lg border border-dashed flex items-center justify-center gap-1 cursor-pointer text-center text-[10px] font-bold ${
                                    ((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3
                                      ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                  }`}
                                >
                                  <UploadCloud className="w-3 h-3 text-slate-400" />
                                  <span>앨범</span>
                                </label>
                              </div>
                            </div>
                            {/* Thumbnails Before */}
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
                                  id="worklog-camera-quality-after"
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
                                  htmlFor="worklog-camera-quality-after"
                                  className={`w-full py-1.5 px-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer text-center text-[10px] font-bold ${
                                    ((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3
                                      ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                      : "border-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-200 font-bold"
                                  }`}
                                >
                                  <Camera className="w-3 h-3 text-emerald-600" />
                                  <span>촬영</span>
                                </label>
                              </div>
                              <div>
                                <input
                                  type="file"
                                  id="worklog-gallery-quality-after"
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
                                  htmlFor="worklog-gallery-quality-after"
                                  className={`w-full py-1.5 px-1 rounded-lg border border-dashed flex items-center justify-center gap-1 cursor-pointer text-center text-[10px] font-bold ${
                                    ((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3
                                      ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                  }`}
                                >
                                  <UploadCloud className="w-3 h-3 text-slate-400" />
                                  <span>앨범</span>
                                </label>
                              </div>
                            </div>
                            {/* Thumbnails After */}
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
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {logSavedToast && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>일지가 저장되었습니다!</span>
                        </span>
                      )}
                      <button
                        type="submit"
                        disabled={isSavingLog}
                        className="ml-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingLog ? "저장 중..." : "오늘의 업무일지 등록"}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* PANE 2: 🔍 일일 품질현황 엑셀 파일 2개 드래그 앤 드롭 업로드 창 */}
                <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-800/80 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
                    <div className="flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                        2. 품질 엑셀 파일 2개 드래그 업로드
                      </h4>
                    </div>
                    {qualityFiles.length > 0 && (
                      <button
                        onClick={() => { setQualityFiles([]); setQualityUploadSuccess(false); }}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline"
                      >
                        새 파일 올리기
                      </button>
                    )}
                  </div>

                  <input
                    ref={qualityFileInputRef}
                    type="file"
                    multiple
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={(e) => handleQualityFiles(e.target.files)}
                  />

                  {qualityFiles.length === 0 ? (
                    <div
                      onDragEnter={handleQualityDrag}
                      onDragOver={handleQualityDrag}
                      onDragLeave={handleQualityDrag}
                      onDrop={handleQualityDrop}
                      onClick={() => qualityFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[170px] ${
                        qualityDragActive
                          ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 scale-[1.01]"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-400 hover:bg-indigo-50/20"
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shadow-sm">
                        {qualityParsing ? (
                          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <FileSpreadsheet className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {qualityParsing ? "품질 엑셀 파일 분석 중..." : "품질 관련 엑셀 파일을 여기에 드래그하세요 (1개 또는 여러 개 동시 가능)"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          (일일품질검사실적.xlsx, G-RUN 불량율 집계.xlsx, AB동 최종검사 정리 등)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        {qualityFiles.map((f, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                              <div className="text-left min-w-0">
                                <span className="font-bold text-[11px] text-slate-900 dark:text-white block truncate max-w-[180px]">
                                  {f.name}
                                </span>
                                <span className="text-[9.5px] text-indigo-600 dark:text-indigo-400 font-bold">
                                  파일 #{i + 1} • {f.size}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                              준비완료
                            </span>
                          </div>
                        ))}
                      </div>

                      {qualityUploadSuccess ? (
                        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">{qualitySuccessMessage}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={qualityUploading}
                          onClick={handleConfirmQualityUpload}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          {qualityUploading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>품질 데이터베이스 반영 중...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>품질 엑셀 {qualityFiles.length}개 파일 데이터베이스 즉시 반영하기</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* ⭐ [일반 작업자용] 표준 업무일지 작성 모달 */
            /* ========================================================================= */
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>오늘의 업무일지 작성</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-black rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveLog} className="space-y-3.5 text-xs">
                {/* Row 1: [사업장/공장] [작성일자] [부서 (자동)] [이름(직책) (자동)] */}
                <div className={`grid gap-2 ${isAdmin || isGeneralManager ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
                  {(isAdmin || isGeneralManager) && (
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mb-1">사업장/공장</label>
                      <select
                        value={formData.plant || (isAdmin ? "본사" : workerPlant)}
                        onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-950/40 text-[11px] font-bold text-blue-800 dark:text-blue-300 shadow-inner cursor-pointer"
                      >
                        {isAdmin && <option value="본사">본사</option>}
                        <option value="삼랑진공장">삼랑진공장</option>
                        <option value="한림공장">한림공장</option>
                      </select>
                    </div>
                  )}
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
                      value={workerDept || "생산팀"}
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
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold text-blue-600 dark:text-blue-400 truncate shadow-inner"
                    />
                  </div>
                </div>

                {/* Row 2: 1. 주요 작업 실적 (2배 대형 패널) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    주요 작업 실적 <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    placeholder="오늘 진행한 주요 작업 내용 및 생산 수량, 품번별 실적을 입력해 주세요."
                    value={formData.workContent}
                    onChange={(e) => setFormData({ ...formData, workContent: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                      onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
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
                            id="worklog-camera-standard-before"
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
                            htmlFor="worklog-camera-standard-before"
                            className={`w-full py-2 px-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer text-center text-[10.5px] font-bold ${
                              ((formData.imagesBefore?.length || 0) + (formData.imagesAfter?.length || 0)) >= 3
                                ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                : "border-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-200 font-bold"
                            }`}
                          >
                            <Camera className="w-3.5 h-3.5 text-rose-600" />
                            <span>촬영</span>
                          </label>
                        </div>
                        <div>
                          <input
                            type="file"
                            id="worklog-gallery-standard-before"
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
                            htmlFor="worklog-gallery-standard-before"
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
                            id="worklog-camera-standard-after"
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
                            htmlFor="worklog-camera-standard-after"
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
                            id="worklog-gallery-standard-after"
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
                            htmlFor="worklog-gallery-standard-after"
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

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingLog}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingLog ? "저장 중..." : "등록하기"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
  );
}
