import styled, { keyframes } from 'styled-components';
import { Input, Modal, Button } from 'antd';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const dotAnimation = keyframes`
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
`;

const JoinButton = styled(Button)`
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%) !important;
  border: none;
  font-weight: 600;
  color: white !important;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(67, 233, 123, 0.3);
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  transform-origin: center;
  transform: scale(1);
  @media (max-width: 768px) {
    padding: 7px 18px;
    font-size: 0.9rem;
    min-width: 130px;
    gap: 7px;
    height: 38px;
  }
  &:hover:not(:disabled) {
    transform: translateY(-2px) scale(1);
    box-shadow: 0 12px 25px rgba(67, 233, 123, 0.4);
    animation: ${pulse} 0.6s ease-in-out;
  }
  &:active:not(:disabled) {
    transform: translateY(0) scale(1);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: scale(1);
  }
`;

const StyledInput = styled(Input)`
  text-align: center;
  width: 100%;
  max-width: 400px;
  transition: all 0.3s ease;
  @media (max-width: 768px) {
    padding: 10px 15px;
    font-size: 16px;
    max-width: 300px;
  }
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  &[type=number] {
    -moz-appearance: textfield;
  }
`;

const StartQuizButton = styled.button`
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
  border: none;
  padding: 5px 20px;
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
  justify-content: center;
  height: 45px;
  max-width: 400px;
  transform-origin: center;
  transform: scale(1);
  @media (max-width: 768px) {
    padding: 7px 18px;
    font-size: 0.9rem;
    min-width: 130px;
    gap: 7px;
    height: 38px;
    max-width: 300px;
  }
  &:hover:not(:disabled) {
    transform: translateY(-2px) scale(1);
    box-shadow: 0 12px 25px rgba(255, 107, 107, 0.4);
    animation: ${pulse} 0.6s ease-in-out;
  }
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: '';
  }
`;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    border: 1px solid rgba(255,255,255,0.1);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }
  .ant-modal-body {
    overflow: hidden;
    padding: 0;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .ant-modal-header {
    background: transparent;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .ant-tabs {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }
  .ant-tabs-content-holder {
    flex: 1;
    overflow: hidden;
  }
  .ant-tabs-content {
    height: 100%;
  }
  .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.8);
  }
  .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active {
    background: rgba(79, 172, 254, 0.3);
    border-color: #4facfe;
    color: #fff;
  }
  .ant-tabs-tab-btn {
    color: rgba(255,255,255,0.8) !important;
  }
  .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: #fff !important;
  }
  .ant-tabs-ink-bar {
    background: #4facfe !important;
  }
`;

const AvatarPreviewContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
`;

const TabContentContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.3);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.span`
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
  @media (max-width: 768px) { font-size: 0.6rem; }
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 2px;
  margin-left: 2px;
`;

const LoadingDot = styled.div`
  width: 2px;
  height: 2px;
  background-color: white;
  border-radius: 50%;
  animation: ${dotAnimation} 1.4s ease-in-out infinite;
  &:nth-child(1) { animation-delay: 0s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
`;

export {
  JoinButton,
  StyledInput,
  StartQuizButton,
  StyledModal,
  AvatarPreviewContainer,
  TabContentContainer,
  LoadingContainer,
  LoadingSpinner,
  LoadingText,
  LoadingDots,
  LoadingDot
};