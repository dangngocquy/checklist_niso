import React, { useState, useEffect } from 'react';
import {
    Typography, Row, Col, Card, Table, Tag, Button, Modal, Form, InputNumber, Empty, Select, List, DatePicker, Space, Tooltip, Popconfirm, message, Input
} from 'antd';
import {
    DeleteOutlined, EditOutlined, ExportOutlined, PlusOutlined, FilePdfOutlined, SearchOutlined, StopOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import NotFoundPage from '../NotFoundPage';

const { Option } = Select;

const ThanhLyTaiSan = ({user, hasquanlyTSPermission, hastKiemKePermission, hastXoaTSPermission}) => {
    const [form] = Form.useForm();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [retiredAssets, setRetiredAssets] = useState([]);
    const [filter, setFilter] = useState({ status: 'all', search: '' });
    const [loading, setLoading] = useState(false);
    const [assetOptions, setAssetOptions] = useState([]);
    const [hasPurchaseDate, setHasPurchaseDate] = useState(false);
    const [serialNumbers, setSerialNumbers] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5,
        total: 0,
    });

    const axiosConfig = {
        headers: { Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}}` },
    };

    const numberFormatter = (value) => {
        if (value === undefined || value === null) return '';
        return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const numberParser = (value) => {
        if (!value) return 0;
        return parseInt(value.replace(/,/g, ''), 10);
    };

    const fetchRetiredAssets = async (page = 1, pageSize = 5) => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/retired-assets?page=${page}&limit=${pageSize}`, axiosConfig);
            const { data, total } = response.data;
            setRetiredAssets(data.map(item => ({ ...item, key: item._id })));
            setPagination({
                current: page,
                pageSize,
                total,
            });
        } catch (error) {
            message.error('Lỗi khi tải danh sách tài sản thanh lý: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const searchAssets = async (keyword) => {
        if (!keyword) {
            setAssetOptions([]);
            return;
        }
        try {
            const response = await axios.get(`/api/assets/search?search=${keyword}`, axiosConfig);
            const assets = response.data.data || [];
            setAssetOptions(assets.map(asset => ({
                value: asset._id,
                label: `${asset.assetTag} - ${asset.name}`,
                asset,
            })));
        } catch (error) {
            message.error('Lỗi khi tìm kiếm tài sản: ' + (error.response?.data?.message || error.message));
            setAssetOptions([]);
        }
    };

    const handleAssetSelect = (value, option) => {
        const selectedAsset = option.asset;
        if (selectedAsset) {
            const purchaseDate = selectedAsset.createdAt ? dayjs(selectedAsset.createdAt) : null;
            // Lọc các serial numbers chưa được cấp phát
            const assignedSNs = (selectedAsset.assignedSerialNumbers || []).map(sn => sn.serialNumber);
            const availableSerialNumbers = (selectedAsset.serialNumbers || []).filter(
                sn => !assignedSNs.includes(sn)
            );

            form.setFieldsValue({
                assetId: selectedAsset._id,
                assetTag: selectedAsset.assetTag,
                name: selectedAsset.name,
                category: selectedAsset.category,
                purchaseDate: purchaseDate,
                initialValue: selectedAsset.price || 0,
                currentValue: selectedAsset.price || 0,
                serialNumber: null,
            });
            setHasPurchaseDate(!!selectedAsset.createdAt);
            setSerialNumbers(availableSerialNumbers); // Chỉ lưu các SN chưa cấp phát
        }
    };

    useEffect(() => {
        fetchRetiredAssets(pagination.current, pagination.pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTableChange = (newPagination) => {
        fetchRetiredAssets(newPagination.current, newPagination.pageSize);
    };

    const handleShowModal = (record = null) => {
        setSelectedRecord(record);
        if (record) {
            form.setFieldsValue({
                assetId: record.assetId,
                assetTag: record.assetTag,
                name: record.name,
                category: record.category,
                purchaseDate: record.purchaseDate ? dayjs(record.purchaseDate) : null,
                retirementDate: record.retirementDate ? dayjs(record.retirementDate) : dayjs(),
                retirementReason: record.reason || 'Khác',
                initialValue: record.initialValue,
                currentValue: record.currentValue,
                retirementValue: record.retirementValue,
                retirementMethod: record.retirementMethod,
                status: record.status,
                notes: record.notes,
                serialNumber: record.serialNumber,
            });
            setHasPurchaseDate(!!record.purchaseDate);
            setSerialNumbers(record.serialNumbers || []);
        } else {
            form.resetFields();
            setHasPurchaseDate(false);
            setSerialNumbers([]);
        }
        setIsModalVisible(true);
    };

    const handleViewDetails = (record) => {
        setSelectedRecord(record);
        setIsViewModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            const formattedValues = {
                assetId: values.assetId,
                purchaseDate: values.purchaseDate ? values.purchaseDate.format('YYYY-MM-DD') : null,
                retirementDate: values.retirementDate ? values.retirementDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                reason: values.retirementReason || 'Khác',
                initialValue: Number(values.initialValue),
                currentValue: Number(values.currentValue),
                retirementValue: Number(values.retirementValue),
                retirementMethod: values.retirementMethod,
                status: values.status,
                notes: values.notes,
                user: user.name,
                serialNumber: values.serialNumber,
            };

            if (selectedRecord) {
                await axios.put(`/api/retired-assets/${selectedRecord._id}`, formattedValues, axiosConfig);
                message.success('Cập nhật thông tin thanh lý thành công');
            } else {
                const response = await axios.post('/api/retired-assets', formattedValues, axiosConfig);
                setRetiredAssets([...retiredAssets, { ...formattedValues, _id: response.data.id, key: response.data.id, assetTag: values.assetTag }]);
                message.success('Thêm tài sản thanh lý thành công');
            }
            fetchRetiredAssets(pagination.current, pagination.pageSize);
            setIsModalVisible(false);
            form.resetFields();
            setHasPurchaseDate(false);
            setSerialNumbers([]);
        } catch (error) {
            message.error('Lỗi khi lưu thông tin thanh lý: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setIsViewModalVisible(false);
        form.resetFields();
        setAssetOptions([]);
        setSerialNumbers([]);
        setHasPurchaseDate(false);
    };

    const handleDelete = async (id) => {
        try {
            setLoading(true);
            await axios.delete(`/api/retired-assets/${id}`, axiosConfig);
            fetchRetiredAssets(pagination.current, pagination.pageSize);
            message.success('Xóa tài sản thanh lý thành công');
        } catch (error) {
            message.error('Lỗi khi xóa tài sản thanh lý: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (record) => {
        try {
            setLoading(true);
            await axios.put(`/api/retired-assets/${record._id}/approve`, { status: 'Đã duyệt' }, axiosConfig);
            fetchRetiredAssets(pagination.current, pagination.pageSize);
            message.success('Phê duyệt tài sản thanh lý thành công');
        } catch (error) {
            message.error('Lỗi khi phê duyệt: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (record) => {
        try {
            setLoading(true);
            await axios.put(`/api/retired-assets/${record._id}/reject`, { status: 'Từ chối' }, axiosConfig);
            fetchRetiredAssets(pagination.current, pagination.pageSize);
            message.success('Từ chối tài sản thanh lý thành công');
        } catch (error) {
            message.error('Lỗi khi từ chối: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (record) => {
        const doc = new jsPDF();
        doc.text(`Chi tiết thanh lý tài sản: ${record.assetTag}`, 10, 10);
        doc.text(`Tên tài sản: ${record.name}`, 10, 20);
        doc.text(`Danh mục: ${record.category}`, 10, 30);
        doc.text(`Số SN: ${record.serialNumber || 'N/A'}`, 10, 40);
        doc.text(`Ngày mua: ${record.purchaseDate || 'N/A'}`, 10, 50);
        doc.text(`Ngày thanh lý: ${record.retirementDate || dayjs().format('YYYY-MM-DD')}`, 10, 60);
        doc.text(`Lý do thanh lý: ${record.reason || 'Khác'}`, 10, 70);
        doc.text(`Phương thức thanh lý: ${record.retirementMethod}`, 10, 80);
        doc.text(`Giá trị ban đầu: ${numberFormatter(record.initialValue)} VND`, 10, 90);
        doc.text(`Giá trị hiện tại: ${numberFormatter(record.currentValue)} VND`, 10, 100);
        doc.text(`Giá trị thanh lý: ${numberFormatter(record.retirementValue)} VND`, 10, 110);
        doc.text(`Trạng thái: ${record.status}`, 10, 120);
        doc.text(`Ghi chú: ${record.notes || 'Không có'}`, 10, 130);
        doc.save(`ThanhLyTaiSan_${record.assetTag}.pdf`);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Chờ duyệt': return 'gold';
            case 'Đã duyệt': return 'green';
            case 'Từ chối': return 'red';
            default: return 'blue';
        }
    };

    const columns = [
        { title: 'Mã tài sản', dataIndex: 'assetTag', key: 'assetTag' },
        { title: 'Tên tài sản', dataIndex: 'name', key: 'name' },
        { title: 'Danh mục', dataIndex: 'category', key: 'category' },
        { title: 'Số SN', dataIndex: 'serialNumber', key: 'serialNumber' },
        { title: 'Ngày thanh lý', dataIndex: 'retirementDate', key: 'retirementDate', render: date => date || dayjs().format('YYYY-MM-DD'), sorter: (a, b) => new Date(a.retirementDate || dayjs()) - new Date(b.retirementDate || dayjs()) },
        { title: 'Phương thức', dataIndex: 'retirementMethod', key: 'retirementMethod' },
        { title: 'Giá trị thanh lý', dataIndex: 'retirementValue', key: 'retirementValue', render: value => `${numberFormatter(value)} VND`, sorter: (a, b) => a.retirementValue - b.retirementValue },
        { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: status => <Tag color={getStatusColor(status)} bordered={false}>{status}</Tag> },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button type="text" icon={<SearchOutlined />} onClick={() => handleViewDetails(record)} />
                    </Tooltip>
                    {record.status !== 'Đã duyệt' && record.status !== 'Từ chối' && (
                        <Tooltip title="Chỉnh sửa">
                            <Button type="text" icon={<EditOutlined />} onClick={() => handleShowModal(record)} />
                        </Tooltip>
                    )}
                    {user.phanquyen === 'IT asset' && (
                        <>
                            <Tooltip title="Phê duyệt">
                                <Popconfirm title="Bạn có chắc chắn muốn phê duyệt?" onConfirm={() => handleApprove(record)} okText="Đồng ý" cancelText="Hủy">
                                    <Button type="text" icon={<ExportOutlined />} disabled={record.status === 'Đã duyệt'} />
                                </Popconfirm>
                            </Tooltip>
                            <Tooltip title="Từ chối">
                                <Popconfirm title="Bạn có chắc chắn muốn từ chối?" onConfirm={() => handleReject(record)} okText="Đồng ý" cancelText="Hủy">
                                    <Button type="text" danger icon={<StopOutlined />} disabled={record.status === 'Đã duyệt'} />
                                </Popconfirm>
                            </Tooltip>
                        </>
                    )}
                    {(user.phanquyen === 'IT asset' || hastXoaTSPermission === true) && 
                    <Tooltip title="Xóa">
                        <Popconfirm title="Bạn có chắc chắn muốn xóa?" onConfirm={() => handleDelete(record._id)} okText="Đồng ý" cancelText="Hủy">
                            <Button type="text" danger icon={<DeleteOutlined />} disabled={record.status === 'Đã duyệt'} />
                        </Popconfirm>
                    </Tooltip>
        }
                </Space>
            ),
        },
    ];

    const filteredData = retiredAssets.filter(item => {
        const matchesStatus = filter.status === 'all' || item.status === filter.status;
        const matchesSearch = (item.assetTag?.toLowerCase() || '').includes(filter.search.toLowerCase()) ||
            (item.name?.toLowerCase() || '').includes(filter.search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (!hasquanlyTSPermission && user.phanquyen !== true && !hastKiemKePermission && !hastXoaTSPermission && user.phanquyen !== 'IT asset') {
        return <NotFoundPage />;
      }

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card>
                        <Table
                            columns={columns}
                            locale={{ emptyText: <Empty description="Danh sách trống !" /> }}
                            dataSource={filteredData}
                            title={() => (
                                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
                                    <Input
                                        placeholder="Tìm kiếm theo mã hoặc tên"
                                        prefix={<SearchOutlined />}
                                        value={filter.search}
                                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                                        style={{ marginBottom: 12 }}
                                        size="middle"
                                    />
                                    <Space style={{ flexWrap: 'wrap', marginBottom: 0 }}>
                                        <Select value={filter.status} onChange={(value) => setFilter({ ...filter, status: value })} style={{ width: '100%' }}>
                                            <Option value="all">Tất cả trạng thái</Option>
                                            <Option value="Chờ duyệt">Chờ duyệt</Option>
                                            <Option value="Đã duyệt">Đã duyệt</Option>
                                            <Option value="Từ chối">Từ chối</Option>
                                        </Select>
                                        {(user.phanquyen === 'IT asset' || hasquanlyTSPermission === true) && (
                                            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleShowModal()}>Thêm mới</Button>
                                        )}
                                    </Space>
                                </div>
                            )}
                            pagination={{
                                ...pagination,
                                pageSizeOptions: ["5", "10", "20", "50", "100"],
                                showSizeChanger: true,
                                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                                size: window.innerWidth < 768 ? "small" : "middle"
                            }}
                            onChange={handleTableChange}
                            rowKey="key"
                            bordered
                            scroll={{ x: true }}
                            style={{ width: "100%", whiteSpace: "nowrap" }}
                            loading={loading}
                        />
                    </Card>
                </Col>
            </Row>

            <Modal
                title={selectedRecord ? "Cập nhật thông tin thanh lý" : "Thêm tài sản thanh lý mới"}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                okText={selectedRecord ? "Cập nhật" : "Thêm mới"}
                cancelText="Hủy bỏ"
                width={800}
                centered
                confirmLoading={loading}
                okButtonProps={{ disabled: selectedRecord && (selectedRecord.status === 'Đã duyệt' || selectedRecord.status === 'Từ chối'), shape: 'default' }}
                cancelButtonProps={{ shape: 'default' }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ status: 'Chờ duyệt', retirementDate: dayjs(), retirementReason: 'Khác' }}
                    disabled={selectedRecord && (selectedRecord.status === 'Đã duyệt' || selectedRecord.status === 'Từ chối')}
                >
                    <Form.Item name="assetId" hidden>
                        <Input />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="assetTag" label="Mã tài sản" rules={[{ required: true, message: 'Vui lòng chọn tài sản!' }]}>
                                {selectedRecord ? (
                                    <Input disabled />
                                ) : (
                                    <Select
                                        showSearch
                                        placeholder="Tìm kiếm mã hoặc tên tài sản"
                                        filterOption={false}
                                        onSearch={searchAssets}
                                        onSelect={handleAssetSelect}
                                        options={assetOptions}
                                        notFoundContent={assetOptions.length === 0 ? 'Không tìm thấy tài sản' : null}
                                    />
                                )}
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="name" label="Tên tài sản" rules={[{ required: true, message: 'Vui lòng nhập tên tài sản!' }]}>
                                <Input placeholder="Tên tài sản" disabled />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="serialNumber"
                                label="Số SN"
                                rules={[{ required: true, message: 'Vui lòng chọn số SN để thanh lý!' }]}
                            >
                                <Select
                                    placeholder="Chọn số SN"
                                    disabled={serialNumbers.length === 0}
                                >
                                    {serialNumbers.map(sn => (
                                        <Option key={sn} value={sn}>{sn}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="category" label="Danh mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}>
                                <Select placeholder="Chọn danh mục" disabled>
                                    <Option value="Laptop">Laptop</Option>
                                    <Option value="Desktop">Desktop</Option>
                                    <Option value="Monitor">Monitor</Option>
                                    <Option value="Printer">Printer</Option>
                                    <Option value="Network">Network</Option>
                                    <Option value="Furniture">Furniture</Option>
                                    <Option value="Other">Other</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="purchaseDate"
                                label="Ngày mua"
                                rules={[{ required: true, message: 'Vui lòng chọn ngày mua!' }]}
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    disabled={hasPurchaseDate}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="retirementDate" label="Ngày thanh lý" rules={[{ required: true, message: 'Vui lòng chọn ngày thanh lý!' }]}>
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="initialValue"
                                label="Giá trị ban đầu"
                                rules={[{ required: true, message: 'Vui lòng nhập giá trị ban đầu!' }]}
                            >
                                <InputNumber
                                    min={0}
                                    style={{ width: '100%' }}
                                    addonAfter="VND"
                                    disabled
                                    formatter={numberFormatter}
                                    parser={numberParser}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="currentValue"
                                label="Giá trị hiện tại"
                                rules={[{ required: true, message: 'Vui lòng nhập giá trị hiện tại!' }]}
                            >
                                <InputNumber
                                    min={0}
                                    style={{ width: '100%' }}
                                    addonAfter="VND"
                                    formatter={numberFormatter}
                                    parser={numberParser}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="retirementValue"
                                label="Giá trị thanh lý"
                                rules={[{ required: true, message: 'Vui lòng nhập giá trị thanh lý!' }]}
                            >
                                <InputNumber
                                    min={0}
                                    style={{ width: '100%' }}
                                    addonAfter="VND"
                                    formatter={numberFormatter}
                                    parser={numberParser}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="retirementReason" label="Lý do thanh lý" rules={[{ required: true, message: 'Vui lòng chọn lý do thanh lý!' }]}>
                                <Select placeholder="Chọn lý do">
                                    <Option value="Hết khấu hao">Hết khấu hao</Option>
                                    <Option value="Hỏng hóc">Hỏng hóc</Option>
                                    <Option value="Lỗi thời">Lỗi thời</Option>
                                    <Option value="Nâng cấp">Nâng cấp</Option>
                                    <Option value="Khác">Khác</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="retirementMethod"
                                label="Phương thức thanh lý"
                                rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh lý!' }]}
                            >
                                <Select placeholder="Chọn phương thức">
                                    <Option value="Bán thanh lý">Bán thanh lý</Option>
                                    <Option value="Hủy bỏ">Hủy bỏ</Option>
                                    <Option value="Tặng">Tặng</Option>
                                    <Option value="Tái sử dụng nội bộ">Tái sử dụng nội bộ</Option>
                                    <Option value="Khác">Khác</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}>
                                <Select placeholder="Chọn trạng thái">
                                    <Option value="Chờ duyệt">Chờ duyệt</Option>
                                    <Option value="Đã duyệt">Đã duyệt</Option>
                                    <Option value="Từ chối">Từ chối</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="notes" label="Ghi chú">
                        <Input.TextArea rows={4} placeholder="Nhập ghi chú về việc thanh lý" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Chi tiết thanh lý tài sản"
                open={isViewModalVisible}
                onCancel={handleCancel}
                footer={[
                    <Button key="back" onClick={handleCancel}>Đóng</Button>,
                    <Button key="print" type="primary" icon={<FilePdfOutlined />} onClick={() => handleExport(selectedRecord)}>
                        Xuất PDF
                    </Button>,
                ]}
                width={700}
            >
                {selectedRecord && (
                    <div>
                        <List
                            itemLayout="horizontal"
                            dataSource={[
                                { label: "Mã tài sản:", value: selectedRecord.assetTag },
                                { label: "Tên tài sản:", value: selectedRecord.name },
                                { label: "Danh mục:", value: selectedRecord.category },
                                { label: "Số SN:", value: selectedRecord.serialNumber || 'N/A' },
                                { label: "Ngày mua:", value: selectedRecord.purchaseDate || 'N/A' },
                                { label: "Ngày thanh lý:", value: selectedRecord.retirementDate || dayjs().format('YYYY-MM-DD') },
                                { label: "Lý do thanh lý:", value: selectedRecord.reason || 'Khác' },
                                { label: "Phương thức thanh lý:", value: selectedRecord.retirementMethod },
                                { label: "Giá trị ban đầu:", value: `${numberFormatter(selectedRecord.initialValue)} VND` },
                                { label: "Giá trị hiện tại:", value: `${numberFormatter(selectedRecord.currentValue)} VND` },
                                { label: "Giá trị thanh lý:", value: `${numberFormatter(selectedRecord.retirementValue)} VND` },
                                { label: "Trạng thái:", value: <Tag color={getStatusColor(selectedRecord.status)} bordered={false}>{selectedRecord.status}</Tag> },
                                { label: "Người duyệt:", value: selectedRecord.approvedBy || 'Chưa duyệt' },
                            ]}
                            renderItem={(item) => (
                                <List.Item>
                                    <span style={{ fontWeight: 'bold' }}>{item.label}</span> {item.value}
                                </List.Item>
                            )}
                        />
                        <div style={{ marginTop: 16 }}>
                            <Typography.Title level={5}>Ghi chú:</Typography.Title>
                            <p>{selectedRecord.notes || 'Không có'}</p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ThanhLyTaiSan;