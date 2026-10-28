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

// Re-export constants & default templates
export {
  REPORT_MAJOR_CATEGORIES,
  BASE_DEFAULT_WORK_REPORT_TEMPLATES,
  DEFAULT_WORK_REPORT_TEMPLATES
} from "./template/defaultWorkReportTemplates";
import { DEFAULT_WORK_REPORT_TEMPLATES } from "./template/defaultWorkReportTemplates";

// Re-export custom lego block services
export {
  CUSTOM_LEGO_BLOCKS_STORAGE_KEY,
  normalizeCustomBlock,
  getLocalCustomLegoBlocks,
  saveLocalCustomLegoBlocks,
  subscribeCustomLegoBlocks,
  saveCustomLegoBlock,
  deleteCustomLegoBlock
} from "./template/customLegoBlockService";

// Re-export template assignment services
export {
  HANUL_TEMPLATE_ASSIGN_KEY,
  normalizeHanulProjectKey,
  buildHanulProcessSlotKey,
  getLocalHanulTemplateAssignments,
  saveLocalHanulTemplateAssignments,
  saveHanulTemplateAssignment,
  subscribeHanulTemplateAssignments,
  getAssignedTemplateForWorker
} from "./template/workReportTemplateAssignmentService";
import {
  getLocalHanulTemplateAssignments,
  saveLocalHanulTemplateAssignments,
  registerTemplateCatalogGetter
} from "./template/workReportTemplateAssignmentService";

export const TEMPLATE_STORAGE_KEY = "oruk_work_report_templates_v2";
export const DELETED_TEMPLATE_STORAGE_KEY = "oruk_deleted_work_report_template_ids_v1";
export const TEMPLATE_RESET_VERSION_KEY = "oruk_work_report_templates_reset_v6_merged";
const COLLECTION_NAME = "work_report_templates";

// 🌟 삭제된 템플릿 ID 블랙리스트 (스냅샷/기본값에 의한 자동 부활 원천 방지)
export const getDeletedTemplateIds = () => {
  try {
    const raw = localStorage.getItem(DELETED_TEMPLATE_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
};

export const saveDeletedTemplateIds = (setOrArray) => {
  try {
    const arr = Array.from(setOrArray || []);
    localStorage.setItem(DELETED_TEMPLATE_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {}
};

// In-memory cache so localStorage quota limits never lose templates
let memoryTemplatesCache = null;

export const normalizeTemplateDoc = (tpl) => {
  if (!tpl) return tpl;
  const copy = { ...tpl, isDatabaseBacked: true };
  if (typeof copy.legoConfigJson === "string" && copy.legoConfigJson) {
    try {
      copy.legoConfig = JSON.parse(copy.legoConfigJson);
    } catch {}
  }
  // 중복 JSON 문자열을 제거하여 로컬스토리지 용량 초과(QuotaExceededError) 방지
  delete copy.legoConfigJson;

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

// 로컬 스토리지 데이터 가져오기 (절대 기존 등록 양식을 파괴/초기화하지 않는 안전 병합)
export const getLocalWorkReportTemplates = () => {
  try {
    const deletedIds = getDeletedTemplateIds();
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    let parsed = [];
    if (raw) {
      try {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) parsed = p;
      } catch (parseErr) {}
    }

    // 1단계: 내장 기본 템플릿(17대 공정 양식)으로 맵 시드 (삭제된 것은 제외)
    const tplMap = new Map();
    DEFAULT_WORK_REPORT_TEMPLATES.forEach((tpl) => {
      if (tpl && tpl.id && !deletedIds.has(tpl.id)) {
        tplMap.set(tpl.id, normalizeTemplateDoc(tpl));
      }
    });

    // 2단계: 로컬스토리지에 저장된 사용자 정의/수정 템플릿 병합 (ID 기준 덮어쓰기 보존, 삭제된 것 제외)
    parsed.forEach((tpl) => {
      if (tpl && tpl.id && !deletedIds.has(tpl.id)) {
        tplMap.set(tpl.id, normalizeTemplateDoc(tpl));
      }
    });

    // 3단계: 메모리 캐시에 남아있는 최신본 병합 (삭제된 것 제외)
    if (Array.isArray(memoryTemplatesCache)) {
      memoryTemplatesCache.forEach((tpl) => {
        if (tpl && tpl.id && !deletedIds.has(tpl.id)) {
          tplMap.set(tpl.id, normalizeTemplateDoc(tpl));
        }
      });
    }

    // 🌟 [핵심] 관리자가 등록/수정한 사용자 정의 양식이 기본양식보다 항상 최우선 정렬 (두번째 접속 시에도 영구 보존)
    const isBuiltInBase = (t) => {
      const id = String(t?.id || "");
      return id.startsWith("tpl_mat_") || id.startsWith("tpl_joint_") || id.startsWith("tpl_post_") || id.startsWith("tpl_insp_");
    };

    const merged = Array.from(tplMap.values()).sort((a, b) => {
      const aCustom = (a?.isDatabaseBacked || a?.isLegoModular || String(a?.id || "").startsWith("tpl_lego_") || !isBuiltInBase(a)) ? 1 : 0;
      const bCustom = (b?.isDatabaseBacked || b?.isLegoModular || String(b?.id || "").startsWith("tpl_lego_") || !isBuiltInBase(b)) ? 1 : 0;
      if (aCustom !== bCustom) return bCustom - aCustom; // 커스텀 양식이 항상 인덱스 0번대 우선
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });
    memoryTemplatesCache = merged;
    return merged;
  } catch (e) {
    console.warn("getLocalWorkReportTemplates fallback:", e);
    const deletedIds = getDeletedTemplateIds();
    return Array.isArray(memoryTemplatesCache)
      ? memoryTemplatesCache.filter((t) => t && !deletedIds.has(t.id))
      : DEFAULT_WORK_REPORT_TEMPLATES.filter((t) => t && !deletedIds.has(t.id)).map(normalizeTemplateDoc);
  }
};

// Connect getter to assignment service
registerTemplateCatalogGetter(getLocalWorkReportTemplates);

// 로컬 스토리지 저장 (QuotaExceededError 방어 + 중복제거 + 즉시 브로드캐스트)
export const saveLocalWorkReportTemplates = (templates) => {
  const deletedIds = getDeletedTemplateIds();
  const normalized = (Array.isArray(templates) ? templates : [])
    .filter((t) => t && t.id && !deletedIds.has(t.id))
    .map(normalizeTemplateDoc);
  memoryTemplatesCache = normalized;

  // 로컬스토리지용 경량화 복사본 (legoConfigJson 제거)
  const forStorage = normalized.map((t) => {
    const copy = { ...t };
    delete copy.legoConfigJson;
    return copy;
  });

  try {
    localStorage.setItem(TEMPLATE_RESET_VERSION_KEY, "true");
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(forStorage));
  } catch (e) {
    console.warn("saveLocalWorkReportTemplates quota warning, saving slim version:", e);
    try {
      // 5MB 용량 한도 초과 시, 커스텀 블록의 무거운 data:image Base64만 스토리지 복사본에서 경량화
      const slimForStorage = forStorage.map((t) => {
        if (!t.legoConfig?.customBlocks) return t;
        const slimBlocks = t.legoConfig.customBlocks.map((b) => {
          const { imgFile, imageDataUrl, ...rest } = b;
          return {
            ...rest,
            imgFile: typeof imgFile === "string" && imgFile.startsWith("data:image") ? "" : imgFile
          };
        });
        return {
          ...t,
          legoConfig: {
            ...t.legoConfig,
            customBlocks: slimBlocks
          }
        };
      });
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(slimForStorage));
    } catch (retryErr) {
      console.warn("saveLocalWorkReportTemplates retry failed (kept safe in memory):", retryErr);
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
        const deletedIds = getDeletedTemplateIds();
        const snapshotList = snapshot.docs
          .filter((docSnap) => !deletedIds.has(docSnap.id))
          .map((docSnap) =>
            normalizeTemplateDoc({
              id: docSnap.id,
              ...docSnap.data(),
              isDatabaseBacked: true
            })
          );

        const localList = getLocalWorkReportTemplates();
        const tplMap = new Map();
        localList.forEach((tpl) => {
          if (tpl && tpl.id && !deletedIds.has(tpl.id)) tplMap.set(tpl.id, normalizeTemplateDoc(tpl));
        });
        snapshotList.forEach((tpl) => {
          if (tpl && tpl.id && !deletedIds.has(tpl.id)) tplMap.set(tpl.id, normalizeTemplateDoc(tpl));
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
  const currentList = getLocalWorkReportTemplates();
  const deletedIds = getDeletedTemplateIds();
  currentList.forEach((t) => {
    if (t && t.id) deletedIds.add(t.id);
  });
  DEFAULT_WORK_REPORT_TEMPLATES.forEach((t) => {
    if (t && t.id) deletedIds.add(t.id);
  });
  saveDeletedTemplateIds(deletedIds);

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
    updatedAt: now
  });

  // 영구 삭제 블랙리스트에 등록되어 있었다면 복구 허용
  const deletedIds = getDeletedTemplateIds();
  if (deletedIds.has(payload.id)) {
    deletedIds.delete(payload.id);
    saveDeletedTemplateIds(deletedIds);
  }

  // 1. 로컬 & 메모리 즉시 저장 및 이벤트 발송 (UI 0ms 즉시 반영)
  const currentList = getLocalWorkReportTemplates();
  const existingIdx = currentList.findIndex((t) => t.id === tplId);
  let updatedList;
  if (existingIdx >= 0) {
    const targetId = currentList[existingIdx].id || tplId;
    payload.id = targetId;
    updatedList = currentList.map((t, idx) => (idx === existingIdx ? payload : t));
  } else {
    updatedList = [payload, ...currentList];
  }
  saveLocalWorkReportTemplates(updatedList);

  // 2. Firestore 비동기 저장 (안전한 sanitize 후 저장)
  try {
    const firestoreData = sanitizeForFirestore(payload);
    await setDoc(doc(db, COLLECTION_NAME, payload.id), firestoreData);
  } catch (e) {
    console.warn("Firestore save template warning:", e);
  }

  return payload;
};

// 템플릿 삭제
export const deleteWorkReportTemplate = async (templateId) => {
  if (!templateId) return;
  const deletedIds = getDeletedTemplateIds();
  deletedIds.add(templateId);
  saveDeletedTemplateIds(deletedIds);

  const currentList = getLocalWorkReportTemplates();
  const updatedList = currentList.filter((t) => t.id !== templateId && !deletedIds.has(t.id));
  saveLocalWorkReportTemplates(updatedList);

  // processSlots 할당 정리 (삭제된 템플릿이 슬롯에 남아있지 않도록)
  try {
    const assigns = getLocalHanulTemplateAssignments();
    let slotChanged = false;
    const nextSlots = { ...(assigns.processSlots || {}) };
    Object.keys(nextSlots).forEach((k) => {
      if (nextSlots[k] === templateId) {
        delete nextSlots[k];
        slotChanged = true;
      }
    });
    if (slotChanged) {
      saveLocalHanulTemplateAssignments({
        ...assigns,
        processSlots: nextSlots
      });
    }
  } catch (err) {}

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
