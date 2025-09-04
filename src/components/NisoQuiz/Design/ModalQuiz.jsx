import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Spin, Menu, Card, Row, Col, Typography, Space, Upload, message, Tabs } from 'antd';
import { SearchOutlined, FireOutlined, StarOutlined, PlayCircleOutlined, UploadOutlined, InboxOutlined } from '@ant-design/icons';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { imageDb } from '../../../config';

const { Text } = Typography;
const { Dragger } = Upload;

function ModalQuiz({
    isModalVisible,
    selectedMenu,
    searchTerm,
    giphyResults,
    loading,
    youtubeUrl,
    youtubeResults,
    handleOk,
    handleCancel,
    handleSearch,
    handleMenuSelect,
    handleSelectGiphy,
    handleYouTubeSearch,
    setYoutubeUrl,
    hideVideo = false,
    fileList,
    onUploadComplete
}) {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setScreenWidth(width);
            setIsMobile(width < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Tính toán responsive layout
    const getResponsiveLayout = () => {
        if (screenWidth >= 1200) {
            return { menuSpan: 5, contentSpan: 19, modalWidth: 1200 };
        } else if (screenWidth >= 992) {
            return { menuSpan: 6, contentSpan: 18, modalWidth: 1000 };
        } else if (screenWidth >= 768) {
            return { menuSpan: 7, contentSpan: 17, modalWidth: 900 };
        } else {
            return { menuSpan: 24, contentSpan: 24, modalWidth: '95%' };
        }
    };

    const { menuSpan, contentSpan, modalWidth } = getResponsiveLayout();

    // Tính toán grid responsive
    const getContentGridProps = () => {
        if (isMobile) {
            return { xs: 12, sm: 12 }; // 2 cột trên mobile
        }
        if (screenWidth >= 1400) {
            return { xs: 24, sm: 12, md: 8, lg: 6, xl: 4, xxl: 4 };
        } else if (screenWidth >= 1200) {
            return { xs: 24, sm: 12, md: 8, lg: 6, xl: 6 };
        } else if (screenWidth >= 992) {
            return { xs: 24, sm: 12, md: 12, lg: 8 };
        } else {
            return { xs: 24, sm: 12, md: 12 };
        }
    };

    const gridProps = getContentGridProps();

    // Chiều cao card đồng nhất
    const getCardHeight = () => {
        if (isMobile) {
            return '150px';
        } else if (screenWidth < 992) {
            return '180px';
        } else {
            return '200px';
        }
    };

    const cardHeight = getCardHeight();

    // Kích thước ảnh thumb
    const getThumbnailStyle = () => ({
        width: '100%',
        height: cardHeight,
        objectFit: 'cover',
        display: 'block',
        borderRadius: isMobile ? '8px 8px 0 0' : '8px 8px 0 0'
    });

    const menuItems = [
        {
            key: 'gif-section',
            label: 'Ảnh động',
            type: 'group',
            children: [
                {
                    key: 'trending',
                    label: 'Thịnh hành',
                    icon: <FireOutlined />,
                },
                {
                    key: 'stickers',
                    label: 'Sticker',
                    icon: <StarOutlined />,
                },
            ],
        },
        ...(hideVideo ? [] : [{
            key: 'video-section',
            label: 'Video',
            type: 'group',
            children: [
                {
                    key: 'youtube',
                    label: 'YouTube',
                    icon: <PlayCircleOutlined />,
                },
            ],
        }]),
        {
            key: 'upload-section',
            label: 'Tải lên',
            type: 'group',
            children: [
                {
                    key: 'upload',
                    label: 'Tải phương tiện lên',
                    icon: <UploadOutlined />,
                },
            ],
        }
    ];

    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            message.error('Chỉ có thể tải lên file ảnh hoặc video!');
            return false;
        }

        const isLt50M = file.size / 1024 / 1024 < 50;
        if (!isLt50M) {
            message.error('File phải nhỏ hơn 50MB!');
            return false;
        }

        return true;
    };

    const handleUploadChange = (info) => {
        const { fileList: newFileList } = info;
        const validFiles = newFileList.filter(file => {
            if (file.status === 'error') {
                message.error(`${file.name} tải lên thất bại.`);
                return false;
            }
            return true;
        });

        setUploadedFiles(validFiles);

        validFiles.forEach(file => {
            if (file.status === 'done' || file.originFileObj) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const uploadedItem = {
                        id: file.uid,
                        url: e.target.result,
                        title: file.name,
                        type: file.type.startsWith('image/') ? 'image' : 'video',
                        size: file.size,
                        file: file.originFileObj || file
                    };

                    if (onUploadComplete) {
                        onUploadComplete(uploadedItem);
                    }
                };
                reader.readAsDataURL(file.originFileObj || file);
            }
        });
    };

    const customUpload = async ({ file, onSuccess, onError }) => {
        setUploadLoading(true);
        try {
            // Tạo reference đến Firebase Storage
            const storageRef = ref(imageDb, `quiz-images/${Date.now()}_${file.name}`);
            
            // Upload file
            const snapshot = await uploadBytes(storageRef, file);
            
            // Lấy URL download
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Cập nhật file với URL mới
            file.url = downloadURL;
            
            onSuccess("ok");
            message.success(`${file.name} tải lên thành công.`);
        } catch (error) {
            console.error('Error uploading file:', error);
            onError(error);
            message.error(`Lỗi khi tải lên ${file.name}`);
        } finally {
            setUploadLoading(false);
        }
    };

    // Render Upload Section
    const renderUploadContent = () => (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
                <Text strong style={{ fontSize: isMobile ? '14px' : '16px' }}>
                    Tải lên phương tiện
                </Text>
                <Text type="secondary" style={{ display: 'block', fontSize: isMobile ? '12px' : '14px', marginTop: '4px' }}>
                    Hỗ trợ ảnh (JPG, PNG, GIF) và video (MP4). Tối đa: 50MB
                </Text>
            </div>

            <Dragger
                name="file"
                multiple
                customRequest={customUpload}
                beforeUpload={beforeUpload}
                onChange={handleUploadChange}
                accept="image/*,video/*"
                fileList={uploadedFiles}
                style={{
                    background: '#fafafa',
                    border: '2px dashed #d9d9d9',
                    borderRadius: '8px',
                    padding: isMobile ? '12px 8px' : '24px 16px'
                }}
                disabled={uploadLoading}
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ fontSize: isMobile ? '32px' : '48px', color: '#ae8f3d' }} />
                </p>
                <p className="ant-upload-text" style={{
                    fontSize: isMobile ? '14px' : '16px',
                    margin: isMobile ? '4px 0' : '8px 0'
                }}>
                    {uploadLoading ? 'Đang tải lên...' : 'Nhấn hoặc kéo thả file'}
                </p>
            </Dragger>

            {uploadedFiles.length > 0 && (
                <div>
                    <Text strong style={{ fontSize: isMobile ? '13px' : '14px' }}>
                        Files đã tải lên:
                    </Text>
                    <div style={{
                        maxHeight: isMobile ? 'calc(100vh - 300px)' : '400px',
                        overflowY: 'auto',
                        marginTop: '8px'
                    }}>
                        <Row gutter={[8, 8]}>
                            {uploadedFiles.map((file) => (
                                <Col {...gridProps} key={file.uid}>
                                    <Card
                                        hoverable
                                        size="small"
                                        cover={
                                            <div style={{
                                                height: cardHeight,
                                                position: 'relative',
                                                overflow: 'hidden',
                                                background: '#f8f9fa'
                                            }}>
                                                {file.type.startsWith('image/') ? (
                                                    <img
                                                        alt={file.name}
                                                        src={file.url || file.thumbUrl}
                                                        style={getThumbnailStyle()}
                                                    />
                                                ) : (
                                                    <div style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: '#f0f2f5'
                                                    }}>
                                                        <PlayCircleOutlined style={{
                                                            fontSize: isMobile ? '24px' : '32px',
                                                            color: '#ae8f3d'
                                                        }} />
                                                    </div>
                                                )}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '4px',
                                                    right: '4px',
                                                    background: 'rgba(0,0,0,0.7)',
                                                    color: 'white',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: isMobile ? '10px' : '11px'
                                                }}>
                                                    {(file.size / 1024 / 1024).toFixed(1)}MB
                                                </div>
                                            </div>
                                        }
                                        onClick={() => file.status === 'done' && handleSelectGiphy({
                                            id: file.uid,
                                            url: file.url || file.thumbUrl,
                                            title: file.name,
                                            type: file.type.startsWith('image/') ? 'image' : 'video'
                                        })}
                                        style={{
                                            border: fileList.some(item => item.uid === file.uid) 
                                                ? '1px solid #ae8f3d' 
                                                : '1px solid #f0f0f0',
                                            borderRadius: '8px',
                                            height: '100%'
                                        }}
                                        bodyStyle={{ 
                                            padding: isMobile ? '8px' : '12px',
                                            height: isMobile ? '60px' : 'auto'
                                        }}
                                    >
                                        <Card.Meta
                                            title={
                                                <Text 
                                                    ellipsis 
                                                    style={{ 
                                                        fontSize: isMobile ? '12px' : '13px',
                                                        lineHeight: 1.2
                                                    }}
                                                >
                                                    {file.name}
                                                </Text>
                                            }
                                            description={
                                                <Text 
                                                    type="secondary" 
                                                    style={{ 
                                                        fontSize: isMobile ? '10px' : '11px',
                                                        display: 'block'
                                                    }}
                                                >
                                                    {file.type.split('/')[0]}
                                                </Text>
                                            }
                                        />
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </div>
            )}
        </Space>
    );

    // Render YouTube Section
    const renderYouTubeContent = () => (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space.Compact style={{ width: '100%' }}>
                <Input
                    placeholder="Nhập link YouTube..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    onPressEnter={handleYouTubeSearch}
                    style={{ fontSize: isMobile ? '13px' : '14px' }}
                />
                <Button
                    type="primary"
                    onClick={handleYouTubeSearch}
                    icon={<SearchOutlined />}
                >
                    {isMobile ? 'Tìm' : 'Tìm kiếm'}
                </Button>
            </Space.Compact>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin size="small" />
                </div>
            ) : youtubeResults.length > 0 ? (
                <div style={{
                    maxHeight: isMobile ? 'calc(100vh - 200px)' : '400px',
                    overflowY: 'auto'
                }}>
                    <Row gutter={[8, 8]}>
                        {youtubeResults.map((video) => (
                            <Col {...gridProps} key={video.id}>
                                <Card
                                    hoverable
                                    cover={
                                        <div style={{
                                            height: cardHeight,
                                            position: 'relative'
                                        }}>
                                            <img
                                                alt={video.title}
                                                src={video.thumbnail}
                                                style={getThumbnailStyle()}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                background: 'rgba(0,0,0,0.7)',
                                                borderRadius: '50%',
                                                width: isMobile ? '36px' : '48px',
                                                height: isMobile ? '36px' : '48px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <PlayCircleOutlined style={{
                                                    fontSize: isMobile ? '16px' : '20px',
                                                    color: 'white'
                                                }} />
                                            </div>
                                        </div>
                                    }
                                    onClick={() => handleSelectGiphy(video)}
                                    style={{
                                        border: fileList.some(f => f.uid === video.id) 
                                            ? '1px solid #ae8f3d' 
                                            : '1px solid #f0f0f0',
                                        borderRadius: '8px',
                                        height: '100%'
                                    }}
                                    bodyStyle={{ padding: isMobile ? '8px' : '12px' }}
                                >
                                    <Card.Meta
                                        title={
                                            <Text 
                                                ellipsis 
                                                style={{ 
                                                    fontSize: isMobile ? '12px' : '13px',
                                                    fontWeight: 500
                                                }}
                                            >
                                                {video.title}
                                            </Text>
                                        }
                                        description={
                                            <Text 
                                                type="secondary" 
                                                style={{ fontSize: isMobile ? '10px' : '11px' }}
                                            >
                                                YouTube Video
                                            </Text>
                                        }
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text type="secondary">Nhập link YouTube để tìm kiếm</Text>
                </div>
            )}
        </Space>
    );

    // Render Giphy Section
    const renderGiphyContent = () => (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Input
                placeholder={`Tìm kiếm ${selectedMenu === 'stickers' ? 'sticker' : 'GIF'}...`}
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={handleSearch}
                style={{ fontSize: isMobile ? '13px' : '14px' }}
            />

            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin size="small" />
                </div>
            ) : giphyResults.length > 0 ? (
                <div style={{
                    maxHeight: isMobile ? 'calc(100vh - 180px)' : '400px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '0 4px'
                }}>
                    <Row gutter={[8, 8]}>
                        {giphyResults.map((item) => (
                            <Col {...gridProps} key={item.id}>
                                <Card
                                    hoverable
                                    cover={
                                        <div style={{
                                            height: cardHeight,
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            <img
                                                alt={item.title || 'GIF'}
                                                src={item.url}
                                                style={getThumbnailStyle()}
                                            />
                                            {fileList.some(f => f.uid === item.id) && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '4px',
                                                    left: '4px',
                                                    background: '#ae8f3d',
                                                    color: 'white',
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    ✓
                                                </div>
                                            )}
                                        </div>
                                    }
                                    onClick={() => handleSelectGiphy(item)}
                                    style={{
                                        border: fileList.some(f => f.uid === item.id) 
                                            ? '1px solid #ae8f3d' 
                                            : '1px solid #f0f0f0',
                                        borderRadius: '8px',
                                        height: '100%'
                                    }}
                                    bodyStyle={{ padding: isMobile ? '8px' : '12px' }}
                                >
                                    <Card.Meta
                                        description={
                                            <Text 
                                                type="secondary" 
                                                style={{ fontSize: isMobile ? '10px' : '11px' }}
                                            >
                                                {item.title || (selectedMenu === 'stickers' ? 'Sticker' : 'GIF Animation')}
                                            </Text>
                                        }
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text type="secondary">
                        Không tìm thấy {selectedMenu === 'stickers' ? 'sticker' : 'GIF'}. Vui lòng thử lại!
                    </Text>
                </div>
            )}
        </Space>
    );

    const renderContent = () => {
        if (selectedMenu === 'upload') return renderUploadContent();
        if (selectedMenu === 'youtube') return renderYouTubeContent();
        return renderGiphyContent();
    };

    // Tạo items cho Tabs mobile
    const getTabItems = () => {
        const items = [
            {
                key: 'trending',
                label: 'GIF',
                children: (
                    <div style={{ height: '100%', overflowY: 'auto' }}>
                        {renderGiphyContent()}
                    </div>
                ),
            },
            {
                key: 'stickers',
                label: 'Sticker',
                children: (
                    <div style={{ height: '100%', overflowY: 'auto' }}>
                        {renderGiphyContent()}
                    </div>
                ),
            }
        ];

        if (!hideVideo) {
            items.push({
                key: 'youtube',
                label: 'Video',
                children: (
                    <div style={{ height: '100%', overflowY: 'auto' }}>
                        {renderYouTubeContent()}
                    </div>
                ),
            });
        }

        items.push({
            key: 'upload',
            label: 'Tải lên',
            children: (
                <div style={{ height: '100%', overflowY: 'auto' }}>
                    {renderUploadContent()}
                </div>
            ),
        });

        return items;
    };

    return (
        <Modal
            title="Chọn hình ảnh và video"
            open={isModalVisible}
            onOk={handleOk}
            onCancel={handleCancel}
            width={modalWidth}
            okText="Xác nhận"
            cancelText="Hủy"
            centered={true}
            bodyStyle={{
                padding: isMobile ? '8px' : '0',
                height: isMobile ? 'calc(100vh - 120px)' : '500px',
                minHeight: isMobile ? '300px' : '500px',
                overflow: 'hidden'
            }}
            style={{
                top: isMobile ? '10px' : null,
                maxWidth: isMobile ? 'calc(100vw - 20px)' : null
            }}
        >
            {isMobile ? (
                <Tabs
                    activeKey={selectedMenu}
                    onChange={(key) => {
                        handleMenuSelect({ key }); // Đảm bảo cập nhật selectedMenu
                    }}
                    type="card"
                    items={getTabItems()}
                    size="small"
                    style={{
                        height: '100%',
                        overflow: 'hidden'
                    }}
                    tabBarStyle={{
                        marginBottom: '8px',
                        padding: '0 8px'
                    }}
                />
            ) : (
                <Row style={{ height: '100%' }}>
                    <Col span={menuSpan} style={{ borderRight: '1px solid #f0f0f0', height: '100%' }}>
                        <Menu
                            mode="inline"
                            selectedKeys={[selectedMenu]}
                            onSelect={handleMenuSelect}
                            items={menuItems}
                            style={{ height: '100%', borderRight: 0 }}
                        />
                    </Col>
                    <Col span={contentSpan} style={{ padding: '16px', height: '100%', overflow: 'hidden' }}>
                        {renderContent()}
                    </Col>
                </Row>
            )}
        </Modal>
    );
}

export default ModalQuiz;