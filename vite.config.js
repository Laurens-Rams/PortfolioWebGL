import glsl from 'vite-plugin-glsl';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), glsl()],
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'postprocessing': ['postprocessing'],
          'drei': ['@react-three/drei'],
          'vendor': ['@use-gesture/vanilla', 'dat.gui', 'maath']
        }
      }
    },
    // Increase chunk size warning limit since WebGL apps are naturally larger
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn'], // Remove specific console methods
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