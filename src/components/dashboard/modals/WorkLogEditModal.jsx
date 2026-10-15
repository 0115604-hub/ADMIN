import React from "react";
import {
  Plus,
  Trash2,
  Save,
  Edit3,
  UploadCloud,
  ShieldCheck,
  Wrench,
  X,
  Camera
} from "lucide-react";
import {
  DEFECT_TYPE_GROUPS,
  JAEYUL_CATEGORY_EQUIPMENT_MAP,
  JAEYUL_EQUIPMENT_CATEGORIES
} from "../../WorkerDashboard";

export default function WorkLogEditModal({
  editingLog,
  setEditingLog,
  editFormData,
  setEditFormData,
  handleSaveEditedLog,
  editMaintenanceItems,
  handleAddEditMaintenanceItem,
  handleRemoveEditMaintenanceItem,
  handleUpdateEditMaintenanceItem,
  isEditProcessingImages,
  handleEditMaintenanceItemImageFiles,
  setPreviewImageModal,
  handleRemoveEditMaintenanceItemImage,
  handleEditLogImageFiles,
  handleRemoveEditLogImage
}) {
  if (!editingLog) return null;

  return (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingLog(null);
          }}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 border-2 border-blue-500/40 dark:border-blue-600/40 shadow-2xl space-y-4 my-6 animate-scaleUp cursor-default"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                      일일업무일지 내용 수정
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      결재 전 수정
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {editFormData.plant} • {editFormData.writer} {editFormData.title || ""} [{editFormData.process || "생산"}]
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base font-black rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Alert banner */}
            <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 flex items-center gap-2 text-xs text-blue-900 dark:text-blue-200">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                결재 완료 이전이므로 일지 내용 수정이 가능합니다. (결재 완료 후에는 수정이 엄격히 제한됩니다.)
              </span>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveEditedLog} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">작성일자</label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">소속공장/사업장</label>
                  <select
                    value={editFormData.plant}
                    onChange={(e) => setEditFormData({ ...editFormData, plant: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="본사">본사</option>
                    <option value="삼랑진공장">삼랑진공장</option>
                    <option value="한림공장">한림공장</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">근무형태</label>
                  <select
                    value={editFormData.shift}
                    onChange={(e) => setEditFormData({ ...editFormData, shift: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="주간">주간</option>
                    <option value="야간">야간</option>
                    <option value="특근">주말 특근</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">작성자 / 공정</label>
                  <input
                    type="text"
                    value={`${editFormData.writer} ${editFormData.title || ""} (${editFormData.process || "생산"})`}
                    disabled
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-xs font-bold text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">담당 라인 / 설비</label>
                  <input
                    type="text"
                    value={editFormData.line}
                    onChange={(e) => setEditFormData({ ...editFormData, line: e.target.value })}
                    placeholder="예: PCM 1호, JA 가공 2호기 등"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* 설비보전 항목 편집 (설비보전 일지인 경우) */}
              {editMaintenanceItems && editMaintenanceItems.length > 0 && (
                <div className="space-y-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-blue-600" />
                      <span>설비보전 항목 수정 ({editMaintenanceItems.length}건)</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddEditMaintenanceItem}
                      className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      + 항목 추가
                    </button>
                  </div>
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {editMaintenanceItems.map((item, idx) => {
                      const isCustom =
                        item.equipmentName === "내용직접입력" ||
                        item.equipmentName === "직접입력" ||
                        item.equipmentName === "내용입력 (직접입력)" ||
                        !JAEYUL_CATEGORY_EQUIPMENT_MAP[item.category]?.includes(item.equipmentName);

                      return (
                        <div key={item.id || idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-[11px] text-blue-600 dark:text-blue-400">보전 #{idx + 1}</span>
                            {editMaintenanceItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveEditMaintenanceItem(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="항목 삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                                대분류
                              </label>
                              <select
                                value={item.category}
                                onChange={(e) => handleUpdateEditMaintenanceItem(item.id, "category", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                              >
                                {JAEYUL_EQUIPMENT_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                                설비명 ({item.category})
                              </label>
                              {isCustom ? (
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    placeholder={item.category === "치공구" ? "치공구명 직접 입력" : "설비명 직접 입력"}
                                    value={item.customEquipmentName || ""}
                                    onChange={(e) => handleUpdateEditMaintenanceItem(item.id, "customEquipmentName", e.target.value)}
                                    className="w-full px-2.5 py-1.5 pr-14 rounded-xl border-2 border-blue-500 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none shadow-2xs"
                                  />
                                  {JAEYUL_CATEGORY_EQUIPMENT_MAP[item.category]?.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const firstEq = JAEYUL_CATEGORY_EQUIPMENT_MAP[item.category][0];
                                        handleUpdateEditMaintenanceItem(item.id, "equipmentName", firstEq);
                                        handleUpdateEditMaintenanceItem(item.id, "customEquipmentName", "");
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
                                    handleUpdateEditMaintenanceItem(item.id, "equipmentName", e.target.value);
                                    if (e.target.value === "내용직접입력") {
                                      handleUpdateEditMaintenanceItem(item.id, "customEquipmentName", "");
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

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                              설비보전내용 <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                              rows="2"
                              value={item.content}
                              onChange={(e) => handleUpdateEditMaintenanceItem(item.id, "content", e.target.value)}
                              placeholder="설비보전 작업 및 조치 내용 입력..."
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {/* 📷 항목별 개선 전 / 개선 후 사진 첨부 */}
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>설비보전 사진 증빙 (항목별 개선전 / 개선후)</span>
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium">각 최대 3장</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {/* 🔴 개선 전 (Before) */}
                              <div className="p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-rose-700 dark:text-rose-400 flex items-center gap-1">
                                    🔴 개선 전 (Before)
                                  </span>
                                  <span className="text-[8.5px] font-bold text-rose-500 font-mono">
                                    {(item.imagesBefore?.length || 0)}/3장
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-1">
                                  <div>
                                    <input
                                      type="file"
                                      id={`edit-camera-before-${item.id}`}
                                      accept="image/*"
                                      capture="environment"
                                      disabled={isEditProcessingImages || (item.imagesBefore?.length || 0) >= 3}
                                      onChange={(e) => {
                                        if (e.target.files) {
                                          handleEditMaintenanceItemImageFiles(item.id, e.target.files, "before");
                                          e.target.value = "";
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor={`edit-camera-before-${item.id}`}
                                      className={`w-full py-1.5 px-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-all text-center ${(item.imagesBefore?.length || 0) >= 3 ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed text-[9.5px]" : "border-rose-300 bg-white hover:bg-rose-100 dark:bg-slate-900 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[9.5px] font-bold shadow-2xs active:scale-95"}`}
                                    >
                                      <Camera className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                                      <span className="truncate">촬영</span>
                                    </label>
                                  </div>

                                  <div>
                                    <input
                                      type="file"
                                      id={`edit-album-before-${item.id}`}
                                      accept="image/*"
                                      multiple
                                      disabled={isEditProcessingImages || (item.imagesBefore?.length || 0) >= 3}
                                      onChange={(e) => {
                                        if (e.target.files) {
                                          handleEditMaintenanceItemImageFiles(item.id, e.target.files, "before");
                                          e.target.value = "";
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor={`edit-album-before-${item.id}`}
                                      className={`w-full py-1.5 px-1 rounded-lg border border-dashed flex items-center justify-center gap-1 cursor-pointer transition-all text-center ${(item.imagesBefore?.length || 0) >= 3 ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed text-[9.5px]" : "border-rose-300 hover:border-rose-400 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-[9.5px] font-bold shadow-2xs active:scale-95"}`}
                                    >
                                      <UploadCloud className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="truncate">앨범/파일</span>
                                    </label>
                                  </div>
                                </div>

                                {item.imagesBefore && item.imagesBefore.length > 0 && (
                                  <div className="grid grid-cols-3 gap-1 pt-0.5">
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
                                          onClick={() => handleRemoveEditMaintenanceItemImage(item.id, imgIdx, "before")}
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
                              <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                    🟢 개선 후 (After)
                                  </span>
                                  <span className="text-[8.5px] font-bold text-emerald-500 font-mono">
                                    {(item.imagesAfter?.length || 0)}/3장
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-1">
                                  <div>
                                    <input
                                      type="file"
                                      id={`edit-camera-after-${item.id}`}
                                      accept="image/*"
                                      capture="environment"
                                      disabled={isEditProcessingImages || (item.imagesAfter?.length || 0) >= 3}
                                      onChange={(e) => {
                                        if (e.target.files) {
                                          handleEditMaintenanceItemImageFiles(item.id, e.target.files, "after");
                                          e.target.value = "";
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor={`edit-camera-after-${item.id}`}
                                      className={`w-full py-1.5 px-1 rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-all text-center ${(item.imagesAfter?.length || 0) >= 3 ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed text-[9.5px]" : "border-emerald-300 bg-white hover:bg-emerald-100 dark:bg-slate-900 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[9.5px] font-bold shadow-2xs active:scale-95"}`}
                                    >
                                      <Camera className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      <span className="truncate">촬영</span>
                                    </label>
                                  </div>

                                  <div>
                                    <input
                                      type="file"
                                      id={`edit-album-after-${item.id}`}
                                      accept="image/*"
                                      multiple
                                      disabled={isEditProcessingImages || (item.imagesAfter?.length || 0) >= 3}
                                      onChange={(e) => {
                                        if (e.target.files) {
                                          handleEditMaintenanceItemImageFiles(item.id, e.target.files, "after");
                                          e.target.value = "";
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor={`edit-album-after-${item.id}`}
                                      className={`w-full py-1.5 px-1 rounded-lg border border-dashed flex items-center justify-center gap-1 cursor-pointer transition-all text-center ${(item.imagesAfter?.length || 0) >= 3 ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed text-[9.5px]" : "border-emerald-300 hover:border-emerald-400 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9.5px] font-bold shadow-2xs active:scale-95"}`}
                                    >
                                      <UploadCloud className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="truncate">앨범/파일</span>
                                    </label>
                                  </div>
                                </div>

                                {item.imagesAfter && item.imagesAfter.length > 0 && (
                                  <div className="grid grid-cols-3 gap-1 pt-0.5">
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
                                          onClick={() => handleRemoveEditMaintenanceItemImage(item.id, imgIdx, "after")}
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
                </div>
              )}

              {/* 작업 내용 전문 (표준) */}
              {(!editMaintenanceItems || editMaintenanceItems.length === 0) && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    주요 작업 실적 및 상세 내용
                  </label>
                  <textarea
                    rows="5"
                    value={editFormData.workContent}
                    onChange={(e) => setEditFormData({ ...editFormData, workContent: e.target.value })}
                    placeholder="작업 실적, 생산 수량, 공정 진행 내용 등을 수정해 주세요."
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-xs leading-relaxed text-slate-900 dark:text-white"
                  ></textarea>
                </div>
              )}

              {/* 부적합사항 및 개선조치 (설비보전 일지에는 비노출) */}
              {(!editMaintenanceItems || editMaintenanceItems.length === 0) && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-black text-amber-900 dark:text-amber-300">
                      ⚠️ 부적합사항 및 개선조치
                    </label>
                    {editFormData.defectType && (
                      <button
                        type="button"
                        onClick={() => setEditFormData((prev) => ({ ...prev, defectType: "" }))}
                        className="text-[9.5px] text-slate-400 hover:text-rose-600 underline font-bold cursor-pointer"
                      >
                        선택 해제
                      </button>
                    )}
                  </div>

                  <select
                    value={editFormData.defectType || ""}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, defectType: e.target.value }))}
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
                    value={editFormData.issues}
                    onChange={(e) => setEditFormData({ ...editFormData, issues: e.target.value })}
                    placeholder={editFormData.defectType ? `선택된 ${editFormData.defectType} 관련 상세 내용 및 조치사항 입력...` : "부적합 발생 내용, 원인 및 개선 조치 사항 입력 (드롭다운 선택 또는 직접 작성)"}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300/80 dark:border-amber-800 bg-white dark:bg-slate-900 font-medium text-xs text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* 사진 첨부 관리 (비 설비보전 표준 일지 전용) */}
              {(!editMaintenanceItems || editMaintenanceItems.length === 0) && (
                <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-indigo-600" />
                      <span>현장 사진 증빙 ({(editFormData.images || []).length}/5장)</span>
                    </span>
                    {(editFormData.images || []).length < 5 && (
                      <label className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10.5px] font-bold cursor-pointer transition-all">
                        <Plus className="w-3 h-3" />
                        <span>사진 추가</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleEditLogImageFiles(e.target.files)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {Array.isArray(editFormData.images) && editFormData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {editFormData.images.map((img, idx) => (
                        <div key={img.id || idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 aspect-square">
                          <img
                            src={img.dataUrl}
                            alt={`사진 ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveEditLogImage(idx)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white shadow-sm hover:bg-rose-700 transition-all cursor-pointer"
                            title="사진 삭제"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>수정 내용 저장</span>
                </button>
              </div>
            </form>
          </div>
        </div>
  );
}
