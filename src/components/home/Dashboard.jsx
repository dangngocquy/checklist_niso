import React, { useState, useEffect, memo } from 'react';
import {
    Carousel,
    Card,
    Layout,
    Typography,
    Row,
    Col,
    Button,
    Modal,
    Upload,
    Input,
    Form,
    message,
    Progress,
    Popconfirm,
    Skeleton,
    Divider,
    Drawer,
} from 'antd';
import {
    PlusOutlined,
    FieldTimeOutlined,
    EditOutlined,
    DeleteOutlined,
    InboxOutlined,
    ContainerOutlined,
    FileProtectOutlined,
    ArrowRightOutlined,
    BarChartOutlined,
    LockOutlined,
} from '@ant-design/icons';
import ChamCong from '../chamcong/ChamCong'; // Adjust path as needed
import axios from 'axios';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { imageDb } from '../../config'; // Adjust path as needed
import slnen from '../../assets/shop.png'; // Adjust path as needed
import { v4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import ChecklistGiao from './ChecklistGiao'; // Adjust path as needed
import XulyDashboard from './XulyDashboard'; // Adjust path as needed
import Baocao from './Baocao'; // Adjust path as needed
import QuickAccessCard from './QuickAccessCard';
const { Content } = Layout;
const { Dragger } = Upload;

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
const allowedVideoTypes = ['video/mp4', 'video/quicktime'];

const styles = {
    dashboardLayout: {
        minHeight: '100vh',
        background: '#f0f2f5'
    },
    carouselCard: {
        borderRadius: 8,
        overflow: 'hidden'
    },
    carouselContent: {
        position: 'relative',
        height: 400
    },
    carouselImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    carouselOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        textAlign: 'center'
    },
    carouselActions: {
        bottom: 20,
        left: 20,
        display: 'flex',
        gap: 8,
        position: 'absolute',
        zIndex: 99,
    },
    addSlideButton: {
        margin: 16,
        display: 'flex',
        justifyContent: 'flex-end'
    },
    cardTitleWithIcon: {
        display: 'flex',
        alignItems: 'center',
        fontWeight: 600,
        gap: 8
    },
    contentCard: {
        height: '100%'
    },
    scrollableContent: {
        height: 300,
        overflowY: 'scroll',
        paddingRight: 8,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        '&::-webkit-scrollbar': {
            display: 'none'
        }
    },
    sidebarCard: {
        marginBottom: 16,
        height: '100%'
    },
    lockedFeature: {
        textAlign: 'center',
        padding: 16
    },
    lockIcon: {
        fontSize: 48,
        color: '#ff4d4f',
        marginBottom: 16
    },
    lockMessage: {
        fontSize: 14
    },
    drawerBody: {
        padding: 0
    },
    mobileChamCongButton: {
        width: '100%',
        marginTop: 16
    },
    stickySidebarWrapper: {
        position: 'sticky',
        top: 84,
    }
};

const DashboardSkeleton = () => (
    <div>
        <Row gutter={[24, 24]}>
            <Col span={24}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                        <Skeleton.Image active style={{ width: '100%', height: 400, borderRadius: 8 }} />
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card bordered={false}>
                            <Skeleton active paragraph={{ rows: 6 }} />
                        </Card>
                        <Card style={{ marginTop: 16 }} bordered={false}>
                            <Skeleton active paragraph={{ rows: 3 }} />
                        </Card>
                    </Col>
                </Row>
            </Col>
            <Col xs={24} lg={16}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                        <Card bordered={false}>
                            <Skeleton active paragraph={{ rows: 2 }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Card bordered={false}>
                            <Skeleton active paragraph={{ rows: 2 }} />
                        </Card>
                    </Col>
                </Row>
                <Card style={{ marginTop: 16 }} bordered={false}>
                    <Skeleton active paragraph={{ rows: 4 }} />
                </Card>
            </Col>
            <Col xs={24} lg={8}>
                <Card bordered={false}>
                    <Skeleton active paragraph={{ rows: 6 }} />
                </Card>
                <Card style={{ marginTop: 16 }} bordered={false}>
                    <Skeleton active paragraph={{ rows: 3 }} />
                </Card>
            </Col>
        </Row>
    </div>
);

const ChamCongCard = memo(({ user, locations, country, hasCCPermission }) => (
    hasCCPermission ? (
        <Card
            title={
                <div style={styles.cardTitleWithIcon}>
                    <FieldTimeOutlined />
                    <span>CHẤM CÔNG</span>
                </div>
            }
            style={styles.sidebarCard}
            bordered={false}
        >
            <ChamCong
                user={user}
                locations={locations}
                country={country}
                getStyle={() => ({})}
                hasCCPermission={hasCCPermission}
            />
        </Card>
    ) : (
        <Card style={styles.sidebarCard} bordered={false}>
            <div style={styles.lockedFeature}>
                <LockOutlined style={styles.lockIcon} />
                <Typography.Title level={4}>Chức năng chấm công đã bị khóa</Typography.Title>
                <Typography.Paragraph type="secondary">
                    Hiện tại bạn không thể sử dụng chức năng chấm công
                </Typography.Paragraph>
                <Divider />
                <Typography.Paragraph type="secondary" style={styles.lockMessage}>
                    Nếu bạn cho rằng đây là sự cố, vui lòng liên hệ với quản trị viên để được hỗ trợ.
                </Typography.Paragraph>
            </div>
        </Card>
    )
), (prevProps, nextProps) => {
    return prevProps.user === nextProps.user &&
        prevProps.locations === nextProps.locations &&
        prevProps.country === nextProps.country &&
        prevProps.hasCCPermission === nextProps.hasCCPermission;
});

const Dashboard = ({ user, locations, country, hasCCPermission, hasxlphPermission, customShortcuts }) => {
    const navigate = useNavigate();
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [carouselData, setCarouselData] = useState([]);
    const [isCarouselModalVisible, setIsCarouselModalVisible] = useState(false);
    const [editingCarousel, setEditingCarousel] = useState(null);
    const [form] = Form.useForm();
    const [uploadProgress, setUploadProgress] = useState(0);
    const [pageLoading, setPageLoading] = useState(true);
    const [addLoading, setAddLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [shortcuts, setShortcuts] = useState(customShortcuts);

    useEffect(() => {
        fetchCarouselData();
    }, []);

    const fetchCarouselData = async () => {
        setPageLoading(true);
        try {
            const response = await axios.get('/slider/all', {
                headers: {
                    'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
                }
            });
            setCarouselData(response.data.length > 0 ? response.data : [{ id: 'default', title: 'WELCOME TO NISO CHECKLIST', imageUrl: slnen }]);
        } catch (error) {
            console.error('Error fetching carousel data:', error);
            setCarouselData([{ id: 'default', title: 'WELCOME TO NISO CHECKLIST', imageUrl: slnen }]);
        } finally {
            setPageLoading(false);
        }
    };

    const showCarouselModal = (item = null) => {
        setEditingCarousel(item);
        form.resetFields();
        setSelectedFile(null);
        if (item) {
            form.setFieldsValue({ title: item.title });
        }
        setIsCarouselModalVisible(true);
        setUploadProgress(0);
    };

    const handleCarouselModalOk = () => {
        form.submit();
    };

    const handleCarouselModalCancel = () => {
        setIsCarouselModalVisible(false);
        setEditingCarousel(null);
        setSelectedFile(null);
        setUploadProgress(0);
        setAddLoading(false);
        setEditLoading(false);
    };

    const uploadFileToFirebase = async (file) => {
        if (!file) return null;
        const storageRef = ref(imageDb, `CHECKLISTNISO/${v4()}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => reject(error),
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                }
            );
        });
    };

    const onFinish = async (values) => {
        const { title } = values;
        const isEditing = !!editingCarousel;
        isEditing ? setEditLoading(true) : setAddLoading(true);

        try {
            let imageUrl = editingCarousel?.imageUrl;

            if (selectedFile) {
                if (!allowedImageTypes.includes(selectedFile.type) && !allowedVideoTypes.includes(selectedFile.type)) {
                    message.error('Chỉ hỗ trợ hình ảnh hoặc video (JPEG, PNG, GIF, MP4, QuickTime)!');
                    return;
                }
                imageUrl = await uploadFileToFirebase(selectedFile);
            }

            if (!imageUrl && !editingCarousel) {
                message.warning('Vui lòng chọn một hình ảnh hoặc video.');
                return;
            }

            const formattedTitle = title || '';
            const headers = { 'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}` };
            const currentDate = new Date().toISOString().replace('T', ' ').substring(0, 19);

            if (editingCarousel) {
                const updatedSlider = {
                    id: editingCarousel.id,
                    title: formattedTitle,
                    imageUrl,
                    date: currentDate
                };
                await axios.put(`/slider/${editingCarousel.id}`, { title: formattedTitle, imageUrl }, { headers });
                setCarouselData(prevData =>
                    prevData.map(item => item.id === editingCarousel.id ? updatedSlider : item)
                );
                message.success('Chỉnh sửa thành công!');
            } else {
                const newSlider = {
                    id: v4(),
                    title: formattedTitle,
                    imageUrl,
                    date: currentDate
                };
                await axios.post('/slider', { title: formattedTitle, imageUrl }, { headers });
                setCarouselData(prevData => {
                    if (prevData.length === 1 && prevData[0].id === 'default') {
                        return [newSlider];
                    }
                    return [...prevData, newSlider];
                });
                message.success('Thêm slide thành công!');
            }

            handleCarouselModalCancel();
        } catch (error) {
            console.error('Error saving carousel data:', error);
            message.error('Lưu slide thất bại!');
            await fetchCarouselData();
        } finally {
            isEditing ? setEditLoading(false) : setAddLoading(false);
        }
    };

    const handleDelete = async (id) => {
        setDeleteLoading(true);
        try {
            await axios.delete(`/slider/delete/${id}`, {
                headers: { 'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}` }
            });
            setCarouselData(prevData => prevData.filter(item => item.id !== id));
            message.success('Xóa thành công!');
        } catch (error) {
            console.error('Error deleting carousel data:', error);
            message.error('Xóa slide thất bại!');
            await fetchCarouselData();
        } finally {
            setDeleteLoading(false);
        }
    };

    const uploadProps = {
        name: 'file',
        multiple: false,
        beforeUpload: () => false,
        onChange(info) {
            const { fileList } = info;
            const file = fileList[0]?.originFileObj;
            if (file) {
                setSelectedFile(file);
            }
        },
        fileList: selectedFile ? [{
            uid: '-1',
            name: selectedFile.name,
            status: 'done',
            originFileObj: selectedFile
        }] : [],
    };

    const handleShortcutsChange = (updatedShortcuts) => {
        setShortcuts(updatedShortcuts);
    };

    return (
        <Layout style={styles.dashboardLayout} className='layout_main_niso'>
            <title>NISO CHECKLIST | DASHBOARD</title>
            <Content>
                {pageLoading ? (
                    <DashboardSkeleton />
                ) : (
                    <Row gutter={[24, 24]}>
                        <Col span={24}>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} lg={18}>
                                    <Card bordered={false} bodyStyle={{ padding: 0 }} style={styles.carouselCard}>
                                        <Carousel
                                            autoplay
                                            arrows
                                            className="enhanced-carousel"
                                            dotPosition="bottom"
                                        >
                                            {carouselData.map((item) => (
                                                <div key={item.id} className="carousel-slide">
                                                    <div className="carousel-content">
                                                        <div className="image-wrapper">
                                                            <img
                                                                src={item.imageUrl}
                                                                alt={item.title || 'Image slider'}
                                                                className="carousel-image"
                                                                onError={(e) => { e.target.src = slnen; }}
                                                            />
                                                            {item.title && (
                                                                <div className="carousel-overlay">
                                                                    <div className="overlay-content">
                                                                        <Typography.Title
                                                                            level={2}
                                                                            className="slide-title"
                                                                        >
                                                                            {item.title}
                                                                        </Typography.Title>
                                                                        {item.description && (
                                                                            <Typography.Paragraph
                                                                                className="slide-description"
                                                                                ellipsis={{ rows: 2 }}
                                                                            >
                                                                                {item.description}
                                                                            </Typography.Paragraph>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {user.phanquyen && item.id !== 'default' && (
                                                            <div className="carousel-actions">
                                                                <Button
                                                                    type="primary"
                                                                    icon={<EditOutlined />}
                                                                    size='small'
                                                                    onClick={() => showCarouselModal(item)}
                                                                    loading={editLoading}
                                                                    className="edit-button"
                                                                >
                                                                    Chỉnh Sửa
                                                                </Button>
                                                                <Popconfirm
                                                                    title="Bạn có chắc chắn muốn xóa Slide này?"
                                                                    onConfirm={() => handleDelete(item.id)}
                                                                    okText="Có"
                                                                    cancelText="Không"
                                                                >
                                                                    <Button
                                                                        icon={<DeleteOutlined />}
                                                                        danger
                                                                        loading={deleteLoading}
                                                                        size='small'
                                                                        type='primary'
                                                                        className="delete-button"
                                                                    >
                                                                        Xóa
                                                                    </Button>
                                                                </Popconfirm>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </Carousel>

                                        {user.phanquyen && (
                                            <div style={styles.addSlideButton}>
                                                <Button
                                                    type="primary"
                                                    icon={<PlusOutlined />}
                                                    onClick={() => showCarouselModal()}
                                                    loading={addLoading}
                                                >
                                                    Thêm Slide
                                                </Button>
                                            </div>
                                        )}
                                    </Card>

                                    {window.innerWidth < 768 && (
                                        <Button
                                            type="primary"
                                            icon={<FieldTimeOutlined />}
                                            onClick={() => setIsDrawerVisible(true)}
                                            style={styles.mobileChamCongButton}
                                            size='middle'
                                        >
                                            Chấm Công
                                        </Button>
                                    )}

                                    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                                        <Col xs={24} md={hasxlphPermission || user.phanquyen === true || user.phanquyen === "Xử lý yêu cầu" ? 12 : 24}>
                                            <Card
                                                bordered={false}
                                                title={
                                                    <div style={styles.cardTitleWithIcon}>
                                                        <ContainerOutlined />
                                                        <span>CHECKLIST ĐƯỢC GIAO</span>
                                                    </div>
                                                }
                                                extra={
                                                    <Button type="link" onClick={() => navigate(`/auth/docs/home`)} icon={<ArrowRightOutlined />}>
                                                        Xem tất cả
                                                    </Button>
                                                }
                                                style={styles.contentCard}
                                            >
                                                <div style={styles.scrollableContent}>
                                                    <ChecklistGiao user={user} />
                                                </div>
                                            </Card>
                                        </Col>

                                        {(hasxlphPermission || user.phanquyen === true || user.phanquyen === "Xử lý yêu cầu") && (
                                            <Col xs={24} md={12}>
                                                <Card
                                                    bordered={false}
                                                    title={
                                                        <div style={styles.cardTitleWithIcon}>
                                                            <FileProtectOutlined />
                                                            <span>PHIẾU CẦN XỬ LÝ</span>
                                                        </div>
                                                    }
                                                    extra={
                                                        <Button
                                                            type="link"
                                                            icon={<ArrowRightOutlined />}
                                                            onClick={() => {
                                                                if (hasxlphPermission && (user.phanquyen === true || user.phanquyen === "Xử lý yêu cầu")) {
                                                                    navigate(`/auth/docs/list/view/xu-ly-phan-hoi/assigned`);
                                                                } else if (hasxlphPermission) {
                                                                    navigate(`/auth/docs/list/view/danh-sach-phan-hoi/phieu-cho-xu-ly/assigned`);
                                                                } else if (user.phanquyen === true || user.phanquyen === "Xử lý yêu cầu") {
                                                                    navigate(`/auth/docs/list/view/xu-ly-phan-hoi/assigned`);
                                                                }
                                                            }}
                                                        >
                                                            Xem tất cả
                                                        </Button>
                                                    }
                                                    style={styles.contentCard}
                                                >
                                                    <div style={styles.scrollableContent}>
                                                        <XulyDashboard user={user} />
                                                    </div>
                                                </Card>
                                            </Col>
                                        )}

                                        <Col xs={24}>
                                            <Card
                                                bordered={false}
                                                title={
                                                    <div style={styles.cardTitleWithIcon}>
                                                        <BarChartOutlined />
                                                        <span>BÁO CÁO TỪ KHỐI / PHÒNG</span>
                                                    </div>
                                                }
                                                extra={
                                                    <Button type="link" onClick={() => navigate(`/auth/docs/report`)} icon={<ArrowRightOutlined />}>
                                                        Xem tất cả
                                                    </Button>
                                                }
                                                style={styles.contentCard}
                                            >
                                                <Baocao user={user} />
                                            </Card>
                                        </Col>
                                    </Row>
                                </Col>

                                <Col xs={24} lg={6}>
                                    <div style={styles.stickySidebarWrapper}>
                                        <Row gutter={[0, 16]}>
                                            <Col span={24} style={{ display: window.innerWidth >= 768 ? 'block' : 'none' }}>
                                                <ChamCongCard
                                                    user={user}
                                                    locations={locations}
                                                    country={country}
                                                    hasCCPermission={hasCCPermission}
                                                />
                                            </Col>
                                            <Col span={24}>
                                                <QuickAccessCard
                                                    shortcuts={shortcuts}
                                                    onShortcutsChange={handleShortcutsChange}
                                                    navigate={navigate}
                                                    userKeys={user.keys}
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                )}
            </Content>

            <Drawer
                title="Chấm công"
                placement="bottom"
                height="80vh"
                closeIcon={null}
                visible={isDrawerVisible}
                onClose={() => setIsDrawerVisible(false)}
                bodyStyle={styles.drawerBody}
            >
                {hasCCPermission ? (
                    <ChamCong
                        user={user}
                        locations={locations}
                        country={country}
                        getStyle={() => ({})}
                        hasCCPermission={hasCCPermission}
                        onCloseDrawer={() => setIsDrawerVisible(false)}
                    />
                ) : (
                    <div style={{ ...styles.lockedFeature, padding: 24 }}>
                        <LockOutlined style={styles.lockIcon} />
                        <Typography.Title level={4}>Chức năng chấm công đã bị khóa</Typography.Title>
                        <Typography.Paragraph type="secondary">
                            Hiện tại bạn không thể sử dụng chức năng chấm công
                        </Typography.Paragraph>
                        <Divider />
                        <Typography.Paragraph type="secondary" style={styles.lockMessage}>
                            Nếu bạn cho rằng đây là sự cố, vui lòng liên hệ với quản trị viên để được hỗ trợ.
                        </Typography.Paragraph>
                        <Button onClick={() => setIsDrawerVisible(false)} block>Đóng</Button>
                    </div>
                )}
            </Drawer>

            <Modal
                title={editingCarousel ? "Chỉnh sửa Slide" : "Thêm Slide"}
                visible={isCarouselModalVisible}
                onOk={handleCarouselModalOk}
                onCancel={handleCarouselModalCancel}
                confirmLoading={addLoading || editLoading}
            >
                <Form form={form} onFinish={onFinish} layout="vertical">
                    <Form.Item name="title" label="Nội dung Slide">
                        <Input.TextArea rows={4} placeholder="Nhập nội dung hiển thị trên slide" />
                    </Form.Item>
                    <Dragger {...uploadProps}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Nhấp chọn hoặc kéo thả tệp ở đây</p>
                        <p className="ant-upload-hint">
                            Vui lòng tải lên ít nhất một hình ảnh hoặc video
                        </p>
                    </Dragger>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                        <Progress percent={Math.round(uploadProgress)} />
                    )}
                </Form>
            </Modal>
        </Layout>
    );
};

export default memo(Dashboard);