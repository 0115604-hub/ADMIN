import { useMemo } from "react";
import { getOrderedBlocksForTemplate } from "./templateUtils";

export const MaterialPrepStandardA4Sheet = ({ template, showBlockBadges = false }) => {
  const cfg = template?.legoConfig || null;
  const orderedBlocks = useMemo(() => getOrderedBlocksForTemplate(template), [template]);
  const hasLegoBlocks = Boolean(cfg && cfg.activeBlocks && Object.keys(cfg.activeBlocks).length > 0);

  const rawTitle = cfg?.title || template?.title || "소재준비작업일보";
  const unifiedTitle =
    rawTitle === "소재 준비 작업 일보" || rawTitle === "소재 준비 작업 일보 (G/RUN)"
      ? "소재준비작업일보"
      : rawTitle;

  const carModelVal = cfg?.carModel || template?.carModel || "9BQC";
  const partNameVal = cfg?.partName || template?.partName || "G/RUN";
  const processNameVal = cfg?.processName || template?.processName || "소재준비";
  const workerNameVal = cfg?.workerName || template?.workerName || "";
  const workDateVal = cfg?.workDate || "";
  const workTimeRange =
    cfg?.startTime || cfg?.finishTime ? `${cfg?.startTime || "08:00"} ~ ${cfg?.finishTime || "17:00"}` : "";

  const specs =
    Array.isArray(cfg?.specsCutting) && cfg.specsCutting.length > 0
      ? cfg.specsCutting.map((s) => ({
          id: s.id,
          section: s.section,
          name: s.section,
          frtSpec: s.spec1,
          spec: s.spec1,
          startVal: s.start1,
          halfVal: s.half1,
          finishVal: s.finish1,
          lotStart: s.lotStart ?? s.lotNo,
          lotHalf: s.lotHalf ?? s.lotNo,
          lotFinish: s.lotFinish ?? s.lotNo
        }))
      : template?.specs || [];

  const defectCategories = template?.defectCategories || [];
  const extrusionItems = defectCategories[0]?.items || [
    "스코치(Scortch)",
    "외면 흠(Scratch)",
    "오염(Contamination)",
    "길이 미달(Length Bad)",
    "와이어 노출"
  ];
  const processItems = defectCategories[1]?.items || [
    "길이 (Length Bad)",
    "단컷팅(Step Cutt,g)",
    "기타 ( Etc )"
  ];

  // Basic Info Header Table (차종 -> 품명 -> 공정명 -> 작업자 -> 근무시간 순서)
  const renderBasicInfoHeader = (badgeText = "[블록 8] 작업 기본 정보 헤더") => (
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

  // Render an individual assembled Lego Block by key
  const renderAssembledBlock = (blockItem, orderIdx) => {
    const key = blockItem.key;
    const badgeLabel = `[조립 ${orderIdx + 1}] ${blockItem.label}`;

    if (key === "basicInfo") {
      return renderBasicInfoHeader(badgeLabel);
    }

    if (key === "workTimeOutput") {
      const rows = Array.isArray(cfg?.workTimeOutput) ? cfg.workTimeOutput : [];
      return (
        <div key={key} className="relative">
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
    }

    if (key === "specsCutting") {
      return (
        <div key={key} className="relative">
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
    }

    if (key === "stepCuttingFrt" || key === "stepCuttingRr") {
      const list = key === "stepCuttingFrt" ? cfg?.stepCuttingFrt || [] : cfg?.stepCuttingRr || [];
      const titleText = key === "stepCuttingFrt" ? "단컷팅 - FRT 구간 치수" : "단컷팅 - RR 구간 치수";
      return (
        <div key={key} className="relative">
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
    }

    if (key === "subMaterialLot") {
      return (
        <div key={key} className="relative">
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
                  {cfg?.subMaterialLot || "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "defectMaterialMatrix") {
      const rows = Array.isArray(cfg?.defectMaterialMatrix) ? cfg.defectMaterialMatrix : [];
      return (
        <div key={key} className="relative">
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
    }

    if (key === "defectSectionAbc") {
      const rows = Array.isArray(cfg?.defectSectionAbc) ? cfg.defectSectionAbc : [];
      return (
        <div key={key} className="relative">
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
    }

    if (key === "timeAndOutput") {
      return (
        <div key={key} className="relative">
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
    }

    if (key === "jointMaterial") {
      return (
        <div key={key} className="relative">
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
                  {cfg?.jointMaterial?.gradeName || "-"}
                </td>
                <td className="border-r border-black bg-[#fef9c3] p-1.5 w-[20%] text-center font-black">재료 LOT NO.</td>
                <td className="p-1.5 w-[30%] text-center font-mono">
                  {cfg?.jointMaterial?.lotNo || "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "injectionTemp") {
      const temps = Array.isArray(cfg?.injectionTemps) ? cfg.injectionTemps : [];
      return (
        <div key={key} className="relative">
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
    }

    if (key === "injectionCondition") {
      const conds = Array.isArray(cfg?.injectionConditions) ? cfg.injectionConditions : [];
      return (
        <div key={key} className="relative">
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
    }

    if (key === "jointDefectMatrix") {
      const rows = Array.isArray(cfg?.jointDefects) ? cfg.jointDefects : [];
      return (
        <div key={key} className="relative">
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
    }

    if (key === "drawingSpecCheck") {
      const rows = Array.isArray(cfg?.drawingSpecs) ? cfg.drawingSpecs : [];
      return (
        <div key={key} className="relative">
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
    }

    if (key === "rightAngleMatrix") {
      const machines = Array.isArray(cfg?.machines) ? cfg.machines : [];
      return (
        <div key={key} className="relative">
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
    }

    if (key === "frtRightAngleDefects") {
      const rows = Array.isArray(cfg?.frtRightAngleDefects) ? cfg.frtRightAngleDefects : [];
      return (
        <div key={key} className="relative">
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
    }

    if (key === "remarks") {
      return (
        <div key={key} className="relative">
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
                  {cfg?.remarks || ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "downtimeDefectPanel") {
      const events = Array.isArray(cfg?.downtimeEvents) ? cfg.downtimeEvents : [];
      return (
        <div key={key} className="relative">
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
    }

    // Custom Photo-Analyzed Block (custom_*)
    if (blockItem.isCustom) {
      const cb = blockItem.customData || {};
      const tbl = cfg?.customBlockTables?.[key];
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
        <div key={key} className="relative">
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
    }

    return null;
  };

  return (
    <div className="w-full bg-white text-black p-4 sm:p-6 border-2 border-black font-sans text-xs space-y-2.5 select-text">
      {/* Title & Approval Box (상단 제목 한 줄 통일: 소재준비작업일보) */}
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

      {/* Work Date Meta Row (공정명 중복 줄 제거 -> 기본정보 헤더의 차종·품명·공정명 순으로 일원화) */}
      <div className="flex items-center justify-between text-xs font-bold text-black pt-0.5">
        <span className="text-[11px] text-slate-700">※Record Time : Start / Half / Finish</span>
        <div className="text-[11px]">
          작업일자(Date) : {workDateVal || "20    년    월    일"}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* CASE A: 레고 블록 조합기에서 조립·설계한 블록이 있는 경우 (100% 순서/구현 일치) */}
      {/* ==================================================================== */}
      {hasLegoBlocks ? (
        <div className="space-y-2.5">
          {!cfg?.activeBlocks?.basicInfo && renderBasicInfoHeader()}
          {orderedBlocks
            .filter((b) => Boolean(cfg?.activeBlocks?.[b.key]))
            .map((b, idx) => renderAssembledBlock(b, idx))}
        </div>
      ) : (
        /* ==================================================================== */
        /* CASE B: 레거시 양식 호환 렌더링 */
        /* ==================================================================== */
        <div className="space-y-2.5">
          {renderBasicInfoHeader()}

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
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-black text-black">
        <span>{cfg?.formNo || template?.formNo || "705-02(REV.4)"}</span>
        <span className="font-black text-sm">{cfg?.companyName || template?.companyName || "(주)오륙"}</span>
        <span>A4(210×297)</span>
      </div>
    </div>
  );
};

// ============================================================================
// Lego Template Editor Modal (Lego Blocks + Real-time live A4 Sheet)
// ============================================================================

export default MaterialPrepStandardA4Sheet;
