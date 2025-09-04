import React from "react";
import { Button, Tabs } from "antd";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { TabPane } = Tabs;

const HeaderAsset = React.memo(({ t, user, hasquanlyTSPermission }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const activeKey = location.pathname.split('/').pop() || "list-asset";

    const handleTabChange = (key) => {
        navigate(`/auth/docs/danh-sach-tai-san/${key}`);
    };

    // Determine if user has full access
    const hasFullAccess = hasquanlyTSPermission === true || user?.phanquyen === "IT asset";

    // Define visible tabs based on permissions
    const renderTabs = () => {
        return (
            <Tabs
                activeKey={activeKey}
                onChange={handleTabChange}
                type="card"
                size="small"
                style={{ textTransform: 'uppercase' }}
            >
                <TabPane tab="Quản lý tài sản" key="list-asset" />
                <TabPane tab="Quản lý bảo hành" key="bao-hanh" />
                <TabPane tab="Danh sách kiểm kê" key="asset-ton" />

                {hasFullAccess && (
                    <TabPane tab="Thanh lý tài sản" key="thanh-ly" />
                )}

                <TabPane tab="Thống kê - báo cáo" key="report" />
            </Tabs>
        );
    };

    return (
        <div className="layout_main_niso">
            <title>NISO | Quản lý tài sản (IT service)</title>
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/auth/docs/dashboard-tai-san')}
                type='link'
                style={{ marginBottom: 15 }}
            >
                Quay lại Dashboard
            </Button>
            {renderTabs()}
            <Outlet />
        </div>
    );
});

export default HeaderAsset;