import React from "react";

/**
 * MaterialPrepLegacyFallbackBlock
 * Renders fallback tables for legacy template definitions (timeAndQty, specAndLot, defectMatrix, maintenance)
 */
export default function MaterialPrepLegacyFallbackBlock({
  template = null,
  specs = [],
  extrusionItems = [],
  processItems = [],
  showBlockBadges = false
}) {
  return (
    <div className="space-y-2.5">
      {template?.blocks?.timeAndQty && (
        <div className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              [블록 1] 작업시간 & 생산량
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs text-center font-bold">
            <thead>
              <tr className="bg-[#fef9c3] border-b border-black">
                <th colSpan={2} className="border-r border-black p-1 w-1/3">구 분(Division)</th>
                <th className="border-r border-black p-1 w-1/3">FRT</th>
                <th className="p-1 w-1/3">RR</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black">
                <td className="border-r border-black bg-[#fef9c3] p-1 w-1/6 font-bold">작업시간(time)</td>
                <td className="border-r border-black p-1 w-1/6 font-bold">시작(S)~종료(F)</td>
                <td className="border-r border-black p-1">~</td>
                <td className="p-1"></td>
              </tr>
              <tr className="border-b border-black">
                <td rowSpan={3} className="border-r border-black bg-[#fef9c3] p-1 font-bold">
                  생산량 (Q,ty)
                </td>
                <td className="border-r border-black p-1 font-bold">
                  <div className="flex justify-between px-2 text-[11px]">
                    <span>(계획/실적)</span>
                    <span>A</span>
                  </div>
                </td>
                <td className="border-r border-black p-1">/</td>
                <td className="p-1">/</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-1 font-bold">
                  <div className="flex justify-between px-2 text-[11px]">
                    <span>(Plan/Output)</span>
                    <span>B</span>
                  </div>
                </td>
                <td className="border-r border-black p-1">/</td>
                <td className="p-1">/</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-1 font-bold">
                  <div className="flex justify-end px-2 text-[11px]">
                    <span>C</span>
                  </div>
                </td>
                <td className="border-r border-black p-1">/</td>
                <td className="p-1 relative overflow-hidden h-6">
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="100%" y2="100%" stroke="black" strokeWidth="1" />
                    <line x1="100%" y1="0" x2="0" y2="100%" stroke="black" strokeWidth="1" />
                  </svg>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {template?.blocks?.specAndLot && (
        <div className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              [블록 2] 정치 절단 길이 & LOT NO.
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
      )}

      {template?.blocks?.defectMatrix && (
        <div className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              [블록 3] 불량소재 구분 매트릭스
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs text-center font-bold">
            <thead>
              <tr className="bg-[#fef9c3] border-b border-black">
                <th colSpan={2} className="border-r border-black p-1 w-[25%]">불량소재구분</th>
                <th className="border-r border-black p-1 w-[12.5%]">Section "A"</th>
                <th className="border-r border-black p-1 w-[12.5%]">Section "B"</th>
                <th className="border-r border-black p-1 w-[12.5%]">Section "C"</th>
                <th className="border-r border-black p-1 w-[12.5%]">Section "A"</th>
                <th className="border-r border-black p-1 w-[12.5%]">Section "B"</th>
                <th className="p-1 w-[12.5%]">Section "C"</th>
              </tr>
            </thead>
            <tbody>
              {extrusionItems.map((item, idx) => (
                <tr key={`ext_${idx}`} className="border-b border-black">
                  {idx === 0 && (
                    <td
                      rowSpan={extrusionItems.length}
                      className="border-r border-black p-1 font-bold w-[12%] text-center align-middle"
                    >
                      <div className="leading-snug">
                        압출소재<br />불량<br />(Extrusion<br />Badness)
                      </div>
                    </td>
                  )}
                  <td className="border-r border-black p-0.5 text-center text-[10.5px] font-bold w-[13%]">
                    {item}
                  </td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="p-0.5 h-4"></td>
                </tr>
              ))}
              {processItems.map((item, idx) => (
                <tr key={`proc_${idx}`} className="border-b border-black">
                  {idx === 0 && (
                    <td
                      rowSpan={processItems.length}
                      className="border-r border-black p-1 font-bold w-[12%] text-center align-middle"
                    >
                      <div className="leading-snug">
                        공정간<br />불량(Process<br />Badness)
                      </div>
                    </td>
                  )}
                  <td className="border-r border-black p-0.5 text-center text-[10.5px] font-bold w-[13%]">
                    {item}
                  </td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="border-r border-black p-0.5 h-4"></td>
                  <td className="p-0.5 h-4"></td>
                </tr>
              ))}
              <tr className="border-b border-black font-black bg-slate-50">
                <td colSpan={2} className="border-r border-black p-1 text-center">
                  불량 합계(Bad Sum)
                </td>
                <td className="border-r border-black p-1 h-5"></td>
                <td className="border-r border-black p-1 h-5"></td>
                <td className="border-r border-black p-1 h-5"></td>
                <td className="border-r border-black p-1 h-5"></td>
                <td className="border-r border-black p-1 h-5"></td>
                <td className="p-1 h-5"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {template?.blocks?.maintenance && (
        <div className="relative">
          {showBlockBadges && (
            <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
              [블록 4] 칼날교체 & 설비이상 조치
            </span>
          )}
          <table className="w-full border-collapse border border-black text-xs font-bold">
            <tbody>
              <tr>
                <td className="border-r border-black bg-[#fef9c3] p-2 text-center w-[25%] font-bold">
                  칼날교체 시간
                </td>
                <td className="border-r border-black p-2 w-[25%] h-12"></td>
                <td className="border-r border-black bg-[#fef9c3] p-2 text-center w-[25%] font-bold">
                  설비 이상 조치사항
                </td>
                <td className="p-2 w-[25%] h-12"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
