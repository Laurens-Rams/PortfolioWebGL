import { DragGesture } from '@use-gesture/vanilla';
import React from 'react';
import ReactDOM from 'react-dom/client';
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

// Error handling for fallback
const errorScreen = document.getElementById('error-screen');
const errorMessage = document.getElementById('error-message');

function showError(message) {
  if (errorScreen) {
    errorScreen.style.display = 'flex';
    if (errorMessage) errorMessage.textContent = message;
  }
}

// Expose error function globally
window.showError = showError;

// Initialize the application
async function initApp() {
  try {
    // Check WebGL support
    if (!checkWebGLSupport()) {
      throw new Error('Your browser or device does not support WebGL, which is required for this 3D experience. Please try using a modern browser like Chrome, Firefox, or Safari.');
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Make React available globally for case study container
    window.React = React;
    window.ReactDOM = ReactDOM;

    // Initialize the app - loading manager handles the rest
    const app = new App(false); // Debug mode disabled - using dialed-in values
    
    // 🔥 MAKE APP AND STATE AVAILABLE GLOBALLY FOR BUTTON CLICKS
    window.app = app;
    
    // Import and set up state manager
    const { default: appState } = await import('./App/StateManager.js');
    window.appState = appState;

    // Restore scroll behavior
    history.scrollRestoration = "manual";

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
