/**
 * 5-Company Modular Storage Keys & Empty Template Generators
 */
import {
  cleanCompanyName,
  normalizeDept
} from "./overtimeConstants.js";
import { ensureAllCompaniesPresent } from "./overtimeMatrixSync.js";
import { INITIAL_SMART_OVERTIME_DATA } from "../../data/masterOvertimeSmartData.js";

export const STORAGE_KEY = "oryuk_smart_overtime_data_v2_sept";

export const COMPANY_MODULE_SLUGS = {
  "오륙": "oryuk",
  "유성": "yuseong",
  "조영": "joyoung",
  "한울": "hanul",
  "부림텍": "burimtech"
};

export const getCompanySlug = (company) => {
  const clean = cleanCompanyName(company);
  return COMPANY_MODULE_SLUGS[clean] || "oryuk";
};

export const getStorageKeyForMonth = (yearMonth = "2026-10") => {
  const clean = String(yearMonth || "2026-10").replace(/-/g, "_");
  return `oryuk_smart_overtime_data_${clean}`;
};

export const getFirestoreDocIdForMonth = (yearMonth = "2026-10") => {
  const clean = String(yearMonth || "2026-10").replace(/-/g, "_");
  return `overtime_${clean}`;
};

// 🌟 5개사 완전 독립 스토리지 키 및 Firestore 문서 ID (업체 간 간섭/덮어쓰기 0% 원천 격리)
export const getStorageKeyForCompanyMonth = (company, yearMonth = "2026-10") => {
  const cleanYM = String(yearMonth || "2026-10").replace(/-/g, "_");
  const slug = getCompanySlug(company);
  return `oryuk_smart_overtime_comp_${slug}_${cleanYM}`;
};

export const getFirestoreDocIdForCompanyMonth = (company, yearMonth = "2026-10") => {
  const cleanYM = String(yearMonth || "2026-10").replace(/-/g, "_");
  const slug = getCompanySlug(company);
  return `overtime_${cleanYM}_${slug}`;
};

// 당월(10월 등) 작성중인 빈 월간 근태 대장 템플릿 생성 (143명 마스터 전원 포함, 일자별 데이터는 신규 입력용)
export const createEmptySmartOvertimeData = (year = 2026, month = 10) => {
  const master = (INITIAL_SMART_OVERTIME_DATA.masterWorkers || []).map((w, idx) => ({
    ...w,
    no: w.no || idx + 1
  }));
  const matrix = (INITIAL_SMART_OVERTIME_DATA.masterWorkers || []).map((w, idx) => ({
    no: w.no || idx + 1,
    company: w.company,
    dept: w.dept,
    line: w.line,
    name: w.name,
    position: w.position || "사원",
    daily: {}
  }));
  return {
    year: Number(year) || 2026,
    month: Number(month) || 10,
    masterWorkers: master,
    attendanceMatrix: matrix
  };
};

// 업체별 빈 템플릿 생성 (단일 업체 소속 인원만 독립 추출)
export const createEmptyCompanyOvertimeData = (company, year = 2026, month = 10) => {
  const cleanComp = cleanCompanyName(company);
  const initialCompWorkers = (INITIAL_SMART_OVERTIME_DATA.masterWorkers || []).filter(
    (w) => cleanCompanyName(w.company) === cleanComp
  );
  const master = initialCompWorkers.map((w, idx) => ({
    ...w,
    company: cleanComp,
    companyNo: idx + 1,
    no: idx + 1
  }));
  const matrix = initialCompWorkers.map((w, idx) => ({
    no: idx + 1,
    companyNo: idx + 1,
    company: cleanComp,
    dept: normalizeDept(w.dept),
    line: w.line || normalizeDept(w.dept),
    name: (w.name || "").trim(),
    position: w.position || "사원",
    daily: {}
  }));
  return {
    company: cleanComp,
    year: Number(year) || 2026,
    month: Number(month) || 10,
    masterWorkers: master,
    attendanceMatrix: matrix,
    companyApprovalStatus: {},
    recentAuditLogs: []
  };
};

// 업체별 독립 저장 큐 및 상태 추적기 (5개사 각각 독립 동작)
export const companySaveQueues = {
  "오륙": Promise.resolve(),
  "유성": Promise.resolve(),
  "조영": Promise.resolve(),
  "한울": Promise.resolve(),
  "부림텍": Promise.resolve()
};
export const inFlightCompanySaves = {
  "오륙": 0,
  "유성": 0,
  "조영": 0,
  "한울": 0,
  "부림텍": 0
};
export const lastCompanySaveEpoch = {
  "오륙": 0,
  "유성": 0,
  "조영": 0,
  "한울": 0,
  "부림텍": 0
};

// 🌟 인메모리 단일 진실 캐시 (localStorage 용량 초과(QuotaExceededError) 시에도 데이터 유실/원복 0% 보장)
export const memoryCompanyLedgerCache = {};

// 🌟 5개사 개별 인원 추가/삭제 영구 오버라이드 저장소 (초기 마스터 데이터나 구버전 캐시에서 삭제된 인원이 되살아나는 현상 100% 차단)
const ROSTER_OVERRIDES_KEY = "oryuk_company_roster_overrides_v1";
let memoryRosterOverrides = null;

const getRosterOverridesMap = () => {
  if (memoryRosterOverrides && typeof memoryRosterOverrides === "object") {
    return memoryRosterOverrides;
  }
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(ROSTER_OVERRIDES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          memoryRosterOverrides = parsed;
          return parsed;
        }
      }
    }
  } catch (e) {}
  memoryRosterOverrides = {};
  return memoryRosterOverrides;
};

export const getCompanyRosterOverrides = (company) => {
  const cleanComp = cleanCompanyName(company);
  const map = getRosterOverridesMap();
  const entry = map[cleanComp] || {};
  return {
    deletedNames: Array.isArray(entry.deletedNames) ? entry.deletedNames : [],
    addedWorkers: Array.isArray(entry.addedWorkers) ? entry.addedWorkers : []
  };
};

export const saveCompanyRosterOverrides = (company, { deletedNames, addedWorkers }) => {
  const cleanComp = cleanCompanyName(company);
  const map = getRosterOverridesMap();
  map[cleanComp] = {
    deletedNames: Array.from(new Set((deletedNames || []).map((n) => String(n || "").trim()).filter(Boolean))),
    addedWorkers: Array.isArray(addedWorkers) ? addedWorkers : [],
    updatedAt: new Date().toISOString()
  };
  memoryRosterOverrides = map;
  safeSetLocalStorage(ROSTER_OVERRIDES_KEY, JSON.stringify(map));
};

export const applyCompanyRosterOverrides = (company, workersList = [], cloudDeletedNames = [], cloudAddedWorkers = []) => {
  const cleanComp = cleanCompanyName(company);
  const localOv = getCompanyRosterOverrides(cleanComp);
  const deletedSet = new Set([
    ...(localOv.deletedNames || []).map((n) => String(n || "").trim()),
    ...(Array.isArray(cloudDeletedNames) ? cloudDeletedNames : []).map((n) => String(n || "").trim())
  ].filter(Boolean));

  // 1. 삭제된 인원 제외
  const filtered = (workersList || []).filter((w) => {
    if (!w) return false;
    const wName = String(w.name || "").trim();
    if (!wName) return false;
    if (deletedSet.has(wName)) return false;
    return cleanCompanyName(w.company || cleanComp) === cleanComp;
  });

  // 2. 추가된 인원 병합 (이미 목록에 있으면 최신 부서/직위/공정 유지, 없으면 끝에 추가)
  const mergedAdded = [...(Array.isArray(cloudAddedWorkers) ? cloudAddedWorkers : []), ...(localOv.addedWorkers || [])];
  mergedAdded.forEach((addedW) => {
    if (!addedW || !addedW.name) return;
    const aName = String(addedW.name).trim();
    if (!aName || deletedSet.has(aName)) return;
    const existingIdx = filtered.findIndex((w) => String(w.name || "").trim() === aName);
    if (existingIdx === -1) {
      filtered.push({
        company: cleanComp,
        dept: normalizeDept(addedW.dept || "생산팀"),
        line: addedW.line || normalizeDept(addedW.dept || "생산팀"),
        name: aName,
        position: addedW.position || "사원",
        daily: { ...(addedW.daily || {}) }
      });
    }
  });

  return filtered.map((w, idx) => stripHeavyWorkerFields(w, cleanComp, idx));
};

export const stripHeavyWorkerFields = (w, cleanComp, idx) => {
  if (!w) return w;
  const copy = { ...w };
  delete copy.personnelCard;
  delete copy.card;
  delete copy.photoUrl;
  return {
    ...copy,
    company: cleanComp,
    companyNo: idx + 1,
    no: idx + 1,
    dept: normalizeDept(w.dept),
    line: w.line || normalizeDept(w.dept),
    name: (w.name || "").trim(),
    position: w.position || "사원",
    daily: { ...(w.daily || {}) }
  };
};

export const safeSetLocalStorage = (key, valueStr) => {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    window.localStorage.setItem(key, valueStr);
    return true;
  } catch (err) {
    // QuotaExceededError 발생 시 구 통합 레거시 키 및 중복 인사카드 키들을 정리하여 용량 확보 후 재시도
    try {
      const legacyKeysToPurge = [
        STORAGE_KEY,
        "oryuk_smart_overtime_data_2026_09",
        "oryuk_smart_overtime_data_2026-09",
        "oryuk_overtime_reports_backup",
        "oryuk_personnel_cards_comp_oryuk",
        "oryuk_personnel_cards_comp_yuseong",
        "oryuk_personnel_cards_comp_joyoung",
        "oryuk_personnel_cards_comp_hanul",
        "oryuk_personnel_cards_comp_burimtech"
      ];
      legacyKeysToPurge.forEach((lk) => {
        try {
          if (lk && lk !== key) window.localStorage.removeItem(lk);
        } catch (e) {}
      });
      window.localStorage.setItem(key, valueStr);
      return true;
    } catch (retryErr) {
      console.warn(`[safeSetLocalStorage] ${key} 로컬 캐시 저장 생략 (인메모리 및 클라우드 정상 유지):`, retryErr?.name || retryErr);
      return false;
    }
  }
};

// 🌟 비동기 디바운스 로컬스토리지 저장 (연속 클릭 시 메인 스레드 JSON.stringify 블로킹 원천 제거)
const pendingLocalStorageTimers = {};
export const debouncedSaveCompanyLocal = (compKey, payloadObj, delayMs = 120) => {
  if (typeof window === "undefined") return;
  if (pendingLocalStorageTimers[compKey]) {
    clearTimeout(pendingLocalStorageTimers[compKey]);
  }
  pendingLocalStorageTimers[compKey] = setTimeout(() => {
    delete pendingLocalStorageTimers[compKey];
    try {
      safeSetLocalStorage(compKey, JSON.stringify(payloadObj));
    } catch (e) {}
  }, delayMs);
};

// 🌟 클라우드 스냅샷 수신 완료 여부 및 1회 복구 완료 여부 캐시
export const cloudSnapshotHydrated = {};
export const healedCloudOnce = {};
const legacyHealParsedCache = {};
export const pendingCloudSyncTimers = {};
export const pendingCloudSyncMeta = {};

// 단일 업체의 로컬 데이터 로드 (인메모리 캐시 -> 독립 로컬키 -> 초기 마스터 데이터 순, 삭제/추가 오버라이드 항상 적용)
export const getLocalCompanyOvertimeData = (company, targetYearMonth = null) => {
  const cleanComp = cleanCompanyName(company);
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
  const ym = targetYearMonth || nowKst || "2026-10";
  const cacheKey = `${cleanComp}_${ym}`;

  // 0. 인메모리 최신 캐시가 존재하면 즉시 반환
  if (memoryCompanyLedgerCache[cacheKey] && Array.isArray(memoryCompanyLedgerCache[cacheKey].attendanceMatrix)) {
    return memoryCompanyLedgerCache[cacheKey];
  }

  const compKey = getStorageKeyForCompanyMonth(cleanComp, ym);
  const parts = ym.split("-").map(Number);
  const year = parts[0] || 2026;
  const month = parts[1] || 10;

  try {
    // 1. 독립된 업체 전용 스토리지 키 확인
    const rawComp = localStorage.getItem(compKey);
    if (rawComp) {
      const parsed = JSON.parse(rawComp);
      if (parsed && Array.isArray(parsed.attendanceMatrix)) {
        const workers = applyCompanyRosterOverrides(
          cleanComp,
          parsed.attendanceMatrix,
          parsed.deletedWorkerNames,
          parsed.addedWorkers
        );

        // 🌟 혹시 이전 통합 키(`oryuk_smart_overtime_data_YYYY_MM`)에 누락된 일자의 근태나 마감 상태가 남아있다면 월별 1회만 파싱하여 병합 복구
        const legacyKeyForHeal = getStorageKeyForMonth(ym);
        let legacyWorkersMap = null;
        let legacyApprovalsMap = {};
        try {
          if (legacyHealParsedCache[legacyKeyForHeal] === undefined) {
            const rawLegHeal = localStorage.getItem(legacyKeyForHeal);
            legacyHealParsedCache[legacyKeyForHeal] = rawLegHeal ? JSON.parse(rawLegHeal) : null;
          }
          const parsedLegHeal = legacyHealParsedCache[legacyKeyForHeal];
          if (parsedLegHeal) {
            if (Array.isArray(parsedLegHeal.attendanceMatrix)) {
              legacyWorkersMap = new Map();
              parsedLegHeal.attendanceMatrix.forEach((lw) => {
                if (cleanCompanyName(lw?.company) === cleanComp && lw?.name) {
                  legacyWorkersMap.set(String(lw.name).trim(), lw.daily || {});
                }
              });
            }
            if (parsedLegHeal.companyApprovalStatus) {
              Object.entries(parsedLegHeal.companyApprovalStatus).forEach(([k, v]) => {
                if (k.startsWith(`${cleanComp}_`) || cleanCompanyName(v?.company) === cleanComp) {
                  legacyApprovalsMap[k] = v;
                }
              });
            }
          }
        } catch (e) {}

        const healedWorkers = legacyWorkersMap
          ? workers.map((w) => {
              const legDaily = legacyWorkersMap.get(String(w.name).trim()) || {};
              return {
                ...w,
                daily: { ...legDaily, ...(w.daily || {}) }
              };
            })
          : workers;

        const loaded = {
          company: cleanComp,
          year,
          month,
          masterWorkers: healedWorkers.map((w, idx) => ({
            no: idx + 1,
            companyNo: idx + 1,
            company: cleanComp,
            dept: normalizeDept(w.dept),
            line: w.line || normalizeDept(w.dept),
            name: w.name,
            position: w.position || "사원",
            employmentType: w.employmentType || "정규직",
            status: w.status || "재직",
            note: w.note || ""
          })),
          attendanceMatrix: healedWorkers,
          companyApprovalStatus: { ...legacyApprovalsMap, ...(parsed.companyApprovalStatus || {}) },
          recentAuditLogs: (parsed.recentAuditLogs || []).slice(0, 30),
          updatedAt: parsed.updatedAt || null
        };
        memoryCompanyLedgerCache[cacheKey] = loaded;
        return loaded;
      }
    }

    // 2. 기존 통합 스토리지 키가 있다면 해당 업체 데이터만 추출하여 독립 키로 즉시 마이그레이션 후 구 키 삭제
    const legacyKey = getStorageKeyForMonth(ym);
    const rawLegacy = localStorage.getItem(legacyKey) || ((ym === "2026-09" || ym === "2026_09") ? localStorage.getItem(STORAGE_KEY) : null);
    if (rawLegacy) {
      const parsedLegacy = JSON.parse(rawLegacy);
      if (parsedLegacy && Array.isArray(parsedLegacy.attendanceMatrix)) {
        const normalizedLegacy = ensureAllCompaniesPresent(parsedLegacy);
        const compWorkers = applyCompanyRosterOverrides(
          cleanComp,
          (normalizedLegacy.attendanceMatrix || []).filter((w) => cleanCompanyName(w.company) === cleanComp)
        );
        const compApprovals = {};
        Object.entries(normalizedLegacy.companyApprovalStatus || {}).forEach(([k, v]) => {
          if (k.startsWith(`${cleanComp}_`) || cleanCompanyName(v?.company) === cleanComp) {
            compApprovals[k] = v;
          }
        });
        const migrated = {
          company: cleanComp,
          year,
          month,
          masterWorkers: compWorkers.map((w, idx) => ({
            no: idx + 1,
            companyNo: idx + 1,
            company: cleanComp,
            dept: normalizeDept(w.dept),
            line: w.line || normalizeDept(w.dept),
            name: w.name,
            position: w.position || "사원",
            employmentType: w.employmentType || "정규직",
            status: w.status || "재직",
            note: w.note || ""
          })),
          attendanceMatrix: compWorkers,
          companyApprovalStatus: compApprovals,
          recentAuditLogs: (normalizedLegacy.recentAuditLogs || []).filter((l) => cleanCompanyName(l.company) === cleanComp).slice(0, 30),
          updatedAt: normalizedLegacy.updatedAt || new Date().toISOString()
        };
        memoryCompanyLedgerCache[cacheKey] = migrated;
        safeSetLocalStorage(compKey, JSON.stringify(migrated));
        return migrated;
      }
    }

    // 3. 9월 마감 데이터인 경우 마스터 초기 데이터에서 해당 업체만 추출
    if (ym === "2026-09" || ym === "2026_09") {
      const normSept = ensureAllCompaniesPresent(INITIAL_SMART_OVERTIME_DATA);
      const septWorkers = applyCompanyRosterOverrides(
        cleanComp,
        (normSept.attendanceMatrix || []).filter((w) => cleanCompanyName(w.company) === cleanComp)
      );
      const septData = {
        company: cleanComp,
        year: 2026,
        month: 9,
        masterWorkers: septWorkers,
        attendanceMatrix: septWorkers,
        companyApprovalStatus: {},
        recentAuditLogs: []
      };
      memoryCompanyLedgerCache[cacheKey] = septData;
      return septData;
    }
  } catch (err) {
    console.warn(`[${cleanComp}] 독립 근태 데이터 로드 경고:`, err);
  }

  const emptyFallback = createEmptyCompanyOvertimeData(cleanComp, year, month);
  const overriddenWorkers = applyCompanyRosterOverrides(cleanComp, emptyFallback.attendanceMatrix);
  const finalFallback = {
    ...emptyFallback,
    masterWorkers: overriddenWorkers.map((w, idx) => ({
      no: idx + 1,
      companyNo: idx + 1,
      company: cleanComp,
      dept: normalizeDept(w.dept),
      line: w.line || normalizeDept(w.dept),
      name: w.name,
      position: w.position || "사원",
      employmentType: "정규직",
      status: "재직",
      note: ""
    })),
    attendanceMatrix: overriddenWorkers
  };
  memoryCompanyLedgerCache[cacheKey] = finalFallback;
  return finalFallback;
};

