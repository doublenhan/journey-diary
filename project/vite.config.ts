import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allows access from network
    port: 3000,
    open: true, // Auto open browser
    hmr: {
      overlay: true // Show error overlay
    },
    watch: {
      usePolling: true, // Better file watching on Windows
      interval: 100
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('firebase')) return 'firebase';
          if (id.includes('html2canvas')) return 'html2canvas';
        }
      }
    },
    outDir: 'dist',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
