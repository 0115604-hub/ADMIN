import {
  collection,
  doc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase.js";

import {
  COLLECTION_NAME,
  STORAGE_KEY,
  INITIAL_QUALITY_RECORDS,
  sanitizeQualityRecord
} from "./quality/qualityConstants.js";

// Re-export constants and utilities
export * from "./quality/qualityConstants.js";

// Re-export aggregation utilities
export * from "./quality/qualityAggregation.js";

// Re-export Excel parsing utilities
export * from "./quality/qualityExcelParser.js";

// Re-export quality target settings services
export * from "./quality/qualityTargetsService.js";

/**
 * Read local storage records
 */
export const getLocalQualityRecords = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_QUALITY_RECORDS || [];
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge with initial canonical records to guarantee September records are never lost
      const map = new Map();
      (INITIAL_QUALITY_RECORDS || []).forEach((r) => { if (r && r.id) map.set(r.id, r); });
      parsed.forEach((r) => { if (r && r.id) map.set(r.id, { ...(map.get(r.id) || {}), ...r }); });

      return Array.from(map.values())
        .map((r) => sanitizeQualityRecord(r))
        .filter((r) => r && r.id)
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    }
    return INITIAL_QUALITY_RECORDS || [];
  } catch (e) {
    console.error("getLocalQualityRecords error:", e);
    return INITIAL_QUALITY_RECORDS || [];
  }
};

/**
 * Save records locally and dispatch custom event
 */
export const saveLocalQualityRecords = (records) => {
  try {
    const map = new Map();
    (records || []).forEach((r) => {
      const sanitized = sanitizeQualityRecord(r);
      if (sanitized && sanitized.id) {
        map.set(sanitized.id, sanitized);
      }
    });
    const uniqueArray = Array.from(map.values()).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueArray));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("quality-records-updated", { detail: uniqueArray }));
    }
    return uniqueArray;
  } catch (e) {
    console.error("saveLocalQualityRecords error:", e);
    return records || [];
  }
};

/**
 * Real-time Firestore Subscription with LocalStorage Fallback
 */
export const subscribeQualityRecords = (callback) => {
  const localInitial = getLocalQualityRecords();
  if (callback) callback(localInitial);

  try {
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const remoteRecords = [];
        if (!snapshot.empty) {
          snapshot.forEach((d) => {
            remoteRecords.push({ id: d.id, ...d.data() });
          });
        }
        const map = new Map();
        (INITIAL_QUALITY_RECORDS || []).forEach((r) => { if (r && r.id) map.set(r.id, r); });
        remoteRecords.forEach((r) => { if (r && r.id) map.set(r.id, { ...(map.get(r.id) || {}), ...r }); });

        const finalArray = Array.from(map.values())
          .map((r) => sanitizeQualityRecord(r))
          .filter((r) => r && r.id)
          .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        saveLocalQualityRecords(finalArray);
        if (callback) callback(finalArray);
      },
      (error) => {
        console.warn("Quality Firestore subscription warning, using local cache:", error);
        if (callback) callback(getLocalQualityRecords());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn("subscribeQualityRecords error:", e);
    return () => {};
  }
};

/**
 * Save a batch of quality records (Deduplication guarantee & Firestore Chunking)
 */
export const saveQualityRecordsBatch = async (recordsToSave = []) => {
  if (!recordsToSave || recordsToSave.length === 0) return [];

  const localCurrent = getLocalQualityRecords();
  const map = new Map();
  localCurrent.forEach((r) => {
    if (r && r.id) map.set(r.id, r);
  });

  const sanitizedList = recordsToSave.map((r) => sanitizeQualityRecord(r)).filter((r) => r && r.id);
  sanitizedList.forEach((r) => {
    if (r && r.id) map.set(r.id, r);
  });

  const finalMerged = Array.from(map.values()).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  saveLocalQualityRecords(finalMerged);

  try {
    // Chunk Firestore batch writes into max 400 documents per commit
    const chunkSize = 400;
    for (let i = 0; i < sanitizedList.length; i += chunkSize) {
      const chunk = sanitizedList.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((rec) => {
        const docRef = doc(db, COLLECTION_NAME, rec.id);
        batch.set(docRef, rec, { merge: true });
      });
      await batch.commit();
    }
  } catch (e) {
    console.warn("Firestore saveQualityRecordsBatch fallback to local storage:", e);
  }

  return finalMerged;
};

/**
 * Delete a single record
 */
export const deleteQualityRecord = async (recordId) => {
  const localCurrent = getLocalQualityRecords();
  const filtered = localCurrent.filter((r) => r.id !== recordId);
  saveLocalQualityRecords(filtered);

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, recordId));
  } catch (e) {
    console.warn("Firestore deleteQualityRecord fallback to local:", e);
  }
  return filtered;
};

/**
 * Delete all quality records for a specific date
 */
export const deleteQualityRecordsByDate = async (dateStr) => {
  if (!dateStr) return [];
  const localCurrent = getLocalQualityRecords();
  const toDelete = localCurrent.filter((r) => r.date === dateStr);
  const remaining = localCurrent.filter((r) => r.date !== dateStr);
  saveLocalQualityRecords(remaining);

  try {
    const batch = writeBatch(db);
    toDelete.forEach((r) => {
      const docRef = doc(db, COLLECTION_NAME, r.id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (e) {
    console.warn("Firestore deleteQualityRecordsByDate fallback to local:", e);
  }
  return remaining;
};
