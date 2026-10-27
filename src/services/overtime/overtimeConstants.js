/**
 * Overtime Constants, Korean Holidays & Company Definitions
 */
export const COMPANIES = ["오륙", "유성", "조영", "한울", "부림텍"];

export const getReportDateSortKey = (report) => {
  if (!report) return "0000-00-00";
  const rawDate = report.workDate || "";
  if (rawDate) {
    const match = String(rawDate).match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (match) {
      const y = match[1] || "2026";
      const m = String(parseInt(match[2], 10)).padStart(2, "0");
      const d = String(parseInt(match[3], 10)).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  const raw = String(report.workDateFormatted || report.title || "");
  const match2 = raw.match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
  if (match2) {
    const y = match2[1] || "2026";
    const m = String(parseInt(match2[2], 10)).padStart(2, "0");
    const d = String(parseInt(match2[3], 10)).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "2026-10-01";
};

export const cleanCompanyName = (comp) => {
  if (!comp) return "오륙";
  const str = String(comp).trim();
  if (str.includes("오륙")) return "오륙";
  if (str.includes("조영")) return "조영";
  if (str.includes("유성")) return "유성";
  if (str.includes("한울")) return "한울";
  if (str.includes("부림")) return "부림텍";
  return str.replace(/^\(주\)\s*/, "").replace(/주식회사\s*/, "").replace(/산업$/, "").trim();
};

export const DEPARTMENTS = ["생산팀", "압출관리팀", "가공관리팀", "품질관리팀", "설비보전팀", "물류팀", "관리팀"];

export const normalizeDept = (dept) => {
  if (!dept) return "생산팀";
  const str = String(dept).trim();
  if (DEPARTMENTS.includes(str)) return str;
  if (str === "물류팀" || str === "물류" || str.includes("물류") || str.includes("출하") || str.includes("창고") || str.includes("자재")) return "물류팀";
  if (str === "설비보전팀" || str === "설비보전" || str === "설비팀" || str === "보전팀" || str === "공무팀" || str.includes("설비") || str.includes("보전") || str.includes("공무")) return "설비보전팀";
  if (str === "품질관리팀" || str === "품질팀" || str === "품질부" || str.includes("품질")) return "품질관리팀";
  if (str === "생산팀" || str === "생산") return "생산팀";
  if (str === "압출관리팀" || str === "압출동" || (str.includes("압출") && !str.includes("생산"))) return "압출관리팀";
  if (str === "가공관리팀" || str === "가공동" || str.includes("가공") || str.includes("프레스") || str.includes("용접") || str.includes("성형") || str.includes("도장") || str.includes("조인트") || str.includes("사상") || str.includes("코팅")) return "가공관리팀";
  if (str === "관리팀" || str === "관리부" || str.includes("관리") || str.includes("총무") || str.includes("총괄") || str.includes("기술") || str.includes("경영") || str.includes("회계")) return "관리팀";
  if (str.includes("생산")) return "생산팀";
  return "생산팀";
};

export const KOREAN_PUBLIC_HOLIDAYS_2026 = new Set([
  "2026-01-01", // 신정
  "2026-02-16", "2026-02-17", "2026-02-18", // 설날 연휴
  "2026-03-01", "2026-03-02", // 삼일절 및 대체공휴일
  "2026-05-05", // 어린이날
  "2026-05-24", "2026-05-25", // 부처님오신날 및 대체공휴일
  "2026-06-03", // 제9회 전국동시지방선거
  "2026-06-06", // 현충일
  "2026-08-15", "2026-08-17", // 광복절 및 대체공휴일
  "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27", // 추석 연휴 및 대체공휴일
  "2026-10-03", "2026-10-05", // 개천절 및 대체공휴일
  "2026-10-09", // 한글날
  "2026-12-25"  // 성탄절
]);

export const KOREAN_HOLIDAY_NAMES_2026 = {
  "2026-01-01": "신정",
  "2026-02-16": "설날 전날",
  "2026-02-17": "설날",
  "2026-02-18": "설날 다음날",
  "2026-03-01": "3·1절",
  "2026-03-02": "3·1절 대체공휴일",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-05-25": "부처님오신날 대체공휴일",
  "2026-06-03": "지방선거",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-08-17": "광복절 대체공휴일",
  "2026-09-24": "추석 전날",
  "2026-09-25": "추석",
  "2026-09-26": "추석 다음날",
  "2026-09-27": "추석 대체공휴일",
  "2026-10-03": "개천절",
  "2026-10-05": "개천절 대체공휴일",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절"
};

export const getKoreanHolidayInfo = (dateStrOrDay, year = 2026, month = 10) => {
  let y = Number(year) || 2026;
  let m = Number(month) || 10;
  let d = null;

  if (typeof dateStrOrDay === "number") {
    d = dateStrOrDay;
  } else if (dateStrOrDay) {
    const rawStr = String(dateStrOrDay).trim();
    const p = rawStr.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (p) {
      y = parseInt(p[1], 10);
      m = parseInt(p[2], 10);
      d = parseInt(p[3], 10);
    } else {
      const mMatch = rawStr.match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
      if (mMatch) {
        if (mMatch[1]) y = parseInt(mMatch[1], 10);
        m = parseInt(mMatch[2], 10);
        d = parseInt(mMatch[3], 10);
      }
    }
  }

  if (!d) {
    return {
      isHoliday: false,
      holidayName: "",
      isWeekend: false,
      isOffDay: false,
      dayOfWeek: -1,
      dayOfWeekStr: "",
      fullLabel: "",
      ymd: ""
    };
  }

  const ymd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const holidayName = KOREAN_HOLIDAY_NAMES_2026[ymd] || "";
  const isHoliday = !!holidayName;

  const dt = new Date(y, m - 1, d);
  const dayOfWeek = !isNaN(dt.getTime()) ? dt.getDay() : -1;
  const dayOfWeekNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayOfWeekStr = dayOfWeek >= 0 ? dayOfWeekNames[dayOfWeek] : "";
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let fullLabel = `${m}월 ${d}일 (${dayOfWeekStr}요일)`;
  if (isHoliday) {
    fullLabel += ` 🔴 [${holidayName}]`;
  } else if (isWeekend) {
    fullLabel += ` [${dayOfWeekStr === "일" ? "일요특근" : "토요특근"}]`;
  }

  return {
    isHoliday,
    holidayName,
    isWeekend,
    isOffDay: isHoliday || isWeekend,
    dayOfWeek,
    dayOfWeekStr,
    fullLabel,
    ymd
  };
};

export const isWeekendByDate = (dateStrOrDay, year = 2026, month = 10) => {
  if (typeof dateStrOrDay === "number") {
    const d = dateStrOrDay;
    const y = Number(year) || 2026;
    const m = Number(month) || 10;
    const ymd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (KOREAN_PUBLIC_HOLIDAYS_2026.has(ymd)) return true;
    const dt = new Date(y, m - 1, d);
    if (!isNaN(dt.getTime())) {
      const dayOfWeek = dt.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    }
    return false;
  }
  if (!dateStrOrDay) return false;
  const rawStr = String(dateStrOrDay).trim();
  const p = rawStr.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (p) {
    const y = parseInt(p[1], 10);
    const m = parseInt(p[2], 10);
    const d = parseInt(p[3], 10);
    const ymd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (KOREAN_PUBLIC_HOLIDAYS_2026.has(ymd)) return true;
    const dt = new Date(y, m - 1, d);
    if (!isNaN(dt.getTime())) {
      const dayOfWeek = dt.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    }
  }
  const mMatch = rawStr.match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
  if (mMatch) {
    const y = mMatch[1] ? parseInt(mMatch[1], 10) : (year || 2026);
    const m = parseInt(mMatch[2], 10);
    const d = parseInt(mMatch[3], 10);
    const ymd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (KOREAN_PUBLIC_HOLIDAYS_2026.has(ymd)) return true;
    const dt = new Date(y, m - 1, d);
    if (!isNaN(dt.getTime())) {
      const dayOfWeek = dt.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    }
  }
  return false;
};

export const COMPANY_APPROVAL_MANAGERS = {
  "오륙": {
    company: "오륙",
    plant: "삼랑진공장",
    author: "조인주 선임",
    drafter: "조인주",
    drafterRole: "선임",
    lead: "윤경수",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "권태형",
    ceoRole: "대표"
  },
  "유성": {
    company: "유성",
    plant: "삼랑진공장",
    author: "이성기 선임",
    drafter: "이성기",
    drafterRole: "선임",
    lead: "설유철",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "권태형",
    ceoRole: "대표"
  },
  "조영": {
    company: "조영",
    plant: "한림공장",
    author: "오상민 선임",
    drafter: "오상민",
    drafterRole: "선임",
    lead: "김동욱",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "권태형",
    ceoRole: "대표"
  },
  "한울": {
    company: "한울",
    plant: "한림공장",
    author: "황수현 선임",
    drafter: "황수현",
    drafterRole: "선임",
    lead: "김동욱",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "권태형",
    ceoRole: "대표"
  },
  "부림텍": {
    company: "부림텍",
    plant: "한림공장",
    author: "김동훈 책임",
    drafter: "김동훈",
    drafterRole: "책임",
    lead: "김동욱",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "권태형",
    ceoRole: "대표"
  },
  "전체": {
    company: "5개사 통합",
    plant: "삼랑진/한림공장",
    author: "조인주 / 오상민 선임",
    drafter: "조인주",
    drafterRole: "선임",
    lead: "윤경수 / 김동욱",
    leadRole: "책임",
    director: "이명재",
    directorRole: "이사",
    ceo: "권태형",
    ceoRole: "대표"
  },
  // Aliases for legacy compatibility
  "주)오륙": { company: "오륙", plant: "삼랑진공장", author: "조인주 선임", drafter: "조인주", drafterRole: "선임", lead: "윤경수", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "(주)오륙": { company: "오륙", plant: "삼랑진공장", author: "조인주 선임", drafter: "조인주", drafterRole: "선임", lead: "윤경수", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "주)유성": { company: "유성", plant: "삼랑진공장", author: "이성기 대표", drafter: "이성기", drafterRole: "대표", lead: "설유철", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "(주)유성": { company: "유성", plant: "삼랑진공장", author: "이성기 대표", drafter: "이성기", drafterRole: "대표", lead: "설유철", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "유성산업": { company: "유성", plant: "삼랑진공장", author: "이성기 대표", drafter: "이성기", drafterRole: "대표", lead: "설유철", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "주)조영": { company: "조영", plant: "한림공장", author: "오상민 선임", drafter: "오상민", drafterRole: "선임", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "(주)조영": { company: "조영", plant: "한림공장", author: "오상민 선임", drafter: "오상민", drafterRole: "선임", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "(주)조영산업": { company: "조영", plant: "한림공장", author: "오상민 선임", drafter: "오상민", drafterRole: "선임", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "조영산업": { company: "조영", plant: "한림공장", author: "오상민 선임", drafter: "오상민", drafterRole: "선임", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "주)한울": { company: "한울", plant: "한림공장", author: "황수현 대표", drafter: "황수현", drafterRole: "대표", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "(주)한울": { company: "한울", plant: "한림공장", author: "황수현 대표", drafter: "황수현", drafterRole: "대표", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "주)부림텍": { company: "부림텍", plant: "한림공장", author: "김동훈 대표", drafter: "김동훈", drafterRole: "대표", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "(주)부림텍": { company: "부림텍", plant: "한림공장", author: "김동훈 대표", drafter: "김동훈", drafterRole: "대표", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" },
  "부림": { company: "부림텍", plant: "한림공장", author: "김동훈 대표", drafter: "김동훈", drafterRole: "대표", lead: "김동욱", leadRole: "책임", director: "이명재", directorRole: "이사", ceo: "권태형", ceoRole: "대표" }
};

export const COMPANY_THEMES = {
  "오륙": {
    name: "오륙",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-300 dark:border-blue-700",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200 border-blue-200 dark:border-blue-700",
    text: "text-blue-900 dark:text-blue-100",
    accent: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/30",
    btn: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
  },
  "조영": {
    name: "조영",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-300 dark:border-purple-700",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border-purple-200 dark:border-purple-700",
    text: "text-purple-900 dark:text-purple-100",
    accent: "text-purple-600 dark:text-purple-400",
    ring: "ring-purple-500/30",
    btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20"
  },
  "한울": {
    name: "한울",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-300 dark:border-emerald-700",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700",
    text: "text-emerald-900 dark:text-emerald-100",
    accent: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
    btn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
  },
  "부림텍": {
    name: "부림텍",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-300 dark:border-amber-700",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200 border-amber-200 dark:border-amber-700",
    text: "text-amber-900 dark:text-amber-100",
    accent: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/30",
    btn: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20"
  },
  "유성": {
    name: "유성",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    border: "border-cyan-300 dark:border-cyan-700",
    badge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/80 dark:text-cyan-200 border-cyan-200 dark:border-cyan-700",
    text: "text-cyan-900 dark:text-cyan-100",
    accent: "text-cyan-600 dark:text-cyan-400",
    ring: "ring-cyan-500/30",
    btn: "bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-500/20"
  },
  // Aliases
  "주)오륙": { name: "오륙", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-300 dark:border-blue-700", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200 border-blue-200 dark:border-blue-700", text: "text-blue-900 dark:text-blue-100", accent: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500/30", btn: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20" },
  "(주)오륙": { name: "오륙", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-300 dark:border-blue-700", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200 border-blue-200 dark:border-blue-700", text: "text-blue-900 dark:text-blue-100", accent: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500/30", btn: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20" },
  "주)조영": { name: "조영", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border-purple-200 dark:border-purple-700", text: "text-purple-900 dark:text-purple-100", accent: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/30", btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20" },
  "(주)조영산업": { name: "조영", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border-purple-200 dark:border-purple-700", text: "text-purple-900 dark:text-purple-100", accent: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/30", btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20" },
  "(주)조영": { name: "조영", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border-purple-200 dark:border-purple-700", text: "text-purple-900 dark:text-purple-100", accent: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/30", btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20" },
  "조영산업": { name: "조영", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border-purple-200 dark:border-purple-700", text: "text-purple-900 dark:text-purple-100", accent: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/30", btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20" }
};


export const cleanWorkerNameOnly = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/\([^)]*\)/g, "")
    .replace(/(선임|책임|이사|대표|대표이사|사원|반장|조장|직장|주임|대리|과장|차장|부장|팀장|실장|상무|전무)/g, "")
    .replace(/[\s\t\r\n]+/g, "")
    .trim();
};

