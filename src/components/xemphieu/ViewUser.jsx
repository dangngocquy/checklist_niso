import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Typography, Space, Button, Skeleton, message, Modal, Tooltip, Tag, Layout, Image, Radio, Checkbox, Rate, Alert, Avatar, App, Select, Empty, DatePicker, Spin, Row
} from "antd";
import {
  StarOutlined, HeartOutlined, CheckOutlined, InfoCircleOutlined, CloseOutlined, ArrowRightOutlined, ExclamationCircleOutlined, FieldTimeOutlined, LockOutlined, UserOutlined, LoadingOutlined
} from "@ant-design/icons";
import Footers from "../footer/Footer";
import Container from "../../config/PhieuChecklist/Container";
import * as XLSX from "xlsx";
import BacktoTop from "../../config/BacktoTop";
import Logo from "../../assets/Logo.svg";
import { FaCheckDouble } from "react-icons/fa6";
import TextArea from "antd/es/input/TextArea";
import Avatars from "../../config/design/Avatars";
import NotFoundPage from "../NotFoundPage";
import useApi from "../../hook/useApi";
import useSearchShop from "../../hook/SearchShop/useSearchShop";
import useSearchDepartment from "../../hook/SearchDepartment/useSearchDepartment";
import debounce from 'lodash/debounce';
import dayjs from 'dayjs';
import UserInfoCard from "../../hook/UserInfoCard";
import { calculateAdvancedPoints } from "./point/CustomPointsNangCao";
import BoxView from "./Design/BoxView";
import BoxHeader from "./Design/BoxHeader";

const { Title, Text } = Typography;
const { Footer } = Layout;
const { Option } = Select;

const ViewUser = ({ id: propId, user, t, onShowXulyDrawer, isInDrawer = false, autoFilterIncorrect = false, hasxemPermission, hasxlphPermission }) => {
  const navigate = useNavigate();

  const { id: paramId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasRequiredQuestions, setHasRequiredQuestions] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [visibleQuestions, setVisibleQuestions] = useState(new Set());
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    cuahang: [],
    bophanADS: [],
    accounts: [],
    thoigianxuly: null,
  });
  const [forceRender, setForceRender] = useState(false);

  const finalId = propId || paramId;
  const questionRefs = useRef({});
  const observerRefs = useRef({});
  const processedWatchingRef = useRef(new Set());
  const observerTimeoutRef = useRef(null);

  const { fetchResponseById, updateTaskProcessing, updateResponse, search } = useApi();
  const { options: chiNhanhOptions, loading: chiNhanhLoading, searchShops } = useSearchShop(useApi().searchShop);
  const { options: phongBanOptions, loading: phongBanLoading, searchDepartments } = useSearchDepartment();

  const debouncedSearchShops = useMemo(() => debounce(searchShops, 300), [searchShops]);
  const debouncedSearchDepartments = useMemo(() => debounce(searchDepartments, 300), [searchDepartments]);
  const debouncedFetchUsers = useMemo(
    () => debounce(async (searchTerm) => {
      if (!searchTerm || searchTerm.trim() === '') {
        setUserOptions((prev) => prev.filter((u) => data?.accounts?.includes(u.keys)));
        return;
      }
      setUserSearchLoading(true);
      try {
        const response = await search(searchTerm);
        const users = response.data || [];
        setUserOptions((prev) => {
          const existingKeys = new Set(users.map((u) => u.keys));
          const assignedUsers = prev.filter((u) => data?.accounts?.includes(u.keys) && !existingKeys.has(u.keys));
          return [...assignedUsers, ...users];
        });
      } catch (error) {
        console.error('Error fetching users:', error);
        message.error('Lỗi khi tìm kiếm tài khoản!');
      } finally {
        setUserSearchLoading(false);
      }
    }, 300),
    [search, data?.accounts]
  );

  const fetchAssignedUsers = useCallback(async (keys) => {
    if (!keys || keys.length === 0) return [];
    setUserSearchLoading(true);
    try {
      const response = await search(keys.join(','));
      const users = response.data || [];
      setUserOptions((prev) => {
        const existingKeys = new Set(prev.map((u) => u.keys));
        const newUsers = users.filter((u) => !existingKeys.has(u.keys));
        return [...prev, ...newUsers];
      });
      return users;
    } catch (error) {
      console.error('Error fetching assigned users:', error);
      message.error('Lỗi khi lấy thông tin tài khoản đã gán!');
      return [];
    } finally {
      setUserSearchLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (isAssignModalVisible && data?.accounts?.length > 0) {
      fetchAssignedUsers(data.accounts);
    }
  }, [isAssignModalVisible, data?.accounts, fetchAssignedUsers]);

  // Lazy loading questions with IntersectionObserver
  useEffect(() => {
    observerRefs.current = {};

    const drawerContainer = isInDrawer ? document.querySelector('.ant-drawer-content') : null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.index);
            setVisibleQuestions((prev) => {
              const newSet = new Set(prev);
              newSet.add(index);
              return newSet;
            });
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: drawerContainer,
        rootMargin: '200px',
        threshold: 0.1,
      }
    );

    Object.values(questionRefs.current).forEach((ref, index) => {
      if (ref && !visibleQuestions.has(index)) {
        ref.dataset.index = index;
        observer.observe(ref);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [data?.questions, isInDrawer, visibleQuestions]);

  // Timeout để tự động hiển thị tất cả câu hỏi nếu IntersectionObserver không kích hoạt
  useEffect(() => {
    if (!data?.questions?.length) return;

    observerTimeoutRef.current = setTimeout(() => {
      if (visibleQuestions.size === 0 && data?.questions?.length > 0) {
        setForceRender(true);
      }
    }, 5000);

    return () => {
      if (observerTimeoutRef.current) {
        clearTimeout(observerTimeoutRef.current);
      }
    };
  }, [data?.questions, visibleQuestions]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!finalId) {
        setError('Không có ID được cung cấp.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setVisibleQuestions(new Set());
      setData(null);
      setForceRender(false);
      observerRefs.current = {};
      questionRefs.current = {};
      try {
        const [traloiResponse] = await Promise.all([fetchResponseById(finalId)]);
        const responseData = traloiResponse.data || {};
        setData({
          ...responseData,
          trangthai: responseData.trangthai || 'Chờ xử lý',
          questions: Array.isArray(responseData.questions)
            ? responseData.questions.map((q) => ({
              ...q,
              answer: q.answer || '',
              options: Array.isArray(q.options) ? q.options : [],
            }))
            : [],
          statusHistory: responseData.statusHistory || [],
        });
        setFormValues({
          cuahang: Array.isArray(responseData.cuahang) ? responseData.cuahang : [],
          bophanADS: Array.isArray(responseData.bophanADS) ? responseData.bophanADS : [],
          accounts: Array.isArray(responseData.accounts) ? responseData.accounts : [],
          thoigianxuly: responseData.thoigianxuly ? dayjs(responseData.thoigianxuly, 'DD-MM-YYYY HH:mm:ss').toDate() : null,
        });
        setHasRequiredQuestions(responseData.questions?.some((question) => question.cauhoibatbuoc === true) || false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Không tìm thấy checklist.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [finalId, fetchResponseById]);

  // Update watching list
  useEffect(() => {
    const updateWatchingList = async () => {
      if (!user?.keys || !finalId) return;

      const key = `${user.keys}:${finalId}`;
      if (processedWatchingRef.current.has(key) || data?.watching?.includes(user.keys)) {
        processedWatchingRef.current.add(key);
        return;
      }

      try {
        const response = await fetchResponseById(finalId);
        const responseData = response.data;
        const currentWatching = Array.isArray(responseData.watching) ? responseData.watching : [];

        if (!currentWatching.includes(user.keys)) {
          const updatedWatching = [...currentWatching, user.keys];
          await updateResponse(finalId, { watching: updatedWatching });
          setData((prevData) => ({
            ...prevData,
            watching: updatedWatching,
          }));
        }

        processedWatchingRef.current.add(key);
      } catch (error) {
        console.error('Error updating watching list:', error);
      }
    };

    updateWatchingList();
  }, [user?.keys, finalId, fetchResponseById, updateResponse, data]);

  // Automatically update status based on incorrect questions
  useEffect(() => {
    if (!data?.questions || !data.yeucauxuly) return;

    const incorrectQuestions = data.questions.filter((question) => {
      const { answer, cautraloi, luachon } = question;
      if (!cautraloi || cautraloi === '') return false;

      if (luachon?.option2) {
        return String(answer).toLowerCase().trim() !== String(cautraloi).toLowerCase().trim();
      } else if (luachon?.option3) {
        const answers = Array.isArray(answer) ? answer.map((a) => String(a).toLowerCase().trim()).sort() : [String(answer).toLowerCase().trim()].filter(Boolean).sort();
        const correctAnswers = Array.isArray(cautraloi) ? cautraloi.map((a) => String(a).toLowerCase().trim()).sort() : String(cautraloi).toLowerCase().split(',').map((a) => a.trim()).sort();
        return answers.length !== correctAnswers.length || !answers.every((ans, idx) => ans === correctAnswers[idx]);
      } else if (luachon?.option4) {
        return String(answer) !== String(cautraloi);
      } else {
        return String(answer).toLowerCase().trim() !== String(cautraloi).toLowerCase().trim();
      }
    });

    const allIncorrectProcessed = incorrectQuestions.length > 0 && incorrectQuestions.every((q) => q.xulynhiemvu === true);
    const newStatus = allIncorrectProcessed ? 'Hoàn tất' : 'Chờ xử lý';

    if (data.trangthai !== newStatus) {
      const updateStatus = async () => {
        try {
          const newHistoryItem = {
            action: newStatus === 'Hoàn tất' ? 'complete' : 'pending',
            user: user?.keys || 'System',
            timestamp: dayjs().format('DD-MM-YYYY HH:mm:ss'),
            details: {
              comment: newStatus === 'Hoàn tất' ? 'Tất cả lỗi đã được xử lý' : 'Còn lỗi chưa xử lý',
            },
          };

          const updateData = {
            trangthai: newStatus,
            ngaygiao: new Date().toISOString(),
            changedBy: user?.keys || 'System',
            historyCheck: [...(data?.historyCheck || []), newHistoryItem],
          };

          const response = await updateResponse(finalId, updateData);
          if (response.message === 'Updated successfully') {
            setData((prevData) => ({
              ...prevData,
              trangthai: newStatus,
              ngaygiao: updateData.ngaygiao,
              historyCheck: [...(prevData.historyCheck || []), newHistoryItem],
            }));
          }
        } catch (error) {
          console.error('Error updating status:', error);
        }
      };
      updateStatus();
    }
  }, [data, user?.keys, finalId, updateResponse]);

  const handleFilterChange = useCallback((filtered) => {
    setFilteredQuestions(filtered);
  }, []);

  const handleAction = useCallback(
    async (action, documentId, questionId) => {
      setProcessingAction({ action, questionId });
      try {
        const response = await updateTaskProcessing(documentId, questionId, {
          [action]: true,
          nguoiduyet: user?.name || 'Unknown',
          thoigianpheduyet: new Date().toISOString(),
        });
        if (response.message === 'Cập nhật xử lý nhiệm vụ thành công') {
          message.success(
            action === 'xulynhiemvu'
              ? 'Xử lý nhiệm vụ thành công'
              : 'Xác nhận câu hỏi thành công'
          );
          setData((prevData) => {
            const newData = { ...prevData };
            const questionIndex = newData.questions.findIndex((q) => q.id === questionId);
            if (questionIndex !== -1) {
              newData.questions[questionIndex][action] = true;
              newData.questions[questionIndex].nguoiduyet = user?.name || 'Unknown';
              newData.questions[questionIndex].thoigianpheduyet = new Date().toISOString();
            }
            return newData;
          });
        } else {
          throw new Error('Unexpected response');
        }
      } catch (error) {
        console.error('Error performing action:', error);
        message.error('Có lỗi xảy ra khi thực hiện hành động');
      } finally {
        setProcessingAction(null);
      }
    },
    [user?.name, updateTaskProcessing]
  );

  const showConfirmModal = useCallback((action, documentId, questionId) => {
    Modal.confirm({
      title: 'Xác nhận',
      icon: <ExclamationCircleOutlined />,
      content:
        action === 'xulynhiemvu'
          ? 'Bạn có chắc chắn muốn nhận xử lý nhiệm vụ này không?'
          : 'Bạn có chắc chắn muốn hoàn tất nhiệm vụ này không? Thao tác này sẽ không thể sửa đổi.',
      okText: 'Đồng ý',
      cancelText: 'Hủy',
      onOk: () => handleAction(action, documentId, questionId),
    });
  }, [handleAction]);

  const getAnswerStyle = useCallback((answer, correctAnswer, xulynhiemvu, luachon, options, questionId, pointConfigNangCao) => {
    if (xulynhiemvu) return '#b0db7d';
    if (!correctAnswer || correctAnswer === '') return 'transparent';
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return '#f39b9d';

    // Check if the answer matches pointConfigNangCao
    let isConfigCorrect = false;
    if (pointConfigNangCao && Array.isArray(pointConfigNangCao) && questionId) {
      const config = pointConfigNangCao.find((cfg) => cfg.questionId === questionId);
      if (config) {
        const answerLower = Array.isArray(answer)
          ? answer.map((a) => String(a || "").toLowerCase().trim()).filter(Boolean)
          : [String(answer || "").toLowerCase().trim()].filter(Boolean);
        const configAnswerLower = Array.isArray(config.answer)
          ? config.answer.map((a) => String(a || "").toLowerCase().trim()).filter(Boolean)
          : [String(config.answer || "").toLowerCase().trim()].filter(Boolean);

        const isOtherConfigAnswer = configAnswerLower.includes("other");
        if (isOtherConfigAnswer) {
          const question = data?.questions.find((q) => q.questionId === questionId);
          let correctAnswer = question?.cautraloi || "";
          if (Array.isArray(correctAnswer)) {
            correctAnswer = correctAnswer.find((item) => !Array.isArray(item)) || "";
          }
          const otherAnswer = question?.cautraloimoikhac || "";
          isConfigCorrect = String(correctAnswer).toLowerCase().trim() === String(otherAnswer).toLowerCase().trim();
        } else {
          isConfigCorrect =
            answerLower.length === configAnswerLower.length &&
            answerLower.every((ans) => configAnswerLower.includes(ans)) &&
            configAnswerLower.every((ans) => answerLower.includes(ans));
        }
      }
    }

    if (isConfigCorrect) {
      return '#389e0d'; // Distinct green for pointConfigNangCao correct answers
    }

    if (luachon?.option2) {
      const answerLower = String(answer).toLowerCase().trim();
      const correctAnswerLower = String(correctAnswer).toLowerCase().trim();
      return answerLower === correctAnswerLower ? '#b0db7d' : '#f39b9d';
    } else if (luachon?.option3) {
      const answers = Array.isArray(answer)
        ? answer.map((a) => String(a).toLowerCase().trim()).sort()
        : [String(answer).toLowerCase().trim()].filter(Boolean).sort();
      const correctAnswers = Array.isArray(correctAnswer)
        ? correctAnswer.map((a) => String(a).toLowerCase().trim()).sort()
        : String(correctAnswer).toLowerCase().split(',').map((a) => a.trim()).sort();
      const isCorrect = answers.length === correctAnswers.length && answers.every((ans, idx) => ans === correctAnswers[idx]);
      return isCorrect ? '#b0db7d' : '#f39b9d';
    } else if (luachon?.option4) {
      return String(answer) === String(correctAnswer) ? '#b0db7d' : '#f39b9d';
    } else {
      const answerLower = String(answer).toLowerCase().trim();
      const correctAnswerLower = String(correctAnswer).toLowerCase().trim();
      return answerLower === correctAnswerLower ? '#b0db7d' : '#f39b9d';
    }
  }, [data?.questions]);

  const getAnswerIcon = useCallback((answer, correctAnswer, xulynhiemvu, luachon, options, questionId, pointConfigNangCao) => {
    if (xulynhiemvu) return <CheckOutlined style={{ color: '#b0db7d' }} />;
    if (!correctAnswer || correctAnswer === '') return null;
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return <CloseOutlined style={{ color: '#f39b9d' }} />;

    // Check if the answer matches pointConfigNangCao
    let isConfigCorrect = false;
    if (pointConfigNangCao && Array.isArray(pointConfigNangCao) && questionId) {
      const config = pointConfigNangCao.find((cfg) => cfg.questionId === questionId);
      if (config) {
        const answerLower = Array.isArray(answer)
          ? answer.map((a) => String(a || "").toLowerCase().trim()).filter(Boolean)
          : [String(answer || "").toLowerCase().trim()].filter(Boolean);
        const configAnswerLower = Array.isArray(config.answer)
          ? config.answer.map((a) => String(a || "").toLowerCase().trim()).filter(Boolean)
          : [String(config.answer || "").toLowerCase().trim()].filter(Boolean);

        const isOtherConfigAnswer = configAnswerLower.includes("other");
        if (isOtherConfigAnswer) {
          const question = data?.questions.find((q) => q.questionId === questionId);
          let correctAnswer = question?.cautraloi || "";
          if (Array.isArray(correctAnswer)) {
            correctAnswer = correctAnswer.find((item) => !Array.isArray(item)) || "";
          }
          const otherAnswer = question?.cautraloimoikhac || "";
          isConfigCorrect = String(correctAnswer).toLowerCase().trim() === String(otherAnswer).toLowerCase().trim();
        } else {
          isConfigCorrect =
            answerLower.length === configAnswerLower.length &&
            answerLower.every((ans) => configAnswerLower.includes(ans)) &&
            configAnswerLower.every((ans) => answerLower.includes(ans));
        }
      }
    }

    if (isConfigCorrect) {
      return <FaCheckDouble style={{ color: '#389e0d' }} />;
    }

    if (luachon?.option2) {
      const answerLower = String(answer).toLowerCase().trim();
      const correctAnswerLower = String(correctAnswer).toLowerCase().trim();
      return answerLower === correctAnswerLower ? (
        <CheckOutlined style={{ color: '#b0db7d' }} />
      ) : (
        <CloseOutlined style={{ color: '#f39b9d' }} />
      );
    } else if (luachon?.option3) {
      const answers = Array.isArray(answer)
        ? answer.map((a) => String(a).toLowerCase().trim()).sort()
        : [String(answer).toLowerCase().trim()].filter(Boolean).sort();
      const correctAnswers = Array.isArray(correctAnswer)
        ? correctAnswer.map((a) => String(a).toLowerCase().trim()).sort()
        : String(correctAnswer).toLowerCase().split(',').map((a) => a.trim()).sort();
      const isCorrect = answers.length === correctAnswers.length && answers.every((ans, idx) => ans === correctAnswers[idx]);
      return isCorrect ? (
        <CheckOutlined style={{ color: '#b0db7d' }} />
      ) : (
        <CloseOutlined style={{ color: '#f39b9d' }} />
      );
    } else if (luachon?.option4) {
      return String(answer) === String(correctAnswer) ? (
        <CheckOutlined style={{ color: '#b0db7d' }} />
      ) : (
        <CloseOutlined style={{ color: '#f39b9d' }} />
      );
    } else {
      const answerLower = String(answer).toLowerCase().trim();
      const correctAnswerLower = String(correctAnswer).toLowerCase().trim();
      return answerLower === correctAnswerLower ? (
        <CheckOutlined style={{ color: '#b0db7d' }} />
      ) : (
        <CloseOutlined style={{ color: '#f39b9d' }} />
      );
    }
  }, [data?.questions]);

  const advancedPoints = useMemo(
    () =>
      loading || !data || !data.questions || !data.pointConfigNangCao
        ? { sumPoint: '0/0', getPoint: '0', earnPoint: '0', hasPoints: false }
        : calculateAdvancedPoints(data.questions, data.pointConfigNangCao, data.ConfigPoints),
    [loading, data]
  );

  console.log(advancedPoints);

  const showModal = useCallback((correctAnswer) => {
    setSelectedAnswer(correctAnswer);
    setIsModalVisible(true);
  }, []);

  const handleStatusChange = useCallback(
    (value) => {
      if (value === 'Assigned') {
        setIsAssignModalVisible(true);
      }
    },
    []
  );

  const handleAssignSubmit = useCallback(async () => {
    setLoading(true);
    try {
      const newHistoryItem = {
        action: "assign",
        user: user.keys,
        timestamp: dayjs().format('DD-MM-YYYY HH:mm:ss'),
        details: {
          assignedTo: formValues.accounts,
          departments: formValues.bophanADS,
          branches: formValues.cuahang,
          deadline: formValues.thoigianxuly ? dayjs(formValues.thoigianxuly).format('DD-MM-YYYY HH:mm:ss') : null,
        },
      };

      const updateData = {
        trangthai: 'Chờ xử lý',
        cuahang: formValues.cuahang,
        bophanADS: formValues.bophanADS,
        accounts: formValues.accounts,
        ngaygiao: new Date().toISOString(),
        thoigianxuly: formValues.thoigianxuly ? dayjs(formValues.thoigianxuly).format('DD-MM-YYYY HH:mm:ss') : null,
        historyCheck: [...(data?.historyCheck || []), newHistoryItem],
      };

      const response = await updateResponse(finalId, updateData);
      if (response.message === 'Updated successfully') {
        message.success('Gán quyền thành công');
        setData((prevData) => ({
          ...prevData,
          trangthai: 'Chờ xử lý',
          cuahang: formValues.cuahang,
          bophanADS: formValues.bophanADS,
          accounts: formValues.accounts,
          ngaygiao: updateData.ngaygiao,
          thoigianxuly: updateData.thoigianxuly,
          historyCheck: [...(prevData.historyCheck || []), newHistoryItem],
        }));
        setIsAssignModalVisible(false);
      } else {
        throw new Error('Unexpected response');
      }
    } catch (error) {
      console.error('Error assigning permissions:', error);
      message.error('Lỗi khi gán quyền');
    } finally {
      setLoading(false);
    }
  }, [formValues, finalId, updateResponse, user.keys, data?.historyCheck]);

  const handleAssignCancel = useCallback(() => {
    setIsAssignModalVisible(false);
  }, []);

  const renderAnswer = useCallback(
    (question) => {
      const { luachon, luachonbieutuong, plusnumber, options, cautraloi, xulynhiemvu } = question;
      const answer = Array.isArray(question.answer) ? question.answer.join(', ') : question.answer;
      const answerStyle = { border: `2px solid ${getAnswerStyle(question.answer, cautraloi, xulynhiemvu, luachon, options, question.questionId, data?.pointConfigNangCao)}` };

      if (luachon?.option0) {
        return <div dangerouslySetInnerHTML={{ __html: question.noidung || '' }} />;
      }

      if (luachon?.option1 || luachon?.option5 || luachon?.option6) {
        return (
          <div className="correct" style={answerStyle}>
            <Space direction="horizontal">
              <b style={{ textTransform: 'uppercase' }}>Câu trả lời của bạn</b>
              {data?.Dapanview === true && cautraloi && cautraloi.length > 0 && (
                <Tooltip title='Xem đáp án đúng'>
                  <InfoCircleOutlined style={{ marginLeft: '8px', cursor: 'pointer' }} onClick={() => showModal(cautraloi)} />
                </Tooltip>
              )}
            </Space>
            <Text style={{ display: 'flex', justifyContent: 'space-between' }}>
              {getAnswerIcon(question.answer, cautraloi, xulynhiemvu, luachon, options, question.questionId, data?.pointConfigNangCao)}
              <TextArea
                autoSize
                readOnly
                value={answer || 'Chưa trả lời'}
                style={{
                  color: answer || cautraloi ? null : '#f39b9d',
                  background: 'transparent',
                  boxShadow: 'none',
                  border: 'none',
                  borderRadius: 6,
                }}
              />
            </Text>
          </div>
        );
      }

      if (luachon?.option2) {
        const defaultValue = options?.some((option) => option.tuychon === answer) ? answer : 'other';
        return (
          <>
            <Radio.Group value={defaultValue} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {options?.map((option, index) => (
                <Radio key={index} value={option.tuychon}>
                  {option.tuychon}
                  {option.tuychon === answer && (
                    <span style={{ marginLeft: '8px' }}>{getAnswerIcon(question.answer, cautraloi, xulynhiemvu, luachon, options, question.questionId, data?.pointConfigNangCao)}</span>
                  )}
                </Radio>
              ))}
              {question.tuychonkhac && <Radio value="other">Khác</Radio>}
            </Radio.Group>
            <div className="correct" style={answerStyle}>
              <Space direction="horizontal">
                <b style={{ textTransform: 'uppercase' }}>Câu trả lời của bạn</b>
                {data?.Dapanview === true && cautraloi && cautraloi.length > 0 && (
                  <Tooltip title='Xem đáp án đúng'>
                    <InfoCircleOutlined style={{ marginLeft: '8px', cursor: 'pointer' }} onClick={() => showModal(cautraloi)} />
                  </Tooltip>
                )}
              </Space>
              <Text style={{ display: 'flex', justifyContent: 'space-between' }}>
                <TextArea
                  autoSize
                  readOnly
                  value={answer || 'Chưa trả lời'}
                  style={{
                    color: answer || cautraloi ? null : '#f39b9d',
                    background: 'transparent',
                    boxShadow: 'none',
                    border: 'none',
                    borderRadius: 6,
                  }}
                />
                <span style={{ marginLeft: '8px' }}>{getAnswerIcon(question.answer, cautraloi, xulynhiemvu, luachon, options, question.questionId, data?.pointConfigNangCao)}</span>
              </Text>
            </div>
          </>
        );
      }

      if (luachon?.option3) {
        const answers = Array.isArray(question.answer) ? question.answer : [question.answer].filter(Boolean);
        const displayAnswers = answers.every((answer) => options?.some((option) => option.tuychonnhieu.toLowerCase() === answer.toLowerCase()))
          ? answers
          : [...new Set([...answers, 'other'])];
        return (
          <>
            <Checkbox.Group value={displayAnswers} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {options?.map((option, index) => (
                <Checkbox key={index} value={option.tuychonnhieu}>
                  {option.tuychonnhieu}
                  {answers.includes(option.tuychonnhieu) && (
                    <span style={{ marginLeft: '8px' }}>{getAnswerIcon(question.answer, cautraloi, xulynhiemvu, luachon, options, question.questionId, data?.pointConfigNangCao)}</span>
                  )}
                </Checkbox>
              ))}
              {question.tuychonkhac && <Checkbox value="other">Khác</Checkbox>}
            </Checkbox.Group>
            <div className="correct" style={answerStyle}>
              <Space direction="horizontal">
                <b style={{ textTransform: 'uppercase' }}>Câu trả lời của bạn</b>
                {data?.Dapanview === true && cautraloi && cautraloi.length > 0 && (
                  <Tooltip title={'Xem đáp án đúng'}>
                    <InfoCircleOutlined style={{ marginLeft: '8px', cursor: 'pointer' }} onClick={() => showModal(cautraloi)} />
                  </Tooltip>
                )}
              </Space>
              <Text style={{ display: 'flex', justifyContent: 'space-between' }}>
                <TextArea
                  autoSize
                  readOnly
                  value={answer || 'Chưa trả lời'}
                  style={{
                    color: answer || cautraloi ? null : '#f39b9d',
                    background: 'transparent',
                    boxShadow: 'none',
                    border: 'none',
                    borderRadius: 6,
                  }}
                />
                <span style={{ marginLeft: '8px' }}>{getAnswerIcon(question.answer, cautraloi, xulynhiemvu, luachon, options, question.questionId, data?.pointConfigNangCao)}</span>
              </Text>
            </div>
          </>
        );
      }

      if (luachon?.option4) {
        const { ngoisao, traitim, daukiem, so } = luachonbieutuong || {};
        return (
          <>
            <Rate
              value={question.answer}
              count={plusnumber}
              style={{ lineHeight: 2.5 }}
              character={({ index }) => {
                const style = {
                  backgroundColor: index < question.answer ? '#ae8f3d' : 'white',
                  color: index < question.answer ? 'white' : null,
                };
                if (ngoisao) return <Button size="large" shape="circle" icon={<StarOutlined />} style={style} />;
                if (traitim) return <Button size="large" shape="circle" icon={<HeartOutlined />} style={style} />;
                if (daukiem) return <Button size="large" shape="circle" icon={<CheckOutlined />} style={style} />;
                if (so) return <Button size="large" shape="circle" style={style}>{index + 1}</Button>;
                return <Button size="large" shape="circle" icon={<StarOutlined />} style={style} />;
              }}
            />
            <div className="correct" style={answerStyle}>
              <b style={{ textTransform: 'uppercase' }}>Câu trả lời của bạn</b>
              <Text style={{ display: 'flex', justifyContent: 'space-between' }}>
                {'Mức'}: {answer || '0'}
                <span style={{ marginLeft: '8px' }}>{getAnswerIcon(question.answer, cautraloi, xulynhiemvu, luachon, options, question.questionId, data?.pointConfigNangCao)}</span>
              </Text>
            </div>
          </>
        );
      }

      return null;
    },
    [showModal, getAnswerStyle, getAnswerIcon, data?.pointConfigNangCao, data?.Dapanview]
  );

  const stripHTML = useCallback((html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }, []);

  const exportToExcel = useCallback(() => {
    if (!data) return;
    const { nguoitaophieu, nguoiphanhoi, phongban, contentTitle, title, chi_nhanh, Cauhinhdiem, solanlaplai } = data;

    const loadingKey = 'exportExcel';
    message.loading({ content: 'Đang xử lý tải xuống...', key: loadingKey });

    const formattedData = data.questions.map((question, index) => {
      const baseData = {
        title,
        contentTitle: stripHTML(contentTitle),
        nguoitaophieu,
        nguoiphanhoi,
        phongban,
        chi_nhanh,
        tieudephieuthem: stripHTML(question.subtitle?.tieudephieuthem ?? ''),
        noidungphieuthem: stripHTML(question.subtitle?.noidungphieuthem ?? ''),
        Question: stripHTML(question[`Cauhoi${index + 1}`] || ''),
        Answer: Array.isArray(question.answer) ? question.answer.join(', ') : question.answer || '',
        CorrectAnswer: question.cautraloi || '',
        Points: question.point || '0',
      };

      const conditionalData = {};
      if (solanlaplai === true) {
        conditionalData.LapLai = question.laplai || '1';
      }
      if (Cauhinhdiem === true) {
        conditionalData.Earn = advancedPoints?.earnPoint || '0';
        conditionalData.Archive = advancedPoints?.getPoint || '0';
      }

      return { ...baseData, ...conditionalData };
    });

    const customHeaders = [
      'Tên Checklist',
      'Nội dung Checklist',
      'Người tạo checklist',
      'Người phản hồi',
      'Khối / Phòng',
      'Nhà hàng',
      'Tiêu đề phụ',
      'Nội dung phụ',
      'Câu hỏi',
      'Câu trả lời',
      'Câu trả lời đúng',
      'Điểm',
      ...(solanlaplai === true ? ['Số lần lặp lại'] : []),
      ...(Cauhinhdiem === true ? ['EARN', 'ARCHIVE'] : []),
    ];

    const formattedDataWithHeaders = [
      customHeaders,
      ...formattedData.map((item) => {
        const baseRow = [
          item.title,
          item.contentTitle,
          item.nguoitaophieu,
          item.nguoiphanhoi,
          item.phongban,
          item.chi_nhanh,
          item.tieudephieuthem,
          item.noidungphieuthem,
          item.Question,
          item.Answer,
          item.CorrectAnswer,
          item.Points,
        ];
        const conditionalRow = [];
        if (solanlaplai === true) {
          conditionalRow.push(item.LapLai);
        }
        if (Cauhinhdiem === true) {
          conditionalRow.push(item.Earn, item.Archive);
        }
        return [...baseRow, ...conditionalRow];
      }),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(formattedDataWithHeaders);
    worksheet['!cols'] = formattedDataWithHeaders[0].map((_, index) => ({
      wch: Math.max(...formattedDataWithHeaders.map((row) => String(row[index]).length), 10),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Responses');
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
    const fileName = `${data.title.replace(/ /g, '_')}_${formattedDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    message.success({ content: 'Download thành công !', key: loadingKey });
  }, [data, stripHTML, advancedPoints]);

  const handleCancel = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleReceiveTask = useCallback(
    (record, questionId) => {
      if (!record || !questionId) {
        message.error('Không thể xử lý: Dữ liệu không hợp lệ.');
        return;
      }
      if (!user) {
        setIsLoginModalVisible(true);
        return;
      }

      if (onShowXulyDrawer) {
        onShowXulyDrawer(record, questionId);
      } else {
        navigate(`/auth/docs/form/views/${finalId}/${questionId}`);
      }
    },
    [user, onShowXulyDrawer, navigate, finalId]
  );

  const handleLoginRedirect = useCallback(() => {
    setIsLoginModalVisible(false);
    const currentUrl = window.location.pathname + window.location.search;
    navigate('/login', { state: { intendedUrl: currentUrl } });
  }, [navigate]);

  const hasPermission = useCallback(() => {
    if (!data) return false;

    if (
      (user?.bophan && data.departmentsview?.includes(user.bophan)) ||
      (user?.chinhanh && data.restaurantsview?.includes(user.chinhanh)) ||
      (user?.keys && data.usersview?.includes(user.keys))
    ) {
      return true;
    }

    if (data.quyenxem === 'Public' || data.quyenxem === true) return true;
    if (hasxemPermission || hasxlphPermission || user?.phanquyen === true || user?.phanquyen === 'Xử lý yêu cầu') return true;
    if (!user) return false;

    if (data.quyenxem === 'Internal') {
      return (
        (user.chinhanh && data.cuahang?.includes(user.chinhanh)) ||
        (user.bophan && data.bophanADS?.includes(user.bophan)) ||
        (user.keys && data.accounts?.includes(user.keys))
      );
    }

    if (data.quyenxem === 'Private') {
      return (
        (user.keys && data.keysJSON === user.keys) ||
        (user.chinhanh && data.cuahang?.includes(user.chinhanh)) ||
        (user.bophan && data.bophanADS?.includes(user.bophan)) ||
        (user.keys && data.accounts?.includes(user.keys))
      );
    }

    return false;
  }, [data, user, hasxemPermission, hasxlphPermission]);

  const renderQuestions = useMemo(() => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
        </div>
      );
    }

    const questionsToRender = filteredQuestions.length > 0 ? filteredQuestions : data?.questions || [];

    if (questionsToRender.length === 0) {
      return <Empty description='Không có câu hỏi nào để hiển thị.' />;
    }

    return questionsToRender.map((question, index) => {
      const { luachon } = question;

      return (
        <div
          key={question.id || `question-${index}`}
          ref={(el) => {
            if (el) {
              questionRefs.current[index] = el;
              observerRefs.current[index] = el;
            }
          }}
          data-index={index}
        >
          {forceRender || isInDrawer || visibleQuestions.has(index) ? (
            <>
              {question.subtitle && (question.subtitle.tieudephieuthem || question.subtitle.noidungphieuthem) && (
                <Container
                  css="border-left-niso"
                  content={
                    <>
                      <Text strong>{question.subtitle.tieudephieuthem || ''}</Text>
                      <div dangerouslySetInnerHTML={{ __html: question.subtitle.noidungphieuthem || '' }} />
                    </>
                  }
                />
              )}
              <Container
                content={
                  <>
                    {data.demcauhoi === true && (
                      <span>
                        {question.cauhoibatbuoc && <span style={{ color: 'red' }}> *</span>}
                        Câu hỏi {index + 1}.
                      </span>
                    )}
                    <Space direction="horizontal" style={{ justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                      <Space direction="horizontal" style={{ alignItems: 'flex-start' }}>
                        {question.cauhoibatbuoc && !data.demcauhoi && <span style={{ color: 'red' }}> *</span>}
                        <div>
                        {Object.keys(question).map((key) => {
                                  if (key.startsWith("Cauhoi")) {
                                    return (
                                      <div
                                        key={key}
                                        dangerouslySetInnerHTML={{
                                          __html: question[key] ? question[key].replace(/ /g, " ") : "",
                                        }}
                                        style={{ marginBottom: 6, lineHeight: 1.6 }}
                                      />
                                    );
                                  }
                                  return null;
                                })}
                          {question.yeu_cau && <div dangerouslySetInnerHTML={{ __html: question.yeu_cau }} style={{ lineHeight: 1.6 }} />}
                        </div>
                      </Space>
                      {Boolean(question.point) && question.point !== '0' && (
                        <Text
                          style={{
                            fontSize: 11,
                            opacity: 0.6,
                            whiteSpace: 'nowrap',
                            alignItems: 'flex-start',
                            color: getAnswerStyle(question.answer, question.cautraloi, question.xulynhiemvu, luachon, question.options, question.questionId, data?.pointConfigNangCao),
                          }}
                        >
                          {question.point} điểm
                        </Text>
                      )}
                    </Space>
                    <Space direction="vertical" style={{ width: '100%', marginTop: '10px' }}>
                      {renderAnswer(question)}
                      {question.laplai && Number(question.laplai) > 0 && data.solanlaplai && (
                        <Button type="link" style={{ padding: 0 }}>
                          Số lần lặp lại: {question.laplai}
                        </Button>
                      )}
                      {question.hinhanh?.length > 0 && (
                        <>
                          <Image.PreviewGroup>
                            {question.hinhanh.map((image) => (
                              <Image key={image.uid} width={50} height={50} src={image.url} alt={image.name} />
                            ))}
                          </Image.PreviewGroup>
                          <i style={{ fontSize: 11 }}>Hình ảnh đính kèm</i>
                        </>
                      )}
                      {data?.yeucauxuly && question.answer && question.cautraloi && question.cautraloi !== '' && (
                        (() => {
                          let isIncorrectAnswer = false;

                          if (luachon?.option2 || luachon?.option3) {
                            if (luachon?.option2) {
                              isIncorrectAnswer = String(question.answer).toLowerCase().trim() !== String(question.cautraloi).toLowerCase().trim();
                            } else {
                              if (Array.isArray(question.answer)) {
                                const answerStr = question.answer
                                  .map((a) => String(a).toLowerCase().trim())
                                  .sort()
                                  .join();
                                const correctStr = Array.isArray(question.cautraloi)
                                  ? question.cautraloi.map((a) => String(a).toLowerCase().trim()).sort().join()
                                  : String(question.cautraloi).toLowerCase().split(',').map((a) => a.trim()).sort().join();
                                isIncorrectAnswer = answerStr !== correctStr;
                              }
                            }
                          } else {
                            isIncorrectAnswer = String(question.answer).toLowerCase().trim() !== String(question.cautraloi).toLowerCase().trim();
                          }

                          if (!isIncorrectAnswer) return null;

                          return question.xulynhiemvu || question.batxuly ? (
                            <Space direction="vertical">
                              <Text style={{ fontSize: 11, opacity: 0.6 }}>
                                <FieldTimeOutlined style={{ marginRight: 5 }} />
                                {question.thoigianpheduyet} bởi {question.nguoiduyet}
                              </Text>
                              <Space>
                                <Alert message={'Đã xử lý'} type="success" showIcon />
                                <Button
                                  onClick={() => {
                                    if (onShowXulyDrawer) {
                                      onShowXulyDrawer(data, question.id);
                                    } else {
                                      navigate(`/auth/docs/form/views/${finalId}/${question.id}`);
                                    }
                                  }}
                                  type="link"
                                  size="small"
                                  icon={<ArrowRightOutlined />}
                                >
                                  Xem lại
                                </Button>
                              </Space>
                            </Space>
                          ) : (
                            <Button
                              onClick={() => handleReceiveTask(data, question.id)}
                              type="primary"
                              style={{ width: '100%' }}
                              icon={<CheckOutlined />}
                            >
                              Nhận xử lý
                            </Button>
                          );
                        })()
                      )}
                      {user?.keys && data?.keysJSON && question.batxuly === true && (
                        !question.xacnhancauhoi ? (
                          <Button
                            type="primary"
                            style={{ width: '100%' }}
                            onClick={() => showConfirmModal('xacnhancauhoi', data.responseId, question.id)}
                            loading={processingAction && processingAction.action === 'xacnhancauhoi' && processingAction.questionId === question.id}
                            icon={<CheckOutlined />}
                          >
                            {'Xác nhận hoàn tất'}
                          </Button>
                        ) : (
                          <Alert message={'Đã xác nhận hoàn tất'} type="success" showIcon />
                        )
                      )}
                    </Space>
                  </>
                }
              />
            </>
          ) : (
            <div style={{ height: '150px' }}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </div>
          )}
        </div>
      );
    });
  }, [data, filteredQuestions, visibleQuestions, loading, renderAnswer, getAnswerStyle, handleReceiveTask, onShowXulyDrawer, navigate, finalId, user, showConfirmModal, processingAction, isInDrawer, forceRender]);

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '50px 0', textAlign: 'center' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );
  }

  if (error || !hasPermission()) {
    return <NotFoundPage />;
  }

  return (
    <App>
      <div>
        <Modal
          title={null}
          open={isLoginModalVisible}
          onCancel={() => setIsLoginModalVisible(false)}
          width={420}
          bodyStyle={{
            padding: '40px 30px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)',
          }}
          closeIcon={null}
          footer={[
            <Row justify="center">
              <Button key="login" type="primary" onClick={handleLoginRedirect} icon={<UserOutlined />} style={{ width: '100%' }}>
                {'Đăng nhập'}
              </Button>
            </Row>,
          ]}
        >
          <div className="text-center">
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #f0f3f6, #e3e6ea)',
                boxShadow: '8px 8px 16px #d1d4d9, -8px -8px 16px #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                transform: 'perspective(200px) rotateX(10deg)',
              }}
            >
              <LockOutlined
                style={{
                  fontSize: '48px',
                  color: '#4a4a4a',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                }}
              />
            </div>
            <h2
              style={{
                color: '#333',
                marginBottom: '16px',
                fontWeight: 600,
                fontSize: '22px',
                textAlign: 'center',
              }}
            >
              {'Yêu cầu đăng nhập'}
            </h2>
            <p
              style={{
                color: '#666',
                marginBottom: '24px',
                lineHeight: 1.6,
                textAlign: 'center',
              }}
            >
              {'Vui lòng đăng nhập để tiếp tục truy cập và xử lý nhiệm vụ của bạn.'}
            </p>
          </div>
        </Modal>

        <Modal
          title={'Assigned'}
          open={isAssignModalVisible}
          onOk={handleAssignSubmit}
          onCancel={handleAssignCancel}
          okText={'Lưu'}
          cancelText={'Hủy'}
          width={600}
          confirmLoading={loading}
        >
          <Space direction="vertical" style={{ width: '100%', gap: 16 }}>
            <div>
              <Text strong>Nhà hàng</Text>
              <Select
                mode="multiple"
                placeholder="Chọn nhà hàng..."
                showSearch
                onSearch={(value) => debouncedSearchShops(value)}
                filterOption={false}
                loading={chiNhanhLoading}
                style={{ width: '100%', marginTop: 8 }}
                value={formValues.cuahang}
                onChange={(value) => setFormValues((prev) => ({ ...prev, cuahang: value }))}
                notFoundContent={chiNhanhLoading ? (
                  <div style={{ textAlign: 'center', padding: '10px' }}>
                    <Space>
                      <Spin size="small" />
                      <span>Loading...</span>
                    </Space>
                  </div>
                ) : null}
              >
                {chiNhanhOptions.map((item) => (
                  <Option key={item} value={item}>
                    {item.toUpperCase()}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <Text strong>Phòng ban</Text>
              <Select
                mode="multiple"
                placeholder="Chọn phòng ban..."
                showSearch
                onSearch={(value) => debouncedSearchDepartments(value)}
                filterOption={false}
                loading={phongBanLoading}
                style={{ width: '100%', marginTop: 8 }}
                value={formValues.bophanADS}
                onChange={(value) => setFormValues((prev) => ({ ...prev, bophanADS: value }))}
                notFoundContent={phongBanLoading ? (
                  <div style={{ textAlign: 'center', padding: '10px' }}>
                    <Space>
                      <Spin size="small" />
                      <span>Loading...</span>
                    </Space>
                  </div>
                ) : null}
              >
                {phongBanOptions.map((item) => (
                  <Option key={item} value={item}>
                    {item.toUpperCase()}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <Text strong>Người dùng</Text>
              <Select
                mode="multiple"
                placeholder="Tìm kiếm người dùng..."
                showSearch
                onSearch={(value) => debouncedFetchUsers(value)}
                filterOption={false}
                loading={userSearchLoading}
                style={{ width: '100%', marginTop: 8 }}
                value={formValues.accounts}
                onChange={(value) => setFormValues((prev) => ({ ...prev, accounts: value }))}
                notFoundContent={userSearchLoading ? (
                  <div style={{ textAlign: 'center', padding: '10px' }}>
                    <Space>
                      <Spin size="small" />
                      <span>Loading...</span>
                    </Space>
                  </div>
                ) : userOptions.length === 0 ? (
                  <Empty description="Không tìm thấy tài khoản" />
                ) : null}
              >
                {userOptions.map((item) => (
                  <Option key={item.keys} value={item.keys}>
                    <Tooltip
                      title={<UserInfoCard user={item} />}
                      placement={window.innerWidth < 768 ? 'top' : 'right'}
                      color="white"
                      overlayStyle={{ maxWidth: 300 }}
                    >
                      <Space>
                        {item.imgAvatar && item.imgAvatar !== 'null' ? (
                          <Avatar src={item.imgAvatar} size="small" />
                        ) : (
                          <Avatars user={{ name: item.name }} sizeImg="small" />
                        )}
                        {item.name || item.username || 'Unknown'}
                      </Space>
                    </Tooltip>
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <Text strong>{'Hạn xử lý'}</Text>
              <DatePicker
                showTime
                format="DD-MM-YYYY HH:mm:ss"
                placeholder={'Chọn thời hạn'}
                style={{ width: '100%', marginTop: 8 }}
                value={formValues.thoigianxuly ? dayjs(formValues.thoigianxuly) : null}
                onChange={(value) => setFormValues((prev) => ({ ...prev, thoigianxuly: value ? value.toDate() : null }))}
              />
            </div>
          </Space>
        </Modal>

        <Modal
          title={'Đáp án đúng'}
          open={isModalVisible}
          onOk={handleCancel}
          closable={false}
          footer={[
            <Button key="ok" type="primary" onClick={handleCancel}>
              Xác nhận
            </Button>,
          ]}
        >
          {(() => {
            if (!data || !selectedAnswer) return <p>{selectedAnswer}</p>;

            const question = data.questions.find((q) => q.cautraloi === selectedAnswer);
            if (!question) return <p>{selectedAnswer}</p>;

            const { luachon, options } = question;

            if (luachon?.option1 || luachon?.option5 || luachon?.option6 || (!luachon?.option2 && !luachon?.option3 && !luachon?.option4)) {
              return (
                <TextArea
                  autoSize
                  readOnly
                  value={selectedAnswer || 'Chưa trả lời'}
                  style={{
                    color: selectedAnswer ? null : '#f39b9d',
                    background: 'transparent',
                    boxShadow: 'none',
                    border: 'none',
                    borderRadius: 6,
                  }}
                />
              );
            }

            if (luachon?.option2) {
              const correctOptions = options?.filter((option) => option.tuychon === selectedAnswer) || [];
              return (
                <Radio.Group value={selectedAnswer} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {correctOptions.map((option, index) => (
                    <Radio key={index} value={option.tuychon}>
                      {option.tuychon}
                    </Radio>
                  ))}
                  {question.tuychonkhac && selectedAnswer === 'other' && (
                    <Radio value="other">Khác</Radio>
                  )}
                </Radio.Group>
              );
            }

            if (luachon?.option3) {
              const correctAnswers = Array.isArray(selectedAnswer)
                ? selectedAnswer
                : selectedAnswer.split(',').map((a) => a.trim());
              const correctOptions = options?.filter((option) => correctAnswers.includes(option.tuychonnhieu)) || [];
              return (
                <Checkbox.Group value={correctAnswers} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {correctOptions.map((option, index) => (
                    <Checkbox key={index} value={option.tuychonnhieu}>
                      {option.tuychonnhieu}
                    </Checkbox>
                  ))}
                  {question.tuychonkhac && correctAnswers.includes('other') && (
                    <Checkbox value="other">Khác</Checkbox>
                  )}
                </Checkbox.Group>
              );
            }
            return <p>{selectedAnswer}</p>;
          })()}
        </Modal>

        <BoxHeader
          data={data}
          user={user}
          isInDrawer={isInDrawer}
          navigate={navigate}
          t={t}
          exportToExcel={exportToExcel}
          handleStatusChange={handleStatusChange}
        />

        <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: isInDrawer ? 8 : 8 }} className={data && data.quyenxem === true && (!user || !user.keys) ? 'layout__container3' : !isInDrawer ? 'layout_main_niso' : ''}>
          <title>
            NISO CHECKLIST | Phản hồi phiếu {loading ? 'Loading...' : data?.title}
          </title>
          <BoxView
            t={t}
            data={data}
            sumPoint={advancedPoints.sumPoint}
            getPoint={advancedPoints.getPoint}
            hasPoints={advancedPoints.hasPoints}
            loading={loading}
            advancedPoints={advancedPoints}
            user={user}
            hasxlphPermission={hasxlphPermission}
            autoFilterIncorrect={autoFilterIncorrect}
            handleFilterChange={handleFilterChange}
          />
          {data?.khach && (
            <Container
              content={
                <>
                  <p style={{ marginBottom: 10 }}>Nhà hàng đã chọn:</p>
                  <Select style={{ width: '100%' }} value={data?.chi_nhanh || ''} open={false} />
                </>
              }
            />
          )}
          <Container
            css="niso-box-titles"
            content={
              loading ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : (
                <>
                  <Title level={2}>{data?.title ?? 'N/A'}</Title>
                  {data && <div dangerouslySetInnerHTML={{ __html: data.contentTitle || '' }} />}
                  {hasRequiredQuestions && (
                    <Tag color="red" style={{ marginTop: 15 }} bordered={false}>
                      * Biểu thị câu hỏi bắt buộc
                    </Tag>
                  )}
                </>
              )
            }
          />
          {renderQuestions}
        </div>
        {!user && (
          <Footer style={{ textAlign: 'center', paddingTop: 15, cursor: 'pointer' }}>
            <img src={Logo} alt="Logo NISO" width={32} onClick={() => navigate('/')} />
            <Footers />
          </Footer>
        )}
        <BacktoTop />
      </div>
    </App>
  );
};

export default React.memo(ViewUser);