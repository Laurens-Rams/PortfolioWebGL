// 🔥 TRANSITION CONTROLLER FOR SEAMLESS CASE STUDY INTEGRATION

class TransitionController {
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
    // Get references to main elements - use specific selectors
    this.webglCanvas = document.querySelector('#canvas_main'); // Character WebGL canvas
    this.splineCanvas = document.querySelector('#spline-canvas'); // Spline canvas
    this.uiContainer = this.uiOverlay?.overlay || document.body;
    
    console.log('🔥 TRANSITION CONTROLLER: Canvas references initialized:', {
      webglCanvas: !!this.webglCanvas,
      splineCanvas: !!this.splineCanvas,
      uiOverlay: !!this.uiOverlay?.overlay
    });
    
    // Find spline container (usually has spline in class name or data attribute)
    this.splineContainer = document.querySelector('[data-spline]') || 
                          document.querySelector('.spline') ||
                          document.querySelector('#spline-container');
  }
  
  setupEventListeners() {
    // Wait for window.appState to be available
    const setupListeners = () => {
      if (!window.appState) {
        console.log('🔥 TRANSITION CONTROLLER: Waiting for window.appState...');
        setTimeout(setupListeners, 100);
        return;
      }
      
      console.log('🔥 TRANSITION CONTROLLER: Setting up listeners on StateManager instance:', window.appState);
      
      // Listen to state manager events
      window.appState.subscribe('fadeOutWebGL', () => {
        console.log('🔥 TRANSITION CONTROLLER: fadeOutWebGL event received!');
        this.fadeOutWebGL();
      });
      window.appState.subscribe('fadeOutUI', () => {
        console.log('🔥 TRANSITION CONTROLLER: fadeOutUI event received!');
        this.fadeOutUI();
      });
             window.appState.subscribe('fadeInWebGL', () => this.fadeInWebGL());
       window.appState.subscribe('fadeInUI', () => this.fadeInUI());
      
       window.appState.subscribe('fadeToBlack', () => this.fadeToBlack());
       window.appState.subscribe('fadeFromBlack', () => this.fadeFromBlack());
       window.appState.subscribe('removeSpline', () => this.removeSpline());
       window.appState.subscribe('restoreSpline', () => this.restoreSpline());
      
       // 🔥 SPLINE POSITION PRESERVATION
       window.appState.subscribe('disableSplineInteractions', () => this.disableSplineInteractions());
       window.appState.subscribe('enableSplineInteractions', () => this.enableSplineInteractions());
       window.appState.subscribe('preserveSplinePosition', () => this.preserveSplinePosition());
      
       // 🔥 AGGRESSIVE SPLINE EVENT BLOCKING
       window.appState.subscribe('blockSplineEvents', () => this.blockSplineEvents());
       window.appState.subscribe('unblockSplineEvents', () => this.unblockSplineEvents());
      
       // 🔥 PERFORMANCE OPTIMIZATION: Spline hide (permanent) for case study scroll
       window.appState.subscribe('hideSplineForPerformance', () => this.hideSplineForPerformance());
       // NO restoration event - once hidden, it stays hidden!
      
       // Preserve state before transitions
       window.appState.subscribe('transitionStart', (data) => {
         if (data.to === 'case-study') {
           this.preservePortfolioState();
         }
       });
      
       // Restore state after transitions
       window.appState.subscribe('transitionComplete', (data) => {
         if (data.to === 'portfolio') {
           this.restorePortfolioState();
         }
       });
     };
     
     setupListeners();
   }
  
  // WebGL fade effects
  fadeOutWebGL() {
    console.log('🔥 TRANSITION CONTROLLER: fadeOutWebGL() called - starting character fade out');
    
    if (this.webglCanvas) {
      console.log('🔥 TRANSITION CONTROLLER: Found WebGL canvas, applying fade out');
      this.webglCanvas.style.transition = 'opacity 0.3s ease';
      this.webglCanvas.style.opacity = '0';
    } else {
      console.log('🔥 TRANSITION CONTROLLER: ERROR - No WebGL canvas found!');
    }
  }
  
  fadeInWebGL() {
    const currentState = window.appState.getState();
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
    const currentMode = window.appState.getState().mode;
    console.log('🔥 TRANSITION CONTROLLER: fadeOutUI() called - mode:', currentMode);
    
    // Don't fade out UI if we're in case study mode (unless transitioning)
    if (currentMode === 'case-study' && !window.appState.getState().isTransitioning) {
      console.log('🔥 TRANSITION CONTROLLER: Blocking UI fade out - in case study');
      return;
    }
    
    if (this.uiOverlay && this.uiOverlay.overlay) {
      console.log('🔥 TRANSITION CONTROLLER: Found UI overlay, applying fade out');
      this.uiOverlay.overlay.style.transition = 'opacity 0.8s ease';
      this.uiOverlay.overlay.style.opacity = '0';
      this.uiOverlay.overlay.style.pointerEvents = 'none';
    } else {
      console.log('🔥 TRANSITION CONTROLLER: ERROR - No UI overlay found!');
    }
  }
  
  fadeInUI() {
    // 🔥 PREVENT DOUBLE FADE OPERATIONS
    if (window.appState.getState().isTransitioning && window.appState.getState().mode !== 'portfolio') {
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
    window.appState.preservePortfolioState(
      this.tiles,
      this.app._camera,
      this.app._currentScrollOffset || 0
    );
  }
  
  restorePortfolioState() {
    window.appState.restorePortfolioState(
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
        window.appState.transitionToCaseStudy(
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