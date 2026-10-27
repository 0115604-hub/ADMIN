import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeForFirestore } from "../utils/firestoreUtils";
import {
  syncQualityAlertToFourMLedger,
  unregisterFromFourMLedger
} from "./fourMChangePointService";

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

const sanitizeExtrusionAlert = (item) => {
  if (!item || typeof item !== "object") return item;
  if (item.isManuallyRestored === true || item.isClosedByAdmin === false) return item;
  const idStr = String(item.id || "");
  const tsMatch = idStr.match(/(\d{13})/);
  if (tsMatch) {
    const ts = Number(tsMatch[1]);
    if (ts > 1792541000000 || (ts >= 1776700000000 && ts < 1790000000000)) {
      return item;
    }
  }
  return { ...item, isClosedByAdmin: true };
};

// Helper: Read local storage
export const getLocalExtrusionQualityIssues = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const clean = parsed
          .filter(i => i.id !== "ext_qual_demo_1" && i.id !== "ext_qual_demo_2")
          .map(sanitizeExtrusionAlert);
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
        if (snapshot.empty && snapshot.metadata?.fromCache) {
          if (onUpdate) onUpdate(getLocalExtrusionQualityIssues());
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
            if (!isDel && d.id !== "ext_qual_demo_1" && d.id !== "ext_qual_demo_2") {
              remoteList.push(sanitizeExtrusionAlert({ id: d.id, ...data }));
            }
          });
        }

        remoteList.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

        // Authoritative sync: remoteList overrides local to prevent resurrecting deleted zombie issues!
        saveLocalExtrusionQualityIssues(remoteList);
        if (onUpdate) onUpdate(remoteList);
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
  const current = getLocalExtrusionQualityIssues();
  const id = issueData.id || `ext_qual_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const existing = current.find((it) => it.id === id);

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
    : (existing?.causeImages || []);
  const actionImages = Array.isArray(issueData.actionImages) ? issueData.actionImages : (existing?.actionImages || []);
  const resolvedActionText =
    issueData.actionResult !== undefined
      ? String(issueData.actionResult || issueData.actionGuide || issueData.resolutionNote || "").trim()
      : String(existing?.actionResult || "").trim();
  const hasActionData = Boolean(resolvedActionText || actionImages.length > 0);
  const cleanIssueData = { ...issueData };
  delete cleanIssueData.raw;

  // 🔒 등록일자/발생일자 및 등록시점(createdAt) 절대 보존: 기존 등록 건 수정 시 날짜 변조 원천 차단
  const finalDate =
    issueData.date ||
    issueData.expireDate ||
    existing?.date ||
    (existing?.createdAt ? existing.createdAt.slice(0, 10) : now.toISOString().slice(0, 10));

  const finalCreatedAt =
    existing?.createdAt ||
    issueData.createdAt ||
    nowStr;

  const isBroadcast =
    issueData.isFirstScreenBroadcast !== undefined
      ? Boolean(issueData.isFirstScreenBroadcast)
      : Boolean(existing?.isFirstScreenBroadcast);

  const fullItem = {
    ...cleanIssueData,
    id,
    company: issueData.company || existing?.company || "압출동",
    targetWorkerGroup: issueData.targetWorkerGroup || existing?.targetWorkerGroup || "extrusion",
    plant: issueData.plant || existing?.plant || "삼랑진공장",
    building: "압출동",
    date: finalDate,
    time: issueData.time || existing?.time || now.toTimeString().slice(0, 5),
    line: issueData.line || existing?.line || "PCM 1호기",
    title: issueData.title || existing?.title || "압출동 부적합경보",
    defectType: issueData.defectType || existing?.defectType || "외관 스크래치 / 찍힘",
    severity: issueData.severity || existing?.severity || "CRITICAL",
    status: hasActionData ? "RESOLVED" : (issueData.status || existing?.status || "ACTIVE"),
    isResolved: hasActionData || issueData.status === "RESOLVED" || Boolean(issueData.isResolved),
    content: issueData.content !== undefined ? issueData.content : (existing?.content || ""),
    actionResult: resolvedActionText || (actionImages.length > 0 ? "조치 후 사진 등록 완료 (현장 조치 완료)" : ""),
    actionAuthor: issueData.actionAuthor || existing?.actionAuthor || issueData.author || existing?.author || "설유철",
    actionAt: hasActionData ? (issueData.actionAt || nowStr) : (existing?.actionAt || ""),
    causeImages,
    actionImages,
    images: [...causeImages, ...actionImages],
    replies: Array.isArray(issueData.replies) ? issueData.replies : (existing?.replies || []),
    author: issueData.author || existing?.author || "설유철",
    authorTitle: issueData.authorTitle || existing?.authorTitle || "책임",
    isFirstScreenBroadcast: isBroadcast,
    isFirstScreenOrigin: isBroadcast,
    ...(isBroadcast ? { isClosedByAdmin: Boolean(issueData.isClosedByAdmin), isManuallyRestored: true } : {}),
    createdAt: finalCreatedAt,
    updatedAt: nowStr,
    acknowledgedBy: Array.isArray(issueData.acknowledgedBy) ? issueData.acknowledgedBy : (existing?.acknowledgedBy || [])
  };

  const existingIdx = current.findIndex((it) => it.id === id);
  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = fullItem;
  } else {
    updated = [fullItem, ...current];
  }

  saveLocalExtrusionQualityIssues(updated);

  if (db) {
    try {
      const payload = sanitizeForFirestore(fullItem);
      await setDoc(doc(db, COLLECTION_NAME, id), payload);
    } catch (e) {
      console.warn("Firestore save extrusion quality issue fallback to local:", e);
    }
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

  // 4M 변동점 대장에서도 즉시 등록 해제
  unregisterFromFourMLedger(id).catch(() => {});
  unregisterFromFourMLedger(`ext_q_${id}`).catch(() => {});

  if (db) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, id), { isDeleted: true, status: "DELETED" }, { merge: true });
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (e) {
      console.warn("Firestore delete extrusion quality issue fallback to local:", e);
    }
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
  const comp = profile.company || "";
  const plant = profile.plant || "";
  const line = profile.line || "";
  const portal = profile.portalType || "";

  // 🌟 설유철 책임은 압출 관리자/책임자이므로 일반 현장 압출작업자에서 명확히 분리 제외
  if (name === "설유철" || id === "sam_yc") {
    return false;
  }

  // 🌟 명시적 portalType 검사
  if (portal === "extrusion") return true;
  if (portal === "hanul" || portal === "bulimtech" || portal === "machining") return false;

  // 🌟 한울 외주가공, 부림텍, 가공동 및 한림공장 작업자는 압출 작업자에서 명확히 분리 제외
  if (
    comp.includes("한울") ||
    comp.includes("부림") ||
    id.startsWith("hal_hu") ||
    id.startsWith("hal_br") ||
    id.startsWith("mach_") ||
    plant === "한림공장" ||
    profile.building === "가공동" ||
    line === "9BQC" ||
    line === "LQ2" ||
    line === "LQ2a"
  ) {
    return false;
  }

  const building = profile.building || "";

  return Boolean(
    building === "압출동" ||
    id.startsWith("ext_") ||
    profile.assignedProcess === "압출동" ||
    (plant === "삼랑진공장" && [
      "공영국", "심임대", "이상은", "닉", "마이클", "존카를로", "지미", "만", "샤먼", "쿠마루", "이수루"
    ].includes(name))
  );
};
