import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Row, Col, Card, Tabs, FloatButton, message, Modal } from 'antd';
import {
  EditOutlined,
  LeftOutlined,
  RightOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import Avatar from 'react-nice-avatar';
import bg20 from '../../assets/QuizBackground/19.webp';
import io from 'socket.io-client';
import {
  JoinButton,
  StyledInput,
  StyledModal,
  AvatarPreviewContainer,
  TabContentContainer,
  LoadingContainer,
  LoadingSpinner,
  LoadingText,
  LoadingDots,
  LoadingDot,
} from './styles/JointQuiz.styles';
import { StartButton } from './styles/StartQuiz.styles';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import LoadingProgress from '../loading/LoadingProgress';
import ViewQuiz from './BoxView/ViewQuiz';
import { useLocation, useNavigate } from 'react-router-dom';
import Countdown from './BoxView/Countdown';
// import Happy from './BoxView/components/Happy';

const socket = io(process.env.REACT_APP_SOCKETWEB, {
  auth: {
    token: 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME),
  },
});

const defaultAvatars = [
  {
    sex: 'man',
    faceColor: '#F9C9B6',
    hairColor: '#000',
    hairStyle: 'normal',
    hatColor: '#000',
    hatStyle: 'none',
    eyeStyle: 'circle',
    glassesStyle: 'none',
    noseStyle: 'short',
    mouthStyle: 'smile',
    shirtStyle: 'polo',
    shirtColor: '#6BD9E9',
    earStyle: 'default',
    eyelashStyle: 'default',
  },
  {
    sex: 'woman',
    faceColor: '#F9C9B6',
    hairColor: '#D2691E',
    hairStyle: 'womanShort',
    hatColor: '#000',
    hatStyle: 'none',
    eyeStyle: 'oval',
    glassesStyle: 'round',
    noseStyle: 'round',
    mouthStyle: 'laugh',
    shirtStyle: 'hoody',
    shirtColor: '#FC909F',
    earStyle: 'default',
    eyelashStyle: 'default',
  },
  {
    sex: 'man',
    faceColor: '#AC6651',
    hairColor: '#8B4513',
    hairStyle: 'mohawk',
    hatColor: '#000',
    hatStyle: 'beanie',
    eyeStyle: 'smile',
    glassesStyle: 'square',
    noseStyle: 'long',
    mouthStyle: 'peace',
    shirtStyle: 'short',
    shirtColor: '#F4D150',
    earStyle: 'default',
    eyelashStyle: 'default',
  },
  {
    sex: 'woman',
    faceColor: '#77311D',
    hairColor: '#FFFF99',
    hairStyle: 'womanShort',
    hatColor: '#D2691E',
    hatStyle: 'turban',
    eyeStyle: 'circle',
    glassesStyle: 'none',
    noseStyle: 'short',
    mouthStyle: 'smile',
    shirtStyle: 'hoody',
    shirtColor: '#77D5AB',
    earStyle: 'default',
    eyelashStyle: 'default',
  },
  {
    sex: 'man',
    faceColor: '#C68642',
    hairColor: '#2F1B14',
    hairStyle: 'normal',
    hatColor: '#8B4513',
    hatStyle: 'beanie',
    eyeStyle: 'oval',
    glassesStyle: 'round',
    noseStyle: 'round',
    mouthStyle: 'laugh',
    shirtStyle: 'polo',
    shirtColor: '#9287FF',
    earStyle: 'default',
    eyelashStyle: 'default',
  },
  {
    sex: 'woman',
    faceColor: '#8D5524',
    hairColor: '#A0522D',
    hairStyle: 'womanShort',
    hatColor: '#FFFF99',
    hatStyle: 'turban',
    eyeStyle: 'smile',
    glassesStyle: 'square',
    noseStyle: 'long',
    mouthStyle: 'peace',
    shirtStyle: 'short',
    shirtColor: '#FC909F',
    earStyle: 'default',
    eyelashStyle: 'default',
  }
];

const LoadingContent = () => (
  <LoadingContainer>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <LoadingSpinner />
      <LoadingText>Đang chuẩn bị</LoadingText>
      <LoadingDots><LoadingDot /><LoadingDot /><LoadingDot /></LoadingDots>
    </div>
  </LoadingContainer>
);

const LoadingRoomContent = () => (
  <LoadingContainer>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <LoadingSpinner />
      <LoadingText>Đang vào phòng</LoadingText>
      <LoadingDots><LoadingDot /><LoadingDot /><LoadingDot /></LoadingDots>
    </div>
  </LoadingContainer>
);

const AvatarPreview = React.memo(({ config }) => {
  const memoizedConfig = React.useMemo(() => ({ ...config }), [config]);

  return (
    <Avatar
      style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.8)' }}
      {...memoizedConfig}
    />
  );
});

const JointQuiz = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [pinCode, setPinCode] = useState('');
  const [userName, setUserName] = useState('');
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [currentAvatarConfig, setCurrentAvatarConfig] = useState(defaultAvatars[0]);
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedUserInfo, setSavedUserInfo] = useState(null);
  const containerRef = useRef(null);
  const clientIdRef = useRef(uuidv4());
  const [roomStatus, setRoomStatus] = useState({ isLocked: false, isRemoved: false });
  const hasJoinedRef = useRef(false);
  const [quizId, setQuizId] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState(bg20);
  const [isLoadingBackground, setIsLoadingBackground] = useState(false);
  const [isBackgroundLoaded, setIsBackgroundLoaded] = useState(false);
  const [isDefaultBackgroundLoaded, setIsDefaultBackgroundLoaded] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [quizData, setQuizData] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const hasCheckedPinRef = useRef(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [showReady, setShowReady] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const resetToInitialState = useCallback(() => {
    setStep(1);
    setPinCode('');
    setUserName('');
    setCurrentAvatarConfig(defaultAvatars[0]);
    setSavedUserInfo(null);
    hasJoinedRef.current = false;
    clientIdRef.current = uuidv4();
    setQuizId('');
    setBackgroundUrl(bg20);
    setIsBackgroundLoaded(false);
    setIsLoadingBackground(false);
    localStorage.removeItem('quizClientId');
    setRoomStatus({ isLocked: false, isRemoved: false });
    setShowQuiz(false);
    setQuizData(null);
    setCurrentQuestionIndex(0);
    hasCheckedPinRef.current = false;
    setIsInitialLoading(false);
  }, []);

  const handleNameAndAvatarSubmit = useCallback(async () => {
    if (!userName.trim()) {
      message.error('Vui lòng nhập biệt danh');
      return;
    }
    if (!pinCode) {
      message.error('Mã PIN không hợp lệ');
      resetToInitialState();
      return;
    }

    // Lưu trữ cấu hình Avatar hiện tại
    const currentConfig = { ...currentAvatarConfig };

    const filteredAvatarConfig = {
      sex: currentConfig.sex,
      faceColor: currentConfig.faceColor,
      hairColor: currentConfig.hairColor,
      hairStyle: currentConfig.hairStyle,
      hatColor: currentConfig.hatColor,
      hatStyle: currentConfig.hatStyle,
      eyeStyle: currentConfig.eyeStyle,
      glassesStyle: currentConfig.glassesStyle,
      noseStyle: currentConfig.noseStyle,
      mouthStyle: currentConfig.mouthStyle,
      shirtStyle: currentConfig.shirtStyle,
      shirtColor: currentConfig.shirtColor,
      earStyle: currentConfig.earStyle || 'default',
      eyelashStyle: currentConfig.eyelashStyle || 'default',
    };

    setIsLoadingBackground(true);
    try {
      const response = await axios.post(
        `/api/quizzes/validate-pin`,
        {
          gamePin: pinCode,
          participant: {
            name: userName.trim(),
            avatar: filteredAvatarConfig,
            clientId: clientIdRef.current,
            score: 0,
          },
        },
        {
          headers: {
            Authorization: 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME),
            'Content-Type': 'application/json',
          },
        }
      );

      setIsLoadingBackground(false);
      if (response.data.success) {
        if (response.data.isLocked) {
          message.warning('Phòng đã bị khóa. Không thể tham gia.');
          resetToInitialState();
          return;
        }
        localStorage.setItem('quizClientId', clientIdRef.current);
        setSavedUserInfo({
          name: userName.trim(),
          avatar: filteredAvatarConfig,
          clientId: clientIdRef.current,
          score: 0,
        });
        setQuizId(response.data.quizId || quizId);
        hasJoinedRef.current = true;
        setStep(3);

        if (response.data.status === 'playing' && typeof response.data.steps === 'number' && response.data.steps > 0) {
          setCurrentQuestionIndex(Math.max(0, response.data.steps - 1));
          if (response.data.quizData) {
            setQuizData(response.data.quizData);
            setShowQuiz(true);
          } else {
            const quizResponse = await axios.get(
              `/api/quizzes/id/${response.data.quizId}`,
              { headers: { Authorization: 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME), 'Content-Type': 'application/json' } }
            );
            if (quizResponse.data.success) {
              setQuizData(quizResponse.data.data);
              setShowQuiz(true);
            }
          }
        }
      } else {
        message.error(response.data.message || 'Không thể tham gia phòng. Vui lòng thử lại.');
      }
    } catch (error) {
      setIsLoadingBackground(false);
      message.error(error.response?.data?.message || 'Lỗi khi tham gia phòng.');
    }
  }, [userName, pinCode, quizId, resetToInitialState, currentAvatarConfig]);

  const handlePinSubmit = useCallback(async (pinToSubmit = pinCode) => {
    const trimmedPin = String(pinToSubmit || '').trim();
    if (!trimmedPin) {
      message.error('Mã PIN không được để trống');
      setPinCode('');
      return;
    }
    if (!/^\d+$/.test(trimmedPin)) {
      message.error('Mã PIN phải là số');
      setPinCode('');
      return;
    }
    if (trimmedPin.length < 4 || trimmedPin.length > 9) {
      message.error('Mã PIN phải có độ dài từ 4 đến 9 chữ số');
      setPinCode('');
      return;
    }

    setIsLoadingBackground(true);
    try {
      const validateResponse = await axios.post(
        `/api/quizzes/validate-pin`,
        { gamePin: trimmedPin },
        { headers: { Authorization: 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME), 'Content-Type': 'application/json' } }
      );

      if (validateResponse.data.success) {
        if (validateResponse.data.isLocked) {
          message.warning('Phòng đã bị khóa.');
          setPinCode('');
          setIsLoadingBackground(false);
          return;
        }

        const fetchedQuizId = validateResponse.data.quizId;
        setQuizId(fetchedQuizId);
        setPinCode(trimmedPin);

        const quizDetailsResponse = await axios.get(
          `/api/quizzes/id/${fetchedQuizId}`,
          { headers: { Authorization: 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME), 'Content-Type': 'application/json' } }
        );

        setIsLoadingBackground(false);

        if (quizDetailsResponse.data.success) {
          const fullQuizData = quizDetailsResponse.data.data;
          setQuizData(fullQuizData);

          if (fullQuizData.background) {
            const img = new Image();
            img.src = fullQuizData.background;
            img.onload = () => setBackgroundUrl(fullQuizData.background);
            img.onerror = () => setBackgroundUrl(bg20);
          } else {
            setBackgroundUrl(bg20);
          }
          setIsBackgroundLoaded(true);

          if (savedUserInfo && savedUserInfo.clientId === clientIdRef.current) {
            if ((fullQuizData.status === 'playing' || fullQuizData.status === 'completed') && typeof fullQuizData.steps === 'number') {
              setCurrentQuestionIndex(Math.max(0, fullQuizData.steps - 1));
              setShowQuiz(true);
            }
            setStep(3);
          } else {
            setStep(2);
          }
        } else {
          message.error('Không thể tải chi tiết trò chơi. Vui lòng thử lại.');
          setPinCode('');
        }
      } else {
        setIsLoadingBackground(false);
        message.error(validateResponse.data.message || 'Mã PIN không hợp lệ hoặc có lỗi xảy ra.');
        setPinCode('');
      }
    } catch (error) {
      setIsLoadingBackground(false);
      message.error(error.response?.data?.message || 'Lỗi kết nối. Mã PIN không hợp lệ hoặc có lỗi xảy ra.');
      setPinCode('');
    }
  }, [pinCode, savedUserInfo, clientIdRef]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    let pinFromUrl = searchParams.get('pin');
    if (!pinFromUrl && location.search) {
      pinFromUrl = location.search.replace('?=', '').replace('?', '');
    }

    if (pinFromUrl && !hasJoinedRef.current && !hasCheckedPinRef.current && !savedUserInfo) {
      hasCheckedPinRef.current = true;
      setPinCode(pinFromUrl.trim());
      handlePinSubmit(pinFromUrl.trim());
    }
  }, [location.search, savedUserInfo, handlePinSubmit]);

  useEffect(() => {
    const img = new Image();
    img.src = bg20;
    img.onload = () => setIsDefaultBackgroundLoaded(true);
    img.onerror = () => setIsDefaultBackgroundLoaded(true);
  }, []);

  useEffect(() => {
    if (!isDefaultBackgroundLoaded) return;
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        clearInterval(interval);
        if (!localStorage.getItem('quizClientId')) {
          setIsInitialLoading(false);
        }
      }
      setLoadingProgress(Math.min(100, progress));
    }, 100);
    return () => clearInterval(interval);
  }, [isDefaultBackgroundLoaded]);

  useEffect(() => {
    const savedClientId = localStorage.getItem('quizClientId');
    if (savedClientId) {
      clientIdRef.current = savedClientId;
      const fetchUserInfoAndQuizState = async () => {
        setIsInitialLoading(true);
        setLoadingProgress(30);
        try {
          const validateResponse = await axios.post(
            `/api/quizzes/validate-pin`,
            { clientId: savedClientId },
            { headers: { Authorization: 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME), 'Content-Type': 'application/json' } }
          );
          setLoadingProgress(60);

          if (validateResponse.data.success && validateResponse.data.participant) {
            const participant = validateResponse.data.participant;
            const fetchedQuizId = validateResponse.data.quizId;

            setPinCode(validateResponse.data.gamePin);
            setUserName(participant.name);
            setCurrentAvatarConfig(participant.avatar || defaultAvatars[0]);
            setQuizId(fetchedQuizId);
            setSavedUserInfo({
              name: participant.name,
              avatar: participant.avatar || defaultAvatars[0],
              clientId: savedClientId,
              score: participant.score || 0,
            });
            hasJoinedRef.current = true;

            const quizDetailsResponse = await axios.get(
              `/api/quizzes/id/${fetchedQuizId}`,
              { headers: { Authorization: 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME), 'Content-Type': 'application/json' } }
            );
            setLoadingProgress(90);

            if (quizDetailsResponse.data.success) {
              const fullQuizData = quizDetailsResponse.data.data;
              setQuizData(fullQuizData);

              setBackgroundUrl(fullQuizData.background || bg20);
              setIsBackgroundLoaded(true);

              if (fullQuizData.status === 'playing' && typeof fullQuizData.steps === 'number' && fullQuizData.steps > 0) {
                setCurrentQuestionIndex(Math.max(0, fullQuizData.steps - 1));
                setShowQuiz(true);
                setStep(3);
              } else {
                setStep(3);
                if (fullQuizData.status === 'completed') {
                  message.info('Trò chơi đã kết thúc. Đang chờ chủ phòng bắt đầu lại...');
                }
              }
            } else {
              message.error('Không thể tải lại chi tiết trò chơi.');
              resetToInitialState();
            }
          } else {
            localStorage.removeItem('quizClientId');
            resetToInitialState();
          }
        } catch (error) {
          localStorage.removeItem('quizClientId');
          resetToInitialState();
        } finally {
          setLoadingProgress(100);
          setIsInitialLoading(false);
        }
      };
      fetchUserInfoAndQuizState();
    } else {
      setIsInitialLoading(false);
    }
  }, [resetToInitialState]);

  useEffect(() => {
    if (!quizId) return;

    socket.emit('joinRoom', { quizId, clientId: clientIdRef.current });

    const handleParticipantRemoved = ({ quizId: eventQuizId, clientId: removedClientId }) => {
      if (eventQuizId === quizId && removedClientId === clientIdRef.current && !isLeaving) {
        setBackgroundUrl(bg20);
        setIsBackgroundLoaded(true);
        message.warning('Bạn đã bị xóa khỏi phòng bởi người quản trị.');
        setRoomStatus((prev) => ({ ...prev, isRemoved: true }));
        resetToInitialState();
        navigate('/minigame', { replace: true });
      }
    };

    const handleRoomUpdated = ({ quizId: eventQuizId, isLocked, status, steps, background }) => {
      if (eventQuizId === quizId) {
        setRoomStatus((prev) => ({ ...prev, isLocked }));
        if (typeof steps === 'number' && (steps - 1) !== currentQuestionIndex) {
          setCurrentQuestionIndex(Math.max(0, steps - 1));
        }
        if (status === 'playing' && steps > 0 && !showQuiz && quizData) {
          setShowQuiz(true);
        } else if (status === 'completed') {
          setShowQuiz(false);
        } else if (status === 'pending') {
          setShowQuiz(false);
          setCurrentQuestionIndex(0);
        }
        if (background) {
          const img = new Image();
          img.onload = () => {
            setBackgroundUrl(background);
            setIsBackgroundLoaded(true);
          };
          img.onerror = () => {
            setBackgroundUrl(bg20);
            setIsBackgroundLoaded(true);
          };
          img.src = background;
        }
      }
    };

    const handleStartQuiz = ({ quizId: eventQuizId, quizData: receivedQuizData, countdown }) => {
      if (eventQuizId === quizId) {
        setQuizData(receivedQuizData);
        setIsCountingDown(true);
        setShowReady(true);
        setCountdown(null);

        setTimeout(() => {
          setShowReady(false);
          setCountdown(3);

          const timer = setInterval(() => {
            setCountdown(prev => {
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
      }
    };

    const handleUpdateQuestion = ({ questionIndex }) => {
      if (quizId) setCurrentQuestionIndex(questionIndex);
    };

    const handleUpdateQuestionTime = ({ quizId: eventQuizId, questionIndex, timeLeft }) => {
      if (eventQuizId === quizId && questionIndex === currentQuestionIndex) {
        setQuizData(prev => ({
          ...prev,
          questions: prev.questions.map((q, idx) =>
            idx === questionIndex ? { ...q, timeLeft } : q
          ),
        }));
      }
    };

    socket.on('participantRemoved', handleParticipantRemoved);
    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('startQuiz', handleStartQuiz);
    socket.on('updateQuestion', handleUpdateQuestion);
    socket.on('updateQuestionTime', handleUpdateQuestionTime);

    return () => {
      socket.off('participantRemoved', handleParticipantRemoved);
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('startQuiz', handleStartQuiz);
      socket.off('updateQuestion', handleUpdateQuestion);
      socket.off('updateQuestionTime', handleUpdateQuestionTime);
    };
  }, [quizId, currentQuestionIndex, isLeaving, showQuiz, quizData, clientIdRef, navigate, resetToInitialState]);

  useEffect(() => {
    if (roomStatus.isRemoved && (step === 3 || showQuiz)) {
      setBackgroundUrl(bg20);
      setIsBackgroundLoaded(true);
      resetToInitialState();
      navigate('/minigame', { replace: true });
    }
  }, [roomStatus.isRemoved, step, showQuiz, navigate, resetToInitialState]);

  const avatarOptions = {
    sex: ['man', 'woman'],
    faceColor: ['#F9C9B6', '#AC6651', '#77311D', '#C68642', '#8D5524'],
    hairColor: ['#000', '#D2691E', '#8B4513', '#A0522D', '#2F1B14', '#FFFF99'],
    hairStyle: ['normal', 'mohawk', 'womanShort'],
    hatColor: ['#000', '#D2691E', '#8B4513', '#A0522D', '#2F1B14', '#FFFF99'],
    hatStyle: ['none', 'beanie', 'turban'],
    eyeStyle: ['circle', 'oval', 'smile', 'default'],
    glassesStyle: ['none', 'round', 'square'],
    noseStyle: ['short', 'long', 'round'],
    mouthStyle: ['laugh', 'smile', 'peace'],
    shirtStyle: ['hoody', 'short', 'polo'],
    shirtColor: ['#9287FF', '#6BD9E9', '#FC909F', '#F4D150', '#77D5AB'],
  };

  const handlePrevAvatar = () => {
    setCurrentAvatarIndex((prevIndex) => {
      const newIndex = prevIndex === 0 ? defaultAvatars.length - 1 : prevIndex - 1;
      setCurrentAvatarConfig(defaultAvatars[newIndex]);
      return newIndex;
    });
  };

  const handleNextAvatar = () => {
    setCurrentAvatarIndex((prevIndex) => {
      const newIndex = prevIndex === defaultAvatars.length - 1 ? 0 : prevIndex + 1;
      setCurrentAvatarConfig(defaultAvatars[newIndex]);
      return newIndex;
    });
  };

  const handleAvatarSelect = () => setIsAvatarModalVisible(false);

  const updateAvatarConfig = (key, value) => {
    setCurrentAvatarConfig((prev) => {
      const newConfig = { ...prev, [key]: value };
      if (key === 'sex') {
        if (value === 'man') {
          if (!avatarOptions.hairStyle.includes(prev.hairStyle) || prev.hairStyle === 'womanShort') newConfig.hairStyle = 'normal';
          if (!avatarOptions.shirtStyle.includes(prev.shirtStyle)) newConfig.shirtStyle = 'polo';
        } else if (value === 'woman') {
          if (!avatarOptions.hairStyle.includes(prev.hairStyle) || prev.hairStyle === 'mohawk' || prev.hairStyle === 'normal') newConfig.hairStyle = 'womanShort';
          if (!avatarOptions.shirtStyle.includes(prev.shirtStyle)) newConfig.shirtStyle = 'hoody';
        }
      }
      if (key !== 'hairStyle' && !avatarOptions.hairStyle.includes(newConfig.hairStyle)) {
        newConfig.hairStyle = newConfig.sex === 'woman' ? 'womanShort' : 'normal';
      }
      return newConfig;
    });
  };

  const renderOptionGrid = (optionType, optionTypeLabel) => {
    return (
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ color: '#fff', marginBottom: '12px', textTransform: 'capitalize' }}>
          {optionTypeLabel || optionType}
        </h4>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}>
          <Row gutter={[12, 12]} justify="start">
            {(avatarOptions[optionType] || []).map((option, index) => (
              <Col key={index} xs={12} sm={8} md={6} lg={4}>
                <Card hoverable size="small"
                  style={{
                    background: currentAvatarConfig[optionType] === option ? 'rgba(79, 172, 254, 0.3)' : 'rgba(255,255,255,0.1)',
                    border: currentAvatarConfig[optionType] === option ? '2px solid #4facfe' : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    minHeight: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => updateAvatarConfig(optionType, option)}
                  bodyStyle={{ padding: '8px' }}
                >
                  {optionType.includes('Color') ? (
                    <div style={{
                      width: '30px',
                      height: '30px',
                      backgroundColor: option,
                      borderRadius: '50%',
                      margin: '0 auto',
                      border: '2px solid rgba(255,255,255,0.3)',
                    }} />
                  ) : (
                    <span style={{ color: '#fff', fontSize: '12px', textTransform: 'capitalize' }}>
                      {option}
                    </span>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    );
  };

  const avatarTabItems = [
    {
      key: '1',
      label: 'Cơ bản',
      children: (
        <TabContentContainer>
          {renderOptionGrid('sex', 'Giới tính')}
          {renderOptionGrid('faceColor', 'Màu da')}
          {renderOptionGrid('hairColor', 'Màu tóc')}
          {renderOptionGrid('hairStyle', 'Kiểu tóc')}
        </TabContentContainer>
      ),
    },
    {
      key: '2',
      label: 'Khuôn mặt',
      children: (
        <TabContentContainer>
          {renderOptionGrid('eyeStyle', 'Kiểu mắt')}
          {renderOptionGrid('noseStyle', 'Kiểu mũi')}
          {renderOptionGrid('mouthStyle', 'Kiểu miệng')}
          {renderOptionGrid('glassesStyle', 'Kiểu kính')}
        </TabContentContainer>
      ),
    },
    {
      key: '3',
      label: 'Trang phục',
      children: (
        <TabContentContainer>
          {renderOptionGrid('shirtStyle', 'Kiểu áo')}
          {renderOptionGrid('shirtColor', 'Màu áo')}
          {renderOptionGrid('hatStyle', 'Kiểu mũ')}
          {renderOptionGrid('hatColor', 'Màu mũ')}
        </TabContentContainer>
      ),
    },
  ];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => message.error(`Lỗi toàn màn hình: ${err.message}`));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleLeaveRoom = useCallback(async () => {
    if (!quizId || !clientIdRef.current) {
      message.warn('Thông tin phòng không đầy đủ để rời.');
      resetToInitialState();
      navigate('/minigame', { replace: true });
      return;
    }
    setIsLeaving(true);
    try {
      await axios.post(
        `/api/quizzes/update-pin`,
        { quizId, gamePin: pinCode, clientId: clientIdRef.current },
        { headers: { Authorization: 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME), 'Content-Type': 'application/json' } }
      );
      socket.emit('leaveRoom', { quizId, clientId: clientIdRef.current });
      message.info('Bạn đã rời phòng.');
    } catch (error) {
      message.error('Lỗi khi cố gắng rời phòng.');
    } finally {
      setIsLeaving(false);
      setIsLeaveModalVisible(false);
      resetToInitialState();
      navigate('/minigame', { replace: true });
    }
  }, [quizId, pinCode, resetToInitialState, navigate]);

  if (isInitialLoading || (!isDefaultBackgroundLoaded && !isBackgroundLoaded)) {
    return <LoadingProgress loadingProgress={loadingProgress} />;
  }

  if (isCountingDown) {
    return <Countdown showReady={showReady} countdown={countdown} backgroundImage={backgroundUrl} />;
  }

  if (showQuiz && quizData && quizId) {
    return (
      <ViewQuiz
        quizId={quizId}
        quizData={quizData}
        backgroundImage={backgroundUrl}
        gamePin={pinCode}
        isFullscreen={isFullscreen}
        isParticipantView={true}
        questionIndexFromHost={currentQuestionIndex}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: `url(${isBackgroundLoaded ? backgroundUrl : bg20}) no-repeat center / cover`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'background 0.3s ease-in-out'
      }}
    >
      <title>NISO | Tham gia Mini Game</title>
      {step === 1 && (
        <div style={{ textAlign: 'center', width: '100%', maxWidth: '600px', animation: 'fadeInUp 0.6s ease-out' }}>
          <StyledInput
            type="text"
            size='large'
            placeholder="Nhập mã PIN..."
            value={pinCode}
            onChange={(e) => {
              const value = e.target.value.trim();
              if (value === '' || /^\d+$/.test(value)) setPinCode(value);
            }}
            onPressEnter={() => handlePinSubmit()}
            maxLength={9}
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <JoinButton
              size='large'
              onClick={() => handlePinSubmit()}
              disabled={!pinCode.trim() || isLoadingBackground || pinCode.length < 4}
            >
              {isLoadingBackground ? <LoadingRoomContent /> : 'Tham gia'}
            </JoinButton>
          </div>
        </div>
      )}
      {step === 2 && !showQuiz && (
        <div style={{ textAlign: 'center', width: '100%', maxWidth: '600px', animation: 'fadeInUp 0.6s ease-out' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <Button
                type='default'
                shape="circle"
                icon={<LeftOutlined />}
                size="large"
                onClick={handlePrevAvatar}
                aria-label="Previous Avatar"
              />
              <div style={{ position: 'relative', border: '3px solid rgba(255,255,255,0.5)', borderRadius: '50%' }}>
                <AvatarPreview config={currentAvatarConfig} />
                <Button
                  type="primary"
                  shape="circle"
                  icon={<EditOutlined />}
                  size="large"
                  onClick={() => setIsAvatarModalVisible(true)}
                  style={{ position: 'absolute', bottom: '5px', right: '5px', zIndex: 99 }}
                  aria-label="Edit Avatar"
                />
                <div style={{
                  position: 'absolute',
                  bottom: '-25px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: '#fff',
                  fontSize: '14px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}>
                  {currentAvatarIndex + 1} / {defaultAvatars.length}
                </div>
              </div>
              <Button
                type="default"
                shape="circle"
                icon={<RightOutlined />}
                size="large"
                onClick={handleNextAvatar}
                aria-label="Next Avatar"
              />
            </div>
          </div>
          <StyledInput
            placeholder="Nhập biệt danh..."
            value={userName}
            size='large'
            onChange={(e) => {
              const newName = e.target.value;
              setUserName(newName);
            }}
            onPressEnter={handleNameAndAvatarSubmit}
            maxLength={20}
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <StartButton
              size='large'
              onClick={handleNameAndAvatarSubmit}
              disabled={!userName.trim() || isLoadingBackground}
            >
              {isLoadingBackground ? <LoadingContent /> : 'Bắt đầu'}
            </StartButton>
          </div>
        </div>
      )}
      {step === 3 && !showQuiz && savedUserInfo && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px', textAlign: 'center', animation: 'fadeInUp 0.6s ease-out' }}>
          <Avatar
            style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.8)', border: '3px solid rgba(255,255,255,0.5)', borderRadius: '50%' }}
            {...savedUserInfo.avatar}
          />
          <div style={{ fontSize: '2em', color: '#fff', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            {savedUserInfo.name}
          </div>
          <div style={{ fontSize: '1.2em', color: '#fff', fontWeight: 'bold', textAlign: 'center', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            {quizData?.status === 'completed' ? 'Trò chơi này đã kết thúc! Đang chờ chủ phòng bắt đầu lại...' : 'Bạn đã vào phòng rồi đã thấy tên mình chưa! Đang chờ trò chơi bắt đầu...'}
          </div>
          <LoadingContent />
        </div>
      )}
      <StyledModal
        title={<span style={{ color: '#fff', fontSize: '20px' }}> Tùy chỉnh Avatar của bạn </span>}
        closeIcon={<span style={{ color: '#fff', fontSize: '16px' }}>✖</span>}
        open={isAvatarModalVisible}
        onCancel={handleAvatarSelect}
        footer={[
          <Button
            key="close"
            onClick={handleAvatarSelect}
            style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)', border: 'none', color: '#fff', fontWeight: 'bold' }}
          >
            Xong
          </Button>,
        ]}
        width={Math.min(800, window.innerWidth - 40)}
        centered
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        <AvatarPreviewContainer>
          <Avatar
            style={{ width: '120px', height: '120px', background: 'rgba(255,255,255,0.8)', borderRadius: '50%' }}
            {...currentAvatarConfig}
          />
        </AvatarPreviewContainer>
        <TabContentContainer>
          <Tabs type="card" size="small" items={avatarTabItems} />
        </TabContentContainer>
      </StyledModal>
      <Modal
        title="Xác nhận rời phòng"
        open={isLeaveModalVisible}
        onCancel={() => !isLeaving && setIsLeaveModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsLeaveModalVisible(false)} disabled={isLeaving}>
            Hủy
          </Button>,
          <Button key="confirm" type="primary" danger loading={isLeaving} onClick={handleLeaveRoom}>
            Rời phòng
          </Button>,
        ]}
      >
        <p>Bạn có chắc chắn muốn rời phòng không?</p>
      </Modal>
      <FloatButton.Group
        trigger="hover"
        icon={<SettingOutlined />}
        style={{ right: 20, bottom: 20 }}
      >
        <FloatButton
          icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          onClick={toggleFullscreen}
          tooltip={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }}
        />
        {(step === 3 || showQuiz) && savedUserInfo && (
          <FloatButton
            icon={<LogoutOutlined />}
            tooltip="Rời phòng"
            onClick={() => setIsLeaveModalVisible(true)}
            style={{ background: 'rgba(255, 0, 0, 0.25)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff' }}
          />
        )}
      </FloatButton.Group>
    </div>
  );
};

export default JointQuiz;