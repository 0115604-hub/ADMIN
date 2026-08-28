import React, { useState, useEffect } from "react";
import {
  Calculator,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  TrendingUp,
  Building2,
  DollarSign,
  Layers,
  Factory,
  Zap,
  Truck,
  Users,
  ShieldCheck,
  CreditCard,
  FileSpreadsheet,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useMonth } from "../context/MonthContext";

// Standard 16-Category Template based on 2026.07 결산 Sheet
export const DEFAULT_CLOSING_DATA = {
  "2026-07": {
    rawMaterials: { name: "원자재", group: "제조원가", amount: 1780057490, note: "화승R&A(7.64억), 해동무역(3.30억), 화승코퍼(3.89억), 세동 등" },
    subMaterials: { name: "부자재", group: "제조원가", amount: 74061256, note: "화승네트웍스(와이어캐리어 4573만), 효신산업, 이노켐" },
    packaging: { name: "포장 부자재", group: "제조원가", amount: 30249725, note: "광진포장(1585만), 화승네트웍스(파렛트/지관), 성환패키지" },
    outsourcing: { name: "임가공비", group: "제조원가", amount: 290089776, note: "한울(1.20억), 엘케이오토(4758만), 부림텍(4060만), 에스에이치씨" },
    salaries: { name: "노무비 (급여)", group: "인건비", amount: 358781780, note: "주 오륙(2.01억), 주 조영산업(1.45억), 조영산업(1138만)" },
    taxesAndInsurance: { name: "공과금 (4대보험/세금)", group: "인건비", amount: 115666470, note: "4대보험(5254만), 부가세 분납(4822만), 소득세(1489만)" },
    welfare: { name: "복리후생비 (식대)", group: "인건비", amount: 17135990, note: "큰상웰빙푸드 구내식대(1425만 원), 새한유통 생수" },
    electricity: { name: "전력비 (전기요금)", group: "유틸리티", amount: 102333267, note: "한전 전기세(밀양/신천/주촌 8467만), 유성(1204만), 부림텍" },
    rent: { name: "임대료", group: "유틸리티", amount: 10779340, note: "㈜화승알앤에이 설비 임대료 (979.9만 원 + 부가세)" },
    wasteDisposal: { name: "산업폐기물처리비", group: "유틸리티", amount: 6736990, note: "한국알앤티(폐고무 237만), 대성환경, 일성에너지" },
    supplies: { name: "소모품비 (공구)", group: "유틸리티", amount: 2932930, note: "미전종합공구, 금조종합상사, 금화종합상사" },
    maintenance: { name: "수선비 / 설비보전", group: "유틸리티", amount: 1419000, note: "대한콘트롤(PLC 프로그램/배터리 교체), 동원정보통신" },
    logistics: { name: "물류비 (운송/유류)", group: "운영경비", amount: 47288671, note: "주유대(1148만), 고속화물/제이엠/한율 운송료, 지게차 렌탈" },
    fees: { name: "지급수수료", group: "운영경비", amount: 8832754, note: "에스원 보안, 세무사 기장/조정료, 노무법인, 안전관리 대행" },
    financialInterest: { name: "금융비용 (이자/카드)", group: "운영경비", amount: 115726662, note: "대출이자(5942만), 법인카드(4690만), 단체보험/공제" },
    misc: { name: "기타잡비 / 수수료", group: "운영경비", amount: 632700, note: "기사식대(62.8만 원), 전자어음/SMS 수수료" }
  },
  "2026-08": {
    rawMaterials: { name: "원자재", group: "제조원가", amount: 780400885, note: "화승R&A, 화승소재 TPE/EPDM" },
    subMaterials: { name: "부자재", group: "제조원가", amount: 38500000, note: "와이어캐리어, 클립, 패드류" },
    packaging: { name: "포장 부자재", group: "제조원가", amount: 21300000, note: "골판지 박스, 비닐, 라벨지" },
    outsourcing: { name: "임가공비", group: "제조원가", amount: 145000000, note: "외주 가공 및 임가공비" },
    salaries: { name: "노무비 (급여)", group: "인건비", amount: 295000000, note: "삼랑진/한림 공장 생산직 및 관리직 급여" },
    taxesAndInsurance: { name: "공과금 (4대보험/세금)", group: "인건비", amount: 98000000, note: "4대보험 및 제세공과금" },
    welfare: { name: "복리후생비 (식대)", group: "인건비", amount: 15400000, note: "구내식당 식대 및 생수" },
    electricity: { name: "전력비 (전기요금)", group: "유틸리티", amount: 96500000, note: "공장 가동 한전 전기세" },
    rent: { name: "임대료", group: "유틸리티", amount: 10779340, note: "설비 및 공장 임대료" },
    wasteDisposal: { name: "산업폐기물처리비", group: "유틸리티", amount: 5900000, note: "폐고무 및 합성수지 처리비" },
    supplies: { name: "소모품비 (공구)", group: "유틸리티", amount: 2500000, note: "공구 및 현장 소모품" },
    maintenance: { name: "수선비 / 설비보전", group: "유틸리티", amount: 1800000, note: "압출 라인 정기 수선비" },
    logistics: { name: "물류비 (운송/유류)", group: "운영경비", amount: 39500000, note: "납품 화물 운송료 및 유류대" },
    fees: { name: "지급수수료", group: "운영경비", amount: 8200000, note: "기장료, 노무자문, 안전대행료" },
    financialInterest: { name: "금융비용 (이자/카드)", group: "운영경비", amount: 85000000, note: "차입금 이자 및 법인카드" },
    misc: { name: "기타잡비 / 수수료", group: "운영경비", amount: 520000, note: "기사식대 및 부대비용" }
  }
};

const GROUPS = [
  { id: "제조원가", label: "🏭 제조 직접 원가", icon: Factory, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
  { id: "인건비", label: "👥 인건비 & 공과금", icon: Users, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  { id: "유틸리티", label: "⚡ 공장 유틸리티 & 설비", icon: Zap, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
  { id: "운영경비", label: "🚚 물류 & 운영 경비", icon: Truck, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" }
];

export const ClosingLedgerView = () => {
  const { formatAmount } = useCurrency();
  const { selectedMonth, currentMonthData } = useMonth();

  const [closingStore, setClosingStore] = useState(() => {
    const saved = localStorage.getItem("monthly_closing_ledger_data");
    return saved ? JSON.parse(saved) : DEFAULT_CLOSING_DATA;
  });

  const monthParts = selectedMonth.split("-");
  const monthTitle = `${monthParts[0]}년 ${monthParts[1]}월`;

  // Get active month's closing data (or fallback to default)
  const currentClosing = closingStore[selectedMonth] || DEFAULT_CLOSING_DATA["2026-07"];

  // Local editing state
  const [formData, setFormData] = useState(currentClosing);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync formData when selected month changes
  useEffect(() => {
    const activeData = closingStore[selectedMonth] || DEFAULT_CLOSING_DATA[selectedMonth] || DEFAULT_CLOSING_DATA["2026-07"];
    setFormData(activeData);
    setSaveSuccess(false);
  }, [selectedMonth, closingStore]);

  // Calculate total closing amount
  const totalClosingAmount = Object.values(formData).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Monthly Total Revenue for comparison
  const totalSales = currentMonthData?.salesSummary?.totalSales || 0;
  const costRatio = totalSales > 0 ? ((totalClosingAmount / totalSales) * 100).toFixed(1) : "0.0";
  const netEstimatedProfit = totalSales - totalClosingAmount;

  // Handle number change
  const handleAmountChange = (key, val) => {
    const numeric = Number(val.replace(/[^0-9.-]+/g, "")) || 0;
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        amount: numeric
      }
    }));
  };

  // Handle note change
  const handleNoteChange = (key, val) => {
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        note: val
      }
    }));
  };

  // Save to persistent storage
  const handleSave = () => {
    const updatedStore = {
      ...closingStore,
      [selectedMonth]: formData
    };
    setClosingStore(updatedStore);
    localStorage.setItem("monthly_closing_ledger_data", JSON.stringify(updatedStore));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Reset to original Excel default
  const handleReset = () => {
    if (!window.confirm(`${monthTitle} 결산 데이터를 원본 엑셀 기본값으로 복원하시겠습니까?`)) return;
    const defaultData = DEFAULT_CLOSING_DATA[selectedMonth] || DEFAULT_CLOSING_DATA["2026-07"];
    setFormData(defaultData);
    const updatedStore = {
      ...closingStore,
      [selectedMonth]: defaultData
    };
    setClosingStore(updatedStore);
    localStorage.setItem("monthly_closing_ledger_data", JSON.stringify(updatedStore));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner & KPI Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Calculator className="w-3.5 h-3.5" />
              <span>{monthTitle} 16대 계정과목 결산 관리</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {monthTitle} 월간 결산 수치 입력 & 관리
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              원자재, 노무비, 임가공비, 공과금, 금융비용 등 16개 계정과목의 실적 수치를 직접 입력하고 저장합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>기본값 복원</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>수치 저장하기</span>
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{monthTitle} 16개 결산 과목 수치가 안전하게 저장되었습니다!</span>
          </div>
        </div>
      )}

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Closing Cost */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">{monthTitle} 총 결산 지출(매입)</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {formatAmount(totalClosingAmount)}
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              16개 계정과목 합산 총액
            </p>
          </div>
        </div>

        {/* Cost Ratio to Sales */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">매출 대비 결산 비용 비율</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {costRatio}%
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              {monthTitle} 총 매출 {formatAmount(totalSales)} 기준
            </p>
          </div>
        </div>

        {/* Estimated Net Operating Profit */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">결산 반영 예상 손익</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-2xl sm:text-3xl font-black ${netEstimatedProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
              {netEstimatedProfit >= 0 ? "+" : ""}{formatAmount(netEstimatedProfit)}
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              매출액 - 16개 결산비용 차액
            </p>
          </div>
        </div>
      </div>

      {/* 4 Major Groups: Editable Form */}
      <div className="space-y-6">
        {GROUPS.map((grp) => {
          const GroupIcon = grp.icon;
          // Filter items belonging to this group
          const groupItems = Object.entries(formData).filter(([_, item]) => item.group === grp.id);
          const groupSubtotal = groupItems.reduce((s, [_, it]) => s + (Number(it.amount) || 0), 0);
          const groupShare = totalClosingAmount > 0 ? ((groupSubtotal / totalClosingAmount) * 100).toFixed(1) : 0;

          return (
            <div
              key={grp.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5"
            >
              {/* Group Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${grp.bg} ${grp.color}`}>
                    <GroupIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {grp.label}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {groupItems.length}개 과목 • 소계: <strong className="text-slate-900 dark:text-white">{formatAmount(groupSubtotal)}</strong> ({groupShare}%)
                    </p>
                  </div>
                </div>

                <div className="text-xs font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  소계: {formatAmount(groupSubtotal)}
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupItems.map(([key, item]) => {
                  const itemShare = totalClosingAmount > 0 ? ((Number(item.amount) / totalClosingAmount) * 100).toFixed(2) : 0;

                  return (
                    <div
                      key={key}
                      className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <label className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                          <span>{item.name}</span>
                        </label>
                        <span className="text-[11px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                          점유율 {itemShare}%
                        </span>
                      </div>

                      {/* Amount Input */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          결산 금액 (원)
                        </span>
                        <div className="relative">
                          <input
                            type="text"
                            value={Number(item.amount || 0).toLocaleString()}
                            onChange={(e) => handleAmountChange(key, e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-base text-right pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="absolute right-3 top-3 text-xs font-bold text-slate-400 pointer-events-none">
                            원
                          </span>
                        </div>
                      </div>

                      {/* Note / Memo Input */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          주요 거래처 및 세부 메모
                        </span>
                        <input
                          type="text"
                          placeholder="거래처 및 세부 지출 내용 입력..."
                          value={item.note || ""}
                          onChange={(e) => handleNoteChange(key, e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-6 right-6 z-30 flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-xl shadow-blue-500/30 active:scale-95 transition-all"
        >
          <Save className="w-5 h-5" />
          <span>{monthTitle} 결산 수치 저장</span>
        </button>
      </div>
    </div>
  );
};
