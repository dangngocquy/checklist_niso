import React, { useState, useEffect, useMemo } from 'react';
import {
    Form,
    Select,
    Button,
    Typography,
    message,
    Alert,
    Card,
    Space,
    Spin,
    Tooltip,
    Tag,
    Drawer,
    Table,
    Empty,
    Badge,
    Row,
    Col,
    Popconfirm,
    List,
    Flex,
    Modal,
    InputNumber,
    Input,
} from 'antd';
import {
    SaveOutlined,
    CheckCircleOutlined,
    SyncOutlined,
    PlusOutlined,
    DeleteOutlined,
    EditOutlined,
    SettingOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import DOMPurify from 'dompurify';
import useApi from '../../../hook/useApi';

const { Text, Paragraph } = Typography;
const { Option } = Select;

const ConfigPointsNangCao = ({ checklistId, pointConfig, pointConfigNangCao, solanlaplai, onSave }) => {
    const [form] = Form.useForm();
    const [rankForm] = Form.useForm();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [configPoints, setConfigPoints] = useState(pointConfigNangCao || []);
    const [basicConfig, setBasicConfig] = useState(pointConfig || null);
    const [rankings, setRankings] = useState([]); // State for rankings
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [rankDrawerVisible, setRankDrawerVisible] = useState(false); // Drawer for rankings
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [configType, setConfigType] = useState('basic');
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingRankIndex, setEditingRankIndex] = useState(null); // Index for editing rankings
    const [tablePageSize, setTablePageSize] = useState(5);
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const { request } = useApi();

    // Store initial configurations for comparison
    const initialBasicConfig = useMemo(() => pointConfig || null, [pointConfig]);
    const initialConfigPoints = useMemo(() => pointConfigNangCao || [], [pointConfigNangCao]);
    const initialRankings = useMemo(() => [], []); // Assume rankings are initially empty or fetched

    // Sync local state with props
    useEffect(() => {
        setBasicConfig(pointConfig || null);
        setConfigPoints(pointConfigNangCao || []);
    }, [pointConfig, pointConfigNangCao]);

    // Check for unsaved changes
    useEffect(() => {
        const hasChanges =
            JSON.stringify(basicConfig) !== JSON.stringify(initialBasicConfig) ||
            JSON.stringify(configPoints) !== JSON.stringify(initialConfigPoints) ||
            JSON.stringify(rankings) !== JSON.stringify(initialRankings);
        setUnsavedChanges(hasChanges);
    }, [basicConfig, configPoints, rankings, initialBasicConfig, initialConfigPoints, initialRankings]);

    // Fetch questions
    useEffect(() => {
        const fetchQuestions = async () => {
            setLoading(true);
            try {
                const response = await request({
                    method: 'GET',
                    url: `/checklist/by-checklist/${checklistId}`,
                    headers: {
                        Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
                    },
                });
                setQuestions(Array.isArray(response.questions) ? response.questions : []);
                setBasicConfig(response.pointConfig || null);
                setConfigPoints(response.pointConfigNangCao || []);
                setRankings(response.rankings || []); // Set rankings from response
            } catch (error) {
                console.error('Error fetching questions:', error);
                message.error('Không thể tải danh sách câu hỏi!');
            } finally {
                setLoading(false);
            }
        };

        if (checklistId) {
            fetchQuestions();
        }
    }, [checklistId, request]);

    // Validate basic config
    useEffect(() => {
        if (pointConfig && questions.length > 0) {
            const questionExists = questions.some((q) => q.id === pointConfig.questionId);
            if (!questionExists) {
                setBasicConfig(null);
                console.warn('Câu hỏi đã cấu hình cơ bản không còn tồn tại!');
            }
        }
    }, [questions, pointConfig]);

    // Validate advanced config
    useEffect(() => {
        if (pointConfigNangCao && Array.isArray(pointConfigNangCao) && questions.length > 0) {
            const validConfigs = pointConfigNangCao.filter((config) =>
                questions.some((q) => q.id === config.questionId)
            );
            if (validConfigs.length < pointConfigNangCao.length) {
                setConfigPoints(validConfigs);
                message.warning('Một số câu hỏi đã cấu hình nâng cao không còn tồn tại!');
            }
        }
    }, [questions, pointConfigNangCao]);

    const filteredQuestions =
        questions?.filter((q) => (q.options && q.options.length > 0) || q.tuychonkhac) || [];

    const handleQuestionChange = (value) => {
        setSelectedQuestion(value);
        form.setFieldsValue({ question: value, answer: [] });
    };

    const handleAnswerChange = (values) => {
        form.setFieldsValue({ answer: values });
    };

    const checkSolanlaplai = () => {
        if (solanlaplai !== true) {
            message.error("Cần bật 'Hiển thị số lần lặp lại' để cấu hình điểm nâng cao!");
            return false;
        }
        return true;
    };

    const handleAddConfig = async () => {
        if (configType === 'advanced' && !checkSolanlaplai()) return;

        if (filteredQuestions.length === 0) {
            message.error('Không thể thêm cấu hình vì không có câu hỏi phù hợp!');
            return;
        }

        try {
            const values = await form.validateFields();
            const questionPoint = filteredQuestions.find((q) => q.id === values.question)?.point || 0;
            const isOtherSelected = Array.isArray(values.answer)
                ? values.answer.includes('other')
                : values.answer === 'other';
            const point = configType === 'advanced' && isOtherSelected ? 0 : questionPoint;

            const newConfig = {
                questionId: values.question,
                answer: values.answer,
                point,
            };

            let updatedConfigPoints = [...configPoints];
            let updatedBasicConfig = basicConfig;

            if (isEditMode && editingIndex !== null) {
                updatedConfigPoints[editingIndex] = newConfig;
                setConfigPoints(updatedConfigPoints);
                message.success('Cập nhật cấu hình điểm nâng cao thành công!');
                setIsEditMode(false);
                setEditingIndex(null);
            } else if (configType === 'basic') {
                updatedBasicConfig = newConfig;
                setBasicConfig(updatedBasicConfig);
                message.success('Thêm cấu hình điểm cơ bản thành công!');
            } else {
                updatedConfigPoints = [...configPoints, newConfig];
                setConfigPoints(updatedConfigPoints);
                message.success('Thêm cấu hình điểm nâng cao thành công!');
            }

            form.resetFields();
            setSelectedQuestion(null);
            setDrawerVisible(false);

            if (onSave) {
                onSave({
                    pointConfig: updatedBasicConfig || null,
                    pointConfigNangCao: updatedConfigPoints,
                    rankings,
                    Cauhinhdiem: !!(updatedBasicConfig || updatedConfigPoints.length > 0 || rankings.length > 0),
                });
            }
        } catch (error) {
            console.error('Validation error:', error);
            message.warning('Vui lòng chọn câu hỏi và đáp án!');
        }
    };

    const handleAddRanking = async () => {
        if (!basicConfig && configPoints.length === 0) {
            message.error('Vui lòng thêm ít nhất một cấu hình cơ bản hoặc nâng cao trước khi thêm xếp loại!');
            return;
        }

        try {
            const values = await rankForm.validateFields();
            const newRanking = {
                name: values.name,
                type: values.type,
                threshold: values.threshold,
            };

            // Kiểm tra xem tên và loại đã tồn tại chưa
            const isDuplicate = rankings.some(
                (ranking) =>
                    ranking.name.toLowerCase() === values.name.toLowerCase() &&
                    ranking.type === values.type &&
                    (editingRankIndex === null || rankings[editingRankIndex] !== ranking)
            );

            if (isDuplicate) {
                message.error(`Xếp loại với tên "${values.name}" và loại "${values.type}" đã tồn tại!`);
                return;
            }

            let updatedRankings = [...rankings];

            if (editingRankIndex !== null) {
                updatedRankings[editingRankIndex] = newRanking;
                message.success('Cập nhật xếp loại thành công!');
                setEditingRankIndex(null);
            } else {
                updatedRankings.push(newRanking);
                message.success('Thêm xếp loại thành công!');
            }

            setRankings(updatedRankings);
            rankForm.resetFields();
            setRankDrawerVisible(false);

            if (onSave) {
                onSave({
                    pointConfig: basicConfig || null,
                    pointConfigNangCao: configPoints,
                    rankings: updatedRankings,
                    Cauhinhdiem: !!(basicConfig || configPoints.length > 0 || updatedRankings.length > 0),
                });
            }
        } catch (error) {
            console.error('Validation error:', error);
            message.warning('Vui lòng điền đầy đủ thông tin xếp loại!');
        }
    };

    const handleSave = async () => {
        if (configPoints.length > 0 && !checkSolanlaplai()) return;

        try {
            setSaving(true);
            const dataToSave = {
                pointConfig: basicConfig || null,
                pointConfigNangCao: configPoints.length > 0 ? configPoints : [],
                rankings: rankings.length > 0 ? rankings : [],
                Cauhinhdiem: !!(basicConfig || configPoints.length > 0 || rankings.length > 0),
            };
            const response = await request({
                method: 'PUT',
                url: `/checklist/update-point-config/${checklistId}`,
                data: dataToSave,
                headers: {
                    Authorization: `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`,
                },
            });

            setBasicConfig(response.pointConfig || null);
            setConfigPoints(response.pointConfigNangCao || []);
            setRankings(response.rankings || []);
            setUnsavedChanges(false);

            if (onSave) {
                onSave({
                    pointConfig: response.pointConfig || null,
                    pointConfigNangCao: response.pointConfigNangCao || [],
                    rankings: response.rankings || [],
                    Cauhinhdiem: response.Cauhinhdiem,
                }, true);
            }

            message.success({
                content: 'Lưu tất cả cấu hình điểm thành công!',
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
            });
        } catch (error) {
            console.error('Error saving config:', error);
            message.error(error.response?.data?.message || 'Lưu cấu hình thất bại!');
        } finally {
            setSaving(false);
        }
    };

    const handleDrawerClose = () => {
        if (unsavedChanges) {
            setModalVisible(true);
        } else {
            setDrawerVisible(false);
            setIsEditMode(false);
            setEditingIndex(null);
            form.resetFields();
        }
    };

    const handleRankDrawerClose = () => {
        setRankDrawerVisible(false);
        setEditingRankIndex(null);
        rankForm.resetFields();
    };

    const handleModalSave = async () => {
        await handleSave();
        setModalVisible(false);
        setDrawerVisible(false);
        setIsEditMode(false);
        setEditingIndex(null);
        form.resetFields();
    };

    const handleModalDiscard = () => {
        setModalVisible(false);
        setDrawerVisible(false);
        setIsEditMode(false);
        setEditingIndex(null);
        setBasicConfig(initialBasicConfig);
        setConfigPoints(initialConfigPoints);
        setRankings(initialRankings);
        setUnsavedChanges(false);
        form.resetFields();
    };

    const handleDeleteConfig = (index) => {
        if (!checkSolanlaplai()) return;

        const updatedConfigPoints = configPoints.filter((_, i) => i !== index);
        setConfigPoints([...updatedConfigPoints]);
        message.success('Xóa cấu hình điểm nâng cao thành công!');

        if (onSave) {
            onSave({
                pointConfig: basicConfig || null,
                pointConfigNangCao: updatedConfigPoints,
                rankings,
                Cauhinhdiem: !!(basicConfig || updatedConfigPoints.length > 0 || rankings.length > 0),
            });
        }
    };

    const handleDeleteBasicConfig = () => {
        setBasicConfig(null);
        message.success('Xóa cấu hình điểm cơ bản thành công!');
        if (onSave) {
            onSave({
                pointConfig: null,
                pointConfigNangCao: configPoints,
                rankings,
                Cauhinhdiem: !!(null || configPoints.length > 0 || rankings.length > 0),
            });
        }
    };

    const handleDeleteRanking = (index) => {
        if (!basicConfig && configPoints.length === 0) {
            message.error('Vui lòng thêm ít nhất một cấu hình cơ bản hoặc nâng cao trước khi xóa xếp loại!');
            return;
        }

        const updatedRankings = rankings.filter((_, i) => i !== index);
        setRankings(updatedRankings);
        message.success('Xóa xếp loại thành công!');

        if (onSave) {
            onSave({
                pointConfig: basicConfig || null,
                pointConfigNangCao: configPoints,
                rankings: updatedRankings,
                Cauhinhdiem: !!(basicConfig || configPoints.length > 0 || updatedRankings.length > 0),
            });
        }
    };

    const handleEditConfig = (index) => {
        if (!checkSolanlaplai()) return;

        const config = configPoints[index];
        setSelectedQuestion(config.questionId);
        form.setFieldsValue({
            question: config.questionId,
            answer: config.answer,
        });
        setConfigType('advanced');

        setIsEditMode(true);
        setEditingIndex(index);
        setDrawerVisible(true);
    };

    const handleEditBasicConfig = () => {
        setSelectedQuestion(basicConfig.questionId);
        form.setFieldsValue({
            question: basicConfig.questionId,
            answer: basicConfig.answer,
        });
        setConfigType('basic');
        setDrawerVisible(true);
    };

    const handleEditRanking = (index) => {
        if (!basicConfig && configPoints.length === 0) {
            message.error('Vui lòng thêm ít nhất một cấu hình cơ bản hoặc nâng cao trước khi chỉnh sửa xếp loại!');
            return;
        }

        const ranking = rankings[index];
        rankForm.setFieldsValue({
            name: ranking.name,
            type: ranking.type,
            threshold: ranking.threshold,
        });
        setEditingRankIndex(index);
        setRankDrawerVisible(true);
    };

    const getFilteredAnswerOptions = () => {
        if (!selectedQuestion) return [];
        const question = filteredQuestions.find((q) => q.id === selectedQuestion);
        if (!question || !question.options) return [];
        const options = question.options.map((opt, idx) => ({
            value: opt.tuychon || opt.tuychonnhieu || `option-${idx}`,
            label: opt.tuychon || opt.tuychonnhieu || `Tùy chọn ${idx + 1}`,
        }));
        if (question.tuychonkhac) {
            options.push({ value: 'other', label: 'Khác' });
        }
        return options;
    };

    const sanitizeHTML = (html) => {
        return DOMPurify.sanitize(html);
    };

    const getQuestionContent = (questionId) => {
        const question = filteredQuestions.find((q) => q.id === questionId);
        return question ? (
            <div
                dangerouslySetInnerHTML={{
                    __html: sanitizeHTML(question.content),
                }}
                style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
            />
        ) : (
            'Câu hỏi không tồn tại'
        );
    };

    const configColumns = [
        {
            title: 'Câu hỏi',
            dataIndex: 'questionId',
            key: 'questionId',
            render: getQuestionContent,
            width: '40%',
            ellipsis: true,
        },
        {
            title: 'Đáp án',
            dataIndex: 'answer',
            key: 'answer',
            render: (answers) => (Array.isArray(answers) ? answers.join(', ') : answers),
            width: '30%',
            ellipsis: true,
        },
        {
            title: 'Điểm',
            dataIndex: 'point',
            key: 'point',
            render: (point, record) => {
                const question = questions.find((q) => q.id === record.questionId);
                const isOtherSelected = Array.isArray(record.answer)
                    ? record.answer.includes('other')
                    : record.answer === 'other';
                return question ? (isOtherSelected ? 0 : question.point || 0) : 'N/A';
            },
            width: '10%',
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, __, index) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEditConfig(index)}
                        size="small"
                    />
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa cấu hình này?"
                        onConfirm={() => handleDeleteConfig(index)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                </Space>
            ),
            width: '20%',
        },
    ];

    const rankingColumns = [
        {
            title: 'Tên xếp loại',
            dataIndex: 'name',
            key: 'name',
            width: '30%',
            ellipsis: true,
        },
        {
            title: 'Loại điểm',
            dataIndex: 'type',
            key: 'type',
            render: (type) => (type === 'EARN' ? 'EARN (Điểm)' : 'ARCHIVE (%)'),
            width: '20%',
        },
        {
            title: 'Mức đạt',
            dataIndex: 'threshold',
            key: 'threshold',
            render: (threshold, record) => (
                <span>{threshold} {record.type === 'EARN' ? 'điểm' : '%'}</span>
            ),
            width: '20%',
            sorter: (a, b) => a.threshold - b.threshold, // Sắp xếp theo threshold
            defaultSortOrder: 'ascend', // Sắp xếp tăng dần mặc định
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, __, index) => {
                const isDisabled = !basicConfig && configPoints.length === 0;
                return (
                    <Space>
                        <Tooltip
                            title={
                                isDisabled
                                    ? 'Vui lòng thêm ít nhất một cấu hình cơ bản hoặc nâng cao để chỉnh sửa'
                                    : ''
                            }
                        >
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => handleEditRanking(index)}
                                size="small"
                                disabled={isDisabled}
                            />
                        </Tooltip>
                        <Popconfirm
                            title="Bạn có chắc chắn muốn xóa xếp loại này?"
                            onConfirm={() => handleDeleteRanking(index)}
                            okText="Xóa"
                            cancelText="Hủy"
                            disabled={isDisabled}
                        >
                            <Tooltip
                                title={
                                    isDisabled
                                        ? 'Vui lòng thêm ít nhất một cấu hình cơ bản hoặc nâng cao để xóa'
                                        : ''
                                }
                            >
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    size="small"
                                    disabled={isDisabled}
                                />
                            </Tooltip>
                        </Popconfirm>
                    </Space>
                );
            },
            width: '30%',
        },
    ];

    const isSaveDisabled = !basicConfig && configPoints.length === 0 && rankings.length === 0;

    const renderQuestionStatusTag = () => {
        if (filteredQuestions.length === 0) {
            return <Tag color="error" bordered={false}>Không có câu hỏi phù hợp</Tag>;
        }
        return <Badge status="success" text={`${filteredQuestions.length} câu hỏi có sẵn`} />;
    };

    const renderEmptyState = () => (
        <Empty
            description={
                <Space direction="vertical" size="small">
                    <Text>Chưa có cấu hình nào</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Thêm cấu hình để bắt đầu tính điểm
                    </Text>
                </Space>
            }
        />
    );

    const renderRankingEmptyState = () => (
        <Empty
            description={
                <Space direction="vertical" size="small">
                    <Text>Chưa có xếp loại nào</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Thêm xếp loại để phân loại kết quả
                    </Text>
                </Space>
            }
        />
    );

    const renderLoadingState = () => (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="small" />
            <Text style={{ display: 'block', marginTop: '12px' }}>Đang tải câu hỏi...</Text>
        </div>
    );

    const renderErrorState = (title, description) => (
        <Alert
            message={title}
            description={description}
            type="warning"
            showIcon
            banner
            style={{ marginBottom: '20px' }}
        />
    );

    const renderBasicConfigContent = () => {
        if (loading) {
            return renderLoadingState();
        }

        if (!questions || questions.length === 0) {
            return renderErrorState(
                'Không có câu hỏi nào được tìm thấy',
                'Vui lòng kiểm tra lại checklist hoặc thêm câu hỏi vào checklist.'
            );
        }

        if (filteredQuestions.length === 0) {
            return renderErrorState(
                'Không có câu hỏi nào phù hợp',
                'Chỉ các câu hỏi có tùy chọn hoặc tùy chọn "Khác" mới được hiển thị. Vui lòng kiểm tra cấu hình câu hỏi.'
            );
        }

        if (basicConfig && basicConfig.questionId && (basicConfig.answer || basicConfig.answer?.length > 0)) {
            return (
                <Card
                    bordered={false}
                    className="inner-card"
                    style={{ background: '#f9f9f9', borderRadius: '8px' }}
                >
                    <List
                        itemLayout="vertical"
                        dataSource={[basicConfig]}
                        renderItem={(item) => (
                            <List.Item
                                actions={[
                                    <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        onClick={handleEditBasicConfig}
                                        size="small"
                                    >
                                        Chỉnh sửa
                                    </Button>,
                                    <Popconfirm
                                        title="Bạn có chắc chắn muốn xóa cấu hình này?"
                                        onConfirm={handleDeleteBasicConfig}
                                        okText="Xóa"
                                        cancelText="Hủy"
                                    >
                                        <Button danger icon={<DeleteOutlined />} size="small">
                                            Xóa
                                        </Button>
                                    </Popconfirm>,
                                ]}
                            >
                                <List.Item.Meta
                                    title={
                                        <div>
                                            <Badge status="processing" color="#1890ff" />
                                            <Text strong style={{ marginLeft: 8 }}>
                                                Câu hỏi
                                            </Text>
                                        </div>
                                    }
                                    description={getQuestionContent(item.questionId)}
                                />
                                <div style={{ marginTop: 16 }}>
                                    <div>
                                        <Badge status="success" color="#52c41a" />
                                        <Text strong style={{ marginLeft: 8 }}>
                                            Đáp án
                                        </Text>
                                    </div>
                                    <Paragraph style={{ marginLeft: 16, marginTop: 8 }}>
                                        {Array.isArray(item.answer) ? item.answer.join(', ') : item.answer}
                                    </Paragraph>
                                </div>
                            </List.Item>
                        )}
                    />
                </Card>
            );
        }

        return (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Button
                    type="default"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setConfigType('basic');
                        setDrawerVisible(true);
                    }}
                    size="middle"
                    disabled={filteredQuestions.length === 0}
                >
                    Thêm cấu hình cơ bản
                </Button>
                {filteredQuestions.length === 0 && (
                    <div style={{ marginTop: 16 }}>
                        <Text type="secondary">
                            Không thể thêm cấu hình vì không có câu hỏi phù hợp
                        </Text>
                    </div>
                )}
                {filteredQuestions.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                        <Text type="secondary">
                            Chọn câu hỏi và đáp án điều kiện để bắt đầu tính điểm
                        </Text>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
                <Flex justify="space-between" align="center" wrap>
                    <div>
                        <Typography.Title level={3} style={{ margin: 0 }}>
                            Cấu hình điểm và xếp loại
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            Thiết lập cách tính điểm và xếp loại cho các câu trả lời
                        </Typography.Text>
                    </div>
                    <Button
                        type="primary"
                        onClick={handleSave}
                        loading={saving}
                        icon={saving ? <SyncOutlined spin /> : <SaveOutlined />}
                        size="middle"
                        style={{ marginTop: 15 }}
                        disabled={isSaveDisabled}
                    >
                        {saving ? 'Đang lưu...' : 'Lưu tất cả'}
                    </Button>
                </Flex>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={24}>
                    <Card
                        title={
                            <Space wrap>
                                <SettingOutlined />
                                <span>Cơ bản</span>
                                {renderQuestionStatusTag()}
                            </Space>
                        }
                        extra={
                            <Tooltip title="Chọn câu hỏi và đáp án điều kiện để bắt đầu tính điểm">
                                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                            </Tooltip>
                        }
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        {renderBasicConfigContent()}
                    </Card>
                </Col>

                <Col xs={24} lg={24}>
                    <Card
                        title={
                            <Space>
                                <SettingOutlined />
                                <span>Nâng cao</span>
                                {renderQuestionStatusTag()}
                            </Space>
                        }
                        extra={
                            <Tooltip title="Chọn câu hỏi để áp dụng tính điểm chi tiết">
                                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                            </Tooltip>
                        }
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        <div
                            style={{
                                marginBottom: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                            }}
                        >
                            <Button
                                type="default"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setConfigType('advanced');
                                    setIsEditMode(false);
                                    setEditingIndex(null);
                                    setDrawerVisible(true);
                                    form.resetFields();
                                }}
                                disabled={filteredQuestions.length === 0}
                            >
                                Thêm cấu hình nâng cao
                            </Button>
                        </div>

                        {configPoints.length > 0 ? (
                            <Table
                                key={configPoints.length}
                                columns={configColumns}
                                dataSource={configPoints}
                                rowKey={(record) => record.questionId || Math.random().toString(36).substring(2)}
                                pagination={{
                                    pageSize: tablePageSize,
                                    showSizeChanger: true,
                                    pageSizeOptions: ['5', '10', '20'],
                                    onShowSizeChange: (current, size) => {
                                        setTablePageSize(size);
                                    },
                                    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
                                }}
                                bordered
                                size="middle"
                                scroll={{ x: true }}
                                style={{ width: '100%', whiteSpace: 'nowrap' }}
                                locale={{ emptyText: renderEmptyState() }}
                                summary={() => {
                                    const totalPoints = configPoints.reduce((sum, config) => {
                                        return sum + (config.point !== undefined ? config.point : 0);
                                    }, 0);
                                    return (
                                        <Table.Summary.Row style={{ background: '#f5f5f5', fontWeight: 'bold' }}>
                                            <Table.Summary.Cell index={0} colSpan={configColumns.length}>
                                                Tổng điểm: {totalPoints}
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    );
                                }}
                            />
                        ) : (
                            renderEmptyState()
                        )}
                        <Text>
                            Tổng số cấu hình: <Text strong>{configPoints.length}</Text>
                        </Text>
                    </Card>
                </Col>

                <Col xs={24} lg={24}>
                    <Card
                        title={
                            <Space>
                                <SettingOutlined />
                                <span>Xếp loại</span>
                            </Space>
                        }
                        extra={
                            <Tooltip title="Định nghĩa các mức xếp loại dựa trên EARN hoặc ARCHIVE">
                                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                            </Tooltip>
                        }
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        {!basicConfig && configPoints.length === 0 && (
                            <Alert
                                banner
                                message="Chưa có cấu hình điểm"
                                description="Vui lòng thêm ít nhất một cấu hình cơ bản hoặc nâng cao để quản lý xếp loại."
                                type="warning"
                                showIcon
                                style={{ marginBottom: '16px' }}
                            />
                        )}
                        <div
                            style={{
                                marginBottom: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                            }}
                        >
                            <Button
                                type="default"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setRankDrawerVisible(true);
                                    rankForm.resetFields();
                                    setEditingRankIndex(null);
                                }}
                                disabled={!basicConfig && configPoints.length === 0}
                                title={
                                    !basicConfig && configPoints.length === 0
                                        ? 'Vui lòng thêm ít nhất một cấu hình cơ bản hoặc nâng cao trước khi thêm xếp loại'
                                        : ''
                                }
                            >
                                Thêm xếp loại
                            </Button>
                        </div>

                        <Row gutter={[16, 16]}>
                            {/* Bảng xếp loại EARN */}
                            <Col xs={24} lg={12}>
                                <Typography.Title level={5}>EARN (Điểm)</Typography.Title>
                                {rankings.filter((r) => r.type === 'EARN').length > 0 ? (
                                    <Table
                                        key={`earn-${rankings.length}`}
                                        columns={rankingColumns}
                                        dataSource={rankings.filter((r) => r.type === 'EARN')}
                                        rowKey={(record, index) => `earn-${index}`}
                                        pagination={{
                                            pageSize: tablePageSize,
                                            showSizeChanger: true,
                                            pageSizeOptions: ['5', '10', '20'],
                                            onShowSizeChange: (current, size) => {
                                                setTablePageSize(size);
                                            },
                                            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
                                        }}
                                        bordered
                                        size="middle"
                                        scroll={{ x: true }}
                                        style={{ width: '100%', whiteSpace: 'nowrap' }}
                                        locale={{ emptyText: renderRankingEmptyState() }}
                                    />
                                ) : (
                                    renderRankingEmptyState()
                                )}
                                <Text>
                                    Tổng số xếp loại EARN: <Text strong>{rankings.filter((r) => r.type === 'EARN').length}</Text>
                                </Text>
                            </Col>

                            {/* Bảng xếp loại ARCHIVE */}
                            <Col xs={24} lg={12}>
                                <Typography.Title level={5}>ARCHIVE (%)</Typography.Title>
                                {rankings.filter((r) => r.type === 'ARCHIVE').length > 0 ? (
                                    <Table
                                        key={`archive-${rankings.length}`}
                                        columns={rankingColumns}
                                        dataSource={rankings.filter((r) => r.type === 'ARCHIVE')}
                                        rowKey={(record, index) => `archive-${index}`}
                                        pagination={{
                                            pageSize: tablePageSize,
                                            showSizeChanger: true,
                                            pageSizeOptions: ['5', '10', '20'],
                                            onShowSizeChange: (current, size) => {
                                                setTablePageSize(size);
                                            },
                                            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
                                        }}
                                        bordered
                                        size="middle"
                                        scroll={{ x: true }}
                                        style={{ width: '100%', whiteSpace: 'nowrap' }}
                                        locale={{ emptyText: renderRankingEmptyState() }}
                                    />
                                ) : (
                                    renderRankingEmptyState()
                                )}
                                <Text>
                                    Tổng số xếp loại ARCHIVE: <Text strong>{rankings.filter((r) => r.type === 'ARCHIVE').length}</Text>
                                </Text>
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            <Drawer
                closable={false}
                title={
                    <Space>
                        {isEditMode ? <EditOutlined /> : <PlusOutlined />}
                        <span>
                            {isEditMode
                                ? `Chỉnh sửa cấu hình điểm ${configType === 'basic' ? 'cơ bản' : 'nâng cao'}`
                                : `Thêm cấu hình điểm ${configType === 'basic' ? 'cơ bản' : 'nâng cao'}`}
                        </span>
                    </Space>
                }
                width={520}
                onClose={handleDrawerClose}
                open={drawerVisible}
                bodyStyle={{ paddingBottom: 80 }}
                footer={
                    <div style={{ textAlign: 'right' }}>
                        <Button onClick={handleDrawerClose} style={{ marginRight: 8 }}>
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleAddConfig}
                            disabled={filteredQuestions.length === 0}
                        >
                            {isEditMode ? 'Cập nhật' : 'Thêm'}
                        </Button>
                    </div>
                }
            >
                {loading ? (
                    renderLoadingState()
                ) : !questions || questions.length === 0 ? (
                    renderErrorState(
                        'Không có câu hỏi nào được tìm thấy',
                        'Vui lòng kiểm tra lại checklist hoặc thêm câu hỏi vào checklist.'
                    )
                ) : filteredQuestions.length === 0 ? (
                    renderErrorState(
                        'Không có câu hỏi nào phù hợp',
                        'Chỉ các câu hỏi có tùy chọn hoặc tùy chọn "Khác" mới được hiển thị. Vui lòng kiểm tra cấu hình câu hỏi.'
                    )
                ) : (
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="question"
                            label={
                                <Space>
                                    <Text strong>Chọn câu hỏi</Text>
                                    <Badge count={filteredQuestions.length} style={{ backgroundColor: '#52c41a' }} />
                                </Space>
                            }
                            rules={[{ required: true, message: 'Vui lòng chọn câu hỏi!' }]}
                            tooltip="Chọn một câu hỏi từ danh sách để cấu hình điểm"
                        >
                            <Select
                                placeholder="Chọn câu hỏi"
                                onChange={handleQuestionChange}
                                value={selectedQuestion}
                                allowClear
                                style={{ width: '100%' }}
                                loading={loading}
                                showSearch
                                filterOption={(input, option) =>
                                    option.label.toLowerCase().includes(input.toLowerCase())
                                }
                                notFoundContent={
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="Không tìm thấy câu hỏi nào"
                                    />
                                }
                                listHeight={300}
                                optionLabelProp="label"
                                dropdownStyle={{ maxWidth: '500px' }}
                            >
                                {filteredQuestions.map((question) => (
                                    <Option
                                        key={question.id}
                                        value={question.id}
                                        label={question.content.replace(/<[^>]+>/g, '')}
                                    >
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: sanitizeHTML(question.content),
                                            }}
                                            style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                                        />
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {selectedQuestion && (
                            <>
                                <Form.Item
                                    name="answer"
                                    style={{ marginBottom: 8 }}
                                    label={
                                        <Space>
                                            <Text strong>Chọn đáp án để tính điểm</Text>
                                            {getFilteredAnswerOptions().length > 0 && (
                                                <Badge
                                                    count={getFilteredAnswerOptions().length}
                                                    style={{ backgroundColor: '#1890ff' }}
                                                />
                                            )}
                                        </Space>
                                    }
                                    rules={[
                                        { required: true, message: 'Vui lòng chọn đáp án!' },
                                        {
                                            validator: (_, value) => {
                                                if (!value || (Array.isArray(value) && value.length === 0)) {
                                                    return Promise.reject(
                                                        new Error('Vui lòng chọn ít nhất một đáp án!')
                                                    );
                                                }
                                                return Promise.resolve();
                                            },
                                        },
                                    ]}
                                    tooltip="Chọn một hoặc nhiều đáp án mà người dùng cần chọn để đạt điểm"
                                >
                                    <Select
                                        mode={
                                            filteredQuestions.find((q) => q.id === selectedQuestion)?.tuychonkhac ||
                                                filteredQuestions.find((q) => q.id === selectedQuestion)?.options?.length > 1
                                                ? 'multiple'
                                                : 'default'
                                        }
                                        placeholder="Chọn đáp án"
                                        onChange={handleAnswerChange}
                                        allowClear
                                        style={{ width: '100%' }}
                                        listHeight={250}
                                        showSearch
                                        filterOption={(input, option) =>
                                            option.children.toLowerCase().includes(input.toLowerCase())
                                        }
                                        notFoundContent={
                                            <Empty
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                description="Không tìm thấy đáp án nào"
                                            />
                                        }
                                        maxTagCount={3}
                                        maxTagTextLength={15}
                                    >
                                        {getFilteredAnswerOptions().map((option) => (
                                            <Option key={option.value} value={option.value}>
                                                {option.label}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Typography.Text type="secondary" style={{ marginTop: '16px', marginBottom: '16px' }}>
                                    Lưu ý: Trong cấu hình nâng cao, chọn đáp án "Khác" sẽ gán điểm bằng 0. Trong cấu hình cơ bản, điểm sẽ được lấy từ câu hỏi.
                                </Typography.Text>
                            </>
                        )}

                        {selectedQuestion && (
                            <Alert
                                message="Xem trước câu hỏi"
                                banner
                                description={
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: sanitizeHTML(
                                                filteredQuestions.find((q) => q.id === selectedQuestion)?.content ||
                                                'Câu hỏi không tồn tại'
                                            ),
                                        }}
                                        style={{ marginTop: '8px' }}
                                    />
                                }
                                type="info"
                                showIcon
                                style={{ marginTop: '16px', marginBottom: '16px' }}
                            />
                        )}
                    </Form>
                )}
            </Drawer>

            <Drawer
                closable={false}
                title={
                    <Space>
                        {editingRankIndex !== null ? <EditOutlined /> : <PlusOutlined />}
                        <span>
                            {editingRankIndex !== null ? 'Chỉnh sửa xếp loại' : 'Thêm xếp loại'}
                        </span>
                    </Space>
                }
                width={520}
                onClose={handleRankDrawerClose}
                open={rankDrawerVisible}
                bodyStyle={{ paddingBottom: 80 }}
                footer={
                    <div style={{ textAlign: 'right' }}>
                        <Button onClick={handleRankDrawerClose} style={{ marginRight: 8 }}>
                            Hủy
                        </Button>
                        <Button type="primary" onClick={handleAddRanking}>
                            {editingRankIndex !== null ? 'Cập nhật' : 'Thêm'}
                        </Button>
                    </div>
                }
            >
                <Form form={rankForm} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Tên xếp loại"
                        rules={[{ required: true, message: 'Vui lòng nhập tên xếp loại!' }]}
                        tooltip="Tên của mức xếp loại (ví dụ: Xuất sắc, Tốt, Đạt)"
                    >
                        <Input placeholder="Nhập tên xếp loại" />
                    </Form.Item>
                    <Form.Item
                        name="type"
                        label="Loại điểm"
                        rules={[{ required: true, message: 'Vui lòng chọn loại điểm!' }]}
                        tooltip="Chọn EARN để xếp loại dựa trên điểm hoặc ARCHIVE để xếp loại dựa trên phần trăm"
                    >
                        <Select placeholder="Chọn loại điểm">
                            <Option value="EARN">EARN (Điểm)</Option>
                            <Option value="ARCHIVE">ARCHIVE (%)</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="threshold"
                        label="Mức đạt"
                        dependencies={['type']}
                        rules={[
                            { required: true, message: 'Vui lòng nhập mức đạt!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (value === undefined || value === null) {
                                        return Promise.reject(new Error('Mức đạt không được để trống!'));
                                    }
                                    if (value < 0) {
                                        return Promise.reject(new Error('Mức đạt phải lớn hơn hoặc bằng 0!'));
                                    }
                                    if (getFieldValue('type') === 'ARCHIVE') {
                                        if (value > 100) {
                                            return Promise.reject(new Error('Phần trăm không được vượt quá 100!'));
                                        }
                                        const decimalPlaces = (value.toString().split('.')[1] || '').length;
                                        if (decimalPlaces > 2) {
                                            return Promise.reject(
                                                new Error('Phần trăm chỉ được nhập tối đa 2 chữ số thập phân!')
                                            );
                                        }
                                    }
                                    return Promise.resolve();
                                },
                            }),
                        ]}
                        tooltip="Mức điểm (EARN) hoặc phần trăm (ARCHIVE) để đạt xếp loại này"
                    >
                        <InputNumber
                            min={0}
                            max={rankForm.getFieldValue('type') === 'ARCHIVE' ? 100 : undefined}
                            step={rankForm.getFieldValue('type') === 'ARCHIVE' ? 0.01 : 1}
                            style={{ width: '100%' }}
                            placeholder="Nhập mức đạt"
                            formatter={(value) =>
                                rankForm.getFieldValue('type') === 'ARCHIVE' ? `${value}%` : `${value}`
                            }
                            parser={(value) => value.replace('%', '')}
                        />
                    </Form.Item>
                </Form>
            </Drawer>

            <Modal
                title="Dữ liệu chưa được lưu"
                open={modalVisible}
                onOk={handleModalSave}
                onCancel={handleModalDiscard}
                okText="Lưu"
                cancelText="Hủy"
            >
                <p>Dữ liệu cấu hình hiện chưa được lưu. Bạn có muốn lưu lại không?</p>
            </Modal>
        </Space>
    );
};

export default ConfigPointsNangCao;