import { LoadingManager } from "three"

// Enhanced loading manager with progress tracking
const loaderManager = new LoadingManager();

// Track loading progress
loaderManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const progress = (itemsLoaded / itemsTotal) * 100;
  
  // Update loading progress in main thread if available
  if (window.updateLoadingProgress) {
    window.updateLoadingProgress(30 + (progress * 0.5)); // 30-80% range for asset loading
  }
};

loaderManager.onError = (url) => {
  console.error('Failed to load asset:', url);
  
  // Show error if available
  if (window.showError) {
    window.showError(`Failed to load required assets. Please check your internet connection and try again.`);
  }
};

export default {
    loaderManager,
    // Add performance monitoring
    performance: {
      startTime: performance.now(),
      loadTime: null,
      frameCount: 0,
      lastFPSCheck: performance.now(),
      currentFPS: 60
    }
}