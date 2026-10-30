import React, { useState, Suspense, lazy } from "react";
import { ArrowUp } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { AuthModal } from "./components/AuthModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useAuth } from "./context/AuthContext";
import { pushModalHistory } from "./utils/modalHistory";
import { getAppTabTitle } from "./utils/appTabTitle";
import { useAppBackgroundServices } from "./hooks/useAppBackgroundServices";
import { useAppNavigationHistory } from "./hooks/useAppNavigationHistory";
import { useAppTransactions } from "./hooks/useAppTransactions";

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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  // 1. Transaction & Data Hooks
  const {
    transactions,
    loading,
    isRefreshing,
    dataSource,
    modalOpen,
    setModalOpen,
    excelModalOpen,
    setExcelModalOpen,
    editingItem,
    setEditingItem,
    loadData,
    handleSaveTransaction,
    handleBulkUpload
  } = useAppTransactions();

  // 2. Background Services (Morning/Closing Telegram Briefings & Overtime sync)
  useAppBackgroundServices();

  // 3. Navigation History & Popstate Defense
  useAppNavigationHistory({
    activeTab,
    setActiveTab,
    isAuthenticated,
    currentProfile,
    modalOpen,
    setModalOpen,
    excelModalOpen,
    setExcelModalOpen,
    mobileMenuOpen,
    setMobileMenuOpen,
    editingItem,
    setEditingItem,
    setShowTopBtn
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          title={getAppTabTitle(activeTab, currentProfile, isAdmin)}
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
