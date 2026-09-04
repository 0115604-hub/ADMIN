import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Sidebar, ADMIN_TABS } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardOverview } from "./components/DashboardOverview";
import { VehicleSalesView } from "./components/VehicleSalesView";
import { MaterialPurchaseView } from "./components/MaterialPurchaseView";
import { PurchaseExpenseView } from "./components/PurchaseExpenseView";
import { ClosingLedgerView } from "./components/ClosingLedgerView";
import { PnLStatement } from "./components/PnLStatement";
import { OperatorWorkspace } from "./components/OperatorWorkspace";
import { WorkerDashboard } from "./components/WorkerDashboard";
import { ExtrusionDowntimeView } from "./components/ExtrusionDowntimeView";
import { DailyQualityView } from "./components/DailyQualityView";
import { OvertimeStatusView } from "./components/OvertimeStatusView";
import { ElectronicApprovalView } from "./components/ElectronicApprovalView";
import { TelegramView } from "./components/TelegramView";
import { SettingsView } from "./components/SettingsView";
import { TransactionModal } from "./components/TransactionModal";
import { ExcelUploadModal } from "./components/ExcelUploadModal";
import { AuthModal } from "./components/AuthModal";
import { OryukLogo } from "./components/OryukLogo";
import { useAuth } from "./context/AuthContext";
import { useMonth } from "./context/MonthContext";
import {
  fetchTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  clearAllTransactions
} from "./services/dbService";
import {
  checkAndAutoSendDailyMorningBriefing,
  checkAndAutoSendDailyPnLBriefing
} from "./services/telegramService";

export const App = () => {
  const { isAuthenticated, isOperator, isAdmin, currentProfile, loading: authLoading } = useAuth();
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

  // Sync default tab and always reset to current month (당월) upon user login
  useEffect(() => {
    if (currentProfile) {
      setActiveTab("worker_dashboard");
      if (resetToCurrentMonth) {
        resetToCurrentMonth();
      }
    }
  }, [currentProfile?.id]);

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
    // Daily 07:00 AM P&L Briefing & 07:30 AM Morning Briefing Check
    checkAndAutoSendDailyPnLBriefing();
    checkAndAutoSendDailyMorningBriefing();
    const timer = setInterval(() => {
      checkAndAutoSendDailyPnLBriefing();
      checkAndAutoSendDailyMorningBriefing();
    }, 60000); // Check every 60 seconds
    return () => clearInterval(timer);
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
      for (const item of newTransactions) {
        await addTransaction(item);
      }
      await loadData(true);
      setExcelModalOpen(false);
    } catch (error) {
      console.error("Bulk upload error:", error);
      alert("업로드 중 오류가 발생했습니다: " + error.message);
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
    if (activeTab === "overtime_status") return "특근현황";
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
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
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={getTabTitle()}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onBackToSummary={() => setActiveTab("worker_dashboard")}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenNewModal={() => {
            setEditingItem(null);
            setModalOpen(true);
          }}
          onOpenExcelModal={() => setExcelModalOpen(true)}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing}
        />

        <main className="p-2.5 sm:p-4 lg:p-5 flex-1">
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400">데이터 로딩 중...</p>
              </div>
            </div>
          ) : (
            <>
              {/* OPERATOR VIEWS (Full-Width Single-Page Experience) */}
              {isOperator && (
                <>
                  {activeTab === "worker_dashboard" && (
                    <WorkerDashboard
                      onBulkUpload={handleBulkUpload}
                      onNavigateTab={(tabId) => setActiveTab(tabId)}
                    />
                  )}
                  {activeTab === "electronic_approval" && (
                    <ElectronicApprovalView />
                  )}
                  {activeTab === "vehicle_sales" && (
                    <VehicleSalesView />
                  )}
                  {activeTab === "extrusion_downtime" && (
                    <ExtrusionDowntimeView />
                  )}
                  {activeTab === "daily_quality" && (
                    <DailyQualityView />
                  )}
                  {activeTab === "overtime_status" && (
                    <OvertimeStatusView />
                  )}
                  {activeTab === "operator_workspace" && (
                    <OperatorWorkspace onBulkUpload={handleBulkUpload} />
                  )}
                </>
              )}

              {/* ADMIN VIEWS */}
              {isAdmin && (
                <>
                  {activeTab === "worker_dashboard" && (
                    <WorkerDashboard
                      onBulkUpload={handleBulkUpload}
                      onNavigateTab={(tabId) => setActiveTab(tabId)}
                    />
                  )}

                  {activeTab === "electronic_approval" && (
                    <ElectronicApprovalView />
                  )}

                  {activeTab === "vehicle_sales" && (
                    <VehicleSalesView />
                  )}

                  {activeTab === "material_purchases" && (
                    <MaterialPurchaseView />
                  )}

                  {activeTab === "closing_ledger" && (
                    <ClosingLedgerView />
                  )}

                  {activeTab === "purchase_costs" && (
                    <PurchaseExpenseView
                      transactions={transactions}
                      onEdit={(item) => {
                        setEditingItem(item);
                        setModalOpen(true);
                      }}
                      onDelete={handleDeleteTransaction}
                      onOpenNewModal={() => {
                        setEditingItem(null);
                        setModalOpen(true);
                      }}
                      onOpenExcelModal={() => setExcelModalOpen(true)}
                      onClearAll={handleClearAllTransactions}
                    />
                  )}

                  {activeTab === "statement" && (
                    <PnLStatement transactions={transactions} />
                  )}

                  {activeTab === "extrusion_downtime" && (
                    <ExtrusionDowntimeView />
                  )}

                  {activeTab === "daily_quality" && (
                    <DailyQualityView />
                  )}

                  {activeTab === "overtime_status" && (
                    <OvertimeStatusView />
                  )}

                  {activeTab === "operator_workspace" && (
                    <OperatorWorkspace onBulkUpload={handleBulkUpload} />
                  )}

                  {activeTab === "telegram" && (
                    <TelegramView />
                  )}

                  {activeTab === "settings" && (
                    <SettingsView
                      transactions={transactions}
                      onRefresh={() => loadData(true)}
                      dataSource={dataSource}
                    />
                  )}
                </>
              )}
            </>
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
      {isAdmin && (
        <TransactionModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveTransaction}
          editingItem={editingItem}
        />
      )}

      {/* Excel Upload Modal */}
      <ExcelUploadModal
        isOpen={excelModalOpen}
        onClose={() => setExcelModalOpen(false)}
        onBulkUpload={handleBulkUpload}
      />
    </div>
  );
};
