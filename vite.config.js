import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base './' ensures full compatibility across both Firebase Hosting and GitHub Pages
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  },
  build: {
    chunkSizeWarningLimit: 4000,
    modulePreload: {
      polyfill: false,
      resolveDependencies: (filename, deps) => {
        // 첫 화면 초기 구동 시 불필요한 무거운 라이브러리(exceljs, xlsx, pdf, 대용량json) 사전 다운로드 완전 차단
        return deps.filter(
          (dep) =>
            !dep.includes('vendor-exceljs') &&
            !dep.includes('vendor-xlsx') &&
            !dep.includes('vendor-pdf') &&
            !dep.includes('bundled-templates-data') &&
            !dep.includes('data-large-dataset')
        );
      }
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('bundledCustomTemplates.json')) {
            return 'bundled-templates-data';
          }
          if (id.includes('multiMonthMasterData.json') || id.includes('sqLevelUpMasterData.js')) {
            return 'data-large-dataset';
          }
          if (id.includes('node_modules/pdfjs-dist')) {
            return 'vendor-pdf';
          }
          if (id.includes('node_modules/xlsx')) {
            return 'vendor-xlsx';
          }
          if (id.includes('node_modules/exceljs')) {
            return 'vendor-exceljs';
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
