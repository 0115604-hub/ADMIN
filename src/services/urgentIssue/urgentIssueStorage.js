import {
  collection,
  doc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  COLLECTION_NAME,
  LOCAL_STORAGE_KEY,
  HARD_DELETED_KEY,
  FALLBACK_NE1A_ISSUE
} from "./urgentIssueConstants.js";
import {
  isHanulManagedIssue,
  sanitizeUrgentIssueItem,
  isLegacyDismissedQualityAlert,
  sortIssuesByCustomPriority
} from "./urgentIssueStatusHelpers.js";

// Helper: Read local storage with in-memory caching
let memoryUrgentIssues = null;

export const getLocalUrgentIssues = () => {
  if (memoryUrgentIssues && Array.isArray(memoryUrgentIssues)) {
    return memoryUrgentIssues;
  }
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return [{ ...FALLBACK_NE1A_ISSUE }];
    }
    const hardDeletedIdsRaw = localStorage.getItem(HARD_DELETED_KEY) || "[]";
    let hardDeletedIds = [];
    try {
      hardDeletedIds = JSON.parse(hardDeletedIdsRaw);
    } catch {
      hardDeletedIds = [];
    }

    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const list = Array.isArray(parsed) ? parsed : [];

    const clean = list
      .filter((item) => !isHanulManagedIssue(item))
      .map((item) => {
        const sanitized = sanitizeUrgentIssueItem(item);
        if (isLegacyDismissedQualityAlert(sanitized)) {
          return { ...sanitized, isDeleted: true, isClosedByAdmin: true };
        }
        return sanitized;
      });

    // Ctrl+F5 캐시 초기화 또는 쿼터 초과 시에도 NE1a 활성 경보가 증발하지 않도록 보장
    const hasNe1a = clean.some((i) => String(i.id || i._docId || "") === "issue_1792119149332");
    if (!hasNe1a && !hardDeletedIds.includes("issue_1792119149332")) {
      clean.unshift({ ...FALLBACK_NE1A_ISSUE });
    }

    memoryUrgentIssues = clean;
    return clean;
  } catch (e) {
    console.error("Local storage read error for urgent issues:", e);
    return [{ ...FALLBACK_NE1A_ISSUE }];
  }
};

// Helper: Save local storage (종결삭제관리 조회를 위해 isDeleted 항목도 함께 저장)
export const saveLocalUrgentIssues = (issues) => {
  const valid = Array.isArray(issues) ? issues : [];
  memoryUrgentIssues = valid;
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(valid));
  } catch (e) {
    console.warn("Local storage write error for urgent issues, attempting trim:", e);
    try {
      const trimmed = valid.map((item, idx) => {
        if (idx > 15 && Array.isArray(item.images) && item.images.length > 0) {
          return {
            ...item,
            images: item.images.map((img) => (typeof img === "object" ? { ...img, dataUrl: "" } : img))
          };
        }
        return item;
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (innerErr) {
      console.error("Local storage urgent issues error after trim:", innerErr);
    }
  }
};

// Real-time Cloud Synchronization
let activeUrgentIssuesUnsub = null;
const urgentIssuesSubscribers = new Set();
let cachedUrgentIssues = null;
let urgentIssuesTeardownTimer = null;

export const subscribeUrgentIssues = (onUpdate) => {
  if (typeof onUpdate !== "function") return () => {};

  // 1. 이미 메모리에 캐시가 있거나 로컬스토리지 데이터가 있으면 즉시 전달
  if (cachedUrgentIssues) {
    onUpdate(cachedUrgentIssues);
  } else {
    const local = sortIssuesByCustomPriority(getLocalUrgentIssues());
    if (local && local.length > 0) {
      cachedUrgentIssues = local;
      onUpdate(local);
    }
  }

  urgentIssuesSubscribers.add(onUpdate);

  if (urgentIssuesTeardownTimer) {
    clearTimeout(urgentIssuesTeardownTimer);
    urgentIssuesTeardownTimer = null;
  }

  // 2. 단 하나의 공유 Firestore 리스너만 연결
  if (!activeUrgentIssuesUnsub) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      activeUrgentIssuesUnsub = onSnapshot(
        colRef,
        (snapshot) => {
          if (snapshot.empty) {
            const emptyList = sortIssuesByCustomPriority(getLocalUrgentIssues());
            cachedUrgentIssues = emptyList;
            urgentIssuesSubscribers.forEach((cb) => {
              try { cb(emptyList); } catch (e) { console.error("UrgentIssues listener cb error:", e); }
            });
            return;
          }
          const list = [];
          snapshot.forEach((d) => {
            const data = d.data();
            if (!data) return;
            // 첫 화면 전용 목록에서 협력업체/공정별 개별 관리자 이슈 영구 분리 및 Firestore 삭제
            if (isHanulManagedIssue({ id: d.id, ...data })) {
              deleteDoc(doc(db, COLLECTION_NAME, d.id)).catch(() => {});
              return;
            }
            const sanitized = sanitizeUrgentIssueItem({ ...data, id: d.id, _docId: d.id, customId: data.id });
            const isDel = Boolean(
              data.isDeleted === true ||
              data.deleted === true ||
              data.isDeleted === "true" ||
              data.deleted === "true" ||
              isLegacyDismissedQualityAlert(sanitized)
            );
            list.push({ ...sanitized, isDeleted: isDel, isClosedByAdmin: isDel ? true : Boolean(data.isClosedByAdmin) });
          });
          const sorted = sortIssuesByCustomPriority(list);
          cachedUrgentIssues = sorted;
          saveLocalUrgentIssues(sorted);
          urgentIssuesSubscribers.forEach((cb) => {
            try { cb(sorted); } catch (e) { console.error("UrgentIssues listener cb error:", e); }
          });
        },
        (error) => {
          console.warn("Firestore urgent_issues sync warning (offline/rule):", error);
          const fallback = sortIssuesByCustomPriority(getLocalUrgentIssues());
          cachedUrgentIssues = fallback;
          urgentIssuesSubscribers.forEach((cb) => {
            try { cb(fallback); } catch (e) { console.error("UrgentIssues listener cb error:", e); }
          });
        }
      );
    } catch (e) {
      console.error("subscribeUrgentIssues error:", e);
      const fallback = sortIssuesByCustomPriority(getLocalUrgentIssues());
      onUpdate(fallback);
    }
  }

  // 3. 디바운스된 리스너 해제
  return () => {
    urgentIssuesSubscribers.delete(onUpdate);
    if (urgentIssuesSubscribers.size === 0) {
      urgentIssuesTeardownTimer = setTimeout(() => {
        if (urgentIssuesSubscribers.size === 0 && activeUrgentIssuesUnsub) {
          activeUrgentIssuesUnsub();
          activeUrgentIssuesUnsub = null;
        }
      }, 5000);
    }
  };
};
