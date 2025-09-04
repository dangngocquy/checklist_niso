import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    Tabs,
    Input,
    Button,
    Space,
    Row,
    Col,
    Typography,
    Empty,
    Tooltip,
    Badge,
    Spin,
    Avatar,
    Modal,
    message
} from 'antd';
import {
    SearchOutlined,
    DeleteOutlined,
    EyeOutlined,
    FileTextOutlined,
    CalendarOutlined,
    QuestionCircleOutlined,
    ClockCircleOutlined,
    PlayCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import Avatars from '../../config/design/Avatars';
import UserInfoCard from '../../hook/UserInfoCard';

const { Title, Text } = Typography;

const QuizContainer = () => {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('published');
    const [quizData, setQuizData] = useState({ draft: [], published: [] });
    const [loading, setLoading] = useState(true);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [quizToDelete, setQuizToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Hàm lấy dữ liệu quiz từ CHECKLIST_QUIZ
    const fetchQuizData = useCallback(async () => {
        setLoading(true);
        try {
            // Gọi API để lấy danh sách quiz
            const quizResponse = await axios.get('/api/quizzes', {
                headers: {
                    Authorization: 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME),
                },
            });
            console.log('Quiz API Response:', quizResponse.data); // Debug dữ liệu trả về

            const quizzes = quizResponse.data.data || [];
            const draft = quizzes.filter(quiz => quiz.isDraft);
            const published = quizzes.filter(quiz => !quiz.isDraft);
            setQuizData({ draft, published });
        } catch (error) {
            console.error('Error fetching quiz data:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            } else if (error.request) {
                console.error('No response received:', error.request);
            } else {
                console.error('Error setting up request:', error.message);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuizData();
    }, [fetchQuizData]);

    const filterQuizzes = (quizzes) => {
        if (!searchText) return quizzes;
        return quizzes.filter(quiz =>
            quiz.title?.toLowerCase().includes(searchText.toLowerCase()) ||
            quiz.description?.toLowerCase().includes(searchText.toLowerCase()) ||
            quiz.category?.toLowerCase().includes(searchText.toLowerCase())
        );
    };

    const handleDeleteQuiz = async (quizId) => {
        setDeleteLoading(true);
        try {
            const response = await axios.delete(`/api/quizzes/${quizId}`, {
                headers: {
                    Authorization: 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME),
                },
            });

            if (response.data.success) {
                message.success('Xóa quiz thành công');
                fetchQuizData(); // Refresh danh sách quiz
            } else {
                message.error('Xóa quiz thất bại');
            }
        } catch (error) {
            console.error('Error deleting quiz:', error);
            message.error('Có lỗi xảy ra khi xóa quiz');
        } finally {
            setDeleteLoading(false);
            setDeleteModalVisible(false);
            setQuizToDelete(null);
        }
    };

    const showDeleteModal = (quiz) => {
        setQuizToDelete(quiz);
        setDeleteModalVisible(true);
    };

    const truncateText = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

    const renderQuizCard = (quiz) => {
        // Lấy thông tin người dùng từ quiz.user
        const UserAvatar = quiz.user || {};
        const authorName = UserAvatar.name || UserAvatar.username;

        // Tạo user object cho UserInfoCard
        const userForCard = {
            name: UserAvatar.name,
            username: UserAvatar.username || 'N/A',
            imgAvatar: UserAvatar.imgAvatar || null,
            imgBackground: UserAvatar.imgBackground || null,
            locker: UserAvatar.locker || false,
            keys: UserAvatar.keys || 'N/A',
            email: UserAvatar.email || null,
            chucvu: UserAvatar.chucvu || null,
            chinhanh: UserAvatar.chinhanh || 'N/A',
            bophan: UserAvatar.bophan || 'N/A',
        };

        return (
            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={quiz.quizId}>
                <Card
                    hoverable
                    className="quiz-card"
                    style={{
                        marginBottom: 16,
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                    bodyStyle={{
                        padding: '20px',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}
                    actions={[
                        !quiz.isDraft && (
                            <Tooltip title="Play Game">
                                <PlayCircleOutlined key="view" style={{ fontSize: 16 }} onClick={() => window.open(`/niso-quiz/view/${quiz.quizId}`, '_blank')} />
                            </Tooltip>
                        ),
                        <Tooltip title="Xóa">
                            <DeleteOutlined key="delete" style={{ fontSize: 16, color: '#ff4d4f' }} onClick={() => showDeleteModal(quiz)} />
                        </Tooltip>
                    ].filter(Boolean)}
                >
                    <div style={{ marginBottom: 12 }}>
                        <Title level={4} style={{ margin: 0, marginBottom: 8, fontSize: 16 }}>
                            {truncateText(quiz.title || 'Chưa có tiêu đề', 50)}
                        </Title>
                    </div>

                    <Text type="secondary" style={{ display: 'block', marginBottom: 16, lineHeight: 1.5 }}>
                        {truncateText(quiz.description || 'Không có mô tả', 100)}
                    </Text>

                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Space>
                                <QuestionCircleOutlined />
                                <Text strong>{quiz.questions?.length || 0} câu hỏi</Text>
                            </Space>
                            {quiz.status === 'published' && (
                                <Space>
                                    <EyeOutlined />
                                    <Text type="secondary">{quiz.views || 0} lượt xem</Text>
                                </Space>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                                    <span className="avatar-container" style={{ display: 'inline-block', cursor: 'pointer' }}>
                                        {UserAvatar.imgAvatar && UserAvatar.imgAvatar !== 'null' ? (
                                            <Avatar src={UserAvatar.imgAvatar} size="small" />
                                        ) : (
                                            <Avatars user={{ name: authorName }} sizeImg="small" />
                                        )}
                                    </span>
                                </Tooltip>
                                <Text type="secondary">{authorName}</Text>
                            </Space>
                            <Space>
                                <CalendarOutlined />
                                <Text type="secondary">{quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : 'N/A'}</Text>
                            </Space>
                        </div>

                        {quiz.status === 'published' && quiz.attempts && (
                            <div style={{ marginTop: 8 }}>
                                <Space>
                                    <Text type="secondary">{quiz.attempts} lượt làm bài</Text>
                                </Space>
                            </div>
                        )}
                    </Space>
                </Card>
            </Col>
        );
    };

    const tabItems = [
        {
            key: 'published',
            label: (
                <Space>
                    <ClockCircleOutlined />
                    <span>Đã xuất bản</span>
                    <Badge count={quizData.published.length} showZero color="green" />
                </Space>
            ),
            children: (
                <Row gutter={[16, 16]}>
                    {loading ? (
                        <Col span={24} style={{ textAlign: 'center', padding: '20px' }}>
                            <Spin size="small" />
                        </Col>
                    ) : filterQuizzes(quizData.published).length > 0 ? (
                        filterQuizzes(quizData.published).map(renderQuizCard)
                    ) : (
                        <Col span={24}>
                            <Empty
                                description="Không tìm thấy quiz nào"
                            />
                        </Col>
                    )}
                </Row>
            )
        },
        {
            key: 'draft',
            label: (
                <Space>
                    <FileTextOutlined />
                    <span>Bản nháp</span>
                    <Badge count={quizData.draft.length} showZero color="orange" />
                </Space>
            ),
            children: (
                <Row gutter={[16, 16]}>
                    {loading ? (
                        <Col span={24} style={{ textAlign: 'center', padding: '20px' }}>
                            <Spin size="small" />
                        </Col>
                    ) : filterQuizzes(quizData.draft).length > 0 ? (
                        filterQuizzes(quizData.draft).map(renderQuizCard)
                    ) : (
                        <Col span={24}>
                            <Empty
                                description="Không tìm thấy quiz nào"
                            />
                        </Col>
                    )}
                </Row>
            )
        }
    ];

    return (
        <div className='layout_main_niso'>
            <title>NISO | QUIZ DASHBOARD</title>
            <Card bordered={false}>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <Title level={2} style={{ margin: 0, color: '#ae8f3d' }}>
                        Quản lý Quiz
                    </Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>
                        Quản lý tất cả các bài quiz của bạn
                    </Text>
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Input
                        size="middle"
                        placeholder="Tìm kiếm quiz theo tên, mô tả hoặc danh mục..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ borderRadius: 8 }}
                    />
                    <Button
                        type="primary"
                        size="middle"
                        style={{ borderRadius: 8 }}
                        onClick={() => navigate('create')}
                    >
                        Tạo Quiz mới
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    type="card"
                    size="small"
                    items={tabItems}
                    style={{
                        '& .ant-tabs-nav': {
                            marginBottom: 24
                        }
                    }}
                />
            </Card>

            <Modal
                title="Xác nhận xóa"
                open={deleteModalVisible}
                onOk={() => handleDeleteQuiz(quizToDelete?.quizId)}
                onCancel={() => {
                    setDeleteModalVisible(false);
                    setQuizToDelete(null);
                }}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true, loading: deleteLoading }}
                confirmLoading={deleteLoading}
            >
                <p>Bạn có chắc chắn muốn xóa "{quizToDelete?.title}" không?</p>
                <p>Hành động này không thể hoàn tác.</p>
            </Modal>
        </div>
    );
};

export default QuizContainer;