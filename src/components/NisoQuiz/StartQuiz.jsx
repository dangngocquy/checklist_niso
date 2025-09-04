import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import ViewQuiz from './BoxView/ViewQuiz';
import LoadingProgress from '../loading/LoadingProgress';
import Avatar from 'react-nice-avatar';
import { QRCode, Modal, message, Tooltip, Button, FloatButton, InputNumber } from 'antd';
import { LockOutlined, UnlockOutlined, UserOutlined, PlayCircleOutlined, ExclamationCircleOutlined, FullscreenExitOutlined, FullscreenOutlined, ShareAltOutlined, DownloadOutlined, SyncOutlined, InfoCircleOutlined, SettingOutlined, PictureOutlined } from '@ant-design/icons';
import BackgroundQuiz from './Design/BackgroundQuiz';
import {
  Container,
  Title,
  StartButton,
  WaitingContainer,
  LeftPanel,
  PinSection,
  PinContent,
  PinLabel,
  PinDisplay,
  PinGroup,
  LoadingSpinner,
  LockIconWrapper,
  QRSection,
  QROverlay,
  LoadingDots,
  LoadingDot,
  QRModal,
  LoadingPin,
  RightPanel,
  ParticipantsList,
  ParticipantItem,
  ParticipantName,
  NoParticipants,
  ControlsSection,
  LockButton,
  LoadingContainer,
  LoadingText
} from './styles/StartQuiz.styles';
import { v4 as uuidv4 } from 'uuid';
import Countdown from './BoxView/Countdown';

const socket = io(process.env.REACT_APP_SOCKETWEB, {
  auth: {
    token: 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME),
  },
});

const LoadingContent = () => (
  <LoadingContainer>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <LoadingSpinner />
      <LoadingText>Đang chuẩn bị</LoadingText>
      <LoadingDots>
        <LoadingDot />
        <LoadingDot />
        <LoadingDot />
      </LoadingDots>
    </div>
  </LoadingContainer>
);

const StartQuiz = () => {
  const { quizId } = useParams();
  const containerRef = useRef(null);
  const clientIdRef = useRef(uuidv4());
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [loadingBackground, setLoadingBackground] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [quizTitle, setQuizTitle] = useState('');
  const [gamePin, setGamePin] = useState(null);
  const [isLoadingPin, setIsLoadingPin] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(true);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [isLoadingStart, setIsLoadingStart] = useState(false);
  const [initialStep, setInitialStep] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showReady, setShowReady] = useState(false);
  const [quizStatus, setQuizStatus] = useState('playing');
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(null);
  const [backgroundModalVisible, setBackgroundModalVisible] = useState(false);

  const apiCall = useCallback(async (endpoint, method = 'GET', data = null) => {
    try {
      const response = await axios({
        method,
        url: `/api/quizzes/${endpoint}`,
        data,
        headers: {
          'Authorization': 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME),
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    socket.emit('joinRoom', { quizId, clientId: clientIdRef.current });

    socket.on('participantJoined', ({ quizId: eventQuizId, participant }) => {
      if (eventQuizId === quizId) {
        setParticipants((prev) => [...prev, participant]);
        setIsLoadingParticipants(false);
      }
    });

    socket.on('participantRemoved', ({ quizId: eventQuizId, clientId }) => {
      if (eventQuizId === quizId) {
        setParticipants((prev) => prev.filter((p) => p.clientId !== clientId));
      }
    });

    socket.on('roomUpdated', ({ quizId: eventQuizId, gamePin, isLocked, status, steps }) => {
      if (eventQuizId === quizId) {
        setGamePin(gamePin || null);
        setIsLocked(isLocked || false);
        setQuizStatus(status || 'pending');
        setInitialStep(steps || 0);
        if (status === 'playing' || status === 'completed') {
          setShowQuiz(true);
        } else {
          setShowQuiz(false);
        }
      }
    });

    socket.on('roomCreated', ({ quizId: eventQuizId }) => {
      if (eventQuizId === quizId) {
        message.success('Phòng đã được tạo');
      }
    });

    return () => {
      socket.off('participantJoined');
      socket.off('participantRemoved');
      socket.off('roomUpdated');
      socket.off('roomCreated');
    };
  }, [quizId]);

  const handleCreatePin = useCallback(async () => {
    setIsLoadingPin(true);
    try {
      const newGamePin = Math.floor(100000 + Math.random() * 900000).toString();
      const response = await apiCall('update-pin', 'POST', {
        quizId,
        gamePin: newGamePin,
        status: 'pending',
        steps: 0,
      });

      if (response.success) {
        setGamePin(newGamePin);
        setIsLocked(false);
        setIsReady(true);
        setIsLoadingPin(false);
        setQuizStatus('pending');
      } else {
        console.error('Không thể tạo mã PIN');
        message.error('Không thể tạo mã PIN. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Lỗi khi tạo mã PIN:', error);
      message.error('Lỗi khi tạo mã PIN. Vui lòng thử lại.');
    } finally {
      setIsLoadingPin(false);
    }
  }, [quizId, apiCall]);

  useEffect(() => {
    const checkExistingData = async () => {
      try {
        const response = await apiCall(`id/${quizId}`);
        if (response.success) {
          const quizData = response.data;
          setQuizTitle(quizData.title || 'Quiz Challenge');
          setInitialStep(quizData.steps || 0);
          setQuizStatus(quizData.status || 'pending');
          setMaxParticipants(quizData.maxParticipants || null);
          if (quizData.gamePin) {
            setGamePin(quizData.gamePin);
            setIsLocked(quizData.isLocked || false);
            setParticipants(quizData.participants || []);
            setIsReady(true);
            setIsLoadingParticipants(false);
            setIsLoadingPin(false);
            if (quizData.status === 'playing' || (quizData.status === 'completed' && quizData.steps > 0)) {
              setShowQuiz(true);
              setQuizData(quizData);
            } else {
              setShowQuiz(false);
            }
          } else {
            handleCreatePin();
          }
        } else {
          handleCreatePin();
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra dữ liệu quiz:', error);
        handleCreatePin();
      }
    };
    checkExistingData();
  }, [quizId, handleCreatePin, apiCall]);

  useEffect(() => {
    const fetchBackground = async () => {
      try {
        setLoadingProgress(20);
        const response = await apiCall(`id/${quizId}`);
        if (response.success) {
          setLoadingProgress(40);
          const quiz = response.data;
          setQuizTitle(quiz.title || 'Quiz Challenge');
          setInitialStep(quiz.steps || 0);
          setQuizStatus(quiz.status || 'pending');
          if (quiz.background) {
            const img = new Image();
            img.onloadstart = () => setLoadingProgress(50);
            img.onprogress = (e) => {
              if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 40) + 50;
                setLoadingProgress(progress);
              }
            };
            img.onload = () => {
              setLoadingProgress(100);
              setBackgroundImage(quiz.background);
              setTimeout(() => setLoadingBackground(false), 500);
            };
            img.onerror = () => {
              setLoadingProgress(100);
              setTimeout(() => setLoadingBackground(false), 500);
            };
            img.src = quiz.background;
          } else {
            setLoadingProgress(100);
            setTimeout(() => setLoadingBackground(false), 500);
          }
        } else {
          setLoadingProgress(100);
          setTimeout(() => setLoadingBackground(false), 500);
        }
      } catch (error) {
        console.error('Lỗi khi tải hình nền:', error);
        setLoadingProgress(100);
        setTimeout(() => setLoadingBackground(false), 500);
      }
    };
    fetchBackground();
  }, [quizId, apiCall]);

  const preloadImages = (quiz) => {
    console.log('Starting preloadImages for quiz:', quiz);
    const imagePromises = [];
    quiz.questions.forEach((question) => {
      if (question.image && question.image.url) {
        imagePromises.push(
          new Promise((resolve, reject) => {
            const img = new Image();
            img.src = question.image.url;
            img.onload = () => {
              console.log('Loaded image:', question.image.url);
              resolve();
            };
            img.onerror = () => {
              console.error('Failed to load image:', question.image.url);
              reject();
            };
          })
        );
      }
      if (question.answers) {
        question.answers.forEach((answer) => {
          if (answer.image && answer.image.url) {
            imagePromises.push(
              new Promise((resolve, reject) => {
                const img = new Image();
                img.src = answer.image.url;
                img.onload = () => {
                  console.log('Loaded answer image:', answer.image.url);
                  resolve();
                };
                img.onerror = () => {
                  console.error('Failed to load answer image:', answer.image.url);
                  reject();
                };
              })
            );
          }
        });
      }
    });
    if (quiz.background) {
      imagePromises.push(
        new Promise((resolve, reject) => {
          const img = new Image();
          img.src = quiz.background;
          img.onload = () => {
            console.log('Loaded background image:', quiz.background);
            resolve();
          };
          img.onerror = () => {
            console.error('Failed to load background image:', quiz.background);
            reject();
          };
        })
      );
    }
    return Promise.all(imagePromises);
  };

  const handleStartClick = async () => {
    setIsLoadingStart(true);
    try {
      const response = await apiCall(`id/${quizId}`);
      if (response.success) {
        const quiz = response.data;
        setQuizData(quiz);
        await preloadImages(quiz);
        setIsCountingDown(true);
        setShowReady(true);
        setCountdown(null);
        socket.emit('startQuiz', { quizId, quizData: quiz, countdown: 3 });
        setTimeout(() => {
          setShowReady(false);
          setCountdown(3);
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                setIsCountingDown(false);
                setShowQuiz(true);
                return null;
              }
              return prev - 1;
            });
          }, 1000);
        }, 1000);
        setTimeout(async () => {
          await apiCall('update-pin', 'POST', {
            quizId,
            gamePin,
            status: 'playing',
            steps: 1,
          });
          setIsLoadingStart(false);
        }, 4000);
      } else {
        throw new Error('Không thể tải dữ liệu quiz');
      }
    } catch (error) {
      console.error('Lỗi khi tải quiz:', error);
      setIsLoadingStart(false);
      setIsCountingDown(false);
      setShowReady(false);
      setCountdown(null);
      message.error('Không thể bắt đầu quiz. Vui lòng thử lại.');
    }
  };

  const handleLockToggle = async () => {
    if (isLocking) return;
    setIsLocking(true);
    try {
      const response = await apiCall('update-pin', 'POST', {
        quizId,
        gamePin,
        isLocked: !isLocked,
      });
      if (response.success) {
        setIsLocked(!isLocked);
        message.success(isLocked ? 'Đã mở khóa phòng' : 'Đã khóa phòng');
      } else {
        console.error('Không thể thay đổi trạng thái khóa phòng');
        message.error('Không thể thay đổi trạng thái khóa phòng.');
      }
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái khóa phòng:', error);
      message.error('Lỗi khi thay đổi trạng thái khóa phòng.');
    } finally {
      setTimeout(() => {
        setIsLocking(false);
      }, 500);
    }
  };

  const handleParticipantClick = (participant) => {
    setSelectedParticipant(participant);
    setRemoveModalVisible(true);
  };

  const handleRemoveParticipant = async () => {
    if (selectedParticipant) {
      try {
        const response = await apiCall('update-pin', 'POST', {
          quizId,
          gamePin,
          clientId: selectedParticipant.clientId,
        });
        if (response.success) {
          setRemoveModalVisible(false);
          setSelectedParticipant(null);
          message.success('Đã xóa người tham gia');
        } else {
          console.error('Không thể xóa người tham gia');
          message.error('Không thể xóa người tham gia.');
        }
      } catch (error) {
        console.error('Lỗi khi xóa người tham gia:', error);
        message.error('Lỗi khi xóa người tham gia.');
      }
    }
  };

  const handleCancelRemove = () => {
    setRemoveModalVisible(false);
    setSelectedParticipant(null);
  };

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
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleQRClick = () => {
    setQrModalVisible(true);
  };

  const handleQRModalClose = () => {
    setQrModalVisible(false);
  };

  const handleShareQR = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Tham gia trò chơi',
          text: 'Quét mã QR này để tham gia trò chơi',
          url: `${window.location.origin}/minigame?=${gamePin}`,
        });
      } else {
        const shareUrl = `${window.location.origin}/minigame?=${gamePin}`;
        await navigator.clipboard.writeText(shareUrl);
        message.success('Đã sao chép link vào clipboard!');
      }
    } catch (error) {
      console.error('Không thể chia sẻ mã QR:', error);
      message.error('Không thể chia sẻ mã QR.');
    }
  };

  const handleDownloadQR = () => {
    try {
      const canvas = document.querySelector('.ant-qrcode canvas');
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `qr-code-${gamePin}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        message.success('Đã tải mã QR xuống thành công!');
      }
    } catch (error) {
      console.error('Không thể tải mã QR xuống:', error);
      message.error('Không thể tải mã QR xuống.');
    }
  };

  const handleCopyPin = async () => {
    if (isLocked) {
      return;
    }
    try {
      await navigator.clipboard.writeText(gamePin);
      message.success('Đã sao chép mã PIN!');
    } catch (error) {
      console.error('Không thể sao chép mã PIN:', error);
      message.error('Không thể sao chép mã PIN.');
    }
  };

  const handleSettingsSave = async () => {
    try {
      const response = await apiCall('update-pin', 'POST', {
        quizId,
        gamePin,
        maxParticipants,
      });

      if (response.success) {
        message.success('Đã cập nhật cài đặt thành công');
        setSettingsModalVisible(false);
      } else {
        message.error('Không thể cập nhật cài đặt');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật cài đặt:', error);
      message.error('Lỗi khi cập nhật cài đặt');
    }
  };

  const handleBackgroundChange = async (newBackground) => {
    try {
      const response = await apiCall('update-pin', 'POST', {
        quizId,
        gamePin,
        background: newBackground,
      });

      if (response.success) {
        setBackgroundImage(newBackground);
        message.success('Đã cập nhật giao diện thành công');
        setBackgroundModalVisible(false);
      } else {
        message.error('Không thể cập nhật giao diện');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật giao diện:', error);
      message.error('Lỗi khi cập nhật giao diện');
    }
  };

  if (loadingBackground) {
    return <LoadingProgress loadingProgress={loadingProgress} />;
  }

  if (isCountingDown) {
    return <Countdown showReady={showReady} countdown={countdown} backgroundImage={backgroundImage} />;
  }

  if (showQuiz && quizData) {
    return (
      <ViewQuiz
        quizId={quizId}
        quizData={quizData}
        backgroundImage={backgroundImage}
        gamePin={gamePin}
        isFullscreen={isFullscreen}
        questionIndexFromHost={initialStep - 1}
      />
    );
  }

  return (
    <Container ref={containerRef} backgroundImage={backgroundImage}>
      <title>NISO | {quizTitle}</title>
      <WaitingContainer>
        <LeftPanel>
          <PinSection>
            <PinContent>
              <PinLabel>
                Mã PIN trò chơi: {!isLocked && <Tooltip title="Tạo mã pin"><Button icon={<SyncOutlined />} size="small" onClick={handleCreatePin} /></Tooltip>}
              </PinLabel>
              {isLoadingPin ? (
                <LoadingPin>
                  <LoadingSpinner />
                  <span>Đang tạo mã PIN...</span>
                  <LoadingDots>
                    <LoadingDot />
                    <LoadingDot />
                    <LoadingDot />
                  </LoadingDots>
                </LoadingPin>
              ) : gamePin ? (
                <>
                  <Tooltip
                    title={isLocked ? "Trò chơi đã bị khóa - Không thể sao chép mã PIN" : "Nhấp để sao chép mã PIN"}
                    placement="bottom"
                    mouseEnterDelay={0.2}
                  >
                    <div>
                      <PinDisplay onClick={handleCopyPin} isLocked={isLocked}>
                        <PinGroup className="pin-group">{gamePin.slice(0, Math.ceil(gamePin.length / 2))}</PinGroup>
                        <PinGroup className="pin-group">{gamePin.slice(Math.ceil(gamePin.length / 2))}</PinGroup>
                        {isLocked && (
                          <LockIconWrapper>
                            <LockOutlined />
                          </LockIconWrapper>
                        )}
                      </PinDisplay>
                    </div>
                  </Tooltip>
                </>
              ) : null}
            </PinContent>
            {gamePin && !isLocked && !isLoadingPin && (
              <QRSection onClick={handleQRClick}>
                <QRCode
                  value={`${window.location.origin}/minigame?=${gamePin}`}
                  size={60}
                  level="M"
                />
                <QROverlay className="qr-overlay">
                  <FullscreenOutlined style={{ fontSize: '24px' }} />
                  <span>Xem QR</span>
                </QROverlay>
              </QRSection>
            )}
          </PinSection>
        </LeftPanel>
        <Title>{quizTitle}</Title>
        <ControlsSection>
          <LockButton
            isLocked={isLocked}
            size='large'
            onClick={handleLockToggle}
            disabled={isLocking}
            style={{ opacity: isLocking ? 0.7 : 1 }}
          >
            {isLocking ? (
              <LoadingSpinner style={{ fontSize: '16px' }} />
            ) : isLocked ? (
              <LockOutlined />
            ) : (
              <UnlockOutlined />
            )}
          </LockButton>
          <StartButton
            size='large'
            onClick={handleStartClick}
            disabled={!isReady || participants.length === 0 || isLoadingStart}
          >
            {isLoadingStart ? (
              <LoadingContent />
            ) : quizStatus === 'completed' ? (
              <><PlayCircleOutlined /> Bắt đầu lại</>
            ) : (
              <><PlayCircleOutlined /> Bắt đầu</>
            )}
          </StartButton>
        </ControlsSection>
        <RightPanel>
          {isLoadingParticipants || participants.length === 0 ? (
            <NoParticipants>
              Đang chờ người tham gia...
            </NoParticipants>
          ) : (
            <ParticipantsList participantsCount={participants.length}>
              {participants.map((participant) => (
                <ParticipantItem
                  key={participant.clientId}
                  onClick={() => handleParticipantClick(participant)}
                  participantsCount={participants.length}
                >
                  <Avatar
                    size={48}
                    style={{
                      width: '48px',
                      height: '48px',
                      background: '#fff',
                      borderRadius: '50%',
                      padding: '2px',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                    {...participant.avatar}
                  />
                  <ParticipantName className="participant-name">
                    {participant.name}
                  </ParticipantName>
                </ParticipantItem>
              ))}
            </ParticipantsList>
          )}
        </RightPanel>
      </WaitingContainer>
      <FloatButton.Group
        trigger="hover"
        style={{ right: 20, bottom: 20 }}
        icon={<InfoCircleOutlined />}
      >
        <FloatButton
          icon={<UserOutlined />}
          badge={{ count: participants.length, color: 'red' }}
          tooltip={maxParticipants ? `${participants.length}/${maxParticipants} người tham gia` : `${participants.length} người tham gia`}
        />
        <FloatButton
          icon={<SettingOutlined/>}
          tooltip="Giới hạn người tham gia"
          onClick={() => setSettingsModalVisible(true)}
        />
        <FloatButton
          icon={<PictureOutlined />}
          tooltip="Cài đặt giao diện"
          onClick={() => setBackgroundModalVisible(true)}
        />
        <FloatButton
          icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          tooltip={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          onClick={toggleFullscreen}
        />
        {gamePin && !isLocked && (
          <FloatButton
            icon={<ShareAltOutlined />}
            tooltip="Chia sẻ mã QR"
            onClick={handleQRClick}
          />
        )}
      </FloatButton.Group>
      <BackgroundQuiz
        visible={backgroundModalVisible}
        onClose={() => setBackgroundModalVisible(false)}
        onSelectBackground={handleBackgroundChange}
      />
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '20px' }} />
            <span>Bỏ người tham gia</span>
          </div>
        }
        open={removeModalVisible}
        onOk={handleRemoveParticipant}
        onCancel={handleCancelRemove}
        okText="Bỏ người tham gia"
        cancelText="Hủy"
        okButtonProps={{
          danger: true,
          style: { borderRadius: '6px' },
        }}
        cancelButtonProps={{
          style: { borderRadius: '6px' },
        }}
        width={450}
      >
        <div style={{ padding: '16px 0' }}>
          <p style={{ marginBottom: '12px' }}>
            Bạn có chắc chắn muốn bỏ <strong>{selectedParticipant?.name}</strong> khỏi trò chơi không?
          </p>
          <p style={{
            color: '#666',
            fontSize: '14px',
            fontStyle: 'italic',
            background: '#f8f9fa',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #e9ecef',
          }}>
            <strong>Lưu ý:</strong> Người tham gia này đã bị bỏ nhưng vẫn có thể tham gia lại dưới biệt danh khác.
          </p>
        </div>
      </Modal>
      <QRModal
        title={qrModalVisible}
        open={qrModalVisible}
        onCancel={handleQRModalClose}
        footer={null}
        width={350}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(10px)' }}
      >
        <div className="qr-title">Mã QR tham gia trò chơi</div>
        <div className="qr-description">
          Quét mã QR này để tham gia trò chơi
        </div>
        <QRCode
          value={`${window.location.origin}/minigame?=${gamePin}`}
          size={200}
          level="M"
        />
        <div className="qr-actions">
          <Button onClick={handleShareQR}>
            <ShareAltOutlined />
            <span>Chia sẻ</span>
          </Button>
          <Button onClick={handleDownloadQR}>
            <DownloadOutlined />
            <span>Tải xuống</span>
          </Button>
        </div>
      </QRModal>
      <Modal
        title="Cài đặt phòng"
        open={settingsModalVisible}
        onOk={handleSettingsSave}
        onCancel={() => setSettingsModalVisible(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Giới hạn số người tham gia:
            </label>
            <InputNumber
              min={1}
              max={100}
              value={maxParticipants}
              onChange={(value) => setMaxParticipants(value)}
              placeholder="Không giới hạn"
              style={{ width: '100%' }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              Để trống để không giới hạn số người tham gia
            </div>
          </div>
          <div style={{ 
            padding: '12px', 
            background: '#f8f9fa', 
            borderRadius: '6px',
            border: '1px solid #e9ecef',
            fontSize: '14px',
            color: '#666'
          }}>
            <strong>Lưu ý:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>Giới hạn số người tham gia sẽ áp dụng ngay lập tức</li>
              <li>Người đang tham gia sẽ không bị ảnh hưởng</li>
              <li>Người mới sẽ không thể tham gia khi đạt giới hạn</li>
            </ul>
          </div>
        </div>
      </Modal>
    </Container>
  );
};

export default StartQuiz;