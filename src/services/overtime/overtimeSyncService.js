/**
 * Overtime Multi-Company Firestore Sync, Worker CRUD & Live Audit Logging
 */
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from "firebase/firestore";
import { db } from "../../firebase.js";
import { sanitizeForFirestore } from "../../utils/firestoreUtils.js";
import { INITIAL_SMART_OVERTIME_DATA } from "../../data/masterOvertimeSmartData.js";
import {
  COMPANIES,
  cleanCompanyName,
  normalizeDept
} from "./overtimeConstants.js";
import { ensureAllCompaniesPresent } from "./overtimeMatrixSync.js";
import {
  getFirestoreDocIdForMonth,
  getStorageKeyForCompanyMonth,
  getFirestoreDocIdForCompanyMonth,
  getLocalCompanyOvertimeData,
  memoryCompanyLedgerCache,
  companySaveQueues,
  inFlightCompanySaves,
  lastCompanySaveEpoch,
  getCompanyRosterOverrides,
  saveCompanyRosterOverrides,
  applyCompanyRosterOverrides,
  stripHeavyWorkerFields,
  debouncedSaveCompanyLocal,
  cloudSnapshotHydrated,
  healedCloudOnce,
  pendingCloudSyncTimers,
  pendingCloudSyncMeta
} from "./overtimeCompanyModules.js";

// 5개 독립 업체 모듈을 읽어 화면 표시용 객체로 조립 (물리적 저장은 5개사 완전 분리)
export const getLocalSmartOvertimeData = (targetYearMonth = null) => {
  try {
    const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
    const ym = targetYearMonth || nowKst || "2026-10";
    const parts = ym.split("-").map(Number);
    const year = parts[0] || 2026;
    const month = parts[1] || 10;

    const allMatrix = [];
    const allMaster = [];
    let mergedApprovalStatus = {};
    const allAuditLogs = [];

    COMPANIES.forEach((comp) => {
      const compData = getLocalCompanyOvertimeData(comp, ym);
      (compData.attendanceMatrix || []).forEach((w, idx) => {
        allMatrix.push({
          ...w,
          company: comp,
          companyNo: idx + 1,
          no: idx + 1
        });
      });
      (compData.masterWorkers || []).forEach((w, idx) => {
        allMaster.push({
          ...w,
          company: comp,
          companyNo: idx + 1,
          no: idx + 1
        });
      });
      mergedApprovalStatus = {
        ...mergedApprovalStatus,
        ...(compData.companyApprovalStatus || {})
      };
      if (Array.isArray(compData.recentAuditLogs)) {
        allAuditLogs.push(...compData.recentAuditLogs);
      }
    });

    return {
      year,
      month,
      masterWorkers: allMaster,
      attendanceMatrix: allMatrix,
      companyApprovalStatus: mergedApprovalStatus,
      recentAuditLogs: allAuditLogs.slice(0, 100)
    };
  } catch (err) {
    console.warn("Failed to assemble 5-company smart overtime data:", err);
    return ensureAllCompaniesPresent(INITIAL_SMART_OVERTIME_DATA);
  }
};

// 🌟 5개사 개별 전용: 신규 근로자 등록 함수 (타사 간섭 0%, 인메모리 + 로컬스토리지 + Firestore 즉시 반영)
export const registerCompanyWorker = async (company, workerInfo, targetYearMonth = null) => {
  const cleanComp = cleanCompanyName(company);
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
  const ym = targetYearMonth || nowKst || "2026-10";
  const cleanName = String(workerInfo?.name || "").trim();
  if (!cleanName) throw new Error("근로자 성명을 입력해주세요.");

  const dept = normalizeDept(workerInfo?.dept || "생산팀");
  const line = String(workerInfo?.line || dept).trim();
  const position = String(workerInfo?.position || "사원").trim();
  const daily = workerInfo?.daily && typeof workerInfo.daily === "object" ? { ...workerInfo.daily } : {};

  // 1. 업체별 로스터 오버라이드 갱신 (삭제 목록에서 해제 & 추가 목록에 등록)
  const currentOv = getCompanyRosterOverrides(cleanComp);
  const nextDeleted = (currentOv.deletedNames || []).filter((n) => n !== cleanName);
  const nextAdded = (currentOv.addedWorkers || []).filter((w) => String(w?.name || "").trim() !== cleanName);
  nextAdded.push({ company: cleanComp, dept, line, name: cleanName, position });
  saveCompanyRosterOverrides(cleanComp, { deletedNames: nextDeleted, addedWorkers: nextAdded });

  // 2. 해당 업체의 현재 월 데이터 로드 및 인원 추가/갱신
  const existingComp = getLocalCompanyOvertimeData(cleanComp, ym);
  const baseWorkers = [...(existingComp.attendanceMatrix || [])];
  const existingIdx = baseWorkers.findIndex((w) => String(w?.name || "").trim() === cleanName);

  if (existingIdx >= 0) {
    baseWorkers[existingIdx] = {
      ...baseWorkers[existingIdx],
      company: cleanComp,
      dept,
      line,
      name: cleanName,
      position
    };
  } else {
    baseWorkers.push({
      no: baseWorkers.length + 1,
      companyNo: baseWorkers.length + 1,
      company: cleanComp,
      dept,
      line,
      name: cleanName,
      position,
      daily
    });
  }

  const fullLedger = getLocalSmartOvertimeData(ym);
  const otherCompanyWorkers = (fullLedger.attendanceMatrix || []).filter(
    (w) => cleanCompanyName(w.company) !== cleanComp
  );
  const updatedLedger = {
    ...fullLedger,
    attendanceMatrix: [...otherCompanyWorkers, ...baseWorkers]
  };

  await saveSingleCompanyOvertimeModule(cleanComp, updatedLedger, ym, {
    targetCompany: cleanComp,
    isWorkerListChange: true,
    auditMeta: {
      operator: workerInfo?.operator || "관리자",
      source: "WORKER_REGISTER",
      reason: `[${cleanComp}] ${cleanName} (${dept}/${position}) 신규 근로자 등록`
    }
  });

  return getLocalSmartOvertimeData(ym);
};

// 🌟 5개사 개별 전용: 근로자 영구 삭제 함수 (타사 간섭 0%, 인메모리 + 로컬스토리지 + Firestore 완전 삭제)
export const removeCompanyWorker = async (company, workerName, targetYearMonth = null) => {
  const cleanComp = cleanCompanyName(company);
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
  const ym = targetYearMonth || nowKst || "2026-10";
  const cleanName = String(workerName || "").trim();
  if (!cleanName) throw new Error("삭제할 근로자 성명이 없습니다.");

  // 1. 업체별 로스터 오버라이드에 영구 삭제 등록 (초기 데이터나 구버전 스냅샷에서 부활 방지)
  const currentOv = getCompanyRosterOverrides(cleanComp);
  const nextDeleted = Array.from(new Set([...(currentOv.deletedNames || []), cleanName]));
  const nextAdded = (currentOv.addedWorkers || []).filter(
    (w) => String(w?.name || "").trim() !== cleanName
  );
  saveCompanyRosterOverrides(cleanComp, { deletedNames: nextDeleted, addedWorkers: nextAdded });

  // 2. 인메모리 캐시 및 로컬스토리지의 모든 월(당월/전월 등)에서 해당 업체의 해당 작업자 즉시 제거
  Object.keys(memoryCompanyLedgerCache).forEach((k) => {
    if (k.startsWith(`${cleanComp}_`) && k !== `${cleanComp}_${ym}`) {
      const cached = memoryCompanyLedgerCache[k];
      if (cached && Array.isArray(cached.attendanceMatrix)) {
        const filtered = cached.attendanceMatrix
          .filter((w) => String(w?.name || "").trim() !== cleanName)
          .map((w, idx) => stripHeavyWorkerFields(w, cleanComp, idx));
        memoryCompanyLedgerCache[k] = {
          ...cached,
          attendanceMatrix: filtered,
          masterWorkers: filtered.map((w, idx) => ({
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
          }))
        };
      }
    }
  });

  // 3. 당월 해당 업체 데이터에서 해당 근로자 제거 후 저장
  const existingComp = getLocalCompanyOvertimeData(cleanComp, ym);
  const remainingCompWorkers = (existingComp.attendanceMatrix || []).filter(
    (w) => String(w?.name || "").trim() !== cleanName
  );

  const fullLedger = getLocalSmartOvertimeData(ym);
  const otherCompanyWorkers = (fullLedger.attendanceMatrix || []).filter(
    (w) => cleanCompanyName(w.company) !== cleanComp
  );
  const updatedLedger = {
    ...fullLedger,
    attendanceMatrix: [...otherCompanyWorkers, ...remainingCompWorkers]
  };

  await saveSingleCompanyOvertimeModule(cleanComp, updatedLedger, ym, {
    targetCompany: cleanComp,
    isWorkerListChange: true,
    auditMeta: {
      operator: "관리자",
      source: "WORKER_PERMANENT_DELETE",
      reason: `[${cleanComp}] ${cleanName} 근로자 영구 삭제`
    }
  });

  return getLocalSmartOvertimeData(ym);
};

// 🌟 단일 업체 전용 독립 저장 함수 (오직 해당 업체의 인메모리 캐시, localStorage 키, Firestore 문서만 단독 업데이트)
export const saveSingleCompanyOvertimeModule = async (company, data, ym, options = {}) => {
  const cleanComp = cleanCompanyName(company);
  const cacheKey = `${cleanComp}_${ym}`;
  const compKey = getStorageKeyForCompanyMonth(cleanComp, ym);
  const compDocId = getFirestoreDocIdForCompanyMonth(cleanComp, ym);
  const parts = String(ym || "2026-10").split("-").map(Number);
  const year = parts[0] || 2026;
  const month = parts[1] || 10;
  const nowIso = new Date().toISOString();

  lastCompanySaveEpoch[cleanComp] = Date.now();

  // 1. 해당 업체 기존 로컬 데이터 로드
  const existingCompLocal = getLocalCompanyOvertimeData(cleanComp, ym);
  const incomingCompWorkers = (data?.attendanceMatrix || [])
    .filter((w) => cleanCompanyName(w.company) === cleanComp)
    .map((w, idx) => stripHeavyWorkerFields(w, cleanComp, idx));

  const baseCompWorkers = (options.isWorkerListChange || options.fullReplace || incomingCompWorkers.length > 0)
    ? incomingCompWorkers
    : (existingCompLocal.attendanceMatrix || []);

  const overriddenCompWorkers = applyCompanyRosterOverrides(cleanComp, baseCompWorkers);

  const mergedCompWorkers = overriddenCompWorkers.map((w, idx) => {
    const prevW = (existingCompLocal.attendanceMatrix || []).find(
      (pw) => (pw.name || "").trim() === (w.name || "").trim()
    );
    const prevDaily = prevW?.daily || {};
    const nextDaily = w.daily || {};
    const combinedDaily = options.fullReplace
      ? { ...nextDaily }
      : { ...prevDaily, ...nextDaily };

    if (options.clearedDay) {
      delete combinedDaily[options.clearedDay];
      delete combinedDaily[String(options.clearedDay)];
    }
    if (options.targetDay !== undefined && options.targetDay !== null) {
      const tDay = options.targetDay;
      const tVal = nextDaily[tDay] ?? nextDaily[String(tDay)];
      if (!tVal || tVal === "미입력" || tVal === "undefined" || tVal === "null") {
        delete combinedDaily[tDay];
        delete combinedDaily[String(tDay)];
      } else {
        combinedDaily[tDay] = tVal;
        combinedDaily[String(tDay)] = tVal;
      }
    }

    Object.keys(combinedDaily).forEach((d) => {
      const val = combinedDaily[d];
      if (val === "" || val === "미입력" || val === "undefined" || val === "null") {
        delete combinedDaily[d];
        delete combinedDaily[String(d)];
      }
    });

    return {
      ...stripHeavyWorkerFields(w, cleanComp, idx),
      daily: combinedDaily
    };
  });

  const compApprovals = { ...(existingCompLocal.companyApprovalStatus || {}) };
  Object.entries(data?.companyApprovalStatus || {}).forEach(([k, v]) => {
    if (k.startsWith(`${cleanComp}_`) || cleanCompanyName(v?.company) === cleanComp) {
      compApprovals[k] = v;
    }
  });
  if (options.clearedDay) {
    delete compApprovals[`${cleanComp}_${options.clearedDay}`];
  }

  const currentOv = getCompanyRosterOverrides(cleanComp);

  const nextCompPayload = {
    company: cleanComp,
    year,
    month,
    masterWorkers: mergedCompWorkers.map((w, idx) => ({
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
    attendanceMatrix: mergedCompWorkers,
    deletedWorkerNames: currentOv.deletedNames || [],
    addedWorkers: currentOv.addedWorkers || [],
    companyApprovalStatus: compApprovals,
    recentAuditLogs: (existingCompLocal.recentAuditLogs || []).slice(0, 30),
    updatedAt: nowIso
  };

  // 🌟 1순위: 인메모리 캐시 즉시 갱신 (0ms, localStorage 용량과 무관하게 100% 반영 보장)
  memoryCompanyLedgerCache[cacheKey] = nextCompPayload;

  // 🌟 2순위: 독립 로컬 스토리지 비동기 디바운스 저장 (연속 클릭 시 메인 스레드 렉 제거) 및 화면 동기화 이벤트 발송
  debouncedSaveCompanyLocal(compKey, nextCompPayload, 120);
  if (!options.skipEventDispatch && typeof window !== "undefined") {
    const assembledNow = getLocalSmartOvertimeData(ym);
    window.dispatchEvent(new CustomEvent("oryuk_smart_overtime_updated", { detail: { ...assembledNow, yearMonth: ym, updatedCompany: cleanComp } }));
  }

  // 🌟 3순위: 연속 클릭 병합(Coalescing) 클라우드 동기화 — 30~50명 연속 클릭 시 30번 네트워크 왕복하지 않고 최신 상태로 1회만 초고속 일괄 저장
  const prevMeta = pendingCloudSyncMeta[cacheKey] || { clearedDays: new Set(), targetDays: new Set(), fullReplace: false, auditMetas: [] };
  if (options.clearedDay) prevMeta.clearedDays.add(options.clearedDay);
  if (options.targetDay !== undefined && options.targetDay !== null) prevMeta.targetDays.add(options.targetDay);
  if (options.fullReplace) prevMeta.fullReplace = true;
  if (options.auditMeta) prevMeta.auditMetas.push(options.auditMeta);
  pendingCloudSyncMeta[cacheKey] = prevMeta;

  if (pendingCloudSyncTimers[cacheKey]) {
    clearTimeout(pendingCloudSyncTimers[cacheKey]);
  }

  const delayMs = options.immediateCloudSync ? 10 : 250;

  return new Promise((resolve) => {
    pendingCloudSyncTimers[cacheKey] = setTimeout(() => {
      delete pendingCloudSyncTimers[cacheKey];
      const metaSnapshot = pendingCloudSyncMeta[cacheKey] || { clearedDays: new Set(), targetDays: new Set(), fullReplace: false, auditMetas: [] };
      delete pendingCloudSyncMeta[cacheKey];

      inFlightCompanySaves[cleanComp] = (inFlightCompanySaves[cleanComp] || 0) + 1;
      const runCompanyCloudSync = async () => {
        try {
          if (!db) return true;
          lastCompanySaveEpoch[cleanComp] = Date.now();
          const compRef = doc(db, "smart_overtime_ledger", compDocId);
          const latestCompLocal = memoryCompanyLedgerCache[cacheKey] || nextCompPayload;
          let finalCompMatrix = applyCompanyRosterOverrides(
            cleanComp,
            latestCompLocal.attendanceMatrix || []
          );
          let existingAuditLogs = Array.isArray(latestCompLocal.recentAuditLogs) ? latestCompLocal.recentAuditLogs : [];
          let existingApprovalStatus = { ...(latestCompLocal.companyApprovalStatus || {}) };
          const changedAudits = [];

          // 🌟 이미 onSnapshot으로 클라우드 최신 상태가 인메모리에 동기화된 경우, 불필요한 getDoc 네트워크 왕복을 생략하여 저장 속도를 2배 이상 단축
          const needsRemoteRead = !cloudSnapshotHydrated[cacheKey];
          if (needsRemoteRead) {
            try {
              const snap = await getDoc(compRef);
              if (snap.exists()) {
                cloudSnapshotHydrated[cacheKey] = true;
                const cloudComp = snap.data();
                existingAuditLogs = Array.isArray(cloudComp?.recentAuditLogs) ? cloudComp.recentAuditLogs : existingAuditLogs;
                existingApprovalStatus = (cloudComp && typeof cloudComp.companyApprovalStatus === "object" && cloudComp.companyApprovalStatus !== null)
                  ? { ...cloudComp.companyApprovalStatus, ...existingApprovalStatus }
                  : existingApprovalStatus;
                metaSnapshot.clearedDays.forEach((cd) => {
                  delete existingApprovalStatus[`${cleanComp}_${cd}`];
                });

                if (cloudComp && Array.isArray(cloudComp.attendanceMatrix) && cloudComp.attendanceMatrix.length > 0) {
                  finalCompMatrix = finalCompMatrix.map((localW, idx) => {
                    const cloudW = cloudComp.attendanceMatrix.find(
                      (cw) => (cw.name || "").trim() === (localW.name || "").trim()
                    );
                    if (!cloudW) return localW;
                    const cloudDaily = cloudW.daily || {};
                    const localDaily = localW.daily || {};
                    const mergedDaily = metaSnapshot.fullReplace
                      ? { ...localDaily }
                      : { ...cloudDaily, ...localDaily };

                    metaSnapshot.targetDays.forEach((tDay) => {
                      const tVal = localDaily[tDay] ?? localDaily[String(tDay)];
                      if (!tVal || tVal === "미입력" || tVal === "undefined" || tVal === "null") {
                        delete mergedDaily[tDay];
                        delete mergedDaily[String(tDay)];
                      } else {
                        mergedDaily[tDay] = tVal;
                        mergedDaily[String(tDay)] = tVal;
                      }
                    });
                    metaSnapshot.clearedDays.forEach((cd) => {
                      delete mergedDaily[cd];
                      delete mergedDaily[String(cd)];
                    });

                    Object.keys(mergedDaily).forEach((d) => {
                      const val = mergedDaily[d];
                      if (val === "" || val === "미입력" || val === "undefined" || val === "null") {
                        delete mergedDaily[d];
                        delete mergedDaily[String(d)];
                      }
                    });

                    return {
                      ...stripHeavyWorkerFields(cloudW, cleanComp, idx),
                      ...stripHeavyWorkerFields(localW, cleanComp, idx),
                      daily: mergedDaily
                    };
                  });
                }
              }
            } catch (readErr) {
              console.warn(`[${cleanComp}] Firestore 개별 문서 조회 경고:`, readErr);
            }
          }

          const lastAuditMeta = metaSnapshot.auditMetas[metaSnapshot.auditMetas.length - 1];
          if (lastAuditMeta && lastAuditMeta.reason) {
            changedAudits.push({
              worker: "-",
              company: cleanComp,
              day: Array.from(metaSnapshot.targetDays)[0] || 0,
              before: "-",
              after: "-",
              operator: lastAuditMeta.operator || "현장관리자",
              source: lastAuditMeta.source || "USER_DIRECT_ACTION",
              reason: lastAuditMeta.reason,
              timestamp: new Date().toISOString()
            });
          }

          const updatedAuditLogs = [...changedAudits, ...existingAuditLogs].slice(0, 30);
          const mergedApprovalStatus = {
            ...existingApprovalStatus,
            ...(latestCompLocal.companyApprovalStatus || {})
          };
          metaSnapshot.clearedDays.forEach((cd) => {
            delete mergedApprovalStatus[`${cleanComp}_${cd}`];
          });
          const finalUpdatedAt = new Date().toISOString();
          const latestOv = getCompanyRosterOverrides(cleanComp);

          const cloudPayload = {
            company: cleanComp,
            year,
            month,
            masterWorkers: finalCompMatrix.map((w, idx) => ({
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
            attendanceMatrix: finalCompMatrix,
            deletedWorkerNames: latestOv.deletedNames || [],
            addedWorkers: latestOv.addedWorkers || [],
            companyApprovalStatus: mergedApprovalStatus,
            recentAuditLogs: updatedAuditLogs,
            updatedAt: finalUpdatedAt
          };

          lastCompanySaveEpoch[cleanComp] = Date.now();
          memoryCompanyLedgerCache[cacheKey] = cloudPayload;
          debouncedSaveCompanyLocal(compKey, cloudPayload, 200);

          await setDoc(compRef, sanitizeForFirestore(cloudPayload));
          cloudSnapshotHydrated[cacheKey] = true;
          lastCompanySaveEpoch[cleanComp] = Date.now();
          return true;
        } catch (err) {
          console.error(`[${cleanComp}] 독립 근태 모듈 저장 실패:`, err);
          return false;
        } finally {
          inFlightCompanySaves[cleanComp] = Math.max(0, (inFlightCompanySaves[cleanComp] || 1) - 1);
        }
      };

      companySaveQueues[cleanComp] = (companySaveQueues[cleanComp] || Promise.resolve())
        .then(runCompanyCloudSync, runCompanyCloudSync)
        .then(resolve, () => resolve(false));
    }, delayMs);
  });
};

export const saveSmartOvertimeData = async (data, targetYearMonth = null, options = {}) => {
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
  const ym = targetYearMonth || (data?.year && data?.month ? `${data.year}-${String(data.month).padStart(2, "0")}` : (nowKst || "2026-10"));

  const targetComp = options.targetCompany ? cleanCompanyName(options.targetCompany) : null;
  const isSingleCompany = targetComp && COMPANIES.includes(targetComp);

  // 🌟 단일 업체 지정 시 오직 해당 업체의 독립 모듈만 저장 (다른 4개사 데이터는 건드리지 않음)
  if (isSingleCompany) {
    return saveSingleCompanyOvertimeModule(targetComp, data, ym, options);
  }

  // 전체 저장(엑셀 일괄 업로드 등)인 경우에도 5개사 개별 모듈로 각각 독립 분산 저장
  await Promise.all(
    COMPANIES.map((comp) => saveSingleCompanyOvertimeModule(comp, data, ym, options))
  );
  return true;
};

export const saveCompanyDayApprovalStatus = async (currentLedger, ym, company, day, statusData, extraOptions = {}) => {
  const cleanComp = cleanCompanyName(company);
  const approvalKey = `${cleanComp}_${day}`;
  const currentStatusMap = currentLedger?.companyApprovalStatus || {};
  const updatedStatusMap = {
    ...currentStatusMap,
    [approvalKey]: {
      company: cleanComp,
      day: Number(day),
      ...statusData,
      updatedAt: new Date().toISOString()
    }
  };
  const updatedLedger = {
    ...currentLedger,
    companyApprovalStatus: updatedStatusMap
  };
  await saveSingleCompanyOvertimeModule(cleanComp, updatedLedger, ym, {
    targetCompany: cleanComp,
    targetDay: day,
    immediateCloudSync: true,
    ...extraOptions,
    auditMeta: {
      operator: statusData.operator || statusData.submittedBy || statusData.approvedBy || "관리자",
      source: "APPROVAL_STATUS_UPDATE",
      reason: `${cleanComp} Day ${day} 결재 상태: ${statusData.status}`
    }
  });
  return getLocalSmartOvertimeData(ym);
};

// 🌟 5개사 독립 문서 실시간 구독 (각 회사가 자기 문서만 독립 수신하므로 타사 저장과 절대 충돌하지 않음)
export const subscribeSmartOvertimeData = (callback, targetYearMonth = null) => {
  try {
    const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7);
    const ym = targetYearMonth || nowKst || "2026-10";

    // 🌟 5개사 스냅샷이 동시에 도착할 때 5번 연속 리렌더링되지 않도록 16ms(1프레임) 단위로 배칭
    let notifyTimer = null;
    const scheduleNotify = () => {
      if (notifyTimer) return;
      notifyTimer = setTimeout(() => {
        notifyTimer = null;
        callback(getLocalSmartOvertimeData(ym));
      }, 16);
    };

    const handleCustom = (e) => {
      if (e && e.detail) {
        if (!e.detail.yearMonth || e.detail.yearMonth === ym) {
          callback(e.detail);
        }
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("oryuk_smart_overtime_updated", handleCustom);
    }

    if (!db) {
      callback(getLocalSmartOvertimeData(ym));
      return () => {
        if (notifyTimer) clearTimeout(notifyTimer);
        if (typeof window !== "undefined") {
          window.removeEventListener("oryuk_smart_overtime_updated", handleCustom);
        }
      };
    }

    // 5개 협력사 각각의 독립 Firestore 문서(`overtime_2026_10_oryuk` 등)를 개별로 구독
    const unsubList = COMPANIES.map((comp) => {
      const cacheKey = `${comp}_${ym}`;
      const compKey = getStorageKeyForCompanyMonth(comp, ym);
      const compDocId = getFirestoreDocIdForCompanyMonth(comp, ym);
      const compRef = doc(db, "smart_overtime_ledger", compDocId);

      return onSnapshot(
        compRef,
        (docSnap) => {
          cloudSnapshotHydrated[cacheKey] = true;

          // 해당 업체가 현재 로컬 저장 중이거나 저장 예약/직후(5초 이내)이면 인메모리 최신 상태 유지
          if (
            pendingCloudSyncTimers[cacheKey] ||
            (inFlightCompanySaves[comp] || 0) > 0 ||
            Date.now() - (lastCompanySaveEpoch[comp] || 0) < 5000
          ) {
            scheduleNotify();
            return;
          }

          if (docSnap.exists()) {
            const cloudComp = docSnap.data();
            if (cloudComp && Array.isArray(cloudComp.attendanceMatrix)) {
              const localComp = getLocalCompanyOvertimeData(comp, ym);
              const isLocalNewer = Boolean(
                localComp?.updatedAt &&
                (!cloudComp.updatedAt || String(localComp.updatedAt) > String(cloudComp.updatedAt))
              );

              // 클라우드 문서의 삭제/추가 오버라이드가 있고 클라우드가 더 최신이면 로컬 오버라이드에도 병합
              if (!isLocalNewer && (Array.isArray(cloudComp.deletedWorkerNames) || Array.isArray(cloudComp.addedWorkers))) {
                const localOv = getCompanyRosterOverrides(comp);
                const mergedDel = Array.from(new Set([
                  ...(localOv.deletedNames || []),
                  ...(cloudComp.deletedWorkerNames || [])
                ]));
                const mergedAdd = [...(localOv.addedWorkers || [])];
                (cloudComp.addedWorkers || []).forEach((cw) => {
                  if (!cw || !cw.name) return;
                  const cName = String(cw.name).trim();
                  if (!mergedDel.includes(cName) && !mergedAdd.some((aw) => String(aw?.name || "").trim() === cName)) {
                    mergedAdd.push(cw);
                  }
                });
                saveCompanyRosterOverrides(comp, { deletedNames: mergedDel, addedWorkers: mergedAdd });
              }

              const baseMatrix = isLocalNewer
                ? (localComp.attendanceMatrix || [])
                : (cloudComp.attendanceMatrix || []);

              const overriddenWorkers = applyCompanyRosterOverrides(
                comp,
                baseMatrix,
                cloudComp.deletedWorkerNames,
                cloudComp.addedWorkers
              );

              let localAddedDaysCount = 0;
              const mergedWorkers = overriddenWorkers.map((w, idx) => {
                const cw = (cloudComp.attendanceMatrix || []).find(
                  (item) => (item.name || "").trim() === (w.name || "").trim()
                );
                const lw = (localComp.attendanceMatrix || []).find(
                  (item) => (item.name || "").trim() === (w.name || "").trim()
                );
                const cDaily = cw?.daily || {};
                const lDaily = lw?.daily || {};
                Object.keys(lDaily).forEach((dk) => {
                  const lVal = String(lDaily[dk] || "").trim();
                  if (lVal && lVal !== "-" && lVal !== "미입력" && !cDaily[dk]) {
                    localAddedDaysCount++;
                  }
                });
                // 🌟 항상 로컬과 클라우드의 일자별 근태 데이터를 합집합(Union)으로 병합하여, 어느 한쪽에만 남은 일자 데이터가 유실되지 않도록 보호
                const daily = isLocalNewer
                  ? { ...cDaily, ...lDaily }
                  : { ...lDaily, ...cDaily };
                return {
                  ...stripHeavyWorkerFields(w, comp, idx),
                  daily
                };
              });

              const mergedApprovals = isLocalNewer
                ? { ...(cloudComp.companyApprovalStatus || {}), ...(localComp.companyApprovalStatus || {}) }
                : { ...(localComp.companyApprovalStatus || {}), ...(cloudComp.companyApprovalStatus || {}) };

              const latestOv = getCompanyRosterOverrides(comp);

              const updatedCompData = {
                ...cloudComp,
                company: comp,
                masterWorkers: mergedWorkers.map((w, idx) => ({
                  no: idx + 1,
                  companyNo: idx + 1,
                  company: comp,
                  dept: normalizeDept(w.dept),
                  line: w.line || normalizeDept(w.dept),
                  name: w.name,
                  position: w.position || "사원",
                  employmentType: w.employmentType || "정규직",
                  status: w.status || "재직",
                  note: w.note || ""
                })),
                attendanceMatrix: mergedWorkers,
                deletedWorkerNames: latestOv.deletedNames || [],
                addedWorkers: latestOv.addedWorkers || [],
                companyApprovalStatus: mergedApprovals,
                recentAuditLogs: (cloudComp.recentAuditLogs || []).slice(0, 30),
                updatedAt: isLocalNewer ? localComp.updatedAt : cloudComp.updatedAt
              };

              memoryCompanyLedgerCache[cacheKey] = updatedCompData;
              debouncedSaveCompanyLocal(compKey, updatedCompData, 200);

              // 로컬에만 남아있던 일자 데이터가 발견되어 병합된 경우 세션당 1회만 클라우드에 백업 저장 (무한 스냅샷 루프 방지)
              if (localAddedDaysCount > 0 && !healedCloudOnce[cacheKey]) {
                healedCloudOnce[cacheKey] = true;
                setDoc(compRef, sanitizeForFirestore(updatedCompData)).catch(() => {});
              }

              scheduleNotify();
              return;
            }
          }
          scheduleNotify();
        },
        (err) => {
          console.warn(`[${comp}] 독립 근태 구독 오류:`, err);
          scheduleNotify();
        }
      );
    });

    return () => {
      if (notifyTimer) clearTimeout(notifyTimer);
      unsubList.forEach((unsub) => {
        if (typeof unsub === "function") unsub();
      });
      if (typeof window !== "undefined") {
        window.removeEventListener("oryuk_smart_overtime_updated", handleCustom);
      }
    };
  } catch (err) {
    console.error("Failed to subscribe 5-company smart overtime data:", err);
    callback(getLocalSmartOvertimeData(targetYearMonth));
    return () => {};
  }
};


/**
 * 🔒 Forensic Audit Viewer: Retrieve latest cell-level attendance change audits
 */
export const getRecentAttendanceAudits = async (targetYearMonth = null) => {
  try {
    const ym = targetYearMonth || "2026-10";
    const docId = getFirestoreDocIdForMonth(ym);
    if (!db) return [];
    const ref = doc(db, "smart_overtime_ledger", docId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data()?.recentAuditLogs || [];
    }
    return [];
  } catch (err) {
    console.warn("Failed to fetch recent attendance audits:", err);
    return [];
  }
};

