import React from 'react';
import styled, { keyframes } from 'styled-components';

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const bounceIn = keyframes`
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  70% {
    transform: scale(0.9);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const sparkle = keyframes`
  0%, 100% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1) rotate(180deg);
    opacity: 1;
  }
`;

// Styled Components
const CountdownContainer = styled.div`
  min-height: 100vh;
  background: ${props => `url(${props.backgroundImage}) no-repeat center / cover`};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 2;
  animation: ${fadeInUp} 0.8s ease-out;
`;

const ReadySection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  opacity: ${props => props.show ? 1 : 0};
  transform: ${props => props.show ? 'translateY(0)' : 'translateY(-20px)'};
  transition: all 0.5s ease-out;
`;

const ReadyText = styled.div`
  font-size: 3.5rem;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
  text-align: center;
  letter-spacing: 3px;
  animation: ${pulse} 1.5s ease-in-out infinite;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
    letter-spacing: 2px;
  }
  
  @media (max-width: 480px) {
    font-size: 2rem;
    letter-spacing: 1px;
  }
`;

const ReadySubText = styled.div`
  font-size: 1.4rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  text-align: center;
  font-weight: 500;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const CountdownSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  opacity: ${props => props.show ? 1 : 0};
  transform: ${props => props.show ? 'scale(1)' : 'scale(0.8)'};
  transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
`;

const CountdownCircle = styled.div`
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 768px) {
    width: 160px;
    height: 160px;
  }
  
  @media (max-width: 480px) {
    width: 140px;
    height: 140px;
  }
  
  &::before {
    content: '';
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    padding: 2px;
    background: linear-gradient(45deg, #43e97b, #38f9d7, #667eea, #764ba2);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    animation: rotate 3s linear infinite;
  }
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const CountdownNumber = styled.div`
  font-size: 5rem;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 6px 12px rgba(0, 0, 0, 0.7);
  animation: ${bounceIn} 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  position: relative;
  z-index: 2;
  
  @media (max-width: 768px) {
    font-size: 4rem;
  }
  
  @media (max-width: 480px) {
    font-size: 3.5rem;
  }
`;

const CountdownLabel = styled.div`
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  font-weight: 600;
  text-align: center;
  letter-spacing: 1px;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const SparkleEffect = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  &::before,
  &::after {
    content: '🤡';
    position: absolute;
    font-size: 1.5rem;
    animation: ${sparkle} 2s ease-in-out infinite;
  }
  
  &::before {
    top: 20%;
    left: 20%;
    animation-delay: 0s;
  }
  
  &::after {
    bottom: 20%;
    right: 20%;
    animation-delay: 1s;
  }
`;

const ProgressBar = styled.div`
  width: 300px;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 20px;
  
  @media (max-width: 768px) {
    width: 250px;
  }
  
  @media (max-width: 480px) {
    width: 200px;
  }
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #43e97b, #38f9d7);
    border-radius: 3px;
    animation: progress 3s linear infinite;
  }
  
  @keyframes progress {
    0% { width: 0%; }
    100% { width: 100%; }
  }
`;

const Countdown = ({ showReady, countdown, backgroundImage }) => {
  return (
    <CountdownContainer backgroundImage={backgroundImage}>
      <ContentWrapper>
        {showReady && <ReadySection show={showReady}>
          <ReadyText>SẴN SÀNG!</ReadyText>
          <ReadySubText>Trò chơi sắp bắt đầu</ReadySubText>
          <ProgressBar />
        </ReadySection>
        }

        <CountdownSection show={countdown !== null}>
          <CountdownCircle>
            <CountdownNumber key={countdown}>
              {countdown}
            </CountdownNumber>
            <SparkleEffect />
          </CountdownCircle>
          <CountdownLabel>Giây</CountdownLabel>
        </CountdownSection>
      </ContentWrapper>
    </CountdownContainer>
  );
};

export default Countdown;