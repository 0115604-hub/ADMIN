import React, { useMemo } from "react";
import { getOrderedBlocksForTemplate } from "./templateUtils";
import {
  BasicInfoHeaderTable,
  MaterialPrepTitleApprovalBox
} from "./blocks/MaterialPrepHeaderBlock";
import {
  SpecsCuttingTable,
  StepCuttingTable,
  SubMaterialLotTable,
  DrawingSpecCheckTable
} from "./blocks/MaterialPrepCuttingSpecsBlock";
import {
  WorkTimeOutputTable,
  TimeAndOutputTable,
  JointMaterialTable,
  InjectionTempTable,
  InjectionConditionTable,
  JointDefectMatrixTable
} from "./blocks/MaterialPrepMoldingJointBlock";
import {
  DefectMaterialMatrixTable,
  DefectSectionAbcTable,
  RightAngleMatrixTable,
  FrtRightAngleDefectsTable,
  RemarksTable,
  DowntimeDefectPanelTable,
  CustomAnalyzedBlockTable
} from "./blocks/MaterialPrepDefectsInspectionBlock";
import MaterialPrepLegacyFallbackBlock from "./blocks/MaterialPrepLegacyFallbackBlock";

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

  const renderBasicHeader = (badgeText = "[블록 8] 작업 기본 정보 헤더") => (
    <BasicInfoHeaderTable
      carModelVal={carModelVal}
      partNameVal={partNameVal}
      processNameVal={processNameVal}
      workerNameVal={workerNameVal}
      badgeText={badgeText}
      showBlockBadges={showBlockBadges}
    />
  );

  // Render an individual assembled Lego Block by key
  const renderAssembledBlock = (blockItem, orderIdx) => {
    const key = blockItem.key;
    const badgeLabel = `[조립 ${orderIdx + 1}] ${blockItem.label}`;

    if (key === "basicInfo") {
      return renderBasicHeader(badgeLabel);
    }

    if (key === "workTimeOutput") {
      const rows = Array.isArray(cfg?.workTimeOutput) ? cfg.workTimeOutput : [];
      return (
        <WorkTimeOutputTable
          key={key}
          rows={rows}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    if (key === "specsCutting") {
      return (
        <SpecsCuttingTable
          key={key}
          specs={specs}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    if (key === "stepCuttingFrt" || key === "stepCuttingRr") {
      const list = key === "stepCuttingFrt" ? cfg?.stepCuttingFrt || [] : cfg?.stepCuttingRr || [];
      const titleText = key === "stepCuttingFrt" ? "단컷팅 - FRT 구간 치수" : "단컷팅 - RR 구간 치수";
      return (
        <StepCuttingTable
          key={key}
          list={list}
          titleText={titleText}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    if (key === "subMaterialLot") {
      return (
        <SubMaterialLotTable
          key={key}
          lotValue={cfg?.subMaterialLot || "-"}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    if (key === "defectMaterialMatrix") {
      const rows = Array.isArray(cfg?.defectMaterialMatrix) ? cfg.defectMaterialMatrix : [];
      return (
        <DefectMaterialMatrixTable
          key={key}
          rows={rows}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    if (key === "defectSectionAbc") {
      const rows = Array.isArray(cfg?.defectSectionAbc) ? cfg.defectSectionAbc : [];
      return (
        <DefectSectionAbcTable
          key={key}
          rows={rows}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    if (key === "timeAndOutput") {
      return (
        <TimeAndOutputTable
          key={key}
          workerNameVal={workerNameVal}
          workTimeRange={workTimeRange}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    if (key === "jointMaterial") {
      return (
        <JointMaterialTable
          key={key}
          jointMaterial={cfg?.jointMaterial}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    if (key === "injectionTemp") {
      const temps = Array.isArray(cfg?.injectionTemps) ? cfg.injectionTemps : [];
      return (
        <InjectionTempTable
          key={key}
          temps={temps}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    if (key === "injectionCondition") {
      const conds = Array.isArray(cfg?.injectionConditions) ? cfg.injectionConditions : [];
      return (
        <InjectionConditionTable
          key={key}
          conds={conds}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    if (key === "jointDefectMatrix") {
      const rows = Array.isArray(cfg?.jointDefects) ? cfg.jointDefects : [];
      return (
        <JointDefectMatrixTable
          key={key}
          rows={rows}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    if (key === "drawingSpecCheck") {
      const rows = Array.isArray(cfg?.drawingSpecs) ? cfg.drawingSpecs : [];
      return (
        <DrawingSpecCheckTable
          key={key}
          rows={rows}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    if (key === "rightAngleMatrix") {
      const machines = Array.isArray(cfg?.machines) ? cfg.machines : [];
      return (
        <RightAngleMatrixTable
          key={key}
          machines={machines}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    if (key === "frtRightAngleDefects") {
      const rows = Array.isArray(cfg?.frtRightAngleDefects) ? cfg.frtRightAngleDefects : [];
      return (
        <FrtRightAngleDefectsTable
          key={key}
          rows={rows}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    if (key === "remarks") {
      return (
        <RemarksTable
          key={key}
          remarks={cfg?.remarks}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    if (key === "downtimeDefectPanel") {
      const events = Array.isArray(cfg?.downtimeEvents) ? cfg.downtimeEvents : [];
      return (
        <DowntimeDefectPanelTable
          key={key}
          events={events}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    // Custom Photo-Analyzed Block (custom_*)
    if (blockItem.isCustom) {
      return (
        <CustomAnalyzedBlockTable
          key={key}
          blockItem={blockItem}
          cfg={cfg}
          badgeLabel={badgeLabel}
          showBlockBadges={showBlockBadges}
        />
      );
    }

    return null;
  };

  return (
    <div className="w-full bg-white text-black p-4 sm:p-6 border-2 border-black font-sans text-xs space-y-2.5 select-text">
      {/* Title & Approval Box */}
      <MaterialPrepTitleApprovalBox
        unifiedTitle={unifiedTitle}
        workerNameVal={workerNameVal}
        workDateVal={workDateVal}
      />

      {/* CASE A: 레고 블록 조합기에서 조립·설계한 블록이 있는 경우 */}
      {hasLegoBlocks ? (
        <div className="space-y-2.5">
          {!cfg?.activeBlocks?.basicInfo && renderBasicHeader()}
          {orderedBlocks
            .filter((b) => Boolean(cfg?.activeBlocks?.[b.key]))
            .map((b, idx) => renderAssembledBlock(b, idx))}
        </div>
      ) : (
        /* CASE B: 레거시 양식 호환 렌더링 */
        <div className="space-y-2.5">
          {renderBasicHeader()}
          <MaterialPrepLegacyFallbackBlock
            template={template}
            specs={specs}
            extrusionItems={extrusionItems}
            processItems={processItems}
            showBlockBadges={showBlockBadges}
          />
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

export default MaterialPrepStandardA4Sheet;
