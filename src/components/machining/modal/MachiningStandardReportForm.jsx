import React from "react";
import {
  Sparkles,
  Layers,
  Calendar,
  Package,
  Gauge,
  TrendingUp,
  AlertTriangle,
  Wrench,
  FileText
} from "lucide-react";
import {
  MACHINING_PROJECTS,
  MACHINING_JOINT_TYPES,
  MACHINING_INSPECTION_TYPES,
  MACHINING_WORKERS_MASTER
} from "../../../services/machiningWorkReportService";
import CommonDowntimeDefectPanel from "../../common/CommonDowntimeDefectPanel";
import { isDimOk } from "./machiningModalHelpers";

export const MachiningStandardReportForm = ({
  project,
  setProject,
  processId,
  setProcessId,
  subProcess,
  setSubProcess,
  jointType,
  setJointType,
  inspectionType,
  setInspectionType,
  date,
  setDate,
  shift,
  setShift,
  worker,
  setWorker,
  customWorker,
  setCustomWorker,
  machineNo,
  setMachineNo,
  dollyNo,
  setDollyNo,
  materialLot,
  setMaterialLot,
  jointLot,
  setJointLot,
  bladeChangeTime,
  setBladeChangeTime,
  currentSpecs,
  dimensions,
  handleDimChange,
  totalGross,
  yieldPct,
  production,
  setProduction,
  inspProduction,
  setInspProduction,
  currentDefectKeys,
  defects,
  handleDefectChange,
  tpmSummary,
  setCurrentStep,
  downtimeEvents,
  setDowntimeEvents,
  downtimeMinutes,
  setDowntimeMinutes,
  machineTrouble,
  setMachineTrouble,
  notes,
  setNotes
}) => {
  return (
    <>
      {/* 🚗 1. 차종 선택 (4대 G/RUN 라인) */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>1. 차종 프로젝트 선택 (G/RUN 4대 차종):</span>
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MACHINING_PROJECTS.map((p) => {
            const isSelected = project === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProject(p.id)}
                className={`p-2.5 rounded-xl font-black text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                  isSelected
                    ? "bg-amber-600 text-white border-amber-600 shadow-md scale-[1.02]"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400"
                }`}
              >
                <span className="text-base">{p.icon}</span>
                <span className="text-sm font-black">{p.name}</span>
                <span className={`text-[10px] ${isSelected ? "text-amber-100" : "text-slate-400"}`}>
                  {p.partName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ⚙️ 2. 공정 선택 (한울과 100% 동일한 4대 핵심 공정 분류) */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          <span>2. 표준 공정 선택 (한울 분류 표준 동일 적용):</span>
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: "소재준비", name: "소재준비", sub: "정치절단, 단컷팅", icon: "✂️" },
            { id: "조인트", name: "조인트", sub: "FRT, RR, 코너 사출", icon: "⚙️" },
            { id: "본드로봇", name: "본드로봇", sub: "로봇 본딩 및 도포", icon: "🤖" },
            { id: "검사", name: "검사", sub: "치수, 단면, 최종검사", icon: "🔍" }
          ].map((proc) => {
            const isSelected = processId === proc.id;
            return (
              <button
                key={proc.id}
                type="button"
                onClick={() => setProcessId(proc.id)}
                className={`p-2.5 rounded-xl font-black text-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                }`}
              >
                <span className="text-base">{proc.icon}</span>
                <span className="text-sm font-black">{proc.name}</span>
                <span className={`text-[10px] ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                  {proc.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sub-process switches */}
        {processId === "소재준비" && (
          <div className="pt-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500">소재 세부:</span>
            {["정치절단", "단컷팅"].map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubProcess(sub)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                  subProcess === sub
                    ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {processId === "조인트" && (
          <div className="pt-2 flex items-center gap-2 flex-wrap border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500">조인트 서식:</span>
            {MACHINING_JOINT_TYPES.map((jt) => (
              <button
                key={jt.id}
                type="button"
                onClick={() => setJointType(jt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                  jointType === jt.id
                    ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {jt.label}
              </button>
            ))}
          </div>
        )}

        {processId === "검사" && (
          <div className="pt-2 flex items-center gap-2 flex-wrap border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500">검사 일보 서식:</span>
            {MACHINING_INSPECTION_TYPES.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => setInspectionType(it.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                  inspectionType === it.id
                    ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {it.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 📅 3. 기본 작업 정보 (일자, 근무, 작업자, 시간, 설비) */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-500" />
          <span>3. 기본 작업 정보:</span>
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Date */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              작업 일자
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            />
          </div>

          {/* Shift */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              근무 형태
            </label>
            <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setShift("주간")}
                className={`py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                  shift === "주간"
                    ? "bg-white dark:bg-slate-700 text-amber-600 shadow-xs"
                    : "text-slate-500"
                }`}
              >
                ☀️ 주간
              </button>
              <button
                type="button"
                onClick={() => setShift("야간")}
                className={`py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                  shift === "야간"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-xs"
                    : "text-slate-500"
                }`}
              >
                🌙 야간
              </button>
            </div>
          </div>

          {/* Worker Selection */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              작업자 (가공동 31명)
            </label>
            <select
              value={worker}
              onChange={(e) => {
                setWorker(e.target.value);
                if (e.target.value !== "직접입력") setCustomWorker("");
              }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            >
              {MACHINING_WORKERS_MASTER.map((w) => (
                <option key={w.no} value={w.name}>
                  {w.name} ({w.line} {w.position})
                </option>
              ))}
              <option value="직접입력">✏️ 직접 입력</option>
            </select>
            {worker === "직접입력" && (
              <input
                type="text"
                placeholder="작업자명 입력"
                value={customWorker}
                onChange={(e) => setCustomWorker(e.target.value)}
                className="w-full mt-1.5 px-2.5 py-1 rounded-lg border border-amber-300 text-xs font-bold"
              />
            )}
          </div>

          {/* Machine / Dolly */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              설비호기 / 대차번호
            </label>
            <div className="grid grid-cols-2 gap-1">
              <input
                type="text"
                placeholder="설비호기"
                value={machineNo}
                onChange={(e) => setMachineNo(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center"
              />
              <input
                type="text"
                placeholder="대차번호"
                value={dollyNo}
                onChange={(e) => setDollyNo(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 🏷️ 4. LOT 추적 관리 */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-emerald-500" />
          <span>4. 투입 LOT 관리 (압출 원소재 & 조인트 재료):</span>
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              압출 투입 LOT (A단면 / B단면)
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <input
                type="text"
                placeholder="초물 LOT"
                value={materialLot.a?.start || ""}
                onChange={(e) =>
                  setMaterialLot((prev) => ({
                    ...prev,
                    a: { ...(prev.a || {}), start: e.target.value }
                  }))
                }
                className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-center"
              />
              <input
                type="text"
                placeholder="중물 LOT"
                value={materialLot.a?.mid || ""}
                onChange={(e) =>
                  setMaterialLot((prev) => ({
                    ...prev,
                    a: { ...(prev.a || {}), mid: e.target.value }
                  }))
                }
                className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-center"
              />
              <input
                type="text"
                placeholder="종물 LOT"
                value={materialLot.a?.end || ""}
                onChange={(e) =>
                  setMaterialLot((prev) => ({
                    ...prev,
                    a: { ...(prev.a || {}), end: e.target.value }
                  }))
                }
                className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-center"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              조인트/원재료 LOT 및 칼날교체시간
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                placeholder="조인트 재료 LOT"
                value={jointLot}
                onChange={(e) => setJointLot(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-center"
              />
              <input
                type="text"
                placeholder="칼날교체 (예: 10:30)"
                value={bladeChangeTime}
                onChange={(e) => setBladeChangeTime(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 📐 5. 초·중·종물 규격 치수 점검 (실시간 공차 OK/NG 자동 판정) */}
      {currentSpecs.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-500" />
              <span>5. 초·중·종물 치수 측정 및 규격 판정 ({project} {processId}):</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              규격 범위 초과 시 자동 <span className="text-rose-600 font-black">NG</span> 표시
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold text-[11px] bg-slate-50 dark:bg-slate-800/50">
                  <th className="py-2 px-2.5">검사 항목</th>
                  <th className="py-2 px-2.5 text-center">규격(공차)</th>
                  <th className="py-2 px-2 text-center w-20">초물</th>
                  <th className="py-2 px-2 text-center w-20">중물</th>
                  <th className="py-2 px-2 text-center w-20">종물</th>
                  <th className="py-2 px-2.5 text-center w-16">판정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentSpecs.map((spec) => {
                  const rowDims = dimensions[spec.key] || {};
                  const startOk = isDimOk(rowDims.start, spec.target, spec.tol);
                  const midOk = isDimOk(rowDims.mid, spec.target, spec.tol);
                  const endOk = isDimOk(rowDims.end, spec.target, spec.tol);
                  const allOk = startOk && midOk && endOk;

                  return (
                    <tr key={spec.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-2.5 font-bold text-slate-700 dark:text-slate-300">
                        {spec.label}
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-500">
                        {spec.spec}
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          step="0.1"
                          placeholder={spec.target ? String(spec.target) : "측정"}
                          value={rowDims.start || ""}
                          onChange={(e) => handleDimChange(spec.key, "start", e.target.value)}
                          className={`w-full px-1.5 py-1 text-xs rounded-md text-center font-mono font-bold border ${
                            !startOk
                              ? "bg-rose-50 text-rose-600 border-rose-400"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                        />
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          step="0.1"
                          placeholder={spec.target ? String(spec.target) : "측정"}
                          value={rowDims.mid || ""}
                          onChange={(e) => handleDimChange(spec.key, "mid", e.target.value)}
                          className={`w-full px-1.5 py-1 text-xs rounded-md text-center font-mono font-bold border ${
                            !midOk
                              ? "bg-rose-50 text-rose-600 border-rose-400"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                        />
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          step="0.1"
                          placeholder={spec.target ? String(spec.target) : "측정"}
                          value={rowDims.end || ""}
                          onChange={(e) => handleDimChange(spec.key, "end", e.target.value)}
                          className={`w-full px-1.5 py-1 text-xs rounded-md text-center font-mono font-bold border ${
                            !endOk
                              ? "bg-rose-50 text-rose-600 border-rose-400"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            allOk
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse"
                          }`}
                        >
                          {allOk ? "OK" : "NG"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📊 6. 생산 실적 집계 (양품 / 불량 / 리워크 / 총생산) */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>6. 생산 실적 수량:</span>
          </span>
          <div className="flex items-center gap-2 text-xs font-black">
            <span>
              총생산: <span className="text-blue-600 font-mono">{totalGross}EA</span>
            </span>
            <span>
              양품률: <span className="text-emerald-600 font-mono">{yieldPct}%</span>
            </span>
          </div>
        </div>

        {processId === "검사" ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: "col1", label: "LH 1호기 (검사/정품/리워크/폐기)" },
              { key: "col2", label: "LH 2호기 (검사/정품/리워크/폐기)" },
              { key: "col3", label: "RH 1호기 (검사/정품/리워크/폐기)" },
              { key: "col4", label: "RH 2호기 (검사/정품/리워크/폐기)" }
            ].map((col) => {
              const data = inspProduction[col.key] || {};
              return (
                <div
                  key={col.key}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5"
                >
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate">
                    {col.label}
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400">정품</span>
                      <input
                        type="number"
                        value={data.genuine || 0}
                        onChange={(e) =>
                          setInspProduction((prev) => ({
                            ...prev,
                            [col.key]: { ...(prev[col.key] || {}), genuine: Number(e.target.value) || 0 }
                          }))
                        }
                        className="w-full px-1.5 py-1 rounded border text-center font-bold text-emerald-600"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">폐기(불량)</span>
                      <input
                        type="number"
                        value={data.scrap || 0}
                        onChange={(e) =>
                          setInspProduction((prev) => ({
                            ...prev,
                            [col.key]: { ...(prev[col.key] || {}), scrap: Number(e.target.value) || 0 }
                          }))
                        }
                        className="w-full px-1.5 py-1 rounded border text-center font-bold text-rose-600"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* LH / A */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                LH / A단면 생산 실적
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold">정품(EA)</span>
                  <input
                    type="number"
                    value={production.genuineLH || 0}
                    onChange={(e) =>
                      setProduction((prev) => ({ ...prev, genuineLH: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-emerald-300 text-emerald-600 font-bold text-center text-sm"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold">불량(EA)</span>
                  <input
                    type="number"
                    value={production.badLH || 0}
                    onChange={(e) =>
                      setProduction((prev) => ({ ...prev, badLH: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-rose-300 text-rose-600 font-bold text-center text-sm"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold">리워크(EA)</span>
                  <input
                    type="number"
                    value={production.reworkLH || 0}
                    onChange={(e) =>
                      setProduction((prev) => ({ ...prev, reworkLH: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-amber-300 text-amber-600 font-bold text-center text-sm"
                  />
                </div>
              </div>
            </div>

            {/* RH / B */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                RH / B단면 생산 실적
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold">정품(EA)</span>
                  <input
                    type="number"
                    value={production.genuineRH || 0}
                    onChange={(e) =>
                      setProduction((prev) => ({ ...prev, genuineRH: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-emerald-300 text-emerald-600 font-bold text-center text-sm"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold">불량(EA)</span>
                  <input
                    type="number"
                    value={production.badRH || 0}
                    onChange={(e) =>
                      setProduction((prev) => ({ ...prev, badRH: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-rose-300 text-rose-600 font-bold text-center text-sm"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold">리워크(EA)</span>
                  <input
                    type="number"
                    value={production.reworkRH || 0}
                    onChange={(e) =>
                      setProduction((prev) => ({ ...prev, reworkRH: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-amber-300 text-amber-600 font-bold text-center text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🚨 7. 세부 불량 내역 (+/- 버튼 간편 입력) */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>7. 세부 불량 내역 ({processId}):</span>
          </span>
          <span className="text-[10px] font-bold text-rose-600">
            총 불량: {Object.values(defects).reduce((a, b) => a + (Number(b) || 0), 0)}EA
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {currentDefectKeys.map((defKey) => {
            const count = Number(defects[defKey]) || 0;
            return (
              <div
                key={defKey}
                className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
                  count > 0
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                }`}
              >
                <span className="text-xs font-bold truncate pr-1 text-slate-700 dark:text-slate-300">
                  {defKey}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDefectChange(defKey, -1)}
                    className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-black cursor-pointer hover:bg-slate-300"
                  >
                    -
                  </button>
                  <span
                    className={`w-6 text-center text-xs font-black ${
                      count > 0 ? "text-rose-600 font-mono" : "text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDefectChange(defKey, 1)}
                    className="w-5 h-5 rounded bg-rose-600 text-white flex items-center justify-center text-xs font-black cursor-pointer hover:bg-rose-700"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🛠️ 8. TPM 설비일상점검 확인 배지 */}
      <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-600 text-white">
            <Wrench className="w-4 h-4" />
          </span>
          <div>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              4단계: TPM 설비일상점검 (완료)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              양호 {tpmSummary.okCount}건 / 이상 {tpmSummary.ngCount}건 (6대 설비 42개 검사 완료)
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCurrentStep("tpm")}
          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs cursor-pointer transition active:scale-95 shadow-xs flex items-center gap-1"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>TPM 점검표 수정/확인</span>
        </button>
      </div>

      {/* ⏱️ 비가동 및 부적합품 발생내역 (전 공정 공통 패널 - 조치전/조치후 사진 등록) */}
      <CommonDowntimeDefectPanel
        title="비가동 및 부적합품 발생내역"
        plantLabel="가공동"
        unitLabel="부적합량(EA)"
        events={downtimeEvents}
        onChangeEvents={setDowntimeEvents}
        onSyncSummary={({ totalMinutes, summaryText }) => {
          setDowntimeMinutes(totalMinutes);
          if (summaryText) setMachineTrouble(summaryText);
        }}
      />

      {/* 📝 9. 특이사항 및 설비 이상 조치 */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>9. 비가동 시간 및 특이사항:</span>
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              설비 이상 및 조치사항 (비가동)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="비가동(분)"
                value={downtimeMinutes || ""}
                onChange={(e) => setDowntimeMinutes(e.target.value)}
                className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center"
              />
              <input
                type="text"
                placeholder="설비 이상 내용 및 조치결과 입력"
                value={machineTrouble}
                onChange={(e) => setMachineTrouble(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              공정 특이사항 및 전달 메모
            </label>
            <input
              type="text"
              placeholder="차기조 인수인계 및 품질 특이사항"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default MachiningStandardReportForm;
