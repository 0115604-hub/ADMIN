import React from "react";
import { ShieldCheck, Layers, UserCheck, Plus, X } from "lucide-react";
import { cleanTitleWithoutEmoji } from "../../../config/panelThemeConfig";

export const Step3QualityHeader = ({
  managerName,
  activeTab,
  setActiveTab,
  stats,
  customTitle,
  customBadge,
  hideBadge = false,
  hideSubtitle = true,
  themeObj,
  isInlineEditing = false,
  customSettings = null,
  onUpdateDraft = null
}) => {
  // Title derivation (Strip any emoji)
  const rawTitle =
    customSettings?.customTopTitle !== undefined
      ? customSettings.customTopTitle
      : customSettings?.customTitle !== undefined
      ? customSettings.customTitle
      : (customTitle || "4M 정식등록대장");

  const titleValue = cleanTitleWithoutEmoji(rawTitle) || "4M 정식등록대장";

  // Badge derivation
  const isBadgeHidden =
    customSettings?.hideBadge !== undefined
      ? customSettings.hideBadge
      : hideBadge;

  const defaultBadgeText = managerName ? `${managerName} 책임 전용` : "품질관리자 전용";
  const badgeValue =
    customSettings?.customBadge !== undefined && customSettings.customBadge !== ""
      ? cleanTitleWithoutEmoji(customSettings.customBadge)
      : cleanTitleWithoutEmoji(customBadge || defaultBadgeText);

  const extraBadges = (Array.isArray(customSettings?.extraBadges) ? customSettings.extraBadges : []).map(cleanTitleWithoutEmoji);

  // KPI Labels & Hidden KPIs
  const kpiLabels = customSettings?.kpiLabels || {};
  const hiddenKpis = Array.isArray(customSettings?.hiddenKpis) ? customSettings.hiddenKpis : [];
  const extraKpiBadges = Array.isArray(customSettings?.extraKpiBadges) ? customSettings.extraKpiBadges : [];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. 패널 메인 제목 (글자크기와 동일한 아이콘 + 이모지 없는 순수 텍스트) */}
            {isInlineEditing ? (
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => onUpdateDraft?.({ customTopTitle: cleanTitleWithoutEmoji(e.target.value) })}
                  placeholder="패널 제목 입력..."
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border-2 border-cyan-400 text-slate-900 dark:text-white font-black text-sm sm:text-base outline-none shadow-sm focus:ring-2 focus:ring-cyan-500 min-w-[220px]"
                />
              </div>
            ) : (
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{titleValue}</span>
              </h3>
            )}

            {/* 2. 패널 상단 뱃지 (수정, 삭제 ✕, 추가 +) */}
            {isInlineEditing ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* 메인 뱃지 */}
                {!isBadgeHidden ? (
                  <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black ${themeObj?.accentBadge || "bg-rose-500 text-white shadow-xs border border-rose-400/40"}`}>
                    <input
                      type="text"
                      value={badgeValue}
                      onChange={(e) => onUpdateDraft?.({ customBadge: e.target.value })}
                      placeholder="뱃지 명칭..."
                      className="bg-transparent text-white font-black text-[10.5px] outline-none w-24 border-b border-white/40 focus:border-white"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateDraft?.({ hideBadge: true })}
                      title="이 뱃지 삭제(숨김)"
                      className="p-0.5 hover:bg-black/30 rounded-full cursor-pointer transition text-white/80 hover:text-white ml-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onUpdateDraft?.({ hideBadge: false, customBadge: defaultBadgeText })}
                    className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-cyan-950 text-cyan-300 border border-dashed border-cyan-500 hover:bg-cyan-900 cursor-pointer flex items-center gap-1 transition"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>+ 상단 뱃지 복원</span>
                  </button>
                )}

                {/* 추가 등록된 커스텀 뱃지들 */}
                {extraBadges.map((eb, ebIdx) => (
                  <div
                    key={ebIdx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10.5px] font-black border border-indigo-400/50 shadow-xs"
                  >
                    <input
                      type="text"
                      value={eb}
                      onChange={(e) => {
                        const next = [...extraBadges];
                        next[ebIdx] = e.target.value;
                        onUpdateDraft?.({ extraBadges: next });
                      }}
                      className="bg-transparent text-white font-black text-[10.5px] outline-none w-20 border-b border-white/40 focus:border-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = extraBadges.filter((_, i) => i !== ebIdx);
                        onUpdateDraft?.({ extraBadges: next });
                      }}
                      title="추가 뱃지 삭제"
                      className="p-0.5 hover:bg-black/30 rounded-full cursor-pointer transition text-white/80 hover:text-white"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}

                {/* 새 뱃지 추가 버튼 */}
                <button
                  type="button"
                  onClick={() => {
                    const next = [...extraBadges, "신규 뱃지"];
                    onUpdateDraft?.({ extraBadges: next });
                  }}
                  className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-800 text-slate-300 border border-dashed border-slate-600 hover:bg-slate-700 hover:text-white cursor-pointer flex items-center gap-1 transition"
                  title="뱃지 새로 추가"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>+ 뱃지 추가</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                {!isBadgeHidden && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${themeObj?.accentBadge || "bg-rose-500 text-white shadow-xs border border-rose-400/40"}`}>
                    {badgeValue}
                  </span>
                )}
                {extraBadges.map((eb, ebIdx) => (
                  <span
                    key={ebIdx}
                    className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white shadow-xs border border-indigo-400/40"
                  >
                    {eb}
                  </span>
                ))}
              </div>
            )}
          </div>

          {!hideSubtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>담당: <strong className="text-indigo-600 dark:text-indigo-400 font-black">{managerName} 책임</strong> (품질보증팀)</span>
              <span>•</span>
              <span>4M 변동점 결재라인: 이창엽 책임(상신) ➔ 이명재 이사(검토) ➔ 권태형 대표이사(최종승인)</span>
            </p>
          )}
        </div>
      </div>

      {/* 3. Real-time KPI Counters (직접 수정/삭제 ✕/복원 +/추가 지원) */}
      <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
        {/* KPI 1: 이관 접수 */}
        {!hiddenKpis.includes("incoming") && (
          <div
            onClick={() => setActiveTab("INCOMING")}
            className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "INCOMING"
                ? "bg-amber-500 text-black border-amber-600 shadow-md font-black"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60 hover:bg-amber-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
            {isInlineEditing ? (
              <input
                type="text"
                value={kpiLabels.incoming ?? "이관 접수"}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  onUpdateDraft?.({
                    kpiLabels: { ...kpiLabels, incoming: e.target.value }
                  });
                }}
                className="bg-transparent text-inherit font-black text-xs outline-none w-16 border-b border-amber-500 focus:border-amber-700"
                title="KPI 뱃지 명칭 수정"
              />
            ) : (
              <span>{kpiLabels.incoming || "이관 접수"}</span>
            )}
            <span className="font-mono font-black text-sm">{stats.incomingCount}건</span>
            {isInlineEditing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateDraft?.({ hiddenKpis: [...hiddenKpis, "incoming"] });
                }}
                title="이관 접수 뱃지 삭제(숨김)"
                className="p-0.5 hover:bg-black/20 rounded-full cursor-pointer ml-0.5 text-black/70 hover:text-black transition"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* KPI 2: 4M 대장 */}
        {!hiddenKpis.includes("official") && (
          <div
            onClick={() => setActiveTab("4M_LEDGER")}
            className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "4M_LEDGER"
                ? "bg-indigo-600 text-white border-indigo-700 shadow-md font-black"
                : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800/60 hover:bg-indigo-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            {isInlineEditing ? (
              <input
                type="text"
                value={kpiLabels.official ?? "4M 대장"}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  onUpdateDraft?.({
                    kpiLabels: { ...kpiLabels, official: e.target.value }
                  });
                }}
                className="bg-transparent text-inherit font-black text-xs outline-none w-16 border-b border-indigo-400 focus:border-white"
                title="KPI 뱃지 명칭 수정"
              />
            ) : (
              <span>{kpiLabels.official || "4M 대장"}</span>
            )}
            <span className="font-mono font-black text-sm">{stats.officialCount}건</span>
            {isInlineEditing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateDraft?.({ hiddenKpis: [...hiddenKpis, "official"] });
                }}
                title="4M 대장 뱃지 삭제(숨김)"
                className="p-0.5 hover:bg-black/20 rounded-full cursor-pointer ml-0.5 text-inherit hover:opacity-100 transition"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* KPI 3: 경영진 승인대기 */}
        {!hiddenKpis.includes("pending") && (
          <div
            onClick={() => setActiveTab("PENDING_APPROVAL")}
            className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "PENDING_APPROVAL"
                ? "bg-purple-600 text-white border-purple-700 shadow-md font-black"
                : "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800/60 hover:bg-purple-100"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            {isInlineEditing ? (
              <input
                type="text"
                value={kpiLabels.pending ?? "경영진 승인대기"}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  onUpdateDraft?.({
                    kpiLabels: { ...kpiLabels, pending: e.target.value }
                  });
                }}
                className="bg-transparent text-inherit font-black text-xs outline-none w-24 border-b border-purple-400 focus:border-white"
                title="KPI 뱃지 명칭 수정"
              />
            ) : (
              <span>{kpiLabels.pending || "경영진 승인대기"}</span>
            )}
            <span className="font-mono font-black text-sm">{stats.pendingApprovalCount}건</span>
            {isInlineEditing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateDraft?.({ hiddenKpis: [...hiddenKpis, "pending"] });
                }}
                title="경영진 승인대기 뱃지 삭제(숨김)"
                className="p-0.5 hover:bg-black/20 rounded-full cursor-pointer ml-0.5 text-inherit hover:opacity-100 transition"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* KPI 4: 전체보기 */}
        {!hiddenKpis.includes("all") && (
          <div
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1 cursor-pointer ${
              activeTab === "ALL"
                ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-black"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200"
            }`}
          >
            {isInlineEditing ? (
              <input
                type="text"
                value={kpiLabels.all ?? "전체보기"}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  onUpdateDraft?.({
                    kpiLabels: { ...kpiLabels, all: e.target.value }
                  });
                }}
                className="bg-transparent text-inherit font-black text-xs outline-none w-16 border-b border-slate-400"
                title="전체보기 명칭 수정"
              />
            ) : (
              <span>{kpiLabels.all || "전체보기"}</span>
            )}
            {isInlineEditing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateDraft?.({ hiddenKpis: [...hiddenKpis, "all"] });
                }}
                title="전체보기 뱃지 삭제(숨김)"
                className="p-0.5 hover:bg-black/20 rounded-full cursor-pointer ml-0.5 text-inherit transition"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* 추가된 커스텀 KPI 뱃지들 */}
        {extraKpiBadges.map((kpi, kIdx) => (
          <div
            key={kpi.id || kIdx}
            className="px-3 py-1.5 rounded-xl border border-teal-500 bg-teal-500/10 text-teal-800 dark:text-teal-300 flex items-center gap-1.5"
          >
            {isInlineEditing ? (
              <>
                <input
                  type="text"
                  value={kpi.label}
                  onChange={(e) => {
                    const next = [...extraKpiBadges];
                    next[kIdx] = { ...next[kIdx], label: e.target.value };
                    onUpdateDraft?.({ extraKpiBadges: next });
                  }}
                  className="bg-transparent text-inherit font-black text-xs outline-none w-16 border-b border-teal-400"
                  placeholder="라벨"
                />
                <input
                  type="text"
                  value={kpi.value}
                  onChange={(e) => {
                    const next = [...extraKpiBadges];
                    next[kIdx] = { ...next[kIdx], value: e.target.value };
                    onUpdateDraft?.({ extraKpiBadges: next });
                  }}
                  className="bg-transparent text-inherit font-mono font-black text-xs outline-none w-12 border-b border-teal-400"
                  placeholder="값"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = extraKpiBadges.filter((_, i) => i !== kIdx);
                    onUpdateDraft?.({ extraKpiBadges: next });
                  }}
                  className="p-0.5 hover:bg-black/20 rounded-full cursor-pointer text-inherit"
                  title="삭제"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                <span>{kpi.label}</span>
                <span className="font-mono font-black text-sm">{kpi.value}</span>
              </>
            )}
          </div>
        ))}

        {/* 🛠️ [편집 모드 전용]: 숨겨진 KPI 복원 버튼 & 신규 KPI 추가 버튼 */}
        {isInlineEditing && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {hiddenKpis.map((kpiKey) => {
              const labelMap = {
                incoming: "이관 접수",
                official: "4M 대장",
                pending: "경영진 승인대기",
                all: "전체보기"
              };
              return (
                <button
                  key={kpiKey}
                  type="button"
                  onClick={() => {
                    onUpdateDraft?.({
                      hiddenKpis: hiddenKpis.filter((k) => k !== kpiKey)
                    });
                  }}
                  className="px-2 py-1 rounded-xl border border-dashed border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 text-xs flex items-center gap-1 cursor-pointer transition"
                  title="숨긴 KPI 뱃지 다시 표시"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ {labelMap[kpiKey] || kpiKey} 복원</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                const next = [
                  ...extraKpiBadges,
                  { id: Date.now(), label: "신규 KPI", value: "0건" }
                ];
                onUpdateDraft?.({ extraKpiBadges: next });
              }}
              className="px-2 py-1 rounded-xl border border-dashed border-slate-500 text-slate-400 hover:text-white hover:border-slate-400 text-xs flex items-center gap-1 cursor-pointer transition"
              title="새로운 KPI 뱃지 추가"
            >
              <Plus className="w-3 h-3" />
              <span>+ KPI 추가</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step3QualityHeader;
