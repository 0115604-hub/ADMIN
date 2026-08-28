import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

const detailedData = JSON.parse(fs.readFileSync(path.resolve("src/data/detailedClosingLedgerData.json"), "utf-8"));

async function generateClosingExcelWithEmptyRows() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Antigravity ADMIN System";
  workbook.lastModifiedBy = "Antigravity ADMIN System";
  workbook.created = new Date();
  workbook.modified = new Date();

  const monthData = detailedData["2026-07"];
  const categories = monthData.categories;

  // =========================================================================
  // SHEET 1: 📊 월간 결산 종합 요약
  // =========================================================================
  const wsSummary = workbook.addWorksheet("📊 월간 결산 종합 요약", {
    views: [{ showGridLines: true }]
  });

  wsSummary.columns = [
    { key: "A", width: 4 },
    { key: "B", width: 8 },  // No
    { key: "C", width: 20 }, // 대분류
    { key: "D", width: 24 }, // 계정과목명
    { key: "E", width: 12 }, // 항목수
    { key: "F", width: 22 }, // 공급가액
    { key: "G", width: 18 }, // 세액
    { key: "H", width: 24 }, // 총 결산합계
    { key: "I", width: 14 }, // 점유율
    { key: "J", width: 40 }  // 주요 거래처 및 비고
  ];

  // Title Banner
  wsSummary.mergeCells("B2:J2");
  const titleCell = wsSummary.getCell("B2");
  titleCell.value = "2026년 월간 매입·비용 결산 요약 보고서 (자동계산)";
  titleCell.font = { name: "맑은 고딕", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  wsSummary.getRow(2).height = 36;

  // Subtitle
  wsSummary.mergeCells("B3:J3");
  const subCell = wsSummary.getCell("B3");
  subCell.value = "※ [📋 16대 계정과목 세부 입력장부] 시트에 과목당 5칸씩 여유 빈줄이 포함되어 있어, 새 항목을 바로 입력하시면 자동 반영됩니다.";
  subCell.font = { name: "맑은 고딕", size: 10, italic: true, color: { argb: "FF2563EB" } };
  subCell.alignment = { vertical: "middle", horizontal: "left" };
  wsSummary.getRow(3).height = 20;

  // KPI Section Box (Rows 5 to 6)
  wsSummary.mergeCells("B5:C5");
  wsSummary.getCell("B5").value = "당월 총 매출액 (Sales)";
  wsSummary.getCell("B5").font = { name: "맑은 고딕", size: 10, bold: true, color: { argb: "FF475569" } };
  wsSummary.getCell("B5").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  wsSummary.getCell("B5").alignment = { vertical: "middle", horizontal: "center" };

  wsSummary.mergeCells("B6:C6");
  const salesInput = wsSummary.getCell("B6");
  salesInput.value = 2873777826;
  salesInput.numFmt = '#,##0 "원"';
  salesInput.font = { name: "맑은 고딕", size: 14, bold: true, color: { argb: "FF2563EB" } };
  salesInput.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
  salesInput.alignment = { vertical: "middle", horizontal: "center" };

  wsSummary.mergeCells("D5:E5");
  wsSummary.getCell("D5").value = "총 결산 지출(매입) 합계";
  wsSummary.getCell("D5").font = { name: "맑은 고딕", size: 10, bold: true, color: { argb: "FF475569" } };
  wsSummary.getCell("D5").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  wsSummary.getCell("D5").alignment = { vertical: "middle", horizontal: "center" };

  wsSummary.mergeCells("D6:E6");
  const costSum = wsSummary.getCell("D6");
  costSum.value = { formula: "=H26" };
  costSum.numFmt = '#,##0 "원"';
  costSum.font = { name: "맑은 고딕", size: 14, bold: true, color: { argb: "FFE11D48" } };
  costSum.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
  costSum.alignment = { vertical: "middle", horizontal: "center" };

  wsSummary.mergeCells("F5:G5");
  wsSummary.getCell("F5").value = "매출 대비 결산 비용 비율";
  wsSummary.getCell("F5").font = { name: "맑은 고딕", size: 10, bold: true, color: { argb: "FF475569" } };
  wsSummary.getCell("F5").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  wsSummary.getCell("F5").alignment = { vertical: "middle", horizontal: "center" };

  wsSummary.mergeCells("F6:G6");
  const costRatioCell = wsSummary.getCell("F6");
  costRatioCell.value = { formula: "=D6/B6" };
  costRatioCell.numFmt = "0.0%";
  costRatioCell.font = { name: "맑은 고딕", size: 14, bold: true, color: { argb: "FF4F46E5" } };
  costRatioCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
  costRatioCell.alignment = { vertical: "middle", horizontal: "center" };

  wsSummary.mergeCells("H5:I5");
  wsSummary.getCell("H5").value = "예상 영업손익 (매출-결산)";
  wsSummary.getCell("H5").font = { name: "맑은 고딕", size: 10, bold: true, color: { argb: "FF475569" } };
  wsSummary.getCell("H5").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  wsSummary.getCell("H5").alignment = { vertical: "middle", horizontal: "center" };

  wsSummary.mergeCells("H6:I6");
  const profitCell = wsSummary.getCell("H6");
  profitCell.value = { formula: "=B6-D6" };
  profitCell.numFmt = '+#,##0 "원";-#,##0 "원";0 "원"';
  profitCell.font = { name: "맑은 고딕", size: 14, bold: true, color: { argb: "FF059669" } };
  profitCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
  profitCell.alignment = { vertical: "middle", horizontal: "center" };

  wsSummary.getRow(5).height = 22;
  wsSummary.getRow(6).height = 30;

  // Table Headers (Row 9)
  const headers = ["NO", "대분류", "계정과목명", "항목수", "공급가액 (원)", "세액 (원)", "총 결산합계 (원)", "점유율", "주요 거래처 및 비고"];
  const headerRow = wsSummary.getRow(9);
  headerRow.height = 26;

  headers.forEach((h, i) => {
    const colLetter = String.fromCharCode(66 + i);
    const cell = wsSummary.getCell(`${colLetter}9`);
    cell.value = h;
    cell.font = { name: "맑은 고딕", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    cell.alignment = { vertical: "middle", horizontal: i >= 4 && i <= 7 ? "right" : "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF94A3B8" } },
      bottom: { style: "medium", color: { argb: "FF1E293B" } }
    };
  });

  // =========================================================================
  // SHEET 2: 📋 16대 계정과목 세부 입력장부 (with 5 Blank Rows per Category)
  // =========================================================================
  const wsDetail = workbook.addWorksheet("📋 16대 계정과목 세부 입력장부", {
    views: [{ showGridLines: true }]
  });

  wsDetail.columns = [
    { key: "A", width: 4 },
    { key: "B", width: 8 },  // NO
    { key: "C", width: 22 }, // 계정과목
    { key: "D", width: 28 }, // 거래처명 / 지출처
    { key: "E", width: 34 }, // 품목 및 세부내용
    { key: "F", width: 22 }, // 공급가액 (입력칸)
    { key: "G", width: 18 }, // 세액 (자동계산)
    { key: "H", width: 24 }, // 합계금액 (자동계산)
    { key: "I", width: 30 }  // 비고 / 메모
  ];

  // Title Banner
  wsDetail.mergeCells("B2:I2");
  const dTitle = wsDetail.getCell("B2");
  dTitle.value = "16대 계정과목별 세부 매입·지출 입력장부 (과목당 추가 5칸 빈줄 제공)";
  dTitle.font = { name: "맑은 고딕", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  dTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  dTitle.alignment = { vertical: "middle", horizontal: "center" };
  wsDetail.getRow(2).height = 36;

  // Guide
  wsDetail.mergeCells("B3:I3");
  const dGuide = wsDetail.getCell("B3");
  dGuide.value = "💡 공급가액(F열)만 입력하시면 세액(G열)과 합계금액(H열)이 10% 자동 계산되며, 각 과목 소계 및 [종합 요약] 시트에 자동 합산됩니다.";
  dGuide.font = { name: "맑은 고딕", size: 10, italic: true, color: { argb: "FF2563EB" } };
  dGuide.alignment = { vertical: "middle", horizontal: "left" };
  wsDetail.getRow(3).height = 20;

  // Detail Table Header Row 5
  const dHeaders = ["NO", "계정과목", "거래처명 / 지출처", "품목 및 세부내용", "공급가액 (원)", "세액 (원)", "합계금액 (원)", "비고 / 메모"];
  const dHeaderRow = wsDetail.getRow(5);
  dHeaderRow.height = 26;

  dHeaders.forEach((h, i) => {
    const colLetter = String.fromCharCode(66 + i);
    const cell = wsDetail.getCell(`${colLetter}5`);
    cell.value = h;
    cell.font = { name: "맑은 고딕", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
    cell.alignment = { vertical: "middle", horizontal: i >= 4 && i <= 6 ? "right" : "center" };
  });

  let curRow = 6;
  const categorySubtotalRows = [];

  categories.forEach((cat, catIdx) => {
    // Category Header Row
    wsDetail.mergeCells(`B${curRow}:I${curRow}`);
    const catHeader = wsDetail.getCell(`B${curRow}`);
    catHeader.value = `▶ [${catIdx + 1}] ${cat.name} (${cat.group}) - 세부 거래처 및 지출 입력 (기존 ${cat.items.length}건 + 여유 5칸)`;
    catHeader.font = { name: "맑은 고딕", size: 11, bold: true, color: { argb: "FF1E3A8A" } };
    catHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
    catHeader.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    wsDetail.getRow(curRow).height = 24;
    curRow++;

    const itemStartRow = curRow;

    // 1. Existing items
    cat.items.forEach((item, itemIdx) => {
      const row = wsDetail.getRow(curRow);
      row.height = 22;

      row.getCell("B").value = itemIdx + 1;
      row.getCell("B").alignment = { vertical: "middle", horizontal: "center" };
      row.getCell("B").font = { name: "맑은 고딕", size: 9.5, color: { argb: "FF64748B" } };

      row.getCell("C").value = cat.name;
      row.getCell("C").alignment = { vertical: "middle", horizontal: "center" };
      row.getCell("C").font = { name: "맑은 고딕", size: 9.5, bold: true };

      row.getCell("D").value = item.vendor;
      row.getCell("D").alignment = { vertical: "middle", horizontal: "left" };
      row.getCell("D").font = { name: "맑은 고딕", size: 9.5 };

      row.getCell("E").value = item.item;
      row.getCell("E").alignment = { vertical: "middle", horizontal: "left" };
      row.getCell("E").font = { name: "맑은 고딕", size: 9.5 };

      row.getCell("F").value = item.supplyAmt;
      row.getCell("F").numFmt = '#,##0 "원"';
      row.getCell("F").alignment = { vertical: "middle", horizontal: "right" };
      row.getCell("F").font = { name: "맑은 고딕", size: 9.5, bold: true };

      if (item.taxAmt > 0) {
        row.getCell("G").value = { formula: `=ROUND(F${curRow}*0.1, 0)` };
      } else {
        row.getCell("G").value = 0;
      }
      row.getCell("G").numFmt = '#,##0 "원"';
      row.getCell("G").alignment = { vertical: "middle", horizontal: "right" };
      row.getCell("G").font = { name: "맑은 고딕", size: 9.5, color: { argb: "FF64748B" } };

      row.getCell("H").value = { formula: `=F${curRow}+G${curRow}` };
      row.getCell("H").numFmt = '#,##0 "원"';
      row.getCell("H").alignment = { vertical: "middle", horizontal: "right" };
      row.getCell("H").font = { name: "맑은 고딕", size: 9.5, bold: true, color: { argb: "FF0F172A" } };

      row.getCell("I").value = item.memo || "";
      row.getCell("I").alignment = { vertical: "middle", horizontal: "left" };
      row.getCell("I").font = { name: "맑은 고딕", size: 9, color: { argb: "FF475569" } };

      for (let c = 2; c <= 9; c++) {
        row.getCell(c).border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } }
        };
      }

      curRow++;
    });

    // 2. Extra 5 Empty/Blank Rows per category
    for (let extra = 1; extra <= 5; extra++) {
      const extraIdx = cat.items.length + extra;
      const row = wsDetail.getRow(curRow);
      row.height = 22;

      row.getCell("B").value = extraIdx;
      row.getCell("B").alignment = { vertical: "middle", horizontal: "center" };
      row.getCell("B").font = { name: "맑은 고딕", size: 9.5, color: { argb: "FF94A3B8" } };

      row.getCell("C").value = cat.name;
      row.getCell("C").alignment = { vertical: "middle", horizontal: "center" };
      row.getCell("C").font = { name: "맑은 고딕", size: 9.5, color: { argb: "FF94A3B8" } };

      row.getCell("D").value = "";
      row.getCell("D").alignment = { vertical: "middle", horizontal: "left" };
      row.getCell("D").font = { name: "맑은 고딕", size: 9.5 };

      row.getCell("E").value = "";
      row.getCell("E").alignment = { vertical: "middle", horizontal: "left" };
      row.getCell("E").font = { name: "맑은 고딕", size: 9.5 };

      // Empty Supply Input Cell
      row.getCell("F").value = null;
      row.getCell("F").numFmt = '#,##0 "원"';
      row.getCell("F").alignment = { vertical: "middle", horizontal: "right" };
      row.getCell("F").font = { name: "맑은 고딕", size: 9.5, bold: true };
      // Light yellow/green highlight on empty input cell so user knows it's an editable row
      row.getCell("F").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } };

      // Formula for Tax: =IF(F_row>0, ROUND(F_row*0.1, 0), "")
      row.getCell("G").value = { formula: `=IF(F${curRow}>0, ROUND(F${curRow}*0.1, 0), "")` };
      row.getCell("G").numFmt = '#,##0 "원"';
      row.getCell("G").alignment = { vertical: "middle", horizontal: "right" };
      row.getCell("G").font = { name: "맑은 고딕", size: 9.5, color: { argb: "FF64748B" } };

      // Formula for Total: =IF(F${curRow}>0, F${curRow}+G${curRow}, "")
      row.getCell("H").value = { formula: `=IF(F${curRow}>0, F${curRow}+G${curRow}, "")` };
      row.getCell("H").numFmt = '#,##0 "원"';
      row.getCell("H").alignment = { vertical: "middle", horizontal: "right" };
      row.getCell("H").font = { name: "맑은 고딕", size: 9.5, bold: true, color: { argb: "FF0F172A" } };

      row.getCell("I").value = "";
      row.getCell("I").alignment = { vertical: "middle", horizontal: "left" };
      row.getCell("I").font = { name: "맑은 고딕", size: 9 };

      for (let c = 2; c <= 9; c++) {
        row.getCell(c).border = {
          top: { style: "dotted", color: { argb: "FFCBD5E1" } },
          bottom: { style: "dotted", color: { argb: "FFCBD5E1" } }
        };
      }

      curRow++;
    }

    const itemEndRow = curRow - 1;

    // Subtotal Row
    const subtotalRow = wsDetail.getRow(curRow);
    subtotalRow.height = 24;

    wsDetail.mergeCells(`B${curRow}:E${curRow}`);
    const subLabel = wsDetail.getCell(`B${curRow}`);
    subLabel.value = `★ ${cat.name} 소계 (총 ${cat.items.length + 5}개 항목 수식 연동)`;
    subLabel.font = { name: "맑은 고딕", size: 10, bold: true, color: { argb: "FF1E293B" } };
    subLabel.alignment = { vertical: "middle", horizontal: "center" };
    subLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };

    // F: Supply Subtotal Formula (covers all items + 5 blank rows!)
    const fSub = subtotalRow.getCell("F");
    fSub.value = { formula: `=SUM(F${itemStartRow}:F${itemEndRow})` };
    fSub.numFmt = '#,##0 "원"';
    fSub.font = { name: "맑은 고딕", size: 10, bold: true, color: { argb: "FF2563EB" } };
    fSub.alignment = { vertical: "middle", horizontal: "right" };
    fSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };

    // G: Tax Subtotal Formula
    const gSub = subtotalRow.getCell("G");
    gSub.value = { formula: `=SUM(G${itemStartRow}:G${itemEndRow})` };
    gSub.numFmt = '#,##0 "원"';
    gSub.font = { name: "맑은 고딕", size: 10, bold: true, color: { argb: "FF64748B" } };
    gSub.alignment = { vertical: "middle", horizontal: "right" };
    gSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };

    // H: Total Subtotal Formula
    const hSub = subtotalRow.getCell("H");
    hSub.value = { formula: `=SUM(H${itemStartRow}:H${itemEndRow})` };
    hSub.numFmt = '#,##0 "원"';
    hSub.font = { name: "맑은 고딕", size: 10, bold: true, color: { argb: "FFE11D48" } };
    hSub.alignment = { vertical: "middle", horizontal: "right" };
    hSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };

    subtotalRow.getCell("I").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };

    for (let c = 2; c <= 9; c++) {
      subtotalRow.getCell(c).border = {
        top: { style: "thin", color: { argb: "FF94A3B8" } },
        bottom: { style: "medium", color: { argb: "FF64748B" } }
      };
    }

    categorySubtotalRows.push({
      id: cat.id,
      name: cat.name,
      group: cat.group,
      itemCount: cat.items.length,
      detailRow: curRow,
      topVendors: cat.items.slice(0, 3).map(it => it.vendor).filter(Boolean).join(", ")
    });

    curRow += 2;
  });

  // Grand Total in Sheet 2
  wsDetail.mergeCells(`B${curRow}:E${curRow}`);
  const grandLabel = wsDetail.getCell(`B${curRow}`);
  grandLabel.value = "★ 전사 16대 계정과목 총 결산 지출 합계";
  grandLabel.font = { name: "맑은 고딕", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  grandLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  grandLabel.alignment = { vertical: "middle", horizontal: "center" };
  wsDetail.getRow(curRow).height = 30;

  const fGrand = wsDetail.getCell(`F${curRow}`);
  fGrand.value = { formula: `=${categorySubtotalRows.map(r => `F${r.detailRow}`).join("+")}` };
  fGrand.numFmt = '#,##0 "원"';
  fGrand.font = { name: "맑은 고딕", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  fGrand.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  fGrand.alignment = { vertical: "middle", horizontal: "right" };

  const gGrand = wsDetail.getCell(`G${curRow}`);
  gGrand.value = { formula: `=${categorySubtotalRows.map(r => `G${r.detailRow}`).join("+")}` };
  gGrand.numFmt = '#,##0 "원"';
  gGrand.font = { name: "맑은 고딕", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  gGrand.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  gGrand.alignment = { vertical: "middle", horizontal: "right" };

  const hGrand = wsDetail.getCell(`H${curRow}`);
  hGrand.value = { formula: `=${categorySubtotalRows.map(r => `H${r.detailRow}`).join("+")}` };
  hGrand.numFmt = '#,##0 "원"';
  hGrand.font = { name: "맑은 고딕", size: 12, bold: true, color: { argb: "FFFFD700" } };
  hGrand.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  hGrand.alignment = { vertical: "middle", horizontal: "right" };

  wsDetail.getCell(`I${curRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };

  // =========================================================================
  // SHEET 1 TABLE ROWS (Linking to Sheet 2)
  // =========================================================================
  categorySubtotalRows.forEach((r, idx) => {
    const sRowIdx = 10 + idx;
    const row = wsSummary.getRow(sRowIdx);
    row.height = 22;

    row.getCell("B").value = idx + 1;
    row.getCell("B").alignment = { vertical: "middle", horizontal: "center" };
    row.getCell("B").font = { name: "맑은 고딕", size: 9.5, color: { argb: "FF64748B" } };

    row.getCell("C").value = r.group;
    row.getCell("C").alignment = { vertical: "middle", horizontal: "center" };
    row.getCell("C").font = { name: "맑은 고딕", size: 9.5 };

    row.getCell("D").value = r.name;
    row.getCell("D").alignment = { vertical: "middle", horizontal: "left" };
    row.getCell("D").font = { name: "맑은 고딕", size: 10, bold: true };

    row.getCell("E").value = `${r.itemCount}건 (+5)`;
    row.getCell("E").alignment = { vertical: "middle", horizontal: "center" };
    row.getCell("E").font = { name: "맑은 고딕", size: 9.5, color: { argb: "FF475569" } };

    row.getCell("F").value = { formula: `='📋 16대 계정과목 세부 입력장부'!F${r.detailRow}` };
    row.getCell("F").numFmt = '#,##0 "원"';
    row.getCell("F").alignment = { vertical: "middle", horizontal: "right" };
    row.getCell("F").font = { name: "맑은 고딕", size: 9.5, bold: true };

    row.getCell("G").value = { formula: `='📋 16대 계정과목 세부 입력장부'!G${r.detailRow}` };
    row.getCell("G").numFmt = '#,##0 "원"';
    row.getCell("G").alignment = { vertical: "middle", horizontal: "right" };
    row.getCell("G").font = { name: "맑은 고딕", size: 9.5, color: { argb: "FF64748B" } };

    row.getCell("H").value = { formula: `='📋 16대 계정과목 세부 입력장부'!H${r.detailRow}` };
    row.getCell("H").numFmt = '#,##0 "원"';
    row.getCell("H").alignment = { vertical: "middle", horizontal: "right" };
    row.getCell("H").font = { name: "맑은 고딕", size: 10, bold: true, color: { argb: "FF0F172A" } };

    row.getCell("I").value = { formula: `=H${sRowIdx}/$H$26` };
    row.getCell("I").numFmt = "0.00%";
    row.getCell("I").alignment = { vertical: "middle", horizontal: "right" };
    row.getCell("I").font = { name: "맑은 고딕", size: 9.5, bold: true, color: { argb: "FF2563EB" } };

    row.getCell("J").value = r.topVendors ? `주요처: ${r.topVendors}` : "";
    row.getCell("J").alignment = { vertical: "middle", horizontal: "left" };
    row.getCell("J").font = { name: "맑은 고딕", size: 9, color: { argb: "FF64748B" } };

    for (let c = 2; c <= 10; c++) {
      row.getCell(c).border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } }
      };
    }
  });

  // Summary Sheet Grand Total Row (Row 26)
  const sumGrandRow = wsSummary.getRow(26);
  sumGrandRow.height = 28;

  wsSummary.mergeCells("B26:E26");
  const sgLabel = wsSummary.getCell("B26");
  sgLabel.value = "★ 전사 16대 계정과목 총 결산 지출 합계";
  sgLabel.font = { name: "맑은 고딕", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
  sgLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  sgLabel.alignment = { vertical: "middle", horizontal: "center" };

  const sgSupply = wsSummary.getCell("F26");
  sgSupply.value = { formula: "=SUM(F10:F25)" };
  sgSupply.numFmt = '#,##0 "원"';
  sgSupply.font = { name: "맑은 고딕", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
  sgSupply.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  sgSupply.alignment = { vertical: "middle", horizontal: "right" };

  const sgTax = wsSummary.getCell("G26");
  sgTax.value = { formula: "=SUM(G10:G25)" };
  sgTax.numFmt = '#,##0 "원"';
  sgTax.font = { name: "맑은 고딕", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
  sgTax.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  sgTax.alignment = { vertical: "middle", horizontal: "right" };

  const sgTotal = wsSummary.getCell("H26");
  sgTotal.value = { formula: "=SUM(H10:H25)" };
  sgTotal.numFmt = '#,##0 "원"';
  sgTotal.font = { name: "맑은 고딕", size: 11.5, bold: true, color: { argb: "FFFFD700" } };
  sgTotal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  sgTotal.alignment = { vertical: "middle", horizontal: "right" };

  const sgShare = wsSummary.getCell("I26");
  sgShare.value = 1.0;
  sgShare.numFmt = "0.0%";
  sgShare.font = { name: "맑은 고딕", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
  sgShare.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  sgShare.alignment = { vertical: "middle", horizontal: "right" };

  wsSummary.getCell("J26").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };

  // Write destinations
  const destinations = [
    "C:\\Users\\k0115\\OneDrive\\바탕 화면\\AI_월간_결산서_간편작성_템플릿(자동계산).xlsx",
    "C:\\Users\\k0115\\OneDrive\\바탕 화면\\2026.08_AI_결산서_간편작성.xlsx",
    "C:\\Users\\k0115\\OneDrive\\바탕 화면\\AI_결산서.xlsx",
    "C:\\Users\\k0115\\Downloads\\AI_월간_결산서_간편작성_템플릿(자동계산).xlsx",
    "C:\\Users\\k0115\\OneDrive\\문서\\AI_월간_결산서_간편작성_템플릿(자동계산).xlsx"
  ];

  for (const dest of destinations) {
    try {
      const dir = path.dirname(dest);
      if (fs.existsSync(dir)) {
        await workbook.xlsx.writeFile(dest);
        console.log(`✓ Successfully updated with 5 blank rows: ${dest}`);
      }
    } catch (err) {
      console.warn(`Could not write to ${dest}:`, err.message);
    }
  }
}

generateClosingExcelWithEmptyRows();
