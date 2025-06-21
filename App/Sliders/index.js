// 🔥 PREVENT THREE.JS DUPLICATION - Use window.THREE set by main app
// Static imports removed to prevent bundling Three.js twice (once by us, once by Spline)

import { addGLBToTile, addGLBToTileNoAnimation } from './handleGLBModels';
import { CLIMBING_CONFIG } from '../ClimbingConfig';
import { UltraLightCharacterPreview } from '../UltraLightCharacterPreview';
import { performanceMonitor } from '../PerformanceMonitor';

let THREE, GLTFLoader, DRACOLoader, MeshoptDecoder;

// Initialize Three.js components from global instance
async function initThreeComponents() {
  if (!window.THREE) {
    console.error('🚨 window.THREE not available - main app should set this before loading');
    return false;
  }
  
  THREE = window.THREE;
  
  // Load loaders dynamically
  const [gltfModule, dracoModule, meshoptModule] = await Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader'),
    import('three/examples/jsm/loaders/DRACOLoader'),
    import('three/examples/jsm/libs/meshopt_decoder.module.js')
  ]);
  
  GLTFLoader = gltfModule.GLTFLoader;
  DRACOLoader = dracoModule.DRACOLoader;
  MeshoptDecoder = meshoptModule.MeshoptDecoder;
  
  return true;
}

// --- DEBUG MODE FLAG ---
// Set to false for production builds to disable detailed logs, debug UI, and FPS counter
const DEBUG_MODE = true; // 🔥 ENABLE FOR POST-PROCESSING CONTROLS

// TODO: Verify these animation names match the names in your fuckOFFFF.glb file.
// These are placeholders based on previously used indices.
// Use animation indices instead of names for more reliable access
const IDLE_ANIM_INDEX = 3;        // Was 148, now 3 for compressed file
const CLIMBING_ANIM_INDEX = 1;    // Was 5, now 1 for compressed file  
const STANDING_ANIM_INDEX = 2;    // Was 110, now 2 for compressed file
const TURN_AROUND_ANIM_INDEX = 0; // Stays 0
// Note: _turnToWallAction will use TURN_AROUND_ANIM_NAME and clone the clip.
const CROSSFADE_DURATION = 0.25; // seconds for AnimationAction.crossFadeTo

// Material cache to reuse materials and reduce memory for the main character
const characterMaterialCache = new Map();

// Optimized material creation with caching for the main character
async function getOptimizedCharacterMaterial(color, roughness, metalness) {
  if (!THREE) {
    await initThreeComponents();
  }
  
  const key = `${color.isColor ? color.getHexString() : color}_${roughness}_${metalness}`; // Ensure color key is string

  if (!characterMaterialCache.has(key)) {
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: metalness,
      side: THREE.FrontSide // Assuming all character parts are FrontSide
    });
    characterMaterialCache.set(key, material);
    if (DEBUG_MODE) console.log(`🔥 Created cached character material: ${key}`);
  }

  return characterMaterialCache.get(key);
}

// Create the class after Three.js is available
let TilesClass = null;

function createTilesClass() {
  if (!window.THREE) {
    console.error('🚨 window.THREE not available for Tiles');
    return null;
  }
  
  if (!TilesClass) {
    TilesClass = class Tiles extends window.THREE.Group {
      constructor(camera, scene, pointLight, app, lights = {}) {
        super();

    this._camera = camera;
    this._scene = scene;
    this._pointLight = pointLight;
    this._app = app;
    this._lights = lights;
    
    this._initializeVariables();
    this._init();
  }

  _initializeVariables() {
    // Core variables
    this._mixers = [];
    this._width = window.innerWidth;
    this._height = window.innerHeight;
    
    // Climbing character variables
    this._climber = null;
    this._mixer = null;
    this._idleAction = null;
    this._climbingAction = null;
    this._standingAction = null;
    this._turnAroundAction = null;
    this._turnToWallAction = null;
    this._currentAction = null;
    
    // PROFESSIONAL ANIMATION CONTROLLER
    this._animationController = {
      currentState: 'idle',
      targetState: 'idle',
      stateProgress: 0,
      lastUpdateTime: 0,
      frameSkipCounter: 0,
      
      // Animation phases with precise scroll ranges
      phases: {
        idle: { start: 0, end: 0.005, action: null },           // 🔥 0-0.5% 
        turnToWall: { start: 0.005, end: 0.12, action: null },   // 🔥 EXPANDED: 0.5-12% (was 0.5-8%)
        // crossfade phase removed - transition handled by crossFadeTo
        climbing: { start: 0.12, end: 0.65, action: null },   // 🔥 SHORTENED: 12-65% (was 12-75%) - 10% shorter
        standing: { start: 0.65, end: 0.88, action: null },   // 🔥 LENGTHENED: 65-88% (was 75-88%) - 10% longer  
        turnAround: { start: 0.88, end: 1.0, action: null } // 🔥 EXPANDED: 88-100% (was 90-100%)
      },
      
      // Crossfade system object removed
      
      // Performance optimization
      updateThrottle: 16, // ~60fps max
      forceUpdate: false,
      
      // CRITICAL FIX: Initialize lastUpdateTime properly
      lastUpdateTime: 0
    };
    
    // Mouse tracking
    this._mouseX = 0;
    this._mouseY = 0;
    this._headTrackingInitialized = false;
    
    // Blinking system
    this._blinkingEnabled = true;
    this._lastBlinkTime = 0;
    this._nextBlinkDelay = 0;
    this._isBlinking = false;
    this._blinkStartTime = 0;
    this._blinkDuration = 250; // ms (slower blink)
    this._eyeBones = []; // Store eye bone references
    this._faceMeshes = []; // Store face mesh references for morph blinking
    
    // Scroll detection for head tracking
    this._isActivelyScrolling = false;
    this._scrollTimeout = null;
    
    // Scroll and camera
    this._currentScrollOffset = 0;
    this._lastScrollOffset = undefined;
    this._lastScrollDirection = 'DOWN';
    
    // Position compensation for animation transitions
    this._turnAroundHipOffset = null;
    this._hipBone = null;
    this._originalHipPosition = null;
    
    // Standing position adjustment
    this._climbingEndPosition = null;
    this._lastStandingUpdate = null;
    
    // UI System
    this.uiVisible = false;

    // 🔥 FPS COUNTER REMOVED FOR PRODUCTION
    // this._fpsDisplay = null;
    
    // Hover effect system - INSTANT for performance
    this._hoverEffectDiv = null;
    this._isHovering = false;
    this._lastHoverState = false; // Track state changes
    
    // 🔥 HEAD SCALING FOR HOVER EFFECTS
    this._headBone = null;
    this._originalHeadScale = { x: 1, y: 1, z: 1 };
    this._headScaleTarget = { x: 1, y: 1, z: 1 };
    this._headScaleCurrent = { x: 1, y: 1, z: 1 };
    
    // Default and hover effect settings
    this._defaultSettings = {
      // Post-processing
      bloomIntensity: 2.5,
      characterOutlineEnabled: false,
      
      // Materials
      useOriginalTextures: true,
      roughness: 0.95,
      metalness: 0.80,
      emission: 0.04,
      emissionColor: '#000080',
      
      // 🔥 HEAD SCALING
      headScale: 1.3
    };
    
    this._hoverSettings = {
      // Post-processing - ENHANCED on hover
      bloomIntensity: 5.0,        // Your current setting
      characterOutlineEnabled: true,
      
      // Materials - ENHANCED on hover
      useOriginalTextures: false,  // Use custom materials
      roughness: 0.82,            // Your current setting
      metalness: 0.77,            // Your current setting  
      emission: 0.18,             // Your current setting
      emissionColor: '#0000ff',    // Bright blue
      
      // 🔥 HEAD SCALING - 20% bigger head on hover
      headScale: 2.0
    };
    
    // Create post-processing controls immediately
    this._postProcessingPanel = null;
    
    // 🔥 MATERIAL CONTROL SYSTEM
    this._originalMaterials = new Map();
    this._materialControls = {
      useOriginalTextures: true,  // 🔥 Default to original textures
      roughness: 0.95,           // 🔥 Your perfect settings
      metalness: 0.80,           // 🔥 Will be handled per-material
      emission: 0.04,            // 🔥 More subtle glow
      emissionColor: '#000080',  // 🔥 That sick blue glow
      color: '#ffffff'           // 🔥 Keep original colors
    };
    
    // 🔥 PROGRESSIVE LOADING - Character quality levels
    this._characterQuality = 'none'; // none -> preview -> optimized
    this._previewCharacter = null;
  }

  _init() {
    // 🔥 PROGRESSIVE LOADING: Create instant preview first
    this._createInstantPreview();
    
    // Create post-processing controls immediately (before character loads)
    if (DEBUG_MODE) {
      this._createPostProcessingControls();
    }
    
    // Create hover effect div for production (always enabled)
    this._createHoverEffectDiv();
    
    // Load the climbing character (in background)
    setTimeout(async () => await this._loadClimber(), 100); // Small delay for instant preview
    
    // Initialize UI overlay system

    if (DEBUG_MODE) {
      this._createDebugControls(); // Debug UI for animation selection

      // 🔥 FPS DISPLAY REMOVED FOR PRODUCTION
      // FPS Display Element Creation - REMOVED
      // this._fpsDisplay = document.createElement('div');
      // this._fpsDisplay.style.position = 'fixed';
      // this._fpsDisplay.style.top = '10px';
      // this._fpsDisplay.style.right = '10px';
      // this._fpsDisplay.style.color = 'white';
      // this._fpsDisplay.style.background = 'rgba(0,0,0,0.7)';
      // this._fpsDisplay.style.padding = '5px 10px';
      // this._fpsDisplay.style.fontFamily = 'monospace';
      // this._fpsDisplay.style.fontSize = '14px'; // Readable size
      // this._fpsDisplay.style.zIndex = '1002'; // Ensure it's above other UI like debug panel
      // document.body.appendChild(this._fpsDisplay);
    }
    
    // Load standup animation - TEMPORARILY DISABLED
    // this._loadStandupAnimation();
  }



  // 🔥 PROGRESSIVE LOADING METHODS - RESTORED TO WORKING VERSION
  _createInstantPreview() {
    console.log('🔥 Creating ultra-light character preview...');
    
    // Mark start of character preview loading
    performanceMonitor.markCharacterPreviewStart();
    
    // Create the character preview using factory function
    const UltraLightCharacterPreviewClass = UltraLightCharacterPreview();
    if (!UltraLightCharacterPreviewClass) {
      console.error('🚨 Could not create UltraLightCharacterPreview - Three.js not available');
      return;
    }
    
    this._previewCharacter = new UltraLightCharacterPreviewClass();
    this._characterQuality = 'preview';
    
    // Add to scene immediately
    this.add(this._previewCharacter);
    
    // Listen for when the ultra-light character loads
    this._previewCharacter.addEventListener('loaded', () => {
      console.log('✅ Ultra-light character preview ready!');
      
      // Mark character preview loaded
      performanceMonitor.markCharacterPreviewLoaded();
      
      // 🔥 IMMEDIATE FADE-IN: No delays, show as soon as ready
      if (this._app && this._app.fadeInManager) {
        this._app.fadeInManager.setLoaded('character');
      }
    });
    
    console.log('🔥 Ultra-light character preview loading...');
  }

  _upgradeToOptimizedCharacter() {
    console.log('🔥 Upgrading to optimized character...');
    
    if (this._previewCharacter) {
      // Store current animation time for seamless transition
      const currentAnimationTime = this._previewCharacter.getCurrentAnimationTime ? 
        this._previewCharacter.getCurrentAnimationTime() : 0;
      
      console.log(`🎬 Storing animation time for seamless transition: ${currentAnimationTime.toFixed(3)}s`);
      
      // Remove preview character
      this.remove(this._previewCharacter);
      this._previewCharacter.dispose();
      this._previewCharacter = null;
      
      // Set the full character's animation to match the preview
      if (this._idleAction && currentAnimationTime > 0) {
        this._idleAction.time = currentAnimationTime;
        console.log(`🎬 Set full character idle animation time to: ${currentAnimationTime.toFixed(3)}s`);
      }
    }
    
    this._characterQuality = 'optimized';
    console.log('✅ Upgraded to optimized character with seamless animation transition');
  }

  async _loadClimber() {
    // 🔥 SMART LOADING: Use high-quality model for the full character (6MB)
    const climberPath = '/optimized_models/character_clean_4anims_compressed.glb';
    
    // Mark start of full character loading
    performanceMonitor.markCharacterFullStart();
    
    // Initialize Three.js components
    const success = await initThreeComponents();
    if (!success) {
      console.error('🚨 Could not initialize Three.js components for climber');
      return;
    }
    
    // Create GLTF loader directly with DRACO and Meshopt support
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.setMeshoptDecoder(MeshoptDecoder);
    
    gltfLoader.load(
      climberPath, 
      (gltf) => {
        console.log('🔥 GLB loaded successfully:', climberPath);
        
        // Validate GLB structure
        if (!gltf.scene) {
          console.error('❌ GLB file missing scene data');
          return;
        }
        
        if (!gltf.animations || gltf.animations.length === 0) {
          console.error('❌ GLB file missing animation data');
          return;
        }
        
        console.log(`✅ GLB validation passed: ${gltf.animations.length} animations found`);
      this._climber = gltf.scene;
      this._climber.scale.set(20, 20, 20);
      // Set initial position - character will stay here and animations will handle movement
      this._climber.position.set(0, CLIMBING_CONFIG.CAMERA_START_Y - 400, -1400);
      this._climber.rotation.set(0, 0, 0); // Face camera initially
      this._climber.visible = true;
      
      // Set up animation mixer
      this._mixer = new THREE.AnimationMixer(this._climber);
      
      // Store all animations
      this._allAnimations = gltf.animations;

      // --- MATERIAL SYSTEM WITH ORIGINAL TEXTURE SUPPORT ---
      this._climber.traverse((child) => {
        if (child.isMesh && child.material) {
          // Store ACTUAL original material (not a clone - preserve all textures!)
          this._originalMaterials.set(child.uuid, child.material);
          
          // Store texture info for debugging (only log once on load)
          if (DEBUG_MODE && !this._texturesLogged) {
            console.log(`🔥 Original material for ${child.name}:`, {
              map: child.material.map ? 'HAS DIFFUSE TEXTURE' : 'NO DIFFUSE',
              normalMap: child.material.normalMap ? 'HAS NORMAL MAP' : 'NO NORMAL',
              roughnessMap: child.material.roughnessMap ? 'HAS ROUGHNESS MAP' : 'NO ROUGHNESS',
              metalnessMap: child.material.metalnessMap ? 'HAS METALNESS MAP' : 'NO METALNESS',
              emissiveMap: child.material.emissiveMap ? 'HAS EMISSIVE MAP' : 'NO EMISSIVE',
              aoMap: child.material.aoMap ? 'HAS AO MAP' : 'NO AO',
              color: child.material.color.getHexString(),
              roughness: child.material.roughness,
              metalness: child.material.metalness
            });
          }
          
          // Apply current material settings (start with optimized)
          this._updateMeshMaterial(child);
        }
      });
      
              // Mark textures as logged to prevent spam
        this._texturesLogged = true;
        
        // Create material control UI only in debug mode
        if (DEBUG_MODE) {
          this._createMaterialControls();
          console.log('🔥 Climber materials initialized with emission 0.04!');
        }
      // --- End Material System ---
      
      // Set up our four main animations - UPDATED ASSIGNMENTS (with safety checks)
      if (DEBUG_MODE) console.log('🔥 Total animations found:', this._allAnimations.length);

      // Load animations by index (more reliable than names)
      const idleClip = this._allAnimations[IDLE_ANIM_INDEX];
      if (idleClip) {
        this._idleAction = this._mixer.clipAction(idleClip);
      } else {
        console.error(`🔥 Animation at index ${IDLE_ANIM_INDEX} (expected for idle) not found! Check constants and GLB file.`);
      }
      
      const climbingClip = this._allAnimations[CLIMBING_ANIM_INDEX];
      if (climbingClip) {
        this._climbingAction = this._mixer.clipAction(climbingClip);
      } else {
        console.error(`🔥 Animation at index ${CLIMBING_ANIM_INDEX} (expected for climbing) not found! Check constants and GLB file.`);
      }
      
      const standingClip = this._allAnimations[STANDING_ANIM_INDEX];
      if (standingClip) {
        this._standingAction = this._mixer.clipAction(standingClip);
      } else {
        console.error(`🔥 Animation at index ${STANDING_ANIM_INDEX} (expected for standing) not found! Check constants and GLB file.`);
      }
      
      const turnAroundClip = this._allAnimations[TURN_AROUND_ANIM_INDEX];
      if (turnAroundClip) {
        this._turnAroundAction = this._mixer.clipAction(turnAroundClip);
        // For _turnToWallAction, clone the found clip
        this._turnToWallAction = this._mixer.clipAction(turnAroundClip.clone());
        if (DEBUG_MODE) console.log(`🔥 Using animation at index ${TURN_AROUND_ANIM_INDEX} for turn-around and turn-to-wall (turn-to-wall is a clone).`);
      } else {
        console.error(`🔥 Animation at index ${TURN_AROUND_ANIM_INDEX} (expected for turn-around/turn-to-wall) not found! Check constants and GLB file.`);
      }
      
      // Configure animations (only if they exist)
      if (this._idleAction) {
        this._idleAction.setLoop(THREE.LoopRepeat, Infinity);
        this._idleAction.timeScale = 0.5; // Slower idle animation
      }
      
      if (this._climbingAction) {
        this._climbingAction.setLoop(THREE.LoopRepeat, Infinity);
        this._climbingAction.timeScale = 1.0;
        // Paused state for climbing will be handled in _transitionToState or _updateCurrentAnimation
      }
      
      if (this._standingAction) {
        this._standingAction.setLoop(THREE.LoopOnce, 1);
        this._standingAction.clampWhenFinished = true;
        this._standingAction.timeScale = 1.0;
      }
      
      if (this._turnAroundAction) {
        this._turnAroundAction.setLoop(THREE.LoopOnce, 1);
        this._turnAroundAction.clampWhenFinished = true;
        this._turnAroundAction.timeScale = 1.0;
      }
      
      if (this._turnToWallAction) {
        this._turnToWallAction.setLoop(THREE.LoopOnce, 1);
        this._turnToWallAction.clampWhenFinished = true;
        this._turnToWallAction.timeScale = 1.0;
      }
      
      // Start with idle at normal speed (only if idle action exists)
      if (this._idleAction) {
        this._currentAction = this._idleAction;
        this._currentAction.play();
        this._animationController.currentState = 'idle'; // Set initial state to idle
        
                         // CRITICAL: Store idle action in animation controller phases
        this._animationController.phases.idle.action = this._idleAction;
        
        // CRITICAL FIX: Initialize animation controller timing properly
        this._animationController.lastUpdateTime = performance.now();
        
        if (DEBUG_MODE) {
          console.log('🔥 IDLE ACTION STORED IN CONTROLLER PHASES');
          console.log('🔥 INITIAL SCROLL OFFSET:', this._currentScrollOffset);
          console.log('🔥 ANIMATION CONTROLLER TIMING INITIALIZED:', this._animationController.lastUpdateTime);
        }
      } else {
        console.error('🔥 No idle action available - using first animation as fallback');
        if (this._allAnimations.length > 0) {
          this._currentAction = this._mixer.clipAction(this._allAnimations[0]);
          this._currentAction.play();
          this._animationController.currentState = 'idle';
        }
      }
      
      // Initialize head tracking after character loads
      this._initializeHeadTracking();
      
      // CRITICAL: Set initial camera and character position at 0% scroll
      this._moveCameraWithScroll(0);
      
      // Add debug controls to find correct animations
      // this._createDebugControls(); // Removed: Called conditionally in _init()
      
      // Initialize keyboard events
      this._initEvents();
      
      // DEBUG: Log initial setup with more details
      if (DEBUG_MODE) console.log('🔥 Climber loaded - Initial idle setup:', {
        state: this._animationController.currentState,
        currentAction: this._currentAction?.getClip().name,
        paused: this._currentAction?.paused,
        timeScale: this._currentAction?.timeScale,
        weight: this._currentAction?.weight,
        enabled: this._currentAction?.enabled,
        isRunning: this._currentAction?.isRunning(),
        time: this._currentAction?.time
      });
      
      // FORCE DEBUG: Test the idle action immediately
      if (DEBUG_MODE) {
        setTimeout(() => {
          if (DEBUG_MODE) console.log('🔥 IDLE ACTION TEST (after 1 second):', {
            idleExists: !!this._idleAction,
            currentAction: this._currentAction?.getClip().name,
            isRunning: this._currentAction?.isRunning(),
            paused: this._currentAction?.paused,
            weight: this._currentAction?.weight,
            time: this._currentAction?.time,
            mixerExists: !!this._mixer
          });

                  // Force mixer update to see if that helps
          if (this._mixer) {
            this._mixer.update(0.016); // Force one frame update
            if (DEBUG_MODE) console.log('🔥 FORCED MIXER UPDATE - Time after update:', this._currentAction?.time);
          }

          // FORCE IDLE RESTART - Nuclear option
          if (this._idleAction) {
            if (DEBUG_MODE) console.log('🔥 FORCING IDLE RESTART...');
            this._idleAction.stop();
            this._idleAction.reset();
            this._idleAction.weight = 1.0;
            this._idleAction.enabled = true;
            this._idleAction.paused = false;
            this._idleAction.play();
            this._currentAction = this._idleAction;

            // Force mixer update after restart
            this._mixer.update(0.016);

            if (DEBUG_MODE) console.log('🔥 IDLE FORCED RESTART COMPLETE:', {
              isRunning: this._idleAction.isRunning(),
              paused: this._idleAction.paused,
              weight: this._idleAction.weight,
              time: this._idleAction.time
            });
          }
        }, 1000);
      }
      
      // DEBUG: Log all available animations
      if (DEBUG_MODE) console.log('🔥 Available animations:', this._allAnimations.map((anim, index) => ({
        index,
        name: anim.name,
        duration: anim.duration.toFixed(2)
      })));
      
      // DEBUG: Log which animations we're actually using
      if (DEBUG_MODE) console.log('🔥 ANIMATION ASSIGNMENTS:', {
        idle: this._idleAction ? `(Index ${IDLE_ANIM_INDEX}) ${this._idleAction.getClip().name}` : `MISSING (Index ${IDLE_ANIM_INDEX})`,
        climbing: this._climbingAction ? `(Index ${CLIMBING_ANIM_INDEX}) ${this._climbingAction.getClip().name}` : `MISSING (Index ${CLIMBING_ANIM_INDEX})`,
        standing: this._standingAction ? `(Index ${STANDING_ANIM_INDEX}) ${this._standingAction.getClip().name}` : `MISSING (Index ${STANDING_ANIM_INDEX})`,
        turnAround: this._turnAroundAction ? `(Index ${TURN_AROUND_ANIM_INDEX}) ${this._turnAroundAction.getClip().name}` : `MISSING (Index ${TURN_AROUND_ANIM_INDEX})`,
        turnToWall: this._turnToWallAction ? `(Clone of Index ${TURN_AROUND_ANIM_INDEX}) ${this._turnToWallAction.getClip().name}` : `MISSING (Clone of Index ${TURN_AROUND_ANIM_INDEX})`
      });
      
      // 🔥 PROGRESSIVE LOADING: Add climber first, then upgrade
      this.add(this._climber);
      
      // Mark full character loaded
      performanceMonitor.markCharacterFullLoaded();
      
      // 🔥 CACHE HEAD BONE FOR SCALING EFFECTS
      this._cacheHeadBoneReference();
      
      // 🔥 SMOOTH HEAD SCALE FADE-IN EFFECT
      this._startHeadScaleFadeIn();
      
      // 🔥 UPGRADE FROM PROCEDURAL TO FULL CHARACTER
      this._upgradeToOptimizedCharacter();
    },
    // Progress callback
    (progress) => {
      // This log is frequent, consider reducing frequency even in DEBUG_MODE if too noisy
      if (DEBUG_MODE && progress.total > 0) console.log('🔥 Loading progress:', (progress.loaded / progress.total * 100).toFixed(1) + '%');
    },
    // Error callback
    (error) => {
      console.error('❌ Failed to load climber GLB:', climberPath);
      console.error('❌ Error details:', error);
      console.error('❌ Possible causes:');
      console.error('   - GLB file is corrupted or has invalid typed array data');
      console.error('   - File not found or network error');
      console.error('   - DRACO decoder not loaded properly');
      console.error('   - GLB contains unsupported features');
      
      // Fallback: Keep using the procedural preview
      console.log('🔥 Falling back to procedural character preview');
    });
  }

  _createDebugControls() {
    // Create debug panel
    const debugPanel = document.createElement('div');
    debugPanel.style.position = 'fixed';
    debugPanel.style.top = '10px';
    debugPanel.style.left = '10px';
    debugPanel.style.background = 'rgba(0,0,0,0.8)';
    debugPanel.style.color = 'white';
    debugPanel.style.padding = '10px';
    debugPanel.style.zIndex = '1000';
    debugPanel.style.fontFamily = 'monospace';
    debugPanel.style.display = this.uiVisible ? 'block' : 'none'; // Hidden by default
    
    // Animation selector
    const animSelect = document.createElement('select');
    animSelect.style.marginBottom = '10px';
    animSelect.style.width = '200px';

    if (this._allAnimations && this._allAnimations.length > 0) {
    this._allAnimations.forEach((anim, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.text = `Animation ${index}: ${anim.name}`;
      animSelect.appendChild(option);
    });
    } else {
      const option = document.createElement('option');
      option.value = 0;
      option.text = 'No animations loaded';
      animSelect.appendChild(option);
    }
    
    animSelect.onchange = (e) => {
      this._loadAnimation(parseInt(e.target.value));
    };
    
    // Play/Pause button
    const playPauseBtn = document.createElement('button');
    playPauseBtn.textContent = 'Play/Pause';
    playPauseBtn.style.marginRight = '10px';
    playPauseBtn.onclick = () => {
      if (this._currentAction) {
        if (this._currentAction.paused) {
          this._currentAction.paused = false;
        } else {
          this._currentAction.paused = true;
  }
      }
    };
    
    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';
    resetBtn.onclick = () => {
      if (this._currentAction) {
        this._currentAction.reset();
        this._currentAction.time = 0;
        this._mixer.update(0);
      }
    };
    
    // Frame slider
    const frameSlider = document.createElement('input');
    frameSlider.type = 'range';
    frameSlider.min = '0';
    frameSlider.max = '100';
    frameSlider.value = '0';
    frameSlider.style.width = '200px';
    frameSlider.style.marginTop = '10px';
    
    frameSlider.oninput = (e) => {
      if (this._currentAction) {
        const progress = e.target.value / 100;
        this._currentAction.time = this._currentAction.getClip().duration * progress;
        this._mixer.update(0);
        }
    };
    
    // Add controls to panel
    debugPanel.appendChild(animSelect);
    debugPanel.appendChild(playPauseBtn);
    debugPanel.appendChild(resetBtn);
    debugPanel.appendChild(document.createElement('br'));
    debugPanel.appendChild(frameSlider);
    
    document.body.appendChild(debugPanel);
    
    // Store reference for UI toggle
    this._debugPanel = debugPanel;
  }

  _loadAnimation(index) {
    if (this._currentAction) {
      this._currentAction.stop();
    }
    
    const animation = this._allAnimations[index];
    if (animation) {
      if (DEBUG_MODE) console.log('🔥 Loading animation (debug UI):', {
        index,
        name: animation.name,
        duration: animation.duration,
        frameCount: Math.floor(animation.duration * 30)
      });
      
      this._currentAction = this._mixer.clipAction(animation);
      this._currentAction.setLoop(2, Infinity);
      this._currentAction.clampWhenFinished = true;
      this._currentAction.play();
      this._currentAction.paused = true;
      
      // Update frame slider max value
      const frameSlider = document.querySelector('input[type="range"]');
      if (frameSlider) {
        frameSlider.max = Math.floor(animation.duration * 30);
      }
    }
  }

  _initializeHeadTracking() {
    if (this._climber && !this._headTrackingInitialized) {
      this._headTrackingInitialized = true;
      this._animationController.currentState = 'idle'; // Start in idle state for immediate head tracking
      this._animationController.lastUpdateTime = Date.now();
      
      // Capture initial bone rotations
      this._climber.traverse((child) => {
        if (child.isBone || child.type === 'Bone') {
          child.userData.currentAnimationRotation = child.rotation.clone();
        }
      });
      
      // Initialize blinking system
      this._cacheEyeBones();
      this._scheduleNextBlink();
      if (DEBUG_MODE) console.log('🔥 Head tracking initialized with blinking system.');
    }
  }
  
  _cacheEyeBones() {
    if (!this._climber) return;
    
    this._eyeBones = [];
    this._faceMeshes = []; // For morph target blinking
    
    this._climber.traverse((child) => {
      // Look for eye bones
      if ((child.isBone || child.type === 'Bone')) {
        const boneName = child.name.toLowerCase();
        if (boneName.includes('eye') || 
            boneName.includes('eyelid') || 
            boneName.includes('blink') ||
            boneName.includes('lid')) {
          this._eyeBones.push(child);
          if (DEBUG_MODE) console.log('🔥 Found eye bone:', child.name);
        }
      }
      
      // Look for face meshes with morph targets (for blinking via morphs)
      if (child.isMesh && child.morphTargetInfluences) {
        const meshName = child.name.toLowerCase();
        if (meshName.includes('face') || 
            meshName.includes('head') || 
            meshName.includes('eye') ||
            child.morphTargetDictionary) {
          this._faceMeshes.push(child);
          if (DEBUG_MODE) console.log('🔥 Found face mesh with morphs:', child.name, 'Morph count:', child.morphTargetInfluences.length);
          
          // Log available morph targets
          if (DEBUG_MODE && child.morphTargetDictionary) {
            Object.keys(child.morphTargetDictionary).forEach(morphName => {
              if (morphName.toLowerCase().includes('blink') || 
                  morphName.toLowerCase().includes('eye') ||
                  morphName.toLowerCase().includes('close')) {
                if (DEBUG_MODE) console.log('🔥 Found blink morph:', morphName, 'at index:', child.morphTargetDictionary[morphName]);
              }
            });
          }
        }
      }
    });
    
    if (DEBUG_MODE) {
      if (DEBUG_MODE) console.log('🔥 Total eye bones found:', this._eyeBones.length);
      if (DEBUG_MODE) console.log('🔥 Total face meshes found:', this._faceMeshes.length);
    }
  }
  
  _scheduleNextBlink() {
    // Random blink interval between 1-3 seconds (more frequent)
    this._nextBlinkDelay = 1000 + Math.random() * 2000;
    this._lastBlinkTime = Date.now();
  }
  
  _updateBlinking() {
    if (!this._blinkingEnabled || (this._eyeBones.length === 0 && this._faceMeshes.length === 0)) return;
    
    const now = Date.now();
    
    // Check if it's time for a new blink
    if (!this._isBlinking && (now - this._lastBlinkTime) > this._nextBlinkDelay) {
      this._startBlink();
    }
    
    // Handle ongoing blink
    if (this._isBlinking) {
      const blinkProgress = (now - this._blinkStartTime) / this._blinkDuration;
      
      if (blinkProgress >= 1.0) {
        // Blink finished
        this._endBlink();
    } else {
        // Apply blink animation (close eyes)
        const blinkAmount = Math.sin(blinkProgress * Math.PI); // Smooth in/out
        this._applyBlinkToEyes(blinkAmount);
      }
    }
  }
  
  _startBlink() {
    this._isBlinking = true;
    this._blinkStartTime = Date.now();
    
    // Debug log occasionally
    if (DEBUG_MODE && Math.random() < 0.1) {
      if (DEBUG_MODE) console.log('🔥 Character blink started');
    }
  }
  
  _endBlink() {
    this._isBlinking = false;
    this._applyBlinkToEyes(0); // Open eyes fully
    this._scheduleNextBlink(); // Schedule next blink
  }
  
  _applyBlinkToEyes(blinkAmount) {
    // Method 1: Apply blink to eye bones
    this._eyeBones.forEach(eyeBone => {
      if (!eyeBone.userData.originalRotation) {
        eyeBone.userData.originalRotation = eyeBone.rotation.clone();
      }
      
      const baseRotation = eyeBone.userData.originalRotation;
      // Rotate eye bones to simulate closing (adjust rotation axis as needed)
      eyeBone.rotation.x = baseRotation.x + (blinkAmount * 0.5); // Close eyes by rotating X
    });
    
    // Method 2: Apply blink via morph targets
    this._faceMeshes.forEach(faceMesh => {
      if (faceMesh.morphTargetDictionary && faceMesh.morphTargetInfluences) {
        // Look for blink-related morph targets
        Object.keys(faceMesh.morphTargetDictionary).forEach(morphName => {
          const morphIndex = faceMesh.morphTargetDictionary[morphName];
          const lowerMorphName = morphName.toLowerCase();
          
          if (lowerMorphName.includes('blink') || 
              lowerMorphName.includes('eyeclose') ||
              lowerMorphName.includes('eye_close') ||
              (lowerMorphName.includes('eye') && lowerMorphName.includes('close'))) {
            // Apply blink amount to this morph target
            faceMesh.morphTargetInfluences[morphIndex] = blinkAmount;
          }
        });
      }
    });
  }

  // CLEANED UP: Simple linear camera movement from 0% to 100% scroll
  _moveCameraWithScroll(scrollOffset) {
    // Linear camera movement from start to end position
    const startY = CLIMBING_CONFIG.CAMERA_START_Y + 300; // -1700
    const endY = CLIMBING_CONFIG.CAMERA_END_Y + 300;     // 800
    
    // Simple linear interpolation based on scroll
    const targetY = MathUtils.lerp(startY, endY, scrollOffset);
    
    // Set camera position - ONLY place camera position is set!
    this._camera.position.y = targetY;
    this._camera.position.x = -550; // More to the left for better cinematic view
    this._camera.position.z = -300; // Fixed depth
    this._camera.rotation.set(-0.3, 0, 0); // Fixed downward tilt
    
    // CRITICAL: Character must move WITH camera during climbing phases
    // But NOT during standing phase where position is manually controlled
      if (this._climber) {
      const currentState = this._animationController.currentState;
      
      // 🔧 FIX: During standing, only set base position if we haven't cached the climbing end position yet
      if (currentState === 'standing') {
        // During standing, only set initial base position, then let _applyStandingPositionAdjustment handle all updates
        if (!this._climbingEndPosition) {
          // Only set base position once at the start of standing phase
          this._climber.position.y = targetY - 700; // 700 units below camera
          this._climber.position.x = 0; // Always centered
          this._climber.position.z = MathUtils.lerp(-1400, -1800, scrollOffset);
        }
        // Scale stays consistent
        this._climber.scale.set(20, 20, 20);
        // Don't return early - let _applyStandingPositionAdjustment handle position updates
      } else {
        // For all other phases, character follows camera movement with offset
      this._climber.position.y = targetY - 700; // 700 units below camera
        this._climber.position.x = 0; // Always centered
        
        // Gradually move character closer as they climb (bigger appearance)
        const startZ = -1400; // Further away at start
      const endZ = -1800;   // Closer at end (bigger)
      this._climber.position.z = MathUtils.lerp(startZ, endZ, scrollOffset);
      
      // Scale stays consistent
      this._climber.scale.set(20, 20, 20);
      }
    }
    
    this._camera.updateProjectionMatrix();
  }

  onScroll() {
    // Throttle scroll updates to prevent flickering
    const now = Date.now();
    if (this._animationController.lastUpdateTime && now - this._animationController.lastUpdateTime < this._animationController.updateThrottle && !this._animationController.forceUpdate) { // ~60fps max
      return;
    }
    this._animationController.lastUpdateTime = now;
    this._animationController.forceUpdate = false;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollOffset = Math.min(scrollTop / scrollHeight, 1);
    
    this._currentScrollOffset = scrollOffset;
    this._lastScrollTime = Date.now();
    
    // Detect active scrolling for head tracking
    this._isActivelyScrolling = true;
    if (this._scrollTimeout) {
      clearTimeout(this._scrollTimeout);
    }
    this._scrollTimeout = setTimeout(() => {
      this._isActivelyScrolling = false;
    }, 150); // Stop head tracking 150ms after scroll stops
    
    // Animation handling is now done in the centralized controller in update() method
    // No need for phase handling here anymore
    
    // Move camera based on scroll
    this._moveCameraWithScroll(scrollOffset);
    
    // Update UI overlay based on scroll

  }

  // REMOVED: _handleClimbingPhase - replaced by centralized animation controller

  // SIMPLIFIED: Just check if we're already in the state
  _canChangeState(newState) {
    return newState !== this._animationController.currentState; // Only prevent if already in this state
  }

  // REMOVED: No more state change throttling
  _markStateChange() {
    // No longer needed - removed throttling
  }

  // REMOVED: _switchToClimbing - replaced by centralized animation controller

  _switchToStanding() {
    if (!this._canChangeState('standing')) return;
    
    if (DEBUG_MODE) console.log('🔥 Switching to standing - SIMPLE');
    
    // Reset captured positions when switching to standing (so they can be recaptured)
    this._standingEndHipPosition = null;
    this._standingEndCharacterPosition = null;
    this._standingEndPosition = null; // Clear stored position for fresh calculation
    this._standingStartHipPosition = null; // Clear start position for fresh calculation
    this._standingStartCharacterPosition = null;
    
    this._animationController.currentState = 'standing';
    this._isIdle = false;
    this._markStateChange();
    
    // Stop current action completely
    if (this._currentAction) {
      this._currentAction.stop();
      this._currentAction.weight = 0;
    }
    
    // Start standing action fresh - PAUSED for scroll control
    this._standingAction.reset();
    this._standingAction.weight = 1.0;
    this._standingAction.play();
    this._standingAction.paused = true; // CRITICAL: Paused for manual control
    this._standingAction.time = 0;
    
    this._currentAction = this._standingAction;
  }

  _switchToIdle() {
    if (!this._canChangeState('idle')) return;
    
    if (DEBUG_MODE) console.log('🔥 Switching to idle - SIMPLE');
    this._animationController.currentState = 'idle';
    this._isIdle = true;
    this._isScrolling = false;
    this._markStateChange();
    
    // Stop current action completely
    if (this._currentAction) {
      this._currentAction.stop();
      this._currentAction.weight = 0;
    }
    
    // Start idle action fresh
    this._idleAction.reset();
    this._idleAction.weight = 1.0;
    this._idleAction.play();
    this._idleAction.paused = false;
    this._idleAction.timeScale = 0.5; // Slower idle animation
    
    this._currentAction = this._idleAction;
    
    // DEBUG: Log idle animation details
    if (DEBUG_MODE) console.log('🔥 Idle animation started:', {
      name: this._idleAction.getClip().name,
      duration: this._idleAction.getClip().duration,
      paused: this._idleAction.paused,
      timeScale: this._idleAction.timeScale,
      time: this._idleAction.time
    });
  }

  _switchToTurnToWall() {
    if (!this._canChangeState('turnToWall')) return;
    
    if (DEBUG_MODE) console.log('🔥 Switching to turn to wall - RESTORED');
    
    // Old _setupCrossfade() call removed, it's handled by _transitionToState now.
    
    this._animationController.currentState = 'turnToWall';
    this._isIdle = false;
    this._markStateChange();
    
    // Stop current action completely
    if (this._currentAction) {
      if (DEBUG_MODE) console.log('🔥 TURN-TO-WALL: Stopping current action:', this._currentAction.getClip().name);
      this._currentAction.stop();
      this._currentAction.weight = 0;
    }
    
    // DEBUG: Check if turn-to-wall action exists
    if (!this._turnToWallAction) {
      console.error('🔥 TURN-TO-WALL: No turn-to-wall action available!');
      return;
    }
    
    // Start turn-to-wall action fresh - PAUSED for scroll control
    if (DEBUG_MODE) console.log('🔥 TURN-TO-WALL: Starting action:', this._turnToWallAction.getClip().name);
    this._turnToWallAction.reset();
    this._turnToWallAction.weight = 1.0;
    this._turnToWallAction.play();
    this._turnToWallAction.paused = true; // CRITICAL: Paused for manual control
    this._turnToWallAction.time = 0;
    
    this._currentAction = this._turnToWallAction;
    
    // DEBUG: Log turn to wall animation details
    if (DEBUG_MODE) console.log('🔥 Turn to wall animation started:', {
      name: this._turnToWallAction.getClip().name,
      duration: this._turnToWallAction.getClip().duration,
      paused: this._turnToWallAction.paused,
      timeScale: this._turnToWallAction.timeScale,
      time: this._turnToWallAction.time,
      weight: this._turnToWallAction.weight
    });
  }

  _switchToTurnAround() {
    if (!this._canChangeState('turnAround')) return;
    
    if (DEBUG_MODE) console.log('🔥 Switching to turn around - SIMPLE');
    
    // Hip position will be captured at the end of standing animation (95% scroll)
    // and used for correction during turn-around
    
    this._animationController.currentState = 'turnAround';
    this._isIdle = false;
    this._markStateChange();
    
    // Stop current action completely
    if (this._currentAction) {
      if (DEBUG_MODE) console.log('🔥 TURN-AROUND: Stopping current action:', this._currentAction.getClip().name);
      this._currentAction.stop();
      this._currentAction.weight = 0;
    }
    
    // DEBUG: Check if turn-around action exists
    if (!this._turnAroundAction) {
      console.error('🔥 TURN-AROUND: No turn-around action available!');
      return;
    }
    
    // Start turn around action fresh - PAUSED for scroll control
    if (DEBUG_MODE) console.log('🔥 TURN-AROUND: Starting action:', this._turnAroundAction.getClip().name);
    this._turnAroundAction.reset();
    this._turnAroundAction.weight = 1.0;
    this._turnAroundAction.play();
    this._turnAroundAction.paused = true; // CRITICAL: Paused for manual control
    this._turnAroundAction.time = 0;
    
    // Set initial rotation to face away (180°) - animation will turn character to face camera
    if (this._climber) {
      this._climber.rotation.y = Math.PI; // Start facing away (180°)
      if (DEBUG_MODE) console.log('🔥 TURN-AROUND: Set initial rotation to 180° (facing away)');
    }
    
    this._currentAction = this._turnAroundAction;
    
    // Check hip position after switching and store the target position
    if (DEBUG_MODE && this._hipBone && this._originalHipPosition) { // Already wrapped in DEBUG_MODE
      const newHipPosition = this._hipBone.position.clone();
      const hipPositionDiff = newHipPosition.clone().sub(this._originalHipPosition);
              if (DEBUG_MODE) console.log('🔥 Hip position after turn around:', newHipPosition);
        if (DEBUG_MODE) console.log('🔥 Hip position difference (turn - standing):', hipPositionDiff);
      
      // Store the offset for compensation
      this._turnAroundHipOffset = hipPositionDiff.clone();
      
              if (DEBUG_MODE) console.log('🔥 Will maintain hip at position:', this._originalHipPosition);
    }
    
    // DEBUG: Log turn around animation details
    if (DEBUG_MODE) console.log('🔥 Turn around animation started:', { // This outer one was already conditional
      name: this._turnAroundAction.getClip().name,
      duration: this._turnAroundAction.getClip().duration,
      paused: this._turnAroundAction.paused,
      timeScale: this._turnAroundAction.timeScale,
      time: this._turnAroundAction.time,
      weight: this._turnAroundAction.weight
    });
    
    // DEBUG: Check for T-pose after a short delay
    setTimeout(() => {
      this._checkForTPose();
    }, 100);
  }

  // NEW: Optimized hip bone caching method
  _cacheHipBoneReference() {
    if (!this._climber) return;
    
    // Find the hip bone in the skeleton
    this._climber.traverse((child) => {
      if (child.isSkinnedMesh && child.skeleton) {
        const bones = child.skeleton.bones;
        
        // Look for hip bone (common names: "Hips", "Hip", "pelvis", "Pelvis")
        this._hipBone = bones.find(bone => 
          bone.name.toLowerCase().includes('hip') || 
          bone.name.toLowerCase().includes('pelvis')
        );
        
        if (this._hipBone) {
          this._originalHipPosition = this._hipBone.position.clone();
          console.log('🔥 Hip bone cached:', this._hipBone.name);
          return;
        }
      }
    });
    
    if (!this._hipBone) {
      console.warn('⚠️ Hip bone not found in character skeleton');
    }
  }

  // 🔥 CACHE HEAD BONE FOR SCALING EFFECTS
  _cacheHeadBoneReference() {
    if (!this._climber) return;
    
    // Find the head bone in the skeleton
    this._climber.traverse((child) => {
      if (child.isSkinnedMesh && child.skeleton) {
        const bones = child.skeleton.bones;
        
        // Look for head bone (common names: "Head", "head", "Head_End", "mixamorig:Head")
        this._headBone = bones.find(bone => 
          bone.name.toLowerCase().includes('head') && 
          !bone.name.toLowerCase().includes('end') // Avoid head end bones
        );
        
        if (this._headBone) {
          // Store original scale
          this._originalHeadScale = {
            x: this._headBone.scale.x,
            y: this._headBone.scale.y,
            z: this._headBone.scale.z
          };
          
          // 🔥 DON'T APPLY SCALE HERE - let fade-in handle it
          // Initialize current and target scale values properly
          this._headScaleCurrent = { ...this._originalHeadScale };
          this._headScaleTarget = { ...this._originalHeadScale };
          
          console.log('🔥 Head bone cached for scaling:', this._headBone.name);
          console.log('🔥 Original head scale:', this._originalHeadScale);
          return;
        }
      }
    });
    
    if (!this._headBone) {
      console.warn('⚠️ Head bone not found in character skeleton');
      // List all available bones for debugging
      this._climber.traverse((child) => {
        if (child.isSkinnedMesh && child.skeleton) {
          const boneNames = child.skeleton.bones.map(bone => bone.name);
          console.log('🔍 Available bones:', boneNames);
        }
      });
    }
  }

  // REMOVED: _handlePortfolioCamera - camera now moves linearly, character positioning handled by animations

  update(deltaTime, mouseX, mouseY) {
    // 🔥 PROGRESSIVE LOADING: Update preview character if active
    if (this._characterQuality === 'preview' && this._previewCharacter) {
      this._previewCharacter.update(deltaTime);
      return; // Don't run full update logic for preview
    }
    
    // 🔥 FPS DISPLAY UPDATE REMOVED FOR PRODUCTION
    // if (DEBUG_MODE && this._fpsDisplay && deltaTime > 0) {
    //   const fps = 1.0 / deltaTime;
    //   this._fpsDisplay.textContent = `FPS: ${fps.toFixed(1)}`;
    // }

    // Update hover effects
    this._updateHoverEffects(deltaTime);

    // 🔥 UPDATE HEAD SCALING ANIMATION
    this._updateHeadScaling(deltaTime);

    // 🔥 UPDATE HOVER DIV POSITION BASED ON SCROLL
    this._updateHoverDivPosition(this._currentScrollOffset);

    // Performance optimization - skip updates if FPS is too low
    // Performance optimization - skip updates if FPS is too low
    this._frameCount = (this._frameCount || 0) + 1;
    const shouldSkipFrame = this._frameCount % 2 === 0 && deltaTime > 0.033; // Skip every other frame if running below 30fps

    // Update mouse position for head tracking (throttled)
    if (!shouldSkipFrame) {
      this.updateMousePosition(mouseX, mouseY);
    }

    // PROFESSIONAL ANIMATION CONTROLLER - SINGLE UPDATE POINT
    if (!shouldSkipFrame) {
      // DEBUG: Confirm animation controller is being called
      if (DEBUG_MODE && Math.random() < 0.02) {
        console.log('🔥 CALLING ANIMATION CONTROLLER:', {
          shouldSkipFrame,
          deltaTime: deltaTime.toFixed(4),
          scrollOffset: this._currentScrollOffset.toFixed(3)
        });
      }
      this._updateAnimationController(this._currentScrollOffset, deltaTime);
    } else {
      // DEBUG: Log when frames are skipped
      if (DEBUG_MODE && Math.random() < 0.01) {
        if (DEBUG_MODE) console.log('🔥 FRAME SKIPPED - Animation controller not called');
      }
    }

    // Apply hip position compensation for turn-around animation
    if (!shouldSkipFrame) {
      this._applyHipCompensation();
    }

    // Update head tracking (only when not actively scrolling and not skipping frame)
    if (this._climber && this._headTrackingInitialized && !this._isActivelyScrolling && !shouldSkipFrame) {
      this._updateHeadTracking();
    }

    // Update other mixers (throttled)
    if (!shouldSkipFrame) {
      this._mixers.forEach(mixer => {
        mixer.update(deltaTime);
      });
    }
  }

  // NEW: Centralized hip compensation method
  _applyHipCompensation() {
    // Only apply hip compensation for turn around animation and only if we have cached data
    if (this._animationController.currentState === 'turnAround' && this._hipBone && this._standingEndHipPosition && this._standingEndCharacterPosition) {
      // Calculate the difference between current hip world position and desired world position
      const currentHipWorldPosition = new Vector3();
      this._hipBone.getWorldPosition(currentHipWorldPosition);
      
      // Calculate the offset needed to match the standing end position
      const offset = new Vector3().subVectors(this._standingEndHipPosition, currentHipWorldPosition);
      
      // Apply the offset to the character's position (not the hip bone directly)
      this._climber.position.add(offset);
      
      if (DEBUG_MODE) console.log('🔥 HIP COMPENSATION APPLIED:', {
        currentHipWorld: currentHipWorldPosition,
        desiredHipWorld: this._standingEndHipPosition,
        offset: offset,
        newCharacterPos: this._climber.position
      });
    } else if (this._animationController.currentState === 'turnAround') {
      // Hip compensation failed - debug removed for performance
    }
  }

  // NEW: Position compensation for standing animation to prevent character drift
  _applyStandingPositionAdjustment(standingProgress, scrollOffset) {
    if (!this._climber) return;
    
    // Only apply during standing phase to prevent conflicts
    const phases = this._animationController.phases;
    if (scrollOffset < phases.standing.start || scrollOffset > phases.standing.end) {
      // Reset cached position when not in standing state
      if (this._climbingEndPosition) {
        // Cleared cached position when exiting standing phase
        this._climbingEndPosition = null;
        this._lastStandingUpdate = null;
      }
      return;
    }
    
    // Throttle updates to prevent glitching (update max every 16ms ~60fps)
    const now = performance.now();
    if (this._lastStandingUpdate && (now - this._lastStandingUpdate) < 16) {
      return;
    }
    this._lastStandingUpdate = now;
    
    // Cache initial climbing position when first entering standing (only once)
    if (!this._climbingEndPosition) {
      this._climbingEndPosition = this._climber.position.clone();
      // Cached initial climbing position for standing adjustments
    }
    
    // Smooth position adjustments based on standing progress
    // Use easing for smoother movement
    const easedProgress = standingProgress * standingProgress * (3 - 2 * standingProgress); // Smooth step
    
    // Define movement amounts (adjusted for better visual effect)
    const STANDING_DROP_AMOUNT = 30;   // Move down 200 units
    const STANDING_RIGHT_AMOUNT = 50;   // Move right 50 units  
    const STANDING_CLOSER_AMOUNT = 250; // Move closer 200 units (increased for more dramatic effect)
    
    // Calculate smooth position adjustments
    const dropOffset = easedProgress * STANDING_DROP_AMOUNT;
    const rightOffset = easedProgress * STANDING_RIGHT_AMOUNT;
    const closerOffset = easedProgress * STANDING_CLOSER_AMOUNT;
    
    // Store current position before applying changes
    const positionBefore = this._climber.position.clone();
    
    // Apply the position adjustments smoothly
    this._climber.position.y = this._climbingEndPosition.y - dropOffset;
    this._climber.position.x = this._climbingEndPosition.x + rightOffset;
    this._climber.position.z = this._climbingEndPosition.z + closerOffset;
    
    // Debug logging to track position changes
    if (Math.random() < 0.05) { // 5% of the time for detailed debugging
      console.log('🔧 STANDING POSITION UPDATE:', {
        scrollOffset: (scrollOffset * 100).toFixed(1) + '%',
        standingProgress: standingProgress.toFixed(3),
        easedProgress: easedProgress.toFixed(3),
        cached: {
          x: this._climbingEndPosition.x.toFixed(2),
          y: this._climbingEndPosition.y.toFixed(2),
          z: this._climbingEndPosition.z.toFixed(2)
        },
        before: {
          x: positionBefore.x.toFixed(2),
          y: positionBefore.y.toFixed(2),
          z: positionBefore.z.toFixed(2)
        },
        after: {
          x: this._climber.position.x.toFixed(2),
          y: this._climber.position.y.toFixed(2),
          z: this._climber.position.z.toFixed(2)
        },
        offsets: {
          drop: dropOffset.toFixed(2),
          right: rightOffset.toFixed(2),
          closer: closerOffset.toFixed(2)
        }
      });
    }
  }

  // Simple mouse tracking update
  updateMousePosition(mouseX, mouseY) {
    this._mouseX = mouseX || 0;
    this._mouseY = mouseY || 0;
  }

  // REMOVED: _handleScrollStates - replaced by centralized animation controller

  // Optimized head tracking
  _updateHeadTracking() {
    // 🔥 FIXED: Disable head tracking during wall-facing phases to prevent rotation conflicts
    if (this._animationController.currentState === 'crossfade' || 
        this._animationController.currentState === 'climbing' || 
        this._animationController.currentState === 'standing') {
      return; // Skip head tracking when facing the wall
    }
    
    // Only allow head tracking during idle, turnToWall, and turnAround
    if (this._animationController.currentState !== 'idle' && 
        this._animationController.currentState !== 'turnToWall' && 
        this._animationController.currentState !== 'turnAround') {
      return;
    }

    const now = Date.now();
    
    // Update blinking system
    this._updateBlinking();
    
    // Calculate mouse-based head rotation
    const mouseInfluenceHorizontal = 0.4;
    const mouseInfluenceVertical = 0.3;
    
    // 🔥 SHIFT HEAD TRACKING CENTER TO CHARACTER POSITION
    // Character appears on the right side of screen, roughly 70-80% from left
    // When mouse is at character position, head should look straight
    const characterScreenX = 0.9; // Character position in normalized coords (-1 to 1)
    const adjustedMouseX = this._mouseX - characterScreenX; // Shift so character position = 0
    
    // Adjust horizontal direction based on character orientation
    let horizontalMultiplier = 1; // Default for idle, standing, turnaround (facing camera)
    if (this._animationController.currentState === 'climbing') {
      horizontalMultiplier = -1; // Flip when climbing (facing wall)
    }
    
    const mouseHeadRotationY = adjustedMouseX * mouseInfluenceHorizontal * horizontalMultiplier;
    const mouseHeadRotationX = -this._mouseY * mouseInfluenceVertical;
    
    // Debug logging to verify head tracking is working
    if (DEBUG_MODE && Math.random() < 0.02) { // Log 2% of the time
      console.log('🔥 Head tracking:', { 
        state: this._animationController.currentState,
        mouseX: this._mouseX?.toFixed(3), 
        adjustedMouseX: adjustedMouseX?.toFixed(3),
        mouseY: this._mouseY?.toFixed(3),
        headRotY: mouseHeadRotationY.toFixed(3),
        headRotX: mouseHeadRotationX.toFixed(3),
        isActivelyScrolling: this._isActivelyScrolling
      });
    }
    
    // Add subtle breathing
    const time = now * 0.001;
    const breathingIntensity = 0.015;
    
    // Apply mouse tracking to head (optimized traversal)
    this._climber.traverse((child) => {
      if ((child.isBone || child.type === 'Bone') && 
          (child.name.toLowerCase().includes('head') || child.name.toLowerCase().includes('neck'))) {
        
        // Store original rotation if not stored
        if (!child.userData.originalRotation) {
          child.userData.originalRotation = child.rotation.clone();
        }
        
        const baseRotation = child.userData.originalRotation;
        child.rotation.x = baseRotation.x + mouseHeadRotationX + Math.cos(time * 0.4) * breathingIntensity * 0.3;
        child.rotation.y = baseRotation.y + mouseHeadRotationY + Math.sin(time * 0.6) * breathingIntensity;
        child.rotation.z = baseRotation.z + Math.sin(time * 0.3) * breathingIntensity * 0.2;
      }
    });
  }

  // REMOVED: _handleTurnToWallAnimation - replaced by centralized animation controller

  // NEW: Handle smooth crossfade between turn-final-pose and climbing
  _handleCrossfadeTransition(scrollOffset) {
    // Initialize crossfade if not already done
    if (!this._animationController.crossfade.active) {
      console.log('🔥 CROSSFADE: Initializing crossfade transition');
      
      // Ensure turn-to-wall action is properly set up
      if (!this._turnToWallAction.isRunning()) {
        this._turnToWallAction.reset();
        this._turnToWallAction.play();
      }
      this._turnToWallAction.paused = true;
      this._turnToWallAction.weight = 1.0;
      this._turnToWallAction.enabled = true;
      
      // Set turn-to-wall to 50% of its animation (mid-turn pose)
      const turnDuration = this._turnToWallAction.getClip().duration;
      this._turnToWallAction.time = turnDuration * 0.5;
      
      // Ensure climbing action is ready for crossfade
      if (!this._climbingAction.isRunning()) {
        this._climbingAction.reset();
        this._climbingAction.play();
      }
      this._climbingAction.paused = true;
      this._climbingAction.enabled = true;
      this._climbingAction.weight = 0.0;
      // Start at 0% - the natural beginning of climbing animation
      this._climbingAction.time = 0;
      
      // CRITICAL: Set current action to climbing for proper state tracking
      this._currentAction = this._climbingAction;
    }
    
    // Calculate crossfade progress (7-9% scroll = 0-100% crossfade)
    const crossfadeProgress = Math.max(0, Math.min(1, (scrollOffset - 0.06) / (0.08 - 0.06)));
    
    // Calculate weights for smooth crossfade
    const turnWeight = 1.0 - crossfadeProgress; // Fades out
    const climbWeight = crossfadeProgress;      // Fades in
    
    // Apply weights
    this._turnToWallAction.weight = turnWeight;
    this._climbingAction.weight = climbWeight;
    
    // CRITICAL: Ensure both actions are enabled for blending
    this._turnToWallAction.enabled = true;
    this._climbingAction.enabled = true;
    
    // ROTATION: Face the wall during crossfade (LEFT TURN)
    const targetRotation = -Math.PI; // 🔥 FIXED: Negative for left turn (-180°)
    
    // Update mixer to apply the crossfade
      this._mixer.update(0);
    
    // Apply rotation AFTER mixer update to face the wall
    if (this._climber) {
      this._climber.rotation.y = targetRotation;
    }
    
    // Store scroll offset for maintenance
    this._animationController.crossfade.progress = crossfadeProgress;
    this._animationController.crossfade.fromWeight = turnWeight;
    this._animationController.crossfade.toWeight = climbWeight;
  }

  _handleClimbingAnimation(scrollOffset) {
    if (this._currentAction === this._climbingAction) {
      // UPDATED: Climbing starts after extended crossfade zone and ends at 65%
      const climbingProgress = Math.max(0, Math.min(1, (scrollOffset - 0.08) / (0.65 - 0.08)));
      const climbingDuration = this._climbingAction.getClip().duration;
      const fastClimbingProgress = climbingProgress * 2.0;
      this._climbingAction.time = (climbingDuration * fastClimbingProgress) % climbingDuration;
      
      // CRITICAL: Force mixer to update pose when animation is paused
      this._mixer.update(0);
      
      // DEBUG: Log climbing animation progress occasionally
      if (Math.random() < 0.05) { // Log 5% of the time
        console.log('🔥 CLIMBING ANIMATION:', {
          scrollOffset: scrollOffset.toFixed(3),
          progress: climbingProgress.toFixed(3),
          fastProgress: fastClimbingProgress.toFixed(3),
          time: this._climbingAction.time.toFixed(3),
          duration: climbingDuration.toFixed(3),
          actionName: this._climbingAction.getClip().name,
          isRunning: this._climbingAction.isRunning(),
          paused: this._climbingAction.paused,
          weight: this._climbingAction.weight
        });
      }
      
      // Let climbing face the wall naturally (no forced rotation)
    } else {
      console.log('🔥 CLIMBING: Current action mismatch!', {
        currentAction: this._currentAction?.getClip().name,
        expectedAction: this._climbingAction?.getClip().name,
        animationState: this._animationController.currentState
      });
    }
  }

  _handleStandingAnimation(scrollOffset) {
    // 🔥 REMOVED: This function is replaced by the centralized animation controller
    // The old logic here was conflicting with the new system and causing glitches
    // All standing animation is now handled in _updateCurrentAnimation()
    return;
  }

  _handleTurnAroundAnimation(scrollOffset) {
    if (this._currentAction === this._turnAroundAction) {
      // FIXED: Use new range (95-100%) and clamp values
      const turnAroundProgress = Math.max(0, Math.min(1, (scrollOffset - 0.95) / (1.0 - 0.95)));
      const turnAroundDuration = this._turnAroundAction.getClip().duration;
      const newTime = turnAroundDuration * turnAroundProgress;
      this._turnAroundAction.time = newTime;
      
      // CRITICAL: Force mixer to update pose when animation is paused
      this._mixer.update(0);
      
      // Hip position correction is handled centrally in _applyHipCompensation()
      
      // Let the animation handle the rotation naturally - don't override it
      
      // DEBUG: Log when time changes significantly
      if (Math.abs(newTime - (this._lastTurnAroundTime || 0)) > 0.1) {
        console.log('🔥 TURN-AROUND TIME UPDATE:', {
          scrollOffset: scrollOffset.toFixed(3),
          progress: turnAroundProgress.toFixed(3),
          newTime: newTime.toFixed(3),
          duration: turnAroundDuration.toFixed(3),
          actionName: this._turnAroundAction.getClip().name,
          forcedRotation: 'Math.PI (180°)'
        });
        this._lastTurnAroundTime = newTime;
      }
    } else {
      console.log('🔥 TURN-AROUND: Current action mismatch!', {
        currentAction: this._currentAction?.getClip().name,
        expectedAction: this._turnAroundAction?.getClip().name
      });
    }
  }

  // NEW: Debug method to check if character is in T-pose
  _checkForTPose() {
    if (!this._climber) return;
    
    let tPoseDetected = false;
    let armBones = [];
    
    this._climber.traverse((child) => {
      if (child.isBone || child.type === 'Bone') {
        const boneName = child.name.toLowerCase();
        if (boneName.includes('arm') || boneName.includes('shoulder')) {
          armBones.push({
            name: child.name,
            rotation: {
              x: child.rotation.x.toFixed(3),
              y: child.rotation.y.toFixed(3),
              z: child.rotation.z.toFixed(3)
            }
          });
          
          // Check if arms are in T-pose position (roughly horizontal)
          if (Math.abs(child.rotation.z) < 0.1 && Math.abs(child.rotation.x) < 0.1) {
            tPoseDetected = true;
          }
        }
      }
    });
    
    if (DEBUG_MODE && tPoseDetected) {
      console.log('🔥 T-POSE DETECTED!', {
        state: this._animationController.currentState,
        currentAction: this._currentAction?.getClip().name,
        armBones: armBones
      });
    }
    
    return tPoseDetected;
  }

  // Helper method to get animation index from action
  _getAnimationIndex(action) {
    if (!action || !this._allAnimations) return 'UNKNOWN';
    
    const clipName = action.getClip().name;
    for (let i = 0; i < this._allAnimations.length; i++) {
      if (this._allAnimations[i]?.name === clipName) {
        return i;
      }
    }
    return 'UNKNOWN';
  }

  // NEW: Maintain crossfade state when not actively scrolling
  _maintainCrossfadeState() {
    if (!this._turnToWallAction || !this._climbingAction || !this._animationController.crossfade.progress) return;
    
    // Recalculate crossfade progress using stored scroll offset
    const crossfadeProgress = Math.max(0, Math.min(1, (this._animationController.crossfade.progress - 0.06) / (0.08 - 0.06)));
    
    // Maintain the weights that were set during scrolling
    const turnWeight = 1.0 - crossfadeProgress;
    const climbWeight = crossfadeProgress;
    
    // Ensure actions are still properly configured
    this._turnToWallAction.enabled = true;
    this._climbingAction.enabled = true;
    this._turnToWallAction.weight = turnWeight;
    this._climbingAction.weight = climbWeight;
    
    // Maintain the animation times
    const turnDuration = this._turnToWallAction.getClip().duration;
    this._turnToWallAction.time = turnDuration * 0.5;
    this._climbingAction.time = 0;
    
    // Maintain wall-facing rotation

    const targetRotation = -Math.PI; // 🔥 FIXED: Negative for left turn (-180°)
    
    if (this._climber) {
      this._climber.rotation.y = targetRotation;
    }
  }

  _initEvents() {
    // Production mode - no keyboard events needed
    if (DEBUG_MODE) {
      // Keyboard event for UI toggle (debug only)
      document.addEventListener('keydown', (event) => {
        if (event.key === 'c' || event.key === 'C') {
          this._toggleUIControls();
        }
      });
    }
  }

  _toggleUIControls() {
    // If not in debug mode, or if debug panel was never created, do nothing or only toggle visible game UI elements.
    if (!DEBUG_MODE && !this._debugPanel) { // A bit redundant if _debugPanel is only created in DEBUG_MODE
      // Potentially toggle other non-debug UI elements if any
      return;
    }

    this.uiVisible = !this.uiVisible;
    
    // Toggle debug panel
    if (this._debugPanel) { // Check if debug panel exists
      this._debugPanel.style.display = this.uiVisible ? 'block' : 'none';
    }
    
    // 🔥 FPS DISPLAY TOGGLE REMOVED FOR PRODUCTION
    // Toggle FPS display - REMOVED
    // if (this._fpsDisplay) { // Check if FPS display exists
    //     this._fpsDisplay.style.display = this.uiVisible ? 'block' : 'none';
    // }
    
    // Toggle material controls panel
    if (this._materialPanel) {
      this._materialPanel.style.display = this.uiVisible ? 'block' : 'none';
    }
    
    // 🔥 Toggle post-processing controls panel
    if (this._postProcessingPanel) {
      this._postProcessingPanel.style.display = this.uiVisible ? 'block' : 'none';
    }

    // Toggle general performance display if it exists (e.g. from three-perf)
    const performanceDisplay = document.querySelector('.three-perf-ui'); // Corrected selector
    if (performanceDisplay) {
      performanceDisplay.style.display = this.uiVisible ? 'block' : 'none';
    }
    
    if (DEBUG_MODE) console.log('🔥 UI Controls:', this.uiVisible ? 'VISIBLE' : 'HIDDEN');
  }

  // 🔥 MATERIAL CONTROL METHODS
  _updateMeshMaterial(mesh) {
    const controls = this._materialControls;
    
    if (controls.useOriginalTextures) {
      // Use ACTUAL original material with ALL textures preserved
      const originalMaterial = this._originalMaterials.get(mesh.uuid);
      if (originalMaterial) {
        // Create a fresh clone to avoid modifying the stored original
        const materialClone = originalMaterial.clone();
        
        // Preserve ALL texture maps from original
        materialClone.map = originalMaterial.map;
        materialClone.normalMap = originalMaterial.normalMap;
        materialClone.roughnessMap = originalMaterial.roughnessMap;
        materialClone.metalnessMap = originalMaterial.metalnessMap;
        materialClone.emissiveMap = originalMaterial.emissiveMap;
        materialClone.aoMap = originalMaterial.aoMap;
        materialClone.lightMap = originalMaterial.lightMap;
        materialClone.bumpMap = originalMaterial.bumpMap;
        materialClone.displacementMap = originalMaterial.displacementMap;
        materialClone.alphaMap = originalMaterial.alphaMap;
        
                 // Apply control overrides on top of original
         materialClone.roughness = controls.roughness;
         
         // 🔥 SMART METALNESS: Don't make hair/skin metallic, only clothing/gear
         const meshName = mesh.name ? mesh.name.toLowerCase() : '';
         const isHairOrSkin = meshName.includes('hair') || meshName.includes('skin') || 
                             meshName.includes('face') || meshName.includes('head') ||
                             meshName.includes('body') || meshName.includes('arm') ||
                             meshName.includes('leg') || meshName.includes('eye');
         
         if (isHairOrSkin) {
           // Keep original metalness for organic parts (usually 0.0)
           materialClone.metalness = Math.min(originalMaterial.metalness, 0.1);
         } else {
           // Apply metalness to clothing/gear
           materialClone.metalness = controls.metalness;
         }
         
         materialClone.emissive.setHex(parseInt(controls.emissionColor.replace('#', ''), 16));
         materialClone.emissiveIntensity = controls.emission;
        
        // Only tint color if not pure white (preserve original colors)
        if (controls.color !== '#ffffff') {
          materialClone.color.setHex(parseInt(controls.color.replace('#', ''), 16));
        }
        
        mesh.material = materialClone;
      }
    } else {
      // Use optimized material (no textures)
      mesh.material = getOptimizedCharacterMaterial(
        parseInt(controls.color.replace('#', ''), 16),
        controls.roughness,
        controls.metalness
      );
      mesh.material.emissive.setHex(parseInt(controls.emissionColor.replace('#', ''), 16));
      mesh.material.emissiveIntensity = controls.emission;
    }
  }

  _updateAllMaterials() {
    if (!this._climber) {
      console.log('🔥 MATERIAL UPDATE FAILED: No climber found');
      return;
    }
    
    let updatedCount = 0;
    this._climber.traverse((child) => {
      if (child.isMesh && child.material) {
        this._updateMeshMaterial(child);
        updatedCount++;
      }
    });
    
    console.log('🔥 MATERIALS UPDATED:', {
      meshCount: updatedCount,
      useOriginalTextures: this._materialControls.useOriginalTextures,
      roughness: this._materialControls.roughness,
      metalness: this._materialControls.metalness,
      emission: this._materialControls.emission,
      emissionColor: this._materialControls.emissionColor
    });
  }

  _createMaterialControls() {
    // Create material controls panel
    const materialPanel = document.createElement('div');
    materialPanel.style.cssText = `
      position: fixed;
      top: 10px;
      left: 280px;
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid #333;
      border-radius: 8px;
      padding: 15px;
      color: white;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      min-width: 250px;
      pointer-events: auto;
      display: none;
    `;
    
    materialPanel.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #ff6b35;">🔥 Material Controls</h3>
      
             <label style="display: block; margin: 8px 0;">
         <input type="checkbox" id="useOriginalTextures" ${this._materialControls.useOriginalTextures ? 'checked' : ''}>
         Use Original Textures
       </label>
       
       <label style="display: block; margin: 8px 0;">
         Roughness: <span id="roughnessValue">${this._materialControls.roughness.toFixed(2)}</span>
         <input type="range" id="roughness" min="0" max="1" step="0.01" value="${this._materialControls.roughness}" style="width: 100%;">
       </label>
       
       <label style="display: block; margin: 8px 0;">
         Metalness (Gear Only): <span id="metalnessValue">${this._materialControls.metalness.toFixed(2)}</span>
         <input type="range" id="metalness" min="0" max="1" step="0.01" value="${this._materialControls.metalness}" style="width: 100%;">
       </label>
       
       <label style="display: block; margin: 8px 0;">
         Emission: <span id="emissionValue">${this._materialControls.emission.toFixed(2)}</span>
         <input type="range" id="emission" min="0" max="1" step="0.01" value="${this._materialControls.emission}" style="width: 100%;">
       </label>
       
       <label style="display: block; margin: 8px 0;">
         Emission Color:
         <input type="color" id="emissionColor" value="${this._materialControls.emissionColor}" style="width: 100%;">
       </label>
      
      <label style="display: block; margin: 8px 0;">
        Base Color:
        <input type="color" id="baseColor" value="${this._materialControls.color}" style="width: 100%;">
      </label>
      
      <button id="resetMaterials" style="width: 100%; margin-top: 10px; padding: 5px; background: #ff6b35; border: none; color: white; border-radius: 4px; cursor: pointer;">
        Reset to Defaults
      </button>
    `;
    
    document.body.appendChild(materialPanel);
    this._materialPanel = materialPanel;
    
    // Add event listeners
    this._setupMaterialEventListeners();
  }

  _createPostProcessingControls() {
    // Create post-processing controls panel
    const postPanel = document.createElement('div');
    postPanel.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid #333;
      border-radius: 8px;
      padding: 15px;
      color: white;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      min-width: 250px;
      pointer-events: auto;
      display: none;
    `;
    
    const postControls = this._app?.postprocessing?.getControls() || {};
    
    postPanel.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #40E0D0;">🎨 Post-Processing</h3>
      
      <!-- BLOOM CONTROLS -->
      <div style="border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 10px;">
        <h4 style="margin: 0 0 8px 0; color: #ff6b35;">Bloom Effect</h4>
        <label style="display: block; margin: 8px 0;">
          <input type="checkbox" id="bloomEnabled" ${postControls.bloom?.enabled !== false ? 'checked' : ''}>
          Enable Bloom
        </label>
        <label style="display: block; margin: 8px 0;">
          Intensity: <span id="bloomIntensityValue">${(postControls.bloom?.intensity || 2.5).toFixed(2)}</span>
          <input type="range" id="bloomIntensity" min="0" max="5" step="0.1" value="${postControls.bloom?.intensity || 2.5}" style="width: 100%;">
        </label>
        <label style="display: block; margin: 8px 0;">
          Radius: <span id="bloomRadiusValue">${(postControls.bloom?.radius || 0.3).toFixed(2)}</span>
          <input type="range" id="bloomRadius" min="0" max="1" step="0.05" value="${postControls.bloom?.radius || 0.3}" style="width: 100%;">
        </label>
        <label style="display: block; margin: 8px 0;">
          Threshold: <span id="bloomThresholdValue">${(postControls.bloom?.threshold || 0.6).toFixed(2)}</span>
          <input type="range" id="bloomThreshold" min="0" max="1" step="0.05" value="${postControls.bloom?.threshold || 0.6}" style="width: 100%;">
        </label>
      </div>
      
      <!-- CHARACTER OUTLINE CONTROLS -->
      <div style="border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 10px;">
        <h4 style="margin: 0 0 8px 0; color: #ff6b35;">🧗‍♂️ Character Outline</h4>
        <label style="display: block; margin: 8px 0;">
          <input type="checkbox" id="characterOutlineEnabled" ${postControls.characterOutline?.enabled ? 'checked' : ''}>
          Enable Character Outline
        </label>
        <label style="display: block; margin: 8px 0;">
          Width: <span id="characterOutlineWidthValue">${(postControls.characterOutline?.width || 0.003).toFixed(3)}</span>
          <input type="range" id="characterOutlineWidth" min="0.001" max="0.01" step="0.0005" value="${postControls.characterOutline?.width || 0.003}" style="width: 100%;">
        </label>
        <label style="display: block; margin: 8px 0;">
          Intensity: <span id="characterOutlineIntensityValue">${(postControls.characterOutline?.intensity || 1.0).toFixed(2)}</span>
          <input type="range" id="characterOutlineIntensity" min="0" max="2" step="0.1" value="${postControls.characterOutline?.intensity || 1.0}" style="width: 100%;">
        </label>
      </div>
      

    `;
    
    document.body.appendChild(postPanel);
    this._postProcessingPanel = postPanel;
    
    // Don't set up event listeners yet - wait for postprocessing to be ready
    console.log('🔥 POST-PROCESSING PANEL CREATED - waiting for postprocessing to be ready');
  }

  // PUBLIC METHOD: Call this when postprocessing is ready
  connectPostProcessingControls() {
    console.log('🔥 ATTEMPTING TO CONNECT POST-PROCESSING CONTROLS:', {
      panel: !!this._postProcessingPanel,
      app: !!this._app,
      postprocessing: !!this._app?.postprocessing,
      postprocessingMethods: this._app?.postprocessing ? Object.getOwnPropertyNames(Object.getPrototypeOf(this._app.postprocessing)) : 'N/A'
    });
    
    if (this._postProcessingPanel && this._app?.postprocessing) {
      this._setupPostProcessingEventListeners();
      console.log('🔥 POST-PROCESSING CONTROLS CONNECTED SUCCESSFULLY!');
      
      // Test postprocessing connection
      console.log('🔥 TESTING BLOOM INTENSITY METHOD:', typeof this._app.postprocessing.setBloomIntensity);
      
      // Controls will be visible when user presses 'C' key
    } else {
      console.log('🔥 POST-PROCESSING CONNECTION FAILED:', {
        panel: !!this._postProcessingPanel,
        app: !!this._app,
        postprocessing: !!this._app?.postprocessing
      });
    }
  }

  _setupPostProcessingEventListeners() {
    const panel = this._postProcessingPanel;
    if (!panel || !this._app?.postprocessing) {
      console.log('🔥 POST-PROCESSING SETUP FAILED:', {
        panel: !!panel,
        app: !!this._app,
        postprocessing: !!this._app?.postprocessing
      });
      return;
    }
    
    const postprocessing = this._app.postprocessing;
    console.log('🔥 POST-PROCESSING CONTROLS CONNECTED:', postprocessing);
    
    // BLOOM CONTROLS
    panel.querySelector('#bloomEnabled').addEventListener('change', (e) => {
      console.log('🔥 BLOOM ENABLED CHANGED:', e.target.checked);
      postprocessing.setBloomEnabled(e.target.checked);
    });
    
    const bloomIntensitySlider = panel.querySelector('#bloomIntensity');
    const bloomIntensityValue = panel.querySelector('#bloomIntensityValue');
    bloomIntensitySlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      console.log('🔥 BLOOM INTENSITY CHANGED:', value);
      bloomIntensityValue.textContent = value.toFixed(2);
      postprocessing.setBloomIntensity(value);
    });
    
    const bloomRadiusSlider = panel.querySelector('#bloomRadius');
    const bloomRadiusValue = panel.querySelector('#bloomRadiusValue');
    bloomRadiusSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      bloomRadiusValue.textContent = value.toFixed(2);
      postprocessing.setBloomRadius(value);
    });
    
    const bloomThresholdSlider = panel.querySelector('#bloomThreshold');
    const bloomThresholdValue = panel.querySelector('#bloomThresholdValue');
    bloomThresholdSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      bloomThresholdValue.textContent = value.toFixed(2);
      postprocessing.setBloomThreshold(value);
    });
    
    // CHARACTER OUTLINE CONTROLS
    panel.querySelector('#characterOutlineEnabled').addEventListener('change', (e) => {
      postprocessing.setCharacterOutlineEnabled(e.target.checked);
    });
    
    const characterOutlineWidthSlider = panel.querySelector('#characterOutlineWidth');
    const characterOutlineWidthValue = panel.querySelector('#characterOutlineWidthValue');
    characterOutlineWidthSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      characterOutlineWidthValue.textContent = value.toFixed(3);
      postprocessing.setCharacterOutlineWidth(value);
    });
    
    const characterOutlineIntensitySlider = panel.querySelector('#characterOutlineIntensity');
    const characterOutlineIntensityValue = panel.querySelector('#characterOutlineIntensityValue');
    characterOutlineIntensitySlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      characterOutlineIntensityValue.textContent = value.toFixed(2);
      postprocessing.setCharacterOutlineIntensity(value);
    });
    

  }

  _setupMaterialEventListeners() {
    const panel = this._materialPanel;
    
    // Checkbox for original textures
    panel.querySelector('#useOriginalTextures').addEventListener('change', (e) => {
      this._materialControls.useOriginalTextures = e.target.checked;
      this._updateAllMaterials();
    });
    
    // Roughness slider
    const roughnessSlider = panel.querySelector('#roughness');
    const roughnessValue = panel.querySelector('#roughnessValue');
    roughnessSlider.addEventListener('input', (e) => {
      this._materialControls.roughness = parseFloat(e.target.value);
      roughnessValue.textContent = this._materialControls.roughness.toFixed(2);
      this._updateAllMaterials();
    });
    
    // Metalness slider
    const metalnessSlider = panel.querySelector('#metalness');
    const metalnessValue = panel.querySelector('#metalnessValue');
    metalnessSlider.addEventListener('input', (e) => {
      this._materialControls.metalness = parseFloat(e.target.value);
      metalnessValue.textContent = this._materialControls.metalness.toFixed(2);
      this._updateAllMaterials();
    });
    
    // Emission slider
    const emissionSlider = panel.querySelector('#emission');
    const emissionValue = panel.querySelector('#emissionValue');
    emissionSlider.addEventListener('input', (e) => {
      this._materialControls.emission = parseFloat(e.target.value);
      emissionValue.textContent = this._materialControls.emission.toFixed(2);
      this._updateAllMaterials();
    });
    
    // Emission color picker
    panel.querySelector('#emissionColor').addEventListener('change', (e) => {
      this._materialControls.emissionColor = e.target.value;
      this._updateAllMaterials();
    });
    
    // Base color picker
    panel.querySelector('#baseColor').addEventListener('change', (e) => {
      this._materialControls.color = e.target.value;
      this._updateAllMaterials();
    });
    
         // Reset button
     panel.querySelector('#resetMaterials').addEventListener('click', () => {
                this._materialControls = {
          useOriginalTextures: true,  // 🔥 Your perfect defaults
          roughness: 0.95,
          metalness: 0.80,
          emission: 0.04,
          emissionColor: '#000080',
          color: '#ffffff'
        };
        
        // Update UI
        panel.querySelector('#useOriginalTextures').checked = true;
        panel.querySelector('#roughness').value = 0.95;
        panel.querySelector('#roughnessValue').textContent = '0.95';
        panel.querySelector('#metalness').value = 0.80;
        panel.querySelector('#metalnessValue').textContent = '0.80';
        panel.querySelector('#emission').value = 0.04;
        panel.querySelector('#emissionValue').textContent = '0.04';
        panel.querySelector('#emissionColor').value = '#000080';
       panel.querySelector('#baseColor').value = '#ffffff';
       
       this._updateAllMaterials();
     });
  }

  _createHoverEffectDiv() {
    // Create invisible hover detection div
    this._hoverEffectDiv = document.createElement('div');
    this._hoverEffectDiv.style.cssText = `
      position: fixed;
      top: 20%;
      right: 12%;
      width: 13%;
      height: 55%;
      background: transparent;
      pointer-events: auto;
      z-index: 5000;
      transition: right 0.1s ease;
    `;
    
    // Add hover events
    this._hoverEffectDiv.addEventListener('mouseenter', () => {
      this._isHovering = true;
      console.log('🔥 CHARACTER HOVER: EFFECTS ACTIVATING');
    });
    
    this._hoverEffectDiv.addEventListener('mouseleave', () => {
      this._isHovering = false;
      console.log('🔥 CHARACTER HOVER: EFFECTS DEACTIVATING');
    });
    
    // Add to document
    document.body.appendChild(this._hoverEffectDiv);
    
    console.log('🔥 HOVER EFFECT DIV CREATED: Interactive effects ready');
  }

  // 🔥 UPDATE HOVER DIV POSITION BASED ON SCROLL
  _updateHoverDivPosition(scrollProgress) {
    if (!this._hoverEffectDiv) return;
    
    // Interpolate between 12% (start) and 18% (end) based on scroll progress
    const startRight = 12;
    const endRight = 18;
    const currentRight = startRight + (scrollProgress * (endRight - startRight));
    
    // Apply the new position
    this._hoverEffectDiv.style.right = `${currentRight}%`;
    
    // Debug logging (occasionally)
    if (DEBUG_MODE && Math.random() < 0.01) {
      console.log('🔥 HOVER DIV POSITION UPDATE:', {
        scrollProgress: scrollProgress.toFixed(3),
        rightPosition: `${currentRight.toFixed(1)}%`
      });
    }
  }

  _updateHoverEffects(deltaTime) {
    // MAXIMUM PERFORMANCE - only update when hover state changes
    if (!this._app?.postprocessing || this._isHovering === this._lastHoverState) return;
    
    console.log('🔥 HOVER STATE CHANGED:', this._isHovering ? 'ON' : 'OFF');
    
    if (this._isHovering) {
      // INSTANT HOVER ON - apply all hover settings
      this._app.postprocessing.setBloomIntensity(this._hoverSettings.bloomIntensity);
      this._app.postprocessing.setCharacterOutlineEnabled(true);
      
      // Apply hover material settings
      this._materialControls.useOriginalTextures = false;
      this._materialControls.roughness = this._hoverSettings.roughness;
      this._materialControls.metalness = this._hoverSettings.metalness;
      this._materialControls.emission = this._hoverSettings.emission;
      
      this._updateAllMaterials();
      
      // 🔥 SCALE HEAD ON HOVER - ABSOLUTE SCALE
      this._headScaleTarget.x = this._originalHeadScale.x * this._hoverSettings.headScale;
      this._headScaleTarget.y = this._originalHeadScale.y * this._hoverSettings.headScale;
      this._headScaleTarget.z = this._originalHeadScale.z * this._hoverSettings.headScale;
      
    } else {
      // INSTANT HOVER OFF - apply default settings
      this._app.postprocessing.setBloomIntensity(this._defaultSettings.bloomIntensity);
      this._app.postprocessing.setCharacterOutlineEnabled(false);
      
      // Apply default material settings
      this._materialControls.useOriginalTextures = true;
      this._materialControls.roughness = this._defaultSettings.roughness;
      this._materialControls.metalness = this._defaultSettings.metalness;
      this._materialControls.emission = this._defaultSettings.emission;
      
      this._updateAllMaterials();
      
      // 🔥 RESTORE HEAD SCALE - ABSOLUTE SCALE
      this._headScaleTarget.x = this._originalHeadScale.x * this._defaultSettings.headScale;
      this._headScaleTarget.y = this._originalHeadScale.y * this._defaultSettings.headScale;
      this._headScaleTarget.z = this._originalHeadScale.z * this._defaultSettings.headScale;
    }
    
    // Update last state
    this._lastHoverState = this._isHovering;
  }

  // 🔥 SMOOTH HEAD SCALING ANIMATION
  _updateHeadScaling(deltaTime) {
    // Only update if we have a head bone and scaling is needed
    if (!this._headBone) return;
    
    // Smooth interpolation speed (higher = faster)
    const lerpSpeed = 8.0;
    const lerpFactor = Math.min(1.0, deltaTime * lerpSpeed);
    
    // Smoothly interpolate between current and target scale
    this._headScaleCurrent.x += (this._headScaleTarget.x - this._headScaleCurrent.x) * lerpFactor;
    this._headScaleCurrent.y += (this._headScaleTarget.y - this._headScaleCurrent.y) * lerpFactor;
    this._headScaleCurrent.z += (this._headScaleTarget.z - this._headScaleCurrent.z) * lerpFactor;
    
    // Apply the smooth scale to the head bone
    this._headBone.scale.set(
      this._headScaleCurrent.x,
      this._headScaleCurrent.y,
      this._headScaleCurrent.z
    );
    
    // Debug logging (occasionally)
    if (DEBUG_MODE && Math.random() < 0.01) {
      console.log('🔥 HEAD SCALING UPDATE:', {
        target: this._headScaleTarget,
        current: this._headScaleCurrent,
        applied: {
          x: this._headBone.scale.x.toFixed(3),
          y: this._headBone.scale.y.toFixed(3),
          z: this._headBone.scale.z.toFixed(3)
        }
      });
    }
  }

  dispose() {
    // Clean up position cache
    this._climbingEndPosition = null;
    
    // Clean up material controls
    if (this._materialPanel) {
      this._materialPanel.remove();
    }
    
    // Clean up post-processing controls
    if (this._postProcessingPanel) {
      this._postProcessingPanel.remove();
    }
    
    // Clean up existing dispose logic
    if (this._mixer) {
      this._mixer.stopAllAction();
    }
    this._mixers.forEach(mixer => {
      mixer.stopAllAction();
    });
  }

  // PROFESSIONAL ANIMATION CONTROLLER - CENTRALIZED SYSTEM
  _updateAnimationController(scrollOffset, deltaTime) {
    const controller = this._animationController;
    const now = performance.now();
    
    // CRITICAL FIX: Don't run animation controller until character is fully loaded
    if (!this._mixer || !this._idleAction || !this._climber) {
      // Character not loaded yet - skip animation controller (debug removed for performance)
      return;
    }
    
    // CRITICAL FIX: Initialize timing on first run if not already done
    if (controller.lastUpdateTime === 0 || controller.lastUpdateTime < 0 || isNaN(controller.lastUpdateTime)) {
      controller.lastUpdateTime = now;
      if (DEBUG_MODE) console.log('🔥 ANIMATION CONTROLLER TIMING FIXED ON FIRST RUN:', now);
    }
    
    // Rotation tracking (debug removed for performance)
    
    // Performance throttling - TEMPORARILY DISABLED FOR DEBUGGING
    if (DEBUG_MODE && false && now - controller.lastUpdateTime < controller.updateThrottle && !controller.forceUpdate) {
      // DEBUG: Log when throttling blocks updates
      if (DEBUG_MODE && Math.random() < 0.01) { // Ensure inner is also conditional if outer is ever changed
        console.log('🔥 ANIMATION CONTROLLER THROTTLED:', {
          timeSinceLastUpdate: (now - controller.lastUpdateTime).toFixed(1),
          throttleLimit: controller.updateThrottle,
          forceUpdate: controller.forceUpdate
        });
      }
      return;
    }
    controller.lastUpdateTime = now;
    controller.forceUpdate = false;
    
    // 🔥 DEBUG: Log state transitions
    const targetState = this._getTargetAnimationState(scrollOffset);
    if (controller.targetState !== targetState) {
      // State transition (debug removed for performance)
    }
    
    // Determine target state based on scroll position
    
    // Handle state transitions
    if (controller.targetState !== targetState) {
      this._transitionToState(targetState, scrollOffset);
    }
    
    // Update current animation based on state
    this._updateCurrentAnimation(scrollOffset, deltaTime);
    
    // Apply mixer update - SINGLE POINT OF TRUTH
    this._applyMixerUpdate(deltaTime);
    
    // Handle rotation overrides - CENTRALIZED
    this._applyRotationOverrides(scrollOffset);
    
    // Final rotation tracking (debug removed for performance)
  }
  
  _getTargetAnimationState(scrollOffset) {
    const phases = this._animationController.phases;
    
    // DEBUG: Log state determination
    if (DEBUG_MODE && Math.random() < 0.02) {
      console.log('🔥 STATE DETERMINATION:', {
        scrollOffset: scrollOffset.toFixed(3),
        phases: {
          idle: `${phases.idle.start}-${phases.idle.end}`,
          turnToWall: `${phases.turnToWall.start}-${phases.turnToWall.end}`,
          climbing: `${phases.climbing.start}-${phases.climbing.end}`,
          standing: `${phases.standing.start}-${phases.standing.end}`,
          turnAround: `${phases.turnAround.start}-${phases.turnAround.end}`
        }
      });
    }
    
    if (scrollOffset <= phases.idle.end) return 'idle';
    if (scrollOffset <= phases.turnToWall.end) return 'turnToWall';
    // crossfade phase removed, climbing starts earlier
    if (scrollOffset <= phases.climbing.end) return 'climbing';
    if (scrollOffset <= phases.standing.end) return 'standing';
    return 'turnAround';
  }
  
  _transitionToState(newState, scrollOffset) {
    const controller = this._animationController;
    const oldState = controller.currentState;
    
    // CRITICAL FIX: Prevent unnecessary transitions - this was causing T-pose resets!
    if (oldState === newState) {
      return;
    }
    
    // DEBUG: Log state transitions
    if (DEBUG_MODE) {
      console.log('🔥 STATE TRANSITION:', {
        from: oldState,
        to: newState,
        scrollOffset: scrollOffset.toFixed(3)
      });
    }
    
    // Stop current action cleanly
    if (controller.phases[oldState]?.action) {
      const oldAction = controller.phases[oldState].action;
      oldAction.weight = 0;
      oldAction.enabled = false;
    }
    
    // Set up new action
    const newAction = this._getActionForState(newState);
    if (newAction) {
      let oldAction = this._currentAction;
      if (controller.phases[oldState] && controller.phases[oldState].action) {
        oldAction = controller.phases[oldState].action;
      }

      if (newState === 'idle') {
        if (newAction.isRunning() && !newAction.paused) {
          if (DEBUG_MODE) console.log('🔥 IDLE: Keeping existing idle animation running - no reset needed');
        } else {
          newAction.reset().play();
        }
        newAction.paused = false;
      } else if (newState === 'turnToWall' || newState === 'turnAround') {
        newAction.reset().play();
        newAction.paused = true; // 🔥 NOW SCROLL-CONTROLLED like climbing/standing
        newAction.enabled = true;
        newAction.weight = 1.0;
      } else if (newState === 'climbing') {
        // 🔥 FIXED: Simplified climbing transition - no special crossfade handling
        if (oldAction !== newAction) {
          // Only reset if it's a different action
          newAction.reset();
        }
        
        newAction.play();
        newAction.enabled = true;
        newAction.weight = 1.0;
        newAction.paused = true; // Climbing is scroll-controlled
        
        // Start at beginning of climbing animation
        newAction.time = 0;
      } else { // standing
        if (oldAction !== newAction) {
            newAction.reset();
        }
        
        newAction.play();
        newAction.enabled = true;
        newAction.weight = 1.0;
        newAction.paused = true; // Standing is scroll-controlled
      }

      // Ensure action is enabled for all states
      newAction.enabled = true;
      
      // Set weight for non-climbing states (climbing handles its own weight above)
      if (newState !== 'climbing' && newState !== 'standing') {
        newAction.weight = 1.0;
      }

      // Reset time only if not a continuous or crossfaded action
      if (newState !== 'climbing' && newState !== 'idle') {
         if (oldAction !== newAction || (newState !== 'turnToWall' && newState !== 'turnAround')) {
            newAction.time = 0;
         }
      }
      
      controller.phases[newState].action = newAction;
      this._currentAction = newAction;
    }
    
    // Removed: Crossfade setup is now part of 'climbing' transition logic when coming from 'turnToWall'
    // if (newState === 'crossfade') {
    //  this._setupCrossfade(); // This method is being removed
    // }
    
    controller.currentState = newState;
    controller.targetState = newState;
    controller.forceUpdate = true;
  }
  
  _getActionForState(state) {
    switch (state) {
      case 'idle': return this._idleAction;
      case 'turnToWall': return this._turnToWallAction;
      // case 'crossfade': // crossfade state removed
      case 'climbing': return this._climbingAction;
      case 'standing': return this._standingAction;
      case 'turnAround': return this._turnAroundAction; // 🔥 Back to proper turn-around animation
      default: return null;
    }
  }
  
  _setupCrossfade() {
    const controller = this._animationController;
    
    // Set up turn-to-wall action for crossfade
    if (this._turnToWallAction) {
      this._turnToWallAction.reset();
      this._turnToWallAction.play();
      this._turnToWallAction.paused = true;
      this._turnToWallAction.enabled = true;
      this._turnToWallAction.time = this._turnToWallAction.getClip().duration * 0.5; // Mid-turn pose
      this._turnToWallAction.weight = 1.0;
    }
    
    // Set up climbing action for crossfade
    if (this._climbingAction) {
      this._climbingAction.reset();
      this._climbingAction.play();
      this._climbingAction.paused = true;
      this._climbingAction.enabled = true;
      this._climbingAction.time = 0;
      this._climbingAction.weight = 0.0;
    }
    
    controller.crossfade.active = true;
    controller.crossfade.fromAction = this._turnToWallAction;
    controller.crossfade.toAction = this._climbingAction;
  }
  
  _updateCurrentAnimation(scrollOffset, deltaTime) {
    const controller = this._animationController;
    const state = controller.currentState;
    const phases = controller.phases;
    
    // Calculate progress within current phase
    const phase = phases[state];
    if (!phase) return;
    
    const phaseProgress = Math.max(0, Math.min(1, 
      (scrollOffset - phase.start) / (phase.end - phase.start)
    ));
    
    // 🔥 PERFORMANCE: Early exit for idle state
    if (state === 'idle') return;
    
    // 🔥 PERFORMANCE: Cache current action to avoid repeated property access
    const currentAction = this._currentAction;
    if (!currentAction) return;
    
    // Update animation based on state (idle already handled above)
    switch (state) {
        
      case 'turnToWall':
        // 🔥 PERFORMANT + STABLE: Only configure once, then just update time
        if (currentAction === this._turnToWallAction) {
          const duration = this._turnToWallAction.getClip().duration;
          const slowProgress = Math.max(0, Math.min(1, phaseProgress * 0.4)); // 50% slower (was 0.6)
          const targetTime = duration * slowProgress;
          
          // Only configure if not already set up correctly (using cached action)
          if (!currentAction.isRunning() || !currentAction.paused || currentAction.weight !== 1.0) {
            currentAction.reset();
            currentAction.play();
            currentAction.enabled = true;
            currentAction.paused = true;
            currentAction.weight = 1.0;
          }
          
          // Just update time - much more performant
          currentAction.time = targetTime;
        }
        break;
        
      // case 'crossfade': // crossfade state and _updateCrossfade method removed
        // this._updateCrossfade(phaseProgress);
        // break;
        
      case 'climbing':
        if (currentAction === this._climbingAction) {
          const duration = this._climbingAction.getClip().duration;
          const fastProgress = Math.max(0, phaseProgress * 1.7); // Clamped progress
          const targetTime = (duration * fastProgress) % duration;
          
          // Only configure if not already set up correctly
          if (!currentAction.isRunning() || !currentAction.paused || currentAction.weight !== 1.0) {
            currentAction.reset();
            currentAction.play();
            currentAction.enabled = true;
            currentAction.paused = true;
            currentAction.weight = 1.0;
          }
          
          // Just update time - much more performant
          currentAction.time = targetTime;
        }
        break;
        
      case 'standing':
        if (currentAction === this._standingAction) {
          const duration = this._standingAction.getClip().duration;
          const clampedProgress = Math.max(0, Math.min(1, phaseProgress));
          const targetTime = duration * clampedProgress;
          
          // DEBUG: Log standing animation updates
          if (DEBUG_MODE && Math.random() < 0.05) {
            console.log('🔥 STANDING ANIMATION UPDATE:', {
              scrollOffset: scrollOffset.toFixed(3),
              phaseProgress: clampedProgress.toFixed(3),
              targetTime: targetTime.toFixed(3),
              duration: duration.toFixed(3),
              actionName: this._standingAction.getClip().name,
              currentTime: currentAction.time.toFixed(3)
            });
          }
          
          // Only configure if not already set up correctly
          if (!currentAction.isRunning() || !currentAction.paused || currentAction.weight !== 1.0) {
            currentAction.reset();
            currentAction.play();
            currentAction.enabled = true;
            currentAction.paused = true;
            currentAction.weight = 1.0;
            
            if (DEBUG_MODE) {
              console.log('🔥 STANDING ACTION CONFIGURED:', {
                running: currentAction.isRunning(),
                paused: currentAction.paused,
                weight: currentAction.weight,
                enabled: currentAction.enabled
              });
            }
          }
          
          // Just update time - much more performant
          currentAction.time = targetTime;
        } else {
          if (DEBUG_MODE) {
            console.log('🔥 STANDING ACTION MISMATCH!', {
              currentAction: currentAction?.getClip().name,
              expectedAction: this._standingAction?.getClip().name
            });
          }
        }
        
        // 🔥 CLEAN POSITION ADJUSTMENT: Move character down during standing
        this._applyStandingPositionAdjustment(phaseProgress, scrollOffset);
        break;
        
      case 'turnAround':
        // 🔥 PERFORMANT + STABLE: Only configure once, then just update time
        if (currentAction === this._turnAroundAction) {
          const duration = this._turnAroundAction.getClip().duration;
          const slowProgress = Math.max(0, Math.min(1, phaseProgress * 0.5)); // Increased for more time: 0.27 → 0.35
          const targetTime = duration * slowProgress;
          
          // Only configure if not already set up correctly
          if (!currentAction.isRunning() || !currentAction.paused || currentAction.weight !== 1.0) {
            currentAction.reset();
            currentAction.play();
            currentAction.enabled = true;
            currentAction.paused = true;
            currentAction.weight = 1.0;
          }
          
          // Just update time - much more performant
          currentAction.time = targetTime;
        }
        break;
    }
    
    controller.stateProgress = phaseProgress;
  }
  
  _updateCrossfade(progress) {
    const controller = this._animationController;
    
    if (!controller.crossfade.active) return;
    
    const turnWeight = 1.0 - progress;
    const climbWeight = progress;
    
    if (this._turnToWallAction) {
      this._turnToWallAction.weight = turnWeight;
    }
    
    if (this._climbingAction) {
      this._climbingAction.weight = climbWeight;
    }
    
    controller.crossfade.progress = progress;
    controller.crossfade.fromWeight = turnWeight;
    controller.crossfade.toWeight = climbWeight;
  }
  
  _applyMixerUpdate(deltaTime) {
    const controller = this._animationController;
    
    if (!this._mixer) {
      if (DEBUG_MODE && Math.random() < 0.01) {
        console.log('🔥 MIXER UPDATE FAILED: No mixer available');
      }
      return;
    }
    
    // SINGLE MIXER UPDATE
    const state = controller.currentState;

    if (state === 'idle') {
      // Only idle plays out over time using deltaTime
      this._mixer.update(deltaTime);
      
              // Optional: Debug logging for idle
        if (DEBUG_MODE && Math.random() < 0.02) {
          console.log('🔥 IDLE MIXER UPDATE (deltaTime):', {
            deltaTime: deltaTime.toFixed(4),
            actionTime: this._currentAction?.time?.toFixed(3),
            actionRunning: this._currentAction?.isRunning(),
            actionPaused: this._currentAction?.paused
          });
        }
    } else {
      // 🔥 PERFORMANT: Single mixer update for all scroll-controlled states
      // Only update pose to current action.time without advancing time
      this._mixer.update(0);
      
      // Optional: Debug logging for scroll-controlled states
      if (DEBUG_MODE && Math.random() < 0.02) {
         console.log(`🔥 ${state.toUpperCase()} PERFORMANT UPDATE:`, {
          actionTime: this._currentAction?.time?.toFixed(3),
          actionPaused: this._currentAction?.paused,
          scrollControlled: true,
          optimized: true
        });
      }
    }
  }
  
  _applyRotationOverrides(scrollOffset) {
    const controller = this._animationController;
    
    if (!this._climber) return;
    
    switch (controller.currentState) {
      case 'idle':
        this._climber.rotation.y = 0; // Face camera
        break;
        
      case 'turnToWall':
        // 🔥 START AT 0° - Animation turns from away to us, we want to end facing wall
        this._climber.rotation.y = 0; // Start at 0°, animation turns to face wall
        break;
        
      // case 'crossfade': // This state is removed. Rotation during transition should be handled by animations or climbing state.
        // const crossfadeProgress = controller.crossfade.progress;
        // this._climber.rotation.y = -(Math.PI * 0.3) - (crossfadeProgress * Math.PI * 0.7);
        // break;
        
      case 'climbing':
        // Face the wall during climbing (-180°)
        this._climber.rotation.y = -Math.PI; // 🔥 FIXED: Negative for left turn
        break;
        
      case 'standing':
        // Keep facing the wall during standing (-180°)
        this._climber.rotation.y = -Math.PI; // 🔥 FIXED: Negative for left turn
        break;
        
      case 'turnAround':
        // 🔥 START AT -180° - Animation turns from away to us, we want to end facing camera
        this._climber.rotation.y = -Math.PI; // Start at -180°, animation turns to face camera
        break;
    }
  }

  // 🔥 SMOOTH HEAD SCALE FADE-IN WHEN CHARACTER LOADS
  _startHeadScaleFadeIn() {
    if (!this._headBone) return;
    
    // Start from original scale (1.0)
    this._headBone.scale.set(
      this._originalHeadScale.x,
      this._originalHeadScale.y,
      this._originalHeadScale.z
    );
    
    // Set current to original
    this._headScaleCurrent = { ...this._originalHeadScale };
    
    // Set target to default scale (1.3)
    const defaultScale = this._defaultSettings.headScale;
    this._headScaleTarget = {
      x: this._originalHeadScale.x * defaultScale,
      y: this._originalHeadScale.y * defaultScale,
      z: this._originalHeadScale.z * defaultScale
    };
    
    console.log('🔥 HEAD SCALE FADE-IN STARTED: Growing from 1.0 to', defaultScale);
  }
    };
  }
  
  return TilesClass;
}

// Export factory function
export default function createTiles(camera, scene, pointLight, app, lights = {}) {
  const TilesClass = createTilesClass();
  if (!TilesClass) {
    throw new Error('Three.js not available for Tiles');
  }
  return new TilesClass(camera, scene, pointLight, app, lights);
}