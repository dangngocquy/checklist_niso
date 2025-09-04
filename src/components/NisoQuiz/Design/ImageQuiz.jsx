import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Card, Typography, Space, Modal, Row, Col, Slider } from 'antd';
import { PlusOutlined, CloudUploadOutlined, SwapOutlined, DeleteOutlined, ScissorOutlined, CheckOutlined } from '@ant-design/icons';
import useImagePicker from '../../../hook/useImagePicker';
import ModalQuiz from './ModalQuiz';

const { Title, Text } = Typography;

function ImageQuiz({ selectedImage: propSelectedImage, onImageSelect, onImageDelete, style, imageStyle }) {
    const [selectedImage, setSelectedImage] = useState(propSelectedImage);
    const [isCropModalVisible, setIsCropModalVisible] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [cropSettings, setCropSettings] = useState({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        aspectRatio: null,
        isCircle: false,
        isGif: false
    });
    const canvasRef = useRef(null);
    const imageRef = useRef(null);

    const {
        isModalVisible,
        fileList,
        searchTerm,
        giphyResults,
        loading,
        selectedMenu,
        youtubeUrl,
        youtubeResults,
        showModal,
        handleOk,
        handleCancel,
        handleSearch,
        handleMenuSelect,
        handleSelectGiphy,
        handleYouTubeSearch,
        setYoutubeUrl,
        setFileList
    } = useImagePicker();

    useEffect(() => {
        setSelectedImage(propSelectedImage);
    }, [propSelectedImage]);

    const handleDelete = (e) => {
        e.stopPropagation();
        setSelectedImage(null);
        setFileList([]);
        onImageDelete();
    };

    const handleConfirm = () => {
        if (fileList.length > 0) {
            const isGif = fileList[0].type === 'giphy' || fileList[0].name.toLowerCase().endsWith('.gif');
            setSelectedImage({ ...fileList[0], isGif });
            onImageSelect({ ...fileList[0], isGif });
            handleOk();
        }
    };

    const handleCropImage = (e) => {
        e.stopPropagation();
        if (selectedImage && selectedImage.type !== 'youtube' && !(selectedImage.isGif ?? false)) {
            setIsCropModalVisible(true);
            setCropSettings({
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                aspectRatio: null,
                isCircle: false,
                isGif: selectedImage.isGif || selectedImage.type === 'giphy' || selectedImage.name.toLowerCase().endsWith('.gif')
            });
        }
    };

    const handleCropCancel = () => {
        setIsCropModalVisible(false);
    };

    const handleAspectRatioChange = (ratio) => {
        const isCircle = ratio === 'circle';
        setCropSettings(prev => ({
            ...prev,
            aspectRatio: ratio,
            isCircle: isCircle,
            ...(ratio === 1 || isCircle ? { width: Math.min(prev.width, prev.height), height: Math.min(prev.width, prev.height) } : {}),
            ...(ratio === 16/9 ? { height: prev.width * 9/16 } : {}),
            ...(ratio === 9/16 ? { width: prev.height * 9/16 } : {})
        }));
    };

    const handleCropChange = (field, value) => {
        setCropSettings(prev => {
            const newSettings = { ...prev, [field]: value };
            
            if (prev.aspectRatio && prev.aspectRatio !== 'circle' && (field === 'width' || field === 'height')) {
                if (field === 'width') {
                    newSettings.height = value / prev.aspectRatio;
                } else {
                    newSettings.width = value * prev.aspectRatio;
                }
            }
            
            if (prev.isCircle && (field === 'width' || field === 'height')) {
                if (field === 'width') {
                    newSettings.height = value;
                } else {
                    newSettings.width = value;
                }
            }
            
            return newSettings;
        });
    };

    const performCrop = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = imageRef.current;
        
        if (!img || !canvas) return;

        const isGif = cropSettings.isGif;
        
        if (isGif) {
            const croppedImageData = {
                ...selectedImage,
                cropSettings: {
                    ...cropSettings,
                    isGif: true
                }
            };
            setSelectedImage(croppedImageData);
            onImageSelect(croppedImageData);
            setIsCropModalVisible(false);
            return;
        }
        
        const actualX = (cropSettings.x / 100) * img.naturalWidth;
        const actualY = (cropSettings.y / 100) * img.naturalHeight;
        const actualWidth = (cropSettings.width / 100) * img.naturalWidth;
        const actualHeight = (cropSettings.height / 100) * img.naturalHeight;
        
        if (cropSettings.isCircle) {
            const size = Math.min(actualWidth, actualHeight);
            const centerX = actualX + actualWidth / 2;
            const centerY = actualY + actualHeight / 2;
            const radius = size / 2;
            
            canvas.width = size;
            canvas.height = size;
            
            ctx.clearRect(0, 0, size, size);
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(radius, radius, radius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            
            ctx.drawImage(
                img,
                centerX - radius, centerY - radius, size, size,
                0, 0, size, size
            );
            
            ctx.restore();
        } else {
            canvas.width = actualWidth;
            canvas.height = actualHeight;
            
            ctx.clearRect(0, 0, actualWidth, actualHeight);
            
            ctx.drawImage(
                img,
                actualX, actualY, actualWidth, actualHeight,
                0, 0, actualWidth, actualHeight
            );
        }
        
        canvas.toBlob((blob) => {
            const croppedUrl = URL.createObjectURL(blob);
            const croppedImageData = {
                ...selectedImage,
                url: croppedUrl,
                name: `${selectedImage.name}_cropped${cropSettings.isCircle ? '_circle' : ''}`,
                originFile: blob
            };
            setSelectedImage(croppedImageData);
            onImageSelect(croppedImageData);
            setIsCropModalVisible(false);
        }, 'image/png');
    };

    const applyCrop = () => {
        performCrop();
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - (cropSettings.x * window.innerWidth / 100),
            y: e.clientY - (cropSettings.y * window.innerHeight / 100)
        });
    };

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;

        const newX = Math.max(0, Math.min(100 - cropSettings.width, 
            ((e.clientX - dragStart.x) / window.innerWidth) * 100));
        const newY = Math.max(0, Math.min(100 - cropSettings.height, 
            ((e.clientY - dragStart.y) / window.innerHeight) * 100));

        setCropSettings(prev => ({
            ...prev,
            x: newX,
            y: newY
        }));
    }, [isDragging, dragStart, cropSettings.width, cropSettings.height]);

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart, handleMouseMove]);

    const getCropOverlayStyle = () => {
        const baseStyle = {
            position: 'absolute',
            left: `${cropSettings.x}%`,
            top: `${cropSettings.y}%`,
            width: `${cropSettings.width}%`,
            height: `${cropSettings.height}%`,
            cursor: 'move',
            boxSizing: 'border-box',
            userSelect: 'none',
        };

        if (cropSettings.isCircle) {
            const size = Math.min(cropSettings.width, cropSettings.height);
            const centerX = cropSettings.x + cropSettings.width / 2 - size / 2;
            const centerY = cropSettings.y + cropSettings.height / 2 - size / 2;
            
            return {
                ...baseStyle,
                left: `${centerX}%`,
                top: `${centerY}%`,
                width: `${size}%`,
                height: `${size}%`,
                borderRadius: '50%',
            };
        }
        return baseStyle;
    };

    const getMaskOverlayStyle = () => {
        const maskId = 'cropMask';
        
        if (cropSettings.isCircle) {
            const size = Math.min(cropSettings.width, cropSettings.height);
            const centerX = cropSettings.x + cropSettings.width / 2;
            const centerY = cropSettings.y + cropSettings.height / 2;
            
            return (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none'
                }}>
                    <svg width="100%" height="100%" style={{ position: 'absolute' }}>
                        <defs>
                            <mask id={maskId}>
                                <rect width="100%" height="100%" fill="white" />
                                <circle
                                    cx={`${centerX}%`}
                                    cy={`${centerY}%`}
                                    r={`${size / 2}%`}
                                    fill="black"
                                />
                            </mask>
                        </defs>
                        <rect 
                            width="100%" 
                            height="100%" 
                            fill="rgba(0, 0, 0, 0.5)" 
                            mask={`url(#${maskId})`}
                        />
                    </svg>
                </div>
            );
        }
        return (
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none'
            }}>
                <svg width="100%" height="100%" style={{ position: 'absolute' }}>
                    <defs>
                        <mask id={maskId}>
                            <rect width="100%" height="100%" fill="white" />
                            <rect
                                x={`${cropSettings.x}%`}
                                y={`${cropSettings.y}%`}
                                width={`${cropSettings.width}%`}
                                height={`${cropSettings.height}%`}
                                fill="black"
                            />
                        </mask>
                    </defs>
                    <rect 
                        width="100%" 
                        height="100%" 
                        fill="rgba(0, 0, 0, 0.5)" 
                        mask={`url(#${maskId})`}
                    />
                </svg>
            </div>
        );
    };

    // Determine modal width based on screen size
    const getModalWidth = () => {
        return window.innerWidth < 768 ? '90%' : 800;
    };

    // Determine image preview height based on screen size
    const getImagePreviewHeight = () => {
        return window.innerWidth < 768 ? '250px' : '400px';
    };

    return (
        <div style={{
            maxWidth: style?.maxWidth || '500px',
            margin: style?.margin || '0 auto',
            width: style?.width || 'auto',
            height: style?.height || 'auto',
        }}>
            {selectedImage ? (
                <div
                    style={{
                        width: '100%',
                        height: style?.height,
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    {selectedImage.type === 'youtube' ? (
                        <iframe
                            src={selectedImage.url}
                            title={selectedImage.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none'
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            overflow: 'hidden',
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <img
                                src={selectedImage.url}
                                alt={selectedImage.name}
                                style={{
                                    ...imageStyle,
                                    ...(selectedImage.cropSettings?.isGif && {
                                        objectPosition: `${selectedImage.cropSettings.x}% ${selectedImage.cropSettings.y}%`,
                                        width: `${100 / (selectedImage.cropSettings.width / 100)}%`,
                                        height: `${100 / (selectedImage.cropSettings.height / 100)}%`,
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        ...(selectedImage.cropSettings.isCircle && {
                                            borderRadius: '50%',
                                            clipPath: 'circle(50%)'
                                        })
                                    })
                                }}
                            />
                        </div>
                    )}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '10px',
                            flexWrap: 'wrap',
                            overflow: 'hidden',
                            opacity: 0,
                            transition: 'opacity 0.3s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '0';
                        }}
                    >
                        {selectedImage && !(selectedImage.isGif ?? false) && selectedImage.type !== 'youtube' && (
                            <Button
                                type='dashed'
                                icon={<ScissorOutlined />}
                                onClick={handleCropImage}
                            >
                                {window.innerWidth >= 768 && 'Cắt ảnh'}
                            </Button>
                        )}
                        <Button
                            type="primary"
                            icon={<SwapOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                showModal();
                            }}
                        >
                            {window.innerWidth >= 768 && 'Thay đổi'}
                        </Button>
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleDelete}
                        >
                            {window.innerWidth >= 768 && 'Xóa'}
                        </Button>
                    </div>
                </div>
            ) : (
                <Card
                    hoverable
                    style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        border: '1.5px dashed #ae8f3d',
                    }}
                    bodyStyle={{
                        padding: window.innerWidth < 768 ? '30px 20px' : '60px 40px',
                        textAlign: 'center',
                    }}
                    onClick={showModal}
                >
                    <Space direction="vertical" size="large">
                        <CloudUploadOutlined
                            style={{
                                fontSize: window.innerWidth < 768 ? '36px' : '52px',
                                color: '#ae8f3d'
                            }}
                        />
                        <div>
                            <Title level={window.innerWidth < 768 ? 4 : 3} style={{ color: '#ae8f3d', marginBottom: '10px' }}>
                                Click để chọn hình ảnh & video
                            </Title>
                            <Text style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>
                                Tìm kiếm GIF, Sticker từ Giphy hoặc video từ YouTube
                            </Text>
                        </div>
                        <Button
                            type="primary"
                            size={window.innerWidth < 768 ? 'small' : 'middle'}
                            icon={<PlusOutlined />}
                        >
                            Chọn hình ảnh
                        </Button>
                    </Space>
                </Card>
            )}

            <ModalQuiz
                isModalVisible={isModalVisible}
                selectedMenu={selectedMenu}
                searchTerm={searchTerm}
                giphyResults={giphyResults}
                loading={loading}
                youtubeUrl={youtubeUrl}
                youtubeResults={youtubeResults}
                handleOk={handleConfirm}
                handleCancel={handleCancel}
                handleSearch={handleSearch}
                handleMenuSelect={handleMenuSelect}
                handleSelectGiphy={handleSelectGiphy}
                handleYouTubeSearch={handleYouTubeSearch}
                setYoutubeUrl={setYoutubeUrl}
                fileList={fileList}
            />

            <Modal
                title="Cắt ảnh"
                open={isCropModalVisible}
                onCancel={handleCropCancel}
                width={getModalWidth()}
                footer={[
                    <Button key="cancel" onClick={handleCropCancel} size={window.innerWidth < 768 ? 'small' : 'middle'}>
                        Hủy
                    </Button>,
                    <Button 
                        key="apply" 
                        type="primary" 
                        icon={<CheckOutlined />}
                        onClick={applyCrop}
                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                    >
                        Áp dụng
                    </Button>
                ]}
                centered={true}
                bodyStyle={{ marginTop: 24 }}
            >
                <Row gutter={[8, 8]}>
                    <Col span={window.innerWidth < 768 ? 24 : 16}>
                        <div style={{ 
                            position: 'relative', 
                            width: '100%', 
                            height: getImagePreviewHeight(),
                            border: '1px solid #d9d9d9',
                            overflow: 'hidden'
                        }}>
                            {selectedImage && (
                                <>
                                    <img
                                        ref={imageRef}
                                        src={selectedImage.url}
                                        alt="Crop preview"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain'
                                        }}
                                        crossOrigin="anonymous"
                                    />
                                    
                                    {getMaskOverlayStyle()}
                                    
                                    <div style={getCropOverlayStyle()} 
                                        onMouseDown={handleMouseDown}
                                    />
                                </>
                            )}
                        </div>
                        
                        <canvas
                            ref={canvasRef}
                            style={{ display: 'none' }}
                        />
                    </Col>
                    
                    <Col span={window.innerWidth < 768 ? 24 : 8}>
                        <Space direction="vertical" style={{ width: '100%', gap: window.innerWidth < 768 ? '8px' : '12px' }}>
                            <Title level={window.innerWidth < 768 ? 5 : 5}>Tỷ lệ khung hình:</Title>
                            <Button.Group style={{ width: '100%', display: 'flex', flexWrap: 'wrap' }}>
                                <Button 
                                    onClick={() => handleAspectRatioChange(null)}
                                    type={cropSettings.aspectRatio === null ? 'primary' : 'default'}
                                    style={{ width: window.innerWidth < 768 ? '48%' : '50%', margin: window.innerWidth < 768 ? '2px' : '0', borderRadius: '0' }}
                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                >
                                    Tự do
                                </Button>
                                <Button 
                                    onClick={() => handleAspectRatioChange(1)}
                                    type={cropSettings.aspectRatio === 1 && !cropSettings.isCircle ? 'primary' : 'default'}
                                    style={{ width: window.innerWidth < 768 ? '48%' : '50%', margin: window.innerWidth < 768 ? '2px' : '0',  borderRadius: '0' }}
                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                >
                                    Vuông
                                </Button>
                                <Button 
                                    onClick={() => handleAspectRatioChange(16/9)}
                                    type={cropSettings.aspectRatio === 16/9 ? 'primary' : 'default'}
                                    style={{ width: window.innerWidth < 768 ? '48%' : '50%', margin: window.innerWidth < 768 ? '2px' : '0',  borderRadius: '0' }}
                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                >
                                    Ngang 16:9
                                </Button>
                                <Button 
                                    onClick={() => handleAspectRatioChange(9/16)}
                                    type={cropSettings.aspectRatio === 9/16 ? 'primary' : 'default'}
                                    style={{ width: window.innerWidth < 768 ? '48%' : '50%', margin: window.innerWidth < 768 ? '2px' : '0',  borderRadius: '0' }}
                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                >
                                    Dọc 9:16
                                </Button>
                                <Button 
                                    onClick={() => handleAspectRatioChange('circle')}
                                    type={cropSettings.isCircle ? 'primary' : 'default'}
                                    style={{ width: '100%', margin: window.innerWidth < 768 ? '2px 0' : '0',  borderRadius: '0' }}
                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                >
                                    🔴 Hình tròn
                                </Button>
                            </Button.Group>
                            
                            <Title level={5} style={{ marginTop: window.innerWidth < 768 ? '8px' : '20px' }}>Vị trí và kích thước:</Title>
                            
                            <div>
                                <Text style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>Vị trí X: {cropSettings.x}%</Text>
                                <Slider
                                    min={0}
                                    max={100 - cropSettings.width}
                                    value={cropSettings.x}
                                    onChange={(value) => handleCropChange('x', value)}
                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                />
                            </div>
                            
                            <div>
                                <Text style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>Vị trí Y: {cropSettings.y}%</Text>
                                <Slider
                                    min={0}
                                    max={100 - cropSettings.height}
                                    value={cropSettings.y}
                                    onChange={(value) => handleCropChange('y', value)}
                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                />
                            </div>
                            
                            <div>
                                <Text style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>Kích thước: {cropSettings.width}%</Text>
                                <Slider
                                    min={10}
                                    max={Math.min(100 - cropSettings.x, 100 - cropSettings.y)}
                                    value={cropSettings.width}
                                    onChange={(value) => handleCropChange('width', value)}
                                    size={window.innerWidth < 768 ? 'small' : 'middle'}
                                />
                            </div>
                            
                            {!cropSettings.isCircle && (
                                <div>
                                    <Text style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>Chiều cao: {cropSettings.height}%</Text>
                                    <Slider
                                        min={10}
                                        max={100 - cropSettings.y}
                                        value={cropSettings.height}
                                        onChange={(value) => handleCropChange('height', value)}
                                        disabled={cropSettings.aspectRatio !== null && cropSettings.aspectRatio !== 'circle'}
                                        size={window.innerWidth < 768 ? 'small' : 'middle'}
                                    />
                                </div>
                            )}
                        </Space>
                    </Col>
                </Row>
            </Modal>
        </div>
    );
}

export default ImageQuiz;