import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_NAME = "urgent_issues";
const LOCAL_STORAGE_KEY = "oryuk_urgent_issues_v1";

// Initial urgent issue samples
export const INITIAL_URGENT_ISSUES = [
  {
    id: "issue_init_1",
    plant: "삼랑진공장",
    author: "방상국",
    authorTitle: "선임",
    level: "EMERGENCY", // EMERGENCY (긴급비상), WARNING (주의), NOTICE (공지)
    title: "압출 2호기 히터 온도 점검 요망",
    content: "압출 2호기 금형 히터 온도 센서 이상 경보 발생. 교대 작업 전 사전 예열 상태 및 온도 확인 필수",
    isBlinking: true,
    isResolved: false,
    createdAt: "2026-09-03 08:30"
  },
  {
    id: "issue_init_2",
    plant: "한림공장",
    author: "우창용",
    authorTitle: "선임",
    level: "WARNING",
    title: "CHANNEL 밴딩 라인 신규 원료 투입",
    content: "오후 출하 물량 대응을 위해 신규 원재료 로트 투입 완료. 초품 치수 검사 철저히 진행 요망",
    isBlinking: true,
    isResolved: false,
    createdAt: "2026-09-03 09:15"
  }
];

// Helper: Read local storage
export const getLocalUrgentIssues = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_URGENT_ISSUES));
      return INITIAL_URGENT_ISSUES;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error("Local storage read error for urgent issues:", e);
    return INITIAL_URGENT_ISSUES;
  }
};

// Helper: Save local storage
export const saveLocalUrgentIssues = (issues) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(issues));
  } catch (e) {
    console.error("Local storage write error for urgent issues:", e);
  }
};

// Real-time Cloud Synchronization
export const subscribeUrgentIssues = (onUpdate) => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() });
          });
          // Sort by createdAt descending
          list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          saveLocalUrgentIssues(list);
          onUpdate(list);
        } else {
          // Initialize remote database if empty
          const locals = getLocalUrgentIssues();
          locals.forEach((item) => {
            setDoc(doc(db, COLLECTION_NAME, item.id), item).catch(() => {});
          });
          onUpdate(locals);
        }
      },
      (error) => {
        console.warn("Firestore urgent_issues sync warning (offline/rule):", error);
        onUpdate(getLocalUrgentIssues());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error("subscribeUrgentIssues error:", e);
    onUpdate(getLocalUrgentIssues());
    return () => {};
  }
};

// Add or update an urgent issue
export const saveUrgentIssue = async (issueData) => {
  const current = getLocalUrgentIssues();
  const id = issueData.id || `issue_${Date.now()}`;
  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const fullItem = {
    ...issueData,
    id,
    isBlinking: issueData.isBlinking !== undefined ? issueData.isBlinking : true,
    isResolved: issueData.isResolved || false,
    createdAt: issueData.createdAt || nowStr
  };

  const existingIdx = current.findIndex((i) => i.id === id);
  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = fullItem;
  } else {
    updated = [fullItem, ...current];
  }

  saveLocalUrgentIssues(updated);

  try {
    await setDoc(doc(db, COLLECTION_NAME, id), fullItem);
  } catch (e) {
    console.warn("Firestore save urgent issue fallback to local:", e);
  }

  return fullItem;
};

// Delete an urgent issue
export const deleteUrgentIssue = async (id) => {
  const current = getLocalUrgentIssues();
  const updated = current.filter((i) => i.id !== id);
  saveLocalUrgentIssues(updated);

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (e) {
    console.warn("Firestore delete urgent issue fallback to local:", e);
  }

  return updated;
};

// Toggle issue resolution status
export const toggleIssueResolved = async (id) => {
  const current = getLocalUrgentIssues();
  const target = current.find((i) => i.id === id);
  if (!target) return current;

  const updatedTarget = { ...target, isResolved: !target.isResolved };
  return await saveUrgentIssue(updatedTarget);
};

// Toggle issue blinking status
export const toggleIssueBlinking = async (id) => {
  const current = getLocalUrgentIssues();
  const target = current.find((i) => i.id === id);
  if (!target) return current;

  const updatedTarget = { ...target, isBlinking: !target.isBlinking };
  return await saveUrgentIssue(updatedTarget);
};