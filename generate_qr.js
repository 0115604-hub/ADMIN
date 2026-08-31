import QRCode from "qrcode";
import fs from "fs";
import path from "path";

const targetUrl = "https://profit-and-loss-7d09b.web.app";
const artifactDir = "C:\\Users\\k0115\\.gemini\\antigravity\\brain\\686dc741-649d-49fc-9c6e-019ddbee3fb5";

async function generate() {
  console.log("Generating QR code for:", targetUrl);

  // 1. Generate PNG to public/
  const publicPng = path.join(process.cwd(), "public", "oryuk_app_qr.png");
  await QRCode.toFile(publicPng, targetUrl, {
    width: 600,
    margin: 2,
    color: {
      dark: "#0f172a", // slate-900
      light: "#ffffff"
    },
    errorCorrectionLevel: "H"
  });
  console.log("Saved PNG to:", publicPng);

  // 2. Generate SVG to public/
  const publicSvg = path.join(process.cwd(), "public", "oryuk_app_qr.svg");
  const svgString = await QRCode.toString(targetUrl, {
    type: "svg",
    margin: 2,
    color: {
      dark: "#0f172a",
      light: "#ffffff"
    },
    errorCorrectionLevel: "H"
  });
  fs.writeFileSync(publicSvg, svgString);
  console.log("Saved SVG to:", publicSvg);

  // 3. Copy PNG to artifact directory
  const artifactPng = path.join(artifactDir, "oryuk_app_qr.png");
  fs.copyFileSync(publicPng, artifactPng);
  console.log("Copied PNG to artifact dir:", artifactPng);
}

generate().catch(console.error);
