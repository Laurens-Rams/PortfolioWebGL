import { Group } from 'three';
import { performanceMonitor } from './PerformanceMonitor';

export default class SplineClimbingWall extends Group {
  constructor() {
    super();
    
    this._canvas = null;
    this._isVisible = true;
    this._fadeInManager = null;
    this._splineLoaded = false;
    
    this._init();
  }
  
  setFadeInManager(fadeInManager) {
    this._fadeInManager = fadeInManager;
  }

  async _init() {
    // Create background immediately (lightweight)
    this._createBackground();
    
    // 🔥 LOAD SPLINE IMMEDIATELY - NO LAZY LOADING
    await this._loadSplineContent();
  }

  _createBackground() {
    // Create a dark background div behind everything
    this._backgroundDiv = document.createElement('div');
    this._backgroundDiv.style.position = 'fixed';
    this._backgroundDiv.style.top = '0';
    this._backgroundDiv.style.left = '0';
    this._backgroundDiv.style.width = '100%';
    this._backgroundDiv.style.height = '100%';
    this._backgroundDiv.style.zIndex = '-3'; // Behind everything
    
    // Add background to DOM
    document.body.appendChild(this._backgroundDiv);
    
    // Initialize with correct starting colors (0% scroll state)
    this.updateScroll(0);
  }

  async _loadSplineContent() {
    try {
      // 🔥 PERFORMANCE: Detect device capabilities for optimization
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLowEnd = isMobile || navigator.hardwareConcurrency <= 4;
      
      // Load the Spline climbing wall scene
      const splineUrl = 'https://prod.spline.design/VaU21x4kIO7tSaXb/scene.splinecode';
      
      // Mark start of Spline loading
      performanceMonitor.markSplineStart();
      
      console.log('🔥 Loading Spline climbing wall scene...');
      
      // 🔥 Load Spline using optimized Application API
      
      // Create canvas element
      this._canvas = document.createElement('canvas');
      this._canvas.id = 'spline-canvas';
      this._canvas.style.position = 'fixed';
      this._canvas.style.top = '0';
      this._canvas.style.left = '0';
      this._canvas.style.width = '100%';
      this._canvas.style.height = '100%';
      this._canvas.style.pointerEvents = 'auto';
      this._canvas.style.zIndex = '-1';
      this._canvas.style.opacity = '0';
      
      // Performance optimizations
      if (isLowEnd) {
        this._canvas.style.imageRendering = 'pixelated';
        this._canvas.style.filter = 'contrast(1.1)';
      }
      
      // Add to DOM
      document.body.appendChild(this._canvas);
      
      // Load Spline Application directly (should be much faster)
      const { Application } = await import('@splinetool/runtime');
      
      this._splineApp = new Application(this._canvas);
      
      // Performance optimizations
      if (this._splineApp.setPixelRatio) {
        const pixelRatio = isLowEnd ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio;
        this._splineApp.setPixelRatio(pixelRatio);
      }
      
      if (this._splineApp.setSize) {
        this._splineApp.setSize(window.innerWidth, window.innerHeight);
      }
      
      // Load the scene with timeout
      const loadPromise = this._splineApp.load(splineUrl);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Spline load timeout')), 8000);
      });
      
      await Promise.race([loadPromise, timeoutPromise]);
      
      this._splineLoaded = true;
      console.log('🔥 Spline climbing wall loaded successfully!');
      
      // Mark Spline loaded
      performanceMonitor.markSplineLoaded();
      
      // Notify fade manager that Spline is ready
      if (this._fadeInManager) {
        this._fadeInManager.setLoaded('spline');
      }
      
    } catch (error) {
      console.error('Failed to load Spline climbing wall:', error);
      
      // Fallback to shader starfield if Spline fails
      this._createFallbackWall();
      
      // Still notify fade manager even if Spline fails
      if (this._fadeInManager) {
        this._fadeInManager.setLoaded('spline');
      }
    }
  }

  createShaderStarfield(scene) {
    // Create a performant shader-based starfield
    import('three').then(({ 
      PlaneGeometry, 
      ShaderMaterial, 
      Mesh, 
      Vector2,
      AdditiveBlending 
    }) => {
      const starfieldGeometry = new PlaneGeometry(20000, 20000);
      
      // Shader for procedural starfield
      const starfieldMaterial = new ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          resolution: { value: new Vector2(window.innerWidth, window.innerHeight) }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec2 resolution;
          varying vec2 vUv;
          
          // Hash function for random numbers
          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }
          
          // Noise function
          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                       mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
          }
          
          void main() {
            vec2 uv = vUv;
            vec3 color = vec3(0.0);
            
            // Create multiple layers of stars at different scales
            for (int i = 0; i < 3; i++) {
              float scale = pow(2.0, float(i)) * 20.0;
              vec2 starUv = uv * scale;
              
                             // Create star pattern
               float starNoise = noise(starUv);
               float starThreshold = 0.92 - float(i) * 0.03; // Lower threshold = more stars
               
               if (starNoise > starThreshold) {
                 // Calculate star brightness with twinkling
                 float brightness = (starNoise - starThreshold) / (1.0 - starThreshold);
                 float twinkle = sin(time * 1.5 + starNoise * 8.0) * 0.4 + 0.8;
                 brightness *= twinkle * 1.5; // Brighter stars
                 
                 // Add some color variation - cooler stars
                 vec3 starColor = mix(vec3(0.9, 0.95, 1.0), vec3(1.0, 1.0, 0.95), starNoise);
                 color += starColor * brightness * (1.0 - float(i) * 0.15);
               }
            }
            
                         // Fade out towards edges for natural vignette
             float vignette = 1.0 - length(uv - 0.5) * 0.8;
             vignette = clamp(vignette, 0.0, 1.0);
             
             color *= vignette * 1.2; // Much brighter stars
            
            gl_FragColor = vec4(color, 1.0);
          }
        `,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false
      });
      
      this._starfieldMesh = new Mesh(starfieldGeometry, starfieldMaterial);
      this._starfieldMesh.position.set(0, 0, -5000); // Far behind everything
      this._starfieldMesh.renderOrder = -1000; // Render first
      
      scene.add(this._starfieldMesh);
      
      // Store material for time updates
      this._starfieldMaterial = starfieldMaterial;
    });
  }

  _createFallbackWall() {
    // Create a simple fallback wall using Three.js primitives
    import('three').then(({ BoxGeometry, MeshLambertMaterial, Mesh, DirectionalLight }) => {
      // Create a simple geometric wall
      const wallGeometry = new BoxGeometry(2000, 3000, 200);
      const wallMaterial = new MeshLambertMaterial({ 
        color: 0x444444,
        transparent: true,
        opacity: 0.3 
      });
      
      const wall = new Mesh(wallGeometry, wallMaterial);
      wall.position.set(0, -1000, -1200);
      this.add(wall);
    });
  }

  updateScroll(scrollProgress) {
    // Keep Spline scene and background always visible
    if (this._canvas) {
      this._canvas.style.display = 'block';
    }
    
    // 🌅 RESTORED: Dynamic background color transitions from dark to sunrise
    if (this._backgroundDiv) {
      this._backgroundDiv.style.display = 'block';
      
      // Progressive sunrise - starts pure black with tiny blue hint
      const darkColor = { r: 0, g: 0, b: 2 };         // #000002 - pure black with minimal blue
      const preDawnColor = { r: 12, g: 18, b: 32 };   // #0C1220 - balanced pre-dawn
      const dawnColor = { r: 38, g: 45, b: 62 };      // #262D3E - stronger early dawn
      const sunriseColor = { r: 85, g: 75, b: 95 };   // #554B5F - brighter sunrise peak
      const dayColor = { r: 70, g: 64, b: 80 };       // #464050 - balanced end (between bright and dark)
      
      let currentColor;
      
      // Smooth color interpolation - start pure black, then gradually build
      if (scrollProgress < 0.25) {
        // Pure black to dark (0-25%) - extended pure black period
        const t = scrollProgress / 0.25;
        currentColor = this._lerpColor({ r: 0, g: 0, b: 0 }, darkColor, t);
      } else if (scrollProgress < 0.4) {
        // Dark to pre-dawn (25-40%) - longer dark period
        const t = (scrollProgress - 0.25) / 0.15;
        currentColor = this._lerpColor(darkColor, preDawnColor, t);
      } else if (scrollProgress < 0.65) {
        // Pre-dawn to dawn (40-65%)
        const t = (scrollProgress - 0.4) / 0.25;
        currentColor = this._lerpColor(preDawnColor, dawnColor, t);
      } else {
        // Dawn to sunrise (65-80%) - final state, no changes after 80%
        const t = Math.min((scrollProgress - 0.65) / 0.15, 1.0);
        currentColor = this._lerpColor(dawnColor, sunriseColor, t);
      }
      
      // Debug: Log color changes occasionally, but always log at very start
      if (scrollProgress < 0.05 || Math.random() < 0.02) {
        console.log('🎨 Background Color Update:', {
          scrollProgress: (scrollProgress * 100).toFixed(1) + '%',
          baseColor: `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`,
          phase: scrollProgress < 0.25 ? 'pure-black→dark' :
                 scrollProgress < 0.4 ? 'dark→pre-dawn' : 
                 scrollProgress < 0.65 ? 'pre-dawn→dawn' : 'dawn→sunrise'
        });
      }
      
             // Progressive sunrise glow - only starts after significant scroll
       const sunriseIntensity = scrollProgress > 0.3 ? Math.min((scrollProgress - 0.3) * 1.0, 0.65) : 0;
       
       // Create balanced orange sunrise glow - truly starts at 0
       const sunriseR = Math.round(currentColor.r + (55 * sunriseIntensity));
       const sunriseG = Math.round(currentColor.g + (35 * sunriseIntensity));
       const sunriseB = Math.round(currentColor.b + (15 * sunriseIntensity));
       
                // Calculate outside colors - start more gradually to avoid sudden brightness
         const outsideIntensity = scrollProgress > 0.35 ? Math.min((scrollProgress - 0.35) * 1.2, 1.4) : 0;
         
         // Start with current color, then build to night-like colors
         const outsideR = outsideIntensity > 0 ? Math.max(11, Math.round(currentColor.r - 25 * outsideIntensity)) : currentColor.r;
         const outsideG = outsideIntensity > 0 ? Math.max(16, Math.round(currentColor.g - 20 * outsideIntensity)) : currentColor.g;
         const outsideB = outsideIntensity > 0 ? Math.max(27, Math.round(currentColor.b - 10 * outsideIntensity)) : currentColor.b;
         
         // Use solid color until 30% scroll to avoid brightness jumps
         if (scrollProgress < 0.30 && sunriseIntensity === 0 && outsideIntensity === 0) {
           console.log('🔥 USING SOLID COLOR:', `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`);
           this._backgroundDiv.style.background = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;
         } else {
           console.log('🔥 USING GRADIENT - scrollProgress:', scrollProgress, 'sunriseIntensity:', sunriseIntensity, 'outsideIntensity:', outsideIntensity);
           
           // When both intensities are 0, force all gradient colors to match currentColor
           const gradientSunriseR = sunriseIntensity > 0 ? sunriseR : currentColor.r;
           const gradientSunriseG = sunriseIntensity > 0 ? sunriseG : currentColor.g;
           const gradientSunriseB = sunriseIntensity > 0 ? sunriseB : currentColor.b;
           
           this._backgroundDiv.style.background = `
             radial-gradient(ellipse at 50% 85%, 
               rgba(${gradientSunriseR}, ${gradientSunriseG}, ${gradientSunriseB}, ${sunriseIntensity > 0 ? 0.7 : 0}) 0%, 
               rgba(${Math.round(currentColor.r + gradientSunriseR * 0.2)}, ${Math.round(currentColor.g + gradientSunriseG * 0.15)}, ${Math.round(currentColor.b + gradientSunriseB * 0.1)}, ${sunriseIntensity > 0 ? 0.5 : 0}) 15%,
               rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${sunriseIntensity > 0 ? 0.3 : 0}) 25%,
               rgba(${outsideR}, ${outsideG}, ${outsideB}, ${outsideIntensity > 0 ? 0.6 : 0}) 40%,
               rgb(${outsideR}, ${outsideG}, ${outsideB}) 60%
             ),
             linear-gradient(180deg, 
               rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b}) 0%, 
               rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b}) 25%, 
               rgb(${outsideIntensity > 0 ? Math.max(11, Math.round(currentColor.r - 8 * outsideIntensity)) : currentColor.r}, ${outsideIntensity > 0 ? Math.max(16, Math.round(currentColor.g - 6 * outsideIntensity)) : currentColor.g}, ${outsideIntensity > 0 ? Math.max(27, Math.round(currentColor.b - 5 * outsideIntensity)) : currentColor.b}) 50%, 
               rgb(${outsideIntensity > 0 ? Math.max(11, Math.round(currentColor.r - 15 * outsideIntensity)) : currentColor.r}, ${outsideIntensity > 0 ? Math.max(16, Math.round(currentColor.g - 12 * outsideIntensity)) : currentColor.g}, ${outsideIntensity > 0 ? Math.max(27, Math.round(currentColor.b - 8 * outsideIntensity)) : currentColor.b}) 75%, 
               rgb(${outsideR}, ${outsideG}, ${outsideB}) 100%
             )
           `;
         }
    }
  }
  
  // Helper function for smooth color interpolation
  _lerpColor(color1, color2, t) {
    return {
      r: Math.round(color1.r + (color2.r - color1.r) * t),
      g: Math.round(color1.g + (color2.g - color1.g) * t),
      b: Math.round(color1.b + (color2.b - color1.b) * t)
    };
  }

  // 🔥 CASE STUDY TRANSITION: Simple overlay fade to dark
  fadeBackgroundToDark() {
    console.log('🔥 BACKGROUND: Creating dark overlay for case study transition');
    
    // Create dark overlay div
    this._darkOverlay = document.createElement('div');
    this._darkOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      z-index: -2;
      opacity: 0;
      pointer-events: none;
      transition: opacity 1.3s ease;
    `;
    
    // Add to body
    document.body.appendChild(this._darkOverlay);
    
    // Fade in the overlay
    setTimeout(() => {
      this._darkOverlay.style.opacity = '1';
    }, 10); // Small delay to ensure element is rendered
    
    console.log('🔥 BACKGROUND: Dark overlay fade started');
  }

  // 🔥 CASE STUDY TRANSITION: Remove dark overlay
  resetBackgroundToScroll() {
    console.log('🔥 BACKGROUND: Removing dark overlay');
    
    if (this._darkOverlay) {
      // Fade out the overlay
      this._darkOverlay.style.opacity = '0';
      
      // Remove from DOM after fade
      setTimeout(() => {
        if (this._darkOverlay && this._darkOverlay.parentNode) {
          this._darkOverlay.parentNode.removeChild(this._darkOverlay);
          this._darkOverlay = null;
        }
        console.log('🔥 BACKGROUND: Dark overlay removed');
      }, 500);
    }
  }

  update(delta) {
    // Spline handles its own updates
    // Update starfield animation
    if (this._starfieldMaterial) {
      this._starfieldMaterial.uniforms.time.value += delta * 0.5; // Slow twinkling
    }
  }

  // Method to pass mouse coordinates to Spline
  updateMouse(mouseX, mouseY) {
    if (this._splineApp && this._canvas) {
      // Try multiple approaches to get mouse events to Spline
      
      // Approach 1: Direct canvas event dispatch with multiple event types
      const canvasRect = this._canvas.getBoundingClientRect();
      const canvasX = ((mouseX + 1) / 2) * canvasRect.width;
      const canvasY = ((1 - mouseY) / 2) * canvasRect.height; // Flip Y coordinate
      
      // Dispatch multiple event types that Spline might be listening for
      const eventTypes = ['mousemove', 'pointermove'];
      eventTypes.forEach(eventType => {
        const mouseEvent = new MouseEvent(eventType, {
          clientX: canvasRect.left + canvasX,
          clientY: canvasRect.top + canvasY,
          bubbles: true,
          cancelable: true,
          view: window
        });
        
        this._canvas.dispatchEvent(mouseEvent);
      });
      
      // Approach 2: Try to access Spline's internal mouse handling
      if (this._splineApp.emitEvent) {
        this._splineApp.emitEvent('mousemove', {
          clientX: canvasRect.left + canvasX,
          clientY: canvasRect.top + canvasY
        });
      }
      
      // Approach 3: Try to access Spline's scene and trigger mouse events
      if (this._splineApp.scene) {
        // Try to trigger mouse events on the scene
        const sceneMouseEvent = {
          type: 'mousemove',
          clientX: canvasRect.left + canvasX,
          clientY: canvasRect.top + canvasY,
          x: canvasX,
          y: canvasY
        };
        
        if (this._splineApp.scene.trigger) {
          this._splineApp.scene.trigger('mousemove', sceneMouseEvent);
        }
      }
      
      // Approach 4: Try to set mouse position directly if Spline exposes it
      if (this._splineApp.setMousePosition) {
        this._splineApp.setMousePosition(canvasX, canvasY);
      }
    }
  }

  dispose() {
    // Clean up Spline resources
    if (this._splineApp) {
      this._splineApp.dispose();
    }
    
    // Remove canvas from DOM
    if (this._canvas && this._canvas.parentNode) {
      this._canvas.parentNode.removeChild(this._canvas);
    }
    
    // Remove moonlight background from DOM
    if (this._backgroundDiv && this._backgroundDiv.parentNode) {
      this._backgroundDiv.parentNode.removeChild(this._backgroundDiv);
    }
    
    // Logo blocker removed - no longer needed
    
    // Clean up starfield mesh
    if (this._starfieldMesh && this._starfieldMesh.parent) {
      this._starfieldMesh.parent.remove(this._starfieldMesh);
      if (this._starfieldMaterial) {
        this._starfieldMaterial.dispose();
      }
    }
  }
} 