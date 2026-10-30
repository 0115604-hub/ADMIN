import { ADMIN_TABS } from "../components/Sidebar";
import { isManagerOrAdminUser, isExtrusionWorkerProfile } from "../context/AuthContext";
import { isHanulWorkerProfile } from "../services/hanulQualityIssueService";

/**
 * getTabTitle
 * 현재 선택된 탭과 로그인 프로필에 따른 상단 헤더 타이틀 결정
 */
export function getAppTabTitle(activeTab, currentProfile, isAdmin) {
  const isManager = isManagerOrAdminUser(currentProfile, isAdmin);
  const isExtrusionWorker = isExtrusionWorkerProfile(currentProfile);
  const isHanul = !isExtrusionWorker && isHanulWorkerProfile(currentProfile);
  const isBurimtech =
    !isExtrusionWorker &&
    !isHanul &&
    Boolean(
      currentProfile?.portalType === "bulimtech" ||
        currentProfile?.company === "부림텍" ||
        currentProfile?.name === "부림텍" ||
        String(currentProfile?.id || "").startsWith("hal_br_")
    );

  if (activeTab === "worker_dashboard") {
    if (isAdmin) return "본사 • 총괄 경영 대시보드";
    if (!isManager) {
      if (isExtrusionWorker) return "삼랑진공장 • 압출 작업일보";
      if (isHanul) return "한림공장 • 한울 가공/협력업체 작업일보";
      if (isBurimtech) return "한림공장 • 부림텍 작업일보";
      return "삼랑진공장 • 가공동 작업일보";
    }
    // 관리자별 맞춤 대시보드 타이틀
    if (currentProfile?.name === "설유철" || currentProfile?.id === "sam_yc") {
      return "삼랑진공장 • 압출 생산관리 (설유철 책임)";
    }
    if (currentProfile?.name === "윤경수" || currentProfile?.id === "sam_ks") {
      return "삼랑진공장 • 가공 생산관리 (윤경수 책임)";
    }
    if (currentProfile?.name === "이창엽" || currentProfile?.id === "sam_cy") {
      return "삼랑진공장 • 품질 및 수입검사 (이창엽 책임)";
    }
    if (currentProfile?.name === "조인주" || currentProfile?.id === "sam_ij") {
      return "삼랑진공장 • 근태현황 관리 (조인주 선임)";
    }
    if (currentProfile?.name === "전재율" || currentProfile?.id === "sam_jy") {
      return "삼랑진공장 • 설비보전 관리 (전재율 책임)";
    }
    if (currentProfile?.name === "양인나" || currentProfile?.id === "sam_in") {
      return "삼랑진공장 • 가공 생산관리 (양인나 선임)";
    }
    if (currentProfile?.name === "유동길" || currentProfile?.id === "sam_dg") {
      return "삼랑진공장 • 가공 생산관리 (유동길 선임)";
    }
    if (currentProfile?.name === "이상기" || currentProfile?.id === "sam_sg") {
      return "삼랑진공장 • 품질관리 (이상기 기사)";
    }
    if (currentProfile?.name === "이명재" || currentProfile?.id === "sam_mj") {
      return "삼랑진공장 • 총괄 운영현황 (이명재 이사)";
    }
    if (currentProfile?.name === "김동욱" || currentProfile?.id === "hal_dw") {
      return "한림공장 • 총괄 운영현황 (김동욱 책임)";
    }
    if (currentProfile?.name === "오상민" || currentProfile?.id === "hal_sm") {
      return "한림공장 • 가공 관리현황 (오상민 선임)";
    }
    if (currentProfile?.name === "TEST" || currentProfile?.id === "hal_test") {
      return "한림공장 • TEST 관제 스튜디오 (TEST 선임)";
    }
    return `${currentProfile?.plant || "생산현장"} • ${currentProfile?.name || "관리자"} 대시보드`;
  }

  if (activeTab === "extrusion_downtime") {
    return isExtrusionWorker ? "압출 작업일보" : "압출동 주간 비가동내역";
  }
  if (activeTab === "daily_quality") return "일일 품질현황";
  if (activeTab === "overtime_status") return "근태현황 및 관리";
  if (activeTab === "operator_workspace") return "엑셀 파일 업로드";
  const meta = ADMIN_TABS.find((t) => t.id === activeTab);
  return meta ? meta.label : "현황";
}
