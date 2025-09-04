import React from 'react';

const SlideTypeLabel = ({ question }) => {
    const getLabel = () => {
        switch (question.type) {
            case 'multiple-choice':
                return 'Câu hỏi trắc nghiệm';
            case 'true-false':
                return 'Câu hỏi đúng/sai';
            case 'fill-blank':
                return 'Câu hỏi điền từ';
            case 'slide-classic':
                return 'Cổ điển';
            case 'slide-large-title':
                return 'Slide tiêu đề cỡ lớn';
            case 'slide-title-content':
                return 'Slide tiêu đề + nội dung';
            case 'slide-bullets':
                return 'Slide gạch đầu dòng';
            case 'slide-quote':
                return 'Slide trích dẫn';
            case 'slide-large-media':
                return 'Slide phương tiện cỡ lớn';
            case 'slide-text':
                return 'Slide văn bản';
            default:
                return '';
        }
    };

    return <>{getLabel()}</>;
};

export default SlideTypeLabel;