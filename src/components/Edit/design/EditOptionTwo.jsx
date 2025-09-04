import { Form, Button, Input, Space, Radio } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

export function EditOptionTwo({showModal, index, options, tuychonkhac, setDocData, form}) {
  return (
    <Form.List name={['questions', index, 'options']}>
      {(fields, { add, remove }) => (
        <>
          <Form.Item name={['questions', index, 'cautraloi']}>
            <Radio.Group
              style={{ display: 'flex', flexDirection: 'column', gap: 5 }}
              value={options.findIndex(opt => opt?.isCorrect) !== -1 ? options.find(opt => opt?.isCorrect)?.tuychon || options.findIndex(opt => opt?.isCorrect) : undefined}
            >
              {fields.map((field, optIndex) => (
                <Space key={field.key} align="baseline">
                  <Radio
                    value={options[optIndex]?.tuychon || optIndex}
                    disabled
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions.forEach(opt => {
                        if (opt) opt.isCorrect = false;
                      });
                      if (newOptions[optIndex]) {
                        newOptions[optIndex].isCorrect = true;
                        setDocData(prev => {
                          const newQuestions = [...prev.questions];
                          newQuestions[index].options = newOptions;
                          return { ...prev, questions: newQuestions };
                        });
                        form.setFieldsValue({
                          questions: {
                            [index]: {
                              options: newOptions,
                              cautraloi: newOptions[optIndex].tuychon || optIndex
                            }
                          }
                        });
                      }
                    }}
                  >
                    <Form.Item name={[field.name, 'tuychon']} fieldKey={[field.fieldKey, 'tuychon']} noStyle>
                      <Input 
                        placeholder={`Tùy chọn ${optIndex + 1}`} 
                        onChange={(e) => {
                          const value = e.target.value;
                          const newOptions = [...options];
                          if (!newOptions[optIndex]) {
                            newOptions[optIndex] = {};
                          }
                          newOptions[optIndex].tuychon = value;
                          
                          setDocData(prev => {
                            const newQuestions = [...prev.questions];
                            newQuestions[index].options = newOptions;
                            return { ...prev, questions: newQuestions };
                          });
                          
                          // Cập nhật giá trị trong form
                          const currentOptions = form.getFieldValue(['questions', index, 'options']) || [];
                          currentOptions[optIndex] = { ...currentOptions[optIndex], tuychon: value };
                          form.setFieldsValue({
                            questions: {
                              [index]: {
                                options: currentOptions
                              }
                            }
                          });
                        }}
                      />
                    </Form.Item>
                  </Radio>
                  <Button
                    icon={<DeleteOutlined />}
                    shape='circle'
                    onClick={() => remove(field.name)}
                    danger
                  />
                </Space>
              ))}
              {tuychonkhac && (
                <Space align="baseline">
                  <Radio value="other" disabled>
                    <span style={{ color: 'rgba(0, 0, 0, 0.88)' }}>Đáp án khác...</span>
                  </Radio>
                  {tuychonkhac && (
                    <Button
                      icon={<DeleteOutlined />}
                      shape='circle'
                      onClick={() => {
                        setDocData(prev => {
                          const newQuestions = [...prev.questions];
                          newQuestions[index].tuychonkhac = false;
                          return { ...prev, questions: newQuestions };
                        });
                        form.setFieldsValue({
                          questions: { [index]: { tuychonkhac: false, otherAnswer: undefined } }
                        });
                      }}
                      danger
                    />
                  )}
                </Space>
              )}
            </Radio.Group>
          </Form.Item>
          <Space wrap>
            <Button type="dashed" onClick={() => add({ tuychon: '', isCorrect: false })} icon={<PlusOutlined />}>
              Thêm tùy chọn
            </Button>
            <Button
              type="dashed"
              onClick={() => {
                setDocData(prev => {
                  const newQuestions = [...prev.questions];
                  newQuestions[index].tuychonkhac = true;
                  return { ...prev, questions: newQuestions };
                });
                form.setFieldsValue({
                  questions: { [index]: { tuychonkhac: true } }
                });
              }}
              disabled={tuychonkhac}
              icon={<PlusOutlined />}
            >
              Thêm đáp án khác
            </Button>
            <Button onClick={() => showModal(index)}>Nhập đáp án</Button>
          </Space>
        </>
      )}
    </Form.List>
  );
}