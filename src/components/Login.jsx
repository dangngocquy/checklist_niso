import React, { useState, useEffect } from 'react';
import { Layout, Form, Input, Button, Checkbox, Space, message, Divider, QRCode, Modal, Typography } from 'antd';
import { QrcodeOutlined, UserOutlined, CloseOutlined, FileProtectOutlined, AndroidOutlined, LockOutlined, ScanOutlined, WarningFilled, InfoCircleOutlined } from '@ant-design/icons';
import QrScanner from 'react-qr-scanner';
import Background from '../assets/niso.png';
import moment from 'moment';
import Logos from '../assets/Logo.svg';
import File from '../assets/APP_APK/base.apk';
import { useLocation } from 'react-router-dom';
import useApi from '../hook/useApi';

const { Content } = Layout;

const Login = ({ onLoginSuccess, t, deviceInfo, browser, country, locations, initializePermission }) => {
  const { loginPost, addLoginHistory, updateLoginHistory } = useApi();
  const [inputType, setInputType] = useState('text');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showCheckbox, setShowCheckbox] = useState(true);
  const [showOnlyCustomInput, setShowOnlyCustomInput] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(true);
  const [codeStaff, setCodeStaff] = useState('');
  const [isQRCameraOpen, setIsQRCameraOpen] = useState(false);
  const [qrScanAttempts, setQrScanAttempts] = useState(0);
  const [qrScanTimer, setQrScanTimer] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [showPasswordForID, setShowPasswordForID] = useState(true);
  const [isQRLogin, setIsQRLogin] = useState(false);
  const [showQRCodeDisplay, setShowQRCodeDisplay] = useState(false);
  const [isQRView, setIsQRView] = useState(false);
  const [qrStatus, setQrStatus] = useState('active');
  const location = useLocation();
  const [qrValue, setQrValue] = useState('');
  const [userData, setUserData] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0); // State for tracking failed attempts
  const currentDate = moment().format('DD-MM-YYYY HH:mm:ss');

  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent;
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const generateQRValue = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const timestamp = new Date().getTime();
    const combinedValue = `${randomCode}${timestamp}`;
    setQrValue(combinedValue);
  };

  useEffect(() => {
    if (showQRCodeDisplay) {
      generateQRValue();
      const interval = setInterval(() => {
        generateQRValue();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [showQRCodeDisplay]);

  useEffect(() => {
    const handleQRLogin = async () => {
      const { state } = location;
      if (state?.qrCode) {
        try {
          const response = await loginPost({
            code_staff: state.qrCode,
            isQRLogin: true,
          });
          const data = response;

          if (data.locker === true) {
            Modal.error({
              title: (
                <div>
                  <LockOutlined />
                  Tài khoản bị khóa
                </div>
              ),
              content: (
                <div>
                  <WarningFilled style={{ display: 'block' }} />
                  <Typography.Text strong>
                    Tài khoản của bạn đã bị khóa
                  </Typography.Text>
                  <Typography.Paragraph style={{ color: '#666', marginBottom: '16px' }}>
                    Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.
                  </Typography.Paragraph>
                  <div
                    style={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fee2e2',
                      padding: '12px',
                      borderRadius: '8px',
                      marginTop: '8px',
                    }}
                  >
                    <Typography.Text style={{ color: '#b91c1c', fontSize: '14px' }}>
                      Liên hệ quản trị viên để được hỗ trợ
                    </Typography.Text>
                  </div>
                </div>
              ),
              okText: 'Đóng',
              centered: true,
              width: 420,
              icon: null,
              className: 'account-locked-modal',
              bodyStyle: {
                padding: '24px',
                textAlign: 'center',
              },
            });
            return;
          }

          message.success(`${t('Header.header2')} ${data.name}`);
          setUserData(data);
          const userDataWithTime = {
            keys: data.keys,
            name: data.name,
            bophan: data.bophan,
            phanquyen: data.phanquyen,
            imgAvatar: data.imgAvatar,
            chinhanh: data.chinhanh,
            locker: data.locker,
            chucvu: data.chucvu,
            code_staff: data.code_staff,
            faceID: data.faceID,
            password: data.password,
            date: data.date,
            keepLoggedIn: true,
            loginTime: new Date().toISOString(),
          };

          onLoginSuccess(userDataWithTime);
          await initializePermission(userDataWithTime);

          const loginData = {
            Thoigian: currentDate,
            Thietbi: `${deviceInfo.type} - ${deviceInfo.brand}`,
            Trinhduyet: browser,
            Hedieuhanh: deviceInfo.os,
            Vitri: locations !== 'Unknown' ? `${locations} - ${country}` : 'Không lấy được vị trí',
            keysJSON: data.keys,
          };

          try {
            await updateLoginHistory(loginData);
          } catch (error) {
            if (error.response?.status === 404) {
              await addLoginHistory(loginData);
            }
          }
        } catch (error) {
          message.error(t('Thongbao.thanhcong5') || 'Error server !');
        }
      }
    };

    handleQRLogin();
  }, [location, browser, country, currentDate, deviceInfo, locations, onLoginSuccess, t, loginPost, addLoginHistory, updateLoginHistory, initializePermission]);

  const handleLoginIdOptionClick = () => {
    setShowQRCodeDisplay(false);
    setShowOnlyCustomInput(true);
    setInputType('number');
    setShowPasswordForID(true);
    setShowQRScanner(false);
    setShowCheckbox(true);
    setIsQRLogin(false);
  };

  const handleQRCodeOptionClick = () => {
    setShowQRCodeDisplay(true);
    setShowOnlyCustomInput(false);
    setShowQRScanner(false);
    setShowPasswordForID(false);
    setInputType('text');
    setShowCheckbox(false);
    setIsQRCameraOpen(false);
    setIsQRLogin(true);
    setIsQRView(false);
  };

  const handleScannerOptionClick = () => {
    setShowQRCodeDisplay(false);
    setShowOnlyCustomInput(false);
    setShowQRScanner(true);
    setShowPasswordForID(false);
    setInputType('text');
    setShowCheckbox(false);
    setIsQRCameraOpen(false);
    setIsQRLogin(true);
    setIsQRView(true);
  };

  const handleAccountOptionClick = () => {
    setShowQRCodeDisplay(false);
    setShowOnlyCustomInput(false);
    setInputType('text');
    setShowPasswordForID(true);
    setShowQRScanner(false);
    setShowCheckbox(true);
    setIsQRLogin(false);
  };

  const handleScan = (data) => {
    if (data) {
      const scannedCode = data.text;
      if (/^\d+$/.test(scannedCode)) {
        setCodeStaff(scannedCode);
        handleLoginID({ code_staff: scannedCode, isQRLogin: true });
        setIsQRCameraOpen(false);
        setQrScanAttempts(0);
      } else {
        setQrScanAttempts((prevAttempts) => prevAttempts + 1);
      }
    }
  };

  const toggleQRCamera = async () => {
    if (isMobile && !cameraPermission) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setCameraPermission(true);
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        message.warning(t('Department.input172'));
        return;
      }
    }

    setIsQRCameraOpen((prev) => {
      if (!prev) {
        const timer = setTimeout(() => {
          message.warning(t('Department.input152'));
          setIsQRCameraOpen(false);
          setQrScanTimer(null);
        }, 60000);
        setQrScanTimer(timer);
      } else {
        if (qrScanTimer) {
          clearTimeout(qrScanTimer);
          setQrScanTimer(null);
        }
      }
      return !prev;
    });
    setQrScanAttempts(0);
  };

  const handleError = (err) => {
    console.error(err);
    message.error(t('Department.input150'));
  };

  useEffect(() => {
    if (qrScanAttempts >= 3) {
      message.warning(t('Department.input151'));
      setIsQRCameraOpen(false);
      setQrScanAttempts(0);
    }
  }, [qrScanAttempts, t]);

  const handleLoginID = async (values) => {
    const loadingMessage = message.loading('Đang xác minh...', 0);
    try {
      const loginData = {
        code_staff: btoa(values.code_staff),
        password: values.password ? btoa(values.password) : undefined,
        isQRLogin: values.isQRLogin,
      };

      const response = await loginPost(loginData);
      const data = response;

      loadingMessage();

      if (data?.locker === true) {
        Modal.error({
          content: (
            <div style={{ textAlign: 'center', padding: '0 20px' }}>
              <WarningFilled
                style={{ fontSize: '70px', color: '#ff4d4f', display: 'block', margin: '0 auto 16px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
              <h4 style={{ color: '#333', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>
                Tài khoản của bạn đã bị khóa
              </h4>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px', lineHeight: 1.5 }}>
                Tài khoản của bạn đã tạm thời khóa. Nếu bạn cho rằng đây là sự cố, vui lòng liên hệ với quản trị viên để được hỗ trợ.
              </p>
              <div style={{ backgroundColor: '#f0f2f5', border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <InfoCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px', fontSize: '16px' }} />
                  <span style={{ color: '#333', fontWeight: 600, fontSize: '16px' }}>Contact support</span>
                </div>
                <span style={{ color: '#666', fontSize: '12px', textAlign: 'center' }}>
                  Vui lòng gửi yêu cầu hỗ trợ qua hệ thống quản trị nội bộ
                </span>
              </div>
            </div>
          ),
          okText: 'Đóng',
          okButtonProps: {
            style: { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: 'white', width: '100%' },
          },
          width: 450,
          icon: null,
          bodyStyle: { textAlign: 'center' },
        });
        return;
      }

      if (!data || !data.code_staff) {
        message.error('ID không tồn tại trên hệ thống');
        return;
      }

      message.success(`Xin chào ${data.name}`);
      const userData = {
        ...data,
        keepLoggedIn: rememberPassword,
        loginTime: new Date().toISOString(),
      };

      onLoginSuccess(userData);
      await initializePermission(userData);
      setFailedAttempts(0); // Reset failed attempts on successful login

      const historyLoginData = {
        Thoigian: currentDate,
        Thietbi: `${deviceInfo.type} - ${deviceInfo.brand}`,
        Trinhduyet: browser,
        Hedieuhanh: deviceInfo.os,
        Vitri: locations !== 'Unknown' ? `${locations} - ${country}` : 'Không lấy được vị trí',
        keysJSON: data.keys,
      };
      try {
        await updateLoginHistory(historyLoginData);
      } catch (error) {
        if (error.response?.status === 404) {
          await addLoginHistory(historyLoginData);
        } else {
          throw error;
        }
      }
    } catch (error) {
      loadingMessage();
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          setFailedAttempts((prev) => prev + 1); // Increment failed attempts
          if (failedAttempts === 1) { // Show Modal on second failed attempt
            Modal.warning({
              content: (
                <div style={{ textAlign: 'center', padding: '0 20px' }}>
                  <WarningFilled
                    style={{ fontSize: '70px', color: '#faad14', display: 'block', margin: '0 auto 16px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                  />
                  <h4 style={{ color: '#333', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>
                    Lưu ý
                  </h4>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px', lineHeight: 1.5 }}>
                    Bạn đã nhập sai thông tin đăng nhập. Nếu sai 3 lần liên tiếp, tài khoản sẽ bị khóa tạm thời trong 15 phút.
                  </p>

                  <p style={{ color: 'red', fontSize: '14px', marginBottom: '20px', lineHeight: 1.5 }}>
                    Bạn còn 1 lần thử
                  </p>
                </div>
              ),
              okText: 'Xác nhận',
              okButtonProps: {
                style: { backgroundColor: '#faad14', borderColor: '#faad14', color: 'white', width: '100%' },
              },
              width: 450,
              icon: null,
              bodyStyle: { textAlign: 'center' },
            });
          } else {
            message.error('Sai thông tin đăng nhập'); // Show error message only if Modal is not shown
          }
        } else if (status === 423) {
          Modal.error({
            content: (
              <div style={{ textAlign: 'center', padding: '0 20px' }}>
                <WarningFilled
                  style={{ fontSize: '70px', color: '#ff4d4f', display: 'block', margin: '0 auto 16px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                />
                <h4 style={{ color: '#333', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>
                  Tài khoản bị tạm khóa
                </h4>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px', lineHeight: 1.5 }}>
                  Tài khoản của bạn đã bị tạm khóa do nhập sai mật khẩu quá 3 lần. Vui lòng thử lại sau {data.remainingMinutes} phút.
                </p>
                <div style={{ backgroundColor: '#f0f2f5', border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <InfoCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px', fontSize: '16px' }} />
                    <span style={{ color: '#333', fontWeight: 600, fontSize: '16px' }}>Contact support</span>
                  </div>
                  <span style={{ color: '#666', fontSize: '12px', textAlign: 'center' }}>
                    Vui lòng gửi yêu cầu hỗ trợ qua hệ thống quản trị nội bộ
                  </span>
                </div>
              </div>
            ),
            okText: 'Đóng',
            okButtonProps: {
              style: { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: 'white', width: '100%' },
            },
            width: 450,
            icon: null,
            bodyStyle: { textAlign: 'center' },
          });
        } else if (status === 404) {
          message.error('ID không tồn tại trên hệ thống');
        } else {
          message.error(t('Thongbao.thanhcong5') || 'Error server!');
        }
      } else {
        message.error('Không thể kết nối đến server');
      }
    }
  };

  const handleLogin = async (values) => {
    const loadingMessage = message.loading('Đang xác minh...', 0);
    try {
      const encryptedData = {
        username: btoa(values.username),
        password: btoa(values.password),
      };

      const response = await loginPost(encryptedData);
      const data = response;

      loadingMessage();

      if (data.locker === true) {
        Modal.error({
          content: (
            <div style={{ textAlign: 'center', padding: '0 20px' }}>
              <WarningFilled
                style={{ fontSize: '70px', color: '#ff4d4f', display: 'block', margin: '0 auto 16px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
              <h4 style={{ color: '#333', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>
                Tài khoản của bạn đã bị khóa
              </h4>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px', lineHeight: 1.5 }}>
                Tài khoản của bạn đã tạm thời khóa. Nếu bạn cho rằng đây là sự cố, vui lòng liên hệ với quản trị viên để được hỗ trợ.
              </p>
              <div style={{ backgroundColor: '#f0f2f5', border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <InfoCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px', fontSize: '16px' }} />
                  <span style={{ color: '#333', fontWeight: 600, fontSize: '16px' }}>Contact support</span>
                </div>
                <span style={{ color: '#666', fontSize: '12px', textAlign: 'center' }}>
                  Vui lòng gửi yêu cầu hỗ trợ qua hệ thống quản trị nội bộ
                </span>
              </div>
            </div>
          ),
          okText: 'Đóng',
          okButtonProps: {
            style: { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: 'white', width: '100%' },
          },
          width: 450,
          icon: null,
          bodyStyle: { textAlign: 'center' },
        });
        return;
      }

      message.success(`Xin chào ${data.name}`);
      const userData = {
        ...data,
        keepLoggedIn: rememberPassword,
        loginTime: new Date().toISOString(),
      };

      onLoginSuccess(userData);
      await initializePermission(userData);
      setFailedAttempts(0); // Reset failed attempts on successful login

      const loginData = {
        Thoigian: currentDate,
        Thietbi: `${deviceInfo.type} - ${deviceInfo.brand}`,
        Trinhduyet: browser,
        Hedieuhanh: deviceInfo.os,
        Vitri: locations !== 'Unknown' ? `${locations} - ${country}` : 'Không lấy được vị trí',
        keysJSON: data.keys,
      };
      try {
        await updateLoginHistory(loginData);
      } catch (error) {
        if (error.response?.status === 404) {
          await addLoginHistory(loginData);
        } else {
          throw error;
        }
      }
    } catch (error) {
      loadingMessage();
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          setFailedAttempts((prev) => prev + 1); // Increment failed attempts
          if (failedAttempts === 1) { // Show Modal on second failed attempt
            Modal.warning({
              content: (
                <div style={{ textAlign: 'center', padding: '0 20px' }}>
                  <WarningFilled
                    style={{ fontSize: '70px', color: '#faad14', display: 'block', margin: '0 auto 16px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                  />
                  <h4 style={{ color: '#333', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>
                    Lưu ý
                  </h4>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
                    Bạn đã nhập sai thông tin đăng nhập. Nếu sai 3 lần liên tiếp, tài khoản sẽ bị khóa tạm thời trong 15 phút.
                  </p>
                  <p style={{ color: 'red', fontSize: '14px', marginBottom: '20px', lineHeight: 1.5 }}>
                    Bạn còn 1 lần thử
                  </p>
                </div>
              ),
              okText: 'Xác nhận',
              okButtonProps: {
                style: { backgroundColor: '#faad14', borderColor: '#faad14', color: 'white', width: '100%' },
              },
              width: 450,
              icon: null,
              bodyStyle: { textAlign: 'center' },
            });
          } else {
            message.error('Sai thông tin đăng nhập'); // Show error message only if Modal is not shown
          }
        } else if (status === 423) {
          Modal.error({
            content: (
              <div style={{ textAlign: 'center', padding: '0 20px' }}>
                <WarningFilled
                  style={{ fontSize: '70px', color: '#ff4d4f', display: 'block', margin: '0 auto 16px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                />
                <h4 style={{ color: '#333', fontSize: '18px', marginBottom: '16px', fontWeight: 600 }}>
                  Tài khoản bị tạm khóa
                </h4>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
                  Tài khoản của bạn đã bị tạm khóa do nhập sai mật khẩu quá 3 lần. Vui lòng thử lại sau {data.remainingMinutes} phút.
                </p>
                <div style={{ backgroundColor: '#f0f2f5', border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <InfoCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px', fontSize: '16px' }} />
                    <span style={{ color: '#333', fontWeight: 600, fontSize: '16px' }}>Contact support</span>
                  </div>
                  <span style={{ color: '#666', fontSize: '12px', textAlign: 'center' }}>
                    Vui lòng gửi yêu cầu hỗ trợ qua hệ thống quản trị nội bộ
                  </span>
                </div>
              </div>
            ),
            okText: 'Đóng',
            okButtonProps: {
              style: { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: 'white', width: '100%' },
            },
            width: 450,
            icon: null,
            bodyStyle: { textAlign: 'center' },
          });
        } else {
          message.error(t('Thongbao.thanhcong5') || 'Error server!');
        }
      } else {
        message.error('Không thể kết nối đến server');
      }
    }
  };

  const onFinish = (values) => {
    if (showOnlyCustomInput) {
      handleLoginID({ ...values, isQRLogin });
    } else {
      handleLogin(values);
    }
  };

  let downloadCount = 0;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = File;
    let filename = 'NISO_CHECKLIST_APK';
    if (downloadCount > 0) {
      filename += `(${downloadCount})`;
    }
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(t('Department.input174'));
    downloadCount++;
  };

  const isAccountForm = !showOnlyCustomInput && !showQRCodeDisplay && !showQRScanner;

  return (
    <Layout className="center-report-login-niso">
      <Content className="login-content">
        <div className="containers">
          <div className="margin">
            <title>LOGIN - NISO CHECKLIST</title>
            <div className="box-sign-in">
              <span className="color-text" style={{ marginBottom: '12px' }}>
                LOGIN - NISO CHECKLIST
              </span>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Secure access to your account
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                {showQRCodeDisplay && (
                  <QRCode
                    style={{ marginTop: 15 }}
                    size={200}
                    errorLevel="H"
                    value={qrValue}
                    icon={Logos}
                    status={qrStatus}
                    onRefresh={() => {
                      setQrStatus('active');
                      generateQRValue();
                    }}
                  />
                )}
              </div>
              {showOnlyCustomInput && (
                <Form onFinish={onFinish}>
                  <Form.Item
                    name="code_staff"
                    rules={[{ required: true, message: t('Department.input177') }]}
                    style={{ textAlign: 'left' }}
                  >
                    <Input
                      value={codeStaff}
                      onChange={(e) => setCodeStaff(e.target.value)}
                      name="code_staff"
                      autoComplete="on"
                      prefix={<FileProtectOutlined />}
                      type={inputType}
                      style={{ background: 'transparent' }}
                      placeholder={t('Department.input110')}
                      size="large"
                    />
                  </Form.Item>
                  {showPasswordForID && !isQRLogin && (
                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: 'Vui lòng nhập mật khẩu.' }]}
                      style={{ marginBottom: '10px', textAlign: 'left' }}
                    >
                      <Input.Password
                        placeholder={t('Input.input2')}
                        name="password"
                        style={{ background: 'transparent' }}
                        autoComplete="on"
                        prefix={<LockOutlined />}
                        size="large"
                      />
                    </Form.Item>
                  )}

                  {showCheckbox && (
                    <Form.Item
                      valuePropName="checked"
                      style={{ justifyContent: 'flex-start', display: 'flex', marginBottom: '10px', textAlign: 'left' }}
                    >
                      <Checkbox
                        checked={rememberPassword}
                        onChange={(e) => setRememberPassword(e.target.checked)}
                      >
                        <span style={{ fontSize: '13px', margin: '0 8px 0 0', padding: '0' }}>
                          {t('Department.input178')}
                        </span>
                      </Checkbox>
                    </Form.Item>
                  )}
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      style={{ width: '100%' }}
                    >
                      LOGIN
                    </Button>
                  </Form.Item>
                </Form>
              )}
              {!showOnlyCustomInput && !showQRCodeDisplay && !showQRScanner && (
                <Form onFinish={onFinish}>
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: t('Department.input175') }]}
                    style={{ textAlign: 'left' }}
                  >
                    <Input
                      type={inputType}
                      prefix={<UserOutlined />}
                      placeholder={t('Input.input1')}
                      value={username}
                      style={{ background: 'transparent' }}
                      onChange={(e) => setUsername(e.target.value)}
                      name="username"
                      autoComplete="on"
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: t('Department.input176') }]}
                    style={{ marginBottom: '10px', textAlign: 'left' }}
                  >
                    <Input.Password
                      placeholder={t('Input.input2')}
                      value={password}
                      prefix={<LockOutlined />}
                      onChange={(e) => setPassword(e.target.value)}
                      name="password"
                      autoComplete="on"
                      style={{ background: 'transparent' }}
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    valuePropName="checked"
                    style={{ justifyContent: 'flex-start', display: 'flex', marginBottom: '10px', textAlign: 'left' }}
                  >
                    <Checkbox
                      checked={rememberPassword}
                      onChange={(e) => setRememberPassword(e.target.checked)}
                    >
                      <span style={{ fontSize: '13px', margin: '0 8px 0 0', padding: '0' }}>
                        {t('Department.input178')}
                      </span>
                    </Checkbox>
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" size="large" style={{ width: '100%' }}>
                      LOGIN
                    </Button>
                  </Form.Item>
                </Form>
              )}
              {showQRScanner && (
                <div style={{ marginBottom: '12px' }}>
                  <Button
                    onClick={toggleQRCamera}
                    icon={isQRCameraOpen ? <CloseOutlined /> : <QrcodeOutlined />}
                    style={{ marginBottom: '10px', background: 'transparent' }}
                  >
                    {isQRCameraOpen ? 'Close' : 'Cho phép'}
                  </Button>
                  {isQRCameraOpen && (
                    <QrScanner
                      delay={300}
                      onError={handleError}
                      onScan={handleScan}
                      style={{ width: '100%', borderRadius: '8px' }}
                      constraints={{
                        video: { facingMode: isMobile ? 'environment' : 'user' },
                      }}
                    />
                  )}
                </div>
              )}
              <Form.Item>
                <Divider style={{ marginTop: 0 }}>
                  <p className="with__lg">or login with</p>
                </Divider>
                <Space direction="horizontal" style={{ width: '100%' }} className="mb_banks_Niso">
                  <Button
                    style={{ width: '100%', background: 'transparent' }}
                    type="default"
                    onClick={isAccountForm ? handleLoginIdOptionClick : handleAccountOptionClick}
                    icon={isAccountForm ? <FileProtectOutlined color="rgb(15, 23, 42, 1)" size={16} /> : <UserOutlined color="rgb(15, 23, 42, 1)" size={16} />}
                  >
                    {isAccountForm ? 'ID Code' : 'Tài khoản'}
                  </Button>
                  <Button
                    style={{ width: '100%', background: 'transparent' }}
                    type="default"
                    onClick={isQRView ? handleQRCodeOptionClick : handleScannerOptionClick}
                    icon={isQRView ? <QrcodeOutlined color="rgb(15, 23, 42, 1)" size={14} /> : <ScanOutlined color="rgb(15, 23, 42, 1)" size={14} />}
                  >
                    {isQRView ? 'QR' : 'Quét mã'}
                  </Button>
                </Space>
              </Form.Item>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Button
                  type="link"
                  icon={<AndroidOutlined style={{ fontSize: 21, background: 'transparent' }} />}
                  onClick={handleDownload}
                >
                  {t('Department.input179')}
                </Button>
              </div>
            </div>
            <img src={Background} alt="Ảnh bìa" className="background" />
          </div>
        </div>
        {userData && (
          <div>
            <img src={userData.imgAvatar} alt="Avatar" style={{ width: 100, height: 100 }} />
            <p>{userData.name}</p>
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default React.memo(Login);