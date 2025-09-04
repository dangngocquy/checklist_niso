import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import {
  Steps, Spin, Button, message, Result, Input, Space, Modal, Typography, Card,
  Progress, Drawer, Tag
} from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Webcam from 'react-webcam';
import {
  ScanOutlined,
  UserOutlined,
  CheckCircleOutlined,
  LockOutlined,
  CameraOutlined,
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Step } = Steps;
const { Title, Text, Paragraph } = Typography;

const FaceID = ({ user, onClose, isModalVisible, handleCloseFaceIdModal, isFaceIdModalVisible }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [loadingRetry, setLoadingRetry] = useState(false);
  const [password, setPassword] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [faceAlertType, setFaceAlertType] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [facePosition, setFacePosition] = useState(null);
  const [faceCaptureDone, setFaceCaptureDone] = useState(false);
  const [faceCaptureStep, setFaceCaptureStep] = useState(0);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);

  // Di chuyển khai báo faceDirections lên trên
  const faceDirections = React.useMemo(() => [
    { name: 'giữa', instruction: 'Giữ khuôn mặt ở giữa khung hình' },
    { name: 'trái', instruction: 'Quay nhẹ khuôn mặt sang trái' },
    { name: 'phải', instruction: 'Quay nhẹ khuôn mặt sang phải' },
    { name: 'trên', instruction: 'Ngẩng đầu nhẹ lên trên' },
    { name: 'dưới', instruction: 'Cúi đầu nhẹ xuống dưới' },
  ], []);

  // Handle responsive UI
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const steps = [
    { title: 'Xác thực', icon: <LockOutlined />, content: 'Vui lòng nhập mật khẩu của bạn' },
    { title: 'Quét mặt', icon: <CameraOutlined />, content: 'Vui lòng đặt khuôn mặt vào khung' },
    { title: 'Xác nhận', icon: <CheckCircleOutlined />, content: 'Xác nhận quét khuôn mặt' },
    { title: 'Hoàn tất', icon: <CheckOutlined />, content: 'Xác nhận khuôn mặt' },
  ];

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingProgress(0);
        // Make sure the model paths are correct - try with both relative and absolute paths
        const MODEL_URL = process.env.PUBLIC_URL + '/models';
        // If the above doesn't work, try with just '/models'

        console.log("Loading face detection models from:", MODEL_URL);

        try {
          await faceapi.nets.ssdMobilenetv1.loadFromUri(`${MODEL_URL}/ssd_mobilenetv1`);
          console.log("SSD MobileNet loaded successfully");
        } catch (err) {
          console.error("Error loading SSD MobileNet:", err);
          // Fallback to absolute path
          await faceapi.nets.ssdMobilenetv1.loadFromUri(`/models/ssd_mobilenetv1`);
        }
        setLoadingProgress(30);

        try {
          await faceapi.nets.faceRecognitionNet.loadFromUri(`${MODEL_URL}/face_recognition`);
          console.log("Face Recognition model loaded successfully");
        } catch (err) {
          console.error("Error loading Face Recognition model:", err);
          await faceapi.nets.faceRecognitionNet.loadFromUri(`/models/face_recognition`);
        }
        setLoadingProgress(70);

        try {
          await faceapi.nets.faceLandmark68Net.loadFromUri(`${MODEL_URL}/face_landmark_68`);
          console.log("Facial Landmarks model loaded successfully");
        } catch (err) {
          console.error("Error loading Facial Landmarks model:", err);
          await faceapi.nets.faceLandmark68Net.loadFromUri(`/models/face_landmark_68`);
        }
        setLoadingProgress(100);

        console.log("All models loaded successfully");
        setTimeout(() => setModelsLoaded(true), 500);
      } catch (error) {
        console.error('Error loading models:', error);
        message.error('Vui lòng load lại trang.');
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    if (!isModalVisible) {
      stopVideo();
    }
    return () => stopVideo();
  }, [isModalVisible]);

  useEffect(() => {
    if (currentStep === 1 && isCameraOpen) {
      // Đã loại bỏ message.info
    }

    return () => { };
  }, [currentStep, isCameraOpen, faceDirections]);

  const startVideo = () => {
    setIsCameraOpen(true);
    setFaceAlertType(null);
    setAlertVisible(false);
    setIsLoadingCamera(true);
  };

  const stopVideo = () => {
    setIsCameraOpen(false);
    setIsLoadingCamera(false);
    if (webcamRef.current && webcamRef.current.video) {
      const stream = webcamRef.current.video.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const analyzeBrightness = (imageData) => {
    let sum = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      sum += (0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2]);
    }
    return sum / (imageData.width * imageData.height);
  };

  const checkFacePosition = (detectionBox, canvasWidth, canvasHeight) => {
    // Kiểm tra xem detectionBox có chứa các giá trị null không
    if (detectionBox.x === null || detectionBox.y === null || 
        detectionBox.width === null || detectionBox.height === null) {
      console.warn("Detection box chứa giá trị null:", detectionBox);
      return null;
    }
    
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    // Increase radius for more flexibility (from 0.35/0.4 to 0.4/0.45)
    const radiusX = canvasWidth * 0.4;
    const radiusY = canvasHeight * 0.45;

    const faceX = detectionBox.x + detectionBox.width / 2;
    const faceY = detectionBox.y + detectionBox.height / 2;

    const normalizedX = (faceX - centerX) / radiusX;
    const normalizedY = (faceY - centerY) / radiusY;
    const distance = normalizedX * normalizedX + normalizedY * normalizedY;

    // Make the threshold more forgiving (from 1 to 1.2)
    if (distance > 1.2) {
      let position = '';
      // Make the thresholds less strict (from 0.5 to 0.6)
      if (normalizedY < -0.6) position += 'trên';
      else if (normalizedY > 0.6) position += 'dưới';
      if (normalizedX < -0.6) position += ' trái';
      else if (normalizedX > 0.6) position += ' phải';
      return position.trim() || 'ngoài khung';
    }

    return null;
  };

  const captureImage = useCallback((descriptor) => {
    if (faceCaptureDone) return;

    setIsLoading(true);
    setFaceCaptureDone(true);

    setTimeout(() => {
      setFaceDescriptor(descriptor);
      setCurrentStep(2);
      setIsLoading(false);
      stopVideo();
      message.success({
        content: 'Quét khuôn mặt thành công!',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      });
    }, 1000);
  }, [faceCaptureDone]);

  const checkFaceDirection = (landmarks) => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const nose = landmarks.getNose();
    const jawOutline = landmarks.getJawOutline();

    // Calculate face center
    const faceCenter = {
      x: (jawOutline[0].x + jawOutline[16].x) / 2,
      y: (jawOutline[0].y + jawOutline[16].y) / 2
    };

    // Calculate horizontal tilt based on eye positions
    const eyeAngle = Math.atan2(rightEye[0].y - leftEye[0].y, rightEye[0].x - leftEye[0].x) * 180 / Math.PI;

    // Calculate nose offset from center (for up/down direction)
    const noseOffset = nose[3].y - faceCenter.y;

    // Calculate lateral nose offset (for left/right direction)
    const noseLateralOffset = nose[3].x - faceCenter.x;

    // Tăng độ linh hoạt với ngưỡng nhận diện rộng hơn
    if (Math.abs(eyeAngle) < 10 && Math.abs(noseOffset) < 20 && Math.abs(noseLateralOffset) < 20) {
      return 'giữa';
    } else if (noseLateralOffset < -18) {
      return 'trái';
    } else if (noseLateralOffset > 18) {
      return 'phải';
    } else if (noseOffset < -13) {
      return 'trên';
    } else if (noseOffset > 13) {
      return 'dưới';
    }

    // Nếu không nhận diện rõ ràng hướng cụ thể, mặc định là "giữa"
    return 'giữa';
  };

  useEffect(() => {
    let intervalId, timeoutId, noFaceDetectedTimeout, brightCheckId;

    const handleVideoPlay = async () => {
      if (webcamRef.current && isCameraOpen && modelsLoaded) {
        const video = webcamRef.current.video;
        
        // Thêm event listener để biết khi video đã sẵn sàng
        video.addEventListener('loadeddata', () => {
          setIsLoadingCamera(false); // Tắt loading camera khi đã tải xong
        });
        
        const canvas = canvasRef.current;
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        // Reset alert state when starting video analysis
        setFaceAlertType(null);
        setAlertVisible(false);

        brightCheckId = setInterval(() => {
          if (canvas && video) {
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const brightness = analyzeBrightness(imageData);

            if (brightness < 30) { // Lower threshold from 40 to 30
              setFaceAlertType('lighting');
              setAlertVisible(true);
            } else if (faceAlertType === 'lighting') {
              setFaceAlertType(null);
              setAlertVisible(false);
            }
          }
        }, 3000);

        // Increase timeout before showing no face warning (from 10s to 15s)
        noFaceDetectedTimeout = setTimeout(() => {
          if (!isFaceDetected) {
            setFaceAlertType('noface');
            setAlertVisible(true);
          }
        }, 15000);

        intervalId = setInterval(async () => {
          try {
            // Add logging to help troubleshoot
            console.log("Attempting face detection...");

            // Kiểm tra xem video có sẵn sàng không
            if (!video || !video.readyState === 4) {
              console.log("Video chưa sẵn sàng");
              return;
            }

            const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({
              minConfidence: 0.5,
            }))
              .withFaceLandmarks()
              .withFaceDescriptors();

            console.log(`Detection results: ${detections.length} faces found`);

            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = isFaceDetected ? '#52c41a' : '#1890ff';
            ctx.lineWidth = 2;

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radiusX = canvas.width * 0.4; // Consistent with checkFacePosition
            const radiusY = canvas.height * 0.45;

            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            ctx.stroke();

            if (!isFaceDetected) {
              ctx.setLineDash([5, 5]);
              ctx.beginPath();
              ctx.moveTo(centerX, centerY - radiusY - 20);
              ctx.lineTo(centerX, centerY - radiusY - 5);
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(centerX, centerY + radiusY + 20);
              ctx.lineTo(centerX, centerY + radiusY + 5);
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(centerX - radiusX - 20, centerY);
              ctx.lineTo(centerX - radiusX - 5, centerY);
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(centerX + radiusX + 20, centerY);
              ctx.lineTo(centerX + radiusX + 5, centerY);
              ctx.stroke();
              ctx.setLineDash([]);
            }

            if (detections.length > 0) {
              if (faceAlertType === 'noface') {
                setFaceAlertType(null);
                setAlertVisible(false);
              }

              const detection = detections[0];
              if (detection && detection.detection && detection.detection.box) {
                // Kiểm tra xem box có giá trị hợp lệ không
                const box = detection.detection.box;
                if (box.x === null || box.y === null || box.width === null || box.height === null) {
                  console.warn("Phát hiện box không hợp lệ:", box);
                  return;
                }
                const landmarks = detection.landmarks;

                // Log face positions to help debug
                console.log("Face detected at:", detection.detection.box);

                const position = checkFacePosition(detection.detection.box, canvas.width, canvas.height);
                setFacePosition(position);

                if (position) {
                  setFaceAlertType('position');
                  setAlertVisible(true);
                  console.log(`Face position issue: ${position}`);
                } else {
                  if (faceAlertType === 'position') {
                    setFaceAlertType(null);
                    setAlertVisible(false);
                  }

                  // Kiểm tra xem faceCaptureStep có hợp lệ không
                  if (faceCaptureStep < faceDirections.length) {
                    // Check face direction
                    const direction = checkFaceDirection(landmarks);
                    const currentDirection = faceDirections[faceCaptureStep].name;

                    console.log(`Current step: ${faceCaptureStep}, Expected: ${currentDirection}, Detected: ${direction}`);

                    if (direction === currentDirection) {
                      // Progress to next step after matching direction
                      setTimeout(() => {
                        if (faceCaptureStep < faceDirections.length - 1) {
                          setFaceCaptureStep(prevStep => prevStep + 1);
                          message.success(`Đã nhận diện hướng ${currentDirection}!`);
                        } else if (faceCaptureStep === faceDirections.length - 1 && !faceCaptureDone) {
                          captureImage(detection.descriptor);
                          setIsFaceDetected(true);
                          clearTimeout(timeoutId);
                          clearTimeout(noFaceDetectedTimeout);
                        }
                      }, 1000);
                    } else {
                      setFaceAlertType('direction');
                      setAlertVisible(true);
                    }
                  }
                }
              }
            } else if (detections.length === 0) {
              console.log("No faces detected");
              setFaceAlertType('noface');
              setAlertVisible(true);
            }
          } catch (error) {
            console.error('Face detection error:', error);
            // Không hiển thị message lỗi liên tục để tránh spam
            // message.error('Nhận diện khuôn mặt thất bại. Vui lòng thử lại.');
          }
        }, 200);

        // Increase overall timeout (from 30s to 45s)
        timeoutId = setTimeout(() => {
          if (!isFaceDetected) {
            stopVideo();
            message.warning({
              content: 'Không phát hiện khuôn mặt. Vui lòng thử lại.',
              icon: <CloseOutlined style={{ color: '#faad14' }} />,
            });
          }
        }, 45000);
      }
    };

    if (isCameraOpen && currentStep === 1) {
      handleVideoPlay();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
      if (noFaceDetectedTimeout) clearTimeout(noFaceDetectedTimeout);
      if (brightCheckId) clearInterval(brightCheckId);
    };
  }, [isCameraOpen, currentStep, isFaceDetected, captureImage, modelsLoaded, faceAlertType, faceCaptureStep, faceCaptureDone, faceDirections]);

  const updateFaceID = async (descriptor) => {
    setLoadingNext(true);
    try {
      const response = await axios.put(`/users/update-face-id/${user.keys}`, { faceID: descriptor }, {
        headers: { 'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}` }
      });
      if (response.data.message === 'Face ID updated successfully') {
        message.success({
          content: 'Cập nhật Face ID thành công!',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        });
        setCurrentStep(3);
      }
    } catch (error) {
      message.error('Lỗi cập nhật Face ID: ' + error.message);
    } finally {
      setLoadingNext(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 0) {
      if (password === user.password) {
        setCurrentStep(1);
        startVideo();
      } else {
        message.error({
          content: 'Mật khẩu không đúng. Vui lòng thử lại.',
          icon: <CloseOutlined style={{ color: '#f5222d' }} />,
        });
      }
    } else if (currentStep === 2) {
      if (faceDescriptor) {
        updateFaceID(faceDescriptor);
      } else {
        message.error('Không có dữ liệu Face ID để cập nhật');
      }
    }
  };

  const handleRetry = () => {
    setLoadingRetry(true);
    setCurrentStep(1);
    setIsFaceDetected(false);
    setFaceCaptureDone(false);
    setFaceCaptureStep(0);
    startVideo();
    setLoadingRetry(false);
  };

  const getModalTitle = () => (
    <Space style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{
        backgroundColor: '#ae8f3d',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <ScanOutlined style={{ color: '#fff', fontSize: '18px' }} />
      </div>
      <Title level={4} style={{ margin: 0 }}>KHỞI TẠO FACE ID</Title>
    </Space>
  );

  const renderAlertMessage = () => {
    switch (faceAlertType) {
      case 'lighting':
        return {
          message: 'Ánh sáng không đủ',
          description: 'Vui lòng đảm bảo khuôn mặt của bạn được chiếu sáng đầy đủ.',
          type: 'warning',
          icon: <WarningOutlined />
        };
      case 'noface':
        return {
          message: 'Không phát hiện khuôn mặt',
          description: 'Vui lòng đảm bảo khuôn mặt của bạn hiển thị rõ ràng trong camera.',
          type: 'error',
          icon: <InfoCircleOutlined />
        };
      case 'position':
        return {
          message: 'Vị trí khuôn mặt không đúng',
          description: `Vui lòng di chuyển khuôn mặt vào giữa khung. Khuôn mặt đang ở phía ${facePosition}.`,
          type: 'info',
          icon: <InfoCircleOutlined />
        };
      case 'direction':
        return {
          message: 'Hướng khuôn mặt không đúng',
          description: faceDirections && faceCaptureStep < faceDirections.length 
            ? `Vui lòng ${faceDirections[faceCaptureStep].instruction.toLowerCase()}.`
            : 'Vui lòng điều chỉnh hướng khuôn mặt.',
          type: 'info',
          icon: <InfoCircleOutlined />
        };
      default:
        return null;
    }
  };

  if (!modelsLoaded) {
    return isMobile ? (
      <Drawer
        placement="bottom"
        height="80vh"
        visible={isFaceIdModalVisible}
        onClose={handleCloseFaceIdModal}
        title={getModalTitle()}
        closeIcon={false}
        footer={<Button type="primary" onClick={handleCloseFaceIdModal} block>Close</Button>}
        bodyStyle={{ padding: '16px' }}
      >
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <ScanOutlined spin style={{ fontSize: '48px', color: '#ae8f3d', marginBottom: '20px' }} />
          <Title level={4}>Đang tải mô hình nhận diện khuôn mặt</Title>
          <Paragraph type="secondary">Vui lòng đợi trong giây lát...</Paragraph>
          <Progress
            percent={loadingProgress}
            status="active"
            style={{ maxWidth: '80%', margin: '20px auto' }}
          />
        </div>
      </Drawer>
    ) : (
      <Modal
        title={getModalTitle()}
        visible={isFaceIdModalVisible}
        onCancel={handleCloseFaceIdModal}
        footer={null}
        width={700}
        centered
      >
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <ScanOutlined spin style={{ fontSize: '48px', color: '#1890ff', marginBottom: '20px' }} />
          <Title level={4}>Đang tải mô hình nhận diện khuôn mặt</Title>
          <Paragraph type="secondary">Vui lòng đợi trong giây lát...</Paragraph>
          <Progress
            percent={loadingProgress}
            status="active"
            style={{ maxWidth: '80%', margin: '20px auto' }}
          />
        </div>
      </Modal>
    );
  }

  const content = (
    <div style={{ position: 'relative' }}>
      {isMobile ? (
        <div style={{ marginBottom: '12px', marginTop: 12, color: '#ae8f3d', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
          {steps[currentStep].icon} {steps[currentStep].title}
        </div>
      ) : (
        <Steps current={currentStep} style={{ marginBottom: '12px', marginTop: 24 }} size='small'>
          {steps.map(item => (
            <Step
              key={item.title}
              title={item.title}
              icon={item.icon}
              className='niso-steps'
            />
          ))}
        </Steps>
      )}

      {currentStep === 0 && (
        <Card
          bordered={false}
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', borderRadius: '12px', marginTop: '20px', marginBottom: '20px' }}
        >
          <Space style={{ textAlign: 'center', justifyContent: 'center', width: '100%' }} direction='vertical' size="large">
            <div>
              <UserOutlined style={{ fontSize: '48px', color: '#ae8f3d', padding: '12px', background: '#edecdf', borderRadius: '50%', marginBottom: '12px' }} />
              <Title level={4}>Xác thực người dùng</Title>
              <Text type="secondary">Để tiếp tục, vui lòng nhập mật khẩu của bạn để xác thực</Text>
            </div>
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu của bạn"
              prefix={<LockOutlined />}
              size="middle"
              style={{ maxWidth: '320px', margin: '15px 0' }}
              onPressEnter={handleNextStep}
            />
            <Button
              type="primary"
              onClick={handleNextStep}
              size="middle"
              style={{ minWidth: '150px' }}
            >
              Tiếp theo
            </Button>
          </Space>
        </Card>
      )}

      {currentStep === 1 && (
        <Card
          bordered={false}
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', borderRadius: '12px', marginTop: '20px', marginBottom: '20px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <Title level={4}>Quét khuôn mặt của bạn</Title>
            {faceDirections && faceCaptureStep < faceDirections.length && (
              <Tag color="#ae8f3d" style={{ marginBottom: 12, fontSize: '14px', textAlign: 'center' }}>
                {faceDirections[faceCaptureStep].instruction}
                <br/>
                {alertVisible && renderAlertMessage() && (
                 <>({renderAlertMessage().message})</>
                )}
              </Tag>
            )}

            <div style={{
              position: 'relative',
              width: '250px',
              height: '320px',
              overflow: 'hidden',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: `2px solid ${isFaceDetected ? '#52c41a' : faceAlertType ? '#f5222d' : '#ae8f3d'}`,
            }}>
              {isCameraOpen ? (
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    width={250}
                    height={320}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ width: 250, height: 320, facingMode: "user" }}
                    style={{ objectFit: 'cover' }}
                  />
                  <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                  
                  {isLoadingCamera && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      zIndex: 10
                    }}>
                      <Spin tip="Đang khởi tạo camera..." size="small" />
                    </div>
                  )}
                  
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <Text style={{ color: '#fff', marginBottom: '5px' }}>
                      {isFaceDetected ? 'Đã phát hiện khuôn mặt' : faceAlertType ? 'Đang điều chỉnh...' : 'Đang quét...'}
                    </Text>
                    <Progress
                      percent={(faceCaptureStep / faceDirections.length) * 100}
                      size="small"
                      status={isFaceDetected ? "success" : faceAlertType ? "exception" : "active"}
                      showInfo={false}
                      strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  background: '#f0f2f5'
                }}>
                  <CameraOutlined style={{ fontSize: '36px', color: '#ae8f3d', marginBottom: '10px' }} />
                  <Text>Quá thời gian vui lòng làm mới trang</Text>
                </div>
              )}
              {isLoading && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.7)'
                }}>
                  <Spin size="large" />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card
          bordered={false}
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', borderRadius: '12px', marginTop: '20px', marginBottom: '20px' }}
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', padding: '12px', background: '#f6ffed', borderRadius: '50%', marginBottom: '20px' }} />
            <Title level={4}>Xác nhận khuôn mặt</Title>
            <Paragraph style={{ marginBottom: '20px' }}>
              Khuôn mặt của bạn đã được quét thành công. Bạn có muốn lưu khuôn mặt này để sử dụng cho việc chấm công?
            </Paragraph>
            <Space size="middle">
              <Button type="primary" onClick={handleNextStep} loading={loadingNext} icon={<CheckOutlined />} size="middle">
                Xác nhận và lưu
              </Button>
              <Button onClick={handleRetry} loading={loadingRetry} icon={<ReloadOutlined />} size="middle">
                Quét lại
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {currentStep === 3 && (
        <Card
          bordered={false}
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', borderRadius: '12px', marginTop: '20px', marginBottom: '20px' }}
        >
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title="Thiết lập Face ID hoàn tất"
            subTitle="Chức năng chấm công bằng khuôn mặt của bạn đã sẵn sàng sử dụng!"
            extra={[
              <Button type="primary" key="console" size="middle" onClick={() => navigate('/auth/docs/cham-lam-viec')}>
                Chấm công ngay
              </Button>
            ]}
          />
        </Card>
      )}
    </div>
  );

  return isMobile ? (
    <Drawer
      placement="bottom"
      height="80vh"
      closeIcon={false}
      visible={isFaceIdModalVisible}
      onClose={handleCloseFaceIdModal}
      footer={<Button type="primary" onClick={handleCloseFaceIdModal} block>Close</Button>}
      title={getModalTitle()}
      bodyStyle={{ padding: '16px' }}
    >
      {content}
    </Drawer>
  ) : (
    <Modal
      title={getModalTitle()}
      visible={isFaceIdModalVisible}
      onCancel={handleCloseFaceIdModal}
      footer={null}
      width={700}
      centered
    >
      {content}
    </Modal>
  );
};

export default FaceID;