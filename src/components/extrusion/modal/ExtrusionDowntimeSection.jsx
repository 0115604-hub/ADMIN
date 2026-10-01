import React from "react";
import { Clock, Plus, Trash2 } from "lucide-react";
import { DOWNTIME_CATEGORIES } from "../../../services/extrusionProductionService";

export const ExtrusionDowntimeSection = ({
  downtimeDraft,
  onDowntimeDraftChange,
  onAddDraftEvent,
  downtimeEvents = [],
  onRemoveDowntimeEvent,
  totalDowntimeMinutes = 0,
  totalDowntimeScrapKg = 0
}) => {
  const dtEvents = Array.isArray(downtimeEvents) ? downtimeEvents : [];

  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
      {/* Header & Badges */}
      <div className="flex items-center justify-between flex-wrap gap-1.5">
        <div className="flex items-center gap-2">
          <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
            <Clock className="w-4 h-4 text-amber-500" />
            ④ 비가동 및 불량내역
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            총 {dtEvents.length}건
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            ⏱️ {totalDowntimeMinutes}분
          </span>
          {totalDowntimeScrapKg > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
              🗑️ {totalDowntimeScrapKg}kg
            </span>
          )}
        </div>
      </div>

      {/* Simple Clean Input Card */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-xs space-y-2">
        {/* 1행: 항목(22개) / 시작~종료 / 소요시간 / 폐기량 */}
        <div className="grid grid-cols-2 sm:grid-cols-12 gap-1.5 sm:gap-2 items-center">
          {/* 항목 선택 (4 cols) */}
          <div className="col-span-2 sm:col-span-4">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
              불량/비가동 항목 (22종)
            </label>
            <select
              value={downtimeDraft.category || "압개시"}
              onChange={(e) => onDowntimeDraftChange("category", e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-slate-800 text-xs font-black text-amber-950 dark:text-amber-200 cursor-pointer focus:ring-1 focus:ring-amber-500"
            >
              {DOWNTIME_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} ({["압개시", "형교환", "종료", "설비이상", "다이스수정", "기술TRY"].includes(c.id) ? "비가동" : "불량"})
                </option>
              ))}
            </select>
          </div>

          {/* 시작 ~ 종료 시간 (4 cols) */}
          <div className="col-span-2 sm:col-span-4">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
              시간 (시작 ~ 종료)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="time"
                value={downtimeDraft.startTime || ""}
                onChange={(e) => onDowntimeDraftChange("startTime", e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center text-slate-900 dark:text-white"
              />
              <span className="text-slate-400 text-xs">~</span>
              <input
                type="time"
                value={downtimeDraft.endTime || ""}
                onChange={(e) => onDowntimeDraftChange("endTime", e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 소요시간 (2 cols) */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
              소요시간(분)
            </label>
            <input
              type="number"
              min="0"
              step="5"
              value={downtimeDraft.minutes ?? ""}
              onChange={(e) => onDowntimeDraftChange("minutes", e.target.value)}
              placeholder="0"
              className="w-full px-2 py-1.5 rounded-lg border border-rose-300 dark:border-rose-700 bg-rose-50/40 dark:bg-slate-800 text-xs font-black text-right text-rose-700 dark:text-rose-300"
            />
          </div>

          {/* 폐기량 (2 cols) */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
              폐기중량(kg)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={downtimeDraft.scrapKg ?? ""}
              onChange={(e) => onDowntimeDraftChange("scrapKg", e.target.value)}
              placeholder="0.0"
              className="w-full px-2 py-1.5 rounded-lg border border-orange-300 dark:border-orange-700 bg-orange-50/40 dark:bg-slate-800 text-xs font-black text-right text-orange-700 dark:text-orange-300"
            />
          </div>
        </div>

        {/* 2행: 내역 직접입력/드롭다운선택 + [등록] 버튼 */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={downtimeDraft.detail || ""}
            onChange={(e) => onDowntimeDraftChange("detail", e.target.value)}
            placeholder="발생 내역 및 조치 내용을 입력하세요 (직접 입력 또는 자동 문구 수정)"
            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
          />
          <button
            type="button"
            onClick={onAddDraftEvent}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shrink-0 transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>등록</span>
          </button>
        </div>
      </div>

      {/* 등록된 목록 (간결한 1줄 카드 목록) */}
      {dtEvents.length > 0 ? (
        <div className="space-y-1.5">
          {dtEvents.map((ev, idx) => {
            const isDefect = ["뜯김", "철심", "재압출", "단면형상", "스코치", "이물", "미분산", "발포", "원인불명", "밴딩", "심금절단", "심금노출", "천공", "연고무절단", "길이", "코팅"].includes(ev.category) || ev.type === "불량";
            return (
              <div
                key={ev.id || `dt_item_${idx}`}
                className="p-2 sm:p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs hover:border-slate-400 transition"
              >
                <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                    isDefect ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }`}>
                    {ev.category || "압개시"}
                  </span>

                  {(ev.startTime || ev.endTime) && (
                    <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 shrink-0">
                      {ev.startTime || "--:--"}~{ev.endTime || "--:--"}
                    </span>
                  )}

                  {ev.minutes > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 text-[10.5px] font-black shrink-0">
                      {ev.minutes}분
                    </span>
                  )}

                  {Number(ev.scrapKg) > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 text-[10.5px] font-black shrink-0">
                      폐기 {ev.scrapKg}kg
                    </span>
                  )}

                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate min-w-[80px]" title={ev.detail}>
                    {ev.detail || "-"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveDowntimeEvent(idx)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0"
                  title="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-2.5 text-center text-xs text-slate-400 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
          등록된 비가동 및 불량 내역이 없습니다.
        </div>
      )}
    </div>
  );
};

export default ExtrusionDowntimeSection;
