import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";

const STORAGE_KEY = "oryuk_common_schedules_v1";
const COLLECTION_NAME = "company_common_schedules";

// Initial sample common schedules (Empty by default)
const DEFAULT_COMMON_SCHEDULES = [];

export const getLocalCommonSchedules = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const filtered = Array.isArray(parsed)
        ? parsed.filter(
            (s) =>
              !s.id?.startsWith("sched_default_") &&
              !s.title?.includes("경영전략") &&
              !s.title?.includes("납품계획")
          )
        : [];
      if (filtered.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
      return filtered;
    }
  } catch (e) {
    console.error("Failed to parse local common schedules:", e);
  }
  return DEFAULT_COMMON_SCHEDULES;
};

export const saveCommonSchedule = async (scheduleItem) => {
  const current = getLocalCommonSchedules();
  const newItem = {
    id: scheduleItem.id || `sched_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    date: scheduleItem.date || new Date().toISOString().split("T")[0],
    time: scheduleItem.time || "종일",
    target: scheduleItem.target || "공통",
    title: scheduleItem.title?.trim() || "사내 공통일정",
    author: scheduleItem.author || "관리자",
    createdAt: scheduleItem.createdAt || new Date().toISOString()
  };

  const existingIdx = current.findIndex((s) => s.id === newItem.id);
  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = newItem;
  } else {
    updated = [newItem, ...current];
  }

  // Sort by date then time
  updated.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.time || "").localeCompare(b.time || "");
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Local storage error in saveCommonSchedule:", e);
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, newItem.id);
    await setDoc(docRef, newItem, { merge: true });
  } catch (e) {
    console.warn("Firestore saveCommonSchedule warning (using local):", e);
  }

  return updated;
};

export const deleteCommonSchedule = async (scheduleId) => {
  const current = getLocalCommonSchedules();
  const updated = current.filter((s) => s.id !== scheduleId);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Local storage error in deleteCommonSchedule:", e);
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, scheduleId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn("Firestore deleteCommonSchedule warning:", e);
  }

  return updated;
};

export const subscribeCommonSchedules = (callback) => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = [];
          snapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...docSnap.data() });
          });
          items.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return (a.time || "").localeCompare(b.time || "");
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
          if (callback) callback(items);
        } else {
          const localItems = getLocalCommonSchedules();
          if (callback) callback(localItems);
        }
      },
      (error) => {
        console.warn("Firestore common schedules sync warning (using local):", error);
        const localItems = getLocalCommonSchedules();
        if (callback) callback(localItems);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.error("subscribeCommonSchedules error:", e);
    const localItems = getLocalCommonSchedules();
    if (callback) callback(localItems);
    return () => {};
  }
};

export const getTodayCommonSchedules = (targetDate = null) => {
  const dateStr = targetDate || new Date().toISOString().split("T")[0];
  const all = getLocalCommonSchedules();
  return all.filter((s) => s.date === dateStr);
};
