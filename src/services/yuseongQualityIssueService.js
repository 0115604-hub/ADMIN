// (주)유성 외주가공 품질이슈 및 작업자 프로필 서비스
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

const COLLECTION_NAME = "yuseong_quality_issues";
const LOCAL_STORAGE_KEY = "factory_yuseong_quality_issues_v1";

export const YUSEONG_QUALITY_PROJECTS = [
  { id: "JK1", name: "JK1 Part'g", badge: "JK1 Part'g", color: "indigo" },
  { id: "CE1", name: "CE1 Part'g", badge: "CE1 Part'g", color: "blue" },
  { id: "DT", name: "DT Hood", badge: "DT Hood", color: "teal" },
  { id: "COMMON", name: "유성 (공통)", badge: "공통", color: "slate" }
];

export const YUSEONG_DEFECT_TYPES = [
  "찢어짐 / 단품손상",
  "미성형 / 미성형 돌기",
  "치수 편차 / 규격 공차 이탈",
  "조인트 박리 / 접착 불량",
  "외관 스크래치 / 찍힘",
  "홀 누락 / 피칭 불량",
  "단차 / 씹힘 / 기포",
  "이물 혼입 / 표면 오염",
  "기타 특이 불량"
];

// Helper: Read local storage
export const getLocalYuseongQualityIssues = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Local storage read error for yuseong quality issues:", e);
  }
  return [];
};

// Helper: Save local storage
export const saveLocalYuseongQualityIssues = (items) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items || []));
  } catch (e) {
    console.error("Local storage write error for yuseong quality issues:", e);
  }
};

// Real-time Cloud Synchronization
export const subscribeYuseongQualityIssues = (onUpdate) => {
  if (!db) {
    onUpdate(getLocalYuseongQualityIssues());
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
        saveLocalYuseongQualityIssues(remoteList);
        onUpdate(remoteList);
      },
      (error) => {
        console.warn("Firestore yuseong_quality_issues sync warning:", error);
        onUpdate(getLocalYuseongQualityIssues());
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn("Firestore subscription error for yuseong_quality_issues:", err);
    onUpdate(getLocalYuseongQualityIssues());
    return () => {};
  }
};

// Save or Update Quality Issue
export const saveYuseongQualityIssue = async (issueData) => {
  const localList = getLocalYuseongQualityIssues();
  const id = issueData.id || `yuseong_qi_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const existing = localList.find((it) => it.id === id);
  const now = new Date().toISOString();

  // 🔒 등록일자/발생일자 및 등록시점(createdAt) 절대 보존: 기존 등록 건 수정 시 날짜 변조 원천 차단
  const finalDate =
    issueData.date ||
    issueData.expireDate ||
    existing?.date ||
    (existing?.createdAt ? existing.createdAt.slice(0, 10) : now.slice(0, 10));

  const finalCreatedAt =
    existing?.createdAt ||
    issueData.createdAt ||
    now;

  const actionImgs = Array.isArray(issueData.actionImages) ? issueData.actionImages : (existing?.actionImages || []);
  const resolvedActionText =
    issueData.actionResult !== undefined
      ? String(issueData.actionResult || "").trim()
      : String(existing?.actionResult || "").trim();
  const hasActionData = Boolean(resolvedActionText || actionImgs.length > 0);
  const cleanIssueData = { ...issueData };
  delete cleanIssueData.raw;

  const record = {
    ...cleanIssueData,
    id,
    date: finalDate,
    company: "유성",
    actionResult: resolvedActionText || (actionImgs.length > 0 ? "조치 후 사진 등록 완료 (현장 조치 완료)" : ""),
    actionImages: actionImgs,
    replies: Array.isArray(issueData.replies) ? issueData.replies : (existing?.replies || []),
    updatedAt: now,
    createdAt: finalCreatedAt,
    status: hasActionData ? "RESOLVED" : (issueData.status || existing?.status || "ACTIVE"), // ACTIVE (진행중) | RESOLVED (조치완료)
    isResolved: hasActionData || issueData.status === "RESOLVED" || Boolean(issueData.isResolved),
    acknowledgedBy: Array.isArray(issueData.acknowledgedBy) ? issueData.acknowledgedBy : (existing?.acknowledgedBy || [])
  };

  // 1. Save to Local Storage immediately
  const existingIdx = localList.findIndex((it) => it.id === id);
  if (existingIdx >= 0) {
    localList[existingIdx] = record;
  } else {
    localList.unshift(record);
  }
  saveLocalYuseongQualityIssues(localList);

  // 2. Sync to Firestore
  if (db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await setDoc(docRef, sanitizeForFirestore(record), { merge: true });
    } catch (e) {
      console.warn("Firestore save error for yuseong quality issue, local saved:", e);
    }
  }

  return record;
};

// Worker Acknowledgment Check
export const acknowledgeYuseongQualityIssue = async (issueId, workerName) => {
  if (!issueId || !workerName) return;
  const localList = getLocalYuseongQualityIssues();
  const target = localList.find((it) => it.id === issueId);
  if (!target) return;

  const acks = Array.isArray(target.acknowledgedBy) ? [...target.acknowledgedBy] : [];
  if (!acks.includes(workerName)) {
    acks.push(workerName);
    target.acknowledgedBy = acks;
    target.updatedAt = new Date().toISOString();
    saveLocalYuseongQualityIssues(localList);

    if (db) {
      try {
        const docRef = doc(db, COLLECTION_NAME, issueId);
        await setDoc(docRef, { acknowledgedBy: acks, updatedAt: target.updatedAt }, { merge: true });
      } catch (e) {
        console.warn("Failed to sync yuseong acknowledge to Firestore:", e);
      }
    }
  }
};

// Helper: Check if profile belongs to (주)유성
export const isYuseongWorkerProfile = (profile) => {
  if (!profile) return false;
  if (profile.portalType === "yuseong") return true;
  const comp = String(profile.company || "").trim();
  if (comp.includes("유성")) return true;
  return false;
};

// Delete Yuseong Quality Issue
export const deleteYuseongQualityIssue = async (id) => {
  if (!id) return;
  const localList = getLocalYuseongQualityIssues().filter((it) => it.id !== id);
  saveLocalYuseongQualityIssues(localList);

  // 4M 변동점 대장에서도 즉시 등록 해제
  unregisterFromFourMLedger(id).catch(() => {});
  unregisterFromFourMLedger(`ys_q_${id}`).catch(() => {});

  if (db) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, id), { isDeleted: true, status: "DELETED" }, { merge: true });
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (e) {
      console.warn("Firestore delete yuseong quality issue fallback:", e);
    }
  }
};
