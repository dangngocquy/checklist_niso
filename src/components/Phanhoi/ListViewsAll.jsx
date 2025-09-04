import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Space, Button, Popconfirm, message, Dropdown, Menu, Drawer, Tag, Radio, DatePicker, Input, Card, Form, Select, Tooltip, Avatar, Empty, Upload, Modal, Progress, notification, Alert, Spin } from 'antd';
import { DeleteOutlined, SettingOutlined, MoreOutlined, CopyOutlined, LinkOutlined, ControlOutlined, LockOutlined, TeamOutlined, SaveOutlined, GlobalOutlined, ShopOutlined, FullscreenOutlined, CloudSyncOutlined, UploadOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import Avatars from "../../config/design/Avatars";
import ViewUser from '../xemphieu/ViewUser';
import ViewXuly from '../xemphieu/ViewXuLy';
import useApi from '../../hook/useApi';
import useSearchShop from '../../hook/SearchShop/useSearchShop';
import useSearchDepartment from '../../hook/SearchDepartment/useSearchDepartment';
import debounce from 'lodash/debounce';
import 'dayjs/locale/vi';
import UserInfoCard from '../../hook/UserInfoCard';

const { Option } = Select;

const ListViewsAll = ({ t, user, hasxemPermission, hasxlphPermission }) => {
  const [data, setData] = useState([]);
  const cachedDataRef = useRef({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [selectedViewRecord, setSelectedViewRecord] = useState(null);
  const [xulyDrawerVisible, setXulyDrawerVisible] = useState(false);
  const [selectedXulyRecord, setSelectedXulyRecord] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchKeys, setSearchKeys] = useState(null);
  const [searchTitle, setSearchTitle] = useState(null);
  const [searchChiNhanh, setSearchChiNhanh] = useState(null);
  const [searchPhongBan, setSearchPhongBan] = useState(null);
  const [linkToCopy, setLinkToCopy] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [tableLoading, setTableLoading] = useState(false);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [loadingImportExcel, setLoadingImportExcel] = useState(false);
  const [loadingDataSync, setLoadingDataSync] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(5);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalItemsToUpload, setTotalItemsToUpload] = useState(0);
  const [checklistTitles, setChecklistTitles] = useState([]);
  const [titleLoading, setTitleLoading] = useState(false);
  const [isInitialFetchDone, setIsInitialFetchDone] = useState(false); // Thêm state kiểm soát fetch ban đầu

  const {
    deleteResponse,
    deleteBatchResponses,
    updateResponse,
    syncResponses,
    fetchAllTraloi,
    fetchChecklistTitles,
    search,
  } = useApi();
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
      console.error('Error fetching checklist titles:', error);
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
      message.error('Lỗi khi tìm kiếm tài khoản!');
    } finally {
      setUserSearchLoading(false);
    }
  }, 300);

  const fetchUsersByKeys = useCallback(async (keysArray) => {
    if (!keysArray || !keysArray.length) return;
    setUserSearchLoading(true);
    try {
      const missingKeys = keysArray.filter(key => !userOptions.find(u => u.keys === key));
      if (missingKeys.length > 0) {
        const response = await search('', { keys: missingKeys.join(',') });
        const newUsers = response.data || [];
        setUserOptions(prev => [...prev.filter(u => !missingKeys.includes(u.keys)), ...newUsers]);
      }
    } catch (error) {
      console.error('Error fetching users by keys:', error);
      message.error('Lỗi khi lấy thông tin tài khoản!');
    } finally {
      setUserSearchLoading(false);
    }
  }, [search, userOptions]);

  const fetchData = useCallback(async (page = 1, size = currentPageSize) => {
    const filters = {
      ...(startDate && { startDate: dayjs(startDate).format('DD-MM-YYYY') }),
      ...(endDate && { endDate: dayjs(endDate).format('DD-MM-YYYY') }),
      ...(searchKeys && { keysJSON: searchKeys }),
      ...(searchTitle && { title: searchTitle }),
      ...(searchChiNhanh && { chiNhanh: searchChiNhanh }),
      ...(searchPhongBan && { phongBan: searchPhongBan }),
    };

    try {
      setTableLoading(true);
      const response = await fetchAllTraloi(page, size, filters);
      const traloiData = response.data || [];
      const processedTraloiData = traloiData.map((item) => ({
        ...item,
        responseId: String(item.responseId),
        ngay_phan_hoi: item.ngay_phan_hoi || 'N/A',
        nguoiphanhoi: item.nguoiphanhoi || 'Unknown',
        title: item.title || 'Untitled',
        chi_nhanh: item.chi_nhanh || item.chinhanh || 'N/A',
        phongban: item.phongban || item.bophan || 'N/A',
        name: item.name || item.nguoiphanhoi || 'N/A',
        imgAvatar: item.imgAvatar || null,
      }));
      setData(processedTraloiData);
      setTotalRecords(response.total || traloiData.length);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Error Server!');
    } finally {
      setTableLoading(false);
    }
  }, [
    startDate,
    endDate,
    searchKeys,
    searchTitle,
    searchChiNhanh,
    searchPhongBan,
    currentPageSize,
    fetchAllTraloi,
  ]);

  const fetchInitialData = useCallback(async () => {
    try {
      setTableLoading(true);
      await fetchData(1, currentPageSize);
      setIsInitialFetchDone(true); // Đánh dấu fetch ban đầu hoàn thành
    } catch (error) {
      console.error('Error fetching initial data:', error);
      message.error('Error fetching initial data from server!');
    } finally {
      setTableLoading(false);
    }
  }, [currentPageSize, fetchData]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!isInitialFetchDone) return; // Bỏ qua lần gọi ngay sau mount
    fetchData(1, currentPageSize);
  }, [searchKeys, searchTitle, searchChiNhanh, searchPhongBan, currentPageSize, fetchData, isInitialFetchDone]);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteResponse(id);
      cachedDataRef.current = {};
      fetchData(currentPage, currentPageSize);
    } catch (error) {
      message.error('Error Server!');
    }
    setDropdownVisible((prev) => ({ ...prev, [id]: false }));
  }, [deleteResponse, fetchData, currentPage, currentPageSize]);

  const handleBatchDelete = useCallback(async () => {
    if (!selectedRowKeys.length) return;

    try {
      await deleteBatchResponses(selectedRowKeys);
      message.success(`${selectedRowKeys.length} mục ${t('Department.input265')}`);
      setSelectedRowKeys([]);
      cachedDataRef.current = {};
      fetchData(currentPage, currentPageSize);
    } catch (error) {
      console.error('Error deleting items:', error);
      message.error('Lỗi server khi xóa hàng loạt!');
    }
  }, [deleteBatchResponses, fetchData, currentPage, currentPageSize, selectedRowKeys, t]);

  const showDrawer = useCallback((record) => {
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
      cuahang: Array.isArray(record.cuahang) ? record.cuahang.map((item) => (typeof item === 'string' ? item : String(item.cuahang || ''))) : [],
      bophanADS: Array.isArray(record.bophanADS) ? record.bophanADS.map((item) => (typeof item === 'string' ? item : String(item.bophan || ''))) : [],
      accounts: Array.isArray(record.accounts) ? record.accounts : [],
      thoigianxuly: record.thoigianxuly ? dayjs(record.thoigianxuly, 'DD-MM-YYYY HH:mm:ss') : null,
    });
    setDropdownVisible((prev) => ({ ...prev, [record.responseId]: false }));
  }, [form, fetchUsersByKeys]);

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

  const showXulyDrawer = useCallback((record, questionId) => {
    if (!record || !record.responseId || !questionId) {
      message.error('Không thể xử lý: Dữ liệu không hợp lệ.');
      return;
    }
    setSelectedXulyRecord(record);
    setSelectedQuestionId(questionId);
    setXulyDrawerVisible(true);
  }, []);

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
        cuahang: Array.isArray(editingRecord.cuahang) ? editingRecord.cuahang.map((item) => (typeof item === 'string' ? item : String(item.cuahang || ''))) : [],
        bophanADS: Array.isArray(editingRecord.bophanADS) ? editingRecord.bophanADS.map((item) => (typeof item === 'string' ? item : String(item.bophan || ''))) : [],
        accounts: Array.isArray(editingRecord.accounts) ? editingRecord.accounts : [],
        quyenxem: editingRecord.quyenxem === true ? "Public" :
          editingRecord.quyenxem === false ? "Internal" :
            editingRecord.quyenxem || "Private",
        thoigianxuly: editingRecord.thoigianxuly ? dayjs(editingRecord.thoigianxuly, 'DD-MM-YYYY HH:mm:ss') : null,
      });
    }
  }, [editingRecord, form]);

  const onCloseDrawer = useCallback(() => {
    setEditingRecord(null);
    form.resetFields();
  }, [form]);

  const handleDropdownVisibleChange = (flag, id) => {
    setDropdownVisible((prev) => ({ ...prev, [id]: flag }));
  };

  const handleStartDateChange = (date) => {
    const newStartDate = date ? date.startOf('day').toDate() : null;
    setStartDate(newStartDate);
    setCurrentPage(1);
    cachedDataRef.current = {};
    if (newStartDate && endDate) {
      fetchData(1, currentPageSize);
    }
  };

  const handleEndDateChange = (date) => {
    const newEndDate = date ? date.endOf('day').toDate() : null;
    setEndDate(newEndDate);
    setCurrentPage(1);
    cachedDataRef.current = {};
    if (startDate && newEndDate) {
      fetchData(1, currentPageSize);
    }
  };

  const handleCopyLink = () => {
    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy);
      message.success(t('ListDocs.input1'));
    }
  };

  const handleSaveSettings = useCallback(async (values) => {
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
      cachedDataRef.current = {};
      fetchData(currentPage, currentPageSize);
    } catch (error) {
      console.error('Error updating settings:', error);
      message.error('Error server!');
    }
    onCloseDrawer();
  }, [editingRecord, updateResponse, fetchData, currentPage, currentPageSize, t, onCloseDrawer]);

  const handleSelectChange = (field) => (value) => {
    setCurrentPage(1); // Reset về trang đầu tiên
    cachedDataRef.current = {}; // Xóa bộ nhớ đệm

    // Cập nhật trạng thái tương ứng
    if (field === 'keys') setSearchKeys(value || null);
    if (field === 'title') setSearchTitle(value || null);
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
        >
          <span onClick={(e) => e.stopPropagation()}><DeleteOutlined /> Delete</span>
        </Popconfirm>
      </Menu.Item>
    </Menu>
  );

  const getColumns = () => [
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
        // Tìm người dùng khớp với keysJSON từ userOptions
        const matchedUser = Array.isArray(record.keysJSON)
          ? userOptions.find((u) => record.keysJSON.includes(u.keys))
          : userOptions.find((u) => u.keys === record.keysJSON);

        // Xây dựng đối tượng userForCard với ưu tiên từ matchedUser
        const userForCard = {
          name: matchedUser?.name || record.nguoiphanhoi || 'Unknown User',
          username: matchedUser?.username || 'N/A',
          imgAvatar: matchedUser?.imgAvatar || null, // Ưu tiên imgAvatar từ CHECKLIST_DATABASE
          keys: matchedUser?.keys || (Array.isArray(record.keysJSON) ? record.keysJSON.join(', ') : record.keysJSON) || 'N/A',
          email: matchedUser?.email || null,
          chucvu: matchedUser?.chucvu || null,
          chinhanh: matchedUser?.chinhanh || record.chi_nhanh || 'N/A',
          bophan: matchedUser?.bophan || record.phongban || 'N/A',
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
            mouseEnterDelay={0.1}
            mouseLeaveDelay={0.2}
          >
            <span className="avatar-container" style={{ display: 'inline-block', cursor: 'pointer' }}>
              {userForCard.imgAvatar && userForCard.imgAvatar !== 'null' ? (
                <Avatar
                  src={userForCard.imgAvatar}
                  size="middle"
                  style={{ marginRight: 8, pointerEvents: 'auto' }}
                />
              ) : (
                <span style={{ marginRight: 8, pointerEvents: 'auto' }}>
                  <Avatars user={{ name: userForCard.name }} sizeImg="middle" />
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
        text === 'Khách vãng lai' ? (
          <Tag color="green" bordered={false}>{text}</Tag>
        ) : (
          <Tag color="blue" bordered={false}>{text}</Tag>
        )
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
            <Button onClick={() => showViewDrawer(record)} icon={<EyeOutlined />} shape='circle' />
          </Tooltip>
          <Tooltip title="Tùy chọn">
            <Dropdown
              overlay={menu(record)}
              trigger={['click']}
              open={dropdownVisible[record.responseId]}
              onOpenChange={(flag) => handleDropdownVisibleChange(flag, record.responseId)}
            >
              <Button icon={<MoreOutlined />} shape='circle' />
            </Dropdown>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const columns = getColumns();

  const handleExportExcel = useCallback(async () => {
    if (data.length === 0) {
      message.warning('Không có dữ liệu để xuất!');
      return;
    }
    setLoadingExport(true);

    try {
      const filters = {
        ...(startDate && { startDate: dayjs(startDate).format('DD-MM-YYYY') }),
        ...(endDate && { endDate: dayjs(endDate).format('DD-MM-YYYY') }),
        ...(searchKeys && { keysJSON: searchKeys }),
        ...(searchTitle && { title: searchTitle }),
        ...(searchChiNhanh && { chiNhanh: searchChiNhanh }),
        ...(searchPhongBan && { phongBan: searchPhongBan }),
      };

      const response = await fetchAllTraloi(1, 1000, filters);
      const fullData = response.data || [];
      if (fullData.length === 0) {
        message.warning('Không có dữ liệu phù hợp với bộ lọc để xuất!');
        setLoadingExport(false);
        return;
      }

      const exportData = fullData.map((item, index) => {
        const truncateString = (str, maxLength = 32767) => {
          if (typeof str !== 'string') return '';
          return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str;
        };

        return {
          STT: index + 1,
          responseId: item.responseId || '',
          title: item.title || 'Untitled',
          nguoiphanhoi: item.nguoiphanhoi || 'Unknown',
          submittedAt: item.submittedAt || item.ngay_phan_hoi || '',
          chi_nhanh: item.chi_nhanh || item.chinhanh || '',
          phongban: item.phongban || item.bophan || '',
          quyenxem: item.quyenxem || '',
          bophanADS: Array.isArray(item.bophanADS) ? truncateString(item.bophanADS.join(', ')) : truncateString(item.bophanADS || ''),
          accounts: Array.isArray(item.accounts) ? truncateString(item.accounts.join(', ')) : truncateString(item.accounts || ''),
          cuahang: Array.isArray(item.cuahang) ? truncateString(item.cuahang.join(', ')) : truncateString(item.cuahang || ''),
          ngaygiao: item.ngaygiao || '',
          thoigianxuly: item.thoigianxuly || '',
          questions: item.questions ? truncateString(JSON.stringify(item.questions)) : '',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Responses');
      XLSX.writeFile(workbook, `Phan_hoi_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
      message.success('Tải xuống file Excel thành công!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      message.error('Lỗi khi xuất file Excel!');
    } finally {
      setLoadingExport(false);
    }
  }, [data, startDate, endDate, searchKeys, searchTitle, searchChiNhanh, searchPhongBan, fetchAllTraloi]);

  const showUploadModal = (type) => {
    setModalType(type);
    setModalVisible(true);
    setUploadProgress(0);
  };

  const handleUpload = useCallback(
    async (file, type) => {
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        message.error('File quá lớn! Vui lòng chọn file tối đa 500MB.');
        return false;
      }

      const setLoading = type === 'importExcel' ? setLoadingImportExcel : setLoadingDataSync;
      setLoading(true);
      setUploadProgress(0);

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          let jsonData;
          if (type === 'importExcel') {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            jsonData = jsonData.map((item, index) => {
              if (!item || typeof item !== 'object') {
                console.warn(`Dòng ${index + 1} trong Excel không hợp lệ:`, item);
                return null;
              }
              return {
                responseId: item.responseId || undefined, // Giữ responseId nếu có, không thì undefined
                title: item.title || 'Untitled',
                nguoiphanhoi: item.nguoiphanhoi || 'Unknown',
                submittedAt: item.submittedAt || '',
                chi_nhanh: item.chi_nhanh || '',
                ngay_phan_hoi: item.ngay_phan_hoi || '',
                phongban: item.phongban || '',
                quyenxem: item.quyenxem || '',
                keysJSON: item.keysJSON || '',
                bophanADS: item.bophanADS ? String(item.bophanADS).split(', ') : [],
                accounts: item.accounts ? String(item.accounts).split(', ') : [],
                cuahang: item.cuahang ? String(item.cuahang).split(', ') : [],
                ngaygiao: item.ngaygiao || '',
                thoigianxuly: item.thoigianxuly || '',
                questions: item.questions && item.questions !== '' ? JSON.parse(item.questions) : [],
              };
            }).filter((item) => item !== null);

            if (!jsonData.length) {
              throw new Error('File Excel không chứa dữ liệu hợp lệ.');
            }
          } else {
            jsonData = JSON.parse(e.target.result);
            if (!jsonData || (Array.isArray(jsonData) && !jsonData.length)) {
              throw new Error('File JSON không chứa dữ liệu hợp lệ.');
            }
            // Đảm bảo dữ liệu JSON giữ nguyên responseId nếu có
            jsonData = jsonData.map((item) => ({
              ...item,
              responseId: item.responseId || undefined, // Giữ responseId nếu có
            }));
          }

          setTotalItemsToUpload(jsonData.length);

          const onUploadProgress = (progressEvent) => {
            const { loaded, total } = progressEvent;
            const percent = Math.round((loaded / total) * 100);
            setUploadProgress(percent);
          };

          const response = await syncResponses(jsonData, onUploadProgress);
          setUploadProgress(100);

          const { successCount, failureCount, failureDetails } = response;
          notification.success({
            message: 'Đồng bộ dữ liệu hoàn tất',
            description: `Thành công: ${successCount}, Không thành công: ${failureCount}`,
          });
          if (failureCount > 0) {
            console.log('Chi tiết lỗi từ backend:', failureDetails);
            failureDetails.forEach((detail) =>
              message.warning(`Lỗi: ${detail.reason} - ${detail.title || 'Không xác định'}`)
            );
          }

          cachedDataRef.current = {};
          await fetchData(1, currentPageSize);
        } catch (error) {
          console.error('Error uploading file:', error);
          message.error(`Lỗi đồng bộ: ${error.message}`);
        } finally {
          setLoading(false);
          setModalVisible(false);
          setUploadProgress(0);
          setTotalItemsToUpload(0);
        }
      };

      reader.onerror = () => {
        message.error('Lỗi khi đọc file!');
        setLoading(false);
        setModalVisible(false);
        setUploadProgress(0);
      };

      reader[type === 'importExcel' ? 'readAsArrayBuffer' : 'readAsText'](file);
      return false;
    },
    [syncResponses, fetchData, currentPageSize]
  );

  const handleTableChange = (pagination) => {
    const { current, pageSize } = pagination;
    setCurrentPage(current);
    setCurrentPageSize(pageSize);
    cachedDataRef.current = {};
    fetchData(current, pageSize);
  };

  const hasSelected = selectedRowKeys.length > 0;

  return (
    <div>
      <title>NISO CHECKLIST | {t('Department.input264')}</title>
      <Card bordered={false}>
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          size='middle'
          title={() =>
            <>
              <div style={{ marginBottom: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <Select
                  showSearch
                  placeholder={t('ListDocs.input13')}
                  style={{ width: window.innerWidth < 768 ? '100%' : 250 }}
                  onChange={handleSelectChange('keys')}
                  value={searchKeys}
                  allowClear
                  onSearch={(value) => fetchUsers(value)}
                  filterOption={false}
                  notFoundContent={userSearchLoading ? (
                    <Space>
                      <Spin size="small" />
                      <span>Loading...</span>
                    </Space>
                  ) : userOptions.length === 0 && searchKeys ? (
                    <Empty description="Không tìm thấy tài khoản" />
                  ) : null}
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
                  notFoundContent={titleLoading ? (
                    <Space>
                      <Spin size="small" />
                      <span>Loading...</span>
                    </Space>
                  ) : checklistTitles.length === 0 ? null : null}
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
                  notFoundContent={chiNhanhLoading ? (
                    <Space>
                      <Spin size="small" />
                      <span>Loading...</span>
                    </Space>
                  ) : null}
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
                  notFoundContent={phongBanLoading ? (
                    <Space>
                      <Spin size="small" />
                      <span>Loading...</span>
                    </Space>
                  ) : null}
                >
                  {phongBanOptions.map((item) => (
                    <Option key={item} value={item}>
                      {item}
                    </Option>
                  ))}
                </Select>

                <DatePicker
                  placeholder={t('ListDocs.input28')}
                  onChange={(date) => handleStartDateChange(date ? dayjs(date) : null)}
                  format="DD-MM-YYYY"
                  style={{ width: window.innerWidth < 768 ? '100%' : 250 }}
                  disabledDate={(current) => {
                    if (!endDate) return false;
                    return current && current > dayjs(endDate).endOf('day');
                  }}
                />
                <DatePicker
                  placeholder={t('ListDocs.input29')}
                  onChange={(date) => handleEndDateChange(date ? dayjs(date) : null)}
                  format="DD-MM-YYYY"
                  style={{ width: window.innerWidth < 768 ? '100%' : 250 }}
                />
              </div>
              <Space style={{ flexWrap: 'wrap' }}>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExportExcel}
                  loading={loadingExport}
                  disabled={tableLoading}
                >
                  Export Excel
                </Button>
                <Button
                  icon={<UploadOutlined />}
                  onClick={() => showUploadModal('importExcel')}
                  loading={loadingImportExcel}
                  disabled={tableLoading}
                >
                  Import Excel
                </Button>
                <Button
                  icon={<CloudSyncOutlined />}
                  type="primary"
                  onClick={() => showUploadModal('dataSync')}
                  loading={loadingDataSync}
                  disabled={tableLoading}
                >
                  Data Sync
                </Button>
              </Space>
            </>
          }
          dataSource={data}
          columns={columns}
          rowKey="responseId"
          loading={tableLoading}
          bordered
          pagination={{
            current: currentPage,
            pageSize: currentPageSize,
            total: totalRecords,
            pageSizeOptions: ["5", "10", "20", "50", "100"],
            showSizeChanger: true,
            onChange: (page, pageSize) => handleTableChange({ current: page, pageSize }),
            onShowSizeChange: (current, size) => handleTableChange({ current: 1, pageSize: size }),
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            size: window.innerWidth < 768 ? "small" : "middle",
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
      </Card>

      <Modal
        title={modalType === 'importExcel' ? 'Import Excel' : 'Data Sync'}
        open={modalVisible}
        onCancel={() => !loadingImportExcel && !loadingDataSync && setModalVisible(false)}
        footer={null}
        closable={!loadingImportExcel && !loadingDataSync}
      >
        {!(loadingImportExcel || loadingDataSync) && (
          <>
            <Alert
              message="Cảnh báo"
              description="Sau khi tiến hành đồng bộ dữ liệu, các phản hồi thuộc checklist không tồn tại trên hệ thống sẽ bị loại bỏ."
              type="warning"
              showIcon
            />
            <br />
            <Upload.Dragger
              accept={modalType === 'importExcel' ? '.xlsx, .xls' : '.json'}
              showUploadList={false}
              beforeUpload={(file) => handleUpload(file, modalType)}
              disabled={loadingImportExcel || loadingDataSync}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Kéo và thả file hoặc nhấn để chọn</p>
              <p className="ant-upload-hint">
                {modalType === 'importExcel' ? 'Hỗ trợ file .xlsx, .xls' : 'Hỗ trợ file .json'}
              </p>
            </Upload.Dragger>
          </>
        )}
        {(loadingImportExcel || loadingDataSync) && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              gap: 15,
            }}
          >
            <p>Đang tải lên và xử lý... ({Math.round((uploadProgress / 100) * totalItemsToUpload)}/{totalItemsToUpload})</p>
            <Progress type="circle" percent={uploadProgress} />
            <Alert
              message="Vui lòng chờ cho đến khi quá trình tải lên hoàn tất."
              type="warning"
              showIcon
              banner
            />
          </div>
        )}
      </Modal>

      <Drawer
        title='Cài đặt'
        width="800"
        onClose={onCloseDrawer}
        open={editingRecord !== null}
        bodyStyle={{ paddingBottom: 80, backgroundColor: '#f5f7fa' }}
        extra={
          <Button
            type="primary"
            onClick={() => form.submit()}
            icon={<SaveOutlined />}
          >
            {t("Department.input164")}
          </Button>
        }
      >
        {editingRecord && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveSettings}
          >
            <Card
              title={<span><ShopOutlined /> Thông tin cơ bản</span>}
              style={{ marginBottom: 16 }}
              bordered={false}
              className="shadow-sm"
            >
              <Form.Item
                name="quyenxem"
                label={t("Department.input268")}
                rules={[{ required: true, message: t("Department.input228") }]}
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
                        label={t("Department.input227")}
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
                                color="white"
                                title={<UserInfoCard user={user} />}
                                placement={window.innerWidth < 768 ? "top" : "right"}
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
                          disabled={isPublic} // Disable when "Công khai" is selected
                          notFoundContent={chiNhanhLoading ?
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                              <Space>
                                <Spin size="small" />
                                <span>Loading...</span>
                              </Space>
                            </div> : null
                          }
                          options={chiNhanhOptions.map((chinhanh) => ({
                            label: chinhanh.toUpperCase(),
                            value: chinhanh
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
                        label={t("Department.input226")}
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
                          disabled={isPublic} // Disable when "Công khai" is selected
                          notFoundContent={phongBanLoading ?
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                              <Space>
                                <Spin size="small" />
                                <span>Loading...</span>
                              </Space>
                            </div> : null
                          }
                          options={phongBanOptions.map(bophan => ({
                            label: bophan.toUpperCase(),
                            value: bophan
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
              title={<span><LinkOutlined /> Chia sẻ</span>}
              style={{ marginBottom: 16 }}
              bordered={false}
              className="shadow-sm"
            >
              <Form.Item label={t("ListDocs.input26")}>
                <Input.Group compact>
                  <Input
                    style={{ width: "calc(100% - 40px)" }}
                    value={linkToCopy}
                    readOnly
                    prefix={<LinkOutlined style={{ color: '#ae8f3d' }} />}
                  />
                  <Tooltip title="Sao chép liên kết">
                    <Button
                      icon={<CopyOutlined />}
                      onClick={handleCopyLink}
                      type="primary"
                    />
                  </Tooltip>
                </Input.Group>
              </Form.Item>
            </Card>

            <Card
              title={<span><ControlOutlined /> Cấu hình</span>}
              bordered={false}
              className="shadow-sm"
            >
              <Form.Item
                name="thoigianxuly"
                label="Hạn xử lý"
                tooltip="Thiết lập thời hạn xử lý công việc"
              >
                <DatePicker
                  showTime
                  format="DD-MM-YYYY HH:mm:ss"
                  placeholder="Chọn thời hạn"
                  style={{ width: '100%' }}
                />
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
              <span>Chi tiết phiếu {window.innerWidth < 768 ? (selectedViewRecord.title.length > 10 ? selectedViewRecord.title.substring(0, 10) + '...' : selectedViewRecord.title) : (selectedViewRecord.title.length > 40 ? selectedViewRecord.title.substring(0, 40) + '...' : selectedViewRecord.title)}</span>
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
            t={t}
            onShowXulyDrawer={showXulyDrawer}
            isInDrawer={true}
          />
        )}

        <Drawer
          title={
            selectedXulyRecord ? (
              <Tooltip title={selectedXulyRecord.title}>
                <span>Xử lý phiếu {window.innerWidth < 768 ? (selectedXulyRecord.title.length > 10 ? selectedXulyRecord.title.substring(0, 10) + '...' : selectedXulyRecord.title) : (selectedXulyRecord.title.length > 50 ? selectedXulyRecord.title.substring(0, 50) + '...' : selectedXulyRecord.title)}</span>
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
      </Drawer>
    </div>
  );
};

export default React.memo(ListViewsAll);