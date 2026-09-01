import * as XLSX from "xlsx";

export function parseManualClosingExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  
  // Find matching sheet
  let ws = null;
  for (const name of workbook.SheetNames) {
    if (name.includes("노무비") || name.includes("수기결산") || name.includes("결산") || name.includes("통합")) {
      ws = workbook.Sheets[name];
      break;
    }
  }
  if (!ws) ws = workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  
  const manualLedger = {
    labor: {
      oryuk_reg: 0,
      oryuk_unreg: 0,
      oryuk_foreign: 0,
      oryuk_expense: 0,
      ogong_reg: 0,
      ogong_unreg: 0,
      ogong_foreign: 0,
      ogong_expense: 0,
      joyoung_corp_reg: 0,
      joyoung_corp_unreg: 0,
      joyoung_corp_foreign: 0,
      joyoung_corp_expense: 0,
      joyoung_ind_reg: 0,
      joyoung_ind_unreg: 0,
      joyoung_ind_foreign: 0,
      joyoung_ind_expense: 0
    },
    loanInterest: {
      oryuk_9600: 0,
      oryuk_7501: 0,
      oryuk_0701: 0,
      oryuk_6002: 0,
      oryuk_1302: 0,
      oryuk_0109: 0,
      oryuk_2400: 0,
      oryuk_dgb: 0,
      oryuk_minus: 0,
      oryuk_sangseung: 0,
      oryuk_b2b: 0,
      oryuk_hwaseung: 0,
      joyoung_corp_25억: 0,
      joyoung_corp_3억29: 0,
      joyoung_corp_2억: 0,
      joyoung_ind_5억: 0,
      joyoung_ind_2억: 0,
      joyoung_ind_1억: 0,
      joyoung_ind_samsung: 0,
      joyoung_ind_kb: 0,
      joyoung_ind_dgb: 0,
      joyoung_ind_noran: 0,
      ogong_noran: 0
    },
    cards: {
      oryuk_bc: 0,
      joyoung_bc: 0,
      ogong_kb: 0,
      choi_kb: 0,
      samsung: 0,
      hyundai: 0,
      woori: 0,
      shinhan: 0
    },
    insurance: {
      oryuk_kyobo: 0,
      oryuk_dgb: 0,
      joyoung_corp_kyobo: 0,
      joyoung_corp_hana: 0,
      ogong_noran: 0,
      ogong_kyobo: 0,
      joyoung_ind_kyobo: 0,
      joyoung_ind_noran: 0,
      choi_dgb: 0
    },
    publicCharges: {
      oryuk_social: 0,
      oryuk_income: 0,
      oryuk_local: 0,
      oryuk_corp: 0,
      oryuk_vat: 0,
      joyoung_corp_social: 0,
      joyoung_corp_income: 0,
      joyoung_corp_local: 0,
      joyoung_corp_vat: 0,
      joyoung_ind_social: 0,
      joyoung_ind_income: 0,
      joyoung_ind_local: 0,
      joyoung_ind_vat: 0,
      ogong_social: 0,
      ogong_income: 0,
      ogong_local: 0,
      ogong_vat: 0,
      park_social: 0
    },
    misc: {
      ebill_sedong: 0,
      alba_cost: 0,
      driver_meals: 0,
      etc_misc: 0
    }
  };

  let currentSection = "";
  let currentCompany = "";
  let extractedCount = 0;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || [];
    if (row.length === 0) continue;

    // Detect if column A exists or if columns shifted
    let colMajor = "";
    let colComp = "";
    let colItem = "";
    let colAmt = undefined;

    // Scan the row to locate fields flexibly
    if (row[0] && typeof row[0] === "string" && (row[0].includes("노무비") || row[0].includes("대출이자") || row[0].includes("카드") || row[0].includes("공제") || row[0].includes("보험") || row[0].includes("공과금") || row[0].includes("기타잡비"))) {
      colMajor = String(row[0]).trim();
    }

    if (row[1] && typeof row[1] === "string" && (row[1].includes("오륙") || row[1].includes("조영") || row[1].includes("최미영") || row[1].includes("박덕상") || row[1].includes("공통") || row[1].includes("오공"))) {
      colComp = String(row[1]).trim();
    }

    colItem = String(row[2] || "").trim();
    colAmt = row[3];

    // If shifted by 1 col (e.g. empty Col A)
    if (!colItem && row[3]) {
      colItem = String(row[3] || "").trim();
      colAmt = row[4];
    }

    // Update stateful section & company
    if (colMajor) {
      if (colMajor.includes("노무비")) currentSection = "labor";
      else if (colMajor.includes("대출이자")) currentSection = "loanInterest";
      else if (colMajor.includes("신용카드") || colMajor.includes("카드")) currentSection = "cards";
      else if (colMajor.includes("공제") || colMajor.includes("보험")) currentSection = "insurance";
      else if (colMajor.includes("공과금") || colMajor.includes("제세공과")) currentSection = "publicCharges";
      else if (colMajor.includes("기타잡비") || colMajor.includes("수수료")) currentSection = "misc";
    }

    if (colComp) {
      if (colComp.includes("주") && colComp.includes("오륙")) currentCompany = "oryuk";
      else if (colComp.includes("오륙공사") || colComp.includes("오공")) currentCompany = "ogong";
      else if (colComp.includes("주") && colComp.includes("조영")) currentCompany = "joyoung_corp";
      else if (colComp.includes("조영")) currentCompany = "joyoung_ind";
      else if (colComp.includes("최미영")) currentCompany = "choi";
      else if (colComp.includes("박덕상")) currentCompany = "park";
      else if (colComp.includes("공통")) currentCompany = "common";
      else if (colComp.includes("오륙")) currentCompany = "oryuk";
    }

    if (!colItem || colItem.includes("합계") || colItem.includes("소계") || colItem.includes("항목명") || colItem.includes("총합계") || colItem.includes("용도") || colItem.includes("결산표")) {
      continue;
    }

    const num = Number(String(colAmt !== undefined ? colAmt : 0).replace(/[^0-9.-]+/g, "")) || 0;

    // 1. Labor
    if (currentSection === "labor" && currentCompany) {
      let itemKey = "";
      if (colItem.includes("등록") && !colItem.includes("미등록")) itemKey = "reg";
      else if (colItem.includes("미등록")) itemKey = "unreg";
      else if (colItem.includes("출국") || colItem.includes("외국인")) itemKey = "foreign";
      else if (colItem.includes("지출결의서")) itemKey = "expense";

      if (itemKey) {
        manualLedger.labor[`${currentCompany}_${itemKey}`] = num;
        extractedCount++;
      }
    }

    // 2. Loan Interest
    else if (currentSection === "loanInterest") {
      if (currentCompany === "oryuk") {
        if (colItem.includes("9600")) manualLedger.loanInterest.oryuk_9600 = num;
        else if (colItem.includes("7501")) manualLedger.loanInterest.oryuk_7501 = num;
        else if (colItem.includes("0701") || colItem.includes("701")) manualLedger.loanInterest.oryuk_0701 = num;
        else if (colItem.includes("6002")) manualLedger.loanInterest.oryuk_6002 = num;
        else if (colItem.includes("1302")) manualLedger.loanInterest.oryuk_1302 = num;
        else if (colItem.includes("0109") || colItem.includes("109")) manualLedger.loanInterest.oryuk_0109 = num;
        else if (colItem.includes("2400")) manualLedger.loanInterest.oryuk_2400 = num;
        else if (colItem.includes("DGB")) manualLedger.loanInterest.oryuk_dgb = num;
        else if (colItem.includes("마이너스")) manualLedger.loanInterest.oryuk_minus = num;
        else if (colItem.includes("상승")) manualLedger.loanInterest.oryuk_sangseung = num;
        else if (colItem.includes("B2B") || colItem.includes("어음")) manualLedger.loanInterest.oryuk_b2b = num;
        else if (colItem.includes("화승") || colItem.includes("선급금")) manualLedger.loanInterest.oryuk_hwaseung = num;
        extractedCount++;
      } else if (currentCompany === "joyoung_corp") {
        if (colItem.includes("25억") || colItem.includes("2,500,000,000")) manualLedger.loanInterest.joyoung_corp_25억 = num;
        else if (colItem.includes("3억29") || colItem.includes("3.29") || colItem.includes("329,000,000")) manualLedger.loanInterest.joyoung_corp_3억29 = num;
        else if (colItem.includes("2억") || colItem.includes("200,000,000")) manualLedger.loanInterest.joyoung_corp_2억 = num;
        extractedCount++;
      } else if (currentCompany === "joyoung_ind") {
        if (colItem.includes("5억") || colItem.includes("500,000,000")) manualLedger.loanInterest.joyoung_ind_5억 = num;
        else if (colItem.includes("2억") || colItem.includes("200,000,000")) manualLedger.loanInterest.joyoung_ind_2억 = num;
        else if (colItem.includes("1억") || colItem.includes("100,000,000")) manualLedger.loanInterest.joyoung_ind_1억 = num;
        else if (colItem.includes("삼성")) manualLedger.loanInterest.joyoung_ind_samsung = num;
        else if (colItem.includes("KB")) manualLedger.loanInterest.joyoung_ind_kb = num;
        else if (colItem.includes("DGB")) manualLedger.loanInterest.joyoung_ind_dgb = num;
        else if (colItem.includes("노란우산")) manualLedger.loanInterest.joyoung_ind_noran = num;
        extractedCount++;
      } else if (currentCompany === "ogong") {
        if (colItem.includes("노란우산")) manualLedger.loanInterest.ogong_noran = num;
        extractedCount++;
      }
    }

    // 3. Cards
    else if (currentSection === "cards") {
      if (colItem.includes("오륙") && colItem.includes("BC")) manualLedger.cards.oryuk_bc = num;
      else if (colItem.includes("조영") && colItem.includes("BC")) manualLedger.cards.joyoung_bc = num;
      else if (colItem.includes("오공") && colItem.includes("KB")) manualLedger.cards.ogong_kb = num;
      else if (colItem.includes("최미영")) manualLedger.cards.choi_kb = num;
      else if (colItem.includes("삼성")) manualLedger.cards.samsung = num;
      else if (colItem.includes("현대")) manualLedger.cards.hyundai = num;
      else if (colItem.includes("우리")) manualLedger.cards.woori = num;
      else if (colItem.includes("신한")) manualLedger.cards.shinhan = num;
      extractedCount++;
    }

    // 4. Insurance
    else if (currentSection === "insurance") {
      if (currentCompany === "oryuk") {
        if (colItem.includes("교보")) manualLedger.insurance.oryuk_kyobo = num;
        else if (colItem.includes("DGB")) manualLedger.insurance.oryuk_dgb = num;
      } else if (currentCompany === "joyoung_corp") {
        if (colItem.includes("교보")) manualLedger.insurance.joyoung_corp_kyobo = num;
        else if (colItem.includes("하나")) manualLedger.insurance.joyoung_corp_hana = num;
      } else if (currentCompany === "ogong") {
        if (colItem.includes("노란우산")) manualLedger.insurance.ogong_noran = num;
        else if (colItem.includes("교보")) manualLedger.insurance.ogong_kyobo = num;
      } else if (currentCompany === "joyoung_ind") {
        if (colItem.includes("교보")) manualLedger.insurance.joyoung_ind_kyobo = num;
        else if (colItem.includes("노란우산")) manualLedger.insurance.joyoung_ind_noran = num;
      } else if (currentCompany === "choi") {
        if (colItem.includes("DGB")) manualLedger.insurance.choi_dgb = num;
      }
      extractedCount++;
    }

    // 5. Public Charges
    else if (currentSection === "publicCharges") {
      if (currentCompany === "oryuk") {
        if (colItem.includes("4대보험")) manualLedger.publicCharges.oryuk_social = num;
        else if (colItem.includes("소득세")) manualLedger.publicCharges.oryuk_income = num;
        else if (colItem.includes("주민세") || colItem.includes("지방소득세")) manualLedger.publicCharges.oryuk_local = num;
        else if (colItem.includes("법인세")) manualLedger.publicCharges.oryuk_corp = num;
        else if (colItem.includes("부가세")) manualLedger.publicCharges.oryuk_vat = num;
      } else if (currentCompany === "joyoung_corp") {
        if (colItem.includes("4대보험")) manualLedger.publicCharges.joyoung_corp_social = num;
        else if (colItem.includes("소득세")) manualLedger.publicCharges.joyoung_corp_income = num;
        else if (colItem.includes("주민세") || colItem.includes("지방소득세")) manualLedger.publicCharges.joyoung_corp_local = num;
        else if (colItem.includes("부가세")) manualLedger.publicCharges.joyoung_corp_vat = num;
      } else if (currentCompany === "joyoung_ind") {
        if (colItem.includes("4대보험")) manualLedger.publicCharges.joyoung_ind_social = num;
        else if (colItem.includes("소득세")) manualLedger.publicCharges.joyoung_ind_income = num;
        else if (colItem.includes("주민세") || colItem.includes("지방소득세")) manualLedger.publicCharges.joyoung_ind_local = num;
        else if (colItem.includes("부가세")) manualLedger.publicCharges.joyoung_ind_vat = num;
      } else if (currentCompany === "ogong") {
        if (colItem.includes("4대보험")) manualLedger.publicCharges.ogong_social = num;
        else if (colItem.includes("소득세")) manualLedger.publicCharges.ogong_income = num;
        else if (colItem.includes("주민세") || colItem.includes("지방소득세")) manualLedger.publicCharges.ogong_local = num;
        else if (colItem.includes("부가세")) manualLedger.publicCharges.ogong_vat = num;
      } else if (currentCompany === "park") {
        if (colItem.includes("4대보험")) manualLedger.publicCharges.park_social = num;
      }
      extractedCount++;
    }

    // 6. Misc
    else if (currentSection === "misc") {
      let category = "기타잡비";
      if (colItem.includes("어음") || colItem.includes("세동") || colItem.includes("화승")) category = "전자어음수수료";
      else if (colItem.includes("SMS") || colItem.includes("우리은행")) category = "SMS수수료";
      else if (colItem.includes("알바비") || colItem.includes("일용") || colItem.includes("최영식") || colItem.includes("김현우") || colItem.includes("이남성") || colItem.includes("이석현")) category = "알바비";
      else if (colItem.includes("식대") || colItem.includes("용진") || colItem.includes("한울") || colItem.includes("조영1") || colItem.includes("조영2")) category = "기사식대";

      if (!manualLedger.miscItems) manualLedger.miscItems = [];
      manualLedger.miscItems.push({
        id: "misc_" + (manualLedger.miscItems.length + 1) + "_" + Math.random().toString(36).substring(2, 6),
        category,
        name: colItem,
        amount: num,
        memo: row[4] ? String(row[4]).trim() : ""
      });

      if (colItem.includes("세동")) manualLedger.misc.ebill_sedong = num;
      else if (colItem.includes("화승")) manualLedger.misc.ebill_hwaseung = num;
      else if (colItem.includes("우리은행")) manualLedger.misc.sms_woori = num;
      else if (colItem.includes("최영식")) manualLedger.misc.part_cys = num;
      else if (colItem.includes("김현우")) manualLedger.misc.part_khw = num;
      else if (colItem.includes("이남성")) manualLedger.misc.part_lns = num;
      else if (colItem.includes("이석현")) manualLedger.misc.part_lsh = num;
      else if (colItem.includes("용진")) manualLedger.misc.meal_yongjin = num;
      else if (colItem.includes("한울")) manualLedger.misc.meal_hanul = num;
      else if (colItem.includes("조영1")) manualLedger.misc.meal_joyoung1 = num;
      else if (colItem.includes("조영2")) manualLedger.misc.meal_joyoung2 = num;
      extractedCount++;
    }
  }

  return { manualLedger, extractedCount };
}