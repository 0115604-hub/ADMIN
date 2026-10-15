import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Layers,
  CheckCircle2,
  Clock
} from "lucide-react";
import { getLocalSqLevelUpItems, subscribeSqLevelUpItems, calculateSqKPIs } from "../../services/sqLevelUpService";

export const SqStatusBannerCard = ({
  onOpenSqModal,
  className = "",
  compact = false
}) => {
  const [items, setItems] = useState(() => getLocalSqLevelUpItems());

  useEffect(() => {
    const unsub = subscribeSqLevelUpItems((newItems) => {
      if (Array.isArray(newItems) && newItems.length > 0) {
        setItems(newItems);
      }
    });
    return () => unsub();
  }, []);

  const kpis = calculateSqKPIs(items);

  return (
    <div
      onClick={onOpenSqModal}
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-2 border-indigo-500/60 hover:border-cyan-400 dark:border-indigo-400/60 dark:hover:border-cyan-300 ring-2 ring-indigo-500/20 hover:ring-cyan-400/40 shadow-xl shadow-indigo-950/60 hover:shadow-cyan-950/40 transition-all duration-300 cursor-pointer group active:scale-[0.995] ${className}`}
      title="클릭 시 SQ 진행상황 현황표(사전점검 124건 종합 추진판) 열기"
    >
      {/* Decorative ambient background glows */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-400/25 transition-all duration-500" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Header: Title, Live Beacons & Primary Action Button */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 sm:pb-3 border-b border-indigo-500/30">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          {/* Animated Glowing Beacon */}
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400 shadow-xs shadow-cyan-400"></span>
          </span>

          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 tracking-tight flex items-center gap-1.5">
              <span>🎯 SQ 진행상황 현황표</span>
            </h3>
            <span className="text-[11px] font-bold text-indigo-300/80 hidden md:inline">
              (사전점검 124건 디지털 종합 추진판)
            </span>
          </div>

          {/* D-Day & Status Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shadow-xs animate-pulse">
              <Clock className="w-3 h-3 text-rose-400 shrink-0" />
              <span>{kpis.dDay} (목표: 2026.10.31)</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shrink-0">
              해결률 {kpis.appSolvableRate}%
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          <button
            type="button"
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-md shadow-cyan-500/25 ring-2 ring-cyan-400/40 group-hover:ring-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <span>현황표 상세보기</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-100 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 4-Metric Executive Scoreboard Table */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 pt-2.5 sm:pt-3">
        {/* 1. 총 점검 항목 */}
        <div className="bg-slate-900/90 rounded-xl p-2 sm:p-2.5 border border-slate-700/80 flex flex-col justify-between shadow-xs group-hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between text-[10.5px] sm:text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-blue-400 shrink-0" />
              <span>총 점검항목</span>
            </span>
            <span className="text-[10px] text-blue-400 font-black">100% 디지털</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-white tracking-tight">
              {kpis.total}
              <span className="text-xs font-bold text-slate-400 ml-0.5">건</span>
            </span>
            <span className="text-[10.5px] font-bold text-slate-400">
              사전점검 전수
            </span>
          </div>
        </div>

        {/* 2. 핵심 S/A 등급 */}
        <div className="bg-slate-900/90 rounded-xl p-2 sm:p-2.5 border border-purple-500/40 flex flex-col justify-between shadow-xs group-hover:border-purple-400/60 transition-colors">
          <div className="flex items-center justify-between text-[10.5px] sm:text-[11px] font-bold text-purple-300">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-400 shrink-0" />
              <span>S/A등급 집중관리</span>
            </span>
            <span className="text-[10px] text-purple-300 font-black">핵심 {kpis.sTotal + kpis.aTotal}건</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-purple-200 tracking-tight">
              S {kpis.sTotal} <span className="text-xs text-purple-400 font-medium">/</span> A {kpis.aTotal}
              <span className="text-xs font-bold text-slate-400 ml-0.5">건</span>
            </span>
            <span className="text-[10.5px] font-bold text-purple-300/80">
              전체 96.8%
            </span>
          </div>
        </div>

        {/* 3. 조치 완료 현황 */}
        <div className="bg-slate-900/90 rounded-xl p-2 sm:p-2.5 border border-emerald-500/40 flex flex-col justify-between shadow-xs group-hover:border-emerald-400/60 transition-colors">
          <div className="flex items-center justify-between text-[10.5px] sm:text-[11px] font-bold text-emerald-300">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>조치 완료율</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-black">{kpis.completionRate}%</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-emerald-300 tracking-tight">
              {kpis.closed}
              <span className="text-xs font-bold text-slate-400 ml-0.5">건 완료</span>
            </span>
            <span className="text-[10.5px] font-bold text-rose-400">
              미완료 {kpis.open}건
            </span>
          </div>
        </div>

        {/* 4. 스마트앱 해결률 */}
        <div className="bg-slate-900/90 rounded-xl p-2 sm:p-2.5 border border-cyan-500/40 flex flex-col justify-between shadow-xs group-hover:border-cyan-400/60 transition-colors">
          <div className="flex items-center justify-between text-[10.5px] sm:text-[11px] font-bold text-cyan-300">
            <span className="flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>앱 디지털 해결률</span>
            </span>
            <span className="text-[10px] text-cyan-400 font-black">TPM·초중종</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-cyan-300 tracking-tight">
              {kpis.appSolvableRate}%
            </span>
            <span className="text-[10.5px] font-bold text-cyan-200/90">
              120건 완결대응
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Footer Summary */}
      <div className="relative z-10 mt-2.5 sm:mt-3 pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10.5px] sm:text-[11px] font-bold">
          <span className="text-slate-300 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>SQ 인증평가 레벨업 종합 추진 진척도</span>
          </span>
          <span className="text-cyan-300 font-black">
            디지털 해결 대응률 96.8% (120건)
          </span>
        </div>
        <div className="w-full bg-slate-800/90 rounded-full h-2 sm:h-2.5 overflow-hidden border border-slate-700/80">
          <div
            className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-sm shadow-cyan-400/50"
            style={{ width: `${Math.max(10, Math.min(100, Number(kpis.appSolvableRate) || 96.8))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
