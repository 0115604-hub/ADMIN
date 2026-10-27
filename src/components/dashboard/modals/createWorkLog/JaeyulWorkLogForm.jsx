import {
  Wrench,
  Plus,
  Camera,
  CheckCircle2,
  Save
} from "lucide-react";
import {
  JAEYUL_EQUIPMENT_CATEGORIES,
  JAEYUL_CATEGORY_EQUIPMENT_MAP
} from "../../../../hooks/dashboard/useWorkLogCrud";

export default function JaeyulWorkLogForm({
  setIsModalOpen,
  formData,
  setFormData,
  handleSaveLog,
  isSavingLog = false,
  isProcessingImages = false,
  logSavedToast,
  workerPlant,
  workerFullName,
  officialTitle,
  logout,
  maintenanceItems,
  handleAddMaintenanceItem,
  handleRemoveMaintenanceItem,
  handleUpdateMaintenanceItem,
  handleMaintenanceItemImageFiles,
  handleRemoveMaintenanceItemImage,
  setPreviewImageModal
}) {
  return (
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
  );
}
