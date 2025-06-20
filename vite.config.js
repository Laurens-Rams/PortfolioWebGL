import glsl from 'vite-plugin-glsl';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), glsl()],
  optimizeDeps: { 
    exclude: ['three'] // Prevent Spline from bundling its own Three.js
  },
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'postprocessing': ['postprocessing'],
          'vendor': ['@use-gesture/vanilla', 'dat.gui', 'maath'],
          'spline': ['@splinetool/runtime'] // Separate spline chunk
        }
      }
    },
    // Increase chunk size warning limit since WebGL apps are naturally larger
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // KEEP console logs to view performance metrics in production
        drop_debugger: true,
      },
      mangle: {
        safari10: true // Fix Safari 10 issues
      }
    },
    // Source maps for debugging (disabled for smaller builds)
    sourcemap: false,
    // Enable compression
    reportCompressedSize: true,
    // Optimize assets
    assetsInlineLimit: 4096, // Inline small assets
  },
  // Optimize assets
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  server: {
    // Enable compression during development
    compress: true
  }
});