import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";
import { getKSTDateString } from "../utils/dateUtils";

const STORAGE_KEY = "oryuk_common_schedules_v1";
const ARCHIVE_STORAGE_KEY = "oryuk_common_schedules_archive_v1";
const COLLECTION_NAME = "company_common_schedules";
const ARCHIVE_COLLECTION_NAME = "company_common_schedules_archive";

// Initial sample common schedules
const DEFAULT_COMMON_SCHEDULES = [];

/**
 * KST 기준 현재 날짜(YYYY-MM-DD) 및 시간(HH:mm) 문자열 반환
 */
export const getKSTCurrentDateTime = () => {
  const now = new Date();
  // KST is UTC+9
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 3600000));
  
  const yyyy = kst.getFullYear();
  const mm = String(kst.getMonth() + 1).padStart(2, "0");
  const dd = String(kst.getDate()).padStart(2, "0");
  const hours = String(kst.getHours()).padStart(2, "0");
  const minutes = String(kst.getMinutes()).padStart(2, "0");

  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hours}:${minutes}`,
    dateTimeStr: `${yyyy}-${mm}-${dd} ${hours}:${minutes}`,
    timestamp: kst.getTime()
  };
};

/**
 * 일정의 날짜 및 시간이 현재 KST 기준 경과(만료)했는지 판별
 * @param {Object} schedule - { startDate, endDate, date, time }
 * @returns {boolean}
 */
export const isScheduleExpired = (schedule) => {
  if (!schedule) return false;

  const current = getKSTCurrentDateTime();
  const targetDate = schedule.endDate || schedule.startDate || schedule.date || current.date;
  const time = (schedule.time || "종일").trim();

  // 1. '종일'인 경우: 해당 날짜의 23:59:59까지 유효 (즉, 날짜가 오늘보다 이전이면 경과됨)
  if (time === "종일" || !time) {
    return targetDate < current.date;
  }

  // 2. 특정 시간(예: '14:00', '09:30')이 지정된 경우: 해당 날짜의 시간 경과 시 즉시 만료
  const formattedTime = time.length === 5 ? time : time.padStart(5, "0");
  const targetDateTime = `${targetDate} ${formattedTime}`;

  return current.dateTimeStr > targetDateTime;
};

/* ========================================================================= */
/* 📂 1. 보관 대장 (Archive Ledger) 로컬 & Firestore 관리 */
/* ========================================================================= */

export const getLocalCommonScheduleArchive = () => {
  try {
    const saved = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to parse local schedule archive:", e);
  }
  return [];
};

/**
 * 삭제/경과된 일정을 보관대장에 등록
 */
export const saveToCommonScheduleArchive = async (scheduleItem, reason = "시간 경과 자동 삭제 및 대장 이관") => {
  if (!scheduleItem) return;

  const currentArchive = getLocalCommonScheduleArchive();
  const kstNow = getKSTCurrentDateTime();

  const archiveEntry = {
    ...scheduleItem,
    archivedAt: new Date().toISOString(),
    archivedAtKST: kstNow.dateTimeStr,
    archiveReason: reason,
    isArchived: true
  };

  // Prevent duplicates in archive
  const existingIdx = currentArchive.findIndex((item) => item.id === archiveEntry.id);
  let updatedArchive;
  if (existingIdx >= 0) {
    updatedArchive = [...currentArchive];
    updatedArchive[existingIdx] = archiveEntry;
  } else {
    updatedArchive = [archiveEntry, ...currentArchive];
  }

  // Sort by archivedAt desc
  updatedArchive.sort((a, b) => new Date(b.archivedAt || 0) - new Date(a.archivedAt || 0));

  try {
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(updatedArchive));
  } catch (e) {
    console.error("Failed to save to local schedule archive:", e);
  }

  try {
    const docRef = doc(db, ARCHIVE_COLLECTION_NAME, archiveEntry.id);
    await setDoc(docRef, archiveEntry, { merge: true });
  } catch (e) {
    console.warn("Firestore saveToCommonScheduleArchive warning:", e);
  }

  return updatedArchive;
};

/**
 * 보관대장 실시간 구독
 */
export const subscribeCommonScheduleArchive = (callback) => {
  try {
    const colRef = collection(db, ARCHIVE_COLLECTION_NAME);
    const q = query(colRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = [];
          snapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...docSnap.data() });
          });
          items.sort((a, b) => new Date(b.archivedAt || 0) - new Date(a.archivedAt || 0));
          localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(items));
          if (callback) callback(items);
        } else {
          const localItems = getLocalCommonScheduleArchive();
          if (callback) callback(localItems);
        }
      },
      (error) => {
        console.warn("Firestore archive sync warning (using local):", error);
        const localItems = getLocalCommonScheduleArchive();
        if (callback) callback(localItems);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.error("subscribeCommonScheduleArchive error:", e);
    const localItems = getLocalCommonScheduleArchive();
    if (callback) callback(localItems);
    return () => {};
  }
};

/* ========================================================================= */
/* 📅 2. 활성 공통 일정 (Active Schedules) 관리 */
/* ========================================================================= */

export const getLocalCommonSchedules = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to parse local common schedules:", e);
  }
  return DEFAULT_COMMON_SCHEDULES;
};

/**
 * 신규 일정 등록 및 수정
 */
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

/**
 * ⚡ [핵심 기능] 날짜 및 시간이 경과된 일정 자동 삭제 및 보관대장 등록 이관
 */
export const cleanupExpiredCommonSchedules = async () => {
  const current = getLocalCommonSchedules();
  if (!current || current.length === 0) return [];

  const expiredItems = [];
  const activeItems = [];

  for (const item of current) {
    if (isScheduleExpired(item)) {
      expiredItems.push(item);
    } else {
      activeItems.push(item);
    }
  }

  if (expiredItems.length > 0) {
    console.log(`[공통일정 자동정리] 시간 경과된 일정 ${expiredItems.length}건을 보관대장으로 이관하고 삭제합니다:`, expiredItems);

    // 1. 보관대장(Archive)에 등록
    for (const exp of expiredItems) {
      await saveToCommonScheduleArchive(exp, "선택 날짜/시간 경과 자동 삭제 및 대장 이관");
      
      // 2. Firestore 활성 컬렉션에서 삭제
      try {
        const docRef = doc(db, COLLECTION_NAME, exp.id);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn("Firestore cleanup delete error:", e);
      }
    }

    // 3. 로컬 스토리지 활성 목록 갱신
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeItems));
    } catch (e) {
      console.error("LocalStorage update error in cleanupExpiredCommonSchedules:", e);
    }
  }

  return activeItems;
};

/**
 * 댓글(의견) 등록
 */
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

/**
 * 관리자 수동 삭제 시에도 보관 대장에 자동 등록 후 삭제
 */
export const deleteCommonSchedule = async (scheduleId, reason = "관리자 수동 삭제") => {
  const current = getLocalCommonSchedules();
  const target = current.find((s) => s.id === scheduleId);

  // 1. 대장에 등록
  if (target) {
    await saveToCommonScheduleArchive(target, reason);
  }

  // 2. 활성 목록에서 제거
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
      async (snapshot) => {
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
          
          // 실시간으로 경과된 일정 자동 정리 및 대장 이관
          const cleanedItems = await cleanupExpiredCommonSchedules();
          if (callback) callback(cleanedItems);
        } else {
          const localItems = getLocalCommonSchedules();
          const cleaned = await cleanupExpiredCommonSchedules();
          if (callback) callback(cleaned);
        }
      },
      async (error) => {
        console.warn("Firestore common schedules sync warning (using local):", error);
        const localItems = getLocalCommonSchedules();
        const cleaned = await cleanupExpiredCommonSchedules();
        if (callback) callback(cleaned);
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

export const getUncompletedCommonSchedules = () => {
  const all = getLocalCommonSchedules();
  return all.filter((s) => !s.isCompleted && !isScheduleExpired(s));
};

export const getTodayCommonSchedules = (targetDate = null) => {
  const dateStr = targetDate || getKSTDateString();
  const all = getLocalCommonSchedules();
  return all.filter((s) => {
    if (s.isCompleted || isScheduleExpired(s)) return false;
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
  const validScheds = (scheds || []).filter((s) => !isScheduleExpired(s));
  if (validScheds.length === 0) {
    return "• 등록된 공통 일정이 없습니다.";
  }
  const sorted = [...validScheds].sort((a, b) => {
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
