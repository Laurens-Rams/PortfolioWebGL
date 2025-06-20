// 🔥 PERFORMANCE MONITOR - Track loading times and key metrics
// Perfect for analyzing performance on different servers and devices

export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      // App initialization
      appStartTime: performance.now(),
      
      // Loading phases
      characterPreviewLoadTime: null,
      characterFullLoadTime: null,
      splineLoadTime: null,
      totalLoadTime: null,
      
      // Asset metrics
      assetsPreloaded: 0,
      totalAssets: 0,
      preloadStartTime: null,
      preloadEndTime: null,
      
      // Performance metrics
      initialFPS: null,
      averageFPS: null,
      memoryUsage: null,
      
      // Device info
      deviceInfo: {
        userAgent: navigator.userAgent,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory || 'unknown',
        connection: navigator.connection?.effectiveType || 'unknown',
        pixelRatio: window.devicePixelRatio,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`
      }
    };
    
    this.fpsHistory = [];
    this.lastFPSCheck = performance.now();
    this.frameCount = 0;
    
    this.overlay = null;
    this.isVisible = false;
    
    console.log('🔥 Performance Monitor initialized');
  }

  // Mark the start of character preview loading
  markCharacterPreviewStart() {
    this.metrics.characterPreviewStartTime = performance.now();
  }

  // Mark character preview loaded
  markCharacterPreviewLoaded() {
    if (this.metrics.characterPreviewStartTime) {
      this.metrics.characterPreviewLoadTime = performance.now() - this.metrics.characterPreviewStartTime;
      console.log(`⚡ Character Preview: ${this.metrics.characterPreviewLoadTime.toFixed(0)}ms`);
      
      // Update loading time display
      if (window.loadingTimeDisplay) {
        window.loadingTimeDisplay.markCharacterPreview(this.metrics.characterPreviewLoadTime);
      }
      
      this.updateOverlay();
    }
  }

  // Mark the start of full character loading
  markCharacterFullStart() {
    this.metrics.characterFullStartTime = performance.now();
  }

  // Mark full character loaded
  markCharacterFullLoaded() {
    if (this.metrics.characterFullStartTime) {
      this.metrics.characterFullLoadTime = performance.now() - this.metrics.characterFullStartTime;
      console.log(`⚡ Character Full: ${this.metrics.characterFullLoadTime.toFixed(0)}ms`);
      
      // Update loading time display
      if (window.loadingTimeDisplay) {
        window.loadingTimeDisplay.markCharacterFull(this.metrics.characterFullLoadTime);
      }
      
      this.updateOverlay();
    }
  }

  // Mark the start of Spline loading
  markSplineStart() {
    this.metrics.splineStartTime = performance.now();
  }

  // Mark Spline loaded
  markSplineLoaded() {
    if (this.metrics.splineStartTime) {
      this.metrics.splineLoadTime = performance.now() - this.metrics.splineStartTime;
      console.log(`⚡ Spline: ${this.metrics.splineLoadTime.toFixed(0)}ms`);
      
      // Update loading time display
      if (window.loadingTimeDisplay) {
        window.loadingTimeDisplay.markSpline(this.metrics.splineLoadTime);
      }
      
      this.updateOverlay();
    }
  }

  // Mark all loading complete
  markLoadingComplete() {
    this.metrics.totalLoadTime = performance.now() - this.metrics.appStartTime;
    console.log(`⚡ Total Load Time: ${this.metrics.totalLoadTime.toFixed(0)}ms`);
    
    // Update loading time display
    if (window.loadingTimeDisplay) {
      window.loadingTimeDisplay.markComplete(this.metrics.totalLoadTime);
    }
    
    this.updateOverlay();
    
    // Log summary
    this.logSummary();
  }

  // Track preloading progress
  markPreloadStart(totalAssets) {
    this.metrics.preloadStartTime = performance.now();
    this.metrics.totalAssets = totalAssets;
    this.metrics.assetsPreloaded = 0;
  }

  markAssetPreloaded() {
    this.metrics.assetsPreloaded++;
    if (this.metrics.assetsPreloaded === this.metrics.totalAssets) {
      this.metrics.preloadEndTime = performance.now();
      const preloadTime = this.metrics.preloadEndTime - this.metrics.preloadStartTime;
      console.log(`⚡ Preload Complete: ${preloadTime.toFixed(0)}ms (${this.metrics.totalAssets} assets)`);
    }
    this.updateOverlay();
  }

  // Update FPS tracking
  updateFPS(deltaTime) {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastFPSCheck >= 1000) {
      const currentFPS = Math.round(this.frameCount * 1000 / (now - this.lastFPSCheck));
      this.fpsHistory.push(currentFPS);
      
      if (this.fpsHistory.length > 60) { // Keep last 60 seconds
        this.fpsHistory.shift();
      }
      
      if (this.metrics.initialFPS === null) {
        this.metrics.initialFPS = currentFPS;
      }
      
      this.metrics.averageFPS = Math.round(
        this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
      );
      
      this.frameCount = 0;
      this.lastFPSCheck = now;
      
      this.updateOverlay();
    }
  }

  // Get memory usage (if available)
  updateMemoryUsage() {
    if (performance.memory) {
      this.metrics.memoryUsage = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
  }

  // Create performance overlay
  createOverlay() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.id = 'performance-monitor';
    this.overlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff88;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 11px;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #00ff88;
      z-index: 10000;
      min-width: 280px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0, 255, 136, 0.2);
      transition: opacity 0.3s ease;
      opacity: 0;
      pointer-events: none;
      user-select: none;
    `;

    document.body.appendChild(this.overlay);
    
      // Toggle visibility with Ctrl+P
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      this.toggleVisibility();
    }
  });

    this.updateOverlay();
  }

  // Toggle overlay visibility
  toggleVisibility() {
    this.isVisible = !this.isVisible;
    if (this.overlay) {
      this.overlay.style.opacity = this.isVisible ? '1' : '0';
      if (this.isVisible) {
        this.updateMemoryUsage();
        this.updateOverlay();
      }
    }
  }

  // Update overlay content
  updateOverlay() {
    if (!this.overlay) return;

    const formatTime = (ms) => ms ? `${ms.toFixed(0)}ms` : 'pending...';
    const formatBytes = (bytes) => bytes ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : 'unknown';
    
    // Calculate loading efficiency
    const efficiency = this.calculateEfficiency();
    
    this.overlay.innerHTML = `
      <div style="color: #00ff88; font-weight: bold; margin-bottom: 8px; text-align: center;">
        ⚡ PERFORMANCE METRICS ⚡
      </div>
      
      <div style="margin-bottom: 6px;">
        <div style="color: #ffffff; margin-bottom: 2px;">🚀 Loading Times:</div>
        <div>• Character Preview: ${formatTime(this.metrics.characterPreviewLoadTime)}</div>
        <div>• Character Full: ${formatTime(this.metrics.characterFullLoadTime)}</div>
        <div>• Spline Background: ${formatTime(this.metrics.splineLoadTime)}</div>
        <div style="color: #00ff88;">• Total Load: ${formatTime(this.metrics.totalLoadTime)}</div>
      </div>
      
      <div style="margin-bottom: 6px;">
        <div style="color: #ffffff; margin-bottom: 2px;">📊 Performance:</div>
        <div>• Current FPS: ${this.metrics.averageFPS || 'measuring...'}</div>
        <div>• Initial FPS: ${this.metrics.initialFPS || 'measuring...'}</div>
        <div>• Memory: ${this.metrics.memoryUsage ? 
          `${this.metrics.memoryUsage.used}MB / ${this.metrics.memoryUsage.total}MB` : 'unknown'}</div>
      </div>
      
      <div style="margin-bottom: 6px;">
        <div style="color: #ffffff; margin-bottom: 2px;">📦 Assets:</div>
        <div>• Preloaded: ${this.metrics.assetsPreloaded}/${this.metrics.totalAssets}</div>
        <div>• Efficiency: ${efficiency}</div>
      </div>
      
      <div style="margin-bottom: 6px;">
        <div style="color: #ffffff; margin-bottom: 2px;">🖥️ Device:</div>
        <div>• CPU Cores: ${this.metrics.deviceInfo.hardwareConcurrency}</div>
        <div>• Memory: ${formatBytes(this.metrics.deviceInfo.deviceMemory * 1024 * 1024)}</div>
        <div>• Connection: ${this.metrics.deviceInfo.connection.toUpperCase()}</div>
        <div>• Pixel Ratio: ${this.metrics.deviceInfo.pixelRatio}x</div>
        <div>• Viewport: ${this.metrics.deviceInfo.viewportSize}</div>
      </div>
      
      <div style="color: #888; font-size: 10px; text-align: center; margin-top: 8px; border-top: 1px solid #333; padding-top: 4px;">
        Press Ctrl+P to toggle • ${new Date().toLocaleTimeString()}
      </div>
    `;
  }

  // Calculate loading efficiency score
  calculateEfficiency() {
    if (!this.metrics.totalLoadTime) return 'calculating...';
    
    const totalTime = this.metrics.totalLoadTime;
    let score = 100;
    
    // Enhanced scoring based on trace analysis
    if (totalTime > 5000) score -= 40; // Over 5s - Poor
    else if (totalTime > 3000) score -= 25; // Over 3s - Fair  
    else if (totalTime > 2000) score -= 15; // Over 2s - Good
    else if (totalTime > 1500) score -= 5;  // Over 1.5s - Very Good
    // Under 1.5s gets full points - Excellent
    
    // FPS performance bonus/penalty
    if (this.metrics.averageFPS >= 60) score += 15; // Excellent FPS
    else if (this.metrics.averageFPS >= 45) score += 5;  // Good FPS
    else if (this.metrics.averageFPS < 30) score -= 25; // Poor FPS
    
    // Progressive loading bonus
    if (this.metrics.characterPreviewLoadTime && this.metrics.characterPreviewLoadTime < 1000) {
      score += 10; // Fast preview loading
    }
    
    // Parallel loading efficiency
    if (this.metrics.splineLoadTime && this.metrics.characterFullLoadTime) {
      const loadingOverlap = Math.abs(this.metrics.splineLoadTime - this.metrics.characterFullLoadTime);
      if (loadingOverlap < 500) score += 10; // Good parallel loading
    }
    
    // Device factor
    if (this.metrics.deviceInfo.hardwareConcurrency <= 4) score += 5; // Bonus for low-end devices
    
    // Memory efficiency
    if (this.metrics.memoryUsage && this.metrics.memoryUsage.used < 100) {
      score += 5; // Good memory usage
    }
    
    const finalScore = Math.max(0, Math.min(100, score));
    
    const grade = finalScore >= 90 ? '🔥 EXCELLENT' : 
                  finalScore >= 80 ? '✅ VERY GOOD' :
                  finalScore >= 70 ? '👍 GOOD' :
                  finalScore >= 60 ? '⚠️ FAIR' : '❌ POOR';
    
    return `${finalScore}% ${grade}`;
  }

  // Log comprehensive summary
  logSummary() {
    console.log('🔥 ═══════════════════════════════════════');
    console.log('🔥 PERFORMANCE SUMMARY');
    console.log('🔥 ═══════════════════════════════════════');
    console.log(`⚡ Total Load Time: ${this.metrics.totalLoadTime?.toFixed(0)}ms`);
    console.log(`⚡ Character Preview: ${this.metrics.characterPreviewLoadTime?.toFixed(0)}ms`);
    console.log(`⚡ Character Full: ${this.metrics.characterFullLoadTime?.toFixed(0)}ms`);
    console.log(`⚡ Spline Background: ${this.metrics.splineLoadTime?.toFixed(0)}ms`);
    console.log(`📊 Average FPS: ${this.metrics.averageFPS}`);
    console.log(`🖥️ Device: ${this.metrics.deviceInfo.hardwareConcurrency} cores, ${this.metrics.deviceInfo.connection} connection`);
    console.log(`📦 Assets Preloaded: ${this.metrics.assetsPreloaded}/${this.metrics.totalAssets}`);
    console.log(`🎯 Efficiency: ${this.calculateEfficiency()}`);
    console.log('🔥 ═══════════════════════════════════════');
  }

  // Export metrics for server analysis
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...this.metrics,
      efficiency: this.calculateEfficiency()
    };
  }

  // Send metrics to server (optional)
  sendToServer(endpoint) {
    if (!endpoint) return;
    
    const metrics = this.exportMetrics();
    
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metrics)
    }).catch(error => {
      console.log('📊 Could not send metrics to server:', error);
    });
  }

  // Add real user monitoring
  static trackRealUserMetrics() {
    // Track connection type
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const connectionType = connection ? connection.effectiveType : 'unknown';
    
    // Track geographic performance
    const startTime = performance.now();
    
    // Send metrics to console (you can later send to analytics)
    window.addEventListener('load', () => {
      const loadTime = performance.now() - startTime;
      console.log('🌍 REAL USER METRICS:', {
        loadTime: `${loadTime.toFixed(0)}ms`,
        connectionType,
        userAgent: navigator.userAgent.substring(0, 50),
        timestamp: new Date().toISOString(),
        domain: window.location.hostname
      });
    });
  }

  // Call this in your initialization
  static initRealUserMonitoring() {
    this.trackRealUserMetrics();
    
    // 🔥 SEND METRICS TO AZURE FUNCTION (optional)
    // Uncomment and replace with your Azure Function URL
    // const metricsEndpoint = 'https://your-function-app.azurewebsites.net/api/metrics';
    // window.addEventListener('load', () => {
    //   setTimeout(() => {
    //     if (window.performanceMonitor) {
    //       window.performanceMonitor.sendToServer(metricsEndpoint);
    //     }
    //   }, 5000); // Send after 5s to capture full metrics
    // });
  }
}

// Create global instance
export const performanceMonitor = new PerformanceMonitor(); 