import styled, { createGlobalStyle, css } from 'styled-components';

// Design Tokens - Extracted from Webflow Style Guide
export const tokens = {
  // Typography
  fonts: {
    primary: 'ABC Oracle, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'ABC Repro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  
  // Font Weights
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    xbold: 800,
  },
  
  // MAIN 4 TYPOGRAPHY CONTROLS
  typography: {
    h1: {
      fontSize: '2.76rem',
      lineHeight: 1.1,
      marginBottom: '24px',
      letterSpacing: '-0.2',
    },
    h2: {
      fontSize: '1.6rem',
      lineHeight: 1.15,
      marginBottom: '16px',
      color: '#001E21',  // Dark teal color for H2
      letterSpacing: '0.01em',
    },
    body: {
      fontSize: '1.1rem',
      lineHeight: 1.35,
      marginBottom: '17px',
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: '0.875rem',
      lineHeight: 1.4,
      marginBottom: '8px',
      letterSpacing: '0.02em',
    },
  },
  
  // Container margins for different screen sizes
  containerMargins: {
    desktop: '120px',    // Large screens
    tablet: '60px',      // Medium screens  
    mobile: '20px',      // Small screens
  },
  
  // Font Sizes (legacy - use typography above for main 4)
  fontSizes: {
    h1: '3.5rem',      // 56px
    h2: '1.5rem',      // 24px - Made smaller  
    h3: '2rem',        // 32px
    h4: '1.5rem',      // 24px
    h5: '1.25rem',     // 20px
    h6: '1.125rem',    // 18px
    large: '1.25rem',  // 20px
    medium: '1rem',    // 16px - Made smaller for body text
    regular: '1rem',   // 16px
    small: '0.875rem', // 14px
    tiny: '0.75rem',   // 12px
  },
  
  // Line Heights
  lineHeights: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
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
  
  // Colors - Light theme for TENDOR
  colors: {
    primary: '#000000',      // Black text
    secondary: '#111111',    // Dark gray text
    alternate: '#ffffff',    // White background
    tertiary: '#f5f5f5',     // Light gray background
    accent: '#40E0D0',       // TENDOR turquoise
    muted: '#666666',        // Muted text
    h2Color: '#001E21',      // Dark teal for H2
  },
  
  // Breakpoints
  breakpoints: {
    mobile: '479px',
    tablet: '767px',
    desktop: '991px',
    large: '1279px',
  },
};

// Global Styles with Font Loading
export const GlobalStyles = createGlobalStyle`
  @font-face {
    font-family: 'ABC Repro';
    src: url('/fonts/ABCRepro-Regular-Trial.otf') format('opentype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  
  @font-face {
    font-family: 'ABC Repro';
    src: url('/fonts/ABCRepro-Medium-Trial.otf') format('opentype');
    font-weight: 500;
    font-style: normal;
    font-display: swap;
  }
  
  @font-face {
    font-family: 'ABC Oracle';
    src: url('/fonts/ABCOracle-Bold-Trial.otf') format('opentype');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }
  
  @font-face {
    font-family: 'ABC Oracle';
    src: url('/fonts/ABCOracleGreek-Bold-Trial.otf') format('opentype');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }
  
  @font-face {
    font-family: 'TT Supermolot';
    src: url('./Images/TT-Supermolot-Neue-Trial-Expanded-Bold-BF65fcfb4dc55fe.ttf') format('truetype');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }

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
    font-family: ${tokens.fonts.primary};
    font-weight: ${tokens.fontWeights.normal};
    line-height: ${tokens.lineHeights.normal};
    color: ${tokens.colors.primary};
    background-color: ${tokens.colors.alternate};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;

// Export globalTypography for UIOverlay compatibility
export const globalTypography = {
  h1: {
    fontSize: tokens.typography.h1.fontSize,
    fontWeight: tokens.fontWeights.medium,
    lineHeight: tokens.typography.h1.lineHeight,
    marginBottom: tokens.typography.h1.marginBottom,
    letterSpacing: tokens.typography.h1.letterSpacing,
  },
  h2: {
    fontSize: tokens.typography.h2.fontSize,
    fontWeight: tokens.fontWeights.medium,
    lineHeight: tokens.typography.h2.lineHeight,
    marginBottom: tokens.typography.h2.marginBottom,
    letterSpacing: tokens.typography.h2.letterSpacing,
  },
  body: {
    fontSize: tokens.typography.body.fontSize,
    fontWeight: tokens.fontWeights.normal,
    lineHeight: tokens.typography.body.lineHeight,
    marginBottom: tokens.typography.body.marginBottom,
    letterSpacing: tokens.typography.body.letterSpacing,
  },
  caption: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: tokens.fontWeights.normal,
    lineHeight: tokens.typography.caption.lineHeight,
    marginBottom: tokens.typography.caption.marginBottom,
    letterSpacing: tokens.typography.caption.letterSpacing,
  },
};

// Export injectGlobalStyles function for index.js compatibility
export const injectGlobalStyles = () => {
  // Create style element if it doesn't exist
  if (!document.getElementById('global-typography-styles')) {
    const style = document.createElement('style');
    style.id = 'global-typography-styles';
    style.textContent = `
      body {
        font-family: ${tokens.fonts.primary};
        font-weight: ${tokens.fontWeights.normal};
        line-height: ${tokens.lineHeights.normal};
        color: ${tokens.colors.primary};
        background-color: ${tokens.colors.alternate};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    `;
    document.head.appendChild(style);
  }
};

// Structure Classes (Client-First)
export const PageWrapper = styled.div`
  min-height: 100vh;
`;

export const MainWrapper = styled.main`
  position: relative;
`;

export const Container = styled.div`
  width: 100%;
  max-width: ${props => tokens.containers[props.size] || tokens.containers.medium};
  margin: 0 auto;
  padding: 0 ${tokens.containerMargins.desktop};
  box-sizing: border-box;
  
  @media (max-width: calc(${tokens.containers.medium} + ${tokens.containerMargins.desktop} * 2)) {
    padding: 0 ${tokens.containerMargins.tablet};
  }
  
  @media (max-width: ${tokens.breakpoints.tablet}) {
    padding: 0 ${tokens.containerMargins.mobile};
  }
`;

// Padding Utilities
export const PaddingGlobal = styled.div`
  padding: 0 ${tokens.containerMargins.desktop};
  
  @media (max-width: ${tokens.breakpoints.desktop}) {
    padding: 0 ${tokens.containerMargins.tablet};
  }
  
  @media (max-width: ${tokens.breakpoints.tablet}) {
    padding: 0 ${tokens.containerMargins.mobile};
  }
`;

export const PaddingSection = styled.div`
  padding: ${props => tokens.sectionPadding[props.size] || tokens.sectionPadding.medium};
`;

// STRICT 4-FONT SYSTEM - Using typography controls
// 1. Large Headers (H1) - ABC Oracle Bold
export const H1 = styled.h1`
  font-family: ${tokens.fonts.display};
  font-size: ${tokens.typography.h1.fontSize};
  font-weight: ${tokens.fontWeights.bold};
  line-height: ${tokens.typography.h1.lineHeight};
  margin: 0 0 ${tokens.typography.h1.marginBottom} 0;
  color: ${tokens.colors.primary};
  letter-spacing: ${tokens.typography.h1.letterSpacing};
  
  @media (max-width: ${tokens.breakpoints.tablet}) {
    font-size: 2.5rem;
  }
  
  @media (max-width: ${tokens.breakpoints.mobile}) {
    font-size: 2rem;
  }
`;

// 2. Medium Headers (H2) - ABC Oracle Bold with dark teal color
export const H2 = styled.h2`
  font-family: ${tokens.fonts.display};
  font-size: ${tokens.typography.h2.fontSize};
  font-weight: ${tokens.fontWeights.bold};
  line-height: ${tokens.typography.h2.lineHeight};
  margin: 0 0 ${tokens.typography.h2.marginBottom} 0;
  color: ${tokens.typography.h2.color};
  letter-spacing: ${tokens.typography.h2.letterSpacing};
  
  @media (max-width: ${tokens.breakpoints.tablet}) {
    font-size: 2rem;
  }
  
  @media (max-width: ${tokens.breakpoints.mobile}) {
    font-size: 1.75rem;
  }
`;

// 3. Body Text - ABC Repro Regular (full black)
export const BodyText = styled.p`
  font-family: ${tokens.fonts.primary};
  font-size: ${tokens.typography.body.fontSize};
  font-weight: ${tokens.fontWeights.normal};
  line-height: ${tokens.typography.body.lineHeight};
  margin: 0 0 ${tokens.typography.body.marginBottom} 0;
  color: ${tokens.colors.primary}; /* Full black #000000 */
  letter-spacing: ${tokens.typography.body.letterSpacing};
`;

// 4. Caption Text - ABC Repro Regular (smaller)
export const Caption = styled.p`
  font-family: ${tokens.fonts.primary};
  font-size: ${tokens.typography.caption.fontSize};
  font-weight: ${tokens.fontWeights.normal};
  line-height: ${tokens.typography.caption.lineHeight};
  margin: 0 0 ${tokens.typography.caption.marginBottom} 0;
  color: ${tokens.colors.muted};
  letter-spacing: ${tokens.typography.caption.letterSpacing};
`;

// 4. Emphasis Text - ABC Repro Bold Italic (for highlights)
export const EmphasisText = styled.span`
  font-family: ${tokens.fonts.primary};
  font-size: inherit;
  font-weight: ${tokens.fontWeights.bold};
  font-style: italic;
  color: ${tokens.colors.accent};
`;

// DEPRECATED - Use only the 4 types above
// Keeping these for backward compatibility but they should be replaced
export const H3 = styled.h3`
  font-family: ${tokens.fonts.primary};
  font-size: ${tokens.fontSizes.h3};
  font-weight: ${tokens.fontWeights.semibold};
  line-height: ${tokens.lineHeights.tight};
  margin: 0;
  
  @media (max-width: ${tokens.breakpoints.tablet}) {
    font-size: 1.75rem;
  }
  
  @media (max-width: ${tokens.breakpoints.mobile}) {
    font-size: 1.5rem;
  }
`;

export const H4 = styled.h4`
  font-family: ${tokens.fonts.primary};
  font-size: ${tokens.fontSizes.h4};
  font-weight: ${tokens.fontWeights.semibold};
  line-height: ${tokens.lineHeights.normal};
  margin: 0;
  
  @media (max-width: ${tokens.breakpoints.mobile}) {
    font-size: 1.25rem;
  }
`;

export const H5 = styled.h5`
  font-family: ${tokens.fonts.primary};
  font-size: ${tokens.fontSizes.h5};
  font-weight: ${tokens.fontWeights.medium};
  line-height: ${tokens.lineHeights.normal};
  margin: 0;
`;

export const H6 = styled.h6`
  font-family: ${tokens.fonts.primary};
  font-size: ${tokens.fontSizes.h6};
  font-weight: ${tokens.fontWeights.medium};
  line-height: ${tokens.lineHeights.normal};
  margin: 0;
`;

// Text Components - DEPRECATED
export const TextLarge = styled.p`
  font-family: ${tokens.fonts.primary};
  font-size: ${tokens.fontSizes.large};
  font-weight: ${tokens.fontWeights.normal};
  line-height: ${tokens.lineHeights.relaxed};
  margin: 0;
`;

export const TextMedium = styled.p`
  font-family: ${tokens.fonts.primary};
  font-size: ${tokens.fontSizes.medium};
  font-weight: ${tokens.fontWeights.normal};
  line-height: ${tokens.lineHeights.relaxed};
  margin: 0;
`;

export const TextRegular = styled.p`
  font-family: ${tokens.fonts.primary};
  font-size: ${tokens.fontSizes.regular};
  font-weight: ${tokens.fontWeights.normal};
  line-height: ${tokens.lineHeights.relaxed};
  margin: 0;
`;

export const TextSmall = styled.p`
  font-family: ${tokens.fonts.primary};
  font-size: ${tokens.fontSizes.small};
  font-weight: ${tokens.fontWeights.normal};
  line-height: ${tokens.lineHeights.normal};
  margin: 0;
`;

export const TextTiny = styled.p`
  font-family: ${tokens.fonts.primary};
  font-size: ${tokens.fontSizes.tiny};
  font-weight: ${tokens.fontWeights.normal};
  line-height: ${tokens.lineHeights.normal};
  margin: 0;
`;

// Text Style Utilities
export const textStyles = {
  strikethrough: css`text-decoration: line-through;`,
  italic: css`font-style: italic;`,
  muted: css`opacity: 0.6;`,
  allcaps: css`text-transform: uppercase; letter-spacing: 0.05em;`,
  nowrap: css`white-space: nowrap;`,
  link: css`
    color: ${tokens.colors.accent};
    text-decoration: none;
    &:hover { text-decoration: underline; }
  `,
  quote: css`
    font-style: italic;
    position: relative;
    padding-left: ${tokens.spacing.medium};
    border-left: 2px solid ${tokens.colors.accent};
  `,
};

// Button System
export const Button = styled.button`
  font-family: ${tokens.fonts.primary};
  font-size: ${tokens.fontSizes.regular};
  font-weight: ${tokens.fontWeights.medium};
  padding: ${tokens.spacing.small} ${tokens.spacing.medium};
  border: 2px solid ${tokens.colors.primary};
  background: ${tokens.colors.primary};
  color: ${tokens.colors.alternate};
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: ${tokens.spacing.xsmall};
  
  &:hover {
    background: transparent;
    color: ${tokens.colors.primary};
  }
  
  ${props => props.size === 'small' && css`
    font-size: ${tokens.fontSizes.small};
    padding: ${tokens.spacing.xsmall} ${tokens.spacing.small};
  `}
  
  ${props => props.size === 'large' && css`
    font-size: ${tokens.fontSizes.medium};
    padding: ${tokens.spacing.medium} ${tokens.spacing.large};
  `}
  
  ${props => props.variant === 'secondary' && css`
    background: transparent;
    color: ${tokens.colors.primary};
    
    &:hover {
      background: ${tokens.colors.primary};
      color: ${tokens.colors.alternate};
    }
  `}
  
  ${props => props.variant === 'text' && css`
    background: transparent;
    border: none;
    color: ${tokens.colors.primary};
    padding: ${tokens.spacing.xsmall} 0;
    
    &:hover {
      color: ${tokens.colors.accent};
    }
  `}
`;

// Spacing Utilities
export const createSpacingUtilities = () => {
  const utilities = {};
  
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    utilities[`m-${key}`] = css`margin: ${value};`;
    utilities[`mt-${key}`] = css`margin-top: ${value};`;
    utilities[`mr-${key}`] = css`margin-right: ${value};`;
    utilities[`mb-${key}`] = css`margin-bottom: ${value};`;
    utilities[`ml-${key}`] = css`margin-left: ${value};`;
    utilities[`mx-${key}`] = css`margin-left: ${value}; margin-right: ${value};`;
    utilities[`my-${key}`] = css`margin-top: ${value}; margin-bottom: ${value};`;
    
    utilities[`p-${key}`] = css`padding: ${value};`;
    utilities[`pt-${key}`] = css`padding-top: ${value};`;
    utilities[`pr-${key}`] = css`padding-right: ${value};`;
    utilities[`pb-${key}`] = css`padding-bottom: ${value};`;
    utilities[`pl-${key}`] = css`padding-left: ${value};`;
    utilities[`px-${key}`] = css`padding-left: ${value}; padding-right: ${value};`;
    utilities[`py-${key}`] = css`padding-top: ${value}; padding-bottom: ${value};`;
  });
  
  return utilities;
};

export const spacingUtils = createSpacingUtilities();

// Utility Classes
export const utilityStyles = {
  ...spacingUtils,
  ...textStyles,
};

// Spacer Component
export const Spacer = styled.div`
  height: ${props => tokens.spacing[props.size] || tokens.spacing.medium};
  width: 100%;
`;

export default tokens; 