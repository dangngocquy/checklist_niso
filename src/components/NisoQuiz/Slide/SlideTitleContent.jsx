import React from 'react';
import { Input } from 'antd';
import ImageQuiz from '../Design/ImageQuiz';

const SlideTitleContent = ({ currentQuestion, setCurrentQuestion }) => {
    return (
        <div className="slide-title-container">
            <div className="slide-title-content">
                <Input
                    placeholder="Nhập tiêu đề"
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
                className='slideQuizContent'
                    placeholder="Nhập nội dung (Max 250)"
                    value={currentQuestion.content}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, content: e.target.value })}
                    size="large"
                    autoSize={{ minRows: 6, maxRows: 6 }}
                    maxLength={250}
                    style={{
                        marginBottom: '20px',
                        fontSize: '18px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        width: '100%',
                    }}
                />
            </div>
            <div className="slide-title-image">
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

export default SlideTitleContent;