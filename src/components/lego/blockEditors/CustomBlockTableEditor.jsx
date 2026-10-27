import React from "react";

export const CustomBlockTableEditor = ({
  blockKey,
  draftReport,
  setDraftReport
}) => {
  const tbl = draftReport.customBlockTables?.[blockKey] || {
    columns: ["항목 1", "항목 2", "항목 3"],
    rows: [["", "", ""]]
  };
  const cols = Array.isArray(tbl.columns) && tbl.columns.length > 0 ? tbl.columns : ["항목 1", "항목 2", "항목 3"];
  const rows = Array.isArray(tbl.rows) && tbl.rows.length > 0 ? tbl.rows : [cols.map(() => "")];

  const updateCustomTbl = (nextCols, nextRows) => {
    setDraftReport({
      ...draftReport,
      customBlockTables: {
        ...(draftReport.customBlockTables || {}),
        [blockKey]: {
          columns: nextCols,
          rows: nextRows
        }
      }
    });
  };

  return (
    <div className="space-y-3 bg-slate-950/90 p-4 rounded-2xl border border-slate-700">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="font-black text-sm text-cyan-300">커스텀 블록 열(Column) 및 행(Row) 편집</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => updateCustomTbl([...cols, `항목 ${cols.length + 1}`], rows.map((r) => [...r, ""]))}
            className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
          >
            + 열 추가
          </button>
          <button
            type="button"
            onClick={() => updateCustomTbl(cols, [...rows, cols.map((_, i) => (i === 0 ? `구간 ${rows.length + 1}` : ""))])}
            className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
          >
            + 행 추가
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-700 text-xs text-center">
          <thead>
            <tr className="bg-slate-800">
              {cols.map((col, cIdx) => (
                <th key={cIdx} className="border border-slate-700 p-1.5">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={col}
                      onChange={(e) => {
                        const nextCols = cols.map((c, i) => (i === cIdx ? e.target.value : c));
                        updateCustomTbl(nextCols, rows);
                      }}
                      className="w-full px-1.5 py-1 rounded text-center font-black"
                    />
                    {cols.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateCustomTbl(
                            cols.filter((_, i) => i !== cIdx),
                            rows.map((r) => r.filter((_, i) => i !== cIdx))
                          )
                        }
                        className="text-rose-400 hover:text-rose-300 font-black px-1 cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="border border-slate-700 p-1 w-10">삭제</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {cols.map((_, cIdx) => (
                  <td key={cIdx} className="border border-slate-700 p-1">
                    <input
                      type="text"
                      value={row?.[cIdx] ?? ""}
                      onChange={(e) => {
                        const nextRows = rows.map((r, ri) =>
                          ri === rIdx ? r.map((cell, ci) => (ci === cIdx ? e.target.value : cell)) : r
                        );
                        updateCustomTbl(cols, nextRows);
                      }}
                      className="w-full px-1.5 py-1 rounded text-center font-bold"
                    />
                  </td>
                ))}
                <td className="border border-slate-700 p-1">
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => updateCustomTbl(cols, rows.filter((_, i) => i !== rIdx))}
                      className="text-rose-400 hover:text-rose-300 font-black px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
