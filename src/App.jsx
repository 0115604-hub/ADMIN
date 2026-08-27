import React, { useState, useEffect } from "react";
import { Sidebar, NAVIGATION_TABS } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardOverview } from "./components/DashboardOverview";
import { MonthlyCalculator } from "./components/MonthlyCalculator";
import { TransactionTable } from "./components/TransactionTable";
import { PnLStatement } from "./components/PnLStatement";
import { BudgetAnalysis } from "./components/BudgetAnalysis";
import { SettingsView } from "./components/SettingsView";
import { TransactionModal } from "./components/TransactionModal";
import { AuthModal } from "./components/AuthModal";
import { useAuth } from "./context/AuthContext";
import {
  fetchTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "./services/dbService";

export const App = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("monthly"); // Default to monthly calculator for easy P&L!
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState("local");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

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

  // Create or Update
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

  // Direct Add (e.g. from Monthly Quick Add Bar)
  const handleDirectAddTransaction = async (formData) => {
    try {
      const newItem = await addTransaction(formData);
      setTransactions((prev) => [newItem, ...prev]);
    } catch (error) {
      console.error("Quick add transaction error:", error);
    }
  };

  // Delete
  const handleDeleteTransaction = async (id) => {
    if (!window.confirm("이 항목을 정말 삭제하시겠습니까?")) return;
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Delete transaction error:", error);
    }
  };

  // Active Tab Title
  const activeTabMeta = NAVIGATION_TABS.find((t) => t.id === activeTab);
  const pageTitle = activeTabMeta ? activeTabMeta.label : "월간 손익 간편 계산";

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold">Firebase 초기화 중...</p>
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
          title={pageTitle}
          onOpenNewModal={() => {
            setEditingItem(null);
            setModalOpen(true);
          }}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing}
        />

        <main className="p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400">데이터 로딩 중...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "monthly" && (
                <MonthlyCalculator
                  transactions={transactions}
                  onAddTransaction={handleDirectAddTransaction}
                  onUpdateTransaction={handleSaveTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              )}

              {activeTab === "dashboard" && (
                <DashboardOverview
                  transactions={transactions}
                  onOpenNewModal={() => {
                    setEditingItem(null);
                    setModalOpen(true);
                  }}
                  onNavigateToTransactions={() => setActiveTab("transactions")}
                />
              )}

              {activeTab === "transactions" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        수익 및 지출 전체 거래 내역
                      </h3>
                      <p className="text-xs text-slate-400">
                        등록된 모든 손익 데이터의 조회, 검색, 수정, 삭제 및 CSV 내보내기
                      </p>
                    </div>
                  </div>
                  <TransactionTable
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
                  />
                </div>
              )}

              {activeTab === "statement" && (
                <PnLStatement transactions={transactions} />
              )}

              {activeTab === "categories" && (
                <BudgetAnalysis transactions={transactions} />
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
        </main>
      </div>

      {/* Transaction Add/Edit Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveTransaction}
        editingItem={editingItem}
      />
    </div>
  );
};
