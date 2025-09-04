import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Row, Col, DatePicker, Select, Typography, Statistic, Table, Button, Tooltip, Spin, message, Space, Drawer, Empty } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrophyOutlined, FileDoneOutlined, CalendarOutlined, RiseOutlined, DownloadOutlined, LoadingOutlined, EyeOutlined, FullscreenOutlined, ClockCircleOutlined, QuestionCircleOutlined, WarningOutlined } from '@ant-design/icons';
import useApi from '../../../hook/useApi';
import useSearchShop from '../../../hook/SearchShop/useSearchShop';
import { calculateAdvancedPoints } from "../../xemphieu/point/CustomPointsNangCao";
import moment from 'moment';
import * as XLSX from 'xlsx';
import ViewUser from '../../xemphieu/ViewUser';
import ViewXuly from '../../xemphieu/ViewXuLy';
import NotFoundPage from '../../NotFoundPage';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const styles = {
    pageTitle: { marginBottom: '24px' },
    filterCard: { 
        marginBottom: '24px', 
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        '@media (max-width: 768px)': {
            padding: '12px'
        }
    },
    statsCard: { 
        height: '100%', 
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        '@media (max-width: 768px)': {
            marginBottom: '16px'
        }
    },
    chartCard: { 
        marginBottom: '24px', 
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        '@media (max-width: 768px)': {
            padding: '12px'
        }
    },
    activityCard: { 
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        '@media (max-width: 768px)': {
            padding: '12px'
        }
    },
    filterItem: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        '@media (max-width: 768px)': {
            marginBottom: '12px'
        }
    },
    filterLabel: { 
        marginTop: '15px',
        '@media (max-width: 768px)': {
            marginTop: '8px',
            fontSize: '14px'
        }
    },
    filterIcon: { marginRight: '8px', color: '#8c8c8c' },
    rightAlign: { textAlign: 'right' },
    exportButton: { 
        marginTop: '16px',
        '@media (max-width: 768px)': {
            width: '100%'
        }
    },
    earnIcon: { 
        color: '#1890ff', 
        fontSize: '20px', 
        marginRight: '8px',
        '@media (max-width: 768px)': {
            fontSize: '16px'
        }
    },
    archiveIcon: { 
        color: '#52c41a', 
        fontSize: '20px', 
        marginRight: '8px',
        '@media (max-width: 768px)': {
            fontSize: '16px'
        }
    },
    sectionHeader: { 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '16px',
        '@media (max-width: 768px)': {
            marginBottom: '12px'
        }
    },
    sectionTitle: { 
        margin: 0,
        '@media (max-width: 768px)': {
            fontSize: '18px'
        }
    },
    earnValue: { 
        color: '#1890ff', 
        fontWeight: 500,
        '@media (max-width: 768px)': {
            fontSize: '14px'
        }
    },
    archiveValue: { 
        color: '#52c41a', 
        fontWeight: 500,
        '@media (max-width: 768px)': {
            fontSize: '14px'
        }
    },
    fullWidth: { width: '100%' },
    responsiveStatistic: {
        '@media (max-width: 768px)': {
            '.ant-statistic-title': {
                fontSize: '12px'
            },
            '.ant-statistic-content': {
                fontSize: '14px'
            }
        }
    }
};

export default function ThongkeArchive({ user, t, hasxemPermission, hasxlphPermission }) {
    const [responses, setResponses] = useState([]);
    const [checklistTitles, setChecklistTitles] = useState([]);
    const [selectedChecklist, setSelectedChecklist] = useState(null);
    const [selectedChinhanh, setSelectedChinhanh] = useState(null);
    const [dateRange, setDateRange] = useState([null, null]);
    const [chartType, setChartType] = useState('line');
    const [loading, setLoading] = useState(false);
    const [hasFilters, setHasFilters] = useState(false);
    const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
    const [selectedViewRecord, setSelectedViewRecord] = useState(null);
    const [xulyDrawerVisible, setXulyDrawerVisible] = useState(false);
    const [selectedXulyRecord, setSelectedXulyRecord] = useState(null);
    const [selectedQuestionId, setSelectedQuestionId] = useState(null);
    const { request, searchShop } = useApi();
    const { options: chinhanhOptions, loading: chinhanhLoading, searchShops } = useSearchShop(searchShop);


    const fetchChecklistTitles = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await request({
                method: "GET",
                url: "/checklist/titles",
                params: params,
                headers: {
                    'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`
                }
            });
            setChecklistTitles(response.data || []);
        } catch (error) {
            message.error('Lỗi khi tải danh sách checklist');
        } finally {
            setLoading(false);
        }
    }, [request]);

    const fetchResponses = useCallback(async () => {
        if (!hasFilters) return;

        setLoading(true);
        try {
            const filters = {};
            if (dateRange[0] && dateRange[1]) {
                filters.startDate = moment(dateRange[0]).startOf('day').format('DD-MM-YYYY HH:mm:ss');
                filters.endDate = moment(dateRange[1]).endOf('day').format('DD-MM-YYYY HH:mm:ss');
            }
            if (selectedChecklist) {
                filters.title = selectedChecklist;
            }
            if (selectedChinhanh) {
                filters.chinhanh = selectedChinhanh;
            }

            console.log('Sending filters:', filters); // Debug log

            const response = await request({
                method: "GET",
                url: "/traloi/archive",
                params: filters,
                headers: {
                    'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`
                }
            });

            console.log('Received response:', response); // Debug log

            if (response && response.data) {
                setResponses(response.data || []);
            } else {
                setResponses([]);
                message.warning('Không tìm thấy dữ liệu phù hợp');
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách phản hồi:', error);
            message.error('Lỗi khi tải danh sách phản hồi');
            setResponses([]);
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedChecklist, selectedChinhanh, request, hasFilters]);

    useEffect(() => {
        const hasValidFilters = selectedChecklist && (dateRange[0] && dateRange[1]);
        setHasFilters(hasValidFilters);
    }, [dateRange, selectedChecklist]);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                await fetchChecklistTitles();
                await fetchResponses();
            } catch (error) {
                message.error('Lỗi khi tải dữ liệu ban đầu');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [fetchChecklistTitles, fetchResponses]);

    useEffect(() => {
        fetchResponses();
    }, [fetchResponses]);

    const chartData = useMemo(() => {
        if (!Array.isArray(responses)) return [];

        return responses.map(res => {
            if (!res) return null;

            const points = calculateAdvancedPoints(
                res.questions || [],
                res.pointConfigNangCao || {},
                res.ConfigPoints || {}
            );

            return {
                date: res.submittedAt || res.ngay_phan_hoi || '',
                earnPoints: parseFloat(points?.earnPoint || 0),
                archivePoints: parseFloat(points?.getPoint || 0),
                title: res.title || ''
            };
        }).filter(Boolean);
    }, [responses]);

    const stats = useMemo(() => {
        if (!Array.isArray(responses)) {
            return {
                earnPoints: '0.0',
                totalPoints: 0,
                percentage: '0.0',
                archivePoints: '0.0',
                totalIncorrectPoints: 0,
                totalConfigPoints: 0,
                averagePoints: '0.0'
            };
        }

        const dailyPoints = new Map();

        responses.forEach(res => {
            if (!res || !res.questions) return;

            const points = calculateAdvancedPoints(
                res.questions || [],
                res.pointConfigNangCao || {},
                res.ConfigPoints || {}
            );

            const date = moment(res.submittedAt || res.ngay_phan_hoi).format('YYYY-MM-DD');

            if (!dailyPoints.has(date)) {
                dailyPoints.set(date, []);
            }
            dailyPoints.get(date).push(parseFloat(points?.earnPoint || 0));
        });

        let totalEarn = 0, totalArchive = 0, totalPoints = 0, totalIncorrect = 0, totalConfig = 0;

        responses.forEach(res => {
            if (!res || !res.questions) return;

            const points = calculateAdvancedPoints(
                res.questions || [],
                res.pointConfigNangCao || {},
                res.ConfigPoints || {}
            );

            totalEarn += parseFloat(points?.earnPoint || 0);
            totalArchive += parseFloat(points?.getPoint || 0);
            totalPoints += (res.questions || []).reduce((sum, q) => sum + (parseInt(q?.point || 0)), 0);
            totalIncorrect += points?.totalIncorrectPoints || 0;
            totalConfig += points?.totalConfigPoints || 0;
        });

        let totalDailyAverage = 0;
        dailyPoints.forEach((points) => {
            const dailySum = points.reduce((sum, point) => sum + point, 0);
            totalDailyAverage += dailySum / points.length;
        });
        const averagePoints = dailyPoints.size > 0 ? (totalDailyAverage / dailyPoints.size).toFixed(1) : '0.0';

        return {
            earnPoints: totalEarn.toFixed(1),
            totalPoints,
            percentage: totalPoints ? ((totalEarn / totalPoints) * 100).toFixed(1) : '0.0',
            archivePoints: totalArchive.toFixed(1),
            totalIncorrectPoints: totalIncorrect,
            totalConfigPoints: totalConfig,
            averagePoints
        };
    }, [responses]);

    const handleDateChange = (dates) => {
        if (!selectedChecklist) {
            message.warning('Vui lòng chọn checklist trước');
            return;
        }
        if (!selectedChinhanh) {
            message.warning('Vui lòng chọn nhà hàng trước khi chọn thời gian');
            return;
        }
        setDateRange(dates);
    };
    const handleChartTypeChange = (value) => setChartType(value);
    const handleChecklistChange = (value) => {
        setSelectedChecklist(value);
        setSelectedChinhanh(null);
        setDateRange([null, null]);
    };
    const handleChinhanhChange = (value) => {
        if (!selectedChecklist) {
            message.warning('Vui lòng chọn checklist trước');
            return;
        }
        setSelectedChinhanh(value);
        setDateRange([null, null]);
    };

    const tableData = useMemo(() => {
        if (!Array.isArray(responses)) return [];

        return responses.map((res, index) => {
            if (!res) return null;

            const points = calculateAdvancedPoints(
                res.questions || [],
                res.pointConfigNangCao || {},
                res.ConfigPoints || {}
            );

            return {
                key: index.toString(),
                responseId: res.responseId,
                date: res.submittedAt || res.ngay_phan_hoi || '',
                activity: res.title || '',
                earnPoints: points?.earnPoint || 0,
                archivePoints: points?.getPoint || 0,
                title: res.title || ''
            };
        }).filter(Boolean);
    }, [responses]);

    const showViewDrawer = useCallback((record) => {
        if (!record || !record.responseId || record.responseId === 'undefined') {
            message.error('Không thể xem chi tiết: Dữ liệu không hợp lệ.');
            return;
        }
        setSelectedViewRecord(record);
        setViewDrawerVisible(true);
    }, []);

    const onCloseViewDrawer = useCallback(() => {
        setViewDrawerVisible(false);
        setSelectedViewRecord(null);
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

    const onCloseXulyDrawer = useCallback(() => {
        setXulyDrawerVisible(false);
    }, []);

    const columns = [
        { title: 'Ngày', dataIndex: 'date', key: 'date' },
        { title: 'Checklist', dataIndex: 'activity', key: 'activity' },
        { title: 'EARN', dataIndex: 'earnPoints', key: 'earnPoints', render: text => <span style={styles.earnValue}>{text}</span> },
        { title: 'ARCHIVE', dataIndex: 'archivePoints', key: 'archivePoints', render: text => <span style={styles.archiveValue}>{text}</span> },
        {
            title: 'Công cụ',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            onClick={() => showViewDrawer(record)}
                            icon={<EyeOutlined />}
                            shape='circle'
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const renderChart = () => {
        if (chartType === 'line') {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="earnPoints" stroke="#1890ff" name="EARN" />
                        <Line type="monotone" dataKey="archivePoints" stroke="#52c41a" name="ARCHIVE" />
                    </LineChart>
                </ResponsiveContainer>
            );
        } else {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="earnPoints" fill="#1890ff" name="EARN" />
                        <Bar dataKey="archivePoints" fill="#52c41a" name="ARCHIVE" />
                    </BarChart>
                </ResponsiveContainer>
            );
        }
    };

    const handleExportExcel = () => {
        if (!hasFilters) {
            message.warning('Vui lòng chọn checklist hoặc khoảng thời gian trước khi xuất báo cáo');
            return;
        }

        try {
            message.loading({ content: 'Đang chuẩn bị dữ liệu xuất...', key: 'export' });

            // Chuẩn bị dữ liệu cho sheet tổng quan
            const overviewData = [{
                'Tổng điểm EARN': stats.earnPoints,
                'Tổng điểm tối đa': stats.totalPoints,
                'Tỷ lệ đạt được (%)': stats.percentage,
                'Điểm ARCHIVE': stats.archivePoints,
                'Điểm trung bình/ngày': stats.averagePoints,
                'Điểm bị trừ': stats.totalIncorrectPoints,
                'Điểm cấu hình': stats.totalConfigPoints
            }];

            // Chuẩn bị dữ liệu cho sheet chi tiết
            const detailData = tableData.map(item => ({
                'Ngày': item.date,
                'Checklist': item.activity,
                'Điểm EARN': item.earnPoints,
                'Điểm ARCHIVE': item.archivePoints
            }));

            // Tạo workbook và thêm các sheets
            const wb = XLSX.utils.book_new();

            // Thêm sheet tổng quan
            const ws1 = XLSX.utils.json_to_sheet(overviewData);
            XLSX.utils.book_append_sheet(wb, ws1, "Tổng quan");

            // Thêm sheet chi tiết
            const ws2 = XLSX.utils.json_to_sheet(detailData);
            XLSX.utils.book_append_sheet(wb, ws2, "Chi tiết");

            // Tạo tên file với timestamp
            const fileName = `Báo_cáo_EARN_ARCHIVE_${moment().format('DD-MM-YYYY_HH-mm')}.xlsx`;

            // Xuất file
            XLSX.writeFile(wb, fileName);

            message.success({
                content: 'Xuất báo cáo thành công!',
                key: 'export',
                duration: 3
            });
        } catch (error) {
            console.error('Lỗi khi xuất Excel:', error);
            message.error({
                content: 'Có lỗi xảy ra khi xuất báo cáo',
                key: 'export',
                duration: 3
            });
        }
    };

    if (!user?.phanquyen) {
        return <NotFoundPage />;
    }

    return (
        <div className='layout_main_niso'>
            <title>NISO | Báo cáo tổng quan</title>
            <Card style={styles.filterCard}>
                <Row gutter={[{ xs: 8, sm: 16, md: 24 }, { xs: 8, sm: 16, md: 24 }]}>
                    <Col xs={24} sm={24} md={8} lg={8}>
                        <div style={styles.filterItem}>
                            <Text strong style={styles.filterLabel}>
                                <span style={{ color: '#ff4d4f' }}>*</span> Chọn checklist:
                            </Text>
                            <Select
                                placeholder="Chọn checklist"
                                style={styles.fullWidth}
                                onChange={handleChecklistChange}
                                value={selectedChecklist}
                                allowClear
                                showSearch
                                filterOption={false}
                                onSearch={(value) => {
                                    if (value) {
                                        fetchChecklistTitles({ search: value });
                                    }
                                }}
                                notFoundContent={loading ? (
                                    <div style={{ textAlign: 'center', padding: '5px' }}>
                                        <Spin size="small" />
                                    </div>
                                ) : null}
                            >
                                {checklistTitles.map((title, idx) => (
                                    <Option key={idx} value={title}>{title}</Option>
                                ))}
                            </Select>
                        </div>
                    </Col>
                    <Col xs={24} sm={24} md={8} lg={8}>
                        <div style={styles.filterItem}>
                            <Text strong style={styles.filterLabel}>
                                <span style={{ color: '#ff4d4f' }}>*</span> Chọn nhà hàng:
                            </Text>
                            <Select
                                placeholder={!selectedChecklist ? "Vui lòng chọn checklist trước" : "Chọn nhà hàng"}
                                style={styles.fullWidth}
                                onChange={handleChinhanhChange}
                                value={selectedChinhanh}
                                allowClear
                                showSearch
                                filterOption={false}
                                onSearch={searchShops}
                                loading={chinhanhLoading}
                                disabled={!selectedChecklist}
                                notFoundContent={chinhanhLoading ? (
                                    <div style={{ textAlign: 'center', padding: '5px' }}>
                                        <Spin size="small" />
                                    </div>
                                ) : null}
                            >
                                {chinhanhOptions.map((chinhanh, idx) => (
                                    <Option key={idx} value={chinhanh}>{chinhanh.toUpperCase()}</Option>
                                ))}
                            </Select>
                        </div>
                    </Col>
                    <Col xs={24} sm={24} md={8} lg={8}>
                        <div style={styles.filterItem}>
                            <Text strong style={styles.filterLabel}>
                                <CalendarOutlined style={styles.filterIcon} />
                                <span style={{ color: '#ff4d4f' }}>*</span> Chọn thời gian:
                            </Text>
                            <RangePicker
                                onChange={handleDateChange}
                                style={styles.fullWidth}
                                format="DD-MM-YYYY"
                                value={dateRange}
                                disabled={!selectedChecklist || !selectedChinhanh}
                                placeholder={['Từ ngày', 'Đến ngày']}
                            />
                        </div>
                    </Col>
                </Row>
                <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    <Col xs={24} sm={24} md={8} lg={8}>
                        <div style={styles.filterItem}>
                            <Text strong style={styles.filterLabel}>
                                <RiseOutlined style={styles.filterIcon} />
                                Loại biểu đồ:
                            </Text>
                            <Select
                                defaultValue="line"
                                onChange={handleChartTypeChange}
                                style={styles.fullWidth}
                            >
                                <Option value="line">Biểu đồ đường</Option>
                                <Option value="bar">Biểu đồ cột</Option>
                            </Select>
                        </div>
                    </Col>
                    <Col xs={24} sm={24} md={16} lg={16} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                        <Tooltip title="Tải xuống báo cáo Excel">
                            <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={handleExportExcel}
                                disabled={!hasFilters}
                            >
                                Xuất báo cáo Excel
                            </Button>
                        </Tooltip>
                    </Col>
                </Row>
            </Card>

            {!hasFilters ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: window.innerWidth < 768 ? '30px 0' : '50px 0',
                    background: '#fafafa',
                    borderRadius: '8px',
                    margin: '16px 0'
                }}>
                    <Title 
                        level={window.innerWidth < 768 ? 5 : 4} 
                        style={{ 
                            color: '#999',
                            margin: 0,
                            fontSize: window.innerWidth < 768 ? '14px' : '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        {!selectedChecklist ? (
                            <><WarningOutlined style={{ fontSize: window.innerWidth < 768 ? '14px' : '20px' }} />Vui lòng chọn checklist</>
                        ) : !selectedChinhanh ? (
                            <><QuestionCircleOutlined style={{ fontSize: window.innerWidth < 768 ? '14px' : '20px' }} />Vui lòng chọn nhà hàng</>
                        ) : (
                            <><ClockCircleOutlined style={{ fontSize: window.innerWidth < 768 ? '14px' : '20px' }} />Vui lòng chọn thời gian</>
                        )}
                    </Title>
                </div>
            ) : loading ? (
                <div style={{ maxWidth: 800, margin: '0 auto', padding: '50px 0', textAlign: 'center' }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
                </div>
            ) : (
                <>
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        <Col xs={24} md={12}>
                            <Card style={styles.statsCard} bordered={false}>
                                <div style={styles.sectionHeader}>
                                    <TrophyOutlined style={styles.earnIcon} />
                                    <Title level={4} style={styles.sectionTitle}>EARN</Title>
                                </div>
                                <Row gutter={[16, 16]}>
                                    <Col xs={12} sm={12} md={6}>
                                        <Statistic
                                            title="Điểm đạt được"
                                            value={stats.earnPoints}
                                            suffix={`/${stats.totalPoints}`}
                                            valueStyle={{ 
                                                color: '#1890ff', 
                                                fontSize: window.innerWidth < 768 ? '14px' : '24px'
                                            }}
                                            className={styles.responsiveStatistic}
                                        />
                                    </Col>
                                    <Col xs={12} sm={12} md={6}>
                                        <Statistic
                                            title="Tỷ lệ đạt được"
                                            value={stats.percentage}
                                            suffix="%"
                                            precision={1}
                                            valueStyle={{ color: '#1890ff', fontSize: window.innerWidth < 768 ? '16px' : '24px' }}
                                        />
                                    </Col>
                                    <Col xs={12} sm={12} md={6}>
                                        <Statistic
                                            title="Điểm trung bình/ngày"
                                            value={stats.averagePoints}
                                            precision={1}
                                            valueStyle={{ color: '#1890ff', fontSize: window.innerWidth < 768 ? '16px' : '24px' }}
                                        />
                                    </Col>
                                    <Col xs={12} sm={12} md={6}>
                                        <Statistic
                                            title="Điểm bị trừ"
                                            value={stats.totalIncorrectPoints}
                                            valueStyle={{ color: '#ff4d4f', fontSize: window.innerWidth < 768 ? '16px' : '24px' }}
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card style={styles.statsCard} bordered={false}>
                                <div style={styles.sectionHeader}>
                                    <FileDoneOutlined style={styles.archiveIcon} />
                                    <Title level={4} style={styles.sectionTitle}>ARCHIVE</Title>
                                </div>
                                <Row gutter={[16, 16]}>
                                    <Col xs={12} sm={12} md={8}>
                                        <Statistic
                                            title="ARCHIVE"
                                            value={stats.archivePoints}
                                            suffix={`/${stats.totalPoints}`}
                                            valueStyle={{ color: '#52c41a', fontSize: window.innerWidth < 768 ? '16px' : '24px' }}
                                        />
                                    </Col>
                                    <Col xs={12} sm={12} md={8}>
                                        <Statistic
                                            title="Tỷ lệ ARCHIVE"
                                            value={(stats.archivePoints / stats.totalPoints * 100).toFixed(1)}
                                            suffix="%"
                                            precision={1}
                                            valueStyle={{ color: '#52c41a', fontSize: window.innerWidth < 768 ? '16px' : '24px' }}
                                        />
                                    </Col>
                                    <Col xs={24} sm={24} md={8}>
                                        <Statistic
                                            title="Điểm cấu hình"
                                            value={stats.totalConfigPoints}
                                            valueStyle={{ color: '#722ed1', fontSize: window.innerWidth < 768 ? '16px' : '24px' }}
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>

                    <Card style={styles.chartCard}>
                        <Title level={4} style={{ marginBottom: '16px' }}>Biểu đồ điểm theo thời gian</Title>
                        {renderChart()}
                    </Card>

                    <Card style={styles.activityCard}>
                        <Title level={4} style={{ marginBottom: '16px' }}>Danh sách phản hồi</Title>
                        <Table
                            columns={columns}
                            dataSource={tableData}
                            pagination={{
                                pageSize: window.innerWidth < 768 ? 5 : 10,
                                size: window.innerWidth < 768 ? "small" : "default",
                                responsive: true
                            }}
                            bordered
                            scroll={{ x: true }}
                            style={{ width: "100%", whiteSpace: 'nowrap' }}
                            size={window.innerWidth < 768 ? 'small' : 'middle'}
                            locale={{ emptyText: <Empty description="Trống." /> }}
                        />
                    </Card>
                </>
            )}

            <Drawer
                closeIcon={null}
                title={
                    selectedViewRecord ? (
                        <Tooltip title={selectedViewRecord.title}>
                            <span>Chi tiết phiếu {window.innerWidth < 768 ?
                                (selectedViewRecord.title.length > 10 ? selectedViewRecord.title.substring(0, 10) + '...' : selectedViewRecord.title) :
                                (selectedViewRecord.title.length > 50 ? selectedViewRecord.title.substring(0, 50) + '...' : selectedViewRecord.title)}
                            </span>
                        </Tooltip>
                    ) : (
                        'Loading...'
                    )
                }
                width={window.innerWidth < 768 ? '100%' : 800}
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
                        isInDrawer={true}
                    />
                )}

                <Drawer
                    title={
                        selectedXulyRecord ? (
                            <Tooltip title={selectedXulyRecord.title}>
                                <span>Xử lý phiếu {window.innerWidth < 768 ?
                                    (selectedXulyRecord.title.length > 10 ? selectedXulyRecord.title.substring(0, 10) + '...' : selectedXulyRecord.title) :
                                    (selectedXulyRecord.title.length > 50 ? selectedXulyRecord.title.substring(0, 50) + '...' : selectedXulyRecord.title)}
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
}