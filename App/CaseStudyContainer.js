// 🔥 TENDOR CASE STUDY - USING EXACT ORIGINAL REACT COMPONENTS

import React from 'react';
import ReactDOM from 'react-dom/client';
import TendorApp from './TendorApp.jsx';
import appState from './StateManager.js';

class CaseStudyContainer {
  constructor() {
    this.container = null;
    this.reactRoot = null;
    this.isVisible = false;
    this.hasScrolled = false; // Track if user has scrolled in case study
    this.splineHidden = false; // Track if Spline is hidden for performance
    this.heroImage = null; // Static hero image element
    
    this.createContainer();
    this.setupEventListeners();
  }

  createContainer() {
    // Create blocker overlay to prevent all background interactions
    this.blocker = document.createElement('div');
    this.blocker.id = 'case-study-blocker';
    this.blocker.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      z-index: -1;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.8s ease;
      display: none;
    `;
    document.body.appendChild(this.blocker);
    
    this.container = document.createElement('div');
    this.container.id = 'case-study-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      background: transparent;
      z-index: -1;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.8s ease;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      display: none;
    `;
    
    // No need to hide scrollbar initially - will be handled when going full page
    
    document.body.appendChild(this.container);
  }

  setupEventListeners() {
    // State manager events
    appState.subscribe('stateChange', (data) => {
      const { newState } = data;
      
      if (newState.caseStudyVisible && !this.isVisible) {
        this.show();
      } else if (!newState.caseStudyVisible && this.isVisible) {
        this.hide();
      }
    });
    
    // Container scroll event - dispatch to window for React components
    this.container.addEventListener('scroll', (e) => {
      const scrollTop = e.target.scrollTop;
      
      // 🔥 PERFORMANCE OPTIMIZATION: Check if scrolled past 100vh
      const viewportHeight = window.innerHeight;
      const scrollThreshold = viewportHeight; // Full viewport height
      const scrolledPastSpline = scrollTop > scrollThreshold;
      
      console.log('🔥 SCROLL CHECK:', {
        scrollTop,
        viewportHeight,
        scrollThreshold,
        scrolledPastSpline,
        splineHidden: this.splineHidden
      });
      
      // 🔥 SIMPLIFIED: Once Spline is hidden, it stays hidden FOREVER
      if (scrolledPastSpline && !this.splineHidden) {
        console.log('🔥 TRIGGERING: hideSplineShowHero - PERMANENT');
        this.hideSplineShowHero();
      }
      // NO RESTORATION - once gone, it's gone!
      
      // 🔥 EXTENSIVE DEBUG: Check scroll behavior
      console.log('🔥 CASE STUDY SCROLL EVENT:', {
        scrollTop,
        viewportHeight,
        scrolledPastSpline,
        splineHidden: this.splineHidden,
        opacity: this.container.style.opacity,
        pointerEvents: this.container.style.pointerEvents,
        zIndex: this.container.style.zIndex,
        display: this.container.style.display,
        scrollHeight: this.container.scrollHeight,
        clientHeight: this.container.clientHeight,
        canScroll: this.container.scrollHeight > this.container.clientHeight
      });
      
      // Dispatch custom scroll event for React components
      const scrollEvent = new CustomEvent('caseStudyScroll', {
        detail: { scrollTop }
      });
      window.dispatchEvent(scrollEvent);
      
      // 🔥 DON'T DISPATCH REGULAR SCROLL EVENTS - CAUSES SPLINE TO RESET
      // The regular scroll event triggers the main App's scroll handler
      // which updates Spline position even though we're in case study mode
      
      // 🔥 DON'T UPDATE DOCUMENT SCROLL - CAUSES SPLINE RESET
      // window.pageYOffset = scrollTop;
      // document.documentElement.scrollTop = scrollTop;
    });
    
    // Handle direct URL access
    if (window.location.pathname === '/case-study') {
      this.show();
    }
  }

  show() {
    console.log('🔥 CASE STUDY SHOW() called');
    
    this.isVisible = true;
    this.hasScrolled = false; // Reset scroll tracking for new case study session
    this.splineHidden = false; // Reset Spline visibility tracking
    
    // 🔥 NO NEED TO CREATE CUSTOM HERO - React component handles it with useStaticHero
    
    // 🔥 DON'T ENABLE BLOCKER - IT PREVENTS CASE STUDY SCROLLING
    // The Spline blocking is handled by TransitionController's targeted overlay
    
    this.container.style.display = 'block';
    this.container.style.zIndex = '9999';
    this.container.style.pointerEvents = 'auto';
    
    console.log('🔥 CASE STUDY container styles set:', {
      display: this.container.style.display,
      zIndex: this.container.style.zIndex,
      pointerEvents: this.container.style.pointerEvents,
      opacity: this.container.style.opacity
    });
    
    // 🔥 SMOOTH FADE-IN WITH DELAY TO PREVENT ABRUPT APPEARANCE
    setTimeout(() => {
      // Only fade in the container, not the blocker
      this.container.style.opacity = '1';
      console.log('🔥 CASE STUDY faded in, opacity:', this.container.style.opacity);
    }, 100); // Small delay for smoother transition
    
    // 🔥 DON'T RESET SCROLL - OVERLAY AT CURRENT POSITION
    // Keep current scroll position for Spline background
    
    // 🔥 DON'T DISABLE BODY SCROLL - LET USER SCROLL DOWN IN CASE STUDY
    // document.body.style.overflow = 'hidden';
    // document.documentElement.style.overflow = 'hidden';
    
    // Load React app
    this.loadTendorReactApp();
    
    // Debug container dimensions after loading
    setTimeout(() => {
      console.log('🔥 CASE STUDY Container dimensions:', {
        scrollHeight: this.container.scrollHeight,
        clientHeight: this.container.clientHeight,
        offsetHeight: this.container.offsetHeight,
        canScroll: this.container.scrollHeight > this.container.clientHeight,
        overflowY: this.container.style.overflowY,
        pointerEvents: this.container.style.pointerEvents,
        position: this.container.style.position
      });
      
      // Check if there are any overlays blocking scroll
      const allOverlays = document.querySelectorAll('[style*="z-index"]');
      console.log('🔥 ALL HIGH Z-INDEX ELEMENTS:', Array.from(allOverlays).map(el => ({
        id: el.id,
        className: el.className,
        zIndex: el.style.zIndex,
        pointerEvents: el.style.pointerEvents,
        position: el.style.position,
        rect: el.getBoundingClientRect()
      })));
    }, 1000);
  }
  
  hide() {
    this.isVisible = false;
    
    // 🔥 BLOCKER WAS NEVER ENABLED - NO NEED TO DISABLE
    // Blocker stays disabled to prevent scroll conflicts
    
    this.container.style.opacity = '0';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '-1';
    this.container.style.display = 'none';
    
    // 🔥 BODY SCROLL WAS NEVER DISABLED - NO NEED TO RE-ENABLE
    // document.body.style.overflow = 'auto';
    // document.documentElement.style.overflow = 'auto';
  }

  async loadTendorReactApp() {
    try {
      console.log('🔥 Loading TENDOR case study with EXACT ORIGINAL REACT COMPONENTS...');
      
      // Create React root and render the EXACT original TendorApp component
      if (!this.reactRoot) {
        if (ReactDOM.createRoot) {
          // React 18+
          this.reactRoot = ReactDOM.createRoot(this.container);
          this.reactRoot.render(React.createElement(TendorApp));
        } else {
          // React 17 and below
          ReactDOM.render(React.createElement(TendorApp), this.container);
        }
      }
      
      console.log('🔥 TENDOR case study loaded with EXACT ORIGINAL COMPONENTS!');
      
    } catch (error) {
      console.error('🔥 Error loading TENDOR case study:', error);
      
      // Fallback to simple HTML if React fails
      this.container.innerHTML = `
        <div style="
          padding: 100px 20px; 
          text-align: center; 
          color: #000;
          font-family: 'ABC Repro', sans-serif;
        ">
          <h1 style="color: #40E0D0; margin-bottom: 1rem;">TENDOR Case Study</h1>
          <p style="margin-bottom: 2rem;">React components failed to load. Please check console for errors.</p>
          <button onclick="window.appState.transitionToPortfolio()" style="
            padding: 12px 24px;
            background: #40E0D0;
            border: none;
            border-radius: 8px;
            color: #000;
            cursor: pointer;
            font-size: 1rem;
            font-family: 'ABC Repro', sans-serif;
          ">← Back to Portfolio</button>
        </div>
      `;
    }
  }
  
  // 🔥 REMOVED: No longer creating custom hero image - using React component's built-in hero
  
  // 🔥 COMPLETELY REPLACE WITH RELOAD-LIKE STATE
  hideSplineShowHero() {
    console.log('🔥 NUKING EVERYTHING - SWITCHING TO FULL RELOAD MODE');
    this.splineHidden = true;
    
    // 🔥 COMPLETELY HIDE ALL BACKGROUND ELEMENTS
    this.hideAllBackgroundElements();
    
    // 🔥 SWITCH TO STATIC HERO MODE - SAME AS RELOAD!
    if (window.appState) {
      window.appState.setState({ 
        useStaticHero: true,
        webglVisible: false,
        uiVisible: false,
        splineVisible: false
      });
    }
    
    // 🔥 MAKE CASE STUDY CONTAINER BEHAVE LIKE BODY
    this.makeContainerFullPage();
    
    console.log('🔥 EVERYTHING NUKED - now behaves exactly like reload');
  }
  
  hideAllBackgroundElements() {
    // Hide WebGL canvas
    const webglCanvas = document.querySelector('#canvas_main');
    if (webglCanvas) {
      webglCanvas.style.display = 'none';
    }
    
    // Hide all Spline elements
    const splineElements = [
      document.querySelector('canvas[data-engine="three.js r152"]'),
      document.querySelector('spline-viewer'),
      document.querySelector('#spline-container'),
      ...document.querySelectorAll('canvas')
    ].filter(Boolean);
    
    splineElements.forEach(el => {
      if (el && el !== webglCanvas) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
      }
    });
    
    // Hide UI overlay
    const uiOverlay = document.querySelector('.ui-overlay') || document.querySelector('#ui-overlay');
    if (uiOverlay) {
      uiOverlay.style.display = 'none';
    }
    
    // Hide any other fixed positioned elements that might interfere
    const allFixed = document.querySelectorAll('[style*="position: fixed"]');
    allFixed.forEach(el => {
      if (el.id !== 'case-study-container' && el.id !== 'case-study-blocker') {
        el.style.display = 'none';
      }
    });
    
    console.log('🔥 All background elements hidden');
  }
  
  makeContainerFullPage() {
    // Make container behave like the full page
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      background: white;
      z-index: 10000;
      opacity: 1;
      pointer-events: auto;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      display: block;
    `;
    
    // Also hide body scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    console.log('🔥 Container now behaves like full page');
  }

  // Cleanup
  dispose() {
    if (this.reactRoot && this.reactRoot.unmount) {
      this.reactRoot.unmount();
    }
    if (this.container) {
      this.container.remove();
    }
    if (this.blocker) {
      this.blocker.remove();
    }
    // 🔥 NO CUSTOM HERO IMAGE TO REMOVE - React component handles it
  }
}

export default CaseStudyContainer; 