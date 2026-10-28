import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query
} from "firebase/firestore";
import { db } from "../../firebase";
import { sanitizeForFirestore } from "../../utils/firestoreUtils";

export const CUSTOM_LEGO_BLOCKS_STORAGE_KEY = "oruk_custom_lego_blocks_v1";
const CUSTOM_BLOCKS_COLLECTION = "lego_custom_blocks";

let memoryCustomBlocksCache = null;

export const normalizeCustomBlock = (b) => {
  if (!b) return b;
  const copy = { ...b };
  if (typeof copy.rowsJson === "string" && copy.rowsJson) {
    try {
      copy.rows = JSON.parse(copy.rowsJson);
    } catch {}
  } else if (Array.isArray(copy.rows)) {
    copy.rows = copy.rows.map((r) => (Array.isArray(r) ? r : Array.isArray(r?.cells) ? r.cells : []));
  }
  return copy;
};

export const getLocalCustomLegoBlocks = () => {
  try {
    if (Array.isArray(memoryCustomBlocksCache)) {
      return memoryCustomBlocksCache.map(normalizeCustomBlock);
    }
    const raw = localStorage.getItem(CUSTOM_LEGO_BLOCKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    memoryCustomBlocksCache = (Array.isArray(parsed) ? parsed : []).map(normalizeCustomBlock);
    return memoryCustomBlocksCache;
  } catch (e) {
    console.warn("Failed to load local custom lego blocks:", e);
    return Array.isArray(memoryCustomBlocksCache) ? memoryCustomBlocksCache : [];
  }
};

export const saveLocalCustomLegoBlocks = (list) => {
  const normalized = (Array.isArray(list) ? list : []).map(normalizeCustomBlock);
  memoryCustomBlocksCache = normalized;
  try {
    // Strip heavy imageDataUrl before saving to localStorage so quota is never exceeded
    const slimList = normalized.map(({ imageDataUrl, ...rest }) => rest);
    localStorage.setItem(CUSTOM_LEGO_BLOCKS_STORAGE_KEY, JSON.stringify(slimList));
  } catch (e) {
    console.warn("Failed to save local custom lego blocks:", e);
  }
};

export const subscribeCustomLegoBlocks = (callback) => {
  callback(getLocalCustomLegoBlocks());
  try {
    const q = query(collection(db, CUSTOM_BLOCKS_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const snapshotList = snapshot.docs.map((d) =>
          normalizeCustomBlock({
            id: d.id,
            ...d.data()
          })
        );
        const localList = getLocalCustomLegoBlocks();
        const blockMap = new Map();
        localList.forEach((b) => blockMap.set(b.id || b.key, normalizeCustomBlock(b)));
        snapshotList.forEach((b) => blockMap.set(b.id || b.key, normalizeCustomBlock(b)));
        const merged = Array.from(blockMap.values()).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        saveLocalCustomLegoBlocks(merged);
        callback(merged);
      },
      (err) => {
        console.warn("subscribeCustomLegoBlocks offline fallback:", err);
        callback(getLocalCustomLegoBlocks());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn("subscribeCustomLegoBlocks error:", e);
    callback(getLocalCustomLegoBlocks());
    return () => {};
  }
};

export const saveCustomLegoBlock = async (blockData) => {
  const now = new Date().toISOString();
  const blockId = blockData.id || blockData.key || `custom_block_${Date.now()}`;
  const { imageDataUrl, ...cleanBlockData } = blockData || {};
  const payload = normalizeCustomBlock({
    ...cleanBlockData,
    id: blockId,
    key: blockData.key || blockId,
    rowsJson: JSON.stringify(blockData.rows || []),
    isCustomBlock: true,
    createdAt: blockData.createdAt || now,
    updatedAt: now
  });

  const currentList = getLocalCustomLegoBlocks();
  const existingIdx = currentList.findIndex((b) => (b.id || b.key) === blockId);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = currentList.map((b) => ((b.id || b.key) === blockId ? payload : b));
  } else {
    updatedList = [payload, ...currentList];
  }
  saveLocalCustomLegoBlocks(updatedList);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("custom-lego-blocks-updated", { detail: updatedList }));
  }

  try {
    await Promise.race([
      setDoc(doc(db, CUSTOM_BLOCKS_COLLECTION, blockId), sanitizeForFirestore(payload)),
      new Promise((resolve) => setTimeout(resolve, 2500))
    ]);
  } catch (e) {
    console.warn("Firestore save custom lego block offline:", e);
  }

  return payload;
};

export const deleteCustomLegoBlock = async (blockId) => {
  const currentList = getLocalCustomLegoBlocks();
  const updatedList = currentList.filter((b) => (b.id || b.key) !== blockId);
  saveLocalCustomLegoBlocks(updatedList);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("custom-lego-blocks-updated", { detail: updatedList }));
  }

  try {
    await deleteDoc(doc(db, CUSTOM_BLOCKS_COLLECTION, blockId));
  } catch (e) {
    console.warn("Firestore delete custom lego block offline:", e);
  }
};
