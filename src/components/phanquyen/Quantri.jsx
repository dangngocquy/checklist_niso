import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Table, Button, Popconfirm, Space, Tag, message, Card, Dropdown, Checkbox, Menu, Drawer, Input, DatePicker, Select, Spin, Avatar, Empty, Tooltip } from 'antd';
import useApi from '../../hook/useApi';
import { DeleteOutlined, DownOutlined, SearchOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import Avatars from '../../config/design/Avatars';
import moment from 'moment';
const { RangePicker } = DatePicker;
const { Option } = Select;

const Quantri = ({ t }) => {
    const { request, loading } = useApi();
    const [dataSource, setDataSource] = useState([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [visibleColumns, setVisibleColumns] = useState({});
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [drawerContent, setDrawerContent] = useState('');
    const [checklistSearch, setChecklistSearch] = useState('');
    const [dateRange, setDateRange] = useState({
        responseDate: [],
        createDate: []
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [totalRecords, setTotalRecords] = useState(0);
    const [users, setUsers] = useState([]);
    const [selectedPoster, setSelectedPoster] = useState(null);
    const [selectedResponder, setSelectedResponder] = useState(null);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [sortConfig, setSortConfig] = useState({
        sortBy: 'ngay_phan_hoi',
        sortOrder: 'DESC'
    });

    const showDrawer = useCallback((content) => {
        setDrawerContent(content);
        setDrawerVisible(true);
    }, []);

    const closeDrawer = useCallback(() => {
        setDrawerVisible(false);
        setDrawerContent('');
    }, []);

    const renderLongText = useCallback((text) => {
        if (!text) return <Tag color="red" bordered={false}>Trống</Tag>;
        const MAX_LENGTH = 50;
        if (text.length > MAX_LENGTH) {
            return (
                <span>
                    {text.substring(0, MAX_LENGTH)}...
                    <Button
                        type="link"
                        size="small"
                        onClick={() => showDrawer(text)}
                        style={{ padding: 0, height: 'auto' }}
                    >
                        Xem thêm
                    </Button>
                </span>
            );
        }
        return text;
    }, [showDrawer]);

    const fetchUsers = useCallback(async (searchTerm = '') => {
        try {
            setIsLoadingUsers(true);
            const response = await request({
                method: 'GET',
                url: '/users/search',
                params: { search: searchTerm || undefined }
            });
            setUsers(response.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            message.error('Không thể tải danh sách người dùng');
        } finally {
            setIsLoadingUsers(false);
        }
    }, [request]);

    const fetchContent = useCallback(async (page = 1, size = pageSize, sortBy = sortConfig.sortBy, sortOrder = sortConfig.sortOrder) => {
        try {
            const params = {
                page,
                pageSize: size,
                search: checklistSearch || undefined,
                nguoidang: selectedPoster || undefined,
                nguoi_tra_loi: selectedResponder || undefined,
                ngay_phan_hoi_start: dateRange.responseDate[0]?.isValid()
                    ? moment(dateRange.responseDate[0]).format('DD-MM-YYYY')
                    : undefined,
                ngay_phan_hoi_end: dateRange.responseDate[1]?.isValid()
                    ? moment(dateRange.responseDate[1]).format('DD-MM-YYYY')
                    : undefined,
                ngay_tao_phieu_start: dateRange.createDate[0]?.isValid()
                    ? moment(dateRange.createDate[0]).format('DD-MM-YYYY')
                    : undefined,
                ngay_tao_phieu_end: dateRange.createDate[1]?.isValid()
                    ? moment(dateRange.createDate[1]).format('DD-MM-YYYY')
                    : undefined,
                sortBy,
                sortOrder
            };
            console.log('API Params:', params);
            const response = await request({
                method: 'GET',
                url: '/content/all-grouped', // Fixed endpoint
                params
            });
            console.log('API Response:', response);
            if (!response.success) {
                throw new Error(response.message || 'API returned unsuccessful response');
            }
            setDataSource(Array.isArray(response.data) ? response.data : []);
            setTotalRecords(response.pagination?.total || 0);
            setCurrentPage(page);
            setPageSize(size);
        } catch (error) {
            console.error('Error fetching content:', error);
            message.error('Không thể tải dữ liệu: ' + (error.message || 'Lỗi không xác định'));
            setDataSource([]);
            setTotalRecords(0);
        }
    }, [request, checklistSearch, selectedPoster, selectedResponder, dateRange, pageSize, sortConfig]);

    const handleDelete = useCallback(async (keys) => {
        try {
            await request({
                method: 'DELETE',
                url: `/content/delete/${keys}`
            });
            message.success('Xóa thành công');
            fetchContent(currentPage, pageSize);
        } catch (error) {
            message.error('Xóa thất bại');
            console.error('Error deleting content:', error);
        }
    }, [request, fetchContent, currentPage, pageSize]);

    const handleDeleteSelected = useCallback(async () => {
        try {
            await request({
                method: 'POST',
                url: '/content/delete-all',
                data: { keys: selectedRowKeys }
            });
            message.success('Xóa các mục đã chọn thành công');
            setSelectedRowKeys([]);
            fetchContent(currentPage, pageSize);
        } catch (error) {
            message.error('Xóa thất bại');
            console.error('Error deleting multiple contents:', error);
        }
    }, [request, selectedRowKeys, fetchContent, currentPage, pageSize]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const allColumns = useMemo(() => [
        {
            title: 'Tên phiếu',
            dataIndex: 'ten_phieu',
            key: 'ten_phieu',
            render: (text) => renderLongText(text),
        },
        {
            title: 'Nội dung phiếu',
            dataIndex: 'noi_dung_phieu',
            key: 'noi_dung_phieu',
            ellipsis: true,
            render: (text) => renderLongText(text),
        },
        {
            title: 'Chi nhánh',
            dataIndex: 'chi_nhanh',
            key: 'chi_nhanh',
            render: (text) => text ? <Tag color="blue" bordered={false}>{text}</Tag> : <Tag color="red" bordered={false}>Trống</Tag>,
        },
        {
            title: 'Người đăng',
            dataIndex: 'nguoidang',
            key: 'nguoidang',
            render: (text) => text ? <Tag color="purple" bordered={false}>{text}</Tag> : <Tag color="red" bordered={false}>Trống</Tag>,
        },
        {
            title: 'Người trả lời',
            dataIndex: 'nguoi_tra_loi',
            key: 'nguoi_tra_loi',
            render: (text) => text ? <Tag color="purple" bordered={false}>{text}</Tag> : <Tag color="red" bordered={false}>Trống</Tag>,
        },
        {
            title: 'Ngày phản hồi',
            dataIndex: 'ngay_phan_hoi',
            key: 'ngay_phan_hoi',
            render: (text) => renderLongText(text),
        },
        {
            title: 'Bộ phận',
            dataIndex: 'bo_phan',
            key: 'bo_phan',
            render: (text) => renderLongText(text),
        },
        {
            title: 'Ngày tạo phiếu',
            dataIndex: 'ngay_tao_phieu',
            key: 'ngay_tao_phieu',
            render: (text) => renderLongText(text),
        },
        {
            title: 'Cửa hàng',
            dataIndex: 'cua_hang',
            key: 'cua_hang',
            render: (text) => text ? <Tag color="blue" bordered={false}>{text}</Tag> : <Tag color="red" bordered={false}>Trống</Tag>,
        },
        {
            title: 'Chức vụ',
            dataIndex: 'chuc_vu',
            key: 'chuc_vu',
            render: (text) => renderLongText(text),
        },
        {
            title: 'Câu hỏi',
            dataIndex: 'cau_hoi',
            key: 'cau_hoi',
            render: (text) => text ? renderLongText(text) : <Tag color="red" bordered={false}>Trống</Tag>,
        },
        {
            title: 'Câu trả lời',
            dataIndex: 'cau_tra_loi',
            key: 'cau_tra_loi',
            render: (text) => text ? renderLongText(text) : <Tag color="red" bordered={false}>Trống</Tag>,
        },
        {
            title: 'Điểm',
            dataIndex: 'Point',
            key: 'Point',
            render: (text) => text !== null && text !== undefined ? text : <Tag color="red" bordered={false}>Trống</Tag>,
        },
        {
            title: 'Yêu cầu',
            dataIndex: 'yeu_cau',
            key: 'yeu_cau',
            render: (text) => text ? renderLongText(text) : <Tag color="red" bordered={false}>Trống</Tag>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'TrangThai',
            key: 'TrangThai',
            render: (text) => text ? renderLongText(text) : <Tag color="red" bordered={false}>Trống</Tag>,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Popconfirm title="Xác nhận xóa dữ liệu?" onConfirm={() => handleDelete(record.keys)}>
                    <Tooltip title="Xóa">
                        <Button danger shape='circle' icon={<DeleteOutlined />} />
                    </Tooltip>
                </Popconfirm>
            ),
        },
    ], [renderLongText, handleDelete]);

    useEffect(() => {
        const initialVisible = {};
        allColumns.forEach(column => {
            initialVisible[column.key] = true;
        });
        setVisibleColumns(initialVisible);
    }, [allColumns]);

    const handleColumnToggle = useCallback((key) => {
        setVisibleColumns(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    }, []);

    const columnMenu = useMemo(() => (
        <Menu>
            {allColumns.map(column => (
                <Menu.Item key={column.key}>
                    <Checkbox
                        checked={visibleColumns[column.key]}
                        onChange={() => handleColumnToggle(column.key)}
                    >
                        {column.title}
                    </Checkbox>
                </Menu.Item>
            ))}
        </Menu>
    ), [allColumns, visibleColumns, handleColumnToggle]);

    const filteredColumns = useMemo(() =>
        allColumns.filter(column => visibleColumns[column.key]),
        [allColumns, visibleColumns]
    );

    const rowSelection = useMemo(() => ({
        selectedRowKeys,
        onChange: (newSelectedRowKeys) => {
            setSelectedRowKeys(newSelectedRowKeys);
        },
    }), [selectedRowKeys]);

    const handleTableChange = (pagination) => {
        fetchContent(pagination.current, pagination.pageSize, sortConfig.sortBy, sortConfig.sortOrder);
    };

    const handleSort = (field) => {
        setSortConfig(prev => ({
            sortBy: field,
            sortOrder: prev.sortBy === field && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC'
        }));
    };

    const handleSearch = (value) => {
        if (value) {
            fetchUsers(value);
        } else {
            setUsers([]);
        }
    };

    const renderUserOption = (user) => (
        <Option key={user.keys} value={user.username}>
            <Space>
                {user.imgAvatar ? (
                    <Avatar src={user.imgAvatar} size="small" />
                ) : (
                    <Avatars user={{ name: user.name || user.username }} sizeImg="small" />
                )}
                <span>{user.name || user.username}</span>
            </Space>
        </Option>
    );

    return (
        <div className='layout_main_niso'>
            <title>NISO | Quản lý database</title>
            <Card>
                <Table
                    bordered
                    rowSelection={rowSelection}
                    columns={filteredColumns}
                    dataSource={dataSource}
                    rowKey="keys"
                    locale={{ emptyText: <Empty description="Không tìm thấy dữ liệu. Vui lòng kiểm tra bộ lọc hoặc làm mới." /> }}
                    loading={loading}
                    size='middle'
                    title={() => (
                        <div>
                            <Input
                                placeholder="Tìm kiếm checklist"
                                prefix={<SearchOutlined />}
                                value={checklistSearch}
                                onChange={(e) => setChecklistSearch(e.target.value)}
                                onPressEnter={() => fetchContent(1, pageSize, sortConfig.sortBy, sortConfig.sortOrder)}
                                size='middle'
                            />
                            <div>
                                <Space style={{ marginBottom: 12, flexWrap: 'wrap', marginTop: 12 }}>
                                    <Select
                                        placeholder="Lọc theo người đăng"
                                        onChange={(value) => setSelectedPoster(value)}
                                        value={selectedPoster}
                                        allowClear
                                        showSearch
                                        onSearch={handleSearch}
                                        optionFilterProp="children"
                                        filterOption={false}
                                        loading={isLoadingUsers}
                                        notFoundContent={isLoadingUsers ? (
                                            <Space>
                                                <Spin size="small" />
                                                <span>Loading...</span>
                                            </Space>
                                        ) : 'Nhập để tìm kiếm'}
                                    >
                                        {users.map(renderUserOption)}
                                    </Select>
                                    <Select
                                        placeholder="Lọc theo người trả lời"
                                        onChange={(value) => setSelectedResponder(value)}
                                        value={selectedResponder}
                                        allowClear
                                        showSearch
                                        onSearch={handleSearch}
                                        optionFilterProp="children"
                                        filterOption={false}
                                        loading={isLoadingUsers}
                                        notFoundContent={isLoadingUsers ? (
                                            <Space>
                                                <Spin size="small" />
                                                <span>Loading...</span>
                                            </Space>
                                        ) : 'Nhập để tìm kiếm'}
                                    >
                                        {users.map(renderUserOption)}
                                    </Select>
                                    <RangePicker
                                        placeholder={['Từ ngày tạo', 'Đến ngày tạo']}
                                        onChange={(dates) => setDateRange(prev => ({ ...prev, createDate: dates || [] }))}
                                        format="DD-MM-YYYY"
                                    />
                                    <RangePicker
                                        placeholder={['Từ ngày phản hồi', 'Đến ngày phản hồi']}
                                        onChange={(dates) => setDateRange(prev => ({ ...prev, responseDate: dates || [] }))}
                                        format="DD-MM-YYYY"
                                    />
                                </Space>
                            </div>
                            <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <Button
                                        type="primary"
                                        onClick={() => {
                                            setChecklistSearch('');
                                            setSelectedPoster(null);
                                            setSelectedResponder(null);
                                            setDateRange({ responseDate: [], createDate: [] });
                                            fetchContent(1, pageSize, sortConfig.sortBy, sortConfig.sortOrder);
                                        }}
                                    >
                                        Làm mới
                                    </Button>
                                    <Dropdown overlay={columnMenu} trigger={['click']}>
                                        <Button icon={<DownOutlined />}>
                                            Chọn cột hiển thị
                                        </Button>
                                    </Dropdown>
                                </div>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <Button
                                        icon={sortConfig.sortBy === 'ngay_phan_hoi' && sortConfig.sortOrder === 'ASC' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                                        onClick={() => handleSort('ngay_phan_hoi')}
                                    >
                                        Theo ngày phản hồi
                                    </Button>
                                    <Button
                                        icon={sortConfig.sortBy === 'ngay_tao_phieu' && sortConfig.sortOrder === 'ASC' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                                        onClick={() => handleSort('ngay_tao_phieu')}
                                    >
                                        Theo ngày tạo
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    scroll={{ x: true }}
                    style={{ width: "100%", whiteSpace: "nowrap" }}
                    footer={() => (
                        <Popconfirm
                            title={t("Department.input249") || "Bạn có chắc muốn xóa các mục đã chọn?"}
                            onConfirm={handleDeleteSelected}
                            disabled={selectedRowKeys.length === 0}
                            okText="Có"
                            cancelText="Không"
                        >
                            <Button
                                danger
                                type="primary"
                                disabled={selectedRowKeys.length === 0}
                            >
                                {t("Department.input250") || "Xóa các mục đã chọn"} ({selectedRowKeys.length})
                            </Button>
                        </Popconfirm>
                    )}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: totalRecords,
                        showSizeChanger: true,
                        pageSizeOptions: ['5', '10', '20', '50', '100'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                        size: window.innerWidth < 768 ? "small" : "middle"
                    }}
                    onChange={handleTableChange}
                />
            </Card>
            <Drawer
                title="Nội dung chi tiết"
                placement="right"
                onClose={closeDrawer}
                closeIcon={null}
                extra={
                    <Button onClick={closeDrawer}>Close</Button>
                }
                open={drawerVisible}
                width={400}
            >
                <p style={{ whiteSpace: 'pre-wrap' }}>{drawerContent}</p>
            </Drawer>
        </div>
    );
};

export default React.memo(Quantri);