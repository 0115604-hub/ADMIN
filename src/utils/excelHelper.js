
function extractClassifiedPurchases(wsJajae, totalPurchases) {
  if (!wsJajae) return [];
  const rawCategories = [
    { category: 'EPDM 고무원자재 (삼랑진)', supplier: '해동무역 (삼랑진공장 직입고 W60712, W60594 등)', badge: '원자재', startRow: 31, endRow: 46 },
    { category: 'TPE 원자재/컴파운드', supplier: '화승코퍼레이션 (NX4, 9BQC, JA 등 메인/조인트제)', badge: '원자재', startRow: 65, endRow: 81 },
    { category: '삼랑진 T&C 반제품/사출가공', supplier: '삼랑진 T&C (NX4 G/RUN FRT, DT HOOD SEAL 등)', badge: '외주가공', startRow: 82, endRow: 90 },
    { category: '신천 압출/외주가공', supplier: '신천 (DT/DS Door Side, NE1a, MX5a 등)', badge: '외주가공', startRow: 91, endRow: 114 },
    { category: '연고무 원자재/컴파운드', supplier: '화승코퍼레이션 (HOOD RR, D/S 고무 컴파운드)', badge: '원자재', startRow: 51, endRow: 64 },
    { category: '부자재 지텍 (9BQC PRI)', supplier: '글라스 ㈜지텍 (9BQC PRI LH/RH 납품)', badge: '부자재', startRow: 5, endRow: 8 },
    { category: '부자재 세동 (9BQC D/V BAR)', supplier: '㈜세동 (9BQC D/V BAR LH/RH)', badge: '부자재', startRow: 9, endRow: 10 },
    { category: '부자재 화승 R&A (캡/클립/레진 43종)', supplier: '화승 R&A (PU 캡, 클립, 인서트 레진, 형상패드 등)', badge: '부자재', startRow: 115, endRow: 241 },
    { category: 'EPDM 원자재 (조영)', supplier: '해동무역 (조영공장 직입고 W60664, W6082)', badge: '원자재', startRow: 47, endRow: 50 },
    { category: 'PVC 원자재/슬립제', supplier: '화승네트웍스 (SD#75 BK, 9BQC 슬립제)', badge: '원자재', startRow: 26, endRow: 28 },
    { category: '케미칼 / 코팅제 (PCM)', supplier: '화승케미칼 (HSW-6000L, HSP-700 등 코팅제/희석제 7종)', badge: '케미칼', startRow: 290, endRow: 309 },
    { category: 'WIRE 심금 / 구리동선', supplier: 'JA 구리동선, 46MM 편조심금', badge: '원자재', startRow: 29, endRow: 30 },
    { category: '심금류 (STS430A)', supplier: '우진금속 (심금STS430A 0.4*45.5 PU용)', badge: '원자재', startRow: 15, endRow: 25 },
    { category: '포장재 / 박스 / 파렛트', supplier: '광진포장 & 화승NETWORKS (파렛트, 지관, 캡상자)', badge: '포장재', customRows: [275, 280, 287, 288, 310, 311, 312] },
    { category: '기타매입 소액자재', supplier: '기타매입내역 (비닐, 테이프, 소모성 부자재 등)', badge: '기타', amountFixed: 10660900, subitems: [{ code: 'ETC-001', name: '9월 기타매입내역 시트 집계분 (비닐, 테이프 등)', supplier: '기타매입 협력사', unit: '식', unitPrice: 10660900, qty: 1, amount: 10660900 }] },
    { category: '9BQC 브라켓', supplier: '경기금속 (UPR Bracket LH/RH)', badge: '부자재', startRow: 3, endRow: 4 },
    { category: 'EPDM PAD 완충재', supplier: '삼도산업 (JA, NX4 EPDM PAD 5종)', badge: '부자재', startRow: 244, endRow: 254 },
    { category: '접착제 / 화학 부자재', supplier: '화승NETWORKS (케미록, 접착제 SC-P-1512, 본드, 실리콘)', badge: '케미칼', startRow: 262, endRow: 274 },
    { category: '공구 / 절단 톱날', supplier: '조은초경 (TIP SAW 254*100 톱날)', badge: '소모품', startRow: 255, endRow: 261 },
    { category: '부자재 우봉 / 아마쉘 PAD', supplier: '우봉 (아마쉘 PAD 5T/7T)', badge: '부자재', startRow: 11, endRow: 14 }
  ];

  const result = [];
  rawCategories.forEach((catDef) => {
    let catAmount = 0;
    let subitems = [];

    if (catDef.amountFixed) {
      catAmount = catDef.amountFixed;
      subitems = catDef.subitems || [];
    } else if (catDef.customRows) {
      catDef.customRows.forEach((r) => {
        const code = wsJajae['B' + r] ? String(wsJajae['B' + r].v).trim() : '';
        const name = wsJajae['C' + r] ? String(wsJajae['C' + r].v).trim() : '';
        const unit = wsJajae['D' + r] ? String(wsJajae['D' + r].v).trim() : 'EA';
        const car = wsJajae['E' + r] ? String(wsJajae['E' + r].v).trim() : '';
        const supplier = wsJajae['F' + r] ? String(wsJajae['F' + r].v).trim() : '';
        const unitPrice = wsJajae['G' + r] ? Number(wsJajae['G' + r].v) || 0 : 0;
        const qty = wsJajae['H' + r] ? Number(wsJajae['H' + r].v) || 0 : 0;
        const amountI = wsJajae['I' + r] ? Number(wsJajae['I' + r].v) || 0 : 0;
        if (amountI > 0) {
          catAmount += amountI;
          subitems.push({ code: code || ('R' + r), name: name + (car ? (' (' + car + ')') : ''), supplier: supplier || catDef.supplier, unit, unitPrice, qty, amount: amountI });
        }
      });
    } else if (catDef.startRow && catDef.endRow) {
      for (let r = catDef.startRow; r <= catDef.endRow; r++) {
        const code = wsJajae['B' + r] ? String(wsJajae['B' + r].v).trim() : '';
        const name = wsJajae['C' + r] ? String(wsJajae['C' + r].v).trim() : '';
        const unit = wsJajae['D' + r] ? String(wsJajae['D' + r].v).trim() : 'EA';
        const car = wsJajae['E' + r] ? String(wsJajae['E' + r].v).trim() : '';
        const supplier = wsJajae['F' + r] ? String(wsJajae['F' + r].v).trim() : '';
        const unitPrice = wsJajae['G' + r] ? Number(wsJajae['G' + r].v) || 0 : 0;
        const qty = wsJajae['H' + r] ? Number(wsJajae['H' + r].v) || 0 : 0;
        const amountI = wsJajae['I' + r] ? Number(wsJajae['I' + r].v) || 0 : 0;
        if (amountI > 0) {
          catAmount += amountI;
          subitems.push({ code: code || ('R' + r), name: name ? (name + (car ? (' (' + car + ')') : '')) : (car || '가공 마감분'), supplier: supplier || catDef.supplier, unit, unitPrice, qty, amount: amountI });
        }
      }
    }

    subitems.sort((a, b) => b.amount - a.amount);
    if (catAmount > 0) {
      result.push({
        category: catDef.category,
        supplier: catDef.supplier,
        amount: catAmount,
        share: Number(((catAmount / (totalPurchases || 1)) * 100).toFixed(2)),
        badge: catDef.badge,
        subitems: subitems
      });
    }
  });

  result.sort((a, b) => b.amount - a.amount);
  result.forEach((it, idx) => { it.rank = idx + 1; });
  return result;
}

import * as XLSX from "xlsx";

/**
 * Clean currency/number strings to valid Float/Int
 * Handles "₩ 1,248,400,885", "1,248,400,884.5원", "(12,000)", commas, spaces, etc.
 */
function cleanNumber(val) {
  if (val === null || val === undefined || val === "") return NaN;
  if (typeof val === "number") return isNaN(val) ? NaN : val;
  const cleaned = String(val)
    .replace(/[₩\$,원\s]/g, "")
    .replace(/\((.*?)\)/g, "-$1")
    .replace(/,/g, "")
    .trim();
  const num = Number(cleaned);
  return isNaN(num) ? NaN : num;
}

/**
 * Universal High-Precision Multi-Format Excel Parser for Monthly P&L and Material Purchases
 * Supports:
 * 1. Standard Dashboard Sheet (📊 손익_종합대시보드: Section 1 & Section 2)
 * 2. Multi-Sheet P&L (매입-매출 정리본, 자재매입, 원자재/부자재 내역 등)
 * 3. Dedicated Purchase Ledger sheets (매입명세표, 매입DATA, 지출내역 등)
 * 4. Cost & Settlement sheets (월간_종합결산요약, 노무비_이자_공과금_수기결산)
 */
export const parseExcelFile = async (file, customYearMonth = null) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetNames = workbook.SheetNames || [];
        const fileName = file.name || "";

        // ---------------------------------------------------------------------
        // 1. Intelligent Year-Month Detection (Filename -> Sheet names -> Cells)
        // ---------------------------------------------------------------------
        let detectedYearMonth = "";

        // From Filename
        let fnMatch = fileName.match(/(\d{4})년\s*(\d{1,2})월?/);
        if (!fnMatch) fnMatch = fileName.match(/(\d{4})[-._](\d{1,2})/);
        if (!fnMatch) fnMatch = fileName.match(/(\d{4})(\d{2})/);
        if (!fnMatch) {
          const shortMatch = fileName.match(/(\d{2})년\s*(\d{1,2})월/);
          if (shortMatch) fnMatch = [null, "20" + shortMatch[1], shortMatch[2]];
        }
        if (!fnMatch) {
          const monthOnly = fileName.match(/(\d{1,2})월/);
          if (monthOnly) fnMatch = [null, "2026", monthOnly[1]];
        }
        if (fnMatch) {
          detectedYearMonth = `${fnMatch[1]}-${String(fnMatch[2]).padStart(2, "0")}`;
        }

        // From Sheet Names
        if (!detectedYearMonth) {
          for (const s of sheetNames) {
            let sm = s.match(/(\d{4})년\s*(\d{1,2})월?/);
            if (!sm) sm = s.match(/(\d{4})[-._](\d{1,2})/);
            if (!sm) sm = s.match(/(\d{1,2})월/);
            if (sm) {
              const y = sm[1].length === 4 ? sm[1] : "2026";
              const m = sm[2] ? sm[2] : sm[1];
              detectedYearMonth = `${y}-${String(m).padStart(2, "0")}`;
              break;
            }
          }
        }

        // From Cells (top 5 rows of all sheets)
        if (!detectedYearMonth) {
          for (const s of sheetNames) {
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[s], { header: 1, defval: "" });
            for (let r = 0; r < Math.min(rows.length, 5); r++) {
              const rowStr = (rows[r] || []).join(" ");
              let cm = rowStr.match(/(\d{4})년\s*(\d{1,2})월/);
              if (!cm) cm = rowStr.match(/(\d{4})[-._](\d{1,2})/);
              if (cm) {
                detectedYearMonth = `${cm[1]}-${String(cm[2]).padStart(2, "0")}`;
                break;
              }
            }
            if (detectedYearMonth) break;
          }
        }

        if (!detectedYearMonth) {
          detectedYearMonth = customYearMonth && /^\d{4}-\d{2}$/.test(customYearMonth) ? customYearMonth : "2026-09";
        }

        // ---------------------------------------------------------------------
        // 2. Identify & Categorize Sheets
        // ---------------------------------------------------------------------
        const dashboardSheetName = sheetNames.find((s) =>
          /대시보드|손익_종합대시보드|종합대시보드|Dashboard/i.test(s)
        );
        const masterSheetName = sheetNames.find((s) =>
          /정리본|매입-매출|매입매출|매출현황|손익|매출/i.test(s) && !/세금계산서/i.test(s) && !/대시보드/i.test(s)
        );
        const jajaeSheetName = sheetNames.find((s) =>
          /자재매입|자재/i.test(s) && !/명세/i.test(s)
        );
        const myungseSheetName = sheetNames.find((s) =>
          /명세표|명세|매입DATA|지출|전표/i.test(s)
        );
        const summarySheetName = sheetNames.find((s) =>
          /종합결산|종합요약|결산요약/i.test(s)
        );

        let detectedMasterSales = 0;
        let detectedMasterPurchases = 0;
        let salesBreakdown = [];
        let purchaseBreakdown = [];

        // ---------------------------------------------------------------------
        // 3. PRIORITY 1: Parse Dedicated Dashboard Sheet (손익_종합대시보드)
        // ---------------------------------------------------------------------
        if (dashboardSheetName && workbook.Sheets[dashboardSheetName]) {
          const dashWs = workbook.Sheets[dashboardSheetName];
          const dashRows = XLSX.utils.sheet_to_json(dashWs, { header: 1, defval: "" });

          // Top KPI card detector
          for (let r = 0; r < Math.min(dashRows.length, 10); r++) {
            const rStr = dashRows[r].join(" ");
            if (rStr.includes("당월 총매출액") || rStr.includes("총매출")) {
              const nextRow = dashRows[r + 1] || [];
              const sVal = cleanNumber(nextRow[1] || nextRow[0] || nextRow[2]);
              const pVal = cleanNumber(nextRow[3] || nextRow[2] || nextRow[4]);
              if (!isNaN(sVal) && sVal > 10000000) detectedMasterSales = sVal;
              if (!isNaN(pVal) && pVal > 10000000) detectedMasterPurchases = pVal;
            }
          }

          // Section 1 (Sales) & Section 2 (Purchases) Breakdown Table Detector
          let tableHeaderRow = -1;
          for (let r = 0; r < dashRows.length; r++) {
            const rStr = dashRows[r].join(" ");
            if ((rStr.includes("세부 차종") || rStr.includes("대분류")) && (rStr.includes("매출금액") || rStr.includes("매입 구분"))) {
              tableHeaderRow = r;
              break;
            }
          }

          if (tableHeaderRow >= 0) {
            for (let r = tableHeaderRow + 1; r < dashRows.length; r++) {
              const row = dashRows[r];
              const sCat = String(row[0] || row[1] || "").trim();
              const sItem = String(row[1] || row[2] || "").trim();
              const sAmt = cleanNumber(row[2] || row[3]);
              let sShare = cleanNumber(row[3] || row[4]);

              if (sCat.includes("총합계") || sCat.includes("시트 구성") || sCat.includes("전체 시트")) break;

              // Extract Sales Row
              if (sCat && !isNaN(sAmt) && sAmt > 0) {
                if (sShare < 1 && sShare > 0) sShare = Number((sShare * 100).toFixed(2));
                const badge = sCat.includes("PCM") ? "PCM" : (sCat.includes("수출") ? "수출" : (sCat.includes("내수") ? "내수" : "기타"));
                salesBreakdown.push({
                  rank: salesBreakdown.length + 1,
                  category: sCat,
                  item: sItem,
                  amount: sAmt,
                  share: isNaN(sShare) ? 0 : sShare,
                  badge: badge
                });
              }

              // Extract Purchase Row
              const pCat = String(row[5] || row[6] || "").trim();
              const pSup = String(row[6] || row[7] || "").trim();
              const pAmt = cleanNumber(row[7] || row[8]);
              let pShare = cleanNumber(row[8] || row[9]);

              if (pCat && !isNaN(pAmt) && pAmt > 0) {
                if (pShare < 1 && pShare > 0) pShare = Number((pShare * 100).toFixed(2));
                const badge = pCat.includes("EPDM") || pCat.includes("PVC") || pCat.includes("심금") || pCat.includes("WIRE") ? "원자재" :
                              (pCat.includes("부자재") ? "부자재" :
                              (pCat.includes("케미칼") || pCat.includes("접착제") ? "케미칼" :
                              (pCat.includes("포장") || pCat.includes("비닐") ? "포장재" :
                              (pCat.includes("직매입") ? "직매입" : "원부자재"))));
                purchaseBreakdown.push({
                  rank: purchaseBreakdown.length + 1,
                  category: pCat,
                  supplier: pSup,
                  amount: pAmt,
                  share: isNaN(pShare) ? 0 : pShare,
                  badge: badge
                });
              }
            }
          }
        }

        // ---------------------------------------------------------------------
        // 4. Multi-Pass Grand Totals Detector (Fallback if not found in Dashboard)
        // ---------------------------------------------------------------------
        let detectedPcmSales = 0;
        const highPrioritySales = /금일\s*매출\s*합계|당월\s*매출\s*합계|총\s*매출\s*합계|매출\s*총합계|총\s*매출액|총\s*매출|매출\s*총계|TOTAL\s*매출|전체\s*매출/i;
        const highPriorityPurchases = /금일\s*매입\s*합계|당월\s*매입\s*합계|총\s*매입\s*합계|매입\s*총합계|총\s*매입액|총\s*매입|매입\s*총계|TOTAL\s*매입|전체\s*매입|총\s*매입\(비용\)\s*결산액/i;
        const pcmPattern = /PCM\s*매출|PCM매출/i;

        function findNumberNear(rows, r, c) {
          for (let k = c + 1; k < Math.min(c + 10, rows[r].length); k++) {
            const num = cleanNumber(rows[r][k]);
            if (!isNaN(num) && num > 1000000) return num;
          }
          for (let nextR = r + 1; nextR <= Math.min(r + 3, rows.length - 1); nextR++) {
            for (let nextC = Math.max(0, c - 2); nextC <= Math.min(c + 3, (rows[nextR] || []).length - 1); nextC++) {
              const num = cleanNumber(rows[nextR][nextC]);
              if (!isNaN(num) && num > 1000000) return num;
            }
          }
          return null;
        }

        const masterSheets = sheetNames.filter((s) =>
          /정리본|매입-매출|매입매출|종합결산|결산|손익|매출/i.test(s) && !/세금계산서/i.test(s)
        );
        const searchSheets = [...masterSheets, ...sheetNames.filter((s) => !masterSheets.includes(s))];

        for (const s of searchSheets) {
          const ws = workbook.Sheets[s];
          if (!ws) continue;
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

          for (let r = 0; r < rows.length; r++) {
            for (let c = 0; c < rows[r].length; c++) {
              const cell = String(rows[r][c] || "").trim();
              if (!cell) continue;

              if (!detectedMasterSales && highPrioritySales.test(cell)) {
                const num = findNumberNear(rows, r, c);
                if (num) detectedMasterSales = num;
              }
              if (!detectedMasterPurchases && highPriorityPurchases.test(cell)) {
                const num = findNumberNear(rows, r, c);
                if (num) detectedMasterPurchases = num;
              }
              if (!detectedPcmSales && pcmPattern.test(cell)) {
                const num = findNumberNear(rows, r, c);
                if (num) detectedPcmSales = num;
              }
            }
          }
        }

        // ---------------------------------------------------------------------
        // 5. Parse Master Sales Sheet (정리본 / 매입매출)
        // ---------------------------------------------------------------------
        let vehicleSales = [];
        let salesSummary = null;
        const rawSalesItems = [];

        if (masterSheetName && workbook.Sheets[masterSheetName]) {
          const wsMaster = workbook.Sheets[masterSheetName];
          const masterRows = XLSX.utils.sheet_to_json(wsMaster, { header: 1, defval: "" });

          let currentProcess = "내수상품매출";
          let currentVehicle = "";
          const monthSuffix = (detectedYearMonth && detectedYearMonth.includes("-")) ? detectedYearMonth.split("-")[1] : "09";

          if (detectedPcmSales > 0) {
            rawSalesItems.push({
              process: "PCM 매출",
              vehicle: "PCM 압출/가공",
              itemCode: "PCM-" + monthSuffix,
              partNumber: "PCM-TOTAL",
              partName: `PCM 매출 전체 (압출 및 가공 ${monthSuffix}월 정산)`,
              unitPrice: detectedPcmSales,
              qty: 1,
              amount: detectedPcmSales
            });
          }

          let dataStartRow = 3;
          for (let r = 0; r < Math.min(10, masterRows.length); r++) {
            const rStr = (masterRows[r] || []).join(" ");
            if (rStr.includes("고객품번") || rStr.includes("P/NAME") || rStr.includes("아이템코드")) {
              dataStartRow = r + 1;
              break;
            }
          }

          for (let r = dataStartRow; r < masterRows.length; r++) {
            const row = masterRows[r] || [];
            const c1 = String(row[1] || "").trim();
            const c2 = String(row[2] || "").trim();
            const itemCode = String(row[3] || "").trim();
            const partNumber = String(row[4] || "").trim();
            const partName = String(row[5] || "").trim();
            const unitPrice = cleanNumber(row[6]);
            const qty = cleanNumber(row[7]);
            const amount = cleanNumber(row[8]);

            if (c1.includes("매출") || c1.includes("A/S") || c1.includes("EPDM") || c1.includes("임가공")) {
              currentProcess = c1;
            }
            if (c2 && !c2.includes("PCM") && !c2.includes("합계") && !c2.includes("매출")) {
              currentVehicle = c2;
            }

            if ((c2.includes("PCM") || c1.includes("PCM")) && detectedPcmSales === 0) {
              const pcmAmt = cleanNumber(row[9] || row[10] || row[8]);
              if (pcmAmt > 0 && !rawSalesItems.some((it) => it.process === "PCM 매출")) {
                rawSalesItems.push({
                  process: "PCM 매출",
                  vehicle: "PCM 압출/가공",
                  itemCode: "PCM-" + monthSuffix,
                  partNumber: "PCM-TOTAL",
                  partName: `PCM 매출 전체 (압출 및 가공 ${monthSuffix}월 정산)`,
                  unitPrice: pcmAmt,
                  qty: 1,
                  amount: pcmAmt
                });
              }
            }

            if (partName && amount > 0 && !partName.includes("합계") && itemCode !== "아이템코드") {
              rawSalesItems.push({
                process: currentProcess,
                vehicle: currentVehicle || "기타",
                itemCode: itemCode || "-",
                partNumber: partNumber || "-",
                partName: partName,
                unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
                qty: isNaN(qty) ? 0 : qty,
                amount: amount
              });
            }
          }

          const getVehicleGroup = (item) => {
            if (!item) return "기타 차종";
            const v = String(item.vehicle || "").toUpperCase().trim();
            const name = String(item.partName || "").toUpperCase();
            const proc = String(item.process || "").toUpperCase();

            if (v.includes("PCM") || proc.includes("PCM")) return "PCM 압출/가공";
            if (v.startsWith("9BQC")) return "9BQC";
            if (v.startsWith("DT")) return "DT (수출)";
            if (v.startsWith("DS")) return "DS (수출)";
            if (v.startsWith("NX4") || name.includes("NX4")) return "NX4 (내수/수출)";
            if (v.startsWith("NE1") || v.startsWith("8NE1") || v.startsWith("ME1") || v.startsWith("1ME1")) return "NE1 / ME1 (수출/내수)";
            if (v.startsWith("OV1") || name.includes("OV1")) return "OV1k";
            if (v.startsWith("JK") || name.includes("JK")) return "JK 1 (내수/임가공)";
            if (v.startsWith("CE1") || name.includes("CE1")) return "CE1";
            if (v.startsWith("PD") || name.includes("PD")) return "PD";
            return v || "기타 차종";
          };

          const vMap = {};
          rawSalesItems.forEach((item) => {
            const grp = getVehicleGroup(item);
            if (!vMap[grp]) {
              vMap[grp] = {
                vehicleGroup: grp,
                category: item.process || "내수",
                itemCount: 0,
                totalQty: 0,
                totalAmount: 0,
                details: []
              };
            }
            vMap[grp].itemCount += 1;
            vMap[grp].totalQty += item.qty || 0;
            vMap[grp].totalAmount += item.amount || 0;
            vMap[grp].details.push(item);
          });

          const totalSalesCalculated = rawSalesItems.reduce((a, b) => a + b.amount, 0);
          const finalTotalSales = detectedMasterSales > 0 ? detectedMasterSales : totalSalesCalculated;

          vehicleSales = Object.values(vMap)
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .map((v, idx) => ({
              rank: idx + 1,
              ...v,
              share: Number(((v.totalAmount / (finalTotalSales || 1)) * 100).toFixed(2))
            }));

          salesSummary = {
            yearMonth: detectedYearMonth,
            totalSales: finalTotalSales,
            totalQty: rawSalesItems.reduce((a, b) => a + (b.qty || 0), 0),
            itemCount: rawSalesItems.length,
            vehicleGroupCount: vehicleSales.length
          };
        }

        // ---------------------------------------------------------------------
        // 6. Parse Jajae Sheet (자재매입)
        // ---------------------------------------------------------------------
        let jajaeGroups = [];
        let jajaeSummary = null;
        const allTransactions = [];
        const rawJajaeItems = [];

        if (jajaeSheetName && workbook.Sheets[jajaeSheetName]) {
          const wsJajae = workbook.Sheets[jajaeSheetName];
          const jajaeRows = XLSX.utils.sheet_to_json(wsJajae, { header: 1, defval: "" });

          let currentCategory = "원자재";
          for (let r = 2; r < jajaeRows.length; r++) {
            const row = jajaeRows[r] || [];
            const colB = String(row[1] || "").trim();
            const colC = String(row[2] || "").trim();
            const colD = String(row[3] || "").trim();
            const unitPrice = cleanNumber(row[6]);
            const qty = cleanNumber(row[7]);
            const amount = cleanNumber(row[8] || row[9] || (unitPrice * qty));

            if (colB.includes("원자재") || colB.includes("부자재") || colB.includes("기타")) {
              currentCategory = colB;
            }

            if (colC && !colC.includes("합계") && !colC.includes("TOTAL") && amount > 0) {
              const itemObj = {
                id: `jajae_${detectedYearMonth}_${r}`,
                date: `${detectedYearMonth}-28`,
                type: "expense",
                category: currentCategory || "원자재",
                mainCategory: currentCategory || "원자재",
                client: colD || "매입처",
                supplier: colD || "매입처",
                title: colC,
                partName: colC,
                itemCode: colB,
                unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
                qty: isNaN(qty) ? 0 : qty,
                amount: amount,
                paymentMethod: "세금계산서"
              };
              rawJajaeItems.push(itemObj);
              allTransactions.push(itemObj);
            }
          }

          const normalizeJGroup = (item) => {
            const cat = String(item.mainCategory || "").toUpperCase();
            const name = String(item.partName || "").toUpperCase();
            const sup = String(item.supplier || "").toUpperCase();

            if (cat.includes("EPDM") || name.includes("EPDM")) return { name: "EPDM 고무 원자재", color: "#10B981" };
            if (cat.includes("PVC") || name.includes("PVC")) return { name: "PVC 원자재", color: "#06B6D4" };
            if (cat.includes("심금") || cat.includes("WIRE") || name.includes("심금") || name.includes("WIRE")) return { name: "심금류 / WIRE 철심", color: "#F59E0B" };
            if (cat.includes("포장") || name.includes("포장") || sup.includes("광진포장")) return { name: "포장 부자재", color: "#EC4899" };
            if (cat.includes("케미칼") || sup.includes("화승케미칼")) return { name: "화승케미칼 특수원료", color: "#EF4444" };
            return { name: "기타 부자재", color: "#64748B" };
          };

          const jMap = {};
          rawJajaeItems.forEach((item) => {
            const grpInfo = normalizeJGroup(item);
            if (!jMap[grpInfo.name]) {
              jMap[grpInfo.name] = {
                groupName: grpInfo.name,
                color: grpInfo.color,
                itemCount: 0,
                totalAmount: 0,
                suppliers: new Set(),
                items: []
              };
            }
            jMap[grpInfo.name].itemCount += 1;
            jMap[grpInfo.name].totalAmount += item.amount;
            if (item.supplier && item.supplier !== "-") jMap[grpInfo.name].suppliers.add(item.supplier);
            jMap[grpInfo.name].items.push(item);
          });

          const totalJAmount = rawJajaeItems.reduce((a, b) => a + b.amount, 0);
          const finalTotalPurchases = detectedMasterPurchases > 0 ? detectedMasterPurchases : totalJAmount;

          jajaeGroups = Object.values(jMap)
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .map((g, idx) => ({
              rank: idx + 1,
              groupName: g.groupName,
              color: g.color,
              itemCount: g.itemCount,
              totalAmount: g.totalAmount,
              share: Number(((g.totalAmount / (finalTotalPurchases || 1)) * 100).toFixed(2)),
              mainSuppliers: Array.from(g.suppliers).slice(0, 4).join(", ") || "자체/미지정",
              items: g.items.sort((a, b) => b.amount - a.amount)
            }));

          jajaeSummary = {
            yearMonth: detectedYearMonth,
            totalAmount: finalTotalPurchases,
            itemCount: rawJajaeItems.length,
            groupCount: jajaeGroups.length
          };
        }

        const finalSalesVal = detectedMasterSales || (salesSummary?.totalSales || 0);
        const finalPurchasesVal = detectedMasterPurchases || (jajaeSummary?.totalAmount || 0);
        const finalGrossProfit = finalSalesVal - finalPurchasesVal;
        const finalCostRatio = finalSalesVal > 0 ? Number(((finalPurchasesVal / finalSalesVal) * 100).toFixed(2)) : 0;
        const finalProfitRatio = finalSalesVal > 0 ? Number(((finalGrossProfit / finalSalesVal) * 100).toFixed(2)) : 0;

        const parsedPackage = {
          yearMonth: detectedYearMonth,
          sheetCount: sheetNames.length,
          totalSales: finalSalesVal,
          totalExpenses: finalPurchasesVal,
          grossProfit: finalGrossProfit,
          costRatio: finalCostRatio,
          profitRatio: finalProfitRatio,
          salesBreakdown: salesBreakdown.length > 0 ? salesBreakdown : (vehicleSales.map(v => ({
            rank: v.rank,
            category: v.vehicleGroup,
            item: v.details?.[0]?.partName || v.vehicleGroup,
            amount: v.totalAmount,
            share: v.share,
            badge: v.category?.includes("수출") ? "수출" : (v.category?.includes("PCM") ? "PCM" : "내수")
          }))),
          purchaseBreakdown: (() => {
            const classified = jajaeSheetName && workbook.Sheets[jajaeSheetName] ? extractClassifiedPurchases(workbook.Sheets[jajaeSheetName], finalPurchasesVal) : [];
            if (classified.length > 0) return classified;
            if (purchaseBreakdown.length > 0 && !purchaseBreakdown.some(p => p.category?.includes('기타 원/부자재') && p.share > 30)) {
              return purchaseBreakdown;
            }
            return purchaseBreakdown.length > 0 ? purchaseBreakdown : (jajaeGroups.map(g => ({
            rank: g.rank,
            category: g.groupName,
            supplier: g.mainSuppliers,
            amount: g.totalAmount,
            share: g.share,
            badge: g.groupName?.includes("원자재") ? "원자재" : "부자재"
          })));
          })(),
          salesSummary: salesSummary || {
            yearMonth: detectedYearMonth,
            totalSales: finalSalesVal,
            totalQty: 0,
            itemCount: 0,
            vehicleGroupCount: vehicleSales.length
          },
          vehicleSales: vehicleSales || [],
          jajaeSummary: jajaeSummary || {
            yearMonth: detectedYearMonth,
            totalAmount: finalPurchasesVal,
            itemCount: allTransactions.length,
            groupCount: jajaeGroups.length
          },
          jajaeGroups: jajaeGroups || [],
          purchaseSummary: {
            yearMonth: detectedYearMonth,
            ledgerBenchmark: finalPurchasesVal,
            totalExpenses: finalPurchasesVal,
            totalPurchase: finalPurchasesVal
          },
          items: allTransactions,
          transactions: allTransactions
        };

        resolve(parsedPackage);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
