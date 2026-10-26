import React, { useState } from "react";
import { Scissors, Wrench, RotateCcw, CheckCircle2, AlertTriangle, History } from "lucide-react";
import { translateTerm } from "../../services/workLogI18nService";

/**
 * 🔪 [블록 19] 칼날교체주기 관리 블록 (Blade Replacement Cycle Block)
 * - 작업일보 생산량(todayProductionQty) 기준 실시간 누적 컷팅 횟수 합산
 * - 교체주기 기준 횟수(limitCount) 설정 가능
 * - 처리결과(칼날 신품 교체 완료 / 칼날 연마·교체 및 초물합격) 선택 및 0회 리셋 기능
 */
export const BladeReplacementCycleBlock = ({
  todayProductionQty = 0,
  config = {},
  workerName = "작업자",
  onChangeConfig,
  currentLang = null
}) => {
  const t = (term) => translateTerm(term, currentLang);
  const limitCount = Number(config.limitCount) > 0 ? Number(config.limitCount) : 50000;
  const baseCount = Number(config.baseCount) >= 0 ? Number(config.baseCount) : 45000;
  const includeToday = config.includeToday !== false;
  const selectedAction = config.selectedAction || "칼날 신품 교체 완료";
  const note = config.note !== undefined ? config.note : "정치절단/단컷팅 칼날 교체 및 초물 단면 검사 양호";
  const history = Array.isArray(config.history)
    ? config.history
    : [
        {
          id: "bh_init",
          date: "2026-10-15",
          action: "칼날 신품 교체 완료",
          prevCount: 49820,
          worker: "김작업",
          note: "정기 교체주기 도래 신품 교체"
        }
      ];

  const effectiveTodayQty = includeToday ? Number(todayProductionQty) || 0 : 0;
  const currentTotal = baseCount + effectiveTodayQty;
  const usagePct = Math.min(100, (currentTotal / Math.max(1, limitCount)) * 100);
  const remainCount = Math.max(0, limitCount - currentTotal);

  const updateField = (patch) => {
    if (onChangeConfig) {
      onChangeConfig({
        limitCount,
        baseCount,
        includeToday,
        selectedAction,
        note,
        history,
        ...patch
      });
    }
  };

  const handleResetBlade = () => {
    const nowDate = new Date().toISOString().slice(0, 10);
    const newLog = {
      id: `bh_${Date.now()}`,
      date: nowDate,
      action: selectedAction,
      prevCount: currentTotal,
      worker: workerName || "작업자",
      note: note || "칼날 교체 및 리셋 완료"
    };
    updateField({
      baseCount: 0,
      includeToday: false,
      lastResetAt: nowDate,
      lastActionResult: selectedAction,
      history: [newLog, ...history].slice(0, 10)
    });
  };

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/40 dark:bg-slate-900/90 border-2 border-amber-500/50 space-y-3 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                🔪 {t("칼날교체주기 관리 블록")} ({t("작업일보 생산량 기준")})
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                {t("금일 일보 생산량")} +{ (Number(todayProductionQty) || 0).toLocaleString() } EA {t("연동")}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {currentTotal === 0 ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400">
              ✅ {t("교체 완료 / 리셋됨")} (0.0%)
            </span>
          ) : usagePct >= 100 ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-600 text-white animate-pulse">
              🚨 {t("즉시 교체 요망")} ({usagePct.toFixed(1)}%)
            </span>
          ) : usagePct >= 85 ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-400">
              ⚠️ {t("교체 임박")} ({usagePct.toFixed(1)}%)
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400">
              🟢 {t("정상 가동중")} ({usagePct.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* 1. 교체주기 기준 횟수 설정 */}
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
            ⚙️ {t("기준 교체주기")}
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step={1000}
              value={limitCount}
              onChange={(e) => updateField({ limitCount: Math.max(1, Number(e.target.value) || 50000) })}
              className="w-full px-2.5 py-1 rounded-lg border border-amber-400 bg-amber-50/40 dark:bg-slate-900 font-mono font-black text-amber-600 dark:text-amber-400 text-right text-xs"
            />
            <span className="font-bold text-slate-600 dark:text-slate-300 shrink-0">{t("회")}</span>
          </div>
        </div>

        {/* 2. 이전 누적 + 금일 작업일보 생산량 */}
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {t("전일 누적 + 금일 일보 생산량")}
            </span>
            {!includeToday && (
              <button
                type="button"
                onClick={() => updateField({ includeToday: true })}
                className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 underline cursor-pointer"
              >
                {t("금일분 다시 합산")}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 font-mono font-bold">
            <input
              type="number"
              step={500}
              value={baseCount}
              onChange={(e) => updateField({ baseCount: Math.max(0, Number(e.target.value) || 0) })}
              className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-right font-mono font-black text-xs"
              title="전일 누적 컷팅 횟수 직접 수정"
            />
            <span>+</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">
              {effectiveTodayQty.toLocaleString()} EA
            </span>
          </div>
        </div>

        {/* 3. 현재 총 누적 컷팅 횟수 */}
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 flex flex-col justify-between">
          <span className="text-[11px] font-black text-amber-700 dark:text-amber-300">
            {t("현재 누적 컷팅")}
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-mono font-black text-base text-amber-600 dark:text-amber-400">
              {currentTotal.toLocaleString()} {t("회")}
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-500">
              {t("잔여 컷팅 가능")}: {remainCount.toLocaleString()}{t("회")}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 transition-all duration-300"
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </div>

      {/* 처리결과(교체) 선택 및 리셋 */}
      <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span className="font-black text-slate-900 dark:text-white">
            🛠️ {t("처리결과")} ({t("교체")}) {t("선택 및 누적횟수 리셋")}
          </span>
          <span className="text-[11px] text-slate-400">
            {t("교체 버튼 클릭 시 이력이 기록되고 누적 횟수가 0으로 리셋됩니다")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {["칼날 신품 교체 완료", "칼날 연마·교체 및 초물합격"].map((act) => {
            const isSel = selectedAction === act;
            return (
              <button
                key={act}
                type="button"
                onClick={() => updateField({ selectedAction: act })}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer border ${
                  isSel
                    ? "border-2 border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500"
                }`}
              >
                {isSel ? `✓ 🔪 ${t(act)}` : `🔪 ${t(act)}`}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => updateField({ note: e.target.value })}
            placeholder={t("칼날 교체 사유 및 초물 단면 확인 결과 입력")}
            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium"
          />
          <button
            type="button"
            onClick={handleResetBlade}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t("처리결과(교체) 등록 및 0 리셋")}</span>
          </button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
            {history.slice(0, 2).map((h) => (
              <div
                key={h.id}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-[11px] gap-2 flex-wrap"
              >
                <span className="font-black text-amber-600 dark:text-amber-400">
                  [{h.action}] <span className="font-normal text-slate-500">{h.note}</span>
                </span>
                <span className="font-mono text-slate-500">
                  교체전 {Number(h.prevCount || 0).toLocaleString()}회 ➔ 0 리셋 ({h.date} {h.worker})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * ⚙️ [블록 20] 금형숏트수관리 블록 (Mold Shot Count Management Block)
 * - 작업일보 생산량(todayProductionQty) 기준 실시간 금형 누적 숏트수 합산
 * - 보전주기 기준 숏트수(limitShot) 설정 가능
 * - 처리결과(습합 / 검증완료 / 습합 및 검증완료) 선택 및 0 Shot 리셋 기능
 */
export const MoldShotCountManageBlock = ({
  todayProductionQty = 0,
  config = {},
  workerName = "작업자",
  onChangeConfig,
  currentLang = null
}) => {
  const t = (term) => translateTerm(term, currentLang);
  const limitShot = Number(config.limitShot) > 0 ? Number(config.limitShot) : 100000;
  const baseShot = Number(config.baseShot) >= 0 ? Number(config.baseShot) : 95000;
  const includeToday = config.includeToday !== false;
  const selectedAction = config.selectedAction || "습합 및 검증완료";
  const note = config.note !== undefined ? config.note : "코너금형 파팅면 습합 점검 및 초·중·종 치수 검증완료";
  const history = Array.isArray(config.history)
    ? config.history
    : [
        {
          id: "mh_init",
          date: "2026-10-12",
          action: "습합 및 검증완료",
          prevShot: 98450,
          worker: "김작업",
          note: "정기 금형 습합 및 초물 치수 검증 합격"
        }
      ];

  const effectiveTodayShot = includeToday ? Number(todayProductionQty) || 0 : 0;
  const currentTotalShot = baseShot + effectiveTodayShot;
  const shotPct = Math.min(100, (currentTotalShot / Math.max(1, limitShot)) * 100);
  const remainShot = Math.max(0, limitShot - currentTotalShot);

  const updateField = (patch) => {
    if (onChangeConfig) {
      onChangeConfig({
        limitShot,
        baseShot,
        includeToday,
        selectedAction,
        note,
        history,
        ...patch
      });
    }
  };

  const handleResetMoldShot = () => {
    const nowDate = new Date().toISOString().slice(0, 10);
    const newLog = {
      id: `mh_${Date.now()}`,
      date: nowDate,
      action: selectedAction,
      prevShot: currentTotalShot,
      worker: workerName || "작업자",
      note: note || "금형 습합 및 검증완료 리셋"
    };
    updateField({
      baseShot: 0,
      includeToday: false,
      lastResetAt: nowDate,
      lastActionResult: selectedAction,
      history: [newLog, ...history].slice(0, 10)
    });
  };

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-cyan-50/40 dark:bg-slate-900/90 border-2 border-cyan-500/50 space-y-3 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-cyan-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-500 text-slate-950 shadow-xs">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                ⚙️ {t("금형숏트수관리 블록")} ({t("작업일보 생산량 기준")})
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500 text-slate-950">
                {t("금일 일보 숏트수")} +{ (Number(todayProductionQty) || 0).toLocaleString() } Shot {t("연동")}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {currentTotalShot === 0 ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400">
              ✅ {t(selectedAction)} / {t("리셋됨")} (0.0%)
            </span>
          ) : shotPct >= 95 ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-600 text-white animate-pulse">
              🚨 {t("금형 습합·검증 도래")} ({shotPct.toFixed(1)}%)
            </span>
          ) : shotPct >= 80 ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-400">
              ⚠️ {t("습합 점검 예정")} ({shotPct.toFixed(1)}%)
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400">
              🟢 {t("정상 가동중")} ({shotPct.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* 1. 보전주기 기준 숏트수 설정 */}
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
            ⚙️ {t("보전주기 기준 숏트수 설정")}
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step={5000}
              value={limitShot}
              onChange={(e) => updateField({ limitShot: Math.max(1, Number(e.target.value) || 100000) })}
              className="w-full px-2.5 py-1 rounded-lg border border-cyan-400 bg-cyan-50/40 dark:bg-slate-900 font-mono font-black text-cyan-600 dark:text-cyan-400 text-right text-xs"
            />
            <span className="font-bold text-slate-600 dark:text-slate-300 shrink-0">Shot</span>
          </div>
        </div>

        {/* 2. 이전 누적 + 금일 작업일보 숏트수 */}
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {t("전일 누적 + 금일 일보 숏트수")}
            </span>
            {!includeToday && (
              <button
                type="button"
                onClick={() => updateField({ includeToday: true })}
                className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 underline cursor-pointer"
              >
                {t("금일분 다시 합산")}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 font-mono font-bold">
            <input
              type="number"
              step={1000}
              value={baseShot}
              onChange={(e) => updateField({ baseShot: Math.max(0, Number(e.target.value) || 0) })}
              className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-right font-mono font-black text-xs"
              title="전일 누적 숏트수 직접 수정"
            />
            <span>+</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">
              {effectiveTodayShot.toLocaleString()} Shot
            </span>
          </div>
        </div>

        {/* 3. 현재 총 누적 숏트수 */}
        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex flex-col justify-between">
          <span className="text-[11px] font-black text-cyan-700 dark:text-cyan-300">
            {t("현재 총 누적 숏트수")}
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-mono font-black text-base text-cyan-600 dark:text-cyan-400">
              {currentTotalShot.toLocaleString()} Shot
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-500">
              {t("잔여 컷팅 가능")}: {remainShot.toLocaleString()} Shot
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-600 transition-all duration-300"
            style={{ width: `${shotPct}%` }}
          />
        </div>
      </div>

      {/* 처리결과(습합, 검증완료) 선택 및 리셋 */}
      <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span className="font-black text-slate-900 dark:text-white">
            🛠️ {t("처리결과")} ({t("습합")} / {t("검증완료")}) {t("선택 및 누적횟수 리셋")}
          </span>
          <span className="text-[11px] text-slate-400">
            {t("리셋 버튼 클릭 시 습합·검증완료 이력이 기록되고 누적 숏트수가 0으로 초기화됩니다")}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "습합", label: "🔧 습합" },
            { id: "검증완료", label: "✅ 검증완료" },
            { id: "습합 및 검증완료", label: "🔧+✅ 습합 및 검증완료" }
          ].map((opt) => {
            const isSel = selectedAction === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateField({ selectedAction: opt.id })}
                className={`px-2.5 py-1.5 rounded-xl font-black text-xs transition cursor-pointer border ${
                  isSel
                    ? "border-2 border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500"
                }`}
              >
                {isSel ? `✓ ${t(opt.id)}` : t(opt.id)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => updateField({ note: e.target.value })}
            placeholder={t("금형 파팅면 습합 및 초·중·종 검증완료 내역 입력")}
            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium"
          />
          <button
            type="button"
            onClick={handleResetMoldShot}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t("금형 숏트수 리셋")}</span>
          </button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
            {history.slice(0, 2).map((h) => (
              <div
                key={h.id}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-[11px] gap-2 flex-wrap"
              >
                <span className="font-black text-cyan-600 dark:text-cyan-400">
                  [{h.action}] <span className="font-normal text-slate-500">{h.note}</span>
                </span>
                <span className="font-mono text-slate-500">
                  점검전 {Number(h.prevShot || 0).toLocaleString()} Shot ➔ 0 리셋 ({h.date} {h.worker})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
