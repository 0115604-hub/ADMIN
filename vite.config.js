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
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/pdfjs-dist')) {
            return 'vendor-pdf';
          }
          if (id.includes('node_modules/xlsx') || id.includes('node_modules/exceljs')) {
            return 'vendor-excel';
          }
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/firebase')) {
            return 'vendor-firebase';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react-core';
          }
        }
      }
    }
  }
});
