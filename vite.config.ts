import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allows access from network
    port: 3001,
    open: true, // Auto open browser
    hmr: {
      overlay: true // Show error overlay
    },
    watch: {
      usePolling: true, // Better file watching on Windows
      interval: 100
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
            if (id.includes('leaflet')) return 'vendor-leaflet';
            if (id.includes('html2canvas') || id.includes('jspdf')) return 'vendor-pdf';
            if (id.includes('lucide-react')) return 'vendor-icons';
            return 'vendor'; // Other vendor dependencies
          }
          
          // Component chunks
          if (id.includes('/src/components/')) return 'components';
          if (id.includes('/src/hooks/')) return 'hooks';
          if (id.includes('/src/utils/')) return 'utils';
          if (id.includes('/src/apis/')) return 'apis';
        }
      }
    },
    outDir: 'dist',
    chunkSizeWarningLimit: 600,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
