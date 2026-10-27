import { useState, useMemo } from 'react';

/**
 * Custom Hook: useSalesPurchaseFilters
 * Manages search filtering and subtotals for sales and purchases datasets.
 */
export const useSalesPurchaseFilters = (rawSales = [], rawPurchases = []) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeViewMode, setActiveViewMode] = useState('all'); // 'all', 'sales', 'purchases'

  const filteredSales = useMemo(() => {
    return rawSales.filter((s) => {
      const q = searchTerm.toLowerCase();
      return (
        s.category.toLowerCase().includes(q) ||
        s.item.toLowerCase().includes(q) ||
        s.badge.toLowerCase().includes(q)
      );
    });
  }, [rawSales, searchTerm]);

  const filteredPurchases = useMemo(() => {
    return rawPurchases.filter((p) => {
      const q = searchTerm.toLowerCase();
      return (
        p.category.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q) ||
        p.badge.toLowerCase().includes(q)
      );
    });
  }, [rawPurchases, searchTerm]);

  const salesSubtotal = filteredSales.reduce((acc, c) => acc + c.amount, 0);
  const purchaseSubtotal = filteredPurchases.reduce((acc, c) => acc + c.amount, 0);

  return {
    searchTerm,
    setSearchTerm,
    activeViewMode,
    setActiveViewMode,
    filteredSales,
    filteredPurchases,
    salesSubtotal,
    purchaseSubtotal
  };
};

export default useSalesPurchaseFilters;
