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
  LEADS: [
    { name: "설유철", title: "책임", plant: "삼랑진공장", process: "압출동 관리" },
    { name: "윤경수", title: "책임", plant: "삼랑진공장", process: "가공동 관리" },
    { name: "이창엽", title: "책임", plant: "삼랑진공장", process: "품질관리" },
    { name: "전재율", title: "책임", plant: "삼랑진공장", process: "설비보전" },
    { name: "김동욱", title: "책임", plant: "한림공장", process: "총괄관리" }
  ],
  DIRECTORS: [
    { name: "이명재", title: "이사", plant: "삼랑진공장", process: "총괄관리" }
  ],
  CEO: [
    { name: "권태형", title: "대표이사", plant: "본사", process: "대표이사" },
    { name: "최미영", title: "전무", plant: "본사", process: "전무" }
  ]
};

// Clean and Normalize Document: ensure role '이사' is always '이명재' and content has manager/worker split
// ⭐ 결재 자동 승인 방지: 4단계 모두 실제로 승인되지 않은 문서는 절대 APPROVED 상태가 되지 않도록 방어
export const normalizeApprovalDoc = (d) => {
  if (!d) return d;
  const fixedSteps = (d.steps || []).map((st) => {
    if (st.role === "이사") {
      return {
        ...st,
        name: "이명재",
        title: "이사"
      };
    }
    if (st.role === "대표") {
      return {
        ...st,
        name: st.name === "최미영" ? "최미영" : "대표이사",
        title: st.name === "최미영" ? "전무" : "대표"
      };
    }
    return st;
  });

  // Calculate true approval step status
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
    // If marked approved but not all steps are done, revert to IN_PROGRESS
    computedStatus = "IN_PROGRESS";
    computedStep = Math.max(1, approvedCount + 1);
  }

  // ⭐ Weekday Attendance vs Weekend Overtime Auto-Normalization
  // If document title or id indicates a weekday (월, 화, 수, 목, 금) and was labeled as '특근보고서 취합', convert it to '근태보고서 취합'
  let normalizedTitle = d.title || "";
  let normalizedTypeName = d.typeName || "";
  let normalizedType = d.type || "OVERTIME";
  let normalizedContent = d.content || "";

  const isWeekdayDocument =
    /\((월|화|수|목|금)\)/.test(normalizedTitle) ||
    /202609(0[1-4]|0[7-9]|1[01]|1[4-8]|2[1-5]|2[8-9]|30)/.test(d.id || "") ||
    /2026-09-(0[1-4]|0[7-9]|1[01]|1[4-8]|2[1-5]|2[8-9]|30)/.test(d.workDate || "");

  const hasSynthesisOvertimeLabel =
    normalizedTitle.includes("특근보고서 취합") ||
    normalizedTitle.includes("특근실시보고서 취합") ||
    normalizedTypeName.includes("특근보고서 (취합)");

  if (isWeekdayDocument && hasSynthesisOvertimeLabel && !normalizedTitle.includes("주말 특근 승인")) {
    normalizedTitle = normalizedTitle
      .replace(/특근실시보고서 취합/g, "근태보고서 취합")
      .replace(/특근보고서 취합/g, "근태보고서 취합");

    if (normalizedTypeName.includes("특근보고서")) {
      normalizedTypeName = normalizedTypeName.replace(/특근보고서/g, "근태보고서");
    }

    if (normalizedType === "OVERTIME") {
      normalizedType = "ATTENDANCE";
    }

    if (normalizedContent) {
      normalizedContent = normalizedContent
        .replace(/특근보고서 취합/g, "근태보고서 취합")
        .replace(/특근실시보고서 취합/g, "근태보고서 취합")
        .replace(/1\. 특근 요약/g, "1. 근태 요약")
        .replace(/주말 가동 완료/g, "정규 생산 라인 가동 및 일일 근태 현황 취합");
    }
  }

  return {
    ...d,
    title: normalizedTitle,
    typeName: normalizedTypeName,
    type: normalizedType,
    content: normalizedContent,
    currentStep: computedStep,
    status: computedStatus,
    steps: fixedSteps
  };
};

// Helper to construct automatic 4-step approval line
export const getAutoApprovalSteps = (plant, drafterName, drafterTitle, department, leadName = null, ceoName = "대표이사") => {
  let step2Name = leadName;
  let step2Title = "책임";

  if (!step2Name) {
    if (plant === "한림공장") {
      step2Name = "김동욱";
    } else {
      if (department?.includes("품질")) step2Name = "이창엽";
      else if (department?.includes("설비")) step2Name = "전재율";
      else if (department?.includes("가공")) step2Name = "윤경수";
      else step2Name = "설유철";
    }
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
      name: "이명재",
      title: "이사",
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
export const isWeekdayAttSynthDoc = (d) => {
  if (!d) return false;
  if (d.id && d.id.startsWith("appr_att_")) return true;
  if (d.type === "ATTENDANCE" && d.typeName && d.typeName.includes("취합")) return true;
  if (d.title && d.title.includes("근태보고서 취합")) return true;
  if (d.title && /\((월|화|수|목|금)\)/.test(d.title) && d.title.includes("특근보고서 취합")) return true;
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
              // Delete permanently from remote if previously marked deleted
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

            // If remote doc had wrong director name or outdated content, quietly sync correction to Firestore
            const directorStep = rawDoc.steps?.find((st) => st.role === "이사");
            if (rawDoc.content !== normalized.content || (directorStep && directorStep.name !== "이명재")) {
              setDoc(doc(db, COLLECTION_NAME, d.id), normalized, { merge: true }).catch(() => {});
            }
          });
        }

        // Firestore is authoritative source of truth.
        // Overtime Approval Deduplication: Ensure strictly ONE document per Plant per Date
        const seenOtKeys = new Set();
        const cleanList = [];
        for (const item of remoteDocs) {
          if (deletedIds.has(item.id)) continue;

          if (item.type === "OVERTIME") {
            const dateMatch = (item.title || "").match(/(\d{1,2})월\s*(\d{1,2})일/) || (item.docNumber || "").match(/09\d{2}/) || (item.id || "").match(/2026\d{4}/);
            const dateKey = dateMatch ? dateMatch[0] : (item.createdAt?.slice(0, 10) || item.id);
            const otKey = `${item.plant || "전사"}_${dateKey}`;

            if (seenOtKeys.has(otKey)) {
              // If a non-canonical duplicate is found, clean it from Firestore
              if (item.id && !item.id.startsWith("appr_ot_")) {
                try {
                  deleteDoc(doc(db, COLLECTION_NAME, item.id));
                } catch (e) {}
                continue;
              }
            } else {
              seenOtKeys.add(otKey);
            }
          }
          cleanList.push(item);
        }

        cleanList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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

  // 3. Step 2: 책임 (직급이 '책임'인 사용자 또는 지정된 책임자)
  // 설유철(책임), 윤경수(책임), 이창엽(책임), 전재율(책임), 김동욱(책임)
  if (stepRole === "책임") {
    const isStepTarget = activeStep.name === userName;
    const isLeadTitle = userTitle === "책임" || userTitle === "총괄";
    const isPlantLead =
      (docItem.plant === "한림공장" && (userName === "김동욱" || isLeadTitle)) ||
      (docItem.plant === "삼랑진공장" && (userName === "설유철" || userName === "윤경수" || userName === "이창엽" || userName === "전재율" || isLeadTitle)) ||
      userName === "이명재"; // 이사는 상위 결재자로서 전결 가능

    if (isStepTarget || isPlantLead || isLeadTitle) {
      return {
        canApprove: true,
        stepIndex: activeStepIdx,
        stepRole,
        approverName: userName
      };
    }
    return {
      canApprove: false,
      reason: `[책임 ${activeStep.name}] 결재 권한이 필요합니다. (직급: 책임)`
    };
  }

  // 4. Step 3: 이사 (직급이 '이사'인 임원: 이명재 이사)
  if (stepRole === "이사") {
    if (userName === "이명재" || userTitle === "이사") {
      return {
        canApprove: true,
        stepIndex: activeStepIdx,
        stepRole,
        approverName: "이명재"
      };
    }
    return {
      canApprove: false,
      reason: "[이사 이명재] 임원 결재 권한이 필요합니다. (직급: 이사)"
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
    rejectReason: docData.rejectReason || "",
    holdReason: docData.holdReason || "",
    steps: docData.steps || getAutoApprovalSteps(docData.plant, docData.drafter, docData.drafterTitle, docData.department, docData.leadName)
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
      return {
        ...st,
        name: approverName || st.name,
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
      return {
        ...st,
        name: holderName || st.name,
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
      return {
        ...st,
        name: rejectorName || st.name,
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
    let dayNum = 5;
    let workDateStr = "2026-09-05";
    if (typeof workDate === "number") {
      dayNum = workDate;
      workDateStr = `2026-09-${String(dayNum).padStart(2, "0")}`;
    } else if (typeof workDate === "string" && workDate) {
      const match = workDate.match(/(\d{4})?-?(\d{1,2})-(\d{1,2})/);
      if (match) {
        dayNum = parseInt(match[3], 10);
        workDateStr = `2026-09-${String(dayNum).padStart(2, "0")}`;
      }
    }

    const dayOfWeekNames = ["일", "월", "화", "수", "목", "금", "토"];
    const dt = new Date(2026, 8, dayNum);
    const dayOfWeekIndex = dt.getDay(); // 0 = 일, 6 = 토
    const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6;
    const dayLabel = dayOfWeekNames[dayOfWeekIndex] || (isWeekend ? "토" : "화");

    let allReports = Array.isArray(reports) ? reports : null;
    if (allReports === null) {
      try {
        const snap = await getDocs(collection(db, "overtime_reports"));
        if (!snap.empty) {
          allReports = [];
          snap.forEach((d) => allReports.push({ id: d.id, ...d.data() }));
        }
      } catch (e) {
        console.warn("Could not fetch overtime_reports from Firestore in sync:", e);
      }
      if (!allReports && typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("official_overtime_reports_store_v7_company_reports");
          if (raw) allReports = JSON.parse(raw);
        } catch (e) {}
      }
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

      // Filter reports for this plant and date
      const plantReports = allReports.filter(r => 
        (r.plant === targetPlant || targetCompanies.includes(r.company) || (r.plant && r.plant.includes(targetPlant.replace("공장", "")))) && 
        (r.workDate === workDateStr || (r.workDate && r.workDate.endsWith(String(dayNum).padStart(2, "0"))))
      );

      // Check whether this is weekend overtime or weekday attendance
      const hasSpecialOvertimeReport = plantReports.some(
        (r) => r.reportType === "특근보고서" || (r.title && r.title.includes("특근") && !r.title.includes("근태"))
      );
      const isActualOvertime = isWeekend || hasSpecialOvertimeReport;

      // ⭐ 평일 근태보고서는 전자결재함에 등록하지 않고(근태/특근관리 탭에서 전담 관리), 주말 특근보고서만 전자결재함에 연동
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

      // ⭐ If permanently deleted by ADMIN, never resurrect
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
          (d.docNumber && d.docNumber.includes(`09${String(dayNum).padStart(2, "0")}`) && d.docNumber.includes(targetPlant === "삼랑진공장" ? "SAM" : "HAL")) ||
          (d.title && d.title.includes(`9월 ${dayNum}일`) && d.title.includes(targetPlant))
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
            (d.docNumber && d.docNumber.includes(`09${String(dayNum).padStart(2, "0")}`) && d.docNumber.includes(targetPlant === "삼랑진공장" ? "SAM" : "HAL")) ||
            (d.title && d.title.includes(`9월 ${dayNum}일`) && d.title.includes(targetPlant))
          )
        );
        for (const d of allMatchingDocs) {
          await removeApprovalDocSilently(d.id);
        }
        continue;
      }

      // Aggregate data ONLY from actual registered reports (compRep)
      const companySummaries = [];
      let totalPlantWorkers = 0;
      let totalPlantHours = 0;
      let totalPlantCost = 0;
      const participatingCompanies = [];

      targetCompanies.forEach(comp => {
        // 1. Check if individual report exists
        const compRep = plantReports.find(r => r.company === comp || (Array.isArray(r.companies) && r.companies.includes(comp)));
        if (!compRep) return;

        let workerCount = compRep.totalWorkers || (compRep.items ? compRep.items.length : 0);
        let workerHours = compRep.totalHours || (compRep.items ? compRep.items.reduce((s, it) => s + (Number(it.hours) || 0) * (Number(it.count) || 1), 0) : 0);
        let workerCost = compRep.cost || (workerHours * 15000);
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
        const actualCount = (uniqueManagers.length + uniqueWorkers.length) || workerCount;

        if (actualCount > 0 || compRep) {
          participatingCompanies.push(comp);
          companySummaries.push({
            company: comp,
            workerCount: actualCount,
            workerHours,
            workerCost,
            managers: uniqueManagers,
            workers: uniqueWorkers
          });
          totalPlantWorkers += actualCount;
          totalPlantHours += workerHours;
          totalPlantCost += workerCost;
        }
      });

      // If no workers or no valid companies for this plant on this date:
      if (totalPlantWorkers === 0 || companySummaries.length === 0) {
        const allMatchingDocs = getLocalApprovalDocs().filter(d => 
          (d.type === "OVERTIME" || d.type === "ATTENDANCE") &&
          d.plant === targetPlant &&
          (
            d.id === canonicalDocId ||
            (d.id && d.id.includes(workDateStr.replace(/-/g, "")) && d.id.includes(plantKey)) ||
            (d.docNumber && d.docNumber.includes(`09${String(dayNum).padStart(2, "0")}`) && d.docNumber.includes(targetPlant === "삼랑진공장" ? "SAM" : "HAL")) ||
            (d.title && d.title.includes(`9월 ${dayNum}일`) && d.title.includes(targetPlant))
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
          (d.docNumber && d.docNumber.includes(`09${String(dayNum).padStart(2, "0")}`) && d.docNumber.includes(targetPlant === "삼랑진공장" ? "SAM" : "HAL")) ||
          (d.title && d.title.includes(`9월 ${dayNum}일`) && d.title.includes(targetPlant))
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

      const titleCompList = participatingCompanies.length > 0 ? participatingCompanies : targetCompanies;
      const title = `[특근보고서] 9월 ${dayNum}일(${dayLabel}) ${targetPlant} 특근보고서 (${titleCompList.join(", ")})`;
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
      const content = `■ 9월 ${dayNum}일(${dayLabel}) [${targetPlant}] ${reportCategoryName} 취합

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
      const step2 = {
        role: "이사",
        name: "이명재",
        title: "이사",
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
        docNumber: existingDoc?.docNumber || `ORYUK-2026-09${String(dayNum).padStart(2, "0")}-${targetPlant === "삼랑진공장" ? "SAM" : "HAL"}`,
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
    const snap = await getDocs(collection(db, "overtime_reports"));
    const allReports = [];
    snap.forEach((d) => allReports.push({ id: d.id, ...d.data() }));

    const weekendDates = new Set();
    allReports.forEach((r) => {
      if (r.workDate) {
        const dayNum = parseInt(r.workDate.slice(-2), 10);
        const dt = new Date(2026, 8, isNaN(dayNum) ? 5 : dayNum);
        const dow = dt.getDay();
        const isWk = dow === 0 || dow === 6;
        if (isWk || r.reportType === "특근보고서" || (r.title && r.title.includes("특근") && !r.title.includes("근태"))) {
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


