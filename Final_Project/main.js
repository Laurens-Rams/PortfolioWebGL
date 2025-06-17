import { DragGesture } from '@use-gesture/vanilla';
import App from './App';

// WebGL capability detection
function checkWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

// Loading progress tracking
let loadingProgress = 0;
const loadingProgressElement = document.getElementById('loading-progress');
const loadingScreen = document.getElementById('loading-screen');
const errorScreen = document.getElementById('error-screen');
const errorMessage = document.getElementById('error-message');

function updateLoadingProgress(progress) {
  loadingProgress = Math.min(100, Math.max(0, progress));
  if (loadingProgressElement) {
    loadingProgressElement.textContent = `${Math.round(loadingProgress)}%`;
  }
}

function showError(message) {
  if (loadingScreen) loadingScreen.style.display = 'none';
  if (errorScreen) {
    errorScreen.style.display = 'flex';
    if (errorMessage) errorMessage.textContent = message;
  }
}

// Expose functions globally for store access
window.updateLoadingProgress = updateLoadingProgress;
window.showError = showError;

function hideLoading() {
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }
}

// Initialize the application
async function initApp() {
  try {
    // Check WebGL support
    if (!checkWebGLSupport()) {
      throw new Error('Your browser or device does not support WebGL, which is required for this 3D experience. Please try using a modern browser like Chrome, Firefox, or Safari.');
    }

    updateLoadingProgress(10);

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    updateLoadingProgress(20);

    // Initialize the app
    const app = new App(false); // Debug mode disabled - using dialed-in values
    
    updateLoadingProgress(50);

    // Gesture handling removed - no longer needed without stencil system

    updateLoadingProgress(80);

    // Restore scroll behavior
    history.scrollRestoration = "manual";

    updateLoadingProgress(100);

    // Hide loading screen after a short delay
    setTimeout(hideLoading, 500);

    // Global error handling
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      showError('An unexpected error occurred. Please refresh the page to try again.');
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      showError('An unexpected error occurred. Please refresh the page to try again.');
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (app && typeof app.dispose === 'function') {
        app.dispose();
      }
    });

  } catch (error) {
    console.error('Failed to initialize app:', error);
    showError(error.message || 'Failed to load the 3D experience. Please check your internet connection and try again.');
  }
}

// Start the application
initApp();
