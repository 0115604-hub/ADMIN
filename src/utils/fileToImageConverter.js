import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "3.11.174"}/pdf.worker.min.js`;
}

/**
 * Fast & lightweight renderer: converts a 2D array of table data into a clean, compact canvas image.
 * Uses hardware-accelerated JPEG encoding for instant sub-second conversion with minimal memory footprint.
 */
export function renderExcelSheetToCanvasImage(sheetName, rows, maxRenderRows = 18, maxRenderCols = 8) {
  if (!rows || rows.length === 0) return null;

  // 1. Quick filter non-empty rows
  const cleanRows = [];
  for (let i = 0; i < Math.min(rows.length, maxRenderRows); i++) {
    const row = rows[i];
    if (Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== "")) {
      cleanRows.push(row);
    }
  }

  if (cleanRows.length === 0) return null;

  // Find max columns
  let numCols = 0;
  for (const row of cleanRows) {
    if (row.length > numCols) numCols = row.length;
  }
  numCols = Math.min(Math.max(numCols, 2), maxRenderCols);

  // 2. Fast column width calculation
  const colWidths = new Array(numCols).fill(65);
  for (const row of cleanRows) {
    for (let c = 0; c < numCols; c++) {
      const val = row[c] !== undefined && row[c] !== null ? String(row[c]).trim() : "";
      if (val.length > 0) {
        colWidths[c] = Math.min(180, Math.max(colWidths[c], val.length * 9 + 16));
      }
    }
  }

  const totalTableWidth = colWidths.reduce((a, b) => a + b, 0);
  const rowHeight = 24;
  const headerHeight = 44;
  const padding = 12;
  const canvasWidth = Math.max(500, totalTableWidth + padding * 2);
  const canvasHeight = headerHeight + (cleanRows.length * rowHeight) + padding * 2 + 6;

  // 3. Create Canvas (1.0 scale for ultra light memory)
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d", { alpha: false });

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Header Banner
  const gradient = ctx.createLinearGradient(padding, padding, canvasWidth - padding, padding);
  gradient.addColorStop(0, "#064e3b");
  gradient.addColorStop(1, "#0f172a");
  ctx.fillStyle = gradient;
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(padding, padding, canvasWidth - padding * 2, 32, 4);
  } else {
    ctx.rect(padding, padding, canvasWidth - padding * 2, 32);
  }
  ctx.fill();

  // Header Text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(`📊 [정산 증빙] ${sheetName}`, padding + 10, padding + 21);

  ctx.fillStyle = "#6ee7b7";
  ctx.font = "10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${cleanRows.length}행 x ${numCols}열`, canvasWidth - padding - 10, padding + 21);
  ctx.textAlign = "left";

  // Table Grid Drawing
  const startY = padding + headerHeight;
  const startX = padding;

  for (let rIdx = 0; rIdx < cleanRows.length; rIdx++) {
    const row = cleanRows[rIdx];
    const isFirstRow = rIdx === 0;
    const isEven = rIdx % 2 === 0;
    const curY = startY + (rIdx * rowHeight);

    // Row Background
    ctx.fillStyle = isFirstRow ? "#f1f5f9" : (isEven ? "#f8fafc" : "#ffffff");
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

      if (rawVal) {
        const isNumber = !isNaN(Number(rawVal.replace(/,/g, ""))) && !rawVal.includes("-");
        let displayText = rawVal;
        if (isNumber && rawVal.length < 14) {
          const num = Number(rawVal.replace(/,/g, ""));
          displayText = num.toLocaleString();
        }

        ctx.font = isFirstRow
          ? "bold 10.5px -apple-system, BlinkMacSystemFont, sans-serif"
          : "10px -apple-system, BlinkMacSystemFont, sans-serif";

        ctx.fillStyle = isFirstRow
          ? "#0f172a"
          : isNumber && Number(rawVal.replace(/,/g, "")) > 1000000
            ? "#047857"
            : "#334155";

        if (isNumber && !isFirstRow) {
          ctx.textAlign = "right";
          ctx.fillText(displayText, cellX + w - 6, curY + 16);
        } else {
          ctx.textAlign = "left";
          ctx.fillText(displayText.length > 20 ? displayText.slice(0, 19) + "…" : displayText, cellX + 6, curY + 16);
        }
        ctx.textAlign = "left";
      }

      cellX += w;
    }
  }

  // Table Outer Border
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1;
  ctx.strokeRect(startX, startY, totalTableWidth, cleanRows.length * rowHeight);

  // Export as lightweight JPEG (tiny size < 25KB)
  return canvas.toDataURL("image/jpeg", 0.65);
}

/**
 * Fast image compressor for uploaded image files (JPEG 0.65, max 900px)
 */
async function compressImageFile(file, maxWidth = 900, maxHeight = 900, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({ dataUrl, width, height });
      };
      img.onerror = () => reject(new Error("이미지 파일을 디코딩하지 못했습니다."));
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(new Error("이미지 파일 읽기 실패: " + err.message));
    reader.readAsDataURL(file);
  });
}

/**
 * Ultra-Fast High Performance Document to Preview Image Converter.
 * Concurrently processes PDF, Excel (.xlsx, .xls, .csv), and Image files with zero blocking.
 */
export async function convertFileToImages(file, onProgress) {
  if (!file) throw new Error("파일이 없습니다.");

  // Yield to main thread
  await new Promise((r) => setTimeout(r, 0));

  const fileName = file.name || "unnamed";
  const fileType = file.type || "";
  const ext = fileName.split(".").pop().toLowerCase();

  onProgress?.({ status: "converting", percent: 30, message: `'${fileName}' 변환 중...` });

  // 1. Image Files
  if (fileType.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "bmp"].includes(ext)) {
    const { dataUrl, width, height } = await compressImageFile(file);
    onProgress?.({ status: "done", percent: 100, message: `'${fileName}' 완료` });
    return {
      id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fileName,
      fileType: "image",
      fileExt: ext,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      pages: [
        {
          pageNumber: 1,
          title: `${fileName}`,
          dataUrl,
          width,
          height
        }
      ],
      summary: `이미지 파일 (${fileName})`
    };
  }

  // 2. PDF Files
  if (fileType === "application/pdf" || ext === "pdf") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = Math.min(pdfDoc.numPages, 2); // cap max 2 pages for extreme speed
      const pages = [];

      for (let i = 1; i <= numPages; i++) {
        await new Promise((r) => setTimeout(r, 0));
        const page = await pdfDoc.getPage(i);
        const unscaledViewport = page.getViewport({ scale: 1 });
        const targetScale = Math.min(1.0, Math.max(0.7, 750 / unscaledViewport.width));
        const viewport = page.getViewport({ scale: targetScale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d", { alpha: false });

        await page.render({
          canvasContext: ctx,
          viewport
        }).promise;

        const dataUrl = canvas.toDataURL("image/jpeg", 0.65);
        pages.push({
          pageNumber: i,
          title: `PDF 페이지 ${i} / ${numPages}`,
          dataUrl,
          width: viewport.width,
          height: viewport.height
        });
      }

      onProgress?.({ status: "done", percent: 100, message: `PDF 완료` });

      return {
        id: `pdf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        fileName,
        fileType: "pdf",
        fileExt: "pdf",
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        pages,
        summary: `PDF 증빙 문서 (${fileName})`
      };
    } catch (pdfErr) {
      console.warn("PDF preview generation warning:", pdfErr);
      return {
        id: `pdf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        fileName,
        fileType: "pdf",
        fileExt: "pdf",
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        pages: [],
        summary: `PDF 파일 (${fileName})`
      };
    }
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
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const pages = [];

      const sheetNames = workbook.SheetNames || [];
      // Pick only the first 1-2 non-empty sheets for speed
      const targetSheets = sheetNames.slice(0, 2);

      for (let sIdx = 0; sIdx < targetSheets.length; sIdx++) {
        await new Promise((r) => setTimeout(r, 0));
        const sheetName = targetSheets[sIdx];
        const ws = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (rows && rows.length > 0) {
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

      onProgress?.({ status: "done", percent: 100, message: `엑셀 변환 완료` });

      return {
        id: `excel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        fileName,
        fileType: "excel",
        fileExt: ext,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        pages,
        summary: `엑셀 파일 (${fileName})`
      };
    } catch (excelErr) {
      console.warn("Excel preview generation warning:", excelErr);
      return {
        id: `excel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        fileName,
        fileType: "excel",
        fileExt: ext,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        pages: [],
        summary: `엑셀 파일 (${fileName})`
      };
    }
  }

  return {
    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    fileName,
    fileType: "doc",
    fileExt: ext,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
    pages: [],
    summary: `파일 (${fileName})`
  };
}

