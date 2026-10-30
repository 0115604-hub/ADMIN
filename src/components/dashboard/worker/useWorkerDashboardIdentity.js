import { useMemo } from "react";
import { isExtrusionWorkerProfile } from "../../../services/extrusionQualityIssueService";
import { isHanulWorkerProfile } from "../../../services/hanulQualityIssueService";
import { isMachiningWorkerProfile } from "../../../services/machiningQualityIssueService";
import { isYuseongWorkerProfile } from "../../../services/yuseongQualityIssueService";
import { getWorkerPersonnelCard, isWorkerManagerRole } from "../../../services/personnelCardService";
import { isManagerOrAdminUser } from "../../../context/AuthContext";

/**
 * useWorkerDashboardIdentity
 * 작업자 및 관리자의 역할, 직책, 소속 공장, 부서, 협력사 여부 등 신원 판별 계산
 */
export function useWorkerDashboardIdentity({ currentProfile, isAdmin }) {
  // Worker Identity & Role calculations
  const isManagerRole = isWorkerManagerRole(currentProfile);
  const workerPlant = currentProfile?.plant || "삼랑진공장";
  const isSamrangjin = workerPlant === "삼랑진공장" || String(currentProfile?.id || "").startsWith("sam_");
  const isHallim = workerPlant === "한림공장" || String(currentProfile?.id || "").startsWith("hal_");
  const workerFullName = currentProfile?.name || "작업자";
  const officialTitle =
    currentProfile?.title ||
    (currentProfile?.name === "공영국"
      ? "대리"
      : ["심임대", "이상은", "박종미", "최현영"].includes(currentProfile?.name)
      ? "반장"
      : currentProfile?.name === "설유철"
      ? "책임"
      : isManagerRole
      ? "반장"
      : "사원");

  const isInjoo = currentProfile?.name === "조인주" || currentProfile?.id === "sam_ij";
  const isJaeyul =
    currentProfile?.name === "전재율" ||
    currentProfile?.id === "sam_jy" ||
    currentProfile?.assignedProcess === "설비보전";
  const isQualityWorker =
    currentProfile?.assignedProcess === "품질관리" ||
    currentProfile?.name === "이창엽" ||
    currentProfile?.name === "이상기" ||
    currentProfile?.id === "sam_cy" ||
    currentProfile?.id === "sam_sg";

  const isExtrusionWorker =
    currentProfile?.name === "설유철" ||
    currentProfile?.id === "sam_yc" ||
    isExtrusionWorkerProfile(currentProfile);

  // 한울 관리자
  const isHanulManager = Boolean(
    currentProfile?.name === "한울" ||
      currentProfile?.id === "hal_hu" ||
      currentProfile?.name === "황수현" ||
      String(currentProfile?.id || "").startsWith("hal_hu") ||
      (!currentProfile?.isFieldWorker &&
        (currentProfile?.company?.includes("한울") || currentProfile?.company === "한울"))
  );

  // 한울 전체 (관리자 + 작업자)
  const isHanul =
    isHanulManager ||
    Boolean(
      !isExtrusionWorker &&
        (currentProfile?.company?.includes("한울") ||
          currentProfile?.company === "한울" ||
          currentProfile?.name === "한울" ||
          String(currentProfile?.id || "").startsWith("hal_hu") ||
          isHanulWorkerProfile(currentProfile))
    );

  // 부림텍 관리자
  const isBurimtechManager = Boolean(
    currentProfile?.name === "부림텍" ||
      currentProfile?.id === "hal_br" ||
      currentProfile?.name === "김동훈" ||
      (!currentProfile?.isFieldWorker &&
        (currentProfile?.company?.includes("부림") || currentProfile?.company === "부림텍"))
  );

  const isBurimtech =
    isBurimtechManager ||
    Boolean(
      !isExtrusionWorker &&
        !isHanul &&
        (currentProfile?.portalType === "bulimtech" ||
          currentProfile?.company?.includes("부림") ||
          currentProfile?.name === "부림텍" ||
          currentProfile?.name === "김동훈" ||
          String(currentProfile?.id || "").startsWith("hal_br_"))
    );

  // 유성 관리자
  const isYuseongManager = Boolean(
    currentProfile?.name === "유성" ||
      currentProfile?.id === "sam_ys" ||
      currentProfile?.name === "이성기" ||
      (!currentProfile?.isFieldWorker &&
        (currentProfile?.company?.includes("유성") || currentProfile?.company === "유성"))
  );

  // 협력사 대표/관리자 판별
  const isPartnerProfile = Boolean(
    isHanulManager ||
      isBurimtechManager ||
      isYuseongManager ||
      (!currentProfile?.isFieldWorker &&
        (currentProfile?.isPartner ||
          currentProfile?.name === "유성" ||
          currentProfile?.name === "한울" ||
          currentProfile?.name === "부림텍" ||
          currentProfile?.company === "유성" ||
          currentProfile?.company === "한울" ||
          currentProfile?.company === "부림텍" ||
          (!String(currentProfile?.id || "").includes("_") &&
            (currentProfile?.company === "유성" ||
              currentProfile?.company === "한울" ||
              currentProfile?.company === "부림텍"))))
  );

  const assignedProcess =
    currentProfile?.assignedProcess ||
    (currentProfile?.building === "압출동"
      ? "압출"
      : isExtrusionWorker
      ? "압출"
      : isHanul
      ? "가공/협력업체 (한울)"
      : isBurimtech
      ? "가공/협력업체 (부림텍)"
      : isPartnerProfile
      ? "가공/협력업체"
      : "가공");

  const workerCard = useMemo(() => {
    return getWorkerPersonnelCard(currentProfile || {});
  }, [currentProfile]);

  const isJaeyulWorker =
    isJaeyul || currentProfile?.name === "전재율" || currentProfile?.assignedProcess === "설비보전";
  const isHeadquarterUser =
    isAdmin ||
    currentProfile?.role === "ADMIN" ||
    currentProfile?.name === "권태형" ||
    currentProfile?.name === "최미영" ||
    currentProfile?.plant === "본사";

  const isMyeongjae = currentProfile?.name === "이명재" || currentProfile?.id === "sam_mj";
  const isDongwook = currentProfile?.name === "김동욱" || currentProfile?.id === "hal_dw";
  const isGeneralManager =
    isMyeongjae || isDongwook || isAdmin || currentProfile?.assignedProcess === "총괄관리";

  const workerDept = isPartnerProfile
    ? currentProfile?.name || currentProfile?.company || "유성"
    : isHeadquarterUser
    ? "본사 관리팀"
    : isGeneralManager ||
      isInjoo ||
      currentProfile?.assignedProcess === "총괄관리" ||
      currentProfile?.assignedProcess === "관리팀"
    ? "관리팀"
    : isJaeyulWorker
    ? "설비보전팀"
    : isQualityWorker
    ? "품질관리팀"
    : isExtrusionWorker
    ? "압출관리팀"
    : workerCard?.dept || "생산팀";

  const workerPosition = isPartnerProfile
    ? "대표이사"
    : officialTitle || workerCard?.position || "사원";
  const isManagerOrAdmin = isManagerOrAdminUser(currentProfile, isAdmin);
  const isExtrusionWorkerOnly = isExtrusionWorkerProfile(currentProfile);

  // Operator Worker Role Bools
  const isExtrusionOperatorWorker =
    isExtrusionWorkerProfile(currentProfile) &&
    currentProfile?.name !== "설유철" &&
    currentProfile?.id !== "sam_yc" &&
    !isAdmin;

  const isHanulOperatorWorker =
    Boolean(currentProfile?.isFieldWorker) &&
    isHanulWorkerProfile(currentProfile) &&
    !isAdmin;

  const isMachiningOperatorWorker =
    Boolean(currentProfile?.isFieldWorker) &&
    isMachiningWorkerProfile(currentProfile) &&
    !isAdmin;

  const isYuseongOperatorWorker =
    Boolean(currentProfile?.isFieldWorker) &&
    isYuseongWorkerProfile(currentProfile) &&
    !isAdmin;

  const isOperatorWorker =
    isExtrusionOperatorWorker ||
    isHanulOperatorWorker ||
    isMachiningOperatorWorker ||
    isYuseongOperatorWorker;

  return {
    isManagerRole,
    workerPlant,
    isSamrangjin,
    isHallim,
    workerFullName,
    officialTitle,
    isInjoo,
    isJaeyul,
    isQualityWorker,
    isExtrusionWorker,
    isHanulManager,
    isHanul,
    isBurimtechManager,
    isBurimtech,
    isYuseongManager,
    isPartnerProfile,
    assignedProcess,
    workerCard,
    isJaeyulWorker,
    isHeadquarterUser,
    isMyeongjae,
    isDongwook,
    isGeneralManager,
    workerDept,
    workerPosition,
    isManagerOrAdmin,
    isExtrusionWorkerOnly,
    isExtrusionOperatorWorker,
    isHanulOperatorWorker,
    isMachiningOperatorWorker,
    isYuseongOperatorWorker,
    isOperatorWorker
  };
}
