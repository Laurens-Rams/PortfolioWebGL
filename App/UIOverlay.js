/**
 * 🔥 UI OVERLAY COMPONENT - USING CLEAN DESIGN SYSTEM
 * 
 * Now uses globalTypography from DesignSystem.js for all font sizes!
 * No more inline font-size values - everything controlled centrally.
 */
import { globalTypography } from './DesignSystem.js';
import appState from './StateManager.js';

export default class UIOverlay {
  constructor(app) {
    this.app = app;
    this.overlay = null;
    this.components = [];
    this.timings = this.app._getScrollTimings(); // GET CENTRALIZED TIMINGS
    this.init();
    // 🔥 REMOVED: Scroll-based click detection - now using direct button clicks
  }

  init() {
    this.createOverlay();
    this.createComponents();
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    document.body.appendChild(this.overlay);
  }

  createComponents() {
    // Scroll Indicator (0-8%) - TEMPORARILY HIDDEN 🔥
    // this.components.push({
    //   type: 'scroll-indicator',
    //   element: this.createScrollIndicator(),
    //   timing: this.timings.scrollIndicator
    // });

    // "Find Your Flow" (8-65%)
    this.components.push({
      type: 'motivation-text',
      element: this.createMotivationText('Find Your Flow', '2.2rem'),
      timing: this.timings.findYourFlow
    });

    // "Push the Limits" (65-75%) - NOW WITH BIO CONTENT
    this.components.push({
      type: 'motivation-text',
      element: this.createMotivationText('Push the Limits', '2.4rem'),
      timing: this.timings.pushTheLimits
    });

    // Bio Description (85-100%) - 🔥 COMPLETELY HIDDEN BUT LOGIC PRESERVED
    const bioComponent = {
      type: 'motivation-text',
      element: this.createMotivationText('Bio Description', '1.15rem'),
      timing: this.timings.bioDescription
    };
    // 🔥 TRIPLE HIDE: display none, opacity 0, pointer-events none
    bioComponent.element.style.display = 'none';
    bioComponent.element.style.opacity = '0';
    bioComponent.element.style.pointerEvents = 'none';
    bioComponent.element.style.visibility = 'hidden';
    this.components.push(bioComponent);

    // Contact Section (75-95%) - SLOWER/LATER
    this.components.push({
      type: 'contact-section',
      element: this.createContactSection(),
      timing: this.timings.getInTouch
    });

    // Case Study Preview (85-100%) - At the very end, treated as motivation text
    this.components.push({
      type: 'motivation-text',
      element: this.createCaseStudyPreview(),
      timing: this.timings.caseStudyPreview
    });

    // Copyright (75-95%) - Same timing as bio - DISABLED FOR NOW
    if (this.timings.copyright) {
      this.components.push({
        type: 'footer',
        element: this.createFooter(),
        timing: this.timings.copyright
      });
    }
  }

  // 🔥 GLOBAL CASE STUDY HOVER DETECTION - WORKS WITHOUT INTERFERING WITH SPLINE
  setupGlobalCaseStudyHover(caseStudyElement) {
    if (this.globalHoverHandlerAdded) return; // Prevent multiple handlers
    this.globalHoverHandlerAdded = true;
    
    let isHoveringCaseStudy = false;
    
    document.addEventListener('mousemove', (e) => {
      if (!caseStudyElement || caseStudyElement.style.opacity === '0') return;
      
      // Get case study element bounds
      const rect = caseStudyElement.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // Check if mouse is within case study bounds
      const isInBounds = mouseX >= rect.left && mouseX <= rect.right && 
                        mouseY >= rect.top && mouseY <= rect.bottom;
      
      const hoverImg = document.querySelector('.case-study-hover-image');
      
      if (isInBounds && !isHoveringCaseStudy) {
        // Mouse entered case study area
        isHoveringCaseStudy = true;
        if (hoverImg) {
          hoverImg.style.opacity = '1';
          hoverImg.style.transform = 'translate(-50%, 0%)'; // Position below mouse instead of centered
          hoverImg.style.left = mouseX + 'px';
          hoverImg.style.top = (mouseY + 20) + 'px'; // Add 50px offset below mouse
        }
        
        // Button-specific hover effects if hovering over button
        const button = caseStudyElement.querySelector('.case-study-button');
        const buttonRect = button?.getBoundingClientRect();
        if (button && buttonRect && 
            mouseX >= buttonRect.left && mouseX <= buttonRect.right && 
            mouseY >= buttonRect.top && mouseY <= buttonRect.bottom) {
          button.style.opacity = '0.7';
          button.style.transform = 'translateY(-2px)';
          const arrow = button.querySelector('span');
          if (arrow) arrow.style.transform = 'translateY(-2px)';
        }
        
      } else if (!isInBounds && isHoveringCaseStudy) {
        // Mouse left case study area
        isHoveringCaseStudy = false;
        if (hoverImg) {
          hoverImg.style.opacity = '0';
        }
        
        // Reset button hover effects
        const button = caseStudyElement.querySelector('.case-study-button');
        if (button) {
          button.style.opacity = '1';
          button.style.transform = 'translateY(0)';
          const arrow = button.querySelector('span');
          if (arrow) arrow.style.transform = 'translateY(0)';
        }
        
      } else if (isInBounds && isHoveringCaseStudy) {
        // Mouse moving within case study area - update image position
        if (hoverImg && hoverImg.style.opacity !== '0') {
          hoverImg.style.left = mouseX + 'px';
          hoverImg.style.top = (mouseY - 320) + 'px'; // Keep 50px offset below mouse
        }
        
        // Update button hover state
        const button = caseStudyElement.querySelector('.case-study-button');
        const buttonRect = button?.getBoundingClientRect();
        if (button && buttonRect) {
          const isOverButton = mouseX >= buttonRect.left && mouseX <= buttonRect.right && 
                              mouseY >= buttonRect.top && mouseY <= buttonRect.bottom;
          
          if (isOverButton) {
            button.style.opacity = '0.7';
            button.style.transform = 'translateY(-2px)';
            const arrow = button.querySelector('span');
            if (arrow) arrow.style.transform = 'translateY(-2px)';
          } else {
            button.style.opacity = '1';
            button.style.transform = 'translateY(0)';
            const arrow = button.querySelector('span');
            if (arrow) arrow.style.transform = 'translateY(0)';
          }
        }
      }
    });
  }

  // 🔥 GLOBAL CASE STUDY CLICK DETECTION - QUICK AND DIRTY SOLUTION
  setupGlobalCaseStudyClickDetection() {
    if (this.globalClickHandlerAdded) return; // Prevent multiple handlers
    this.globalClickHandlerAdded = true;
    
    document.addEventListener('click', (e) => {
      // Check if click is on case study button area (but make it larger)
      const button = document.querySelector('.case-study-button[data-case-study-trigger="true"]');
      if (!button) return;
      
      // Get button bounds and expand them significantly
      const rect = button.getBoundingClientRect();
      const clickX = e.clientX;
      const clickY = e.clientY;
      
      // Expand button clickable area: 200px left, 100px right, 100px up, 50px down
      const expandedRect = {
        left: rect.left - 200,  // Extend far left to cover title and description
        right: rect.right + 100,
        top: rect.top - 100,    // Extend up to cover title and description
        bottom: rect.bottom + 50
      };
      
      // Check if click is within expanded button area
      if (clickX >= expandedRect.left && clickX <= expandedRect.right && 
          clickY >= expandedRect.top && clickY <= expandedRect.bottom) {
        
        e.preventDefault();
        e.stopPropagation();
        
        // Trigger case study transition
        if (window.appState) {
          const scrollOffset = this.app._currentScrollOffset || 0;
          window.appState.transitionToCaseStudy(
            window.app?._tiles,
            window.app?._camera,
            scrollOffset,
            window.app?._climbingWall
          );
        }
      }
    }, true); // Use capture phase to intercept before other handlers
  }

  // 🔥 VISUAL FEEDBACK FOR SCROLL-BASED CLICKS
  showClickFeedback(x, y) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 60px;
      height: 60px;
      border: 2px solid #40E0D0;
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
      transform: translate(-50%, -50%) scale(0);
      animation: clickRipple 0.6s ease-out forwards;
    `;
    
    // Add ripple animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes clickRipple {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(feedback);
    
    // Remove after animation
    setTimeout(() => {
      feedback.remove();
      style.remove();
    }, 600);
  }

  createScrollIndicator() {
    const element = document.createElement('div');
    element.style.cssText = `
      position: fixed;
      bottom: 2vh;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      color: white;
      font-size: 1rem;
      z-index: 1001;
      pointer-events: none;
    `;
    element.innerHTML = `
      <div style="margin-bottom: 0.5rem;">Scroll down</div>
      <div style="font-size: 1.5rem; animation: bounce 2s infinite;">↓</div>
      <style>
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      </style>
    `;
    this.overlay.appendChild(element);
    return element;
  }

  createMotivationText(headline, size) {
    const element = document.createElement('div');
    element.className = 'ui-component'; // 🔥 ADD CLASS FOR TRANSITION CONTROLLER
    element.style.cssText = `
      position: fixed;
      left: 5vh;
      top: 50%;
      color: white;
      z-index: 1001;
      pointer-events: none;
      transform: translateY(calc(-50% + -30vh));
    `;
    
    // Different content based on headline
    if (headline === 'Bio Description') {
      // Bio Description: Just the text, positioned like component 3
              element.innerHTML = `
          <h2 style="
            font-size: ${globalTypography.h2.fontSize};
            font-weight: 700;
            line-height: ${globalTypography.h2.lineHeight};
            margin: 0 0 ${globalTypography.h2.marginBottom} 0;
            letter-spacing: ${globalTypography.h2.letterSpacing};
            color: white;
            max-width: 510px;
          ">
            I feel a tension. Between a sense of calm and a love of motion. I'm patient and focused, but I also like to act and get things done.
             <br/><br/>Right now, I'm exploring Creative Computing through a master's at the University of Arts London.
          </h2>
        `;
         } else if (headline === 'Find Your Flow') {
        // Component 2: Bio content (swapped from component 3)
        element.innerHTML = `
        <h2 style="
          font-size: ${globalTypography.h2.fontSize};
          font-weight: 700;
          line-height: ${globalTypography.h2.lineHeight};
          margin: 0 0 ${globalTypography.h2.marginBottom} 0;
          letter-spacing: ${globalTypography.h2.letterSpacing};
          color: white;
          max-width: 710px;
        ">
          Hey! I'm an inteaction design graduate studying Creative Computing at University of Arts London.<br><br> I'm excited about creating digital experiences that move (you). My background blends interaction design, motion, and enough coding to bring ideas to life.
        </h2>
      `;
    } else {
      // Component 3: Title + description + skills list (swapped from component 2)
      element.innerHTML = `
        <h2 style="
          font-size: ${globalTypography.h2.fontSize};
          font-weight: 700;
          line-height: ${globalTypography.h2.lineHeight};
          margin: 0 0 ${globalTypography.h2.marginBottom} 0;
          letter-spacing: ${globalTypography.h2.letterSpacing};
          max-width: 510px;
          color: white;
        ">How I move through design and code</h2>
        
        <div style="
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          width: 675px;
        ">
          ${['Creative Coding', 'UI/UX Design', 'Three.js/WebGL', 'Motion Design', 'React/Next.js', 'Brand Design'].map(skill => `
            <div style="
              font-size: ${globalTypography.body.fontSize};
              font-weight: ${globalTypography.body.fontWeight};
              line-height: ${globalTypography.body.lineHeight};
              letter-spacing: ${globalTypography.body.letterSpacing};
              color: rgba(255, 255, 255, 0.9);
              padding: 0.5rem 1rem;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 6px;
              border: 1px solid rgba(255, 255, 255, 0.2);
              backdrop-filter: blur(10px);
              transition: all 0.3s ease;
            " onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'">
              ${skill}
            </div>
          `).join('')}
        </div>
      `;
      
      // Component 3 now has interactive skills grid
    }
    
    this.overlay.appendChild(element);
    return element;
  }

  createContactSection() {
    const element = document.createElement('div');
    element.className = 'ui-component'; // 🔥 ADD CLASS FOR TRANSITION CONTROLLER
    element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      color: white;
      z-index: 1001;
      pointer-events: none;
    `;
    element.innerHTML = `
      <!-- Header and Social Buttons -->
      <h1 style="
        position: fixed;
        top: 5vh;
        left: 5vh;
        font-family: 'ABC Oracle', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 2.76rem;
        font-weight: 700;
        line-height: 1.1;
        margin: 0;
        letter-spacing: -0.2px;
        color: white;
        transform: translateY(-20vh);
      ">Get in Touch</h1>
      
      <div style="
        position: fixed;
        top: 5vh;
        right: 5vh;
        display: flex;
        gap: 2rem;
        pointer-events: auto;
        transform: translateY(-20vh);
      ">
        <a href="mailto:laurens@ramsenthaler.com" style="
          color: white;
          text-decoration: none;
          font-size: ${globalTypography.body.fontSize};
          font-weight: ${globalTypography.body.fontWeight};
          letter-spacing: ${globalTypography.body.letterSpacing};
          transition: all 0.3s ease;
          display: inline-block;
        " onmouseover="this.style.opacity='0.7'; this.style.transform='translateY(-2px)'" onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'">
          Email <span style="display: inline-block; transition: transform 0.3s ease;">↗</span>
        </a>
        <a href="https://www.linkedin.com/in/laurens-ramsenthaler/" target="_blank" rel="noopener noreferrer" style="
          color: white;
          text-decoration: none;
          font-size: ${globalTypography.body.fontSize};
          font-weight: ${globalTypography.body.fontWeight};
          letter-spacing: ${globalTypography.body.letterSpacing};
          transition: all 0.3s ease;
          display: inline-block;
        " onmouseover="this.style.opacity='0.7'; this.style.transform='translateY(-2px)'" onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'">
          LinkedIn <span style="display: inline-block; transition: transform 0.3s ease;">↗</span>
        </a>
        <a href="https://instagram.com/upartig.design" target="_blank" rel="noopener noreferrer" style="
          color: white;
          text-decoration: none;
          font-size: ${globalTypography.body.fontSize};
          font-weight: ${globalTypography.body.fontWeight};
          letter-spacing: ${globalTypography.body.letterSpacing};
          transition: all 0.3s ease;
          display: inline-block;
        " onmouseover="this.style.opacity='0.7'; this.style.transform='translateY(-2px)'" onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'">
          Instagram <span style="display: inline-block; transition: transform 0.3s ease;">↗</span>
        </a>
      </div>
      
      <!-- Bio Description - RESTORED ORIGINAL TEXT -->
      <div style="
        position: fixed;
        bottom: 15vh;
        left: 5vh;
        font-size: ${globalTypography.body.fontSize};
        font-weight: ${globalTypography.body.fontWeight};
        line-height: ${globalTypography.body.lineHeight};
        letter-spacing: ${globalTypography.body.letterSpacing};
        max-width: 140px;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      " id="bio-description">
        I work at the intersection of design, motion, and technology. Right now, I'm exploring Creative Computing through a master's at the University of Arts London. My best work emerges from the sweet spot between calm and movement. 
      </div>
    `;
    this.overlay.appendChild(element);
    

    
    return element;
  }

  createFooter() {
    const element = document.createElement('div');
    element.style.cssText = `
      position: fixed;
      bottom: 15vh;
      right: 5vh;
      color: white;
      font-size: ${globalTypography.caption.fontSize};
      font-weight: ${globalTypography.caption.fontWeight};
      letter-spacing: ${globalTypography.caption.letterSpacing};
      opacity: 0.8;
      z-index: 1001;
      pointer-events: none;
      transition: opacity 0.3s ease-in-out;
    `;
    element.innerHTML = `© 2025 Laurens Art Ramsenthaler`;
    this.overlay.appendChild(element);
    return element;
  }

  createCaseStudyPreview() {
    const element = document.createElement('div');
    element.className = 'ui-component case-study-preview';
    element.className = 'ui-component'; // 🔥 ADD CLASS FOR TRANSITION CONTROLLER
    element.style.cssText = `
      position: fixed;
      left: 5vh;
      top: 50%;
      color: white;
      z-index: 1001;
      pointer-events: none;
      transform: translateY(calc(-50% + -30vh));
    `;
    
    // Create hover image element (hidden by default)
    const hoverImage = document.createElement('div');
    hoverImage.className = 'case-study-hover-image';
    hoverImage.style.cssText = `
      position: fixed;
      width: 300px;
      height: 200px;
      background: url('/thumbnail.png') center/cover;
      pointer-events: none;
      z-index: 99999;
      opacity: 0;
      transform: translate(-50%, -100%);
      transition: opacity 0.3s ease, transform 0.3s ease;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    document.body.appendChild(hoverImage);
    
    element.innerHTML = `
      <h2 style="
        font-size: ${globalTypography.h2.fontSize};
        font-weight: 700;
        line-height: ${globalTypography.h2.lineHeight};
        margin: 0 0 ${globalTypography.h2.marginBottom} 0;
        letter-spacing: ${globalTypography.h2.letterSpacing};
        color: white;
        max-width: 665px;
      ">TENDOR: Mobile Climbing App</h2>
      
      <p style="
        font-size: ${globalTypography.body.fontSize};
        font-weight: ${globalTypography.body.fontWeight};
        line-height: ${globalTypography.body.lineHeight};
        letter-spacing: ${globalTypography.body.letterSpacing};
        color: rgba(255, 255, 255, 0.9);
        margin: 0 0 24px 0;
        max-width: 645px;
      ">A motion-tracking climbing app that shows you beta from top climbers, helps you spot technique mistakes and identify areas for improvement, and projects personalized route solutions directly on the wall</p>
      
      <div class="case-study-button" data-case-study-trigger="true" style="
        display: inline-block;
        font-size: ${globalTypography.body.fontSize};
        font-weight: ${globalTypography.body.fontWeight};
        line-height: ${globalTypography.body.lineHeight};
        letter-spacing: ${globalTypography.body.letterSpacing};
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
        transition: all 0.3s ease;
        cursor: pointer;
        pointer-events: none;
      ">
        View Case Study <span style="display: inline-block; transition: transform 0.3s ease;">↗</span>
      </div>
    `;
    
    // Add hover events to the entire case study section
    const showHoverImage = (event) => {
      const hoverImg = document.querySelector('.case-study-hover-image');
      if (hoverImg) {
        hoverImg.style.opacity = '1';
        hoverImg.style.transform = 'translate(-50%, -40%)';
        hoverImg.style.left = event.clientX + 'px';
        hoverImg.style.top = event.clientY + 'px';
      }
      
      // Button-specific hover effects
      const button = element.querySelector('.case-study-button');
      if (button && event.target.closest('.case-study-button')) {
        button.style.opacity = '0.7';
        button.style.transform = 'translateY(-2px)';
        const arrow = button.querySelector('span');
        if (arrow) arrow.style.transform = 'translateX(4px)';
      }
    };
    
    const hideHoverImage = (event) => {
      const hoverImg = document.querySelector('.case-study-hover-image');
      if (hoverImg) {
        hoverImg.style.opacity = '0';
      }
      
      // Reset button-specific hover effects
      const button = element.querySelector('.case-study-button');
      if (button) {
        button.style.opacity = '1';
        button.style.transform = 'translateY(0)';
        const arrow = button.querySelector('span');
        if (arrow) arrow.style.transform = 'translateX(0)';
      }
    };
    
    const updateHoverImagePosition = (event) => {
      const hoverImg = document.querySelector('.case-study-hover-image');
      if (hoverImg && hoverImg.style.opacity !== '0') {
        hoverImg.style.left = event.clientX + 'px';
        hoverImg.style.top = event.clientY + 'px';
      }
    };
    
    this.overlay.appendChild(element);
    
    // Add global mouse tracking for case study hover (doesn't interfere with Spline)
    this.setupGlobalCaseStudyHover(element);
    
    // Add global click detection for case study button
    this.setupGlobalCaseStudyClickDetection();
    
    return element;
  }

  update(scrollProgress) {
    this.components.forEach(component => {
      const { element, timing, type } = component;
      
      let opacity = 0;
      let translateY = 0; // For parallax movement
      
      // Special handling for contact section - stays visible after end point
      const shouldBeVisible = (type === 'contact-section') ? 
        (scrollProgress >= timing.start) : 
        (scrollProgress >= timing.start && scrollProgress <= timing.end);
        
      if (shouldBeVisible) {
                  // Calculate progress within this component's timing range
          // Special handling for contact section - cap movement at end point
          let componentProgress;
          if (type === 'contact-section' && scrollProgress > timing.end) {
            componentProgress = 1; // Stop movement calculation at end point (95%)
          } else {
            componentProgress = (scrollProgress - timing.start) / (timing.end - timing.start);
          }
        
        // PARALLAX MOVEMENT LOGIC
        if (type === 'scroll-indicator') {
          // Scroll indicator: visible from start, moves down quicker and fades out
          translateY = componentProgress * 20; // Move down 35vh as it fades out (quicker)
          opacity = 1 - componentProgress; // Direct fade out
        } else if (type === 'motivation-text') {
          // Motivation text: adjust starting position based on component
          let startY, endY;
          
          if (element.innerHTML.includes('How I move through')) {
            // Component 2: Start lower on screen (not almost outside top)
            startY = -15; // Start lower than before (-50vh was too high)
            endY = 10;    // End closer to screen
          } else if (element.innerHTML.includes('Hey!')) {
            // Bio Description: Same as component 3 positioning but moves down more
            startY = -25; // Same starting position as component 3
            endY = 10;    // Move down more than component 3 (was 20)
          } else if (element.innerHTML.includes('TENDOR: Mobile Climbing App')) {
            // Case Study: Move further down at the end
            startY = -10; // Same starting position as other components
            endY = 27;    // Move further down at the end
          } else {
            // Component 3 (skills): Same movement range as component 2 for same speed
            startY = -25; // Same starting position as component 2
            endY = 23;    // Same ending position as component 2
          }
          
          translateY = startY + (componentProgress * (endY - startY));
          
          // FADE BEHAVIOR: fade in at 95% visible, fade out starting at 5% remaining
          // SPECIAL CASE: Bio description and case study never fade out
          if (element.innerHTML.includes('I feel a tension.') || element.innerHTML.includes('TENDOR: Mobile Climbing App')) {
            // Bio Description and Case Study: Fade in but never fade out
            const range = timing.end - timing.start;
            const fadeInPoint = timing.start + (range * (1 - this.timings.globalFadeInThreshold));
            
            if (scrollProgress <= fadeInPoint) {
              const fadeInProgress = (scrollProgress - timing.start) / (fadeInPoint - timing.start);
              opacity = Math.min(1, fadeInProgress);
            } else {
              opacity = 1; // Stay visible, never fade out
            }

          } else {
            // All other motivation texts: normal fade behavior
            const range = timing.end - timing.start;
            const fadeInPoint = timing.start + (range * (1 - this.timings.globalFadeInThreshold));
            const fadeOutPoint = timing.end - (range * this.timings.globalFadeOutThreshold);
            
            if (scrollProgress <= fadeInPoint) {
              const fadeInProgress = (scrollProgress - timing.start) / (fadeInPoint - timing.start);
              opacity = Math.min(1, fadeInProgress);
            } else if (scrollProgress >= fadeOutPoint) {
              const fadeOutProgress = (scrollProgress - fadeOutPoint) / (timing.end - fadeOutPoint);
              opacity = Math.max(0, 1 - fadeOutProgress);
            } else {
              opacity = 1;
            }
          }
        } else if (type === 'contact-section') {
          // Contact section: stays visible from 80% onwards, NEVER fades out
          opacity = 1; // Always fully visible once it appears
          
          // Bio description handled separately as its own component - REMOVED FROM HERE
          
          // Header and buttons movement: START FROM OUTSIDE SCREEN (-20vh) and move to original position (0vh)
          const headerElement = element.querySelector('h1');
          const buttonsElement = element.querySelector('div[style*="display: flex"]');
          
          const headerMoveStart = 0.3;   // Header/buttons start moving at 30% of component progress
          
          if (componentProgress >= headerMoveStart) {
            const headerProgress = (componentProgress - headerMoveStart) / (1 - headerMoveStart);
            // Header: Move from -20vh (outside screen) to -2vh (higher up on screen)
            const headerMoveY = -20 + (headerProgress * 18); // From -20vh to -2vh
            
            // Social buttons: Move from -20vh (outside screen) to 5vh (further down)
            const buttonsMoveY = -20 + (headerProgress * 19.3); // From -20vh to 5vh
            
            if (headerElement) {
              headerElement.style.transform = `translateY(${headerMoveY}vh)`;
            }
            if (buttonsElement) {
              buttonsElement.style.transform = `translateY(${buttonsMoveY}vh)`;
            }
          }
        } else if (type === 'footer') {
          // Footer: move exactly the same as description - same speed, position, fade
          // FADE BEHAVIOR: fade in at 95% visible (like other components)
          const range = timing.end - timing.start;
          const fadeInPoint = timing.start + (range * (1 - this.timings.globalFadeInThreshold));
          
          if (scrollProgress <= fadeInPoint) {
            const fadeInProgress = (scrollProgress - timing.start) / (fadeInPoint - timing.start);
            opacity = Math.min(1, fadeInProgress);
          } else {
            opacity = 1; // Stay visible, no fade out
          }
          
                    // Move down exactly like description (10vh)
          const footerMoveY = componentProgress * 3; // TINY movement - only 3vh instead of 10vh
          element.style.transform = `translateY(${footerMoveY}vh)`;
        }
      }
      
      // Apply opacity
      element.style.opacity = opacity;
      
      // Handle pointer events for different component types
      if (type === 'contact-section') {
        // Contact section container should always pass through clicks
        element.style.pointerEvents = 'none';
      } else if (type === 'motivation-text' && element.innerHTML.includes('TENDOR: Mobile Climbing App')) {
        // Case study: Keep pointer events disabled to not interfere with Spline
        element.style.pointerEvents = 'none';
        const button = element.querySelector('.case-study-button');
        if (button) {
          button.style.position = 'relative';
          button.style.zIndex = '10000'; // Ensure it's above everything
          button.style.pointerEvents = 'none'; // Let clicks pass through, global handler will catch them
        }
      } else {
        // Other components have normal pointer events
        element.style.pointerEvents = opacity > 0 ? 'auto' : 'none';
      }
      
      // Apply parallax movement for motivation text and scroll indicator
      if (type === 'motivation-text') {
        element.style.transform = `translateY(calc(-50% + ${translateY}vh))`;
      } else if (type === 'scroll-indicator') {
        element.style.transform = `translate(-50%, ${translateY}vh)`;
      }
    });
  }

  // Method to easily update component text
  updateComponent(componentId, newHeadline, newBodyText) {
    const component = this.components.find(comp => comp.element.id === componentId);
    if (component) {
      const h2 = component.element.querySelector('h2');
      const p = component.element.querySelector('p');
      if (h2) h2.textContent = newHeadline;
      if (p) p.textContent = newBodyText;
    }
  }

  // Method to update component position
  updatePosition(componentId, newPosition) {
    const component = this.components.find(comp => comp.element.id === componentId);
    if (component) {
      const element = component.element;
      if (newPosition.right) element.style.right = newPosition.right;
      if (newPosition.left) element.style.left = newPosition.left;
      if (newPosition.top) element.style.top = newPosition.top;
      if (newPosition.bottom) element.style.bottom = newPosition.bottom;
    }
  }

  // Method to get all component IDs for easy reference
  getComponentIds() {
    return this.components.map(comp => comp.element.id);
  }

  // Method to update component styling
  updateComponentStyle(componentId, styleUpdates) {
    const component = this.components.find(comp => comp.element.id === componentId);
    if (component) {
      const element = component.element;
      const h2 = element.querySelector('h2');
      const p = element.querySelector('p');
      
      // Update headline styles
      if (styleUpdates.headlineSize && h2) h2.style.fontSize = styleUpdates.headlineSize;
      if (styleUpdates.headlineWeight && h2) h2.style.fontWeight = styleUpdates.headlineWeight;
      if (styleUpdates.color && h2) h2.style.color = styleUpdates.color;
      if (styleUpdates.textShadow && h2) h2.style.textShadow = styleUpdates.textShadow;
      
      // Update body styles
      if (styleUpdates.bodySize && p) p.style.fontSize = styleUpdates.bodySize;
      if (styleUpdates.bodyWeight && p) p.style.fontWeight = styleUpdates.bodyWeight;
      if (styleUpdates.color && p) p.style.color = styleUpdates.color;
      if (styleUpdates.textShadow && p) p.style.textShadow = styleUpdates.textShadow;
      if (styleUpdates.maxWidth && p) p.style.maxWidth = styleUpdates.maxWidth;
    }
  }

  // Method to hide/show specific components
  setComponentVisibility(componentId, visible) {
    const component = this.components.find(comp => comp.element.id === componentId);
    if (component) {
      component.element.style.display = visible ? 'block' : 'none';
    }
  }

  // Clean up
  dispose() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.components = [];
  }
} 