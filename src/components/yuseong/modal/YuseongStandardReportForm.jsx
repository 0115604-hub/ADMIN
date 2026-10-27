import React from "react";
import {
  Sparkles,
  Layers,
  Calendar,
  Gauge,
  TrendingUp,
  AlertTriangle,
  Wrench,
  FileText
} from "lucide-react";
import {
  YUSEONG_PROJECTS,
  YUSEONG_PROCESSES
} from "../../../services/yuseongWorkReportService";
import CommonDowntimeDefectPanel from "../../common/CommonDowntimeDefectPanel";
import { isDimOk } from "./yuseongReportHelpers";

export const YuseongStandardReportForm = ({
  assignedTemplate,
  setIsLegoMode,
  project,
  setProject,
  processId,
  setProcessId,
  subProcess,
  setSubProcess,
  date,
  setDate,
  shift,
  setShift,
  worker,
  customWorker,
  setCustomWorker,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  machineNo,
  setMachineNo,
  dollyNo,
  setDollyNo,
  materialLot,
  setMaterialLot,
  bladeChangeTime,
  setBladeChangeTime,
  currentSpecs,
  dimensions,
  handleDimChange,
  production,
  setProduction,
  totalGross,
  yieldPct,
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
    <div className="space-y-3.5 animate-fadeIn">
      {assignedTemplate && (
        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs font-black text-indigo-900 dark:text-indigo-200">
            🧩 관리자가 지정한 5대 공정 양식: <strong>{assignedTemplate.title}</strong>
          </div>
          <button
            type="button"
            onClick={() => setIsLegoMode(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
          >
            지정 양식으로 전환 ➔
          </button>
        </div>
      )}

      {/* 🚗 1. 차종 선택 (JK1 Part'g, CE1 Part'g, DT Hood) */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>1. 유성 3대 작업 아이템 선택:</span>
        </span>
        <div className="grid grid-cols-3 gap-2">
          {YUSEONG_PROJECTS.map((p) => {
            const isSelected = project === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProject(p.id)}
                className={`p-3 rounded-xl font-black text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                }`}
              >
                <span className="text-xl">{p.icon}</span>
                <span className="text-sm font-black">{p.name}</span>
                <span className={`text-[10px] ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                  {p.partName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ⚙️ 2. 공정 선택 (소재준비 / 조인트 / 본드로봇 / 검사) */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          <span>2. 표준 공정 선택:</span>
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {YUSEONG_PROCESSES.map((proc) => {
            const isSelected = processId === proc.id;
            return (
              <button
                key={proc.id}
                type="button"
                onClick={() => setProcessId(proc.id)}
                className={`p-2.5 rounded-xl font-black text-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                }`}
              >
                <span className="text-base">{proc.icon}</span>
                <span className="text-sm font-black">{proc.name}</span>
                <span className={`text-[10px] ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                  {proc.sub}
                </span>
              </button>
            );
          })}
        </div>

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
      </div>

      {/* 📅 3. 기본 작업 정보 */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>3. 기본 작업 정보:</span>
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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

          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              근무 형태
            </label>
            <div className="grid grid-cols-2 gap-1">
              {["주간", "야간"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShift(s)}
                  className={`py-1.5 text-xs font-black rounded-lg cursor-pointer transition ${
                    shift === s
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              작업자 이름
            </label>
            <input
              type="text"
              value={customWorker || worker}
              onChange={(e) => setCustomWorker(e.target.value)}
              placeholder="작업자 성명"
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              작업 시간 (시작~종료)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-1.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-center"
              />
              <span className="text-slate-400">~</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-1.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-center"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              설비 호기
            </label>
            <input
              type="text"
              value={machineNo}
              onChange={(e) => setMachineNo(e.target.value)}
              placeholder="예: 1호기"
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-center"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              대차(Dolly) 번호
            </label>
            <input
              type="text"
              value={dollyNo}
              onChange={(e) => setDollyNo(e.target.value)}
              placeholder="대차 번호"
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-center"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              원재료 LOT
            </label>
            <input
              type="text"
              value={materialLot}
              onChange={(e) => setMaterialLot(e.target.value)}
              placeholder="원재료 LOT"
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-center"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              칼날 교체 시간
            </label>
            <input
              type="text"
              value={bladeChangeTime}
              onChange={(e) => setBladeChangeTime(e.target.value)}
              placeholder="예: 10:30"
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-center"
            />
          </div>
        </div>
      </div>

      {/* 📐 4. 초·중·종물 규격 치수 점검 */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-indigo-500" />
            <span>4. 초·중·종물 치수 측정 및 규격 판정 ({project}):</span>
          </span>
          <span className="text-[10px] text-slate-400 font-bold">
            공차 이탈 시 자동 <span className="text-rose-600 font-black">NG</span> 표시
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
                          !startOk ? "bg-rose-50 text-rose-600 border-rose-400" : "border-slate-200 dark:border-slate-700"
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
                          !midOk ? "bg-rose-50 text-rose-600 border-rose-400" : "border-slate-200 dark:border-slate-700"
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
                          !endOk ? "bg-rose-50 text-rose-600 border-rose-400" : "border-slate-200 dark:border-slate-700"
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

      {/* 📊 5. 생산 실적 수량 */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>5. 생산 실적 수량:</span>
          </span>
          <div className="flex items-center gap-2 text-xs font-black">
            <span>총생산: <span className="text-blue-600 font-mono">{totalGross}EA</span></span>
            <span>양품률: <span className="text-emerald-600 font-mono">{yieldPct}%</span></span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300">
              LH (좌측)
            </span>
            <div className="grid grid-cols-3 gap-1.5">
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

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300">
              RH (우측)
            </span>
            <div className="grid grid-cols-3 gap-1.5">
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
      </div>

      {/* 🚨 6. 세부 불량 내역 */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>6. 세부 불량 내역 ({processId}):</span>
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
                  <span className={`w-6 text-center text-xs font-black ${count > 0 ? "text-rose-600 font-mono" : "text-slate-400"}`}>
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

      {/* 🛠️ 7. TPM 설비일상점검 확인 배지 */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-300 dark:border-indigo-700 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-600 text-white">
            <Wrench className="w-4 h-4" />
          </span>
          <div>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              4단계: TPM 설비일상점검 (완료)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              양호 {tpmSummary.okCount}건 / 이상 {tpmSummary.ngCount}건 (5대 설비 35개 검사 완료)
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCurrentStep("tpm")}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs cursor-pointer transition active:scale-95 shadow-xs flex items-center gap-1"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>TPM 점검표 수정/확인</span>
        </button>
      </div>

      {/* ⏱️ 비가동 및 부적합품 발생내역 (유성 전 공정 공통 패널 - 조치전/조치후 사진 등록) */}
      <CommonDowntimeDefectPanel
        title="비가동 및 부적합품 발생내역"
        plantLabel="유성"
        unitLabel="부적합량(EA)"
        events={downtimeEvents}
        onChangeEvents={setDowntimeEvents}
        onSyncSummary={({ totalMinutes, summaryText }) => {
          setDowntimeMinutes(totalMinutes);
          if (summaryText) setMachineTrouble(summaryText);
        }}
      />

      {/* 📝 8. 특이사항 및 설비 이상 조치 */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>8. 비가동 시간 및 특이사항:</span>
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
    </div>
  );
};
