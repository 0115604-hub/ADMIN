import React from "react";

/**
 * MaterialPrepDefectsInspectionBlock
 * Defect matrices, right-angle inspection, remarks, downtime/defect photos, and custom dynamic blocks
 */

export const DefectMaterialMatrixTable = ({
  rows = [],
  badgeLabel = "",
  showBlockBadges = false
}) => (
  <div className="relative">
    {showBlockBadges && (
      <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
        {badgeLabel}
      </span>
    )}
    <table className="w-full border-collapse border border-black text-xs text-center font-bold">
      <thead>
        <tr className="bg-[#fef9c3] border-b border-black text-[11px]">
          <th rowSpan={2} colSpan={2} className="border-r border-black p-1 w-[22%]">구 분(Division)</th>
          <th colSpan={4} className="border-r border-black p-1">FRT</th>
          <th colSpan={4} className="p-1">RR</th>
        </tr>
        <tr className="bg-[#fef9c3]/60 border-b border-black text-[10px]">
          <th className="border-r border-black p-0.5">LH A</th>
          <th className="border-r border-black p-0.5">RH A</th>
          <th className="border-r border-black p-0.5">LH B</th>
          <th className="border-r border-black p-0.5">RH B</th>
          <th className="border-r border-black p-0.5">LH A</th>
          <th className="border-r border-black p-0.5">RH A</th>
          <th className="border-r border-black p-0.5">LH B</th>
          <th className="p-0.5">RH B</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.id || idx} className="border-b border-black">
            {idx === 0 && (
              <td rowSpan={Math.min(4, rows.length)} className="border-r border-black bg-[#fef9c3]/40 p-1 font-black w-16">
                압출소재<br />불량
              </td>
            )}
            {idx === 4 && (
              <td rowSpan={Math.max(1, rows.length - 4)} className="border-r border-black bg-[#fef9c3]/40 p-1 font-black w-16">
                공정간<br />불량
              </td>
            )}
            <td className="border-r border-black p-1 text-left px-2 font-bold">{row.name}</td>
            <td className="border-r border-black p-0.5 font-mono">{row.frtLhA ?? ""}</td>
            <td className="border-r border-black p-0.5 font-mono">{row.frtRhA ?? ""}</td>
            <td className="border-r border-black p-0.5 font-mono">{row.frtLhB ?? ""}</td>
            <td className="border-r border-black p-0.5 font-mono">{row.frtRhB ?? ""}</td>
            <td className="border-r border-black p-0.5 font-mono">{row.rrLhA ?? ""}</td>
            <td className="border-r border-black p-0.5 font-mono">{row.rrRhA ?? ""}</td>
            <td className="border-r border-black p-0.5 font-mono">{row.rrLhB ?? ""}</td>
            <td className="p-0.5 font-mono">{row.rrRhB ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const DefectSectionAbcTable = ({
  rows = [],
  badgeLabel = "",
  showBlockBadges = false
}) => (
  <div className="relative">
    {showBlockBadges && (
      <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
        {badgeLabel}
      </span>
    )}
    <table className="w-full border-collapse border border-black text-xs text-center font-bold">
      <thead>
        <tr className="bg-[#fef9c3] border-b border-black text-[11px]">
          <th className="border-r border-black p-1 w-1/2">불량소재구분 (Section A / B / C)</th>
          <th className="border-r border-black p-1">Section A</th>
          <th className="border-r border-black p-1">Section B</th>
          <th className="p-1">Section C</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.id || idx} className="border-b border-black">
            <td className="border-r border-black p-1 text-left px-2 font-bold">{row.name}</td>
            <td className="border-r border-black p-1 font-mono">{row.secA ?? 0}</td>
            <td className="border-r border-black p-1 font-mono">{row.secB ?? 0}</td>
            <td className="p-1 font-mono">{row.secC ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const RightAngleMatrixTable = ({
  machines = [],
  badgeLabel = "",
  showBlockBadges = false
}) => (
  <div className="relative">
    {showBlockBadges && (
      <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
        {badgeLabel}
      </span>
    )}
    <table className="w-full border-collapse border border-black text-xs text-center font-bold">
      <thead>
        <tr className="bg-[#fef9c3] border-b border-black text-[11px]">
          <th className="border-r border-black p-1 w-1/4">완제품 직각검사 호기</th>
          {machines.map((m, idx) => (
            <th key={m.id || idx} className="border-r last:border-r-0 border-black p-1">{m.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-black">
          <td className="border-r border-black p-1 bg-slate-50 font-bold">검사수량</td>
          {machines.map((m, idx) => (
            <td key={m.id || idx} className="border-r last:border-r-0 border-black p-1 font-mono">{m.inspectQty}</td>
          ))}
        </tr>
        <tr className="border-b border-black">
          <td className="border-r border-black p-1 bg-slate-50 font-bold">정품수량</td>
          {machines.map((m, idx) => (
            <td key={m.id || idx} className="border-r last:border-r-0 border-black p-1 font-mono font-black text-indigo-900">{m.goodQty}</td>
          ))}
        </tr>
        <tr>
          <td className="border-r border-black p-1 bg-slate-50 font-bold">불량(리워크/폐기)</td>
          {machines.map((m, idx) => (
            <td key={m.id || idx} className="border-r last:border-r-0 border-black p-1 font-mono">
              {m.reworkQty || 0} / {m.scrapQty || 0}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  </div>
);

export const FrtRightAngleDefectsTable = ({
  rows = [],
  badgeLabel = "",
  showBlockBadges = false
}) => (
  <div className="relative">
    {showBlockBadges && (
      <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
        {badgeLabel}
      </span>
    )}
    <table className="w-full border-collapse border border-black text-xs text-center font-bold">
      <thead>
        <tr className="bg-[#fef9c3] border-b border-black text-[11px]">
          <th className="border-r border-black p-1 w-1/2">FRT 직각검사 불량 항목</th>
          <th className="border-r border-black p-1">FRT LH</th>
          <th className="border-r border-black p-1">FRT RH</th>
          <th className="p-1">합 계</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.id || idx} className="border-b border-black">
            <td className="border-r border-black p-1 text-left px-2 font-bold">{row.name}</td>
            <td className="border-r border-black p-1 font-mono">{row.frtLh || 0}</td>
            <td className="border-r border-black p-1 font-mono">{row.frtRh || 0}</td>
            <td className="p-1 font-mono font-black">{(Number(row.frtLh) || 0) + (Number(row.frtRh) || 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const RemarksTable = ({
  remarks = "",
  badgeLabel = "",
  showBlockBadges = false
}) => (
  <div className="relative">
    {showBlockBadges && (
      <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
        {badgeLabel}
      </span>
    )}
    <table className="w-full border-collapse border border-black text-xs font-bold">
      <tbody>
        <tr>
          <td className="border-r border-black bg-[#fef9c3] p-2 text-center w-[22%] font-black">
            특기사항 및 조치사항
          </td>
          <td className="p-2 text-left font-bold">
            {remarks || ""}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

export const DowntimeDefectPanelTable = ({
  events = [],
  badgeLabel = "",
  showBlockBadges = false
}) => (
  <div className="relative">
    {showBlockBadges && (
      <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
        {badgeLabel}
      </span>
    )}
    <div className="border border-black">
      <div className="bg-[#fef9c3] border-b border-black px-2 py-1 font-black text-[11px] flex items-center justify-between">
        <span>■ 비가동 및 부적합품 발생내역 (조치전·후 사진 포함)</span>
        <span className="text-[10px] font-bold">총 {events.length}건</span>
      </div>
      <table className="w-full border-collapse text-xs text-center font-bold">
        <thead>
          <tr className="bg-slate-50 border-b border-black text-[10.5px]">
            <th className="border-r border-black p-1 w-[14%]">구분</th>
            <th className="border-r border-black p-1 w-[22%]">유형/원인</th>
            <th className="border-r border-black p-1 w-[16%]">시간(분)</th>
            <th className="border-r border-black p-1 w-[14%]">수량</th>
            <th className="p-1">조치내용 및 사진</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-2 text-slate-500 text-[11px]">
                등록된 비가동/부적합 내역 없음 (실제 작업 시 조치전·후 사진 등록)
              </td>
            </tr>
          ) : (
            events.map((ev, idx) => (
              <tr key={ev.id || idx} className="border-b last:border-b-0 border-black">
                <td className="border-r border-black p-1 font-black">
                  {ev.category === "DEFECT" ? "부적합품" : "비가동"}
                </td>
                <td className="border-r border-black p-1">{ev.type || "-"}</td>
                <td className="border-r border-black p-1 font-mono">
                  {ev.startTime || ""}{ev.endTime ? `~${ev.endTime}` : ""} {ev.minutes ? `(${ev.minutes}분)` : ""}
                </td>
                <td className="border-r border-black p-1 font-mono">{ev.defectQty || 0}</td>
                <td className="p-1 text-left px-2">
                  <div>{ev.actionNote || ev.reason || "-"}</div>
                  {(ev.beforePhotoUrl || ev.afterPhotoUrl) && (
                    <div className="flex items-center gap-2 mt-1">
                      {ev.beforePhotoUrl && (
                        <img src={ev.beforePhotoUrl} alt="조치전" className="h-10 w-14 object-cover border border-black" />
                      )}
                      {ev.afterPhotoUrl && (
                        <img src={ev.afterPhotoUrl} alt="조치후" className="h-10 w-14 object-cover border border-black" />
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export const CustomAnalyzedBlockTable = ({
  blockItem = {},
  cfg = null,
  badgeLabel = "",
  showBlockBadges = false
}) => {
  const cb = blockItem.customData || {};
  const tbl = cfg?.customBlockTables?.[blockItem.key];
  const cols =
    Array.isArray(tbl?.columns) && tbl.columns.length > 0
      ? tbl.columns
      : Array.isArray(cb.columns) && cb.columns.length > 0
      ? cb.columns
      : ["항목 1", "항목 2", "항목 3"];
  const rows =
    Array.isArray(tbl?.rows) && tbl.rows.length > 0
      ? tbl.rows
      : Array.isArray(cb.rows) && cb.rows.length > 0
      ? cb.rows
      : [["", "", ""]];

  return (
    <div className="relative">
      {showBlockBadges && (
        <span className="absolute -top-2.5 left-2 bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
          {badgeLabel}
        </span>
      )}
      <div className="border border-black">
        <div className="bg-[#fef9c3] border-b border-black px-2 py-1 font-black text-[11px]">
          ■ {cb.title || cb.label || blockItem.label}
        </div>
        <table className="w-full border-collapse text-xs text-center font-bold">
          <thead>
            <tr className="bg-slate-50 border-b border-black text-[11px]">
              {cols.map((colName, cIdx) => (
                <th key={cIdx} className="border-r last:border-r-0 border-black p-1">
                  {colName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((rowArr, rIdx) => {
              const cells = Array.isArray(rowArr) ? rowArr : Array.isArray(rowArr?.cells) ? rowArr.cells : [];
              return (
                <tr key={rIdx} className="border-b last:border-b-0 border-black">
                  {cols.map((_, cIdx) => (
                    <td
                      key={cIdx}
                      className={`border-r last:border-r-0 border-black p-1 ${
                        cIdx === 0 ? "bg-slate-50 font-black" : "font-mono"
                      }`}
                    >
                      {cells[cIdx] ?? ""}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
