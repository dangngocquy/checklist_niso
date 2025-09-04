import React, { useState, useEffect, useCallback } from 'react';
import {
    Tag,
    Button,
    Skeleton,
    Card,
    Empty,
    Typography,
    Divider,
    Space,
    Timeline,
    List,
    Avatar
} from 'antd';
import {
    PiGoogleChromeLogo
} from "react-icons/pi";
import {
    ClockCircleOutlined,
    LoadingOutlined,
    EnvironmentOutlined,
    DesktopOutlined,
    ApiOutlined,
    EyeOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const LichsuLogin = React.memo(({ user, t, deviceInfo, browser, country, locations }) => {
    const [loginHistory, setLoginHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleItems, setVisibleItems] = useState(5);
    const [loadingMore, setLoadingMore] = useState(false);

    const parseCustomDate = (dateString) => {
        // Check if dateString is valid and a string
        if (!dateString || typeof dateString !== 'string') {
            console.warn('Invalid date string:', dateString);
            return new Date(0); // Fallback to epoch (1970-01-01)
        }

        // Validate format: YYYY-MM-DD HH:mm:ss
        const regex = /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})$/;
        const match = dateString.match(regex);

        if (!match) {
            console.warn('Date string format invalid:', dateString);
            return new Date(0);
        }

        const [, year, month, day, hour, minute, second] = match;

        // Convert to numbers
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10) - 1; // JavaScript months are 0-based
        const dayNum = parseInt(day, 10);
        const hourNum = parseInt(hour, 10);
        const minuteNum = parseInt(minute, 10);
        const secondNum = parseInt(second, 10);

        // Validate ranges
        if (
            isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum) ||
            isNaN(hourNum) || isNaN(minuteNum) || isNaN(secondNum) ||
            dayNum < 1 || dayNum > 31 ||
            monthNum < 0 || monthNum > 11 ||
            yearNum < 1970 || // Adjust based on your needs
            hourNum < 0 || hourNum > 23 ||
            minuteNum < 0 || minuteNum > 59 ||
            secondNum < 0 || secondNum > 59
        ) {
            console.warn('Invalid date components:', dateString);
            return new Date(0);
        }

        const date = new Date(yearNum, monthNum, dayNum, hourNum, minuteNum, secondNum);

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            console.warn('Parsed date is invalid:', dateString);
            return new Date(0);
        }

        return date;
    };

    const fetchLoginHistory = useCallback(async () => {
        try {
            const response = await axios.get(`/history/login`, {
                params: { keys: user.keys },
                headers: {
                    'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`
                }
            });

            // Filter out invalid entries
            const validData = response.data.filter(item => {
                if (!item.Thoigian) {
                    console.warn('Missing Thoigian field:', item);
                    return false;
                }
                const date = parseCustomDate(item.Thoigian);
                if (date.getTime() === 0) {
                    console.warn('Skipping invalid date:', item);
                    return false;
                }
                return true;
            });

            setLoginHistory(validData); // Backend already sorts by Thoigian descending
            setLoading(false);
        } catch (error) {
            console.error('Error fetching login history:', error);
            setLoading(false);
        }
    }, [user.keys]);

    useEffect(() => {
        fetchLoginHistory();
    }, [fetchLoginHistory]);

    const formatDate = (dateString) => {
        const date = parseCustomDate(dateString);
        if (date.getTime() === 0) {
            return 'Invalid Date'; // Display placeholder for invalid dates
        }
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/\//g, '-');
    };

    const loadMore = async () => {
        setLoadingMore(true);
        setTimeout(() => {
            setVisibleItems(prevItems => prevItems + 5);
            setLoadingMore(false);
        }, 1000);
    };

    const getIconForDevice = (deviceType) => {
        return <DesktopOutlined style={{ fontSize: '16px' }} />;
    };

    const getIconForOS = (os) => {
        return <ApiOutlined style={{ fontSize: '16px' }} />;
    };

    const getIconForBrowser = () => {
        return <PiGoogleChromeLogo style={{ fontSize: '16px' }} />;
    };

    const getIconForLocation = () => {
        return <EnvironmentOutlined style={{ fontSize: '16px' }} />;
    };

    return (
        <div style={{ padding: 8, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <title>NISO CHECKLIST | {t('ViewDocs.input18')}</title>
            <Card bordered={false} style={{ maxWidth: '800px', margin: '0 auto', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <Title level={2} style={{ marginBottom: 0, color: '#ae8f3d' }}>
                    {t('Department.input198')}
                </Title>
                <Divider style={{ margin: '12px 0 24px 0' }} />

                <Card
                    title={
                        <Space>
                            <EyeOutlined style={{ color: '#ae8f3d' }} />
                            <Text strong>{t('Profile.input25')}</Text>
                        </Space>
                    }
                    bordered={false}
                    style={{ marginBottom: 24, backgroundColor: '#f9f9f9', borderRadius: '8px' }}
                >
                    <List
                        itemLayout="horizontal"
                        dataSource={[
                            {
                                icon: getIconForDevice(deviceInfo.type),
                                title: t('Profile.input29'),
                                description: `${deviceInfo.type} - ${deviceInfo.brand}`
                            },
                            {
                                icon: getIconForOS(deviceInfo.os),
                                title: t('Department.input197'),
                                description: deviceInfo.os
                            },
                            {
                                icon: getIconForBrowser(),
                                title: t('Profile.input28'),
                                description: browser
                            },
                            {
                                icon: getIconForLocation(),
                                title: t('Profile.input25'),
                                description: locations !== 'Unknown'
                                    ? `${locations} - ${country}`
                                    : <Tag color="red" bordered={false}>{t('Department.input173')}</Tag>
                            }
                        ]}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Avatar icon={item.icon} style={{ backgroundColor: '#edecdf', color: '#ae8f3d' }} />}
                                    title={<Text strong>{item.title}</Text>}
                                    description={item.description}
                                />
                            </List.Item>
                        )}
                    />
                </Card>

                <Title level={2} style={{ marginBottom: 16, color: '#ae8f3d' }}>
                    {t('ViewDocs.input18')}
                </Title>

                {loading ? (
                    <Skeleton active paragraph={{ rows: 6 }} />
                ) : loginHistory.length === 0 ? (
                    <Empty
                        description={<Text type="secondary">Không có lịch sử đăng nhập.</Text>}
                        style={{ padding: 32 }}
                    />
                ) : (
                    <Timeline
                        mode="left"
                        style={{ marginTop: 32, padding: '0 16px' }}
                    >
                        {loginHistory.slice(0, visibleItems).map((item, index) => (
                            <Timeline.Item
                                key={index}
                                dot={<ClockCircleOutlined style={{ fontSize: '16px', color: '#ae8f3d' }} />}
                                color="blue"
                            >
                                <Card
                                    size="small"
                                    title={
                                        <Text strong style={{ color: '#ae8f3d' }}>
                                            {formatDate(item.Thoigian)}
                                        </Text>
                                    }
                                    style={{
                                        marginBottom: 16,
                                        borderRadius: '8px',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}
                                    bodyStyle={{ padding: 16 }}
                                >
                                    <List
                                        size="small"
                                        itemLayout="horizontal"
                                        dataSource={
                                            [
                                                {
                                                    icon: getIconForDevice(item.Thietbi),
                                                    title: t('Profile.input29'),
                                                    description: item.Thietbi
                                                },
                                                {
                                                    icon: getIconForOS(item.Hedieuhanh),
                                                    title: t('Department.input197'),
                                                    description: item.Hedieuhanh
                                                },
                                                {
                                                    icon: getIconForBrowser(),
                                                    title: t('Profile.input28'),
                                                    description: item.Trinhduyet
                                                },
                                                {
                                                    icon: getIconForLocation(),
                                                    title: t('Profile.input25'),
                                                    description: item.Vitri !== t('Department.input173')
                                                        ? item.Vitri
                                                        : <Tag color="red" bordered={false}>{t('Department.input173')}</Tag>
                                                }
                                            ]
                                        }
                                        renderItem={(listItem) => (
                                            <List.Item style={{ padding: '4px 0' }}>
                                                <Space>
                                                    {listItem.icon}
                                                    <Text type="secondary">{listItem.title}:</Text>
                                                    <Text>{listItem.description}</Text>
                                                </Space>
                                            </List.Item>
                                        )}
                                    />
                                </Card>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                )}

                {!loading && loginHistory.length > 0 && visibleItems < loginHistory.length && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                        <Button
                            type="primary"
                            onClick={loadMore}
                            loading={loadingMore}
                            icon={loadingMore ? <LoadingOutlined /> : null}
                        >
                            {t('Profile.input32')}
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
});

export default LichsuLogin;