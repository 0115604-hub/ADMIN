import React from "react";
import { getFourMRecordCompany } from "../../../services/fourMChangePointService";

/**
 * ⏱️ 2단계 공정관리자: 당일 비가동 · 부적합 1차 소팅 바 (5개사 전사 관리자 1차 분류 및 품질이관)
 */
export default function Step2IncidentSortingBar({
  selectedCompanyFilter,
  setSelectedCompanyFilter,
  allIncidents,
  filteredIncidents,
  incidentCounts,
  selectedIncidentBadge,
  setSelectedIncidentBadge,
  selectedItemBadge,
  onPreviewImg,
  onSortIncident
}) {
  return (
    <div className="p-3 sm:p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/60 space-y-2.5">
      {/* 5개사 소속사 선택 필터 바 */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-amber-200/60 dark:border-amber-900/40">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-black text-amber-900 dark:text-amber-200 mr-1 flex items-center gap-1">
            <span>🏢</span> <span>소속 5개사 선택:</span>
          </span>
          {["ALL", "오륙", "한울", "유성", "조영", "부림텍"].map((compKey) => {
            const isSelected = selectedCompanyFilter === compKey;
            const count = compKey === "ALL"
              ? allIncidents.length
              : allIncidents.filter((inc) => getFourMRecordCompany(inc) === compKey).length;

            return (
              <button
                key={compKey}
                type="button"
                onClick={() => setSelectedCompanyFilter(compKey)}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer border flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-xs ring-1 ring-indigo-400"
                    : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                }`}
              >
                <span>{compKey === "ALL" ? "5개사 전체" : compKey}</span>
                <span
                  className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? "bg-indigo-700 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:inline">
          ※ 현장작업자 부적합·비가동 ➡️ 1차 상위관리자 검토 후 <strong>[🟢 사내관리]</strong> vs <strong>[🚨 품질이관]</strong> 분류
        </span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-xs sm:text-sm">
            <span>⏱️</span> <span>당일 {selectedCompanyFilter === "ALL" ? "전사" : selectedCompanyFilter} 비가동 · 부적합 1차 소팅</span>
          </span>

          {/* Sorting Filter Buttons */}
          <button
            type="button"
            onClick={() => setSelectedIncidentBadge("ALL")}
            className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
              selectedIncidentBadge === "ALL"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
            }`}
          >
            전체 {incidentCounts.total}건
          </button>

          <button
            type="button"
            onClick={() => setSelectedIncidentBadge(selectedIncidentBadge === "UNSORTED" ? "ALL" : "UNSORTED")}
            className={`px-2 py-0.5 rounded-full text-[10.5px] font-black transition-all cursor-pointer ${
              selectedIncidentBadge === "UNSORTED"
                ? "bg-amber-500 text-black ring-2 ring-amber-300 shadow-xs"
                : incidentCounts.unsorted > 0
                ? "bg-amber-500 text-black animate-pulse"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            ⏳ 분류 {incidentCounts.unsorted}건
          </button>

          <button
            type="button"
            onClick={() => setSelectedIncidentBadge(selectedIncidentBadge === "INTERNAL" ? "ALL" : "INTERNAL")}
            className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
              selectedIncidentBadge === "INTERNAL"
                ? "bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-xs"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200"
            }`}
          >
            🟢 사내종결 {incidentCounts.internal}건
          </button>

          <button
            type="button"
            onClick={() => setSelectedIncidentBadge(selectedIncidentBadge === "QUALITY" ? "ALL" : "QUALITY")}
            className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
              selectedIncidentBadge === "QUALITY"
                ? "bg-rose-600 text-white ring-2 ring-rose-300 shadow-xs"
                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200"
            }`}
          >
            🚨 품질이관 {incidentCounts.quality}건
          </button>
        </div>

        <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
          ※ 관리자 검토 후 원클릭 소팅 ➡️ <strong>[품질이관]</strong> 클릭 시 3단계 품질관리자 대장 자동 이관
        </span>
      </div>

      {/* Incident Items List */}
      {filteredIncidents.length === 0 ? (
        <div className="p-4 bg-white/70 dark:bg-slate-900/50 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
          🟢 {selectedItemBadge !== "ALL" ? `[${selectedItemBadge}] 아이템에 ` : ""}현재 조건에 해당하는 비가동 및 부적합 내역이 없습니다. (정상 가동 중)
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {filteredIncidents.map((inc) => {
            const isUnsorted = !inc.registrationType || inc.registrationType === "UNREGISTERED";
            const isInternal = inc.registrationType === "INTERNAL";
            const isQuality = inc.registrationType === "CHANGE_POINT";

            return (
              <div
                key={inc.id}
                className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
                  isUnsorted
                    ? "bg-amber-100/70 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-xs"
                    : isQuality
                    ? "bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60"
                    : "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/60"
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10.5px] font-black tracking-wide">
                      {getFourMRecordCompany(inc)}
                    </span>
                    {isUnsorted && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black font-black text-[10px]">
                        분류
                      </span>
                    )}
                    {isQuality && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[10px]">
                        🚨 품질이관됨
                      </span>
                    )}
                    {isInternal && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black text-[10px]">
                        🟢 사내종결
                      </span>
                    )}
                    <span className="font-mono text-slate-500 text-[11px]">{inc.date} {inc.time}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {inc.line} ({inc.worker || "작업자"})
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10.5px]">
                      {inc.defectType}
                    </span>
                    {inc.downtimeMinutes > 0 && (
                      <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">{inc.downtimeMinutes}분</span>
                    )}
                    {inc.scrapKg > 0 && (
                      <span className="text-amber-700 dark:text-amber-300 font-mono text-[11px]">{inc.scrapKg} EA/kg</span>
                    )}
                    {(inc.beforePhoto || inc.afterPhoto) && (
                      <button
                        type="button"
                        onClick={() => onPreviewImg(inc.beforePhoto || inc.afterPhoto)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                      >
                        📷 사진보기
                      </button>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-[11.5px] truncate">
                    {inc.content} {inc.actionResult ? `(조치: ${inc.actionResult})` : ""}
                  </p>
                </div>

                {/* 1st Sorting Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {isUnsorted ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onSortIncident(inc, "INTERNAL")}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition cursor-pointer"
                      >
                        🟢 사내관리
                      </button>
                      <button
                        type="button"
                        onClick={() => onSortIncident(inc, "CHANGE_POINT")}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        🚨 품질 변동점 이관 ➡️
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1">
                      {isQuality && (
                        <button
                          type="button"
                          onClick={() => onSortIncident(inc, "CHANGE_POINT")}
                          className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[10.5px] font-bold cursor-pointer transition flex items-center gap-1"
                          title="시정조치 및 조치결과 수정"
                        >
                          <span>✏️ 조치수정</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSortIncident(inc, "UNREGISTERED")}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10.5px] font-bold cursor-pointer"
                        title="소팅 취소 및 재설정"
                      >
                        ↩️ 재소팅
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
