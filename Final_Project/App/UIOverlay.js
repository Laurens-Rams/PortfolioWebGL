/**
 * 🔥 UI OVERLAY COMPONENT - SUPER SIMPLE UNIFIED SYSTEM
 * 
 * ALL COMPONENTS WORK THE SAME WAY - JUST DIFFERENT START/END POSITIONS!
 * 
 * SUPER EASY CUSTOMIZATION - JUST CHANGE THESE VALUES:
 * 
 * scrollTrigger: 0.2     // When component starts moving (0-1, where 1 = 100% scroll)
 * scrollEnd: 0.5        // When component finishes moving (0-1)
 * startPosition: -20    // Where component starts (-20 = above screen, 80 = bottom)
 * endPosition: 120      // Where component ends (120 = below screen, 80 = bottom)
 * 
 * POSITION VALUES:
 * - -20 = Above screen (hidden)
 * - 0 = Top of screen
 * - 50 = Middle of screen  
 * - 80 = Bottom of screen
 * - 120 = Below screen (hidden)
 * 
 * EXAMPLES:
 * - startPosition: 80, endPosition: 120 = Start at bottom, move down and fade out
 * - startPosition: -20, endPosition: 120 = Start above, move through screen, fade out
 * - startPosition: -20, endPosition: 80 = Start above, move to bottom and stay
 * 
 * HOW TO CUSTOMIZE:
 * 
 * 1. CHANGE TIMING:
 *    - Edit scrollTrigger and scrollEnd values (0-1)
 *    - Bigger range = slower movement
 *    - Smaller range = faster movement
 * 
 * 2. CHANGE MOVEMENT:
 *    - Edit startPosition and endPosition values
 *    - Same logic for all components!
 * 
 * 3. CHANGE TEXT:
 *    - Edit headline and bodyText properties
 * 
 * CURRENT SETUP:
 * - Component 1: Bottom to off-bottom (0-20% scroll) - starts visible, LEFT ALIGNED
 * - Component 2: Above to off-bottom (15-45% scroll) - normal, LEFT ALIGNED  
 * - Component 3: Above to off-bottom (40-70% scroll) - normal, LEFT ALIGNED
 * - Component 4: Above to bottom (65-95% scroll) - stays at end, LEFT ALIGNED
 * - Camera shifted LEFT so character appears more to the RIGHT
 */
export default class UIOverlay {
  constructor(app) {
    this.app = app;
    this.overlay = null;
    this.components = [];
    this.timings = this.app._getScrollTimings(); // GET CENTRALIZED TIMINGS
    this.init();
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

    // "Push the Limits" (65-75%)
    this.components.push({
      type: 'motivation-text',
      element: this.createMotivationText('Push the Limits', '2.4rem'),
      timing: this.timings.pushTheLimits
    });

    // Bio Description (85-100%) - Behaves like component 3
    this.components.push({
      type: 'motivation-text',
      element: this.createMotivationText('Bio Description', '1.15rem'),
      timing: this.timings.bioDescription
    });

    // Contact Section (75-95%) - SLOWER/LATER
    this.components.push({
      type: 'contact-section',
      element: this.createContactSection(),
      timing: this.timings.getInTouch
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
            font-size: 2.4rem;
            font-weight: bold;
            margin: 0 0 0.9rem 0;
            letter-spacing: -0.02em;
            max-width: 600px;
            line-height: 1.2;
          ">
            I work at the intersection of design, motion, and technology. Right now, I'm exploring Creative Computing through a master's at the University of Arts London. <br/><br/>For me, good design moves, and great design moves you. I love creating ideas that feel alive—ideas that move, flow, and respond. My best work emerges from the sweet spot between calm and movement.
          </h2>
        `;
         } else if (headline === 'Find Your Flow') {
        // Component 2: Title + description + skills list
        element.innerHTML = `
        <h2 style="
          font-size: ${size};
          font-weight: bold;
          margin: 0 0 1.5rem 0;
          letter-spacing: -0.02em;
        ">Design that moves. You.</h2>
        
        <div style="
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          width: 460px;
        ">
          <div style="
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          " onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'">
            Creative Coding
          </div>
          <div style="
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          " onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'">
            UI/UX Design
          </div>
          <div style="
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          " onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'">
            Three.js/WebGL
          </div>
          <div style="
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          " onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'">
            Motion Design
          </div>
          <div style="
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          " onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'">
            Entrepreneurship
          </div>
          <div style="
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          " onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'">
            Product Strategy
          </div>
          <div style="
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          " onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'">
            React/Next.js
          </div>
          <div style="
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          " onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'">
            Brand Design
          </div>
        </div>
      `;
    } else {
      // Component 3: Case Study (matches Component 2 style)
      element.innerHTML = `
        <div class="case-study-container">
          <h2 style="
            font-size: ${size};
            font-weight: bold;
            margin: 0 0 0.9rem 0;
            letter-spacing: -0.02em;
          ">TENDOR: Climbing App</h2>
          
          <div style="
            font-size: 1.15rem;
            line-height: 1.6;
            max-width: 480px;
            margin-bottom: 2rem;
          ">
            A motion-tracking climbing app that shows you beta from top climbers, helps you spot technique mistakes, and projects route solutions directly on the wall
          </div>
          
          <a href="#" style="
            color: white;
            text-decoration: none;
            font-size: 1.2rem;
            transition: all 0.3s ease;
            display: inline-block;
            pointer-events: auto;
          " onmouseover="this.style.opacity='0.7'; this.style.transform='translateY(-2px)'" onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'">
            View Case Study <span style="display: inline-block; transition: transform 0.3s ease;">↗</span>
          </a>
        </div>
      `;
      
              // Add mouse-following image for case study
        setTimeout(() => {
          const container = element.querySelector('.case-study-container');
          
          // Create hover image element
          const hoverImage = document.createElement('div');
          hoverImage.style.cssText = `
            position: fixed;
            width: 300px;
            height: 200px;
            background-image: url('./public/thumnail_tendor.jpg');
            background-size: cover;
            background-position: center;
            border-radius: 8px;
            opacity: 0;
            pointer-events: none;
            z-index: 10000;
            transition: opacity 0.3s ease;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            transform: translate(-50%, -50%);
          `;
          document.body.appendChild(hoverImage);
          
          if (container) {
            container.addEventListener('mouseenter', () => {
              hoverImage.style.opacity = '1';
            });
            
            container.addEventListener('mouseleave', () => {
              hoverImage.style.opacity = '0';
            });
            
            container.addEventListener('mousemove', (e) => {
              // Position hover image below mouse cursor (55% of image height down)
              const imageHeight = 200; // Height of the hover image
              const offsetY = imageHeight * 0.60; // 55% of image height
              
              hoverImage.style.left = e.clientX + 'px';
              hoverImage.style.top = (e.clientY + offsetY) + 'px';
            });
          }
        }, 100);
    }
    
    this.overlay.appendChild(element);
    return element;
  }

  createContactSection() {
    const element = document.createElement('div');
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
      <h2 style="
        position: fixed;
        top: 5vh;
        left: 5vh;
        font-size: 4rem;
        font-weight: bold;
        margin: 0;
        letter-spacing: -0.04em;
        transform: translateY(-20vh);
      ">Get in Touch</h2>
      
      <div style="
        position: fixed;
        top: 5vh;
        right: 5vh;
        display: flex;
        gap: 2rem;
        pointer-events: auto;
        transform: translateY(-20vh);
      ">
        <a href="mailto:your.email@example.com" style="
          color: white;
          text-decoration: none;
          font-size: 1.2rem;
          transition: all 0.3s ease;
          display: inline-block;
        " onmouseover="this.style.opacity='0.7'; this.style.transform='translateY(-2px)'" onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'">
          Email <span style="display: inline-block; transition: transform 0.3s ease;">↗</span>
        </a>
        <a href="https://linkedin.com/in/yourprofile" style="
          color: white;
          text-decoration: none;
          font-size: 1.2rem;
          transition: all 0.3s ease;
          display: inline-block;
        " onmouseover="this.style.opacity='0.7'; this.style.transform='translateY(-2px)'" onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'">
          LinkedIn <span style="display: inline-block; transition: transform 0.3s ease;">↗</span>
        </a>
        <a href="https://instagram.com/yourprofile" style="
          color: white;
          text-decoration: none;
          font-size: 1.2rem;
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
        font-size: 1.15rem;
        line-height: 1.6;
        max-width: 560px;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      " id="bio-description">
        I work at the intersection of design, motion, and technology. Right now, I’m exploring Creative Computing through a master’s at the University of Arts London. For me, good design moves, and great design moves you. I love creating ideas that feel alive—ideas that move, flow, and respond. My best work emerges from the sweet spot between calm and movement. 
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
      font-size: 0.9rem;
      opacity: 0.8;
      z-index: 1001;
      pointer-events: none;
      transition: opacity 0.3s ease-in-out;
    `;
    element.innerHTML = `© 2025 Laurens Art Ramsenthaler`;
    this.overlay.appendChild(element);
    return element;
  }

  update(scrollProgress) {
    this.components.forEach(component => {
      const { element, timing, type } = component;
      
      let opacity = 0;
      let translateY = 0; // For parallax movement
      
      if (scrollProgress >= timing.start && scrollProgress <= timing.end) {
        // Calculate progress within this component's timing range
        const componentProgress = (scrollProgress - timing.start) / (timing.end - timing.start);
        
        // PARALLAX MOVEMENT LOGIC
        if (type === 'scroll-indicator') {
          // Scroll indicator: visible from start, moves down quicker and fades out
          translateY = componentProgress * 20; // Move down 35vh as it fades out (quicker)
          opacity = 1 - componentProgress; // Direct fade out
        } else if (type === 'motivation-text') {
          // Motivation text: adjust starting position based on component
          let startY, endY;
          
          if (element.innerHTML.includes('Design that moves')) {
            // Component 2: Start lower on screen (not almost outside top)
            startY = -40; // Start lower than before (-50vh was too high)
            endY = 15;    // End closer to screen
          } else if (element.innerHTML.includes('I work at the intersection')) {
            // Bio Description: Same as component 3 positioning but moves down more
            startY = -15; // Same starting position as component 3
            endY = 11;    // Move down more than component 3 (was 20)
          } else {
            // Component 3 (case study): Same movement range as component 2 for same speed
            startY = -25; // Same starting position as component 2
            endY = 20;    // Same ending position as component 2
          }
          
          translateY = startY + (componentProgress * (endY - startY));
          
          // FADE BEHAVIOR: fade in at 95% visible, fade out starting at 5% remaining
          // SPECIAL CASE: Bio description never fades out
          if (element.innerHTML.includes('I work at the intersection')) {
            // Bio Description: Fade in but never fade out
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
          // Contact section: stays until very end, no fade out
          opacity = 1; // Always visible when in range
          
          // Bio description handled separately as its own component - REMOVED FROM HERE
          
          // Header and buttons movement: START FROM OUTSIDE SCREEN (-20vh) and move to original position (0vh)
          const headerElement = element.querySelector('h2');
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
      element.style.pointerEvents = opacity > 0 ? 'auto' : 'none';
      
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