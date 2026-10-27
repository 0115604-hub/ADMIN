import React from "react";

export const LegoCustomPhotoBlocks = ({
  combinedSwitchCatalog = [],
  currentReport = {},
  setCurrentReport,
  isWorkerRecordingMode = false,
  draggedCustomCol,
  setDraggedCustomCol,
  dragOverCustomCol,
  setDragOverCustomCol,
  showToast,
  renderBlockWrapper
}) => {
  return (
    <>
      {combinedSwitchCatalog
        .filter((item) => item.isCustom && item.customData)
        .map((item, cbIdx) => {
          const cb = item.customData;
          const bKey = cb.key || cb.id;
          const cols =
            Array.isArray(currentReport.customBlockTables?.[bKey]?.columns) &&
            currentReport.customBlockTables[bKey].columns.length > 0
              ? currentReport.customBlockTables[bKey].columns
              : Array.isArray(cb.columns) && cb.columns.length > 0
              ? cb.columns
              : ["항목 1", "항목 2", "항목 3"];
          const rowsData = Array.isArray(currentReport.customBlockTables?.[bKey]?.rows)
            ? currentReport.customBlockTables[bKey].rows
            : Array.isArray(cb.rows)
            ? cb.rows
            : [["", "", ""]];

          const handleMoveCustomColumn = (fromIdx, toIdx) => {
            if (fromIdx === null || toIdx === null || fromIdx === toIdx) return;
            if (toIdx < 0 || toIdx >= cols.length) return;
            const nextCols = [...cols];
            const [movedCol] = nextCols.splice(fromIdx, 1);
            nextCols.splice(toIdx, 0, movedCol);

            const nextRows = rowsData.map((r) => {
              const nextRow = [...r];
              const [movedCell] = nextRow.splice(fromIdx, 1);
              nextRow.splice(toIdx, 0, movedCell);
              return nextRow;
            });

            setCurrentReport?.((prev) => ({
              ...prev,
              customBlockTables: {
                ...(prev.customBlockTables || {}),
                [bKey]: {
                  columns: nextCols,
                  rows: nextRows
                }
              }
            }));
            showToast?.(`↔️ [${movedCol}] 열이 ${toIdx + 1}번째 순서로 변경되었습니다.`);
          };

          const handleUpdateCustomCell = (rIdx, cIdx, val) => {
            const nextRows = rowsData.map((r, rI) =>
              rI === rIdx ? r.map((c, cI) => (cI === cIdx ? val : c)) : [...r]
            );
            setCurrentReport?.((prev) => ({
              ...prev,
              customBlockTables: {
                ...(prev.customBlockTables || {}),
                [bKey]: {
                  columns: cols,
                  rows: nextRows
                }
              }
            }));
          };

          const handleAddCustomRow = () => {
            const emptyRow = cols.map((_, idx) => (idx === 0 ? `구간 ${rowsData.length + 1}` : ""));
            const nextRows = [...rowsData, emptyRow];
            setCurrentReport?.((prev) => ({
              ...prev,
              customBlockTables: {
                ...(prev.customBlockTables || {}),
                [bKey]: {
                  columns: cols,
                  rows: nextRows
                }
              }
            }));
            showToast?.(`➕ [${cb.title || cb.label}] 블록에 새 행이 추가되었습니다.`);
          };

          const handleDeleteCustomRow = (rIdx) => {
            if (rowsData.length <= 1) return;
            const nextRows = rowsData.filter((_, i) => i !== rIdx);
            setCurrentReport?.((prev) => ({
              ...prev,
              customBlockTables: {
                ...(prev.customBlockTables || {}),
                [bKey]: {
                  columns: cols,
                  rows: nextRows
                }
              }
            }));
          };

          return (
            <React.Fragment key={bKey}>
              {renderBlockWrapper(
                bKey,
                cb.title || `[블록 ${18 + cbIdx}] ${cb.label}`,
                <div className="space-y-2 border border-black dark:border-slate-600 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-black dark:border-slate-600 text-xs text-center font-bold">
                      <thead>
                        <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                          {cols.map((colName, cIdx) => {
                            const isColDragged =
                              draggedCustomCol?.bKey === bKey && draggedCustomCol?.colIdx === cIdx;
                            const isColDragOver =
                              dragOverCustomCol?.bKey === bKey &&
                              dragOverCustomCol?.colIdx === cIdx &&
                              draggedCustomCol?.colIdx !== cIdx;
                            return (
                              <th
                                key={cIdx}
                                draggable={!isWorkerRecordingMode}
                                onDragStart={(e) => {
                                  if (isWorkerRecordingMode) return;
                                  e.stopPropagation();
                                  setDraggedCustomCol?.({ bKey, colIdx: cIdx });
                                  e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragOver={(e) => {
                                  if (isWorkerRecordingMode) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.dataTransfer.dropEffect = "move";
                                  if (
                                    dragOverCustomCol?.bKey !== bKey ||
                                    dragOverCustomCol?.colIdx !== cIdx
                                  ) {
                                    setDragOverCustomCol?.({ bKey, colIdx: cIdx });
                                  }
                                }}
                                onDragLeave={(e) => {
                                  if (isWorkerRecordingMode) return;
                                  e.stopPropagation();
                                  if (
                                    dragOverCustomCol?.bKey === bKey &&
                                    dragOverCustomCol?.colIdx === cIdx
                                  ) {
                                    setDragOverCustomCol?.(null);
                                  }
                                }}
                                onDrop={(e) => {
                                  if (isWorkerRecordingMode) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (draggedCustomCol?.bKey === bKey) {
                                    handleMoveCustomColumn(draggedCustomCol.colIdx, cIdx);
                                  }
                                  setDraggedCustomCol?.(null);
                                  setDragOverCustomCol?.(null);
                                }}
                                onDragEnd={(e) => {
                                  if (isWorkerRecordingMode) return;
                                  e.stopPropagation();
                                  setDraggedCustomCol?.(null);
                                  setDragOverCustomCol?.(null);
                                }}
                                className={`border-r border-black dark:border-slate-600 p-1.5 select-none transition-all ${
                                  !isWorkerRecordingMode ? "cursor-grab active:cursor-grabbing" : ""
                                } ${isColDragged ? "opacity-40 scale-95 " : ""}${
                                  isColDragOver ? "border-l-4 border-l-indigo-500 bg-indigo-500/20 " : ""
                                }`}
                                title={
                                  !isWorkerRecordingMode
                                    ? "마우스로 잡고 좌우로 드래그하여 열 순서를 변경할 수 있습니다"
                                    : undefined
                                }
                              >
                                {isWorkerRecordingMode ? (
                                  <span className="text-center font-bold block">{colName || ""}</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 w-full justify-center">
                                    <span className="text-[10px] text-amber-700 dark:text-amber-300 print:hidden">
                                      ⠿
                                    </span>
                                    <input
                                      type="text"
                                      value={colName || ""}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        const nextCols = [...cols];
                                        nextCols[cIdx] = e.target.value;
                                        setCurrentReport?.((prev) => ({
                                          ...prev,
                                          customBlockTables: {
                                            ...(prev.customBlockTables || {}),
                                            [bKey]: {
                                              columns: nextCols,
                                              rows: rowsData
                                            }
                                          }
                                        }));
                                      }}
                                      className="text-center font-bold bg-transparent outline-none border-b border-dashed border-slate-400 focus:border-indigo-500 max-w-[120px]"
                                      title="열(구분) 명칭 수정"
                                    />
                                  </span>
                                )}
                              </th>
                            );
                          })}
                          {!isWorkerRecordingMode && <th className="p-1 w-10 print:hidden">삭제</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {rowsData.map((rowArr, rIdx) => (
                          <tr key={rIdx} className="border-b border-black dark:border-slate-600">
                            {cols.map((_, cIdx) => (
                              <td
                                key={cIdx}
                                className={`border-r border-black dark:border-slate-600 p-1 ${
                                  cIdx === 0 ? "bg-slate-50 dark:bg-slate-800 font-black" : ""
                                }`}
                              >
                                {isWorkerRecordingMode && cIdx === 0 ? (
                                  <span className="w-full text-center block font-black">
                                    {rowArr?.[0] ?? ""}
                                  </span>
                                ) : (
                                  <input
                                    type="text"
                                    value={rowArr?.[cIdx] ?? ""}
                                    onChange={(e) => handleUpdateCustomCell(rIdx, cIdx, e.target.value)}
                                    className="w-full text-center bg-transparent outline-none font-bold"
                                  />
                                )}
                              </td>
                            ))}
                            {!isWorkerRecordingMode && (
                              <td className="p-1 print:hidden">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomRow(rIdx)}
                                  className="text-rose-500 hover:text-rose-700 text-xs font-black px-1 cursor-pointer"
                                  title="행 삭제"
                                >
                                  ✕
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>,
                {
                  canAddRow: !isWorkerRecordingMode,
                  onAddRow: handleAddCustomRow,
                  customBadge: cb.badge || `사진 ${18 + cbIdx} (AI분석)`
                }
              )}
            </React.Fragment>
          );
        })}
    </>
  );
};
export default LegoCustomPhotoBlocks;
