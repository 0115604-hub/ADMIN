import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import {
  sendApprovalDraftTelegram,
  sendApprovalStepTelegram,
  sendApprovalHoldTelegram,
  sendApprovalRejectTelegram
} from "./telegramService";
import { sanitizeForFirestore } from "../utils/firestoreUtils";
import { cleanCompanyName } from "./overtimeSmartService";
import { isWeekendByDate } from "./overtimeService";

const COLLECTION_NAME = "approval_documents";
const DELETED_COLLECTION_NAME = "deleted_approval_documents";
const LOCAL_STORAGE_KEY = "oryuk_approval_documents_v8_stable";
const DELETED_STORAGE_KEY = "oryuk_approval_deleted_ids_v8";

// ⭐ Helper: Manage permanently deleted document IDs (Tombstone blacklist)
export const getDeletedApprovalIds = () => {
  try {
    const raw = localStorage.getItem(DELETED_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {}
  return new Set();
};

export const saveDeletedApprovalIds = (setOrArr) => {
  try {
    const arr = Array.from(setOrArr);
    localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {}
};

export const PLANT_COMPANIES_MAP = {
  "삼랑진공장": ["오륙", "(주)오륙", "유성", "유성산업"],
  "한림공장": ["조영", "(주)조영산업", "조영산업", "한울", "부림텍"]
};

// List of authorized managers by Title / Hierarchy
export const APPROVAL_MANAGERS = {
  // 1. 기안자 목록 (관리자, 선임, 작업자 전체)
  DRAFTERS: [
    // 본사 / 임원
    { name: "권태형", title: "대표이사", plant: "본사", process: "총괄대표", isManager: true },
    { name: "최미영", title: "전무", plant: "본사", process: "경영총괄", isManager: true },
    { name: "이명재", title: "이사", plant: "삼랑진공장", process: "총괄관리", isManager: true },
    // 삼랑진공장 관리/책임/선임
    { name: "설유철", title: "책임", plant: "삼랑진공장", process: "압출동 관리", isManager: true },
    { name: "윤경수", title: "책임", plant: "삼랑진공장", process: "가공동 관리", isManager: true },
    { name: "이창엽", title: "책임", plant: "삼랑진공장", process: "품질관리", isManager: true },
    { name: "전재율", title: "책임", plant: "삼랑진공장", process: "설비보전", isManager: true },
    { name: "양인나", title: "선임", plant: "삼랑진공장", process: "가공동 관리", isManager: true },
    { name: "유동길", title: "선임", plant: "삼랑진공장", process: "가공동 관리", isManager: true },
    { name: "조인주", title: "선임", plant: "삼랑진공장", process: "경리업무", isManager: true },
    { name: "이상기", title: "주임", plant: "삼랑진공장", process: "품질관리", isManager: true },
    // 한림공장 관리/책임/선임
    { name: "김동욱", title: "책임", plant: "한림공장", process: "총괄관리", isManager: true },
    { name: "오상민", title: "선임", plant: "한림공장", process: "가공동 관리", isManager: true },
    // 압출동 작업자
    { name: "공영국", title: "대리", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "심임대", title: "반장", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "이상은", title: "반장", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "닉", title: "작업자", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "마이클", title: "작업자", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "존카를로", title: "작업자", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "지미", title: "작업자", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "만", title: "작업자", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "샤먼", title: "작업자", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "쿠마루", title: "작업자", plant: "삼랑진공장", process: "압출동", isManager: false },
    { name: "이수루", title: "작업자", plant: "삼랑진공장", process: "압출동", isManager: false }
  ],
  // 2. 책임 (중간결재자 - 관리자 및 책임/선임/반장 전체)
  LEADS: [
    { name: "이명재", title: "이사", plant: "삼랑진공장", process: "총괄관리" },
    { name: "설유철", title: "책임", plant: "삼랑진공장", process: "압출동 관리" },
    { name: "윤경수", title: "책임", plant: "삼랑진공장", process: "가공동 관리" },
    { name: "이창엽", title: "책임", plant: "삼랑진공장", process: "품질관리" },
    { name: "전재율", title: "책임", plant: "삼랑진공장", process: "설비보전" },
    { name: "김동욱", title: "책임", plant: "한림공장", process: "총괄관리" },
    { name: "양인나", title: "선임", plant: "삼랑진공장", process: "가공동 관리" },
    { name: "유동길", title: "선임", plant: "삼랑진공장", process: "가공동 관리" },
    { name: "조인주", title: "선임", plant: "삼랑진공장", process: "경리업무" },
    { name: "오상민", title: "선임", plant: "한림공장", process: "가공동 관리" },
    { name: "공영국", title: "대리", plant: "삼랑진공장", process: "압출동" },
    { name: "심임대", title: "반장", plant: "삼랑진공장", process: "압출동" },
    { name: "이상은", title: "반장", plant: "삼랑진공장", process: "압출동" }
  ],
  // 3. 이사 (임원 결재자)
  DIRECTORS: [
    { name: "이명재", title: "이사", plant: "삼랑진공장", process: "총괄관리" },
    { name: "최미영", title: "전무", plant: "본사", process: "경영총괄" },
    { name: "이명재 / 최미영", title: "이사/전무", plant: "공통", process: "공동 결재 권한" }
  ],
  // 4. 대표 (최종 결재자)
  CEO: [
    { name: "권태형", title: "대표이사", plant: "본사", process: "대표이사" },
    { name: "최미영", title: "전무", plant: "본사", process: "전무" }
  ]
};

// Clean and Normalize Document: ensure role '이사' allows '이명재' or '최미영' (한림공장)
// ⭐ 결재 자동 승인 방지: 4단계 모두 실제로 승인되지 않은 문서는 절대 APPROVED 상태가 되지 않도록 방어
// Clean and Normalize Document: calculate true step statuses without altering user document data
export const normalizeApprovalDoc = (d) => {
  if (!d) return d;
  const isHanlim = d.plant === "한림공장";
  const fixedSteps = (d.steps || []).map((st) => {
    if (st.role === "이사") {
      const isApprovedByChoi = st.name === "최미영";
      const isApprovedByLee = st.name === "이명재";
      let normName = st.name || "이명재";
      let normTitle = "이사";

      if (isApprovedByChoi) {
        normName = "최미영";
        normTitle = "전무";
      } else if (isApprovedByLee) {
        normName = "이명재";
        normTitle = "이사";
      } else if (st.name?.includes("최미영") && st.name?.includes("이명재")) {
        normName = "이명재 / 최미영";
        normTitle = st.date ? "이사" : "이사/전무";
      } else if (isHanlim && (!st.name || st.name === "이명재/최미영")) {
        normName = "이명재 / 최미영";
        normTitle = st.date ? "이사" : "이사/전무";
      }

      return {
        ...st,
        name: normName,
        title: normTitle
      };
    }
    if (st.role === "대표") {
      return {
        ...st,
        name: st.name === "최미영" ? "최미영" : (st.name || "대표이사"),
        title: st.name === "최미영" ? "전무" : "대표"
      };
    }
    return st;
  });

  // Calculate true approval step status based strictly on the 4 steps
  const approvedCount = fixedSteps.filter((st) => st.status === "APPROVED").length;
  let computedStatus = d.status || "IN_PROGRESS";
  let computedStep = d.currentStep || (approvedCount + 1);

  if (approvedCount === fixedSteps.length && fixedSteps.length > 0) {
    computedStatus = "APPROVED";
    computedStep = fixedSteps.length;
  } else if (fixedSteps.some((st) => st.status === "REJECTED")) {
    computedStatus = "REJECTED";
  } else if (fixedSteps.some((st) => st.status === "HOLD")) {
    computedStatus = "HOLD";
  } else if (approvedCount < fixedSteps.length && computedStatus === "APPROVED") {
    // If marked approved but not all steps are done, keep as IN_PROGRESS
    computedStatus = "IN_PROGRESS";
    computedStep = Math.max(1, approvedCount + 1);
  }

  return {
    ...d,
    currentStep: computedStep,
    status: computedStatus,
    steps: fixedSteps
  };
};

// Helper to construct automatic 4-step approval line
export const getAutoApprovalSteps = (plant, drafterName, drafterTitle, department, leadName = null, ceoName = "대표이사", directorName = null) => {
  let step2Name = leadName;
  let step2Title = "책임";

  if (step2Name) {
    const foundLead = APPROVAL_MANAGERS.LEADS.find((m) => m.name === step2Name);
    if (foundLead) {
      step2Title = foundLead.title || "책임";
    }
  } else {
    if (plant === "한림공장") {
      step2Name = "김동욱";
    } else {
      if (department?.includes("품질")) step2Name = "이창엽";
      else if (department?.includes("설비")) step2Name = "전재율";
      else if (department?.includes("가공")) step2Name = "윤경수";
      else step2Name = "설유철";
    }
  }

  const isHanlim = plant === "한림공장";
  let step3Name = directorName;
  let step3Title = "이사";

  if (step3Name) {
    if (step3Name === "최미영") step3Title = "전무";
    else if (step3Name.includes("최미영") && step3Name.includes("이명재")) step3Title = "이사/전무";
    else step3Title = "이사";
  } else {
    step3Name = isHanlim ? "이명재 / 최미영" : "이명재";
    step3Title = isHanlim ? "이사/전무" : "이사";
  }

  const ceoTitle = ceoName === "최미영" ? "전무" : "대표이사";

  return [
    {
      role: "담당",
      name: drafterName || "기안자",
      title: drafterTitle || "선임",
      status: "APPROVED",
      date: new Date().toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).replace(/\. /g, "-").replace(/\./g, ""),
      comment: "기안 상신"
    },
    {
      role: "책임",
      name: step2Name,
      title: step2Title,
      status: "PENDING",
      date: "",
      comment: ""
    },
    {
      role: "이사",
      name: step3Name,
      title: step3Title,
      status: "WAITING",
      date: "",
      comment: ""
    },
    {
      role: "대표",
      name: ceoName === "최미영" ? "최미영" : "대표이사",
      title: ceoTitle,
      status: "WAITING",
      date: "",
      comment: ""
    }
  ];
};

// Initial authoritative approval documents (Clean empty array by default)
export const INITIAL_APPROVAL_DOCS = [];

// Filter out unwanted weekday attendance synthesis documents so the CEO approval box is not flooded with weekday attendance logs
// ⭐ IMPORTANT: NEVER filter out manual drafts created by users!
export const isWeekdayAttSynthDoc = (d) => {
  if (!d) return false;
  // Manual drafts created by users must NEVER be filtered or deleted
  if (d.isDirectManualDraft || d.isManualDraft || (d.id && !d.id.startsWith("appr_ot_") && !d.id.startsWith("appr_att_"))) {
    return false;
  }

  const isWk = isWeekendByDate(d.workDate || d.title || d.docNumber || d.id);
  if (isWk) return false;

  // Auto-generated synthesis docs (appr_ot_*, appr_att_*) for weekdays
  if (d.id && (d.id.startsWith("appr_ot_") || d.id.startsWith("appr_att_"))) return true;
  return false;
};

// Helper: Read local storage with normalization, initial docs and permanent deletion filtering
export const getLocalApprovalDocs = () => {
  try {
    const deletedIds = getDeletedApprovalIds();
    let data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      return [];
    }

    let parsed = [];
    if (data) {
      try {
        parsed = JSON.parse(data);
      } catch (e) {
        parsed = [];
      }
    }

    const docMap = new Map();
    if (Array.isArray(parsed)) {
      parsed.forEach((d) => {
        if (d && d.id && !deletedIds.has(d.id) && !isWeekdayAttSynthDoc(d)) {
          docMap.set(d.id, d);
        }
      });
    }

    const merged = Array.from(docMap.values()).map(normalizeApprovalDoc);
    return merged;
  } catch (e) {
    console.error("Local storage read error for approval documents:", e);
    return [];
  }
};

// Helper: Save local storage
export const saveLocalApprovalDocs = (docs) => {
  try {
    const deletedIds = getDeletedApprovalIds();
    const cleanDocs = (docs || []).filter((d) => d && !deletedIds.has(d.id) && !isWeekdayAttSynthDoc(d));
    const normalized = cleanDocs.map(normalizeApprovalDoc);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
  } catch (e) {
    console.error("Local storage write error for approval documents:", e);
  }
};

// Real-time Cloud Synchronization with Robust Local Merge & Permanent Deletion Blacklist
export const subscribeApprovalDocs = (onUpdate) => {
  try {
    // 1. Subscribe to deleted documents collection for real-time multi-device deletion
    try {
      onSnapshot(collection(db, DELETED_COLLECTION_NAME), (delSnap) => {
        if (!delSnap.empty) {
          const deletedIds = getDeletedApprovalIds();
          let hasNewDeletes = false;
          delSnap.forEach((d) => {
            if (!deletedIds.has(d.id)) {
              deletedIds.add(d.id);
              hasNewDeletes = true;
            }
          });
          if (hasNewDeletes) {
            saveDeletedApprovalIds(deletedIds);
            onUpdate(getLocalApprovalDocs());
          }
        }
      }, () => {});
    } catch (e) {}

    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const deletedIds = getDeletedApprovalIds();
        const remoteDocs = [];
        if (!snapshot.empty) {
          snapshot.forEach((d) => {
            if (deletedIds.has(d.id)) {
              deleteDoc(doc(db, COLLECTION_NAME, d.id)).catch(() => {});
              return;
            }
            const rawDoc = { id: d.id, ...d.data() };
            if (isWeekdayAttSynthDoc(rawDoc)) {
              deleteDoc(doc(db, COLLECTION_NAME, d.id)).catch(() => {});
              return;
            }
            const normalized = normalizeApprovalDoc(rawDoc);
            remoteDocs.push(normalized);
          });
        }

        // Keep all valid documents without deleting user drafts
        const cleanList = [];
        const seenDocIds = new Set();
        for (const item of remoteDocs) {
          if (!item || !item.id) continue;
          if (deletedIds.has(item.id)) continue;
          if (seenDocIds.has(item.id)) continue;
          seenDocIds.add(item.id);
          cleanList.push(item);
        }

        cleanList.sort((a, b) => {
          const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return tB - tA;
        });

        saveLocalApprovalDocs(cleanList);
        if (onUpdate) onUpdate(cleanList);
      },
      (error) => {
        console.warn("Firestore approval sync warning:", error);
        if (onUpdate) onUpdate(getLocalApprovalDocs());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error("subscribeApprovalDocs error:", e);
    if (onUpdate) onUpdate(getLocalApprovalDocs());
    return () => {};
  }
};

// Check Approval Role Permission
export const checkApprovalPermission = (docItem, currentProfile, isAdmin) => {
  if (!docItem || !docItem.steps) {
    return { canApprove: false, reason: "문서 정보가 없습니다." };
  }

  if (docItem.status === "APPROVED") {
    return { canApprove: false, reason: "최종 승인 완료된 문서입니다." };
  }

  const activeStepIdx = docItem.steps.findIndex((st) => st.status === "PENDING" || st.status === "HOLD");
  if (activeStepIdx === -1) {
    return { canApprove: false, reason: "결재 대기 중인 단계가 없습니다." };
  }

  const activeStep = docItem.steps[activeStepIdx];
  const stepRole = activeStep.role; // 담당, 책임, 이사, 대표
  const userName = currentProfile?.name || "";
  const userTitle = currentProfile?.title || "";

  // 1. ADMIN Mode -> Top Authority (권태형 대표이사 또는 최미영 전무)
  if (isAdmin) {
    const adminApprover = currentProfile?.name || "권태형";
    return {
      canApprove: true,
      stepIndex: activeStepIdx,
      stepRole,
      isRepresentative: true,
      approverName: adminApprover
    };
  }

  // 2. Step 1: 담당 (All Workers / 전작업자)
  if (stepRole === "담당") {
    return {
      canApprove: true,
      stepIndex: activeStepIdx,
      stepRole,
      approverName: userName || "담당자"
    };
  }

  // 3. Step 2: 책임 (지정된 관리자/책임자 또는 관리 직급)
  if (stepRole === "책임") {
    const isStepTarget = activeStep.name === userName || (activeStep.name && activeStep.name.includes(userName));
    const isLeadTitle = userTitle === "책임" || userTitle === "총괄" || userTitle === "선임" || userTitle === "대리" || userTitle === "반장";
    const isPlantLead =
      (docItem.plant === "한림공장" && (userName === "김동욱" || userName === "오상민" || isLeadTitle)) ||
      (docItem.plant === "삼랑진공장" && (userName === "설유철" || userName === "윤경수" || userName === "이창엽" || userName === "전재율" || userName === "양인나" || userName === "유동길" || userName === "조인주" || isLeadTitle)) ||
      userName === "이명재" || userName === "최미영" || userName === "권태형"; // 상위 결재자/임원 전결 가능

    if (isStepTarget || isPlantLead || isLeadTitle || isAdmin) {
      return {
        canApprove: true,
        stepIndex: activeStepIdx,
        stepRole,
        approverName: userName || activeStep.name
      };
    }
    return {
      canApprove: false,
      reason: `[${activeStep.name || "책임"}] 결재 권한이 필요합니다. (지정 결재자: ${activeStep.name})`
    };
  }

  // 4. Step 3: 이사 (이명재 이사, 최미영 전무 등 임원 결재)
  if (stepRole === "이사") {
    const isTargetLee = !activeStep.name || activeStep.name.includes("이명재");
    const isTargetChoi = activeStep.name?.includes("최미영");

    if (
      userName === "이명재" ||
      userName === "최미영" ||
      userTitle === "이사" ||
      userTitle === "전무" ||
      isAdmin ||
      (isTargetLee && (userName === "이명재" || userTitle === "이사")) ||
      (isTargetChoi && (userName === "최미영" || userTitle === "전무"))
    ) {
      let approver = "이명재";
      if (userName === "최미영" || userTitle === "전무" || currentProfile?.id === "admin_choi") {
        approver = "최미영";
      } else if (userName === "이명재" || userTitle === "이사") {
        approver = "이명재";
      } else if (isAdmin) {
        approver = currentProfile?.name === "최미영" ? "최미영" : (activeStep.name === "최미영" ? "최미영" : "이명재");
      }

      return {
        canApprove: true,
        stepIndex: activeStepIdx,
        stepRole,
        approverName: approver
      };
    }
    return {
      canApprove: false,
      reason: `[임원 결재] 이명재 이사 또는 최미영 전무 결재 권한이 필요합니다. (지정: ${activeStep.name})`
    };
  }

  // 5. Step 4: 대표 (대표이사 권태형 / 전무 최미영)
  if (stepRole === "대표") {
    if (userTitle === "대표" || userTitle === "대표이사" || userTitle === "전무" || userName === "권태형" || userName === "최미영" || userName === "대표이사" || isAdmin) {
      return {
        canApprove: true,
        stepIndex: activeStepIdx,
        stepRole,
        isRepresentative: true,
        approverName: userName || "권태형"
      };
    }
    return {
      canApprove: false,
      reason: "대표이사/전무(ADMIN) 최종 결재 권한이 필요합니다."
    };
  }

  return { canApprove: false, reason: "결재 권한이 없습니다." };
};

// Save or Create an Approval Document (All Workers can draft)
export const saveApprovalDocument = async (docData, options = {}) => {
  const current = getLocalApprovalDocs();
  const id = docData.id || `appr_${Date.now()}`;
  const now = new Date();
  const nowStr = now.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const fullItem = normalizeApprovalDoc({
    ...docData,
    id,
    docNumber: docData.docNumber || `ORYUK-${now.getFullYear()}-${String(Date.now()).slice(-4)}`,
    status: docData.status || "IN_PROGRESS",
    currentStep: docData.currentStep || 2,
    createdAt: docData.createdAt || nowStr,
    updatedAt: nowStr,
    rejectReason: docData.rejectReason || "",
    holdReason: docData.holdReason || "",
    steps: docData.steps || getAutoApprovalSteps(docData.plant, docData.drafter, docData.drafterTitle, docData.department, docData.leadName, docData.ceoName, docData.directorName),
    isDirectManualDraft: options.isDirectManualDraft ?? docData.isDirectManualDraft ?? true
  });

  const existingIdx = current.findIndex((d) => d.id === id);
  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = fullItem;
  } else {
    updated = [fullItem, ...current];
  }

  saveLocalApprovalDocs(updated);

  try {
    await setDoc(doc(db, COLLECTION_NAME, id), sanitizeForFirestore(fullItem));
  } catch (e) {
    console.warn("Firestore save approval document fallback to local:", e);
  }

  // Telegram alert on new draft submission (ONLY for direct manual draft submission, NEVER on background sync or deletion)
  const shouldSendDraftTelegram =
    existingIdx < 0 &&
    options.isDirectManualDraft === true &&
    !options.suppressTelegram &&
    !docData._suppressTelegram;

  if (shouldSendDraftTelegram) {
    sendApprovalDraftTelegram(fullItem).catch((err) => {
      console.warn("Telegram draft alert error:", err);
    });
  }

  return fullItem;
};

// Approve Step
export const approveDocumentStep = async (docId, stepIndex, approverName, comment = "승인") => {
  const current = getLocalApprovalDocs();
  let target = current.find((d) => d.id === docId);

  // If target missing locally or incomplete, fetch live from Firestore
  if (!target || !target.steps || target.steps.length === 0) {
    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, docId));
      if (snap.exists()) {
        target = { id: snap.id, ...snap.data() };
      }
    } catch (e) {
      console.warn("Could not fetch remote doc in approveDocumentStep:", e);
    }
  }
  if (!target || !target.steps) return current;

  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const updatedSteps = target.steps.map((st, idx) => {
    if (idx === stepIndex) {
      let finalTitle = st.title;
      if (approverName === "최미영") finalTitle = "전무";
      else if (approverName === "이명재") finalTitle = "이사";
      else if (approverName === "권태형") finalTitle = "대표이사";

      return {
        ...st,
        name: approverName || st.name,
        title: finalTitle || st.title,
        status: "APPROVED",
        date: nowStr,
        comment: comment || "승인"
      };
    }
    if (idx === stepIndex + 1 && (st.status === "WAITING" || st.status === "HOLD")) {
      return { ...st, status: "PENDING" };
    }
    return st;
  });

  const isAllApproved = updatedSteps.every((st) => st.status === "APPROVED");
  const nextStep = isAllApproved ? 4 : Math.min(stepIndex + 2, 4);

  const updatedTarget = normalizeApprovalDoc({
    ...target,
    steps: updatedSteps,
    currentStep: nextStep,
    status: isAllApproved ? "APPROVED" : "IN_PROGRESS",
    holdReason: ""
  });

  const saved = await saveApprovalDocument(updatedTarget);

  // Telegram notification on step approval (오직 최종 승인 완료 시에만 발송)
  if (isAllApproved) {
    sendApprovalStepTelegram(updatedTarget, approverName, comment, true).catch((err) => {
      console.warn("Telegram approval step alert error:", err);
    });
  }

  return saved;
};

// Hold Step (보류 처리)
export const holdDocumentStep = async (docId, stepIndex, holderName, holdReason) => {
  const current = getLocalApprovalDocs();
  const target = current.find((d) => d.id === docId);
  if (!target) return current;

  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const updatedSteps = target.steps.map((st, idx) => {
    if (idx === stepIndex) {
      let finalTitle = st.title;
      if (holderName === "최미영") finalTitle = "전무";
      else if (holderName === "이명재") finalTitle = "이사";
      else if (holderName === "권태형") finalTitle = "대표이사";

      return {
        ...st,
        name: holderName || st.name,
        title: finalTitle || st.title,
        status: "HOLD",
        date: nowStr,
        comment: holdReason || "보류"
      };
    }
    return st;
  });

  const updatedTarget = normalizeApprovalDoc({
    ...target,
    steps: updatedSteps,
    status: "HOLD",
    holdReason: holdReason || "검토 필요로 인한 보류"
  });

  const saved = await saveApprovalDocument(updatedTarget);

  // Telegram notification on hold
  sendApprovalHoldTelegram(updatedTarget, holderName, holdReason).catch((err) => {
    console.warn("Telegram hold alert error:", err);
  });

  return saved;
};

// Reject Step (반려 처리)
export const rejectDocumentStep = async (docId, stepIndex, rejectorName, rejectReason) => {
  const current = getLocalApprovalDocs();
  const target = current.find((d) => d.id === docId);
  if (!target) return current;

  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const updatedSteps = target.steps.map((st, idx) => {
    if (idx === stepIndex) {
      let finalTitle = st.title;
      if (rejectorName === "최미영") finalTitle = "전무";
      else if (rejectorName === "이명재") finalTitle = "이사";
      else if (rejectorName === "권태형") finalTitle = "대표이사";

      return {
        ...st,
        name: rejectorName || st.name,
        title: finalTitle || st.title,
        status: "REJECTED",
        date: nowStr,
        comment: rejectReason || "반려"
      };
    }
    return st;
  });

  const updatedTarget = normalizeApprovalDoc({
    ...target,
    steps: updatedSteps,
    status: "REJECTED",
    rejectReason: rejectReason || "보완 필요 반려"
  });

  const saved = await saveApprovalDocument(updatedTarget);

  // Telegram notification on rejection
  sendApprovalRejectTelegram(updatedTarget, rejectorName, rejectReason).catch((err) => {
    console.warn("Telegram reject alert error:", err);
  });

  return saved;
};

// Permanent Delete Document (영구 삭제)
export const deleteApprovalDocument = async (id) => {
  if (!id) return getLocalApprovalDocs();

  // 1. Record in local deleted blacklist
  const deletedIds = getDeletedApprovalIds();
  deletedIds.add(id);
  saveDeletedApprovalIds(deletedIds);

  // 2. Remove from local storage
  const current = getLocalApprovalDocs();
  const updated = current.filter((d) => d.id !== id);
  saveLocalApprovalDocs(updated);

  // 3. Remove from Firestore approval_documents and record in deleted_approval_documents
  try {
    await setDoc(doc(db, DELETED_COLLECTION_NAME, id), {
      id,
      deletedAt: new Date().toISOString(),
      isDeleted: true
    }, { merge: true });
  } catch (e) {}

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (e) {
    console.warn("Firestore delete approval fallback to local:", e);
  }

  return updated;
};

// 🧹 Silent Remove Approval Doc (Used during aggregation sync without adding to user-deleted blacklist)
export const removeApprovalDocSilently = async (id) => {
  if (!id) return;
  const current = getLocalApprovalDocs();
  const updated = current.filter((d) => d.id !== id);
  saveLocalApprovalDocs(updated);
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (e) {}
};

// ⭐ 공장별 소속 협력사 근태/특근보고서 결재함 자동 취합 및 등록 연동 (Plant-Level Attendance & Overtime Approval Synthesis)
// 삼랑진공장: (주)오륙, 유성 취합 ➔ 결재함 자동 등록
// 한림공장: (주)조영산업, 한울, 부림텍 취합 ➔ 결재함 자동 등록
// 평일 (월~금): 근태보고서 취합 (Attendance)
// 주말 (토~일) 또는 특근 지정: 특근보고서 취합 (Overtime)

const KNOWN_MANAGERS = [
  "이명재", "설유철", "윤경수", "이창엽", "전재율", "김동욱", "우창용", "오상민", "TEST", "권태형", "최미영"
];

export const syncPlantOvertimeToApprovalBox = async ({
  plant = null,
  company = null,
  workDate = null,
  matrix = null,
  reports = null,
  isDeleteAction = false
} = {}) => {
  try {
    // 1. Determine target plants to aggregate
    let targetPlants = [];
    const cleanComp = cleanCompanyName(company);
    if (plant === "삼랑진공장" || cleanComp === "오륙" || cleanComp === "유성") {
      targetPlants = ["삼랑진공장"];
    } else if (plant === "한림공장" || cleanComp === "조영" || cleanComp === "한울" || cleanComp === "부림텍") {
      targetPlants = ["한림공장"];
    } else {
      targetPlants = ["삼랑진공장", "한림공장"];
    }

    // 2. Parse day and workDate
    let yearNum = 2026;
    let monthNum = 10;
    let dayNum = 1;
    let workDateStr = "2026-10-01";
    if (typeof workDate === "number") {
      dayNum = workDate;
      const now = new Date();
      yearNum = now.getFullYear();
      monthNum = now.getMonth() + 1;
      workDateStr = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    } else if (typeof workDate === "string" && workDate) {
      const match = workDate.match(/(\d{4})?-?(\d{1,2})-(\d{1,2})/);
      if (match) {
        yearNum = match[1] ? parseInt(match[1], 10) : 2026;
        monthNum = parseInt(match[2], 10);
        dayNum = parseInt(match[3], 10);
        workDateStr = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      }
    }

    const dayOfWeekNames = ["일", "월", "화", "수", "목", "금", "토"];
    const dt = new Date(yearNum, monthNum - 1, dayNum);
    const dayOfWeekIndex = dt.getDay(); // 0 = 일, 6 = 토
    const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6 || isWeekendByDate(workDateStr);
    const dayLabel = dayOfWeekNames[dayOfWeekIndex] || (isWeekend ? "토" : "목");

    let allReports = Array.isArray(reports) ? reports : null;
    if (allReports === null) {
      const repMap = new Map();
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("official_overtime_reports_store_v7_company_reports");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) parsed.forEach((r) => r.id && repMap.set(r.id, r));
          }
        } catch (e) {}
      }
      try {
        const snap = await getDocs(collection(db, "overtime_reports"));
        if (!snap.empty) {
          snap.forEach((d) => repMap.set(d.id, { id: d.id, ...d.data() }));
        }
      } catch (e) {
        console.warn("Could not fetch overtime_reports from Firestore in sync:", e);
      }
      allReports = Array.from(repMap.values());
    }
    if (!allReports) allReports = [];

    let allMatrix = Array.isArray(matrix) ? matrix : null;
    if (allMatrix === null && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("oryuk_smart_overtime_data_store_v10_company_separated");
        if (raw) {
          const parsed = JSON.parse(raw);
          allMatrix = parsed.attendanceMatrix || [];
        }
      } catch (e) {}
    }
    if (!allMatrix) allMatrix = [];

    const nowStr = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    const currentApprovalDocs = getLocalApprovalDocs();
    const deletedIds = getDeletedApprovalIds();
    const syncedDocs = [];

    for (const targetPlant of targetPlants) {
      const targetCompanies = PLANT_COMPANIES_MAP[targetPlant] || [];
      const plantKey = targetPlant === "삼랑진공장" ? "samrangjin" : "hanlim";

      // Filter reports for this plant and date with strict partner company isolation
      const plantReports = allReports.filter(r => {
        if (!r) return false;
        const repComp = cleanCompanyName(r.company);

        // Prevent cross-plant contamination:
        if (targetPlant === "삼랑진공장" && (repComp === "조영" || repComp === "한울" || repComp === "부림텍")) {
          return false;
        }
        if (targetPlant === "한림공장" && (repComp === "오륙" || repComp === "유성")) {
          return false;
        }

        const matchesPlant = (
          r.plant === targetPlant ||
          (r.plant && r.plant.includes(targetPlant.replace("공장", ""))) ||
          targetCompanies.some(c => repComp === cleanCompanyName(c)) ||
          targetCompanies.some(c => r.title && r.title.includes(c))
        );
        if (!matchesPlant) return false;

        const dateMatch = (
          r.workDate === workDateStr ||
          (r.workDate && r.workDate.endsWith(String(dayNum).padStart(2, "0")) && r.workDate.includes(String(monthNum).padStart(2, "0"))) ||
          (r.title && r.title.includes(`${monthNum}월 ${dayNum}일`))
        );
        return dateMatch;
      });

      // Check whether this is genuine weekend overtime or legal holiday
      const isActualOvertime = isWeekend || isWeekendByDate(workDateStr);

      // ⭐ 평일 근태보고서는 전자결재함에 등록하지 않고(근태/특근관리 탭에서 전담 관리), 주말/공휴일 특근보고서만 전자결재함에 연동
      if (!isActualOvertime) {
        // Clean up any previously created weekday synthesis document from approval box
        const oldIds = [
          `appr_ot_${plantKey}_${workDateStr.replace(/-/g, "")}`,
          `appr_att_${plantKey}_${workDateStr.replace(/-/g, "")}`
        ];
        for (const oldId of oldIds) {
          await removeApprovalDocSilently(oldId);
        }
        continue;
      }

      const reportCategoryName = "특근보고서";
      const docTypeName = "특근보고서 (취합)";
      const docType = "OVERTIME";
      const draftComment = "특근 취합 기안 상신";
      const summaryHeader = "1. 특근 요약";
      const taskHeader = `• 현대/기아 긴급 납품 물량 대응 및 ${targetPlant} 주말 가동 완료`;

      const canonicalDocId = `appr_ot_${plantKey}_${workDateStr.replace(/-/g, "")}`;

      // ⭐ If document was deleted by user, strictly respect deletion and do not auto-resurrect
      if (deletedIds.has(canonicalDocId)) {
        continue;
      }

      // 🧹 1. Clean duplicate approval documents for this plant and date (while preserving approved steps if any)
      const duplicateDocs = currentApprovalDocs.filter(d => 
        d.id !== canonicalDocId &&
        (d.type === "OVERTIME" || d.type === "ATTENDANCE") &&
        d.plant === targetPlant &&
        (
          (d.id && d.id.includes(workDateStr.replace(/-/g, "")) && d.id.includes(plantKey)) ||
          (d.docNumber && d.docNumber.includes(`${String(monthNum).padStart(2, "0")}${String(dayNum).padStart(2, "0")}`) && d.docNumber.includes(targetPlant === "삼랑진공장" ? "SAM" : "HAL")) ||
          (d.title && d.title.includes(`${monthNum}월 ${dayNum}일`) && d.title.includes(targetPlant))
        )
      );

      let duplicateApprovedSteps = null;
      for (const dup of duplicateDocs) {
        if (Array.isArray(dup.steps) && dup.steps.some(st => st.status === "APPROVED")) {
          duplicateApprovedSteps = dup.steps;
        }
        await removeApprovalDocSilently(dup.id);
      }

      // ⭐ If no reports exist for this plant on this date (e.g. user deleted them):
      if (plantReports.length === 0) {
        const allMatchingDocs = getLocalApprovalDocs().filter(d => 
          (d.type === "OVERTIME" || d.type === "ATTENDANCE") &&
          d.plant === targetPlant &&
          (
            d.id === canonicalDocId ||
            (d.id && d.id.includes(workDateStr.replace(/-/g, "")) && d.id.includes(plantKey)) ||
            (d.docNumber && d.docNumber.includes(`${String(monthNum).padStart(2, "0")}${String(dayNum).padStart(2, "0")}`) && d.docNumber.includes(targetPlant === "삼랑진공장" ? "SAM" : "HAL")) ||
            (d.title && d.title.includes(`${monthNum}월 ${dayNum}일`) && d.title.includes(targetPlant))
          )
        );
        for (const d of allMatchingDocs) {
          await removeApprovalDocSilently(d.id);
        }
        continue;
      }

      // Aggregate data directly from all matching reports for this plant
      const companySummaries = [];
      let totalPlantWorkers = 0;
      let totalPlantHours = 0;
      let totalPlantCost = 0;
      const participatingCompanies = new Set();

      plantReports.forEach(compRep => {
        const rawComp = compRep.company || (Array.isArray(compRep.companies) && compRep.companies[0]) || compRep.title || targetPlant;
        const comp = cleanCompanyName(rawComp) || (targetPlant === "삼랑진공장" ? "오륙" : "한울");
        participatingCompanies.add(comp);

        let workerCount = Number(compRep.totalWorkers) || Number(compRep.headcount) || (compRep.items ? compRep.items.length : 0);
        let workerHours = Number(compRep.totalHours) || (compRep.items ? compRep.items.reduce((s, it) => s + (Number(it.hours) || 0) * (Number(it.count) || 1), 0) : 0);
        let workerCost = Number(compRep.cost) || (workerHours * 15000);
        let managersList = [];
        let workersList = [];

        if (compRep.items && compRep.items.length > 0) {
          compRep.items.forEach(it => {
            const isManagerCategory = (it.category || "").includes("관리") || (it.dept || "").includes("관리") || (it.workContent || "").includes("총괄");
            const namesFromItem = [];
            if (it.workerName) {
              namesFromItem.push(it.workerName);
            } else if (it.names) {
              const parts = String(it.names).split(",").map(n => n.replace(/외 \d+명/g, "").trim()).filter(Boolean);
              namesFromItem.push(...parts);
            }

            namesFromItem.forEach(name => {
              const cleanName = name.trim();
              if (!cleanName) return;
              if (isManagerCategory || KNOWN_MANAGERS.includes(cleanName)) {
                managersList.push(cleanName);
              } else {
                workersList.push(cleanName);
              }
            });
          });
        }

        const uniqueManagers = Array.from(new Set(managersList));
        const uniqueWorkers = Array.from(new Set(workersList)).filter(w => !uniqueManagers.includes(w));
        const actualCount = (uniqueManagers.length + uniqueWorkers.length) || workerCount || 1;

        companySummaries.push({
          company: comp,
          workerCount: actualCount,
          workerHours: workerHours || (actualCount * 8),
          workerCost: workerCost || (actualCount * 8 * 15000),
          managers: uniqueManagers,
          workers: uniqueWorkers
        });
        totalPlantWorkers += actualCount;
        totalPlantHours += (workerHours || (actualCount * 8));
        totalPlantCost += (workerCost || (actualCount * 8 * 15000));
      });

      // If no workers or no valid companies for this plant on this date:
      if (totalPlantWorkers === 0 || companySummaries.length === 0) {
        const allMatchingDocs = getLocalApprovalDocs().filter(d => 
          (d.type === "OVERTIME" || d.type === "ATTENDANCE") &&
          d.plant === targetPlant &&
          (
            d.id === canonicalDocId ||
            (d.id && d.id.includes(workDateStr.replace(/-/g, "")) && d.id.includes(plantKey)) ||
            (d.docNumber && d.docNumber.includes(`${String(monthNum).padStart(2, "0")}${String(dayNum).padStart(2, "0")}`) && d.docNumber.includes(targetPlant === "삼랑진공장" ? "SAM" : "HAL")) ||
            (d.title && d.title.includes(`${monthNum}월 ${dayNum}일`) && d.title.includes(targetPlant))
          )
        );
        for (const d of allMatchingDocs) {
          await removeApprovalDocSilently(d.id);
        }
        continue;
      }

      // ⭐ 1. Check local cache
      const localDoc = getLocalApprovalDocs().find(d => 
        d.id === canonicalDocId ||
        (d.plant === targetPlant && (d.type === "OVERTIME" || d.type === "ATTENDANCE") && (
          (d.id && d.id.includes(workDateStr.replace(/-/g, "")) && d.id.includes(plantKey)) ||
          (d.docNumber && d.docNumber.includes(`${String(monthNum).padStart(2, "0")}${String(dayNum).padStart(2, "0")}`) && d.docNumber.includes(targetPlant === "삼랑진공장" ? "SAM" : "HAL")) ||
          (d.title && d.title.includes(`${monthNum}월 ${dayNum}일`) && d.title.includes(targetPlant))
        ))
      );

      // ⭐ 2. Fetch live Cloud Firestore doc to prevent overwriting cloud approvals
      let cloudDoc = null;
      try {
        const docSnap = await getDoc(doc(db, COLLECTION_NAME, canonicalDocId));
        if (docSnap.exists()) {
          cloudDoc = { id: docSnap.id, ...docSnap.data() };
        }
      } catch (e) {
        console.warn("Could not fetch remote doc in syncPlantOvertimeToApprovalBox:", e);
      }

      const existingDoc = cloudDoc || localDoc;
      const priorSteps = Array.isArray(cloudDoc?.steps) && cloudDoc.steps.length > 0
        ? cloudDoc.steps
        : (Array.isArray(localDoc?.steps) && localDoc.steps.length > 0
            ? localDoc.steps
            : (duplicateApprovedSteps || []));

      const drafterName = targetPlant === "삼랑진공장" ? "양인나" : "오상민";
      const drafterTitle = "선임";
      const leadName = targetPlant === "한림공장" ? "김동욱" : "윤경수";

      const titleCompList = participatingCompanies.size > 0 ? Array.from(participatingCompanies) : targetCompanies;
      const title = `[특근보고서] ${monthNum}월 ${dayNum}일(${dayLabel}) ${targetPlant} 특근보고서 (${titleCompList.join(", ")})`;
      const department = targetPlant === "삼랑진공장"
        ? "생산총괄 ((주)오륙 + 유성)"
        : "생산총괄 ((주)조영산업 + 한울 + 부림텍)";

      // ⭐ 세부투입현황: 회사별로 관리자 / 작업자 분리 표시
      const breakdownText = companySummaries.map(cs => {
        const mgrText = cs.managers.length > 0 ? cs.managers.join(", ") : "-";
        const wrkText = cs.workers.length > 0 ? (cs.workers.length > 10 ? cs.workers.slice(0, 10).join(", ") + ` 외 ${cs.workers.length - 10}명` : cs.workers.join(", ")) : "-";
        return `• ${cs.company} (${cs.workerCount}명)\n  - 관리자: ${mgrText}\n  - 작업자: ${wrkText}`;
      }).join("\n");

      // ⭐ 초간결 특근 취합 결재 문서 내용
      const content = `■ ${monthNum}월 ${dayNum}일(${dayLabel}) [${targetPlant}] ${reportCategoryName} 취합

${summaryHeader}
• 대상: ${targetPlant} (${titleCompList.join(", ")})
• 총 투입: ${totalPlantWorkers}명 (${totalPlantHours} M/H) | 총 노무비: ₩${totalPlantCost.toLocaleString()}

2. 회사별 세부 투입 현황
${breakdownText || "• 등록된 근로자 명단 취합 완료"}

3. 주요 작업 내용
${taskHeader}`;

      // ⭐ Build 4-Step Approval Seal Line with Strict Preservation of Existing Approvals (김동욱, 윤경수, 이명재, 대표이사 등)
      const step0 = {
        role: "담당",
        name: priorSteps[0]?.name || drafterName,
        title: priorSteps[0]?.title || drafterTitle,
        status: "APPROVED",
        date: priorSteps[0]?.date || nowStr,
        comment: priorSteps[0]?.comment || draftComment
      };

      const isStep1Approved = priorSteps[1]?.status === "APPROVED";
      const isStep1Hold = priorSteps[1]?.status === "HOLD";
      const isStep1Rejected = priorSteps[1]?.status === "REJECTED";
      const step1 = {
        role: "책임",
        name: priorSteps[1]?.name || leadName,
        title: priorSteps[1]?.title || "책임",
        status: isStep1Approved ? "APPROVED" : (isStep1Hold ? "HOLD" : (isStep1Rejected ? "REJECTED" : "PENDING")),
        date: priorSteps[1]?.date || "",
        comment: priorSteps[1]?.comment || ""
      };

      const isStep2Approved = priorSteps[2]?.status === "APPROVED";
      const isStep2Hold = priorSteps[2]?.status === "HOLD";
      const isStep2Rejected = priorSteps[2]?.status === "REJECTED";
      const isHanlim = targetPlant === "한림공장";
      const step2 = {
        role: "이사",
        name: priorSteps[2]?.name || (isHanlim ? "이명재/최미영" : "이명재"),
        title: priorSteps[2]?.title || (isHanlim && !isStep2Approved ? "이사/전무" : (priorSteps[2]?.name === "최미영" ? "전무" : "이사")),
        status: isStep2Approved ? "APPROVED" : (isStep2Hold ? "HOLD" : (isStep2Rejected ? "REJECTED" : (isStep1Approved ? "PENDING" : "WAITING"))),
        date: priorSteps[2]?.date || "",
        comment: priorSteps[2]?.comment || ""
      };

      const isStep3Approved = priorSteps[3]?.status === "APPROVED";
      const isStep3Hold = priorSteps[3]?.status === "HOLD";
      const isStep3Rejected = priorSteps[3]?.status === "REJECTED";
      const step3 = {
        role: "대표",
        name: priorSteps[3]?.name === "최미영" ? "최미영" : "대표이사",
        title: priorSteps[3]?.title || (priorSteps[3]?.name === "최미영" ? "전무" : "대표"),
        status: isStep3Approved ? "APPROVED" : (isStep3Hold ? "HOLD" : (isStep3Rejected ? "REJECTED" : (isStep2Approved ? "PENDING" : "WAITING"))),
        date: priorSteps[3]?.date || "",
        comment: priorSteps[3]?.comment || ""
      };

      const steps = [step0, step1, step2, step3];
      const approvedCount = steps.filter(st => st.status === "APPROVED").length;

      let finalDocStatus = "IN_PROGRESS";
      let finalCurrentStep = 2;
      if (approvedCount === 4) {
        finalDocStatus = "APPROVED";
        finalCurrentStep = 4;
      } else if (steps.some(st => st.status === "REJECTED")) {
        finalDocStatus = "REJECTED";
        finalCurrentStep = steps.findIndex(st => st.status === "REJECTED") + 1;
      } else if (steps.some(st => st.status === "HOLD")) {
        finalDocStatus = "HOLD";
        finalCurrentStep = steps.findIndex(st => st.status === "HOLD") + 1;
      } else {
        finalDocStatus = "IN_PROGRESS";
        finalCurrentStep = Math.min(approvedCount + 1, 4);
      }

      const approvalDoc = normalizeApprovalDoc({
        id: canonicalDocId,
        docNumber: existingDoc?.docNumber || `ORYUK-${yearNum}-${String(monthNum).padStart(2, "0")}${String(dayNum).padStart(2, "0")}-${targetPlant === "삼랑진공장" ? "SAM" : "HAL"}`,
        type: docType,
        typeName: docTypeName,
        title,
        plant: targetPlant,
        department,
        drafter: step0.name,
        drafterTitle: step0.title,
        createdAt: existingDoc?.createdAt || nowStr,
        content,
        amount: `₩${totalPlantCost.toLocaleString()}`,
        status: finalDocStatus,
        currentStep: finalCurrentStep,
        steps,
        rejectReason: existingDoc?.rejectReason || "",
        holdReason: existingDoc?.holdReason || ""
      });

      // Always suppress telegram during background aggregation sync
      const saved = await saveApprovalDocument(approvalDoc, { suppressTelegram: true });
      syncedDocs.push(saved);
    }

    return syncedDocs;
  } catch (err) {
    console.error("syncPlantOvertimeToApprovalBox error:", err);
    return [];
  }
};

/**
 * 🌟 Auto-scan and sync all weekend overtime reports in Firestore to the approval box
 */
export const syncAllOvertimeReportsToApprovalBox = async () => {
  try {
    const repMap = new Map();
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("official_overtime_reports_store_v7_company_reports");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) parsed.forEach((r) => r.id && repMap.set(r.id, r));
        }
      } catch (e) {}
    }
    try {
      const snap = await getDocs(collection(db, "overtime_reports"));
      if (!snap.empty) {
        snap.forEach((d) => repMap.set(d.id, { id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn("Could not fetch overtime_reports from Firestore in syncAll:", e);
    }
    const allReports = Array.from(repMap.values());

    const weekendDates = new Set();
    allReports.forEach((r) => {
      if (r.workDate) {
        const parts = String(r.workDate).match(/(\d{4})?-?(\d{1,2})-(\d{1,2})/);
        const y = parts && parts[1] ? parseInt(parts[1], 10) : 2026;
        const m = parts && parts[2] ? parseInt(parts[2], 10) : 10;
        const d = parts && parts[3] ? parseInt(parts[3], 10) : 1;
        const dt = new Date(y, m - 1, d);
        const dow = dt.getDay();
        const isWk = dow === 0 || dow === 6 || isWeekendByDate(r.workDate);
        if (isWk) {
          weekendDates.add(r.workDate);
        }
      }
    });

    const results = [];
    for (const workDate of Array.from(weekendDates)) {
      const res = await syncPlantOvertimeToApprovalBox({
        workDate,
        reports: allReports
      });
      if (Array.isArray(res)) results.push(...res);
    }
    return results;
  } catch (err) {
    console.error("syncAllOvertimeReportsToApprovalBox error:", err);
    return [];
  }
};


