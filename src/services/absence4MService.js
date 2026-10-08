// 4M Man Change Point (작업자 변경점 & 결근 대체투입) Service
// 자동차 및 정밀 제조현장 품질 기준 4M Man 변경점 추적 및 감사 증빙 서비스
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
import { getSkillMeta, STANDARD_PROCESS_LIST } from "./personnelCardService.js";
import {
  registerToFourMLedger,
  unregisterFromFourMLedger,
  purgeManFourMChangePoints
} from "./fourMChangePointService.js";

const LOCAL_STORAGE_KEY = "oryuk_4m_absence_logs_v1";

// ⭐ 표준 결근 사유 목록
export const ABSENCE_REASONS = [
  { code: "휴가", label: "🏖️ 휴가 (연차/포상/하계휴가)", severity: "normal" },
  { code: "병결", label: "🏥 병결 (질병/통원치료)", severity: "normal" },
  { code: "개인사정", label: "🏠 개인사정 (가사/용무)", severity: "normal" },
  { code: "연차", label: "🌴 연차휴가", severity: "normal" },
  { code: "반차", label: "⛅ 오전/오후 반차", severity: "normal" },
  { code: "무단결근", label: "🚨 무단결근 (연락두절/사후보고)", severity: "warning" },
  { code: "경조사", label: "💐 경조사 (결혼/상가 등)", severity: "normal" },
  { code: "공가/기타", label: "📋 공가 / 예비군 / 기타", severity: "normal" }
];

// ⭐ 4M 품질 상태 정의
export const QUALITY_STATUS_OPTIONS = [
  { code: "NORMAL", label: "🟢 양호 (초물 합격 / 품질이상 무)", color: "text-emerald-400 bg-emerald-950/80 border-emerald-700" },
  { code: "OBSERVING", label: "🟡 관찰 (초물 검사 진행 중)", color: "text-amber-400 bg-amber-950/80 border-amber-700" },
  { code: "CAUTION", label: "🔴 주의 (숙련도 편차 / 밀착지도 요망)", color: "text-rose-400 bg-rose-950/80 border-rose-700" }
];

// ⭐ 4M Man 리스크 자동 평가 (결근자 vs 대체자 숙련도 및 다기능 여부)
export const calculate4MRisk = (absentWorker, substituteWorker, processName) => {
  if (!absentWorker || !substituteWorker) {
    return {
      level: "UNKNOWN",
      label: "대체자 미지정",
      badgeClass: "bg-slate-800 text-slate-400 border-slate-700",
      warningMsg: "대체 투입 작업자를 선택해주세요."
    };
  }

  // ⏸️ 라인비가동 (대체 미투입) 선택 시
  if (substituteWorker.name === "라인비가동" || substituteWorker.isLineStopped || substituteWorker.name?.includes("라인비가동")) {
    return {
      level: "STOPPED",
      label: "⏸️ 라인비가동 (대체 미투입)",
      badgeClass: "bg-slate-800 text-slate-300 border-slate-600",
      warningMsg: "해당 라인/공정 비가동 상태로 대체 인원을 투입하지 않습니다 (품질 이상 없음)."
    };
  }

  const absentSkill = Number(absentWorker.skillLevel) || 3;
  const subSkill = Number(substituteWorker.skillLevel) || 3;

  // 대체 작업자가 해당 공정의 메인 또는 서브공정(다기능) 경험이 있는지 검증
  const subMainProcess = substituteWorker.mainProcess || "";
  const subProcesses = Array.isArray(substituteWorker.subProcesses) ? substituteWorker.subProcesses : [];
  const hasProcessExperience = subMainProcess === processName || subProcesses.includes(processName);

  const skillDiff = absentSkill - subSkill;

  if (skillDiff <= 0 && hasProcessExperience) {
    return {
      level: "LOW",
      label: "🟢 정상 대체 (품질 안정)",
      badgeClass: "bg-emerald-950 text-emerald-300 border-emerald-700",
      warningMsg: "동등/상위 숙련도 다기능공 정상 배치 완료. 표준 초물검사 1회 실시."
    };
  }

  if (skillDiff === 1 && hasProcessExperience) {
    return {
      level: "MEDIUM",
      label: "🟡 주의: 4M 변경점 발생 (1단계 하위 숙련도)",
      badgeClass: "bg-amber-950 text-amber-300 border-amber-700",
      warningMsg: "숙련도 편차 발생 (Lv." + absentSkill + " ➔ Lv." + subSkill + "). 초물 한도견본 검사 필수 및 2시간 주기 자주검사."
    };
  }

  if (!hasProcessExperience) {
    return {
      level: "HIGH",
      label: "🚨 고위험: 타 공정 작업자 긴급 투입",
      badgeClass: "bg-rose-950 text-rose-300 border-rose-700 ring-1 ring-rose-500",
      warningMsg: "⚠️ 해당 공정 비경험자 투입! 관리감독자(선임/책임) 입회 지도 및 초물/중물 전수검사 필수!"
    };
  }

  return {
    level: "HIGH",
    label: "🚨 고위험: 숙련도 대폭 저하 (2단계 이상 편차)",
    badgeClass: "bg-rose-950 text-rose-300 border-rose-700 ring-1 ring-rose-500",
    warningMsg: "⚠️ 숙련도 급격 저하! 불량 발생 우려 큼. 선임/반장 밀착 지도 및 초물검사 2회 이상 실시."
  };
};

// ⭐ 4M 1줄 변경점 기록 요약 자동 생성 함수 (감사/보고서 표준 규격)
export const generate4MOneLineLog = (entry) => {
  if (!entry) return "";

  const comp = cleanCompanyName(entry.company || "오륙");
  const process = entry.process || entry.absentWorker?.mainProcess || "압출";
  const dateStr = entry.date || new Date().toISOString().slice(0, 10);

  // 날짜 간략 표기: "10/06"
  const dateParts = dateStr.split("-");
  const shortDate = dateParts.length === 3 ? `${parseInt(dateParts[1], 10)}/${parseInt(dateParts[2], 10)}` : dateStr;

  const absentName = entry.absentWorker?.name || "결근자";
  const absentPos = entry.absentWorker?.position || "사원";
  const absentSkill = entry.absentWorker?.skillLevel ? `Lv.${entry.absentWorker.skillLevel}` : "Lv.3";
  const reason = entry.absentWorker?.reason || "휴가";

  const subName = entry.substituteWorker?.name || "대체자 미지정";
  const subPos = entry.substituteWorker?.position || "";
  const subSkill = entry.substituteWorker?.skillLevel ? `Lv.${entry.substituteWorker.skillLevel}` : "Lv.3";
  const isMulti = entry.substituteWorker?.isMultiSkill ? " 다기능" : "";

  const firstPiece = entry.checkpoints?.firstPieceCheck ? "초물검사 완료" : "초물검사 미실시";
  const education = entry.checkpoints?.workInstructionTold ? "특별교육 완료" : "특별교육 미실시";

  // ⏸️ 라인비가동 (대체 미투입)인 경우의 1줄 로그
  if (entry.substituteWorker?.name === "라인비가동" || entry.substituteWorker?.isLineStopped || entry.substituteWorker?.name?.includes("라인비가동")) {
    return `📌 [4M Man 결근] ${shortDate} (${comp}) ${process}공정 | 결근: ${absentName}(${absentPos} ${absentSkill}, ${reason}) ➔ [⏸️ 라인비가동 / 대체 미투입]`;
  }

  if (!entry.substituteWorker?.name) {
    return `📌 [4M Man 결근] ${shortDate} (${comp}) ${process}공정 | 결근: ${absentName}(${absentPos} ${absentSkill}, ${reason}) ➔ 대체인원 미배치 (라인 비가동/조정)`;
  }

  return `📌 [4M Man 변경] ${shortDate} (${comp}) ${process}공정 | 결근: ${absentName}(${absentPos} ${absentSkill}, ${reason}) ➔ 대체: ${subName}(${subPos} ${subSkill}${isMulti}) 투입 | [${firstPiece} / ${education}]`;
};

// ⭐ 기본 4M 결근 및 대체투입 초기 이력 샘플 데이터 (신규 입력 기준 - 빈 상태)
export const INITIAL_4M_ABSENCE_LOGS = {};

// 로컬 스토리지에서 전체 4M 결근/대체 로그 로드
export const getLocal4MAbsenceLogsMap = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        // 김동욱 책임은 총괄관리자이므로 결근자 목록에서 제외/정화
        const sanitized = {};
        Object.entries(parsed).forEach(([k, v]) => {
          if (v && v.absentWorker?.name !== "김동욱" && v.name !== "김동욱") {
            sanitized[k] = v;
          }
        });
        return sanitized;
      }
    }
  } catch (e) {
    console.warn("Failed to load local 4M absence logs map:", e);
  }
  return {};
};

// 로컬 스토리지에 4M 결근/대체 로그 저장
export const saveLocal4MAbsenceLogsMap = (logsMap) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logsMap || {}));
  } catch (e) {
    console.warn("Failed to save local 4M absence logs map:", e);
  }
};

// 특정 일자 및 회사의 4M 로그 목록 반환
export const get4MLogsForDateAndCompany = (dateStr, company = "전체") => {
  const map = getLocal4MAbsenceLogsMap();
  const list = Object.values(map).filter((item) => {
    if (item.date !== dateStr) return false;
    if (company && company !== "전체" && cleanCompanyName(item.company) !== cleanCompanyName(company)) {
      return false;
    }
    return true;
  });

  return list.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
};

// 개별 4M 결근/대체 로그 저장 (Firestore & LocalStorage)
export const save4MAbsenceLog = async (entryData) => {
  try {
    const cleanComp = cleanCompanyName(entryData.company || "오륙");
    const dateStr = entryData.date || new Date().toISOString().slice(0, 10);
    const absentName = (entryData.absentWorker?.name || "무명").trim();
    const subName = (entryData.substituteWorker?.name || "미지정").trim();

    const id = entryData.id || `4m_${dateStr.replace(/-/g, "")}_${cleanComp}_${absentName}_${subName}_${Date.now()}`;

    const risk = calculate4MRisk(
      entryData.absentWorker,
      entryData.substituteWorker,
      entryData.process || entryData.absentWorker?.mainProcess || "압출"
    );

    const fullData = {
      ...entryData,
      id,
      date: dateStr,
      company: cleanComp,
      process: entryData.process || entryData.absentWorker?.mainProcess || "압출",
      riskLevel: risk.level,
      riskWarningText: risk.warningMsg,
      oneLineLog: generate4MOneLineLog({
        ...entryData,
        company: cleanComp,
        date: dateStr,
        riskLevel: risk.level
      }),
      updatedAt: new Date().toISOString(),
      createdAt: entryData.createdAt || new Date().toISOString()
    };

    // 1. LocalStorage Map 업데이트
    const map = getLocal4MAbsenceLogsMap();
    map[id] = fullData;
    saveLocal4MAbsenceLogsMap(map);

    // 2. Custom Window Event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("oryuk_4m_absence_updated", { detail: { id, log: fullData } }));
    }

    // 3. Firestore 저장 (absence_4m_logs collection)
    if (db) {
      const sanitizedDocId = id.replace(/[^\w가-힣]/g, "_");
      const ref = doc(db, "absence_4m_logs", sanitizedDocId);
      await setDoc(ref, sanitizeForFirestore(fullData), { merge: true });
    }

    // ⭐ 4. 변동점 관리 MAN 대장에 즉시 동기화 등록
    try {
      const plant = cleanComp === "오륙" || cleanComp === "유성" ? "삼랑진공장" : "한림공장";
      const isSub = Boolean(entryData.substituteWorker && entryData.substituteWorker.name && entryData.substituteWorker.name !== "라인비가동");
      const isLineStopped = entryData.substituteWorker?.name === "라인비가동" || entryData.substituteWorker?.isLineStopped;
      const absentPos = entryData.absentWorker?.position || "사원";
      const absentDept = entryData.absentWorker?.dept || "생산팀";
      const subPos = entryData.substituteWorker?.position || "사원";
      const subName = entryData.substituteWorker?.name || "";
      
      const title = isLineStopped
        ? `[${cleanComp}] ${absentName}(${absentPos}, ${absentDept}) 결근 ➔ [라인비가동]`
        : `[${cleanComp}] ${absentName}(${absentPos}, ${absentDept}) 결근 ➔ ${isSub ? `${subName}(${subPos}) 대체투입` : "대체 미투입"}`;

      await registerToFourMLedger({
        id: `man_log_${id}`,
        originalId: id,
        rawId: id,
        fourM: "Man",
        origin: isSub ? "4M 대체투입" : "결근발생",
        sourceType: "MAN_ABSENCE_LOG",
        badgeColor: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-700",
        plant,
        line: `${entryData.process || "압출"} 공정`,
        writer: entryData.checkpoints?.supervisorName || `${cleanComp} 관리자`,
        title,
        date: dateStr,
        content: fullData.oneLineLog || title,
        actionResult: isLineStopped ? "라인 비가동 (공정 정지/품질영향 없음)" : (isSub ? `대체작업자 ${subName}(${subPos}) 투입 완료` : "대체 미투입"),
        isResolved: isSub || isLineStopped,
        severity: risk.level === "HIGH" ? "HIGH" : "NORMAL"
      }, "관리자");
    } catch (syncErr) {
      console.warn("Auto sync to fourM change points error:", syncErr);
    }

    return fullData;
  } catch (err) {
    console.error("Failed to save 4M absence log:", err);
    throw err;
  }
};

// 4M 로그 삭제
export const delete4MAbsenceLog = async (logId) => {
  try {
    const map = getLocal4MAbsenceLogsMap();
    delete map[logId];
    saveLocal4MAbsenceLogsMap(map);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("oryuk_4m_absence_updated", { detail: { id: logId, deleted: true } }));
    }

    if (db) {
      const sanitizedDocId = logId.replace(/[^\w가-힣]/g, "_");
      const ref = doc(db, "absence_4m_logs", sanitizedDocId);
      await deleteDoc(ref);
    }

    // ⭐ 변동점 MAN 대장에서도 함께 동기화 삭제
    try {
      await unregisterFromFourMLedger(logId);
      await unregisterFromFourMLedger(`man_log_${logId}`);
    } catch (e) {
      console.warn("Sync unregister MAN fourM ledger error:", e);
    }
  } catch (err) {
    console.error("Failed to delete 4M absence log:", err);
    throw err;
  }
};

// 4M 로그 실시간 구독
export const subscribe4MAbsenceLogs = (callback) => {
  if (!db) {
    callback(getLocal4MAbsenceLogsMap());
    return () => {};
  }
  try {
    const colRef = collection(db, "absence_4m_logs");
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const logsMap = {};
        if (!snapshot.empty) {
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && (data.id || docSnap.id)) {
              const id = data.id || docSnap.id;
              logsMap[id] = { ...data, id };
            }
          });
        }
        saveLocal4MAbsenceLogsMap(logsMap);
        callback(logsMap);
      },
      (err) => {
        console.warn("4M Absence logs subscription error:", err);
        callback(getLocal4MAbsenceLogsMap());
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn("Error initiating 4M absence logs subscription:", err);
    callback(getLocal4MAbsenceLogsMap());
    return () => {};
  }
};

// ⭐ 4M 결근 및 작업자 변경점 전체 데이터 영구삭제 함수
export const purgeAll4MAbsenceLogs = async () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem("oryuk_4m_absence_logs_v1");
    } catch (e) {
      console.warn("LocalStorage clear 4M error:", e);
    }
  }

  if (db) {
    try {
      const snap = await getDocs(collection(db, "absence_4m_logs"));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "absence_4m_logs", d.id));
      }
    } catch (e) {
      console.warn("Firestore absence_4m_logs clear error:", e);
    }
  }

  // ⭐ 변동점 MAN 대장도 동기화하여 모든 결근/대체 MAN 레코드 영구 삭제
  try {
    await purgeManFourMChangePoints();
  } catch (e) {
    console.warn("purgeManFourMChangePoints error:", e);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("oryuk_4m_absence_updated", { detail: { purged: true } }));
  }

  return true;
};

