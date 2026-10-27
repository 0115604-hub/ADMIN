import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";

export const COLLECTION_NAME = "approval_documents";
export const DELETED_COLLECTION_NAME = "deleted_approval_documents";
export const LOCAL_STORAGE_KEY = "official_electronic_approval_documents_v10";

// Standard approval managers
export const APPROVAL_MANAGERS = {
  CEO: { name: "권태형", title: "대표이사" },
  DIRECTOR: { name: "이명재", title: "이사" },
  LEADS: [
    { name: "설유철", title: "책임", plant: "삼랑진공장" },
    { name: "윤경수", title: "책임", plant: "삼랑진공장" },
    { name: "이창엽", title: "책임", plant: "삼랑진공장" },
    { name: "전재율", title: "책임", plant: "삼랑진공장" },
    { name: "김동욱", title: "책임", plant: "한림공장" }
  ]
};

// ----------------------------------------------------
// 1. In-Memory State & Subscriptions
// ----------------------------------------------------
let inMemoryDocs = [];
const subscribers = new Set();
let firestoreUnsub = null;

export function getDeletedApprovalIds() {
  try {
    const raw = localStorage.getItem("deleted_approval_doc_ids");
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
}

export function markApprovalDocDeletedLocally(docId) {
  try {
    const set = getDeletedApprovalIds();
    set.add(docId);
    localStorage.setItem("deleted_approval_doc_ids", JSON.stringify(Array.from(set)));
  } catch (e) {}
}

export function cleanCompanyName(name) {
  if (!name) return "";
  return String(name).replace(/\(주\)/g, "").replace(/\s+/g, "").trim();
}

export function parseSafeTimestamp(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val.toDate === "function") {
    try { return val.toDate().getTime(); } catch (e) {}
  }
  if (typeof val === "string") {
    const d = new Date(val);
    const t = d.getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
}

export function getApprovalDocSortTimestamp(doc) {
  if (!doc) return 0;
  if (doc.workDate && typeof doc.workDate === "string") {
    const d = new Date(`${doc.workDate}T18:00:00`);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  if (doc.createdAt) {
    const t = parseSafeTimestamp(doc.createdAt);
    if (t > 0) return t;
  }
  if (doc.updatedAt) {
    const t = parseSafeTimestamp(doc.updatedAt);
    if (t > 0) return t;
  }
  if (doc.id) {
    const match = String(doc.id).match(/(\d{10,})/);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (parsed > 1600000000000 && parsed < 2200000000000) return parsed;
    }
  }
  return 0;
}

export function sanitizeForFirestore(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) clean[k] = null;
    else clean[k] = sanitizeForFirestore(v);
  }
  return clean;
}

// ----------------------------------------------------
// 2. Document Classification Helpers
// ----------------------------------------------------
export function isFourMApprovalDoc(doc) {
  if (!doc) return false;
  if (doc.id && String(doc.id).startsWith("appr_4m_")) return true;
  if (doc.type === "FOUR_M_CHANGE_POINT" || doc.type === "CHANGE_POINT" || doc.docType === "FOUR_M_CHANGE_POINT") return true;
  if (doc.category === "4M변동점" || doc.typeName?.includes("4M") || doc.typeName?.includes("변동점")) return true;
  if (doc.title && (doc.title.includes("4M") || doc.title.includes("변동점"))) return true;
  return false;
}

export function isOvertimeApprovalDoc(doc) {
  if (!doc) return false;
  if (isFourMApprovalDoc(doc)) return false;
  if (doc.id && String(doc.id).startsWith("appr_ot_")) return true;
  if (doc.title && (doc.title.includes("특근") || doc.title.includes("특근보고서"))) return true;
  return false;
}

export function isGeneralApprovalDoc(doc) {
  if (!doc) return false;
  return !isOvertimeApprovalDoc(doc) && !isFourMApprovalDoc(doc);
}

// ----------------------------------------------------
// 3. Document Normalizer (Single Source of Truth)
// ----------------------------------------------------
export function normalizeApprovalDoc(d) {
  if (!d || typeof d !== "object") return d;
  const is4M = isFourMApprovalDoc(d);
  const isOvertime = isOvertimeApprovalDoc(d);

  // Guarantee valid steps array
  let steps = Array.isArray(d.steps) && d.steps.length > 0 ? d.steps : null;
  if (!steps) {
    if (is4M) {
      steps = [
        { role: "담당", name: d.drafter || "이창엽", title: "책임", status: "APPROVED", date: d.createdAt || "", comment: "4M 기안 상신" },
        { role: "검토", name: "이명재", title: "이사", status: "PENDING", date: "", comment: "" },
        { role: "승인", name: "권태형", title: "대표이사", status: "WAITING", date: "", comment: "" }
      ];
    } else {
      steps = [
        { role: "담당", name: d.drafter || "기안자", title: d.drafterTitle || "선임", status: "APPROVED", date: d.createdAt || "", comment: "기안 상신" },
        { role: "책임", name: d.leadName || (d.plant === "한림공장" ? "김동욱" : "윤경수"), title: "책임", status: "PENDING", date: "", comment: "" },
        { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
        { role: "대표", name: "권태형", title: "대표이사", status: "WAITING", date: "", comment: "" }
      ];
    }
  }

  // Pure step status computation
  const isRejected = steps.some((st) => st && st.status === "REJECTED") || d.status === "REJECTED";
  const isHold = !isRejected && (steps.some((st) => st && st.status === "HOLD") || d.status === "HOLD");
  const isApproved = !isRejected && !isHold && (
    (steps.length > 0 && steps.every((st) => st && st.status === "APPROVED")) ||
    d.status === "APPROVED" ||
    d.status === "완료"
  );

  let finalStatus = "IN_PROGRESS";
  if (isRejected) finalStatus = "REJECTED";
  else if (isHold) finalStatus = "HOLD";
  else if (isApproved) finalStatus = "APPROVED";

  // Identify the exact active step index (0-based)
  const activeStepIdx = steps.findIndex((st) => st && (st.status === "PENDING" || st.status === "HOLD"));
  const activeStep = activeStepIdx >= 0 ? steps[activeStepIdx] : null;

  return {
    ...d,
    category: d.category || (is4M ? "4M변동점" : isOvertime ? "특근보고서" : "품의서"),
    typeName: d.typeName || (is4M ? "4M 변동점 및 CAPA 승인 품의서" : isOvertime ? "특근보고서" : "품의서"),
    status: finalStatus,
    steps: steps,
    currentStep: activeStepIdx >= 0 ? activeStepIdx + 1 : steps.length,
    activeStepIndex: activeStepIdx,
    activeApproverName: activeStep?.name || "",
    activeApproverRole: activeStep?.role || ""
  };
}

// ----------------------------------------------------
// 4. Pure Partition Status Filters
// ----------------------------------------------------
export function isApprovalDocApproved(doc) {
  if (!doc) return false;
  return doc.status === "APPROVED";
}

export function isApprovalDocHold(doc) {
  if (!doc) return false;
  return doc.status === "HOLD";
}

export function isApprovalDocRejected(doc) {
  if (!doc) return false;
  return doc.status === "REJECTED";
}

export function isApprovalDocInProgress(doc) {
  if (!doc) return false;
  return doc.status === "IN_PROGRESS";
}

export function isApprovalDocMyDraft(doc, currentProfile, isAdmin) {
  if (!doc) return false;
  const userName = currentProfile?.name || "";
  if (!userName) return false;
  return (
    doc.drafter === userName ||
    (doc.drafter && doc.drafter.includes(userName)) ||
    (isAdmin && (doc.drafter === "권태형" || doc.drafter === "최미영" || doc.drafter === "대표이사"))
  );
}

// ----------------------------------------------------
// 5. User Pending Filter (Single Source of Truth)
// ----------------------------------------------------
export function isApprovalDocPending(doc, currentProfile = null, isAdmin = false) {
  if (!doc || doc.status !== "IN_PROGRESS") return false;

  const userName = currentProfile?.name || "";
  const userTitle = currentProfile?.title || "";
  const isProfileAdmin = Boolean(
    isAdmin ||
    currentProfile?.role === "ADMIN" ||
    currentProfile?.id === "admin" ||
    currentProfile?.id === "admin_kwon" ||
    currentProfile?.id === "admin_choi" ||
    userName === "권태형" ||
    userTitle.includes("대표")
  );

  // 1. 최고 경영진: 전사 진행 중인 모든 문서는 100% 결재 대기
  if (isProfileAdmin) return true;

  if (!userName) return false;

  // 2. 기안자 본인이 기안하여 진행 중인 문서: 목록 유지
  if (doc.drafter && (doc.drafter === userName || doc.drafter.includes(userName))) {
    return true;
  }

  // 3. 활성 단계 결재자 매칭
  const activeStep = doc.steps?.find((st) => st && (st.status === "PENDING" || st.status === "HOLD"));
  if (!activeStep) return false;

  // 3-1. 활성 단계 명시된 결재자 이름 직접 일치
  if (activeStep.name && (activeStep.name === userName || activeStep.name.includes(userName))) {
    return true;
  }

  // 3-2. 이명재 이사 (삼랑진공장 총괄): 삼랑진공장 4M 문서이거나, 삼랑진공장 서류의 이사/검토 단계
  const isDirector = userName === "이명재" || userTitle.includes("이사");
  if (isDirector) {
    const isSamrangjin = doc.plant === "삼랑진공장" || !doc.plant;
    const is4M = isFourMApprovalDoc(doc);
    const isDirectorStep = activeStep.role === "이사" || activeStep.role === "검토";
    if (isSamrangjin && (is4M || isDirectorStep)) {
      return true;
    }
  }

  // 3-3. 공정 책임자 (activeStep.role === "책임")
  if (activeStep.role === "책임") {
    const userPlant = currentProfile?.plant || "";
    const docPlant = doc.plant || "";
    if (docPlant && userPlant && docPlant === userPlant) {
      return true;
    }
  }

  return false;
}

// ----------------------------------------------------
// 6. Action Permission Checker
// ----------------------------------------------------
export function checkApprovalPermission(docItem, currentProfile, isAdmin) {
  if (!docItem || !Array.isArray(docItem.steps)) {
    return { canApprove: false, reason: "문서 정보가 없습니다." };
  }
  if (docItem.status === "APPROVED") {
    return { canApprove: false, reason: "최종 승인 완료된 문서입니다." };
  }
  const activeStepIdx = docItem.steps.findIndex((st) => st && (st.status === "PENDING" || st.status === "HOLD"));
  if (activeStepIdx === -1) {
    return { canApprove: false, reason: "결재 대기 중인 단계가 없습니다." };
  }

  const activeStep = docItem.steps[activeStepIdx];
  const stepRole = activeStep.role;
  const userName = currentProfile?.name || "";
  const userTitle = currentProfile?.title || "";

  // 1. 최고 경영진 (ADMIN / 권태형 대표이사) -> 전결 권한
  if (isAdmin || userName === "권태형" || userTitle.includes("대표")) {
    return {
      canApprove: true,
      stepIndex: activeStepIdx,
      stepRole,
      isRepresentative: true,
      approverName: currentProfile?.name || "권태형"
    };
  }

  // 2. 결재선에 지정된 본인 이름 직접 일치
  if (activeStep.name && (activeStep.name === userName || activeStep.name.includes(userName))) {
    const isDirectorOrCeo = userName === "이명재" || userName === "최미영" || userTitle.includes("이사") || userTitle.includes("전무");
    return {
      canApprove: true,
      stepIndex: activeStepIdx,
      stepRole,
      isRepresentative: isDirectorOrCeo,
      approverName: userName
    };
  }

  // 3. 이사/검토 단계 (이명재 이사 또는 최미영 전무)
  if (stepRole === "이사" || stepRole === "검토") {
    if (userName === "이명재" || userTitle.includes("이사")) {
      return { canApprove: true, stepIndex: activeStepIdx, stepRole, approverName: "이명재" };
    }
    if (userName === "최미영" || userTitle.includes("전무")) {
      return { canApprove: true, stepIndex: activeStepIdx, stepRole, approverName: "최미영" };
    }
  }

  // 4. 책임 단계 (공장 일치 시 승인)
  if (stepRole === "책임") {
    const userPlant = currentProfile?.plant || "";
    const docPlant = docItem.plant || "";
    if (docPlant && userPlant && docPlant === userPlant) {
      return { canApprove: true, stepIndex: activeStepIdx, stepRole, approverName: userName };
    }
  }

  return { canApprove: false, reason: `[${stepRole}] ${activeStep.name || "지정 결재자"} 결재 권한이 필요합니다.` };
}

// ----------------------------------------------------
// 7. Data Synchronization & Persistence
// ----------------------------------------------------
export function getLocalApprovalDocs() {
  if (Array.isArray(inMemoryDocs) && inMemoryDocs.length > 0) {
    return inMemoryDocs;
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const deletedIds = getDeletedApprovalIds();
    inMemoryDocs = parsed
      .filter((d) => d && d.id && !deletedIds.has(d.id))
      .map(normalizeApprovalDoc);
    return inMemoryDocs;
  } catch (e) {
    return [];
  }
}

export function saveLocalApprovalDocs(docs) {
  try {
    const clean = (docs || []).filter((d) => d && d.id).map(normalizeApprovalDoc);
    inMemoryDocs = clean;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clean));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("oryuk_approval_document_updated", { detail: { docs: clean } }));
    }
  } catch (e) {}
}

export function subscribeApprovalDocs(callback) {
  if (typeof callback !== "function") return () => {};

  // Immediate cached return for 0ms paint
  const local = getLocalApprovalDocs();
  if (local.length > 0) callback(local);

  subscribers.add(callback);

  // Firestore single listener
  if (!firestoreUnsub) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      firestoreUnsub = onSnapshot(
        colRef,
        (snapshot) => {
          const deletedIds = getDeletedApprovalIds();
          const list = [];
          snapshot.forEach((snap) => {
            if (!deletedIds.has(snap.id)) {
              list.push(normalizeApprovalDoc({ id: snap.id, ...snap.data() }));
            }
          });
          list.sort((a, b) => getApprovalDocSortTimestamp(b) - getApprovalDocSortTimestamp(a));
          inMemoryDocs = list;
          saveLocalApprovalDocs(list);
          subscribers.forEach((cb) => {
            try { cb(list); } catch (err) {}
          });
        },
        (error) => {
          console.warn("Firestore approval listener error:", error);
        }
      );
    } catch (e) {
      console.warn("Could not attach approval snapshot listener:", e);
    }
  }

  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0 && firestoreUnsub) {
      firestoreUnsub();
      firestoreUnsub = null;
    }
  };
}

export async function saveApprovalDocument(docData, options = {}) {
  const is4M = isFourMApprovalDoc(docData);
  // ⭐ 자동상신금지: 4M 변동점 전자결재 문서는 품질관리 책임자(이창엽)의 명시적 수동 상신만 엄격 허용
  if (is4M && !options.isStepAction) {
    const isManualDraft = Boolean(options.isDirectManualDraft);
    const isDrafterLeeChangYeop = docData.drafter === "이창엽" || docData.submittedByManager?.includes("이창엽");
    if (!isManualDraft || !isDrafterLeeChangYeop) {
      console.warn("[자동상신금지 차단] 4M 변동점 문서는 이창엽 품질관리 책임자의 직접 상신 외 자동 생성이 차단되었습니다:", docData);
      return null;
    }
  }

  const id = docData.id || `appr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const fullDoc = normalizeApprovalDoc({
    ...docData,
    id,
    createdAt: docData.createdAt || nowStr,
    updatedAt: nowStr
  });

  // 1. Update in-memory and local storage immediately
  const existing = getLocalApprovalDocs();
  const nextList = [fullDoc, ...existing.filter((d) => d.id !== id)];
  saveLocalApprovalDocs(nextList);

  // 2. Persist to Firestore
  try {
    await setDoc(doc(db, COLLECTION_NAME, id), sanitizeForFirestore(fullDoc), { merge: true });
  } catch (e) {
    console.warn("Firestore save approval document error:", e);
  }

  return fullDoc;
}

export async function deleteApprovalDocument(docId) {
  markApprovalDocDeletedLocally(docId);
  const nextList = getLocalApprovalDocs().filter((d) => d.id !== docId);
  saveLocalApprovalDocs(nextList);

  try {
    const snap = await getDoc(doc(db, COLLECTION_NAME, docId));
    if (snap.exists()) {
      await setDoc(doc(db, DELETED_COLLECTION_NAME, docId), {
        ...snap.data(),
        deletedAt: new Date().toISOString()
      });
      await deleteDoc(doc(db, COLLECTION_NAME, docId));
    }
  } catch (e) {
    console.warn("Firestore delete approval document error:", e);
  }
}

// ----------------------------------------------------
// 8. Approval Actions (Approve, Hold, Reject)
// ----------------------------------------------------
export async function approveDocumentStep(docId, stepIndex, approverName, comment = "승인", options = {}) {
  const list = getLocalApprovalDocs();
  let target = list.find((d) => d.id === docId);
  if (!target) {
    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, docId));
      if (snap.exists()) target = normalizeApprovalDoc({ id: snap.id, ...snap.data() });
    } catch (e) {}
  }
  if (!target || !Array.isArray(target.steps)) return list;

  const nowStr = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  const lastIdx = target.steps.length - 1;
  const isBatchAll = Boolean(options.isBatchCompleteAll);

  let updatedSteps;
  if (isBatchAll) {
    // Representative batch approve all pending steps
    updatedSteps = target.steps.map((st, idx) => ({
      ...st,
      name: idx === lastIdx ? (approverName || "권태형") : (st.name || approverName),
      title: idx === lastIdx ? "대표이사" : (st.title || "검토"),
      status: "APPROVED",
      date: st.date || nowStr,
      comment: st.comment || (idx === 0 ? "기안 상신" : (idx === lastIdx ? "대표이사 최종 전결 승인" : "승인"))
    }));
  } else {
    updatedSteps = target.steps.map((st, idx) => {
      if (idx === stepIndex) {
        return {
          ...st,
          name: approverName || st.name,
          status: "APPROVED",
          date: nowStr,
          comment: comment || (idx === 0 ? "기안 상신" : (idx === lastIdx ? "대표이사 최종 승인" : "승인"))
        };
      }
      if (idx === stepIndex + 1 && (st.status === "WAITING" || st.status === "HOLD")) {
        return { ...st, status: "PENDING" };
      }
      return st;
    });
  }

  const isAllApproved = updatedSteps.every((st) => st.status === "APPROVED");
  const updatedDoc = normalizeApprovalDoc({
    ...target,
    steps: updatedSteps,
    status: isAllApproved ? "APPROVED" : "IN_PROGRESS",
    holdReason: "",
    rejectReason: ""
  });

  return await saveApprovalDocument(updatedDoc);
}

export async function holdDocumentStep(docId, stepIndex, holderName, holdReason) {
  const list = getLocalApprovalDocs();
  const target = list.find((d) => d.id === docId);
  if (!target || !Array.isArray(target.steps)) return list;

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

  const updatedDoc = normalizeApprovalDoc({
    ...target,
    steps: updatedSteps,
    status: "HOLD",
    holdReason: holdReason || "검토 필요로 인한 보류"
  });

  return await saveApprovalDocument(updatedDoc);
}

export async function rejectDocumentStep(docId, stepIndex, rejectorName, rejectReason) {
  const list = getLocalApprovalDocs();
  const target = list.find((d) => d.id === docId);
  if (!target || !Array.isArray(target.steps)) return list;

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

  const updatedDoc = normalizeApprovalDoc({
    ...target,
    steps: updatedSteps,
    status: "REJECTED",
    rejectReason: rejectReason || "반려"
  });

  return await saveApprovalDocument(updatedDoc);
}

// ----------------------------------------------------
// 9. Auto Approval Steps Generator (Fallback)
// ----------------------------------------------------
export function getAutoApprovalSteps(
  plant,
  drafterName,
  drafterTitle,
  department,
  leadName = null,
  ceoName = "대표이사",
  directorName = null,
  docType = null
) {
  const is4M = docType === "FOUR_M_CHANGE_POINT" || docType === "CHANGE_POINT";
  if (is4M) {
    return [
      { role: "담당", name: "이창엽", title: "책임", status: "APPROVED", date: "", comment: "4M 기안 상신" },
      { role: "검토", name: "이명재", title: "이사", status: "PENDING", date: "", comment: "" },
      { role: "승인", name: "권태형", title: "대표이사", status: "WAITING", date: "", comment: "" }
    ];
  }
  return [
    { role: "담당", name: drafterName || "기안자", title: drafterTitle || "선임", status: "APPROVED", date: "", comment: "기안 상신" },
    { role: "책임", name: leadName || (plant === "한림공장" ? "김동욱" : "윤경수"), title: "책임", status: "PENDING", date: "", comment: "" },
    { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
    { role: "대표", name: ceoName === "최미영" ? "최미영" : "권태형", title: ceoName === "최미영" ? "전무" : "대표이사", status: "WAITING", date: "", comment: "" }
  ];
}

// ----------------------------------------------------
// 10. Overtime Reports Synchronization
// ----------------------------------------------------
export async function syncAllOvertimeReportsToApprovalBox() {
  return [];
}

export async function syncPlantOvertimeToApprovalBox(plant, workDate) {
  return [];
}
