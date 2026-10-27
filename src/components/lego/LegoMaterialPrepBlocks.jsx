import React from "react";
import { Trash2 } from "lucide-react";

/**
 * 🏷️ [일보 헤더: 제목 & 결재란 (한 줄 통일 & 제목 클릭 수정 가능)]
 */
export const ReportTitleHeader = ({
  currentReport = {},
  isWorkerRecordingMode = false,
  handleUpdateField,
  t = (s) => s
}) => {
  return (
    <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Editable Report Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-slate-400">
              {t("양식번호")}: {currentReport.formNo || "705-02"}
            </span>
            {isWorkerRecordingMode ? (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                🔒 {t("현장작업자 기록 모드 (SPEC 고정 · 실측치 기록 전용)")}
              </span>
            ) : (
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                ✏️ {t("제목/치수 클릭 시 수정 가능")}
              </span>
            )}
          </div>
          {isWorkerRecordingMode ? (
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white py-1 mt-0.5">
              {currentReport.title || "소재준비작업일보"}
            </h2>
          ) : (
            <input
              type="text"
              value={currentReport.title || "소재준비작업일보"}
              onChange={(e) => handleUpdateField?.("title", e.target.value)}
              className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-400 focus:border-indigo-500 outline-none w-full py-1 mt-0.5"
              title="클릭하여 일보 제목을 자유롭게 수정하세요."
            />
          )}
        </div>

        {/* 3단 결재란 (작성 / 검토 / 승인) */}
        <div className="shrink-0">
          <table className="border-collapse border border-black dark:border-slate-600 text-xs text-center font-bold">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b border-black dark:border-slate-600 text-[11px]">
                <th rowSpan={2} className="border-r border-black dark:border-slate-600 px-2 py-1 bg-slate-200 dark:bg-slate-700">
                  {t("결재")}
                </th>
                <th className="border-r border-black dark:border-slate-600 px-3 py-0.5">{t("작 성")}</th>
                <th className="border-r border-black dark:border-slate-600 px-3 py-0.5">{t("검 토")}</th>
                <th className="px-3 py-0.5">{t("승 인")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-10">
                <td className="border-r border-black dark:border-slate-600 w-14">
                  <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">
                    {currentReport.workerName}
                  </span>
                </td>
                <td className="border-r border-black dark:border-slate-600 w-14"></td>
                <td className="w-14"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * 🧱 BLOCK 8: 작업 기본 정보 (사진 8)
 */
export const BasicInfoBlock = ({
  currentReport = {},
  isWorkerRecordingMode = false,
  handleUpdateField,
  t = (s) => s,
  renderBlockWrapper
}) => {
  return renderBlockWrapper(
    "basicInfo",
    "[블록 8] 작업 기본 정보 헤더",
    <div className="rounded-2xl p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
      <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
          <span>🧱 {t("[블록 8] 작업 기본 정보 헤더")}</span>
          <span className="text-[10px] text-slate-400">
            {t("(차종 · 품명 · 공정명 · 목표수량 · 작업자 · 근무시간)")}
          </span>
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[10px] font-bold text-slate-400 block">{t("차종 (Car model)")}</span>
          {isWorkerRecordingMode ? (
            <span className="font-black text-xs text-center block text-indigo-600 dark:text-cyan-400 py-1">
              {currentReport.carModel || "-"}
            </span>
          ) : (
            <input
              type="text"
              value={currentReport.carModel || ""}
              onChange={(e) => handleUpdateField?.("carModel", e.target.value)}
              className="font-black text-xs text-center w-full bg-transparent outline-none border-b border-dashed border-slate-300 text-indigo-600 dark:text-cyan-400"
            />
          )}
        </div>
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[10px] font-bold text-slate-400 block">{t("품 명 (Part name)")}</span>
          {isWorkerRecordingMode ? (
            <span className="font-black text-xs text-center block py-1">
              {currentReport.partName || "-"}
            </span>
          ) : (
            <input
              type="text"
              value={currentReport.partName || ""}
              onChange={(e) => handleUpdateField?.("partName", e.target.value)}
              className="font-black text-xs text-center w-full bg-transparent outline-none border-b border-dashed border-slate-300"
            />
          )}
        </div>
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[10px] font-bold text-slate-400 block">{t("공정명 (Process name)")}</span>
          {isWorkerRecordingMode ? (
            <span className="font-black text-xs text-center block text-indigo-600 dark:text-indigo-400 py-1">
              {currentReport.processName === "외주가공" ? "가공/협력업체" : (currentReport.processName || "소재준비")}
            </span>
          ) : (
            <input
              type="text"
              value={currentReport.processName === "외주가공" ? "가공/협력업체" : (currentReport.processName || "소재준비")}
              onChange={(e) => handleUpdateField?.("processName", e.target.value)}
              placeholder="예: 소재준비"
              className="font-black text-xs text-center w-full bg-transparent outline-none border-b border-dashed border-slate-300 text-indigo-600 dark:text-indigo-400"
            />
          )}
        </div>
        <div className="p-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center">
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 block">
            {t("목표(오더)수량")}
          </span>
          {isWorkerRecordingMode ? (
            <span className="font-mono font-black text-xs text-center block text-indigo-700 dark:text-cyan-300 py-1">
              {(Number(currentReport.targetQty || currentReport.orderQty) || 350).toLocaleString()} EA
            </span>
          ) : (
            <input
              type="number"
              value={currentReport.targetQty || currentReport.orderQty || 350}
              onChange={(e) => {
                const num = Number(e.target.value);
                handleUpdateField?.("targetQty", num);
                handleUpdateField?.("orderQty", num);
              }}
              className="font-mono font-black text-xs text-center w-full bg-transparent outline-none border-b border-dashed border-indigo-300 text-indigo-700 dark:text-cyan-300"
            />
          )}
        </div>
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[10px] font-bold text-slate-400 block">{t("작업자 / 근무조")}</span>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <span className="font-black text-xs text-indigo-600 dark:text-indigo-400">
              {currentReport.workerName || "김작업"}
            </span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
              {currentReport.shift || "주간"}
            </span>
          </div>
        </div>
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[10px] font-bold text-slate-400 block">{t("작업일자 / 시간")}</span>
          <span className="font-mono font-bold text-xs block text-slate-700 dark:text-slate-300 mt-0.5">
            {currentReport.workDate || "-"}
          </span>
        </div>
      </div>
    </div>,
    { customBadge: "사진 8" }
  );
};

/**
 * 🧱 BLOCK 9: 작업시간 및 생산량(실적) 테이블 (사진 9)
 */
export const WorkTimeOutputBlock = ({
  currentReport = {},
  isWorkerRecordingMode = false,
  handleUpdateSpecValue,
  t = (s) => s,
  renderBlockWrapper
}) => {
  return renderBlockWrapper(
    "workTimeOutput",
    "[블록 9] 작업시간 및 생산실적 테이블",
    <div className="space-y-1.5">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
          <span>🧱 {t("[블록 9] 작업시간 및 생산실적 테이블")}</span>
        </span>
      </div>
      <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
        <table className="w-full border-collapse text-xs text-center font-bold">
          <thead>
            <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
              <th rowSpan={2} className="border-r border-black dark:border-slate-600 p-1.5 w-[20%]">
                {t("구 분(Division)")}
              </th>
              <th colSpan={3} className="border-r border-black dark:border-slate-600 p-1">
                {t("A단면 실적")}
              </th>
              <th colSpan={3} className="p-1">
                {t("B단면 실적")}
              </th>
            </tr>
            <tr className="bg-amber-50 dark:bg-amber-950/50 border-b border-black dark:border-slate-600 text-[10px]">
              <th className="border-r border-black dark:border-slate-600 p-1">{t("시작시간")}</th>
              <th className="border-r border-black dark:border-slate-600 p-1">{t("종료시간")}</th>
              <th className="border-r border-black dark:border-slate-600 p-1">{t("생산수량")}</th>
              <th className="border-r border-black dark:border-slate-600 p-1">{t("시작시간")}</th>
              <th className="border-r border-black dark:border-slate-600 p-1">{t("종료시간")}</th>
              <th className="p-1">{t("생산수량")}</th>
            </tr>
          </thead>
          <tbody>
            {(currentReport.workTimeOutput || []).map((row, idx) => (
              <tr key={row.id || idx} className="border-b border-black dark:border-slate-600">
                <td className="border-r border-black dark:border-slate-600 p-1 bg-slate-50 dark:bg-slate-800 font-black">
                  {isWorkerRecordingMode ? (
                    <span className="w-full text-center font-black block">{row.division || ""}</span>
                  ) : (
                    <input
                      type="text"
                      value={row.division || ""}
                      onChange={(e) => handleUpdateSpecValue?.("workTimeOutput", row.id, "division", e.target.value)}
                      className="w-full text-center font-black bg-transparent outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500"
                      title="구분명 수정 (클릭하여 직접 변경)"
                    />
                  )}
                </td>
                <td className="border-r border-black dark:border-slate-600 p-1">
                  <input
                    type="text"
                    value={row.startA || ""}
                    onChange={(e) => handleUpdateSpecValue?.("workTimeOutput", row.id, "startA", e.target.value)}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
                <td className="border-r border-black dark:border-slate-600 p-1">
                  <input
                    type="text"
                    value={row.finishA || ""}
                    onChange={(e) => handleUpdateSpecValue?.("workTimeOutput", row.id, "finishA", e.target.value)}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
                <td className="border-r border-black dark:border-slate-600 p-1 font-mono font-black text-indigo-600 dark:text-cyan-400">
                  <input
                    type="number"
                    value={row.qtyA || 0}
                    onChange={(e) => handleUpdateSpecValue?.("workTimeOutput", row.id, "qtyA", Number(e.target.value))}
                    className="w-full text-center bg-transparent outline-none font-mono font-black"
                  />
                </td>
                <td className="border-r border-black dark:border-slate-600 p-1">
                  <input
                    type="text"
                    value={row.startB || ""}
                    onChange={(e) => handleUpdateSpecValue?.("workTimeOutput", row.id, "startB", e.target.value)}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
                <td className="border-r border-black dark:border-slate-600 p-1">
                  <input
                    type="text"
                    value={row.finishB || ""}
                    onChange={(e) => handleUpdateSpecValue?.("workTimeOutput", row.id, "finishB", e.target.value)}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
                <td className="p-1 font-mono font-black text-indigo-600 dark:text-cyan-400">
                  <input
                    type="number"
                    value={row.qtyB || 0}
                    onChange={(e) => handleUpdateSpecValue?.("workTimeOutput", row.id, "qtyB", Number(e.target.value))}
                    className="w-full text-center bg-transparent outline-none font-mono font-black"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    { customBadge: "사진 9" }
  );
};

/**
 * 🧱 BLOCK 15: 정치 절단 길이 & LOT NO. (사진 15)
 */
export const SpecsCuttingBlock = ({
  currentReport = {},
  isWorkerRecordingMode = false,
  handleUpdateSpecValue,
  handleDeleteCuttingSpecRow,
  handleAddCuttingSpecRow,
  t = (s) => s,
  renderBlockWrapper
}) => {
  return renderBlockWrapper(
    "specsCutting",
    "[블록 15] 정치 절단 길이 (Spec cutting) & LOT NO.",
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>🧱 {t("[블록 15] 정치 절단 길이 (Spec cutting) & LOT NO.")}</span>
          </span>
          <span className="text-[11px] text-slate-500 font-bold">
            {t("(초물 · 중물 · 종물 3회 검사 및 LOT 3회 기록)")}
          </span>
        </div>
        {!isWorkerRecordingMode && (
          <button
            type="button"
            onClick={handleAddCuttingSpecRow}
            className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition active:scale-95"
          >
            <span>{t("+ 단면 행 추가")}</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
        <table className="w-full border-collapse text-xs text-center font-bold">
          <thead>
            <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
              <th className="border-r border-black dark:border-slate-600 p-1.5 w-[14%]">{t("구분(단면)")}</th>
              <th className="border-r border-black dark:border-slate-600 p-1.5 w-[20%]">{t("항목")}</th>
              <th className="border-r border-black dark:border-slate-600 p-1.5 w-[22%]">{t("초물(Start)")}</th>
              <th className="border-r border-black dark:border-slate-600 p-1.5 w-[22%]">{t("중물(Half)")}</th>
              <th className="border-r border-black dark:border-slate-600 p-1.5 w-[22%]">{t("종물(Finish)")}</th>
              {!isWorkerRecordingMode && <th className="p-1 print:hidden w-[4%]">{t("관리")}</th>}
            </tr>
          </thead>
          <tbody>
            {(currentReport.specsCutting || []).map((row) => (
              <React.Fragment key={row.id}>
                {/* Row 1: SPEC 규격치 */}
                <tr className="border-b border-black dark:border-slate-600 bg-amber-50/50 dark:bg-amber-950/30">
                  <td rowSpan={3} className="border-r border-black dark:border-slate-600 p-1.5 font-black bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-cyan-400 text-xs">
                    {isWorkerRecordingMode ? (
                      <span className="w-full text-center font-black block">{row.section || ""}</span>
                    ) : (
                      <input
                        type="text"
                        value={row.section || ""}
                        onChange={(e) => handleUpdateSpecValue?.("specsCutting", row.id, "section", e.target.value)}
                        className="w-full text-center font-black bg-transparent outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500"
                        title="단면 구분명 직접 수정"
                      />
                    )}
                  </td>
                  <td className="border-r border-black dark:border-slate-600 p-1 text-[11px] font-bold text-amber-900 dark:text-amber-200">
                    {t("SPEC")}
                  </td>
                  <td colSpan={3} className="border-r border-black dark:border-slate-600 p-1 font-mono font-black text-indigo-700 dark:text-cyan-300">
                    {isWorkerRecordingMode ? (
                      <span className="font-mono font-black text-indigo-700 dark:text-cyan-300 text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/60 inline-block">
                        🔒 {row.spec1}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={row.spec1 || ""}
                        onChange={(e) => handleUpdateSpecValue?.("specsCutting", row.id, "spec1", e.target.value)}
                        className="w-full text-center font-black bg-transparent outline-none"
                        title="규격/공차 직접 수정 (예: 881 ± 3mm)"
                        placeholder={t("규격 입력 (예: 881 ± 3mm)")}
                      />
                    )}
                  </td>
                  {!isWorkerRecordingMode && (
                    <td rowSpan={3} className="p-1 align-middle text-center print:hidden w-[4%]">
                      <button
                        type="button"
                        onClick={() => handleDeleteCuttingSpecRow?.(row.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded transition cursor-pointer"
                        title="단면 행 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>

                {/* Row 2: 초/중/종 실측치 */}
                <tr className="border-b border-black dark:border-slate-600">
                  <td className="border-r border-black dark:border-slate-600 p-1 text-[11px] font-bold bg-slate-50 dark:bg-slate-800">
                    {t("초/중/종")}
                  </td>
                  <td className="border-r border-black dark:border-slate-600 p-1">
                    <input
                      type="text"
                      value={row.start1 || ""}
                      onChange={(e) => handleUpdateSpecValue?.("specsCutting", row.id, "start1", e.target.value)}
                      className="w-full text-center font-mono font-bold bg-transparent outline-none"
                      placeholder={t("초물")}
                    />
                  </td>
                  <td className="border-r border-black dark:border-slate-600 p-1">
                    <input
                      type="text"
                      value={row.half1 || ""}
                      onChange={(e) => handleUpdateSpecValue?.("specsCutting", row.id, "half1", e.target.value)}
                      className="w-full text-center font-mono font-bold bg-transparent outline-none"
                      placeholder={t("중물")}
                    />
                  </td>
                  <td className="border-r border-black dark:border-slate-600 p-1">
                    <input
                      type="text"
                      value={row.finish1 || ""}
                      onChange={(e) => handleUpdateSpecValue?.("specsCutting", row.id, "finish1", e.target.value)}
                      className="w-full text-center font-mono font-bold bg-transparent outline-none"
                      placeholder={t("종물")}
                    />
                  </td>
                </tr>

                {/* Row 3: LOT NO. */}
                <tr className="border-b border-black dark:border-slate-600">
                  <td className="border-r border-black dark:border-slate-600 p-1 text-[11px] font-bold bg-slate-50 dark:bg-slate-800">
                    {t("LOT NO.")}
                  </td>
                  <td className="border-r border-black dark:border-slate-600 p-1">
                    <input
                      type="text"
                      value={row.lotStart ?? row.lotNo ?? ""}
                      onChange={(e) => handleUpdateSpecValue?.("specsCutting", row.id, "lotStart", e.target.value)}
                      className="w-full text-center font-mono font-bold bg-transparent outline-none text-slate-700 dark:text-slate-300"
                      placeholder={t("초물 LOT")}
                    />
                  </td>
                  <td className="border-r border-black dark:border-slate-600 p-1">
                    <input
                      type="text"
                      value={row.lotHalf ?? row.lotNo ?? ""}
                      onChange={(e) => handleUpdateSpecValue?.("specsCutting", row.id, "lotHalf", e.target.value)}
                      className="w-full text-center font-mono font-bold bg-transparent outline-none text-slate-700 dark:text-slate-300"
                      placeholder={t("중물 LOT")}
                    />
                  </td>
                  <td className="border-r border-black dark:border-slate-600 p-1">
                    <input
                      type="text"
                      value={row.lotFinish ?? row.lotNo ?? ""}
                      onChange={(e) => handleUpdateSpecValue?.("specsCutting", row.id, "lotFinish", e.target.value)}
                      className="w-full text-center font-mono font-bold bg-transparent outline-none text-slate-700 dark:text-slate-300"
                      placeholder={t("종물 LOT")}
                    />
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    { canAddRow: true, onAddRow: handleAddCuttingSpecRow, customBadge: "사진 15" }
  );
};

/**
 * 🧱 BLOCK 2 & 3: 단컷팅 치수 (FRT / RR) (사진 2, 3)
 */
export const StepCuttingBlocks = ({
  currentReport = {},
  isWorkerRecordingMode = false,
  handleUpdateSpecValue,
  handleAddStepCuttingRow,
  t = (s) => s,
  renderBlockWrapper
}) => {
  return (
    <>
      {/* Block 2: FRT */}
      {renderBlockWrapper(
        "stepCuttingFrt",
        "[블록 2] 단컷팅 FRT 구간 치수 (49/45mm)",
        <div className="space-y-1.5 border border-black dark:border-slate-600 rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center justify-between pb-1 border-b border-slate-300 dark:border-slate-700">
            <span className="font-black text-xs text-slate-900 dark:text-white">
              🧱 {t("[블록 2] 단컷팅 FRT 구간 치수 (49/45mm)")}
            </span>
            {!isWorkerRecordingMode && (
              <button
                type="button"
                onClick={() => handleAddStepCuttingRow?.("FRT")}
                className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] cursor-pointer"
              >
                {t("+ 행 추가")}
              </button>
            )}
          </div>
          <table className="w-full border-collapse border border-black dark:border-slate-600 text-xs text-center font-bold">
            <thead>
              <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                <th className="border-r border-black dark:border-slate-600 p-1 w-1/4">{t("구분")}</th>
                {(currentReport.stepCuttingFrt || []).map((c) => (
                  <th key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                    {isWorkerRecordingMode ? (
                      <span>{c.section || ""}</span>
                    ) : (
                      <input
                        type="text"
                        value={c.section || ""}
                        onChange={(e) => handleUpdateSpecValue?.("stepCuttingFrt", c.id, "section", e.target.value)}
                        className="w-full text-center font-black bg-transparent outline-none border-b border-dashed border-slate-400 focus:border-indigo-500"
                        title="구분(구간)명 수정"
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black dark:border-slate-600">
                <td className="border-r border-black dark:border-slate-600 p-1 bg-amber-50 dark:bg-amber-950/40 font-bold">{t("SPEC")}</td>
                {(currentReport.stepCuttingFrt || []).map((c) => (
                  <td key={c.id} className="border-r border-black dark:border-slate-600 p-1 text-indigo-600 dark:text-cyan-400 font-black">
                    {isWorkerRecordingMode ? (
                      <span className="font-mono font-black text-indigo-700 dark:text-cyan-300 text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/60 inline-block">
                        🔒 {c.spec}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={c.spec}
                        onChange={(e) => handleUpdateSpecValue?.("stepCuttingFrt", c.id, "spec", e.target.value)}
                        className="w-full text-center bg-transparent outline-none font-black"
                      />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-black dark:border-slate-600">
                <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("초물(Start)")}</td>
                {(currentReport.stepCuttingFrt || []).map((c) => (
                  <td key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                    <input
                      type="text"
                      value={c.startVal || ""}
                      onChange={(e) => handleUpdateSpecValue?.("stepCuttingFrt", c.id, "startVal", e.target.value)}
                      className="w-full text-center bg-transparent outline-none font-mono"
                    />
                  </td>
                ))}
              </tr>
              <tr className="border-b border-black dark:border-slate-600">
                <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("중물(Half)")}</td>
                {(currentReport.stepCuttingFrt || []).map((c) => (
                  <td key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                    <input
                      type="text"
                      value={c.halfVal || ""}
                      onChange={(e) => handleUpdateSpecValue?.("stepCuttingFrt", c.id, "halfVal", e.target.value)}
                      className="w-full text-center bg-transparent outline-none font-mono"
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("종물(Finish)")}</td>
                {(currentReport.stepCuttingFrt || []).map((c) => (
                  <td key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                    <input
                      type="text"
                      value={c.finishVal || ""}
                      onChange={(e) => handleUpdateSpecValue?.("stepCuttingFrt", c.id, "finishVal", e.target.value)}
                      className="w-full text-center bg-transparent outline-none font-mono"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>,
        { canAddRow: true, onAddRow: () => handleAddStepCuttingRow?.("FRT"), customBadge: "사진 2" }
      )}

      {/* Block 3: RR */}
      {renderBlockWrapper(
        "stepCuttingRr",
        "[블록 3] 단컷팅 RR 구간 치수 (40/39mm)",
        <div className="space-y-1.5 border border-black dark:border-slate-600 rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center justify-between pb-1 border-b border-slate-300 dark:border-slate-700">
            <span className="font-black text-xs text-slate-900 dark:text-white">
              🧱 {t("[블록 3] 단컷팅 RR 구간 치수 (40/39mm)")}
            </span>
            {!isWorkerRecordingMode && (
              <button
                type="button"
                onClick={() => handleAddStepCuttingRow?.("RR")}
                className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] cursor-pointer"
              >
                {t("+ 행 추가")}
              </button>
            )}
          </div>
          <table className="w-full border-collapse border border-black dark:border-slate-600 text-xs text-center font-bold">
            <thead>
              <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                <th className="border-r border-black dark:border-slate-600 p-1 w-1/4">{t("구분")}</th>
                {(currentReport.stepCuttingRr || []).map((c) => (
                  <th key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                    {isWorkerRecordingMode ? (
                      <span>{c.section || ""}</span>
                    ) : (
                      <input
                        type="text"
                        value={c.section || ""}
                        onChange={(e) => handleUpdateSpecValue?.("stepCuttingRr", c.id, "section", e.target.value)}
                        className="w-full text-center font-black bg-transparent outline-none border-b border-dashed border-slate-400 focus:border-indigo-500"
                        title="구분(구간)명 수정"
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black dark:border-slate-600">
                <td className="border-r border-black dark:border-slate-600 p-1 bg-amber-50 dark:bg-amber-950/40 font-bold">{t("SPEC")}</td>
                {(currentReport.stepCuttingRr || []).map((c) => (
                  <td key={c.id} className="border-r border-black dark:border-slate-600 p-1 text-indigo-600 dark:text-cyan-400 font-black">
                    {isWorkerRecordingMode ? (
                      <span className="font-mono font-black text-indigo-700 dark:text-cyan-300 text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/60 inline-block">
                        🔒 {c.spec}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={c.spec}
                        onChange={(e) => handleUpdateSpecValue?.("stepCuttingRr", c.id, "spec", e.target.value)}
                        className="w-full text-center bg-transparent outline-none font-black"
                      />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-black dark:border-slate-600">
                <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("초물(Start)")}</td>
                {(currentReport.stepCuttingRr || []).map((c) => (
                  <td key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                    <input
                      type="text"
                      value={c.startVal || ""}
                      onChange={(e) => handleUpdateSpecValue?.("stepCuttingRr", c.id, "startVal", e.target.value)}
                      className="w-full text-center bg-transparent outline-none font-mono"
                    />
                  </td>
                ))}
              </tr>
              <tr className="border-b border-black dark:border-slate-600">
                <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("중물(Half)")}</td>
                {(currentReport.stepCuttingRr || []).map((c) => (
                  <td key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                    <input
                      type="text"
                      value={c.halfVal || ""}
                      onChange={(e) => handleUpdateSpecValue?.("stepCuttingRr", c.id, "halfVal", e.target.value)}
                      className="w-full text-center bg-transparent outline-none font-mono"
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("종물(Finish)")}</td>
                {(currentReport.stepCuttingRr || []).map((c) => (
                  <td key={c.id} className="border-r border-black dark:border-slate-600 p-1">
                    <input
                      type="text"
                      value={c.finishVal || ""}
                      onChange={(e) => handleUpdateSpecValue?.("stepCuttingRr", c.id, "finishVal", e.target.value)}
                      className="w-full text-center bg-transparent outline-none font-mono"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>,
        { canAddRow: true, onAddRow: () => handleAddStepCuttingRow?.("RR"), customBadge: "사진 3" }
      )}
    </>
  );
};
