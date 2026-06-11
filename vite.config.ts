import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    alias: { '@': path.resolve(__dirname, './src') },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (['react', 'react-dom', 'react-router-dom'].some(p => id.includes(`/node_modules/${p}/`))) return 'vendor-react';
          if (id.includes('/node_modules/recharts/'))     return 'vendor-charts';
          if (id.includes('/node_modules/framer-motion/')) return 'vendor-motion';
          if (id.includes('/node_modules/zustand/'))      return 'vendor-state';
        },
      },
    },
  },
});
