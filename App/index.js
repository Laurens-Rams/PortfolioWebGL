import {
  PerspectiveCamera,
  WebGLRenderer,
  Scene,
  Color,
  Clock,
  MathUtils,
  AmbientLight,
  PointLight,
  TextureLoader,
  Frustum,
  Matrix4,
} from 'three';

import { DragGesture } from '@use-gesture/vanilla';
// import Stats from 'stats.js'; // 🔥 REMOVED FOR PRODUCTION
import * as dat from 'dat.gui';
import Postprocessing from './Postprocessing';
import { damp } from 'maath/easing';

import Tiles from './Sliders';
import { CLIMBING_CONFIG } from './ClimbingConfig';
import SplineClimbingWall from './SplineClimbingWall';
import UIOverlay from './UIOverlay';
import { injectGlobalStyles } from './DesignSystem';

// 🔥 NEW CASE STUDY INTEGRATION SYSTEM
import appState from './StateManager';
import TransitionController from './TransitionController';
import CaseStudyContainer from './CaseStudyContainer';

// 🔥 SIMPLE FADE-IN MANAGER - NO LOADING SCREEN
class FadeInManager {
  constructor() {
    this.loadedComponents = {
      character: false,
      spline: false
    };
    
    // Lock scroll initially
    document.body.classList.add('loading');
    
    // Background is already visible (no fade needed)
    console.log('🔥 Background ready immediately');
  }
  
  setLoaded(component) {
    this.loadedComponents[component] = true;
    console.log(`🔥 ${component.toUpperCase()} loaded - fading in`);
    
    // Fade in the component
    if (component === 'character') {
      this.fadeInCharacter();
    } else if (component === 'spline') {
      this.fadeInSpline();
    }
    
    // Check if everything is ready
    this.checkAllLoaded();
  }
  
    fadeInCharacter() {
    // Character fades in FASTER for better UX
    console.log('🔥 Character fading in fast...');
    
    // Get the main WebGL canvas and apply fade transition
    const webglCanvas = document.querySelector('#canvas_main');
    if (webglCanvas) {
      webglCanvas.style.transition = 'opacity 1.2s ease-out'; // Faster: 2s → 1.2s
      webglCanvas.style.opacity = '1';
    }
  }

  fadeInSpline() {
    // Spline fades in SLOWER for more cinematic background
    const splineCanvas = document.querySelector('#spline-canvas');
    if (splineCanvas) {
      splineCanvas.style.transition = 'opacity 3.5s ease-out'; // Slower: 2.5s → 3.5s
      splineCanvas.style.opacity = '1';
      console.log('🔥 Spline fading in slowly...');
    }
  }
  
  checkAllLoaded() {
    const allLoaded = Object.values(this.loadedComponents).every(state => state);
    
    if (allLoaded) {
      // Unlock scroll
      document.body.classList.remove('loading');
      console.log('🔥 All components loaded - scroll unlocked');
    }
  }
}

const fadeInManager = new FadeInManager();

const TL = new TextureLoader();

export default class App {
  constructor(debug = false) {
    this.numParticles = 500;

    this.debug = debug;

    this.mouseX = 0;
    this.mouseY = 0;
    this.targetRotationX = 0;
    this.targetRotationY = 0;

    // Mouse position for climber head tracking
    this.normalizedMouseX = 0;
    this.normalizedMouseY = 0;
    
    // 🔥 DEBUG MODE - DISABLE SPAM
    this.debugMode = false;

    // 🔥 FADE-IN MANAGER REFERENCE
    this.fadeInManager = fadeInManager;

    // 🔥 PERFORMANCE MONITORING REMOVED FOR PRODUCTION
    // Enhanced performance monitoring - REMOVED
    // this.frameCount = 0;
    // this.lastFPSCheck = performance.now();
    // this.currentFPS = 60;
    // this.frameTimeHistory = [];
    // this.maxFrameTimeHistory = 60;
    // this.renderStats = { ... };
    // this.performanceDisplay = null;
    // this.memoryMonitor = null;

    // UI visibility state
    this.uiVisible = false; // Hidden by default

    // UI Overlay for text components
    this.uiOverlay = null;

    // Advanced optimization systems
    this.frustumCulling = true;
    this.lodSystem = true;
    this.objectPool = new Map();
    this.culledObjects = new Set();
    this.lastCullCheck = 0;
    this.cullCheckInterval = 100; // Check every 100ms

    this._init();
  }

  _init() {
    // Inject global typography styles first
    injectGlobalStyles();
    
    // Device capability detection
    this._isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this._isLowEnd = this._isMobile || navigator.hardwareConcurrency <= 4;
    
    // Renderer - Optimized Performance Settings
    this._gl = new WebGLRenderer({
      canvas: document.querySelector('#canvas_main'),
      antialias: !this._isMobile, // Disable AA on mobile for performance
      stencil: false, // Disabled stencil buffer - not needed with Spline background
      logarithmicDepthBuffer: false, // Disable for better performance
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
      alpha: true, // Enable transparency to see Spline background
      precision: this._isMobile ? 'mediump' : 'highp', // Lower precision on mobile
      premultipliedAlpha: false,
      preserveDrawingBuffer: false
    });
    this._gl.setSize(window.innerWidth, window.innerHeight);
    this._gl.setClearColor(0x000000, 0); // Transparent background
    
    // Optimized renderer settings
    this._gl.shadowMap.enabled = false; // No shadows needed
    this._gl.outputColorSpace = 'srgb';
    this._gl.toneMapping = 1; // ACESFilmicToneMapping
    this._gl.toneMappingExposure = 1.0;

    // Advanced WebGL optimizations
    const gl = this._gl.getContext();
    
    // Enable texture compression if available
    const ext = gl.getExtension('WEBGL_compressed_texture_s3tc') || 
                gl.getExtension('WEBGL_compressed_texture_etc1') ||
                gl.getExtension('WEBGL_compressed_texture_pvrtc');
    if (ext) {
      console.log('🔥 Texture compression enabled:', ext);
    }
    
    // Optimize WebGL state
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);

    this._setDPR();

    // Camera - Optimized settings
    const aspect = window.innerWidth / window.innerHeight;
    this._camera = new PerspectiveCamera(50, aspect, 0.1, 20000); // Reduced far plane
    this._camera.filmGauge = 35; // Standard film gauge for better quality
    this._camera.filmOffset = 0;
    this._camera.position.set(-450, CLIMBING_CONFIG.CAMERA_START_Y, -300); // Camera shifted to MAXIMUM left for ultimate cinematic composition
    
    // Enable camera to see both default layer (0) and climber layer (1)
    this._camera.layers.enableAll(); // See all layers
    
    this._resize();

    // Scene
    this._scene = new Scene();
    // this._scene.background = new Color(0x000000); // Black background

    // 🔥 PERFORMANCE DISPLAY REMOVED FOR PRODUCTION
    // Always show performance metrics (not just in debug mode) - REMOVED
    // this._createPerformanceDisplay();

    // Always show light controls for easy adjustment (not just debug mode)
    // Light controls removed - post-processing controls only

    // Clock for delta
    this._clock = new Clock();

    // Lights
    this._initLights();

    // POSTPROCESSING - ENABLED FOR EFFECTS (BEFORE SCENE INIT)
    this.postprocessing = new Postprocessing({
      gl: this._gl,
      scene: this._scene,
      camera: this._camera,
    });
    
    console.log('🔥 APP POSTPROCESSING CREATED:', !!this.postprocessing);

    this._initScene();

    // Event Listeners
    this._initEvents();

    // 🔥 PERFORMANCE BENCHMARK REMOVED FOR PRODUCTION
    // setTimeout(() => this._runPerformanceBenchmark(), 2000); - REMOVED

    // Animation
    this._animate();
  }

  _initLights() {
    // Ambient moonlight - cool blue tint for night atmosphere
    this._ambientLight = new AmbientLight(0x3a5a85); // Darker cool blue moonlight color
    this._ambientLight.intensity = 1.0; // NEW DEFAULT from UI
    this._scene.add(this._ambientLight);

    // Key moonlight - cool white with blue tint (NEW DEFAULTS from UI)
    this._keyLight = new PointLight(0x9bb5d6, 1, 28500); // Cool moonlight color
    this._keyLight.position.set(3500, -3900, 5000); // NEW DEFAULT from UI
    this._keyLight.intensity = 84000; // NEW DEFAULT from UI
    this._keyLight.distance = 28500; // NEW DEFAULT from UI
    this._keyLight.decay = 1.0; // NEW DEFAULT from UI (0.98 rounded to 1.0)
    this._scene.add(this._keyLight);

    // Add a secondary moonlight from above for atmospheric effect (NEW DEFAULTS from UI)
    this._moonLight = new PointLight(0x6a8bc7, 1, 12500); // Soft blue moonlight
    this._moonLight.position.set(-3200, 2600, -1000); // NEW DEFAULT from UI
    this._moonLight.intensity = 19000; // NEW DEFAULT from UI
    this._moonLight.distance = 12500; // NEW DEFAULT from UI
    this._moonLight.decay = 0.9; // NEW DEFAULT from UI
    this._scene.add(this._moonLight);

    // LIGHTING TRANSITION SYSTEM
    this._initLightingTransition();

    // Rim light removed - was causing layer visibility issues

    // Easy lighting controls for debugging/tweaking
    if (this.debug) {
      this._gui = new dat.GUI();
      
      // Ambient Light Controls
      const ambientFolder = this._gui.addFolder('Ambient Light');
      ambientFolder.add(this._ambientLight, 'intensity', 0, 2, 0.1).name('Intensity');
      
      // Main Light Controls
      const mainFolder = this._gui.addFolder('Main Light (Behind)');
      mainFolder.add(this._mainLight, 'intensity', 0, 20000, 500).name('Intensity');
      mainFolder.add(this._mainLight.position, 'x', -3000, 3000, 100).name('X Position');
      mainFolder.add(this._mainLight.position, 'y', -3000, 3000, 100).name('Y Position');
      mainFolder.add(this._mainLight.position, 'z', -1000, 3000, 100).name('Z Position');
      
      // Fill Light Controls
      const fillFolder = this._gui.addFolder('Fill Light');
      fillFolder.add(this._fillLight, 'intensity', 0, 15000, 500).name('Intensity');
      fillFolder.add(this._fillLight.position, 'x', -3000, 3000, 100).name('X Position');
      fillFolder.add(this._fillLight.position, 'y', -3000, 3000, 100).name('Y Position');
      fillFolder.add(this._fillLight.position, 'z', -1000, 3000, 100).name('Z Position');
      
      // Front Light Controls
      const frontFolder = this._gui.addFolder('Front Light');
      frontFolder.add(this._frontLight, 'intensity', 0, 15000, 500).name('Intensity');
      frontFolder.add(this._frontLight.position, 'x', -3000, 3000, 100).name('X Position');
      frontFolder.add(this._frontLight.position, 'y', -3000, 3000, 100).name('Y Position');
      frontFolder.add(this._frontLight.position, 'z', -1000, 3000, 100).name('Z Position');
      
      // Key Light Controls
      const keyFolder = this._gui.addFolder('Key Light (Moonlight)');
      keyFolder.add(this._keyLight, 'intensity', 0, 20000, 500).name('Intensity');
      keyFolder.add(this._keyLight.position, 'x', -5000, 5000, 100).name('X Position');
      keyFolder.add(this._keyLight.position, 'y', -3000, 5000, 100).name('Y Position');
      keyFolder.add(this._keyLight.position, 'z', -1000, 3000, 100).name('Z Position');
      
      // Moon Light Controls
      const moonFolder = this._gui.addFolder('Moon Light (Atmospheric)');
      moonFolder.add(this._moonLight, 'intensity', 0, 20000, 500).name('Intensity');
      moonFolder.add(this._moonLight.position, 'x', -5000, 5000, 100).name('X Position');
      moonFolder.add(this._moonLight.position, 'y', -3000, 5000, 100).name('Y Position');
      moonFolder.add(this._moonLight.position, 'z', -1000, 3000, 100).name('Z Position');
      
              // Phone controls will be added after scene initialization
      
      // Open the folders by default for easy access
      ambientFolder.open();
      frontFolder.open();
      keyFolder.open();
    }
  }

  _initLightingTransition() {
    // LIGHTING STATES - Beginning vs End of scroll
    this._lightingStates = {
      // BEGINNING STATE (scroll 0%) - your start settings
      beginning: {
        ambient: { intensity: 0.08 },
        keyLight: { 
          intensity: 43000,
          position: { x: 2300, y: 200, z: -100 },
          distance: 13000,
          decay: 1.0
        },
        moonLight: {
          intensity: 14000,
          position: { x: -2300, y: 1600, z: -900 },
          distance: 8000,
          decay: 0.9
        }
      },
      
      // END STATE (scroll 100%) - your current dialed-in settings
      end: {
        ambient: { intensity: 0.08 },
        keyLight: { 
          intensity: 32000,
          position: { x: 3100, y: 200, z: -100 },
          distance: 13000,
          decay: 1.1
        },
        moonLight: {
          intensity: 8000,
          position: { x: -5700, y: 4000, z: -900 },
          distance: 8000,
          decay: 0.9
        }
      }
    };

    // PERFORMANCE OPTIMIZATION - throttle lighting updates
    this._lastLightingUpdate = 0;
    this._lightingUpdateInterval = 100; // Update every 100ms max
    this._currentScrollForLighting = 0;
    this._targetScrollForLighting = 0;
    this._lightingLerpSpeed = 0.05; // Smooth interpolation
  }

  _updateLightingTransition(scrollOffset) {
    const now = performance.now();
    
    // PERFORMANCE: Only update lighting every 100ms
    if (now - this._lastLightingUpdate < this._lightingUpdateInterval) {
      return;
    }
    
    this._lastLightingUpdate = now;
    this._targetScrollForLighting = scrollOffset;
    
    // PERFORMANCE: Smooth lerp instead of direct assignment
    this._currentScrollForLighting += (this._targetScrollForLighting - this._currentScrollForLighting) * this._lightingLerpSpeed;
    
    const t = Math.max(0, Math.min(1, this._currentScrollForLighting)); // Clamp 0-1
    
    // Interpolate between beginning and end states
    const beginState = this._lightingStates.beginning;
    const endState = this._lightingStates.end;
    
    // AMBIENT LIGHT
    this._ambientLight.intensity = this._lerp(beginState.ambient.intensity, endState.ambient.intensity, t);
    
    // KEY LIGHT
    this._keyLight.intensity = this._lerp(beginState.keyLight.intensity, endState.keyLight.intensity, t);
    this._keyLight.position.x = this._lerp(beginState.keyLight.position.x, endState.keyLight.position.x, t);
    this._keyLight.position.y = this._lerp(beginState.keyLight.position.y, endState.keyLight.position.y, t);
    this._keyLight.position.z = this._lerp(beginState.keyLight.position.z, endState.keyLight.position.z, t);
    this._keyLight.distance = this._lerp(beginState.keyLight.distance, endState.keyLight.distance, t);
    this._keyLight.decay = this._lerp(beginState.keyLight.decay, endState.keyLight.decay, t);
    
    // ATMOSPHERIC MOONLIGHT
    this._moonLight.intensity = this._lerp(beginState.moonLight.intensity, endState.moonLight.intensity, t);
    this._moonLight.position.x = this._lerp(beginState.moonLight.position.x, endState.moonLight.position.x, t);
    this._moonLight.position.y = this._lerp(beginState.moonLight.position.y, endState.moonLight.position.y, t);
    this._moonLight.position.z = this._lerp(beginState.moonLight.position.z, endState.moonLight.position.z, t);
    this._moonLight.distance = this._lerp(beginState.moonLight.distance, endState.moonLight.distance, t);
    this._moonLight.decay = this._lerp(beginState.moonLight.decay, endState.moonLight.decay, t);
    
    // DEBUG: Log lighting transition occasionally
    if (Math.random() < 0.02) { // 2% of the time
      console.log('🔥 LIGHTING TRANSITION:', {
        scrollOffset: scrollOffset.toFixed(3),
        t: t.toFixed(3),
        ambientIntensity: this._ambientLight.intensity.toFixed(3),
        keyIntensity: this._keyLight.intensity.toFixed(0),
        moonIntensity: this._moonLight.intensity.toFixed(0)
      });
    }
  }

  // Helper function for smooth interpolation
  _lerp(start, end, t) {
    return start + (end - start) * t;
  }

  // Method to update beginning lighting state (for next prompt)
  _setBeginningLightingState(ambientIntensity, keyLight, moonLight) {
    this._lightingStates.beginning = {
      ambient: { intensity: ambientIntensity },
      keyLight: keyLight,
      moonLight: moonLight
    };
    
    console.log('🔥 BEGINNING LIGHTING STATE UPDATED:', this._lightingStates.beginning);
  }

  _initScene() {
    const tiles = new Tiles(this._camera, this._scene, this._mainLight, this, {
      frontLight: this._frontLight,
      keyLight: this._keyLight,
      fillLight: this._fillLight
    });
    this._tiles = tiles;
    this._scene.add(tiles);

    // 🔥 CONNECT POST-PROCESSING CONTROLS NOW THAT EVERYTHING IS READY
    console.log('🔥 ATTEMPTING TO CONNECT POST-PROCESSING - CONDITIONS:', {
      tiles: !!this._tiles,
      postprocessing: !!this.postprocessing,
      tilesType: typeof this._tiles,
      postprocessingType: typeof this.postprocessing
    });
    
    if (this._tiles && this.postprocessing) {
      console.log('🔥 CALLING connectPostProcessingControls()');
      this._tiles.connectPostProcessingControls();
    } else {
      console.log('🔥 SKIPPING POST-PROCESSING CONNECTION - CONDITIONS NOT MET');
    }

    // 🔥 CHARACTER STARTS HIDDEN VIA CSS OPACITY - WILL FADE IN WHEN LOADED

    // Add Spline climbing wall (background canvas) - starts hidden, fades in when loaded
    this._climbingWall = new SplineClimbingWall();
    
    // Pass fade manager to Spline wall
    this._climbingWall.setFadeInManager(this.fadeInManager);
    
    // Create shader-based starfield for performance
    this._climbingWall.createShaderStarfield(this._scene);

    // Initialize UI Overlay for text components
    this.uiOverlay = new UIOverlay(this);

    // 🔥 INITIALIZE CASE STUDY INTEGRATION SYSTEM
    this.caseStudyContainer = new CaseStudyContainer();
    this.transitionController = new TransitionController(
      this,
      this._tiles,
      this._climbingWall,
      this.uiOverlay
    );
    
    // Initialize routing and setup case study button
    appState.initializeRouting();
    this.transitionController.setupCaseStudyButton();
    
    // 🔥 MAKE STATE MANAGER AND APP GLOBALLY ACCESSIBLE FOR BACK BUTTON
    window.appState = appState;
    window.app = this;

    // 🔥 NOTIFY FADE MANAGER THAT CHARACTER IS READY (WILL FADE IN)
    setTimeout(() => {
      this.fadeInManager.setLoaded('character');
    }, 1500); // Slightly longer delay for more dramatic effect
  }

  _setDPR() {
    // Performance-optimized DPR settings
    let maxDPR = this._isLowEnd ? 1.0 : 1.5; // Reduced for better performance
    if (this._isMobile) maxDPR = Math.min(maxDPR, 1.25); // Conservative mobile quality
    
    const dpr = MathUtils.clamp(window.devicePixelRatio, 1, maxDPR);
    this._gl.setPixelRatio(dpr);
    
    console.log('🔥 WebGL Performance - DPR:', dpr, 'Max DPR:', maxDPR, 'Device DPR:', window.devicePixelRatio);
  }

  _animate() {
    // 🔥 PERFORMANCE MONITORING REMOVED FOR PRODUCTION
    // const frameStart = performance.now();
    // Enhanced FPS monitoring and adaptive quality - REMOVED
    // this.frameCount++;
    // const now = performance.now();
    // if (now - this.lastFPSCheck >= 1000) { ... } - REMOVED

    const delta = this._clock.getDelta();
    
    // 🔥 SIMPLIFIED FRAME SKIPPING - NO FPS DEPENDENCY
    // Skip expensive updates occasionally for better performance
    this.frameCount = (this.frameCount || 0) + 1;
    const shouldSkipFrame = this.frameCount % 2 === 0; // Simple frame skipping
    
    if (this._tiles && !shouldSkipFrame) {
      this._tiles.update(delta, this.normalizedMouseX, this.normalizedMouseY);
    }

    if (this._climbingWall) {
      this._climbingWall.update(delta);
      // Pass mouse coordinates to Spline for mouse-based animations (throttled)
      if (!shouldSkipFrame) {
        this._climbingWall.updateMouse(this.normalizedMouseX, this.normalizedMouseY);
      }
    }

    // Update lighting transition based on scroll (performance optimized) - DISABLED FOR NOW
    if (false && this._tiles && this._tiles._currentScrollOffset !== undefined && !shouldSkipFrame) {
      this._updateLightingTransition(this._tiles._currentScrollOffset);
    }
    
    // Update UI overlay visibility based on scroll - SEPARATED FROM LIGHTING
    if (this._tiles && this._tiles._currentScrollOffset !== undefined && !shouldSkipFrame) {
      if (this.uiOverlay) {
        this.uiOverlay.update(this._tiles._currentScrollOffset * 100); // Convert to percentage
      }
      
      // 🔥 SCROLL-BASED EFFECTS REMOVED - NO LONGER NEEDED
      
      // 🔥 STORE CURRENT SCROLL POSITION IN STATE FOR PRESERVATION
      this._currentScrollOffset = this._tiles._currentScrollOffset;
    }

    // 🔥 RENDER STATS REMOVED FOR PRODUCTION
    // Collect render stats before rendering - REMOVED
    // this._collectRenderStats();

    // Advanced optimizations - frustum culling and LOD
    const now = performance.now();
    if (this.frustumCulling && now - this.lastCullCheck > this.cullCheckInterval) {
      this._performFrustumCulling();
      this.lastCullCheck = now;
    }

    // Only clear what's necessary
    this._gl.clear(this._gl.DEPTH_BUFFER_BIT | this._gl.COLOR_BUFFER_BIT);

    // Use postprocessing for enhanced effects
    if (this.postprocessing) {
      this.postprocessing.render(delta);
    } else {
      // Fallback to direct rendering
      this._gl.render(this._scene, this._camera);
    }

    // 🔥 STATS REMOVED FOR PRODUCTION
    // if (this.debug) {
    //   this._stats.end();
    // }
    
    // 🔥 FRAME TIME TRACKING REMOVED FOR PRODUCTION
    // Calculate frame time and store in history - REMOVED
    // const frameEnd = performance.now();
    // const frameTime = frameEnd - frameStart;
    // this.frameTimeHistory.push(frameTime);
    // if (this.frameTimeHistory.length > this.maxFrameTimeHistory) {
    //   this.frameTimeHistory.shift();
    // }

    // Camera rotation removed - using drag interaction instead

    this._animationId = window.requestAnimationFrame(this._animate.bind(this));
  }

  // Add cleanup method for proper disposal
  dispose() {
    if (this._animationId) {
      window.cancelAnimationFrame(this._animationId);
    }
    
    // Clean up event listeners
    window.removeEventListener('resize', this._resize.bind(this));
    window.removeEventListener('mousemove', this._onMouseMove.bind(this));
    // Note: keydown event listener cleanup would need to store the bound function reference
    
    // 🔥 PERFORMANCE DISPLAY CLEANUP REMOVED FOR PRODUCTION
    // Clean up performance display - REMOVED
    // if (this.performanceDisplay && this.performanceDisplay.parentNode) { ... }
    
    // Clean up light controls display
    if (this.lightControlsDisplay && this.lightControlsDisplay.parentNode) {
      this.lightControlsDisplay.parentNode.removeChild(this.lightControlsDisplay);
    }
    
    // 🔥 PERFORMANCE SUMMARY REMOVED FOR PRODUCTION
    // Log final performance summary - REMOVED
    // console.log('🔥 Final Performance Summary:', { ... });
    
    // Dispose of WebGL resources
    if (this._gl) {
      this._gl.dispose();
    }
    
    // Dispose of mixers
    if (this._mixer) {
      this._mixer.stopAllAction();
      this._mixer.uncacheRoot(this._mixer.getRoot());
    }
    
    if (this._tiles) {
      this._tiles.dispose();
    }

    if (this._climbingWall) {
      this._climbingWall.dispose();
    }

    if (this.uiOverlay) {
      this.uiOverlay.dispose();
    }
  }

  // 🔥 PERFORMANCE BENCHMARK REMOVED FOR PRODUCTION
  // _runPerformanceBenchmark() { ... } - REMOVED

  _performFrustumCulling() {
    // Create frustum from camera
    const frustum = new Frustum();
    const cameraMatrix = new Matrix4();
    cameraMatrix.multiplyMatrices(this._camera.projectionMatrix, this._camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(cameraMatrix);
    
    let culledCount = 0;
    let visibleCount = 0;
    
    // Traverse scene and cull objects outside frustum
    this._scene.traverse((object) => {
      if (object.isMesh && object.geometry) {
        // Calculate object's world bounding sphere
        if (!object.geometry.boundingSphere) {
          object.geometry.computeBoundingSphere();
        }
        
        const sphere = object.geometry.boundingSphere.clone();
        sphere.applyMatrix4(object.matrixWorld);
        
        // Check if object is in frustum
        const inFrustum = frustum.intersectsSphere(sphere);
        
        if (!inFrustum && object.visible) {
          // Cull object
          object.visible = false;
          this.culledObjects.add(object);
          culledCount++;
        } else if (inFrustum && !object.visible && this.culledObjects.has(object)) {
          // Un-cull object
          object.visible = true;
          this.culledObjects.delete(object);
          visibleCount++;
        } else if (object.visible) {
          visibleCount++;
        }
        
        // Distance-based LOD for performance
        if (this.lodSystem && object.visible) {
          this._applyDistanceLOD(object);
        }
      }
    });
    
    // Log culling stats occasionally
    if (Math.random() < 0.1) {
      if (this.debugMode) {
        console.log('🔥 Frustum Culling:', { 
          culled: culledCount, 
          visible: visibleCount, 
          totalCulled: this.culledObjects.size 
        });
      }
    }
  }

  _applyDistanceLOD(object) {
    // Calculate distance from camera
    const distance = this._camera.position.distanceTo(object.position);
    
    // Apply LOD based on distance
    if (distance > 5000) {
      // Very far - hide completely or use lowest LOD
      if (object.userData.originalVisible === undefined) {
        object.userData.originalVisible = object.visible;
      }
      object.visible = false;
    } else if (distance > 3000) {
      // Far - reduce quality
      if (object.material && object.material.wireframe !== undefined) {
        object.material.wireframe = true; // Wireframe for distant objects
      }
      object.visible = true;
    } else if (distance > 1500) {
      // Medium distance - normal quality but maybe skip some updates
      if (object.material && object.material.wireframe !== undefined) {
        object.material.wireframe = false;
      }
      object.visible = true;
      
      // Skip animation updates for distant objects
      if (object.userData.mixer && this.frameCount % 3 !== 0) {
        // Skip mixer update every 3rd frame for distant objects
        return;
      }
    } else {
      // Close - full quality
      if (object.material && object.material.wireframe !== undefined) {
        object.material.wireframe = false;
      }
      object.visible = true;
    }
  }

  // Drag functionality removed - no longer needed without stencil system

  _initEvents() {
    window.addEventListener('resize', this._resize.bind(this));
    
    // Throttle scroll events to prevent flickering
    let scrollTimeout;
    window.addEventListener('scroll', (event) => {
      if (scrollTimeout) return; // Skip if already processing
      
      scrollTimeout = setTimeout(() => {
        this._tiles.onScroll();
        
        // 🔥 ONLY UPDATE SPLINE WHEN NOT IN CASE STUDY MODE
        if (this._climbingWall && (!window.appState || window.appState.getState().mode !== 'case-study')) {
          const scrollY = window.scrollY;
          const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
          const scrollProgress = scrollY / maxScrollY;
          this._climbingWall.updateScroll(scrollProgress);
        }
        
        scrollTimeout = null;
      }, 8); // 8ms throttle (~120fps max)
    });

    const el = document.querySelector('#canvas_main');
    el.style.touchAction = 'none';
    el.style.pointerEvents = 'none'; // 🔥 FIX: Let clicks pass through to Spline canvas behind

    // Mouse move event for head tracking only - no more distortion texture
    window.addEventListener('mousemove', (ev) => {
      // Direct mouse tracking without throttling for better responsiveness
      this._onMouseMove(ev);
    });

    // Keyboard event for hiding UI controls with 'c' key
    window.addEventListener('keydown', (event) => {
      if (event.key.toLowerCase() === 'c') {
        this._toggleUIControls();
      }
    });

    // Mouse camera panning removed - using drag interaction instead
  }

  _resize() {
    this._gl.setSize(window.innerWidth, window.innerHeight);
    this._setDPR();

    const aspect = window.innerWidth / window.innerHeight;
    this._camera.aspect = aspect;
    this._camera.updateProjectionMatrix();
    
    // Update postprocessing resolution
    if (this.postprocessing) {
      this.postprocessing.handleResize(window.innerWidth, window.innerHeight);
    }
  }

  _onMouseMove(event) {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // Store normalized mouse coordinates for climber head tracking
    this.normalizedMouseX = mouseX;
    this.normalizedMouseY = mouseY;
    
    // Debug logging to verify mouse tracking is working
    if (Math.random() < 0.01) { // Log 1% of the time to avoid spam
      console.log('🔥 Mouse tracking:', { 
        mouseX: mouseX.toFixed(3), 
        mouseY: mouseY.toFixed(3),
        clientX: event.clientX,
        clientY: event.clientY
      });
    }
  }
  
  _toggleUIControls() {
    // Toggle visibility of debug controls ONLY
    const debugElements = [
      this.performanceDisplay,
      this.lightControlsDisplay // LIGHTING CONTROLS ALSO HIDDEN WITH 'c'
    ];
    
    debugElements.forEach(element => {
      if (element) {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
      }
    });
    
    // Toggle animation debug controls from Sliders component
    const animationDebugPanel = document.querySelector('div[style*="position: fixed"][style*="left: 10px"][style*="background: rgba(0, 0, 0, 0.8)"]');
    if (animationDebugPanel) {
      animationDebugPanel.style.display = animationDebugPanel.style.display === 'none' ? 'block' : 'none';
    }
    
    // Main UI components stay visible always
    console.log('🔥 Debug controls toggled - main UI stays visible!');
  }

  // CENTRALIZED SCROLL TIMING SYSTEM - EASY TO CHANGE IN ONE PLACE! 🔥
  _getScrollTimings() {
    return {
      // Main UI Components
      scrollIndicator: { start: 0, end: 8 }, // Visible from start, fade out at 12% (earlier)
      findYourFlow: { start: 10, end: 45 },
      pushTheLimits: { start: 45, end: 70 }, // EARLIER - starts at 50% instead of 65%
      getInTouch: { start: 95, end: 100 }, // LATER - starts at 75%, stays until very end
      bioDescription: { start: 80, end: 100 }, // LATER - same as copyright timing
      // copyright: { start: 95, end: 100 }, // LATER - fades in when Get in Touch comes in - DISABLED FOR NOW
      
      // Global fade behavior: fade in at 95% visible, fade out starting at 5% remaining
      globalFadeInThreshold: 0.7, // Fade in when 95% visible
      globalFadeOutThreshold: 0.2  // Fade out when 5% remaining
    };
  }

  // Drag functionality removed - no longer needed without stencil system
}