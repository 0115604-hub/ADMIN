import {
  DEFAULT_DEFECT_CATEGORIES,
  HANUL_SPECS
} from "../../services/hanulWorkReportService";

export const BLADE_RESET_KEY = "hanul_9bqc_blade_reset_info";
export const BLADE_LIMIT = 50000;

export const isHanulTpmAlreadyDone = (targetDate, targetWorker, allReports = [], editReport = null) => {
  if (!targetDate || !targetWorker) return false;
  try {
    const cleanW = String(targetWorker).trim();
    const key = `hanul_tpm_done_${targetDate}_${cleanW}`;
    if (typeof window !== "undefined" && window.localStorage && localStorage.getItem(key) === "true") return true;
    if (editReport && editReport.tpmStatus === "완료") return true;
    if (Array.isArray(allReports) && allReports.length > 0) {
      const found = allReports.some(
        (r) => r && r.date === targetDate && String(r.worker || "").includes(cleanW) && r.tpmStatus === "완료"
      );
      if (found) return true;
    }
  } catch (e) {
    console.warn("isHanulTpmAlreadyDone error:", e);
  }
  return false;
};

export const getDefectKeysForProcess = ({ project, processId, subProcess, jointType, inspectionType }) => {
  let key;
  if (processId === "소재준비") {
    key = `${project}_소재준비_${subProcess}`;
  } else if (processId === "조인트") {
    key = `${project}_조인트_${jointType}`;
  } else if (processId === "검사") {
    key = `${project}_검사_${inspectionType}`;
  } else {
    key = `${project}_${processId}`;
  }
  return (
    DEFAULT_DEFECT_CATEGORIES[key] ||
    DEFAULT_DEFECT_CATEGORIES[`${project}_${processId}`] ||
    DEFAULT_DEFECT_CATEGORIES["9BQC_검사"] ||
    DEFAULT_DEFECT_CATEGORIES["9BQC_조인트"] ||
    []
  );
};

export const getSpecsForProcess = ({ project, processId, subProcess, jointType, inspectionType, cuttingPart }) => {
  let key;
  if (processId === "소재준비") {
    key = `${project}_소재준비_${subProcess}`;
  } else if (processId === "조인트") {
    key = `${project}_조인트_${jointType}`;
  } else if (processId === "검사") {
    key = `${project}_검사_${inspectionType}`;
  } else {
    key = `${project}_${processId}`;
  }
  const specs = HANUL_SPECS[key] || HANUL_SPECS[`${project}_${processId}`] || [];
  if (processId === "소재준비" && subProcess === "정치절단") {
    return cuttingPart === "RR"
      ? specs.filter((s) => s.key.startsWith("rr"))
      : specs.filter((s) => s.key.startsWith("frt"));
  }
  return specs;
};

export const getInspColumnsForType = (inspectionType) => {
  if (inspectionType === "SQUARE") {
    return [
      { key: "col1", title: "LH 2호기", sub: "RR LH" },
      { key: "col2", title: "LH 3호기", sub: "RR LH" },
      { key: "col3", title: "RH 2호기", sub: "RR RH" },
      { key: "col4", title: "RH 3호기", sub: "RR RH" }
    ];
  }
  if (inspectionType === "FINAL_LH") {
    return [
      { key: "col1", title: "LH 1호기 (PRI)", sub: "RR LH" },
      { key: "col2", title: "LH 1호기 (TIN)", sub: "RR LH" },
      { key: "col3", title: "LH 2호기 (PRI)", sub: "RR LH" },
      { key: "col4", title: "LH 2호기 (TIN)", sub: "RR LH" }
    ];
  }
  return [
    { key: "col1", title: "RR LH (PRI)", sub: "PRIVACY" },
    { key: "col2", title: "RR LH (TIN)", sub: "TINTED" },
    { key: "col3", title: "RR RH (PRI)", sub: "PRIVACY" },
    { key: "col4", title: "RR RH (TIN)", sub: "TINTED" }
  ];
};

export const calculateTotals = ({
  production,
  defects,
  processId,
  subProcess,
  inspProduction,
  inspectionType,
  cuttingPart
}) => {
  let genuine = 0;
  let bad = 0;
  let rework = 0;

  if (processId === "검사") {
    const cols = Object.values(inspProduction || {});
    genuine = cols.reduce((acc, c) => acc + (Number(c.genuine) || 0), 0);
    const scrap = cols.reduce((acc, c) => acc + (Number(c.scrap) || 0), 0);
    rework = cols.reduce((acc, c) => {
      if (String(inspectionType).includes("FINAL")) {
        return acc + (Number(c.reworkDv) || 0) + (Number(c.reworkAngle) || 0);
      }
      return acc + (Number(c.rework) || 0);
    }, 0);
    const inspTotal = cols.reduce((acc, c) => acc + (Number(c.insp) || 0), 0);
    const defectSum = Object.values(defects || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
    const finalBad = Math.max(scrap, defectSum);
    const gross = inspTotal > 0 ? inspTotal : (genuine + finalBad);
    const yieldRate = gross > 0 ? ((genuine / gross) * 100).toFixed(1) : "100.0";
    const defectRate = gross > 0 ? ((finalBad / gross) * 100).toFixed(1) : "0.0";

    return { genuine, bad: finalBad, rework, gross, yieldRate, defectRate, defectSum, scrap };
  }

  const lhGenuine = (Number(production?.genuineLH) || 0) + (Number(production?.genuineRH) || 0);
  const lhBad = (Number(production?.badLH) || 0) + (Number(production?.badRH) || 0);
  const lhRework = (Number(production?.reworkLH) || 0) + (Number(production?.reworkRH) || 0);

  const cuttingGenuine = cuttingPart === "RR"
    ? (Number(production?.genuineA) || 0) + (Number(production?.genuineB) || 0)
    : (Number(production?.genuineA) || 0) + (Number(production?.genuineB) || 0) + (Number(production?.genuineC) || 0);
  const cuttingBad = cuttingPart === "RR"
    ? (Number(production?.badA) || 0) + (Number(production?.badB) || 0)
    : (Number(production?.badA) || 0) + (Number(production?.badB) || 0) + (Number(production?.badC) || 0);

  const abcGenuine = (Number(production?.genuineA) || 0) + (Number(production?.genuineB) || 0) + (Number(production?.genuineC) || 0);
  const abcBad = (Number(production?.badA) || 0) + (Number(production?.badB) || 0) + (Number(production?.badC) || 0);

  if (processId === "소재준비" && subProcess === "정치절단") {
    genuine = cuttingGenuine;
    bad = cuttingBad;
  } else {
    if (lhGenuine > 0 || lhBad > 0 || abcGenuine === 0) {
      genuine = lhGenuine;
      bad = lhBad;
      rework = lhRework;
    } else {
      genuine = abcGenuine;
      bad = abcBad;
    }
  }

  const defectSum = Object.values(defects || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const finalBad = Math.max(bad, defectSum);
  const gross = genuine + finalBad;
  const yieldRate = gross > 0 ? ((genuine / gross) * 100).toFixed(1) : "100.0";
  const defectRate = gross > 0 ? ((finalBad / gross) * 100).toFixed(1) : "0.0";

  return { genuine, bad: finalBad, rework, gross, yieldRate, defectRate, defectSum };
};
