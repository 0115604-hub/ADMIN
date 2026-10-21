// Machining (가공동) Quality Issue & Worker Profile Service
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

const COLLECTION_NAME = "machining_quality_issues";
const LOCAL_STORAGE_KEY = "factory_machining_quality_issues_v1";

export const MACHINING_QUALITY_PROJECTS = [
  { id: "JA", name: "JA G/RUN", badge: "JA", color: "indigo" },
  { id: "NX4", name: "NX4 G/RUN", badge: "NX4", color: "blue" },
  { id: "NX4A", name: "NX4a G/RUN", badge: "NX4a", color: "teal" },
  { id: "HR", name: "HR G/RUN", badge: "HR", color: "amber" },
  { id: "COMMON", name: "가공동 (공통)", badge: "공통", color: "slate" }
];

export const MACHINING_DEFECT_TYPES = [
  "외관 스크래치 / 찍힘",
  "치수 편차 / 규격 공차 이탈",
  "조인트 떨어짐 / 박리",
  "조인트 양부족 / 미성형",
  "단차 / 씹힘 / 기포",
  "본드 도포 누락 / 과도포",
  "단컷팅 불량 / 버(Burr)",
  "이물 혼입 / 표면 오염",
  "기타 특이 불량"
];

// Helper: Read local storage
export const getLocalMachiningQualityIssues = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Local storage read error for machining quality issues:", e);
  }
  return [];
};

// Helper: Save local storage
export const saveLocalMachiningQualityIssues = (items) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items || []));
  } catch (e) {
    console.error("Local storage write error for machining quality issues:", e);
  }
};

// Real-time Cloud Synchronization
export const subscribeMachiningQualityIssues = (onUpdate) => {
  if (!db) {
    onUpdate(getLocalMachiningQualityIssues());
    return () => {};
  }
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
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
              remoteList.push({ id: d.id, ...data });
            }
          });
        }

        remoteList.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

        // Authoritative sync: remoteList overrides local to prevent zombie resurrection
        saveLocalMachiningQualityIssues(remoteList);
        onUpdate(remoteList);
      },
      (error) => {
        console.warn("Firestore machining_quality_issues sync warning:", error);
        onUpdate(getLocalMachiningQualityIssues());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error("subscribeMachiningQualityIssues error:", e);
    onUpdate(getLocalMachiningQualityIssues());
    return () => {};
  }
};

// Save (create or update) issue
export const saveMachiningQualityIssue = async (issueData) => {
  const current = getLocalMachiningQualityIssues();
  const id = issueData.id || `mach_qual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
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
    company: issueData.company || existing?.company || "오륙",
    plant: "삼랑진공장",
    building: "가공동",
    line: issueData.line || existing?.line || "JA G/RUN",
    defectType: issueData.defectType || existing?.defectType || "외관 스크래치 / 찍힘",
    severity: issueData.severity || existing?.severity || "CRITICAL",
    title: issueData.title || existing?.title || "",
    content: issueData.content || existing?.content || "",
    actionResult: issueData.actionResult || existing?.actionResult || "",
    causeImages: causeImgs,
    actionImages: actionImgs,
    author: issueData.author || existing?.author || "가공동",
    authorTitle: issueData.authorTitle || existing?.authorTitle || "사원",
    status: issueData.status || existing?.status || "ACTIVE",
    isFirstScreenBroadcast: isBroadcast,
    isFirstScreenOrigin: isBroadcast,
    ...(isBroadcast ? { isClosedByAdmin: false, isManuallyRestored: true } : {}),
    date: finalDate,
    createdAt: finalCreatedAt,
    updatedAt: nowKst
  };

  const idx = current.findIndex((i) => i.id === id);
  let updated;
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = fullItem;
  } else {
    updated = [fullItem, ...current];
  }
  saveLocalMachiningQualityIssues(updated);

  if (db) {
    try {
      const payload = sanitizeForFirestore(fullItem);
      await setDoc(doc(db, COLLECTION_NAME, id), payload);
    } catch (e) {
      console.warn("Firestore saveMachiningQualityIssue fallback:", e);
    }
  }

  // 🌟 공식 4M 변동점 관리대장에 즉시 자동 동기화
  syncQualityAlertToFourMLedger(fullItem, "부적합경보").catch((e) => {
    console.warn("4M ledger sync warning for machining quality issue:", e);
  });

  return fullItem;
};

// Resolve an issue
export const resolveMachiningQualityIssue = async (id, resolutionNote, resolverName = "가공동 관리자") => {
  const current = getLocalMachiningQualityIssues();
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
  saveLocalMachiningQualityIssues(updatedList);

  if (db) {
    try {
      const payload = sanitizeForFirestore(updatedItem);
      await setDoc(doc(db, COLLECTION_NAME, id), payload);
    } catch (e) {
      console.warn("Firestore resolveMachiningQualityIssue fallback:", e);
    }
  }

  // 🌟 공식 4M 변동점 관리대장에 즉시 자동 동기화
  syncQualityAlertToFourMLedger(updatedItem, "부적합경보").catch((e) => {
    console.warn("4M ledger sync warning for machining quality issue resolve:", e);
  });

  return updatedItem;
};

// Delete an issue
export const deleteMachiningQualityIssue = async (id) => {
  const current = getLocalMachiningQualityIssues();
  const filtered = current.filter((i) => i.id !== id);
  saveLocalMachiningQualityIssues(filtered);

  // 4M 변동점 대장에서도 즉시 등록 해제
  unregisterFromFourMLedger(id).catch(() => {});
  unregisterFromFourMLedger(`mach_q_${id}`).catch(() => {});

  if (db && id) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, id), { isDeleted: true, status: "DELETED" }, { merge: true });
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (e) {
      console.warn("Firestore deleteMachiningQualityIssue fallback:", e);
    }
  }
};

// Acknowledge a quality issue
export const acknowledgeMachiningQualityIssue = async (id, workerName) => {
  if (!id || !workerName) return;
  const current = getLocalMachiningQualityIssues();
  const target = current.find((it) => it.id === id);
  if (!target) return;

  const currentAck = Array.isArray(target.acknowledgedBy) ? target.acknowledgedBy : [];
  if (currentAck.includes(workerName)) return target;

  const updatedItem = {
    ...target,
    acknowledgedBy: [...currentAck, workerName]
  };

  return await saveMachiningQualityIssue(updatedItem);
};

// 🌟 Check if current worker profile belongs to Machining (가공동)
export const isMachiningWorkerProfile = (profile) => {
  if (!profile) return false;
  if (profile.portalType === "machining") return true;
  if (profile.building === "가공동") return true;
  if (profile.id && String(profile.id).startsWith("mach_")) return true;

  const comp = String(profile.company || "");
  const dept = String(profile.dept || "");
  const line = String(profile.line || "").toUpperCase();
  const name = String(profile.name || "");

  // Exclude managers / other plants
  if (profile.plant === "한림공장" || profile.portalType === "hanul" || profile.portalType === "bulimtech" || profile.building === "압출동") {
    return false;
  }

  if (comp.includes("오륙") && dept.includes("가공")) return true;
  if (line.includes("JA") || line.includes("NX4") || line.includes("HR")) return true;

  const machiningWorkerNames = [
    "크리스토퍼", "찬턴", "로빈", "채수연", "피아", "데이시", "짱", "김선옥",
    "윤희수", "데니스", "주재순", "김수연", "이스라엘", "케넷",
    "돈돈", "알라딘", "박순복", "김상아", "김윤자", "김현희",
    "버나드", "롤란도", "김순미", "양인순",
    "손선희", "이영숙", "수베트", "치찬", "콩지", "최현영", "장수미"
  ];

  return machiningWorkerNames.includes(name);
};
