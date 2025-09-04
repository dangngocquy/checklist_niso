import React from 'react';
import { Input } from 'antd';
import ImageQuiz from '../Design/ImageQuiz';

const SlideLargeMedia = ({ currentQuestion, setCurrentQuestion }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            width: '100%'
        }}>
            <div style={{ flex: 1, width: '100%' }}>
                <ImageQuiz
                    selectedImage={currentQuestion.image}
                    onImageSelect={(image) => setCurrentQuestion({ ...currentQuestion, image })}
                    onImageDelete={() => setCurrentQuestion({ ...currentQuestion, image: null })}
                    imageStyle={{
                        width: window.innerWidth < 768 ? '450px' : '850px',
                        height: '100%',
                        objectFit: 'contain',
                        maxHeight: '800px'
                    }}
                />
            </div>
            <Input
                placeholder="Nhập chú thích cho hình ảnh..."
                value={currentQuestion.caption || ''}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, caption: e.target.value })}
                size="large"
                style={{
                    fontSize: '16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    textAlign: 'center'
                }}
            />
        </div>
    );
};

export default SlideLargeMedia;