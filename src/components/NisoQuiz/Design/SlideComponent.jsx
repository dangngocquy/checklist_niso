import React from 'react';
import { Card, Typography, Input } from 'antd';
import {
  LayoutOutlined,
  FontSizeOutlined,
  ProfileOutlined,
  UnorderedListOutlined,
  QuestionOutlined,
  FileImageOutlined,
  FileTextOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

function SlideComponent({ handleChangeSlideType, currentType, onSlideTypeChange }) {
  const renderMediaPreview = (width = 100, height = 60) => (
    <div className="media-placeholder" style={{ width, height }}>
      <CloudUploadOutlined className="upload-icon" />
      <Text className="upload-text">Chọn hình ảnh</Text>
    </div>
  );

  const renderSlidePreview = (type, icon, title, content) => {
    const previewContent = () => {
      switch (type) {
        case 'slide-classic':
          return (
            <div className="slide-content slide-classic">
              <Input
                value="Tiêu đề..."
                placeholder="Nhập tiêu đề..."
                className="question-input"
                disabled
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#333',
                  height: '40px',
                  textAlign: 'center',
                  marginBottom: '10px'
                }}
              />
              {renderMediaPreview(150, 120)}
              <Input
                value="Nội dung..."
                placeholder="Nhập văn bản..."
                className="question-input"
                disabled
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#333',
                  height: '40px',
                  marginTop: '10px'
                }}
              />
            </div>
          );

        case 'slide-large-title':
          return (
            <div className="slide-bullets">
              <div>
                <Input
                  value="Tiêu đề..."
                  placeholder="Nhập tiêu đề..."
                  className="question-input"
                  disabled
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#333',
                    textAlign: 'center',
                    marginBottom: '10px'
                  }}
                />
                <Input
                  value="Tiêu đề phụ..."
                  placeholder="Nhập tiêu đề phụ..."
                  className="question-input"
                  disabled
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#666',
                    textAlign: 'center',
                    marginBottom: '10px'
                  }}
                />
              </div>
              <div className="bullets-image">
                {renderMediaPreview(150, 120)}
              </div>
            </div>
          );

        case 'slide-title-content':
          return (
            <div className="slide-bullets">
              <div>
                <Input
                  value="Tiêu đề..."
                  placeholder="Nhập tiêu đề..."
                  className="question-input"
                  disabled
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#333',
                    textAlign: 'center',
                    marginBottom: '10px'
                  }}
                />
                <TextArea
                  value="Nội dung..."
                  placeholder="Nhập nội dung..."
                  className="question-input"
                  disabled
                  autoSize={{ minRows: 4, maxRows: 4 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#333',
                    marginBottom: '10px'
                  }}
                />
              </div>
              <div className="bullets-image">
                {renderMediaPreview(150, 120)}
              </div>
            </div>
          );

        case 'slide-bullets':
          return (
            <div className="slide-bullets">
              <div>
                <Input
                  value="Tiêu đề..."
                  placeholder="Nhập tiêu đề..."
                  className="question-input"
                  disabled
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#333',
                    height: '40px',
                    textAlign: 'center'
                  }}
                />
                <TextArea
                  value="• Mục 1
• Mục 2
• Mục 3"
                  placeholder="Nhập các mục gạch đầu dòng..."
                  disabled
                  autoSize={{ minRows: 6, maxRows: 6 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#333',
                    marginTop: 10
                  }}
                />
              </div>
              <div className="bullets-image">
                {renderMediaPreview(150, 120)}
              </div>
            </div>
          );

        case 'slide-quote':
          return (
            <div className="slide-content slide-quote">
              {renderMediaPreview(150, 120)}
              <div style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                marginTop: '10px'
              }}>
                <TextArea
                  value="Câu trích dẫn..."
                  placeholder="Nhập câu trích dẫn"
                  disabled
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  style={{
                    fontSize: '14px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    width: '100%',
                    resize: 'none',
                    textAlign: 'center'
                  }}
                />
                <Input
                  value="Tác giả..."
                  placeholder="Nhập tác giả"
                  disabled
                  style={{
                    fontSize: '14px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    width: '80%',
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>
          );

        case 'slide-large-media':
          return (
            <div className="slide-content slide-large-media">
              {renderMediaPreview(300, 200)}
              <Input
                value="Chú thích..."
                placeholder="Nhập chú thích..."
                className="question-input"
                disabled
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#333',
                  height: '40px',
                  textAlign: 'center',
                  marginTop: '10px'
                }}
              />
            </div>
          );

        case 'slide-text':
          return (
            <div className="slide-content slide-text" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}>
              <div style={{
                width: '100%',
                maxWidth: '800px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Input
                  value="Tiêu đề..."
                  placeholder="Nhập tiêu đề..."
                  className="question-input"
                  disabled
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#333',
                    textAlign: 'center',
                    marginBottom: '10px',
                    width: '100%'
                  }}
                />
                <TextArea
                  value="Nội dung văn bản..."
                  placeholder="Nhập nội dung..."
                  className="question-input"
                  disabled
                  autoSize={{ minRows: 6, maxRows: 7 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#333',
                    overflow: 'hidden',
                    marginBottom: '10px',
                    width: '100%',
                  }}
                />
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="question-slide-wrapper" style={{
        width: '48%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: 0
      }}>
        <Card
          className={`question-slide-card ${currentType === type ? 'activeQuiz' : ''}`}
          hoverable
          onClick={() => {
            handleChangeSlideType(type);
            if (typeof onSlideTypeChange === 'function') {
              onSlideTypeChange();
            }
          }}
          styles={{
            body: { padding: '0px' }
          }}
          style={{
            width: '100%',
            marginBottom: '8px',
            border: currentType === type ? '2px solid #ae8f3d' : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: currentType === type ? '0 0 10px rgba(174, 143, 61, 0.2)' : 'none'
          }}
        >
          <div className="card-overlay" />
          <div className="card-content">
            <div className="preview-sectionQuiz" style={{ transform: 'scale(0.3)', width: '330%' }}>
              {previewContent()}
            </div>
          </div>
        </Card>

        <div style={{ textAlign: 'center', width: '100%' }}>
          <div className="type-info" style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Text strong style={{
              fontSize: '10px',
              textAlign: 'center',
              color: currentType === type ? '#ae8f3d' : 'inherit'
            }}>{title}</Text>
          </div>
        </div>
      </div>
    );
  };

  const slideTypes = [
    {
      type: 'slide-classic',
      icon: <LayoutOutlined style={{ color: '#ae8f3d', fontSize: '20px' }} />,
      title: 'Cổ điển',
      content: 'Tiêu đề, hình ảnh và nội dung'
    },
    {
      type: 'slide-large-title',
      icon: <FontSizeOutlined style={{ color: '#ae8f3d', fontSize: '20px' }} />,
      title: 'Tiêu đề cỡ lớn',
      content: 'Tiêu đề chính, tiêu đề phụ và hình ảnh'
    },
    {
      type: 'slide-title-content',
      icon: <ProfileOutlined style={{ color: '#ae8f3d', fontSize: '20px' }} />,
      title: 'Tiêu đề + Nội dung',
      content: 'Tiêu đề và nội dung chi tiết'
    },
    {
      type: 'slide-bullets',
      icon: <UnorderedListOutlined style={{ color: '#ae8f3d', fontSize: '20px' }} />,
      title: 'Gạch đầu dòng',
      content: 'Danh sách các mục với gạch đầu dòng'
    },
    {
      type: 'slide-quote',
      icon: <QuestionOutlined style={{ color: '#ae8f3d', fontSize: '20px' }} />,
      title: 'Trích dẫn',
      content: 'Câu trích dẫn và tác giả'
    },
    {
      type: 'slide-large-media',
      icon: <FileImageOutlined style={{ color: '#ae8f3d', fontSize: '20px' }} />,
      title: 'Phương tiện cỡ lớn',
      content: 'Hình ảnh hoặc video kích thước lớn'
    },
    {
      type: 'slide-text',
      icon: <FileTextOutlined style={{ color: '#ae8f3d', fontSize: '20px' }} />,
      title: 'Văn bản',
      content: 'Nội dung văn bản đơn giản'
    }
  ];

  // Group slides into rows of 2
  const groupedSlides = [];
  for (let i = 0; i < slideTypes.length; i += 2) {
    groupedSlides.push(slideTypes.slice(i, i + 2));
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ color: '#ae8f3d', display: 'block', marginBottom: '8px' }}>
        🎨 Loại slide
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {groupedSlides.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '10px',
              justifyContent: 'flex-start'
            }}
          >
            {row.map((slide) =>
              renderSlidePreview(slide.type, slide.icon, slide.title, slide.content)
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SlideComponent;