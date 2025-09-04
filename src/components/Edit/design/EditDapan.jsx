import { Button, Select, Input, Form, Modal, Typography, Space, Divider, message } from "antd";
import { useEffect, useState } from "react";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Title, Text } = Typography;

export function EditDapan({ currentQuestionIndex, form, isModalVisible, handleModalOk, handleModalCancel }) {
  const [questionType, setQuestionType] = useState('');
  const [options, setOptions] = useState([]);
  const [tuychonkhac, setTuychonkhac] = useState(false);
  const [cautraloi, setCautraloi] = useState(''); // Can be string or array
  const [cautraloimoikhac, setCautraloimoikhac] = useState('');
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (currentQuestionIndex !== null) {
      const currentQuestion = form.getFieldValue(['questions', currentQuestionIndex]);
      const luachon = currentQuestion?.luachon;

      if (luachon === 'option1') {
        setQuestionType('option1');
      } else if (luachon === 'option2') {
        setQuestionType('option2');
      } else if (luachon === 'option3') {
        setQuestionType('option3');
      }

      setOptions(currentQuestion?.options || []);
      setTuychonkhac(currentQuestion?.tuychonkhac || false);
      // Handle cautraloi as array or string
      setCautraloi(currentQuestion?.cautraloi || '');
      setCautraloimoikhac(currentQuestion?.cautraloimoikhac || '');
    }
  }, [currentQuestionIndex, form, isModalVisible]);

  useEffect(() => {
    if (questionType === 'option1') {
      setIsValid(!!cautraloi?.trim());
    } else if (questionType === 'option2') {
      // Valid if cautraloi is a non-empty string, a non-empty array, or cautraloimoikhac is provided
      const hasCautraloi = cautraloi && (
        Array.isArray(cautraloi) ? cautraloi.length > 0 :
        typeof cautraloi === 'string' ? !!cautraloi.trim() : false
      );
      const hasCautraloimoikhac = !!cautraloimoikhac?.trim();
      // For option2, valid if exactly one of cautraloi or cautraloimoikhac is provided
      setIsValid((hasCautraloi && !hasCautraloimoikhac) || (!hasCautraloi && hasCautraloimoikhac));
    } else if (questionType === 'option3') {
      const hasCautraloi = cautraloi && (Array.isArray(cautraloi) ? cautraloi.length > 0 : false);
      const hasCautraloimoikhac = !!cautraloimoikhac?.trim();
      setIsValid(hasCautraloi || hasCautraloimoikhac);
    }
  }, [cautraloi, cautraloimoikhac, questionType]);

  const handleSelectChange = (value) => {
    // For option2, always set cautraloi as a single string when a new selection is made
    form.setFieldsValue({
      questions: {
        [currentQuestionIndex]: {
          cautraloi: value,
        },
      },
    });
    setCautraloi(value);
  };

  const handleTextAreaChange = (e) => {
    const value = e.target.value;
    form.setFieldsValue({
      questions: {
        [currentQuestionIndex]: {
          cautraloi: value,
        },
      },
    });
    setCautraloi(value);
  };

  const handleOtherAnswerChange = (e) => {
    const value = e.target.value;
    form.setFieldsValue({
      questions: {
        [currentQuestionIndex]: {
          cautraloimoikhac: value,
        },
      },
    });
    setCautraloimoikhac(value);
  };

  const getModalTitle = () => {
    switch (questionType) {
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

  const getPlaceholder = () => {
    switch (questionType) {
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

  const onModalOk = () => {
    const hasCautraloi = cautraloi && (
      Array.isArray(cautraloi) ? cautraloi.length > 0 :
      typeof cautraloi === 'string' ? !!cautraloi.trim() : false
    );
    const hasCautraloimoikhac = !!cautraloimoikhac?.trim();

    if (questionType === 'option2' && hasCautraloi && hasCautraloimoikhac) {
      message.error('Vui lòng chỉ chọn đáp án từ danh sách hoặc nhập đáp án khác, không chọn cả hai!');
      return;
    }

    if ((questionType === 'option1' || questionType === 'option2') && !hasCautraloi && !hasCautraloimoikhac) {
      message.error('Vui lòng chọn hoặc nhập ít nhất một đáp án!');
      return;
    }

    if (questionType === 'option3' && !hasCautraloi && !hasCautraloimoikhac) {
      message.error('Vui lòng chọn hoặc nhập ít nhất một đáp án!');
      return;
    }

    handleModalOk();
  };

  return (
    <Modal
      title={
        <Space align="center">
          <Title level={4} style={{ margin: 0 }}>{getModalTitle()}</Title>
          {isValid ? (
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
          ) : (
            <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
          )}
        </Space>
      }
      open={isModalVisible}
      onOk={onModalOk}
      onCancel={handleModalCancel}
      width={600}
      footer={[
        <Button key="back" onClick={handleModalCancel}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" onClick={onModalOk} disabled={!isValid}>
          Xác nhận
        </Button>,
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Form.Item
          label={<Text strong style={{ fontSize: '16px' }}>Đáp án</Text>}
          rules={[{ required: true, message: 'Vui lòng chọn hoặc nhập đáp án!' }]}
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
          style={{ marginBottom: 0 }}
        >
          {questionType === 'option1' ? (
            <TextArea
              rows={4}
              placeholder={getPlaceholder()}
              value={cautraloi}
              onChange={handleTextAreaChange}
              style={{
                borderRadius: '8px',
                resize: 'none',
                padding: '12px',
                fontSize: '14px',
                borderColor: isValid ? '#d9d9d9' : '#ff4d4f',
              }}
            />
          ) : questionType === 'option2' ? (
            <Select
              placeholder={getPlaceholder()}
              style={{ width: '100%' }}
              // Display the first element if cautraloi is an array, otherwise the string
              value={Array.isArray(cautraloi) ? cautraloi[0] : cautraloi}
              onChange={handleSelectChange}
              dropdownStyle={{ borderRadius: '8px' }}
              optionLabelProp="label"
              allowClear
            >
              {options
                .filter((option) => option.tuychon && option.tuychon.trim()) // Only include options with valid tuychon
                .map((option, index) => (
                  <Select.Option
                    key={index}
                    value={option.tuychon}
                    label={option.tuychon}
                  >
                    <Space>
                      <Text>{option.tuychon}</Text>
                    </Space>
                  </Select.Option>
                ))}
            </Select>
          ) : questionType === 'option3' ? (
            <Select
              mode="multiple"
              placeholder={getPlaceholder()}
              style={{ width: '100%' }}
              value={Array.isArray(cautraloi) ? cautraloi : []}
              onChange={handleSelectChange}
              dropdownStyle={{ borderRadius: '8px' }}
              optionLabelProp="label"
              allowClear
            >
              {options
                .filter((option) => option.tuychonnhieu && option.tuychonnhieu.trim()) // Only include options with valid tuychonnhieu
                .map((option, index) => (
                  <Select.Option
                    key={index}
                    value={option.tuychonnhieu}
                    label={option.tuychonnhieu}
                  >
                    <Space>
                      <Text>{option.tuychonnhieu}</Text>
                    </Space>
                  </Select.Option>
                ))}
            </Select>
          ) : null}
        </Form.Item>

        {(questionType === 'option2' || questionType === 'option3') && tuychonkhac && (
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
                value={cautraloimoikhac}
                onChange={handleOtherAnswerChange}
              />
            </Form.Item>
            <Text type="secondary" style={{ marginTop: 8 }}>
              {questionType === 'option2'
                ? 'Lưu ý: Đảm bảo đáp án khác không trùng với các tùy chọn đã có và chỉ được chọn 1 trong 2.'
                : 'Lưu ý: Có thể chọn cả tùy chọn và nhập đáp án khác.'}
            </Text>
          </>
        )}
      </div>
    </Modal>
  );
}