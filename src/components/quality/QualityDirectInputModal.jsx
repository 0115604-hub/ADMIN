import React from "react";
import {
  ShieldCheck,
  X,
  Calendar,
  CheckCircle2,
  PlusCircle,
  Trash2,
  Save
} from "lucide-react";

/**
 * QualityDirectInputModal
 * Dialog for directly entering or editing daily quality records across the 4 core items:
 * - Date selection
 * - Inspection & Defect quantities
 * - 4-Material scrap breakdown (A, B, C, D)
 * - Quick defect reason chips
 * - Real-time daily totals & loss calculations
 * - Save / Delete / Cancel actions
 */
export const QualityDirectInputModal = ({
  isOpen,
  onClose,
  directInputDate,
  setDirectInputDate,
  loadDateRecordsIntoDirectForm,
  allRecords = [],
  currentProfile,
  directItemsInput,
  setDirectItemsInput,
  QUALITY_CORE_ITEMS = [],
  handleSaveDirectInput,
  isSavingDirectInput,
  handleDeleteDirectDate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-scaleUp cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  일일 품질 / 불량 실적 직접 입력 포맷
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white">
                  실시간 자동 분석 & 시각화
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                이창엽 책임의 일일 검사/불량/소재폐기 수량을 직접 입력하면 불량률 및 손실액이 100% 자동 계산됩니다.
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="닫기 (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selection Control Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 shadow-xs">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">검사 일자:</span>
              <input
                type="date"
                value={directInputDate}
                onChange={(e) => {
                  setDirectInputDate(e.target.value);
                  if (loadDateRecordsIntoDirectForm) {
                    loadDateRecordsIntoDirectForm(e.target.value);
                  }
                }}
                className="bg-transparent font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white outline-none cursor-pointer"
              />
            </div>

            {allRecords.some((r) => r.date === directInputDate) ? (
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-black border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>기존 등록된 데이터 수정 중</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>신규 일자 등록 모드</span>
              </span>
            )}
          </div>

          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            입력자: <strong className="text-slate-800 dark:text-slate-200">{currentProfile?.name ? `${currentProfile.name} ${currentProfile.title || "책임"}` : "이창엽 책임"}</strong>
          </div>
        </div>

        {/* Modal Body: 4 Core Item Input Cards */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {QUALITY_CORE_ITEMS.map((core) => {
              const it = directItemsInput[core.id] || { inspectQty: 0, defectQty: 0, worstReason: "", unitPrice: core.defaultUnitPrice, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapTotal: 0 };
              const insp = Math.max(0, Number(it.inspectQty) || 0);
              const def = Math.max(0, Number(it.defectQty) || 0);
              const rate = insp > 0 ? Number(((def / insp) * 100).toFixed(2)) : 0;
              const unitPrice = it.unitPrice || core.defaultUnitPrice;
              const loss = Math.round(def * unitPrice);
              const isGood = rate <= 0.70;

              const themeMap = {
                ja: { border: "border-emerald-200 dark:border-emerald-800", bg: "bg-emerald-50/40 dark:bg-emerald-950/20", tag: "bg-emerald-600", text: "text-emerald-600 dark:text-emerald-400" },
                hr: { border: "border-rose-200 dark:border-rose-800", bg: "bg-rose-50/40 dark:bg-rose-950/20", tag: "bg-rose-600", text: "text-rose-600 dark:text-rose-400" },
                nx4a: { border: "border-teal-200 dark:border-teal-800", bg: "bg-teal-50/40 dark:bg-teal-950/20", tag: "bg-teal-600", text: "text-teal-600 dark:text-teal-400" },
                nx4: { border: "border-blue-200 dark:border-blue-800", bg: "bg-blue-50/40 dark:bg-blue-950/20", tag: "bg-blue-600", text: "text-blue-600 dark:text-blue-400" }
              };
              const theme = themeMap[core.id] || themeMap.ja;

              const commonDefects = [
                "수포", "스코치", "사상불량", "둔각 떨어짐", "직각 떨어짐", "직_어퍼떨어짐", "둔_어퍼떨어짐", "삽입불량"
              ];

              const handleAddDefectTag = (tag) => {
                const current = it.worstReason ? it.worstReason.split(",").map(s => s.trim()).filter(Boolean) : [];
                if (!current.includes(tag)) {
                  current.push(tag);
                } else {
                  const idx = current.indexOf(tag);
                  current.splice(idx, 1);
                }
                setDirectItemsInput({
                  ...directItemsInput,
                  [core.id]: { ...it, worstReason: current.join(", ") }
                });
              };

              return (
                <div
                  key={core.id}
                  className={`p-4 rounded-2xl border ${theme.border} ${theme.bg} space-y-3 shadow-xs`}
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${theme.tag}`}></span>
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        {core.name} ({core.carModel})
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-bold">
                      단가: ₩{unitPrice.toLocaleString()}원
                    </span>
                  </div>

                  {/* Input Fields (검사수량 & 불량수량) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        검사수량 (EA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={it.inspectQty || ""}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setDirectItemsInput({
                            ...directItemsInput,
                            [core.id]: { ...it, inspectQty: val }
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-black text-sm text-slate-900 dark:text-white text-right outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        불량수량 (EA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={it.defectQty || ""}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setDirectItemsInput({
                            ...directItemsInput,
                            [core.id]: { ...it, defectQty: val }
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-black text-sm text-rose-600 dark:text-rose-400 text-right outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  {/* ♻️ 4-Material Waste Scrap Inputs (소재 A / B / C / D) */}
                  <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span className="text-amber-500">♻️</span>
                        <span>4종 소재 폐기수량 (소재 A / B / C / D)</span>
                      </span>
                      <span className="text-[10.5px] font-mono font-bold text-slate-500">
                        합계: <strong className="text-rose-600 dark:text-rose-400 font-black">{(Number(it.scrapA || 0) + Number(it.scrapB || 0) + Number(it.scrapC || 0) + Number(it.scrapD || 0)).toLocaleString()} EA</strong>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                          소재 A 폐기
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={it.scrapA || ""}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            const scrapTotal = val + (Number(it.scrapB) || 0) + (Number(it.scrapC) || 0) + (Number(it.scrapD) || 0);
                            setDirectItemsInput({
                              ...directItemsInput,
                              [core.id]: { ...it, scrapA: val, scrapTotal }
                            });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold text-xs text-blue-600 dark:text-blue-400 text-right outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                          소재 B 폐기
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={it.scrapB || ""}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            const scrapTotal = (Number(it.scrapA) || 0) + val + (Number(it.scrapC) || 0) + (Number(it.scrapD) || 0);
                            setDirectItemsInput({
                              ...directItemsInput,
                              [core.id]: { ...it, scrapB: val, scrapTotal }
                            });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold text-xs text-orange-600 dark:text-orange-400 text-right outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                          소재 C 폐기
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={it.scrapC || ""}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            const scrapTotal = (Number(it.scrapA) || 0) + (Number(it.scrapB) || 0) + val + (Number(it.scrapD) || 0);
                            setDirectItemsInput({
                              ...directItemsInput,
                              [core.id]: { ...it, scrapC: val, scrapTotal }
                            });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold text-xs text-amber-600 dark:text-amber-400 text-right outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                          소재 D 폐기
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={it.scrapD || ""}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            const scrapTotal = (Number(it.scrapA) || 0) + (Number(it.scrapB) || 0) + (Number(it.scrapC) || 0) + val;
                            setDirectItemsInput({
                              ...directItemsInput,
                              [core.id]: { ...it, scrapD: val, scrapTotal }
                            });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold text-xs text-purple-600 dark:text-purple-400 text-right outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Real-time Calculated Metrics */}
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-slate-500">불량률:</span>
                      <span className={`font-mono font-black px-1.5 py-0.5 rounded ${
                        isGood ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      }`}>
                        {rate}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-slate-500">품질 손실액:</span>
                      <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                        ₩ {loss.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Defect Reasons & Quick Tags */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                      주요 불량 사유
                    </label>
                    <input
                      type="text"
                      placeholder="예: 둔각 떨어짐 (6건), 수포 (4건)"
                      value={it.worstReason}
                      onChange={(e) => {
                        setDirectItemsInput({
                          ...directItemsInput,
                          [core.id]: { ...it, worstReason: e.target.value }
                        });
                      }}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    />

                    {/* Quick Defect Reason Chips */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {commonDefects.map((dTag) => {
                        const isSelected = it.worstReason?.includes(dTag);
                        return (
                          <button
                            key={dTag}
                            type="button"
                            onClick={() => handleAddDefectTag(dTag)}
                            className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                            }`}
                          >
                            {isSelected ? "✓ " : "+ "}{dTag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Summary Bar & Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white border-t border-slate-700 shrink-0 space-y-3">
          {/* Live Day Totals */}
          {(() => {
            const totalInsp = Object.values(directItemsInput).reduce((sum, it) => sum + (Math.max(0, Number(it.inspectQty) || 0)), 0);
            const totalDef = Object.values(directItemsInput).reduce((sum, it) => sum + (Math.max(0, Number(it.defectQty) || 0)), 0);
            const totalLoss = Object.entries(directItemsInput).reduce((sum, [k, it]) => {
              const def = Math.max(0, Number(it.defectQty) || 0);
              const price = it.unitPrice || QUALITY_CORE_ITEMS.find(c => c.id === k)?.defaultUnitPrice || 3000;
              return sum + (def * price);
            }, 0);
            const avgRate = totalInsp > 0 ? Number(((totalDef / totalInsp) * 100).toFixed(2)) : 0;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">당일 총 검사수량</span>
                  <strong className="text-sm sm:text-base font-black font-mono text-white">{totalInsp.toLocaleString()} EA</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">당일 총 불량수량</span>
                  <strong className="text-sm sm:text-base font-black font-mono text-rose-400">{totalDef.toLocaleString()} EA</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">당일 종합 불량률</span>
                  <strong className={`text-sm sm:text-base font-black font-mono ${avgRate <= 0.70 ? "text-emerald-400" : "text-rose-400"}`}>
                    {avgRate}% {avgRate <= 0.70 ? "(목표달성)" : "(관리주의)"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">당일 총 손실금액</span>
                  <strong className="text-sm sm:text-base font-black font-mono text-amber-300">₩ {totalLoss.toLocaleString()}</strong>
                </div>
              </div>
            );
          })()}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            {allRecords.some((r) => r.date === directInputDate) ? (
              <button
                type="button"
                onClick={handleDeleteDirectDate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>당일 데이터 삭제</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveDirectInput}
                disabled={isSavingDirectInput}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingDirectInput ? "저장 중..." : "💾 당일 품질 실적 저장"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityDirectInputModal;
