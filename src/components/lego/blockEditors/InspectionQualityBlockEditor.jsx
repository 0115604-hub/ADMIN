import React from "react";
import { Plus, Trash2 } from "lucide-react";

export const InspectionQualityBlockEditor = ({
  blockKey,
  draftReport,
  setDraftReport,
  rightAngleTab,
  setRightAngleTab
}) => {
  // 6. DEFECT MATERIAL MATRIX (BLOCK 10)
  if (blockKey === "defectMaterialMatrix") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-black text-sm text-cyan-300">
            불량소재 항목 목록 (압출소재불량 / 공정간불량)
          </span>
          <button
            type="button"
            onClick={() => {
              const newRow = {
                id: `dm_${Date.now()}`,
                category: "압출소재불량",
                name: "신규 불량 항목",
                frtLhA: 0,
                frtRhA: 0,
                frtLhB: 0,
                frtRhB: 0,
                rrLhA: 0,
                rrRhA: 0,
                rrLhB: 0,
                rrRhB: 0
              };
              setDraftReport({
                ...draftReport,
                defectMaterialMatrix: [...(draftReport.defectMaterialMatrix || []), newRow]
              });
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>불량 항목 추가</span>
          </button>
        </div>

        <div className="space-y-2">
          {(draftReport.defectMaterialMatrix || []).map((row, idx) => (
            <div key={row.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-950/90">
              <select
                value={row.category || "압출소재불량"}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = draftReport.defectMaterialMatrix.map((r, i) => i === idx ? { ...r, category: val } : r);
                  setDraftReport({ ...draftReport, defectMaterialMatrix: updated });
                }}
                className="px-2.5 py-1.5 rounded-lg border text-xs font-bold bg-slate-800 text-cyan-300"
              >
                <option value="압출소재불량">압출소재불량</option>
                <option value="공정간불량">공정간불량</option>
                <option value="기타불량">기타불량</option>
              </select>

              <input
                type="text"
                value={row.name || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = draftReport.defectMaterialMatrix.map((r, i) => i === idx ? { ...r, name: val } : r);
                  setDraftReport({ ...draftReport, defectMaterialMatrix: updated });
                }}
                className="flex-1 px-2.5 py-1.5 rounded-lg border font-bold text-xs"
                placeholder="불량명 (예: 외면 흠, 오염 등)"
              />

              <button
                type="button"
                onClick={() => {
                  const updated = draftReport.defectMaterialMatrix.filter((_, i) => i !== idx);
                  setDraftReport({ ...draftReport, defectMaterialMatrix: updated });
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

  // 7. DEFECT SECTION ABC (BLOCK 16)
  if (blockKey === "defectSectionAbc") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-black text-sm text-cyan-300">
            Section A / B / C 단면별 불량소재구분 항목
          </span>
          <button
            type="button"
            onClick={() => {
              const newRow = {
                id: `dsabc_${Date.now()}`,
                name: "신규 단면 불량",
                secA: 0,
                secB: 0,
                secC: 0
              };
              setDraftReport({
                ...draftReport,
                defectSectionAbc: [...(draftReport.defectSectionAbc || []), newRow]
              });
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>항목 추가</span>
          </button>
        </div>

        <div className="space-y-2">
          {(draftReport.defectSectionAbc || []).map((row, idx) => (
            <div key={row.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-950/90">
              <input
                type="text"
                value={row.name || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = draftReport.defectSectionAbc.map((r, i) => i === idx ? { ...r, name: val } : r);
                  setDraftReport({ ...draftReport, defectSectionAbc: updated });
                }}
                className="flex-1 px-2.5 py-1.5 rounded-lg border font-bold text-xs"
                placeholder="불량명 (예: 길이 미달, 와이어 노출, 단컷팅 등)"
              />
              <button
                type="button"
                onClick={() => {
                  const updated = draftReport.defectSectionAbc.filter((_, i) => i !== idx);
                  setDraftReport({ ...draftReport, defectSectionAbc: updated });
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

  // 12. DRAWING SPEC CHECK (BLOCK 12)
  if (blockKey === "drawingSpecCheck") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-black text-sm text-cyan-300">
            도면 중요 치수 및 검사 포인트 설정 (사진 12)
          </span>
          <button
            type="button"
            onClick={() => {
              const newRow = {
                id: `ds_${Date.now()}`,
                section: "신규 측정 포인트",
                spec: "500 ± 3 mm",
                startVal: "",
                halfVal: "",
                finishVal: ""
              };
              setDraftReport({
                ...draftReport,
                drawingSpecs: [...(draftReport.drawingSpecs || []), newRow]
              });
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>포인트 추가</span>
          </button>
        </div>

        <div className="space-y-2">
          {(draftReport.drawingSpecs || []).map((row, idx) => (
            <div key={row.id || idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-xl border border-slate-700 bg-slate-950/90 items-center">
              <div>
                <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">포인트 / 단면명</label>
                <input
                  type="text"
                  value={row.section || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = draftReport.drawingSpecs.map((r, i) => i === idx ? { ...r, section: val } : r);
                    setDraftReport({ ...draftReport, drawingSpecs: updated });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border font-bold text-xs"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">SPEC 기준 규격</label>
                <input
                  type="text"
                  value={row.spec || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = draftReport.drawingSpecs.map((r, i) => i === idx ? { ...r, spec: val } : r);
                    setDraftReport({ ...draftReport, drawingSpecs: updated });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border font-black text-cyan-300 text-xs"
                />
              </div>
              <div className="flex items-center gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    const updated = draftReport.drawingSpecs.filter((_, i) => i !== idx);
                    setDraftReport({ ...draftReport, drawingSpecs: updated });
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-rose-400 hover:bg-rose-500/20 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>삭제</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 13. RIGHT ANGLE MATRIX (BLOCK 13, 14)
  if (blockKey === "rightAngleMatrix") {
    return (
      <div className="space-y-4">
        {/* Tab Selector */}
        <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-700 rounded-xl w-fit flex-wrap">
          <button
            type="button"
            onClick={() => setRightAngleTab("machines")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              rightAngleTab === "machines" ? "bg-indigo-600 text-white shadow-xs font-black" : "text-slate-300 hover:text-white"
            }`}
          >
            호기 라인 ({draftReport.machines?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setRightAngleTab("extrusion")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              rightAngleTab === "extrusion" ? "bg-indigo-600 text-white shadow-xs font-black" : "text-slate-300 hover:text-white"
            }`}
          >
            압출불량 ({draftReport.extrusionDefects?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setRightAngleTab("joint")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              rightAngleTab === "joint" ? "bg-indigo-600 text-white shadow-xs font-black" : "text-slate-300 hover:text-white"
            }`}
          >
            조인트불량 ({draftReport.jointDefectsList?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setRightAngleTab("post")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              rightAngleTab === "post" ? "bg-indigo-600 text-white shadow-xs font-black" : "text-slate-300 hover:text-white"
            }`}
          >
            후가공불량 ({draftReport.postDefectsList?.length || 0})
          </button>
        </div>

        {/* Sub-tab 1: Machines */}
        {rightAngleTab === "machines" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-cyan-300">검사 호기 라인 등록</span>
              <button
                type="button"
                onClick={() => {
                  const count = (draftReport.machines?.length || 0) + 1;
                  const newMachine = {
                    id: `m_${Date.now()}`,
                    name: `호기 ${count}`,
                    workTime: "08:00 ~ 17:00",
                    inspectQty: 0,
                    goodQty: 0,
                    reworkQty: 0,
                    scrapQty: 0
                  };
                  setDraftReport({
                    ...draftReport,
                    machines: [...(draftReport.machines || []), newMachine]
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>호기 추가</span>
              </button>
            </div>

            <div className="space-y-2">
              {(draftReport.machines || []).map((m, idx) => (
                <div key={m.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-950/90">
                  <input
                    type="text"
                    value={m.name || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = draftReport.machines.map((r, i) => i === idx ? { ...r, name: val } : r);
                      setDraftReport({ ...draftReport, machines: updated });
                    }}
                    className="w-32 px-2.5 py-1.5 rounded-lg border font-bold text-xs"
                    placeholder="호기명"
                  />
                  <input
                    type="text"
                    value={m.workTime || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = draftReport.machines.map((r, i) => i === idx ? { ...r, workTime: val } : r);
                      setDraftReport({ ...draftReport, machines: updated });
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border font-mono text-xs"
                    placeholder="작업시간"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = draftReport.machines.filter((_, i) => i !== idx);
                      setDraftReport({ ...draftReport, machines: updated });
                    }}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-tabs 2, 3, 4: Defect lists */}
        {(rightAngleTab === "extrusion" || rightAngleTab === "joint" || rightAngleTab === "post") && (
          <div className="space-y-3">
            {(() => {
              const listKey = rightAngleTab === "extrusion" ? "extrusionDefects" : rightAngleTab === "joint" ? "jointDefectsList" : "postDefectsList";
              const list = draftReport[listKey] || [];

              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-cyan-300">
                      {rightAngleTab === "extrusion" ? "압출 불량 항목" : rightAngleTab === "joint" ? "조인트 불량 항목" : "후가공 불량 항목"} 목록
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newRow = {
                          id: `d_${rightAngleTab}_${Date.now()}`,
                          name: "신규 불량",
                          lh2: 0,
                          lh3: 0,
                          rh2: 0,
                          rh3: 0
                        };
                        setDraftReport({
                          ...draftReport,
                          [listKey]: [...list, newRow]
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>항목 추가</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {list.map((row, idx) => (
                      <div key={row.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-950/90">
                        <span className="w-6 text-center font-black text-cyan-300">{idx + 1}</span>
                        <input
                          type="text"
                          value={row.name || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = list.map((r, i) => i === idx ? { ...r, name: val } : r);
                            setDraftReport({ ...draftReport, [listKey]: updated });
                          }}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border font-bold text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = list.filter((_, i) => i !== idx);
                            setDraftReport({ ...draftReport, [listKey]: updated });
                          }}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  // 14. FRT RIGHT ANGLE DEFECTS (BLOCK 17)
  if (blockKey === "frtRightAngleDefects") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-black text-sm text-cyan-300">
            FRT 직각검사 불량 집계 항목 (사진 17 실물 매핑)
          </span>
          <button
            type="button"
            onClick={() => {
              const newRow = {
                id: `frt_d_${Date.now()}`,
                name: "신규 검사 불량",
                frtLh: 0,
                frtRh: 0
              };
              setDraftReport({
                ...draftReport,
                frtRightAngleDefects: [...(draftReport.frtRightAngleDefects || []), newRow]
              });
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>항목 추가</span>
          </button>
        </div>

        <div className="space-y-2">
          {(draftReport.frtRightAngleDefects || []).map((row, idx) => (
            <div key={row.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-950/90">
              <span className="w-6 text-center font-black text-cyan-300">{idx + 1}</span>
              <input
                type="text"
                value={row.name || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = draftReport.frtRightAngleDefects.map((r, i) => i === idx ? { ...r, name: val } : r);
                  setDraftReport({ ...draftReport, frtRightAngleDefects: updated });
                }}
                className="flex-1 px-2.5 py-1.5 rounded-lg border font-bold text-xs"
                placeholder="불량명 (예: 립컷팅 누락, 패드 누락 등)"
              />
              <button
                type="button"
                onClick={() => {
                  const updated = draftReport.frtRightAngleDefects.filter((_, i) => i !== idx);
                  setDraftReport({ ...draftReport, frtRightAngleDefects: updated });
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
