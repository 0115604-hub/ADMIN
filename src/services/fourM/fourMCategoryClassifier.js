/**
 * fourMCategoryClassifier.js
 * Rule-based & heuristic classifier for 4M categories (Man, Machine, Material, Method).
 * Checks overrides, explicit record attributes, defect keywords, maintenance tags, etc.
 */

import { getFourMOverrides } from "./fourMConstants";

/**
 * 🌟 4M 변동점 카테고리(Man, Machine, Material, Method) 지능형 자동 판별
 * 판별 우선순위:
 * 1. 관리자 수동 재분류(오버라이드) 맵
 * 2. 항목 객체에 명시된 수동 4M 설정
 * 3. 텍스트 키워드 기반 분류:
 *   - 가류조, 온조기, 압출기, 모터, RPM, 설비 등: Machine
 *   - 코팅, 클립, 원료, 배합, 원자재, 소재, 스크래치, 기포 등: Material
 *   - 결근, 인원, 대체, 교대 등: Man
 *   - 작업표준, 조건, 공정, 레시피 등: Method
 */
export const determineFourMCategory = (item) => {
  if (!item) return "Method";

  // 1. 관리자 수동 재분류(Override) 맵 확인
  const overrides = getFourMOverrides();
  const possibleIds = [
    item.id,
    item.originalId,
    item.rawId,
    item.raw?.id,
    item._docId,
    item.customId
  ].filter(Boolean);

  for (const rawKey of possibleIds) {
    const sId = String(rawKey).trim();
    if (overrides[sId] && ["Machine", "Man", "Material", "Method"].includes(overrides[sId])) {
      return overrides[sId];
    }
    const cleanId = sId
      .replace(/^ledger_/, "")
      .replace(/^urg_/, "")
      .replace(/^ext_q_/, "")
      .replace(/^hanul_q_/, "")
      .replace(/^ys_q_/, "")
      .replace(/^mach_q_/, "");
    if (cleanId && overrides[cleanId] && ["Machine", "Man", "Material", "Method"].includes(overrides[cleanId])) {
      return overrides[cleanId];
    }
  }

  // 2. 항목 객체에 명시된 수동 4M 설정 확인
  if (item.manualFourM && ["Machine", "Man", "Material", "Method"].includes(item.manualFourM)) {
    return item.manualFourM;
  }
  if (item.isManualFourM && item.fourM && ["Machine", "Man", "Material", "Method"].includes(item.fourM)) {
    return item.fourM;
  }
  if (item.isOfficialLedger && item.fourM && ["Machine", "Man", "Material", "Method"].includes(item.fourM)) {
    return item.fourM;
  }

  const text = `${item.title || ""} ${item.content || ""} ${item.defectType || ""} ${item.details || ""} ${item.line || ""} ${item.origin || ""} ${item.category || ""}`.toLowerCase();

  // 1. Man (결근, 대체투입, 작업자 교체 등 인원 변동)
  if (
    text.includes("결근") ||
    text.includes("대체투입") ||
    text.includes("대체 투입") ||
    text.includes("인원교체") ||
    text.includes("작업자교체") ||
    text.includes("작업자 변경") ||
    text.includes("작업자변경") ||
    text.includes("신규 작업자") ||
    text.includes("신규작업자") ||
    text.includes("신규 투입") ||
    text.includes("신규투입") ||
    text.includes("작업 실수") ||
    text.includes("작업자 부주의") ||
    text.includes("미숙련") ||
    text.includes("휴가") ||
    (text.includes("인원") && (text.includes("부족") || text.includes("변동") || text.includes("대체")))
  ) {
    return "Man";
  }

  // 2. Machine (가류조, 온조기, 압출기, 모터, RPM, 설비, 머신 등)
  if (
    text.includes("가류조") ||
    text.includes("온조기") ||
    text.includes("압출기") ||
    text.includes("인취기") ||
    text.includes("머신기") ||
    text.includes("머신") ||
    text.includes("설비") ||
    text.includes("기계") ||
    text.includes("금형") ||
    text.includes("치구") ||
    text.includes("로봇") ||
    text.includes("모터") ||
    text.includes("rpm") ||
    text.includes("히터") ||
    text.includes("센서") ||
    text.includes("칠러") ||
    text.includes("수리") ||
    text.includes("tpm") ||
    text.includes("정비") ||
    text.includes("보전") ||
    text.includes("단선") ||
    text.includes("누유") ||
    text.includes("과열") ||
    text.includes("라인정지")
  ) {
    return "Machine";
  }

  // 3. Material (코팅, 클립, 원료, 배합, 고무, 원자재, 소재, 불량 등)
  if (
    text.includes("코팅") ||
    text.includes("클립") ||
    text.includes("원료") ||
    text.includes("배합") ||
    text.includes("원자재") ||
    text.includes("소재") ||
    text.includes("불량") ||
    text.includes("이물") ||
    text.includes("스크래치") ||
    text.includes("기포") ||
    text.includes("누락") ||
    text.includes("치수") ||
    text.includes("박리") ||
    text.includes("테이프") ||
    text.includes("본드") ||
    text.includes("철심") ||
    text.includes("고무") ||
    text.includes("도포") ||
    text.includes("단면") ||
    text.includes("탄화") ||
    text.includes("스코치") ||
    text.includes("nct") ||
    text.includes("선별")
  ) {
    return "Material";
  }

  // 4. Method
  return "Method";
};
