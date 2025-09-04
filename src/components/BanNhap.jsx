import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, List, Button, message, Empty, Row, Col, Modal, Tooltip, Skeleton, Input, Dropdown, Menu } from "antd";
import Nen from '../assets/shop.png';
import { useNavigate } from "react-router-dom";
import {
    EditOutlined,
    SendOutlined,
    DeleteOutlined,
    AppstoreOutlined,
    EyeOutlined,
    UnorderedListOutlined,
    PlusCircleOutlined,
    EllipsisOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import useApi from "../hook/useApi";
import NotFoundPage from "./NotFoundPage";

function BanNhap({ user, t, hasCreatePermission }) {
    const navigate = useNavigate();
    const { updateChecklist, deleteChecklist, fetchSavedChecklistsByUserKeys } = useApi();
    const [data, setData] = useState([]);
    const [isGridView, setIsGridView] = useState(true);
    const [publishModalVisible, setPublishModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleDropdown, setVisibleDropdown] = useState(null);

    const fetchData = useCallback(async (pageNum = 1) => {
        try {
            setLoading(pageNum === 1);
            setLoadingMore(pageNum !== 1);
            const response = await fetchSavedChecklistsByUserKeys(user.keys, pageNum, 8);

            console.log('Dữ liệu API trả về:', response); // Debug
            const dataArray = Array.isArray(response.data) ? response.data : [];
            console.log('Dữ liệu sau khi xử lý:', dataArray);

            if (pageNum === 1) {
                setData(dataArray);
            } else {
                setData(prevData => [...prevData, ...dataArray]);
            }
            setHasMore(response.hasMore);
            setPage(pageNum);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [fetchSavedChecklistsByUserKeys, user.keys]);

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore) {
            fetchData(page + 1);
        }
    }, [loadingMore, hasMore, fetchData, page]);

    const observer = useRef();
    const lastElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore, loadMore]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleView = () => {
        setIsGridView(!isGridView);
    };

    const showPublishModal = (id) => {
        setSelectedItemId(id);
        setPublishModalVisible(true);
    };

    const handlePublish = async () => {
        try {
            await updateChecklist(selectedItemId, { nhap: false });
            message.success(t('Department.input185'));
            setPublishModalVisible(false);
            fetchData();
        } catch (error) {
            console.error("Error publishing:", error);
            message.error("Failed to publish");
        }
    };

    const showDeleteModal = (id) => {
        setSelectedItemId(id);
        setDeleteModalVisible(true);
    };

    const handleDelete = async () => {
        try {
            await deleteChecklist(selectedItemId);
            message.success(t('ListDocs.input3'));
            setDeleteModalVisible(false);
            fetchData();
        } catch (error) {
            console.error("Error deleting:", error);
            message.error("Failed to delete");
        }
    };

    const ClickHome = (id) => {
        navigate(`/auth/docs/form/${id}`);
    };

    const ClickEdit = (id) => {
        navigate(`/auth/docs/form/edit/${id}`);
    };

    const filteredData = data.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderItem = (item, index) => {
        const isLastElement = index === filteredData.length - 1;

        const menu = (
            <Menu>
                <Menu.Item key="views" icon={<EyeOutlined />} onClick={() => ClickHome(item.id)}>
                    View
                </Menu.Item>
                <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => ClickEdit(item.id)}>
                    Edit
                </Menu.Item>
                <Menu.Item key="delete" danger icon={<DeleteOutlined />} onClick={() => showDeleteModal(item.id)}>
                    Delete
                </Menu.Item>
            </Menu>
        );

        const publishButton = (
            <Button onClick={() => showPublishModal(item.id)} type='primary' icon={<SendOutlined />}  style={{ marginLeft: '15px' }}>
                {t('Department.input186')}
            </Button>
        );

        const cardContent = (
            <>
                <Card.Meta
                    title={item.title || 'Untitled'}
                    description={
                        <span style={{ fontSize: 11 }}>
                            {item.TimeSaveNhap ? `Lưu nháp: ${item.TimeSaveNhap}` : 'Chưa lưu nháp'}
                        </span>
                    }
                />
            </>
        );

        const skeletonContent = (
            <Skeleton active paragraph={{ rows: 2 }} />
        );

        return isGridView ? (
            <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} style={{ marginBottom: 16 }} ref={isLastElement ? lastElementRef : null}>
                <Card
                    cover={
                        <img
                            alt={item.title}
                            src={item.background || Nen}
                            style={{ height: '150px', objectFit: 'cover' }}
                        />
                    }
                    actions={[
                        publishButton,
                        <Dropdown
                            overlay={menu}
                            trigger={['click']}
                            onVisibleChange={(visible) => setVisibleDropdown(visible ? item.id : null)}
                            visible={visibleDropdown === item.id}
                        >
                            <Button icon={<EllipsisOutlined />} >{t('Department.input187')}</Button>
                        </Dropdown>
                    ]}
                    hoverable
                >
                    {loading ? skeletonContent : cardContent}
                </Card>
            </Col>
        ) : (
            <List.Item
                ref={isLastElement ? lastElementRef : null}
                style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#fff', boxShadow: 'var(--main-boxshadow)', padding: 16, overflow: 'hidden', marginBottom: 15 }}
                actions={[
                    <Button onClick={() => showPublishModal(item.id)} type='primary' icon={<SendOutlined />}>
                        {t('Department.input186')}
                    </Button>,
                    <Dropdown
                        overlay={menu}
                        trigger={['click']}
                        onVisibleChange={(visible) => setVisibleDropdown(visible ? item.id : null)}
                        visible={visibleDropdown === item.id}
                    >
                        <Button icon={<EllipsisOutlined />} style={{ marginTop: 8 }}>
                            {t('Department.input187')}
                        </Button>
                    </Dropdown>
                ]}
                extra={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <img
                alt={item.title || t('Misc.document')}
                src={item.background || Nen}
                style={{ height: window.innerWidth < 768 ? '100%' : 120, objectFit: 'cover', overflow: 'hidden', width: '100%' }}
              />
                    </div>
                }
            >
                {loading ? (
                    <Skeleton active avatar paragraph={{ rows: 2 }} />
                ) : (
                    <div style={{ flex: 1 }}>
                        <List.Item.Meta
                            title={item.title || 'Untitled'}
                            description={
                                <span style={{ fontSize: 11 }}>
                                    {item.TimeSaveNhap ? `Lưu nháp: ${item.TimeSaveNhap}` : 'Chưa lưu nháp'}
                                </span>
                            }
                        />
                    </div>
                )}
            </List.Item>
        );
    };

    const handleClick = useCallback(async () => {
        if (hasCreatePermission) {
            navigate("/auth/docs/create");
        } else {
            Modal.warning({
                title: 'Thông báo',
                content: 'Bạn không có quyền sử dụng chức năng này.',
                okButtonProps: {
                    style: {
                        backgroundColor: '#ae8f3d',
                    }
                },
            });
        }
    }, [ navigate, hasCreatePermission]);

    if (!hasCreatePermission) {
        return <NotFoundPage />;
    }

    return (
        <div style={{ padding: 20 }} className="layout__container">
            <title>NISO CHECKLIST | {t('Department.input263')}</title>
            <div style={{ marginBottom: 16, textAlign: 'right', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: 18, textTransform: 'uppercase' }}>{t('Department.input188')}</span>
                <Tooltip title={isGridView ? t('Department.input169') : t('Department.input170')}>
                    <Button
                        icon={isGridView ? <AppstoreOutlined /> : <UnorderedListOutlined />}
                        onClick={toggleView}
                        size="middle"
                    />
                </Tooltip>
            </div>
            <Input
                placeholder={t('Department.input190')}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ marginBottom: 16 }}
                size="middle"
                prefix={<SearchOutlined />}
            />
            {loading && filteredData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    <Skeleton active avatar paragraph={{ rows: 4 }} />
                </div>
            ) : filteredData.length === 0 ? (
                <Empty description={t('Department.input189')}>
                    <Button type='primary' icon={<PlusCircleOutlined />} onClick={handleClick}>{t('Phanquyen.input40')}</Button>
                </Empty>
            ) : isGridView ? (
                <Row gutter={[16, 16]}>
                    {filteredData.map((item, index) => renderItem(item, index))}
                </Row>
            ) : (
                <List
                    itemLayout="vertical"
                    dataSource={filteredData}
                    renderItem={(item, index) => renderItem(item, index)}
                />
            )}
            {loadingMore && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Skeleton active avatar paragraph={{ rows: 1 }} />
                </div>
            )}
            <Modal
                title={t('Department.input191')}
                visible={publishModalVisible}
                onOk={handlePublish}
                onCancel={() => setPublishModalVisible(false)}
                okText={t('Department.input186')}
                cancelText="Cancel"
                destroyOnClose
                footer={[
                    <Button key="back" onClick={() => setPublishModalVisible(false)}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" loading={loading} onClick={handlePublish}>
                        {t('Department.input186')}
                    </Button>,
                ]}
            >
                <p>{t('Department.input192')}</p>
            </Modal>
            <Modal
                title={t('Department.input193')}
                visible={deleteModalVisible}
                onOk={handleDelete}
                onCancel={() => setDeleteModalVisible(false)}
                okText="OK"
                cancelText="Cancel"
                destroyOnClose
            >
                <p>{t('Department.input194')}</p>
            </Modal>
        </div>
    );
}

export default BanNhap;