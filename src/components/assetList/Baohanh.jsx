import React, { useState, useEffect } from 'react';
import {
    Table, Card, Button, Space, Modal, Form, Input, Select, DatePicker, Typography, Tag, Dropdown,
    Tooltip, Upload, Drawer, Tabs, Divider, Timeline, message, Badge, Image, Empty, AutoComplete, Spin, List
} from 'antd';
import {
    SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined, UploadOutlined,
    FileDoneOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, PrinterOutlined,
    RollbackOutlined, CarOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { imageDb } from '../../config'; // Giả định bạn đã cấu hình Firebase
import NotFoundPage from '../NotFoundPage';

// Utility function to safely parse dates
const parseDate = (dateString, format = 'DD-MM-YYYY') => {
    const parsed = dayjs(dateString, format);
    return parsed.isValid() ? parsed : null;
};

// Authentication header for API requests
const authHeader = {
    headers: { Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}}` } // Thay bằng username/password thực tế hoặc dùng process.env
};

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const BaoHanh = ({ user, hasquanlyTSPermission, hastKiemKePermission, hastXoaTSPermission }) => {
    const [warranties, setWarranties] = useState([]);
    const [searchAssets, setSearchAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [selectedWarranty, setSelectedWarranty] = useState(null);
    const [detailTabKey, setDetailTabKey] = useState('1');
    const [fileList, setFileList] = useState([]);
    const [previewImage, setPreviewImage] = useState('');
    const [previewVisible, setPreviewVisible] = useState(false);
    const [form] = Form.useForm();
    const [shippingForm] = Form.useForm();
    const [claimForm] = Form.useForm();
    const [searchLoading, setSearchLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5,
        total: 0,
    });
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedAssetSerials, setSelectedAssetSerials] = useState([]);

    const fetchWarranties = async (page = 1, pageSize = 5, search = '') => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/warranties?page=${page}&limit=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
                authHeader
            );
            setWarranties(response.data.data);
            setPagination({
                current: response.data.page,
                pageSize: response.data.limit,
                total: response.data.total,
            });
        } catch (error) {
            console.error('Error fetching warranties:', error.response || error.message);
            message.error('Lỗi khi lấy dữ liệu bảo hành từ backend');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarranties(pagination.current, pagination.pageSize, searchText);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.current, pagination.pageSize, searchText]);

    const handleTableChange = (newPagination) => {
        fetchWarranties(newPagination.current, newPagination.pageSize, searchText);
    };

    const searchAssetOptions = async (value) => {
        if (!value) {
            setSearchAssets([]);
            setSearchLoading(false);
            return;
        }
        setSearchLoading(true);
        try {
            const response = await axios.get(`/api/assets/search?search=${encodeURIComponent(value)}`, authHeader);
            const options = response.data.data.map(asset => ({
                value: `${asset.assetTag}`,
                label: `${asset.assetTag}`,
                asset
            }));
            setSearchAssets(options);
        } catch (error) {
            console.error('Error searching assets:', error);
            message.error('Lỗi khi tìm kiếm tài sản');
            setSearchAssets([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const uploadFileToFirebase = async (file) => {
        try {
            const storageRef = ref(imageDb, `warranty_documents/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } catch (error) {
            console.error('Error uploading file:', error);
            message.error('Lỗi khi tải file lên Firebase');
            return null;
        }
    };

    const handleUploadChange = async ({ fileList: newFileList }) => {
        const updatedFileList = await Promise.all(
            newFileList.map(async (file) => {
                if (!file.url && file.originFileObj) {
                    const url = await uploadFileToFirebase(file.originFileObj);
                    return { ...file, status: 'done', url };
                }
                return file;
            })
        );
        setFileList(updatedFileList);
    };

    const handlePreview = async (file) => {
        setPreviewImage(file.url || file.preview);
        setPreviewVisible(true);
    };

    const handleSubmit = async (values) => {
        const formattedValues = {
            ...values,
            startDate: values.startDate ? values.startDate.format('DD-MM-YYYY') : null,
            endDate: values.endDate ? values.endDate.format('DD-MM-YYYY') : null,
            documents: fileList,
            claimHistory: selectedWarranty?.claimHistory || []
        };

        try {
            if (selectedWarranty) {
                await axios.put(`/api/warranties/${selectedWarranty._id}`, formattedValues, authHeader);
                message.success('Thông tin bảo hành đã được cập nhật thành công!');
            } else {
                const response = await axios.post('/api/warranties', formattedValues, authHeader);
                formattedValues._id = response.data.id;
                setWarranties([...warranties, formattedValues]);
                message.success('Thông tin bảo hành mới đã được thêm thành công!');
            }
            fetchWarranties(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            console.error('Error submitting warranty:', error);
            message.error('Lỗi khi lưu thông tin bảo hành');
        }

        setIsModalVisible(false);
        form.resetFields();
        setFileList([]);
        setSelectedAssetSerials([]);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Kích hoạt': return 'green';
            case 'Hết hạn': return 'red';
            case 'Yêu cầu khác': return 'orange';
            case 'Sắp hết hạn': return 'gold';
            default: return 'default';
        }
    };

    const getClaimStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'green';
            case 'InProgress': return 'blue';
            case 'Pending': return 'gold';
            case 'Rejected': return 'red';
            default: return 'default';
        }
    };

    const getClaimStatusIcon = (status) => {
        switch (status) {
            case 'Completed': return <CheckCircleOutlined />;
            case 'InProgress': return <ClockCircleOutlined />;
            case 'Pending': return <ClockCircleOutlined />;
            case 'Rejected': return <CloseCircleOutlined />;
            default: return <InfoCircleOutlined />;
        }
    };

    const calculateTimeLeft = (endDate) => {
        const today = dayjs().startOf('day');
        const end = parseDate(endDate);
        if (!end) return { expired: true, daysLeft: 0 };
        const daysDiff = end.diff(today, 'day');
        return {
            expired: daysDiff < 0,
            daysLeft: daysDiff >= 0 ? daysDiff : 0
        };
    };

    const calculateWarrantyDuration = (startDate, endDate) => {
        const start = parseDate(startDate);
        const end = parseDate(endDate);
        if (!start || !end) return { valid: false, days: 0 };
        const daysDiff = end.diff(start, 'day');
        return {
            valid: daysDiff >= 0,
            days: daysDiff + 1
        };
    };

    const showModal = (warranty = null) => {
        setSelectedWarranty(warranty);
        if (warranty) {
            form.setFieldsValue({
                ...warranty,
                startDate: parseDate(warranty.startDate) || null,
                endDate: parseDate(warranty.endDate) || null,
            });
            setFileList(warranty.documents || []);
            if (warranty.assetTag) {
                searchAssetOptions(warranty.assetTag).then(() => {
                    const selectedAsset = searchAssets.find(option => option.asset.assetTag === warranty.assetTag);
                    if (selectedAsset) {
                        setSelectedAssetSerials(selectedAsset.asset.serialNumbers || []);
                    }
                });
            }
        } else {
            form.resetFields();
            setFileList([]);
            setSelectedAssetSerials([]);
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setFileList([]);
        setSelectedAssetSerials([]);
    };

    const deleteWarranty = (warrantyId) => {
        Modal.confirm({
            title: 'Xác nhận xóa thông tin bảo hành',
            content: 'Bạn có chắc chắn muốn xóa thông tin bảo hành này không?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            async onOk() {
                try {
                    await axios.delete(`/api/warranties/delete/${warrantyId}`, authHeader);
                    fetchWarranties(pagination.current, pagination.pageSize, searchText);
                    message.success('Thông tin bảo hành đã được xóa thành công!');
                } catch (error) {
                    console.error('Error deleting warranty:', error);
                    message.error('Lỗi khi xóa thông tin bảo hành');
                }
            },
        });
    };

    const showWarrantyDetails = (warranty) => {
        setSelectedWarranty(warranty);
        setIsDrawerVisible(true);
        setDetailTabKey('1');
    };

    const handleAddClaim = () => {
        let claimFileList = [];
        Modal.confirm({
            title: 'Tạo yêu cầu bảo hành mới',
            width: 700,
            content: (
                <Form form={claimForm} layout="vertical">
                    <Form.Item
                        name="issue"
                        label="Vấn đề gặp phải"
                        rules={[{ required: true, message: 'Vui lòng nhập vấn đề!' }]}
                    >
                        <TextArea rows={3} placeholder="Mô tả chi tiết vấn đề" />
                    </Form.Item>
                    <Form.Item name="images" label="Hình ảnh & Tài liệu kèm theo">
                        <Upload
                            listType="picture"
                            multiple
                            maxCount={5}
                            beforeUpload={(file) => {
                                claimFileList = [...claimFileList, file];
                                return false;
                            }}
                            onChange={({ fileList }) => (claimFileList = fileList)}
                            onRemove={(file) => {
                                claimFileList = claimFileList.filter(f => f.uid !== file.uid);
                            }}
                        >
                            <Button icon={<UploadOutlined />}>Tải lên</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item name="notes" label="Ghi chú">
                        <TextArea rows={2} placeholder="Thông tin bổ sung" />
                    </Form.Item>
                </Form>
            ),
            okText: 'Tạo yêu cầu',
            cancelText: 'Hủy',
            async onOk() {
                try {
                    const values = await claimForm.validateFields();
                    if (!values.issue || values.issue.trim() === '') {
                        message.error('Vui lòng nhập vấn đề gặp phải trước khi tạo yêu cầu!');
                        return;
                    }

                    if (!selectedWarranty?._id) {
                        message.error('Không có ID bảo hành để tạo yêu cầu!');
                        return;
                    }

                    const uploadedImages = await Promise.all(
                        claimFileList.map(async (file) => {
                            const url = await uploadFileToFirebase(file.originFileObj);
                            return { uid: file.uid, name: file.name, status: 'done', url };
                        })
                    );

                    const newClaim = {
                        id: `C${Date.now()}`,
                        date: dayjs().format('DD-MM-YYYY'),
                        issue: values.issue,
                        resolution: 'Đang xử lý',
                        status: 'Pending',
                        images: uploadedImages,
                        notes: values.notes,
                        createdAt: new Date(),
                    };

                    let updatedWarranty = { ...selectedWarranty };
                    updatedWarranty.claimHistory = updatedWarranty.claimHistory
                        ? [...updatedWarranty.claimHistory, newClaim]
                        : [newClaim];
                    updatedWarranty.status = 'Yêu cầu khác';

                    const response = await axios.put(
                        `/api/warranties/${selectedWarranty._id}`,
                        updatedWarranty,
                        authHeader
                    );

                    if (response.status === 200) {
                        setSelectedWarranty(updatedWarranty);
                        fetchWarranties(pagination.current, pagination.pageSize, searchText);

                        Modal.confirm({
                            title: 'Gửi Sản Phẩm Đi Bảo Hành',
                            width: 600,
                            content: (
                                <Form form={shippingForm} layout="vertical">
                                    <Form.Item
                                        name="shippingDate"
                                        label="Ngày Gửi"
                                        rules={[{ required: true, message: 'Vui lòng chọn ngày gửi!' }]}
                                    >
                                        <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
                                    </Form.Item>
                                    <Form.Item
                                        name="trackingNumber"
                                        label="Mã Vận Đơn"
                                        rules={[{ required: true, message: 'Vui lòng nhập mã vận đơn!' }]}
                                    >
                                        <Input placeholder="Ví dụ: VN123456789" />
                                    </Form.Item>
                                    <Form.Item name="shippingNotes" label="Ghi Chú">
                                        <TextArea rows={2} placeholder="Thông tin bổ sung về việc gửi hàng" />
                                    </Form.Item>
                                </Form>
                            ),
                            okText: 'Gửi',
                            cancelText: 'Hủy',
                            async onOk() {
                                try {
                                    const shippingValues = await shippingForm.validateFields();
                                    if (!shippingValues.shippingDate || !shippingValues.trackingNumber) {
                                        message.warning('Vui lòng nhập đầy đủ thông tin!');
                                        return;
                                    }

                                    updatedWarranty.claimHistory = updatedWarranty.claimHistory.map(claim =>
                                        claim.id === newClaim.id ? {
                                            ...claim,
                                            status: 'InProgress',
                                            shippingInfo: {
                                                shippingDate: shippingValues.shippingDate.format('DD-MM-YYYY'),
                                                trackingNumber: shippingValues.trackingNumber,
                                                notes: shippingValues.shippingNotes || ''
                                            }
                                        } : claim
                                    );

                                    await axios.put(
                                        `/api/warranties/${selectedWarranty._id}`,
                                        updatedWarranty,
                                        authHeader
                                    );
                                    fetchWarranties(pagination.current, pagination.pageSize, searchText);
                                    setSelectedWarranty(updatedWarranty);
                                    shippingForm.resetFields();
                                    message.success('Sản phẩm đã được gửi đi bảo hành thành công!');
                                } catch (error) {
                                    console.error('Error sending for warranty:', error);
                                    message.error('Nhập đầy đủ thông tin.');
                                }
                            },
                            onCancel() {
                                shippingForm.resetFields();
                            },
                        });

                        message.success('Yêu cầu bảo hành đã được tạo thành công!');
                        claimForm.resetFields();
                    } else {
                        throw new Error('Invalid response data');
                    }
                } catch (error) {
                    console.error('Error adding claim:', error);
                    message.error('Nhập đầy đủ thông tin.');
                }
            },
            onCancel() {
                claimForm.resetFields();
            },
        });
    };

    const handleUpdateClaimStatus = (claimId, newStatus) => {
        Modal.confirm({
            title: 'Cập nhật trạng thái yêu cầu bảo hành',
            content: 'Bạn có chắc chắn muốn thay đổi trạng thái của yêu cầu bảo hành này?',
            okText: 'Cập nhật',
            cancelText: 'Hủy',
            async onOk() {
                try {
                    let updatedWarranty = { ...selectedWarranty };
                    updatedWarranty.claimHistory = updatedWarranty.claimHistory.map(claim =>
                        claim.id === claimId ? {
                            ...claim,
                            status: newStatus,
                            returnDate: newStatus === 'Completed' ? dayjs().format('DD-MM-YYYY') : claim.returnDate
                        } : claim
                    );

                    const allCompleted = updatedWarranty.claimHistory.every(claim =>
                        claim.status === 'Completed' || claim.status === 'Rejected'
                    );
                    if (allCompleted) {
                        updatedWarranty.status = parseDate(updatedWarranty.endDate)?.isBefore(dayjs())
                            ? 'Hết hạn'
                            : 'Kích hoạt';
                    }

                    await axios.put(
                        `/api/warranties/${selectedWarranty._id}`,
                        updatedWarranty,
                        authHeader
                    );
                    fetchWarranties(pagination.current, pagination.pageSize, searchText);
                    setSelectedWarranty(updatedWarranty);
                    message.success('Trạng thái yêu cầu bảo hành đã được cập nhật thành công!');
                } catch (error) {
                    console.error('Error updating claim status:', error);
                    message.error('Lỗi khi cập nhật trạng thái');
                }
            },
        });
    };

    const handleSendForWarranty = (claimId) => {
        Modal.confirm({
            title: 'Gửi Sản Phẩm Đi Bảo Hành',
            width: 600,
            content: (
                <Form form={shippingForm} layout="vertical">
                    <Form.Item
                        name="shippingDate"
                        label="Ngày Gửi"
                        rules={[{ required: true, message: 'Vui lòng chọn ngày gửi!' }]}
                    >
                        <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
                    </Form.Item>
                    <Form.Item
                        name="trackingNumber"
                        label="Mã Vận Đơn"
                        rules={[{ required: true, message: 'Vui lòng nhập mã vận đơn!' }]}
                    >
                        <Input placeholder="Ví dụ: VN123456789" />
                    </Form.Item>
                    <Form.Item name="shippingNotes" label="Ghi Chú">
                        <TextArea rows={2} placeholder="Thông tin bổ sung về việc gửi hàng" />
                    </Form.Item>
                </Form>
            ),
            okText: 'Gửi',
            cancelText: 'Hủy',
            async onOk() {
                try {
                    const values = await shippingForm.validateFields();
                    if (!values.shippingDate || !values.trackingNumber) {
                        message.warning('Vui lòng nhập đầy đủ thông tin!');
                        return;
                    }

                    let updatedWarranty = { ...selectedWarranty };
                    updatedWarranty.claimHistory = updatedWarranty.claimHistory.map(claim =>
                        claim.id === claimId ? {
                            ...claim,
                            status: 'InProgress',
                            shippingInfo: {
                                shippingDate: values.shippingDate.format('DD-MM-YYYY'),
                                trackingNumber: values.trackingNumber,
                                notes: values.shippingNotes || ''
                            }
                        } : claim
                    );

                    updatedWarranty.status = 'Yêu cầu khác';
                    await axios.put(
                        `/api/warranties/${selectedWarranty._id}`,
                        updatedWarranty,
                        authHeader
                    );
                    fetchWarranties(pagination.current, pagination.pageSize, searchText);
                    setSelectedWarranty(updatedWarranty);
                    shippingForm.resetFields();
                    message.success('Sản phẩm đã được gửi đi bảo hành thành công!');
                } catch (error) {
                    console.error('Error sending for warranty:', error);
                    message.error('Nhập đầy đủ thông tin.');
                }
            },
            onCancel() {
                shippingForm.resetFields();
            },
        });
    };

    const handleAssetSelect = (value, option) => {
        const selectedAsset = option.asset;
        if (selectedAsset) {
            form.setFieldsValue({
                assetTag: selectedAsset.assetTag,
                assetName: selectedAsset.name,
                category: selectedAsset.category,
                warrantyNumber: ''
            });
            setSelectedAssetSerials(selectedAsset.serialNumbers || []);
        }
    };

    const columns = [
        {
            title: 'Mã tài sản',
            dataIndex: 'assetTag',
            key: 'assetTag',
            sorter: (a, b) => a.assetTag?.localeCompare(b.assetTag) || 0
        },
        {
            title: 'Tên tài sản',
            dataIndex: 'assetName',
            key: 'assetName',
            sorter: (a, b) => a.assetName?.localeCompare(b.assetName) || 0
        },
        {
            title: 'Nhà cung cấp bảo hành',
            dataIndex: 'warrantyProvider',
            key: 'warrantyProvider',
            sorter: (a, b) => a.warrantyProvider?.localeCompare(b.warrantyProvider) || 0
        },
        {
            title: 'Thời hạn bảo hành',
            key: 'warranty',
            render: (_, record) => {
                const start = parseDate(record.startDate);
                const end = parseDate(record.endDate);
                const timeLeft = calculateTimeLeft(record.endDate);
                return (
                    <span>
                        {start ? start.format('DD-MM-YYYY') : 'N/A'} đến {end ? end.format('DD-MM-YYYY') : 'N/A'}
                        <br />
                        {timeLeft.expired ?
                            <Text type="danger">Hết hạn {timeLeft.daysLeft} ngày</Text> :
                            <Text type="success">Còn lại: {timeLeft.daysLeft} ngày</Text>}
                    </span>
                );
            },
            sorter: (a, b) => (parseDate(a.endDate)?.unix() || 0) - (parseDate(b.endDate)?.unix() || 0),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <Tag color={getStatusColor(status)} bordered={false}>{status}</Tag>,
        },
        {
            title: 'Hoạt Động',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button icon={<InfoCircleOutlined />} size="small" type="text" onClick={() => showWarrantyDetails(record)} />
                    </Tooltip>
                    {!hastKiemKePermission && (
                        <Tooltip title="Chỉnh sửa">
                            <Button type="text" icon={<EditOutlined />} size="small" onClick={() => showModal(record)} />
                        </Tooltip>
                    )}
                    {(user.phanquyen === 'IT asset' || hastXoaTSPermission === true) &&
                        <Tooltip title="Xóa">
                            <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => deleteWarranty(record._id)} />
                        </Tooltip>
                    }
                </Space>
            ),
        },
    ];

    const uploadProps = {
        onRemove: (file) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: (file) => {
            setFileList([...fileList, file]);
            return false;
        },
        fileList,
    };

    if (!hasquanlyTSPermission && user.phanquyen !== true && !hastKiemKePermission && !hastXoaTSPermission && user.phanquyen !== 'IT asset') {
        return <NotFoundPage />;
      }

    return (
        <div className="warranty-tracking">
            <Card>
                <Table
                    bordered
                    size='middle'
                    locale={{ emptyText: <Empty description="Danh sách trống !" /> }}
                    title={() => (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Input
                                placeholder="Tìm kiếm theo mã/tên tài sản hoặc nhà cung cấp"
                                prefix={<SearchOutlined />}
                                value={searchText}
                                size="middle"
                                onChange={(e) => setSearchText(e.target.value)}
                                onPressEnter={() => fetchWarranties(1, pagination.pageSize, searchText)}
                            />
                            <Space style={{ flexWrap: 'wrap', marginTop: 10 }}>
                                <Select
                                    value={statusFilter || undefined}
                                    onChange={(value) => {
                                        setStatusFilter(value);
                                        fetchWarranties(1, pagination.pageSize, searchText);
                                    }}
                                    placeholder="Chọn trạng thái"
                                    style={{ width: '100%' }}
                                    allowClear
                                >
                                    <Option value="Kích hoạt">Kích hoạt</Option>
                                    <Option value="Hết hạn">Hết hạn</Option>
                                    <Option value="Yêu cầu khác">Yêu cầu khác</Option>
                                    <Option value="Sắp hết hạn">Sắp hết hạn</Option>
                                </Select>
                                {user.phanquyen === 'IT asset' || user.phanquyen === true ? (
                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                                        Thêm Bảo Hành Mới
                                    </Button>
                                ) : !hastKiemKePermission && (
                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                                        Thêm Bảo Hành Mới
                                    </Button>
                                )}
                            </Space>
                        </div>
                    )}
                    columns={columns}
                    dataSource={warranties}
                    rowKey="_id"
                    loading={loading}
                    scroll={{ x: true }}
                    style={{ width: "100%", whiteSpace: "nowrap" }}
                    pagination={{
                        ...pagination,
                        pageSizeOptions: ["5", "10", "20", "50", "100"],
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                        size: window.innerWidth < 768 ? "small" : "middle"
                    }}
                    onChange={handleTableChange}
                    expandable={{
                        expandedRowRender: (record) => (
                            <div style={{ margin: 0 }}>
                                <p><strong>Số SN:</strong> {record.warrantyNumber}</p>
                                <p><strong>Loại tài sản:</strong> {record.category}</p>
                                {record.notes ? <p><strong>Ghi chú:</strong> {record.notes}</p> : <Tag color='red' bordered={false}>Trống</Tag>}
                                {record.claimHistory?.length > 0 && (
                                    <div>
                                        <p><strong>Lịch sử yêu cầu bảo hành ({record.claimHistory.length}):</strong></p>
                                        {record.claimHistory.map((claim) => (
                                            <p key={claim.id} style={{ marginLeft: 20 }}>
                                                - {parseDate(claim.date)?.format('DD-MM-YYYY') || 'N/A'}: {claim.issue} ({claim.status})
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ),
                        rowExpandable: () => true,
                    }}
                />
            </Card>

            <Modal
                title={selectedWarranty ? "Chỉnh sửa thông tin bảo hành" : "Thêm thông tin bảo hành mới"}
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                centered
                width={800}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item
                            name="assetTag"
                            label="Mã tài sản"
                            rules={[{ required: true, message: 'Vui lòng nhập mã tài sản!' }]}
                            style={{ flex: 1 }}
                        >
                            <AutoComplete
                                options={searchAssets}
                                onSearch={searchAssetOptions}
                                onSelect={handleAssetSelect}
                                placeholder="Tìm kiếm mã tài sản"
                                notFoundContent={searchLoading ? <Spin size="small" /> : "Nhập mã tài sản..."}
                            />
                        </Form.Item>
                        <Form.Item
                            name="assetName"
                            label="Tên tài sản"
                            rules={[{ required: true, message: 'Vui lòng nhập tên tài sản!' }]}
                            style={{ flex: 2 }}
                        >
                            <Input placeholder="Ví dụ: Dell XPS 13" />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item
                            name="category"
                            label="Loại tài sản"
                            rules={[{ required: true, message: 'Vui lòng chọn loại tài sản!' }]}
                            style={{ flex: 1 }}
                        >
                            <Select placeholder="Chọn loại tài sản">
                                <Option value="Laptop">Laptop</Option>
                                <Option value="Computer">Computer</Option>
                                <Option value="Laptop">Phone</Option>
                                <Option value="Desktop">Desktop</Option>
                                <Option value="Server">Server</Option>
                                <Option value="Network">Network</Option>
                                <Option value="Printer">Printer</Option>
                                <Option value="Monitor">Monitor</Option>
                                <Option value="Other">Other</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="warrantyNumber"
                            label="Số SN"
                            rules={[{ required: true, message: 'Vui lòng chọn số SN!' }]}
                            style={{ flex: 1 }}
                        >
                            <Select
                                placeholder="Chọn số SN"
                                options={selectedAssetSerials.map(sn => ({ label: sn, value: sn }))}
                                disabled={!selectedAssetSerials.length}
                            />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item
                            name="warrantyProvider"
                            label="Nhà cung cấp bảo hành"
                            rules={[{ required: true, message: 'Vui lòng nhập nhà cung cấp!' }]}
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="Ví dụ: Dell Việt Nam" />
                        </Form.Item>
                        <Form.Item
                            name="status"
                            label="Trạng thái"
                            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
                            style={{ flex: 1 }}
                        >
                            <Select placeholder="Chọn trạng thái">
                                <Option value="Kích hoạt">Kích hoạt</Option>
                                <Option value="Hết hạn">Hết hạn</Option>
                                <Option value="Yêu cầu khác">Yêu cầu khác</Option>
                                <Option value="Sắp hết hạn">Sắp hết hạn</Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item
                            name="startDate"
                            label="Ngày bắt đầu"
                            rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu!' }]}
                            style={{ flex: 1 }}
                        >
                            <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
                        </Form.Item>
                        <Form.Item
                            name="endDate"
                            label="Ngày kết thúc"
                            rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc!' }]}
                            style={{ flex: 1 }}
                        >
                            <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
                        </Form.Item>
                    </div>

                    <Form.Item name="notes" label="Ghi Chú">
                        <TextArea rows={3} placeholder="Thông tin bổ sung về bảo hành" />
                    </Form.Item>

                    <Form.Item label="Hình ảnh Bảo Hành">
                        <Upload
                            {...uploadProps}
                            listType="picture"
                            onPreview={handlePreview}
                            onChange={handleUploadChange}
                        >
                            <Button icon={<UploadOutlined />}>Tải Lên Hình ảnh</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item style={{marginBottom: 0}}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <Button onClick={handleCancel}>Hủy</Button>
                            <Button type="primary" htmlType="submit">
                                {selectedWarranty ? 'Cập Nhật' : 'Tạo Mới'}
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                visible={previewVisible}
                title="Xem Trước"
                footer={null}
                onCancel={() => setPreviewVisible(false)}
            >
                <img alt="preview" style={{ width: '100%' }} src={previewImage} />
            </Modal>

            <Drawer
                title="Chi tiết"
                placement="right"
                width={900}
                closeIcon={null}
                onClose={() => setIsDrawerVisible(false)}
                visible={isDrawerVisible}
                extra={
                    <Space>
                        <Button onClick={() => setIsDrawerVisible(false)}>Close</Button>
                        {!hastKiemKePermission && <Button type="primary" onClick={() => showModal(selectedWarranty)}>Edit</Button>}
                        <Button type="primary" icon={<PrinterOutlined />}>Print</Button>
                    </Space>
                }
            >
                {selectedWarranty && (
                    <Tabs activeKey={detailTabKey} onChange={setDetailTabKey}>
                        <TabPane tab="Thông tin chung" key="1">
                            <div className="warranty-details">
                                <Title level={4}>
                                    {selectedWarranty.assetName}
                                    <Tag
                                        color={getStatusColor(selectedWarranty.status)}
                                        style={{ marginLeft: 8 }}
                                        bordered={false}
                                    >
                                        {selectedWarranty.status}
                                    </Tag>
                                </Title>

                                <Divider orientation="left">Thông tin tài sản</Divider>
                                <List
                                    itemLayout="horizontal"
                                    dataSource={[
                                        { title: 'Mã tài sản', description: selectedWarranty.assetTag },
                                        { title: 'Loại tài sản', description: selectedWarranty.category },
                                    ]}
                                    renderItem={item => (
                                        <List.Item>
                                            <List.Item.Meta
                                                title={<Text strong>{item.title}:</Text>}
                                                description={item.description || <Tag color="red" bordered={false}>N/A</Tag>}
                                            />
                                        </List.Item>
                                    )}
                                />

                                <Divider orientation="left">Thông tin bảo hành</Divider>
                                <List
                                    itemLayout="horizontal"
                                    dataSource={[
                                        { title: 'Nhà cung cấp', description: selectedWarranty.warrantyProvider },
                                        { title: 'Số SN', description: selectedWarranty.warrantyNumber },
                                        { title: 'Ngày bắt đầu', description: parseDate(selectedWarranty.startDate)?.format('DD-MM-YYYY') || 'N/A' },
                                        { title: 'Ngày kết thúc', description: parseDate(selectedWarranty.endDate)?.format('DD-MM-YYYY') || 'N/A' },
                                        {
                                            title: 'Tổng thời gian bảo hành',
                                            description: (() => {
                                                const totalDuration = calculateWarrantyDuration(selectedWarranty.startDate, selectedWarranty.endDate);
                                                return totalDuration.valid ? `${totalDuration.days} ngày` : 'N/A';
                                            })()
                                        },
                                        {
                                            title: 'Thời gian còn lại',
                                            description: (() => {
                                                const timeLeft = calculateTimeLeft(selectedWarranty.endDate);
                                                return timeLeft.expired ?
                                                    <Text type="danger">Hết hạn {timeLeft.daysLeft} ngày</Text> :
                                                    <Text type="success">Còn lại: {timeLeft.daysLeft} ngày</Text>;
                                            })()
                                        },
                                    ]}
                                    renderItem={item => (
                                        <List.Item>
                                            <List.Item.Meta
                                                title={<Text strong>{item.title}:</Text>}
                                                description={item.description || <Tag color="red" bordered={false}>N/A</Tag>}
                                            />
                                        </List.Item>
                                    )}
                                />

                                <Divider orientation="left">Ghi chú</Divider>
                                <p>{selectedWarranty.notes || <Tag color='red' bordered={false}>Không có ghi chú</Tag>}</p>

                                <Divider orientation="left">Hình ảnh</Divider>
                                {selectedWarranty.documents && selectedWarranty.documents.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {selectedWarranty.documents.map((doc) => (
                                            doc.url && (
                                                <Badge key={doc.uid} count={<FileDoneOutlined style={{ color: '#1890ff' }} />}>
                                                    <Card
                                                        hoverable
                                                        style={{ width: 120 }}
                                                        cover={<Image src={doc.url} preview={{ mask: <div><SearchOutlined /> Xem</div> }} />}
                                                    >
                                                        <Card.Meta
                                                            title={doc.name.length > 10 ? `${doc.name.substring(0, 8)}...` : doc.name}
                                                        />
                                                    </Card>
                                                </Badge>
                                            )
                                        ))}
                                    </div>
                                ) : <Empty description="Không có hình ảnh" />}
                            </div>
                        </TabPane>
                        <TabPane tab="Lịch sử bảo hành" key="2">
                            <div className="claim-history">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap' }}>
                                    <Title level={4}>Lịch sử yêu cầu bảo hành</Title>
                                    {(user.phanquyen === 'IT asset' || hasquanlyTSPermission === true) && (
                                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClaim}>
                                            Tạo yêu cầu mới
                                        </Button>
                                    )}
                                </div>

                                {selectedWarranty.claimHistory && selectedWarranty.claimHistory.length > 0 ? (
                                    <Timeline mode={window.innerWidth < 768 ? '' : 'alternate'}>
                                        {selectedWarranty.claimHistory
                                            .slice()
                                            .sort((a, b) => parseDate(b.date)?.unix() - parseDate(a.date)?.unix())
                                            .map((claim) => (
                                                <Timeline.Item
                                                    key={claim.id}
                                                    color={getClaimStatusColor(claim.status)}
                                                    label={parseDate(claim.date)?.format('DD-MM-YYYY') || 'N/A'}
                                                    dot={getClaimStatusIcon(claim.status)}
                                                >
                                                    <Card title={claim.issue} size="small" style={{ marginBottom: 16 }}>
                                                        <Space style={{ marginBottom: 10 }}>
                                                            {(user.phanquyen === 'IT asset' || hasquanlyTSPermission === true) && (
                                                                <>
                                                                    {(claim.status === 'Pending' || claim.status === 'InProgress') && !claim.shippingInfo && (
                                                                        <Button
                                                                            size="small"
                                                                            icon={<CarOutlined />}
                                                                            onClick={() => handleSendForWarranty(claim.id)}
                                                                        >
                                                                            Gửi Bảo Hành
                                                                        </Button>
                                                                    )}
                                                                </>
                                                            )}
                                                            {(user.phanquyen === 'IT asset' || hasquanlyTSPermission === true) && (
                                                                <Dropdown
                                                                    menu={{
                                                                        items: [
                                                                            { key: '1', label: 'Hoàn thành', onClick: () => handleUpdateClaimStatus(claim.id, 'Completed') },
                                                                            { key: '2', label: 'Đang xử lý', onClick: () => handleUpdateClaimStatus(claim.id, 'InProgress') },
                                                                            { key: '3', label: 'Đang chờ', onClick: () => handleUpdateClaimStatus(claim.id, 'Pending') },
                                                                            { key: '4', label: 'Từ chối', onClick: () => handleUpdateClaimStatus(claim.id, 'Rejected') }
                                                                        ]
                                                                    }}
                                                                    trigger={['click']}
                                                                >
                                                                    <Button size="small">Trạng thái <RollbackOutlined /></Button>
                                                                </Dropdown>
                                                            )}
                                                        </Space>
                                                        <br />
                                                        <div style={{ marginBottom: 8 }}>
                                                            <Text strong>Trạng thái:</Text>{' '}
                                                            <Tag color={getClaimStatusColor(claim.status)} bordered={false}>
                                                                {claim.status}
                                                            </Tag>
                                                        </div>
                                                        <div style={{ marginBottom: 8 }}>
                                                            <Text strong>Kết quả:</Text> {claim.resolution || 'Chưa có'}
                                                        </div>
                                                        {claim.returnDate && (
                                                            <div style={{ marginBottom: 8 }}>
                                                                <Text strong>Ngày trả:</Text> {parseDate(claim.returnDate)?.format('DD-MM-YYYY') || 'N/A'}
                                                            </div>
                                                        )}
                                                        {claim.shippingInfo && (
                                                            <div style={{ marginBottom: 8 }}>
                                                                <Text strong>Thông tin gửi hàng:</Text>
                                                                <div style={{ marginLeft: 16 }}>
                                                                    <p>- Ngày gửi: {parseDate(claim.shippingInfo.shippingDate)?.format('DD-MM-YYYY') || 'N/A'}</p>
                                                                    <p>- Mã vận đơn: {claim.shippingInfo.trackingNumber}</p>
                                                                    {claim.shippingInfo.notes && <p>- Ghi chú: {claim.shippingInfo.notes}</p>}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div style={{ marginBottom: 8 }}>
                                                            <Text strong>Ghi chú:</Text> {claim.notes || 'Không có ghi chú'}
                                                        </div>
                                                        {claim.images && claim.images.length > 0 && (
                                                            <div>
                                                                <Text strong>Hình ảnh:</Text>
                                                                <div style={{ display: 'flex', marginTop: 8, gap: '8px' }}>
                                                                    {claim.images.map((img) => (
                                                                        img.url && (
                                                                            <Image
                                                                                key={img.uid}
                                                                                width={80}
                                                                                src={img.url}
                                                                                preview={{ mask: <div><SearchOutlined /></div> }}
                                                                            />
                                                                        )
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Card>
                                                </Timeline.Item>
                                            ))}
                                    </Timeline>
                                ) : <Empty description="Chưa có yêu cầu bảo hành nào" />}
                            </div>
                        </TabPane>
                    </Tabs>
                )}
            </Drawer>
        </div>
    );
};

export default BaoHanh;