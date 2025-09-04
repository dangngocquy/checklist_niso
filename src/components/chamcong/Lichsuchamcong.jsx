import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, DatePicker, message, Space, Typography, Card, Row, Col, Empty, Tag, notification, Spin } from 'antd';
import { DownloadOutlined, ReloadOutlined, FilterOutlined, LoadingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import 'dayjs/locale/vi'; // Optional: Vietnamese locale
import axios from 'axios';
import NotFoundPage from '../NotFoundPage';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const LichSuChamCong = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs()]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(7);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasCCPermission, setHasCCPermission] = useState(null); // Thêm state để lưu quyền từ backend

  const fetchAttendanceHistory = useCallback(async (pageNum = 1, size = pageSize) => {
    try {
      setLoading(true);
      const startDate = dateRange[0].format('DD-MM-YYYY');
      const endDate = dateRange[1].format('DD-MM-YYYY');

      const response = await axios.get('/api/user-timekeeping-history', {
        params: {
          maNhanVien: user.keys,
          startDate,
          endDate,
          page: pageNum,
          pageSize: size,
        },
        headers: {
          'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
        },
      });

      const { data, pagination, hasCCPermission: permission } = response.data;

      if (response.status === 403) {
        setHasCCPermission(false);
        setLoading(false);
        return;
      }

      setHasCCPermission(permission); // Cập nhật quyền từ backend

      const formattedData = data.map(record => ({
        id: record._id.toString(),
        employeeName: record.tenNhanVien || 'Không xác định',
        chucvu: record.chucvu || 'Không xác định',
        chinhanh: record.chinhanh || 'Không xác định',
        date: record.ngay,
        checkIn: record.gioVao || 'Chưa có',
        checkOut: record.gioRa || 'Chưa có',
        totalHours: record.tongGio || '0',
        Status: record.Status,
        trangThai: record.trangThai,
        notes: record.ghiChu || '',
        department: record.phongBan || record.bophan || 'Không xác định',
      }));

      setFilteredData(prev => pageNum === 1 ? formattedData : [...prev, ...formattedData]);
      setTotalRecords(pagination.total);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attendance data:', error.response?.status);
      if (error.response?.status === 403) {
        setHasCCPermission(false);
      } else {
        message.error('Không thể tải dữ liệu chấm công');
      }
      setLoading(false);
    }
  }, [dateRange, user.keys, pageSize]);

  useEffect(() => {
    fetchAttendanceHistory(1);
  }, [dateRange, fetchAttendanceHistory]);

  const handleDateRangeChange = (dates) => {
    setDateRange(dates || [dayjs().startOf('month'), dayjs()]);
    setPage(1);
  };

  const handlePageChange = (pageNum, newPageSize) => {
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setPage(1);
      fetchAttendanceHistory(1, newPageSize);
    } else {
      setPage(pageNum);
      fetchAttendanceHistory(pageNum);
    }
  };

  const handleExportData = () => {
    if (filteredData.length === 0) {
      notification.warning({
        message: 'Không có dữ liệu',
        description: 'Không có dữ liệu chấm công để xuất Excel. Vui lòng kiểm tra lại khoảng thời gian hoặc tải dữ liệu trước.',
        placement: 'topRight',
      });
      return;
    }
    const exportData = filteredData.map(record => ({
      'Tên nhân viên': record.employeeName,
      'Ngày': record.date,
      'Giờ vào': record.checkIn,
      'Giờ ra': record.checkOut,
      'Tổng giờ': record.totalHours,
      'Bộ phận': record.department,
      'Trạng thái': record.Status || 'Chưa chấm công',
      'Tình trạng': record.trangThai || 'Chờ duyệt',
      'Ghi chú': record.notes,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch sử chấm công');
    XLSX.writeFile(workbook, `LichSuChamCong_${dayjs().format('DD-MM-YYYY')}.xlsx`);
    message.success('Đã xuất dữ liệu chấm công thành công');
  };

  const columns = [
    {
      title: 'Chức vụ',
      dataIndex: 'chucvu',
      key: 'chucvu',
      render: (text) => text ? text : <Tag color="red" bordered={false}>Trống</Tag>,
    },
    {
      title: 'Chi nhánh',
      dataIndex: 'chinhanh',
      key: 'chinhanh',
      render: (text) => text ? text : <Tag color="red" bordered={false}>Trống</Tag>,
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (text) => dayjs(text, 'DD-MM-YYYY').format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.date, 'DD-MM-YYYY').unix() - dayjs(b.date, 'DD-MM-YYYY').unix(),
    },
    {
      title: 'Giờ vào',
      dataIndex: 'checkIn',
      key: 'checkIn',
    },
    {
      title: 'Giờ ra',
      dataIndex: 'checkOut',
      key: 'checkOut',
    },
    {
      title: 'Tổng giờ',
      dataIndex: 'totalHours',
      key: 'totalHours',
      render: (text) => `${text} giờ`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'Status',
      key: 'status',
      render: (Status) => {
        let color = 'red';
        let text = 'Chưa chấm công';

        if (Status && Status.toLowerCase() === 'checkin') {
          color = 'green';
          text = 'Đã chấm vào';
        } else if (Status && Status.toLowerCase() === 'checkout') {
          color = 'green';
          text = 'Đã chấm ra';
        }

        return <Tag color={color} bordered={false}>{text}</Tag>;
      },
    },
    {
      title: 'Tình trạng',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (trangThai) => {
        let color = 'yellow';
        let text = trangThai || 'Chờ duyệt';

        if (trangThai === 'Đã duyệt') {
          color = 'green';
        } else if (trangThai === 'Từ chối') {
          color = 'red';
        }

        return <Tag color={color} bordered={false}>{text}</Tag>;
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      render: (text) => text ? text : <Tag color="red" bordered={false}>Trống</Tag>,
    },
  ];

  if (hasCCPermission === false) {
    return <NotFoundPage />;
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '50px 0', textAlign: 'center' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );
  }

  return (
    <div style={{ padding: 8 }}>
      <title>NISO | Lịch sử ca làm việc</title>
      <Card>
        <Title level={3}>Lịch Sử Chấm Công</Title>

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={8}>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                allowClear={false}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Space>
                <Button
                  type="primary"
                  icon={<FilterOutlined />}
                  onClick={() => fetchAttendanceHistory(1)}
                >
                  Lọc
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchAttendanceHistory(1)}
                >
                  Làm mới
                </Button>
              </Space>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={filteredData}
            title={() =>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExportData}
              >
                Export Excel
              </Button>
            }
            rowKey="id"
            pagination={{
              current: page,
              pageSize: pageSize,
              total: totalRecords,
              pageSizeOptions: ["5", "10", "20", "50", "100"],
              showSizeChanger: true,
              onChange: handlePageChange,
              onShowSizeChange: handlePageChange,
            }}
            locale={{ emptyText: <Empty description="Lịch sử trống." /> }}
            bordered
            loading={loading}
            scroll={{ x: true }}
            style={{ width: "100%", whiteSpace: "nowrap" }}
            summary={(pageData) => {
              let totalHours = 0;
              pageData.forEach((record) => {
                if (record.trangThai === 'Đã duyệt') {
                  totalHours += parseFloat(record.totalHours || 0);
                }
              });
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>Công thực tế</Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <strong>{totalHours.toFixed(2)} giờ</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} colSpan={5}></Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </Space>
      </Card>
    </div>
  );
};

export default LichSuChamCong;