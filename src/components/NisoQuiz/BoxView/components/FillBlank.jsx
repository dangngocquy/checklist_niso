import React, { useState } from 'react';
import { Typography, Input } from 'antd';
import { IoTriangle } from 'react-icons/io5';
import { FaDiamond, FaCircle, FaSquare } from 'react-icons/fa6';
import { PiParallelogramFill } from 'react-icons/pi';
import { TbTriangleInvertedFilled } from 'react-icons/tb';

const { Text } = Typography;

const FillBlank = ({ question, viewOnly = false }) => {
  const [answer, setAnswer] = useState('');
  const [showAnswers, setShowAnswers] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

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
    },
    {
      color: 'rgb(216, 158, 0)',
      shape: <FaCircle />,
      bg: 'linear-gradient(135deg, rgb(216, 158, 0), rgb(245, 158, 11))',
      shadowColor: 'rgba(216, 158, 0, 0.4)',
      ringColor: 'rgb(216, 158, 0)'
    },
    {
      color: '#95e1d3',
      shape: <FaSquare />,
      bg: 'linear-gradient(135deg, #95e1d3, #14b8a6)',
      shadowColor: 'rgba(149, 225, 211, 0.4)',
      ringColor: '#95e1d3'
    },
    {
      color: '#a97aff',
      shape: <PiParallelogramFill />,
      bg: 'linear-gradient(135deg, #a97aff, #8b5cf6)',
      shadowColor: 'rgba(169, 122, 255, 0.4)',
      ringColor: '#a97aff'
    },
    {
      color: 'rgb(134, 76, 191)',
      shape: <TbTriangleInvertedFilled />,
      bg: 'linear-gradient(135deg, rgb(134, 76, 191), rgb(147, 51, 234))',
      shadowColor: 'rgba(134, 76, 191, 0.4)',
      ringColor: 'rgb(134, 76, 191)'
    }
  ];

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      setShowAnswers(true);
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
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <Input
          placeholder="Nhập đáp án của bạn..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{
            idth: window.innerWidth < 768 ? '100%' : '80%',
            height: '60px',
            fontSize: '18px',
            background: answer ? 'linear-gradient(135deg, #ff6b6b, #ee5a52)' : 'rgba(255, 255, 255, 1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: '#fff',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: window.innerWidth < 768 ? '8px' : '16px',
        width: '100%',
        gridAutoRows: '1fr',
        opacity: showAnswers ? 1 : 0,
        transform: showAnswers ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }} className='mobileQuiz'>
        {question.answers.map((answer, index) => {
          const isHovered = hoveredIndex === index;
          const colorScheme = answerColors[index % answerColors.length];

          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                position: 'relative',
                background: colorScheme.bg,
                borderRadius: window.innerWidth < 768 ? '12px' : '16px',
                padding: window.innerWidth < 768 ? '8px' : '12px',
                minHeight: window.innerWidth < 768 ? '80px' : '100px',
                transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                cursor: 'pointer',
                animation: showAnswers ? `dropIn 0.5s ease-out ${index * 0.1}s forwards` : 'none'
              }}
            >
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                zIndex: 2,
                display: 'flex',
                gap: '16px',
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <div
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
                    transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  {colorScheme.shape}
                </div>

                {answer.image && (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    height: '80px'
                  }}>
                    <img
                      src={answer.image.url}
                      alt="Answer option"
                      style={{
                        maxWidth: '100%',
                        maxHeight: window.innerWidth < 768 ? '60px' : '80px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                  </div>
                )}

                {(answer.text || !answer.image) && (
                  <div style={{
                    flex: 1,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    padding: '8px 0',
                  }}>
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
                      {answer.text || 'No text available'}
                    </Text>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>
        {`
          @keyframes dropIn {
            0% {
              opacity: 0;
              transform: translateY(-50px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default FillBlank; 