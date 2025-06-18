import { Group } from 'three';

export default class SplineClimbingWall extends Group {
  constructor() {
    super();
    
    this._canvas = null;
    this._isVisible = true;
    this._fadeInManager = null;
    this._splineLoaded = false;
    this._shouldLazyLoad = true; // 🔥 Enable lazy loading by default
    
    this._init();
  }
  
  setFadeInManager(fadeInManager) {
    this._fadeInManager = fadeInManager;
  }

  // 🔥 PERFORMANCE: Method to trigger Spline loading manually
  loadSplineScene() {
    if (!this._splineLoaded && this._shouldLazyLoad) {
      console.log('🔥 Lazy loading Spline scene...');
      this._shouldLazyLoad = false;
      this._loadSplineContent();
    }
  }

  async _init() {
    // Create background immediately (lightweight)
    this._createBackground();
    
    // 🔥 PERFORMANCE: Only load Spline immediately if not using lazy loading
    if (!this._shouldLazyLoad) {
      await this._loadSplineContent();
    } else {
      // Create a simple placeholder
      this._createPlaceholder();
      console.log('🔥 Spline scene ready for lazy loading - call loadSplineScene() when needed');
    }
  }

  _createBackground() {
    // Create a moonlight night background div behind everything
    this._backgroundDiv = document.createElement('div');
    this._backgroundDiv.style.position = 'fixed';
    this._backgroundDiv.style.top = '0';
    this._backgroundDiv.style.left = '0';
    this._backgroundDiv.style.width = '100%';
    this._backgroundDiv.style.height = '100%';
    // Darker moonlight gradient with more blue in dark areas
    this._backgroundDiv.style.background = `
      radial-gradient(ellipse at 70% 20%, rgba(20, 35, 60, 0.3) 0%, transparent 50%),
      linear-gradient(180deg, 
        #040812 0%, 
        #0a0f1a 20%, 
        #050a15 40%, 
        #020510 70%, 
        #000308 100%
      )
    `;
    this._backgroundDiv.style.zIndex = '-2'; // Behind everything
    
    // Add moonlight background to DOM
    document.body.appendChild(this._backgroundDiv);
  }

  _createPlaceholder() {
    // Create a lightweight placeholder that shows immediately
    this._placeholderDiv = document.createElement('div');
    this._placeholderDiv.style.position = 'fixed';
    this._placeholderDiv.style.top = '0';
    this._placeholderDiv.style.left = '0';
    this._placeholderDiv.style.width = '100%';
    this._placeholderDiv.style.height = '100%';
    this._placeholderDiv.style.background = 'rgba(10, 15, 26, 0.8)';
    this._placeholderDiv.style.zIndex = '-1';
    this._placeholderDiv.style.display = 'flex';
    this._placeholderDiv.style.alignItems = 'center';
    this._placeholderDiv.style.justifyContent = 'center';
    this._placeholderDiv.style.color = '#ffffff';
    this._placeholderDiv.style.fontSize = '18px';
    this._placeholderDiv.style.fontFamily = 'Arial, sans-serif';
    this._placeholderDiv.innerHTML = '🔥 Loading climbing environment...';
    
    document.body.appendChild(this._placeholderDiv);
  }

  async _loadSplineContent() {
    try {
      // 🔥 PERFORMANCE: Detect device capabilities for optimization
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLowEnd = isMobile || navigator.hardwareConcurrency <= 4;
      
      // Create a canvas element for Spline
      this._canvas = document.createElement('canvas');
      this._canvas.id = 'spline-canvas';
      this._canvas.style.position = 'fixed';
      this._canvas.style.top = '0';
      this._canvas.style.left = '0';
      this._canvas.style.width = '100%';
      this._canvas.style.height = '100%';
      this._canvas.style.pointerEvents = 'auto'; // Enable mouse events for Spline interactions
      this._canvas.style.zIndex = '-1'; // Behind the main canvas
      this._canvas.style.opacity = '0'; // Start hidden - will fade in when loaded
      
      // 🔥 PERFORMANCE: Set canvas resolution based on device
      if (isLowEnd) {
        // Reduce canvas resolution on low-end devices
        this._canvas.style.imageRendering = 'pixelated';
        this._canvas.style.filter = 'contrast(1.1)'; // Slight contrast boost to compensate
      }
      
      // Add to DOM
      document.body.appendChild(this._canvas);
      
      // Hide placeholder when starting to load real content
      if (this._placeholderDiv) {
        this._placeholderDiv.style.opacity = '0.5';
        this._placeholderDiv.innerHTML = '🔥 Loading 3D scene...';
      }
      
      // Load Spline viewer dynamically
      const { Application } = await import('@splinetool/runtime');
      
      // Initialize Spline application with performance settings
      this._splineApp = new Application(this._canvas);
      
      // 🔥 PERFORMANCE: Configure Spline runtime for better performance
      if (this._splineApp.setPixelRatio) {
        // Reduce pixel ratio on low-end devices
        const pixelRatio = isLowEnd ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio;
        this._splineApp.setPixelRatio(pixelRatio);
        console.log('🔥 Spline pixel ratio set to:', pixelRatio);
      }
      
      // 🔥 PERFORMANCE: Add compression and quality settings to URL
      const baseUrl = 'https://prod.spline.design/VaU21x4kIO7tSaXb/scene.splinecode';
      const performanceParams = new URLSearchParams({
        // Cache busting
        v: Date.now(),
        // Quality settings for performance
        quality: isLowEnd ? 'performance' : 'default',
        // Compression settings
        compression: 'true',
        // Reduce geometry complexity on mobile
        lod: isLowEnd ? 'low' : 'high'
      });
      
      const optimizedUrl = `${baseUrl}?${performanceParams.toString()}`;
      
      console.log('🔥 Loading Spline with performance optimizations:', {
        isMobile,
        isLowEnd,
        url: optimizedUrl
      });
      
      // Load with timeout for better error handling
      const loadPromise = this._splineApp.load(optimizedUrl);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Spline load timeout')), 15000) // 15 second timeout
      );
      
      await Promise.race([loadPromise, timeoutPromise]);
      
      this._splineLoaded = true;
      
      // Remove placeholder
      if (this._placeholderDiv) {
        this._placeholderDiv.remove();
        this._placeholderDiv = null;
      }
      
      console.log('🔥 Spline climbing wall loaded successfully!');
      
      // Notify fade manager that Spline is ready
      if (this._fadeInManager) {
        this._fadeInManager.setLoaded('spline');
      }
      
    } catch (error) {
      console.error('Failed to load Spline climbing wall:', error);
      // Fallback to original wall if Spline fails
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
      
      console.log('🔥 High-performance shader starfield created');
    });
  }

  _createFallbackWall() {
    // Simple fallback wall in case Spline fails
    import('three').then(({ PlaneGeometry, MeshStandardMaterial, Mesh }) => {
      const wallGeometry = new PlaneGeometry(5000, 3000);
      const wallMaterial = new MeshStandardMaterial({ 
        color: 0x444444,
        roughness: 0.8,
        metalness: 0.1
      });
      
      const wall = new Mesh(wallGeometry, wallMaterial);
      wall.position.set(0, -1000, -1200);
      this.add(wall);
      
      console.log('Using fallback wall - Spline failed to load');
    });
  }

  updateScroll(scrollProgress) {
    // Keep Spline scene and background always visible - don't hide during portfolio phase
    // const shouldBeVisible = scrollProgress < 0.8; // Hide during portfolio phase
    
    // Always keep visible
    if (this._canvas) {
      this._canvas.style.display = 'block';
    }
    
    // SUNRISE TRANSITION - subtle pre-dawn effect as you climb higher
    if (this._backgroundDiv) {
      this._backgroundDiv.style.display = 'block';
      
      // Create subtle sunrise transition (0 = night, 1 = pre-dawn)
      // Start transition at 30% scroll, fully transitioned by 80%
      const sunriseStart = 0.3;
      const sunriseEnd = 0.8;
      let sunriseProgress = 0;
      
      if (scrollProgress >= sunriseStart) {
        sunriseProgress = Math.min(1, (scrollProgress - sunriseStart) / (sunriseEnd - sunriseStart));
      }
      
      // Interpolate colors for subtle pre-dawn effect
      const nightColors = {
        radialCenter: 'rgba(20, 35, 60, 0.3)',
        gradientTop: '#040812',
        gradientMid1: '#0a0f1a', 
        gradientMid2: '#050a15',
        gradientMid3: '#020510',
        gradientBottom: '#000308'
      };
      
             const preDawnColors = {
         radialCenter: 'rgba(255, 180, 120, 0.6)', // Warm sunrise glow at horizon
         gradientTop: '#0a0f1a',      // Keep top dark like pre-dawn sky
         gradientMid1: '#1a1520',     // Dark purple-blue upper sky
         gradientMid2: '#2a2535',     // Lighter purple as we go down
         gradientMid3: '#4a3540',     // Warm purple-orange near horizon
         gradientBottom: '#6a4530'    // Warm orange-brown at bottom (sunrise horizon)
       };
      
      // Lerp function for color interpolation
      const lerpColor = (color1, color2, t) => {
        // Extract RGB values from hex colors
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      };
      
      // Interpolate radial gradient center (rgba)
      const lerpRgba = (rgba1, rgba2, t) => {
        const match1 = rgba1.match(/rgba?\(([^)]+)\)/)[1].split(',').map(x => parseFloat(x.trim()));
        const match2 = rgba2.match(/rgba?\(([^)]+)\)/)[1].split(',').map(x => parseFloat(x.trim()));
        
        const r = Math.round(match1[0] + (match2[0] - match1[0]) * t);
        const g = Math.round(match1[1] + (match2[1] - match1[1]) * t);
        const b = Math.round(match1[2] + (match2[2] - match1[2]) * t);
        const a = match1[3] + (match2[3] - match1[3]) * t;
        
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
      };
      
      // Calculate interpolated colors
      const currentRadialCenter = lerpRgba(nightColors.radialCenter, preDawnColors.radialCenter, sunriseProgress);
      const currentTop = lerpColor(nightColors.gradientTop, preDawnColors.gradientTop, sunriseProgress);
      const currentMid1 = lerpColor(nightColors.gradientMid1, preDawnColors.gradientMid1, sunriseProgress);
      const currentMid2 = lerpColor(nightColors.gradientMid2, preDawnColors.gradientMid2, sunriseProgress);
      const currentMid3 = lerpColor(nightColors.gradientMid3, preDawnColors.gradientMid3, sunriseProgress);
      const currentBottom = lerpColor(nightColors.gradientBottom, preDawnColors.gradientBottom, sunriseProgress);
      
             // Apply the interpolated gradient - SUN RISING FROM BOTTOM!
       this._backgroundDiv.style.background = `
         radial-gradient(ellipse 200% 100% at 50% 95%, ${currentRadialCenter} 0%, ${currentMid2}80 30%, ${currentTop}40 50%, transparent 70%),
         linear-gradient(0deg, 
           ${currentBottom} 0%, 
           ${currentMid3} 30%, 
           ${currentMid2} 60%, 
           ${currentMid1} 80%, 
           ${currentTop} 100%
         )
       `;
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
      // DEBUG: Log mouse coordinates occasionally
      if (Math.random() < 0.01) {
        // console.log('🔥 Spline mouse update:', { mouseX: mouseX.toFixed(3), mouseY: mouseY.toFixed(3) });
      }
      
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