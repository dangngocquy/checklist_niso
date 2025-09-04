import React, { useState, useEffect } from 'react';
import { Card, List, Calendar, Row, Col, Typography, Empty, Badge, theme, Select, message } from 'antd';
import { ClockCircleOutlined, ArrowRightOutlined, EnvironmentOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/vi';

const { Text, Title } = Typography;
const { useToken } = theme;

const LichHoc = () => {
    const { token } = useToken();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [lichHoc, setLichHoc] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const primaryColor = '#8e6f3d';
    const secondaryColor = '#f9f2e3';

    // Fetch danh sách lịch học
    useEffect(() => {
        const fetchLichHoc = async () => {
            try {
                setLoading(true);
                const response = await axios.get('https://checklist.niso.com.vn:3003/api/lichhoc');
                setLichHoc(response.data);
            } catch (error) {
                message.error('Không thể tải danh sách lịch học');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchLichHoc();
    }, []);

    const getClassesForDate = (date) => {
        const formattedDate = moment(date).format('YYYY-MM-DD');
        return lichHoc.filter(cls => moment(cls.ngay_hoc).format('YYYY-MM-DD') === formattedDate);
    };

    const onCalendarSelect = (date) => {
        setSelectedDate(date.toDate());
    };

    const dateCellRender = (value) => {
        const formattedDate = value.format('YYYY-MM-DD');
        const listData = lichHoc.filter(cls => 
            moment(cls.ngay_hoc).format('YYYY-MM-DD') === formattedDate
        );

        return listData.length ? (
            <Badge
                count={listData.length}
                style={{
                    backgroundColor: primaryColor,
                    boxShadow: '0 0 0 1px #fff'
                }}
            />
        ) : null;
    };

    const classesForSelectedDate = getClassesForDate(selectedDate);

    const formatDate = (date) => {
        return moment(date).locale('vi').format('dddd, [ngày] D [tháng] M [năm] YYYY');
    };

    // Styles
    const calendarStyle = {
        borderRadius: token.borderRadiusLG,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    };

    const eventCardStyle = {
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    };

    const headerStyle = {
        padding: '16px 24px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        background: secondaryColor,
    };

    const contentStyle = {
        padding: '0',
        flex: 1,
    };

    const listItemStyle = {
        padding: '16px 24px',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        borderLeft: '3px solid transparent',
    };

    return (
        <Row gutter={[24, 24]} style={{ margin: '24px 0' }}>
            <Col xs={24} md={14}>
                <Card
                    bordered={false}
                    style={calendarStyle}
                    headStyle={{ borderBottom: 'none' }}
                    bodyStyle={{ padding: 0 }}
                    loading={loading}
                >
                    <Calendar
                        fullscreen={false}
                        onSelect={onCalendarSelect}
                        cellRender={dateCellRender}
                        headerRender={({ value, type, onChange, onTypeChange }) => {
                            const start = 0;
                            const end = 12;
                            const monthOptions = [];

                            const year = value.year();
                            const month = value.month();

                            for (let i = start; i < end; i++) {
                                monthOptions.push(
                                    <Select.Option key={i} value={i}>
                                        {i + 1}
                                    </Select.Option>
                                );
                            }

                            return (
                                <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                                    <div>
                                        <Title level={4} style={{ margin: 0, color: primaryColor }}>Lịch Học</Title>
                                    </div>
                                    <div>
                                        <Select
                                            dropdownMatchSelectWidth={false}
                                            value={month}
                                            onChange={(newMonth) => {
                                                const now = value.clone().month(newMonth);
                                                onChange(now);
                                            }}
                                            style={{ marginRight: 8 }}
                                        >
                                            {monthOptions}
                                        </Select>
                                        <Select
                                            dropdownMatchSelectWidth={false}
                                            value={year}
                                            onChange={(newYear) => {
                                                const now = value.clone().year(newYear);
                                                onChange(now);
                                            }}
                                        >
                                            {[year - 1, year, year + 1].map(y => (
                                                <Select.Option key={y} value={y}>{y}</Select.Option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>
                            );
                        }}
                    />
                </Card>
            </Col>

            <Col xs={24} md={10}>
                <Card
                    bordered={false}
                    style={eventCardStyle}
                    bodyStyle={{ padding: 0 }}
                    loading={loading}
                >
                    <div style={headerStyle}>
                        <Title level={4} style={{ margin: 0, color: primaryColor, fontWeight: 600 }}>
                            {formatDate(selectedDate)}
                        </Title>
                    </div>

                    <div style={contentStyle}>
                        {classesForSelectedDate.length > 0 ? (
                            <List
                                itemLayout="horizontal"
                                dataSource={classesForSelectedDate}
                                renderItem={item => (
                                    <List.Item style={listItemStyle}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(142, 111, 61, 0.05)';
                                            e.currentTarget.style.borderLeft = `3px solid ${primaryColor}`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.borderLeft = '3px solid transparent';
                                        }}
                                    >
                                        <List.Item.Meta
                                            title={
                                                <Text strong style={{ fontSize: 16, color: token.colorTextHeading }}>
                                                    {item.tieu_de}
                                                </Text>
                                            }
                                            description={
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                                        <ClockCircleOutlined style={{ color: primaryColor, marginRight: 8 }} />
                                                        <Text type="secondary">{`${item.gio_bat_dau} - ${item.gio_ket_thuc}`}</Text>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <EnvironmentOutlined style={{ color: primaryColor, marginRight: 8 }} />
                                                        <Text type="secondary">{item.phong_hoc}</Text>
                                                    </div>
                                                </div>
                                            }
                                        />
                                        <ArrowRightOutlined style={{ color: primaryColor }} />
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Empty
                                style={{ padding: 48 }}
                                description={
                                    <Text type="secondary" style={{ fontSize: 16 }}>
                                        Không có lớp học nào vào ngày này
                                    </Text>
                                }
                            />
                        )}
                    </div>
                </Card>
            </Col>
        </Row>
    );
};

export default LichHoc;