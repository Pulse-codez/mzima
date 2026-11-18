import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': { target: process.env.MZIMA_API_URL ?? 'http://127.0.0.1:8000', changeOrigin: true },
      '/health': { target: process.env.MZIMA_API_URL ?? 'http://127.0.0.1:8000', changeOrigin: true },
      '/ready': { target: process.env.MZIMA_API_URL ?? 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
});
