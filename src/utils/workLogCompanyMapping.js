/**
 * workLogCompanyMapping.js
 * 5개사(오륙, 유성, 조영, 한울, 부림텍) 및 본사 작업일보 독립 매핑 유틸리티
 * (100줄 이하 초경량 독립 모듈)
 */

export const WORK_LOG_COMPANIES = ["전체", "오륙", "유성", "조영", "한울", "부림텍", "본사"];

export const WRITER_COMPANY_MAP = {
  // 본사
  "권태형": { company: "본사", plant: "본사" },
  "최미영": { company: "본사", plant: "본사" },
  // 삼랑진공장 - (주)오륙
  "이명재": { company: "오륙", plant: "삼랑진공장" },
  "설유철": { company: "오륙", plant: "삼랑진공장" },
  "윤경수": { company: "오륙", plant: "삼랑진공장" },
  "이창엽": { company: "오륙", plant: "삼랑진공장" },
  "전재율": { company: "오륙", plant: "삼랑진공장" },
  "양인나": { company: "오륙", plant: "삼랑진공장" },
  "유동길": { company: "오륙", plant: "삼랑진공장" },
  "조인주": { company: "오륙", plant: "삼랑진공장" },
  "이상기": { company: "오륙", plant: "삼랑진공장" },
  // 삼랑진공장 - 유성
  "유성": { company: "유성", plant: "삼랑진공장" },
  // 한림공장 - (주)조영산업
  "김동욱": { company: "조영", plant: "한림공장" },
  "오상민": { company: "조영", plant: "한림공장" },
  "정현규": { company: "조영", plant: "한림공장" },
  "TEST": { company: "조영", plant: "한림공장" },
  // 한림공장 - 한울
  "한울": { company: "한울", plant: "한림공장" },
  // 한림공장 - 부림텍
  "부림텍": { company: "부림텍", plant: "한림공장" }
};

/**
 * 일보 객체로부터 확정된 { company, plant } 추출 (기존 null/미입력 데이터 자동 보정)
 */
export const resolveWorkLogAffiliation = (log) => {
  if (!log || typeof log !== "object") {
    return { company: "오륙", plant: "삼랑진공장" };
  }

  const writer = String(log.writer || log.author || "").trim();
  const rawComp = String(log.company || "").replace(/[(주)]/g, "").trim();

  // 1. 이미 명시된 회사가 유효한 경우
  if (rawComp && (rawComp === "오륙" || rawComp === "유성" || rawComp === "조영" || rawComp === "한울" || rawComp === "부림텍" || rawComp === "본사")) {
    const defaultPlant = rawComp === "본사" ? "본사" : (rawComp === "조영" || rawComp === "한울" || rawComp === "부림텍") ? "한림공장" : "삼랑진공장";
    return { company: rawComp, plant: log.plant || defaultPlant };
  }

  // 2. 작성자 매핑 기준
  if (WRITER_COMPANY_MAP[writer]) {
    return { ...WRITER_COMPANY_MAP[writer] };
  }

  // 3. 공장 기준 Fallback
  const plant = log.plant || log.approverPlant || "";
  if (plant.includes("한림")) {
    return { company: "조영", plant: "한림공장" };
  }
  if (plant.includes("본사") || log.department === "본사 관리팀") {
    return { company: "본사", plant: "본사" };
  }

  return { company: "오륙", plant: "삼랑진공장" };
};
