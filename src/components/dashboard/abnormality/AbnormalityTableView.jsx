import {
  CheckCircle2,
  Calendar,
  Camera,
  Check,
  Plus,
  X
} from "lucide-react";

/**
 * AbnormalityTableView
 * High-density 1-line table view showing all columns with interactive 4M category select and registration toggles.
 */
export const AbnormalityTableView = ({
  filteredRecords,
  onOpenDetailModal,
  onUpdateItemFourM,
  onToggleLedger,
  onRegisterAsInternalMgmt,
  internalMgmtMap,
  onPreviewImage
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700 whitespace-nowrap text-[11px]">
              <th className="py-2.5 px-2 text-center w-8">NO</th>
              <th className="py-2.5 px-2 text-center w-36">4M 분류 (수정)</th>
              <th className="py-2.5 px-2 text-center w-20">출처</th>
              <th className="py-2.5 px-2 text-center w-24">등록일자 (발생)</th>
              <th className="py-2.5 px-2 text-center w-14">공장</th>
              <th className="py-2.5 px-3 min-w-[300px] w-full">변동점내용</th>
              <th className="py-2.5 px-2 text-center w-14">사진</th>
              <th className="py-2.5 px-2 text-center w-20">진행상태</th>
              <th className="py-2.5 px-2 text-center w-28">유효성검증</th>
              <th className="py-2.5 px-2 text-center w-44">등록구분 (변동점 / 사내관리)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-10 text-center text-slate-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
                    해당 조건의 변동점 내역이 없습니다.
                  </p>
                </td>
              </tr>
            ) : (
              filteredRecords.map((item, idx) => {
                const hasPhotos = (item.images && item.images.length > 0) || (item.actionImages && item.actionImages.length > 0);
                const photoCount = (item.images?.length || 0) + (item.actionImages?.length || 0);

                const badgeClass =
                  item.origin === "설비수리"
                    ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 border-indigo-300"
                    : item.origin === "비가동"
                    ? "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 border-orange-300"
                    : item.origin === "TPM 이상신고"
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300"
                    : item.origin === "불량손실"
                    ? "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300"
                    : item.origin === "결근발생" || item.origin === "4M 대체투입" || item.fourM === "Man"
                    ? "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border-purple-300"
                    : "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300";

                const isHallim = item.plant?.includes("한림");

                return (
                  <tr
                    key={item.id}
                    onClick={() => onOpenDetailModal(item)}
                    className="hover:bg-indigo-50/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
                    title="클릭하여 상세 내용 및 조치 등록 팝업 열기"
                  >
                    {/* 1. NO */}
                    <td className="py-2.5 px-2 text-center font-mono text-slate-400 text-[10.5px] whitespace-nowrap">
                      {idx + 1}
                    </td>

                    {/* 2. 4M 분류 */}
                    <td className="py-2 px-1 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={item.fourM || "Method"}
                        onChange={(e) => onUpdateItemFourM(item, e.target.value)}
                        className={`text-[11px] font-black py-1 px-1.5 rounded-lg border cursor-pointer outline-none transition-all shadow-2xs font-sans ${
                          item.fourM === "Machine"
                            ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                            : item.fourM === "Material"
                            ? "bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                            : item.fourM === "Man"
                            ? "bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700"
                            : "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                        }`}
                        title="4M 카테고리 수정 (클릭하여 Machine / Material / Man / Method 직접 변경)"
                      >
                        <option value="Machine" className="bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-bold">⚙️ Machine (설비)</option>
                        <option value="Material" className="bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 font-bold">🧱 Material (재료)</option>
                        <option value="Man" className="bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 font-bold">👤 Man (인원)</option>
                        <option value="Method" className="bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 font-bold">📐 Method (공법)</option>
                      </select>
                    </td>

                    {/* 3. 출처 구분 */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                        {item.origin}
                      </span>
                    </td>

                    {/* 4. 등록일자 */}
                    <td className="py-2.5 px-2 text-center font-mono text-slate-700 dark:text-slate-300 font-bold text-[10.5px] whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{item.date}</span>
                      </div>
                      {item.time ? <div className="text-[9.5px] text-slate-400 font-normal">{item.time}</div> : null}
                    </td>

                    {/* 5. 공장 */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded border font-black text-[10.5px] ${
                        isHallim
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                          : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                      }`}>
                        {isHallim ? "한림" : "삼랑진"}
                      </span>
                    </td>

                    {/* 6. 변동점내용 */}
                    <td className="py-2.5 px-3 min-w-[320px] w-full">
                      <div className="font-black text-slate-900 dark:text-white text-xs leading-relaxed group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors break-words">
                        {item.title}
                      </div>
                      {item.content && item.content.trim() !== item.title.trim() && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line break-words leading-relaxed font-normal">
                          {item.content}
                        </div>
                      )}
                      {item.actionResult && item.actionResult.trim() && (
                        <div className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1 bg-emerald-50/80 dark:bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                          <span>↳ 🟢 <b>[조치결과]</b> {item.actionResult}</span>
                        </div>
                      )}
                    </td>

                    {/* 7. 사진 */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      {hasPhotos ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const firstImg = item.images?.[0] || item.actionImages?.[0];
                            const src = typeof firstImg === "object" ? firstImg.dataUrl || firstImg.url : firstImg;
                            if (src) onPreviewImage(src);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[10.5px] font-bold hover:scale-105 cursor-pointer shadow-2xs"
                          title="사진 미리보기"
                        >
                          <Camera className="w-3 h-3 text-amber-600" />
                          <span>{photoCount}장</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700 text-xs font-mono">-</span>
                      )}
                    </td>

                    {/* 8. 진행상태 */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          item.isResolved
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse"
                        }`}
                      >
                        {item.isResolved ? "조치완료" : "진행중"}
                      </span>
                    </td>

                    {/* 9. 유효성검증 */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.isResolved
                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                        title={item.validation}
                      >
                        <span className="flex items-center justify-center gap-1">
                          <CheckCircle2 className={`w-3 h-3 ${item.isResolved ? "text-blue-500" : "text-slate-400"}`} />
                          <span className="truncate max-w-[95px]">{item.validation || "초·중·종물 검증"}</span>
                        </span>
                      </span>
                    </td>

                    {/* 10. 등록구분 */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        {/* 변동점등록 뱃지 */}
                        {item.isRegisteredInLedger ? (
                          <button
                            type="button"
                            onClick={() => onToggleLedger(item)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-rose-600 text-white text-[10px] font-black transition-all shadow-2xs group/btn cursor-pointer"
                            title="변동점관리대장 등록됨 (클릭 시 해제)"
                          >
                            <Check className="w-2.5 h-2.5 group-hover/btn:hidden" />
                            <X className="w-2.5 h-2.5 hidden group-hover/btn:inline" />
                            <span className="group-hover/btn:hidden">🔄 변동점등록됨</span>
                            <span className="hidden group-hover/btn:inline">해제</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onToggleLedger(item)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-emerald-600 text-indigo-700 dark:text-indigo-300 hover:text-white border border-indigo-300 dark:border-indigo-700 text-[10px] font-black transition-all cursor-pointer shadow-2xs"
                            title="변동점등록 뱃지: 클릭 시 변동점관리대장에 동시 등록됩니다."
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>🔄 변동점등록</span>
                          </button>
                        )}

                        {/* 사내관리등록 뱃지 */}
                        <button
                          type="button"
                          onClick={() => onRegisterAsInternalMgmt(item)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-2xs border ${
                            !item.isRegisteredInLedger && internalMgmtMap[item.id]
                              ? "bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400/40"
                              : "bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 text-slate-600 dark:text-slate-300 hover:text-white border-slate-300 dark:border-slate-700"
                          }`}
                          title="사내관리등록 뱃지: 부적합관리대장 내 사내관리 항목으로 등록합니다."
                        >
                          {!item.isRegisteredInLedger && internalMgmtMap[item.id] ? (
                            <>
                              <Check className="w-2.5 h-2.5" />
                              <span>🏢 사내관리됨</span>
                            </>
                          ) : (
                            <span>🏢 사내관리등록</span>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
