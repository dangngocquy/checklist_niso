import React from 'react';
import { Button, Card, Input } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

const TrueFalse = ({ question, answerColors, updateAnswer }) => {
  return (
    <div style={{ display: 'flex', gap: '12px', marginTop: 30, flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
      <Card size="small" style={{
        background: answerColors[0].bg,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        flex: 1,
        height: '100px'
      }}
      className='quiz'
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '100%' }}>
          <div style={{
            width: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: answerColors[0].bg,
            color: 'white',
            borderRadius: '10px',
            fontSize: '21px',
            fontWeight: 'bold',
            height: '100%'
          }}>
            {answerColors[0].shape}
          </div>
          <Input 
            value={question.answers[0].text} 
            onChange={(e) => updateAnswer(0, 'text', e.target.value)}
            placeholder="Nhập đáp án đúng"
            style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', boxShadow: 'none', color: '#fff', fontWeight: 'bold' }} 
          />
          <Button
            onClick={() => updateAnswer(0, 'correct', !question.answers[0].correct)}
            icon={question.answers[0].correct ? <CheckOutlined /> : <CloseOutlined />}
            type='text'
            shape='circle'
            className={question.answers[0].correct ? 'btnQuiz2' : 'btnQuiz'}
          />
        </div>
      </Card>
      <Card size="small" style={{
        background: answerColors[1].bg,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        flex: 1,
        height: '100px'
      }}
      className='quiz'
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '100%' }}>
          <div style={{
            width: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: answerColors[1].bg,
            color: 'white',
            borderRadius: '10px',
            fontSize: '21px',
            fontWeight: 'bold',
            height: '100%'
          }}>
            {answerColors[1].shape}
          </div>
          <Input 
            value={question.answers[1].text} 
            onChange={(e) => updateAnswer(1, 'text', e.target.value)}
            placeholder="Nhập đáp án sai"
            style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', boxShadow: 'none', color: '#fff', fontWeight: 'bold' }} 
          />
          <Button
            onClick={() => updateAnswer(1, 'correct', !question.answers[1].correct)}
            icon={question.answers[1].correct ? <CheckOutlined /> : <CloseOutlined />}
            type='text'
            shape='circle'
            className={question.answers[1].correct ? 'btnQuiz2' : 'btnQuiz'}
          />
        </div>
      </Card>
    </div>
  );
};

export default TrueFalse;