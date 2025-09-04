import React, { useState } from "react";
import { 
  Button, 
  Tabs, 
  List, 
  Spin, 
  Skeleton, 
  Typography, 
  Badge, 
  Card, 
  Space,  
  Divider, 
  ConfigProvider,
  Dropdown,
  Menu
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  AppstoreOutlined,
  ScheduleOutlined,
  UserOutlined,
  SolutionOutlined,
  BellOutlined,
  CheckOutlined,
  CommentOutlined,
  MoreOutlined,
  PlusOutlined
} from "@ant-design/icons";
import useNotifications from "../hook/useNotifications";

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const NotificationsPage = ({ user, t, hastCreatenotiPermission }) => {
  const [activeTab, setActiveTab] = useState("0");
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAllAsRead,
    renderNotification,
    handleScroll,
    hasLoadedInitial,
  } = useNotifications(user);

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (!hasLoadedInitial.current[key]) {
      fetchNotifications(key, true);
    }
  };

  // Options menu for the three-dot dropdown
  const optionsMenu = (
    <Menu>
      <Menu.Item key="markAllRead" icon={<CheckOutlined />} onClick={markAllAsRead}>
        Đánh dấu tất cả đã đọc
      </Menu.Item>
      {(hastCreatenotiPermission === true || user.phanquyen === true) && (
        <Menu.Item key="createNotification" icon={<PlusOutlined />} onClick={() => navigate('/auth/docs/create-noti')}>
          Tạo thông báo
        </Menu.Item>
      )}
    </Menu>
  );

  const renderTabContent = (tabKey) => {
    const data = notifications[tabKey];
    
    if (loading[tabKey] && data.length === 0) {
      return (
        <Card style={{ marginTop: 16 }}>
          <Skeleton active avatar paragraph={{ rows: 3 }} />
          <Divider style={{ margin: '16px 0' }} />
          <Skeleton active avatar paragraph={{ rows: 3 }} />
        </Card>
      );
    }
    
    return data.length > 0 ? (
      <div 
        style={{ 
          maxHeight: "70vh", 
          overflow: "auto",
          padding: '0 4px' 
        }} 
        onScroll={handleScroll(tabKey)}
      >
        <List
          dataSource={data}
          renderItem={(item, index) => (
            <List.Item style={{ padding: 0, marginBottom: 8 }}>
              <Card 
                hoverable 
                bodyStyle={{ padding: "12px 16px" }}
                style={{ 
                  width: "100%",
                  borderLeft: item.read ? 'none' : '4px solid #ae8f3d',
                  backgroundColor: item.read ? '#fff' : '#f9f9f9'
                }}
              >
                {renderNotification(item, index, tabKey)}
              </Card>
            </List.Item>
          )}
          locale={{
            emptyText: (
              <Card style={{ textAlign: 'center', padding: 24 }}>
                <CommentOutlined style={{ fontSize: 48, color: '#ae8f3d' }} />
                <Typography.Title level={4} style={{ marginTop: 16 }}>Trống !</Typography.Title>
                <Typography.Text type="secondary">{`Không có thông báo nào${tabKey === "2" ? " của bạn" : tabKey === "4" ? " quản trị" : ""}.`}</Typography.Text>
              </Card>
            )
          }}
        />
        {loading[tabKey] && (
          <div style={{ textAlign: "center", padding: "16px" }}>
            <Spin />
          </div>
        )}
      </div>
    ) : (
        <Card style={{ textAlign: 'center', padding: 24 }}>
                <CommentOutlined style={{ fontSize: 48, color: '#ae8f3d' }} />
                <Typography.Title level={4} style={{ marginTop: 16 }}>Trống !</Typography.Title>
                <Typography.Text type="secondary">{`Không có thông báo nào${tabKey === "2" ? " của bạn" : tabKey === "4" ? " quản trị" : ""}.`}</Typography.Text>
              </Card>
    );
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#ae8f3d',
          borderRadius: 6,
        },
      }}
    >
      <div style={{ background: "#f0f2f5", minHeight: "100vh" }} className="layout_main_niso">
        <title>NISO CHECKLIST | Thông báo</title>
        
        <Card 
          style={{ marginBottom: 20, borderRadius: 8 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: 'wrap', gap: 15 }}>
            <Space align="center">
              <BellOutlined style={{ fontSize: 20, color: '#ae8f3d' }} />
              <Title level={window.innerWidth < 768 ? 5 : 3} style={{ margin: 0 }}>
                Thông báo (🚧Comingsoon)
                {unreadCount > 0 && (
                  <Badge 
                    count={unreadCount} 
                    style={{ backgroundColor: '#f5222d', marginLeft: 12 }}
                    overflowCount={99}
                  />
                )}
              </Title>
            </Space>
            <Space>
              <Dropdown overlay={optionsMenu} trigger={["click"]} placement="bottomRight">
                <Button 
                  type="text" 
                  icon={<MoreOutlined />} 
                  style={{ fontSize: '18px' }}
                />
              </Dropdown>
            </Space>
          </div>
        </Card>
        
        <Card style={{ borderRadius: 8 }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={handleTabChange} 
            type="card"
            size='middle'
            tabBarStyle={{ marginBottom: 16 }}
          >
            <TabPane 
              tab={<span><AppstoreOutlined /> Tất cả</span>} 
              key="0"
            >
              {renderTabContent("0")}
            </TabPane>
            <TabPane 
              tab={<span><ScheduleOutlined /> Quy trình phê duyệt</span>} 
              key="1"
            >
              <Card style={{ textAlign: 'center', padding: 24 }}>
                <CommentOutlined style={{ fontSize: 48, color: '#ae8f3d' }} />
                <Title level={4} style={{ marginTop: 16 }}>Sớm ra mắt!</Title>
                <Text type="secondary">Tính năng này đang được phát triển và sẽ sớm được triển khai.</Text>
              </Card>
            </TabPane>
            <TabPane 
              tab={<span><UserOutlined /> Thông báo của bạn</span>} 
              key="2"
            >
              {renderTabContent("2")}
            </TabPane>
           {user.phanquyen === true &&
            <TabPane 
            tab={<span><SolutionOutlined /> Quản trị</span>} 
            key="4"
          >
            {renderTabContent("4")}
          </TabPane>
          }
          </Tabs>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default NotificationsPage;