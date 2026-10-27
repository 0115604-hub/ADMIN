import React from "react";

/**
 * 🧱 BLOCK 10: 불량소재구분 8열 매트릭스 (사진 10)
 */
export const DefectMaterialMatrixBlock = ({
  currentReport = {},
  isWorkerRecordingMode = false,
  handleUpdateField,
  handleUpdateSpecValue,
  t = (s) => s,
  renderBlockWrapper
}) => {
  return renderBlockWrapper(
    "defectMaterialMatrix",
    "[블록 10] 불량소재구분 8열 매트릭스",
    <div className="space-y-1.5">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
          <span>🧱 {t("[블록 10] 불량소재구분 (8열 매트릭스: 압출불량 & 공정간불량) (사진 10 대조)")}</span>
        </span>
      </div>
      <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
        <table className="w-full border-collapse text-xs text-center font-bold">
          <thead>
            <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
              <th rowSpan={2} colSpan={2} className="border-r border-black dark:border-slate-600 p-1 w-[20%]">
                {t("구 분(Division)")}
              </th>
              <th colSpan={4} className="border-r border-black dark:border-slate-600 p-1">FRT</th>
              <th colSpan={4} className="p-1">RR</th>
            </tr>
            <tr className="bg-amber-50 dark:bg-amber-950/50 border-b border-black dark:border-slate-600 text-[10px]">
              <th className="border-r border-black dark:border-slate-600 p-0.5">LH A</th>
              <th className="border-r border-black dark:border-slate-600 p-0.5">RH A</th>
              <th className="border-r border-black dark:border-slate-600 p-0.5">LH B</th>
              <th className="border-r border-black dark:border-slate-600 p-0.5">RH B</th>
              <th className="border-r border-black dark:border-slate-600 p-0.5">LH A</th>
              <th className="border-r border-black dark:border-slate-600 p-0.5">RH A</th>
              <th className="border-r border-black dark:border-slate-600 p-0.5">LH B</th>
              <th className="p-0.5">RH B</th>
            </tr>
          </thead>
          <tbody>
            {(currentReport.defectMaterialMatrix || []).map((row, idx) => (
              <tr key={row.id || idx} className="border-b border-black dark:border-slate-600">
                {idx === 0 && (
                  <td rowSpan={4} className="border-r border-black dark:border-slate-600 bg-amber-50 dark:bg-amber-950/30 p-1 font-black w-20">
                    {isWorkerRecordingMode ? (
                      <span className="w-full text-center font-black text-xs block">
                        {t(currentReport.defectMatCat1Label ?? "압출소재불량")}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={t(currentReport.defectMatCat1Label ?? "압출소재불량")}
                        onChange={(e) => handleUpdateField?.("defectMatCat1Label", e.target.value)}
                        className="w-full text-center font-black text-xs bg-transparent outline-none border-b border-dashed border-slate-400 focus:border-indigo-500"
                        title="구분 분류명 수정"
                      />
                    )}
                  </td>
                )}
                {idx === 4 && (
                  <td rowSpan={2} className="border-r border-black dark:border-slate-600 bg-amber-50 dark:bg-amber-950/30 p-1 font-black w-20">
                    {isWorkerRecordingMode ? (
                      <span className="w-full text-center font-black text-xs block">
                        {t(currentReport.defectMatCat2Label ?? "공정간불량")}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={t(currentReport.defectMatCat2Label ?? "공정간불량")}
                        onChange={(e) => handleUpdateField?.("defectMatCat2Label", e.target.value)}
                        className="w-full text-center font-black text-xs bg-transparent outline-none border-b border-dashed border-slate-400 focus:border-indigo-500"
                        title="구분 분류명 수정"
                      />
                    )}
                  </td>
                )}
                <td className="border-r border-black dark:border-slate-600 p-1 text-left px-1 font-bold bg-slate-50 dark:bg-slate-800">
                  {isWorkerRecordingMode ? (
                    <span className="font-bold text-xs block px-1">{t(row.name || "")}</span>
                  ) : (
                    <input
                      type="text"
                      value={t(row.name || "")}
                      onChange={(e) => handleUpdateSpecValue?.("defectMaterialMatrix", row.id, "name", e.target.value)}
                      className="w-full font-bold bg-transparent outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500 px-1"
                      title="구분(불량 항목)명 수정"
                    />
                  )}
                </td>
                <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">
                  <input
                    type="number"
                    value={row.frtLhA || 0}
                    onChange={(e) => handleUpdateSpecValue?.("defectMaterialMatrix", row.id, "frtLhA", Number(e.target.value))}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
                <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">
                  <input
                    type="number"
                    value={row.frtRhA || 0}
                    onChange={(e) => handleUpdateSpecValue?.("defectMaterialMatrix", row.id, "frtRhA", Number(e.target.value))}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
                <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">
                  <input
                    type="number"
                    value={row.frtLhB || 0}
                    onChange={(e) => handleUpdateSpecValue?.("defectMaterialMatrix", row.id, "frtLhB", Number(e.target.value))}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
                <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">
                  <input
                    type="number"
                    value={row.frtRhB || 0}
                    onChange={(e) => handleUpdateSpecValue?.("defectMaterialMatrix", row.id, "frtRhB", Number(e.target.value))}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
                <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">
                  <input
                    type="number"
                    value={row.rrLhA || 0}
                    onChange={(e) => handleUpdateSpecValue?.("defectMaterialMatrix", row.id, "rrLhA", Number(e.target.value))}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
                <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">
                  <input
                    type="number"
                    value={row.rrRhA || 0}
                    onChange={(e) => handleUpdateSpecValue?.("defectMaterialMatrix", row.id, "rrRhA", Number(e.target.value))}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
                <td className="border-r border-black dark:border-slate-600 p-0.5 font-mono">
                  <input
                    type="number"
                    value={row.rrLhB || 0}
                    onChange={(e) => handleUpdateSpecValue?.("defectMaterialMatrix", row.id, "rrLhB", Number(e.target.value))}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
                <td className="p-0.5 font-mono">
                  <input
                    type="number"
                    value={row.rrRhB || 0}
                    onChange={(e) => handleUpdateSpecValue?.("defectMaterialMatrix", row.id, "rrRhB", Number(e.target.value))}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    { customBadge: "사진 10" }
  );
};

/**
 * 🧱 BLOCK 16: 불량소재구분 (Section A / B / C 3단면) (사진 16)
 */
export const DefectSectionAbcBlock = ({
  currentReport = {},
  isWorkerRecordingMode = false,
  handleUpdateSpecValue,
  handleAddDefectSectionAbcRow,
  t = (s) => s,
  renderBlockWrapper
}) => {
  return renderBlockWrapper(
    "defectSectionAbc",
    "[블록 16] 불량소재구분 (Section A / B / C 3단면)",
    <div className="space-y-1.5 border border-black dark:border-slate-600 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-950/40">
      <div className="flex items-center justify-between pb-1 border-b border-slate-300 dark:border-slate-700">
        <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
          <span>🧱 {t("[블록 16] 불량소재구분 (Section A / B / C 3단면) (사진 16 대조)")}</span>
        </span>
        {!isWorkerRecordingMode && (
          <button
            type="button"
            onClick={handleAddDefectSectionAbcRow}
            className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] cursor-pointer"
          >
            {t("+ 항목 추가")}
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-black dark:border-slate-600 text-xs text-center font-bold">
          <thead>
            <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
              <th className="border-r border-black dark:border-slate-600 p-1 w-1/2">{t("구 분 (Division)")}</th>
              <th className="border-r border-black dark:border-slate-600 p-1">Section A</th>
              <th className="border-r border-black dark:border-slate-600 p-1">Section B</th>
              <th className="p-1">Section C</th>
            </tr>
          </thead>
          <tbody>
            {(currentReport.defectSectionAbc || []).map((row) => (
              <tr key={row.id} className="border-b border-black dark:border-slate-600">
                <td className="border-r border-black dark:border-slate-600 p-1 text-left px-1 font-bold bg-slate-50 dark:bg-slate-800">
                  {isWorkerRecordingMode ? (
                    <span className="font-bold text-xs block px-1">{t(row.name || "")}</span>
                  ) : (
                    <input
                      type="text"
                      value={t(row.name || "")}
                      onChange={(e) => handleUpdateSpecValue?.("defectSectionAbc", row.id, "name", e.target.value)}
                      className="w-full font-bold bg-transparent outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500 px-1"
                      title="구분(불량 항목)명 수정"
                    />
                  )}
                </td>
                <td className="border-r border-black dark:border-slate-600 p-1">
                  <input
                    type="number"
                    value={row.secA || 0}
                    onChange={(e) => handleUpdateSpecValue?.("defectSectionAbc", row.id, "secA", Number(e.target.value))}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
                <td className="border-r border-black dark:border-slate-600 p-1">
                  <input
                    type="number"
                    value={row.secB || 0}
                    onChange={(e) => handleUpdateSpecValue?.("defectSectionAbc", row.id, "secB", Number(e.target.value))}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="number"
                    value={row.secC || 0}
                    onChange={(e) => handleUpdateSpecValue?.("defectSectionAbc", row.id, "secC", Number(e.target.value))}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    { canAddRow: true, onAddRow: handleAddDefectSectionAbcRow, customBadge: "사진 16" }
  );
};
