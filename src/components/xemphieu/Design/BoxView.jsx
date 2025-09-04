import React, { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import {
    Space,
    Typography,
    Tooltip,
    Avatar,
    Tag,
    Tabs,
    Skeleton,
    Badge,
    Row,
    Col,
    Card,
    List,
    Timeline,
    Collapse,
    Button,
} from 'antd';
import {
    CalendarOutlined,
    AppstoreOutlined,
    ShopOutlined,
    TrophyOutlined,
    StarOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    CalculatorOutlined,
    QuestionCircleOutlined,
    UpOutlined,
    DownOutlined,
    EyeOutlined,
    GlobalOutlined,
    HistoryOutlined,
} from '@ant-design/icons';
import Container from '../../../config/PhieuChecklist/Container';
import Avatars from '../../../config/design/Avatars';
import LocPhieu from '../LocPhieu';
import HistoryUpdate from './HistoryUpdate';
import { useLocation, useNavigate } from 'react-router-dom';

// Lazy load UserInfoCard
const UserInfoCard = lazy(() => import('../../../hook/UserInfoCard'));

const { Text } = Typography;
const { TabPane } = Tabs;

// Hàm kiểm tra câu trả lời sai
const isAnswerIncorrect = (question) => {
    const { answer, cautraloi, xulynhiemvu, luachon, options = [] } = question;

    if (xulynhiemvu) return false;
    if (!cautraloi || cautraloi === '') return false;
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return true;

    const normalizeAnswer = (ans) => String(ans).toLowerCase().trim();
    const correctAnswers = Array.isArray(cautraloi)
        ? cautraloi.map(normalizeAnswer)
        : cautraloi.toLowerCase().split(',').map(normalizeAnswer);

    if (luachon?.option2) {
        const answerLower = normalizeAnswer(answer);
        const isValidOption = options.some(
            (option) => normalizeAnswer(option.tuychon) === answerLower
        );
        return !isValidOption || !correctAnswers.includes(answerLower);
    }

    if (luachon?.option3) {
        const answers = Array.isArray(answer)
            ? answer.map(normalizeAnswer)
            : [normalizeAnswer(answer)].filter(Boolean);
        const areValidOptions = answers.every((ans) =>
            options.some((option) => normalizeAnswer(option.tuychonnhieu) === ans)
        );
        const isAllAnswersCorrect =
            answers.length === correctAnswers.length &&
            answers.every((ans) => correctAnswers.includes(ans)) &&
            correctAnswers.every((ans) => answers.includes(ans));
        return !areValidOptions || !isAllAnswersCorrect;
    }

    if (Array.isArray(answer)) {
        const hasCorrect = answer.every((a) => correctAnswers.includes(normalizeAnswer(a)));
        const hasIncorrect = answer.some((a) => !correctAnswers.includes(normalizeAnswer(a)));
        return !hasCorrect || hasIncorrect;
    } else {
        return !correctAnswers.includes(normalizeAnswer(answer));
    }
};

// Reusable DOMParser for stripHTML
const stripHTML = (() => {
    const parser = new DOMParser();
    return (html) => {
        if (!html) return '';
        const doc = parser.parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    };
})();

// Custom hook for debounced window width
const useWindowWidth = () => {
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        let timeout;
        const handleResize = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => setWidth(window.innerWidth), 100);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return width;
};

// Utility function to get question content
const getQuestionContent = (question) => {
    const questionKey = `Cauhoi${question.index + 1}`;
    return question[questionKey] || 'Câu hỏi không xác định';
};

// Hàm xác định xếp loại
const getRanking = (value, type, rankings) => {
    if (!rankings || !Array.isArray(rankings) || rankings.length === 0) {
        return null;
    }

    const filteredRankings = rankings.filter((r) => r.type === type);
    if (filteredRankings.length === 0) {
        return null;
    }

    const sortedRankings = [...filteredRankings].sort((a, b) => b.threshold - a.threshold);
    let lowestRanking = sortedRankings[sortedRankings.length - 1];

    for (const ranking of sortedRankings) {
        if (type === 'EARN' && parseFloat(value) >= parseFloat(ranking.threshold)) {
            return ranking.name;
        }
        if (type === 'ARCHIVE') {
            const numericValue = parseFloat(value.replace('%', ''));
            if (numericValue >= parseFloat(ranking.threshold)) {
                return ranking.name;
            }
        }
    }

    return lowestRanking ? lowestRanking.name : null;
};

const BoxView = ({
    t,
    data,
    sumPoint,
    getPoint,
    hasPoints,
    loading,
    advancedPoints,
    user,
    autoFilterIncorrect,
    handleFilterChange,
    hasPointPermission,
    hasxlphPermission,
}) => {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const tabFromUrl = searchParams.get('tabs');

    const [activeTab, setActiveTab] = useState(tabFromUrl || '1');
    const [showMore, setShowMore] = useState(false);
    const windowWidth = useWindowWidth();
    const initialDisplayCount = windowWidth < 768 ? 4 : 8;

    // Lưu giá trị data trước đó để so sánh
    const prevDataRef = useRef();

    // Reset activeTab về "1" chỉ khi data thay đổi
    useEffect(() => {
        if (data !== prevDataRef.current && data) {
            setActiveTab('1');
            const newSearchParams = new URLSearchParams(location.search);
            newSearchParams.set('tabs', '1');
            navigate(
                {
                    pathname: location.pathname,
                    search: newSearchParams.toString(),
                },
                { replace: true }
            );
        }
        // Cập nhật prevDataRef sau mỗi lần chạy
        prevDataRef.current = data;
    }, [data, navigate, location.pathname, location.search]);

    // Đồng bộ activeTab với tabFromUrl khi URL thay đổi
    useEffect(() => {
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl);
        }
    }, [tabFromUrl, activeTab]);

    // Kiểm tra sự tồn tại của cautraloi
    const hasCorrectAnswers = useMemo(() => {
        return data?.questions?.some((question) => question.cautraloi && question.cautraloi !== '');
    }, [data?.questions]);

    // Chỉ coi isConfigured là true nếu có Cauhinhdiem và có ít nhất một cautraloi
    const isConfigured = useMemo(() => {
        return data?.Cauhinhdiem && hasCorrectAnswers;
    }, [data?.Cauhinhdiem, hasCorrectAnswers]);

    const { questions, pointConfigNangCao, ConfigPoints, user: dataUser, ngay_phan_hoi, phongban, chi_nhanh, watching } = data || {};

    // Memoize incorrect answers
    const incorrectAnswersMap = useMemo(() => {
        const map = new Map();
        if (questions) {
            questions.forEach((question) => {
                map.set(question.questionId, isAnswerIncorrect(question));
            });
        }
        return map;
    }, [questions]);

    // Tính xếp loại
    const earnRanking = useMemo(() => {
        return getRanking(advancedPoints?.earnPoint ?? '0', 'EARN', data?.rankings);
    }, [advancedPoints?.earnPoint, data]);

    const archiveRanking = useMemo(() => {
        return getRanking(advancedPoints?.getPoint ?? '0', 'ARCHIVE', data?.rankings);
    }, [advancedPoints?.getPoint, data]);

    // Calculate total points, config points, incorrect points, and label
    const { totalPoints, configPointDetails, incorrectPointDetails, configPointsDetail, configLabel } = useMemo(() => {
        let totalPoints = 0;
        const configPointDetails = [];
        const incorrectPointDetails = [];
        let configPointsDetail = null;
        let commonAnswer = null;
        let allAnswersMatch = true;

        if (!questions || !isConfigured) {
            return { totalPoints, configPointDetails, incorrectPointDetails, configPointsDetail, configLabel: 'câu hỏi cấu hình' };
        }

        // Tính tổng điểm tất cả câu hỏi
        questions.forEach((question) => {
            const point = parseFloat(question.point) || 0;
            totalPoints += point;
        });

        // Tạo danh sách câu hỏi đúng trong pointConfigNangCao
        const correctConfigQuestions = new Set();
        if (pointConfigNangCao) {
            pointConfigNangCao.forEach((config) => {
                const configQuestion = questions.find((q) => q.questionId === config.questionId);
                if (configQuestion) {
                    const answerLower = Array.isArray(configQuestion.answer)
                        ? configQuestion.answer.map((a) => String(a || '').toLowerCase().trim()).filter(Boolean)
                        : [String(configQuestion.answer || '').toLowerCase().trim()].filter(Boolean);
                    const configAnswerLower = Array.isArray(config.answer)
                        ? config.answer.map((a) => String(a || '').toLowerCase().trim()).filter(Boolean)
                        : [String(config.answer || '').toLowerCase().trim()].filter(Boolean);

                    const isConfigMatch =
                        answerLower.length === configAnswerLower.length &&
                        answerLower.every((ans) => configAnswerLower.includes(ans)) &&
                        configAnswerLower.every((ans) => answerLower.includes(ans));

                    const questionContent = getQuestionContent(configQuestion);

                    // Chỉ thêm vào configPointDetails nếu câu trả lời đúng
                    if (isConfigMatch) {
                        configPointDetails.push({
                            question: stripHTML(questionContent),
                            answer: configQuestion.answer,
                            expectedAnswer: config.answer,
                            point: parseInt(config.point) || 0,
                            isMatch: isConfigMatch,
                        });
                    }

                    if (isConfigMatch) {
                        correctConfigQuestions.add(configQuestion.questionId);
                        const currentAnswer = configAnswerLower.join(',');
                        if (commonAnswer === null) {
                            commonAnswer = currentAnswer;
                        } else if (commonAnswer !== currentAnswer) {
                            allAnswersMatch = false;
                        }
                    }
                }
            });
        }

        // Tính chi tiết điểm sai, loại bỏ các câu hỏi đúng trong pointConfigNangCao
        questions.forEach((question) => {
            if (incorrectAnswersMap.get(question.questionId) && !correctConfigQuestions.has(question.questionId)) {
                const point = parseFloat(question.point) || 0;
                const laplai = parseInt(question.laplai) || 1;
                const questionContent = getQuestionContent(question);

                incorrectPointDetails.push({
                    question: stripHTML(questionContent),
                    answer: question.answer,
                    expectedAnswer: question.cautraloi,
                    point: point * laplai,
                    laplai,
                });
            }
        });

        // Xử lý câu hỏi điều kiện (ConfigPoints)
        if (ConfigPoints && ConfigPoints.questionId) {
            const configQuestion = questions.find((q) => q.questionId === ConfigPoints.questionId);
            if (configQuestion) {
                const answerLower = Array.isArray(configQuestion.answer)
                    ? configQuestion.answer.map((a) => String(a || '').toLowerCase().trim()).filter(Boolean)
                    : [String(configQuestion.answer || '').toLowerCase().trim()].filter(Boolean);
                const configAnswerLower = Array.isArray(ConfigPoints.answer)
                    ? ConfigPoints.answer.map((a) => String(a || '').toLowerCase().trim()).filter(Boolean)
                    : [String(ConfigPoints.answer || '').toLowerCase().trim()].filter(Boolean);

                const isConfigMatch =
                    answerLower.length === configAnswerLower.length &&
                    answerLower.every((ans) => configAnswerLower.includes(ans)) &&
                    configAnswerLower.every((ans) => answerLower.includes(ans));

                const questionContent = getQuestionContent(configQuestion);

                configPointsDetail = {
                    question: stripHTML(questionContent),
                    answer: configQuestion.answer,
                    expectedAnswer: ConfigPoints.answer,
                    isMatch: isConfigMatch,
                };
            }
        }

        // Tạo configLabel
        let configLabel;
        if (allAnswersMatch && commonAnswer !== null) {
            const displayAnswer = commonAnswer
                .split(',')
                .map((ans) => ans.charAt(0).toUpperCase() + ans.slice(1))
                .join(', ');
            configLabel = `${displayAnswer}`;
        } else {
            configLabel = 'câu hỏi cấu hình';
        }

        return { totalPoints, configPointDetails, incorrectPointDetails, configPointsDetail, configLabel };
    }, [questions, pointConfigNangCao, ConfigPoints, incorrectAnswersMap, isConfigured]);

    // Format totalIncorrectPoints for display
    const formattedTotalIncorrectPoints = useMemo(() => {
        const value = advancedPoints?.totalIncorrectPoints || 0;
        return Number.isInteger(value) ? value.toString() : value.toFixed(1);
    }, [advancedPoints?.totalIncorrectPoints]);

    // Memoize stat blocks
    const statBlocks = useMemo(() => [
        {
            key: 'user',
            content: (
                <div className="stat-block">
                    <Tooltip
                        title={
                            <Suspense fallback={<Skeleton avatar paragraph={{ rows: 2 }} />}>
                                <UserInfoCard user={dataUser} />
                            </Suspense>
                        }
                        placement={windowWidth < 768 ? 'top' : 'right'}
                        color="white"
                        overlayStyle={{ maxWidth: 300 }}
                    >
                        <Space direction="vertical" size="small" align="center" style={{ marginBottom: 8 }}>
                            {dataUser?.imgAvatar ? (
                                <Badge dot status={dataUser.locker ? 'error' : 'success'} offset={[-6.4, 26]}>
                                    <Avatar
                                        src={dataUser.imgAvatar}
                                        size="middle"
                                        onError={() => {
                                            console.log('Error loading avatar:', dataUser.imgAvatar);
                                            return false;
                                        }}
                                        style={{ border: '2px solid #f0f0f0' }}
                                    />
                                </Badge>
                            ) : (
                                <Avatars user={{ name: dataUser?.name ?? 'N/A' }} sizeImg="middle" />
                            )}
                        </Space>
                    </Tooltip>
                    <div className="titleNiso">Người phản hồi</div>
                    <div className="valueNiso">{dataUser?.name ?? 'N/A'}</div>
                </div>
            ),
            colProps: { xs: 12, sm: 8, md: 6, lg: 4.8 },
        },
        {
            key: 'date',
            content: (
                <div className="stat-block">
                    <CalendarOutlined style={{ fontSize: '20px', color: '#1890ff', marginBottom: '8px' }} />
                    <div className="titleNiso">{t('ViewDocs.input7')}</div>
                    <div className="valueNiso">{ngay_phan_hoi ?? 'N/A'}</div>
                </div>
            ),
            colProps: { xs: 12, sm: 8, md: 6, lg: 4.8 },
        },
        {
            key: 'department',
            content: (
                <div className="stat-block">
                    <AppstoreOutlined style={{ fontSize: '20px', color: '#722ed1', marginBottom: '8px' }} />
                    <div className="titleNiso">Khối / Phòng</div>
                    {phongban === 'Khách vãng lai' ? (
                        <Tag color="green" style={{ margin: 0 }}>
                            {t('Department.input267')}
                        </Tag>
                    ) : (
                        <div className="valueNiso">{phongban?.toUpperCase() ?? 'N/A'}</div>
                    )}
                </div>
            ),
            colProps: { xs: 12, sm: 8, md: 6, lg: 4.8 },
        },
        {
            key: 'branch',
            content: (
                <div className="stat-block">
                    <ShopOutlined style={{ fontSize: '20px', color: '#fa8c16', marginBottom: '8px' }} />
                    <div className="titleNiso">Nhà hàng</div>
                    {chi_nhanh === 'Khách vãng lai' ? (
                        <Tag color="green" style={{ margin: 0 }}>
                            {t('Department.input267')}
                        </Tag>
                    ) : (
                        <div className="valueNiso">{chi_nhanh ?? 'N/A'}</div>
                    )}
                </div>
            ),
            colProps: { xs: 12, sm: 8, md: 6, lg: 4.8 },
        },
        {
            key: 'watching',
            content: (
                <div className="stat-block">
                    <EyeOutlined style={{ fontSize: '20px', color: '#ff69b4', marginBottom: '8px' }} />
                    <div className="titleNiso">Lượt theo dõi</div>
                    <div className="point-value">{watching?.length ?? '0'}</div>
                </div>
            ),
            colProps: { xs: 12, sm: 8, md: 6, lg: 4.8 },
        },
        ...(hasPoints
            ? [
                {
                    key: 'points',
                    content: (
                        <div className="stat-block">
                            <TrophyOutlined style={{ fontSize: '20px', color: '#faad14', marginBottom: '8px' }} />
                            <div className="titleNiso">{t('ViewDocs.input8')}</div>
                            <div className="point-value">
                                {sumPoint} ({getPoint})
                            </div>
                        </div>
                    ),
                    colProps: { xs: 12, sm: 8, md: 6, lg: 4.8 },
                },
            ]
            : []),
        ...(isConfigured
            ? [
                {
                    key: 'configPoints',
                    content: (
                        <div className="stat-block">
                            <CheckCircleOutlined style={{ fontSize: '20px', color: 'green', marginBottom: '8px' }} />
                            <div className="titleNiso">Tổng điểm {configLabel}</div>
                            <div className="point-value">{advancedPoints?.totalConfigPoints ?? 0}</div>
                        </div>
                    ),
                    colProps: { xs: 12, sm: 8, md: 6, lg: 4.8 },
                },
                {
                    key: 'incorrectPoints',
                    content: (
                        <div className="stat-block">
                            <CloseCircleOutlined style={{ fontSize: '20px', color: 'red', marginBottom: '8px' }} />
                            <div className="titleNiso">Tổng điểm sai</div>
                            <div className="point-value">{formattedTotalIncorrectPoints}</div>
                        </div>
                    ),
                    colProps: { xs: 12, sm: 8, md: 6, lg: 4.8 },
                },
                {
                    key: 'earn',
                    content: (
                        <div className="stat-block">
                            <TrophyOutlined style={{ fontSize: '20px', color: '#eb2f96', marginBottom: '8px' }} />
                            <div className="titleNiso">EARN</div>
                            <div className="point-value">
                                {advancedPoints?.earnPoint ?? '0'}
                            </div>
                            {earnRanking && (
                                <Tag color="#eb2f96" style={{ marginLeft: 8, fontSize: 12 }}>
                                    {earnRanking}
                                </Tag>
                            )}
                        </div>
                    ),
                    colProps: { xs: 12, sm: 8, md: 6, lg: 4.8 },
                },
                {
                    key: 'archive',
                    content: (
                        <div className="stat-block">
                            <StarOutlined style={{ fontSize: '20px', color: '#13c2c2', marginBottom: '8px' }} />
                            <div className="titleNiso">ARCHIVE</div>
                            <div className="point-value">
                                {advancedPoints?.getPoint ?? '0'}
                            </div>
                            {archiveRanking && (
                                <Tag
                                    color={archiveRanking === null ? 'default' : '#13c2c2'}
                                    style={{ marginLeft: 8, fontSize: 12 }}
                                >
                                    {archiveRanking}
                                </Tag>
                            )}
                        </div>
                    ),
                    colProps: { xs: 12, sm: 8, md: 6, lg: 4.8 },
                },
            ]
            : []),
    ], [
        dataUser,
        ngay_phan_hoi,
        phongban,
        chi_nhanh,
        hasPoints,
        sumPoint,
        getPoint,
        isConfigured,
        configLabel,
        advancedPoints,
        t,
        watching,
        windowWidth,
        earnRanking,
        archiveRanking,
        formattedTotalIncorrectPoints,
    ]);

    const displayedStatBlocks = showMore ? statBlocks : statBlocks.slice(0, initialDisplayCount);

    const handleTabChange = (key) => {
        setActiveTab(key);
        const newSearchParams = new URLSearchParams(location.search);
        newSearchParams.set('tabs', key);
        navigate({
            pathname: location.pathname,
            search: newSearchParams.toString()
        }, { replace: true });
    };

    return (
        <Container
            content={
                <>
                    {loading ? (
                        <div style={{ padding: '24px' }}>
                            <Skeleton active avatar paragraph={{ rows: 4 }} />
                        </div>
                    ) : (
                        data && (
                            <Tabs
                                size="small"
                                activeKey={activeTab}
                                onChange={handleTabChange}
                                tabBarStyle={{ marginBottom: 0, paddingLeft: 16, paddingRight: 16 }}
                                tabBarExtraContent={
                                    <div style={{ padding: '8px 0' }}>
                                        <LocPhieu
                                            data={data}
                                            onFilterChange={handleFilterChange}
                                            autoFilterIncorrect={autoFilterIncorrect}
                                            hasPointPermission={hasPointPermission}
                                        />
                                    </div>
                                }
                            >
                                <TabPane
                                    tab={
                                        <span>
                                            <AppstoreOutlined /> Thông tin
                                        </span>
                                    }
                                    key="1"
                                >
                                    <div style={{ padding: '20px' }}>
                                        <Row gutter={[16, 16]} className="stat-blocks-container">
                                            {displayedStatBlocks.map((block) => (
                                                <Col key={block.key} {...block.colProps} className="stat-block-item">
                                                    {block.content}
                                                </Col>
                                            ))}
                                        </Row>
                                        {statBlocks.length > initialDisplayCount && (
                                            <div className="expand-button-container">
                                                <Button
                                                    type="text"
                                                    onClick={() => setShowMore(!showMore)}
                                                    className="expand-button"
                                                    icon={showMore ? <UpOutlined /> : <DownOutlined />}
                                                >
                                                    {showMore ? 'Thu gọn' : 'Xem thêm'}
                                                </Button>
                                            </div>
                                        )}
                                        {!user && (
                                            <div style={{ marginTop: window.innerWidth < 768 ? '11px' : '20px', borderRadius: '6px', opacity: '0.5' }}>
                                                <Tooltip title="Bất kỳ ai có liên kết đều có thể xem phiếu này" placement="left">
                                                    <Text style={{ fontSize: '11px', color: '#52c41a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <GlobalOutlined /> Mọi người có thể xem phiếu này
                                                    </Text>
                                                </Tooltip>
                                            </div>
                                        )}
                                    </div>
                                </TabPane>
                                {isConfigured && (
                                    <TabPane
                                        tab={
                                            <span>
                                                <StarOutlined /> Chi tiết điểm
                                            </span>
                                        }
                                        key="2"
                                    >
                                        <div style={{ padding: '20px' }}>
                                            <Card
                                                size="small"
                                                title={
                                                    <div className="title">
                                                        <CalculatorOutlined style={{ marginRight: 8, color: '#8a6a16' }} />
                                                        <span style={{ color: '#8a6a16' }}>Giải thích cách tính điểm</span>
                                                    </div>
                                                }
                                                headStyle={{ backgroundColor: 'rgba(244, 235, 216, 0.6)' }}
                                                bodyStyle={{ padding: '12px 16px' }}
                                                bordered={false}
                                                style={{ boxShadow: 'none' }}
                                            >
                                                <Timeline>
                                                    <Timeline.Item
                                                        style={{ marginTop: 8 }}
                                                        dot={<TrophyOutlined style={{ fontSize: '16px', color: '#faad14' }} />}
                                                        color="blue"
                                                    >
                                                        <Text strong style={{ fontSize: '14px' }}>
                                                            Tổng điểm: {totalPoints} điểm
                                                        </Text>
                                                        <Collapse ghost size="small" style={{ marginLeft: 8 }}>
                                                            <Collapse.Panel
                                                                header={<Text type="secondary" style={{ fontSize: '13px' }}>Xem chi tiết</Text>}
                                                                key="1"
                                                            >
                                                                <List
                                                                    size="small"
                                                                    dataSource={questions?.slice(0, 3) || []}
                                                                    renderItem={(question) => {
                                                                        const questionContent = getQuestionContent(question);
                                                                        return (
                                                                            <List.Item style={{ padding: '4px 0' }}>
                                                                                <Tag color="cyan" bordered={false} style={{ marginRight: 8 }}>
                                                                                    {question.point} điểm
                                                                                </Tag>
                                                                                <Text ellipsis style={{ maxWidth: '90%' }} title={stripHTML(questionContent)}>
                                                                                    {stripHTML(questionContent)}
                                                                                </Text>
                                                                            </List.Item>
                                                                        );
                                                                    }}
                                                                    footer={
                                                                        questions?.length > 3 ? (
                                                                            <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                                                                                ...và {questions.length - 3} câu hỏi khác
                                                                            </Text>
                                                                        ) : null
                                                                    }
                                                                />
                                                            </Collapse.Panel>
                                                        </Collapse>
                                                    </Timeline.Item>

                                                    {configPointsDetail && (
                                                        <Timeline.Item
                                                            dot={<QuestionCircleOutlined style={{ fontSize: '16px', color: '#1890ff' }} />}
                                                            color="blue"
                                                        >
                                                            <Text strong style={{ fontSize: '14px' }}>Câu hỏi điều kiện</Text>
                                                            <Collapse ghost size="small" style={{ marginLeft: 8 }}>
                                                                <Collapse.Panel
                                                                    header={<Text type="secondary" style={{ fontSize: '13px' }}>Xem chi tiết</Text>}
                                                                    key="1"
                                                                >
                                                                    <List
                                                                        size="small"
                                                                        dataSource={[configPointsDetail]}
                                                                        renderItem={(item) => (
                                                                            <List.Item style={{ padding: '4px 0' }}>
                                                                                {item.isMatch ? (
                                                                                    <Tag color="success" bordered={false} style={{ marginRight: 8 }}>
                                                                                        Đúng
                                                                                    </Tag>
                                                                                ) : (
                                                                                    <Tag color="error" bordered={false} style={{ marginRight: 8 }}>
                                                                                        Không đúng
                                                                                    </Tag>
                                                                                )}
                                                                                <Tooltip
                                                                                    title={`Trả lời: ${Array.isArray(item.answer) ? item.answer.join(', ') : item.answer}`}
                                                                                >
                                                                                    <Text ellipsis style={{ maxWidth: '75%' }} title={item.question}>
                                                                                        {item.question}
                                                                                    </Text>
                                                                                </Tooltip>
                                                                            </List.Item>
                                                                        )}
                                                                    />
                                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                                        {configPointsDetail.isMatch
                                                                            ? 'Câu hỏi này trả lời đúng, điểm của bạn được tính.'
                                                                            : 'Câu hỏi này trả lời không đúng, điểm của bạn sẽ không được tính.'}
                                                                    </Text>
                                                                </Collapse.Panel>
                                                            </Collapse>
                                                        </Timeline.Item>
                                                    )}

                                                    <Timeline.Item
                                                        dot={<CheckCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />}
                                                        color="green"
                                                    >
                                                        <Text strong style={{ fontSize: '14px' }}>
                                                            Tổng điểm {configLabel}: {advancedPoints?.totalConfigPoints ?? 0} điểm
                                                        </Text>
                                                        {configPointDetails.length > 0 && (
                                                            <Collapse ghost size="small" style={{ marginLeft: 8 }}>
                                                                <Collapse.Panel
                                                                    header={
                                                                        <Text type="secondary" style={{ fontSize: '13px' }}>
                                                                            Xem chi tiết ({configPointDetails.length})
                                                                        </Text>
                                                                    }
                                                                    key="1"
                                                                >
                                                                    <List
                                                                        size="small"
                                                                        dataSource={configPointDetails.slice(0, 10)}
                                                                        renderItem={(item) => (
                                                                            <List.Item style={{ padding: '4px 0' }}>
                                                                                <Tag color="success" bordered={false} style={{ marginRight: 8 }}>
                                                                                    Đúng: {item.point} điểm
                                                                                </Tag>
                                                                                <Text ellipsis style={{ maxWidth: '75%' }} title={item.question}>
                                                                                    {item.question}
                                                                                </Text>
                                                                            </List.Item>
                                                                        )}
                                                                        footer={
                                                                            configPointDetails.length > 10 ? (
                                                                                <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                                                                                    ...và {configPointDetails.length - 10} câu hỏi khác
                                                                                </Text>
                                                                            ) : null
                                                                        }
                                                                    />
                                                                </Collapse.Panel>
                                                            </Collapse>
                                                        )}
                                                    </Timeline.Item>

                                                    <Timeline.Item
                                                        dot={<CloseCircleOutlined style={{ fontSize: '16px', color: '#f5222d' }} />}
                                                        color="red"
                                                    >
                                                        <Text strong style={{ fontSize: '14px' }}>
                                                            Tổng điểm sai: {formattedTotalIncorrectPoints} điểm
                                                        </Text>
                                                        {incorrectPointDetails.length > 0 && (
                                                            <Collapse ghost size="small" style={{ marginLeft: 8 }}>
                                                                <Collapse.Panel
                                                                    header={
                                                                        <Text type="secondary" style={{ fontSize: '13px' }}>
                                                                            Xem chi tiết ({incorrectPointDetails.length})
                                                                        </Text>
                                                                    }
                                                                    key="1"
                                                                >
                                                                    <List
                                                                        size="small"
                                                                        dataSource={incorrectPointDetails.slice(0, 10)}
                                                                        renderItem={(item) => (
                                                                            <List.Item style={{ padding: '4px 0' }}>
                                                                                <Tag color="error" style={{ marginRight: 8 }} bordered={false}>
                                                                                    -{item.point} điểm
                                                                                </Tag>
                                                                                <Tooltip
                                                                                    title={`Trả lời: ${Array.isArray(item.answer) ? item.answer.join(', ') : item.answer}`}
                                                                                >
                                                                                    <Text ellipsis style={{ maxWidth: '75%' }}>
                                                                                        {item.question} {item.laplai > 1 ? <Tag size="small" bordered={false}>x{item.laplai}</Tag> : ''}
                                                                                    </Text>
                                                                                </Tooltip>
                                                                            </List.Item>
                                                                        )}
                                                                        footer={
                                                                            incorrectPointDetails.length > 10 ? (
                                                                                <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                                                                                    ...và {incorrectPointDetails.length - 10} câu hỏi khác
                                                                                </Text>
                                                                            ) : null
                                                                        }
                                                                    />
                                                                </Collapse.Panel>
                                                            </Collapse>
                                                        )}
                                                    </Timeline.Item>

                                                    <Timeline.Item
                                                        dot={<TrophyOutlined style={{ fontSize: '16px', color: '#eb2f96' }} />}
                                                        color="pink"
                                                    >
                                                        <Space direction="vertical" size={1} style={{ width: '100%' }}>
                                                            <Text strong style={{ fontSize: '14px' }}>
                                                                EARN: {advancedPoints?.earnPoint ?? '0'} điểm
                                                            </Text>
                                                            <Text type="secondary" style={{ fontSize: '13px' }}>
                                                                EARN = Tổng điểm - (Tổng điểm {configLabel} + Tổng điểm sai)
                                                            </Text>
                                                            <Tag style={{ fontSize: '12px' }}>
                                                                {totalPoints} - ({advancedPoints?.totalConfigPoints ?? 0} + {formattedTotalIncorrectPoints}) = {advancedPoints?.earnPoint ?? '0'}
                                                            </Tag>
                                                        </Space>
                                                    </Timeline.Item>

                                                    <Timeline.Item
                                                        dot={<StarOutlined style={{ fontSize: '16px', color: '#13c2c2' }} />}
                                                        color="cyan"
                                                    >
                                                        <Space direction="vertical" size={1} style={{ width: '100%' }}>
                                                            <Text strong style={{ fontSize: '14px' }}>
                                                                ARCHIVE: {advancedPoints?.getPoint ?? '0'}
                                                            </Text>
                                                            <Text type="secondary" style={{ fontSize: '13px' }}>
                                                                ARCHIVE = EARN / (Tổng điểm - Tổng điểm {configLabel})
                                                            </Text>
                                                            <Tag style={{ fontSize: '12px' }}>
                                                                {advancedPoints?.earnPoint ?? '0'} / ({totalPoints} - {advancedPoints?.totalConfigPoints ?? 0}) = {(parseFloat(advancedPoints?.getPoint) || 0).toFixed(2)}%
                                                            </Tag>
                                                        </Space>
                                                    </Timeline.Item>
                                                </Timeline>
                                            </Card>
                                        </div>
                                    </TabPane>
                                )}
                                {(user.phanquyen === true || user.phanquyen === 'Xử lý yêu cầu' || hasxlphPermission === true) && incorrectPointDetails.length > 0 && data?.yeucauxuly === true ? (
                                    <TabPane
                                        tab={
                                            <span>
                                                <HistoryOutlined /> Lịch sử xử lý
                                            </span>
                                        }
                                        key="3"
                                    >
                                        <HistoryUpdate historyCheck={data?.historyCheck || []} />
                                    </TabPane>
                                ) : null}
                            </Tabs>
                        )
                    )}
                </>
            }
        />
    );
};

export default React.memo(BoxView);