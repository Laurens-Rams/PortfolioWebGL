import { Group, Vector3, MathUtils, AnimationMixer } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { addGLBToTile, addGLBToTileNoAnimation } from './handleGLBModels';
import { CLIMBING_CONFIG } from '../ClimbingWall';
import store from "../store";

export default class Tiles extends Group {
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
    this._gltfLoader = new GLTFLoader(store.loaderManager);
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
        turnToWall: { start: 0.005, end: 0.08, action: null },   // 🔥 MUCH SLOWER: 0.5-8% (was 6%, now super deliberate)
        crossfade: { start: 0.08, end: 0.095, action: null },   // 🔥 LIGHTNING FAST: 8-9.5% (was 3%, now 1.5% - super snappy)
        climbing: { start: 0.095, end: 0.58, action: null },   // 🔥 MORE TRIMMED: 9.5-58% (gave up more climbing time)
        standing: { start: 0.58, end: 0.90, action: null },   // 🔥 ADJUSTED: 58-90% (moved up further)
        turnAround: { start: 0.90, end: 1.0, action: null } // 🔥 90-100%
      },
      
      // Crossfade system
      crossfade: {
        active: false,
        progress: 0,
        fromAction: null,
        toAction: null,
        fromWeight: 0,
        toWeight: 0
      },
      
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
    
    // UI System
    this.uiVisible = false;
  }

  _init() {
    // Load the climbing character
    this._loadClimber();
    
    // Initialize UI overlay system

    
    // Load standup animation - TEMPORARILY DISABLED
    // this._loadStandupAnimation();
  }

  _loadClimber() {
    const climberPath = '/fuckOFFFFF.glb';
    
    this._gltfLoader.load(
      climberPath, 
      (gltf) => {
      this._climber = gltf.scene;
      this._climber.scale.set(20, 20, 20);
      // Set initial position - character will stay here and animations will handle movement
      this._climber.position.set(0, CLIMBING_CONFIG.CAMERA_START_Y - 400, -1400);
      this._climber.rotation.set(0, 0, 0); // Face camera initially
      this._climber.visible = true;
      
      // Set up animation mixer
      this._mixer = new AnimationMixer(this._climber);
      
      // Store all animations
      this._allAnimations = gltf.animations;
      
      // Set up our four main animations - UPDATED ASSIGNMENTS (with safety checks)
      console.log('🔥 Total animations found:', this._allAnimations.length);
      
      // Safety checks before creating actions (149 animations = indices 0-148)
      if (this._allAnimations[148]) {
        this._idleAction = this._mixer.clipAction(this._allAnimations[148]); // Idle at start (was 149, now 148)
      } else {
        console.error('🔥 Animation 148 (idle) not found!');
      }
      
      if (this._allAnimations[5]) {
        this._climbingAction = this._mixer.clipAction(this._allAnimations[5]); // Climbing during scroll
      } else {
        console.error('🔥 Animation 5 (climbing) not found!');
      }
      
      if (this._allAnimations[110]) {
        this._standingAction = this._mixer.clipAction(this._allAnimations[110]); // Standing up (was 111, now 110)
      } else {
        console.error('🔥 Animation 110 (standing) not found!');
      }
      
          // RESTORED: Use proper turn-around animation (0) - now that mixer.update(0) is fixed
      if (this._allAnimations[0]) {
      this._turnAroundAction = this._mixer.clipAction(this._allAnimations[0]); // Turn around - RESTORED
      console.log('🔥 Using PROPER turn-around animation (0) - mixer fixed!');
      } else {
        console.error('🔥 Animation 0 (turn around) not found!');
      }
      
          // CORRECT: Use animation 0 (turn) for turn-to-wall phase - but create separate action
    if (this._allAnimations[0]) {
      // Create a separate action instance for turn-to-wall (different from turn-around)
      this._turnToWallAction = this._mixer.clipAction(this._allAnimations[0].clone());
      console.log('🔥 Using animation 0 (TURN) for turn-to-wall - SEPARATE ACTION!');
    } else {
      console.error('🔥 Animation 0 (turn) not found for turn-to-wall!');
      }
      
      // Configure animations (only if they exist)
      if (this._idleAction) {
        this._idleAction.setLoop(2, Infinity);
        this._idleAction.timeScale = 0.5; // Faster for testing - was 0.02
      }
      
      if (this._climbingAction) {
        this._climbingAction.setLoop(2, Infinity);
        this._climbingAction.timeScale = 1.0;
      }
      
      if (this._standingAction) {
        this._standingAction.setLoop(2, 1); // No loop for standing
        this._standingAction.timeScale = 1.0;
      }
      
      if (this._turnAroundAction) {
        this._turnAroundAction.setLoop(2, 1); // No loop for turn around
        this._turnAroundAction.timeScale = 1.0;
      }
      
      if (this._turnToWallAction) {
        this._turnToWallAction.setLoop(2, 1); // No loop for turn to wall
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
        
        console.log('🔥 IDLE ACTION STORED IN CONTROLLER PHASES');
        console.log('🔥 INITIAL SCROLL OFFSET:', this._currentScrollOffset);
        console.log('🔥 ANIMATION CONTROLLER TIMING INITIALIZED:', this._animationController.lastUpdateTime);
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
      this._createDebugControls();
      
      // Initialize keyboard events
      this._initEvents();
      
      // DEBUG: Log initial setup with more details
      console.log('🔥 Climber loaded - Initial idle setup:', {
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
      setTimeout(() => {
        console.log('🔥 IDLE ACTION TEST (after 1 second):', {
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
           console.log('🔥 FORCED MIXER UPDATE - Time after update:', this._currentAction?.time);
         }
         
         // FORCE IDLE RESTART - Nuclear option
         if (this._idleAction) {
           console.log('🔥 FORCING IDLE RESTART...');
           this._idleAction.stop();
           this._idleAction.reset();
           this._idleAction.weight = 1.0;
           this._idleAction.enabled = true;
           this._idleAction.paused = false;
           this._idleAction.play();
           this._currentAction = this._idleAction;
           
           // Force mixer update after restart
           this._mixer.update(0.016);
           
           console.log('🔥 IDLE FORCED RESTART COMPLETE:', {
             isRunning: this._idleAction.isRunning(),
             paused: this._idleAction.paused,
             weight: this._idleAction.weight,
             time: this._idleAction.time
           });
         }
       }, 1000);
      
      // DEBUG: Log all available animations
      console.log('🔥 Available animations:', this._allAnimations.map((anim, index) => ({
        index,
        name: anim.name,
        duration: anim.duration.toFixed(2)
      })));
      
      // DEBUG: Log which animations we're actually using
      console.log('🔥 ANIMATION ASSIGNMENTS:', {
        idle: this._idleAction ? `${148}: ${this._allAnimations[148]?.name}` : 'MISSING',
        climbing: this._climbingAction ? `${5}: ${this._allAnimations[5]?.name}` : 'MISSING',
        standing: this._standingAction ? `${110}: ${this._allAnimations[110]?.name}` : 'MISSING',
              turnAround: this._turnAroundAction ? `${0}: ${this._allAnimations[0]?.name}` : 'MISSING',
      turnToWall: this._turnToWallAction ? `${this._turnToWallAction ? this._getAnimationIndex(this._turnToWallAction) : 'UNKNOWN'}: ${this._turnToWallAction?.getClip().name}` : 'MISSING'
      });
      
      this.add(this._climber);
    },
    // Progress callback
    (progress) => {
      console.log('🔥 Loading progress:', (progress.loaded / progress.total * 100).toFixed(1) + '%');
    },
    // Error callback
    (error) => {
      console.error('🔥 Failed to load climber GLB:', error);
      console.error('🔥 Check if /fuckOFFFFF.glb exists in the public folder');
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

    this._allAnimations.forEach((anim, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.text = `Animation ${index}: ${anim.name}`;
      animSelect.appendChild(option);
    });
    
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
      console.log('🔥 Loading animation:', {
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
      console.log('🔥 Head tracking initialized with blinking system');
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
          console.log('🔥 Found eye bone:', child.name);
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
          console.log('🔥 Found face mesh with morphs:', child.name, 'Morph count:', child.morphTargetInfluences.length);
          
          // Log available morph targets
          if (child.morphTargetDictionary) {
            Object.keys(child.morphTargetDictionary).forEach(morphName => {
              if (morphName.toLowerCase().includes('blink') || 
                  morphName.toLowerCase().includes('eye') ||
                  morphName.toLowerCase().includes('close')) {
                console.log('🔥 Found blink morph:', morphName, 'at index:', child.morphTargetDictionary[morphName]);
              }
            });
          }
        }
      }
    });
    
    console.log('🔥 Total eye bones found:', this._eyeBones.length);
    console.log('🔥 Total face meshes found:', this._faceMeshes.length);
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
    if (Math.random() < 0.1) {
      console.log('🔥 Character blink started');
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
    this._camera.position.x = -450; // Fixed left position for cinematic view
    this._camera.position.z = -300; // Fixed depth
    this._camera.rotation.set(-0.3, 0, 0); // Fixed downward tilt
    
    // CRITICAL: Character must move WITH camera during climbing phases
    // This is the ONLY character positioning logic we need
      if (this._climber) {
      // Character follows camera movement but with offset
      this._climber.position.y = targetY - 700; // 700 units below camera
        this._climber.position.x = 0; // Always centered
        
        // Gradually move character closer as they climb (bigger appearance)
        const startZ = -1400; // Further away at start
      const endZ = -1800;   // Closer at end (bigger)
      this._climber.position.z = MathUtils.lerp(startZ, endZ, scrollOffset);
      
      // Scale stays consistent
      this._climber.scale.set(20, 20, 20);
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
    
    console.log('🔥 Switching to standing - SIMPLE');
    
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
    
    console.log('🔥 Switching to idle - SIMPLE');
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
    this._idleAction.timeScale = 0.5; // Faster for testing - was 0.02
    
    this._currentAction = this._idleAction;
    
    // DEBUG: Log idle animation details
    console.log('🔥 Idle animation started:', {
      name: this._idleAction.getClip().name,
      duration: this._idleAction.getClip().duration,
      paused: this._idleAction.paused,
      timeScale: this._idleAction.timeScale,
      time: this._idleAction.time
    });
  }

  _switchToTurnToWall() {
    if (!this._canChangeState('turnToWall')) return;
    
    console.log('🔥 Switching to turn to wall - RESTORED');
    
    // Reset crossfade initialization when going back to turn-to-wall
    this._setupCrossfade();
    
    this._animationController.currentState = 'turnToWall';
    this._isIdle = false;
    this._markStateChange();
    
    // Stop current action completely
    if (this._currentAction) {
      console.log('🔥 TURN-TO-WALL: Stopping current action:', this._currentAction.getClip().name);
      this._currentAction.stop();
      this._currentAction.weight = 0;
    }
    
    // DEBUG: Check if turn-to-wall action exists
    if (!this._turnToWallAction) {
      console.error('🔥 TURN-TO-WALL: No turn-to-wall action available!');
      return;
    }
    
    // Start turn-to-wall action fresh - PAUSED for scroll control
    console.log('🔥 TURN-TO-WALL: Starting action:', this._turnToWallAction.getClip().name);
    this._turnToWallAction.reset();
    this._turnToWallAction.weight = 1.0;
    this._turnToWallAction.play();
    this._turnToWallAction.paused = true; // CRITICAL: Paused for manual control
    this._turnToWallAction.time = 0;
    
    this._currentAction = this._turnToWallAction;
    
    // DEBUG: Log turn to wall animation details
    console.log('🔥 Turn to wall animation started:', {
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
    
    console.log('🔥 Switching to turn around - SIMPLE');
    
    // Hip position will be captured at the end of standing animation (95% scroll)
    // and used for correction during turn-around
    
    this._animationController.currentState = 'turnAround';
    this._isIdle = false;
    this._markStateChange();
    
    // Stop current action completely
    if (this._currentAction) {
      console.log('🔥 TURN-AROUND: Stopping current action:', this._currentAction.getClip().name);
      this._currentAction.stop();
      this._currentAction.weight = 0;
    }
    
    // DEBUG: Check if turn-around action exists
    if (!this._turnAroundAction) {
      console.error('🔥 TURN-AROUND: No turn-around action available!');
      return;
    }
    
    // Start turn around action fresh - PAUSED for scroll control
    console.log('🔥 TURN-AROUND: Starting action:', this._turnAroundAction.getClip().name);
    this._turnAroundAction.reset();
    this._turnAroundAction.weight = 1.0;
    this._turnAroundAction.play();
    this._turnAroundAction.paused = true; // CRITICAL: Paused for manual control
    this._turnAroundAction.time = 0;
    
    // Set initial rotation to face away (180°) - animation will turn character to face camera
    if (this._climber) {
      this._climber.rotation.y = Math.PI; // Start facing away (180°)
      console.log('🔥 TURN-AROUND: Set initial rotation to 180° (facing away)');
    }
    
    this._currentAction = this._turnAroundAction;
    
    // Check hip position after switching and store the target position
    if (this._hipBone && this._originalHipPosition) {
      const newHipPosition = this._hipBone.position.clone();
      const hipPositionDiff = newHipPosition.clone().sub(this._originalHipPosition);
      console.log('🔥 Hip position after turn around:', newHipPosition);
      console.log('🔥 Hip position difference (turn - standing):', hipPositionDiff);
      
      // Store the offset for compensation
      this._turnAroundHipOffset = hipPositionDiff.clone();
      
      console.log('🔥 Will maintain hip at position:', this._originalHipPosition);
    }
    
    // DEBUG: Log turn around animation details
    console.log('🔥 Turn around animation started:', {
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
    // Only search for hip bone if we haven't found it yet
    if (!this._hipBone && this._climber) {
      let currentHipPosition = null;
      
      this._climber.traverse((child) => {
        if (!this._hipBone && (child.isBone || child.type === 'Bone')) {
          const boneName = child.name.toLowerCase();
          if (boneName.includes('hip') || boneName.includes('root') || boneName.includes('pelvis')) {
            this._hipBone = child;
            currentHipPosition = child.position.clone();
            console.log('🔥 Found and cached hip bone:', child.name, 'Position:', currentHipPosition);
            
            // Store the original position (where we want to keep it)
            this._originalHipPosition = currentHipPosition.clone();
            return; // Stop traversing once we find it
          }
        }
      });
    }
  }

  // REMOVED: _handlePortfolioCamera - camera now moves linearly, character positioning handled by animations

  update(deltaTime, mouseX, mouseY) {
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
      if (Math.random() < 0.02) {
        console.log('🔥 CALLING ANIMATION CONTROLLER:', {
          shouldSkipFrame,
          deltaTime: deltaTime.toFixed(4),
          scrollOffset: this._currentScrollOffset.toFixed(3)
        });
      }
      this._updateAnimationController(this._currentScrollOffset, deltaTime);
    } else {
      // DEBUG: Log when frames are skipped
      if (Math.random() < 0.01) {
        console.log('🔥 FRAME SKIPPED - Animation controller not called');
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
      
      console.log('🔥 HIP COMPENSATION APPLIED:', {
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
  _applyStandingPositionCompensation(standingProgress) {
    if (!this._hipBone) {
      this._cacheHipBoneReference();
      if (!this._hipBone) return;
    }
    
    // Cache the initial hip position at the start of standing animation
    if (!this._standingStartHipPosition) {
      const hipWorldPosition = new Vector3();
      this._hipBone.getWorldPosition(hipWorldPosition);
      this._standingStartHipPosition = hipWorldPosition.clone();
      this._standingStartCharacterPosition = this._climber.position.clone();
      
      console.log('🔥 CACHED standing start hip position:', this._standingStartHipPosition);
      console.log('🔥 CACHED standing start character position:', this._standingStartCharacterPosition);
    }
    
    // Get current hip world position
    const currentHipWorldPosition = new Vector3();
    this._hipBone.getWorldPosition(currentHipWorldPosition);
    
    // Calculate how much the hip has moved from the start position
    const hipMovement = new Vector3().subVectors(currentHipWorldPosition, this._standingStartHipPosition);
    
    // Apply counter-movement to the character to keep it in the same visual position
    // We subtract the hip movement from the character position
    const compensatedPosition = new Vector3().subVectors(this._standingStartCharacterPosition, hipMovement);
    this._climber.position.copy(compensatedPosition);
    
    // DEBUG: Log position compensation occasionally
    if (Math.random() < 0.1) { // 10% of the time for better debugging
      console.log('🔥 STANDING POSITION COMPENSATION:', {
        progress: standingProgress.toFixed(3),
        startHip: this._standingStartHipPosition ? {
          x: this._standingStartHipPosition.x.toFixed(2),
          y: this._standingStartHipPosition.y.toFixed(2),
          z: this._standingStartHipPosition.z.toFixed(2)
        } : 'NULL',
        currentHip: {
          x: currentHipWorldPosition.x.toFixed(2),
          y: currentHipWorldPosition.y.toFixed(2),
          z: currentHipWorldPosition.z.toFixed(2)
        },
        hipMovement: {
          x: hipMovement.x.toFixed(2),
          y: hipMovement.y.toFixed(2),
          z: hipMovement.z.toFixed(2)
        },
        compensatedPos: {
          x: compensatedPosition.x.toFixed(2),
          y: compensatedPosition.y.toFixed(2),
          z: compensatedPosition.z.toFixed(2)
        },
        hasHipBone: !!this._hipBone,
        hasStartPos: !!this._standingStartHipPosition
      });
    }
  }

  // 🔥 CLEAN POSITION ADJUSTMENT: Move character down during standing phase
  _applyStandingPositionAdjustment(standingProgress, scrollOffset) {
    if (!this._climber) return;
    
    // Cache initial climbing position when first entering standing
    if (!this._climbingEndPosition) {
      this._climbingEndPosition = this._climber.position.clone();
    }
    
    // Define how much to move (adjust these values as needed)
    const STANDING_DROP_AMOUNT = -300;  // 🔥 LESS DOWN: was 150, now 20 pixels
    const STANDING_RIGHT_AMOUNT = 80; // 🔥 DRIFT RIGHT: 80 pixels to the right
    const STANDING_CLOSER_AMOUNT = 300; // 🔥 MOVE CLOSER: 120 pixels toward camera
    
    // Calculate smooth position adjustments based on standing progress
    // Progress 0 = at climbing end position, Progress 1 = adjusted position
    const dropOffset = standingProgress * STANDING_DROP_AMOUNT;
    const rightOffset = standingProgress * STANDING_RIGHT_AMOUNT;
    const closerOffset = standingProgress * STANDING_CLOSER_AMOUNT;
    
    // Apply the position adjustments (Y down, X right, Z closer)
    this._climber.position.y = this._climbingEndPosition.y - dropOffset;
    this._climber.position.x = this._climbingEndPosition.x + rightOffset;
    this._climber.position.z = this._climbingEndPosition.z + closerOffset;
    
    // 🔥 CRITICAL: Reset cached position when leaving standing state
    const phases = this._animationController.phases;
    if (scrollOffset < phases.standing.start || scrollOffset > phases.standing.end) {
      this._climbingEndPosition = null;
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
    
    // Adjust horizontal direction based on character orientation
    let horizontalMultiplier = 1; // Default for idle, standing, turnaround (facing camera)
    if (this._animationController.currentState === 'climbing') {
      horizontalMultiplier = -1; // Flip when climbing (facing wall)
    }
    
    const mouseHeadRotationY = this._mouseX * mouseInfluenceHorizontal * horizontalMultiplier;
    const mouseHeadRotationX = -this._mouseY * mouseInfluenceVertical;
    
    // Debug logging to verify head tracking is working
    if (Math.random() < 0.02) { // Log 2% of the time
      console.log('🔥 Head tracking:', { 
        state: this._animationController.currentState,
        mouseX: this._mouseX?.toFixed(3), 
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
      // UPDATED: Climbing starts after extended crossfade zone
      const climbingProgress = Math.max(0, Math.min(1, (scrollOffset - 0.08) / (0.707 - 0.08)));
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
    if (this._currentAction === this._standingAction) {
      // FIXED: Use new range (70.7-95%) and clamp values
      const standingProgress = Math.max(0, Math.min(1, (scrollOffset - 0.707) / (0.95 - 0.707)));
      const standingDuration = this._standingAction.getClip().duration;
      this._standingAction.time = standingDuration * standingProgress;
      
      // CRITICAL: Force mixer to update pose when animation is paused
      this._mixer.update(0);
      
      // POSITION COMPENSATION: Keep character in same visual position during standing animation
      // IMPORTANT: Apply AFTER mixer update so we compensate for the updated pose
      this._applyStandingPositionCompensation(standingProgress);
      
      // CAPTURE HIP WORLD POSITION AT END OF STANDING ANIMATION (when progress >= 0.95)
      if (standingProgress >= 0.95 && !this._standingEndHipPosition) {
        this._cacheHipBoneReference();
        if (this._hipBone) {
          // Get the WORLD position of the hip bone (character position + hip bone position)
          const hipWorldPosition = new Vector3();
          this._hipBone.getWorldPosition(hipWorldPosition);
          this._standingEndHipPosition = hipWorldPosition.clone();
          
          // Also store the character's world position for reference
          this._standingEndCharacterPosition = this._climber.position.clone();
          
          console.log('🔥 CAPTURED standing end hip WORLD position at 95% progress:', this._standingEndHipPosition);
          console.log('🔥 CAPTURED standing end character position:', this._standingEndCharacterPosition);
        }
      }
      
      // DEBUG: Log standing animation progress (reduced logging)
      if (Math.random() < 0.05) { // Log 5% of the time
        console.log('🔥 Standing animation:', {
          scrollOffset: scrollOffset.toFixed(3),
          progress: standingProgress.toFixed(3),
          time: this._standingAction.time.toFixed(3),
          duration: standingDuration.toFixed(3)
        });
      }
    }
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
    
    if (tPoseDetected) {
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
    // Keyboard event for UI toggle
    document.addEventListener('keydown', (event) => {
      if (event.key === 'c' || event.key === 'C') {
        this._toggleUIControls();
      }
    });
  }

  _toggleUIControls() {
    this.uiVisible = !this.uiVisible;
    
    // Toggle debug panel
    if (this._debugPanel) {
      this._debugPanel.style.display = this.uiVisible ? 'block' : 'none';
    }
    
    // Toggle performance display if it exists
    const performanceDisplay = document.querySelector('.performance-display');
    if (performanceDisplay) {
      performanceDisplay.style.display = this.uiVisible ? 'block' : 'none';
    }
    
    console.log('🔥 UI Controls:', this.uiVisible ? 'VISIBLE' : 'HIDDEN');
  }

  dispose() {
    // Clean up position cache
    this._climbingEndPosition = null;
    
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
      console.log('🔥 ANIMATION CONTROLLER TIMING FIXED ON FIRST RUN:', now);
    }
    
    // Rotation tracking (debug removed for performance)
    
    // Performance throttling - TEMPORARILY DISABLED FOR DEBUGGING
    if (false && now - controller.lastUpdateTime < controller.updateThrottle && !controller.forceUpdate) {
      // DEBUG: Log when throttling blocks updates
      if (Math.random() < 0.01) {
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
    
    if (scrollOffset <= phases.idle.end) return 'idle';
    if (scrollOffset <= phases.turnToWall.end) return 'turnToWall';
    if (scrollOffset <= phases.crossfade.end) return 'crossfade';
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
    
    // Animation transition (debug removed for performance)
    
    // Stop current action cleanly
    if (controller.phases[oldState]?.action) {
      const oldAction = controller.phases[oldState].action;
      oldAction.weight = 0;
      oldAction.enabled = false;
    }
    
    // Set up new action
    const newAction = this._getActionForState(newState);
    if (newAction) {
      // CRITICAL FIX: Don't reset idle action if it's already running properly
      if (newState === 'idle' && newAction.isRunning() && !newAction.paused) {
        console.log('🔥 IDLE: Keeping existing idle animation running - no reset needed');
        // Just ensure proper settings without resetting
        newAction.weight = 1.0;
        newAction.enabled = true;
      } else {
        // Reset for all other states or if idle needs to be restarted
        newAction.reset();
        newAction.play();
        newAction.paused = (newState !== 'idle'); // Only idle runs freely
        newAction.weight = 1.0;
        newAction.enabled = true;
        newAction.time = 0;
        
        // Animation reset (debug removed for performance)
      }
      
      controller.phases[newState].action = newAction;
      this._currentAction = newAction;
    }
    
    // Handle special crossfade setup
    if (newState === 'crossfade') {
      this._setupCrossfade();
    }
    
    controller.currentState = newState;
    controller.targetState = newState;
    controller.forceUpdate = true;
  }
  
  _getActionForState(state) {
    switch (state) {
      case 'idle': return this._idleAction;
      case 'turnToWall': return this._turnToWallAction;
      case 'crossfade': return this._climbingAction; // Primary action for crossfade
      case 'climbing': return this._climbingAction;
      case 'standing': return this._standingAction;
      case 'turnAround': return this._turnAroundAction;
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
    
    // Update animation based on state
    switch (state) {
      case 'idle':
        // Idle runs freely - no manual time control
        break;
        
      case 'turnToWall':
        if (this._turnToWallAction) {
          const duration = this._turnToWallAction.getClip().duration;
          this._turnToWallAction.time = duration * 0.5 * phaseProgress; // Use 50% of animation
        }
        break;
        
      case 'crossfade':
        this._updateCrossfade(phaseProgress);
        break;
        
      case 'climbing':
        if (this._climbingAction) {
          const duration = this._climbingAction.getClip().duration;
          const fastProgress = phaseProgress * 1.7; // 🔥 SLOWER: 1.5x speed for fewer loops
          this._climbingAction.time = (duration * fastProgress) % duration;
        }
        break;
        
      case 'standing':
        if (this._standingAction) {
          const duration = this._standingAction.getClip().duration;
          this._standingAction.time = duration * phaseProgress;
        }
        
        // 🔥 CLEAN POSITION ADJUSTMENT: Move character down during standing
        this._applyStandingPositionAdjustment(phaseProgress, scrollOffset);
        break;
        
      case 'turnAround':
        if (this._turnAroundAction) {
          const duration = this._turnAroundAction.getClip().duration;
          this._turnAroundAction.time = duration * phaseProgress;
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
      if (Math.random() < 0.01) {
        console.log('🔥 MIXER UPDATE FAILED: No mixer available');
      }
      return;
    }
    
    // SINGLE MIXER UPDATE - no more scattered mixer.update(0) calls
    if (controller.currentState === 'idle') {
      // Only idle uses deltaTime for continuous animation
      this._mixer.update(deltaTime);
      
      // DEBUG: Log idle mixer updates occasionally
      if (Math.random() < 0.02) {
        console.log('🔥 IDLE MIXER UPDATE:', {
          deltaTime: deltaTime.toFixed(4),
          actionTime: this._currentAction?.time?.toFixed(3),
          actionRunning: this._currentAction?.isRunning(),
          actionPaused: this._currentAction?.paused
        });
      }
    } else {
      // All scroll-controlled animations use forced pose updates
      this._mixer.update(0);
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
        // Smoothly transition from 0° to starting wall-face position (LEFT TURN)
        const turnProgress = controller.stateProgress;
        this._climber.rotation.y = -turnProgress * Math.PI * 0.3; // 🔥 FIXED: Negative for left turn
        break;
        
      case 'crossfade':
        // Smoothly transition to face wall completely (LEFT TURN)
        const crossfadeProgress = controller.crossfade.progress;
        this._climber.rotation.y = -(Math.PI * 0.3) - (crossfadeProgress * Math.PI * 0.7); // 🔥 FIXED: Negative for left turn
        break;
        
      case 'climbing':
        // Face the wall during climbing (-180°)
        this._climber.rotation.y = -Math.PI; // 🔥 FIXED: Negative for left turn
        break;
        
      case 'standing':
        // Keep facing the wall during standing (-180°)
        this._climber.rotation.y = -Math.PI; // 🔥 FIXED: Negative for left turn
        break;
        
      case 'turnAround':
        // Let the turn-around animation handle rotation naturally - DON'T OVERRIDE
        break;
    }
  }
}