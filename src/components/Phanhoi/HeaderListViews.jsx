import React from "react";
import { Tabs, Badge } from "antd";
import { useNavigate, useLocation, Outlet } from "react-router-dom";

const { TabPane } = Tabs;

const HeaderListViews = React.memo(({ user, t, allCount, hasxlphPermission, xlycPermission }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const activeKey = React.useMemo(() => {
        const pathParts = location.pathname.split('/');
        const lastPart = pathParts.pop();
        if (lastPart === "phan-hoi-cua-ban" || lastPart === "phan-hoi-duoc-cap" || location.pathname.includes("danh-sach-phan-hoi/phieu-cho-xu-ly")) {
            return "danh-sach-phan-hoi/phan-hoi-cua-ban";
        }
        if (location.pathname.includes("xu-ly-phan-hoi/")) {
            return "xu-ly-phan-hoi/assigned";
        }
        return lastPart;
    }, [location.pathname]);

    const handleTabChange = React.useCallback((key) => {
        navigate(`/auth/docs/list/view/${key}`);
    }, [navigate]);

    return (
        <div className="layout_main_niso">
            <Tabs
                activeKey={activeKey}
                style={{ textTransform: "uppercase" }}
                onChange={handleTabChange}
                type="card"
                size="small"
            >
                <TabPane tab="Lịch sử phiếu" key="danh-sach-phan-hoi/phan-hoi-cua-ban" />
                {user.phanquyen === true && (
                    <TabPane
                        tab={
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <span>{t("Department.input264")}</span>
                                <Badge count={allCount} style={{ marginLeft: 8 }} />
                            </div>
                        }
                        key="tat-ca-phan-hoi"
                    />
                )}
                {(user.phanquyen === true || user.phanquyen === "Xử lý yêu cầu") && (
                    <TabPane
                        tab="Phiếu chờ xử lý"
                        key="xu-ly-phan-hoi/assigned"
                    />
                )}
            </Tabs>
            <Outlet />
        </div>
    );
});

export default HeaderListViews;