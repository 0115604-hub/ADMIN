import React from "react";
import { Plus, Trash2 } from "lucide-react";

export const JointProcessBlockEditor = ({
  blockKey,
  draftReport,
  setDraftReport
}) => {
  // 8. JOINT MATERIAL (BLOCK 4)
  if (blockKey === "jointMaterial") {
    return (
      <div className="space-y-4 bg-slate-950/90 p-4 rounded-2xl border border-slate-700">
        <div>
          <label className="text-xs font-black text-cyan-300 block mb-1">
            조인트 재료명 (Joint grade name)
          </label>
          <input
            type="text"
            value={draftReport.jointMaterial?.gradeName || ""}
            onChange={(e) => setDraftReport({
              ...draftReport,
              jointMaterial: { ...draftReport.jointMaterial, gradeName: e.target.value }
            })}
            className="w-full px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-white font-bold"
            placeholder="예: SJ-4004B (EPDM)"
          />
        </div>
        <div>
          <label className="text-xs font-black text-cyan-300 block mb-1">
            조인트 재료일자 및 LOT (Joint material lot no)
          </label>
          <input
            type="text"
            value={draftReport.jointMaterial?.lotNo || ""}
            onChange={(e) => setDraftReport({
              ...draftReport,
              jointMaterial: { ...draftReport.jointMaterial, lotNo: e.target.value }
            })}
            className="w-full px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-white font-mono font-bold"
            placeholder="예: 2026.10.15-M02"
          />
        </div>
      </div>
    );
  }

  // 9. INJECTION TEMP (BLOCK 5)
  if (blockKey === "injectionTemp") {
    return (
      <div className="space-y-3">
        <span className="font-black text-sm text-cyan-300 block">
          사출 온도 기준 행 관리 (Sett'g / Actual x 호기별 노즐/실린더 온도)
        </span>

        <div className="overflow-x-auto border border-slate-700 rounded-2xl bg-slate-950/80">
          <table className="w-full text-center border-collapse">
            <thead className="bg-slate-800 text-cyan-300 text-[11px] font-black">
              <tr className="border-b border-slate-700">
                <th className="p-2.5">구분</th>
                <th className="p-2.5">라인 / 설비명</th>
                <th className="p-2.5">노즐 (Nozzle)</th>
                <th className="p-2.5">실린더 1 (N2)</th>
                <th className="p-2.5">실린더 2 (H3)</th>
                <th className="p-2.5">실린더 3 (H4)</th>
              </tr>
            </thead>
            <tbody>
              {(draftReport.injectionTemps || []).map((t, idx) => (
                <tr key={t.id || idx} className="border-b border-slate-800">
                  <td className="p-1.5 font-black text-[11px] bg-slate-900 text-amber-300">{t.lineType}</td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={t.machine || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.injectionTemps.map((r, i) => i === idx ? { ...r, machine: val } : r);
                        setDraftReport({ ...draftReport, injectionTemps: updated });
                      }}
                      className="w-24 px-2 py-1 rounded border text-center font-bold text-xs"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={t.nozzle || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.injectionTemps.map((r, i) => i === idx ? { ...r, nozzle: val } : r);
                        setDraftReport({ ...draftReport, injectionTemps: updated });
                      }}
                      className="w-16 px-1 py-1 rounded border text-center font-mono text-xs"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={t.cyl1 || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.injectionTemps.map((r, i) => i === idx ? { ...r, cyl1: val } : r);
                        setDraftReport({ ...draftReport, injectionTemps: updated });
                      }}
                      className="w-16 px-1 py-1 rounded border text-center font-mono text-xs"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={t.cyl2 || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.injectionTemps.map((r, i) => i === idx ? { ...r, cyl2: val } : r);
                        setDraftReport({ ...draftReport, injectionTemps: updated });
                      }}
                      className="w-16 px-1 py-1 rounded border text-center font-mono text-xs"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={t.cyl3 || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.injectionTemps.map((r, i) => i === idx ? { ...r, cyl3: val } : r);
                        setDraftReport({ ...draftReport, injectionTemps: updated });
                      }}
                      className="w-16 px-1 py-1 rounded border text-center font-mono text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 10. INJECTION CONDITION (BLOCK 6)
  if (blockKey === "injectionCondition") {
    return (
      <div className="space-y-3">
        <span className="font-black text-sm text-cyan-300 block">
          사출 조건 항목 및 기준 SPEC 관리 (거리/속도/압력/시간)
        </span>

        <div className="space-y-2">
          {(draftReport.injectionConditions || []).map((c, idx) => (
            <div key={c.id || idx} className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-950/90 items-center">
              <div>
                <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">조건 명칭</label>
                <input
                  type="text"
                  value={c.name || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = draftReport.injectionConditions.map((r, i) => i === idx ? { ...r, name: val } : r);
                    setDraftReport({ ...draftReport, injectionConditions: updated });
                  }}
                  className="w-full px-2 py-1 rounded border font-bold"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">SPEC 기준</label>
                <input
                  type="text"
                  value={c.spec || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = draftReport.injectionConditions.map((r, i) => i === idx ? { ...r, spec: val } : r);
                    setDraftReport({ ...draftReport, injectionConditions: updated });
                  }}
                  className="w-full px-2 py-1 rounded border font-black text-cyan-300"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">초물 (Start)</label>
                <input
                  type="text"
                  value={c.startVal || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = draftReport.injectionConditions.map((r, i) => i === idx ? { ...r, startVal: val } : r);
                    setDraftReport({ ...draftReport, injectionConditions: updated });
                  }}
                  className="w-full px-2 py-1 rounded border font-mono"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">중물 (Half)</label>
                <input
                  type="text"
                  value={c.halfVal || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = draftReport.injectionConditions.map((r, i) => i === idx ? { ...r, halfVal: val } : r);
                    setDraftReport({ ...draftReport, injectionConditions: updated });
                  }}
                  className="w-full px-2 py-1 rounded border font-mono"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">종물 (Finish)</label>
                <input
                  type="text"
                  value={c.finishVal || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = draftReport.injectionConditions.map((r, i) => i === idx ? { ...r, finishVal: val } : r);
                    setDraftReport({ ...draftReport, injectionConditions: updated });
                  }}
                  className="w-full px-2 py-1 rounded border font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 11. JOINT DEFECT MATRIX (BLOCK 7)
  if (blockKey === "jointDefectMatrix") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-black text-sm text-cyan-300">
            조인트 10대 공정불량 항목 관리
          </span>
          <button
            type="button"
            onClick={() => {
              const newRow = {
                name: "신규 조인트 불량",
                frtA: 0,
                frtB: 0,
                frtC: 0,
                rrA: 0,
                rrB: 0,
                reworkFrt: 0,
                reworkRr: 0,
                processFrt: 0,
                processRr: 0
              };
              setDraftReport({
                ...draftReport,
                jointDefects: [...(draftReport.jointDefects || []), newRow]
              });
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>불량 항목 추가</span>
          </button>
        </div>

        <div className="space-y-2">
          {(draftReport.jointDefects || []).map((row, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-950/90">
              <span className="w-6 text-center font-black text-cyan-300">{idx + 1}</span>
              <input
                type="text"
                value={row.name || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = draftReport.jointDefects.map((r, i) => i === idx ? { ...r, name: val } : r);
                  setDraftReport({ ...draftReport, jointDefects: updated });
                }}
                className="flex-1 px-2.5 py-1.5 rounded-lg border font-bold text-xs"
                placeholder="불량명 (예: 떨어짐, 양부족, 밀림 등)"
              />
              <button
                type="button"
                onClick={() => {
                  const updated = draftReport.jointDefects.filter((_, i) => i !== idx);
                  setDraftReport({ ...draftReport, jointDefects: updated });
                }}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
