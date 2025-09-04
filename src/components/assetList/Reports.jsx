import React, { useState } from 'react';
import {
    Typography,
    Card,
    Tabs,
    Button,
    DatePicker,
    Select,
    Form,
    Space,
    Table,
    Spin,
    Divider,
    message,
    App,
} from 'antd';
import {
    BarChartOutlined,
    LineChartOutlined,
    PieChartOutlined,
    TableOutlined,
    DownloadOutlined,
    FileExcelOutlined,
    FilePdfOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import NotFoundPage from '../NotFoundPage';

const { Title } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

const DATE_FORMAT = 'DD-MM-YYYY';

const Reports = ({user, hasquanlyTSPermission, hastKiemKePermission, hastXoaTSPermission}) => {
    const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs()]);
    const [reportType, setReportType] = useState('inventory');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [form] = Form.useForm();

    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const startDate = dateRange[0] ? dateRange[0].format(DATE_FORMAT) : '';
            const endDate = dateRange[1] ? dateRange[1].format(DATE_FORMAT) : '';
            console.log('Fetching with:', { reportType, startDate, endDate });

            const url = `/api/reports?type=${reportType}&startDate=${startDate}&endDate=${endDate}`;
            const response = await axios.get(url, axiosConfig);

            console.log('Response:', response.data);
            if (!response.data.success) {
                throw new Error(response.data.message || 'Backend error');
            }

            setReportData(response.data.data);
            if (response.data.data.length === 0) {
                message.info('Không có dữ liệu trong khoảng thời gian này.');
            } else {
                message.success('Báo cáo đã được tạo thành công!');
            }
        } catch (error) {
            console.error('Error fetching report:', error.message, error.response?.data);
            if (error.message.includes('Network Error')) {
                message.error('Lỗi! Không thể dùng ngay lúc này.');
            } else {
                message.error(`Lỗi khi lấy dữ liệu báo cáo: ${error.message}`);
            }
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = (format) => {
        if (!reportData.length) {
            message.warning('Không có dữ liệu để xuất!');
            return;
        }

        const exportData = reportData.map(item => {
            if (reportType === 'inventory') {
                return {
                    'Mã tài sản': item.assetTag || 'N/A',
                    'Tên tài sản': item.name || 'N/A',
                    'Danh mục': item.category || 'N/A',
                    'Trạng thái': item.status || 'N/A',
                    'Vị trí': item.location || 'N/A',
                    'Người dùng': item.assignedTo || 'Chưa phân công',
                    'Ngày tạo': item.createdAt || 'N/A',
                    'Giá trị': item.price ? `${item.price.toLocaleString('vi-VN')} VND` : 'N/A',
                };
            } else if (reportType === 'warranty') {
                return {
                    'Mã tài sản': item.assetTag || 'N/A',
                    'Tên tài sản': item.assetName || 'N/A',
                    'Nhà cung cấp': item.warrantyProvider || 'N/A',
                    'Số SN': item.warrantyNumber || 'N/A',
                    'Ngày bắt đầu': item.startDate || 'N/A',
                    'Ngày kết thúc': item.endDate || 'N/A',
                    'Trạng thái': item.status || 'N/A',
                };
            } else if (reportType === 'retired') {
                return {
                    'Mã tài sản': item.assetTag || 'N/A',
                    'Tên tài sản': item.name || 'N/A',
                    'Danh mục': item.category || 'N/A',
                    'Số SN': item.serialNumber || 'N/A',
                    'Ngày thanh lý': item.retiredDate || 'N/A',
                    'Lý do': item.reason || 'N/A',
                    'Giá trị thanh lý': item.retirementValue ? `${item.retirementValue.toLocaleString('vi-VN')} VND` : 'N/A',
                    'Trạng thái': item.status || 'N/A',
                };
            }
            return item;
        });

        if (format === 'excel') {
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Report');
            XLSX.writeFile(wb, `${reportType}_report_${dayjs().format('YYYYMMDD')}.xlsx`);
        } else if (format === 'pdf') {
            const doc = new jsPDF();
            doc.text(`Báo cáo ${reportType === 'inventory' ? 'Kê khai tài sản' : reportType === 'warranty' ? 'Bảo hành' : 'Thanh lý'}`, 10, 10);
            doc.autoTable({
                head: [Object.keys(exportData[0])],
                body: exportData.map(row => Object.values(row)),
                startY: 20,
            });
            doc.save(`${reportType}_report_${dayjs().format('YYYYMMDD')}.pdf`);
        } else if (format === 'csv') {
            const csvContent = [
                Object.keys(exportData[0]).join(','),
                ...exportData.map(row => Object.values(row).map(val => `"${val}"`).join(',')),
            ].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${reportType}_report_${dayjs().format('YYYYMMDD')}.csv`;
            link.click();
        }

        message.success(`Đã tải xuống báo cáo dạng ${format.toUpperCase()}!`);
    };

    const columns = {
        inventory: [
            { title: 'Mã tài sản', dataIndex: 'assetTag', key: 'assetTag', render: text => text || 'N/A' },
            { title: 'Tên tài sản', dataIndex: 'name', key: 'name', render: text => text || 'N/A' },
            { title: 'Danh mục', dataIndex: 'category', key: 'category', render: text => text || 'N/A' },
            { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: text => text || 'N/A' },
            { title: 'Vị trí', dataIndex: 'location', key: 'location', render: text => text || 'N/A' },
            { title: 'Người dùng', dataIndex: 'assignedTo', key: 'assignedTo', render: text => text || 'Chưa phân công' },
            { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: text => text || 'N/A' },
            { title: 'Giá trị', dataIndex: 'price', key: 'price', render: price => price ? `${price.toLocaleString('vi-VN')} VND` : 'N/A' },
        ],
        warranty: [
            { title: 'Mã tài sản', dataIndex: 'assetTag', key: 'assetTag', render: text => text || 'N/A' },
            { title: 'Tên tài sản', dataIndex: 'assetName', key: 'assetName', render: text => text || 'N/A' },
            { title: 'Nhà cung cấp', dataIndex: 'warrantyProvider', key: 'warrantyProvider', render: text => text || 'N/A' },
            { title: 'Số SN', dataIndex: 'warrantyNumber', key: 'warrantyNumber', render: text => text || 'N/A' },
            { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'startDate', render: text => text || 'N/A' },
            { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'endDate', render: text => text || 'N/A' },
            { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: text => text || 'N/A' },
        ],
        retired: [
            { title: 'Mã tài sản', dataIndex: 'assetTag', key: 'assetTag', render: text => text || 'N/A' },
            { title: 'Tên tài sản', dataIndex: 'name', key: 'name', render: text => text || 'N/A' },
            { title: 'Danh mục', dataIndex: 'category', key: 'category', render: text => text || 'N/A' },
            { title: 'Số SN', dataIndex: 'serialNumber', key: 'serialNumber', render: text => text || 'N/A' },
            { title: 'Ngày thanh lý', dataIndex: 'retiredDate', key: 'retiredDate', render: text => text || 'N/A' },
            { title: 'Lý do', dataIndex: 'reason', key: 'reason', render: text => text || 'N/A' },
            { title: 'Giá trị thanh lý', dataIndex: 'retirementValue', key: 'retirementValue', render: value => value ? `${value.toLocaleString('vi-VN')} VND` : 'N/A' },
            { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: text => text || 'N/A' },
        ],
    };

    if (!hasquanlyTSPermission && user.phanquyen !== true && !hastKiemKePermission && !hastXoaTSPermission && user.phanquyen !== 'IT asset') {
        return <NotFoundPage />;
      }

    return (
        <App>
            <div className="reports-container">
                <Card>
                    <Tabs defaultActiveKey="generate">
                        <TabPane tab={<span><TableOutlined style={{ marginRight: 5 }} /> Tạo báo cáo</span>} key="generate">
                            <div style={{ padding: '20px 0' }}>
                                <Title level={4}>Chức năng tạo báo cáo đang được phát triển</Title>
                                <p>Trong phiên bản tiếp theo, bạn sẽ có thể tạo báo cáo thống kê về tài sản của công ty theo nhiều hình thức khác nhau...</p>
                            </div>
                            <Form form={form} layout="vertical">
                                <Form.Item label="Loại báo cáo" name="reportType" initialValue={reportType}>
                                    <Select style={{ width: '100%' }} value={reportType} onChange={(value) => setReportType(value)}>
                                        <Option value="inventory">Báo cáo kê khai tài sản</Option>
                                        <Option value="warranty">Báo cáo bảo hành</Option>
                                        <Option value="retired">Báo cáo thanh lý</Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item label="Khoảng thời gian" name="dateRange" initialValue={dateRange}>
                                    <RangePicker
                                        style={{ width: '100%' }}
                                        value={dateRange}
                                        onChange={(dates) => setDateRange(dates)}
                                        format={DATE_FORMAT}
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <Button type="primary" onClick={fetchReportData} loading={loading}>
                                        Tạo báo cáo
                                    </Button>
                                </Form.Item>
                            </Form>

                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <Spin tip="Đang tải dữ liệu..." />
                                </div>
                            ) : reportData.length > 0 ? (
                                <div>
                                    <Divider orientation="left">
                                        {reportType === 'inventory' ? 'Báo cáo kê khai tài sản' : reportType === 'warranty' ? 'Báo cáo bảo hành' : 'Báo cáo thanh lý'}
                                    </Divider>

                                    <div style={{ marginBottom: 16, textAlign: 'right' }}>
                                        <Space>
                                            <Button icon={<FileExcelOutlined />} onClick={() => downloadReport('excel')}>
                                                Excel
                                            </Button>
                                            <Button icon={<FilePdfOutlined />} onClick={() => downloadReport('pdf')}>
                                                PDF
                                            </Button>
                                            <Button icon={<DownloadOutlined />} onClick={() => downloadReport('csv')}>
                                                CSV
                                            </Button>
                                        </Space>
                                    </div>

                                    <Table
                                        columns={columns[reportType]}
                                        dataSource={reportData}
                                        bordered
                                        size="middle"
                                        scroll={{ x: true }}
                                        style={{ width: '100%', whiteSpace: 'nowrap' }}
                                        rowKey="_id"
                                    />
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <Typography.Text>Không có dữ liệu để hiển thị. Vui lòng tạo báo cáo.</Typography.Text>
                                </div>
                            )}
                        </TabPane>

                        <TabPane tab={<span><BarChartOutlined style={{ marginRight: 5 }} /> Biểu đồ</span>} key="charts">
                            <div style={{ padding: '20px 0' }}>
                                <Title level={4}>Chức năng biểu đồ đang được phát triển</Title>
                                <p>Trong phiên bản tiếp theo, bạn sẽ có thể xem biểu đồ thống kê về tài sản của công ty theo nhiều dạng khác nhau như cột, đường, tròn...</p>
                            </div>
                        </TabPane>

                        <TabPane tab={<span><PieChartOutlined style={{ marginRight: 5 }} /> Phân tích</span>} key="analytics">
                            <div style={{ padding: '20px 0' }}>
                                <Title level={4}>Chức năng phân tích đang được phát triển</Title>
                                <p>Trong phiên bản tiếp theo, bạn sẽ có thể sử dụng các công cụ phân tích nâng cao để đánh giá tình hình tài sản, dự báo chi phí bảo trì và thay thế.</p>
                            </div>
                        </TabPane>

                        <TabPane tab={<span><LineChartOutlined style={{ marginRight: 5 }} /> Dự báo</span>} key="forecast">
                            <div style={{ padding: '20px 0' }}>
                                <Title level={4}>Chức năng dự báo đang được phát triển</Title>
                                <p>Trong phiên bản tiếp theo, bạn sẽ có thể sử dụng các công cụ dự báo để lập kế hoạch ngân sách cho việc mua sắm, bảo trì và thay thế tài sản trong tương lai.</p>
                            </div>
                        </TabPane>
                    </Tabs>
                </Card>
            </div>
        </App>
    );
};

export default Reports;