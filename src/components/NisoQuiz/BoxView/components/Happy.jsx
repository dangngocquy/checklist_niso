import React, { useState, useEffect } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';

// Global styles
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Arial', sans-serif;
    overflow: hidden;
  }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
`;

const sparkle = keyframes`
  0%, 100% {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1) rotate(180deg);
  }
`;

const confettiFall = keyframes`
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

// Styled Components
const Container = styled.div`
  width: 100vw;
  height: 100vh;
 background: ${props => `url(${props.backgroundImage}) no-repeat center / cover`};
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
`;

const ContentWrapper = styled.div`
  text-align: center;
  z-index: 10;
  position: relative;
`;

const ScoreContainer = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 3rem 4rem;
  margin: 2rem 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  animation: ${bounce} 2s infinite;
  backdrop-filter: blur(10px);
`;

const ScoreLabel = styled.p`
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 1rem;
  font-weight: 600;
`;

const ScoreNumber = styled.div`
  font-size: 6rem;
  font-weight: bold;
  color: #ff6b6b;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: ${pulse} 2s infinite;
`;

const Confetti = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  background: ${props => props.color};
  animation: ${confettiFall} ${props => props.duration}s linear infinite;
  left: ${props => props.left}%;
  animation-delay: ${props => props.delay}s;
  border-radius: ${props => props.shape === 'circle' ? '50%' : '0'};
  transform: rotate(${props => props.rotation}deg);
`;

const Sparkle = styled.div`
  position: absolute;
  width: 20px;
  height: 20px;
  background: #ffd700;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  animation: ${sparkle} 3s infinite;
  left: ${props => props.left}%;
  top: ${props => props.top}%;
  animation-delay: ${props => props.delay}s;
`;

const Happy = ({ backgroundImage }) => {
    const [score, setScore] = useState(0);
    const [targetScore] = useState(95); // Điểm số mục tiêu
    const [confettiPieces, setConfettiPieces] = useState([]);
    const [sparkles, setSparkles] = useState([]);

    // Hiệu ứng đếm số
    useEffect(() => {
        const interval = setInterval(() => {
            setScore(prev => {
                if (prev < targetScore) {
                    return prev + 1;
                }
                clearInterval(interval);
                return targetScore;
            });
        }, 30);

        return () => clearInterval(interval);
    }, [targetScore]);

    // Tạo confetti
    useEffect(() => {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
        const shapes = ['circle', 'square'];

        const pieces = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            color: colors[Math.floor(Math.random() * colors.length)],
            left: Math.random() * 100,
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 2,
            shape: shapes[Math.floor(Math.random() * shapes.length)],
            rotation: Math.random() * 360
        }));

        setConfettiPieces(pieces);
    }, []);

    // Tạo sparkles
    useEffect(() => {
        const sparkleElements = Array.from({ length: 15 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 100,
            delay: Math.random() * 3
        }));

        setSparkles(sparkleElements);
    }, []);

    return (
        <>
            <GlobalStyle />
            <Container backgroundImage={backgroundImage}>
                {confettiPieces.map(piece => (
                    <Confetti
                        key={piece.id}
                        color={piece.color}
                        left={piece.left}
                        duration={piece.duration}
                        delay={piece.delay}
                        shape={piece.shape}
                        rotation={piece.rotation}
                    />
                ))}

                {/* Sparkles */}
                {sparkles.map(sparkle => (
                    <Sparkle
                        key={sparkle.id}
                        left={sparkle.left}
                        top={sparkle.top}
                        delay={sparkle.delay}
                    />
                ))}

                <ContentWrapper>
                    <ScoreContainer>
                        <ScoreLabel>Điểm số của bạn</ScoreLabel>
                        <ScoreNumber>{score}</ScoreNumber>
                    </ScoreContainer>
                    <div style={{ marginTop: 15 }}>
                    </div>
                </ContentWrapper>
            </Container>
        </>
    );
};

export default Happy;