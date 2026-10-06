import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_NAME = "extrusion_quality_issues";
const LOCAL_STORAGE_KEY = "factory_extrusion_quality_issues_v2";

export const EXTRUSION_LINES = [
  { id: "pcm1", name: "PCM 1호기", badge: "PCM 1호", color: "teal" },
  { id: "pcm3", name: "PCM 3호기", badge: "PCM 3호", color: "blue" },
  { id: "pvc", name: "PVC 라인", badge: "PVC", color: "amber" },
  { id: "tpe", name: "TPE 라인", badge: "TPE", color: "purple" },
  { id: "common", name: "전 라인 (공통)", badge: "공통", color: "rose" }
];

export const DEFECT_TYPES = [
  "외관 스크래치 / 찍힘",
  "치수 편차 / 두께 불량",
  "이물 혼입 / 표면 돌기",
  "스코치 / 탄화 불량",
  "형상 변형 / 휨",
  "원료 배합 / 비중 불량",
  "원료 공급 / 토출 불량",
  "기타 특이 불량"
];

export const SEVERITY_LEVELS = [
  { id: "CRITICAL", label: "🚨 긴급 경보 (작업 전 필독)", color: "rose", bg: "bg-rose-500", text: "text-rose-600" },
  { id: "WARNING", label: "⚠️ 주의 관찰 (품질 집중 점검)", color: "amber", bg: "bg-amber-500", text: "text-amber-600" },
  { id: "INFO", label: "ℹ️ 품질 공지 (작업 표준 안내)", color: "blue", bg: "bg-blue-500", text: "text-blue-600" }
];

// Initial starter mock issues (Empty by default)
export const INITIAL_EXTRUSION_QUALITY_ISSUES = [];

// Helper: Read local storage
export const getLocalExtrusionQualityIssues = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter(i => i.id !== "ext_qual_demo_1" && i.id !== "ext_qual_demo_2");
        if (clean.length !== parsed.length) {
          saveLocalExtrusionQualityIssues(clean);
        }
        return clean;
      }
    }
  } catch (e) {
    console.error("Local storage read error for extrusion quality issues:", e);
  }
  return [];
};

// Helper: Save local storage
export const saveLocalExtrusionQualityIssues = (items) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items || []));
  } catch (e) {
    console.error("Local storage write error for extrusion quality issues:", e);
  }
};

// Real-time Cloud Synchronization
export const subscribeExtrusionQualityIssues = (onUpdate) => {
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

        const localList = getLocalExtrusionQualityIssues();
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

        saveLocalExtrusionQualityIssues(merged);
        if (onUpdate) onUpdate(merged);
      },
      (error) => {
        console.warn("Firestore extrusion quality issues sync warning:", error);
        if (onUpdate) onUpdate(getLocalExtrusionQualityIssues());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error("subscribeExtrusionQualityIssues error:", e);
    if (onUpdate) onUpdate(getLocalExtrusionQualityIssues());
    return () => {};
  }
};

// Save (Create or Update) Extrusion Quality Issue
export const saveExtrusionQualityIssue = async (issueData) => {
  const id = issueData.id || `ext_qual_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date();
  const nowStr = now.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const causeImages = Array.isArray(issueData.causeImages)
    ? issueData.causeImages
    : Array.isArray(issueData.images)
    ? issueData.images
    : [];
  const actionImages = Array.isArray(issueData.actionImages) ? issueData.actionImages : [];

  const fullItem = {
    ...issueData,
    id,
    date: issueData.date || now.toISOString().slice(0, 10),
    time: issueData.time || now.toTimeString().slice(0, 5),
    line: issueData.line || "PCM 1호기",
    title: issueData.title || "압출 품질 관리 이슈",
    defectType: issueData.defectType || "외관 스크래치 / 찍힘",
    status: issueData.status || "ACTIVE",
    content: issueData.content || "",
    actionResult: issueData.actionResult || issueData.actionGuide || issueData.resolutionNote || "",
    causeImages,
    actionImages,
    images: [...causeImages, ...actionImages],
    author: issueData.author || "설유철",
    authorTitle: issueData.authorTitle || "책임",
    createdAt: issueData.createdAt || nowStr,
    updatedAt: nowStr,
    acknowledgedBy: Array.isArray(issueData.acknowledgedBy) ? issueData.acknowledgedBy : []
  };

  const current = getLocalExtrusionQualityIssues();
  const existingIdx = current.findIndex((it) => it.id === id);
  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = fullItem;
  } else {
    updated = [fullItem, ...current];
  }

  saveLocalExtrusionQualityIssues(updated);

  try {
    await setDoc(doc(db, COLLECTION_NAME, id), fullItem);
  } catch (e) {
    console.warn("Firestore save extrusion quality issue fallback to local:", e);
  }

  return fullItem;
};

// Resolve Quality Issue
export const resolveExtrusionQualityIssue = async (
  id,
  resolutionNote = "조치 및 해결 완료",
  resolverName = "설유철",
  newActionImages = null
) => {
  const current = getLocalExtrusionQualityIssues();
  const target = current.find((it) => it.id === id);
  if (!target) return current;

  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const existingActionImages = Array.isArray(target.actionImages) ? target.actionImages : [];
  const finalActionImages = Array.isArray(newActionImages) ? newActionImages : existingActionImages;

  const updatedItem = {
    ...target,
    status: "RESOLVED",
    resolvedAt: nowStr,
    resolutionNote: resolutionNote || "조치 완료",
    actionResult: resolutionNote || target.actionResult || "조치 완료",
    actionImages: finalActionImages,
    resolvedBy: resolverName || "설유철",
    updatedAt: nowStr
  };

  return await saveExtrusionQualityIssue(updatedItem);
};

// Delete Quality Issue
export const deleteExtrusionQualityIssue = async (id) => {
  const current = getLocalExtrusionQualityIssues();
  const updated = current.filter((it) => it.id !== id);
  saveLocalExtrusionQualityIssues(updated);

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (e) {
    console.warn("Firestore delete extrusion quality issue fallback to local:", e);
  }

  return updated;
};

// Acknowledge Quality Issue (작업자가 공지 확인 완료 클릭 시)
export const acknowledgeExtrusionQualityIssue = async (id, workerName) => {
  if (!id || !workerName) return;
  const current = getLocalExtrusionQualityIssues();
  const target = current.find((it) => it.id === id);
  if (!target) return;

  const currentAck = Array.isArray(target.acknowledgedBy) ? target.acknowledgedBy : [];
  if (currentAck.includes(workerName)) return target;

  const updatedItem = {
    ...target,
    acknowledgedBy: [...currentAck, workerName]
  };

  return await saveExtrusionQualityIssue(updatedItem);
};

// Check if worker is a dedicated extrusion line operator/worker (설유철 책임은 관리자이므로 일반 작업자에서 제외)
export const isExtrusionWorkerProfile = (profile) => {
  if (!profile) return false;
  const name = profile.name || "";
  const id = profile.id || "";

  // 🌟 설유철 책임은 압출 관리자/책임자이므로 일반 현장 압출작업자에서 명확히 분리 제외
  if (name === "설유철" || id === "sam_yc") {
    return false;
  }

  const building = profile.building || "";

  return (
    name === "공영국" ||
    name === "심임대" ||
    name === "이상은" ||
    name === "닉" ||
    name === "마이클" ||
    name === "존카를로" ||
    name === "지미" ||
    name === "만" ||
    name === "샤먼" ||
    name === "쿠마루" ||
    name === "이수루" ||
    id.startsWith("ext_") ||
    (building === "압출동" && profile.role === "OPERATOR")
  );
};
