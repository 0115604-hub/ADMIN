import { doc, setDoc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "../../firebase";

export const TELEGRAM_CONFIG_KEY = "oryuk_telegram_config_v4";
export const CONFIG_DOC_PATH = ["system_config", "telegram"];
export const BRIEFING_DOC_PATH = ["system_config", "daily_briefing"];
export const TEMPLATES_DOC_PATH = ["system_config", "telegram_templates"];
export const TELEGRAM_TEMPLATES_KEY = "oryuk_telegram_templates_v1";

/**
 * In-Memory Message Deduplication Cache
 * 조건 충족 시 단 1회 발송 원칙 (중복 발송 완전 방지)
 */
const sentMessageCache = new Map();

export const isDuplicateMessage = (fingerprint, ttlMs = 60000) => {
  if (!fingerprint) return false;
  const now = Date.now();
  // 오래된 캐시 정리
  for (const [key, timestamp] of sentMessageCache.entries()) {
    if (now - timestamp > ttlMs) {
      sentMessageCache.delete(key);
    }
  }
  if (sentMessageCache.has(fingerprint)) {
    console.log(`[Telegram 1회 발송 원칙] 중복 발송 차단: ${fingerprint}`);
    return true;
  }
  sentMessageCache.set(fingerprint, now);
  return false;
};

export const normalizeOryukChatId = (id) => {
  const s = String(id || "").trim();
  if (!s || s === "-4186792536") return "-1004367600406";
  return s;
};

export const DEFAULT_TELEGRAM_CONFIG = {
  enabled: true,
  botToken: "8544872588:AAFbGy0D-0kplFp-Vor-CIxg0v1pggPFNjE",
  chatId: "-1004367600406", // '오륙 통합방' 단톡방
  pnlChatId: "-1003939516875", // '경영총괄' 단톡방
  ceoChatId: "290615483", // 권태형 대표님 1:1 개인톡
  sendQualityAlerts: true,
  sendActionReports: true,
  sendApprovals: false, // 단톡방 알림 취소 (정책)
  sendDailyLeaveBriefing: true, // 07:30 일일 모닝브리핑
  sendDailyPnLBriefing: true, // 07:30 매출 & 일정공유 브리핑
  sendDailyClosingBriefing: true // 17:30 일일마감브리핑 (월~토)
};

let cachedConfig = { ...DEFAULT_TELEGRAM_CONFIG };

export const getLocalTelegramConfig = () => {
  try {
    const saved = typeof window !== "undefined" ? localStorage.getItem(TELEGRAM_CONFIG_KEY) : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      cachedConfig = {
        ...DEFAULT_TELEGRAM_CONFIG,
        ...parsed,
        chatId: normalizeOryukChatId(parsed.chatId),
        pnlChatId: parsed.pnlChatId || "-1003939516875",
        ceoChatId: parsed.ceoChatId || "290615483"
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(TELEGRAM_CONFIG_KEY, JSON.stringify(cachedConfig));
      }
      return cachedConfig;
    }
  } catch (e) {
    console.error("Telegram config read error:", e);
  }
  return cachedConfig;
};

export const saveTelegramConfig = async (config) => {
  cachedConfig = {
    ...DEFAULT_TELEGRAM_CONFIG,
    ...config,
    chatId: normalizeOryukChatId(config.chatId),
    pnlChatId: config.pnlChatId || "-1003939516875",
    ceoChatId: config.ceoChatId || "290615483"
  };

  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(TELEGRAM_CONFIG_KEY, JSON.stringify(cachedConfig));
    }
  } catch (e) {
    console.error("Local storage save error for telegram:", e);
  }

  try {
    if (db) {
      await setDoc(doc(db, CONFIG_DOC_PATH[0], CONFIG_DOC_PATH[1]), cachedConfig, { merge: true });
    }
  } catch (e) {
    console.warn("Firestore save telegram config fallback to local:", e);
  }
  return cachedConfig;
};

export const setTelegramEnabled = async (enabled) => {
  const current = getLocalTelegramConfig();
  const updated = {
    ...current,
    enabled: Boolean(enabled)
  };
  return await saveTelegramConfig(updated);
};

export const toggleTelegramEnabled = async () => {
  const current = getLocalTelegramConfig();
  const updated = {
    ...current,
    enabled: !current.enabled
  };
  return await saveTelegramConfig(updated);
};

export const subscribeTelegramConfig = (onUpdate) => {
  try {
    if (!db) {
      const localCfg = getLocalTelegramConfig();
      if (onUpdate) onUpdate(localCfg);
      return () => {};
    }
    const docRef = doc(db, CONFIG_DOC_PATH[0], CONFIG_DOC_PATH[1]);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const merged = {
            ...DEFAULT_TELEGRAM_CONFIG,
            ...data,
            chatId: normalizeOryukChatId(data.chatId),
            pnlChatId: data.pnlChatId || "-1003939516875",
            ceoChatId: data.ceoChatId || "290615483"
          };
          cachedConfig = merged;
          if (typeof window !== "undefined") {
            localStorage.setItem(TELEGRAM_CONFIG_KEY, JSON.stringify(merged));
          }
          if (onUpdate) onUpdate(merged);
        } else {
          const localCfg = getLocalTelegramConfig();
          if (onUpdate) onUpdate(localCfg);
        }
      },
      (err) => {
        console.warn("Telegram config Firestore sync warning:", err);
        const localCfg = getLocalTelegramConfig();
        if (onUpdate) onUpdate(localCfg);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error("subscribeTelegramConfig error:", e);
    const localCfg = getLocalTelegramConfig();
    if (onUpdate) onUpdate(localCfg);
    return () => {};
  }
};

/**
 * Custom Message Template Persistence
 */
export const sanitizeTelegramTemplateText = (text) => {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/\[오륙\s*(경영정보공유|경영정보|경영진\/임원|경영진)\]/g, "[오륙]")
    .replace(/일일\s*아침\s*손익결산\s*브리핑/g, "매출 & 일정공유")
    .replace(/일일아침손익결산/g, "매출 & 일정공유")
    .replace(/손익결산\s*브리핑/g, "매출 & 일정공유")
    .replace(/\[3\]\s*태형이랑\s*&\s*미영이랑/g, "[3] 사내 공통일정")
    .replace(/태형이랑\s*&\s*미영이랑/g, "사내 공통일정")
    .replace(/경영정보공유/g, "")
    .replace(/경영정보/g, "")
    .replace(/방상국\s*차장/g, "권태형 대표이사")
    .replace(/방상국\s*선임/g, "설유철 책임")
    .replace(/방상국\s*대표이사/g, "권태형 대표이사")
    .replace(/방상국/g, "권태형");
};

export const sanitizeTelegramMessageText = (text) => {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/방상국\s*차장/g, "권태형 대표이사")
    .replace(/방상국\s*선임/g, "설유철 책임")
    .replace(/방상국\s*대표이사/g, "권태형 대표이사")
    .replace(/방상국/g, "권태형");
};

export const sanitizeTelegramTemplates = (data) => {
  if (!data || typeof data !== "object") return {};
  const cleaned = {};
  for (const [k, v] of Object.entries(data)) {
    if (v && v.text) {
      cleaned[k] = {
        ...v,
        text: sanitizeTelegramTemplateText(v.text)
      };
    } else {
      cleaned[k] = v;
    }
  }
  return cleaned;
};

export const getLocalTelegramTemplates = () => {
  try {
    const saved = typeof window !== "undefined" ? localStorage.getItem(TELEGRAM_TEMPLATES_KEY) : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      return sanitizeTelegramTemplates(parsed);
    }
  } catch (e) {
    console.error("Failed to read telegram templates from localStorage:", e);
  }
  return {};
};

export const saveTelegramCustomTemplate = async (templateKey, templateText) => {
  try {
    const current = getLocalTelegramTemplates();
    const sanitizedText = sanitizeTelegramTemplateText(templateText);
    const updated = {
      ...current,
      [templateKey]: {
        text: sanitizedText,
        updatedAt: new Date().toISOString()
      }
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(TELEGRAM_TEMPLATES_KEY, JSON.stringify(updated));
    }
    if (db) {
      await setDoc(doc(db, TEMPLATES_DOC_PATH[0], TEMPLATES_DOC_PATH[1]), updated, { merge: true });
    }
    return { success: true, templates: updated };
  } catch (e) {
    console.warn("Failed to save telegram template to Firestore, saved to local only:", e);
    return { success: true, localOnly: true };
  }
};

export const deleteTelegramCustomTemplate = async (templateKey) => {
  try {
    const current = getLocalTelegramTemplates();
    const updated = { ...current };
    delete updated[templateKey];
    if (typeof window !== "undefined") {
      localStorage.setItem(TELEGRAM_TEMPLATES_KEY, JSON.stringify(updated));
    }
    if (db) {
      await setDoc(doc(db, TEMPLATES_DOC_PATH[0], TEMPLATES_DOC_PATH[1]), updated);
    }
    return { success: true, templates: updated };
  } catch (e) {
    console.warn("Failed to delete telegram template from Firestore, deleted local only:", e);
    return { success: true, localOnly: true };
  }
};

export const subscribeTelegramCustomTemplates = (onUpdate) => {
  try {
    if (!db) {
      const local = getLocalTelegramTemplates();
      if (onUpdate) onUpdate(local);
      return () => {};
    }
    const docRef = doc(db, TEMPLATES_DOC_PATH[0], TEMPLATES_DOC_PATH[1]);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const cleaned = sanitizeTelegramTemplates(data);
          if (typeof window !== "undefined") {
            localStorage.setItem(TELEGRAM_TEMPLATES_KEY, JSON.stringify(cleaned));
          }
          if (onUpdate) onUpdate(cleaned);
        } else {
          const local = getLocalTelegramTemplates();
          if (onUpdate) onUpdate(local);
        }
      },
      (err) => {
        console.warn("Telegram templates Firestore sync error:", err);
        const local = getLocalTelegramTemplates();
        if (onUpdate) onUpdate(local);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error("subscribeTelegramCustomTemplates error:", e);
    const local = getLocalTelegramTemplates();
    if (onUpdate) onUpdate(local);
    return () => {};
  }
};

/**
 * Unique Client Instance Identifier to track lock ownership
 */
export const getClientInstanceId = () => {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      let id = sessionStorage.getItem("oryuk_client_instance_id");
      if (!id) {
        id = "client_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
        sessionStorage.setItem("oryuk_client_instance_id", id);
      }
      return id;
    }
  } catch (e) {
    // fallback
  }
  return "runner_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
};

export const getBriefingFieldNames = (briefingType) => {
  switch (briefingType) {
    case "general":
      return { dateField: "lastSentDate", lockField: "generalLock", sentAtField: "sentAt" };
    case "closing":
      return { dateField: "lastClosingSentDate", lockField: "closingLock", sentAtField: "closingSentAt" };
    case "schedule_remind":
      return { dateField: "lastScheduleRemindSentDate", lockField: "scheduleRemindLock", sentAtField: "scheduleRemindSentAt" };
    case "pnl":
    default:
      return { dateField: "lastPnLSentDate", lockField: "pnlLock", sentAtField: "pnlSentAt" };
  }
};

/**
 * Acquire Distributed Atomic Lock for Daily Briefing via Firestore Transaction
 */
export const acquireBriefingLock = async (briefingType, todayStr, clientId = null, force = false) => {
  if (force) {
    return { acquired: true, isForced: true };
  }

  const id = clientId || getClientInstanceId();
  const lockDocRef = doc(db, BRIEFING_DOC_PATH[0], BRIEFING_DOC_PATH[1]);
  const { dateField, lockField } = getBriefingFieldNames(briefingType);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(lockDocRef);
      const data = snap.exists() ? snap.data() : {};

      if (data[dateField] === todayStr) {
        return { acquired: false, reason: "ALREADY_SENT_TODAY", lastSentDate: data[dateField] };
      }

      const currentLock = data[lockField];
      if (currentLock && currentLock.date === todayStr && currentLock.status === "SENDING") {
        const lockedAtMs = currentLock.lockedAt ? new Date(currentLock.lockedAt).getTime() : 0;
        const nowMs = Date.now();
        if (nowMs - lockedAtMs < 60000) {
          return { acquired: false, reason: "LOCKED_BY_ANOTHER_INSTANCE", lockedBy: currentLock.lockedBy };
        }
      }

      transaction.set(lockDocRef, {
        [lockField]: {
          status: "SENDING",
          date: todayStr,
          lockedAt: new Date().toISOString(),
          lockedBy: id
        }
      }, { merge: true });

      return { acquired: true, clientId: id };
    });

    return result;
  } catch (err) {
    console.warn(`[Briefing Lock] Transaction error for ${briefingType}:`, err);
    return { acquired: false, reason: "TRANSACTION_ERROR", error: err.message };
  }
};

/**
 * Release or Complete Distributed Atomic Lock
 */
export const completeBriefingLock = async (briefingType, todayStr, isSuccess, errorMsg = null, clientId = null) => {
  const id = clientId || getClientInstanceId();
  const lockDocRef = doc(db, BRIEFING_DOC_PATH[0], BRIEFING_DOC_PATH[1]);
  const { dateField, lockField, sentAtField } = getBriefingFieldNames(briefingType);

  try {
    if (isSuccess) {
      await setDoc(lockDocRef, {
        [dateField]: todayStr,
        [sentAtField]: new Date().toISOString(),
        [lockField]: {
          status: "COMPLETED",
          date: todayStr,
          completedAt: new Date().toISOString(),
          sentBy: id
        }
      }, { merge: true });
    } else {
      await setDoc(lockDocRef, {
        [lockField]: {
          status: "FAILED",
          date: todayStr,
          failedAt: new Date().toISOString(),
          error: errorMsg || "UNKNOWN_ERROR",
          sentBy: id
        }
      }, { merge: true });
    }
  } catch (e) {
    console.warn(`[Briefing Lock] Failed to complete lock for ${briefingType}:`, e);
  }
};
