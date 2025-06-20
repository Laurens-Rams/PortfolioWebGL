// 🔥 COMING SOON TOGGLE - SET TO false WHEN READY TO LAUNCH
const COMING_SOON = false;

import { DragGesture } from '@use-gesture/vanilla';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { performanceMonitor, PerformanceMonitor } from './App/PerformanceMonitor.js';

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

// Connection speed detection
function detectConnectionSpeed() {
  // Check if Network Information API is available
  if ('connection' in navigator) {
    const connection = navigator.connection;
    const effectiveType = connection.effectiveType;
    
    // Return connection quality
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'slow';
      case '3g':
        return 'medium';
      case '4g':
      default:
        return 'fast';
    }
  }
  
  // Fallback: assume medium connection
  return 'medium';
}

// Adaptive loading strategy based on connection
function getLoadingStrategy() {
  const connectionSpeed = detectConnectionSpeed();
  
  switch (connectionSpeed) {
    case 'slow':
      return {
        useUltraLight: false, // Skip ultra-light, go straight to procedural
        preloadTimeout: 20000, // 20 second timeout
        enablePreload: false
      };
    case 'medium':
      return {
        useUltraLight: true,
        preloadTimeout: 10000, // 10 second timeout
        enablePreload: false
      };
    case 'fast':
    default:
      return {
        useUltraLight: true,
        preloadTimeout: 5000, // 5 second timeout
        enablePreload: true
      };
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

// 🔥 COMING SOON SCREEN
function showComingSoon() {
  // Hide any existing content
  document.body.innerHTML = '';
  
  // Create coming soon screen
  const comingSoonScreen = document.createElement('div');
  comingSoonScreen.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  // Add moon background effect
  const moonBg = document.createElement('div');
  moonBg.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 30%, transparent 70%);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  `;
  
  // Add coming soon text
  const comingSoonText = document.createElement('div');
  comingSoonText.textContent = 'COMING SOON';
  comingSoonText.style.cssText = `
    font-size: 3rem;
    font-weight: 300;
    color: #ffffff;
    letter-spacing: 0.5rem;
    text-align: center;
    z-index: 1;
    position: relative;
    opacity: 0;
    animation: fadeIn 2s ease-out forwards;
  `;
  
  // Add fade in animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
  
  // Assemble the screen
  comingSoonScreen.appendChild(moonBg);
  comingSoonScreen.appendChild(comingSoonText);
  document.body.appendChild(comingSoonScreen);
}

// Initialize the application
async function initApp() {
  // 🔥 CHECK COMING SOON FLAG FIRST
  if (COMING_SOON) {
    showComingSoon();
    return;
  }
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
    
    // 🔥 BANGKOK OPTIMIZATION: Defer Spline loading
    app.deferSplineLoading = true;
    
    // 🔥 MAKE APP AVAILABLE GLOBALLY FOR BUTTON CLICKS
    window.app = app;
    
    // StateManager is already imported and initialized in App/index.js
    // window.appState will be set by the app itself to ensure same instance

    // Restore scroll behavior
    history.scrollRestoration = "manual";

    // Global error handling
    window.addEventListener('error', (event) => {
      // Filter out null errors and other non-critical errors
      if (event.error === null || event.error === undefined) {
        // Silent handling of null errors - these are often from external scripts
        return;
      }
      
      // Filter out UUID script errors (these are from browser extensions or external scripts)
      if (event.filename && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(event.filename)) {
        // Silent handling of UUID-named script errors
        return;
      }
      
      // Filter out syntax errors from external scripts
      if (event.error && event.error.message && event.error.message.includes('Unexpected token')) {
        // Silent handling of syntax errors from external scripts
        return;
      }
      
      console.error('Global error:', event.error);
      
      // Only show user-facing error for critical errors
      if (event.error && event.error.message && !event.error.message.includes('Script error')) {
        showError('An unexpected error occurred. Please refresh the page to try again.');
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      // Filter out null rejections
      if (event.reason === null || event.reason === undefined) {
        return;
      }
      
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

// ===== NAVIGATION PERFORMANCE LOGGING =====
window.addEventListener('load', () => {
  // Delay by one task to let paint & paint entries settle
  setTimeout(() => {
    const navEntry = performance.getEntriesByType('navigation')[0];
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    if (navEntry) {
      const timings = {
        timeToFirstByte: (navEntry.responseStart - navEntry.startTime).toFixed(0) + 'ms',
        domContentLoaded: navEntry.domContentLoadedEventEnd.toFixed(0) + 'ms',
        loadEventEnd: navEntry.loadEventEnd.toFixed(0) + 'ms',
        firstContentfulPaint: fcpEntry ? fcpEntry.startTime.toFixed(0) + 'ms' : 'n/a'
      };
      console.log('⏱️ NAVIGATION TIMINGS', timings);
    }
  }, 0);
});

// Start real user monitoring early
PerformanceMonitor.initRealUserMonitoring();
