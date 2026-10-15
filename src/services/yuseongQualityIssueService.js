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
            remoteList.push({ id: d.id, ...d.data() });
          });
        }

        const localList = getLocalYuseongQualityIssues();
        const map = new Map();

        localList.forEach((it) => {
          if (it && it.id) map.set(it.id, it);
        });

        remoteList.forEach((it) => {
          if (it && it.id) map.set(it.id, it);
        });

        const merged = Array.from(map.values());
        merged.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

        saveLocalYuseongQualityIssues(merged);
        onUpdate(merged);
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
  const isNew = !issueData.id;
  const id = issueData.id || `yuseong_qi_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();

  const record = {
    ...issueData,
    id,
    company: "유성",
    updatedAt: now,
    createdAt: issueData.createdAt || now,
    status: issueData.status || "ACTIVE", // ACTIVE (진행중) | RESOLVED (조치완료)
    acknowledgedBy: Array.isArray(issueData.acknowledgedBy) ? issueData.acknowledgedBy : []
  };

  // 1. Save to Local Storage immediately
  const localList = getLocalYuseongQualityIssues();
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
