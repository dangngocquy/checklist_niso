import React, { useState, useEffect, useCallback } from 'react';
import { Table, Space, Button, Popconfirm, message, Dropdown, Menu, DatePicker, Tag, Select, Tooltip, Avatar, Empty, Spin, Drawer } from 'antd';
import { DeleteOutlined, SettingOutlined, MoreOutlined, EyeOutlined, FullscreenOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import Avatars from '../../config/design/Avatars';
import UserInfoCard from '../../hook/UserInfoCard';
import useApi from '../../hook/useApi';
import useSearchShop from '../../hook/SearchShop/useSearchShop';
import useSearchDepartment from '../../hook/SearchDepartment/useSearchDepartment';
import debounce from 'lodash/debounce';
import ViewUser from '../xemphieu/ViewUser';

const { Option } = Select;

const AssignedViews = ({ t, user, hasxemPermission, hasxlphPermission }) => {
  const [assignedData, setAssignedData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTitle, setSearchTitle] = useState(null);
  const [searchKeys, setSearchKeys] = useState(null);
  const [searchChiNhanh, setSearchChiNhanh] = useState(null);
  const [searchPhongBan, setSearchPhongBan] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [totalAssignedRecords, setTotalAssignedRecords] = useState(0);
  const [currentAssignedPage, setCurrentAssignedPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(5);
  const [checklistTitles, setChecklistTitles] = useState([]);
  const [titleLoading, setTitleLoading] = useState(false);
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [selectedViewRecord, setSelectedViewRecord] = useState(null);

  const { search, fetchChecklistTitles, deleteResponse, deleteBatchResponses } = useApi();
  const { options: chiNhanhOptions, loading: chiNhanhLoading, searchShops } = useSearchShop(useApi().searchShop);
  const { options: phongBanOptions, loading: phongBanLoading, searchDepartments } = useSearchDepartment();

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

  const fetchAssignedData = useCallback(
    async (page = 1, size = currentPageSize) => {
      const filters = {
        page,
        pageSize: size,
        ...(startDate && { startDate: dayjs(startDate).format('DD-MM-YYYY') }),
        ...(endDate && { endDate: dayjs(endDate).format('DD-MM-YYYY') }),
        ...(searchKeys && { keysJSON: searchKeys }),
        ...(searchTitle && { title: searchTitle }),
        ...(searchChiNhanh && { chiNhanh: searchChiNhanh }),
        ...(searchPhongBan && { phongBan: searchPhongBan }),
        ...(user?.keys && { userKeys: user.keys }),
        ...(user?.bophan && { userBophan: user.bophan }),
        ...(user?.chinhanh && { userChinhanh: user.chinhanh })
      };

      try {
        setTableLoading(true);
        const queryParams = new URLSearchParams(filters).toString();
        const response = await axios.get(`/traloi/assigned?${queryParams}`, {
          headers: {
            Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
          },
        });
        
        const traloiData = response.data.data || [];
        const processedTraloiData = traloiData.map((item) => ({
          ...item,
          responseId: String(item.responseId),
          ngay_phan_hoi: item.ngay_phan_hoi || 'N/A',
          nguoiphanhoi: item.name || 'Unknown',
          title: item.title || 'Untitled',
          chi_nhanh: item.chi_nhanh || 'N/A',
          phongban: item.phongban || 'N/A',
          name: item.name || item.nguoiphanhoi || 'N/A',
          imgAvatar: item.imgAvatar || null,
          username: item.username || 'N/A',
          email: item.email || null,
          chucvu: item.chucvu || null,
          locker: item.locker || false,
          imgBackground: item.imgBackground || null,
        }));
        setAssignedData(processedTraloiData);
        setTotalAssignedRecords(response.data.total || traloiData.length);
        setCurrentAssignedPage(page);

        const keysArray = traloiData
          .map((item) => item.keysJSON)
          .filter((key) => key && !userOptions.find((u) => u.keys === key));
        if (keysArray.length > 0) {
          fetchUsersByKeys(keysArray);
        }
      } catch (error) {
        console.error('Error fetching assigned data:', error);
        message.error('Lỗi khi tải dữ liệu!');
      } finally {
        setTableLoading(false);
      }
    },
    [
      startDate,
      endDate,
      searchKeys,
      searchTitle,
      searchChiNhanh,
      searchPhongBan,
      currentPageSize,
      fetchUsersByKeys,
      userOptions,
      user
    ],
  );

  useEffect(() => {
    fetchAssignedData(1, currentPageSize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAssignedData(1, currentPageSize);
  }, [startDate, endDate, searchKeys, searchTitle, searchChiNhanh, searchPhongBan, currentPageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteResponse(id);
        fetchAssignedData(currentAssignedPage, currentPageSize);
        setDropdownVisible((prev) => ({ ...prev, [id]: false }));
      } catch (error) {
        message.error('Error Server!');
      }
    },
    [deleteResponse, fetchAssignedData, currentAssignedPage, currentPageSize],
  );

  const handleBatchDelete = useCallback(async () => {
    if (!selectedRowKeys.length) return;

    try {
      await deleteBatchResponses(selectedRowKeys);
      message.success(`${selectedRowKeys.length} mục ${t('Department.input265')}`);
      setSelectedRowKeys([]);
      fetchAssignedData(currentAssignedPage, currentPageSize);
    } catch (error) {
      message.error('Lỗi server khi xóa hàng loạt!');
    }
  }, [deleteBatchResponses, fetchAssignedData, currentAssignedPage, currentPageSize, selectedRowKeys, t]);

  const handleDropdownVisibleChange = (flag, id) => {
    setDropdownVisible((prev) => ({
      ...prev,
      [id]: flag,
    }));
  };

  const handleStartDateChange = (date) => {
    setStartDate(date ? date.startOf('day').toDate() : null);
    setCurrentAssignedPage(1);
    fetchAssignedData(1, currentPageSize);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date ? date.endOf('day').toDate() : null);
    setCurrentAssignedPage(1);
    fetchAssignedData(1, currentPageSize);
  };

  const disabledEndDate = (current) => {
    if (!startDate) return false;
    return current && current < dayjs(startDate).startOf('day');
  };

  const disabledStartDate = (current) => {
    return current && current > dayjs().endOf('day');
  };

  const handleSelectChange = (field) => (value) => {
    setCurrentAssignedPage(1);
    if (field === 'title') setSearchTitle(value || null);
    if (field === 'keys') setSearchKeys(value || null);
    if (field === 'chiNhanh') setSearchChiNhanh(value || null);
    if (field === 'phongBan') setSearchPhongBan(value || null);
  };

  const menu = (record) => (
    <Menu>
      <Menu.Item key="1" onClick={() => showDrawer(record)}>
        <SettingOutlined /> {t('Menu.menu5')}
      </Menu.Item>
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
    </Menu>
  );

  const getAssignedColumns = () => [
    {
      title: t('Input.input7'),
      key: 'stt',
      render: (text, record, index) => (currentAssignedPage - 1) * currentPageSize + index + 1,
    },
    {
      title: t('Department.input254'),
      dataIndex: 'keysJSON',
      key: 'avatar',
      render: (text, record) => {
        const userForCard = {
          name: record.name || record.nguoiphanhoi || 'Unknown User',
          username: record.username || 'N/A',
          imgAvatar: record.imgAvatar || null,
          keys: record.keysJSON || 'N/A',
          email: record.email || null,
          chucvu: record.chucvu || null,
          chinhanh: record.chi_nhanh || 'N/A',
          bophan: record.phongban || 'N/A',
          locker: record.locker || false,
          imgBackground: record.imgBackground || null,
        };
        const matchedUser = userOptions.find((u) => u.keys === record.keysJSON);
        if (matchedUser) {
          userForCard.name = matchedUser.name || userForCard.name;
          userForCard.username = matchedUser.username || userForCard.username;
          userForCard.imgAvatar = matchedUser.imgAvatar || userForCard.imgAvatar;
          userForCard.keys = matchedUser.keys || userForCard.keys;
          userForCard.email = matchedUser.email || userForCard.email;
          userForCard.chucvu = matchedUser.chucvu || userForCard.chucvu;
          userForCard.chinhanh = matchedUser.chinhanh || userForCard.chinhanh;
          userForCard.bophan = matchedUser.bophan || userForCard.bophan;
          userForCard.locker = matchedUser.locker || userForCard.locker;
          userForCard.imgBackground = matchedUser.imgBackground || userForCard.imgBackground;
        }

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
              {userForCard.imgAvatar && userForCard.imgAvatar !== 'null' ? (
                <Avatar src={userForCard.imgAvatar} size="middle" style={{ marginRight: 8, pointerEvents: 'auto' }} />
              ) : (
                <span style={{ marginRight: 8, pointerEvents: 'auto' }}>
                  <Avatars user={{ name: userForCard.name || 'Unknown' }} sizeImg="middle" />
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
      rotator: false,
      render: (text = 'N/A') => (
        <span>
          {text === 'Khách vãng lai' ? <Tag color="green" bordered={false}>{text}</Tag> : text}
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
      title: 'Nhà hàng',
      dataIndex: 'chi_nhanh',
      key: 'chi_nhanh',
      render: (text = 'N/A') => (
        <span>
          {text === 'Khách vãng lai' ? (
            <Tag color="green" bordered={false}>{text}</Tag>
          ) : (
            <Tag color="blue" bordered={false}>{text}</Tag>
          )}
        </span>
      ),
    },
    {
      title: 'Khối / Phòng',
      dataIndex: 'phongban',
      key: 'phongban',
      render: (text = 'N/A') => (
        <span>
          {text === 'Khách vãng lai' ? <Tag color="green" bordered={false}>{text}</Tag> : text.toUpperCase()}
        </span>
      ),
    },
    {
      title: 'Ngày phản hồi',
      dataIndex: 'ngay_phan_hoi',
      key: 'ngay_phan_hoi',
    },
    {
      title: t('Department.input244'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button icon={<EyeOutlined />} onClick={() => showViewDrawer(record)}>
              Xem
            </Button>
          </Tooltip>
          <Dropdown
            overlay={menu(record)}
            trigger={['click']}
            open={dropdownVisible[record.responseId]}
            onOpenChange={(flag) => handleDropdownVisibleChange(flag, record.responseId)}
            destroyPopupOnHide
          >
            <Button icon={<MoreOutlined />}>{t('Department.input187')}</Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  const handleTableChange = (pagination) => {
    const { current, pageSize } = pagination;
    setCurrentPageSize(pageSize);
    fetchAssignedData(current, pageSize);
  };

  const hasSelected = selectedRowKeys.length > 0;

  const showDrawer = useCallback((record) => {
    if (!record || !record.responseId) {
      message.error('Không thể mở cài đặt: Dữ liệu không hợp lệ.');
      return;
    }
    setDropdownVisible((prev) => ({ ...prev, [record.responseId]: false }));
  }, []);

  const showViewDrawer = useCallback((record) => {
    if (!record || !record.responseId || record.responseId === 'undefined') {
      message.error('Không thể xem chi tiết: Dữ liệu không hợp lệ.');
      return;
    }
    setSelectedViewRecord(record);
    setViewDrawerVisible(true);
    setSelectedRowKeys([]);
    setDropdownVisible((prev) => ({ ...prev, [record.responseId]: false }));
  }, []);

  const onCloseViewDrawer = useCallback(() => {
    setViewDrawerVisible(false);
  }, []);

  return (
    <>
      <Table
        size="middle"
        title={() => (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Select
              showSearch
              placeholder={t('ListDocs.input13')}
              style={{ width: window.innerWidth < 768 ? '100%' : 250 }}
              onChange={handleSelectChange('keys')}
              value={searchKeys}
              allowClear
              onSearch={(value) => fetchUsers(value)}
              filterOption={false}
              notFoundContent={userSearchLoading ? <Spin size="small" /> : null}
            >
              {userOptions.map((item) => (
                <Option key={item.keys} value={item.keys}>
                  <Tooltip
                    title={<UserInfoCard user={item} />}
                    placement={window.innerWidth < 768 ? 'top' : 'right'}
                    color="white"
                    overlayStyle={{ maxWidth: 300 }}
                    trigger="hover"
                    mouseEnterDelay={0.1}
                    mouseLeaveDelay={0.2}
                  >
                    {item.imgAvatar && item.imgAvatar !== 'null' ? (
                      <Avatar src={item.imgAvatar} size="small" style={{ marginRight: 8 }} />
                    ) : (
                      <span style={{ marginRight: 8 }}>
                        <Avatars user={{ name: item.name }} sizeImg="small" />
                      </span>
                    )}
                    {item.name || item.username || 'Unknown'}
                  </Tooltip>
                </Option>
              ))}
            </Select>
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
            <Select
              showSearch
              placeholder={t('Department.input257')}
              style={{ width: window.innerWidth < 768 ? '100%' : 250 }}
              onChange={handleSelectChange('chiNhanh')}
              value={searchChiNhanh}
              allowClear
              onSearch={(value) => searchShops(value)}
              notFoundContent={chiNhanhLoading ? <Spin size="small" /> : null}
            >
              {chiNhanhOptions.map((item) => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
            <Select
              showSearch
              placeholder={t('Department.input256')}
              style={{ width: window.innerWidth < 768 ? '100%' : 250 }}
              onChange={handleSelectChange('phongBan')}
              value={searchPhongBan}
              allowClear
              onSearch={(value) => searchDepartments(value)}
              notFoundContent={phongBanLoading ? <Spin size="small" /> : null}
            >
              {phongBanOptions.map((item) => (
                <Option key={item} value={item}>
                  {item}
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
        dataSource={assignedData}
        columns={getAssignedColumns()}
        rowKey="responseId"
        loading={tableLoading}
        bordered
        pagination={{
          current: currentAssignedPage,
          pageSize: currentPageSize,
          total: totalAssignedRecords,
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
        footer={() => (
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
        )}
      />
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
            isInDrawer={true}
          />
        )}
      </Drawer>
    </>
  );
};

export default React.memo(AssignedViews); 