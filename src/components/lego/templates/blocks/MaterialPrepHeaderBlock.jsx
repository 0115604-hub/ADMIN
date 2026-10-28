import React from "react";

/**
 * MaterialPrepHeaderBlock
 * Work report A4 title banner, approval stamps table, date info, and basic worker/car model info table
 */
export const BasicInfoHeaderTable = ({
  carModelVal,
  partNameVal,
  processNameVal,
  workerNameVal,
  badgeText = "[블록 8] 작업 기본 정보 헤더",
  showBlockBadges = false
}) => (
  <div className="relative" key="basicInfo">
    {showBlockBadges && (
      <span className="absolute -top-2.5 left-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
        {badgeText}
      </span>
    )}
    <table className="w-full border-collapse border border-black text-xs font-bold">
      <tbody>
        <tr>
          <td className="border border-black bg-[#fef9c3] w-[11%] p-1 text-center font-bold">차종(Car model)</td>
          <td className="border border-black w-[15%] p-1 text-center font-black">{carModelVal}</td>
          <td className="border border-black bg-[#fef9c3] w-[11%] p-1 text-center font-bold">품 명(Part name)</td>
          <td className="border border-black w-[15%] p-1 text-center font-black">{partNameVal}</td>
          <td className="border border-black bg-[#fef9c3] w-[11%] p-1 text-center font-bold">공정명(Process)</td>
          <td className="border border-black w-[15%] p-1 text-center font-black text-indigo-900">{processNameVal}</td>
          <td className="border border-black bg-[#fef9c3] w-[10%] p-1 text-center font-bold">작업자(Worker)</td>
          <td className="border border-black w-[12%] p-1 text-center font-black">{workerNameVal}</td>
        </tr>
      </tbody>
    </table>
  </div>
);

export const MaterialPrepTitleApprovalBox = ({
  unifiedTitle = "소재준비작업일보",
  workerNameVal = "",
  workDateVal = ""
}) => {
  return (
    <>
      {/* Title & Approval Box */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 text-center pt-1">
          <h1 className="text-xl sm:text-2xl font-black text-black inline-block tracking-wider border-b-[3px] border-double border-black pb-0.5">
            {unifiedTitle}
          </h1>
        </div>
        <table className="border-collapse border border-black text-[11px] w-40 text-center font-bold shrink-0">
          <thead>
            <tr className="border-b border-black">
              <th className="border-r border-black py-0.5 w-1/3">작 성</th>
              <th className="border-r border-black py-0.5 w-1/3">검 토</th>
              <th className="py-0.5 w-1/3">승 인</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-10 text-slate-400">
              <td className="border-r border-black align-bottom pb-1 text-black font-black">{workerNameVal || "(인)"}</td>
              <td className="border-r border-black align-bottom pb-1">(인)</td>
              <td className="align-bottom pb-1">(인)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Work Date Meta Row */}
      <div className="flex items-center justify-between text-xs font-bold text-black pt-0.5">
        <span className="text-[11px] text-slate-700">※Record Time : Start / Half / Finish</span>
        <div className="text-[11px]">
          작업일자(Date) : {workDateVal || "20    년    월    일"}
        </div>
      </div>
    </>
  );
};
