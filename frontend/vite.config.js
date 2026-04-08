import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    cssCodeSplit: true, // Split CSS to reduce memory load
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      // LIMIT PARALLELISM: This is the most important for 1GB RAM
      maxParallelFileOps: 2,
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/tickets': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        /**
         * Browser reloads on /tickets/new etc. must get index.html (SPA).
         * Returning false skipped the proxy but did not always fall through to
         * SPA fallback — serve /index.html explicitly. API calls use JSON Accept.
         */
        bypass(req) {
          const accept = req.headers.accept ?? '';
          if (
            req.method === 'GET' &&
            typeof accept === 'string' &&
            accept.includes('text/html')
          ) {
            return '/index.html';
          }
        },
      },
      '/public': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
