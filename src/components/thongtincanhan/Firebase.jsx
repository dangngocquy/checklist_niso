import React, { useState } from 'react';
import { imageDb } from '../../config';
import useFileUpload from '../../hook/useFileUpload';
import { 
  Button, 
  Upload, 
  message, 
  Progress, 
  Space, 
  Avatar, 
  notification,
  Card,
  Typography,
  Tooltip
} from 'antd';
import { CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';
import Avatars from '../../config/design/Avatars';

const { Text } = Typography;

const Firebase = React.memo(({ t, user, Frame }) => {
  const { progress, isUploading, uploadFile } = useFileUpload(imageDb, 'CHECKLISTNISO');
  const [img, setImg] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleUpload = () => {
    uploadFile(img, (url) => {
      axios
        .put(`/users/upload/${user.keys}`, { imgAvatar: url }, {
          headers: {
            'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`
          }
        })
        .then(() => {
          // Update the user object with the new imgAvatar
          const updatedUser = { ...user, imgAvatar: url };

          // Determine whether to use localStorage or sessionStorage
          const storage = localStorage.getItem('user') ? localStorage : sessionStorage;

          // Update the storage with the new user object
          storage.setItem('user', JSON.stringify(updatedUser));

          // Show success notification
          notification.success({
            message: 'Thông báo',
            description: "Cập nhật ảnh đại diện thành công.",
            placement: 'topRight',
            showProgress: true,
            pauseOnHover: true,
          });

          // Reset state
          setPreviewUrl(null);
          setImg(null);
        })
        .catch(() => message.error('Failed to update avatar URL'));
    });
  };

  const handleFileChange = (file) => {
    const allowedTypes = [
      'image/png',
      'image/gif',
      'image/svg+xml',
      'image/jpeg',
      'image/jpg',
      'image/heic',
      'image/heif',
    ];
    if (allowedTypes.includes(file.type)) {
      setImg(file);
      setPreviewUrl(URL.createObjectURL(file));
      return false;
    } else {
      setImg(null);
      setPreviewUrl(null);
      message.warning(t('Department.input138'));
      return false;
    }
  };

  return (
    <Card 
      style={{ 
        width: '100%',
      }}
      bordered={false}
    >
      <div style={{ textAlign: 'center' }}>
        
        <div style={{ margin: '24px 0' }}>
          {isUploading ? (
            <div style={{ textAlign: 'center' }}>
              <Avatar 
                size={200} 
                icon={<LoadingOutlined />} 
                style={{ backgroundColor: '#f5f5f5' }} 
              />
              <div style={{ marginTop: 16 }}>
                <Progress percent={progress} status="active" />
              </div>
            </div>
          ) : (
            <Tooltip title="Click để thay đổi ảnh đại diện">
              <Upload 
                showUploadList={false} 
                beforeUpload={handleFileChange}
              >
                <div style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}>
                <div className="avatar avatar-x-large">
                  {previewUrl ? (
                    <Avatar 
                      src={previewUrl} 
                      alt="Avatar" 
                      size={200} 
                      style={{ border: '2px solid #ae8f3d' }}
                    />
                  ) : user.imgAvatar && user.imgAvatar !== 'null' ? (
                    <Avatar 
                      src={user.imgAvatar} 
                      alt="Avatar" 
                      size={200}
                    />
                  ) : (
                    <Avatars 
                      user={user} 
                      CssClassname="avatarNiso" 
                      sizeFont={80} 
                    />
                  )}
                  {user.name === 'Đặng Ngọc Quý' && user.phanquyen && <img src={Frame} alt="test" className="avatar-frame anim-spin"/>}
                  </div>
                </div>
              </Upload>
            </Tooltip>
          )}
        </div>
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {!isUploading && img && (
            <Button 
              type="primary" 
              icon={<CheckOutlined />}
              onClick={handleUpload} 
              block
              size="middle"
            >
              {t('Department.input199')}
            </Button>
          )}
          
          {!isUploading && !img && (
            <Text type="secondary">
              Nhấp vào ảnh để tải lên hình ảnh mới
            </Text>
          )}
        </Space>
      </div>
    </Card>
  );
});

export default Firebase;