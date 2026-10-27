import React from "react";
import { Plus } from "lucide-react";
import CommonDowntimeDefectPanel from "../common/CommonDowntimeDefectPanel.jsx";
import {
  BladeReplacementCycleBlock,
  MoldShotCountManageBlock
} from "../common/BladeAndMoldLifecycleBlocks.jsx";

/**
 * 🧱 BLOCK 12: 도면 치수 & 중요 치수 및 검사 현황 (사진 12)
 */
export const DrawingSpecCheckBlock = ({
  currentReport = {},
  isWorkerRecordingMode = false,
  handleUpdateSpecValue,
  handleAddDrawingSpecRow,
  t = (s) => s,
  renderBlockWrapper
}) => {
  return renderBlockWrapper(
    "drawingSpecCheck",
    "[블록 12] 도면 치수 & 중요 검사 현황",
    <div className="space-y-3 p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
      <div className="flex items-center justify-between pb-1 border-b border-emerald-200 dark:border-emerald-800">
        <span className="text-xs font-black text-emerald-900 dark:text-emerald-300">
          🧱 {t("[블록 12] 도면 치수 & 중요 검사 현황")}
        </span>
        {!isWorkerRecordingMode && (
          <button
            type="button"
            onClick={handleAddDrawingSpecRow}
            className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
          >
            {t("+ 치수 행 추가")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* 도면 원본 다이어그램 이미지 */}
        <div className="md:col-span-5 bg-white dark:bg-slate-900 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
          <img
            src="/lego_images/lego_block_12.png"
            alt="도면 치수 위치 다이어그램 (A, B, D)"
            className="max-h-56 mx-auto object-contain rounded"
          />
          <span className="text-[10px] text-slate-500 block mt-1">▲ 도면 다이어그램 A, B, D 측정 위치</span>
        </div>

        {/* 치수 검사 테이블 */}
        <div className="md:col-span-7 overflow-x-auto border border-black dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900">
          <table className="w-full border-collapse text-xs text-center font-bold">
            <thead>
              <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
                <th rowSpan={2} className="border-r border-black dark:border-slate-600 p-1 w-1/4">{t("항 목")}</th>
                <th rowSpan={2} className="border-r border-black dark:border-slate-600 p-1 w-1/4">{t("규 격")}</th>
                <th colSpan={3} className="p-1">{t("실 측 치")}</th>
              </tr>
              <tr className="bg-amber-50 dark:bg-amber-950/50 border-b border-black dark:border-slate-600 text-[10px]">
                <th className="border-r border-black dark:border-slate-600 p-0.5">{t("초물")}</th>
                <th className="border-r border-black dark:border-slate-600 p-0.5">{t("중물")}</th>
                <th className="p-0.5">{t("종물")}</th>
              </tr>
            </thead>
            <tbody>
              {(currentReport.drawingSpecs || []).map((ds) => (
                <tr key={ds.id} className="border-b border-black dark:border-slate-600">
                  <td className="border-r border-black dark:border-slate-600 p-1 font-bold bg-slate-50 dark:bg-slate-800">
                    {isWorkerRecordingMode ? (
                      <span className="w-full text-center font-bold block">{ds.section}</span>
                    ) : (
                      <input
                        type="text"
                        value={ds.section}
                        onChange={(e) => handleUpdateSpecValue?.("drawingSpecs", ds.id, "section", e.target.value)}
                        className="w-full text-center bg-transparent outline-none font-bold"
                      />
                    )}
                  </td>
                  <td className="border-r border-black dark:border-slate-600 p-1 text-emerald-600 dark:text-emerald-400 font-black">
                    {isWorkerRecordingMode ? (
                      <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 inline-block">
                        🔒 {ds.spec}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={ds.spec}
                        onChange={(e) => handleUpdateSpecValue?.("drawingSpecs", ds.id, "spec", e.target.value)}
                        className="w-full text-center bg-transparent outline-none font-black"
                      />
                    )}
                  </td>
                  <td className="border-r border-black dark:border-slate-600 p-1 font-mono">
                    <input
                      type="text"
                      value={ds.startVal || ""}
                      onChange={(e) => handleUpdateSpecValue?.("drawingSpecs", ds.id, "startVal", e.target.value)}
                      className="w-full text-center bg-transparent outline-none font-mono"
                    />
                  </td>
                  <td className="border-r border-black dark:border-slate-600 p-1 font-mono">
                    <input
                      type="text"
                      value={ds.halfVal || ""}
                      onChange={(e) => handleUpdateSpecValue?.("drawingSpecs", ds.id, "halfVal", e.target.value)}
                      className="w-full text-center bg-transparent outline-none font-mono"
                    />
                  </td>
                  <td className="p-1 font-mono">
                    <input
                      type="text"
                      value={ds.finishVal || ""}
                      onChange={(e) => handleUpdateSpecValue?.("drawingSpecs", ds.id, "finishVal", e.target.value)}
                      className="w-full text-center bg-transparent outline-none font-mono"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>,
    { canAddRow: true, onAddRow: handleAddDrawingSpecRow, customBadge: "사진 12" }
  );
};

/**
 * 🧱 BLOCK 14: 완제품 직각검사 호기별 종합 매트릭스 (사진 13, 14)
 */
export const RightAngleMatrixBlock = ({
  currentReport = {},
  setCurrentReport,
  isWorkerRecordingMode = false,
  handleAddMachineRow,
  t = (s) => s,
  renderBlockWrapper
}) => {
  return renderBlockWrapper(
    "rightAngleMatrix",
    "[블록 14] 완제품 직각검사 종합 매트릭스",
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
          <span>🧱 {t("[블록 14] 완제품 직각검사 종합 매트릭스")}</span>
        </span>
        {!isWorkerRecordingMode && (
          <button
            type="button"
            onClick={handleAddMachineRow}
            className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("+ 호기 라인 추가")}</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-black dark:border-slate-600 rounded-xl">
        <table className="w-full border-collapse text-xs text-center font-bold">
          <thead>
            <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
              <th colSpan={2} className="border-r border-black dark:border-slate-600 p-1 w-1/4">{t("구 분")}</th>
              {(currentReport.machines || []).map((m) => (
                <th key={m.id} className="border-r border-black dark:border-slate-600 p-1">
                  {isWorkerRecordingMode ? (
                    <span className="w-full text-center font-black block">{m.name || ""}</span>
                  ) : (
                    <input
                      type="text"
                      value={m.name || ""}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        setCurrentReport?.((prev) => ({
                          ...prev,
                          machines: (prev.machines || []).map((item) =>
                            item.id === m.id ? { ...item, name: nextVal } : item
                          )
                        }));
                      }}
                      className="w-full text-center font-black bg-transparent outline-none border-b border-dashed border-slate-400 focus:border-indigo-500"
                      title="호기/구분명 수정"
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 작업시간 */}
            <tr className="border-b border-black dark:border-slate-600">
              <td rowSpan={2} className="border-r border-black dark:border-slate-600 bg-amber-50 dark:bg-amber-950/40 p-1 font-bold w-16">
                {t("작업시간")}
              </td>
              <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("시작 시간")}</td>
              {(currentReport.machines || []).map((m) => (
                <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono">08:00</td>
              ))}
            </tr>
            <tr className="border-b border-black dark:border-slate-600">
              <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("종료 시간")}</td>
              {(currentReport.machines || []).map((m) => (
                <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono">17:00</td>
              ))}
            </tr>

            {/* 제품 수량 */}
            <tr className="border-b border-black dark:border-slate-600">
              <td rowSpan={4} className="border-r border-black dark:border-slate-600 bg-cyan-50 dark:bg-cyan-950/40 p-1 font-bold">
                {t("제품수량")}
              </td>
              <td className="border-r border-black dark:border-slate-600 p-1 font-bold">{t("검 사")}</td>
              {(currentReport.machines || []).map((m) => (
                <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono font-black">{m.inspectQty}</td>
              ))}
            </tr>
            <tr className="border-b border-black dark:border-slate-600">
              <td className="border-r border-black dark:border-slate-600 p-1 font-bold text-emerald-600">{t("정 품")}</td>
              {(currentReport.machines || []).map((m) => (
                <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono font-black text-emerald-600">{m.goodQty}</td>
              ))}
            </tr>
            <tr className="border-b border-black dark:border-slate-600">
              <td className="border-r border-black dark:border-slate-600 p-1 font-bold text-amber-600">{t("공정불량(리워크)")}</td>
              {(currentReport.machines || []).map((m) => (
                <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono">{m.reworkQty}</td>
              ))}
            </tr>
            <tr className="border-b border-black dark:border-slate-600">
              <td className="border-r border-black dark:border-slate-600 p-1 font-bold text-rose-600">{t("완전불량(폐기)")}</td>
              {(currentReport.machines || []).map((m) => (
                <td key={m.id} className="border-r border-black dark:border-slate-600 p-1 font-mono font-black text-rose-600">{m.scrapQty}</td>
              ))}
            </tr>

            {/* 조인트불량 9종 */}
            {(currentReport.rightAngleDefects || []).map((def, dIdx) => (
              <tr key={def.id || dIdx} className="border-b border-black dark:border-slate-600">
                {dIdx === 0 && (
                  <td rowSpan={(currentReport.rightAngleDefects || []).length} className="border-r border-black dark:border-slate-600 bg-purple-50 dark:bg-purple-950/40 p-1 font-bold">
                    {t("조인트 불량")}
                  </td>
                )}
                <td className="border-r border-black dark:border-slate-600 p-1 font-bold text-left px-2 bg-slate-50 dark:bg-slate-800">
                  {isWorkerRecordingMode ? (
                    <span className="font-bold text-xs block px-1">{t(def.name)}</span>
                  ) : (
                    <input
                      type="text"
                      value={t(def.name)}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        setCurrentReport?.((prev) => ({
                          ...prev,
                          rightAngleDefects: (prev.rightAngleDefects || []).map((item) =>
                            item.id === def.id ? { ...item, name: nextVal } : item
                          )
                        }));
                      }}
                      className="w-full font-bold bg-transparent outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500 px-1"
                      title="불량 항목명 수정"
                    />
                  )}
                </td>
                {(currentReport.machines || []).map((m) => (
                  <td key={m.id} className="border-r border-black dark:border-slate-600 p-0.5 font-mono">
                    <input
                      type="number"
                      value={def.vals?.[m.id] || 0}
                      onChange={(e) => {
                        const num = Number(e.target.value);
                        setCurrentReport?.((prev) => ({
                          ...prev,
                          rightAngleDefects: (prev.rightAngleDefects || []).map((item) =>
                            item.id === def.id
                              ? { ...item, vals: { ...(item.vals || {}), [m.id]: num } }
                              : item
                          )
                        }));
                      }}
                      className="w-full text-center bg-transparent outline-none font-mono"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    { customBadge: "사진 13, 14" }
  );
};

/**
 * 🧱 BLOCK 17: FRT 직각검사 불량 집계표 (사진 17)
 */
export const FrtRightAngleDefectsBlock = ({
  currentReport = {},
  isWorkerRecordingMode = false,
  handleUpdateSpecValue,
  handleAddFrtRightAngleDefectRow,
  t = (s) => s,
  renderBlockWrapper
}) => {
  return renderBlockWrapper(
    "frtRightAngleDefects",
    "[블록 17] FRT 직각검사 불량 집계표",
    <div className="space-y-1.5 border border-black dark:border-slate-600 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-950/40">
      <div className="flex items-center justify-between pb-1 border-b border-slate-300 dark:border-slate-700">
        <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
          <span>🧱 {t("[블록 17] FRT 직각검사 불량 집계표")}</span>
        </span>
        {!isWorkerRecordingMode && (
          <button
            type="button"
            onClick={handleAddFrtRightAngleDefectRow}
            className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] cursor-pointer"
          >
            {t("+ 불량 항목 추가")}
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-black dark:border-slate-600 text-xs text-center font-bold">
          <thead>
            <tr className="bg-amber-100 dark:bg-amber-950/70 border-b border-black dark:border-slate-600 text-[11px]">
              <th className="border-r border-black dark:border-slate-600 p-1 w-1/2">{t("불량 항목 (Defect item)")}</th>
              <th className="border-r border-black dark:border-slate-600 p-1">FRT LH</th>
              <th className="border-r border-black dark:border-slate-600 p-1">FRT RH</th>
              <th className="p-1">{t("합 계")}</th>
            </tr>
          </thead>
          <tbody>
            {(currentReport.frtRightAngleDefects || []).map((row) => (
              <tr key={row.id} className="border-b border-black dark:border-slate-600">
                <td className="border-r border-black dark:border-slate-600 p-1 text-left px-1 font-bold bg-slate-50 dark:bg-slate-800">
                  {isWorkerRecordingMode ? (
                    <span className="w-full font-bold block px-1">{t(row.name || "")}</span>
                  ) : (
                    <input
                      type="text"
                      value={t(row.name || "")}
                      onChange={(e) => handleUpdateSpecValue?.("frtRightAngleDefects", row.id, "name", e.target.value)}
                      className="w-full font-bold bg-transparent outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500 px-1"
                      title="구분(불량 항목)명 수정"
                    />
                  )}
                </td>
                <td className="border-r border-black dark:border-slate-600 p-1">
                  <input
                    type="number"
                    value={row.frtLh || 0}
                    onChange={(e) => handleUpdateSpecValue?.("frtRightAngleDefects", row.id, "frtLh", Number(e.target.value))}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
                <td className="border-r border-black dark:border-slate-600 p-1">
                  <input
                    type="number"
                    value={row.frtRh || 0}
                    onChange={(e) => handleUpdateSpecValue?.("frtRightAngleDefects", row.id, "frtRh", Number(e.target.value))}
                    className="w-full text-center bg-transparent outline-none font-mono"
                  />
                </td>
                <td className="p-1 font-mono font-black text-rose-600">
                  {(Number(row.frtLh) || 0) + (Number(row.frtRh) || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    { canAddRow: true, onAddRow: handleAddFrtRightAngleDefectRow, customBadge: "사진 17" }
  );
};

/**
 * 🧱 BLOCK 11 & REMARKS: 부자재 LOT 및 특기사항
 */
export const SubMaterialAndRemarksBlocks = ({
  currentReport = {},
  handleUpdateField,
  t = (s) => s,
  renderBlockWrapper
}) => {
  return (
    <>
      {renderBlockWrapper(
        "subMaterialLot",
        "[블록 11] 부자재 LOT NO. (패드 5T)",
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 block">
            🧱 {t("[블록 11] 부자재 LOT NO. (패드 5T)")}
          </span>
          <input
            type="text"
            value={currentReport.subMaterialLot || ""}
            onChange={(e) => handleUpdateField?.("subMaterialLot", e.target.value)}
            className="w-full font-bold text-xs bg-transparent outline-none border-b border-dashed border-slate-400 py-1"
            placeholder={t("패드 5T 입고일자 및 LOT 번호 입력")}
          />
        </div>,
        { customBadge: "사진 11" }
      )}

      {renderBlockWrapper(
        "remarks",
        "특기 사항 및 조치사항",
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-black text-slate-400 block">{t("■ 특기 사항 (조치사항)")}</span>
          <input
            type="text"
            value={currentReport.remarks || ""}
            onChange={(e) => handleUpdateField?.("remarks", e.target.value)}
            className="w-full font-bold text-xs bg-transparent outline-none border-b border-dashed border-slate-400 py-1"
            placeholder={t("설비 이상, 원부자재 교체, 조치사항 등 입력")}
          />
        </div>,
        { customBadge: "공통" }
      )}
    </>
  );
};

/**
 * 🧱 COMMON LIFECYCLE & DEFECT PANELS (칼날교체, 금형숏트수, 비가동/부적합 패널)
 */
export const CommonInspectionLifecycleBlocks = ({
  currentReport = {},
  setCurrentReport,
  currentLang,
  t = (s) => s,
  renderBlockWrapper
}) => {
  const totalProductionQty =
    (currentReport.workTimeOutput || []).reduce(
      (sum, r) => sum + (Number(r.qtyA) || 0) + (Number(r.qtyB) || 0),
      0
    ) +
    (currentReport.timeAndOutput || []).reduce(
      (sum, r) => sum + (Number(r.goodQty) || 0) + (Number(r.defectQty) || 0),
      0
    );

  return (
    <>
      {renderBlockWrapper(
        "bladeReplacementBlock",
        "칼날교체주기 관리 블록 (횟수설정 / 교체 리셋)",
        <BladeReplacementCycleBlock
          todayProductionQty={totalProductionQty}
          config={currentReport.bladeReplacementConfig || {}}
          workerName={currentReport.workerName || t("작업자")}
          currentLang={currentLang}
          onChangeConfig={(nextCfg) =>
            setCurrentReport?.((prev) => ({
              ...prev,
              bladeReplacementConfig: nextCfg
            }))
          }
        />,
        { customBadge: "공통" }
      )}

      {renderBlockWrapper(
        "moldShotCountBlock",
        "금형숏트수관리 블록 (습합·검증완료 / 리셋)",
        <MoldShotCountManageBlock
          todayProductionQty={totalProductionQty}
          config={currentReport.moldShotCountConfig || {}}
          workerName={currentReport.workerName || t("작업자")}
          currentLang={currentLang}
          onChangeConfig={(nextCfg) =>
            setCurrentReport?.((prev) => ({
              ...prev,
              moldShotCountConfig: nextCfg
            }))
          }
        />,
        { customBadge: "공통" }
      )}

      {renderBlockWrapper(
        "downtimeDefectPanel",
        "비가동 및 부적합품 발생내역 (조치전·후 사진)",
        <CommonDowntimeDefectPanel
          title={t("비가동 및 부적합품 발생내역")}
          plantLabel={currentReport.companyName || "작업일보 공통"}
          unitLabel="부적합량(EA/kg)"
          currentLang={currentLang}
          events={currentReport.downtimeEvents || []}
          onChangeEvents={(nextEvents) =>
            setCurrentReport?.((prev) => ({
              ...prev,
              downtimeEvents: nextEvents
            }))
          }
        />,
        { customBadge: "공통" }
      )}
    </>
  );
};
