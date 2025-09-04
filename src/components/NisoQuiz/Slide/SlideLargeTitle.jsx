import React from 'react';
import { Input } from 'antd';
import ImageQuiz from '../Design/ImageQuiz';

const SlideLargeTitle = ({ currentQuestion, setCurrentQuestion }) => {
    return (
        <div className="slide-large-title-container">
            <div className="slide-large-title-inputs">
                <Input
                    placeholder="Nhập tiêu đề chính"
                    value={currentQuestion.title}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, title: e.target.value })}
                    size="large"
                    style={{
                        marginBottom: '20px',
                        fontSize: '18px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        width: '100%',
                        textAlign: 'center'
                    }}
                />
                <Input.TextArea
                    placeholder="Nhập tiêu đề phụ"
                    value={currentQuestion.subtitle}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, subtitle: e.target.value })}
                    size="large"
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    maxLength={120}
                    style={{
                        marginBottom: '20px',
                        fontSize: '18px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        width: '100%',
                        textAlign: 'center'
                    }}
                />
            </div>
            <div className="slide-large-title-image">
                <ImageQuiz
                    selectedImage={currentQuestion.image}
                    onImageSelect={(image) => setCurrentQuestion({ ...currentQuestion, image })}
                    onImageDelete={() => setCurrentQuestion({ ...currentQuestion, image: null })}
                    imageStyle={{
                        width: window.innerWidth < 768 ? '250px' : '400px',
                        height: '100%',
                        objectFit: 'contain',
                        maxHeight: '800px'
                    }}
                />
            </div>
        </div>
    );
};

export default SlideLargeTitle;
