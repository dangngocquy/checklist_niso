import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Typography,
    Row,
    Col,
    Card,
    Statistic,
    Table,
    Tag,
    Empty,
    Button,
    List,
    Avatar,
    message,
    Divider,
} from 'antd';
import moment from 'moment/moment';
import NotFoundPage from '../NotFoundPage';
import {
    LaptopOutlined,
    DesktopOutlined,
    PrinterOutlined,
    WifiOutlined,
    ArrowRightOutlined,
    FundProjectionScreenOutlined,
    BorderlessTableOutlined,
    ClusterOutlined,
    PhoneFilled,
    WindowsFilled,
    FieldTimeOutlined,
    BarChartOutlined,
    PieChartOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title } = Typography;

const Dashboard = ({ user, hasquanlyTSPermission, hastKiemKePermission, hastXoaTSPermission }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [assetStats, setAssetStats] = useState({
        total: 0,
        inUse: 0,
        available: 0,
        maintenance: 0,
        retired: 0,
    });
    // Thêm state mới cho kiểm kê
    const [inventoryStats, setInventoryStats] = useState({
        total: 0,
        pending: 0 // Đang kiểm hoặc chưa kiểm
    });
    const [assetsByCategory, setAssetsByCategory] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [upcomingMaintenance, setUpcomingMaintenance] = useState([]);
    const [expiringWarranties, setExpiringWarranties] = useState([]);

    // Set default date range for the last 30 days
    const defaultDateRange = [dayjs().subtract(30, 'days'), dayjs()];

    const axiosConfig = {
        headers: {
            Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
        },
    };

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                limit: 0,
                startDate: defaultDateRange[0].format('YYYY-MM-DD'),
                endDate: defaultDateRange[1].format('YYYY-MM-DD')
            };

            // Lấy dữ liệu tài sản
            const assetsResponse = await axios.get('/api/assets', { ...axiosConfig, params });
            const assets = assetsResponse.data.data;

            // Tính tổng số SN
            const totalSN = assets.reduce((sum, asset) => sum + (asset.serialNumbers?.length || 0), 0);

            // Lấy dữ liệu bảo hành
            const warrantiesResponse = await axios.get('/api/warranties', { ...axiosConfig, params });
            const warranties = warrantiesResponse.data.data;

            // Đếm số SN đang bảo hành
            const maintenanceSN = warranties.reduce((sum, warranty) => {
                const timeLeft = dayjs(warranty.endDate, 'DD-MM-YYYY').diff(dayjs(), 'day');
                if ((warranty.status === 'Kích hoạt' || warranty.status === 'Yêu cầu khác') && timeLeft >= 0) {
                    return sum + 1;
                }
                return sum;
            }, 0);

            // Lấy dữ liệu kiểm kê
            const inventoryResponse = await axios.get('/api/inventory-checks', { ...axiosConfig, params });
            const inventories = inventoryResponse.data.data;
            const totalInventories = inventories.length;
            const pendingInventories = inventories.filter(inv =>
                inv.status === 'Planned' || inv.status === 'Đang kiểm kê'
            ).length;

            const stats = {
                total: totalSN,
                available: assets.reduce((sum, asset) => {
                    const availableSN = (asset.serialNumbers?.length || 0) - (asset.assignedSerialNumbers?.length || 0);
                    return sum + (availableSN > 0 ? availableSN : 0);
                }, 0),
                inUse: assets.reduce((sum, asset) => {
                    return sum + (asset.status === 'Đang sử dụng' ? (asset.assignedSerialNumbers?.length || 0) : 0);
                }, 0),
                maintenance: maintenanceSN,
                retired: assets.reduce((sum, asset) => {
                    return sum + (asset.status === 'Đã thanh lý' ? (asset.serialNumbers?.length || 0) : 0);
                }, 0),
            };
            setAssetStats(stats);
            setInventoryStats({
                total: totalInventories,
                pending: pendingInventories
            });

            // Phần còn lại của hàm giữ nguyên
            const categoryCounts = assets.reduce((acc, asset) => {
                acc[asset.category] = (acc[asset.category] || 0) + (asset.serialNumbers?.length || 0);
                return acc;
            }, {});
            const categoryData = Object.entries(categoryCounts).map(([category, count]) => ({
                category,
                count,
                icon: getCategoryIcon(category),
            }));
            setAssetsByCategory(categoryData);

            const retiredResponse = await axios.get('/api/retired-assets', {
                ...axiosConfig,
                params: { limit: 3, startDate: defaultDateRange[0].format('YYYY-MM-DD'), endDate: defaultDateRange[1].format('YYYY-MM-DD') }
            });
            const retiredAssets = retiredResponse.data.data;
            const retiredActivity = retiredAssets.map(r => ({
                id: r._id,
                type: 'retire',
                asset: r.assetTag,
                name: r.name,
                user: 'Admin',
                date: dayjs(r.retiredDate).format('YYYY-MM-DD'),
            }));

            const inventoryActivityResponse = await axios.get('/api/inventory-checks', {
                ...axiosConfig,
                params: { limit: 3, startDate: defaultDateRange[0].format('YYYY-MM-DD'), endDate: defaultDateRange[1].format('YYYY-MM-DD') }
            });
            const inventoriesActivity = inventoryActivityResponse.data.data;
            const inventoryActivity = inventoriesActivity.map(i => ({
                id: i._id,
                type: 'check',
                asset: i.checkId,
                name: i.name,
                user: i.createdBy,
                date: dayjs(i.createdAt).format('YYYY-MM-DD'),
            }));

            setRecentActivity([...retiredActivity, ...inventoryActivity]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3));

            const upcoming = warranties
                .filter(w => {
                    const daysLeft = dayjs(w.endDate, 'DD-MM-YYYY').diff(dayjs(), 'day');
                    return daysLeft >= 0 && daysLeft <= 30;
                })
                .map(w => {
                    const daysLeft = dayjs(w.endDate, 'DD-MM-YYYY').diff(dayjs(), 'day');
                    return {
                        id: w._id,
                        assetTag: w.assetTag,
                        name: w.assetName,
                        category: w.category,
                        dueDate: w.endDate,
                        status: daysLeft <= 7 ? 'Critical' : 'Soon',
                    };
                });
            setUpcomingMaintenance(upcoming);

            const expiring = warranties
                .filter(w => {
                    const daysLeft = dayjs(w.endDate, 'DD-MM-YYYY').diff(dayjs(), 'day');
                    return daysLeft >= 0 && daysLeft <= 90;
                })
                .map(w => {
                    const daysLeft = dayjs(w.endDate, 'DD-MM-YYYY').diff(dayjs(), 'day');
                    return {
                        id: w._id,
                        name: w.assetName,
                        expiry: w.endDate,
                        seats: w.warrantyNumber ? 1 : 0,
                        status: daysLeft <= 7 ? 'Critical' : 'Soon',
                    };
                });
            setExpiringWarranties(expiring);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            message.error('Không thể tải dữ liệu Dashboard');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Các hàm khác giữ nguyên
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Laptop': return <LaptopOutlined />;
            case 'Desktop': return <DesktopOutlined />;
            case 'Printer': return <PrinterOutlined />;
            case 'Network': return <WifiOutlined />;
            case 'Monitor': return <FundProjectionScreenOutlined />;
            case 'Server': return <ClusterOutlined />;
            case 'Phone': return <PhoneFilled />;
            case 'Computer': return <WindowsFilled />;
            default: return <BorderlessTableOutlined />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Critical': return 'red';
            case 'Soon': return 'orange';
            case 'Scheduled': return 'blue';
            case 'Pending': return 'gold';
            default: return 'default';
        }
    };

    const getActivityText = (item) => {
        switch (item.type) {
            case 'add': return `Thêm tài sản mới: ${item.asset} (${item.name})`;
            case 'assign': return `Gán tài sản ${item.asset} (${item.name}) cho người dùng`;
            case 'maintenance': return `Đưa tài sản ${item.asset} (${item.name}) vào bảo hành`;
            case 'check': return `Kiểm tra tài sản ${item.asset} (${item.name})`;
            case 'retire': return `Thanh lý tài sản ${item.asset} (${item.name})`;
            default: return '';
        }
    };

    if (!hasquanlyTSPermission && user.phanquyen !== true && !hastKiemKePermission && !hastXoaTSPermission && user.phanquyen !== 'IT asset') {
        return <NotFoundPage />;
    }

    return (
        <div style={{ background: '#f5f5f5', padding: '24px' }} className='layout_main_niso' >
            <title>NISO | Quản lý tài sản</title>
            <>
                <div style={{
                    marginBottom: 32,
                }}>
                    <Title
                        level={3}
                        style={{
                            margin: 0,
                            color: '#ae8f3d',
                            borderLeft: '4px solid #ae8f3d',
                            paddingLeft: '16px',
                        }}
                    >
                        DASHBOARD
                    </Title>
                    <Divider style={{ margin: '16px 0' }} />
                    <div style={{ fontSize: '14px', color: '#888' }}>
                        Tổng quan tài sản 30 ngày gần đây: {defaultDateRange[0].format('DD/MM/YYYY')} - {defaultDateRange[1].format('DD/MM/YYYY')}
                    </div>
                </div>

                <Row gutter={[24, 24]}>
                    {Object.entries(assetStats).map(([key, value]) => (
                        <Col xs={24} sm={12} md={8} lg={6} xl={4} key={key}>
                            <Card
                                hoverable
                                style={{
                                    borderRadius: 8,
                                    padding: '16px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
                                    height: '100%'
                                }}
                            >
                                <Statistic
                                    title={{
                                        total: 'Tổng tài sản',
                                        available: 'Tổng sản phẩm',
                                        inUse: 'Đang sử dụng',
                                        maintenance: 'Bảo hành',
                                        retired: 'Đã thanh lý'
                                    }[key]}
                                    value={value}
                                    valueStyle={{
                                        color: {
                                            total: '#1890ff',
                                            available: '#1890ff',
                                            inUse: '#52c41a',
                                            maintenance: '#faad14',
                                            retired: '#ff4d4f'
                                        }[key],
                                        fontSize: '28px',
                                        fontWeight: 'bold'
                                    }}
                                    prefix={{
                                        total: <BarChartOutlined style={{ marginRight: 8 }} />,
                                        available: <BarChartOutlined style={{ marginRight: 8 }} />,
                                        inUse: <PieChartOutlined style={{ marginRight: 8 }} />,
                                        maintenance: <FieldTimeOutlined style={{ marginRight: 8 }} />,
                                        retired: <FieldTimeOutlined style={{ marginRight: 8 }} />
                                    }[key]}
                                    suffix={key !== 'total' ? <span style={{ fontSize: '14px', color: '#888' }}>{`/${assetStats.total}`}</span> : undefined}
                                />
                            </Card>
                        </Col>
                    ))}

                    <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                        <Card
                            hoverable
                            style={{
                                borderRadius: 8,
                                padding: '16px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
                                height: '100%'
                            }}
                        >
                            <Statistic
                                title="Phiên kiểm kê"
                                value={inventoryStats.pending}
                                valueStyle={{ color: '#722ed1', fontSize: '28px', fontWeight: 'bold' }}
                                prefix={<ClusterOutlined style={{ marginRight: 8 }} />}
                                suffix={<span style={{ fontSize: '14px', color: '#888' }}>{`/${inventoryStats.total}`}</span>}
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
                    <Col xs={24} md={12}>
                        <Card
                            title={
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <PieChartOutlined style={{ marginRight: 8, color: '#ae8f3d' }} />
                                    <span style={{ color: '#333', fontWeight: 'bold' }}>Tài sản theo danh mục</span>
                                </div>
                            }
                            extra={
                                <Button
                                    type="link"
                                    onClick={() => navigate('/auth/docs/danh-sach-tai-san/list-asset')}
                                    icon={<ArrowRightOutlined />}
                                >
                                    Xem tất cả
                                </Button>
                            }
                            style={{
                                borderRadius: 8,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
                                height: '100%'
                            }}
                            headStyle={{ borderBottom: '2px solid #f0f0f0', padding: '12px 16px' }}
                            bodyStyle={{ padding: '0 16px' }}
                        >
                            <List
                                loading={loading}
                                dataSource={assetsByCategory}
                                renderItem={(item) => (
                                    <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar
                                                    size='large'
                                                    style={{
                                                        backgroundColor: '#ae8f3d',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    icon={item.icon}
                                                />
                                            }
                                            title={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>{item.category}</span>}
                                            description={`${item.count} tài sản`}
                                        />
                                        <div style={{
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            color: '#ae8f3d'
                                        }}>
                                            {((item.count / assetStats.total) * 100).toFixed(1)}%
                                        </div>
                                    </List.Item>
                                )}
                                locale={{ emptyText: <Empty description="Danh sách trống !" /> }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card
                            title={
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <FieldTimeOutlined style={{ marginRight: 8, color: '#ae8f3d' }} />
                                    <span style={{ color: '#333', fontWeight: 'bold' }}>Hoạt động gần đây</span>
                                </div>
                            }
                            style={{
                                borderRadius: 8,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
                                height: '100%'
                            }}
                            headStyle={{ borderBottom: '2px solid #f0f0f0', padding: '12px 16px' }}
                            bodyStyle={{ padding: '0 16px' }}
                        >
                            <List
                                dataSource={recentActivity.slice(0, 3)}
                                loading={loading}
                                renderItem={(item) => (
                                    <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar
                                                    style={{
                                                        backgroundColor: item.type === 'retire' ? '#ff4d4f' : '#1890ff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    {item.type === 'retire' ? 'TL' : 'KK'}
                                                </Avatar>
                                            }
                                            title={<span style={{ fontSize: '15px', fontWeight: 'bold' }}>{getActivityText(item)}</span>}
                                            description={<><FieldTimeOutlined style={{ marginRight: 5, fontSize: 11 }} />{moment(item.date).format('DD-MM-YYYY')}</>}
                                        />
                                    </List.Item>
                                )}
                                locale={{ emptyText: <Empty description="Danh sách trống !" /> }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
                    <Col xs={24} md={12}>
                        <Card
                            title={
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <FieldTimeOutlined style={{ marginRight: 8, color: '#ae8f3d' }} />
                                    <span style={{ color: '#333', fontWeight: 'bold' }}>Tình trạng bảo hành sắp tới</span>
                                </div>
                            }
                            extra={
                                <Button
                                    type="link"
                                    onClick={() => navigate('/auth/docs/danh-sach-tai-san/bao-hanh')}
                                    icon={<ArrowRightOutlined />}
                                >
                                    Xem tất cả
                                </Button>
                            }
                            style={{
                                borderRadius: 8,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.09)'
                            }}
                            headStyle={{ borderBottom: '2px solid #f0f0f0', padding: '12px 16px' }}
                        >
                            <Table
                                dataSource={upcomingMaintenance}
                                rowKey="id"
                                pagination={false}
                                bordered={false}
                                loading={loading}
                                locale={{ emptyText: <Empty description="Danh sách trống !" /> }}
                                scroll={{ x: true }}
                                style={{ width: "100%", whiteSpace: "nowrap" }}
                                columns={[
                                    {
                                        title: 'Mã tài sản',
                                        dataIndex: 'assetTag',
                                        key: 'assetTag',
                                        render: (text) => (
                                            <span style={{ fontWeight: 'bold' }}>{text}</span>
                                        )
                                    },
                                    {
                                        title: 'Tên thiết bị',
                                        dataIndex: 'name',
                                        key: 'name',
                                        ellipsis: true
                                    },
                                    {
                                        title: 'Ngày hết hạn',
                                        dataIndex: 'dueDate',
                                        key: 'dueDate'
                                    },
                                    {
                                        title: 'Trạng thái',
                                        dataIndex: 'status',
                                        key: 'status',
                                        render: (status) => (
                                            <Tag
                                                color={getStatusColor(status)}
                                                style={{
                                                    borderRadius: '4px',
                                                    padding: '2px 8px'
                                                }}
                                            >
                                                {status === 'Critical' ? 'Gấp' : 'Sắp hết hạn'}
                                            </Tag>
                                        ),
                                    },
                                ]}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card
                            title={
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <FieldTimeOutlined style={{ marginRight: 8, color: '#ae8f3d' }} />
                                    <span style={{ color: '#333', fontWeight: 'bold' }}>Bảo hành sắp hết hạn</span>
                                </div>
                            }
                            extra={
                                <Button
                                    type="link"
                                    onClick={() => navigate('/auth/docs/danh-sach-tai-san/bao-hanh')}
                                    icon={<ArrowRightOutlined />}
                                >
                                    Xem tất cả
                                </Button>
                            }
                            style={{
                                borderRadius: 8,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.09)'
                            }}
                            headStyle={{ borderBottom: '2px solid #f0f0f0', padding: '12px 16px' }}
                        >
                            <Table
                                dataSource={expiringWarranties}
                                rowKey="id"
                                pagination={false}
                                bordered={false}
                                loading={loading}
                                scroll={{ x: true }}
                                locale={{ emptyText: <Empty description="Danh sách trống !" /> }}
                                style={{ width: "100%", whiteSpace: "nowrap" }}
                                columns={[
                                    {
                                        title: 'Tên tài sản',
                                        dataIndex: 'name',
                                        key: 'name',
                                        ellipsis: true,
                                        render: (text) => (
                                            <span style={{ fontWeight: 'bold' }}>{text}</span>
                                        )
                                    },
                                    {
                                        title: 'Ngày hết hạn',
                                        dataIndex: 'expiry',
                                        key: 'expiry'
                                    },
                                    {
                                        title: 'Số lượng',
                                        dataIndex: 'seats',
                                        key: 'seats'
                                    },
                                    {
                                        title: 'Trạng thái',
                                        dataIndex: 'status',
                                        key: 'status',
                                        render: (status) => (
                                            <Tag
                                                color={getStatusColor(status)}
                                                style={{
                                                    borderRadius: '4px',
                                                    padding: '2px 8px'
                                                }}
                                            >
                                                {status === 'Critical' ? 'Gấp' : 'Sắp hết hạn'}
                                            </Tag>
                                        ),
                                    },
                                ]}
                            />
                        </Card>
                    </Col>
                </Row>
            </>
        </div>
    );
};

export default Dashboard;