import React from "react";
import { Tabs } from "antd";
import { useNavigate, useLocation, Outlet } from "react-router-dom";

const { TabPane } = Tabs;

const HeaderPhanquyen = React.memo(({ t, user }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const activeKey = location.pathname.startsWith('/auth/docs/phan-quyen') ? "account" : "account";

    const handleTabChange = (key) => {
        navigate(`/auth/docs/phan-quyen/${key}`);
    };

    return (
        <div className="layout_main_niso">
            {user.phanquyen && (
                <Tabs
                    type="card"
                    size="small"
                    activeKey={activeKey}
                    onChange={handleTabChange}
                    style={{ textTransform: 'uppercase' }}
                >
                    <TabPane tab="Phân quyền chung" key="account" />
                </Tabs>
            )}
            <Outlet />
        </div>
    );
});

export default HeaderPhanquyen;