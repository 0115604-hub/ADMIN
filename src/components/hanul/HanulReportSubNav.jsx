import React from "react";
import { Scissors, Layers, ShieldCheck } from "lucide-react";
import { translateTerm } from "../../services/workLogI18nService";

/**
 * 🌟 소재준비 / 조인트 / 검사 공정별 세부 일보 상단 안내 배너 & 원클릭 전환 탭
 */
export const HanulReportSubNav = ({
  processId,
  subProcess,
  setSubProcess,
  jointType,
  setJointType,
  inspectionType,
  setInspectionType,
  currentLang
}) => {
  return (
    <>
      {/* 🌟 소재준비 공정일 때: 정치절단 / 단컷팅 일보 상단 안내 배너 & 원클릭 전환 탭 */}
      {processId === "소재준비" && (
        <div className="flex p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 dark:from-indigo-950/50 dark:via-blue-950/40 dark:to-indigo-950/50 border-2 border-indigo-400 dark:border-indigo-700 shadow-sm flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shrink-0">
              {subProcess === "정치절단" ? (
                <Scissors className="w-5 h-5" />
              ) : (
                <Layers className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm sm:text-base text-indigo-950 dark:text-white">
                  {translateTerm("소재 준비 작업 일보 (G/RUN)", currentLang)} —{" "}
                  {subProcess === "정치절단"
                    ? `✂️ ${translateTerm("정치절단 일보", currentLang)}`
                    : `📐 ${translateTerm("단컷팅 일보", currentLang)}`}
                </h4>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                  {translateTerm("적용 중", currentLang)}
                </span>
              </div>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                {subProcess === "정치절단"
                  ? "정치절단 치수 규격 (FRT A/B/C, RR A/B) • 압출/공정간 불량 집계 • 칼날교체시간"
                  : "단컷팅 치수 규격 (FRT LH/RH 83mm, RR LH 68mm, RR RH 67mm) • 단컷팅 불량 집계"}
              </p>
            </div>
          </div>

          {/* Segmented Quick Toggle Buttons */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-indigo-200 dark:border-indigo-800 shrink-0 self-start sm:self-auto shadow-2xs">
            <button
              type="button"
              onClick={() => setSubProcess("정치절단")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                subProcess === "정치절단"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300"
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>{translateTerm("정치절단 일보", currentLang)}</span>
            </button>
            <button
              type="button"
              onClick={() => setSubProcess("단컷팅")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                subProcess === "단컷팅"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{translateTerm("단컷팅 일보", currentLang)}</span>
            </button>
          </div>
        </div>
      )}

      {/* 🌟 조인트 공정일 때: 4가지 조인트 일보 상단 안내 배너 & 4대 퀵 전환 탭 */}
      {processId === "조인트" && (
        <div className="hidden sm:flex p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/50 dark:via-indigo-950/40 dark:to-purple-950/50 border-2 border-purple-400 dark:border-purple-700 shadow-sm flex-col md:flex-row md:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-black text-sm sm:text-base text-purple-950 dark:text-white">
                  조인트 일보 (G/RUN) —{" "}
                  {jointType === "FRT"
                    ? "🚗 1. FRT (2호기 / 3호기)"
                    : jointType === "FIXED_LH"
                    ? "📐 2. FIXED LH (Glass/DV/Bracket)"
                    : jointType === "FIXED_RH"
                    ? "📐 3. FIXED RH (Glass/DV/Bracket)"
                    : "⚡ 4. RR (2호기 / 3호기)"}
                </h4>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-2xs">
                  4대 조인트 서식
                </span>
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                {jointType === "FRT" &&
                  "FRT LH/RH • 압출소재 FRT A/B/C • 직각/둔각 사출조건 • 10개 불량항목"}
                {jointType === "FIXED_LH" &&
                  "FIXED LH • 압출소재 RR A/B • 부자재(Glass, D/V, BRACKET) • 13개 불량항목"}
                {jointType === "FIXED_RH" &&
                  "FIXED RH • 압출소재 RR A/B • 부자재(Glass, D/V, BRACKET) • 13개 불량항목"}
                {jointType === "RR" &&
                  "RR LH/RH • 압출소재 RR A/B • 2/3호기 사출조건 • 꼬임 포함 11개 불량항목"}
              </p>
            </div>
          </div>

          {/* 4 Segmented Quick Toggle Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-purple-200 dark:border-purple-800 shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => setJointType("FRT")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                jointType === "FRT"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300"
              }`}
            >
              1. FRT
            </button>
            <button
              type="button"
              onClick={() => setJointType("FIXED_LH")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                jointType === "FIXED_LH"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300"
              }`}
            >
              2. FIXED LH
            </button>
            <button
              type="button"
              onClick={() => setJointType("FIXED_RH")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                jointType === "FIXED_RH"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300"
              }`}
            >
              3. FIXED RH
            </button>
            <button
              type="button"
              onClick={() => setJointType("RR")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                jointType === "RR"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300"
              }`}
            >
              4. RR
            </button>
          </div>
        </div>
      )}

      {/* 🌟 검사 공정일 때: 4가지 검사 일보 상단 안내 배너 & 4대 퀵 전환 탭 */}
      {processId === "검사" && (
        <div className="hidden sm:flex p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-emerald-950/50 border-2 border-emerald-400 dark:border-emerald-700 shadow-sm flex-col md:flex-row md:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-black text-sm sm:text-base text-emerald-950 dark:text-white">
                  검사 일보 (G/RUN RR) —{" "}
                  {inspectionType === "LENGTH"
                    ? "📏 1. 길이검사 일보 (부자재 패드 5T)"
                    : inspectionType === "SQUARE"
                    ? "📐 2. 직각검사 일보 (4대 설비호기)"
                    : inspectionType === "FINAL_PAIR"
                    ? "🏁 3. 최종검사 일보 (LH / RH)"
                    : "🏁 4. 최종검사 일보 (LH 1호기 / 2호기)"}
                </h4>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                  4대 검사 서식
                </span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                {inspectionType === "LENGTH" &&
                  "기록시간(09:00/13:30/17:00) • 부자재 패드 5T • RR LH/RH (PRI, TIN) • 압출/조인트/후가공 3대 불량 집계"}
                {inspectionType === "SQUARE" &&
                  "기록시간(09:00/13:30/17:00) • LH 2/3호기, RH 2/3호기 • 중요 치수 A/B (482/658mm) • 3대 불량 집계"}
                {inspectionType === "FINAL_PAIR" &&
                  "기록시간(초/중/종) • RR LH/RH (PRI, TIN) • D/V 부자재 LOT • 리워크(DV, 직/둔각) • 중요치수 및 패드 5T/7T"}
                {inspectionType === "FINAL_LH" &&
                  "기록시간(초/중/종) • RR LH 1호기/2호기 (PRI, TIN) • D/V 부자재 LOT • 리워크(DV, 직/둔각) • 패드 5T/7T"}
              </p>
            </div>
          </div>

          {/* 4 Segmented Quick Toggle Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => setInspectionType("LENGTH")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                inspectionType === "LENGTH"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300"
              }`}
            >
              1. 길이검사
            </button>
            <button
              type="button"
              onClick={() => setInspectionType("SQUARE")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                inspectionType === "SQUARE"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300"
              }`}
            >
              2. 직각검사
            </button>
            <button
              type="button"
              onClick={() => setInspectionType("FINAL_PAIR")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                inspectionType === "FINAL_PAIR"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300"
              }`}
            >
              3. 최종 (LH/RH)
            </button>
            <button
              type="button"
              onClick={() => setInspectionType("FINAL_LH")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                inspectionType === "FINAL_LH"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300"
              }`}
            >
              4. 최종 (LH 전용)
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default HanulReportSubNav;
