import React from "react";
import {
  Calendar,
  Sun,
  Moon,
  TrendingUp,
  Scissors
} from "lucide-react";
import { HANUL_WORKERS_MASTER } from "../../services/hanulWorkReportService";

/**
 * 🌟 A. 기본 정보 (일자, 주야, 작업자, 시간) & B. 생산 수량 및 실시간 KPI
 */
export const HanulReportBasicInfo = ({
  currentProcessObj,
  date,
  setDate,
  shift,
  setShift,
  worker,
  setWorker,
  customWorker,
  setCustomWorker,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  totals,
  processId,
  subProcess,
  jointType,
  inspectionType,
  inspColumns,
  inspProduction,
  updateInspProd,
  cuttingPart,
  setCuttingPart,
  production,
  setProduction
}) => {
  return (
    <>
      {/* A. 기본 정보 (일자, 주야, 작업자, 시간) */}
      <div className="p-2.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2">
          <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>1. 작업 기본 정보</span>
          </span>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            {currentProcessObj?.subTitle}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 일자 */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              작업일자
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 주/야 근무 */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              근무구분
            </label>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setShift("주간")}
                className={`py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                  shift === "주간"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>주간</span>
              </button>
              <button
                type="button"
                onClick={() => setShift("야간")}
                className={`py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                  shift === "야간"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>야간</span>
              </button>
            </div>
          </div>

          {/* 작업자 (26명 드롭다운 + 직접입력) */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              작업자 (총 26명 마스터)
            </label>
            <select
              value={worker}
              onChange={(e) => {
                setWorker(e.target.value);
                if (e.target.value !== "직접입력") setCustomWorker("");
              }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <optgroup label="9BQC 전담 작업자">
                {HANUL_WORKERS_MASTER.filter((w) => w.line !== "LQ2").map((w) => (
                  <option key={w.no} value={w.name}>
                    {w.name} ({w.position})
                  </option>
                ))}
              </optgroup>
              <optgroup label="LQ2 전담 작업자">
                {HANUL_WORKERS_MASTER.filter((w) => w.line === "LQ2").map((w) => (
                  <option key={w.no} value={w.name}>
                    {w.name} ({w.position})
                  </option>
                ))}
              </optgroup>
              <option value="직접입력">✏️ 직접 입력</option>
            </select>
            {worker === "직접입력" && (
              <input
                type="text"
                placeholder="작업자 이름 입력"
                value={customWorker}
                onChange={(e) => setCustomWorker(e.target.value)}
                className="w-full mt-1 px-2 py-1 rounded-lg border border-indigo-400 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-bold"
              />
            )}
          </div>

          {/* 작업시간 */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              작업시간 (시작 ~ 종료)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="06:30"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-1/2 px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-center text-slate-900 dark:text-white"
              />
              <span className="text-slate-400 text-xs">~</span>
              <input
                type="text"
                placeholder="17:30"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-1/2 px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-center text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* B. 생산 수량 및 실시간 KPI (정품 / 불량 / 리워크 / 양품률) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
        <div className="flex items-center justify-between border-b border-indigo-200/80 dark:border-indigo-800/80 pb-2">
          <span className="font-black text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>2. 생산 수량 및 불량 집계</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black">
              양품률: {totals.yieldRate}%
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-rose-600 text-white font-black">
              불량률: {totals.defectRate}%
            </span>
          </div>
        </div>

        {/* 🌟 생산 수량 입력: 검사 (4대 일보 전용 4열 매트릭스) vs 정치절단 (A / B / C 단면) vs 단컷팅 및 기타 (LH / RH) */}
        {processId === "검사" ? (
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {inspColumns.map((col) => {
                const data = inspProduction[col.key] || {
                  insp: 0,
                  genuine: 0,
                  rework: 0,
                  reworkDv: 0,
                  reworkAngle: 0,
                  scrap: 0
                };
                const isFinal = inspectionType.includes("FINAL");
                const colTotal = isFinal
                  ? (Number(data.genuine) || 0) +
                    (Number(data.reworkDv) || 0) +
                    (Number(data.reworkAngle) || 0) +
                    (Number(data.scrap) || 0)
                  : (Number(data.genuine) || 0) +
                    (Number(data.rework) || 0) +
                    (Number(data.scrap) || 0);

                return (
                  <div
                    key={col.key}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-950/60 pb-1.5">
                      <div>
                        <span className="font-black text-xs text-emerald-950 dark:text-emerald-200 block">
                          {col.title}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          {col.sub}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold">
                        실적계: {colTotal.toLocaleString()} EA
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                          검사수량 (EA)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={data.insp}
                          onChange={(e) => updateInspProd(col.key, "insp", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white text-center"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                          정품 (EA)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={data.genuine}
                          onChange={(e) => updateInspProd(col.key, "genuine", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs font-black text-emerald-900 dark:text-emerald-200 text-center"
                        />
                      </div>

                      {isFinal ? (
                        <>
                          <div>
                            <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                              리워크 D/V
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={data.reworkDv}
                              onChange={(e) => updateInspProd(col.key, "reworkDv", e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs font-black text-amber-900 dark:text-amber-200 text-center"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block mb-0.5">
                              리워크 직/둔각
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={data.reworkAngle}
                              onChange={(e) => updateInspProd(col.key, "reworkAngle", e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs font-black text-amber-900 dark:text-amber-200 text-center"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                            리워크 (EA)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={data.rework}
                            onChange={(e) => updateInspProd(col.key, "rework", e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs font-black text-amber-900 dark:text-amber-200 text-center"
                          />
                        </div>
                      )}

                      <div className={isFinal ? "col-span-2" : "col-span-1"}>
                        <label className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mb-0.5">
                          폐기불량 (EA)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={data.scrap}
                          onChange={(e) => updateInspProd(col.key, "scrap", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-xs font-black text-rose-900 dark:text-rose-200 text-center"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : processId === "소재준비" && subProcess === "정치절단" ? (
          <div className="space-y-3">
            {/* 🌟 정치절단 부품 선택 (FRT vs RR) & 절단 생산 수량 집계 */}
            <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-indigo-900/60">
                <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    정치절단 생산 수량 집계 ({cuttingPart === "FRT" ? "FRT 3단면" : "RR 2단면"})
                  </span>
                </span>

                {/* FRT / RR Switcher */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-indigo-300 dark:border-indigo-700 shadow-2xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCuttingPart("FRT")}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                      cuttingPart === "FRT"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                    }`}
                  >
                    <span>🚗 FRT (3단면)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCuttingPart("RR")}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                      cuttingPart === "RR"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-purple-600"
                    }`}
                  >
                    <span>⚡ RR (2단면)</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-black">
                      <th className="p-2.5 text-center bg-slate-200/50 dark:bg-slate-700/50">단면</th>
                      <th className="p-2.5 text-center">절단 규격</th>
                      <th className="p-2.5 text-center bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-l border-emerald-200 dark:border-emerald-800">
                        정품 (EA)
                      </th>
                      <th className="p-2.5 text-center bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border-r border-emerald-200 dark:border-emerald-800">
                        불량 (EA)
                      </th>
                      <th className="p-2.5 text-center">총절단 (EA)</th>
                      <th className="p-2.5 text-center">양품률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {(cuttingPart === "FRT"
                      ? [
                          { key: "frtA", name: "A단면", spec: "881±3", genKey: "genuineA", badKey: "badA" },
                          { key: "frtB", name: "B단면", spec: "608±5", genKey: "genuineB", badKey: "badB" },
                          { key: "frtC", name: "C단면", spec: "582±5", genKey: "genuineC", badKey: "badC" }
                        ]
                      : [
                          { key: "rrA", name: "A단면", spec: "488±3", genKey: "genuineA", badKey: "badA" },
                          { key: "rrB", name: "B단면", spec: "658±5", genKey: "genuineB", badKey: "badB" }
                        ]
                    ).map((row) => {
                      const g = Number(production[row.genKey]) || 0;
                      const b = Number(production[row.badKey]) || 0;
                      const tot = g + b;
                      const yRate = tot > 0 ? ((g / tot) * 100).toFixed(1) + "%" : "-";

                      return (
                        <tr key={row.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-2.5 text-center font-black text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/30 whitespace-nowrap">
                            {cuttingPart} {row.name}
                          </td>
                          <td className="p-2.5 text-center font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                            {row.spec}mm
                          </td>
                          {/* 정품 수량 */}
                          <td className="p-2 text-center bg-emerald-50/40 dark:bg-emerald-950/20 border-l border-emerald-100 dark:border-emerald-900/40">
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={production[row.genKey] || 0}
                              onChange={(e) =>
                                setProduction((p) => ({
                                  ...p,
                                  [row.genKey]: parseInt(e.target.value, 10) || 0
                                }))
                              }
                              className="w-24 px-2 py-1.5 text-center font-black text-xs rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-200 focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>
                          {/* 불량 수량 */}
                          <td className="p-2 text-center bg-rose-50/40 dark:bg-rose-950/20 border-r border-emerald-100 dark:border-emerald-900/40">
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={production[row.badKey] || 0}
                              onChange={(e) =>
                                setProduction((p) => ({
                                  ...p,
                                  [row.badKey]: parseInt(e.target.value, 10) || 0
                                }))
                              }
                              className="w-20 px-2 py-1.5 text-center font-black text-xs rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-500"
                            />
                          </td>
                          {/* 총 절단 수량 */}
                          <td className="p-2.5 text-center font-black text-slate-900 dark:text-white">
                            {tot.toLocaleString()} EA
                          </td>
                          {/* 양품률 */}
                          <td className="p-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                            {yRate}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const isFrt = cuttingPart === "FRT";
                      const genSum =
                        (Number(production.genuineA) || 0) +
                        (Number(production.genuineB) || 0) +
                        (isFrt ? Number(production.genuineC) || 0 : 0);
                      const badSum =
                        (Number(production.badA) || 0) +
                        (Number(production.badB) || 0) +
                        (isFrt ? Number(production.badC) || 0 : 0);
                      const grossSum = genSum + badSum;
                      const yieldRate =
                        grossSum > 0 ? ((genSum / grossSum) * 100).toFixed(1) + "%" : "100.0%";

                      return (
                        <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-indigo-400">
                          <td className="p-3 text-center">실적계</td>
                          <td className="p-3 text-center text-slate-400">-</td>
                          <td className="p-3 text-center text-emerald-300 font-black text-sm">
                            {genSum.toLocaleString()} EA
                          </td>
                          <td className="p-3 text-center text-rose-300 font-black text-sm">
                            {badSum.toLocaleString()} EA
                          </td>
                          <td className="p-3 text-center text-white font-black">
                            {grossSum.toLocaleString()} EA
                          </td>
                          <td className="p-3 text-center text-emerald-400 font-black">
                            {yieldRate}
                          </td>
                        </tr>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* LH / RH Inputs for 단컷팅, 조인트, 본드로봇, 검사 */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* LH */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-indigo-900 dark:text-indigo-300">
                  {processId === "소재준비" && subProcess === "단컷팅"
                    ? "LH (좌측: FRT 83mm / RR 68mm)"
                    : processId === "조인트"
                    ? jointType === "FRT"
                      ? "🚗 FRT LH (2호기/3호기)"
                      : jointType === "FIXED_LH"
                      ? "📐 LH (1호기) 생산구분"
                      : jointType === "FIXED_RH"
                      ? "📐 RH (1호기) 생산구분"
                      : "⚡ RR LH (2호기/3호기)"
                    : "LH (좌측) / A구간"}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  합계: {(Number(production.genuineLH) || 0) + (Number(production.badLH) || 0)} EA
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                    정품 (EA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={production.genuineLH}
                    onChange={(e) =>
                      setProduction((p) => ({ ...p, genuineLH: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs font-black text-emerald-900 dark:text-emerald-200 text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mb-0.5">
                    불량 (EA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={production.badLH}
                    onChange={(e) =>
                      setProduction((p) => ({ ...p, badLH: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-xs font-black text-rose-900 dark:text-rose-200 text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                    리워크 (EA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={production.reworkLH}
                    onChange={(e) =>
                      setProduction((p) => ({ ...p, reworkLH: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs font-black text-amber-900 dark:text-amber-200 text-center"
                  />
                </div>
              </div>
            </div>

            {/* RH */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-indigo-900 dark:text-indigo-300">
                  {processId === "소재준비" && subProcess === "단컷팅"
                    ? "RH (우측: FRT 83mm / RR 67mm)"
                    : processId === "조인트"
                    ? jointType === "FRT"
                      ? "🚗 FRT RH (2호기/3호기)"
                      : jointType === "FIXED_LH"
                      ? "📐 LH (2호기) 생산구분"
                      : jointType === "FIXED_RH"
                      ? "📐 RH (2호기) 생산구분"
                      : "⚡ RR RH (2호기/3호기)"
                    : "RH (우측) / B구간"}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  합계: {(Number(production.genuineRH) || 0) + (Number(production.badRH) || 0)} EA
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                    정품 (EA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={production.genuineRH}
                    onChange={(e) =>
                      setProduction((p) => ({ ...p, genuineRH: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs font-black text-emerald-900 dark:text-emerald-200 text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mb-0.5">
                    불량 (EA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={production.badRH}
                    onChange={(e) =>
                      setProduction((p) => ({ ...p, badRH: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-xs font-black text-rose-900 dark:text-rose-200 text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                    리워크 (EA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={production.reworkRH}
                    onChange={(e) =>
                      setProduction((p) => ({ ...p, reworkRH: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs font-black text-amber-900 dark:text-amber-200 text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-4 gap-2 pt-1 text-center">
          <div className="p-2 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">
              총 정품
            </span>
            <span className="text-sm sm:text-base font-black text-emerald-950 dark:text-emerald-100">
              {totals.genuine.toLocaleString()} EA
            </span>
          </div>
          <div className="p-2 rounded-xl bg-rose-100/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80">
            <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold block">
              총 불량
            </span>
            <span className="text-sm sm:text-base font-black text-rose-950 dark:text-rose-100">
              {totals.bad.toLocaleString()} EA
            </span>
          </div>
          <div className="p-2 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80">
            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold block">
              총 리워크
            </span>
            <span className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-100">
              {totals.rework.toLocaleString()} EA
            </span>
          </div>
          <div className="p-2 rounded-xl bg-indigo-100/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80">
            <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold block">
              총 생산량
            </span>
            <span className="text-sm sm:text-base font-black text-indigo-950 dark:text-indigo-100">
              {totals.gross.toLocaleString()} EA
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default HanulReportBasicInfo;
