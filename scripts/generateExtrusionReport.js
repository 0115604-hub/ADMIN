const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function createExtrusionChecksheet() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '(주)오륙 삼랑진공장 SL생산팀';
  workbook.lastModifiedBy = 'Antigravity AI';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Colors & Styles
  const headerBg = 'FF1E293B'; // slate-800
  const subHeaderBg = 'FF334155'; // slate-700
  const sectionBg = 'FFF1F5F9'; // slate-100
  const highlightTeal = 'FFCCFBF1'; // teal-100
  const highlightAmber = 'FFFEF3C7'; // amber-100
  const highlightRose = 'FFFFE4E6'; // rose-100
  const borderColor = 'FFCBD5E1'; // slate-300

  const thinBorder = {
    top: { style: 'thin', color: { argb: borderColor } },
    left: { style: 'thin', color: { argb: borderColor } },
    bottom: { style: 'thin', color: { argb: borderColor } },
    right: { style: 'thin', color: { argb: borderColor } }
  };

  const mediumBorder = {
    top: { style: 'medium', color: { argb: 'FF475569' } },
    left: { style: 'medium', color: { argb: 'FF475569' } },
    bottom: { style: 'medium', color: { argb: 'FF475569' } },
    right: { style: 'medium', color: { argb: 'FF475569' } }
  };

  // =========================================================================
  // SHEET 1: 작업체크시트 (압출 110Ø & 60Ø / PCM 가류조 13-Zone 통합본)
  // =========================================================================
  const ws1 = workbook.addWorksheet('작업체크시트', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    }
  });

  // Set column widths (A ~ M, 13 cols)
  ws1.columns = [
    { width: 10 }, // A: 구분 / No
    { width: 12 }, // B: 항목1 / 110Ø 속도
    { width: 12 }, // C: 항목2 / 60Ø 속도
    { width: 10 }, // D: 온수조 sc / Z1
    { width: 10 }, // E: 온수조 sy1 / Z2
    { width: 10 }, // F: 온수조 sy2 / Z3
    { width: 10 }, // G: 온수조 sy3 / Z4
    { width: 10 }, // H: 온수조 hd1 / Z5
    { width: 10 }, // I: 60Ø sc / Z6
    { width: 10 }, // J: 60Ø sy1 / Z7
    { width: 10 }, // K: 60Ø sy2 / Z8
    { width: 10 }, // L: 60Ø sy3 / Z9
    { width: 12 }  // M: 코팅두께 / 인취속도
  ];

  // Title & Approval Box
  ws1.mergeCells('A1:J2');
  const titleCell = ws1.getCell('A1');
  titleCell.value = '작  업  체  크  시  트';
  titleCell.font = { name: '맑은 고딕', size: 18, bold: true, color: { argb: 'FF0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.border = mediumBorder;

  // Approval Box
  ws1.mergeCells('K1:K2');
  ws1.getCell('K1').value = '결\n\n재';
  ws1.getCell('K1').font = { name: '맑은 고딕', size: 10, bold: true };
  ws1.getCell('K1').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  ws1.getCell('K1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };
  ws1.getCell('K1').border = thinBorder;

  const appHeaders = ['직  장', '과  장', '팀  장'];
  ['L1', 'M1'].forEach((cellRef, idx) => {
    // We can merge or split approval cells
  });

  ws1.getCell('L1').value = '직  장';
  ws1.getCell('L1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell('L1').font = { name: '맑은 고딕', size: 9, bold: true };
  ws1.getCell('L1').border = thinBorder;
  ws1.getCell('L1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

  ws1.getCell('M1').value = '팀  장';
  ws1.getCell('M1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell('M1').font = { name: '맑은 고딕', size: 9, bold: true };
  ws1.getCell('M1').border = thinBorder;
  ws1.getCell('M1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

  ws1.getCell('L2').value = '';
  ws1.getCell('L2').border = thinBorder;
  ws1.getCell('M2').value = '';
  ws1.getCell('M2').border = thinBorder;

  // 1. 공정 및 설비명 Section Header
  ws1.mergeCells('A3:I3');
  ws1.getCell('A3').value = '1. 공정 및 설비명 (110Ø & 60Ø 압출 / PCM 13-Zone 가류 라인)';
  ws1.getCell('A3').font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  ws1.getCell('A3').alignment = { horizontal: 'left', vertical: 'middle' };

  ws1.mergeCells('J3:M3');
  ws1.getCell('J3').value = '팀(부서)명 : (주)오륙 SL생산팀';
  ws1.getCell('J3').font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF334155' } };
  ws1.getCell('J3').alignment = { horizontal: 'right', vertical: 'middle' };

  // 1. Meta table (Rows 4-5)
  const metaRows = [
    [
      { label: '품명', span: 1 }, { val: 'JX1 Lower Run Channel RR', span: 3 },
      { label: '품번 / 지시 / 실적', span: 1 }, { val: 'JK1 LWR RUN RR "J" / 2,500m / 2,935m (ea)', span: 4 },
      { label: '단위', span: 1 }, { val: 'M / EA', span: 1 }
    ],
    [
      { label: '라인명', span: 1 }, { val: 'PCM 1호기 (110Ø + 60Ø / PCM 13-ZONE)', span: 3 },
      { label: '작업일자', span: 1 }, { val: '2026.09.30 (주간)', span: 2 },
      { label: '작업자명', span: 1 }, { val: '공영국 대리 (현해)', span: 2 },
      { label: 'TPM점검', span: 1 }, { val: '10개항목 완료 (○)', span: 1 }
    ]
  ];

  let curRow = 4;
  metaRows.forEach(r => {
    let colIdx = 1;
    r.forEach(item => {
      const startCell = ws1.getCell(curRow, colIdx);
      startCell.value = item.label ? item.label : item.val;
      if (item.label) {
        startCell.font = { name: '맑은 고딕', size: 9, bold: true };
        startCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };
        startCell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        startCell.font = { name: '맑은 고딕', size: 9, bold: item.val.includes('110Ø') || item.val.includes('JK1') };
        startCell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
      if (item.span > 1) {
        ws1.mergeCells(curRow, colIdx, curRow, colIdx + item.span - 1);
      }
      for (let c = 0; c < item.span; c++) {
        ws1.getCell(curRow, colIdx + c).border = thinBorder;
      }
      colIdx += item.span;
    });
    curRow++;
  });

  // 2. 작업현황 Section Header (Row 6)
  ws1.mergeCells('A6:M6');
  ws1.getCell('A6').value = '2. 작업현황 (생산실적 / 불량세부 / 비가동 / 원자재 LOT)';
  ws1.getCell('A6').font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  ws1.getCell('A6').alignment = { horizontal: 'left', vertical: 'middle' };

  // 2. Details Table (Rows 7-12)
  const workStatusRows = [
    { title: '생산현황', span: 2, content: 'JK1 LWR RUN RR "J" / 계획: 2,500m / 실적: 2,935m (08:00 - 13:39) / 양품: 2,850m' },
    { title: '불량현황', span: 2, content: '단면조정 불량: 23.20 kg  |  셋지(생지/시동) 불량: 3.80 kg  |  치수/외관 불량: 2.50 kg  |  총 스크랩: 29.50 kg' },
    { title: '비가동현황', span: 2, content: '품종교체(형교환) : 08:00 ~ 08:50 (50분 소요 / BC4T ➔ JK1 라인 셋팅 및 금형 교체 완료)' },
    { title: '연고무 LOT', span: 2, content: 'W60433 / UF10161726927028200A  ,  W60433 / UF10161726927032700A' },
    { title: '코팅액 LOT', span: 2, content: 'UF10161726927032700A (PU 코팅액 정상 교반 및 투입 완료)' },
    { title: '심금(인서트) LOT', span: 2, content: 'SK5 0.5T / LOT-260930A (규격 적합, 롤 텐션 정상)' }
  ];

  curRow = 7;
  workStatusRows.forEach(item => {
    ws1.mergeCells(curRow, 1, curRow, item.span);
    const hCell = ws1.getCell(curRow, 1);
    hCell.value = item.title;
    hCell.font = { name: '맑은 고딕', size: 9, bold: true };
    hCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };
    hCell.alignment = { horizontal: 'center', vertical: 'middle' };
    hCell.border = thinBorder;

    ws1.mergeCells(curRow, item.span + 1, curRow, 13);
    const dCell = ws1.getCell(curRow, item.span + 1);
    dCell.value = item.content;
    dCell.font = { name: '맑은 고딕', size: 9 };
    dCell.alignment = { horizontal: 'left', vertical: 'middle' };
    for (let c = 1; c <= 13; c++) {
      ws1.getCell(curRow, c).border = thinBorder;
    }
    curRow++;
  });

  // 3. 압출조건 Section Header (Row 13)
  curRow = 13;
  ws1.mergeCells(`A${curRow}:M${curRow}`);
  ws1.getCell(`A${curRow}`).value = '3. 압출조건 (110Ø & 60Ø 압출기 RPM / 온수조 ℃ / PU 코팅두께 ㎛)';
  ws1.getCell(`A${curRow}`).font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  ws1.getCell(`A${curRow}`).alignment = { horizontal: 'left', vertical: 'middle' };

  // 3. Extrusion Conditions Table Header (Rows 14-15)
  curRow = 14;
  ws1.mergeCells(`A${curRow}:A${curRow+1}`);
  ws1.getCell(`A${curRow}`).value = '구분 / 시간';
  ws1.getCell(`A${curRow}`).font = { name: '맑은 고딕', size: 9, bold: true };
  ws1.getCell(`A${curRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`A${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

  // 압출기 조건 (110Ø & 60Ø)
  ws1.mergeCells(`B${curRow}:C${curRow}`);
  ws1.getCell(`B${curRow}`).value = '압출기 조건 (RPM)';
  ws1.getCell(`B${curRow}`).font = { name: '맑은 고딕', size: 9, bold: true };
  ws1.getCell(`B${curRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`B${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };

  ws1.getCell(`B${curRow+1}`).value = '110Ø (RPM)';
  ws1.getCell(`B${curRow+1}`).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(`B${curRow+1}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`B${curRow+1}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };

  ws1.getCell(`C${curRow+1}`).value = '60Ø (RPM)';
  ws1.getCell(`C${curRow+1}`).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(`C${curRow+1}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`C${curRow+1}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };

  // 온수조 조건 (110Ø: sc, sy1, sy2, sy3, hd1 | 60Ø: sc, sy1, sy2, sy3)
  ws1.mergeCells(`D${curRow}:H${curRow}`);
  ws1.getCell(`D${curRow}`).value = '110Ø 온수조 조건 (℃)';
  ws1.getCell(`D${curRow}`).font = { name: '맑은 고딕', size: 9, bold: true };
  ws1.getCell(`D${curRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`D${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };

  const w110Headers = ['sc', 'sy1', 'sy2', 'sy3', 'hd1'];
  w110Headers.forEach((h, idx) => {
    const cell = ws1.getCell(curRow + 1, 4 + idx);
    cell.value = h;
    cell.font = { name: '맑은 고딕', size: 8.5, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };
  });

  ws1.mergeCells(`I${curRow}:L${curRow}`);
  ws1.getCell(`I${curRow}`).value = '60Ø 온수조 조건 (℃)';
  ws1.getCell(`I${curRow}`).font = { name: '맑은 고딕', size: 9, bold: true };
  ws1.getCell(`I${curRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`I${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };

  const w60Headers = ['sc', 'sy1', 'sy2', 'sy3'];
  w60Headers.forEach((h, idx) => {
    const cell = ws1.getCell(curRow + 1, 9 + idx);
    cell.value = h;
    cell.font = { name: '맑은 고딕', size: 8.5, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };
  });

  // PU 코팅두께 (㎛)
  ws1.getCell(`M${curRow}`).value = 'PU 코팅두께';
  ws1.getCell(`M${curRow}`).font = { name: '맑은 고딕', size: 9, bold: true };
  ws1.getCell(`M${curRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`M${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };

  ws1.getCell(`M${curRow+1}`).value = '기저/OUT/IN';
  ws1.getCell(`M${curRow+1}`).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(`M${curRow+1}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`M${curRow+1}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };

  for (let r = curRow; r <= curRow + 1; r++) {
    for (let c = 1; c <= 13; c++) {
      ws1.getCell(r, c).border = thinBorder;
    }
  }

  // Standard Row & Data Rows (Rows 16-19)
  const extDataRows = [
    { time: '표준 기준', r110: '29.0±2.9', r60: '20.0±2.0', w110: ['50±5', '50±5', '50±5', '50±5', '55±5'], w60: ['50±5', '50±5', '50±5', '50±5'], pu: '15㎛ 이상', isStd: true },
    { time: '09:33', r110: '26.4', r60: '19.2', w110: ['47.0', '44.0', '47.0', '48.0', '53.0'], w60: ['48.0', '47.0', '47.0', '47.0'], pu: '16.1 / 20.8 / 16.1' },
    { time: '11:17', r110: '26.4', r60: '19.2', w110: ['47.0', '46.0', '47.0', '47.0', '53.0'], w60: ['47.0', '46.0', '47.0', '47.0'], pu: '21.3 / 16.8 / 15.7' },
    { time: '13:01', r110: '26.4', r60: '19.2', w110: ['48.0', '47.0', '47.0', '47.0', '53.0'], w60: ['48.0', '47.0', '47.0', '47.0'], pu: '15.6 / 15.6 / 15.0' }
  ];

  curRow = 16;
  extDataRows.forEach(row => {
    const tCell = ws1.getCell(curRow, 1);
    tCell.value = row.time;
    tCell.font = { name: '맑은 고딕', size: 8.5, bold: row.isStd };
    tCell.alignment = { horizontal: 'center', vertical: 'middle' };
    if (row.isStd) tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

    ws1.getCell(curRow, 2).value = row.r110;
    ws1.getCell(curRow, 3).value = row.r60;
    row.w110.forEach((val, i) => { ws1.getCell(curRow, 4 + i).value = val; });
    row.w60.forEach((val, i) => { ws1.getCell(curRow, 9 + i).value = val; });
    ws1.getCell(curRow, 13).value = row.pu;

    for (let c = 1; c <= 13; c++) {
      const cell = ws1.getCell(curRow, c);
      cell.border = thinBorder;
      cell.font = { name: '맑은 고딕', size: 8.5, bold: row.isStd };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (row.isStd) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };
    }
    curRow++;
  });

  // 4-1. PCM 가류조 조건 (13개 Zone, 210±20℃ 기준) (Row 20)
  curRow = 20;
  ws1.mergeCells(`A${curRow}:M${curRow}`);
  ws1.getCell(`A${curRow}`).value = '4-1. PCM 가류조 조건 (기준: 210℃ ± 20℃ [190.0℃ ~ 230.0℃] / 13개 Zone 개별 관리 / 인취속도)';
  ws1.getCell(`A${curRow}`).font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  ws1.getCell(`A${curRow}`).alignment = { horizontal: 'left', vertical: 'middle' };

  // PCM Table Header (Zone 1 ~ Zone 13 & 속도) (Rows 21-22)
  curRow = 21;
  ws1.mergeCells(`A${curRow}:A${curRow+1}`);
  ws1.getCell(`A${curRow}`).value = '구분 / 시간';
  ws1.getCell(`A${curRow}`).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(`A${curRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`A${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

  // Zone 1 ~ Zone 6 (Cols B ~ G)
  ws1.mergeCells(`B${curRow}:G${curRow}`);
  ws1.getCell(`B${curRow}`).value = 'PCM 가류조 전반부 온도 (℃) [표준: 210 ± 20 ℃]';
  ws1.getCell(`B${curRow}`).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(`B${curRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`B${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };

  for (let z = 1; z <= 6; z++) {
    const cell = ws1.getCell(curRow + 1, 1 + z);
    cell.value = `Z${z}`;
    cell.font = { name: '맑은 고딕', size: 8.5, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };
  }

  // Zone 7 ~ Zone 13 (Cols H ~ L + M sub)
  ws1.mergeCells(`H${curRow}:L${curRow}`);
  ws1.getCell(`H${curRow}`).value = 'PCM 후반부 온도 (Z7~Z13) [210±20℃]';
  ws1.getCell(`H${curRow}`).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(`H${curRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`H${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };

  const zBack = ['Z7', 'Z8', 'Z9', 'Z10~11', 'Z12~13'];
  zBack.forEach((zName, i) => {
    const cell = ws1.getCell(curRow + 1, 8 + i);
    cell.value = zName;
    cell.font = { name: '맑은 고딕', size: 8.5, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };
  });

  ws1.getCell(`M${curRow}`).value = '라인속도';
  ws1.getCell(`M${curRow}`).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(`M${curRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`M${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };

  ws1.getCell(`M${curRow+1}`).value = '인취(m/분)';
  ws1.getCell(`M${curRow+1}`).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(`M${curRow+1}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`M${curRow+1}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };

  for (let r = curRow; r <= curRow + 1; r++) {
    for (let c = 1; c <= 13; c++) {
      ws1.getCell(r, c).border = thinBorder;
    }
  }

  // PCM Data Rows (Rows 23-26)
  const pcmRows = [
    { time: '표준 기준', zFront: ['210±20', '210±20', '210±20', '210±20', '210±20', '210±20'], zBack: ['210±20', '210±20', '210±20', '210±20', '210±20'], speed: '20.0±1.0', isStd: true },
    { time: '09:33', zFront: ['211.0', '212.5', '214.0', '210.5', '209.0', '213.0'], zBack: ['212.0', '210.0', '211.5', '215.0', '211.0'], speed: '19.6' },
    { time: '11:17', zFront: ['210.5', '212.0', '213.5', '211.0', '209.5', '212.5'], zBack: ['211.5', '210.5', '211.0', '214.0', '210.5'], speed: '19.7' },
    { time: '13:01', zFront: ['211.5', '213.0', '214.5', '211.5', '210.0', '213.0'], zBack: ['212.0', '211.0', '211.5', '214.5', '211.0'], speed: '19.5' }
  ];

  curRow = 23;
  pcmRows.forEach(row => {
    const tCell = ws1.getCell(curRow, 1);
    tCell.value = row.time;
    tCell.font = { name: '맑은 고딕', size: 8.5, bold: row.isStd };
    tCell.alignment = { horizontal: 'center', vertical: 'middle' };
    if (row.isStd) tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

    row.zFront.forEach((val, i) => { ws1.getCell(curRow, 2 + i).value = val; });
    row.zBack.forEach((val, i) => { ws1.getCell(curRow, 8 + i).value = val; });
    ws1.getCell(curRow, 13).value = row.speed;

    for (let c = 1; c <= 13; c++) {
      const cell = ws1.getCell(curRow, c);
      cell.border = thinBorder;
      cell.font = { name: '맑은 고딕', size: 8.5, bold: row.isStd };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (row.isStd) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };
    }
    curRow++;
  });

  // 4-2. 코팅건 분사압력, 프라즈마, 건조로, NIR, 후로킹 Section (Row 27)
  curRow = 27;
  ws1.mergeCells(`A${curRow}:M${curRow}`);
  ws1.getCell(`A${curRow}`).value = '4-2. 코팅건 분사압력 (1~4번) / 프라즈마 출력 / 건조로 (180±10℃) / NIR (%) / 후로킹 공급량';
  ws1.getCell(`A${curRow}`).font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  ws1.getCell(`A${curRow}`).alignment = { horizontal: 'left', vertical: 'middle' };

  // Sub Table Headers (Rows 28-29)
  curRow = 28;
  ws1.mergeCells(`A${curRow}:A${curRow+1}`);
  ws1.getCell(`A${curRow}`).value = '구분 / 시간';
  ws1.getCell(`A${curRow}`).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(`A${curRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`A${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

  // 코팅건 분사압력 (Cols B ~ E)
  ws1.mergeCells(`B${curRow}:E${curRow}`);
  ws1.getCell(`B${curRow}`).value = '코팅건 분사압력 (bar)';
  ws1.getCell(`B${curRow}`).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(`B${curRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`B${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };

  ['#1건', '#2건', '#3건', '#4건'].forEach((h, i) => {
    const cell = ws1.getCell(curRow + 1, 2 + i);
    cell.value = h;
    cell.font = { name: '맑은 고딕', size: 8.5, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };
  });

  // 프라즈마 출력 (Cols F ~ H)
  ws1.mergeCells(`F${curRow}:H${curRow}`);
  ws1.getCell(`F${curRow}`).value = '프라즈마 출력 (A) [3.0±0.5A]';
  ws1.getCell(`F${curRow}`).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(`F${curRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`F${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };

  ['#1~#2', '#3~#4', '#5'].forEach((h, i) => {
    const cell = ws1.getCell(curRow + 1, 6 + i);
    cell.value = h;
    cell.font = { name: '맑은 고딕', size: 8.5, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };
  });

  // 건조로 & NIR (Cols I ~ L)
  ws1.mergeCells(`I${curRow}:J${curRow}`);
  ws1.getCell(`I${curRow}`).value = '건조로 (℃) [180±10℃]';
  ws1.getCell(`I${curRow}`).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(`I${curRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`I${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };

  ws1.getCell(curRow + 1, 9).value = 'no.1~2';
  ws1.getCell(curRow + 1, 9).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(curRow + 1, 9).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(curRow + 1, 9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };

  ws1.getCell(curRow + 1, 10).value = 'no.3';
  ws1.getCell(curRow + 1, 10).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(curRow + 1, 10).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(curRow + 1, 10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };

  ws1.mergeCells(`K${curRow}:L${curRow}`);
  ws1.getCell(`K${curRow}`).value = 'NIR 출력 (%)';
  ws1.getCell(`K${curRow}`).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(`K${curRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`K${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };

  ws1.getCell(curRow + 1, 11).value = 'no.1';
  ws1.getCell(curRow + 1, 11).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(curRow + 1, 11).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(curRow + 1, 11).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };

  ws1.getCell(curRow + 1, 12).value = 'no.2~3';
  ws1.getCell(curRow + 1, 12).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(curRow + 1, 12).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(curRow + 1, 12).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightAmber } };

  // 후로킹/본드 (Col M)
  ws1.getCell(`M${curRow}`).value = '후로킹/본드';
  ws1.getCell(`M${curRow}`).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(`M${curRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`M${curRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

  ws1.getCell(`M${curRow+1}`).value = '공급상태';
  ws1.getCell(`M${curRow+1}`).font = { name: '맑은 고딕', size: 8.5, bold: true };
  ws1.getCell(`M${curRow+1}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getCell(`M${curRow+1}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

  for (let r = curRow; r <= curRow + 1; r++) {
    for (let c = 1; c <= 13; c++) {
      ws1.getCell(r, c).border = thinBorder;
    }
  }

  // Plasma & Spray Data Rows (Rows 30-33)
  const sprayDataRows = [
    { time: '표준 기준', spray: ['2.5', '2.5', '2.5', '2.5'], plasma: ['3.0±0.5', '3.0±0.5', '3.0±0.5'], dry: ['180±10', '180±10'], nir: ['70±5', '75±5'], flock: '정상공급', isStd: true },
    { time: '09:33', spray: ['2.5', '2.6', '2.5', '2.4'], plasma: ['2.9 / 3.0', '2.9 / 3.0', '2.8'], dry: ['181.0', '180.0'], nir: ['68.0', '77.0 / 78.0'], flock: '양호(○)' },
    { time: '11:17', spray: ['2.5', '2.6', '2.5', '2.4'], plasma: ['2.9 / 3.0', '2.8 / 3.0', '2.8'], dry: ['180.0', '180.0'], nir: ['67.0', '78.0 / 77.0'], flock: '양호(○)' },
    { time: '13:01', spray: ['2.5', '2.6', '2.5', '2.4'], plasma: ['3.0 / 3.1', '2.9 / 3.1', '3.0'], dry: ['181.0', '180.0'], nir: ['70.0', '79.0 / 79.0'], flock: '양호(○)' }
  ];

  curRow = 30;
  sprayDataRows.forEach(row => {
    const tCell = ws1.getCell(curRow, 1);
    tCell.value = row.time;
    tCell.font = { name: '맑은 고딕', size: 8.5, bold: row.isStd };
    tCell.alignment = { horizontal: 'center', vertical: 'middle' };
    if (row.isStd) tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };

    row.spray.forEach((val, i) => { ws1.getCell(curRow, 2 + i).value = val; });
    row.plasma.forEach((val, i) => { ws1.getCell(curRow, 6 + i).value = val; });
    row.dry.forEach((val, i) => { ws1.getCell(curRow, 9 + i).value = val; });
    row.nir.forEach((val, i) => { ws1.getCell(curRow, 11 + i).value = val; });
    ws1.getCell(curRow, 13).value = row.flock;

    for (let c = 1; c <= 13; c++) {
      const cell = ws1.getCell(curRow, c);
      cell.border = thinBorder;
      cell.font = { name: '맑은 고딕', size: 8.5, bold: row.isStd };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (row.isStd) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };
    }
    curRow++;
  });

  // Footer / Company Seal
  curRow = 34;
  ws1.mergeCells(`A${curRow}:G${curRow}`);
  ws1.getCell(`A${curRow}`).value = '(주)오륙 삼랑진공장  /  (주)화승 R&A 협력업체';
  ws1.getCell(`A${curRow}`).font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FF475569' } };
  ws1.getCell(`A${curRow}`).alignment = { horizontal: 'left', vertical: 'middle' };

  ws1.mergeCells(`H${curRow}:M${curRow}`);
  ws1.getCell(`H${curRow}`).value = '문서양식: A4 (210 × 297 mm) 표준 체크시트';
  ws1.getCell(`H${curRow}`).font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FF64748B' } };
  ws1.getCell(`H${curRow}`).alignment = { horizontal: 'right', vertical: 'middle' };

  // =========================================================================
  // SHEET 2: PCM_13Zone_상세온도기록 (13개 개별 존 시간대별 실측 및 편차 관리)
  // =========================================================================
  const ws2 = workbook.addWorksheet('PCM_13Zone_상세온도기록', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
  });

  ws2.columns = [
    { width: 14 }, // A: 점검시간
    { width: 10 }, // B: Zone 1
    { width: 10 }, // C: Zone 2
    { width: 10 }, // D: Zone 3
    { width: 10 }, // E: Zone 4
    { width: 10 }, // F: Zone 5
    { width: 10 }, // G: Zone 6
    { width: 10 }, // H: Zone 7
    { width: 10 }, // I: Zone 8
    { width: 10 }, // J: Zone 9
    { width: 10 }, // K: Zone 10
    { width: 10 }, // L: Zone 11
    { width: 10 }, // M: Zone 12
    { width: 10 }, // N: Zone 13
    { width: 12 }, // O: 평균온도(℃)
    { width: 12 }, // P: 최저/최고
    { width: 12 }  // Q: 판정
  ];

  ws2.mergeCells('A1:Q1');
  const ws2Title = ws2.getCell('A1');
  ws2Title.value = 'PCM 가류조 13개 Zone별 시간대별 상세 온도 관리일지 (표준: 210℃ ± 20℃)';
  ws2Title.font = { name: '맑은 고딕', size: 15, bold: true, color: { argb: 'FF0F172A' } };
  ws2Title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws2Title.border = mediumBorder;
  ws2Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };

  ws2.mergeCells('A2:Q2');
  ws2.getCell('A2').value = '■ 설비명: PCM 1호기 가류조  |  작업일자: 2026.09.30 (주간)  |  기준 관리한계: 190.0℃ ~ 230.0℃  |  담당자: 공영국 대리';
  ws2.getCell('A2').font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF334155' } };
  ws2.getCell('A2').alignment = { horizontal: 'left', vertical: 'middle' };

  // Headers (Row 3)
  const zHeaderNames = [
    '점검 시간',
    'Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6',
    'Zone 7', 'Zone 8', 'Zone 9', 'Zone 10', 'Zone 11', 'Zone 12', 'Zone 13',
    '평균온도(℃)', '최저 / 최고', '최종판정'
  ];

  zHeaderNames.forEach((name, idx) => {
    const cell = ws2.getCell(3, idx + 1);
    cell.value = name;
    cell.font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  // Standard Row (Row 4)
  const pcmDetailedStd = ['표준 기준치', 210, 210, 210, 210, 210, 210, 210, 210, 210, 210, 210, 210, 210, '210.0', '190 ~ 230', '표준적합'];
  pcmDetailedStd.forEach((val, idx) => {
    const cell = ws2.getCell(4, idx + 1);
    cell.value = val;
    cell.font = { name: '맑은 고딕', size: 9, bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  // Time Logs
  const pcmDetailedLogs = [
    ['08:30 (시동시)', 208.5, 209.0, 212.0, 210.0, 207.5, 211.0, 210.0, 209.5, 210.5, 213.0, 208.0, 209.0, 211.0, 209.9, '207.5 / 213.0', '🟢 정상'],
    ['09:30 (1차)', 211.0, 212.5, 214.0, 210.5, 209.0, 213.0, 212.0, 210.0, 211.5, 215.0, 208.5, 210.0, 212.0, 211.5, '208.5 / 215.0', '🟢 정상'],
    ['10:30 (2차)', 210.0, 211.5, 213.0, 211.0, 209.5, 212.0, 211.5, 210.5, 211.0, 214.0, 209.0, 210.5, 211.5, 211.2, '209.0 / 214.0', '🟢 정상'],
    ['11:30 (3차)', 210.5, 212.0, 213.5, 211.0, 209.5, 212.5, 211.5, 210.5, 211.0, 214.0, 209.0, 210.5, 211.0, 211.2, '209.0 / 214.0', '🟢 정상'],
    ['12:30 (4차)', 211.0, 212.0, 214.0, 211.5, 210.0, 213.0, 212.0, 211.0, 211.5, 214.5, 209.5, 211.0, 212.0, 211.8, '209.5 / 214.5', '🟢 정상'],
    ['13:30 (5차)', 211.5, 213.0, 214.5, 211.5, 210.0, 213.0, 212.0, 211.0, 211.5, 214.5, 209.5, 211.0, 212.0, 211.9, '209.5 / 214.5', '🟢 정상'],
    ['14:30 (6차)', 210.5, 212.0, 213.5, 211.0, 209.5, 212.5, 211.5, 210.5, 211.0, 214.0, 209.0, 210.5, 211.5, 211.3, '209.0 / 214.0', '🟢 정상'],
    ['15:30 (7차)', 211.0, 212.5, 214.0, 211.0, 210.0, 213.0, 212.0, 211.0, 211.5, 214.5, 209.5, 211.0, 212.0, 211.8, '209.5 / 214.5', '🟢 정상'],
    ['16:30 (종료시)', 210.0, 211.5, 213.0, 210.5, 209.0, 212.0, 211.0, 210.0, 210.5, 213.5, 208.5, 210.0, 211.0, 210.8, '208.5 / 213.5', '🟢 정상']
  ];

  pcmDetailedLogs.forEach((rowVals, rIdx) => {
    const rowNum = 5 + rIdx;
    rowVals.forEach((val, cIdx) => {
      const cell = ws2.getCell(rowNum, cIdx + 1);
      cell.value = val;
      cell.font = { name: '맑은 고딕', size: 9 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder;
      if (cIdx === 0) {
        cell.font = { name: '맑은 고딕', size: 9, bold: true };
      }
      if (cIdx === 14) {
        cell.font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FF0F766E' } };
      }
    });
  });

  // Summary Row (Row 14)
  const sumRow = 14;
  ws2.getCell(sumRow, 1).value = '전체 일일 종합';
  ws2.getCell(sumRow, 1).font = { name: '맑은 고딕', size: 9, bold: true };
  ws2.getCell(sumRow, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };
  ws2.getCell(sumRow, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  ws2.getCell(sumRow, 1).border = thinBorder;

  for (let c = 2; c <= 14; c++) {
    const colLetter = String.fromCharCode(64 + c);
    const cell = ws2.getCell(sumRow, c);
    cell.value = { formula: `AVERAGE(${colLetter}5:${colLetter}13)` };
    cell.numFmt = '0.0';
    cell.font = { name: '맑은 고딕', size: 9, bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  }

  ws2.getCell(sumRow, 15).value = { formula: `AVERAGE(O5:O13)` };
  ws2.getCell(sumRow, 15).numFmt = '0.0';
  ws2.getCell(sumRow, 15).font = { name: '맑은 고딕', size: 9, bold: true };
  ws2.getCell(sumRow, 15).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };
  ws2.getCell(sumRow, 15).alignment = { horizontal: 'center', vertical: 'middle' };
  ws2.getCell(sumRow, 15).border = thinBorder;

  ws2.getCell(sumRow, 16).value = '207.5 / 215.0';
  ws2.getCell(sumRow, 16).font = { name: '맑은 고딕', size: 9, bold: true };
  ws2.getCell(sumRow, 16).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };
  ws2.getCell(sumRow, 16).alignment = { horizontal: 'center', vertical: 'middle' };
  ws2.getCell(sumRow, 16).border = thinBorder;

  ws2.getCell(sumRow, 17).value = '🟢 100% 정상 (OK)';
  ws2.getCell(sumRow, 17).font = { name: '맑은 고딕', size: 9, bold: true, color: { argb: 'FF047857' } };
  ws2.getCell(sumRow, 17).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };
  ws2.getCell(sumRow, 17).alignment = { horizontal: 'center', vertical: 'middle' };
  ws2.getCell(sumRow, 17).border = thinBorder;

  // =========================================================================
  // SHEET 3: TPM_10대항목_점검일지 (압출 설비 자주보전 점검일지)
  // =========================================================================
  const ws3 = workbook.addWorksheet('TPM_10대항목_점검일지', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 }
  });

  ws3.columns = [
    { width: 6 },  // A: No
    { width: 16 }, // B: 구분
    { width: 34 }, // C: 주요 점검 항목 및 점검 기준
    { width: 14 }, // D: 판정 (○/△/✕)
    { width: 26 }  // E: 이상 증상 및 조치 사항
  ];

  ws3.mergeCells('A1:E1');
  const ws3Title = ws3.getCell('A1');
  ws3Title.value = '(주)오륙 삼랑진공장 - 압출 설비 TPM 자주보전 10대 항목 점검일지';
  ws3Title.font = { name: '맑은 고딕', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  ws3Title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws3Title.border = mediumBorder;
  ws3Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightTeal } };

  ws3.mergeCells('A2:E2');
  ws3.getCell('A2').value = '작업일자: 2026.09.30  |  근무조: 주간  |  대상호기: PCM 1호기 (110Ø+60Ø)  |  점검자: 공영국 대리  |  확인: 이명재 이사';
  ws3.getCell('A2').font = { name: '맑은 고딕', size: 9.5, bold: true, color: { argb: 'FF334155' } };
  ws3.getCell('A2').alignment = { horizontal: 'left', vertical: 'middle' };

  // Headers (Row 3)
  ['No', '구분', '주요 점검 항목 및 점검 기준', '판정 (○/△/✕)', '이상 증상 및 조치 사항'].forEach((name, idx) => {
    const cell = ws3.getCell(3, idx + 1);
    cell.value = name;
    cell.font = { name: '맑은 고딕', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  const tpmItems = [
    { no: 1, cat: '설비 기본조건', item: '라인 청소, 오일 윤활 상태, 볼트/너트 조임, 누유·누수 점검', res: '○', note: '정상 양호' },
    { no: 2, cat: '110Ø·60Ø 압출기', item: '스크류 회전음, 실린더 발열, 감속기 오일량, 모터 진동', res: '○', note: '110Ø/60Ø 스크류 소음 없음' },
    { no: 3, cat: '다이스(금형)', item: '다이스 마모, 립 손상, 이물 막힘, 변형, 히터 체결상태', res: '○', note: '다이스 표면 클리닝 완료' },
    { no: 4, cat: 'PCM 가류조 온도', item: '13개 Zone 설정온도 편차 확인 (210℃ ± 20℃ 범위 내)', res: '○', note: 'Zone 1~13 전구역 211℃ 제어' },
    { no: 5, cat: '압출/사출 압력', item: '압출 헤드 압력 게이지, 유압/공압 변동, 이상 압력 유무', res: '○', note: '헤드 압력 일정' },
    { no: 6, cat: '온수조/냉각수', item: '110Ø/60Ø 온수조 온도(50±5℃), 냉각수 유량·순환상태', res: '○', note: '순환 펌프 정상 가동' },
    { no: 7, cat: '인취기/컨베이어', item: '인취 롤러 속도(20±1m/분), 텐션 장력, 벨트 마모 상태', res: '○', note: '롤러 이물 제거 완료' },
    { no: 8, cat: '코팅건/프라즈마', item: '코팅건 1~4번 분사압력(2.5bar), 프라즈마 방전(3±0.5A)', res: '○', note: '노즐 막힘 없음, 방전 균일' },
    { no: 9, cat: '건조로/NIR', item: '건조로 온도(180±10℃), NIR 출력(70~80%), 히터 단선', res: '○', note: '건조로 히터 정상' },
    { no: 10, cat: '안전/비상정지', item: '비상정지 스위치 작동, 안전 커버 체결, 인터록 정상', res: '○', note: '비상정지 테스트 완료' }
  ];

  tpmItems.forEach((it, idx) => {
    const rowNum = 4 + idx;
    ws3.getCell(rowNum, 1).value = it.no;
    ws3.getCell(rowNum, 2).value = it.cat;
    ws3.getCell(rowNum, 3).value = it.item;
    ws3.getCell(rowNum, 4).value = it.res;
    ws3.getCell(rowNum, 5).value = it.note;

    for (let c = 1; c <= 5; c++) {
      const cell = ws3.getCell(rowNum, c);
      cell.border = thinBorder;
      cell.font = { name: '맑은 고딕', size: 9 };
      cell.alignment = { horizontal: c === 3 ? 'left' : 'center', vertical: 'middle' };
      if (c === 4) {
        cell.font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF047857' } };
      }
    }
  });

  // Abnormality Report Box (Rows 15-18)
  const abRow = 15;
  ws3.mergeCells(`A${abRow}:E${abRow}`);
  ws3.getCell(`A${abRow}`).value = '■ 이상 발생 신고 및 보전 요청란 (사진 첨부 / 긴급 정비 요청)';
  ws3.getCell(`A${abRow}`).font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF991B1B' } };
  ws3.getCell(`A${abRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
  ws3.getCell(`A${abRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlightRose } };
  ws3.getCell(`A${abRow}`).border = thinBorder;

  const abHeaders = ['이상 발생 내용', '긴급 조치 및 보전 요청 사항', '사진 유무', '조치 담당자', '완료 일시'];
  abHeaders.forEach((h, i) => {
    const cell = ws3.getCell(abRow + 1, i + 1);
    cell.value = h;
    cell.font = { name: '맑은 고딕', size: 9, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionBg } };
    cell.border = thinBorder;
  });

  ws3.getCell(abRow + 2, 1).value = '특이 이상 사항 없음 (정상 가동)';
  ws3.getCell(abRow + 2, 2).value = '110Ø/60Ø 다이스 정기 클리닝 실시';
  ws3.getCell(abRow + 2, 3).value = '첨부 [ - ]';
  ws3.getCell(abRow + 2, 4).value = '공영국 대리';
  ws3.getCell(abRow + 2, 5).value = '2026.09.30 14:00';

  for (let c = 1; c <= 5; c++) {
    const cell = ws3.getCell(abRow + 2, c);
    cell.border = thinBorder;
    cell.font = { name: '맑은 고딕', size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // File Paths
  const targetPath1 = 'C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\압출작업일보_간략화버전.xlsx';
  const targetPath2 = 'C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\압출작업체크시트_PCM_110Ø_60Ø_13Zone.xlsx';

  await workbook.xlsx.writeFile(targetPath1);
  console.log('Saved target 1:', targetPath1);

  await workbook.xlsx.writeFile(targetPath2);
  console.log('Saved target 2:', targetPath2);
}

createExtrusionChecksheet().then(() => {
  console.log('Successfully created both Excel files!');
}).catch(err => {
  console.error('Error creating Excel files:', err);
});
