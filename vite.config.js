/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const basePath = env.VITE_BASE_PATH || '/';

  return {
    base: basePath,
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
    server: {
      port: 4200,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8085',
          changeOrigin: true,
        },
        '/k8s': {
          target: 'http://localhost:30085',
          changeOrigin: true,
        },
      },
    },
  };
});
