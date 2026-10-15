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

// Helper: Read local storage
export const getLocalHanulQualityIssues = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
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
        const remoteList = [];
        if (!snapshot.empty) {
          snapshot.forEach((d) => {
            remoteList.push({ id: d.id, ...d.data() });
          });
        }

        const localList = getLocalHanulQualityIssues();
        const map = new Map();

        // 1. Seed with local
        localList.forEach((it) => {
          if (it && it.id) map.set(it.id, it);
        });

        // 2. Merge remote
        remoteList.forEach((it) => {
          if (it && it.id) map.set(it.id, it);
        });

        const merged = Array.from(map.values());
        merged.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

        saveLocalHanulQualityIssues(merged);
        onUpdate(merged);
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

  const fullItem = {
    ...issueData,
    id,
    line: issueData.line || "9BQC (G/RUN)",
    defectType: issueData.defectType || "외관 스크래치 / 찍힘",
    severity: issueData.severity || "CRITICAL",
    title: issueData.title || "",
    content: issueData.content || "",
    actionResult: issueData.actionResult || "",
    causeImages: causeImgs,
    actionImages: actionImgs,
    author: issueData.author || "한울",
    authorTitle: issueData.authorTitle || "작업원",
    status: issueData.status || "ACTIVE", // ACTIVE | RESOLVED
    date: issueData.date || todayStr,
    createdAt: issueData.createdAt || nowKst,
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

  // Dual-sync to urgentIssueService removed: 한울 품질경보는 한울 관리자 및 소속 인원에 한하여 공지되며 첫 화면 노출/합산에서 완전 분리
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

  return updatedItem;
};

// Delete an issue
export const deleteHanulQualityIssue = async (id) => {
  const current = getLocalHanulQualityIssues();
  const filtered = current.filter((i) => i.id !== id);
  saveLocalHanulQualityIssues(filtered);

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (e) {
    console.warn("Firestore deleteHanulQualityIssue fallback:", e);
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

