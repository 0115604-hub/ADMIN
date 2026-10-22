const fs = require("fs");
const path = require("path");
const QRCode = require(path.resolve(__dirname, "..", "node_modules", "qrcode"));

const downloadDir = "C:\\Users\\oryuk\\Downloads";
const artifactDir = "C:\\Users\\oryuk\\.gemini\\antigravity\\brain\\57110bc3-f2aa-43ee-9138-d2287fb2b0bb";
const publicDir = path.resolve(__dirname, "..", "public");
const url = "https://profit-and-loss-7d09b.web.app";

async function run() {
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  // 1. Generate ultra-crisp 1200px PNG
  const pngBuffer = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    type: "png",
    margin: 2,
    width: 1200,
    color: { dark: "#0f172a", light: "#ffffff" }
  });

  const base64Png = pngBuffer.toString("base64");
  const dataUri = "data:image/png;base64," + base64Png;

  // Save to Downloads and Artifacts
  const pngDownloadPath = path.join(downloadDir, "oryuk_prod_qr_code.png");
  const pngKrDownloadPath = path.join(downloadDir, "오륙_공식본서버_모바일접속_QR코드.png");
  const pngArtifactPath = path.join(artifactDir, "oryuk_prod_qr_1200.png");
  const pngPublicPath = path.join(publicDir, "qr_prod_web_app.png");

  fs.writeFileSync(pngDownloadPath, pngBuffer);
  fs.writeFileSync(pngKrDownloadPath, pngBuffer);
  fs.writeFileSync(pngArtifactPath, pngBuffer);
  fs.writeFileSync(pngPublicPath, pngBuffer);

  // 2. Generate SVG
  const svgString = await QRCode.toString(url, { type: "svg", margin: 2, width: 1200 });
  const svgDownloadPath = path.join(downloadDir, "오륙_공식본서버_모바일접속_QR코드.svg");
  const svgArtifactPath = path.join(artifactDir, "oryuk_prod_qr_1200.svg");
  fs.writeFileSync(svgDownloadPath, svgString, "utf8");
  fs.writeFileSync(svgArtifactPath, svgString, "utf8");

  // 3. Create Standalone A4 Print Poster HTML (Offline Base64 Embedded)
  const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>(주)오륙 생산관리시스템 현장 모바일 접속 QR코드 - A4 포스터</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', 'Malgun Gothic', '맑은 고딕', helvetica, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      padding: 24px;
    }
    .no-print-bar {
      width: 100%;
      max-width: 210mm;
      background: #0f172a;
      color: #fff;
      padding: 16px 24px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
    }
    .btn-print {
      background: #2563eb;
      color: white;
      font-size: 15px;
      font-weight: 800;
      padding: 10px 24px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    }
    .btn-print:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }
    .a4-sheet {
      width: 210mm;
      min-height: 297mm;
      background: #ffffff;
      padding: 16mm 18mm;
      box-shadow: 0 12px 35px rgba(0,0,0,0.08);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #0f172a;
      padding-bottom: 14px;
    }
    .corp-badge {
      display: inline-block;
      background: #0f172a;
      color: #38bdf8;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 2px;
      padding: 4px 16px;
      border-radius: 20px;
      margin-bottom: 10px;
    }
    .main-title {
      font-size: 32px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      line-height: 1.25;
      margin-bottom: 6px;
    }
    .sub-title {
      font-size: 15px;
      color: #475569;
      font-weight: 600;
    }
    .qr-container {
      margin: 18px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      border: 3px dashed #94a3b8;
      border-radius: 24px;
      padding: 22px 20px;
      text-align: center;
    }
    .badge-target {
      background: #2563eb;
      color: white;
      font-size: 14px;
      font-weight: 800;
      padding: 6px 18px;
      border-radius: 20px;
      margin-bottom: 14px;
      box-shadow: 0 2px 8px rgba(37,99,235,0.3);
    }
    .qr-image {
      width: 250px;
      height: 250px;
      background: white;
      padding: 12px;
      border-radius: 20px;
      border: 2px solid #cbd5e1;
      box-shadow: 0 4px 14px rgba(0,0,0,0.06);
    }
    .qr-instruction {
      margin-top: 14px;
      font-size: 16px;
      font-weight: 800;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .url-box {
      margin-top: 8px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 8px 18px;
      font-family: monospace;
      font-size: 14px;
      font-weight: 700;
      color: #1d4ed8;
      letter-spacing: 0.5px;
    }
    .guide-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 14px 0;
    }
    .guide-card {
      background: #f8fafc;
      border-radius: 14px;
      padding: 14px 16px;
      border-left: 5px solid #2563eb;
      border-top: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
    }
    .guide-card h4 {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .guide-card p, .guide-card ol {
      font-size: 12.5px;
      color: #334155;
      line-height: 1.55;
      margin-left: 16px;
    }
    .footer {
      border-top: 2px solid #e2e8f0;
      padding-top: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: #64748b;
    }
    .footer-left {
      font-weight: 700;
      color: #334155;
    }
    @media print {
      body {
        background: transparent !important;
        padding: 0 !important;
      }
      .no-print-bar {
        display: none !important;
      }
      .a4-sheet {
        box-shadow: none !important;
        border-radius: 0 !important;
        width: 100% !important;
        min-height: auto !important;
        padding: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <h3 style="font-size: 16px; font-weight: 800;">🖨️ (주)오륙 모바일 QR코드 A4 포스터 인쇄</h3>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 2px;">오른쪽 인쇄 버튼을 누르거나 키보드의 [Ctrl + P]를 누르시면 A4 1장에 딱 맞게 출력됩니다.</p>
    </div>
    <button class="btn-print" onclick="window.print()">
      <span>🖨️ A4 인쇄하기 (Ctrl+P)</span>
    </button>
  </div>

  <div class="a4-sheet">
    <div class="header">
      <div class="corp-badge">(주)오륙 ORYUK PRODUCTION SYSTEM</div>
      <h1 class="main-title">현장 모바일 접속 QR코드</h1>
      <p class="sub-title">스마트폰 기본 카메라로 비추시면 로그인 화면으로 즉시 연결됩니다.</p>
    </div>

    <div class="qr-container">
      <div class="badge-target">⭐ 공식 본 서버 (실제 운영 및 작업일보 등록)</div>
      <img src="${dataUri}" alt="(주)오륙 공식 본 서버 QR코드" class="qr-image" />
      <div class="qr-instruction">
        <span>📱 스마트폰 기본 카메라를 켜고 위 QR코드를 비춰주세요</span>
      </div>
      <div class="url-box">https://profit-and-loss-7d09b.web.app</div>
    </div>

    <div class="guide-grid">
      <div class="guide-card">
        <h4>📸 스마트폰 접속 방법 (초간단)</h4>
        <ol>
          <li>스마트폰 <b>기본 카메라 앱</b>을 실행합니다.</li>
          <li>위 QR코드를 사각형 안에 맞춥니다.</li>
          <li>화면에 뜨는 <b>노란색/파란색 웹 링크</b>를 터치합니다.</li>
          <li>본인 공장/이름을 선택하고 작업일보를 작성합니다.</li>
        </ol>
      </div>
      <div class="guide-card" style="border-left-color: #059669;">
        <h4>💡 앱처럼 바로 쓰는 홈 화면 추가 팁</h4>
        <ol>
          <li><b>갤럭시(삼성/크롬)</b>: 브라우저 메뉴(⋮/≡) ➔ <b>[홈 화면에 추가]</b></li>
          <li><b>아이폰(사파리)</b>: 하단 공유버튼(↑) ➔ <b>[홈 화면에 추가]</b></li>
          <li>바탕화면에 아이콘이 생성되어 다음부터 <b>1초 만에 앱처럼 실행</b>됩니다.</li>
        </ol>
      </div>
    </div>

    <div class="footer">
      <div class="footer-left">(주)오륙 삼랑진공장 · 한림공장 생산관리 TFT</div>
      <div class="footer-right">발행일자: 2026. 10. | 현장 게시 및 설비 부착용</div>
    </div>
  </div>
</body>
</html>`;

  const htmlDownloadPath = path.join(downloadDir, "오륙_공식본서버_현장부착용_A4인쇄.html");
  const htmlArtifactPath = path.join(artifactDir, "oryuk_prod_qr_a4_poster.html");
  const htmlPublicPath = path.join(publicDir, "oryuk_prod_qr_a4_poster.html");

  fs.writeFileSync(htmlDownloadPath, htmlContent, "utf8");
  fs.writeFileSync(htmlArtifactPath, htmlContent, "utf8");
  fs.writeFileSync(htmlPublicPath, htmlContent, "utf8");

  console.log("SUCCESS");
  console.log("PNG_DOWNLOAD:", pngDownloadPath);
  console.log("PNG_KR_DOWNLOAD:", pngKrDownloadPath);
  console.log("SVG_DOWNLOAD:", svgDownloadPath);
  console.log("HTML_DOWNLOAD:", htmlDownloadPath);
  console.log("HTML_ARTIFACT:", htmlArtifactPath);
}

run().catch(console.error);