// 🔥 TRANSITION CONTROLLER FOR SEAMLESS CASE STUDY INTEGRATION

import appState from './StateManager.js';

export class TransitionController {
  constructor(app, tiles, splineWall, uiOverlay) {
    this.app = app;
    this.tiles = tiles;
    this.splineWall = splineWall;
    this.uiOverlay = uiOverlay;
    
    // Fade elements
    this.webglCanvas = null;
    this.uiContainer = null;
    this.splineContainer = null;
    this.fadeOverlay = null;
    
    this.initializeFadeElements();
    this.setupEventListeners();
  }
  
  initializeFadeElements() {
    // 🔥 DISABLE BLACK FADE OVERLAY - CAUSING ISSUES IN CASE STUDY
    // Create fade overlay for smooth transitions
    // this.fadeOverlay = document.createElement('div');
    // this.fadeOverlay.style.cssText = `
    //   position: fixed;
    //   top: 0;
    //   left: 0;
    //   width: 100vw;
    //   height: 100vh;
    //   background: black;
    //   opacity: 0;
    //   pointer-events: none;
    //   z-index: 9999;
    //   transition: opacity 0.8s ease;
    // `;
    // document.body.appendChild(this.fadeOverlay);
    
    // Get references to main elements
    this.webglCanvas = document.querySelector('canvas');
    this.uiContainer = this.uiOverlay?.overlay || document.body;
    
    // Find spline container (usually has spline in class name or data attribute)
    this.splineContainer = document.querySelector('[data-spline]') || 
                          document.querySelector('.spline') ||
                          document.querySelector('#spline-container');
  }
  
  setupEventListeners() {
    // Listen to state manager events
    appState.subscribe('fadeOutWebGL', () => this.fadeOutWebGL());
    appState.subscribe('fadeOutUI', () => this.fadeOutUI());
    appState.subscribe('fadeInWebGL', () => this.fadeInWebGL());
    appState.subscribe('fadeInUI', () => this.fadeInUI());
    
    appState.subscribe('fadeToBlack', () => this.fadeToBlack());
    appState.subscribe('fadeFromBlack', () => this.fadeFromBlack());
    appState.subscribe('removeSpline', () => this.removeSpline());
    appState.subscribe('restoreSpline', () => this.restoreSpline());
    
    // 🔥 SPLINE POSITION PRESERVATION
    appState.subscribe('disableSplineInteractions', () => this.disableSplineInteractions());
    appState.subscribe('enableSplineInteractions', () => this.enableSplineInteractions());
    appState.subscribe('preserveSplinePosition', () => this.preserveSplinePosition());
    
    // 🔥 AGGRESSIVE SPLINE EVENT BLOCKING
    appState.subscribe('blockSplineEvents', () => this.blockSplineEvents());
    appState.subscribe('unblockSplineEvents', () => this.unblockSplineEvents());
    
    // 🔥 PERFORMANCE OPTIMIZATION: Spline hide (permanent) for case study scroll
    appState.subscribe('hideSplineForPerformance', () => this.hideSplineForPerformance());
    // NO restoration event - once hidden, it stays hidden!
    
    // Preserve state before transitions
    appState.subscribe('transitionStart', (data) => {
      if (data.to === 'case-study') {
        this.preservePortfolioState();
      }
    });
    
    // Restore state after transitions
    appState.subscribe('transitionComplete', (data) => {
      if (data.to === 'portfolio') {
        this.restorePortfolioState();
      }
    });
  }
  
  // WebGL fade effects
  fadeOutWebGL() {
    console.log('🔥 FADE OUT WebGL - FAST character fade for case study');
    
    if (this.webglCanvas) {
      this.webglCanvas.style.transition = 'opacity 0.3s ease'; // 🔥 MUCH FASTER: 0.8s → 0.3s
      this.webglCanvas.style.opacity = '0';
    }
    
    // 🔥 DON'T CONTROL CHARACTER - LET STATEMANAGER HANDLE IT
    // Character visibility controlled by StateManager to prevent conflicts
  }
  
  fadeInWebGL() {
    const currentState = appState.getState();
    console.log('🔥 FADE IN WebGL - character control delegated to StateManager');
    
    // 🔥 PREVENT DOUBLE FADE OPERATIONS
    if (currentState.isTransitioning && currentState.mode !== 'portfolio') {
      console.log('🔥 SKIP FADE IN - wrong state');
      return;
    }
    
    if (this.webglCanvas) {
      this.webglCanvas.style.transition = 'opacity 0.8s ease';
      this.webglCanvas.style.opacity = '1';
    }
    
    // 🔥 DON'T CONTROL CHARACTER - LET STATEMANAGER HANDLE IT
    // Character visibility controlled by StateManager to prevent conflicts
    console.log('🔥 WebGL canvas restored - character handled by StateManager');
  }
  
  // UI fade effects
  fadeOutUI() {
    const currentMode = appState.getState().mode;
    console.log('🔥 FADE OUT UI called - mode:', currentMode);
    
    // Don't fade out UI if we're in case study mode (unless transitioning)
    if (currentMode === 'case-study' && !appState.getState().isTransitioning) {
      console.log('🔥 BLOCKING UI fade out - in case study');
      return;
    }
    
    if (this.uiOverlay && this.uiOverlay.overlay) {
      // Fade out the entire UI overlay
      this.uiOverlay.overlay.style.transition = 'opacity 0.8s ease';
      this.uiOverlay.overlay.style.opacity = '0';
      this.uiOverlay.overlay.style.pointerEvents = 'none';
    }
  }
  
  fadeInUI() {
    // 🔥 PREVENT DOUBLE FADE OPERATIONS
    if (appState.getState().isTransitioning && appState.getState().mode !== 'portfolio') {
      console.log('🔥 Skipping UI fade-in - wrong transition state');
      return;
    }
    
    if (this.uiOverlay && this.uiOverlay.overlay) {
      // 🔥 FORCE RESTORE UI OVERLAY
      this.uiOverlay.overlay.style.display = 'block';
      this.uiOverlay.overlay.style.transition = 'opacity 0.8s ease';
      this.uiOverlay.overlay.style.opacity = '1';
      this.uiOverlay.overlay.style.pointerEvents = 'none'; // Keep pointer events disabled as they should be
      console.log('🔥 UI restored and visible in fadeInUI');
    }
  }
  
  // Spline performance management
  fadeToBlack() {
    console.log('🔥 fadeToBlack called - DISABLED');
    // this.fadeOverlay.style.opacity = '1';
  }
  
  fadeFromBlack() {
    console.log('🔥 fadeFromBlack called - DISABLED');
    // this.fadeOverlay.style.opacity = '0';
  }
  
  removeSpline() {
    if (this.splineWall) {
      // Temporarily remove spline from scene for performance
      this.splineWall.visible = false;
      
      // Dispose of spline resources temporarily
      if (this.splineWall.dispose) {
        this.splineWall.dispose();
      }
    }
  }
  
  restoreSpline() {
    if (this.splineWall) {
      // Restore spline to scene
      this.splineWall.visible = true;
      
      // Re-initialize if needed
      if (this.splineWall.initialize) {
        this.splineWall.initialize();
      }
    }
  }
  
  // State preservation
  preservePortfolioState() {
    appState.preservePortfolioState(
      this.tiles,
      this.app._camera,
      this.app._currentScrollOffset || 0
    );
  }
  
  restorePortfolioState() {
    appState.restorePortfolioState(
      this.tiles,
      this.app._camera,
      this.app
    );
  }
  
  // Case study integration
  setupCaseStudyButton() {
    // Find the TENDOR case study button and add click handler
    const caseStudyButton = document.querySelector('[data-case-study="tendor"]') ||
                           document.querySelector('.case-study-button') ||
                           document.querySelector('#tendor-button');
    
    if (caseStudyButton) {
      // 🔥 REDUCE BUTTON CLICKABLE AREA TO NOT BLOCK SPLINE
      caseStudyButton.style.pointerEvents = 'auto';
      caseStudyButton.style.display = 'inline-block';
      caseStudyButton.style.position = 'relative';
      caseStudyButton.style.zIndex = '10000'; // Higher than Spline
      
      caseStudyButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        
        console.log('🔥 Case study button clicked');
        
        // 🔥 PASS REQUIRED PARAMETERS FOR STATE PRESERVATION
        const scrollOffset = this.app._currentScrollOffset || 0;
        appState.transitionToCaseStudy(
          this.tiles, 
          this.app._camera, 
          scrollOffset, 
          this.splineWall
        );
      });
    }
  }
  
  // 🔥 SPLINE INTERACTION CONTROL
  disableSplineInteractions() {
    if (this.splineWall && this.splineWall._canvas) {
      this.splineWall._canvas.style.pointerEvents = 'none';
      console.log('🔥 Spline interactions disabled');
    }
  }
  
  enableSplineInteractions() {
    if (this.splineWall && this.splineWall._canvas) {
      this.splineWall._canvas.style.pointerEvents = 'auto';
      console.log('🔥 Spline interactions enabled');
    }
  }
  
  preserveSplinePosition() {
    // Don't reset Spline - keep current camera position
    console.log('🔥 Preserving Spline position during transition');
  }

  // 🔥 BLOCK SPLINE EVENTS - SIMPLE APPROACH, NO VISUAL BLOCKER
  blockSplineEvents() {
    console.log('🔥 BLOCKING SPLINE EVENTS - CSS only, no overlay');
    
    // Find Spline canvas - try multiple selectors
    const splineCanvas = document.querySelector('canvas[data-engine="three.js r152"]') || 
                        document.querySelector('spline-viewer canvas') ||
                        document.querySelector('#spline-container canvas') ||
                        document.querySelectorAll('canvas')[1]; // Often the second canvas
    
    if (splineCanvas) {
      console.log('🔥 Found Spline canvas, disabling pointer events');
      
      // Just disable canvas pointer events - no visual blocker needed
      splineCanvas.style.pointerEvents = 'none';
      this.blockedSplineCanvas = splineCanvas;
      
      console.log('🔥 SPLINE BLOCKED - pointer events disabled, no overlay');
    } else {
      console.log('🔥 NO Spline canvas found!');
    }
  }
  
  unblockSplineEvents() {
    console.log('🔥 UNBLOCKING SPLINE EVENTS');
    
    // Re-enable canvas pointer events
    if (this.blockedSplineCanvas) {
      this.blockedSplineCanvas.style.pointerEvents = 'auto';
      this.blockedSplineCanvas = null;
    }
    
    console.log('🔥 SPLINE UNBLOCKED - pointer events restored');
  }

  // 🔥 PERFORMANCE OPTIMIZATION: Hide Spline PERMANENTLY when scrolled past 100vh
  hideSplineForPerformance() {
    console.log('🔥 HIDING SPLINE PERMANENTLY FOR PERFORMANCE - scrolled past 100vh');
    
    // Try multiple ways to find Spline canvas
    const splineCanvas = document.querySelector('canvas[data-engine="three.js r152"]') || 
                        document.querySelector('spline-viewer canvas') ||
                        document.querySelector('#spline-container canvas') ||
                        document.querySelectorAll('canvas')[1] || // Often the second canvas
                        (this.splineWall && this.splineWall._canvas);
    
    if (splineCanvas) {
      // Hide the Spline canvas completely and PERMANENTLY
      splineCanvas.style.display = 'none';
      splineCanvas.style.visibility = 'hidden'; // Double ensure it's gone
      console.log('🔥 Spline canvas PERMANENTLY hidden for performance optimization');
      
      // DON'T store reference - we never want to show it again
      this.splineDestroyed = true;
    } else {
      console.log('🔥 WARNING: Could not find Spline canvas to hide');
    }
    
    // Also pause Spline updates permanently
    if (this.splineWall && this.splineWall.pause) {
      this.splineWall.pause();
    }
    
    // Dispose of Spline resources to free memory
    if (this.splineWall && this.splineWall.dispose) {
      this.splineWall.dispose();
    }
  }
  
  // 🔥 REMOVED: No more Spline restoration - once gone, it's gone forever!

  // Cleanup
  dispose() {
    if (this.fadeOverlay) {
      this.fadeOverlay.remove();
    }
    
    // Clean up Spline blocker
    this.unblockSplineEvents();
  }
}

export default TransitionController; 