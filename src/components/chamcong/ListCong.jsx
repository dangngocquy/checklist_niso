import React, { useState, useEffect } from 'react';
import {
  Form,
  Button,
  Select,
  Table,
  Space,
  Card,
  Row,
  Col,
  Tooltip,
  Divider,
  DatePicker,
  Tag,
  message,
  Spin,
  Avatar,
  Empty,
  Drawer,
  Popconfirm,
} from 'antd';
import { SearchOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/vi';
import debounce from 'lodash/debounce';
import useApi from '../../hook/useApi';
import Avatars from '../../config/design/Avatars';
import axios from 'axios';
import NotFoundPage from '../NotFoundPage';
import UserInfoCard from '../../hook/UserInfoCard';

dayjs.extend(isBetween);

const { Option } = Select;
const { RangePicker } = DatePicker;

const ListCong = ({ user, hastcvqclvPermission }) => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [congList, setCongList] = useState([]);
  const [filteredCongList, setFilteredCongList] = useState([]);
  const [nhanVienList, setNhanVienList] = useState([]);
  const [chinhanhList, setChinhanhList] = useState([]);
  const [searchNhanVienLoading, setSearchNhanVienLoading] = useState(false);
  const [searchChinhanhLoading, setSearchChinhanhLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 7,
    total: 0,
  });
  const { search, searchShop } = useApi();

  const debouncedSearchNhanVien = debounce((value) => {
    if (!value) {
      setNhanVienList([]);
      setSearchNhanVienLoading(false);
      return;
    }
    setSearchNhanVienLoading(true);
    search(value, { by: 'name,username' })
      .then((response) => {
        const filteredUsers = response.data.map((user) => ({
          id: user.keys,
          maNhanVien: user.code_staff,
          tenNhanVien: user.name,
          username: user.username,
          chinhanh: user.chinhanh,
          keys: user.keys,
          imgAvatar: user.imgAvatar,
        }));
        setNhanVienList(filteredUsers);
      })
      .catch(() => message.error('Không thể tải danh sách nhân viên'))
      .finally(() => setSearchNhanVienLoading(false));
  }, 500);

  const debouncedSearchChinhanh = debounce((value) => {
    if (!value) {
      setChinhanhList([]);
      setSearchChinhanhLoading(false);
      return;
    }
    setSearchChinhanhLoading(true);
    searchShop(value)
      .then((response) => {
        const filteredChinhanh = response.data.map((item) => ({
          id: item._id || item.restaurant,
          ten: item.restaurant,
        }));
        setChinhanhList(filteredChinhanh);
      })
      .catch(() => message.error('Không thể tải danh sách chi nhánh'))
      .finally(() => setSearchChinhanhLoading(false));
  }, 500);

  useEffect(() => {
    fetchTimekeepingData(pagination.current, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTimekeepingData = async (page, pageSize) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/all?page=${page}&limit=${pageSize}`, {
        headers: {
          'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
        },
      });
      const data = response.data.data.map(item => ({
        id: item._id,
        maNhanVien: item.maNhanVien,
        tenNhanVien: item.tenNhanVien || '',
        code_staff: item.code_staff || '',
        chinhanh: item.chinhanh || '',
        bophan: item.bophan || '',
        phongBan: item.phongBan,
        ngay: item.ngay,
        gioVao: item.gioVao,
        gioRa: item.gioRa,
        tongGio: item.tongGio,
        loaiCong: item.loaiCong,
        trangThai: item.trangThai || 'Chờ duyệt',
        ghiChu: item.ghiChu || '',
        imgAvatar: item.imgAvatar || '',
        IPNhaHang: item.IPNhaHang || '',
        IPGoc: item.IPGoc || '',
        location: item.location || '',
        GioCham: item.GioCham || '',
        GioOut: item.GioOut || '',
        CaLamViec: item.CaLamViec || '',
        LychoChamCong: item.LychoChamCong || '',
        Status: item.Status || '',
        ChamTre: item.ChamTre || '',
        Restaurants: item.Restaurants || '',
        username: item.username || '',
        imgBackground: item.imgBackground || '',
        locker: item.locker || '',
      }));
      setCongList(data);
      setFilteredCongList(data);
      setPagination({
        ...pagination,
        current: response.data.pagination.current,
        pageSize: response.data.pagination.pageSize,
        total: response.data.pagination.total,
      });
    } catch (error) {
      console.error('Error fetching timekeeping data:', error);
      message.error('Không thể tải danh sách chấm công');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    fetchTimekeepingData(newPagination.current, newPagination.pageSize);
  };

  const handleOpenDrawer = (record) => {
    setSelectedRecord(record);
    setDrawerVisible(true);
    editForm.setFieldsValue({
      trangThai: record.trangThai,
    });
  };

  const handleDrawerSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true);
      const response = await axios.put(`/api/timekeeping/approve/${selectedRecord.id}`, values, {
        headers: {
          'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
        },
      });
      const updatedRecord = response.data.data;
      const newCongList = congList.map(item =>
        item.id === selectedRecord.id ? { ...item, ...updatedRecord } : item
      );
      setCongList(newCongList);
      setFilteredCongList(newCongList);
      setDrawerVisible(false);
      message.success('Cập nhật chấm công thành công!');
    } catch (error) {
      console.error('Error updating timekeeping:', error);
      message.error('Không thể cập nhật chấm công');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`/api/timekeeping/${id}`, {
        headers: {
          'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
        },
      });
      const newCongList = congList.filter(item => item.id !== id);
      setCongList(newCongList);
      setFilteredCongList(newCongList);
      setPagination({ ...pagination, total: pagination.total - 1 });
      message.success('Xóa chấm công thành công!');
    } catch (error) {
      console.error('Error deleting timekeeping:', error);
      message.error(error.response?.data?.message || 'Không thể xóa chấm công');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Tên NV',
      dataIndex: 'maNhanVien',
      key: 'maNhanVien',
      render: (text, record) => {
        // Construct user object for UserInfoCard
        const userForCard = {
          name: record.tenNhanVien || 'Unknown User',
          username: record.username || 'N/A', // Not available in congList
          imgAvatar: record.imgAvatar || null,
          keys: record.maNhanVien || 'N/A',
          email: record.email, // Not available
          chucvu: record.chucvu, // Not available
          chinhanh: record.chinhanh || 'N/A',
          bophan: record.phongBan || record.bophan || 'N/A',
          locker: record.locker, // Default
          imgBackground: record.imgBackground, // Not available
          maNhanVien: record.code_staff || 'N/A', // Employee code
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
              <span
                className="avatar-container"
                style={{ display: 'inline-block', cursor: 'pointer' }}
              >
                {record.imgAvatar ? (
                  <Avatar
                    src={record.imgAvatar}
                    size="large"
                    style={{ pointerEvents: 'auto' }}
                  />
                ) : (
                  <span style={{ pointerEvents: 'auto' }}>
                    <Avatars
                      user={{ name: record.tenNhanVien || record.maNhanVien || 'Unknown' }}
                      sizeImg="large"
                    />
                  </span>
                )}
              </span>
            </Tooltip>
            <span>{record.tenNhanVien}</span>
          </Space>
        );
      },
    },
    {
      title: 'Mã NV',
      dataIndex: 'code_staff',
      key: 'code_staff',
      render: (text) => (text ? <Tag bordered={false} color="cyan">{text}</Tag> : <Tag bordered={false} color="cyan">Khách truy cập</Tag>),
    },
    {
      title: 'Nhà hàng',
      dataIndex: 'chinhanh',
      key: 'chinhanh',
      render: (text) => text ? text.toUpperCase() : <Tag color="red" bordered={false}>Trống</Tag>,
    },
    {
      title: 'Ngày',
      dataIndex: 'ngay',
      key: 'ngay',
      render: (text) => (text && dayjs(text, 'DD-MM-YYYY').isValid() ? dayjs(text, 'DD-MM-YYYY').format('DD/MM/YYYY') : 'N/A'),
    },
    { title: 'Giờ vào', dataIndex: 'gioVao', key: 'gioVao' },
    { title: 'Giờ ra', dataIndex: 'gioRa', key: 'gioRa' },
    { title: 'Tổng giờ', dataIndex: 'tongGio', key: 'tongGio' },
    { title: 'Loại công', dataIndex: 'loaiCong', key: 'loaiCong' },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      width: 120,
      render: (trangThai) => {
        let color = 'default';
        if (trangThai === 'Chờ duyệt') color = 'warning';
        if (trangThai === 'Đã duyệt') color = 'success';
        if (trangThai === 'Từ chối') color = 'error';
        return <Tag color={color} bordered={false}>{trangThai}</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="Bạn có chắc chắn muốn xóa bản ghi này?"
          onConfirm={() => handleDelete(record.id)}
          okText="Có"
          cancelText="Không"
        >
          <Button type="primary" danger icon={<DeleteOutlined />}>
            Xóa
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const viewColumns = [
    { title: 'IP chấm công', dataIndex: 'IPNhaHang', key: 'IPNhaHang', render: (IPNhaHang) => IPNhaHang ? IPNhaHang : <Tag color="red" bordered={false}>Chưa chấm công</Tag> },
    { title: 'IP Nhà hàng', dataIndex: 'IPGoc', key: 'IPGoc', render: (IPGoc) => IPGoc ? IPGoc : <Tag color="red" bordered={false}>Trống</Tag> },
    { title: 'Nhà hàng', dataIndex: 'Restaurants', key: 'Restaurants', render: (Restaurants) => Restaurants ? Restaurants : <Tag color="red" bordered={false}>Chưa chấm công</Tag> },
    { title: 'Vị trí', dataIndex: 'location', key: 'location', render: (location) => location ? location : <Tag color="red" bordered={false}>Chưa chấm công</Tag> },
    {
      title: 'Giờ chấm',
      dataIndex: 'GioCham',
      key: 'GioCham',
      render: (GioCham) => GioCham ? GioCham : <Tag color="yellow" bordered={false}>Chưa chấm vào</Tag>
    },
    {
      title: 'Giờ ra',
      dataIndex: 'GioOut',
      key: 'GioOut',
      render: (GioOut, record) => {
        if (GioOut) {
          return GioOut; // Nếu đã có giờ ra thì hiển thị bình thường
        }
        if (record.Status === 'checkin' && record.gioRa) {
          const gioRaTime = dayjs(`${record.ngay} ${record.gioRa}`, 'DD-MM-YYYY HH:mm');
          const currentTime = dayjs();
          if (currentTime.isAfter(gioRaTime)) {
            return <Tag color="red" bordered={false}>Quên chấm ra</Tag>;
          }
        }
        return <Tag color="yellow" bordered={false}>Chưa chấm ra</Tag>;
      }
    },
    {
      title: 'Trễ',
      dataIndex: 'ChamTre',
      key: 'ChamTre',
      render: (ChamTre) => ChamTre ? <Tag color="yellow" bordered={false}>{ChamTre}</Tag> : <Tag color="green" bordered={false}>Bình thường</Tag>
    },
    {
      title: 'Ca làm việc',
      dataIndex: 'CaLamViec',
      key: 'CaLamViec',
      render: (CaLamViec) => CaLamViec ? CaLamViec : <Tag color="red" bordered={false}>Chưa chấm công</Tag>
    },
    {
      title: 'Lý do chấm công ngoài IP',
      dataIndex: 'LychoChamCong',
      key: 'LychoChamCong',
      render: (LychoChamCong) => LychoChamCong ? LychoChamCong : <Tag color="red" bordered={false}>Trống</Tag>
    },
    { title: 'Ghi chú', dataIndex: 'ghiChu', key: 'GhiChu', render: (ghiChu) => ghiChu ? ghiChu : <Tag color="red" bordered={false}>Không có ghi chú</Tag> },
    {
      title: 'Trạng thái',
      dataIndex: 'Status',
      key: 'Status',
      render: (status) => {
        if (status === 'checkin') return <Tag color="yellow" bordered={false}>Đã chấm công</Tag>;
        if (status === 'checkout') return <Tag color="green" bordered={false}>Đã chấm ra</Tag>;
        return <Tag color="red" bordered={false}>Chưa chấm công</Tag>;
      }
    },
  ];

  const handleSearch = (values) => {
    setLoading(true);
    let filtered = [...congList];

    if (values.dateRange && values.dateRange.length === 2) {
      const [start, end] = values.dateRange;
      filtered = filtered.filter(item =>
        dayjs(item.ngay, 'DD-MM-YYYY').isBetween(start, end, 'day', '[]')
      );
    }

    if (values.nhanVien) {
      const selectedNhanVien = nhanVienList.find(nv => nv.keys === values.nhanVien);
      if (selectedNhanVien) {
        filtered = filtered.filter(item => item.maNhanVien === selectedNhanVien.keys);
      }
    }

    if (values.chinhanh) {
      const selectedChinhanh = chinhanhList.find(cn => cn.id === values.chinhanh);
      if (selectedChinhanh) {
        filtered = filtered.filter(item => item.Restaurants === selectedChinhanh.ten);
      }
    }

    if (values.trangThai) {
      filtered = filtered.filter(item => item.trangThai === values.trangThai);
    }

    setFilteredCongList(filtered);
    setLoading(false);
  };

  const totalHours = filteredCongList.reduce((sum, record) => {
    if (record.trangThai === 'Đã duyệt') {
      const hours = parseFloat(record.tongGio) || 0;
      return sum + hours;
    }
    return sum;
  }, 0);

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '50px 0', textAlign: 'center' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );
  }

  if (!hastcvqclvPermission) {
    return <NotFoundPage />;
  }

  return (
    <Card>
      <title>NISO | Danh sách công</title>
      <Form layout="vertical" form={form} onFinish={handleSearch}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="dateRange" label="Khoảng thời gian">
              <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="nhanVien" label="Nhân viên">
              <Select
                showSearch
                placeholder="Tìm kiếm nhân viên"
                onSearch={debouncedSearchNhanVien}
                filterOption={false}
                notFoundContent={
                  searchNhanVienLoading ? (
                    <Space>
                      <Spin size="small" />
                      Loading...
                    </Space>
                  ) : (
                    'Nhập để tìm kiếm nhân viên'
                  )
                }
                allowClear
                dropdownStyle={{ zIndex: 1001 }} // Ensure dropdown is above other elements
              >
                {nhanVienList.map((nv) => {
                  // Construct user object for UserInfoCard
                  const userForCard = {
                    name: nv.tenNhanVien || 'Unknown User',
                    username: nv.username || 'N/A',
                    imgAvatar: nv.imgAvatar || null,
                    keys: nv.keys || 'N/A',
                    email: nv.email || 'N/A',
                    chucvu: nv.chucvu || 'N/A',
                    chinhanh: nv.chinhanh || 'N/A',
                    bophan: nv.bophan || 'N/A',
                    locker: nv.locker || false,
                    imgBackground: nv.imgBackground || null,
                    maNhanVien: nv.maNhanVien || 'N/A', // Employee code
                  };

                  return (
                    <Option key={nv.keys} value={nv.keys}>
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
                            {nv.imgAvatar ? (
                              <Avatar
                                src={nv.imgAvatar}
                                size="small"
                                style={{ marginRight: 8, pointerEvents: 'auto' }}
                              />
                            ) : (
                              <span style={{ marginRight: 8, pointerEvents: 'auto' }}>
                                <Avatars
                                  user={{ name: nv.tenNhanVien || nv.username || 'Unknown' }}
                                  sizeImg="small"
                                />
                              </span>
                            )}
                          </span>
                        </Tooltip>
                        <span>
                          {nv.maNhanVien
                            ? `NV${nv.maNhanVien} - ${nv.tenNhanVien}`
                            : nv.tenNhanVien}
                        </span>
                      </Space>
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="trangThai" label="Trạng thái">
              <Select allowClear placeholder="Chọn trạng thái">
                <Option value="Chờ duyệt">Chờ duyệt</Option>
                <Option value="Đã duyệt">Đã duyệt</Option>
                <Option value="Từ chối">Từ chối</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="chinhanh" label="Chi nhánh">
              <Select
                showSearch
                placeholder="Tìm kiếm chi nhánh"
                onSearch={debouncedSearchChinhanh}
                filterOption={false}
                notFoundContent={searchChinhanhLoading ? <Space><Spin size="small" /> Loading...</Space> : null}
                allowClear
              >
                {chinhanhList.map(cn => (
                  <Option key={cn.id} value={cn.id}>{cn.ten}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
          Tìm kiếm
        </Button>
      </Form>

      <Divider />

      <Table
        columns={columns}
        dataSource={filteredCongList}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          pageSizeOptions: ['5', '10', '20', '50', '100'],
          showSizeChanger: true,
          onChange: (page, pageSize) => handleTableChange({ current: page, pageSize }),
          onShowSizeChange: (current, size) => handleTableChange({ current: 1, pageSize: size }),
        }}
        scroll={{ x: true }}
        style={{ width: "100%", whiteSpace: "nowrap" }}
        locale={{ emptyText: <Empty description="Lịch sử công trống." /> }}
        onRow={(record) => ({
          onClick: (e) => {
            if (e.target.closest('.ant-btn')) return;
            handleOpenDrawer(record);
          },
        })}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={6}>Công thực tế (Đã duyệt)</Table.Summary.Cell>
            <Table.Summary.Cell index={6}>{totalHours.toFixed(2)}</Table.Summary.Cell>
            <Table.Summary.Cell index={7} colSpan={4} />
          </Table.Summary.Row>
        )}
      />

      <Drawer
        title={selectedRecord ? `${selectedRecord.tenNhanVien}` : 'Chi tiết chấm công'}
        width="100%"
        height={500}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        placement="bottom"
        bodyStyle={{ paddingBottom: 80 }}
        extra={
          <Space>
            <Button onClick={handleDrawerSubmit} type="primary" loading={loading}>
              Cập nhật
            </Button>
          </Space>
        }
      >
        {selectedRecord && (
          <>
            <Table
              columns={viewColumns}
              dataSource={[selectedRecord]}
              rowKey="id"
              pagination={false}
              scroll={{ x: true }}
              style={{ width: "100%", whiteSpace: "nowrap" }}
            />
            <Divider />
            <Form form={editForm} layout="vertical" style={{ marginTop: 20 }}>
              <Form.Item
                name="trangThai"
                label="Trạng thái"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select placeholder="Chọn trạng thái">
                  <Option value="Chờ duyệt">Chờ duyệt</Option>
                  <Option value="Đã duyệt">Đã duyệt</Option>
                  <Option value="Từ chối">Từ chối</Option>
                </Select>
              </Form.Item>
            </Form>
          </>
        )}
      </Drawer>
    </Card>
  );
};

const styleSheet = document.createElement('style');
document.head.appendChild(styleSheet);

export default React.memo(ListCong);