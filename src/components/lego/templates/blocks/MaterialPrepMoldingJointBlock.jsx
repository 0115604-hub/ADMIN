import React from "react";

/**
 * MaterialPrepMoldingJointBlock
 * Work time & output, molding injection temps & conditions, joint materials, and joint defect matrix
 */

export const WorkTimeOutputTable = ({
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
          <th rowSpan={2} className="border-r border-black p-1 w-[20%]">구 분(Division)</th>
          <th colSpan={3} className="border-r border-black p-1">A단면 실적</th>
          <th colSpan={3} className="p-1">B단면 실적</th>
        </tr>
        <tr className="bg-[#fef9c3]/60 border-b border-black text-[10px]">
          <th className="border-r border-black p-1">시작시간</th>
          <th className="border-r border-black p-1">종료시간</th>
          <th className="border-r border-black p-1">생산수량</th>
          <th className="border-r border-black p-1">시작시간</th>
          <th className="border-r border-black p-1">종료시간</th>
          <th className="p-1">생산수량</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, rIdx) => (
          <tr key={r.id || rIdx} className="border-b border-black">
            <td className="border-r border-black bg-[#fef9c3]/40 p-1 font-black">{r.division}</td>
            <td className="border-r border-black p-1 font-mono">{r.startA || ""}</td>
            <td className="border-r border-black p-1 font-mono">{r.finishA || ""}</td>
            <td className="border-r border-black p-1 font-mono font-black text-indigo-900">{r.qtyA ?? ""}</td>
            <td className="border-r border-black p-1 font-mono">{r.startB || ""}</td>
            <td className="border-r border-black p-1 font-mono">{r.finishB || ""}</td>
            <td className="p-1 font-mono font-black text-indigo-900">{r.qtyB ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const TimeAndOutputTable = ({
  workerNameVal = "-",
  workTimeRange = "08:00 ~ 17:00",
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
          <th className="border-r border-black p-1">구 분</th>
          <th className="border-r border-black p-1">작업자</th>
          <th className="border-r border-black p-1">작업시간</th>
          <th className="border-r border-black p-1">정품수량</th>
          <th className="border-r border-black p-1">불량수량</th>
          <th className="p-1">재조인트</th>
        </tr>
      </thead>
      <tbody>
        {["FRT LH", "FRT RH", "RR LH", "RR RH"].map((div) => (
          <tr key={div} className="border-b border-black">
            <td className="border-r border-black p-1 bg-slate-50 font-black">{div}</td>
            <td className="border-r border-black p-1">{workerNameVal || "-"}</td>
            <td className="border-r border-black p-1 font-mono">{workTimeRange || "08:00 ~ 17:00"}</td>
            <td className="border-r border-black p-1 font-mono font-black">350</td>
            <td className="border-r border-black p-1 font-mono">1</td>
            <td className="p-1 font-mono">1</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const JointMaterialTable = ({
  jointMaterial = null,
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
          <td className="border-r border-black bg-[#fef9c3] p-1.5 w-[20%] text-center font-black">조인트 재료명</td>
          <td className="border-r border-black p-1.5 w-[30%] text-center font-black text-indigo-900">
            {jointMaterial?.gradeName || "-"}
          </td>
          <td className="border-r border-black bg-[#fef9c3] p-1.5 w-[20%] text-center font-black">재료 LOT NO.</td>
          <td className="p-1.5 w-[30%] text-center font-mono">
            {jointMaterial?.lotNo || "-"}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

export const InjectionTempTable = ({
  temps = [],
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
          <th colSpan={2} className="border-r border-black p-1 w-1/4">사출온도 구분</th>
          <th className="border-r border-black p-1">노즐(Nozzle)</th>
          <th className="border-r border-black p-1">실린더 1(N2)</th>
          <th className="border-r border-black p-1">실린더 2(H3)</th>
          <th className="p-1">실린더 3(H4)</th>
        </tr>
      </thead>
      <tbody>
        {temps.map((t, idx) => (
          <tr key={t.id || idx} className="border-b border-black">
            {idx === 0 && (
              <td rowSpan={3} className="border-r border-black bg-[#fef9c3]/40 p-1 font-black w-14">Sett'g</td>
            )}
            {idx === 3 && (
              <td rowSpan={3} className="border-r border-black bg-[#fef9c3]/40 p-1 font-black w-14">Actual</td>
            )}
            <td className="border-r border-black p-1 font-bold">{t.machine}</td>
            <td className="border-r border-black p-1 font-mono">{t.nozzle}</td>
            <td className="border-r border-black p-1 font-mono">{t.cyl1}</td>
            <td className="border-r border-black p-1 font-mono">{t.cyl2}</td>
            <td className="p-1 font-mono">{t.cyl3}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const InjectionConditionTable = ({
  conds = [],
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
          <th className="border-r border-black p-1 w-1/4">사출조건 항목</th>
          <th className="border-r border-black p-1 w-1/4">SPEC</th>
          <th className="border-r border-black p-1">초물(Start)</th>
          <th className="border-r border-black p-1">중물(Half)</th>
          <th className="p-1">종물(Finish)</th>
        </tr>
      </thead>
      <tbody>
        {conds.map((c, idx) => (
          <tr key={c.id || idx} className="border-b border-black">
            <td className="border-r border-black p-1 font-bold bg-slate-50">{c.name}</td>
            <td className="border-r border-black p-1 font-black text-indigo-900">{c.spec}</td>
            <td className="border-r border-black p-1 font-mono">{c.startVal}</td>
            <td className="border-r border-black p-1 font-mono">{c.halfVal}</td>
            <td className="p-1 font-mono">{c.finishVal}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const JointDefectMatrixTable = ({
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
          <th rowSpan={2} className="border-r border-black p-1 w-[22%]">공정불량 구분</th>
          <th colSpan={5} className="border-r border-black p-1">폐기불량 (FRT A/B/C · RR A/B)</th>
          <th colSpan={2} className="border-r border-black p-1">재조인트 (FRT/RR)</th>
          <th colSpan={2} className="p-1">공정간불량 (FRT/RR)</th>
        </tr>
        <tr className="bg-[#fef9c3]/60 border-b border-black text-[10px]">
          <th className="border-r border-black p-0.5">F-A</th>
          <th className="border-r border-black p-0.5">F-B</th>
          <th className="border-r border-black p-0.5">F-C</th>
          <th className="border-r border-black p-0.5">R-A</th>
          <th className="border-r border-black p-0.5">R-B</th>
          <th className="border-r border-black p-0.5">FRT</th>
          <th className="border-r border-black p-0.5">RR</th>
          <th className="border-r border-black p-0.5">FRT</th>
          <th className="p-0.5">RR</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx} className="border-b border-black">
            <td className="border-r border-black p-1 text-left px-2 font-bold">{r.name}</td>
            <td className="border-r border-black p-0.5 font-mono">{r.frtA || ""}</td>
            <td className="border-r border-black p-0.5 font-mono">{r.frtB || ""}</td>
            <td className="border-r border-black p-0.5 font-mono">{r.frtC || ""}</td>
            <td className="border-r border-black p-0.5 font-mono">{r.rrA || ""}</td>
            <td className="border-r border-black p-0.5 font-mono">{r.rrB || ""}</td>
            <td className="border-r border-black p-0.5 font-mono">{r.reworkFrt || ""}</td>
            <td className="border-r border-black p-0.5 font-mono">{r.reworkRr || ""}</td>
            <td className="border-r border-black p-0.5 font-mono">{r.processFrt || ""}</td>
            <td className="p-0.5 font-mono">{r.processRr || ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
