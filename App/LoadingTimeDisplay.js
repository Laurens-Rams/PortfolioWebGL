// 🔥 LOADING TIME DISPLAY - Simple real-time loading metrics
// Shows in bottom-left corner during loading, then becomes toggleable

export class LoadingTimeDisplay {
  constructor() {
    this.startTime = performance.now();
    this.element = null;
    this.isLoading = true;
    this.metrics = {
      characterPreview: null,
      characterFull: null,
      spline: null,
      total: null
    };
    
    this.createDisplay();
    this.updateDisplay();
  }

  createDisplay() {
    this.element = document.createElement('div');
    this.element.id = 'loading-time-display';
    this.element.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff88;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      padding: 10px 15px;
      border-radius: 6px;
      border: 1px solid #00ff88;
      z-index: 9999;
      backdrop-filter: blur(5px);
      transition: all 0.3s ease;
      cursor: pointer;
      user-select: none;
      display: none;
    `;

    document.body.appendChild(this.element);

    // Make it clickable to toggle detailed view
    this.element.addEventListener('click', () => {
      if (!this.isLoading) {
        this.toggleDetailed();
      }
    });

    // Add Ctrl+P toggle functionality
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  updateDisplay() {
    if (!this.element) return;

    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;

    if (this.isLoading) {
      // Show current loading time
      this.element.innerHTML = `
        <div style="color: #00ff88; font-weight: bold; margin-bottom: 4px;">⚡ Loading...</div>
        <div>Time: ${elapsed.toFixed(0)}ms</div>
        ${this.metrics.characterPreview ? `<div>✅ Preview: ${this.metrics.characterPreview.toFixed(0)}ms</div>` : '<div>⏳ Character Preview...</div>'}
        ${this.metrics.characterFull ? `<div>✅ Character: ${this.metrics.characterFull.toFixed(0)}ms</div>` : '<div>⏳ Full Character...</div>'}
        ${this.metrics.spline ? `<div>✅ Spline: ${this.metrics.spline.toFixed(0)}ms</div>` : '<div>⏳ Background...</div>'}
      `;
    } else {
      // Show final summary
      this.element.innerHTML = `
        <div style="color: #00ff88; font-weight: bold;">⚡ ${this.metrics.total.toFixed(0)}ms</div>
        <div style="font-size: 10px; color: #888;">Click for details</div>
      `;
    }
  }

  markCharacterPreview(time) {
    this.metrics.characterPreview = time;
    this.updateDisplay();
  }

  markCharacterFull(time) {
    this.metrics.characterFull = time;
    this.updateDisplay();
  }

  markSpline(time) {
    this.metrics.spline = time;
    this.updateDisplay();
  }

  markComplete(totalTime) {
    this.metrics.total = totalTime;
    this.isLoading = false;
    this.updateDisplay();

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (this.element) {
        this.element.style.opacity = '0.3';
        this.element.style.transform = 'scale(0.8)';
      }
    }, 5000);
  }

  toggleDetailed() {
    if (this.isDetailed) {
      // Show compact view
      this.element.innerHTML = `
        <div style="color: #00ff88; font-weight: bold;">⚡ ${this.metrics.total.toFixed(0)}ms</div>
        <div style="font-size: 10px; color: #888;">Click for details</div>
      `;
      this.element.style.opacity = '0.3';
      this.isDetailed = false;
    } else {
      // Show detailed view
      this.element.innerHTML = `
        <div style="color: #00ff88; font-weight: bold; margin-bottom: 4px;">⚡ Loading Summary</div>
        <div>Preview: ${this.metrics.characterPreview?.toFixed(0) || 'N/A'}ms</div>
        <div>Character: ${this.metrics.characterFull?.toFixed(0) || 'N/A'}ms</div>
        <div>Spline: ${this.metrics.spline?.toFixed(0) || 'N/A'}ms</div>
        <div style="color: #00ff88; margin-top: 4px;">Total: ${this.metrics.total?.toFixed(0) || 'N/A'}ms</div>
        <div style="font-size: 10px; color: #888; margin-top: 4px;">Click to minimize</div>
      `;
      this.element.style.opacity = '1';
      this.isDetailed = true;
    }
  }

  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  show() {
    if (this.element) {
      this.element.style.display = 'block';
    }
  }

  toggle() {
    if (this.element) {
      const isVisible = this.element.style.display !== 'none';
      this.element.style.display = isVisible ? 'none' : 'block';
    }
  }
}

// Create global instance
export const loadingTimeDisplay = new LoadingTimeDisplay(); 