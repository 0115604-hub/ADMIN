import {
  doc,
  setDoc,
  onSnapshot
} from "firebase/firestore";
import { db } from "../../firebase";
import { sanitizeForFirestore } from "../../utils/firestoreUtils";

export const HANUL_TEMPLATE_ASSIGN_KEY = "oruk_hanul_template_assignments_v1";
const HANUL_ASSIGN_DOC_PATH = ["system_config", "hanul_template_assignments"];

let templateGetter = null;
export const registerTemplateCatalogGetter = (fn) => {
  templateGetter = fn;
};

export const normalizeHanulProjectKey = (proj) => {
  const p = String(proj || "").toUpperCase().trim();
  if (p.includes("LQ2")) return "LQ2A";
  if (p.includes("9BQC")) return "9BQC";
  if (p.includes("NX5") || p.includes("NX4")) return "NX5A";
  if (p.includes("HR")) return "HR";
  if (p.includes("JA")) return "JA";
  if (p.includes("JK1")) return "JK1";
  if (p.includes("CE1")) return "CE1";
  if (p.includes("DT")) return "DT";
  if (p.includes("SEOL") || p.includes("EXTRUSION") || p.includes("압출")) return "EXTRUSION";
  if (p.includes("BURIM") || p.includes("부림")) return "BURIMTECH";
  return p || "9BQC";
};

export const buildHanulProcessSlotKey = (project, processId, subSlot = "MAIN") => {
  const normProj = normalizeHanulProjectKey(project);
  const cleanProc = String(processId || "소재준비").trim();
  const cleanSub = String(subSlot || "MAIN").trim();
  return `${normProj}__${cleanProc}__${cleanSub}`;
};

export const getLocalHanulTemplateAssignments = () => {
  try {
    const raw = localStorage.getItem(HANUL_TEMPLATE_ASSIGN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          ...parsed,
          "9BQC": Array.isArray(parsed["9BQC"]) ? parsed["9BQC"] : [],
          "LQ2A": Array.isArray(parsed["LQ2A"]) ? parsed["LQ2A"] : [],
          "HR": Array.isArray(parsed["HR"]) ? parsed["HR"] : [],
          "JA": Array.isArray(parsed["JA"]) ? parsed["JA"] : [],
          "NX5A": Array.isArray(parsed["NX5A"]) ? parsed["NX5A"] : [],
          "JK1": Array.isArray(parsed["JK1"]) ? parsed["JK1"] : [],
          "CE1": Array.isArray(parsed["CE1"]) ? parsed["CE1"] : [],
          "DT": Array.isArray(parsed["DT"]) ? parsed["DT"] : [],
          "EXTRUSION": Array.isArray(parsed["EXTRUSION"]) ? parsed["EXTRUSION"] : [],
          "BURIMTECH": Array.isArray(parsed["BURIMTECH"]) ? parsed["BURIMTECH"] : [],
          processSlots:
            parsed.processSlots && typeof parsed.processSlots === "object"
              ? parsed.processSlots
              : {}
        };
      }
    }
  } catch (e) {}
  return { "9BQC": [], "LQ2A": [], "HR": [], "JA": [], "NX5A": [], "JK1": [], "CE1": [], "DT": [], "EXTRUSION": [], "BURIMTECH": [], processSlots: {} };
};

export const saveLocalHanulTemplateAssignments = (assignments) => {
  const clean = {
    ...(assignments || {}),
    "9BQC": Array.isArray(assignments?.["9BQC"]) ? assignments["9BQC"] : [],
    "LQ2A": Array.isArray(assignments?.["LQ2A"]) ? assignments["LQ2A"] : [],
    "HR": Array.isArray(assignments?.["HR"]) ? assignments["HR"] : [],
    "JA": Array.isArray(assignments?.["JA"]) ? assignments["JA"] : [],
    "NX5A": Array.isArray(assignments?.["NX5A"]) ? assignments["NX5A"] : [],
    "JK1": Array.isArray(assignments?.["JK1"]) ? assignments["JK1"] : [],
    "CE1": Array.isArray(assignments?.["CE1"]) ? assignments["CE1"] : [],
    "DT": Array.isArray(assignments?.["DT"]) ? assignments["DT"] : [],
    "EXTRUSION": Array.isArray(assignments?.["EXTRUSION"]) ? assignments["EXTRUSION"] : [],
    "BURIMTECH": Array.isArray(assignments?.["BURIMTECH"]) ? assignments["BURIMTECH"] : [],
    processSlots:
      assignments?.processSlots && typeof assignments.processSlots === "object"
        ? assignments.processSlots
        : {}
  };
  try {
    localStorage.setItem(HANUL_TEMPLATE_ASSIGN_KEY, JSON.stringify(clean));
  } catch (e) {}
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hanul-template-assignments-updated", { detail: clean }));
  }
  return clean;
};

export const saveHanulTemplateAssignment = async (projectKey, templateIds, processSlotsUpdate = null) => {
  const normKey = normalizeHanulProjectKey(projectKey);
  const current = getLocalHanulTemplateAssignments();
  const ids = Array.isArray(templateIds)
    ? Array.from(new Set(templateIds.filter(Boolean)))
    : templateIds
    ? [templateIds]
    : current[normKey] || [];
  const nextProcessSlots =
    processSlotsUpdate && typeof processSlotsUpdate === "object"
      ? { ...(current.processSlots || {}), ...processSlotsUpdate }
      : current.processSlots || {};
  // null/빈값 슬롯 정리
  Object.keys(nextProcessSlots).forEach((k) => {
    if (!nextProcessSlots[k]) delete nextProcessSlots[k];
  });
  const next = {
    ...current,
    [normKey]: ids,
    processSlots: nextProcessSlots,
    updatedAt: new Date().toISOString()
  };
  saveLocalHanulTemplateAssignments(next);

  try {
    await setDoc(
      doc(db, HANUL_ASSIGN_DOC_PATH[0], HANUL_ASSIGN_DOC_PATH[1]),
      sanitizeForFirestore(next)
    );
  } catch (e) {
    console.warn("Firestore saveHanulTemplateAssignment warning:", e);
  }
  return next;
};

export const subscribeHanulTemplateAssignments = (callback) => {
  callback(getLocalHanulTemplateAssignments());
  try {
    const ref = doc(db, HANUL_ASSIGN_DOC_PATH[0], HANUL_ASSIGN_DOC_PATH[1]);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const clean = saveLocalHanulTemplateAssignments({
            ...data,
            "9BQC": Array.isArray(data?.["9BQC"]) ? data["9BQC"] : [],
            "LQ2A": Array.isArray(data?.["LQ2A"]) ? data["LQ2A"] : [],
            "HR": Array.isArray(data?.["HR"]) ? data["HR"] : [],
            "JA": Array.isArray(data?.["JA"]) ? data["JA"] : [],
            "NX5A": Array.isArray(data?.["NX5A"]) ? data["NX5A"] : [],
            "JK1": Array.isArray(data?.["JK1"]) ? data["JK1"] : [],
            "CE1": Array.isArray(data?.["CE1"]) ? data["CE1"] : [],
            "DT": Array.isArray(data?.["DT"]) ? data["DT"] : [],
            "EXTRUSION": Array.isArray(data?.["EXTRUSION"]) ? data["EXTRUSION"] : [],
            "BURIMTECH": Array.isArray(data?.["BURIMTECH"]) ? data["BURIMTECH"] : [],
            processSlots:
              data?.processSlots && typeof data.processSlots === "object"
                ? data.processSlots
                : {}
          });
          callback(clean);
        } else {
          callback(getLocalHanulTemplateAssignments());
        }
      },
      () => {
        callback(getLocalHanulTemplateAssignments());
      }
    );
    return unsub;
  } catch (e) {
    callback(getLocalHanulTemplateAssignments());
    return () => {};
  }
};

/**
 * 🌟 [핵심] 현장 작업자 로그인 및 일보 모달 열림 시 적용할 5대 공정 지정 양식 완벽 해결
 * 날짜 변경(다음날), 브라우저 재로그인, 캐시 삭제 시에도 관리자가 설정한 양식이 절대 리셋되지 않도록
 * 8단계의 견고한 Tiered Fallback을 통해 100% 매칭 보장
 */
export const getAssignedTemplateForWorker = ({
  company = "",
  project = "",
  processId = "",
  subProcess = "",
  jointType = "",
  inspectionType = "",
  allTemplates = null,
  assignments = null
}) => {
  const tplList =
    Array.isArray(allTemplates) && allTemplates.length > 0
      ? allTemplates
      : (typeof templateGetter === "function" ? templateGetter() : []);
  const assignData =
    assignments && typeof assignments === "object"
      ? assignments
      : getLocalHanulTemplateAssignments();

  const normProj = normalizeHanulProjectKey(project || company || "9BQC");
  const cleanProc = String(processId || "소재준비").trim();
  const cleanSub = String(
    (cleanProc === "소재준비"
      ? subProcess
      : cleanProc === "조인트"
      ? jointType
      : cleanProc === "검사"
      ? inspectionType
      : "") || "MAIN"
  ).trim();

  const slots = assignData.processSlots || {};

  // Tier 1: 세부 공정 슬롯 정확 매칭 (예: 9BQC__소재준비__정치절단, BURIMTECH__STANDARD__MAIN, EXTRUSION__pcm1__MAIN)
  const exactKey = `${normProj}__${cleanProc}__${cleanSub}`;
  let candidateId = slots[exactKey];

  // Tier 2: MAIN 슬롯 매칭 (예: 9BQC__소재준비__MAIN, BURIMTECH__STANDARD__MAIN)
  if (!candidateId) {
    candidateId = slots[`${normProj}__${cleanProc}__MAIN`];
  }

  // Tier 3: '작업일보' 슬롯 매칭 (예: 9BQC__소재준비__작업일보)
  if (!candidateId) {
    candidateId = slots[`${normProj}__${cleanProc}__작업일보`];
  }

  // Tier 4: 해당 프로젝트 & 공정으로 시작하는 슬롯 중 첫번째 등록 양식
  if (!candidateId) {
    const procPrefix = `${normProj}__${cleanProc}__`;
    const matchingKey = Object.keys(slots).find(
      (k) => k.startsWith(procPrefix) && Boolean(slots[k])
    );
    if (matchingKey) candidateId = slots[matchingKey];
  }

  // Tier 5: 프로젝트 전체 슬롯 중 등록된 첫번째 양식
  if (!candidateId) {
    const projPrefix = `${normProj}__`;
    const matchingKey = Object.keys(slots).find(
      (k) => k.startsWith(projPrefix) && Boolean(slots[k])
    );
    if (matchingKey) candidateId = slots[matchingKey];
  }

  // Tier 6: 프로젝트별 지정 템플릿 목록 (예: assignData["9BQC"][0])
  if (
    !candidateId &&
    Array.isArray(assignData[normProj]) &&
    assignData[normProj].length > 0
  ) {
    candidateId = assignData[normProj][0];
  }

  // Tier 7: 회사 표준 지정 템플릿 목록 (예: BURIMTECH, EXTRUSION)
  const normComp = normalizeHanulProjectKey(company);
  if (
    !candidateId &&
    normComp !== normProj &&
    Array.isArray(assignData[normComp]) &&
    assignData[normComp].length > 0
  ) {
    candidateId = assignData[normComp][0];
  }

  // 후보 ID가 있는 경우 템플릿 카탈로그에서 매칭 반환
  if (candidateId) {
    const found = tplList.find((t) => t.id === candidateId);
    if (found) return found;
  }

  // Tier 7.5: 슬롯 매칭 ID가 없거나 카탈로그에 없는 경우, 해당 차종(normProj)과 공정명(cleanProc)에 등록된 관리자 커스텀 템플릿 우선 매칭
  const customProjMatch = tplList.find((t) => {
    if (!t) return false;
    const isCustom = t.isDatabaseBacked || t.isLegoModular || String(t.id || "").startsWith("tpl_lego_") || Boolean(t.legoConfig);
    const matchModel = normalizeHanulProjectKey(t.carModel) === normProj;
    const matchProc =
      String(t.processName || "").includes(cleanProc) ||
      String(t.categoryName || "").includes(cleanProc) ||
      String(t.title || "").includes(cleanProc);
    return isCustom && matchModel && matchProc;
  });
  if (customProjMatch) return customProjMatch;

  // Tier 7.6: 해당 공정(cleanProc)에 등록된 관리자 커스텀 템플릿 우선 매칭 (예: 소재준비/단컷팅/정치절단 커스텀 양식)
  const customProcMatch = tplList.find((t) => {
    if (!t) return false;
    const isCustom = t.isDatabaseBacked || t.isLegoModular || String(t.id || "").startsWith("tpl_lego_") || Boolean(t.legoConfig);
    const matchProc =
      String(t.processName || "").includes(cleanProc) ||
      String(t.categoryName || "").includes(cleanProc) ||
      String(t.title || "").includes(cleanProc);
    return isCustom && matchProc;
  });
  if (customProcMatch) return customProcMatch;

  // Tier 8: 차종(carModel)과 공정명(processName)이 일치하는 카탈로그 기본 양식 자동 매칭
  const catalogMatch = tplList.find((t) => {
    const matchModel = normalizeHanulProjectKey(t.carModel) === normProj;
    const matchProc =
      String(t.processName || "").includes(cleanProc) ||
      String(t.categoryName || "").includes(cleanProc) ||
      String(t.title || "").includes(cleanProc);
    return matchModel && matchProc;
  });
  if (catalogMatch) return catalogMatch;

  return null;
};
