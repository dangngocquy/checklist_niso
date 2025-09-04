import React, { useState } from 'react';
import { Typography, Spin } from 'antd';
import { IoTriangle } from 'react-icons/io5';
import { FaDiamond } from 'react-icons/fa6';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { FaCheck } from 'react-icons/fa';
import axios from 'axios';

const { Text } = Typography;

// Styled Components cho Radio
const StyledRadio = styled.div`
  position: relative;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${props => props.checked ? '#fff' : 'rgba(255, 255, 255, 0.7)'};
  background: ${props => props.checked ? '#fff' : 'transparent'};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${props => props.checked ? '0 0 0 2px rgba(255, 255, 255, 0.3)' : 'none'};

  &:hover {
    transform: scale(1.1);
    border-color: #fff;
  }

  &::after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #333;
    opacity: ${props => props.checked ? 1 : 0};
    transform: scale(${props => props.checked ? 1 : 0});
    transition: all 0.2s ease;
  }
`;

// Styled Components cho Checkbox
const StyledCheckbox = styled.div`
  position: relative;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid ${props => props.checked ? '#fff' : 'rgba(255, 255, 255, 0.7)'};
  background: ${props => props.checked ? '#fff' : 'transparent'};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${props => props.checked ? '0 0 0 2px rgba(255, 255, 255, 0.3)' : 'none'};

  &:hover {
    transform: scale(1.1);
    border-color: #fff;
  }

  svg {
    color: #333;
    font-size: 12px;
    opacity: ${props => props.checked ? 1 : 0};
    transform: scale(${props => props.checked ? 1 : 0});
    transition: all 0.2s ease;
  }
`;

const TrueFalse = ({ question, viewOnly = false, isParticipantView = false }) => {
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [loading, setLoading] = useState(false);

  const answerColors = [
    {
      color: '#ff6b6b',
      shape: <IoTriangle />,
      bg: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
      shadowColor: 'rgba(255, 107, 107, 0.4)',
      ringColor: '#ff6b6b'
    },
    {
      color: 'rgb(19, 104, 206)',
      shape: <FaDiamond />,
      bg: 'linear-gradient(135deg, rgb(19, 104, 206), rgb(59, 130, 246))',
      shadowColor: 'rgba(19, 104, 206, 0.4)',
      ringColor: 'rgb(19, 104, 206)'
    }
  ];

  const handleAnswerSelect = async (index) => {
    let newSelectedAnswers;
    if (question.answerType === 'single') {
      newSelectedAnswers = [index];
    } else {
      newSelectedAnswers = selectedAnswers.includes(index)
        ? selectedAnswers.filter(i => i !== index)
        : [...selectedAnswers, index];
    }
    setSelectedAnswers(newSelectedAnswers);

    if (isParticipantView) {
      setLoading(true);
      try {
        const response = await axios.post(
          `/api/quizzes/update-pin`,
          {
            quizId: question.quizId,
            clientId: localStorage.getItem('quizClientId'),
            selectedAnswers: [{
              questionId: question.questionId,
              answers: newSelectedAnswers
            }],
            questionId: question.questionId
          },
          {
            headers: {
              Authorization: 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME),
              'Content-Type': 'application/json',
            },
          }
        );
        if (!response.data.success) {
          console.error('Failed to update selected answers:', response.data.message);
        }
      } catch (error) {
        console.error('Error updating selected answers:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!question || !question.answers || !Array.isArray(question.answers)) {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        fontSize: '16px',
        border: '2px dashed #d1d5db'
      }}>
        No question data available
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 20px 0' }}>
      <Spin spinning={loading} fullscreen />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: window.innerWidth < 768 ? '8px' : '16px',
        width: '100%',
        gridAutoRows: '1fr',
      }} className='mobileQuiz'>
        {question.answers.map((answer, index) => {
          const colorScheme = answerColors[index % answerColors.length];
          const isSelected = selectedAnswers.includes(index);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              whileHover={{
                scale: 1.02,
                y: -4,
                transition: { duration: 0.3 }
              }}
              onClick={() => !viewOnly && handleAnswerSelect(index)}
              style={{
                position: 'relative',
                background: colorScheme.bg,
                borderRadius: window.innerWidth < 768 ? '12px' : '16px',
                padding: window.innerWidth < 768 ? '8px' : '12px',
                minHeight: window.innerWidth < 768 ? '80px' : '100px',
                overflow: 'hidden',
                cursor: viewOnly ? 'default' : 'pointer',
                border: isSelected ? `2px solid ${colorScheme.ringColor}` : 'none',
                boxShadow: isSelected ? `0 0 0 2px ${colorScheme.shadowColor}` : 'none'
              }}
            >
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                zIndex: 2,
                cursor: 'pointer',
                display: 'flex',
                gap: '16px',
                flexDirection: 'row',
                alignItems: 'center'
              }} onClick={(e) => {
                e.stopPropagation();
                if (isParticipantView) {
                  handleAnswerSelect(index);
                }
              }}>
                {isParticipantView && (
                  <div style={{ position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)', zIndex: 3 }}>
                    {question.answerType === 'single' ? (
                      <StyledRadio
                        checked={isSelected}
                      />
                    ) : (
                      <StyledCheckbox
                        checked={isSelected}
                      >
                        <FaCheck />
                      </StyledCheckbox>
                    )}
                  </div>
                )}

                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: window.innerWidth < 768 ? '36px' : '48px',
                    minWidth: window.innerWidth < 768 ? '36px' : '48px',
                    height: window.innerWidth < 768 ? '36px' : '48px',
                    minHeight: window.innerWidth < 768 ? '36px' : '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: window.innerWidth < 768 ? '8px' : '12px',
                    fontSize: window.innerWidth < 768 ? '18px' : '24px',
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  {colorScheme.shape}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    padding: '8px 0',
                  }}
                >
                  <Text
                    strong
                    style={{
                      color: '#fff',
                      textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                      wordBreak: 'break-word',
                      hyphens: 'auto',
                      fontSize: window.innerWidth < 768 ? '14px' : '16px',
                      lineHeight: 1.4,
                      textAlign: 'left',
                      width: '100%',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {answer.text}
                  </Text>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TrueFalse; 