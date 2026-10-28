import React from "react";
import {
  CheckCircle2,
  Camera,
  ArrowRight,
  RotateCcw
} from "lucide-react";
import { determineFourMCategory } from "../../../services/fourMChangePointService";

export const Step3IncomingTransferredSection = ({
  incomingTransferredItems,
  incomingSelections,
  setIncomingSelections,
  stats,
  handleReclassifyToInternal,
  handleConfirmToFourMLedger,
  setPreviewImage
}) => {
  return (
    <div className="space-y-3 p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border-2 border-amber-500/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-black font-black text-xs">
            접수함
          </span>
          <h4 className="font-black text-sm sm:text-base text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
            <span>🔔 생산관리자 이관 건 재검토</span>
          </h4>
        </div>
      </div>

      {incomingTransferredItems.length === 0 ? (
        <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
          <p className="font-bold text-slate-700 dark:text-slate-300">
            현재 2단계에서 이관되어 검토 대기 중인 항목이 없습니다.
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            생산관리자가 작업일보에서 [품질 변동점 이관] 버튼을 클릭하면 실시간으로 이곳에 인입됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {incomingTransferredItems.map((item) => {
            const currentSelection = incomingSelections[item.id] || {
              fourM: item.fourM || determineFourMCategory(item) || "Machine",
              isSqNotice: false
            };

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-400/60 dark:border-amber-500/40 shadow-sm space-y-3 text-xs"
              >
                {/* Item Top Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-black text-[11px]">
                      신규 이관 접수
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                      {item.date} {item.time}
                    </span>
                    <span className="font-black text-slate-900 dark:text-white">
                      [{item.plant}] {item.line} {item.carModel ? `(${item.carModel})` : ""}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      (이관자:{" "}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {item.registeredBy || item.worker || "생산관리자"}
                      </strong>
                      )
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold">
                      {item.defectType || "공정 부적합"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                    {item.downtimeMinutes > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        ⏱️ 비가동 {item.downtimeMinutes}분
                      </span>
                    )}
                    {item.scrapKg > 0 && (
                      <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        🗑️ 폐기 {item.scrapKg} kg
                      </span>
                    )}
                  </div>
                </div>

                {/* Defect Description */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11.5px] space-y-1">
                  <div className="font-medium">
                    <strong className="text-amber-600 dark:text-amber-400 font-black">
                      현장 발생 및 이관 내용:{" "}
                    </strong>
                    {item.content || item.title}
                  </div>
                  {item.actionResult && (
                    <div className="text-slate-500 dark:text-slate-400">
                      <strong className="text-slate-600 dark:text-slate-400">현장 응급조치: </strong>
                      {item.actionResult}
                    </div>
                  )}
                </div>

                {/* Image Thumbnail */}
                {item.beforePhoto && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewImage(item.beforePhoto)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-indigo-500" />
                      <span>현장 증빙 사진 확인</span>
                    </button>
                  </div>
                )}

                {/* Quality Manager Action Control Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-black text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1">
                      <span>품질 4M 판정:</span>
                    </span>
                    <select
                      value={currentSelection.fourM}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIncomingSelections((prev) => ({
                          ...prev,
                          [item.id]: { ...(prev[item.id] || {}), fourM: val }
                        }));
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-indigo-500/50 text-indigo-800 dark:text-indigo-300 font-black text-xs outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Machine">Machine (설비/금형 이상)</option>
                      <option value="Material">Material (자재/원단 불량)</option>
                      <option value="Method">Method (작업방법/조건 변경)</option>
                      <option value="Man">Man (작업자 변경/숙련도)</option>
                    </select>

                    <label className="flex items-center gap-1.5 text-[11.5px] text-slate-700 dark:text-slate-300 font-bold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={currentSelection.isSqNotice}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIncomingSelections((prev) => ({
                            ...prev,
                            [item.id]: { ...(prev[item.id] || {}), isSqNotice: checked }
                          }));
                        }}
                        className="rounded accent-indigo-600 w-3.5 h-3.5"
                      />
                      <span className="text-amber-600 dark:text-amber-400">SQ 고객사 통보 대상</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReclassifyToInternal(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-300 dark:border-slate-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>사내관리로 재분류 (반송)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConfirmToFourMLedger(item)}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 ring-2 ring-indigo-400/40 cursor-pointer"
                    >
                      <span>➕ 공식 4M 대장 등재 및 CAPA 착수</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Step3IncomingTransferredSection;
