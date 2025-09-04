import React from 'react';
import { Input } from 'antd';
import ImageQuiz from '../Design/ImageQuiz';

const SlideClassic = ({ currentQuestion, setCurrentQuestion }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
                placeholder="Nhập tiêu đề..."
                value={currentQuestion.title || ''}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, title: e.target.value })}
                size="large"
                style={{
                    fontSize: '16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    textAlign: 'center'
                }}
            />
            <ImageQuiz
                selectedImage={currentQuestion.image}
                onImageSelect={(image) => setCurrentQuestion({ ...currentQuestion, image })}
                onImageDelete={() => setCurrentQuestion({ ...currentQuestion, image: null })}
                style={{
                    objectFit: 'contain',
                    width: '100%',
                }}
                imageStyle={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    maxHeight: '500px'
                }}
            />
            <Input
                placeholder="Nhập văn bản..."
                value={currentQuestion.content || ''}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, content: e.target.value })}
                style={{
                    fontSize: '16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
            />
        </div>
    );
};

export default SlideClassic;