import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 } from 'uuid';
import NotFoundPage from '../NotFoundPage';
import { Typography, Radio, Input, Tag, Space, Skeleton, Checkbox, Rate, Button, Form, Modal, Result, Select, Upload, Layout, message, Spin } from 'antd';
import Container from '../../config/PhieuChecklist/Container';
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { imageDb } from '../../config';
import BacktoTop from '../../config/BacktoTop';
import { StarOutlined, HeartOutlined, CheckOutlined, LockFilled, EditOutlined, LoadingOutlined } from '@ant-design/icons';
import Footers from '../footer/Footer';
import Logo from '../../assets/Logo.svg';
import moment from 'moment';
import useApi from '../../hook/useApi';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Footer } = Layout;

const Docs = ({ id: propId, user, t, isInDrawer = false, hasEditPermission }) => {
  const [form] = Form.useForm();
  const [doc, setDoc] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeButtons, setActiveButtons] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);
  const [continueAgainModalVisible, setContinueAgainModalVisible] = useState(false);
  const [continueAgainValue, setContinueAgainValue] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [repeatCounts, setRepeatCounts] = useState({});
  const [isNetworkStable, setIsNetworkStable] = useState(true);
  const [hinhanh, setHinhanh] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [visibleQuestions, setVisibleQuestions] = useState(new Set());
  const [transferredBranches, setTransferredBranches] = useState([]);
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const questionRefs = useRef({});
  const observerRefs = useRef({});
  const branchRef = useRef(null);
  const finalId = propId || paramId;

  const {
    fetchDocById,
    submitResponse,
    addContent,
    branchApi,
    fetchResponseById
  } = useApi();

  const branchApiRef = useRef(branchApi);

  useEffect(() => {
    branchApiRef.current = branchApi;
  }, [branchApi]);

  const allowedImageTypes = useMemo(() => ['image/jpeg', 'image/png', 'image/gif'], []);
  const allowedVideoTypes = useMemo(() => ['video/mp4', 'video/quicktime'], []);

  useEffect(() => {
    const fetchTransferredBranches = async () => {
      try {
        const response = await branchApiRef.current.fetchAll({ pagination: 'false' });
        const branches = response.data || [];
        console.log('Raw branch data:', response.data);
        const filteredBranches = branches
          .filter(branch => branch.isTransferred === true)
          .map(branch => branch.restaurant);
        setTransferredBranches(filteredBranches);
      } catch (err) {
        console.error('Error fetching branches:', err);
        message.error('Không thể tải danh sách chi nhánh.');
      }
    };

    fetchTransferredBranches();
  }, []);

  const uploadQueue = useRef({
    queue: [],
    active: 0,
    maxConcurrent: 2,
    add(task) {
      this.queue.push(task);
      this.process();
    },
    async process() {
      if (this.active >= this.maxConcurrent || this.queue.length === 0) return;
      this.active++;
      const task = this.queue.shift();
      try {
        await task();
      } finally {
        this.active--;
        this.process();
      }
    }
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.index);
            setVisibleQuestions(prev => new Set(prev).add(index));
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '100px' }
    );

    Object.values(observerRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [doc?.questions]);

  const scrollToQuestion = useCallback((index) => {
    questionRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, []);

  const scrollToBranch = useCallback(() => {
    branchRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!finalId) {
        setError('No ID provided');
        setLoading(false);
        return;
      }
      try {
        const docData = await fetchDocById(finalId);
        setDoc(docData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError('Error fetching document');
        setLoading(false);
      }
    };

    fetchData();
  }, [finalId, fetchDocById]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isFormDirty) {
        e.preventValue = t('Department.input366');
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty, t]);

  const handleFormChange = useCallback(() => {
    setIsFormDirty(true);
  }, []);

  const normalizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str.trim().toLowerCase().replace(/\s+/g, ' ');
  };

  const renderAnswer = useCallback((question, index) => {
    const { luachon, luachonbieutuong, plusnumber, options } = question;
    const isDisabled = doc?.locktitle || doc?.nhap;

    const responseQuestion = responseData?.questions?.[index];
    const responseOptions = responseQuestion?.options;

    if (luachon.option0) {
      return (
        <Form.Item
          name={`question_${index}`}
          rules={[{ required: question.cauhoibatbuoc, message: t('Department.input366') }]}
          style={{ marginBottom: 0 }}
        >
          <div dangerouslySetInnerHTML={{ __html: question.noidung }} />
        </Form.Item>
      );
    }

    if (luachon.option1 || luachon.option5 || luachon.option6) {
      return (
        <Form.Item
          name={`question_${index}`}
          rules={[{ required: question.cauhoibatbuoc, message: t('Department.input366') }]}
          style={{ marginBottom: 0 }}
        >
          <TextArea rows={4} disabled={isDisabled} style={{ borderRadius: 6 }} />
          {doc?.challenge === "v1.0.1" && responseOptions && responseOptions[0]?.userSelected && (
            <Text style={{ color: responseOptions[0].isCorrect ? 'green' : 'red' }}>
              {responseOptions[0].isCorrect ? 'Đúng' : 'Sai'}
            </Text>
          )}
        </Form.Item>
      );
    }

    if (luachon.option2) {
      return (
        <Form.Item
          name={`question_${index}`}
          rules={[{ required: question.cauhoibatbuoc, message: t('Department.input366') }]}
          style={{ marginBottom: 0 }}
        >
          <Radio.Group
            style={{ display: 'flex', flexDirection: 'column', gap: 5 }}
            onChange={(e) => {
              if (e.target.value === 'other') {
                form.setFieldsValue({ [`question_${index}_other`]: '' });
              }
            }}
            disabled={isDisabled}
          >
            {options.map((option, optionIndex) => (
              <div key={optionIndex} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Radio value={option.tuychon}>
                  {option.tuychon}
                </Radio>
                {doc?.versions === "v1.0.1" && responseOptions && responseOptions[optionIndex]?.userSelected && (
                  <Text style={{ color: responseOptions[optionIndex].isCorrect ? 'green' : 'red' }}>
                    {responseOptions[optionIndex].isCorrect ? 'Đúng' : 'Sai'}
                  </Text>
                )}
              </div>
            ))}
            {question.tuychonkhac && (
              <>
                <Radio value="other">
                  {t('Department.input368')}
                </Radio>
                <Form.Item
                  style={{ marginBottom: 0 }}
                  shouldUpdate={(prevValues, currentValues) =>
                    prevValues[`question_${index}`] !== currentValues[`question_${index}`]
                  }
                  className='abc'
                >
                  {({ getFieldValue }) =>
                    getFieldValue(`question_${index}`) === 'other' && (
                      <Form.Item
                        name={`question_${index}_other`}
                        rules={[{ required: true, message: t('Department.input366') }]}
                        style={{ width: 200, marginLeft: 10, marginBottom: 0 }}
                      >
                        <TextArea disabled={isDisabled} style={{ borderRadius: 6 }} />
                      </Form.Item>
                    )
                  }
                </Form.Item>
              </>
            )}
          </Radio.Group>
        </Form.Item>
      );
    }

    if (luachon.option3) {
      return (
        <Form.Item
          name={`question_${index}`}
          rules={[{ required: question.cauhoibatbuoc, message: t('Department.input366') }]}
          style={{ marginBottom: 0 }}
        >
          <Checkbox.Group
            style={{ display: 'flex', flexDirection: 'column', gap: 5 }}
            onChange={(values) => {
              if (values.includes('other')) {
                form.setFieldsValue({ [`question_${index}_other`]: '' });
              }
            }}
            disabled={isDisabled}
          >
            {options.map((option, optionIndex) => (
              <div key={optionIndex} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Checkbox value={option.tuychonnhieu}>
                  {option.tuychonnhieu}
                </Checkbox>
                {doc?.versions === "v1.0.1" && responseOptions && responseOptions[optionIndex]?.userSelected && (
                  <Text style={{ color: responseOptions[optionIndex].isCorrect ? 'green' : 'red' }}>
                    {responseOptions[optionIndex].isCorrect ? 'Đúng' : 'Sai'}
                  </Text>
                )}
              </div>
            ))}
            {question.tuychonkhac && (
              <>
                <Checkbox value="other">
                  {t('Department.input368')}
                </Checkbox>
                <Form.Item
                  style={{ marginBottom: 0 }}
                  shouldUpdate
                  className='abc'
                >
                  {() => {
                    const fieldValue = form.getFieldValue(`question_${index}`);
                    return fieldValue?.includes('other') ? (
                      <Form.Item
                        name={`question_${index}_other`}
                        rules={[{ required: true, message: t('Department.input366') }]}
                        style={{ width: 200, marginLeft: 10, marginBottom: 0 }}
                      >
                        <TextArea disabled={isDisabled} style={{ borderRadius: 6 }} />
                      </Form.Item>
                    ) : null;
                  }}
                </Form.Item>
              </>
            )}
          </Checkbox.Group>
        </Form.Item>
      );
    }

    if (luachon.option4) {
      const { ngoisao, traitim, daukiem, so } = luachonbieutuong;
      return (
        <Form.Item
          name={`question_${index}`}
          rules={[{ required: question.cauhoibatbuoc, message: t('Department.input366') }]}
          style={{ marginBottom: 0 }}
        >
          <Rate
            count={plusnumber}
            style={{ lineHeight: 2.5 }}
            character={({ index: buttonIndex }) => {
              const isActive = (activeButtons[index] || 0) >= buttonIndex + 1;
              const style = {
                backgroundColor: isActive ? '#ae8f3d' : 'white',
                color: isActive ? 'white' : 'black'
              };
              if (ngoisao) return <Button size='large' shape='circle' icon={<StarOutlined />} style={style} disabled={isDisabled} />;
              if (traitim) return <Button size='large' shape='circle' icon={<HeartOutlined />} style={style} disabled={isDisabled} />;
              if (daukiem) return <Button size='large' shape='circle' icon={<CheckOutlined />} style={style} disabled={isDisabled} />;
              if (so) return <Button size='large' shape='circle' style={style} disabled={isDisabled}>{buttonIndex + 1}</Button>;
              return <Button size='large' shape='circle' icon={<StarOutlined />} style={style} disabled={isDisabled} />;
            }}
            onChange={(value) => {
              if (!isDisabled) {
                setActiveButtons(prev => ({ ...prev, [index]: value }));
                form.setFieldsValue({ [`question_${index}`]: value });
              }
            }}
            disabled={isDisabled}
          />
        </Form.Item>
      );
    }

    return null;
  }, [doc, form, t, activeButtons, responseData]);

  const handleSubmit = useCallback(async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      const newId = v4();

      const sanitizeHTML = (html) => {
        if (typeof html !== 'string') return '';
        const strippedHtml = html.replace(/<[^>]*>/g, '');
        return strippedHtml
          .replace(/ /g, ' ')
          .replace(/&/g, '&')
          .replace(/</g, '<')
          .replace(/>/g, '>')
          .replace(/"/g, '"')
          .replace(/'/g, "'");
      };

      const processAnswer = (question, index) => {
        let answer = values[`question_${index}`];
        if (question.luachon.option2 && answer === 'other') {
          answer = values[`question_${index}_other`];
        } else if (question.luachon.option3 && Array.isArray(answer)) {
          const otherIndex = answer.indexOf('other');
          if (otherIndex !== -1) {
            answer[otherIndex] = values[`question_${index}_other`];
          }
        }
        return answer;
      };

      const docTitle = doc?.title || '';
      const docContentTitle = doc?.contentTitle || '';

      let chi_nhanh = user && user.chinhanh ? user.chinhanh : 'Khách vãng lai';
      if (selectedBranch) {
        chi_nhanh = selectedBranch;
      }

      const currentDate = moment().format('DD-MM-YYYY HH:mm:ss');

      const submitData = {
        id: finalId,
        title: docTitle,
        contentTitle: docContentTitle,
        questions: doc?.questions.map((q, index) => {
          const answer = processAnswer(q, index);
          let updatedQuestion = {
            id: v4(),
            Cauhoi: q[`Cauhoi${index + 1}`],
            answer,
            hinhanh: hinhanh[index] || [],
            laplai: repeatCounts[index] || 1,
            luachon: q.luachon,
            luachonbieutuong: q.luachonbieutuong,
            plusnumber: q.plusnumber,
            options: q.options,
            cauhoibatbuoc: q.cauhoibatbuoc,
            yeu_cau: q.yeu_cau,
            point: q.point,
            cautraloi: q.cautraloi,
            subtitle: q.subtitle,
            questionId: q.questionId
          };

          if (doc?.versions === 'v1.0.1' && (q.luachon?.option2 || q.luachon?.option3 || q.luachon?.option1 || q.luachon?.option5 || q.luachon?.option6)) {
            const correctAnswer = q.cautraloi || '';
            let isCorrect = false;

            if (q.luachon.option2) {
              updatedQuestion.options = q.options.map(option => {
                const optionIsCorrect = option.tuychon === answer ? option.tuychon === correctAnswer : false;
                isCorrect = optionIsCorrect;
                return {
                  ...option,
                  userSelected: option.tuychon === answer,
                  isCorrect: optionIsCorrect,
                };
              });
            } else if (q.luachon.option3) {
              updatedQuestion.options = q.options.map(option => {
                const optionIsCorrect =
                  Array.isArray(answer) && answer.includes(option.tuychonnhieu)
                    ? correctAnswer?.includes(option.tuychonnhieu)
                    : false;
                isCorrect = isCorrect || optionIsCorrect;
                return {
                  ...option,
                  userSelected: Array.isArray(answer) && answer.includes(option.tuychonnhieu),
                  isCorrect: optionIsCorrect,
                };
              });
            } else if (q.luachon.option1 || q.luachon.option5 || q.luachon.option6) {
              const normalizedAnswer = normalizeString(answer);
              const normalizedCorrectAnswer = normalizeString(correctAnswer);
              isCorrect =
                typeof correctAnswer === 'string' && correctAnswer !== ''
                  ? normalizedAnswer === normalizedCorrectAnswer
                  : false;

              updatedQuestion.options = updatedQuestion.options || [
                {
                  tuychon: answer || '',
                  userSelected: !!answer,
                  isCorrect,
                },
              ];
            }

            updatedQuestion.isCorrect = isCorrect;
          }

          return updatedQuestion;
        }) || [],
        ngay_phan_hoi: currentDate,
        chi_nhanh,
        nguoiphanhoi: user && user.name ? user.name : 'Khách vãng lai',
        nguoitaophieu: doc?.nguoitaophieu,
        phongban: user && user.bophan ? user.bophan : 'Khách vãng lai',
        keysJSON: user && user.keys ? user.keys : 'Khách vãng lai',
        quyenxem: 'Private',
        demcauhoi: doc?.demcauhoi,
        yeucauxuly: doc?.yeucauxuly,
        solanlaplai: doc?.solanlaplai,
        khach: doc?.khach,
        versions: 'v1.0.1',
        responseId: newId,
        departmentsview: doc?.departmentsview,
        restaurantsview: doc?.restaurantsview,
        usersview: doc?.usersview,
        ConfigPoints: doc?.pointConfig,
        pointConfigNangCao: doc?.pointConfigNangCao,
        Cauhinhdiem: doc?.Cauhinhdiem,
        rankings: doc?.rankings,
        DapAn: [],
      };

      const contentAddData = {
        ten_phieu: docTitle,
        noi_dung_phieu: sanitizeHTML(docContentTitle),
        chi_nhanh,
        nguoi_tra_loi: user && user.name ? user.name : 'Khách vãng lai',
        ngay_phan_hoi: currentDate,
        nguoidang: doc?.nguoitaophieu,
        bo_phan: user && user.bophan ? user.bophan : 'Khách vãng lai',
        ngay_tao_phieu: currentDate,
        chuc_vu: user && user.chucvu ? user.chucvu : 'Khách vãng lai',
        cua_hang: user && user.chinhanh ? user.chinhanh : 'Khách vãng lai',
        keys: newId,
        pairs: doc?.questions.map((q, index) => {
          const processedAnswer = processAnswer(q, index);
          let cau_tra_loi;

          if (Array.isArray(processedAnswer)) {
            cau_tra_loi = processedAnswer.join(', ');
          } else if (typeof processedAnswer === 'string') {
            cau_tra_loi = processedAnswer;
          } else {
            cau_tra_loi = null;
          }

          const dap_an_chinh_xac = typeof q.cautraloi === 'string' && q.cautraloi !== '' ? q.cautraloi : null;

          return {
            noidungphu: q.subtitle ? sanitizeHTML(q.subtitle.noidungphieuthem) : null,
            tieudephu: q.subtitle ? sanitizeHTML(q.subtitle.tieudephieuthem) : null,
            cau_hoi: sanitizeHTML(q[`Cauhoi${index + 1}`]),
            cau_tra_loi,
            Point: q.point,
            yeu_cau: sanitizeHTML(q.yeu_cau),
            Continue_Again: repeatCounts[index] || 1,
            dap_an_chinh_xac,
            TrangThai: q.TrangThai || null,
          };
        }) || [],
      };
      const shouldAddContent = doc?.sqlsend === true || typeof doc?.sqlsend === 'undefined';

      let responseTraLoi, responseContent;
      if (shouldAddContent) {
        [responseTraLoi, responseContent] = await Promise.all([
          submitResponse(submitData),
          addContent(contentAddData),
        ]);
      } else {
        responseTraLoi = await submitResponse(submitData);
      }

      const serverResponseId = responseTraLoi.responseId;

      try {
        const response = await fetchResponseById(serverResponseId);
        setResponseData(response.data);
      } catch (err) {
        console.error('Error fetching response:', err);
        message.error('Không thể tải dữ liệu phản hồi để hiển thị kết quả.');
      }

      console.log('Form submitted successfully:', responseTraLoi, responseContent);
      setIsFormDirty(false);
      setSubmissionSuccess(true);
      setSubmittedId(serverResponseId);
      setIsModalVisible(false);
    } catch (errorInfo) {
      const errorFields = errorInfo.errorFields || [];
      if (errorFields.length > 0) {
        message.warning(t('Department.input365'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [doc, form, hinhanh, repeatCounts, selectedBranch, t, user, submitResponse, addContent, finalId, fetchResponseById]);

  const showConfirmModal = useCallback(async () => {
    if (!doc || loading) {
      message.warning('Đang tải biểu mẫu, vui lòng chờ.');
      return;
    }
    try {
      // Check if branch selection is required and not selected
      if (doc.khach && !selectedBranch) {
        message.warning('Bạn chưa chọn nhà hàng.');
        scrollToBranch();
        return;
      }

      // Validate form fields
      await form.validateFields();
      setIsModalVisible(true);
    } catch (errorInfo) {
      const errorFields = errorInfo.errorFields || [];
      if (errorFields.length > 0) {
        message.warning(t('Department.input365'));
        const firstErrorField = errorFields[0].name[0];
        const questionIndex = parseInt(firstErrorField.split('_')[1]);
        scrollToQuestion(questionIndex);
      }
    }
  }, [doc, form, scrollToQuestion, selectedBranch, loading, t, scrollToBranch]);

  const handleModalOk = useCallback(() => {
    if (!isNetworkStable) {
      message.warning(t('Department.input382'));
      return;
    }

    setIsNetworkStable(false);
    setIsSubmitting(true);
    handleSubmit();
    setTimeout(() => {
      setIsNetworkStable(true);
    }, 5000);
  }, [handleSubmit, isNetworkStable, t]);

  const handleModalCancel = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const onReset = useCallback(() => {
    form.resetFields();
    setActiveButtons({});
    setRepeatCounts({});
    setHinhanh([]);
    setResponseData(null);
    setIsFormDirty(false);
  }, [form]);

  const handleContinueAgainClick = useCallback((index) => {
    setCurrentQuestionIndex(index);
    setContinueAgainModalVisible(true);
  }, []);

  const handleContinueAgainInputChange = useCallback((e) => {
    setContinueAgainValue(e.target.value);
  }, []);

  const handleContinueAgainOk = useCallback(() => {
    const value = parseInt(continueAgainValue, 10);
    if (value > 0) {
      setRepeatCounts(prev => ({ ...prev, [currentQuestionIndex]: value }));
    }
    setContinueAgainModalVisible(false);
    setContinueAgainValue('');
  }, [continueAgainValue, currentQuestionIndex]);

  const handleImageUpload = useCallback(async (info, index) => {
    const { fileList } = info;

    if (fileList.length > 3) {
      message.warning(t('Department.input136'));
      return;
    }

    setUploadStatus(prev => ({
      ...prev,
      [index]: { uploading: true, progress: 0 },
    }));

    const uploadPromises = fileList.map(file => {
      if (!file.url && !file.preview) {
        if (
          !allowedImageTypes.includes(file.type) &&
          !allowedVideoTypes.includes(file.type)
        ) {
          message.error(t('Department.input137'));
          return Promise.resolve(null);
        }

        const storageRef = ref(imageDb, `CHECKLISTNISO/${v4()}`);
        const uploadTask = uploadBytesResumable(storageRef, file.originFileObj);

        return new Promise((resolve, reject) => {
          uploadQueue.current.add(() => new Promise((innerResolve, innerReject) => {
            uploadTask.on(
              'state_changed',
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadStatus(prev => ({
                  ...prev,
                  [index]: { uploading: true, progress },
                }));
              },
              (error) => {
                console.error('Upload error:', error);
                innerReject(error);
                reject(error);
              },
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                innerResolve();
                resolve({
                  uid: file.uid,
                  name: file.name,
                  status: 'done',
                  url: downloadURL,
                });
              }
            );
          }));
        });
      }
      return Promise.resolve(file);
    });

    try {
      const uploadedFiles = await Promise.all(uploadPromises);
      const validFiles = uploadedFiles.filter(file => file !== null);

      setHinhanh(prevHinhanh => {
        const updatedHinhanh = [...prevHinhanh];
        updatedHinhanh[index] = validFiles;
        return updatedHinhanh;
      });

      setUploadStatus(prev => ({
        ...prev,
        [index]: { uploading: false, progress: 0 },
      }));
    } catch (error) {
      console.error('Error uploading files:', error);
      message.error('Error Server!');
      setUploadStatus(prev => ({
        ...prev,
        [index]: { uploading: false, progress: 0 },
      }));
    }
  }, [allowedImageTypes, allowedVideoTypes, t]);

  const handleBranchChange = useCallback((value) => {
    setSelectedBranch(value);
  }, []);

  if (loading) return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '50px 0', textAlign: 'center' }}>
      <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
    </div>
  );

  if (error) return <NotFoundPage />;

  const hasAccess =
    (doc?.everyquyen === "Công khai" || user?.phanquyen === true) ||
    (user?.keys && doc?.keysJSON && user.keys === doc.keysJSON) ||
    (
      (!doc?.everyquyen ||
        (doc.everyquyen === "Nội bộ" &&
          ((user?.chinhanh && doc?.cuahang?.includes(user.chinhanh)) ||
            (user?.bophan && doc?.bophanADS?.includes(user.bophan)) ||
            (user?.keys && doc?.account?.includes(user.keys)))
        ) ||
        (doc.everyquyen === "Riêng tư" &&
          user?.keys && doc.keysJSON === user.keys)
      )
    );

  if (!hasAccess) {
    return <NotFoundPage />;
  }

  if (submissionSuccess) {
    return (
      <div
        style={{ maxWidth: '800px', margin: '0 auto', marginTop: 20 }}
        className={user && user.keys && !isInDrawer ? 'layout_main_niso' : 'abc'}
      >
        <title>NISO CHECKLIST | {t('Department.input369')}</title>
        <Container
          content={
            <Result
              status="success"
              title={t('Phanquyen.input13')}
              extra={user ? [
                <Button
                  type="primary"
                  key="view"
                  onClick={() => {
                    navigate(`/auth/docs/form/views/${submittedId}`);
                  }}
                >
                  {t('Department.input370')}
                </Button>,
                <Button
                  key="close"
                  onClick={() => {
                    setSubmissionSuccess(false);
                    setSubmittedId(null);
                    setResponseData(null);
                    onReset();
                  }}
                >
                  {t('ViewDocs.input5')}
                </Button>,
              ] : [
                <Button
                  type="primary"
                  key="ok"
                  onClick={() => {
                    navigate("/login");
                  }}
                >
                  Xác nhận
                </Button>,
              ]}
            />
          }
        />
      </div>
    );
  }

  const isFormDisabled = doc?.locktitle || doc?.nhap;

  return (
    <div
      style={{ padding: isInDrawer ? 0 : 8 }}
      className={user && user.keys && !isInDrawer ? '' : 'abc'}
    >
      <title>NISO CHECKLIST | {doc?.title}</title>
      <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
        {doc?.locktitle === true && (
          <div style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'red', color: 'white', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', borderBottomLeftRadius: 8 }}><LockFilled /> Tạm khóa</div>
        )}
        <Container
          css="niso-box-titles"
          content={
            <React.Fragment>
              <Title level={2}>{doc?.title}</Title>
              <div dangerouslySetInnerHTML={{ __html: doc?.contentTitle }} />
              <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
                <Tag color='red' style={{ marginTop: 15 }} bordered={false}>* {t('Department.input132')}</Tag>
                {(hasEditPermission || (user && user.phanquyen === true)) && <Button icon={<EditOutlined />} size='middle' onClick={() => navigate(`/auth/docs/form/edit/${doc.id}`)}>Chỉnh sửa</Button>}
              </Space>
            </React.Fragment>
          }
        />
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleFormChange}
        >
          {doc?.khach && (
            <Container
              content={
                <div ref={branchRef}>
                  <Form.Item
                    name="branch"
                    label="Chọn nhà hàng"
                    rules={[{ required: true, message: t('Department.input371') }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      placeholder="Chọn nhà hàng"
                      onChange={handleBranchChange}
                      showSearch
                      disabled={isFormDisabled}
                    >
                      {transferredBranches.map((chinhanh) => (
                        <Select.Option key={chinhanh} value={chinhanh}>
                          {chinhanh}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>
              }
            />
          )}

          <div className="questions">
            {doc?.questions && doc.questions.length > 0 ? (
              doc.questions.map((question, index) => (
                <div
                  key={index}
                  ref={el => {
                    questionRefs.current[index] = el;
                    observerRefs.current[index] = el;
                  }}
                  data-index={index}
                >
                  {visibleQuestions.has(index) ? (
                    <>
                      {question.subtitle && (question.subtitle.tieudephieuthem || question.subtitle.noidungphieuthem) && (
                        <Container
                          css="border-left-niso"
                          content={
                            <>
                              {question.subtitle.tieudephieuthem && (
                                <Title level={5}>{question.subtitle.tieudephieuthem}</Title>
                              )}
                              {question.subtitle.noidungphieuthem && (
                                <div dangerouslySetInnerHTML={{ __html: question.subtitle.noidungphieuthem }} />
                              )}
                            </>
                          }
                        />
                      )}
                      <Container
                        content={
                          <>
                            {doc.demcauhoi === true && (
                              <span>{question.cauhoibatbuoc && <span style={{ color: 'red' }}>* </span>}Câu hỏi {index + 1}.</span>
                            )}
                            <Space direction='horizontal' style={{ justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                              <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
                                {question.cauhoibatbuoc && !doc.demcauhoi && <span style={{ color: 'red' }}>* </span>}
                                <Space direction='vertical' style={{ alignItems: 'flex-start', gap: 2 }}>
                                  <div
                                    dangerouslySetInnerHTML={{ __html: question[`Cauhoi${index + 1}`] || 'Câu hỏi không có nội dung' }}
                                    style={{ lineHeight: 1.6 }}
                                  />
                                  {question.yeu_cau && <div dangerouslySetInnerHTML={{ __html: question.yeu_cau || '' }} style={{ lineHeight: 1.6 }} />}
                                </Space>
                              </div>
                              {Boolean(question.point) && question.point !== "0" && (
                                <Text style={{ fontSize: 11, opacity: 0.6, whiteSpace: 'nowrap' }}>
                                  {question.point} {t('Input.input9')}
                                </Text>
                              )}
                            </Space>
                            <Space direction="vertical" style={{ width: '100%', marginTop: '10px' }}>
                              {renderAnswer(question, index)}
                              {doc.solanlaplai && (
                                <Button
                                  type='link'
                                  onClick={() => handleContinueAgainClick(index)}
                                  style={{ padding: 0 }}
                                  disabled={isFormDisabled}
                                >
                                  {t('ViewDocs.input15')}: {repeatCounts[index] || 1}
                                </Button>
                              )}
                              {doc.threeimg && doc.solanlaplai && (
                                <>
                                  <Upload
                                    className="custom-upload"
                                    listType="picture-card"
                                    fileList={hinhanh[index] || []}
                                    onChange={(info) => handleImageUpload(info, index)}
                                    beforeUpload={() => false}
                                    multiple={true}
                                    disabled={isFormDisabled}
                                  >
                                    {(hinhanh[index]?.length || 0) < 3 ? (
                                      uploadStatus[index]?.uploading ? (
                                        <Spin spinning={true} tip="Đang tải..." size='small' />
                                      ) : (
                                        '+ Upload'
                                      )
                                    ) : null}
                                  </Upload>
                                  <i style={{ fontSize: 11, marginTop: 15 }}>{t('Department.input372')}</i>
                                </>
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
              ))
            ) : (
              <Text>Không có câu hỏi nào để hiển thị.</Text>
            )}
          </div>
        </Form>
        {!isFormDisabled && (
          <Container content={
            <Space direction='horizontal' style={{ justifyContent: 'space-between', width: '100%', marginBottom: 0 }}>
              <Button type="primary" onClick={showConfirmModal} size='large' disabled={loading}>
                {t('Phanquyen.input29')}
              </Button>
              <Button htmlType="button" type='link' onClick={() => {
                onReset();
                message.info(t('Department.input381'));
              }} style={{ marginBottom: 0 }}>
                {t('Phanquyen.input30')}
              </Button>
            </Space>
          } />
        )}
      </div>

      {!user && (
        <Footer style={{ textAlign: "center", paddingTop: 15, cursor: 'pointer' }}>
          <img src={Logo} alt="Logo NISO" width={32} onClick={() => navigate("/")} />
          <Footers />
        </Footer>
      )}

      <Modal
        title={t('ViewDocs.input10')}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        footer={[
          <Button key="back" onClick={handleModalCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isSubmitting}
            onClick={handleModalOk}
          >
            OK
          </Button>,
        ]}
      >
        <p>{t('Phanquyen.input31')}</p>
      </Modal>

      <Modal
        title={t('ViewDocs.input15')}
        visible={continueAgainModalVisible}
        closable={!Object.values(uploadStatus).some(status => status?.uploading)}
        keyboard={!Object.values(uploadStatus).some(status => status?.uploading)}
        onOk={handleContinueAgainOk}
        onCancel={() => {
          if (!Object.values(uploadStatus).some(status => status?.uploading)) {
            setContinueAgainModalVisible(false);
            setContinueAgainValue('');
          } else {
            message.warning(t('Department.input373') || 'Vui lòng chờ đến khi quá trình tải lên hoàn tất.');
          }
        }}
        okButtonProps={{ disabled: Object.values(uploadStatus).some(status => status?.uploading) }}
        cancelButtonProps={{ disabled: Object.values(uploadStatus).some(status => status?.uploading) }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              if (!Object.values(uploadStatus).some(status => status?.uploading)) {
                setContinueAgainModalVisible(false);
                setContinueAgainValue('');
              } else {
                message.warning(t('Department.input373') || 'Vui lòng chờ đến khi quá trình tải lên hoàn tất.');
              }
            }}
            disabled={Object.values(uploadStatus).some(status => status?.uploading)}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              if (!Object.values(uploadStatus).some(status => status?.uploading)) {
                handleContinueAgainOk();
              } else {
                message.warning(t('Department.input373') || 'Vui lòng chờ đến khi quá trình tải lên hoàn tất.');
              }
            }}
            disabled={Object.values(uploadStatus).some(status => status?.uploading)}
          >
            OK
          </Button>,
        ]}
      >
        <Input
          type="number"
          style={{ marginBottom: 15 }}
          value={continueAgainValue}
          onChange={handleContinueAgainInputChange}
          placeholder={t('Phanquyen.input22')}
        />
      </Modal>
      <BacktoTop />
    </div>
  );
};

export default React.memo(Docs);