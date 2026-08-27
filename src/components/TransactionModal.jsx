import React, { useState, useEffect } from "react";
import { X, Plus, Edit3, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";

const DEFAULT_EXPENSE_CATEGORIES = [
  "인건비",
  "서버/인프라",
  "마케팅/광고",
  "사무실/운영비",
  "소프트웨어 구독",
  "여비/교통비",
  "외주용역비",
  "기타비용",
];

const DEFAULT_REVENUE_CATEGORIES = [
  "제품 판매",
  "구독 서비스",
  "컨설팅",
  "유지보수",
  "외주 개발",
  "광고 수익",
  "기타수익",
];

export const TransactionModal = ({ isOpen, onClose, onSave, editingItem }) => {
  const { currency } = useCurrency();
  const [formData, setFormData] = useState({
    type: "revenue",
    title: "",
    category: "제품 판매",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    client: "",
    paymentMethod: "계좌이체",
    status: "완료",
    memo: "",
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        type: editingItem.type || "revenue",
        title: editingItem.title || "",
        category: editingItem.category || "제품 판매",
        amount: editingItem.amount ? String(editingItem.amount) : "",
        date: editingItem.date || new Date().toISOString().split("T")[0],
        client: editingItem.client || "",
        paymentMethod: editingItem.paymentMethod || "계좌이체",
        status: editingItem.status || "완료",
        memo: editingItem.memo || "",
      });
    } else {
      setFormData({
        type: "revenue",
        title: "",
        category: "제품 판매",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        client: "",
        paymentMethod: "계좌이체",
        status: "완료",
        memo: "",
      });
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const categories =
    formData.type === "revenue"
      ? DEFAULT_REVENUE_CATEGORIES
      : DEFAULT_EXPENSE_CATEGORIES;

  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      type,
      category:
        type === "revenue"
          ? DEFAULT_REVENUE_CATEGORIES[0]
          : DEFAULT_EXPENSE_CATEGORIES[0],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      alert("항목명과 금액을 입력해 주세요.");
      return;
    }
    onSave({
      ...formData,
      amount: Number(formData.amount),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {editingItem ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editingItem ? "손익 내역 수정" : "신규 손익 내역 등록"}
              </h3>
              <p className="text-xs text-slate-400">
                수익 또는 지출 항목의 상세 정보를 입력하세요.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              구분 (Type)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange("revenue")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  formData.type === "revenue"
                    ? "bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500 dark:text-blue-400 shadow-sm"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-blue-500" />
                <span>수익 (Revenue)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("expense")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  formData.type === "expense"
                    ? "bg-rose-50 border-rose-500 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500 dark:text-rose-400 shadow-sm"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
                <span>지출 (Expense)</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              항목명 / 적요 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: SaaS 월간 구독료 / 서버비용 결제"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                금액 (Amount, KRW 기준) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-medium">
                  ₩
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                거래 일자 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                카테고리
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                결제 / 지급 수단
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="계좌이체">계좌이체</option>
                <option value="법인카드">법인카드</option>
                <option value="PG 카드결제">PG 카드결제</option>
                <option value="현금/영수증">현금/영수증</option>
                <option value="세금계산서">세금계산서</option>
                <option value="기타">기타</option>
              </select>
            </div>
          </div>

          {/* Client / Partner & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                거래처 / 고객사
              </label>
              <input
                type="text"
                placeholder="예: (주)한국기업"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                처리 상태
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="완료">완료 (Completed)</option>
                <option value="대기">대기 (Pending)</option>
                <option value="예정">예정 (Scheduled)</option>
              </select>
            </div>
          </div>

          {/* Memo */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              비고 / 메모
            </label>
            <textarea
              rows="2"
              placeholder="관련 계약번호, 영수증 번호, 세부 사항 등을 기록하세요."
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              {editingItem ? "수정 내용 저장" : "등록하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
