import fs from "fs";
import { INITIAL_SMART_OVERTIME_DATA } from "../src/data/masterOvertimeSmartData.js";

const masterWorkers = INITIAL_SMART_OVERTIME_DATA.masterWorkers;
const cleanMatrix = masterWorkers.map((w, idx) => ({
  no: idx + 1,
  company: w.company,
  dept: w.dept,
  line: w.line,
  name: w.name,
  position: w.position || "작업원",
  daily: {}
}));

const cleanData = {
  year: 2026,
  month: 10,
  masterWorkers: masterWorkers,
  attendanceMatrix: cleanMatrix
};

const fileContent = `// 2026년 5개사 마스터 인원 명단 (5개사 143명 정밀 데이터 - 일자별 근태는 신규 등록 기준)
export const INITIAL_SMART_OVERTIME_DATA = ${JSON.stringify(cleanData, null, 2)};
`;

fs.writeFileSync("./src/data/masterOvertimeSmartData.js", fileContent, "utf-8");
console.log(`Successfully wrote clean masterOvertimeSmartData.js with ${masterWorkers.length} workers and empty daily matrix!`);
