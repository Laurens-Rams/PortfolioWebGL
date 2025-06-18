// 🔥 LIGHTWEIGHT STATE MANAGER FOR SEAMLESS TRANSITIONS

class AppStateManager {
  constructor() {
    this.state = {
      mode: 'portfolio', // 'portfolio' | 'case-study'
      
      // 🔥 NAVIGATION TRACKING
      isDirectAccess: false,     // True if user came directly to case study (reload/direct link)
      hasValidSplineState: false, // True if we have a valid Spline state to restore
      sessionStartTime: Date.now(), // Track session start
      
      // Portfolio state preservation
      webglVisible: true,
      splineVisible: true,
      uiVisible: true,
      characterPosition: null,
      scrollPosition: 0,
      animationState: null,
      splineState: null,         // Store Spline camera/scene state
      
      // Case study state
      caseStudyVisible: false,
      caseStudyScrollPosition: 0,
      useStaticHero: false,      // True when showing static hero image instead of Spline
      
      // Transition state
      isTransitioning: false,
      fadeToBlackActive: false
    };
    
    this.listeners = new Map();
    this.transitionController = null;
    
    // 🔥 DETECT DIRECT ACCESS OR RELOAD
    this._detectNavigationType();
  }
  
  // State management
  setState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    
    // Only log important state changes
    if (newState.mode || newState.isTransitioning !== undefined) {
      console.log('🔥 STATE:', { mode: this.state.mode, transitioning: this.state.isTransitioning });
    }
    
    this.notifyListeners(oldState, this.state);
  }
  
  getState() {
    return { ...this.state };
  }
  
  // Event system
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    };
  }
  
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }
  
  notifyListeners(oldState, newState) {
    this.emit('stateChange', { oldState, newState });
  }
  
  // 🔥 DETECT NAVIGATION TYPE
  _detectNavigationType() {
    const path = window.location.pathname;
    const referrer = document.referrer;
    const isReload = window.performance.navigation.type === 1;
    const isDirectAccess = !referrer || referrer.indexOf(window.location.host) === -1;
    
    // If on case study page and it's a reload or direct access
    if (path === '/case-study' && (isReload || isDirectAccess)) {
      this.setState({
        isDirectAccess: true,
        useStaticHero: true,
        hasValidSplineState: false
      });
      console.log('🔥 Direct access to case study detected - using static hero');
    } else {
      this.setState({
        isDirectAccess: false,
        useStaticHero: false
      });
    }
  }

  // Portfolio state preservation
  preservePortfolioState(tiles, camera, scrollOffset, splineApp) {
    console.log('🔥 Preserving portfolio state at scroll:', scrollOffset);
    
    // 🔥 PRESERVE SPLINE STATE
    let splineState = null;
    if (splineApp && splineApp._splineApp) {
      try {
        // Try to get Spline camera state (if available in API)
        splineState = {
          cameraPosition: splineApp._splineApp.camera?.position,
          cameraRotation: splineApp._splineApp.camera?.rotation,
          timestamp: Date.now()
        };
      } catch (e) {
        console.log('🔥 Could not preserve Spline state:', e);
      }
    }
    
    this.setState({
      characterPosition: tiles._climber ? tiles._climber.position.clone() : null,
      scrollPosition: scrollOffset,
      splineState: splineState,
      hasValidSplineState: !!splineState,
      animationState: {
        currentState: tiles._animationController?.currentState,
        stateProgress: tiles._animationController?.stateProgress,
        currentAction: tiles._currentAction?.getClip().name
      }
    });
    
    console.log('🔥 Portfolio state preserved:', {
      scrollPosition: scrollOffset,
      hasSplineState: !!splineState,
      characterState: tiles._animationController?.currentState,
      characterVisible: tiles._climber?.visible
    });
  }
  
  restorePortfolioState(tiles, camera, app) {
    const state = this.getState();
    
    console.log('🔥 Restoring portfolio state:', state);
    
    // 🔥 NO SCROLL CONSTRAINTS NEEDED WITH OVERLAY APPROACH
    
    // 🔥 RESTORE SCROLL POSITION FIRST
    if (state.scrollPosition !== undefined) {
      const maxScrollY = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
      const scrollY = state.scrollPosition * maxScrollY;
      window.scrollTo(0, scrollY);
      app._currentScrollOffset = state.scrollPosition;
      
      console.log('🔥 Restored scroll to:', state.scrollPosition, 'Y:', scrollY);
    }
    
    // 🔥 AGGRESSIVELY RESTORE CHARACTER
    if (tiles._climber) {
      // Force character visible multiple ways
      tiles._climber.visible = true;
      tiles._climber.frustumCulled = false; // Prevent culling
      
      if (state.characterPosition) {
        tiles._climber.position.copy(state.characterPosition);
      }
      
      // Force update character in scene
      if (tiles._climber.parent) {
        tiles._climber.parent.updateMatrixWorld(true);
      }
      
      console.log('🔥 Character AGGRESSIVELY restored:', {
        visible: tiles._climber.visible,
        position: tiles._climber.position,
        inScene: !!tiles._climber.parent
      });
    }
    
    // 🔥 RESTORE WEBGL CANVAS VISIBILITY
    if (app._gl && app._gl.domElement) {
      app._gl.domElement.style.opacity = '0'; // Start faded out for smooth transition
      app._gl.domElement.style.display = 'block';
      console.log('🔥 WebGL canvas prepared for fade-in');
    }
    
    // 🔥 RESTORE ANIMATION STATE
    if (state.animationState && tiles._animationController) {
      tiles._animationController.currentState = state.animationState.currentState;
      tiles._animationController.stateProgress = state.animationState.stateProgress;
      
      // Force animation update
      tiles._animationController.forceUpdate = true;
      
      console.log('🔥 Animation state restored:', state.animationState.currentState);
    }
    
    // 🔥 FORCE TILES SCROLL UPDATE TO RESTORE ALL STATES
    if (tiles.onScroll) {
      tiles.onScroll();
      console.log('🔥 Forced tiles scroll update');
    }
    
    // 🔥 FORCE REFRESH ENTIRE TILES SYSTEM
    if (tiles._scene) {
      tiles._scene.updateMatrixWorld(true);
      console.log('🔥 Forced scene matrix update');
    }
    
    // 🔥 DOUBLE CHECK CHARACTER AFTER EVERYTHING
    setTimeout(() => {
      if (tiles._climber) {
        tiles._climber.visible = true;
        tiles._climber.frustumCulled = false;
        console.log('🔥 FINAL character check - visible:', tiles._climber.visible);
      }
    }, 500);
    
    // 🔥 RESTORE UI VISIBILITY IMMEDIATELY - NO DELAY NEEDED
    if (app.uiOverlay && app.uiOverlay.overlay) {
      app.uiOverlay.overlay.style.display = 'block';
      app.uiOverlay.overlay.style.opacity = '0'; // Start faded out for smooth transition
      app.uiOverlay.overlay.style.pointerEvents = 'none'; // Keep pointer events disabled
      
      console.log('🔥 UI prepared for fade-in');
    }
    
    console.log('🔥 Portfolio state restoration complete');
  }
  
  // Transition methods
  async transitionToCaseStudy(tiles, camera, scrollOffset, splineApp) {
    if (this.state.isTransitioning) return;
    
    // 🔥 PRESERVE CURRENT STATE BEFORE TRANSITION
    this.preservePortfolioState(tiles, camera, scrollOffset, splineApp);
    
    this.setState({ isTransitioning: true });
    
    // Emit transition start
    this.emit('transitionStart', { to: 'case-study' });
    
    // 🔥 AGGRESSIVELY DISABLE SPLINE INTERACTIONS
    this.emit('disableSplineInteractions');
    this.emit('blockSplineEvents');
    
    // Fade out WebGL and UI (keep spline at current position)
    this.emit('fadeOutWebGL');
    this.emit('fadeOutUI');
    
    // Wait for fade
    await this.wait(300); // 🔥 FASTER FADE: Match the 0.3s character transition
    
    // Hide WebGL completely first
    this.setState({
      mode: 'case-study',
      webglVisible: false,
      uiVisible: false,
      caseStudyVisible: false, // Don't show yet
      isTransitioning: true, // Keep transitioning
      useStaticHero: false // Use Spline as hero (not static image)
    });
    
    // 🔥 SMALL DELAY BEFORE SHOWING CASE STUDY FOR SMOOTHER TRANSITION
    await this.wait(200);
    
    // Now show case study
    this.setState({
      caseStudyVisible: true,
      isTransitioning: false
    });
    
    // 🔥 KEEP SPLINE BLOCKED UNTIL USER SCROLLS IN CASE STUDY
    // Don't unblock yet - wait for first scroll
    this.emit('disableSplineInteractions');
    this.emit('preserveSplinePosition');
    
    // 🔥 UPDATE URL BUT NO RELOAD
    this.updateURL('/case-study');
    
    this.emit('transitionComplete', { to: 'case-study' });
    
    console.log('🔥 Transitioned to case study with preserved state');
  }
  
  async transitionToPortfolio(tiles, camera, app) {
    console.log('🔥 SIMPLIFIED: Full reload to homepage - no complex transitions');
    
    // 🔥 SIMPLE SOLUTION: FULL RELOAD TO HOMEPAGE
    // This eliminates all character flickering and state conflicts
    window.location.href = '/';
  }
  
  // Spline performance management
  handleCaseStudyScroll(scrollTop) {
    // 🔥 DISABLE SPLINE FADING DURING CASE STUDY - KEEP SPLINE VISIBLE
    console.log('🔥 Case study scroll handler called - DISABLED for overlay approach');
    
    // Just update scroll position, don't fade Spline
    this.setState({ caseStudyScrollPosition: scrollTop });
    
    // 🔥 COMMENTED OUT: This was causing the fade issues
    /*
    const vh = window.innerHeight;
    const scrolledPastHero = scrollTop > vh;
    
    if (scrolledPastHero && this.state.splineVisible) {
      // Fade to black, then remove spline
      this.emit('fadeToBlack');
      setTimeout(() => {
        this.setState({ splineVisible: false, fadeToBlackActive: false });
        this.emit('removeSpline');
      }, 300); // Fade duration
      
    } else if (!scrolledPastHero && !this.state.splineVisible) {
      // Restore spline before it becomes visible
      this.setState({ splineVisible: true });
      this.emit('restoreSpline');
      this.emit('fadeFromBlack');
    }
    */
  }
  
  // Utilities
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  updateURL(path) {
    window.history.pushState({}, '', path);
  }
  


  // Initialize routing
  initializeRouting() {
    // Handle browser back/forward navigation
    window.addEventListener('popstate', (e) => {
      const path = window.location.pathname;
      console.log('🔥 Browser navigation detected:', path);
      
      if (path === '/case-study' && this.state.mode !== 'case-study') {
        // Going to case study via back/forward
        if (window.app && window.app._tiles && window.app._camera) {
          const scrollOffset = window.app._currentScrollOffset || 0;
          this.transitionToCaseStudy(window.app._tiles, window.app._camera, scrollOffset, window.app._climbingWall);
        }
      } else if (path !== '/case-study' && this.state.mode === 'case-study') {
        // 🔥 SIMPLIFIED: Going back to portfolio = full reload
        console.log('🔥 Browser back from case study - full reload');
        window.location.href = '/';
      }
    });
    
    // 🔥 HANDLE DIRECT ACCESS AND RELOADS
    this._handleInitialRoute();
  }

  _handleInitialRoute() {
    const path = window.location.pathname;
    const isReload = performance.navigation?.type === 1 || 
                    performance.getEntriesByType('navigation')[0]?.type === 'reload';
    
    if (path === '/case-study') {
      console.log('🔥 Case study direct access/reload detected');
      
      // Set case study mode immediately (no transition)
      this.setState({
        mode: 'case-study',
        webglVisible: false,
        uiVisible: false, 
        caseStudyVisible: true,
        useStaticHero: true, // Use static hero for direct access
        isDirectAccess: true
      });
      
      // 🔥 NO FAKE SCROLL NEEDED - CASE STUDY OVERLAYS AT CURRENT POSITION
      // Keep the current scroll position as-is
    }
  }

  // 🔥 SCROLL CONSTRAINT METHODS REMOVED - USING OVERLAY APPROACH
}

// Global state manager instance
export const appState = new AppStateManager();

// Export for easy access
export default appState; 