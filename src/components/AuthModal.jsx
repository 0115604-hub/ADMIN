import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ADMIN_USERS, PLANTS, EXTRUSION_WORKERS } from "../context/AuthContext";
import {
  getAnnualLeaves,
  subscribeAnnualLeaves,
  getUserLeaveStatus
} from "../services/annualLeaveService";
import {
  subscribeSmartOvertimeData,
  getLocalSmartOvertimeData,
  cleanCompanyName,
  normalizeDept
} from "../services/overtimeSmartService";
import { INITIAL_SMART_OVERTIME_DATA } from "../data/masterOvertimeSmartData.js";
import { getKSTDateString, getKSTTimeInfo } from "../utils/dateUtils";
import { useModalHistory } from "../utils/modalHistory";

import { CheckCircle2 } from "lucide-react";
import { WorkerLoginSection } from "./auth/WorkerLoginSection";
import { FieldWorkerLoginPortalSection } from "./auth/FieldWorkerLoginPortalSection";
import { RealtimeIssueBoard } from "./issues/RealtimeIssueBoard";
import { SqStatusBannerCard } from "./sq/SqStatusBannerCard";

import { AuthModalHeaderNav } from "./auth/AuthModalHeaderNav";
import { AuthWorkerSelectModals } from "./auth/modals/AuthWorkerSelectModals";
import { AuthIssueSubModals } from "./auth/modals/AuthIssueSubModals";
import { SqLiveMonitoringModal } from "./auth/modals/SqLiveMonitoringModal";
import { useAuthModalIssues } from "./auth/hooks/useAuthModalIssues";

export const AuthModal = () => {
  // Modal visibility states
  const [isExtrusionModalOpen, setIsExtrusionModalOpen] = useState(false);
  const [isMachiningModalOpen, setIsMachiningModalOpen] = useState(false);
  const [isHanulModalOpen, setIsHanulModalOpen] = useState(false);
  const [isBulimtechModalOpen, setIsBulimtechModalOpen] = useState(false);
  const [isYuseongModalOpen, setIsYuseongModalOpen] = useState(false);
  const [isJoyoungModalOpen, setIsJoyoungModalOpen] = useState(false);
  const [isSqLevelUpModalOpen, setIsSqLevelUpModalOpen] = useState(false);

  // Selected worker state (opens WorkerPinModal)
  const [selectedUser, setSelectedUser] = useState(null);

  // Leaves and Smart Overtime data subscriptions
  const [annualLeaves, setAnnualLeaves] = useState(() => getAnnualLeaves());
  const [smartOvertimeData, setSmartOvertimeData] = useState(() => getLocalSmartOvertimeData());

  useEffect(() => {
    const unsub = subscribeAnnualLeaves((leaves) => setAnnualLeaves(leaves));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeSmartOvertimeData((data) => setSmartOvertimeData(data));
    return () => unsub();
  }, []);

  // Real-time clock tick for date and time calculations (1-minute interval)
  const [currentTimeTick, setCurrentTimeTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeTick((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const todayDateStr = useMemo(() => {
    if (currentTimeTick < 0) return "";
    return getKSTDateString();
  }, [currentTimeTick]);
  const currentKstTimeStr = useMemo(() => {
    if (currentTimeTick < 0) return "";
    const info = getKSTTimeInfo();
    return `${String(info.hour).padStart(2, "0")}:${String(info.minute).padStart(2, "0")}`;
  }, [currentTimeTick]);

  // All workers list for issue management assignment
  const allWorkers = useMemo(() => {
    const list = [];
    if (PLANTS[0]?.workers) {
      PLANTS[0].workers.forEach((w) => list.push({ ...w, plantName: "삼랑진공장" }));
    }
    if (PLANTS[1]?.workers) {
      PLANTS[1].workers.forEach((w) => list.push({ ...w, plantName: "한림공장" }));
    }
    ADMIN_USERS.forEach((adm) => {
      list.push({ ...adm, plantName: "본사", title: adm.title || "대표이사" });
    });
    return list;
  }, []);

  // Master workers source
  const allMasterWorkers = useMemo(() => {
    return (smartOvertimeData?.masterWorkers && smartOvertimeData.masterWorkers.length > 0)
      ? smartOvertimeData.masterWorkers
      : (INITIAL_SMART_OVERTIME_DATA?.masterWorkers || []);
  }, [smartOvertimeData]);

  // 1. 가공동 작업자 (오륙 본사 가공팀)
  const machiningWorkers = useMemo(() => {
    return allMasterWorkers.filter((w) => {
      const comp = cleanCompanyName(w.company);
      if (comp !== "오륙") return false;
      if (w.status === "퇴사") return false;
      const dept = normalizeDept(w.dept);
      const line = String(w.line || "").trim();
      // 압출동 및 관리부(관리자)는 가공동 작업자에서 명확히 제외
      if (
        dept === "압출관리팀" ||
        dept === "관리팀" ||
        line === "압출동" ||
        line === "압출" ||
        line === "코팅" ||
        line === "관리부" ||
        line === "관리자"
      ) {
        return false;
      }
      return (
        dept === "가공관리팀" ||
        dept === "가공동" ||
        dept.includes("가공") ||
        ["JA", "HR", "NX4", "NX4a", "Channel", "JA.HR", "NX4.NX4a", "조인트", "검사", "사상", "소재준비"].includes(line)
      );
    });
  }, [allMasterWorkers]);

  // 2. 한울 (한림공장 가공/협력업체)
  const hanulUser = useMemo(() => {
    return (
      (PLANTS[1]?.workers || []).find((w) => w.name === "한울") || {
        id: "hal_hu",
        name: "한울",
        title: "가공/협력업체",
        dept: "가공팀",
        assignedProcess: "가공동",
        pin: "11",
        isPartner: false,
        plant: "한림공장",
        role: "WORKER"
      }
    );
  }, []);

  const hanulWorkers = useMemo(() => {
    return allMasterWorkers.filter(
      (w) =>
        cleanCompanyName(w.company) === "한울" &&
        (!w.status || w.status !== "퇴사") &&
        w.name !== "황수현"
    );
  }, [allMasterWorkers]);

  // 3. 부림텍 (한림공장 가공/협력업체)
  const bulimtechUser = useMemo(() => {
    return (
      (PLANTS[1]?.workers || []).find((w) => w.name === "부림텍") || {
        id: "hal_br",
        name: "부림텍",
        title: "가공/협력업체",
        dept: "가공팀",
        assignedProcess: "가공동",
        pin: "11",
        isPartner: false,
        plant: "한림공장",
        role: "WORKER"
      }
    );
  }, []);

  const bulimtechWorkers = useMemo(() => {
    return allMasterWorkers.filter(
      (w) =>
        cleanCompanyName(w.company) === "부림텍" &&
        (!w.status || w.status !== "퇴사") &&
        w.name !== "김동훈"
    );
  }, [allMasterWorkers]);

  // 4. 유성 (삼랑진공장 가공/협력업체)
  const yuseongUser = useMemo(() => {
    return (
      (PLANTS[0]?.workers || []).find((w) => w.name === "유성") || {
        id: "sam_ys",
        name: "유성",
        title: "가공/협력업체",
        dept: "가공팀",
        assignedProcess: "가공동",
        pin: "11",
        isPartner: false,
        plant: "삼랑진공장",
        role: "WORKER"
      }
    );
  }, []);

  const yuseongWorkers = useMemo(() => {
    return allMasterWorkers.filter(
      (w) =>
        cleanCompanyName(w.company) === "유성" &&
        (!w.status || w.status !== "퇴사") &&
        w.name !== "이성기"
    );
  }, [allMasterWorkers]);

  // 5. (주)조영 (한림공장)
  const joyoungWorkers = useMemo(() => {
    return allMasterWorkers.filter(
      (w) =>
        cleanCompanyName(w.company) === "조영" &&
        (!w.status || w.status !== "퇴사") &&
        w.name !== "김동욱" &&
        w.name !== "오상민"
    );
  }, [allMasterWorkers]);

  // Plant leave counts
  const samrangjinLeaveCount = useMemo(() => {
    if (!PLANTS[0]?.workers || !annualLeaves) return 0;
    return PLANTS[0].workers.filter((w) =>
      Boolean(getUserLeaveStatus(w.id, w.name, annualLeaves, { excludeTodo: true }))
    ).length;
  }, [annualLeaves]);

  const hanlimLeaveCount = useMemo(() => {
    if (!PLANTS[1]?.workers || !annualLeaves) return 0;
    return PLANTS[1].workers.filter((w) =>
      Boolean(getUserLeaveStatus(w.id, w.name, annualLeaves, { excludeTodo: true }))
    ).length;
  }, [annualLeaves]);

  // Stable callback handlers
  const handleUserClick = useCallback((user) => {
    setSelectedUser(user);
  }, []);

  const handleAdminClick = useCallback(() => {
    setSelectedUser(ADMIN_USERS[0]);
  }, []);

  const handleOpenExtrusion = useCallback(() => setIsExtrusionModalOpen(true), []);
  const handleOpenMachining = useCallback(() => setIsMachiningModalOpen(true), []);
  const handleOpenHanul = useCallback(() => setIsHanulModalOpen(true), []);
  const handleOpenBulimtech = useCallback(() => setIsBulimtechModalOpen(true), []);
  const handleOpenYuseong = useCallback(() => setIsYuseongModalOpen(true), []);
  const handleOpenJoyoung = useCallback(() => setIsJoyoungModalOpen(true), []);
  const handleOpenSqModal = useCallback(() => setIsSqLevelUpModalOpen(true), []);

  // 📢 Issue Management Hook (All issue states, memos, operations, telegram & modal history)
  const issues = useAuthModalIssues({ todayDateStr, currentKstTimeStr, allWorkers });

  // Modal History (Back Button Support) for portals
  useModalHistory(isExtrusionModalOpen, () => setIsExtrusionModalOpen(false), "extrusionModal");
  useModalHistory(isMachiningModalOpen, () => setIsMachiningModalOpen(false), "machiningModal");
  useModalHistory(isHanulModalOpen, () => setIsHanulModalOpen(false), "hanulModal");
  useModalHistory(isBulimtechModalOpen, () => setIsBulimtechModalOpen(false), "bulimtechModal");
  useModalHistory(isYuseongModalOpen, () => setIsYuseongModalOpen(false), "yuseongModal");
  useModalHistory(isJoyoungModalOpen, () => setIsJoyoungModalOpen(false), "joyoungModal");
  useModalHistory(isSqLevelUpModalOpen, () => setIsSqLevelUpModalOpen(false), "sqLevelUpModal");

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-950/85 backdrop-blur-xl animate-fadeIn px-2 sm:px-4 pt-2 sm:pt-6 pb-24 sm:pb-12 flex justify-center items-start min-h-screen max-w-full">
      {/* Background Ambient Glow Orbs */}
      <div className="fixed w-96 h-96 -top-20 -left-20 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed w-96 h-96 -bottom-20 -right-20 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed w-80 h-80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container Card */}
      <div className="bg-white/95 dark:bg-slate-900/90 w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] border border-slate-200/80 dark:border-slate-800 backdrop-blur-2xl overflow-hidden my-auto relative animate-scaleUp min-w-0">
        {/* Top Glowing Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-blue-600 to-emerald-500"></div>

        <div className="p-3 sm:p-5 sm:px-6 pb-8 sm:pb-6">
          {/* Toast Alert */}
          {issues.restoreToast && (
            <div className="fixed top-4 right-4 z-[90] bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce border border-emerald-500/50 backdrop-blur-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold">{issues.restoreToast}</span>
            </div>
          )}

          {/* Header Brand with Clickable Logo for Admin Login */}
          <AuthModalHeaderNav onAdminClick={handleAdminClick} />

          {/* 🌟 생산 전용 로그인 포털 (공장동 및 가공/협력업체 6개사) - 최상단 배치 */}
          <div className="mb-3 sm:mb-3.5">
            <FieldWorkerLoginPortalSection
              onOpenExtrusionModal={handleOpenExtrusion}
              onOpenMachiningModal={handleOpenMachining}
              onOpenHanulModal={handleOpenHanul}
              onOpenBulimtechModal={handleOpenBulimtech}
              onOpenYuseongModal={handleOpenYuseong}
              onOpenJoyoungModal={handleOpenJoyoung}
              extrusionWorkersCount={EXTRUSION_WORKERS.length}
              machiningWorkersCount={machiningWorkers.length}
              hanulWorkersCount={hanulWorkers.length}
              bulimtechWorkersCount={bulimtechWorkers.length}
              yuseongWorkersCount={yuseongWorkers.length}
              joyoungWorkersCount={joyoungWorkers.length}
            />
          </div>

          {/* 🎯 SQ 진행상황 현황표 배너/카드 */}
          <div className="mb-3.5 sm:mb-4">
            <SqStatusBannerCard onOpenSqModal={handleOpenSqModal} />
          </div>

          {/* 📢 1. 실시간 공지 & 오픈이슈 라이브 보드 */}
          <RealtimeIssueBoard
            activeIssues={issues.activeIssues}
            displayedActiveIssues={issues.displayedActiveIssues}
            qualityAlertCount={issues.qualityAlertCount}
            meetingIssuesCount={issues.meetingIssuesCount}
            qualityIssueCount={issues.qualityIssueCount}
            noticeIssuesCount={issues.noticeIssuesCount}
            openIssueCategoryFilter={issues.openIssueCategoryFilter}
            setOpenIssueCategoryFilter={issues.setOpenIssueCategoryFilter}
            isIssueExpanded={issues.isIssueExpanded}
            setIsIssueExpanded={issues.setIsIssueExpanded}
            onOpenListModal={() => {
              issues.setIsListModalOpen(true);
              issues.setSelectedListItem(null);
              issues.setIssueModalPage(1);
            }}
            onOpenNewIssue={issues.handleOpenNewIssue}
            onOpenDeleteModal={issues.handleOpenDeleteModal}
            onSelectCardCategory={(item) => {
              issues.handleOpenActionModal(item);
            }}
          />

          {/* 👤 2. 작업자 로그인 섹션 (삼랑진공장, 한림공장) */}
          <WorkerLoginSection
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            annualLeaves={annualLeaves}
            samrangjinLeaveCount={samrangjinLeaveCount}
            hanlimLeaveCount={hanlimLeaveCount}
            activeIssues={issues.activeIssues}
            urgentIssues={issues.urgentIssues}
            onUserClick={handleUserClick}
          />
        </div>
      </div>

      {/* 🌟 관리목록, 상세, 간편조치, 삭제인증, 텔레그램, 고화질 이미지 모달 일괄 관리 */}
      <AuthIssueSubModals
        {...issues}
        allWorkers={allWorkers}
        todayDateStr={todayDateStr}
      />

      {/* 🏭 공장동/협력업체 6개 작업자 선택 모달 */}
      <AuthWorkerSelectModals
        isExtrusionModalOpen={isExtrusionModalOpen}
        setIsExtrusionModalOpen={setIsExtrusionModalOpen}
        EXTRUSION_WORKERS={EXTRUSION_WORKERS}
        isMachiningModalOpen={isMachiningModalOpen}
        setIsMachiningModalOpen={setIsMachiningModalOpen}
        machiningWorkers={machiningWorkers}
        isHanulModalOpen={isHanulModalOpen}
        setIsHanulModalOpen={setIsHanulModalOpen}
        hanulWorkers={hanulWorkers}
        hanulUser={hanulUser}
        isBulimtechModalOpen={isBulimtechModalOpen}
        setIsBulimtechModalOpen={setIsBulimtechModalOpen}
        bulimtechWorkers={bulimtechWorkers}
        bulimtechUser={bulimtechUser}
        isYuseongModalOpen={isYuseongModalOpen}
        setIsYuseongModalOpen={setIsYuseongModalOpen}
        yuseongWorkers={yuseongWorkers}
        yuseongUser={yuseongUser}
        isJoyoungModalOpen={isJoyoungModalOpen}
        setIsJoyoungModalOpen={setIsJoyoungModalOpen}
        joyoungWorkers={joyoungWorkers}
        handleUserClick={handleUserClick}
      />

      {/* 🎯 SQ Live 모니터링 및 진행현황 모달 */}
      <SqLiveMonitoringModal
        isOpen={isSqLevelUpModalOpen}
        onClose={() => setIsSqLevelUpModalOpen(false)}
      />
    </div>
  );
};

export default AuthModal;
