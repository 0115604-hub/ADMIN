import {
  collection,
  doc,
  setDoc,
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

const COLLECTION_NAME = "approval_documents";
const LOCAL_STORAGE_KEY = "oryuk_approval_documents_v2";

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
    { name: "대표이사", title: "대표", plant: "본사", process: "대표이사" }
  ]
};

// Clean and Normalize Document: ensure role '이사' is always '이명재'
export const normalizeApprovalDoc = (d) => {
  if (!d || !d.steps) return d;
  const fixedSteps = d.steps.map((st) => {
    if (st.role === "이사") {
      return {
        ...st,
        name: "이명재",
        title: "이사"
      };
    }
    return st;
  });
  return { ...d, steps: fixedSteps };
};

// Generate Auto Approval Steps (담당: 전작업자, 책임: 책임 직급, 이사: 이명재 이사, 대표: 대표이사)
export const getAutoApprovalSteps = (plant, drafterName, drafterTitle, process, selectedLeadName) => {
  const now = new Date();
  const nowStr = now.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/\. /g, "-").replace(/\./g, "");

  let leadName = selectedLeadName;
  if (!leadName) {
    if (plant === "한림공장") {
      leadName = "김동욱";
    } else {
      if (process?.includes("품질")) {
        leadName = "이창엽";
      } else if (process?.includes("설비")) {
        leadName = "전재율";
      } else if (process?.includes("가공")) {
        leadName = "윤경수";
      } else {
        leadName = "설유철";
      }
    }
  }

  return [
    {
      role: "담당",
      name: drafterName || "작업자",
      title: drafterTitle || "선임",
      status: "APPROVED",
      date: nowStr,
      comment: "기안 상신"
    },
    {
      role: "책임",
      name: leadName || (plant === "한림공장" ? "김동욱" : "설유철"),
      title: "책임",
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
      name: "대표이사",
      title: "대표",
      status: "WAITING",
      date: "",
      comment: ""
    }
  ];
};

// Initial sample approval documents (All with 이명재 이사)
export const INITIAL_APPROVAL_DOCS = [
  {
    id: "appr_ot_samrangjin_20260905",
    docNumber: "ORYUK-2026-0905-SAM",
    type: "OVERTIME",
    typeName: "특근보고서 (취합)",
    title: "[삼랑진공장] 9월 5일(토) 특근보고서 취합 ((주)오륙, 유성)",
    plant: "삼랑진공장",
    department: "생산총괄 ((주)오륙 + 유성)",
    drafter: "양인나",
    drafterTitle: "선임",
    createdAt: "2026-09-05 18:00",
    content: "■ 9월 5일(토) [삼랑진공장] 특근보고서 취합\n\n1. 특근 요약\n• 대상: 삼랑진공장 ((주)오륙, 유성)\n• 총 투입: 40명 (382 M/H) | 총 노무비: ₩5,730,000\n\n2. 회사별 세부 투입 현황 (근로자 명단)\n• (주)오륙 (38명): 손선희, 이영숙, 양인순, 박순복, 이상은, 지미, 이수루, 코팅준, 쏘달, 롬나차이, 마리오, 제랄드, 팔라, 누리, 데란스, 포티퐁, 린, 넷플림, 제인, 그레이스, 수베트, 치찬, 콩지, 케넷, 버나드, 돈돈, 알라딘, 롤란도, 김순미, 김상아, 김윤자, 김현희, 이창엽, 전재율, 양인나, 이명재, 설유철, 윤경수\n• 유성 (2명): 유동길, 조인주\n\n3. 주요 작업 내용\n• 현대 NX4/NX4a 긴급 납품 물량 대응 및 토요 특근 정상 가동",
    amount: "₩5,730,000",
    status: "IN_PROGRESS",
    currentStep: 2,
    steps: [
      { role: "담당", name: "양인나", title: "선임", status: "APPROVED", date: "2026-09-05 18:00", comment: "특근 취합 기안 상신" },
      { role: "책임", name: "윤경수", title: "책임", status: "PENDING", date: "", comment: "" },
      { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
      { role: "대표", name: "대표이사", title: "대표", status: "WAITING", date: "", comment: "" }
    ],
    rejectReason: "",
    holdReason: ""
  },
  {
    id: "appr_20260903_001",
    docNumber: "ORYUK-2026-0901",
    type: "OVERTIME",
    typeName: "특근 신청서",
    title: "9월 1주차 주말 압출 2호기 및 가공 3호기 특근 승인의 건",
    plant: "삼랑진공장",
    department: "생산1팀 (압출)",
    drafter: "방상국",
    drafterTitle: "선임",
    createdAt: "2026-09-03 09:30",
    content: "현대 NX4a 및 JA 차종 긴급 납품 물량 대응을 위해 주말 특근(08:00~17:00, 총 6명)을 신청하오니 재가하여 주시기 바랍니다.",
    amount: "₩1,248,000",
    status: "IN_PROGRESS",
    currentStep: 2,
    steps: [
      { role: "담당", name: "방상국", title: "선임", status: "APPROVED", date: "2026-09-03 09:30", comment: "기안 상신" },
      { role: "책임", name: "설유철", title: "책임", status: "PENDING", date: "", comment: "" },
      { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
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
    title: "정기 연차 휴가 신청의 건 (양인나)",
    plant: "삼랑진공장",
    department: "가공동 관리",
    drafter: "양인나",
    drafterTitle: "선임",
    createdAt: "2026-09-02 14:20",
    content: "개인 사유로 인하여 아래와 같이 연차 휴가를 신청하오니 결재 바랍니다.\n- 일시: 2026년 9월 5일 (금) 1일간\n- 업무 대행자: 방상국 선임",
    amount: "-",
    status: "APPROVED",
    currentStep: 4,
    steps: [
      { role: "담당", name: "양인나", title: "선임", status: "APPROVED", date: "2026-09-02 14:20", comment: "신청 완료" },
      { role: "책임", name: "윤경수", title: "책임", status: "APPROVED", date: "2026-09-02 15:10", comment: "업무 대행 확인 승인" },
      { role: "이사", name: "이명재", title: "이사", status: "APPROVED", date: "2026-09-02 16:00", comment: "승인 완료" },
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
    department: "가공동 관리",
    drafter: "우창용",
    drafterTitle: "선임",
    createdAt: "2026-09-03 10:15",
    content: "CHANNEL 밴딩 1호기 압력 저하 예방을 위한 유압 실린더 패킹 및 오일 필터 정기 교체 자재 구매 품의입니다.\n- 공급처: 삼우유압\n- 납기: 2026-09-05",
    amount: "₩480,000",
    status: "IN_PROGRESS",
    currentStep: 2,
    steps: [
      { role: "담당", name: "우창용", title: "선임", status: "APPROVED", date: "2026-09-03 10:15", comment: "긴급 품의" },
      { role: "책임", name: "김동욱", title: "책임", status: "PENDING", date: "", comment: "" },
      { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
      { role: "대표", name: "대표이사", title: "대표", status: "WAITING", date: "", comment: "" }
    ],
    rejectReason: "",
    holdReason: ""
  }
];

// Helper: Read local storage with normalization
export const getLocalApprovalDocs = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_APPROVAL_DOCS));
      return INITIAL_APPROVAL_DOCS;
    }
    const parsed = JSON.parse(data);
    return parsed.map(normalizeApprovalDoc);
  } catch (e) {
    console.error("Local storage read error for approval documents:", e);
    return INITIAL_APPROVAL_DOCS;
  }
};

// Helper: Save local storage
export const saveLocalApprovalDocs = (docs) => {
  try {
    const normalized = docs.map(normalizeApprovalDoc);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
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
            const rawDoc = { id: d.id, ...d.data() };
            const normalized = normalizeApprovalDoc(rawDoc);
            list.push(normalized);

            // If remote doc had wrong director name, quietly sync correction to Firestore
            const directorStep = rawDoc.steps?.find((st) => st.role === "이사");
            if (directorStep && directorStep.name !== "이명재") {
              setDoc(doc(db, COLLECTION_NAME, d.id), normalized).catch(() => {});
            }
          });

          // ⭐ Overtime Approval Deduplication: Ensure strictly ONE document per Plant per Date
          const seenOtKeys = new Set();
          const cleanList = [];
          for (const item of list) {
            if (item.type === "OVERTIME") {
              const dateMatch = (item.title || "").match(/(\d{1,2})월\s*(\d{1,2})일/) || (item.docNumber || "").match(/09\d{2}/) || (item.id || "").match(/2026\d{4}/);
              const dateKey = dateMatch ? dateMatch[0] : item.createdAt?.slice(0, 10) || item.id;
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
          onUpdate(cleanList);
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

  // 5. Step 4: 대표 (대표이사)
  if (stepRole === "대표") {
    if (userTitle === "대표" || userName === "대표이사" || isAdmin) {
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
    await setDoc(doc(db, COLLECTION_NAME, id), fullItem);
  } catch (e) {
    console.warn("Firestore save approval document fallback to local:", e);
  }

  // Telegram alert on new draft submission
  if (existingIdx < 0) {
    sendApprovalDraftTelegram(fullItem).catch((err) => {
      console.warn("Telegram draft alert error:", err);
    });
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

  const updatedTarget = normalizeApprovalDoc({
    ...target,
    steps: updatedSteps,
    currentStep: nextStep,
    status: isAllApproved ? "APPROVED" : "IN_PROGRESS",
    holdReason: ""
  });

  const saved = await saveApprovalDocument(updatedTarget);

  // Telegram notification on step approval
  sendApprovalStepTelegram(updatedTarget, approverName, comment, isAllApproved).catch((err) => {
    console.warn("Telegram approval step alert error:", err);
  });

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

// ⭐ 공장별 소속 협력사 특근보고서 결재함 자동 취합 및 등록 연동 (Plant-Level Weekend Overtime Approval Synthesis)
// 삼랑진공장: (주)오륙, 유성 취합 ➔ 결재함 자동 등록
// 한림공장: (주)조영산업, 한울, 부림텍 취합 ➔ 결재함 자동 등록
const PLANT_COMPANIES_MAP = {
  "삼랑진공장": ["(주)오륙", "유성"],
  "한림공장": ["(주)조영산업", "한울", "부림텍"]
};

export const syncPlantOvertimeToApprovalBox = async ({
  plant = null,
  company = null,
  workDate = null,
  matrix = null,
  reports = null
} = {}) => {
  try {
    // 1. Determine target plants to aggregate
    let targetPlants = [];
    if (plant === "삼랑진공장" || company === "(주)오륙" || company === "유성") {
      targetPlants = ["삼랑진공장"];
    } else if (plant === "한림공장" || company === "(주)조영산업" || company === "한울" || company === "부림텍") {
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
    const dayLabel = dayOfWeekNames[dt.getDay()] || "토";

    let allReports = Array.isArray(reports) && reports.length > 0 ? reports : [];
    if (allReports.length === 0 && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("official_overtime_reports_store_v7_company_reports");
        if (raw) allReports = JSON.parse(raw);
      } catch (e) {}
    }

    let allMatrix = Array.isArray(matrix) && matrix.length > 0 ? matrix : [];
    if (allMatrix.length === 0 && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("oryuk_smart_overtime_data_store_v10_company_separated");
        if (raw) {
          const parsed = JSON.parse(raw);
          allMatrix = parsed.attendanceMatrix || [];
        }
      } catch (e) {}
    }

    const nowStr = new Date().toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).replace(/\. /g, "-").replace(/\./g, "");

    const currentApprovalDocs = getLocalApprovalDocs();
    const syncedDocs = [];

    for (const targetPlant of targetPlants) {
      const targetCompanies = PLANT_COMPANIES_MAP[targetPlant] || [];
      const plantKey = targetPlant === "삼랑진공장" ? "samrangjin" : "hanlim";
      const canonicalDocId = `appr_ot_${plantKey}_${workDateStr.replace(/-/g, "")}`;

      // 🧹 1. Clean any duplicate overtime approval documents for this plant and date
      const duplicateDocs = currentApprovalDocs.filter(d => 
        d.id !== canonicalDocId &&
        d.type === "OVERTIME" &&
        d.plant === targetPlant &&
        (
          (d.id && d.id.includes(workDateStr.replace(/-/g, "")) && d.id.includes(plantKey)) ||
          (d.docNumber && d.docNumber.includes(`09${String(dayNum).padStart(2, "0")}`) && d.docNumber.includes(targetPlant === "삼랑진공장" ? "SAM" : "HAL")) ||
          (d.title && d.title.includes(`9월 ${dayNum}일`) && d.title.includes(targetPlant))
        )
      );

      for (const dup of duplicateDocs) {
        await deleteApprovalDocument(dup.id);
      }

      // Filter reports for this plant and date
      const plantReports = allReports.filter(r => 
        (r.plant === targetPlant || targetCompanies.includes(r.company)) && 
        (r.workDate === workDateStr || (r.workDate && r.workDate.endsWith(String(dayNum).padStart(2, "0"))))
      );

      // Aggregate data per company
      const companySummaries = [];
      let totalPlantWorkers = 0;
      let totalPlantHours = 0;
      let totalPlantCost = 0;
      const participatingCompanies = [];

      targetCompanies.forEach(comp => {
        // 1. Check if individual report exists
        const compRep = plantReports.find(r => r.company === comp || (Array.isArray(r.companies) && r.companies.includes(comp)));
        
        // 2. Check matrix
        const compWorkers = allMatrix.filter(w => w.company === comp);
        const attendedMatrixWorkers = compWorkers.filter(w => {
          const val = w.daily ? w.daily[dayNum] : "";
          if (!val || val === "-" || val === "휴" || val === "공" || val === "연" || val === "반" || val === "조" || val === "지" || val === "무") return false;
          return true;
        });

        let workerCount = 0;
        let workerHours = 0;
        let workerCost = 0;
        let workerNamesList = [];

        if (compRep) {
          workerCount = compRep.totalWorkers || (compRep.items ? compRep.items.length : 0);
          workerHours = compRep.totalHours || (compRep.items ? compRep.items.reduce((s, it) => s + (Number(it.hours) || 0) * (Number(it.count) || 1), 0) : 0);
          workerCost = compRep.cost || (workerHours * 15000);
          
          if (compRep.items && compRep.items.length > 0) {
            compRep.items.forEach(it => {
              if (it.workerName) {
                workerNamesList.push(it.workerName);
              } else if (it.names) {
                const parts = String(it.names).split(",").map(n => n.replace(/외 \d+명/g, "").trim()).filter(Boolean);
                workerNamesList.push(...parts);
              }
            });
          }
        }
        
        if (workerNamesList.length === 0 && attendedMatrixWorkers.length > 0) {
          workerCount = attendedMatrixWorkers.length;
          workerHours = attendedMatrixWorkers.reduce((sum, w) => {
            const val = w.daily ? w.daily[dayNum] : "";
            const num = Number(val);
            if (!isNaN(num) && num > 0) return sum + num;
            return sum + (val === "🟢" ? 8 : 8);
          }, 0);
          workerCost = workerHours * 15000;
          workerNamesList = attendedMatrixWorkers.map(w => w.name).filter(Boolean);
        }

        // Clean & Deduplicate worker names
        const uniqueWorkerNames = Array.from(new Set(workerNamesList));

        if (workerCount > 0 || compRep) {
          participatingCompanies.push(comp);
          companySummaries.push({
            company: comp,
            workerCount,
            workerHours,
            workerCost,
            workerNames: uniqueWorkerNames.length > 0 ? uniqueWorkerNames : ["작업자 등록 완료"]
          });
          totalPlantWorkers += workerCount;
          totalPlantHours += workerHours;
          totalPlantCost += workerCost;
        }
      });

      const existingDoc = getLocalApprovalDocs().find(d => d.id === canonicalDocId);

      // If no workers and no reports for this plant on this date:
      if (totalPlantWorkers === 0 && plantReports.length === 0) {
        if (existingDoc) {
          // If all reports were deleted, remove the approval document
          await deleteApprovalDocument(canonicalDocId);
        }
        continue;
      }

      const drafterName = targetPlant === "삼랑진공장" ? "양인나" : "송원호";
      const drafterTitle = targetPlant === "삼랑진공장" ? "선임" : "담당";
      const leadName = targetPlant === "한림공장" ? "김동욱" : "윤경수";

      const titleCompList = participatingCompanies.length > 0 ? participatingCompanies : targetCompanies;
      const title = `[${targetPlant}] 9월 ${dayNum}일(${dayLabel}) 특근보고서 취합 (${titleCompList.join(", ")})`;
      const department = targetPlant === "삼랑진공장"
        ? "생산총괄 ((주)오륙 + 유성)"
        : "생산총괄 ((주)조영산업 + 한울 + 부림텍)";

      // ⭐ 세부투입현황: 이름으로 간략하게 표시
      const breakdownText = companySummaries.map(cs => 
        `• ${cs.company} (${cs.workerCount}명): ${cs.workerNames.join(", ")}`
      ).join("\n");

      // ⭐ 초간결 특근 취합 결재 문서 내용
      const content = `■ 9월 ${dayNum}일(${dayLabel}) [${targetPlant}] 특근보고서 취합

1. 특근 요약
• 대상: ${targetPlant} (${targetCompanies.join(", ")})
• 총 투입: ${totalPlantWorkers}명 (${totalPlantHours} M/H) | 총 노무비: ₩${totalPlantCost.toLocaleString()}

2. 세부 투입 현황 (근로자 명단)
${breakdownText || "• 등록된 근로자 명단 취합 완료"}

3. 주요 작업 내용
• 현대/기아 긴급 납품 물량 대응 및 ${targetPlant} 주말 가동 완료`;

      // Build or preserve steps
      let steps;
      if (existingDoc && existingDoc.steps && existingDoc.steps.length === 4) {
        steps = existingDoc.steps.map(st => {
          if (st.role === "이사") {
            return { ...st, name: "이명재", title: "이사" };
          }
          return st;
        });
      } else {
        steps = [
          { role: "담당", name: drafterName, title: drafterTitle, status: "APPROVED", date: nowStr, comment: "특근 취합 기안 상신" },
          { role: "책임", name: leadName, title: "책임", status: "PENDING", date: "", comment: "" },
          { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
          { role: "대표", name: "대표이사", title: "대표", status: "WAITING", date: "", comment: "" }
        ];
      }

      const approvalDoc = normalizeApprovalDoc({
        id: canonicalDocId,
        docNumber: `ORYUK-2026-09${String(dayNum).padStart(2, "0")}-${targetPlant === "삼랑진공장" ? "SAM" : "HAL"}`,
        type: "OVERTIME",
        typeName: "특근보고서 (취합)",
        title,
        plant: targetPlant,
        department,
        drafter: drafterName,
        drafterTitle,
        createdAt: existingDoc?.createdAt || nowStr,
        content,
        amount: `₩${totalPlantCost.toLocaleString()}`,
        status: existingDoc?.status || "IN_PROGRESS",
        currentStep: existingDoc?.currentStep || 2,
        steps,
        rejectReason: existingDoc?.rejectReason || "",
        holdReason: existingDoc?.holdReason || ""
      });

      const saved = await saveApprovalDocument(approvalDoc);
      syncedDocs.push(saved);
    }

    return syncedDocs;
  } catch (err) {
    console.error("syncPlantOvertimeToApprovalBox error:", err);
    return [];
  }
};

