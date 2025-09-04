import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, Input, Button, Space, Modal, Form, Select, DatePicker, Tag, Tooltip, message, App, InputNumber, Upload, Progress, Alert, Spin, Avatar, Empty, Card
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined, UploadOutlined,
  DownloadOutlined, UserAddOutlined, RollbackOutlined
} from '@ant-design/icons';
import axios from 'axios';
import debounce from 'lodash/debounce';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import Avatars from "../../config/design/Avatars";
import NotFoundPage from '../NotFoundPage';
import AssetDetail from './settings/AssetDetails';

const { Option } = Select;
const { Dragger } = Upload;

const Asset = ({ user, hasquanlyTSPermission, hastKiemKePermission, hastXoaTSPermission }) => {
  const [assets, setAssets] = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [minQuantityFilter, setMinQuantityFilter] = useState(null);
  const [maxQuantityFilter, setMaxQuantityFilter] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [isReturnModalVisible, setIsReturnModalVisible] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [uploadExcelProgress, setUploadExcelProgress] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [assignedUsersInfo, setAssignedUsersInfo] = useState({});

  const axiosConfig = useMemo(() => ({
    headers: {
      'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
      'Content-Type': 'application/json',
    },
  }), []);

  const getUserInfo = useCallback(async (keys) => {
    if (!keys) return { name: 'Chưa cấp phát', imgAvatar: null, bophan: null, chucvu: null };
    try {
      const response = await axios.get(`/users/get-by-keys/${keys}`, axiosConfig);
      return {
        name: response.data.name,
        imgAvatar: response.data.imgAvatar,
        bophan: response.data.bophan || 'Không xác định',
        chucvu: response.data.chucvu || 'Không có',
      };
    } catch (error) {
      return { name: keys, imgAvatar: null, bophan: 'Không xác định', chucvu: <Tag color="red" bordered={false}>Không có</Tag> };
    }
  }, [axiosConfig]);

  const fetchAssignedUsersInfo = useCallback(async (asset) => {
    if (!asset?.assignedSerialNumbers) return;

    setLoading(true);
    const userPromises = asset.assignedSerialNumbers.map(async (assignment) => {
      const userInfo = await getUserInfo(assignment.assignedTo);
      return { ...assignment, userInfo };
    });

    const updatedAssignments = await Promise.all(userPromises);
    setAssignedUsersInfo(
      updatedAssignments.reduce((acc, assignment) => {
        acc[assignment.serialNumber] = assignment;
        return acc;
      }, {})
    );
    setLoading(false);
  }, [getUserInfo]);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/assets', {
        ...axiosConfig,
        params: {
          page: currentPage,
          limit: pageSize,
          search: searchText || undefined,
          category: categoryFilter || undefined,
          status: statusFilter || undefined,
          minQuantity: minQuantityFilter || undefined,
          maxQuantity: maxQuantityFilter || undefined,
          fields: 'assetTag,name,category,status,location,quantity,actualQuantity,_id'
        },
      });

      setAssets(response.data.data);
      setTotalAssets(response.data.total);
    } catch (error) {
      message.error(`Không thể tải danh sách tài sản: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [axiosConfig, currentPage, pageSize, searchText, categoryFilter, statusFilter, minQuantityFilter, maxQuantityFilter]);

  const fetchUsers = useMemo(() =>
    debounce((value) => {
      if (!value) {
        setUserOptions([]);
        setUserSearchLoading(false);
        return;
      }
      setUserSearchLoading(true);
      axios
        .get('/users/search', {
          ...axiosConfig,
          params: { search: value, by: 'name,username,code_staff' },
        })
        .then(response => {
          const users = response.data.data.map(user => ({
            value: user.keys,
            label: (
              <Space>
                {user.imgAvatar ? (
                  <Avatar src={user.imgAvatar} size="small" icon={<Spin size="small" />} />
                ) : (
                  <Avatars user={{ name: user.name || user.username }} sizeImg="small" />
                )}
                <span>{user.name}</span>
              </Space>
            ),
            userData: user,
          }));
          setUserOptions(users);
        })
        .catch(error => {
          message.error('Không thể tải danh sách người dùng');
        })
        .finally(() => setUserSearchLoading(false));
    }, 500),
    [axiosConfig]
  );

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const showModal = (asset = null) => {
    setSelectedAsset(asset);
    if (asset) {
      form.setFieldsValue({
        ...asset,
        purchaseDate: asset.purchaseDate ? dayjs(asset.purchaseDate, 'DD-MM-YYYY') : null,
        serialNumbers: asset.serialNumbers || [],
        price: asset.price,
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const showAssignModal = (asset) => {
    setSelectedAsset(asset);
    assignForm.resetFields();
    setIsAssignModalVisible(true);
  };

  const showReturnModal = (asset) => {
    setSelectedAsset(asset);
    returnForm.resetFields();
    fetchAssignedUsersInfo(asset);
    setIsReturnModalVisible(true);
  };

  const showAssetDetails = (assetId) => {
    setSelectedAssetId(assetId);
    setIsDrawerVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsAssignModalVisible(false);
    setIsReturnModalVisible(false);
    form.resetFields();
    assignForm.resetFields();
    returnForm.resetFields();
  };

  const handleSubmit = (values) => {
    const formattedValues = {
      ...values,
      purchaseDate: values.purchaseDate ? values.purchaseDate.format('DD-MM-YYYY') : null,
      serialNumbers: values.serialNumbers || [],
    };

    if (selectedAsset) {
      axios
        .put(`/api/assets/${selectedAsset._id}`, formattedValues, axiosConfig)
        .then(() => {
          message.success('Tài sản đã được cập nhật thành công!');
          setIsModalVisible(false);
          form.resetFields();
          fetchAssets();
        })
        .catch(error => {
          message.error(error.response?.data?.message || 'Không thể cập nhật tài sản');
        });
    } else {
      axios
        .post('/api/assets', formattedValues, axiosConfig)
        .then(() => {
          message.success('Tài sản mới đã được thêm thành công!');
          setIsModalVisible(false);
          form.resetFields();
          fetchAssets();
        })
        .catch(error => {
          message.error(error.response?.data?.message || 'Không thể thêm tài sản');
        });
    }
  };

  const handleAssignSubmit = (values) => {
    const assignedSerialNumber = values.serialNumber ? [{
      serialNumber: values.serialNumber,
      assignedTo: values.assignedTo,
      assignedAt: new Date()
    }] : [];

    const updatedAsset = {
      assignedTo: values.assignedTo,
      assignedSerialNumbers: [
        ...(selectedAsset.assignedSerialNumbers || []),
        ...assignedSerialNumber
      ]
    };

    axios
      .put(`/api/assets/${selectedAsset._id}`, updatedAsset, axiosConfig)
      .then(() => {
        message.success('Cấp phát thiết bị thành công!');
        setIsAssignModalVisible(false);
        assignForm.resetFields();
        fetchAssets();
      })
      .catch(error => {
        message.error(error.response?.data?.message || 'Không thể cấp phát thiết bị');
      });
  };

  const handleReturnSubmit = (values) => {
    const serialNumberToReturn = values.serialNumber;
    const updatedAssignedSerialNumbers = (selectedAsset.assignedSerialNumbers || []).filter(
      assignment => String(assignment.serialNumber) !== String(serialNumberToReturn)
    );

    const updatedAsset = {
      assignedSerialNumbers: updatedAssignedSerialNumbers,
      assignedTo: updatedAssignedSerialNumbers.length > 0 ? selectedAsset.assignedTo : null,
    };

    axios
      .put(`/api/assets/${selectedAsset._id}`, updatedAsset, axiosConfig)
      .then((response) => {
        const newQuantity = response.data.data.quantity;
        message.success(`Thiết bị với SN ${serialNumberToReturn} đã được trả về kho thành công! Tồn kho hiện tại: ${newQuantity}`);
        setIsReturnModalVisible(false);
        returnForm.resetFields();
        fetchAssets();
      })
      .catch(error => {
        message.error(error.response?.data?.message || 'Không thể trả thiết bị');
      });
  };

  const handleUserSelect = (value, option) => {
    const selectedUser = option.userData;
    form.setFieldsValue({
      assignedTo: selectedUser.keys,
      location: selectedUser.bophan || selectedUser.chetheusanh || 'Không xác định',
    });
  };

  const deleteAsset = (assetId) => {
    Modal.confirm({
      title: 'Xác nhận xóa tài sản',
      content: 'Bạn có chắc chắn muốn xóa tài sản này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk() {
        axios
          .delete(`/api/assets/${assetId}`, axiosConfig)
          .then(() => {
            message.success('Tài sản đã được xóa thành công!');
            fetchAssets();
          })
          .catch(error => {
            message.error('Không thể xóa tài sản');
          });
      },
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đang sử dụng': return 'green';
      case 'Bảo hành': return 'orange';
      case 'Đã thanh lý': return 'red';
      default: return 'default';
    }
  };

  const handleExport = () => {
    message.loading('Đang chuẩn bị file tải xuống...', 0);
    axios
      .get('/api/assets', { ...axiosConfig, params: { limit: 0 } })
      .then(response => {
        const data = response.data.data.map(asset => ({
          'Mã tài sản': asset.assetTag,
          'Tên tài sản': asset.name,
          'Danh mục': asset.category,
          'Trạng thái': asset.status,
          'Vị trí': asset.location,
          'Người dùng (keys)': asset.assignedTo || 'Chưa phân công',
          'Ngày mua': asset.purchaseDate,
          'Giá mua': asset.price,
          'Danh sách số serial': asset.serialNumbers.join(', '),
          'Số lượng khả dụng': asset.quantity,
          'Ngày tạo': dayjs(asset.createdAt).format('DD-MM-YYYY HH:mm:ss'),
          'Ngày cập nhật': dayjs(asset.updatedAt).format('DD-MM-YYYY HH:mm:ss'),
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Assets');
        XLSX.writeFile(wb, 'Danh_sach_tai_san.xlsx');
        message.destroy();
        message.success('Tải xuống thành công!');
      })
      .catch(error => {
        message.error('Không thể tải xuống danh sách tài sản');
      });
  };

  const handleUpload = ({ file }) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      message.error('Chỉ hỗ trợ các tệp Excel (.xlsx, .xls).');
      return;
    }
    setUploadingExcel(true);
    setUploadExcelProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const totalItems = jsonData.length;
      let processedItems = 0;

      const uploadPromises = jsonData.map((item) => {
        const serialNumbers = item['Danh sách số serial']?.split(',').map(sn => sn.trim()) || [];
        const formattedItem = {
          assetTag: item['Mã tài sản'],
          name: item['Tên tài sản'],
          category: item['Danh mục'],
          status: item['Trạng thái'],
          location: item['Vị trí'],
          assignedTo: item['Người dùng (keys)'] === 'Chưa cấp phát' ? null : item['Người dùng (keys)'],
          purchaseDate: item['Ngày mua'],
          price: item['Giá mua'],
          serialNumbers: serialNumbers,
        };

        return axios
          .post('/api/assets', formattedItem, axiosConfig)
          .then(response => {
            processedItems++;
            setUploadExcelProgress(Math.round((processedItems / totalItems) * 100));
            return { _id: response.data.id, ...formattedItem, createdAt: new Date(), updatedAt: new Date() };
          })
          .catch(error => {
            return null;
          });
      });

      Promise.all(uploadPromises)
        .then(newAssets => {
          const validAssets = newAssets.filter(asset => asset !== null);
          message.success(`Đã tải lên ${validAssets.length} tài sản thành công!`);
          fetchAssets();
        })
        .catch(() => {
          message.error('Tải lên thất bại, vui lòng thử lại.');
        })
        .finally(() => {
          setUploadingExcel(false);
          setIsUploadModalVisible(false);
          setUploadExcelProgress(0);
        });
    };
    reader.readAsArrayBuffer(file);
  };

  const columns = [
    { title: 'Mã tài sản', dataIndex: 'assetTag', key: 'assetTag', sorter: (a, b) => a.assetTag?.localeCompare(b.assetTag) },
    { title: 'Tên tài sản', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name?.localeCompare(b.name) },
    { title: 'Danh mục', dataIndex: 'category', key: 'category' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => <Tag color={getStatusColor(status)} bordered={false}>{status}</Tag> },
    { title: 'Vị trí', dataIndex: 'location', key: 'location', render: (location) => location || <Tag color="red" bordered={false}>Không có</Tag> },
    {
      title: 'Số lượng khả dụng',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
      render: (quantity) => <Tag color="blue" bordered={false}>{quantity}</Tag>,
    },
    {
      title: 'Tổng số lượng',
      dataIndex: 'actualQuantity',
      key: 'actualQuantity',
      sorter: (a, b) => a.actualQuantity - b.actualQuantity,
      render: (actualQuantity) => <Tag color="purple" bordered={false}>{actualQuantity}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chi tiết"><Button type="text" icon={<InfoCircleOutlined />} onClick={() => showAssetDetails(record._id)} /></Tooltip>
          {(user.phanquyen === 'IT asset' || hastXoaTSPermission === true || hastKiemKePermission === true) &&
            <>
              <Tooltip title="Chỉnh sửa"><Button type="text" icon={<EditOutlined />} onClick={() => showModal(record)} /></Tooltip>
              <Tooltip title="Cấp phát"><Button type="text" icon={<UserAddOutlined />} onClick={() => showAssignModal(record)} /></Tooltip>
              <Tooltip title="Trả thiết bị"><Button type="text" icon={<RollbackOutlined />} onClick={() => showReturnModal(record)} disabled={!record.assignedSerialNumbers || record.assignedSerialNumbers.length === 0} /></Tooltip>
            </>
          }
          {(user.phanquyen === 'IT asset' || hastXoaTSPermission === true) && <Tooltip title="Xóa"><Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteAsset(record._id)} /></Tooltip>}
        </Space>
      ),
    },
  ];

  if (!hasquanlyTSPermission && user.phanquyen !== true && !hastKiemKePermission && !hastXoaTSPermission && user.phanquyen !== 'IT asset') {
    return <NotFoundPage />;
  }

  return (
    <App>
      <div>
        <Card title="Demo">
          <Table
            columns={columns}
            dataSource={assets}
            rowKey="_id"
            bordered
            size='middle'
            scroll={{ x: true }}
            style={{ width: '100%', whiteSpace: 'nowrap' }}
            loading={loading}
            title={() => (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Input
                  placeholder="Tìm kiếm theo mã, tên hoặc số serial..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: '100%', marginBottom: 12 }}
                  size='middle'
                />
                <div style={{ display: 'flex', gap: 8, flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
                  <Select placeholder="Lọc theo danh mục" value={categoryFilter} onChange={setCategoryFilter} allowClear style={{ width: '100%' }}>
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
                  <Select placeholder="Lọc theo trạng thái" value={statusFilter} onChange={setStatusFilter} allowClear style={{ width: '100%' }}>
                    <Option value="Đang sử dụng">Đang sử dụng</Option>
                    <Option value="Bảo hành">Bảo hành</Option>
                    <Option value="Đã thanh lý">Đã thanh lý</Option>
                  </Select>
                  <InputNumber
                    placeholder="Số lượng tồn tối thiểu"
                    value={minQuantityFilter}
                    onChange={setMinQuantityFilter}
                    style={{ width: '100%' }}
                    min={0}
                  />
                  <InputNumber
                    placeholder="Số lượng tồn tối đa"
                    value={maxQuantityFilter}
                    onChange={setMaxQuantityFilter}
                    style={{ width: '100%' }}
                    min={0}
                  />
                  <Button icon={<DownloadOutlined />} onClick={handleExport}>Export Excel</Button>
                  {(user.phanquyen === 'IT asset' || user.phanquyen === true) && (
                    <Button icon={<UploadOutlined />} onClick={() => setIsUploadModalVisible(true)}>Import Excel</Button>
                  )}
                 {user.phanquyen === true || user.phanquyen === "IT asset" ? (
                   <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Thêm tài sản</Button>
                 ) : null}
                </div>
              </div>
            )}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalAssets,
              pageSizeOptions: ["5", "10", "20", "50", "100"],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              showSizeChanger: true,
              onChange: (page, pageSize) => handleTableChange({ current: page, pageSize }),
              size: window.innerWidth < 768 ? "small" : "middle"
            }}
            locale={{ emptyText: <Empty description="Danh sách trống !" /> }}
          />
        </Card>

        <Modal
          title={selectedAsset ? 'Chỉnh sửa tài sản' : 'Thêm tài sản mới'}
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          centered
          width={800}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Form.Item name="assetTag" label="Mã tài sản" rules={[{ required: true, message: 'Vui lòng nhập mã tài sản!' }]} style={{ flex: '1 0 200px' }}>
                <Input placeholder="Ví dụ: LT-001" />
              </Form.Item>
              <Form.Item name="name" label="Tên tài sản" rules={[{ required: true, message: 'Vui lòng nhập tên tài sản!' }]} style={{ flex: '1 0 200px' }}>
                <Input placeholder="Ví dụ: Dell XPS 13" />
              </Form.Item>
              <Form.Item name="category" label="Danh mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]} style={{ flex: '1 0 200px' }}>
                <Select placeholder="Chọn danh mục">
                  <Option value="Laptop">Laptop</Option>
                  <Option value="Desktop">Desktop</Option>
                  <Option value="Monitor">Màn hình</Option>
                  <Option value="Printer">Máy in</Option>
                  <Option value="Network">Thiết bị mạng</Option>
                  <Option value="Software">Phần mềm</Option>
                  <Option value="Other">Khác</Option>
                </Select>
              </Form.Item>
              <Form.Item name="location" label="Vị trí" style={{ flex: '1 0 200px' }}>
                <Input placeholder="Vị trí..." />
              </Form.Item>
              <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]} style={{ flex: '1 0 200px' }}>
                <Select placeholder="Chọn trạng thái">
                  <Option value="Đang sử dụng">Đang sử dụng</Option>
                  <Option value="Bảo hành">Bảo hành</Option>
                  <Option value="Đã thanh lý">Đã thanh lý</Option>
                </Select>
              </Form.Item>
              <Form.Item name="purchaseDate" label="Ngày mua" style={{ flex: '1 0 200px' }}>
                <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
              </Form.Item>
              <Form.Item
                name="price"
                label="Giá mua"
                style={{ flex: '1 0 200px' }}
              >
                <InputNumber
                  placeholder="Ví dụ: 25.000.000"
                  formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="VND"
                  style={{ width: '100%' }}
                  min={0}
                />
              </Form.Item>
              <Form.Item name="manufacturer" label="Nhà sản xuất" style={{ flex: '1 0 200px' }}>
                <Input placeholder="Ví dụ: Dell" />
              </Form.Item>
              <Form.Item name="model" label="Model" style={{ flex: '1 0 200px' }}>
                <Input placeholder="Ví dụ: XPS 13" />
              </Form.Item>
              <Form.Item
                name="serialNumbers"
                label="Danh sách số serial"
                rules={[{ required: true, message: 'Vui lòng nhập ít nhất một số serial!' }]}
                style={{ flex: '1 0 100%' }}
              >
                <Select
                  mode="tags"
                  placeholder="Nhập số serial và nhấn Enter (ví dụ: DELL12345678)"
                  tokenSeparators={[',']}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item name="notes" label="Ghi chú" style={{ flex: '1 0 100%' }}>
                <Input.TextArea rows={3} />
              </Form.Item>
            </div>
            <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 12 }}>
              <Space>
                <Button onClick={handleCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit">{selectedAsset ? 'Cập nhật' : 'Thêm mới'}</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Cấp phát thiết bị"
          open={isAssignModalVisible}
          onCancel={handleCancel}
          footer={null}
        >
          <Form form={assignForm} layout="vertical" onFinish={handleAssignSubmit}>
            <Form.Item
              name="assignedTo"
              label="Người dùng"
              rules={[{ required: true, message: 'Vui lòng chọn người dùng!' }]}
            >
              <Select
                showSearch
                placeholder="Tìm theo tên, username, hoặc mã nhân viên"
                filterOption={false}
                onSearch={fetchUsers}
                onChange={handleUserSelect}
                loading={userSearchLoading}
                notFoundContent={userSearchLoading ? <Spin size="small" /> : null}
                options={userOptions}
                allowClear
              />
            </Form.Item>
            <Form.Item
              name="serialNumber"
              label={`Số serial khả dụng (${selectedAsset?.quantity || 0} thiết bị trong kho)`}
            >
              <Select
                placeholder="Chọn số serial hoặc để trống"
                allowClear
                disabled={selectedAsset?.quantity === 0}
              >
                {selectedAsset?.serialNumbers
                  .filter(sn => !selectedAsset?.assignedSerialNumbers?.some(assigned => assigned.serialNumber === sn))
                  .map(sn => (
                    <Option key={sn} value={sn}>{sn}</Option>
                  ))}
              </Select>
            </Form.Item>
            <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
              <Space>
                <Button onClick={handleCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit">Cấp phát</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Trả thiết bị về kho"
          open={isReturnModalVisible}
          onCancel={handleCancel}
          footer={null}
        >
          <Form form={returnForm} layout="vertical" onFinish={handleReturnSubmit}>
            <Form.Item
              name="serialNumber"
              label={`Số serial đã cấp phát (${selectedAsset?.assignedSerialNumbers?.length || 0} thiết bị) - Tồn kho hiện tại: ${selectedAsset?.quantity || 0}`}
              rules={[{ required: true, message: 'Vui lòng chọn số serial đểmithấy!' }]}
            >
              <Select
                placeholder="Chọn số serial để trả"
                allowClear
                loading={loading}
              >
                {selectedAsset?.assignedSerialNumbers?.map(assignment => {
                  const user = assignedUsersInfo[assignment.serialNumber]?.userInfo || { name: assignment.assignedTo };
                  return (
                    <Option key={assignment.serialNumber} value={assignment.serialNumber}>
                      <Space>
                        {assignment.serialNumber} (Cấp cho:
                        {user.imgAvatar ? (
                          <Avatar src={user.imgAvatar} size="small" />
                        ) : (
                          <Avatars user={{ name: user.name }} sizeImg="small" />
                        )}
                        <span>{user.name || assignment.assignedTo}</span>)
                      </Space>
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
            <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
              <Space>
                <Button onClick={handleCancel}>Hủy</Button>
                <Button type="primary" htmlType="submit">Trả thiết bị</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        <Modal title="Tải lên Excel" open={isUploadModalVisible} onCancel={() => setIsUploadModalVisible(false)} footer={null} closable={!uploadingExcel}>
          {uploadingExcel ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 15 }}>
              <p>Đang tải lên và xử lý...</p>
              <Progress type="circle" percent={uploadExcelProgress} />
              <Alert message="Vui lòng chờ cho đến khi quá trình tải lên hoàn tất." type="warning" showIcon banner />
            </div>
          ) : (
            <Dragger accept=".xlsx, .xls" showUploadList={false} customRequest={handleUpload}>
              <p className="ant-upload-drag-icon"><UploadOutlined /></p>
              <p className="ant-upload-text">Nhấp hoặc kéo thả tệp Excel vào đây để tải lên</p>
              <p className="ant-upload-hint">Chỉ hỗ trợ định dạng .xlsx và .xls</p>
            </Dragger>
          )}
        </Modal>

        <AssetDetail
          visible={isDrawerVisible}
          onClose={() => setIsDrawerVisible(false)}
          assetId={selectedAssetId}
          hastKiemKePermission={hastKiemKePermission}
          onEdit={(asset) => {
            setIsDrawerVisible(false);
            showModal(asset);
          }}
          axiosConfig={axiosConfig}
          getUserInfo={getUserInfo}
        />
      </div>
    </App>
  );
};

export default Asset;