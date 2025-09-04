import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { debounce } from 'lodash';
import {
    Drawer,
    Divider,
    Upload,
    Row,
    Col,
    Card,
    message,
    Typography,
    Space,
    Button,
    Badge,
    Tooltip,
    Spin,
    Progress
} from 'antd';
import {
    InboxOutlined,
    PictureOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { imageDb } from '../../../config';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// Import tất cả các background
import bg1 from '../../../assets/QuizBackground/1.webp';
import bg2 from '../../../assets/QuizBackground/2.webp';
import bg3 from '../../../assets/QuizBackground/3.webp';
import bg4 from '../../../assets/QuizBackground/4.webp';
import bg5 from '../../../assets/QuizBackground/5.webp';
import bg6 from '../../../assets/QuizBackground/6.webp';
import bg7 from '../../../assets/QuizBackground/7.webp';
import bg8 from '../../../assets/QuizBackground/8.webp';
import bg9 from '../../../assets/QuizBackground/9.webp';
import bg10 from '../../../assets/QuizBackground/10.webp';
import bg11 from '../../../assets/QuizBackground/11.webp';
import bg12 from '../../../assets/QuizBackground/12.jpg';
import bg13 from '../../../assets/QuizBackground/13.webp';
import bg14 from '../../../assets/QuizBackground/14.webp';
import bg15 from '../../../assets/QuizBackground/15.webp';
import bg16 from '../../../assets/QuizBackground/16.webp';
import bg17 from '../../../assets/QuizBackground/17.svg';
import bg18 from '../../../assets/QuizBackground/18.svg';
import bg20 from '../../../assets/QuizBackground/19.webp';
import bg19 from '../../../assets/Web_Thanh Nien.svg';

const { Dragger } = Upload;
const { Text } = Typography;

const BackgroundQuiz = ({ visible, onClose, onSelectBackground }) => {
    const [tempSelectedBg, setTempSelectedBg] = useState({ src: bg20, id: 20 });
    const [loadingImages, setLoadingImages] = useState({});
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [customBackgrounds, setCustomBackgrounds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);

    // Thêm useEffect để lấy danh sách hình ảnh đã tải lên
    useEffect(() => {
        const fetchCustomBackgrounds = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/quizzes/custom-backgrounds', {
                    headers: {
                        'Authorization': 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME),
                        'Content-Type': 'application/json',
                    }
                });
                if (response.data.success) {
                    setCustomBackgrounds(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching custom backgrounds:', error);
                message.error('Không thể tải danh sách hình ảnh đã tải lên');
            } finally {
                setLoading(false);
            }
        };

        if (visible) {
            fetchCustomBackgrounds();
        }
    }, [visible]);

    const backgrounds = [
        { id: 20, src: bg20, name: 'Runam', category: 'Niso' },
        { id: 17, src: bg17, name: 'Ciao Cafe', category: 'Niso' },
        { id: 18, src: bg18, name: 'Goody +', category: 'Niso' },
        { id: 19, src: bg19, name: 'Nhà hàng Thanh niên', category: 'Niso' },
        { id: 1, src: bg1, name: 'Standard', category: 'basic' },
        { id: 2, src: bg2, name: 'Spring', category: 'seasonal' },
        { id: 3, src: bg3, name: 'Summer', category: 'seasonal' },
        { id: 4, src: bg4, name: 'Autumn', category: 'seasonal' },
        { id: 5, src: bg5, name: 'Winter', category: 'seasonal' },
        { id: 6, src: bg6, name: 'Support Ukraine', category: 'special' },
        { id: 7, src: bg7, name: 'Skyscrapers', category: 'urban' },
        { id: 8, src: bg8, name: 'Technology', category: 'modern' },
        { id: 9, src: bg9, name: 'Dark', category: 'dark' },
        { id: 10, src: bg10, name: 'Dark Blue', category: 'dark' },
        { id: 11, src: bg11, name: 'Year of the Rabbit', category: 'festival' },
        { id: 12, src: bg12, name: 'Santa Claus', category: 'festival' },
        { id: 13, src: bg13, name: 'St. Patrick\'s Day', category: 'festival' },
        { id: 14, src: bg14, name: 'Halloween', category: 'festival' },
        { id: 15, src: bg15, name: 'Black History Month', category: 'special' },
        { id: 16, src: bg16, name: 'Holiday Cheer', category: 'festival' },
    ];

    const debouncedSetTempBg = useCallback(
        (bgSrc, bgId) => {
            setTempSelectedBg({ src: bgSrc, id: bgId });
        },
        [setTempSelectedBg]
    );

    const debouncedHandleBackgroundSelect = useMemo(
        () => debounce(debouncedSetTempBg, 300),
        [debouncedSetTempBg]
    );

    const handleBackgroundSelect = (bgSrc, bgId) => {
        debouncedHandleBackgroundSelect(bgSrc, bgId);
    };

    const debouncedApplyBg = useCallback(
        async () => {
            if (tempSelectedBg) {
                try {
                    setApplying(true);
                    await onSelectBackground(tempSelectedBg.src);
                    onClose();
                } finally {
                    setApplying(false);
                }
            }
        },
        [tempSelectedBg, onSelectBackground, onClose]
    );

    const debouncedHandleApplyBackground = useMemo(
        () => debounce(debouncedApplyBg, 300),
        [debouncedApplyBg]
    );

    const handleApplyBackground = () => {
        debouncedHandleApplyBackground();
    };

    const handleImageLoad = (id) => {
        setLoadingImages(prev => ({
            ...prev,
            [id]: false
        }));
    };

    const uploadProps = {
        name: 'background',
        multiple: false,
        accept: '.jpg,.jpeg,.png,.webp',
        showUploadList: false,
        beforeUpload: (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('Chỉ có thể tải lên file ảnh!');
                return false;
            }
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                message.error('File phải nhỏ hơn 10MB!');
                return false;
            }
            return true;
        },
        customRequest: async ({ file, onSuccess, onError }) => {
            try {
                setIsUploading(true);
                const storageRef = ref(imageDb, `quiz_backgrounds/${uuidv4()}`);
                const uploadTask = uploadBytesResumable(storageRef, file);

                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadProgress(progress);
                    },
                    (error) => {
                        console.error('Upload error:', error);
                        message.error('Tải lên thất bại');
                        onError(error);
                        setIsUploading(false);
                    },
                    async () => {
                        try {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            
                            // Lưu thông tin background vào database
                            const response = await axios.post('/api/quizzes/background', {
                                url: downloadURL,
                                name: 'Ảnh tùy chỉnh',
                                category: 'custom'
                            }, {
                                headers: {
                                    'Authorization': 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME),
                                    'Content-Type': 'application/json',
                                }
                            });

                            if (response.data.success) {
                                const newBackground = {
                                    id: response.data.data.id,
                                    src: downloadURL,
                                    name: 'Ảnh tùy chỉnh',
                                    category: 'custom'
                                };
                                setTempSelectedBg(newBackground);
                                message.success('Tải lên thành công');
                                onSuccess();
                            } else {
                                throw new Error(response.data.message);
                            }
                        } catch (error) {
                            console.error('Error saving background:', error);
                            message.error('Lưu thông tin background thất bại');
                            onError(error);
                        } finally {
                            setIsUploading(false);
                            setUploadProgress(0);
                        }
                    }
                );
            } catch (error) {
                console.error('Upload error:', error);
                message.error('Tải lên thất bại');
                onError(error);
                setIsUploading(false);
            }
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Niso': '#ae8f3d',
            'basic': '#18b3c5',
            'seasonal': '#52c41a',
            'special': '#fa541c',
            'urban': '#722ed1',
            'modern': '#13c2c2',
            'dark': '#595959',
            'festival': '#eb2f96'
        };
        return colors[category] || '#ae8f3d';
    };

    return (
        <Drawer
            closeIcon={null}
            title={
                <Space>
                    <PictureOutlined />
                    <span>Tùy chỉnh giao diện</span>
                </Space>
            }
            placement="right"
            onClose={onClose}
            open={visible}
            width={480}
            styles={{
                body: { padding: '24px' }
            }}
            footer={
                <div style={{ textAlign: 'right' }}>
                    <Space>
                        <Button onClick={onClose}>
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleApplyBackground}
                            disabled={!tempSelectedBg || applying}
                            loading={applying}
                        >
                            Áp dụng
                        </Button>
                    </Space>
                </div>
            }
        >
            {/* Upload Section */}
            <div style={{ marginBottom: 32 }}>
                <Dragger
                    {...uploadProps}
                    style={{
                        backgroundColor: '#fafafa',
                        border: '2px dashed #d9d9d9',
                        borderRadius: '8px'
                    }}
                    disabled={isUploading}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ fontSize: '48px', color: '#ae8f3d' }} />
                    </p>
                    <p className="ant-upload-text" style={{ fontSize: '16px', fontWeight: 500 }}>
                        {isUploading ? 'Đang tải lên...' : 'Nhấp hoặc kéo thả file vào đây'}
                    </p>
                    <p className="ant-upload-hint" style={{ color: '#8c8c8c' }}>
                        Hỗ trợ: JPG, JPEG, PNG, WEBP (Tối đa 10MB)
                    </p>
                    {isUploading && (
                        <Progress 
                            percent={Math.round(uploadProgress)} 
                            status="active"
                            style={{ marginTop: 16 }}
                        />
                    )}
                </Dragger>
            </div>

            {/* Custom Backgrounds Section */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin size="small" />
                    <p style={{ marginTop: '10px', color: '#8c8c8c' }}>Đang tải danh sách hình ảnh...</p>
                </div>
            ) : customBackgrounds.length > 0 && (
                <>
                    <Divider style={{ margin: '32px 0', borderColor: '#e8e8e8' }}>
                        <Text strong style={{ color: '#595959', fontSize: '16px' }}>
                            Hình ảnh đã tải lên
                        </Text>
                    </Divider>

                    <Row gutter={[16, 16]}>
                        {customBackgrounds.map((bg) => (
                            <Col span={12} key={bg.id}>
                                <Badge.Ribbon
                                    text="Tùy chỉnh"
                                    color="#ae8f3d"
                                    style={{ fontSize: '10px' }}
                                >
                                    <Card
                                        hoverable
                                        cover={
                                            <div style={{
                                                position: 'relative',
                                                height: '120px',
                                                overflow: 'hidden',
                                                borderRadius: '8px 8px 0 0'
                                            }}>
                                                {loadingImages[bg.id] !== false && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: '#fafafa'
                                                    }}>
                                                        <Spin size="small" />
                                                    </div>
                                                )}
                                                <img
                                                    alt={bg.name}
                                                    src={bg.url}
                                                    onLoad={() => handleImageLoad(bg.id)}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        transition: 'transform 0.3s ease',
                                                        opacity: loadingImages[bg.id] === false ? 1 : 0
                                                    }}
                                                />
                                                {tempSelectedBg?.id === bg.id && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <CheckCircleOutlined
                                                            style={{
                                                                fontSize: '32px',
                                                                color: '#ae8f3d'
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        }
                                        onClick={() => handleBackgroundSelect(bg.url, bg.id)}
                                        style={{
                                            cursor: 'pointer',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: tempSelectedBg?.id === bg.id ? '2px solid #ae8f3d' : '2px solid transparent',
                                            transition: 'all 0.3s ease'
                                        }}
                                        styles={{
                                            body: {
                                                padding: '12px',
                                                textAlign: 'center'
                                            }
                                        }}
                                    >
                                        <Tooltip title={`Chọn giao diện ${bg.name}`}>
                                            <Text strong style={{
                                                fontSize: '13px',
                                                color: tempSelectedBg?.id === bg.id ? '#ae8f3d' : '#595959'
                                            }}>
                                                {bg.name}
                                            </Text>
                                        </Tooltip>
                                    </Card>
                                </Badge.Ribbon>
                            </Col>
                        ))}
                    </Row>
                </>
            )}

            <Divider style={{ margin: '32px 0', borderColor: '#e8e8e8' }}>
                <Text strong style={{ color: '#595959', fontSize: '16px' }}>
                    Giao diện có sẵn
                </Text>
            </Divider>

            {/* Background Grid */}
            <Row gutter={[16, 16]}>
                {backgrounds.map((bg) => (
                    <Col span={12} key={bg.id}>
                        <Badge.Ribbon
                            text={bg.category.charAt(0).toUpperCase() + bg.category.slice(1)}
                            color={getCategoryColor(bg.category)}
                            style={{ fontSize: '10px' }}
                        >
                            <Card
                                hoverable
                                cover={
                                    <div style={{
                                        position: 'relative',
                                        height: '120px',
                                        overflow: 'hidden',
                                        borderRadius: '8px 8px 0 0'
                                    }}>
                                        {loadingImages[bg.id] !== false && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: '#fafafa'
                                            }}>
                                                <Spin size="small" />
                                            </div>
                                        )}
                                        <img
                                            alt={`Background ${bg.id}`}
                                            src={bg.src}
                                            onLoad={() => handleImageLoad(bg.id)}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.3s ease',
                                                opacity: loadingImages[bg.id] === false ? 1 : 0
                                            }}
                                        />
                                        {tempSelectedBg?.id === bg.id && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <CheckCircleOutlined
                                                    style={{
                                                        fontSize: '32px',
                                                        color: '#ae8f3d'
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                }
                                onClick={() => handleBackgroundSelect(bg.src, bg.id)}
                                style={{
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: tempSelectedBg?.id === bg.id ? '2px solid #ae8f3d' : '2px solid transparent',
                                    transition: 'all 0.3s ease'
                                }}
                                styles={{
                                    body: {
                                        padding: '12px',
                                        textAlign: 'center'
                                    }
                                }}
                            >
                                <Tooltip title={`Chọn giao diện ${bg.name}`}>
                                    <Text strong style={{
                                        fontSize: '13px',
                                        color: tempSelectedBg?.id === bg.id ? '#ae8f3d' : '#595959'
                                    }}>
                                        {bg.name}
                                    </Text>
                                </Tooltip>
                            </Card>
                        </Badge.Ribbon>
                    </Col>
                ))}
            </Row>
        </Drawer>
    );
};

export default BackgroundQuiz;