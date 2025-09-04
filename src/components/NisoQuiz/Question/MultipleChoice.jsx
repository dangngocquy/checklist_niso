import React from 'react';
import { Card, Input, Button } from 'antd';
import { FileImageOutlined, CheckOutlined, CloseOutlined, DeleteOutlined, SwapOutlined } from '@ant-design/icons';

const MultipleChoice = ({ question, answerColors, updateAnswer, handleImageModalOpen }) => {
  const handleDeleteImage = (answerIndex) => {
    const updatedAnswers = [...question.answers];
    updatedAnswers[answerIndex] = {
      ...updatedAnswers[answerIndex],
      image: null
    };
    updateAnswer(answerIndex, 'image', null);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
      gap: '15px',
      marginTop: 30
    }}>
      {question.answers.map((answer, answerIndex) => {
        const colorInfo = answerColors[answerIndex % answerColors.length];
        return (
          <Card
            key={answerIndex}
            size="small"
            style={{
              background: answer.text.trim() || answer.image ? colorInfo.bg : 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              // backdropFilter: 'blur(20px)',
              height: '100px',
            }}
            className='quiz'
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '100%' }}>
              <div style={{
                width: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colorInfo.bg,
                color: 'white',
                borderRadius: '10px',
                fontSize: '21px',
                fontWeight: 'bold',
                height: '100%'
              }}>
                {colorInfo.shape}
              </div>
              {answer.image ? (
                <div
                  style={{
                    flex: 1,
                    height: '100%',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    overflow: 'hidden',
                    gap: '10px'
                  }}
                  onClick={() => handleImageModalOpen(answerIndex)}
                >
                  {window.innerWidth < 768 ? (
                    <div style={{ 
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img
                        src={answer.image.url}
                        alt={answer.image.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                      />
                      <div style={{ 
                        position: 'absolute',
                        bottom: '5px',
                        right: '5px',
                        display: 'flex',
                        gap: '5px',
                        zIndex: 1
                      }}>
                        <Button
                          type="primary"
                          size="small"
                          icon={<SwapOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageModalOpen(answerIndex);
                          }}
                        />
                        <Button
                          type="primary"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(answerIndex);
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={answer.image.url}
                        alt={answer.image.name}
                        style={{
                          maxWidth: 'calc(100% - 180px)',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <Button
                          type="primary"
                          icon={<SwapOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageModalOpen(answerIndex);
                          }}
                        >
                        </Button>
                        <Button
                          type="primary"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(answerIndex);
                          }}
                        >
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Input
                  placeholder={`Đáp án ${answerIndex + 1}`}
                  value={answer.text}
                  onChange={(e) => updateAnswer(answerIndex, 'text', e.target.value)}
                  style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', boxShadow: 'none', color: '#fff', fontWeight: 'bold' }}
                />
              )}
              <div
                style={{
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'rgb(51, 51, 51)'
                }}
                onClick={() => handleImageModalOpen(answerIndex)}
              >
                <FileImageOutlined />
              </div>
              <Button
                onClick={() => updateAnswer(answerIndex, 'correct', !answer.correct)}
                icon={answer.correct ? <CheckOutlined /> : <CloseOutlined />}
                type='text'
                shape='circle'
                className={answer.correct ? 'btnQuiz2' : 'btnQuiz'}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default MultipleChoice;