import React from 'react';
import NotFoundPage from '../NotFoundPage';
import { Typography, Card, Row, Col, List, Progress, Tag, Button, Space, Avatar, Layout } from 'antd';
import {
    TrophyOutlined,
    CalendarOutlined,
    BookOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    FileProtectOutlined,
    StarOutlined,
    EyeOutlined,
    ArrowRightOutlined,
    UserOutlined,
    BarChartOutlined
} from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Meta } = Card;

// Dữ liệu thống kê
const courseStats = {
    toLearn: 5,
    failed: 2,
    completed: 8,
    certificates: 6
};

// Dữ liệu khóa học
const courses = [
    {
        id: 1,
        title: 'Khóa học pha chế xyz',
        views: 1250,
        rating: 4.8,
        category: 'Pha chế',
        difficulty: 'Trung bình',
        completed: 75,
        image: null
    },
    {
        id: 2,
        title: 'Khóa học pha chế xyz',
        views: 980,
        rating: 4.6,
        category: 'Pha chế',
        difficulty: 'Nâng cao',
        completed: 45,
        image: null
    },
    {
        id: 3,
        title: 'Khóa học pha chế xyz',
        views: 1540,
        rating: 4.9,
        category: 'Pha chế',
        difficulty: 'Cơ bản',
        completed: 100,
        image: null
    }
];

// Dữ liệu lịch học
const upcomingClasses = [
    { id: 1, title: 'Khóa học pha chế xyz', date: '2025-05-03', time: '09:00 - 11:00' },
    { id: 2, title: 'Khóa học pha chế xyz', date: '2025-05-04', time: '14:00 - 16:00' },
    { id: 3, title: 'Khóa học pha chế xyz', date: '2025-05-05', time: '10:00 - 12:00' }
];

// Dữ liệu xếp hạng
const topStudents = [
    {
        id: 1,
        name: 'Đặng Ngọc Quý',
        studentId: 'S12345',
        role: 'Pha chế',
        avatar: null,
        rank: '-',
        completedLessons: 0,
        badgeColor: '#f5f5f5'
    },
    {
        id: 2,
        name: 'Đặng Ngọc Quý',
        studentId: 'S12345',
        role: 'Pha chế',
        avatar: null,
        rank: 1,
        completedLessons: 8,
        badgeColor: '#ffd700'
    },
    {
        id: 3,
        name: 'Đặng Ngọc Quý',
        studentId: 'S12345',
        role: 'Trợ lý của hàng',
        avatar: 'TN',
        rank: 2,
        completedLessons: 8,
        badgeColor: '#b19cd9'
    },
    {
        id: 4,
        name: 'Đặng Ngọc Quý',
        studentId: 'S12345',
        role: 'Trợ lý của hàng',
        avatar: null,
        rank: 3,
        completedLessons: 8,
        badgeColor: '#ffa39e'
    },
    {
        id: 5,
        name: 'Đặng Ngọc Quý',
        studentId: 'S12345',
        role: 'Trợ lý của hàng',
        avatar: null,
        rank: 4,
        completedLessons: 7,
        badgeColor: '#f5f5f5'
    }
];

const HocTap = ({ user }) => {
    // Kiểm tra quyền truy cập
    if (user.phanquyen !== true) return <NotFoundPage />;

    // Helper function cho badge xếp hạng
    const getRankBadge = (rank) => {
        if (rank === 1) return <span style={{ fontSize: '20px' }}>🥇</span>;
        if (rank === 2) return <span style={{ fontSize: '20px' }}>🥈</span>;
        if (rank === 3) return <span style={{ fontSize: '20px' }}>🥉</span>;
        return <span style={{ fontSize: '16px', color: '#666' }}>{rank}</span>;
    };

    // Màu nền card dựa vào xếp hạng
    const getCardBackground = (rank) => {
        if (rank === 1) return 'linear-gradient(135deg, #fff9e6, #fffcf2)';
        if (rank === 2) return 'linear-gradient(135deg, #f6f3ff, #f9f7ff)';
        if (rank === 3) return 'linear-gradient(135deg, #fff0ee, #fff6f5)';
        return 'white';
    };

    // Màu viền card dựa vào xếp hạng
    const getBorderColor = (rank) => {
        if (rank === 1) return '#ffd700';
        if (rank === 2) return '#b19cd9';
        if (rank === 3) return '#ffa39e';
        return '#eaeaea';
    };

    return (
        <Layout style={{ minHeight: '100vh', background: '#f7f8fa' }}>
            <title>NISO | Học Tập</title>
            <Header style={{
                background: 'linear-gradient(135deg, #ae8f3d, #ae8f3d)',
                padding: '0 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <BookOutlined style={{ fontSize: '24px', color: 'white', marginRight: '12px' }} />
                    <Title level={3} style={{ margin: '0', color: 'white', fontSize: 'clamp(18px, 5vw, 24px)' }}>
                        Học tập (Demo)
                    </Title>
                </div>
            </Header>

            <Content style={{ padding: '16px' }}>
                <Row gutter={[16, 16]}>
                    {/* Thống kê môn học */}
                    <Col xs={24}>
                        <Card
                            bordered={false}
                            style={{
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}
                        >
                            <Row gutter={[16, 16]}>
                                <Col xs={12} sm={6}>
                                    <Card
                                        bordered={false}
                                        style={{
                                            background: 'rgba(174, 143, 61, 0.05)',
                                            borderRadius: '8px',
                                            height: '100%'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: 'rgba(174, 143, 61, 0.15)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '10px'
                                            }}>
                                                <BookOutlined style={{ fontSize: '20px', color: '#ae8f3d' }} />
                                            </div>
                                            <div>
                                                <Text type="secondary" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>Cần học</Text>
                                                <Title level={3} style={{ margin: '0', color: '#ae8f3d', fontSize: 'clamp(18px, 5vw, 24px)' }}>
                                                    {courseStats.toLearn}
                                                </Title>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Card
                                        bordered={false}
                                        style={{
                                            background: 'rgba(255, 77, 79, 0.05)',
                                            borderRadius: '8px',
                                            height: '100%'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: 'rgba(255, 77, 79, 0.15)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '10px'
                                            }}>
                                                <CloseCircleOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />
                                            </div>
                                            <div>
                                                <Text type="secondary" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>Không đạt</Text>
                                                <Title level={3} style={{ margin: '0', color: '#ff4d4f', fontSize: 'clamp(18px, 5vw, 24px)' }}>
                                                    {courseStats.failed}
                                                </Title>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Card
                                        bordered={false}
                                        style={{
                                            background: 'rgba(82, 196, 26, 0.05)',
                                            borderRadius: '8px',
                                            height: '100%'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: 'rgba(82, 196, 26, 0.15)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '10px'
                                            }}>
                                                <CheckCircleOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
                                            </div>
                                            <div>
                                                <Text type="secondary" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>Hoàn thành</Text>
                                                <Title level={3} style={{ margin: '0', color: '#52c41a', fontSize: 'clamp(18px, 5vw, 24px)' }}>
                                                    {courseStats.completed}
                                                </Title>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Card
                                        bordered={false}
                                        style={{
                                            background: 'rgba(250, 140, 22, 0.05)',
                                            borderRadius: '8px',
                                            height: '100%'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: 'rgba(250, 140, 22, 0.15)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '10px'
                                            }}>
                                                <FileProtectOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />
                                            </div>
                                            <div>
                                                <Text type="secondary" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}>Chứng chỉ</Text>
                                                <Title level={3} style={{ margin: '0', color: '#fa8c16', fontSize: 'clamp(18px, 5vw, 24px)' }}>
                                                    {courseStats.certificates}
                                                </Title>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* Phần khóa học cho màn hình lớn */}
                    <Col xs={24} lg={16} className="desktop-view">
                        <Card
                            title={
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <BookOutlined style={{ fontSize: '20px', color: '#ae8f3d', marginRight: '10px' }} />
                                    <span style={{ fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: '600', color: '#ae8f3d' }}>Khóa học của bạn</span>
                                </div>
                            }
                            bordered={false}
                            style={{
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                height: '100%'
                            }}
                            extra={
                                <Button type="primary" ghost size="small" style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: '5px', display: { xs: 'none', sm: 'inline' } }}>Xem tất cả</span>
                                    <ArrowRightOutlined />
                                </Button>
                            }
                            bodyStyle={{ padding: { xs: '12px', sm: '16px' } }}
                        >
                            <Row gutter={[12, 12]}>
                                {courses.map(course => (
                                    <Col xs={24} sm={12} key={course.id}>
                                        <Card
                                            hoverable
                                            style={{
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                                height: '100%'
                                            }}
                                            bodyStyle={{ padding: '12px' }}
                                            cover={
                                                <div style={{
                                                    height: 100,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    background: 'linear-gradient(135deg, #edecdf, #edecdf)',
                                                    position: 'relative'
                                                }}>
                                                    <BookOutlined style={{ fontSize: 30, color: '#ae8f3d' }} />
                                                    {course.completed === 100 && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '10px',
                                                            right: '10px',
                                                            background: '#ae8f3d',
                                                            color: 'white',
                                                            borderRadius: '50%',
                                                            width: '24px',
                                                            height: '24px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <CheckCircleOutlined />
                                                        </div>
                                                    )}
                                                </div>
                                            }
                                        >
                                            <Meta
                                                title={
                                                    <div style={{ fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: '600', marginBottom: '8px', lineHeight: 1.3 }}>
                                                        {course.title}
                                                    </div>
                                                }
                                                description={
                                                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                                        <div>
                                                            <Tag color={course.difficulty === 'Cơ bản' ? 'green' : course.difficulty === 'Trung bình' ? 'blue' : 'orange'}
                                                                style={{ borderRadius: '4px', marginRight: '8px', fontSize: '12px' }}>
                                                                {course.difficulty}
                                                            </Tag>
                                                            <Tag color="purple" style={{ borderRadius: '4px', fontSize: '12px' }}>
                                                                {course.category}
                                                            </Tag>
                                                        </div>
                                                        <div>
                                                            <Progress
                                                                percent={course.completed}
                                                                size="small"
                                                                status={course.completed === 100 ? "success" : "active"}
                                                                strokeColor={
                                                                    course.completed === 100
                                                                        ? '#52c41a'
                                                                        : { from: '#108ee9', to: '#ae8f3d' }
                                                                }
                                                            />
                                                        </div>
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            color: 'rgba(0,0,0,0.45)',
                                                            fontSize: '12px'
                                                        }}>
                                                            <span><EyeOutlined /> {course.views}</span>
                                                            <span><StarOutlined /> {course.rating}</span>
                                                        </div>
                                                        <Button
                                                            type="primary"
                                                            block
                                                            size="small"
                                                            style={{
                                                                background: course.completed === 100 ? '#52c41a' : '#ae8f3d',
                                                                borderColor: course.completed === 100 ? '#52c41a' : '#ae8f3d'
                                                            }}
                                                        >
                                                            {course.completed === 100 ? 'Xem lại' : 'Học tiếp'} <ArrowRightOutlined />
                                                        </Button>
                                                    </Space>
                                                }
                                            />
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Card>
                    </Col>

                    {/* Sidebar bên phải cho màn hình lớn */}
                    <Col xs={24} lg={8}>
                        <Row gutter={[0, 16]}>
                            {/* Lịch học */}
                            <Col xs={24}>
                                <Card
                                    title={
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <CalendarOutlined style={{ fontSize: '20px', color: '#ae8f3d', marginRight: '10px' }} />
                                            <span style={{ fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: '600', color: '#ae8f3d' }}>Lịch học tới</span>
                                        </div>
                                    }
                                    bordered={false}
                                    style={{
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }}
                                    extra={
                                        <Button type="link" style={{ padding: 0, color: '#ae8f3d', fontSize: '12px' }}>
                                            <CalendarOutlined /> <span style={{ display: { xs: 'none', sm: 'inline' } }}>Lịch đầy đủ</span>
                                        </Button>
                                    }
                                    bodyStyle={{ padding: { xs: '12px', sm: '16px' } }}
                                >
                                    <List
                                        size="small"
                                        dataSource={upcomingClasses}
                                        renderItem={item => (
                                            <List.Item
                                                style={{
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    margin: '6px 0',
                                                    background: '#edecdf',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    border: 'none'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#edecdf';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#e0dfd3';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <List.Item.Meta
                                                    avatar={
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '8px',
                                                            background: '#e0dfd3',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <ClockCircleOutlined style={{ fontSize: '20px', color: '#ae8f3d' }} />
                                                        </div>
                                                    }
                                                    title={<span style={{ fontWeight: '600', fontSize: 'clamp(13px, 3.5vw, 14px)' }}>{item.title}</span>}
                                                    description={
                                                        <Space direction="vertical" size={0} style={{ fontSize: 'clamp(12px, 3vw, 13px)' }}>
                                                            <div>
                                                                <CalendarOutlined style={{ marginRight: '6px', color: '#888' }} />
                                                                {item.date}
                                                            </div>
                                                            <div>
                                                                <ClockCircleOutlined style={{ marginRight: '6px', color: '#888' }} />
                                                                {item.time}
                                                            </div>
                                                        </Space>
                                                    }
                                                />
                                                <Button type="primary" ghost size="small" style={{ padding: '0 8px', height: '24px' }}>
                                                    <ArrowRightOutlined />
                                                </Button>
                                            </List.Item>
                                        )}
                                    />
                                </Card>
                            </Col>

                            {/* Xếp Hạng */}
                            <Col xs={24}>
                                <Card
                                    title={
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <TrophyOutlined style={{ fontSize: '20px', color: '#ae8f3d', marginRight: '10px' }} />
                                            <span style={{ fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: '600', color: '#ae8f3d' }}>Xếp hạng học viên</span>
                                        </div>
                                    }
                                    bordered={false}
                                    style={{
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }}
                                    extra={
                                        <Button type="link" style={{ padding: 0, color: '#ae8f3d', fontSize: '12px' }}>
                                            <BarChartOutlined /> <span style={{ display: { xs: 'none', sm: 'inline' } }}>Xem đầy đủ</span>
                                        </Button>
                                    }
                                    bodyStyle={{ padding: { xs: '12px', sm: '16px' } }}
                                >
                                    {/* My Ranking */}
                                    <div style={{
                                        background: 'rgba(63, 81, 181, 0.05)',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{ color: '#666', marginBottom: '10px', fontSize: '13px' }}>
                                            Xếp hạng của tôi
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar
                                                    size={{ xs: 36, sm: 40 }}
                                                    icon={<UserOutlined />}
                                                    style={{ background: '#ae8f3d', marginRight: '10px' }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: 'clamp(14px, 4vw, 16px)' }}>{topStudents[0].name}</div>
                                                    <div style={{ fontSize: 'clamp(11px, 3vw, 13px)', color: '#666' }}>
                                                        <span style={{ marginRight: '6px' }}>{topStudents[0].studentId}</span>
                                                        <span style={{ margin: '0 4px', color: '#ddd' }}>•</span>
                                                        <Tag style={{ margin: 0, borderRadius: '4px', fontSize: '10px' }} color="blue">
                                                            {topStudents[0].role}
                                                        </Tag>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 'bold', color: '#333' }}>
                                                {topStudents[0].completedLessons}
                                                <BookOutlined style={{ fontSize: '16px', color: '#4CAF50', marginLeft: '6px' }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Danh sách xếp hạng */}
                                    {topStudents.slice(1).map(student => (
                                        <div
                                            key={student.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 12px',
                                                borderRadius: '8px',
                                                marginBottom: '8px',
                                                background: getCardBackground(student.rank),
                                                border: `1px solid ${getBorderColor(student.rank)}`,
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '24px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginRight: '8px',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {getRankBadge(student.rank)}
                                                </div>
                                                <Avatar
                                                    size={{ xs: 32, sm: 36 }}
                                                    style={{
                                                        background: student.rank === 1 ? '#ffd700' :
                                                            student.rank === 2 ? '#b19cd9' :
                                                                student.rank === 3 ? '#ffa39e' : '#e0e0e0',
                                                        marginRight: '8px'
                                                    }}
                                                >
                                                    {student.avatar || student.name.charAt(0)}
                                                </Avatar>
                                                <div>
                                                    <div style={{ fontWeight: '500', fontSize: 'clamp(12px, 3.5vw, 14px)' }}>{student.name}</div>
                                                    <div style={{ fontSize: 'clamp(10px, 3vw, 12px)', color: '#666' }}>
                                                        <span>{student.studentId}</span>
                                                        <span style={{ margin: '0 4px', color: '#ddd' }}>•</span>
                                                        <Tag style={{
                                                            margin: 0,
                                                            padding: '0 4px',
                                                            borderRadius: '4px',
                                                            fontSize: '10px',
                                                            color: student.rank <= 3 ? '#5e35b1' : '#555',
                                                            background: student.rank <= 3 ? '#f8f4ff' : '#f0f0f0',
                                                        }}>
                                                            {student.role}
                                                        </Tag>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                                                {student.completedLessons}
                                                <BookOutlined style={{ fontSize: '16px', color: '#4CAF50', marginLeft: '5px' }} />
                                            </div>
                                        </div>
                                    ))}
                                </Card>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
};

export default HocTap;