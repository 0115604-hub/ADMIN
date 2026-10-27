import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Save,
  UploadCloud,
  FileSpreadsheet,
  FileCheck,
  Sparkles
} from "lucide-react";
import { DEFECT_TYPE_GROUPS } from "../../../WorkerDashboard";

export default function InjooWorkLogForm({
  setIsModalOpen,
  formData,
  setFormData,
  handleSaveLog,
  isSavingLog,
  logSavedToast,
  workerDept,
  workerFullName,
  workerPosition,
  isProcessingImages,
  handleWorkLogImageFiles,
  handleRemoveWorkLogImage,
  setPreviewImageModal,
  selectedMonth,
  currentYearMonth,
  availableMonths,
  DEFAULT_MONTH_LIST,
  fileInputRef,
  dragActive,
  handleDrag,
  handleDrop,
  handleExcelFile,
  parsing,
  parsedResult,
  setParsedResult,
  setUploadSuccess,
  formatAmount,
  uploadSuccess,
  successMessage,
  uploading,
  handleConfirmExcelUpload
}) {
  return (
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
  );
}
