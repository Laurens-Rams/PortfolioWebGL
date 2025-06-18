import React, { useState, useEffect, useRef } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { H1, H2, BodyText, Container } from './DesignSystem';
import footerImage from '../public/tendor-assets/Footer_Placerholder.png';
import logoVideo from '../public/tendor-assets/LOGO.mp4';
import brandArchitecture from '../public/tendor-assets/Brand_arhcitecture.png';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0 !important;
    padding: 0 !important;
  }
  
  * {
    box-sizing: border-box;
  }
`;

const AppContainer = styled.div`
  background-color: transparent !important;
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
  z-index: 1000;
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
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: ${props => props.$useStaticHero ? 'url(/tendor-assets/HERO_Image.jpg) center/cover no-repeat' : 'rgba(0, 0, 0, 0.1)'} !important;
  z-index: 1;
  
  /* 🔥 FADE OVERLAY REMOVED - was causing too many issues */
  
  @media (max-width: 768px) {
    position: relative;
    min-height: auto;
  }
`;

const HeroGrid = styled.div`
  position: relative;
  z-index: 2;
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
  margin: 0 0 40px 0;
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 40px 60px;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 32px;
    margin-bottom: 80px;
    margin-top: -20px;
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
  background-color: #ffffff;
  position: relative;
  z-index: 2;
  width: 100%;
  min-height: 200vh;
`;

const ContentSection = styled.section`
  padding: 80px 0;
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 80px;
  align-items: start;
  margin-bottom: 80px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 32px;
    margin-bottom: 60px;
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
  margin: 40px 0;
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
  margin: 20px 0;
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
  gap: 40px;
  margin: 40px 0;
  
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
    margin: 0 0 16px 0;
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
  margin: 80px calc(-50vw + 50%);
  font-family: 'ABC Repro', sans-serif;
  font-size: 1rem;
  color: #666666;
`;

const ColorShowcase = styled.div`
  width: 100vw;
  margin: 40px calc(-50vw + 50%);
  padding: 80px;
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
  margin-top: 40px;
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

function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [useStaticHero, setUseStaticHero] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // 🔥 CHECK IF WE SHOULD USE STATIC HERO AND SUBSCRIBE TO CHANGES
    let stateCleanup = null;
    
    if (window.appState) {
      const state = window.appState.getState();
      setUseStaticHero(state.useStaticHero);
      console.log('🔥 TENDOR App - initial useStaticHero:', state.useStaticHero);
      
      // 🔥 SUBSCRIBE TO STATE CHANGES
      const handleStateChange = (data) => {
        if (data.newState && data.newState.useStaticHero !== undefined) {
          console.log('🔥 TENDOR App - useStaticHero changed to:', data.newState.useStaticHero);
          setUseStaticHero(data.newState.useStaticHero);
        }
      };
      
      window.appState.subscribe('stateChange', handleStateChange);
      
      stateCleanup = () => {
        if (window.appState && window.appState.unsubscribe) {
          window.appState.unsubscribe('stateChange', handleStateChange);
        }
      };
    }
    
    const handleScroll = (e) => {
      // Get scroll position from container or window
      const scrollTop = e.target?.scrollTop || window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      
      // 🔥 Window scroll events are now blocked at source in case study mode
      
      // Update scrollY state
      setScrollY(scrollTop);
      
      // Back button color change - only turn black when past hero (95% of viewport)
      setIsScrolled(scrollTop > windowHeight * 0.95);

      console.log('🔥 TENDOR App scroll event', { 
        scrollTop, 
        isScrolled: scrollTop > windowHeight * 0.95,
        useStaticHero,
        threshold: windowHeight * 0.95
      });
    };

    // Listen to window scroll events (simplified - no fade conflicts)
    window.addEventListener('scroll', handleScroll);
    
    // Also listen for container scroll events dispatched by CaseStudyContainer
    const handleContainerScroll = (e) => {
      if (e.detail && e.detail.scrollTop !== undefined) {
        // 🔥 ALWAYS USE CASE STUDY SCROLL EVENTS - they're clean
        console.log('🔥 USING CASE STUDY SCROLL:', e.detail.scrollTop);
        handleScroll({ target: { scrollTop: e.detail.scrollTop } });
      }
    };
    
    window.addEventListener('caseStudyScroll', handleContainerScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('caseStudyScroll', handleContainerScroll);
      if (stateCleanup) {
        stateCleanup();
      }
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
      
            <HeroSection $useStaticHero={useStaticHero}>
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
              <H2>One-size-fits-all advice just doesn't work in a sport this personal</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>I've been climbing for years, and there's this moment every climber knows. You're on a route, everything's flowing, and then one move just shuts you down. So, like everyone, you scroll Instagram or YouTube hoping to find someone with the same beta.</BodyText>
              <BodyText>But here's what I kept seeing: tips that worked for someone tall didn't help my smaller friend at all. One-size-fits-all advice just doesn't work in a sport this personal.</BodyText>
              <BodyText>That's when I had the "what if" moment. What if tech could understand each climber's movement, style, and body? That's when I decided to combine my background in design, programming, and entrepreneurship to build something better. TENDOR.</BodyText>
            </SectionContent>
          </SectionGrid>

          <LogoFullWidth>PERSONAL CLIMBING STORY FULL-WIDTH PLACEHOLDER</LogoFullWidth>

          <SectionGrid>
            <SectionLabel>
              <H2>Most fitness apps treat climbing like reps, but it's really problem-solving with your body</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>Before I sketched a single screen, I had to figure out what this project even stood for. What I kept coming back to: most fitness apps treat climbers like they're counting reps. But climbing is about solving puzzles with your body, not just tracking effort.</BodyText>
              <BodyText>So I shaped TENDOR around a different goal: smart, personalized support for real climbers. Not a workout log but more like a coach who gets you.</BodyText>
              
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
                  marginTop: '20px',
                  borderRadius: '8px',
                  display: 'block'
                }}
              />
            </SectionContent>
          </SectionGrid>

          <SectionGrid>
            <SectionLabel>
              <H2>Turquoise to cut through the sea of black and earth tones common in climbing gear and apps</H2>
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
              <H2>Choosing a typeface that feels sharp, engineered, and built for clarity</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>Supermolot Grotesk had the right vibe. Angular, engineered, and just a little aggressive, without feeling cold. It mirrors the modular shapes and characteristics in the logo, and gives the whole brand a solid, grounded base to build on.</BodyText>
              <SmallPlaceholder>TYPOGRAPHY SHOWCASE PLACEHOLDER</SmallPlaceholder>
            </SectionContent>
          </SectionGrid>

          <SectionGrid>
            <SectionLabel>
              <H2>Standard UI kits weren't enough, so I built new special components made for climbers' needs.</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>Building TENDOR required creating interface elements that don't exist in typical design systems. Climbers need specialized tools for analyzing movement, sharing beta, and tracking progress in ways that generic fitness apps can't provide.</BodyText>
              
              <BodyText>The core interaction in TENDOR is analyzing climbing movements frame by frame. I designed a specialized video player that lets climbers scrub through their attempts, mark key positions, and compare their technique to optimal solutions.</BodyText>
              <Placeholder>MOVE-BY-MOVE PLAYBACK COMPONENT PLACEHOLDER</Placeholder>
              
              <Caption>CAPTION: Progress Visualizer</Caption>
              <SmallPlaceholder>PROGRESS VISUALIZER PLACEHOLDER</SmallPlaceholder>
              
              <Caption>CAPTION: Scanning for AR Animation</Caption>
              <SmallPlaceholder>AR SCANNING PLACEHOLDER</SmallPlaceholder>
              
              <Caption>CAPTION: Recording your Body Movement</Caption>
              <SmallPlaceholder>BODY MOVEMENT RECORDING PLACEHOLDER</SmallPlaceholder>
            </SectionContent>
          </SectionGrid>

          <SectionGrid>
            <SectionLabel>
              <H2>Designing every screen and interaction to feel like part of the climb.</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>The mobile app serves as the central hub for the TENDOR experience. Every screen was designed to feel familiar to climbers while introducing innovative features that enhance their training process.</BodyText>
              <BodyText>(Show the UI and Interactions here)</BodyText>
              <Placeholder>APP SCREENS PLACEHOLDER</Placeholder>
            </SectionContent>
          </SectionGrid>

          <SectionGrid>
            <SectionLabel>
              <H2>Icons that move and feel like climbing shapes</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>I created a custom icon set with consistent stroke weights and curves, built to reflect actual climbing moves and concepts. They're clean, bold, and recognizably part of the same visual language.</BodyText>
              <SmallPlaceholder>ICON SET PLACEHOLDER</SmallPlaceholder>
            </SectionContent>
          </SectionGrid>

          <SectionGrid>
            <SectionLabel>
              <H2>Climbers don't need more apps. They need the right one. So I designed a UI based on their behavior, not assumptions.</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>To build something climbers actually wanted, I needed to understand their current frustrations and workflows. I conducted interviews with 15 intermediate climbers across different gyms to identify pain points in their training process.</BodyText>
              <BodyText><strong>Main Audience: Overwhelmed Olav - Content Consumers</strong></BodyText>
              <BodyText>Indoor gym boulderers who are already filming themselves to learn and share or naturally gravitate towards social sharing apps. Especially in Asia, where self recording is part of the culture, adoption will be natural.</BodyText>
              <Placeholder>USER RESEARCH PLACEHOLDER</Placeholder>
            </SectionContent>
          </SectionGrid>

          <SectionGrid>
            <SectionLabel>
              <H2>I stepped outside design to learn how to track human movement with code</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>This part pushed me out of my comfort zone.</BodyText>
              <BodyText>Building TENDOR's core technology required extensive experimentation with machine learning models and computer vision systems. This was completely new territory for me, combining my design background with technical implementation.</BodyText>
              <Placeholder>TECHNICAL EXPERIMENTATION PLACEHOLDER</Placeholder>
            </SectionContent>
          </SectionGrid>

          <SectionGrid>
            <SectionLabel>
              <H2>CREATIVE PLATFORM</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>(Em) Powered Performance</BodyText>
              <BodyText>(Em)Powered Performance is about two things. First, we're giving you feedback that powers real progress. Second, we're doing it in a way that makes you feel supported, not judged. It's a small play on words, but it sums up everything we're building.</BodyText>
            </SectionContent>
          </SectionGrid>

          <SectionGrid>
            <SectionLabel>
              <H2>Turning the app into something climbers physically experience</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>While TENDOR started as a mobile app, I realized the brand needed to exist in physical spaces where climbing actually happens. This led to exploring partnerships with gyms and developing branded experiences that bridge digital and physical climbing.</BodyText>
              <BodyText>I designed a comprehensive partnership program that brings TENDOR's technology directly into climbing gyms. This includes wall-mounted camera systems, AR projection equipment, and branded training areas that create immersive learning environments.</BodyText>
              <BodyText>(NOTE: Show the brand touchpoints as mockups between)</BodyText>
              <BodyText>The visual identity needed to work across diverse physical applications, from gym signage to equipment branding. I developed guidelines that maintain brand consistency while adapting to different materials and environments.</BodyText>
              <Placeholder>PHYSICAL APPLICATIONS PLACEHOLDER</Placeholder>
            </SectionContent>
          </SectionGrid>

          <SectionGrid>
            <SectionLabel>
              <H2>What I learned designing for a sport I love (and why it was harder than I thought)</H2>
            </SectionLabel>
            <SectionContent>
              <BodyText>The biggest challenge was learning to design for a community I'm part of while maintaining objectivity about user needs. Being a climber helped me understand the problem deeply, but I had to constantly validate assumptions through research with other climbers.</BodyText>
            </SectionContent>
          </SectionGrid>

          <FooterImage src={footerImage} alt="Footer" />
          
          </ContentSection>
        </Container>
      </ContentWrapper>
      </AppContainer>
    </>
  );
}

export default App; 