import React from "react";
import { Plus, Trash2 } from "lucide-react";

export const CuttingSpecBlockEditor = ({
  blockKey,
  draftReport,
  setDraftReport,
  inputBaseCls
}) => {
  // 2. WORK TIME OUTPUT (BLOCK 9)
  if (blockKey === "workTimeOutput") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-black text-sm text-cyan-300">구분별 작업시간 및 실적 행 관리:</span>
          <button
            type="button"
            onClick={() => {
              const nextId = `wto_${Date.now()}`;
              const newRow = {
                id: nextId,
                division: `구분 ${draftReport.workTimeOutput?.length + 1 || 1}`,
                startA: "08:00",
                finishA: "12:00",
                qtyA: 180,
                startB: "13:00",
                finishB: "17:00",
                qtyB: 175
              };
              setDraftReport({
                ...draftReport,
                workTimeOutput: [...(draftReport.workTimeOutput || []), newRow]
              });
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>행 추가</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-700 rounded-2xl bg-slate-950/80">
          <table className="w-full text-center border-collapse">
            <thead className="bg-slate-800 text-cyan-300 text-[11px] font-black">
              <tr className="border-b border-slate-700">
                <th className="p-2.5">구분 명칭</th>
                <th className="p-2.5">A단면 시작</th>
                <th className="p-2.5">A단면 종료</th>
                <th className="p-2.5">A단면 수량</th>
                <th className="p-2.5">B단면 시작</th>
                <th className="p-2.5">B단면 종료</th>
                <th className="p-2.5">B단면 수량</th>
                <th className="p-2.5">삭제</th>
              </tr>
            </thead>
            <tbody>
              {(draftReport.workTimeOutput || []).map((row, idx) => (
                <tr key={row.id || idx} className="border-b border-slate-800">
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.division || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.workTimeOutput.map((r, i) => i === idx ? { ...r, division: val } : r);
                        setDraftReport({ ...draftReport, workTimeOutput: updated });
                      }}
                      className="w-24 px-2 py-1 rounded-lg border text-center font-bold"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={row.startA || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.workTimeOutput.map((r, i) => i === idx ? { ...r, startA: val } : r);
                        setDraftReport({ ...draftReport, workTimeOutput: updated });
                      }}
                      className="w-16 px-1 py-1 rounded border text-center font-mono text-xs"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={row.finishA || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.workTimeOutput.map((r, i) => i === idx ? { ...r, finishA: val } : r);
                        setDraftReport({ ...draftReport, workTimeOutput: updated });
                      }}
                      className="w-16 px-1 py-1 rounded border text-center font-mono text-xs"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="number"
                      value={row.qtyA || 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const updated = draftReport.workTimeOutput.map((r, i) => i === idx ? { ...r, qtyA: val } : r);
                        setDraftReport({ ...draftReport, workTimeOutput: updated });
                      }}
                      className="w-16 px-1 py-1 rounded border text-center font-mono font-bold text-xs"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={row.startB || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.workTimeOutput.map((r, i) => i === idx ? { ...r, startB: val } : r);
                        setDraftReport({ ...draftReport, workTimeOutput: updated });
                      }}
                      className="w-16 px-1 py-1 rounded border text-center font-mono text-xs"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={row.finishB || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.workTimeOutput.map((r, i) => i === idx ? { ...r, finishB: val } : r);
                        setDraftReport({ ...draftReport, workTimeOutput: updated });
                      }}
                      className="w-16 px-1 py-1 rounded border text-center font-mono text-xs"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="number"
                      value={row.qtyB || 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const updated = draftReport.workTimeOutput.map((r, i) => i === idx ? { ...r, qtyB: val } : r);
                        setDraftReport({ ...draftReport, workTimeOutput: updated });
                      }}
                      className="w-16 px-1 py-1 rounded border text-center font-mono font-bold text-xs"
                    />
                  </td>
                  <td className="p-1">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = draftReport.workTimeOutput.filter((_, i) => i !== idx);
                        setDraftReport({ ...draftReport, workTimeOutput: updated });
                      }}
                      className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 3. SPECS CUTTING (BLOCK 15)
  if (blockKey === "specsCutting") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-black text-sm text-cyan-300">정치 절단 단면별 규격 & 허용공차 설정</span>
            <span className="text-[11px] text-slate-300 block mt-0.5">사진 15 실물 데이터 (A: 881±3 / 488±3 가절단, B: 608±5 / 658±5, C: 582±5 / 658±6)</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const count = draftReport.specsCutting?.length || 0;
              const nextChar = String.fromCharCode(65 + count);
              const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, "");
              const newRow = {
                id: `c_${Date.now()}`,
                section: nextChar,
                spec1: "600 ± 5mm",
                start1: "600.0",
                half1: "600.0",
                finish1: "600.0",
                lotStart: `${datePrefix}-${nextChar}01`,
                lotHalf: `${datePrefix}-${nextChar}01`,
                lotFinish: `${datePrefix}-${nextChar}01`,
                lotNo: `${datePrefix}-${nextChar}01`
              };
              setDraftReport({
                ...draftReport,
                specsCutting: [...(draftReport.specsCutting || []), newRow]
              });
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>단면 행 추가</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {(draftReport.specsCutting || []).map((row, idx) => (
            <div key={row.id || idx} className="p-3.5 rounded-2xl border border-slate-700 bg-slate-950/90 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-xs">
                    {row.section}
                  </span>
                  <span className="font-black text-white">
                    {row.section} 단면 규격 정의
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = draftReport.specsCutting.filter((_, i) => i !== idx);
                    setDraftReport({ ...draftReport, specsCutting: updated });
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-rose-400 hover:bg-rose-500/20 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>삭제</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">단면 명칭</label>
                  <input
                    type="text"
                    value={row.section || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = draftReport.specsCutting.map((r, i) => i === idx ? { ...r, section: val } : r);
                      setDraftReport({ ...draftReport, specsCutting: updated });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">SPEC (절단 길이 / 공차)</label>
                  <input
                    type="text"
                    value={row.spec1 || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = draftReport.specsCutting.map((r, i) => i === idx ? { ...r, spec1: val } : r);
                      setDraftReport({ ...draftReport, specsCutting: updated });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border font-black text-cyan-300 text-center"
                    placeholder="예: 881 ± 3mm"
                  />
                </div>
              </div>

              {/* LOT NO. 3개 입력 칸 (초물 / 중물 / 종물) */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-black text-amber-300 block mb-1.5">
                  📦 LOT NO. (초물 • 중물 • 종물 3개 칸)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">초물 LOT</label>
                    <input
                      type="text"
                      value={row.lotStart ?? row.lotNo ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.specsCutting.map((r, i) => i === idx ? { ...r, lotStart: val, lotNo: val } : r);
                        setDraftReport({ ...draftReport, specsCutting: updated });
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border font-mono text-xs text-center"
                      placeholder="초물 LOT"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">중물 LOT</label>
                    <input
                      type="text"
                      value={row.lotHalf ?? row.lotNo ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.specsCutting.map((r, i) => i === idx ? { ...r, lotHalf: val } : r);
                        setDraftReport({ ...draftReport, specsCutting: updated });
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border font-mono text-xs text-center"
                      placeholder="중물 LOT"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">종물 LOT</label>
                    <input
                      type="text"
                      value={row.lotFinish ?? row.lotNo ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.specsCutting.map((r, i) => i === idx ? { ...r, lotFinish: val } : r);
                        setDraftReport({ ...draftReport, specsCutting: updated });
                      }}
                      className="w-full px-2 py-1.5 rounded-lg border font-mono text-xs text-center"
                      placeholder="종물 LOT"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. STEP CUTTING FRT (BLOCK 2) & RR (BLOCK 3)
  if (blockKey === "stepCuttingFrt" || blockKey === "stepCuttingRr") {
    const isFrt = blockKey === "stepCuttingFrt";
    const listKey = isFrt ? "stepCuttingFrt" : "stepCuttingRr";
    const list = draftReport[listKey] || [];

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-black text-sm text-cyan-300">
            {isFrt ? "FRT 단컷팅 구간 치수 행 관리" : "RR 단컷팅 구간 치수 행 관리"}
          </span>
          <button
            type="button"
            onClick={() => {
              const nextChar = String.fromCharCode(65 + list.length);
              const newRow = {
                id: `sc_${isFrt ? "frt" : "rr"}_${Date.now()}`,
                section: nextChar,
                spec: isFrt ? "45mm" : "39mm",
                startVal: "",
                halfVal: "",
                finishVal: ""
              };
              setDraftReport({
                ...draftReport,
                [listKey]: [...list, newRow]
              });
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>구간 추가</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-700 rounded-2xl bg-slate-950/80">
          <table className="w-full text-center border-collapse">
            <thead className="bg-slate-800 text-cyan-300 text-[11px] font-black">
              <tr className="border-b border-slate-700">
                <th className="p-2.5">구간 명칭</th>
                <th className="p-2.5">기준 SPEC (치수)</th>
                <th className="p-2.5">초물 실측</th>
                <th className="p-2.5">중물 실측</th>
                <th className="p-2.5">종물 실측</th>
                <th className="p-2.5">삭제</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row, idx) => (
                <tr key={row.id || idx} className="border-b border-slate-800">
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.section || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = list.map((r, i) => i === idx ? { ...r, section: val } : r);
                        setDraftReport({ ...draftReport, [listKey]: updated });
                      }}
                      className="w-16 px-2 py-1 rounded border text-center font-bold"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.spec || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = list.map((r, i) => i === idx ? { ...r, spec: val } : r);
                        setDraftReport({ ...draftReport, [listKey]: updated });
                      }}
                      className="w-24 px-2 py-1 rounded border text-center font-black text-cyan-300"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.startVal || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = list.map((r, i) => i === idx ? { ...r, startVal: val } : r);
                        setDraftReport({ ...draftReport, [listKey]: updated });
                      }}
                      className="w-16 px-1 py-1 rounded border text-center font-mono"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.halfVal || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = list.map((r, i) => i === idx ? { ...r, halfVal: val } : r);
                        setDraftReport({ ...draftReport, [listKey]: updated });
                      }}
                      className="w-16 px-1 py-1 rounded border text-center font-mono"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.finishVal || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = list.map((r, i) => i === idx ? { ...r, finishVal: val } : r);
                        setDraftReport({ ...draftReport, [listKey]: updated });
                      }}
                      className="w-16 px-1 py-1 rounded border text-center font-mono"
                    />
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = list.filter((_, i) => i !== idx);
                        setDraftReport({ ...draftReport, [listKey]: updated });
                      }}
                      className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 5. SUB MATERIAL LOT (BLOCK 11)
  if (blockKey === "subMaterialLot") {
    return (
      <div className="space-y-3 bg-slate-950/90 p-4 rounded-2xl border border-slate-700">
        <label className="text-xs font-black text-cyan-300 block">
          부자재 LOT 명칭 및 기본 번호
        </label>
        <input
          type="text"
          value={draftReport.subMaterialLot || ""}
          onChange={(e) => setDraftReport({ ...draftReport, subMaterialLot: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-white font-bold text-sm"
          placeholder="예: 패드 5T: 2026.10.19-01"
        />
        <p className="text-xs text-slate-300">
          💡 '레고 양식.xlsx' 사진 11 실물 규격: <strong className="text-amber-300">패드 5T 입고일자 및 LOT</strong> (부품 도면 규격: 5T*5W*60L)
        </p>
      </div>
    );
  }

  return null;
};
