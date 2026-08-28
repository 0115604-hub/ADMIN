import * as XLSX from "xlsx";

// 16 Standard Categories Mapping Dictionary
export const CATEGORY_RULES = {
  raw_materials: {
    id: "raw_materials",
    name: "원자재",
    group: "제조 직접 원가",
    keywords: ["해동무역", "화승알앤에이", "우진금속", "화승케미칼", "화승코퍼레이션", "경기금속", "세동", "대윤오토모티브", "cmb", "sts", "bracket", "sus", "고무", "원자재", "소재"]
  },
  sub_materials: {
    id: "sub_materials",
    name: "부자재",
    group: "제조 직접 원가",
    keywords: ["화승네트웍스", "이노켐", "효신산업", "타스인터내셔날", "영우", "우봉", "케이에스", "삼도산업", "삼신포장", "버원시스템", "아론켐", "와이어", "chemlok", "pad", "테이프", "라벨", "클립", "가위"]
  },
  packaging_materials: {
    id: "packaging_materials",
    name: "포장 부자재",
    group: "제조 직접 원가",
    keywords: ["광진포장", "성환패키지", "단칼", "파렛트", "지관", "박스", "포장", "골판지", "비닐", "필름"]
  },
  outsourcing_costs: {
    id: "outsourcing_costs",
    name: "임가공비",
    group: "제조 직접 원가",
    keywords: ["한울", "엘케이오토", "부림텍", "에스에이치씨", "유성", "태경테크", "조영산업", "오륙공사", "가공비", "임가공", "외주", "도장", "조립"]
  },
  salaries_labor: {
    id: "salaries_labor",
    name: "노무비 (급여)",
    group: "인건비 & 공과금",
    keywords: ["급여", "임금", "상여", "퇴직", "생산직", "관리직", "일용직", "노무비"]
  },
  taxes_social_insurance: {
    id: "taxes_social_insurance",
    name: "공과금 (4대보험/세금)",
    group: "인건비 & 공과금",
    keywords: ["국민건강", "국민연금", "근로복지", "세무서", "구청", "시청", "사회보험", "소득세", "지방세", "부가가치세", "법인세", "주민세", "공과금"]
  },
  welfare_meals: {
    id: "welfare_meals",
    name: "복리후생비 (식대)",
    group: "인건비 & 공과금",
    keywords: ["큰상", "웰빙푸드", "새한유통", "에스케이인텔릭스", "식대", "구내식당", "생수", "정수기", "음료", "회식", "복리"]
  },
  electricity_utilities: {
    id: "electricity_utilities",
    name: "전력비 (전기요금)",
    group: "공장 유틸리티 & 설비",
    keywords: ["한국전력공사", "한전", "전기요금", "전력", "전기세", "동력", "한전"]
  },
  rent_leases: {
    id: "rent_leases",
    name: "임대료",
    group: "공장 유틸리티 & 설비",
    keywords: ["임대료", "설비임대", "공장임대", "사무실임대", "월세", "차임"]
  },
  waste_disposal: {
    id: "waste_disposal",
    name: "산업폐기물처리비",
    group: "공장 유틸리티 & 설비",
    keywords: ["한국알앤티", "정성", "일성에너지", "대성환경", "제일고물상", "폐고무", "폐기물", "스크랩", "폐합성", "고물", "분리수거"]
  },
  consumables_tools: {
    id: "consumables_tools",
    name: "소모품비 (공구)",
    group: "공장 유틸리티 & 설비",
    keywords: ["미전종합공구", "금조종합상사", "금화종합상사", "공구", "니플", "보루", "장갑", "소모품", "철물", "자재"]
  },
  repairs_maintenance: {
    id: "repairs_maintenance",
    name: "수선비 / 설비보전",
    group: "공장 유틸리티 & 설비",
    keywords: ["동원정보통신", "대한콘트롤", "수리", "수선", "보수", "plc", "프로그램", "배터리", "기계수리", "설비보전"]
  },
  logistics_transport: {
    id: "logistics_transport",
    name: "물류비 (운송/유류)",
    group: "물류 & 운영 경비",
    keywords: ["삼계셀프", "만포주유소", "파이팅물류", "오케이 퀵", "용진운수", "클라크", "한율", "현대캐피탈", "롯데렌탈", "제이엠로지스", "팔도차량", "김해고속화물", "아마존카", "주유", "경유", "운송", "화물", "퀵", "용달", "지게차", "렌트", "통근버스"]
  },
  fees_commissions: {
    id: "fees_commissions",
    name: "지급수수료",
    group: "물류 & 운영 경비",
    keywords: ["에스원", "대한소방", "경남안전기술단", "대일트랜스", "안전가스", "에프티에이", "세무회계", "영진사무기", "엘지유플러스", "율곡", "대붕엔지니어링", "대한전기안전", "대한산업안전", "케이티", "보안", "기장", "결산조정", "복합기", "통신", "노무", "안전관리", "수수료"]
  },
  financial_interests_cards: {
    id: "financial_interests_cards",
    name: "금융비용 (이자/카드)",
    group: "물류 & 운영 경비",
    keywords: ["대출이자", "차입금", "b2b", "어음할인", "카드", "비씨카드", "국민카드", "삼성카드", "현대카드", "우리카드", "신한카드", "교보", "dgb", "하나생명", "노란우산", "이자", "금융"]
  },
  misc_expenses: {
    id: "misc_expenses",
    name: "기타잡비 / 수수료",
    group: "물류 & 운영 경비",
    keywords: ["기사식대", "식대", "어음수수료", "sms", "수수료", "잡비", "기타"]
  }
};

// Auto classify vendor and item into 16 categories
export function classifyTaxInvoiceItem(vendor, item) {
  const text = `${vendor || ""} ${item || ""}`.toLowerCase();

  // 1. Check direct matches
  if (text.includes("화승알앤에이") && text.includes("임대")) return "rent_leases";
  if (text.includes("전력") || text.includes("한전") || text.includes("전기요금")) return "electricity_utilities";
  if (text.includes("폐고무") || text.includes("폐기물") || text.includes("스크랩")) return "waste_disposal";
  if (text.includes("식대") && (text.includes("큰상") || text.includes("웰빙"))) return "welfare_meals";
  if (text.includes("운송") || text.includes("화물") || text.includes("주유") || text.includes("렌탈") || text.includes("지게차")) return "logistics_transport";
  if (text.includes("박스") || text.includes("포장") || text.includes("광진")) return "packaging_materials";
  if (text.includes("가공비") || text.includes("임가공")) return "outsourcing_costs";

  // 2. Keyword loop
  for (const [catId, rule] of Object.entries(CATEGORY_RULES)) {
    for (const kw of rule.keywords) {
      if (text.includes(kw.toLowerCase())) {
        return catId;
      }
    }
  }

  // Default fallback to raw materials if large amount, or fees
  return "sub_materials";
}

// Parse a single Hometax Excel buffer
export function parseHometaxExcel(buffer, fileName = "") {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const ws = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (!rawRows || rawRows.length < 7) {
      throw new Error("유효한 홈택스 매입세금계산서 파일이 아닙니다.");
    }

    // Extract Company Entity Info from Row 1
    const row1 = rawRows[0] || [];
    const entityTaxNo = String(row1[1] || "").trim();
    const entityName = String(row1[3] || "").trim();

    // Determine Entity Key
    let entityKey = "company_1";
    let entityLabel = entityName || "매입세금계산서";

    if (entityTaxNo.includes("615-81-39247") || entityName.includes("오륙") && !entityName.includes("공사")) {
      entityKey = "oryuk_corp";
      entityLabel = "(주)오륙";
    } else if (entityTaxNo.includes("898-87-01289") || entityName.includes("조영산업") && entityName.includes("주")) {
      entityKey = "joyoung_corp";
      entityLabel = "(주)조영산업";
    } else if (entityName.includes("오륙공사")) {
      entityKey = "oryuk_gongsa";
      entityLabel = "오륙공사";
    } else if (entityName.includes("조영산업")) {
      entityKey = "joyoung_ind";
      entityLabel = "조영산업";
    }

    // Extract Rows starting from Row 7 (Index 6)
    const items = [];
    let totalSupply = 0;
    let totalTax = 0;
    let totalAmount = 0;

    for (let r = 6; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || !row[6]) continue; // Col 6 (G) is Supplier Name

      const vendor = String(row[6]).trim();
      const item = String(row[26] || row[11] || "물품대").trim();
      const supplyAmt = Number(row[15]) || 0;
      const taxAmt = Number(row[16]) || Math.round(supplyAmt * 0.1);
      const rowTotal = Number(row[14]) || (supplyAmt + taxAmt);
      const writeDate = String(row[0] || "").trim();
      const memo = String(row[32] || row[20] || "").trim();

      const categoryId = classifyTaxInvoiceItem(vendor, item);

      totalSupply += supplyAmt;
      totalTax += taxAmt;
      totalAmount += rowTotal;

      items.push({
        id: `${entityKey}_${r}_${Date.now()}`,
        sourceEntity: entityLabel,
        writeDate,
        vendor,
        item,
        supplyAmt,
        taxAmt,
        totalAmt: rowTotal,
        memo,
        categoryId
      });
    }

    return {
      success: true,
      fileName,
      entityKey,
      entityLabel,
      entityTaxNo,
      itemCount: items.length,
      totalSupply,
      totalTax,
      totalAmount,
      items
    };
  } catch (error) {
    console.error("Tax invoice parse error:", error);
    return {
      success: false,
      fileName,
      error: error.message
    };
  }
}
