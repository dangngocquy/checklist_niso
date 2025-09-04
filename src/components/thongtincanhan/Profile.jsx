import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import UserProfileModal from './UserProfileModal';
import {
    Image,
    message,
    Modal,
    Button,
    Alert,
    Typography,
    Space,
    Card,
    List,
    Row,
    Col,
    Skeleton,
    Avatar,
    Tag,
    Empty,
    Upload,
    Tooltip,
    Tabs,
    Badge,
    Form,
    Steps,
    Spin,
    Input,
    Switch,
} from 'antd';
import {
    CameraOutlined,
    UserOutlined,
    LockOutlined,
    ScanOutlined,
    CheckCircleOutlined,
    UserSwitchOutlined,
    PhoneOutlined,
    EditOutlined,
    SafetyOutlined,
    SettingOutlined,
    TeamOutlined,
    MailOutlined,
    BankOutlined,
    DesktopOutlined,
    EyeInvisibleOutlined,
    ExclamationCircleOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import { PiShieldCheck } from 'react-icons/pi';
import Frame from '../../assets/frame1.webp';
import Avatars from '../../config/design/Avatars';
import Faceid from './Faceid';
import backgroundProfile from '../../assets/shop.png';
import { imageDb } from '../../config';
import useFileUpload from '../../hook/useFileUpload';
import Firebase from './Firebase';
import ChangePassword from './ChangePasswords';
import useApi from '../../hook/useApi';
import usePermission from '../../hook/usePermission';
import { getAuth, sendEmailVerification, PhoneAuthProvider, signInWithPhoneNumber } from 'firebase/auth';

const Profile = React.memo(({ user, t, handleLogout, hasCCPermission }) => {
    const { Title, Text, Paragraph } = Typography;
    const { Step } = Steps;
    const { TabPane } = Tabs;
    const { uploadFile } = useFileUpload(imageDb, 'CHECKLISTNISO/BACKGROUND');
    const { userApi } = useApi();
    const { checkPermission } = usePermission();
    const [departmentUsers, setDepartmentUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isFaceIdModalVisible, setIsFaceIdModalVisible] = useState(false);
    const [backgroundImg, setBackgroundImg] = useState(user.imgBackground || backgroundProfile);
    const [permissionLoading, setPermissionLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isUserProfileModalVisible, setIsUserProfileModalVisible] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [form] = Form.useForm();
    const limit = 6;
    const auth = getAuth();

    // OTP verification states
    const [isEmailOtpModalVisible, setIsEmailOtpModalVisible] = useState(false);
    const [isPhoneOtpModalVisible, setIsPhoneOtpModalVisible] = useState(false);
    const [otp, setOtp] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [emailToVerify, setEmailToVerify] = useState('');
    const [phoneToVerify, setPhoneToVerify] = useState('');

    const getActiveTabFromUrl = () => {
        const path = location.pathname;
        if (path.includes('/profile/personal-info')) return '1';
        if (path.includes('/profile/security')) return '2';
        if (path.includes('/profile/faceid')) return '3';
        return '1';
    };

    const [activeTab, setActiveTab] = useState(getActiveTabFromUrl());

    const handleTabChange = (key) => {
        setActiveTab(key);
        switch (key) {
            case '1':
                navigate(`/auth/docs/profile/${user.keys}/personal-info`);
                break;
            case '2':
                navigate(`/auth/docs/profile/${user.keys}/security`);
                break;
            case '3':
                navigate(`/auth/docs/profile/${user.keys}/faceid`);
                break;
            default:
                navigate(`/auth/docs/profile/${user.keys}/personal-info`);
        }
    };

    const fetchDepartmentUsers = useCallback(async (pageToFetch) => {
        try {
            setLoading(true);
            const response = await axios({
                method: 'get',
                url: '/api/users/department-related',
                headers: { 'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}` },
                params: { chinhanh: user.chinhanh, bophan: user.bophan, currentUserKeys: user.keys, page: pageToFetch, limit },
            });

            const newUsers = response.data.users.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Update the departmentUsers state
            setDepartmentUsers((prev) => {
                // If it's the first page, just return the new users
                if (pageToFetch === 1) return newUsers;

                // Otherwise, merge with existing users, avoiding duplicates
                const existingKeys = new Set(prev.map(user => user.keys));
                const uniqueNewUsers = newUsers.filter(user => !existingKeys.has(user.keys));
                return [...prev, ...uniqueNewUsers];
            });

            // Update hasMore based on whether there are more users to fetch
            setHasMore(response.data.total > (pageToFetch * limit));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching department users:', error);
            message.error(t('Profile.input33') || 'Failed to load department users');
            setLoading(false);
        }
    }, [user.chinhanh, user.bophan, user.keys, t, limit]);

    useEffect(() => {
        fetchDepartmentUsers(page);
    }, [fetchDepartmentUsers, page]);

    const handleBackgroundUpload = async (file) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/heic', 'image/heif'];
        if (!allowedTypes.includes(file.type)) {
            message.warning(t('Department.input138'));
            return false;
        }

        const loadingKey = 'uploadingBackground';
        message.loading({ content: 'Đang tải lên hình nền...', key: loadingKey });

        try {
            const url = await new Promise((resolve, reject) => {
                uploadFile(file, (uploadedUrl) => resolve(uploadedUrl), (error) => reject(error));
            });

            // Gửi URL mới để thay thế hoàn toàn imgBackground
            await userApi.updateBackground(user.keys, url);
            setBackgroundImg(url);

            // Cập nhật user với imgBackground là chuỗi thay vì mảng
            const updatedUser = { ...user, imgBackground: url };
            const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
            storage.setItem('user', JSON.stringify(updatedUser));

            message.success({ content: 'Hình nền được tải lên thành công!', key: loadingKey, duration: 2 });
        } catch (error) {
            console.error('Error uploading background:', error);
            message.error({ content: 'Vui lòng thử lại sau', key: loadingKey, duration: 2 });
        }
        return false;
    };

    const openModal = () => setIsModalVisible(true);
    const closeModal = () => setIsModalVisible(false);

    const openFaceIdModal = async () => {
        if (!hasCCPermission) {
            setPermissionLoading(true);
            const permissionResult = await checkPermission({ user, action: 'setup_faceid', silent: false });
            setPermissionLoading(false);

            if (!permissionResult.hasPermission) return;
        }
        setIsFaceIdModalVisible(true);
    };

    const handleCloseFaceIdModal = () => setIsFaceIdModalVisible(false);

    const isNewUser = (joinDate) => {
        if (!joinDate) return false;
        const [datePart, timePart] = joinDate.split(' ');
        const [day, month, year] = datePart.split('-');
        const [hours, minutes, seconds] = timePart.split(':');
        const joinDateTime = new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
        const now = new Date();
        const diffTime = Math.abs(now - joinDateTime);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    };

    const handleUserClick = (user) => {
        setSelectedUser(user);
        setIsUserProfileModalVisible(true);
    };

    // OTP Verification Functions
    // OTP Verification Functions
    const sendEmailOtp = async (email) => {
        try {
            setEmailToVerify(email);
            setIsEmailOtpModalVisible(true);

            // Send verification email
            await sendEmailVerification(auth.currentUser, {
                url: window.location.origin + '/auth/docs/profile/' + user.keys + '/security',
                handleCodeInApp: false
            });

            message.success('Email xác thực đã được gửi đến ' + email);
        } catch (error) {
            console.error('Error sending email verification:', error);
            message.error('Không thể gửi email xác thực: ' + error.message);
            setIsEmailOtpModalVisible(false);
        }
    };

    const sendPhoneOtp = async (phone) => {
        try {
            setPhoneToVerify(phone);
            setIsPhoneOtpModalVisible(true);

            // Format phone number to E.164 format if needed
            let formattedPhone = phone;
            if (!phone.startsWith('+')) {
                // Assuming Vietnam phone numbers, adjust as needed
                formattedPhone = '+84' + phone.replace(/^0/, '');
            }

            // Create a custom verification handler without reCAPTCHA
            const appVerifier = {
                type: 'customVerifier',
                verify: () => Promise.resolve('custom-verification-id-' + Math.random().toString(36).substring(2, 15))
            };

            // Send OTP via SMS
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setVerificationId(confirmationResult.verificationId);

            message.success('Mã OTP đã được gửi đến ' + phone);
        } catch (error) {
            console.error('Error sending phone verification:', error);
            message.error('Không thể gửi mã OTP: ' + error.message);
            setIsPhoneOtpModalVisible(false);
        }
    };

    const verifyOtp = async (type) => {
        try {
            if (type === 'email') {
                // For email, we just close the modal as verification happens via link
                setIsEmailOtpModalVisible(false);
                message.success('Vui lòng kiểm tra email của bạn và nhấp vào liên kết xác thực');
            } else if (type === 'phone') {
                // For phone, we verify the OTP
                if (!otp) {
                    message.warning('Vui lòng nhập mã OTP');
                    return;
                }

                const credential = PhoneAuthProvider.credential(verificationId, otp);
                await auth.currentUser.updatePhoneNumber(credential);

                // Update user in database
                await userApi.update(user.keys, {
                    phone: phoneToVerify,
                    phoneVerified: true
                });

                // Update local storage
                const updatedUser = { ...user, phone: phoneToVerify, phoneVerified: true };
                const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
                storage.setItem('user', JSON.stringify(updatedUser));

                message.success('Số điện thoại đã được xác thực thành công');
                setIsPhoneOtpModalVisible(false);
                setOtp('');
            }
        } catch (error) {
            console.error(`Error verifying ${type}:`, error);
            message.error(`Không thể xác thực ${type === 'email' ? 'email' : 'số điện thoại'}: ` + error.message);
        }
    };


    const handleUpdateProfile = async (values) => {
        const { email, phone, showEmail, showPhone } = values;
        try {
            let updatedValues = {};
            if (email && email !== user.email) {
                await sendEmailOtp(email);
                const verified = await new Promise((resolve) => {
                    const checkVerification = setInterval(async () => {
                        if (!isEmailOtpModalVisible) {
                            clearInterval(checkVerification);
                            resolve(auth.currentUser.emailVerified);
                        }
                    }, 1000);
                });
                if (!verified) return;
                updatedValues.email = email;
                updatedValues.emailVerified = true;
            }
            if (phone && phone !== user.phone) {
                await sendPhoneOtp(phone);
                const verified = await new Promise((resolve) => {
                    const checkVerification = setInterval(async () => {
                        if (!isPhoneOtpModalVisible) {
                            clearInterval(checkVerification);
                            resolve(true); // Assume phone verification completed successfully
                        }
                    }, 1000);
                });
                if (!verified) return;
                updatedValues.phone = phone;
                updatedValues.phoneVerified = true;
            }
            updatedValues.showEmail = showEmail !== undefined ? showEmail : user.showEmail || false;
            updatedValues.showPhone = showPhone !== undefined ? showPhone : user.showPhone || false;

            if (updatedValues.showEmail && !user.emailVerified) {
                message.error('Bạn cần xác thực email trước khi hiển thị.');
                return;
            }
            if (updatedValues.showPhone && !user.phoneVerified) {
                message.error('Bạn cần xác thực số điện thoại trước khi hiển thị.');
                return;
            }

            await userApi.update(user.keys, updatedValues);
            const updatedUser = { ...user, ...updatedValues };
            const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
            storage.setItem('user', JSON.stringify(updatedUser));
            message.success('Cập nhật thông tin thành công');
            form.setFieldsValue(updatedValues);
        } catch (error) {
            message.error('Cập nhật thất bại, vui lòng thử lại');
            console.error('Error updating profile:', error);
        }
    };

    const DetailItem = ({ icon, label, value }) => (
        <Card
            bordered={false}
            className="detail-card-item"
            style={{ marginBottom: '12px', borderRadius: '8px', background: '#f9f9f9', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
        >
            <Space align="start">
                <div className="icon-container">{icon}</div>
                <div>
                    <Text type="secondary" style={{ fontSize: '13px' }}>{label}</Text>
                    <Paragraph strong style={{ margin: 0, fontSize: '15px' }}>{value || 'Chưa cập nhật'}</Paragraph>
                </div>
            </Space>
        </Card>
    );

    const renderPersonalInfoTab = () => (
        <Card bordered={false} className="profile-info-card">
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}><DetailItem icon={<UserOutlined style={{ fontSize: '18px', color: '#1890ff' }} />} label="Họ và tên" value={user.name} /></Col>
                <Col xs={24} md={12}><DetailItem icon={<DesktopOutlined style={{ fontSize: '18px', color: '#52c41a' }} />} label="Chức vụ" value={user.chucvu} /></Col>
                <Col xs={24} md={12}><DetailItem icon={<TeamOutlined style={{ fontSize: '18px', color: '#faad14' }} />} label="Khối / Phòng" value={user.bophan.toUpperCase()} /></Col>
                <Col xs={24} md={12}><DetailItem icon={<BankOutlined style={{ fontSize: '18px', color: '#eb2f96' }} />} label="Nhà hàng" value={user.chinhanh} /></Col>
                <Col xs={24} md={12}><DetailItem icon={<MailOutlined style={{ fontSize: '18px', color: '#722ed1' }} />} label="Email" value={user.showEmail ? user.email : '****'} /></Col>
                <Col xs={24} md={12}><DetailItem icon={<PhoneOutlined style={{ fontSize: '18px', color: '#13c2c2' }} />} label="Số điện thoại" value={user.showPhone ? user.phone : '****'} /></Col>
            </Row>
        </Card>
    );

    const renderSecurityTab = () => (
        <div className="security-tab-container">
            {/* Security Overview Card */}
            <Card
                bordered={false}
                className="security-overview-card"
                style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    marginBottom: '16px'
                }}
            >
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={16}>
                        <Space direction="vertical" size={4}>
                            <Title level={4} style={{ margin: 0 }}>
                                <SafetyOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                                Bảo mật tài khoản
                            </Title>
                            <Text type="secondary">
                                Bảo vệ tài khoản của bạn với xác thực đa yếu tố và cập nhật mật khẩu định kỳ
                            </Text>
                        </Space>
                    </Col>
                    <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                        <Steps progressDot current={1} direction="vertical" size="small" style={{ maxWidth: '200px', marginLeft: 'auto' }}>
                            <Step title="Mật khẩu" description="Đã thiết lập" />
                            <Step title="Email" description="Chưa xác thực" />
                            <Step title="Số điện thoại" description="Chưa xác thực" />
                        </Steps>
                    </Col>
                </Row>
            </Card>

            {/* Password Security Card */}
            <Card
                bordered={false}
                className="password-security-card"
                style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    marginBottom: '16px'
                }}
                title={
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div className="text-center">
                            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                                <PiShieldCheck style={{ fontSize: '24px', marginRight: '8px', color: 'red' }} />
                                Đổi Mật Khẩu
                            </Title>
                            <Text type="secondary">Cập nhật mật khẩu để bảo vệ tài khoản của bạn</Text>
                        </div>
                    </Space>
                }
            >
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <ChangePassword keys={user.keys} t={t} handleLogout={handleLogout} />
                </Space>
            </Card>

            {/* Contact Information Security Card */}
            <Card
                bordered={false}
                className="contact-security-card disabled-card"
                style={{
                    marginBottom: '16px',
                }}
                title={
                    <Space align="center">
                        <UserSwitchOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                        <Title level={4} style={{ margin: 0 }}>Thông tin liên hệ (Sớm cập nhật)</Title>
                    </Space>
                }
            >

                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Form layout="vertical" disabled={true}>
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Card
                                    className="verification-card"
                                    size="small"
                                    style={{
                                        borderRadius: '10px',
                                        backgroundColor: '#f6ffed',
                                        border: '1px solid #b7eb8f',
                                        marginBottom: '16px'
                                    }}
                                >
                                    <Space>
                                        <Badge status="processing" color="#52c41a" />
                                        <Text strong>Xác thực email & số điện thoại giúp bảo vệ tài khoản của bạn tốt hơn</Text>
                                    </Space>
                                </Card>

                                <Form.Item
                                    label={
                                        <Space>
                                            <MailOutlined style={{ color: '#ae8f3d' }} />
                                            <span>Email</span>
                                            {user.emailVerified ? (
                                                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                            ) : (
                                                <Tooltip title="Email chưa được xác thực">
                                                    <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                                                </Tooltip>
                                            )}
                                        </Space>
                                    }
                                    name="email"
                                >
                                    <Input
                                        placeholder="Nhập email"
                                        style={{ borderRadius: '8px' }}
                                        disabled={true}
                                        suffix={
                                            <Button
                                                type="link"
                                                size="small"
                                                style={{
                                                    padding: '0 4px',
                                                    fontSize: '12px'
                                                }}
                                                disabled={true}
                                            >
                                                {user.emailVerified ? 'Đã xác thực' : 'Xác thực ngay'}
                                            </Button>
                                        }
                                    />
                                </Form.Item>

                                <Form.Item
                                    label={
                                        <Space>
                                            <PhoneOutlined style={{ color: '#ae8f3d' }} />
                                            <span>Số điện thoại</span>
                                            {user.phoneVerified ? (
                                                <CheckCircleOutlined style={{ color: '#ae8f3d' }} />
                                            ) : (
                                                <Tooltip title="Số điện thoại chưa được xác thực">
                                                    <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                                                </Tooltip>
                                            )}
                                        </Space>
                                    }
                                    name="phone"
                                >
                                    <Input
                                        placeholder="Nhập số điện thoại"
                                        style={{ borderRadius: '8px' }}
                                        disabled={true}
                                        suffix={
                                            <Button
                                                type="link"
                                                size="small"
                                                style={{
                                                    padding: '0 4px',
                                                    fontSize: '12px'
                                                }}
                                                disabled={true}
                                            >
                                                {user.phoneVerified ? 'Đã xác thực' : 'Xác thực ngay'}
                                            </Button>
                                        }
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Card
                                    className="privacy-card"
                                    size='small'
                                    style={{
                                        borderRadius: '10px',
                                        backgroundColor: '#f0f7ff',
                                        border: '1px solid #bae0ff',
                                        marginBottom: '16px'
                                    }}
                                >
                                    <Space>
                                        <EyeOutlined style={{ color: '#1890ff' }} />
                                        <Text strong>Kiểm soát thông tin hiển thị với người dùng khác</Text>
                                    </Space>
                                </Card>

                                <Form.Item
                                    label={
                                        <Space>
                                            <MailOutlined style={{ color: '#ae8f3d' }} />
                                            <span>Hiển thị email</span>
                                        </Space>
                                    }
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text type="secondary">Cho phép người dùng khác xem email của bạn</Text>
                                        <Form.Item name="showEmail" valuePropName="checked" noStyle>
                                            <Switch
                                                disabled={true}
                                                checkedChildren={<EyeOutlined />}
                                                unCheckedChildren={<EyeInvisibleOutlined />}
                                            />
                                        </Form.Item>
                                    </div>
                                </Form.Item>

                                <Form.Item
                                    label={
                                        <Space>
                                            <PhoneOutlined style={{ color: '#ae8f3d' }} />
                                            <span>Hiển thị số điện thoại</span>
                                        </Space>
                                    }
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text type="secondary">Cho phép người dùng khác xem số điện thoại của bạn</Text>
                                        <Form.Item name="showPhone" valuePropName="checked" noStyle>
                                            <Switch
                                                disabled={true}
                                                checkedChildren={<EyeOutlined />}
                                                unCheckedChildren={<EyeInvisibleOutlined />}
                                            />
                                        </Form.Item>
                                    </div>
                                </Form.Item>

                                <Form.Item style={{ marginTop: '24px' }}>
                                    <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        block
                                        disabled={true}
                                        onClick={handleUpdateProfile}
                                    >
                                        Cập nhật thông tin
                                    </Button>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Space>
            </Card>

            <Card bordered={false} title={<Space align="center">
                <ScanOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                <Title level={4} style={{ margin: 0 }}>Thiết lập FaceID</Title>
            </Space>}>
                <Row>
                    <Col span={24}>
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            {user.faceID ? (
                                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                    <ScanOutlined style={{ fontSize: '64px', color: '#52c41a' }} />
                                    <Title level={4}>FaceID đã được thiết lập</Title>
                                    <Text type="secondary">Bạn đã thiết lập xác thực bằng khuôn mặt. Bạn có thể thiết lập lại nếu cần.</Text>
                                    <Button type="primary" icon={<EditOutlined />} onClick={openFaceIdModal} loading={permissionLoading} size="middle">Thiết lập lại FaceID</Button>
                                </Space>
                            ) : (
                                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                    <ScanOutlined style={{ fontSize: '64px', color: '#faad14' }} />
                                    <Title level={4}>Thiết lập FaceID</Title>
                                    <Text type="secondary">Bạn chưa thiết lập xác thực khuôn mặt. Thiết lập FaceID giúp bạn có thể thực hiện chấm công.</Text>
                                    <Button type="primary" icon={<ScanOutlined />} onClick={openFaceIdModal} loading={permissionLoading} size="middle">Thiết lập FaceID</Button>
                                </Space>
                            )}
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    );

    return (
        <div className="profile-container" style={{ padding: 16, backgroundColor: '#f0f2f5' }}>
            <title>NISO | {user.name}</title>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={24} md={24} lg={16} xl={16}>
                    <Card className="profile-cover-card" style={{ width: '100%', margin: '0 auto', overflow: 'hidden', borderRadius: 12 }}>
                        <div style={{ position: 'relative', marginBottom: 20 }}>
                            <div style={{ height: 300, width: '100%', backgroundImage: `url(${backgroundImg})`, backgroundColor: '#f0f2f5', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 8, position: 'relative' }}>
                                <Upload showUploadList={false} beforeUpload={handleBackgroundUpload}>
                                    <Button icon={<CameraOutlined />} style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 8, display: 'flex', alignItems: 'center' }} />
                                </Upload>
                            </div>
                            <div style={{ position: 'absolute', bottom: -48, left: 24, borderRadius: '50%', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
                                {user.imgAvatar && user.imgAvatar !== "null" ? (
                                    <div className="avatar avatar-x-large">
                                        <Image src={user.imgAvatar} alt={user.name} className='profile-img' preview={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        {user.name === 'Đặng Ngọc Quý' && user.phanquyen && <img src={Frame} alt="test" className="avatar-frame anim-spin" />}
                                    </div>
                                ) : (
                                    <div className="avatar avatar-x-large">
                                        <Avatars user={user} CssClassname="profile-img" sizeFont={80} />
                                        {user.name === 'Đặng Ngọc Quý' && user.phanquyen && <img src={Frame} alt="test" className="avatar-frame anim-spin" />}
                                    </div>
                                )}
                                <Button shape="circle" icon={<CameraOutlined />} size="middle" onClick={openModal} style={{ position: 'absolute', bottom: 1, right: 2, backgroundColor: 'white', border: '2px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)', zIndex: 1 }} />
                            </div>
                        </div>
                        <Row gutter={16} style={{ marginTop: 60, padding: '0 16px 16px' }}>
                            <Col span={24}>
                                <Space direction='vertical' align='start' size="small">
                                    <Title level={2} style={{ marginBottom: 8 }}>
                                        {window.innerWidth < 768 && user.name.length > 20 ? (
                                            <Tooltip title={user.name}><span style={{ position: 'relative', zIndex: 5 }}>{user.name.substring(0, 25)}...</span></Tooltip>
                                        ) : (
                                            <span>{user.name}</span>
                                        )}
                                        {window.innerWidth >= 768 && user.chinhanh && (
                                            <span style={{ textTransform: 'uppercase', fontSize: 18, color: '#8c8c8c', marginLeft: 8 }}>({user.chinhanh})</span>
                                        )}
                                    </Title>
                                    {window.innerWidth < 768 && user.phanquyen === false && user.chinhanh && (
                                        <span style={{ textTransform: 'uppercase', fontSize: 16, color: '#8c8c8c' }}>({user.chinhanh})</span>
                                    )}
                                    <Space size="small" wrap align="start">
                                        {user.chucvu && (
                                            <Tooltip title={user.chucvu}>
                                                <Tag color="blue" bordered={false} style={{ textTransform: 'uppercase', borderRadius: 4, padding: '2px 8px' }}>
                                                    {user.chucvu.length > 30 ? user.chucvu.substring(0, 30) + '...' : user.chucvu}
                                                </Tag>
                                            </Tooltip>
                                        )}

                                        {user.phanquyen === 'Xử lý yêu cầu' && (
                                            <Tag color="blue" bordered={false} style={{ borderRadius: 4, padding: '2px 8px' }}>Request Management</Tag>
                                        )}
                                        {user.phanquyen === 'IT asset' && (
                                            <Tag color="yellow" bordered={false} style={{ borderRadius: 4, padding: '2px 8px' }}>IT Asset Management</Tag>
                                        )}
                                        {user.bophan && (
                                            <Tag color="cyan" bordered={false} style={{ borderRadius: 4, padding: '2px 8px' }}><TeamOutlined /> {user.bophan.toUpperCase()}</Tag>
                                        )}
                                    </Space>
                                </Space>
                            </Col>
                        </Row>
                    </Card>

                    <Card bordered={false} className="profile-tabs-card" style={{ marginTop: 16, borderRadius: 12 }}>
                        <Tabs activeKey={activeTab} onChange={handleTabChange} type="card" size="small" className="profile-tabs">
                            <TabPane tab={<span className="tab-label"><UserOutlined /> Thông tin cá nhân</span>} key="1">
                                {renderPersonalInfoTab()}
                            </TabPane>
                            <TabPane tab={<span className="tab-label"><LockOutlined /> Bảo mật</span>} key="2">
                                {renderSecurityTab()}
                            </TabPane>
                        </Tabs>
                    </Card>
                </Col>

                <Col xs={24} sm={24} md={24} lg={8} xl={8}>
                    <Card title={<Space><TeamOutlined /><span>{t('Department.input141')}</span></Space>} style={{ borderRadius: 12, height: '100%' }} className="department-users-card" bodyStyle={{ padding: 0 }}>
                        {departmentUsers.length > 0 ? (
                            <List className="department-users-list" itemLayout="horizontal">
                                {departmentUsers.length > 0 ? (
                                    <div
                                        className="department-users-list-container"
                                        style={{
                                            padding: '16px',
                                            maxHeight: window.innerWidth < 768 ? '300px' : (document.querySelector('.profile-tabs-card')?.offsetHeight || 400),
                                            overflowY: 'auto'
                                        }}
                                        onScroll={(e) => {
                                            if (!hasMore || loading) return;
                                            const { scrollTop, scrollHeight, clientHeight } = e.target;
                                            if (scrollTop + clientHeight >= scrollHeight - 5) {
                                                setPage((prevPage) => prevPage + 1);
                                            }
                                        }}
                                    >
                                        <List
                                            className="department-users-list"
                                            itemLayout="horizontal"
                                            dataSource={departmentUsers}
                                            renderItem={(item) => (
                                                <List.Item
                                                    key={item.keys}
                                                    onClick={() => handleUserClick(item)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s',
                                                        borderRadius: 12,
                                                        padding: '12px 16px',
                                                        marginBottom: 12,
                                                        backgroundColor: '#fafafa',
                                                        border: '1px solid #f0f0f0',
                                                        boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                    className="department-user-item"
                                                >
                                                    {isNewUser(item.date) && (
                                                        <div style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#52c41a', color: 'white', padding: '2px 8px', fontSize: '10px', fontWeight: 'bold', borderBottomLeftRadius: 8 }}>NEW</div>
                                                    )}
                                                    <List.Item.Meta
                                                        avatar={
                                                            <div style={{ position: 'relative' }}>
                                                                {item.imgAvatar && item.imgAvatar !== "null" ? (
                                                                    <div className="avatar avatar-x-large">
                                                                        <Avatar src={item.imgAvatar} size='large' style={{ border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                                                                        {item.name === 'Đặng Ngọc Quý' && <img src={Frame} alt="test" className="avatar-frame anim-spin" />}
                                                                    </div>
                                                                ) : (
                                                                    <div className="avatar avatar-x-large">
                                                                        <Avatars user={item} sizeFont='large' cssStyle={{ border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                                                                        {item.name === 'Đặng Ngọc Quý' && <img src={Frame} alt="test" className="avatar-frame anim-spin" />}
                                                                    </div>
                                                                )}
                                                                {item.phanquyen === true && (
                                                                    <div style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#f5222d', borderRadius: '50%', width: 14, height: 14, border: '2px solid white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                        <SettingOutlined style={{ color: 'white', fontSize: 8 }} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        }
                                                        title={<div style={{ marginBottom: 4 }}><Text strong style={{ fontSize: 15 }}>{item.name}</Text></div>}
                                                        description={
                                                            <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                                                <Space wrap size={4}>
                                                                    {item.chucvu && (
                                                                        <Tag color="blue" bordered={false} style={{ borderRadius: 4, padding: '0 6px', fontSize: 11, lineHeight: '18px', marginRight: 0 }}>
                                                                            {item.chucvu.length > 20 ? item.chucvu.substring(0, 20) + '...' : item.chucvu}
                                                                        </Tag>
                                                                    )}
                                                                    {item.bophan && (
                                                                        <Tag color="cyan" bordered={false} style={{ borderRadius: 4, padding: '0 6px', fontSize: 11, lineHeight: '18px', marginRight: 0 }}>{item.bophan.toUpperCase()}</Tag>
                                                                    )}
                                                                </Space>
                                                            </Space>
                                                        }
                                                    />
                                                </List.Item>
                                            )}
                                        />
                                        {loading && (
                                            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                                <Spin tip="Đang tải thêm..." size='small' />
                                            </div>
                                        )}
                                    </div>
                                ) : loading ? (
                                    <div style={{ padding: '20px' }}>
                                        <Skeleton active avatar paragraph={{ rows: 2 }} />
                                        <Skeleton active avatar paragraph={{ rows: 2 }} />
                                        <Skeleton active avatar paragraph={{ rows: 2 }} />
                                    </div>
                                ) : (
                                    <Empty description="Không có dữ liệu liên quan." />
                                )}
                            </List>
                        ) : loading ? (
                            <div style={{ padding: '20px' }}>
                                <Skeleton active avatar paragraph={{ rows: 2 }} />
                                <Skeleton active avatar paragraph={{ rows: 2 }} />
                                <Skeleton active avatar paragraph={{ rows: 2 }} />
                            </div>
                        ) : (
                            <Empty description="Không có dữ liệu liên quan." />
                        )}
                    </Card>
                </Col>
            </Row>

            <Modal title={t('Notifications.input1')} visible={isModalVisible} onCancel={closeModal} footer={null}>
                <Firebase message={message} t={t} user={user} Frame={Frame} />
            </Modal>

            <UserProfileModal visible={isUserProfileModalVisible} onCancel={() => setIsUserProfileModalVisible(false)} user={user} Frame={Frame} userData={selectedUser} t={t} />

            <Faceid user={user} onClose={handleCloseFaceIdModal} isFaceIdModalVisible={isFaceIdModalVisible} handleCloseFaceIdModal={handleCloseFaceIdModal} isModalVisible={isFaceIdModalVisible} />
            <Modal
                title="Xác thực Email"
                visible={isEmailOtpModalVisible}
                onCancel={() => setIsEmailOtpModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsEmailOtpModalVisible(false)}>
                        Hủy
                    </Button>,
                    <Button key="verify" type="primary" onClick={() => verifyOtp('email')}>
                        Xác thực
                    </Button>
                ]}
            >
                <div style={{ padding: '10px 0' }}>
                    <Alert
                        message="Email xác thực đã được gửi"
                        description={`Chúng tôi đã gửi email xác thực đến ${emailToVerify}. Vui lòng kiểm tra hộp thư của bạn và nhấn vào liên kết xác thực.`}
                        type="info"
                        showIcon
                        style={{ marginBottom: '15px' }}
                    />
                    <Text>Sau khi xác thực email, nhấn nút "Xác thực" để hoàn tất quá trình.</Text>
                </div>
            </Modal>

            <Modal
                title="Xác thực Số Điện Thoại"
                visible={isPhoneOtpModalVisible}
                onCancel={() => setIsPhoneOtpModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsPhoneOtpModalVisible(false)}>
                        Hủy
                    </Button>,
                    <Button
                        key="verify"
                        type="primary"
                        onClick={() => verifyOtp('phone')}
                        disabled={!otp}
                    >
                        Xác thực
                    </Button>
                ]}
            >
                <Form layout="vertical">
                    <Form.Item
                        label="Nhập mã OTP được gửi đến số điện thoại của bạn"
                        extra="Mã OTP có hiệu lực trong 5 phút"
                    >
                        <Input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Nhập mã OTP"
                            maxLength={6}
                            style={{ fontSize: '16px', letterSpacing: '4px' }}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
});

export default Profile;