import styled, { keyframes } from 'styled-components';
import { Button, Modal } from 'antd';

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
`;

// Loading animations
const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const loadingPulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const dotAnimation = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

// Hover animation for participant items
const hoverGlow = keyframes`
  0% {
    box-shadow: 0 4px 15px rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow: 0 8px 25px rgba(255, 255, 255, 0.5);
  }
  100% {
    box-shadow: 0 4px 15px rgba(255, 255, 255, 0.3);
  }
`;

// Styled Components
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: ${props => props.backgroundImage ? `url(${props.backgroundImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  background-size: cover;
  background-position: center;
  padding: 0 20px 0 20px;
`;

export const Title = styled.h1`
  color: white;
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 2rem;
  margin-top: 2rem;
  text-align: center;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  animation: ${fadeIn} 1s ease-out;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-top: 2.8rem;
  }
`;

export const LockButton = styled(Button)`
  background: ${props => props.isLocked ? 'linear-gradient(45deg, #f44336, #ef5350)' : 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'} !important;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  color: white !important;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
`;

export const StartButton = styled(Button)`
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e) !important;
  border: none;
  padding: 15px 40px;
  font-weight: 600;
  color: white !important;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 25px rgba(255, 107, 107, 0.4);
    animation: ${pulse} 0.6s ease-in-out;
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

// Loading Components
export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

export const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  aspect-ratio: 1;
  min-width: 24px;
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    width: 16px;
    height: 16px;
    min-width: 16px;
    min-height: 16px;
    border-width: 2px;
  }
`;

export const LoadingText = styled.span`
  color: #fff;
  font-size: 14px;
  font-weight: 500;
`;

export const LoadingDots = styled.div`
  display: flex;
  gap: 4px;
  margin-left: 4px;
`;

export const LoadingDot = styled.div`
  width: 4px;
  height: 4px;
  background-color: white;
  border-radius: 50%;
  animation: ${dotAnimation} 1.4s ease-in-out infinite;
  
  &:nth-child(1) {
    animation-delay: 0s;
  }
  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  &:nth-child(3) {
    animation-delay: 0.4s;
  }
`;

// New Styled Components
export const WaitingContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  animation: ${fadeIn} 1s ease-out;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const PinSection = styled.div`
  background: white;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  min-width: 300px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 20px;

  @media (max-width: 768px) {
    width: 100%;
    min-width: unset;
    padding: 12px;
    gap: 10px;
    margin-top: 10px;
  }
`;

export const PinContent = styled.div`
  flex: 1;

  @media (max-width: 768px) {
    flex: 1;
    min-width: 0;
  }
`;

export const PinLabel = styled.div`
  color: #666;
  font-size: 1.1rem;
  font-weight: 600;
  text-align: left;

  @media (max-width: 768px) {
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const PinDisplay = styled.div`
  font-size: 3.5rem;
  font-weight: 900;
  color: #333;
  letter-spacing: 0.3rem;
  display: flex;
  gap: 1rem;
  cursor: ${props => props.isLocked ? 'not-allowed' : 'pointer'};
  padding: 0 5px;
  transition: all 0.3s ease;
  position: relative;
  
  ${props => props.isLocked && `
    color: #333;
    background: #333;
    border-radius: 8px;
    padding: 0 10px;
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      background: #333;
      border-radius: 8px;
      z-index: 1;
    }
    
    .pin-group {
      position: relative;
      z-index: 2;
      color: #333;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      opacity: 0;
    }
    
    .lock-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 3;
      color: white;
      font-size: 2rem;
    }

    &:hover {
      background: #444;
      &::before {
        background: #444;
      }
    }
  `}
  
  &:hover {
    background-color: ${props => props.isLocked ? 'transparent' : 'rgba(0, 0, 0, 0.1)'};
  }
  
  @media (max-width: 768px) {
    font-size: 2rem;
    letter-spacing: 0.15rem;
    gap: 0.3rem;
    justify-content: flex-start;
  }
`;

export const PinGroup = styled.span`
  display: inline-block;
  position: relative;
  z-index: 2;
`;

export const LockIconWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  color: white;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

export const LoadingPin = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  color: #666;
  height: 60px;

  @media (max-width: 768px) {
    font-size: 0.9rem;
    height: 40px;
  }
`;

export const QRSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    padding: 8px;
    flex-shrink: 0;
  }

  &:hover {
    transform: scale(1.05);
    
    .qr-overlay {
      opacity: 1;
    }
  }
`;

export const QROverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
  font-size: 14px;
  font-weight: 500;
`;

export const QRModal = styled(Modal)`
  .ant-modal-content {
    padding: 24px;
    border-radius: 16px;

    @media (max-width: 768px) {
      padding: 12px;
    }
  }

  .ant-modal-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 0;

    @media (max-width: 768px) {
      gap: 8px;
    }
  }

  .qr-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    text-align: center;

    @media (max-width: 768px) {
      font-size: 14px;
    }
  }

  .qr-description {
    font-size: 14px;
    color: #666;
    text-align: center;
    margin-bottom: 8px;

    @media (max-width: 768px) {
      font-size: 12px;
      margin-bottom: 4px;
    }
  }

  .qr-actions {
    display: flex;
    gap: 16px;
    margin-top: 8px;

    @media (max-width: 768px) {
      gap: 8px;
      margin-top: 4px;
    }
  }

  .qr-action-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid #d9d9d9;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
    color: #333;

    @media (max-width: 768px) {
      padding: 4px 8px;
      font-size: 12px;
      gap: 4px;
    }

    .anticon {
      font-size: 16px;

      @media (max-width: 768px) {
        font-size: 12px;
      }
    }
  }
`;

export const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.4);
  }
`;

export const ParticipantsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

export const ParticipantItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #333;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 500;
  animation: ${fadeIn} 0.3s ease-out;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  width: fit-content;
  max-width: 300px;

  @media (max-width: 768px) {
    padding: 6px 10px;
    gap: 6px;
    max-width: 200px;
    border-radius: 8px;
  }

  &:hover {
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8));
    transform: translateY(-5px);
    animation: ${hoverGlow} 1s ease-in-out infinite;
    
    .participant-name {
      text-decoration: line-through;
      text-decoration-color: rgba(255, 255, 255, 0.8);
      text-decoration-thickness: 2px;
    }

    .delete-icon {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.6s ease;
  }

  &:hover::before {
    left: 100%;
  }
`;

export const ParticipantName = styled.span`
  flex: 1;
  font-size: 18px;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

export const NoParticipants = styled.div`
  text-align: center;
  color: #333;
  font-style: italic;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(8px);
  animation: ${fadeIn} 0.5s ease-out, ${loadingPulse} 2s ease-in-out infinite;
  font-size: 15px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 300px;
  margin: 0 auto;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  }

  @media (max-width: 768px) {
    padding: 1rem;
    font-size: 13px;
    max-width: 250px;
  }
`;

export const ControlsSection = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  margin: 1rem 0 4rem 0;
  width: 100%;

  @media (max-width: 768px) {
    gap: 0.5rem;
    margin: 0.6rem 0 2.5rem 0;
  }
`;
