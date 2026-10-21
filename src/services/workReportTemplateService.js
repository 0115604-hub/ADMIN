// Work Report Template Service (오륙 / 한울 작업일보 5대 대분류 템플릿 엔진)
// 5 Major Categories: 압출일보, 소재준비일보, 조인트일보, 후가공일보, 검사일보
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query
} from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeForFirestore } from "../utils/firestoreUtils";

export const TEMPLATE_STORAGE_KEY = "oruk_work_report_templates_v2";
const COLLECTION_NAME = "work_report_templates";

// 5대 대분류 정의
export const REPORT_MAJOR_CATEGORIES = [
  {
    id: "EXTRUSION",
    name: "압출일보",
    icon: "🏭",
    desc: "1~4호기 압출 라인 • 형재 압출 • 권취/인취 • 압출 온도 및 중량 실측",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800"
  },
  {
    id: "MATERIAL_PREP",
    name: "소재준비일보",
    icon: "✂️",
    desc: "정치절단 (A/B/C 단면) • 단컷팅 (LH/RH) • 칼날수명(5만개) 관리",
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800"
  },
  {
    id: "JOINT",
    name: "조인트일보",
    icon: "⚙️",
    desc: "FRT, FIXED LH/RH, RR (4종) • 사출온도(4개 존) • 프레스 가류조건",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800"
  },
  {
    id: "POST_PROCESSING",
    name: "후가공일보",
    icon: "🤖",
    desc: "본드로봇 도포 • 클립/브라켓 조립 • 부자재 LOT • 팁 교체 관리",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800"
  },
  {
    id: "INSPECTION",
    name: "검사일보",
    icon: "🔍",
    desc: "길이검사 (패드 5T) • 직각검사 • 최종검사 4열 매트릭스 • 3대 불량 집계",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
  }
];

export const TEMPLATE_RESET_VERSION_KEY = "oruk_work_report_templates_reset_v3";
export const DEFAULT_WORK_REPORT_TEMPLATES = [];

// In-memory cache so localStorage quota limits never lose templates
let memoryTemplatesCache = null;
let memoryCustomBlocksCache = null;

const normalizeTemplateDoc = (tpl) => {
  if (!tpl) return tpl;
  const copy = { ...tpl, isDatabaseBacked: true };
  if (typeof copy.legoConfigJson === "string" && copy.legoConfigJson) {
    try {
      copy.legoConfig = JSON.parse(copy.legoConfigJson);
    } catch {}
  }
  if (copy.legoConfig?.customBlockTables) {
    const fixedTables = {};
    Object.entries(copy.legoConfig.customBlockTables).forEach(([k, val]) => {
      const rows = Array.isArray(val?.rows)
        ? val.rows.map((r) => (Array.isArray(r) ? r : Array.isArray(r?.cells) ? r.cells : []))
        : [];
      fixedTables[k] = {
        columns: Array.isArray(val?.columns) ? val.columns : [],
        rows
      };
    });
    copy.legoConfig = {
      ...copy.legoConfig,
      customBlockTables: fixedTables
    };
  }
  return copy;
};

// 로컬 스토리지 데이터 가져오기
export const getLocalWorkReportTemplates = () => {
  try {
    if (localStorage.getItem(TEMPLATE_RESET_VERSION_KEY) !== "true") {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(TEMPLATE_RESET_VERSION_KEY, "true");
    }

    if (Array.isArray(memoryTemplatesCache)) {
      return memoryTemplatesCache.map(normalizeTemplateDoc);
    }

    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    let parsed = [];
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) parsed = p;
    }

    memoryTemplatesCache = parsed.map(normalizeTemplateDoc);
    return memoryTemplatesCache;
  } catch (e) {
    console.warn("getLocalWorkReportTemplates fallback:", e);
    return Array.isArray(memoryTemplatesCache) ? memoryTemplatesCache : [];
  }
};

// 로컬 스토리지 저장 (QuotaExceededError 방어 + 즉시 이벤트 브로드캐스트 보장)
export const saveLocalWorkReportTemplates = (templates) => {
  const normalized = (Array.isArray(templates) ? templates : []).map(normalizeTemplateDoc);
  memoryTemplatesCache = normalized;

  try {
    localStorage.setItem(TEMPLATE_RESET_VERSION_KEY, "true");
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(normalized));
  } catch (e) {
    console.warn("saveLocalWorkReportTemplates quota warning, stripping heavy base64:", e);
    try {
      // Free up localStorage space by stripping old base64 images from custom blocks
      const cbRaw = localStorage.getItem(CUSTOM_LEGO_BLOCKS_STORAGE_KEY);
      if (cbRaw) {
        const cbParsed = JSON.parse(cbRaw);
        if (Array.isArray(cbParsed)) {
          const slimCb = cbParsed.map(({ imageDataUrl, ...rest }) => rest);
          localStorage.setItem(CUSTOM_LEGO_BLOCKS_STORAGE_KEY, JSON.stringify(slimCb));
        }
      }
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(normalized));
    } catch (retryErr) {
      console.warn("saveLocalWorkReportTemplates retry warning (kept in memory):", retryErr);
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("work-report-templates-updated", { detail: normalized }));
  }
};

// Firestore 실시간 구독 (로컬 저장본과 클라우드 문서 병합 유지)
export const subscribeWorkReportTemplates = (callback) => {
  // 즉시 현재 로컬/메모리 목록 먼저 전달
  callback(getLocalWorkReportTemplates());

  try {
    const q = query(collection(db, COLLECTION_NAME));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const snapshotList = snapshot.docs.map((docSnap) =>
          normalizeTemplateDoc({
            id: docSnap.id,
            ...docSnap.data(),
            isDatabaseBacked: true
          })
        );

        const localList = getLocalWorkReportTemplates();
        const tplMap = new Map();
        localList.forEach((tpl) => {
          if (tpl && tpl.id) tplMap.set(tpl.id, normalizeTemplateDoc(tpl));
        });
        snapshotList.forEach((tpl) => {
          if (tpl && tpl.id) tplMap.set(tpl.id, normalizeTemplateDoc(tpl));
        });

        const merged = Array.from(tplMap.values()).sort(
          (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
        );
        saveLocalWorkReportTemplates(merged);
        callback(merged);
      },
      (error) => {
        console.warn("subscribeWorkReportTemplates offline fallback:", error);
        callback(getLocalWorkReportTemplates());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn("subscribeWorkReportTemplates error:", e);
    callback(getLocalWorkReportTemplates());
    return () => {};
  }
};

// 전체 템플릿 일괄 삭제 (비우기)
export const deleteAllWorkReportTemplates = async () => {
  memoryTemplatesCache = [];
  saveLocalWorkReportTemplates([]);
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, COLLECTION_NAME, d.id))));
  } catch (e) {
    console.warn("Firestore deleteAllWorkReportTemplates warning:", e);
  }
  return [];
};

// 템플릿 저장 (신규 또는 수정)
export const saveWorkReportTemplate = async (template) => {
  const tplId = template.id || `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const now = new Date().toISOString();
  const payload = normalizeTemplateDoc({
    ...template,
    id: tplId,
    isDatabaseBacked: true,
    legoConfigJson: template.legoConfig ? JSON.stringify(template.legoConfig) : undefined,
    updatedAt: now
  });

  // 1. 로컬 & 메모리 즉시 저장 및 이벤트 발송 (UI 0ms 즉시 반영)
  const currentList = getLocalWorkReportTemplates();
  const existingIdx = currentList.findIndex(
    (t) =>
      t.id === tplId ||
      (t.isLegoModular &&
        payload.isLegoModular &&
        t.title === payload.title &&
        t.carModel === payload.carModel &&
        t.processName === payload.processName &&
        t.categoryId === payload.categoryId)
  );
  let updatedList;
  if (existingIdx >= 0) {
    const targetId = currentList[existingIdx].id || tplId;
    payload.id = targetId;
    updatedList = currentList.map((t, idx) => (idx === existingIdx ? payload : t));
  } else {
    updatedList = [payload, ...currentList];
  }
  saveLocalWorkReportTemplates(updatedList);

  // 2. Firestore 비동기 저장 (중첩 배열 방어 및 타임아웃 적용)
  try {
    const firestoreData = sanitizeForFirestore(payload);
    await Promise.race([
      setDoc(doc(db, COLLECTION_NAME, payload.id), firestoreData),
      new Promise((resolve) => setTimeout(resolve, 2500))
    ]);
  } catch (e) {
    console.warn("Firestore save template offline:", e);
  }

  return payload;
};

// 템플릿 삭제
export const deleteWorkReportTemplate = async (templateId) => {
  const currentList = getLocalWorkReportTemplates();
  const updatedList = currentList.filter((t) => t.id !== templateId);
  saveLocalWorkReportTemplates(updatedList);

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, templateId));
  } catch (e) {
    console.warn("Firestore delete template offline:", e);
  }
};

// 템플릿 1초 복제 (Clone)
export const cloneWorkReportTemplate = async (sourceTemplateId, newCarModel = "") => {
  const currentList = getLocalWorkReportTemplates();
  const source = currentList.find((t) => t.id === sourceTemplateId);
  if (!source) throw new Error("원본 템플릿을 찾을 수 없습니다.");

  const clonedId = `tpl_${Date.now()}_clone`;
  const effectiveCar = newCarModel.trim() || `${source.carModel}_복사본`;
  const clonedPayload = {
    ...source,
    id: clonedId,
    carModel: effectiveCar,
    title: `${source.title} (${effectiveCar})`,
    updatedAt: new Date().toISOString()
  };

  return await saveWorkReportTemplate(clonedPayload);
};

// ===========================================================================
// 🧱 [커스텀 레고 블록 저장소 (사진 분석 블록 영구 보관 & 실시간 동기화)]
// ===========================================================================
export const CUSTOM_LEGO_BLOCKS_STORAGE_KEY = "oruk_custom_lego_blocks_v1";
const CUSTOM_BLOCKS_COLLECTION = "lego_custom_blocks";

const normalizeCustomBlock = (b) => {
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
