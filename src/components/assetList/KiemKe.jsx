import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Select,
  DatePicker,
  Empty,
  Tag,
  Divider,
  Tooltip,
  Card,
  Spin,
  message,
  Statistic,
  Row,
  Col,
  Avatar,
} from 'antd';
import {
  SearchOutlined,
  ScanOutlined,
  FileAddOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import Avatars from '../../config/design/Avatars';
import NotFoundPage from '../NotFoundPage';
import UserInfoCard from '../../hook/UserInfoCard';

const { Title, Text } = Typography;

const KiemKe = ({ user, hasquanlyTSPermission, hastKiemKePermission, hastXoaTSPermission }) => {
  const [inventories, setInventories] = useState([]);
  const [currentInventory, setCurrentInventory] = useState(null);
  const [checkList, setCheckList] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isCheckModalVisible, setIsCheckModalVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [userData, setUserData] = useState({});
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [checkForm] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPage, setCurrentPage] = useState(1); // Thêm state cho trang hiện tại
  const [totalInventories, setTotalInventories] = useState(0); // Thêm state cho tổng số bản ghi
  const [loading, setLoading] = useState(false); // Thêm state cho loading

  const pageSize = 5; // Số bản ghi mỗi trang

  const axiosConfig = {
    headers: {
      'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
      'Content-Type': 'application/json',
    },
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedAxiosConfig = React.useMemo(() => axiosConfig, []);

  const getUserInfo = useCallback(async (keys) => {
    if (!keys) return { name: 'Chưa xác định', imgAvatar: null };
    if (userData[keys]) return userData[keys];

    try {
      const response = await axios.get(`/users/get-by-keys/${keys}`, memoizedAxiosConfig);
      const userInfo = {
        name: response.data.name || response.data.username,
        imgAvatar: response.data.imgAvatar,
        keys: response.data.keys,
        bophan: response.data.bophan,
        chinhanh: response.data.chinhanh,
        username: response.data.username,
        imgBackground: response.data.imgBackground,
        email: response.data.email,
      };
      setUserData((prev) => ({ ...prev, [keys]: userInfo }));
      return userInfo;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
      return { name: keys, imgAvatar: null };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedAxiosConfig]);

  const fetchInventories = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/inventory-checks', {
        ...memoizedAxiosConfig,
        params: {
          page,
          limit: pageSize,
          search: inventorySearch,
        },
      });
      const inventoriesData = response.data.data;
      const uniqueCreatedBy = [...new Set(inventoriesData.map((inv) => inv.createdBy))];
      await Promise.all(uniqueCreatedBy.map((key) => getUserInfo(key)));
      setInventories(inventoriesData);
      setTotalInventories(response.data.total);
      setCurrentPage(page);
    } catch (error) {
      message.error('Lỗi khi tải danh sách kiểm kê');
    } finally {
      setLoading(false);
    }
  }, [memoizedAxiosConfig, getUserInfo, inventorySearch]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get('/api/asset-categories', memoizedAxiosConfig);
      setCategories(response.data.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách danh mục');
    }
  }, [memoizedAxiosConfig]);

  const fetchAssetsByCategories = async (categoryArray) => {
    try {
      const response = await axios.get('/api/assets', {
        ...memoizedAxiosConfig,
        params: { category: categoryArray.join(','), limit: 0 },
      });
      return response.data.data.map((asset) => ({
        assetId: asset._id,
        assetTag: asset.assetTag,
        name: asset.name,
        category: asset.category,
        location: asset.location,
        status: asset.status,
        assignedTo: asset.assignedTo,
        serialNumbers: asset.serialNumbers || [],
        actualQuantity: asset.actualQuantity || asset.serialNumbers.length,
        checked: false,
      }));
    } catch (error) {
      console.error('Error fetching assets:', error);
      message.error('Lỗi khi tải danh sách tài sản theo danh mục');
      return [];
    }
  };

  useEffect(() => {
    fetchInventories(currentPage); // Gọi với trang mặc định ban đầu
    fetchCategories();
  }, [fetchInventories, fetchCategories, currentPage]);

  const handleTableChange = (pagination) => {
    const { current } = pagination;
    fetchInventories(current); // Gọi API khi người dùng chuyển trang
  };

  // Các hàm khác giữ nguyên (showModal, handleSubmit, handleEditSubmit, v.v.)

  const showModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    editForm.setFieldsValue({
      name: record.name,
      dateRange: record.startDate && record.endDate
        ? [moment(record.startDate, 'DD-MM-YYYY'), moment(record.endDate, 'DD-MM-YYYY')]
        : null,
      note: record.note,
    });
    setCurrentInventory(record);
    setIsEditModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEditModalVisible(false);
    setIsCheckModalVisible(false);
  };

  const handleSubmit = async (values) => {
    try {
      const assets = await fetchAssetsByCategories(values.category);
      if (!assets.length) {
        message.warning('Không tìm thấy tài sản nào trong danh mục đã chọn!');
      }

      await axios.post(
        '/api/inventory-checks',
        {
          name: values.name,
          startDate: values.dateRange ? values.dateRange[0].format('DD-MM-YYYY') : null,
          endDate: values.dateRange ? values.dateRange[1].format('DD-MM-YYYY') : null,
          note: values.note,
          category: values.category,
          assets: assets,
          totalAssets: assets.length,
          checkedAssets: 0,
          missingAssets: 0,
          status: 'Planned',
          createdBy: user.keys,
          checkMethod: values.checkMethod,
        },
        memoizedAxiosConfig
      );
      fetchInventories(currentPage); // Làm mới danh sách
      setIsModalVisible(false);
      message.success('Đã tạo đợt kiểm kê mới thành công!');
    } catch (error) {
      console.error('Error creating inventory:', error);
      message.error('Lỗi khi tạo đợt kiểm kê');
    }
  };

  const handleEditSubmit = async (values) => {
    try {
      await axios.put(
        `/api/inventory-checks/${currentInventory._id}`,
        {
          name: values.name,
          startDate: values.dateRange ? values.dateRange[0].format('DD-MM-YYYY') : null,
          endDate: values.dateRange ? values.dateRange[1].format('DD-MM-YYYY') : null,
          note: values.note,
        },
        memoizedAxiosConfig
      );
      fetchInventories(currentPage); // Refresh danh sách sau khi cập nhật
      setIsEditModalVisible(false);
      message.success('Đã cập nhật đợt kiểm kê thành công!');
    } catch (error) {
      message.error('Lỗi khi cập nhật đợt kiểm kê');
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Xác nhận xóa đợt kiểm kê',
      content: `Bạn có chắc chắn muốn xóa đợt kiểm kê "${record.name}" không? Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await axios.delete(`/api/inventory-checks/${record._id}`, memoizedAxiosConfig);
          fetchInventories(currentPage); // Refresh danh sách sau khi xóa
          message.success('Đã xóa đợt kiểm kê thành công!');
        } catch (error) {
          message.error('Lỗi khi xóa đợt kiểm kê');
        }
      },
    });
  };

  const startChecking = (record) => {
    setCurrentInventory(record);
    setCheckList(record.assets || []);
    setCurrentStep(1);
  };

  const showCheckModal = (asset) => {
    if (asset.checked) {
      message.warning('Tài sản này đã được kiểm tra trước đó!');
    }
    checkForm.resetFields();
    checkForm.setFieldsValue({
      assetTag: asset.assetTag,
      name: asset.name,
      category: asset.category,
      status: asset.status,
      location: asset.location,
      assignedTo: asset.assignedTo,
      actualQuantity: asset.actualQuantity,
      checkedSerialNumbers: asset.checkedSerialNumbers || [],
    });
    setIsCheckModalVisible(true);
  };

  const handleCheckSubmit = async (values) => {
    try {
      const updatedCheckList = checkList.map((item) => {
        if (item.assetTag === values.assetTag) {
          if (currentInventory.checkMethod === 'SerialNumber') {
            const inputSerialNumbers = values.serialNumber || []; // Danh sách Serial Number nhập vào
            const assetSerialNumbers = item.serialNumbers || [];
            const currentCheckedSerialNumbers = values.checkedSerialNumbers || [];

            if (!inputSerialNumbers.length) {
              message.error('Vui lòng nhập ít nhất một Serial Number!');
              return item;
            }

            // Kiểm tra từng Serial Number nhập vào
            const invalidSerials = inputSerialNumbers.filter(
              (sn) => !assetSerialNumbers.includes(sn)
            );
            if (invalidSerials.length > 0) {
              message.warning(
                `Các Serial Number không tồn tại: ${invalidSerials.join(', ')}`
              );
              return {
                ...item,
                checked: false,
                checkDate: moment().format('DD-MM-YYYY'),
                checkStatus: 'Không tìm thấy',
                checkNote: `Serial Number không tồn tại: ${invalidSerials.join(', ')}`,
                checkedBy: user.keys,
                checkedSerialNumbers: currentCheckedSerialNumbers,
              };
            }

            // Lọc bỏ Serial Number đã kiểm tra trước đó để tránh trùng lặp
            const newSerialNumbers = inputSerialNumbers.filter(
              (sn) => !currentCheckedSerialNumbers.includes(sn)
            );
            const updatedCheckedSerialNumbers = [
              ...currentCheckedSerialNumbers,
              ...newSerialNumbers,
            ];
            const correctQuantity =
              updatedCheckedSerialNumbers.length === item.actualQuantity;

            if (!correctQuantity) {
              message.info(
                `Đã kiểm ${updatedCheckedSerialNumbers.length}/${item.actualQuantity} Serial Number`
              );
              checkForm.setFieldsValue({
                serialNumber: [], // Xóa ô nhập để nhập tiếp
                checkedSerialNumbers: updatedCheckedSerialNumbers,
              });
              return {
                ...item,
                checked: false,
                checkDate: moment().format('DD-MM-YYYY'),
                checkStatus: 'Thiếu',
                checkNote: `Chỉ kiểm được ${updatedCheckedSerialNumbers.length}/${item.actualQuantity} Serial Number`,
                checkedBy: user.keys,
                checkedSerialNumbers: updatedCheckedSerialNumbers,
              };
            }

            message.success('Đã kiểm đủ tất cả Serial Number!');
            return {
              ...item,
              checked: true,
              checkDate: moment().format('DD-MM-YYYY'),
              checkStatus: 'Đủ',
              checkNote: values.note || '',
              checkedBy: user.keys,
              checkedSerialNumbers: updatedCheckedSerialNumbers,
            };
          }

          if (currentInventory.checkMethod === 'AssetTag') {
            const isTagMatch = values.assetTagInput === item.assetTag;

            if (!values.assetTagInput) {
              message.error('Vui lòng nhập Mã tài sản!');
              return item;
            }

            if (!isTagMatch) {
              message.warning(`Mã tài sản không khớp: ${values.assetTagInput}`);
              return {
                ...item,
                checked: false,
                checkDate: moment().format('DD-MM-YYYY'),
                checkStatus: 'Không tìm thấy',
                checkNote: `Mã tài sản nhập: ${values.assetTagInput}`,
                checkedBy: user.keys,
              };
            }

            message.success('Mã tài sản khớp, kiểm tra thành công!');
            return {
              ...item,
              checked: true,
              checkDate: moment().format('DD-MM-YYYY'),
              checkStatus: 'Đủ',
              checkNote: values.note || '',
              checkedBy: user.keys,
            };
          }

          // Manual
          message.success('Kiểm tra tài sản thành công!');
          return {
            ...item,
            checked: true,
            checkDate: moment().format('DD-MM-YYYY'),
            checkStatus: values.checkStatus || 'Đủ',
            checkNote: values.note || '',
            actualLocation: values.actualLocation || item.location,
            actualStatus: values.actualStatus || item.status,
            checkedBy: user.keys,
          };
        }
        return item;
      });

      const hasChanges = updatedCheckList.some((item, index) => item !== checkList[index]);
      if (!hasChanges) {
        return;
      }

      const response = await axios.put(
        `/api/inventory-checks/${currentInventory._id}`,
        {
          assets: updatedCheckList,
          checkedAssets: updatedCheckList.filter((item) => item.checked).length,
          missingAssets: updatedCheckList.filter(
            (item) => item.checkStatus === 'Không tìm thấy'
          ).length,
          status: updatedCheckList.every((item) => item.checked)
            ? 'Hoàn thành'
            : 'Đang kiểm kê',
          createdBy: currentInventory.createdBy,
        },
        memoizedAxiosConfig
      );

      const updatedData = response.data.data;
      setCheckList(updatedData.assets);

      const checkedCount =
        currentInventory.checkMethod === 'SerialNumber'
          ? updatedData.assets.reduce(
            (sum, asset) => sum + (asset.checkedSerialNumbers?.length || 0),
            0
          )
          : updatedData.assets.filter((item) => item.checked).length;
      const missingCount = updatedData.assets.filter(
        (item) => item.checkStatus === 'Không tìm thấy'
      ).length;

      const updatedInventories = inventories.map((inv) => {
        if (inv._id === currentInventory._id) {
          return {
            ...inv,
            assets: updatedData.assets,
            checkedAssets: checkedCount,
            missingAssets: missingCount,
            status:
              checkedCount ===
                (inv.checkMethod === 'SerialNumber'
                  ? inv.assets.reduce((sum, asset) => sum + (asset.actualQuantity || 0), 0)
                  : inv.totalAssets)
                ? 'Hoàn thành'
                : 'Đang kiểm kê',
          };
        }
        return inv;
      });

      setInventories(updatedInventories);
      setCurrentInventory({
        ...currentInventory,
        assets: updatedData.assets,
        checkedAssets: checkedCount,
        missingAssets: missingCount,
        status:
          checkedCount ===
            (currentInventory.checkMethod === 'SerialNumber'
              ? currentInventory.assets.reduce(
                (sum, asset) => sum + (asset.actualQuantity || 0),
                0
              )
              : currentInventory.totalAssets)
            ? 'Hoàn thành'
            : 'Đang kiểm kê',
      });

      if (
        updatedCheckList.find((item) => item.assetTag === values.assetTag)
          ?.checkStatus === 'Đủ'
      ) {
        setIsCheckModalVisible(false);
      }
    } catch (error) {
      console.error('Error in handleCheckSubmit:', error);
      message.error('Lỗi khi cập nhật thông tin kiểm kê');
    }
  };
  const finishInventoryCheck = () => {
    Modal.confirm({
      title: 'Xác nhận hoàn thành kiểm kê',
      content: 'Bạn có chắc chắn muốn hoàn thành đợt kiểm kê này không?',
      onOk: async () => {
        try {
          await axios.put(
            `/api/inventory-checks/${currentInventory._id}`,
            {
              assets: currentInventory.assets,
              checkedAssets: currentInventory.checkedAssets,
              missingAssets: currentInventory.missingAssets,
              status: 'Hoàn thành',
            },
            memoizedAxiosConfig
          );

          const updatedInventories = inventories.map((inv) => {
            if (inv._id === currentInventory._id) {
              return { ...inv, status: 'Hoàn thành' };
            }
            return inv;
          });
          setInventories(updatedInventories);
          setCurrentInventory({ ...currentInventory, status: 'Hoàn thành' });
          message.success('Đã hoàn thành đợt kiểm kê!');
          setCurrentStep(0);
        } catch (error) {
          message.error(error.response?.data?.message || 'Lỗi khi hoàn thành kiểm kê');
        }
      },
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Hoàn thành': return 'green';
      case 'Đang kiểm kê': return 'blue';
      case 'Planned': return 'orange';
      default: return 'default';
    }
  };

  const getCheckStatusColor = (status) => {
    switch (status) {
      case 'Đủ': return 'green';
      case 'Không tìm thấy': return 'red';
      case 'Sai vị trí': return 'orange';
      default: return 'default';
    }
  };

  const handleDetailClick = (record) => {
    if (record.status === 'Hoàn thành') {
      startChecking(record);
    } else {
      const createdByInfo = userData[record.createdBy] || { name: 'Trống', imgAvatar: null };
      Modal.info({
        title: `Chi tiết đợt kiểm kê: ${record.name}`,
        content: (
          <div>
            <p><strong>Người tạo:</strong> {createdByInfo ? (
              <Space>
                {createdByInfo.imgAvatar ? (
                  <Avatar src={createdByInfo.imgAvatar} size="small" icon={<Spin size="small" />} />
                ) : (
                  <Avatars user={{ name: createdByInfo.name }} sizeImg="small" />
                )}
                <span>{createdByInfo.name}</span>
              </Space>
            ) : <Tag color='red' bordered={false}>Trống</Tag>}</p>
            <p><strong>Tổng số tài sản:</strong> {record.assets.reduce((sum, asset) => sum + (asset.actualQuantity || 0), 0)}</p>
            <p><strong>Tổng số sản phẩm:</strong> {record.totalAssets}</p>
            <p><strong>Đã kiểm tra:</strong> {record.checkedAssets}</p>
            <p><strong>Tài sản thiếu:</strong> {record.missingAssets}</p>
            <p><strong>Ghi chú:</strong> {record.note || 'Không có'}</p>
          </div>
        ),
      });
    }
  };

  const inventoryColumns = [
    {
      title: 'Tên đợt kiểm kê',
      dataIndex: 'name',
      key: 'name',
      filteredValue: inventorySearch ? [inventorySearch] : null,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(value.toLowerCase()) ||
        (record.createdBy && record.createdBy.toLowerCase().includes(value.toLowerCase())),
      ellipsis: true,
    },
    {
      title: 'Thời gian',
      key: 'timeRange',
      render: (_, record) => (
        <span>
          {record.startDate && record.endDate
            ? `${record.startDate} đến ${record.endDate}`
            : 'Chưa xác định'}
        </span>
      ),
      responsive: ['md'],
    },
    {
      title: 'Người tạo',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (createdBy) => {
        const userInfo = userData[createdBy] || { name: 'Trống', imgAvatar: null };
        // Construct user object for UserInfoCard
        const userForCard = {
          name: userInfo.name || 'Unknown User',
          username: userInfo.username, // Use createdBy as username/keys
          imgAvatar: userInfo.imgAvatar || null,
          keys: userInfo.keys, // Use userInfo.keys if available
          email: userInfo.email, // Use userInfo.email if available
          chucvu: userInfo.chucvu, // Use userInfo.chucvu if available
          chinhanh: userInfo.chinhanh, // Use userInfo.chinhanh if available
          bophan: userInfo.bophan, // Use userInfo.bophan if available
          locker: false, // Default
          imgBackground: userInfo.imgBackground || null, // Use userInfo.imgBackground if available
        };

        return userInfo.name !== 'Trống' ? (
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
              <span
                className="avatar-container"
                style={{ display: 'inline-block', cursor: 'pointer' }}
              >
                {userInfo.imgAvatar ? (
                  <Avatar
                    src={userInfo.imgAvatar}
                    size="large"
                    style={{ pointerEvents: 'auto' }}
                  />
                ) : (
                  <span style={{ pointerEvents: 'auto' }}>
                    <Avatars
                      user={{ name: userInfo.name || 'Unknown' }}
                      sizeImg="large"
                    />
                  </span>
                )}
              </span>
            </Tooltip>
            <span>{userInfo.name}</span>
          </Space>
        ) : (
          <Tag color="red" bordered={false}>
            Trống
          </Tag>
        );
      },
      responsive: ['md'],
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)} bordered={false}>{status}</Tag>,
    },
    {
      title: 'Tiến độ',
      key: 'progress',
      render: (_, record) => {
        let totalQuantity = 0;
        let checkedQuantity = 0;

        if (record.checkMethod === 'SerialNumber') {
          // Với SerialNumber: Tổng số SerialNumber cần kiểm và số đã kiểm
          totalQuantity = record.assets.reduce((sum, asset) => sum + (asset.actualQuantity || 0), 0);
          checkedQuantity = record.assets.reduce(
            (sum, asset) => sum + (asset.checkedSerialNumbers?.length || 0),
            0
          );
        } else {
          // Với Manual và AssetTag: Tổng số tài sản và số tài sản đã kiểm
          totalQuantity = record.assets.reduce((sum, asset) => sum + (asset.actualQuantity || 0), 0);
          checkedQuantity = record.assets
            .filter((asset) => asset.checked)
            .reduce((sum, asset) => sum + (asset.actualQuantity || 0), 0);
        }

        return <span>{checkedQuantity}/{totalQuantity}</span>;
      },
      responsive: ['sm'],
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small" direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}>
          <Button
            type="primary"
            onClick={() => startChecking(record)}
            disabled={record.status === 'Hoàn thành'}
            size="small"
          >
            {record.status === 'Đang kiểm kê' ? 'Tiếp tục' : 'Bắt đầu'}
          </Button>
          <Button onClick={() => handleDetailClick(record)} size="small">
            Chi tiết
          </Button>
          {user.phanquyen === 'IT asset' && (
            <Button
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
              size="small"
              disabled={record.status === 'Hoàn thành'}
            >
              Sửa
            </Button>
          )}
          {(user.phanquyen === 'IT asset' || hastXoaTSPermission === true) &&
            <Button
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              size="small"
              danger
            >
              Xóa
            </Button>
          }
        </Space>
      ),
    },
  ];

  const checkListColumns = [
    {
      title: 'Mã tài sản',
      dataIndex: 'assetTag',
      key: 'assetTag',
      filteredValue: searchValue ? [searchValue] : null,
      onFilter: (value, record) =>
        record.assetTag.toLowerCase().includes(value.toLowerCase()) ||
        record.name.toLowerCase().includes(value.toLowerCase()),
      ellipsis: true,
    },
    {
      title: 'Tên tài sản',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Serial Numbers đã kiểm',
      dataIndex: 'checkedSerialNumbers',
      key: 'checkedSerialNumbers',
      render: (checkedSerialNumbers) =>
        checkedSerialNumbers && checkedSerialNumbers.length > 0
          ? checkedSerialNumbers.join(', ')
          : <Tag color="default" bordered={false}>Chưa kiểm tra</Tag>,
      responsive: ['lg'],
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      responsive: ['md'],
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
      render: (location) => location ? location : <Tag color="red" bordered={false}>Trống</Tag>,
      responsive: ['lg'],
    },
    {
      title: 'Số tồn',
      dataIndex: 'actualQuantity',
      key: 'actualQuantity',
      render: (quantity) => <Tag color="purple" bordered={false}>{quantity}</Tag>,
      responsive: ['md'],
    },
    {
      title: 'Người kiểm',
      dataIndex: 'checkedBy',
      key: 'checkedBy',
      render: (checkedBy) => {
        const userInfo = userData[checkedBy] || { name: 'Trống', imgAvatar: null };
        // Construct user object for UserInfoCard
        const userForCard = {
          name: userInfo.name || 'Unknown User',
          username: userInfo.username, // Use checkedBy as username/keys
          imgAvatar: userInfo.imgAvatar || null,
          keys: userInfo.keys, // Use userInfo.keys if available
          email: userInfo.email, // Use userInfo.email if available
          chucvu: userInfo.chucvu, // Use userInfo.chucvu if available
          chinhanh: userInfo.chinhanh, // Use userInfo.chinhanh if available
          bophan: userInfo.bophan, // Use userInfo.bophan if available
          locker: false, // Default
          imgBackground: userInfo.imgBackground || null, // Use userInfo.imgBackground if available
        };

        return userInfo.name !== 'Trống' ? (
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
              <span
                className="avatar-container"
                style={{ display: 'inline-block', cursor: 'pointer' }}
              >
                {userInfo.imgAvatar ? (
                  <Avatar
                    src={userInfo.imgAvatar}
                    size="large"
                    style={{ pointerEvents: 'auto' }}
                  />
                ) : (
                  <span style={{ pointerEvents: 'auto' }}>
                    <Avatars
                      user={{ name: userInfo.name || 'Unknown' }}
                      sizeImg="large"
                    />
                  </span>
                )}
              </span>
            </Tooltip>
            <span>{userInfo.name}</span>
          </Space>
        ) : (
          <Tag color="red" bordered={false}>
            Trống
          </Tag>
        );
      },
      responsive: ['md'],
    },
    {
      title: 'Trạng thái kiểm tra',
      key: 'checkStatus',
      render: (_, record) => (
        record.checked ? (
          <Tag color={getCheckStatusColor(record.checkStatus)} bordered={false}>
            {record.checkStatus}
          </Tag>
        ) : (
          <Tag color="default" bordered={false}>Chưa kiểm tra</Tag>
        )
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          type={record.checked ? 'default' : 'primary'}
          onClick={() => showCheckModal(record)}
          size="small"
          disabled={currentInventory?.status === 'Hoàn thành'}
        >
          {record.checked ? 'Cập nhật' : 'Kiểm tra'}
        </Button>
      ),
    },
  ];

  const renderContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <Table
              bordered
              loading={loading}
              locale={{ emptyText: <Empty description="Danh sách trống !" /> }}
              columns={inventoryColumns}
              dataSource={inventories}
              rowKey="_id"
              size='middle'
              title={() => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Input
                    placeholder="Tìm kiếm đợt kiểm kê..."
                    prefix={<SearchOutlined />}
                    style={{ width: '100%', marginBottom: 12 }}
                    size="middle"
                    onChange={(e) => {
                      setInventorySearch(e.target.value);
                      fetchInventories(1); // Reset về trang 1 khi tìm kiếm
                    }}
                  />
                  {(user.phanquyen === 'IT asset' || user.phanquyen === true) && (
                    <Space style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <Button type="primary" icon={<FileAddOutlined />} onClick={showModal}>
                        Tạo đợt kiểm kê mới
                      </Button>
                    </Space>
                  )}
                </div>
              )}
              scroll={{ x: true }}
              style={{ width: "100%", whiteSpace: "nowrap" }}
              pagination={{
                current: currentPage, // Trang hiện tại
                pageSize: pageSize, // Số bản ghi mỗi trang
                total: totalInventories, // Tổng số bản ghi
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                showSizeChanger: false, // Tắt thay đổi kích thước trang
                onChange: (page) => handleTableChange({ current: page }), // Xử lý khi chuyển trang
                size: window.innerWidth < 768 ? "small" : "middle"
              }}
              onChange={handleTableChange} // Xử lý sự kiện thay đổi phân trang
            />
          </Card>
        );
      case 1:
        let totalQuantity = 0;
        let checkedQuantity = 0;
        let uncheckedQuantity = 0;
        let missingQuantity = 0;

        if (currentInventory?.checkMethod === 'SerialNumber') {
          // Với SerialNumber
          totalQuantity = checkList.reduce((sum, asset) => sum + (asset.actualQuantity || 0), 0);
          checkedQuantity = checkList.reduce(
            (sum, asset) => sum + (asset.checkedSerialNumbers?.length || 0),
            0
          );
          uncheckedQuantity = totalQuantity - checkedQuantity;
          missingQuantity = checkList.reduce(
            (sum, asset) =>
              sum +
              (asset.checkStatus === 'Không tìm thấy' ? asset.actualQuantity - (asset.checkedSerialNumbers?.length || 0) : 0),
            0
          );
        } else {
          // Với Manual và AssetTag
          totalQuantity = checkList.reduce((sum, asset) => sum + (asset.actualQuantity || 0), 0);
          checkedQuantity = checkList
            .filter((asset) => asset.checked)
            .reduce((sum, asset) => sum + (asset.actualQuantity || 0), 0);
          uncheckedQuantity = totalQuantity - checkedQuantity;
          missingQuantity = checkList
            .filter((asset) => asset.checkStatus === 'Không tìm thấy')
            .reduce((sum, asset) => sum + (asset.actualQuantity || 0), 0);
        }

        return (
          <>
            <div style={{ marginBottom: 16 }}>
              <Row justify="space-between" align="middle" gutter={[16, 16]}>
                <Col xs={24} md={16}>
                  <Title level={4} style={{ margin: 0 }}>{currentInventory?.name}</Title>
                  <Text>
                    {currentInventory?.startDate && currentInventory?.endDate
                      ? `${currentInventory.startDate} đến ${currentInventory.endDate}`
                      : 'Chưa xác định'}
                  </Text>
                </Col>
                <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                  <Space direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}>
                    <Button onClick={() => setCurrentStep(0)}>Quay lại</Button>
                    {currentInventory?.status !== 'Hoàn thành' && (
                      <Button
                        type="primary"
                        onClick={finishInventoryCheck}
                        disabled={
                          currentInventory?.checkMethod === 'SerialNumber'
                            ? checkedQuantity !== totalQuantity
                            : checkedQuantity !== totalQuantity
                        }
                      >
                        Hoàn thành
                      </Button>
                    )}
                  </Space>
                </Col>
              </Row>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="Tổng tồn"
                    value={totalQuantity}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="Đã kiểm tra"
                    value={checkedQuantity}
                    valueStyle={{ color: '#52c41a' }}
                    suffix={`/ ${totalQuantity}`}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="Chưa kiểm tra"
                    value={uncheckedQuantity}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="Số lượng thiếu"
                    value={missingQuantity}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>

            <div style={{ marginBottom: 16 }}>
              <Input
                placeholder="Tìm kiếm tài sản theo mã hoặc tên..."
                prefix={<SearchOutlined />}
                style={{ width: '100%', maxWidth: 300 }}
                onChange={(e) => setSearchValue(e.target.value)}
                suffix={
                  <Tooltip title="Quét mã QR">
                    <Button type="text" icon={<ScanOutlined />} />
                  </Tooltip>
                }
              />
            </div>

            <Table
              scroll={{ x: 'max-content' }}
              columns={checkListColumns}
              bordered
              locale={{ emptyText: <Empty description="Danh sách trống !" /> }}
              dataSource={checkList}
              rowKey="assetId"
              rowClassName={(record) => (record.checked ? 'checked-row' : '')}
            />
          </>
        );
      default:
        return null;
    }
  };

  if (!hasquanlyTSPermission && user.phanquyen !== true && !hastKiemKePermission && !hastXoaTSPermission && user.phanquyen !== 'IT asset') {
    return <NotFoundPage />;
  }

  return (
    <div style={{ padding: '0 16px' }}>
      {renderContent()}

      <Modal
        title="Tạo đợt kiểm kê mới"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={window.innerWidth < 768 ? '90%' : 520}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Tên đợt kiểm kê"
            rules={[{ required: true, message: 'Vui lòng nhập tên đợt kiểm kê!' }]}
          >
            <Input placeholder="Ví dụ: Kiểm kê quý 2/2024" />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Thời gian thực hiện"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian thực hiện!' }]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục tài sản"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một danh mục tài sản!' }]}
          >
            <Select mode="multiple" placeholder="Chọn danh mục" allowClear style={{ width: '100%' }}>
              {categories.map((cat) => (
                <Select.Option key={cat} value={cat}>{cat}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="checkMethod"
            label="Hình thức kiểm kê"
            rules={[{ required: true, message: 'Vui lòng chọn hình thức kiểm kê!' }]}
          >
            <Select placeholder="Chọn hình thức kiểm kê">
              <Select.Option value="Manual">Thủ công</Select.Option>
              <Select.Option value="SerialNumber">Serial Number</Select.Option>
              <Select.Option value="AssetTag">Mã tài sản</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 12 }}>
            <Space>
              <Button onClick={handleCancel}>Hủy</Button>
              <Button type="primary" htmlType="submit">Tạo</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Sửa đợt kiểm kê"
        open={isEditModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={window.innerWidth < 768 ? '90%' : 520}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item
            name="name"
            label="Tên đợt kiểm kê"
            rules={[{ required: true, message: 'Vui lòng nhập tên đợt kiểm kê!' }]}
          >
            <Input placeholder="Ví dụ: Kiểm kê quý 2/2024" />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Thời gian thực hiện"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian thực hiện!' }]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 12 }}>
            <Space>
              <Button onClick={handleCancel}>Hủy</Button>
              <Button type="primary" htmlType="submit">Cập nhật</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Kiểm tra tài sản"
        open={isCheckModalVisible}
        onCancel={() => setIsCheckModalVisible(false)}
        footer={null}
        width={window.innerWidth < 768 ? '90%' : 600}
      >
        <Form form={checkForm} layout="vertical" onFinish={handleCheckSubmit}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item name="assetTag" label="Mã tài sản">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="Tên tài sản">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Danh mục">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Trạng thái dự kiến">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="Vị trí dự kiến">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actualQuantity" label="Số tồn">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Thông tin kiểm tra</Divider>

          {currentInventory?.checkMethod === 'SerialNumber' && (
            <>
              <Form.Item
                name="serialNumber"
                label={`Serial Number (Đã kiểm: ${checkForm.getFieldValue('checkedSerialNumbers')?.length || 0
                  }/${checkForm.getFieldValue('actualQuantity') || 0})`}
                rules={[
                  { required: true, message: 'Vui lòng nhập ít nhất một Serial Number!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const checkedSerialNumbers = getFieldValue('checkedSerialNumbers') || [];
                      const duplicates = value?.filter((sn) =>
                        checkedSerialNumbers.includes(sn)
                      );
                      if (duplicates?.length > 0) {
                        return Promise.reject(
                          new Error(
                            `Serial Number này đã được kiểm kê: ${duplicates.join(', ')}`
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Select
                  mode="tags"
                  placeholder="Nhập Serial Number (có thể nhập nhiều)"
                  style={{ width: '100%' }}
                  tokenSeparators={[',']}
                  value={[]} // Reset giá trị sau mỗi lần nhập
                />
              </Form.Item>
              <Form.Item name="checkedSerialNumbers" hidden>
                <Input type="hidden" />
              </Form.Item>
            </>
          )}

          {currentInventory?.checkMethod === 'AssetTag' && (
            <Form.Item
              name="assetTagInput"
              label="Nhập mã tài sản để kiểm tra"
              rules={[{ required: true, message: 'Vui lòng nhập mã tài sản!' }]}
            >
              <Input placeholder="Nhập mã tài sản" />
            </Form.Item>
          )}

          {currentInventory?.checkMethod === 'Manual' && (
            <>
              <Form.Item name="actualStatus" label="Trạng thái thực tế">
                <Select placeholder="Chọn trạng thái">
                  <Select.Option value="Đủ">Đủ</Select.Option>
                  <Select.Option value="Không tìm thấy">Không tìm thấy</Select.Option>
                  <Select.Option value="Sai vị trí">Sai vị trí</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="actualLocation" label="Vị trí thực tế">
                <Input placeholder="Nhập vị trí thực tế nếu khác" />
              </Form.Item>
            </>
          )}

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Nhập ghi chú nếu có" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsCheckModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Xác nhận</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default KiemKe;