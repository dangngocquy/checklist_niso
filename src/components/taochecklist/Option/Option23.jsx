import React from 'react';
import { Input, Form, Space, Button, Radio, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const Option23 = React.memo(({ luachon, field, showOtherOption, setShowOtherOption, form, t }) => {
  return (
    <Form.List name={[field.name, 'options']}>
      {(optionFields, { add: addOption, remove: removeOption }) => (
        <>
          {optionFields.map((optionField, optionIndex) => (
            <Space key={optionField.key} style={{ display: 'flex' }} align="baseline">
              {luachon === 'option2' ? <Radio disabled /> : <Checkbox disabled />}
              <Form.Item
                {...optionField}
                name={[optionField.name, luachon === 'option2' ? 'tuychon' : 'tuychonnhieu']}
                fieldKey={[optionField.fieldKey, luachon === 'option2' ? 'tuychon' : 'tuychonnhieu']}
                rules={[{ required: true, message: t('ListEdits.input36') }]}
                style={{margin: 5}}
              >
                <Input placeholder={`${t('Department.input187')} ${optionIndex + 1}`} />
              </Form.Item>
              <Button
                onClick={() => removeOption(optionField.name)}
                shape="circle"
                icon={<DeleteOutlined />}
                danger
              />
            </Space>
          ))}
          {showOtherOption[field.name] && (
            <Form.Item style={{margin: 5}}>
              <Space align="baseline">
                {luachon === 'option2' ? <Radio disabled /> : <Checkbox disabled />}
                <Input placeholder={t('Create.input18')} disabled />
                <Button
                  onClick={() => {
                    setShowOtherOption((prev) => ({ ...prev, [field.name]: false }));
                    form.setFieldsValue({
                      questions: form.getFieldValue('questions').map((q, i) => {
                        if (i === field.name) {
                          return { ...q, tuychonkhac: false };
                        }
                        return q;
                      }),
                    });
                  }}
                  icon={<DeleteOutlined />}
                  danger
                  shape="circle"
                />
              </Space>
            </Form.Item>
          )}
          <Form.Item style={{ marginBottom: 0, marginTop: 10 }}>
            <Space>
              <Button type="dashed" onClick={() => addOption()} icon={<PlusOutlined />}>
                {t('Department.input232')}
              </Button>
              <Button
                type="dashed"
                onClick={() => {
                  setShowOtherOption((prev) => ({ ...prev, [field.name]: true }));
                  form.setFieldsValue({
                    questions: form.getFieldValue('questions').map((q, i) => {
                      if (i === field.name) {
                        return { ...q, tuychonkhac: true };
                      }
                      return q;
                    }),
                  });
                }}
                disabled={showOtherOption[field.name]}
              >
                {t('Department.input233')}
              </Button>
            </Space>
          </Form.Item>
        </>
      )}
    </Form.List>
  );
});

export default Option23;
