import React, { useState, useEffect } from "react";
import { Sidebar, ADMIN_TABS } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardOverview } from "./components/DashboardOverview";
import { VehicleSalesView } from "./components/VehicleSalesView";
import { MaterialPurchaseView } from "./components/MaterialPurchaseView";
import { PurchaseExpenseView } from "./components/PurchaseExpenseView";
import { PnLStatement } from "./components/PnLStatement";
import { OperatorWorkspace } from "./components/OperatorWorkspace";
import { WorkerDashboard } from "./components/WorkerDashboard";
import { SettingsView } from "./components/SettingsView";
import { TransactionModal } from "./components/TransactionModal";
import { ExcelUploadModal } from "./components/ExcelUploadModal";
import { AuthModal } from "./components/AuthModal";
import { useAuth } from "./context/AuthContext";
import {
  fetchTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "./services/dbService";

export const App = () => {
  const { isAuthenticated, isOperator, isAdmin, currentProfile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(isOperator ? "worker_dashboard" : "dashboard");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState("local");
  const [modalOpen, setModalOpen] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Sync default tab when user changes
  useEffect(() => {
    if (isOperator) {
      setActiveTab("worker_dashboard");
    } else if (isAdmin && (activeTab === "worker_dashboard" || !activeTab)) {
      setActiveTab("dashboard");
    }
  }, [isOperator, isAdmin]);

  // Load data
  const loadData = async (showRefreshAnim = false) => {
    if (showRefreshAnim) setIsRefreshing(true);
    try {
      const result = await fetchTransactions();
      setTransactions(result.data || []);
      setDataSource(result.source || "local");
    } catch (error) {
      console.error("Data load error:", error);
    } finally {
      setLoading(false);
      if (showRefreshAnim) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Save Transaction
  const handleSaveTransaction = async (formData) => {
    try {
      if (editingItem) {
        const updated = await updateTransaction(editingItem.id, formData);
        setTransactions((prev) =>
          prev.map((t) => (t.id === editingItem.id ? { ...t, ...updated } : t))
        );
      } else {
        const newItem = await addTransaction(formData);
        setTransactions((prev) => [newItem, ...prev]);
      }
    } catch (error) {
      console.error("Save transaction error:", error);
    } finally {
      setEditingItem(null);
    }
  };

  // Bulk Upload
  const handleBulkUpload = async (items) => {
    const createdList = [];
    for (const item of items) {
      const created = await addTransaction(item);
      createdList.push(created);
    }
    setTransactions((prev) => [...createdList, ...prev]);
    return true;
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id) => {
    if (!window.confirm("이 항목을 정말 삭제하시겠습니까?")) return;
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Delete transaction error:", error);
    }
  };

  // Title mapping
  const getTabTitle = () => {
    if (isOperator) {
      if (activeTab === "operator_workspace") return "엑셀 파일 업로드";
      return "업무일지 & 현황";
    }
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
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={getTabTitle()}
          onOpenNewModal={() => {
            setEditingItem(null);
            setModalOpen(true);
          }}
          onOpenExcelModal={() => setExcelModalOpen(true)}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing}
        />

        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400">데이터 로딩 중...</p>
              </div>
            </div>
          ) : (
            <>
              {/* OPERATOR VIEWS */}
              {isOperator && (
                <>
                  {activeTab === "worker_dashboard" && (
                    <WorkerDashboard onBulkUpload={handleBulkUpload} />
                  )}
                  {activeTab === "operator_workspace" && (
                    <OperatorWorkspace onBulkUpload={handleBulkUpload} />
                  )}
                </>
              )}

              {/* ADMIN VIEWS */}
              {isAdmin && (
                <>
                  {activeTab === "dashboard" && (
                    <DashboardOverview
                      onNavigateToVehicles={() => setActiveTab("vehicle_sales")}
                      onNavigateToMaterials={() => setActiveTab("material_purchases")}
                      onNavigateToPurchases={() => setActiveTab("purchase_costs")}
                      onNavigateToStatement={() => setActiveTab("statement")}
                      onNavigateToWorkLogs={() => setActiveTab("worker_dashboard")}
                    />
                  )}

                  {activeTab === "vehicle_sales" && (
                    <VehicleSalesView />
                  )}

                  {activeTab === "material_purchases" && (
                    <MaterialPurchaseView />
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
                    />
                  )}

                  {activeTab === "statement" && (
                    <PnLStatement transactions={transactions} />
                  )}

                  {activeTab === "worker_dashboard" && (
                    <WorkerDashboard onBulkUpload={handleBulkUpload} />
                  )}

                  {activeTab === "operator_workspace" && (
                    <OperatorWorkspace onBulkUpload={handleBulkUpload} />
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
