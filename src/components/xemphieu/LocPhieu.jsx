import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Modal,
  Button,
  Input,
  Checkbox,
  Space,
  Alert,
  Divider,
  Typography,
  Badge,
  Tooltip,
} from 'antd';
import {
  FilterOutlined,
  SearchOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

// Utility function to strip HTML
const stripHtml = (html) => {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

// Hàm kiểm tra câu trả lời sai
const isAnswerIncorrect = (question, pointConfigNangCao) => {
  const { answer, cautraloi, xulynhiemvu, luachon, options = [], questionId } = question;

  if (xulynhiemvu) return false;
  if (!cautraloi || cautraloi === '') return false;
  if (!answer || (Array.isArray(answer) && answer.length === 0)) return true;

  // Check pointConfigNangCao first
  if (pointConfigNangCao && questionId) {
    const config = pointConfigNangCao.find((cfg) => cfg.questionId === questionId);
    if (config) {
      const normalizeAnswer = (ans) => String(ans || '').toLowerCase().trim();
      const questionAnswer = Array.isArray(answer)
        ? answer.map(normalizeAnswer).filter(Boolean)
        : [normalizeAnswer(answer)].filter(Boolean);
      const configAnswer = Array.isArray(config.answer)
        ? config.answer.map(normalizeAnswer).filter(Boolean)
        : [normalizeAnswer(config.answer)].filter(Boolean);

      const isOtherConfigAnswer = configAnswer.includes('other');
      if (isOtherConfigAnswer) {
        let correctAnswer = cautraloi || '';
        if (Array.isArray(correctAnswer)) {
          correctAnswer = correctAnswer.find((item) => !Array.isArray(item)) || '';
        }
        const otherAnswer = question.cautraloimoikhac || '';
        if (normalizeAnswer(correctAnswer) === normalizeAnswer(otherAnswer)) {
          return false; // Correct per pointConfigNangCao "other"
        }
      } else {
        const isConfigCorrect =
          questionAnswer.length === configAnswer.length &&
          questionAnswer.every((ans) => configAnswer.includes(ans)) &&
          configAnswer.every((ans) => questionAnswer.includes(ans));
        if (isConfigCorrect) {
          return false; // Correct per pointConfigNangCao
        }
      }
    }
  }

  // Default cautraloi check
  const normalizeAnswer = (ans) => String(ans || '').toLowerCase().trim();
  const correctAnswers = Array.isArray(cautraloi)
    ? cautraloi.map(normalizeAnswer).filter(Boolean)
    : cautraloi.toLowerCase().split(',').map(normalizeAnswer).filter(Boolean);

  if (luachon?.option2) {
    const answerLower = normalizeAnswer(answer);
    const isValidOption = options.some(
      (option) => normalizeAnswer(option.tuychon) === answerLower
    );
    return !isValidOption || !correctAnswers.includes(answerLower);
  }

  if (luachon?.option3) {
    const answers = Array.isArray(answer)
      ? answer.map(normalizeAnswer).filter(Boolean)
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

const LocPhieu = ({ data, onFilterChange, autoFilterIncorrect = false }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(autoFilterIncorrect);
  const [showConfigQuestions, setShowConfigQuestions] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Hàm kiểm tra câu hỏi thuộc pointConfigNangCao
  const isConfigQuestion = useCallback(
    (question) => {
      if (!data?.pointConfigNangCao || !question?.questionId) return false;

      const config = data.pointConfigNangCao.find(
        (cfg) => cfg.questionId === question.questionId
      );
      if (!config) return false;

      const normalizeAnswer = (ans) => String(ans || '').toLowerCase().trim();
      const questionAnswer = Array.isArray(question.answer)
        ? question.answer.map(normalizeAnswer).filter(Boolean)
        : [normalizeAnswer(question.answer)].filter(Boolean);
      const configAnswer = Array.isArray(config.answer)
        ? config.answer.map(normalizeAnswer).filter(Boolean)
        : [normalizeAnswer(config.answer)].filter(Boolean);

      const isOtherConfigAnswer = configAnswer.includes('other');
      if (isOtherConfigAnswer) {
        let correctAnswer = question.cautraloi || '';
        if (Array.isArray(correctAnswer)) {
          correctAnswer = correctAnswer.find((item) => !Array.isArray(item)) || '';
        }
        const otherAnswer = question.cautraloimoikhac || '';
        return normalizeAnswer(correctAnswer) === normalizeAnswer(otherAnswer);
      }

      return (
        questionAnswer.length === configAnswer.length &&
        questionAnswer.every((ans) => configAnswer.includes(ans)) &&
        configAnswer.every((ans) => questionAnswer.includes(ans))
      );
    },
    [data?.pointConfigNangCao]
  );

  // Memoize incorrect and config question checks
  const questionStats = useMemo(() => {
    if (!data?.questions) return { incorrect: [], config: [] };

    const incorrect = data.questions.map((q) => isAnswerIncorrect(q, data?.pointConfigNangCao));
    const config = data.questions.map((q) => isConfigQuestion(q));

    return { incorrect, config };
  }, [data?.questions, data?.pointConfigNangCao, isConfigQuestion]);

  // Function to generate filtered questions
  const getFilteredQuestions = useCallback(
    (searchValue, incorrectOnly, configQuestions) => {
      if (!data?.questions) return [];

      let result = [...data.questions];

      // Lọc câu hỏi cấu hình
      if (configQuestions) {
        result = result.filter((_, idx) => questionStats.config[idx]);
      }

      // Lọc câu trả lời sai
      if (incorrectOnly) {
        result = result.filter((_, idx) => questionStats.incorrect[idx]);
      }

      // Lọc theo từ khóa tìm kiếm
      if (searchValue) {
        const normalizedSearch = searchValue.toLowerCase().trim();
        result = result.filter((question) =>
          Object.keys(question).some((key) => {
            if (key.startsWith('Cauhoi')) {
              const content = stripHtml(question[key]);
              return content.toLowerCase().includes(normalizedSearch);
            }
            return false;
          })
        );
      }

      return result;
    },
    [data?.questions, questionStats]
  );

  // Memoize filtered questions
  const filteredQuestions = useMemo(
    () => getFilteredQuestions(searchTerm, showIncorrectOnly, showConfigQuestions),
    [getFilteredQuestions, searchTerm, showIncorrectOnly, showConfigQuestions]
  );

  // Áp dụng bộ lọc ban đầu nếu autoFilterIncorrect được bật
  useEffect(() => {
    if (autoFilterIncorrect && data?.questions && !hasUserInteracted) {
      setShowIncorrectOnly(true);
      onFilterChange(getFilteredQuestions(searchTerm, true, showConfigQuestions));
    }
  }, [
    autoFilterIncorrect,
    data?.questions,
    getFilteredQuestions,
    onFilterChange,
    searchTerm,
    showConfigQuestions,
    hasUserInteracted,
  ]);

  // Cập nhật bộ lọc khi filteredQuestions thay đổi
  useEffect(() => {
    onFilterChange(filteredQuestions);
  }, [filteredQuestions, onFilterChange]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setHasUserInteracted(true);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setHasUserInteracted(true);
  };

  const handleIncorrectOnlyChange = (e) => {
    setShowIncorrectOnly(e.target.checked);
    setHasUserInteracted(true);
  };

  const handleConfigQuestionsChange = (e) => {
    setShowConfigQuestions(e.target.checked);
    setHasUserInteracted(true);
  };

  // Calculate stats
  const totalQuestions = data?.questions?.length || 0;
  const incorrectQuestions = questionStats.incorrect.filter(Boolean).length;
  const configQuestions = questionStats.config.filter(Boolean).length;
  const correctQuestions = totalQuestions - incorrectQuestions;

  return (
    <>
      <Tooltip title="Lọc danh sách câu hỏi">
        <Badge
          count={filteredQuestions.length !== totalQuestions ? filteredQuestions.length : 0}
          overflowCount={999}
        >
          <Button icon={<FilterOutlined />} onClick={showModal} type="primary">
            <span className="mobile-filter-button">Lọc</span>
          </Button>
        </Badge>
      </Tooltip>

      <Modal
        title={
          <div className="modal-header">
            <Title level={4} style={{ margin: 0 }}>
              <FilterOutlined style={{ marginRight: 10 }} />
              Lọc câu hỏi
            </Title>
          </div>
        }
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={500}
        className="filter-modal"
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk}>
            Áp dụng
          </Button>,
        ]}
      >
        <div className="filter-content">
          <div className="search-container">
            <Input
              placeholder="Tìm kiếm nội dung câu hỏi"
              prefix={<SearchOutlined className="search-icon" />}
              suffix={
                searchTerm ? (
                  <CloseCircleOutlined
                    onClick={handleClearSearch}
                    className="clear-icon"
                  />
                ) : null
              }
              onChange={handleSearch}
              value={searchTerm}
              size="middle"
              allowClear
            />
          </div>

          <div className="filter-options">
            <Checkbox
              checked={showIncorrectOnly}
              onChange={handleIncorrectOnlyChange}
              className="filter-checkbox"
            >
              <Space>
                <Text>Chỉ hiển thị câu trả lời sai</Text>
                <Badge
                  count={incorrectQuestions}
                  style={{ backgroundColor: '#ff4d4f' }}
                  showZero
                />
              </Space>
            </Checkbox>

            {data?.Cauhinhdiem === true && (
              <Checkbox
                checked={showConfigQuestions}
                onChange={handleConfigQuestionsChange}
                className="filter-checkbox"
              >
                <Space>
                  <Text>Câu hỏi đã cấu hình</Text>
                  <Badge
                    count={configQuestions}
                    style={{ backgroundColor: '#52c41a' }}
                    showZero
                  />
                </Space>
              </Checkbox>
            )}
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div className="filter-summary">
            <Alert
              message={
                <Space>
                  <Text strong>Kết quả:</Text>
                  <Text>Đã tìm thấy {filteredQuestions.length} câu hỏi</Text>
                </Space>
              }
              type="info"
              showIcon
              icon={<QuestionCircleOutlined />}
            />

            <div className="stats-container">
              <div className="stats-item">
                <Text type="secondary">Tổng số câu hỏi:</Text>
                <Badge
                  count={totalQuestions}
                  style={{ backgroundColor: '#1890ff' }}
                  showZero
                />
              </div>
              <div className="stats-item">
                <Text type="secondary">Câu trả lời đúng:</Text>
                <Badge
                  count={correctQuestions}
                  style={{ backgroundColor: '#52c41a' }}
                  showZero
                />
              </div>
              <div className="stats-item">
                <Text type="secondary">Câu trả lời sai:</Text>
                <Badge
                  count={incorrectQuestions}
                  style={{ backgroundColor: '#ff4d4f' }}
                  showZero
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LocPhieu;