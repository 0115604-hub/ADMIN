/**
 * simpleApprovalFlow.js
 * 삼랑진/한림 공장별 특근 및 일반 품의 전용 초경량 결재선 정의 및 승인 로직 (100행 이하)
 */

// 1. 공장 및 문서 분류별 단순 결재선 생성 (단일 원천)
export function createSimpleApprovalSteps({ type, plant, drafter, drafterTitle = "선임", leadName }) {
  const isSamrangjin = plant === "삼랑진공장" || !plant;
  const now = new Date().toISOString().slice(0, 10);

  // ① 4M 변동점 품의서 (3단계)
  if (type === "FOUR_M" || type === "4M변동점") {
    return [
      { role: "기안", name: "이창엽", title: "책임", status: "APPROVED", date: now, comment: "4M 변동점 기안" },
      { role: "검토", name: "이명재", title: "이사", status: "PENDING", date: "", comment: "" },
      { role: "승인", name: "권태형", title: "대표이사", status: "WAITING", date: "", comment: "" }
    ];
  }

  // ② 주말/공휴일 특근보고서 (4단계)
  if (type === "OVERTIME" || type === "특근보고서") {
    const drafterName = drafter || (isSamrangjin ? "조인주" : "오상민");
    const managerName = isSamrangjin ? "윤경수" : "김동욱";
    return [
      { role: "담당", name: drafterName, title: drafterTitle, status: "APPROVED", date: now, comment: "특근보고서 상신" },
      { role: "책임", name: managerName, title: "책임", status: "PENDING", date: "", comment: "" },
      { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
      { role: "대표", name: "권태형", title: "대표이사", status: "WAITING", date: "", comment: "" }
    ];
  }

  // ③ 일반 업무/지출 품의서 (4단계)
  const defaultLead = leadName || (isSamrangjin ? "설유철" : "김동욱");
  return [
    { role: "기안", name: drafter || "기안자", title: drafterTitle, status: "APPROVED", date: now, comment: "품의 상신" },
    { role: "책임", name: defaultLead, title: "책임", status: "PENDING", date: "", comment: "" },
    { role: "이사", name: "이명재", title: "이사", status: "WAITING", date: "", comment: "" },
    { role: "대표", name: "권태형", title: "대표이사", status: "WAITING", date: "", comment: "" }
  ];
}

// 2. 현재 로그인 사용자 승인 권한 단순 체크 (이름 및 직책 1:1 직결)
export function getSimpleApprovalPermission(steps, currentProfile, isAdmin) {
  if (!Array.isArray(steps) || steps.length === 0) return { canApprove: false, stepIndex: -1 };
  const pendingIndex = steps.findIndex((s) => s.status === "PENDING");
  if (pendingIndex === -1) return { canApprove: false, stepIndex: -1 };

  const activeStep = steps[pendingIndex];
  const userName = currentProfile?.name || "";
  const isCeo = userName === "권태형" || userName === "최미영" || currentProfile?.role === "CEO" || isAdmin;

  // 대표이사 전결 또는 단계 결재자 이름 일치
  const isMatch = isCeo || activeStep.name === userName || (activeStep.role === "이사" && userName === "이명재");

  return {
    canApprove: isMatch,
    stepIndex: pendingIndex,
    stepRole: activeStep.role,
    stepName: activeStep.name,
    isCeo
  };
}

// 3. 단계 승인 실행 (직렬 순차 처리)
export function advanceSimpleApprovalStep(steps, stepIndex, approverName, comment = "승인") {
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  const nextSteps = steps.map((s, idx) => {
    if (idx === stepIndex) {
      return { ...s, status: "APPROVED", name: approverName || s.name, date: now, comment };
    }
    if (idx === stepIndex + 1 && s.status === "WAITING") {
      return { ...s, status: "PENDING" };
    }
    return s;
  });

  const isCompleted = nextSteps.every((s) => s.status === "APPROVED");
  return {
    steps: nextSteps,
    status: isCompleted ? "APPROVED" : "IN_PROGRESS",
    currentStep: isCompleted ? nextSteps.length : stepIndex + 2
  };
}
