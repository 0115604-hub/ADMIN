import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "3.11.174"}/pdf.worker.min.js`;
}

/**
 * Renders a 2D array of table data into a styled canvas and exports it as a DataURL image.
 */
export function renderExcelSheetToCanvasImage(sheetName, rows, maxRenderRows = 100, maxRenderCols = 15) {
  if (!rows || rows.length === 0) return null;

  // 1. Trim empty rows and columns
  const cleanRows = rows
    .slice(0, maxRenderRows)
    .filter(row => Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ""));

  if (cleanRows.length === 0) return null;

  // Find max columns
  let numCols = 0;
  cleanRows.forEach(row => {
    numCols = Math.max(numCols, row.length);
  });
  numCols = Math.min(numCols, maxRenderCols);

  // 2. Measure column widths
  const colWidths = new Array(numCols).fill(70);
  cleanRows.forEach(row => {
    for (let c = 0; c < numCols; c++) {
      const val = row[c] !== undefined && row[c] !== null ? String(row[c]).trim() : "";
      const len = val.length;
      let charWidth = 0;
      for (let i = 0; i < len; i++) {
        charWidth += val.charCodeAt(i) > 255 ? 14 : 8.5;
      }
      colWidths[c] = Math.min(280, Math.max(colWidths[c], charWidth + 24));
    }
  });

  const totalTableWidth = colWidths.reduce((a, b) => a + b, 0);
  const rowHeight = 28;
  const headerHeight = 60;
  const padding = 20;
  const canvasWidth = Math.max(700, totalTableWidth + padding * 2);
  const canvasHeight = headerHeight + (cleanRows.length * rowHeight) + padding * 2 + 30;

  // 3. Create Canvas
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth * 2; // 2x retina
  canvas.height = canvasHeight * 2;
  const ctx = canvas.getContext("2d");
  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Header Banner
  const gradient = ctx.createLinearGradient(padding, padding, canvasWidth - padding, padding);
  gradient.addColorStop(0, "#064e3b"); // emerald-900
  gradient.addColorStop(1, "#0f172a"); // slate-900
  ctx.fillStyle = gradient;
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(padding, padding, canvasWidth - padding * 2, 44, 8);
  } else {
    ctx.rect(padding, padding, canvasWidth - padding * 2, 44);
  }
  ctx.fill();

  // Header Text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(`📊 [정산 증빙] ${sheetName}`, padding + 16, padding + 28);

  ctx.fillStyle = "#6ee7b7";
  ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`변환일시: ${new Date().toLocaleDateString("ko-KR")} • ${cleanRows.length}행 x ${numCols}열`, canvasWidth - padding - 16, padding + 28);
  ctx.textAlign = "left";

  // Table Grid Drawing
  let startY = padding + headerHeight;
  let startX = padding;

  cleanRows.forEach((row, rIdx) => {
    const isFirstRow = rIdx === 0;
    const isEven = rIdx % 2 === 0;
    const curY = startY + (rIdx * rowHeight);

    // Row Background
    if (isFirstRow) {
      ctx.fillStyle = "#f1f5f9"; // slate-100
    } else if (isEven) {
      ctx.fillStyle = "#f8fafc"; // slate-50
    } else {
      ctx.fillStyle = "#ffffff";
    }
    ctx.fillRect(startX, curY, totalTableWidth, rowHeight);

    // Row Bottom Border
    ctx.strokeStyle = isFirstRow ? "#cbd5e1" : "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, curY + rowHeight);
    ctx.lineTo(startX + totalTableWidth, curY + rowHeight);
    ctx.stroke();

    // Cells
    let cellX = startX;
    for (let c = 0; c < numCols; c++) {
      const w = colWidths[c];
      const rawVal = row[c] !== undefined && row[c] !== null ? String(row[c]).trim() : "";

      // Cell Vertical Border
      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(cellX + w, curY);
      ctx.lineTo(cellX + w, curY + rowHeight);
      ctx.stroke();

      // Text Alignment & Format
      const isNumber = !isNaN(Number(rawVal.replace(/,/g, ""))) && rawVal !== "";
      let displayText = rawVal;
      if (isNumber && !rawVal.includes("-") && rawVal.length < 15) {
        const num = Number(rawVal.replace(/,/g, ""));
        displayText = num.toLocaleString();
      }

      ctx.font = isFirstRow
        ? "bold 12px -apple-system, BlinkMacSystemFont, sans-serif"
        : "11px -apple-system, BlinkMacSystemFont, sans-serif";
      
      ctx.fillStyle = isFirstRow
        ? "#0f172a"
        : isNumber && Number(rawVal.replace(/,/g, "")) > 1000000
          ? "#047857"
          : "#334155";

      if (isNumber && !isFirstRow) {
        ctx.textAlign = "right";
        ctx.fillText(displayText, cellX + w - 8, curY + 18);
      } else {
        ctx.textAlign = "left";
        let textToDraw = displayText;
        while (ctx.measureText(textToDraw).width > (w - 16) && textToDraw.length > 3) {
          textToDraw = textToDraw.slice(0, -1);
        }
        if (textToDraw !== displayText) textToDraw += "...";
        ctx.fillText(textToDraw, cellX + 8, curY + 18);
      }
      ctx.textAlign = "left";

      cellX += w;
    }
  });

  // Table Outer Border
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(startX, startY, totalTableWidth, cleanRows.length * rowHeight);

  return canvas.toDataURL("image/png");
}

/**
 * Converts any uploaded File into an array of Image Page Data URLs.
 * Supports: PDF (.pdf), Excel (.xlsx, .xls, .csv), Images (.png, .jpg, .jpeg, .webp, .gif)
 */
export async function convertFileToImages(file, onProgress) {
  if (!file) throw new Error("파일이 없습니다.");

  const fileName = file.name || "unnamed";
  const fileType = file.type || "";
  const ext = fileName.split(".").pop().toLowerCase();

  onProgress?.({ status: "start", message: `파일 '${fileName}' 분석 중...` });

  // 1. Image Files
  if (fileType.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "bmp"].includes(ext)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        resolve({
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          fileName,
          fileType: "image",
          fileExt: ext,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          pages: [
            {
              pageNumber: 1,
              title: `${fileName} (1/1)`,
              dataUrl
            }
          ],
          summary: `이미지 파일 (${fileName})`
        });
      };
      reader.onerror = (err) => reject(new Error("이미지 파일을 읽는 중 오류가 발생했습니다: " + err.message));
      reader.readAsDataURL(file);
    });
  }

  // 2. PDF Files
  if (fileType === "application/pdf" || ext === "pdf") {
    onProgress?.({ status: "parsing", message: "PDF 문서 페이지를 렌더링하고 이미지로 변환 중..." });
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdfDoc.numPages;
    const pages = [];

    for (let i = 1; i <= numPages; i++) {
      onProgress?.({ status: "converting", message: `PDF ${numPages}개 페이지 중 ${i}번째 페이지 이미지 변환 중...`, current: i, total: numPages });
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1.8 });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");

      await page.render({
        canvasContext: ctx,
        viewport
      }).promise;

      const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
      pages.push({
        pageNumber: i,
        title: `PDF 페이지 ${i} / ${numPages}`,
        dataUrl,
        width: viewport.width,
        height: viewport.height
      });
    }

    return {
      id: `pdf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fileName,
      fileType: "pdf",
      fileExt: "pdf",
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      pages,
      summary: `PDF 증빙 문서 (${fileName}, 총 ${numPages}페이지 이미지 변환 완료)`
    };
  }

  // 3. Excel & CSV Files
  if (
    ext === "xlsx" ||
    ext === "xls" ||
    ext === "csv" ||
    fileType.includes("spreadsheet") ||
    fileType.includes("excel") ||
    fileType.includes("csv")
  ) {
    onProgress?.({ status: "parsing", message: "엑셀 시트 데이터를 분석하여 이미지로 렌더링 중..." });
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const pages = [];

    const sheetNames = workbook.SheetNames || [];
    for (let sIdx = 0; sIdx < sheetNames.length; sIdx++) {
      const sheetName = sheetNames[sIdx];
      const ws = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      if (rows && rows.length > 0) {
        onProgress?.({ status: "converting", message: `엑셀 시트 [${sheetName}] 이미지 생성 중...` });
        const dataUrl = renderExcelSheetToCanvasImage(sheetName, rows);
        if (dataUrl) {
          pages.push({
            pageNumber: sIdx + 1,
            sheetName,
            title: `시트: ${sheetName}`,
            dataUrl,
            rowCount: rows.length
          });
        }
      }
    }

    if (pages.length === 0) {
      throw new Error("엑셀 파일에 유효한 시트 데이터가 없습니다.");
    }

    return {
      id: `excel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fileName,
      fileType: "excel",
      fileExt: ext,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      pages,
      summary: `엑셀 파일 (${fileName}, ${pages.length}개 시트 이미지 변환 완료)`
    };
  }

  throw new Error(`지원하지 않는 파일 형식입니다 (${ext || fileType}). PDF, Excel(.xlsx/.xls/.csv), 이미지 파일만 지원됩니다.`);
}
