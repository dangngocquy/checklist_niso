import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Divider, Modal, Layout, Drawer, Dropdown, message } from 'antd';
import { PlusOutlined, UploadOutlined, PlayCircleOutlined, MinusOutlined, ArrowLeftOutlined, FileImageOutlined, LayoutOutlined, FontSizeOutlined, ProfileOutlined, UnorderedListOutlined, FileTextOutlined, QuestionOutlined, MenuUnfoldOutlined, MenuFoldOutlined, SettingOutlined, MoreOutlined } from '@ant-design/icons';
import { IoIosColorPalette } from "react-icons/io";
import axios from 'axios';
import BackgroundQuiz from './Design/BackgroundQuiz';
import ModalQuiz from './Design/ModalQuiz';
import useImagePicker from '../../hook/useImagePicker';
import ImageQuiz from './Design/ImageQuiz';
import { IoTriangle } from "react-icons/io5";
import { FaDiamond, FaSquare } from "react-icons/fa6";
import { FaCircle } from "react-icons/fa";
import { TbTriangleInvertedFilled } from "react-icons/tb";
import { PiParallelogramFill } from "react-icons/pi";
import MultipleChoice from './Question/MultipleChoice';
import FillBlank from './Question/FillBlank';
import TrueFalse from './Question/Truefalse';
import SlideClassic from './Slide/SlideClassic';
import SlideLargeTitle from './Slide/SlideLargeTitle';
import SlideTitleContent from './Slide/SlideTitleContent';
import SlideBullets from './Slide/SlideBullets';
import SlideQuote from './Slide/SlideQuote';
import SlideLargeMedia from './Slide/SlideLargeMedia';
import SlideText from './Slide/SlideText';
import QuestionSlideComponent from './Design/QuestionSlideComponent';
import bg20 from '../../assets/QuizBackground/19.webp';
import SlideComponent from './Design/SlideComponent';
import { useOutletContext } from 'react-router-dom';

const { Option } = Select;
const { Sider } = Layout;

const CreateQuiz = ({ user }) => { // Nhận userKeys từ props
    const [questions, setQuestions] = useState([
        {
            type: 'multiple-choice',
            question: '',
            image: null,
            answers: [
                { text: '', correct: true, color: 'red', image: null },
                { text: '', correct: false, color: 'blue', image: null },
                { text: '', correct: false, color: 'yellow', image: null },
                { text: '', correct: false, color: 'green', image: null }
            ],
            timeLimit: 20,
            points: 'standard',
            answerType: 'single'
        }
    ]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(questions[0]);
    const [isBackgroundDrawerVisible, setIsBackgroundDrawerVisible] = useState(false);
    const [selectedBackground, setSelectedBackground] = useState(null);
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);
    const [currentAnswerIndex, setCurrentAnswerIndex] = useState(null);
    const [isSlideModalVisible, setIsSlideModalVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
    const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [quizTitle, setQuizTitle] = useState('');
    const [quizDescription, setQuizDescription] = useState('');

    const {
        fileList,
        searchTerm,
        giphyResults,
        loading,
        selectedMenu,
        youtubeUrl,
        youtubeResults,
        handleOk,
        handleCancel,
        handleSearch,
        handleMenuSelect,
        handleSelectGiphy,
        handleYouTubeSearch,
        setYoutubeUrl
    } = useImagePicker();

    const answerColors = [
        { color: '#ff6b6b', shape: <IoTriangle />, bg: '#ff6b6b', shadowColor: 'rgba(255, 107, 107, 0.3)' },
        { color: 'rgb(19, 104, 206)', shape: <FaDiamond />, bg: 'rgb(19, 104, 206)', shadowColor: 'rgb(19, 104, 206, 0.3)' },
        { color: 'rgb(216, 158, 0)', shape: <FaCircle />, bg: 'rgb(216, 158, 0)', shadowColor: 'rgb(216, 158, 0, 0.3)' },
        { color: '#95e1d3', shape: <FaSquare />, bg: '#95e1d3', shadowColor: 'rgba(149, 225, 211, 0.3)' },
        { color: '#a97aff', shape: <PiParallelogramFill />, bg: '#a97aff', shadowColor: 'rgba(169, 122, 255, 0.3)' },
        { color: 'rgb(134, 76, 191)', shape: <TbTriangleInvertedFilled />, bg: 'rgb(134, 76, 191)', shadowColor: 'rgba(134, 76, 191, 0.3)' }
    ];

    const { siderCollapsed } = useOutletContext();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (currentQuestionIndex !== -1) {
            setQuestions(prevQuestions => {
                const updatedQuestions = [...prevQuestions];
                updatedQuestions[currentQuestionIndex] = { ...currentQuestion };
                return updatedQuestions;
            });
        }
    }, [currentQuestion, currentQuestionIndex]);

    const isQuestionComplete = (question) => {
        if (question) {
            if (question.type.startsWith('slide-')) {
                switch (question.type) {
                    case 'slide-classic':
                        return question.image;
                    case 'slide-large-title':
                        return question.title?.trim();
                    case 'slide-title-content':
                        return question.title?.trim() || question.content?.trim();
                    case 'slide-bullets':
                        return question.items?.length > 0 && question.items[0]?.trim();
                    case 'slide-quote':
                        return question.quote?.trim();
                    case 'slide-large-media':
                        return question.image;
                    case 'slide-text':
                        return question.content?.trim();
                    default:
                        return true;
                }
            }
            if (!question.question?.trim()) return false;
            if (question.type === 'true-false') {
                return true;
            }
            if (question.type === 'fill-blank') {
                return question.answers.some(answer => answer.text.trim() || answer.image);
            }
            return question.answers.every(answer => answer.text.trim() || answer.image) &&
                question.answers.some(answer => answer.correct);
        }
        return false;
    };

    const areAllQuestionsComplete = () => {
        return questions.every(question => isQuestionComplete(question));
    };

    const handleSelectQuestion = (index) => {
        if (currentQuestionIndex !== -1) {
            const updatedQuestions = [...questions];
            updatedQuestions[currentQuestionIndex] = { ...currentQuestion };
            setQuestions(updatedQuestions);
        }

        setCurrentQuestionIndex(index);
        setCurrentQuestion({ ...questions[index] });
    };

    const handleGoBack = () => {
        if (isQuestionComplete(currentQuestion)) {
            const updatedQuestions = [...questions];
            updatedQuestions[currentQuestionIndex] = { ...currentQuestion };
            setQuestions(updatedQuestions);
        }
        window.history.back();
    };

    const handleSaveQuiz = async (isDraft = false) => {
        if (!isDraft && !areAllQuestionsComplete()) {
            Modal.warning({
                title: 'Câu hỏi hoặc slide chưa hoàn chỉnh',
                content: 'Vui lòng điền đầy đủ tất cả câu hỏi hoặc slide trước khi lưu.',
            });
            return;
        }
        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = { ...currentQuestion };
        setQuestions(updatedQuestions);

        setIsSaveModalVisible(true);
        setSaveLoading(false);
    };

    const handleSaveConfirm = async () => {
        if (!quizTitle.trim()) {
            message.error('Vui lòng nhập tiêu đề quiz');
            return;
        }

        setSaveLoading(true);
        try {
            const response = await axios.post('/api/quizzes/save', {
                title: quizTitle,
                description: quizDescription,
                questions: questions,
                userKeys: user.keys,
                isDraft: false,
                background: selectedBackground || bg20
            }, {
                headers: {
                    'Authorization': 'Basic ' + btoa(process.env.REACT_APP_API_USERNAME),
                    'Content-Type': 'application/json'
                },
            });

            if (response.data.success) {
                message.success('Đã lưu quiz thành công!');
                setIsSaveModalVisible(false);
                setQuizTitle('');
                setQuizDescription('');
            } else {
                message.error(`Lỗi khi lưu quiz: ${response.data.message}`);
            }
        } catch (error) {
            console.error('Error saving quiz:', error);
            if (error.code === 'ERR_NETWORK') {
                message.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.');
            } else if (error.response) {
                message.error(`Lỗi từ máy chủ: ${error.response.data.message || 'Đã xảy ra lỗi không xác định'}`);
            } else {
                message.error(`Lỗi khi lưu quiz: ${error.message}`);
            }
        } finally {
            setSaveLoading(false);
        }
    };

    const handlePreviewQuiz = () => {
        if (!areAllQuestionsComplete()) {
            Modal.warning({
                title: 'Câu hỏi hoặc slide chưa hoàn chỉnh',
                content: 'Vui lòng điền đầy đủ tất cả câu hỏi hoặc slide trước khi xem trước.',
            });
            return;
        }
        setIsPreviewModalVisible(true);
    };

    const handleDuplicateQuestion = () => {
        if (!isQuestionComplete(currentQuestion)) {
            Modal.warning({
                title: 'Câu hỏi chưa hoàn chỉnh',
                content: 'Vui lòng hoàn thành câu hỏi hoặc slide trước khi sao chép.',
            });
            return;
        }
        const duplicatedQuestion = {
            ...currentQuestion,
            question: currentQuestion.question || currentQuestion.title || 'Câu hỏi mới'
        };
        setQuestions([...questions, duplicatedQuestion]);
        setCurrentQuestionIndex(questions.length);
        setCurrentQuestion(duplicatedQuestion);
        message.success('Đã sao chép câu hỏi thành công!');
    };

    const handleDeleteQuestion = (index) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc muốn xóa câu hỏi hoặc slide này?',
            onOk: () => {
                const updatedQuestions = questions.filter((_, i) => i !== index);
                setQuestions(updatedQuestions);
                if (currentQuestionIndex === index) {
                    if (updatedQuestions.length > 0) {
                        setCurrentQuestionIndex(0);
                        setCurrentQuestion({ ...updatedQuestions[0] });
                    } else {
                        setCurrentQuestionIndex(-1);
                        setCurrentQuestion({
                            type: 'multiple-choice',
                            question: '',
                            image: null,
                            answers: [
                                { text: '', correct: true, color: 'red', image: null },
                                { text: '', correct: false, color: 'blue', image: null },
                                { text: '', correct: false, color: 'yellow', image: null },
                                { text: '', correct: false, color: 'green', image: null }
                            ],
                            timeLimit: 20,
                            points: 'standard',
                            answerType: 'single'
                        });
                    }
                } else if (currentQuestionIndex > index) {
                    setCurrentQuestionIndex(currentQuestionIndex - 1);
                }
                message.success('Đã xóa câu hỏi thành công!');
            }
        });
    };

    const updateAnswer = (index, field, value) => {
        const updatedAnswers = [...currentQuestion.answers];
        updatedAnswers[index][field] = value;
        if (field === 'correct' && currentQuestion.answerType === 'single') {
            updatedAnswers.forEach((answer, i) => {
                if (i !== index) answer.correct = false;
            });
        }
        setCurrentQuestion({ ...currentQuestion, answers: updatedAnswers });
    };

    const handleToggleAnswers = () => {
        if (currentQuestion.type === 'true-false') return;
        if (currentQuestion.type === 'fill-blank') {
            if (currentQuestion.answers.length > 1) {
                const updatedAnswers = [currentQuestion.answers[0]];
                const updatedQuestion = {
                    ...currentQuestion,
                    answers: updatedAnswers
                };
                setCurrentQuestion(updatedQuestion);
                const updatedQuestions = [...questions];
                updatedQuestions[currentQuestionIndex] = updatedQuestion;
                setQuestions(updatedQuestions);
            } else {
                const newAnswers = [
                    { text: '', correct: true, color: '#4ecdc4', image: null },
                    { text: '', correct: true, color: '#a97aff', image: null },
                    { text: '', correct: true, color: '#ff6b6b', image: null }
                ];
                const updatedQuestion = {
                    ...currentQuestion,
                    answers: [...currentQuestion.answers, ...newAnswers]
                };
                setCurrentQuestion(updatedQuestion);
                const updatedQuestions = [...questions];
                updatedQuestions[currentQuestionIndex] = updatedQuestion;
                setQuestions(updatedQuestions);
            }
        } else {
            if (currentQuestion.answers.length >= 6) {
                const updatedAnswers = currentQuestion.answers.slice(0, 4);
                const updatedQuestion = {
                    ...currentQuestion,
                    answers: updatedAnswers
                };
                setCurrentQuestion(updatedQuestion);
                const updatedQuestions = [...questions];
                updatedQuestions[currentQuestionIndex] = updatedQuestion;
                setQuestions(updatedQuestions);
            } else {
                const newAnswers = [
                    {
                        text: '',
                        correct: false,
                        color: answerColors[currentQuestion.answers.length % answerColors.length].color,
                        image: null
                    },
                    {
                        text: '',
                        correct: false,
                        color: answerColors[(currentQuestion.answers.length + 1) % answerColors.length].color,
                        image: null
                    }
                ];
                const updatedQuestion = {
                    ...currentQuestion,
                    answers: [...currentQuestion.answers, ...newAnswers]
                };
                setCurrentQuestion(updatedQuestion);
                const updatedQuestions = [...questions];
                updatedQuestions[currentQuestionIndex] = updatedQuestion;
                setQuestions(updatedQuestions);
            }
        }
    };

    const handleAddQuestionClick = () => {
        if (isQuestionComplete(currentQuestion)) {
            const updatedQuestions = [...questions];
            updatedQuestions[currentQuestionIndex] = { ...currentQuestion };
            setQuestions(updatedQuestions);
        }
        setIsModalVisible(true);
    };

    const handleModalOk = (type) => {
        const newQuestion = {
            type: type || 'multiple-choice',
            question: '',
            image: null,
            answers: type === 'true-false' ? [
                { text: 'Đúng', correct: true, color: 'green', image: null },
                { text: 'Sai', correct: false, color: 'red', image: null }
            ] : type === 'fill-blank' ? [
                { text: '', correct: true, color: 'red', image: null }
            ] : [
                { text: '', correct: true, color: 'red', image: null },
                { text: '', correct: false, color: 'blue', image: null },
                { text: '', correct: false, color: 'yellow', image: null },
                { text: '', correct: false, color: 'green', image: null }
            ],
            timeLimit: 20,
            points: 'standard',
            answerType: type === 'true-false' ? 'single' : 'single'
        };
        setQuestions([...questions, newQuestion]);
        setCurrentQuestion(newQuestion);
        setCurrentQuestionIndex(questions.length);
        setIsModalVisible(false);
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
    };

    const handleImageModalOpen = (answerIndex) => {
        handleMenuSelect({ key: 'trending' });
        setCurrentAnswerIndex(answerIndex);
        setIsImageModalVisible(true);
    };

    const handleImageModalOk = () => {
        if (fileList.length > 0 && currentAnswerIndex !== null) {
            const updatedAnswers = [...currentQuestion.answers];
            updatedAnswers[currentAnswerIndex].image = fileList[0];
            setCurrentQuestion({ ...currentQuestion, answers: updatedAnswers });
        } else if (fileList.length > 0) {
            setCurrentQuestion({ ...currentQuestion, image: fileList[0] });
        }
        setIsImageModalVisible(false);
        setCurrentAnswerIndex(null);
        handleOk();
    };

    const handleImageModalCancel = () => {
        setIsImageModalVisible(false);
        setCurrentAnswerIndex(null);
        handleCancel();
    };

    const moveQuestion = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= questions.length) return;
        const reorderedQuestions = Array.from(questions);
        const [movedQuestion] = reorderedQuestions.splice(index, 1);
        reorderedQuestions.splice(newIndex, 0, movedQuestion);
        setQuestions(reorderedQuestions);
        if (index === currentQuestionIndex) {
            setCurrentQuestionIndex(newIndex);
        } else if (
            index < currentQuestionIndex &&
            newIndex >= currentQuestionIndex
        ) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        } else if (
            index > currentQuestionIndex &&
            newIndex <= currentQuestionIndex
        ) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handleBackgroundSelect = (backgroundSrc) => {
        setSelectedBackground(backgroundSrc);
        setIsBackgroundDrawerVisible(false);
    };

    const handleSlideModalOk = (type) => {
        if (currentQuestionIndex !== -1) {
            const updatedQuestions = [...questions];
            updatedQuestions[currentQuestionIndex] = { ...currentQuestion };
            setQuestions(updatedQuestions);
        }

        let newSlide;
        switch (type) {
            case 'slide-classic':
                newSlide = { type: 'slide-classic', image: null };
                break;
            case 'slide-large-title':
                newSlide = { type: 'slide-large-title', title: '', subtitle: '', image: null };
                break;
            case 'slide-title-content':
                newSlide = { type: 'slide-title-content', title: '', content: '', image: null };
                break;
            case 'slide-bullets':
                newSlide = { type: 'slide-bullets', items: [], image: null };
                break;
            case 'slide-quote':
                newSlide = { type: 'slide-quote', quote: '', author: '' };
                break;
            case 'slide-large-media':
                newSlide = { type: 'slide-large-media', image: null };
                break;
            case 'slide-text':
                newSlide = { type: 'slide-text', slide: true, content: '' };
                break;
            default:
                newSlide = { type: 'slide-classic', image: null };
        }
        setQuestions([...questions, newSlide]);
        setCurrentQuestion(newSlide);
        setCurrentQuestionIndex(questions.length);
        setIsSlideModalVisible(false);
    };

    const handleChangeSlideType = (type) => {
        let newSlide;
        switch (type) {
            case 'slide-classic':
                newSlide = { ...currentQuestion, type: 'slide-classic', image: currentQuestion.image || null };
                break;
            case 'slide-large-title':
                newSlide = { ...currentQuestion, type: 'slide-large-title', title: currentQuestion.title || '', subtitle: currentQuestion.subtitle || '', image: currentQuestion.image || null };
                break;
            case 'slide-title-content':
                newSlide = { ...currentQuestion, type: 'slide-title-content', title: currentQuestion.title || '', content: currentQuestion.content || '', image: currentQuestion.image || null };
                break;
            case 'slide-bullets':
                newSlide = { ...currentQuestion, type: 'slide-bullets', items: currentQuestion.items || [], image: currentQuestion.image || null };
                break;
            case 'slide-quote':
                newSlide = { ...currentQuestion, type: 'slide-quote', quote: currentQuestion.quote || '', author: currentQuestion.author || '' };
                break;
            case 'slide-large-media':
                newSlide = { ...currentQuestion, type: 'slide-large-media', image: currentQuestion.image || null };
                break;
            case 'slide-text':
                newSlide = { ...currentQuestion, type: 'slide-text', slide: true, content: currentQuestion.content || '' };
                break;
            default:
                newSlide = { ...currentQuestion, type: 'slide-classic', image: currentQuestion.image || null };
        }
        setCurrentQuestion(newSlide);
        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = newSlide;
        setQuestions(updatedQuestions);
    };

    return (
        <div style={{
            height: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            <title>NISO | Tạo Quiz</title>
            {/* Header */}
            <div style={{
                backgroundColor: 'rgba(255, 255, 255)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '12px 20px',
                flexShrink: 0,
                position: 'fixed',
                top: 64,
                left: isMobile ? 0 : (siderCollapsed ? 80 : 260),
                width: isMobile ? '100%' : `calc(100% - ${siderCollapsed ? 80 : 260}px)`,
                zIndex: 3,
                height: 64,
                transition: 'all 0.2s'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={handleGoBack}
                            style={{ minWidth: '40px' }}
                        >
                            {!isMobile && 'Quay lại'}
                        </Button>
                        {isMobile && (
                            <>
                                <Button
                                    icon={<MenuUnfoldOutlined />}
                                    onClick={() => setDrawerVisible(true)}
                                    style={{ minWidth: '40px' }}
                                />
                                <Button
                                    icon={<SettingOutlined />}
                                    onClick={() => setIsSettingsDrawerOpen(true)}
                                    style={{ minWidth: '40px' }}
                                />
                            </>
                        )}
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flex: 1,
                        justifyContent: 'flex-end'
                    }}>
                        {!isMobile && (
                            <>
                                <Button
                                    icon={<IoIosColorPalette />}
                                    onClick={() => setIsBackgroundDrawerVisible(true)}
                                >
                                    Giao diện
                                </Button>
                                <Button
                                    icon={<PlayCircleOutlined />}
                                    danger
                                    onClick={handlePreviewQuiz}
                                >
                                    Preview Quiz
                                </Button>
                                <Divider type="vertical" style={{ height: '24px', margin: '0 8px', borderColor: 'rgba(0, 0, 0, 0.1)' }} />
                                <Button
                                    icon={<FileTextOutlined />}
                                    onClick={() => handleSaveQuiz(true)}
                                >
                                    Lưu nháp
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<FileTextOutlined />}
                                    disabled={!areAllQuestionsComplete()}
                                    onClick={() => handleSaveQuiz(false)}
                                >
                                    Lưu
                                </Button>
                            </>
                        )}
                        {isMobile && (
                            <Dropdown
                                menu={{
                                    items: [
                                        {
                                            key: '1',
                                            icon: <IoIosColorPalette />,
                                            label: 'Giao diện',
                                            onClick: () => setIsBackgroundDrawerVisible(true)
                                        },
                                        {
                                            key: '2',
                                            icon: <PlayCircleOutlined />,
                                            label: 'Preview Quiz',
                                            danger: true,
                                            onClick: handlePreviewQuiz
                                        },
                                        {
                                            key: '3',
                                            icon: <FileTextOutlined />,
                                            label: 'Lưu nháp',
                                            onClick: () => handleSaveQuiz(true)
                                        },
                                        {
                                            key: '4',
                                            icon: <FileTextOutlined />,
                                            label: 'Lưu',
                                            disabled: !areAllQuestionsComplete(),
                                            onClick: () => handleSaveQuiz(false)
                                        }
                                    ]
                                }}
                                placement="bottomRight"
                            >
                                <Button icon={<MoreOutlined />} style={{ minWidth: '40px' }} />
                            </Dropdown>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{
                display: 'flex',
                flex: 1,
                overflow: 'hidden',
                height: 'calc(100% - 64px)',
                marginTop: 64
            }}>
                {/* Left Sidebar - Desktop */}
                {!isMobile && (
                    <Sider
                        width={280}
                        style={{
                            background: 'rgba(255, 255, 255)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            padding: '25px',
                            overflowY: 'auto',
                        }}
                    >
                        <h4 style={{
                            color: '#ae8f3d',
                            fontSize: '16px',
                            marginBottom: '20px',
                            fontWeight: 'bold'
                        }}>
                            Câu hỏi ({questions.length})
                        </h4>
                        <div>
                            {questions.map((question, index) => (
                                <QuestionSlideComponent
                                    key={index}
                                    question={question}
                                    index={index}
                                    isActive={currentQuestionIndex === index}
                                    onClick={() => handleSelectQuestion(index)}
                                    answerColors={answerColors}
                                    questions={questions}
                                    moveQuestion={moveQuestion}
                                    handleSelectQuestion={handleSelectQuestion}
                                    handleDeleteQuestion={handleDeleteQuestion}
                                    setDrawerVisible={setDrawerVisible}
                                />
                            ))}
                        </div>
                        <Divider style={{ borderColor: 'rgba(255, 255, 255)' }} />
                        <Button
                            type="primary"
                            block
                            size="middle"
                            icon={<PlusOutlined />}
                            onClick={handleAddQuestionClick}
                            style={{ marginBottom: '12px' }}
                        >
                            Thêm câu hỏi
                        </Button>
                        <Button
                            block
                            size="middle"
                            icon={<UploadOutlined />}
                            onClick={() => setIsSlideModalVisible(true)}
                            style={{ marginBottom: 15 }}
                        >
                            Thêm slide
                        </Button>
                    </Sider>
                )}

                {/* Mobile Drawer */}
                {isMobile && (
                    <Drawer
                        title="Danh sách câu hỏi"
                        placement="bottom"
                        onClose={() => setDrawerVisible(false)}
                        open={drawerVisible}
                        height="80vh"
                        bodyStyle={{ padding: '20px' }}
                        footer={
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <Button
                                    type="primary"
                                    block
                                    size="middle"
                                    icon={<PlusOutlined />}
                                    onClick={handleAddQuestionClick}
                                >
                                    Thêm câu hỏi
                                </Button>
                                <Button
                                    block
                                    size="middle"
                                    icon={<UploadOutlined />}
                                    onClick={() => setIsSlideModalVisible(true)}
                                >
                                    Thêm slide
                                </Button>
                            </div>
                        }
                    >
                        <div>
                            {questions.map((question, index) => (
                                <QuestionSlideComponent
                                    key={index}
                                    question={question}
                                    index={index}
                                    isActive={currentQuestionIndex === index}
                                    onClick={() => {
                                        handleSelectQuestion(index);
                                        setDrawerVisible(false);
                                    }}
                                    answerColors={answerColors}
                                    questions={questions}
                                    moveQuestion={moveQuestion}
                                    handleSelectQuestion={handleSelectQuestion}
                                    handleDeleteQuestion={handleDeleteQuestion}
                                    setDrawerVisible={setDrawerVisible}
                                />
                            ))}
                        </div>
                    </Drawer>
                )}

                {/* Main Content Area */}
                <div style={{
                    padding: '30px',
                    flex: 1,
                    overflowY: 'auto',
                    height: '100%',
                    background: `url(${selectedBackground ? selectedBackground : bg20})`,
                }} className='backgroundQuiz'>
                    {currentQuestion.type.startsWith('slide-') ? (
                        <>
                            {currentQuestion.type === 'slide-classic' && (
                                <SlideClassic
                                    currentQuestion={currentQuestion}
                                    setCurrentQuestion={setCurrentQuestion}
                                />
                            )}
                            {currentQuestion.type === 'slide-large-title' && (
                                <SlideLargeTitle
                                    currentQuestion={currentQuestion}
                                    setCurrentQuestion={setCurrentQuestion}
                                />
                            )}
                            {currentQuestion.type === 'slide-title-content' && (
                                <SlideTitleContent
                                    currentQuestion={currentQuestion}
                                    setCurrentQuestion={setCurrentQuestion}
                                />
                            )}
                            {currentQuestion.type === 'slide-bullets' && (
                                <SlideBullets
                                    currentQuestion={currentQuestion}
                                    setCurrentQuestion={setCurrentQuestion}
                                />
                            )}
                            {currentQuestion.type === 'slide-quote' && (
                                <SlideQuote
                                    currentQuestion={currentQuestion}
                                    setCurrentQuestion={setCurrentQuestion}
                                />
                            )}
                            {currentQuestion.type === 'slide-large-media' && (
                                <SlideLargeMedia
                                    currentQuestion={currentQuestion}
                                    setCurrentQuestion={setCurrentQuestion}
                                />
                            )}
                            {currentQuestion.type === 'slide-text' && (
                                <SlideText
                                    currentQuestion={currentQuestion}
                                    setCurrentQuestion={setCurrentQuestion}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            <Input
                                placeholder="Nhập câu hỏi thú vị của bạn..."
                                value={currentQuestion.question}
                                onChange={(e) => {
                                    const newQuestion = { ...currentQuestion, question: e.target.value };
                                    setCurrentQuestion(newQuestion);
                                    const updatedQuestions = [...questions];
                                    updatedQuestions[currentQuestionIndex] = newQuestion;
                                    setQuestions(updatedQuestions);
                                }}
                                size="large"
                                style={{
                                    fontSize: '16px',
                                    borderRadius: '10px',
                                    marginBottom: '20px',
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    border: '1px solid rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <ImageQuiz
                                selectedImage={currentQuestion.image}
                                onImageSelect={(image) => {
                                    setCurrentQuestion({ ...currentQuestion, image });
                                    const updatedQuestions = [...questions];
                                    updatedQuestions[currentQuestionIndex] = { ...currentQuestion, image };
                                    setQuestions(updatedQuestions);
                                }}
                                onImageDelete={() => {
                                    setCurrentQuestion({ ...currentQuestion, image: null });
                                    const updatedQuestions = [...questions];
                                    updatedQuestions[currentQuestionIndex] = { ...currentQuestion, image: null };
                                    setQuestions(updatedQuestions);
                                }}
                                imageStyle={{
                                    width: window.innerWidth < 768 ? '250px' : '300px',
                                    height: '100%',
                                    objectFit: 'contain',
                                    maxHeight: '800px'
                                }}
                            />
                            {currentQuestion.type === 'multiple-choice' ? (
                                <MultipleChoice
                                    question={currentQuestion}
                                    answerColors={answerColors}
                                    updateAnswer={updateAnswer}
                                    handleImageModalOpen={handleImageModalOpen}
                                    handleDeleteImage={handleImageModalCancel}
                                />
                            ) : currentQuestion.type === 'true-false' ? (
                                <TrueFalse
                                    question={currentQuestion}
                                    answerColors={answerColors}
                                    updateAnswer={updateAnswer}
                                />
                            ) : (
                                <FillBlank
                                    question={currentQuestion}
                                    updateAnswer={updateAnswer}
                                />
                            )}
                            {currentQuestion.type !== 'true-false' && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, marginBottom: window.innerWidth < 768 ? '56px' : '0' }}>
                                    <Button
                                        type="primary"
                                        size="middle"
                                        onClick={handleToggleAnswers}
                                        icon={currentQuestion.type === 'fill-blank' ?
                                            (currentQuestion.answers.length > 1 ? <MinusOutlined /> : <PlusOutlined />) :
                                            currentQuestion.answers.length >= 6 ? <MinusOutlined /> : <PlusOutlined />}
                                    >
                                        {currentQuestion.type === 'fill-blank' ?
                                            (currentQuestion.answers.length > 1 ? 'Bỏ đáp án được trả lời khác' : 'Thêm đáp án được trả lời khác') :
                                            currentQuestion.answers.length >= 6 ? 'Bỏ Đáp án' : 'Thêm Đáp án'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Right Sidebar - Desktop */}
                {!isMobile && (
                    <Sider
                        width={280}
                        style={{
                            background: 'rgba(255, 255, 255)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            overflowY: 'auto',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                        collapsed={collapsed}
                        onCollapse={(value) => setCollapsed(value)}
                        trigger={null}
                        collapsedWidth={50}
                        collapsible={false}
                    >
                        <div style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', padding: collapsed ? '10px' : '10px 25px' }}>
                            <Button
                                type="text"
                                icon={collapsed ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                                onClick={() => setCollapsed(!collapsed)}
                                style={{ fontSize: '16px' }}
                            />
                        </div>
                        {!collapsed && (
                            <div style={{
                                padding: '0 25px 0 25px',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                height: '100%'
                            }}>
                                <div>
                                    {currentQuestion.type.startsWith('slide-') ? (
                                        <div>
                                            <SlideComponent
                                                handleChangeSlideType={(type) => {
                                                    handleChangeSlideType(type);
                                                    setDrawerVisible(false);
                                                }}
                                                currentType={currentQuestion.type}
                                                onSlideTypeChange={() => setDrawerVisible(false)}
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ color: '#ae8f3d', display: 'block', marginBottom: '8px' }}>
                                                    🎯 Loại câu hỏi
                                                </label>
                                                <Select
                                                    value={currentQuestion.type}
                                                    onChange={(value) => {
                                                        const newQuestion = {
                                                            ...currentQuestion,
                                                            type: value,
                                                            answers: value === 'true-false' ? [
                                                                { text: 'Đúng', correct: true, color: 'green', image: null },
                                                                { text: 'Sai', correct: false, color: 'red', image: null }
                                                            ] : value === 'fill-blank' ? [
                                                                { text: '', correct: true, color: 'red', image: null }
                                                            ] : [
                                                                { text: '', correct: true, color: 'red', image: null },
                                                                { text: '', correct: false, color: 'blue', image: null },
                                                                { text: '', correct: false, color: 'yellow', image: null },
                                                                { text: '', correct: false, color: 'green', image: null }
                                                            ],
                                                            answerType: value === 'true-false' ? 'single' : 'single'
                                                        };
                                                        setCurrentQuestion(newQuestion);
                                                        const updatedQuestions = [...questions];
                                                        updatedQuestions[currentQuestionIndex] = newQuestion;
                                                        setQuestions(updatedQuestions);
                                                    }}
                                                    style={{ width: '100%' }}
                                                    size="middle"
                                                >
                                                    <Option value="multiple-choice">📊 Trắc nghiệm</Option>
                                                    <Option value="true-false">✅ Đúng/Sai</Option>
                                                    <Option value="fill-blank">✍️ Điền vào chỗ trống</Option>
                                                </Select>
                                            </div>
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ color: '#ae8f3d', display: 'block', marginBottom: '8px' }}>
                                                    ⏱️ Thời gian (giây)
                                                </label>
                                                <Select
                                                    value={currentQuestion.timeLimit}
                                                    onChange={(value) => setCurrentQuestion({ ...currentQuestion, timeLimit: value })}
                                                    style={{ width: '100%' }}
                                                    size="middle"
                                                >
                                                    <Option value={5}>5 giây</Option>
                                                    <Option value={10}>10 giây</Option>
                                                    <Option value={20}>20 giây</Option>
                                                    <Option value={30}>30 giây</Option>
                                                    <Option value={60}>60 giây</Option>
                                                </Select>
                                            </div>
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ color: '#ae8f3d', display: 'block', marginBottom: '8px' }}>
                                                    🏆 Điểm số
                                                </label>
                                                <Select
                                                    value={currentQuestion.points}
                                                    onChange={(value) => setCurrentQuestion({ ...currentQuestion, points: value })}
                                                    style={{ width: '100%' }}
                                                    size="middle"
                                                >
                                                    <Option value="standard">⭐ Tiêu chuẩn</Option>
                                                    <Option value="double">⭐⭐ Gấp đôi</Option>
                                                    <Option value="zero">❌ Không điểm</Option>
                                                </Select>
                                            </div>
                                                    {currentQuestion.type !== 'true-false' && currentQuestion.type !== 'fill-blank' && (
                                                        <div style={{ marginBottom: '20px' }}>
                                                            <label style={{ color: '#ae8f3d', display: 'block', marginBottom: '8px' }}>
                                                                Loại đáp án
                                                            </label>
                                                            <Select
                                                                value={currentQuestion.answerType}
                                                                onChange={(value) => {
                                                                    const newAnswers = value === 'single' ?
                                                                        currentQuestion.answers.map((ans, idx) => ({
                                                                            ...ans,
                                                                            correct: idx === 0 ? true : false
                                                                        })) :
                                                                        currentQuestion.answers;
                                                                    setCurrentQuestion({
                                                                        ...currentQuestion,
                                                                        answerType: value,
                                                                        answers: newAnswers
                                                                    });
                                                                }}
                                                                style={{ width: '100%' }}
                                                                size="middle"
                                                            >
                                                                <Option value="single">Chọn một đáp án</Option>
                                                                <Option value="multiple">Chọn nhiều đáp án</Option>
                                                            </Select>
                                                        </div>
                                                    )}
                                        </div>
                                    )}
                                </div>
                                <div style={{
                                    position: 'sticky',
                                    bottom: 0,
                                    background: 'rgba(255, 255, 255)',
                                    padding: '15px 0',
                                    borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                                    marginTop: 'auto'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Button
                                            size="middle"
                                            onClick={() => handleDeleteQuestion(currentQuestionIndex)}
                                            disabled={currentQuestionIndex === -1 || questions.length <= 1}
                                        >
                                            Xóa
                                        </Button>
                                        <Button
                                            type="primary"
                                            size="middle"
                                            onClick={handleDuplicateQuestion}
                                        >
                                            Sao chép
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Sider>
                )}

                {/* Mobile Settings Drawer */}
                {isMobile && (
                    <Drawer
                        title="Tùy chỉnh câu hỏi"
                        placement="bottom"
                        onClose={() => setIsSettingsDrawerOpen(false)}
                        open={isSettingsDrawerOpen}
                        height="80vh"
                        bodyStyle={{ padding: '20px' }}
                        footer={
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Button
                                    size="middle"
                                    onClick={() => handleDeleteQuestion(currentQuestionIndex)}
                                    disabled={currentQuestionIndex === -1 || questions.length <= 1}
                                >
                                    Xóa
                                </Button>
                                <Button
                                    type="primary"
                                    size="middle"
                                    onClick={handleDuplicateQuestion}
                                >
                                    Sao chép
                                </Button>
                            </div>
                        }
                    >
                        <div>
                            {currentQuestion.type.startsWith('slide-') ? (
                                <div>
                                    <SlideComponent
                                        handleChangeSlideType={(type) => {
                                            handleChangeSlideType(type);
                                            setDrawerVisible(false);
                                        }}
                                        currentType={currentQuestion.type}
                                        onSlideTypeChange={() => setDrawerVisible(false)}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ color: '#ae8f3d', display: 'block', marginBottom: '8px' }}>
                                            🎯 Loại câu hỏi
                                        </label>
                                        <Select
                                            value={currentQuestion.type}
                                            onChange={(value) => {
                                                const newQuestion = {
                                                    ...currentQuestion,
                                                    type: value,
                                                    answers: value === 'true-false' ? [
                                                        { text: 'Đúng', correct: true, color: 'green', image: null },
                                                        { text: 'Sai', correct: false, color: 'red', image: null }
                                                    ] : value === 'fill-blank' ? [
                                                        { text: '', correct: true, color: 'red', image: null }
                                                    ] : [
                                                        { text: '', correct: true, color: 'red', image: null },
                                                        { text: '', correct: false, color: 'blue', image: null },
                                                        { text: '', correct: false, color: 'yellow', image: null },
                                                        { text: '', correct: false, color: 'green', image: null }
                                                    ],
                                                    answerType: value === 'true-false' ? 'single' : 'single'
                                                };
                                                setCurrentQuestion(newQuestion);
                                                const updatedQuestions = [...questions];
                                                updatedQuestions[currentQuestionIndex] = newQuestion;
                                                setQuestions(updatedQuestions);
                                            }}
                                            style={{ width: '100%' }}
                                            size="middle"
                                        >
                                            <Option value="multiple-choice">📊 Trắc nghiệm</Option>
                                            <Option value="true-false">✅ Đúng/Sai</Option>
                                            <Option value="fill-blank">✍️ Điền vào chỗ trống</Option>
                                        </Select>
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ color: '#ae8f3d', display: 'block', marginBottom: '8px' }}>
                                            ⏱️ Thời gian (giây)
                                        </label>
                                        <Select
                                            value={currentQuestion.timeLimit}
                                            onChange={(value) => setCurrentQuestion({ ...currentQuestion, timeLimit: value })}
                                            style={{ width: '100%' }}
                                            size="middle"
                                        >
                                            <Option value={5}>5 giây</Option>
                                            <Option value={10}>10 giây</Option>
                                            <Option value={20}>20 giây</Option>
                                            <Option value={30}>30 giây</Option>
                                            <Option value={60}>60 giây</Option>
                                        </Select>
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ color: '#ae8f3d', display: 'block', marginBottom: '8px' }}>
                                            🏆 Điểm số
                                        </label>
                                        <Select
                                            value={currentQuestion.points}
                                            onChange={(value) => setCurrentQuestion({ ...currentQuestion, points: value })}
                                            style={{ width: '100%' }}
                                            size="middle"
                                        >
                                            <Option value="standard">⭐ Tiêu chuẩn</Option>
                                            <Option value="double">⭐⭐ Gấp đôi</Option>
                                            <Option value="zero">❌ Không điểm</Option>
                                        </Select>
                                    </div>
                                    {currentQuestion.type !== 'true-false' && currentQuestion.type !== 'fill-blank' && (
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ color: '#ae8f3d', display: 'block', marginBottom: '8px' }}>
                                                Loại đáp án
                                            </label>
                                            <Select
                                                value={currentQuestion.answerType}
                                                onChange={(value) => {
                                                    const newAnswers = value === 'single' ?
                                                        currentQuestion.answers.map((ans, idx) => ({
                                                            ...ans,
                                                            correct: idx === 0 ? true : false
                                                        })) :
                                                        currentQuestion.answers;
                                                    setCurrentQuestion({
                                                        ...currentQuestion,
                                                        answerType: value,
                                                        answers: newAnswers
                                                    });
                                                }}
                                                style={{ width: '100%' }}
                                                size="middle"
                                            >
                                                <Option value="single">Chọn một đáp án</Option>
                                                <Option value="multiple">Chọn nhiều đáp án</Option>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Drawer>
                )}
            </div>

            {/* Modal for Question Type */}
            <Modal
                title="Chọn loại câu hỏi"
                open={isModalVisible}
                onCancel={handleModalCancel}
                footer={null}
                width={400}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Button
                        size="large"
                        onClick={() => handleModalOk('multiple-choice')}
                        style={{ textAlign: 'left', height: '50px', justifyContent: 'flex-start', paddingLeft: '15px' }}
                    >
                        📊 Trắc nghiệm
                    </Button>
                    <Button
                        size="large"
                        onClick={() => handleModalOk('true-false')}
                        style={{ textAlign: 'left', height: '50px', justifyContent: 'flex-start', paddingLeft: '15px' }}
                    >
                        ✅ Đúng/Sai
                    </Button>
                    <Button
                        size="large"
                        onClick={() => handleModalOk('fill-blank')}
                        style={{ textAlign: 'left', height: '50px', justifyContent: 'flex-start', paddingLeft: '15px' }}
                    >
                        ✍️ Điền vào chỗ trống
                    </Button>
                </div>
            </Modal>

            {/* Modal for Slide Type */}
            <Modal
                title="Chọn loại slide"
                open={isSlideModalVisible}
                onCancel={() => setIsSlideModalVisible(false)}
                footer={null}
                width={400}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Button size="large" icon={<LayoutOutlined style={{ color: '#ae8f3d' }} />} onClick={() => handleSlideModalOk('slide-classic')} style={{ textAlign: 'left', height: '50px', justifyContent: 'flex-start', paddingLeft: '15px' }}>
                        Cổ điển
                    </Button>
                    <Button size="large" icon={<FontSizeOutlined style={{ color: '#ae8f3d' }} />} onClick={() => handleSlideModalOk('slide-large-title')} style={{ textAlign: 'left', height: '50px', justifyContent: 'flex-start', paddingLeft: '15px' }}>
                        Tiêu đề cỡ lớn
                    </Button>
                    <Button size="large" icon={<ProfileOutlined style={{ color: '#ae8f3d' }} />} onClick={() => handleSlideModalOk('slide-title-content')} style={{ textAlign: 'left', height: '50px', justifyContent: 'flex-start', paddingLeft: '15px' }}>
                        Tiêu đề + Nội dung
                    </Button>
                    <Button size="large" icon={<UnorderedListOutlined style={{ color: '#ae8f3d' }} />} onClick={() => handleSlideModalOk('slide-bullets')} style={{ textAlign: 'left', height: '50px', justifyContent: 'flex-start', paddingLeft: '15px' }}>
                        Gạch đầu dòng
                    </Button>
                    <Button size="large" icon={<QuestionOutlined style={{ color: '#ae8f3d' }} />} onClick={() => handleSlideModalOk('slide-quote')} style={{ textAlign: 'left', height: '50px', justifyContent: 'flex-start', paddingLeft: '15px' }}>
                        Trích dẫn
                    </Button>
                    <Button size="large" icon={<FileImageOutlined style={{ color: '#ae8f3d' }} />} onClick={() => handleSlideModalOk('slide-large-media')} style={{ textAlign: 'left', height: '50px', justifyContent: 'flex-start', paddingLeft: '15px' }}>
                        Phương tiện cỡ lớn
                    </Button>
                    <Button size="large" icon={<FileTextOutlined style={{ color: '#ae8f3d' }} />} onClick={() => handleSlideModalOk('slide-text')} style={{ textAlign: 'left', height: '50px', justifyContent: 'flex-start', paddingLeft: '15px' }}>
                        Văn bản
                    </Button>
                </div>
            </Modal>

            {/* Modal for Image Selection */}
            <ModalQuiz
                isModalVisible={isImageModalVisible}
                selectedMenu={selectedMenu}
                searchTerm={searchTerm}
                giphyResults={giphyResults}
                loading={loading}
                youtubeUrl={youtubeUrl}
                youtubeResults={youtubeResults}
                handleOk={handleImageModalOk}
                handleCancel={handleImageModalCancel}
                handleSearch={handleSearch}
                handleMenuSelect={handleMenuSelect}
                handleSelectGiphy={handleSelectGiphy}
                handleYouTubeSearch={handleYouTubeSearch}
                setYoutubeUrl={setYoutubeUrl}
                hideVideo={true}
                fileList={fileList}
            />

            <BackgroundQuiz
                visible={isBackgroundDrawerVisible}
                onClose={() => setIsBackgroundDrawerVisible(false)}
                onSelectBackground={handleBackgroundSelect}
            />

            {/* Modal lưu quiz */}
            <Modal
                title="Lưu Quiz"
                open={isSaveModalVisible}
                onCancel={() => {
                    setIsSaveModalVisible(false);
                    setQuizTitle('');
                    setQuizDescription('');
                }}
                onOk={handleSaveConfirm}
                confirmLoading={saveLoading}
                okText="Lưu"
                cancelText="Hủy"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px' }}>Tiêu đề <span style={{ color: 'red' }}>*</span></label>
                        <Input
                            placeholder="Nhập tiêu đề quiz"
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            maxLength={100}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px' }}>Mô tả</label>
                        <Input.TextArea
                            placeholder="Nhập mô tả quiz (không bắt buộc)"
                            value={quizDescription}
                            onChange={(e) => setQuizDescription(e.target.value)}
                            maxLength={500}
                            autoSize={{ minRows: 3, maxRows: 6 }}
                        />
                    </div>
                </div>
            </Modal>

            {/* Modal preview quiz */}
            <Modal
                title="Xem trước Quiz"
                open={isPreviewModalVisible}
                onCancel={() => setIsPreviewModalVisible(false)}
                width="80%"
                footer={null}
            >
                <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {questions.map((question, index) => (
                        <div key={index} style={{ marginBottom: '24px' }}>
                            <QuestionSlideComponent question={question} />
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
};

export default CreateQuiz;