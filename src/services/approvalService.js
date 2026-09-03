import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION_NAME = "approval_documents";
const LOCAL_STORAGE_KEY = "oryuk_approval_documents_v1";

// Initial sample approval documents
export const INITIAL_APPROVAL_DOCS = [
  {
    id: "appr_20260903_001",
    docNumber: "ORYUK-2026-0901",
    type: "OVERTIME",
    typeName: "특근 신청서",
    title: "9월 1주차 주말 압출 2호기 및 가공 3호기 특근 승인의 건",
    plant: "삼랑진공장",
    department: "생산1팀",
    drafter: "방상국",
    drafterTitle: "선임",
    createdAt: "2026-09-03 09:30",
    content: "현대 NX4a 및 JA 차종 긴급 납품 물량 대응을 위해 주말 특근(08:00~17:00, 총 6명)을 신청하오니 재가하여 주시기 바랍니다.",
    amount: "₩1,248,000",
    status: "IN_PROGRESS", // IN_PROGRESS(미결), HOLD(보류), APPROVED(승인완료), REJECTED(반려)
    currentStep: 2, // 1: 담당, 2: 책임, 3: 이사, 4: 대표
    steps: [
      { role: "담당", name: "방상국", title: "선임", status: "APPROVED", date: "2026-09-03 09:30", comment: "기안 상신" },
      { role: "책임", name: "이명재", title: "책임", status: "PENDING", date: "", comment: "" },
      { role: "이사", name: "조인주", title: "이사", status: "WAITING", date: "", comment: "" },
      { role: "대표", name: "대표이사", title: "대표", status: "WAITING", date: "", comment: "" }
    ],
    rejectReason: "",
    holdReason: ""
  },
  {
    id: "appr_20260903_002",
    docNumber: "ORYUK-2026-0902",
    type: "LEAVE",
    typeName: "연차/휴가 신청서",
    title: "정기 연차 휴가 신청의 건 (설유철)",
    plant: "삼랑진공장",
    department: "품질관리팀",
    drafter: "설유철",
    drafterTitle: "책임",
    createdAt: "2026-09-02 14:20",
    content: "개인 사유로 인하여 아래와 같이 연차 휴가를 신청하오니 결재 바랍니다.\n- 일시: 2026년 9월 5일 (금) 1일간\n- 업무 대행자: 방상국 선임",
    amount: "-",
    status: "APPROVED",
    currentStep: 4,
    steps: [
      { role: "담당", name: "설유철", title: "책임", status: "APPROVED", date: "2026-09-02 14:20", comment: "신청 완료" },
      { role: "책임", name: "이명재", title: "책임", status: "APPROVED", date: "2026-09-02 15:10", comment: "업무 대행 확인 승인" },
      { role: "이사", name: "조인주", title: "이사", status: "APPROVED", date: "2026-09-02 16:00", comment: "승인 완료" },
      { role: "대표", name: "대표이사", title: "대표", status: "APPROVED", date: "2026-09-02 17:30", comment: "최종 승인" }
    ],
    rejectReason: "",
    holdReason: ""
  },
  {
    id: "appr_20260903_003",
    docNumber: "ORYUK-2026-0903",
    type: "EXPENSE",
    typeName: "설비부품 구매 품의서",
    title: "한림공장 CHANNEL 밴딩기 유압 실린더 패킹 교체 구매 건",
    plant: "한림공장",
    department: "생산2팀",
    drafter: "우창용",
    drafterTitle: "선임",
    createdAt: "2026-09-03 10:15",
    content: "CHANNEL 밴딩 1호기 압력 저하 예방을 위한 유압 실린더 패킹 및 오일 필터 정기 교체 자재 구매 품의입니다.\n- 공급처: 삼우유압\n- 납기: 2026-09-05",
    amount: "₩480,000",
    status: "IN_PROGRESS",
    currentStep: 2,
    steps: [
      { role: "담당", name: "우창용", title: "선임", status: "APPROVED", date: "2026-09-03 10:15", comment: "긴급 품의" },
      { role: "책임", name: "김동욱", title: "총괄", status: "PENDING", date: "", comment: "" },
      { role: "이사", name: "조인주", title: "이사", status: "WAITING", date: "", comment: "" },
      { role: "대표", name: "대표이사", title: "대표", status: "WAITING", date: "", comment: "" }
    ],
    rejectReason: "",
    holdReason: ""
  }
];

// Helper: Read local storage
export const getLocalApprovalDocs = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_APPROVAL_DOCS));
      return INITIAL_APPROVAL_DOCS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error("Local storage read error for approval documents:", e);
    return INITIAL_APPROVAL_DOCS;
  }
};

// Helper: Save local storage
export const saveLocalApprovalDocs = (docs) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(docs));
  } catch (e) {
    console.error("Local storage write error for approval documents:", e);
  }
};

// Real-time Cloud Synchronization
export const subscribeApprovalDocs = (onUpdate) => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() });
          });
          list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          saveLocalApprovalDocs(list);
          onUpdate(list);
        } else {
          const locals = getLocalApprovalDocs();
          locals.forEach((item) => {
            setDoc(doc(db, COLLECTION_NAME, item.id), item).catch(() => {});
          });
          onUpdate(locals);
        }
      },
      (error) => {
        console.warn("Firestore approval sync warning:", error);
        onUpdate(getLocalApprovalDocs());
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error("subscribeApprovalDocs error:", e);
    onUpdate(getLocalApprovalDocs());
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

  // Find step that is PENDING or HOLD
  const activeStepIdx = docItem.steps.findIndex((st) => st.status === "PENDING" || st.status === "HOLD");
  if (activeStepIdx === -1) {
    return { canApprove: false, reason: "결재 대기 중인 단계가 없습니다." };
  }

  const activeStep = docItem.steps[activeStepIdx];
  const stepRole = activeStep.role; // 담당, 책임, 이사, 대표
  const userName = currentProfile?.name || "";
  const userTitle = currentProfile?.title || "";

  // 1. ADMIN Mode -> Representative (대표이사) Top Authority
  if (isAdmin) {
    return {
      canApprove: true,
      stepIndex: activeStepIdx,
      stepRole,
      isRepresentative: true,
      approverName: "대표이사"
    };
  }

  // 2. Step 1: 담당 (Drafter)
  if (stepRole === "담당") {
    return {
      canApprove: true,
      stepIndex: activeStepIdx,
      stepRole,
      approverName: userName || "담당자"
    };
  }

  // 3. Step 2: 책임 (Plant Lead / Department Head)
  // 삼랑진공장: 이명재, 설유철 / 한림공장: 김동욱
  if (stepRole === "책임") {
    const isLead =
      (docItem.plant === "한림공장" && (userName === "김동욱" || userTitle === "총괄")) ||
      (docItem.plant === "삼랑진공장" && (userName === "이명재" || userName === "설유철" || userTitle === "책임")) ||
      userName === "이명재" ||
      userName === "김동욱" ||
      userName === "설유철" ||
      userName === "조인주";

    if (isLead) {
      return {
        canApprove: true,
        stepIndex: activeStepIdx,
        stepRole,
        approverName: userName
      };
    }
    return {
      canApprove: false,
      reason: `[${docItem.plant} 책임 ${activeStep.name}] 결재 권한이 필요합니다.`
    };
  }

  // 4. Step 3: 이사 (Executive / Director)
  // 조인주 이사
  if (stepRole === "이사") {
    if (userName === "조인주" || userTitle === "이사") {
      return {
        canApprove: true,
        stepIndex: activeStepIdx,
        stepRole,
        approverName: "조인주"
      };
    }
    return {
      canApprove: false,
      reason: "[이사 조인주] 임원 결재 권한이 필요합니다."
    };
  }

  // 5. Step 4: 대표 (CEO / Representative)
  if (stepRole === "대표") {
    if (userTitle === "대표" || userName === "대표이사") {
      return {
        canApprove: true,
        stepIndex: activeStepIdx,
        stepRole,
        isRepresentative: true,
        approverName: "대표이사"
      };
    }
    return {
      canApprove: false,
      reason: "대표이사(ADMIN) 최종 결재 권한이 필요합니다."
    };
  }

  return { canApprove: false, reason: "결재 권한이 없습니다." };
};

// Save or Create an Approval Document (All Workers can draft)
export const saveApprovalDocument = async (docData) => {
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

  const fullItem = {
    ...docData,
    id,
    docNumber: docData.docNumber || `ORYUK-${now.getFullYear()}-${String(Date.now()).slice(-4)}`,
    status: docData.status || "IN_PROGRESS",
    currentStep: docData.currentStep || 2,
    createdAt: docData.createdAt || nowStr,
    rejectReason: docData.rejectReason || "",
    holdReason: docData.holdReason || "",
    steps: docData.steps || [
      { role: "담당", name: docData.drafter, title: docData.drafterTitle || "선임", status: "APPROVED", date: nowStr, comment: "기안 상신" },
      { role: "책임", name: docData.plant === "한림공장" ? "김동욱" : "이명재", title: "책임", status: "PENDING", date: "", comment: "" },
      { role: "이사", name: "조인주", title: "이사", status: "WAITING", date: "", comment: "" },
      { role: "대표", name: "대표이사", title: "대표", status: "WAITING", date: "", comment: "" }
    ]
  };

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
    await setDoc(doc(db, COLLECTION_NAME, id), fullItem);
  } catch (e) {
    console.warn("Firestore save approval document fallback to local:", e);
  }

  return fullItem;
};

// Approve Step
export const approveDocumentStep = async (docId, stepIndex, approverName, comment = "승인") => {
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

  const updatedTarget = {
    ...target,
    steps: updatedSteps,
    currentStep: nextStep,
    status: isAllApproved ? "APPROVED" : "IN_PROGRESS",
    holdReason: ""
  };

  return await saveApprovalDocument(updatedTarget);
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

  const updatedTarget = {
    ...target,
    steps: updatedSteps,
    status: "HOLD",
    holdReason: holdReason || "검토 필요로 인한 보류"
  };

  return await saveApprovalDocument(updatedTarget);
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

  const updatedTarget = {
    ...target,
    steps: updatedSteps,
    status: "REJECTED",
    rejectReason: rejectReason || "보완 필요 반려"
  };

  return await saveApprovalDocument(updatedTarget);
};

// Delete Document
export const deleteApprovalDocument = async (id) => {
  const current = getLocalApprovalDocs();
  const updated = current.filter((d) => d.id !== id);
  saveLocalApprovalDocs(updated);

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (e) {
    console.warn("Firestore delete approval fallback to local:", e);
  }

  return updated;
};
