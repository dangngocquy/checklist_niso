import React from 'react';
import { Card, Typography } from 'antd';

const { Text } = Typography;

const FillBlank = ({ question, viewOnly }) => {
    return (
        <Card style={{ background: '#f5f5f5', border: 'none' }}>
            {question.answers.map((answer, index) => (
                <div key={index} style={{ marginBottom: '10px' }}>
                    {answer.image && (
                        <img
                            src={answer.image.url}
                            alt="Answer"
                            style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }}
                        />
                    )}
                    <Text strong>{answer.text || 'No text'}</Text>
                    {viewOnly && answer.correct && (
                        <Text style={{ opacity: 0.8 }}> (Correct)</Text>
                    )}
                </div>
            ))}
        </Card>
    );
};

export default FillBlank; 