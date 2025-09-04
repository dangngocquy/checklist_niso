// ViewQuiz.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, Layout, message } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { FullscreenOutlined, FullscreenExitOutlined, UnlockFilled, RightSquareOutlined, LeftSquareOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { JoinButton } from '../styles/JointQuiz.styles';
import styled from 'styled-components';
import axios from 'axios';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import MultipleChoice from './components/MultipleChoice';
import TrueFalse from './components/TrueFalse';
import FillBlank from './components/FillBlank';
import SlideClassic from './components/slides/SlideClassic';
import SlideLargeTitle from './components/slides/SlideLargeTitle';
import SlideTitleContent from './components/slides/SlideTitleContent';
import SlideBullets from './components/slides/SlideBullets';
import SlideQuote from './components/slides/SlideQuote';
import SlideLargeMedia from './components/slides/SlideLargeMedia';
import SlideText from './components/slides/SlideText';
import { LoadingContainer, LoadingSpinner, LoadingText, LoadingDots, LoadingDot } from '../styles/StartQuiz.styles';
import DungSai from './components/DungSai';

const socket = io(process.env.REACT_APP_SOCKETWEB, {
  auth: {
    token: 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME),
  },
});

const { Content, Footer } = Layout;

const ImageWrapper = styled(motion.div)`
  position: relative;
  border-radius: 12px;
  overflow: visible;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
  width: 100%;
  max-width: 420px;
  height: 280px;

  @media (max-width: 768px) {
    height: 200px;
  }
`;

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

const SlideImage = styled(motion.img)`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 12px;
  position: relative;
  z-index: 2;
`;

export const LoadingContent = () => (
  <LoadingContainer>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <LoadingSpinner />
      <LoadingText>Loading</LoadingText>
      <LoadingDots>
        <LoadingDot />
        <LoadingDot />
        <LoadingDot />
      </LoadingDots>
    </div>
  </LoadingContainer>
);

const ViewQuiz = ({ quizId, gamePin, quizData, backgroundImage, isFullscreen: initialFullscreen, isParticipantView = false, questionIndexFromHost = 0 }) => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(isParticipantView ? questionIndexFromHost : questionIndexFromHost);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loadingState, setLoadingState] = useState({ prev: false, next: false });
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState({ isCorrect: false, score: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    if (isParticipantView) {
      setCurrentQuestionIndex(questionIndexFromHost);
    }
  }, [questionIndexFromHost, isParticipantView]);

  useEffect(() => {
    if (quizData?.questions && quizData.questions.length > 0) {
      const validIndex = Math.max(0, Math.min(currentQuestionIndex, quizData.questions.length - 1));
      setCurrentQuestionIndex(validIndex);
      setCurrentQuestion(quizData.questions[validIndex]);
      setShowQuestion(false);
      setShowImage(false);
      setShowOptions(false);

      setTimeout(() => setShowQuestion(true), 100);
      setTimeout(() => setShowImage(true), 600);
      setTimeout(() => setShowOptions(true), 1100);
    }
  }, [currentQuestionIndex, quizData]);

  useEffect(() => {
    if (!currentQuestion?.timeLimit) {
      setTimeLeft(null);
      return;
    }

    const timeLimit = currentQuestion.timeLimit;
    setTimeLeft(timeLimit);

    const startTimer = setTimeout(() => {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (isParticipantView) {
              // Kiểm tra đáp án trước khi gửi kết quả
              let isCorrect = false;
              let score = 0;

              switch (currentQuestion.type) {
                case 'multiple-choice':
                  const selectedAnswers = currentQuestion.answers.filter(a => a.selected);
                  const correctAnswers = currentQuestion.answers.filter(a => a.isCorrect);
                  isCorrect = selectedAnswers.length === correctAnswers.length && 
                             selectedAnswers.every(a => a.isCorrect);
                  score = isCorrect ? 100 : 0;
                  break;

                case 'true-false':
                  const selectedAnswer = currentQuestion.answers.find(a => a.selected);
                  isCorrect = selectedAnswer && selectedAnswer.isCorrect;
                  score = isCorrect ? 100 : 0;
                  break;

                case 'fill-blank':
                  const userAnswer = currentQuestion.answers[0]?.text || '';
                  const correctAnswer = currentQuestion.answers[0]?.correctAnswer || '';
                  isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
                  score = isCorrect ? 100 : 0;
                  break;

                default:
                  break;
              }

              // Cập nhật kết quả trước khi gửi
              setResult({ isCorrect, score });
              setShowResult(true);

              // Gửi kết quả qua socket khi hết thời gian
              const clientId = localStorage.getItem('quizClientId');
              if (clientId && quizData?.quizId && currentQuestion?.questionId) {
                socket.emit('answerResult', {
                  quizId: quizData.quizId,
                  clientId: clientId,
                  questionId: currentQuestion.questionId,
                  isCorrect: isCorrect, // Sử dụng giá trị isCorrect mới tính toán
                  score: score, // Sử dụng giá trị score mới tính toán
                  selectedAnswers: currentQuestion.answers
                    .filter(a => a.selected)
                    .map(a => a.answerId)
                });
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, 1500);

    return () => clearTimeout(startTimer);
  }, [currentQuestion, isParticipantView, quizData?.quizId]);

  useEffect(() => {
    socket.on('startQuiz', ({ quizId: eventQuizId, quizData }) => {
      if (eventQuizId === quizId) {
        setShowQuestion(true);
        setShowImage(true);
        setShowOptions(true);
      }
    });

    return () => {
      socket.off('startQuiz');
    };
  }, [quizId]);

  useEffect(() => {
    socket.on('answerResult', ({ quizId, clientId, questionId, isCorrect, score }) => {
      console.log('Socket event received:', {
        quizId,
        clientId,
        questionId,
        isCorrect,
        score,
        currentQuizId: quizData?.quizId,
        currentClientId: localStorage.getItem('quizClientId')
      });
      
      if (quizId === quizData?.quizId && clientId === localStorage.getItem('quizClientId')) {
        console.log('Setting result:', { isCorrect, score });
        setResult({ isCorrect, score });
        setShowResult(true);
      } else {
        console.log('Ignoring result - quizId or clientId mismatch');
      }
    });

    return () => {
      socket.off('answerResult');
    };
  }, [quizData?.quizId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Lỗi khi vào chế độ toàn màn hình:', err);
      });
      setIsFullscreen(true);
      localStorage.setItem('niso_fullscreen', 'true');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
        localStorage.setItem('niso_fullscreen', 'false');
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!document.fullscreenElement;
      setIsFullscreen(isFullscreenNow);
      localStorage.setItem('niso_fullscreen', isFullscreenNow.toString());
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const savedFullscreen = localStorage.getItem('niso_fullscreen') === 'true';
    if (savedFullscreen && !document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error('Lỗi khi vào chế độ toàn màn hình:', err);
      });
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleNext = async () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setLoadingState(prev => ({ ...prev, next: true }));
      const newIndex = currentQuestionIndex + 1;
      console.log('handleNext called, moving to question index:', newIndex);
      setCurrentQuestionIndex(newIndex);
      socket.emit('nextQuestion', { quizId: quizData.quizId, questionIndex: newIndex });
      console.log('Emitted nextQuestion event:', { quizId: quizData.quizId, questionIndex: newIndex });

      if (!quizData.quizId || !gamePin) {
        console.error('Invalid quizId or gamePin:', { quizId: quizData.quizId, gamePin });
        message.error('Không thể cập nhật bước: Thiếu quizId hoặc gamePin');
        setLoadingState(prev => ({ ...prev, next: false }));
        return;
      }

      try {
        console.log('Sending update-pin request with:', {
          quizId: quizData.quizId,
          gamePin,
          steps: newIndex + 1,
        });
        const response = await axios.post(
          `/api/quizzes/update-pin`,
          {
            quizId: quizData.quizId,
            gamePin,
            steps: newIndex + 1,
          },
          {
            headers: {
              Authorization: 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME),
              'Content-Type': 'application/json',
            },
          }
        );
        console.log('update-pin response:', response.data);
        if (response.data.success) {
          console.log('Steps updated successfully to:', response.data.steps);
        } else {
          console.error('Failed to update steps:', response.data.message);
          message.error(`Không thể cập nhật bước: ${response.data.message}`);
        }
      } catch (error) {
        console.error('Error updating steps:', error.message, error.stack);
        message.error('Lỗi khi cập nhật bước: ' + error.message);
      } finally {
        setLoadingState(prev => ({ ...prev, next: false }));
      }
    }
  };

  const handlePrevious = async () => {
    if (currentQuestionIndex > 0) {
      setLoadingState(prev => ({ ...prev, prev: true }));
      const newIndex = currentQuestionIndex - 1;
      console.log('handlePrevious called, moving to question index:', newIndex);
      setCurrentQuestionIndex(newIndex);
      socket.emit('nextQuestion', { quizId: quizData.quizId, questionIndex: newIndex });
      console.log('Emitted nextQuestion event:', { quizId: quizData.quizId, questionIndex: newIndex });

      if (!quizData.quizId || !gamePin) {
        console.error('Invalid quizId or gamePin:', { quizId: quizData.quizId, gamePin });
        message.error('Không thể cập nhật bước: Thiếu quizId hoặc gamePin');
        setLoadingState(prev => ({ ...prev, prev: false }));
        return;
      }

      try {
        console.log('Sending update-pin request with:', {
          quizId: quizData.quizId,
          gamePin,
          steps: newIndex + 1,
        });
        const response = await axios.post(
          `/api/quizzes/update-pin`,
          {
            quizId: quizData.quizId,
            gamePin,
            steps: newIndex + 1,
          },
          {
            headers: {
              Authorization: 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME),
              'Content-Type': 'application/json',
            },
          }
        );
        console.log('update-pin response:', response.data);
        if (response.data.success) {
          console.log('Steps updated successfully to:', response.data.steps);
        } else {
          console.error('Failed to update steps:', response.data.message);
          message.error(`Không thể cập nhật bước: ${response.data.message}`);
        }
      } catch (error) {
        console.error('Error updating steps:', error.message, error.stack);
        message.error('Lỗi khi cập nhật bước: ' + error.message);
      } finally {
        setLoadingState(prev => ({ ...prev, prev: false }));
      }
    }
  };

  const handleFinish = async () => {
    setLoadingState(prev => ({ ...prev, next: true }));
    try {
      const response = await axios.post(
        `/api/quizzes/update-pin`,
        {
          quizId: quizData.quizId,
          gamePin,
          status: 'completed',
          steps: 0,
        },
        {
          headers: {
            Authorization: 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME),
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('handleFinish response:', response.data);
      if (response.data.success) {
        console.log('Quiz completed successfully');
        socket.emit('quizCompleted', { quizId: quizData.quizId });
        message.success('Quiz completed!');
        navigate(`/niso-quiz/view/${quizData.quizId}`);
      } else {
        console.error('Failed to complete quiz:', response.data.message);
        message.error(`Failed to complete quiz: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error completing quiz:', error.message, error.stack);
      message.error('Error completing quiz. Please try again.');
    } finally {
      setLoadingState(prev => ({ ...prev, next: false }));
    }
  };

  useEffect(() => {
    socket.on('roomUpdated', ({ quizId: eventQuizId, steps }) => {
      if (eventQuizId === quizId) {
        console.log('Received roomUpdated event with steps:', steps);
        if (typeof steps === 'number' && !isParticipantView) {
          setCurrentQuestionIndex(steps - 1);
        }
      }
    });

    return () => {
      socket.off('roomUpdated');
    };
  }, [quizId, isParticipantView]);

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return <div>Quiz không tồn tại</div>;
  }

  return (
    <Layout
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: backgroundImage ? `url(${backgroundImage})` : '#f0f2f5',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <title>NISO | {quizData.title}</title>
      <Content style={{ padding: '20px' }}>
        {showResult && isParticipantView ? (
          <DungSai 
            isCorrect={result.isCorrect}
            score={result.score}
            selectedAnswers={currentQuestion?.answers
              .filter(a => a.selected)
              .map(a => a.text)}
            answerId={currentQuestion?.answers.find(a => a.selected)?.answerId}
            answerIds={currentQuestion?.answers.filter(a => a.correct).map(a => a.answerId)}
          />
        ) : (
          <>
            {!isParticipantView && (
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: currentQuestionIndex > 0 ? 'space-between' : 'flex-end' }}>
                {currentQuestionIndex > 0 && (
                  <JoinButton
                    icon={<LeftSquareOutlined />}
                    size={window.innerWidth < 768 ? 'middle' : 'large'}
                    onClick={handlePrevious}
                    disabled={loadingState.prev || loadingState.next}
                  >
                    {loadingState.prev ? <LoadingContent /> : 'Trước'}
                  </JoinButton>
                )}
                <JoinButton
                  icon={currentQuestionIndex === quizData.questions.length - 1 ? <PauseCircleOutlined /> : <RightSquareOutlined />}
                  type="primary"
                  size={window.innerWidth < 768 ? 'middle' : 'large'}
                  danger={currentQuestionIndex === quizData.questions.length - 1}
                  onClick={currentQuestionIndex === quizData.questions.length - 1 ? handleFinish : handleNext}
                  disabled={loadingState.prev || loadingState.next}
                >
                  {loadingState.next ? <LoadingContent /> : (currentQuestionIndex === quizData.questions.length - 1 ? 'Kết thúc' : 'Tiếp theo')}
                </JoinButton>
              </div>
            )}
            {currentQuestion?.type.startsWith('slide-') ? (
              <>
                {currentQuestion.type === 'slide-classic' && <SlideClassic currentQuestion={currentQuestion} />}
                {currentQuestion.type === 'slide-large-title' && <SlideLargeTitle currentQuestion={currentQuestion} />}
                {currentQuestion.type === 'slide-title-content' && <SlideTitleContent currentQuestion={currentQuestion} />}
                {currentQuestion.type === 'slide-bullets' && <SlideBullets currentQuestion={currentQuestion} />}
                {currentQuestion.type === 'slide-quote' && <SlideQuote currentQuestion={currentQuestion} />}
                {currentQuestion.type === 'slide-large-media' && <SlideLargeMedia currentQuestion={currentQuestion} />}
                {currentQuestion.type === 'slide-text' && <SlideText currentQuestion={currentQuestion} />}
              </>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  {showQuestion && !isParticipantView && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Card
                        style={{
                          background: '#fff',
                          border: 'none',
                          fontWeight: 700,
                          color: '#333',
                          fontSize: '3.5vmin',
                          padding: 12,
                          minHeight: window.innerWidth < 768 ? 50 : 80,
                          display: 'flex',
                          alignItems: 'center',
                          lineHeight: 1
                        }}
                        bodyStyle={{
                          padding: 0
                        }}
                      >
                        {currentQuestion.question}
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  {showImage && currentQuestion.image && !isParticipantView && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5 }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        marginTop: 20,
                        maxWidth: '100%',
                        position: 'relative'
                      }}
                    >
                      {currentQuestion?.timeLimit && timeLeft !== null && !isParticipantView && (
                        <div style={{
                          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                          color: 'white',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontSize: '24px',
                          fontWeight: 'bold',
                          backdropFilter: 'blur(5px)',
                          boxShadow: '0 4px 6px rgba(61, 233, 123, 0.2)',
                          zIndex: 10,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          border: '2px solid rgba(56, 249, 215, 0.5)',
                          minWidth: '80px',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          {timeLeft}
                        </div>
                      )}
                      <ImageWrapper
                        whileHover={{
                          scale: 1.05,
                          rotate: 1,
                          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.3)',
                        }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <BackgroundImage imageUrl={currentQuestion.image.url} />
                        <Overlay />
                        <SlideImage
                          src={currentQuestion.image.url}
                          alt="Question"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        />
                      </ImageWrapper>
                      {currentQuestion?.timeLimit && timeLeft !== null && !isParticipantView && (
                        <div style={{
                          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                          color: 'white',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontSize: '24px',
                          fontWeight: 'bold',
                          backdropFilter: 'blur(5px)',
                          boxShadow: '0 4px 6px rgba(61, 233, 123, 0.2)',
                          zIndex: 10,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          border: '2px solid rgba(56, 249, 215, 0.5)',
                          minWidth: '80px',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          {timeLeft}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  {showOptions && currentQuestion.type === 'multiple-choice' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: isParticipantView ? '20px' : '0'
                      }}
                    >
                      <MultipleChoice
                        question={currentQuestion}
                        answerColors={[
                          { color: '#ff6b6b', shape: null, bg: '#ff6b6b', shadowColor: 'rgba(255, 107, 107, 0.3)' },
                          { color: 'rgb(19, 104, 206)', shape: null, bg: 'rgb(19, 104, 206)', shadowColor: 'rgb(19, 104, 206, 0.3)' },
                          { color: 'rgb(216, 158, 0)', shape: null, bg: 'rgb(216, 158, 0)', shadowColor: 'rgb(216, 158, 0, 0.3)' },
                          { color: '#95e1d3', shape: null, bg: '#95e1d3', shadowColor: 'rgba(149, 225, 211, 0.3)' },
                        ]}
                        viewOnly
                        isParticipantView={isParticipantView}
                        style={{
                          height: isParticipantView ? '100%' : 'auto',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  {showOptions && currentQuestion.type === 'true-false' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      style={{
                        height: isParticipantView ? 'calc(100vh - 60px)' : 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: isParticipantView ? '20px' : '0'
                      }}
                    >
                      <TrueFalse
                        question={currentQuestion}
                        answerColors={[
                          { color: 'green', shape: null, bg: 'green', shadowColor: 'rgba(0, 128, 0, 0.3)' },
                          { color: 'red', shape: null, bg: 'red', shadowColor: 'rgba(255, 0, 0, 0.3)' },
                        ]}
                        viewOnly
                        isParticipantView={isParticipantView}
                        style={{
                          height: isParticipantView ? '100%' : 'auto',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  {showOptions && currentQuestion.type === 'fill-blank' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      style={{
                        height: isParticipantView ? 'calc(100vh - 60px)' : 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: isParticipantView ? '20px' : '0'
                      }}
                    >
                      <FillBlank
                        question={currentQuestion}
                        viewOnly
                        style={{
                          height: isParticipantView ? '100%' : 'auto',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </>
        )}
      </Content>
      <Footer style={{
        textAlign: 'center',
        background: 'rgba(0, 0, 0, 0.55)',
        padding: window.innerWidth < 768 ? '12px 20px' : '12px 50px',
        backdropFilter: 'blur(10px)',
        fontSize: '16px',
        fontWeight: 500,
        color: '#fff',
        position: 'fixed',
        bottom: 0,
        width: '-webkit-fill-available',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }} >
        <span><UnlockFilled /> Mã PIN trò chơi: <span>{gamePin}</span></span>
        <span>
          <span>{currentQuestionIndex + 1}/{quizData.questions.length}</span>
          <Button
            type="text"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
            style={{
              color: '#fff',
              padding: '4px 8px',
              height: 'auto'
            }}
          />
        </span>
      </Footer>
    </Layout>
  );
};

export default ViewQuiz;