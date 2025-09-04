import React from "react";
import { Tabs } from "antd";
import { useNavigate, useLocation, Outlet } from "react-router-dom";

const { TabPane } = Tabs;

const HeaderChamCong = React.memo(({ user, hastcvqclvPermission }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeKey = React.useMemo(() => location.pathname.split('/').pop(), [location.pathname]);

  const handleTabChange = React.useCallback((key) => {
    navigate(key);
  }, [navigate]);

  return (
    <div className="layout_main_niso">
      {hastcvqclvPermission && (
        <Tabs
          activeKey={activeKey}
          onChange={handleTabChange}
          style={{ textTransform: 'uppercase' }}
          type="card"
          size="small"
        >

          <TabPane tab="Tạo công" key="tao-cong" />

          <TabPane tab="Danh sách công" key="danh-sach-cong" />
        </Tabs>
      )}
      <Outlet />
    </div>
  );
});

export default HeaderChamCong;