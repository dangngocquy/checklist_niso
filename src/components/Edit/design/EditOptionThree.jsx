import { Form, Button, Input, Space, Checkbox } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

export function EditOptionThree({showModal, index, options, tuychonkhac, setDocData, form}) {
  return (
    <Form.List name={['questions', index, 'options']}>
      {(fields, { add, remove }) => (
        <>
          <Form.Item name={['questions', index, 'cautraloi']}>
            <Checkbox.Group
              disabled
              style={{ display: 'flex', flexDirection: 'column', gap: 5 }}
              onChange={(checkedValues) => {
                const newOptions = [...options];
                newOptions.forEach(opt => {
                  if (opt) opt.isCorrect = checkedValues.includes(opt.tuychonnhieu || options.indexOf(opt));
                });
                setDocData(prev => {
                  const newQuestions = [...prev.questions];
                  newQuestions[index].options = newOptions;
                  return { ...prev, questions: newQuestions };
                });
                form.setFieldsValue({
                  questions: {
                    [index]: {
                      options: newOptions,
                      cautraloi: checkedValues
                    }
                  }
                });
              }}
              value={options.filter(opt => opt?.isCorrect).map(opt => opt?.tuychonnhieu || options.indexOf(opt))}
            >
              {fields.map((field, optIndex) => (
                <Space key={field.key} align="baseline">
                  <Checkbox
                    disabled
                    value={options[optIndex]?.tuychonnhieu || optIndex}
                    onChange={(e) => {
                      const newOptions = [...options];
                      if (newOptions[optIndex]) {
                        newOptions[optIndex].isCorrect = e.target.checked;
                        setDocData(prev => {
                          const newQuestions = [...prev.questions];
                          newQuestions[index].options = newOptions;
                          return { ...prev, questions: newQuestions };
                        });
                        form.setFieldsValue({
                          questions: {
                            [index]: {
                              options: newOptions,
                              cautraloi: newOptions.filter(opt => opt?.isCorrect).map(opt => opt?.tuychonnhieu || options.indexOf(opt))
                            }
                          }
                        });
                      }
                    }}
                  >
                    <Form.Item name={[field.name, 'tuychonnhieu']} fieldKey={[field.fieldKey, 'tuychonnhieu']} noStyle>
                      <Input 
                        placeholder={`Tùy chọn ${optIndex + 1}`} 
                        onChange={(e) => {
                          const value = e.target.value;
                          const newOptions = [...options];
                          if (!newOptions[optIndex]) {
                            newOptions[optIndex] = {};
                          }
                          newOptions[optIndex].tuychonnhieu = value;
                          
                          setDocData(prev => {
                            const newQuestions = [...prev.questions];
                            newQuestions[index].options = newOptions;
                            return { ...prev, questions: newQuestions };
                          });
                          
                          // Cập nhật giá trị trong form
                          const currentOptions = form.getFieldValue(['questions', index, 'options']) || [];
                          currentOptions[optIndex] = { ...currentOptions[optIndex], tuychonnhieu: value };
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
                  </Checkbox>
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
                  <Checkbox value="other" disabled>
                    <span style={{ color: 'rgba(0, 0, 0, 0.88)' }}>Đáp án khác...</span>
                  </Checkbox>
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
            </Checkbox.Group>
          </Form.Item>
          <Space>
            <Button type="dashed" onClick={() => add({ tuychonnhieu: '', isCorrect: false })} icon={<PlusOutlined />}>
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