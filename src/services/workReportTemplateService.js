// Work Report Template Service (오륙 / 한울 작업일보 5대 대분류 템플릿 엔진)
// 5 Major Categories: 압출일보, 소재준비일보, 조인트일보, 후가공일보, 검사일보
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
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

// 🌟 5대 공정 양식보관함 클린 리셋 버전 키 (과거 기본 템플릿 및 잔여 양식 일괄 정리)
export const TEMPLATE_RESET_VERSION_KEY = "oruk_work_report_templates_reset_v3";

// 초기 표준 템플릿 마스터 데이터 (사용자 요청으로 기존 기본 양식 전면 삭제하여 빈 배열로 초기화)
export const DEFAULT_WORK_REPORT_TEMPLATES = [];

// 로컬 스토리지 데이터 가져오기 (삭제 시 부활하지 않도록 순수 저장된 템플릿만 반환)
export const getLocalWorkReportTemplates = () => {
  try {
    // 최초 1회 기존 로컬 캐시 양식 일괄 초기화 보장
    if (localStorage.getItem(TEMPLATE_RESET_VERSION_KEY) !== "true") {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(TEMPLATE_RESET_VERSION_KEY, "true");
      return [];
    }

    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((tpl) => ({
      ...tpl,
      isDatabaseBacked: true
    }));
  } catch (e) {
    console.warn("getLocalWorkReportTemplates fallback:", e);
    return [];
  }
};

// 로컬 스토리지 저장
export const saveLocalWorkReportTemplates = (templates) => {
  try {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
    localStorage.setItem(TEMPLATE_RESET_VERSION_KEY, "true");
  } catch (e) {
    console.error("saveLocalWorkReportTemplates error:", e);
  }
};

// Firestore 실시간 구독 (기존 잔여 템플릿 1회 일괄 삭제 및 실시간 삭제 즉시 반영)
export const subscribeWorkReportTemplates = (callback) => {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        // 🌟 최초 리셋 미완료 시 Firestore에 남아있는 기존 양식들도 모두 영구 삭제
        if (localStorage.getItem("oruk_work_report_templates_firestore_purged_v3") !== "true") {
          localStorage.setItem("oruk_work_report_templates_firestore_purged_v3", "true");
          saveLocalWorkReportTemplates([]);
          callback([]);
          if (!snapshot.empty) {
            try {
              await Promise.all(
                snapshot.docs.map((docSnap) => deleteDoc(doc(db, COLLECTION_NAME, docSnap.id)))
              );
            } catch (purgeErr) {
              console.warn("Firestore initial purge warning:", purgeErr);
            }
          }
          return;
        }

        const snapshotList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          isDatabaseBacked: true
        }));

        saveLocalWorkReportTemplates(snapshotList);
        callback(snapshotList);
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
  const payload = {
    ...template,
    id: tplId,
    isDatabaseBacked: true,
    updatedAt: now
  };

  // 1. 로컬 즉시 저장
  const currentList = getLocalWorkReportTemplates();
  const existingIdx = currentList.findIndex((t) => t.id === tplId);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = currentList.map((t) => (t.id === tplId ? payload : t));
  } else {
    updatedList = [payload, ...currentList];
  }
  saveLocalWorkReportTemplates(updatedList);

  // 2. Firestore 비동기 저장
  try {
    await setDoc(doc(db, COLLECTION_NAME, tplId), sanitizeForFirestore(payload));
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

export const getLocalCustomLegoBlocks = () => {
  try {
    const raw = localStorage.getItem(CUSTOM_LEGO_BLOCKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to load local custom lego blocks:", e);
    return [];
  }
};

export const saveLocalCustomLegoBlocks = (list) => {
  try {
    localStorage.setItem(CUSTOM_LEGO_BLOCKS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Failed to save local custom lego blocks:", e);
  }
};

export const subscribeCustomLegoBlocks = (callback) => {
  try {
    const q = query(collection(db, CUSTOM_BLOCKS_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const snapshotList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));
        const localList = getLocalCustomLegoBlocks();
        const blockMap = new Map();
        localList.forEach((b) => blockMap.set(b.id || b.key, b));
        snapshotList.forEach((b) => blockMap.set(b.id || b.key, b));
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
  const payload = {
    ...blockData,
    id: blockId,
    key: blockData.key || blockId,
    isCustomBlock: true,
    createdAt: blockData.createdAt || now,
    updatedAt: now
  };

  const currentList = getLocalCustomLegoBlocks();
  const existingIdx = currentList.findIndex((b) => (b.id || b.key) === blockId);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = currentList.map((b) => ((b.id || b.key) === blockId ? payload : b));
  } else {
    updatedList = [payload, ...currentList];
  }
  saveLocalCustomLegoBlocks(updatedList);

  try {
    await setDoc(doc(db, CUSTOM_BLOCKS_COLLECTION, blockId), sanitizeForFirestore(payload));
  } catch (e) {
    console.warn("Firestore save custom lego block offline:", e);
  }

  window.dispatchEvent(new CustomEvent("custom-lego-blocks-updated", { detail: updatedList }));
  return payload;
};

export const deleteCustomLegoBlock = async (blockId) => {
  const currentList = getLocalCustomLegoBlocks();
  const updatedList = currentList.filter((b) => (b.id || b.key) !== blockId);
  saveLocalCustomLegoBlocks(updatedList);

  try {
    await deleteDoc(doc(db, CUSTOM_BLOCKS_COLLECTION, blockId));
  } catch (e) {
    console.warn("Firestore delete custom lego block offline:", e);
  }

  window.dispatchEvent(new CustomEvent("custom-lego-blocks-updated", { detail: updatedList }));
};

