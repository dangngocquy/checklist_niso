import React, { useState, useEffect, useCallback } from 'react';
import { 
  Drawer, 
  List,
  Tag, 
  Button, 
  message, 
  Spin, 
  Avatar, 
  Space, 
  Row, 
  Col, 
  Card, 
  Typography, 
  Descriptions,
} from 'antd';
import { 
  EditOutlined, 
  TagOutlined, 
  ShopOutlined, 
  EnvironmentOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  NumberOutlined,
  InfoCircleOutlined,
  LaptopOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import Avatars from '../../../config/design/Avatars';

const { Title, Text } = Typography;

const AssetDetail = ({ visible, onClose, assetId, hastKiemKePermission, onEdit, axiosConfig, getUserInfo }) => {
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đang sử dụng': return 'green';
      case 'Bảo hành': return 'orange';
      case 'Đã thanh lý': return 'red';
      default: return 'default';
    }
  };

  const fetchAssetDetails = useCallback(async () => {
    if (!assetId) return;
    setLoading(true);
    try {
      const response = await axios.get(`/api/assets/${assetId}`, axiosConfig);
      const assetData = response.data.data;
      const assignedUsers = await Promise.all(
        (assetData.assignedSerialNumbers || []).map(async (assignment) => {
          const userInfo = await getUserInfo(assignment.assignedTo);
          return { ...userInfo, serialNumber: assignment.serialNumber };
        })
      );
      setAsset({ ...assetData, assignedUsers });
    } catch (error) {
      message.error(`Không thể tải chi tiết tài sản: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [assetId, axiosConfig, getUserInfo]);

  useEffect(() => {
    if (visible && assetId) {
      fetchAssetDetails();
    }
  }, [visible, assetId, fetchAssetDetails]);

  const renderUserList = () => {
    if (!asset?.assignedUsers || asset.assignedUsers.length === 0) {
      return <Tag color="red" style={{ margin: '8px 0' }} bordered={false}>Chưa cấp phát</Tag>;
    }

    return (
      <List
        itemLayout="horizontal"
        dataSource={asset.assignedUsers}
        renderItem={(user, index) => (
          <List.Item>
            <List.Item.Meta
              avatar={user.imgAvatar ? 
                <Avatar src={user.imgAvatar} /> :
                <Avatars user={{ name: user.name }} sizeImg="default" />
              }
              title={<Text strong>{user.name}</Text>}
              description={
                <Space direction="vertical" size={0}>
                  <Text type="secondary">{user.bophan.toUpperCase()} - {user.chucvu}</Text>
                  <Text type="secondary">S/N: {user.serialNumber}</Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  return (
    <Drawer
      title={
        <Space>
          <LaptopOutlined />
          <span>Chi tiết tài sản</span>
        </Space>
      }
      width={800}
      open={visible}
      onClose={onClose}
      headerStyle={{ 
        borderBottom: '1px solid #f0f0f0',
        padding: '16px 24px'
      }}
      bodyStyle={{ 
        padding: '24px',
        backgroundColor: '#f5f5f5'
      }}
      extra={!hastKiemKePermission && asset && (
        <Button 
          type="primary" 
          onClick={() => onEdit(asset)} 
          icon={<EditOutlined />}
        >
          Chỉnh sửa
        </Button>
      )}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Đang tải thông tin tài sản...</div>
        </div>
      ) : asset ? (
        <div>
          <Card 
            bordered={false} 
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: '16px 24px' }}
          >
            <Row gutter={24} align="middle">
              <Col span={16}>
                <Title level={4} style={{ margin: 0 }}>{asset.name}</Title>
                <Space size={16} style={{ marginTop: 8 }}>
                  <Tag 
                    color={getStatusColor(asset.status)} 
                    style={{ fontSize: 16, padding: '4px 12px' }}
                    bordered={false}
                  >
                    {asset.status}
                  </Tag>
                  <Text type="secondary"><TagOutlined /> {asset.assetTag}</Text>
                </Space>
              </Col>
              <Col span={8} style={{ textAlign: 'right' }}>
                <Space>
                  <Tag color="blue" style={{ fontSize: 14, padding: '2px 10px' }} bordered={false}>
                    {asset.category}
                  </Tag>
                </Space>
              </Col>
            </Row>
          </Card>

          <Row gutter={16}>
            <Col span={24}>
              <Card 
                title={
                  <Space>
                    <InfoCircleOutlined />
                    <span>Thông tin cơ bản</span>
                  </Space>
                }
                bordered={false}
                style={{ marginBottom: 16 }}
              >
                <Descriptions 
                  bordered 
                  column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                  labelStyle={{ fontWeight: 500, backgroundColor: '#fafafa' }}
                >
                  <Descriptions.Item label="Mã tài sản">
                    <Space>
                      <TagOutlined />
                      {asset.assetTag}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Danh mục">
                    <Space>
                      <TagOutlined />
                      {asset.category}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Vị trí">
                    <Space>
                      <EnvironmentOutlined />
                      {asset.location}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số lượng">
                    <Space>
                      <NumberOutlined />
                      <Text strong>{asset.quantity}</Text> / <Text>{asset.actualQuantity}</Text> khả dụng
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            <Col span={24}>
              <Card 
                title={
                  <Space>
                    <UserOutlined />
                    <span>Người sử dụng</span>
                  </Space>
                }
                bordered={false}
                style={{ marginBottom: 16 }}
              >
                {renderUserList()}
              </Card>
            </Col>

            <Col span={24}>
              <Card 
                title={
                  <Space>
                    <ShopOutlined />
                    <span>Thông tin chi tiết</span>
                  </Space>
                }
                bordered={false}
              >
                <Descriptions 
                  bordered 
                  column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                  labelStyle={{ fontWeight: 500, backgroundColor: '#fafafa' }}
                >
                  <Descriptions.Item label="Nhà sản xuất">
                    {asset.manufacturer ? asset.manufacturer : <Tag color="red">Không có</Tag>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Model">
                    {asset.model ? asset.model : <Tag color="red">Không có</Tag>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Danh sách SN" span={2}>
                    {asset.serialNumbers.length > 0 ? 
                      <div style={{ 
                        maxHeight: '100px', 
                        overflowY: 'auto', 
                        padding: '4px 0'
                      }}>
                        {asset.serialNumbers.map((sn, index) => (
                          <Tag key={index} style={{ margin: '2px 4px' }} bordered={false}>{sn}</Tag>
                        ))}
                      </div> : 
                      <Tag color="red" bordered={false}>Không có</Tag>
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label={
                    <Space>
                      <CalendarOutlined />
                      <span>Ngày mua</span>
                    </Space>
                  }>
                    {asset.purchaseDate ? asset.purchaseDate : <Tag color="red" bordered={false}>Không có</Tag>}
                  </Descriptions.Item>
                  <Descriptions.Item label={
                    <Space>
                      <DollarOutlined />
                      <span>Giá mua</span>
                    </Space>
                  }>
                    {asset.price
                      ? <Text strong>{asset.price.toLocaleString('vi-VN') + ' VND'}</Text>
                      : <Tag color="red" bordered={false}>Không có</Tag>
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tạo">
                    {dayjs(asset.createdAt).format('DD-MM-YYYY HH:mm:ss')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ghi chú" span={2}>
                    {asset.notes ? 
                      <div style={{ whiteSpace: 'pre-wrap' }}>{asset.notes}</div> : 
                      <Tag color="red" bordered={false}>Không có</Tag>
                    }
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '80px 0', 
          backgroundColor: '#fff',
          borderRadius: 8
        }}>
          <InfoCircleOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />
          <p style={{ marginTop: 16, fontSize: 16, color: '#8c8c8c' }}>
            Không tìm thấy thông tin tài sản.
          </p>
        </div>
      )}
    </Drawer>
  );
};

export default AssetDetail;