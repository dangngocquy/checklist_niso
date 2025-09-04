import React from "react";
import { Tabs } from "antd";
import { useNavigate, useLocation, Outlet } from "react-router-dom";

const { TabPane } = Tabs;

const HeaderViews = React.memo(({ user, t }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const activeKey = location.pathname.split('/').pop();

    const handleTabChange = (key) => {
        navigate(key);
    };

    return (
        <div className="layout_main_niso">
            <Tabs
                type="card"
                size="small"
                activeKey={activeKey}
                onChange={handleTabChange}
                style={{ textTransform: 'uppercase' }}
            >
                <TabPane tab={t('Phanquyen.input39')} key="danh-sach-check-list" />
                {user.phanquyen === true && (
                    <TabPane tab={t('Phanquyen.input35')} key="tat-ca-check-list" />
                )}
            </Tabs>
            <Outlet />
        </div>
    );
});

export default HeaderViews;