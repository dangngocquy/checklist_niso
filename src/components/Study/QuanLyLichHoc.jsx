import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  Select,
  message,
  Popconfirm,
  Typography,
  Space
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/vi';
import locale from 'antd/es/date-picker/locale/vi_VN';

const { Header, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const QuanLyLichHoc = ({ user, t }) => {
  const [lichHoc, setLichHoc] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [giangViens, setGiangViens] = useState([]);

  // Fetch danh sách lịch học
  const fetchLichHoc = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://checklist.niso.com.vn:3003/api/lichhoc');
      setLichHoc(response.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách lịch học');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch danh sách giảng viên
  const fetchGiangViens = async () => {
    try {
      const response = await axios.get('https://checklist.niso.com.vn:3003/users/all');
      setGiangViens(response.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách giảng viên');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchLichHoc();
    fetchGiangViens();
  }, []);

  const showModal = (record = null) => {
    setEditingRecord(record);
    if (record) {
      form.setFieldsValue({
        ...record,
        ngay_hoc: moment(record.ngay_hoc),
        gio_bat_dau: moment(record.gio_bat_dau, 'HH:mm'),
        gio_ket_thuc: moment(record.gio_ket_thuc, 'HH:mm'),
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingRecord(null);
  };

  const handleSubmit = async (values) => {
    try {
      const formattedValues = {
        ...values,
        ngay_hoc: values.ngay_hoc.format('YYYY-MM-DD'),
        gio_bat_dau: values.gio_bat_dau.format('HH:mm'),
        gio_ket_thuc: values.gio_ket_thuc.format('HH:mm'),
      };

      if (editingRecord) {
        await axios.put(`https://checklist.niso.com.vn:3003/api/lichhoc/${editingRecord.id}`, formattedValues);
        message.success('Cập nhật lịch học thành công');
      } else {
        await axios.post('https://checklist.niso.com.vn:3003/api/lichhoc', formattedValues);
        message.success('Thêm lịch học thành công');
      }

      handleCancel();
      fetchLichHoc();
    } catch (error) {
      message.error('Có lỗi xảy ra');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://checklist.niso.com.vn:3003/api/lichhoc/${id}`);
      message.success('Xóa lịch học thành công');
      fetchLichHoc();
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'tieu_de',
      key: 'tieu_de',
    },
    {
      title: 'Ngày học',
      dataIndex: 'ngay_hoc',
      key: 'ngay_hoc',
      render: (text) => moment(text).format('DD/MM/YYYY'),
    },
    {
      title: 'Thời gian',
      key: 'thoi_gian',
      render: (_, record) => `${record.gio_bat_dau} - ${record.gio_ket_thuc}`,
    },
    {
      title: 'Phòng học',
      dataIndex: 'phong_hoc',
      key: 'phong_hoc',
    },
    {
      title: 'Giảng viên',
      dataIndex: 'giang_vien_name',
      key: 'giang_vien_name',
    },
    {
      title: 'Số lượng tối đa',
      dataIndex: 'so_luong_toi_da',
      key: 'so_luong_toi_da',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f7f8fa' }}>
      <title>NISO | Quản lý lịch học</title>
      <Header style={{
        background: 'linear-gradient(135deg, #ae8f3d, #ae8f3d)',
        padding: '0 16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Title level={3} style={{ margin: '0', color: 'white' }}>
            Quản lý lịch học
          </Title>
        </div>
      </Header>

      <Content style={{ padding: '24px' }}>
        <Card
          title={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              Thêm lịch học
            </Button>
          }
          bordered={false}
          style={{
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          <Table
            columns={columns}
            dataSource={lichHoc}
            rowKey="id"
            loading={loading}
          />
        </Card>

        <Modal
          title={editingRecord ? 'Sửa lịch học' : 'Thêm lịch học mới'}
          open={modalVisible}
          onCancel={handleCancel}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="tieu_de"
              label="Tiêu đề"
              rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
            >
              <Input placeholder="Nhập tiêu đề lịch học" />
            </Form.Item>

            <Form.Item
              name="mo_ta"
              label="Mô tả"
            >
              <Input.TextArea rows={4} placeholder="Nhập mô tả chi tiết" />
            </Form.Item>

            <Form.Item
              name="ngay_hoc"
              label="Ngày học"
              rules={[{ required: true, message: 'Vui lòng chọn ngày học' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                locale={locale}
              />
            </Form.Item>

            <Form.Item
              name="gio_bat_dau"
              label="Giờ bắt đầu"
              rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu' }]}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="gio_ket_thuc"
              label="Giờ kết thúc"
              rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc' }]}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="phong_hoc"
              label="Phòng học"
              rules={[{ required: true, message: 'Vui lòng nhập phòng học' }]}
            >
              <Input placeholder="Nhập phòng học" />
            </Form.Item>

            <Form.Item
              name="giang_vien_id"
              label="Giảng viên"
              rules={[{ required: true, message: 'Vui lòng chọn giảng viên' }]}
            >
              <Select
                placeholder="Chọn giảng viên"
                showSearch
                optionFilterProp="children"
              >
                {giangViens.map(gv => (
                  <Option key={gv.keys} value={gv.keys}>{gv.hoten}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="so_luong_toi_da"
              label="Số lượng học viên tối đa"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng tối đa' }]}
            >
              <Input type="number" min={1} placeholder="Nhập số lượng tối đa" />
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={handleCancel}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingRecord ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default QuanLyLichHoc; 