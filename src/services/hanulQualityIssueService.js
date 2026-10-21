import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeForFirestore } from "../utils/firestoreUtils";
import { getKSTDateString } from "../utils/dateUtils";
import {
  syncQualityAlertToFourMLedger,
  unregisterFromFourMLedger
} from "./fourMChangePointService";

const COLLECTION_NAME = "hanul_quality_issues";
const LOCAL_STORAGE_KEY = "factory_hanul_quality_issues_v2";

export const HANUL_PROCESSES = [
  { id: "9bqc", name: "9BQC (G/RUN)", badge: "9BQC", color: "indigo" },
  { id: "lq2", name: "LQ2 (Hood Side)", badge: "LQ2", color: "purple" },
  { id: "lq2a", name: "LQ2a (Hood Side)", badge: "LQ2a", color: "pink" },
  { id: "assembly", name: "한울 가공·조립 (공통)", badge: "공통", color: "teal" },
  { id: "common", name: "한림공장 (전체)", badge: "전체", color: "blue" }
];

export const HANUL_DEFECT_TYPES = [
  "외관 스크래치 / 찍힘",
  "치수 편차 / 조립 불량",
  "이물 혼입 / 표면 오염",
  "형상 변형 / 단차 불량",
  "테이프 부착 / 접착 불량",
  "누락 / 결품 / 체결 불량",
  "버(Burr) / 컷팅 불량",
  "기타 특이 불량"
];

export const HANUL_SEVERITY_LEVELS = [
  { id: "CRITICAL", label: "🚨 긴급 경보 (작업 전 필독)", color: "rose", bg: "bg-rose-500", text: "text-rose-600" },
  { id: "WARNING", label: "⚠️ 주의 관찰 (품질 집중 점검)", color: "amber", bg: "bg-amber-500", text: "text-amber-600" },
  { id: "INFO", label: "ℹ️ 품질 공지 (작업 표준 안내)", color: "blue", bg: "bg-blue-500", text: "text-blue-600" }
];

const sanitizeHanulAlert = (item) => {
  if (!item || typeof item !== "object") return item;
  if (item.isManuallyRestored === true) return item;
  const idStr = String(item.id || "");
  const tsMatch = idStr.match(/(\d{13})/);
  if (!tsMatch || Number(tsMatch[1]) <= 1792541000000) {
    return { ...item, isClosedByAdmin: true };
  }
  return item;
};

// Helper: Read local storage
export const getLocalHanulQualityIssues = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(sanitizeHanulAlert);
      }
    }
  } catch (e) {
    console.error("Local storage read error for hanul quality issues:", e);
  }
  return [];
};

// Helper: Save local storage
export const saveLocalHanulQualityIssues = (items) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items || []));
  } catch (e) {
    console.error("Local storage write error for hanul quality issues:", e);
  }
};

// Real-time Cloud Synchronization
export const subscribeHanulQualityIssues = (onUpdate) => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty && snapshot.metadata?.fromCache) {
          onUpdate(getLocalHanulQualityIssues());
          return;
        }
        const remoteList = [];
        if (!snapshot.empty) {
          snapshot.forEach((d) => {
            const data = d.data();
            const isDel = Boolean(
              data?.isDeleted === true ||
              data?.deleted === true ||
              data?.isDeleted === "true" ||
              data?.status === "DELETED"
            );
            if (!isDel) {
              remoteList.push(sanitizeHanulAlert({ id: d.id, ...data }));
            }
          });
        }

        remoteList.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

        // Authoritative sync: remoteList overrides local to prevent zombie resurrection
        saveLocalHanulQualityIssues(remoteList);
        onUpdate(remoteList);
      },
      (error) => {
        console.warn("Firestore hanul_quality_issues sync warning:", error);
        onUpdate(getLocalHanulQualityIssues());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error("subscribeHanulQualityIssues error:", e);
    onUpdate(getLocalHanulQualityIssues());
    return () => {};
  }
};

// Save (create or update) issue
export const saveHanulQualityIssue = async (issueData) => {
  const current = getLocalHanulQualityIssues();
  const id = issueData.id || `hanul_qual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const existing = current.find((i) => i.id === id);

  const nowKst = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const todayStr = getKSTDateString();

  const causeImgs = Array.isArray(issueData.causeImages) ? issueData.causeImages : [];
  const actionImgs = Array.isArray(issueData.actionImages) ? issueData.actionImages : [];

  // 🔒 등록일자/발생일자 및 등록시점(createdAt) 절대 보존: 기존 등록 건 수정 시 날짜 변조 원천 차단
  const finalDate =
    issueData.date ||
    issueData.expireDate ||
    existing?.date ||
    (existing?.createdAt ? existing.createdAt.slice(0, 10) : todayStr);

  const finalCreatedAt =
    existing?.createdAt ||
    issueData.createdAt ||
    nowKst;

  const isBroadcast =
    issueData.isFirstScreenBroadcast !== undefined
      ? Boolean(issueData.isFirstScreenBroadcast)
      : Boolean(existing?.isFirstScreenBroadcast);

  const fullItem = {
    ...issueData,
    id,
    company: issueData.company || existing?.company || "한울",
    plant: issueData.plant || existing?.plant || "한림공장",
    line: issueData.line || existing?.line || "9BQC (G/RUN)",
    defectType: issueData.defectType || existing?.defectType || "외관 스크래치 / 찍힘",
    severity: issueData.severity || existing?.severity || "CRITICAL",
    title: issueData.title || existing?.title || "",
    content: issueData.content !== undefined ? issueData.content : (existing?.content || ""),
    actionResult: issueData.actionResult || existing?.actionResult || "",
    causeImages: causeImgs,
    actionImages: actionImgs,
    author: issueData.author || existing?.author || "한울",
    authorTitle: issueData.authorTitle || existing?.authorTitle || "사원",
    status: issueData.status || existing?.status || "ACTIVE", // ACTIVE | RESOLVED
    isFirstScreenBroadcast: isBroadcast,
    isFirstScreenOrigin: isBroadcast,
    ...(isBroadcast ? { isClosedByAdmin: false, isManuallyRestored: true } : {}),
    date: finalDate,
    createdAt: finalCreatedAt,
    updatedAt: nowKst
  };

  // Local storage update
  const idx = current.findIndex((i) => i.id === id);
  let updated;
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = fullItem;
  } else {
    updated = [fullItem, ...current];
  }
  saveLocalHanulQualityIssues(updated);

  // Firestore update
  try {
    const payload = sanitizeForFirestore(fullItem);
    await setDoc(doc(db, COLLECTION_NAME, id), payload);
  } catch (e) {
    console.warn("Firestore saveHanulQualityIssue fallback to local:", e);
  }

  // 🌟 공식 4M 변동점 관리대장에 즉시 자동 동기화
  syncQualityAlertToFourMLedger(fullItem, "부적합경보").catch((e) => {
    console.warn("4M ledger sync warning for hanul quality issue:", e);
  });

  return fullItem;
};

// Resolve an issue
export const resolveHanulQualityIssue = async (id, resolutionNote, resolverName = "한울") => {
  const current = getLocalHanulQualityIssues();
  const existing = current.find((i) => i.id === id);
  if (!existing) return;

  const nowKst = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const updatedItem = {
    ...existing,
    status: "RESOLVED",
    actionResult: resolutionNote || existing.actionResult || "현장 조치 및 품질 확인 완료",
    resolvedBy: resolverName,
    resolvedAt: nowKst,
    updatedAt: nowKst
  };

  const updatedList = current.map((i) => (i.id === id ? updatedItem : i));
  saveLocalHanulQualityIssues(updatedList);

  try {
    const payload = sanitizeForFirestore(updatedItem);
    await setDoc(doc(db, COLLECTION_NAME, id), payload);
  } catch (e) {
    console.warn("Firestore resolveHanulQualityIssue fallback:", e);
  }

  // 🌟 4M 변동점 관리대장에도 조치완료 상태 동기화
  syncQualityAlertToFourMLedger(updatedItem, "부적합경보").catch(() => {});

  return updatedItem;
};

// Delete an issue
export const deleteHanulQualityIssue = async (id) => {
  const current = getLocalHanulQualityIssues();
  const filtered = current.filter((i) => i.id !== id);
  saveLocalHanulQualityIssues(filtered);

  // 4M 변동점 대장에서도 즉시 등록 해제
  unregisterFromFourMLedger(id).catch(() => {});
  unregisterFromFourMLedger(`hanul_q_${id}`).catch(() => {});

  if (db) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, id), { isDeleted: true, status: "DELETED" }, { merge: true });
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (e) {
      console.warn("Firestore deleteHanulQualityIssue fallback:", e);
    }
  }
};

// Acknowledge a Hanul quality issue
export const acknowledgeHanulQualityIssue = async (id, workerName) => {
  if (!id || !workerName) return;
  const current = getLocalHanulQualityIssues();
  const target = current.find((it) => it.id === id);
  if (!target) return;

  const currentAck = Array.isArray(target.acknowledgedBy) ? target.acknowledgedBy : [];
  if (currentAck.includes(workerName)) return target;

  const updatedItem = {
    ...target,
    acknowledgedBy: [...currentAck, workerName]
  };

  return await saveHanulQualityIssue(updatedItem);
};

// Check if worker belongs to Hanul (외주가공 작업자 또는 뱃지)
export const isHanulWorkerProfile = (profile) => {
  if (!profile) return false;
  // 🌟 첫 화면 아래쪽 한울 뱃지(대표이사 hal_hu)는 관리자이므로 일반 작업자 전용 모드에서 제외 (기존 관리자 화면 보존)
  if (!profile.isFieldWorker && (profile.id === "hal_hu" || profile.name === "한울" || profile.title === "대표이사")) {
    return false;
  }
  if (profile.name === "황수현" || profile.id === "hal_sh" || profile.id === "sam_sh") {
    return false;
  }
  // 🌟 압출동, 가공동, 부림텍 작업자는 한울 외주가공에서 완전 배제!
  if (
    profile.portalType === "extrusion" ||
    profile.portalType === "machining" ||
    profile.portalType === "bulimtech" ||
    profile.building === "압출동" ||
    profile.building === "가공동" ||
    profile.id?.startsWith("ext_") ||
    profile.id?.startsWith("mach_") ||
    profile.id?.startsWith("hal_br_") ||
    profile.company === "부림텍" ||
    profile.plant === "삼랑진공장"
  ) {
    return false;
  }
  if (profile.portalType === "hanul") return true;

  const name = String(profile.name || "");
  const id = String(profile.id || "");
  const comp = String(profile.company || "");
  const line = String(profile.line || "");

  return Boolean(
    comp.includes("한울") ||
    name === "한울" ||
    id.startsWith("hal_hu") ||
    line === "9BQC" ||
    line === "LQ2" ||
    line === "LQ2a" ||
    (profile.plant === "한림공장" && [
      "박종미", "마이클", "마크", "로렉스", "무피드", "마틴",
      "박민정", "지라완", "레이놀드", "맥리", "조제인", "새드릭", "니사낫",
      "수파따", "와히드", "찬티마", "데이브", "위간", "프랭클린", "에일리",
      "마이카", "알프레도", "아이린", "에릭", "언"
    ].includes(name))
  );
};

