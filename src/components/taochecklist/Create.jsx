import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import moment from 'moment';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { imageDb } from '../../config';
import { v4 } from 'uuid';
import useApi from '../../hook/useApi';
import useSearchShop from '../../hook/SearchShop/useSearchShop';
import {
  Form,
  Input,
  Button,
  Space,
  Select,
  Switch,
  Modal,
  notification,
  Progress,
  Tabs,
  Divider,
  Typography,
  Drawer,
} from 'antd';
import {
  PlusOutlined,
  UpOutlined,
  DownOutlined,
  CloseOutlined,
  SendOutlined,
  PlusCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import Title from './Option/Title';
import Option1 from './Option/Option1';
import Option23 from './Option/Option23';
import Option5 from './Option/Option5';
import Option6 from './Option/Option6';
import Option4 from './Option/Option4';
import Option0 from './Option/Option0';
import SettingCreate from './Option/SettingCreate';
import Container from '../../config/PhieuChecklist/Container';
import Nen from '../../assets/shop.png';
import NotFoundPage from '../NotFoundPage';

const { Option } = Select;
const { TextArea } = Input;
const { Title: AntTitle, Text } = Typography;

const Create = ({ user, t, hasCreatePermission }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { saveChecklistDoc, search, miscApi, departmentApi } = useApi();
  const { searchShops } = useSearchShop(search);

  const activeKey = location.pathname.split('/').pop();

  const handleTabChange = (key) => {
    if (key === 'settings') {
      setIsSettingsModalVisible(true);
    } else {
      navigate(key);
    }
  };

  const [form] = Form.useForm();
  const [img, setImg] = useState(null);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showOtherOption, setShowOtherOption] = useState({});
  const [everyquyen, setEveryquyen] = useState('Nội bộ');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isEnteringPoints, setIsEnteringPoints] = useState(false);
  const [questions, setQuestions] = useState([{}]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [khachEnabled, setKhachEnabled] = useState(false);
  const [demEnabled, setDemEnabled] = useState(false);
  const [SQLEnabled, setSQLEnabled] = useState(true);
  const [llEnabled, setllEnabled] = useState(false);
  const [threeimg, setthreeimg] = useState(false);
  const [XulyEnabled, setXulyEnabled] = useState(false);
  const [cuahang, setCuahang] = useState([]);
  const [usersview, setUsersview] = useState([]);
  const [departmentsview, setDepartmentsview] = useState([]);
  const [restaurantsview, setRestaurantsview] = useState([]);
  const [Dapanview, setViewDapanEnabled] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);
  const [initialDeptLoaded, setInitialDeptLoaded] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [showRequirement, setShowRequirement] = useState({});

  useEffect(() => {
    if (!initialDeptLoaded) {
      setInitialDeptLoaded(true);
    }
  }, [initialDeptLoaded]);

  const checkExistingTitle = useCallback(
    async (_, value) => {
      if (!value) return Promise.reject(new Error(t('Create.input28')));

      try {
        const response = await miscApi.checkTitleExists(value, user.keys);
        const { exists } = response.data;

        if (exists) {
          notification.warning({
            message: t('Department.input165'),
            description: t('Department.input200'),
            placement: 'topRight',
            showProgress: true,
            pauseOnHover: true,
          });
          return Promise.reject(new Error(t('Department.input201')));
        }
        return Promise.resolve();
      } catch (error) {
        console.error('Error checking title:', error);
        return Promise.resolve();
      }
    },
    [miscApi, user.keys, t]
  );

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const allowedTypes = [
      'image/png',
      'image/gif',
      'image/svg+xml',
      'image/jpeg',
      'image/jpg',
      'image/heic',
      'image/heif',
    ];
    if (!allowedTypes.includes(file.type) || file.size > 800 * 200) {
      notification.warning({
        message: t('Department.input165'),
        description: t('Department.input124'),
        placement: 'topRight',
        showProgress: true,
        pauseOnHover: true,
      });
      return false;
    }
    setImg(file);
    setPreviewUrl(URL.createObjectURL(file));
    return false;
  };

  const handleUserSearch = (value) => {
    if (value) {
      search(value)
        .then((response) => {
          const users = response.data || [];
          setAccountOptions(users);
        })
        .catch((error) => {
          console.error('Error searching users:', error);
          setAccountOptions([]);
        });
    } else {
      setAccountOptions([]);
    }
  };

  const handleDeptSearch = async (value) => {
    if (value && value.trim() !== '') {
      try {
        const response = await departmentApi.searchDepartment(value);
        const filteredData = (response.data || []).map(dept => ({
          value: dept.bophan.toLowerCase(),
          label: dept.bophan.toUpperCase(),
        }));
        return filteredData;
      } catch (error) {
        console.error('Error searching departments:', error);
        return [];
      }
    }
    return [];
  };

  const handleShopSearch = (value) => {
    if (value) {
      searchShops(value, (results) => { });
    } else {
      searchShops('', (results) => { });
    }
  };

  const saveFormData = async (imageURL, isDraft) => {
    try {
      const values = await form.validateFields();
      const questionsArray = Array.isArray(values.questions) ? values.questions : [];
      const filteredQuestions = questionsArray.filter((question) => question?.question?.trim());

      if (filteredQuestions.length === 0) {
        notification.warning({
          message: t('Department.input158'),
          description: t('Department.input202'),
          placement: 'topRight',
          showProgress: true,
          pauseOnHover: true,
        });
        return;
      }

      const formattedQuestions = filteredQuestions.map(formatQuestion);
      const currentDate = moment().format('DD-MM-YYYY HH:mm:ss');

      const response = await saveChecklistDoc({
        date: currentDate,
        questions: formattedQuestions,
        background: imageURL,
        everyquyen: everyquyen,
        khach: khachEnabled,
        demcauhoi: demEnabled,
        sqlsend: SQLEnabled,
        phongban: user.bophan,
        keysJSON: user.keys,
        title: values.title,
        nhap: isDraft,
        contentTitle: values.contentTitle,
        userKeys: user.keys,
        bophanADS: values.bophanADS || [],
        account: values.account || [],
        cuahang: values.cuahang || cuahang,
        yeucauxuly: XulyEnabled,
        solanlaplai: llEnabled,
        threeimg: threeimg,
        usersview: values.usersview || usersview,
        departmentsview: values.departmentsview || departmentsview,
        restaurantsview: values.restaurantsview || restaurantsview,
        Dapanview: Dapanview,
        visionCreate: "v1.0.1"
      });

      if (response) {
        if (isDraft) {
          notification.success({
            message: t('Department.input158'),
            description: t('Department.input203'),
            placement: 'topRight',
            showProgress: true,
            pauseOnHover: true,
          });
        } else {
          notification.success({
            message: t('Department.input158'),
            description: t('Department.input204'),
            placement: 'topRight',
            showProgress: true,
            pauseOnHover: true,
          });
        }
        form.resetFields();
        setPreviewUrl('');
        setEveryquyen('Nội bộ');
        setQuestions([{}]);
        setTotalPoints(0);
        setCuahang([]);
        setUsersview([]);
        setDepartmentsview([]);
        setRestaurantsview([]);
        setViewDapanEnabled([]);
      } else {
        notification.error({
          message: 'Error',
          description: 'Error Server',
          placement: 'topRight',
          showProgress: true,
          pauseOnHover: true,
        });
      }
    } catch (error) {
      console.error('Error submitting form data:', error);
      notification.warning({
        message: t('Department.input165'),
        description: t('Report.input16'),
        placement: 'topRight',
        showProgress: true,
        pauseOnHover: true,
      });
    }
  };

  const formatQuestion = (question, index) => {
    const options = (question.options || []).map((option, optIndex) => {
      const isCorrect =
        question.luachon === 'option3'
          ? (question.cautraloi || []).includes(option.tuychonnhieu || `option-${optIndex}`)
          : question.cautraloi === (option.tuychon || option.tuychonnhieu || `option-${optIndex}`);

      return {
        tuychon: option.tuychon || '',
        tuychonnhieu: option.tuychonnhieu || '',
        isCorrect: isCorrect || false,
      };
    });

    return {
      subtitle: question.subtitle
        ? {
          tieudephieuthem: question.subtitle.tieudephieuthem,
          noidungphieuthem: question.subtitle.noidungphieuthem,
        }
        : undefined,
      [`Cauhoi${index + 1}`]: question.question,
      options,
      luachon: Object.fromEntries(
        ['option0', 'option1', 'option2', 'option3', 'option4', 'option5', 'option6'].map(
          (opt) => [opt, question.luachon === opt]
        )
      ),
      luachonbieutuong: Object.fromEntries(
        ['ngoisao', 'traitim', 'daukiem', 'so'].map((sym) => [
          sym,
          question.luachonbieutuong === sym,
        ])
      ),
      plusnumber: question.plusnumber,
      yeu_cau: question.yeu_cau || '',
      tuychonkhac: !!question.tuychonkhac,
      cauhoibatbuoc: !!question.cauhoibatbuoc,
      batxuly: !!question.batxuly,
      noidung: question.noidung,
      point: question.point,
      cautraloi: formatCautraloi(question),
      vanban: question.vanban,
      hinhanh: question.hinhanh,
      locktitle: false,
      taptin: question.taptin,
    };
  };

  const formatCautraloi = (question) => {
    if (question.luachon === 'option3') {
      let cautraloi = Array.isArray(question.cautraloi) ? question.cautraloi : [];
      if (question.tuychonkhac && question.cautraloimoikhac) {
        cautraloi = [...cautraloi, question.cautraloimoikhac].filter(Boolean);
      }
      return cautraloi;
    } else if (question.luachon === 'option2') {
      if (question.tuychonkhac && question.cautraloimoikhac) {
        return question.cautraloimoikhac;
      }
      return question.cautraloi || '';
    } else {
      let cautraloi = question.cautraloi || '';
      if (question.tuychonkhac && question.cautraloimoikhac) {
        cautraloi = question.cautraloimoikhac;
      }
      return cautraloi;
    }
  };

  const handleSubmit = async (isDraft = false) => {
    if (isDraft) {
      setIsDraftLoading(true);
    } else {
      setIsSubmitLoading(true);
    }
    try {
      const values = await form.validateFields();
      const response = await miscApi.checkTitleExists(values.title, user.keys);

      if (response && response.exists === true) {
        notification.warning({
          message: t('Department.input165'),
          description: t('Department.input200'),
          placement: 'topRight',
          showProgress: true,
          pauseOnHover: true,
        });
        return false;
      }

      const imageURL = img ? await uploadImage() : '';
      await saveFormData(imageURL, isDraft);
      return true;
    } catch (error) {
      console.error('Lỗi khi gửi biểu mẫu:', error);
      if (error.errorFields) {
        notification.warning({
          message: t('Department.input165'),
          description: t('Report.input16'),
          placement: 'topRight',
          showProgress: true,
          pauseOnHover: true,
        });
      } else {
        notification.error({
          message: 'Lỗi',
          description: 'Lỗi máy chủ!',
          placement: 'topRight',
          showProgress: true,
          pauseOnHover: true,
        });
      }
      return false;
    } finally {
      if (isDraft) {
        setIsDraftLoading(false);
      } else {
        setIsSubmitLoading(false);
      }
    }
  };

  const uploadImage = () => {
    return new Promise((resolve, reject) => {
      setIsUploading(true);
      const storageRef = ref(imageDb, `CHECKLISTNISO/${v4()}`);
      const uploadTask = uploadBytesResumable(storageRef, img);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          setIsUploading(false);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setIsUploading(false);
            resolve(downloadURL);
          } catch (error) {
            setIsUploading(false);
            reject(error);
          }
        }
      );
    });
  };

  const handleEveryquyenChange = (value) => {
    setEveryquyen(value);
  };

  const showModal = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
      setIsModalVisible(true);
    }
  };

  const handleModalOk = () => {
    const luachon = form.getFieldValue(['questions', currentQuestionIndex, 'luachon']);
    const cautraloi = form.getFieldValue(['questions', currentQuestionIndex, 'cautraloi']);
    const cautraloimoikhac = form.getFieldValue(['questions', currentQuestionIndex, 'cautraloimoikhac']);
    const hasCautraloi = cautraloi && (
      Array.isArray(cautraloi) ? cautraloi.length > 0 :
        typeof cautraloi === 'string' ? !!cautraloi.trim() : false
    );
    const hasCautraloimoikhac = !!cautraloimoikhac?.trim();

    if (luachon === 'option2' && hasCautraloi && hasCautraloimoikhac) {
      notification.error({
        message: t('Department.input165'),
        description: 'Vui lòng chỉ chọn đáp án từ danh sách hoặc nhập đáp án khác, không chọn cả hai!',
        placement: 'topRight',
        showProgress: true,
        pauseOnHover: true,
      });
      return;
    }

    if ((luachon === 'option1' || luachon === 'option2') && !hasCautraloi && !hasCautraloimoikhac) {
      notification.error({
        message: t('Department.input165'),
        description: 'Vui lòng chọn hoặc nhập ít nhất một đáp án!',
        placement: 'topRight',
        showProgress: true,
        pauseOnHover: true,
      });
      return;
    }

    if (luachon === 'option3' && !hasCautraloi && !hasCautraloimoikhac) {
      notification.error({
        message: t('Department.input165'),
        description: 'Vui lòng chọn hoặc nhập ít nhất một đáp án!',
        placement: 'topRight',
        showProgress: true,
        pauseOnHover: true,
      });
      return;
    }

    const currentPoints = form.getFieldValue(['questions', currentQuestionIndex, 'point']) || 0;
    const newQuestions = [...questions];
    if (newQuestions[currentQuestionIndex]) {
      newQuestions[currentQuestionIndex] = {
        ...newQuestions[currentQuestionIndex],
        point: currentPoints,
        cautraloi: cautraloi || '',
        cautraloimoikhac: cautraloimoikhac || '',
      };
      setQuestions(newQuestions);
      const currentFormQuestions = form.getFieldValue('questions') || [];
      currentFormQuestions[currentQuestionIndex] = {
        ...currentFormQuestions[currentQuestionIndex],
        point: currentPoints,
        cautraloi: cautraloi || '',
        cautraloimoikhac: cautraloimoikhac || '',
      };
      form.setFieldsValue({
        questions: currentFormQuestions,
      });

      const newTotalPoints = newQuestions.reduce((sum, q) => sum + (Number(q.point) || 0), 0);
      setTotalPoints(newTotalPoints);
    }
    setIsModalVisible(false);
    setIsEnteringPoints(false);
  };

  const handleModalCancel = () => {
    setIsEnteringPoints(false);
    setIsModalVisible(false);
  };

  const removeSubtitleFromQuestion = (index) => {
    setQuestions(prevQuestions => {
      const newQuestions = [...prevQuestions];
      if (newQuestions[index]) {
        const { subtitle, ...rest } = newQuestions[index];
        newQuestions[index] = rest;
      }
      return newQuestions;
    });
    const currentFormQuestions = form.getFieldValue('questions') || [];
    if (currentFormQuestions[index]) {
      const { subtitle, ...rest } = currentFormQuestions[index];
      currentFormQuestions[index] = rest;
      form.setFieldsValue({
        questions: currentFormQuestions
      });
    }
  };

  const moveQuestion = (index, direction) => {
    const newQuestions = [...questions];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < newQuestions.length) {
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
      setQuestions(newQuestions);
      const formQuestions = form.getFieldValue('questions');
      [formQuestions[index], formQuestions[newIndex]] = [formQuestions[newIndex], formQuestions[index]];
      form.setFieldsValue({ questions: formQuestions });
    }
  };

  const handlePointChange = (value, index) => {
    const newQuestions = [...questions];
    if (newQuestions[index]) {
      newQuestions[index] = { ...newQuestions[index], point: value };
      setQuestions(newQuestions);
      const currentFormQuestions = form.getFieldValue('questions') || [];
      currentFormQuestions[index] = { ...currentFormQuestions[index], point: value };
      form.setFieldsValue({ questions: currentFormQuestions });

      const newTotalPoints = newQuestions.reduce((sum, q) => sum + (Number(q.point) || 0), 0);
      setTotalPoints(newTotalPoints);
    }
  };

  const toggleShowRequirement = (index) => {
    setShowRequirement((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const addSubtitleToQuestion = (index) => {
    setQuestions((prevQuestions) => {
      const newQuestions = [...prevQuestions];
      if (!newQuestions[index].subtitle) {
        newQuestions[index] = {
          ...newQuestions[index],
          subtitle: { tieudephieuthem: '', noidungphieuthem: '' },
        };
      }
      return newQuestions;
    });

    const currentFormQuestions = form.getFieldValue('questions') || [];
    if (!currentFormQuestions[index].subtitle) {
      currentFormQuestions[index] = {
        ...currentFormQuestions[index],
        subtitle: { tieudephieuthem: '', noidungphieuthem: '' },
      };
      form.setFieldsValue({ questions: currentFormQuestions });
    }
  };

  const handleImageUpload = async (file, index) => {
    const storageRef = ref(imageDb, `CHECKLISTNISO/${v4()}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
      },
      (error) => {
        console.error('Error uploading image:', error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          const newQuestions = [...questions];
          if (!newQuestions[index].hinhanh) newQuestions[index].hinhanh = [];
          newQuestions[index].hinhanh.push(downloadURL);
          setQuestions(newQuestions);
          form.setFieldsValue({ questions: newQuestions });
        });
      }
    );
  };

  const handleFileUpload = async (file, index) => {
    const storageRef = ref(imageDb, `CHECKLISTNISO/${v4()}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
      },
      (error) => {
        console.error('Error uploading file:', error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          const newQuestions = [...questions];
          if (!newQuestions[index].taptin) newQuestions[index].taptin = [];
          newQuestions[index].taptin.push(downloadURL);
          setQuestions(newQuestions);
          form.setFieldsValue({ questions: newQuestions });
        });
      }
    );
  };

  const removeImage = (index, imageIndex) => {
    const newQuestions = [...questions];
    newQuestions[index].hinhanh.splice(imageIndex, 1);
    setQuestions(newQuestions);
    form.setFieldsValue({ questions: newQuestions });
  };

  const removeBackgroundImage = () => {
    setImg(null);
    setPreviewUrl('');
  };

  const handleImageClick = () => {
    document.getElementById('upload-input').click();
  };

  const getModalTitle = (luachon) => {
    switch (luachon) {
      case 'option1':
        return 'Nhập đáp án tự luận';
      case 'option2':
        return 'Chọn đáp án trắc nghiệm';
      case 'option3':
        return 'Chọn nhiều đáp án';
      default:
        return 'Nhập đáp án';
    }
  };

  const getPlaceholder = (luachon) => {
    switch (luachon) {
      case 'option1':
        return 'Nhập đáp án chi tiết...';
      case 'option2':
        return 'Chọn một đáp án';
      case 'option3':
        return 'Chọn một hoặc nhiều đáp án';
      default:
        return 'Nhập đáp án';
    }
  };

  const handleSelectChange = (value) => {
    const currentQuestions = form.getFieldValue('questions') || [];
    currentQuestions[currentQuestionIndex] = {
      ...currentQuestions[currentQuestionIndex],
      cautraloi: value,
      cautraloimoikhac: '', // Clear cautraloimoikhac when selecting an option
    };
    form.setFieldsValue({ questions: currentQuestions });
  };

  const handleTextAreaChange = (e) => {
    const value = e.target.value;
    const currentQuestions = form.getFieldValue('questions') || [];
    currentQuestions[currentQuestionIndex] = {
      ...currentQuestions[currentQuestionIndex],
      cautraloi: value,
    };
    form.setFieldsValue({ questions: currentQuestions });
  };

  const handleOtherAnswerChange = (e) => {
    const value = e.target.value;
    const currentQuestions = form.getFieldValue('questions') || [];
    currentQuestions[currentQuestionIndex] = {
      ...currentQuestions[currentQuestionIndex],
      cautraloimoikhac: value,
      cautraloi: '', // Clear cautraloi when entering cautraloimoikhac
    };
    form.setFieldsValue({ questions: currentQuestions });
  };

  const isAnswerValid = () => {
    const luachon = form.getFieldValue(['questions', currentQuestionIndex, 'luachon']);
    const cautraloi = form.getFieldValue(['questions', currentQuestionIndex, 'cautraloi']);
    const cautraloimoikhac = form.getFieldValue(['questions', currentQuestionIndex, 'cautraloimoikhac']);
    const point = form.getFieldValue(['questions', currentQuestionIndex, 'point']);

    const hasCautraloi = cautraloi && (
      Array.isArray(cautraloi) ? cautraloi.length > 0 :
        typeof cautraloi === 'string' ? !!cautraloi.trim() : false
    );
    const hasCautraloimoikhac = !!cautraloimoikhac?.trim();
    const hasPoint = point !== undefined && point !== '';

    if (luachon === 'option1') {
      return hasPoint && !!cautraloi?.trim();
    } else if (luachon === 'option2') {
      return hasPoint && ((hasCautraloi && !hasCautraloimoikhac) || (!hasCautraloi && hasCautraloimoikhac));
    } else if (luachon === 'option3') {
      return hasPoint && (hasCautraloi || hasCautraloimoikhac);
    }
    return hasPoint;
  };

  useEffect(() => {
    const formQuestions = form.getFieldValue('questions');
    if (formQuestions && JSON.stringify(formQuestions) !== JSON.stringify(questions)) {
      setQuestions(formQuestions);
    }
  }, [form, questions]);

  if (!hasCreatePermission) {
    return <NotFoundPage />;
  }

  return (
    <div>
      <title>NISO | {t('Create.input1')}</title>
      <div style={{ background: '#fff', position: 'sticky', top: '64px', zIndex: 3 }}>
        <Tabs
          activeKey={activeKey}
          onChange={handleTabChange}
          tabBarExtraContent={
            <>
              <span style={{ marginRight: 15 }}>
                {t('Create.input32')}: {totalPoints}
              </span>
              <Button
                onClick={() => handleSubmit(true)}
                icon={<FileTextOutlined />}
                style={{ marginRight: 10 }}
                loading={isDraftLoading}
                size='middle'
              >
                <span className="btn__niso">{t('Department.input205')}</span>
              </Button>
              <Button
                type="primary"
                size='middle'
                onClick={() => handleSubmit(false)}
                icon={<SendOutlined />}
                loading={isSubmitLoading}
              >
                <span className="btn__niso">{t('Department.input186')}</span>
              </Button>
            </>
          }
          style={{ maxWidth: 800, margin: '0 auto' }}
          className="tab__create__niso tab__mb__niso"
        >
          <Tabs.TabPane tab="Tạo mới" key="create" icon={<PlusCircleOutlined />} />
          <Tabs.TabPane
            tab="Bản nháp"
            key="/auth/docs/list-draft-checklist"
            icon={<FileTextOutlined />}
          />
          <Tabs.TabPane tab="Cài đặt" key="settings" icon={<SettingOutlined />} />
        </Tabs>
      </div>

      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        style={{ maxWidth: 800, margin: '0 auto', paddingTop: 15 }}
        className="padding__mobile__layout__niso"
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div
            style={{ position: 'relative', cursor: 'pointer', maxWidth: 800, margin: '0 auto' }}
            onClick={handleImageClick}
          >
            <img src={previewUrl || Nen} alt="background" className="img__niso__create" />
            {!previewUrl && (
              <div
                style={{
                  position: 'absolute',
                  top: '60%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '5px',
                }}
                className="im__niso__ly"
              >
                {t('Department.input206')}
              </div>
            )}
            {previewUrl && (
              <Button
                onClick={removeBackgroundImage}
                icon={<CloseOutlined />}
                type="primary"
                danger
                style={{ position: 'absolute', top: 5, right: 5 }}
              />
            )}
          </div>
          <input
            type="file"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="upload-input"
            accept="image/*"
            disabled={isUploading}
          />
          {isUploading && <Progress percent={uploadProgress} />}
        </div>
        <Title form={form} checkExistingTitle={checkExistingTitle} totalPoints={totalPoints} t={t} />
        <Form.List name="questions">
          {(fields, { remove }) => (
            <>
              {fields.map((field, index) => (
                questions[index] && (
                  <React.Fragment key={field.key}>
                    {questions[index]?.subtitle && (
                      <Container
                        css="border-left-niso"
                        content={
                          <>
                            <Form.Item
                              name={[field.name, 'subtitle', 'tieudephieuthem']}
                              label={t('Department.input207')}
                            >
                              <Input />
                            </Form.Item>
                            <Form.Item
                              name={[field.name, 'subtitle', 'noidungphieuthem']}
                              label={t('Department.input208')}
                            >
                              <CKEditor
                                editor={ClassicEditor}
                                data={form.getFieldValue(['questions', field.name, 'subtitle', 'noidungphieuthem']) || ''}
                                config={{
                                  placeholder: `${t('Create.input14')}`,
                                }}
                                onChange={(event, editor) => {
                                  const data = editor.getData();
                                  const currentQuestions = form.getFieldValue('questions');
                                  const updatedQuestions = currentQuestions.map((q, i) => {
                                    if (i === index) {
                                      return {
                                        ...q,
                                        subtitle: {
                                          ...q.subtitle,
                                          noidungphieuthem: data
                                        }
                                      };
                                    }
                                    return q;
                                  });
                                  form.setFieldsValue({ questions: updatedQuestions });
                                  setQuestions(updatedQuestions);
                                }}
                              />
                            </Form.Item>
                            <Button onClick={() => removeSubtitleFromQuestion(index)} type='primary' danger>
                              Xóa
                            </Button>
                          </>
                        }
                      />
                    )}
                    <Container
                      content={
                        <>
                          <Form.Item
                            name={[field.name, 'question']}
                            fieldKey={[field.fieldKey, 'question']}
                            rules={[{ required: true, message: t('Department.input209') }]}
                          >
                            <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 15 }}>
                              <span>{t('Department.input211')} {index + 1} - {t('Input.input9')}: {questions[index]?.point || 0}</span>
                              <Button onClick={() => toggleShowRequirement(index)}>
                                {showRequirement[index] ? 'Ẩn yêu cầu câu hỏi' : 'Thêm yêu cầu câu hỏi'}
                              </Button>
                            </Space>
                            <CKEditor
                              editor={ClassicEditor}
                              data={form.getFieldValue(['questions', field.name, 'question']) || ''}
                              onChange={(event, editor) => {
                                const data = editor.getData();
                                form.setFieldsValue({
                                  questions: form.getFieldValue('questions').map((q, i) => {
                                    if (i === index) {
                                      return { ...q, question: data };
                                    }
                                    return q;
                                  })
                                });
                              }}
                            />
                          </Form.Item>
                          {showRequirement[index] && (
                            <Form.Item
                              name={[field.name, 'yeu_cau']}
                              label={t('Department.input217')}
                            >
                              <CKEditor
                                editor={ClassicEditor}
                                data={form.getFieldValue(['questions', field.name, 'yeu_cau']) || ''}
                                onChange={(event, editor) => {
                                  const data = editor.getData();
                                  form.setFieldsValue({
                                    questions: form.getFieldValue('questions').map((q, i) => {
                                      if (i === index) return { ...q, yeu_cau: data };
                                      return q;
                                    }),
                                  });
                                }}
                              />
                            </Form.Item>
                          )}

                          <Form.Item
                            name={[field.name, 'luachon']}
                            label={t('Department.input212')}
                            fieldKey={[field.fieldKey, 'luachon']}
                            style={{ marginBottom: 10 }}
                            rules={[{ required: true, message: t('Department.input213') }]}
                          >
                            <Select
                              placeholder={t('Create.input8')}
                              onChange={(value) => {
                                const newQuestions = [...questions];
                                newQuestions[index] = { ...newQuestions[index], luachon: value };
                                setQuestions(newQuestions);
                              }}
                            >
                              <Option value="option0">{t('Create.input9')}</Option>
                              <Option value="option1">{t('Create.input10')}</Option>
                              <Option value="option2">{t('Create.input11')}</Option>
                              <Option value="option3">{t('Create.input12')}</Option>
                              <Option value="option4">{t('Create.input13')}</Option>
                            </Select>
                          </Form.Item>
                          <Form.Item shouldUpdate>
                            {({ getFieldValue }) => {
                              const luachon = getFieldValue(['questions', field.name, 'luachon']);
                              if (luachon === 'option0') {
                                return (
                                  <Option0 t={t} field={field} questions={questions} index={index} setQuestions={setQuestions} form={form} />
                                );
                              } else if (luachon === 'option1') {
                                return (
                                  <Option1 t={t} />
                                );
                              } else if (luachon === 'option2' || luachon === 'option3') {
                                return (
                                  <Option23 t={t} luachon={luachon} field={field} setShowOtherOption={setShowOtherOption} form={form} showOtherOption={showOtherOption} />
                                );
                              } else if (luachon === 'option4') {
                                return (
                                  <Option4 t={t} field={field} form={form} />
                                );
                              } else if (luachon === 'option5') {
                                return (
                                  <Option5 t={t} removeImage={removeImage} index={index} field={field} handleImageUpload={handleImageUpload} questions={questions} />
                                );
                              } else if (luachon === 'option6') {
                                return (
                                  <Option6 t={t} index={index} field={field} handleFileUpload={handleFileUpload} />
                                );
                              }
                              return null;
                            }}
                          </Form.Item>
                          <Divider />
                          <Space direction='horizontal' style={{ flexWrap: 'wrap' }}>
                            {form.getFieldValue(['questions', field.name, 'luachon']) &&
                              form.getFieldValue(['questions', field.name, 'luachon']) !== 'option0' && (
                                <Form.Item
                                  name={[field.name, 'cauhoibatbuoc']}
                                  valuePropName="checked"
                                  initialValue={false}
                                  style={{ marginBottom: 0 }}
                                >
                                  <Space>
                                    <Switch
                                      checkedChildren='Câu hỏi bắt buộc (Đang bật)' unCheckedChildren='Câu hỏi bắt buộc (Đã tắt)'
                                      onChange={(checked) => {
                                        const currentQuestions = form.getFieldValue('questions');
                                        const updatedQuestions = currentQuestions.map((q, i) => {
                                          if (i === index) {
                                            return { ...q, cauhoibatbuoc: checked };
                                          }
                                          return q;
                                        });
                                        form.setFieldsValue({ questions: updatedQuestions });
                                        setQuestions(updatedQuestions);
                                      }}
                                    />
                                  </Space>
                                </Form.Item>
                              )}
                            <Form.Item
                              name={[field.name, 'batxuly']}
                              valuePropName="checked"
                              initialValue={false}
                              style={{ marginBottom: 0 }}
                            >
                              <Space>
                                <Switch
                                  checkedChildren='Đang hiện nút nhận xử lý (sau phản hồi)' unCheckedChildren='Đã ẩn nút nhận xử lý (sau phản hồi)'
                                  onChange={(checked) => {
                                    const currentQuestions = form.getFieldValue('questions');
                                    const updatedQuestions = currentQuestions.map((q, i) => {
                                      if (i === index) {
                                        return { ...q, batxuly: checked };
                                      }
                                      return q;
                                    });
                                    form.setFieldsValue({ questions: updatedQuestions });
                                    setQuestions(updatedQuestions);
                                  }}
                                />
                              </Space>
                            </Form.Item>
                          </Space>
                        </>
                      }
                    />
                    <Container
                      content={
                        <Space style={{ flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' }}>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <Button onClick={() => showModal(index)}>
                              {['option1', 'option2', 'option3'].includes(form.getFieldValue(['questions', index, 'luachon']))
                                ? 'Nhập điểm và đáp án'
                                : t('Input.input15')
                              }
                            </Button>
                            <Button onClick={() => addSubtitleToQuestion(index)}>
                              {t('Department.input214')}
                            </Button>
                            <Button onClick={() => {
                              remove(field.name);
                              const newQuestions = questions.filter((_, i) => i !== index);
                              setQuestions(newQuestions);
                              setTotalPoints(newQuestions.reduce((sum, q) => sum + (q.point || 0), 0));
                            }} danger>
                              {t('Department.input215')}
                            </Button>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <Button
                              shape='circle'
                              onClick={() => moveQuestion(index, -1)}
                              disabled={index === 0}
                              icon={<UpOutlined />}
                            />
                            <Button
                              shape='circle'
                              onClick={() => moveQuestion(index, 1)}
                              disabled={index === fields.length - 1}
                              icon={<DownOutlined />}
                            />
                          </div>
                        </Space>
                      }
                    />
                  </React.Fragment>
                )
              ))}
            </>
          )}
        </Form.List>
        <Container
          content={
            <Button
              type="dashed"
              onClick={() => {
                const newQuestion = { question: '', luachon: undefined };
                setQuestions((prevQuestions) => [...prevQuestions, newQuestion]);
                const currentQuestions = form.getFieldValue('questions') || [];
                form.setFieldsValue({ questions: [...currentQuestions, newQuestion] });
              }}
              icon={<PlusOutlined />}
              disabled={isEnteringPoints}
              style={{ width: '100%' }}
            >
              {t('Create.input36')}
            </Button>
          }
        />
      </Form>
      <Modal
        title={
          <Space align="center">
            <AntTitle level={4} style={{ margin: 0 }}>
              {currentQuestionIndex !== null &&
                getModalTitle(form.getFieldValue(['questions', currentQuestionIndex, 'luachon']))}
            </AntTitle>
            {isAnswerValid() ? (
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
            )}
          </Space>
        }
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        footer={[
          <Button key="back" onClick={handleModalCancel}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={handleModalOk} disabled={!isAnswerValid()}>
            Xác nhận
          </Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Form.Item
            name={['questions', currentQuestionIndex, 'point']}
            label={<Text strong style={{ fontSize: '16px' }}>Điểm</Text>}
            rules={[{ required: true, message: t('Department.input220') }]}
            labelCol={{ span: 24 }}
            wrapperCol={{ span: 24 }}
            style={{ marginBottom: 16 }}
          >
            <Input
              type="number"
              onChange={(e) => {
                if (currentQuestionIndex !== null && questions[currentQuestionIndex]) {
                  handlePointChange(e.target.value, currentQuestionIndex);
                }
              }}
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
          {['option1', 'option2', 'option3'].includes(
            form.getFieldValue(['questions', currentQuestionIndex, 'luachon'])
          ) && (
              <Form.Item
                label={<Text strong style={{ fontSize: '16px' }}>Đáp án</Text>}
                rules={[{ required: true, message: t('Department.input221') }]}
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                style={{ marginBottom: 0 }}
              >
                {form.getFieldValue(['questions', currentQuestionIndex, 'luachon']) === 'option1' ? (
                  <TextArea
                    rows={4}
                    placeholder={getPlaceholder('option1')}
                    onChange={handleTextAreaChange}
                    style={{
                      borderRadius: '8px',
                      resize: 'none',
                      padding: '12px',
                      fontSize: '14px',
                      borderColor: isAnswerValid() ? '#d9d9d9' : '#ff4d4f',
                    }}
                  />
                ) : form.getFieldValue(['questions', currentQuestionIndex, 'luachon']) === 'option2' ? (
                  <Select
                    placeholder={getPlaceholder('option2')}
                    style={{ width: '100%' }}
                    value={form.getFieldValue(['questions', currentQuestionIndex, 'cautraloi'])}
                    onChange={handleSelectChange}
                    dropdownStyle={{ borderRadius: '8px' }}
                    optionLabelProp="label"
                    allowClear
                  >
                    {form
                      .getFieldValue(['questions', currentQuestionIndex, 'options'])
                      ?.filter((option) => option.tuychon && option.tuychon.trim())
                      .map((option, index) => (
                        <Option
                          key={index}
                          value={option.tuychon}
                          label={option.tuychon}
                        >
                          <Space>
                            <Text>{option.tuychon}</Text>
                          </Space>
                        </Option>
                      ))}
                  </Select>
                ) : (
                  <Select
                    mode="multiple"
                    placeholder={getPlaceholder('option3')}
                    style={{ width: '100%' }}
                    value={form.getFieldValue(['questions', currentQuestionIndex, 'cautraloi']) || []}
                    onChange={handleSelectChange}
                    dropdownStyle={{ borderRadius: '8px' }}
                    optionLabelProp="label"
                    allowClear
                  >
                    {form
                      .getFieldValue(['questions', currentQuestionIndex, 'options'])
                      ?.filter((option) => option.tuychonnhieu && option.tuychonnhieu.trim())
                      .map((option, index) => (
                        <Option
                          key={index}
                          value={option.tuychonnhieu}
                          label={option.tuychonnhieu}
                        >
                          <Space>
                            <Text>{option.tuychonnhieu}</Text>
                          </Space>
                        </Option>
                      ))}
                  </Select>
                )}
              </Form.Item>
            )}
          {(form.getFieldValue(['questions', currentQuestionIndex, 'luachon']) === 'option2' ||
            form.getFieldValue(['questions', currentQuestionIndex, 'luachon']) === 'option3') &&
            form.getFieldValue(['questions', currentQuestionIndex, 'tuychonkhac']) && (
              <>
                <Divider style={{ marginTop: '16px', marginBottom: '8px' }} />
                <Form.Item
                  name={['questions', currentQuestionIndex, 'cautraloimoikhac']}
                  label={<Text strong style={{ fontSize: '16px' }}>Đáp án khác</Text>}
                  style={{ margin: 0 }}
                  labelCol={{ span: 24 }}
                  wrapperCol={{ span: 24 }}
                >
                  <Input
                    placeholder="Nhập đáp án khác..."
                    onChange={handleOtherAnswerChange}
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Item>
                <Text type="secondary" style={{ marginTop: 8 }}>
                  {form.getFieldValue(['questions', currentQuestionIndex, 'luachon']) === 'option2'
                    ? 'Lưu ý: Đảm bảo đáp án khác không trùng với các tùy chọn đã có và chỉ được chọn 1 trong 2.'
                    : 'Lưu ý: Có thể chọn cả tùy chọn và nhập đáp án khác.'}
                </Text>
              </>
            )}
        </div>
      </Modal>
      <Drawer
        closeIcon={false}
        open={isSettingsModalVisible}
        onClose={() => setIsSettingsModalVisible(false)}
        width={800}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button key="back" onClick={() => setIsSettingsModalVisible(false)} type="primary">
              Xác nhận
            </Button>
          </div>
        }
      >
        <SettingCreate
          handleSubmit={handleSubmit}
          form={form}
          t={t}
          handleEveryquyenChange={handleEveryquyenChange}
          setKhachEnabled={setKhachEnabled}
          setDemEnabled={setDemEnabled}
          setXulyEnabled={setXulyEnabled}
          setCuahang={setCuahang}
          setllEnabled={setllEnabled}
          setSQLEnabled={setSQLEnabled}
          setthreeimg={setthreeimg}
          setUsersview={setUsersview}
          setDepartmentsview={setDepartmentsview}
          setRestaurantsview={setRestaurantsview}
          setViewDapanEnabled={setViewDapanEnabled}
          bophanData={[]}
          dataUser={accountOptions}
          handleUserSearch={handleUserSearch}
          handleDeptSearch={handleDeptSearch}
          handleShopSearch={handleShopSearch}
        />
      </Drawer>
    </div>
  );
};

export default Create;