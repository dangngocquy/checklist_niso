import React from 'react';
import { Input } from 'antd';

const FillBlank = ({ question, updateAnswer }) => {
  return (
    <div style={{ gridColumn: '1 / -1',marginTop: 30 }}>
      {/* Primary Answer Input */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <Input
          placeholder="Nhập đáp án"
          value={question.answers[0].text}
          onChange={(e) => updateAnswer(0, 'text', e.target.value)}
          style={{
            idth: window.innerWidth < 768 ? '100%' : '80%',
            height: '60px',
            fontSize: '18px',
            background: question.answers[0].text ? question.answers[0].color : 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center',
            boxShadow: question.answers[0].text ? `0 4px 12px ${question.answers[0].color}40` : 'none'
          }}
        />
      </div>
      {/* Additional Acceptable Answers */}
      {question.answers.length > 1 && (
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row' ,
          gap: '15px',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {question.answers.slice(1).map((answer, index) => (
            <Input
              key={index + 1}
              placeholder="Nhập đáp án"
              value={answer.text}
              onChange={(e) => updateAnswer(index + 1, 'text', e.target.value)}
              style={{
                width: window.innerWidth < 768 ? '100%' : '30%',
                height: '60px',
                fontSize: '18px',
                background: answer.text ? answer.color : 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'center',
                boxShadow: answer.text ? `0 4px 12px ${answer.color}40` : 'none'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FillBlank;