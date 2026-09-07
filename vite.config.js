import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Generate automated build version timestamp
const now = new Date();
const buildTimestamp = Date.now();
const pad = (n) => String(n).padStart(2, '0');
const formattedVersion = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

try {
  const publicDir = path.resolve(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(
    path.resolve(publicDir, 'version.json'),
    JSON.stringify({
      version: formattedVersion,
      timestamp: buildTimestamp,
      buildTime: now.toISOString()
    }, null, 2)
  );
} catch (e) {
  console.error('Failed to generate version.json:', e);
}

// Relative base './' ensures full compatibility across both Firebase Hosting and GitHub Pages
export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(formattedVersion),
    __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
  },
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  },
});

