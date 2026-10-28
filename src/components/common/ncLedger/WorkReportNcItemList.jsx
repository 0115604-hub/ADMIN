import React from "react";

/**
 * 작업일보 부적합 내역 리스트 뷰
 */
export default function WorkReportNcItemList({
  filteredItems,
  compact = false,
  onPreviewImg,
  onSelectRegistrationBadge,
  onOpenEdit,
  onDeleteItem
}) {
  return (
    <div className={`divide-y divide-slate-100 ${compact ? "max-h-72" : "max-h-96"} overflow-y-auto`}>
      {filteredItems.length === 0 ? (
        <div className="py-8 text-center text-xs font-bold text-slate-400">
          작업일보 내 발생한 부적합 내역이 없습니다.
        </div>
      ) : (
        filteredItems.map((item) => {
          const isChangePoint = item.registrationType === "CHANGE_POINT";
          const isInternal = item.registrationType === "INTERNAL";

          return (
            <div
              key={item.id}
              className="p-3 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                {/* Photos Thumbnail (Before / After) */}
                {(item.beforePhoto || item.afterPhoto) && (
                  <div className="flex items-center gap-1 shrink-0">
                    {item.beforePhoto && (
                      <div
                        onClick={() => onPreviewImg(item.beforePhoto)}
                        className="relative w-11 h-11 rounded-lg overflow-hidden border border-rose-300 cursor-pointer group"
                        title="조치전 사진 확대"
                      >
                        <img src={item.beforePhoto} alt="조치전" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-rose-600/85 text-white text-[8px] font-black text-center">
                          조치전
                        </span>
                      </div>
                    )}
                    {item.afterPhoto && (
                      <div
                        onClick={() => onPreviewImg(item.afterPhoto)}
                        className="relative w-11 h-11 rounded-lg overflow-hidden border border-emerald-300 cursor-pointer group"
                        title="조치후 사진 확대"
                      >
                        <img src={item.afterPhoto} alt="조치후" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-emerald-600/85 text-white text-[8px] font-black text-center">
                          조치후
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-white text-[10px] font-black">
                      {item.company}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black">
                      {item.line}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black">
                      {item.defectType}
                    </span>
                    {item.scrapKg > 0 && (
                      <span className="text-[10px] font-black text-rose-600">
                        ({item.scrapKg} EA/kg)
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400">
                      {item.date} {item.worker ? `• ${item.worker}` : ""}
                    </span>

                    {/* Current Registration Status Badge */}
                    {isChangePoint && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black shadow-2xs">
                        ✓ 변동점관리대장 연동됨
                      </span>
                    )}
                    {isInternal && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-2xs">
                        ✓ 사내관리 등록됨
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-800 truncate">
                    {item.content || item.title}
                  </p>
                  {item.actionResult && (
                    <p className="text-[11px] font-bold text-emerald-700 mt-0.5 truncate">
                      ↳ 조치완료: {item.actionResult}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Action & Registration Badges (변동점등록 뱃지 / 사내관리등록 뱃지) */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => onSelectRegistrationBadge(item, "CHANGE_POINT")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1 ${
                    isChangePoint
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-200"
                      : "bg-indigo-50/80 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                  }`}
                  title="변동점등록 뱃지로 등록 (변동점관리대장에 자동 등록)"
                >
                  🔄 변동점등록
                </button>

                <button
                  type="button"
                  onClick={() => onSelectRegistrationBadge(item, "INTERNAL")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1 ${
                    isInternal
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-200"
                      : "bg-emerald-50/80 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  }`}
                  title="사내관리등록 뱃지로 등록 (부적합관리대장 사내관리 전용)"
                >
                  🏢 사내관리등록
                </button>

                <button
                  type="button"
                  onClick={() => onOpenEdit(item)}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-[10px] font-black cursor-pointer"
                >
                  조치/사진
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteItem(item)}
                  className="px-1.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black cursor-pointer"
                  title="삭제"
                >
                  삭제
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
