const path = require("path");
const fs = require("fs");
const QRCode = require(path.resolve(__dirname, "..", "node_modules", "qrcode"));

const artifactDir = "C:\\Users\\oryuk\\.gemini\\antigravity\\brain\\57110bc3-f2aa-43ee-9138-d2287fb2b0bb";
const publicDir = path.resolve(__dirname, "..", "public");

async function makeQRs() {
  const targets = [
    { name: "qr_prod_web_app", url: "https://profit-and-loss-7d09b.web.app", label: "(주)오륙 생산관리현황 본 서버" },
    { name: "qr_test_web_app", url: "https://oryuk-2991a.web.app", label: "(주)오륙 생산관리현황 테스트 서버" },
    { name: "qr_k5604_domain", url: "http://k5604.kr/", label: "(주)오륙 k5604.kr 본 서버" }
  ];

  for (const t of targets) {
    const pngPathArtifact = path.join(artifactDir, `${t.name}.png`);
    const pngPathPublic = path.join(publicDir, `${t.name}.png`);
    const svgPathArtifact = path.join(artifactDir, `${t.name}.svg`);

    // High error correction (H = 30%), large size for crisp mobile scanning
    const options = {
      errorCorrectionLevel: "H",
      type: "png",
      quality: 1,
      margin: 2,
      width: 600,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    };

    await QRCode.toFile(pngPathArtifact, t.url, options);
    await QRCode.toFile(pngPathPublic, t.url, options);
    
    const svgString = await QRCode.toString(t.url, { type: "svg", margin: 2, width: 600 });
    fs.writeFileSync(svgPathArtifact, svgString, "utf8");

    console.log(`Generated QR for ${t.label}: ${t.url} -> ${pngPathArtifact}`);
  }
}

makeQRs().catch(console.error);
