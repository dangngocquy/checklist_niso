import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Skeleton, message, Modal, Spin } from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import Container from '../../config/PhieuChecklist/Container';
import BacktoTop from '../../config/BacktoTop';
import debounce from 'lodash/debounce';
import NotFoundPage from '../NotFoundPage';
import useApi from '../../hook/useApi';
import moment from 'moment';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { EditHeader } from './design/EditHeader';
import { EditTitle } from './design/EditTitle';
import { EditDapan } from './design/EditDapan';
import { EditOptionOne } from './design/EditOptionOne';
import { EditOptionTwo } from './design/EditOptionTwo';
import { EditOptionThree } from './design/EditOptionThree';
import { EditOptionFour } from './design/EditOptionFour';
import { EditTieuDePhu } from './design/EditTieuDePhu';
import { EditMain } from './design/EditMain';
import { EditOptionZero } from './design/EditOptionZero';

const MemoizedEditTieuDePhu = React.memo(EditTieuDePhu);
const MemoizedEditMain = React.memo(EditMain);
const MemoizedEditOptionOne = React.memo(EditOptionOne);
const MemoizedEditOptionTwo = React.memo(EditOptionTwo);
const MemoizedEditOptionThree = React.memo(EditOptionThree);
const MemoizedEditOptionFour = React.memo(EditOptionFour);

const Edit = React.memo(({ id: propId, user, t, isInDrawer = true, hasEditPermission }) => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const [docData, setDocData] = useState(null);
  const [form] = Form.useForm();
  const [activeButtons, setActiveButtons] = useState({});
  const [isNotFound, setIsNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSubtitleContainer, setShowSubtitleContainer] = useState({});
  const [visibleQuestions, setVisibleQuestions] = useState({});
  const [showRequirement, setShowRequirement] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);
  const questionRefs = useRef({});
  const finalId = propId || paramId;
  const { fetchChecklistById, updateChecklist, miscApi } = useApi();
  const isFormInitialized = useRef(false);
  const observerRef = useRef(null);

  // Initialize IntersectionObserver
  const setupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.index);
            setVisibleQuestions((prev) => ({ ...prev, [index]: true }));
            observerRef.current.unobserve(entry.target); // Unobserve to reduce overhead
          }
        });
      },
      { rootMargin: '200px', threshold: 0.1 }
    );
  }, []);

  useEffect(() => {
    if (!docData?.questions || isFormInitialized.current) return;

    try {
      const updatedFormData = docData.questions.map((question, index) => {
        const subtitle = question.subtitle || { tieudephieuthem: '', noidungphieuthem: '' };
        return {
          [`Cauhoi${index + 1}`]: question[`Cauhoi${index + 1}`] || question.noidung || '',
          luachon: question.luachon?.option0 ? 'option0' :
            question.luachon?.option1 ? 'option1' :
              question.luachon?.option2 ? 'option2' :
                question.luachon?.option3 ? 'option3' :
                  question.luachon?.option4 ? 'option4' : 'option0',
          cauhoibatbuoc: question.cauhoibatbuoc || false,
          batxuly: question.batxuly || false,
          yeu_cau: question.yeu_cau || '',
          options: question.options || [],
          tuychonkhac: question.tuychonkhac || false,
          plusnumber: question.plusnumber || 5,
          luachonbieutuong: question.luachonbieutuong?.ngoisao ? 'ngoisao' :
            question.luachonbieutuong?.traitim ? 'traitim' :
              question.luachonbieutuong?.daukiem ? 'daukiem' :
                question.luachonbieutuong?.so ? 'so' : 'ngoisao',
          subtitle: {
            tieudephieuthem: subtitle.tieudephieuthem || '',
            noidungphieuthem: subtitle.noidungphieuthem || '',
          },
          noidung: question.noidung || '',
          cautraloi: question.cautraloi || (question.luachon?.option4 ? 0 : ''),
          point: question.point || '',
          otherAnswer: question.otherAnswer || '',
        };
      });

      form.setFieldsValue({
        title: docData.title,
        contentTitle: docData.contentTitle,
        questions: updatedFormData,
      });
      isFormInitialized.current = true;

      // Set up observer and observe all questions
      setupObserver();
      Object.values(questionRefs.current).forEach((ref) => {
        if (ref) observerRef.current.observe(ref);
      });

      // Initially mark first few questions as visible to avoid Skeleton
      setVisibleQuestions((prev) => {
        const newVisible = { ...prev };
        docData.questions.forEach((_, index) => {
          if (index < 5) newVisible[index] = true; // Show first 5 questions immediately
        });
        return newVisible;
      });
    } catch (error) {
      console.error('Error initializing form fields:', error);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [docData, form, setupObserver]);

  const showModal = useCallback((index) => {
    if (index >= 0 && index < docData.questions.length) {
      setCurrentQuestionIndex(index);
      const currentQuestion = docData.questions[index];
      const currentFormQuestions = form.getFieldValue('questions') || [];

      const updatedQuestion = {
        ...currentFormQuestions[index],
        cautraloi: currentQuestion.cautraloi || currentFormQuestions[index]?.cautraloi || '',
        cautraloimoikhac: currentQuestion.cautraloimoikhac || currentFormQuestions[index]?.cautraloimoikhac || '',
        tuychonkhac: currentQuestion.tuychonkhac || currentFormQuestions[index]?.tuychonkhac || false,
        point: currentQuestion.point || currentFormQuestions[index]?.point || '',
      };

      currentFormQuestions[index] = updatedQuestion;
      form.setFieldsValue({ questions: currentFormQuestions });
      setIsModalVisible(true);
    }
  }, [docData, form]);

  const handleModalOk = useCallback(() => {
    const currentPoint = form.getFieldValue(['questions', currentQuestionIndex, 'point']) || '';
    const currentAnswer = form.getFieldValue(['questions', currentQuestionIndex, 'cautraloi']);
    const currentOtherAnswer = form.getFieldValue(['questions', currentQuestionIndex, 'cautraloimoikhac']);

    setDocData((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[currentQuestionIndex] = {
        ...newQuestions[currentQuestionIndex],
        point: currentPoint,
        cautraloi: currentAnswer || '',
        cautraloimoikhac: currentOtherAnswer || '',
      };
      return { ...prev, questions: newQuestions };
    });

    const currentFormQuestions = form.getFieldValue('questions') || [];
    currentFormQuestions[currentQuestionIndex] = {
      ...currentFormQuestions[currentQuestionIndex],
      point: currentPoint,
      cautraloi: currentAnswer || '',
      cautraloimoikhac: currentOtherAnswer || '',
    };
    form.setFieldsValue({ questions: currentFormQuestions });

    setIsModalVisible(false);
  }, [form, currentQuestionIndex]);

  const handleModalCancel = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchChecklistById(finalId);
      if (!data) {
        setIsNotFound(true);
        return;
      }
      setDocData(data);
      isFormInitialized.current = false;
      const initialActiveButtons = {};
      const initialShowSubtitle = {};
      const initialShowRequirement = {};
      data.questions.forEach((question, index) => {
        if (question.luachon.option4) {
          initialActiveButtons[index] = question.answer || 0;
        }
        initialShowSubtitle[index] = !!question.subtitle?.tieudephieuthem || !!question.subtitle?.noidungphieuthem;
        initialShowRequirement[index] = !!question.yeu_cau;
      });
      setActiveButtons(initialActiveButtons);
      setShowSubtitleContainer(initialShowSubtitle);
      setShowRequirement(initialShowRequirement);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [finalId, fetchChecklistById]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createChecklist = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await axios.post('/checklist/create', data, {
        headers: {
          'Authorization': `Basic ${btoa(process.env.REACT_APP_API_USERNAME)}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating checklist:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDuplicate = useCallback(async () => {
    try {
      setLoading(true);
      const values = form.getFieldsValue();
      const originalTitle = values.title || docData.title;
      const userKeys = user.keys;

      const extractBaseTitleAndCopyNumber = (title) => {
        const copyRegex = /^(.*?)(\s*\(Copy\s*(\d+)\))?$/i;
        const match = title.match(copyRegex);
        if (match) {
          const baseTitle = match[1].trim();
          const copyNumber = match[3] ? parseInt(match[3], 10) : 0;
          return { baseTitle, copyNumber };
        }
        return { baseTitle: title.trim(), copyNumber: 0 };
      };

      const { baseTitle, copyNumber } = extractBaseTitleAndCopyNumber(originalTitle);
      let newCopyNumber = copyNumber + 1;
      let newTitle = `${baseTitle} (Copy ${newCopyNumber})`;

      let titleExists = true;
      while (titleExists) {
        try {
          const response = await miscApi.checkTitleExists(newTitle, userKeys);
          if (!response.exists) {
            titleExists = false;
          } else {
            newCopyNumber++;
            newTitle = `${baseTitle} (Copy ${newCopyNumber})`;
          }
        } catch (error) {
          console.error('Error checking duplicate titles:', error);
          titleExists = false;
        }
      }

      const duplicateData = {
        ...docData,
        title: newTitle,
        id: uuidv4(),
        date: moment().format('DD-MM-YYYY HH:mm:ss'),
        questions: docData.questions.map(q => ({
          ...q,
          questionId: uuidv4(),
        })),
        keysJSON: userKeys,
        userKeys: userKeys,
        cautraloi: docData.cautraloi || [],
        everyquyen: docData.everyquyen,
        background: docData.background,
        colorNen: docData.colorNen,
        nhap: docData.nhap || false,
        phongban: docData.phongban || [],
        account: docData.account || [],
        hinhanh: docData.hinhanh || [],
        taptin: docData.taptin || [],
        solanlaplai: docData.solanlaplai || 0,
        threeimg: docData.threeimg || [],
        sqlsend: docData.sqlsend || false,
        yeucauxuly: docData.yeucauxuly || false,
        demcauhoi: docData.demcauhoi || false,
        save: docData.save || [],
        dateBookmark: docData.dateBookmark || null,
        TimeSaveNhap: docData.nhap ? moment().format('DD-MM-YYYY HH:mm:ss') : null,
        bophanADS: docData.bophanADS || [],
        cuahang: docData.cuahang || [],
      };

      const response = await createChecklist(duplicateData);
      message.success(`Đã tạo bản sao: ${newTitle}`);

      if (!isInDrawer) {
        navigate(`/edit/${response.id}`);
      } else {
        fetchData();
      }
    } catch (error) {
      console.error('Error duplicating checklist:', error);
      message.error('Có lỗi khi tạo bản sao!');
    } finally {
      setLoading(false);
    }
  }, [docData, form, createChecklist, navigate, isInDrawer, user, miscApi, fetchData]);

  const debouncedCKEditorChange = useMemo(() => debounce((index, data, field) => {
    try {
      form.setFieldsValue({ questions: { [index]: { [field]: data } } });
    } catch (error) {
      console.error('Error updating CKEditor field:', error);
    }
  }, 300), [form]);

  const handleButtonClick = useCallback((questionIndex, buttonIndex) => {
    setActiveButtons(prev => ({ ...prev, [questionIndex]: buttonIndex }));
    try {
      form.setFieldsValue({ questions: { [questionIndex]: { cautraloi: buttonIndex } } });
    } catch (error) {
      console.error('Error updating button click:', error);
    }
  }, [form]);

  const moveQuestion = useCallback((sourceIndex, destinationIndex) => {
    setDocData(prev => {
      if (!prev || !prev.questions) return prev;

      const currentFormValues = form.getFieldsValue();
      const currentQuestions = currentFormValues.questions || [];

      const newQuestions = [...prev.questions].map((question, idx) => {
        const formQuestion = currentQuestions[idx] || {};
        return {
          ...question,
          [`Cauhoi${idx + 1}`]: formQuestion[`Cauhoi${idx + 1}`] || question[`Cauhoi${idx + 1}`] || '',
          subtitle: formQuestion.subtitle || question.subtitle || { tieudephieuthem: '', noidungphieuthem: '' },
          luachon: formQuestion.luachon
            ? {
              option0: formQuestion.luachon === 'option0',
              option1: formQuestion.luachon === 'option1',
              option2: formQuestion.luachon === 'option2',
              option3: formQuestion.luachon === 'option3',
              option4: formQuestion.luachon === 'option4',
              option5: false,
              option6: false,
            }
            : question.luachon || { option0: true, option1: false, option2: false, option3: false, option4: false, option5: false, option6: false },
          point: formQuestion.point || question.point || '',
        };
      });

      const [movedQuestion] = newQuestions.splice(sourceIndex, 1);
      newQuestions.splice(destinationIndex, 0, movedQuestion);

      const updatedFormQuestions = newQuestions.map((question, newIndex) => {
        const oldIndex = sourceIndex === newIndex ? destinationIndex :
          destinationIndex === newIndex ? sourceIndex : newIndex;
        const formQuestion = currentQuestions[oldIndex] || {};
        const originalQuestion = prev.questions[oldIndex] || {};

        const subtitleData = formQuestion.subtitle || originalQuestion.subtitle || { tieudephieuthem: '', noidungphieuthem: '' };

        const selectedLuachon = formQuestion.luachon ||
          (originalQuestion.luachon.option0 ? 'option0' :
            originalQuestion.luachon.option1 ? 'option1' :
              originalQuestion.luachon.option2 ? 'option2' :
                originalQuestion.luachon.option3 ? 'option3' :
                  originalQuestion.luachon.option4 ? 'option4' : 'option0');

        return {
          [`Cauhoi${newIndex + 1}`]: formQuestion[`Cauhoi${oldIndex + 1}`] || originalQuestion[`Cauhoi${oldIndex + 1}`] || '',
          luachon: selectedLuachon,
          cauhoibatbuoc: formQuestion.cauhoibatbuoc ?? originalQuestion.cauhoibatbuoc ?? false,
          batxuly: formQuestion.batxuly ?? originalQuestion.batxuly ?? false,
          yeu_cau: formQuestion.yeu_cau || originalQuestion.yeu_cau || '',
          options: formQuestion.options || originalQuestion.options || [],
          tuychonkhac: formQuestion.tuychonkhac ?? originalQuestion.tuychonkhac ?? false,
          plusnumber: formQuestion.plusnumber || originalQuestion.plusnumber || 5,
          luachonbieutuong: formQuestion.luachonbieutuong || originalQuestion.luachonbieutuong || 'ngoisao',
          subtitle: subtitleData,
          noidung: formQuestion.noidung || originalQuestion.noidung || '',
          cautraloi: formQuestion.cautraloi || originalQuestion.cautraloi || '',
          otherAnswer: formQuestion.otherAnswer || originalQuestion.otherAnswer,
          point: formQuestion.point || originalQuestion.point || '',
        };
      });

      try {
        form.setFieldsValue({ questions: updatedFormQuestions });
      } catch (error) {
        console.error('Error updating form after moving question:', error);
      }

      const updateIndexMapping = (stateObj) => {
        const newState = {};
        Object.entries(stateObj).forEach(([key, value]) => {
          const numKey = Number(key);
          if (numKey === sourceIndex) {
            newState[destinationIndex] = value;
          } else if (numKey === destinationIndex) {
            newState[sourceIndex] = value;
          } else {
            newState[numKey] = value;
          }
        });
        return newState;
      };

      setActiveButtons(prev => updateIndexMapping(prev));
      setShowSubtitleContainer(prev => updateIndexMapping(prev));
      setShowRequirement(prev => updateIndexMapping(prev));
      setVisibleQuestions(prev => updateIndexMapping(prev));

      const newRefs = {};
      Object.entries(questionRefs.current).forEach(([key, value]) => {
        const numKey = Number(key);
        if (numKey === sourceIndex) {
          newRefs[destinationIndex] = value;
        } else if (numKey === destinationIndex) {
          newRefs[sourceIndex] = value;
        } else {
          newRefs[numKey] = value;
        }
      });
      questionRefs.current = newRefs;

      // Re-observe questions after moving
      setupObserver();
      Object.values(questionRefs.current).forEach((ref) => {
        if (ref) observerRef.current.observe(ref);
      });

      return { ...prev, questions: newQuestions };
    });
  }, [form, setupObserver]);

  const debouncedFormUpdate = useMemo(() => debounce((values) => {
    form.setFieldsValue(values);
  }, 100), [form]);

  const addQuestion = useCallback(() => {
    const currentValues = form.getFieldsValue();

    if (!currentValues.title?.trim()) {
      message.warning('Vui lòng nhập tiêu đề trước khi thêm câu hỏi!');
      return;
    }

    if (currentValues.questions) {
      const emptyQuestion = currentValues.questions.find((q, index) =>
        !q[`Cauhoi${index + 1}`]?.trim()
      );
      if (emptyQuestion) {
        message.warning('Vui lòng nhập nội dung cho câu hỏi trước đó trước khi thêm câu hỏi mới!');
        return;
      }

      const invalidOptionQuestion = currentValues.questions.find((q, index) =>
        (q.luachon === 'option2' || q.luachon === 'option3') &&
        (!q.options || q.options.length === 0 || q.options.every(opt => !opt.tuychon?.trim() && !opt.tuychonnhieu?.trim()))
      );
      if (invalidOptionQuestion) {
        message.warning('Vui lòng thêm ít nhất một tùy chọn cho các câu hỏi trắc nghiệm hoặc hộp kiểm!');
        return;
      }
    }

    const newQuestionIndex = (currentValues.questions?.length || 0);
    const newQuestionForm = {
      [`Cauhoi${newQuestionIndex + 1}`]: '',
      luachon: 'option0',
      cauhoibatbuoc: false,
      batxuly: false,
      yeu_cau: '',
      options: [],
      tuychonkhac: false,
      plusnumber: 5,
      luachonbieutuong: 'ngoisao',
      subtitle: { tieudephieuthem: '', noidungphieuthem: '' },
      noidung: '',
      cautraloi: '',
    };

    debouncedFormUpdate({
      ...currentValues,
      questions: [...(currentValues.questions || []), newQuestionForm],
    });

    setDocData(prev => {
      const currentQuestions = prev?.questions || [];
      const newQuestion = {
        [`Cauhoi${newQuestionIndex + 1}`]: '',
        questionId: `${Date.now()}-${newQuestionIndex}`,
        luachon: { option0: true, option1: false, option2: false, option3: false, option4: false },
        cauhoibatbuoc: false,
        batxuly: false,
        yeu_cau: '',
        options: [],
        tuychonkhac: false,
        plusnumber: 5,
        luachonbieutuong: { ngoisao: true, traitim: false, daukiem: false, so: false },
        subtitle: { tieudephieuthem: '', noidungphieuthem: '' },
        noidung: '',
        cautraloi: '',
      };

      const newQuestions = [...currentQuestions, newQuestion];

      // Make new question visible if it's near the bottom
      setVisibleQuestions(prevVisible => ({
        ...prevVisible,
        [newQuestionIndex]: newQuestionIndex >= currentQuestions.length - 5, // Visible if near bottom
      }));

      // Re-observe all questions, including the new one
      setTimeout(() => {
        setupObserver();
        Object.values(questionRefs.current).forEach((ref) => {
          if (ref) observerRef.current.observe(ref);
        });
      }, 0);

      return { ...prev, questions: newQuestions };
    });
  }, [form, debouncedFormUpdate, setupObserver]);

  const deleteQuestion = useCallback((index) => {
    setDocData(prev => {
      if (!prev || !prev.questions || prev.questions.length <= 1) return prev;

      const newQuestions = prev.questions.filter((_, i) => i !== index);
      const currentFormValues = form.getFieldsValue();

      const updatedQuestions = newQuestions.map((q, i) => {
        const subtitle = currentFormValues.questions?.[i]?.subtitle || q.subtitle || { tieudephieuthem: '', noidungphieuthem: '' };
        return {
          ...q,
          [`Cauhoi${i + 1}`]: currentFormValues.questions?.[i]?.[`Cauhoi${i + 1}`] || q[`Cauhoi${i + 1}`] || '',
          noidung: currentFormValues.questions?.[i]?.noidung || q.noidung || '',
          cautraloi: currentFormValues.questions?.[i]?.cautraloi,
          luachon: currentFormValues.questions?.[i]?.luachon,
          cauhoibatbuoc: currentFormValues.questions?.[i]?.cauhoibatbuoc,
          batxuly: currentFormValues.questions?.[i]?.batxuly,
          yeu_cau: currentFormValues.questions?.[i]?.yeu_cau,
          options: currentFormValues.questions?.[i]?.options || [],
          tuychonkhac: currentFormValues.questions?.[i]?.tuychonkhac,
          plusnumber: currentFormValues.questions?.[i]?.plusnumber,
          luachonbieutuong: currentFormValues.questions?.[i]?.luachonbieutuong,
          subtitle,
        };
      });

      try {
        form.setFieldsValue({ questions: updatedQuestions });
      } catch (error) {
        console.error('Error updating form after deleting question:', error);
      }

      setActiveButtons(prev => {
        const newActive = {};
        Object.keys(prev).forEach(key => {
          const numKey = Number(key);
          if (numKey < index) newActive[numKey] = prev[numKey];
          else if (numKey > index) newActive[numKey - 1] = prev[numKey];
        });
        return newActive;
      });

      setShowSubtitleContainer(prev => {
        const newSubtitle = {};
        Object.keys(prev).forEach(key => {
          const numKey = Number(key);
          if (numKey < index) newSubtitle[numKey] = prev[numKey];
          else if (numKey > index) newSubtitle[numKey - 1] = prev[numKey];
        });
        return newSubtitle;
      });

      setShowRequirement(prev => {
        const newReq = {};
        Object.keys(prev).forEach(key => {
          const numKey = Number(key);
          if (numKey < index) newReq[numKey] = prev[numKey];
          else if (numKey > index) newReq[numKey - 1] = prev[numKey];
        });
        return newReq;
      });

      setVisibleQuestions(prev => {
        const newVisible = {};
        Object.keys(prev).forEach(key => {
          const numKey = Number(key);
          if (numKey < index) newVisible[numKey] = prev[numKey];
          else if (numKey > index) newVisible[numKey - 1] = prev[numKey];
        });
        return newVisible;
      });

      // Re-observe remaining questions
      setupObserver();
      Object.values(questionRefs.current).forEach((ref) => {
        if (ref) observerRef.current.observe(ref);
      });

      return { ...prev, questions: newQuestions };
    });
  }, [form, setupObserver]);

  const toggleShowRequirement = useCallback((index) => {
    setShowRequirement(prev => ({ ...prev, [index]: !prev[index] }));
  }, []);

  const renderQuestion = useMemo(() => {
    const renderFn = (question, index) => {
      const { tuychonkhac, options } = question;
      const selectedLuachon = form.getFieldValue(['questions', index, 'luachon']) || 'option0';

      const renderContent = () => {
        if (selectedLuachon === 'option0') {
          return (
            <EditOptionZero
              form={form}
              index={index}
              question={question}
              visibleQuestions={visibleQuestions}
              debouncedCKEditorChange={debouncedCKEditorChange}
            />
          );
        }
        if (selectedLuachon === 'option1') {
          return <MemoizedEditOptionOne showModal={showModal} index={index} />;
        }
        if (selectedLuachon === 'option2') {
          return (
            <MemoizedEditOptionTwo
              showModal={showModal}
              index={index}
              options={options}
              tuychonkhac={tuychonkhac}
              setDocData={setDocData}
              form={form}
            />
          );
        }
        if (selectedLuachon === 'option3') {
          return (
            <MemoizedEditOptionThree
              showModal={showModal}
              index={index}
              options={options}
              tuychonkhac={tuychonkhac}
              setDocData={setDocData}
              form={form}
            />
          );
        }
        if (selectedLuachon === 'option4') {
          return (
            <MemoizedEditOptionFour
              index={index}
              activeButtons={activeButtons}
              handleButtonClick={handleButtonClick}
              form={form}
            />
          );
        }
        return null;
      };

      return (
        <div ref={(el) => (questionRefs.current[index] = el)} data-index={index}>
          {visibleQuestions[index] ? (
            <>
              {showSubtitleContainer[index] && (
                <MemoizedEditTieuDePhu
                  form={form}
                  index={index}
                  subtitle={form.getFieldValue(['questions', index, 'subtitle']) || { tieudephieuthem: '', noidungphieuthem: '' }}
                  setShowSubtitleContainer={setShowSubtitleContainer}
                  setDocData={setDocData}
                />
              )}
              <MemoizedEditMain
                t={t}
                question={question}
                index={index}
                docData={docData}
                form={form}
                renderContent={renderContent}
                showSubtitleContainer={showSubtitleContainer}
                deleteQuestion={deleteQuestion}
                moveQuestion={moveQuestion}
                setShowSubtitleContainer={setShowSubtitleContainer}
                toggleShowRequirement={toggleShowRequirement}
                showRequirement={showRequirement}
                setDocData={setDocData}
              />
            </>
          ) : (
            <Skeleton active paragraph={{ rows: 4 }} style={{ marginBottom: 12 }} />
          )}
        </div>
      );
    };
    return renderFn;
  }, [
    activeButtons,
    handleButtonClick,
    moveQuestion,
    form,
    showSubtitleContainer,
    t,
    visibleQuestions,
    showRequirement,
    toggleShowRequirement,
    deleteQuestion,
    debouncedCKEditorChange,
    showModal,
    docData,
    setDocData,
  ]);

  const checkTitleDuplicate = async (rule, value) => {
    if (!value || !value.trim()) {
      return Promise.reject('Vui lòng nhập tiêu đề!');
    }
    try {
      const response = await miscApi.checkTitleExists(value, user.keys, finalId);
      if (response.exists) {
        return Promise.reject('Tiêu đề này đã tồn tại, vui lòng chọn tiêu đề khác!');
      }
      return Promise.resolve();
    } catch (error) {
      console.error('Error checking title:', error);
      return Promise.reject('Có lỗi xảy ra khi kiểm tra tiêu đề!');
    }
  };

  const handleSubmit = useCallback(async () => {
    try {
      // Validate form fields before submission
      await form.validateFields();
      const values = form.getFieldsValue();
      console.log('Form values:', values); // Log form values for debugging

      // Deep copy the original questions to avoid mutating docData
      const originalQuestions = JSON.parse(JSON.stringify(docData.questions));

      // Prepare updated questions, merging form data with original data
      const updatedQuestions = originalQuestions.map((originalQuestion, index) => {
        const formQuestion = values.questions?.[index] || {};

        // Determine selected luachon
        const selectedLuachon = formQuestion.luachon ||
          (originalQuestion.luachon.option0 ? 'option0' :
            originalQuestion.luachon.option1 ? 'option1' :
              originalQuestion.luachon.option2 ? 'option2' :
                originalQuestion.luachon.option3 ? 'option3' :
                  originalQuestion.luachon.option4 ? 'option4' : 'option0');

        // Determine selected luachonbieutuong
        const selectedIcon = formQuestion.luachonbieutuong ||
          (originalQuestion.luachonbieutuong?.ngoisao ? 'ngoisao' :
            originalQuestion.luachonbieutuong?.traitim ? 'traitim' :
              originalQuestion.luachonbieutuong?.daukiem ? 'daukiem' :
                originalQuestion.luachonbieutuong?.so ? 'so' : 'ngoisao');

        // Handle subtitle, preserving existing data
        const subtitle = formQuestion.subtitle || originalQuestion.subtitle || { tieudephieuthem: '', noidungphieuthem: '' };
        // Only trim noidungphieuthem if it's a string, otherwise keep as-is
        const noidungPhieuThem = subtitle.noidungphieuthem && typeof subtitle.noidungphieuthem === 'string'
          ? subtitle.noidungphieuthem.trim()
          : subtitle.noidungphieuthem || '';

        return {
          ...originalQuestion,
          [`Cauhoi${index + 1}`]: formQuestion[`Cauhoi${index + 1}`] || originalQuestion[`Cauhoi${index + 1}`] || '',
          noidung: formQuestion.noidung || originalQuestion.noidung || '',
          luachon: {
            option0: selectedLuachon === 'option0',
            option1: selectedLuachon === 'option1',
            option2: selectedLuachon === 'option2',
            option3: selectedLuachon === 'option3',
            option4: selectedLuachon === 'option4',
            option5: originalQuestion.luachon?.option5 || false,
            option6: originalQuestion.luachon?.option6 || false,
          },
          cauhoibatbuoc: formQuestion.cauhoibatbuoc ?? originalQuestion.cauhoibatbuoc ?? false,
          batxuly: formQuestion.batxuly ?? originalQuestion.batxuly ?? false,
          yeu_cau: formQuestion.yeu_cau || originalQuestion.yeu_cau || '',
          options: formQuestion.options || originalQuestion.options || [],
          tuychonkhac: formQuestion.tuychonkhac ?? originalQuestion.tuychonkhac ?? false,
          plusnumber: formQuestion.plusnumber || originalQuestion.plusnumber || 5,
          luachonbieutuong: {
            ngoisao: selectedIcon === 'ngoisao',
            traitim: selectedIcon === 'traitim',
            daukiem: selectedIcon === 'daukiem',
            so: selectedIcon === 'so',
          },
          subtitle: {
            tieudephieuthem: subtitle.tieudephieuthem || '',
            noidungphieuthem: noidungPhieuThem,
          },
          cautraloi: formQuestion.cautraloi !== undefined ? formQuestion.cautraloi : originalQuestion.cautraloi || '',
          point: formQuestion.point !== undefined ? formQuestion.point : originalQuestion.point || '',
          otherAnswer: formQuestion.otherAnswer !== undefined ? formQuestion.otherAnswer : originalQuestion.otherAnswer,
        };
      });

      // Log prepared data before sending to API
      const updatedData = {
        ...docData,
        title: values.title || docData.title,
        contentTitle: values.contentTitle || docData.contentTitle,
        questions: updatedQuestions,
        nguoichinhsua: user.keys,
        ngaychinhsua: moment().format('DD-MM-YYYY HH:mm:ss'),
      };

      // Show confirmation modal
      Modal.confirm({
        title: 'Xác nhận cập nhật',
        content: 'Bạn có chắc chắn muốn cập nhật checklist này không?',
        okText: 'Cập nhật',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            // Call API to update checklist
            console.log('Calling updateChecklist with ID:', finalId);
            await updateChecklist(finalId, updatedData);
            console.log('API update successful');

            // Update local state
            setDocData(updatedData);
            message.success('Cập nhật checklist thành công!');
          } catch (error) {
            console.error('Error updating checklist via API:', error);
            message.error('Lỗi khi cập nhật checklist: ' + (error.message || 'Không xác định'));
          }
        },
        onCancel: () => {
          console.log('Update cancelled by user');
          message.info('Đã hủy cập nhật');
        },
      });
    } catch (error) {
      console.error('Error during form validation or processing:', error);
      if (error.errorFields) {
        const titleError = error.errorFields.find(field => field.name[0] === 'title');
        if (titleError) {
          message.error('Tiêu đề không hợp lệ hoặc đã tồn tại!');
        } else {
          message.warning('Vui lòng điền đầy đủ các trường bắt buộc!');
        }
      } else {
        message.error('Lỗi xử lý form: ' + (error.message || 'Không xác định'));
      }
    }
  }, [form, docData, finalId, updateChecklist, setDocData, user]);

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '50px 0', textAlign: 'center' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );
  }

  if (isNotFound || (!hasEditPermission && user.phanquyen !== true)) {
    return <NotFoundPage />;
  }

  if (!docData) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }} className='layout_main_niso'>
        <Skeleton loading={true} active />
      </div>
    );
  }

  return (
    <div>
      <EditHeader isInDrawer={isInDrawer} navigate={navigate} docData={docData} handleDuplicate={handleDuplicate} handleSubmit={handleSubmit} />
      <title>NISO | EDIT {docData.title}</title>
      <Form form={form} layout="vertical" style={{ maxWidth: 800, margin: '0 auto' }} className='layout_main_niso'>
        <EditTitle form={form} docData={docData} checkTitleDuplicate={checkTitleDuplicate} />
        {docData.questions.map((question, index) => (
          <React.Fragment key={question.questionId || index}>
            {renderQuestion(question, index)}
          </React.Fragment>
        ))}
        <Container
          content={
            <Button
              onClick={addQuestion}
              icon={<PlusOutlined />}
              type="dashed"
              style={{ width: '100%' }}
            >
              Thêm câu hỏi
            </Button>
          }
        />
      </Form>
      <EditDapan currentQuestionIndex={currentQuestionIndex} form={form} isModalVisible={isModalVisible} handleModalOk={handleModalOk} handleModalCancel={handleModalCancel} />
      <BacktoTop />
    </div>
  );
});

export default Edit;