import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { useAuth, ADMIN_USERS, PLANTS, EXTRUSION_WORKERS } from "../context/AuthContext";
import {
  getAnnualLeaves,
  subscribeAnnualLeaves,
  getUserLeaveStatus
} from "../services/annualLeaveService";
import {
  COMPANIES,
  subscribeSmartOvertimeData,
  getLocalSmartOvertimeData
} from "../services/overtimeSmartService";
import { INITIAL_SMART_OVERTIME_DATA } from "../data/masterOvertimeSmartData.js";
import { getKSTDateString, getKSTTimeInfo } from "../utils/dateUtils";
import { useModalHistory } from "../utils/modalHistory";
import { saveExtrusionReport } from "../services/extrusionProductionService";

import { CheckCircle2 } from "lucide-react";
import { WorkerLoginSection } from "./auth/WorkerLoginSection";
import { FieldWorkerLoginPortalSection } from "./auth/FieldWorkerLoginPortalSection";
import { RealtimeIssueBoard } from "./issues/RealtimeIssueBoard";
import { SevereDisasterModal } from "./common/SevereDisasterModal";
import { SqStatusBannerCard } from "./sq/SqStatusBannerCard";

import { AuthModalHeaderNav } from "./auth/AuthModalHeaderNav";
import { AuthWorkerSelectModals } from "./auth/modals/AuthWorkerSelectModals";
import { AuthIssueSubModals } from "./auth/modals/AuthIssueSubModals";
import { SqLiveMonitoringModal } from "./auth/modals/SqLiveMonitoringModal";
import { useAuthModalIssues } from "./auth/hooks/useAuthModalIssues";

// Lazy-loaded On-Demand Sub-Modals
const HanulWorkReportModal = lazy(() => import("./HanulWorkReportModal").then(m => ({ default: m.HanulWorkReportModal || m.default })));
const ExtrusionWorkReportModal = lazy(() => import("./extrusion/ExtrusionWorkReportModal").then(m => ({ default: m.ExtrusionWorkReportModal || m.default })));

export const AuthModal = () => {
  const { currentProfile, loginWithProfile } = useAuth();
  const [factoryBuildingTab, setFactoryBuildingTab] = useState(() => {
    try {
      return localStorage.getItem("oryuk_firstpage_building_tab") || "extrusion";
    } catch (e) {
      return "extrusion";
    }
  });

  const [isSevereDisasterModalOpen, setIsSevereDisasterModalOpen] = useState(false);
  const [isExtrusionReportModalOpen, setIsExtrusionReportModalOpen] = useState(false);
  const [isExtrusionModalOpen, setIsExtrusionModalOpen] = useState(false);
  const [isMachiningModalOpen, setIsMachiningModalOpen] = useState(false);
  const [isHanulModalOpen, setIsHanulModalOpen] = useState(false);
  const [isBulimtechModalOpen, setIsBulimtechModalOpen] = useState(false);
  const [isYuseongModalOpen, setIsYuseongModalOpen] = useState(false);
  const [isJoyoungModalOpen, setIsJoyoungModalOpen] = useState(false);
  const [isHanulWorkReportModalOpen, setIsHanulWorkReportModalOpen] = useState(false);
  const [isSqLevelUpModalOpen, setIsSqLevelUpModalOpen] = useState(false);
  const [hanulWorkReportProject, setHanulWorkReportProject] = useState("9BQC");
  const [hanulWorkReportWorker, setHanulWorkReportWorker] = useState("박종미");
  const [firstPageToast, setFirstPageToast] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Save factoryBuildingTab to localStorage
  useEffect(() => {
    try {
      if (factoryBuildingTab) {
        localStorage.setItem("oryuk_firstpage_building_tab", factoryBuildingTab);
      }
    } catch (e) {}
  }, [factoryBuildingTab]);

  const handleSaveExtrusionReport = async (reportData) => {
    try {
      await saveExtrusionReport(reportData);
      setIsExtrusionReportModalOpen(false);
      setFirstPageToast("✅ 압출 작업일보가 실시간 저장되었습니다.");
      setTimeout(() => setFirstPageToast(""), 3500);
    } catch (e) {
      console.error(e);
      setFirstPageToast("❌ 작업일보 저장 중 오류가 발생했습니다.");
      setTimeout(() => setFirstPageToast(""), 3500);
    }
  };

  // Leaves and Smart Overtime data
  const [annualLeaves, setAnnualLeaves] = useState(() => getAnnualLeaves());
  const [smartOvertimeData, setSmartOvertimeData] = useState(() => getLocalSmartOvertimeData());

  useEffect(() => {
    const unsub = subscribeAnnualLeaves((leaves) => {
      setAnnualLeaves(leaves);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeSmartOvertimeData((data) => {
      setSmartOvertimeData(data);
    });
    return () => unsub();
  }, []);

  // Real-time clock tick for date and time calculations
  const [currentTimeTick, setCurrentTimeTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeTick((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const todayDateStr = useMemo(() => getKSTDateString(), [currentTimeTick]);
  const currentKstTimeStr = useMemo(() => {
    const info = getKSTTimeInfo();
    return `${String(info.hour).padStart(2, "0")}:${String(info.minute).padStart(2, "0")}`;
  }, [currentTimeTick]);

  // All workers list
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

  // Hanul partner user definition (한림공장 가공/협력업체 대표 계정)
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

  const allMasterWorkers = useMemo(() => {
    return (smartOvertimeData?.masterWorkers && smartOvertimeData.masterWorkers.length > 0)
      ? smartOvertimeData.masterWorkers
      : (INITIAL_SMART_OVERTIME_DATA?.masterWorkers || []);
  }, [smartOvertimeData]);

  const hanulWorkers = useMemo(() => {
    return allMasterWorkers.filter(
      (w) => w.company === "한울" && (!w.status || w.status !== "퇴사")
    );
  }, [allMasterWorkers]);

  // Bulimtech partner user definition (한림공장 가공/협력업체 대표 계정)
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
      (w) => w.company === "부림텍" && (!w.status || w.status !== "퇴사")
    );
  }, [allMasterWorkers]);

  const machiningWorkers = useMemo(() => {
    return allMasterWorkers.filter(
      (w) => w.company === "오륙" && (w.dept === "가공동" || ["JA", "HR", "NX4", "NX4a", "Channel", "JA.HR", "NX4.NX4a"].includes(w.line)) && (!w.status || w.status !== "퇴사")
    );
  }, [allMasterWorkers]);

  // Yuseong partner user definition (삼랑진공장 가공/협력업체 대표 계정)
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
      (w) => w.company === "유성" && (!w.status || w.status !== "퇴사")
    );
  }, [allMasterWorkers]);

  const joyoungWorkers = useMemo(() => {
    return allMasterWorkers.filter(
      (w) => w.company === "조영" && (!w.status || w.status !== "퇴사")
    );
  }, [allMasterWorkers]);

  // Leave counts
  const samrangjinLeaveCount = useMemo(() => {
    if (!PLANTS[0]?.workers || !annualLeaves) return 0;
    return PLANTS[0].workers.filter((w) => Boolean(getUserLeaveStatus(w.id, w.name, annualLeaves, { excludeTodo: true }))).length;
  }, [annualLeaves]);

  const hanlimLeaveCount = useMemo(() => {
    if (!PLANTS[1]?.workers || !annualLeaves) return 0;
    return PLANTS[1].workers.filter((w) => Boolean(getUserLeaveStatus(w.id, w.name, annualLeaves, { excludeTodo: true }))).length;
  }, [annualLeaves]);

  const managerLeaves = useMemo(() => {
    const managers = [
      ...PLANTS[0].workers.filter((w) => w.name === "이명재" || w.assignedProcess === "총괄관리"),
      ...PLANTS[1].workers.filter((w) => w.name === "김동욱" || w.assignedProcess === "총괄관리")
    ];
    return managers
      .map((m) => ({ ...m, leaveStatus: getUserLeaveStatus(m.id, m.name, annualLeaves, { excludeTodo: true }) }))
      .filter((m) => Boolean(m.leaveStatus));
  }, [annualLeaves]);

  const companyAttendanceStats = useMemo(() => {
    return COMPANIES.map((comp) => {
      const records = (smartOvertimeData || {})[comp] || [];
      const todayRecords = records.filter((r) => r.workDate === todayDateStr);
      const absentList = [];
      const earlyLeaveList = [];

      todayRecords.forEach((r) => {
        const item = { name: r.workerName || "작업자", reason: r.absentReason || r.earlyLeaveReason || r.notes || "개인사유" };
        if (r.status === "결근" || r.isAbsent) absentList.push(item);
        if (r.status === "조퇴" || r.isEarlyLeave) earlyLeaveList.push(item);
      });

      return {
        company: comp,
        absentCount: absentList.length,
        absentList,
        earlyLeaveCount: earlyLeaveList.length,
        earlyLeaveList
      };
    });
  }, [smartOvertimeData, todayDateStr]);

  // User select & Login handler
  const handleUserClick = (user) => {
    setSelectedUser(user);
    setPin("");
    setErrorMsg("");
  };

  const handlePinSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    setErrorMsg("");

    const trimmedPin = pin.trim();
    let isValid = false;

    if (selectedUser.role === "ADMIN") {
      isValid = trimmedPin === "0090" || trimmedPin === selectedUser.pin;
    } else {
      // General worker / factory login PIN
      isValid = trimmedPin === "11" || trimmedPin === (selectedUser.pin || "11") || trimmedPin === "1234";
    }

    if (isValid) {
      try {
        loginWithProfile(selectedUser, trimmedPin, rememberMe);
      } catch (err) {
        console.error("Login error:", err);
        setErrorMsg(err.message || "로그인 처리 중 오류가 발생했습니다.");
      }
    } else {
      setErrorMsg(selectedUser.role === "ADMIN" ? "관리자 PIN 번호가 일치하지 않습니다." : "PIN 번호가 일치하지 않습니다.");
    }
    setLoading(false);
  };

  // 📢 Issue Management Hook (All issue states, memos, operations, telegram & modal history)
  const issues = useAuthModalIssues({ todayDateStr, currentKstTimeStr, allWorkers });

  // Modal History (Back Button Support) for portals
  useModalHistory(isExtrusionModalOpen, () => setIsExtrusionModalOpen(false), "extrusionModal");
  useModalHistory(isMachiningModalOpen, () => setIsMachiningModalOpen(false), "machiningModal");
  useModalHistory(isHanulModalOpen, () => setIsHanulModalOpen(false), "hanulModal");
  useModalHistory(isHanulWorkReportModalOpen, () => setIsHanulWorkReportModalOpen(false), "hanulWorkReportModal");
  useModalHistory(isBulimtechModalOpen, () => setIsBulimtechModalOpen(false), "bulimtechModal");
  useModalHistory(isYuseongModalOpen, () => setIsYuseongModalOpen(false), "yuseongModal");
  useModalHistory(isJoyoungModalOpen, () => setIsJoyoungModalOpen(false), "joyoungModal");
  useModalHistory(isSqLevelUpModalOpen, () => setIsSqLevelUpModalOpen(false), "sqLevelUpModal");

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-950/85 backdrop-blur-xl animate-fadeIn p-2 sm:p-4 py-2 sm:py-8 flex justify-center items-start min-h-screen max-w-full">
      {/* Background Ambient Glow Orbs */}
      <div className="fixed w-96 h-96 -top-20 -left-20 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed w-96 h-96 -bottom-20 -right-20 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed w-80 h-80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container Card */}
      <div className="bg-white/95 dark:bg-slate-900/90 w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] border border-slate-200/80 dark:border-slate-800 backdrop-blur-2xl overflow-hidden my-auto relative animate-scaleUp min-w-0">
        {/* Top Glowing Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-blue-600 to-emerald-500"></div>

        <div className="p-3 sm:p-5 sm:px-6">
          {/* Toast Alert */}
          {(issues.restoreToast || firstPageToast) && (
            <div className="fixed top-4 right-4 z-[90] bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce border border-emerald-500/50 backdrop-blur-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold">{issues.restoreToast || firstPageToast}</span>
            </div>
          )}

          {/* Header Brand with Logo on Left (Top badges deleted per request) */}
          <AuthModalHeaderNav
            onAdminClick={() => handleUserClick(ADMIN_USERS[0])}
          />

          {/* 🌟 현장작업자 전용 빠른 로그인 포털 (공장동 및 가공/협력업체 6개사) - 최상단 배치 */}
          <div className="mb-3 sm:mb-3.5">
            <FieldWorkerLoginPortalSection
              onOpenExtrusionModal={() => setIsExtrusionModalOpen(true)}
              onOpenMachiningModal={() => setIsMachiningModalOpen(true)}
              onOpenHanulModal={() => setIsHanulModalOpen(true)}
              onOpenBulimtechModal={() => setIsBulimtechModalOpen(true)}
              onOpenYuseongModal={() => setIsYuseongModalOpen(true)}
              onOpenJoyoungModal={() => setIsJoyoungModalOpen(true)}
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
            <SqStatusBannerCard
              onOpenSqModal={() => setIsSqLevelUpModalOpen(true)}
            />
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

          {/* 👤 2. 작업자 로그인 섹션 */}
          <WorkerLoginSection
            factoryBuildingTab={factoryBuildingTab}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            pin={pin}
            setPin={setPin}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            loading={loading}
            errorMsg={errorMsg}
            annualLeaves={annualLeaves}
            samrangjinLeaveCount={samrangjinLeaveCount}
            hanlimLeaveCount={hanlimLeaveCount}
            managerLeaves={managerLeaves}
            companyAttendanceStats={companyAttendanceStats}
            activeIssues={issues.activeIssues}
            urgentIssues={issues.urgentIssues}
            onUserClick={handleUserClick}
            onPinSubmit={handlePinSubmit}
            onOpenExtrusionModal={() => setIsExtrusionModalOpen(true)}
            onOpenMachiningModal={() => setIsMachiningModalOpen(true)}
            onOpenHanulModal={() => setIsHanulModalOpen(true)}
            onOpenBulimtechModal={() => setIsBulimtechModalOpen(true)}
            onOpenYuseongModal={() => setIsYuseongModalOpen(true)}
            onOpenJoyoungModal={() => setIsJoyoungModalOpen(true)}
            extrusionWorkersCount={EXTRUSION_WORKERS.length}
            machiningWorkersCount={machiningWorkers.length}
            hanulWorkersCount={hanulWorkers.length}
            bulimtechWorkersCount={bulimtechWorkers.length}
            yuseongWorkersCount={yuseongWorkers.length}
            joyoungWorkersCount={joyoungWorkers.length}
            onOpenExtrusionReport={() => setIsExtrusionReportModalOpen(true)}
            onOpenDisasterModal={() => setIsSevereDisasterModalOpen(true)}
            onOpenQualityAlerts={() => {
              issues.setLedgerCategoryTab("quality_alert");
              issues.setSelectedListItem(null);
              issues.setIssueModalPage(1);
              issues.setIsListModalOpen(true);
            }}
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

      {/* 🚨 중대재해 안전보건 공유 모달 */}
      {isSevereDisasterModalOpen && (
        <SevereDisasterModal
          isOpen={isSevereDisasterModalOpen}
          onClose={() => setIsSevereDisasterModalOpen(false)}
        />
      )}

      {/* 🏭 압출 작업일보 신규 작성 모달 */}
      {isExtrusionReportModalOpen && (
        <Suspense fallback={null}>
          <ExtrusionWorkReportModal
            isOpen={isExtrusionReportModalOpen}
            onClose={() => setIsExtrusionReportModalOpen(false)}
            onSave={handleSaveExtrusionReport}
          />
        </Suspense>
      )}

      {/* 📋 한울 가공/협력업체 작업일보 신규 작성 모달 */}
      {isHanulWorkReportModalOpen && (
        <Suspense fallback={null}>
          <HanulWorkReportModal
            isOpen={isHanulWorkReportModalOpen}
            onClose={() => setIsHanulWorkReportModalOpen(false)}
            initialProject={hanulWorkReportProject}
            initialWorker={hanulWorkReportWorker}
          />
        </Suspense>
      )}
    </div>
  );
};

export default AuthModal;
