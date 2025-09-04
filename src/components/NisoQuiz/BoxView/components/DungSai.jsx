import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Arial', sans-serif;
`;

const SuccessModal = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  z-index: 10;
  min-width: 400px;
`;

const Title = styled.h1`
  font-size: 48px;
  color: #2c3e50;
  margin: 0 0 20px 0;
  font-weight: bold;
`;

const CheckIcon = styled.div`
  width: 80px;
  height: 80px;
  background: ${props => {
    if (props.isCorrect === true) return '#27ae60';
    if (props.isCorrect === false) return '#e74c3c';
    return '#f39c12'; // Màu cam cho trường hợp hết thời gian
  }};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  position: relative;
  
  &::after {
    content: ${props => {
      if (props.isCorrect === true) return "'✓'";
      if (props.isCorrect === false) return "'✗'";
      return "'⌛'"; // Icon đồng hồ cát cho trường hợp hết thời gian
    }};
    color: white;
    font-size: 40px;
    font-weight: bold;
  }
`;

const Subtitle = styled.p`
  color: #7f8c8d;
  margin: 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const WarningIcon = styled.span`
  color: #f39c12;
  font-size: 18px;
`;

const ScoreDisplay = styled.div`
  background: #2c3e50;
  color: white;
  padding: 15px 30px;
  border-radius: 10px;
  font-size: 24px;
  font-weight: bold;
  margin: 20px 0;
  display: inline-block;
`;

const CongratulatoryText = styled.p`
  color: #2c3e50;
  font-size: 18px;
  margin: 20px 0 0 0;
  font-weight: 500;
`;

const DungSai = ({ isCorrect, score, selectedAnswers, answerId, answerIds }) => {
  console.log('DungSai props:', { isCorrect, score, selectedAnswers, answerId, answerIds });

  const getTitle = () => {
    if (isCorrect === null) return 'Hết thời gian';
    return isCorrect === true ? 'Đúng' : 'Sai';
  };

  const getSubtitle = () => {
    if (isCorrect === null) return 'Bạn chưa chọn đáp án';
    return isCorrect === true ? 'Chuỗi trả lời đúng' : 'Chuỗi trả lời sai';
  };

  const getCongratulatoryText = () => {
    if (isCorrect === null) return 'Hãy nhanh hơn trong lần sau!';
    return isCorrect === true ? 'Bạc vinh danh chào đón bạn!' : 'Cố gắng lần sau nhé!';
  };

  return (
    <Container>
      <SuccessModal>
        <Title>{getTitle()}</Title>
        <CheckIcon isCorrect={isCorrect} />
        <Subtitle>
          {getSubtitle()}
          <WarningIcon>⚠</WarningIcon>
        </Subtitle>
        <ScoreDisplay>+ {score || 0}</ScoreDisplay>
        <CongratulatoryText>
          {getCongratulatoryText()}
        </CongratulatoryText>
        {selectedAnswers && selectedAnswers.length > 0 && (
          <div style={{ marginTop: '10px', color: '#666' }}>
            Đáp án của bạn: {selectedAnswers.join(', ')}
          </div>
        )}
      </SuccessModal>
    </Container>
  );
};

export default DungSai;