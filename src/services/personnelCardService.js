// Personnel Card (제조현장 인사카드) Service & Data Model
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase.js";
import { sanitizeForFirestore } from "../utils/firestoreUtils.js";
import { cleanCompanyName } from "./overtimeSmartService.js";

const LOCAL_STORAGE_KEY = "oryuk_personnel_cards_v1";

// ⭐ 표준 7대 제조 및 관리 공정 목록 (관리자 / 압출 / 소재준비 / 조인트 / 사상 / 코팅 / 검사)
export const STANDARD_PROCESS_LIST = [
  "관리자",
  "압출",
  "소재준비",
  "조인트",
  "사상",
  "코팅",
  "검사"
];

// ⭐ 표준 5대 소속 업체 목록 (주)오륙, 주)조영, 유성, 한울, 부림텍)
export const COMPANY_LIST = [
  "주)오륙",
  "주)조영",
  "유성",
  "한울",
  "부림텍"
];

// ⭐ 표준 7대 부서 목록 (생산팀 / 압출관리팀 / 가공관리팀 / 품질관리팀 / 설비보전팀 / 물류팀 / 관리팀)
export const DEPARTMENTS_LIST = [
  "생산팀",
  "압출관리팀",
  "가공관리팀",
  "품질관리팀",
  "설비보전팀",
  "물류팀",
  "관리팀"
];

// ⭐ 표준 5대 직급 목록 (사원 / 선임 / 책임 / 이사 / 대표이사)
export const POSITIONS_LIST = [
  "사원",
  "선임",
  "책임",
  "이사",
  "대표이사"
];

// ⭐ 표준 국적 목록 (필리핀, 베트남, 태국, 스리랑카, 우즈벡, 인도네시아, 대한민국, 네팔, 캄보디아, 몽골, 기타)
export const NATIONALITY_LIST = [
  { code: "대한민국", label: "🇰🇷 대한민국", flag: "🇰🇷" },
  { code: "필리핀", label: "🇵🇭 필리핀", flag: "🇵🇭" },
  { code: "베트남", label: "🇻🇳 베트남", flag: "🇻🇳" },
  { code: "태국", label: "🇹🇭 태국", flag: "🇹🇭" },
  { code: "스리랑카", label: "🇱🇰 스리랑카", flag: "🇱🇰" },
  { code: "우즈벡", label: "🇺🇿 우즈벡 (우즈베키스탄)", flag: "🇺🇿" },
  { code: "인도네시아", label: "🇮🇩 인도네시아", flag: "🇮🇩" },
  { code: "네팔", label: "🇳🇵 네팔", flag: "🇳🇵" },
  { code: "캄보디아", label: "🇰🇭 캄보디아", flag: "🇰🇭" },
  { code: "몽골", label: "🇲🇳 몽골", flag: "🇲🇳" },
  { code: "기타", label: "🌐 기타 (직접 입력)", flag: "🌐" }
];

export const getNationalityMeta = (code) => {
  if (!code) return NATIONALITY_LIST[0];
  const found = NATIONALITY_LIST.find((n) => n.code === code || n.label.includes(code));
  if (found) return found;
  return { code, label: `🌐 ${code}`, flag: "🌐" };
};

// ⭐ 검사원 자격 등급 정의 (검사 공정 선택 시 개별 평가: S / A / B 3단계)
export const INSPECTOR_GRADES = [
  {
    grade: "S등급 (특급검사원)",
    shortGrade: "S등급(특)",
    level: "S",
    color: "text-purple-400",
    badgeClass: "bg-purple-950 text-purple-300 border-purple-700 ring-1 ring-purple-400/50",
    desc: "최종 출하검사 승인, 초중종물 한도견본 판정, 정밀 측정기기 운용"
  },
  {
    grade: "A등급 (정검사원)",
    shortGrade: "A등급(정)",
    level: "A",
    color: "text-emerald-400",
    badgeClass: "bg-emerald-950 text-emerald-300 border-emerald-700 ring-1 ring-emerald-400/50",
    desc: "양산 공정 자주검사, 치수 측정(버니어/마이크로미터), 불량 식별"
  },
  {
    grade: "B등급 (일반검사원)",
    shortGrade: "B등급(일반)",
    level: "B",
    color: "text-blue-400",
    badgeClass: "bg-blue-950 text-blue-300 border-blue-700",
    desc: "외관 육안 검사, 포장 전 수량 및 라벨 식별 검사"
  }
];

export const getInspectorGradeMeta = (grade) => {
  if (!grade) return INSPECTOR_GRADES[1]; // 기본값: A등급 (정검사원)
  const str = String(grade).trim();
  if (str.startsWith("S") || str.startsWith("s") || str.includes("특급") || str.includes("마스터")) {
    return INSPECTOR_GRADES[0];
  }
  if (str.startsWith("A") || str.startsWith("a") || str.includes("정검사원") || str === "A등급") {
    return INSPECTOR_GRADES[1];
  }
  if (
    str.startsWith("B") ||
    str.startsWith("b") ||
    str.startsWith("C") ||
    str.startsWith("c") ||
    str.includes("일반검사원") ||
    str.includes("보조검사원") ||
    str === "B등급" ||
    str === "C등급"
  ) {
    return INSPECTOR_GRADES[2];
  }
  return (
    INSPECTOR_GRADES.find(
      (g) => g.grade === grade || g.level === grade || g.shortGrade === grade
    ) || INSPECTOR_GRADES[1]
  );
};

// 협력/외주 업체 여부 확인 (유성, 한울, 부림텍)
export const isPartnerCompany = (comp) => {
  if (!comp) return false;
  const str = String(comp).trim();
  return (
    str === "유성" ||
    str === "한울" ||
    str === "부림텍" ||
    str.includes("유성") ||
    str.includes("한울") ||
    str.includes("부림")
  );
};

// 소속 업체 정규화 헬퍼 (주)오륙, 주)조영, 유성, 한울, 부림텍 5개사로 표준화)
export const normalizeStandardCompany = (comp) => {
  if (!comp) return "주)오륙";
  const str = String(comp).trim();
  if (str === "주)오륙" || str === "(주)오륙" || str.includes("오륙")) return "주)오륙";
  if (str === "주)조영" || str === "(주)조영" || str.includes("조영")) return "주)조영";
  if (str.includes("유성")) return "유성";
  if (str.includes("한울")) return "한울";
  if (str.includes("부림")) return "부림텍";
  return str;
};

// 부서 정규화 헬퍼 (협력업체인 경우 업체명 반환, 그 외 생산팀, 압출관리팀, 가공관리팀, 품질관리팀, 설비보전팀, 물류팀, 관리팀 7개로 표준화)
export const normalizeStandardDept = (dept, comp) => {
  const normComp = comp ? normalizeStandardCompany(comp) : "";
  if (normComp && isPartnerCompany(normComp)) {
    return normComp;
  }
  if (!dept) return "생산팀";
  const str = String(dept).trim();
  if (isPartnerCompany(str)) return normalizeStandardCompany(str);
  if (DEPARTMENTS_LIST.includes(str)) return str;
  if (str === "물류팀" || str === "물류" || str.includes("물류") || str.includes("출하") || str.includes("창고") || str.includes("자재")) return "물류팀";
  if (str === "설비보전팀" || str === "설비보전" || str === "설비팀" || str === "보전팀" || str === "공무팀" || str.includes("설비") || str.includes("보전") || str.includes("공무")) return "설비보전팀";
  if (str === "품질관리팀" || str === "품질팀" || str === "품질부" || str.includes("품질")) return "품질관리팀";
  if (str === "생산팀" || str === "생산") return "생산팀";
  if (str === "압출관리팀" || str === "압출동" || (str.includes("압출") && !str.includes("생산"))) return "압출관리팀";
  if (str === "가공관리팀" || str === "가공동" || str.includes("가공") || str.includes("프레스") || str.includes("용접") || str.includes("성형") || str.includes("도장") || str.includes("조인트") || str.includes("사상") || str.includes("코팅")) return "가공관리팀";
  if (str === "관리팀" || str === "관리부" || str.includes("관리") || str.includes("총무") || str.includes("경영") || str.includes("회계") || str.includes("기술") || str.includes("총괄")) return "관리팀";
  if (str.includes("생산")) return "생산팀";
  return "생산팀";
};

// 직위 정규화 헬퍼 (사원, 선임, 책임, 이사, 대표이사 5단계 표준화)
export const normalizeStandardPosition = (pos, comp) => {
  if (!pos) {
    const normComp = comp ? normalizeStandardCompany(comp) : "";
    return isPartnerCompany(normComp) ? "대표이사" : "사원";
  }
  const str = String(pos).trim();
  if (POSITIONS_LIST.includes(str)) return str;
  if (str === "대표이사" || str === "대표" || str.includes("대표이사") || str.includes("대표") || str === "대표자") return "대표이사";
  if (str === "이사" || str.includes("이사") || str.includes("임원") || str === "상무" || str === "전무") return "이사";
  if (str === "책임" || str.includes("책임") || str.includes("부장") || str.includes("차장") || str.includes("과장")) return "책임";
  if (str === "선임" || str.includes("선임") || str.includes("반장") || str.includes("조장") || str.includes("대리") || str.includes("주임")) return "선임";
  if (str === "작업원" || str === "사원" || str === "사원(작업원)" || str.includes("사원") || str.includes("작업원")) return "사원";
  return "사원";
};

// 숙련등급 메타 정의 (1~5성)
export const SKILL_LEVEL_META = {
  1: {
    level: 1,
    grade: "Lv.1 (기초/신입)",
    shortGrade: "Lv.1 기초",
    stars: 1,
    color: "text-amber-400",
    badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
    desc: "기본 안전수칙 숙지 및 단순 보조 작업 수행"
  },
  2: {
    level: 2,
    grade: "Lv.2 (보통/일반)",
    shortGrade: "Lv.2 보통",
    stars: 2,
    color: "text-amber-400",
    badgeClass: "bg-blue-950 text-blue-300 border-blue-800",
    desc: "표준 작업 지침에 따른 단독 단위 작업 가능"
  },
  3: {
    level: 3,
    grade: "Lv.3 (능숙/중급)",
    shortGrade: "Lv.3 능숙",
    stars: 3,
    color: "text-amber-400",
    badgeClass: "bg-emerald-950 text-emerald-300 border-emerald-800",
    desc: "주요 설비 조작 및 품질 자주검사 능숙 수행"
  },
  4: {
    level: 4,
    grade: "Lv.4 (숙련/고급)",
    shortGrade: "Lv.4 숙련",
    stars: 4,
    color: "text-amber-400",
    badgeClass: "bg-purple-950 text-purple-300 border-purple-800",
    desc: "이상 발생 트러블슈팅 및 공정 조건 최적화 가능"
  },
  5: {
    level: 5,
    grade: "Lv.5 (마스터/전문가)",
    shortGrade: "Lv.5 마스터",
    stars: 5,
    color: "text-amber-300",
    badgeClass: "bg-amber-950 text-amber-300 border-amber-600 ring-1 ring-amber-400/50",
    desc: "신규 라인 셋업, 공정 개선 주도 및 후배 양성 지도"
  }
};

export const getSkillMeta = (level) => {
  const lvl = Math.max(1, Math.min(5, Number(level) || 3));
  return SKILL_LEVEL_META[lvl] || SKILL_LEVEL_META[3];
};

// 입사일 기준 근속기간 자동 계산 (예: "6년 7개월", "1년 2개월", "8개월")
export const calculateTenureFromJoinDate = (joinDateStr) => {
  if (!joinDateStr) return "1년 미만";
  try {
    const cleanStr = String(joinDateStr).replace(/\./g, "-").trim();
    const parts = cleanStr.match(/(\d{4})[-/.]?(\d{1,2})[-/.]?(\d{1,2})?/);
    if (!parts) return "1년 미만";

    const y = parseInt(parts[1], 10);
    const m = parseInt(parts[2], 10);
    const d = parts[3] ? parseInt(parts[3], 10) : 1;

    const startDate = new Date(y, m - 1, d);
    const now = new Date();

    if (isNaN(startDate.getTime())) return "1년 미만";

    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();

    if (now.getDate() < startDate.getDate()) {
      months--;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years < 0) return "신규 입사";
    if (years === 0 && months === 0) return "1개월 미만";
    if (years === 0) return `${months}개월`;
    if (months === 0) return `${years}년`;
    return `${years}년 ${months}개월`;
  } catch (e) {
    return "1년 미만";
  }
};

// ⭐ 입사일 기준 공정년차 자동 계산 (예: "7년차", "3년차", "1년차")
export const calculateProcessYearFromJoinDate = (joinDateStr) => {
  if (!joinDateStr) return "1년차";
  try {
    const cleanStr = String(joinDateStr).replace(/\./g, "-").trim();
    const parts = cleanStr.match(/(\d{4})[-/.]?(\d{1,2})[-/.]?(\d{1,2})?/);
    if (!parts) return "1년차";

    const y = parseInt(parts[1], 10);
    const m = parseInt(parts[2], 10);
    const d = parts[3] ? parseInt(parts[3], 10) : 1;

    const startDate = new Date(y, m - 1, d);
    const now = new Date();

    if (isNaN(startDate.getTime())) return "1년차";

    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();

    if (now.getDate() < startDate.getDate()) {
      months--;
    }

    if (months < 0) {
      years--;
    }

    const totalYears = Math.max(0, years);
    return `${totalYears + 1}년차`;
  } catch (e) {
    return "1년차";
  }
};

// 사번 자동 생성 헬퍼 (예: "200315")
export const generateDefaultEmpNo = (worker, idx = 1) => {
  if (worker?.empNo) return worker.empNo;
  const joinDate = worker?.joinDate || "";
  if (joinDate) {
    const digits = joinDate.replace(/\D/g, "");
    if (digits.length >= 6) return digits.slice(2, 8);
  }
  const yearPrefix = "25";
  const seq = String(idx || 1).padStart(4, "0");
  return `${yearPrefix}${seq}`;
};

// ⭐ 이미지 압축 헬퍼 (파일 또는 Blob을 최대 360x360 캔버스로 리사이징하여 경량 Base64 DataURL 생성)
export const compressImageToBase64 = (fileOrBlob, maxWidth = 360, maxHeight = 360, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    if (!fileOrBlob) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(fileOrBlob);
  });
};

// 근로자 초기 인사카드 기본값 생성기 (6대 주공정 및 부서, 직급, 검사원 등급 및 사진 연동)
export const getWorkerPersonnelCard = (worker, idx = 1) => {
  if (!worker) return null;

  // 이미 카드 데이터가 존재하는 경우 병합하여 반환
  const existingCard = worker.personnelCard || worker.card || {};

  const rawCompany = existingCard.company || worker.company || (isPartnerCompany(worker.name) ? worker.name : "주)오륙");
  const company = normalizeStandardCompany(rawCompany);
  const cleanComp = cleanCompanyName(company);
  const name = String(worker.name || existingCard.name || "").trim();

  let localSavedCard = null;
  if (name) {
    const map = getLocalPersonnelCardsMap();
    localSavedCard = map[`${cleanComp}_${name}`] || map[`${company}_${name}`] || map[`${rawCompany}_${name}`] || null;
  }

  const merged = { ...worker, ...existingCard, ...(localSavedCard || {}) };
  const isPartner = isPartnerCompany(company) || isPartnerCompany(name);

  // 부서 우선순위: 저장된 카드(merged.dept) > worker.dept > (협력업체는 업체명, 그 외는 생산팀)
  const dept = merged.dept
    ? normalizeStandardDept(merged.dept, company)
    : (isPartner ? company : normalizeStandardDept(worker.dept || "생산팀", company));

  // ⭐ 직위/직급 우선순위: 저장된 카드(merged.position) > worker.position > (협력업체 대표는 대표이사, 그 외는 사원)
  // 사용자가 인사카드에서 직급(사원, 선임, 책임, 이사, 대표이사)을 선택/수정 저장한 경우 그 직급이 최우선 적용됨
  const position = merged.position
    ? normalizeStandardPosition(merged.position, company)
    : (worker.position ? normalizeStandardPosition(worker.position, company) : (isPartner ? "대표이사" : "사원"));

  // 기본 주공정 추정 (관리자 / 압출 / 소재준비 / 조인트 / 사상 / 코팅 / 검사)
  let defaultMainProcess = merged.mainProcess;
  if (!defaultMainProcess || !STANDARD_PROCESS_LIST.includes(defaultMainProcess)) {
    const hint = `${worker.line || ""} ${dept} ${name}`.toLowerCase();
    if (hint.includes("압출")) defaultMainProcess = "압출";
    else if (hint.includes("소재") || hint.includes("원자재") || hint.includes("절단")) defaultMainProcess = "소재준비";
    else if (hint.includes("조인트") || hint.includes("용접") || hint.includes("체결")) defaultMainProcess = "조인트";
    else if (hint.includes("사상") || hint.includes("가공") || hint.includes("후가공") || hint.includes("포밍")) defaultMainProcess = "사상";
    else if (hint.includes("코팅") || hint.includes("도장") || hint.includes("피막")) defaultMainProcess = "코팅";
    else if (hint.includes("검사") || hint.includes("품질")) defaultMainProcess = "검사";
    else if (hint.includes("물류") || dept.includes("물류")) defaultMainProcess = "소재준비";
    else if (dept === "관리팀" || dept === "관리부" || hint.includes("관리자") || hint.includes("총무") || hint.includes("경영")) defaultMainProcess = "관리자";
    else defaultMainProcess = "압출";
  }

  // 기본 숙련도 추정
  let defaultSkillLevel = merged.skillLevel;
  if (!defaultSkillLevel) {
    if (position === "대표이사" || position === "이사" || position === "책임") {
      defaultSkillLevel = 5;
    } else if (position === "선임") {
      defaultSkillLevel = 4;
    } else {
      defaultSkillLevel = 3;
    }
  }

  // 기본 다기능공 여부 (관리자 공정이거나 숙련도 4 이상인 경우 기본 다기능공 지정)
  const isMultiSkill = merged.isMultiSkill !== undefined ? merged.isMultiSkill : (defaultMainProcess === "관리자" || defaultSkillLevel >= 4);

  // 기본 서브 지원공정 (관리자 공정이면 전 제조 공정 자동 지원 배정)
  let subProcesses = merged.subProcesses;
  if (!subProcesses || !Array.isArray(subProcesses) || subProcesses.length === 0) {
    if (defaultMainProcess === "관리자") {
      subProcesses = ["압출", "소재준비", "조인트", "사상", "코팅", "검사"];
    } else if (isMultiSkill) {
      if (defaultMainProcess === "압출") subProcesses = ["소재준비", "사상", "검사"];
      else if (defaultMainProcess === "조인트") subProcesses = ["사상", "코팅", "검사"];
      else if (defaultMainProcess === "소재준비") subProcesses = ["압출", "사상"];
      else if (defaultMainProcess === "코팅") subProcesses = ["사상", "검사"];
      else subProcesses = ["조인트", "사상", "검사"];
    } else {
      subProcesses = [];
    }
  }

  // 지원 공정 중 표준 공정에 해당하는 항목만 필터링 (주공정 제외)
  subProcesses = subProcesses.filter((p) => STANDARD_PROCESS_LIST.includes(p) && p !== defaultMainProcess);

  const joinDate = merged.joinDate || "2022-03-15";
  const tenure = calculateTenureFromJoinDate(joinDate);
  const processYear = calculateProcessYearFromJoinDate(joinDate);
  const empNo = merged.empNo || worker.empNo || generateDefaultEmpNo(worker, idx);

  // 검사원 등급 (주공정이 검사이거나 지정된 경우)
  const inspectorGrade = merged.inspectorGrade
    ? getInspectorGradeMeta(merged.inspectorGrade).grade
    : (defaultMainProcess === "검사" ? "A등급 (정검사원)" : "");
  const inspectorCertDate = merged.inspectorCertDate || (defaultMainProcess === "검사" ? joinDate : "");
  // 국적 (기본값: 대한민국)
  const nationality = merged.nationality || worker.nationality || "대한민국";
  const nationalityOther = merged.nationalityOther || worker.nationalityOther || "";
  // 작업자 사진
  const photoUrl = merged.photoUrl || worker.photoUrl || "";

  return {
    empNo,
    company,
    dept,
    name,
    position,
    nationality,
    nationalityOther,
    photoUrl,
    joinDate,
    tenure,
    mainProcess: defaultMainProcess,
    processYear,
    skillLevel: defaultSkillLevel,
    skillGrade: getSkillMeta(defaultSkillLevel).grade,
    isMultiSkill,
    subProcesses,
    inspectorGrade,
    inspectorCertDate,
    notes: merged.notes || (
      defaultMainProcess === "관리자"
        ? "관리자 (현장 작업자 결근 시 전 제조공정 대체 투입 및 생산 지원)"
        : `${defaultMainProcess} 공정 트러블 조치 능숙 및 지원공정 백업 가능`
    ),
    updatedAt: merged.updatedAt || new Date().toISOString()
  };
};

// 로컬 스토리지에서 전체 인사카드 맵 로드
export const getLocalPersonnelCardsMap = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed to load local personnel cards map:", e);
  }
  return {};
};

// 로컬 스토리지에 인사카드 맵 저장
export const saveLocalPersonnelCardsMap = (cardsMap) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cardsMap));
  } catch (e) {
    console.warn("Failed to save local personnel cards map:", e);
  }
};

// 개별 근로자 인사카드 저장 (Firestore & LocalStorage)
export const saveWorkerPersonnelCard = async (workerIdOrKey, cardData) => {
  try {
    const cardKey = String(workerIdOrKey || `${cardData.company}_${cardData.name}`).trim();
    const tenure = calculateTenureFromJoinDate(cardData.joinDate);
    const processYear = calculateProcessYearFromJoinDate(cardData.joinDate);

    const normComp = normalizeStandardCompany(cardData.company);
    const isPartner = isPartnerCompany(normComp);
    const cleanData = {
      ...cardData,
      company: normComp,
      dept: cardData.dept ? normalizeStandardDept(cardData.dept, normComp) : (isPartner ? normComp : "생산팀"),
      position: cardData.position ? normalizeStandardPosition(cardData.position, normComp) : (isPartner ? "대표이사" : "사원"),
      nationality: cardData.nationality || "대한민국",
      nationalityOther: cardData.nationality === "기타" ? (cardData.nationalityOther || "") : "",
      skillGrade: getSkillMeta(cardData.skillLevel).grade,
      tenure,
      processYear,
      photoUrl: cardData.photoUrl || "",
      inspectorGrade: cardData.mainProcess === "검사" ? (cardData.inspectorGrade ? getInspectorGradeMeta(cardData.inspectorGrade).grade : "A등급 (정검사원)") : (cardData.inspectorGrade ? getInspectorGradeMeta(cardData.inspectorGrade).grade : ""),
      updatedAt: new Date().toISOString()
    };

    // 1. LocalStorage Map 업데이트
    const map = getLocalPersonnelCardsMap();
    map[cardKey] = cleanData;
    const cleanComp = cleanCompanyName(normComp);
    map[`${cleanComp}_${cleanData.name}`] = cleanData;
    map[`${normComp}_${cleanData.name}`] = cleanData;
    if (cardData.company) {
      map[`${cardData.company}_${cleanData.name}`] = cleanData;
      map[`${cleanCompanyName(cardData.company)}_${cleanData.name}`] = cleanData;
    }
    saveLocalPersonnelCardsMap(map);

    // 2. Custom Window Event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("oryuk_personnel_card_updated", { detail: { cardKey, cardData: cleanData } }));
    }

    // 3. Firestore 저장 (personnel_cards collection)
    if (db) {
      const sanitizedDocId = cardKey.replace(/[^\w가-힣]/g, "_");
      const ref = doc(db, "personnel_cards", sanitizedDocId);
      await setDoc(ref, sanitizeForFirestore(cleanData), { merge: true });
    }

    return cleanData;
  } catch (err) {
    console.error("Failed to save worker personnel card:", err);
    throw err;
  }
};

// 전체 인사카드 실시간 구독
export const subscribePersonnelCards = (callback) => {
  if (!db) {
    callback(getLocalPersonnelCardsMap());
    return () => {};
  }
  try {
    const colRef = collection(db, "personnel_cards");
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const cardsMap = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.name) {
            const cleanComp = cleanCompanyName(data.company);
            const rawComp = data.company || "";
            cardsMap[`${cleanComp}_${data.name}`] = data;
            if (rawComp) {
              cardsMap[`${rawComp}_${data.name}`] = data;
            }
          }
        });
        saveLocalPersonnelCardsMap(cardsMap);
        callback(cardsMap);
      },
      (err) => {
        console.warn("Personnel cards subscription error:", err);
        callback(getLocalPersonnelCardsMap());
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn("Error initiating personnel cards subscription:", err);
    callback(getLocalPersonnelCardsMap());
    return () => {};
  }
};

// 개별 근로자 인사카드 영구 삭제 (Firestore & LocalStorage)
export const deleteWorkerPersonnelCard = async (companyName, workerName) => {
  try {
    const cleanComp = cleanCompanyName(companyName);
    const rawComp = String(companyName || "").trim();
    const cardKey = `${cleanComp}_${workerName}`;
    const map = getLocalPersonnelCardsMap();
    delete map[cardKey];
    delete map[`${rawComp}_${workerName}`];
    saveLocalPersonnelCardsMap(map);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("oryuk_personnel_card_updated", { detail: { cardKey, deleted: true } }));
    }

    if (db) {
      const sanitizedDocId = cardKey.replace(/[^\w가-힣]/g, "_");
      await deleteDoc(doc(db, "personnel_cards", sanitizedDocId));
    }
    return true;
  } catch (err) {
    console.warn("deleteWorkerPersonnelCard error:", err);
    return false;
  }
};

