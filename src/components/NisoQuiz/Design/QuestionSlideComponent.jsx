import React, { memo, useState, useEffect } from 'react';
import { Button, Input, Card, Tooltip, Typography, Badge } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  UpOutlined,
  DownOutlined,
  CloudUploadOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
  FileImageOutlined,
  QuestionCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { FaSquare } from "react-icons/fa";
import SlideTypeLabel from '../Slide/SlideTypeLabel';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const { Text } = Typography;

const BackgroundImage = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: ${props => props.imageUrl ? `url(${props.imageUrl})` : 'none'};
  background-size: cover;
  background-position: center;
  border-radius: 12px;
`;

const Overlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(10px);
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
`;

const MediaWrapper = styled(motion.div)`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
  width: ${props => props.width ? `${props.width}px` : '150px'};
  height: ${props => props.height ? `${props.height}px` : '90px'};

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }
`;

const MediaImage = styled(motion.img)`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 12px;
  position: relative;
  z-index: 2;
`;

const QuestionSlideComponent = memo(({
  question,
  index,
  isActive,
  onClick,
  answerColors,
  questions,
  moveQuestion,
  handleSelectQuestion,
  handleDeleteQuestion,
  setDrawerVisible
}) => {
  const [localActive, setLocalActive] = useState(isActive);

  useEffect(() => {
    setLocalActive(isActive);
  }, [isActive, localActive]);

  const isQuestionComplete = (question) => {
    if (question.type.startsWith('slide-')) {
      switch (question.type) {
        case 'slide-classic':
          return question.title?.trim() && question.content?.trim() && question.image !== null;
        case 'slide-large-title':
          return question.title?.trim() && question.subtitle?.trim() && question.image !== null;
        case 'slide-title-content':
          return question.title?.trim() && question.content?.trim() && question.image !== null;
        case 'slide-bullets':
          return question.title?.trim() && question.items?.length > 0 && question.items[0]?.trim() && question.image !== null;
        case 'slide-quote':
          return question.quote?.trim() && question.author?.trim() && question.image !== null;
        case 'slide-large-media':
          return question.image !== null && question.caption?.trim();
        case 'slide-text':
          return question.title?.trim() && question.content?.trim();
        default:
          return true;
      }
    }
    if (!question.question?.trim()) return false;
    if (question.type === 'true-false') {
      return true;
    }
    if (question.type === 'fill-blank') {
      return question.answers.some(answer => answer.text.trim() || answer.image) && question.image !== null;
    }
    if (question.type === 'multiple-choice') {
      return question.image !== null && question.answers.every(answer => answer.text.trim() || answer.image) &&
        question.answers.some(answer => answer.correct);
    }
    return question.answers.every(answer => answer.text.trim() || answer.image) &&
      question.answers.some(answer => answer.correct);
  };

  const getTypeIcon = (type) => {
    if (type.startsWith('slide-')) {
      return type.includes('media') ? <PlayCircleOutlined /> : <FileTextOutlined />;
    }
    return <QuestionCircleOutlined />;
  };

  const renderMediaPreview = (image, width = 150, height = 90) => {
    if (!image) {
      return (
        <div className="media-placeholder" style={{ width, height }}>
          <CloudUploadOutlined className="upload-icon" />
          <Text className="upload-text">Chọn hình ảnh</Text>
        </div>
      );
    }

    if (image.type === 'youtube') {
      return (
        <MediaWrapper width={width} height={height}>
          <iframe
            src={image.url}
            title="Preview"
            className="media-iframe"
            style={{ width: '100%', height: '100%' }}
          />
          <Overlay />
          <div className="media-overlay">
            <PlayCircleOutlined className="play-icon" />
          </div>
        </MediaWrapper>
      );
    }

    return (
      <MediaWrapper width={width} height={height}>
        <BackgroundImage imageUrl={image.url || image} />
        <Overlay />
        <MediaImage
          src={image.url || image}
          alt="Preview"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        />
        <div className="media-overlay">
          <FileImageOutlined className="image-icon" />
        </div>
      </MediaWrapper>
    );
  };

  const renderSlideContent = () => {
    const { type } = question;

    switch (type) {
      case 'slide-classic':
        return (
          <div className="slide-content slide-classic">
            <Input
              value={question.title ?
                question.title.slice(0, 10) + (question.title.length > 10 ? '...' : '') :
                'Tiêu đề...'
              }
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
            {renderMediaPreview(question.image, 150, 120)}
            <Input
              value={question.content ?
                question.content.slice(0, 10) + (question.content.length > 10 ? '...' : '') :
                'Nội dung...'
              }
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
                value={question.title ?
                  question.title.slice(0, 15) + (question.title.length > 15 ? '...' : '') :
                  'Tiêu đề...'
                }
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
                value={question.subtitle ?
                  question.subtitle.slice(0, 20) + (question.subtitle.length > 20 ? '...' : '') :
                  'Tiêu đề phụ...'
                }
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
              {question.image ?
                renderMediaPreview(question.image, 150, 120) :
                <div className="media-placeholder" style={{ width: 150, height: 120 }}>
                  <CloudUploadOutlined className="upload-icon" />
                  <Text className="upload-text">Chọn hình ảnh</Text>
                </div>
              }
            </div>
          </div>
        );

      case 'slide-title-content':
        return (
          <div className="slide-bullets">
            <div>
              <Input
                value={question.title ?
                  question.title.slice(0, 15) + (question.title.length > 15 ? '...' : '') :
                  'Tiêu đề...'
                }
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
              <Input.TextArea
                value={question.content ?
                  question.content.slice(0, 50) + (question.content.length > 50 ? '...' : '') :
                  'Nội dung...'
                }
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
              {question.image ?
                renderMediaPreview(question.image, 150, 120) :
                <div className="media-placeholder" style={{ width: 150, height: 120 }}>
                  <CloudUploadOutlined className="upload-icon" />
                  <Text className="upload-text">Chọn hình ảnh</Text>
                </div>
              }
            </div>
          </div>
        );

      case 'slide-bullets':
        return (
          <div className="slide-bullets">
            <div>
              <div className="bullets-title">
                <Input
                  value={question.title ?
                    question.title.slice(0, 10) + (question.title.length > 10 ? '...' : '') :
                    'Tiêu đề...'
                  }
                  placeholder="Nhập câu hỏi..."
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
              </div>
              <div className="bullets-list">
                {question.items?.length > 0 ? (
                  <>
                    <Input.TextArea
                      value={question.items.length > 5
                        ? question.items.slice(0, 5).join('\n') + '\n... và ' + (question.items.length - 5) + ' mục khác'
                        : question.items.join('\n')}
                      placeholder="Nhập câu hỏi..."
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
                  </>
                ) : (
                  <Input.TextArea
                    value='Nhập các mục gạch đầu dòng...'
                    disabled
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#333',
                      height: '100%',
                      marginTop: 10
                    }}
                  />
                )}
              </div>
            </div>
            <div className="bullets-image">
              {question.image ?
                renderMediaPreview(question.image, 150, 120) :
                <div className="media-placeholder" style={{ width: 150, height: 120 }}>
                  <CloudUploadOutlined className="upload-icon" />
                  <Text className="upload-text">Chọn hình ảnh</Text>
                </div>
              }
            </div>
          </div>
        );

      case 'slide-quote':
        return (
          <div className="slide-content slide-quote">
            {question.image ?
              renderMediaPreview(question.image, 150, 120) :
              <div className="media-placeholder" style={{ width: 150, height: 120 }}>
                <CloudUploadOutlined className="upload-icon" />
                <Text className="upload-text">Chọn hình ảnh</Text>
              </div>
            }
            <div style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              marginTop: '10px'
            }}>
              <Input.TextArea
                value={question.quote ?
                  question.quote.slice(0, 80) + (question.quote.length > 80 ? '...' : '') :
                  'Nhập câu trích dẫn...'
                }
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
                value={question.author ?
                  question.author.slice(0, 20) + (question.author.length > 20 ? '...' : '') :
                  'Nhập tác giả...'
                }
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
            {renderMediaPreview(question.image, 300, 200)}
            <Input
              value={question.caption ?
                question.caption.slice(0, 10) + (question.caption.length > 10 ? '...' : '') :
                'Chú thích...'
              }
              placeholder="Nhập câu hỏi..."
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
                value={question.title ?
                  question.title.slice(0, 15) + (question.title.length > 15 ? '...' : '') :
                  'Tiêu đề...'
                }
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
              <Input.TextArea
                value={question.content ?
                  (question.content.split('\n').length > 5 ?
                    question.content.split('\n').slice(0, 5).join('\n') + '\n... và ' + (question.content.split('\n').length - 5) + ' mục khác' :
                    question.content) :
                  'Nội dung...'
                }
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

  const renderQuestionContent = () => (
    <div className="question-content">
      <div className="question-input-wrapper">
        <Input
          value={question.question}
          placeholder="Nhập câu hỏi..."
          className="question-input"
          disabled
          prefix={<QuestionCircleOutlined />}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#333',
            height: '40px'
          }}
        />
      </div>

      <div className="question-media">
        {renderMediaPreview(question.image)}
      </div>

      <div className="answers-section">
        {question.type === 'multiple-choice' && (
          <div className="multiple-choice-answers">
            {question.answers.map((answer, idx) => (
              <div
                key={idx}
                className="answer-option"
                style={{
                  background: `linear-gradient(135deg, ${answerColors[idx]?.bg || '#e74c3c'} 0%, ${answerColors[idx]?.bg || '#e74c3c'} 100%)`,
                  opacity: 0.9,
                  boxShadow: `0 4px 12px ${answerColors[idx]?.bg || '#e74c3c'}33`
                }}
              >
                <span className="answer-icon">
                  {answerColors[idx]?.shape || <FaSquare />}
                </span>
                <span className="answer-text">
                  {answer.image ? (
                    <img
                      src={answer.image.url}
                      alt={answer.image.name}
                      style={{
                        maxWidth: '20px',
                        maxHeight: '20px',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        borderRadius: '4px'
                      }}
                    />
                  ) : answer.text ?
                    answer.text.slice(0, 5) + (answer.text.length > 5 ? '...' : '') :
                    'Đáp án...'
                  }
                </span>
                {answer.correct && <Badge count="✓" className="correct-badge" style={{ backgroundColor: '#52c41a' }} />}
              </div>
            ))}
          </div>
        )}

        {question.type === 'true-false' && (
          <div className="true-false-answers">
            {question.answers.map((answer, idx) => (
              <div
                key={idx}
                className="tf-answer"
                style={{
                  background: `linear-gradient(135deg, ${answerColors[idx]?.bg || '#3498db'} 0%, ${answerColors[idx]?.bg || '#3498db'} 100%)`,
                  opacity: 0.9,
                  boxShadow: `0 4px 12px ${answerColors[idx]?.bg || '#3498db'}33`
                }}
              >
                {answer.text.length > 5 ? answer.text.slice(0, 5) + '...' : answer.text}
                {answer.correct && <Badge count="✓" className="correct-badge" style={{ backgroundColor: '#52c41a' }} />}
              </div>
            ))}
          </div>
        )}

        {question.type === 'fill-blank' && (
          <div className="fill-blank-answer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Input
              value={question.answers[0]?.text ?
                (question.answers[0].text.length > 5 ? question.answers[0].text.slice(0, 5) + '...' : question.answers[0].text)
                : ''}
              placeholder="Đáp án..."
              className="blank-input"
              disabled
              style={{
                width: '80%',
                background: question.answers[0]?.color || '#3498db',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'center',
                boxShadow: `0 4px 12px ${question.answers[0]?.color || '#3498db'}40`
              }}
            />

            {question.answers.length > 1 && (
              <div style={{
                display: 'flex',
                gap: '12px',
                width: '100%',
                justifyContent: 'center',
              }}>
                {question.answers.slice(1).map((answer, idx) => (
                  <Input
                    key={idx + 1}
                    value={answer.text ?
                      (answer.text.length > 3 ? answer.text.slice(0, 3) + '...' : answer.text)
                      : ''}
                    placeholder="Đáp án..."
                    className="blank-input"
                    disabled
                    style={{
                      width: '30%',
                      background: answer.color || '#3498db',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      boxShadow: `0 4px 12px ${answer.color || '#3498db'}40`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="question-slide-wrapper">
      <div className="question-header">
        <div className="type-info">
          <span className="type-icon">{getTypeIcon(question.type)}</span>
          <SlideTypeLabel question={question} />
        </div>

        {!isQuestionComplete(question) && (
          <Tooltip title={question.type.startsWith('slide-') ? "Slide chưa hoàn chỉnh" : "Câu hỏi chưa hoàn chỉnh"}>
            <ExclamationCircleOutlined className="warning-icon" />
          </Tooltip>
        )}
      </div>

      <Card
        className={`question-slide-card ${localActive ? 'active activeclick' : 'active'} ${!isQuestionComplete(question) ? 'incomplete' : ''}`}
        hoverable
        onClick={() => {
          if (!localActive) {
            setLocalActive(true);
            onClick();
          }
        }}
        styles={{
          body: { padding: '0px' }
        }}
      >
        <div className="card-overlayquiz" />
        <div className="card-content">
          <div className="preview-section">
            {question.type.startsWith('slide-') ?
              renderSlideContent() :
              renderQuestionContent()
            }
          </div>

          {questions.length > 1 && (
            <div className="action-buttons">
              <div className="move-buttons">
                <Tooltip title="Di chuyển lên">
                  <Button
                    type="text"
                    size="small"
                    icon={<UpOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveQuestion(index, -1);
                    }}
                    disabled={index === 0}
                    className="action-btn move-btn"
                  />
                </Tooltip>

                <Tooltip title="Di chuyển xuống">
                  <Button
                    type="text"
                    size="small"
                    icon={<DownOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveQuestion(index, 1);
                    }}
                    disabled={index === questions.length - 1}
                    className="action-btn move-btn"
                  />
                </Tooltip>
              </div>

              <div className="edit-delete-buttons">
                <Tooltip title="Chỉnh sửa">
                  <Button
                    type="primary"
                    ghost
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectQuestion(index);
                      if (setDrawerVisible) {
                        setDrawerVisible(false);
                      }
                    }}
                    className="action-btn edit-btn"
                  />
                </Tooltip>

                <Tooltip title="Xóa">
                  <Button
                    danger
                    ghost
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteQuestion(index);
                    }}
                    className="action-btn delete-btn"
                  />
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
});

export default QuestionSlideComponent;