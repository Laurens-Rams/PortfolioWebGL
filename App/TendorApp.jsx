import React, { useState, useEffect, useRef } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { H1, H2, BodyText, Container } from './DesignSystem';
import logoVideo from '../public/tendor-assets/LOGO.mp4';
import brandArchitecture from '../public/tendor-assets/Brand_arhcitecture.png';

// 🎯 GLOBAL SPACING SYSTEM - Easy to change in one place
const spacing = {
  textToMedia: '20px', // Standard spacing between text and images/videos/placeholders
  sectionGap: '40px',  // Spacing between major sections
  fullWidthGap: '80px', // Spacing for full-width elements
  captionGap: '8px',   // Spacing for captions
};

const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: 'TT-Supermolot-Black';
    src: url('/tendor-assets/TT-Supermolot-Neue-Trial-Expanded-Black-BF65fcfb4ce55fe.ttf') format('truetype');
    font-weight: 900;
    font-style: normal;
  }

  body {
    margin: 0 !important;
    padding: 0 !important;
    background-color: #000000; /* 🔥 BLACK BODY BACKGROUND - NO WHITE FLASH ON TRANSITIONS */
  }
  
  * {
    box-sizing: border-box;
  }
`;

const AppContainer = styled.div`
  background-color: transparent !important; /* 🔥 TRANSPARENT - SHOW SPLINE SCENE BEHIND */
  color: #000000;
  min-height: 300vh;
  position: relative;
`;

const BackButton = styled.button`
  position: fixed;
  top: 40px;
  left: calc(50% - 720px + 120px);
  background: none;
  border: none;
  font-family: 'ABC Repro', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-size: 1.125rem;
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: 0.01em;
  color: ${props => props.$isScrolled ? '#000000' : '#ffffff'};
  cursor: pointer;
  z-index: 1000; /* 🔥 STAYS ABOVE STICKY HERO */
  transition: color 0.3s ease;
  
  &:hover {
    opacity: 0.7;
  }
  
  @media (max-width: calc(1440px + 240px)) {
    left: calc(50% - 50vw + 60px);
  }
  
  @media (max-width: 767px) {
    left: 20px;
  }
`;

const HeroSection = styled.section`
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: ${props => props.$useStaticHero ? 'url(/tendor-assets/HERO_Image.jpg) center/cover no-repeat' : 'rgba(0, 0, 0, 0.1)'} !important;
  z-index: ${props => props.$useStaticHero ? 10 : 1};
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, ${props => props.$fadeOpacity || 0});
    pointer-events: none;
    /* transition: background 0.3s ease; */ /* 🔥 REMOVED - NO DELAY, INSTANT FADE */
    z-index: 100; /* 🔥 ABOVE ALL HERO CONTENT - FADES EVERYTHING TO BLACK */
  }
  
  @media (max-width: 768px) {
    position: sticky;
    min-height: auto;
  }
`;

const HeroGrid = styled.div`
  position: relative;
  z-index: 3; /* 🔥 ABOVE FADE OVERLAY */
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 80px;
  align-items: stretch;
  min-height: calc(100vh - 180px);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 32px;
    min-height: auto;
  }
`;

const HeroImageColumn = styled.div`
  /* Empty space for layout balance */
`;

const HeroImage = styled.div`
  /* No longer needed - image is now background */
  display: none;
`;

const HeroContent = styled.div`
  padding: 190px 0 40px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  position: relative; /* 🔥 ENSURE STACKING CONTEXT */
  z-index: 2; /* 🔥 ABOVE FADE OVERLAY */
  
  h1 {
    color: #40E0D0 !important;
  }
  
  h2, p {
    color: #ffffff !important;
  }
  
  @media (max-width: 768px) {
    padding: 40px 0;
    min-height: auto;
    justify-content: flex-start;
  }
`;

const ProjectSubtitle = styled.p`
  font-family: 'ABC Repro', sans-serif;
  font-size: 1.125rem;
  line-height: 1.5;
  color: #000000;
  margin: 0 0 ${spacing.sectionGap} 0;
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${spacing.sectionGap} 60px;
  margin-bottom: ${spacing.sectionGap};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 32px;
    margin-bottom: ${spacing.fullWidthGap};
    margin-top: -${spacing.textToMedia};
  }
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MetaLabel = styled.div`
  font-family: 'ABC Repro', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const MetaContent = styled.div`
  font-family: 'ABC Repro', sans-serif;
  font-size: 1.2rem;
  font-weight: 400;
  color: #ffffff;
  line-height: 1.35;
  letter-spacing: 0.01em;
`;

const ContentWrapper = styled.div`
  margin-top: 0;
  background-color: #ffffff; /* 🔥 WHITE BACKGROUND FOR CASE STUDY CONTENT */
  position: relative;
  z-index: 20; /* 🔥 HIGHER Z-INDEX TO SLIDE OVER STICKY HERO */
  width: 100%;
  min-height: 200vh;
`;

const ContentSection = styled.section`
  padding: 80px 0 0 0;
  /* 🔥 REMOVED: background-color - inherits white from ContentWrapper */
  /* 🔥 REMOVED: bottom padding to prevent extra scroll after footer */
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: ${spacing.fullWidthGap};
  align-items: start;
  margin-bottom: ${spacing.fullWidthGap};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 32px;
    margin-bottom: 60px; /* Keep specific mobile spacing */
  }
`;

const SectionLabel = styled.div`
  /* Sticky positioning - uncomment to reactivate */
  /* position: sticky; */
  /* top: 80px; */
`;

const SectionContent = styled.div`
  /* Content styling */
`;

const Placeholder = styled.div`
  width: 100%;
  height: 400px;
  background-color: #f5f5f5;
  border: 2px dashed #cccccc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: ${spacing.textToMedia} 0;
  font-family: 'ABC Repro', sans-serif;
  font-size: 1rem;
  color: #666666;
`;

const SmallPlaceholder = styled.div`
  width: 100%;
  height: 200px;
  background-color: #f5f5f5;
  border: 2px dashed #cccccc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: ${spacing.textToMedia} 0;
  font-family: 'ABC Repro', sans-serif;
  font-size: 0.875rem;
  color: #666666;
`;

const Caption = styled.p`
  font-family: 'ABC Repro', sans-serif;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #666666;
  // margin: 8px 0;
`;

const VisionMissionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing.sectionGap};
  margin: ${spacing.textToMedia} 0;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const VisionMissionCard = styled.div`
  padding: 32px;
  border: 1px solid #e0e0e0;
  
  h3 {
    font-family: 'ABC Repro', sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    color: #666666;
    margin: 0 0 16px 0; /* Keep specific spacing for card headers */
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  h4 {
    font-family: 'ABC Repro', sans-serif;
    font-size: 1.2rem;
    font-weight: 400;
    color: #000000;
    margin: 0;
    line-height: 1.35;
    letter-spacing: 0.01em;
  }
`;

const LogoFullWidth = styled.div`
  width: 100vw;
  height: 600px;
  background-color: #f5f5f5;
  border: 2px dashed #cccccc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: ${spacing.fullWidthGap} calc(-50vw + 50%);
  font-family: 'ABC Repro', sans-serif;
  font-size: 1rem;
  color: #666666;
`;

const ColorShowcase = styled.div`
  width: 100vw;
  margin: ${spacing.textToMedia} calc(-50vw + 50%);
  padding: ${spacing.fullWidthGap};
  background: linear-gradient(135deg, #16514D 0%, #0C9181 50%, #00C9AB 100%);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const GradientHoverLeft = styled.div`
  font-family: 'ABC Repro', sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  color: #ffffff;
  letter-spacing: 0.01em;
  text-align: left;
  line-height: 1.35;
  position: absolute;
  top: 50%;
  left: 40px;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;
`;

const GradientHoverRight = styled.div`
  font-family: 'ABC Repro', sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  color: #ffffff;
  letter-spacing: 0.01em;
  text-align: right;
  line-height: 1.35;
  position: absolute;
  top: 50%;
  right: 40px;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;
`;

const ColorContainer = styled.div`
  background: linear-gradient(135deg, #00C9AB 0%, #0C9181 50%, #16514D 100%);
  padding: 40px;
  border-radius: 24px;
  max-width: 1200px;
  width: 100%;
  position: relative;
  cursor: pointer;
  
  &:hover ${GradientHoverLeft} {
    opacity: 1;
  }
  
  &:hover ${GradientHoverRight} {
    opacity: 1;
  }
`;

const ColorInnerContainer = styled.div`
  background: linear-gradient(135deg, #0C9181 0%, #00C9AB 50%, #16514D 100%);
  padding: 32px;
  border-radius: 16px;
  position: relative;
  cursor: pointer;
  
  &:hover ${GradientHoverLeft} {
    opacity: 1;
  }
  
  &:hover ${GradientHoverRight} {
    opacity: 1;
  }
`;

const ColorGrid = styled.div`
  background-color: #ffffff;
  padding: 24px;
  border-radius: 12px;
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
`;

const ColorPill = styled.div`
  background-color: ${props => props.color};
  border: ${props => props.$isLight ? '1px solid #e0e0e0' : 'none'};
  border-radius: 20px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: ${props => {
    switch(props.size) {
      case 'large': return '120px';
      case 'medium': return '100px';
      case 'small': return '80px';
      case 'accent': return '40px';
      default: return '80px';
    }
  }};
  height: 40px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
`;

const ColorText = styled.div`
  font-family: 'ABC Repro', sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  color: ${props => props.$isLight ? '#000000' : '#ffffff'};
  letter-spacing: 0.01em;
  text-align: center;
  line-height: 1.35;
  transition: opacity 0.2s ease;
  
  ${ColorPill}:hover & {
    opacity: 0;
  }
`;

const ColorHoverText = styled.div`
  font-family: 'ABC Repro', sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  color: ${props => props.$isLight ? '#000000' : '#ffffff'};
  letter-spacing: 0.01em;
  text-align: left;
  line-height: 1.35;
  position: absolute;
  top: 50%;
  left: 20px;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;
  
  ${ColorPill}:hover & {
    opacity: 1;
  }
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  margin-top: ${spacing.textToMedia};
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  
  &:hover .play-pause-button {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
`;

const PlayPauseButton = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  border: 2px solid rgba(255, 255, 255, 0.2);
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: translate(-50%, -50%) scale(1.1);
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  &::before {
    content: '';
    width: 0;
    height: 0;
    transition: all 0.2s ease;
  }
  
  &.playing::before {
    border-left: 8px solid #ffffff;
    border-right: 8px solid #ffffff;
    border-top: 12px solid transparent;
    border-bottom: 12px solid transparent;
    width: 4px;
    height: 16px;
    background: #ffffff;
    border: none;
    box-shadow: 6px 0 0 #ffffff;
  }
  
  &.paused::before {
    border-left: 16px solid #ffffff;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    margin-left: 3px;
  }
`;

const FooterImage = styled.img`
  width: 100vw;
  height: auto;
  display: block;
  margin: 0;
  padding: 0;
  position: relative;
  z-index: 20;
`;

const ContactFooter = styled.div`
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  background-color: #000000;
  padding: ${spacing.fullWidthGap};
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: ${spacing.sectionGap};
    padding: 60px 20px;
  }
`;

const ContactTitle = styled.h1`
  font-family: 'ABC Oracle', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 2.76rem;
  font-weight: 700;
  line-height: 1.1;
  margin: 0;
  letter-spacing: -0.2px;
  color: #ffffff;
`;

const ContactLinks = styled.div`
  display: flex;
  gap: 2rem;
  
  @media (max-width: 768px) {
    gap: 1.5rem;
  }
`;

const ContactLink = styled.a`
  color: #ffffff;
  text-decoration: none;
  font-family: 'ABC Repro', sans-serif;
  font-size: 1.125rem;
  font-weight: 400;
  letter-spacing: 0.01em;
  transition: all 0.3s ease;
  display: inline-block;
  
  &:hover {
    opacity: 0.7;
    transform: translateY(-2px);
  }
  
  span {
    display: inline-block;
    transition: transform 0.3s ease;
  }
`;

const SectionWidthVideo = styled.video`
  width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
  margin: ${spacing.textToMedia} 0;
  grid-column: 1 / -1; /* Span both columns */
`;

const TypographyShowcase = styled.div`
  grid-column: 1 / -1; /* Span both columns */
  background-color: #f8f8f8;
  padding: ${spacing.fullWidthGap} ${spacing.sectionGap};
  margin: ${spacing.textToMedia} 0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: ${spacing.fullWidthGap};
`;

const TypographySection = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.fullWidthGap};
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${spacing.sectionGap};
  }
`;

const TypographyLabel = styled.div`
  min-width: 200px;
  display: flex;
  flex-direction: column;
  
  span {
    font-family: 'ABC Repro', sans-serif;
    font-size: 1.125rem;
    font-weight: 400;
    line-height: 1.4;
    color: #000000;
  }
`;

const TypographyDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sectionGap};
  flex: 1;
`;

const LargeTk = styled.div`
  font-family: 'TT-Supermolot-Black', Arial, sans-serif;
  font-size: 39rem;
  font-weight: 900;
  background: linear-gradient(315deg, #2dd4bf 0%, #14b8a6 50%, #0d9488 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 0.8;
  letter-spacing: -0.05em;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    font-size: 20rem;
  }
`;

const TkCircle = styled.div`
  position: absolute;
  width: 8.8rem; /* 20% of 39rem */
  height: 8.8rem;
  border: 4px solid #000000;
  border-radius: 50%;
  z-index: 15;
  
  @media (max-width: 768px) {
    width: 4rem; /* 20% of 20rem */
    height: 4rem;
    border-width: 2px;
  }
`;

const TCircle = styled(TkCircle)`
  top: 20%;
  right: -5%;
  transform: translate(25%, -10%);
`;

const KCircle = styled(TkCircle)`
  top: 25%;
  left: 53%;
  transform: translate(-50%, -50%);
`;

const TypographyDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  position: relative;
  z-index: 2;
  margin-left: -20px; /* Overlap slightly with the large Ag */
`;

const FullAlphabet = styled.div`
  font-family: 'TT-Supermolot-Black', Arial, sans-serif;
  font-size: 1.5rem;
  font-weight: 900;
  color: #000000;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const FontName = styled.div`
  font-family: 'ABC Repro', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  color: #1a1a1a;
  margin-top: ${spacing.captionGap};
`;

const CreativePlatformContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  margin: ${spacing.textToMedia} 0;
`;

const AnimatedTitle = styled.h1`
  font-family: 'TT-Supermolot-Black', Arial, sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  color: #000000;
  text-align: center;
  line-height: 1.1;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

// Physical Applications Section Styled Components
const FullWidthImagePlaceholder = styled.img`
  width: 100vw;
  height: 900px;
  object-fit: cover;
  display: block;
  margin: ${spacing.fullWidthGap} calc(-50vw + 50%);
  
  @media (max-width: 768px) {
    height: 300px;
    margin: ${spacing.sectionGap} calc(-50vw + 50%);
  }
`;

const SliderContainer = styled.div`
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  overflow: hidden;
  margin-bottom: ${spacing.fullWidthGap};
  border-radius: 8px;
`;

// 🎯 USER RESEARCH COMPONENTS
const UserResearchContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: ${spacing.fullWidthGap};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const PersonaCard = styled.div`
  background: ${props => props.$primary 
    ? 'linear-gradient(135deg, #00C9AB 0%, #0C9181 100%)' 
    : 'linear-gradient(135deg, #2C2C2C 0%, #1A1A1A 100%)'
  };
  border-radius: 24px;
  padding: 40px 32px;
  color: #ffffff;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: ${props => props.$primary 
      ? 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)'
      : 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)'
    };
    border-radius: 50%;
    transform: translate(30px, -30px);
  }
`;

const PersonaNumber = styled.div`
  font-size: 4rem;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 8px;
  opacity: 0.9;
`;

const PersonaLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
  opacity: 0.8;
`;

const PersonaTitle = styled.h3`
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 24px 0;
  line-height: 1.2;
`;

const UserTypeContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const UserType = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
  }
`;

const PersonaDescription = styled.p`
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 24px 0;
  opacity: 0.95;
`;

const PersonaSection = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const PersonaSectionTitle = styled.div`
  font-weight: 700;
  font-size: 0.875rem;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const PersonaSectionText = styled.p`
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0;
  opacity: 0.9;
`;

// 🎯 EXPANDABLE SECTION COMPONENTS
const ExpandableSection = styled.div`
  overflow: hidden;
  transition: max-height 0.5s ease, opacity 0.3s ease;
  max-height: ${props => props.$isExpanded ? '2000px' : '0'};
  opacity: ${props => props.$isExpanded ? '1' : '0'};
`;

const ExpandButton = styled.button`
  background: #f8f8f8;
  color: #333333;
  border: 1px solid #d0d0d0;
  padding: 10px 20px;
  border-radius: 8px;
  font-family: 'ABC Repro', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: ${spacing.textToMedia} 0 6px 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: #f0f0f0;
    color: #222222;
    border-color: #b8b8b8;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    transform: translateY(-1px);
  }
  
  &:active {
    background: #e8e8e8;
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const AutoSlider = styled.div`
  display: flex;
  gap: 20px;
  animation: infiniteSlide 12s infinite linear;
  
  @keyframes infiniteSlide {
    0% { transform: translateX(0); }
    100% { transform: translateX(-66.66%); } /* Move by 2/3 since we have 3 sets */
  }
  
  @media (max-width: 768px) {
    gap: 10px;
  }
`;

const SliderImage = styled.img`
  width: calc(25% - 15px); /* 4 images per row, accounting for gaps */
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  display: block;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: calc(50% - 5px); /* 2 images per row on mobile */
  }
`;

const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const ImagePlaceholder = styled.div`
  ${props => props.$fullWidth && `
    grid-column: 1 / -1;
  `}
  
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  
  /* Only show dashed border if no image */
  &:not(:has(img)) {
    background-color: #f5f5f5;
    border: 2px dashed #cccccc;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  ${props => {
    switch(props.$size) {
      case 'large':
        return `
          height: 670px;
          @media (max-width: 768px) {
            height: 400px;
          }
        `;
      case 'medium':
        return `
          height: 500px;
          @media (max-width: 768px) {
            height: 350px;
          }
        `;
      case 'small':
        return `
          height: 400px;
          grid-column: span 1;
          @media (max-width: 768px) {
            height: 280px;
          }
        `;
      default:
        return `height: 400px;`;
    }
  }}
  
  ${props => props.$size === 'small' && `
    @media (min-width: 769px) {
      &:nth-child(4) { grid-column: 1; }
      &:nth-child(5) { grid-column: 2; }
      &:nth-child(6) { grid-column: 1 / -1; }
    }
  `}
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
    display: block;
  }
`;

const ImageCaption = styled.div`
  font-family: 'ABC Repro', sans-serif;
  font-size: 1.125rem;
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: 0.01em;
  color: #000000;
  margin-bottom: ${spacing.captionGap};
`;

const PhotoGroupSpacer = styled.div`
  grid-column: 1 / -1;
  height: 60px;
  
  @media (max-width: 768px) {
    height: ${spacing.sectionGap};
  }
`;

const SectionTitle = styled.div`
  ${props => props.$fullWidth && `
    grid-column: 1 / -1;
  `}
  
  margin: ${spacing.fullWidthGap} 0 ${spacing.sectionGap} 0;
  
  h2 {
    margin: 0;
  }
`;

const TextContent = styled.div`
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
`;

const RevealContainer = styled.div`
  position: relative;
`;

const RevealTrigger = styled.div`
  position: relative;
  z-index: 10;
  background: white;
`;

const RevealContent = styled.div`
  position: sticky;
  top: 0;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-bottom: ${spacing.fullWidthGap};
  z-index: 5;
  
  img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [useStaticHero, setUseStaticHero] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [heroFadeOpacity, setHeroFadeOpacity] = useState(0);
  const [isPersonalStoryExpanded, setIsPersonalStoryExpanded] = useState(false);
  const videoRef = useRef(null);
  const alexVideoRef = useRef(null);
  const creativePlatformRef = useRef(null);
  const animatedTitleRef = useRef(null);
  
  useEffect(() => {
    // 🔥 CHECK IF WE SHOULD USE STATIC HERO AND SUBSCRIBE TO CHANGES
    let stateCleanup = null;
    
    if (window.appState) {
      const state = window.appState.getState();
      setUseStaticHero(state.useStaticHero);
      setIsTransitioning(state.isTransitioning); // 🔥 TRACK TRANSITION STATE
      console.log('🔥 TENDOR App - initial useStaticHero:', state.useStaticHero);
      
      // 🔥 SUBSCRIBE TO STATE CHANGES
      const handleStateChange = (data) => {
        if (data.newState) {
          // 🔥 ONLY UPDATE HERO STATE IF NOT TRANSITIONING
          if (data.newState.useStaticHero !== undefined && !data.newState.isTransitioning) {
            console.log('🔥 TENDOR App - useStaticHero changed to:', data.newState.useStaticHero);
            setUseStaticHero(data.newState.useStaticHero);
          }
          
          // Always update transition state
          if (data.newState.isTransitioning !== undefined) {
            setIsTransitioning(data.newState.isTransitioning);
          }
        }
      };
      
      window.appState.subscribe('stateChange', handleStateChange);
      
      stateCleanup = () => {
        if (window.appState && window.appState.unsubscribe) {
          window.appState.unsubscribe('stateChange', handleStateChange);
        }
      };
    }
    
    // 🔥 SEPARATE HANDLERS FOR DIFFERENT SCROLL SOURCES
    const handleWindowScroll = (e) => {
      // 🔥 ONLY FOR BACK BUTTON COLOR - NO FADE CALCULATION
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      
      // Update scrollY state (for debugging)
      setScrollY(scrollTop);
      
      // Back button color change - only turn black when past hero (95% of viewport)
      setIsScrolled(scrollTop > windowHeight * 0.95);

      console.log('🔥 WINDOW SCROLL (ignored for fade):', { 
        scrollTop, 
        isScrolled: scrollTop > windowHeight * 0.95,
        source: 'window'
      });
    };
    
    // 🔥 CASE STUDY SCROLL HANDLER - ONLY SOURCE FOR BLACK FADE
    const handleContainerScroll = (e) => {
      console.log('🔥 CASE STUDY SCROLL EVENT RECEIVED:', e);
      
      if (e.detail && e.detail.scrollTop !== undefined) {
        const scrollTop = e.detail.scrollTop;
        const windowHeight = window.innerHeight;
        
        // 🔥 CALCULATE BLACK FADE OPACITY BASED ON CASE STUDY SCROLL ONLY
        // 🔥 FADE STARTS IMMEDIATELY AND FINISHES FAST
        const fadeStart = windowHeight * 0.0; // Start fade immediately on scroll
        const fadeEnd = windowHeight * 0.8; // Complete fade by 60% viewport height - FAST!
        
        let fadeOpacity = 0;
        if (scrollTop > fadeStart) {
          const fadeProgress = Math.min(1, (scrollTop - fadeStart) / (fadeEnd - fadeStart));
          fadeOpacity = fadeProgress * 1; // Max 70% opacity for readability
        }
        
        console.log('🔥 SETTING HERO FADE OPACITY:', { 
          currentOpacity: heroFadeOpacity, 
          newOpacity: fadeOpacity 
        });
        setHeroFadeOpacity(fadeOpacity);
        
        // Also update back button color based on case study scroll
        setIsScrolled(scrollTop > windowHeight * 0.95);

        // 🔥 EXTENSIVE DEBUG LOGGING
        console.log('🔥 CASE STUDY SCROLL (controls fade):', { 
          scrollTop, 
          windowHeight,
          fadeStart,
          fadeEnd,
          fadeProgress: scrollTop > fadeStart ? (scrollTop - fadeStart) / (fadeEnd - fadeStart) : 0,
          fadeOpacity,
          isScrolled: scrollTop > windowHeight * 0.95,
          source: 'caseStudyContainer',
          heroFadeOpacityState: fadeOpacity
        });
        
        // 🔥 FORCE CONSOLE LOG EVERY SCROLL
        console.log(`🔥 FADE DEBUG: scrollTop=${scrollTop}, opacity=${fadeOpacity}, start=${fadeStart}, end=${fadeEnd}`);
      }
    };
    
    // 🔥 LISTEN TO WINDOW SCROLL (for back button color only)
    window.addEventListener('scroll', handleWindowScroll);
    
    // 🔥 LISTEN TO CASE STUDY SCROLL (for black fade effect)
    window.addEventListener('caseStudyScroll', handleContainerScroll);
    
    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      window.removeEventListener('caseStudyScroll', handleContainerScroll);
      if (stateCleanup) {
        stateCleanup();
      }
    };
  }, []);

  // 🔥 DEBUG: LOG WHEN HERO FADE OPACITY CHANGES
  useEffect(() => {
    console.log('🔥 HERO FADE OPACITY STATE CHANGED:', heroFadeOpacity);
  }, [heroFadeOpacity]);

  // 🔥 ALEX HONNOLD VIDEO SCROLL-BASED AUTOPLAY
  useEffect(() => {
    const alexVideo = alexVideoRef.current;
    if (!alexVideo) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Video is in view - play it
            alexVideo.play().catch(console.error);
          } else {
            // Video is out of view - pause it
            alexVideo.pause();
          }
        });
      },
      {
        threshold: 0.5, // Play when 50% of video is visible
      }
    );

    observer.observe(alexVideo);

    return () => {
      observer.disconnect();
    };
  }, []);

  // 🔥 CREATIVE PLATFORM SCROLL-BASED SCALING ANIMATION
  useEffect(() => {
    const container = creativePlatformRef.current;
    const title = animatedTitleRef.current;
    if (!container || !title) return;

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate when element enters viewport (bottom of element touches bottom of screen)
      const elementBottom = rect.bottom;
      const elementTop = rect.top;
      
      // Start animation when element starts entering view, complete when element is centered
      let progress = 0;
      
      if (elementBottom > 0 && elementTop < windowHeight) {
        // Element is in viewport
        const elementCenter = rect.top + rect.height / 2;
        const screenCenter = windowHeight / 2;
        
        if (elementTop > screenCenter) {
          // Element is below center - scale from 0 to 1 as it approaches center
          progress = Math.max(0, 1 - (elementTop - screenCenter) / (windowHeight / 2));
        } else if (elementBottom < screenCenter) {
          // Element is above center - scale from 1 to 0 as it moves away
          progress = Math.max(0, (elementBottom) / screenCenter);
        } else {
          // Element crosses center - full scale
          progress = 1;
        }
      }
      
      // Smooth easing function
      const easeProgress = progress * progress * (3 - 2 * progress);
      
      // Scale from small (1rem) to medium (2.5rem) for more subtle effect
      const minSize = 1;
      const maxSize = 2.5;
      const currentSize = minSize + (maxSize - minSize) * easeProgress;
      
      title.style.fontSize = `${currentSize}rem`;
      title.style.opacity = 0.3 + (0.7 * easeProgress); // Also fade in/out
    };

    // Use both scroll events to ensure it works in case study
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('caseStudyScroll', handleScroll);
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('caseStudyScroll', handleScroll);
    };
  }, []);

  // 🔥 FADE SYSTEM REMOVED - was causing scroll conflicts

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  return (
    <>
      <GlobalStyle />
      <AppContainer>
      <BackButton $isScrolled={isScrolled} onClick={() => {
        // 🔥 PASS REQUIRED PARAMETERS FOR STATE RESTORATION
        if (window.app && window.app._tiles && window.app._camera) {
          window.appState.transitionToPortfolio(
            window.app._tiles,
            window.app._camera,
            window.app
          );
        } else {
          window.appState.transitionToPortfolio();
        }
      }}>← Back</BackButton>
      
            <HeroSection $useStaticHero={useStaticHero} $fadeOpacity={heroFadeOpacity}>
        <Container>
          <HeroGrid>
            <HeroImageColumn>
              <HeroImage />
            </HeroImageColumn>
              <HeroContent>
              <div>
                                  <H1>TENDOR: The climbing app built to understand climbers—not just their data</H1>
                <H2>A motion-tracking climbing app that shows you beta from top climbers, helps you spot technique mistakes, and projects route solutions directly on the wall</H2>
              </div>
              
              <MetaGrid>
                <MetaItem>
                  <MetaLabel>My Role</MetaLabel>
                  <MetaContent>UX/UI Designer, Brand Strategist, <br></br>Visual Designer, Frontend Developer</MetaContent>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>Tools</MetaLabel>
                  <MetaContent>Figma, Adobe Creative Suite, <br></br>React Native, Unity3D</MetaContent>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>Timeline</MetaLabel>
                  <MetaContent>March 2024 - Present</MetaContent>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>Mentors</MetaLabel>
                  <MetaContent>Diego Marini & Connie Lui</MetaContent>
                </MetaItem>
              </MetaGrid>
            </HeroContent>
          </HeroGrid>
        </Container>
      </HeroSection>

      <ContentWrapper>
        <Container>
          <ContentSection>
          <SectionGrid>
            <SectionLabel>
              <H2>Most fitness apps treat climbing like reps, but it's really problem-solving with your body</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>Before I sketched a single screen, I had to figure out what this project even stood for. What I kept coming back to: most fitness apps treat climbers like they're counting reps. But climbing is about solving puzzles with your body, not just tracking effort.</BodyText>
              <BodyText>So I shaped TENDOR around a different goal: smart, personalized support for real climbers. Not a workout log but more like a coach who gets you.</BodyText>
              
              <ExpandButton onClick={() => setIsPersonalStoryExpanded(!isPersonalStoryExpanded)}>
                {isPersonalStoryExpanded ? 'Hide Personal Story' : 'Read My Personal Story'}
              </ExpandButton>
            </SectionContent>
          </SectionGrid>

          <ExpandableSection $isExpanded={isPersonalStoryExpanded}>
            <SectionGrid>
              <SectionLabel>
                <H2>One-size-fits-all advice just doesn't work in a sport this personal</H2>
              </SectionLabel>
              <SectionContent>
                <BodyText>I've been climbing for years, and there's this moment every climber knows. You're on a route, everything's flowing, and then one move just shuts you down. So, like everyone, you scroll Instagram or YouTube hoping to find someone with the same beta.</BodyText>
                <BodyText>But here's what I kept seeing: tips that worked for someone tall didn't help my smaller friend at all. One-size-fits-all advice just doesn't work in a sport this personal.</BodyText>
                <BodyText>That's when I had the "what if" moment. What if tech could understand each climber's movement, style, and body? That's when I decided to combine my background in design, programming, and entrepreneurship to build something better. TENDOR.</BodyText>
              </SectionContent>
            </SectionGrid>

            <LogoFullWidth>PERSONAL CLIMBING STORY FULL-WIDTH PLACEHOLDER</LogoFullWidth>
          </ExpandableSection>

          <SectionGrid>
            <SectionLabel>
            </SectionLabel>
            <SectionContent>
              <VisionMissionGrid>
                <VisionMissionCard>
                  <h3>Vision</h3>
                  <h4>We want a future where sports are not limited by the body or location.</h4>
                </VisionMissionCard>
                <VisionMissionCard>
                  <h3>Mission</h3>
                  <h4>We (em)power athletes with real experiences and new technology to boost their performance.</h4>
                </VisionMissionCard>
              </VisionMissionGrid>
            </SectionContent>
          </SectionGrid>

          <SectionGrid>
            <SectionLabel>
              <H2>Designing a logo that climbs with you</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>The TENDOR logo started as a wordmark, but quickly turned into more of a system. The stylized "N" climbs through the rest of the letters like a route. Every shape around it works like a volume on a gym wall—modular, balanced, and with just a hint of forward motion.</BodyText>
              <VideoContainer onClick={toggleVideoPlayback}>
                <video 
                  ref={videoRef}
                  width="100%" 
                  height="auto" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  style={{ borderRadius: '8px', display: 'block' }}
                >
                  <source src={logoVideo} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <PlayPauseButton 
                  className={`play-pause-button ${isVideoPlaying ? 'playing' : 'paused'}`}
                />
              </VideoContainer>
              <img 
                src={brandArchitecture} 
                alt="Brand Architecture" 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  marginTop: spacing.fullWidthGap,
                  marginBottom: spacing.fullWidthGap,
                  borderRadius: '8px',
                  display: 'block'
                }}
              />
            </SectionContent>
          </SectionGrid>

          <SectionGrid>
            <SectionLabel>
              <H2>Turquoise to cut through the sea of black and earth tones dominating climbing apps</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>Turquoise? Yeah, it's bold. But that was the point I picked turquoise because it cuts through the usual black and earth tones you see in climbing. It's fresh, it feels tech-forward, and it quietly connects both nature (green) and innovation (blue). In user testing, climbers said turquoise makes them feel focused, confident, and "ready to send." That's exactly the energy we want them to feel.</BodyText>
            </SectionContent>
          </SectionGrid>
          
          <ColorShowcase>
            <ColorContainer>
              <GradientHoverLeft>#00C9AB</GradientHoverLeft>
              <GradientHoverRight>#16514D</GradientHoverRight>
              <ColorInnerContainer>
                <GradientHoverLeft>#0C9181</GradientHoverLeft>
                <GradientHoverRight>#16514D</GradientHoverRight>
                <ColorGrid>
                  <ColorPill color="#DE501B" size="large">
                    <ColorText>CTA</ColorText>
                    <ColorHoverText>#DE501B</ColorHoverText>
                  </ColorPill>
                  <ColorPill color="#010C0B" size="large">
                    <ColorText $isLight={false}>TEXT</ColorText>
                    <ColorHoverText $isLight={false}>#010C0B</ColorHoverText>
                  </ColorPill>
                  <ColorPill color="#00C9AB" size="medium">
                    <ColorText $isLight={false}>SUCCESS</ColorText>
                    <ColorHoverText $isLight={false}>#00C9AB</ColorHoverText>
                  </ColorPill>
                  <ColorPill color="#F1FBFA" size="small" $isLight>
                    <ColorText $isLight>FAIL</ColorText>
                    <ColorHoverText $isLight>#F1FBFA</ColorHoverText>
                  </ColorPill>
                  <ColorPill color="#751FEC" size="accent">
                    <ColorText $isLight={false}></ColorText>
                    <ColorHoverText $isLight={false}>#751FEC</ColorHoverText>
                  </ColorPill>
                  <ColorPill color="#DE091A" size="accent">
                    <ColorText $isLight={false}></ColorText>
                    <ColorHoverText $isLight={false}>#DE091A</ColorHoverText>
                  </ColorPill>
                  <ColorPill color="#D81BDE" size="accent">
                    <ColorText $isLight={false}></ColorText>
                    <ColorHoverText $isLight={false}>#D81BDE</ColorHoverText>
                  </ColorPill>
                  <ColorPill color="#DE501B" size="accent">
                    <ColorText $isLight={false}></ColorText>
                    <ColorHoverText $isLight={false}>#DE501B</ColorHoverText>
                  </ColorPill>
                </ColorGrid>
              </ColorInnerContainer>
            </ColorContainer>
          </ColorShowcase>

          <SectionGrid>
          </SectionGrid>

          <SectionGrid>
            <SectionLabel>
              <H2>Choosing a typeface that feels sharp, engineered, and built for absolute clarity</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>Supermolot Grotesk had the right vibe. Angular, engineered, and just a little aggressive, without feeling cold. It mirrors the modular shapes and characteristics in the logo, and gives the whole brand a solid, grounded base to build on.</BodyText>
            </SectionContent>
          </SectionGrid>
          
          <SectionGrid>
            <SectionLabel>
              <LargeTk>
                Tk
                <TCircle />
                <KCircle />
              </LargeTk>

            </SectionLabel>
            <SectionContent style={{
              position: 'relative',
              marginLeft: '-190px',
              marginTop: '250px',
              zIndex: 10
            }}>
              <FullAlphabet>ABCDEFGHIJKLMNOPQRSTUVWXYZ</FullAlphabet>
              <FullAlphabet>abcdefghijklmnopqrstuvwxyz</FullAlphabet>
              <FullAlphabet>1234567890[/.,-;-!?]</FullAlphabet>
              <FontName>TT Supermolot Neue Exp Black</FontName>
            </SectionContent>
          </SectionGrid>



          <SectionGrid>
            <SectionLabel>
              <H2>Climbers don't need more apps. They need the right one. So I designed a UI based on their behavior, not assumptions.</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>To build something climbers actually wanted, I spent time talking to people at gyms—from weekend warriors just starting out to performance climbers pushing their limits. What I found was two distinct groups with different needs but the same underlying desire: they all wanted to get better and connect with others who shared their passion.</BodyText>
              <BodyText>The conversations revealed that while beginners craved guidance and community, advanced climbers were hungry for detailed feedback and ways to share their knowledge. This insight shaped everything that followed.</BodyText>
              <UserResearchContainer>
                <PersonaCard $primary>
                  <PersonaNumber>1</PersonaNumber>
                  <PersonaLabel>Primary Audience</PersonaLabel>
                  <PersonaTitle>Performance Climbers</PersonaTitle>
                  
                  <UserTypeContainer>
                    <UserType>EARLY<br/>USERS</UserType>
                    <UserType>CONTENT<br/>CONTRIBUTORS</UserType>
                  </UserTypeContainer>
                  
                  <PersonaDescription>
                    Tech-savvy climbers aged 18-25 seeking performance enhancement and community connection.
                  </PersonaDescription>
                  
                  <PersonaSection>
                    <PersonaSectionTitle>Interests</PersonaSectionTitle>
                    <PersonaSectionText>
                      Advanced climbing techniques, community events, latest climbing tech.
                    </PersonaSectionText>
                  </PersonaSection>
                  
                  <PersonaSection>
                    <PersonaSectionTitle>Content Appeal</PersonaSectionTitle>
                    <PersonaSectionText>
                      In-depth tutorials, community success stories, and tech advancements in climbing.
                    </PersonaSectionText>
                  </PersonaSection>
                </PersonaCard>
                
                <PersonaCard $secondary>
                  <PersonaNumber>2</PersonaNumber>
                  <PersonaLabel>Secondary Audience</PersonaLabel>
                  <PersonaTitle>Weekend Warriors</PersonaTitle>
                  
                  <UserTypeContainer>
                    <UserType>FUTURE<br/>USERS</UserType>
                    <UserType>CONTENT<br/>CONSUMERS</UserType>
                  </UserTypeContainer>
                  
                  <PersonaDescription>
                    Newcomers and intermediate climbers interested in personal growth and learning.
                  </PersonaDescription>
                  
                  <PersonaSection>
                    <PersonaSectionTitle>Interests:</PersonaSectionTitle>
                    <PersonaSectionText>
                      Basic climbing tips, inspirational climber stories, safety information.
                    </PersonaSectionText>
                  </PersonaSection>
                  
                  <PersonaSection>
                    <PersonaSectionTitle>Content Appeal:</PersonaSectionTitle>
                    <PersonaSectionText>
                      Beginner guides, motivational content, and safety-focused technology insights.
                    </PersonaSectionText>
                  </PersonaSection>
                </PersonaCard>
              </UserResearchContainer>
            </SectionContent>
          </SectionGrid>

          {/* Full-width brand materials image */}
          <FullWidthImagePlaceholder 
            src="/tendor-assets/Editorial.png" 
            alt="TENDOR Brand Materials and Stationery" 
            style={{ 
              width: '100vw',
              height: 'auto',
              marginLeft: 'calc(-50vw + 50%)',
              marginTop: spacing.fullWidthGap,
              marginBottom: spacing.fullWidthGap
            }}
          />

          <SectionGrid>
            <SectionLabel>
              <H2>Icons that move and feel like climbing shapes</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>I created a custom icon set with consistent stroke weights and curves, built to reflect actual climbing moves and concepts. They're clean, bold, and recognizably part of the same visual language.</BodyText>
              <img 
                src="/Icons.png" 
                alt="TENDOR Icon Set" 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  marginTop: spacing.fullWidthGap,
                  marginBottom: spacing.fullWidthGap,
                  borderRadius: '8px',
                  display: 'block'
                }}
              />
            </SectionContent>
          </SectionGrid>

          <SectionGrid>
            <SectionLabel>
              <H2>Standard UI kits weren't enough, so I built custom components.</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>Building TENDOR required creating interface elements that don't exist in typical design systems. Climbers need specialized tools for analyzing movement, sharing beta, and tracking progress in ways that generic fitness apps can't provide.</BodyText>
              
              <BodyText>The core interaction in TENDOR is analyzing climbing movements frame by frame. I designed a specialized video player that lets climbers scrub through their attempts, mark key positions, and compare their technique to optimal solutions.</BodyText>
              <img 
                src="/Comp1.png" 
                alt="TENDOR Move-by-Move Playback Component" 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  marginTop: spacing.fullWidthGap,
                  marginBottom: spacing.sectionGap,
                  borderRadius: '8px',
                  display: 'block'
                }}
              />
              
              <img 
                src="/Comp2.png" 
                alt="TENDOR UI Components" 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  marginTop: spacing.sectionGap,
                  marginBottom: spacing.fullWidthGap,
                  borderRadius: '8px',
                  display: 'block'
                }}
              />
            </SectionContent>
          </SectionGrid>

          <RevealContainer>
            <RevealTrigger>
              <SectionGrid>
                <SectionLabel>
                  <H2>Designing every screen and interaction to feel like part of the climbing experience.</H2>
                </SectionLabel>
                <SectionContent>
                  <BodyText>The mobile app serves as the central hub for the TENDOR experience. Every screen was designed to feel familiar to climbers while introducing innovative features that enhance their training process.</BodyText>
                </SectionContent>
              </SectionGrid>
            </RevealTrigger>
            
            <RevealContent>
              <img 
                src="/tendor-assets/appSCREENS.png" 
                alt="TENDOR App UI Screens and Interactions"
              />
            </RevealContent>
          </RevealContainer>

          <SectionGrid>
            <SectionLabel>
              <H2>I stepped outside design to learn how to track human movement with code</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>This part pushed me out of my comfort zone.</BodyText>
              <BodyText>Building TENDOR's core technology required extensive experimentation with machine learning models and computer vision systems. This was completely new territory for me, combining my design background with technical implementation.</BodyText>
              <video 
                width="100%" 
                height="auto" 
                controls 
                loop 
                muted 
                playsInline
                style={{ borderRadius: '8px', display: 'block', marginTop: spacing.fullWidthGap, marginBottom: spacing.fullWidthGap }}
              >
                <source src="/tendor-assets/tendor-t1.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </SectionContent>
          </SectionGrid>

          <SectionGrid>
            <SectionLabel>
              <H2>TENDOR needed to inspire climbers, not just teach them, so I built Alex Honnold's free solo story to show what's possible when fear doesn't limit you</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>While building TENDOR's technical features, I realized the app needed an emotional core—something that reminds climbers why they fell in love with the sport. Alex Honnold's free solo ascent of El Capitan represents the ultimate expression of climbing: pure focus, complete trust in technique, and the courage to push beyond what seems possible.</BodyText>
              <BodyText>I created this immersive 3D experience to capture that inspiration. Using Spline 3D with AI-generated visuals, I built a story that puts you at different stages of his 3,000-foot climb without ropes. It's not just about the technical achievement—it's about showing TENDOR users the mindset and dedication that defines climbing at its highest level.</BodyText>
            </SectionContent>
            <SectionWidthVideo 
              ref={alexVideoRef}
              controls 
              loop 
              muted 
              playsInline
            >
              <source src="/tendor-assets/TENDOR/FreeSOLO.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </SectionWidthVideo>
          </SectionGrid>

          <SectionGrid>
            <SectionLabel>
              <H2>Building social features that connect climbers and create community around shared climbing progress</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>The climbing community thrives on shared experiences and mutual encouragement. I designed TENDOR's social features to capture this spirit digitally—allowing climbers to share their progress, celebrate achievements together, and find motivation through their community connections.</BodyText>
              <ImagePlaceholder $size="large" style={{width: '100%', height: 'auto', marginTop: spacing.fullWidthGap, marginBottom: spacing.fullWidthGap}}>
                <img src="/Social.png" alt="TENDOR Social Features" style={{width: '100%', height: 'auto', objectFit: 'contain'}} />
              </ImagePlaceholder>
            </SectionContent>
          </SectionGrid>

          {/* H1 Section comes first after Alex Honnold */}
          <SectionTitle $fullWidth>
            <H1 style={{color: '#000000'}}>From app screens to gym walls, TENDOR needed to work everywhere climbers train and connect.</H1>
          </SectionTitle>

          {/* Full Width Image */}
          <div style={{position: 'relative'}}>
            <FullWidthImagePlaceholder 
              src="/tendor-assets/TENDOR/TENDOR1.png" 
              alt="TENDOR Physical Application - Gym Wall Branding" 
            />
            <ImageCaption>Exterior gym wall branding with TENDOR identity</ImageCaption>
          </div>

          {/* Full Width Slider */}
          <SliderContainer>
            <AutoSlider>
              {/* Original set */}
              <SliderImage src="/tendor-assets/TENDOR/Slider1.png" alt="Physical Application 1" />
              <SliderImage src="/tendor-assets/TENDOR/Slider2.png" alt="Physical Application 2" />
              <SliderImage src="/tendor-assets/TENDOR/Slider3.png" alt="Physical Application 3" />
              <SliderImage src="/tendor-assets/TENDOR/Slider4.png" alt="Physical Application 4" />
              <SliderImage src="/tendor-assets/TENDOR/Slider5.png" alt="Physical Application 5" />
              <SliderImage src="/tendor-assets/TENDOR/Slider6.png" alt="Physical Application 6" />
              {/* First duplicate */}
              <SliderImage src="/tendor-assets/TENDOR/Slider1.png" alt="Physical Application 1" />
              <SliderImage src="/tendor-assets/TENDOR/Slider2.png" alt="Physical Application 2" />
              <SliderImage src="/tendor-assets/TENDOR/Slider3.png" alt="Physical Application 3" />
              <SliderImage src="/tendor-assets/TENDOR/Slider4.png" alt="Physical Application 4" />
              <SliderImage src="/tendor-assets/TENDOR/Slider5.png" alt="Physical Application 5" />
              <SliderImage src="/tendor-assets/TENDOR/Slider6.png" alt="Physical Application 6" />
              {/* Second duplicate */}
              <SliderImage src="/tendor-assets/TENDOR/Slider1.png" alt="Physical Application 1" />
              <SliderImage src="/tendor-assets/TENDOR/Slider2.png" alt="Physical Application 2" />
              <SliderImage src="/tendor-assets/TENDOR/Slider3.png" alt="Physical Application 3" />
              <SliderImage src="/tendor-assets/TENDOR/Slider4.png" alt="Physical Application 4" />
              <SliderImage src="/tendor-assets/TENDOR/Slider5.png" alt="Physical Application 5" />
              <SliderImage src="/tendor-assets/TENDOR/Slider6.png" alt="Physical Application 6" />
            </AutoSlider>
          </SliderContainer>

          {/* Layout Grid for Images */}
          <LayoutGrid>
            <div>
              <ImagePlaceholder $size="medium">
                <img src="/tendor-assets/TENDOR/TENDOR11.png" alt="TENDOR Physical Application" />
              </ImagePlaceholder>
            </div>
            <div>
              <ImagePlaceholder $size="medium">
                <img src="/tendor-assets/TENDOR/TENDOR12.png" alt="TENDOR Physical Application" />
              </ImagePlaceholder>
            </div>

            {/* Main climbing area - full width */}
            <div style={{gridColumn: '1 / -1'}}>
              <ImagePlaceholder $size="large" $fullWidth>
                <img src="/tendor-assets/TENDOR/TENDOR10.png" alt="TENDOR Physical Application" />
              </ImagePlaceholder>
            </div>

            {/* Spacer after interior gym group */}
            <PhotoGroupSpacer />

            {/* Category 2: Brand applications */}
            <div>
              <ImageCaption>Brand applications</ImageCaption>
            </div>
            <div></div>
            
            {/* Brand applications - full width */}
            <div style={{gridColumn: '1 / -1'}}>
              <ImagePlaceholder $size="large" $fullWidth>
                <img src="/tendor-assets/TENDOR/TENDOR9.png" alt="TENDOR Physical Application" />
              </ImagePlaceholder>
            </div>

            {/* Spacer after brand applications group */}
            <PhotoGroupSpacer />

            {/* (Em)Powered Performance section moved here */}
            <div style={{gridColumn: '1 / -1', margin: '60px 0'}}>
              <SectionGrid>
                <SectionLabel>
                  <H2>(Em)Powered Performance: Smart feedback that supports, not judges</H2>
                </SectionLabel>
                <SectionContent>
                  <BodyText>(Em)Powered Performance is about two things. First, we're giving you feedback that powers real progress. Second, we're doing it in a way that makes you feel supported, not judged. It's a small play on words, but it sums up everything we're building.</BodyText>
                </SectionContent>
              </SectionGrid>
            </div>

            {/* Category 3: Partnership programs */}
            <div>
              <ImageCaption>Partnership programs</ImageCaption>
            </div>
            <div></div>
            
            <div>
              <ImagePlaceholder $size="medium">
                <img src="/tendor-assets/TENDOR/TENDOR13.png" alt="TENDOR Physical Application" />
              </ImagePlaceholder>
            </div>
            <div>
              <ImagePlaceholder $size="medium">
                <img src="/tendor-assets/TENDOR/TENDOR14.png" alt="TENDOR Physical Application" />
              </ImagePlaceholder>
            </div>

            {/* Full width partnership program image */}
            <div style={{gridColumn: '1 / -1'}}>
              <ImagePlaceholder $size="large" $fullWidth>
                <img src="/tendor-assets/TENDOR/TENDOR17.png" alt="TENDOR Physical Application" />
              </ImagePlaceholder>
            </div>

            {/* Spacer after partnership programs group */}
            <PhotoGroupSpacer />
          </LayoutGrid>

          <SectionGrid>
            <SectionLabel>
              <H2>What I learned designing for a sport I love (and why it was harder than I thought)</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>The biggest challenge was learning to design for a community I'm part of while maintaining objectivity about user needs. Being a climber helped me understand the problem deeply, but I had to constantly validate assumptions through research with other climbers.</BodyText>
            </SectionContent>
          </SectionGrid>

          <ContactFooter>
            <ContactTitle>Get in Touch</ContactTitle>
            <ContactLinks>
              <ContactLink href="mailto:laurens@ramsenthaler.com">
                Email <span>↗</span>
              </ContactLink>
              <ContactLink href="https://www.linkedin.com/in/laurens-ramsenthaler/" target="_blank" rel="noopener noreferrer">
                LinkedIn <span>↗</span>
              </ContactLink>
              <ContactLink href="https://instagram.com/upartig.design" target="_blank" rel="noopener noreferrer">
                Instagram <span>↗</span>
              </ContactLink>
            </ContactLinks>
          </ContactFooter>
          
          </ContentSection>
        </Container>
      </ContentWrapper>
      </AppContainer>
    </>
  );
}

export default App; 