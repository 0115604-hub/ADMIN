import { useState, useEffect, useCallback } from "react";
import {
  fetchTransactions,
  addTransaction,
  bulkAddTransactions,
  updateTransaction,
  deleteTransaction,
  clearAllTransactions
} from "../services/dbService";

/**
 * useAppTransactions
 * - 거래내역(Transactions) 로드 및 CRUD 상태 관리
 */
export function useAppTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState("local");
  const [editingItem, setEditingItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);

  const loadData = useCallback(async (forceRefresh = false) => {
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Delete transaction error:", error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllTransactions();
      setTransactions([]);
    } catch (error) {
      console.error("Clear all transactions error:", error);
    }
  };

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

  return {
    transactions,
    setTransactions,
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
    handleDeleteTransaction,
    handleClearAll,
    handleBulkUpload
  };
}
