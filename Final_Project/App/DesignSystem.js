// 🔥 CLEAN VANILLA JS DESIGN SYSTEM - NO DEPENDENCIES!

// GLOBAL TYPOGRAPHY SETTINGS - Clean & Simple
export const globalTypography = {
  h1: {
    fontSize: '2.8rem',
    lineHeight: 1.1,
    marginBottom: '24px',
    letterSpacing: '-0.02em',
    fontWeight: 'bold',
  },
  h2: {
    fontSize: '1.7rem', 
    lineHeight: 1.15,
    marginBottom: '16px',
    letterSpacing: '0.01em',
    fontWeight: 'bold',
  },
  body: {
    fontSize: '1.15rem',
    lineHeight: 1.35,
    marginBottom: '17px',
    letterSpacing: '0.01em',
    fontWeight: 'normal',
  },
  caption: {
    fontSize: '0.875rem',
    lineHeight: 1.4,
    marginBottom: '8px', 
    letterSpacing: '0.02em',
    fontWeight: 'normal',
  },
};

// Design Tokens - Simplified
export const tokens = {
  // Typography - Using global settings
  typography: globalTypography,
  
  // Container margins for different screen sizes
  containerMargins: {
    desktop: '120px',    // Large screens
    tablet: '60px',      // Medium screens  
    mobile: '20px',      // Small screens
  },
  
  // Spacing System (Client-First methodology)
  spacing: {
    0: '0',
    tiny: '0.25rem',     // 4px
    xxsmall: '0.5rem',   // 8px
    xsmall: '0.75rem',   // 12px
    small: '1rem',       // 16px
    medium: '1.5rem',    // 24px
    large: '2rem',       // 32px
    xlarge: '3rem',      // 48px
    xxlarge: '4rem',     // 64px
    huge: '6rem',        // 96px
    xhuge: '8rem',       // 128px
    xxhuge: '12rem',     // 192px
    custom1: '5rem',     // 80px
    custom2: '7rem',     // 112px
    custom3: '10rem',    // 160px
  },
  
  // Container Sizes
  containers: {
    small: '768px',
    medium: '1440px', // 20% wider than 1200px
    large: '1536px',  // 20% wider than 1280px
  },
  
  // Section Padding
  sectionPadding: {
    small: '3rem 0',     // 48px
    medium: '5rem 0',    // 80px
    large: '8rem 0',     // 128px
  },
  
  // Colors - Clean & Simple
  colors: {
    primary: '#000000',      // Black text
    secondary: '#666666',    // Gray text
    white: '#ffffff',        // White background
    accent: '#40E0D0',       // Accent color
  },
  
  // Breakpoints
  breakpoints: {
    mobile: '479px',
    tablet: '767px',
    desktop: '991px',
    large: '1279px',
  },
};

// Function to inject global styles into the document
export function injectGlobalStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      font-size: 16px;
      scroll-behavior: smooth;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: ${tokens.colors.white};
      background-color: ${tokens.colors.white};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* GLOBAL TYPOGRAPHY STYLES */
    h1 {
      font-size: ${globalTypography.h1.fontSize};
      line-height: ${globalTypography.h1.lineHeight};
      margin-bottom: ${globalTypography.h1.marginBottom};
      letter-spacing: ${globalTypography.h1.letterSpacing};
      font-weight: ${globalTypography.h1.fontWeight};
      color: ${tokens.colors.white};
    }
    
    h2 {
      font-size: ${globalTypography.h2.fontSize};
      line-height: ${globalTypography.h2.lineHeight};
      margin-bottom: ${globalTypography.h2.marginBottom};
      letter-spacing: ${globalTypography.h2.letterSpacing};
      font-weight: ${globalTypography.h2.fontWeight};
      color: ${tokens.colors.white};
    }
    
    p, body {
      font-size: ${globalTypography.body.fontSize};
      line-height: ${globalTypography.body.lineHeight};
      margin-bottom: ${globalTypography.body.marginBottom};
      letter-spacing: ${globalTypography.body.letterSpacing};
      font-weight: ${globalTypography.body.fontWeight};
      color: ${tokens.colors.white};
    }
    
    .caption, small {
      font-size: ${globalTypography.caption.fontSize};
      line-height: ${globalTypography.caption.lineHeight};
      margin-bottom: ${globalTypography.caption.marginBottom};
      letter-spacing: ${globalTypography.caption.letterSpacing};
      font-weight: ${globalTypography.caption.fontWeight};
      color: ${tokens.colors.secondary};
    }
  `;
  
  document.head.appendChild(styleElement);
}

// Utility functions for creating CSS classes
export function createContainer(size = 'medium') {
  return {
    width: '100%',
    maxWidth: tokens.containers[size] || tokens.containers.medium,
    margin: '0 auto',
    padding: `0 ${tokens.containerMargins.desktop}`,
    boxSizing: 'border-box',
  };
}

export function createButton() {
  return {
    fontSize: globalTypography.body.fontSize,
    fontWeight: globalTypography.body.fontWeight,
    padding: `${tokens.spacing.small} ${tokens.spacing.medium}`,
    border: `2px solid ${tokens.colors.white}`,
    background: tokens.colors.primary,
    color: tokens.colors.white,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };
}

// Export the clean system
export default { globalTypography, tokens }; 