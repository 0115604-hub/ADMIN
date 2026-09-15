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
import { isThisWeek, getThisWeekDateRange } from "../utils/dateUtils";

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

// Initial authoritative approval documents (includes pending overtime reports and active drafts)
export const INITIAL_APPROVAL_DOCS = [
  {
    id: "appr_1788484096588",
    docNumber: "ORYUK-2026-0914-EXP",
    type: "EXPENSE",
    typeName: "설비부품 교체 품의서",
    title: "PU차종 아웃트찬넬 포밍롤 노후 교체 건",
    plant: "삼랑진공장",
    department: "설비보전",
    drafter: "전재율",
    drafterTitle: "책임",
    createdAt: "2026-09-14 08:30",
    content: "PU차종 아웃트찬넬 성형부 3, 4번 포밍롤 마모로 인한 치수 편차 발생 예방을 위해 신규 롤 가공 제작 및 교체를 품의하오니 재가하여 주시기 바랍니다.\n- 공급처: 대명정밀\n- 견적금액: ₩2,400,000",
    amount: "₩2,400,000",
    status: "IN_PROGRESS",
    currentStep: 2,
    steps: [
      { role: "담당", name: "전재율", title: "선임", status: "APPROVED", date: "2026-09-14 08:30", comment: "설비보전 품의 상신" },
      { role: "책임", name: "전재율", title: "책임", status: "PENDING", date: "", comment: "" },
      { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
      { role: "대표", name: "대표이사", title: "대표", status: "WAITING", date: "", comment: "" }
    ],
    rejectReason: "",
    holdReason: ""
  },
  {
    id: "appr_ot_samrangjin_20260912",
    docNumber: "ORYUK-2026-0912-SAM",
    type: "OVERTIME",
    typeName: "특근보고서 (취합)",
    title: "[삼랑진공장] 9월 12일(토) 특근보고서 취합 ((주)오륙)",
    plant: "삼랑진공장",
    department: "생산총괄 ((주)오륙 + 유성)",
    drafter: "양인나",
    drafterTitle: "선임",
    createdAt: "2026-09-12 18:00",
    content: "■ 9월 12일(토) [삼랑진공장] 특근보고서 취합\n\n1. 특근 요약\n• 대상: 삼랑진공장 ((주)오륙)\n• 총 투입: 54명 (443 M/H) | 총 노무비: ₩6,645,000\n\n2. 회사별 세부 투입 현황\n• (주)오륙 (54명)\n  - 관리자: 이명재, 설유철, 윤경수, 이창엽, 전재율\n  - 작업자: 손주희, 이은혜, 김지연, 김미선, 정명순, 서성애, 권순미, 이정임, 한옥주, 서효선 외 39명\n\n3. 주요 작업 내용\n• 현대/기아 긴급 납품 물량 대응 및 삼랑진공장 주말 가동 완료",
    amount: "₩6,645,000",
    status: "IN_PROGRESS",
    currentStep: 2,
    steps: [
      { role: "담당", name: "양인나", title: "선임", status: "APPROVED", date: "2026-09-12 18:00", comment: "특근 취합 기안 상신" },
      { role: "책임", name: "윤경수", title: "책임", status: "PENDING", date: "", comment: "" },
      { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
      { role: "대표", name: "대표이사", title: "대표", status: "WAITING", date: "", comment: "" }
    ],
    rejectReason: "",
    holdReason: ""
  },
  {
    id: "appr_ot_hanlim_20260912",
    docNumber: "ORYUK-2026-0912-HAL",
    type: "OVERTIME",
    typeName: "특근보고서 (취합)",
    title: "[한림공장] 9월 12일(토) 특근보고서 취합 ((주)조영산업, 한울)",
    plant: "한림공장",
    department: "생산총괄 ((주)조영산업 + 한울 + 부림텍)",
    drafter: "오상민",
    drafterTitle: "선임",
    createdAt: "2026-09-12 18:00",
    content: "■ 9월 12일(토) [한림공장] 특근보고서 취합\n\n1. 특근 요약\n• 대상: 한림공장 ((주)조영산업, 한울)\n• 총 투입: 67명 (643 M/H) | 총 노무비: ₩9,645,000\n\n2. 회사별 세부 투입 현황\n• (주)조영산업 (41명)\n  - 관리자: 이명재, 김동욱, 우창용, 오상민\n  - 작업자: 황수현, 박종미, 마이클, 아흐마드, 바하, 알리, 시로즈, 나심, 샤리프, 하산 외 27명\n• 한울 (26명)\n  - 관리자: -\n  - 작업자: 응웬반남, 쩐득토, 레반뚱, 팜반둥, 부이반뚜, 황반타이, 도반히에우, 응웬반롱, 레반득, 팜반훙 외 16명\n\n3. 주요 작업 내용\n• 현대/기아 긴급 납품 물량 대응 및 한림공장 주말 가동 완료",
    amount: "₩9,645,000",
    status: "IN_PROGRESS",
    currentStep: 2,
    steps: [
      { role: "담당", name: "오상민", title: "선임", status: "APPROVED", date: "2026-09-12 18:00", comment: "특근 취합 기안 상신" },
      { role: "책임", name: "김동욱", title: "책임", status: "PENDING", date: "", comment: "" },
      { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
      { role: "대표", name: "대표이사", title: "대표", status: "WAITING", date: "", comment: "" }
    ],
    rejectReason: "",
    holdReason: ""
  },
  {
    id: "appr_ot_hanlim_20260913",
    docNumber: "ORYUK-2026-0913-HAL",
    type: "OVERTIME",
    typeName: "특근보고서 (취합)",
    title: "[한림공장] 9월 13일(일) 특근보고서 취합 ((주)조영산업, 한울)",
    plant: "한림공장",
    department: "생산총괄 ((주)조영산업 + 한울 + 부림텍)",
    drafter: "오상민",
    drafterTitle: "선임",
    createdAt: "2026-09-13 18:00",
    content: "■ 9월 13일(일) [한림공장] 특근보고서 취합\n\n1. 특근 요약\n• 대상: 한림공장 ((주)조영산업, 한울)\n• 총 투입: 15명 (122 M/H) | 총 노무비: ₩1,830,000\n\n2. 회사별 세부 투입 현황\n• (주)조영산업 (9명)\n  - 관리자: 이명재, 김동욱, 우창용, 오상민\n  - 작업자: 황수현, 마이클, 아흐마드, 바하, 알리\n• 한울 (6명)\n  - 관리자: -\n  - 작업자: 응웬반남, 쩐득토, 레반뚱, 팜반둥, 부이반뚜, 황반타이\n\n3. 주요 작업 내용\n• 현대/기아 긴급 납품 물량 대응 및 한림공장 주말 가동 완료",
    amount: "₩1,830,000",
    status: "IN_PROGRESS",
    currentStep: 2,
    steps: [
      { role: "담당", name: "오상민", title: "선임", status: "APPROVED", date: "2026-09-13 18:00", comment: "특근 취합 기안 상신" },
      { role: "책임", name: "김동욱", title: "책임", status: "PENDING", date: "", comment: "" },
      { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
      { role: "대표", name: "대표이사", title: "대표", status: "WAITING", date: "", comment: "" }
    ],
    rejectReason: "",
    holdReason: ""
  },
  {
    id: "appr_ot_samrangjin_20260905",
    docNumber: "ORYUK-2026-0905-SAM",
    type: "OVERTIME",
    typeName: "특근보고서 (결재완료)",
    title: "[삼랑진공장] 9월 5일(토) 특근보고서 취합 ((주)오륙, 유성)",
    plant: "삼랑진공장",
    department: "생산총괄 ((주)오륙 + 유성)",
    drafter: "양인나",
    drafterTitle: "선임",
    createdAt: "2026-09-05 18:00",
    content: "■ 9월 5일(토) [삼랑진공장] 특근보고서 취합\n\n1. 특근 요약\n• 대상: 삼랑진공장 ((주)오륙, 유성)\n• 총 투입: 9명 (82 M/H) | 총 노무비: ₩1,230,000\n\n2. 회사별 세부 투입 현황\n• (주)오륙 (7명)\n  - 관리자: 이명재, 설유철, 윤경수, 이창엽, 전재율\n  - 작업자: 양인나, 이상기\n• 유성 (2명)\n  - 관리자: -\n  - 작업자: 유동길, 조인주\n\n3. 주요 작업 내용\n• 현대 NX4/NX4a 긴급 납품 물량 대응 및 토요 특근 정상 가동",
    amount: "₩1,230,000",
    status: "APPROVED",
    currentStep: 4,
    steps: [
      { role: "담당", name: "양인나", title: "선임", status: "APPROVED", date: "2026-09-05 18:00", comment: "특근 취합 기안 상신" },
      { role: "책임", name: "윤경수", title: "책임", status: "APPROVED", date: "2026-09-06 09:00", comment: "인원 확인 완료" },
      { role: "이사", name: "이명재", title: "이사", status: "APPROVED", date: "2026-09-06 11:30", comment: "공수 검토 승인" },
      { role: "대표", name: "대표이사", title: "대표", status: "APPROVED", date: "2026-09-06 17:00", comment: "최종 승인 완료" }
    ],
    rejectReason: "",
    holdReason: ""
  },
  {
    id: "appr_20260903_001",
    docNumber: "ORYUK-2026-0901",
    type: "OVERTIME",
    typeName: "특근 신청서 (결재완료)",
    title: "9월 1주차 주말 압출 2호기 및 가공 3호기 특근 승인의 건",
    plant: "삼랑진공장",
    department: "생산1팀 (압출)",
    drafter: "설유철",
    drafterTitle: "책임",
    createdAt: "2026-09-03 09:30",
    content: "현대 NX4a 및 JA 차종 긴급 납품 물량 대응을 위해 주말 특근(08:00~17:00, 총 6명)을 신청하오니 재가하여 주시기 바랍니다.",
    amount: "₩1,248,000",
    status: "APPROVED",
    currentStep: 4,
    steps: [
      { role: "담당", name: "설유철", title: "책임", status: "APPROVED", date: "2026-09-03 09:30", comment: "기안 상신" },
      { role: "책임", name: "이창엽", title: "책임", status: "APPROVED", date: "2026-09-03 11:00", comment: "계획 확인" },
      { role: "이사", name: "이명재", title: "이사", status: "APPROVED", date: "2026-09-03 14:20", comment: "승인" },
      { role: "대표", name: "대표이사", title: "대표", status: "APPROVED", date: "2026-09-03 17:00", comment: "재가" }
    ],
    rejectReason: "",
    holdReason: ""
  },
  {
    id: "appr_20260903_002",
    docNumber: "ORYUK-2026-0902",
    type: "LEAVE",
    typeName: "연차/휴가 신청서 (결재완료)",
    title: "정기 연차 휴가 신청의 건 (양인나)",
    plant: "삼랑진공장",
    department: "가공동 관리",
    drafter: "양인나",
    drafterTitle: "선임",
    createdAt: "2026-09-02 14:20",
    content: "개인 사유로 인하여 아래와 같이 연차 휴가를 신청하오니 결재 바랍니다.\n- 일시: 2026년 9월 5일 (금) 1일간\n- 업무 대행자: 유동길 선임",
    amount: "-",
    status: "APPROVED",
    currentStep: 4,
    steps: [
      { role: "담당", name: "양인나", title: "선임", status: "APPROVED", date: "2026-09-02 14:20", comment: "신청 완료" },
      { role: "책임", name: "윤경수", title: "책임", status: "APPROVED", date: "2026-09-02 15:10", comment: "업무대행 확인" },
      { role: "이사", name: "이명재", title: "이사", status: "APPROVED", date: "2026-09-02 17:00", comment: "승인" },
      { role: "대표", name: "대표이사", title: "대표", status: "APPROVED", date: "2026-09-03 09:00", comment: "재가" }
    ],
    rejectReason: "",
    holdReason: ""
  },
  {
    id: "appr_20260903_003",
    docNumber: "ORYUK-2026-0903",
    type: "EXPENSE",
    typeName: "설비부품 구매 품의서 (결재완료)",
    title: "한림공장 CHANNEL 밴딩기 유압 실린더 패킹 교체 구매 건",
    plant: "한림공장",
    department: "가공동 관리",
    drafter: "오상민",
    drafterTitle: "선임",
    createdAt: "2026-09-03 10:15",
    content: "CHANNEL 밴딩 1호기 압력 저하 예방을 위한 유압 실린더 패킹 및 오일 필터 정기 교체 자재 구매 품의입니다.\n- 공급처: 삼우유압\n- 납기: 2026-09-05",
    amount: "₩480,000",
    status: "APPROVED",
    currentStep: 4,
    steps: [
      { role: "담당", name: "오상민", title: "선임", status: "APPROVED", date: "2026-09-03 10:15", comment: "긴급 품의" },
      { role: "책임", name: "김동욱", title: "책임", status: "APPROVED", date: "2026-09-03 11:30", comment: "부품 견적 확인" },
      { role: "이사", name: "이명재", title: "이사", status: "APPROVED", date: "2026-09-03 14:00", comment: "예산 집행 승인" },
      { role: "대표", name: "대표이사", title: "대표", status: "APPROVED", date: "2026-09-03 16:30", comment: "재가" }
    ],
    rejectReason: "",
    holdReason: ""
  },
  {
    id: "appr_approved_20260830_001",
    docNumber: "ORYUK-2026-0830-SAM",
    type: "OVERTIME",
    typeName: "특근보고서 (결재완료)",
    title: "[삼랑진공장] 8월 30일(일) 특근실시보고서 취합 ((주)오륙, 유성)",
    plant: "삼랑진공장",
    department: "생산총괄 ((주)오륙 + 유성)",
    drafter: "양인나",
    drafterTitle: "선임",
    createdAt: "2026-08-30 18:00",
    content: "■ 8월 30일(일) [삼랑진공장] 특근실시보고서 취합\n\n1. 특근 요약\n• 대상: 삼랑진공장 ((주)오륙, 유성)\n• 총 투입: 36명 (288 M/H) | 총 노무비: ₩4,320,000\n\n2. 주요 작업 내용\n• 현대 NX4a 긴급 납품 물량 대응 및 주말 특근 정상 가동 완료\n• 결재선 4단계 전원 승인 완료 (대표이사 최종 재가)",
    amount: "₩4,320,000",
    status: "APPROVED",
    currentStep: 4,
    steps: [
      { role: "담당", name: "양인나", title: "선임", status: "APPROVED", date: "2026-08-30 18:00", comment: "특근 취합 기안 상신" },
      { role: "책임", name: "설유철", title: "책임", status: "APPROVED", date: "2026-08-31 09:10", comment: "현장 인원 확인 이상없음" },
      { role: "이사", name: "이명재", title: "이사", status: "APPROVED", date: "2026-08-31 14:20", comment: "공수 및 비용 검토 승인" },
      { role: "대표", name: "권태형", title: "대표이사", status: "APPROVED", date: "2026-08-31 17:00", comment: "대표이사 최종 결재 승인" }
    ],
    rejectReason: "",
    holdReason: ""
  },
  {
    id: "appr_approved_20260828_002",
    docNumber: "ORYUK-2026-0828-EXP",
    type: "EXPENSE",
    typeName: "자재구매 품의서 (결재완료)",
    title: "압출 1, 2호기 메인 감속기 오일 및 에어필터 정기 교체 자재 구매 품의",
    plant: "삼랑진공장",
    department: "설비보전",
    drafter: "전재율",
    drafterTitle: "책임",
    createdAt: "2026-08-28 11:30",
    content: "설비 예방보전 및 정기점검용 소모자재 구매 품의입니다.\n- 공급처: 대한윤활유\n- 품명: 고점도 기어유 200L 및 에어클리너 8EA\n- 납품 및 교체 완료 예정일: 2026-09-02",
    amount: "₩1,850,000",
    status: "APPROVED",
    currentStep: 4,
    steps: [
      { role: "담당", name: "전재율", title: "선임", status: "APPROVED", date: "2026-08-28 11:30", comment: "품의 상신" },
      { role: "책임", name: "전재율", title: "책임", status: "APPROVED", date: "2026-08-28 13:00", comment: "부품 규격 확인 완료" },
      { role: "이사", name: "이명재", title: "이사", status: "APPROVED", date: "2026-08-28 15:40", comment: "예산 집행 승인" },
      { role: "대표", name: "권태형", title: "대표이사", status: "APPROVED", date: "2026-08-29 10:15", comment: "대표이사 승인 및 발주 재가" }
    ],
    rejectReason: "",
    holdReason: ""
  },
  {
    id: "appr_approved_20260825_003",
    docNumber: "ORYUK-2026-0825-GEN",
    type: "GENERAL",
    typeName: "일반 업무기안 (결재완료)",
    title: "2026년 3분기 공장 안전관리 및 환경개선 종합계획 승인의 건",
    plant: "한림공장",
    department: "총괄관리",
    drafter: "김동욱",
    drafterTitle: "책임",
    createdAt: "2026-08-25 09:00",
    content: "한림공장 작업장 안전 통로 확보, 유해물질 보관함 교체 및 비상소화설비 정기점검 계획을 상신하오니 결재 바랍니다.",
    amount: "₩950,000",
    status: "APPROVED",
    currentStep: 4,
    steps: [
      { role: "담당", name: "김동욱", title: "선임", status: "APPROVED", date: "2026-08-25 09:00", comment: "계획안 상신" },
      { role: "책임", name: "김동욱", title: "책임", status: "APPROVED", date: "2026-08-25 10:30", comment: "현장 점검 완료" },
      { role: "이사", name: "이명재", title: "이사", status: "APPROVED", date: "2026-08-25 14:00", comment: "안전 조치 계획 검토" },
      { role: "대표", name: "권태형", title: "대표이사", status: "APPROVED", date: "2026-08-26 11:00", comment: "대표이사 결재 승인 - 안전 최우선 시공" }
    ],
    rejectReason: "",
    holdReason: ""
  }
];

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
      const v7 = localStorage.getItem("oryuk_approval_documents_v7_clean");
      const v6 = localStorage.getItem("oryuk_approval_documents_v6_kwon_sign");
      if (v7) data = v7;
      else if (v6) data = v6;
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
    // 1. Load initial authoritative docs (excluding permanently deleted IDs)
    INITIAL_APPROVAL_DOCS.forEach((d) => {
      if (!deletedIds.has(d.id) && !isWeekdayAttSynthDoc(d)) {
        docMap.set(d.id, d);
      }
    });

    // 2. Overlay existing stored items (excluding permanently deleted IDs)
    if (Array.isArray(parsed)) {
      parsed.forEach((d) => {
        if (d && d.id && !deletedIds.has(d.id) && !isWeekdayAttSynthDoc(d)) {
          docMap.set(d.id, d);
        }
      });
    }

    const merged = Array.from(docMap.values()).map(normalizeApprovalDoc);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error("Local storage read error for approval documents:", e);
    const deletedIds = getDeletedApprovalIds();
    return INITIAL_APPROVAL_DOCS.filter((d) => !deletedIds.has(d.id) && !isWeekdayAttSynthDoc(d));
  }
};

// Helper: Save local storage
export const saveLocalApprovalDocs = (docs) => {
  try {
    const deletedIds = getDeletedApprovalIds();
    const cleanDocs = docs.filter((d) => d && !deletedIds.has(d.id) && !isWeekdayAttSynthDoc(d));
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

        // ⭐ MERGE Remote Docs with Local Docs so items NEVER flash and vanish
        const localDocs = getLocalApprovalDocs();
        const mergedMap = new Map();

        // 1. Populate all local items first
        localDocs.forEach((d) => {
          if (d && d.id && !deletedIds.has(d.id)) mergedMap.set(d.id, d);
        });

        // 2. Overlay remote items
        remoteDocs.forEach((d) => {
          if (d && d.id && !deletedIds.has(d.id)) {
            mergedMap.set(d.id, d);
          }
        });

        // ⭐ Overtime Approval Deduplication: Ensure strictly ONE document per Plant per Date
        const seenOtKeys = new Set();
        const cleanList = [];
        for (const item of Array.from(mergedMap.values())) {
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
        onUpdate(cleanList);
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
    await setDoc(doc(db, COLLECTION_NAME, id), fullItem);
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
const PLANT_COMPANIES_MAP = {
  "삼랑진공장": ["(주)오륙", "유성"],
  "한림공장": ["(주)조영산업", "한울", "부림텍"]
};

const KNOWN_MANAGERS = [
  "이명재", "설유철", "윤경수", "이창엽", "전재율", "김동욱", "우창용", "오상민", "권태형", "최미영"
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

      // 🧹 1. Clean any duplicate or opposing (ot vs att) approval documents for this plant and date
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

      for (const dup of duplicateDocs) {
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

      const existingDoc = getLocalApprovalDocs().find(d => 
        d.id === canonicalDocId ||
        (d.plant === targetPlant && (d.type === "OVERTIME" || d.type === "ATTENDANCE") && (
          (d.id && d.id.includes(workDateStr.replace(/-/g, "")) && d.id.includes(plantKey)) ||
          (d.docNumber && d.docNumber.includes(`09${String(dayNum).padStart(2, "0")}`) && d.docNumber.includes(targetPlant === "삼랑진공장" ? "SAM" : "HAL")) ||
          (d.title && d.title.includes(`9월 ${dayNum}일`) && d.title.includes(targetPlant))
        ))
      );

      const drafterName = targetPlant === "삼랑진공장" ? "양인나" : "오상민";
      const drafterTitle = "선임";
      const leadName = targetPlant === "한림공장" ? "김동욱" : "윤경수";

      const titleCompList = participatingCompanies.length > 0 ? participatingCompanies : targetCompanies;
      const title = `[${targetPlant}] 9월 ${dayNum}일(${dayLabel}) ${reportCategoryName} 취합 (${titleCompList.join(", ")})`;
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
          { role: "담당", name: drafterName, title: drafterTitle, status: "APPROVED", date: nowStr, comment: draftComment },
          { role: "책임", name: leadName, title: "책임", status: "PENDING", date: "", comment: "" },
          { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
          { role: "대표", name: "대표이사", title: "대표", status: "WAITING", date: "" }
        ];
      }

      const approvalDoc = normalizeApprovalDoc({
        id: canonicalDocId,
        docNumber: `ORYUK-2026-09${String(dayNum).padStart(2, "0")}-${targetPlant === "삼랑진공장" ? "SAM" : "HAL"}`,
        type: docType,
        typeName: docTypeName,
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


