import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Auto-detect environment based on branch/domain
const getEnvironmentMode = () => {
  // Check Vercel environment variables
  if (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_GIT_COMMIT_REF === 'main') {
    return 'production';
  }
  
  // Default to development for all other cases (preview, dev branch, local)
  return 'development';
};

const envMode = getEnvironmentMode();

// Build: 2025-12-15-CACHE-BUST - Force clear Firebase SDK bundle cache
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
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 3, // Increased passes for better compression
        unsafe: true, // More aggressive optimizations
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
        dead_code: true,
        toplevel: true,
        keep_infinity: true,
        reduce_funcs: true,
        reduce_vars: true,
        collapse_vars: true,
        inline: 2
      },
      mangle: {
        safari10: true,
        toplevel: true, // Mangle top-level names
        properties: {
          regex: /^_/ // Mangle properties starting with underscore
        }
      },
      format: {
        comments: false,
        ecma: 2020 // Target modern JavaScript
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
    exclude: ['lucide-react'], // Tree-shakable library
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'dompurify'
    ],
    esbuildOptions: {
      target: 'es2020',
      // Optimize with modern JS features
      treeShaking: true
    }
  },
  // Improve build performance
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  // Auto-load correct env file based on detected environment
  envPrefix: 'VITE_',
  define: {
    'import.meta.env.MODE': JSON.stringify(envMode)
  }
});
