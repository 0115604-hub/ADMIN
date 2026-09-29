import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { ArrowUp } from "lucide-react";
import { Sidebar, ADMIN_TABS } from "./components/Sidebar";
import { Header } from "./components/Header";
import { AuthModal } from "./components/AuthModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { runStorageHealthCheck } from "./utils/storageHealthCheck";
import { useAuth } from "./context/AuthContext";
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
  clearAllTransactions,
  getLocalData
} from "./services/dbService";
import {
  checkAndAutoSendDailyMorningBriefing,
  checkAndAutoSendDailyClosingBriefing,
  subscribeTelegramConfig
} from "./services/telegramService";
import { pushModalHistory, closeAllModals, popTopModal, wasModalJustPopped } from "./utils/modalHistory";

export const App = () => {
  const { isAuthenticated, isOperator, isAdmin, currentProfile, loading: authLoading, logout } = useAuth();
  const { resetToCurrentMonth } = useMonth();
  const [activeTab, setActiveTab] = useState("worker_dashboard");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState("local");
  const [modalOpen, setModalOpen] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  // Synchronized refs to avoid stale closures in global popstate handler
  const activeTabRef = useRef(activeTab);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const modalOpenRef = useRef(modalOpen);
  const excelModalOpenRef = useRef(excelModalOpen);
  const mobileMenuOpenRef = useRef(mobileMenuOpen);
  const editingItemRef = useRef(editingItem);

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
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
      setActiveTab("worker_dashboard");
      try {
        window.history.pushState({ screen: "worker_dashboard", isSummary: true }, "");
      } catch (e) {}
    } else {
      try {
        window.history.replaceState({ screen: "main", isMain: true }, "");
      } catch (e) {}
    }
  }, [currentProfile?.id]);

  // 2. Tab Navigation History (상세페이지 진입 시 히스토리 스택 푸시)
  useEffect(() => {
    if (isAuthenticated && activeTab !== "worker_dashboard") {
      try {
        window.history.pushState({ screen: activeTab, isDetail: true }, "");
      } catch (e) {}
    }
  }, [activeTab, isAuthenticated]);

  // 3. 🌟 Global Browser & App Back Button (인터넷창 뒤로가기)
  // 상세페이지에서 누르면 요약화면(worker_dashboard), 요약화면에서 누르면 메인화면(AuthModal)으로 이동
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

      // [규칙 1] 상세페이지에서 누르면 요약화면(worker_dashboard)으로 복귀
      if (currentTab !== "worker_dashboard") {
        setActiveTab("worker_dashboard");
        try {
          window.history.replaceState({ screen: "worker_dashboard", isSummary: true }, "");
        } catch (err) {}
        return;
      }

      // [규칙 2] 요약화면(worker_dashboard)에서 누르면 메인화면(AuthModal / 로그아웃)으로 이동
      if (currentTab === "worker_dashboard") {
        logout();
        try {
          window.history.replaceState({ screen: "main", isMain: true }, "");
        } catch (err) {}
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [logout]);

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

    // High-precision adaptive interval (10 seconds) for zero-latency dispatch
    const timer = setInterval(() => {
      checkAndAutoSendDailyMorningBriefing();
      checkAndAutoSendDailyClosingBriefing();
    }, 10000);

    return () => {
      unsubTelegram();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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

  // Delete Transaction
  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Delete transaction error:", error);
    }
  };

  // Clear All Transactions
  const handleClearAllTransactions = async () => {
    try {
      await clearAllTransactions();
      setTransactions([]);
    } catch (error) {
      console.error("Clear all error:", error);
    }
  };

  // Title mapping
  const getTabTitle = () => {
    if (activeTab === "worker_dashboard") return isAdmin ? "현황" : "일일생산정보현황";
    if (activeTab === "extrusion_downtime") return "압출동 주간 비가동내역";
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
    <div className="flex min-h-screen max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar (Admin Only - Desktop & Mobile Drawer) */}
      {!isOperator && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
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

        <main className="p-2 sm:p-4 lg:p-5 flex-1 min-w-0 max-w-full overflow-x-hidden">
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
                  {activeTab === "worker_dashboard" && (
                    <ErrorBoundary inline title="일일생산정보현황">
                      <WorkerDashboard
                        onBulkUpload={handleBulkUpload}
                        onNavigateTab={(tabId) => setActiveTab(tabId)}
                      />
                    </ErrorBoundary>
                  )}
                  {activeTab === "electronic_approval" && (
                    <ErrorBoundary inline title="전자결재">
                      <ElectronicApprovalView />
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

                  {activeTab === "electronic_approval" && (
                    <ErrorBoundary inline title="전자결재">
                      <ElectronicApprovalView />
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
