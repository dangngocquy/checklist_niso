import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Layout,
    Menu,
    Button,
    Typography,
    Space,
    Avatar,
    Dropdown,
    Divider,
    Card,
    Input,
    Empty,
    Modal,
    Badge,
    message,
    Tooltip,
    Tag
} from 'antd';
import { useNavigate, useLocation, NavLink, Outlet } from 'react-router-dom';
import { LuGamepad2 } from "react-icons/lu";
import Frame from '../assets/frame1.webp';
import {
    ContainerOutlined,
    EditOutlined,
    UnorderedListOutlined,
    AreaChartOutlined,
    SettingOutlined,
    SolutionOutlined,
    UserOutlined,
    SearchOutlined,
    PlusCircleOutlined,
    FieldTimeOutlined,
    PlusSquareOutlined,
    AppstoreAddOutlined,
    DashboardOutlined,
    LogoutOutlined,
    SaveOutlined,
    FileOutlined,
    ScanOutlined,
    PieChartOutlined,
    ClockCircleOutlined,
    ShopOutlined,
    TeamOutlined,
    ToolOutlined,
    BarChartOutlined,
    FileTextOutlined,
    DatabaseOutlined,
    FundOutlined
} from '@ant-design/icons';
import Logo from '../assets/Logo.svg';
import Footers from './footer/Footer';
import Avatars from '../config/design/Avatars';
import ThongbaoDropdown from '../header/ThongbaoDropdown';
import QRCodeLogin from './QRCodeLogin';
import { PiCertificateFill } from 'react-icons/pi';

const { Header, Content, Footer, Sider } = Layout;
const { Title, Text } = Typography;

// Redesigned App Menu Component
const AppMenu = React.memo(({ menuData, handleCardClick, t, showCount = true }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const flattenMenu = useCallback((menu) => {
        return menu.flatMap(item =>
            item.children
                ? [item, ...flattenMenu(item.children)]
                : item
        );
    }, []);

    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
    }, []);

    const filteredMenu = useMemo(() => {
        return flattenMenu(menuData)
            .filter(item => item.link)
            .filter(item =>
                t(item.label).toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [flattenMenu, menuData, searchTerm, t]);

    return (
        <div style={{
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            width: 320
        }}>
            <div style={{ padding: 16 }}>
                <Input
                    prefix={<SearchOutlined />}
                    placeholder='Tìm kiếm ứng dụng...'
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    allowClear
                />
            </div>
            <Divider style={{ margin: '0 0 8px 0' }} />
            <div style={{ maxHeight: 400, overflowY: 'auto', padding: '0 16px 16px' }}>
                {filteredMenu.length > 0 ? (
                    filteredMenu.map((item) => (
                        <Card
                            key={item.key}
                            size="small"
                            style={{
                                marginBottom: 8,
                                cursor: 'pointer',
                                borderRadius: 6,
                                transition: 'all 0.3s'
                            }}
                            hoverable
                            onClick={() => item.link && handleCardClick(item.link)}
                        >
                            <Card.Meta
                                avatar={
                                    <Avatar
                                        style={{
                                            backgroundColor: item.key.includes('submenu') ? '#f0f0f0' : '#ae8f3d',
                                            color: item.key.includes('submenu') ? '#ae8f3d' : '#fff'
                                        }}
                                        icon={item.icon}
                                    />
                                }
                                title={
                                    <Space>
                                        {t(item.label)}
                                        {showCount && item.count > 0 && <Badge count={item.count} />}
                                    </Space>
                                }
                                description={
                                    <Text type="secondary" ellipsis>{item.link}</Text>
                                }
                            />
                        </Card>
                    ))
                ) : (
                    <Empty
                        description="Không tìm thấy ứng dụng"
                    />
                )}
            </div>
        </div>
    );
});

// Main Container Component
const Container = ({
    user,
    t,
    handleLogout,
    timeRemaining,
    departments,
    allTabCount,
    hasCreatePermission,
    hasxlphPermission,
    hasCCPermission,
    hastcvqclvPermission,
    hastKiemKePermission,
    hasquanlyTSPermission,
    hastXoaTSPermission,
    hastCreatenotiPermission
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [openSubMenuKeys, setOpenSubMenuKeys] = useState([]);
    const [manualCollapsed, setManualCollapsed] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isQRModalVisible, setIsQRModalVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [bottomNavSelectedKey, setBottomNavSelectedKey] = useState(null);

    const menuData = useMemo(() => {
        const baseMenu = [
            {
                key: "dashboard",
                icon: <DashboardOutlined />,
                label: 'Dashboard',
                link: "/auth/docs/dashboard"
            },
            {
                key: "home",
                icon: <ContainerOutlined />,
                label: 'Checklist',
                link: "/auth/docs/home"
            },
            ...(hasCreatePermission === true ? [
                {
                    key: "create",
                    icon: <EditOutlined />,
                    label: 'Header.header4',
                    link: "/auth/docs/create"
                }
            ] : []),
            ...(hasCCPermission ? [
                {
                    key: "chamcong",
                    icon: <FieldTimeOutlined />,
                    label: 'Chấm công',
                    link: "/auth/docs/cham-lam-viec"
                }
            ] : []),
            ...(hastcvqclvPermission === true ? [
                {
                    key: "taocong",
                    icon: <PlusSquareOutlined />,
                    label: 'Tạo công',
                    link: "/auth/docs/cham-cong/tao-cong"
                }
            ] : []),
            ...(user && user.phanquyen === true ? [
                {
                key: "quiz",
                icon: <LuGamepad2 />,
                label: 'Quiz',
                link: "/auth/docs/niso-quiz"
                }
            ] : []),
            ...(user && user.phanquyen === true ? [
                {
                    key: "school",
                    icon: <PiCertificateFill />,
                    label: 'Học tập',
                    link: "/auth/docs/hoc-tap"
                }
            ] : []),
            ...(hasquanlyTSPermission === true || hastKiemKePermission === true || user.phanquyen === "IT asset" || hastXoaTSPermission === true ? [
                {
                    key: "asset-list",
                    icon: <ToolOutlined />,
                    label: 'Quản lý tài sản',
                    link: "/auth/docs/dashboard-tai-san"
                }
            ] : []),
            {
                key: "submenu1",
                icon: <UnorderedListOutlined />,
                label: 'Header.header5',
                children: [
                    ...(hasCreatePermission === true || (user && user.phanquyen === true) ? [{
                        key: "survey-management",
                        icon: <FileTextOutlined />,
                        label: 'ListDocs.input35',
                        link: "/auth/docs/list/danh-sach-check-list"
                    }] : []),
                    {
                        key: "saved-lists",
                        icon: <SaveOutlined />,
                        label: 'Department.input64',
                        link: "/auth/docs/danh-sach-da-luu"
                    },
                    ...(hasCreatePermission ? [
                        {
                            key: "list-draft-checklist",
                            icon: <FileOutlined />,
                            label: 'Department.input181',
                            link: "/auth/docs/list-draft-checklist"
                        }
                    ] : []),
                ]
            },
            {
                key: "submenu2",
                icon: <AreaChartOutlined />,
                label: 'Header.header6',
                count: allTabCount,
                children: [
                    {
                        key: "feedback-statistics",
                        icon: <BarChartOutlined />,
                        label: 'Department.input73',
                        link: "/auth/docs/list/view/danh-sach-phan-hoi/phan-hoi-cua-ban"
                    },
                    ...(user.phanquyen === true ? [{
                        key: "report-over",
                        icon: <FundOutlined />,
                        label: 'Báo cáo tổng quan',
                        link: "/auth/docs/thong-ke"
                    }] : []),
                    {
                        key: "report-lists",
                        icon: <PieChartOutlined />,
                        label: 'Báo cáo tổng hợp',
                        link: "/auth/docs/report"
                    },
                    ...(user && (user.phanquyen === 'Xử lý yêu cầu' || user.phanquyen === true) ? [{
                        key: "cxluser1",
                        icon: <ClockCircleOutlined />,
                        label: 'Yêu cầu chờ xử lý',
                        link: "/auth/docs/list/view/xu-ly-phan-hoi/assigned",
                        count: allTabCount
                    }] : []),
                ]
            },
        ];

        if (user && user.phanquyen === true) {
            let childrenMenu = [
                {
                    key: "report-list",
                    icon: <SolutionOutlined />,
                    label: 'Menu.menu4',
                    link: "/auth/docs/phan-quyen/account"
                },
                {
                    key: "saved-list",
                    icon: <UserOutlined />,
                    label: 'Department.input182',
                    link: "/auth/docs/account"
                },
                {
                    key: "branch-list",
                    icon: <ShopOutlined />,
                    label: 'Danh sách nhà hàng',
                    link: "/auth/docs/danh-sach-cua-hang"
                },
                {
                    key: "internal-management",
                    icon: <TeamOutlined />,
                    label: 'Danh sách phòng ban',
                    link: "/auth/docs/danh-sach-phong-ban"
                },
                {
                    key: "quantri",
                    icon: <DatabaseOutlined />,
                    label: 'Department.input383',
                    link: "/auth/docs/server"
                }
            ];

            baseMenu.push({
                key: "submenu3",
                icon: <SolutionOutlined />,
                label: 'Department.input364',
                children: childrenMenu
            });
        }

        return baseMenu;
    }, [user, allTabCount, hasCreatePermission, hasCCPermission, hastcvqclvPermission, hasquanlyTSPermission, hastKiemKePermission, hastXoaTSPermission]);

    // Set up event listener for window resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) {
                setCollapsed(true);
                setManualCollapsed(true);
            } else if (manualCollapsed === null) {
                setCollapsed(false);
            } else {
                setCollapsed(manualCollapsed);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [manualCollapsed]);

    // Update selected menu items based on current path (for Sider and AppMenu)
    useEffect(() => {
        const currentPath = location.pathname;

        const findSelectedKeys = (items) => {
            for (let item of items) {
                if (item.link === currentPath) {
                    return [item.key];
                }
                if (item.children) {
                    const childKeys = findSelectedKeys(item.children);
                    if (childKeys.length > 0) {
                        return childKeys;
                    }
                }
            }
            return [];
        };

        const keys = findSelectedKeys(menuData);
        setSelectedKeys(keys);
        const parentKeys = keys.slice(0, -1);
        setOpenSubMenuKeys(prevKeys => {
            const newKeys = [...new Set([...prevKeys, ...parentKeys])];
            return newKeys;
        });

        // Only auto-collapse/expand if manualCollapsed is null (no user override)
        if (manualCollapsed === null && !isMobile) {
            if (currentPath === '/auth/docs/home' || currentPath === '/auth/docs/dashboard') {
                setCollapsed(false);
            } else {
                setCollapsed(true);
            }
        }
    }, [location.pathname, menuData, manualCollapsed, isMobile]);

    // Update bottomNavSelectedKey based on current path (for Bottom Navigation)
    useEffect(() => {
        const currentPath = location.pathname;
        if (currentPath === '/auth/docs/dashboard') {
            setBottomNavSelectedKey('dashboard');
        } else if (currentPath === '/auth/docs/home') {
            setBottomNavSelectedKey('home');
        } else if (currentPath === '/auth/docs/report') {
            setBottomNavSelectedKey('report-lists');
        } else if (currentPath.startsWith('/auth/docs/profile/') || currentPath === '/auth/docs/settings' || currentPath === '/auth/docs/lich-su-dang-nhap' || currentPath === '/auth/docs/them') {
            setBottomNavSelectedKey('them');
        } else if (currentPath.includes('/docs/list/view/')) {
            setBottomNavSelectedKey('phan-hoi');
        } else {
            setBottomNavSelectedKey(null);
        }
    }, [location.pathname]);

    const ClickHome = () => {
        navigate('/auth/docs/dashboard');
    };

    const ClickProfile = () => {
        if (user) {
            navigate(`/auth/docs/profile/${user.keys}/personal-info`);
        }
    };

    const ClickCreate = useCallback(async () => {
        if (hasCreatePermission === false) {
            Modal.warning({
                title: 'Thông báo',
                content: 'Bạn không có quyền sử dụng chức năng này.',
                okButtonProps: {
                    style: {
                        backgroundColor: '#ae8f3d',
                    }
                },
            });
        } else {
            navigate('/auth/docs/create');
        }
    }, [hasCreatePermission, navigate]);

    const ClickSettings = () => {
        navigate('/auth/docs/settings');
    };

    const toggleCollapsed = () => {
        setCollapsed(prev => {
            const newCollapsed = !prev;
            setManualCollapsed(newCollapsed); // Update manualCollapsed to reflect user action
            // Dispatch event for Sider collapse
            window.dispatchEvent(new CustomEvent('siderCollapse', {
                detail: { collapsed: newCollapsed }
            }));
            return newCollapsed;
        });
    };

    const onOpenChange = (keys) => {
        setOpenSubMenuKeys(keys);
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Render nested menu items
    const renderMenu = (menuItems) => {
        return menuItems.map(item => {
            if (item.children) {
                return (
                    <Menu.SubMenu
                        key={item.key}
                        icon={item.icon}
                        title={
                            <Space>
                                {t(item.label)}
                                {item.count > 0 && (
                                    <Badge
                                        count={item.count}
                                        size="small"
                                        style={{ marginLeft: 4 }}
                                    />
                                )}
                            </Space>
                        }
                    >
                        {renderMenu(item.children)}
                    </Menu.SubMenu>
                );
            }
            return (
                <Menu.Item key={item.key} icon={item.icon}>
                    <NavLink to={item.link}>
                        <Space>
                            {t(item.label)}
                            {item.count > 0 && (
                                <Badge
                                    count={item.count}
                                    size="small"
                                    style={{ marginLeft: 4 }}
                                />
                            )}
                        </Space>
                    </NavLink>
                </Menu.Item>
            );
        });
    };

    // User dropdown menu
    const userMenu = (
        <Menu>
            <Menu.Item key="profile" icon={<UserOutlined />} onClick={ClickProfile}>
                {t('ViewDocs.input16')}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="settings" icon={<SettingOutlined />} onClick={ClickSettings}>
                {t('Menu.menu5')}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout} danger>
                {t('Header.header10')}
            </Menu.Item>
        </Menu>
    );

    const handleCardClick = useCallback((link) => {
        navigate(link);
        setIsModalVisible(false);
    }, [navigate]);

    const handleMenuClick = ({ key, keyPath }) => {
        if (keyPath.length === 1 && isMobile) {
            setCollapsed(true);
            setManualCollapsed(true);
        }
    };

    const handleQRLogin = () => {
        if (!user?.keys) {
            message.error('Bạn cần đăng nhập để sử dụng tính năng này');
            return;
        }
        setIsQRModalVisible(true);
    };

    const handleLoginSuccess = (userData) => {
        console.log('Handling Login Success:', userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsQRModalVisible(false);
        navigate('/auth/docs/dashboard');
    };

    return (
        <Layout style={{ minHeight: '100vh', overflowX: 'hidden' }}>
            {/* Header */}
            <Header style={{
                background: '#fff',
                padding: '0 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'fixed',
                width: '100%',
                zIndex: 4,
                height: 64
            }}>
                <Title level={5} className="drawer-title color__title__niso" onClick={ClickHome}>
                    <img src={Logo} alt='Logo NISO' width={32} />
                    <span className='create__button'>NISO CHECKLIST</span>
                </Title>

                <Space size="small">
                    <Tooltip title={t('Phanquyen.input40')}>
                        <Button
                            type='primary'
                            onClick={ClickCreate}
                            icon={<PlusCircleOutlined />}
                            size={isMobile ? "large" : "middle"}
                            shape={isMobile ? "circle" : "round"}
                        >
                            {!isMobile && t('Phanquyen.input40')}
                        </Button>
                    </Tooltip>

                    <Tooltip title="QR Code đăng nhập">
                        <Button
                            onClick={handleQRLogin}
                            icon={<ScanOutlined />}
                            shape="circle"
                            size={isMobile ? "large" : "middle"}
                        />
                    </Tooltip>

                    {isMobile ? (
                        <>
                            {window.innerWidth >= 768 && (
                                <Button
                                    onClick={() => setIsModalVisible(true)}
                                    icon={<AppstoreAddOutlined />}
                                    shape="circle"
                                    size={isMobile ? "large" : "middle"}
                                />
                            )}
                            <Modal
                                title={<Space><AppstoreAddOutlined /> Ứng dụng</Space>}
                                visible={isModalVisible}
                                onCancel={() => setIsModalVisible(false)}
                                footer={null}
                                width="90%"
                                bodyStyle={{ padding: 0 }}
                            >
                                <AppMenu
                                    menuData={menuData}
                                    handleCardClick={handleCardClick}
                                    t={t}
                                    showCount={false}
                                />
                            </Modal>
                        </>
                    ) : (
                        <Dropdown
                            overlay={
                                <AppMenu
                                    menuData={menuData}
                                    handleCardClick={handleCardClick}
                                    t={t}
                                    showCount={false}
                                />
                            }
                            trigger={['click']}
                            placement="bottomRight"
                        >
                            <Button icon={<AppstoreAddOutlined />} shape="circle" />
                        </Dropdown>
                    )}

                    <ThongbaoDropdown t={t} user={user} hastCreatenotiPermission={hastCreatenotiPermission} />

                    {window.innerWidth >= 768 && (
                        <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight" >
                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                {user && user.imgAvatar && user.imgAvatar !== "null" ? (
                                    <Avatar
                                        src={user.imgAvatar}
                                        size={isMobile ? "large" : "middle"}
                                        style={{ boxShadow: '0 2px 0 rgba(0, 0, 0, 0.02)', border: '1px solid #d8d8d8', borderRadius: '50%' }}
                                    />
                                ) : (
                                    <Avatars user={user} sizeImg={isMobile ? "large" : "middle"} />
                                )}
                            </div>
                        </Dropdown>
                    )}
                </Space>
            </Header>

            {/* Main Layout */}
            <Layout style={{ marginTop: 64 }}>
                {/* Sidebar (only render if not mobile) */}
                {!isMobile && (
                    <Sider
                        collapsible
                        collapsed={collapsed}
                        onCollapse={toggleCollapsed}
                        width={260}
                        collapsedWidth={80}
                        style={{
                            height: 'calc(100vh - 64px)',
                            position: 'fixed',
                            zIndex: 2,
                            left: 0,
                            top: 64,
                            backgroundColor: '#fff',
                            overflowY: 'auto',
                            transition: 'all 0.2s'
                        }}
                    >
                        {/* User Profile in Sidebar */}
                        {!collapsed && user && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '24px 16px',
                                borderBottom: '1px solid #f0f0f0'
                            }}>
                                <div style={{ boxShadow: '0 2px 0 rgba(0, 0, 0, 0.02)', border: '1px solid #d8d8d8', borderRadius: '50%', position: 'relative' }}>
                                    {user.imgAvatar && user.imgAvatar !== "null" ? (
                                        <div className="avatar avatar-x-large">
                                            <Avatar
                                                src={user.imgAvatar}
                                                size={100}
                                            />
                                            {user.name === 'Đặng Ngọc Quý' && user.phanquyen && <img src={Frame} alt="test" className="avatar-frame anim-spin" />}
                                        </div>
                                    ) : (
                                        <div className="avatar avatar-x-large">
                                            <Avatars user={user} sizeImg={100} sizeFont={40} />
                                            {user.name === 'Đặng Ngọc Quý' && user.phanquyen && <img src={Frame} alt="test" className="avatar-frame anim-spin" />}
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: 16, textAlign: 'center' }}>
                                    <Text strong style={{ fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {user.name}
                                        {user.phanquyen === true && (
                                            <Tag color="red" style={{ marginLeft: 8 }} bordered={false}>Administrator</Tag>
                                        )}
                                        {user.phanquyen === 'Xử lý yêu cầu' && (
                                            <Tag color="blue" style={{ marginLeft: 8 }} bordered={false}>Request Management</Tag>
                                        )}
                                        {user.phanquyen === 'IT asset' && (
                                            <Tag color="yellow" style={{ marginLeft: 8 }} bordered={false}>IT Asset Management</Tag>
                                        )}
                                    </Text>
                                    {user.chinhanh && (
                                        <Text type="secondary">{user.chinhanh}</Text>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Main Menu */}
                        <Menu
                            theme="light"
                            mode="inline"
                            selectedKeys={selectedKeys}
                            openKeys={openSubMenuKeys}
                            onOpenChange={onOpenChange}
                            onClick={handleMenuClick}
                            style={{ borderRight: 0 }}
                        >
                            {renderMenu(menuData)}
                        </Menu>
                    </Sider>
                )}

                {/* Content Area */}
                <Layout style={{
                    marginLeft: isMobile ? 0 : (collapsed ? 80 : 260),
                    transition: 'all 0.2s'
                }}>
                    <Content style={{
                        backgroundColor: '#f0f2f5'
                    }}>
                        {/* Pass collapsed state to Outlet */}
                        <Outlet context={{ siderCollapsed: collapsed }} />
                    </Content>

                    {/* Footer */}
                    {location.pathname !== '/auth/docs/niso-quiz/create' && !location.pathname.startsWith('/auth/docs/niso-quiz/view/') && (
                        <Footer className={`layout__website__niso ${collapsed ? 'collapsed' : 'expanded'}`} style={{ textAlign: 'center', paddingTop: 15 }}>
                            <Footers />
                            {timeRemaining && (
                                <span style={{ fontSize: 11 }}>
                                    {t('Department.input184')}: {formatTime(timeRemaining)}
                                </span>
                            )}
                        </Footer>
                    )}
                </Layout>
            </Layout>

            {/* Mobile Menu for Bottom Navigation */}
            {isMobile && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: '#fff',
                    boxShadow: '0 -1px 2px rgba(0,0,0,0.1)',
                    zIndex: 99,
                    display: 'flex',
                    justifyContent: 'space-around',
                    padding: '8px 0'
                }}>
                    <Button
                        type={bottomNavSelectedKey === 'dashboard' ? 'primary' : 'text'}
                        icon={<DashboardOutlined />}
                        onClick={() => {
                            setBottomNavSelectedKey('dashboard');
                            navigate('/auth/docs/dashboard');
                        }}
                        size='large'
                        shape="circle"
                    />
                    <Button
                        type={bottomNavSelectedKey === 'home' ? 'primary' : 'text'}
                        icon={<ContainerOutlined />}
                        onClick={() => {
                            setBottomNavSelectedKey('home');
                            navigate('/auth/docs/home');
                        }}
                        size='large'
                        shape="circle"
                    />
                    <Button
                        type={bottomNavSelectedKey === 'phan-hoi' ? 'primary' : 'text'}
                        icon={<FileTextOutlined />}
                        onClick={() => {
                            setBottomNavSelectedKey('phan-hoi');
                            navigate('/auth/docs/list/view/danh-sach-phan-hoi/phan-hoi-cua-ban');
                        }}
                        size='large'
                        shape="circle"
                    />
                    <Button
                        type={bottomNavSelectedKey === 'report-lists' ? 'primary' : 'text'}
                        shape="circle"
                        icon={<BarChartOutlined />}
                        onClick={() => {
                            setBottomNavSelectedKey('report-lists');
                            navigate('/auth/docs/report');
                        }}
                        size='large'
                    />

                    <div style={{ position: 'relative' }}>
                        {user && user.imgAvatar && user.imgAvatar !== "null" ? (
                            <Avatar
                                src={user.imgAvatar}
                                style={{ border: `1px solid ${bottomNavSelectedKey === 'them' ? '#ae8f3d' : 'transparent'}`, cursor: 'pointer' }}
                                size={isMobile ? "large" : "middle"}
                                onClick={() => {
                                    setBottomNavSelectedKey('them');
                                    navigate('/auth/docs/them');
                                }}
                            />
                        ) : (
                            <Avatars
                                user={user}
                                sizeImg={isMobile ? "large" : "middle"}
                                cssStyle={{ border: `1px solid ${bottomNavSelectedKey === 'them' ? '#ae8f3d' : 'transparent'}`, cursor: 'pointer' }}
                                FunctionClick={() => {
                                    setBottomNavSelectedKey('them');
                                    navigate('/auth/docs/them');
                                }}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* QR Code Login Modal */}
            <Modal
                title={<Space><ScanOutlined /> Đăng nhập bằng QR Code</Space>}
                visible={isQRModalVisible}
                onCancel={() => setIsQRModalVisible(false)}
                footer={null}
            >
                <QRCodeLogin
                    isQRCameraOpen={isQRModalVisible}
                    onClose={() => setIsQRModalVisible(false)}
                    onLoginSuccess={handleLoginSuccess}
                    t={t}
                    user={user}
                />
            </Modal>
        </Layout>
    );
};

export default React.memo(Container);