import React, { useState } from 'react';
import {
  Form,
  Button,
  Select,
  DatePicker,
  InputNumber,
  TimePicker,
  Card,
  Row,
  Col,
  Typography,
  Input,
  message,
  Space,
  Spin,
  Avatar,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import debounce from 'lodash/debounce';
import useApi from '../../hook/useApi'; // Giả định bạn có hook này
import Avatars from '../../config/design/Avatars';
import axios from 'axios';
import NotFoundPage from '../NotFoundPage';
import UserInfoCard from '../../hook/UserInfoCard';
import { LoadingOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Debounced search functions
const debouncedSearchNhanVien = debounce((value, search, setNhanVienList, setSearchNhanVienLoading, hastcvqclvPermission) => {
  if (!value) {
    setNhanVienList([]);
    setSearchNhanVienLoading(false);
    return;
  }
  setSearchNhanVienLoading(true);
  search(value)
    .then((response) => {
      const filteredUsers = response.data.map((user) => ({
        id: user.keys,
        maNhanVien: user.code_staff,
        tenNhanVien: user.name,
        username: user.username,
        phongBan: user.bophan,
        chucVu: user.chucvu,
        imgAvatar: user.imgAvatar,
      }));
      setNhanVienList(filteredUsers);
    })
    .catch(() => message.error('Không thể tải danh sách nhân viên'))
    .finally(() => setSearchNhanVienLoading(false));
}, 500);

const TaoCong = ({ hastcvqclvPermission }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [nhanVienList, setNhanVienList] = useState([]);
  const [searchNhanVienLoading, setSearchNhanVienLoading] = useState(false);
  const { search } = useApi();
  const [tenCongKhac, setTenCongKhac] = useState('');

  const handleSearchNhanVien = (value) => {
    debouncedSearchNhanVien(value, search, setNhanVienList, setSearchNhanVienLoading);
  };

  const handleNhanVienChange = (value) => {
    const selectedNhanVien = nhanVienList.find((nv) => nv.id === value);
    if (selectedNhanVien) {
      form.setFieldsValue({
        phongBan: selectedNhanVien.phongBan || '',
        chucVu: selectedNhanVien.chucVu || '',
      });
    }
  };

  const calculateTotalHours = () => {
    const gioVao = form.getFieldValue('gioVao');
    const gioRa = form.getFieldValue('gioRa');
    if (gioVao && gioRa) {
      const start = dayjs(gioVao);
      const end = dayjs(gioRa);
      const diff = end.isBefore(start) ? end.add(1, 'day').diff(start, 'hour', true) : end.diff(start, 'hour', true);
      form.setFieldsValue({ tongGio: Number(diff.toFixed(1)) > 0 ? Number(diff.toFixed(1)) : 0 });
    } else {
      form.setFieldsValue({ tongGio: 0 });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      const selectedNhanVien = nhanVienList.find((nv) => nv.id === values.nhanVien);

      const newCong = {
        maNhanVien: values.nhanVien,
        phongBan: selectedNhanVien?.phongBan || '',
        chucVu: selectedNhanVien?.chucVu || '',
        ngay: values.ngay.format('DD-MM-YYYY'),
        gioVao: values.gioVao.format('HH:mm'),
        gioRa: values.gioRa.format('HH:mm'),
        tongGio: values.tongGio.toString(),
        loaiCong: values.loaiCong === 'Công khác' ? tenCongKhac : values.loaiCong,
        ghiChu: values.ghiChu || '',
        ngayTao: values.ngay.format('DD-MM-YYYY'),
      };

      await axios.post('/api/timekeeping/create', newCong, {
        headers: {
          'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
        },
      });

      message.success('Tạo công thành công!');
      form.resetFields();
      setTenCongKhac('');
    } catch (error) {
      if (error.errorFields) {
        message.error('Vui lòng điền đầy đủ thông tin!');
      } else {
        console.error('Error:', error);
        message.error(error.response?.data?.message || 'Không thể tạo công, vui lòng thử lại!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoaiCongChange = (value) => {
    if (value === 'Công khác') {
      setTenCongKhac('');
    }
  };

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
    <>
      <title>NISO | TẠO CÔNG</title>
      <Card>
        <Title level={4}>Tạo công mới</Title>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ ngay: dayjs(), loaiCong: 'Công bình thường' }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={24} md={24}>
              <Form.Item
                name="nhanVien"
                label="Nhân viên"
                rules={[{ required: true, message: 'Vui lòng chọn nhân viên!' }]}
              >
                <Select
                  showSearch
                  placeholder="Tìm kiếm nhân viên"
                  onSearch={handleSearchNhanVien}
                  onChange={handleNhanVienChange}
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
                  dropdownStyle={{ zIndex: 1001 }} // Ensure dropdown is above other elements
                >
                  {nhanVienList.map((nv) => {
                    // Construct user object for UserInfoCard
                    const userForCard = {
                      name: nv.tenNhanVien || 'Unknown User',
                      username: nv.username || 'N/A',
                      imgAvatar: nv.imgAvatar || null,
                      keys: nv.id || 'N/A', // Use id (user.keys) as keys
                      email: null, // Not available in nhanVienList
                      chucvu: nv.chucVu || null,
                      chinhanh: 'N/A', // Not available
                      bophan: nv.phongBan || 'N/A',
                      locker: false, // Default, not available
                      imgBackground: null, // Not available
                      maNhanVien: nv.maNhanVien || 'N/A', // Additional field for employee code
                    };

                    return (
                      <Option key={nv.id} value={nv.id}>
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
              <Form.Item
                name="ngay"
                label="Ngày"
                rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="gioVao"
                label="Giờ vào"
                rules={[{ required: true, message: 'Vui lòng nhập giờ vào!' }]}
              >
                <TimePicker
                  format="HH:mm"
                  style={{ width: '100%' }}
                  onChange={(value) => {
                    form.setFieldsValue({ gioVao: value });
                    calculateTotalHours();
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="gioRa"
                label="Giờ ra"
                rules={[{ required: true, message: 'Vui lòng nhập giờ ra!' }]}
              >
                <TimePicker
                  format="HH:mm"
                  style={{ width: '100%' }}
                  onChange={(value) => {
                    form.setFieldsValue({ gioRa: value });
                    calculateTotalHours();
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="tongGio"
                label="Tổng giờ"
                rules={[{ required: true, message: 'Vui lòng nhập tổng giờ công!' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} max={24} step={0.1} placeholder="Tổng giờ công" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="loaiCong"
                label="Loại công"
                rules={[{ required: true, message: 'Vui lòng chọn loại công!' }]}
              >
                <Select placeholder="Chọn loại công" onChange={handleLoaiCongChange}>
                  <Option value="Công bình thường">Công bình thường</Option>
                  <Option value="Công nửa ngày">Công nửa ngày</Option>
                  <Option value="Công làm thêm">Công làm thêm</Option>
                  <Option value="Công nghỉ phép">Công nghỉ phép</Option>
                  <Option value="Công nghỉ lễ">Công nghỉ lễ</Option>
                  <Option value="Công khác">Công khác</Option>
                </Select>
              </Form.Item>
            </Col>
            {form.getFieldValue('loaiCong') === 'Công khác' && (
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="tenCongKhac"
                  label="Tên công khác"
                  rules={[{ required: true, message: 'Vui lòng nhập tên công khác!' }]}
                >
                  <Input
                    value={tenCongKhac}
                    onChange={(e) => setTenCongKhac(e.target.value)}
                    placeholder="Nhập tên công khác"
                  />
                </Form.Item>
              </Col>
            )}
            <Col span={24}>
              <Form.Item name="ghiChu" label="Ghi chú">
                <TextArea rows={4} placeholder="Nhập ghi chú (nếu có)" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item>
                <Button type="primary" onClick={handleSubmit} loading={loading}>
                  Tạo công
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </>
  );
};

export default React.memo(TaoCong);