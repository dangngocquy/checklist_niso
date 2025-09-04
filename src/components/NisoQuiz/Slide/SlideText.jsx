import React from 'react';
import { Input } from 'antd';

const SlideText = ({ currentQuestion, setCurrentQuestion }) => {
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
        setCurrentQuestion({ ...currentQuestion, content: processedLines.join('\n') });
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: '20px',
            maxWidth: '1200px',
            margin: '0 auto',
            height: 'calc(100vh - 200px)',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '800px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
            }}>
                <Input
                    placeholder="Nhập tiêu đề slide"
                    value={currentQuestion.title}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, title: e.target.value })}
                    size="large"
                    style={{
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
                    placeholder="Nhập văn bản (mỗi dòng sẽ tự động thêm dấu chấm đầu dòng)"
                    value={currentQuestion.content}
                    onChange={handleTextAreaChange}
                    size="large"
                    style={{
                        height: '250px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        width: '100%',
                        resize: 'none',
                    }}
                />
            </div>
        </div>
    );
};

export default SlideText;