// Master Purchasing & Cost Data (2026년 07월)
// Total Purchasing: ₩3,062,814,007 (125 items across 12 categories)
// Master Summary Benchmark: ₩1,831,147,543.4 (전월比 +71,999,790.4)

import rawPurchasingItems from "./purchasing202607.json";

export const MASTER_PURCHASE_SUMMARY = {
  yearMonth: "2026-07",
  totalExpenses: 3062814007,
  ledgerBenchmark: 1831147543.4,
  prevMonthBenchmark: 1759147753,
  momDiff: 71999790.4,
  itemCount: rawPurchasingItems.length,
  categoryCount: 12
};

export const MASTER_PURCHASE_CATEGORIES = [
  {
    category: "원자재",
    label: "원자재 매입",
    count: 11,
    totalAmount: 1848089555,
    share: 60.34,
    color: "#EF4444",
    mainSuppliers: "해동무역, 화승알앤에이, 화승코퍼레이션, 세동, 우진금속"
  },
  {
    category: "임가공비",
    label: "외주 가공비",
    count: 8,
    totalAmount: 966480256,
    share: 31.55,
    color: "#F97316",
    mainSuppliers: "(주)조영산업, 한울, 오륙공사, 부림텍, 엘케이오토, 에스에이치씨"
  },
  {
    category: "부자재",
    label: "부자재 매입",
    count: 17,
    totalAmount: 85659438,
    share: 2.80,
    color: "#EAB308",
    mainSuppliers: "(주)화승네트웍스, 효신산업, 삼도산업, 대윤오토모티브, OK버원시스템"
  },
  {
    category: "전력비",
    label: "공장 전력요금",
    count: 19,
    totalAmount: 79940633,
    share: 2.61,
    color: "#06B6D4",
    mainSuppliers: "한국전력공사(다수 지점), 유성, 한울, 부림텍, 오륙공사"
  },
  {
    category: "물류비",
    label: "물류 및 운송비",
    count: 19,
    totalAmount: 24421221,
    share: 0.80,
    color: "#3B82F6",
    mainSuppliers: "용진운수, 한율, 제이엠로지스, 김해고속화물, 삼계셀프주유소"
  },
  {
    category: "포장부자재",
    label: "포장 부자재",
    count: 4,
    totalAmount: 14910770,
    share: 0.49,
    color: "#8B5CF6",
    mainSuppliers: "(주)광진포장, 화승네트웍스, 성환패키지"
  },
  {
    category: "복리후생비",
    label: "식대 및 복리후생",
    count: 6,
    totalAmount: 12863180,
    share: 0.42,
    color: "#10B981",
    mainSuppliers: "큰상 웰빙푸드, 새한유통, 에스케이인텔릭스"
  },
  {
    category: "임대료",
    label: "설비 및 공장 임대료",
    count: 3,
    totalAmount: 12217340,
    share: 0.40,
    color: "#6366F1",
    mainSuppliers: "(주)화승알앤에이(설비임대), 이지콤프레셔"
  },
  {
    category: "수선비/설비",
    label: "수선비 및 설비공사",
    count: 2,
    totalAmount: 7018000,
    share: 0.23,
    color: "#14B8A6",
    mainSuppliers: "조은건설(창호·방화문), 건영전기(전등)"
  },
  {
    category: "지급수수료",
    label: "기장/보안/안전수수료",
    count: 27,
    totalAmount: 6317614,
    share: 0.21,
    color: "#64748B",
    mainSuppliers: "부산진세무회계, 에스원, 전기안전관리, 노무법인 율곡, 경남안전기술단"
  },
  {
    category: "산폐비",
    label: "산업폐기물 처리비",
    count: 5,
    totalAmount: 3045280,
    share: 0.10,
    color: "#78716C",
    mainSuppliers: "(주)한국알앤티, 일성에너지, 주식회사 정성, 제일고물상"
  },
  {
    category: "소모품/공구",
    label: "소모품 및 공구비",
    count: 3,
    totalAmount: 1850720,
    share: 0.06,
    color: "#A855F7",
    mainSuppliers: "김해종합가스, 금화종합상사, 미전종합공구"
  }
];

export const MASTER_PURCHASE_ITEMS = rawPurchasingItems || [];
