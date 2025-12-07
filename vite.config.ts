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
          // Vendor chunks - split by library
          if (id.includes('node_modules')) {
            // Firebase chunk
            if (id.includes('firebase')) return 'vendor-firebase';
            
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('react-router')) return 'vendor-router';
            
            // Map libraries
            if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor-map';
            
            // PDF generation
            if (id.includes('html2canvas') || id.includes('jspdf')) return 'vendor-pdf';
            
            // Icons
            if (id.includes('lucide-react')) return 'vendor-icons';
            
            // Date pickers
            if (id.includes('react-datepicker') || id.includes('date-fns')) return 'vendor-datepicker';
            
            // Other large libraries
            return 'vendor';
          }
          
          // App chunks - split by feature
          // Components
          if (id.includes('/src/components/MapView')) return 'chunk-map';
          if (id.includes('/src/components/ImageUpload')) return 'chunk-upload';
          if (id.includes('/src/components/EditMemoryModal')) return 'chunk-edit';
          if (id.includes('/src/components/')) return 'components';
          
          // Hooks
          if (id.includes('/src/hooks/')) return 'hooks';
          
          // Utils and helpers
          if (id.includes('/src/utils/')) return 'utils';
          
          // API layer
          if (id.includes('/src/apis/')) return 'apis';
          
          // Config and themes
          if (id.includes('/src/config/')) return 'config';
        }
      }
    },
    outDir: 'dist',
    chunkSizeWarningLimit: 500, // Reduced from 600
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
        passes: 2 // Multiple compression passes
      },
      mangle: {
        safari10: true // Fix Safari 10+ issues
      },
      format: {
        comments: false // Remove comments
      }
    },
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    
    // Asset handling
    assetsInlineLimit: 4096, // 4KB - inline small assets as base64
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Optimize chunk loading
    modulePreload: {
      polyfill: true
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore'
    ]
  },
  // Improve build performance
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});
