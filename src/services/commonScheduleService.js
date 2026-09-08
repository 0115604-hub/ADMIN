import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";
import { getKSTDateString } from "../utils/dateUtils";

const STORAGE_KEY = "oryuk_common_schedules_v1";
const COLLECTION_NAME = "company_common_schedules";

// Initial sample common schedules (Live interactive sample)
const DEFAULT_COMMON_SCHEDULES = [
  {
    id: "sched_20260908_seminar",
    title: "2026 스마트 공장 고도화 및 품질 혁신 세미나",
    target: "세미나",
    startDate: "2026-09-08",
    endDate: "2026-09-09",
    date: "2026-09-08",
    time: "14:00",
    author: "ADMIN",
    createdAt: "2026-09-08T09:00:00.000Z",
    isCompleted: false,
    comments: [
      {
        id: "cmt_1",
        author: "이명재",
        role: "이사",
        plant: "삼랑진공장",
        text: "삼랑진공장 품질관리팀 전원 참석 예정입니다.",
        createdAt: "2026-09-08T10:30:00.000Z"
      },
      {
        id: "cmt_2",
        author: "김동욱",
        role: "책임",
        plant: "한림공장",
        text: "한림공장 라인 가동 일정 확인 후 2명 참석하겠습니다.",
        createdAt: "2026-09-08T11:15:00.000Z"
      }
    ]
  }
];

export const getLocalCommonSchedules = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
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
  const existingItem = current.find((s) => s.id === scheduleItem.id);

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
    createdAt: scheduleItem.createdAt || new Date().toISOString(),
    comments: Array.isArray(scheduleItem.comments)
      ? scheduleItem.comments
      : existingItem?.comments || []
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

export const addCommonScheduleComment = async (scheduleId, commentData) => {
  const current = getLocalCommonSchedules();
  const targetIdx = current.findIndex((s) => s.id === scheduleId);
  if (targetIdx < 0) return { updatedList: current, newComment: null, updatedItem: null };

  const targetItem = current[targetIdx];
  const newComment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    author: commentData.author || "작성자",
    role: commentData.role || "",
    plant: commentData.plant || "",
    text: (commentData.text || "").trim(),
    createdAt: new Date().toISOString()
  };

  const updatedComments = Array.isArray(targetItem.comments)
    ? [...targetItem.comments, newComment]
    : [newComment];

  const updatedItem = {
    ...targetItem,
    comments: updatedComments
  };

  const updated = [...current];
  updated[targetIdx] = updatedItem;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Local storage error in addCommonScheduleComment:", e);
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, scheduleId);
    await setDoc(docRef, updatedItem, { merge: true });
  } catch (e) {
    console.warn("Firestore addCommonScheduleComment warning:", e);
  }

  return { updatedList: updated, newComment, updatedItem };
};

export const deleteCommonScheduleComment = async (scheduleId, commentId) => {
  const current = getLocalCommonSchedules();
  const targetIdx = current.findIndex((s) => s.id === scheduleId);
  if (targetIdx < 0) return { updatedList: current, updatedItem: null };

  const targetItem = current[targetIdx];
  const updatedComments = (targetItem.comments || []).filter((c) => c.id !== commentId);

  const updatedItem = {
    ...targetItem,
    comments: updatedComments
  };

  const updated = [...current];
  updated[targetIdx] = updatedItem;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Local storage error in deleteCommonScheduleComment:", e);
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, scheduleId);
    await setDoc(docRef, updatedItem, { merge: true });
  } catch (e) {
    console.warn("Firestore deleteCommonScheduleComment warning:", e);
  }

  return { updatedList: updated, updatedItem };
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

export const cleanupExpiredCommonSchedules = async () => {
  return getLocalCommonSchedules();
};

export const getUncompletedCommonSchedules = () => {
  const all = getLocalCommonSchedules();
  return all.filter((s) => !s.isCompleted);
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

    return Boolean(effectiveStart && endDate && effectiveStart <= dateStr && dateStr <= endDate);
  });
};

export const getScheduleCategoryMeta = (target) => {
  switch (target) {
    case "맛집":
      return {
        badge: "맛집 탐방",
        phrase: "맛있는 음식과 함께하는 행복한 시간",
        accent: "text-rose-600 dark:text-rose-400"
      };
    case "여행":
      return {
        badge: "여행 / 힐링",
        phrase: "도심을 벗어나 둘만의 힐링 여행",
        accent: "text-amber-600 dark:text-amber-400"
      };
    case "세미나":
      return {
        badge: "세미나",
        phrase: "새로운 비전과 도약을 위한 자리",
        accent: "text-blue-600 dark:text-blue-400"
      };
    case "교육":
      return {
        badge: "교육 / 역량",
        phrase: "함께 배우고 성장하는 시간",
        accent: "text-emerald-600 dark:text-emerald-400"
      };
    case "기타":
    default:
      return {
        badge: target || "공통 일정",
        phrase: "사내 공통 일정",
        accent: "text-purple-600 dark:text-purple-400"
      };
  }
};

export const formatCommonSchedulesForTelegram = (scheds, todayStr = getKSTDateString()) => {
  if (!scheds || scheds.length === 0) {
    return "• 등록된 공통 일정이 없습니다.";
  }
  const sorted = [...scheds].sort((a, b) => {
    const aStart = a.startDate || a.date || "";
    const bStart = b.startDate || b.date || "";
    if (aStart !== bStart) return aStart.localeCompare(bStart);
    const aEnd = a.endDate || aStart;
    const bEnd = b.endDate || bStart;
    if (aEnd !== bEnd) return aEnd.localeCompare(bEnd);
    return (a.time || "").localeCompare(b.time || "");
  });

  return sorted.map((s) => {
    const startDate = s.startDate || s.date || todayStr;
    const endDate = s.endDate || startDate;
    const cat = getScheduleCategoryMeta(s.target);
    const timeStr = s.time && s.time !== "종일" ? ` [${s.time}]` : "";
    const sFormatted = startDate.length >= 10 ? startDate.slice(5).replace("-", ".") : startDate;
    const eFormatted = endDate.length >= 10 ? endDate.slice(5).replace("-", ".") : endDate;
    const commentsCount = Array.isArray(s.comments) && s.comments.length > 0 ? ` (의견 ${s.comments.length}건)` : "";
    if (startDate !== endDate) {
      return `• [${sFormatted}~${eFormatted}]${timeStr} <b>${s.title}</b> (${cat.badge})${commentsCount}`;
    } else if (startDate === todayStr) {
      return `• [오늘]${timeStr} <b>${s.title}</b> (${cat.badge})${commentsCount}`;
    } else {
      return `• [${sFormatted}]${timeStr} <b>${s.title}</b> (${cat.badge})${commentsCount}`;
    }
  }).join("\n");
};

export const injectCommonSchedulesIntoPnLTemplate = (templateText, schedulesText, dateFormatted = "") => {
  if (!templateText) return templateText;

  let text = templateText;

  // Header Title replacements
  text = text.replace(/일일\s*아침\s*손익결산\s*브리핑/g, "매출 & 일정공유");
  text = text.replace(/일일아침손익결산/g, "매출 & 일정공유");
  text = text.replace(/손익결산\s*브리핑/g, "매출 & 일정공유");
  text = text.replace(/태형이랑\s*&\s*미영이랑/g, "사내 공통일정");

  if (dateFormatted) {
    text = text.replace(/<b>\d{4}\.\d{2}\.\d{2}[^<]*?기준<\/b>/, `<b>${dateFormatted} 기준</b>`);
  }

  if (text.includes("{commonSchedules}")) {
    return text.replace(/\{commonSchedules\}/g, schedulesText);
  }
  if (text.includes("${commonSchedules}")) {
    return text.replace(/\$\{commonSchedules\}/g, schedulesText);
  }

  const section3Regex = /(<b>\[3\][^<]*?<\/b>|\[3\][^\n]*\n)([\s\S]*?)(?=(━━━━━━━━━━━━━━━━━━━━━|<a\s+href|$))/i;
  if (section3Regex.test(text)) {
    return text.replace(section3Regex, `<b>[3] 사내 공통일정</b>\n${schedulesText}\n`);
  }

  return `${text}\n\n<b>[3] 사내 공통일정</b>\n${schedulesText}`;
};
