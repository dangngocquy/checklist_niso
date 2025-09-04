import React from 'react';
import { Input } from 'antd';
import ImageQuiz from '../Design/ImageQuiz';

const SlideBullets = ({ currentQuestion, setCurrentQuestion }) => {
    const handleTextAreaChange = (e) => {
        const lines = e.target.value.split('\n');
        const processedLines = lines.map(line => {
            // Nếu dòng trống hoặc đã có dấu gạch đầu dòng thì giữ nguyên
            if (!line.trim() || line.trim().startsWith('•')) {
                return line;
            }
            // Thêm dấu gạch đầu dòng nếu chưa có
            return `• ${line}`;
        });
        setCurrentQuestion({ ...currentQuestion, items: processedLines });
    };

    return (
        <div className="slide-bullets-container">
            <div className="slide-bullets-form">
                <Input
                    placeholder="Nhập tiêu đề slide"
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
                    placeholder="Nhập các mục (mỗi dòng là một mục tối đa 250 kí tự)"
                    value={currentQuestion.items?.join('\n')}
                    onChange={handleTextAreaChange}
                    size="large"
                    maxLength={250}
                    style={{
                        height: '250px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        width: '100%',
                        resize: 'none'
                    }}
                />
            </div>
            <div className="slide-bullets-image">
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

export default SlideBullets;