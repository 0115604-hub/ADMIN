import * as XLSX from "xlsx";

/**
 * Universal Multi-Format Excel Parser for Monthly P&L and Material Purchases
 * Supports:
 * 1. Standard Multi-Sheet P&L (매입-매출 정리본, 자재매입, 원자재/부자재 내역 등)
 * 2. Dedicated Purchase Ledger sheets (매입명세표, 매입DATA, 지출내역 등)
 * 3. Cost & Settlement sheets (월간_종합결산요약, 노무비_이자_공과금_수기결산)
 * 4. Any single or multi-sheet Excel file with sales, purchases, or ledger transactions
 */
export const parseExcelFile = async (file) => {
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

        if (!detectedYearMonth) detectedYearMonth = "2026-08";

        // ---------------------------------------------------------------------
        // 2. Identify & Categorize Sheets
        // ---------------------------------------------------------------------
        let vehicleSales = [];
        let salesSummary = null;
        let jajaeGroups = [];
        let jajaeSummary = null;
        let totalSales = 0;
        let totalPurchases = 0;
        const allTransactions = [];

        const masterSheetName = sheetNames.find((s) =>
          /정리본|매입-매출|매입매출|매출현황|손익|매출/i.test(s) && !/세금계산서/i.test(s)
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
        const laborSheetName = sheetNames.find((s) =>
          /노무비|인건비|공과금/i.test(s)
        );

        // ---------------------------------------------------------------------
        // 3. Parse Master Sales Sheet (정리본 / 매입매출)
        // ---------------------------------------------------------------------
        if (masterSheetName && workbook.Sheets[masterSheetName]) {
          const wsMaster = workbook.Sheets[masterSheetName];
          const masterRows = XLSX.utils.sheet_to_json(wsMaster, { header: 1, defval: "" });

          // Detect month from sheet title if available
          if (masterRows[1] && String(masterRows[1][0] || masterRows[1][1] || "").includes("년")) {
            const m = String(masterRows[1][0] || masterRows[1][1] || "").match(/(\d{4})년\s*(\d{1,2})월/);
            if (m) detectedYearMonth = `${m[1]}-${String(m[2]).padStart(2, "0")}`;
          }

          let currentProcess = "내수상품매출";
          let currentVehicle = "";
          const rawSalesItems = [];

          for (let r = 3; r < masterRows.length; r++) {
            const row = masterRows[r];
            const c1 = String(row[1] || "").trim();
            const c2 = String(row[2] || "").trim();
            const itemCode = String(row[3] || "").trim();
            const partNumber = String(row[4] || "").trim();
            const partName = String(row[5] || "").trim();
            const unitPrice = Number(String(row[6] || "").replace(/,/g, ""));
            const qty = Number(String(row[7] || "").replace(/,/g, ""));
            const amount = Number(String(row[8] || "").replace(/,/g, ""));

            // Check summary box in Col 13
            if (r === 4 && row[13]) totalSales = Number(String(row[13]).replace(/,/g, ""));
            if (r === 8 && row[13]) totalPurchases = Number(String(row[13]).replace(/,/g, ""));

            if (c2.includes("PCM 매출") || c1.includes("PCM")) {
              currentProcess = "PCM 매출";
              currentVehicle = "PCM 압출/가공";
              const pcmAmt = Number(String(row[9] || row[10] || row[8] || "").replace(/,/g, ""));
              if (pcmAmt > 0) {
                rawSalesItems.push({
                  process: "PCM 매출",
                  vehicle: "PCM 압출/가공",
                  itemCode: "PCM-" + detectedYearMonth.split("-")[1],
                  partNumber: "PCM-TOTAL",
                  partName: `PCM 매출 전체 (압출 및 가공 ${detectedYearMonth.split("-")[1]}월 정산)`,
                  unitPrice: pcmAmt,
                  qty: 1,
                  amount: pcmAmt
                });
              }
            }

            if (c1.includes("매출") || c1.includes("A/S") || c1.includes("EPDM") || c1.includes("임가공")) {
              currentProcess = c1;
            }
            if (c2 && !c2.includes("PCM") && !c2.includes("합계") && !c2.includes("매출")) {
              currentVehicle = c2;
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

          // Aggregate Vehicle Family Groups
          const getVehicleGroup = (item) => {
            const v = item.vehicle.toUpperCase().trim();
            const name = item.partName.toUpperCase();

            if (v.includes("PCM") || item.process.includes("PCM")) return "PCM 압출/가공";
            if (v.startsWith("9BQC")) return "9BQC";
            if (v.startsWith("DT")) return "DT (수출)";
            if (v.startsWith("DS")) return "DS (수출)";
            if (v.startsWith("NX4") || name.includes("NX4")) return "NX4 (내수/수출)";
            if (v.startsWith("JA") || name.includes("JA")) return "JA";
            if (v.startsWith("PU") || name.includes("PU")) return "PU";
            if (v.startsWith("NE1") || v.startsWith("8NE1") || v.startsWith("ME1") || v.startsWith("1ME1")) return "NE1 / ME1 (수출/내수)";
            if (v.startsWith("OV1") || name.includes("OV1")) return "OV1k";
            if (v.startsWith("HR") || name.includes("HR")) return "HR";
            if (v.startsWith("JK") || name.includes("JK")) return "JK 1 (내수/임가공)";
            if (v.startsWith("VT") || name.includes("VT")) return "VT";
            if (v.startsWith("GV") || name.includes("GV")) return "GV";
            if (v.startsWith("QZ") || name.includes("QZ")) return "QZ";
            if (v.startsWith("CE1") || name.includes("CE1")) return "CE1";
            if (v.startsWith("P417") || name.includes("P417")) return "P417";
            if (v.startsWith("FS") || name.includes("FS")) return "FS (A/S)";
            if (v.startsWith("BL7") || v.startsWith("BL")) return "BL / BL7m";
            if (v.startsWith("TY") || name.includes("TY")) return "TY";
            if (v.startsWith("EG") || name.includes("EG")) return "EG";
            if (v.startsWith("M2JO") || v.startsWith("M200") || v.startsWith("M300")) return "GM (M2JO)";
            if (v.startsWith("PD") || name.includes("PD")) return "PD";
            if (v.startsWith("HI") || v.startsWith("VI")) return "HI / VI (EPDM)";

            return v || "기타 차종";
          };

          const vMap = {};
          rawSalesItems.forEach((item) => {
            const grp = getVehicleGroup(item);
            if (!vMap[grp]) {
              vMap[grp] = {
                vehicleGroup: grp,
                category: item.process,
                itemCount: 0,
                totalQty: 0,
                totalAmount: 0,
                details: []
              };
            }
            vMap[grp].itemCount += 1;
            vMap[grp].totalQty += item.qty;
            vMap[grp].totalAmount += item.amount;
            vMap[grp].details.push(item);
          });

          const totalCalcSales = rawSalesItems.reduce((a, b) => a + b.amount, 0);
          const finalTotalSales = totalSales > 0 ? totalSales : totalCalcSales;

          vehicleSales = Object.values(vMap)
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .map((v, idx) => ({
              rank: idx + 1,
              vehicleGroup: v.vehicleGroup,
              category: v.category,
              itemCount: v.itemCount,
              totalQty: v.totalQty,
              totalAmount: v.totalAmount,
              share: Number(((v.totalAmount / (finalTotalSales || 1)) * 100).toFixed(2)),
              details: v.details.sort((a, b) => b.amount - a.amount)
            }));

          salesSummary = {
            yearMonth: detectedYearMonth,
            totalSales: finalTotalSales,
            totalQty: rawSalesItems.reduce((a, b) => a + b.qty, 0),
            itemCount: rawSalesItems.length,
            vehicleGroupCount: vehicleSales.length
          };
        }

        // ---------------------------------------------------------------------
        // 4. Parse Jajae Material Sheet (자재매입)
        // ---------------------------------------------------------------------
        if (jajaeSheetName && workbook.Sheets[jajaeSheetName]) {
          const wsJajae = workbook.Sheets[jajaeSheetName];
          const jajaeRows = XLSX.utils.sheet_to_json(wsJajae, { header: 1, defval: "" });

          let currentMainCategory = "기타자재";
          const rawJajaeItems = [];

          for (let r = 2; r < jajaeRows.length; r++) {
            const row = jajaeRows[r];
            const c0 = String(row[0] || "").trim();
            const c1 = String(row[1] || "").trim();
            const c2 = String(row[2] || "").trim();
            const c3 = String(row[3] || "").trim();
            const c4 = String(row[4] || "").trim();
            const c5 = String(row[5] || "").trim();
            const unitPrice = Number(String(row[6] || "").replace(/,/g, ""));
            const qty = Number(String(row[7] || "").replace(/,/g, ""));
            const amount = Number(String(row[8] || "").replace(/,/g, ""));
            const memo = String(row[12] || row[13] || "").trim();

            if (c0 && isNaN(c0) && !c0.includes("순서")) {
              currentMainCategory = c0.replace(/\r?\n/g, " ").trim();
            }

            if (c2 && !c2.includes("품명") && amount > 0) {
              const jItem = {
                mainCategory: currentMainCategory,
                code: c1 || "-",
                partName: c2,
                unit: c3 || "EA",
                usage: c4 || "-",
                supplier: c5 || "-",
                unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
                qty: isNaN(qty) ? 0 : qty,
                amount: amount,
                memo: memo
              };
              rawJajaeItems.push(jItem);

              // Add to transactions ledger
              allTransactions.push({
                id: `jajae_${detectedYearMonth}_${r}`,
                date: `${detectedYearMonth}-28`,
                type: "expense",
                category: currentMainCategory.includes("부자재") ? "부자재" : "원자재",
                client: c5 || "자재공급사",
                title: c2,
                amount: amount,
                paymentMethod: "세금계산서",
                memo: memo
              });
            }
          }

          const normalizeJGroup = (item) => {
            const cat = item.mainCategory.toUpperCase();
            const name = item.partName.toUpperCase();
            const sup = (item.supplier || "").toUpperCase();

            if (cat.includes("TPE") || name.includes("TPE")) return { name: "TPE 원재료 / 부품", color: "#3B82F6" };
            if (cat.includes("EPDM") || name.includes("EPDM")) return { name: "EPDM 원료 / 상품", color: "#10B981" };
            if (cat.includes("9BQC") || name.includes("9BQC")) return { name: "9BQC 전용 부품", color: "#8B5CF6" };
            if (cat.includes("포장") || name.includes("포장") || sup.includes("광진포장")) return { name: "포장 부자재", color: "#EC4899" };
            if (cat.includes("PVC") || name.includes("PVC")) return { name: "PVC 압출 자재", color: "#06B6D4" };
            if (cat.includes("심금") || cat.includes("WIRE") || name.includes("심금") || name.includes("WIRE")) return { name: "심금류 / WIRE 철심", color: "#F59E0B" };
            if (cat.includes("케미칼") || sup.includes("화승케미칼") || name.includes("HSP")) return { name: "화승케미칼 특수원료", color: "#EF4444" };
            if (cat.includes("부자재") || cat.includes("부 자 재")) return { name: "일반 부자재", color: "#EAB308" };

            return { name: "기타 차종 자재", color: "#64748B" };
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

          jajaeGroups = Object.values(jMap)
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .map((g, idx) => ({
              rank: idx + 1,
              groupName: g.groupName,
              color: g.color,
              itemCount: g.itemCount,
              totalAmount: g.totalAmount,
              share: Number(((g.totalAmount / (totalJAmount || 1)) * 100).toFixed(2)),
              mainSuppliers: Array.from(g.suppliers).slice(0, 4).join(", ") || "자체/미지정",
              items: g.items.sort((a, b) => b.amount - a.amount)
            }));

          jajaeSummary = {
            yearMonth: detectedYearMonth,
            totalAmount: totalJAmount,
            itemCount: rawJajaeItems.length,
            groupCount: jajaeGroups.length
          };
        }

        // ---------------------------------------------------------------------
        // 5. Parse Direct Purchase Ledger Sheets (매입명세표, 매입DATA, 지출내역)
        // ---------------------------------------------------------------------
        if (myungseSheetName && workbook.Sheets[myungseSheetName] && jajaeGroups.length === 0) {
          const wsMyungse = workbook.Sheets[myungseSheetName];
          const rows = XLSX.utils.sheet_to_json(wsMyungse, { header: 1, defval: "" });

          let headerIdx = 0;
          for (let r = 0; r < Math.min(rows.length, 5); r++) {
            const rStr = rows[r].join(" ");
            if (rStr.includes("공급가액") || rStr.includes("금액") || rStr.includes("거래처") || rStr.includes("품목")) {
              headerIdx = r;
              break;
            }
          }

          const headers = (rows[headerIdx] || []).map((h) => String(h).trim());
          const dateCol = headers.findIndex((h) => /일자|날짜|date/i.test(h));
          const catCol = headers.findIndex((h) => /계정과목|카테고리|구분|분류/i.test(h));
          const clientCol = headers.findIndex((h) => /거래처|매입업체|구매처|공급처|업체명/i.test(h));
          const itemCol = headers.findIndex((h) => /품목|항목|품명/i.test(h));
          const amtCol = headers.findIndex((h) => /공급가액|금액|amount/i.test(h));
          const memoCol = headers.findIndex((h) => /메모|비고|비 고/i.test(h));

          const jMap = {};
          let parsedSum = 0;

          for (let r = headerIdx + 1; r < rows.length; r++) {
            const row = rows[r];
            const amt = Number(String(row[amtCol >= 0 ? amtCol : 6] || "").replace(/,/g, ""));
            if (isNaN(amt) || amt <= 0) continue;

            const dateVal = String(row[dateCol >= 0 ? dateCol : 1] || "").trim() || `${detectedYearMonth}-28`;
            const catVal = String(row[catCol >= 0 ? catCol : 3] || "원자재").trim();
            const clientVal = String(row[clientCol >= 0 ? clientCol : 4] || "매입처").trim();
            const itemVal = String(row[itemCol >= 0 ? itemCol : 5] || "품목").trim();
            const memoVal = String(row[memoCol >= 0 ? memoCol : 7] || "").trim();

            parsedSum += amt;
            allTransactions.push({
              id: `myungse_${detectedYearMonth}_${r}`,
              date: dateVal,
              type: "expense",
              category: catVal,
              client: clientVal,
              title: itemVal,
              amount: amt,
              paymentMethod: "세금계산서",
              memo: memoVal
            });

            const grpName = catVal || "기타 매입";
            if (!jMap[grpName]) {
              jMap[grpName] = {
                groupName: grpName,
                color: "#3B82F6",
                itemCount: 0,
                totalAmount: 0,
                suppliers: new Set(),
                items: []
              };
            }
            jMap[grpName].itemCount++;
            jMap[grpName].totalAmount += amt;
            if (clientVal) jMap[grpName].suppliers.add(clientVal);
            jMap[grpName].items.push({
              partName: itemVal,
              supplier: clientVal,
              amount: amt,
              memo: memoVal,
              category: catVal
            });
          }

          totalPurchases = parsedSum;
          jajaeGroups = Object.values(jMap)
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .map((g, idx) => ({
              rank: idx + 1,
              groupName: g.groupName,
              color: "#3B82F6",
              itemCount: g.itemCount,
              totalAmount: g.totalAmount,
              share: Number(((g.totalAmount / (parsedSum || 1)) * 100).toFixed(2)),
              mainSuppliers: Array.from(g.suppliers).slice(0, 4).join(", "),
              items: g.items
            }));

          jajaeSummary = {
            yearMonth: detectedYearMonth,
            totalAmount: parsedSum,
            itemCount: allTransactions.length,
            groupCount: jajaeGroups.length
          };
        }

        // ---------------------------------------------------------------------
        // 6. Parse Summary / Expense Sheets (월간_종합결산요약, 노무비 수기결산)
        // ---------------------------------------------------------------------
        if (summarySheetName && workbook.Sheets[summarySheetName]) {
          const wsSum = workbook.Sheets[summarySheetName];
          const sRows = XLSX.utils.sheet_to_json(wsSum, { header: 1, defval: "" });
          for (let r = 0; r < sRows.length; r++) {
            const rStr = sRows[r].join(" ");
            if (rStr.includes("총 매출액") || rStr.includes("매출액") || rStr.includes("Sales")) {
              const nextRow = sRows[r + 1] || [];
              for (let c = 0; c < nextRow.length; c++) {
                const val = Number(String(nextRow[c] || "").replace(/,/g, ""));
                if (val > 10000000) {
                  if (!totalSales) totalSales = val;
                  else if (!totalPurchases && val !== totalSales) totalPurchases = val;
                }
              }
            }
          }
        }

        // ---------------------------------------------------------------------
        // 7. Universal Fallback (If no transactions parsed yet, scan all sheets)
        // ---------------------------------------------------------------------
        if (allTransactions.length === 0 && jajaeGroups.length === 0 && totalSales === 0 && totalPurchases === 0) {
          for (const s of sheetNames) {
            const ws = workbook.Sheets[s];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
            for (let r = 1; r < rows.length; r++) {
              const row = rows[r];
              for (let c = 0; c < row.length; c++) {
                const val = Number(String(row[c] || "").replace(/,/g, ""));
                if (!isNaN(val) && val > 10000) {
                  totalPurchases += val;
                  break;
                }
              }
            }
          }
        }

        const finalSalesVal = totalSales || (salesSummary?.totalSales || 0);
        const finalPurchasesVal = totalPurchases || (jajaeSummary?.totalAmount || 0);

        const parsedPackage = {
          yearMonth: detectedYearMonth,
          sheetCount: sheetNames.length,
          totalSales: finalSalesVal,
          totalExpenses: finalPurchasesVal,
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
            totalExpenses: finalPurchasesVal
          },
          items: allTransactions
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

