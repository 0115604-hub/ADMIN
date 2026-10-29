import React from "react";
import {
  Layers,
  X,
  Search,
  RotateCcw,
  Edit3,
  Trash2
} from "lucide-react";

/**
 * 📋 전체 압출 품목 원재료 BOM 목록 & 수정/삭제 모달
 */
export default function ExtrusionBOMCatalogModal({
  isOpen,
  onClose,
  allMasterItems,
  fullBOMCatalogList,
  customModifiedCount,
  lineFilter,
  setLineFilter,
  searchFilter,
  setSearchFilter,
  onResetAllCustomBOM,
  onEditFromModal,
  onRevertCustomBOM
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-5xl w-full p-4 sm:p-6 space-y-3.5 max-h-[88vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>압출 전체 품목 원재료 BOM 현황 및 관리</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-black border border-teal-300">
                  총 {allMasterItems.length}종 (조회: {fullBOMCatalogList.length}건)
                </span>
                {customModifiedCount > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold border border-indigo-300">
                    설유철 수정 {customModifiedCount}건
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                삼랑진공장 PCM 1호·3호, PVC, TPE 라인 268개 품목별 연고무, 컴파운드 4종, 심금, 코팅액 전체 BOM 목록
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Line Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            {[
              { id: "ALL", label: "전체" },
              { id: "pcm1", label: "PCM 1호" },
              { id: "pcm3", label: "PCM 3호" },
              { id: "pvc", label: "PVC" },
              { id: "tpe", label: "TPE" },
              { id: "custom_only", label: `✍️ 수정본 (${customModifiedCount})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLineFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  lineFilter === tab.id
                    ? "bg-slate-900 text-white dark:bg-teal-600 dark:text-white shadow-xs font-black"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="차종, 품명, 연고무, 컴파운드, 심금, 코팅액 검색..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Reset All Custom Overrides Button */}
          {customModifiedCount > 0 && (
            <button
              type="button"
              onClick={onResetAllCustomBOM}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
              title="모든 수정사항 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>수정초기화</span>
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl">
          {fullBOMCatalogList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              검색 조건과 일치하는 압출 품목이 없습니다.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black sticky top-0 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5 text-center w-12">라인</th>
                  <th className="p-2.5 w-16">차종</th>
                  <th className="p-2.5">품명</th>
                  <th className="p-2.5">연고무 (1·2종)</th>
                  <th className="p-2.5">컴파운드 (1·2·3·4종)</th>
                  <th className="p-2.5">심금</th>
                  <th className="p-2.5">코팅액</th>
                  <th className="p-2.5 text-center w-20">단위중량</th>
                  <th className="p-2.5 text-center w-16">상태</th>
                  <th className="p-2.5 text-center w-24">수정 / 삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fullBOMCatalogList.map((row) => (
                  <tr
                    key={row.key}
                    className={`transition ${
                      row.isCustom
                        ? "bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50/70"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {/* 라인 뱃지 */}
                    <td className="p-2.5 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10.5px] font-black ${
                          row.lineId === "pcm1"
                            ? "bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300"
                            : row.lineId === "pcm3"
                            ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300"
                            : row.lineId === "pvc"
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                            : "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300"
                        }`}
                      >
                        {row.lineBadge}
                      </span>
                    </td>

                    {/* 차종 */}
                    <td className="p-2.5 font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {row.vehicle}
                    </td>

                    {/* 품명 */}
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                      <span>{row.itemName}</span>
                      {row.isAS && (
                        <span className="ml-1 text-[10px] text-amber-600 font-bold">(A/S)</span>
                      )}
                    </td>

                    {/* 연고무 */}
                    <td className="p-2.5 font-black text-indigo-700 dark:text-indigo-400">
                      <div>{row.rubberType || "-"}</div>
                      {row.rubberType2 && (
                        <div className="text-[10.5px] text-indigo-500 font-semibold">+ {row.rubberType2}</div>
                      )}
                    </td>

                    {/* 컴파운드 (1~4종) */}
                    <td className="p-2.5 font-bold text-emerald-700 dark:text-emerald-400">
                      <div>{row.compoundType || "-"}</div>
                      {row.compoundType2 && (
                        <div className="text-[10.5px] text-emerald-500 font-semibold">+ {row.compoundType2}</div>
                      )}
                      {row.compoundType3 && (
                        <div className="text-[10.5px] text-emerald-600 font-semibold">+ {row.compoundType3}</div>
                      )}
                      {row.compoundType4 && (
                        <div className="text-[10.5px] text-emerald-600 font-semibold">+ {row.compoundType4}</div>
                      )}
                    </td>

                    {/* 심금 */}
                    <td className="p-2.5 text-slate-700 dark:text-slate-300">
                      {row.insertType && row.insertType !== "미사용" && row.insertType !== "비사용" && row.insertType !== "없음" ? (
                        <span className="text-amber-700 dark:text-amber-400 font-bold">{row.insertType}</span>
                      ) : (
                        <span className="text-slate-400 text-[10.5px]">미사용</span>
                      )}
                    </td>

                    {/* 코팅액 */}
                    <td className="p-2.5 text-slate-700 dark:text-slate-300">
                      {row.coatingType && row.coatingType !== "미사용" && row.coatingType !== "비사용" && row.coatingType !== "없음" ? (
                        <span className="text-sky-700 dark:text-sky-400 font-bold">{row.coatingType}</span>
                      ) : (
                        <span className="text-slate-400 text-[10.5px]">미사용</span>
                      )}
                    </td>

                    {/* 단위중량 */}
                    <td className="p-2.5 text-center font-mono font-black text-teal-600 dark:text-teal-400 whitespace-nowrap">
                      {row.unitWeightG || 500}g
                    </td>

                    {/* 상태 */}
                    <td className="p-2.5 text-center whitespace-nowrap">
                      {row.isCustom ? (
                        <span className="px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[10px] font-black border border-teal-300">
                          ✍️ 수정완료
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                          기본 BOM
                        </span>
                      )}
                    </td>

                    {/* 수정 / 삭제 액션 */}
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditFromModal(row)}
                          className="px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-black text-[11px] transition cursor-pointer flex items-center gap-0.5 shadow-2xs"
                          title="이 품목 상단 폼에 불러와 수정"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>수정</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onRevertCustomBOM(row.key)}
                          className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer border border-transparent hover:border-rose-300"
                          title="BOM 삭제 / 초기화"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <span className="text-teal-700 dark:text-teal-300 font-bold">
            * [수정]을 누르면 상단 입력바에 즉시 로드되고, [삭제] 아이콘을 누르면 해당 BOM 설정이 삭제/초기화됩니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
