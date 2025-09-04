import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Table, Switch, Space, Button, Input, Form, message, Empty, Tag, Modal, Tree, Divider, Card,
  Checkbox, Tabs, Popconfirm, Spin, Avatar, Tooltip
} from 'antd';
import {
  UserOutlined, TeamOutlined, ShopOutlined, EditOutlined, DeleteOutlined, KeyOutlined, PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import useApi from '../../hook/useApi';
import debounce from 'lodash/debounce';
import UserInfoCard from '../../hook/UserInfoCard';
import Avatars from '../../config/design/Avatars';

const { TabPane } = Tabs;

const DEFAULT_PERMISSIONS = {
  account: ['Cho phép chấm công', 'Tạo công và quản lý ca làm việc', 'Tạo checklist', 'Sửa checklist', 'Xóa checklist', 'Cấu hình điểm nâng cao', 'Xóa phản hồi', 'Xem phản hồi', 'Xử lý phản hồi', 'Gán phản hồi', 'Quản lý báo cáo', 'Quản lý tài sản', 'Xóa tài sản', 'Kiểm kê tài sản', 'Tạo thông báo'],
  department: ['Cho phép chấm công', 'Tạo công và quản lý ca làm việc', 'Tạo checklist', 'Sửa checklist', 'Xóa checklist', 'Cấu hình điểm nâng cao', 'Xóa phản hồi', 'Xem phản hồi', 'Xử lý phản hồi', 'Gán phản hồi', 'Quản lý báo cáo', 'Quản lý tài sản', 'Xóa tài sản', 'Kiểm kê tài sản', 'Tạo thông báo'],
  restaurant: ['Cho phép chấm công', 'Tạo công và quản lý ca làm việc', 'Tạo checklist', 'Sửa checklist', 'Xóa checklist', 'Cấu hình điểm nâng cao', 'Xóa phản hồi', 'Xem phản hồi', 'Xử lý phản hồi', 'Gán phản hồi', 'Quản lý báo cáo', 'Quản lý tài sản', 'Xóa tài sản', 'Kiểm kê tài sản', 'Tạo thông báo'],
};

const TabHeader = ({ activeTabKey, navigate }) => (
  <Tabs activeKey={activeTabKey} onChange={(key) => navigate(`/auth/docs/phan-quyen/${key}`)} style={{ marginBottom: 0 }} type="card"
    size="small">
    <TabPane tab={<span><UserOutlined /> Tài khoản</span>} key="account" />
    <TabPane tab={<span><TeamOutlined /> Khối / Phòng</span>} key="department" />
    <TabPane tab={<span><ShopOutlined /> Nhà hàng</span>} key="restaurant" />
    <TabPane tab={<span><KeyOutlined /> Module</span>} key="module" />
  </Tabs>
);

const AccountTab = ({ t, accounts, loadingAccounts, totalItems, currentPage, handlePageChange, handleSearch, showModal, activeTabKey, navigate, selectedRowKeys, setSelectedRowKeys, searchText }) => {
  const accountColumns = [
    {
      title: 'Họ và tên',
      dataIndex: 'imgAvatar',
      key: 'imgAvatar',
      render: (imgAvatar, record) => {
        // Construct user object for UserInfoCard
        const userForCard = {
          name: record.name || 'Unknown User',
          username: record.username || 'N/A',
          imgAvatar: record.imgAvatar || null,
          keys: record.keys || 'N/A',
          email: record.email || null,
          chucvu: record.chucvu || null,
          chinhanh: record.chinhanh || 'N/A',
          bophan: record.bophan || 'N/A',
          locker: record.locker || false,
          imgBackground: record.imgBackground || null,
          code_staff: record.code_staff || 'N/A',
        };
    
        return (
          <Space>
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
                {imgAvatar ? (
                  <Avatar
                    src={imgAvatar}
                    size="middle"
                    style={{ pointerEvents: 'auto' }}
                  />
                ) : (
                  <span style={{ pointerEvents: 'auto' }}>
                    <Avatars user={{ name: record.name || 'Unknown' }} sizeImg="middle" />
                  </span>
                )}
              </span>
            </Tooltip>
            {record.name}
          </Space>
        );
      },
    },
    { title: 'Mã nhân viên', dataIndex: 'code_staff', key: 'code_staff', render: (code_staff) => code_staff || <Tag color='red' bordered={false}>Trống</Tag> },
    { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username' },
    { title: 'Khối / Phòng', dataIndex: 'bophan', key: 'bophan' },
    { title: 'Trạng thái', dataIndex: 'locker', key: 'locker', render: (locker) => <Tag color={!locker ? 'green' : 'red'} bordered={false}>{!locker ? 'Đang hoạt động' : 'Tạm khóa'}</Tag> },
    {
      title: 'Thao tác', key: 'action', render: (_, record) => (
        <Space size="middle">
          <Button type="primary" icon={<KeyOutlined />} onClick={() => showModal('module', record)}>Phân quyền</Button>
        </Space>
      )
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
  };

  return (
    <Card>
      <Table
        title={() => (
          <>
            <TabHeader activeTabKey={activeTabKey} navigate={navigate} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Input
                style={{ marginBottom: 12 }}
                placeholder="Tìm kiếm tài khoản..."
                prefix={<SearchOutlined />}
                onChange={(e) => handleSearch(e.target.value)}
                size="middle"
                value={searchText}
              />
              <Space style={{ flexWrap: 'wrap' }}>
                <Button onClick={() => navigate('/auth/docs/account')} type='primary'>Quản lý tài khoản</Button>
                <Button type="primary" icon={<KeyOutlined />} onClick={() => showModal('batch', accounts.filter(acc => selectedRowKeys.includes(acc.keys)))} disabled={!selectedRowKeys.length}>
                  Phân quyền hàng loạt
                </Button>
              </Space>
            </div>
          </>
        )}
        scroll={{ x: true }}
        style={{ width: "100%", whiteSpace: "nowrap" }}
        columns={accountColumns}
        dataSource={accounts}
        locale={{ emptyText: <Empty description="Trống !" /> }}
        rowKey="keys"
        size='middle'
        rowSelection={rowSelection}
        pagination={{ size: window.innerWidth < 768 ? "small" : "middle", pageSize: 5, current: currentPage, total: totalItems, onChange: handlePageChange, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items` }}
        loading={loadingAccounts}
      />
    </Card>
  );
};

const DepartmentTab = ({ t, departments, loadingDepartments, totalItems, currentPage, handlePageChange, handleSearch, showModal, activeTabKey, navigate, selectedRowKeys, setSelectedRowKeys, searchText }) => {
  const departmentColumns = [
    { title: 'Tên Khối / Phòng', dataIndex: 'bophan', key: 'bophan', render: (text) => text.toUpperCase() },
    { title: 'Trạng thái', dataIndex: 'active', key: 'active', render: (active) => <Tag color={active ? 'green' : 'red'} bordered={false}>{active ? 'Đang hoạt động' : 'Ngừng hoạt động'}</Tag> },
    {
      title: 'Thao tác', key: 'action', render: (_, record) => (
        <Space size="middle">
          <Button type="primary" icon={<KeyOutlined />} onClick={() => showModal('module', record)} >Phân quyền</Button>
        </Space>
      )
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
  };

  return (
    <Card>
      <Table
        scroll={{ x: true }}
        style={{ width: "100%", whiteSpace: "nowrap" }}
        title={() => (
          <>
            <TabHeader activeTabKey={activeTabKey} navigate={navigate} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Input
                style={{ marginBottom: 12 }}
                placeholder="Tìm kiếm khối / phòng..."
                prefix={<SearchOutlined />}
                onChange={(e) => handleSearch(e.target.value)}
                size="middle"
                value={searchText}
              />
              <Space style={{ flexWrap: 'wrap' }}>
                <Button onClick={() => navigate('/auth/docs/danh-sach-phong-ban')} type='primary'>Quản lý khối / phòng</Button>
                <Button type="primary" icon={<KeyOutlined />} onClick={() => showModal('batch', departments.filter(dep => selectedRowKeys.includes(dep._id)))} disabled={!selectedRowKeys.length}>
                  Phân quyền hàng loạt
                </Button>
              </Space>
            </div>
          </>
        )}
        columns={departmentColumns}
        dataSource={departments}
        locale={{ emptyText: <Empty description="Trống !" /> }}
        rowKey="_id"
        size='middle'
        rowSelection={rowSelection}
        pagination={{ size: window.innerWidth < 768 ? "small" : "middle", pageSize: 5, current: currentPage, total: totalItems, onChange: handlePageChange, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items` }}
        loading={loadingDepartments}
      />
    </Card>
  );
};

const RestaurantTab = ({ t, restaurants, loadingRestaurants, totalItems, currentPage, handlePageChange, handleSearch, showModal, activeTabKey, navigate, selectedRowKeys, setSelectedRowKeys, searchText }) => {
  const restaurantColumns = [
    { title: 'Tên nhà hàng', dataIndex: 'restaurant', key: 'restaurant' },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address', render: (text) => text ? text : <Tag color="red" bordered={false}>Trống</Tag> },
    { title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive', render: (text) => text ? <Tag color="green" bordered={false}>Đang hoạt động</Tag> : <Tag color="red" bordered={false}>Ngừng hoạt động</Tag> },
    {
      title: 'Thao tác', key: 'action', render: (_, record) => (
        <Space size="middle">
          <Button type="primary" icon={<KeyOutlined />} onClick={() => showModal('module', record)}>Phân quyền</Button>
        </Space>
      )
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
  };

  return (
    <Card>
      <Table
        scroll={{ x: true }}
        style={{ width: "100%", whiteSpace: "nowrap" }}
        title={() => (
          <>
            <TabHeader activeTabKey={activeTabKey} navigate={navigate} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Input
                style={{ marginBottom: 12 }}
                placeholder="Tìm kiếm nhà hàng..."
                prefix={<SearchOutlined />}
                onChange={(e) => handleSearch(e.target.value)}
                size="middle"
                value={searchText}
              />
              <Space style={{ flexWrap: 'wrap' }}>
                <Button onClick={() => navigate('/auth/docs/danh-sach-cua-hang')} type='primary'>Quản lý nhà hàng</Button>
                <Button type="primary" icon={<KeyOutlined />} onClick={() => showModal('batch', restaurants.filter(rest => selectedRowKeys.includes(rest.id)))} disabled={!selectedRowKeys.length}>
                  Phân quyền hàng loạt
                </Button>
              </Space>
            </div>
          </>
        )}
        columns={restaurantColumns}
        dataSource={restaurants}
        locale={{ emptyText: <Empty description="Trống !" /> }}
        rowKey="id"
        size='middle'
        rowSelection={rowSelection}
        pagination={{ size: window.innerWidth < 768 ? "small" : "middle", pageSize: 5, current: currentPage, total: totalItems, onChange: handlePageChange, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items` }}
        loading={loadingRestaurants}
      />
    </Card>
  );
};

const ModuleTab = ({ t, modules, loadingModules, totalItems, currentPage, handlePageChange, handleSearch, showModal, handleDeleteModule, activeTabKey, navigate, searchText }) => {
  const moduleColumns = [
    { title: 'Tên module', dataIndex: 'name', key: 'name' },
    {
      title: 'Áp dụng cho', dataIndex: 'applicableTo', key: 'applicableTo', render: (applicableTo) => (
        <Space>{applicableTo.map(entity => <Tag key={entity} color="blue" bordered={false}>{entity === 'account' ? 'Tài khoản' : entity === 'department' ? 'Khối / Phòng' : 'Nhà hàng'}</Tag>)}</Space>
      )
    },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status ? 'green' : 'red'} bordered={false}>{status ? 'Đang hoạt động' : 'Tạm đóng quyền'}</Tag> },
    {
      title: 'Thao tác', key: 'action', render: (_, record) => (
        <Space>
          <Button shape='circle' icon={<EditOutlined />} onClick={() => showModal('module', record)}></Button>
          <Popconfirm title="Bạn có chắc chắn muốn xóa module này?" onConfirm={() => handleDeleteModule(record._id)} okText="Có" cancelText="Không">
            <Button shape='circle' danger icon={<DeleteOutlined />}></Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <Card>
      <Table
        scroll={{ x: true }}
        style={{ width: "100%", whiteSpace: "nowrap" }}
        title={() => (
          <>
            <TabHeader activeTabKey={activeTabKey} navigate={navigate} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Input
                style={{ marginBottom: 12 }}
                placeholder="Tìm kiếm module..."
                prefix={<SearchOutlined />}
                onChange={(e) => handleSearch(e.target.value)}
                size="middle"
                value={searchText}
              />
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal('module')}>Thêm module</Button>

          </>
        )}
        columns={moduleColumns}
        dataSource={modules}
        locale={{ emptyText: <Empty description="Trống !" /> }}
        rowKey="_id"
        size='middle'
        pagination={{ size: window.innerWidth < 768 ? "small" : "middle", pageSize: 5, current: currentPage, total: totalItems, onChange: handlePageChange, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items` }}
        loading={loadingModules}
      />
    </Card>
  );
};

const Phanquyen = React.memo(({ user, t }) => {
  const [accounts, setAccounts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [modules, setModules] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();
  const [treeData, setTreeData] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [isLoadingModal, setIsLoadingModal] = useState(false);

  const { userApi, departmentApi, branchApi, request } = useApi();
  const isFetchingRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchAccountsRef = useRef();
  const fetchDepartmentsRef = useRef();
  const fetchRestaurantsRef = useRef();
  const fetchModulesRef = useRef();

  const activeTabKey = location.pathname.split('/').pop() || 'account';

  const fetchTreeData = useCallback(async () => {
    try {
      console.log('Fetching tree data for tab:', activeTabKey);
      const response = await request({ method: 'GET', url: '/modules/all', params: { page: 1, limit: 100 } });
      let data = response.data || [];
      console.log('Raw modules from backend:', data);

      if (data.length === 0) {
        console.log('No modules found, using DEFAULT_PERMISSIONS');
        data = [{
          name: 'General',
          permissions: DEFAULT_PERMISSIONS[activeTabKey] || ['Xem', 'Sửa', 'Xóa'],
          status: true,
          applicableTo: [activeTabKey],
        }];
      }

      const filteredModules = data.filter(module =>
        module.status === true &&
        !['Account', 'Department', 'Restaurant'].includes(module.name) &&
        module.applicableTo.includes(activeTabKey)
      );
      console.log('Filtered modules:', filteredModules);

      const tree = filteredModules.length > 0 ? [{
        title: 'Tất cả quyền',
        key: 'all',
        children: filteredModules.map((module) => ({
          title: module.name || 'Unnamed Module',
          key: module.name,
          children: (module.permissions || []).map((perm) => ({
            title: perm ? perm.charAt(0).toUpperCase() + perm.slice(1) : 'Unknown',
            key: `${module.name}:${perm || 'unknown'}`,
          })),
        })),
      }] : [];
      console.log('Generated treeData:', tree);
      setTreeData(tree);
      return tree;
    } catch (err) {
      console.error('Error fetching tree data:', err);
      message.error(err.response?.data?.message || 'Lỗi khi tải danh sách quyền');
      return [];
    }
  }, [request, activeTabKey]);

  const fetchAccounts = useCallback(async (page = 1, search = '') => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoadingAccounts(true);
    try {
      const response = await userApi.fetchAll(page, 5, {
        search,
        fields: ['code_staff', 'name'],
      });
      setAccounts(response.data || []);
      setTotalItems(response.total || 0);
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi khi tải danh sách tài khoản');
    } finally {
      setLoadingAccounts(false);
      isFetchingRef.current = false;
    }
  }, [userApi]);

  const fetchDepartments = useCallback(async (page = 1, search = '') => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoadingDepartments(true);
    try {
      const response = await departmentApi.fetchAll(search, page, 5);
      setDepartments(response.items || []);
      setTotalItems(response.totalItems || 0);
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi khi tải danh sách phòng ban');
    } finally {
      setLoadingDepartments(false);
      isFetchingRef.current = false;
    }
  }, [departmentApi]);

  const fetchRestaurants = useCallback(async (page = 1, search = '') => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoadingRestaurants(true);
    try {
      const response = await branchApi.fetchAll({
        search, // Gửi giá trị tìm kiếm
        fields: ['code', 'address'], // Chỉ định các trường cần tìm kiếm
        page,
        limit: 5,
      });
      setRestaurants(response.data || []);
      setTotalItems(response.total || 0);
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi khi tải danh sách nhà hàng');
    } finally {
      setLoadingRestaurants(false);
      isFetchingRef.current = false;
    }
  }, [branchApi]);

  const fetchModules = useCallback(async (page = 1, search = '') => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoadingModules(true);
    try {
      const response = await request({ method: 'GET', url: '/modules/all', params: { page, limit: 5, search } });
      const data = response.data || [];
      const activeModules = data.filter(module => !['Account', 'Department', 'Restaurant'].includes(module.name));
      setModules(activeModules);
      setTotalItems(response.total || activeModules.length);
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi khi tải danh sách module');
    } finally {
      setLoadingModules(false);
      isFetchingRef.current = false;
    }
  }, [request]);

  const fetchPermissions = useCallback(async (type, id) => {
    try {
      const response = await request({ method: 'GET', url: `/permissions/${type}/${id}` });
      const perms = response.data.permissions || {};
      const keys = [];
      for (const module in perms) {
        const actions = perms[module];
        if (Array.isArray(actions)) {
          actions.forEach((action) => keys.push(`${module}:${action}`));
        } else if (typeof actions === 'string') {
          keys.push(`${module}:${actions}`);
        }
      }
      return keys;
    } catch (err) {
      console.error('Error fetching permissions:', err);
      message.error(err.response?.data?.message || 'Lỗi khi tải phân quyền');
      return [];
    }
  }, [request]);

  const updatePermissions = useCallback(async (type, id, permissions, userKeys) => {
    try {
      await request({
        method: 'PUT',
        url: `/permissions/${type}/${id}`,
        data: { permissions, userKeys: userKeys || user?.keys }, // Pass user.keys
      });
    } catch (err) {
      throw err;
    }
  }, [request, user?.keys]);

  useEffect(() => {
    fetchAccountsRef.current = fetchAccounts;
    fetchDepartmentsRef.current = fetchDepartments;
    fetchRestaurantsRef.current = fetchRestaurants;
    fetchModulesRef.current = fetchModules;
  }, [fetchAccounts, fetchDepartments, fetchRestaurants, fetchModules]);

  useEffect(() => {
    const loadData = async () => {
      setAccounts([]);
      setDepartments([]);
      setRestaurants([]);
      setModules([]);
      setTotalItems(0);
      setCurrentPage(1);
      setSearchText('');
      setTreeData([]);
      setSelectedRowKeys([]);

      if (activeTabKey === 'account') await fetchAccountsRef.current(1, '');
      else if (activeTabKey === 'department') await fetchDepartmentsRef.current(1, '');
      else if (activeTabKey === 'restaurant') await fetchRestaurantsRef.current(1, '');
      else if (activeTabKey === 'module') await fetchModulesRef.current(1, '');
    };

    loadData();

    return () => { isFetchingRef.current = false; };
  }, [activeTabKey]);

  const debouncedSearch = useRef(debounce((value, tabKey, fetchFn) => {
    setCurrentPage(1);
    fetchFn(1, value);
  }, 500)).current;

  const handleSearch = (value) => {
    setSearchText(value);
    if (activeTabKey === 'account') {
      // Tìm kiếm theo code_staff hoặc name
      debouncedSearch(value, 'account', fetchAccounts);
    } else if (activeTabKey === 'department') {
      // Giữ nguyên tìm kiếm theo bophan
      debouncedSearch(value, 'department', fetchDepartments);
    } else if (activeTabKey === 'restaurant') {
      // Tìm kiếm theo code hoặc address
      debouncedSearch(value, 'restaurant', fetchRestaurants);
    } else if (activeTabKey === 'module') {
      debouncedSearch(value, 'module', fetchModules);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (activeTabKey === 'account') fetchAccounts(page, searchText);
    else if (activeTabKey === 'department') fetchDepartments(page, searchText);
    else if (activeTabKey === 'restaurant') fetchRestaurants(page, searchText);
    else if (activeTabKey === 'module') fetchModules(page, searchText);
  };

  const showModal = async (type, records) => {
    setModalType(type);
    if (type === 'batch') {
      setSelectedRecords(records);
      setSelectedRecord(null);
    } else {
      setSelectedRecord(records);
      setSelectedRecords([]);
    }
    setIsModalVisible(true);

    if (records) {
      form.setFieldsValue({
        ...records,
        name: type === 'batch' ? `${records.length} mục đã chọn` : (records.username || records.bophan || records.restaurant || records.name),
        permissions: type === 'module' && activeTabKey === 'module' ? records.permissions : undefined,
        applicableTo: type === 'module' && activeTabKey === 'module' ? records.applicableTo : undefined,
        status: type === 'module' && activeTabKey === 'module' ? records.status : undefined,
      });

      if ((type === 'module' && activeTabKey !== 'module') || type === 'batch') {
        setIsLoadingModal(true);
        try {
          const tree = await fetchTreeData();
          setTreeData(tree);
          if (type === 'module') {
            const entityType = activeTabKey === 'account' ? 'user' : activeTabKey === 'department' ? 'department' : 'restaurant';
            const idField = activeTabKey === 'account' ? 'keys' : activeTabKey === 'department' ? '_id' : 'id';
            const permissionKeys = await fetchPermissions(entityType, records[idField]);
            setCheckedKeys(permissionKeys);
          } else {
            setCheckedKeys([]); // Reset for batch
          }
        } finally {
          setIsLoadingModal(false);
        }
      }
    } else {
      form.resetFields();
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsLoadingModal(false);
    form.resetFields();
    setCheckedKeys([]);
    setSelectedRecords([]);
  };

  const handleSubmit = async (values) => {
    setLoadingSubmit(true);
    try {
      if (modalType === 'module' && activeTabKey === 'module') {
        const payload = {
          name: values.name,
          permissions: values.permissions || [],
          status: values.status !== undefined ? values.status : true,
          applicableTo: values.applicableTo || ['account', 'department', 'restaurant'],
          userKeys: user?.keys, // Add userKeys here
        };
  
        const moduleExists = modules.some(
          (module) =>
            module.name.toLowerCase() === values.name.toLowerCase() &&
            (!selectedRecord || module._id !== selectedRecord._id)
        );
  
        if (moduleExists && !selectedRecord) {
          Modal.error({
            title: 'Lỗi',
            content: 'Tên Module đã tồn tại! Vui lòng chọn tên khác.',
          });
          setLoadingSubmit(false);
          return;
        }
  
        if (selectedRecord) {
          await request({
            method: 'PUT',
            url: `/modules/update/${selectedRecord._id}`,
            data: payload,
          });
          message.success('Cập nhật module thành công!');
        } else {
          await request({
            method: 'POST',
            url: '/modules/add',
            data: payload,
          });
          message.success('Thêm module thành công!');
        }
        fetchModules(currentPage, searchText);
      } else {
        const permissions = {};
        checkedKeys.forEach((key) => {
          if (key !== 'all') {
            const [module, action] = key.split(':');
            if (!permissions[module]) permissions[module] = [];
            permissions[module].push(action);
          }
        });
  
        const entityType = activeTabKey === 'account' ? 'user' : activeTabKey === 'department' ? 'department' : 'restaurant';
        const idField = activeTabKey === 'account' ? 'keys' : activeTabKey === 'department' ? '_id' : 'id';
  
        if (modalType === 'batch') {
          await Promise.all(selectedRecords.map(record =>
            updatePermissions(entityType, record[idField], permissions, user?.keys)
          ));
          message.success(`Đã cập nhật quyền cho ${selectedRecords.length} mục thành công!`);
        } else {
          await updatePermissions(entityType, selectedRecord[idField], permissions, user?.keys);
          message.success('Cập nhật quyền thành công!');
        }
  
        if (activeTabKey === 'account') fetchAccounts(currentPage, searchText);
        else if (activeTabKey === 'department') fetchDepartments(currentPage, searchText);
        else if (activeTabKey === 'restaurant') fetchRestaurants(currentPage, searchText);
      }
      setIsModalVisible(false);
      setSelectedRowKeys([]);
      form.resetFields();
    } catch (err) {
      console.error('Submit error:', err);
      message.error(err.response?.data?.message || 'Lỗi khi thực hiện thao tác');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDeleteModule = async (id) => {
    setLoadingModules(true);
    try {
      await request({ method: 'DELETE', url: `/modules/delete/${id}` });
      message.success('Xóa module thành công!');
      fetchModules(currentPage, searchText);
      setTreeData([]);
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi khi xóa module');
    } finally {
      setLoadingModules(false);
    }
  };

  const onCheck = (checkedKeysValue) => {
    setCheckedKeys(checkedKeysValue);
  };

  const handleCreateNow = () => {
    setModalType('module');
    setSelectedRecord(null);
    navigate('/auth/docs/phan-quyen/module');
    setIsModalVisible(true);
    form.resetFields();
    setCheckedKeys([]);
  };

  const renderModal = () => {
    switch (modalType) {
      case 'module':
        return activeTabKey === 'module' ? (
          <Modal
            title={selectedRecord ? 'Chỉnh sửa module' : 'Thêm module mới'}
            open={isModalVisible}
            onCancel={handleCancel}
            footer={
              <Space>
                <Button onClick={handleCancel}>Hủy</Button>
                <Button type="primary" onClick={() => form.submit()} loading={loadingSubmit}>
                  {selectedRecord ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </Space>
            }
          >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="name" label="Tên module" rules={[{ required: true, message: 'Vui lòng nhập tên module!' }]}>
                <Input placeholder="Tên module" disabled={!!selectedRecord} />
              </Form.Item>
              <Form.Item name="permissions" label="Danh sách quyền" rules={[{ required: true, message: 'Vui lòng chọn ít nhất một quyền!' }]}>
                <Checkbox.Group options={['Cho phép chấm công', 'Tạo công và quản lý ca làm việc', 'Tạo checklist', 'Sửa checklist', 'Xóa checklist', 'Cấu hình điểm nâng cao', 'Xóa phản hồi', 'Xem phản hồi', 'Xử lý phản hồi', 'Gán phản hồi', 'Quản lý báo cáo', 'Quản lý tài sản', 'Xóa tài sản', 'Kiểm kê tài sản', 'Tạo thông báo']} />
              </Form.Item>
              <Form.Item name="applicableTo" label="Áp dụng cho" rules={[{ required: true, message: 'Vui lòng chọn ít nhất một mục!' }]}>
                <Checkbox.Group options={[
                  { label: 'Tài khoản', value: 'account' },
                  { label: 'Khối / Phòng', value: 'department' },
                  { label: 'Nhà hàng', value: 'restaurant' },
                ]} />
              </Form.Item>
              <Form.Item name="status" label="Trạng thái" valuePropName="checked">
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Đóng quyền" defaultChecked />
              </Form.Item>
            </Form>
          </Modal>
        ) : (
          <Modal
            title="Phân quyền module"
            open={isModalVisible}
            onCancel={handleCancel}
            width={700}
            footer={
              !isLoadingModal && treeData.length > 0 ? (
                <Space>
                  <Button onClick={handleCancel}>Hủy</Button>
                  <Button type="primary" onClick={() => form.submit()} loading={loadingSubmit}>
                    Cập nhật quyền
                  </Button>
                </Space>
              ) : null
            }
          >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item label="Đối tượng">
                <Input value={selectedRecord ? selectedRecord.username || selectedRecord.bophan || selectedRecord.restaurant : ''} disabled />
              </Form.Item>
              <Divider>Danh sách quyền</Divider>
              {isLoadingModal ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin tip="Đang tải danh sách quyền..." />
                </div>
              ) : (
                <Form.Item name="permissions">
                  {treeData.length > 0 ? (
                    <Tree checkable onCheck={onCheck} checkedKeys={checkedKeys} treeData={treeData} defaultExpandAll />
                  ) : (
                    <Empty description="Danh sách quyền trống.">
                      <Button type="primary" onClick={handleCreateNow}>Create Now</Button>
                    </Empty>
                  )}
                </Form.Item>
              )}
            </Form>
          </Modal>
        );
      case 'batch':
        return (
          <Modal
            title={`Phân quyền hàng loạt (${selectedRecords.length} mục)`}
            open={isModalVisible}
            onCancel={handleCancel}
            width={700}
            footer={
              !isLoadingModal && treeData.length > 0 ? (
                <Space>
                  <Button onClick={handleCancel}>Hủy</Button>
                  <Button type="primary" onClick={() => form.submit()} loading={loadingSubmit}>
                    Cập nhật quyền
                  </Button>
                </Space>
              ) : null
            }
          >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item label="Số lượng mục được chọn">
                <Input value={`${selectedRecords.length} mục`} disabled />
              </Form.Item>
              <Divider>Danh sách quyền</Divider>
              {isLoadingModal ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin tip="Đang tải danh sách quyền..." />
                </div>
              ) : (
                <Form.Item name="permissions">
                  {treeData.length > 0 ? (
                    <Tree checkable onCheck={onCheck} checkedKeys={checkedKeys} treeData={treeData} defaultExpandAll />
                  ) : (
                    <Empty description="Danh sách quyền trống.">
                      <Button type="primary" onClick={handleCreateNow}>Create Now</Button>
                    </Empty>
                  )}
                </Form.Item>
              )}
            </Form>
          </Modal>
        );
      default:
        return null;
    }
  };

  const renderTabContent = () => {
    switch (activeTabKey) {
      case 'account':
        return <AccountTab t={t} accounts={accounts} loadingAccounts={loadingAccounts} totalItems={totalItems} currentPage={currentPage} handlePageChange={handlePageChange} handleSearch={handleSearch} showModal={showModal} activeTabKey={activeTabKey} navigate={navigate} selectedRowKeys={selectedRowKeys} setSelectedRowKeys={setSelectedRowKeys} searchText={searchText} />;
      case 'department':
        return <DepartmentTab t={t} departments={departments} loadingDepartments={loadingDepartments} totalItems={totalItems} currentPage={currentPage} handlePageChange={handlePageChange} handleSearch={handleSearch} showModal={showModal} activeTabKey={activeTabKey} navigate={navigate} selectedRowKeys={selectedRowKeys} setSelectedRowKeys={setSelectedRowKeys} searchText={searchText} />;
      case 'restaurant':
        return <RestaurantTab t={t} restaurants={restaurants} loadingRestaurants={loadingRestaurants} totalItems={totalItems} currentPage={currentPage} handlePageChange={handlePageChange} handleSearch={handleSearch} showModal={showModal} activeTabKey={activeTabKey} navigate={navigate} selectedRowKeys={selectedRowKeys} setSelectedRowKeys={setSelectedRowKeys} searchText={searchText} />;
      case 'module':
        return <ModuleTab t={t} modules={modules} loadingModules={loadingModules} totalItems={totalItems} currentPage={currentPage} handlePageChange={handlePageChange} handleSearch={handleSearch} showModal={showModal} handleDeleteModule={handleDeleteModule} activeTabKey={activeTabKey} navigate={navigate} searchText={searchText} />;
      default:
        return null;
    }
  };

  useEffect(() => {
    return () => { debouncedSearch.cancel(); };
  }, [debouncedSearch]);

  return (
    <div>
      {renderTabContent()}
      <title>NISO | Phân quyền</title>
      {renderModal()}
    </div>
  );
});

export default Phanquyen;