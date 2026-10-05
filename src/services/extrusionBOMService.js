// ============================================================================
// 삼랑진공장 압출 원재료 BOM 매핑 실시간 관리 서비스 (설유철 책임 전용)
// 품목별 (차종 + 품명) ➔ 연고무 2종, 컴파운드 2종, 심금(선택/미사용), 코팅액(선택/미사용)
// ============================================================================
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeForFirestore } from "../utils/firestoreUtils";
import { ITEM_MATERIAL_BOM_MAP } from "../data/extrusionRawMaterialsData";

const STORAGE_KEY = "factory_extrusion_custom_bom_v1";
const COLLECTION_NAME = "extrusion_bom_mappings";
const MASTER_DOC_ID = "master_bom_map";

// In-memory cache for instantaneous lookup
let cachedCustomBOM = null;

/**
 * Get locally stored custom BOM map
 */
export const getLocalCustomBOMMap = () => {
  if (cachedCustomBOM) return cachedCustomBOM;
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        cachedCustomBOM = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Error loading custom BOM from local storage:", e);
  }
  cachedCustomBOM = {};
  return cachedCustomBOM;
};

/**
 * Save custom BOM map locally and trigger browser broadcast
 */
export const saveLocalCustomBOMMap = (map) => {
  cachedCustomBOM = map || {};
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedCustomBOM));
      window.dispatchEvent(new CustomEvent("extrusion-bom-updated", { detail: cachedCustomBOM }));
    }
  } catch (e) {
    console.warn("Error saving custom BOM to local storage:", e);
  }
  return cachedCustomBOM;
};

/**
 * Save or update single item BOM mapping
 */
export const saveBOMMapping = async (vehicle, itemName, bomData, registeredBy = "설유철 책임") => {
  const v = String(vehicle || "").trim();
  const n = String(itemName || "").trim();
  if (!v) throw new Error("차종 정보가 필요합니다.");

  const key = n ? `${v}:::${n}` : v;
  const currentMap = getLocalCustomBOMMap();

  const record = {
    vehicle: v,
    itemName: n,
    key,
    rubberType: String(bomData.rubberType || "").trim(),
    rubberType2: String(bomData.rubberType2 || "").trim(),
    compoundType: String(bomData.compoundType || "").trim(),
    compoundType2: String(bomData.compoundType2 || "").trim(),
    compoundType3: String(bomData.compoundType3 || "").trim(),
    compoundType4: String(bomData.compoundType4 || "").trim(),
    insertType: String(bomData.insertType || "").trim(), // 빈 값 또는 "미사용" 가능
    coatingType: String(bomData.coatingType || "").trim(), // 빈 값 또는 "미사용" 가능
    registeredBy: String(registeredBy || "설유철 책임"),
    updatedAt: new Date().toISOString()
  };

  const nextMap = {
    ...currentMap,
    [key]: record
  };

  saveLocalCustomBOMMap(nextMap);

  // Cloud Sync to Firestore
  try {
    await setDoc(doc(db, COLLECTION_NAME, MASTER_DOC_ID), sanitizeForFirestore(nextMap), { merge: true });
    const docKey = encodeURIComponent(key);
    await setDoc(doc(db, COLLECTION_NAME, docKey), sanitizeForFirestore(record), { merge: true });
  } catch (e) {
    console.warn("Firestore BOM save error (cached locally):", e);
  }

  return record;
};

/**
 * Delete a BOM mapping
 */
export const deleteBOMMapping = async (key) => {
  const currentMap = getLocalCustomBOMMap();
  const nextMap = { ...currentMap };
  delete nextMap[key];

  saveLocalCustomBOMMap(nextMap);

  try {
    await setDoc(doc(db, COLLECTION_NAME, MASTER_DOC_ID), sanitizeForFirestore(nextMap));
    const docKey = encodeURIComponent(key);
    await deleteDoc(doc(db, COLLECTION_NAME, docKey));
  } catch (e) {
    console.warn("Firestore BOM delete error:", e);
  }
  return true;
};

/**
 * Real-time subscription to Firestore BOM master map
 */
export const subscribeToCustomBOM = (onDataCallback) => {
  onDataCallback(getLocalCustomBOMMap());

  try {
    const docRef = doc(db, COLLECTION_NAME, MASTER_DOC_ID);
    const unsub = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const remote = docSnap.data();
          if (remote && typeof remote === "object") {
            saveLocalCustomBOMMap(remote);
            onDataCallback(remote);
          }
        } else {
          const seedMap = { ...ITEM_MATERIAL_BOM_MAP };
          if (Object.keys(seedMap).length > 0) {
            setDoc(docRef, sanitizeForFirestore(seedMap), { merge: true }).catch(() => {});
          }
          saveLocalCustomBOMMap(seedMap);
          onDataCallback(seedMap);
        }
      },
      (err) => {
        console.warn("BOM subscription fallback:", err);
        onDataCallback(getLocalCustomBOMMap());
      }
    );
    return unsub;
  } catch (e) {
    console.warn("Error establishing BOM subscription:", e);
    return () => {};
  }
};
