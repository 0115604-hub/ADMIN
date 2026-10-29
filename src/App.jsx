import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { ArrowUp } from "lucide-react";
import { Sidebar, ADMIN_TABS } from "./components/Sidebar";
import { Header } from "./components/Header";
import { AuthModal } from "./components/AuthModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { runStorageHealthCheck } from "./utils/storageHealthCheck";
import { useAuth, isManagerOrAdminUser, isExtrusionWorkerProfile } from "./context/AuthContext";
import { isHanulWorkerProfile } from "./services/hanulQualityIssueService";
import { useMonth } from "./context/MonthContext";

// Lazy-loaded views & modals for near-instant startup & mobile optimization
const WorkerDashboard = lazy(() => import("./components/WorkerDashboard").then(m => ({ default: m.WorkerDashboard || m.default })));
const SalesPurchaseAnalysisView = lazy(() => import("./components/SalesPurchaseAnalysisView").then(m => ({ default: m.SalesPurchaseAnalysisView || m.default })));
const HanulTaxInvoiceView = lazy(() => import("./components/HanulTaxInvoiceView").then(m => ({ default: m.HanulTaxInvoiceView || m.default })));
const OperatorWorkspace = lazy(() => import("./components/OperatorWorkspace").then(m => ({ default: m.OperatorWorkspace || m.default })));
const ExtrusionDowntimeView = lazy(() => import("./components/ExtrusionDowntimeView").then(m => ({ default: m.ExtrusionDowntimeView || m.default })));
const DailyQualityView = lazy(() => import("./components/DailyQualityView").then(m => ({ default: m.DailyQualityView || m.default })));
const OvertimeStatusView = lazy(() => import("./components/OvertimeStatusView").then(m => ({ default: m.OvertimeStatusView || m.default })));
const ElectronicApprovalView = lazy(() => import("./components/ElectronicApprovalView").then(m => ({ default: m.ElectronicApprovalView || m.default })));
const TelegramView = lazy(() => import("./components/TelegramView").then(m => ({ default: m.TelegramView || m.default })));
const SettingsView = lazy(() => import("./components/SettingsView").then(m => ({ default: m.SettingsView || m.default })));
const IncidentLogsView = lazy(() => import("./components/IncidentLogsView").then(m => ({ default: m.IncidentLogsView || m.default })));
const SqLevelUpView = lazy(() => import("./components/sq/SqLevelUpView").then(m => ({ default: m.SqLevelUpView || m.default })));
const WorkReportTemplateManagerView = lazy(() => import("./components/WorkReportTemplateManagerView").then(m => ({ default: m.WorkReportTemplateManagerView || m.default })));
const TransactionModal = lazy(() => import("./components/TransactionModal").then(m => ({ default: m.TransactionModal || m.default })));
const ExcelUploadModal = lazy(() => import("./components/ExcelUploadModal").then(m => ({ default: m.ExcelUploadModal || m.default })));

// Smooth view skeleton loader
const ViewLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[350px] w-full py-16 animate-fadeIn">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-2 border-blue-100 dark:border-blue-950 opacity-60"></div>
      <div className="absolute inset-0 rounded-full border-2 border-blue-600 dark:border-blue-400 border-t-transparent animate-spin"></div>
    </div>
    <span className="mt-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight">
      화면을 불러오는 중입니다...
    </span>
  </div>
);
import {
  fetchTransactions,
  addTransaction,
  bulkAddTransactions,
  updateTransaction,
  deleteTransaction,
  clearAllTransactions
} from "./services/dbService";
import {
  checkAndAutoSendDailyMorningBriefing,
  checkAndAutoSendDailyClosingBriefing,
  subscribeTelegramConfig
} from "./services/telegramService";
import { pushModalHistory, popTopModal, wasModalJustPopped } from "./utils/modalHistory";
import { initDailyMaintenanceScheduler } from "./services/dailyMaintenanceService";
import { syncAllOvertimeReportsToApprovalBox } from "./services/approvalService";

export const App = () => {
  const { isAuthenticated, isOperator, isAdmin, currentProfile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const target = localStorage.getItem("admin_target_tab");
      if (target) {
        localStorage.removeItem("admin_target_tab");
        return target;
      }
    } catch (e) {}
    return "worker_dashboard";
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState("local");
  const [modalOpen, setModalOpen] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Daily Maintenance & HealthCheck Scheduler (매일 새벽 자동 헬스체크, 무결성 정제 및 스냅샷 백업)
  useEffect(() => {
    const stopScheduler = initDailyMaintenanceScheduler();
    return () => {
      if (stopScheduler) stopScheduler();
    };
  }, []);

  // Synchronized refs to avoid stale closures in global popstate handler
  const activeTabRef = useRef(activeTab);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const modalOpenRef = useRef(modalOpen);
  const excelModalOpenRef = useRef(excelModalOpen);
  const mobileMenuOpenRef = useRef(mobileMenuOpen);
  const editingItemRef = useRef(editingItem);

  useEffect(() => {
    activeTabRef.current = activeTab;
    try {
      if (typeof window !== "undefined") {
        window.__ORYUK_ACTIVE_TAB__ = activeTab;
        sessionStorage.setItem("oryuk_current_active_tab", activeTab);
      }
    } catch (e) {}
  }, [activeTab]);
  useEffect(() => { isAuthenticatedRef.current = isAuthenticated; }, [isAuthenticated]);
  useEffect(() => { modalOpenRef.current = modalOpen; }, [modalOpen]);
  useEffect(() => { excelModalOpenRef.current = excelModalOpen; }, [excelModalOpen]);
  useEffect(() => { mobileMenuOpenRef.current = mobileMenuOpen; }, [mobileMenuOpen]);
  useEffect(() => { editingItemRef.current = editingItem; }, [editingItem]);

  // 1. Initial State and Login/Logout synchronization
  useEffect(() => {
    runStorageHealthCheck();
    try {
      document.documentElement.style.zoom = "";
      document.body.style.zoom = "";
      localStorage.removeItem("oryuk_screen_zoom_idx");
    } catch (e) {}

    if (currentProfile) {
      const isExtrusionWorker = isExtrusionWorkerProfile(currentProfile);
      if (isExtrusionWorker) {
        try {
          localStorage.setItem("factory_extrusion_active_subtab", "production");
        } catch (e) {}
      }

      const targetTab = "worker_dashboard";
      setActiveTab(targetTab);
      try {
        window.history.pushState({ screen: targetTab, isSummary: true }, "");
      } catch (e) {}
    } else {
      try {
        window.history.replaceState({ screen: "main", isMain: true }, "");
      } catch (e) {}
    }
  }, [currentProfile]);

  // 2. Tab Navigation History (상세페이지 진입 시 히스토리 스택 푸시)
  useEffect(() => {
    if (isAuthenticated && activeTab !== "worker_dashboard") {
      try {
        window.history.pushState({ screen: activeTab, isDetail: true }, "");
      } catch (e) {}
    }
  }, [activeTab, isAuthenticated]);

  // 3. 🌟 Global Browser & App Back Button (안전한 뒤로가기 제어: 절대 자동 로그아웃되지 않음)
  useEffect(() => {
    const handlePopState = () => {
      // (1) 팝업 / 모달이 열려 있는 경우: 최상단 모달만 닫고 현재 화면 유지
      const hadAppModals = modalOpenRef.current || excelModalOpenRef.current || mobileMenuOpenRef.current || editingItemRef.current !== null;
      if (hadAppModals) {
        setModalOpen(false);
        setExcelModalOpen(false);
        setMobileMenuOpen(false);
        setEditingItem(null);
        return;
      }

      // 팝업 스택에서 최상단 모달 1개만 닫기 (다중 모달 중첩 지원: 사진보기 -> 팝업화면 -> 첫화면)
      if (wasModalJustPopped() || popTopModal()) {
        return;
      }

      const isAuthed = isAuthenticatedRef.current;
      const currentTab = activeTabRef.current;

      // 로그인하지 않은 상태(메인화면)에서는 메인화면 유지
      if (!isAuthed) {
        try {
          window.history.replaceState({ screen: "main", isMain: true }, "");
        } catch (err) {}
        return;
      }

      const homeTab = "worker_dashboard";

      // 상세 메뉴에서 뒤로가기 누른 경우 홈 화면으로 이동
      if (currentTab !== homeTab) {
        setActiveTab(homeTab);
        try {
          window.history.replaceState({ screen: homeTab, isSummary: true }, "");
        } catch (err) {}
        return;
      }

      // 홈 화면에서는 뒤로가기 시 로그아웃하지 않고 현재 홈 화면 유지 (로그아웃은 헤더/프로필 버튼 전용)
      try {
        window.history.replaceState({ screen: homeTab, isSummary: true }, "");
      } catch (err) {}
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentProfile]);

  // Scroll to top on active tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTab]);

  // Track window scroll position for floating Top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Load data
  const loadData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setIsRefreshing(true);
      else setLoading(true);

      const result = await fetchTransactions();
      const items = Array.isArray(result) ? result : (result?.data || []);
      setTransactions(items);
      setDataSource(result?.source || "local");
    } catch (error) {
      console.error("Data load error:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-sync existing/remote weekend/holiday overtime reports to approval box
    syncAllOvertimeReportsToApprovalBox().catch((e) => console.warn("App mount auto-sync overtime reports to approval box:", e));

    // Daily 07:40 AM Morning & 17:30 PM Closing Briefing Checks
    checkAndAutoSendDailyMorningBriefing();
    checkAndAutoSendDailyClosingBriefing();

    // Ensure real-time sync of Telegram notification configuration
    const unsubTelegram = subscribeTelegramConfig();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAndAutoSendDailyMorningBriefing();
        checkAndAutoSendDailyClosingBriefing();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    // High-precision adaptive interval (10 seconds) for zero-latency dispatch
    const timer = setInterval(() => {
      checkAndAutoSendDailyMorningBriefing();
      checkAndAutoSendDailyClosingBriefing();
    }, 10000);

    return () => {
      unsubTelegram();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, []);

  // Save Transaction
  const handleSaveTransaction = async (formData) => {
    try {
      if (editingItem) {
        const updated = await updateTransaction(editingItem.id, formData);
        setTransactions((prev) =>
          prev.map((t) => (t.id === editingItem.id ? updated : t))
        );
      } else {
        const created = await addTransaction(formData);
        setTransactions((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Save transaction error:", error);
    }
  };

  // Bulk Upload from Excel
  const handleBulkUpload = async (newTransactions) => {
    try {
      if (Array.isArray(newTransactions) && newTransactions.length > 0) {
        await bulkAddTransactions(newTransactions);
        await loadData(true);
      }
      setExcelModalOpen(false);
    } catch (error) {
      console.error("Bulk upload error:", error);
    }
  };

  // Title mapping
  const getTabTitle = () => {
    const isManager = isManagerOrAdminUser(currentProfile, isAdmin);
    const isExtrusionWorker = isExtrusionWorkerProfile(currentProfile);
    const isHanul = !isExtrusionWorker && isHanulWorkerProfile(currentProfile);
    const isBurimtech = !isExtrusionWorker && !isHanul && Boolean(
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
      // 관리자별 맞춤 대시보드 타이틀 (각 관리자의 직책 및 전담 업무 직관적 표기)
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
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold">시스템 초기화 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 mobile-pan-free">
      {/* Sidebar (Desktop for Admin & Mobile Drawer for All Users) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 w-full mobile-pan-free">
        <Header
          title={getTabTitle()}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onBackToSummary={() => setActiveTab("worker_dashboard")}
          onOpenMobileMenu={() => {
            pushModalHistory("mobile_menu");
            setMobileMenuOpen(true);
          }}
          onOpenNewModal={() => {
            pushModalHistory("transaction_modal");
            setEditingItem(null);
            setModalOpen(true);
          }}
          onOpenExcelModal={() => {
            pushModalHistory("excel_modal");
            setExcelModalOpen(true);
          }}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing}
        />

        <main className="p-2 sm:p-4 lg:p-5 flex-1 min-w-0 w-full overflow-x-auto mobile-pan-free">
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400">데이터 로딩 중...</p>
              </div>
            </div>
          ) : (
            <Suspense fallback={<ViewLoadingFallback />}>
              {/* OPERATOR VIEWS (Full-Width Single-Page Experience) */}
              {isOperator && (
                <>
                  {(activeTab === "worker_dashboard" || !["electronic_approval", "vehicle_sales", "sales_purchase_analysis", "hanul_tax_invoice", "extrusion_downtime", "daily_quality", "overtime_status", "operator_workspace", "sq_level_up", "work_report_templates"].includes(activeTab)) && (
                    <ErrorBoundary inline title="일일생산정보현황">
                      <WorkerDashboard
                        onBulkUpload={handleBulkUpload}
                        onNavigateTab={(tabId) => setActiveTab(tabId)}
                      />
                    </ErrorBoundary>
                  )}
                  {activeTab === "work_report_templates" && (
                    <ErrorBoundary inline title="일보 양식 관리">
                      <WorkReportTemplateManagerView />
                    </ErrorBoundary>
                  )}
                  {activeTab === "electronic_approval" && (
                    <ErrorBoundary inline title="전자결재">
                      <ElectronicApprovalView
                        onNavigateTab={(tabId) => setActiveTab(tabId)}
                        onBack={() => setActiveTab("worker_dashboard")}
                      />
                    </ErrorBoundary>
                  )}
                  {(activeTab === "vehicle_sales" || activeTab === "sales_purchase_analysis") && (
                    <ErrorBoundary inline title="매출매입분석">
                      <SalesPurchaseAnalysisView />
                    </ErrorBoundary>
                  )}
                  {activeTab === "sq_level_up" && (
                    <ErrorBoundary inline title="SQ 진행상황 현황표">
                      <SqLevelUpView />
                    </ErrorBoundary>
                  )}
                  {activeTab === "hanul_tax_invoice" && (
                    <ErrorBoundary inline title="한울 세금계산서">
                      <HanulTaxInvoiceView />
                    </ErrorBoundary>
                  )}
                  {activeTab === "extrusion_downtime" && (
                    <ErrorBoundary inline title="압출동 주간 비가동내역">
                      <ExtrusionDowntimeView />
                    </ErrorBoundary>
                  )}
                  {activeTab === "daily_quality" && (
                    <ErrorBoundary inline title="일일 품질현황">
                      <DailyQualityView />
                    </ErrorBoundary>
                  )}
                  {activeTab === "overtime_status" && (
                    <ErrorBoundary inline title="근태현황 및 관리">
                      <OvertimeStatusView onNavigateTab={(tabId) => setActiveTab(tabId)} />
                    </ErrorBoundary>
                  )}
                  {activeTab === "operator_workspace" && (
                    <ErrorBoundary inline title="엑셀 파일 업로드">
                      <OperatorWorkspace onBulkUpload={handleBulkUpload} />
                    </ErrorBoundary>
                  )}
                  {activeTab === "incident_logs" && (
                    <ErrorBoundary inline title="오류 및 조치 관리">
                      <IncidentLogsView />
                    </ErrorBoundary>
                  )}
                </>
              )}

              {/* ADMIN VIEWS */}
              {isAdmin && (
                <>
                  {activeTab === "worker_dashboard" && (
                    <ErrorBoundary inline title="현황">
                      <WorkerDashboard
                        onBulkUpload={handleBulkUpload}
                        onNavigateTab={(tabId) => setActiveTab(tabId)}
                      />
                    </ErrorBoundary>
                  )}

                  {activeTab === "sq_level_up" && (
                    <ErrorBoundary inline title="SQ 진행상황 현황표">
                      <SqLevelUpView />
                    </ErrorBoundary>
                  )}

                  {activeTab === "electronic_approval" && (
                    <ErrorBoundary inline title="전자결재">
                      <ElectronicApprovalView
                        onNavigateTab={(tabId) => setActiveTab(tabId)}
                        onBack={() => setActiveTab("worker_dashboard")}
                      />
                    </ErrorBoundary>
                  )}

                  {(activeTab === "vehicle_sales" || activeTab === "sales_purchase_analysis") && (
                    <ErrorBoundary inline title="매출매입분석">
                      <SalesPurchaseAnalysisView />
                    </ErrorBoundary>
                  )}

                  {activeTab === "hanul_tax_invoice" && (
                    <ErrorBoundary inline title="한울 세금계산서">
                      <HanulTaxInvoiceView />
                    </ErrorBoundary>
                  )}

                  {activeTab === "extrusion_downtime" && (
                    <ErrorBoundary inline title="압출동 주간 비가동내역">
                      <ExtrusionDowntimeView />
                    </ErrorBoundary>
                  )}

                  {activeTab === "daily_quality" && (
                    <ErrorBoundary inline title="일일 품질현황">
                      <DailyQualityView />
                    </ErrorBoundary>
                  )}

                  {activeTab === "overtime_status" && (
                    <ErrorBoundary inline title="근태현황 및 관리">
                      <OvertimeStatusView onNavigateTab={(tabId) => setActiveTab(tabId)} />
                    </ErrorBoundary>
                  )}

                  {activeTab === "operator_workspace" && (
                    <ErrorBoundary inline title="엑셀 파일 업로드">
                      <OperatorWorkspace onBulkUpload={handleBulkUpload} />
                    </ErrorBoundary>
                  )}

                  {activeTab === "incident_logs" && (
                    <ErrorBoundary inline title="오류 및 조치 관리">
                      <IncidentLogsView />
                    </ErrorBoundary>
                  )}

                  {activeTab === "telegram" && (
                    <ErrorBoundary inline title="텔레그램 연동">
                      <TelegramView />
                    </ErrorBoundary>
                  )}

                  {activeTab === "settings" && (
                    <ErrorBoundary inline title="설정 및 데이터 관리">
                      <SettingsView
                        transactions={transactions}
                        onRefresh={() => loadData(true)}
                        dataSource={dataSource}
                      />
                    </ErrorBoundary>
                  )}
                </>
              )}
            </Suspense>
          )}
        </main>
      </div>

      {/* Floating Scroll-to-Top Button */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-black cursor-pointer animate-fadeIn border border-blue-400/40"
          title="맨 위로 이동"
        >
          <ArrowUp className="w-4 h-4" />
          <span>TOP</span>
        </button>
      )}

      {/* Transaction Add/Edit Modal (Admin Only) */}
      {isAdmin && modalOpen && (
        <Suspense fallback={null}>
          <TransactionModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEditingItem(null);
            }}
            onSave={handleSaveTransaction}
            editingItem={editingItem}
          />
        </Suspense>
      )}

      {/* Excel Upload Modal */}
      {excelModalOpen && (
        <Suspense fallback={null}>
          <ExcelUploadModal
            isOpen={excelModalOpen}
            onClose={() => setExcelModalOpen(false)}
            onBulkUpload={handleBulkUpload}
          />
        </Suspense>
      )}
    </div>
  );
};
