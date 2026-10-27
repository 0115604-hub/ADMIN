import React from "react";
import {
  Wrench,
  Stamp,
  X,
  Camera,
  Plus,
  Eye,
  Trash2,
  Save,
  Send
} from "lucide-react";

export const Step3CapaActionModal = ({
  capaModalItem,
  setCapaModalItem,
  capaForm,
  setCapaForm,
  modalApproverInfo,
  checkIsCeoApproved,
  handleAddBeforePhotos,
  handleSetBeforePhotoSlot,
  handleRemoveBeforePhoto,
  handleAddAfterPhotos,
  handleSetAfterPhotoSlot,
  handleRemoveAfterPhoto,
  handleSaveProgress,
  handleSubmitToElectronicApproval,
  isSubmittingCapa,
  setPreviewImage
}) => {
  if (!capaModalItem) return null;

  const isApproved = checkIsCeoApproved(capaModalItem);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 space-y-4 text-left">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-md border text-xs font-black flex items-center gap-1 ${
                    isApproved
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700"
                      : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800"
                  }`}
                >
                  {isApproved && <span>✅</span>}
                  <span>4M 시정조치 수정&결재</span>
                </span>
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                  [{modalApproverInfo.plant}] {capaModalItem.line}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                관리번호:{" "}
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {String(capaModalItem.id).replace(/^ledger_/, "")}
                </span>{" "}
                • 발생일자: {capaModalItem.date} {capaModalItem.time}
              </p>
            </div>
          </div>

          {/* Dynamic Target Approver Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1.5 rounded-xl border-2 text-xs font-black flex items-center gap-1.5 ${
                isApproved
                  ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 shadow-xs"
                  : "bg-purple-50 dark:bg-purple-950/60 border-purple-400 dark:border-purple-600 text-purple-900 dark:text-purple-200"
              }`}
            >
              {isApproved ? (
                <span className="text-xs">✅</span>
              ) : (
                <Stamp className="w-4 h-4 text-purple-600" />
              )}
              <span>
                {isApproved
                  ? "대표이사 결재완료 (권태형 최종승인)"
                  : `결재라인: ${modalApproverInfo.lineDisplay}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCapaModalItem(null)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* SECTION 1: 변동점 및 이상내용 */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border-2 border-rose-300/80 dark:border-rose-900/60 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-rose-200/60 dark:border-rose-900/40">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-rose-700 dark:text-rose-300 flex items-center gap-1.5 text-xs sm:text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>1. 변동점 및 이상내용 (발생 현황)</span>
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  {capaModalItem.line || "해당공정"}
                </span>
                {(capaModalItem.downtimeMinutes > 0 || capaModalItem.scrapKg > 0) && (
                  <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300">
                    {capaModalItem.downtimeMinutes > 0 && (
                      <span className="bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                        ⏱️ 비가동 {capaModalItem.downtimeMinutes}분
                      </span>
                    )}
                    {capaModalItem.scrapKg > 0 && (
                      <span className="bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 rounded">
                        🗑️ 폐기 {capaModalItem.scrapKg}kg
                      </span>
                    )}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-600 dark:text-slate-400">4M 구분:</span>
                <select
                  value={capaForm.fourM}
                  onChange={(e) => setCapaForm({ ...capaForm, fourM: e.target.value })}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold outline-none cursor-pointer"
                >
                  <option value="Machine">Machine (설비/금형 이상)</option>
                  <option value="Material">Material (원단/원자재 불량)</option>
                  <option value="Method">Method (작업방법/조건 변경)</option>
                  <option value="Man">Man (작업자 숙련도/인원 교체)</option>
                </select>

                <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={capaForm.isSqNotice}
                    onChange={(e) => setCapaForm({ ...capaForm, isSqNotice: e.target.checked })}
                    className="rounded accent-indigo-600 w-3.5 h-3.5"
                  />
                  <span className="text-amber-600 dark:text-amber-400">SQ 고객사 통보 대상</span>
                </label>
              </div>
            </div>

            {/* 이상 내용 전체 */}
            <div className="space-y-1.5">
              {capaModalItem.title && capaModalItem.title !== capaForm.content && (
                <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 font-black text-xs text-rose-900 dark:text-rose-200 flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[10px]">제목</span>
                  <span>{capaModalItem.title}</span>
                </div>
              )}

              <textarea
                rows={Math.max(3, Math.min(8, (capaForm.content || "").split("\n").length + 1))}
                value={capaForm.content}
                onChange={(e) => setCapaForm({ ...capaForm, content: e.target.value })}
                placeholder="변동점 및 이상 발생 상세 내용을 입력하세요..."
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs leading-relaxed outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs resize-y"
              />
            </div>
          </div>

          {/* SECTION 2: 시정 및 재발방지대책 */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border-2 border-emerald-300/80 dark:border-emerald-800/80 space-y-3 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-emerald-200/60 dark:border-emerald-800/40">
              <span className="font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-xs sm:text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>2. 시정 및 재발방지대책 (CAPA 조치결과)</span>
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                ※ 원인에 따른 구체적 조치내용 및 재발방지 대책을 기재합니다.
              </span>
            </div>

            <textarea
              rows={4}
              value={capaForm.correctiveAction}
              onChange={(e) => setCapaForm({ ...capaForm, correctiveAction: e.target.value })}
              placeholder="예: 긴급조치: 타임 벨트 신품 즉시 교체 및 인취 속도 튜닝 / 재발방지: 벨트 수명 관리 체크리스트 개정(월 1회 점검 표준화)"
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white font-medium text-xs leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs resize-y"
            />

            {/* Author & Date Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60">
                <span className="font-bold text-slate-600 dark:text-slate-400">조치 담당자 (품질):</span>
                <input
                  type="text"
                  value={capaForm.author}
                  onChange={(e) => setCapaForm({ ...capaForm, author: e.target.value })}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none w-36 text-xs"
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60">
                <span className="font-bold text-slate-600 dark:text-slate-400">조치완료(예정)일:</span>
                <input
                  type="date"
                  value={capaForm.targetDate}
                  onChange={(e) => setCapaForm({ ...capaForm, targetDate: e.target.value })}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: 전후사진 각 5장 첨부 (총 10장 슬롯) */}
          <div className="space-y-4 pt-2">
            {/* 3-A. 조치 전 사진 5장 */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-500" />
                  <span className="font-black text-slate-900 dark:text-white text-xs">
                    📷 조치 전 사진 (Before) - 최대 5장 등록
                  </span>
                  <span className="px-2 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
                    {capaForm.beforePhotos.length} / 5장
                  </span>
                </div>

                <label className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  <span>전 사진 일괄 추가</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleAddBeforePhotos(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 5 Slots Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[0, 1, 2, 3, 4].map((slotIdx) => {
                  const img = capaForm.beforePhotos[slotIdx];
                  return (
                    <div
                      key={`before_slot_${slotIdx}`}
                      className="relative aspect-4/3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-1.5 overflow-hidden group"
                    >
                      {img ? (
                        <>
                          <img
                            src={img}
                            alt={`조치 전 ${slotIdx + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[9px] font-bold">
                            전-{slotIdx + 1}
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewImage(img)}
                              className="p-1 rounded-md bg-white/90 text-slate-800 hover:bg-white"
                              title="미리보기"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveBeforePhoto(slotIdx)}
                              className="p-1 rounded-md bg-rose-600 text-white hover:bg-rose-700"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 cursor-pointer text-center p-1">
                          <Camera className="w-4 h-4 mb-0.5" />
                          <span className="text-[10.5px] font-bold">전-{slotIdx + 1} 첨부</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSetBeforePhotoSlot(e.target.files?.[0], slotIdx)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3-B. 조치 후 사진 5장 */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-500" />
                  <span className="font-black text-slate-900 dark:text-white text-xs">
                    📷 조치 후 개선 사진 (After) - 최대 5장 등록
                  </span>
                  <span className="px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                    {capaForm.afterPhotos.length} / 5장
                  </span>
                </div>

                <label className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  <span>후 사진 일괄 추가</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleAddAfterPhotos(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 5 Slots Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[0, 1, 2, 3, 4].map((slotIdx) => {
                  const img = capaForm.afterPhotos[slotIdx];
                  return (
                    <div
                      key={`after_slot_${slotIdx}`}
                      className="relative aspect-4/3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-1.5 overflow-hidden group"
                    >
                      {img ? (
                        <>
                          <img
                            src={img}
                            alt={`조치 후 ${slotIdx + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[9px] font-bold">
                            후-{slotIdx + 1}
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewImage(img)}
                              className="p-1 rounded-md bg-white/90 text-slate-800 hover:bg-white"
                              title="미리보기"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAfterPhoto(slotIdx)}
                              className="p-1 rounded-md bg-rose-600 text-white hover:bg-rose-700"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center text-slate-400 hover:text-emerald-500 cursor-pointer text-center p-1">
                          <Camera className="w-4 h-4 mb-0.5" />
                          <span className="text-[10.5px] font-bold">후-{slotIdx + 1} 첨부</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSetAfterPhotoSlot(e.target.files?.[0], slotIdx)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {isApproved ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span className="text-xs">✅</span>
                <span>대표이사 최종 승인 및 전자서명이 완료된 건입니다.</span>
              </span>
            ) : (
              <>
                💡 <span className="font-bold text-purple-600 dark:text-purple-400">결재라인: </span>
                <span>{modalApproverInfo.lineDisplay} (4M 변동점 전용 전자결재)</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => setCapaModalItem(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              닫기
            </button>

            <button
              type="button"
              disabled={isSubmittingCapa}
              onClick={handleSaveProgress}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-900 font-black text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>수정</span>
            </button>

            <button
              type="button"
              disabled={isSubmittingCapa}
              onClick={handleSubmitToElectronicApproval}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 ring-2 ring-purple-400/40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isApproved ? "임원결재 재상신" : "임원결재"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3CapaActionModal;
