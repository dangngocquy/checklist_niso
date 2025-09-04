import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Table, Space, Button, Drawer, Tag, Radio, DatePicker, Card, Input, Form, Select, Tooltip, Avatar, Empty, Spin, Tabs, message, Badge } from 'antd';
import { SettingOutlined, CopyOutlined, LinkOutlined, ControlOutlined, LockOutlined, TeamOutlined, SaveOutlined, GlobalOutlined, ShopOutlined, FullscreenOutlined, EyeOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import Avatars from '../../config/design/Avatars';
import ViewUser from '../xemphieu/ViewUser';
import ViewXuly from '../xemphieu/ViewXuLy';
import useSearchShop from '../../hook/SearchShop/useSearchShop';
import useSearchDepartment from '../../hook/SearchDepartment/useSearchDepartment';
import useApi from '../../hook/useApi';
import debounce from 'lodash/debounce';
import axios from 'axios';
import 'dayjs/locale/vi';
import UserInfoCard from '../../hook/UserInfoCard';
import NotFoundPage from '../NotFoundPage';

const { Option } = Select;
const { TabPane } = Tabs;

const XuLyPhanHoiUser = ({ t, user, hasxemPermission, hasxlphPermission }) => {
  const [data, setData] = useState([]);
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [selectedViewRecord, setSelectedViewRecord] = useState(null);
  const [xulyDrawerVisible, setXulyDrawerVisible] = useState(false);
  const [selectedXulyRecord, setSelectedXulyRecord] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    searchKeys: null,
    searchTitle: null,
    searchChiNhanh: null,
    searchPhongBan: null,
    searchTrangThai: null,
    viewStatus: null,
  });
  const [linkToCopy, setLinkToCopy] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [tableLoading, setTableLoading] = useState(false);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(5);
  const [checklistTitles, setChecklistTitles] = useState([]);
  const [titleLoading, setTitleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assigned');
  const [counts, setCounts] = useState({
    assigned: 0,
    pending: 0,
    overdue: 0,
    completed: 0,
  });

  const navigate = useNavigate();
  const { tab } = useParams();
  const validTabs = useMemo(() => ['assigned', 'pending', 'overdue', 'completed'], []);
  const isMounted = useRef(false);

  const {
    updateResponse,
    fetchChecklistTitles,
    search,
  } = useApi();
  const { options: chiNhanhOptions, loading: chiNhanhLoading, searchShops } = useSearchShop(useApi().searchShop);
  const { options: phongBanOptions, loading: phongBanLoading, searchDepartments } = useSearchDepartment();

  const debouncedFetchData = useMemo(
    () =>
      debounce(async (page, size, tab, currentFilters) => {
        console.log('Fetching data for tab:', tab, 'page:', page, 'size:', size, 'filters:', currentFilters);
        const apiFilters = {
          page,
          pageSize: size,
          ...(currentFilters.startDate && { startDate: dayjs(currentFilters.startDate).format('DD-MM-YYYY') }),
          ...(currentFilters.endDate && { endDate: dayjs(currentFilters.endDate).format('DD-MM-YYYY') }),
          ...(currentFilters.searchKeys && { keysJSON: currentFilters.searchKeys }),
          ...(currentFilters.searchTitle && { title: currentFilters.searchTitle }),
          ...(currentFilters.searchChiNhanh && { chiNhanh: currentFilters.searchChiNhanh }),
          ...(currentFilters.searchPhongBan && { phongBan: currentFilters.searchPhongBan }),
          ...(currentFilters.searchTrangThai && { trangthai: currentFilters.searchTrangThai }),
          ...(currentFilters.viewStatus && { viewStatus: currentFilters.viewStatus }),
          userKeys: 'all',
          tab,
          user: JSON.stringify({
            keys: user.keys || '',
            bophan: user.bophan || '',
            chinhanh: user.chinhanh || '',
          }),
        };

        try {
          setTableLoading(true);
          const response = await axios.get('/traloi/response-all-user', {
            params: apiFilters,
            headers: {
              Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
            },
          });

          const traloiData = response.data.data || [];
          const processedTraloiData = traloiData
            .filter(item => item.yeucauxuly === true) // Đảm bảo chỉ lấy yeucauxuly: true
            .map((item) => ({
              ...item,
              responseId: String(item.responseId),
              ngay_phan_hoi: item.ngay_phan_hoi || 'N/A',
              nguoiphanhoi: item.nguoiphanhoi || 'Unknown',
              title: item.title || 'Untitled',
              chi_nhanh: item.chi_nhanh || item.chinhanh || 'N/A',
              phongban: item.phongban || item.bophan || 'N/A',
              name: item.name || item.nguoiphanhoi || 'N/A',
              imgAvatar: item.imgAvatar || null,
              ngaygiao: item.ngaygiao || null,
              trangthai: item.trangthai || 'Chờ xử lý',
              watching: item.watching || [],
            }));

          setData(processedTraloiData);
          setTotalRecords(response.data.total || 0);
          setCurrentPage(page);
          setCurrentPageSize(size);
          setCounts(response.data.counts || {
            assigned: 0,
            pending: 0,
            overdue: 0,
            completed: 0,
          });
        } catch (error) {
          console.error('Error fetching data:', error);
          message.error('Lỗi tải dữ liệu! Vui lòng kiểm tra API hoặc mạng.');
        } finally {
          setTableLoading(false);
        }
      }, 300),
    [user.keys, user.bophan, user.chinhanh]
  );

  const fetchData = useCallback(
    (page = 1, size = currentPageSize, tab = activeTab) => {
      debouncedFetchData(page, size, tab, filters);
    },
    [debouncedFetchData, filters, currentPageSize, activeTab]
  );

  useEffect(() => {
    if (!isMounted.current) {
      const currentTab = validTabs.includes(tab) ? tab : 'assigned';
      setActiveTab(currentTab);
      fetchData(1, currentPageSize, currentTab);
      if (!validTabs.includes(tab)) {
        navigate(`/auth/docs/list/view/danh-sach-phan-hoi/phieu-cho-xu-ly/assigned`, { replace: true });
      }
      isMounted.current = true;
    }
  }, [currentPageSize, validTabs, navigate, fetchData, tab]);

  const handleTabChange = useCallback(
    (key) => {
      setActiveTab(key);
      setCurrentPage(1);
      if (key !== 'assigned') {
        setFilters((prev) => ({ ...prev, searchTrangThai: null, viewStatus: null }));
      }
      fetchData(1, currentPageSize, key);
      navigate(`/auth/docs/list/view/danh-sach-phan-hoi/phieu-cho-xu-ly/${key}`, { replace: true });
    },
    [navigate, currentPageSize, fetchData]
  );

  const fetchTitles = useCallback(
    (searchTerm) => {
      const fetchTitleData = async () => {
        if (!searchTerm || searchTerm.trim() === '') {
          setChecklistTitles([]);
          return;
        }
        setTitleLoading(true);
        try {
          const response = await fetchChecklistTitles(searchTerm);
          setChecklistTitles(response.data || []);
        } catch (error) {
          console.error('Error fetching checklist titles:', error);
          message.error('Lỗi khi lấy danh sách tiêu đề!');
        } finally {
          setTitleLoading(false);
        }
      };

      const debouncedFetch = debounce(fetchTitleData, 300);
      debouncedFetch();

      return () => debouncedFetch.cancel();
    },
    [fetchChecklistTitles]
  );

  const fetchUsers = useCallback(
    (searchTerm) => {
      const fetchUserData = async () => {
        if (!searchTerm || searchTerm.trim() === '') {
          setUserOptions([]);
          return;
        }
        setUserSearchLoading(true);
        try {
          const response = await search(searchTerm);
          setUserOptions(response.data || []);
        } catch (error) {
          console.error('Error fetching users:', error);
          message.error('Lỗi khi tìm kiếm tài khoản!');
        } finally {
          setUserSearchLoading(false);
        }
      };

      const debouncedFetch = debounce(fetchUserData, 300);
      debouncedFetch();

      return () => debouncedFetch.cancel();
    },
    [search]
  );

  const fetchUsersByKeys = useCallback(
    async (keysArray) => {
      if (!keysArray || !keysArray.length) return;
      setUserSearchLoading(true);
      try {
        const missingKeys = keysArray.filter((key) => !userOptions.find((u) => u.keys === key));
        if (missingKeys.length > 0) {
          const response = await search('', { keys: missingKeys.join(',') });
          setUserOptions((prev) => [
            ...prev.filter((u) => !missingKeys.includes(u.keys)),
            ...(response.data || []),
          ]);
        }
      } catch (error) {
        console.error('Error fetching users by keys:', error);
        message.error('Lỗi khi lấy thông tin tài khoản!');
      } finally {
        setUserSearchLoading(false);
      }
    },
    [search, userOptions]
  );

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
        quyenxem: record.quyenxem === true ? 'Public' : record.quyenxem === false ? 'Internal' : record.quyenxem || 'Private',
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
    },
    [form, fetchUsersByKeys]
  );

  const showViewDrawer = useCallback(
    async (record) => {
      if (!record || !record.responseId || record.responseId === 'undefined') {
        message.error('Không thể xem chi tiết: Dữ liệu không hợp lệ.');
        return;
      }
      setSelectedViewRecord(record);
      setViewDrawerVisible(true);
      if (!record.watching.includes(user.keys)) {
        try {
          await updateResponse(record.responseId, {
            watching: [...record.watching, user.keys],
          });
          fetchData(currentPage, currentPageSize, activeTab);
        } catch (error) {
          console.error('Error updating watching:', error);
        }
      }
    },
    [updateResponse, user.keys, currentPage, currentPageSize, activeTab, fetchData]
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
    []
  );

  const onCloseViewDrawer = useCallback(() => {
    setViewDrawerVisible(false);
    setSelectedViewRecord(null);
  }, []);

  const onCloseXulyDrawer = useCallback(() => {
    setXulyDrawerVisible(false);
    setSelectedXulyRecord(null);
    setSelectedQuestionId(null);
  }, []);

  const onCloseDrawer = useCallback(() => {
    setEditingRecord(null);
    form.resetFields();
  }, [form]);

  const handleSelectChange = useCallback(
    (field) => (value) => {
      setFilters((prev) => ({
        ...prev,
        [field]: value || null,
      }));
      setCurrentPage(1);
    },
    []
  );

  useEffect(() => {
    fetchData(1, currentPageSize, activeTab);
  }, [filters, fetchData, currentPageSize, activeTab]);

  const handleCopyLink = useCallback(() => {
    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy);
      message.success(t('ListDocs.input1'));
    }
  }, [linkToCopy, t]);

  const handleSaveSettings = useCallback(
    async (values) => {
      if (!editingRecord || !editingRecord.responseId) return;
      const currentDate = dayjs().format('DD-MM-YYYY HH:mm:ss');
      const cuahang = Array.isArray(values.cuahang) ? values.cuahang : [];
      const bophanADS = Array.isArray(values.bophanADS) ? values.bophanADS : [];
      const accounts = Array.isArray(values.accounts) ? values.accounts : [];
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
        fetchData(currentPage, currentPageSize, activeTab);
        onCloseDrawer();
      } catch (error) {
        console.error('Error updating settings:', error);
        message.error('Error server!');
      }
    },
    [editingRecord, updateResponse, fetchData, currentPage, currentPageSize, activeTab, onCloseDrawer, t]
  );

  const getColumns = () => {
    const baseColumns = [
      {
        title: t('Input.input7'),
        key: 'stt',
        render: (text, record, index) => (currentPage - 1) * currentPageSize + index + 1,
      },
      {
        title: t('Department.input254'),
        dataIndex: 'keysJSON',
        key: 'avatar',
        render: (text, record) => {
          const matchedUser = userOptions.find((u) => u.keys === record.keysJSON);
          const userForCard = {
            name: matchedUser?.name || record.name || record.nguoiphanhoi || 'Unknown User',
            username: matchedUser?.username || record.username,
            imgAvatar: matchedUser?.imgAvatar || record.imgAvatar || null,
            keys: matchedUser?.keys || record.keysJSON || 'N/A',
            email: matchedUser?.email || null,
            chucvu: matchedUser?.chucvu || null,
            chinhanh: matchedUser?.chinhanh || record.chi_nhanh || null,
            bophan: matchedUser?.bophan || record.phongban || null,
            locker: matchedUser?.locker || false,
            imgBackground: matchedUser?.imgBackground || null,
          };

          return (
            <Tooltip
              title={<UserInfoCard user={userForCard} />}
              placement={window.innerWidth < 768 ? 'top' : 'right'}
              color="white"
              overlayStyle={{ maxWidth: 300 }}
              trigger="hover"
            >
              <span className="avatar-container" style={{ display: 'inline-block', cursor: 'pointer' }}>
                {record.imgAvatar && record.imgAvatar !== 'null' && record.imgAvatar !== null ? (
                  <Avatar
                    src={record.imgAvatar}
                    size="middle"
                    style={{ marginRight: 8, pointerEvents: 'auto' }}
                  />
                ) : (
                  <span style={{ marginRight: 8, pointerEvents: 'auto' }}>
                    <Avatars user={{ name: record.name || record.nguoiphanhoi || 'Unknown' }} sizeImg="middle" />
                  </span>
                )}
              </span>
            </Tooltip>
          );
        },
      },
      {
        title: t('ListDocs.input13'),
        dataIndex: 'nguoiphanhoi',
        key: 'nguoiphanhoi',
        render: (text = 'N/A') => (
          <span>
            {text === 'Khách vãng lai' ? (
              <Tag color="green" bordered={false}>{text}</Tag>
            ) : (
              text
            )}
          </span>
        ),
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
        title: t('Department.input257'),
        dataIndex: 'chi_nhanh',
        key: 'chi_nhanh',
        render: (text = 'N/A') => (
          <Tag color={text === 'Khách vãng lai' ? 'green' : 'blue'} bordered={false}>
            {text}
          </Tag>
        ),
      },
      {
        title: 'Khối / Phòng',
        dataIndex: 'phongban',
        key: 'phongban',
        render: (text = 'N/A') => (
          <span>
            {text === 'Khách vãng lai' ? (
              <Tag color="green" bordered={false}>{text}</Tag>
            ) : (
              text.toUpperCase()
            )}
          </span>
        ),
      },
      {
        title: t('Department.input244'),
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Tooltip title="Xem chi tiết">
              <Button onClick={() => showViewDrawer(record)} icon={<EyeOutlined />} />
            </Tooltip>
            <Button onClick={() => showDrawer(record)} icon={<SettingOutlined />}>
              {t('Menu.menu5')}
            </Button>
          </Space>
        ),
      },
    ];

    if (activeTab === 'assigned') {
      baseColumns.splice(baseColumns.length - 1, 0, {
        title: 'Trạng thái',
        dataIndex: 'trangthai',
        key: 'trangthai',
        render: (text = 'Chờ xử lý') => (
          <Tag color={text === 'Hoàn tất' ? 'green' : text === 'Chờ xử lý' ? 'orange' : 'default'} bordered={false}>
            {text === 'Hoàn tất' ? <CheckCircleOutlined style={{ marginRight: 3 }} /> : text === 'Chờ xử lý' ? <ClockCircleOutlined style={{ marginRight: 3 }} /> : null}
            {text}
          </Tag>
        ),
      });
      baseColumns.splice(baseColumns.length - 1, 0, {
        title: 'Xử lý trước',
        dataIndex: 'thoigianxuly',
        key: 'thoigianxuly',
        render: (text) => {
          if (!text || text === 'N/A') return <Tag color="gray" bordered={false}>Không thời hạn</Tag>;
          const deadline = dayjs(text, 'DD-MM-YYYY HH:mm:ss');
          const isOverdue = deadline.isBefore(dayjs());
          return (
            <Tag color={isOverdue ? 'red' : 'green'} bordered={false}>
              {text}
            </Tag>
          );
        },
      });
    }

    return baseColumns;
  };

  const columns = getColumns();

  const handleTableChange = useCallback(
    (pagination) => {
      const { current, pageSize } = pagination;
      setCurrentPage(current);
      setCurrentPageSize(pageSize);
      fetchData(current, pageSize, activeTab);
    },
    [fetchData, activeTab]
  );

  if (!hasxlphPermission) {
    return <NotFoundPage />;
  }

  return (
    <div>
      <title>NISO CHECKLIST | Yêu cầu cần xử lý</title>
      <Table
        size="middle"
        title={() => (
          <>
            <Tabs activeKey={activeTab} onChange={handleTabChange} type="card" size="small">
              <TabPane
                tab={
                  <>
                    {t('Assigned')} <Badge count={counts.assigned} />
                  </>
                }
                key="assigned"
              />
              <TabPane
                tab={
                  <>
                    {t('Pending')} <Badge count={counts.pending} />
                  </>
                }
                key="pending"
              />
              <TabPane
                tab={
                  <>
                    {t('Overdue')} <Badge count={counts.overdue} />
                  </>
                }
                key="overdue"
              />
              <TabPane
                tab={
                  <>
                    {t('Completed')} <Badge count={counts.completed} />
                  </>
                }
                key="completed"
              />
            </Tabs>
            <div style={{ marginBottom: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {activeTab !== 'pending' && activeTab !== 'completed' && activeTab !== 'overdue' && (
                <Select
                  showSearch
                  placeholder={t('ListDocs.input13')}
                  style={{ width: window.innerWidth < 768 ? '100%' : 200 }}
                  onChange={handleSelectChange('searchKeys')}
                  value={filters.searchKeys}
                  allowClear
                  onSearch={fetchUsers}
                  filterOption={false}
                  notFoundContent={
                    userSearchLoading ? (
                      <Space>
                        <Spin size="small" />
                        <span>Loading...</span>
                      </Space>
                    ) : userOptions.length === 0 && filters.searchKeys ? (
                      <Empty description="Không tìm thấy tài khoản" />
                    ) : null
                  }
                >
                  {userOptions.map((item) => (
                    <Option key={item.keys} value={item.keys}>
                      <Tooltip
                        title={<UserInfoCard user={item} />}
                        placement={window.innerWidth < 768 ? 'top' : 'right'}
                        color="white"
                        overlayStyle={{ maxWidth: 300 }}
                        trigger="hover"
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                          {item.imgAvatar && item.imgAvatar !== 'null' ? (
                            <Avatar src={item.imgAvatar} size="small" style={{ marginRight: 8 }} />
                          ) : (
                            <span style={{ marginRight: 8 }}>
                              <Avatars user={{ name: item.name }} sizeImg="small" />
                            </span>
                          )}
                          {item.name || item.username || 'Unknown'}
                        </span>
                      </Tooltip>
                    </Option>
                  ))}
                </Select>
              )}

              <Select
                showSearch
                placeholder={t('ListDocs.input15')}
                style={{ width: window.innerWidth < 768 ? '100%' : 200 }}
                onChange={handleSelectChange('searchTitle')}
                value={filters.searchTitle}
                allowClear
                onSearch={fetchTitles}
                notFoundContent={
                  titleLoading ? (
                    <Space>
                      <Spin size="small" />
                      <span>Loading...</span>
                    </Space>
                  ) : checklistTitles.length === 0 ? null : null
                }
              >
                {checklistTitles.map((title) => (
                  <Option key={title} value={title}>
                    {title}
                  </Option>
                ))}
              </Select>
              {activeTab !== 'pending' && activeTab !== 'completed' && activeTab !== 'overdue' && (
                <Select
                  showSearch
                  placeholder="Nhà hàng"
                  style={{ width: window.innerWidth < 768 ? '100%' : 200 }}
                  onChange={handleSelectChange('searchChiNhanh')}
                  value={filters.searchChiNhanh}
                  allowClear
                  onSearch={searchShops}
                  notFoundContent={
                    chiNhanhLoading ? (
                      <Space>
                        <Spin size="small" />
                        <span>Loading...</span>
                      </Space>
                    ) : null
                  }
                >
                  {chiNhanhOptions.map((item) => (
                    <Option key={item} value={item}>
                      {item}
                    </Option>
                  ))}
                </Select>
              )}
              {activeTab !== 'pending' && activeTab !== 'completed' && activeTab !== 'overdue' && (
                <Select
                  showSearch
                  placeholder={t('Department.input256')}
                  style={{ width: window.innerWidth < 768 ? '100%' : 200 }}
                  onChange={handleSelectChange('searchPhongBan')}
                  value={filters.searchPhongBan}
                  allowClear
                  onSearch={searchDepartments}
                  notFoundContent={
                    phongBanLoading ? (
                      <Space>
                        <Spin size="small" />
                        <span>Loading...</span>
                      </Space>
                    ) : null
                  }
                >
                  {phongBanOptions.map((item) => (
                    <Option key={item} value={item}>
                      {item}
                    </Option>
                  ))}
                </Select>
              )}

              {activeTab === 'assigned' && (
                <Select
                  placeholder="Trạng thái"
                  style={{ width: window.innerWidth < 768 ? '100%' : 200 }}
                  onChange={handleSelectChange('searchTrangThai')}
                  value={filters.searchTrangThai}
                  allowClear
                >
                  <Option value="Hoàn tất">Hoàn tất</Option>
                  <Option value="Chờ xử lý">Chờ xử lý</Option>
                </Select>
              )}

              <Select
                placeholder="Trạng thái xem"
                style={{ width: window.innerWidth < 768 ? '100%' : 200 }}
                onChange={handleSelectChange('viewStatus')}
                value={filters.viewStatus}
                allowClear
              >
                <Option value="unviewed">Chưa xem</Option>
                <Option value="viewed">Đã xem</Option>
              </Select>

              <DatePicker
                placeholder={t('ListDocs.input28')}
                onChange={(date) => {
                  setFilters((prev) => ({ ...prev, startDate: date ? date.startOf('day').toDate() : null }));
                  setCurrentPage(1);
                }}
                format="DD-MM-YYYY"
                style={{ width: window.innerWidth < 768 ? '100%' : 200 }}
              />
              <DatePicker
                placeholder={t('ListDocs.input29')}
                onChange={(date) => {
                  setFilters((prev) => ({ ...prev, endDate: date ? date.endOf('day').toDate() : null }));
                  setCurrentPage(1);
                }}
                format="DD-MM-YYYY"
                style={{ width: window.innerWidth < 768 ? '100%' : 200 }}
              />
            </div>
          </>
        )}
        dataSource={data}
        columns={columns}
        rowKey="responseId"
        loading={tableLoading}
        bordered
        rowClassName={(record) => (!record.watching.includes(user.keys) ? 'unviewed-row' : '')}
        pagination={{
          current: currentPage,
          pageSize: currentPageSize,
          total: totalRecords,
          pageSizeOptions: ['5', '10', '20', '50', '100'],
          showSizeChanger: true,
          onChange: (page, pageSize) => handleTableChange({ current: page, pageSize }),
          onShowSizeChange: (current, size) => handleTableChange({ current: 1, pageSize: size }),
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          size: window.innerWidth < 768 ? 'small' : 'middle',
        }}
        scroll={{ x: true }}
        style={{ width: '100%', whiteSpace: 'nowrap' }}
        locale={{
          emptyText: (
            <Empty
              description={
                activeTab === 'pending'
                  ? 'Không có phiếu đang chờ'
                  : activeTab === 'assigned'
                    ? 'Không có phiếu được giao'
                    : activeTab === 'overdue'
                      ? 'Không có phiếu quá hạn'
                      : 'Không có phiếu đã hoàn thành'
              }
            />
          ),
        }}
      />


      <Drawer
        title="Cài đặt"
        width="800"
        onClose={onCloseDrawer}
        open={editingRecord !== null}
        bodyStyle={{ paddingBottom: 80, backgroundColor: '#f5f7fa' }}
        extra={
          <Button type="primary" onClick={() => form.submit()} icon={<SaveOutlined />}>
            {t('Department.input164')}
          </Button>
        }
      >
        {editingRecord && (
          <Form form={form} layout="vertical" onFinish={handleSaveSettings}>
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
              <Form.Item
                name="quyenxem"
                label={t('Department.input268')}
                rules={[{ required: true, message: t('Department.input228') }]}
                tooltip="Chọn mức độ phân quyền truy cập"
              >
                <Radio.Group buttonStyle="solid" style={{ display: 'flex', flexWrap: 'wrap' }}>
                  <Tooltip title="Tất cả mọi người có thể truy cập vào phiếu này">
                    <Radio.Button value="Public">
                      <Space>
                        <GlobalOutlined />
                        Công khai
                      </Space>
                    </Radio.Button>
                  </Tooltip>
                  <Tooltip title="Chỉ những người bạn cho phép mới có thể truy cập vào phiếu này (Trừ admin)">
                    <Radio.Button value="Internal">
                      <Space>
                        <TeamOutlined />
                        Nội bộ
                      </Space>
                    </Radio.Button>
                  </Tooltip>
                  <Tooltip title="Chỉ mình bạn mới truy cập được phiếu này (Trừ danh sách được gán và admin)">
                    <Radio.Button value="Private">
                      <Space>
                        <LockOutlined />
                        Riêng tư
                      </Space>
                    </Radio.Button>
                  </Tooltip>
                </Radio.Group>
              </Form.Item>

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
                          onSearch={fetchUsers}
                          filterOption={false}
                          defaultActiveFirstOption={false}
                          showArrow={true}
                          loading={userSearchLoading}
                          style={{ width: '100%' }}
                          disabled={isPublic}
                          options={
                            userOptions.length > 0 || !userSearchLoading
                              ? userOptions.map((user) => ({
                                label: (
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
                                        <Avatars user={{ name: user.name || user.username }} sizeImg="small" />
                                      )}
                                      <span>{user.name || user.username || 'Unknown'}</span>
                                    </Space>
                                  </Tooltip>
                                ),
                                value: user.keys,
                              }))
                              : [
                                {
                                  label: (
                                    <Space>
                                      <Spin size="small" />
                                      <span>Loading...</span>
                                    </Space>
                                  ),
                                  value: null,
                                  disabled: true,
                                },
                              ]
                          }
                          notFoundContent={
                            userSearchLoading ? (
                              <div style={{ textAlign: 'center', padding: '10px' }}>
                                <Spin size="small" />
                              </div>
                            ) : userOptions.length === 0 ? (
                              <Empty description="Không tìm thấy tài khoản" />
                            ) : null
                          }
                        />
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
                          onSearch={searchShops}
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
                          onSearch={searchDepartments}
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
            </Card>

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
                  : selectedViewRecord.title.length > 50
                    ? selectedViewRecord.title.substring(0, 50) + '...'
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
                onClick={() => window.open(`/auth/docs/form/views/${selectedViewRecord?.responseId}`, '_blank')}
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
            t={t}
            onShowXulyDrawer={showXulyDrawer}
            hasxlphPermission={hasxlphPermission}
            isInDrawer={true}
            autoFilterIncorrect={true}
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
                onClick={() => window.open(`/auth/docs/form/views/${selectedXulyRecord?.responseId}/${selectedQuestionId}`, '_blank')}
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
            documentId={selectedXulyRecord.responseId}
            questionId={selectedQuestionId}
            user={user}
            t={t}
            autoFilterIncorrect={true}
            isInDrawer={true}
            hasxlphPermission={hasxlphPermission}
            hasxemPermission={hasxemPermission}
          />
        )}
      </Drawer>
    </div>
  );
};

XuLyPhanHoiUser.propTypes = {
  t: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
  hasxemPermission: PropTypes.bool.isRequired,
  hasxlphPermission: PropTypes.bool.isRequired,
};

export default React.memo(XuLyPhanHoiUser);