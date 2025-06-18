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
        drop_debugger: true
      }
    },
    // Source maps for debugging (can be disabled for smaller builds)
    sourcemap: false
  },
  // Optimize assets
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  server: {
    // Enable compression during development
    compress: true
  }
});