import React, { useMemo } from "react";
import {
    Card,
    List,
    Typography,
    Badge,
    Avatar,
    Row,
    Col,
    Space,
    Layout,
} from "antd";
import { useNavigate } from 'react-router-dom';
import { LuGamepad2 } from "react-icons/lu";
import {
    SolutionOutlined,
    UserOutlined,
    ShopOutlined,
    TeamOutlined,
    FileTextOutlined,
    BarChartOutlined,
    DatabaseOutlined,
    ProjectOutlined,
    FieldTimeOutlined,
    PlusSquareOutlined,
    UnorderedListOutlined,
    AppstoreOutlined,
    IdcardOutlined,
    SettingFilled,
    LogoutOutlined,
    FundOutlined,
} from "@ant-design/icons";
import { BsBookmark } from "react-icons/bs";
import { PiCertificateFill } from "react-icons/pi";

const { Title, Text } = Typography;
const { Content } = Layout;

const MenuGroup = ({ title, items, navigate, handleLogout }) => {
    return (
        <Card
            className="menu-group-card"
            bordered={false}
            style={{ marginBottom: 16 }}
            title={<Text strong>{title}</Text>}
        >
            <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 3 }}
                dataSource={items}
                renderItem={item => (
                    <List.Item>
                        <Card
                            hoverable
                            onClick={() => item.isLogout ? handleLogout() : navigate(item.link)}
                            bodyStyle={{ padding: '16px' }}
                            style={{ height: '100%' }}
                        >
                            <Space direction="vertical" align="center" style={{ width: '100%', textAlign: 'center' }}>
                                <Avatar
                                    size={48}
                                    icon={item.icon}
                                    style={{
                                        backgroundColor: item.isLogout ? '#ff4d4f' : '#ae8f3d',
                                        color: '#fff'
                                    }}
                                />
                                <Text strong>{item.text}</Text>
                                {item.count > 0 && <Badge count={item.count} style={{ marginTop: 4 }} />}
                            </Space>
                        </Card>
                    </List.Item>
                )}
            />
        </Card>
    );
};

const Them = React.memo(({ t, user, menuData = [], allTabCount, hasCreatePermission, hasxlphPermission, hasCCPermission, hastcvqclvPermission, handleLogout, hasquanlyTSPermission, hastKiemKePermission, hastXoaTSPermission }) => {
    const navigate = useNavigate();

    const menuGroups = useMemo(() => {
        // Nhóm : Thông tin
        const SettingsGroup = [
            {
                key: 'settings',
                text: 'Cài đặt',
                link: `/auth/docs/settings`,
                icon: <SettingFilled />
            }
        ];
        // Nhóm 1: Thông tin cá nhân và báo cáo
        const personalGroup = [
            {
                key: 'accounts',
                text: 'Thông tin cá nhân',
                link: `/auth/docs/profile/${user.keys}/personal-info`,
                icon: <IdcardOutlined />
            },
            ...(user.phanquyen === true ? [{
                key: "report-over",
                icon: <FundOutlined />,
                text: 'Báo cáo tổng quan',
                link: "/auth/docs/thong-ke"
            }] : []),
            {
                key: 'baocao2',
                text: t('ListDocs.input9'),
                link: '/auth/docs/report',
                icon: <BarChartOutlined />
            },
            ...(hasCreatePermission === true || user.phanquyen === true ? [{
                key: 'checklistme',
                text: 'Checklist của bạn',
                link: '/auth/docs/list/danh-sach-check-list',
                icon: <FileTextOutlined />
            }] : []),
            {
                key: 'daluu',
                text: 'Checklist đã lưu',
                link: '/auth/docs/danh-sach-da-luu',
                icon: <BsBookmark />
            }
        ];

        // Nhóm 2: Quản lý công việc
        const workManagementGroup = [
            ...(user.phanquyen === true || user.phanquyen === "Xử lý yêu cầu" 
                ? [{
                    key: 'baocao22',
                    text: 'Yêu cầu chờ xử lý',
                    link: '/auth/docs/list/view/xu-ly-phan-hoi/assigned',
                    icon: <ProjectOutlined />,
                    count: allTabCount
                }]
                : []
            ),       
            ...(hasCreatePermission ? [{
                key: 'nhap',
                text: t('Department.input181'),
                link: '/auth/docs/list-draft-checklist',
                icon: <FileTextOutlined />
            }] : []),
            ...(hasquanlyTSPermission === true || hastKiemKePermission === true || user?.phanquyen === "IT asset" || hastXoaTSPermission === true ? [{
                key: 'taisan',
                text: 'Quản lý tài sản',
                link: '/auth/docs/dashboard-tai-san',
                icon: <UnorderedListOutlined />
            }] : []),
            ...(user.phanquyen === true ? [{
                key: "school",
                icon: <PiCertificateFill />,
                text: 'Học tập',
                link: "/auth/docs/hoc-tap"
            }] : []),
            ...(user.phanquyen === true ? [{
                key: "quiz",
                icon: <LuGamepad2/>,
                link: "/auth/docs/niso-quiz",
                text: 'Quiz',
            }] : []),
        ].filter(Boolean);

        // Nhóm 3: Chấm công
        const attendanceGroup = [
            ...(hasCCPermission ? [{
                key: 'chamcong',
                text: 'Chấm công',
                link: '/auth/docs/cham-lam-viec',
                icon: <FieldTimeOutlined />
            }] : []),
            ...(hastcvqclvPermission ? [{
                key: 'taocong',
                text: 'Tạo công',
                link: '/auth/docs/cham-cong/tao-cong',
                icon: <PlusSquareOutlined />
            }] : []),
        ].filter(Boolean);

        // Nhóm 4: Quản trị (chỉ cho admin)
        const adminGroup = user.phanquyen === true ? [
            {
                key: 'phanquyen',
                text: t('Department.input336'),
                link: '/auth/docs/phan-quyen/account',
                icon: <SolutionOutlined />
            },
            {
                key: 'taikhoan',
                text: t('Department.input182'),
                link: '/auth/docs/account',
                icon: <UserOutlined />
            },
            {
                key: 'chinhanh',
                text: 'Danh sách nhà hàng',
                link: '/auth/docs/danh-sach-cua-hang',
                icon: <ShopOutlined />
            },
            {
                key: 'phongban',
                text: 'Danh sách khối / phòng',
                link: '/auth/docs/danh-sach-phong-ban',
                icon: <TeamOutlined />
            },
            {
                key: 'server',
                text: t('Department.input383'),
                link: '/auth/docs/server',
                icon: <DatabaseOutlined />
            }
        ] : [];

        // Nhóm đăng xuất
        const logoutGroup = [
            {
                key: 'logout',
                text: 'Đăng xuất',
                icon: <LogoutOutlined />,
                isLogout: true
            }
        ];

        return {
            SettingsGroup: SettingsGroup.length > 0 ? SettingsGroup : null,
            personalGroup: personalGroup.length > 0 ? personalGroup : null,
            workManagementGroup: workManagementGroup.length > 0 ? workManagementGroup : null,
            attendanceGroup: attendanceGroup.length > 0 ? attendanceGroup : null,
            adminGroup: adminGroup.length > 0 ? adminGroup : null,
            logoutGroup: logoutGroup
        };
    }, [t, user, allTabCount, hasCreatePermission, hasCCPermission, hastcvqclvPermission, hasquanlyTSPermission, hastKiemKePermission, hastXoaTSPermission]);

    return (
        <div className="layout_main_niso">
            <title>NISO CHECKLIST | MENU</title>
            <Content style={{ backgroundColor: '#f0f2f5' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <Row justify={window.innerWidth < 768 ? "left" : "center"} align="middle">
                        <Col>
                            <Title level={window.innerWidth < 768 ? 4 : 2}>
                                <AppstoreOutlined /> NISO MENU
                            </Title>
                        </Col>
                    </Row>

                    {menuGroups.personalGroup && (
                        <MenuGroup
                            title="Thông tin cá nhân & Báo cáo"
                            items={menuGroups.personalGroup}
                            navigate={navigate}
                        />
                    )}

                    {menuGroups.workManagementGroup && (
                        <MenuGroup
                            title="Quản lý công việc"
                            items={menuGroups.workManagementGroup}
                            navigate={navigate}
                        />
                    )}

                    {menuGroups.attendanceGroup && (
                        <MenuGroup
                            title="Chấm công"
                            items={menuGroups.attendanceGroup}
                            navigate={navigate}
                        />
                    )}

                    {menuGroups.adminGroup && (
                        <MenuGroup
                            title="Quản trị hệ thống"
                            items={menuGroups.adminGroup}
                            navigate={navigate}
                        />
                    )}

                    {menuGroups.SettingsGroup && (
                        <MenuGroup
                            title="Cài đặt chung"
                            items={menuGroups.SettingsGroup}
                            navigate={navigate}
                        />
                    )}

                    {/* Thêm nhóm đăng xuất */}
                    {menuGroups.logoutGroup && (
                        <MenuGroup
                            title="Đăng xuất"
                            items={menuGroups.logoutGroup}
                            navigate={navigate}
                            handleLogout={handleLogout}
                        />
                    )}
                </div>
            </Content>
        </div>
    );
});

export default Them;