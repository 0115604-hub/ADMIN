import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Build configuration
const formattedVersion = "1.0.0";
const buildTimestamp = 0;

try {
  const publicDir = path.resolve(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(
    path.resolve(publicDir, 'version.json'),
    JSON.stringify({
      version: formattedVersion,
      timestamp: 0,
      buildTime: new Date().toISOString()
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
    __BUILD_TIMESTAMP__: JSON.stringify(0),
  },
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  },
});

