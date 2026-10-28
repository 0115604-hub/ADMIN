import React from "react";

/**
 * MaterialPrepCuttingSpecsBlock
 * Spec cutting length & LOT, Step cutting FRT/RR, sub-materials LOT, and drawing specs
 */

export const SpecsCuttingTable = ({
  specs = [],
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
        <tr className="bg-[#fef9c3] border-b border-black">
          <th colSpan={3} className="border-r border-black p-1 w-[28%]">구 분(Division)</th>
          <th className="border-r border-black p-1 w-[24%]">초물(Start)</th>
          <th className="border-r border-black p-1 w-[24%]">중물(Half)</th>
          <th className="p-1 w-[24%]">종물(Finish)</th>
        </tr>
      </thead>
      <tbody>
        {specs.map((spec, sIdx) => {
          const isFirst = sIdx === 0;
          const totalSpecs = specs.length;
          return (
            <React.Fragment key={spec.id || sIdx}>
              <tr className="border-b border-black">
                {isFirst && (
                  <td
                    rowSpan={totalSpecs * 3}
                    className="border-r border-black bg-[#fef9c3] p-1 font-bold w-[10%] text-center align-middle"
                  >
                    <div className="leading-snug">
                      정치 절단<br />길이(Spec<br />cutting)
                    </div>
                  </td>
                )}
                <td rowSpan={3} className="border-r border-black p-1 w-[9%] text-center font-bold">
                  {spec.section || spec.name || `Section ${sIdx + 1}`}
                </td>
                <td className="border-r border-black p-0.5 text-center text-[11px] font-bold w-[9%]">
                  규격(Spec)
                </td>
                <td colSpan={3} className="p-0.5 text-center font-black text-indigo-900 bg-slate-50/50">
                  {spec.frtSpec || spec.spec || "-"}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-0.5 text-center text-[11px] font-bold">
                  초/중/종
                </td>
                <td className="border-r border-black p-0.5 h-6 text-center font-mono">
                  {spec.startVal || spec.start1 || ""}
                </td>
                <td className="border-r border-black p-0.5 h-6 text-center font-mono">
                  {spec.halfVal || spec.half1 || ""}
                </td>
                <td className="p-0.5 h-6 text-center font-mono">
                  {spec.finishVal || spec.finish1 || ""}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-0.5 text-center text-[11px] font-bold">
                  LOT NO.
                </td>
                <td className="border-r border-black p-0.5 h-6 text-center font-mono text-[10.5px]">
                  {spec.lotStart || spec.lotNo || ""}
                </td>
                <td className="border-r border-black p-0.5 h-6 text-center font-mono text-[10.5px]">
                  {spec.lotHalf || spec.lotNo || ""}
                </td>
                <td className="p-0.5 h-6 text-center font-mono text-[10.5px]">
                  {spec.lotFinish || spec.lotNo || ""}
                </td>
              </tr>
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  </div>
);

export const StepCuttingTable = ({
  list = [],
  titleText = "",
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
      <div className="bg-[#fef9c3] border-b border-black px-2 py-1 font-black text-[11px]">
        ■ {titleText}
      </div>
      <table className="w-full border-collapse text-xs text-center font-bold">
        <thead>
          <tr className="bg-slate-50 border-b border-black text-[11px]">
            <th className="border-r border-black p-1 w-1/4">구분</th>
            {list.map((c, idx) => (
              <th key={c.id || idx} className="border-r last:border-r-0 border-black p-1">
                {c.section}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1 bg-[#fef9c3]/50 font-bold">SPEC</td>
            {list.map((c, idx) => (
              <td key={c.id || idx} className="border-r last:border-r-0 border-black p-1 font-black text-indigo-900">
                {c.spec}
              </td>
            ))}
          </tr>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1 font-bold">초물(Start)</td>
            {list.map((c, idx) => (
              <td key={c.id || idx} className="border-r last:border-r-0 border-black p-1 font-mono">
                {c.startVal || ""}
              </td>
            ))}
          </tr>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1 font-bold">중물(Half)</td>
            {list.map((c, idx) => (
              <td key={c.id || idx} className="border-r last:border-r-0 border-black p-1 font-mono">
                {c.halfVal || ""}
              </td>
            ))}
          </tr>
          <tr>
            <td className="border-r border-black p-1 font-bold">종물(Finish)</td>
            {list.map((c, idx) => (
              <td key={c.id || idx} className="border-r last:border-r-0 border-black p-1 font-mono">
                {c.finishVal || ""}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export const SubMaterialLotTable = ({
  lotValue = "-",
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
          <td className="border-r border-black bg-[#fef9c3] p-1.5 w-[25%] text-center font-black">
            부자재 LOT NO. (패드 5T)
          </td>
          <td className="p-1.5 font-mono font-bold text-left px-3">
            {lotValue || "-"}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

export const DrawingSpecCheckTable = ({
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
          <th className="border-r border-black p-1 w-1/4">도면 치수 항목</th>
          <th className="border-r border-black p-1 w-1/4">규 격(Spec)</th>
          <th className="border-r border-black p-1">초물(Start)</th>
          <th className="border-r border-black p-1">중물(Half)</th>
          <th className="p-1">종물(Finish)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((ds, idx) => (
          <tr key={ds.id || idx} className="border-b border-black">
            <td className="border-r border-black p-1 font-bold bg-slate-50">{ds.section}</td>
            <td className="border-r border-black p-1 font-black text-indigo-900">{ds.spec}</td>
            <td className="border-r border-black p-1 font-mono">{ds.startVal || ""}</td>
            <td className="border-r border-black p-1 font-mono">{ds.halfVal || ""}</td>
            <td className="p-1 font-mono">{ds.finishVal || ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
