import React from 'react';
import { Input } from 'antd';
import ImageQuiz from '../Design/ImageQuiz';

const { TextArea } = Input;

const SlideQuote = ({ currentQuestion, setCurrentQuestion }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            width: '100%'
        }}>
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

            <div style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
            }}>
                <TextArea
                    placeholder="Nhập câu trích dẫn"
                    value={currentQuestion.quote}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, quote: e.target.value })}
                    size="large"
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    maxLength={250}
                    style={{
                        fontSize: '18px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        width: '100%',
                        resize: 'none'
                    }}
                />
                <Input
                    placeholder="Nhập tác giả"
                    value={currentQuestion.author}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, author: e.target.value })}
                    size="large"
                    style={{
                        fontSize: '18px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        width: '80%'
                    }}
                />
            </div>
        </div>
    );
};

export default SlideQuote;