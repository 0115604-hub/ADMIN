import React from "react";
import { Plus } from "lucide-react";

/**
 * 🧱 BLOCK 1: 조인트 작업자 / 시간 / 생산수량 (사진 1)
 */
export const TimeAndOutputBlock = ({
  currentReport = {},
  setCurrentReport,
  isWorkerRecordingMode = false,
  t = (s) => s,
  renderBlockWrapper
}) => {
  return renderBlockWrapper(
    "timeAndOutput",
    "[블록 1] 조인트 작업자 / 시간 / 생산수량",
    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
        🧱 {t("[블록 1] 조인트 작업자 / 시간 / 생산수량")}
      </span>
      <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
        <table className="w-full border-collapse text-xs text-center font-bold">
          <thead>
            <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
              <th className="border-r border-black dark:border-slate-600 p-1.5">{t("구 분")}</th>
              <th className="border-r border-black dark:border-slate-600 p-1.5">{t("작업자")}</th>
              <th className="border-r border-black dark:border-slate-600 p-1.5">{t("작업시간")}</th>
              <th className="border-r border-black dark:border-slate-600 p-1.5">{t("정품수량")}</th>
              <th className="border-r border-black dark:border-slate-600 p-1.5">{t("불량수량")}</th>
              <th className="p-1.5">{t("재조인트")}</th>
            </tr>
          </thead>
          <tbody>
            {(currentReport.jointDivisions || ["FRT LH", "FRT RH", "RR LH", "RR RH"]).map((div, dIdx) => (
              <tr key={dIdx} className="border-b border-black dark:border-slate-600">
                <td className="border-r border-black dark:border-slate-600 p-1 bg-slate-50 dark:bg-slate-800 font-black">
                  {isWorkerRecordingMode ? (
                    <span className="w-full text-center font-black block">{div || ""}</span>
                  ) : (
                    <input
                      type="text"
                      value={div || ""}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        const list = [...(currentReport.jointDivisions || ["FRT LH", "FRT RH", "RR LH", "RR RH"])];
                        list[dIdx] = nextVal;
                        setCurrentReport?.((prev) => ({ ...prev, jointDivisions: list }));
                      }}
                      className="w-full text-center font-black bg-transparent outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500"
                      title="구분명 수정 (클릭하여 직접 변경)"
                    />
                  )}
                </td>
                <td className="border-r border-black dark:border-slate-600 p-1">{currentReport.workerName || t("작업자")}</td>
                <td className="border-r border-black dark:border-slate-600 p-1 font-mono">{currentReport.startTime} ~ {currentReport.finishTime}</td>
                <td className="border-r border-black dark:border-slate-600 p-1 font-mono text-emerald-600 font-black">350</td>
                <td className="border-r border-black dark:border-slate-600 p-1 font-mono text-rose-600">1</td>
                <td className="p-1 font-mono text-amber-600">1</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    { customBadge: "사진 1" }
  );
};

/**
 * 🧱 BLOCK 4: 조인트 재료 (사진 4)
 */
export const JointMaterialBlock = ({
  currentReport = {},
  setCurrentReport,
  isWorkerRecordingMode = false,
  t = (s) => s,
  renderBlockWrapper
}) => {
  return renderBlockWrapper(
    "jointMaterial",
    "[블록 4] 3. 조인트 재료 (Joint Material)",
    <div className="space-y-2 p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800">
          <span className="text-[10px] text-slate-400 block font-bold">{t("조인트 재료명 (Joint grade name) - 사진 4")}</span>
          {isWorkerRecordingMode ? (
            <span className="font-black text-xs sm:text-sm text-purple-700 dark:text-purple-300 block py-1">
              🔒 {currentReport.jointMaterial?.gradeName || "SJ-4004B (EPDM)"}
            </span>
          ) : (
            <input
              type="text"
              value={currentReport.jointMaterial?.gradeName || ""}
              onChange={(e) => setCurrentReport?.((prev) => ({
                ...prev,
                jointMaterial: { ...prev.jointMaterial, gradeName: e.target.value }
              }))}
              className="font-black text-xs sm:text-sm w-full bg-transparent outline-none text-purple-700 dark:text-purple-300"
            />
          )}
        </div>
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800">
          <span className="text-[10px] text-slate-400 block font-bold">{t("조인트 재료일자 (Joint material lot no)")}</span>
          <input
            type="text"
            value={currentReport.jointMaterial?.lotNo || ""}
            onChange={(e) => setCurrentReport?.((prev) => ({
              ...prev,
              jointMaterial: { ...prev.jointMaterial, lotNo: e.target.value }
            }))}
            className="font-black text-xs sm:text-sm w-full bg-transparent outline-none font-mono"
          />
        </div>
      </div>
    </div>,
    { customBadge: "사진 4" }
  );
};

/**
 * 🧱 BLOCK 5 & 6: 사출 온도 및 조건 테이블 (사진 5, 6)
 */
export const InjectionTempConditionBlocks = ({
  currentReport = {},
  t = (s) => s,
  renderBlockWrapper
}) => {
  return (
    <>
      {/* Block 5: 사출온도 */}
      {renderBlockWrapper(
        "injectionTemp",
        "[블록 5] 4. 사출온도 (Temperature)",
        <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
          <table className="w-full border-collapse text-xs text-center font-bold">
            <thead>
              <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                <th colSpan={2} className="border-r border-black dark:border-slate-600 p-1 w-1/4">{t("구 분")}</th>
                <th className="border-r border-black dark:border-slate-600 p-1">{t("노즐(Nozzle)")}</th>
                <th className="border-r border-black dark:border-slate-600 p-1">{t("실린더 1(N2)")}</th>
                <th className="border-r border-black dark:border-slate-600 p-1">{t("실린더 2(H3)")}</th>
                <th className="p-1">{t("실린더 3(H4)")}</th>
              </tr>
            </thead>
            <tbody>
              {(currentReport.injectionTemps || []).map((tItem, idx) => (
                <tr key={tItem.id || idx} className="border-b border-black dark:border-slate-600">
                  {idx === 0 && (
                    <td rowSpan={3} className="border-r border-black dark:border-slate-600 bg-amber-50 dark:bg-amber-950/30 p-1 font-black w-14">
                      Sett'g
                    </td>
                  )}
                  {idx === 3 && (
                    <td rowSpan={3} className="border-r border-black dark:border-slate-600 bg-amber-50 dark:bg-amber-950/30 p-1 font-black w-14">
                      Actual
                    </td>
                  )}
                  <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{tItem.machine}</td>
                  <td className="border-r border-black dark:border-slate-600 p-1 font-mono">{tItem.nozzle}</td>
                  <td className="border-r border-black dark:border-slate-600 p-1 font-mono">{tItem.cyl1}</td>
                  <td className="border-r border-black dark:border-slate-600 p-1 font-mono">{tItem.cyl2}</td>
                  <td className="p-1 font-mono">{tItem.cyl3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
        { customBadge: "사진 5" }
      )}

      {/* Block 6: 사출조건 */}
      {renderBlockWrapper(
        "injectionCondition",
        "[블록 6] 5. 사출조건 (Injection Condition)",
        <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
          <table className="w-full border-collapse text-xs text-center font-bold">
            <thead>
              <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                <th className="border-r border-black dark:border-slate-600 p-1 w-1/4">{t("구 분 (항목)")}</th>
                <th className="border-r border-black dark:border-slate-600 p-1 w-1/4">{t("SPEC")}</th>
                <th className="border-r border-black dark:border-slate-600 p-1">{t("초물 (Start)")}</th>
                <th className="border-r border-black dark:border-slate-600 p-1">{t("중물 (Half)")}</th>
                <th className="p-1">{t("종물 (Finish)")}</th>
              </tr>
            </thead>
            <tbody>
              {(currentReport.injectionConditions || []).map((c) => (
                <tr key={c.id} className="border-b border-black dark:border-slate-600">
                  <td className="border-r border-black dark:border-slate-600 p-1 font-bold bg-slate-50 dark:bg-slate-800">{t(c.name)}</td>
                  <td className="border-r border-black dark:border-slate-600 p-1 text-purple-700 dark:text-purple-300 font-black">
                    <span className="font-mono font-black text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 inline-block">
                      🔒 {c.spec}
                    </span>
                  </td>
                  <td className="border-r border-black dark:border-slate-600 p-1 font-mono">{c.startVal}</td>
                  <td className="border-r border-black dark:border-slate-600 p-1 font-mono">{c.halfVal}</td>
                  <td className="p-1 font-mono">{c.finishVal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
        { customBadge: "사진 6" }
      )}
    </>
  );
};

/**
 * 🧱 BLOCK 7: 공정불량 종합 매트릭스 (사진 7)
 */
export const JointDefectMatrixBlock = ({
  currentReport = {},
  setCurrentReport,
  isWorkerRecordingMode = false,
  handleAddJointDefectRow,
  t = (s) => s,
  renderBlockWrapper
}) => {
  return renderBlockWrapper(
    "jointDefectMatrix",
    "[블록 7] 6. 공정불량 종합 매트릭스",
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
          <span>🧱 {t("[블록 7] 6. 공정불량 종합 매트릭스")}</span>
        </span>
        {!isWorkerRecordingMode && (
          <button
            type="button"
            onClick={handleAddJointDefectRow}
            className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("+ 불량 항목 추가")}</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
        <table className="w-full border-collapse text-xs text-center font-bold">
          <thead>
            <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
              <th rowSpan={3} className="border-r border-black dark:border-slate-600 p-1.5 w-[20%]">{t("구 분(Division)")}</th>
              <th colSpan={5} className="border-r border-black dark:border-slate-600 p-1">{t("폐기불량(Disposal) - 조인트작업시")}</th>
              <th colSpan={2} className="border-r border-black dark:border-slate-600 p-1">{t("재조인트수량(Rework)")}</th>
              <th colSpan={2} className="p-1">{t("공정간불량(재조인트 불량포함)")}</th>
            </tr>
            <tr className="bg-amber-50 dark:bg-amber-950/50 border-b border-black dark:border-slate-600 text-[10px]">
              <th colSpan={3} className="border-r border-black dark:border-slate-600 p-0.5">FRT LH/RH</th>
              <th colSpan={2} className="border-r border-black dark:border-slate-600 p-0.5">RR LH/RH</th>
              <th colSpan={2} className="border-r border-black dark:border-slate-600 p-0.5">(EA)</th>
              <th colSpan={2} className="p-0.5">(Process Bad)</th>
            </tr>
            <tr className="bg-white dark:bg-slate-900 border-b border-black dark:border-slate-600 text-[10px]">
              <th className="border-r border-black dark:border-slate-600 p-0.5">A</th>
              <th className="border-r border-black dark:border-slate-600 p-0.5">B</th>
              <th className="border-r border-black dark:border-slate-600 p-0.5">C</th>
              <th className="border-r border-black dark:border-slate-600 p-0.5">A</th>
              <th className="border-r border-black dark:border-slate-600 p-0.5">B</th>
              <th className="border-r border-black dark:border-slate-600 p-0.5">FRT</th>
              <th className="border-r border-black dark:border-slate-600 p-0.5">RR</th>
              <th className="border-r border-black dark:border-slate-600 p-0.5">FRT</th>
              <th className="p-0.5">RR</th>
            </tr>
          </thead>
          <tbody>
            {(currentReport.jointDefects || []).map((row, idx) => (
              <tr key={idx} className="border-b border-black dark:border-slate-600">
                <td className="border-r border-black dark:border-slate-600 p-1 text-left px-1 font-bold bg-slate-50 dark:bg-slate-800">
                  {isWorkerRecordingMode ? (
                    <span className="font-bold text-xs block px-1">{t(row.name || "")}</span>
                  ) : (
                    <input
                      type="text"
                      value={t(row.name || "")}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        setCurrentReport?.((prev) => ({
                          ...prev,
                          jointDefects: (prev.jointDefects || []).map((r, i) =>
                            i === idx ? { ...r, name: nextVal } : r
                          )
                        }));
                      }}
                      className="w-full font-bold bg-transparent outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500 px-1"
                      title="구분(공정불량 항목)명 수정"
                    />
                  )}
                </td>
                <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">{row.frtA || ""}</td>
                <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">{row.frtB || ""}</td>
                <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">{row.frtC || ""}</td>
                <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">{row.rrA || ""}</td>
                <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">{row.rrB || ""}</td>
                <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">{row.reworkFrt || ""}</td>
                <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">{row.reworkRr || ""}</td>
                <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">{row.processFrt || ""}</td>
                <td className="p-0.5 font-mono">{row.processRr || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    { canAddRow: true, onAddRow: handleAddJointDefectRow, customBadge: "사진 7" }
  );
};
