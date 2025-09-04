import React, { useState } from "react";
import { Badge, Button, Dropdown, Tabs, Tooltip, List, Spin, Skeleton, Menu, Card, Typography } from "antd";
import {
  BellOutlined,
  AppstoreOutlined,
  ScheduleOutlined,
  UserOutlined,
  SolutionOutlined,
  MoreOutlined,
  CheckOutlined,
  NotificationOutlined,
  PlusOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom"; // Add useLocation
import useNotifications from "../hook/useNotifications";

const { TabPane } = Tabs;

const ThongbaoDropdown = React.memo(({ user, t, hastCreatenotiPermission }) => {
  const [activeTab, setActiveTab] = useState("0");
  const navigate = useNavigate();
  const location = useLocation(); // Get current location
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

  const renderTabContent = (tabKey) => {
    const data = notifications[tabKey];
    if (loading[tabKey] && data.length === 0) {
      return (
        <div style={{ padding: "8px" }}>
          <Skeleton active paragraph={{ rows: 3 }} size="small" />
        </div>
      );
    }
    return data.length > 0 ? (
      <div style={{ height: 500, overflow: "auto" }} onScroll={handleScroll(tabKey)}>
        <List
          dataSource={data}
          renderItem={(item, index) => (
            <List.Item style={{ padding: 0, marginBottom: 0 }}>
              {renderNotification(item, index, tabKey)}
            </List.Item>
          )}
          virtual
          grid={{ gutter: 0, column: 1 }}
          size="small"
        />
        {loading[tabKey] && (
          <div style={{ textAlign: "center", padding: "10px" }}>
            <Spin size="small" />
          </div>
        )}
      </div>
    ) : (
      <Card style={{ textAlign: 'center', padding: 24 }}>
        <CommentOutlined style={{ fontSize: 48, color: '#ae8f3d' }} />
        <Typography.Title level={4} style={{ marginTop: 16 }}>Trống !</Typography.Title>
        <Typography.Text type="secondary">{`Không có thông báo nào${tabKey === "2" ? " cho bạn" : tabKey === "4" ? " quản trị" : ""}.`}</Typography.Text>
      </Card>
    );
  };

  const optionsMenu = (
    <Menu>
      <Menu.Item key="markAllRead" icon={<CheckOutlined />} onClick={markAllAsRead}>
        Đánh dấu tất cả đã đọc
      </Menu.Item>
      <Menu.Item
        key="openNotifications"
        icon={<NotificationOutlined />}
        onClick={() => navigate('/auth/docs/notifications')}
      >
        Mở thông báo
      </Menu.Item>
      {(hastCreatenotiPermission === true || user?.phanquyen) && (
        <Menu.Item key="createNotification" icon={<PlusOutlined />} onClick={() => navigate('/auth/docs/create-noti')}>
          Tạo thông báo
        </Menu.Item>
      )}
    </Menu>
  );

  const menu = (
    <div
      style={{
        backgroundColor: "#fff",
        padding: "8px 0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        borderRadius: 8,
        width: 400,
      }}
    >
      <div
        style={{
          padding: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #f0f0f0"
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, paddingLeft: 16 }}><BellOutlined /> Thông báo (🚧Comingsoon)</h3>
        <Dropdown overlay={optionsMenu} trigger={["click"]} placement="bottomRight">
          <Button
            type="text"
            icon={<MoreOutlined />}
            style={{ fontSize: '16px' }}
          />
        </Dropdown>
      </div>
      <Tabs activeKey={activeTab} onChange={handleTabChange} tabPosition="left">
        <TabPane tab={<Tooltip title="Tất cả"><AppstoreOutlined /></Tooltip>} key="0" className="tab-noti" style={{ padding: 0 }}>
          {renderTabContent("0")}
        </TabPane>
        <TabPane tab={<Tooltip title="Quy trình phê duyệt"><ScheduleOutlined /></Tooltip>} key="1" className="tab-noti" style={{ padding: 0 }}>
          <Card style={{ textAlign: 'center', padding: 24 }}>
            <CommentOutlined style={{ fontSize: 48, color: '#ae8f3d' }} />
            <Typography.Title level={4} style={{ marginTop: 16 }}>Sớm ra mắt!</Typography.Title>
            <Typography.Text type="secondary">Tính năng này đang được phát triển và sẽ sớm được triển khai.</Typography.Text>
          </Card>
        </TabPane>
        <TabPane tab={<Tooltip title="Thông báo của bạn"><UserOutlined /></Tooltip>} key="2" className="tab-noti" style={{ padding: 0 }}>
          {renderTabContent("2")}
        </TabPane>
        {user?.phanquyen && (
          <TabPane tab={<Tooltip title="Quản trị"><SolutionOutlined /></Tooltip>} key="4" className="tab-noti" style={{ padding: 0 }}>
            {renderTabContent("4")}
          </TabPane>
        )}
      </Tabs>
    </div>
  );

  // Check if current path is '/auth/docs/notifications'
  const isNotificationsPage = location.pathname === '/auth/docs/notifications';

  if (window.innerWidth <= 768) {
    return (
      <Button
        icon={<BellOutlined />}
        shape="circle"
        size="large"
        onClick={() => navigate('/auth/docs/notifications')}
      />
    );
  } else {
    return isNotificationsPage ? (
      // Render only the button without Dropdown when on notifications page
      <Badge count={unreadCount} size="large">
        <Button icon={<BellOutlined />} shape="circle" size="middle" />
      </Badge>
    ) : (
      // Render Dropdown when not on notifications page
      <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight">
        <Badge count={unreadCount} size="large">
          <Button icon={<BellOutlined />} shape="circle" size="middle" />
        </Badge>
      </Dropdown>
    );
  }
});

export default ThongbaoDropdown;