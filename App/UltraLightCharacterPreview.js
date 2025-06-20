// 🔥 ULTRA-LIGHT CHARACTER PREVIEW - REAL CHARACTER
// Loads the 7MB ultra-light version of your actual character
// Same skeleton, animations, and look - just lower quality

import {
  Group,
  AnimationMixer,
  Vector3,
  LoopRepeat
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { performanceMonitor } from './PerformanceMonitor.js';

export class UltraLightCharacterPreview extends Group {
  constructor() {
    super();
    
    this.name = 'UltraLightCharacterPreview';
    this.mixer = null;
    this.animations = [];
    this.idleAction = null;
    this.isLoaded = false;
    this.animationTime = 0;
    
    // Position like the real character
    this.scale.set(20, 20, 20);
    this.position.set(0, -850, -1400);
    this.rotation.set(0, 0, 0);
    
    this._loadUltraLightCharacter();
    
    console.log('🔥 Ultra-light character preview loading...');
  }

  async _loadUltraLightCharacter() {
    const startTime = performance.now(); // Track loading time
    
    try {
      // Create GLTF loader with DRACO and Meshopt support
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/');
      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dracoLoader);
      gltfLoader.setMeshoptDecoder(MeshoptDecoder);
      
      console.log('📂 Loading ultra-light character (7MB)...');
      
      // Add timeout for slow connections
      const loadPromise = new Promise((resolve, reject) => {
        gltfLoader.load(
          '/optimized_models/character_ultra_light_4anims_compressed.glb',
          resolve,
          (progress) => {
            if (progress.total > 0) {
              const percent = (progress.loaded / progress.total * 100).toFixed(1);
              console.log(`🔥 Ultra-light loading: ${percent}%`);
            }
          },
          (error) => {
            console.error('🚨 GLTFLoader error callback triggered:', error);
            reject(error);
          }
        );
      });
      
      // Add 10 second timeout for slow connections
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Loading timeout - falling back to procedural')), 10000);
      });
      
      const gltf = await Promise.race([loadPromise, timeoutPromise]);
      
      console.log('✅ Ultra-light character loaded successfully!');
      
      // Mark character preview loaded
      performanceMonitor.markCharacterPreviewLoaded();
      
      // Add the character to this group
      this.add(gltf.scene);
      
      // Set up animation mixer
      this.mixer = new AnimationMixer(gltf.scene);
      this.animations = gltf.animations;
      
      // Set up idle animation (updated for 4-animation compressed file)
      const IDLE_ANIM_INDEX = 3; // Was 148, now 3 for compressed file
      
      if (this.animations[IDLE_ANIM_INDEX]) {
        this.idleAction = this.mixer.clipAction(this.animations[IDLE_ANIM_INDEX]);
        this.idleAction.setLoop(LoopRepeat, Infinity);
        this.idleAction.timeScale = 0.5; // Same speed as full character
        this.idleAction.play();
        
        console.log(`🎬 Ultra-light idle animation started`);
      } else {
        console.warn(`⚠️ Idle animation not found, using first available`);
        if (this.animations.length > 0) {
          this.idleAction = this.mixer.clipAction(this.animations[0]);
          this.idleAction.setLoop(LoopRepeat, Infinity);
          this.idleAction.play();
        }
      }
      
      this.isLoaded = true;
      
      // Make sure character is visible
      this.visible = true;
      gltf.scene.visible = true;
      
      // Dispatch event that character is ready
      this.dispatchEvent({ type: 'loaded' });
      
      console.log('✅ Ultra-light character preview ready!');
      console.log(`⚡ Character Preview: ${performance.now() - startTime}ms`);
      
      // Dispatch event to hide skeleton loader
      window.dispatchEvent(new CustomEvent('characterPreviewReady'));
      
      // Notify fade manager that character is loaded
      if (window.fadeInManager) {
        window.fadeInManager.setLoaded('character');
      }
      
    } catch (error) {
      console.error('❌ Failed to load ultra-light character:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Fallback to procedural preview
      this._createProceduralFallback();
    }
  }

  _createProceduralFallback() {
    console.log('🔄 Falling back to procedural character...');
    
    // Import and create the procedural preview
    import('./MinimalCharacterPreview.js').then(({ MinimalCharacterPreview }) => {
      const proceduralPreview = new MinimalCharacterPreview();
      this.add(proceduralPreview);
      this.isLoaded = true;
      this.dispatchEvent({ type: 'loaded' });
    });
  }

  update(deltaTime) {
    // Update animation mixer if loaded
    if (this.mixer && this.isLoaded) {
      this.mixer.update(deltaTime);
    } else {
      // Fallback animation for procedural preview
      this.animationTime += deltaTime;
      
      // Simple breathing effect
      const breathScale = 1 + Math.sin(this.animationTime * 0.5) * 0.02;
      this.scale.set(20 * breathScale, 20 * breathScale, 20);
    }
  }

  // Get current animation time for seamless transition
  getCurrentAnimationTime() {
    if (this.idleAction) {
      return this.idleAction.time;
    }
    return this.animationTime;
  }

  // Set animation time for seamless transition from full character
  setAnimationTime(time) {
    if (this.idleAction) {
      this.idleAction.time = time;
    } else {
      this.animationTime = time;
    }
  }

  dispose() {
    // Stop animations
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    
    // Dispose geometries and materials
    this.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
    
    console.log('🔥 Ultra-light character preview disposed');
  }
} 