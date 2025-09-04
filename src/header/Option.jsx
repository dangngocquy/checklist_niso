import React, { useState } from "react";
import { 
  Card, 
  Modal, 
  Typography, 
  Layout, 
  Space, 
  Row, 
  Col,
  Avatar
} from "antd";
import { useNavigate } from 'react-router-dom';
import Language from "../components/language/Language";
import { 
  GlobalOutlined, 
} from "@ant-design/icons";
import { MdLocationOn } from 'react-icons/md';

const { Text } = Typography;
const { Content } = Layout;

const SettingCard = ({ icon, title, description, onClick }) => {
  return (
    <Card 
      hoverable 
      onClick={onClick} 
      style={{ marginBottom: 16 }}
      bodyStyle={{ padding: 24 }}
    >
      <Row align="middle" gutter={16}>
        <Col>
          <Avatar 
            size={48} 
            icon={icon} 
            style={{ 
              backgroundColor: '#ae8f3d', 
              color: '#fff',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }} 
          />
        </Col>
        <Col flex="1">
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 16 }}>{title}</Text>
            {description && <Text type="secondary">{description}</Text>}
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

const Caidat = React.memo(({ t, phanquyen }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const navigate = useNavigate();

    const settingsData = [
        {
            key: 'language',
            icon: <GlobalOutlined />,
            title: t('navigation.languageSettings'),
            description: 'Thay đổi ngôn ngữ hiển thị của ứng dụng',
            onClick: () => setIsModalVisible(true)
        },
        {
            key: 'lich-su-dang-nhap',
            icon: <MdLocationOn style={{ fontSize: '22px' }} />,
            title: t('ViewDocs.input18'),
            description: 'Xem lịch sử đăng nhập của tài khoản',
            onClick: () => navigate('/auth/docs/lich-su-dang-nhap')
        }
    ];

    return (
        <div className="layout_main_niso">
            <title>NISO | Cài đặt</title>
          <Content style={{ backgroundColor: '#f0f2f5' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              
              <Card 
                bordered={false}
                title={<Text strong>Cài đặt cá nhân</Text>}
                style={{ marginBottom: 24 }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {settingsData.map(item => (
                    <SettingCard
                      key={item.key}
                      icon={item.icon}
                      title={item.title}
                      description={item.description}
                      onClick={item.onClick}
                    />
                  ))}
                </Space>
              </Card>
            </div>
          </Content>
          
          <Modal
            title={
              <Space>
                <GlobalOutlined />
                <span>{t('settings.languageSelection')}</span>
              </Space>
            }
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            footer={<p style={{ opacity: 0.5, textAlign: 'left' }}>This feature is currently under development and may not work perfectly.</p>}
            width={800}
          >
            <Language phanquyen={phanquyen} />
          </Modal>
        </div>
    );
});

export default Caidat;