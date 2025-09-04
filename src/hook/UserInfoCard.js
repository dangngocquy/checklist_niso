import React, { useState, useEffect } from 'react';
import { Card, Avatar, Typography, Divider, Tag, Spin } from 'antd';
import Avatars from '../config/design/Avatars';
import { MailOutlined, TeamOutlined, IdcardOutlined, HomeOutlined, CrownOutlined } from '@ant-design/icons';
import defaultBackground from '../assets/shop.png';

const { Text, Title } = Typography;

const UserInfoCard = ({ user }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    return null;
  }

  const hashStringToNumber = (str) => {
    if (!str || str === 'N/A') return 0; // Xử lý trường hợp không có giá trị
  
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i); // Thuật toán djb2
    }
    return hash >>> 0; // Đảm bảo kết quả là số dương
  };

  const cardStyle = {
    width: isMobile ? '280px' : '100%',
    borderRadius: 12,
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    border: '1px solid #f0f0f0',
    margin: isMobile ? '0 auto' : undefined
  };

  const backgroundUrl = user.imgBackground || defaultBackground;

  const headerStyle = {
    height: 120,
    position: 'relative',
    background: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6)), url(${backgroundUrl})`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    padding: 0,
  };

  const avatarContainerStyle = {
    position: 'absolute',
    bottom: -40,
    left: 0,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const contentStyle = {
    paddingTop: 50,
    paddingBottom: 16,
    paddingLeft: 20,
    paddingRight: 20,
    textAlign: 'center'
  };

  const userInfoStyle = {
    marginTop: 16,
    padding: '0 12px',
  };

  const infoRowStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'flex-start' : 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0'
  };

  const lastRowStyle = {
    ...infoRowStyle,
    borderBottom: 'none'
  };

  const infoLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: isMobile ? 4 : 0,
    width: isMobile ? '100%' : 120,
  };

  const infoValueStyle = {
    flex: 1,
    width: isMobile ? '100%' : 'auto',
    marginLeft: isMobile ? 24 : 8,
    wordBreak: 'break-all'
  };

  const encodedKeys = hashStringToNumber(user.keys);

  return (
    <Card
      hoverable
      style={cardStyle}
      bodyStyle={{ padding: 0 }}
    >
      {/* Header with gradient overlay for better text visibility */}
      <div style={headerStyle}>
        <div style={avatarContainerStyle}>
          {user.imgAvatar && user.imgAvatar !== 'null' ? (
            <Avatar
              src={user.imgAvatar}
              size={80}
              icon={<Spin size="small" />}
              style={{ border: '4px solid white', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
            />
          ) : (
            <div style={{ border: '4px solid white', borderRadius: '50%', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
              <Avatars user={{ name: user.name }} sizeImg={80} />
            </div>
          )}
        </div>
      </div>

      {/* User identity section */}
      <div style={contentStyle}>
        <Title level={4} style={{ margin: 0 }}>
          {user.name || 'Unknown'}
        </Title>
        <Text type="secondary">@{user.username || 'N/A'}</Text>
        
        <Tag 
          color={user.locker ? 'error' : 'success'} 
          style={{ marginTop: 8 }}
          bordered={false}
        >
          {user.locker ? 'Tạm ngưng hoạt động' : 'Đang hoạt động'}
        </Tag>
      </div>

      <Divider style={{ margin: '0 0 8px 0' }} />

      {/* User details section */}
      <div style={userInfoStyle}>
        <div style={infoRowStyle}>
          <div style={infoLabelStyle}>
            <IdcardOutlined style={{ marginRight: 8, color: '#ae8f3d' }} />
            <Text strong>User ID:</Text>
          </div>
          <Text
            copyable={{ text: encodedKeys.toString() }}
            style={infoValueStyle}
          >
           {encodedKeys}
          </Text>
        </div>

        {user.chucvu && (
          <div style={infoRowStyle}>
            <div style={infoLabelStyle}>
              <CrownOutlined style={{ marginRight: 8, color: '#ae8f3d' }} />
              <Text strong style={{whiteSpace: 'nowrap'}}>Chức vụ:</Text>
            </div>
            <div style={infoValueStyle}>
              <Tag bordered={false} color="blue">{user.chucvu || "Chưa cập nhật"}</Tag>
            </div>
          </div>
        )}

        {user.chinhanh && (
          <div style={infoRowStyle}>
            <div style={infoLabelStyle}>
              <HomeOutlined style={{ marginRight: 8, color: '#ae8f3d' }} />
              <Text strong style={{whiteSpace: 'nowrap'}}>Nhà hàng:</Text>
            </div>
            <div style={infoValueStyle}>
              <Tag bordered={false} color="blue">{user.chinhanh || "Chưa cập nhật"}</Tag>
            </div>
          </div>
        )}

        {user.bophan && (
          <div style={lastRowStyle}>
            <div style={infoLabelStyle}>
              <TeamOutlined style={{ marginRight: 8, color: '#ae8f3d' }} />
              <Text strong style={{whiteSpace: 'nowrap'}}>Khối/Phòng:</Text>
            </div>
            <div style={infoValueStyle}>
              <Tag color="blue" bordered={false}>{user.bophan.toUpperCase() || "Chưa cập nhật"}</Tag>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default UserInfoCard;