import glsl from 'vite-plugin-glsl';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), glsl()],
  optimizeDeps: { 
    exclude: ['three'] // Prevent Spline from bundling its own Three.js
  },
  build: {
    // Aggressive minification for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // KEEP console logs to view performance metrics in production
        drop_debugger: true,
        pure_funcs: ['console.debug'], // Only remove debug logs
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        safari10: true,
      },
    },
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        // Aggressive chunk splitting
        manualChunks: {
          'three': ['three'],
          'postprocessing': ['postprocessing'],
          'vendor': ['@use-gesture/vanilla', 'dat.gui', 'maath'],
          'spline': ['@splinetool/runtime'] // Separate spline chunk
        },
        // Optimize chunk size
        chunkSizeWarningLimit: 1000,
        // Better file naming for caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Enable source maps for debugging but keep them separate
    sourcemap: false, // Disable for production to reduce size
    // Reduce bundle size
    reportCompressedSize: false, // Faster builds
    // Optimize for modern browsers
    target: 'es2020',
  },
  // Optimize assets
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  server: {
    // Enable compression during development
    compress: true
  }
});