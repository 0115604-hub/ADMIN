import {
  collection,
  doc,
  setDoc,
  deleteDoc,
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

  const ledgerId = `ledger_${record.id || Date.now()}`;

  const ledgerItem = {
    ...record,
    id: ledgerId,
    originalId: record.id,
    registeredAt: nowStr,
    registeredBy: registeredBy || "관리자",
    isOfficialLedger: true
  };

  const current = getLocalFourMChangePoints();
  const existingIdx = current.findIndex(
    (it) => it.id === ledgerId || it.originalId === record.id || it.id === record.id
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
  const current = getLocalFourMChangePoints();
  const idStr = String(ledgerOrOriginalId || "").trim();

  // Find target item
  const target = current.find(
    (it) =>
      it.id === idStr ||
      it.originalId === idStr ||
      `ledger_${it.originalId}` === idStr ||
      it.id === `ledger_${idStr}`
  );

  const docIdToDelete = target ? target.id : (idStr.startsWith("ledger_") ? idStr : `ledger_${idStr}`);
  const origIdToDelete = target ? target.originalId : idStr;

  const updated = current.filter(
    (it) =>
      it.id !== docIdToDelete &&
      it.id !== idStr &&
      it.originalId !== origIdToDelete &&
      it.originalId !== idStr
  );
  saveLocalFourMChangePoints(updated);

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, docIdToDelete));
    if (docIdToDelete !== idStr) {
      await deleteDoc(doc(db, COLLECTION_NAME, idStr)).catch(() => {});
    }
  } catch (e) {
    console.warn("Firestore delete four_m_change_point error:", e);
  }

  return updated;
};
