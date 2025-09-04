import React, { useState, useEffect, useCallback } from 'react';
import { Table, Space, Button, Popconfirm, message, Dropdown, Menu, Drawer, DatePicker, Tag, Input, Card, Form, Select, Tooltip, Avatar, Empty, Radio, Spin, Tabs } from 'antd';
import { DeleteOutlined, SettingOutlined, MoreOutlined, CopyOutlined, LinkOutlined, ControlOutlined, LockOutlined, TeamOutlined, SaveOutlined, GlobalOutlined, ShopOutlined, FullscreenOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import Avatars from '../../config/design/Avatars';
import ViewUser from '../xemphieu/ViewUser';
import ViewXuly from '../xemphieu/ViewXuLy';
import useApi from '../../hook/useApi';
import useSearchShop from '../../hook/SearchShop/useSearchShop';
import useSearchDepartment from '../../hook/SearchDepartment/useSearchDepartment';
import debounce from 'lodash/debounce';
import UserInfoCard from '../../hook/UserInfoCard';
import { useNavigate, useLocation } from 'react-router-dom';
import XuLyPhanHoiUser from './XuLyPhanHoiUser';
import AssignedViews from './AssignedViews';

const { Option } = Select;
const { TabPane } = Tabs;

const ListViews = ({
  t,
  user,
  hasxemPermission,
  xoaPermission,
  hasxlphPermission,
  ganPhanHoiPermission,
  defaultTab = 'personal',
}) => {
  const [personalData, setPersonalData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [selectedViewRecord, setSelectedViewRecord] = useState(null);
  const [xulyDrawerVisible, setXulyDrawerVisible] = useState(false);
  const [selectedXulyRecord, setSelectedXulyRecord] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTitle, setSearchTitle] = useState(null);
  const [linkToCopy, setLinkToCopy] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [tableLoading, setTableLoading] = useState(false);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [totalPersonalRecords, setTotalPersonalRecords] = useState(0);
  const [currentPersonalPage, setCurrentPersonalPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(5);
  const [checklistTitles, setChecklistTitles] = useState([]);
  const [titleLoading, setTitleLoading] = useState(false);
  const [isInitialFetchDone, setIsInitialFetchDone] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);

  const navigate = useNavigate();
  const location = useLocation();

  const {
    deleteResponse,
    deleteBatchResponses,
    updateResponse,
    fetchAllTraloi,
    search,
    fetchChecklistTitles,
  } = useApi();
  const { options: chiNhanhOptions, loading: chiNhanhLoading, searchShops } = useSearchShop(useApi().searchShop);
  const { options: phongBanOptions, loading: phongBanLoading, searchDepartments } = useSearchDepartment();

  // Đồng bộ tab với URL khi tải trang
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('phan-hoi-duoc-cap')) {
      setActiveTab('assigned');
    } else if (path.includes('phan-hoi-cua-ban')) {
      setActiveTab('personal');
    } else if (path.includes('phieu-cho-xu-ly')) {
      setActiveTab('xu-ly-phan-hoi-user');
    } else {
      setActiveTab(defaultTab);
    }
  }, [location.pathname, defaultTab]);

  // Xử lý khi tab thay đổi
  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'personal') {
      navigate('/auth/docs/list/view/danh-sach-phan-hoi/phan-hoi-cua-ban');
      fetchPersonalData(1, currentPageSize);
    } else if (key === 'assigned') {
      navigate('/auth/docs/list/view/danh-sach-phan-hoi/phan-hoi-duoc-cap');
    } else if (key === 'xu-ly-phan-hoi-user') {
      navigate('/auth/docs/list/view/danh-sach-phan-hoi/phieu-cho-xu-ly/assigned');
    }
  };

  const fetchTitles = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') {
      setChecklistTitles([]);
      return;
    }
    setTitleLoading(true);
    try {
      const response = await fetchChecklistTitles(searchTerm);
      setChecklistTitles(response.data || []);
    } catch (error) {
      message.error('Lỗi khi lấy danh sách tiêu đề!');
    } finally {
      setTitleLoading(false);
    }
  }, [fetchChecklistTitles]);

  useEffect(() => {
    fetchTitles();
  }, [fetchTitles]);

  const fetchUsers = debounce(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') {
      setUserOptions([]);
      return;
    }
    setUserSearchLoading(true);
    try {
      const response = await search(searchTerm);
      const users = response.data || [];
      setUserOptions(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Thử lại sau.');
    } finally {
      setUserSearchLoading(false);
    }
  }, 300);

  const fetchUsersByKeys = useCallback(async (keysArray) => {
    if (!keysArray || !keysArray.length) return;
    setUserSearchLoading(true);
    try {
      const missingKeys = keysArray.filter((key) => !userOptions.find((u) => u.keys === key));
      if (missingKeys.length > 0) {
        const response = await search('', { keys: missingKeys.join(',') });
        const newUsers = response.data || [];
        setUserOptions((prev) => [...prev.filter((u) => !missingKeys.includes(u.keys)), ...newUsers]);
      }
    } catch (error) {
      console.error('Error fetching users by keys:', error);
      message.error('Lỗi khi lấy thông tin tài khoản!');
    } finally {
      setUserSearchLoading(false);
    }
  }, [search, userOptions]);

  const fetchPersonalData = useCallback(
    async (page = 1, size = currentPageSize) => {
      if ((startDate && !endDate) || (!startDate && endDate)) {
        setPersonalData([]);
        setTotalPersonalRecords(0);
        return;
      }

      const filters = {
        ...(startDate &&
          endDate && {
          startDate: dayjs(startDate).format('DD-MM-YYYY'),
          endDate: dayjs(endDate).format('DD-MM-YYYY'),
        }),
        ...(searchTitle && { title: searchTitle }),
      };

      try {
        setTableLoading(true);
        const userKeys = user.keys || [];
        const response = await fetchAllTraloi(page, size, filters, userKeys);
        const traloiData = response.data || [];
        const processedTraloiData = traloiData.map((item) => ({
          responseId: String(item.responseId),
          title: item.title || 'Untitled',
          ngay_phan_hoi: item.ngay_phan_hoi || dayjs().format('DD-MM-YYYY HH:mm:ss'),
          quyenxem: item.quyenxem || '',
          cuahang: item.cuahang || [],
          bophanADS: item.bophanADS || [],
          accounts: item.accounts || [],
          thoigianxuly: item.thoigianxuly || null,
        }));
        setPersonalData(processedTraloiData);
        setTotalPersonalRecords(response.total || traloiData.length);
        setCurrentPersonalPage(page);
      } catch (error) {
        message.error('Error Server!');
      } finally {
        setTableLoading(false);
      }
    },
    [startDate, endDate, searchTitle, currentPageSize, fetchAllTraloi, user.keys],
  );

  const fetchInitialData = useCallback(async () => {
    try {
      setTableLoading(true);
      if (activeTab === 'personal') {
        await fetchPersonalData(1, currentPageSize);
      }
      setIsInitialFetchDone(true);
    } catch (error) {
      message.error('Error fetching initial data from server!');
    } finally {
      setTableLoading(false);
    }
  }, [activeTab, currentPageSize, fetchPersonalData]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!isInitialFetchDone) return;
    if (activeTab === 'personal') {
      fetchPersonalData(1, currentPageSize);
    }
  }, [
    searchTitle,
    currentPageSize,
    fetchPersonalData,
    isInitialFetchDone,
    activeTab,
  ]);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteResponse(id);
        if (activeTab === 'personal') {
          fetchPersonalData(currentPersonalPage, currentPageSize);
        }
        setDropdownVisible((prev) => ({ ...prev, [id]: false }));
      } catch (error) {
        message.error('Error Server!');
      }
    },
    [
      deleteResponse,
      fetchPersonalData,
      currentPersonalPage,
      currentPageSize,
      activeTab,
    ],
  );

  const handleBatchDelete = useCallback(async () => {
    if (!selectedRowKeys.length) return;

    try {
      await deleteBatchResponses(selectedRowKeys);
      message.success(`${selectedRowKeys.length} mục ${t('Department.input265')}`);
      setSelectedRowKeys([]);
      if (activeTab === 'personal') {
        fetchPersonalData(currentPersonalPage, currentPageSize);
      }
    } catch (error) {
      message.error('Lỗi server khi xóa hàng loạt!');
    }
  }, [
    deleteBatchResponses,
    fetchPersonalData,
    currentPersonalPage,
    currentPageSize,
    selectedRowKeys,
    t,
    activeTab,
  ]);

  const showDrawer = useCallback(
    (record) => {
      if (!record || !record.responseId) {
        message.error('Không thể mở cài đặt: Dữ liệu không hợp lệ.');
        return;
      }
      setEditingRecord(record);
      setLinkToCopy(`${window.location.origin}/auth/docs/form/views/${record.responseId}`);
      if (record.accounts && record.accounts.length > 0) {
        fetchUsersByKeys(record.accounts);
      }
      form.setFieldsValue({
        quyenxem: record.quyenxem,
        title: record.title,
        cuahang: Array.isArray(record.cuahang)
          ? record.cuahang.map((item) => (typeof item === 'string' ? item : String(item.cuahang || '')))
          : [],
        bophanADS: Array.isArray(record.bophanADS)
          ? record.bophanADS.map((item) => (typeof item === 'string' ? item : String(item.bophan || '')))
          : [],
        accounts: Array.isArray(record.accounts) ? record.accounts : [],
        thoigianxuly: record.thoigianxuly ? dayjs(record.thoigianxuly, 'DD-MM-YYYY HH:mm:ss') : null,
      });
      setDropdownVisible((prev) => ({ ...prev, [record.responseId]: false }));
    },
    [form, fetchUsersByKeys],
  );

  const showViewDrawer = useCallback(
    (record) => {
      if (!record || !record.responseId || record.responseId === 'undefined') {
        message.error('Không thể xem chi tiết: Dữ liệu không hợp lệ.');
        return;
      }
      setSelectedViewRecord(record);
      setViewDrawerVisible(true);
      setSelectedRowKeys([]);
      setDropdownVisible((prev) => ({ ...prev, [record.responseId]: false }));
    },
    [],
  );

  const showXulyDrawer = useCallback(
    (record, questionId) => {
      if (!record || !record.responseId || !questionId) {
        message.error('Không thể xử lý: Dữ liệu không hợp lệ.');
        return;
      }
      setSelectedXulyRecord(record);
      setSelectedQuestionId(questionId);
      setXulyDrawerVisible(true);
    },
    [],
  );

  const onCloseViewDrawer = useCallback(() => {
    setViewDrawerVisible(false);
  }, []);

  const onCloseXulyDrawer = useCallback(() => {
    setXulyDrawerVisible(false);
  }, []);

  useEffect(() => {
    if (editingRecord) {
      form.setFieldsValue({
        title: editingRecord.title,
        cuahang: Array.isArray(editingRecord.cuahang)
          ? editingRecord.cuahang.map((item) => (typeof item === 'string' ? item : String(item.cuahang || '')))
          : [],
        bophanADS: Array.isArray(editingRecord.bophanADS)
          ? editingRecord.bophanADS.map((item) => (typeof item === 'string' ? item : String(item.bophan || '')))
          : [],
        accounts: Array.isArray(editingRecord.accounts) ? editingRecord.accounts : [],
        quyenxem:
          editingRecord.quyenxem === true
            ? 'Public'
            : editingRecord.quyenxem === false
              ? 'Internal'
              : editingRecord.quyenxem || 'Private',
        thoigianxuly: editingRecord.thoigianxuly ? dayjs(editingRecord.thoigianxuly, 'DD-MM-YYYY HH:mm:ss') : null,
      });
    }
  }, [editingRecord, form]);

  const onCloseDrawer = useCallback(() => {
    setEditingRecord(null);
    form.resetFields();
  }, [form]);

  const handleDropdownVisibleChange = (flag, id) => {
    setDropdownVisible((prev) => ({
      ...prev,
      [id]: flag,
    }));
  };

  const handleStartDateChange = (date) => {
    setStartDate(date ? date.startOf('day').toDate() : null);
    setCurrentPersonalPage(1);
    if (activeTab === 'personal') {
      fetchPersonalData(1, currentPageSize);
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date ? date.endOf('day').toDate() : null);
    setCurrentPersonalPage(1);
    if (activeTab === 'personal') {
      fetchPersonalData(1, currentPageSize);
    }
  };

  const disabledEndDate = (current) => {
    if (!startDate) return false;
    return current && current < dayjs(startDate).startOf('day');
  };

  const disabledStartDate = (current) => {
    return current && current > dayjs().endOf('day');
  };

  const handleCopyLink = () => {
    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy);
      message.success(t('ListDocs.input1'));
    }
  };

  const handleSaveSettings = useCallback(
    async (values) => {
      if (!editingRecord || !editingRecord.responseId) return;
      const currentDate = dayjs().format('DD-MM-YYYY HH:mm:ss');

      const cuahang = ganPhanHoiPermission
        ? Array.isArray(values.cuahang)
          ? values.cuahang
          : []
        : Array.isArray(editingRecord.cuahang)
          ? editingRecord.cuahang
          : [];
      const bophanADS = ganPhanHoiPermission
        ? Array.isArray(values.bophanADS)
          ? values.bophanADS
          : []
        : Array.isArray(editingRecord.bophanADS)
          ? editingRecord.bophanADS
          : [];
      const accounts = ganPhanHoiPermission
        ? Array.isArray(values.accounts)
          ? values.accounts
          : []
        : Array.isArray(editingRecord.accounts)
          ? editingRecord.accounts
          : [];

      const thoigianxuly = values.thoigianxuly ? values.thoigianxuly.format('DD-MM-YYYY HH:mm:ss') : null;

      try {
        await updateResponse(editingRecord.responseId, {
          quyenxem: values.quyenxem,
          cuahang,
          bophanADS,
          accounts,
          ngaygiao: currentDate,
          thoigianxuly,
        });

        message.success(t('Department.input147'));
        if (activeTab === 'personal') {
          fetchPersonalData(currentPersonalPage, currentPageSize);
        }
      } catch (error) {
        message.error('Error server!');
      }
      onCloseDrawer();
    },
    [
      editingRecord,
      updateResponse,
      fetchPersonalData,
      currentPersonalPage,
      currentPageSize,
      t,
      onCloseDrawer,
      ganPhanHoiPermission,
      activeTab,
    ],
  );

  const handleSelectChange = (field) => (value) => {
    setCurrentPersonalPage(1);
    if (field === 'title') setSearchTitle(value || null);
  };

  const menu = (record) => (
    <Menu>
      <Menu.Item key="1" onClick={() => showDrawer(record)}>
        <SettingOutlined /> {t('Menu.menu5')}
      </Menu.Item>
      {xoaPermission && (
        <Menu.Item key="2" danger>
          <Popconfirm
            title={t('Department.input266')}
            onConfirm={() => handleDelete(record.responseId)}
            okText="Yes"
            cancelText="No"
            onCancel={(e) => e.stopPropagation()}
          >
            <span
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <DeleteOutlined /> Delete
            </span>
          </Popconfirm>
        </Menu.Item>
      )}
    </Menu>
  );

  const getPersonalColumns = () => [
    {
      title: t('Input.input7'),
      key: 'stt',
      render: (text, record, index) => (currentPersonalPage - 1) * currentPageSize + index + 1,
    },
    {
      title: t('ListDocs.input15'),
      dataIndex: 'title',
      key: 'title',
      render: (text = 'Untitled') => text,
    },
    {
      title: t('ListDocs.input17'),
      dataIndex: 'ngay_phan_hoi',
      key: 'ngay_phan_hoi',
      render: (text = 'N/A') => text,
    },
    {
      title: t('Department.input244'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          {(hasxemPermission || hasxlphPermission) && (
            <Tooltip title="Xem chi tiết">
              <Button icon={<EyeOutlined />} onClick={() => showViewDrawer(record)}>
                Xem
              </Button>
            </Tooltip>
          )}
          {!xoaPermission ? (
            <Tooltip title={t('Menu.menu5')}>
              <Button onClick={() => showDrawer(record)} icon={<SettingOutlined />}>
                Cài đặt
              </Button>
            </Tooltip>
          ) : (
            <Dropdown
              overlay={menu(record)}
              trigger={['click']}
              open={dropdownVisible[record.responseId]}
              onOpenChange={(flag) => handleDropdownVisibleChange(flag, record.responseId)}
              destroyPopupOnHide
            >
              <Button icon={<MoreOutlined />}>{t('Department.input187')}</Button>
            </Dropdown>
          )}
        </Space>
      ),
    },
  ];

  const handleTableChange = (pagination) => {
    const { current, pageSize } = pagination;
    setCurrentPageSize(pageSize);
    setCurrentPersonalPage(current);
    fetchPersonalData(current, pageSize);
  };

  const hasSelected = selectedRowKeys.length > 0;

  return (
    <div>
      <title>NISO CHECKLIST | {t('Department.input264')}</title>
      <Card bordered={false}>
        <Tabs activeKey={activeTab} onChange={handleTabChange} type="card" size="small">
          <TabPane tab="Phiếu của bạn" key="personal">
            <Table
              size="middle"
              title={() => (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Select
                    showSearch
                    placeholder={t('ListDocs.input15')}
                    style={{ width: window.innerWidth < 768 ? '100%' : 250 }}
                    onChange={handleSelectChange('title')}
                    value={searchTitle}
                    allowClear
                    onSearch={debounce((value) => fetchTitles(value), 300)}
                    notFoundContent={titleLoading ? <Spin size="small" /> : null}
                  >
                    {checklistTitles.map((title) => (
                      <Option key={title} value={title}>
                        {title}
                      </Option>
                    ))}
                  </Select>
                  <DatePicker
                    placeholder={t('ListDocs.input28')}
                    onChange={handleStartDateChange}
                    format="DD-MM-YYYY"
                    disabledDate={disabledStartDate}
                    style={{ width: window.innerWidth < 768 ? '100%' : 250 }}
                  />
                  <DatePicker
                    placeholder={t('ListDocs.input29')}
                    onChange={handleEndDateChange}
                    format="DD-MM-YYYY"
                    disabledDate={disabledEndDate}
                    style={{ width: window.innerWidth < 768 ? '100%' : 250 }}
                  />
                </div>
              )}
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              }}
              dataSource={personalData}
              columns={getPersonalColumns()}
              rowKey="responseId"
              loading={tableLoading}
              bordered
              pagination={{
                current: currentPersonalPage,
                pageSize: currentPageSize,
                total: totalPersonalRecords,
                pageSizeOptions: ['5', '10', '20', '50', '100'],
                size: window.innerWidth < 768 ? 'small' : 'middle',
                showSizeChanger: true,
                onChange: (page, pageSize) => handleTableChange({ current: page, pageSize }),
                onShowSizeChange: (current, size) => handleTableChange({ current: 1, pageSize: size }),
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: true }}
              style={{ width: '100%', whiteSpace: 'nowrap' }}
              locale={{
                emptyText: <Empty description="Phản hồi trống!" />,
              }}
              footer={() =>
                xoaPermission && (
                  <Popconfirm
                    title={t('Department.input249')}
                    onConfirm={handleBatchDelete}
                    okText="Yes"
                    cancelText="No"
                    disabled={!hasSelected}
                  >
                    <Button type="primary" danger disabled={!hasSelected}>
                      {t('Department.input250')} ({selectedRowKeys.length})
                    </Button>
                  </Popconfirm>
                )
              }
            />
          </TabPane>
          <TabPane tab="Phiếu được chỉ định" key="assigned">
            <AssignedViews 
              t={t} 
              user={user}
              hasxemPermission={hasxemPermission}
              hasxlphPermission={hasxlphPermission}
            />
          </TabPane>
          
          {hasxlphPermission && user.phanquyen !== true && user.phanquyen !== "Xử lý yêu cầu" && (
            <TabPane tab="Phiếu chờ xử lý" key="xu-ly-phan-hoi-user">
              <XuLyPhanHoiUser
                t={t}
                user={user}
                hasxemPermission={hasxemPermission}
                hasxlphPermission={hasxlphPermission}
                tab={location.pathname.split('/').pop()}
              />
            </TabPane>
          )}

        </Tabs>
      </Card>
      <Drawer
        title="Cài đặt"
        width="800"
        onClose={onCloseDrawer}
        open={editingRecord !== null}
        bodyStyle={{ paddingBottom: 80, backgroundColor: '#f5f7fa' }}
        extra={
          activeTab === 'personal' && (
            <Button type="primary" onClick={() => form.submit()} icon={<SaveOutlined />}>
              {t('Department.input164')}
            </Button>
          )
        }
      >
        {editingRecord && (
          <Form form={form} layout="vertical" onFinish={handleSaveSettings}>
            {activeTab === 'personal' && (
              ganPhanHoiPermission && (
                <Card
                  title={
                    <span>
                      <ShopOutlined /> Thông tin cơ bản
                    </span>
                  }
                  style={{ marginBottom: 16 }}
                  bordered={false}
                  className="shadow-sm"
                >
                  {!(hasxemPermission || hasxlphPermission) ? (
                    <Empty description="Thông tin trống." />
                  ) : (
                    <Form.Item
                      name="quyenxem"
                      label={t('Department.input268')}
                      rules={[{ required: true, message: t('Department.input228') }]}
                      tooltip="Chọn mức độ phân quyền truy cập"
                    >
                      <Radio.Group buttonStyle="solid" style={{ display: 'flex', flexWrap: 'wrap' }}>
                        <Tooltip title="Tất cả mọi người có thể truy cập vào phản hồi này">
                          <Radio.Button value="Public">
                            <Space>
                              <GlobalOutlined />
                              Công khai
                            </Space>
                          </Radio.Button>
                        </Tooltip>
                        <Tooltip title="Chỉ những người bạn cho phép mới có thể truy cập vào phản hồi này (Trừ admin)">
                          <Radio.Button value="Internal">
                            <Space>
                              <TeamOutlined />
                              Nội bộ
                            </Space>
                          </Radio.Button>
                        </Tooltip>
                        <Tooltip title="Chỉ mình bạn mới truy cập được phản hồi này (Trừ danh sách được gán và admin)">
                          <Radio.Button value="Private">
                            <Space>
                              <LockOutlined />
                              Riêng tư
                            </Space>
                          </Radio.Button>
                        </Tooltip>
                      </Radio.Group>
                    </Form.Item>
                  )}

                  {ganPhanHoiPermission && (
                    <>
                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.quyenxem !== currentValues.quyenxem}
                      >
                        {({ getFieldValue }) => {
                          const isPublic = getFieldValue('quyenxem') === 'Public';
                          return (
                            <>
                              <Form.Item
                                name="accounts"
                                label={t('Department.input227')}
                                tooltip="Chọn người dùng có quyền truy cập checklist này"
                              >
                                <Select
                                  mode="multiple"
                                  placeholder="Tìm kiếm tài khoản"
                                  showSearch
                                  onSearch={(value) => fetchUsers(value)}
                                  filterOption={false}
                                  defaultActiveFirstOption={false}
                                  showArrow={true}
                                  loading={userSearchLoading}
                                  style={{ width: '100%' }}
                                  disabled={form.getFieldValue('quyenxem') === 'Public'}
                                  notFoundContent={
                                    userSearchLoading ? (
                                      <div style={{ textAlign: 'center', padding: '10px' }}>
                                        <Spin size="small" />
                                      </div>
                                    ) : userOptions.length === 0 ? (
                                      <Empty description="Không tìm thấy tài khoản" />
                                    ) : null
                                  }
                                >
                                  {userOptions.map((user) => (
                                    <Option key={user.keys} value={user.keys}>
                                      <Tooltip
                                        title={<UserInfoCard user={user} />}
                                        placement={window.innerWidth < 768 ? 'top' : 'right'}
                                        color="white"
                                        overlayStyle={{ maxWidth: 300 }}
                                      >
                                        <Space>
                                          {user.imgAvatar && user.imgAvatar !== 'null' ? (
                                            <Avatar src={user.imgAvatar} size="small" icon={<Spin size="small" />} />
                                          ) : (
                                            <Avatars user={{ name: user.name }} sizeImg="small" />
                                          )}
                                          <span>{user.name || user.username || 'Unknown'}</span>
                                        </Space>
                                      </Tooltip>
                                    </Option>
                                  ))}
                                </Select>
                              </Form.Item>

                              <Form.Item
                                name="cuahang"
                                label="Gán nhà hàng (Assign restaurant)"
                                tooltip="Chọn một hoặc nhiều nhà hàng để gán checklist này"
                              >
                                <Select
                                  mode="multiple"
                                  placeholder="Chọn nhà hàng..."
                                  showSearch
                                  onSearch={(value) => searchShops(value)}
                                  filterOption={false}
                                  loading={chiNhanhLoading}
                                  defaultActiveFirstOption={false}
                                  showArrow={true}
                                  style={{ width: '100%' }}
                                  disabled={isPublic}
                                  notFoundContent={
                                    chiNhanhLoading ? (
                                      <div style={{ textAlign: 'center', padding: '10px' }}>
                                        <Space>
                                          <Spin size="small" />
                                          <span>Loading...</span>
                                        </Space>
                                      </div>
                                    ) : null
                                  }
                                  options={chiNhanhOptions.map((chinhanh) => ({
                                    label: chinhanh.toUpperCase(),
                                    value: chinhanh,
                                  }))}
                                  tagRender={(props) => (
                                    <Tag color="blue" closable={props.closable} bordered={false} onClose={props.onClose} style={{ marginRight: 3 }}>
                                      {props.label}
                                    </Tag>
                                  )}
                                />
                              </Form.Item>

                              <Form.Item
                                name="bophanADS"
                                label={t('Department.input226')}
                                tooltip="Chọn bộ phận quản lý checklist này"
                              >
                                <Select
                                  mode="multiple"
                                  placeholder="Tìm kiếm bộ phận"
                                  showSearch
                                  onSearch={(value) => searchDepartments(value)}
                                  filterOption={false}
                                  loading={phongBanLoading}
                                  defaultActiveFirstOption={false}
                                  showArrow={true}
                                  style={{ width: '100%' }}
                                  disabled={isPublic}
                                  notFoundContent={
                                    phongBanLoading ? (
                                      <div style={{ textAlign: 'center', padding: '10px' }}>
                                        <Space>
                                          <Spin size="small" />
                                          <span>Loading...</span>
                                        </Space>
                                      </div>
                                    ) : null
                                  }
                                  options={phongBanOptions.map((bophan) => ({
                                    label: bophan.toUpperCase(),
                                    value: bophan,
                                  }))}
                                  tagRender={(props) => (
                                    <Tag color="cyan" bordered={false} closable={props.closable} onClose={props.onClose} style={{ marginRight: 3 }}>
                                      {props.label}
                                    </Tag>
                                  )}
                                />
                              </Form.Item>
                            </>
                          );
                        }}
                      </Form.Item>
                    </>
                  )}
                </Card>
              )
            )}

            <Card
              title={
                <span>
                  <LinkOutlined /> Chia sẻ
                </span>
              }
              style={{ marginBottom: 16 }}
              bordered={false}
              className="shadow-sm"
            >
              <Form.Item label={t('ListDocs.input26')}>
                <Input.Group compact>
                  <Input
                    style={{ width: 'calc(100% - 40px)' }}
                    value={linkToCopy}
                    readOnly
                    prefix={<LinkOutlined style={{ color: '#ae8f3d' }} />}
                  />
                  <Tooltip title="Sao chép liên kết">
                    <Button icon={<CopyOutlined />} onClick={handleCopyLink} type="primary" />
                  </Tooltip>
                </Input.Group>
              </Form.Item>
            </Card>

            {activeTab === 'personal' && ganPhanHoiPermission && (
              <Card
                title={
                  <span>
                    <ControlOutlined /> Cấu hình
                  </span>
                }
                bordered={false}
                className="shadow-sm"
              >
                <Form.Item name="thoigianxuly" label="Hạn xử lý" tooltip="Thiết lập thời hạn xử lý công việc">
                  <DatePicker showTime format="DD-MM-YYYY HH:mm:ss" placeholder="Chọn thời hạn" style={{ width: '100%' }} />
                </Form.Item>
              </Card>
            )}
          </Form>
        )}
      </Drawer>
      <Drawer
        closeIcon={null}
        title={
          selectedViewRecord ? (
            <Tooltip title={selectedViewRecord.title}>
              <span>
                Chi tiết phiếu{' '}
                {window.innerWidth < 768
                  ? selectedViewRecord.title.length > 10
                    ? selectedViewRecord.title.substring(0, 10) + '...'
                    : selectedViewRecord.title
                  : selectedViewRecord.title.length > 40
                    ? selectedViewRecord.title.substring(0, 40) + '...'
                    : selectedViewRecord.title}
              </span>
            </Tooltip>
          ) : (
            'Loading...'
          )
        }
        width={800}
        onClose={onCloseViewDrawer}
        open={viewDrawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
        extra={
          <Space>
            <Button onClick={onCloseViewDrawer}>Close</Button>
            <Tooltip title="Xem toàn trang">
              <Button
                onClick={() => window.open(`/auth/docs/form/views/${selectedViewRecord.responseId}`, '_blank')}
                icon={<FullscreenOutlined />}
              />
            </Tooltip>
          </Space>
        }
      >
        {selectedViewRecord && (
          <ViewUser
            id={selectedViewRecord.responseId}
            user={user}
            hasxlphPermission={hasxlphPermission}
            t={t}
            onShowXulyDrawer={showXulyDrawer}
            isInDrawer={true}
          />
        )}
      </Drawer>
      <Drawer
        title={
          selectedXulyRecord ? (
            <Tooltip title={selectedXulyRecord.title}>
              <span>
                Xử lý phiếu{' '}
                {window.innerWidth < 768
                  ? selectedXulyRecord.title.length > 10
                    ? selectedXulyRecord.title.substring(0, 10) + '...'
                    : selectedXulyRecord.title
                  : selectedXulyRecord.title.length > 50
                    ? selectedXulyRecord.title.substring(0, 50) + '...'
                    : selectedXulyRecord.title}
              </span>
            </Tooltip>
          ) : (
            'Loading...'
          )
        }
        width={700}
        closeIcon={null}
        extra={
          <Space>
            <Button onClick={onCloseXulyDrawer}>Close</Button>
            <Tooltip title="Xem toàn trang">
              <Button
                onClick={() => window.open(`/auth/docs/form/views/${selectedXulyRecord.responseId}/${selectedQuestionId}`, '_blank')}
                icon={<FullscreenOutlined />}
              />
            </Tooltip>
          </Space>
        }
        onClose={onCloseXulyDrawer}
        open={xulyDrawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
        placement="right"
      >
        {selectedXulyRecord && selectedQuestionId && (
          <ViewXuly
            documentId={selectedXulyRecord?.responseId}
            questionId={selectedQuestionId}
            user={user}
            t={t}
            isInDrawer={true}
            hasxlphPermission={hasxlphPermission}
            hasxemPermission={hasxemPermission}
          />
        )}
      </Drawer>
    </div>
  );
};

export default React.memo(ListViews);