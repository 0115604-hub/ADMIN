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
});
