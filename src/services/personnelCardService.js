// Personnel Card (제조현장 인사카드) Service & Data Model
import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase.js";
import { sanitizeForFirestore } from "../utils/firestoreUtils.js";
import { cleanCompanyName, normalizeDept } from "./overtimeSmartService.js";

const LOCAL_STORAGE_KEY = "oryuk_personnel_cards_v1";

// 표준 제조 공정 목록
export const STANDARD_PROCESS_LIST = [
  "압출",
  "포밍",
  "후가공",
  "용접",
  "프레스",
  "조립",
  "품질검사",
  "설비보전",
  "도장/코팅",
  "포장/출하"
];

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

// 근로자 초기 인사카드 기본값 생성기
export const getWorkerPersonnelCard = (worker, idx = 1) => {
  if (!worker) return null;

  // 이미 카드 데이터가 존재하는 경우 병합하여 반환
  const existingCard = worker.personnelCard || {};

  const company = cleanCompanyName(worker.company || existingCard.company || "오륙");
  const dept = normalizeDept(worker.dept || existingCard.dept || "압출동");
  const name = String(worker.name || existingCard.name || "").trim();
  const position = worker.position || existingCard.position || "작업원";
  const line = worker.line || existingCard.line || dept;

  // 기본 주공정 추정
  let defaultMainProcess = existingCard.mainProcess;
  if (!defaultMainProcess) {
    if (line.includes("압출") || dept.includes("압출")) defaultMainProcess = "압출";
    else if (line.includes("포밍") || line.includes("성형")) defaultMainProcess = "포밍";
    else if (line.includes("가공") || line.includes("후가공")) defaultMainProcess = "후가공";
    else if (line.includes("용접")) defaultMainProcess = "용접";
    else if (line.includes("프레스")) defaultMainProcess = "프레스";
    else if (line.includes("관리") || dept.includes("관리")) defaultMainProcess = "품질검사";
    else defaultMainProcess = "압출";
  }

  // 기본 숙련도 추정
  let defaultSkillLevel = existingCard.skillLevel;
  if (!defaultSkillLevel) {
    if (position.includes("반장") || position.includes("책임") || position.includes("조장") || position.includes("선임")) {
      defaultSkillLevel = 4;
    } else {
      defaultSkillLevel = 3;
    }
  }

  // 기본 다기능공 여부
  const isMultiSkill = existingCard.isMultiSkill !== undefined ? existingCard.isMultiSkill : (defaultSkillLevel >= 4);

  // 기본 서브 지원공정
  let subProcesses = existingCard.subProcesses;
  if (!subProcesses || !Array.isArray(subProcesses)) {
    if (isMultiSkill) {
      if (defaultMainProcess === "압출") subProcesses = ["포밍", "후가공", "품질검사"];
      else if (defaultMainProcess === "포밍") subProcesses = ["후가공", "조립", "품질검사"];
      else subProcesses = ["압출", "포밍", "품질검사"];
    } else {
      subProcesses = [];
    }
  }

  const joinDate = existingCard.joinDate || "2022-03-15";
  const tenure = existingCard.tenure || calculateTenureFromJoinDate(joinDate);
  const career = existingCard.career || `${tenure} (총 제조경력)`;
  const processYear = existingCard.processYear || `${tenure.split(" ")[0]}차`;
  const empNo = existingCard.empNo || worker.empNo || generateDefaultEmpNo(worker, idx);

  return {
    empNo,
    company,
    dept,
    line,
    name,
    position,
    joinDate,
    tenure,
    career,
    mainProcess: defaultMainProcess,
    processYear,
    skillLevel: defaultSkillLevel,
    skillGrade: getSkillMeta(defaultSkillLevel).grade,
    isMultiSkill,
    subProcesses,
    certifications: existingCard.certifications || "지게차 운전, 위험물 취급 안전교육 수료",
    notes: existingCard.notes || `${defaultMainProcess} 공정 트러블 대응 우수 및 다기능 백업 가능`,
    updatedAt: existingCard.updatedAt || new Date().toISOString()
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
    const cleanData = {
      ...cardData,
      company: cleanCompanyName(cardData.company),
      dept: normalizeDept(cardData.dept),
      skillGrade: getSkillMeta(cardData.skillLevel).grade,
      tenure: calculateTenureFromJoinDate(cardData.joinDate),
      updatedAt: new Date().toISOString()
    };

    // 1. LocalStorage Map 업데이트
    const map = getLocalPersonnelCardsMap();
    map[cardKey] = cleanData;
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
            const key = `${cleanCompanyName(data.company)}_${data.name}`;
            cardsMap[key] = data;
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
