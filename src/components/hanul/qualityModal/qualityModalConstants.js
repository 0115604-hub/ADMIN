import { MACHINING_QUALITY_PROJECTS } from "../../../services/machiningQualityIssueService";

export const ORYUK_PROCESSES = [
  ...MACHINING_QUALITY_PROJECTS,
  { id: "ext_line", name: "압출/성형 라인", badge: "압출", color: "teal" },
  { id: "sam_all", name: "삼랑진공장 (전체)", badge: "전체", color: "blue" }
];

export const JOYOUNG_PROCESSES = [
  { id: "hal_all", name: "한림공장 (전체)", badge: "전체", color: "blue" },
  { id: "joyoung_common", name: "한림공장 조영 (공통)", badge: "조영", color: "purple" },
  { id: "9bqc", name: "9BQC (G/RUN)", badge: "9BQC", color: "indigo" },
  { id: "lq2", name: "LQ2 (Hood Side)", badge: "LQ2", color: "purple" },
  { id: "lq2a", name: "LQ2a (Hood Side)", badge: "LQ2a", color: "pink" },
  { id: "burim", name: "부림텍 가공/협력업체", badge: "부림텍", color: "emerald" }
];

export const BURIMTECH_PROCESSES = [
  { id: "lq2", name: "LQ2 (Hood Side)", badge: "LQ2", color: "emerald" },
  { id: "9bqc", name: "9BQC (G/RUN)", badge: "9BQC", color: "teal" },
  { id: "lq2a", name: "LQ2a (Hood Side)", badge: "LQ2a", color: "pink" },
  { id: "burim_common", name: "부림텍 협력업체 (공통)", badge: "부림텍", color: "emerald" }
];
