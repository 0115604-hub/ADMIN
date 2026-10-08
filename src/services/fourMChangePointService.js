import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_NAME = "four_m_change_points";
const LOCAL_STORAGE_KEY = "factory_four_m_change_points_v1";

// Helper: Read local storage
export const getLocalFourMChangePoints = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Local storage read error for 4M change points:", e);
  }
  return [];
};

// Helper: Save local storage
export const saveLocalFourMChangePoints = (items) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items || []));
  } catch (e) {
    console.error("Local storage write error for 4M change points:", e);
  }
};

// Real-time Cloud Synchronization (Firestore authoritative stream)
export const subscribeFourMChangePoints = (onUpdate) => {
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

        remoteList.sort((a, b) => {
          if (b.registeredAt !== a.registeredAt) return (b.registeredAt || "").localeCompare(a.registeredAt || "");
          return (b.date || "").localeCompare(a.date || "");
        });

        saveLocalFourMChangePoints(remoteList);
        if (onUpdate) onUpdate(remoteList);
      },
      (error) => {
        console.warn("Firestore four_m_change_points sync warning:", error);
        if (onUpdate) onUpdate(getLocalFourMChangePoints());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error("subscribeFourMChangePoints error:", e);
    if (onUpdate) onUpdate(getLocalFourMChangePoints());
    return () => {};
  }
};

// Register (Copy) a Record into Official 4M Change Point Ledger
export const registerToFourMLedger = async (record, registeredBy = "관리자") => {
  if (!record) return null;

  const now = new Date();
  const nowStr = now.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const originalId = String(record.id || "").trim();
  const rawId = String(record.raw?.id || record.id || "").trim();
  const ledgerId = originalId.startsWith("ledger_") ? originalId : `ledger_${originalId || Date.now()}`;

  // Sanitize record to avoid undefined keys or complex non-serializable objects (such as circular refs in raw)
  const ledgerItem = {
    id: ledgerId,
    originalId: originalId,
    rawId: rawId,
    fourM: record.fourM || "Machine",
    origin: record.origin || "변동점",
    sourceType: record.sourceType || "",
    badgeColor: record.badgeColor || "",
    plant: record.plant || "삼랑진공장",
    line: record.line || "",
    writer: record.writer || "",
    title: record.title || "",
    date: record.date || nowStr.slice(0, 10),
    time: record.time || "",
    content: record.content || "",
    actionResult: record.actionResult || "",
    actionAuthor: record.actionAuthor || "",
    actionAt: record.actionAt || "",
    images: Array.isArray(record.images) ? record.images : [],
    actionImages: Array.isArray(record.actionImages) ? record.actionImages : [],
    replies: Array.isArray(record.replies) ? record.replies : [],
    isResolved: Boolean(record.isResolved),
    severity: record.severity || "NORMAL",
    downtimeMinutes: Number(record.downtimeMinutes) || 0,
    scrapKg: Number(record.scrapKg) || 0,
    registeredAt: nowStr,
    registeredBy: registeredBy || "관리자",
    isOfficialLedger: true
  };

  // Strip any undefined keys
  Object.keys(ledgerItem).forEach((k) => {
    if (ledgerItem[k] === undefined) delete ledgerItem[k];
  });

  const current = getLocalFourMChangePoints();
  const existingIdx = current.findIndex(
    (it) =>
      it.id === ledgerId ||
      it.originalId === originalId ||
      (rawId && (it.rawId === rawId || it.originalId === rawId)) ||
      it.id === originalId
  );
  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = ledgerItem;
  } else {
    updated = [ledgerItem, ...current];
  }

  saveLocalFourMChangePoints(updated);

  try {
    await setDoc(doc(db, COLLECTION_NAME, ledgerId), ledgerItem);
  } catch (e) {
    console.warn("Firestore save four_m_change_point fallback to local:", e);
  }

  return ledgerItem;
};

// Unregister (Delete) from Official 4M Change Point Ledger
export const unregisterFromFourMLedger = async (ledgerOrOriginalId) => {
  const targetId = typeof ledgerOrOriginalId === "object"
    ? String(ledgerOrOriginalId?.id || ledgerOrOriginalId?.originalId || ledgerOrOriginalId?.raw?.id || "").trim()
    : String(ledgerOrOriginalId || "").trim();

  if (!targetId) return getLocalFourMChangePoints();

  const current = getLocalFourMChangePoints();

  // Find all matched records
  const matched = current.filter(
    (it) =>
      it.id === targetId ||
      it.originalId === targetId ||
      it.rawId === targetId ||
      it.id === `ledger_${targetId}` ||
      `ledger_${it.originalId}` === targetId ||
      (it.originalId && targetId.includes(it.originalId)) ||
      (it.id && targetId.includes(it.id))
  );

  const matchedDocIds = new Set(matched.map((m) => m.id));
  if (targetId.startsWith("ledger_")) {
    matchedDocIds.add(targetId);
  } else {
    matchedDocIds.add(`ledger_${targetId}`);
  }
  matchedDocIds.add(targetId);

  const updated = current.filter(
    (it) =>
      !matchedDocIds.has(it.id) &&
      it.originalId !== targetId &&
      it.rawId !== targetId &&
      !matched.some((m) => m.id === it.id)
  );

  saveLocalFourMChangePoints(updated);

  // Delete matching documents from Firestore
  for (const docId of matchedDocIds) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, docId));
    } catch (e) {
      console.warn("Firestore delete four_m_change_point error:", docId, e);
    }
  }

  return updated;
};

// Purge all MAN / Absence change points from Official Ledger (Firestore & LocalStorage)
export const purgeManFourMChangePoints = async () => {
  const current = getLocalFourMChangePoints();
  const remaining = current.filter(
    (it) =>
      it.fourM?.toUpperCase() !== "MAN" &&
      !String(it.sourceType || "").includes("MAN_ABSENCE") &&
      !String(it.id || "").includes("man_") &&
      !String(it.originalId || "").includes("man_")
  );
  saveLocalFourMChangePoints(remaining);

  if (db) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      for (const d of snap.docs) {
        const data = d.data();
        const isMan =
          data.fourM?.toUpperCase() === "MAN" ||
          String(data.sourceType || "").includes("MAN_ABSENCE") ||
          String(d.id).includes("man_") ||
          String(data.originalId || "").includes("man_") ||
          String(data.id || "").includes("man_");
        if (isMan) {
          await deleteDoc(doc(db, COLLECTION_NAME, d.id));
        }
      }
    } catch (e) {
      console.warn("Firestore purgeManFourMChangePoints error:", e);
    }
  }

  return remaining;
};

// Purge ALL change points from Official Ledger
export const purgeAllFourMChangePoints = async () => {
  saveLocalFourMChangePoints([]);
  if (db) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, COLLECTION_NAME, d.id));
      }
    } catch (e) {
      console.warn("Firestore purgeAllFourMChangePoints error:", e);
    }
  }
  return [];
};
