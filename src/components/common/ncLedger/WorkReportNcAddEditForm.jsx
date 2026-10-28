import React from "react";

/**
 * 작업일보 부적합 내역 신규 등록 / 수정 폼
 */
export default function WorkReportNcAddEditForm({
  isAddOpen,
  editingItemId,
  formRegType,
  setFormRegType,
  formLine,
  setFormLine,
  formDefectType,
  setFormDefectType,
  formScrapKg,
  setFormScrapKg,
  formContent,
  setFormContent,
  formActionResult,
  setFormActionResult,
  formBeforePhoto,
  setFormBeforePhoto,
  formAfterPhoto,
  setFormAfterPhoto,
  onPhotoUpload,
  onCancel,
  onSave
}) {
  if (!isAddOpen) return null;

  return (
    <div className="p-4 bg-rose-50/50 border-b border-rose-200 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-slate-800">
          {editingItemId ? "✏️ 작업일보 부적합 내역 수정 및 대장 등록" : "➕ 작업일보 부적합 내역 신규 등록"}
        </span>
        {/* Registration Badge Selector in Form */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black text-slate-600 mr-1">등록구분 뱃지:</span>
          <button
            type="button"
            onClick={() => setFormRegType("CHANGE_POINT")}
            className={`px-3 py-1 rounded-full text-[11px] font-black border transition-all cursor-pointer ${
              formRegType === "CHANGE_POINT"
                ? "bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-200"
                : "bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50"
            }`}
          >
            🔄 변동점등록 (4M 변동점관리대장 동시등록)
          </button>
          <button
            type="button"
            onClick={() => setFormRegType("INTERNAL")}
            className={`px-3 py-1 rounded-full text-[11px] font-black border transition-all cursor-pointer ${
              formRegType === "INTERNAL"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-200"
                : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
            }`}
          >
            🏢 사내관리등록 (부적합관리대장 전용)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1">발생 공정 / 라인</label>
          <input
            type="text"
            value={formLine}
            onChange={(e) => setFormLine(e.target.value)}
            placeholder="예: 9BQC 조인트 / PCM 1호기"
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1">부적합 유형</label>
          <input
            type="text"
            value={formDefectType}
            onChange={(e) => setFormDefectType(e.target.value)}
            placeholder="예: 외관 스크래치 / 치수 불량"
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1">부적합 수량 (EA 또는 kg)</label>
          <input
            type="number"
            value={formScrapKg}
            onChange={(e) => setFormScrapKg(e.target.value)}
            placeholder="0"
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1">발생원인 및 부적합 상세내용</label>
          <input
            type="text"
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            placeholder="작업일보 내 발생한 부적합 상세 내역 입력"
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-600 mb-1">조치결과 및 대책</label>
          <input
            type="text"
            value={formActionResult}
            onChange={(e) => setFormActionResult(e.target.value)}
            placeholder="현장 조치 내역 입력 (입력 시 조치완료 처리)"
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
          />
        </div>
      </div>

      {/* 조치전 / 조치후 사진 업로드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="bg-white p-2.5 rounded-lg border border-rose-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-rose-700 block">📸 조치전 사진 (부적합 현상)</span>
            <label className="mt-1 inline-block px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-black cursor-pointer">
              사진 선택
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPhotoUpload("beforePhoto", e.target.files?.[0])}
                className="hidden"
              />
            </label>
          </div>
          {formBeforePhoto && (
            <div className="relative">
              <img src={formBeforePhoto} alt="조치전" className="w-14 h-14 object-cover rounded-lg border border-rose-300" />
              <button
                type="button"
                onClick={() => setFormBeforePhoto(null)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-emerald-700 block">📸 조치후 사진 (개선 완료)</span>
            <label className="mt-1 inline-block px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-black cursor-pointer">
              사진 선택
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPhotoUpload("afterPhoto", e.target.files?.[0])}
                className="hidden"
              />
            </label>
          </div>
          {formAfterPhoto && (
            <div className="relative">
              <img src={formAfterPhoto} alt="조치후" className="w-14 h-14 object-cover rounded-lg border border-emerald-300" />
              <button
                type="button"
                onClick={() => setFormAfterPhoto(null)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 text-xs font-bold cursor-pointer"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-sm cursor-pointer"
        >
          💾 저장 및 {formRegType === "CHANGE_POINT" ? "변동점등록 (4M 연동)" : "사내관리등록"}
        </button>
      </div>
    </div>
  );
}
