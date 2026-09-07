import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";
import { getKSTDateString } from "../utils/dateUtils";

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
  const startDate = scheduleItem.startDate || scheduleItem.date || getKSTDateString();
  const endDate = scheduleItem.endDate || scheduleItem.date || startDate;
  const newItem = {
    id: scheduleItem.id || `sched_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    date: startDate,
    startDate: startDate,
    endDate: endDate,
    time: scheduleItem.time || "종일",
    target: scheduleItem.target || "공통",
    title: scheduleItem.title?.trim() || "사내 공통일정",
    author: scheduleItem.author || "ADMIN",
    isCompleted: Boolean(scheduleItem.isCompleted),
    completedAt: scheduleItem.completedAt || (scheduleItem.isCompleted ? new Date().toISOString() : null),
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

  // Sort by startDate then endDate then time
  updated.sort((a, b) => {
    const aStart = a.startDate || a.date || "";
    const bStart = b.startDate || b.date || "";
    if (aStart !== bStart) return aStart.localeCompare(bStart);
    const aEnd = a.endDate || aStart;
    const bEnd = b.endDate || bStart;
    if (aEnd !== bEnd) return aEnd.localeCompare(bEnd);
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

export const toggleCompleteCommonSchedule = async (scheduleId, isCompleted = true) => {
  const current = getLocalCommonSchedules();
  const targetIdx = current.findIndex((s) => s.id === scheduleId);
  if (targetIdx < 0) return current;

  const targetItem = {
    ...current[targetIdx],
    isCompleted: isCompleted,
    completedAt: isCompleted ? new Date().toISOString() : null
  };

  const updated = [...current];
  updated[targetIdx] = targetItem;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Local storage error in toggleCompleteCommonSchedule:", e);
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, scheduleId);
    await setDoc(docRef, targetItem, { merge: true });
  } catch (e) {
    console.warn("Firestore toggleCompleteCommonSchedule warning:", e);
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
            const aStart = a.startDate || a.date || "";
            const bStart = b.startDate || b.date || "";
            if (aStart !== bStart) return aStart.localeCompare(bStart);
            const aEnd = a.endDate || aStart;
            const bEnd = b.endDate || bStart;
            if (aEnd !== bEnd) return aEnd.localeCompare(bEnd);
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

export const cleanupExpiredCommonSchedules = async (targetDate = null) => {
  const todayStr = targetDate || getKSTDateString();
  const current = getLocalCommonSchedules();
  const valid = [];
  const expiredIds = [];

  current.forEach((s) => {
    const end = s.endDate || s.startDate || s.date;
    if (end && end < todayStr) {
      expiredIds.push(s.id);
    } else {
      valid.push(s);
    }
  });

  if (expiredIds.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    } catch (e) {
      console.error("Local storage error in cleanupExpiredCommonSchedules:", e);
    }

    for (const id of expiredIds) {
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn(`Firestore delete error for expired schedule ${id}:`, e.message);
      }
    }
  }

  return valid;
};

export const getTodayCommonSchedules = (targetDate = null) => {
  const dateStr = targetDate || getKSTDateString();
  const all = getLocalCommonSchedules();
  return all.filter((s) => {
    if (s.isCompleted) return false;
    const regDate = s.createdAt ? s.createdAt.slice(0, 10) : (s.startDate || s.date);
    const startDate = s.startDate || s.date;
    const endDate = s.endDate || startDate;
    const effectiveStart = regDate <= startDate ? regDate : startDate;

    // 등록일(또는 시작일)부터 종료일까지 노출, 종료일이 지난 일정은 제외
    return Boolean(effectiveStart && endDate && effectiveStart <= dateStr && dateStr <= endDate);
  });
};

export const formatCommonSchedulesForTelegram = (scheds, todayStr = getKSTDateString()) => {
  if (!scheds || scheds.length === 0) {
    return "• 등록된 태형&미영 일정이 없습니다.";
  }
  const sorted = [...scheds].sort((a, b) => {
    const aStart = a.startDate || a.date || "";
    const bStart = b.startDate || b.date || "";
    if (aStart !== bStart) return aStart.localeCompare(bStart);
    return (a.time || "").localeCompare(b.time || "");
  });

  return sorted.map((s) => {
    const startDate = s.startDate || s.date;
    const endDate = s.endDate || startDate;
    const targetStr = s.target ? `[${s.target}] ` : "";
    const timeStr = s.time && s.time !== "종일" ? `[${s.time}] ` : "";
    const sFormatted = startDate.slice(5).replace("-", ".");
    const eFormatted = endDate.slice(5).replace("-", ".");
    if (startDate !== endDate) {
      return `• [${sFormatted}~${eFormatted}] ${targetStr}${timeStr}${s.title}`;
    } else if (startDate === todayStr) {
      return `• [오늘] ${targetStr}${timeStr}${s.title}`;
    } else {
      return `• [${sFormatted}] ${targetStr}${timeStr}${s.title}`;
    }
  }).join("\n");
};

export const injectCommonSchedulesIntoPnLTemplate = (templateText, schedulesText, dateFormatted = "") => {
  if (!templateText) return templateText;

  let text = templateText;

  // Update date header if provided
  if (dateFormatted) {
    text = text.replace(/<b>\d{4}\.\d{2}\.\d{2}[^<]*?기준<\/b>/, `<b>${dateFormatted} 기준</b>`);
  }

  // If explicit placeholder exists
  if (text.includes("{commonSchedules}")) {
    return text.replace(/\{commonSchedules\}/g, schedulesText);
  }
  if (text.includes("${commonSchedules}")) {
    return text.replace(/\$\{commonSchedules\}/g, schedulesText);
  }

  // If section [3] exists (e.g. <b>[3] ... </b> or [3] ... up to separator or link)
  const section3Regex = /(<b>\[3\][^<]*?<\/b>|\[3\][^\n]*\n)([\s\S]*?)(?=(━━━━━━━━━━━━━━━━━━━━━|<a\s+href|$))/i;
  if (section3Regex.test(text)) {
    return text.replace(section3Regex, `$1\n${schedulesText}\n`);
  }

  // Fallback
  return `${text}\n\n<b>[3] 태형이랑 & 미영이랑</b>\n${schedulesText}`;
};

