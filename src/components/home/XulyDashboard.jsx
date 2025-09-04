import React, { useState, useEffect, useCallback } from 'react';
import { List, Avatar, Empty, Spin, Tag, Space, Tooltip } from 'antd';
import axios from 'axios';
import { FieldTimeOutlined, SyncOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Avatars from '../../config/design/Avatars';
import { useNavigate } from 'react-router-dom';
import UserInfoCard from '../../hook/UserInfoCard';

const XulyDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);
    const [initialFetchDone, setInitialFetchDone] = useState(false);
    const pageSize = 6;

    // Fetch data from the API
    const fetchData = useCallback(
        async (pageToFetch, isLoadMore = false) => {
            if (loading || loadingMore) {
                return;
            }

            try {
                if (!isLoadMore) {
                    setLoading(true);
                } else {
                    setLoadingMore(true);
                }

                const response = await axios.get('/traloi/response-counts-and-data', {
                    headers: {
                        Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
                    },
                    params: {
                        page: pageToFetch,
                        pageSize,
                        user: JSON.stringify(user),
                    },
                });

                const { success, data: newData, total } = response.data;

                if (!success) {
                    throw new Error('Failed to fetch data from server');
                }

                setData(prevData => (isLoadMore ? [...prevData, ...newData] : newData));
                setHasMore(newData.length > 0 && pageToFetch * pageSize < total);
                setInitialFetchDone(true);
            } catch (err) {
                setError(err.message || 'An unexpected error occurred');
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [user, loading, loadingMore]
    );

    // Filter data based on user.phanquyen
    const filterData = useCallback(() => {
        if (user.phanquyen === true || user.phanquyen === 'Xử lý yêu cầu') {
            setFilteredData(data);
        } else {
            const userKeysArray = Array.isArray(user.keys) ? user.keys : [user.keys].filter(Boolean);
            const filtered = data.filter((item) => {
                const keysJSON = item.keysJSON ? [item.keysJSON] : [];
                const hasMatchingKey = keysJSON.some((key) => userKeysArray.includes(key));
                // Chỉ hiển thị các yêu cầu có yeucauxuly: true (để chắc chắn, mặc dù backend đã lọc)
                return (item.status === 'assigned' || hasMatchingKey) && item.yeucauxuly === true;
            });
            setFilteredData(filtered);
        }
    }, [data, user.phanquyen, user.keys]);

    // Initial data fetch only once
    useEffect(() => {
        if (!initialFetchDone && !loading) {
            fetchData(1);
        }
    }, [fetchData, initialFetchDone, loading]);

    // Update filtered data whenever data or user.phanquyen changes
    useEffect(() => {
        filterData();
    }, [data, filterData]);

    // Handle scroll to load more
    const onScroll = useCallback(
        (e) => {
            if (loadingMore || !hasMore || loading) return;

            const { scrollTop, scrollHeight, clientHeight } = e.target;
            if (scrollTop + clientHeight >= scrollHeight - 5) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchData(nextPage, true);
            }
        },
        [loadingMore, hasMore, loading, page, fetchData]
    );

    // Render avatar with Tooltip and conditional logic
    const renderAvatar = (keysJSON, imgAvatar, name, item) => {
        // Construct user object for UserInfoCard
        const userForCard = {
            name: name || 'Unknown User',
            username: item?.username || 'N/A',
            imgAvatar: imgAvatar || null,
            keys: keysJSON || 'N/A',
            email: item?.email || null,
            chucvu: item?.chucvu || null,
            chinhanh: item?.chinhanh || 'N/A',
            bophan: item?.bophan || 'N/A',
            locker: item?.locker || false,
            imgBackground: item?.imgBackground || null,
        };

        return (
            <Tooltip
                title={<UserInfoCard user={userForCard} />}
                placement={window.innerWidth < 768 ? 'top' : 'right'}
                color="white"
                overlayStyle={{ maxWidth: 300 }}
                trigger="hover"
                mouseEnterDelay={0.1}
                mouseLeaveDelay={0.2}
            >
                <span className="avatar-container" style={{ display: 'inline-block', cursor: 'pointer' }}>
                    {imgAvatar && imgAvatar !== 'null' && imgAvatar !== null ? (
                        <Avatar
                            src={imgAvatar}
                            size="large"
                            style={{ marginRight: 8, pointerEvents: 'auto' }}
                        />
                    ) : (
                        <span style={{ marginRight: 8, pointerEvents: 'auto' }}>
                            <Avatars user={{ name: name || 'Unknown' }} sizeImg="large" />
                        </span>
                    )}
                </span>
            </Tooltip>
        );
    };

    // Render status
    const renderStatus = (status, thoigianxuly) => {
        switch (status) {
            case 'overdue':
                return (
                    <Tag color="red" icon={<CloseCircleOutlined />}>
                        Quá hạn {window.innerWidth < 768 ? <br /> : ' '} {thoigianxuly}
                    </Tag>
                );
            case 'assigned':
                return (
                    <Tag color="purple" icon={<SyncOutlined />}>
                        Được gán
                    </Tag>
                );
            case 'pending':
                return (
                    <Tag color="orange" icon={<SyncOutlined />}>
                        Chờ xử lý
                    </Tag>
                );
            default:
                return null;
        }
    };

    // Error handling
    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: 20 }}>
                <Empty description={`Đã xảy ra lỗi: ${error}`} />
            </div>
        );
    }

    // Initial loading state
    if (loading && !initialFetchDone) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '20vh' }}>
                <Spin spinning={true} />
            </div>
        );
    }

    // Empty state handling
    if (initialFetchDone && filteredData.length === 0) {
        return <Empty description="Không có yêu cầu nào cần xử lý." />;
    }

    return (
        <Spin spinning={loading} size="small">
            <List
                style={{ height: '34vh', overflow: 'auto' }}
                dataSource={filteredData}
                onScroll={onScroll}
                renderItem={(item) => (
                    <List.Item
                        onClick={async () => {
                            try {
                                await axios.put(
                                    `/traloi/update/${item.responseId}`,
                                    { watching: [...new Set([...(item.watching || []), user.keys])] },
                                    {
                                        headers: {
                                            Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
                                        },
                                    }
                                );
                                // Navigate to the response
                                navigate(`/auth/docs/form/views/${item.responseId}`);
                            } catch (err) {
                                console.error('Error updating watching:', err);
                                setError('Không thể cập nhật trạng thái xem, vui lòng thử lại');
                            }
                        }}
                        style={{ cursor: 'pointer' }}
                        actions={[
                            <span key="time" style={{ fontSize: 11 }} className="hidden__niso_time">
                                <FieldTimeOutlined /> {item.ngay_phan_hoi}
                            </span>,
                        ]}
                    >
                        <List.Item.Meta
                            avatar={renderAvatar(item.keysJSON, item.imgAvatar, item.name, item)}
                            title={<div className="gon_nisso">{item.title || 'Untitled'}</div>}
                            description={<Space direction="vertical">{renderStatus(item.status, item.thoigianxuly)}</Space>}
                        />
                    </List.Item>
                )}
            >
                {loadingMore && (
                    <div style={{ textAlign: 'center', padding: 10 }}>
                        <Spin size="small" />
                    </div>
                )}
            </List>
        </Spin>
    );
};

export default React.memo(XulyDashboard);