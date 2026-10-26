/**
 * 초·중·종물 검사 기록 여부 판정 유틸리티
 * 압출동, 가공동, 한울, 부림텍, 유성 5개사 전 공정 공통 적용
 */

// 🚀 WeakMap 캐싱 적용으로 테이블 렌더링 시 중복 연산 및 GC 오버헤드 영구 제거
const sampleStatusCache = new WeakMap();

export const getSampleInspectionStatus = (report) => {
  if (!report || typeof report !== "object") {
    return {
      hasAny: false,
      isComplete: false,
      start: false,
      mid: false,
      end: false,
      summary: "미기록"
    };
  }

  const cached = sampleStatusCache.get(report);
  if (cached) return cached;

  // 1. 명시적 완료 플래그
  if (report.sampleInspectionCompleted || report.isSampleCompleted) {
    return {
      hasAny: true,
      isComplete: true,
      start: true,
      mid: true,
      end: true,
      summary: "초물(OK) • 중물(OK) • 종물(OK)"
    };
  }

  // 2. measurements / dimensions 검사 데이터 추출
  const dataObj = report.measurements || report.dimensions || {};
  let hasStart = false;
  let hasMid = false;
  let hasEnd = false;

  Object.values(dataObj).forEach((val) => {
    if (val && typeof val === "object") {
      if (val.start !== undefined && String(val.start).trim() !== "") hasStart = true;
      if (val.mid !== undefined && String(val.mid).trim() !== "") hasMid = true;
      if (val.end !== undefined && String(val.end).trim() !== "") hasEnd = true;
    }
  });

  // 3. materialLot / cuttingLot
  const lotObj = report.materialLot || report.cuttingLot || {};
  Object.values(lotObj).forEach((val) => {
    if (val && typeof val === "object") {
      if (val.start && String(val.start).trim() !== "") hasStart = true;
      if (val.mid && String(val.mid).trim() !== "") hasMid = true;
      if (val.end && String(val.end).trim() !== "") hasEnd = true;
    }
  });

  // 4. sampleMeasurements / inspections
  if (report.sampleMeasurements || report.inspections) {
    const insp = report.sampleMeasurements || report.inspections || {};
    if (insp.start) hasStart = true;
    if (insp.mid) hasMid = true;
    if (insp.end) hasEnd = true;
  }

  const isComplete = hasStart && hasMid && hasEnd;
  const hasAny = hasStart || hasMid || hasEnd;

  let summary = "미기록";
  if (isComplete) {
    summary = "초물(OK) • 중물(OK) • 종물(OK)";
  } else if (hasStart && hasMid) {
    summary = "초물(OK) • 중물(OK) • 종물(대기)";
  } else if (hasStart) {
    summary = "초물(OK) • 중물(대기) • 종물(대기)";
  }

  const result = {
    hasAny,
    isComplete,
    start: hasStart,
    mid: hasMid,
    end: hasEnd,
    summary
  };
  sampleStatusCache.set(report, result);
  return result;
};

/**
 * 당일 등록된 작업일보 목록 전체를 종합하여 초·중·종물 완료 상태 판정
 */
export const getOverallDaySampleStatus = (reportsList, todayStr) => {
  const todayReports = (reportsList || []).filter((r) => r && r.date === todayStr);

  if (todayReports.length === 0) {
    return {
      todayReportsCount: 0,
      hasAny: false,
      isComplete: false,
      start: false,
      mid: false,
      end: false,
      summary: "초물(대기) • 중물(대기) • 종물(대기)"
    };
  }

  let anyComplete = false;
  let hasStart = false;
  let hasMid = false;
  let hasEnd = false;

  todayReports.forEach((rep) => {
    const status = getSampleInspectionStatus(rep);
    if (status.isComplete) anyComplete = true;
    if (status.start) hasStart = true;
    if (status.mid) hasMid = true;
    if (status.end) hasEnd = true;
  });

  const isComplete = anyComplete || (hasStart && hasMid && hasEnd);
  let summary = "미기록";
  if (isComplete) {
    summary = "초물(OK) • 중물(OK) • 종물(OK)";
  } else if (hasStart && hasMid) {
    summary = "초물(OK) • 중물(OK) • 종물(대기)";
  } else if (hasStart) {
    summary = "초물(OK) • 중물(대기) • 종물(대기)";
  } else {
    summary = "초물(대기) • 중물(대기) • 종물(대기)";
  }

  return {
    todayReportsCount: todayReports.length,
    hasAny: hasStart || hasMid || hasEnd,
    isComplete,
    start: hasStart,
    mid: hasMid,
    end: hasEnd,
    summary
  };
};
